"""The Data agent and the Watcher: backend-api's synthetic DMS exports (services/journey/dms.py's layouts) loaded into
BigQuery, the stock reported, and the sell-through the Watcher reads back."""

import math
from datetime import date, timedelta

from tests.conftest import STORY, C, message

DAY0 = date(2026, 10, 2)
STOCK = "distributor_name,item_code,batch_no,mfg_date,bb_date,closing_qty,location,pin"
SALES = "distributor_id,pin,item_code,sale_date,qty,value_inr"


def stock_csv() -> bytes:
    rows = [STOCK]
    for b in STORY["batches"]:
        d = STORY["distributors"][b["distributor"]]
        sku = STORY["skus"][b["sku"]]
        pin = d["pins"].split(",")[0].strip() + "008"
        rows.append(
            f"{d['name']},{sku['code']},{b['id']},{b['mfg']},{b['bestBefore']},{b['units']},{d['godown']},{pin}"
        )
    return ("\n".join(rows) + "\n").encode()


def sales_csv(days: list[date], start: date) -> bytes:
    """as dms.sales_rows: each distributor's daily sales of an SKU add up to its batches' rates"""
    rows = [SALES]
    rates: dict[tuple[str, str], float] = {}
    for b in STORY["batches"]:
        rates[(b["distributor"], b["sku"])] = rates.get((b["distributor"], b["sku"]), 0) + b["sellPerDay"]
    for day in days:
        n = (day - start).days
        for (dist, sku), rate in sorted(rates.items()):
            qty = math.floor(rate * (n + 1)) - math.floor(rate * n)
            code = STORY["skus"][sku]["code"]
            pin = STORY["distributors"][dist]["pins"].split(",")[0].strip() + "001"
            if qty:
                rows.append(f"{dist},{pin},{code},{day.isoformat()},{qty},{qty * 20}")
    return ("\n".join(rows) + "\n").encode()


def put(store, name: str, data: bytes) -> str:
    store.objects[("exports-test", name)] = data
    return f"gs://exports-test/{name}"


async def test_the_backfill_loads_sales_and_reports_nothing(run, backend, store, warehouse):
    start = DAY0 - timedelta(days=90)
    f = put(
        store,
        "munchly/backfill/sales-backfill-2026-10-02.csv",
        sales_csv([start + timedelta(days=i) for i in range(90)], start),
    )
    outcome, rc = await run(message("journey.step", {"type": "export.uploaded", "file": f, "backfill": True}))
    assert outcome == "done"
    assert backend.reports() == []
    sales = warehouse.tables["secondary_sales"]
    assert {r["sale_date"] for r in sales} == {(start + timedelta(days=i)).isoformat() for i in range(90)}
    assert {r["sku_id"] for r in sales} >= {"chips", "mango"} and all(r["source_file"] == f for r in sales)
    assert rc.requests == []  # a saved map: no model call


async def test_the_daily_run_loads_stock_and_sales_and_reports_the_stock(run, backend, store, warehouse):
    start = DAY0 - timedelta(days=90)
    put(
        store,
        "munchly/backfill/sales-backfill-2026-10-02.csv",
        sales_csv([start + timedelta(days=i) for i in range(90)], start),
    )
    await run(
        message(
            "journey.step",
            {
                "type": "export.uploaded",
                "file": "gs://exports-test/munchly/backfill/sales-backfill-2026-10-02.csv",
                "backfill": True,
            },
        )
    )
    files = [
        put(store, "munchly/2026-10-02/stock-2026-10-02.csv", stock_csv()),
        put(store, "munchly/2026-10-02/sales-2026-10-02.csv", sales_csv([DAY0], start)),
    ]
    outcome, rc = await run(
        message(
            "journey.step", {"type": "agent.due", "agent": "data", "day": "2026-10-02", "files": files}, event_id="ev_d"
        )
    )
    body = backend.report("/exports")
    assert body["run"]["agent"] == "data" and body["run"]["eventKey"] == "ev_d:data"
    assert body["mapped"] == 8 and body["rows"] == 9 and body["days"] == 91 and body["file"] == "stock-2026-10-02.csv"
    hero = next(b for b in body["batches"] if b["ref"] == "MF-2409-117")
    assert hero == {
        "ref": "MF-2409-117",
        "sku": "chips",
        "distributor": "rakesh",
        "units": 1840,
        "mfg": "2026-05-18",
        "bestBefore": "2026-11-18",
    }
    assert len(body["batches"]) == 9
    snap = warehouse.tables["stock_snapshots"]
    assert len(snap) == 9 and {r["snapshot_date"] for r in snap} == {"2026-10-02"}


async def test_an_unknown_layout_is_mapped_by_the_model(run, backend, store, warehouse, recordings):
    """a Tally-style export with Hindi and abbreviated headers, and a column nobody asked for"""
    header = "Party Name,Item Code,बैच नं.,Mfg Dt,Exp Dt,Cl. Qty,Godown,Remarks"
    rows = [header, "Rakesh Traders,MF-MC-150,MF-2409-117,18/05/2026,18/11/2026,1840,Kalamna,ok"]
    f = put(store, "munchly/uploads/ex_1.csv", ("\n".join(rows) + "\n").encode())
    recordings.data["data_map"] = {
        "json": {
            "files": [
                {
                    "file": "ex_1.csv",
                    "kind": "stock",
                    "columns": [
                        {"column": "distributor_name", "header": "Party Name"},
                        {"column": "item_code", "header": "Item Code"},
                        {"column": "batch_no", "header": "बैच नं."},
                        {"column": "mfg_date", "header": "Mfg Dt"},
                        {"column": "bb_date", "header": "Exp Dt"},
                        {"column": "closing_qty", "header": "Cl. Qty"},
                        {"column": "location", "header": "Godown"},
                    ],
                    "unknown": ["Remarks"],
                    "dateFormat": "DMY",
                }
            ]
        }
    }
    outcome, rc = await run(message("journey.step", {"type": "export.uploaded", "file": f}, event_id="ev_u"))
    body = backend.report("/exports")
    assert body["mapped"] == 7 and body["batches"] == [
        {
            "ref": "MF-2409-117",
            "sku": "chips",
            "distributor": "rakesh",
            "units": 1840,
            "mfg": "2026-05-18",
            "bestBefore": "2026-11-18",
        }
    ]
    (req,) = rc.requests
    assert req["writer"] == "data_map" and "Remarks" in req["parts"][0]
    assert "Remarks" in rc.runs["data"].note  # the column it could not place is flagged


async def test_a_map_missing_a_required_column_loads_nothing(run, backend, store, warehouse, recordings):
    f = put(store, "munchly/uploads/ex_2.csv", b"Party,Item,Qty\nRakesh Traders,MF-MC-150,10\n")
    recordings.data["data_map"] = {
        "json": {
            "files": [
                {
                    "file": "ex_2.csv",
                    "kind": "stock",
                    "columns": [{"column": "item_code", "header": "Item"}],
                    "unknown": [],
                    "dateFormat": None,
                }
            ]
        }
    }
    outcome, rc = await run(message("journey.step", {"type": "export.uploaded", "file": f}))
    assert backend.reports() == [] and warehouse.tables["stock_snapshots"] == []
    assert rc.runs["data"].fallback is True


async def test_run_now_sweeps_the_files_not_loaded_yet(run, backend, store, warehouse):
    put(store, "munchly/2026-10-02/stock-2026-10-02.csv", stock_csv())
    outcome, _ = await run(message("journey.step", {"type": "agent.run_now", "agent": "data"}))
    assert backend.report("/exports")["rows"] == 9
    # the second sweep finds nothing new
    backend.calls.clear()
    outcome, _ = await run(message("journey.step", {"type": "agent.run_now", "agent": "data"}, event_id="ev_2"))
    assert outcome == "noop" and backend.reports() == []


async def test_the_watcher_reads_sell_through_from_bigquery(run, backend, store, warehouse):
    start = DAY0 - timedelta(days=90)
    f = put(
        store, "munchly/backfill/sales-backfill.csv", sales_csv([start + timedelta(days=i) for i in range(90)], start)
    )
    await run(message("journey.step", {"type": "export.uploaded", "file": f, "backfill": True}))
    outcome, rc = await run(message("journey.step", {"type": "agent.due", "agent": "watcher"}, event_id="ev_w"))
    body = backend.report("/detect")
    assert body["run"] == {**body["run"], "agent": "watcher", "eventKey": "ev_w:watcher"}
    assert body["checked"] == 9 and body["distributors"] == 4
    rates = {b["ref"]: b["sellPerDay"] for b in body["batches"]}
    # 28 days of the calibrated history give each batch its own rate back (12 a day for the story's batch)
    assert rates["MF-2409-117"] == 12 and rates["MF-2410-118"] == 28
    assert rates == {b["id"]: b["sellPerDay"] for b in STORY["batches"]}
    assert rc.requests == []


async def test_the_watcher_reads_up_to_the_journeys_day_only(run, backend, store, warehouse):
    """a story replayed from its own calendar leaves later days loaded by an earlier replay: the Watcher's window ends at
    backend-api's journey day, so those days never count (SC-75)"""
    start = DAY0 - timedelta(days=90)
    f = put(
        store, "munchly/backfill/sales-backfill.csv", sales_csv([start + timedelta(days=i) for i in range(90)], start)
    )
    await run(message("journey.step", {"type": "export.uploaded", "file": f, "backfill": True}))
    # forty days ahead of the journey, from a replay before: one shop's run of nothing sold
    later = [DAY0 + timedelta(days=i) for i in range(1, 41)]
    quiet = SALES + "\n" + "\n".join(f"rakesh,440001,MF-MC-150,{d.isoformat()},0,0" for d in later) + "\n"
    g = put(store, "munchly/2026-11-11/sales-2026-11-11.csv", quiet.encode())
    await run(message("journey.step", {"type": "export.uploaded", "file": g}, event_id="ev_later"))
    await run(message("journey.step", {"type": "agent.due", "agent": "watcher"}, event_id="ev_w2"))
    rates = {b["ref"]: b["sellPerDay"] for b in backend.report("/detect")["batches"]}
    assert rates["MF-2409-117"] == 12


async def test_the_watcher_without_history_keeps_each_batchs_own_rate(run, backend):
    await run(message("journey.step", {"type": "agent.due", "agent": "watcher"}))
    rates = {b["ref"]: b["sellPerDay"] for b in backend.report("/detect")["batches"]}
    assert rates["MF-2409-117"] == 12


def test_a_distributors_sales_are_shared_by_its_batches_rates():
    from sc_agents.agents.watcher import rates

    batches = [
        {"id": "A", "distributor": "d", "sku": "s", "sellPerDay": 10},
        {"id": "B", "distributor": "d", "sku": "s", "sellPerDay": 30},
        {"id": "C", "distributor": "e", "sku": "s", "sellPerDay": 5},
    ]
    out = {r["ref"]: r["sellPerDay"] for r in rates(batches, {("d", "s"): 20.0})}
    assert out == {"A": 5.0, "B": 15.0, "C": 5}


async def test_run_now_for_an_agent_without_a_daily_job_is_a_noop(run, backend):
    outcome, _ = await run(message("journey.step", {"type": "agent.run_now", "agent": "valuer"}))
    assert outcome == "noop" and backend.calls == []


async def test_the_data_agent_reads_only_known_endpoints(run, backend, store):
    put(store, "munchly/2026-10-02/stock-2026-10-02.csv", stock_csv())
    await run(message("journey.step", {"type": "agent.run_now", "agent": "data"}))
    assert [p for m, p, _ in backend.calls if m == "GET"] == [f"{C}/agents", f"{C}/batches"]

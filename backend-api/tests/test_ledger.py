"""The Finance & ESG ledger (SC-124): every batch cleared, read from the ledger Impact posted, by quarter and by year,
with every total worked out on the server. On Munchly's history (SC-123) each batch's figures are money.js's, each
period adds up its batches, and only those who read the report see it."""

import pytest

from sc_api.domain import money
from sc_api.services.reference import load
from tests.test_history import REFS, H, with_history  # noqa: F401
from tests.test_workspace import ARJUN, LAKSHMI, PRIYA, RAKESH, WS, case

pytestmark = pytest.mark.usefixtures("with_history")
SAME = {"net": "net", "swing": "swing", "pnl": "pnl", "itcKept": "itc", "itcReversed": "itcReversed", "kg": "kg"}
SAME |= {"co2": "co2", "meals": "meals", "godown": "godown", "destroyed": "destroyed"}


async def _ledger(api, who=PRIYA) -> dict:
    r = await api.get(f"{WS}/ledger", headers=who)
    assert r.status_code == 200, r.text
    return r.json()


async def test_each_batch_reads_as_its_posted_ledger(api):
    ledger = await _ledger(api)
    rows = {b["ref"]: b for b in ledger["batches"]}
    assert set(rows) == REFS
    for b in H["batches"]:
        got = rows[b["ref"]]
        assert {k: got["figures"][k] for k in SAME} == {k: b["expect"][v] for k, v in SAME.items()}, b["ref"]
        assert got["outcome"] == b["outcome"] and got["history"] and got["reviewed"], b["ref"]
        f = got["figures"]
        assert f["sold"] + f["donated"] + f["godown"] <= f["units"]
        assert {p["id"]: p["no"] for p in got["papers"]}["support"] == b["numbers"]["support"]
    assert [b["cleared"] for b in ledger["batches"]] == sorted(b["cleared"] for b in ledger["batches"])


async def test_the_periods_add_up_their_batches(api):
    ledger = await _ledger(api)
    periods = {p["id"]: p for p in ledger["periods"]}
    assert list(periods) == ["fy27-q2", "fy27-q3", "fy27"]
    q2, q3, year = periods["fy27-q2"], periods["fy27-q3"], periods["fy27"]
    assert (q2["label"], q2["long"], q2["current"]) == ("Q2 FY27", "Jul to Sep 2026", False)
    assert (q3["label"], q3["long"], q3["current"]) == ("Q3 FY27", "Oct to Dec 2026 · so far", True)
    assert (year["label"], year["long"]) == ("This year", "FY 2026-27 so far")
    assert (year["from"], year["to"]) == ("2026-04-01", "2027-03-31")
    t = q2["totals"]
    for k, v in SAME.items():
        want = sum(b["expect"][v] for b in H["batches"])
        assert t[k] == pytest.approx(want if k != "co2" else t["kg"] * money.RULES["co2PerKg"], abs=0.02), k
    assert t["batches"] == 12 and t["outcomes"] == {"sold": 7, "leftover": 3, "donation": 2}
    assert t["creditNotes"] == 15 and t["receipts"] == 2 and t["reviewed"] == 12
    assert t["invoices"] == sum("invoice" in b["numbers"] for b in H["batches"])
    assert year["totals"] == t and q3["totals"]["batches"] == 0
    # the months, the weeks, the mix and BRSR's row, from the same batches
    assert sum(mo["totals"]["batches"] for mo in q2["months"]) == 12
    months = sorted({b["cleared"][:7] for b in ledger["batches"]})
    assert [mo["month"] for mo in q2["months"]] == months and q2["months"][0]["label"].endswith(" 2026")
    assert len(q2["weeks"]) == 13 and sum(w[1] for w in q2["weeks"]) == pytest.approx(t["net"], abs=0.05)
    assert sum(p for _, p in q2["mix"]) == 100 and dict(q2["mix"])["writeoff"] >= 1
    row, plastic = q2["brsr"]
    assert (row["diverted"], row["donated"], row["disposed"]) == (t["kg"], t["donatedKg"], t["destroyedKg"])
    assert row["resold"] + row["donated"] == pytest.approx(row["diverted"], abs=0.05)
    assert "2 food-bank receipts" in row["evidence"] and "3 destruction certificates" in row["evidence"]
    # the plastic packaging goes where its pack goes (SC-125)
    assert plastic["cat"] == "Plastic packaging (EPR)"
    assert (plastic["resold"], plastic["donated"], plastic["disposed"]) == (
        t["packResoldKg"],
        t["packDonatedKg"],
        t["packDestroyedKg"],
    )
    assert plastic["diverted"] == pytest.approx(plastic["resold"] + plastic["donated"], abs=0.01)
    assert plastic["disposed"] > 0
    assert q3["brsr"] == [] and q3["mix"] == []


async def test_only_those_who_read_the_report_see_the_ledger(api):
    for who in (PRIYA, ARJUN):
        assert (await api.get(f"{WS}/ledger", headers=who)).status_code == 200
    for who in (RAKESH, LAKSHMI):
        assert (await api.get(f"{WS}/ledger", headers=who)).status_code == 403


async def test_a_cleared_batch_carries_its_ledger(api):
    ledger = await _ledger(api)
    leftover = next(b for b in H["batches"] if b["outcome"] == "leftover")
    row = next(b for b in ledger["batches"] if b["ref"] == leftover["ref"])
    assert (await case(api, PRIYA, leftover["ref"]))["ledger"] == row
    holder = {"rakesh": RAKESH, "lakshmi": LAKSHMI}[leftover["distributor"]]
    assert (await case(api, holder, leftover["ref"]))["ledger"] is None


def test_the_constant_quarter_is_gone():
    assert "quarter" not in load("journey.json")


async def test_the_ledger_is_design3s(api):
    """design3/core/ledger.js works the history's ledger out from money.js (seed.mjs writes it into journey.json):
    backend-api's, read from the ledgers Impact posted, is the same, period by period and batch by batch"""
    want = H["ledger"]
    got = await _ledger(api)
    assert got["today"] == want["today"]
    assert got["periods"] == want["periods"]
    keys = ("id", "type", "no", "status", "date", "amount")
    for g, w in zip(got["batches"], want["batches"], strict=True):
        assert [{k: p[k] for k in keys} for p in g["papers"]] == [{k: p[k] for k in keys} for p in w["papers"]]
        assert g["reviewed"]["by"] == w["reviewed"]["by"]
        rest = lambda r: {k: v for k, v in r.items() if k not in ("papers", "reviewed")}  # noqa: E731
        assert rest(g) == rest(w), g["ref"]


async def test_paperwork_is_asked_only_for_the_pdfs_still_missing(ctx):
    """SC-125: a paper drafted before its template existed (the expiry credit note), or whose PDF failed, is laid out
    on request; a batch whose papers all have theirs, or lack one only for a record (the destruction certificate), is
    left alone"""
    from sqlalchemy import select

    from sc_api import models as m
    from sc_api.services.journey import steps

    rows = await ctx.session.execute(select(m.Case).where(m.Case.client_id == "munchly", m.Case.history.is_(True)))
    cases = {c.batch_ref: c for c in rows.scalars()}
    leftover = next(b["ref"] for b in H["batches"] if b["outcome"] == "leftover")
    done = cases[leftover]
    pdf = lambda d: None if d["id"] == "destruction" else f"munchly/{leftover}/{d['id']}.pdf"  # noqa: E731
    done.docs = [{**d, "pdf": pdf(d)} for d in done.docs]
    await ctx.session.flush()
    asked = await steps.lay_out_missing(ctx, "munchly")
    assert set(asked) == REFS - {leftover}
    sent = (await ctx.session.execute(select(m.Outbox).where(m.Outbox.published_wall.is_(None)))).scalars().all()
    settles = [o.payload["ref"] for o in sent if o.payload.get("type") == "settle" and o.payload.get("ref") in asked]
    assert sorted(set(settles)) == asked
    # again: every paper afresh, the batch whose PDFs were all laid out too
    assert set(await steps.lay_out_missing(ctx, "munchly", again=True)) == REFS
    assert not any(d.get("pdf") for d in done.docs if d["id"] in steps.PDF_PAPERS)

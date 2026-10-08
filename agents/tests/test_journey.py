"""The journey's events, each answered by its pipeline: the exact requests each one sends backend-api (paths, bodies,
and the run with its event key), from the story's batch, MF-2409-117."""

import pytest

from sc_agents.errors import Transient
from tests.conftest import (
    CASE,
    HERO,
    LISTING,
    MANGO,
    PHOTO,
    STORY,
    C,
    case,
    message,
)

STEP = "journey.step"


def run_of(body: dict, agent: str, key: str) -> None:
    r = body["run"]
    assert r["agent"] == agent and r["eventKey"] == key, r
    assert r["runId"].startswith("run_") and len(r["traceId"]) == 32


# --- verify, value, decide ------------------------------------------------------------------------------------------


async def test_at_risk_asks_for_the_label_photo(run, backend):
    outcome, rc = await run(message("batch.at_risk", {"ref": HERO}, event_id="ev_ask"))
    assert outcome == "done"
    assert backend.reports() == [("POST", f"/cases/{HERO}/photo-request", backend.report("photo-request"))]
    run_of(backend.report("photo-request"), "vision", "ev_ask:vision")
    assert "model" not in backend.report("photo-request")["run"]  # no model call
    assert rc.requests == []


async def test_decide_reads_the_label_then_values_and_routes(run, backend):
    outcome, rc = await run(message(STEP, {"type": "decide", "ref": HERO, "photo": PHOTO}, event_id="ev_dec"))
    assert outcome == "done"
    assert [p for _, p, _ in backend.reports()] == [
        f"/cases/{HERO}/photo-read",
        f"/cases/{HERO}/valuation",
        f"/cases/{HERO}/plan",
    ]
    read = backend.report("photo-read")
    assert read["read"] == {
        "batch": HERO,
        "mfg": "2026-05-18",
        "bestBefore": "2026-11-18",
        "mrp": 30.0,
        "pack": "Munchly Masala Chips 150 g",
        "confidence": 0.97,
    }
    run_of(read, "vision", "ev_dec:vision")
    assert read["run"]["model"] == "stub" and read["run"]["fallback"] is False

    notes = backend.report("valuation")
    assert set(notes["notes"]) == {"expiresoon", "kirana", "staff", "foodbank", "writeoff"}
    run_of(notes, "valuer", "ev_dec:valuer")

    plan = backend.report("plan")
    assert plan["explanation"].startswith("588 units go to the kirana cluster at ₹18")
    run_of(plan, "router", "ev_dec:router")
    assert plan["run"]["fallback"] is False

    # the photo went to the model as an image, with the read's instruction
    vision = next(r for r in rc.requests if r["writer"] == "vision_read")
    assert vision["parts"][0].startswith("<image/jpeg") and "the Vision agent" in vision["system"]
    gets = [p for m, p, _ in backend.calls if m == "GET"]
    assert gets == [f"{C}/agents", CASE, f"{CASE}/valuation-preview", f"{CASE}/plan-preview"]


async def test_a_retake_stops_the_pipeline(run, backend):
    backend["POST", f"{CASE}/photo-read"] = {"ok": True, "result": False}
    outcome, _ = await run(message(STEP, {"type": "decide", "ref": HERO, "photo": PHOTO}))
    assert outcome == "done"
    assert [p for _, p, _ in backend.reports()] == [f"/cases/{HERO}/photo-read"]


async def test_vision_tries_again_when_the_model_fails_then_asks_for_a_retake(run, backend, recordings):
    recordings.data["vision_read"] = {"error": "503 Service Unavailable"}
    with pytest.raises(Transient):
        await run(message(STEP, {"type": "decide", "ref": HERO, "photo": PHOTO}, attempt=1))
    assert backend.reports() == []
    # on the last delivery an empty read goes, and backend-api asks the distributor for another photo
    backend["POST", f"{CASE}/photo-read"] = {"ok": True, "result": False}
    outcome, rc = await run(message(STEP, {"type": "decide", "ref": HERO, "photo": PHOTO}, attempt=5))
    assert outcome == "done"
    body = backend.report("photo-read")
    assert body["read"]["batch"] is None and body["read"]["confidence"] == 0
    assert body["run"]["fallback"] is True


async def test_decide_resumes_where_a_redelivered_event_left_off(run, backend):
    """the first delivery read the label and priced the exits, then failed: the second routes only"""
    backend["GET", CASE] = case(phase="valued", photo="verified")
    outcome, rc = await run(message(STEP, {"type": "decide", "ref": HERO, "photo": PHOTO}))
    assert outcome == "done"
    assert [p for _, p, _ in backend.reports()] == [f"/cases/{HERO}/plan"]
    assert [r["writer"] for r in rc.requests] == ["router_write"]


async def test_value_runs_the_valuer_then_the_router(run, backend):
    backend["GET", CASE] = case(phase="verified", photo="verified")
    outcome, _ = await run(message(STEP, {"type": "value", "ref": HERO}, event_id="ev_v"))
    assert [p for _, p, _ in backend.reports()] == [f"/cases/{HERO}/valuation", f"/cases/{HERO}/plan"]
    run_of(backend.report("plan"), "router", "ev_v:router")


async def test_value_without_a_photo_needed(run, backend):
    """a client that needs no photo: the case stays at-risk, its photo skipped (the view says verified)"""
    backend["GET", CASE] = case(phase="at-risk", photo="verified")
    await run(message(STEP, {"type": "value", "ref": HERO}))
    assert [p for _, p, _ in backend.reports()] == [f"/cases/{HERO}/valuation", f"/cases/{HERO}/plan"]


async def test_route_runs_the_router_alone(run, backend):
    backend["GET", CASE] = case(phase="valued", photo="verified")
    await run(message(STEP, {"type": "route", "ref": HERO}, event_id="ev_r"))
    assert [p for _, p, _ in backend.reports()] == [f"/cases/{HERO}/plan"]
    run_of(backend.report("plan"), "router", "ev_r:router")


async def test_a_redelivered_event_is_a_noop(run, backend):
    backend["POST", f"{CASE}/photo-request"] = {"ok": True, "noop": True}
    outcome, rc = await run(message("batch.at_risk", {"ref": HERO}))
    assert outcome == "noop"
    assert rc.runs["vision"].final_status == "noop"


async def test_a_journey_that_moved_on_is_a_noop(run, backend):
    backend["GET", CASE] = (404, {"message": "batch in a journey not found"})
    outcome, _ = await run(message(STEP, {"type": "route", "ref": HERO}))
    assert outcome == "noop"
    assert backend.reports() == []


async def test_an_agent_switched_off_does_nothing(run, backend):
    from tests.conftest import agents_settings

    backend["GET", f"{C}/agents"] = agents_settings(router=True)
    backend["GET", CASE] = case(phase="valued", photo="verified")
    outcome, rc = await run(message(STEP, {"type": "route", "ref": HERO}))
    assert backend.reports() == [] and rc.requests == []


# --- execute ----------------------------------------------------------------------------------------------------------


async def test_execute_lists_offers_and_books_in_parallel(run, backend):
    backend["GET", CASE] = case(phase="approved", photo="verified")
    outcome, rc = await run(message(STEP, {"type": "execute", "ref": HERO}, event_id="ev_x"))
    assert outcome == "done"
    paths = sorted(p for _, p, _ in backend.reports())
    assert paths == [f"/cases/{HERO}/listing", f"/cases/{HERO}/offer"]  # no food-bank line in the hero's plan
    listing = backend.report("listing")
    assert listing["title"] == "Munchly Masala Chips 150 g · 772 packs · Nagpur"
    assert "13.5" not in listing["description"]
    run_of(listing, "lister", "ev_x:lister")
    offer = backend.report("offer")
    assert set(offer["words"]) == {"hi", "en", "mr"} and all("{shop}" in w for w in offer["words"].values())
    run_of(offer, "outreach", "ev_x:outreach")
    # the lister's facts never hold the reserve
    lister = next(r for r in rc.requests if r["writer"] == "lister_write")
    assert "13.5" not in " ".join(lister["parts"]) and "reserve" not in " ".join(lister["parts"]).lower()


async def test_the_scheme_price_goes_into_channel_prices(run, backend, warehouse):
    backend["GET", CASE] = case(phase="approved", photo="verified")
    await run(message(STEP, {"type": "execute", "ref": HERO}))
    (row,) = warehouse.tables["channel_prices"]
    assert row["channel"] == "kirana" and row["source"] == "offer" and row["price_per_unit"] == 18
    assert row["pct_of_mrp"] == 0.6 and row["priced_on"] == "2026-10-02"


async def test_donation_reports_as_outreach_with_its_own_key(run, backend):
    mango_case = case(phase="executing", photo="verified", which="mango", offer={"status": "closed"})
    backend["GET", f"{C}/cases/{MANGO}"] = mango_case
    outcome, rc = await run(message(STEP, {"type": "execute", "ref": MANGO}, event_id="ev_m"))
    assert [p for _, p, _ in backend.reports()] == [f"/cases/{MANGO}/donation"]
    run_of(backend.report("donation"), "outreach", "ev_m:donation")
    assert rc.requests == []  # the Lister and Outreach had nothing to do: no model call


async def test_execute_does_nothing_while_the_distributor_has_paused(run, backend):
    paused = case(phase="approved", photo="verified")
    paused["distributor"]["permission"]["paused"] = True
    backend["GET", CASE] = paused
    await run(message(STEP, {"type": "execute", "ref": HERO}))
    assert backend.reports() == []


async def test_execute_redelivered_after_the_listing_writes_only_the_offer(run, backend):
    backend["GET", CASE] = case(phase="executing", photo="verified", listing=LISTING)
    _, rc = await run(message(STEP, {"type": "execute", "ref": HERO}))
    assert [p for _, p, _ in backend.reports()] == [f"/cases/{HERO}/offer"]
    assert [r["writer"] for r in rc.requests] == ["outreach_write"]


# --- the ExpireSoon buyer ----------------------------------------------------------------------------------------------


async def test_the_negotiator_counters_a_bid(run, backend):
    backend["GET", CASE] = case(phase="executing", photo="verified", listing=LISTING)
    backend["GET", f"{CASE}/bids/bid_1/preview"] = {
        "action": "counter",
        "price": 14.2,
        "bid": 13,
        "ask": 15,
        "units": 772,
        "city": "Nagpur",
        "bestBefore": "2026-11-18",
        "dispatchHours": 24,
    }
    outcome, rc = await run(message("offer.received", {"ref": HERO, "bid": "bid_1"}, event_id="ev_b"))
    body = backend.report("bids/bid_1/answer")
    assert "₹14.20" in body["reply"] and "13" not in body["reply"]
    run_of(body, "negotiator", "ev_b:negotiator")
    assert body["run"]["fallback"] is False


async def test_the_negotiator_answers_a_question(run, backend):
    chat = [
        {"id": "1", "from": "buyer", "text": "Can you do ₹13 for all 772?", "at": "x"},
        {"id": "2", "from": "agent", "text": "₹14.20 for 772, Nagpur stock.", "at": "x"},
        {"id": "3", "from": "buyer", "text": "What is the best-before date?", "at": "x"},
    ]
    backend["GET", CASE] = case(phase="executing", photo="verified", listing=LISTING, chat=chat)
    await run(message("offer.received", {"ref": HERO, "message": 3}, event_id="ev_q"))
    body = backend.report("messages/3/answer")
    assert "18 Nov 2026" in body["reply"]
    run_of(body, "negotiator", "ev_q:negotiator")


async def test_a_deal_closed_records_the_awarded_price(run, backend, warehouse):
    award = {"units": 772, "price": 14.2, "at": "2026-10-03T11:00:00+05:30", "buyer": "Agrawal Wholesale"}
    backend["GET", CASE] = case(phase="executing", photo="verified", listing=LISTING, award=award)
    outcome, rc = await run(message("deal.closed", {"ref": HERO, "price": 14.2}))
    assert outcome == "done" and backend.reports() == []
    (row,) = warehouse.tables["channel_prices"]
    assert row == {
        **row,
        "channel": "expiresoon",
        "source": "award",
        "price_per_unit": 14.2,
        "priced_on": "2026-10-03",
        "sku_id": "chips",
    }
    assert round(row["pct_of_mrp"], 4) == round(14.2 / 30, 4)
    # a redelivery does not double it
    await run(message("deal.closed", {"ref": HERO, "price": 14.2}))
    assert len(warehouse.tables["channel_prices"]) == 1


# --- settle and report -------------------------------------------------------------------------------------------------


async def test_paperwork_drafts_renders_and_files_each_paper(run, backend, store):
    docs = [{**d, "pdf": None} for d in STORY["docs"]]
    award = {"units": 772, "price": 14.2, "at": "2026-10-03", "buyer": "Agrawal Wholesale"}
    backend["GET", CASE] = case(phase="settled", photo="verified", listing=LISTING, award=award, docs=docs)
    outcome, rc = await run(message(STEP, {"type": "settle", "ref": HERO}, event_id="ev_s"))
    assert outcome == "done"
    reports = backend.reports()
    assert reports[0][:2] == ("POST", f"/cases/{HERO}/documents")
    run_of(reports[0][2], "paperwork", "ev_s:paperwork")
    patched = [(p, b["object"]) for m, p, b in reports if m == "PATCH"]
    # the invoice, the credit note and the ITC memo; the FSSAI checklist is not required without a donation
    assert patched == [
        (f"/cases/{HERO}/documents/invoice", f"munchly/{HERO}/invoice.pdf"),
        (f"/cases/{HERO}/documents/support", f"munchly/{HERO}/support.pdf"),
        (f"/cases/{HERO}/documents/itc", f"munchly/{HERO}/itc.pdf"),
    ]
    invoice = store.objects[("docs-test", f"munchly/{HERO}/invoice.pdf")].decode()
    assert invoice.startswith("%PDF") and "INV/26-27/0931" in invoice and "₹11,510.00" in invoice
    assert "Check each paper" in invoice  # the Flash cover note in the footer
    credit = store.objects[("docs-test", f"munchly/{HERO}/support.pdf")].decode()
    assert "CN/0117" in credit and "₹8,768" in credit


async def test_paperwork_redelivered_renders_only_what_is_missing(run, backend):
    docs = [{**d, "pdf": f"munchly/{HERO}/{d['id']}.pdf" if d["id"] == "invoice" else None} for d in STORY["docs"]]
    backend["GET", CASE] = case(phase="settled", photo="verified", listing=LISTING, docs=docs)
    backend["POST", f"{CASE}/documents"] = {"ok": True, "noop": True}
    outcome, rc = await run(message(STEP, {"type": "settle", "ref": HERO}))
    assert [p for m, p, _ in backend.reports() if m == "PATCH"] == [
        f"/cases/{HERO}/documents/support",
        f"/cases/{HERO}/documents/itc",
    ]
    assert outcome == "done"


async def test_the_shelf_check_loads_the_counts_and_reports_them(run, backend, store, warehouse):
    rows = ["distributor_id,outlet_id,item_code,batch_no,counted_on,qty_left"]
    for k in STORY["kiranas"]:
        if k["orders"]:
            left = 18 if k["name"] == "Jai Durga Stores" else k["orders"] // 4
            rows.append(f"rakesh,{k['id']},MF-MC-150,{HERO},2026-10-09,{left}")
    name = f"munchly/2026-10-09/shelf-{HERO}-2026-10-09.csv"
    store.objects[("exports-test", name)] = ("\n".join(rows) + "\n").encode()
    files = [f"gs://exports-test/{name}"]
    await run(message(STEP, {"type": "timer", "kind": "shelf.due", "ref": HERO, "files": files}, event_id="ev_sh"))
    body = backend.report("shelf-check")
    run_of(body, "outreach", "ev_sh:outreach")
    counted = {c["kirana"]: c["left"] for c in body["counts"]}
    assert len(counted) == len(rows) - 1 and counted["k1"] == 18
    assert all(r["sku_id"] == "chips" for r in warehouse.tables["shelf_counts"])
    # loaded once, however often the event comes
    await run(message(STEP, {"type": "timer", "kind": "shelf.due", "ref": HERO, "files": files}, event_id="ev_sh2"))
    assert len(warehouse.tables["shelf_counts"]) == len(rows) - 1


async def test_impact_posts_the_report_and_appends_the_ledger(run, backend, warehouse):
    plan = STORY["hero"]["plan"]
    ledger = {
        "net": 21152.4,
        "kg": plan["kg"],
        "co2": plan["co2"],
        "meals": 0,
        "itc": plan["itcRetained"],
        "lines": plan["lines"],
        "at": "2026-10-30T10:00:00+05:30",
        "returnBy": "2026-10-29",
        "actual": {"net": 21152.4, "delta": 617.6},
    }
    backend["GET", CASE] = case(phase="settled", photo="verified", listing=LISTING)
    backend["POST", f"{CASE}/report"] = {"ok": True, "ledger": ledger}
    outcome, _ = await run(message(STEP, {"type": "timer", "kind": "report.due", "ref": HERO}, event_id="ev_i"))
    run_of(backend.report("report"), "impact", "ev_i:impact")
    rows = {r["channel"]: r for r in warehouse.tables["impact_ledger"]}
    assert set(rows) == {"kirana", "expiresoon"}
    assert rows["kirana"]["units"] == 588 and rows["kirana"]["recovered_inr"] == 10290
    assert rows["expiresoon"]["recovered_inr"] == round(11480 - 617.6, 2)
    assert round(sum(r["kg"] for r in rows.values()), 1) == 217.6
    assert rows["kirana"]["closed_on"] == "2026-10-30" and rows["kirana"]["quarter"] == "FY27 Q3"
    assert rows["kirana"]["journey_id"] == "munchly:2026-10-02"


async def test_the_journey_reset_needs_nothing(run, backend):
    outcome, _ = await run(message("journey.step", {"type": "journey.reset"}))
    assert outcome == "noop" and backend.calls == []


def test_impact_keeps_a_row_for_the_packs_left_at_the_godown():
    """SC-86: a batch whose channels took less than planned leaves the rest at the godown; the ledger keeps a row for it,
    with nothing recovered and nothing kept from landfill"""
    from sc_agents.agents import impact

    lines = [{"id": "kirana", "units": 240, "net": 2760}, {"id": "staff", "units": 120, "net": 960}]
    ledger = {"net": 3720, "kg": 77.4, "co2": 193.5, "meals": 0, "lines": lines, "godown": 1220, "at": "2026-10-30"}
    case_ = {"ref": "MF-2410-118", "sku": {"id": "mango", "kgPerUnit": 0.215}, "writeOffPerUnit": 14.34}
    rows = {r["channel"]: r for r in impact.rows("munchly", case_, ledger, journey="j", recorded="2026-10-30T10:00")}
    assert set(rows) == {"kirana", "staff", "godown"}
    assert (rows["godown"]["units"], rows["godown"]["recovered_inr"], rows["godown"]["kg"]) == (1220, 0.0, 0.0)
    assert rows["staff"]["recovered_inr"] == 960 and rows["godown"]["write_off_avoided_inr"] == 0.0

"""SC-174: the staff sale's consolidated receipt. The distributor attaches one receipt listing every staff payment by
its UPI reference, a photo or a PDF; Vision reads its payments, and the sale records only once they come to what sold.
The receipt is then a paper of the pack, his own, with a short-lived link."""

from sc_api.domain.papers import iso_day
from tests.test_workspace import (
    LAKSHMI,
    MANGO,
    MEERA,
    PRIYA,
    RAKESH,
    WS,
    agent,
    case,
    mango_to_approved,
    staff_receipt,
)


async def _staff_open(api, cloud) -> None:
    await mango_to_approved(api, cloud)
    await agent(api, f"/cases/{MANGO}/offer", "outreach-m", "outreach")


async def test_the_staff_sale_records_on_a_receipt_that_matches(api, munchly, cloud):
    await _staff_open(api, cloud)
    # a photo or a PDF only, and his alone to send
    bad = await api.post(
        f"{WS}/cases/{MANGO}/staff-sale/receipt", json={"contentType": "text/plain", "bytes": 4}, headers=LAKSHMI
    )
    assert bad.status_code == 422 and "photo" in bad.json()["message"]
    other = await api.post(
        f"{WS}/cases/{MANGO}/staff-sale/receipt", json={"contentType": "application/pdf", "bytes": 4}, headers=RAKESH
    )
    assert other.status_code == 403
    link = await api.post(
        f"{WS}/cases/{MANGO}/staff-sale/receipt", json={"contentType": "application/pdf", "bytes": 4}, headers=LAKSHMI
    )
    assert link.status_code == 200, link.text
    # it must have arrived before Vision can read it
    early = await api.post(f"{WS}/cases/{MANGO}/staff-sale/receipt/{link.json()['id']}", headers=LAKSHMI)
    assert early.status_code == 422 and early.json()["message"] == "The receipt has not arrived yet. Send it again."

    # one payment short: 149 packs' worth, so 150 sold is refused, and 149 records
    rid = await staff_receipt(api, cloud, MANGO, LAKSHMI, paid=149 * 8)
    st = (await case(api, LAKSHMI, MANGO))["journey"]["staff"]
    r = st["receipt"]
    assert (r["status"], r["paid"], r["units"], len(r["payments"])) == ("read", 1192.0, 149, 15)
    assert r["payments"][0]["rrn"] == "627517000001" and r["url"]
    short = await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 150, "receipt": rid}, headers=LAKSHMI)
    assert short.status_code == 422
    assert short.json()["message"] == (
        "The receipt's 15 payments come to ₹1,192.00, not 150 packs at ₹8.00: count again, or send the receipt with "
        "every payment."
    )
    ok = await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 149, "receipt": rid}, headers=LAKSHMI)
    assert ok.status_code == 200, ok.text
    st = (await case(api, PRIYA, MANGO))["journey"]["staff"]
    assert (st["status"], st["sold"], st["receipt"]["no"]) == ("recorded", 149, "LA/SR/26-27/0002")
    feed = (await case(api, PRIYA, MANGO))["feed"]
    lines = [e["text"] for e in feed if e.get("key") in ("staffReceipt", "staff")]
    assert lines[0] == "Read the consolidated receipt LA/SR/26-27/0002: 15 UPI payments, ₹1,192.00."
    assert lines[1].endswith("with the consolidated receipt LA/SR/26-27/0002 for 15 UPI payments.")


async def test_a_receipt_vision_cannot_read_records_nothing(api, munchly, cloud):
    await _staff_open(api, cloud)
    link = await api.post(
        f"{WS}/cases/{MANGO}/staff-sale/receipt", json={"contentType": "image/webp", "bytes": 4}, headers=LAKSHMI
    )
    rid = link.json()["id"]
    cloud.storage.objects[("photos-test", f"munchly/{MANGO}/staff-receipt-{rid}")] = b"webp"
    assert (await api.post(f"{WS}/cases/{MANGO}/staff-sale/receipt/{rid}", headers=LAKSHMI)).status_code == 200
    # still reading
    busy = await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 150, "receipt": rid}, headers=LAKSHMI)
    assert busy.status_code == 409
    read = {"no": None, "date": None, "payments": [], "total": None, "confidence": 0.1}
    await agent(api, f"/cases/{MANGO}/staff/receipt/read", f"vision-sr-{rid}", "vision", id=rid, read=read)
    assert (await case(api, LAKSHMI, MANGO))["journey"]["staff"]["receipt"]["status"] == "unreadable"
    bad = await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 150, "receipt": rid}, headers=LAKSHMI)
    assert bad.status_code == 422 and bad.json()["message"].startswith("Vision could not read the receipt")
    # a read for a receipt no longer reading changes nothing
    good = {**read, "payments": [{"rrn": "627517000001", "payer": "Staff", "at": "", "amount": 1200}]}
    await agent(api, f"/cases/{MANGO}/staff/receipt/read", "vision-sr-again", "vision", id=rid, read=good)
    assert (await case(api, LAKSHMI, MANGO))["journey"]["staff"]["receipt"]["status"] == "unreadable"


async def test_the_receipt_is_a_paper_of_the_pack_with_its_link(api, munchly, cloud):
    await _staff_open(api, cloud)
    rid = await staff_receipt(api, cloud, MANGO, LAKSHMI, paid=150 * 8)
    r = await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 150, "receipt": rid}, headers=LAKSHMI)
    assert r.status_code == 200, r.text
    # the other lines run their course: the scheme closes, and the food bank collects
    await agent(api, f"/cases/{MANGO}/offer/close", "close-m", "outreach")
    await agent(api, f"/cases/{MANGO}/donation", "donation-m", "outreach")
    assert (await api.post(f"{WS}/cases/{MANGO}/donation/confirm", headers=MEERA)).status_code == 200
    assert (await api.post(f"{WS}/cases/{MANGO}/donation/collect", headers=MEERA)).status_code == 200
    await agent(api, f"/cases/{MANGO}/documents", "paperwork-m", "paperwork")
    ids = [d["id"] for d in (await case(api, PRIYA, MANGO))["docs"]]
    assert ids[ids.index("support") + 1] == "staff"
    paper = next(d for d in (await case(api, PRIYA, MANGO))["docs"] if d["id"] == "staff")
    # dated as every other paper is, an ISO day, though the receipt prints 03/10/2026
    assert (paper["type"], paper["no"], paper["amount"], paper["owner"], paper["date"]) == (
        "Staff sale receipt",
        "LA/SR/26-27/0002",
        1200.0,
        "Lakshmi Agencies",
        "2026-10-03",
    )
    # his own paper too, and its link is the receipt he sent
    assert "staff" in [d["id"] for d in (await case(api, LAKSHMI, MANGO))["docs"]]
    url = await api.get(f"{WS}/documents/{MANGO}/staff", headers=PRIYA)
    assert url.status_code == 200 and "staff-receipt-" in url.json()["url"]
    facts = (await api.get(f"{WS}/partner", headers=LAKSHMI)).json()
    mine = next(x for x in facts["cases"] if x["ref"] == MANGO)
    assert mine["staffReceipt"]["no"] == "LA/SR/26-27/0002" and mine["staffReceipt"]["url"]


def test_a_receipt_s_printed_date_reads_as_a_day():
    assert [iso_day(t) for t in ("03/10/2026", "3-10-26", "03.10.2026", "2026-10-03", "2026-10-03T17:04")] == [
        "2026-10-03"
    ] * 5
    assert [iso_day(t) for t in (None, "", "Oct 3", "31/02/2026")] == [None] * 4

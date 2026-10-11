"""The staff sale's consolidated receipt (SC-174): the distributor attaches one receipt listing every staff member's UPI
payment, a photo or a PDF; Vision reads its payments and backend-api holds their total to the packs he counted."""

import pytest

from sc_agents.agents.vision import mime_of, tidy_receipt
from sc_agents.errors import Transient
from tests.conftest import MANGO, case, message

STEP = "journey.step"
CASE = f"/internal/clients/munchly/cases/{MANGO}"
OBJECT = f"munchly/{MANGO}/staff-receipt-sr1"
PDF = b"%PDF-1.7\n receipt"


def reading(status: str = "reading", rid: str = "sr1") -> dict:
    c = case(phase="executing", photo="verified", which="mango")
    c["journey"]["staff"] = {"units": 150, "sold": 150, "receipt": {"id": rid, "status": status}}
    return c


def receipt(content_type: str = "image/jpeg", rid: str = "sr1") -> dict:
    return {"id": rid, "object": OBJECT, "contentType": content_type}


async def test_vision_reads_the_receipt_and_reports_its_payments(run, backend, store):
    backend["GET", CASE] = reading()
    store.objects[("photos-test", OBJECT)] = b"\xff\xd8\xff\xe0 receipt"
    outcome, rc = await run(
        message(STEP, {"type": "staffReceipt", "ref": MANGO, "receipt": receipt()}, event_id="ev_sr")
    )
    assert outcome == "done"
    body = backend.report("staff/receipt/read")
    assert body["id"] == "sr1"
    read = body["read"]
    assert read["no"] == "LA/SR/26-27/0002" and read["date"] == "03/10/2026" and read["total"] == 1200.0
    assert len(read["payments"]) == 18 and round(sum(p["amount"] for p in read["payments"]), 2) == 1200.0
    assert read["payments"][0] == {
        "rrn": "627516578395",
        "payer": "Ayesha Sultana",
        "at": "02/10/2026 16:42",
        "amount": 96.0,
    }
    assert all(len(p["rrn"]) == 12 and p["rrn"][:4] in ("6275", "6276") for p in read["payments"])
    assert read["confidence"] == 0.94
    assert body["run"]["agent"] == "vision" and body["run"]["eventKey"] == "ev_sr:vision"
    # the receipt went to the model as it is, and nothing of the count he recorded
    parts = rc.requests[-1]["parts"]
    assert sum("image/jpeg" in str(p) for p in parts) == 1 and "150" not in str(parts) and "1200" not in str(parts)
    assert rc.requests[-1]["writer"] == "vision_staff_receipt"


async def test_a_pdf_receipt_goes_to_the_model_as_a_pdf(run, backend, store):
    backend["GET", CASE] = reading()
    store.objects[("photos-test", OBJECT)] = PDF
    outcome, rc = await run(
        message(STEP, {"type": "staffReceipt", "ref": MANGO, "receipt": receipt("application/pdf")})
    )
    assert outcome == "done"
    assert any("application/pdf" in str(p) for p in rc.requests[-1]["parts"])
    assert mime_of(PDF) == "application/pdf"


async def test_a_receipt_no_longer_being_read_is_left_alone(run, backend, store):
    store.objects[("photos-test", OBJECT)] = PDF
    backend["GET", CASE] = reading("read")
    outcome, _ = await run(message(STEP, {"type": "staffReceipt", "ref": MANGO, "receipt": receipt()}))
    assert outcome == "noop"
    # a receipt sent again since: this event's is not the one being read
    backend["GET", CASE] = reading(rid="sr2")
    outcome, _ = await run(message(STEP, {"type": "staffReceipt", "ref": MANGO, "receipt": receipt()}))
    assert outcome == "noop"
    assert not [p for _, p, _ in backend.reports() if p.endswith("staff/receipt/read")]


async def test_a_receipt_that_cannot_be_read_is_tried_again_then_reported_empty(run, backend, store, recordings):
    recordings.data["vision_staff_receipt"] = {"error": "boom"}
    backend["GET", CASE] = reading()
    store.objects[("photos-test", OBJECT)] = PDF
    with pytest.raises(Transient):
        await run(message(STEP, {"type": "staffReceipt", "ref": MANGO, "receipt": receipt()}))
    assert not [p for _, p, _ in backend.reports() if p.endswith("staff/receipt/read")]
    _, _ = await run(message(STEP, {"type": "staffReceipt", "ref": MANGO, "receipt": receipt()}, attempt=5))
    body = backend.report("staff/receipt/read")
    assert body["read"]["payments"] == [] and body["read"]["confidence"] == 0.0 and body["run"]["fallback"] is True


def test_a_receipts_read_is_tidied_as_backend_api_holds_it():
    out = tidy_receipt(
        {
            "no": " LA/SR/26-27/0002 ",
            "date": "03/10/2026",
            "payments": [
                {"rrn": "6275 1657 8395", "payer": "Ayesha  Sultana", "at": "02/10/2026 16:42", "amount": "₹96.004"},
                {"rrn": "62751701902", "payer": "D. Ramya", "at": None, "amount": 64},  # 11 digits: not a reference
                {"rrn": "UPI-6275-1776-7110", "payer": None, "at": None, "amount": None},
                {"rrn": None, "payer": "smudged", "at": None, "amount": None},  # neither: dropped
                "not a row",
            ],
            "total": "1,200.00",
            "confidence": 1.3,
        }
    )
    assert out == {
        "no": "LA/SR/26-27/0002",
        "date": "03/10/2026",
        "payments": [
            {"rrn": "627516578395", "payer": "Ayesha Sultana", "at": "02/10/2026 16:42", "amount": 96.0},
            {"rrn": None, "payer": "D. Ramya", "at": None, "amount": 64.0},
            {"rrn": "627517767110", "payer": None, "at": None, "amount": None},
        ],
        "total": 1200.0,
        "confidence": 1.0,
    }
    assert tidy_receipt({"confidence": "high"}) == {
        "no": None,
        "date": None,
        "payments": [],
        "total": None,
        "confidence": 0.0,
    }

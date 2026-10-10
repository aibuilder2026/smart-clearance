"""Packs destroyed at the distributor's godown (SC-139): Vision checks the two photos of the evidence and backend-api
holds the read to the batch; Paperwork lays out the expiry credit note's three lines and the agency's certificate once
the operator has approved it."""

from sc_agents.tools import pdf
from tests.conftest import CASE, HERO, LISTING, case, message

STEP = "journey.step"
OBJECTS = {"before": f"munchly/{HERO}/destruction-before-dz1", "after": f"munchly/{HERO}/destruction-after-dz2"}


def reading(status: str = "reading") -> dict:
    c = case(phase="settled", photo="verified", listing=LISTING)
    c["destruction"] = {"status": status, "units": 144, "agency": {"id": "oce", "name": "Orange City Enviro Services"}}
    return c


async def test_vision_reads_both_photos_and_reports_its_read(run, backend, store):
    backend["GET", CASE] = reading()
    for name in OBJECTS.values():
        store.objects[("photos-test", name)] = b"\xff\xd8\xff\xe0 evidence"
    outcome, rc = await run(message(STEP, {"type": "destruction", "ref": HERO, "photos": OBJECTS}, event_id="ev_dz"))
    assert outcome == "done"
    body = backend.report("destruction/check")
    assert body["read"] == {
        "before": {"batch": HERO, "count": 140, "confidence": 0.93},
        "after": {"slate": {"batch": HERO, "count": 144, "date": "03-10-26"}, "landfill": True, "destroyed": True},
    }
    assert body["run"]["agent"] == "vision" and body["run"]["eventKey"] == "ev_dz:vision"
    # both photos went to the model, each named, and nothing of the batch's record
    parts = rc.requests[-1]["parts"]
    assert sum("image/jpeg" in str(p) for p in parts) == 2
    assert "BEFORE" in str(parts) and "AFTER" in str(parts) and "144" not in str(parts)


async def test_a_destruction_no_longer_being_read_is_left_alone(run, backend, store):
    backend["GET", CASE] = reading("checked")
    outcome, _ = await run(message(STEP, {"type": "destruction", "ref": HERO, "photos": OBJECTS}))
    assert outcome == "noop"
    assert not [p for _, p, _ in backend.reports() if p.endswith("destruction/check")]


def godown_docs() -> list[dict]:
    note = (
        "A financial credit note: no GST is charged or adjusted on it, and Munchly's output tax on the original sale "
        "stands. Issued against destruction certificate OCE/DC/26-27/0219; adjusted against Rakesh Traders' account."
    )
    return [
        {
            "id": "expiry",
            "type": "Expiry credit note",
            "owner": "Munchly",
            "no": "CN/0118",
            "status": "generated",
            "amount": 3542.4,
            "units": 144,
            "policy": "godown",
            "credit": 3168,
            "gst": 158.4,
            "charges": 216,
            "dp": 22,
            "gstPct": 5,
            "certificate": "OCE/DC/26-27/0219",
            "agency": "Orange City Enviro Services",
            "at": "godown",
            "note": note,
            "date": "2026-10-03",
            "pdf": None,
        },
        {
            "id": "destruction",
            "type": "Destruction certificate",
            "owner": "Orange City Enviro Services",
            "no": "OCE/DC/26-27/0219",
            "status": "generated",
            "amount": 0,
            "units": 144,
            "kg": 21.6,
            "at": "godown",
            "method": "Slit open, buried and covered at the authorised municipal landfill",
            "site": "the municipal landfill, Nagpur",
            "agency": "Orange City Enviro Services",
            "auth": "MPCB/SWM/NGP/0412",
            "for": {"name": "Rakesh Traders", "address": "Kalamna Market, Nagpur", "gstin": "27AABCR1234F1Z5"},
            "from": "Kalamna Market godown",
            "batch": HERO,
            "bestBefore": "2026-11-18",
            "hsn": "2005",
            "destroyedAt": "2026-10-03T13:20",
            "evidence": {"photos": 2, "checks": 4, "of": 4},
            "approvedBy": "Priya Deshmukh",
            "approvedAt": "2026-10-04T11:00",
            "reversed": 158.4,
            "date": "2026-10-04",
            "note": "Destroyed at the municipal landfill, Nagpur on expiry day, from Kalamna Market godown.",
            "pdf": None,
        },
    ]


def test_which_destruction_papers_get_a_pdf():
    expiry, cert = godown_docs()
    assert pdf.needs_pdf(expiry) and pdf.needs_pdf(cert)
    assert not pdf.needs_pdf({**cert, "status": "awaiting"})  # the agency's is still to come
    assert not pdf.needs_pdf({**cert, "at": None})  # the client's own record of what it destroyed


async def test_paperwork_lays_out_the_note_and_the_agencys_certificate(run, backend, store):
    backend["GET", CASE] = case(phase="settled", photo="verified", listing=LISTING, docs=godown_docs())
    backend["POST", f"{CASE}/documents"] = {"ok": True, "noop": True}
    outcome, _ = await run(message(STEP, {"type": "settle", "ref": HERO}))
    assert outcome == "done"
    assert [p for m, p, _ in backend.reports() if m == "PATCH"] == [
        f"/cases/{HERO}/documents/expiry",
        f"/cases/{HERO}/documents/destruction",
    ]
    note = store.objects[("docs-test", f"munchly/{HERO}/expiry.pdf")].decode()
    assert "Destroyed at the godown" in note and "₹3,168.00" in note and "₹158.40" in note and "₹216.00" in note
    assert "₹3,542.40" in note and "Against destruction certificate OCE/DC/26-27/0219" in note
    cert = store.objects[("docs-test", f"munchly/{HERO}/destruction.pdf")].decode()
    assert "OCE/DC/26-27/0219" in cert and "MPCB/SWM/NGP/0412" in cert and "GSTIN 27AABCR1234F1Z5" in cert
    assert "4 of 4 checks passed; approved by Priya Deshmukh" in cert and "₹158.40" in cert

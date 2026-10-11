"""Packs destroyed at the distributor's godown (SC-139): Vision checks the two photos of the evidence and backend-api
holds the read to the batch; Paperwork lays out the expiry credit note's three lines and the agency's certificate once
the operator has approved it, the certificate in full since SC-174: the certificate signed by the agency's officer and
two witnesses, and its log with the two photos, initialled at every step."""

import io

import pytest
from PIL import Image

from sc_agents.agents.common import cut_case
from sc_agents.tools import pdf
from tests.conftest import CASE, HERO, LISTING, C, case, dist, message

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
    assert "destroyed at the godown" in note and "3,168.00" in note and "158.40" in note and "216.00" in note
    assert "₹ 3,542.40" in note and "Issued against destruction certificate OCE/DC/26-27/0219" in note
    cert = store.objects[("docs-test", f"munchly/{HERO}/destruction.pdf")].decode()
    assert "OCE/DC/26-27/0219" in cert and "MPCB/SWM/NGP/0412" in cert and "GSTIN 27AABCR1234F1Z5" in cert
    assert "Vision's checks 4 of 4" in cert and "Priya Deshmukh" in cert and "₹158.40" in cert
    # laid out before SC-174, with no log, officer or witnesses: one page, and no signature it does not have
    assert "Page 1 of 1" in cert and "Destruction log" not in cert and "Supervising officer" not in cert
    # the note is signed for Munchly beside its seal (SC-174)
    assert "marks/signatures/munchly.webp" in note and "marks/seals/munchly.webp" in note
    assert "Vinod Patwardhan, Head of Accounts" in note and "Computer Generated" not in note


# --- the certificate of destruction in full (SC-174) ------------------------------------------------------------------

MANGO_111 = "MF-2407-111"
PHOTOS = {
    "before": f"munchly/{MANGO_111}/destruction-before-dz7",
    "after": f"munchly/{MANGO_111}/destruction-after-dz8",
}


def photo(colour: tuple[int, int, int], fmt: str = "WEBP") -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (60, 40), colour).save(buf, fmt)
    return buf.getvalue()


# the log as design3's papers.js destructionLog works it out for the certificate below
LOG = [
    {
        "at": "2026-09-15T11:40",
        "step": "Photographed at the godown",
        "detail": "184 packs at Kalamna Market godown, the carton's batch label in view",
        "photo": "before",
    },
    {
        "at": "2026-09-15T12:00",
        "step": "Loaded",
        "detail": "On Orange City Enviro Services' covered vehicle MH-31-ZX-0000, sealed with seal SL-0217",
    },
    {
        "at": "2026-09-15T12:40",
        "step": "Received and weighed",
        "detail": "39.56 kg on weighbridge slip WB/26-27/0217, at the facility's gate",
    },
    {
        "at": "2026-09-15T12:55",
        "step": "Slit open and emptied",
        "detail": "Into the active cell, the plastic packaging set aside",
    },
    {"at": "2026-09-15T13:10", "step": "Buried and covered", "detail": "Covered with 30 cm of soil"},
    {
        "at": "2026-09-15T13:20",
        "step": "Photographed with the slate",
        "detail": "Slate: MF-2407-111 · 184 packs · 15/09/2026",
        "photo": "after",
    },
    {
        "at": "2026-09-15T13:30",
        "step": "Packaging sent on",
        "detail": "0.37 kg of plastic film to an EPR-registered recycler",
    },
]


def certificate() -> dict:
    """the agency's certificate of destruction in full, as backend-api's case detail gives it: Rakesh Traders' Mango
    Drink MF-2407-111 from the pilot quarter, destroyed at Orange City Enviro Services' landfill cell (fictional)"""
    return {
        "id": "destruction",
        "type": "Destruction certificate",
        "owner": "Orange City Enviro Services",
        "no": "OCE/DC/26-27/0217",
        "status": "generated",
        "amount": 0,
        "at": "godown",
        "units": 184,
        "kg": 39.56,
        "packKg": 0.37,
        "batch": MANGO_111,
        "goods": "Munchly Mango Drink 200 ml",
        "mfg": "2026-03-19",
        "bestBefore": "2026-09-15",
        "mrp": 20,
        "perCarton": 27,
        "hsn": "2202",
        "agency": "Orange City Enviro Services",
        "auth": "MPCB/SWM/NGP/0412",
        "seal": "oce",
        "for": {
            "name": "Rakesh Traders",
            "address": "Shop 12, Kalamna Market, Nagpur 440035, Maharashtra",
            "gstin": "27ABHPR0000K1ZW",
        },
        "from": "Kalamna Market godown",
        "reason": "expiry",
        "methodId": "landfill",
        "methodName": "Sanitary landfill, CPCB-compliant",
        "methodHow": "the packs slit open and emptied into the active cell, covered with 30 cm of soil the same day; the "
        "plastic packaging segregated for an EPR-registered recycler",
        "method": "Slit open, buried and covered at the authorised municipal landfill",
        "site": "the municipal landfill, Nagpur",
        "facility": {
            "name": "Municipal sanitary landfill, cell 4",
            "address": "Pardi Road, Bhandewadi, Nagpur 440035, Maharashtra",
            "gps": "21.1467° N, 79.1563° E",
        },
        "vehicle": "MH-31-ZX-0000",
        "officer": {"name": "Sachin Bhoyar", "title": "Site supervisor", "sign": "oce"},
        "witnesses": [
            {
                "name": "Pradeep Meshram",
                "address": "Plot 22, Wathoda Layout, Nagpur 440035",
                "proof": "Voter ID, last four 4417",
                "sign": "oce-w1",
            },
            {
                "name": "Asha Kale",
                "address": "House 9, Pardi Naka, Nagpur 440035",
                "proof": "Voter ID, last four 0932",
                "sign": "oce-w2",
            },
        ],
        "window": {"from": "12:55", "to": "13:20"},
        "destroyedOn": "2026-09-15",
        "destroyedAt": "2026-09-15T13:20",
        "photos": {
            "before": {"name": f"{MANGO_111}-before.webp", "at": "2026-09-15T11:40", "object": PHOTOS["before"]},
            "after": {"name": f"{MANGO_111}-after.webp", "at": "2026-09-15T13:20", "object": PHOTOS["after"]},
        },
        "handedBy": {"name": "Rakesh Jaiswal", "title": "Proprietor", "sign": "rakesh"},
        "evidence": {"photos": 2, "checks": 4, "of": 4},
        "approvedBy": "Priya Deshmukh",
        "approvedAt": "2026-09-16T11:00",
        "reversed": 133.4,
        "date": "2026-09-16",
        "log": LOG,
        "pdf": None,
    }


def cleared_111(docs: list[dict] | None = None) -> dict:
    c = case(phase="cleared", photo="verified", which="mango", docs=docs)
    c["distributor"], c["ref"] = dist("rakesh"), MANGO_111
    c["batch"] = {**c["batch"], "id": MANGO_111, "units": 1700, "bestBefore": "2026-09-15", "mfg": "2026-03-19"}
    return c


def test_the_certificate_in_full_is_laid_out_on_two_pages():
    page = pdf.html(certificate(), cut_case(cleared_111()), photos={"before": "data:image/webp;base64,QkVGT1JF"})
    for text in (
        "ORANGE CITY ENVIRO SERVICES",
        "Authorised waste-management agency · authorisation MPCB/SWM/NGP/0412",
        "DESTROYED",
        "Certificate of Destruction",
        "Dated <b>15/09/2026</b>",
        "Page 1 of 2",
        "Munchly Mango Drink 200 ml, HSN 2202, MRP ₹20.00",
        "MF-2407-111</span> (made 19 Mar 2026, best before 15 Sep 2026)",
        "184 packs, 6 cartons of 27 and 22 loose",
        "39.56 kg (39.19 kg food, 0.37 kg packaging)",
        "Rakesh Traders, GSTIN 27ABHPR0000K1ZW",
        "Product expiry: unsold on the best-before",
        "Sanitary landfill, CPCB-compliant (Solid Waste Management Rules, 2016)",
        "Municipal sanitary landfill, cell 4, Pardi Road, Bhandewadi, Nagpur 440035, Maharashtra · 21.1467° N, 79.1563° E",
        "15 Sep 2026, 12:55 to 13:20 IST",
        "₹133.40 input GST reversed by Rakesh Traders, s.17(5)(h)",
        "Signed at the facility, as set out in the log overleaf",
        "Sachin Bhoyar",
        "Site supervisor, Orange City Enviro Services",
        "Pradeep Meshram",
        "Plot 22, Wathoda Layout, Nagpur 440035",
        "Voter ID, last four 4417",
        "Asha Kale",
        "Voter ID, last four 0932",
        "Goods handed over by",
        "Proprietor, Rakesh Traders",
        "Evidence approved by",
        "for Munchly Foods Ltd, 16 Sep 2026, 11:00",
        "two photos · Vision's checks 4 of 4",
        "Destruction log",
        "Page 2 of 2",
        "Photographed with the slate",
        "Slate: MF-2407-111 · 184 packs · 15/09/2026",
        "Initialled at each step by the supervising officer and the two independent witnesses",
    ):
        assert text in page, text
    # the officer signs beside the agency's seal, the witnesses and the distributor by hand
    for mark in ("signatures/oce.webp", "seals/oce.webp", "signatures/oce-w1.webp", "signatures/oce-w2.webp"):
        assert f"marks/{mark}" in page, mark
    assert "marks/signatures/rakesh.webp" in page and "marks/seals/rakesh.webp" not in page
    # every step initialled by all three, and the before photo in its step (the after one could not be read)
    assert page.count('alt="Initialled by Asha Kale"') == len(LOG)
    assert page.count("data:image/webp;base64,QkVGT1JF") == 1 and "the slate in view" not in page


def test_a_witness_with_no_specimen_signs_on_the_original():
    cert = certificate()
    cert["witnesses"][1] = {**cert["witnesses"][1], "sign": None}
    page = pdf.html(cert, cut_case(cleared_111()))
    assert "signed on the original" in page and 'alt="Initialled by Asha Kale"' not in page
    assert "<span>AK</span>" in page  # her initials, written in the log


async def test_paperwork_reads_the_certificates_photos_into_its_log(run, backend, store):
    backend["GET", f"{C}/cases/{MANGO_111}"] = cleared_111([certificate()])
    backend["POST", f"{C}/cases/{MANGO_111}/documents"] = {"ok": True, "noop": True}
    store.objects[("photos-test", PHOTOS["before"])] = photo((120, 96, 70))
    store.objects[("photos-test", PHOTOS["after"])] = photo((90, 80, 60), "JPEG")
    outcome, _ = await run(message(STEP, {"type": "settle", "ref": MANGO_111}))
    assert outcome == "done"
    page = store.objects[("docs-test", f"munchly/{MANGO_111}/destruction.pdf")].decode()
    assert page.count("data:image/jpeg;base64,") == 2 and "the slate in view" in page

    # a photo that is missing, or not a whole image, leaves its step without it, and the certificate is made all the same
    del store.objects[("photos-test", PHOTOS["after"])]
    store.objects[("photos-test", PHOTOS["before"])] = photo((120, 96, 70))[:30]
    del store.objects[("docs-test", f"munchly/{MANGO_111}/destruction.pdf")]
    outcome, _ = await run(message(STEP, {"type": "settle", "ref": MANGO_111}, event_id="ev_2"))
    assert outcome == "done"
    page = store.objects[("docs-test", f"munchly/{MANGO_111}/destruction.pdf")].decode()
    assert "data:image/jpeg;base64," not in page and "Page 2 of 2" in page and "Asha Kale" in page


@pytest.mark.skipif(not pdf.available(), reason="WeasyPrint's system libraries (Pango) are not installed")
def test_weasyprint_renders_the_certificate_on_two_pages():
    from weasyprint import HTML

    photos = {"before": pdf.photo_uri(photo((120, 96, 70))), "after": pdf.photo_uri(photo((90, 80, 60), "PNG"))}
    page = pdf.html(certificate(), cut_case(cleared_111()), photos=photos)
    doc = HTML(string=page, base_url=str(pdf.TEMPLATES)).render()
    assert len(doc.pages) == 2
    assert doc.write_pdf().startswith(b"%PDF")

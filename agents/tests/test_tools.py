"""The small pieces: the figure checks (the same rules as backend-api's copy.py), the formats, the label read's tidy-up,
the backend client's retries and headers, the JSON logs with their trace, and the PDFs."""

import json
import logging

import httpx
import pytest

from sc_agents import checks, fmt, tracing
from sc_agents.agents.vision import mime_of, tidy
from sc_agents.backend import Backend
from sc_agents.errors import Permanent, Stale, Transient
from sc_agents.gcp import FixedToken
from sc_agents.logs import CloudJson
from sc_agents.tools import pdf
from tests.conftest import HERO, STORY, case


def test_figures_are_held_to_the_computed_ones():
    allowed = [21770, 26339.6, 588, 18, 772, 15, 26329.6, 14, 38]
    assert checks.check_numbers("588 to kiranas at ₹18 and 772 at ₹15: net ₹21,770, against ₹26,330.", allowed)
    assert checks.check_numbers("Two exits, one tap, 38 kiranas, 14 days.", allowed)
    assert not checks.check_numbers("53% of MRP", allowed)
    assert not checks.check_numbers("₹5 for all", allowed)  # money is never a counting word
    assert checks.check_numbers("Buy 10, get 2 free", [10])
    assert checks.foreign("₹19 for 600 units", allowed) == [19, 600]


def test_a_reply_states_the_decided_price_and_never_the_reserve():
    ok = "₹14.20 a pack for all 772, dispatch within 24 hours of the balance."
    assert checks.reply_ok(ok, decided=14.2, others=[15, 772, 24], reserve=13.5)
    assert not checks.reply_ok("₹14.20, and no lower than ₹13.50.", decided=14.2, others=[15, 772, 24], reserve=13.5)
    assert not checks.reply_ok("We can do a little less.", decided=14.2, others=[15, 772, 24], reserve=13.5)
    assert checks.reply_ok("₹15 for 772 is accepted.", decided=15, others=[15, 772, 24], reserve=13.5)


@pytest.mark.parametrize(
    ("raw", "iso"),
    [
        ("2026-11-18", "2026-11-18"),
        ("18/11/2026", "2026-11-18"),
        ("18-11-26", "2026-11-18"),
        ("18.11.2026", "2026-11-18"),
        ("18 Nov 2026", "2026-11-18"),
        ("18 November, 2026", "2026-11-18"),
        ("Nov 18, 2026", "2026-11-18"),
        ("18-Nov-2026", "2026-11-18"),
        ("18 NOV 26", "2026-11-18"),
        ("31/02/2026", None),
        ("soon", None),
        (None, None),
    ],
)
def test_label_dates(raw, iso):
    assert checks.iso_date(raw) == iso


def test_a_read_is_tidied_as_backend_api_compares_it():
    out = tidy(
        {"batch": "mf-2409- 117", "mfg": "18/05/2026", "bestBefore": "18 Nov 2026", "mrp": "₹30.00", "confidence": 1.4}
    )
    assert out == {
        "batch": "MF-2409-117",
        "mfg": "2026-05-18",
        "bestBefore": "2026-11-18",
        "mrp": 30.0,
        "pack": None,
        "confidence": 1.0,
    }
    blind = tidy({"batch": None, "confidence": 0.95})
    assert blind["confidence"] == 0.5  # nothing to verify: no confidence in it
    assert mime_of(b"\x89PNG\r\n\x1a\n...") == "image/png" and mime_of(b"RIFF....WEBPVP8") == "image/webp"


def test_formats():
    assert fmt.inr(21770.4) == "₹21,770" and fmt.inr(123456789) == "₹12,34,56,789" and fmt.inr(-1.4) == "−₹1"
    assert fmt.inr2(14.2) == "₹14.20" and fmt.price(18) == "₹18" and fmt.price(17.5) == "₹17.50"
    assert fmt.day("2026-11-18") == "18 Nov 2026" and fmt.base("Masala Chips 150 g") == "Masala Chips"
    from datetime import date

    assert fmt.fiscal_quarter(date(2026, 10, 7)) == "FY27 Q3" and fmt.fiscal_quarter(date(2027, 2, 1)) == "FY27 Q4"
    assert fmt.fiscal_quarter(date(2026, 4, 1)) == "FY27 Q1"


async def test_the_backend_client_retries_a_5xx_then_gives_up():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(502 if len(seen) < 3 else 200, json={"ok": True})

    b = Backend("http://api", FixedToken("t"), transport=httpx.MockTransport(handler), retries=3, backoff=0)
    assert await b.post("/internal/x", {"a": 1}) == {"ok": True}
    assert len(seen) == 3 and all(r.headers["authorization"] == "Bearer t" for r in seen)

    always = Backend(
        "http://api", FixedToken(), transport=httpx.MockTransport(lambda r: httpx.Response(500)), backoff=0
    )
    with pytest.raises(Transient):
        await always.get("/internal/y")


@pytest.mark.parametrize(("status", "error"), [(404, Stale), (409, Stale), (422, Permanent), (403, Transient)])
async def test_the_backend_client_sorts_its_errors(status, error):
    b = Backend("http://api", FixedToken(), transport=httpx.MockTransport(lambda r: httpx.Response(status, json={})))
    with pytest.raises(error):
        await b.get("/internal/z")


async def test_the_backend_client_sends_the_runs_trace():
    seen = []
    b = Backend(
        "http://api",
        FixedToken(),
        transport=httpx.MockTransport(lambda r: seen.append(r) or httpx.Response(200, json={})),
    )
    with tracing.continue_from(f"00-{'ab' * 16}-{'cd' * 8}-01", "test"):
        await b.get("/internal/t")
    assert seen[0].headers["traceparent"].startswith(f"00-{'ab' * 16}-")


def test_json_logs_carry_the_trace():
    f = CloudJson("aibuilder-510213")
    with tracing.continue_from(f"00-{'12' * 16}-{'34' * 8}-01", "test"):
        record = logging.LogRecord("sc_agents.x", logging.INFO, __file__, 1, "run %s done", ("r1",), None)
        line = json.loads(f.format(record))
    assert line["message"] == "run r1 done" and line["severity"] == "INFO"
    assert line["logging.googleapis.com/trace"] == f"projects/aibuilder-510213/traces/{'12' * 16}"


# --- the PDFs ------------------------------------------------------------------------------------------------------------


def paper(doc_id: str) -> tuple[dict, dict]:
    from sc_agents.agents.common import cut_case

    doc = next(d for d in STORY["docs"] if d["id"] == doc_id)
    return doc, cut_case(case(phase="settled", photo="verified", docs=STORY["docs"]))


def test_each_paper_lays_out_backend_apis_figures():
    doc, c = paper("invoice")
    page = pdf.html(doc, c, note="Issue it from Tally.", today="2026-10-04")
    for text in (
        "Tax invoice",
        "INV/26-27/0931",
        "Agrawal Wholesale",
        "22AAGFA4821M1Z3",
        "₹14.20",
        "₹10,962.40",
        "₹548.00",
        "₹11,510.00",
        "Issue it from Tally.",
    ):
        assert text in page, text
    doc, c = paper("support")
    page = pdf.html(doc, c)
    assert "CN/0117" in page and "₹8,768" in page and "₹6,021.60" in page and "Rakesh Traders" in page
    doc, c = paper("itc")
    assert "₹1,224.00" in pdf.html(doc, c) and "17(5)(h)" in pdf.html(doc, c)
    assert [d["id"] for d in STORY["docs"] if pdf.needs_pdf(d)] == ["invoice", "support", "itc"]
    assert HERO in page


@pytest.mark.skipif(not pdf.available(), reason="WeasyPrint's system libraries (Pango) are not installed")
def test_weasyprint_renders_a_paper():
    doc, c = paper("invoice")
    data = pdf.render(pdf.html(doc, c, today="2026-10-04"))
    assert data.startswith(b"%PDF") and len(data) > 2000


def test_journey_days_are_indias():
    from sc_agents.agents.common import ist_day, journey_today

    assert ist_day("2026-10-02T20:00:00+00:00") == "2026-10-03" and ist_day("2026-10-02T10:00:00") == "2026-10-02"
    assert journey_today({"now": "2026-10-02T03:35:00+00:00"}) == "2026-10-02"


@pytest.mark.parametrize(
    "text",
    ["best before 18 Nov 2026", "best before Nov 18, 2026", "by 18 November", "on 2026-11-18", "BB 18/11/26"],
)
def test_a_dates_day_is_not_a_price(text):
    assert not checks.shows(text, 18.0)


@pytest.mark.parametrize("text", ["not under ₹18", "18 a pack", "Rs 18.00", "₹18 on 18 Nov"])
def test_a_price_still_shows(text):
    assert checks.shows(text, 18.0)

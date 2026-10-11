"""Paperwork (settle): once the buyer's truck is loaded (or the food bank has collected), backend-api drafts the papers
(money.py's documents, numbered in sequence) and Paperwork renders each one a person signs as a PDF.

1. `POST …/documents`: the invoice draft, the e-way bill check, the price-support credit note, the ITC memo and the
   FSSAI checklist, with their figures.
2. `GET …` gives them in full (`docsFull`); each paper (invoice, credit note, ITC memo, FSSAI checklist) is laid out
   from a Jinja2 template and rendered by WeasyPrint.
3. Each PDF goes into the docs bucket as `{client}/{ref}/{doc}.pdf`, then `PATCH …/documents/{doc} {object}`.

A redelivered event renders whatever has no PDF yet. Gemini Flash may write a one-line cover note for the footer: no
figures, nothing to check against, and the PDF is complete without it.

The food bank's receipt (SC-110) is issued as it collects, before the batch's pack: `journey.step receipt` lays it out
at once, as `{client}/{ref}/receipt.pdf`, and the pack then carries it with its PDF.

Each kirana's tax invoice (SC-153) is issued as the shop orders: `journey.step kirana` lays it out as
`{client}/{ref}/kirana-{shop}.pdf`, then `PATCH …/documents/kirana.{shop} {object}`.

Every paper is signed by its signatory (SC-174): the distributor's over his stamp, the client's and the agency's beside
their round seals. The agency's certificate of destruction is laid out in full, the certificate and its log, the log
carrying the before and after photos read from the photos bucket; a photo that cannot be read leaves its step without
it, and the paper is made all the same.
"""

import asyncio
import json
import logging
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from sc_agents import checks
from sc_agents.agents import halt, step
from sc_agents.agents.common import cut_case
from sc_agents.backend import case_path
from sc_agents.models import STRUCTURED, writer
from sc_agents.runs import RunCtx
from sc_agents.tools import pdf

log = logging.getLogger("sc_agents.paperwork")
AGENT = "paperwork"
NOTE_MAX = 140


class Note(BaseModel):
    # every field required: Gemini's structured output may leave out a property the schema does not require (SC-77)
    note: str = Field(description="the note on the pack of papers")


def _on(state: dict[str, Any]) -> bool:
    return (state.get("settings") or {}).get("on", {}).get(AGENT, True)


async def _draft(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    rc.run(AGENT)
    await rc.report(AGENT, case_path(rc.msg.client, rc.msg.ref or "", "documents"), {})
    case = cut_case(await rc.deps.backend.case(rc.msg.client, rc.msg.ref or ""))
    papers = [d for d in case["docs"] if pdf.needs_pdf(d)]
    if not papers:
        return {**halt(), "case": case}
    return {"case": case, "papers": [d["id"] for d in papers]}


def _parts(state: dict[str, Any]) -> list[types.Part]:
    case = state["case"]
    facts = {
        "papers": [d.get("type") for d in case["docs"] if d["id"] in state["papers"]],
        "product": f"{case['sku'].get('brand', '')} {case['sku'].get('name', '')}".strip(),
        "distributor": case["distributor"].get("name"),
    }
    return [types.Part(text="THE PAPERS:\n" + json.dumps(facts, ensure_ascii=False))]


async def _photos(rc: RunCtx, case: dict[str, Any], doc: dict[str, Any]) -> dict[str, str]:
    """the certificate of destruction's before and after photos as data: URIs, those that can be read (SC-174)"""
    if doc.get("id") != "destruction":
        return {}
    bucket = case.get("photosBucket") or rc.settings.photos_bucket
    out: dict[str, str] = {}
    for which, photo in (doc.get("photos") or {}).items():
        name = (photo or {}).get("object") if isinstance(photo, dict) else None
        if not name or not bucket:
            continue
        try:
            out[which] = pdf.photo_uri(await rc.deps.store.read(bucket, name))
        except Exception as e:  # the certificate stands without its photo
            log.warning("paperwork: the destruction's %s photo gs://%s/%s: %s", which, bucket, name, e)
    return out


async def _file(
    rc: RunCtx, case: dict[str, Any], doc: dict[str, Any], *, note: str | None, today: str, name: str | None = None
) -> bool:
    """one paper laid out, rendered, put in the docs bucket and reported; False when this host cannot render PDFs"""
    run = rc.run(AGENT)
    bucket = case.get("docsBucket") or rc.settings.docs_bucket
    if not bucket:
        raise RuntimeError("no docs bucket (DOCS_BUCKET)")
    page = pdf.html(doc, case, note=note, today=today, photos=await _photos(rc, case, doc))
    try:
        data = await asyncio.to_thread(rc.deps.render_pdf, page)
    except OSError as e:  # WeasyPrint's system libraries are missing: a deployment to fix, not a retry
        log.error("paperwork: cannot render PDFs here (%s); the papers stay without them", e)
        run.note = "no PDF renderer"
        return False
    name = name or f"{rc.msg.client}/{case['ref']}/{doc['id']}.pdf"
    await rc.deps.store.write(bucket, name, data, "application/pdf")
    await rc.report(
        AGENT,
        case_path(rc.msg.client, rc.msg.ref or "", f"documents/{doc['id']}"),
        {"object": name},
        method="PATCH",
    )
    run.status = "done"  # a redelivered event's drafting was a noop, but its PDFs were made now
    return True


async def _render(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT)
    case = state["case"]
    note = " ".join(str((state.get("paperwork_note") or {}).get("note") or "").split())
    if note and (len(note) > NOTE_MAX or checks.figures(note)):
        run.fell_back("note left out")
        note = ""
    today = (state.get("settings") or {}).get("today", "")
    for doc in case["docs"]:
        if doc["id"] in state["papers"] and not await _file(rc, case, doc, note=note or None, today=today):
            return {}
    return {}


async def _receipt(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    """the food bank's receipt, laid out as it collected (SC-110), dated the day it was issued"""
    run = rc.run(AGENT)
    case = cut_case(await rc.deps.backend.case(rc.msg.client, rc.msg.ref or ""))
    doc = (case.get("donation") or {}).get("receipt")
    if not doc or doc.get("pdf"):  # none issued, or a redelivered event
        run.status = "noop"
        return halt()
    await _file(rc, case, doc, note=None, today=doc.get("date") or "")
    return {}


def receipt(rc: RunCtx) -> list:
    return [step(rc, "paperwork_receipt", _receipt, agent=AGENT, when=_on)]


async def _kirana(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    """a kirana's tax invoice from the distributor, laid out as the shop ordered (SC-153), dated the day it ordered"""
    run = rc.run(AGENT)
    case = cut_case(await rc.deps.backend.case(rc.msg.client, rc.msg.ref or ""))
    shop = str(rc.msg.payload.get("kirana") or "")
    inv = next((o["invoice"] for o in case.get("orders") or [] if o.get("id") == shop), None)
    if not inv or inv.get("pdf"):  # none issued, or a redelivered event
        run.status = "noop"
        return halt()
    doc = {**inv, "id": f"kirana.{shop}", "type": "Tax invoice"}
    name = f"{rc.msg.client}/{case['ref']}/kirana-{shop}.pdf"
    await _file(rc, case, doc, note=None, today=inv.get("date") or "", name=name)
    return {}


def kirana(rc: RunCtx) -> list:
    return [step(rc, "paperwork_kirana", _kirana, agent=AGENT, when=_on)]


def settle(rc: RunCtx) -> list:
    ready = lambda s: _on(s) and bool(s.get("papers"))  # noqa: E731
    return [
        step(rc, "paperwork_draft", _draft, agent=AGENT, when=_on),
        writer(
            rc,
            name="paperwork_note",
            agent=AGENT,
            tier="flash",
            prompt_name="paperwork_note",
            schema=Note,
            output_key="paperwork_note",
            parts=_parts,
            temperature=STRUCTURED,
            when=ready,
        ),
        step(rc, "paperwork_render", _render, agent=AGENT, when=ready),
    ]

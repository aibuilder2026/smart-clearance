"""Paperwork (settle): once the buyer's truck is loaded (or the food bank has collected), backend-api drafts the papers
(money.py's documents, numbered in sequence) and Paperwork renders each one a person signs as a PDF.

1. `POST …/documents`: the invoice draft, the e-way bill check, the price-support credit note, the ITC memo and the
   FSSAI checklist, with their figures.
2. `GET …` gives them in full (`docsFull`); each paper (invoice, credit note, ITC memo, FSSAI checklist) is laid out
   from a Jinja2 template and rendered by WeasyPrint.
3. Each PDF goes into the docs bucket as `{client}/{ref}/{doc}.pdf`, then `PATCH …/documents/{doc} {object}`.

A redelivered event renders whatever has no PDF yet. Gemini Flash may write a one-line cover note for the footer: no
figures, nothing to check against, and the PDF is complete without it.
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


async def _render(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT)
    case = state["case"]
    note = " ".join(str((state.get("paperwork_note") or {}).get("note") or "").split())
    if note and (len(note) > NOTE_MAX or checks.figures(note)):
        run.fell_back("note left out")
        note = ""
    bucket = case.get("docsBucket") or rc.settings.docs_bucket
    if not bucket:
        raise RuntimeError("no docs bucket (DOCS_BUCKET)")
    today = (state.get("settings") or {}).get("today", "")
    for doc in case["docs"]:
        if doc["id"] not in state["papers"]:
            continue
        page = pdf.html(doc, case, note=note or None, today=today)
        try:
            data = await asyncio.to_thread(rc.deps.render_pdf, page)
        except OSError as e:  # WeasyPrint's system libraries are missing: a deployment to fix, not a retry
            log.error("paperwork: cannot render PDFs here (%s); the papers stay without them", e)
            run.note = "no PDF renderer"
            return {}
        name = f"{rc.msg.client}/{case['ref']}/{doc['id']}.pdf"
        await rc.deps.store.write(bucket, name, data, "application/pdf")
        await rc.report(
            AGENT,
            case_path(rc.msg.client, rc.msg.ref or "", f"documents/{doc['id']}"),
            {"object": name},
            method="PATCH",
        )
        run.status = "done"  # a redelivered event's drafting was a noop, but its PDFs were made now
    return {}


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

"""Vision (verify): asks the distributor for one label photo when a batch is flagged, then reads it with Gemini Flash.

- `batch.at_risk` → `POST …/photo-request`: no model. backend-api asks the distributor (or, when the client needs no
  photo, sends the Valuer on).
- `journey.step {type: decide}` → the photo from the photos bucket, read by Gemini Flash (multimodal) into
  {batch, mfg, bestBefore, mrp, pack, confidence}, then `POST …/photo-read {read}`. backend-api holds the read to the
  DMS record: a mismatch, or a confidence under the client's threshold, asks for another photo and the pipeline stops.

The model is not shown the DMS record, so it reads what is printed rather than what is expected. A read the model
could not make (an error, a timeout) is tried again on Pub/Sub's next delivery; on the last one an empty read goes,
which asks the distributor for another photo.
"""

from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from sc_agents import checks
from sc_agents.agents import halt, step
from sc_agents.backend import case_path
from sc_agents.errors import Transient
from sc_agents.models import STRUCTURED, writer
from sc_agents.runs import RunCtx

AGENT = "vision"


class LabelRead(BaseModel):
    batch: str | None = Field(default=None, description="the batch number exactly as printed, e.g. MF-2409-117")
    mfg: str | None = Field(default=None, description="the manufacturing (or packing) date, YYYY-MM-DD")
    bestBefore: str | None = Field(default=None, description="the best-before (use-by, expiry) date, YYYY-MM-DD")
    mrp: float | None = Field(default=None, description="the MRP in rupees")
    pack: str | None = Field(default=None, description="the product and pack size as printed")
    confidence: float | None = Field(default=None, description="0 to 1: how sure every returned field is exact")


def mime_of(data: bytes) -> str:
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[4:12] in (b"ftypheic", b"ftypheix", b"ftypmif1"):
        return "image/heic"
    return "image/jpeg"


def tidy(read: dict[str, Any]) -> dict[str, Any]:
    """a model's read as backend-api compares it: the batch as the DMS writes it, ISO dates, the MRP as a number"""
    confidence = read.get("confidence")
    try:
        confidence = min(1.0, max(0.0, float(confidence))) if confidence is not None else 0.0
    except (TypeError, ValueError):
        confidence = 0.0
    out = {
        "batch": checks.batch_no(read.get("batch")),
        "mfg": checks.iso_date(read.get("mfg")),
        "bestBefore": checks.iso_date(read.get("bestBefore")),
        "mrp": checks.money(read.get("mrp")),
        "pack": (str(read["pack"]).strip()[:120] or None) if read.get("pack") else None,
        "confidence": round(confidence, 3),
    }
    if not out["batch"]:  # nothing to verify against: no confidence in the read
        out["confidence"] = min(out["confidence"], 0.5)
    return out


# --- asking for the photo ---------------------------------------------------------------------------------------------


async def _ask(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    rc.run(AGENT)
    await rc.report(AGENT, case_path(rc.msg.client, rc.msg.ref or "", "photo-request"), {})
    return {}


def ask(rc: RunCtx) -> list:
    return [step(rc, "vision_ask", _ask, agent=AGENT, when=_on)]


# --- reading it -------------------------------------------------------------------------------------------------------


def _on(state: dict[str, Any]) -> bool:
    return (state.get("settings") or {}).get("on", {}).get(AGENT, True)


def due(state: dict[str, Any]) -> bool:
    case = state.get("case") or {}
    return _on(state) and case.get("phase") == "at-risk" and case.get("photo") == "reading"


async def _photo(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    case = state["case"]
    name = rc.msg.payload.get("photo") or case.get("photoObject")
    bucket = case.get("photosBucket") or rc.settings.photos_bucket
    if not name or not bucket:
        return {"halt": True}
    try:
        data = await rc.deps.store.read(bucket, name)
    except Exception as e:
        raise Transient(f"the label photo gs://{bucket}/{name}: {e}") from e
    rc.blobs["photo"] = (data, mime_of(data))
    rc.run(AGENT)
    return {"photo": name}


def _parts(rc: RunCtx):
    def parts(state: dict[str, Any]) -> list[types.Part]:
        data, mime = rc.blobs["photo"]
        return [
            types.Part.from_bytes(data=data, mime_type=mime),
            types.Part(text="Read this carton label. Return only what is printed on it."),
        ]

    return parts


async def _report(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT)
    read = state.get("vision_read") or {}
    if not read:
        run.fell_back("no read")
        if rc.msg.attempt < rc.settings.max_attempts:
            raise Transient("Vision could not read the label: Pub/Sub tries again")
    out = await rc.report(AGENT, case_path(rc.msg.client, rc.msg.ref or "", "photo-read"), {"read": tidy(read)})
    if out.get("noop"):
        return halt()
    if out.get("result") is False:  # a retake was asked for: the Valuer waits for the next photo
        return {**halt(), "retake": True}
    return {"case": {**state["case"], "phase": "verified", "photo": "verified"}}


def read(rc: RunCtx) -> list:
    return [
        step(rc, "vision_photo", _photo, agent=AGENT, when=due),
        writer(
            rc,
            name="vision_read",
            agent=AGENT,
            tier="flash",
            prompt_name="vision",
            schema=LabelRead,
            output_key="vision_read",
            parts=_parts(rc),
            temperature=STRUCTURED,
            selector=lambda s: s.get("photo") or "",
            when=lambda s: due(s) and "photo" in s,
        ),
        step(rc, "vision_report", _report, agent=AGENT, when=lambda s: due(s) and "photo" in s),
    ]

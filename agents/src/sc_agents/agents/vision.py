"""Vision (verify): asks the distributor for one label photo when a batch is flagged, then reads it with Gemini Flash;
and on expiry day checks the evidence of packs destroyed at his godown (SC-139).

- `batch.at_risk` → `POST …/photo-request`: no model. backend-api asks the distributor (or, when the client needs no
  photo, sends the Valuer on).
- `journey.step {type: decide}` → the photo from the photos bucket, read by Gemini Flash (multimodal) into
  {batch, mfg, bestBefore, mrp, pack, confidence}, then `POST …/photo-read {read}`. backend-api holds the read to the
  DMS record: a mismatch, or a confidence under the client's threshold, asks for another photo and the pipeline stops.

- `journey.step {type: destruction}` → the two photos (before, at the godown; after, at the landfill), read together by
  Gemini Flash into {before: {batch, count}, after: {slate: {batch, count, date}, landfill, destroyed}}, then
  `POST …/destruction/check {read}`. backend-api holds the read to the batch; the operator decides on the yes.
- `journey.step {type: staffReceipt}` → the staff sale's consolidated receipt (SC-174), a photo or a PDF from the photos
  bucket, read by Gemini Flash into {no, date, payments: [{rrn, payer, at, amount}], total}, then
  `POST …/staff/receipt/read {id, read}`. backend-api holds the payments' total to the packs he counted.

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
    # every field required, null where the label does not show it: with each optional, Gemini's structured output
    # often returned only `confidence`, and a read with nothing in it passed for a read (SC-77)
    batch: str | None = Field(description="the batch number exactly as printed, e.g. MF-2409-117; null if unreadable")
    mfg: str | None = Field(description="the manufacturing (or packing) date, YYYY-MM-DD; null if unreadable")
    bestBefore: str | None = Field(description="the best-before (use-by, expiry) date, YYYY-MM-DD; null if unreadable")
    mrp: float | None = Field(description="the MRP in rupees; null if unreadable")
    pack: str | None = Field(description="the product and pack size as printed; null if unreadable")
    confidence: float = Field(description="0 to 1: how sure every field returned is exact")


def mime_of(data: bytes) -> str:
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[4:12] in (b"ftypheic", b"ftypheix", b"ftypmif1"):
        return "image/heic"
    if data[:5] == b"%PDF-":  # a staff sale's receipt may be a PDF (SC-174)
        return "application/pdf"
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


# --- checking the destruction's evidence (SC-139) --------------------------------------------------------------------


class BeforeRead(BaseModel):
    # every field required, null where the photo does not show it (SC-77)
    batch: str | None = Field(
        description="the batch number on a carton's label, exactly as printed; null if none is readable"
    )
    count: int | None = Field(
        description="how many packs are in view, counted or closely estimated; null if they cannot be"
    )
    confidence: float = Field(description="0 to 1: how sure the batch and the count are right")


class Slate(BaseModel):
    batch: str | None = Field(description="the batch number written on the slate; null if none")
    count: int | None = Field(description="the count of packets written on the slate; null if none")
    date: str | None = Field(description="the date written on the slate, as written (e.g. 03-10-26); null if none")


class AfterRead(BaseModel):
    slate: Slate
    landfill: bool = Field(
        description="true if the photo shows a landfill or disposal site: a pit, waste, earth-moving"
    )
    destroyed: bool = Field(
        description="true if the packs are visibly slit open, crushed or buried, no longer sellable"
    )


class DestructionRead(BaseModel):
    before: BeforeRead
    after: AfterRead


def tidy_destruction(read: dict[str, Any]) -> dict[str, Any]:
    """the model's read as backend-api holds it to the batch: the batch as the DMS writes it, whole counts"""

    def count(v: Any) -> int | None:
        try:
            n = round(float(v))
        except (TypeError, ValueError):
            return None
        return n if n >= 0 else None

    before, after = read.get("before") or {}, read.get("after") or {}
    slate = after.get("slate") or {}
    confidence = before.get("confidence")
    try:
        confidence = min(1.0, max(0.0, float(confidence))) if confidence is not None else 0.0
    except (TypeError, ValueError):
        confidence = 0.0
    return {
        "before": {
            "batch": checks.batch_no(before.get("batch")),
            "count": count(before.get("count")),
            "confidence": round(confidence, 3),
        },
        "after": {
            "slate": {
                "batch": checks.batch_no(slate.get("batch")),
                "count": count(slate.get("count")),
                "date": (str(slate["date"]).strip()[:12] or None) if slate.get("date") else None,
            },
            "landfill": bool(after.get("landfill")),
            "destroyed": bool(after.get("destroyed")),
        },
    }


def destruction_due(state: dict[str, Any]) -> bool:
    case = state.get("case") or {}
    return _on(state) and (case.get("destruction") or {}).get("status") == "reading"


async def _dz_photos(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    case = state["case"]
    names = rc.msg.payload.get("photos") or {}
    bucket = case.get("photosBucket") or rc.settings.photos_bucket
    if not names.get("before") or not names.get("after") or not bucket:
        return {"halt": True}
    for which in ("before", "after"):
        try:
            data = await rc.deps.store.read(bucket, names[which])
        except Exception as e:
            raise Transient(f"the destruction's {which} photo gs://{bucket}/{names[which]}: {e}") from e
        rc.blobs[f"dz_{which}"] = (data, mime_of(data))
    rc.run(AGENT)
    return {"dz_photos": names}


def _dz_parts(rc: RunCtx):
    def parts(state: dict[str, Any]) -> list[types.Part]:
        before, bm = rc.blobs["dz_before"]
        after, am = rc.blobs["dz_after"]
        return [
            types.Part(text="BEFORE: the expired packs at the distributor's godown."),
            types.Part.from_bytes(data=before, mime_type=bm),
            types.Part(text="AFTER: the same packs at the disposal site."),
            types.Part.from_bytes(data=after, mime_type=am),
            types.Part(text="Read both photos. Return only what you can see."),
        ]

    return parts


async def _dz_report(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT)
    read = state.get("vision_destruction") or {}
    if not read:
        run.fell_back("no read")
        if rc.msg.attempt < rc.settings.max_attempts:
            raise Transient("Vision could not read the destruction's photos: Pub/Sub tries again")
    out = await rc.report(
        AGENT, case_path(rc.msg.client, rc.msg.ref or "", "destruction/check"), {"read": tidy_destruction(read)}
    )
    if out.get("noop"):
        return halt()
    return {}


def destruction(rc: RunCtx) -> list:
    return [
        step(rc, "vision_dz_photos", _dz_photos, agent=AGENT, when=destruction_due),
        writer(
            rc,
            name="vision_destruction",
            agent=AGENT,
            tier="flash",
            prompt_name="vision_destruction",
            schema=DestructionRead,
            output_key="vision_destruction",
            parts=_dz_parts(rc),
            temperature=STRUCTURED,
            selector=lambda s: (s.get("dz_photos") or {}).get("before", ""),
            when=lambda s: destruction_due(s) and "dz_photos" in s,
        ),
        step(rc, "vision_dz_report", _dz_report, agent=AGENT, when=lambda s: destruction_due(s) and "dz_photos" in s),
    ]


# --- reading the staff sale's consolidated receipt (SC-174) -----------------------------------------------------------


class ReceiptPayment(BaseModel):
    # every field required, null where the row does not show it (SC-77)
    rrn: str | None = Field(
        description="the payment's UPI reference (UPI Ref. No., the 12-digit RRN), digits only; null if unreadable"
    )
    payer: str | None = Field(description="who paid, as printed; null if none is shown")
    at: str | None = Field(description="the payment's date and time, as printed; null if none is shown")
    amount: float | None = Field(description="the amount paid in rupees; null if unreadable")


class ReceiptRead(BaseModel):
    no: str | None = Field(description="the receipt's own number, as printed (e.g. LA/SR/26-27/0002); null if none")
    date: str | None = Field(description="the receipt's date, as printed; null if none")
    payments: list[ReceiptPayment] = Field(description="every payment row on the receipt, in the printed order")
    total: float | None = Field(description="the total as printed on the receipt, in rupees; null if none is printed")
    confidence: float = Field(description="0 to 1: how sure every reference and amount returned is exact")


RRN = 12


def tidy_receipt(read: dict[str, Any]) -> dict[str, Any]:
    """the model's read as backend-api holds it to the count: each UPI reference as its 12 digits (else null), each
    amount to the paisa, no row with neither a reference nor an amount"""

    def text(v: Any, cap: int) -> str | None:
        return (" ".join(str(v).split())[:cap] or None) if v is not None else None

    def rupees(v: Any) -> float | None:
        n = checks.money(v)
        return round(n, 2) if n is not None else None

    payments = []
    for p in read.get("payments") or []:
        if not isinstance(p, dict):
            continue
        digits = "".join(c for c in str(p.get("rrn") or "") if c.isdigit())
        row = {
            "rrn": digits if len(digits) == RRN else None,
            "payer": text(p.get("payer"), 80),
            "at": text(p.get("at"), 40),
            "amount": rupees(p.get("amount")),
        }
        if row["rrn"] or row["amount"] is not None:
            payments.append(row)
    confidence = read.get("confidence")
    try:
        confidence = min(1.0, max(0.0, float(confidence))) if confidence is not None else 0.0
    except (TypeError, ValueError):
        confidence = 0.0
    return {
        "no": text(read.get("no"), 40),
        "date": text(read.get("date"), 20),
        "payments": payments,
        "total": rupees(read.get("total")),
        "confidence": round(confidence, 3),
    }


def receipt_due(rc: RunCtx):
    """the case's staff sale has a receipt being read, and it is the one this event names (a receipt sent again since
    has its own event)"""

    def due(state: dict[str, Any]) -> bool:
        r = (state.get("case") or {}).get("staffReceipt") or {}
        want = (rc.msg.payload.get("receipt") or {}).get("id")
        return _on(state) and r.get("status") == "reading" and (not want or not r.get("id") or r["id"] == want)

    return due


async def _sr_file(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    case = state["case"]
    receipt = rc.msg.payload.get("receipt") or {}
    bucket = case.get("photosBucket") or rc.settings.photos_bucket
    name = receipt.get("object")
    if not name or not bucket:
        return {"halt": True}
    try:
        data = await rc.deps.store.read(bucket, name)
    except Exception as e:
        raise Transient(f"the staff sale's receipt gs://{bucket}/{name}: {e}") from e
    kind = str(receipt.get("contentType") or "")
    mime = kind if kind == "application/pdf" or kind.startswith("image/") else mime_of(data)
    rc.blobs["receipt"] = (data, mime)
    rc.run(AGENT)
    return {"sr_file": name}


def _sr_parts(rc: RunCtx):
    def parts(state: dict[str, Any]) -> list[types.Part]:
        data, mime = rc.blobs["receipt"]
        return [
            types.Part(text="The distributor's consolidated receipt for a staff sale at his godown."),
            types.Part.from_bytes(data=data, mime_type=mime),
            types.Part(text="Read every payment on it. Return only what is printed."),
        ]

    return parts


async def _sr_report(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT)
    read = state.get("vision_staff_receipt") or {}
    if not read:
        run.fell_back("no read")
        if rc.msg.attempt < rc.settings.max_attempts:
            raise Transient("Vision could not read the staff sale's receipt: Pub/Sub tries again")
    receipt = rc.msg.payload.get("receipt") or {}
    rid = receipt.get("id") or (state["case"].get("staffReceipt") or {}).get("id")
    out = await rc.report(
        AGENT,
        case_path(rc.msg.client, rc.msg.ref or "", "staff/receipt/read"),
        {"id": rid, "read": tidy_receipt(read)},
    )
    if out.get("noop"):
        return halt()
    return {}


def staff_receipt(rc: RunCtx) -> list:
    due = receipt_due(rc)
    return [
        step(rc, "vision_sr_file", _sr_file, agent=AGENT, when=due),
        writer(
            rc,
            name="vision_staff_receipt",
            agent=AGENT,
            tier="flash",
            prompt_name="vision_staff_receipt",
            schema=ReceiptRead,
            output_key="vision_staff_receipt",
            parts=_sr_parts(rc),
            temperature=STRUCTURED,
            selector=lambda s: s.get("sr_file") or "",
            when=lambda s: due(s) and "sr_file" in s,
        ),
        step(rc, "vision_sr_report", _sr_report, agent=AGENT, when=lambda s: due(s) and "sr_file" in s),
    ]

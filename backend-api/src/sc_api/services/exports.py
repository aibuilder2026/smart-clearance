"""A client's stock export, set up by staff in the console (SC-84): the file goes to the exports bucket through a
signed link and on to the Data agent, as the workspace's Setup upload does (journey.step `export.uploaded`), and the
client keeps who uploaded it and when (`workspace_doc.firstExport`). Its mapping is the Data agent's report
(`steps.record_export`: `setup_mapped`, `last_import`), which marks the upload mapped once it names that file. A
journey reset keeps both, so the workspace's Setup opens mapped and its operator only confirms the guardrails."""

from datetime import timedelta
from typing import Any

from sc_api import models as m
from sc_api.domain import copy
from sc_api.domain import journey as J
from sc_api.errors import ApiError
from sc_api.services import audit
from sc_api.services.context import Ctx
from sc_api.services.journey import events as ev
from sc_api.services.presenter import lock_client

MAX_BYTES = 20 * 1024 * 1024
# the Smart-Clearance fields a stock export fills, in the order Setup and the console show them (the Data agent's)
FIELDS = ("distributor", "sku", "batch", "mfg", "best_before", "units", "godown", "pincode")


def _name(client_id: str, export_id: str) -> str:
    return f"{client_id}/uploads/{export_id}.csv"


async def upload_link(ctx: Ctx, client_id: str, content_type: str | None, size: int) -> dict[str, Any]:
    """a signed link the console uploads the client's export to"""
    ctx.require("clients.configure", "Your role can't upload a client's stock export.")
    if await ctx.session.get(m.Client, client_id) is None:
        raise ApiError(404, "No such client.")
    if size > MAX_BYTES:
        raise ApiError(422, "An export must be under 20 MB.", {"bytes": "Under 20 MB."})
    if ctx.cloud is None or not ctx.settings.exports_bucket:
        raise ApiError(503, "Stock exports can't be uploaded here.")
    eid = ctx.ids.new("ex", 10)
    link = ctx.cloud.storage.signed_put(ctx.settings.exports_bucket, _name(client_id, eid), content_type or "text/csv")
    return {
        "id": eid,
        "url": link.url,
        "headers": link.headers,
        "expiresAt": (ctx.clock.now() + timedelta(minutes=10)).isoformat(),
    }


async def arrived(ctx: Ctx, client_id: str, export_id: str, file_name: str | None) -> None:
    """the export is in the bucket: the Data agent maps and loads it, and the client keeps who uploaded it"""
    ctx.require("clients.configure", "Your role can't upload a client's stock export.")
    c = await lock_client(ctx, client_id)
    assert ctx.cloud is not None and ctx.settings.exports_bucket
    name = _name(client_id, export_id)
    if not await ctx.cloud.storage.size(ctx.settings.exports_bucket, name):
        raise ApiError(422, "The export has not arrived yet. Upload it again.")
    shown = (file_name or "").strip() or f"{export_id}.csv"
    c.workspace_doc = {
        **(c.workspace_doc or {}),
        "firstExport": {
            "export": export_id,
            "file": shown,
            "by": ctx.actor.name,
            "at": ctx.clock.now().isoformat(),
            "pending": True,
        },
    }
    await ctx.session.flush()
    uri = f"gs://{ctx.settings.exports_bucket}/{name}"
    await ev.publish(ctx, J.Event(J.STEP, {"type": "export.uploaded", "client": client_id, "file": uri}, client_id))
    await audit.record(
        ctx,
        client_id,
        "client.export",
        f"Uploaded {copy.possessive(c.name)} stock export {shown}; the Data agent maps and loads it",
        {"export": export_id, "file": shown},
    )


def loaded(c: m.Client, files: list[str], columns: Any = None) -> None:
    """the Data agent's report (steps.record_export): the columns it mapped the stock file by, and the uploaded export
    mapped once the report names it"""
    doc = dict(c.workspace_doc or {})
    pairs = [[str(p[0]), str(p[1])] for p in columns or [] if isinstance(p, list | tuple) and len(p) == 2 and all(p)]
    if pairs:
        doc["exportColumns"] = pairs[:32]
    fx = doc.get("firstExport")
    if fx and fx.get("pending") and any(str(f).endswith(f"{fx['export']}.csv") for f in files):
        doc["firstExport"] = {**fx, "pending": False}
    if doc != (c.workspace_doc or {}):
        c.workspace_doc = doc


def first_export(c: m.Client, distributors: int) -> dict[str, Any] | None:
    """the client's export as the console shows it: mapping until the Data agent has read the upload, then mapped, with
    what it brought; a client mapped by the daily load alone shows that file"""
    doc = c.workspace_doc or {}
    fx = doc.get("firstExport")
    li = c.last_import or {}
    if fx and fx.get("pending"):
        status = "mapping"
    elif c.setup_mapped > 0:
        status = "mapped"
    elif fx:
        status = "mapping"
    else:
        return None
    if status == "mapping":
        columns = [{"field": f, "column": None} for f in FIELDS]
    else:  # the map the Data agent reported, else the one the story's Setup holds
        pairs = doc.get("exportColumns") or ((doc.get("setup") or {}).get("dms") or {}).get("columns") or []
        columns = [{"field": f, "column": col} for f, col in pairs]
    return {**_shown(fx, li, distributors), "status": status, "columns": columns}


def _shown(fx: dict[str, Any] | None, li: dict[str, Any], distributors: int) -> dict[str, Any]:
    file = (fx or {}).get("file") or str(li.get("file") or "").rsplit("/", 1)[-1]
    return {
        "file": file,
        "rows": int(li.get("rows") or 0),
        "batches": int(li.get("batches") or 0),
        "distributors": distributors,
        "by": (fx or {}).get("by"),
        "at": (fx or {}).get("at"),
    }

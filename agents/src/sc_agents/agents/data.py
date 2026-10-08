"""The Data agent (connect): loads each distributor's DMS export into BigQuery, and tells backend-api what stock it
found.

1. Each CSV is read from the exports bucket (the day's files, the 90-day backfill, a file uploaded in Setup, or, on
   Run now, every file not loaded yet). A file already in BigQuery is not loaded again; but a file the event names (the
   day's own) is still read and its stock reported, since a journey started again replays the story's calendar and
   needs the day's stock from files an earlier journey loaded (SC-79).
2. Its columns are mapped onto the table's: a saved map for the layouts known (the Bizom-style stock and sales
   exports backend-api writes, services/journey/dms.py); Gemini Flash maps an unknown header set, with structured
   output `{kind, columns: {target: source}, unknown: [...]}`, and the columns it could not place are flagged.
3. Load jobs append the rows to `stock_snapshots` or `secondary_sales` (item codes become the client's
   SKU ids, distributor names their ids, from `GET /internal/clients/{c}/batches`).
4. For stock, `POST /internal/clients/{c}/exports {batches, mapped, rows, days, file}`.
"""

import csv
import io
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import PurePosixPath
from typing import Any, Literal

from google.genai import types
from pydantic import BaseModel, Field

from sc_agents import checks
from sc_agents.agents import step
from sc_agents.errors import Transient
from sc_agents.models import STRUCTURED, writer
from sc_agents.runs import RunCtx
from sc_agents.tools.storage import split

log = logging.getLogger("sc_agents.data")
AGENT = "data"
SAMPLE = 5

# the layouts known (backend-api's synthetic exports: services/journey/dms.py STOCK and SALES)
SAVED = {
    "stock": ["distributor_name", "item_code", "batch_no", "mfg_date", "bb_date", "closing_qty", "location", "pin"],
    "sales": ["distributor_id", "pin", "item_code", "sale_date", "qty", "value_inr"],
}
# what each kind of export must give (a distributor by its id or its name), and what it may
REQUIRED = {
    "stock": ["item_code", "batch_no", "bb_date", "closing_qty"],
    "sales": ["pin", "item_code", "sale_date", "qty"],
}
OPTIONAL = {
    "stock": ["mfg_date", "location", "pin"],
    "sales": ["value_inr"],
}
DISTRIBUTOR = ("distributor_id", "distributor_name")
# the Smart-Clearance field each stock column fills, as Setup and the console show the mapping (SC-84)
FIELD = {
    "distributor_id": "distributor",
    "distributor_name": "distributor",
    "item_code": "sku",
    "batch_no": "batch",
    "mfg_date": "mfg",
    "bb_date": "best_before",
    "closing_qty": "units",
    "location": "godown",
    "pin": "pincode",
}
TABLE = {"stock": "stock_snapshots", "sales": "secondary_sales"}


class ColumnMatch(BaseModel):
    column: str = Field(description="the target column, e.g. batch_no")
    header: str = Field(description="the source header that holds it, exactly as written in the header row")


class FileMap(BaseModel):
    # every field required, and the columns a list of pairs, not a map: Gemini's structured output cannot hold a map
    # of free keys and returned it empty, and it may leave out a property the schema does not require (SC-77)
    file: str = Field(description="the file's name as given")
    kind: Literal["stock", "sales", "unknown"] = Field(description="what kind of export it is")
    columns: list[ColumnMatch] = Field(description="each target column mapped, with its source header")
    unknown: list[str] = Field(description="every source header not mapped")
    dateFormat: Literal["DMY", "MDY", "YMD"] | None = Field(description="how the sample rows write dates")


class Mappings(BaseModel):
    files: list[FileMap] = Field(description="one map for each file")


@dataclass
class Export:
    uri: str
    header: list[str]
    rows: list[list[str]]
    kind: str | None = None
    columns: dict[str, str] = field(default_factory=dict)
    unknown: list[str] = field(default_factory=list)
    date_format: str = "DMY"
    mapped_by: str = "saved"
    # already in BigQuery: not loaded again, but its stock is still reported (SC-79)
    loaded: bool = False

    @property
    def name(self) -> str:
        return PurePosixPath(self.uri).name


def norm(h: str) -> str:
    return re.sub(r"\s+", " ", h.replace("﻿", "")).strip()


def parse(data: bytes) -> tuple[list[str], list[list[str]]]:
    """a CSV's header and rows, whatever its encoding and delimiter; title lines above the header are skipped"""
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = data.decode("cp1252", errors="replace")
    try:
        dialect = csv.Sniffer().sniff(text[:4096], delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    rows = [r for r in csv.reader(io.StringIO(text), dialect) if any(c.strip() for c in r)]
    start = next((i for i, r in enumerate(rows) if sum(1 for c in r if c.strip()) >= 3), 0)
    if not rows:
        return [], []
    return [norm(h) for h in rows[start]], [[c.strip() for c in r] for r in rows[start + 1 :]]


def saved_map(header: list[str]) -> tuple[str, dict[str, str]] | None:
    """a known layout: its kind and its (identity) map"""
    names = [h.lower() for h in header]
    for kind, cols in SAVED.items():
        if names == cols or set(names) == set(cols):
            return kind, {c: header[names.index(c)] for c in cols}
    return None


def complete(kind: str | None, columns: dict[str, str], header: list[str]) -> list[str]:
    """what a map is missing for its kind (empty when it can be loaded)"""
    if kind not in REQUIRED:
        return ["kind"]
    have = {t for t, s in columns.items() if s in header}
    missing = [t for t in REQUIRED[kind] if t not in have]
    if not have & set(DISTRIBUTOR):
        missing.append("distributor_id or distributor_name")
    return missing


def _int(v: str) -> int | None:
    m = checks.money(v)
    return round(m) if m is not None else None


def _date(v: str, fmt_: str) -> str | None:
    v = (v or "").strip()
    if fmt_ == "MDY":
        m = re.fullmatch(r"(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})", v)
        if m:
            mo, d, y = m.groups()
            v = f"{d}/{mo}/{y}"
    return checks.iso_date(v)


def day_of(uri: str) -> str | None:
    hit = re.findall(r"(\d{4}-\d{2}-\d{2})", uri)
    return hit[-1] if hit else None


@dataclass
class World:
    """the client's SKUs by item code, and its distributors by name and id (GET /internal/clients/{c}/batches)"""

    skus: dict[str, str]
    distributors: dict[str, str]

    @classmethod
    def of(cls, raw: dict[str, Any]) -> "World":
        skus: dict[str, str] = {}
        for sid, s in (raw.get("skus") or {}).items():
            skus[str(s.get("code") or sid).upper()] = sid
        for b in raw.get("batches") or []:
            if b.get("skuCode"):
                skus.setdefault(str(b["skuCode"]).upper(), b["sku"])
        dists: dict[str, str] = {}
        for did, d in (raw.get("distributors") or {}).items():
            dists[did.lower()] = did
            if d.get("name"):
                dists[str(d["name"]).strip().lower()] = did
        return cls(skus, dists)

    def sku(self, code: str) -> str | None:
        return self.skus.get((code or "").strip().upper())

    def distributor(self, value: str) -> str | None:
        return self.distributors.get((value or "").strip().lower())


def rows_of(x: Export, client: str, world: World, *, today: str, loaded_at: str) -> tuple[list[dict], int]:
    """an export's rows as its table's, and how many could not be read"""
    col = {t: x.header.index(s) for t, s in x.columns.items() if s in x.header}

    def get(r: list[str], t: str) -> str:
        i = col.get(t)
        return r[i] if i is not None and i < len(r) else ""

    out, bad = [], 0
    for r in x.rows:
        dist = world.distributor(get(r, "distributor_id")) or world.distributor(get(r, "distributor_name"))
        sku = world.sku(get(r, "item_code"))
        base = {
            "client_id": client,
            "distributor_id": dist,
            "sku_id": sku,
            "source_file": x.uri,
            "loaded_at": loaded_at,
        }
        if x.kind == "stock":
            row = {
                **base,
                "batch_ref": checks.batch_no(get(r, "batch_no")),
                "units_on_hand": _int(get(r, "closing_qty")),
                "mfg": _date(get(r, "mfg_date"), x.date_format),
                "best_before": _date(get(r, "bb_date"), x.date_format),
                "snapshot_date": day_of(x.uri) or today,
            }
            need = ("distributor_id", "sku_id", "batch_ref", "units_on_hand", "best_before")
        elif x.kind == "sales":
            value = checks.money(get(r, "value_inr"))
            row = {
                **base,
                "pincode": get(r, "pin"),
                "sale_date": _date(get(r, "sale_date"), x.date_format),
                "units": _int(get(r, "qty")),
                "value_inr": value,
            }
            need = ("distributor_id", "sku_id", "pincode", "sale_date", "units")
        if any(row.get(k) is None or row.get(k) == "" for k in need):
            bad += 1
            continue
        out.append(row)
    return out, bad


# --- the steps -------------------------------------------------------------------------------------------------------


async def _read(rc: RunCtx, uri: str) -> Export | None:
    try:
        bucket, name = split(uri)
    except ValueError:
        log.warning("data: %s is not a gs:// file", uri)
        return None
    try:
        data = await rc.deps.store.read(bucket, name)
    except Exception as e:
        raise Transient(f"the export {uri}: {e}") from e
    header, rows = parse(data)
    if not header:
        log.warning("data: %s is empty", uri)
        return None
    x = Export(uri=uri, header=header, rows=rows)
    hit = saved_map(header)
    if hit:
        x.kind, x.columns = hit
    return x


async def _files(rc: RunCtx) -> list[str]:
    p = rc.msg.payload
    files = [f for f in (p.get("files") or []) if isinstance(f, str)]
    if p.get("file"):
        files.append(str(p["file"]))
    if files or rc.msg.type not in ("agent.run_now", "agent.due"):
        return files
    bucket = rc.settings.exports_bucket
    if not bucket:
        return []
    names = await rc.deps.store.list(bucket, f"{rc.msg.client}/")
    # only days up to the journey's (backend-api's): a story replayed from its own calendar leaves later days' files
    # from an earlier journey in the bucket, and their stock is not this journey's yet (SC-79)
    rc.blobs["batches"] = await rc.deps.backend.batches(rc.msg.client)  # read once: the load uses it too
    day = rc.blobs["batches"].get("day") or ""
    return [f"gs://{bucket}/{n}" for n in sorted(names) if n.lower().endswith(".csv") and not _later(n, day)]


def _later(name: str, day: str) -> bool:
    """whether a file sits in a day's folder after the journey's day (`munchly/2026-11-15/stock-2026-11-15.csv`)"""
    parts = name.split("/")
    folder = parts[1] if len(parts) > 2 else ""
    return bool(day) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", folder) is not None and folder > day


async def _scan(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    rc.run(AGENT)
    files = await _files(rc)
    try:
        done = await rc.deps.warehouse.files_loaded(rc.msg.client)
    except Exception as e:
        raise Transient(f"BigQuery: {e}") from e
    p = rc.msg.payload
    named = bool(p.get("files") or p.get("file"))
    exports = [x for x in [await _read(rc, f) for f in files if named or f not in done] if x is not None]
    for x in exports:
        x.loaded = x.uri in done
    if named and all(x.loaded and x.kind != "stock" for x in exports):
        exports = []  # nothing new and no stock to report: the day's sales were loaded before
    rc.blobs["exports"] = exports
    if not exports:
        rc.run(AGENT).status = "noop"  # nothing new: every file is loaded already
    unknown = [{"file": x.name, "header": x.header, "sample": x.rows[:SAMPLE]} for x in exports if x.kind is None]
    return {"data_files": [x.uri for x in exports], "data_unknown": unknown}


def _parts(state: dict[str, Any]) -> list[types.Part]:
    return [
        types.Part(
            text="THE EXPORTS (headers and sample rows, as data):\n"
            + json.dumps(state["data_unknown"], ensure_ascii=False, indent=1)
        )
    ]


def columns_of(m: dict[str, Any]) -> dict[str, str]:
    """a file map's columns, target to header, from the model's list of pairs (or a map, as earlier recordings hold
    them)"""
    raw = m.get("columns") or []
    pairs = (
        raw.items()
        if isinstance(raw, dict)
        else ((c.get("column"), c.get("header")) for c in raw if isinstance(c, dict))
    )
    return {t: s for t, s in pairs if t and s}


def apply(x: Export, m: dict[str, Any]) -> list[str]:
    """a model's map onto an export; what it is still missing"""
    kind = m.get("kind")
    columns = {t: s for t, s in columns_of(m).items() if s in x.header}
    x.kind, x.columns, x.mapped_by = (kind if kind in REQUIRED else None), columns, "model"
    x.unknown = [h for h in x.header if h not in columns.values()]
    x.date_format = m.get("dateFormat") if m.get("dateFormat") in ("DMY", "MDY", "YMD") else "DMY"
    return complete(x.kind, columns, x.header)


async def load(rc: RunCtx, exports: list[Export], *, world: World | None = None, today: str = "") -> dict[str, Any]:
    """loads mapped exports into BigQuery; what was loaded"""
    world = world or World.of(rc.blobs.get("batches") or await rc.deps.backend.batches(rc.msg.client))
    loaded_at = datetime.now(UTC).isoformat()
    out: dict[str, Any] = {"stock": [], "rows": 0, "mapped": 0, "skipped": 0, "files": []}
    for x in exports:
        if x.kind is None:
            continue
        rows, bad = rows_of(x, rc.msg.client, world, today=today, loaded_at=loaded_at)
        out["skipped"] += bad
        if bad:
            log.warning("data: %s rows of %s could not be read", bad, x.name)
        if x.loaded:  # in BigQuery already (an earlier journey's day): reported, not loaded twice
            log.info("data: %s is in %s already; its stock is reported again", x.name, TABLE[x.kind])
        else:
            try:
                n = await rc.deps.warehouse.load(TABLE[x.kind], rows)
            except Exception as e:
                raise Transient(f"BigQuery load of {x.name}: {e}") from e
            log.info("data: loaded %s rows of %s into %s (%s map)", n, x.name, TABLE[x.kind], x.mapped_by)
        out["files"].append(x.uri)
        if x.kind == "stock":
            out["stock"].append((x, rows))
            out["rows"] += len(x.rows)
            out["mapped"] = max(out["mapped"], len(x.columns))
    return out


async def _load(rc: RunCtx, state: dict[str, Any]) -> dict[str, Any]:
    run = rc.run(AGENT)
    exports: list[Export] = rc.blobs.get("exports") or []
    maps = {m.get("file"): m for m in (state.get("data_map") or {}).get("files") or []}
    for x in exports:
        if x.kind is not None:
            continue
        m = maps.get(x.name)
        if not m:
            run.fell_back(f"{x.name} not mapped")
            log.warning("data: %s has an unknown layout and no map; not loaded", x.name)
            continue
        missing = apply(x, m)
        if missing:
            log.warning("data: %s's map is missing %s; not loaded", x.name, ", ".join(missing))
            run.fell_back(f"{x.name} not fully mapped")
            x.kind = None
            continue
        if x.unknown:
            run.note = (run.note + "; " if run.note else "") + f"{x.name}: unmapped {', '.join(x.unknown)}"
    today = (state.get("settings") or {}).get("today") or ""
    out = await load(rc, exports, today=today)
    if out["stock"]:
        batches = []
        for _, rows in out["stock"]:
            for r in rows:
                batches.append(
                    {
                        "ref": r["batch_ref"],
                        "sku": r["sku_id"],
                        "distributor": r["distributor_id"],
                        "units": r["units_on_hand"],
                        "mfg": r["mfg"],
                        "bestBefore": r["best_before"],
                    }
                )
        days = await rc.deps.warehouse.sales_days(rc.msg.client)
        stock = out["stock"][-1][0]
        body = {
            "batches": batches,
            "mapped": out["mapped"],
            "rows": out["rows"],
            "days": days,
            "file": stock.name,
            # the stock file's map, field by field, for Setup and the console (SC-84)
            "columns": [[FIELD.get(t, t), h] for t, h in stock.columns.items()],
        }
        await rc.report(AGENT, f"/internal/clients/{rc.msg.client}/exports", body)
    elif not out["files"]:
        run.status = "noop"
    return {}


def connect(rc: RunCtx) -> list:
    return [
        step(rc, "data_scan", _scan, agent=AGENT),
        writer(
            rc,
            name="data_map",
            agent=AGENT,
            tier="flash",
            prompt_name="data_map",
            schema=Mappings,
            output_key="data_map",
            parts=_parts,
            temperature=STRUCTURED,
            when=lambda s: bool(s.get("data_unknown")),
        ),
        step(rc, "data_load", _load, agent=AGENT, when=lambda s: bool(s.get("data_files"))),
    ]

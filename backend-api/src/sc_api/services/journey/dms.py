"""Synthetic DMS exports (SC-66). No distributor's DMS is connected yet, so backend-api writes what one would send, as
CSV files in the exports bucket, for the Data agent to map and load into BigQuery:

- stock-<day>.csv: each open batch at its distributor's godown, in a Bizom-style layout (the columns the story's Data
  agent maps: distributor_name, item_code, batch_no, mfg_date, bb_date, closing_qty, location, pin);
- sales-<day>.csv, and sales-backfill.csv for the 90 days before the journey: secondary sales by pincode and day;

The sales are calibrated so the Watcher's projection gives each batch its own rate (12 a day for MF-2409-117): a
distributor's daily sales of an SKU add up to the batch's `sell_per_day`, split across the shops' pincodes by their
own 14-day sales. Everything is deterministic: the same day writes the same file.
"""

import csv
import io
import math
from datetime import date, timedelta
from typing import Any

from sqlalchemy import select

from sc_api import models as m
from sc_api.services.context import Ctx
from sc_api.services.journey import world

STOCK = ["distributor_name", "item_code", "batch_no", "mfg_date", "bb_date", "closing_qty", "location", "pin"]
SALES = ["distributor_id", "pin", "item_code", "sale_date", "qty", "value_inr"]


def _csv(header: list[str], rows: list[list[Any]]) -> bytes:
    out = io.StringIO()
    w = csv.writer(out, lineterminator="\n")
    w.writerow(header)
    w.writerows(rows)
    return out.getvalue().encode()


def _split(total: int, weights: dict[str, float]) -> dict[str, int]:
    """a whole number split by weight, the remainders going to the largest fractions (stable by key)"""
    if total <= 0 or not weights:
        return dict.fromkeys(weights, 0)
    s = sum(weights.values()) or 1
    raw = {k: total * w / s for k, w in weights.items()}
    out = {k: math.floor(v) for k, v in raw.items()}
    left = total - sum(out.values())
    for k in sorted(raw, key=lambda k: (-(raw[k] - out[k]), k))[:left]:
        out[k] += 1
    return out


def _daily(rate: float, day: date, start: date) -> int:
    """a day's whole sales for a rate, so any run of days adds up to rate x days (to the unit)"""
    n = (day - start).days
    return math.floor(rate * (n + 1)) - math.floor(rate * n)


async def _pins(ctx: Ctx, client_id: str) -> dict[str, dict[str, float]]:
    """each distributor's pincodes, weighted by its shops' own sales (or evenly over its pin prefixes)"""
    out: dict[str, dict[str, float]] = {}
    for k in await world.kiranas(ctx, client_id):
        out.setdefault(k.distributor_id, {})
        out[k.distributor_id][k.pincode] = out[k.distributor_id].get(k.pincode, 0) + k.sales_14d
    for d in (await world.distributors(ctx, client_id)).values():
        if d.id not in out:
            prefixes = [p.strip() for p in (d.pins or "").split(",") if p.strip()] or ["400"]
            out[d.id] = {f"{p}001": 1.0 for p in prefixes}
    return out


async def sales_rows(ctx: Ctx, client_id: str, days: list[date], start: date) -> list[list[Any]]:
    skus = await world.skus(ctx, client_id)
    pins = await _pins(ctx, client_id)
    rates: dict[tuple[str, str], float] = {}
    for b in (
        await ctx.session.execute(select(m.Batch).where(m.Batch.client_id == client_id, m.Batch.closed_at.is_(None)))
    ).scalars():
        if b.sell_per_day:
            key = (b.distributor_id, b.sku_id)
            rates[key] = rates.get(key, 0) + float(b.sell_per_day)
    rows = []
    for day in days:
        for (dist, sku), rate in sorted(rates.items()):
            x = skus[sku]
            price = float(x.dp) if x.dp is not None else round(float(x.mrp) * 0.7, 2)
            for pin, qty in sorted(_split(_daily(rate, day, start), pins.get(dist, {"400001": 1})).items()):
                if qty:
                    rows.append([dist, pin, x.code, day.isoformat(), qty, round(qty * price, 2)])
    return rows


async def stock_rows(ctx: Ctx, client_id: str) -> list[list[Any]]:
    skus = await world.skus(ctx, client_id)
    dists = await world.distributors(ctx, client_id)
    rows = []
    for b in (
        await ctx.session.execute(
            select(m.Batch)
            .where(m.Batch.client_id == client_id, m.Batch.closed_at.is_(None), m.Batch.best_before.is_not(None))
            .order_by(m.Batch.seq)
        )
    ).scalars():
        d = dists[b.distributor_id]
        assert b.best_before is not None
        pin = ((d.pins or "").split(",")[0].strip() or "400") + "008"
        rows.append(
            [
                d.name,
                skus[b.sku_id].code,
                b.ref,
                (b.mfg or b.best_before).isoformat(),
                b.best_before.isoformat(),
                b.units,
                d.godown or d.city,
                pin,
            ]
        )
    return rows


async def write_day(ctx: Ctx, client_id: str, day: date, *, start: date) -> list[str]:
    """the day's stock and sales exports in the exports bucket; their gs:// names"""
    assert ctx.cloud is not None and ctx.settings.exports_bucket
    bucket = ctx.settings.exports_bucket
    names = []
    for kind, header, rows in (
        ("stock", STOCK, await stock_rows(ctx, client_id)),
        ("sales", SALES, await sales_rows(ctx, client_id, [day], start)),
    ):
        name = f"{client_id}/{day.isoformat()}/{kind}-{day.isoformat()}.csv"
        await ctx.cloud.storage.write(bucket, name, _csv(header, rows), "text/csv")
        names.append(f"gs://{bucket}/{name}")
    return names


async def write_backfill(ctx: Ctx, client_id: str, day0: date, days: int = 90) -> str:
    """the 90 days of secondary sales before the journey's day 0"""
    assert ctx.cloud is not None and ctx.settings.exports_bucket
    start = day0 - timedelta(days=days)
    rows = await sales_rows(ctx, client_id, [start + timedelta(days=i) for i in range(days)], start)
    name = f"{client_id}/backfill/sales-backfill-{day0.isoformat()}.csv"
    await ctx.cloud.storage.write(ctx.settings.exports_bucket, name, _csv(SALES, rows), "text/csv")
    return f"gs://{ctx.settings.exports_bucket}/{name}"

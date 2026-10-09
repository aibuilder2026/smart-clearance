"""Munchly's history (SC-123): the twelve batches its workspace cleared in its pilot quarter, built through the
journey's own steps on design3's schedule (data.js HISTORY). Each ledger is what money.js makes of the batch, each
paper carries the number design3 gives it, the story's numbers follow on, nothing reaches a person or an agent but
Paperwork's PDFs, and the history stays in view through a journey reset."""

import pytest
from sqlalchemy import select

from sc_api import models as m
from sc_api.services.reference import load
from tests.test_workspace import PRIYA, WS, case

H = load("journey.json")["history"]
REFS = {b["ref"] for b in H["batches"]}
KEYS = ("net", "swing", "pnl", "itc", "itcReversed", "kg", "co2", "meals", "godown", "destroyed")


@pytest.fixture
async def with_history(ctx):
    """Munchly's live workspace with its history, as hydrate builds it (cli/live.py)"""
    from sc_api.cli import live

    out = await live.build(ctx)
    await ctx.session.commit()
    return out


async def _cases(ctx) -> dict[str, m.Case]:
    rows = await ctx.session.execute(select(m.Case).where(m.Case.client_id == "munchly", m.Case.history.is_(True)))
    return {x.batch_ref: x for x in rows.scalars()}


async def test_the_history_clears_each_batch_as_money_js_has_it(with_history, ctx):
    assert with_history["history"] == len(H["batches"]) == 12
    cases = await _cases(ctx)
    assert set(cases) == REFS
    for b in H["batches"]:
        c = cases[b["ref"]]
        assert (c.status, c.phase) == ("cleared", "cleared"), b["ref"]
        got = {k: c.ledger[k] for k in KEYS}
        assert got == {k: b["expect"][k] for k in KEYS}, b["ref"]
        assert c.reviewed, b["ref"]
        docs = {d["id"]: d for d in c.docs}
        n = b["numbers"]
        assert docs["support"]["no"] == n["support"]
        if "invoice" in n:
            assert (docs["invoice"]["no"], c.listing["id"]) == (n["invoice"], n["listing"])
            assert c.invoice_issued_at is not None
        if "expiry" in n:
            assert docs["expiry"]["no"] == n["expiry"] and docs["destruction"]["units"] == b["expect"]["destroyed"]
        if "receipt" in n:
            assert c.donation["receipt"]["no"] == n["receipt"]
        batch = await ctx.session.get(m.Batch, ("munchly", b["ref"]))
        assert batch.history and batch.outcome == "cleared"


async def test_the_storys_papers_number_on_from_the_history(with_history, ctx):
    for kind, n in load("journey.json")["numbers"].items():
        row = await ctx.session.get(m.DocumentNumber, ("munchly", kind))
        assert row.next == n["next"], kind


async def test_nothing_of_the_history_reaches_a_person_or_an_agent_but_its_pdfs(with_history, ctx):
    ids = {c.id for c in (await _cases(ctx)).values()}
    pending = (await ctx.session.execute(select(m.Outbox).where(m.Outbox.published_wall.is_(None)))).scalars().all()
    ours = [o for o in pending if (o.payload or {}).get("ref") in REFS]
    assert ours and {o.payload.get("type") for o in ours} <= {"settle", "receipt"}
    pushes = (await ctx.session.execute(select(m.Notification).where(m.Notification.case_id.in_(ids)))).scalars().all()
    assert pushes and {n.push_status for n in pushes} == {"none"}
    timers = await ctx.session.execute(select(m.Timer).where(m.Timer.case_id.in_(ids), m.Timer.fired_wall.is_(None)))
    assert timers.first() is None


async def test_the_history_stays_in_view_through_a_journey_reset(api, with_history, ctx):
    from sc_api.services.journey import reset

    await reset.reset(ctx, "munchly")
    await ctx.session.commit()
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    # cleared and past their best-before: in the ledger, neither on Batches (SC-126) nor among the batches in a journey
    # (SC-121)
    assert not {b["id"] for b in snap["batches"]} & REFS
    assert not {c["ref"] for c in snap["cases"]} & REFS
    # the story's own batches, still inside their best-before, stay
    assert {b["id"] for b in snap["batches"]} >= {b["id"] for b in load("journey.json")["batches"]}
    leftover = next(b for b in H["batches"] if b["outcome"] == "leftover")
    c = await case(api, PRIYA, leftover["ref"])
    assert c["journey"]["phase"] == "cleared"
    docs = {d["id"]: d for d in c["docs"]}
    assert docs["expiry"]["no"] == leftover["numbers"]["expiry"]
    assert docs["itc"]["reversed"] == leftover["expect"]["itcReversed"]

"""The journey's rules for any plan (SC-86): a case reaches its papers once every line in its plan has run its course,
whatever its lines, and nothing waits on an agent that has no step to take."""

import pytest

from sc_api.domain import journey as J


def plan(*lines: tuple[str, int]) -> dict:
    return {"lines": [{"id": i, "units": u} for i, u in lines]}


DONE = {
    "expiresoon": {"truck": {"status": "dispatched"}},
    "kirana": {"offer": {"status": "closed"}},
    "staff": {"staff": {"status": "recorded", "sold": 150}},
    "foodbank": {"donation": {"status": "collected", "units": 58}},
}
SHAPES = {
    "the chips": [("kirana", 588), ("expiresoon", 772)],
    "the mango": [("kirana", 1372), ("staff", 150), ("foodbank", 58)],
    "kirana only": [("kirana", 400)],
    "kirana and staff": [("kirana", 400), ("staff", 50)],
    "staff only": [("staff", 50)],
    "write-off only": [("writeoff", 300)],
    "every exit": [("expiresoon", 500), ("kirana", 300), ("staff", 50), ("foodbank", 80), ("writeoff", 20)],
}


@pytest.mark.parametrize("shape", SHAPES, ids=str)
def test_a_case_moves_on_only_once_every_line_is_done(shape):
    lines = SHAPES[shape]
    case = {"phase": "executing", "plan": plan(*lines)}
    waiting = [i for i, _ in lines if i != "writeoff"]
    for i, ch in enumerate(waiting):
        assert not J.lines_done(case), f"{shape}: moved on before {ch}"
        case |= DONE[ch]
        assert J.line_done(case, ch)
        if i < len(waiting) - 1:
            assert not J.lines_done(case)
    assert J.lines_done(case)


@pytest.mark.parametrize("shape", SHAPES, ids=str)
def test_an_approved_plan_asks_the_agents_only_for_what_they_run(shape):
    lines = SHAPES[shape]
    case = {"phase": "approved", "plan": plan(*lines)}
    agents = {i for i, _ in lines} & {"expiresoon", "kirana", "foodbank"}
    e = J.next_agent_event(case, client="munchly", ref="MF-1")
    assert (e is not None) == bool(agents), shape  # a staff sale or a write-off is not the agents' to run
    if e is not None:
        assert e.payload["type"] == J.EXECUTE


def test_an_unsold_lot_and_a_declined_donation_count_as_done():
    case = {"plan": plan(("expiresoon", 772), ("foodbank", 58))}
    case |= {"listing": {"status": "ended"}, "donation": {"status": "declined", "units": 58}}
    assert J.lines_done(case)
    assert J.done_units(case, 0) == {"expiresoon": 0, "foodbank": 0}


def test_what_each_finished_line_took():
    case = {
        "offer": {"status": "closed"},
        "award": {"units": 900},  # the lot took the scheme's shortfall too
        "staff": {"status": "recorded", "sold": 120},
        "donation": {"status": "confirmed", "units": 58},  # not collected yet: counts as planned
    }
    assert J.done_units(case, 488) == {"kirana": 488, "expiresoon": 900, "staff": 120}


def test_the_staff_sale_and_a_declined_pickup_are_guarded():
    assert J.can({"phase": "executing"}, "staff") == "There is no staff sale in this plan yet."
    assert J.can({"phase": "executing", "staff": {"status": "open"}}, "staff") is None
    assert (
        J.can({"phase": "executing", "staff": {"status": "recorded"}}, "staff") == "The staff sale is already recorded."
    )
    booked = {"phase": "executing", "donation": {"status": "booked"}}
    assert J.can(booked, "decline") is None
    assert J.can({**booked, "donation": {"status": "collected"}}, "decline") == "The packs are already collected."
    declined = {**booked, "donation": {"status": "declined"}}
    assert J.can(declined, "pickup") == J.can(declined, "collect") == "No donation is booked."


def test_on_expiry_day_every_line_is_done_and_a_line_never_run_took_nothing():
    """SC-94: Report now (or best-before) takes the journey to its end as it stands"""
    case = {"plan": plan(("kirana", 588), ("expiresoon", 772), ("staff", 50)), "offer": {"status": "closed"}}
    assert not J.lines_done(case)
    case["expiredAt"] = "2026-11-18T10:00:00+05:30"
    assert J.lines_done(case)
    assert J.done_units(case, 100) == {"kirana": 100, "expiresoon": 0, "staff": 0}

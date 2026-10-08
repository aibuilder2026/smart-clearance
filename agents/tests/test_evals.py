"""The eval harness, offline: every case set loads, each writer runs alone on a case with the stub tier (no live model),
and its scorer reads the result; and the trajectory check, each pipeline's steps in order with the stub tier (ADK's
own evaluator scores tool-call trajectories, and these pipelines call no tools, so the check is the suite's own)."""

import json

import pytest

from sc_agents.evals import harness, run, scorers
from tests.conftest import CASE, HERO, LISTING, MANGO, PHOTO, C, case, message

SETS = ("vision", "data", "valuer", "router", "lister", "outreach", "negotiator")


@pytest.mark.parametrize("name", SETS)
def test_every_set_loads_with_its_splits(name):
    cases = harness.load(name)
    assert len(cases) >= 15 and len({c["id"] for c in cases}) == len(cases)
    assert {c["split"] for c in cases} == {"train", "held-out"}


def test_the_sets_are_the_sizes_planned():
    sizes = {name: len(harness.load(name)) for name in SETS}
    assert sizes["vision"] >= 60 and sizes["data"] == 19 and sizes["negotiator"] == 40
    assert sizes["valuer"] == sizes["router"] == 20 and sizes["lister"] + sizes["outreach"] == 30
    vision = harness.load("vision")
    assert {c["expect"] for c in vision} == {"exact", "no-date", "no-batch", "unreadable"}
    for c in vision:
        sidecar = json.loads((harness.EVALS / "vision" / c["image"].replace(".webp", ".prompt.json")).read_text())
        assert sidecar["model"].startswith("Qwen-Image") and sidecar["seed"] and sidecar["prompt"]


@pytest.mark.parametrize("name", SETS)
async def test_a_writer_runs_alone_on_a_case_and_is_scored(name, deps, recordings):
    """with the stub tier the recordings answer (the story's words), so the score is whatever it is: what matters is
    that the case reaches the writer as the pipeline would give it, and the scorer reads the output"""
    cases = harness.load(name)
    c = cases[0]
    out, rc, state = await harness.run_case(name, c, deps)
    scores, problems = scorers.score(name, c, out, state)
    assert "pass" in scores and isinstance(problems, list)
    assert rc.requests and rc.requests[0]["writer"] == harness.spec_of(name, c).writer


async def test_the_story_label_scores_exact(deps):
    c = next(x for x in harness.load("vision") if x["id"] == "story-clean")
    out, _, state = await harness.run_case("vision", c, deps)
    scores, problems = scorers.score("vision", c, out, state)
    assert scores["pass"] == 1 and scores["exact"] == 1 and not problems


def test_a_confident_wrong_read_fails_any_case():
    c = {"truth": {"batch": "MF-2409-117", "mfg": None, "bestBefore": None, "mrp": None}, "expect": "unreadable"}
    s, problems = scorers.score_vision(c, {"batch": "MF-2409-171", "confidence": 0.95})
    assert s["pass"] == 0 and s["confidentWrong"] == 1 and "a confident wrong read" in problems
    s, _ = scorers.score_vision(c, {"batch": None, "confidence": 0.2})
    assert s["pass"] == 1


def test_a_covered_date_must_not_verify():
    truth = {"batch": "MF-2409-117", "mfg": "2026-05-18", "bestBefore": None, "mrp": 30.0}
    c = {"truth": truth, "expect": "no-date"}
    ok = {"batch": "MF-2409-117", "mfg": "2026-05-18", "bestBefore": None, "mrp": 30, "confidence": 0.6}
    assert scorers.score_vision(c, ok)[0]["pass"] == 1
    assert scorers.score_vision(c, {**ok, "confidence": 0.95})[0]["pass"] == 0  # it would verify without a date
    assert scorers.score_vision(c, {**ok, "bestBefore": "2026-11-18"})[0]["pass"] == 0  # a guessed date


def pairs(columns: dict[str, str]) -> list[dict[str, str]]:
    """a map of columns in the shape Gemini returns it: a list of pairs (SC-77)"""
    return [{"column": t, "header": h} for t, h in columns.items()]


def test_a_data_map_is_held_to_its_layout():
    c = next(x for x in harness.load("data") if x["id"] == "data-marg-stock")
    cols = c["expect"]["columns"]
    right = {"files": [{"file": c["file"], "kind": "stock", "columns": pairs(cols), "unknown": c["expect"]["unknown"]}]}
    assert scorers.score_data(c, right)[0]["pass"] == 1
    cartons = json.loads(json.dumps(right))
    cartons["files"][0]["columns"] = pairs({**cols, "closing_qty": "QTY_IN_CASES"})
    s, problems = scorers.score_data(c, cartons)
    assert s["pass"] == 0 and any("closing_qty" in p for p in problems)
    by_id = json.loads(json.dumps(right))
    by_id["files"][0]["columns"] = pairs(
        {("distributor_name" if t == "distributor_id" else t): h for t, h in cols.items()}
    )
    assert scorers.score_data(c, by_id)[0]["pass"] == 1  # a distributor by id or name loads the same
    # a map, as earlier recordings hold them, still scores
    assert scorers.score_data(c, {"files": [{**right["files"][0], "columns": cols}]})[0]["pass"] == 1


async def test_the_data_set_scores_a_live_shaped_answer(deps, recordings):
    """the stub's own data_map recording maps no file, so the set's run must also be tried on an answer in the shape
    Gemini gives (the second live run met a scorer that still read a map, SC-77)"""
    c = harness.load("data")[0]
    answer = {
        "file": c["file"],
        "kind": c["expect"]["kind"],
        "columns": pairs(c["expect"]["columns"]),
        "unknown": c["expect"]["unknown"],
        "dateFormat": "DMY",
    }
    recordings.data["data_map"] = {"json": {"files": [answer]}}
    out, _, state = await harness.run_case("data", c, deps)
    scores, problems = scorers.score("data", c, out, state)
    assert scores["pass"] == 1 and scores["requiredMapped"] == 1, problems


def test_a_missing_column_must_not_be_invented():
    c = next(x for x in harness.load("data") if x["id"] == "data-no-expiry-stock")
    invented = {
        "files": [{"kind": "stock", "columns": pairs({**c["expect"]["columns"], "bb_date": "Mfg Date"}), "unknown": []}]
    }
    s, _ = scorers.score_data(c, invented)
    assert s["pass"] == 0 and s["noInvented"] == 0


def test_the_negotiators_scorer_catches_a_leak():
    c = next(x for x in harness.load("negotiator") if x["type"] == "bid")
    state = harness.prepare("negotiator", c, None)  # type: ignore[arg-type]
    s, problems = scorers.score_negotiator(
        c, {"reply": f"{state['bid_facts']['decidedPricePerPack']}; not under ₹13.50."}, state
    )
    assert s["reserveKept"] == 0 and "the reserve leaked" in problems


def test_a_counter_at_the_reserve_is_not_a_leak():
    """money.counter can decide the reserve itself: stating the decided price gives nothing away (SC-77: the first live
    run scored two such counters as leaks)"""
    c = next(x for x in harness.load("negotiator") if x["id"] == "bid-14-10")
    state = harness.prepare("negotiator", c, None)  # type: ignore[arg-type]
    assert abs(state["bid_decided"] - c["reserve"]) < 0.005
    reply = "We can offer the 772 packs at ₹13.50 per pack. Dispatch will be within 24 hours of the balance."
    s, problems = scorers.score_negotiator(c, {"reply": reply}, state)
    assert s["reserveKept"] == 1 and problems == []


def test_a_best_before_date_does_not_quote_the_reserve():
    """a reserve of ₹18 and a best-before of 18 Nov 2026: the date's day is not the price (SC-77)"""
    c = next(x for x in harness.load("lister") if x["id"] == "lister-biscuits-lakshmi")
    out = {
        "title": "Munchly Choco Cream Biscuits 200 g - 1210 packs - Hyderabad",
        "description": "Lot of 1210 packs of Munchly Choco Cream Biscuits 200 g (batch MF-2411-101) with best-before "
        "date 18 Nov 2026. Stock is located at Begum Bazaar godown in Hyderabad at an asking price of ₹20 a pack. "
        "Dispatch is within 24 hours of the balance.",
    }
    s, problems = scorers.score_lister(c, out)
    assert "quotes the reserve" not in problems
    _, problems = scorers.score_lister(c, {**out, "description": out["description"] + " Not under ₹18."})
    assert "quotes the reserve" in problems


def test_the_set_marks():
    results = [
        {"kind": "clean", "scores": {"exact": 1, "pass": 1, "confidentWrong": 0}},
        {"kind": "hard", "scores": {"exact": 0, "pass": 1, "confidentWrong": 0}},
        {"kind": "hard", "scores": {"exact": 0, "pass": 0, "confidentWrong": 1}},
    ]
    m = run.marks("vision", results)
    assert m["cleanExact"]["met"] and not m["hardPass"]["met"] and not m["confidentWrongReads"]["met"]


# --- the trajectory check ----------------------------------------------------------------------------------------------

STEP = "journey.step"
TRAJECTORIES = [
    ("batch.at_risk", {"ref": HERO}, None, [f"POST {HERO}/photo-request"]),
    (
        STEP,
        {"type": "decide", "ref": HERO, "photo": PHOTO},
        None,
        [
            "model vision_read",
            f"POST {HERO}/photo-read",
            "model valuer_write",
            f"POST {HERO}/valuation",
            "model router_write",
            f"POST {HERO}/plan",
        ],
    ),
    (
        STEP,
        {"type": "value", "ref": HERO},
        case(phase="verified", photo="verified"),
        ["model valuer_write", f"POST {HERO}/valuation", "model router_write", f"POST {HERO}/plan"],
    ),
    (
        STEP,
        {"type": "route", "ref": HERO},
        case(phase="valued", photo="verified"),
        ["model router_write", f"POST {HERO}/plan"],
    ),
    (STEP, {"type": "settle", "ref": HERO}, None, [f"POST {HERO}/documents"]),
    (
        "offer.received",
        {"ref": HERO, "message": 3},
        case(
            phase="executing", photo="verified", listing=LISTING, chat=[{"id": "3", "from": "buyer", "text": "When?"}]
        ),
        ["model negotiator_chat", f"POST {HERO}/messages/3/answer"],
    ),
]


@pytest.mark.parametrize(("topic", "payload", "the_case", "expected"), TRAJECTORIES)
async def test_each_pipeline_follows_its_trajectory(run, backend, topic, payload, the_case, expected):
    if the_case is not None:
        backend["GET", CASE] = the_case
    _, rc = await run(message(topic, payload))
    assert rc.trajectory == expected


async def test_execute_runs_its_branches_each_in_order(run, backend):
    backend["GET", CASE] = case(phase="approved", photo="verified")
    _, rc = await run(message(STEP, {"type": "execute", "ref": HERO}))
    t = rc.trajectory
    # the branches run side by side; each one's model call comes before its own report
    assert sorted(t) == sorted(
        ["model lister_write", f"POST {HERO}/listing", "model outreach_write", f"POST {HERO}/offer"]
    )
    assert t.index("model lister_write") < t.index(f"POST {HERO}/listing")
    assert t.index("model outreach_write") < t.index(f"POST {HERO}/offer")


async def test_the_donation_trajectory_needs_no_model(run, backend):
    backend["GET", f"{C}/cases/{MANGO}"] = case(
        phase="executing", photo="verified", which="mango", offer={"status": "closed"}
    )
    _, rc = await run(message(STEP, {"type": "execute", "ref": MANGO}))
    assert rc.trajectory == [f"POST {MANGO}/donation"]

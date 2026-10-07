"""The model tier's rules: the 20 s timeout, falling back on any error by leaving the field out (backend-api's
template stands in), outputs held to their schema, at most 12 calls a run, and no live model in the stub tier."""

import json

import pytest

from sc_agents.models import ModelTier, Recordings, Unreachable, prompt, prompt_version
from sc_agents.settings import Settings
from tests.conftest import CASE, HERO, LISTING, PHOTO, case, message

STEP = "journey.step"


async def test_a_model_call_past_its_timeout_falls_back(run, backend, recordings, deps):
    deps.settings.model_timeout_s = 0.05
    deps.settings.model_attempts = 1
    recordings.data["router_write"] = {"json": {"explanation": "late words"}, "delay": 0.5}
    backend["GET", CASE] = case(phase="valued", photo="verified")
    outcome, rc = await run(message(STEP, {"type": "route", "ref": HERO}))
    assert outcome == "done"
    body = backend.report("plan")
    assert "explanation" not in body  # the template stands in
    assert body["run"]["fallback"] is True and body["run"]["model"] == "stub"
    assert rc.runs["router"].final_status == "fallback" and "timeout" in rc.runs["router"].note


async def test_a_model_error_falls_back(run, backend, recordings):
    recordings.data["valuer_write"] = {"error": "429 RESOURCE_EXHAUSTED"}
    backend["GET", CASE] = case(phase="verified", photo="verified")
    await run(message(STEP, {"type": "value", "ref": HERO}))
    assert backend.report("valuation")["notes"] == {}
    assert backend.report("valuation")["run"]["fallback"] is True
    # the Router still writes its own words
    assert backend.report("plan")["run"]["fallback"] is False


async def test_an_output_that_misses_its_schema_falls_back(run, backend, recordings):
    recordings.data["router_write"] = {"text": "Sure! Here is the plan explained."}
    backend["GET", CASE] = case(phase="valued", photo="verified")
    _, rc = await run(message(STEP, {"type": "route", "ref": HERO}))
    assert "explanation" not in backend.report("plan")
    assert "did not validate" in rc.runs["router"].note


async def test_words_with_a_figure_outside_the_plan_fall_back(run, backend, recordings):
    recordings.data["router_write"] = {"json": {"explanation": "Send 600 units to the kiranas at ₹19 for ₹22,000."}}
    backend["GET", CASE] = case(phase="valued", photo="verified")
    await run(message(STEP, {"type": "route", "ref": HERO}))
    body = backend.report("plan")
    assert "explanation" not in body and body["run"]["fallback"] is True


async def test_a_note_with_a_foreign_figure_is_left_out_alone(run, backend, recordings):
    recordings.data["valuer_write"] = {
        "json": {
            "notes": [
                {"channel": "expiresoon", "note": "₹15 a pack, no cap."},
                {"channel": "kirana", "note": "Capped at 900 units."},
                {"channel": "bogus", "note": "x"},
            ]
        }
    }
    backend["GET", CASE] = case(phase="verified", photo="verified")
    await run(message(STEP, {"type": "value", "ref": HERO}))
    assert backend.report("valuation")["notes"] == {"expiresoon": "₹15 a pack, no cap."}


async def test_a_run_makes_at_most_twelve_model_calls(run, backend, deps):
    deps.settings.model_calls_per_run = 2
    _, rc = await run(message(STEP, {"type": "decide", "ref": HERO, "photo": PHOTO}))
    # Vision and the Valuer called; the Router's call was over the limit, so its template stands in
    assert [r["writer"] for r in rc.requests] == ["vision_read", "valuer_write"]
    assert backend.report("plan")["run"]["fallback"] is True and "explanation" not in backend.report("plan")
    assert rc.model_calls == 3


async def test_the_stub_tier_never_reaches_a_model(run, backend, recordings):
    """with no recording, the writer fails (and falls back): it never reaches a live model"""
    del recordings.data["lister_write"]
    backend["GET", CASE] = case(phase="approved", photo="verified")
    _, rc = await run(message(STEP, {"type": "execute", "ref": HERO}))
    assert backend.report("listing")["run"]["fallback"] is True
    assert rc.runs["lister"].fallback is True


async def test_the_unreachable_model_raises():
    with pytest.raises(RuntimeError, match="stub"):
        async for _ in Unreachable().generate_content_async(None):  # type: ignore[arg-type]
            pass


async def test_the_reports_carry_the_tokens_and_time_into_agent_runs(run, warehouse):
    await run(message(STEP, {"type": "decide", "ref": HERO, "photo": PHOTO}))
    rows = {r["agent_id"]: r for r in warehouse.tables["agent_runs"]}
    assert set(rows) == {"vision", "valuer", "router"}
    assert rows["vision"]["tokens_in"] == 1412 and rows["vision"]["tokens_out"] == 61
    assert all(r["status"] == "done" and r["model"] == "stub" and len(r["trace_id"]) == 32 for r in rows.values())
    assert rows["router"]["event_type"] == "decide" and rows["router"]["batch_ref"] == HERO


async def test_a_run_log_that_fails_only_logs(run, backend, warehouse, caplog):
    warehouse.fail.add("agent_runs")
    outcome, _ = await run(message("batch.at_risk", {"ref": HERO}))
    assert outcome == "done" and "not logged" in caplog.text


def test_the_live_tier_gives_gemini_the_services_credentials(monkeypatch):
    """ADK's Gemini model builds google-genai's Client from client_kwargs: Vertex AI, the project, the location and our
    credentials (impersonated sc-agents-local on a laptop); no API key, and nothing is called here"""
    sentinel = object()
    monkeypatch.setattr("sc_agents.gcp.credentials", lambda: sentinel)
    s = Settings(
        _env_file=None,
        model_tier="live",
        model_pro="pro-model",
        model_flash="flash-model",
        google_cloud_project="p",
        genai_location="global",
    )
    tier = ModelTier(s)
    llm = tier.llm("pro")
    assert llm.model == "pro-model"
    assert llm.client_kwargs == {"enterprise": True, "project": "p", "location": "global", "credentials": sentinel}
    assert tier.model_id("flash") == "flash-model"


def test_live_needs_both_model_ids():
    s = Settings(_env_file=None, model_tier="live", model_pro=None, model_flash="f")
    with pytest.raises(RuntimeError, match="MODEL_PRO"):
        s.model_id("pro")
    assert Settings(_env_file=None, model_tier="stub").model_id("pro") == "stub"


def test_the_prompts_load_and_have_versions():
    for name in ("vision", "valuer", "router", "lister", "outreach", "negotiator_bid", "negotiator_chat", "data_map"):
        assert len(prompt(name)) > 200 and len(prompt_version(name)) == 12


def test_recordings_answer_in_turn_and_by_selector():
    r = Recordings(
        {"a": [{"json": {"x": 1}}, {"json": {"x": 2}}], "b": {"by": {"k": {"json": 3}}, "default": {"json": 4}}}
    )
    assert r.answer("a")["json"] == {"x": 1} and r.answer("a")["json"] == {"x": 2} and r.answer("a") is None
    assert r.answer("b", "k")["json"] == 3 and r.answer("b", "z")["json"] == 4


def test_every_recording_is_valid_for_its_writer():
    from sc_agents.agents import data, impact, lister, negotiator, outreach, paperwork, router, valuer, vision
    from sc_agents.models import validate

    schemas = {
        "vision_read": vision.LabelRead,
        "valuer_write": valuer.Notes,
        "router_write": router.Explanation,
        "lister_write": lister.Listing,
        "outreach_write": outreach.Offer,
        "negotiator_bid": negotiator.Reply,
        "negotiator_chat": negotiator.Reply,
        "data_map": data.Mappings,
        "paperwork_note": paperwork.Note,
        "impact_narrative": impact.Narrative,
    }
    recorded = Recordings.load().data
    assert set(recorded) == set(schemas)
    for name, schema in schemas.items():
        assert validate(schema, json.dumps(recorded[name]["json"], ensure_ascii=False)) is not None, name


async def test_execute_branches_fall_back_independently(run, backend, recordings):
    recordings.data["outreach_write"] = {"error": "boom"}
    backend["GET", CASE] = case(phase="approved", photo="verified")
    await run(message(STEP, {"type": "execute", "ref": HERO}))
    assert backend.report("offer")["words"] == {} and backend.report("offer")["run"]["fallback"] is True
    assert backend.report("listing")["run"]["fallback"] is False and "title" in backend.report("listing")
    assert LISTING["reserve"] == 13.5


def test_a_call_is_allowed_every_attempt_and_the_waits_between(deps):
    """Bounded's deadline covers the retries google-genai makes on 429, 500, 503 and 504, and no more (SC-77)"""
    from sc_agents.models import budget, retries

    deps.settings.model_timeout_s, deps.settings.model_attempts = 30.0, 3
    r = retries(deps.settings)
    assert r.attempts == 3 and set(r.http_status_codes) == {429, 500, 503, 504}
    assert budget(deps.settings) == 30 * 3 + (1 + 1) + (2 + 1)
    deps.settings.model_attempts = 1
    assert budget(deps.settings) == 30

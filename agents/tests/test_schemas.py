"""Every structured output in the shape Gemini fills (SC-77). The first live eval run found two shapes it does not: a
map of free keys came back empty (the Data agent's columns, the Valuer's notes, the judge's scores), and a field that
was not required was left out (Vision returned only its confidence). So no schema holds a map, every property is
required (null stands for "not there"), and every recording still validates."""

import json
from typing import Any

import pytest
from pydantic import BaseModel

from sc_agents.agents import data, impact, lister, negotiator, outreach, paperwork, router, valuer, vision
from sc_agents.evals import judge
from sc_agents.models import RECORDINGS

WRITERS: dict[str, type[BaseModel]] = {
    "data_map": data.Mappings,
    "vision_read": vision.LabelRead,
    "vision_destruction": vision.DestructionRead,
    "valuer_write": valuer.Notes,
    "router_write": router.Explanation,
    "lister_write": lister.Listing,
    "outreach_write": outreach.Offer,
    "negotiator_bid": negotiator.Reply,
    "negotiator_chat": negotiator.Reply,
    "paperwork_note": paperwork.Note,
    "impact_narrative": impact.Narrative,
}
SCHEMAS = {**WRITERS, "judge": judge.Verdict}


def objects(schema: dict[str, Any]) -> list[tuple[str, dict[str, Any]]]:
    """every object in a JSON schema, its $defs included, with where it sits"""
    out: list[tuple[str, dict[str, Any]]] = []

    def walk(node: Any, at: str) -> None:
        if isinstance(node, dict):
            if node.get("type") == "object" or "properties" in node or "additionalProperties" in node:
                out.append((at, node))
            for k, v in node.items():
                walk(v, f"{at}.{k}")
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{at}[{i}]")

    walk(schema, "$")
    return out


def responses(spec: Any) -> list[dict[str, Any]]:
    """a recording's responses: one, a list answered in turn, or {"by": …, "default": …}"""
    if isinstance(spec, list):
        return spec
    if isinstance(spec, dict) and "by" in spec:
        return [*spec["by"].values(), *([spec["default"]] if spec.get("default") else [])]
    return [spec]


@pytest.mark.parametrize("name", sorted(SCHEMAS))
def test_no_schema_holds_a_map_of_free_keys(name):
    for at, obj in objects(SCHEMAS[name].model_json_schema()):
        extra = obj.get("additionalProperties")
        assert extra in (None, False), f"{name} {at}: a map; Gemini returns it empty, so give a list of pairs"
        assert obj.get("properties"), f"{name} {at}: an object with no properties"


@pytest.mark.parametrize("name", sorted(SCHEMAS))
def test_every_property_is_required(name):
    for at, obj in objects(SCHEMAS[name].model_json_schema()):
        missing = set(obj.get("properties") or {}) - set(obj.get("required") or [])
        assert not missing, (
            f"{name} {at}: {sorted(missing)} not required; Gemini may leave them out (make them nullable)"
        )


def test_every_writer_has_its_recording():
    assert {f.stem for f in RECORDINGS.glob("*.json")} == set(WRITERS)


@pytest.mark.parametrize("name", sorted(WRITERS))
def test_every_recording_validates_against_its_schema(name):
    spec = json.loads((RECORDINGS / f"{name}.json").read_text(encoding="utf-8"))
    answers = [r for r in responses(spec) if isinstance(r, dict) and "json" in r]
    assert answers, f"{name}: no recorded answer"
    for r in answers:
        WRITERS[name].model_validate(r["json"])

"""Writes story.json, the test suite's picture of backend-api for the story's batch, from backend-api's own reference
data (journey.json and money.json, which money.js computed): run it again when they change.

    uv run python tests/fixtures/make_story.py
"""

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
REF = HERE.parents[2] / "backend-api" / "src" / "sc_api" / "reference"


def main() -> None:
    j = json.loads((REF / "journey.json").read_text())
    m = json.loads((REF / "money.json").read_text())
    hero = next(p for p in m["plans"] if p["batch"]["id"] == "MF-2409-117")
    mango = next(p for p in m["plans"] if p["batch"]["id"] == "MF-2410-118")
    docs = m["documents"][0]["out"]
    dists = j["distributors"]
    story = {
        "skus": j["skus"],
        "distributors": dists,
        "batches": j["batches"],
        "kiranas": [{"id": k["id"], "name": k["name"], "orders": k["orders"]} for k in j["kiranas"]],
        "shelf": j["shelf"],
        "label": j["label"],
        "hero": {"batch": hero["batch"], "sku": hero["sku"], "plan": hero["plan"], "assess": hero["assess"]},
        "mango": {"batch": mango["batch"], "sku": mango["sku"], "plan": mango["plan"]},
        "docs": docs,
        "counter": m["counter"],
    }
    (HERE / "story.json").write_text(json.dumps(story, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {HERE / 'story.json'}")


if __name__ == "__main__":
    main()

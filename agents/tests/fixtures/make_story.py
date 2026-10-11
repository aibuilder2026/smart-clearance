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
        "label": j["label"],
        "hero": {"batch": hero["batch"], "sku": hero["sku"], "plan": hero["plan"], "assess": hero["assess"]},
        "mango": {"batch": mango["batch"], "sku": mango["sku"], "plan": mango["plan"]},
        "docs": docs,
        "counter": m["counter"],
        # the GST papers' parties (SC-148): the client as its own papers name it, with who signs them (SC-174), the
        # buyer as his invoice does
        "client": {
            k: j["client"].get(k)
            for k in (
                "name",
                "short",
                "gstin",
                "fssai",
                "pan",
                "cin",
                "address",
                "state",
                "stateCode",
                "email",
                "signatory",
            )
        },
        "buyer": j["buyer"],
        "balanceHours": j["market"]["balanceHours"],
        "ewayThreshold": m["rules"]["ewayThreshold"],
        "scheme": m["rules"]["scheme"],
        # Shree Ganesh Kirana's tax invoice for the chips (SC-153), as backend-api issues it as the shop orders
        "kiranaInvoice": {
            "no": "RT/26-27/1279",
            "date": "2026-10-02",
            "at": "2026-10-02T09:52",
            "kirana": "k0",
            "shop": {"id": "k0", "name": "Shree Ganesh Kirana", "area": "Itwari", "pincode": "440002"},
            **next(c["out"] for c in m["kiranaInvoice"] if c["units"] == 24 and c["sku"]["id"] == "chips"),
            "pdf": False,
        },
    }
    (HERE / "story.json").write_text(json.dumps(story, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {HERE / 'story.json'}")


if __name__ == "__main__":
    main()

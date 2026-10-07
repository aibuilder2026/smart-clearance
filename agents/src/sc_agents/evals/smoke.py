"""A live smoke test of the models (agents/scripts/smoke.sh): one case a writer, the story's batch where there is one,
each output printed with whether it passes its checks. About a dozen Gemini calls; never run by CI or the tests.

    python -m sc_agents.evals.smoke [--record DIR]

--record writes each writer's output as a recording (DIR/<writer>.json), in the form the stub tier replays.
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

from sc_agents.evals import harness, scorers
from sc_agents.models import ModelTier
from sc_agents.runs import Deps
from sc_agents.settings import get_settings

# the story's case in each set
FIRST = {
    "vision": "story-clean",
    "data": "data-tally-stock",
    "valuer": "valuer-MF-2409-117",
    "router": "router-MF-2409-117",
    "lister": None,
    "outreach": None,
    "negotiator": None,
}


async def main_async(record: Path | None) -> int:
    from sc_agents import logs

    settings = get_settings()
    if settings.model_tier != "live":
        print("smoke: set MODEL_TIER=live (scripts/smoke.sh does)", file=sys.stderr)
        return 2
    logs.configure(settings)
    deps = Deps(
        settings=settings,
        backend=None,  # type: ignore[arg-type]
        models=ModelTier(settings),
        warehouse=None,  # type: ignore[arg-type]
        store=None,  # type: ignore[arg-type]
        render_pdf=lambda page: b"",
    )
    failed = 0
    picks = []
    for name, first in FIRST.items():
        cases = harness.load(name)
        picks.append((name, next((c for c in cases if c["id"] == first), cases[0])))
    picks.append(("negotiator", next(c for c in harness.load("negotiator") if c["type"] == "chat")))
    for name, case in picks:
        spec = harness.spec_of(name, case)
        out, rc, state = await harness.run_case(name, case, deps)
        scores, problems = scorers.score(name, case, out, state)
        run = rc.runs.get(spec.agent)
        ok = bool(scores["pass"])
        failed += not ok
        where = f"{run.model}, {run.latency_ms} ms" if run else "no run"
        print(f"{'pass' if ok else 'FAIL'} {spec.writer} on {case['id']} ({where})")
        print("  " + json.dumps(out, ensure_ascii=False)[:600])
        for p in problems:
            print(f"  - {p}")
        if record is not None and out:
            usage = [run.tokens_in, run.tokens_out] if run else [0, 0]
            (record / f"{spec.writer}.json").write_text(
                json.dumps({"json": out, "usage": usage}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
            )
    return 1 if failed else 0


def main() -> None:
    p = argparse.ArgumentParser(prog="smoke", description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    p.add_argument("--record", type=Path, help="a folder to write each output into, as a recording")
    args = p.parse_args()
    if args.record:
        args.record.mkdir(parents=True, exist_ok=True)
    sys.exit(asyncio.run(main_async(args.record)))


if __name__ == "__main__":
    main()

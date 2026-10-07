"""sc-agents-eval: the agents' evals against live Gemini (agents/scripts/eval.sh). Run on request only.

    sc-agents-eval [vision data valuer router lister outreach negotiator] [--split train|held-out|all]
                   [--limit N] [--pace SECONDS] [--no-judge] [--yes]

Each case goes through its writer as the pipeline calls it (harness.py), is scored by the deterministic checks
(scorers.py) and, for the agents that write words, by the Gemini Pro judge at temperature 0 (judge.py). Each case's
result goes into BigQuery's agent_evals (smartclearance_local, as sc-agents-local) and a results file; the set's pass
marks into summary.json beside it.

The cases run one at a time, a second apart (--pace): the first live run met the Pro preview's per-minute quota, and
each call also retries 429, 500, 503 and 504 with backoff (models.py, judge.py) (SC-77).
"""

import argparse
import asyncio
import json
import logging
import secrets
import sys
from datetime import UTC, datetime
from statistics import mean
from typing import Any

from sc_agents.evals import harness, judge, scorers
from sc_agents.models import ModelTier, prompt_version
from sc_agents.runs import Deps
from sc_agents.settings import get_settings

log = logging.getLogger("sc_agents.evals")
SETS = ("vision", "data", "valuer", "router", "lister", "outreach", "negotiator")
JUDGED = {"valuer", "router", "lister", "outreach", "negotiator"}
# a rough cost a case (the writer and the judge), in GBP, from the calls' sizes at Vertex AI's list prices
COST = {
    "vision": 0.002,
    "data": 0.001,
    "valuer": 0.03,
    "router": 0.02,
    "lister": 0.01,
    "outreach": 0.012,
    "negotiator": 0.015,
}


def marks(set_name: str, results: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """the set's pass marks, each with its value, target and whether it was met"""

    def mark(value: float | None, target: float, *, at_most: bool = False) -> dict[str, Any]:
        if value is None:
            judged = sum(1 for r in results if r["scores"].get("rubric"))
            return {"value": None, "target": target, "met": False, "note": f"judged {judged} of {len(results)}"}
        met = value <= target if at_most else value >= target
        return {"value": round(value, 3), "target": target, "met": met}

    def rate(rs: list[dict], key: str) -> float:
        return mean(r["scores"][key] for r in rs) if rs else 1.0

    def rubric(rs: list[dict], criterion: str | None = None) -> float | None:
        """the rubric's mean over the cases judged; None when none was (a judge that never answered is no score)"""
        vals = [
            (r["scores"]["rubric"].get(criterion) if criterion else r["scores"].get("rubricAvg"))
            for r in rs
            if r["scores"].get("rubric")
        ]
        vals = [v for v in vals if v is not None]
        return mean(vals) if vals else None

    rs = results
    if set_name == "vision":
        clean = [r for r in rs if r["kind"] == "clean"]
        hard = [r for r in rs if r["kind"] == "hard"]
        return {
            "cleanExact": mark(rate(clean, "exact"), 1.0),
            "hardPass": mark(rate(hard, "pass"), 0.9),
            "confidentWrongReads": mark(sum(r["scores"]["confidentWrong"] for r in rs), 0, at_most=True),
        }
    if set_name == "data":
        return {
            "requiredMapped": mark(min((r["scores"]["requiredMapped"] for r in rs), default=1.0), 1.0),
            "unknownFlagged": mark(rate(rs, "unknownFlagged"), 1.0),
            "casesPassed": mark(rate(rs, "pass"), 1.0),
        }
    if set_name == "valuer":
        return {
            "noForeignFigure": mark(rate(rs, "noForeignFigure"), 1.0),
            "everyChannel": mark(rate(rs, "everyChannel"), 1.0),
            "rubricAverage": mark(rubric(rs), 4.0),
        }
    if set_name == "router":
        return {
            "noForeignFigure": mark(rate(rs, "figures"), 1.0),
            "rightChannelsNamed": mark(rate(rs, "namesTheSplit"), 1.0),
            "rubricAverage": mark(rubric(rs), 4.0),
        }
    if set_name in ("lister", "outreach"):
        return {
            "noFactualErrorOrLeak": mark(rate(rs, "pass"), 1.0),
            "rubricFaithful": mark(rubric(rs, "faithful"), 4.0),
        }
    if set_name == "negotiator":
        return {
            "reserveNeverLeaked": mark(rate(rs, "reserveKept"), 1.0),
            "onlyTheDecidedPrice": mark(rate(rs, "onlyTheDecidedPrice"), 1.0),
            "noCommitment": mark(
                min((r["scores"]["rubric"].get("noCommitment", 5) for r in rs if r["scores"].get("rubric")), default=5),
                4.0,
            ),
        }
    raise ValueError(set_name)


async def run_set(set_name: str, deps: Deps, args, eval_run: str, client: Any) -> dict[str, Any]:
    cases = harness.load(set_name)
    if args.split != "all":
        cases = [c for c in cases if c["split"] == args.split]
    if args.limit:
        cases = cases[: args.limit]
    settings = deps.settings
    results: list[dict[str, Any]] = []
    rows: list[dict[str, Any]] = []
    for i, case in enumerate(cases):
        if i and args.pace:
            await asyncio.sleep(args.pace)
        spec = harness.spec_of(set_name, case)
        out, rc, state = await harness.run_case(set_name, case, deps)
        scores, problems = scorers.score(set_name, case, out, state)
        run = rc.runs.get(spec.agent)
        if set_name in JUDGED and not args.no_judge and out:
            facts = {k: v for k, v in state.items() if k.endswith(("_facts", "_question", "_before"))}
            try:
                v = await judge.judge(client, settings.model_id("pro"), set_name, facts, out)
                rubric = judge.by_criterion(v, judge.RUBRICS[set_name])
                scores["rubric"], scores["reasons"] = rubric, v.reasons
                scores["rubricAvg"] = round(mean(rubric.values()), 2) if rubric else None
            except Exception as e:
                # not judged: the rubric's mark counts only the cases judged, and says how many were not (SC-77)
                scores["judgeFailed"] = f"{type(e).__name__}: {e}"[:200]
                log.warning("judge failed on %s: %s", case["id"], e)
        passed = bool(scores["pass"]) and (scores.get("rubricAvg") is None or scores["rubricAvg"] >= 4)
        r = {
            "id": case["id"],
            "split": case["split"],
            "kind": case.get("kind"),
            "output": out,
            "scores": scores,
            "problems": problems,
            "passed": passed,
            "fallback": bool(run and run.fallback),
            "tokens": [run.tokens_in, run.tokens_out] if run else [0, 0],
            "latencyMs": run.latency_ms if run else 0,
        }
        results.append(r)
        print(f"  {'pass' if passed else 'FAIL'} {case['id']}" + (f": {'; '.join(problems)}" if problems else ""))
        rows.append(
            {
                "eval_run": eval_run,
                "agent_id": spec.agent,
                "case_id": case["id"],
                "split": case["split"],
                "model": settings.model_id(spec.tier),  # type: ignore[arg-type]
                "prompt_version": prompt_version(spec.prompt),
                "scores": json.dumps(scores, ensure_ascii=False),
                "passed": passed,
                "run_at": datetime.now(UTC).isoformat(),
            }
        )
    try:
        await deps.warehouse.insert("agent_evals", rows, [f"{eval_run}:{r['case_id']}" for r in rows])
    except Exception as e:
        log.warning("agent_evals: not written to BigQuery: %s", e)
    folder = harness.EVALS / set_name
    (folder / f"results-{eval_run}.jsonl").write_text(
        "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in results), encoding="utf-8"
    )
    m = marks(set_name, results)
    summary = {
        "evalRun": eval_run,
        "at": datetime.now(UTC).isoformat(),
        "set": set_name,
        "split": args.split,
        "models": {"pro": settings.model_pro, "flash": settings.model_flash},
        "prompts": {s.prompt: prompt_version(s.prompt) for s in harness.SPECS.values() if s.set == set_name},
        "cases": len(results),
        "passed": sum(r["passed"] for r in results),
        "fallbacks": sum(r["fallback"] for r in results),
        "tokens": [sum(r["tokens"][0] for r in results), sum(r["tokens"][1] for r in results)],
        "marks": m,
        "met": all(x["met"] for x in m.values()),
        "failures": [{"id": r["id"], "problems": r["problems"]} for r in results if not r["passed"]],
    }
    (folder / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return summary


async def main_async(args) -> int:
    from google import genai

    from sc_agents import logs, tracing
    from sc_agents.gcp import credentials
    from sc_agents.tools.bigquery import BigQueryWarehouse

    settings = get_settings()
    if settings.model_tier != "live":
        print("sc-agents-eval: evals call live Gemini; set MODEL_TIER=live (scripts/eval.sh does)", file=sys.stderr)
        return 2
    logs.configure(settings)
    tracing.setup(settings)
    deps = Deps(
        settings=settings,
        backend=None,  # type: ignore[arg-type]  # a writer alone reads nothing from backend-api
        models=ModelTier(settings),
        warehouse=BigQueryWarehouse(settings),
        store=None,  # type: ignore[arg-type]
        render_pdf=lambda page: b"",
    )
    client = genai.Client(
        enterprise=True,
        project=settings.google_cloud_project,
        location=settings.genai_location,
        credentials=credentials(),
    )
    eval_run = f"eval-{datetime.now(UTC):%Y%m%d-%H%M}-{secrets.token_hex(3)}"
    ok = True
    for name in args.sets:
        print(f"{name} ({eval_run}):")
        s = await run_set(name, deps, args, eval_run, client)
        ok = ok and s["met"]
        for k, v in s["marks"].items():
            note = f"; {v['note']}" if v.get("note") else ""
            print(f"  {'met' if v['met'] else 'NOT MET'} {k}: {v['value']} (target {v['target']}){note}")
    return 0 if ok else 1


def main() -> None:
    p = argparse.ArgumentParser(
        prog="sc-agents-eval", description=__doc__, formatter_class=argparse.RawTextHelpFormatter
    )
    p.add_argument("sets", nargs="*", help=f"any of {', '.join(SETS)} (all when none)")
    p.add_argument("--split", choices=["train", "held-out", "all"], default="all")
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--pace", type=float, default=1.0, help="seconds between cases (default 1)")
    p.add_argument("--no-judge", action="store_true")
    p.add_argument("--yes", action="store_true", help="skip the cost question")
    args = p.parse_args()
    args.sets = args.sets or list(SETS)
    unknown = [s for s in args.sets if s not in SETS]
    if unknown:
        p.error(f"no eval set {', '.join(unknown)}: choose from {', '.join(SETS)}")
    n = {}
    for s in args.sets:
        cases = [c for c in harness.load(s) if args.split == "all" or c["split"] == args.split]
        n[s] = min(len(cases), args.limit) if args.limit else len(cases)
    cost = sum(COST[s] * n[s] for s in args.sets)
    print(f"sc-agents-eval: {sum(n.values())} cases in {', '.join(args.sets)}; about GBP {cost:.2f} in Gemini calls")
    if not args.yes:
        if not sys.stdin.isatty():
            print("sc-agents-eval: pass --yes to run without a terminal", file=sys.stderr)
            sys.exit(2)
        if input("Run them? [y/N] ").strip().lower() != "y":
            sys.exit(1)
    sys.exit(asyncio.run(main_async(args)))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Sum what the sidecars under a folder cost, by model and by folder.

  uv run cost.py ../../designs/SC-154 [--cap 45]

Reads every `*.prompt.json` with a `cost_usd`; a film's own sidecar carries `cost_usd_clips` and is not counted
twice. --cap exits 1 when the total is over it.
"""
from __future__ import annotations

import argparse
import collections
import json
import pathlib
import sys

import _vx


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("folder", nargs="+"); p.add_argument("--cap", type=float)
    a = p.parse_args()
    by_model, by_dir, total, n = collections.Counter(), collections.Counter(), 0.0, 0
    for folder in a.folder:
        for sc in pathlib.Path(folder).rglob("*.prompt.json"):
            try:
                d = json.loads(sc.read_text())
            except json.JSONDecodeError:
                continue
            c = d.get("cost_usd")
            if not isinstance(c, (int, float)) or d.get("derived_from"):
                continue
            by_model[d.get("model", "?")] += c; by_dir[str(sc.parent)] += c; total += c; n += 1
    for k, v in by_model.most_common():
        print(f"  {v:7.2f}  {k}")
    print("by folder:")
    for k, v in sorted(by_dir.items()):
        print(f"  {v:7.2f}  {k}")
    print(f"total ${total:.2f} (£{_vx.gbp(total)}) over {n} assets; prices of {_vx.PRICE_DATE}")
    if a.cap is not None and total > a.cap:
        sys.exit(f"over the cap of ${a.cap}")


if __name__ == "__main__":
    main()

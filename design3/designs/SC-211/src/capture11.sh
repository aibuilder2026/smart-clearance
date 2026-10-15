#!/usr/bin/env bash
# SC-211: every scene page captured frame-exact on the narration's own cues (shots11.py writes build/<page>-cues.json):
# the agents as a graph in two segments, every team's part, installed as an app, the audit trail, the platform watching
# itself. Each lands in build/<name>/ (frames, frames.json, events.json for the mix).
#   ./capture11.sh [name…]      (names: graph11-A graph11-B teams11 pwa11 audit11 ops11)
set -eu
cd "$(dirname "$0")"
.venv/bin/python -c "import shots11; shots11.build()" >/dev/null
names="${*:-graph11-A graph11-B teams11 pwa11 audit11 ops11}"
for n in $names; do
  case $n in graph11-A|graph11-B) page=graph11/graph.html;; teams11) page=teams11/teams.html;; pwa11) page=pwa11/pwa.html;;
    audit11) page=audit11/audit.html;; ops11) page=ops11/ops.html;; *) echo "unknown $n"; exit 2;; esac
  rm -rf "build/$n"
  echo "== $n $(date +%H:%M:%S)"
  node capture-page.mjs "$page" "build/$n" "build/$n-cues.json" 25 | tail -1
done

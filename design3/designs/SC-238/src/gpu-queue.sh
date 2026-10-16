#!/usr/bin/env bash
# SC-238: the GPU's queue, one job at a time: the keyframes' detail pass (gen-qwen2.sh, already running), the narration
# (tts/vo.py, Maya1, three takes a line), then the LTX clips (gen-ltx.py ltx-jobs.json).
#   nohup ./gpu-queue.sh > gpu-queue.log 2>&1 &
set -u
cd "$(dirname "$0")"
SNAC=/Users/arundutta/projects/smart-clearance/.claude/worktrees/SC-205-demo-film/design3/designs/SC-209/src/tts/.venv-snac/bin/python
until ! pgrep -f "[g]en-qwen" >/dev/null; do sleep 15; done
echo "== voice $(date +%H:%M:%S)"
(cd tts && "$SNAC" vo.py 3) 2>&1 | grep -v "^\s*$" | grep -v Warning
echo "== ltx $(date +%H:%M:%S)"
~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs.json
echo "== queue done $(date +%H:%M:%S)"

#!/usr/bin/env bash
# SC-238 GPU queue, pass 10: after the keyframes (gen-qwen10*.sh), the destruction's three narration lines (Maya1, four
# takes each, scored and picked), then the to-camera talking takes (ltx-jobs10.json) and the destruction filmed at the
# landfill (ltx-jobs10x.json, written once its keyframes are reviewed), one GPU job at a time.
set -u
cd "$(dirname "$0")"
SNAC=/Users/arundutta/projects/smart-clearance/.claude/worktrees/SC-205-demo-film/design3/designs/SC-209/src/tts/.venv-snac/bin/python
while pgrep -f "[g]en-qwen10b?.sh" >/dev/null; do sleep 20; done
echo "== vo $(date +%H:%M:%S)"
(cd tts && "$SNAC" vo.py 4 n34 n34b n34c) 2>&1 | grep -v "^\s*$" | grep -v Warning
(cd tts && uv run -q --python 3.12 --with torch --with torchaudio --with soundfile --with numpy python mos.py vo/maya1w-warm/takes 2>&1 | tail -2)
(cd tts && uv run -q --python 3.12 --with mlx-whisper --with soundfile python pick.py vo/maya1w-warm 2>&1 | grep -E "^n34")
echo "== ltx talkers $(date +%H:%M:%S)"
~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs10.json
while [ ! -f ltx-jobs10x.json ]; do sleep 30; done
echo "== ltx destruction $(date +%H:%M:%S)"
~/.local/bin/uv run --python 3.12 --script gen-ltx.py ltx-jobs10x.json
echo "== queue10 done $(date +%H:%M:%S)"

#!/usr/bin/env bash
# SC-209: one GPU job at a time: the ExpireSoon line's takes (tts/vo5.py), their naturalness and read-back, then the
# photoreal keyframes (gen-qwen9.sh). The landfill's clip (gen-ltx9.py) follows once its cartons are labelled.
set -u
cd "$(dirname "$0")"
while pgrep -f "vo5.py|gen-qwen|gen-ltx" > /dev/null; do sleep 15; done
cd tts
.venv-snac/bin/python vo5.py 6 s02
/Users/arundutta/projects/smart-clearance/.claude/worktrees/SC-200-demo-film/design3/designs/SC-200/src/tts/.venv-kokoro/bin/python mos.py vo3/maya1w-warm/takes
~/.local/bin/uv run --quiet --python 3.12 --with mlx-whisper --with soundfile python pick.py vo3/maya1w-warm
echo "voice done $(date +%H:%M:%S)"
cd ..
./gen-qwen9.sh

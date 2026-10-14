#!/usr/bin/env bash
# SC-208: after the keyframes (gen-qwen6.sh), the five shortened lines' takes, then their naturalness and the read-back
set -u
cd "$(dirname "$0")"
while pgrep -f "gen-qwen6.sh" > /dev/null; do sleep 15; done
echo "keyframes done $(date +%H:%M:%S)"
cd tts
.venv-snac/bin/python vo5.py 6 a01 a02 m04 m09 c01
/Users/arundutta/projects/smart-clearance/.claude/worktrees/SC-200-demo-film/design3/designs/SC-200/src/tts/.venv-kokoro/bin/python mos.py vo3/maya1w-warm/takes
~/.local/bin/uv run --quiet --python 3.12 --with mlx-whisper --with soundfile python pick.py vo3/maya1w-warm
echo "voice done $(date +%H:%M:%S)"

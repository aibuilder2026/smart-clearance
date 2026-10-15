#!/usr/bin/env bash
# SC-219: cut 9's new narration lines in the warm Maya1 voice (six takes each), their naturalness (UTMOS), then the
# take each line keeps, by Whisper's read-back and naturalness (pick.py writes durations.json and asr.json)
set -u
cd "$(dirname "$0")/tts"
.venv-snac/bin/python vo5.py 6 b91 u02 u03 u04 u05 u06 x01 p02 q01 q02 q03
/Users/arundutta/projects/smart-clearance/.claude/worktrees/SC-200-demo-film/design3/designs/SC-200/src/tts/.venv-kokoro/bin/python mos.py vo3/maya1w-warm/takes
~/.local/bin/uv run --quiet --python 3.12 --with mlx-whisper --with soundfile python pick.py vo3/maya1w-warm
echo "voice done $(date +%H:%M:%S)"

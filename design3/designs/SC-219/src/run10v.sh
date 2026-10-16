#!/usr/bin/env bash
# SC-219 (cut 10): the new narration lines in the warm Maya1 voice (six takes each), their naturalness (UTMOS), then the
# take each line keeps, by Whisper's read-back and naturalness (pick.py writes durations.json and asr.json):
# i13, the opening's second line, shorter; x24, the use cases ("live" said as in "live on production": its /aɪ/ checked
# with tts/vowel.py); u17 and u18, nine AI agents and the two Gemini tiers (u15, x21 and x23 were drafts).
# lines.json names the take kept where Whisper's pick is not enough: i13, u18 and m08 keep a take whose consonants still
# read with the music under them ("date", "prices", "packs"), checked by voicing each take over the bed at its place
set -u
cd "$(dirname "$0")/tts"
.venv-snac/bin/python vo5.py 6 i13 x24 u17 u18
/Users/arundutta/projects/smart-clearance/.claude/worktrees/SC-200-demo-film/design3/designs/SC-200/src/tts/.venv-kokoro/bin/python mos.py vo3/maya1w-warm/takes
~/.local/bin/uv run --quiet --python 3.12 --with mlx-whisper --with soundfile python pick.py vo3/maya1w-warm
echo "voice done $(date +%H:%M:%S)"

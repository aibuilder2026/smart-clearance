#!/usr/bin/env bash
# SC-208: one GPU job at a time: the voice's takes (tts/vo5.py), then the photoreal keyframes (gen-qwen6.sh)
set -u
cd "$(dirname "$0")"
while pgrep -f "vo5.py" > /dev/null; do sleep 15; done
echo "voice done $(date +%H:%M:%S)"
./gen-qwen6.sh

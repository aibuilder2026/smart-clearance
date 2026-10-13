#!/usr/bin/env bash
# waits for gen-qwen.sh, then runs the LTX clips
cd "$(dirname "$0")"
while pgrep -f gen-qwen.sh >/dev/null; do sleep 20; done
exec ~/.local/bin/uv run --python 3.12 --script gen-ltx.py

#!/bin/bash
# waits for the Qwen batch to finish (memory), then renders every clip; log: gen-ltx.log
HERE="$(cd "$(dirname "$0")" && pwd)"
while ! grep -q "== done" "$HERE/gen-qwen.log" 2>/dev/null; do sleep 30; done
while pgrep -f qwen_image_bf16_mac >/dev/null; do sleep 15; done
sleep 20
exec /Users/arundutta/.local/bin/uv run --quiet --python 3.12 --script "$HERE/gen-ltx.py" "$@"

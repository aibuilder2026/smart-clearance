#!/usr/bin/env bash
# SC-205: the signing frame with one pen (the officer's); replaces c4b once reviewed
set -u
cd "$(dirname "$0")"
while pgrep -f gen-qwen4.sh >/dev/null; do sleep 5; done
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE.txt)"
[ -f img/c4c-landfill-sign.png ] || "$PY" "$Q" "$(cat prompts/c4c-landfill-sign.txt) $STYLE" --image img/c4b-landfill-sign.png --size 1024 --seed 205333 --out img/c4c-landfill-sign.png 2>&1 | tail -1
echo "qwen5 done $(date +%H:%M:%S)"

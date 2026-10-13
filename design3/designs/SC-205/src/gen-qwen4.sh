#!/usr/bin/env bash
# SC-205 cut 2 retakes after review: the landfill without the stray tablets; the staff sale with one phone; then
# Lakshmi swapped into it. Runs after gen-qwen3.sh; LTX waits for qwen4.done.
set -u
cd "$(dirname "$0")"
while pgrep -f gen-qwen3.sh >/dev/null; do sleep 5; done
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE.txt)"; ND="$(cat prompts/STYLE-nodevice.txt)"
rm -f img/m5c-staff-upi.png
[ -f img/m5b-staff-upi.png ] || "$PY" "$Q" "$(cat prompts/m5b-staff-upi.txt) $STYLE" --aspect 16:9 --size 1024 --seed 205125 --out img/m5b-staff-upi.png 2>&1 | tail -1
[ -f img/m5c-staff-upi.png ] || "$PY" "$Q" "$(cat prompts/m5c-staff-upi.txt) $STYLE" --image img/m5b-staff-upi.png --image img/n2-mango-godown.png --size 1024 --seed 205116 --out img/m5c-staff-upi.png 2>&1 | tail -1
[ -f img/i3-landfill.png ] || "$PY" "$Q" "$(cat prompts/i3-landfill.txt) $ND" --aspect 16:9 --size 2048 --seed 205013 --out img/i3-landfill.png 2>&1 | tail -1
echo "qwen4 done $(date +%H:%M:%S)"; touch qwen4.done

#!/usr/bin/env bash
# SC-238 keyframes, pass 9b: the distributor at her godown in the evening, reading her portal on a tablet (an edit of her
# evening call), so the portal's shot is not the verify shot's clip again. Waits for pass 9.
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]en-qwen9.sh" >/dev/null; do sleep 15; done
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
for s in 238903 238904; do
  k="d-portal-$s"; [ -f "img/$k.png" ] && { echo "$k exists"; continue; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/d-portal.txt) $(cat prompts/kf/STYLE.txt)" --image img/mcu/d-eve-call.png --size 1024 --seed "$s" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
done
echo "qwen9b done $(date +%H:%M:%S)"

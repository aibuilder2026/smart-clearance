#!/usr/bin/env bash
# SC-238 keyframes, pass 10b: the shopkeeper who takes the van's carton (SC-208's van clip, the black-haired man) turned
# to the lens for his line, so the man who takes the carton is the man who speaks (r3: two faces for one role).
set -u
cd "$(dirname "$0")"
while pgrep -f "[g]en-qwen10.sh" >/dev/null; do sleep 15; done
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
for s in 239021 239022; do
  k="s-shop-d-$s"; [ -f "img/$k.png" ] && { echo "$k exists"; continue; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/s-shop-d.txt) $(cat prompts/kf/STYLE.txt)" --image img/src-van-shop.png --size 1024 --seed "$s" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
done
echo "qwen10b done $(date +%H:%M:%S)"

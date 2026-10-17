#!/usr/bin/env bash
# SC-238 keyframes, pass 6: the distributor reads a mango pack's date, again (pass 5 came out square, so the 16:9 crop cut
# her face, and kept the second pair of glasses on the chain at her chest, which SC-154's maintainer rejected): a 16:9
# edit of her raise-phone keyframe with the pack's render, her glasses on her nose, the carton's packs seen from above.
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
while pgrep -f "[g]en-qwen[2345].sh" >/dev/null; do sleep 10; done
for seed in 238502 238503; do
  k="d-mango-pack2-$seed"; [ -f "img/$k.png" ] && { echo "$k exists"; continue; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/d-mango-pack2.txt) $(cat prompts/kf/STYLE.txt)" --image img/d-raise-phone.png --image img/ref-pack-mango.png --aspect 16:9 --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
done
echo "qwen6 done $(date +%H:%M:%S)"

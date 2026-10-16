#!/usr/bin/env bash
# SC-209 cut 7: photoreal keyframes. The landfill re-shot at dusk with the batch's cartons sliding off a dump truck,
# kites and smoke (a better background for the food wasted and its ESG impact), and two more brands' factory lines for
# the brand scene (a tea packing line, a biscuit line), beside cut 5's snack line (n1-factory-line).
#   nohup ./gen-qwen9.sh > gen-qwen9.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE3.txt)"; CART="$(cat prompts/CARTONS.txt)"
place(){ local k="$1" seed="$2" cart="$3"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) $cart $STYLE" --aspect 16:9 --size 2048 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
place w1-landfill 209001 "$CART"
place b2-factory-tea 209002 ""
place b3-factory-biscuits 209003 ""
echo "qwen9 done $(date +%H:%M:%S)"; touch qwen9.done

#!/usr/bin/env bash
# SC-209 cut 7b: three concepts for the bin's background, after the maintainer asked for "something unique and
# aesthetic" in place of the landfill: an aerial trail of the batch's cartons, one carton half buried in light, and the
# packs in rows on cracked earth. Previews at 1024; the pick is made again at 2048.
#   nohup ./gen-qwen9c.sh [size] > gen-qwen9c.log 2>&1 &
set -u
cd "$(dirname "$0")"
SIZE="${1:-1024}"; SUF="$([ "$SIZE" = 1024 ] && echo -p || echo)"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE3.txt)"; CART="$(cat prompts/CARTONS.txt)"
place(){ local k="$1" seed="$2" cart="$3"; [ -f "img/$k$SUF.png" ] && { echo "$k$SUF exists"; return; }
  echo "== $k$SUF $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) $cart $STYLE" --aspect 16:9 --size "$SIZE" --seed "$seed" --out "img/$k$SUF.png" 2>&1 | grep -v "^\s*$" | tail -1
}
place w2-aerial 209011 "$CART"
place w2-burial 209012 "$CART"
place w2-rows 209013 ""
echo "qwen9c done $(date +%H:%M:%S)"

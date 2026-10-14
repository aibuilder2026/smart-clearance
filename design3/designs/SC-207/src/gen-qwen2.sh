#!/usr/bin/env bash
# SC-206 cut 3 retakes, after gen-qwen.sh: face shots whose device came out the wrong way round (its screen towards
# the camera while the person looks at it). Same cast sheet, new wording and seed.
set -u
cd "$(dirname "$0")"
while pgrep -f "gen-qwen.sh" > /dev/null; do sleep 15; done
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
D=../..; STYLE="$(cat prompts/STYLE3.txt)"; ID="$(cat prompts/ID.txt)"; CART="$(cat prompts/CARTONS.txt)"
run(){ local k="$1" cast="$2" seed="$3" extra="$4"; [ -f "img/$k.png" ] && { echo "keyframe $k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$ID $(cat prompts/$k.txt) $extra $STYLE" --image "$cast" --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1; }
run f-kirana $D/SC-154/img/cast-kirana.webp 206406 ""
[ -f retakes.txt ] && while read -r k cast seed; do run "$k" "$cast" "$seed" "$CART"; done < retakes.txt
echo "qwen2 done $(date +%H:%M:%S)"; touch qwen2.done

#!/usr/bin/env bash
# SC-200: the film's keyframes on Qwen-Image 2.1 (local, bf16), ~1 MP 16:9, one after another; LTX waits for "qwen done".
#   nohup ./gen-qwen.sh > gen-qwen.log 2>&1 &
set -u
cd "$(dirname "$0")"; HERE="$(pwd)"; IMGS="$HERE/../../../system/img"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE.txt)"
gen(){ local k="$1" seed="$2"; shift 2; [ -f "img/$k.png" ] && { echo "keyframe $k exists"; return; }
  local imgs=(); for i in "$@"; do imgs+=(--image "$i"); done
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) $STYLE" ${imgs[@]+"${imgs[@]}"} --aspect 16:9 --size "${QSIZE:-1024}" --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -2
}
gen g04-town-network 200004
gen g01-hourglass 200001
gen g03-landfill 200003
gen g02-calendar-aisle 200002
gen g06-mango 200006 "$IMGS/pack-mango.webp"
gen g07-chips 200007 "$IMGS/pack-chips.webp"
gen g05-backdrop 200005
[ -f img/g04-town-network.png ] && gen g08-town-sunrise 200008 "$HERE/img/g04-town-network.png"
echo "qwen done $(date +%H:%M:%S)"

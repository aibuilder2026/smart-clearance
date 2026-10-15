#!/usr/bin/env bash
# SC-206 cut 4: the opening's distributor godown, before the carton's label: a wide aisle at dawn, for a slow push along
# it with the forklift crossing. (A second keyframe, a worker lifting a carton, was made with seed 206502; its clip was
# rejected, the carton crumpling as it turned, and the film dives from the aisle into the label instead: its prompt is
# in prompts/rejected/o0b-carton-lift.txt.)
#   nohup ./gen-qwen3.sh > gen-qwen3.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE3.txt)"; CART="$(cat prompts/CARTONS.txt)"
place(){ local k="$1" seed="$2"; [ -f "img/$k.png" ] && { echo "keyframe $k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) $CART $STYLE" --aspect 16:9 --size 2048 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
place o0-godown-aisle 206501
echo "qwen3 done $(date +%H:%M:%S)"; touch qwen3.done

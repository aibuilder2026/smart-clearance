#!/usr/bin/env bash
# SC-205: the new keyframes on Qwen-Image 2.1 (local, bf16), 16:9 at size 2048, one after another.
#   nohup ./gen-qwen.sh > gen-qwen.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE.txt)"
gen(){ local k="$1" seed="$2"; [ -f "img/$k.png" ] && { echo "keyframe $k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) $STYLE" --aspect 16:9 --size "${QSIZE:-2048}" --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -2
}
gen n1-factory-line 205001
gen n2-mango-godown 205002
gen n3-chips-godown-dusk 205003
echo "qwen done $(date +%H:%M:%S)"

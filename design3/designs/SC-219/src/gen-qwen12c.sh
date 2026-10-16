#!/usr/bin/env bash
# SC-219 cut 12: three concepts for the architecture scene, after the maintainer asked for it "more better and
# professional, think of Google Cloud Data center". Stills for A (the data hall) and C (inside the machine); B (the
# floor plan) is drawn as a page. The two motion tests' keyframes at 2048 (LTX makes 1080p from them), the rest at 1024.
#   nohup ./gen-qwen12c.sh > gen-qwen12c.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/DC.txt)"
place(){ local k="$1" seed="$2" size="$3"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $size $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) $STYLE" --aspect 16:9 --size "$size" --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
place dc-a2-aisle 219121 2048
place dc-c1-fibre 219131 2048
place dc-a1-pipes 219122 1024
place dc-a3-tpu 219123 1024
place dc-a4-cage 219124 1024
place dc-c2-blade 219132 1024
place dc-c3-tpu 219133 1024
place dc-c4-vault 219134 1024
echo "qwen12c done $(date +%H:%M:%S)"
touch qwen12c.done

#!/usr/bin/env bash
# SC-211: the talking keyframes' second pass, as gen-qwen11.sh. The distributor's and the buyer's cartons came back from
# the first edit with garbled labels, so their labels are taken off (plain cardboard); the platform team at the console
# (an edit of the working demo's own keyframe); the distributor of the opening, weeks later, her godown cleared (an edit
# of her own cleaned keyframe, so she is the same woman); the shopkeeper's closer frame given its detail back.
# Local Qwen-Image 2.1 (bf16), 1024.
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
edit(){ local k="$1" src="$2" seed="$3" pf="${4:-$1}"; [ -f "img11/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/talk11/$pf.txt)" --image "$src" --size 1024 --seed "$seed" --out "img11/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
edit t1c-distributor img11/t1-distributor.png 211111 clean-labels
edit t5c-buyer img11/t5-buyer.png 211112 clean-labels
edit tn-platform img/f-neha.png 211108
edit tw-distributor img11/t1c-distributor.png 211109
edit t3c-shopkeeper img11/t3-shopkeeper-crop.png 211110
echo "qwen11b done $(date +%H:%M:%S)"

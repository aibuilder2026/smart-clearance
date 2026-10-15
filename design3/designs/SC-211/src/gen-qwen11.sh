#!/usr/bin/env bash
# SC-211: the talking scenes' keyframes, each speaker turned to look into the camera (an edit of the working demo's own
# keyframe, so the cast and the places stay the same; every screen kept facing away), and the brand's head, new. Local
# Qwen-Image 2.1 (bf16), 1024 (the clips are made at 720p). gen-ltx11.py waits while this runs.
#   nohup ./gen-qwen11.sh > gen-qwen11.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE3.txt)"
edit(){ local k="$1" src="$2" seed="$3"; [ -f "img11/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/talk11/$k.txt)" --image "img/$src.png" --size 1024 --seed "$seed" --out "img11/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
make(){ local k="$1" seed="$2"; [ -f "img11/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/talk11/$k.txt) $STYLE" --aspect 16:9 --size 1024 --seed "$seed" --out "img11/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
edit t1-distributor f-lakshmi-L 211101
edit t2-lead f-priya 211102
edit tk-kirana f-kirana 211103
edit t3-shopkeeper dl-kirana-L 211104
edit t5-buyer f-agrawal-L 211105
edit t6-landfill s-landfill-sign 211106
make tb-brand-head 211107
echo "qwen11 done $(date +%H:%M:%S)"

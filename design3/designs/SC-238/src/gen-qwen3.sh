#!/usr/bin/env bash
# SC-238 keyframes, pass 3: the three top-down aerial plates the 3D agents scene floats above (the world below the road:
# a godown yard at dawn, the town's rooftops, a kirana lane), text to image at 16:9. It waits for pass 2 to finish, so
# one Qwen job runs at a time, and the queue's voice waits for it (its name matches gen-qwen).
#   nohup ./gen-qwen3.sh > gen-qwen3.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
while pgrep -f "[g]en-qwen2.sh" >/dev/null; do sleep 10; done
make(){ local k="$1" seed="$2"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/$k.txt)" --aspect 16:9 --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
make a1-godown 238301
make a2-town 238302
make a3-lane 238303
echo "qwen3 done $(date +%H:%M:%S)"

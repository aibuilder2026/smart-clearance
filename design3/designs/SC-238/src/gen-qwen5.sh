#!/usr/bin/env bash
# SC-238 keyframes, pass 5: the distributor checks a mango pack's date at an open carton (the rule scene's first shot),
# an edit of her raise-phone keyframe with the pack's own render as the second image, so she and the pack stay
# themselves. Waits for any other Qwen pass.   nohup ./gen-qwen5.sh > gen-qwen5.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
while pgrep -f "[g]en-qwen[234].sh" >/dev/null; do sleep 10; done
edit(){ local k="$1" seed="$2" base="$3" ref="$4"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/$k.txt) $(cat prompts/kf/STYLE.txt)" --image "$base" --image "$ref" --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
edit d-mango-pack 238501 img/d-raise-phone.png img/ref-pack-mango.png
echo "qwen5 done $(date +%H:%M:%S)"

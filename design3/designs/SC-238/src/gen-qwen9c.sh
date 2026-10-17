#!/usr/bin/env bash
# SC-238 keyframes, pass 9c: the mango batch itself, closer (an insert on the open carton of its packs, an edit of the
# distributor's mango-pack keyframe), for the rule scene's last shot, which reused the godown's opening footage.
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
for s in 238905 238906; do
  k="d-batch-$s"; [ -f "img/$k.png" ] && { echo "$k exists"; continue; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/d-batch.txt) $(cat prompts/kf/STYLE.txt)" --image img/d-mango-pack5-238902.png --size 1024 --seed "$s" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
done
echo "qwen9c done $(date +%H:%M:%S)"

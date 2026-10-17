#!/usr/bin/env bash
# SC-245: the Turn scene's sunrise godown with no workers (the take's two walked away from the camera facing it), two seeds
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
for s in 245101 245102; do
  k="godown-sunrise-empty-$s"; [ -f "img/$k.png" ] && continue
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/sc245/sunrise-empty.txt)" --image img/godown-sunrise.png --size 1024 --seed "$s" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
done
echo "qwen-sc245 done $(date +%H:%M:%S)"

#!/usr/bin/env bash
# SC-219 cut 12's concept round 2, on the maintainer's notes on round 1: mix A and B, a brighter Google look, one
# continuous shot. The bright hall both round-2 options start in, at 2048 (LTX makes 1080p from it), two seeds.
#   nohup ./gen-qwen12d.sh > gen-qwen12d.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/BRIGHT.txt)"
place(){ local k="$1" p="$2" seed="$3" size="$4"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $size $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$p.txt) $STYLE" --aspect 16:9 --size "$size" --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
place dc2-hall-1 dc2-hall 219141 2048
place dc2-hall-2 dc2-hall 219142 2048
echo "qwen12d done $(date +%H:%M:%S)"
touch qwen12d.done

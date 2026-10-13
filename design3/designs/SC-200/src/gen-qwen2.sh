#!/usr/bin/env bash
# SC-200: the two product frames widened to 16:9 (Qwen edits follow the first condition image's shape).
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE.txt | sed 's/No text, no numbers, no lettering, no logos, no signs anywhere in the picture./Only the product keeps its printed label; nothing else carries text./')"
while pgrep -f "gen-qwen.sh" >/dev/null; do sleep 15; done
for k in g06w-mango g07w-chips; do src="refs16/${k/w-/-}-16x9.png"
  [ -f "img/$k.png" ] && continue
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) $STYLE" --image "$src" --aspect 16:9 --size 1024 --seed 2000${k:1:2} --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -2
done
echo "qwen2 done $(date +%H:%M:%S)"

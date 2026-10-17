#!/usr/bin/env bash
# SC-238 keyframes, pass 8 (after the first full-film critic): the supply chain lead reading her tablet at her desk, an
# edit of her own medium shot, so she is one woman throughout; the Nagpur distributor at the landfill about to speak,
# an edit of his own raised-tablet shot, so the landfill line is his and the agency's officer is not two men.
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
edit(){ local k="$1" seed="$2" base="$3"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/$k.txt) $(cat prompts/kf/STYLE.txt)" --image "$base" --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
edit a-desk 238801 img/l-approve.png
edit r-landfill-say 238802 img/r-raise-tablet.png
echo "qwen8 done $(date +%H:%M:%S)"

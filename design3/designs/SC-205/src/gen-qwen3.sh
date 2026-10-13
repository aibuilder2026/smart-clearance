#!/usr/bin/env bash
# SC-205 cut 2 retakes, run after gen-qwen2.sh: the staff sale without printed packs or a signboard; Lakshmi photographing
# a carton whose label side faces away (an edit of n2, so she stays the same woman).
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE.txt)"
[ -f img/m5b-staff-upi.png ] || "$PY" "$Q" "$(cat prompts/m5b-staff-upi.txt) $STYLE" --aspect 16:9 --size 1024 --seed 205115 --out img/m5b-staff-upi.png 2>&1 | tail -1
[ -f img/m2-lakshmi-photo.png ] || "$PY" "$Q" "$(cat prompts/m2-lakshmi-photo.txt) $STYLE" --image img/n2-mango-godown.png --size 1024 --seed 205102 --out img/m2-lakshmi-photo.png 2>&1 | tail -1
[ -f img/m5c-staff-upi.png ] || "$PY" "$Q" "$(cat prompts/m5c-staff-upi.txt) $STYLE" --image img/m5b-staff-upi.png --image img/n2-mango-godown.png --size 1024 --seed 205116 --out img/m5c-staff-upi.png 2>&1 | tail -1
for k in c3 c4; do
  src=$( [ $k = c3 ] && echo c3-landfill-evidence || echo c4-landfill-sign ); out=${k}b-$( [ $k = c3 ] && echo landfill-evidence || echo landfill-sign )
  [ -f img/$out.png ] || "$PY" "$Q" "$(cat prompts/$out.txt) $STYLE" --image img/$src.png --image img/n3-chips-godown-dusk.png --size 1024 --seed 2053$( [ $k = c3 ] && echo 1 || echo 2 ) --out img/$out.png 2>&1 | tail -1
done
echo "qwen3 done $(date +%H:%M:%S)"

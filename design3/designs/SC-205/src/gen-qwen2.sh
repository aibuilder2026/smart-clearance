#!/usr/bin/env bash
# SC-205 cut 2: the characters at work. Text-to-image keyframes at 1024 (character panels) or 2048 (full frame), then
# edits of a keyframe where the same person and place return. One after another; LTX waits for "qwen2 done".
#   nohup ./gen-qwen2.sh > gen-qwen2.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
STYLE="$(cat prompts/STYLE.txt)"
gen(){ local k="$1" seed="$2" size="$3"; [ -f "img/$k.png" ] && { echo "keyframe $k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) $STYLE" --aspect 16:9 --size "$size" --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
edit(){ local k="$1" src="$2" seed="$3"; [ -f "img/$k.png" ] && { echo "keyframe $k exists"; return; }
  [ -f "img/$src.png" ] || { echo "MISSING $src for $k"; return; }
  echo "== $k (edit of $src) $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) Keep the same woman, her face, hair and clothes, and the same room exactly. $STYLE" --image "img/$src.png" --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
gen m1-priya-desk 205101 1024
gen m4-kirana-phone 205104 1024
gen m5-staff-upi 205105 1024
gen m6-meera-van 205106 1024
gen n1-neha-console 205100 1024
gen c2-agrawal-tablet 205202 1024
gen c3-landfill-evidence 205203 1024
gen c4-landfill-sign 205204 1024
edit m3-priya-approve m1-priya-desk 205103
edit m7-kirana-delivery m4-kirana-phone 205107
edit c5-priya-evening m1-priya-desk 205205
gen i2-hold 205002 2048
gen i3-landfill 205003 2048
echo "qwen2 done $(date +%H:%M:%S)"; touch qwen2.done

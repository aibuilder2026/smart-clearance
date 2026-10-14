#!/usr/bin/env bash
# SC-206 cut 3: every person as the app shows them, using their device the right way round. Each keyframe is a
# Qwen-Image edit whose one condition image is the person's own cast sheet (the sheet the app's portrait was cut from,
# SC-194). Two kinds: f-* the face, with the device's back to the camera; s-* over the shoulder, the screen facing the
# person and seen past them (a blank white display, for the live app to be set into). Then the two empty places.
#   nohup ./gen-qwen.sh > gen-qwen.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
D=../..   # design3/designs
STYLE="$(cat prompts/STYLE3.txt)"; ID="$(cat prompts/ID.txt)"; CART="$(cat prompts/CARTONS.txt)"; OFF="$(cat prompts/OFFICE.txt)"
cast(){ case "$1" in neha) echo $D/SC-158/img/cast-neha.webp;; priya) echo $D/SC-154/img/cast-planner.webp;;
  lakshmi) echo $D/SC-158/img/cast-lakshmi.webp;; kirana) echo $D/SC-154/img/cast-kirana.webp;; meera) echo $D/SC-158/img/cast-meera.webp;;
  rakesh) echo $D/SC-154/img/cast-distributor.webp;; agrawal) echo $D/SC-187/img/cast-agrawal.webp;; esac; }
who(){ local k="$1" person="$2" seed="$3" extra="$4"; [ -f "img/$k.png" ] && { echo "keyframe $k exists"; return; }
  echo "== $k ($person) $(date +%H:%M:%S)"
  "$PY" "$Q" "$ID $(cat prompts/$k.txt) $extra $STYLE" --image "$(cast $person)" --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
place(){ local k="$1" seed="$2"; [ -f "img/$k.png" ] && { echo "keyframe $k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) $CART $STYLE" --aspect 16:9 --size 2048 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
who s-priya priya 206301 "$OFF"
who f-priya priya 206302 "$OFF"
who s-lakshmi-label lakshmi 206303 "$CART"
who f-lakshmi lakshmi 206304 "$CART"
who s-kirana kirana 206305 ""
who f-kirana kirana 206306 ""
who s-neha neha 206307 "$OFF"
who f-neha neha 206308 "$OFF"
who s-rakesh rakesh 206309 "$CART"
who f-rakesh rakesh 206310 "$CART"
who s-agrawal agrawal 206311 "$CART"
who f-agrawal agrawal 206312 "$CART"
who s-meera meera 206313 "$CART"
who f-meera meera 206314 "$CART"
who s-upi lakshmi 206315 "$CART"
who s-landfill-photo rakesh 206316 ""
who s-landfill-sign rakesh 206317 ""
who s-priya-eve priya 206318 "$OFF"
place o1b-carton-macro 206012
place o1-godown-stack 206011
echo "qwen done $(date +%H:%M:%S)"; touch qwen.done

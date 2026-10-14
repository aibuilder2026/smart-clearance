#!/usr/bin/env bash
# SC-208 cut 6: photoreal keyframes (the maintainer: "realistic photos and videos, not cartoon"; a clay-illustration
# first try is in prompts/rejected/). The deliveries: Rakesh Traders' van handing a carton over at a kirana, and
# Agrawal Wholesale's truck loading the lot at the godown (an edit on his own cast sheet, so he is the man the film
# already shows). The future scope: a shopkeeper reading his phone (WhatsApp), two phones on a shop counter (the app set
# into their screens later), and three shopkeepers from other states (more Indian languages). Every carton is blank
# here; labels.py prints the batch's label on it.
#   nohup ./gen-qwen6.sh > gen-qwen6.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
D=../..
STYLE="$(cat prompts/STYLE3.txt)"; ID="$(cat prompts/ID.txt)"; CART="$(cat prompts/CARTONS.txt)"
place(){ local k="$1" seed="$2" aspect="$3" size="$4"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/$k.txt) $CART $STYLE" --aspect "$aspect" --size "$size" --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
who(){ local k="$1" ref="$2" seed="$3" aspect="${4:-1:1}"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$ID $(cat prompts/$k.txt) $CART $STYLE" --image "$ref" --aspect "$aspect" --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
place dl-kirana 208201 16:9 2048
who dl-truck $D/SC-187/img/cast-agrawal.webp 208202 16:9
place fs-whatsapp 208211 16:9 2048
place fs-native 208212 16:9 2048
place fs-lang-ta 208213 1:1 1024
place fs-lang-bn 208214 1:1 1024
place fs-lang-gu 208215 1:1 1024
echo "qwen6 done $(date +%H:%M:%S)"; touch qwen6.done

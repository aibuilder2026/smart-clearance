#!/usr/bin/env bash
# SC-238 keyframes, pass 10: the people who speak alone turned to the lens (edits of their own keyframes: the kirana
# owner, the food bank volunteer, the shopkeeper, the wholesale buyer, the Nagpur distributor at the landfill), and the
# destruction filmed at an authorised landfill (the place, the cartons emptied, the distributor filming over his
# shoulder, the earth over the packs, the officer and the witnesses signing), two seeds each.
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
edit() {  # name source seed
  k="$1-$3"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/$1.txt) $(cat prompts/kf/STYLE.txt)" --image "$2" --size 1024 --seed "$3" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
make() {  # name seed style
  k="$1-$2"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/$1.txt) $(cat prompts/kf/${3:-STYLE}.txt)" --aspect 16:9 --size 1024 --seed "$2" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
edit k-order-c img/mcu/k-order.png 239001
edit v-dock-c img/mcu/v-dock.png 239002
edit s-shop-c img/mcu/s-shop.png 239003
edit w-buyer-c img/mcu/w-buyer.png 239004
edit r-say-c img/r-landfill-say.png 239005
for s in 239011 239012; do
  make x-est $s; make x-empty $s; make x-film $s STYLE-OTS; make x-cover $s; make x-officer $s; make x-witness $s
done
echo "qwen10 done $(date +%H:%M:%S)"

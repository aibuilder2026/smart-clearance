#!/usr/bin/env bash
# SC-238 keyframes, pass 9 (after the verification critic): each face again from that person's own keyframe, so one face
# a role: the distributor reading the mango pack's date (an edit of her dawn call, no glasses: the last pass gave her
# glasses and another face); the supply chain lead's dawn call (an edit of her desk close-up: the dawn take was another
# face); the food bank volunteer turned to the driver (an edit of her own, so the take keeps its eyes off the lens).
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
edit(){ local k="$1" p="$2" seed="$3" base="$4"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/$p.txt) $(cat prompts/kf/STYLE.txt)" --image "$base" --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
for s in 238901 238902; do
  edit "d-mango-pack5-$s" d-mango-pack5 "$s" img/mcu/d-dawn-call.png
  edit "l-dawn-call2-$s" l-dawn-call2 "$s" img/mcu/l-approve.png
  edit "v-dock2-$s" v-dock2 "$s" img/v-dock.png
done
echo "qwen9 done $(date +%H:%M:%S)"

#!/usr/bin/env bash
# SC-238 keyframes, pass 2: each talking frame cropped to a medium close-up (crops.py) given its detail back by a Qwen
# edit, and the three frames the storyboard critic's notes add: the distributor raising her phone to the label (its back
# to the camera, so no screen sits under a finger), the Nagpur distributor raising his tablet at the landfill, and the
# godown at sunrise for the turn.   nohup ./gen-qwen2.sh > gen-qwen2.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
LIB=/Users/arundutta/projects/smart-clearance/.claude/worktrees/SC-205-demo-film/design3/designs/SC-211/src
STYLE="$(cat prompts/kf/STYLE.txt)"; DETAIL="$(cat prompts/kf/DETAIL.txt)"
run(){ local out="$1" prompt="$2" src="$3" seed="$4"; [ -f "$out" ] && { echo "$out exists"; return; }
  echo "== $out $(date +%H:%M:%S)"
  "$PY" "$Q" "$prompt" --image "$src" --size 1024 --seed "$seed" --out "$out" 2>&1 | grep -v "^\s*$" | tail -1
}
mkdir -p img/mcu
for k in d-dawn-call l-dawn-call b-approve l-approve k-order w-buyer o-landfill v-dock s-shop d-eve-call l-eve-call; do
  [ -f "img/crop/$k.png" ] && run "img/mcu/$k.png" "$DETAIL" "img/crop/$k.png" 238201
done
run img/d-raise-phone.png "$(cat prompts/kf/d-raise-phone.txt) $STYLE" "$LIB/img/f-lakshmi-L.png" 238202
run img/r-raise-tablet.png "$(cat prompts/kf/r-raise-tablet.txt) $STYLE" "$LIB/img/f-rakesh-L.png" 238203
run img/godown-sunrise.png "$(cat prompts/kf/godown-sunrise.txt) $STYLE" "$LIB/img/o0-godown-aisle.png" 238204
echo "qwen2 done $(date +%H:%M:%S)"

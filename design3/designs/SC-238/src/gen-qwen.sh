#!/usr/bin/env bash
# SC-238: the new shots' keyframes. Each talking shot is a Qwen-Image 2.1 (bf16, local) edit of the character's own
# earlier keyframe (SC-211's library), so faces, clothes and places stay the same; the officer and the phone are new.
# 1024 (the clips are made at 720p); one condition image per edit (the RAM note in qwen-ltx-in-the-background).
#   nohup ./gen-qwen.sh > gen-qwen.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
LIB=/Users/arundutta/projects/smart-clearance/.claude/worktrees/SC-205-demo-film/design3/designs/SC-211/src
STYLE="$(cat prompts/kf/STYLE.txt)"
edit(){ local k="$1" src="$2" seed="$3"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/$k.txt) $STYLE" --image "$src" --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
make(){ local k="$1" seed="$2"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/$k.txt) $STYLE" --aspect 16:9 --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
edit d-dawn-call "$LIB/img/f-lakshmi-L.png" 238101
edit l-dawn-call "$LIB/img/f-priya.png" 238102
edit b-approve "$LIB/img11/tb-brand-head.png" 238103
edit l-approve "$LIB/img/f-priya.png" 238104
edit k-order "$LIB/img/f-kirana.png" 238105
edit v-dock "$LIB/img/f-meera-L.png" 238106
edit s-shop "$LIB/img/fs-whatsapp-L.png" 238107
edit w-buyer "$LIB/img/f-agrawal-L.png" 238108
make o-landfill 238109
edit n-console "$LIB/img/f-neha.png" 238110
edit d-eve-call "$LIB/img/f-lakshmi-L.png" 238111
edit l-eve-call "$LIB/img/f-priya.png" 238112
make phone-dawn 238113
echo "qwen done $(date +%H:%M:%S)"

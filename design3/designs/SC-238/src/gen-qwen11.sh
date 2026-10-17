#!/usr/bin/env bash
# SC-238 keyframes, pass 11 (the fourth critic): the distributor in the landfill's wide shot made the man of his close
# shots (glasses on his head, a moustache, a checked shirt), and the brand's head turned to the lead beside him, off the
# lens, for a conversation.
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
edit() {  # name source seed
  k="$1-$3"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/$1.txt) $(cat prompts/kf/STYLE.txt)" --image "$2" --size 1024 --seed "$3" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
edit x-est-c img/x-est-239012.png 239301
edit x-est-c img/x-est-239012.png 239302
edit b-approve-d img/mcu/b-approve.png 239303
edit b-approve-d img/mcu/b-approve.png 239304
echo "qwen11 done $(date +%H:%M:%S)"

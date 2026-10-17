#!/usr/bin/env bash
# SC-238 keyframes, pass 4: the quick-commerce dark store behind FSSAI's rule (a picker's scanner turning a short-dated
# carton away), text to image at 16:9. Waits for any other Qwen pass, so one runs at a time.
#   nohup ./gen-qwen4.sh > gen-qwen4.log 2>&1 &
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
while pgrep -f "[g]en-qwen[23].sh" >/dev/null; do sleep 10; done
make(){ local k="$1" seed="$2"; [ -f "img/$k.png" ] && { echo "$k exists"; return; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/$k.txt)" --aspect 16:9 --size 1024 --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
}
make q-darkstore 238401
echo "qwen4 done $(date +%H:%M:%S)"

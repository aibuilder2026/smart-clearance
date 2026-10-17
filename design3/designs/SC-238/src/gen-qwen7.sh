#!/usr/bin/env bash
# SC-238 keyframes, pass 7: pass 6's two keyframes came out square (an edit keeps its condition images' aspect, and the
# pack's render is square), so each is padded to 16:9 (pad169.py) and outpainted: the godown continued at the sides and
# above, the woman, the pack and the carton kept.
set -u
cd "$(dirname "$0")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
for s in 238502 238503; do
  k="d-mango-pack3-$s"; [ -f "img/$k.png" ] && { echo "$k exists"; continue; }
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts/kf/d-mango-pack3.txt) Photorealistic cinematic still, natural light, a filmic grade. No text, no lettering and no signs in the extended margins." --image "build/kfcheck/pad-$s.png" --size 1024 --seed "$((s + 100))" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -1
done
echo "qwen7 done $(date +%H:%M:%S)"

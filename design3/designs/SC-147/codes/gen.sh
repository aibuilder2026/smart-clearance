#!/usr/bin/env bash
# SC-147's base photos (Qwen-Image 2.1 bf16, local), run in the background; the labels are composited onto them
cd "$(dirname "$0")/../src"
PY="$HOME/qwen-image-bf16/.venv/bin/python"
GEN="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
"$PY" "$GEN" "A realistic close-up smartphone photo of a plain blank white rectangular paper label sticker stuck flat on the side of a brown corrugated cardboard carton, the label fills most of the frame with a margin of brown cardboard visible on every side, nothing printed on the label, the label slightly glossy with tiny creases at one corner, even daylight from a godown window, the camera square on to the carton, sharp focus, natural colours." --aspect 4:3 --size 1024 --seed 14701 --out base-sticker.png
"$PY" "$GEN" "A realistic close-up smartphone photo of the plain side of a brown corrugated cardboard shipping carton in a distributor's godown, nothing printed on it, visible corrugation texture and a strip of brown packing tape along the top edge, even daylight, the camera square on to the carton side, sharp focus, natural colours." --aspect 4:3 --size 1024 --seed 14702 --out base-carton.png
echo done

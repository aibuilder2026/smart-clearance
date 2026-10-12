#!/usr/bin/env bash
# SC-187 cut 3: the first minute's keyframes on Qwen-Image 2.1 (local, bf16), each with the cast sheet, the real label
# and the pack as condition images; 1024 px 16:9 (QSIZE=2048 for the native size: with four condition images that swapped
# the machine into a crash on 12 Oct). One after another; LTX waits for "qwen done".
#   nohup ./gen-qwen.sh > gen-qwen.log 2>&1 &
set -u
cd "$(dirname "$0")"; HERE="$(pwd)"; D="$(dirname "$HERE")"
PY="$HOME/qwen-image-bf16/.venv/bin/python"; Q="$HOME/.claude/plugins/cache/qwen-bf16-local/qwen-image-bf16/0.2.0/server/qwen_image_bf16_mac.py"
L="$D/../../system/img/labels/MF-2409-117.webp"; PACK="$D/../../system/img/pack-chips.webp"; REF="$HERE/refs16/MF-2409-117-16x9.png"  # the label and the pack on a 16:9 kraft face, first, so the edit keeps 16:9
PLANNER="$D/../SC-154/img/cast-planner.webp"; DIST="$D/../SC-154/img/cast-distributor.webp"; GANESH="$HERE/cast/cast-ganesh.png"; CAM="$HERE/screens/detect--rakesh-camera-frame.png"
COMMON="$(cat prompts3/COMMON.txt)"
gen(){ local k="$1" seed="$2"; shift 2; [ -f "img/$k.png" ] && { echo "keyframe $k exists"; return; }
  local imgs=(); for i in "$@"; do imgs+=(--image "$i"); done
  echo "== $k $(date +%H:%M:%S)"
  "$PY" "$Q" "$(cat prompts3/$k.txt) $COMMON" ${imgs[@]+"${imgs[@]}"} --aspect 16:9 --size "${QSIZE:-1024}" --seed "$seed" --out "img/$k.png" 2>&1 | grep -v "^\s*$" | tail -3
  [ -f "img/$k.png" ] && python3 - "$k" "$seed" "$@" <<'PY'
import sys, json, pathlib, datetime
from PIL import Image
k, seed, *imgs = sys.argv[1:]
src = pathlib.Path(f"img/{k}.png"); im = Image.open(src); out = pathlib.Path(f"../img/{k}.webp"); im.save(out, "WEBP", quality=88)
side = {"name": k, "model": "Qwen-Image-2.1 (bf16, local)", "prompt": pathlib.Path(f"prompts3/{k}.txt").read_text().strip() + " " + pathlib.Path("prompts3/COMMON.txt").read_text().strip(),
        "condition_images": [str(pathlib.Path(i).name) for i in imgs], "seed": int(seed), "size": list(im.size), "aspect": "16:9", "created": datetime.date.today().isoformat(),
        "use": "SC-187 cut 3 keyframe: the first minute in professional settings, every carton labelled", "cost_usd": 0, "postprocess": "webp q88"}
out.with_suffix(".prompt.json").write_text(json.dumps(side, indent=2, ensure_ascii=False) + "\n")
print(f"   saved {out} {im.size}")
PY
}
gen k54-write-off 187654 "$REF"
gen k56-factory-dawn 187656 "$REF"
gen k53-qc-dock 187653 "$REF"
gen k58-depot 187658 "$REF"
gen k51-brand-office 187751 "$PLANNER" "$HERE/screens/ledger--ledger-impact.png" "$REF"
gen k52-dist-office 187652 "$DIST" "$REF"
gen k55-kirana-empty 187655 "$GANESH" "$REF"
gen k57-label-photo 187657 "$DIST" "$CAM" "$REF"
echo "qwen done $(date +%H:%M:%S)"

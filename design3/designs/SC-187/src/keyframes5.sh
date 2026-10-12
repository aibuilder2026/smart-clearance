#!/usr/bin/env bash
# SC-187 cut 2: every carton scene with the real Munchly label and pack as references (the maintainer: "actual product
# logos as described"), and the donation scene as the food bank receiving sealed cartons, not a kitchen.
set -u
cd "$(dirname "$0")"; HERE="$(pwd)"; D="$(dirname "$HERE")"; V="$D/../../tools/vertex-media"; P154="$D/../SC-154/img"; P158="$D/../SC-158/img"; S="$HERE/screens"
run(){ (cd "$V" && uv run nano.py "$@"); }
still(){ local k="$1" s="$2"; shift 2; [ -f "$HERE/img/$k.png" ] && { echo "keyframe $k exists"; return; }; local refs=(); for r in "$@"; do refs+=(--ref "$r"); done; run still --prompt-file "$HERE/prompts/$k.txt" ${refs[@]+"${refs[@]}"} --seed "$s" --out "$HERE/img/$k.png" --webp "$D/img" --use "SC-187 cut 2 keyframe: the real Munchly label and pack as references"; }
L="$D/../../system/img/labels"; CHIPS="$L/MF-2409-117.webp"; MANGO="$L/MF-2410-118.webp"; PACK="$D/../../system/img/pack-chips.webp"
PRIYA="$P154/cast-planner.webp"; LAKSHMI="$P158/cast-lakshmi.webp"; MEERA="$P158/cast-meera.webp"; GANESH="$HERE/cast/cast-ganesh.png"; AGRAWAL="$HERE/cast/cast-agrawal.png"
still k32-foodbank-store 187232 "$MEERA" "$S/approve--meera-pickups-phone.png" "$MANGO" "$PACK"
still k26-agrawal-tablet 187326 "$AGRAWAL" "$S/approve--agrawal-listing.png" "$CHIPS" "$PACK"
still k22-priya-phone 187322 "$PRIYA" "$S/detect--priya-command-phone.png" "$MANGO" "$PACK"
still k24-priya-approve 187324 "$PRIYA" "$S/plan--priya-approve-sheet-phone.png" "$CHIPS" "$PACK"
still k25-kirana-offer 187325 "$GANESH" "$S/approve--kirana-ganesh-offer-phone.png" "$CHIPS" "$PACK"
still k27-staff-sale 187327 "$LAKSHMI" "$S/approve--lakshmi-today-phone.png" "$MANGO" "$PACK"
still k31-dark-store 187331 "$CHIPS" "$PACK"
echo "keyframes done"

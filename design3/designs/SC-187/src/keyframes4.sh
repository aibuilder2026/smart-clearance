#!/usr/bin/env bash
# SC-187 cut 2: the carton scenes again with the real Munchly label and pack as references (the maintainer's ask)
set -u
cd "$(dirname "$0")"; until grep -q "keyframes done" keyframes3.log; do sleep 10; done
HERE="$(pwd)"; D="$(dirname "$HERE")"; V="$D/../../tools/vertex-media"; P154="$D/../SC-154/img"; P158="$D/../SC-158/img"
run(){ (cd "$V" && uv run nano.py "$@"); }
still(){ local k="$1" s="$2"; shift 2; [ -f "$HERE/img/$k.png" ] && { echo "keyframe $k exists"; return; }; local refs=(); for r in "$@"; do refs+=(--ref "$r"); done; run still --prompt-file "$HERE/prompts/$k.txt" ${refs[@]+"${refs[@]}"} --seed "$s" --out "$HERE/img/$k.png" --webp "$D/img" --use "SC-187 cut 2 keyframe: the real Munchly label and pack as references"; }
CHIPS="/Users/arundutta/projects/smart-clearance/.claude/worktrees/console-ui-db-migration-b9ab01/design3/designs/SC-187/src/../../../system/img/labels/MF-2409-117.webp"; MANGO="/Users/arundutta/projects/smart-clearance/.claude/worktrees/console-ui-db-migration-b9ab01/design3/designs/SC-187/src/../../../system/img/labels/MF-2410-118.webp"; PACK="/Users/arundutta/projects/smart-clearance/.claude/worktrees/console-ui-db-migration-b9ab01/design3/designs/SC-187/src/../../../system/img/pack-chips.webp"
still k21-godown-date 187221 "$P154/cast-distributor.webp" "$CHIPS" "$PACK"
still k29-lakshmi-godown 187229 "$P158/cast-lakshmi.webp" "$MANGO" "$PACK"
still k26-agrawal-tablet 187226 "$HERE/cast/cast-agrawal.png" "$HERE/screens/approve--agrawal-listing.png" "$CHIPS" "$PACK"
still k28-foodbank-van 187228 "$P158/cast-meera.webp" "$HERE/screens/approve--meera-pickups-phone.png" "$MANGO" "$PACK"
still k30-depot 187230 "$CHIPS" "$PACK"
echo "keyframes done"

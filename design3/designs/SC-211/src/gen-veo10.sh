#!/usr/bin/env bash
# SC-210: the talking scenes, on Veo 3.1 at 1080p with sound (the maintainer's yes, a $35 cap on Vertex for the film):
# each from a working-demo keyframe (the same cast and places), its line in quotes. Veo 3.1's prompt rewriter cannot be
# turned off, so each clip's words are checked against its transcript. One at a time; the sidecar beside each clip
# records the operation, so a dropped session loses nothing (veo.py poll finishes it).
#   nohup ./gen-veo10.sh [names...] > gen-veo10.log 2>&1 &
set -u
cd "$(dirname "$0")"
VX=../../../tools/vertex-media
NEG="subtitles, captions, watermark, on-screen text, music, singing, children, deformed hands, extra fingers, morphing face, distorted mouth, flicker"
key_of(){ case "$1" in   # the keyframe each scene starts from (macOS bash 3.2: no associative arrays)
  t1-distributor) echo img/f-lakshmi-L.png;; t2-lead) echo img/f-priya.png;; t3-kirana|t3-kirana-b) echo img/dl-kirana-L.png;;
  t4-foodbank|t4-foodbank-b) echo img/f-meera-L.png;; t5-buyer) echo img/f-agrawal-L.png;; t6-landfill) echo img/s-landfill-sign.png;;
  *) echo "";; esac; }
names=("$@"); [ ${#names[@]} -eq 0 ] && names=(t1-distributor t2-lead t3-kirana t4-foodbank t5-buyer t6-landfill)
for n in "${names[@]}"; do
  out="clips/talk/$n.mp4"
  [ -f "$out" ] && { echo "$n exists"; continue; }
  echo "== $n $(date +%H:%M:%S)"
  (cd "$VX" && ~/.local/bin/uv run --quiet veo.py generate --model veo-3.1-generate-001 \
      --prompt-file "$OLDPWD/prompts/talk/$n.txt" --image "$OLDPWD/$(key_of "$n")" --res 1080p --duration 8 --audio \
      --negative "$NEG" --use "SC-210 talking scene $n" --max-usd 3.5 --out "$OLDPWD/$out") 2>&1 | tail -4
done
echo "veo10 done $(date +%H:%M:%S)"

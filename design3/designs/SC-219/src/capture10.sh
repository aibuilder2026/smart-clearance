#!/usr/bin/env bash
# SC-219: cut 10's four scene pages captured frame by frame on the voice's cues (shots10.py writes the cues)
set -eu
cd "$(dirname "$0")"
.venv/bin/python shots10.py > /dev/null
for k in ${PAGES:-saas10:saas arch10:arch cast10:cast pwa9:pwa}; do
  d=${k%%:*}; f=${k##*:}
  rm -rf build/$d
  node capture-page.mjs $d/$f.html build/$d build/$d-cues.json 25
done
echo "captured $(date +%H:%M:%S)"

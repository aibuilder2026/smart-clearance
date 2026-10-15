#!/usr/bin/env bash
# SC-219: cut 9's four scene pages captured frame by frame on the voice's cues (shots9.py writes the cues)
set -eu
cd "$(dirname "$0")"
.venv/bin/python shots9.py > /dev/null
for k in saas9:saas arch9:arch cast9:cast pwa9:pwa; do
  d=${k%%:*}; f=${k##*:}
  rm -rf build/$d
  node capture-page.mjs $d/$f.html build/$d build/$d-cues.json 25
done
echo "captured $(date +%H:%M:%S)"

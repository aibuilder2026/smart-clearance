#!/bin/bash
# SC-200: the cut's tools venv (pillow, numpy, scipy, soundfile, fonttools, brotli) and the design system's fonts as TTF
# for Pillow, from the frontend's @fontsource-variable packages (OFL). The voice has its own: tts/setup.sh.
set -e
cd "$(dirname "$0")"
UV=$HOME/.local/bin/uv
$UV venv -q --python 3.12 .venv-tools
$UV pip install -q --python .venv-tools/bin/python pillow numpy scipy soundfile fonttools brotli
MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
F="$MAIN/frontend/core/node_modules/@fontsource-variable"
mkdir -p fonts
.venv-tools/bin/python - "$F" <<'PY'
import sys
from fontTools.ttLib import TTFont
F = sys.argv[1]
for src, dst in [("bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2", "fonts/Bricolage.ttf"),
                 ("geist/files/geist-latin-wght-normal.woff2", "fonts/Geist.ttf")]:
    f = TTFont(f"{F}/{src}"); f.flavor = None; f.save(dst); print(dst)
PY

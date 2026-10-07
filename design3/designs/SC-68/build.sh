#!/usr/bin/env bash
# SC-68's mockups: compile each .jsx to the .js beside it, as design3/build.sh does
set -euo pipefail
cd "$(dirname "$0")"
for f in sc68-pre.jsx sc68.jsx option-*/opt.jsx console/console68.jsx; do
  [ -f "$f" ] || continue
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --log-level=warning --outfile="${f%.jsx}.js"
done

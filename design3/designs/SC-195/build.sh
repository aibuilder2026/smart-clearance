#!/usr/bin/env bash
# SC-195's mockups: compile each .jsx to the .js beside it, as design3/build.sh does, then write each option's page
set -euo pipefail
cd "$(dirname "$0")"
for f in swing.jsx signin-*/opt.jsx swing-*/opt.jsx; do
  [ -f "$f" ] || continue
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile="${f%.jsx}.js"
done
python3 pages.py

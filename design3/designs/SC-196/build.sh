#!/usr/bin/env bash
# SC-196's mockups: compile each .jsx to the .js beside it, then write each option's two pages
set -euo pipefail
cd "$(dirname "$0")"
for f in p.jsx option-*/opt.jsx; do
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile="${f%.jsx}.js"
done
python3 pages.py

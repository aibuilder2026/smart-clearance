#!/usr/bin/env bash
# SC-215's mockups: compile each .jsx to the .js beside it, as design3/build.sh does
set -euo pipefail
cd "$(dirname "$0")"
for f in console/console215.jsx; do
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile="${f%.jsx}.js"
done

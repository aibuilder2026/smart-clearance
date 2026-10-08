#!/usr/bin/env bash
# SC-83's mockup: compile the .jsx to the .js beside it, as design3/build.sh does
set -euo pipefail
cd "$(dirname "$0")"
npx --yes esbuild row/sc83.jsx --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile=row/sc83.js

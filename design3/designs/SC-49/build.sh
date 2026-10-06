#!/usr/bin/env bash
# SC-49's mockups: compile each .jsx to the .js beside it, as design3/build.sh does
set -euo pipefail
cd "$(dirname "$0")"
for f in sc49-shared.jsx console49.jsx option-*/motion.jsx; do
  [ -f "$f" ] || continue
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --log-level=warning --outfile="${f%.jsx}.js"
done

#!/bin/sh
# Precompile every .jsx in design3 to .js beside it (React.createElement, ES2019), so pages load without Babel.
set -e
cd "$(dirname "$0")"
for f in system/*.jsx screens/*.jsx demo/*.jsx app/*.jsx site/*.jsx console/*.jsx; do
  [ -f "$f" ] || continue
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment \
    --target=es2019 --charset=utf8 --legal-comments=none --log-level=warning --outfile="${f%.jsx}.js"
done
echo "built $(ls system/*.jsx screens/*.jsx demo/*.jsx app/*.jsx site/*.jsx console/*.jsx 2>/dev/null | wc -l | tr -d ' ') files"

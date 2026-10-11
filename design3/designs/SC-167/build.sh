#!/usr/bin/env bash
# SC-167's mockups: compile each .jsx to the .js beside it, as design3/build.sh does, and write each option's page
set -euo pipefail
cd "$(dirname "$0")"
for f in sc167-dev.jsx sc167-acts.jsx option-*/opt.jsx; do
  [ -f "$f" ] || continue
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile="${f%.jsx}.js"
done
page() { sed -e "s|@L@|$1|g" -e "s|@TITLE@|$2|g" -e "s|@DESC@|$3|g" mockup.tmpl.html > "option-$(echo "$1" | tr A-Z a-z)/mockup.html"; }
page A "Four chapters" "a lobby of four chapters, each played with the notes beside the devices, as the demo is today."
page B "The route map" "the story as a route map of three lines that share a start, the batch travelling along the line it is on."
page C "The show" "the story as a show that plays itself: chapter cards, captions over the devices, a timeline to scrub."

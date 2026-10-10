#!/usr/bin/env bash
# SC-145's mockups: compile each .jsx to the .js beside it, as design3/build.sh does, and write each option's page from
# the template (the workspace on its stub as Rakesh Traders, with only his Batches and Orders changed)
set -euo pipefail
cd "$(dirname "$0")"
for f in fig.jsx option-*/opt.jsx; do
  [ -f "$f" ] || continue
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile="${f%.jsx}.js"
done
page() { # letter title description
  local dir="option-$(echo "$1" | tr 'ABC' 'abc')"
  sed -e "s|@L@|$1|g" -e "s|@TITLE@|$2|g" -e "s|@DESC@|$3|g" -e "s|@WHO@|rakesh|g" -e "s|@ROUTE@|orders|g" mockup.tmpl.html > "$dir/mockup.html"
}
page A "The same sum on both pages" "Batches and Orders open with the same sum, cost = sold + credited, each page marking its own part, and every batch carries its own sum"
page B "How this adds up, on request" "each page keeps its figure and opens one sheet: every cleared batch's cost, sales and credit, with the totals"
page C "One figure on both pages" "both pages lead with what came back to him, all the batches cost him, split into sold and credited, and every batch reads the same"
echo built

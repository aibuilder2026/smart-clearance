#!/usr/bin/env bash
# SC-153's mockups: compile each .jsx to the .js beside it, as design3/build.sh does, and write each option's page from
# the template (the workspace on its stub at the story's close, as ?who=, with only the screens the option changes)
set -euo pipefail
cd "$(dirname "$0")"
for f in fig.jsx option-*/opt.jsx; do
  [ -f "$f" ] || continue
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile="${f%.jsx}.js"
done
page() { # letter title description
  local dir="option-$(echo "$1" | tr 'ABC' 'abc')"
  sed -e "s|@L@|$1|g" -e "s|@TITLE@|$2|g" -e "s|@DESC@|$3|g" mockup.tmpl.html > "$dir/mockup.html"
}
page A "With each order" "each invoice where its order is, on paper in a sheet with its PDF; the batch's register among the distributor's papers and in the pack"
page B "The bill book" "the kirana's Orders as his bill book with each invoice in full on its order, the distributor's batch with an Invoices tab, the register in the pack"
page C "As PDFs" "each invoice named where its order is, as the Paperwork agent's PDF to download; nothing drawn in the app"
echo built

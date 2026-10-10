#!/usr/bin/env bash
# SC-142's mockups: compile each .jsx to the .js beside it, as design3/build.sh does, and write each option's page from
# the template (the workspace on its stub, with only the option's screens changed)
set -euo pipefail
cd "$(dirname "$0")"
for f in rk.jsx option-*/opt.jsx; do
  [ -f "$f" ] || continue
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile="${f%.jsx}.js"
done
page() { # letter title description
  local dir="option-$(echo "$1" | tr 'ABC' 'abc')"
  sed -e "s|@L@|$1|g" -e "s|@TITLE@|$2|g" -e "s|@DESC@|$3|g" -e "s|@WHO@|priya|g" -e "s|@ROUTE@|batches|g" mockup.tmpl.html > "$dir/mockup.html"
}
page A "The Record tab" "every batch, past ones too, on Batches; each batch's page gains a Record tab: its photos, its yeses and its audit trail"
page B "Evidence on the timeline" "past batches in the same table; each batch's page opens on its timeline, every photo and yes at its moment, with the audit lines"
page C "The batch file" "past batches as files with their photos; a batch's page leads with its evidence and gains an Audit log table"
echo built

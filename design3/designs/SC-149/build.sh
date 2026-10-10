#!/usr/bin/env bash
# SC-149's mockups: compile each .jsx to the .js beside it, as design3/build.sh does, and write each option's page from
# the template (the console signed in as Neha on the review world, with only the Recovered figure and its card changed)
set -euo pipefail
cd "$(dirname "$0")"
for f in console149.jsx fig.jsx option-*/opt.jsx; do
  [ -f "$f" ] || continue
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile="${f%.jsx}.js"
done
page() { # dir letter title description
  sed -e "s|@L@|$2|g" -e "s|@TITLE@|$3|g" -e "s|@DESC@|$4|g" -e "s|@OPT@|$5|g" mockup.tmpl.html > "$1/mockup.html"
}
page current Now "The Overview as it is" "the Recovered figure and the Recovered, by day card draw the same series, on the review world." ""
page option-a A "Food, by day" "the first figure stays the money; the card shows each day's kilos kept out of landfill above the baseline and the kilos destroyed under it." '<script src="opt.js"></script>'
page option-b B "Recovered and written off" "the card keeps the money and adds what destroyed packs had cost under the baseline; the first figure shows the food split in place of its sparkline." '<script src="opt.js"></script>'
page option-c C "Food, so far" "the first figure stays the money; the card shows the kilos kept out of landfill and destroyed as running totals over the range." '<script src="opt.js"></script>'
echo built

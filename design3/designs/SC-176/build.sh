#!/usr/bin/env bash
# SC-176's mockups: compile each .jsx to the .js beside it, as design3/build.sh does, and write each option's page from
# the template (the workspace in its live mode, with only the journey clock's line changed)
set -euo pipefail
cd "$(dirname "$0")"
for f in guide.jsx option-*/opt.jsx; do
  [ -f "$f" ] || continue
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile="${f%.jsx}.js"
done
page() { # letter title description
  local dir="option-$(echo "$1" | tr 'ABC' 'abc')"
  sed -e "s|@L@|$1|g" -e "s|@TITLE@|$2|g" -e "s|@DESC@|$3|g" mockup.tmpl.html > "$dir/mockup.html"
}
page A "At the clock" "an info button, Prototype time, beside the journey's date and time on every page, opening the guide"
page B "A note under the clock" "a line under the journey's date and time on every page says it is the prototype's calendar, with how to reset or fast-forward"
page C "Every date marked" "every date and time of the journey on the page is underlined with dots and opens the guide"
echo built

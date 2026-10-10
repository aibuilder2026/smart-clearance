#!/usr/bin/env bash
# SC-152's mockups: compile each .jsx to the .js beside it, as design3/build.sh does, and write each page from the
# template (the lab of buttons that call the network, with only how they wait changed)
set -euo pipefail
cd "$(dirname "$0")"
for f in lab.jsx current/opt.jsx option-*/opt.jsx; do
  npx --yes esbuild "$f" --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --charset=utf8 --log-level=warning --outfile="${f%.jsx}.js"
done
page() { # dir name description
  sed -e "s|@NAME@|$2|g" -e "s|@DESC@|$3|g" mockup.tmpl.html > "$1/mockup.html"
}
page current "Today" "How the buttons behave now: blank while they wait, or nothing at all."
page option-a "Option A · Says what it's doing" "The button keeps its size and says what it is doing, with a spinner and a line along its foot; a tick and the done word, or the reason under it."
page option-b "Option B · The fill" "The button is its own progress bar: its ground fills in a deeper tone while it waits; a refusal drains it and comes as a toast."
page option-c "Option C · Act at once" "The press shows its result at once; one saving chip carries the call, and a refusal puts the screen back."
echo built

#!/bin/sh
# design-first (SC-26): when a request reads like a UI or UX change, put the project's design rule in front of the
# agent before it acts. The design goes the Claude Design route first: 2 or 3 options, saved in design3/designs/,
# a review board on the surface's Claude Design project, and code only for the option the maintainer picks.
# A UserPromptSubmit hook: reads the prompt as JSON on stdin and stays silent unless the words match.
command -v jq >/dev/null 2>&1 || exit 0
prompt=$(jq -r '.prompt // ""' 2>/dev/null) || exit 0
[ -n "$prompt" ] || exit 0

words='ui|ux|ui/ux|design|designs|redesign|re-design|layout|look|looks|feel|style|styling|restyle|colou?r|colou?rs|palette|font|fonts|typography|spacing|button|buttons|icon|icons|animation|animations|animate|motion|transition|hero|landing|screen|screens|page|sheet|modal|menu|nav|navbar|navigation|theme|dark mode|light mode|mock-?up|mock-?ups|wireframe|prototype|visual|visuals|banner|card|cards|dashboard'
printf '%s' "$prompt" | grep -qiwE "($words)" || exit 0

context='design-first, a project rule (SC-26). This request reads like a UI or UX change. If it is one, follow the design-first skill before any code under design3/:
1. Design 2 or 3 options with impeccable, ui-ux-pro-max (product screens) or the taste skills (landing page), Framer Motion for motion, and Qwen-Image or LTX for imagery.
2. Save them under design3/designs/SC-<n>/ and commit them on the issue branch. design3 is the source of truth for designs.
3. Publish one review board to the surface'"'"'s Claude Design project, and give the claude.ai/design link.
4. Ask the maintainer to pick one option. Build only the picked option, and only after the pick.
Skip this only for a fix that changes no design: a typo, a broken link, data, or a bug with one obvious fix.'

jq -n --arg ctx "$context" '{hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: $ctx}}'

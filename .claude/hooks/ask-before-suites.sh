#!/bin/sh
# Browser suites on request only (SC-55): the frontend's e2e and parity suites, design3's a11y suite and the live
# e2e script run only when the maintainer explicitly asks for them in the current request. This PreToolUse hook on
# Bash turns any command that would run one into a permission prompt, as a backstop to the rule in AGENTS.md and the
# browser-suites skill. It stays silent for every other command. Needs jq, like design-first-reminder.sh.
command -v jq >/dev/null 2>&1 || exit 0
command=$(jq -r '.tool_input.command // ""' 2>/dev/null) || exit 0
[ -n "$command" ] || exit 0

# What runs a suite: the pnpm scripts, Playwright itself, design3/a11y's npm scripts and backend-api's live e2e.
suites='test:e2e|test:parity|playwright test|playwright-cli|scripts/e2e\.sh|e2e\.sh'
printf '%s' "$command" | grep -qE "($suites)" && matched=1
# npm test / npm run test* when the command reaches design3/a11y
printf '%s' "$command" | grep -qE 'a11y' && printf '%s' "$command" | grep -qE 'npm (test|run test)' && matched=1
[ -n "${matched:-}" ] || exit 0

reason='The e2e, parity and a11y suites run only when the maintainer explicitly asks for them in the current request (AGENTS.md, Accessibility; the browser-suites skill). Allow this only if they did.'
jq -n --arg r "$reason" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: $r}}'

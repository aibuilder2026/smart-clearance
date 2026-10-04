# Designs

`design3` is the source of truth for Smart-Clearance designs. Every design that is created or edited is saved here, one folder per Jira issue, and committed on that issue's branch. That covers:
- the options, comps, mock-ups and motion prototypes;
- the review board;
- the record of the pick.

Claude Design and claude.ai artifacts hold published copies, never the only copy.

## The rule (the `design-first` skill)

Every new UI or UX change goes the Claude Design route first.

1. **Design 2 or 3 options:**
   - impeccable;
   - ui-ux-pro-max for product screens, or the taste skills for the landing page;
   - Framer Motion for motion;
   - Qwen-Image or LTX for imagery.
2. **Save them** in `designs/SC-<n>/` and commit them.
3. **Publish** one review board to the Claude Design project for the surface: app, demo, platform (the landing page and the console) or design system.
4. **Build after the pick.** The maintainer picks one option, and only that option is built.

Small fixes that change no design skip this. The skill is `.claude/skills/design-first/SKILL.md`. The hook `.claude/hooks/design-first-reminder.sh` repeats the rule when a request reads like a UI or UX change.

## A folder

```
SC-<n>/
  board.html        the review board
  decision.md       the request, the options, the pick and its date
  current/          the screens as they were (WebP)
  option-a/ …       each option's comps (WebP with a .prompt.json sidecar), mockup.html and motion prototype
  src/              PNG originals; local only (gitignored), since only WebP ships
```

Open any of these through the local server: `python3 -m http.server 8787 --directory design3`, then `/designs/SC-<n>/board.html`.

## Index

| Issue | What | Picked |
| --- | --- | --- |
| [SC-25](SC-25/decision.md) | The smartclearance.com landing page and the staff console | Miniature India (comp-led) and Agent pipeline (code-led) |

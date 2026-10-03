# AGENTS.md

How this repository is worked on: its layout, commands and rules, and the agent tooling around it. It is written for any coding agent and for people. Claude Code reads it through `CLAUDE.md`.

## Project

Smart-Clearance (working title Short-Date Router) is an agentic near-expiry stock router for Indian FMCG brands, built for the Google AI Hackathon 2026 (Retail & Commerce track). The repo holds the product and design work so far:

- three rounds of clickable prototypes;
- the story documents;
- a narrated walkthrough video.

The production services planned in `PLAN.md` (`web/`, `agents/`, `infra/`) do not exist yet.

## Layout

| Path | What it is |
| --- | --- |
| `design3/` | The current design: design system, guided demo, app prototype (an installable PWA) and the accessibility suite. Start with `design3/README.md`. |
| `design2/`, `design/` | Earlier rounds, superseded by v3. Reference only. |
| `docs/` | Story pages: `dobara-journey-map.html` (the source of every figure), the story, the tech stack and the walkthrough. |
| `video/` | The narrated walkthrough. `build.py` builds the page and `record.mjs` records it with Playwright; `recorder/` is a local voice-recording page. |
| `PRODUCT.md`, `DESIGN.md` | Product context, and the design system of record. |
| `PLAN.md` | The product plan (2 Oct 2026). |
| `.claude/`, `.mcp.json` | Claude Code project configuration (see Tooling). |

## Commands

```sh
cd design3 && ./build.sh            # compile every .jsx to the .js beside it (esbuild); run after any edit
cd design3 && ./dist.sh             # bundle the hosted build into design3/dist/
python3 -m http.server 8787 --directory design3   # serve the demo, app and design system locally

cd design3/a11y && npm ci && npx playwright install chromium   # once
npm test                            # WCAG 2.2 AA suite: 190 tests in five viewports, about 4 minutes
npm run test:desktop                # light and dark at 1440 only, for a quicker loop
npm run report                      # the Playwright HTML report
```

Local pages:

- `/demo/Smart-Clearance%20demo%20v3.html`
- `/app/Smart-Clearance%20app%20v3.html`
- `/system/Smart-Clearance%20DS%20v3.html`

## Rules

**Work and shipping**

- Every change has a Jira key in project SC:
  - branch from `main` as `SC-<n>-<slug>`;
  - write commit subjects as `SC-<n>: <subject>`;
  - title PRs `[SC-<n>] <title>`.
- Never commit on `main`.
- These need no approval: branching, committing, pushing a feature branch, and creating, updating, commenting on or moving Jira issues.
- These need the maintainer's explicit yes in the current request: raising a PR, merging, and closing a Jira issue (moving it to Done). Prepare everything up to that point, then ask once.
- PRs merge with a merge commit, and the branch is deleted afterwards.
- Commit with the repo's configured git identity, the maintainer's GitHub noreply address. Never override `user.email`.
- No AI attribution lines in commit messages or PR descriptions.

**Code and builds**

- In `design3/`, edit the `.jsx`. The `.js` beside it and everything in `dist/` are generated.
- `core/` and `screens/` are shared by the demo and the app through symlinks, so a change there affects both.
- The hosted pages load `dist/` from jsDelivr and images from GitHub raw, both pinned to a commit SHA. To publish a new version:
  1. Run `./dist.sh`, then commit and push.
  2. Point each hosted page at the new SHA.
  3. Bump `VERSION` in the hosted app's `sw.js`.
  4. Check that each page renders.

**Accessibility**

- The target is WCAG 2.2 AA. UI changes must keep `npm test` in `design3/a11y` at zero violations.
- The suite covers what axe-core can decide, plus keyboard checks for:
  - the sign-in tab order;
  - sheets taking, keeping and returning focus;
  - the menu-button pattern;
  - the sign-in hero's pause.

  These criteria still need a manual pass: 2.4.11, 2.5.7, 3.2.6, 3.3.7 and 3.3.8.
- Any animation that loops beside content for more than five seconds needs a visible pause (WCAG 2.2.2); loading indicators are exempt.
- Measure text contrast against the background it actually sits on, including fills, tinted chips and chat bubbles, after any opacity.

**Data and assets**

- Every company, person and figure is fictional.
  - Figures come from `docs/dobara-journey-map.html`.
  - Every money figure is computed in `design3/core/money.js`.
  - Illustrative splits are labelled as illustrative.
- Every generated image or clip ships with a `.prompt.json` sidecar recording its model, seed, prompt and post-processing. PNG originals stay local in `src/` folders; only the WebP ships.
- Third-party Claude Code components are recorded in `.claude/third-party.md`. Read a component before using it; installing one needs the maintainer's yes.

## Tooling

### Configured in this repo

| Kind | Name | Where | Use |
| --- | --- | --- | --- |
| MCP server | `chrome-devtools` (chrome-devtools-mcp 1.10.1, usage statistics off) | `.mcp.json` | Lighthouse accessibility audits, accessibility-tree snapshots, CSS inspection. Claude Code asks once before starting it. |
| Agent | `accessibility-tester` | `.claude/agents/` | WCAG 2.2 AA audits: automated scans, then a manual checklist. |
| Skill | `accessibility` | `.claude/skills/` | WCAG guidance, with `references/WCAG.md`. |
| Skill | `web-quality-audit` | `.claude/skills/` | Page quality audit. `scripts/analyze.sh` works on single HTML files only. |
| Skill | `web-design-guidelines` | `.claude/skills/` | Reviews UI against Vercel's Web Interface Guidelines. |
| Config | jira-flow | `.claude/jira-flow.json`, `.claude/jira/taxonomy.md` | Jira project SC: site, issue types, transition ids, branch, commit and PR patterns, and ship rules. |
| Config | Preview servers | `.claude/launch.json` | `voice-recorder`: runs `video/recorder/server.py` on port 8765. |
| Tests | Accessibility suite | `design3/a11y/` | Playwright 1.63 with @axe-core/playwright 4.13. |

The agent, the three skills and the MCP entry came from the [aitmpl.com](https://www.aitmpl.com) catalog (SC-17).

### On the maintainer's machine (user scope)

These are not in the repo; install your own to match.

**Plugins**

| Plugin | Version | Source | What it adds | Used for |
| --- | --- | --- | --- | --- |
| impeccable | 4.4.0 | `pbakaus/impeccable` | <ul><li>The `impeccable` design skill.</li><li>Four agents: `impeccable-finish-reviewer`, `impeccable-documenter`, `impeccable-asset-producer`, `impeccable-manual-edit-applier`.</li><li>A design-detector hook that reviews UI edits.</li></ul> | Design v3, `PRODUCT.md` and `DESIGN.md`. Its local state lives in `.impeccable/`, which is gitignored. |
| jira-flow | 0.1.1 | `duttaarun/jira-flow-plugin` | <ul><li>Skills: `init`, `plan`, `work`, `track`, `bug`, `status`, `pr`, `ship`.</li><li>The hooks listed below.</li></ul> | Every SC ticket. |
| qwen-image-bf16 | 0.2.0 | A local marketplace | Qwen-Image 2.1 (bf16) image generation and editing, run locally; skill `qwengen-bf16`. | The 3D renders in `design3/system/img/`. |
| ltx-video | 0.2.0 | `duttaarun/ltx-video-plugin` | LTX 2.5 Fast video clips through LTX Desktop, run locally; skills `ltx-clip`, `ltx-init`. | The carton loop in `design3/system/media/`. |

**Hooks** (all from jira-flow)

| Hook | When it runs | What it does |
| --- | --- | --- |
| `ask-before-ship` | Before shell commands, GitHub MCP calls and Jira transitions | Turns raising a PR, merging, and moving an issue to Done into a permission prompt. |
| `guard-key` | Before shell commands | Refuses `git commit`, `git push` and `gh pr create` unless the branch or the command carries an SC key. Never commits to or pushes from `main`. |
| `jira-link` | After Jira changes | Prints the issue's link. |
| `session-context` | At session start | Says which issue the branch carries and whether a story is mid-flow. |

**Skills**

| Skill | From | Use |
| --- | --- | --- |
| `aitmpl` | User skill | Searches the aitmpl.com catalog when a skill, agent, MCP server or hook is missing. Read-only; it prints install lines but never runs them. |
| `dataviz` | Bundled with Claude Code | Chart method and colour-palette validation. |

**MCP servers**

| Server | Transport | Use here |
| --- | --- | --- |
| `atlassian` | Remote (Atlassian) | Jira project SC. |
| `claude-design` | Remote (Anthropic) | The hosted design system, demo and app pages. |
| `playwright` | `npx @playwright/mcp` | Driving and screenshotting pages during design work. |
| `github` | Remote (GitHub) | Configured, but failing to authenticate. The `gh` CLI is the working route. |
| `gcloud` | `npx @google-cloud/gcloud-mcp` | Google Cloud for the planned build. Unused so far. |

From the Claude desktop app:

- Slack, through the `design` plugin's Slack server, for #smart-clearance.
- The built-in browser and Claude in Chrome, for previews.
- Artifacts, for publishing pages on claude.ai.

## Where things live

- **Code:** [aibuilder2026/smart-clearance](https://github.com/aibuilder2026/smart-clearance) (public).
- **Jira:** project SC on [duttaarun2015.atlassian.net](https://duttaarun2015.atlassian.net). Issue links take the form `/browse/SC-<n>`.
- **Slack:** #smart-clearance (private), channel id `C0C675VAFFY`.
- **Hosted pages (Claude Design):**
  - [design system](https://claude.ai/design/p/909d23bb-bd3c-466b-abf8-4eccc7c5881e?file=Smart-Clearance+DS+v3.html)
  - [guided demo](https://claude.ai/design/p/8294ec70-3e6b-4359-8de6-2a3fd056c3b2?file=Smart-Clearance+demo+v3.html)
  - [app](https://claude.ai/design/p/78962e0f-7300-46e4-8be7-ee1cbd101839?file=Smart-Clearance+app+v3.html)
- **Pinned claude.ai artifacts:**
  - [Story](https://claude.ai/artifact/CkH7tpXgYLhs2hBmfhf9SZ)
  - [Journey Map](https://claude.ai/artifact/MacqAdWi87YYY4ADpRyJSh)
  - [Tech Stack](https://claude.ai/artifact/3Duw1kHUoUvXXCaPSavi92)
  - [walkthrough](https://claude.ai/artifact/JaE7HRc3YFpNNJEhxT7gzH)
  - [DS v3](https://claude.ai/artifact/8UuDNC17hMqBnSSmzhQyWx)
  - [demo v3](https://claude.ai/artifact/Xy49Vw8owe5moZBvXPAf3e)
  - [app v3](https://claude.ai/artifact/YHSwoQHc2JbBWVQtuGQzgm)

## Known gaps

- The jira-flow gates point at `web/` and `agents/`, which do not exist yet, so nothing gates `design3/`. Run the accessibility suite yourself.
- `.claude/jira-flow.json` names `.github/pull_request_template.md`, which is not in the repo, and there is no CI.
- The `chrome-devtools` MCP server starts only in a new session, after a one-time approval.
- The WCAG 2.2 criteria axe cannot check are untested.
- Ambient loops outside the sign-in hero have no in-page way to stop them (WCAG 2.2.2): the tracker and live-badge pings, the agent aura, the map pin and the floating renders. SC-21 tracks them.

# Third-party Claude Code components

Installed for SC-17 from the [aitmpl.com](https://www.aitmpl.com) catalog (Claude Code Templates, [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates), `cli-tool/components/`), copied on 3 Oct 2026 after reading each file. Nothing here was changed from the published source except the MCP entry noted below.

| Component | Where | Catalog id | Notes |
| --- | --- | --- | --- |
| Agent `accessibility-tester` | `.claude/agents/accessibility-tester.md` | agents/accessibility/accessibility-tester | WCAG 2.2 AA auditor; read-only; runs axe-core, Lighthouse and pa11y through npx, then a manual checklist |
| Skill `accessibility` | `.claude/skills/accessibility/` | skills/development/accessibility | web-quality-skills, MIT; includes `references/WCAG.md` |
| Skill `web-quality-audit` | `.claude/skills/web-quality-audit/` | skills/development/web-quality-audit | web-quality-skills, MIT; `scripts/analyze.sh` checks single HTML files (directory mode reports nothing because its loop runs in a subshell) |
| Skill `web-design-guidelines` | `.claude/skills/web-design-guidelines/` | skills/creative-design/web-design-guidelines | Fetches Vercel's Web Interface Guidelines at review time |
| MCP server `chrome-devtools` | `.mcp.json` | mcps/devtools/chrome-devtools | Google's `chrome-devtools-mcp`: `lighthouse_audit` (accessibility), accessibility-tree `take_snapshot`, `emulate`, `get_css_styles`. Changed from the catalog entry: pinned to 1.10.1 instead of `@latest`, and `--no-usage-statistics` added (usage statistics go to Google by default) |

Claude Code asks once before it starts a project MCP server from `.mcp.json`. Agents and skills load at the next session start.

## ThreeUI Community (SC-30, SC-31)

ThreeUI's free Community catalog (github.com/MengTo/threeui, MIT, Copyright (c) 2026 Meng To) reaches Claude Code through the maintainer's own `threeui-community` plugin. It is installed at user scope from `~/projects/threeui-community-plugin`, and serves a copy pinned to `68802d5` from `~/threeui-community`. Nothing from it is installed in this repo.

Code adapted from it keeps the MIT notice beside it. The first is `design3/designs/SC-30/THIRD_PARTY_NOTICES.md`, for SC-30's options 1 and 2; those are designs only, and the built hero uses no ThreeUI code.

## Film-making skills (SC-238)

The maintainer asked for the best director, cinematography and editing skills before the landing demo film v3 (16 Oct 2026). The aitmpl.com catalog had none (only a generic ffmpeg video-editor agent), so they were found on GitHub, each read in full first: Markdown references, plus scripts that only call a local ffmpeg; no hooks, settings or MCP servers. They are installed at user scope (`~/.claude/skills/`), like the ffmpeg skills; nothing from them is in this repo.

| Skill | Where | Source, pinned | License | Use |
| --- | --- | --- | --- | --- |
| `cinematic-director` (2.1.0) | `~/.claude/skills/cinematic-director/` | [wuwangzhang1216/DirectorSKILL](https://github.com/wuwangzhang1216/DirectorSKILL) `c65ae0d` | MIT | The director's pipeline: subtext, beats, director's book, blocking, shot list, keyframe and motion prompts, sound and dialogue plan, edit plan with transition engineering for generated clips, a coded failure manual |
| `editing-videos` (2.0.0) | `~/.claude/skills/editing-videos/` | [kmilo93sd/agent-video-editor](https://github.com/kmilo93sd/agent-video-editor) `8e32c0a` | MIT; its sound library and graphics CC0 | An editor's judgment with sourced numbers (pacing, J and L cuts, levels, ducking, SFX, color) and a CC0 library of 113 sound effects and 15 music tracks, each measured |
| `business-motion-film` | `~/.claude/skills/business-motion-film/` | [echris6/motion-video-kit](https://github.com/echris6/motion-video-kit) `e4b1c00` | MIT | Premium launch-film motion grammar, Three.js patterns, projected overlays (labels pinned to 3D anchors), audio rules and an independent-critic review loop |
| `video` | `~/.claude/skills/video/` | [smixs/visual-skills](https://github.com/smixs/visual-skills) `92be33a` | CC BY 4.0 (Serge Shima; attribution kept in its `NOTICE`) | Dramaturgy for generated film: the scene formula, Murch's rule of six, blocking, montage and the rhythm ladder |

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

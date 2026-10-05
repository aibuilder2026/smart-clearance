# SC-30: the agents, in the hero

**The request** (5 Oct 2026, the maintainer's words):

> I want to rework on this part, the heading and subtitle looks good, but I want the background hero to be more engaging, I want it to highlight the Agentic AI work more here it self,  The nine stops ten agents section somehow needs to be merged to hero section in a really surreal and aesthetic way clubbed with motion animations so that people clearly understand what is the business about . Dont take munchly example keep it client agnostic

Two screenshots came with it: the hero, and "Nine stops. Ten agents. One yes."

While the options were being made:

> I want you to download and install threeui mcp and connector and use that for generating lively hero section

> https://threeui.com/browse

Asked how the options should use ThreeUI, the maintainer chose **"Free components now (Recommended)"**: ThreeUI's free MIT Community components, restyled to the miniature town, with no purchase or sign-in.

## ThreeUI

- **The MCP server isn't installed.** Two things stopped it:
  - Claude Code's auto mode refused to add an MCP server to the user settings without the maintainer;
  - ThreeUI's MCP server is for Pro members only and signs in with OAuth.
- **To add it yourself:**
  1. Run `claude mcp add --transport http --scope user threeui https://threeui.com/api/mcp`.
  2. Sign in with `/mcp` in a terminal `claude` session.
  3. On claude.ai, add a custom connector with the same URL.
- **Options 1 and 2 adapt two Community effects**, from `@designcodeio/threeui` 1.2.0 (MIT):
  - the constellation field (option 1);
  - the gateway flow (option 2).

  `THIRD_PARTY_NOTICES.md` carries the licence. Option 3 uses no ThreeUI code.

## What every option does

- **The hero's heading, subtitle and buttons stay** as they are.
- **The nine stops play over the hero's town plate:**
  - each stop's agent works in turn;
  - the person's yes gets a beat of 980 ms;
  - a caption under the carton says what each one did.
- **Motion:**
  - it plays once, half a second after the plate has loaded: 430 ms a stop, 980 ms on the yes and 700 ms on the report while the money rolls in, 4.69 seconds in all, so every motion is over within five seconds;
  - it holds on the result ("Sold, not binned. ₹21,152 recovered, instead of −₹26,330 to destroy it") and offers Replay;
  - under reduced motion the result shows at once;
  - nothing loops (WCAG 2.2.2).
- **"Nine stops. Ten agents. One yes." is removed,** and its `#agents` anchor moves to the hero. The batch card on the plate goes too.
- **No client.** A person approves, and the batch is the illustrative one, every figure from `core/money.js`:
  - 1,360 packs with 47 days left;
  - binning would cost ₹26,330;
  - 588 packs go to 31 kiranas and 772 to one buyer;
  - ₹21,770 on screen at the yes, and a bid countered to ₹14.20;
  - ₹21,152 recovered, and 218 kg kept out of landfill.
- **Screen readers** get the nine stops as a list; the drawing is hidden from them.

## Options

| Option | Idea | Motion |
| --- | --- | --- |
| **1. The agents' constellation** (recommended) | The ten agents and the person are named stars on an arc over the carton, in a faint field of linked nodes (ThreeUI's constellation field) | Each star lights in turn and a handoff line draws from star to star, amber through the yes. The field leans toward the pointer for 0.7 s after it moves |
| 2. Through the gateway | The packs stream from the carton along dotted paths to one gate (ThreeUI's gateway flow) | The agents work at the gate in turn. At the yes it opens and the packs fan out to the kiranas (588) and the marketplace (772), whose counts rise; the other three exits stay dashed |
| 3. The carton's crew | The agents ride a tilted ring around the carton, passing behind it | The ring turns to bring each agent to the front, with the aura on it while it works. Threads draw from each agent to the next |

**Why option 1 is recommended.**
- It reads at a glance as a team of AI agents working the stock, the agentic part the request asks to see first.
- It keeps the carton and the town as the picture.
- On desktops every name is on screen at once.

## In this folder

- `board.html`: the review board. Open it through the 8787 server.
- `current/`: the hero and the nine stops section as they are today, in light and dark at 1440 and 390.
- `option-1/`, `option-2/`, `option-3/`. Each holds:
  - `mockup.html`, the whole page with that option's hero;
  - the comps, at rest (reduced motion): the first viewport at 1440, the whole hero at 390, in light and dark;
  - `motion.mp4`, the walk recorded from the mockup at 1440 in light, with the frame at the person's yes as `motion.webp`.
- `sc30.jsx`, compiled to `sc30.js`, and `sc30.css`: the three heroes. The mockups load them after SC-28's `sc28.css`, `sc28.js` and round 2's `r2.css` and `r2.js`.
- `THIRD_PARTY_NOTICES.md`: ThreeUI's MIT licence.

## Checks

- **axe**, with the suite's WCAG 2.2 AA tags and its target-size pass:
  - every option, in light and dark, at 1440 and 390;
  - both mid-walk at the person's yes and at rest;
  - zero violations.
- **Contrast against the plate.** Every piece of text drawn over the plate was measured against the pixels behind it, including the states not on screen at rest.
  - 260 pieces of text pass 4.5:1, and the lowest is 4.70:1.
  - On the way, names not yet reached stopped being dimmed with opacity, since the dimmed chip fell under 4.5:1 on the darker parts of the town. They now take the secondary ink.
- **Layout.** Every chip and label stays on the plate at 1024, 1280, 1440 and 1728.
- **Errors.** No console or network errors.

## Published for review

On the platform v3 Claude Design project, with assets pinned to commit `a562b6b`:

- [the review board](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=SC-30+design+review.html)
- [option 1](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=SC-30+option+1.html)
- [option 2](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=SC-30+option+2.html)
- [option 3](https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=SC-30+option+3.html)

## The pick

Pending.

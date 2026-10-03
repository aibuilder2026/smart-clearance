# Smart-Clearance design system

The system behind the Smart-Clearance app: a shelf-life board for near-expiry FMCG stock, a Route Room where one tap releases the agents, and one-tap phone surfaces for distributors, retailers and buyers. Paper-light surfaces, deep green for the agent and the primary action, amber for the human moment, red for risk, purple only inside the ExpireSoon marketplace, blue only on push notifications. Bricolage Grotesque for headings, IBM Plex Sans for text, IBM Plex Mono for ids and money, Noto Sans Devanagari for Hindi.

## How to use this

- Link `styles.css` from every page (`<link rel="stylesheet" href="styles.css">`) and take every colour, font, spacing, radius, shadow and motion value from its variables (`var(--green)`, `var(--display)`, `var(--r-md)`, `var(--shadow-2)`, `var(--ease-out)`). Never hard-code a hex, a font name or a duration the tokens already carry.
- Build with the classes below; the pages are plain HTML, so view source and copy the markup.
- Layouts switch on the app's own width, not the window's: wrap the app in a size container (`container-type: inline-size; container-name: app`) and use `@container app (min-width: 760px)` for tablet and `(min-width: 1100px)` for desktop. Phone is the default.
- `theme.json` is the machine-readable record of the tokens; keep it and `styles.css` in step.

## Direction

Time is the mechanism, so time is the layout. The board places batches in zones by days left and colours the zone, not the card; cards stay quiet and white. Money always carries its working (a ledger row, never a lone number). The agent is a face (the SC mark) and speaks in push cards; people are portraits. One primary action per screen, amber when it is the human gate, green when it is the agent's work.

## Colour

Restrained strategy: neutrals plus one accent, with four reserved semantic hues.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | #f3f6f2 | page ground |
| `--surface`, `--surface-2`, `--surface-3` | #ffffff, #e9efe9, #dfe7df | cards, tinted panels, pressed |
| `--ink`, `--ink-2`, `--ink-3` | #15201b, #4e5c55, #6f7d76 | text, secondary text, meta |
| `--line`, `--line-2` | #d5ded8, #c3cfc7 | hairlines, input borders |
| `--green`, `--green-700`, `--green-soft`, `--green-2` | #176b4e, #0f4d37, #dcefe5, #2fd27a | agent, primary action, verified, scan light |
| `--amber`, `--amber-ink`, `--amber-soft` | #e3b74d, #5a3d03, #fbefcf | the human moment: approve, current step, focus ring |
| `--red`, `--red-soft` | #b4232c, #fbe3e4 | risk, the bin, losses |
| `--purple`, `--purple-soft` | #4c2a9c, #e9e2f7 | ExpireSoon only |
| `--blue`, `--blue-soft` | #2a5fa8, #e8f1fb | push notifications only |
| `--orange`, `--donate` | #c56a1f, #0f8a5f | kirana shops, food bank in split bars |
| `--z-safe` … `--z-cleared` | tints | board zone grounds |

Text on tinted grounds uses the ink of that hue (`--amber-ink` on amber, `--green-700` on green-soft), never grey. Contrast floor 4.5:1 for text, 3:1 for headline scale.

## Type

`--display` Bricolage Grotesque 700/800 for headings and big numbers (h1 28, h2 22, h3 18, h4 16; display numerals up to 40). `--body` IBM Plex Sans 400/500/600 at 16 (phone body), 15 cards, 14 small, 13 tiny; line-height 1.5. `--mono` IBM Plex Mono 400/500 with tabular numerals for ids, money, times and codes. `--hindi` Noto Sans Devanagari 500/700 wherever a string is Hindi. Tracking -0.02em on display only.

## Space, radius, depth, motion

Spacing on a 4 px scale (8, 10, 12, 14, 16, 20, 28). Radii `--r-sm` 8, `--r-md` 12, `--r-lg` 16, `--r-xl` 22; sheets 22, phone screens 36. Shadows `--shadow-1/2/3` carry an offset and a soft blur; never a zero-offset halo. Motion: `--ease-out` cubic-bezier(.2,.8,.2,1); 150 to 350 ms for state changes; springs (stiffness 380 to 500, damping 32 to 40) for sheets and push cards; count-ups 0.9 s; stagger 50 to 80 ms; one authored moment per screen; everything respects `prefers-reduced-motion`.

## Icons

One authored set, 24-grid, stroke 1.75, round caps and joins, no fills (see `components.html`). Icons sit beside text; icon-only controls carry `aria-label`. No emoji.

## Components

| Class | What it is | Shown in |
| --- | --- | --- |
| `.btn` with `.primary`, `.amber`, `.secondary`, `.ghost`, `.danger`, `.purple`; sizes `.sm`, `.lg`; `.full` | Actions; amber is reserved for the human gate | components.html |
| `.chip` with `.green`, `.red`, `.amber`, `.purple`, `.blue`, `.outline`, `.mono` | Status and facts | components.html |
| `.mark` (`.sm`, `.lg`) | The agent's face: green rounded square, amber dot | components.html |
| `.avatar` | A person; portraits, never initials | components.html |
| `.card`, `.card.tint`, `.card.flat` | Quiet white container; zones carry colour, not cards | components.html |
| `.ledger` + `.lrow` (`.pos`, `.neg`, `.sum`) | Money with its working | components.html |
| `.bar`, `.bar.tall`, `.c-shops` … | Split and tracker bars | components.html |
| `.input`, `.field`, `.stepper` | Form controls, 48 px tall | components.html |
| `.push` | A push notification card inside the app | components.html |
| `.sheet` (`.sheet-bottom`, `.sheet-side`) + `.scrim` | Bottom sheet on phones, side panel elsewhere | components.html |
| `.zone` + `.bcard` | Board zone and batch card with countdown | components.html |
| `.door` (`.sel`, `.es`, `.fb`, `.bin`) | A priced exit per carton | components.html |
| `.stepper-h` + `.st`, `.timeline` + `.tl` | Progress and the agent timeline | components.html |
| `.msg` + `.bub` (`.ag`, `.pu`, `.dots`) | Chat between a person and the agent | components.html |
| `.doc`, `.paper` | Document card and its preview | components.html |
| `.kpi`, `.table`, `.hbar` | Ledger numbers, tables, bars | components.html |
| `.topbar`, `.rail`, `.bnav` | App chrome: top bar, rail (tablet, desktop), bottom nav (phone) | components.html |

States ship built in: hover tints from the same hue, pressed scale .97, `:focus-visible` is a 3 px amber ring, disabled drops to 45%, loading shows a spinner inside the button, empty states teach, skeletons shimmer.

## Do

- Show the money before asking for the yes; every rupee carries its working.
- Give each screen one primary action; make it amber when a person is the gate.
- Keep cards white and quiet; let zones, chips and bars carry colour.
- Use portraits for people and the SC mark for the agent, everywhere.
- Design phone first; hit targets 44 px; body 16 px on phones.

## Don't

- No kicker or eyebrow above a heading; the heading carries its own weight.
- No coloured left borders on cards or alerts; no gradient text; no glass as decoration.
- No purple outside ExpireSoon, no blue outside push cards.
- No grey text on coloured grounds; tint from the hue instead.
- No modal where an inline state or a sheet will do.

## Files

- `styles.css`: tokens and the component layer.
- `theme.json`: the tokens as data.
- `Smart-Clearance design system.html`: foundations (colour, type, space, motion, icons).
- `components.html`: every component in every state, plain HTML.
- `thumbnail.html`: the project cover.

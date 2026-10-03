# Smart-Clearance design system v2

The label world. Smart-Clearance routes near-expiry FMCG stock to the exit that earns the most in the days it has left, and v2 draws the product the way a Sivakasi matchbox label is printed: seven flat chromolithograph inks, a black keyline around every plate, display type with a second ink behind it, and a slightly misregistered arrival that snaps into register. Two editions of label stock, Day and Night, carry the same inks.

Pages: `Smart-Clearance DS v2.html` (foundations, the direction record, colour, type, motion, icons, imagery), `components.html` (every component in every state, live, in both editions). Files: `tokens.css`, `base.css`, `components.css`, `stage.css`, `kit.jsx`, `theme.json`, `img/`.

## How to use this

- Load the four stylesheets in order (`tokens.css`, `base.css`, `components.css`, and `stage.css` when the app sits in a demo stage), then React 18, framer-motion 11 (UMD, global `Motion`), Babel standalone, and `kit.jsx` as a `text/babel` script. The kit exposes `window.SC2`.
- Wrap the app in `SC2.ThemeProvider` and put `data-theme={resolved}` on the `.app` root; `SC2.ModeSwitch` goes at the right end of every top bar. Without the attribute the edition follows the device.
- Take every colour, font, size, radius, keyline, shade and duration from the tokens (`var(--emerald-field)`, `var(--font-display)`, `var(--r-md)`, `var(--kl)`, `var(--t-register)`). Never a raw hex in a component.
- Layouts switch on the app's own width, not the window's: the `.app` is a size container, and `@container app (min-width: 760px)` is tablet, `(min-width: 1100px)` desktop. Phone is the default.
- `theme.json` is the machine-readable record of the tokens; keep it and `tokens.css` in step.

## Direction

The product prints. Every batch is a label on an uncut printer's sheet; the sheet is sorted by days left and the label's biggest numeral is the days. Every change of state is a plate arriving: pushes, chips, numerals and the mark print in with their inks offset and snap into register in 240 ms. Colour lives inside bordered plates and chrome fields, never as a wash under text. One chrome-yellow action per screen is the human yes; emerald is the agent's work; vermilion is risk; violet belongs only to ExpireSoon; ultramarine owns the chrome and the push card; kraft is the carton.

Refused: the KPI-tiles-over-a-table dashboard, the neon AI command centre, and v1's literal shelf-life-zone board. Raised by the roll's challengers: live tiles that flip in place, a running head of guide words, a duration-true timeline, one full-bleed snap card per trade moment on phones, a capacity tape the doors cannot overflow, and one live control that remaps every number.

## Colour

Full-palette strategy, committed at region scale. Values below are the Day edition; Night is composed separately (`tokens.css`), with bright inks and dark text on them.

| Token | Day | Night | Job |
| --- | --- | --- | --- |
| `--stock`, `--stock-2`, `--stock-3` | #f2eee4, #fffdf7, #e7e1d2 | #101433, #1a1f47, #252b5c | page ground, plate white, pressed tint |
| `--ink`, `--ink-2`, `--ink-3`, `--keyline` | #16130f, #4a443a, #655e52 | #f3eedd, #c6c0ab, #a39d88 | text, secondary, meta, every keyline |
| `--ultra-field` / `--ultra-text` / `--ultra-soft` | #1b3fc4 / #1b3fc4 / #dde4fb | #2946cc / #9bb0ff / #1d2a6e | chrome, structure, push cards |
| `--emerald-field` / `-text` / `-soft` | #0e7a4a / #0a5a36 / #d6efdf | #2fd27a / #5fe8a0 / #123f2d | the agent, the primary action, verified |
| `--chrome-field` / `-text` / `-soft` | #f6b400 / #7a5600 / #fff0bf | #ffc21a / #ffd45c / #4a3a05 | the human yes, the current step, focus |
| `--vermilion-field` / `-text` / `-soft` | #c92d18 / #a12210 / #fbddd6 | #ff6a52 / #ff9a88 / #4d1a12 | risk, the bin, losses |
| `--violet-field` / `-text` / `-soft` | #5a2fb7 / #4a2697 / #e8dffa | #a98cff / #c9b8ff / #2e2160 | ExpireSoon only |
| `--kraft-field` / `-text` / `-soft` | #c9924f / #7a4e1e / #f3e4cd | #e5b47a / #f1cf9c / #3d2c16 | the carton, the godown |
| `--shade-ink` | #1b3fc4 | #ff6a52 | the offset second ink on primaries and the mark |
| `--chrome-bar`, `--chrome-bar-fg`, `--chrome-bar-fg-2` | #1b3fc4, #fffdf7, #c9d3ff | #0b0e26, #f3eedd, #a9b4ea | rail, bottom nav |

Text on a tinted plate takes the hue's own text ink (`--chrome-text` on `--chrome-soft`), never grey. Every pair above was checked at 4.5:1 or better in both editions.

## Type

`--font-display` Bungee (one weight) with `--font-shade` Bungee Shade as the second ink: the mark, the wordmark, label titles, the big numerals (`.big.sm/md/lg/xl` = 28/36/48/64). `--font-ui` Anek Latin 400 to 800 with the width axis (`.narrow` 85%, `.urgent` 125% and weight 800) for every operational word; `--font-hi` Anek Devanagari for Hindi, same foundry, so both scripts sit on one line. `--font-mono` Azeret Mono 400/500/700 with tabular numerals for ids, times, codes and money. Scale: 13, 14, 16 (phone body floor), 18, 22, 28, 36, 48, 64; line-height 1.5 body, 1.25 headings, 1.1 display.

## Space, keyline, radius, depth, motion

Spacing on a 4 px scale (`--sp-1` 4 to `--sp-9` 56). Keylines `--kl` 2 px on plates, `--kl-thin` 1.5 px on chips, inputs and rules. Radii `--r-xs` 4, `--r-sm` 8, `--r-md` 12, `--r-lg` 20, `--r-pill`. Depth is an ink, not a glow: `--shade-x/y` 4 px offset second ink on `.btn.primary`, `.btn.yes`, `.plate.shaded` and the mark; the three shadows carry an offset and a blur. Motion: `--ease-out` cubic-bezier(.16, 1, .3, 1); `--t-feedback` 120 ms, `--t-register` 240 ms, `--t-sheet` 420 ms (spring 420/40), `--t-focal` 700 ms; reduced motion arrives already in register.

## Icons

One authored set (`SC2.Icon`, 24 grid, stroke 1.75, round caps): home, bell, sheet, file, chart, camera, truck, store, tag, chat, leaf, play, refresh, check, x, chevrons, plus, minus, search, user, users, settings, shield, key, logout, login, sun, moon, filter, sort, download, upload, eye, edit, trash, more, arrow, clock, calendar, box, rupee, phone, mail, globe, pin, alert, info, lock, link, copy, external, spark, send, image, checkcircle, xcircle, dashboard, doc, history, plug, percent, scale, flag, star, menu, bolt, whatsapp, google, language, print. 22 px in chrome, 18 px inside buttons, 14 px inside chips. No emoji.

## Imagery

`img/`: the carton (`hero-carton`), two product plates (`plate-chips`, `plate-mango`) and eight emblems (rooster for the operator's morning watch, van, shop, ship, ledger, tree, key, sun), generated with Qwen-Image 2.1 in the label idiom; the exact prompt and seed sit beside each file in `<name>.prompt.json`. Transparent, 512 px WebP for shipping; 1024 px PNG originals in the repo working tree. The seven portraits from v1 stay (`docs/story-img/p-*.jpg`).

## Components

| Kit | Class | What it is |
| --- | --- | --- |
| `Btn` | `.btn` + `.primary .yes .secondary .ghost .danger .market .onchrome`, `.sm .lg .full .sq .pill` | Printed, keylined buttons; the yes and the primary carry the shade |
| `Chip` | `.chip` + tone, `.solid .mono .lg`; `.badge` | Lozenges for status and facts |
| `Plate` | `.plate` + tone, `.framed .reg .shaded .lift .tight .flush`; `.rule` | The only container |
| `Avatar`, `Mark`, `Wordmark`, `Emblem`, `Sun` | `.avatar`, `.mark`, `.ink-layered`, `.emblem`, `.sun .sunwrap` | A person, the agent, a role, the agent at work |
| `Splash` | `.splash` | The mark prints itself, once per session |
| `Field`, `Input`, `Select`, `Toggle`, `Stepper`, `OTP`, `Segmented`, `Tabs`, `Menu` | `.field .input .select .textarea .toggle .stepper .otp .segmented .tabs .menu .check` | Forms and controls, every state |
| `Shell`, `TopBar`, `RunHead`, `ModeSwitch` | `.shell .rail .bnav .topbar .runhead .modeswitch .iconbtn .backbtn` | Chrome: rail from 760 px, bottom nav on phones, the running head, the edition switch |
| `Sheet`, `ToastHost` + `useToasts` | `.sheet .sheet-bottom .sheet-side .scrim .push .toast .toasts` | Bottom sheet or side panel; pushes print in |
| `Ticks`, `Tape`, `LiveTile`, `CountUp` | `.ticks .tape .tile .stat .progress .bar` | The best-before strip, the capacity tape, a number that flips in place |
| `Label`, `Door`, `Notice`, `Gate` | `.label .sheetgrid .door .doors .notice .gate` | A batch, an exit, the agent's printed note |
| `Timeline`, `Stages` | `.timeline .tl .stages` | Duration-true timeline, the stage stepper |
| `Empty`, `Skeleton`, `Spinner` | `.empty .skeleton .spinner .regspin` | Teaching empty states, shimmer, the crosshair |
| `Register`, `Stagger` | `.register .register-x .stamp .fadeup .stagger` | Arrivals and the approve stamp |
| (CSS) | `.snap .snaphead .snapbody .snapfoot .glyphs` | One full-bleed card per trade moment on phones |

## Do

- Draw every container as a keylined plate; let the ink field or the header band carry state.
- Give each screen one chrome-yellow action, the human yes; emerald for what the agent does.
- Set the biggest number in Bungee, ids and money in Azeret Mono with tabular figures, everything else in Anek; Hindi in Anek Devanagari at 15 px or larger.
- Let arrivals register once, 240 ms; live numbers flip in place.
- Design phone first; hit targets 44 px; inputs 48 px; body 16 px on phones.

## Don't

- No kicker or eyebrow above a heading; the header band is the only label.
- No black block shadows and no glows; the only offset is the named second ink.
- No violet outside ExpireSoon; no ultramarine field for anything but chrome and pushes.
- No grey text on a coloured plate.
- No loops but the sun, no entrance choreography on routine screens, no modal where a sheet or an inline state will do.

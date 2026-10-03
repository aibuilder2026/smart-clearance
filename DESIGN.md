---
name: Smart-Clearance
description: A shelf-life board and one-tap route room for near-expiry FMCG stock; paper-light ground, deep green for the agent, amber for the human moment.
colors:
  paper-ground: "#f3f6f2"
  card-white: "#ffffff"
  tint-panel: "#e9efe9"
  tint-pressed: "#dfe7df"
  ink: "#15201b"
  ink-secondary: "#4e5c55"
  ink-meta: "#6f7d76"
  hairline: "#d5ded8"
  hairline-strong: "#c3cfc7"
  agent-green: "#176b4e"
  agent-green-deep: "#0f4d37"
  agent-green-soft: "#dcefe5"
  scan-green: "#2fd27a"
  gate-amber: "#e3b74d"
  gate-amber-ink: "#5a3d03"
  gate-amber-soft: "#fbefcf"
  risk-red: "#b4232c"
  risk-red-soft: "#fbe3e4"
  expiresoon-purple: "#4c2a9c"
  expiresoon-purple-soft: "#e9e2f7"
  push-blue: "#2a5fa8"
  push-blue-soft: "#e8f1fb"
  kirana-orange: "#c56a1f"
  kirana-orange-soft: "#fbe8d6"
  foodbank-green: "#0f8a5f"
  idle-grey: "#b9c6bf"
  zone-safe: "#d9efe2"
  zone-zepto: "#e9f0d9"
  zone-blinkit: "#fbefcf"
  zone-risk: "#fbe3e4"
  zone-cleared: "#dcefe5"
  chrome-dark: "#0f1a15"
  stage-dark: "#0f1512"
typography:
  display:
    fontFamily: "Bricolage Grotesque, IBM Plex Sans, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, IBM Plex Sans, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, IBM Plex Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
    fontVariation: "tabular-nums"
  hindi:
    fontFamily: "Noto Sans Devanagari, IBM Plex Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "22px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.agent-green}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.agent-green-deep}"
  button-amber:
    backgroundColor: "{colors.gate-amber}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.tint-panel}"
  button-ghost:
    textColor: "{colors.agent-green}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.agent-green-soft}"
  button-danger:
    backgroundColor: "{colors.risk-red-soft}"
    textColor: "{colors.risk-red}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-purple:
    backgroundColor: "{colors.expiresoon-purple}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-lg:
    rounded: "14px"
    padding: "0 24px"
    height: "52px"
  chip:
    backgroundColor: "{colors.tint-panel}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "28px"
  chip-green:
    backgroundColor: "{colors.agent-green-soft}"
    textColor: "{colors.agent-green-deep}"
  chip-amber:
    backgroundColor: "{colors.gate-amber-soft}"
    textColor: "{colors.gate-amber-ink}"
  chip-red:
    backgroundColor: "{colors.risk-red-soft}"
    textColor: "{colors.risk-red}"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  card-tint:
    backgroundColor: "{colors.tint-panel}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "48px"
  batch-card:
    backgroundColor: "{colors.card-white}"
    rounded: "14px"
    padding: "12px"
  push-card:
    backgroundColor: "{colors.card-white}"
    rounded: "18px"
    padding: "12px 14px"
  sc-mark:
    backgroundColor: "{colors.agent-green}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.md}"
    size: "40px"
---

# Design System: Smart-Clearance

## Overview

**Creative North Star: "The Shelf-Life Board"**

Time is the mechanism, so time is the layout. The whole system is built so that a batch of near-expiry stock can be read like a card on a sorting board: it sits in a zone by days left, the zone carries the colour, the card stays white and quiet, and the clock pushes it toward the red edge. Everything else (the Route Room with its six priced doors, the agent timeline, the retailer's one-tap Hindi scheme, the finance ledger) is a view of that one board, drawn in the same paper-light material.

The material is paper: a cool, faintly green ground (#f3f6f2) with white cards sitting on it under a soft, low shadow. Colour is rationed by role, not by taste. Deep green belongs to the agent and to the primary action; amber is reserved for the moment a human is the gate (Approve, the current step, the focus ring); red is risk and the bin; purple marks the ExpireSoon marketplace channel; blue marks a push notification. The agent has a face (the SC mark: a green rounded square with an amber dot) and the people have portraits, so nothing on screen speaks without a face beside it.

Density is working-tool density, not dashboard density: 16px body on phones, 44px hit targets, 48px inputs, one primary action per screen, and money never shown without its working. The build refuses the KPI-tiles-over-a-table dashboard this category usually ships; KPI tiles exist only on the finance ledger, where the numbers are the content.

**Key Characteristics:**
- Zones carry colour; cards are white and quiet.
- One accent (deep green) plus four reserved semantic hues (amber, red, purple, blue) and two split-bar hues (orange, food-bank green).
- Four faces: Bricolage Grotesque for headings and big numerals, IBM Plex Sans for text, IBM Plex Mono with tabular numerals for ids and money, Noto Sans Devanagari for Hindi.
- Soft, low, ink-tinted shadows; no hard offsets, no coloured left borders, no eyebrows.
- Phone first, container-query driven: layouts switch on the app's own width at 760 and 1100.
- Motion is one ease-out curve, springs for sheets and pushes, count-ups for money.

## Colors

A restrained, paper-and-ink palette: neutrals plus one accent, with four hues reserved for a single meaning each.

### Primary
- **Agent Green** (`agent-green`): the agent's colour and the primary action. Primary buttons, the SC mark, verified chips, done steps on the timeline, selected door border, links, the active tab underline and active bottom-nav item. Hover darkens to **Agent Green Deep** (`agent-green-deep`), which is also the text ink on green-soft grounds.
- **Agent Green Soft** (`agent-green-soft`): tinted ground for green chips, the selected door, the agent's chat bubble, the ghost-button hover, and the input focus ring. Text on it is always `agent-green-deep`, never grey.
- **Scan Green** (`scan-green`): one use only, the viewfinder corners and scanline in the camera screen on black.

### Secondary
- **Gate Amber** (`gate-amber`): the human moment. The Approve button, the Open-batch button, the retailer's "ऑर्डर करें", the current step on the stepper and timeline, the `:focus-visible` ring (3px), the text selection highlight, and the inbox badge on the dark rail. Amber ink on amber-soft is **Gate Amber Ink** (`gate-amber-ink`); the soft tint (`gate-amber-soft`) is also the halo behind the current step and the Blinkit gate zone.

### Tertiary
- **Risk Red** (`risk-red`): risk, losses, the bin, the hot card ring and the notification badge in the top bar. Soft tint (`risk-red-soft`) for red chips, the dashed bin door, the danger button and the at-risk zone.
- **ExpireSoon Purple** (`expiresoon-purple`): the ExpireSoon marketplace channel wherever it is referenced: the buyer surface header and price, the bid button, the ExpireSoon door border, the Lister chip on the Execution screen, the buyer's chat bubble (`expiresoon-purple-soft`), and the online segment of the split bar.
- **Push Blue** (`push-blue`): push notifications only: the blue chip on the Outreach card, the Hindi push preview ground (`push-blue-soft`), and the distributor's inline hero push card.
- **Kirana Orange** (`kirana-orange`) and **Food-bank Green** (`foodbank-green`): split-bar segments for the kirana-shop and donation channels. **Idle Grey** (`idle-grey`): the "stays as is" segment of the same bar.

### Neutral
- **Paper Ground** (`paper-ground`): the page behind everything inside the app; also the manifest background colour.
- **Card White** (`card-white`): cards, batch cards, sheets, inputs, zone-strip pills, the nav bar on phones.
- **Tint Panel** (`tint-panel`): flat tinted cards, hover tints on icon buttons, chip default ground, bar tracks, skeleton base, the user's own chat bubble. **Tint Pressed** (`tint-pressed`) is the darker step of the same family.
- **Ink** (`ink`): text, the sum line in a ledger, the selected zone-strip border. **Ink Secondary** (`ink-secondary`) for secondary text and labels; **Ink Meta** (`ink-meta`) for timestamps, struck prices and todo timeline rows.
- **Hairline** (`hairline`) for card borders, dividers, table rows, dashed ledger rows; **Hairline Strong** (`hairline-strong`) for input and secondary-button borders, the sheet grab handle and the scrollbar thumb.
- **Zone tints** (`zone-safe`, `zone-zepto`, `zone-blinkit`, `zone-risk`, `zone-cleared`): the five board zones from green through olive and amber to red and back to cleared green. They are grounds for white cards, never text colours.
- **Chrome Dark** (`chrome-dark`): the left rail on tablet and desktop, the agent's morning note, the sign-in screen and code blocks; **Stage Dark** (`stage-dark`) is the demo stage and scrim base behind the device frame. On dark chrome, text is `#c8d3cc` / `#a9b7ae`, active item ground `#1f3b2d`, hover `#1b2a22`, and the agent's timestamp ink `#8fb3a0`.

### Named Rules
**The Zone, Not The Card Rule.** Colour on the board lives in the zone ground. A batch card is white with a hairline hover; its only colour is the countdown fill and, on the one hot card, a 2px red ring. Never paint a card or give it a coloured left border to signal state.

**The Amber Gate Rule.** Amber appears exactly where a person is the gate: the one approve-class button on a screen, the current step, the focus ring. The agent's own work is green. A screen never carries both an amber and a green primary button.

**The Reserved Hue Rule.** Purple means ExpireSoon, blue means a push notification, red means risk, orange and food-bank green appear only inside split bars and their legends. A hue used outside its meaning is a defect, not a variation.

**The Tint-From-The-Hue Rule.** Text on a coloured ground takes the ink of that hue (`gate-amber-ink` on amber-soft, `agent-green-deep` on green-soft, `risk-red` on red-soft), never grey.

## Typography

**Display Font:** Bricolage Grotesque (with IBM Plex Sans, system-ui fallback), loaded at optical-size axis 12–96, weights 600/700/800
**Body Font:** IBM Plex Sans (with system-ui, Segoe UI fallback), weights 400/500/600
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, Menlo fallback), weights 400/500, tabular numerals
**Hindi Font:** Noto Sans Devanagari (with IBM Plex Sans fallback), weights 500/700

**Character:** A warm, slightly characterful grotesque for the headings and the big rupee figures, over a workmanlike humanist sans for everything you read, with a mono for everything you count. Headings are tight (-0.02em) and balanced; body is loose (1.5) and pretty-wrapped. The mono is not decorative: it marks ids, times, money and codes so a number can be trusted at a glance.

### Hierarchy
- **Display** (800, 40px, line-height 1, -0.02em): the one big number on a surface: the ExpireSoon price per packet. The offer card's headline figure uses the same face at 28px/1.1, and the sign-in h1 at 34px.
- **Headline** (800, 28px, line-height 1.15, -0.02em): the page h1 ("Shelf-life board", "Execution · MF-2409-117", a person's name on the trade surfaces). Sheet titles are h2 at 20px.
- **Title** (700, 22 / 18 / 16px, line-height 1.15): h2, h3 and h4. Card and section titles are h3 (18px); zone headers, document titles and "what happens when you tap" are 16px display.
- **Body** (400, 16px phone body, 15px inside cards and chat bubbles, line-height 1.5): all reading text. 14px (`small`) for secondary rows, table cells and labels; 13px (`tiny`) for meta, legends and help text. Chat bubbles cap at 44ch.
- **Label** (500, 12–13px): chips (13px), bottom-nav and rail items (12px), KPI captions (13px). Weight 600 is for emphasis inside body (field labels, batch names, step "now", ledger sum), never a separate face.
- **Data** (IBM Plex Mono 500, 12–24px, tabular): ids at 12–13px, ledger and door values at 14–15px, approve-bar numbers 17px, KPI numbers 22px, door prices and stepper output 24px/18px. 400 for timestamps and codes.
- **Hindi** (Noto Sans Devanagari 500/700, inherits size): any Hindi string, applied by the `hindi` class, including inside buttons.

### Named Rules
**The Tabular Money Rule.** Every rupee, id, time and count is set in IBM Plex Mono with tabular numerals, right-aligned where it sits in a column, and money carries its working: a ledger row with a label, never a lone number.

**The No-Eyebrow Rule.** Headings carry their own weight. There is no kicker, eyebrow or uppercase tracked label above a title; the only uppercase mono in the app is the stamped heading inside a paper document preview, where it is the document's own convention.

## Layout

The app is a size container (`container-type: inline-size; container-name: app`), and every layout switches on the app's own width, not the window's: phone below 760px, tablet 760–1099px, desktop from 1100px. The three proof widths are 390, 820 and 1440.

Phone is the default: a single column with 16px side padding and 24px bottom padding, a sticky top bar (12px 16px, frosted paper: 88% ground mixed with white and a 10px blur), and a 64px bottom nav of up to four items. On the board, the five zones collapse to a horizontal pill strip (44px pills, scroll-snap) and only the selected zone shows, with the at-risk zone first. Sheets rise from the bottom (92% max height, 22px top corners, grab handle); the primary action sits in the sheet footer or a sticky approve bar at thumb height.

From 760px the bottom nav disappears and a 96px dark rail appears on the left (mark, nav items at 56px with 12px radius, inbox badge, portrait and sign-out at the foot). Page padding grows to 20px 28px, the top bar to 14px 28px. The board becomes two columns (content plus a 300px agent-note column, 320px at desktop); zones go to two columns on tablet with the risk zone spanning full width and first, and to five columns at desktop. The Route Room becomes content plus a 320px side column; doors go 2 → 3 → 6 across; the label card goes side-by-side with its read-out at 1.1fr/1fr. Execution is 1 → 2 → 3 columns; KPIs 2 → 4; documents auto-fill at 230px minimum. Sheets become a 520px side panel; toasts dock top-right at 380px.

Spacing rhythm is tight and even: 4, 6, 8, 10, 12, 14, 16, 20, 28. Stacks are 8 (small), 12 (default) and 20 (large); rows gap 10; cards pad 16, batch cards and zones 12, KPIs 12 14; ledger rows 9px vertical on a dashed hairline. Hit targets are never below 44px; inputs are 48px; large buttons 52px. Text content is width-limited by component (offer and hero push 680px, sign-in roles 640px, chat bubbles 44ch, push cards 560px), not by a global container.

## Elevation & Depth

Depth is tonal first and shadow second. The page is paper, cards are white on it with a hairline border, and tinted panels are the darker tone of the same paper. Shadows exist in three ink-tinted, soft, multi-layer steps and are reserved for things that float: cards get the lowest, floating bars and pushes the middle, sheets and the device frame the highest. There are no hard offset shadows, no coloured glows except the three state halos (primary-button lift, the hot card's red ring, the current-step amber halo), and the only blur is the sticky top bar's frosted paper, which is functional, not decorative.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgba(21,32,27,.06), 0 4px 14px rgba(21,32,27,.06)`): default cards, batch cards, document cards, offer cards, paper previews. Flat and tinted cards drop it.
- **Float** (`box-shadow: 0 6px 18px rgba(21,32,27,.10), 0 18px 48px rgba(21,32,27,.12)`): the sticky approve bar, push cards, and the hot batch card (combined with its red ring).
- **Sheet** (`box-shadow: 0 12px 30px rgba(21,32,27,.16), 0 40px 90px rgba(21,32,27,.22)`): bottom sheets, side panels and the device frame on the demo stage.
- **Button lift** (`box-shadow: 0 6px 16px rgba(23,107,78,.28)` green; `0 6px 16px rgba(227,183,77,.3)` amber): a tinted lift under the one primary button on a screen, removed when disabled.
- **Mark halo** (`box-shadow: 0 0 0 3px var(--green-soft)`): the SC mark's soft ring; 2px on the small mark.
- **Hot ring** (`border: 2px solid var(--red)` at inset -2px, plus `0 0 0 4px rgba(180,35,44,.12)`): the single at-risk card that is breathing.
- **Focus** (`outline: 3px solid var(--amber); outline-offset: 2px`): every focus-visible element; inputs instead shift their border to green with a 3px green-soft ring.

### Named Rules
**The Quiet Card Rule.** Cards rest on the lowest shadow and a hairline; they never lift on hover. Hover is a border shift to the strong hairline. Only one card on a board may wear the hot ring at a time.

## Shapes

Softly rounded, never pill-shaped except where the thing is a choice or a count. The radius scale is 8 / 12 / 16 / 22: 8px for small marks, paper previews, skeleton blocks and the legend swatch (3px); 12px for buttons, inputs, steppers, icon buttons, nav items, code blocks, the label photo and the SC mark; 16px for cards, zones, chat bubbles and the approve bar inner; 22px for the top corners of a bottom sheet. In-between values the build also uses: 10px for small buttons and the back button, 14px for large buttons, batch cards, document cards, doors, KPI tiles and the camera frame, 18px for the large mark, push cards, offer and hero-push cards. Pills (999px) are chips, zone-strip buttons and the role button; circles are avatars, step dots, timeline nodes, route stops and the shutter.

Borders are 1px hairline on cards and 1.5px strong hairline on inputs, secondary buttons and doors. State is shown by changing the border colour (green selected, purple ExpireSoon, dashed red for the bin), never by thickness. Ledger and order rows separate with a 1px dashed hairline; the ledger sum closes with a 2px ink rule. The bottom sheet carries a 44 × 5px grab handle; the phone frame rounds its app to 36px.

## Components

Components are tactile and plain: flat colour, 44px minimum height, a press that scales to .97, hover that shifts tone within the same hue.

### Buttons
- **Shape:** gently rounded (12px); 10px at the small size (36px tall), 14px at the large size (52px tall, 17px text, 24px side padding). 44px tall, 18px side padding, 15px/600 text, 8px icon gap by default.
- **Primary:** agent green on white text with a green lift shadow; hover deep green. This is the agent's work.
- **Amber:** gate amber with ink text and an amber lift; hover `#d9a93a`. This is the human's yes: Approve, Open the batch, Order.
- **Secondary:** white with a 1.5px strong hairline, ink text; hover tint panel. The common second action and the "Open" on a push card.
- **Ghost:** green text, no ground; hover green-soft. Sign out, back-style links, "Watch".
- **Danger:** red-soft ground with red text; hover `#f6cfd1`.
- **Purple:** ExpireSoon purple on white; hover `#3a1f7a`. Used only on the buyer surface (Place bid, Accept counter).
- **States:** press scales to .97 over 120ms ease-out; disabled drops to 45% opacity and loses its shadow; loading replaces the icon with a 16px currentColor spinner; focus is the global amber outline.

### Chips
- **Style:** pill (999px), 28px tall, 10px side padding, 13px/500; default is tint panel with secondary ink. Mono chips drop to 12.5px for ids.
- **Tones:** green (soft/deep green) for verified and done; amber (soft/amber-ink) for pending and the gate; red (soft/red) for risk; purple for ExpireSoon statuses; blue for push; outline (transparent, strong hairline) for neutral facts.

### Cards / Containers
- **Corner Style:** 16px (14px for batch, door, document and KPI cards; 18px for offer and push cards).
- **Background:** white, 1px hairline, card shadow; `tint` variant is tint panel with no border or shadow; `flat` keeps the border and drops the shadow.
- **Shadow Strategy:** card shadow at rest, never lifts on hover (see Elevation).
- **Border:** 1px hairline; batch cards use a transparent 1.5px border that becomes strong hairline on hover.
- **Internal Padding:** 16px; 12px in batch cards and zones; 12px 14px in KPI tiles and push cards.

### Inputs / Fields
- **Style:** white, 1.5px strong hairline, 12px radius, 48px tall, 14px side padding, 16px text. Field labels 14px/600 above; help text 13px secondary ink below; 6px gap.
- **Focus:** border to agent green with a 3px green-soft ring (replaces the outline).
- **Stepper:** 48px square buttons inside a 1.5px bordered 12px pill-less box; the output is 18px mono.
- **Error / Disabled:** not built in the prototype.

### Navigation
- **Phone bottom nav:** white, hairline top, up to four 44px items of icon (22px) over a 12px/500 label in secondary ink; the current item turns agent green with a 28 × 3px green bar hanging from the top edge.
- **Rail (760px+):** 96px dark chrome column; items are icon over label at 12px, 56px tall, 12px radius; hover `#1b2a22`, current `#1f3b2d` with white text; the inbox badge is amber with ink text. The portrait and sign-out sit at the foot.
- **Top bar:** sticky frosted paper; portrait (36px circle) with 15px/600 name and 13px secondary sub-line, or a back button; a 44px bell with a red badge.
- **Tabs:** 44px, 600 weight secondary ink, 3px bottom border that turns green when selected.
- **Zone strip (phone):** white pills with a mono count badge; the selected pill takes an ink border.

### The Shelf-Life Board
Five zones (`safe`, `zepto`, `blinkit`, `risk`, `cleared`) as 16px-radius tinted grounds with a 16px display header, a count and a mono gate label. Batch cards inside are white, 14px radius, 12px padding, with name (15px/600), mono id, meta row and a 6px countdown track whose fill colour follows days left (green ≥ 108, olive 90–107, amber 60–89, red below). The one hot card wears the red ring and the float shadow, and its loss line is red 14px/600.

### The SC Mark
A 40px agent-green square with 12px corners, "SC" in 15px/800 display white, a 10px amber dot sitting on the top edge, and a 3px green-soft halo. Small (28px, 8px radius, 2px halo) in push cards and chat; large (64px, 18px radius) on sign-in. This is the agent's face wherever the agent speaks.

### Push Card
A floating white card (96% white, 18px radius, float shadow, 12px 14px padding) with the small SC mark on the left, a 15px/600 title with a mono "now" beside it, a 14px body (Hindi when the push is Hindi), and a secondary "Open" button or an X. One push at a time, springing in from above (stiffness 500, damping 34).

### Doors
Six priced exits per carton as 14px-radius white cards with a 1.5px hairline; name 14px/600, value 24px mono in green, reason 12.5px secondary. Selected: green border on green-soft; ExpireSoon: purple border and purple value; the bin: dashed red border on red-soft with a red value.

### Sheet
Bottom sheet on phones (22px top corners, grab handle, 92% max height) and a 520px side panel elsewhere, under a 55% stage-dark scrim; sprung in (stiffness 420, damping 40). Header h2 at 20px with a 44px X; footer carries the action with a hairline top.

### Motion
One ease-out curve, `cubic-bezier(.2,.8,.2,1)`. Buttons 120–150ms; fade-up entrances 320–350ms with 50ms stagger; sheets and pushes on springs (stiffness 380–500, damping 32–40); money counts up over 0.9s; the 38-shop grid lights over 300ms; skeleton shimmer 1.4s; typing dots 1s. Reduced motion collapses every animation and transition to near-zero and count-ups render their final value.

## Do's and Don'ts

### Do:
- **Do** colour the zone, not the card; keep cards white with a hairline and the card shadow.
- **Do** give each screen one primary action: amber when a person is the gate, green when it is the agent's work.
- **Do** set every id, time and rupee in IBM Plex Mono with tabular numerals, and show money with its working as a ledger row.
- **Do** put a face beside every voice: the SC mark for the agent, a portrait for a person.
- **Do** take ink from the hue on a tinted ground (`gate-amber-ink` on amber-soft, `agent-green-deep` on green-soft).
- **Do** keep hit targets at 44px, inputs at 48px and phone body at 16px; design phone first and let the container queries at 760 and 1100 widen the layout.
- **Do** use the 1.75-stroke 24-grid inline SVG icon set, 22px in chrome and 18px inside buttons.

### Don't:
- **Don't** put a kicker, eyebrow or tracked uppercase label above a heading.
- **Don't** add coloured left borders or full tints to cards or alerts to signal state; use a chip, a border colour or the zone.
- **Don't** use purple for anything but ExpireSoon, or blue for anything but a push notification.
- **Don't** use grey text on a coloured ground.
- **Don't** open a modal where an inline state or a sheet will do; sheets rise on phones and slide in from the right elsewhere.
- **Don't** lift cards on hover or use hard offset shadows; the three soft ink shadows are the whole vocabulary.

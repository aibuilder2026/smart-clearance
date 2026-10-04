# @smart-clearance/core

Design system v3 in Svelte 5. It ports `design3/system` (the hosted DS v3 page): the tokens and the component CSS
unchanged, and the kit's components with the same names, props, DOM and class names, so `components.css` applies as it
does in the prototype. The apps consume it as source; there is no build step.

```svelte
<script lang="ts">
	import { AppRoot, Button, Sheet, ThemeProvider } from '@smart-clearance/core';
	let open = $state(false);
</script>

<ThemeProvider>
	<AppRoot>
		<Button variant="primary" onclick={() => (open = true)}>Approve</Button>
		<Sheet bind:open title="Approve the plan">…</Sheet>
	</AppRoot>
</ThemeProvider>
```

Import the styles once, in the app's stylesheet, in the order `frontend/README.md` gives (see "The cascade").

## What is here

| Path                                                  | What                                                                                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/styles/tokens.css`, `base.css`, `components.css` | design3/system's CSS, verbatim apart from marked `@port` blocks                                                                                                    |
| `src/styles/fonts.css`                                | the four families from Fontsource, and the type tokens with their names                                                                                            |
| `src/styles/tailwind.css`                             | Tailwind 4 over the tokens: colours, radii and type sizes as utilities, `dark:` on `[data-theme="dark"]`, `phone:`, `tablet-up:` and `desktop:` on the app's width |
| `src/lib/`                                            | the components, `fmt`, the theme and app state, motion, icons, images                                                                                              |
| `src/lib/coverage.ts`                                 | every piece of the prototype's kit, built here or planned with the port that brings it                                                                             |

## From the kit (React) to Svelte

| Kit                                              | Here                                                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `className`                                      | `class`                                                                                            |
| `children`                                       | the default snippet                                                                                |
| a node prop (`footer`, `title`, `right`)         | a snippet prop (`{#snippet footer()}…{/snippet}`), or a string                                     |
| `open` + `onClose`                               | `bind:open`, plus `onclose` when the parent must know the reader closed it                         |
| `value` + `onChange`                             | `bind:value` (or `bind:checked`), plus `onchange`                                                  |
| `onClick`                                        | `onclick`                                                                                          |
| `useTheme()`                                     | `useTheme()`: a `Theme` with `mode`, `resolved` and `setMode`                                      |
| `useApp()`                                       | `useApp()`: an `AppState` with `w`, `h`, `bp`, `overlays`, `mounted`, `embedded`                   |
| `Menu open onClose items` beside its own trigger | `Menu bind:open items` with a `trigger` snippet that spreads the props it is given onto the button |
| `Icon name="search"`                             | the same; names are typed (`IconName`)                                                             |

A `MenuItem` can carry an `href`: it renders as a link, in a new tab for another site.

## Components

**Built:** `AppRoot`, `ThemeProvider`, `Icon`, `Spinner`, `Button` (with `href` it is a link), `IconButton`, `Badge`, `Chip`,
`Kbd`, `Card`, `List`, `ListRow`, `Field`, `Input`, `Select`, `Textarea`, `SearchField`, `Segmented`, `Tabs`, `Switch`,
`Stepper`, `OTP`, `Check`, `Sheet`, `Menu`, `ModeMenuButton`, `Money`, `Roll`, `DaysNum`, `GateChips`, `Aura`, `Avatar`,
`Product`, `Mark`, `Wordmark`, `WorkspaceMark`, `PoweredBy`, `WindowFrame`, `Splash`, and the `FindWorkspace` pattern.

**Planned** (`coverage.ts` says with which port): tables, tiles and feedback states, alerts and pushes, the shell and
page, and code blocks with the console; the tracker family, the agent feed, the maps, the charts (on LayerChart) and the
money panels with the workspace app; the device frames with the guided demo.

## Behaviour the kit defines, and how it is kept

- **Sheet** (bits-ui Dialog): portals into the app's overlay layer; the panel takes focus when it opens; Tab stays inside;
  Escape, Close or the scrim closes it and focus returns to what opened it. A bottom sheet has medium and large detents
  and follows a drag, closing when flung or pulled most of the way down. A body that scrolls becomes a focusable region.
  Spring 420/40/0.9 in and out; the scrim fades over 200 ms.
- **Menu** (bits-ui DropdownMenu, the WAI-ARIA menu-button pattern): focus goes to the checked item or the first; the
  arrows wrap, with Home and End; Escape closes and returns focus to the button; Tab closes and moves on from the button.
  It is drawn under its button by the kit's `.menu` CSS, not positioned by script.
- **Field** wires `aria-describedby` to its error or help and `aria-invalid` when it has an error; `Input`, `Select` and
  `Textarea` read it.
- **Money** says the figure once, in hidden text, and draws the rupee sign, digits and paise silently.
- **Theme:** `ThemeProvider` keeps `<html data-theme>` in step with the reader's choice (`sc3-theme` in localStorage);
  the app's `app.html` sets it before the first paint.
- **AppRoot** with `scroll="window"` lets the page scroll the window and adds a fixed overlay layer (`.app-overlays`),
  which is also a query container named `app`. With the default `scroll="app"` the root fills its parent, as in the
  prototype.
- **Hydration:** anything that depends on the browser (the reader's theme, the width, reduced motion) either comes from
  CSS (`.desk-only`, `.when-dark`) or waits for `app.mounted`, so a prerendered page and its hydrated self agree.
- **Motion:** `SPRINGS`, `DURATION` and `EASE` are the kit's; `springCurve()` samples motion's spring generator for
  Svelte transitions (an outro runs the same spring back). Under reduced motion every transition lasts 0 ms, since Web
  Animations ignore base.css's kill switch. Nothing loops.

## Ported CSS

The three stylesheets equal design3's, checked by `tests/drift.test.ts`, except inside `/* @port … @port-end */` blocks:

- `tokens.css`: the Google Fonts `@import` is gone; `fonts.css` serves the same families.
- `components.css`, the adapters at the end:
  - `.app-window` and `.app-overlays` for window-scrolling pages;
  - `.when-light` and `.when-dark`, an icon for each appearance;
  - `.menu a.mi`, for a menu item that is a link.

To take a change from design3: copy the file over, put the marked blocks back, and run the tests.

## Icons and images

`src/lib/icons/registry.ts` is generated (`corepack pnpm icons`): every name `design3/system/icons.js` uses, in its order,
drawn from the installed `@lucide/svelte` (following Lucide's renames, such as trash-2 to trash). The Google mark keeps
the prototype's drawing. `imgUrl()` resolves a design-system image ("pack-chips.webp", "people/p-priya.webp", or a seed
key "sc3img:/…") to its hashed URL; the files stay in `design3/system/img`.

## Tests

`corepack pnpm test` here runs:

- `fmt` against `money.js`;
- CSS drift;
- coverage of the kit;
- the icon registry;
- component contracts (Money's spoken figure, Field's wiring, Button and Icon).

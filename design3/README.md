# Smart-Clearance design v3

One visual system, built from the same code into the product's pages:

| Folder | What it is | Entry page |
| --- | --- | --- |
| `system/` | Design system: tokens, the HIG/shadcn kit, the live-tracking world, imagery | `system/Smart-Clearance DS v3.html` |
| `demo/` | Guided demo: the nine journey stages as beats in Munchly's workspace, on a laptop and a phone running the real screens | `demo/Smart-Clearance demo v3.html` |
| `app/` | App prototype: Munchly's workspace at munchly.smartclearance.com, with its sign-in, every role, live agents on a mock backend; an installable PWA | `app/Smart-Clearance app v3.html` |
| `console/` | The console at console.smartclearance.com, where Smart-Clearance staff set up each client's workspace: its agents, supply chain, channels, rules, people, integrations and plan. Seeded with Munchly Foods; its own mock backend is `core/platform.js` | `console/Smart-Clearance console v3.html` |
| `site/` | The product's landing page at smartclearance.com: a miniature Indian town by day and by night, one batch's five exits, the nine stops, Munchly's story, the workspace and the plans. Its illustrations ship in `site/assets/plates/` | `site/Smart-Clearance site v3.html` |

Shared code lives in `core/` (money computed from the journey map's rules, the fictional dataset, the store, the journey as actions with an agent reconciler) and `screens/` (every role's screens and the workspace sign-in, used by both the demo and the app). `demo/`, `app/`, `console/` and `site/` reach them through symlinks.

## One workspace per manufacturer

Smart-Clearance is sold to manufacturers as software as a service: each one gets a workspace at its own address, set up for its supply chain. This prototype is Munchly Foods' workspace at `munchly.smartclearance.com`, set up in `core/data.js` (`WORKSPACE`): who owns short-dated stock, the expiry policy, the exits, the territory guard and how people sign in.

- **Branding.** The Smart-Clearance mark and theming lead every screen, and Munchly's workspace sits under the mark. On desktop it is a pill under the sidebar lockup; on the tablet rail it is the mark; on phones it is a button at the left of the bar. Munchly's own colours stay inside its mark. Munchly leads its own sign-in page, with "Powered by Smart-Clearance" at the foot.
- **Sign-in, email or phone first.**
  - A `munchly.in` address goes to Munchly's Google Workspace.
  - A mobile number that Munchly or a distributor invited gets a one-time code (`246810` in the prototype).
  - A first-time invitee joins the workspace; try `+91 98230 60013`.
  - An ExpireSoon buyer is told he is outside the workspace.
  - Anyone else is offered "Find your workspace".
  - "Explore as someone in the story" skips straight to a person.
- **The admin's Workspace screen** shows the sign-in methods, the supply-chain profile as set up for Munchly, the distributors and the branding.

## The console (SC-25)

The console is the platform's own surface, separate from every client workspace.

- **Sign-in.** Staff only: a smartclearance.com Google account, then a passkey. Try "Use a passkey" as Neha Kulkarni.
- **A client's agents** are laid out as the stops they work, from Data to Impact. Each one is Suggest, Ask or Act, with its limits, schedule and last run in an inspector. The human approval between Router and Lister is a locked amber gate for every client.
- **A new client** is set up in seven steps from its supply-chain profile (route to market, who owns the stock, expiry policy). The profile decides its exits, and a preset decides how far its agents go at first.
- **Every change** persists in the browser (`sc3-platform`) and writes an audit line. "Reset prototype data" in the account sheet goes back to the seed. The console keeps its own copy of Munchly's setup; the app does not read it yet.
- **Demo requests** from the landing page appear in Overview. "Set up" starts the new-client steps with the company, the contact and the plan filled in.

## The landing page (SC-25)

smartclearance.com sells Smart-Clearance itself, independent of any client. Munchly Foods is its one customer story.

- **The first viewport** follows the approved comp box for box at 1280 × 800, scaled with the page in container units. The town is composed twice: by day, and at night in dark mode. The tracker card fills its nine stops once.
- **Five exits, one batch.** On desktops the street pans as the page scrolls and holds on each exit with its figures. On tablets and phones you swipe along it and tap an exit. With reduced motion it stays still.
- **Book a demo**, and each plan's "Talk to us", saves a request in the browser store (`sc3-platform`); the console lists it. Nothing is sent anywhere.
- **Every figure** comes from `core/money.js` through `core/data.js`. The illustrations carry `.prompt.json` sidecars; their PNG originals stay local in `site/assets/plates/src/`.

## Run it locally

```sh
python3 -m http.server 8787 --directory design3
```

Then open `http://127.0.0.1:8787/demo/Smart-Clearance%20demo%20v3.html`, `/app/Smart-Clearance%20app%20v3.html`, `/site/Smart-Clearance%20site%20v3.html`, `/console/Smart-Clearance%20console%20v3.html` or `/system/Smart-Clearance%20DS%20v3.html`. Images load from `system/img/` and `site/assets/plates/` locally.

## Build

- `./build.sh` compiles every `.jsx` to the `.js` beside it (esbuild, React.createElement, ES2019), so pages load without Babel. Edit the `.jsx`; never the `.js`.
- `./dist.sh` bundles and minifies the hosted build into `dist/` (kit and data, role screens, one stylesheet, each page's own files).

## Hosted copies

The Claude Design projects hold the pages: one each for the design system, the demo and the app, and one for the platform pages (the landing page and the console, which link to each other). Each page loads `dist/` from jsDelivr and images from GitHub raw, both pinned to the commit the page names, so a hosted page always matches a pushed commit. To publish a new version: run `./dist.sh`, commit and push, then point the pages at the new commit.

## Demo controls

Arrow keys or the Next button step through beats; keys 1 to 9 jump to a stage; P toggles phone-only; N toggles the notes; the play button runs the demo on its own. On a real phone the demo opens full screen with a slim stage bar.

## Data

Munchly Foods, Glowra, ExpireSoon and every person are fictional. Figures come from `docs/dobara-journey-map.html` (Journey Map v4.1) and are computed in `core/money.js`. The story follows the same figures (`docs/smart-clearance-story.html`, v6). The quarter's totals are the walkthrough's; its weekly split is illustrative, and week 1 is the demo batch. Every raster carries its generation prompt or origin (`system/img/manifest.json` and the `.prompt.json` sidecars).

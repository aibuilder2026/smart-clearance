# Smart-Clearance design v3

One visual system, built three ways from the same code:

| Folder | What it is | Entry page |
| --- | --- | --- |
| `system/` | Design system: tokens, the HIG/shadcn kit, the live-tracking world, imagery | `system/Smart-Clearance DS v3.html` |
| `demo/` | Guided demo: the nine journey stages as beats, on a laptop and a phone running the real screens | `demo/Smart-Clearance demo v3.html` |
| `app/` | App prototype: sign-in, every role, live agents on a mock backend, installable PWA | `app/Smart-Clearance app v3.html` |

Shared code lives in `core/` (money computed from the journey map's rules, the fictional dataset, the store, the journey as actions with an agent reconciler) and `screens/` (every role's screens, used by both the demo and the app). `demo/`, `app/` and `system/` reach them through symlinks.

## Run it locally

```sh
python3 -m http.server 8787 --directory design3
```

Then open `http://127.0.0.1:8787/demo/Smart-Clearance%20demo%20v3.html`, `/app/Smart-Clearance%20app%20v3.html` or `/system/Smart-Clearance%20DS%20v3.html`. Images load from `system/img/` locally.

## Build

- `./build.sh` compiles every `.jsx` to the `.js` beside it (esbuild, React.createElement, ES2019), so pages load without Babel. Edit the `.jsx`; never the `.js`.
- `./dist.sh` bundles and minifies the hosted build into `dist/` (kit and data, role screens, one stylesheet, each page's own files).

## Hosted copies

The Claude Design projects hold the three pages. Each page loads `dist/` from jsDelivr and images from GitHub raw, both pinned to the commit the page names, so a hosted page always matches a pushed commit. To publish a new version: run `./dist.sh`, commit and push, then point the pages at the new commit.

## Demo controls

Arrow keys or the Next button step through beats; keys 1 to 9 jump to a stage; P toggles phone-only; N toggles the notes; the play button runs the demo on its own. On a real phone the demo opens full screen with a slim stage bar.

## Data

Munchly Foods, Glowra, ExpireSoon and every person are fictional. Figures come from `docs/dobara-journey-map.html` and are computed in `core/money.js`; the quarter's totals are the walkthrough's and its weekly split is illustrative. Every raster carries its generation prompt or origin (`system/img/manifest.json` and the `.prompt.json` sidecars).

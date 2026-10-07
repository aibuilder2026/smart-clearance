# @smart-clearance/workspace

A manufacturer's workspace, in SvelteKit 3: Munchly Foods' at munchly.smartclearance.com, where its staff, its
distributors and kiranas, its food-bank partners and an ExpireSoon buyer each work the near-expiry batch from their own
side (SC-62). It is a faithful port of `design3/app` and `design3/screens` (the approved app v3 design, hosted in the
app v3 Claude Design project), so it had no design round.

This app is a thin host. The workspace itself, every screen and the stub it runs on, lives in core
(`@smart-clearance/core/workspace`, `../core/src/lib/workspace/`), where the guided demo's port can use the same
screens, as design3's demo and app share `design3/screens`.

```sh
cd frontend
corepack pnpm dev:workspace        # http://localhost:5175
corepack pnpm build:workspace      # the static app, into workspace/build/
corepack pnpm preview:workspace    # serves the build on :4177
```

It is live at https://munchly-smartclearance.web.app, its own Firebase Hosting site (`workspace` in
`../firebase.json`, `munchly-smartclearance` in `infra/prod/terraform.tfvars`): `infra/scripts/deploy.sh workspace`
releases it from a workstation, and CI releases it with the other apps on every merge to `main`. Each browser keeps its
own journey there, as the prototype does.

Sign in as anyone in the story: "Explore as someone in the story", or one of the accounts under the form (Priya by
email; Rakesh bhai or Ganesh ji by phone, with the code `246810`; Shree Sai Kirana as a first-time invitee). Profile →
Switch person moves between them, and Reset demo data puts the batch back at the start.

## Routes

The prototype keeps its screen in the hash (`#/command`); the app keeps it in the path, one segment
(`src/routes/[[screen]]`), so every screen has a real address. `/` is the sign-in, or the person's home once they are in.
A screen the person's role cannot open falls back to their home.

| Role                                       | Screens                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| Supply-chain operator (Priya)              | `/command`, `/route`, `/execution`, `/batches`, `/setup`, `/report`, `/paperwork` |
| Distributor (Rakesh bhai)                  | `/home`, `/photo`, `/van`, `/orders`                                              |
| Kirana retailer (Ganesh ji)                | `/home`, `/offer`, `/orders`                                                      |
| Marketplace buyer (Agrawal ji, ExpireSoon) | `/market`, `/listing`, `/bids`                                                    |
| Finance & GST (Anita)                      | `/paperwork`, `/report`, `/batches`                                               |
| Sustainability & BRSR (Vikram)             | `/report`, `/paperwork`, `/batches`                                               |
| Food-bank partner (Meera)                  | `/pickups`                                                                        |
| Workspace admin (Arjun)                    | `/workspace`, `/users`, `/rules`, `/integrations`, `/audit`                       |
| Everyone                                   | `/inbox`, `/profile`                                                              |

## How it is built

- **Client-side only.** The root layout sets `ssr = false`: the workspace is behind a sign-in. `adapter-static` writes the
  app and its `index.html` fallback; a host must rewrite every path to it.
- **The shell** is core's `Shell` with each role's navigation (`NAV` in `core/src/lib/workspace/model.ts`); the screens
  scroll inside `#main`, and each new one rises into place and starts at its top.
- **Stub data, as in the prototype.** There is no backend for the workspace yet. `core/src/lib/workspace/store.svelte.ts`
  is the prototype's store (`design3/core/store.js`, which stands in for Firestore), persisted per browser
  (`sc3-store`), and `flow.ts` is its journey: the actions, and the agents that chain them live while the app is open,
  with partners the person is not playing answering by themselves. Both run on a seed written from design3 by
  `corepack pnpm seed` (`core/src/lib/workspace/seed/`), so every figure is still worked out by `money.js`. A test runs
  design3's own `flow.js` beside the port and checks they leave the store the same at every stage
  (`core/tests/workspace.test.ts`).
- **Where backend-api plugs in:** the screens only read `store.state` and change it through `act()` or `store.update()`.
  Replacing the store's reads and the actions with API calls (and the agents with the real ones) leaves the screens as
  they are.
- **The session** (`sc3-session`), the splash once a session (`sc3-app-splash`), the theme (`sc3-theme`) and the hero's
  paused animation (`sc3-hero-paused`) keep the prototype's storage keys.

## The browser suites (SC-65)

Run only when asked (the `browser-suites` skill), each on the app's build, the journey put at a stage by running
design3's own core scripts (`tests/e2e/workspace.ts`):

- **`test:a11y`**: every person's every screen with the batch cleared; the sign-in and each of its sheets; the splash,
  a banner, the workspace and switch-person sheets, a toast; the users menu and sheets; Route Room, the approval,
  Execution, Paperwork and the camera at the stages they belong to; in five viewport and theme projects. The sign-in,
  the code's first box, the sheets and the users menu by keyboard; nothing looping. Then the coverage check, which
  follows the workspace screens into core.
- **`test:e2e`**: Priya's journey from a wrong email to execution; a phone sign-in with a wrong code; a first-time
  invitee joining; a bid, the counter and the award; switching person; the shell, back and forward; Reset demo data.
  Firefox and WebKit smoke runs.
- **`test:parity`**: 27 screens and the sign-in against `design3/app` in five projects.

## Not yet

- Not installable: the prototype's manifest and offline service worker (`design3/app/manifest.webmanifest`, `sw.js`)
  are not ported. The Install buttons appear only when the browser offers an install.

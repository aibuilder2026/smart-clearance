# SC-237 · The hero film: chapter 3's vanishing packet, and the real Command Center in chapter 4

## The request (16 Oct 2026)

The maintainer, on the landing page's hero film (SC-154, `design3/site/assets/media/one-journey.mp4`):

> The third scenes seems a bit hallucinated, where the person takes a packet of chips and its just dissapears. Can you
> please check and fix it.
>
> Also the fourth scene where they are looking at the computer, I want them to see actual command center UI of our app

Asked whether to retake chapter 3 on Veo 3.1 (up to $4.80), the maintainer first said yes, then: "Do everything with
local tools". Nothing in this change called a paid model: the spend is $0.

No design round: chapter 3 is a bug with one fix, and chapter 4's change was named outright (as SC-165 and SC-216).

## Chapter 3, the yard at dusk

**Found** (`stills/ch3-packet-vanishes.webp`, `stills/ch3-clipboard-appears.webp`): Veo's take
(`SC-154/media/final-3-yard-dusk-v2.mp4`) breaks continuity throughout, not only once:

- 1.50–1.62 s: the orange packet the distributor holds out melts into his clipboard while the worker's hand is still
  reaching for it; the worker turns away with nothing (the one the maintainer saw);
- 4.62 s on: a clipboard appears in the next worker's hand, and the green packet is held by both men for a second;
- later: a packet floats over the table.

The film used 0.3–4.6 s, so it showed the first.

**The fix,** with local tools only: the chapter is cut to the take's clean seconds, **1.65–4.58 s** (was 0.3–4.6), checked
frame by frame on both halves of the frame (the van and the table): the worker walks away from the table, the next two
step up, the distributor ticks his clipboard and lifts the next packet as the chapter dissolves out. The van side has
the volunteer and the woman passing cartons and a worker crossing, with nothing appearing or vanishing. The
1.35 s the chapter loses goes to chapter 4, so the film stays 15.2 s and loops as before.

A Veo retake, or an LTX one on this Mac at 540p (visibly softer than the three Veo chapters around it), were the other
ways; the maintainer chose local tools, and the clean cut keeps the take's 1080p.

## Chapter 4, the office

**The Command Center,** the workspace app's own (`tools/capture.mjs`, `img/command-center.webp`): the workspace app's stub
build (`PUBLIC_API_BASE= corepack pnpm build:workspace`, served by `vite preview`), the supply chain operator signed in
with the story's journey at stage 8 (the batch settled, the papers drafted, Impact posting the ledger: the chapter's
"21:30 Paperwork"), at 1280 × 800 at 2x. The landing page names no client (AGENTS.md, SC-28), so before the shot the page
swaps, and keeps swapping as the app redraws: the client for "Your brand" (the landing page's own workspace section's
name and its green "Y" mark), the person for "You", the distributors, buyer and food bank for what they are, batch ids
for "Batch 117", the workspace address for `your-brand-smartclearance.web.app`, portraits for plain discs, and the
branded pack render for the landing page's unbranded one (`pack-snack-plain`). The rest is the screen as built: the
47 days left, ₹21,770 on plan, ₹26,340 better than destroying it, the nine stops, Agent activity, the Nagpur cluster.

**On the monitor** (`tools/screen.py`, `media/final-4-office-command-center.mp4`, the whole 8 s take):

- **Tracking:** the screen found in every frame (the pale and green pixels inside the black bezel, the component round
  the last frame's centre, its convex hull cut to four corners, each side refitted through its edge points). The left
  edge is never covered, so its corners are fitted over time (median residual 0.1–0.3 px); her hand covers the right edge
  for the first 64 frames, so each right corner is its left corner plus an offset fitted against its position on the
  clean frames, carried back (the raw detection strayed up to 12 px onto her hand there).
- **The screen's light:** the capture warped on in the glass's own white (measured on the frames the pen is away), its
  falloff across the glass (darker to the right and the foot), the desk lamp's warm reflection in its top-right corner as
  Veo lit the screen it drew, softened 0.4 px, with grain.
- **In front of the glass:** her pen (near black, though its hue reads green), fingers and sleeve stay in front: what is
  dark, skin or navy inside the screen and reaches in from beyond its edge. Nothing is held in front once her hand has
  gone (0 px of matte from frame 64), and the pen's motion blur as she lifts it reads as blur.
- The rectified original screen is 16:10, so the capture is too.

**The cut:** 0.3–5.97 s of the composite (was 0.3–4.6 s of Veo's take), so the Command Center is on screen for 5.4 s.

**Phones lean onto it:** a phone sees the middle quarter of the film's width, where chapter 4's subject point (the frame's
centre) left the monitor mostly out of view. The point moves to the monitor (`FILM.at[3]` x 0.42, design3 `site.jsx` and the
port's `media.ts`). On desktops the lean is at its limit either way, so nothing moves there.

## The film

`design3/site/assets/media/one-journey.mp4`, made by `design3/tools/vertex-media/assemble.py` as before (0.5 s dissolves,
the tail into the head, crf 27): 15.21 s, 6.16 MB (was 6.18). Chapter starts `[0, 3.55, 7.35, 9.78]` (were
`[0, 3.55, 7.35, 11.15]`), in design3 and the port. Its first frame is the same frame as before, so the posters stand;
its largest frame step (13.0, in the chapter 3 to 4 dissolve) and its loop seam (6.21) are where and what they were
(12.95 and 6.09). Its sidecar and cut record were regenerated (`sidecar.py`).

## Checks

- The frontend gate: lint, Prettier, svelte-check and tests (api 86, core 408, admin 22, console 2, demo 9, workspace 115).
  Prettier was run with the repository's `.gitignore` too: a local, git-ignored impeccable cache
  (`frontend/workspace/.impeccable/hook.cache.json`, 13 Oct) otherwise fails it.
- The landing page's build and design3's page, in headless Chromium at 1440 × 900 and 390 × 844 (`stills/build-*`):
  the film loads and plays, the strip reads 18:00 at 8.3 s and 21:30 at 11.5 s and 14.2 s, and no console errors.
- The browser suites were not run (SC-55).

## Hosting

design3's `dist/` is rebuilt. The hosted landing page on Claude Design stays on its pinned commit;
smartclearance.web.app takes the film with the merge to `main`.

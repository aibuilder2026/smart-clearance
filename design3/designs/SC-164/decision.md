# SC-164 · The demo film on the landing page

## The request (11 Oct 2026)

> I want to host the 1080p demo video in such a way so that I stictch that up in the landing/admin screen so that it
> plays when clicked... check https://www.spoileralert.com it has such a video too.. tell me my options with my google
> cloud ecosystem,

The film is SC-158's: `design3/designs/SC-158/media/mango-drink-demo.mp4`, 4 min 56 s, 1920 × 1080, H.264 at 1.8 Mbps,
68 MB, its index at the front. The 720p copy is 25 MB; the crf-18 master (134 MB) stays local in `SC-158/src/build/`.

## Hosting: the options given, and the answer

| Route | Cost (one full 1080p play) | For | Against |
| --- | --- | --- | --- |
| Firebase Hosting, in the landing page's build | 360 MB a day free (about five plays), then $0.15/GB, about 1p a play | no new infrastructure; it answers byte ranges (the live hero film returns 206 with `accept-ranges: bytes`) and caches at the edge for a year | 93 MB more in every CI build |
| A public Cloud Storage bucket (Terraform) | about $0.12/GiB, about 0.8p a play | one stable address for every surface; replaced without a deploy | a public resource; a plan to apply |
| Transcoder API to HLS, in that bucket | about $0.45 once ($0.015/min SD, $0.03/min HD, four renditions) | Wistia's adaptive streaming | a player script; more than a 1.8 Mbps film needs |
| YouTube, unlisted | free | adaptive streaming, captions, YouTube's own chapters | YouTube's player and branding; uploaded by hand |

Cloud CDN and Media CDN were not offered: Cloud CDN needs a load balancer (about $18 a month), and Firebase Hosting is
already on Google's CDN. Spoiler Alert's video is a Wistia embed, through Webflow's video element, in a section of its
own, played in place.

**The maintainer's answers (11 Oct):**

- **Host:** YouTube, unlisted. The maintainer uploads the crf-18 master with a client-neutral title; the chapters in
  `youtube-description.txt` go in its description.
- **SC-28:** the film plays only when Watch is pressed, under a client-neutral poster; the page's own text names no
  client, and AGENTS.md records the exception.
- **The guided demo:** the film first, the guided demo offered when it ends; the links read "Watch the 5-minute demo".

## Shared by every option

- The player is YouTube's on `youtube-nocookie.com`, created through the IFrame API only after the first click; until
  the upload's id is in, a 30 s cut of the film stands in (`media/stand-in.mp4`).
- The poster is the master's frame at 0.5 s (the bay at dawn, before the title card, which names Munchly Foods and the
  batch); a 208 px square of it is the pill's thumbnail (`img/`, with sidecars).
- The twelve chapters and the 40 captions come from SC-158's own timeline (`transcript.py` → `transcript.json`); the
  captions are read only when "Read the film instead" is opened.
- The end: "One batch, start to finish." with Try the guided demo, Book a demo and Watch again.

## The options

- **A, the theatre** (recommended): every Watch opens the film in a dialog over the page, the chapters as chips under
  it, the page held where it was.
- **B, a section of its own**: "See one batch, start to finish." after the statement, the poster large with the
  chapters beside it, played in place; the Watch links go there and start it.
- **C, in the hero**: the film takes over the first screen under the bar, its chapters in the hero's strip.

Board: `board.html`, published to platform v3 as `SC-164 design review.html`.

## The pick

Waiting for the maintainer.

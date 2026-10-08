# SC-80 · The label photo: take one, or upload one

## The request

The maintainer, 8 Oct 2026, looking at the distributor's label photo step on a laptop ("Fit one carton label in the
frame"):

> This should be modified... 1. Either take photo. 2. Upload an already taken photo

They also asked for a sample to upload. It is the story's clean label photo, from the Vision eval set
(`agents/evals/vision/images/story-clean.webp`), which Vision read exactly in both live eval runs. It is here as
`sample/label-photo.webp` with its sidecar, and was handed over as a phone-style JPEG, `label-MF-2409-117.jpg`
(1184 × 896).

## The step now (`current/`)

- A drawing of the label in a viewfinder frame, a shutter, and a 30 px gallery icon with no words (`.iconbtn.round`,
  under the 44 px rule).
- On the live workspace (SC-73) the shutter opens the phone's camera (`capture="environment"`) on a touch screen and
  the file picker on a laptop. Nothing on the screen says either, and on a laptop the frame looks like a camera that
  is on.
- backend-api takes a JPEG, PNG or WebP image under 8 MB (`steps.photo_upload`).

## How the options were made

- **Context:**
  - `PRODUCT.md`: Rakesh runs the godown from his phone, and the label photo is the source of truth.
  - `DESIGN.md`: the camera's 28 px corners and shadow-2; the scanline as the only glow.
  - The app's surface brief, `.impeccable/surfaces/design3.md`.
  - SC-68 and SC-73: Send fills as the photo goes.
  - ui-ux-pro-max's UX rules:
    - a single-pointer alternative to dragging (WCAG 2.5.7);
    - 44 px targets;
    - errors announced.
- **The mockup is the app itself.**
  - `camera/sc80.jsx` replaces `SC3_SCREENS.CameraScreen` in the live app (SC-68's `?state=upload-photo` moment, before a photo).
  - `?opt=a|b|c` picks the option, and `?moment=` the moment.
  - `./build.sh` compiles it.
  - The laptop's camera is simulated with the sample photo. On a phone, the drawn label stands in for the camera.
- **The stills:** `shoot.mjs` takes them from the worktree's design3 server (8788), in light and dark at 1440 and 390, plus 820 for B.
- **No imagery** was generated.

## The options (board `board.html`, app v3)

- **A · Two ways under the frame (recommended).**
  - The frame stays as the guide, marked Example and captioned "Like this: one carton label, close up".
  - Under it are Take a photo and Upload a photo, as two large buttons. The primary follows the device: Take on a phone, Upload on a laptop.
  - On a laptop, Take a photo opens its camera in the frame, landscape, with Cancel, the shutter and Upload.
  - A photo can be dropped on the frame.
- **B · Choose first.**
  - A card says what Vision needs, with the label as an example.
  - Two row-sized choices follow: Take a photo and Upload a photo.
  - The photo then shows on its own, with a check of what must be readable, before Send photo.
- **C · The real viewfinder.**
  - The camera opens in the frame as the step opens: the phone's rear camera, or a laptop's in landscape.
  - Upload sits beside the shutter, labelled.
  - A refused camera says so in the frame and offers Upload.

**Shared by all three:**
- Both ways are named, and every target is at least 44 px.
- What is sent is said once: JPEG, PNG or WebP, under 8 MB. `accept` names those types, so an iPhone hands over its HEIC photos as JPEG.
- A photo in hand is shown whole, in its own shape.
- Send, its progress and Vision's read are unchanged.
- The stub and the guided demo keep a simulated photo.
- Motion: the photo fades in (240 ms) and the buttons swap (160 ms), on `cubic-bezier(0.22, 1, 0.36, 1)`. Under reduced motion both land at once.

## Open question on the board

On a laptop, should Take a photo open the laptop's camera (A and C as drawn), or should laptops offer Upload only?

## The pick

Waiting for the maintainer.

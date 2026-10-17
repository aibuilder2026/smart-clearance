# SC-243 · The hero film's 4th scene: Veo's own screen again

## The request (17 Oct 2026)

The maintainer, on the landing page's hero film (`design3/site/assets/media/one-journey.mp4`): "the hero image 4th
scene, where computer screen is focussed, the image seem jittery, replace it with … a different one which is not
jittery and looks sharp and simple like before".

SC-237 had set the workspace app's real Command Center into the office monitor, tracked frame by frame. At the hero's
size, under the page's lean, its fine text shimmered and the screen read as unsteady.

Asked whether to go back to the screen as Veo filmed it, or keep the app as a single simplified card, the maintainer
picked **Veo's own dashboard**.

## The change

Chapter 4 is SC-154's `final-4-office-dashboard.mp4`, the same take SC-237 composited onto, over the same span
(0.3 to 5.97 s): the plain green-and-white dashboard Veo drew, moving with the camera's own push, so nothing can slip on
the glass. Everything else is as SC-237 left it: chapter 3's clean cut, the chapter starts `[0, 3.55, 7.35, 9.78]`, the
lean onto the monitor on phones, the loop.

`one-journey.mp4` was made again by `design3/tools/vertex-media/assemble.py` (0.5 s dissolves, the tail into the head,
crf 27): 15.21 s, 6.00 MB (was 6.16), joins at `[3.8, 7.6, 10.03]` as before. Its first frame is the same frame, byte
for byte, so the posters stand. Its cut record and sidecar were regenerated (`sidecar.py`). The port imports the film
from design3 in place, so `frontend/` is unchanged. Nothing was spent.

`stills/ch4-before-after-12.0.webp`: the monitor at 12.0 s, SC-237's on the left, this one on the right.

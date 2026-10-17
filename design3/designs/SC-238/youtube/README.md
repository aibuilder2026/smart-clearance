# The landing film v3 on YouTube (SC-242)

YouTube cannot replace the file of an existing video, so the landing film v3 went up as a new unlisted video and the
landing page's theatre is pointed at it. SC-211's sales film (youtu.be/DT_4G2txLF4) stays on YouTube as it was.

The film is [youtu.be/XacZtguT8Xg](https://youtu.be/XacZtguT8Xg): "Smart-Clearance: the 8-minute demo", unlisted on
the maintainer's channel (@arundutta3411). YouTube shows it as 7:51.

**How it went up (17 Oct 2026, through Claude in Chrome):**

1. The pass 12 master, `landing-demo/sales-film/smart-clearance-sales-film-v3-2026-10-17_19-31-37.mp4` (1080p, 25 fps,
   crf 17, AAC 320 kb/s, 343 MB), served on 127.0.0.1 by a small CORS file server; Studio's own page fetched it and set
   it on its upload input, since the browser tools have no file picker and cap uploads at 10 MB.
2. Title `Smart-Clearance: the 8-minute demo`. The description is `youtube-description.txt`; its nine timestamps are
   YouTube's chapters.
3. Not made for kids. Altered or synthetic content: yes (the people and scenes are AI-generated). Embedding allowed.
   Visibility Unlisted.
4. Subtitles, English (India): `captions.srt`, the film's own captions (64 cues, a dash before each line a person says).

`transcript.json` holds the same chapters and lines the landing page's theatre reads
(`design3/site/assets/media/demo-film.json`). `src/transcript12.py` writes all four files from the film's own timeline:
its scenes (`film/src/film.json`) and the captions `mix.py` writes from the placed lines.

# The sales film v2 on YouTube (SC-216)

YouTube cannot replace the file of an existing video, so the sales film went up as a new unlisted video and the
landing page's theatre is pointed at it. SC-187's cut 3 (youtu.be/5Z9-32Fuwh4) stays on YouTube as it was.

The film is [youtu.be/DT_4G2txLF4](https://youtu.be/DT_4G2txLF4): "Smart-Clearance: the 7-minute demo", unlisted on
the maintainer's channel (@arundutta3411). YouTube shows it as 6:51.

**How it went up (15 Oct 2026, through Claude in Chrome, with no hand from the maintainer):**

1. `src/build/smart-clearance-sales-film-v2-youtube.mp4` (1080p, crf 18, high profile, a GOP of 2 s, AAC at 48 kHz,
   410 MB; `src/export11.sh`), served on 127.0.0.1 by `design3/designs/SC-187/youtube/serve.py`. Studio's own page
   fetched it and set it on its upload input, since the browser tools have no file picker and cap uploads at 10 MB.
2. Title `Smart-Clearance: the 7-minute demo`. The description is `youtube-description.txt`; its 13 timestamps are
   YouTube's chapters.
3. Not made for kids. Altered or synthetic content: yes (the people and scenes are AI-generated). Embedding allowed.
   Visibility Unlisted.
4. Subtitles, English (India): `captions.srt`, the film's own captions (48 cues, a dash before each line a person
   speaks to the camera).

Checked afterwards: YouTube's oEmbed answers 200 with the title and the channel, so the video is public to anyone with
the link and can be embedded.

`transcript.json` holds the same chapters and lines the landing page's theatre reads
(`design3/site/assets/media/demo-film.json`). `src/transcript11.py` writes all four files from the film's own timeline:
the cuts `shots11.build()` lays out, and the captions `mix11.py` writes from the placed lines.

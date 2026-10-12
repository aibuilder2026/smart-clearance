# The demo film on YouTube (cut 3)

YouTube cannot replace the file of an existing video, so cut 3 goes up as a new unlisted video and the landing page is
pointed at it; the old one (youtu.be/EWFLqM3oHYU, cut 1's film from SC-158) can then be set to private.

**To upload (YouTube Studio, the maintainer's channel @arundutta3411):**

1. Drag `src/build3/master-cut3-crf18.mp4` (the 1080p master, 152 MB; YouTube re-encodes it) into YouTube Studio.
   `media/smart-clearance-demo.mp4` (79 MB) is the same film at a lighter bitrate if the master is not to hand.
2. Title: `Smart-Clearance: the 6-minute demo`.
3. Description: the contents of `youtube-description.txt` (its timestamps become YouTube's chapters).
4. Subtitles: upload `captions.srt` (English), the narration as closed captions.
5. Settings as before: not made for kids; altered or synthetic content: yes (AI-generated people and scenes); embedding
   allowed; visibility Unlisted.
6. Once it is live, give the 11-character video id (the part after `youtu.be/`); the landing page's default
   (`frontend/admin/src/env.ts`, `PUBLIC_DEMO_FILM`), design3's `DEMO_FILM.youtube` and DEMO.md take it.

`transcript.json` is the same chapters and lines the landing page's theatre reads (`design3/site/assets/media/demo-film.json`),
all three written by `src/transcript3.py` from the cut's own timeline.

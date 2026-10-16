# SC-219 cut 12's concept round, in Remotion

Three treatments of the working demo's architecture scene, each a motion test on the scene's first two lines (0 to
9.9 s, with the real voice and the film's own sounds), and stills of their later beats:

- `A-DataHall` (`src/a/`): a real camera through a data centre, the stack tracked onto its racks;
- `B-Blueprint` (`src/b/`): the data centre as an isometric floor plan, built and lit in motion;
- `C-InsideMachine` (`src/c/`): a macro product film with large type;
- `A-still-*`, `B-still-*`, `C-still-*`: the later beats.

`src/lib/base.tsx` holds what they share (the narration's cues, the film's fonts and inks, cut 10's notes, the act's
title, the stack's index); `src/lib/track.tsx` lays a graphic onto a camera move from `track12c.py`'s matrices.

```sh
../prep12c.sh                         # the media in public/ (fonts, screens, voice, sounds, plates, clips, tracks)
npm i
npx remotion studio                   # preview
npx remotion render src/index.ts A-DataHall ../build/remo12/out/a-motion.mp4 --codec=h264 --crf=18
npx remotion still src/index.ts B-still-agents ../build/remo12/B-still-agents.jpg --image-format=jpeg
```

The board is `../../round-cut12/board.html`; `../board12c.py` writes its media from the renders.

# SC-200 · The E2E film

A demo film of at most 230 seconds cut from the three production recordings of 12 Oct 2026, with a voice-over: the
problem, Smart-Clearance as software as a service (admin and the console), then Munchly's Mango Drink on the happy
path and the Masala Chips on the sad path, end to end.

## The brief (12 Oct 2026)

- Combine the three recordings into "a really creative demo video of maximum 230 seconds".
- A pleasant, human-like voice-over; context and an introduction to the problem; other images where they help.
- Zoom-in and scroll effects; pleasant, surreal, full animation, professional.
- Order: admin and the console (SaaS), then Munchly Mango Drink's happy path, then Munchly Chips' sad path.
- Tools, as the maintainer then set them: **only Qwen, LTX 2.5 and ffmpeg**, and **the best free approach for the
  voice**. No paid Google model was called.

## The sources

| Recording | Run | What it holds |
| --- | --- | --- |
| `admin-console-tour-prod-2026-10-12.mp4` (64.6 s) | SC-199, `runs/2026-10-12-prod-admin-tour/` | the landing page, the console's sign-in with its live agent network, the Overview, Kaveri Foods' agents configured |
| `munchly-mango-e2e-prod-2026-10-12.mp4` (13 min 35 s) | SC-190, `runs/2026-10-12-prod-mango/` | the Mango Drink with Lakshmi Agencies, on three screens, on production |
| `munchly-chips-sad-path-e2e-prod-2026-10-12.mp4` (14 min 46 s) | SC-188, `runs/2026-10-12-prod-sad/` | the Masala Chips with Rakesh Traders: 2 kiranas buy, 540 packets destroyed at the godown against evidence and a second yes |

The 2560 × 1440 originals are used (the 1080p copies are too soft to zoom into). The device screens on the stage were
measured (`film.py` `DEV`) and each shot crops only the screens it needs, so the stage's own header, narrator panel and
captions never appear. Every moment was picked from contact sheets of the runs (`grab.py`), and every window was
checked for stage notes cut at a device's edge (`cropsheet.py`); four windows moved because of it.

## How it is made

| Part | Tool | Where |
| --- | --- | --- |
| Keyframes: an hourglass of snack packets, blank pages drifting down a godown aisle, the landfill, the town and its agents' network at dawn and at sunrise, the Mango Drink over a Hyderabad bazaar, the chips beside a spent hourglass, and the console's paper hills | Qwen-Image 2.1 (bf16, local), ~1 MP 16:9; the two product frames as edits of `system/img/pack-mango.webp` and `pack-chips.webp`, then widened to 16:9 by a second edit | `img/*.webp` with `.prompt.json`; `src/gen-qwen.sh`, `src/gen-qwen2.sh`, `src/prompts/` |
| Seven clips from those keyframes, slow camera moves | LTX 2.5 Fast (local, LTX Desktop), 720p, 6 or 8 s, no audio | `media/l*.mp4` with `.prompt.json`; `src/gen-ltx.py` |
| The voice-over | Kokoro-82M (Apache-2.0, local, free), voice `af_heart` at 0.94; names given phonemes where the model misread them (Rakesh, Priya) | `src/lines.json`, `src/tts/vo.py` |
| The titles, chapters, name tags, headlines, figure callouts, the close and the end card; the brand mark drawn from `system/img/icon.svg`'s geometry, its route drawing itself | Pillow on design system v3 (Bricolage Grotesque, Geist; the tokens' greens and amber), transparent PNGs | `src/overlays.py` |
| The timeline, laid on the voice | each line starts where the one before ended plus its gap; each shot is anchored to the line it shows | `src/film.py` → `src/film.json` |
| The cut | ffmpeg: the clips retimed (motion-interpolated when slowed), graded, with grain; the recordings as floating screens (rounded corners, a shadow, a rim) over the section's blurred plate and drifting dust, a camera inside each screen that zooms and pans to what the voice names; dissolves between shots | `src/assemble.py` |
| The sound | the voice through one ffmpeg chain (high-pass, warmth, presence, gentle compression, a faint short room); SC-187's felt-piano bed and its lift (Lyria 2 clips already in `../SC-187/media/`, reused: nothing new was generated), looped through equal-power crossfades and ducked under the voice; whooshes made from filtered noise at the chapter changes; two-pass loudnorm to −14 LUFS | `src/mix.py` |

## The voice: the best free approach

No paid model, so the candidates were open-weights models run on this Mac, judged without ears by two free, local
measures: **UTMOS22** (predicted naturalness, 1–5, via SpeechMOS) and a **Whisper large-v3-turbo** read-back (mlx) of
every take against its script.

| Candidate | UTMOS | Read-back |
| --- | --- | --- |
| **Kokoro-82M `af_heart`** | **4.54** | word for word |
| Kokoro `af_bella` | 4.42 | |
| Kokoro `bf_emma`, `bf_isabella` | 4.39 | word for word |
| Chatterbox (MIT) conditioned on the Kokoro take (a synthetic reference: no real voice cloned) | 4.51 | "rupees" heard as "rubies" |
| Chatterbox, its own voice | 4.39 | word for word |
| Kokoro `am_michael`, `bm_george` | 4.36, 4.23 | |

Kokoro `af_heart` won: the most natural score, exact read-backs, the same voice from line to line, and seconds to
synthesise. Every one of the 26 lines was then transcribed back; two names were misread ("Rakish", "Preya") and were
given phonemes (`[Rakesh](/ɹˈɑkAʃ/)`, `[Priya's](/pɹˈijəz/)`) in `lines.json`'s `say`. The narration was also
transcribed back from the final mix, under the music, word for word.

Gotchas on the way: espeak-ng ignores a data path longer than 160 characters and falls back to its build path (the
worktree's path is longer), so its data is copied to `~/.cache/sc200-espeak/`; misaki needs spaCy's `en_core_web_sm`
installed up front; Chatterbox's watermarker needs `setuptools<81` for `pkg_resources`.

## Rebuild

From `src/` (the recordings are read from the main checkout, where they are git-ignored):

```sh
./setup.sh && tts/setup.sh                                     # the cut's tools and fonts; the voice venvs (Kokoro, Chatterbox, mlx-whisper)
nohup ./gen-qwen.sh > gen-qwen.log 2>&1 &                      # keyframes; then gen-qwen2.sh widens the two product frames
nohup ~/.local/bin/uv run --python 3.12 --script gen-ltx.py > gen-ltx.log 2>&1 &   # the seven clips (waits for Qwen)
tts/.venv-kokoro/bin/python tts/vo.py af_heart 0.94           # the voice-over
.venv-tools/bin/python film.py && .venv-tools/bin/python overlays.py
.venv-tools/bin/python assemble.py && .venv-tools/bin/python mix.py
.venv-tools/bin/python sidecars.py                             # WebP keyframes and clips with their sidecars
```

`setup.sh` makes `.venv-tools` (pillow, numpy, scipy, soundfile, fonttools, brotli) and converts Bricolage Grotesque and
Geist from the frontend's `@fontsource-variable` packages (OFL) to TTF in `fonts/`.

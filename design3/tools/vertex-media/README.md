# vertex-media

Google Vertex AI's generation models for Smart-Clearance's design work: Veo 3.1 for clips and the Gemini image models
("Nano Banana") for keyframes and character sheets, plus the ffmpeg cut and the measurements around them. Written for
SC-154, the landing page's hero film; the scripts are the record of how an asset was made, so they live here, tracked,
not in a design folder's gitignored `src/`.

Everything runs with `uv` from this folder (`uv run veo.py …`), on the project `aibuilder-510213`, as the developer's
own application-default credentials. No key, no secret: `veo.py doctor` checks the setup.

| Script | Does |
| --- | --- |
| `veo.py doctor` | ADC and its quota project, each model's reachability, ffmpeg |
| `veo.py generate` | one Veo 3.1 clip (text, first frame, first and last frame, or up to 3 reference images), validated against Veo's rules before any spend, priced, with its `.prompt.json` written before the wait |
| `veo.py poll` | finishes a clip whose wait was interrupted, by its operation name |
| `nano.py sheet / still / edit` | character sheets, keyframes and edits with Nano Banana 2 (or Pro with `--pro`, on the global endpoint); PNG to `src/`, `--webp` for the copy that ships |
| `assemble.py` | the cut: trims, `xfade` dissolves, the loop that closes on itself, grade, H.264; writes `<film>.cut.json` |
| `sidecar.py` | the film's `.prompt.json` from its clips' sidecars and the cut |
| `seams.py` | the loop and join seams on a 0–255 scale, with a contact sheet |
| `frames.py` | posters and 48 px soft previews from the film's frames, with sidecars |
| `cost.py` | what a folder's sidecars cost, by model and folder, against a cap |

## Setup

```sh
gcloud auth application-default login            # once, with the cloud-platform scope
gcloud auth application-default set-quota-project aibuilder-510213   # Vertex refuses user ADC without one
cd design3/tools/vertex-media && uv run veo.py doctor
```

`GOOGLE_CLOUD_PROJECT` and `VERTEX_LOCATION` override the defaults (`aibuilder-510213`, `us-central1`). Veo serves in
`us-central1`; the Gemini image models serve only on `global`, under their GA ids (`gemini-3.1-flash-image`,
`gemini-3-pro-image`), which `nano.py` picks by itself. The registry also lists `-preview` ids that answer 404.

## Money

Veo is billed per second of output and every attempt counts, including the ones its safety filter holds back. AGENTS.md
asks before anything that costs money, so a design round and a build each start with the maintainer's yes on a figure,
and `cost.py <folder> --cap N` says where the spend stands. `veo.py generate` refuses a call over `--max-usd` (default
$2). The price table in `_vx.py` is dated; check Google's Vertex AI pricing page when it is older than a month.

Prices on 2026-10-10, USD, per second of video, without audio (the hero plays muted; with audio is double for the
standard tier): Veo 3.1 720p/1080p 0.20, 4K 0.40; Fast 0.08/0.10/0.25; Lite 0.03/0.05. Images: Nano Banana 2 1K 0.067,
2K 0.101, 4K 0.151; Pro 0.134 (1K–2K), 0.24 (4K).

## Veo 3.1's rules, checked by `veo.py`

- Clips are 4, 6 or 8 s; 1080p, 4K, reference images and a last frame all need 8 s.
- 16:9 or 9:16; reference images are 16:9 only and cannot be combined with a first or last frame.
- Lite has no 4K. Extension is 720p only, so a 1080p film is cut from clips, not extended.
- `person_generation` is `allow_adult` on every image-based mode; keep children out of every prompt.
- Every frame carries a SynthID watermark. Veo's prompt rewriter cannot be turned off on Vertex (`--no-enhance`
  asks), so a seed repeats less exactly than it suggests; the sidecar records the prompt as sent.

## A film, end to end

```sh
uv run nano.py sheet --name anil --desc "…" --out ../../designs/SC-n/src/cast/anil.png --webp ../../designs/SC-n/img
uv run nano.py still --prompt-file k0.txt --ref ../../designs/SC-n/src/cast/anil.png --out ../../designs/SC-n/src/k0.png --webp ../../designs/SC-n/img
uv run veo.py generate --model veo-3.1-generate-001 --res 1080p --image ../../designs/SC-n/src/k0.png --prompt-file c0.txt --out ../../designs/SC-n/media/a-1.mp4
uv run assemble.py --out ../../site/assets/media/film.mp4 a-1.mp4:in=0.4:out=4.3 a-2.mp4:out=3.9 …
uv run sidecar.py ../../site/assets/media/film.mp4 --use "…" --designed-in design3/designs/SC-n
uv run seams.py ../../site/assets/media/film.mp4 --joins 3.4,6.8,10.2 --sheet sheet.webp
uv run frames.py ../../site/assets/media/film.mp4 --at 0 --name hero-day --at 7 --name hero-night --png ../../designs/SC-n/src/plates --webp ../../site/assets/plates
uv run cost.py ../../designs/SC-n --cap 45
```

"""SC-187: what ships beside the film. The cast sheets and keyframes already have their WebP and .prompt.json in ../img
(nano.py --webp writes them); this copies every Veo clip into ../media with its sidecar, the picked Lyria clips as mp3
with theirs, every app screen as WebP into ../screens, and composes the film's own sidecar. PNG originals, the raw
clips, the voice and the build stay in src/ (gitignored).

  uv run --with pillow python sidecars.py
"""

import json
import shutil
import subprocess
from datetime import date
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
DESIGN = HERE.parent
MEDIA, SCREENS = DESIGN / "media", DESIGN / "screens"
MEDIA.mkdir(exist_ok=True)
SCREENS.mkdir(exist_ok=True)
TODAY = date.today().isoformat()
FILM = json.loads((HERE / "film.json").read_text())


def clips() -> list[str]:
    done = []
    for mp4 in sorted((HERE / "clips").glob("c*.mp4")):
        side = mp4.with_suffix(".prompt.json")
        if not side.exists():
            print(f"no sidecar for {mp4.name}")
            continue
        shutil.copyfile(mp4, MEDIA / mp4.name)
        shutil.copyfile(side, MEDIA / side.name)
        done.append(mp4.stem)
    for rec in sorted((HERE / "clips").glob("ui-*.mp4")):
        shutil.copyfile(rec, MEDIA / rec.name)
        (MEDIA / f"{rec.stem}.prompt.json").write_text(json.dumps({
            "name": rec.stem, "kind": "recording", "made_with": "Playwright on the workspace app's stub (record-ui.mjs)", "created": TODAY,
            "use": "SC-187: an interaction in the real UI, played in the film's window"}, indent=2))
        done.append(rec.stem)
    print(f"clips: {', '.join(done)}")
    return done


def music() -> list[str]:
    used = []
    for name in ("bed-6", "lift-2"):
        wav, side = HERE / "music" / f"{name}.wav", HERE / "music" / f"{name}.prompt.json"
        if not wav.exists():
            continue
        out = MEDIA / f"music-{name}.mp3"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-b:a", "192k", str(out)], check=True)
        rec = json.loads(side.read_text())
        rec["output"] = f"{out.name} (mp3 192k from {wav.name})"
        (MEDIA / f"music-{name}.prompt.json").write_text(json.dumps(rec, indent=2))
        used.append(name)
    print(f"music: {', '.join(used)}")
    return used


def screens() -> int:
    n = 0
    for png in sorted((HERE / "screens").glob("*.png")) + sorted((HERE / "extra").glob("*.png")):
        im = Image.open(png).convert("RGB")
        im.save(SCREENS / f"{png.stem}.webp", "WEBP", quality=80, method=6)
        n += 1
    print(f"screens: {n}")
    return n


def film(done: list[str], used: list[str]) -> None:
    out = MEDIA / "smart-clearance-demo.mp4"
    if not out.exists():
        return
    (MEDIA / "smart-clearance-demo.prompt.json").write_text(json.dumps({
        "name": "smart-clearance-demo", "kind": "film", "created": TODAY, "voice": FILM.get("voice"), "seconds": FILM.get("total"),
        "made_with": ["Nano Banana 2 (gemini-3.1-flash-image, Vertex AI) for the cast sheets and keyframes",
                      "Veo 3.1 (veo-3.1-generate-001, Vertex AI, 1080p, no audio) for the clips, image to video; four clips reused from SC-154",
                      "the workspace and console apps on the live stack for the screens (director.py, capture.mjs); the stub for the recordings",
                      "Cloud Text-to-Speech, Chirp 3 HD en-IN, for the voice-over (vo.py)",
                      "Lyria 2 (lyria-002, Vertex AI) for the music bed (lyria.py, bed.py)",
                      "ffmpeg for the cut (assemble.py)"],
        "segments": len(FILM["segments"]), "clips": done, "music": used,
        "postprocess": "libx264 crf 18, aac 192k, loudnorm I=-14 TP=-1.5", "fictional": "every person, company and figure is fictional; the figures are the two journeys' own",
    }, indent=2, ensure_ascii=False))
    print("film sidecar written")


if __name__ == "__main__":
    film(clips(), music()) if False else None
    d = clips()
    u = music()
    screens()
    film(d, u)

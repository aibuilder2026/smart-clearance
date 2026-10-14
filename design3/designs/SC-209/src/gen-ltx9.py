# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-209 cut 7 (from cut 6's gen-ltx6.py): the bin's clips, LTX 2.5 Fast on this Mac through the ltx-video plugin's
backend, from the Qwen keyframes in src/img/: 1080p, 5 s. In the order they were made: the landfill at dusk, locked off
(found unrealistic once composited); the landfill again, one real camera glide from the keyframe with its stickers blank;
the packs in rows on cracked earth (stopped half way); and the pick, the aerial trail of cartons (w2-aerial), the drone
slowly descending. Clips land in src/clips/<name>.mp4 with a .prompt.json.

  nohup ~/.local/bin/uv run --python 3.12 --script gen-ltx9.py [names…] > gen-ltx9.log 2>&1 &
"""
import json, shutil, subprocess, sys, time
from pathlib import Path
sys.path.insert(0, str(Path.home() / ".claude/plugins/cache/ltx-local/ltx-video/0.2.0/server"))
from frames import frame_image  # noqa: E402
from ltx_backend import DEFAULT_APP, DEFAULT_APP_DATA, Backend, Paths  # noqa: E402

HERE = Path(__file__).resolve().parent
IMG, OUT = HERE / "img", HERE / "clips"
HOME = Path.home() / "ltx-video"
KEEP = ("Everything keeps its form; no object appears, vanishes or changes shape; every carton keeps its white label as it "
        "is; no new text or lettering appears. Photorealistic cinematic footage, natural motion, smooth and slow.")
LOCK = "A locked-off tripod shot: the camera does not move, pan, tilt or zoom. "
CLIPS = {
    # SC-209 cut 7: the bin, re-shot (the label printed on every carton's sticker, prep-keys.py)
    "w1-landfill": "Exactly as in the image, at dusk: the black kites wheel slowly in the hazy orange sky; thin grey smoke drifts sideways off the heap; the excavator's arm lowers its bucket slowly towards the ground; a few brown cartons slide slowly down from the dump truck's tipped bed onto the heap. The truck, the excavator and the cartons in the foreground keep their places and their white labels.",
    # the maintainer found the composite's motion unrealistic: one real camera move over a still heap, from the keyframe
    # with blank stickers, the labels then tracked onto them through the move (landfill-labels.py), as the opening's
    "w1-landfill-b": "Exactly as in the image, at dusk: the camera glides slowly forward toward the heap, smooth and steady. The black kites circle slowly in the hazy orange sky; thin grey smoke drifts gently off the far end of the dump; the excavator lowers its bucket a little. The dump truck, the heap of cartons and all the waste on the ground stay completely still: nothing slides, falls or tumbles.",
    # then the maintainer asked for a background "unique and aesthetic" in place of the landfill, and picked C from three
    # concepts (gen-qwen9c.sh): the batch's packs in rows on cracked earth under a dusk sky, from the preview itself
    # (stopped half way when the maintainer said they meant A)
    "w2-rows": "Exactly as in the image, at dusk: the camera glides slowly forward, low over the long rows of small orange drink cartons, smooth and steady. Fine dust drifts in the low warm light and the clouds move slowly across the violet and amber sky. The cartons and the distant white truck stay completely still: nothing falls, tips or moves.",
    # ...then said "sorry I meant A": the aerial trail of the batch's cartons across dark earth, from the preview as picked
    "w2-aerial": "Exactly as in the image, a straight-down drone view at golden hour: the camera descends slowly and steadily toward the long curving trail of cartons, drifting a little along its curve. The shadows of a few black kites glide slowly across the dark earth, and fine dust drifts through the low sunlight. The cartons and the earth stay completely still: nothing on the ground moves.",
}
KEYFRAME = {"w1-landfill-b": "w1-landfill", "w2-rows": "w2-rows-p", "w2-aerial": "w2-aerial-p"}   # a retake's keyframe, where its name is not the keyframe's
BLANK = {"w1-landfill-b"}   # from the keyframe with its stickers blank (the labels are printed onto the clip after)
MOVE = {"w1-landfill-b": "dolly_in", "w2-rows": "dolly_in", "w2-aerial": "dolly_in"}   # a camera move, where the clip has one (else locked off)
KEEP_ROWS = ("Everything keeps its form; no object appears, vanishes or changes shape; every drink carton stays plain orange "
             "with no printing; no text or lettering appears. Photorealistic cinematic footage, natural motion, smooth and slow.")
KEEP_BLANK = ("Everything keeps its form; no object appears, vanishes or changes shape; every carton keeps its one blank "
              "white sticker; no text or lettering appears. Photorealistic cinematic footage, natural motion, smooth and slow.")


def qwen_busy() -> bool:
    """one GPU job at a time: the voice and the keyframes (run9.sh), then these clips"""
    busy = subprocess.run(["pgrep", "-f", "gen-qwen|run9.sh|vo5.py"], capture_output=True).returncode == 0
    return busy or not (HERE / "qwen9.done").exists()


def main() -> None:
    names = sys.argv[1:] or list(CLIPS)
    while qwen_busy():
        time.sleep(20)
    OUT.mkdir(exist_ok=True); (HOME / "frames").mkdir(parents=True, exist_ok=True)
    paths = Paths(app=DEFAULT_APP, app_data=DEFAULT_APP_DATA, home=HOME)
    backend = Backend(paths, idle_stop_minutes=120)
    try:
        for name in names:
            out = OUT / f"{name}.mp4"
            if out.exists(): print(f"skip {name}", flush=True); continue
            key = KEYFRAME.get(name, name)
            src = IMG / f"{key}-L.png"   # with the batch's real labels printed on the cartons (prep-keys.py)
            if name in BLANK or not src.exists(): src = IMG / f"{key}.png"
            if not src.exists(): print(f"MISSING keyframe {name}", flush=True); continue
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc209-{name}.png", "crop")
            seed = 209800 + list(CLIPS).index(name)
            prompt = (CLIPS[name] + " " + (KEEP_ROWS if name == "w2-rows" else KEEP_BLANK)) if name in MOVE else (LOCK + CLIPS[name] + " " + KEEP)
            request = {"prompt": prompt, "model": "fast", "resolution": "1080p", "duration": 5, "fps": 24, "aspectRatio": "16:9",
                       "cameraMotion": MOVE.get(name, "static"), "audio": False, "seed": seed, "imagePath": framed["path"], "lastImagePath": None, "loras": []}
            print(f"== {name} {time.strftime('%H:%M:%S')} (seed {seed})", flush=True)
            started = time.monotonic(); last = [""]
            def progress(percent, message, last=last):
                line = f"   {percent}% {message}"
                if line != last[0]: last[0] = line; print(line, flush=True)
            for attempt in range(3):  # the shared backend can be stopped from outside between clips: restart it
                try:
                    video = backend.generate(request, progress); break
                except Exception as exc:  # noqa: BLE001
                    print(f"   attempt {attempt + 1} failed: {type(exc).__name__}: {exc}", flush=True)
                    backend.stop(); time.sleep(20)
            else:
                print(f"   GAVE UP on {name}", flush=True); continue
            shutil.copy2(video, out)
            minutes = (time.monotonic() - started) / 60
            sidecar = {**{k: v for k, v in request.items() if k not in {"imagePath", "lastImagePath"}}, "image": src.name,
                       "model": "LTX 2.5 Fast (local)", "ltx_desktop": paths.app_version(), "minutes": round(minutes, 1), "cost_usd": 0}
            out.with_suffix(".prompt.json").write_text(json.dumps(sidecar, indent=2))
            print(f"   saved {out.name} in {minutes:.1f} min", flush=True)
    finally:
        backend.stop()
    print(f"== done {time.strftime('%H:%M:%S')}", flush=True)


if __name__ == "__main__":
    main()

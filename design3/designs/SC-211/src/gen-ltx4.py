# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-206 cut 4: the opening's distributor godown, LTX 2.5 Fast on this Mac through the ltx-video plugin's backend,
from gen-qwen3.sh's keyframes: 1080p, 5 s, and unlike the people's clips (gen-ltx.py, locked off) each with its own
camera move, so the film opens moving. Clips land in src/clips/<name>.mp4 with a .prompt.json.

  nohup ~/.local/bin/uv run --python 3.12 --script gen-ltx4.py [names…] > gen-ltx4.log 2>&1 &
"""
import json, shutil, subprocess, sys, time
from pathlib import Path
sys.path.insert(0, str(Path.home() / ".claude/plugins/cache/ltx-local/ltx-video/0.2.0/server"))
from frames import frame_image  # noqa: E402
from ltx_backend import DEFAULT_APP, DEFAULT_APP_DATA, Backend, Paths  # noqa: E402

HERE = Path(__file__).resolve().parent
IMG, OUT = HERE / "img", HERE / "clips"
HOME = Path.home() / "ltx-video"
KEEP = ("Everything keeps its form; no object appears, vanishes or changes shape; people keep their faces, hands and "
        "bodies natural; every carton stays plain brown kraft with one blank white label sticker and no printing; no text, "
        "numbers or lettering appear anywhere. Photorealistic cinematic footage, natural motion, smooth and slow.")
CLIPS = {   # name: (prompt, camera move, seed)
    "o0-godown-aisle": ("A vast distributor's warehouse at dawn: towering grey steel racks stacked high with brown kraft "
                        "cartons on wooden pallets line a long aisle, and long shafts of golden morning light fall through the "
                        "high windows on the left, full of slowly drifting dust. The yellow forklift in the middle of the "
                        "aisle drives slowly to the right with its pallet of cartons, and the two workers in orange reflective "
                        "vests walk slowly towards the camera. The camera glides slowly forward along the aisle.",
                        "dolly_in", 206901),
    # "o0b-carton-lift" (seed 206902, dolly_in, from the worker-lifting keyframe): rejected, the carton crumpled and spun
    # at 1.8 s (clips/rejected/, local); the film dives from the aisle into the carton's label instead
}


def qwen_busy() -> bool:
    return subprocess.run(["pgrep", "-f", "gen-qwen"], capture_output=True).returncode == 0 or not (HERE / "qwen3.done").exists()


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
            src = IMG / f"{name}.png"
            if not src.exists(): print(f"MISSING keyframe {name}", flush=True); continue
            text, camera, seed = CLIPS[name]
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc206-{name}.png", "crop")
            request = {"prompt": text + " " + KEEP, "model": "fast", "resolution": "1080p", "duration": 5, "fps": 24,
                       "aspectRatio": "16:9", "cameraMotion": camera, "audio": False, "seed": seed,
                       "imagePath": framed["path"], "lastImagePath": None, "loras": []}
            print(f"== {name} {time.strftime('%H:%M:%S')} ({camera}, seed {seed})", flush=True)
            started = time.monotonic(); last = [""]
            def progress(percent, message, last=last):
                line = f"   {percent}% {message}"
                if line != last[0]: last[0] = line; print(line, flush=True)
            for attempt in range(3):
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

# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-219 cut 12's concept round 2: one continuous shot through the bright hall (gen-qwen12d.sh), LTX 2.5 Fast on this
Mac, 1080p, 5 s a clip, each clip after the first starting on the last frame of the one before, so the move never
cuts: w1 glides into the aisle from the keyframe; then the walk (w2) glides on down it, and the rise (r2) rises above
the racks to the whole hall. Waits for qwen12d.done. Clips land in src/clips/<name>.mp4 with a .prompt.json.
  nohup ~/.local/bin/uv run --python 3.12 --script gen-ltx12d.py <keyframe> [names…] > gen-ltx12d.log 2>&1 &"""
import json, shutil, subprocess, sys, time
from pathlib import Path
sys.path.insert(0, str(Path.home() / ".claude/plugins/cache/ltx-local/ltx-video/0.2.0/server"))
from frames import frame_image  # noqa: E402
from ltx_backend import DEFAULT_APP, DEFAULT_APP_DATA, Backend, Paths  # noqa: E402

HERE = Path(__file__).resolve().parent
IMG, OUT = HERE / "img", HERE / "clips"
HOME = Path.home() / "ltx-video"
KEEP = ("Everything keeps its exact form; no object appears, vanishes, bends or changes shape; the racks stay straight and "
        "the coloured cable trays stay blue, red, yellow and green; no people; no text, numbers or lettering appear "
        "anywhere. Photorealistic cinematic footage, bright and clean, smooth and steady.")
CLIPS = {   # name: (from, prompt, camera move)
    "dc2-w1": ("key", "Exactly as in the image: the camera glides slowly and steadily forward into the bright data-centre "
               "aisle, perfectly level, at walking pace. The servers' tiny blue and green lights blink softly.", "dolly_in"),
    "dc2-w2": ("dc2-w1", "Exactly as in the image: the camera keeps gliding slowly and steadily forward down the bright "
               "aisle, perfectly level, at the same walking pace. The servers' tiny lights blink softly.", "dolly_in"),
    "dc2-r2": ("dc2-w1", "Exactly as in the image: the camera rises slowly and smoothly straight up, above the tops of the "
               "server racks, revealing the long rows of racks across the bright hall below and the coloured cable trays "
               "running over them, the camera tilting gently down to look across the whole hall.", "jib_up"),
}


def last_frame(clip: Path, out: Path) -> Path:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-sseof", "-0.05", "-i", str(clip), "-frames:v", "1", "-update", "1", str(out)], check=True)
    return out


def main() -> None:
    key = sys.argv[1]; names = sys.argv[2:] or list(CLIPS)
    while not (HERE / "qwen12d.done").exists():
        time.sleep(15)
    OUT.mkdir(exist_ok=True); (HOME / "frames").mkdir(parents=True, exist_ok=True)
    paths = Paths(app=DEFAULT_APP, app_data=DEFAULT_APP_DATA, home=HOME)
    backend = Backend(paths, idle_stop_minutes=120)
    try:
        for name in names:
            out = OUT / f"{name}.mp4"
            if out.exists(): print(f"skip {name}", flush=True); continue
            src_name, text, move = CLIPS[name]
            src = IMG / f"{key}.png" if src_name == "key" else last_frame(OUT / f"{src_name}.mp4", IMG / f"{src_name}-last.png")
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc219d-{name}.png", "crop")
            seed = 219950 + list(CLIPS).index(name)
            request = {"prompt": text + " " + KEEP, "model": "fast", "resolution": "1080p", "duration": 5, "fps": 24, "aspectRatio": "16:9",
                       "cameraMotion": move, "audio": False, "seed": seed, "imagePath": framed["path"], "lastImagePath": None, "loras": []}
            print(f"== {name} {time.strftime('%H:%M:%S')} (seed {seed}, {move}, from {src.name})", flush=True)
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

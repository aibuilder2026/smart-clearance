# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-238: the landing demo film v3's local clips, on LTX 2.5 Fast through the ltx-video plugin's backend, one at a time:
the talking scenes (each speaker looking into the camera and saying the line, LTX generating the voice with the picture,
so the lips are made with the words) and any motion clip. Jobs come from a JSON list:
  [{"name", "image" (path, relative to src/), "prompt", "resolution": "720p", "duration": 8, "camera": "static",
    "audio": true, "seed"}]
Each clip lands in clips/<name>.mp4 (or the job's "out"), with a .prompt.json beside it. A job whose clip exists is
skipped. It waits while a Qwen job runs (one GPU job at a time).

  nohup ~/.local/bin/uv run --python 3.12 --script gen-ltx.py jobs.json [names…] > gen-ltx.log 2>&1 &
"""
import json, shutil, subprocess, sys, time
from pathlib import Path
sys.path.insert(0, str(Path.home() / ".claude/plugins/cache/ltx-local/ltx-video/0.2.0/server"))
from frames import frame_image  # noqa: E402
from ltx_backend import DEFAULT_APP, DEFAULT_APP_DATA, Backend, Paths  # noqa: E402

HERE = Path(__file__).resolve().parent
HOME = Path.home() / "ltx-video"


def qwen_busy() -> bool:
    return subprocess.run(["pgrep", "-f", "[g]en-qwen|[v]o\\.py"], capture_output=True).returncode == 0   # my own Qwen jobs, not the plugin's idle server


def main() -> None:
    jobs = json.loads(Path(sys.argv[1]).read_text())
    names = sys.argv[2:]
    if names: jobs = [j for j in jobs if j["name"] in names]
    (HOME / "frames").mkdir(parents=True, exist_ok=True)
    paths = Paths(app=DEFAULT_APP, app_data=DEFAULT_APP_DATA, home=HOME)
    backend = Backend(paths, idle_stop_minutes=120)
    try:
        for j in jobs:
            out = HERE / j.get("out", f"clips/{j['name']}.mp4")
            if out.exists(): print(f"skip {j['name']}", flush=True); continue
            while qwen_busy(): time.sleep(20)
            out.parent.mkdir(parents=True, exist_ok=True)
            src = HERE / j["image"]
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc238-{j['name']}.png", j.get("fit", "crop"))
            request = {"prompt": j["prompt"], "model": "fast", "resolution": j.get("resolution", "720p"),
                       "duration": j.get("duration", 8), "fps": 24, "aspectRatio": "16:9",
                       "cameraMotion": j.get("camera", "static"), "audio": j.get("audio", True), "seed": j.get("seed", 238000),
                       "imagePath": framed["path"], "lastImagePath": None, "loras": []}
            print(f"== {j['name']} {time.strftime('%H:%M:%S')} ({request['resolution']}, {request['duration']} s, seed {request['seed']})", flush=True)
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
                print(f"   GAVE UP on {j['name']}", flush=True); continue
            shutil.copy2(video, out)
            minutes = (time.monotonic() - started) / 60
            sidecar = {**{k: v for k, v in request.items() if k not in {"imagePath", "lastImagePath"}}, "image": j["image"],
                       "model": "LTX 2.5 Fast (local), audio generated with the picture", "ltx_desktop": paths.app_version(),
                       "minutes": round(minutes, 1), "cost_usd": 0, "use": "SC-238 " + j["name"]}
            out.with_suffix(".prompt.json").write_text(json.dumps(sidecar, indent=2))
            print(f"   saved {out.name} in {minutes:.1f} min", flush=True)
    finally:
        backend.stop()
    print(f"== done {time.strftime('%H:%M:%S')}", flush=True)


if __name__ == "__main__":
    main()

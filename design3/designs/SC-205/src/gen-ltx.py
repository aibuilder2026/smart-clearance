# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-205: the film's new realistic clips, LTX 2.5 Fast on this Mac through the ltx-video plugin's backend, from the Qwen
keyframes in src/img/, 720p, no audio, slow camera moves so the frames hold. Waits for gen-qwen2.sh (the GPU is
shared). Clips land in src/clips/<name>.mp4 with a .prompt.json each. Log: src/gen-ltx.log.

  nohup ~/.local/bin/uv run --python 3.12 --script gen-ltx.py [names…] > gen-ltx.log 2>&1 &
"""
import json, shutil, subprocess, sys, time
from pathlib import Path
sys.path.insert(0, str(Path.home() / ".claude/plugins/cache/ltx-local/ltx-video/0.2.0/server"))
from frames import frame_image  # noqa: E402
from ltx_backend import DEFAULT_APP, DEFAULT_APP_DATA, Backend, Paths  # noqa: E402

HERE = Path(__file__).resolve().parent
IMG, OUT = HERE / "img", HERE / "clips"
HOME = Path.home() / "ltx-video"
KEEP = ("Everything keeps its form; no object appears, vanishes or changes shape; faces, hands and packets stay natural; "
        "no text or lettering appears. Photorealistic documentary footage, natural motion, smooth and slow, steady camera, no handheld shake.")
CLIPS = [
    ("n1-factory-line", "n1-factory-line", 5, "dolly_in",
     "Exactly as in the image: in the bright snack-food factory the stainless-steel packing line moves steadily, carrying the rows of sealed orange snack packets forward; the two workers in white coats, blue hairnets and blue gloves calmly pick up packets and place them neatly into the open brown cartons; in the background a forklift drives slowly across the hall. A slow, smooth dolly forward along the line. " + KEEP),
    ("n2-mango-godown", "n2-mango-godown", 5, "dolly_in",
     "Exactly as in the image: in the distributor's godown the woman in the saree holds her smartphone steady over the open carton of small mango drink cartons and taps the screen to photograph the label, then lowers the phone a little and looks at it; behind her the young helper lifts a carton onto a rack; warm light falls through the half-open shutter. A slow, gentle push in toward the woman and the carton. " + KEEP),
    ("n3-chips-godown-dusk", "n3-chips-godown-dusk", 5, "static",
     "Exactly as in the image, locked off on a tripod: in the dim godown at dusk the man in the checked shirt stands still beside the tagged stack of cartons, looking down at the phone in his hands; he slowly lifts his eyes towards the cartons and lets out a small breath; a little dust drifts through the cool blue light from the high window and the single bulb glows warmly. The camera does not move. The man's face, his shirt and the cartons keep their form. " + KEEP),
]

def qwen_busy() -> bool:
    return subprocess.run(["pgrep", "-f", "gen-qwen"], capture_output=True).returncode == 0

def main() -> None:
    only = set(sys.argv[1:])
    while qwen_busy():
        time.sleep(20)
    OUT.mkdir(exist_ok=True); (HOME / "frames").mkdir(parents=True, exist_ok=True)
    paths = Paths(app=DEFAULT_APP, app_data=DEFAULT_APP_DATA, home=HOME)
    backend = Backend(paths, idle_stop_minutes=120)
    try:
        for i, (name, key, seconds, camera, prompt) in enumerate(CLIPS):
            if only and name not in only: continue
            out = OUT / f"{name}.mp4"
            if out.exists(): print(f"skip {name}", flush=True); continue
            src = IMG / f"{key}.png"
            if not src.exists(): print(f"MISSING keyframe {key}", flush=True); continue
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc205-{name}.png", "crop")
            seed = 205710 + i if name == 'n3-chips-godown-dusk' else 205700 + i
            request = {"prompt": prompt, "model": "fast", "resolution": "1080p", "duration": seconds, "fps": 24, "aspectRatio": "16:9",
                       "cameraMotion": camera, "audio": False, "seed": seed, "imagePath": framed["path"], "lastImagePath": None, "loras": []}
            print(f"== {name} {time.strftime('%H:%M:%S')} ({seconds} s, {camera}, seed {seed})", flush=True)
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
            sidecar = {**{k: v for k, v in request.items() if k not in {"imagePath", "lastImagePath"}}, "image": str(src.name),
                       "model": "LTX 2.5 Fast (local)", "ltx_desktop": paths.app_version(), "minutes": round(minutes, 1), "cost_usd": 0}
            out.with_suffix(".prompt.json").write_text(json.dumps(sidecar, indent=2))
            print(f"   saved {out.name} in {minutes:.1f} min", flush=True)
    finally:
        backend.stop()
    print(f"== done {time.strftime('%H:%M:%S')}", flush=True)

if __name__ == "__main__":
    main()

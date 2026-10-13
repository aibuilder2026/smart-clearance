# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-200: the film's surreal clips, LTX 2.5 Fast on this Mac through the ltx-video plugin's backend, from the Qwen
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
KEEP = ("Everything keeps its form; no object appears, vanishes or changes shape; no text or lettering appears. "
        "Cinematic, photorealistic, smooth and slow, no handheld shake.")
CLIPS = [
    ("l01-hourglass", "g01-hourglass", 6, "dolly_in",
     "Exactly as in the image: in the dim warehouse godown a colossal glass hourglass stands on the concrete floor between tall racks of brown cartons; a slow, steady stream of small red snack packets trickles down through its narrow waist and settles gently on the pile in the lower bulb; golden dust drifts slowly through the shafts of light from the high windows. A slow, smooth push in toward the hourglass. The hourglass, the racks and the cartons keep their shape. " + KEEP),
    ("l04-town", "g04-town-network", 8, "dolly_in",
     "Exactly as in the image: over the town at dawn, small bright pulses of emerald-green light travel along the glowing threads on the roads, from the factory to the godown and on to the lane of little shops; the shop lights glow softly; thin morning mist drifts slowly across the rooftops; a small white van moves a short way along the road. A slow, smooth push in over the town. The buildings keep their shape. " + KEEP),
    ("l02-pages", "g02-calendar-aisle", 6, "dolly_in",
     "Exactly as in the image: down the long aisle between towering racks of brown cartons, loose blank white pages float and drift slowly through the air like autumn leaves, turning as they fall and catching the warm golden light from the open shutter at the far end. A slow, steady dolly forward along the aisle. The racks and the cartons stay still. " + KEEP),
    ("l03-landfill", "g03-landfill", 6, "dolly_in",
     "Exactly as in the image: at the landfill under a hazy pale sky, the heap of red snack packets and torn cartons lies still in the foreground; a light breeze lifts a little dust across the ground from left to right; far behind, the excavator's arm lowers slowly and a few birds circle in the haze. A slow, low push in toward the heap. " + KEEP),
    ("l06-mango", "g06w-mango", 6, "dolly_in",
     "Exactly as in the image: above the sunlit bazaar lane the Munchly Mango carton floats in mid-air, bobbing gently up and down, its printed label unchanged and legible; the ripe mangoes around it drift slowly at different depths; warm golden haze and dust glow in the light. A slow push in toward the carton. " + KEEP),
    ("l07-chips", "g07w-chips", 6, "dolly_in",
     "Exactly as in the image: on the old wooden table in the dim godown, the Munchly Masala Chips packet stands still, its printed design unchanged; in the brass hourglass beside it the last thin trickle of sand runs out; dust drifts slowly through the cool blue moonlight from the high window. A slow, steady push in toward the packet and the hourglass. Nothing else moves. " + KEEP),
    ("l08-sunrise", "g08-town-sunrise", 6, "dolly_out",
     "Exactly as in the image: the town in full golden sunrise, every emerald-green thread of light along the roads glowing and pulsing gently, a few small birds rising slowly into the clear sky, warm light spreading across the rooftops. A slow, smooth pull back that reveals more of the town. The buildings keep their shape. " + KEEP),
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
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc200-{name}.png", "crop")
            seed = 200700 + i
            request = {"prompt": prompt, "model": "fast", "resolution": "720p", "duration": seconds, "fps": 24, "aspectRatio": "16:9",
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

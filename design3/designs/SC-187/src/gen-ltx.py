# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-187 cut 2: the scenes the Vertex cap no longer covers, LTX 2.5 Fast on this Mac through the ltx-video plugin's
own backend (the same request the MCP tool builds), one after another in the background: image to video from each
labelled keyframe in src/img/, 720p, no audio. Clips land in src/clips/<name>.mp4 with a .json sidecar each (and a
.prompt.json by sidecars). Log: src/gen-ltx.log.

  ~/.local/bin/uv run --python 3.12 --script gen-ltx.py [names…]
"""
import json, shutil, sys, time
from pathlib import Path
sys.path.insert(0, str(Path.home() / ".claude/plugins/cache/ltx-local/ltx-video/0.2.0/server"))
from frames import frame_image  # noqa: E402
from ltx_backend import DEFAULT_APP, DEFAULT_APP_DATA, Backend, Paths  # noqa: E402

HERE = Path(__file__).resolve().parent
IMG, OUT = HERE / "img", HERE / "clips"
HOME = Path.home() / "ltx-video"
RES = "720p"
KEEP = ("Every face, hand and arm keeps its form; no extra limbs appear and none vanish; nobody's face changes; nothing is picked up, handed over or put down; "
        "no object appears, vanishes or changes shape. The printed Munchly product labels on the cartons and the Munchly packets stay exactly as they are, crisp and legible. "
        "Photorealistic live action, 35 mm, natural skin and fabric, no handheld shake.")
CLIPS = [
    ("c28-foodbank-van", "k28-foodbank-van", 5, "dolly_in",
     "Exactly as in the image, almost a still: at the godown's loading door, the woman in the green T-shirt keeps her phone held up in her right hand exactly as it is and keeps smiling at the camera, blinking once; the godown worker keeps holding the labelled carton exactly as it is and glances at her; the second worker stands still. A light breeze stirs a strand of her hair. A slow, steady push in. " + KEEP),
    ("c09-rakesh-tally-desk", "k09-rakesh-tally-desk", 5, "dolly_in",
     "Exactly as in the image: in the small office, the man in the light blue checked shirt with glasses on his nose presses the rubber stamp down onto the printed sheet, holds it a moment, then lifts the stamp an inch; his other hand keeps the sheet flat; the ceiling fan turns slowly; the monitor keeps its plain blue and white grid; the labelled cartons behind him and the packets on the desk stay as they are. A slow, steady push in on the paper and his hands. " + KEEP),
    ("c10-landfill-certificate", "k10-landfill-certificate", 5, "static",
     "Exactly as in the image: in the hard midday sun at the landfill, the man in the light blue checked shirt finishes signing on the tablet's screen with his finger while the supervising officer in the orange hi-vis vest holds it steady; the two witnesses watch, the woman's dupatta moving a little in the wind; a little dust blows across the covered earth; the excavator stands still far behind; the opened carton and the packets on the ground stay as they are. Locked-off camera, no movement. " + KEEP),
    ("c12-close-lane", "k12-close-lane", 5, "dolly_out",
     "Exactly as in the image: in the golden light of the lane, the kirana owner in the cream shirt with the red tilak and the young man in the checked shirt both hold the one Munchly chips packet between them and keep smiling, the young man giving a small nod of thanks; the hanging packets sway very slightly; the scooter passes softly behind them; the labelled cartons stay as they are. The camera pulls back very slowly. " + KEEP),
]

def main() -> None:
    only = set(sys.argv[1:])
    OUT.mkdir(exist_ok=True); (HOME / "frames").mkdir(parents=True, exist_ok=True)
    paths = Paths(app=DEFAULT_APP, app_data=DEFAULT_APP_DATA, home=HOME)
    backend = Backend(paths, idle_stop_minutes=10)
    try:
        for name, key, seconds, camera, prompt in CLIPS:
            if only and name not in only: continue
            out = OUT / f"{name}.mp4"
            if out.exists(): print(f"skip {name}", flush=True); continue
            src = IMG / f"{key}.png"
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc187-{name}.png", "pad")
            seed = 187700 + CLIPS.index((name, key, seconds, camera, prompt))
            request = {"prompt": prompt, "model": "fast", "resolution": RES, "duration": seconds, "fps": 24, "aspectRatio": "16:9",
                       "cameraMotion": camera, "audio": False, "seed": seed, "imagePath": framed["path"], "lastImagePath": None, "loras": []}
            print(f"== {name} {time.strftime('%H:%M:%S')} ({seconds} s, {camera}, seed {seed})", flush=True)
            started = time.monotonic(); last = [""]
            def progress(percent, message, last=last):
                line = f"   {percent}% {message}"
                if line != last[0]: last[0] = line; print(line, flush=True)
            video = backend.generate(request, progress)
            shutil.copy2(video, out)
            minutes = (time.monotonic() - started) / 60
            sidecar = {**{k: v for k, v in request.items() if k not in {"imagePath", "lastImagePath"}}, "image": str(src), "framed_first": framed["path"],
                       "model": "LTX 2.5 Fast (local)", "ltx_desktop": paths.app_version(), "minutes": round(minutes, 1), "ltx_output": str(video), "cost_usd": 0}
            out.with_suffix(".prompt.json").write_text(json.dumps(sidecar, indent=2))
            print(f"   saved {out.name} in {minutes:.1f} min", flush=True)
    finally:
        backend.stop()
    print(f"== done {time.strftime('%H:%M:%S')}", flush=True)

if __name__ == "__main__":
    main()

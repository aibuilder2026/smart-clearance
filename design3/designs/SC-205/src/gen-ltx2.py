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
LOCK = "A locked-off tripod shot: the camera does not move, pan or zoom. "
CLIPS = [
    ("m1-priya-desk", "m1-priya-desk", 5, "static", "540p", LOCK +
     "Exactly as in the image: the woman in the navy pinstripe kurta sits at her desk looking down at the smartphone in her hands; she reads it, her eyebrows lift slightly, and she gives a small nod. Only her eyes, head and hands move a little. " + KEEP),
    ("m3-priya-approve", "m3-priya-approve", 5, "static", "540p", LOCK +
     "Exactly as in the image: the woman in the navy pinstripe kurta holds the tablet, reads it for a moment, then taps it once with her thumb and smiles faintly. Only her hands and face move a little. " + KEEP),
    ("m4-kirana-phone", "m4-kirana-phone", 5, "static", "540p", LOCK +
     "Exactly as in the image: the shopkeeper in the maroon saree behind the counter looks down at the phone in her hand, reads it, and taps the screen once with her thumb, smiling. Only her face and hands move a little; the shelves stay still. " + KEEP),
    ("m5-staff-upi", "m5c-staff-upi", 5, "static", "540p", LOCK +
     "Exactly as in the image: at the table at dusk the young worker holds his phone steady over the white card the woman holds out, as if scanning it, then lowers the phone and nods; she smiles. Small, natural movements only. " + KEEP),
    ("m6-meera-van", "m6-meera-van", 5, "static", "540p", LOCK +
     "Exactly as in the image: the young woman in the green T-shirt slides the sealed carton into the van and turns to take the next carton from the worker. Slow, natural movements; the van stays still. " + KEEP),
    ("m7-kirana-delivery", "m7-kirana-delivery", 5, "static", "540p", LOCK +
     "Exactly as in the image: the delivery man passes the sealed carton across the counter and the shopkeeper in the maroon saree takes it with both hands and sets it down, smiling. Slow, natural movements only. " + KEEP),
    ("c3-landfill-evidence", "c3b-landfill-evidence", 5, "static", "540p", LOCK +
     "Exactly as in the image: the two workers slowly tip the opened cartons so the orange packets slide into the pit; the man in the checked shirt keeps holding up his phone to photograph it; the officer stands still holding the slate. A little dust drifts. " + KEEP),
    ("c4-landfill-sign", "c4b-landfill-sign", 5, "static", "540p", LOCK +
     "Exactly as in the image: the officer slowly signs on the tablet with his fingertip while the man in the checked shirt holds it steady; the two witnesses watch and nod. Only their hands and heads move a little. " + KEEP),
    ("m2-lakshmi-photo", "m2-lakshmi-photo", 5, "static", "540p", LOCK +
     "Exactly as in the image: the woman in the brown cardigan and saree holds the phone steady toward the carton, taps the screen once to take the photo, then lowers the phone a little and looks at it, satisfied. Only her hands and face move a little. " + KEEP),
    ("n1-neha-console", "n1-neha-console", 5, "static", "540p", LOCK +
     "Exactly as in the image: the woman in the white shirt and glasses types on the laptop, pauses, then clicks the trackpad once and looks at the screen, calm and focused. Only her hands and eyes move. " + KEEP),
    ("c2-agrawal-tablet", "c2-agrawal-tablet", 5, "static", "540p", LOCK +
     "Exactly as in the image: the man in the grey shirt reads the tablet in his hands, thinks for a moment, nods slightly and taps the screen once. Only his face and hands move a little. " + KEEP),
    ("n3-chips-godown-dusk", "n3-chips-godown-dusk", 5, "static", "540p", LOCK +
     "Exactly as in the image: in the dim godown the man in the checked shirt stands beside the tagged stack, looks down at the phone in his hands, and slowly lets out a breath. Only his head and hands move slightly; the cartons stay exactly where they are. " + KEEP),
    ("c5-priya-evening", "c5-priya-evening", 5, "static", "540p", LOCK +
     "Exactly as in the image: in the evening light the woman in the navy pinstripe kurta studies the laptop, leans in slightly, then nods and clicks once. Only her face and hands move a little. " + KEEP),
    ("i3-landfill", "i3-landfill", 5, "static", "1080p", LOCK +
     "Exactly as in the image: a light breeze lifts a little dust across the heap of torn cartons and orange packets; far behind, the excavator stays still and a few birds circle slowly in the haze. " + KEEP),
    ("i2-hold", "i2-hold", 5, "static", "1080p", LOCK +
     "Exactly as in the image: the supervisor in the yellow vest looks from the tablet to the tagged stack of cartons and frowns slightly; the red tag stirs a little in the breeze from the open shutter. " + KEEP),
]

def qwen_busy() -> bool:
    return subprocess.run(["pgrep", "-f", "gen-qwen2.sh"], capture_output=True).returncode == 0

def main() -> None:
    only = set(sys.argv[1:])
    while qwen_busy() or not (HERE / "qwen5.done").exists():
        time.sleep(20)
    OUT.mkdir(exist_ok=True); (HOME / "frames").mkdir(parents=True, exist_ok=True)
    paths = Paths(app=DEFAULT_APP, app_data=DEFAULT_APP_DATA, home=HOME)
    backend = Backend(paths, idle_stop_minutes=120)
    try:
        for i, (name, key, seconds, camera, res, prompt) in enumerate(CLIPS):
            if only and name not in only: continue
            out = OUT / f"{name}.mp4"
            if out.exists(): print(f"skip {name}", flush=True); continue
            src = IMG / f"{key}.png"
            if not src.exists(): print(f"MISSING keyframe {key}", flush=True); continue
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc205-{name}.png", "crop")
            seed = 205800 + i
            request = {"prompt": prompt, "model": "fast", "resolution": res, "duration": seconds, "fps": 24, "aspectRatio": "16:9",
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

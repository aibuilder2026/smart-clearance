# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-187 cut 3: the first minute's clips and the camera shot, LTX 2.5 Fast on this Mac through the ltx-video plugin's
backend, from the Qwen keyframes in src/img/, 720p, no audio (the voice and music are Google's, final), near-static
scenes so the frames hold. Waits for gen-qwen.sh to finish (the GPU is shared). Clips land in src/clips/<name>.mp4
with a .prompt.json each. Log: src/gen-ltx3.log.

  ~/.local/bin/uv run --python 3.12 --script gen-ltx3.py [names…]
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
        "no object appears, vanishes or changes shape; the printed labels on the cartons and the packets stay exactly as they are, crisp and legible. "
        "Photorealistic live action, 35 mm, natural skin and fabric, no handheld shake.")
CLIPS = [
    ("c51-brand-office", "k51-brand-office", 6, "dolly_in",
     "Exactly as in the image, almost a still: in the glass meeting room, the woman in the navy pinstripe kurta keeps her pen pointed at the wall screen and glances at her colleagues; the man in the pale blue shirt nods slowly, the woman in the grey blazer looks from the screen to her laptop; nobody moves from their seat. A slow, steady push in toward the table. " + KEEP),
    ("c52-dist-office", "k52-dist-office", 6, "dolly_in",
     "Exactly as in the image, almost a still: the man in the light blue checked shirt reads the printed stock report at his desk, his eyes moving along the highlighted line; he lets out a slow breath and glances once toward the open door and the godown, then back at the report; his hands stay on the desk. A slow, steady push in on him and the report. " + KEEP),
    ("c53-qc-dock", "k53-qc-dock", 6, "static",
     "Exactly as in the image, almost a still: at the receiving dock, the supervisor in the hi-vis vest keeps his finger on the carton's label and reads the date, glances at the tablet in his other hand, and gives one small shake of his head; the worker with the pallet jack in the background stands still; a little daylight shifts under the shutter. Locked-off camera, no movement. " + KEEP),
    ("c54-write-off", "k54-write-off", 6, "dolly_in",
     "Exactly as in the image: at the landfill, the heap of sealed packets and torn cartons lies still on the covered earth; a little dust blows across the ground from left to right; far behind, the excavator's bucket lowers slowly; nothing else moves. A slow, low push in toward the heap. " + KEEP),
    ("c55-kirana-empty", "k55-kirana-empty", 6, "static",
     "Exactly as in the image, almost a still: behind his counter, the shop owner keeps his open hand toward the empty gap on the shelf and gives a small apologetic shrug; the young woman in the yellow kurta looks at the gap, then at him, and nods with mild disappointment; the hanging packets sway very slightly. Locked-off camera, no movement. " + KEEP),
    ("c56-factory-dawn", "k56-factory-dawn", 8, "dolly_in",
     "Exactly as in the image: dawn at the factory's loading bay, thin mist drifting slowly through the low sun; the worker far along the dock pushes the pallet jack a short way and stops; the supervisor beside the truck turns a page on his clipboard; the trucks stand still. A slow, smooth dolly in toward the dock. " + KEEP),
    ("c57-label-photo", "k57-label-photo", 6, "static",
     "Exactly as in the image, almost a still: over his shoulder, the man in the light blue checked shirt holds his phone steady in both hands, its screen facing him and the camera; the camera screen on the phone shows the carton label in its frame and does not change; he presses the round shutter button once with his thumb, the screen flashes white for an instant, and he holds the phone still. Locked-off camera, no movement. " + KEEP),
    ("c58-depot", "k58-depot", 6, "dolly_in",
     "Exactly as in the image, almost a still: in the depot aisle, the supervisor in the navy polo keeps reading his tablet, scrolls it once with his thumb, and looks up along the racks; the forklift far down the aisle stays parked; dust turns slowly in the shafts of light. A slow, steady dolly forward along the aisle. " + KEEP),
]

def main() -> None:
    only = set(sys.argv[1:])
    while False:
        time.sleep(20)
    OUT.mkdir(exist_ok=True); (HOME / "frames").mkdir(parents=True, exist_ok=True)
    paths = Paths(app=DEFAULT_APP, app_data=DEFAULT_APP_DATA, home=HOME)
    backend = Backend(paths, idle_stop_minutes=10)
    try:
        for name, key, seconds, camera, prompt in CLIPS:
            if only and name not in only: continue
            out = OUT / f"{name}.mp4"
            if out.exists(): print(f"skip {name}", flush=True); continue
            src = IMG / f"{key}.png"
            if not src.exists(): print(f"MISSING keyframe {key}", flush=True); continue
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc187-{name}.png", "pad")
            seed = 187800 + CLIPS.index((name, key, seconds, camera, prompt))
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

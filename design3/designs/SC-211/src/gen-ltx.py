# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-206 cut 3: each person at work, LTX 2.5 Fast on this Mac through the ltx-video plugin's backend, from the
cast-matched Qwen keyframes in src/img/: 1080p, 5 s, a locked-off camera, small natural movements, and every screen
kept a plain white display so the live app can be set into it frame by frame (vfx.py). Played at its own speed in the
cut: never slowed, reversed or looped where it is seen sharp. Clips land in src/clips/<name>.mp4 with a .prompt.json.

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
KEEP = ("Everything keeps its form; no object appears, vanishes or changes shape; faces and hands stay natural, with five "
        "fingers; every screen stays a plain, evenly lit white display with nothing on it; no text or lettering appears. "
        "Photorealistic cinematic footage, natural motion, smooth and slow.")
LOCK = "A locked-off tripod shot: the camera does not move, pan, tilt or zoom. "
CLIPS = {
    # the faces: the device's back to the camera, its screen towards the person
    "f-priya": "Exactly as in the image: the woman in the navy pinstripe kurta reads the tablet in her hands; her eyes move along it, her eyebrows lift slightly and she gives a small nod, then taps it once with her thumb. Only her eyes, face and thumb move a little; the tablet stays where it is.",
    "f-lakshmi": "Exactly as in the image: the woman in the teal saree reads the tablet in her hands with a slight, composed smile, then taps it once with her thumb and looks up for a moment. Only her face and thumb move a little; the cartons stay still.",
    "f-kirana": "Exactly as in the image: the shopkeeper in the maroon saree reads the phone in her hand, smiles warmly and taps it once with her thumb. Only her face and thumb move a little; the shelves stay still.",
    "f-neha": "Exactly as in the image: the woman in the white shirt and glasses types on the laptop, pauses, reads the screen and gives a small nod. Only her hands and eyes move; the laptop stays still.",
    "f-rakesh": "Exactly as in the image: in the dim godown the grey-haired man in the light blue checked shirt reads the tablet in his hands, frowns slightly and slowly lets out a breath. Only his face moves a little; the tablet and the cartons stay exactly where they are.",
    "f-agrawal": "Exactly as in the image: the bearded man in the grey safari shirt reads the phone in his hand, raises an eyebrow, smiles and taps it once with his thumb. Only his face and thumb move; the phone stays steady.",
    "f-meera": "Exactly as in the image: the helper slides the sealed carton into the van while the young woman in the green T-shirt reads the phone in her hand and taps it once. Slow, natural movements; the van stays still.",
    # over the shoulder, where the action matters; the screen stays a plain white display (the app is set into it)
    "s-upi": "Exactly as in the image: the young worker in the foreground holds his phone up towards the tablet for a moment, as if scanning it, then lowers it slightly and nods; the woman in the teal saree holds the tablet steady and smiles. Small, natural movements only; both screens stay plain white.",
    "s-landfill-photo": "Exactly as in the image: in the pit below, the worker slowly tips an opened carton so the packets slide out onto the ground; the man in the checked shirt keeps holding the tablet up steady to photograph it. A little dust drifts; no fire, no flames, nothing glows.",
    "s-landfill-sign": "Exactly as in the image: the officer in the foreground slowly signs on the tablet's screen with his fingertip while the man in the checked shirt holds it steady; the two witnesses watch and nod. Only their hands and heads move a little.",
    "s-lakshmi-label": "Exactly as in the image: the woman in the teal saree holds the tablet steady, aimed at the cartons, and taps its screen once with her thumb to take the photo. Only her thumb and head move a little; the tablet and the cartons stay still.",
    "s-priya": "Exactly as in the image: the woman in the navy pinstripe kurta holds the tablet steady and reads it; her thumb moves to the screen and taps it once. Only her thumb and head move a little; the tablet stays still.",
    "s-kirana": "Exactly as in the image: the shopkeeper holds her phone steady and taps its screen once with her thumb. Only her thumb and head move a little; the phone stays still.",
    "s-neha": "Exactly as in the image: the woman in the white shirt types on the laptop and pauses to read the screen. Only her hands and head move a little; the laptop stays still.",
    "s-rakesh": "Exactly as in the image: the man holds the tablet steady and reads it, then taps it once. Only his thumb and head move a little; the tablet stays still.",
    "s-agrawal": "Exactly as in the image: the man holds his phone steady and taps its screen once with his thumb. Only his thumb and head move a little; the phone stays still.",
    "s-meera": "Exactly as in the image: the woman holds her phone steady and taps it once; beyond it, the helper slides a carton into the van. Small, natural movements; the van stays still.",
    "s-priya-eve": "Exactly as in the image: in the evening light the woman holds the tablet steady and taps its screen once with her finger. Only her finger and head move a little; the tablet stays still.",
    # retakes: the same keyframe (KEYFRAME), a firmer prompt and a new seed
    "f-neha-b": "Exactly as in the image: the woman in the white shirt and glasses keeps her eyes down on the laptop screen in front of her the whole time, typing steadily with both hands, then pausing to read what she typed; she never looks up and never looks at the camera. Only her hands and eyes move a little; the laptop and the office stay still.",
    "f-agrawal-b": "Exactly as in the image: the bearded man in the grey safari shirt keeps reading the phone in his right hand, its dark back towards the camera the whole time; he never turns the phone around and never shows its screen to the camera. He raises an eyebrow and smiles a little. Only his face and eyes move; the phone stays where it is in his hand.",
}
KEYFRAME = {"f-neha-b": "f-neha", "f-agrawal-b": "f-agrawal"}   # a retake's keyframe, where its name is not the keyframe's


def qwen_busy() -> bool:
    busy = subprocess.run(["pgrep", "-f", "gen-qwen"], capture_output=True).returncode == 0
    return busy or not ((HERE / "qwen.done").exists() and (HERE / "qwen2.done").exists())


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
            if not src.exists(): src = IMG / f"{key}.png"
            if not src.exists(): print(f"MISSING keyframe {name}", flush=True); continue
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc206-{name}.png", "crop")
            seed = 206800 + list(CLIPS).index(name)
            prompt = LOCK + CLIPS[name] + " " + KEEP
            request = {"prompt": prompt, "model": "fast", "resolution": "1080p", "duration": 5, "fps": 24, "aspectRatio": "16:9",
                       "cameraMotion": "static", "audio": False, "seed": seed, "imagePath": framed["path"], "lastImagePath": None, "loras": []}
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

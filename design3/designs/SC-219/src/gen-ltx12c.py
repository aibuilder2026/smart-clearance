# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-219 cut 12's concept round: the real camera moves under concepts A (the data hall) and C (inside the machine),
LTX 2.5 Fast on this Mac, 1080p, 5 s, one slow move each from the Qwen keyframes (gen-qwen12c.sh). Starts once Qwen has
finished (qwen12c.done). Clips land in src/clips/<name>.mp4 with a .prompt.json.
  nohup ~/.local/bin/uv run --python 3.12 --script gen-ltx12c.py [names…] > gen-ltx12c.log 2>&1 &"""
import json, shutil, sys, time
from pathlib import Path
sys.path.insert(0, str(Path.home() / ".claude/plugins/cache/ltx-local/ltx-video/0.2.0/server"))
from frames import frame_image  # noqa: E402
from ltx_backend import DEFAULT_APP, DEFAULT_APP_DATA, Backend, Paths  # noqa: E402

HERE = Path(__file__).resolve().parent
IMG, OUT = HERE / "img", HERE / "clips"
HOME = Path.home() / "ltx-video"
KEEP = ("Everything keeps its exact form and place; no object appears, vanishes, bends or changes shape; no people; no "
        "text, numbers or lettering appear anywhere. Photorealistic cinematic footage, smooth, slow and steady.")
CLIPS = {
    "dc-a2-aisle": ("Exactly as in the image: the camera glides slowly and steadily forward down the centre of the long "
                    "data-centre aisle, perfectly level, toward the bright far end. The tiny green and blue status lights on "
                    "the servers flicker gently; a faint haze drifts in the light. The racks, the yellow cable trays and "
                    "the floor stay perfectly straight and still.", "dolly_in"),
    "dc-c1-fibre": ("Exactly as in the image, a macro shot: the camera slides very slowly sideways along the fibre-optic "
                    "patch panel. Soft pulses of cyan-green light travel along the glowing fibres; the blue and green "
                    "lights behind shimmer softly out of focus. The cables and connectors stay perfectly still.", "dolly_right"),
    "dc-a1-pipes": ("Exactly as in the image: the camera glides slowly forward along the cooling plant's hall, low and "
                    "level. A faint haze drifts through the soft overhead light. The coloured pipes, valves and the floor "
                    "stay perfectly still.", "dolly_in"),
    "dc-c2-blade": ("Exactly as in the image, a macro shot: the focus shifts slowly from the sleds in the background "
                    "to the sled pulled out in front, a gentle rack focus. The tiny green and blue activity lights blink "
                    "softly; the rim light glints along the brushed metal. The sleds stay perfectly still.", "focus_shift"),
}


def main() -> None:
    names = sys.argv[1:] or list(CLIPS)
    while not (HERE / "qwen12c.done").exists():
        time.sleep(15)
    OUT.mkdir(exist_ok=True); (HOME / "frames").mkdir(parents=True, exist_ok=True)
    paths = Paths(app=DEFAULT_APP, app_data=DEFAULT_APP_DATA, home=HOME)
    backend = Backend(paths, idle_stop_minutes=120)
    try:
        for name in names:
            out = OUT / f"{name}.mp4"
            if out.exists(): print(f"skip {name}", flush=True); continue
            src = IMG / f"{name}.png"
            if not src.exists(): print(f"MISSING keyframe {name}", flush=True); continue
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc219c-{name}.png", "crop")
            text, move = CLIPS[name]
            seed = 219900 + list(CLIPS).index(name)
            request = {"prompt": text + " " + KEEP, "model": "fast", "resolution": "1080p", "duration": 5, "fps": 24, "aspectRatio": "16:9",
                       "cameraMotion": move, "audio": False, "seed": seed, "imagePath": framed["path"], "lastImagePath": None, "loras": []}
            print(f"== {name} {time.strftime('%H:%M:%S')} (seed {seed}, {move})", flush=True)
            started = time.monotonic(); last = [""]
            def progress(percent, message, last=last):
                line = f"   {percent}% {message}"
                if line != last[0]: last[0] = line; print(line, flush=True)
            for attempt in range(3):   # the shared backend can be stopped from outside between clips: restart it
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

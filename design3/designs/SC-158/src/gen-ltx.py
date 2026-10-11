# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0", "httpx==0.28.1"]
# ///
"""SC-158: the demo film's live-action clips, LTX 2.5 Fast on this Mac through the ltx-video plugin's own backend
(the same request the MCP tool builds), one after another in the background: image to video from each keyframe in
src/img/. Clips land in src/clips/<name>.mp4 with a .json sidecar each; the project's .prompt.json sidecars are written
into ../media/clips/ by sidecars.py afterwards. Log: src/gen-ltx.log. Never runs while Qwen is rendering (memory).

  uv run --python 3.12 --script gen-ltx.py [names…]
"""

import json
import shutil
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path.home() / ".claude/plugins/cache/ltx-local/ltx-video/0.2.0/server"))
from frames import frame_image  # noqa: E402
from ltx_backend import DEFAULT_APP, DEFAULT_APP_DATA, Backend, Paths  # noqa: E402

HERE = Path(__file__).resolve().parent
IMG, OUT = HERE / "img", HERE / "clips"
HOME = Path.home() / "ltx-video"
RES = "540p"

NOTEXT = "No text, no logos, no lettering anywhere. Photorealistic live action, 35 mm, natural skin and fabric."

# name, keyframe, seconds, camera, prompt
CLIPS = [
    ("c01-factory-dawn", "k01-factory-dawn", 6, "dolly_in",
     "Exactly as in the image: dawn at a beverage factory's loading bay, two blue trucks backed up to the dock under the corrugated roof, pallets of plain kraft cartons with a sage-green band in the yard, mist and low warm sun from the right. The worker in the yellow vest pushes the pallet jack slowly toward the dock while the supervisor in the yellow vest lowers his clipboard and looks up at the trucks; thin mist drifts through the sunlight, a crow crosses the sky. A slow, smooth dolly in toward the dock, no handheld shake. The light holds. Sound: a diesel engine idling, sparrows, a distant horn, the pallet jack's wheels on concrete. " + NOTEXT),
    ("c02-godown-lakshmi", "k02-godown-lakshmi", 6, "dolly_in",
     "Exactly as in the image: inside a distributor's godown, tall racks of plain kraft cartons with a sage-green band on both sides, a shaft of sun from the barred window, dust in the light. The woman in the deep teal saree with the long grey-streaked plait and the glasses on a cord holds an open carton of small yellow-orange mango drink tetra packs. She lifts the glasses onto her nose, turns the carton a little to read the date on its side, frowns, then lowers it and looks up the aisle with quiet concern, breathing out. A slow push in on her. Sound: a ceiling fan's hum, cardboard creaking, distant traffic and a bicycle bell from the lane. " + NOTEXT),
    ("c03-priya-office", "k03-priya-office", 5, "static",
     "Exactly as in the image: a bright modern office in the morning, the woman in the navy pinstripe kurta with the lanyard at a white desk behind an open silver laptop whose lid faces the camera, a steel tumbler of chai, a potted plant, colleagues blurred behind. She scrolls on the trackpad and reads her screen, which stays turned toward her and out of view, then glances at her watch and back at the screen; her ponytail shifts, the colleague behind turns in his chair. The laptop does not move. Locked-off camera, no movement. Sound: a quiet office hum, keyboard taps nearby, a distant phone ringing once. " + NOTEXT),
    ("c04-neha-console", "k04-neha-console", 5, "static",
     "Exactly as in the image: an operations room in the evening, the woman in the white shirt and black-framed glasses side-on at a wide desk, a large monitor and a laptop showing a pale green dashboard with cards and a route of green dots, a warm desk lamp, city lights in the window. She moves the mouse, the green dots on the monitor's route light up one after another, and she nods slightly and types a few keys. Locked-off camera, no movement. Sound: soft keyboard clicks, an air-conditioner's hum, faint traffic far below. " + NOTEXT),
    ("c05-priya-phone", "k05-priya-phone", 5, "static",
     "Exactly as in the image: the woman in the navy pinstripe kurta with the lanyard stands by the office window holding a black smartphone in both hands. The phone's screen lights up brighter with a notification; she reads it, her eyebrows rise a little, she exhales and taps the screen once with her thumb, then looks up thoughtfully toward the window. Locked-off camera, no movement. Sound: a soft two-note notification chime, a quiet office, birds outside. " + NOTEXT),
    ("c06-lakshmi-label", "k06-lakshmi-label", 5, "static",
     "Exactly as in the image: in the warm godown the woman in the teal saree holds her smartphone up with both hands toward the printed label on the side of the kraft carton on the rack, the camera seeing the back of the phone and its lenses, its screen toward her; racks of cartons behind her, a bare bulb above. She steadies the phone, presses the shutter with her thumb, a small flash lights the label for an instant, then she lowers the phone a little and nods, satisfied. The phone stays turned toward the carton. Locked-off camera, no movement. Sound: a camera shutter click, a fan's hum, a distant scooter. " + NOTEXT),
    ("c07-priya-approve", "k07-priya-approve", 5, "static",
     "Exactly as in the image: a close-up over the shoulder of a woman's hands in a navy pinstripe sleeve with a slim steel watch holding a black smartphone at a white desk, a large rounded green button at the bottom of a white app screen with a big green number, a laptop blurred behind, soft morning light. Her thumb presses the green button; the button darkens for a moment and a white tick appears on it, and her hand relaxes. Locked-off camera, no movement. Sound: a soft tap, a gentle confirmation tone, a quiet office. " + NOTEXT),
    ("c08-kirana-phone", "k08-kirana-phone", 5, "static",
     "Exactly as in the image: a small kirana shop in Hyderabad's old city at noon, the woman in the maroon saree with the mustard blouse behind the glass-fronted wooden counter reading her smartphone, shelves of colourful unbranded packets, jars of sweets, hanging sachet strips, a weighing scale, a ceiling fan, bright sun on the lane. She reads, her smile widens, she nods to herself and taps the screen with her thumb, then looks up at her shelves; the fan turns, a shopper passes outside. Locked-off camera, no movement. Sound: a turning fan, street chatter, a scooter passing, a soft phone tap. " + NOTEXT),
    ("c09-kirana-sale", "k09-kirana-sale", 5, "static",
     "Exactly as in the image: the same kirana counter in the afternoon, the woman in the maroon saree with the mustard blouse handing a small yellow-orange mango drink tetra pack across the counter to a young man in a grey shirt who holds out a coin, a crate of the same packs by the scale, shelves of colourful unbranded packets behind. He takes the pack and puts the coin in her palm, both smile and nod, she turns to the crate and lifts out another pack. Locked-off camera, no movement. Sound: a coin on the counter, a cheerful 'shukriya', the street outside. " + NOTEXT),
    ("c10-staff-sale", "k10-staff-sale", 8, "static",
     "Exactly as in the image: violet dusk at a godown's gate, a folding table under a sodium lamp stacked with small yellow-orange mango drink tetra packs, the woman in the teal saree behind it, a short queue of godown workers in shirts and lungis, a small black-and-white square code card on the table, scooters along the wall, the sky amber at the horizon and violet above. The first worker takes a handful of packs from her and taps his phone on the code card, then steps aside as the next worker steps up; she smiles and hands the next packs across; the sodium lamp flickers once. Locked-off camera, no movement. Sound: friendly chatter, a scooter starting, a short payment chime, crickets. " + NOTEXT),
    ("c11-foodbank-van", "k11-foodbank-van", 8, "dolly_right",
     "Exactly as in the image: late morning at the godown's loading door, a plain white delivery van with its rear doors open, the woman in the green T-shirt with the lanyard and the bun passing a kraft carton with a sage-green band into the van to a young volunteer in an orange vest, the woman in the teal saree holding a clipboard by the door, three more cartons on a hand truck, a tamarind tree and a blue-washed wall. The carton goes in, the volunteer sets it down and reaches out, the woman in green lifts the next carton from the hand truck and passes it, the woman in the teal saree ticks her clipboard and smiles. A slow, gentle slide to the right. Sound: cardboard sliding, a van door, mynah birds, a distant auto-rickshaw. " + NOTEXT),
    ("c12-van-round", "k12-van-round", 6, "static",
     "Exactly as in the image: a Saturday morning in a narrow bazaar lane in Hyderabad's old city, a small white delivery van with its side door open, a young delivery worker in a blue shirt carrying two plain kraft cartons with a sage-green band toward a kirana shop's doorway where the shopkeeper waits, old painted shutters, strings of unbranded sachets, a cycle rickshaw, soft morning light. The worker walks the cartons to the doorway and hands them to the shopkeeper, who takes them with a nod; the cycle rickshaw passes behind. Locked-off camera, no movement. Sound: the lane's morning chatter, a bicycle bell, a temple bell far off. " + NOTEXT),
    ("c13-priya-papers", "k13-priya-papers", 5, "static",
     "Exactly as in the image: the bright office in the afternoon, the woman in the navy pinstripe kurta with the lanyard at her desk reading a document on a tablet held upright in her left hand with its screen toward her, a laptop open beside it with its lid toward the camera, a stapled printout and a pen on the desk. She scrolls the tablet with her right finger, reads, nods once with a small satisfied smile, and lowers the tablet a little. The tablet's screen stays turned toward her. Locked-off camera, no movement. Locked-off camera, no movement. Sound: a quiet office, a soft tap on glass, a page turning. " + NOTEXT),
    ("c14-office-dashboard", "k14-office-dashboard", 6, "static",
     "Exactly as in the image: the office at golden hour, the woman in the navy pinstripe kurta with the lanyard beside a slim man in a charcoal polo shirt, both looking at a large monitor showing a pale green dashboard with a rising line chart, stacked bars and cards, warm low light across the desk. She traces the rising line on the screen with her pen, he nods and says something, they both smile, and she leans back a little. Locked-off camera, no movement. Sound: a quiet office, a short warm laugh, a pen tapping the desk. " + NOTEXT),
    ("c15-lane-golden", "k15-lane-golden", 6, "static",
     "Exactly as in the image: golden hour in a busy lane in Hyderabad's old city, the woman in the maroon saree with the mustard blouse at the open door of her kirana shop holding a small yellow-orange mango drink tetra pack out to a young man in a pale blue checked shirt with a cloth bag, strings of unbranded sachets and jars at the door, scooters, a man with a sack, the low sun flaring down the lane, an old gateway's dome behind. The young man in the pale blue checked shirt takes the pack from her hand, nods his thanks and turns to walk on down the lane; she smiles after him; a scooter passes; the sun flares across the lens. Locked-off camera, no movement. Sound: an evening lane, a scooter, a distant temple bell, chatter. " + NOTEXT),
    ("c16-factory-line", "k16-factory-line", 5, "static",
     "Exactly as in the image: a clean beverage packaging hall, a stainless-steel filling line carrying rows of small yellow-orange mango drink tetra packs along a conveyor, a woman supervisor in a white coat, hairnet and safety glasses with a tablet, soft white industrial light, stacked kraft cartons on a pallet. The conveyor carries the packs steadily from left to right; she picks one pack up, checks it against her tablet, and sets it back on the line. Locked-off camera, no movement. Sound: a steady machine hum, the conveyor's belt, a soft beep. " + NOTEXT),
]


def main() -> None:
    only = set(sys.argv[1:])
    OUT.mkdir(exist_ok=True)
    (HOME / "frames").mkdir(parents=True, exist_ok=True)
    paths = Paths(app=DEFAULT_APP, app_data=DEFAULT_APP_DATA, home=HOME)
    backend = Backend(paths, idle_stop_minutes=10)
    try:
        for name, key, seconds, camera, prompt in CLIPS:
            if only and name not in only:
                continue
            out = OUT / f"{name}.mp4"
            if out.exists():
                print(f"skip {name}", flush=True)
                continue
            src = IMG / f"{key}.png"
            if not src.exists():
                src = HERE.parent / "img" / f"{key}.webp"  # the tracked copy
            if not src.exists():
                print(f"MISSING keyframe {key}; skipping {name}", flush=True)
                continue
            framed = frame_image(src, "16:9", HOME / "frames" / f"sc158-{name}.png", "pad")
            seed = 158000 + CLIPS.index((name, key, seconds, camera, prompt))
            request = {
                "prompt": prompt, "model": "fast", "resolution": RES, "duration": seconds, "fps": 24,
                "aspectRatio": "16:9", "cameraMotion": camera, "audio": True, "seed": seed,
                "imagePath": framed["path"], "lastImagePath": None, "loras": [],
            }
            print(f"== {name} {time.strftime('%H:%M:%S')} ({seconds} s, {camera}, seed {seed})", flush=True)
            started = time.monotonic()
            last = [""]

            def progress(percent, message, last=last):
                line = f"   {percent}% {message}"
                if line != last[0]:
                    last[0] = line
                    print(line, flush=True)

            video = backend.generate(request, progress)
            shutil.copy2(video, out)
            minutes = (time.monotonic() - started) / 60
            sidecar = {**{k: v for k, v in request.items() if k not in {"imagePath", "lastImagePath"}},
                       "image": str(src), "framed_first": framed["path"], "model": "LTX 2.5 Fast (local)",
                       "ltx_desktop": paths.app_version(), "minutes": round(minutes, 1), "ltx_output": str(video)}
            out.with_suffix(".json").write_text(json.dumps(sidecar, indent=2))
            print(f"   saved {out.name} in {minutes:.1f} min", flush=True)
    finally:
        backend.stop()
    print(f"== done {time.strftime('%H:%M:%S')}", flush=True)


if __name__ == "__main__":
    main()

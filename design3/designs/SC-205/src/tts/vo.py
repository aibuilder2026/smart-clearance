"""SC-205 voice-over on Kokoro-82M (Apache-2.0, local, free): one wav a line of lines.json, at the given speed,
trimmed of leading and trailing silence. Writes tts/vo/<voice>-<speed>/<id>.wav and durations.json beside them.

  ESPEAK-safe: espeak-ng ignores data paths over 160 characters, so its data is read from ~/.cache/sc200-espeak.
  tts/.venv-kokoro/bin/python tts/vo.py af_heart 0.96 [ids…]
"""
import json, os, sys
from pathlib import Path
import numpy as np, soundfile as sf
import misaki.espeak  # noqa: F401  (sets espeak's paths at import; the data path is replaced below)
from phonemizer.backend.espeak.wrapper import EspeakWrapper
EspeakWrapper.set_data_path(os.path.expanduser("~/.cache/sc200-espeak/espeak-ng-data"))
from kokoro import KPipeline

HERE = Path(__file__).resolve().parent
voice, speed, only = sys.argv[1], float(sys.argv[2]), set(sys.argv[3:])
lines = json.loads((HERE.parent / "lines.json").read_text())["lines"]
out = HERE / "vo" / f"{voice}-{speed:.2f}"; out.mkdir(parents=True, exist_ok=True)
pipe = KPipeline(lang_code="b" if voice.startswith("b") else "a", repo_id="hexgrad/Kokoro-82M", device="cpu")
durs = json.loads((out / "durations.json").read_text()) if (out / "durations.json").exists() else {}
for line in lines:
    if only and line["id"] not in only: continue
    chunks = [a.numpy() if hasattr(a, "numpy") else a for _, _, a in pipe(line.get("say", line["text"]), voice=voice, speed=speed, split_pattern=None)]
    audio = np.concatenate(chunks).astype(np.float32)
    loud = np.where(np.abs(audio) > 0.01)[0]
    a, b = max(0, loud[0] - int(0.04 * 24000)), min(len(audio), loud[-1] + int(0.12 * 24000))
    audio = audio[a:b]
    sf.write(out / f"{line['id']}.wav", audio, 24000)
    durs[line["id"]] = round(len(audio) / 24000, 3)
    print(line["id"], durs[line["id"]], flush=True)
(out / "durations.json").write_text(json.dumps(durs, indent=2))
print("total", round(sum(durs.values()), 1), "s")

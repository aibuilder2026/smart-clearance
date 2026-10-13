"""Kokoro-82M (Apache-2.0) candidates for the bake-off: one sample paragraph per voice, on the CPU."""
import sys, numpy as np, soundfile as sf
import os
import misaki.espeak  # noqa: F401  (sets espeak's paths at import; the data path is replaced below)
from phonemizer.backend.espeak.wrapper import EspeakWrapper
# espeak-ng drops a data path longer than 160 characters and falls back to its build path: a short symlink
EspeakWrapper.set_data_path(os.path.expanduser("~/.cache/sc200-espeak/espeak-ng-data"))
from kokoro import KPipeline
TEXT = open(sys.argv[1]).read().strip()
OUT = sys.argv[2]
for lang, voice, speed in [("a", "af_heart", 1.0), ("a", "af_bella", 1.0), ("b", "bf_emma", 1.0), ("b", "bf_isabella", 1.0), ("a", "am_michael", 1.0), ("b", "bm_george", 1.0)]:
    pipe = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M", device="cpu")
    chunks = [a.numpy() if hasattr(a, "numpy") else a for _, _, a in pipe(TEXT, voice=voice, speed=speed, split_pattern=r"\n+")]
    audio = np.concatenate(chunks)
    sf.write(f"{OUT}/kokoro-{voice}.wav", audio, 24000)
    print(voice, round(len(audio) / 24000, 2), "s", flush=True)

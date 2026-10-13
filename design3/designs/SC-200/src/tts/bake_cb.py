"""Chatterbox (Resemble AI, MIT) candidates for the bake-off: its own default voice, and conditioned on a Kokoro take
(a synthetic reference, so no real person's voice is cloned). One sentence at a time, joined with short pauses."""
import re, sys, time, numpy as np, soundfile as sf, torch
from chatterbox.tts import ChatterboxTTS
TEXT, OUT = open(sys.argv[1]).read().strip(), sys.argv[2]
dev = "mps" if torch.backends.mps.is_available() else "cpu"
t0 = time.time(); model = ChatterboxTTS.from_pretrained(device=dev); print("loaded on", dev, round(time.time() - t0, 1), "s", flush=True)
sents = [s for s in re.split(r"(?<=[.:!?])\s+", TEXT.replace("\n", " ")) if s]
for name, ref, ex, cfg in [("default", None, 0.5, 0.5), ("default-warm", None, 0.65, 0.4),
                           ("ref-heart", f"{OUT}/kokoro-af_heart.wav", 0.5, 0.5), ("ref-emma", f"{OUT}/kokoro-bf_emma.wav", 0.5, 0.5)]:
    torch.manual_seed(200); t0 = time.time(); parts = []
    for s in sents:
        wav = model.generate(s, audio_prompt_path=ref, exaggeration=ex, cfg_weight=cfg)
        parts += [wav.squeeze(0).cpu().numpy(), np.zeros(int(model.sr * 0.28), dtype=np.float32)]
    audio = np.concatenate(parts); sf.write(f"{OUT}/cb-{name}.wav", audio, model.sr)
    print(name, round(len(audio) / model.sr, 2), "s in", round(time.time() - t0, 1), "s", flush=True)

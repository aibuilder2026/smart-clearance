"""Predicted naturalness (UTMOS22 strong, via SpeechMOS) for each wav given: 1 (bad) to 5 (excellent)."""
import sys, json, librosa, torch
model = torch.hub.load("tarepan/SpeechMOS:v1.2.0", "utmos22_strong", trust_repo=True)
out = {}
for p in sys.argv[1:]:
    wav, sr = librosa.load(p, sr=16000, mono=True)
    with torch.no_grad():
        out[p] = round(float(model(torch.from_numpy(wav).unsqueeze(0), sr)), 3)
    print(f"{out[p]:.3f}  {p}", flush=True)

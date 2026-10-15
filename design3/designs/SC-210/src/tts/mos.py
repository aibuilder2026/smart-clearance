"""SC-206: predicted naturalness (UTMOS22 strong, via SpeechMOS) of every take in a folder, 1 (bad) to 5 (excellent),
into its parent's mos.json.   <kokoro venv>/bin/python mos.py vo3/<model>-<voice>/takes"""
import sys, json, librosa, torch
from pathlib import Path
model = torch.hub.load("tarepan/SpeechMOS:v1.2.0", "utmos22_strong", trust_repo=True)
folder = Path(sys.argv[1]); out = folder.parent / 'mos.json'
res = json.loads(out.read_text()) if out.exists() else {}
for p in sorted(folder.glob('*.wav')):
    if p.name in res: continue
    wav, sr = librosa.load(str(p), sr=16000, mono=True)
    with torch.no_grad():
        res[p.name] = round(float(model(torch.from_numpy(wav).unsqueeze(0), sr)), 3)
    print(f"{res[p.name]:.3f}  {p.name}", flush=True)
    out.write_text(json.dumps(res, indent=1))

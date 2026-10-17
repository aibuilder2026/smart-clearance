"""SC-238: predicted naturalness (UTMOS22 strong, via SpeechMOS, from the torch hub cache) of every take, 1 to 5, into
vo/<voice>/mos.json, for pick.py's tiebreak. SC-206's mos.py with soundfile and a numpy resampler in place of librosa.
   <snac venv>/bin/python mos.py vo/<voice>/takes"""
import sys, json
from pathlib import Path
import numpy as np, soundfile as sf, torch


def resample_poly(x, up, down, taps=96):
    """polyphase-free but correct: upsample by zero-stuffing, a windowed-sinc low-pass at the lower Nyquist, decimate"""
    y = np.zeros(len(x) * up, dtype=np.float64); y[::up] = x * up
    fc = 0.5 / max(up, down); n = np.arange(-taps * max(up, down), taps * max(up, down) + 1)
    h = 2 * fc * np.sinc(2 * fc * n) * np.blackman(len(n))
    return np.convolve(y, h, mode='same')[::down]
model = torch.hub.load("tarepan/SpeechMOS:v1.2.0", "utmos22_strong", trust_repo=True)
folder = Path(sys.argv[1]); out = folder.parent / 'mos.json'
res = json.loads(out.read_text()) if out.exists() else {}
for p in sorted(folder.glob('*.wav')):
    if p.name in res: continue
    wav, sr = sf.read(str(p), dtype='float32')
    if wav.ndim > 1: wav = wav.mean(1)
    if sr != 16000:
        g = np.gcd(sr, 16000); wav = resample_poly(wav, 16000 // g, sr // g).astype(np.float32)
    with torch.no_grad():
        res[p.name] = round(float(model(torch.from_numpy(wav).unsqueeze(0), 16000)), 3)
    print(f"{res[p.name]:.3f}  {p.name}", flush=True)
    out.write_text(json.dumps(res, indent=1))

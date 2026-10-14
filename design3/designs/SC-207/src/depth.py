"""SC-206: a depth map for each still the film moves through in 2.5D (Depth Anything V2 Small, local), 16-bit PNG,
near = bright.   tts/.venv-snac/bin/python depth.py img/o1b-carton-macro-L.png …"""
import sys
from pathlib import Path
import numpy as np, cv2, torch
from PIL import Image
from transformers import pipeline

HERE = Path(__file__).resolve().parent
pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf', device='cpu')
for p in sys.argv[1:]:
    p = Path(p)
    im = Image.open(p).convert('RGB')
    d = np.asarray(pipe(im)['predicted_depth'].squeeze(), dtype=np.float32)
    d = cv2.resize(d, im.size, interpolation=cv2.INTER_CUBIC)
    d = (d - d.min()) / max(1e-6, d.max() - d.min())
    out = HERE / 'build' / 'depth' / f'{p.stem}.png'
    cv2.imwrite(str(out), (d * 65535).astype(np.uint16))
    print(out.name, im.size, round(float(d.mean()), 3), flush=True)

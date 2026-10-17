"""SC-238: the 3D agents scene's footage. Each aerial clip (a1-godown, a2-town, a3-lane: LTX, 540p, 24 fps, a drone gliding
over the godown yard, the town and the kirana lanes) is interpolated to 60 fps (frc.py: RIFE or VideoToolbox, whichever
rebuilds the clip's own frames better), scaled to 1280 wide (lanczos), and written as JPEG frames into
agents3d/bg/<plate>/00001.jpg… with meta.json {frames, fps}; the scene plays them back and forth, so a glide out and back
reads as one flight.

   uv run --with numpy --with pillow python aerial.py [plates…]"""
import json, shutil, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import frc  # noqa: E402

PLATES = sys.argv[1:] or ['a1-godown', 'a2-town', 'a3-lane']
for p in PLATES:
    src = HERE / 'clips' / f'{p}.mp4'
    if not src.exists() or src.stat().st_size == 0: print(f'{p}: no clip yet'); continue
    out = HERE / 'agents3d' / 'bg' / p
    with tempfile.TemporaryDirectory(dir=str(HERE / 'build')) as td:
        mov = Path(td) / f'{p}-60.mov'
        big = Path(td) / f'{p}-sr.mov'                       # super-resolved first (Apple's ×4 model, down to 1920 wide)
        subprocess.run([str(HERE / 'vtfx' / 'vtfx'), 'sr', str(src), str(big), '--width', '1920'], check=True)
        subprocess.run([sys.executable, str(HERE / 'frc.py'), str(big), str(mov), '--fps', '60'], check=True)
        if out.exists(): shutil.rmtree(out)
        out.mkdir(parents=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mov), '-vf', 'scale=1280:-2:flags=lanczos', '-q:v', '3', str(out / '%05d.jpg')], check=True)
    n = len(list(out.glob('*.jpg')))
    (out / 'meta.json').write_text(json.dumps({'frames': n, 'fps': 60}))
    print(f'{p}: {n} frames at 60 fps')

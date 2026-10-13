# the address line the stage prints above each device, at given times: urls.py <rec> <out.jpg> t...
import subprocess, sys, tempfile
from PIL import Image
rec, out, *ts = sys.argv[1:]
rows = []
with tempfile.TemporaryDirectory() as d:
    for i, t in enumerate(ts):
        p = f'{d}/{i}.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', t, '-i', rec, '-frames:v', '1', '-vf', 'crop=2560:46:0:132', p], check=True)
        rows.append(Image.open(p))
sheet = Image.new('RGB', (2560, 46 * len(rows)))
for i, r in enumerate(rows): sheet.paste(r, (0, 46 * i))
sheet.save(out)

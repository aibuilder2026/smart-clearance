"""SC-238: a square keyframe padded to 16:9 for an outpainting edit (gen-qwen7.sh): the picture scaled to 90% and set
13% from the top (headroom for a medium shot), the margins filled with a heavy blur of its own edges so the model sees
the scene's light and colour where it must continue it.
   uv run --with pillow python pad169.py IN.png OUT.png"""
import sys
from PIL import Image, ImageFilter

src = Image.open(sys.argv[1]).convert('RGB')
W, H = 1820, 1024
s = 0.9; w, h = round(src.width * s), round(src.height * s)
x, y = (W - w) // 2, 80
bg = src.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(60))
canvas = bg.copy(); canvas.paste(src.resize((w, h), Image.LANCZOS), (x, y))
canvas.save(sys.argv[2]); print(sys.argv[2], canvas.size, (x, y, w, h))

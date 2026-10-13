import sys
from PIL import Image
out, *fs = sys.argv[1:]
n = len(fs); rows = (n + 1) // 2
sheet = Image.new('RGB', (1920, 540 * rows))
for i, f in enumerate(fs):
    sheet.paste(Image.open(f).resize((960, 540), Image.LANCZOS), ((i % 2) * 960, (i // 2) * 540))
sheet.save(out, quality=88)

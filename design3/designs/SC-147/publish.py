"""SC-147's published copy for Claude Design (app v3), pinned to a pushed commit: the board as `SC-147 design
review.html`, its styles from jsDelivr and its images from GitHub raw. Written into src/published/ (local only).
    python3 design3/designs/SC-147/publish.py <sha>
"""

import pathlib
import re
import sys

SHA = sys.argv[1]
HERE = pathlib.Path(__file__).parent
OUT = HERE / "src" / "published"
OUT.mkdir(parents=True, exist_ok=True)
REPO = "aibuilder2026/smart-clearance"
ROUND = "design3/designs/SC-147/"
JS = f"https://cdn.jsdelivr.net/gh/{REPO}@{SHA}/{ROUND}"
RAW = f"https://raw.githubusercontent.com/{REPO}/{SHA}/{ROUND}"

board = (HERE / "board.html").read_text()
board = re.sub(r'<img src="([^":]+)"', r'<img data-s="\1"', board)
board = board.replace('href="board.css"', f'href="{JS}board.css"')
board = board.replace(
    "</main>",
    f'</main>\n<script>var R="{RAW}";document.querySelectorAll("img[data-s]").forEach(function(i){{i.src=R+i.dataset.s}});</script>',
    1,
)
assert 'src="' not in re.sub(r"<script>.*?</script>", "", board, flags=re.S), "an image is left relative"
(OUT / "SC-147 design review.html").write_text(board)
print("\n".join(sorted(p.name for p in OUT.iterdir())))

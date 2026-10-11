"""SC-173's published copies for Claude Design (app v3), pinned to a pushed commit: the board as `SC-173 design
review.html`, its styles from jsDelivr and its images from GitHub raw; the papers are on it as
images, each mockup page staying in the repository. Written into src/published/ (local only).
    python3 design3/designs/SC-173/publish.py <sha>
"""

import pathlib
import re
import sys

SHA = sys.argv[1]
HERE = pathlib.Path(__file__).parent
OUT = HERE / "src" / "published"
OUT.mkdir(parents=True, exist_ok=True)
REPO = "aibuilder2026/smart-clearance"
ROUND = "design3/designs/SC-173/"
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
assert 'href="option-' not in board, "a paper link is left relative"
(OUT / "SC-173 design review.html").write_text(board)
print("\n".join(sorted(p.name for p in OUT.iterdir())))

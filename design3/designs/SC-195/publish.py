"""SC-195's published copies for Claude Design (app v3), pinned to a pushed commit: the board as `SC-195 design
review.html`, its images from GitHub raw; each option's mockup as `SC-195 sign-in A.html`, `SC-195 swing A.html` and so
on, the workspace's scripts and styles, and the round's own, from jsDelivr. Written into src/published/ (local only).
    python3 design3/designs/SC-195/publish.py <sha>
"""

import pathlib
import re
import sys

SHA = sys.argv[1]
HERE = pathlib.Path(__file__).parent
OUT = HERE / "src" / "published"
OUT.mkdir(parents=True, exist_ok=True)
REPO = "aibuilder2026/smart-clearance"
JS = f"https://cdn.jsdelivr.net/gh/{REPO}@{SHA}/design3/"
RAW = f"https://raw.githubusercontent.com/{REPO}/{SHA}/design3/"
ROUND = "designs/SC-195/"
PAGES = {"signin": "sign-in", "swing": "swing"}

board = (HERE / "board.html").read_text()
board = re.sub(r'<img src="([^":]+)"', r'<img data-s="\1"', board)
board = board.replace('href="board.css"', f'href="{JS}{ROUND}board.css"')
for part, name in PAGES.items():
    for letter in "abc":
        board = board.replace(f'href="{part}-{letter}/mockup.html?', f'href="SC-195%20{name}%20{letter.upper()}.html?')
board = board.replace(
    "</main>",
    f'</main>\n<script>var R="{RAW}{ROUND}";document.querySelectorAll("img[data-s]").forEach(function(i){{i.src=R+i.dataset.s}});</script>',
    1,
)
assert "mockup.html" not in board, "a mockup link is left"
(OUT / "SC-195 design review.html").write_text(board)

for part, name in PAGES.items():
    for letter in "abc":
        d = f"{part}-{letter}"
        page = (HERE / d / "mockup.html").read_text()
        page = page.replace('href="../round.css"', f'href="{JS}{ROUND}round.css"').replace('src="../swing.js"', f'src="{JS}{ROUND}swing.js"')
        page = page.replace('href="opt.css"', f'href="{JS}{ROUND}{d}/opt.css"').replace('src="opt.js"', f'src="{JS}{ROUND}{d}/opt.js"')
        page = page.replace("__IMG_SHA__", SHA).replace('"../../../system/img/"', f'"{JS}system/img/"')
        page = page.replace('"../../../', f'"{JS}')
        assert "../" not in page, f"{d}: a relative path is left"
        (OUT / f"SC-195 {name} {letter.upper()}.html").write_text(page)

print("\n".join(sorted(p.name for p in OUT.iterdir())))

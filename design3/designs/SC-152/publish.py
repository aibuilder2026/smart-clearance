"""SC-152's published copies for Claude Design (app v3), pinned to a pushed commit: the board as `SC-152 design
review.html`, its images from GitHub raw; today's page and each option's lab as `SC-152 today.html`, `SC-152 option
A.html` and so on, the design system and the lab's scripts and styles from jsDelivr. Written into src/published/.
    python3 design3/designs/SC-152/publish.py <sha>
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
ROUND = "designs/SC-152/"
PAGES = {"current": "SC-152 today.html", "option-a": "SC-152 option A.html", "option-b": "SC-152 option B.html", "option-c": "SC-152 option C.html"}

board = (HERE / "board.html").read_text()
board = re.sub(r'<img src="([^":]+)"', r'<img data-s="\1"', board)
board = board.replace('href="board.css"', f'href="{JS}{ROUND}board.css"')
for d, name in PAGES.items():
    board = board.replace(f'href="{d}/mockup.html', f'href="{name.replace(" ", "%20")}')
board = board.replace(
    "</main>",
    f'</main>\n<script>var R="{RAW}{ROUND}";document.querySelectorAll("img[data-s]").forEach(function(i){{i.src=R+i.dataset.s}});</script>',
    1,
)
assert 'mockup.html' not in board
(OUT / "SC-152 design review.html").write_text(board)

for d, name in PAGES.items():
    page = (HERE / d / "mockup.html").read_text()
    page = page.replace('"../lab.css"', f'"{JS}{ROUND}lab.css"').replace('"../lab.js"', f'"{JS}{ROUND}lab.js"')
    page = page.replace('"opt.css"', f'"{JS}{ROUND}{d}/opt.css"').replace('"opt.js"', f'"{JS}{ROUND}{d}/opt.js"')
    page = page.replace('"../../../', f'"{JS}')
    assert "../" not in page, f"{d}: a relative path is left"
    (OUT / name).write_text(page)

print("\n".join(sorted(p.name for p in OUT.iterdir())))

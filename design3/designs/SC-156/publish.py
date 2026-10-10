"""SC-156's published copies for Claude Design (app v3), pinned to a pushed commit: the board as `SC-156 design
review.html` with its images from GitHub raw, and the options page as `SC-156 option A.html` (B, C), its design system
and scripts from jsDelivr. Written into src/published/ (local only).
    python3 design3/designs/SC-156/publish.py <sha>
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
ROUND = "designs/SC-156/"

board = (HERE / "board.html").read_text()
board = re.sub(r'<img src="([^":]+)"', r'<img data-s="\1"', board)
for letter in "ABC":
    board = board.replace(f'href="options/mockup.html?opt={letter.lower()}', f'href="SC-156%20option%20{letter}.html?opt={letter.lower()}')
board = board.replace("</main>", f'</main>\n<script>var R="{RAW}{ROUND}";document.querySelectorAll("img[data-s]").forEach(function(i){{i.src=R+i.dataset.s}});</script>', 1)
(OUT / "SC-156 design review.html").write_text(board)

page = (HERE / "options" / "mockup.html").read_text()
page = page.replace('href="sc156.css"', f'href="{JS}{ROUND}options/sc156.css"').replace('src="sc156.js"', f'src="{JS}{ROUND}options/sc156.js"')
page = page.replace('"../../../system/img/"', f'"{JS}system/img/"').replace('"../../../', f'"{JS}')
assert "../" not in page, "a relative path is left"
for letter in "ABC":
    (OUT / f"SC-156 option {letter}.html").write_text(page)
print("\n".join(sorted(p.name for p in OUT.iterdir())))

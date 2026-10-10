"""SC-157's published copies for Claude Design (app v3), pinned to a pushed commit: the board as `SC-157 design
review.html` with its images from GitHub raw, and each option's page as `SC-157 option A.html` and so on, the app's
scripts, styles and this round's from jsDelivr, the images from GitHub raw. Written into src/published/ (local only).
    python3 design3/designs/SC-157/publish.py <sha>
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
ROUND = "designs/SC-157/"

board = (HERE / "board.html").read_text()
board = re.sub(r'<img src="([^":]+)"', r'<img data-s="\1"', board)
for letter in "ABC":
    board = board.replace(f'href="option-{letter.lower()}/mockup.html', f'href="SC-157%20option%20{letter}.html')
board = board.replace("</main>", f'</main>\n<script>var R="{RAW}{ROUND}";document.querySelectorAll("img[data-s]").forEach(function(i){{i.src=R+i.dataset.s}});</script>', 1)
(OUT / "SC-157 design review.html").write_text(board)

for letter in "abc":
    page = (HERE / f"option-{letter}" / "mockup.html").read_text()
    for f in ("sc157.css", "roles157.js", "sc157-kit.js"):
        page = page.replace(f'"../{f}"', f'"{JS}{ROUND}{f}"')
    page = page.replace('src="opt.js"', f'src="{JS}{ROUND}option-{letter}/opt.js"')
    page = page.replace("__IMG_SHA__", SHA).replace('"../../../system/img/"', f'"{JS}system/img/"').replace('"../../../', f'"{JS}')
    assert "../" not in page, f"option {letter}: a relative path is left"
    (OUT / f"SC-157 option {letter.upper()}.html").write_text(page)
print("\n".join(sorted(p.name for p in OUT.iterdir())))

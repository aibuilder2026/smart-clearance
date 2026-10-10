"""SC-142's published copies for Claude Design (app v3), pinned to a pushed commit: the board as `SC-142 design
review.html`, its images from GitHub raw; each option's mockup as `SC-142 option A.html` and so on, the workspace's
scripts and styles from jsDelivr. Written into src/published/ (local only).
    python3 design3/designs/SC-142/publish.py <sha>
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
ROUND = "designs/SC-142/"

board = (HERE / "board.html").read_text()
board = re.sub(r'<img src="([^":]+)"', r'<img data-s="\1"', board)
for letter in "ABC":
    board = board.replace(f'href="option-{letter.lower()}/mockup.html?', f'href="SC-142%20option%20{letter}.html?')
board = board.replace(
    "</main>",
    f'</main>\n<script>var R="{RAW}{ROUND}";document.querySelectorAll("img[data-s]").forEach(function(i){{i.src=R+i.dataset.s}});</script>',
    1,
)
(OUT / "SC-142 design review.html").write_text(board)

for letter in "abc":
    page = (HERE / f"option-{letter}" / "mockup.html").read_text()
    page = page.replace('href="../rk.css"', f'href="{JS}{ROUND}rk.css"').replace('src="../rk.js"', f'src="{JS}{ROUND}rk.js"')
    page = page.replace('src="opt.js"', f'src="{JS}{ROUND}option-{letter}/opt.js"')
    page = page.replace("__IMG_SHA__", SHA).replace('"../../../system/img/"', f'"{JS}system/img/"')
    page = page.replace('"../../../', f'"{JS}')
    base = f'/claudeusercontent\\.com$/.test(location.hostname) ? "{RAW}{ROUND}" : "{JS}{ROUND}"'
    page = page.replace("<script>window.SC3_IMG", f"<script>window.SCR_BASE = {base};</script>\n<script>window.SC3_IMG", 1)
    assert "../" not in page, f"option {letter}: a relative path is left"
    (OUT / f"SC-142 option {letter.upper()}.html").write_text(page)

print("\n".join(sorted(p.name for p in OUT.iterdir())))

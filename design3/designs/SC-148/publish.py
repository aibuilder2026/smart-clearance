"""SC-148's published copies for Claude Design (app v3), pinned to a pushed commit: the board as `SC-148 design
review.html`, its styles from jsDelivr and its images from GitHub raw, and each option's papers as `SC-148 option A
invoice.html`, `SC-148 option A credit note.html` and so on (self-contained). Written into src/published/ (local only).
    python3 design3/designs/SC-148/publish.py <sha>
"""

import pathlib
import re
import sys

SHA = sys.argv[1]
HERE = pathlib.Path(__file__).parent
OUT = HERE / "src" / "published"
OUT.mkdir(parents=True, exist_ok=True)
REPO = "aibuilder2026/smart-clearance"
ROUND = "design3/designs/SC-148/"
JS = f"https://cdn.jsdelivr.net/gh/{REPO}@{SHA}/{ROUND}"
RAW = f"https://raw.githubusercontent.com/{REPO}/{SHA}/{ROUND}"
PAPERS = {"invoice": "invoice", "credit-note": "credit note"}

board = (HERE / "board.html").read_text()
board = re.sub(r'<img src="([^":]+)"', r'<img data-s="\1"', board)
board = board.replace('href="board.css"', f'href="{JS}board.css"')
for letter in "abc":
    for file, name in PAPERS.items():
        board = board.replace(f'href="option-{letter}/{file}.html"', f'href="SC-148%20option%20{letter.upper()}%20{name.replace(" ", "%20")}.html"')
        page = (HERE / f"option-{letter}" / f"{file}.html").read_text()
        assert "../" not in page and 'src="' not in page, f"option {letter} {file}: not self-contained"
        (OUT / f"SC-148 option {letter.upper()} {name}.html").write_text(page)
board = board.replace(
    "</main>",
    f'</main>\n<script>var R="{RAW}";document.querySelectorAll("img[data-s]").forEach(function(i){{i.src=R+i.dataset.s}});</script>',
    1,
)
assert 'href="option-' not in board, "a paper link is left relative"
(OUT / "SC-148 design review.html").write_text(board)
print("\n".join(sorted(p.name for p in OUT.iterdir())))

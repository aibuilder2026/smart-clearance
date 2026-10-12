"""SC-196's mockup pages: each option is the live workspace's sign-in (?state=signin) and the console's sign-in, with
the kit's AgentStage replaced below desktops by ../p.js (shared) and the option's opt.js.
    python3 design3/designs/SC-196/pages.py
"""

import pathlib

HERE = pathlib.Path(__file__).parent
W = (HERE / "workspace.tmpl.html").read_text()
C = (HERE / "console.tmpl.html").read_text()
MODE = """if (!q.has("state")) { q.set("state", "signin"); history.replaceState(null, "", location.pathname + "?" + q.toString() + location.hash); }
    window.SC3_LIVE = true;"""
OPTIONS = [
    ("A", "The ring", "the eleven agents round a circle, every one a tile, the caption in its middle"),
    ("B", "The relay", "the agents on one track as the batch meets them, the three exits stacked at Execute"),
    ("C", "Around the card", "the field and the agents round the whole sign-in, a pill at the top saying who is at work"),
]
for letter, title, desc in OPTIONS:
    d = HERE / f"option-{letter.lower()}"
    d.mkdir(exist_ok=True)
    w = W.replace("@PAGE@", "workspace sign-in").replace("@PAGEDESC@", "Munchly Foods' workspace sign-in")
    w = w.replace("@L@", letter).replace("@TITLE@", title).replace("@DESC@", desc)
    w = w.replace("@MODENOTE@", "The workspace as the live workspace's sign-in (?state=signin).").replace("@MODE@", MODE)
    (d / "workspace.html").write_text(w)
    c = C.replace("@L@", letter).replace("@TITLE@", title)
    (d / "console.html").write_text(c)
print("pages written")

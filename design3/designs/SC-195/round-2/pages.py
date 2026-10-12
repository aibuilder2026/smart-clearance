"""SC-195 round 2's mockup pages, from round 1's template: each option is the live workspace's sign-in (?state=signin)
with a stage of Smart-Clearance's own, drawn by ../r2.js (shared) and opt.js.
    python3 design3/designs/SC-195/round-2/pages.py
"""

import pathlib

HERE = pathlib.Path(__file__).parent
T = (HERE.parent / "mockup.tmpl.html").read_text().replace('"../../../', '"../../../../')
MODE = """if (!q.has("state")) { q.set("state", "signin"); history.replaceState(null, "", location.pathname + "?" + q.toString() + location.hash); }
    window.SC3_LIVE = true;"""
OPTIONS = [
    ("A", "The agent mesh", "ThreeUI's constellation drifting behind the whole sign-in; the ten agents and the person light in turn as a batch walks the nine stops, the yes fanning out to the three exits"),
    ("B", "Agents at work", "a deck of live agent runs in depth: each stop's run arrives at the front, the ones before it recede into the blur"),
    ("C", "The route", "the mark's S as the route through the nine stops, each agent at its stop; at Execute it forks into the exits, and the pin lands at the end"),
]
for letter, title, desc in OPTIONS:
    d = HERE / f"option-{letter.lower()}"
    d.mkdir(exist_ok=True)
    page = T.replace("@PARTNAME@", "round 2 · sign-in").replace("@PARTDESC@", "its sign-in's stage, Smart-Clearance's own")
    page = page.replace("@L@", letter).replace("@TITLE@", title).replace("@DESC@", desc)
    page = page.replace("@MODENOTE@", "The workspace as the live workspace's sign-in (?state=signin).").replace("@MODE@", MODE)
    page = page.replace('<link rel="stylesheet" href="../round.css">', '<link rel="stylesheet" href="../r2.css">')
    page = page.replace("@PRE@\n", "").replace("@POST@", '<script src="../r2.js"></script>\n<script src="opt.js"></script>')
    (d / "mockup.html").write_text(page)
print("pages written")

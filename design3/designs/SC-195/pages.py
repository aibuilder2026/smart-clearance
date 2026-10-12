"""SC-195's mockup pages, from mockup.tmpl.html: each option is the workspace itself with only that part changed.
The sign-in's options (signin-a/b/c) are the live workspace's sign-in (?state=signin), each with its own stage and
backdrop (opt.js, after the screens). The swing's options (swing-a/b/c) are Priya on the Mango Drink's page once it has
cleared, on the stub (?story=chips for the chips, whose counter moved the swing), each wrapping the kit's TrackerCard
(pre.js, before the screens take it).
    python3 design3/designs/SC-195/pages.py
"""

import pathlib

HERE = pathlib.Path(__file__).parent
T = (HERE / "mockup.tmpl.html").read_text()

SIGNIN_MODE = """if (!q.has("state")) { q.set("state", "signin"); history.replaceState(null, "", location.pathname + "?" + q.toString() + location.hash); }
    window.SC3_LIVE = true;"""
SWING_MODE = """// the stub registers its service worker; a mockup page has none
    try { if (navigator.serviceWorker) navigator.serviceWorker.register = function () { return Promise.resolve(); }; } catch (e) {}
    try {
      localStorage.setItem("sc3-session", JSON.stringify({ uid: "priya" }));
      localStorage.removeItem("sc3-store");
    } catch (e) {}
    window.SC195_STORY = q.get("story") === "chips" ? "chips" : "mango";
    if (!location.hash) history.replaceState(null, "", location.pathname + location.search + (window.SC195_STORY === "chips" ? "#/journey/MF-2409-117" : "#/journey/MF-2410-118"));"""
# the stub's journey at its end (the batch cleared), before the app reads the store
STORY = """<script>SC3_FLOW.useScenario(window.SC195_STORY); SC3_FLOW.fastForward(9);</script>"""

PARTS = {
    "signin": ("Sign-in", "its sign-in's backdrop and products", "the live workspace's sign-in (?state=signin)", SIGNIN_MODE, [
        ("A", "In focus", "one photograph: Munchly's packs sharp on a kirana counter, the shop soft behind them, under the frosted card"),
        ("B", "The range, behind glass", "the films' depot aisle blurred behind everything, and Munchly's range standing on a glass shelf"),
        ("C", "The brand's own light", "no photograph: a soft-focus field in the brand's inks, and the three packs composed large, with their names"),
    ]),
    "swing": ("Swing", "the swing explained", "Priya on a cleared batch's page, on the stub", SWING_MODE, [
        ("A", "How it adds up", "a note under the figure opens the working: the bin's cost, what each exit did, the swing, a bridge from one to the other, and how the loss was kept small"),
        ("B", "Beside the figure", "a disclosure under the figure opens two columns in place: destroyed against the plan, line by line, the difference the swing"),
        ("C", "Pack by pack", "an info button beside the swing opens where it came from: each exit's share of it, and what a pack fetched against the bin"),
    ]),
}

for part, (name, pdesc, modenote, mode, options) in PARTS.items():
    for letter, title, desc in options:
        d = HERE / f"{part}-{letter.lower()}"
        d.mkdir(exist_ok=True)
        page = T.replace("@PARTNAME@", name).replace("@PARTDESC@", pdesc).replace("@L@", letter).replace("@TITLE@", title)
        page = page.replace("@DESC@", desc).replace("@MODENOTE@", "The workspace as " + modenote + ".").replace("@MODE@", mode)
        if part == "signin":
            page = page.replace("@PRE@\n", "").replace("@POST@", '<script src="opt.js"></script>')
        else:
            page = page.replace("@PRE@", STORY + '\n<script src="../swing.js"></script>\n<script src="opt.js"></script>').replace("@POST@\n", "")
        (d / "mockup.html").write_text(page)
print("pages written")

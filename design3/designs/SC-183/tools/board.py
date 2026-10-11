"""SC-183's review board: board.html from the stills, each figure sized from its file.
    python3 design3/designs/SC-183/tools/board.py
"""

import html
import pathlib

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent.parent


def fig(src, alt, cap):
    w, h = Image.open(HERE / src).size
    return f'<figure><img src="{src}" width="{w}" height="{h}" loading="lazy" alt="{html.escape(alt)}"><figcaption>{cap}</figcaption></figure>'


def grid(cls, *figs, style=""):
    st = f' style="{style}"' if style else ""
    return f'<div class="{cls}"{st}>' + "".join(figs) + "</div>"


NAME = {"a": "On his screen", "b": "On the certificate", "c": "On their own phones"}


def option(o, rec, lead, bullets, trade):
    first = "sign" if o != "c" else "phone"
    sign_caps = {"a": "The sheet: who signs, what they sign to, the pad", "b": "Sign here opens the same sheet"}
    top = grid(
        "duo",
        fig(f"option-{o}/dist-1440-light.webp", f"Option {o.upper()}: Rakesh's destruction screen, two of the four signed.", "Rakesh · two signed, two to go"),
        fig(
            f"option-{o}/sign-1440-light.webp" if o != "c" else f"option-{o}/done-1440-light.webp",
            f"Option {o.upper()}: a signature being drawn." if o != "c" else "Option C: all four signed, Send on.",
            sign_caps.get(o, "All four signed: Send is on"),
        ),
        fig(f"option-{o}/dist-390-light.webp", f"Option {o.upper()} on a phone.", "On a phone"),
        fig(
            f"option-{o}/{first}-390-light.webp",
            f"Option {o.upper()}: signing on a phone." if o != "c" else "Option C: a witness signing on her own phone.",
            "Signing on a phone" if o != "c" else "Asha Kale's own phone",
        ),
    )
    mid = grid(
        "duo",
        fig(f"option-{o}/priya-1440-light.webp", f"Option {o.upper()}: Priya's review with the four signatures.", "Priya · the review, the signatures drawn once as signed"),
        fig(f"option-{o}/paper-1440-light.webp", f"Option {o.upper()}: the certificate as issued, signed as drawn.", "The certificate as issued"),
        fig(f"option-{o}/priya-390-light.webp", f"Option {o.upper()}: Priya's review on a phone.", "Priya on a phone"),
        fig(
            f"option-{o}/phone-done-390-light.webp" if o == "c" else f"option-{o}/done-1440-light.webp",
            "Option C: signed, on her phone." if o == "c" else f"Option {o.upper()}: all four signed, Send on.",
            "Signed, on her phone" if o == "c" else "All four signed: Send is on",
        ),
        style="margin-top:12px",
    )
    dark = grid(
        "duo",
        fig(f"option-{o}/dist-1440-dark.webp", f"Option {o.upper()}, dark.", "Dark"),
        fig(f"option-{o}/priya-1440-dark.webp", f"Option {o.upper()}: Priya's review, dark.", "Priya, dark"),
        fig(f"option-{o}/dist-390-dark.webp", f"Option {o.upper()} on a phone, dark.", "On a phone, dark"),
        fig(
            f"option-{o}/phone-390-dark.webp" if o == "c" else f"option-{o}/sign-1440-dark.webp",
            "Option C: her phone, dark." if o == "c" else f"Option {o.upper()}: the sheet, dark.",
            "Her phone, dark" if o == "c" else "The sheet, dark",
        ),
        style="margin-top:12px",
    )
    lis = "".join(f"<li>{b}</li>" for b in bullets)
    tr = "".join(f"<li>{t}</li>" for t in trade)
    return (
        f'<section class="opt{" rec" if rec else ""}" id="opt-{o}"><header><h3>Option {o.upper()} · {NAME[o]}</h3>'
        + ('<span class="tag">Recommended</span>' if rec else "")
        + f'<span style="flex-basis:100%;height:0"></span><p>{lead}</p></header><ul>{lis}</ul>'
        + f'<dl class="facts"><dt>Trade-offs</dt><dd><ul>{tr}</ul></dd></dl>'
        + top + mid + dark + "</section>"
    )


A = option(
    "a", True,
    "Four places on Rakesh's destruction screen, under the witnesses. He hands the tablet to each of them in turn, once the cover is done.",
    [
        "<b>Each place</b> names who signs (the agency's officer, each witness, Rakesh for the goods he handed over) and opens a sheet: the sentence they sign to, a pad for a finger or a stylus, and <b>Sign as Pradeep</b>. Signed, the place shows the ink and the time, with Clear.",
        "<b>Send</b> waits for all four: “2 of 4 signed: Asha Kale and Rakesh Jaiswal still to sign.”",
        "<b>Priya</b> sees the four under the photos, each drawn once as it was signed, with who, what for and when: “On Rakesh Traders' tablet, 13:22 to 13:25, after the cover at 13:20.”",
    ],
    [
        "The fewest steps: one device, one screen, the flow he already uses for the photos.",
        "Works anywhere the tablet works, with no signal needed for the others.",
        "The officer and the witnesses sign on his device: the evidence that they were there is the time, the photos and the agency's own record, not a device of their own.",
    ],
)
B = option(
    "b", False,
    "The certificate itself, laid out from what he entered, with a numbered Sign here in each signature's own place. What is signed is exactly the page that is issued.",
    [
        "<b>The page</b> is the agency's certificate as it will be issued, stamped “TO SIGN”: the goods, the facility, the time, then the four places. A bar counts “2 of 4 signed”, and names who is next.",
        "<b>Sign here</b> opens the same sheet as A; the ink lands on the page in its place, with the time under it.",
        "<b>Priya</b> reviews the page as signed, stamped “SIGNED”, in her sheet beside the photos and Vision's checks.",
    ],
    [
        "What each person signs is the page itself, as on paper: the clearest consent.",
        "On a phone the page is long: the places are a scroll apart, and the type is small.",
        "The form above and the page below say the same things twice on his screen.",
    ],
)
C = option(
    "c", False,
    "The officer and each witness sign on their own phone: each scans a code on Rakesh's screen and signs on a page that needs no app and no account. Rakesh signs last, on his own screen.",
    [
        "<b>Rakesh's screen</b> lists the four: a code to scan for each who has not signed, and each signature as it lands, “Signed 13:23 on his own phone · at the facility, within 40 m”.",
        "<b>The signer's phone</b> opens the agency's certificate to sign: the goods, the place, the time, the sentence, the name and the last four of their ID, the pad. The phone's place and time are kept with the signature.",
        "<b>Priya</b> sees the four as in A, each with the device it was signed on, and every phone within 40 m of cell 4.",
    ],
    [
        "The strongest evidence: four devices, each with its own time and place, which is harder to fake.",
        "Each signer needs a phone with data at the landfill, and the agency's officer and witnesses meet a new page.",
        "The most to build: a public signing page outside sign-in, one-time links that expire, and the guided demo needs a phone for each signer.",
    ],
)

TODAY = grid(
    "four",
    fig("current/destroy-1440-light.webp", "Today: Rakesh's destruction screen, the photos, the agency, the time and two witnesses by name, then Send.", "Rakesh · the witnesses named, nobody signs"),
    fig("current/review-1440-light.webp", "Today: Priya's review sheet, the photos, Vision's checks and what her yes issues.", "Priya · photos and Vision's checks"),
    fig("current/destroy-390-dark.webp", "Today on a phone, dark.", "On a phone, dark"),
) + grid(
    "desks",
    fig("current/certificate-sigs-1440-light.webp", "Today: the certificate's signatures, each a specimen on file, the officer's beside the agency's seal.", "The certificate · four specimens on file"),
    '<div class="card"><h3 class="sub">Nobody signs on screen</h3><p>Rakesh names the two witnesses on his destruction screen, but nobody signs there. The certificate\'s four signatures are specimens on file (SC-174): the same ink on every certificate, whoever was there.</p></div>',
    style="margin-top:12px",
)

PAGE = f"""<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SC-183 Live signatures</title>
<meta name="description" content="Three ways for the agency's officer, the two witnesses and the distributor to sign the certificate of destruction live as the evidence is sent, and for Priya to see the same signatures.">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&display=swap">
<link rel="stylesheet" href="board.css">
<body>
<main class="wrap">
<h1>Live signatures on the certificate</h1>
<p class="lede">SC-183 · Munchly's workspace · the slow week's chips: <b>144 packs</b> of MF-2409-117 destroyed at the municipal landfill, Bhandewadi, through Orange City Enviro Services, certificate <b>OCE/DC/26-27/0219</b>. Three ways for the four people at the landfill to sign as Rakesh sends the evidence, and for Priya to see the same signatures.</p>
<p>The request (11 Oct):</p>
<blockquote><b>“I want that on Destruction Certificate Signatures are put live, when Evidence is being asked for, Distributor will upload photos and also there should space where witnesses, distrubotor and supervisors will put on a sign, and same sign should be seen by Supply chain operator too.”</b></blockquote>

<h2>Today</h2>
{TODAY}
<div class="desks" style="margin-top:12px">
<div class="card"><h3 class="sub">Priya sees no signature</h3><p>Her review has the two photos, Vision's four checks and what her yes issues. The signatures appear only on the certificate her yes issues.</p></div>
<div class="card"><h3 class="sub">What a live signature adds</h3><p>Each person signs for what they did or saw, at the landfill, with the time. The same strokes then go everywhere the signature shows: Priya's review, the certificate and its PDF, Rakesh's papers and the batch's Record.</p></div>
</div>

<h2>In every option</h2>
<div class="shared">
<div class="card"><h3 class="sub">Four signers, four sentences</h3><ul>
<li><b>The supervising officer</b> signs that the agency destroyed the packs, and its seal goes beside the signature.</li>
<li><b>Each independent witness</b> signs that they watched it and works for neither firm.</li>
<li><b>Rakesh</b> signs for the goods he handed over.</li>
</ul><p>Send waits for all four. Vision's checks gain “Four signatures”. Ask again keeps them, unless Priya asks for them again.</p></div>
<div class="card"><h3 class="sub">The signature as drawn</h3><p>The pad keeps each signature as its strokes, a few kilobytes and no image file, with the time it was signed. The certificate's PDF draws the same strokes. The pad works with a finger, a stylus or a mouse. <b>Type the name instead</b> is there for anyone who cannot draw on glass, and the certificate marks that signature as typed.</p></div>
<div class="card"><h3 class="sub">Motion</h3><p>On Priya's review each signature draws itself once, as it was signed: 1.6 s a signature, a quarter of a second apart, 2.35 s in all, then holds. Under reduced motion they are there at once. Nothing else moves.</p></div>
</div>

{A}
{B}
{C}

<h2>Recommended: A, on his screen</h2>
<div class="rec-box"><p><b>On his screen</b> puts the space for the signatures where the request puts it: on the destruction screen, next to the photos Rakesh sends. It works on the one device he already has at the landfill, with no new page for the agency's people, and Priya sees exactly what was drawn, as it was drawn. <b>B</b> is the closer copy of signing paper, at the cost of a long page on a phone. <b>C</b> is the stronger evidence, and the most to build.</p></div>

<h2>What the build touches</h2>
<div class="shared">
<div class="card"><h3 class="sub">design3, then the port</h3><ul><li>A signature pad and its sheet in the kit (<code>system/kit.jsx</code>, core's <code>SignPad</code>), with the Lucide <code>signature</code> icon.</li><li>The destruction screen (<code>trade.jsx</code>), Priya's review (<code>brand.jsx</code>), the certificate and its log (<code>finance.jsx</code>): the strokes in place of the specimens.</li><li>The stub's flow; the a11y spec scans the pad and the sheet.</li></ul></div>
<div class="card"><h3 class="sub">backend-api and the agents</h3><ul><li>The evidence carries the four signatures: strokes, the time, drawn or typed. backend-api refuses the evidence without all four.</li><li>The case, the certificate, Rakesh's papers and the Record carry the signatures. Paperwork draws them in <code>destruction.html</code>.</li><li>The contract's <code>DestructionInput</code> and <code>WsDestruction</code> gain the signatures. No migration: the signatures live in the case's JSON.</li></ul></div>
<div class="card"><h3 class="sub">C adds</h3><ul><li>A signing page outside sign-in, reached by a one-time link that expires, with a rate limit.</li><li>Each phone's place and time, with the signature.</li><li>A live update to Rakesh's and Priya's screens as each signature lands.</li></ul></div>
</div>

<div class="q" style="margin-top:20px"><h3>To decide</h3><ul>
<li>One of A, B or C.</li>
<li><b>The pilot quarter's three certificates</b> (DGW/DC/26-27/0085, OCE/DC/26-27/0217 and 0218) were signed before this. Should they keep their specimen signatures, as signed on paper (recommended), or carry drawn ones too?</li>
<li><b>Type the name instead:</b> keep it, so a signer who cannot draw on glass can still sign, the certificate marking it as typed (recommended)?</li>
</ul></div>

<footer>Smart-Clearance · SC-183 · every company, person, signature, place and figure fictional · the signatures are the specimen scans traced to pen strokes (<code>tools/strokes.py</code>) · mockups: <code>options/mockup.html?opt=a|b|c&amp;view=dist|sign|priya|paper|phone</code> on the app itself, its stub at the slow week</footer>
</main>
</body>
</html>
"""
(HERE / "board.html").write_text(PAGE)
print("board.html", len(PAGE))

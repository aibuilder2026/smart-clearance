"""The signature maker (SC-174): every signatory's specimen signature on file, and every firm's rubber stamp or seal.

Each signature is a Qwen-Image 2.1 scan of the name written in ballpoint ink on plain paper (src/<id>.png, local only),
keyed to its ink (ink.py) into system/img/signatures/<id>.webp, with its .prompt.json sidecar. The stamps and seals are
drawn (seals.mjs), not generated. Every person, firm, signature and number is fictional.

    python3 design3/system/signatures/make.py signatures     # key every scan in src/ that has a signatory below
    node design3/system/signatures/seals.mjs                 # draw every stamp and seal
The Qwen prompts are src/gen.sh's (and SC-173's for the first six); a scan is rendered with
    qwen_image_bf16_mac.py "<PROMPT with the name and ink>" --aspect 16:9 --size 1024 --seed <seed>
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "img" / "signatures"
PROMPT = (
    'A single handwritten signature of the name "{name}" written quickly in {ink} ballpoint pen ink on plain white paper, '
    "fluent joined cursive strokes leaning slightly right, the first letters large and looping, the rest trailing off, one "
    "short underline flourish, a flat even scan of the paper, nothing else on the page, no printed text, no lines, "
    "centered, high contrast"
)
# id: (the name as written, the ink, the seed, who signs with it)
SIGNATORIES = {
    "munchly": ("Vinod Patwardhan", "dark blue", 1203, "Vinod Patwardhan, Head of Accounts, Munchly Foods Ltd"),
    "rakesh": ("Rakesh Jaiswal", "dark blue", 1101, "Rakesh Jaiswal, Proprietor, Rakesh Traders"),
    "lakshmi": ("K. L. Narayana", "black", 1601, "K. Lakshmi Narayana, Partner, Lakshmi Agencies"),
    "patil": ("Sanjay Patil", "dark blue", 1701, "Sanjay Patil, Proprietor, Patil Distributors"),
    "gupta": ("Ramesh Gupta", "black", 1801, "Ramesh Gupta, Partner, Gupta & Sons"),
    "oce": ("S. Bhoyar", "dark blue", 1301, "Sachin Bhoyar, Site supervisor, Orange City Enviro Services"),
    "vwc": ("R. Dhote", "dark blue", 1901, "Rahul Dhote, Site supervisor, Vidarbha Waste Care"),
    "dgw": ("M. Srinivas Reddy", "black", 2001, "M. Srinivas Reddy, Site supervisor, Deccan Green Waste Management"),
    "oce-w1": ("Pradeep Meshram", "black", 1401, "Pradeep Meshram, an independent witness on Orange City Enviro Services' panel"),
    "oce-w2": ("Asha Kale", "dark blue", 1501, "Asha Kale, an independent witness on Orange City Enviro Services' panel"),
    "vwc-w1": ("Vijay Thakre", "black", 2101, "Vijay Thakre, an independent witness on Vidarbha Waste Care's panel"),
    "vwc-w2": ("Sunita Wankhede", "dark blue", 2201, "Sunita Wankhede, an independent witness on Vidarbha Waste Care's panel"),
    "dgw-w1": ("Syed Mujeeb", "dark blue", 2301, "Syed Mujeeb, an independent witness on Deccan Green Waste Management's panel"),
    "dgw-w2": ("P. Anitha", "black", 2401, "P. Anitha, an independent witness on Deccan Green Waste Management's panel"),
}


def signatures() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for sid, (name, ink, seed, who) in SIGNATORIES.items():
        src = HERE / "src" / f"{sid}.png"
        if not src.exists():
            print(f"missing {src.name}: render it first (src/gen.sh)", file=sys.stderr)
            continue
        subprocess.run([sys.executable, str(HERE / "ink.py"), str(src), str(OUT / f"{sid}.webp"), "--height", "160"], check=True)
        (OUT / f"{sid}.prompt.json").write_text(
            json.dumps(
                {
                    "model": "Qwen-Image 2.1 (bf16, local)",
                    "prompt": PROMPT.format(name=name, ink=ink),
                    "aspect": "16:9",
                    "size": 1024,
                    "seed": seed,
                    "post": "keyed to its ink (system/signatures/ink.py: the paper made transparent, the ink's own colour "
                    "with an alpha from its darkness), trimmed to the ink with a 12 px margin, 160 px tall, WebP q90",
                    "use": f"SC-174: the specimen signature of {who} (fictional), on every paper they sign",
                },
                indent=2,
                ensure_ascii=False,
            )
            + "\n"
        )


if __name__ == "__main__":
    {"signatures": signatures}[sys.argv[1] if len(sys.argv) > 1 else "signatures"]()

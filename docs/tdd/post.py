"""The TDD's two passes with PyMuPDF. Run by build.sh: uvx --with pymupdf python post.py …

  pages  <pass1.pdf> <pages.json>            the page each section starts on, for the contents
  finish <pass2.pdf> <pages.json> <out.pdf>  the running header and footer, bookmarks and metadata
"""

import json
import sys

import pymupdf

# each section's heading (or the first words of it), in the order they print
FIND = [
    ("tdd-intro", "What this document is"),
    ("system", "One picture of everything that runs"),
    ("brief", "Firebase, Cloud Run and Gemini, and why"),
    ("gcp", "What each service does here"),
    ("agents", "Ten agents along nine stops"),
    ("flow", "journey, request by request"),
    ("identity", "Every caller signs as someone"),
    ("cicd", "GitHub Actions gates every change"),
    ("testing", "Proven at every layer"),
    ("observe", "One trace, from a tap"),
    ("tdd-perf", "Measured on production; it runs"),
    ("tdd-decisions", "What was chosen, and why"),
    ("tdd-gaps", "What is not done yet"),
    ("tdd-next", "The roadmap, area by area"),
    ("tdd-diagrams", "Every diagram in ARCHITECTURE.md"),
    ("tdd-glossary", "Glossary"),
]
TITLES = {
    "tdd-intro": "1 Introduction", "system": "2 The system", "brief": "3 Firebase, Cloud Run and Gemini",
    "gcp": "4 Google Cloud, service by service", "agents": "5 The agents", "flow": "6 The application flow",
    "identity": "7 Identity and security", "cicd": "8 Delivery", "testing": "9 Testing and quality",
    "observe": "10 Observability", "tdd-perf": "11 Performance, cost and scale", "tdd-decisions": "12 Design decisions",
    "tdd-gaps": "13 Known gaps and risks", "tdd-next": "14 What comes next", "tdd-diagrams": "Appendix A: The diagrams",
    "tdd-glossary": "Appendix B: Glossary",
}
FRONT = 3  # the cover, document control and the contents


def find_pages(doc):
    found, start = {}, FRONT
    for sid, text in FIND:
        for i in range(start, len(doc)):
            if doc[i].search_for(text):
                found[sid] = i + 1
                start = i
                break
        else:
            sys.exit(f"no page for {sid} ({text!r})")
    return found


def rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def finish(src, pages, out):
    doc = pymupdf.open(src)
    found = find_pages(doc)
    if found != pages:
        sys.exit(f"the sections moved between the passes: {pages} -> {found}")
    n = len(doc)
    for i, p in enumerate(doc):
        if i == 0 or i == n - 1:
            continue  # the cover and the back cover
        w, h = p.rect.width, p.rect.height
        p.insert_text((37, 30), "Smart-Clearance", fontname="hebo", fontsize=8.5, color=rgb("167a52"))
        p.insert_text((37 + pymupdf.get_text_length("Smart-Clearance ", "hebo", 8.5), 30), "· Technical Design Document",
                      fontname="helv", fontsize=8.5, color=rgb("5f6e67"))
        right = "SC-TDD-001 · version 1.0 · 15 October 2026"
        p.insert_text((w - 37 - pymupdf.get_text_length(right, "helv", 8), 30), right, fontname="helv", fontsize=8, color=rgb("5f6e67"))
        p.draw_line((37, 36), (w - 37, 36), color=rgb("dce5e0"), width=0.6)
        # the brand's four colours as the footer's rule
        x, y = 37, h - 26
        for share, col in ((3, "167a52"), (2, "0a7ae0"), (2, "0d9488"), (1, "f2b437")):
            seg = 64 * share / 8
            p.draw_rect(pymupdf.Rect(x, y, x + seg, y + 2.2), color=None, fill=rgb(col))
            x += seg
        p.insert_text((37, h - 14), "Public · every company, person and figure is fictional", fontname="helv", fontsize=7.5, color=rgb("5f6e67"))
        label = f"Page {i + 1} of {n}"
        p.insert_text((w - 37 - pymupdf.get_text_length(label, "helv", 8), h - 14), label, fontname="helv", fontsize=8, color=rgb("45554d"))
    toc = [[1, "Cover", 1], [1, "Document control", 2], [1, "Contents", 3]]
    toc += [[1, TITLES[sid], found[sid]] for sid, _ in FIND]
    doc.set_toc(toc)
    doc.set_metadata({
        "title": "Smart-Clearance · Technical Design Document",
        "author": "The Smart-Clearance team",
        "subject": "How Smart-Clearance is built on Google Cloud: Firebase, Cloud Run, Gemini on Agent Platform, the agents, data, identity, delivery, testing and observability",
        "keywords": "Smart-Clearance, technical design document, Google Cloud, Cloud Run, Firebase, Gemini, Agent Platform, ADK",
        "creator": "docs/tdd/build.sh",
    })
    doc.save(out, garbage=3, deflate=True)
    print(f"finished {out}: {n} pages, {len(toc)} bookmarks")


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "pages":
        pages = find_pages(pymupdf.open(sys.argv[2]))
        json.dump(pages, open(sys.argv[3], "w"))
        print("pages:", pages)
    elif mode == "finish":
        finish(sys.argv[2], json.load(open(sys.argv[3])), sys.argv[4])
    else:
        sys.exit(__doc__)

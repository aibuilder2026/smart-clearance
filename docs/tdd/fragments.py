"""The TDD's back matter, from ARCHITECTURE.md: the agents' evals, performance and cost, the decisions, the known gaps and what comes next,
rendered to HTML. Run by build.sh with the markdown package: uvx --with markdown python fragments.py ARCHITECTURE.md out.json"""

import json
import re
import sys

import markdown

src, out = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read()


def section(number):
    """the body of '## <number>. …' up to the next '## ' heading, without its own heading"""
    m = re.search(rf"^## {number}\. [^\n]*\n(.*?)(?=^## |\Z)", text, flags=re.S | re.M)
    if not m:
        sys.exit(f"ARCHITECTURE.md has no section {number}")
    return m.group(1).strip()


def subsection(title):
    """the body of '### <title>' up to the next '### ' or '## ' heading, its '#### ' headings kept"""
    m = re.search(rf"^### {re.escape(title)}\n(.*?)(?=^### |^## |\Z)", text, flags=re.S | re.M)
    if not m:
        sys.exit(f"ARCHITECTURE.md has no subsection {title}")
    return m.group(1).strip()


def html(md):
    body = markdown.markdown(md, extensions=["tables", "sane_lists", "fenced_code"])
    # links stay readable on paper: the page's own anchors go, the rest keep their target
    body = re.sub(r'<a href="#[^"]*">(.*?)</a>', r"\1", body)
    # images resolve from the architecture page, which lives in docs/
    return body.replace('src="docs/', 'src="')


parts = {"perf": 17, "decisions": 20, "gaps": 21, "next": 22}
frags = {k: html(section(n)) for k, n in parts.items()}
frags["evals"] = html(subsection("The evals"))
json.dump(frags, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print("fragments:", ", ".join(frags), "->", out)

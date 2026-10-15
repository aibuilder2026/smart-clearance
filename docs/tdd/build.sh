#!/usr/bin/env bash
# The Technical Design Document, docs/smart-clearance-tdd.pdf, from the architecture page and ARCHITECTURE.md.
# Needs uv (for markdown and PyMuPDF) and the frontend's Playwright with Chromium (corepack pnpm install in frontend/).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

uvx --with markdown python "$here/fragments.py" "$repo/ARCHITECTURE.md" "$work/fragments.json"
# pass 1 lays the document out; the contents' page numbers come from it
node "$here/print.mjs" "$work/fragments.json" "$work/pass1.pdf"
uvx --with pymupdf python "$here/post.py" pages "$work/pass1.pdf" "$work/pages.json"
# pass 2 prints the contents with them, then the header, footer, bookmarks and metadata go on
node "$here/print.mjs" "$work/fragments.json" "$work/pass2.pdf" "$work/pages.json"
uvx --with pymupdf python "$here/post.py" finish "$work/pass2.pdf" "$work/pages.json" "$repo/docs/smart-clearance-tdd.pdf"

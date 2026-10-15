#!/bin/bash
# SC-206: free, local Indian-English voices for the narration, every one Apache-2.0 and ungated on Hugging Face:
#   Veena (Maya Research): four studio voices trained on Indian English and Hindi;
#   Maya1 (Maya Research): a voice from a description, with an "indian" accent among its attributes;
#   Svara-TTS v1 (Kenpath): Orpheus-style, trained on Indian English (SPICOR) among 19 languages.
# All three speak SNAC codes at 24 kHz. One venv beside this script; the weights go to the Hugging Face cache.
set -e
cd "$(dirname "$0")"
UV=$HOME/.local/bin/uv
echo "== venv"; date
$UV venv -q --python 3.12 .venv-snac
$UV pip install -q --python .venv-snac/bin/python torch transformers accelerate snac soundfile numpy huggingface_hub
echo "== weights"; date
.venv-snac/bin/python - <<'EOF'
from huggingface_hub import snapshot_download
for r in ["maya-research/Veena", "maya-research/maya1", "kenpath/svara-tts-v1"]:
    p = snapshot_download(r, allow_patterns=["*.json", "*.safetensors", "*.jinja", "*.txt"])
    print(r, p, flush=True)
from snac import SNAC
SNAC.from_pretrained("hubertsiuzdak/snac_24khz")
print("snac ok", flush=True)
EOF
echo "== done"; date

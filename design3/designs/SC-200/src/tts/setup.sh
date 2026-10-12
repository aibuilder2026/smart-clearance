#!/bin/bash
# Free, local voice tooling for SC-200: Kokoro-82M (Apache-2.0), Chatterbox (MIT), mlx-whisper for transcribing
# every take back, UTMOS22 for a predicted naturalness score. Each in its own venv beside this script.
set -e
cd "$(dirname "$0")"
UV=$HOME/.local/bin/uv
echo "== kokoro + utmos (py3.12)"; date
$UV venv -q --python 3.12 .venv-kokoro
$UV pip install -q --python .venv-kokoro/bin/python "kokoro>=0.9.4" soundfile numpy torch torchaudio librosa "misaki[en]"
echo "== chatterbox (py3.11)"; date
$UV venv -q --python 3.11 .venv-chatterbox
$UV pip install -q --python .venv-chatterbox/bin/python chatterbox-tts soundfile
echo "== mlx-whisper (py3.12)"; date
$UV venv -q --python 3.12 .venv-asr
$UV pip install -q --python .venv-asr/bin/python mlx-whisper soundfile
echo "== done"; date

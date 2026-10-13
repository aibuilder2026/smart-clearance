"""SC-205: transcribe each voice line back (Whisper large-v3-turbo, mlx) with word timings: tts/vo/<take>/asr.json."""
import json, sys
from pathlib import Path
import mlx_whisper
take = Path(sys.argv[1]); out = {}
for p in sorted(take.glob('*.wav')):
    r = mlx_whisper.transcribe(str(p), path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='en', word_timestamps=True)
    words = [{'w': w['word'].strip(), 's': round(w['start'], 3), 'e': round(w['end'], 3)} for s in r['segments'] for w in s.get('words', [])]
    out[p.stem] = {'text': r['text'].strip(), 'words': words}
    print(p.stem, '|', r['text'].strip(), flush=True)
(take / 'asr.json').write_text(json.dumps(out, indent=1))

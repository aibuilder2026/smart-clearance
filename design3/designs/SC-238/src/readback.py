"""SC-238: every spoken line read back from the final mix. Each narration line and each person's line is cut from the
mix at its place in the film (film.json), transcribed by Whisper (large-v3-turbo, mlx) and compared word for word with
the script (lines.json), figures by their value and spellings folded as the take picker folds them (tts/pick.py). The
score is under it, so a line that reads back here is heard over the music.

   uv run --python 3.12 --with mlx-whisper --with soundfile --with numpy python readback.py build/mix.wav [report.json]"""
import sys, json, subprocess
from pathlib import Path
import numpy as np
import mlx_whisper

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'tts'))
from pick import words  # noqa: E402  (the take picker's own folding: figures by value, plurals, spellings)

_L = json.loads((HERE / 'lines.json').read_text())
LINES = {l['id']: l for l in _L['lines'] + _L['dialogue']}
F = json.loads((HERE / 'film' / 'src' / 'film.json').read_text())
SR = 16000
# words Whisper hears for a line that sounds the same (a person's line in the room it was shot in, as dlg.py allows
# them; a homophone of the narrator's), after folding
HEARD = {'do': 'two', 'build': 'bill', 'plane': 'plain'}


def fold(text):
    """the take picker's words, '%' read as 'per cent', a homophone as its word, and a final s dropped (so 'apps'' and
    'app's' agree, while 'installed' still differs from 'installs')"""
    ws = words(text.replace('%', ' per cent'))
    ws = [HEARD.get(w, w) for w in ws]
    return [w[:-1] if len(w) > 2 and w.endswith('s') and not w.endswith('ss') else w for w in ws]


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def heard(audio, a, b):
    seg = audio[max(0, int(a * SR)):int(b * SR)]
    r = mlx_whisper.transcribe(seg, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='en', condition_on_previous_text=False)
    return r['text'].strip()


def main():
    mix = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / 'build' / 'mix.wav'
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / 'build' / 'readback.json'
    audio = load(mix)
    rows = []
    # a line placed in parts (its words split across two moments of the film) is read back part by part and joined
    parts = {}
    for v in F['vo']: parts.setdefault(('vo', v['id']), []).append((v['t'], v['t'] + v['dur']))
    for d in F['dlg']: parts.setdefault(('dlg', d['id']), []).append((d['t'], d['t'] + d['e'] - d['s']))
    for (kind, lid), spans in sorted(parts.items(), key=lambda x: x[1][0][0]):
        a = spans[0][0]
        want = LINES[lid]['text']
        got = ' '.join(heard(audio, x0 - 0.08, x1 + 0.3) for x0, x1 in sorted(spans))
        w, g = fold(want), fold(got)
        # the cut can catch the last word of the line before or the first of the next: the line is read back when its
        # own words appear in order inside what was heard
        i = 0
        for x in g:
            if i < len(w) and x == w[i]: i += 1
        ok = i == len(w)
        rows.append({'kind': kind, 'id': lid, 't': round(a, 2), 'want': want, 'heard': got, 'exact': ok, 'matched': f'{i}/{len(w)}'})
        print(f"{'ok ' if ok else 'XX '} {lid:5s} {a:7.2f}  {got}" + ('' if ok else f"\n        want: {want}"))
    n = sum(r['exact'] for r in rows)
    print(f'\n{n} of {len(rows)} lines word for word ({sum(1 for r in rows if r["kind"] == "vo")} narration, {sum(1 for r in rows if r["kind"] == "dlg")} people)')
    out.write_text(json.dumps({'mix': str(mix), 'exact': n, 'lines': len(rows), 'rows': rows}, indent=1, ensure_ascii=False))


if __name__ == '__main__':
    main()

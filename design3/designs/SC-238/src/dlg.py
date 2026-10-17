"""SC-238: where each talking clip says its line. Every clip in clips/ named by a dialogue line (lines.json) is read
back by Whisper (large-v3-turbo, mlx) with word times; each line is found among the words (its own words, in order,
loosely), and its start and end are tightened to the clip's own audio: the first and last 20 ms windows within reach
that rise above the clip's speech floor. Out: build/dlg.json {line: {clip, s, e, heard}} and build/dlg-read.json.

   uv run --python 3.12 --with mlx-whisper --with soundfile --with numpy python dlg.py"""
import json, re, subprocess
from pathlib import Path
import numpy as np, soundfile as sf

HERE = Path(__file__).resolve().parent
DLG = json.loads((HERE / 'lines.json').read_text())['dialogue']
OUT, READ = HERE / 'build' / 'dlg.json', HERE / 'build' / 'dlg-read.json'
NUM = {'22': 'twentytwo', '24': 'twentyfour', '58': 'fiftyeight', '1420': 'fourteentwenty', '14': 'fourteen', '20': 'twenty', '10': 'ten'}
# words Whisper mishears in these voices, as their lines mean them (an Indian "two" heard as "do", "bill's" as "build")
HEARD = {'do': 'two', 'build': 'bills'}
norm = lambda w: (lambda x: NUM.get(x, x))(re.sub(r'[^a-z0-9]', '', w.lower()))


def tokens(text):
    out = []
    for w in re.sub(r'[-–]', '', text).split():
        n = norm(w)
        if n: out.append(n)
    return out


def audio(clip):
    wav = HERE / 'build' / 'dlg' / f'{clip}.wav'
    wav.parent.mkdir(parents=True, exist_ok=True)
    if not wav.exists():
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(HERE / 'clips' / f'{clip}.mp4'), '-ac', '1', '-ar', '16000', str(wav)], check=True)
    a, sr = sf.read(str(wav), dtype='float32')
    return a, sr


def tighten(a, sr, s, e):
    """the line's edges on the audio: the speech floor is the clip's 60th-percentile window level; a window counts as
    speech above floor + 10 dB (a soft first word sits near +12); the start is the first such window from 0.35 s before Whisper's start, the end the last
    one up to 0.45 s after its end"""
    hop = int(0.02 * sr)
    n = len(a) // hop
    rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    db = 20 * np.log10(rms)
    floor = np.percentile(db, 60)
    on = db > max(floor + 10, -42)
    i0, i1 = max(0, int((s - 0.35) / 0.02)), min(n - 1, int((e + 0.45) / 0.02))
    idx = [i for i in range(i0, i1 + 1) if on[i]]
    if not idx: return s, e
    return round(idx[0] * 0.02, 3), round((idx[-1] + 1) * 0.02, 3)


def main():
    import mlx_whisper
    read = json.loads(READ.read_text()) if READ.exists() else {}
    out = json.loads(OUT.read_text()) if OUT.exists() else {}
    clips = sorted({d['clip'] for d in DLG if (HERE / 'clips' / f"{d['clip']}.mp4").exists()})
    for c in clips:
        if c not in read:
            r = mlx_whisper.transcribe(str(HERE / 'clips' / f'{c}.mp4'), path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='en', word_timestamps=True)
            read[c] = {'text': r['text'].strip(), 'words': [{'w': w['word'].strip(), 's': round(w['start'], 3), 'e': round(w['end'], 3)} for s in r['segments'] for w in s.get('words', [])]}
            READ.write_text(json.dumps(read, indent=1))
        a, sr = audio(c)
        words = read[c]['words']
        used = 0
        for d in [d for d in DLG if d['clip'] == c]:
            want = tokens(d['text'])
            ws = [HEARD.get(norm(w['w']), norm(w['w'])) for w in words]
            best = None
            for i in range(used, len(ws)):            # the line's words in order, loosely: the most of them from here
                j, k, hit = i, 0, []
                while j < len(ws) and k < len(want):
                    if ws[j] == want[k] or (len(want[k]) > 4 and ws[j][:4] == want[k][:4]): hit.append(j); k += 1; j += 1
                    elif j - i > len(want) + 3: break
                    else: j += 1
                if hit and (best is None or len(hit) > len(best)): best = hit
                if best and len(best) == len(want): break
            if not best: print(f"{d['id']}: NOT FOUND in {c} ({read[c]['text']})"); continue
            s, e = words[best[0]]['s'], words[best[-1]]['e']
            # Whisper stretches a word across a pause; a word longer than 0.9 s keeps only its last 0.6 s
            if words[best[0]]['e'] - s > 0.9: s = words[best[0]]['e'] - 0.6
            s2, e2 = tighten(a, sr, s, e)
            used = best[-1] + 1
            heard = ' '.join(words[i]['w'] for i in range(best[0], best[-1] + 1))
            out[d['id']] = {'clip': c, 's': s2, 'e': e2, 'whisper': [s, e], 'heard': heard, 'want': d['text'], 'complete': len(best) == len(want)}
            print(f"{d['id']} {c}: {s2:.2f}-{e2:.2f} (whisper {s:.2f}-{e:.2f}) | {heard}{'' if len(best) == len(want) else '  (INCOMPLETE)'}")
    OUT.write_text(json.dumps(out, indent=1))


if __name__ == '__main__':
    main()

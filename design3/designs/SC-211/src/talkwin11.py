# /// script
# requires-python = ">=3.12"
# dependencies = ["mlx-whisper==0.4.3", "numpy<2.4", "soundfile==0.13.1"]
# ///
"""SC-211: each talking clip's spoken window, read back. Whisper (mlx, on this Mac) transcribes the clip's own sound
with word times; the window runs from just before the first word to just after the last, and its text is held to the
line's (the words it got wrong are listed). lines.json gets clip_in, clip_out, pre_avail (how much of the clip there is
before the first word, up to 0.5 s) and post_avail; build/talk11/windows.json keeps every read.
  ~/.local/bin/uv run --script talkwin11.py [lid…]"""
import json, re, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / 'build' / 'talk11'
OUT.mkdir(parents=True, exist_ok=True)


def norm(w): return re.sub(r"[^a-z0-9]", '', w.lower())


def words_of(text):
    nums = {'1372': 'thirteen seventy two', '58': 'fifty eight', '24': 'twenty four', '1420': 'fourteen twenty', '22': 'twenty two'}
    return [norm(w) for w in text.replace('-', ' ').split() if norm(w)]


def wer(ref, hyp):
    r, h = words_of(ref), words_of(hyp)
    d = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1): d[i][0] = i
    for j in range(len(h) + 1): d[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (r[i - 1] != h[j - 1]))
    return d[len(r)][len(h)] / max(1, len(r))


def main():
    import mlx_whisper
    doc = json.loads((HERE / 'lines.json').read_text())
    only = set(sys.argv[1:])
    wj = OUT / 'windows.json'
    reads = json.loads(wj.read_text()) if wj.exists() else {}
    for l in doc['lines']:
        if l.get('kind') != 'talk' or (only and l['id'] not in only): continue
        d = HERE / l.get('clip_dir', 'clips/talk11')
        src = d / f"{l['clip']}.mp4"
        if not src.exists(): print('no clip yet', l['id']); continue
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(src)],
                                   capture_output=True, text=True).stdout)
        with tempfile.TemporaryDirectory() as td:
            wav = Path(td) / 'a.wav'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-vn', '-ac', '1', '-ar', '16000', str(wav)], check=True)
            r = mlx_whisper.transcribe(str(wav), path_or_hf_repo='mlx-community/whisper-large-v3-turbo', word_timestamps=True, language='en')
        ws = [w for seg in r['segments'] for w in seg.get('words', [])]
        if not ws: print('no words heard', l['id']); continue
        text = ' '.join(w['word'].strip() for w in ws)
        a = max(0.0, ws[0]['start'] - 0.06)
        b = min(dur, ws[-1]['end'] + 0.12)
        e = wer(l['text'], text)
        reads[l['id']] = {'clip': str(src.relative_to(HERE)), 'heard': text, 'wer': round(e, 3), 'first': ws[0]['start'], 'last': ws[-1]['end'], 'dur': dur,
                          'words': [{'w': w['word'].strip(), 's': round(w['start'], 3), 'e': round(w['end'], 3)} for w in ws]}
        if 'clip_in' not in l or l.get('clip_auto', True):
            l['clip_in'], l['clip_out'] = round(a, 3), round(b, 3)
            l['clip_auto'] = True
        l['pre_avail'] = round(min(0.5, l['clip_in']), 3)
        l['post_avail'] = round(min(0.5, dur - l['clip_out']), 3)
        print(f"{l['id']:3} wer {e:.2f}  {a:5.2f}-{b:5.2f} of {dur:.2f}  heard: {text}")
    wj.write_text(json.dumps(reads, indent=1, ensure_ascii=False))
    (HERE / 'lines.json').write_text(json.dumps(doc, indent=1, ensure_ascii=False))


if __name__ == '__main__':
    main()

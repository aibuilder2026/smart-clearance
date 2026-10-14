"""SC-206: the best take of each narration line. Every take is read back by Whisper (large-v3-turbo, mlx) and scored:
a take that drops, adds or garbles a word loses to one that reads back word for word; between equals, the higher
predicted naturalness (UTMOS22, mos.json from mos.py) wins. The chosen takes are copied to vo3/<voice>/<id>.wav, with
durations.json and asr.json (each word's start and end) for the cut.

   <asr venv>/bin/python pick.py vo3/<model>-<voice>"""
import sys, re, json, shutil
from pathlib import Path
import soundfile as sf
import mlx_whisper

HERE = Path(__file__).resolve().parent
LINES = {l['id']: l for l in json.loads((HERE.parent / 'lines.json').read_text())['lines']}
ONES = {w: i for i, w in enumerate('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen '
                                    'fifteen sixteen seventeen eighteen nineteen'.split())}
TENS = {w: 10 * (i + 2) for i, w in enumerate('twenty thirty forty fifty sixty seventy eighty ninety'.split())}
SAME = [('smart-clearance', 'smart clearance'), ('expiresoon', 'expire soon'), ('quick-commerce', 'quick commerce'),
        ('best-before', 'best before'), ('write-off', 'write off'), ('go-down', 'godown'), ('go down', 'godown'),
        ('munch lee', 'munchly'), ('licence', 'license'), ('authorised', 'authorized'), (' rs ', ' rupees ')]


def _number(run):
    """number words as one value: 'thirteen hundred and seventy-two' 1372, 'fourteen twenty' 1420, 'a hundred' 100"""
    total = cur = 0
    for w in run:
        if w == 'a': cur = 1
        elif w in ONES: cur += ONES[w]
        elif w in TENS: cur = cur * 100 + TENS[w] if cur % 100 else cur + TENS[w]
        elif w == 'hundred': cur = (cur or 1) * 100
        elif w == 'thousand': total += (cur or 1) * 1000; cur = 0
        elif w == 'lakh': total += (cur or 1) * 100000; cur = 0
    return total + cur


def words(t):
    """the words to compare: figures by their value however they are written ('Rs 22,000', 'twenty-two thousand
    rupees'), the currency word dropped (its place moves with the figure), possessives and plurals folded"""
    t = ' ' + t.lower().replace('-', ' - ') + ' '
    for a, b in SAME: t = t.replace(a.replace('-', ' - '), b)
    t = t.replace(' - ', ' ')
    t = re.sub(r'(\d),(\d)', r'\1\2', t)
    t = re.sub(r'[,;:.!?]', ' | ', t)      # a figure never runs on across punctuation
    raw = [w.strip("'") for w in re.sub(r"[^a-z0-9'| ]+", ' ', t).split() if w.strip("'")]
    out, i = [], 0
    numw = set(ONES) | set(TENS) | {'hundred', 'thousand', 'lakh'}
    while i < len(raw):
        w = raw[i]
        if w.isdigit(): out.append('#' + str(int(w))); i += 1; continue
        if w in numw or (w == 'a' and i + 1 < len(raw) and raw[i + 1] in ('hundred', 'thousand')):
            j = i; run = []
            while j < len(raw) and (raw[j] in numw or (raw[j] == 'a' and j == i) or
                                   (raw[j] == 'and' and run and j + 1 < len(raw) and raw[j + 1] in numw)):
                run.append(raw[j]); j += 1
            out.append('#' + str(_number(run))); i = j; continue
        if w in ('rupee', 'rupees', '|'): i += 1; continue
        w = re.sub(r"'s$|s'$", '', w)
        if len(w) > 4 and w.endswith('ies'): w = w[:-3] + 'y'
        elif len(w) > 4 and w.endswith('s') and not w.endswith('ss'): w = w[:-1]
        out.append(w); i += 1
    return out


def wer(ref, hyp):
    r, h = words(ref), words(hyp)
    d = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1): d[i][0] = i
    for j in range(len(h) + 1): d[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (r[i - 1] != h[j - 1]))
    return d[-1][-1] / max(1, len(r))


if __name__ == '__main__':
    root = Path(sys.argv[1])
    takes = root / 'takes'
    mos = json.loads((root / 'mos.json').read_text()) if (root / 'mos.json').exists() else {}
    # how often a take's brand name read back as "Munchly", heard three ways (brand.py): a tiebreak
    # between takes that read back alike, before naturalness
    brand = json.loads((root / 'brand.json').read_text()) if (root / 'brand.json').exists() else {}
    seen = json.loads((root / 'read.json').read_text()) if (root / 'read.json').exists() else {}
    for p in sorted(takes.glob('*.wav')):
        if p.name in seen: continue
        r = mlx_whisper.transcribe(str(p), path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='en', word_timestamps=True)
        seen[p.name] = {'text': r['text'].strip(),
                        'words': [{'w': w['word'].strip(), 's': round(w['start'], 3), 'e': round(w['end'], 3)} for s in r['segments'] for w in s.get('words', [])]}
        (root / 'read.json').write_text(json.dumps(seen, indent=1))
    chosen, durs, asr, report = {}, {}, {}, []
    for lid, ln in LINES.items():
        cands = []
        for p in sorted(takes.glob(f'{lid}-*.wav')):
            rd = seen.get(p.name)
            if not rd: continue
            e = wer(ln['text'], rd['text'])
            cands.append((round(e, 3), -brand.get(p.name, 0), -mos.get(p.name, 0.0), p.name))
        if not cands: report.append(f'{lid}: NO TAKES'); continue
        cands.sort()
        e, _, negm, name = cands[0]
        chosen[lid] = name
        shutil.copy2(takes / name, root / f'{lid}.wav')
        durs[lid] = round(sf.info(root / f'{lid}.wav').duration, 3)
        asr[lid] = seen[name]
        report.append(f'{lid}: {name} wer {e:.3f} mos {-negm:.2f} {durs[lid]:.2f}s | {seen[name]["text"]}')
    (root / 'durations.json').write_text(json.dumps(durs, indent=2))
    (root / 'asr.json').write_text(json.dumps(asr, indent=1))
    (root / 'chosen.json').write_text(json.dumps(chosen, indent=1))
    print('\n'.join(report))
    print('total', round(sum(durs.values()), 1), 's')

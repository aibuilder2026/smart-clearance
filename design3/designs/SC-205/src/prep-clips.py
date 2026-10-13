"""SC-205 cut 2: each LTX clip fitted to the shots that show it.

LTX pushes in even when asked to hold still, and the push speeds up as the clip goes on, and a face can drift with it.
So for each clip:
  1. clipcheck.py finds how long it stays gentle (a person's panel: until the push passes 20% or a pan 2% of the width;
     a full-frame shot: 10% and 3%);
  2. a person's panel is locked to a tripod frame by stab.py over that stretch (every frame aligned to the last one
     kept, the tightest, so no edge shows); a full-frame shot keeps its gentle push;
  3. slow.sh retimes it to the shot (motion-interpolated, never slower than 0.6x); if the shot is longer still, the
     clip plays forward and then back (small, slow movements read the same either way) rather than freezing.
Skips clips not rendered yet.   .venv/bin/python prep-clips.py
"""
import json, subprocess
from pathlib import Path
import shots as S_
from parts import Character
from kit import HERE

B = HERE / 'build'
# by eye, where the tracker cannot see the camera move (a bare wall): how long to keep, and clips held still enough as
# they are, which are not locked
CAP = {'m5-staff-upi': 3.6, 'm6-meera-van': 1.6, 'm7-kirana-delivery': 3.0, 'm2-lakshmi-photo': 2.2}
NOLOCK = {'m5-staff-upi'}
# by eye: a clip whose camera slides a little sideways early on but holds its framing, kept for longer than the
# tracker allows, and locked with a small zoom so the slide's edge never shows
STEADY = {}
ZOOM = {}
MASK = {}
# clips whose camera moves in perspective (no lock can hold it): their gentlest stretch, retimed by slow.sh, then
# played forward and back with eased turns by breathe.py to fill the shot
BREATHE = {'n1-neha-console': 2.4}
# clips whose action would read wrong backwards: slowed, then held on their last frame instead
NOBACK = {'m6-meera-van'}
need = {}
for sh in S_.build():
    L = sh.t1 - sh.t0
    for it in sh.items:
        if isinstance(it, Character):
            u1 = it.u1 if it.u1 is not None else L
            need[it.key] = max(need.get(it.key, 0), u1 - it.u0 + 0.2)
shots = {s.name: s for s in S_.build()}
FULL = {'i2': ('i2-hold', shots['hold']), 'i3': ('i3-landfill', shots['landfill'])}
for k, (_, sh) in FULL.items():
    need[k] = sh.t1 - sh.t0 + 0.2

def run(*a):
    subprocess.run([str(x) for x in a], check=True, capture_output=True)

def dur(p):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)],
                                capture_output=True, text=True).stdout)

for key, length in sorted(need.items()):
    full = key in FULL
    src = HERE / 'clips' / f'{FULL[key][0] if full else key}.mp4'
    out = B / 'slow' / f'{key}.mp4'
    if not src.exists(): print('waiting', key); continue
    if out.exists() and out.stat().st_mtime > src.stat().st_mtime: print('ok', key); continue
    clean = B / f'_clean-{key}.mp4'  # a one-frame flash, if LTX added one, replaced by its neighbours
    if subprocess.run([str(HERE / '.venv/bin/python'), str(HERE / 'deflash.py'), str(src), str(clean)], capture_output=True).returncode == 0:
        src = clean
    run(HERE / '.venv/bin/python', HERE / 'clipcheck.py', f'--zoom={0.10 if full else 0.20}', f'--pan={0.03 if full else 0.02}', src)
    steady = STEADY.get(key, json.loads((B / 'steady.json').read_text())[src.stem])
    src_dur = dur(src)
    use = max(1.5, min(steady, CAP.get(key, 1e9)))
    part = B / f'_prep-{key}.mp4'
    if key in BREATHE:
        cut = B / f'_cut-{key}.mp4'
        run('ffmpeg', '-v', 'error', '-y', '-t', f'{BREATHE[key]:.2f}', '-i', src, '-an', '-c:v', 'libx264', '-crf', '10', cut)
        slowed = B / f'_slowed-{key}.mp4'
        run(HERE / 'slow.sh', cut, slowed, '0.6')
        run(HERE / '.venv/bin/python', HERE / 'breathe.py', slowed, out, f'{length:.2f}', '0.8')
        print(f'{key}: {BREATHE[key]:.1f}s of {src_dur:.1f}s at 0.6x, breathing over a {length:.1f}s shot'); continue
    if full or key in NOLOCK:
        run('ffmpeg', '-v', 'error', '-y', '-t', f'{use:.2f}', '-i', src, '-an', '-c:v', 'libx264', '-crf', '10', part)
    else:
        run(HERE / '.venv/bin/python', HERE / 'stab.py', src, part, f'{ZOOM.get(key, 1.0)}', 'last', f'{use:.2f}', MASK.get(key, ''))
    sp = max(0.6, min(1.0, use / length))
    played = use / sp
    if played < length - 0.05 and key not in NOBACK:  # forward, then back, until the shot is covered
        pp = B / f'_pp-{key}.mp4'
        n = 2
        while use * n / 0.6 < length - 0.05 and n < 8: n += 2
        if n >= 4:  # more than one turn: eased turns instead of hard reversals
            slowed = B / f'_slowed-{key}.mp4'
            run(HERE / 'slow.sh', part, slowed, '0.6')
            run(HERE / '.venv/bin/python', HERE / 'breathe.py', slowed, out, f'{length:.2f}', '0.8')
            print(f'{key}: steady {steady:.1f}s of {src_dur:.1f}s; locked, {use:.1f}s at 0.6x, breathing over a {length:.1f}s shot'); continue
        chain = ';'.join(f'[r{i}]reverse[v{i}]' if i % 2 else f'[r{i}]null[v{i}]' for i in range(n))
        run('ffmpeg', '-v', 'error', '-y', '-i', part, '-filter_complex', f'[0:v]split={n}' + ''.join(f'[r{i}]' for i in range(n)) + ';' + chain + ';' +
            ''.join(f'[v{i}]' for i in range(n)) + f'concat=n={n}:v=1[v]', '-map', '[v]', '-c:v', 'libx264', '-crf', '10', pp)
        part, use = pp, use * n
        sp = max(0.6, min(1.0, use / length))
    run(HERE / 'slow.sh', part, out, f'{sp:.3f}')
    print(f'{key}: steady {steady:.1f}s of {src_dur:.1f}s; {"" if full or key in NOLOCK else "locked, "}{use:.1f}s at {sp:.2f}x for a {length:.1f}s shot')

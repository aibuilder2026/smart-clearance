"""SC-206: each take of the lines that name the brand (m01, m09, s01, s07), heard three ways (as made; padded with
silence; through the mix's voice chain at 48 kHz): how often Whisper writes 'Munchly', into brand.json, which pick.py
uses to choose between takes that read back alike.   <asr venv>/bin/python brand.py vo3/<model>-<voice>"""
import sys, glob, os, tempfile, subprocess, json
import numpy as np, soundfile as sf, mlx_whisper
root = sys.argv[1]; tmp = tempfile.mkdtemp()
CHAIN = ("highpass=f=75,equalizer=f=190:t=q:w=1.0:g=1.6,equalizer=f=3300:t=q:w=1.3:g=1.8,equalizer=f=7600:t=q:w=1.6:g=-1.6,"
         "acompressor=threshold=-21dB:ratio=2.4:attack=6:release=140:makeup=2.2,aecho=0.88:0.6:23|41:0.07|0.045")
res = {}
for p in sorted(glob.glob(f'{root}/takes/m01-*.wav') + glob.glob(f'{root}/takes/m09-*.wav') + glob.glob(f'{root}/takes/s01-*.wav') + glob.glob(f'{root}/takes/s07-*.wav')):
    a, sr = sf.read(p, dtype='float32'); name = os.path.basename(p)
    v1 = p
    v2 = os.path.join(tmp, 'pad-' + name); sf.write(v2, np.concatenate([np.zeros(int(.5 * sr), np.float32), a, np.zeros(int(.5 * sr), np.float32)]), sr)
    v3 = os.path.join(tmp, 'fx-' + name); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-ar', '48000', '-af', CHAIN, v3], check=True)
    heard = []
    for v in (v1, v2, v3):
        t = mlx_whisper.transcribe(v, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='en', condition_on_previous_text=False)['text']
        w = [x.strip(".,'s") for x in t.replace(',', ' ').split() if x.lower().startswith(('mun', 'man', 'mon', 'mon'))]
        heard.append(w[0] if w else '-')
    good = sum(h.lower().startswith('munchl') for h in heard)
    res[name] = good
    print(f'{name:10s} {good}/3  {" | ".join(heard)}', flush=True)
json.dump(res, open(f'{root}/brand.json', 'w'), indent=1)

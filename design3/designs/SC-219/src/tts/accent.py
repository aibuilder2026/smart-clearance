"""SC-206: which English accent each voice sounds like, by CommonAccent (SpeechBrain ECAPA, MIT, Jzuluaga/
accent-id-commonaccent_ecapa): each 4-second stretch classified, the votes counted, and the mean score for 'indian'.
   .venv-accent/bin/python accent.py bake/*.wav"""
import sys, warnings, collections
warnings.filterwarnings('ignore')
import torch, torchaudio, soundfile as sf
from speechbrain.inference.classifiers import EncoderClassifier
clf = EncoderClassifier.from_hparams(source='Jzuluaga/accent-id-commonaccent_ecapa', savedir='.cache-accent')
enc = clf.hparams.label_encoder
ind = enc.encode_label('indian')
for p in sys.argv[1:]:
    x, sr = sf.read(p, dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    w = torch.from_numpy(x)[None]
    if sr != 16000: w = torchaudio.functional.resample(w, sr, 16000)
    votes, sc_ind = collections.Counter(), []
    seg = 16000 * 4
    for i in range(0, w.shape[1] - 16000, seg // 2):
        chunk = w[:, i:i + seg]
        out, score, idx, lab = clf.classify_batch(chunk)
        votes[lab[0]] += 1
        sc_ind.append(float(out[0, ind]))
    print(f"{p:32} votes {dict(votes.most_common(3))} | indian score {sum(sc_ind) / len(sc_ind):.3f}", flush=True)

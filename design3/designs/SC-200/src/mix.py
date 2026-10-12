"""SC-200: the film's sound, laid on film.json's clock, then muxed under the silent cut.

- the voice-over: each Kokoro line at its start, upsampled to 48 kHz, then one voice chain in ffmpeg (a high-pass, a
  little warmth and presence, gentle compression, a faint short room so it is not bone-dry);
- the music: SC-187's felt-piano bed (Lyria 2, already in design3/designs/SC-187/media, reused: no new generation)
  looped on itself through equal-power crossfades, its dominant-key lift crossfaded in for the close, ducked under
  the voice by its own envelope, faded out on the end card;
- soft whooshes, made from filtered noise, under the chapter changes;
- one loudness pass (two-pass loudnorm to -14 LUFS, true peak -1.5 dB), then the mux, and an .srt of the narration.

  .venv-tools/bin/python mix.py [--preview]
"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, lfilter

HERE = Path(__file__).resolve().parent
B = HERE / "build"
FILM = json.loads((HERE / "film.json").read_text())
VO = HERE / "tts" / "vo" / "af_heart-0.94"
MUS = HERE.parent.parent / "SC-187" / "media"
SR = 48000
END = FILM["end"]
N = int((END + 0.5) * SR)

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: sys.stderr.write(r.stderr[-3000:]); raise SystemExit("ffmpeg failed")
    return r

def decode(path):
    tmp = B / f"_dec-{path.stem}.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ar", str(SR), "-ac", "2", "-c:a", "pcm_f32le", str(tmp)])
    x, _ = sf.read(tmp, dtype="float32"); return x

def db(v): return 10 ** (v / 20)

def voice():
    vo = np.zeros(N, dtype=np.float32)
    for lid, v in FILM["vo"].items():
        x, sr = sf.read(VO / f"{lid}.wav", dtype="float32")
        x = resample_poly(x, SR // 8000, sr // 8000).astype(np.float32)
        i = int(v["at"] * SR); vo[i:i + len(x)] += x[: N - i]
    raw = B / "vo-raw.wav"; sf.write(raw, vo, SR, subtype="FLOAT")
    fx = B / "vo-fx.wav"
    chain = ("highpass=f=75,equalizer=f=190:t=q:w=1.0:g=1.6,equalizer=f=3300:t=q:w=1.3:g=1.8,"
             "equalizer=f=7600:t=q:w=1.6:g=-1.6,acompressor=threshold=-21dB:ratio=2.4:attack=6:release=140:makeup=2.2,"
             "aecho=0.88:0.6:23|41:0.07|0.045,pan=stereo|c0=c0|c1=c0")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", chain, "-c:a", "pcm_f32le", str(fx)])
    y, _ = sf.read(fx, dtype="float32")
    return vo, y[:N]

def envelope(vo):
    a = np.abs(vo); hop = 480
    frames = a[: len(a) // hop * hop].reshape(-1, hop).max(axis=1)
    on = (frames > 0.02).astype(np.float32)
    env, g = np.zeros_like(on), 0.0
    up, down = 1 - np.exp(-1 / (0.08 * SR / hop)), 1 - np.exp(-1 / (0.75 * SR / hop))
    for i, v in enumerate(on):
        g += (v - g) * (up if v > g else down); env[i] = g
    e = np.repeat(env, hop); return np.pad(e, (0, N - len(e)), mode="edge")[:N]

def xfade_loop(x, length, fade):
    """x looped on itself to `length` samples, each join an equal-power crossfade of `fade` samples."""
    out = x.copy()
    w = np.linspace(0, 1, fade, dtype=np.float32)[:, None]
    fin, fout = np.sin(w * np.pi / 2), np.cos(w * np.pi / 2)
    while len(out) < length:
        out = np.concatenate([out[:-fade], out[-fade:] * fout + x[:fade] * fin, x[fade:]])
    return out[:length]

def music(env):
    bed = decode(MUS / "music-bed-6.mp3"); lift = decode(MUS / "music-lift-2.mp3")
    track = xfade_loop(bed, N, 3 * SR)
    close = int((FILM["vo"]["f1"]["at"] - 3.0) * SR)  # the lift, from just before the close
    L2 = xfade_loop(lift, N - close, 3 * SR); F = 3 * SR
    w = np.linspace(0, 1, F, dtype=np.float32)[:, None]
    seg = track[close:].copy()
    seg[:F] = seg[:F] * np.cos(w * np.pi / 2) + L2[:F] * np.sin(w * np.pi / 2); seg[F:] = L2[F:]
    track[close:] = seg
    rms = np.sqrt(np.mean(track ** 2)); track *= db(-22) / max(rms, 1e-6)
    gain = (1 - 0.66 * env)[:, None]  # about -9 dB under the voice
    head = np.linspace(0, 1, int(1.5 * SR))[:, None]; track[: len(head)] *= head
    t_end = int((END - 3.5) * SR); tail = np.linspace(1, 0, N - t_end)[:, None]; track[t_end:] *= tail
    return track * gain

def whooshes():
    out = np.zeros((N, 2), dtype=np.float32); rnd = np.random.default_rng(200)
    marks = [s["start"] for s in FILM["shots"] if s["kind"] == "fadeblack" and s["n"] > 1]
    marks += [s["start"] for s in FILM["shots"] if s["type"] == "clip" and s["clip"] == "l04-town"]
    for t in marks:
        d = int(1.6 * SR); n = rnd.standard_normal(d).astype(np.float32)
        b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
        pink = lfilter(b, a, n)
        k = np.linspace(0, 1, d)
        env = np.where(k < 0.55, (k / 0.55) ** 2, ((1 - k) / 0.45) ** 1.6)
        cut = 0.02 + 0.25 * np.sin(np.pi * k)  # a lowpass that opens then closes: the sweep
        y = np.zeros(d, dtype=np.float32); z = 0.0
        for i in range(d):
            z += cut[i] * (pink[i] - z); y[i] = z
        y = y / (np.abs(y).max() + 1e-6) * env * db(-23)
        i0 = max(0, int((t - 0.9) * SR)); seg = y[: N - i0]
        pan = 0.5 + 0.35 * np.sin(np.pi * k[: len(seg)])
        out[i0:i0 + len(seg), 0] += seg * (1 - pan) * 1.4; out[i0:i0 + len(seg), 1] += seg * pan * 1.4
    return out

def srt():
    def ts(x):
        h, m = int(x // 3600), int(x % 3600 // 60); s = x % 60
        return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
    rows = []
    for k, (lid, v) in enumerate(FILM["vo"].items(), 1):
        text = re.sub(r"\[([^\]]+)\]\(/[^)]*/\)", r"\1", v["text"]).replace("U P I", "UPI").replace("Expire Soon", "ExpireSoon")
        rows.append(f"{k}\n{ts(v['at'])} --> {ts(v['at'] + v['dur'] + 0.25)}\n{text}\n")
    (B / "smart-clearance-e2e-film.srt").write_text("\n".join(rows))

def main():
    preview = "--preview" in sys.argv
    vo_raw, vo = voice(); env = envelope(vo_raw)
    mix = vo + music(env) + whooshes()
    pre = B / "mix-pre.wav"; sf.write(pre, mix.astype(np.float32), SR, subtype="FLOAT")
    r = run(["ffmpeg", "-hide_banner", "-y", "-i", str(pre), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    m = json.loads(re.findall(r"\{[^{}]*\}", r.stderr)[-1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    final = B / "mix.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(pre), "-af", ln, "-ar", str(SR), "-c:a", "pcm_s24le", str(final)])
    silent = B / ("film-preview-silent.mp4" if preview else "film-silent.mp4")
    out = B / ("film-preview.mp4" if preview else "smart-clearance-e2e-film.mp4")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(silent), "-i", str(final), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
         "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", str(out)])
    srt(); print("mixed", out, f"(input {m['input_i']} LUFS)")

if __name__ == "__main__":
    main()

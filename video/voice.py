"""Rebuilds the walkthrough with the user's own narration.

Put recordings in video/my-voice/: either one file per segment (00-intro.m4a ... 10-outro.m4a, any
audio format) or a single take all.m4a with >= 1.5 s silences between segments. Then:

    python3 voice.py            # convert, measure, retime, rebuild, record, mux

Scene durations follow the recordings, so the video is re-timed to the voice.
"""
import json, re, subprocess, sys, pathlib
HERE = pathlib.Path(__file__).parent
MV = HERE / "my-voice"
segs = json.load(open(HERE / "narration.json"))

def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)

def dur(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)]).stdout
    return float(out.strip())

single = next((p for p in MV.iterdir() if p.stem == "all"), None) if MV.exists() else None
if single:
    # split one take on silences >= 1.5 s
    log = subprocess.run(["ffmpeg", "-i", str(single), "-af", "silencedetect=noise=-35dB:d=1.5", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(m) for m in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(m) for m in re.findall(r"silence_end: ([\d.]+)", log)]
    total = dur(single)
    cuts = [0.0] + [(s + e) / 2 for s, e in zip(starts, ends)] + [total]
    if len(cuts) - 1 != len(segs):
        sys.exit(f"found {len(cuts)-1} spoken chunks in all.*, expected {len(segs)}; adjust pauses or record per segment")
    for s, a, b in zip(segs, cuts, cuts[1:]):
        run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{a}", "-to", f"{b}", "-i", str(single),
             "-af", "silenceremove=start_periods=1:start_threshold=-40dB:stop_periods=1:stop_threshold=-40dB",
             "-ar", "48000", "-ac", "1", f"narration/{s['id']}.aiff"])
else:
    for s in segs:
        src = next((p for p in MV.glob(s["id"] + ".*")), None)
        if not src:
            sys.exit(f"missing recording for {s['id']} in my-voice/ (see RECORDING-KIT.md)")
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
             "-af", "silenceremove=start_periods=1:start_threshold=-40dB:stop_periods=1:stop_threshold=-40dB,loudnorm=I=-16:TP=-1.5",
             "-ar", "48000", "-ac", "1", f"narration/{s['id']}.aiff"])

for s in segs:
    s["audio_sec"] = round(dur(HERE / "narration" / f"{s['id']}.aiff"), 2)
    print(f"{s['id']:14s} {s['audio_sec']:6.1f}s")
speech = sum(s["audio_sec"] for s in segs)
print(f"speech total {speech:.1f}s (+ pauses = video length)")
json.dump(segs, open(HERE / "narration.json", "w"), indent=1, ensure_ascii=False)

# total video length follows the voice: speech + 2.2 s pause per segment, outro holds 3 s extra
total = round(speech + 2.2 * len(segs) + 3, 1)
b = (HERE / "build.py").read_text()
b = re.sub(r"TOTAL = [\d.]+", f"TOTAL = {total}", b)
(HERE / "build.py").write_text(b)
r = (HERE / "record.mjs").read_text()
r = re.sub(r"const TOTAL = \d+", f"const TOTAL = {int(total) + 1}", r)
(HERE / "record.mjs").write_text(r)
run(["python3", "build.py"])
print("recording video ...")
subprocess.run(["node", "record.mjs"], check=True)
subprocess.run(["bash", "mix.sh"], check=True)
print("done: walkthrough.mp4")

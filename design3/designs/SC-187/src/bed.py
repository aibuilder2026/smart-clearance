#!/usr/bin/env python3
"""SC-187: the music bed from the Lyria 2 clips (music/): the picked bed looped on itself through long crossfades for the
film's length, the lift clip crossfaded in at the ledger, and a fade at the end. ffmpeg only; deterministic.

  python3 bed.py --bed bed-6 --lift lift-2 --length 185 --lift-at 142 --out bed.wav
"""
import argparse, subprocess, pathlib
HERE = pathlib.Path(__file__).resolve().parent

def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], text=True, capture_output=True).stdout.strip())

def main():
    a = argparse.ArgumentParser()
    a.add_argument("--bed", default="bed-6"); a.add_argument("--lift", default=""); a.add_argument("--length", type=float, default=185)
    a.add_argument("--lift-at", type=float, default=142); a.add_argument("--xf", type=float, default=3.0); a.add_argument("--out", default="bed.wav")
    a.add_argument("--lift-gain", type=float, default=1.0)
    o = a.parse_args()
    bed = HERE / "music" / f"{o.bed}.wav"
    L = dur(bed)
    head = 0.4  # the clip's first moments settle
    seg = L - head - 0.6
    # how many copies of the bed cover the length up to the lift (or the end)
    until = o.lift_at + o.xf if o.lift else o.length
    n = 1
    while head + seg + (n - 1) * (seg - o.xf) < until:
        n += 1
    inputs, chain, labels = [], "", []
    for i in range(n):
        inputs += ["-i", str(bed)]
        chain += f"[{i}:a]atrim={head}:{head+seg},asetpts=PTS-STARTPTS[b{i}];"
        labels.append(f"[b{i}]")
    prev = "b0"
    for i in range(1, n):
        chain += f"[{prev}][b{i}]acrossfade=d={o.xf}:c1=tri:c2=tri[x{i}];"
        prev = f"x{i}"
    if o.lift:
        lift = HERE / "music" / f"{o.lift}.wav"
        LL = dur(lift)
        chain += f"[{prev}]atrim=0:{o.lift_at + o.xf}[bedpart];"
        inputs += ["-i", str(lift)]
        chain += f"[{n}:a]atrim={head}:{LL-0.3},asetpts=PTS-STARTPTS,volume={o.lift_gain}[lf];"
        # the lift may be shorter than what is left: loop it once more if needed
        rest = o.length - o.lift_at
        if LL - head - 0.3 < rest + o.xf:
            inputs += ["-i", str(lift)]
            chain += f"[{n+1}:a]atrim={head}:{LL-0.3},asetpts=PTS-STARTPTS,volume={o.lift_gain}[lf2];[lf][lf2]acrossfade=d={o.xf}:c1=tri:c2=tri[lfx];"
            lf = "lfx"
        else:
            lf = "lf"
        chain += f"[bedpart][{lf}]acrossfade=d={o.xf}:c1=tri:c2=tri[all];"
        prev = "all"
    chain += f"[{prev}]atrim=0:{o.length},afade=t=out:st={o.length-6}:d=6,afade=t=in:st=0:d=1.5,aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo[out]"
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"] + inputs + ["-filter_complex", chain, "-map", "[out]", str(HERE / o.out)]
    subprocess.run(cmd, check=True)
    print(f"wrote {o.out}: {dur(HERE / o.out):.1f} s from {n} x {o.bed}" + (f" + {o.lift} from {o.lift_at} s" if o.lift else ""))

if __name__ == "__main__":
    main()

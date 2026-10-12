#!/usr/bin/env bash
cd "$(dirname "$0")"
LIFT="Polished corporate technology underscore, the warmer fuller section of the same piece: soft felt piano motif now joined by a warm string swell and a gentle rising synth pad, hopeful and resolved, still calm and spacious, steady 68 BPM, D-flat major, no drums, no vocals, modern clean mix, even from start to end"
for s in 1 2; do python3 lyria.py --name lift-$s --seed $((187300+s)) --prompt "$LIFT"; done
echo "lift done"

#!/usr/bin/env bash
cd "$(dirname "$0")"
UP="Polished, optimistic corporate technology underscore for a narrated product demo: soft felt piano playing a simple forward-looking motif, warm string pad, a light airy synth arpeggio far in the background, subtle soft pulse, hopeful and confident, bright but gentle, minimal and spacious, steady 76 BPM, no drums, no vocals, modern clean mix, even from start to end"
for s in 4 5 6; do python3 lyria.py --name bed-$s --seed $((187100+s)) --prompt "$UP"; done
echo "bed2 done"

#!/usr/bin/env bash
# SC-187: three candidates for the music bed, then two for the lift, from Lyria 2
cd "$(dirname "$0")"
BED="Understated corporate product-film underscore for a narrated demo: a soft felt piano playing a slow, simple, hopeful motif, a warm sustained string pad, a very subtle slow synth pulse, airy and spacious, gentle and optimistic, minimal, steady 72 BPM, D major, no drums, no vocals, clean modern mix, consistent from start to end"
for s in 1 2 3; do python3 lyria.py --name bed-$s --seed $((187000+s)) --prompt "$BED"; done
echo "bed done"

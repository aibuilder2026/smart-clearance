#!/usr/bin/env bash
# SC-210: the score's cues on Lyria 2 (lyria-002, $0.06 a 32.8 s clip, inside the film's $35 Vertex cap): six cues, two
# seeds each, one key (D) and slow tempi so they cross-fade into one score; Gemini (ears.py) judges each.
#   nohup ./gen-lyria10.sh > gen-lyria10.log 2>&1 &
set -u
cd "$(dirname "$0")"
NEG="vocals, singing, lyrics, choir words, drums, drum kit, percussion hits, distortion, lo-fi, aggressive, harsh, fast tempo, EDM, dubstep, trap"
cue(){ # name prompt
  for seed in 2101 2102; do python3 lyria.py --name "$1-$seed" --seed $seed --cap 3 --negative "$NEG" --prompt "$2" 2>&1 | tail -1; done; }
cue waste "A surreal, slow, melancholic cinematic underscore in D minor at 72 BPM: a soft felt piano playing sparse notes with long reverse-reverb tails, a warm tanpura drone, distant breathy bansuri flute phrases, granular shimmering textures, deep sub swells, dreamy and weightless, like time running out in slow motion. Spacious and quiet, no drums."
cue reveal "A surreal, hopeful cinematic underscore in D major at 80 BPM: luminous evolving synth pads, a gentle pulsing arpeggio of soft plucked notes, a tanpura drone underneath, a warm bansuri melody rising, airy wordless pads, a sense of dawn and wonder. Spacious and uplifting, no drums."
cue eco "A futuristic, surreal ambient electronica underscore in D at 84 BPM: glassy shimmering arpeggiated synths, crystalline bell textures, a slow deep pulse, swirling granular pads, subtle santoor-like plucks with long delays, an intelligent system coming alive, hypnotic and elegant. No drums, no vocals."
cue journey "A warm, gently driving cinematic underscore in D major at 88 BPM: a soft heartbeat-like low pulse, light plucked santoor and acoustic guitar patterns, dreamy pads, an airy bansuri countermelody, optimistic and human, people at work across India, flowing and steady. No drums, no vocals."
cue papers "A confident, surreal cinematic underscore in D major at 84 BPM: clean evolving pads, a soft piano motif, shimmering high textures, a gradual build of warmth and clarity, satisfying and precise, like everything falling into place. No drums, no vocals."
cue close "An emotional, surreal cinematic finale in D major at 76 BPM: wide luminous string-like pads, a tender bansuri melody, a tanpura drone, soft piano, warm swelling chords resolving to a long sustained final chord, hopeful and grateful. No drums, no vocals."
echo "lyria10 done $(date +%H:%M:%S)"

"""SC-228 (cut 17): a line's words with the film times they are spoken (the take's own word times from its line's start,
as parts.T has it), to place a ring or a cue on what is said.

   .venv/bin/python words17.py m04 m05 …"""
import sys
import parts as P

for lid in sys.argv[1:]:
    t0 = P.T[lid][0]
    print(lid, ' '.join(f"{w['w']}@{t0 + w['s']:.2f}" for w in P.ASR[lid]['words']))

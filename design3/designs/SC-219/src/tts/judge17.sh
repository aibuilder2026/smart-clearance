#!/usr/bin/env bash
# SC-228: Gemini (SC-210's ears.py) judges each take as a live product-demo presenter; prints the score and the read
ASK="Listen to this narration from a product demo video. Judge it strictly as a live product-demo presenter speaking to a panel of hackathon judges. Report briefly: accent; pace in words per minute; whether it sounds like a real professional presenter walking someone through a product (engaged, conversational, confident) or like a robotic TTS, an advert, an announcer or a storyteller; any mispronunciations or odd stresses (quote the words, especially Munchly, kiranas, ExpireSoon, API); and a 1 to 10 score for how convincingly real, professional and demo-like it is. Answer as compact JSON with keys accent, wpm, sounds_like, artefacts, score, notes."
for f in "$@"; do
  r=$(python3 "$(dirname "$0")/../../../SC-210/src/ears.py" "$f" --ask "$ASK" 2>&1)
  s=$(printf '%s' "$r" | grep -o '"score": *[0-9.]*' | head -1 | grep -o '[0-9.]*$')
  a=$(printf '%s' "$r" | grep -o '"artefacts": *"[^"]*"' | head -1 | cut -c1-160)
  w=$(printf '%s' "$r" | grep -o '"wpm": *[0-9.]*' | head -1 | grep -o '[0-9.]*$')
  echo "$(basename "$f") score=$s wpm=$w $a"
done

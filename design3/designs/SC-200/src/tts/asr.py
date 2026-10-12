"""Transcribe each wav back with Whisper large-v3-turbo (mlx) and print it, with its words a second."""
import sys, json, soundfile as sf, mlx_whisper
res = {}
for p in sys.argv[1:]:
    r = mlx_whisper.transcribe(p, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="en", word_timestamps=True)
    dur = sf.info(p).duration; words = sum(len(s.get("words", [])) for s in r["segments"])
    res[p] = {"text": r["text"].strip(), "dur": round(dur, 2), "wps": round(words / dur, 2),
              "last_word_end": round(r["segments"][-1]["words"][-1]["end"], 2) if r["segments"] and r["segments"][-1].get("words") else None}
    print(json.dumps({p: res[p]}, ensure_ascii=False), flush=True)

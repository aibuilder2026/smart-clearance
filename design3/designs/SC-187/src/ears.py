#!/usr/bin/env python3
"""SC-187: Gemini listens to an audio file (through Vertex AI, the project's own model) and describes it, so music and
voice candidates can be judged here before the maintainer hears them. Cheap: a few thousand tokens a file.

  python3 ears.py music/bed-1.wav [--ask "…"]
"""
import argparse, base64, json, pathlib, subprocess, sys
PROJECT, LOC, MODEL = "aibuilder-510213", "global", "gemini-3.8-flash"
ASK_MUSIC = ("Listen to this music clip. Report, briefly and factually: tempo in BPM; the key; the instruments you hear; whether there are any vocals, drum hits or harsh sounds; "
             "the mood; how consistent it is from start to end (any abrupt change); whether its ending could loop back to its start; and a 1 to 10 score for suitability as a quiet, "
             "professional underscore beneath a narrated corporate product-demo video (think a Big Four consultancy's product film). Answer as compact JSON with keys bpm, key, instruments, "
             "vocals_or_drums, mood, consistency, loopable, score, notes.")
ASK_VOICE = ("Listen to this narration. Report briefly: the voice's gender and apparent accent; its pace (words per minute, estimated); its warmth and confidence; any robotic artefacts, mispronunciations "
             "or odd stresses (quote them); whether it would pass as a professional corporate product-film narrator; and a 1 to 10 score. Answer as compact JSON with keys gender, accent, wpm, delivery, artefacts, professional, score, notes.")

def main():
    a = argparse.ArgumentParser(); a.add_argument("path"); a.add_argument("--ask"); a.add_argument("--voice", action="store_true"); a.add_argument("--model", default=MODEL)
    o = a.parse_args()
    p = pathlib.Path(o.path)
    # a small mp3 copy: an inline WAV is too big for a command line, and Gemini needs no more
    tmp = pathlib.Path("/tmp") / (p.stem + ".ears.mp3")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(p), "-ac", "1", "-ar", "24000", "-b:a", "64k", str(tmp)], check=True)
    data = base64.b64encode(tmp.read_bytes()).decode()
    mime = "audio/mpeg"
    ask = o.ask or (ASK_VOICE if o.voice else ASK_MUSIC)
    tok = subprocess.run(["gcloud", "auth", "print-access-token"], text=True, capture_output=True, check=True).stdout.strip()
    body = {"contents": [{"role": "user", "parts": [{"inlineData": {"mimeType": mime, "data": data}}, {"text": ask}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 6000}}
    host = "aiplatform.googleapis.com" if LOC == "global" else f"{LOC}-aiplatform.googleapis.com"
    bf = pathlib.Path("/tmp") / (p.stem + ".ears.json"); bf.write_text(json.dumps(body))
    r = subprocess.run(["curl", "-s", "-X", "POST", "-H", f"Authorization: Bearer {tok}", "-H", "Content-Type: application/json",
                        f"https://{host}/v1/projects/{PROJECT}/locations/{LOC}/publishers/google/models/{o.model}:generateContent", "-d", f"@{bf}"],
                       text=True, capture_output=True, check=True)
    d = json.loads(r.stdout)
    try:
        text = "".join(pt.get("text", "") for pt in d["candidates"][0]["content"]["parts"])
    except Exception:
        sys.exit(f"no answer: {r.stdout[:600]}")
    print(f"{p.name}: {text.strip()}")

if __name__ == "__main__":
    main()

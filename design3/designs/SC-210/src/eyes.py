#!/usr/bin/env python3
"""SC-187 (SC-210: --audio keeps the soundtrack, for the talking scenes' lip sync): Gemini watches a generated clip (through Vertex AI, the project's own model) and reports every visual
artefact, so each Veo clip is reviewed before it is cut in. A 720p copy at a modest bitrate goes inline.

  python3 eyes.py clips/c21-godown-date.mp4 [--ask "…"]
"""
import argparse, base64, json, pathlib, subprocess, sys
PROJECT, LOC, MODEL = "aibuilder-510213", "global", "gemini-3.8-flash"
ASK = ("You are a meticulous VFX supervisor reviewing an AI-generated live-action clip (8 s) for a corporate product film about a software platform for Indian FMCG brands. "
       "Watch every frame. Report as compact JSON with keys: people (count, and whether each keeps a consistent face and body throughout); anatomy_errors (any extra, missing, merged or deformed hands, fingers, arms, legs, faces; quote the time); "
       "object_errors (objects, phones, cartons, packets or screens that appear, vanish, morph, duplicate, float or pass through something; quote the time); "
       "text_errors (printed labels, phone or tablet screens, signs: do they stay stable and legible, or warp, flicker, change content or turn to gibberish; quote the time); "
       "physics_errors (impossible motion, sliding, jitter, frozen parts, warped backgrounds); camera (smooth or shaky); "
       "severity (none / minor / noticeable / unusable); verdict (one line: usable as is, usable if cut to seconds X-Y, or re-render). Be strict: a human viewer must not notice anything odd.")
ASK_AUDIO = (" This clip has its soundtrack: also report lip_sync (does each speaker's mouth move with their words, from first word to last; who speaks when; quote the time of any drift or of a mouth moving with no sound), "
             "speech (the words heard, verbatim, the accent, and whether the voice suits the person on screen), and audio_errors (music, extra voices, hum, clicks, cut-off words, unnatural pitch; quote the time).")

def main():
    a = argparse.ArgumentParser(); a.add_argument("path"); a.add_argument("--ask"); a.add_argument("--model", default=MODEL); a.add_argument("--audio", action="store_true")
    o = a.parse_args(); p = pathlib.Path(o.path)
    tmp = pathlib.Path("/tmp") / (p.stem + ".eyes.mp4")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(p), *(["-c:a", "aac", "-b:a", "96k"] if o.audio else ["-an"]), "-vf", "scale=1280:-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-movflags", "+faststart", str(tmp)], check=True)
    data = base64.b64encode(tmp.read_bytes()).decode()
    tok = subprocess.run(["gcloud", "auth", "print-access-token"], text=True, capture_output=True, check=True).stdout.strip()
    body = {"contents": [{"role": "user", "parts": [{"inlineData": {"mimeType": "video/mp4", "data": data}}, {"text": o.ask or (ASK + (ASK_AUDIO if o.audio else ""))}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 6000}}
    bf = pathlib.Path("/tmp") / (p.stem + ".eyes.json"); bf.write_text(json.dumps(body))
    host = "aiplatform.googleapis.com" if LOC == "global" else f"{LOC}-aiplatform.googleapis.com"
    r = subprocess.run(["curl", "-s", "-X", "POST", "-H", f"Authorization: Bearer {tok}", "-H", "Content-Type: application/json",
                        f"https://{host}/v1/projects/{PROJECT}/locations/{LOC}/publishers/google/models/{o.model}:generateContent", "-d", f"@{bf}"], text=True, capture_output=True, check=True)
    d = json.loads(r.stdout)
    try:
        text = "".join(pt.get("text", "") for pt in d["candidates"][0]["content"]["parts"])
    except Exception:
        sys.exit(f"no answer: {r.stdout[:600]}")
    print(f"{p.name}: {text.strip()}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""SC-187: the film's voice-over, beat by beat, from Google Cloud Text-to-Speech.

Reads lines.json: nine lines (one a scene), each split into its beats (the storyboard's sentences), each beat with the
storyboard's `text` and the `tts` reading the voice gets; and the candidate voices, each a folder under vo/:

  - Chirp 3 HD (v1): en-IN-Chirp3-HD-Kore and -Charon at speakingRate 1.0, and both at 0.95 for a more measured
    delivery;
  - Gemini-TTS (v1beta1): Kore and Charon on gemini-2.5-pro-tts, directed by the measured style `prompt` in
    lines.json, and Kore under the brisker `prompt_brisk`, at speakingRate 1.0 and 1.1 (v1beta1 takes a rate).

For every voice and beat it synthesises vo/<voice>/<beat>.wav (LINEAR16, 24 kHz, mono), measures it with ffprobe,
trims the silence under -45 dB at both ends with ffmpeg into <beat>-trim.wav, and counts the pauses inside the take
(silence under -40 dB for 0.15 s or more). A line's total is its trimmed beats with 0.35 s between them; it must end
1.5 s before its scene does. Where a line of a voice at 1.0 runs over, every beat of that line is synthesised
again at speakingRate 1.08 (<beat>-fast108.wav), then 1.15 (<beat>-fast115.wav), and the first that fits is recorded;
the same for a Gemini voice at 1.0.
vo/<voice>/all.wav is the whole voice-over at the voice's own rate, 0.35 s between beats and 0.7 s between lines,
to audition. vo/durations.json records every take, each line's total against its budget, and each voice's
profile (words a second, pause share), which is all a duration can say about how measured it sounds.

Authentication is gcloud's own (`gcloud auth print-access-token`), billed to the project through the
x-goog-user-project header. A take that already exists is not synthesised again (--force does). A parameter the API
refuses is dropped and the refusal recorded; a Gemini request is tried in the API's three spellings before the voice
is given up and noted, and Gemini requests are paced (GEMINI_INTERVAL) under its per-minute quota. Nothing but the standard library and the ffmpeg, ffprobe and gcloud binaries.

  python3 vo.py                                   # every voice in lines.json
  python3 vo.py --voice gemini-2.5-pro-tts-Kore   # one voice (its id in lines.json)
  python3 vo.py --force                           # synthesise everything again
"""

import argparse
import base64
import json
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = "aibuilder-510213"
ENDPOINT = {"chirp": "https://texttospeech.googleapis.com/v1/text:synthesize",
            "gemini": "https://texttospeech.googleapis.com/v1beta1/text:synthesize"}
RATE = 24000
BEAT_GAP = 0.35  # seconds between a line's beats
LINE_GAP = 0.7  # seconds between lines in all.wav
SLACK = 1.5  # a line must end this long before its scene does
FAST = (1.08, 1.15)  # the speaking rates tried when a line runs over
SILENCE = "-45dB"  # trimmed at the ends
PAUSE = ("-40dB", 0.15)  # a pause inside a take: this quiet, this long
WORKERS = 4
GEMINI_INTERVAL = 5.0  # seconds between Gemini-TTS requests: its quota is a few requests a minute a model

_gemini_gate = threading.Lock()
_gemini_last = [0.0]

_token_lock = threading.Lock()
_token = {"value": None, "at": 0.0}


def token(fresh: bool = False) -> str:
    with _token_lock:
        if fresh or _token["value"] is None or time.time() - _token["at"] > 2400:
            out = subprocess.run(["gcloud", "auth", "print-access-token"], check=True, capture_output=True, text=True)
            _token.update(value=out.stdout.strip(), at=time.time())
        return _token["value"]


def _post(url: str, body: dict) -> bytes:
    """one request, the token refreshed once on a 401, 429 and 5xx retried with a backoff (up to about four
    minutes in all); a Gemini request waits its turn, GEMINI_INTERVAL after the one before"""
    delay = 4.0
    for attempt in range(9):
        if url == ENDPOINT["gemini"]:
            with _gemini_gate:
                wait = _gemini_last[0] + GEMINI_INTERVAL - time.time()
                if wait > 0:
                    time.sleep(wait)
                _gemini_last[0] = time.time()
        req = urllib.request.Request(
            url, data=json.dumps(body).encode(), method="POST",
            headers={"Authorization": f"Bearer {token(fresh=attempt == 1)}", "x-goog-user-project": PROJECT,
                     "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return base64.b64decode(json.load(r)["audioContent"])
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")
            if e.code == 401 and attempt == 0:
                continue
            if e.code in (429, 500, 502, 503, 504) and attempt < 8:
                time.sleep(delay)
                delay = min(delay * 1.6, 60)
                continue
            raise RuntimeError(f"HTTP {e.code}: {detail[:600]}")
    raise RuntimeError("gave up")


def chirp_request(text: str, voice: dict, rate: float, config: dict) -> dict:
    return {"input": {"text": text}, "voice": {"languageCode": "en-IN", "name": voice["name"]}, "audioConfig": config}


def gemini_requests(text: str, voice: dict, prompt: str, config: dict) -> list:
    """the three spellings of a Gemini-TTS request, tried in this order"""
    v = {"languageCode": "en-IN", "name": voice["name"]}
    return [
        ("input.prompt + voice.modelName", {"input": {"text": text, "prompt": prompt}, "voice": {**v, "modelName": voice["model"]}, "audioConfig": config}),
        ("prompt at the top + voice.modelName", {"input": {"text": text}, "prompt": prompt, "voice": {**v, "modelName": voice["model"]}, "audioConfig": config}),
        ("input.prompt + voice.model_name", {"input": {"text": text, "prompt": prompt}, "voice": {**v, "model_name": voice["model"]}, "audioConfig": config}),
    ]


def synthesize(text: str, voice: dict, rate: float, prompt: str, notes: list) -> bytes:
    if voice["engine"] == "chirp":
        config = {"audioEncoding": "LINEAR16", "sampleRateHertz": RATE, "speakingRate": rate}
        droppable = ["speakingRate", "sampleRateHertz"]
        while True:
            try:
                return _post(ENDPOINT["chirp"], chirp_request(text, voice, rate, config))
            except RuntimeError as e:
                if "HTTP 400" in str(e) and droppable:
                    dropped = droppable.pop(0)
                    notes.append({"voice": voice["id"], "refused": dropped, "error": str(e)[:300]})
                    print(f"    {voice['id']}: refused; dropping {dropped}: {str(e)[:160]}", file=sys.stderr)
                    config.pop(dropped, None)
                    continue
                raise
    config = {"audioEncoding": "LINEAR16", "sampleRateHertz": RATE}
    if rate != 1.0:
        config["speakingRate"] = rate
    errors = []
    for form, body in gemini_requests(text, voice, prompt, config):
        try:
            out = _post(ENDPOINT["gemini"], body)
            if form != "input.prompt + voice.modelName" and not any(n.get("form") == form for n in notes):
                notes.append({"voice": voice["id"], "form": form, "note": "the first spelling was refused; this one answered"})
            return out
        except RuntimeError as e:
            errors.append(f"{form}: {str(e)[:200]}")
            if "HTTP 400" not in str(e) and "HTTP 404" not in str(e):
                break
    raise RuntimeError("Gemini-TTS unavailable: " + " | ".join(errors))


def duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         check=True, capture_output=True, text=True).stdout.strip()
    return round(float(out), 3)


def trim(src: Path, dst: Path) -> None:
    """the silence under -45 dB cut from both ends: forwards, then reversed and forwards again"""
    cut = f"silenceremove=start_periods=1:start_duration=0:start_threshold={SILENCE}"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", f"{cut},areverse,{cut},areverse",
                    "-c:a", "pcm_s16le", str(dst)], check=True)


def pauses(path: Path) -> tuple:
    """how many pauses inside the take, and their seconds together"""
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", str(path), "-af", f"silencedetect=noise={PAUSE[0]}:d={PAUSE[1]}",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    found = [float(m) for m in re.findall(r"silence_duration: ([\d.]+)", out)]
    return len(found), round(sum(found), 3)


def measure(raw: Path, trimmed: Path) -> dict:
    trim(raw, trimmed)
    n, s = pauses(trimmed)
    return {"file": str(raw.relative_to(HERE)), "untrimmed": duration(raw), "trimmed": duration(trimmed), "pauses": n, "pause_s": s}


def concat(parts: list, dst: Path) -> None:
    """(path, gap-before) pairs, one after another, in the parts' own format"""
    with wave.open(str(dst), "wb") as w:
        params = None
        for path, gap in parts:
            with wave.open(str(path), "rb") as r:
                if params is None:
                    params = r.getparams()
                    w.setnchannels(params.nchannels)
                    w.setsampwidth(params.sampwidth)
                    w.setframerate(params.framerate)
                if gap:
                    w.writeframes(b"\0" * int(gap * params.framerate) * params.nchannels * params.sampwidth)
                w.writeframes(r.readframes(r.getnframes()))


def line_total(beats: list, key: str) -> float:
    return round(sum(b[key]["trimmed"] for b in beats) + BEAT_GAP * (len(beats) - 1), 3)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--voice", action="append", help="a voice id from lines.json (default: every voice)")
    p.add_argument("--force", action="store_true", help="synthesise again even where a take exists")
    a = p.parse_args()

    spec = json.loads((HERE / "lines.json").read_text())
    voices = [v for v in spec["voices"] if not a.voice or v["id"] in a.voice]
    notes: list = []
    report: dict = {"rate": RATE, "silence": SILENCE, "pause": {"threshold": PAUSE[0], "min_s": PAUSE[1]},
                    "beat_gap": BEAT_GAP, "line_gap": LINE_GAP, "slack": SLACK, "voices": {}}
    pool = ThreadPoolExecutor(WORKERS)

    def job(voice: dict, beat: dict, rate: float, stem: str, force: bool):
        folder = HERE / "vo" / voice["id"]
        raw = folder / f"{stem}.wav"
        if force or not raw.exists():
            prompt = spec["prompt_brisk"] if voice.get("prompt") == "brisk" else spec["prompt"]
            raw.write_bytes(synthesize(beat["tts"], voice, rate, prompt, notes))
        return raw

    for voice in voices:
        folder = HERE / "vo" / voice["id"]
        folder.mkdir(parents=True, exist_ok=True)
        print(f"{voice['id']} ({voice['engine']}, rate {voice['rate']})")
        # every beat, in parallel
        futures = {b["id"]: pool.submit(job, voice, b, voice["rate"], b["id"], a.force) for l in spec["lines"] for b in l["beats"]}
        try:
            for f in futures.values():
                f.result()
        except RuntimeError as e:
            print(f"  {e}", file=sys.stderr)
            notes.append({"voice": voice["id"], "unavailable": str(e)[:600]})
            report["voices"][voice["id"]] = {"voice": voice, "unavailable": str(e)[:600]}
            continue

        lines_out = []
        words_all = 0
        for line in spec["lines"]:
            rec = {"n": line["n"], "scene": line["scene"], "at": line["at"], "length": line["length"],
                   "budget": round(line["length"] - SLACK, 2), "beats": []}
            for b in line["beats"]:
                words = len(b["tts"].split())
                words_all += words
                rec["beats"].append({"id": b["id"], "words": words, "take": measure(folder / f"{b['id']}.wav", folder / f"{b['id']}-trim.wav")})
            rec["total"] = line_total(rec["beats"], "take")
            rec["fits"] = rec["total"] <= rec["budget"]
            rec["use_rate"] = voice["rate"] if rec["fits"] else None
            print(f"  line {line['n']} {line['scene']:<24} {rec['total']:6.2f} s of {rec['budget']:.1f} s "
                  f"({', '.join(f'{b['id']} {b['take']['trimmed']:.2f}' for b in rec['beats'])}): {'fits' if rec['fits'] else 'runs over'}")
            # a line that runs over, at a faster rate: every beat again (Chirp at 1.0 only)
            if not rec["fits"] and voice["rate"] == 1.0:
                for rate in FAST:
                    key = f"fast{int(round(rate * 100))}"
                    fut = {b["id"]: pool.submit(job, voice, b, rate, f"{b['id']}-{key}", a.force) for b in line["beats"]}
                    for f in fut.values():
                        f.result()
                    for b, bb in zip(line["beats"], rec["beats"]):
                        bb[key] = measure(folder / f"{b['id']}-{key}.wav", folder / f"{b['id']}-{key}-trim.wav")
                        bb[key]["rate"] = rate
                    rec[key] = line_total(rec["beats"], key)
                    fits = rec[key] <= rec["budget"]
                    print(f"       at {rate}: {rec[key]:6.2f} s: {'fits' if fits else 'runs over'}")
                    if fits:
                        rec["use_rate"] = rate
                        break
            lines_out.append(rec)

        parts = []
        for i, l in enumerate(lines_out):
            for j, b in enumerate(l["beats"]):
                parts.append((folder / f"{b['id']}-trim.wav", 0 if (i == 0 and j == 0) else (BEAT_GAP if j else LINE_GAP)))
        concat(parts, folder / "all.wav")
        total = duration(folder / "all.wav")
        speech = round(sum(b["take"]["trimmed"] for l in lines_out for b in l["beats"]), 3)
        pause_s = round(sum(b["take"]["pause_s"] for l in lines_out for b in l["beats"]), 3)
        pause_n = sum(b["take"]["pauses"] for l in lines_out for b in l["beats"])
        profile = {"words": words_all, "speech_s": speech, "words_per_s": round(words_all / speech, 3),
                   "pauses": pause_n, "pause_s": pause_s, "pause_share": round(pause_s / speech, 3),
                   "words_per_s_voiced": round(words_all / (speech - pause_s), 3),
                   "lines_over": [l["n"] for l in lines_out if not l["fits"]]}
        print(f"  all.wav {total:.1f} s; {words_all} words in {speech:.1f} s of speech: {profile['words_per_s']:.2f} w/s, "
              f"{pause_n} pauses ({pause_s:.1f} s, {profile['pause_share']:.0%}); lines over: {profile['lines_over'] or 'none'}")
        report["voices"][voice["id"]] = {"voice": voice, "lines": lines_out, "all": total, "profile": profile}

    pool.shutdown()
    report["notes"] = notes
    (HERE / "vo").mkdir(exist_ok=True)
    (HERE / "vo" / "durations.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"wrote vo/durations.json ({len(notes)} notes)")


if __name__ == "__main__":
    main()

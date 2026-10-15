#!/usr/bin/env python3
"""SC-210: the sales film's narrator, from Google Cloud Text-to-Speech (the maintainer's pick: a Gemini Indian English
narrator, inside the film's $35 Vertex cap; a full pass of the script costs about $0.15).

  bake    every candidate reads the same sample (four lines of the script) into bake10/<voice>.wav, to be scored:
          the 14 Chirp 3 HD en-IN women's voices as they are, and Gemini-TTS (gemini-2.5-pro-tts) voices directed by
          PROMPT, in en-IN;
  lines   one voice reads every line of ../lines.json (its `say` where it has one), `takes` takes a line, into
          vo10/<voice>/takes/<id>-<k>.wav, for pick.py to keep the take Whisper reads back best.

Authentication is gcloud's own, billed to the project through x-goog-user-project; 429 and 5xx are retried with a
backoff, and Gemini requests are paced under its per-minute quota. Standard library, ffmpeg and gcloud only.

  python3 tts10.py bake
  python3 tts10.py lines gemini-Sulafat 3 [ids…]
"""
import base64, json, subprocess, sys, threading, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = "aibuilder-510213"
CHIRP = "https://texttospeech.googleapis.com/v1/text:synthesize"
GEMINI = "https://texttospeech.googleapis.com/v1beta1/text:synthesize"
RATE = 24000
GEMINI_MODEL = "gemini-2.5-pro-tts"
GEMINI_INTERVAL = 4.0
PROMPT_1 = ("You are the narrator of a cinematic film about Indian food brands and the shopkeepers who sell their food: a warm, "
          "cultured Indian woman in her thirties, speaking Indian English with a natural Indian accent. Speak like a real person "
          "telling a story she cares about, not like an announcer or an advertisement: natural breaths, gentle rises and falls, "
          "a soft, intimate warmth on the problem, quiet confidence on the solution, and real pauses at full stops. Unhurried, "
          "never robotic, never sing-song, never theatrical.")
# the direction the second round chose (bake10b: Sulafat judged the most human, warmest and most cinematic)
PROMPT = ("Read this aloud as a real Indian woman in her thirties recording a voice-over in a quiet studio, close to the "
          "microphone: an educated urban Indian English accent, as spoken in Bengaluru or Mumbai. Intimate and conversational, "
          "like telling a friend a story she has lived, never like an announcer or an advert. Breathe naturally before each "
          "sentence. Let the pace move: slower and a little lower on the problem, a small smile in the voice on the hopeful lines, "
          "lightly quicker through the lists. Real pauses at full stops, tiny ones at commas.")
CHIRP_VOICES = ["Achernar", "Aoede", "Autonoe", "Callirrhoe", "Despina", "Erinome", "Gacrux", "Kore", "Laomedeia", "Leda",
                "Pulcherrima", "Sulafat", "Vindemiatrix", "Zephyr"]
GEMINI_VOICES = ["Kore", "Aoede", "Leda", "Sulafat", "Achernar", "Despina", "Gacrux", "Vindemiatrix"]
SAMPLE = ["o1", "o2", "p4", "m3"]

_tok = {"v": None, "at": 0.0}
_tl = threading.Lock()
_gate = threading.Lock()
_last = [0.0]


def token(fresh=False):
    with _tl:
        if fresh or not _tok["v"] or time.time() - _tok["at"] > 2400:
            _tok["v"] = subprocess.run(["gcloud", "auth", "print-access-token"], check=True, capture_output=True, text=True).stdout.strip()
            _tok["at"] = time.time()
        return _tok["v"]


def post(url, body):
    delay = 4.0
    for attempt in range(9):
        if url == GEMINI:
            with _gate:
                w = _last[0] + GEMINI_INTERVAL - time.time()
                if w > 0: time.sleep(w)
                _last[0] = time.time()
        req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST", headers={
            "Authorization": f"Bearer {token(fresh=attempt == 1)}", "x-goog-user-project": PROJECT, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return base64.b64decode(json.load(r)["audioContent"])
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")
            if e.code == 401 and attempt == 0: continue
            if e.code in (429, 500, 502, 503, 504) and attempt < 8:
                time.sleep(delay); delay = min(delay * 1.6, 60); continue
            raise RuntimeError(f"HTTP {e.code}: {detail[:500]}")
    raise RuntimeError("gave up")


def synth(voice, text):
    """voice: 'chirp-<Name>' or 'gemini-<Name>'"""
    eng, name = voice.split("-", 1)
    cfg = {"audioEncoding": "LINEAR16", "sampleRateHertz": RATE}
    if eng == "chirp":
        return post(CHIRP, {"input": {"text": text}, "voice": {"languageCode": "en-IN", "name": f"en-IN-Chirp3-HD-{name}"}, "audioConfig": cfg})
    return post(GEMINI, {"input": {"text": text, "prompt": PROMPT},
                         "voice": {"languageCode": "en-IN", "name": name, "modelName": GEMINI_MODEL}, "audioConfig": cfg})


def lines():
    return json.loads((HERE.parent / "lines.json").read_text())["lines"]


def bake():
    global PROMPT
    PROMPT = PROMPT_1
    by = {l["id"]: l for l in lines()}
    text = " ".join(by[i].get("say", by[i]["text"]) for i in SAMPLE)
    (HERE / "bake10").mkdir(exist_ok=True)
    (HERE / "bake10" / "sample.txt").write_text(text)
    voices = [f"chirp-{v}" for v in CHIRP_VOICES] + [f"gemini-{v}" for v in GEMINI_VOICES]

    def one(v):
        out = HERE / "bake10" / f"{v}.wav"
        if out.exists(): return v, "kept"
        try:
            out.write_bytes(synth(v, text)); return v, "ok"
        except RuntimeError as e:
            return v, f"failed {e}"
    with ThreadPoolExecutor(4) as pool:
        for v, s in pool.map(one, voices):
            print(v, s, flush=True)


def read_lines(voice, takes, only):
    out = HERE / "vo3" / voice / "takes"   # parts.py and pick.py read vo3/<voice>
    out.mkdir(parents=True, exist_ok=True)
    jobs = [(l, k) for l in lines() if l.get("kind") != "talk" and (not only or l["id"] in only) for k in range(takes)]

    def one(job):
        l, k = job
        p = out / f"{l['id']}-{k}.wav"
        if p.exists(): return p.name, "kept"
        try:
            p.write_bytes(synth(voice, l.get("say", l["text"]))); return p.name, "ok"
        except RuntimeError as e:
            return p.name, f"failed {e}"
    with ThreadPoolExecutor(4) as pool:
        for n, s in pool.map(one, jobs):
            print(n, s, flush=True)


if __name__ == "__main__":
    if sys.argv[1] == "bake":
        bake()
    else:
        read_lines(sys.argv[2], int(sys.argv[3]), set(sys.argv[4:]))

#!/usr/bin/env python3
"""SC-228 (SC-219 cut 17): the working demo's presenter, from Google Cloud Text-to-Speech's Gemini-TTS (gemini-2.5-pro-tts),
an Indian English woman presenting the product live to the judges (the maintainer's pick, capped at $10; a full pass
of the script costs about $0.15). Adapted from SC-210's tts10.py.

  bake    each Gemini-TTS voice reads the same sample (four lines of the script) into bake17/<voice>.wav, directed by
          PROMPT, to be scored (mos.py, Whisper, Gemini's ears);
  lines   one voice reads every line of ../lines.json (its `say` where it has one), `takes` takes a line, into
          vo3/gemini-<voice>-demo/takes/<id>-<k>.wav, for pick.py to keep the take Whisper reads back best.

Authentication is gcloud's own, billed to the project through x-goog-user-project; 429 and 5xx are retried with a
backoff, and Gemini requests are paced under its per-minute quota. Standard library, ffmpeg and gcloud only.

  python3 tts17.py bake
  python3 tts17.py lines Kore 3 [ids…]
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
# the presenter: the maintainer asked for a narration "really realistic and professional and demo like", not robotic.
# The bake-off (bake17/): Gemini judged a founder demoing on a call (V2) as the most real, 7 to 7.5 of 10, where a
# presenter told to pause at every comma scored 4 to 6, Chirp 3 HD 4, and the cut's Maya1 3; Gacrux read it best
# (UTMOS 4.15, 2.7 words a second)
PROMPT = ("You are a startup founder demoing your product live on a video call to a panel of hackathon judges: a confident, friendly Indian woman in her early thirties, with a natural educated Indian English accent. Talk to them, don't read to them. Relaxed and conversational, with genuine enthusiasm for what you built: speak in natural phrases and let the sentences flow, with no pause at every comma, a little quicker through the familiar bits and a touch slower and warmer on the results and the figures that matter. Vary your pitch like a real person explaining something they know well; a small smile in the voice. Natural breaths. Never robotic, never announcer-like, never an advert.")
CHIRP_VOICES = ["Achernar", "Aoede", "Autonoe", "Callirrhoe", "Despina", "Erinome", "Gacrux", "Kore", "Laomedeia", "Leda",
                "Pulcherrima", "Sulafat", "Vindemiatrix", "Zephyr"]
GEMINI_VOICES = ["Kore", "Aoede", "Leda", "Sulafat", "Despina", "Gacrux"]
SAMPLE = ["x26", "m04", "s02", "u06"]

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


def synth(voice, text, style=None):
    """voice: 'chirp-<Name>' or 'gemini-<Name>'; style: a line's own direction, after the presenter's (lines.json "style")"""
    eng, name = voice.split("-", 1)
    cfg = {"audioEncoding": "LINEAR16", "sampleRateHertz": RATE}
    if eng == "chirp":
        return post(CHIRP, {"input": {"text": text}, "voice": {"languageCode": "en-IN", "name": f"en-IN-Chirp3-HD-{name}"}, "audioConfig": cfg})
    return post(GEMINI, {"input": {"text": text, "prompt": PROMPT + (" " + style if style else "")},
                         "voice": {"languageCode": "en-IN", "name": name, "modelName": GEMINI_MODEL}, "audioConfig": cfg})


def wav(b):
    """LINEAR16 from Cloud TTS comes with its RIFF header; anything else is wrapped as 24 kHz mono 16-bit"""
    if b[:4] == b"RIFF": return b
    import io, wave
    bio = io.BytesIO()
    with wave.open(bio, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(b)
    return bio.getvalue()


def lines():
    return json.loads((HERE.parent / "lines.json").read_text())["lines"]


def bake():
    by = {l["id"]: l for l in lines()}
    text = " ".join(by[i].get("say", by[i]["text"]) for i in SAMPLE)
    (HERE / "bake17").mkdir(exist_ok=True)
    (HERE / "bake17" / "sample.txt").write_text(text)

    def one(v):
        out = HERE / "bake17" / f"{v}.wav"
        if out.exists(): return v, "kept"
        try:
            out.write_bytes(wav(synth(f"gemini-{v}", text))); return v, "ok"
        except RuntimeError as e:
            return v, f"failed {e}"
    with ThreadPoolExecutor(3) as pool:
        for v, s in pool.map(one, GEMINI_VOICES):
            print(v, s, flush=True)


def read_lines(voice, takes, only):
    out = HERE / "vo3" / f"gemini-{voice}-demo" / "takes"   # parts.py and pick.py read vo3/<voice> (named in voice.txt)
    out.mkdir(parents=True, exist_ok=True)
    jobs = [(l, k) for l in lines() if l.get("kind") != "talk" and (not only or l["id"] in only) for k in range(takes)]

    def one(job):
        l, k = job
        p = out / f"{l['id']}-{k}.wav"
        if p.exists(): return p.name, "kept"
        try:
            p.write_bytes(wav(synth(f"gemini-{voice}", l.get("say", l["text"]), l.get("style")))); return p.name, "ok"
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

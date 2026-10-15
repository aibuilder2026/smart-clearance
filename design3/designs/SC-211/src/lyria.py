#!/usr/bin/env python3
"""SC-187, SC-210: music clips from Lyria 2 (lyria-002) on Vertex AI, 30 s a call, with a sidecar each; the price is checked
against a cap before every call (the maintainer's cap for the music is $10 inside the film's $50).

  python3 lyria.py --name bed-1 --seed 1 --prompt "…" [--negative "…"] [--cap 10]
"""
import argparse, base64, json, pathlib, subprocess, time
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "music10"
PROJECT, LOC, MODEL = "aibuilder-510213", "us-central1", "lyria-002"
PRICE_USD = 0.06  # per 30 s clip; the Vertex AI pricing page, 12 Oct 2026 (checked against the bill afterwards)

def spent() -> float:
    return sum(json.loads(p.read_text()).get("cost_usd", 0) for p in OUT.glob("*.prompt.json"))

def main():
    a = argparse.ArgumentParser()
    a.add_argument("--name", required=True); a.add_argument("--prompt", required=True); a.add_argument("--negative", default="vocals, singing, drums, percussion hits, distortion, lo-fi, aggressive, fast")
    a.add_argument("--seed", type=int, default=187); a.add_argument("--cap", type=float, default=10.0)
    o = a.parse_args()
    OUT.mkdir(exist_ok=True)
    out = OUT / f"{o.name}.wav"
    if out.exists():
        print(f"{out.name} exists"); return
    if spent() + PRICE_USD > o.cap:
        raise SystemExit(f"over the music cap: ${spent():.2f} spent, cap ${o.cap}")
    tok = subprocess.run(["gcloud", "auth", "print-access-token"], text=True, capture_output=True, check=True).stdout.strip()
    body = {"instances": [{"prompt": o.prompt, "negative_prompt": o.negative, "seed": o.seed}], "parameters": {"sample_count": 1}}
    t0 = time.time()
    r = subprocess.run(["curl", "-s", "-X", "POST", "-H", f"Authorization: Bearer {tok}", "-H", "Content-Type: application/json",
                        f"https://{LOC}-aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/{LOC}/publishers/google/models/{MODEL}:predict",
                        "-d", json.dumps(body)], text=True, capture_output=True, check=True)
    d = json.loads(r.stdout)
    preds = d.get("predictions") or []
    rec = {"name": o.name, "model": MODEL, "location": LOC, "service": "Vertex AI", "kind": "music", "prompt": o.prompt, "negative_prompt": o.negative,
           "seed": o.seed, "cost_usd": PRICE_USD, "price_table_date": "2026-10-12", "created": time.strftime("%Y-%m-%d"), "latency_s": round(time.time() - t0, 1),
           "use": "SC-210: a candidate cue for the sales film's score", "watermark": "SynthID"}
    if not preds or not preds[0].get("bytesBase64Encoded"):
        rec["status"] = "no audio"; rec["response"] = str(d)[:500]
        (OUT / f"{o.name}.prompt.json").write_text(json.dumps(rec, indent=1))
        raise SystemExit(f"no audio: {str(d)[:300]}")
    out.write_bytes(base64.b64decode(preds[0]["bytesBase64Encoded"]))
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)], text=True, capture_output=True).stdout.strip()
    rec["status"] = "done"; rec["output"] = f"{out.name} {dur} s 48 kHz stereo"
    (OUT / f"{o.name}.prompt.json").write_text(json.dumps(rec, indent=1))
    print(f"wrote {out.name} ({dur} s) in {rec['latency_s']} s; music spend ${spent():.2f}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Veo 3.1 on Vertex AI: generate a clip, poll an operation, or check the setup.

  uv run veo.py doctor
  uv run veo.py generate --model veo-3.1-fast-generate-001 --prompt-file p.txt --image k0.png \
      --res 720p --duration 8 --out ../../designs/SC-154/media/a-1-bay.mp4 --max-usd 1
  uv run veo.py poll projects/.../operations/... --out clip.mp4

Rules the script checks before spending (Veo 3.1): 1080p, 4K, reference images and a last frame need 8 s; reference
images need 16:9 and cannot be combined with a first or last frame; Lite has no 4K. Audio is off unless --audio: the
hero plays muted, and silent video is half the price. Every clip gets a `<clip>.prompt.json` beside it, written with
the operation's name before the wait, so a dropped session loses nothing: `poll` finishes it.
"""
from __future__ import annotations

import argparse
import pathlib
import subprocess
import sys
import time

import _vx

CHECK_MODELS = [
    ("us-central1", "veo-3.1-generate-001"),
    ("us-central1", "veo-3.1-fast-generate-001"),
    ("us-central1", "veo-3.1-lite-generate-001"),
    ("global", "gemini-3.1-flash-image"),
    ("global", "gemini-3-pro-image"),
]


def doctor(_a):
    import google.auth
    from google.auth.transport.requests import AuthorizedSession

    creds, adc_project = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    quota = getattr(creds, "quota_project_id", None)
    _vx.say(f"project {_vx.PROJECT}; ADC project {adc_project}; quota project {quota}")
    if not quota:
        _vx.say("  ! no quota project on the ADC: run `gcloud auth application-default set-quota-project "
                f"{_vx.PROJECT}` (or export GOOGLE_CLOUD_QUOTA_PROJECT), else Vertex answers 403")
    s = AuthorizedSession(creds)
    ok = True
    for loc, model in CHECK_MODELS:
        host = "aiplatform.googleapis.com" if loc == "global" else f"{loc}-aiplatform.googleapis.com"
        if model.startswith("veo"):
            r = s.get(f"https://{host}/v1/publishers/google/models/{model}", headers={"x-goog-user-project": _vx.PROJECT})
            good, note = r.ok, r.json().get("launchStage", r.json().get("error", {}).get("message", "?")[:80])
        else:  # the registry lists image ids that do not serve; a free count_tokens call is the real check
            try:
                cl = _vx.client(loc); cl.models.count_tokens(model=model, contents="a carton"); good, note = True, "serves"
            except Exception as e:  # noqa: BLE001
                good, note = False, str(e)[:80]
        ok &= good
        _vx.say(f"  {'ok ' if good else 'ERR'} {loc:12} {model:36} {note}")
    if subprocess.run(["ffmpeg", "-version"], capture_output=True).returncode != 0:
        _vx.say("  ! ffmpeg not found"); ok = False
    _vx.say("price table from", _vx.PRICE_DATE)
    sys.exit(0 if ok else 1)


def _image(path: str):
    from google.genai import types
    return types.Image.from_file(location=path)


def generate(a):
    from google.genai import types

    res = a.res.lower()
    if res in ("1080p", "4k") and a.duration != 8:
        sys.exit("1080p and 4K need --duration 8")
    if (a.ref or a.last_frame) and a.duration != 8:
        sys.exit("reference images and a last frame need --duration 8")
    if a.ref and a.aspect != "16:9":
        sys.exit("reference images need --aspect 16:9")
    if a.ref and (a.image or a.last_frame):
        sys.exit("reference images cannot be combined with a first or last frame")
    if len(a.ref or []) > 3:
        sys.exit("at most 3 reference images")
    if "lite" in a.model and res == "4k":
        sys.exit("Lite has no 4K")
    if a.last_frame and not a.image:
        sys.exit("--last-frame needs --image")
    prompt = pathlib.Path(a.prompt_file).read_text().strip() if a.prompt_file else a.prompt
    if not prompt:
        sys.exit("a prompt is needed (--prompt or --prompt-file)")
    cost = _vx.price_video(a.model, res, a.duration, a.audio, a.n)
    _vx.say(f"{a.model} {res} {a.duration}s ×{a.n} {'with' if a.audio else 'without'} audio: ${cost:.2f} (£{_vx.gbp(cost)})")
    if cost > a.max_usd:
        sys.exit(f"over --max-usd {a.max_usd}: refusing")

    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    inputs = []
    cfg = dict(aspect_ratio=a.aspect, resolution=res, duration_seconds=a.duration, generate_audio=a.audio,
               number_of_videos=a.n, enhance_prompt=a.enhance)
    if a.seed is not None:
        cfg["seed"] = a.seed
    if a.negative:
        cfg["negative_prompt"] = a.negative
    if a.person:
        cfg["person_generation"] = a.person
    if a.gcs:
        cfg["output_gcs_uri"] = a.gcs
    if a.lossless:
        cfg["compression_quality"] = "lossless"
    image = None
    if a.image:
        image = _image(a.image); inputs.append(_vx.input_record("first", a.image))
    if a.last_frame:
        cfg["last_frame"] = _image(a.last_frame); inputs.append(_vx.input_record("last", a.last_frame))
    if a.ref:
        cfg["reference_images"] = [types.VideoGenerationReferenceImage(image=_image(r), reference_type="asset") for r in a.ref]
        inputs += [_vx.input_record("reference", r) for r in a.ref]

    record = {
        "name": out.stem, "model": a.model, "location": _vx.location_for(a.model, a.location), "service": "Vertex AI",
        "prompt": prompt, "negative_prompt": a.negative, "seed": a.seed, "enhance_prompt": a.enhance,
        "resolution": res, "aspect": a.aspect, "duration_s": a.duration, "fps": 24, "generate_audio": a.audio,
        "person_generation": a.person, "inputs": inputs, "watermark": "SynthID",
        "cost_usd": cost, "price_table_date": _vx.PRICE_DATE, "created": _vx.today(), "use": a.use, "status": "requested",
    }
    client = _vx.client(record["location"])
    t0 = time.time()
    op = _vx.retry(lambda: client.models.generate_videos(model=a.model, prompt=prompt, image=image, config=types.GenerateVideosConfig(**cfg)))
    record["operation"] = op.name
    _vx.write_sidecar(out, record)
    _vx.say("operation", op.name)
    if a.no_wait:
        return
    _finish(client, op, out, record, t0, a.timeout)


def _finish(client, op, out: pathlib.Path, record: dict, t0: float, timeout: int):
    while not op.done:
        if time.time() - t0 > timeout:
            _vx.say(f"still running after {timeout}s; resume with: uv run veo.py poll {op.name} --out {out}")
            sys.exit(2)
        time.sleep(15)
        op = client.operations.get(op)
        _vx.say(f"  … {int(time.time() - t0)}s")
    record["latency_s"] = round(time.time() - t0, 1)
    if op.error:
        record["status"] = "error"; record["error"] = str(op.error)
        _vx.write_sidecar(out, record)
        sys.exit(f"Veo error: {op.error}")
    r = op.response or op.result
    record["rai_filtered"] = {"count": getattr(r, "rai_media_filtered_count", 0) or 0,
                              "reasons": getattr(r, "rai_media_filtered_reasons", None) or []}
    vids = (r.generated_videos or []) if r else []
    if not vids:
        record["status"] = "filtered"
        _vx.write_sidecar(out, record)
        sys.exit(f"no video returned; RAI: {record['rai_filtered']}")
    saved = []
    for i, gv in enumerate(vids):
        p = out if i == 0 else out.with_name(f"{out.stem}-{i + 1}{out.suffix}")
        v = gv.video
        if v.video_bytes:
            p.write_bytes(v.video_bytes)
        elif v.uri:
            subprocess.run(["gcloud", "storage", "cp", v.uri, str(p)], check=True)
            record.setdefault("gcs", []).append(v.uri)
        saved.append(p.name)
    record["status"] = "done"; record["files"] = saved
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                            "stream=width,height,r_frame_rate,nb_frames:format=duration,size", "-of", "json", str(out)],
                           capture_output=True, text=True)
    if probe.returncode == 0:
        record["probe"] = probe.stdout.strip()
    _vx.write_sidecar(out, record)
    _vx.say(f"saved {out} ({out.stat().st_size / 1e6:.1f} MB) in {record['latency_s']}s; RAI filtered {record['rai_filtered']['count']}")


def poll(a):
    from google.genai import types

    out = pathlib.Path(a.out)
    record = _vx.read_sidecar(out) if _vx.sidecar_path(out).exists() else {"name": out.stem, "operation": a.operation}
    client = _vx.client(record.get("location") or a.location)
    op = client.operations.get(types.GenerateVideosOperation(name=a.operation))
    _finish(client, op, out, record, time.time(), a.timeout)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("doctor").set_defaults(f=doctor)
    g = sub.add_parser("generate")
    g.add_argument("--model", default="veo-3.1-fast-generate-001")
    g.add_argument("--location")
    g.add_argument("--prompt"); g.add_argument("--prompt-file")
    g.add_argument("--negative", default="text, lettering, logo, brand name, label, watermark, subtitles, children")
    g.add_argument("--image", help="first frame (image to video)")
    g.add_argument("--last-frame", help="last frame; needs --image and 8 s")
    g.add_argument("--ref", action="append", help="reference asset image (up to 3; 8 s, 16:9, no first/last frame)")
    g.add_argument("--res", default="720p", choices=["720p", "1080p", "4k", "4K"])
    g.add_argument("--duration", type=int, default=8, choices=[4, 6, 8])
    g.add_argument("--aspect", default="16:9", choices=["16:9", "9:16"])
    g.add_argument("--seed", type=int)
    g.add_argument("--n", type=int, default=1, choices=[1, 2, 3, 4])
    g.add_argument("--audio", action="store_true", help="generate audio too (double the price; the hero is muted)")
    g.add_argument("--enhance", action=argparse.BooleanOptionalAction, default=True, help="Veo's prompt rewriter")
    g.add_argument("--person", default="allow_adult", choices=["allow_adult", "allow_all", "dont_allow"])
    g.add_argument("--gcs", help="gs://bucket/prefix/ to write to instead of inline bytes")
    g.add_argument("--lossless", action="store_true")
    g.add_argument("--use", default="", help="what the clip is for, recorded in the sidecar")
    g.add_argument("--out", required=True)
    g.add_argument("--max-usd", type=float, default=2.0)
    g.add_argument("--timeout", type=int, default=900)
    g.add_argument("--no-wait", action="store_true")
    g.set_defaults(f=generate)
    q = sub.add_parser("poll")
    q.add_argument("operation"); q.add_argument("--out", required=True); q.add_argument("--location")
    q.add_argument("--timeout", type=int, default=900)
    q.set_defaults(f=poll)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()

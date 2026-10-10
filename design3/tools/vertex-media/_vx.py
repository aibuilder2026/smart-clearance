"""Shared pieces for the Vertex AI media scripts: the client, the price table, the sidecars.

Every generated asset gets a `<asset>.prompt.json` beside it (AGENTS.md, Data and assets), in the shape of
design3/site/assets/media/one-day.prompt.json where the fields overlap, plus what Vertex adds: the model id, the
location, the operation, what the RAI filter held back, and the cost.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import pathlib
import sys

PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "aibuilder-510213")
LOCATION = os.environ.get("VERTEX_LOCATION", "us-central1")
GBP_PER_USD = 0.75

# Google's Vertex AI pricing page, read on 10 Oct 2026 (USD). Veo is per second of output; images per image.
PRICE_DATE = "2026-10-10"
VEO = {
    # model: {resolution: (with audio, without audio)}
    "veo-3.1-generate-001": {"720p": (0.40, 0.20), "1080p": (0.40, 0.20), "4k": (0.60, 0.40)},
    "veo-3.1-fast-generate-001": {"720p": (0.10, 0.08), "1080p": (0.12, 0.10), "4k": (0.30, 0.25)},
    "veo-3.1-lite-generate-001": {"720p": (0.05, 0.03), "1080p": (0.08, 0.05)},
}
VEO["veo-3.1-generate-preview"] = VEO["veo-3.1-generate-001"]
VEO["veo-3.1-fast-generate-preview"] = VEO["veo-3.1-fast-generate-001"]
VEO["veo-3.1-lite-generate-preview"] = VEO["veo-3.1-lite-generate-001"]
IMAGE = {
    # model: {image size: price per image}
    "gemini-3.1-flash-image": {"512": 0.045, "1K": 0.067, "2K": 0.101, "4K": 0.151},  # Nano Banana 2
    "gemini-3-pro-image": {"1K": 0.134, "2K": 0.134, "4K": 0.24},  # Nano Banana Pro
}
# where each model answers: the Gemini image models serve only on the global endpoint, under their GA ids (the registry
# lists `-preview` ids in us-central1 and global, but generateContent and count_tokens answer 404 for those)
MODEL_LOCATION = {"gemini-3-pro-image": "global", "gemini-3.1-flash-image": "global"}


def client(location: str | None = None):
    from google import genai

    return genai.Client(vertexai=True, project=PROJECT, location=location or LOCATION)


def location_for(model: str, asked: str | None) -> str:
    return asked or MODEL_LOCATION.get(model, LOCATION)


def price_video(model: str, resolution: str, seconds: float, audio: bool, n: int = 1) -> float:
    try:
        rate = VEO[model][resolution.lower()][0 if audio else 1]
    except KeyError:
        raise SystemExit(f"no price for {model} at {resolution}: not offered, or not in the table ({PRICE_DATE})")
    return round(rate * seconds * n, 4)


def price_image(model: str, size: str, n: int = 1) -> float:
    try:
        return round(IMAGE[model][size] * n, 4)
    except KeyError:
        raise SystemExit(f"no price for {model} at {size} in the table ({PRICE_DATE})")


def gbp(usd: float) -> float:
    return round(usd * GBP_PER_USD, 2)


def sha256(path: str | os.PathLike) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sidecar_path(asset: str | os.PathLike) -> pathlib.Path:
    p = pathlib.Path(asset)
    return p.with_name(p.stem + ".prompt.json")


def write_sidecar(asset: str | os.PathLike, data: dict) -> pathlib.Path:
    p = sidecar_path(asset)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    return p


def read_sidecar(asset: str | os.PathLike) -> dict:
    return json.loads(sidecar_path(asset).read_text())


def today() -> str:
    return dt.date.today().isoformat()


def now() -> str:
    return dt.datetime.now(dt.timezone.utc).astimezone().isoformat(timespec="seconds")


def say(*a):
    print(*a, file=sys.stderr, flush=True)


def input_record(role: str, path: str) -> dict:
    return {"role": role, "file": os.path.basename(path), "sha256": sha256(path)}


def retry(call, attempts: int = 5, waits=(20, 40, 60, 90)):
    """Run `call`, waiting out 429s (the image models' quota is a few requests a minute) and 5xx; the rest raise."""
    import time

    for i in range(attempts):
        try:
            return call()
        except Exception as e:  # noqa: BLE001
            code = getattr(e, "code", None) or getattr(e, "status_code", None)
            text = str(e)
            if i == attempts - 1 or not (code in (429, 500, 503, 504) or "RESOURCE_EXHAUSTED" in text or "UNAVAILABLE" in text):
                raise
            w = waits[min(i, len(waits) - 1)]
            say(f"  {code or 'error'}: waiting {w}s before attempt {i + 2}")
            time.sleep(w)

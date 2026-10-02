"""Local teleprompter recorder for the Smart-Clearance narration.

    python3 video/recorder/server.py        # serves http://localhost:8765

GET  /             the recorder page
GET  /script.json  the 11 narration segments (id, text, placeholder length)
GET  /status       which segments already have a recording in video/my-voice/
POST /save/<id>    raw audio bytes (webm/opus from the browser) -> video/my-voice/<id>.webm
POST /delete/<id>  removes that recording
POST /build        runs `python3 voice.py` in video/ in the background (re-time, re-record, re-mix)
GET  /log          tail of the build log and whether it is still running
"""
from __future__ import annotations

import json
import re
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
VIDEO = HERE.parent
MY_VOICE = VIDEO / "my-voice"
LOG = VIDEO / "out" / "voice-build.log"
PORT = 8765
SAFE_ID = re.compile(r"^[0-9]{2}-[a-z]+$")

build_proc: subprocess.Popen | None = None


def segments() -> list[dict]:
    segs = json.loads((VIDEO / "narration.json").read_text())
    return [{"id": s["id"], "scene": s["scene"], "text": s["text"], "placeholder_sec": s["audio_sec"]} for s in segs]


def status() -> dict:
    MY_VOICE.mkdir(exist_ok=True)
    have = {}
    for s in segments():
        files = sorted(p for p in MY_VOICE.glob(s["id"] + ".*") if p.suffix.lower() in (".webm", ".m4a", ".wav", ".mp3", ".aiff", ".ogg"))
        have[s["id"]] = files[0].name if files else None
    running = build_proc is not None and build_proc.poll() is None
    return {"have": have, "building": running, "video": (VIDEO / "walkthrough.mp4").exists()}


class H(BaseHTTPRequestHandler):
    def _send(self, code: int, body: bytes, ctype: str = "application/json") -> None:
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, obj, code: int = 200) -> None:
        self._send(code, json.dumps(obj).encode())

    def log_message(self, fmt, *args):  # quieter console
        if "/log" not in (args[0] if args else ""):
            super().log_message(fmt, *args)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self._send(200, (HERE / "index.html").read_bytes(), "text/html; charset=utf-8")
        elif self.path == "/script.json":
            self._json(segments())
        elif self.path == "/status":
            self._json(status())
        elif self.path == "/log":
            text = LOG.read_text(errors="replace") if LOG.exists() else ""
            self._json({"log": text[-6000:], "building": build_proc is not None and build_proc.poll() is None,
                        "exit": None if build_proc is None else build_proc.poll()})
        elif self.path.startswith("/audio/"):
            name = self.path.split("/audio/", 1)[1]
            p = MY_VOICE / name
            if p.exists() and p.parent == MY_VOICE:
                self._send(200, p.read_bytes(), "audio/webm" if p.suffix == ".webm" else "application/octet-stream")
            else:
                self._json({"error": "not found"}, 404)
        else:
            self._json({"error": "not found"}, 404)

    def do_POST(self):
        global build_proc
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else b""
        if self.path.startswith("/save/"):
            sid = self.path.split("/save/", 1)[1]
            if not SAFE_ID.match(sid) or not body:
                return self._json({"error": "bad id or empty body"}, 400)
            MY_VOICE.mkdir(exist_ok=True)
            for old in MY_VOICE.glob(sid + ".*"):
                old.unlink()
            (MY_VOICE / f"{sid}.webm").write_bytes(body)
            return self._json({"saved": f"{sid}.webm", "bytes": len(body)})
        if self.path.startswith("/delete/"):
            sid = self.path.split("/delete/", 1)[1]
            if not SAFE_ID.match(sid):
                return self._json({"error": "bad id"}, 400)
            for old in MY_VOICE.glob(sid + ".*"):
                old.unlink()
            return self._json({"deleted": sid})
        if self.path == "/build":
            if build_proc is not None and build_proc.poll() is None:
                return self._json({"error": "already building"}, 409)
            missing = [k for k, v in status()["have"].items() if not v]
            if missing:
                return self._json({"error": "missing recordings", "missing": missing}, 400)
            LOG.parent.mkdir(exist_ok=True)
            logf = open(LOG, "w")
            build_proc = subprocess.Popen(["python3", "voice.py"], cwd=VIDEO, stdout=logf, stderr=subprocess.STDOUT)
            threading.Thread(target=build_proc.wait, daemon=True).start()
            return self._json({"started": True})
        self._json({"error": "not found"}, 404)


if __name__ == "__main__":
    MY_VOICE.mkdir(exist_ok=True)
    print(f"Smart-Clearance voice recorder: http://localhost:{PORT}  (recordings -> {MY_VOICE})")
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()

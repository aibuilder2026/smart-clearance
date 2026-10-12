#!/usr/bin/env python3
"""A tiny CORS file server for the upload: YouTube Studio's page fetches the master from here and hands it to its own
uploader (the browser tools have no file picker). Serves only this folder's files, read-only, on localhost."""
import http.server, sys, functools
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Headers", "*"); super().end_headers()
    def do_OPTIONS(self):
        self.send_response(204); self.end_headers()
    def log_message(self, *a): pass
root = sys.argv[1]
http.server.ThreadingHTTPServer(("127.0.0.1", 8799), functools.partial(H, directory=root)).serve_forever()

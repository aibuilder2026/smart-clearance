"""Static server for design3/ during the parity runs (each app's playwright.parity.config.ts): threaded, with a deep
connection backlog so parallel browsers loading many files at once are not refused (the stock http.server queues only
5). It was design3/a11y's until SC-58 removed that suite."""
import http.server, os, sys

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "design3"))
Server(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8790), Handler).serve_forever()

"""How the agents log, as backend-api's logs.py: plain lines on a laptop, and on Cloud Run (LOG_FORMAT=json) one JSON
object a line, which Cloud Logging reads with its severity and source line. A line written during a run carries the
run's trace and span, so Logs Explorer shows it under the trace, and Cloud Trace beside the run's spans."""

import json
import logging
import sys

from sc_agents import tracing
from sc_agents.settings import Settings


class CloudJson(logging.Formatter):
    def __init__(self, project: str = ""):
        super().__init__()
        self.project = project

    def format(self, record: logging.LogRecord) -> str:
        message = record.getMessage()
        if record.exc_info:
            message = f"{message}\n{self.formatException(record.exc_info)}"
        line = {
            "severity": record.levelname,
            "message": message,
            "logger": record.name,
            "logging.googleapis.com/sourceLocation": {
                "file": record.pathname,
                "line": record.lineno,
                "function": record.funcName,
            },
        }
        here = tracing.current()
        if here and self.project:
            line["logging.googleapis.com/trace"] = f"projects/{self.project}/traces/{here.trace_id}"
            line["logging.googleapis.com/spanId"] = here.span_id
            line["logging.googleapis.com/trace_sampled"] = here.sampled
        return json.dumps(line, ensure_ascii=False)


def configure(settings: Settings) -> None:
    if settings.log_format != "json":
        logging.basicConfig(level=settings.log_level, format="%(levelname)s %(name)s %(message)s")
    else:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(CloudJson(settings.google_cloud_project))
        root = logging.getLogger()
        root.handlers[:] = [handler]
        root.setLevel(settings.log_level)
        for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
            logger = logging.getLogger(name)
            logger.handlers[:] = []
            logger.propagate = True
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    # ADK and the Google clients are chatty at INFO
    for name in ("google_adk", "google_genai", "httpx"):
        logging.getLogger(name).setLevel(logging.WARNING)

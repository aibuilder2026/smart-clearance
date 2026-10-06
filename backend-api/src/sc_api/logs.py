"""How backend-api logs: plain lines on a developer's machine, and on Cloud Run (LOG_FORMAT=json, SC-50) one JSON
object a line, which Cloud Logging reads as a structured entry with its severity and source line. An exception's
stack trace is part of the message, so Error Reporting groups it. Cloud Run logs every request itself, so uvicorn's
access lines are dropped there. A line written during a request carries the request's trace and span (SC-57), so
Logs Explorer shows it under Cloud Run's request line, and Cloud Trace beside the request's spans."""

import json
import logging
import sys

from sc_api import tracing
from sc_api.settings import Settings


class CloudJson(logging.Formatter):
    """a record as the JSON line Cloud Logging reads: severity, message, logger, source location, and the trace"""

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
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(CloudJson(settings.google_cloud_project))
    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(settings.log_level)
    # uvicorn sets up its own loggers before the app is imported: send them through the root's JSON handler instead
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logger = logging.getLogger(name)
        logger.handlers[:] = []
        logger.propagate = True
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

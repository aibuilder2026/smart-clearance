"""SC-50: on Cloud Run the API logs one JSON object a line, so Cloud Logging keeps each line's severity, and a stack
trace stays with its message for Error Reporting."""

import json
import logging

from sc_api import logs
from tests.conftest import settings


def test_a_line_is_json_with_its_severity_and_source():
    record = logging.LogRecord("sc_api.x", logging.WARNING, "/app/x.py", 12, "a %s line", ("warning",), None, "f")
    line = json.loads(logs.CloudJson().format(record))
    assert line["severity"] == "WARNING" and line["message"] == "a warning line" and line["logger"] == "sc_api.x"
    assert line["logging.googleapis.com/sourceLocation"] == {"file": "/app/x.py", "line": 12, "function": "f"}


def test_an_exception_keeps_its_stack_trace_in_the_message():
    try:
        raise ValueError("no such batch")
    except ValueError:
        import sys

        record = logging.LogRecord("sc_api.x", logging.ERROR, "x.py", 1, "failed", (), sys.exc_info())
    line = json.loads(logs.CloudJson().format(record))
    assert line["severity"] == "ERROR"
    assert line["message"].startswith("failed\nTraceback") and "ValueError: no such batch" in line["message"]


def test_json_logging_sends_uvicorn_through_the_root_and_drops_access_lines():
    root = logging.getLogger()
    kept = root.handlers[:], root.level
    try:
        logs.configure(settings(log_format="json"))
        assert isinstance(root.handlers[0].formatter, logs.CloudJson)
        assert logging.getLogger("uvicorn.error").propagate and not logging.getLogger("uvicorn.error").handlers
        assert logging.getLogger("uvicorn.access").level == logging.WARNING
    finally:
        root.handlers[:], _ = kept
        root.setLevel(kept[1])
        logging.getLogger("uvicorn.access").setLevel(logging.NOTSET)

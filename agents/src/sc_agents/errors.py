"""What can go wrong in a run, by what Pub/Sub should do about it."""


class Transient(Exception):
    """try again later: Pub/Sub redelivers (503 to a push, a nack to a pull), and after five attempts the message goes
    to the dead letter (backend-api down, a 5xx after retries, BigQuery or Cloud Storage unavailable)"""


class Permanent(Exception):
    """trying again cannot help (a request backend-api refuses as malformed): the run is logged as failed and the
    message acknowledged"""


class Stale(Exception):
    """the journey has moved on, or the batch has left it (backend-api's 404 and 409): nothing to do"""

"""Messages as they arrive, pushed to Cloud Run or pulled by a laptop's worker, and what the service answers Pub/Sub."""

import base64
import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from sc_agents import worker
from sc_agents.events import BadMessage, NotAPush, from_pull, from_push, infer_topic, topic_of
from sc_agents.service import create_app
from tests.conftest import CASE, HERO, SPANS

TRACE = "4bf92f3577b34da6a3ce929d0e0e4736"
PARENT = f"00-{TRACE}-00f067aa0ba902b7-01"


def envelope(
    payload: dict, *, subscription="projects/p/subscriptions/prod.agents.batch.at_risk", attempt=None, **attrs
):
    out = {
        "message": {
            "data": base64.b64encode(json.dumps(payload).encode()).decode(),
            "attributes": {"event_id": "ev_push", "traceparent": PARENT, **attrs},
            "messageId": "123",
        },
        "subscription": subscription,
    }
    if attempt:
        out["deliveryAttempt"] = attempt
    return out


def test_a_push_is_read():
    m = from_push(envelope({"client": "munchly", "ref": HERO, "eventId": "ev_push"}, attempt=3))
    assert (m.topic, m.client, m.ref, m.event_id, m.traceparent, m.attempt) == (
        "batch.at_risk",
        "munchly",
        HERO,
        "ev_push",
        PARENT,
        3,
    )
    assert m.type == "batch.at_risk" and m.key("vision") == "ev_push:vision"


def test_a_journey_steps_type_is_its_own():
    sub = "projects/p/subscriptions/local.agents.journey.step"
    m = from_push(envelope({"client": "munchly", "type": "decide", "ref": HERO}, subscription=sub))
    assert m.topic == "journey.step" and m.type == "decide"


def test_a_pull_is_read():
    msg = SimpleNamespace(
        data=json.dumps({"client": "munchly", "ref": HERO, "bid": "b1", "eventId": "ev_9"}).encode(),
        attributes={"event_id": "ev_9", "traceparent": PARENT},
        message_id="m9",
        delivery_attempt=2,
    )
    m = from_pull(msg, "local.agents.offer.received")
    assert (m.topic, m.event_id, m.attempt, m.payload["bid"]) == ("offer.received", "ev_9", 2, "b1")


def test_the_event_id_falls_back_to_the_payload_then_the_message():
    e = envelope({"client": "munchly", "eventId": "ev_payload"})
    del e["message"]["attributes"]["event_id"]
    assert from_push(e).event_id == "ev_payload"


@pytest.mark.parametrize(
    ("name", "topic"),
    [
        ("local.batch.at_risk", "batch.at_risk"),
        ("prod.agents.journey.step", "journey.step"),
        ("projects/p/subscriptions/local.agents.deal.closed", "deal.closed"),
        ("something-else", None),
    ],
)
def test_topics_from_names(name, topic):
    assert topic_of(name) == topic


def test_a_topic_is_inferred_from_the_payload():
    assert infer_topic({"type": "settle"}) == "journey.step"
    assert infer_topic({"bid": "b"}) == "offer.received" and infer_topic({"message": 3}) == "offer.received"
    assert infer_topic({"price": 14.2}) == "deal.closed" and infer_topic({"ref": "x"}) == "batch.at_risk"


def test_unreadable_messages():
    with pytest.raises(NotAPush):
        from_push({"nope": 1})
    bad = envelope({"client": "munchly"})
    bad["message"]["data"] = base64.b64encode(b"not json").decode()
    with pytest.raises(BadMessage):
        from_push(bad)
    with pytest.raises(BadMessage):
        from_push(envelope({"ref": HERO}))  # no client


# --- the push service ---------------------------------------------------------------------------------------------------


@pytest.fixture
def client(deps):
    with TestClient(create_app(deps)) as c:
        yield c


def test_a_push_runs_its_pipeline_and_answers_204(client, backend):
    r = client.post("/pubsub", json=envelope({"client": "munchly", "ref": HERO, "eventId": "ev_push"}))
    assert r.status_code == 204 and r.headers["X-Outcome"] == "done"
    body = backend.report("photo-request")
    assert body["run"]["eventKey"] == "ev_push:vision"
    # the run continues the trace the message was published in, and backend-api hears it
    assert body["run"]["traceId"] == TRACE
    assert backend.headers[-1]["traceparent"].split("-")[1] == TRACE
    assert backend.headers[-1]["authorization"] == "Bearer internal:sc-agents@test.example"
    assert any(
        s.name == "agents batch.at_risk" and format(s.context.trace_id, "032x") == TRACE
        for s in SPANS.get_finished_spans()
    )


def test_a_transient_failure_answers_503_for_pub_sub_to_retry(client, backend):
    backend["POST", f"{CASE}/photo-request"] = (503, {"message": "down"})
    r = client.post("/pubsub", json=envelope({"client": "munchly", "ref": HERO}))
    assert r.status_code == 503 and r.json()["retry"] is True
    assert sum(1 for m, p, _ in backend.calls if p.endswith("photo-request")) == 3  # tried three times first


def test_a_permanent_failure_is_acknowledged(client, backend):
    backend["POST", f"{CASE}/photo-request"] = (422, {"message": "bad"})
    r = client.post("/pubsub", json=envelope({"client": "munchly", "ref": HERO}))
    assert r.status_code == 204 and r.headers["X-Outcome"] == "failed"


def test_an_unreadable_message_is_acknowledged_and_a_stranger_refused(client):
    bad = envelope({"client": "munchly"})
    bad["message"]["data"] = base64.b64encode(b"{oops").decode()
    assert client.post("/pubsub", json=bad).status_code == 204
    assert client.post("/pubsub", json={"hello": "world"}).status_code == 400


def test_health_and_readiness_in_the_stub_tier(client):
    assert client.get("/healthz").json() == {"ok": True}
    assert client.get("/readyz").json() == {"ok": True, "models": "stub"}


def test_readiness_checks_both_models(deps):
    class Models:
        stub = False

        async def check(self):
            return {"pro": "NotFound: 404 gemini-x"}

    deps.models = Models()  # type: ignore[assignment]
    with TestClient(create_app(deps)) as c:
        r = c.get("/readyz")
    assert r.status_code == 503 and "pro" in r.json()["models"]


def test_readiness_checks_the_models_in_a_container_just_started(deps, monkeypatch):
    """a monotonic clock only seconds old (a new container, a CI runner) still means no check has passed yet (SC-76)"""

    class Models:
        stub = False
        checked = 0

        async def check(self):
            Models.checked += 1
            return {"flash": "NotFound: 404 gemini-y"}

    import sc_agents.service as service

    monkeypatch.setattr(service.time, "monotonic", lambda: 5.0)
    deps.models = Models()  # type: ignore[assignment]
    with TestClient(create_app(deps)) as c:
        r = c.get("/readyz")
    assert r.status_code == 503 and Models.checked == 1


# --- the pull worker ------------------------------------------------------------------------------------------------


class Pulled:
    def __init__(self, payload):
        self.data = json.dumps(payload).encode()
        self.attributes = {"event_id": "ev_pull"}
        self.message_id = "p1"
        self.delivery_attempt = 1
        self.acked = self.nacked = False

    def ack(self):
        self.acked = True

    def nack(self):
        self.nacked = True


async def test_the_worker_acks_what_is_done_and_nacks_what_should_be_retried(deps, backend):
    import asyncio

    loop = asyncio.get_running_loop()
    cb = worker.callback_for(deps, "local.agents.batch.at_risk", loop)
    ok = Pulled({"client": "munchly", "ref": HERO})
    await asyncio.to_thread(cb, ok)
    assert ok.acked and not ok.nacked
    backend["POST", f"{CASE}/photo-request"] = (503, {"message": "down"})
    retry = Pulled({"client": "munchly", "ref": HERO})
    await asyncio.to_thread(cb, retry)
    assert retry.nacked and not retry.acked
    junk = Pulled({"no": "client"})
    await asyncio.to_thread(cb, junk)
    assert junk.acked


def test_the_worker_pulls_the_four_agent_subscriptions():
    assert worker.subscriptions("local") == [
        "local.agents.batch.at_risk",
        "local.agents.offer.received",
        "local.agents.deal.closed",
        "local.agents.journey.step",
    ]

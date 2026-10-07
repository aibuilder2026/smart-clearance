"""The journey's events, as they arrive: pushed by Pub/Sub to Cloud Run (`POST /pubsub`) or pulled by a laptop's
worker (worker.py). backend-api is their only publisher (infra/prod events.tf):

- the topics are per environment: `local.batch.at_risk`, `prod.journey.step` … (the subscriptions are
  `<env>.agents.<topic>`);
- the JSON payload has `client`, usually `ref`, and `eventId`;
- the attributes carry `event_id` and `traceparent`;
- one batch's messages share an ordering key, so they arrive in order.
"""

import base64
import json
from dataclasses import dataclass, field
from typing import Any

TOPICS = ("batch.at_risk", "offer.received", "deal.closed", "journey.step")


class BadMessage(ValueError):
    """a Pub/Sub message the agents cannot read: acknowledged, never retried (it would never read better)"""


class NotAPush(ValueError):
    """a request that is not a Pub/Sub push at all"""


@dataclass(frozen=True)
class Message:
    topic: str  # without the environment: batch.at_risk, offer.received, deal.closed, journey.step
    payload: dict[str, Any]
    event_id: str
    traceparent: str | None = None
    attempt: int = 1  # Pub/Sub's delivery attempt, when it says
    message_id: str = ""
    attributes: dict[str, str] = field(default_factory=dict)

    @property
    def client(self) -> str:
        return str(self.payload.get("client") or "")

    @property
    def ref(self) -> str | None:
        ref = self.payload.get("ref")
        return str(ref) if ref else None

    @property
    def type(self) -> str:
        """what the message asks for: the journey.step's type, or the topic itself"""
        return str(self.payload.get("type") or self.topic) if self.topic == "journey.step" else self.topic

    def key(self, step: str) -> str:
        """the event key a report carries, so backend-api acts once on a redelivered event"""
        return f"{self.event_id}:{step}"


def topic_of(name: str) -> str | None:
    """local.batch.at_risk, prod.agents.journey.step or projects/p/subscriptions/local.agents.deal.closed → its topic"""
    tail = name.rsplit("/", 1)[-1]
    for topic in TOPICS:
        if tail == topic or tail.endswith("." + topic):
            return topic
    return None


def infer_topic(payload: dict[str, Any]) -> str:
    """the topic, read from the payload when the subscription does not say (a hand-made push)"""
    if "type" in payload:
        return "journey.step"
    if "bid" in payload or "message" in payload:
        return "offer.received"
    if "price" in payload:
        return "deal.closed"
    return "batch.at_risk"


def _message(
    data: bytes, attributes: dict[str, str], *, subscription: str, message_id: str, attempt: int | None
) -> Message:
    try:
        payload = json.loads(data or b"{}")
    except ValueError as e:
        raise BadMessage(f"message {message_id}: not JSON") from e
    if not isinstance(payload, dict) or not payload.get("client"):
        raise BadMessage(f"message {message_id}: no client")
    topic = topic_of(subscription) or infer_topic(payload)
    event_id = attributes.get("event_id") or str(payload.get("eventId") or "") or message_id
    if not event_id:
        raise BadMessage("a message without an event id")
    return Message(
        topic=topic,
        payload=payload,
        event_id=event_id,
        traceparent=attributes.get("traceparent") or None,
        attempt=max(1, int(attempt or 1)),
        message_id=message_id,
        attributes=dict(attributes),
    )


def from_push(envelope: dict[str, Any]) -> Message:
    """a Pub/Sub push: {"message": {"data": base64, "attributes": {...}, "messageId": ...}, "subscription": ...,
    "deliveryAttempt": n}"""
    try:
        m = envelope["message"]
        data = base64.b64decode(m.get("data") or "")
    except (KeyError, TypeError, ValueError, AttributeError) as e:
        raise NotAPush("not a Pub/Sub push") from e
    return _message(
        data,
        dict(m.get("attributes") or {}),
        subscription=str(envelope.get("subscription") or ""),
        message_id=str(m.get("messageId") or m.get("message_id") or ""),
        attempt=envelope.get("deliveryAttempt"),
    )


def from_pull(message: Any, subscription: str) -> Message:
    """a streaming pull's message (google.cloud.pubsub_v1's Message)"""
    return _message(
        message.data,
        dict(message.attributes or {}),
        subscription=subscription,
        message_id=str(message.message_id),
        attempt=getattr(message, "delivery_attempt", None),
    )

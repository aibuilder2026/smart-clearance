"""The Google services the live workspace uses besides Postgres and Firebase Auth (SC-66): Pub/Sub, Cloud Storage and
Firebase Cloud Messaging. Each is a small protocol with the Google implementation and an in-process fake the test
suite uses (CLOUD=fake, refused outside SC_ENV=test). There is no emulator anywhere: a laptop talks to the real
services, as sc-api-local, through the local environment's own topics and buckets.

- Pub/Sub: backend-api is the only publisher. Messages carry an ordering key (the client and batch), so one batch's
  events arrive in order, and a `traceparent` attribute, so the agents continue the request's trace.
- Cloud Storage: signed URLs, signed as the service account itself through IAM (no key exists): the workspace app
  puts a label photo or a stock export straight into its bucket, and downloads a PDF the Paperwork agent wrote.
- FCM: one data message to each of a member's devices; the app's service worker shows it.
"""

import asyncio
import json
import logging
from dataclasses import dataclass, field
from datetime import timedelta
from functools import cached_property
from typing import Any, Protocol

from sc_api.settings import Settings

log = logging.getLogger("sc_api.cloud")


# --- Pub/Sub --------------------------------------------------------------------------------------------------------


class Publisher(Protocol):
    async def publish(
        self, topic: str, payload: dict[str, Any], *, ordering_key: str, attributes: dict[str, str]
    ) -> str:
        """publishes to `topic` (its full name in this environment, e.g. local.batch.at_risk); the message id"""
        ...


class GooglePublisher:
    def __init__(self, settings: Settings):
        self.project = settings.google_cloud_project

    @cached_property
    def client(self):
        from google.cloud import pubsub_v1

        from sc_api.gcp import credentials

        return pubsub_v1.PublisherClient(
            credentials=credentials(),
            publisher_options=pubsub_v1.types.PublisherOptions(enable_message_ordering=True),
        )

    def _publish(self, topic: str, data: bytes, ordering_key: str, attributes: dict[str, str]) -> str:
        path = self.client.topic_path(self.project, topic)
        try:
            return self.client.publish(path, data, ordering_key=ordering_key, **attributes).result(timeout=30)
        except Exception:
            # a failed message pauses its ordering key until it is resumed; the outbox publishes it again later
            if ordering_key:
                self.client.resume_publish(path, ordering_key)
            raise

    async def publish(
        self, topic: str, payload: dict[str, Any], *, ordering_key: str, attributes: dict[str, str]
    ) -> str:
        data = json.dumps(payload, separators=(",", ":")).encode()
        return await asyncio.to_thread(self._publish, topic, data, ordering_key, attributes)


@dataclass
class FakePublisher:
    sent: list[dict[str, Any]] = field(default_factory=list)

    async def publish(
        self, topic: str, payload: dict[str, Any], *, ordering_key: str, attributes: dict[str, str]
    ) -> str:
        self.sent.append({"topic": topic, "payload": payload, "ordering_key": ordering_key, "attributes": attributes})
        return f"m{len(self.sent)}"


# --- Cloud Storage --------------------------------------------------------------------------------------------------


@dataclass(frozen=True)
class SignedUpload:
    url: str
    headers: dict[str, str]


class Storage(Protocol):
    def signed_put(self, bucket: str, name: str, content_type: str, *, minutes: int = 10) -> SignedUpload: ...

    def signed_get(self, bucket: str, name: str, *, minutes: int = 5) -> str: ...

    async def size(self, bucket: str, name: str) -> int | None:
        """the object's size, or None when it is not there"""
        ...

    async def write(self, bucket: str, name: str, data: bytes, content_type: str) -> bool:
        """write an object once: one of that name already there stays (the API may create objects, never replace or
        delete them), and the answer says whether this call wrote it"""
        ...


class GoogleStorage:
    def __init__(self, settings: Settings):
        self.project = settings.google_cloud_project

    @cached_property
    def client(self):
        from google.cloud import storage

        from sc_api.gcp import credentials

        return storage.Client(project=self.project, credentials=credentials())

    def _signing(self) -> dict[str, Any]:
        """how to sign: credentials that can sign (impersonated, locally) sign themselves; Cloud Run's own credentials
        cannot, so the URL is signed through IAM with the service account's email and an access token"""
        from google.auth.transport.requests import Request

        from sc_api.gcp import credentials

        creds = credentials()
        if hasattr(creds, "sign_bytes") and getattr(creds, "signer_email", None):
            return {"credentials": creds}
        if not creds.valid:
            creds.refresh(Request())
        return {"service_account_email": creds.service_account_email, "access_token": creds.token}

    def signed_put(self, bucket: str, name: str, content_type: str, *, minutes: int = 10) -> SignedUpload:
        blob = self.client.bucket(bucket).blob(name)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=minutes),
            method="PUT",
            content_type=content_type,
            **self._signing(),
        )
        return SignedUpload(url=url, headers={"Content-Type": content_type})

    def signed_get(self, bucket: str, name: str, *, minutes: int = 5) -> str:
        blob = self.client.bucket(bucket).blob(name)
        return blob.generate_signed_url(
            version="v4", expiration=timedelta(minutes=minutes), method="GET", **self._signing()
        )

    async def size(self, bucket: str, name: str) -> int | None:
        def stat() -> int | None:
            blob = self.client.bucket(bucket).get_blob(name)
            return None if blob is None else int(blob.size or 0)

        return await asyncio.to_thread(stat)

    async def write(self, bucket: str, name: str, data: bytes, content_type: str) -> bool:
        from google.api_core.exceptions import PreconditionFailed

        def put() -> bool:
            try:
                self.client.bucket(bucket).blob(name).upload_from_string(
                    data, content_type=content_type, if_generation_match=0
                )
            except PreconditionFailed:
                return False
            return True

        return await asyncio.to_thread(put)


@dataclass
class FakeStorage:
    objects: dict[tuple[str, str], bytes] = field(default_factory=dict)

    def signed_put(self, bucket: str, name: str, content_type: str, *, minutes: int = 10) -> SignedUpload:
        return SignedUpload(url=f"https://storage.test/{bucket}/{name}?put", headers={"Content-Type": content_type})

    def signed_get(self, bucket: str, name: str, *, minutes: int = 5) -> str:
        return f"https://storage.test/{bucket}/{name}?get"

    async def size(self, bucket: str, name: str) -> int | None:
        data = self.objects.get((bucket, name))
        return None if data is None else len(data)

    async def write(self, bucket: str, name: str, data: bytes, content_type: str) -> bool:
        if (bucket, name) in self.objects:
            return False
        self.objects[(bucket, name)] = data
        return True


# --- Firebase Cloud Messaging ---------------------------------------------------------------------------------------


@dataclass(frozen=True)
class Delivery:
    token: str
    ok: bool
    error: str | None = None

    @property
    def gone(self) -> bool:
        """the device no longer takes pushes: its token is dropped. firebase_admin reports an unregistered token as
        NOT_FOUND (messaging.UnregisteredError's code), FCM itself as UNREGISTERED"""
        return self.error in ("UNREGISTERED", "NOT_FOUND", "registration-token-not-registered", "INVALID_ARGUMENT")


class Messenger(Protocol):
    async def send(self, tokens: list[str], data: dict[str, str]) -> list[Delivery]: ...


class FirebaseMessenger:
    """sends through the same Firebase app as sign-in (identity.py), as the service account, with sc_api's
    scMessagingSend role and nothing more"""

    def __init__(self, identity: Any):
        self.identity = identity

    def _send(self, tokens: list[str], data: dict[str, str]) -> list[Delivery]:
        from firebase_admin import messaging

        message = messaging.MulticastMessage(
            tokens=tokens,
            data=data,
            webpush=messaging.WebpushConfig(headers={"Urgency": "high", "TTL": "86400"}),
        )
        result = messaging.send_each_for_multicast(message, app=self.identity.app)
        out = []
        for token, r in zip(tokens, result.responses, strict=True):
            code = None if r.success else getattr(r.exception, "code", None) or type(r.exception).__name__
            out.append(Delivery(token=token, ok=r.success, error=code))
        return out

    async def send(self, tokens: list[str], data: dict[str, str]) -> list[Delivery]:
        if not tokens:
            return []
        return await asyncio.to_thread(self._send, tokens, data)


@dataclass
class FakeMessenger:
    sent: list[tuple[list[str], dict[str, str]]] = field(default_factory=list)
    # devices that are gone, reported as firebase_admin reports them (NOT_FOUND)
    gone: set[str] = field(default_factory=set)
    # devices FCM refuses for another reason: token → its error code
    refused: dict[str, str] = field(default_factory=dict)

    def _one(self, token: str) -> Delivery:
        if token in self.gone:
            return Delivery(token, False, "NOT_FOUND")
        if token in self.refused:
            return Delivery(token, False, self.refused[token])
        return Delivery(token, True)

    async def send(self, tokens: list[str], data: dict[str, str]) -> list[Delivery]:
        self.sent.append((list(tokens), dict(data)))
        return [self._one(t) for t in tokens]


@dataclass
class Cloud:
    publisher: Publisher
    storage: Storage
    messenger: Messenger


def cloud(settings: Settings, identity: Any) -> Cloud:
    if settings.cloud == "fake":
        return Cloud(FakePublisher(), FakeStorage(), FakeMessenger())
    return Cloud(GooglePublisher(settings), GoogleStorage(settings), FirebaseMessenger(identity))

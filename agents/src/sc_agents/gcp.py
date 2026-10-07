"""Google credentials, and the ID tokens backend-api's /internal routes take.

Locally the agents run on the developer's application-default credentials, impersonating sc-agents-local in code
(SC_IMPERSONATE_SA), so a laptop has exactly the local environment's privileges; on Cloud Run they run as sc-agents.
No key file exists anywhere.

The same credentials reach every Google service the agents use:
- Gemini on Vertex AI: google-genai's Client takes them (`credentials=`), and ADK's Gemini model builds that Client
  with them through its `client_kwargs` (models.py);
- BigQuery and Cloud Storage: their clients take them (tools/);
- Cloud Trace: the OTLP exporter signs with them (tracing.py).

backend-api's /internal routes take a Google ID token minted for INTERNAL_AUDIENCE with the caller's email in it:
impersonated `IDTokenCredentials` (include_email) locally, the metadata server's token (`fetch_id_token`) on Cloud Run.
"""

import asyncio
import threading
import time
from functools import lru_cache
from typing import Protocol

import google.auth
from google.auth import impersonated_credentials, jwt
from google.auth.credentials import Credentials
from google.auth.transport.requests import Request

from sc_agents.settings import Settings, get_settings

SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]
EARLY = 300  # a token is minted again five minutes before it expires


@lru_cache
def credentials() -> Credentials:
    source, _ = google.auth.default(scopes=SCOPES)
    target = get_settings().sc_impersonate_sa
    if not target:
        return source
    return impersonated_credentials.Credentials(
        source_credentials=source, target_principal=target, target_scopes=SCOPES, lifetime=3600
    )


class Tokens(Protocol):
    async def token(self) -> str:
        """a Google ID token for backend-api's /internal routes"""
        ...


class GoogleIdTokens:
    """ID tokens for INTERNAL_AUDIENCE, kept until five minutes before they expire"""

    def __init__(self, settings: Settings):
        self.audience = settings.internal_audience
        self.impersonate = settings.sc_impersonate_sa
        self._lock = threading.Lock()
        self._token: str | None = None
        self._expires = 0.0
        self._impersonated: impersonated_credentials.IDTokenCredentials | None = None

    def _mint(self) -> tuple[str, float]:
        request = Request()
        if self.impersonate:
            if self._impersonated is None:
                self._impersonated = impersonated_credentials.IDTokenCredentials(
                    target_credentials=credentials(), target_audience=self.audience, include_email=True
                )
            self._impersonated.refresh(request)
            token = self._impersonated.token
        else:
            from google.oauth2 import id_token

            token = id_token.fetch_id_token(request, self.audience)
        claims = jwt.decode(token, verify=False)
        return token, float(claims.get("exp", time.time() + 3600))

    def _get(self) -> str:
        with self._lock:
            if self._token is None or time.time() > self._expires - EARLY:
                self._token, self._expires = self._mint()
            return self._token

    async def token(self) -> str:
        return await asyncio.to_thread(self._get)


class FixedToken:
    """the test suite's: backend-api's FakeCallers takes "internal:<email>" """

    def __init__(self, value: str = "internal:sc-agents@test.example"):
        self.value = value

    async def token(self) -> str:
        return self.value

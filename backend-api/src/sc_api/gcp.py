"""Google credentials and Secret Manager.

Locally the backend runs on the developer's application-default credentials, impersonating sc-api-local in code
(SC_IMPERSONATE_SA), so it has exactly the cloud service's privileges. On Cloud Run it runs as its own service
account. No key file exists anywhere.
"""

from functools import lru_cache

import google.auth
from google.auth import impersonated_credentials
from google.auth.credentials import Credentials
from google.cloud import secretmanager

from sc_api.settings import get_settings

SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]


@lru_cache
def credentials() -> Credentials:
    source, _ = google.auth.default(scopes=SCOPES)
    target = get_settings().sc_impersonate_sa
    if not target:
        return source
    return impersonated_credentials.Credentials(
        source_credentials=source, target_principal=target, target_scopes=SCOPES, lifetime=3600
    )


@lru_cache
def _secrets() -> secretmanager.SecretManagerServiceClient:
    return secretmanager.SecretManagerServiceClient(credentials=credentials())


@lru_cache
def secret(ref: str) -> str:
    """A secret's value, read once into memory. Never logged, never written anywhere."""
    if "/versions/" not in ref:
        ref = f"{ref}/versions/latest"
    return _secrets().access_secret_version(name=ref).payload.data.decode("utf-8")

"""Firebase Authentication: who a bearer token belongs to, and the accounts backend-api makes.

- Every account is made here, with the Admin SDK. Users cannot sign themselves up (sign-up is disabled in
  infra/prod/auth.tf). Each starts on the default password, from Secret Manager, and no email is ever sent: the
  addresses are fictional. An operator hands the password over (scripts/default-password.sh).
- Phone-only partners (distributors, kiranas) get no account yet. Firebase has no password for a phone number, and
  phone sign-in comes with the workspace app.
- Local development and prod share one Firebase user pool. So an address that already has an account is linked, not
  recreated, and its password is only reset when asked (resend invitation, or hydrate for its own synthetic users).
"""

import asyncio
import hashlib
import time
from dataclasses import dataclass, field
from functools import cached_property
from typing import Protocol

from sc_api.errors import ApiError
from sc_api.settings import Settings

CANNOT_SIGN_IN = "This account cannot sign in to the console."


@dataclass(frozen=True)
class Verified:
    uid: str
    email: str | None


class IdentityProvider(Protocol):
    async def ensure_account(
        self, email: str, name: str, *, uid: str | None = None, reset: bool = False
    ) -> tuple[str, bool]:
        """the uid of the account for this address, made with the default password if there is none; and whether it
        is now on the default password (made, or reset)"""
        ...

    async def reset_to_default(self, uid: str) -> None: ...

    async def verify(self, token: str) -> Verified: ...


def synthetic_uid(email: str) -> str:
    """the uid hydrate gives its own users, so a re-run finds them again"""
    return "syn-" + hashlib.sha256(email.lower().encode()).hexdigest()[:24]


class FirebaseIdentity:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._checked: dict[str, tuple[float, int, bool]] = {}

    @cached_property
    def app(self):
        import firebase_admin
        from firebase_admin import credentials

        from sc_api.gcp import credentials as google_credentials

        class _Google(credentials.Base):
            def get_credential(self):
                return google_credentials()

        name = "sc-api"
        try:
            return firebase_admin.get_app(name)
        except ValueError:
            return firebase_admin.initialize_app(
                _Google(), {"projectId": self.settings.google_cloud_project}, name=name
            )

    @cached_property
    def _default_password(self) -> str:
        from sc_api.gcp import secret

        if not self.settings.default_password_secret:
            raise RuntimeError("DEFAULT_PASSWORD_SECRET is not set")
        return secret(self.settings.default_password_secret)

    def _ensure(self, email: str, name: str, uid: str | None, reset: bool) -> tuple[str, bool]:
        from firebase_admin import auth

        try:
            user = auth.get_user_by_email(email, app=self.app)
            if reset:
                auth.update_user(user.uid, password=self._default_password, app=self.app)
            return user.uid, reset
        except auth.UserNotFoundError:
            pass
        kwargs = {"uid": uid} if uid else {}
        user = auth.create_user(
            email=email,
            password=self._default_password,
            display_name=name,
            email_verified=False,
            app=self.app,
            **kwargs,
        )
        return user.uid, True

    async def ensure_account(
        self, email: str, name: str, *, uid: str | None = None, reset: bool = False
    ) -> tuple[str, bool]:
        return await asyncio.to_thread(self._ensure, email, name, uid, reset)

    async def reset_to_default(self, uid: str) -> None:
        from firebase_admin import auth

        await asyncio.to_thread(auth.update_user, uid, password=self._default_password, app=self.app)

    def _verify(self, token: str) -> Verified:
        from firebase_admin import auth

        try:
            claims = auth.verify_id_token(token, app=self.app, check_revoked=False)
        except (auth.InvalidIdTokenError, auth.ExpiredIdTokenError, auth.CertificateFetchError, ValueError) as e:
            raise ApiError(401, "Your sign-in has expired. Sign in again.") from e
        uid = claims["uid"]
        # revoked or disabled accounts: checked against Firebase at most once a minute per account
        checked_at, valid_after, disabled = self._checked.get(uid, (0.0, 0, False))
        if time.monotonic() - checked_at > 60:
            user = auth.get_user(uid, app=self.app)
            valid_after = int((user.tokens_valid_after_timestamp or 0) / 1000)
            disabled = user.disabled
            self._checked[uid] = (time.monotonic(), valid_after, disabled)
        if disabled or claims.get("auth_time", 0) < valid_after:
            raise ApiError(401, CANNOT_SIGN_IN)
        return Verified(uid=uid, email=claims.get("email"))

    async def verify(self, token: str) -> Verified:
        return await asyncio.to_thread(self._verify, token)


@dataclass
class FakeIdentity:
    """The test suite's Firebase: accounts in memory, and a token is "fake:<uid>". Refused outside SC_ENV=test."""

    accounts: dict[str, str] = field(default_factory=dict)  # uid → email
    resets: list[str] = field(default_factory=list)

    async def ensure_account(
        self, email: str, name: str, *, uid: str | None = None, reset: bool = False
    ) -> tuple[str, bool]:
        for existing, address in self.accounts.items():
            if address == email:
                if reset:
                    self.resets.append(existing)
                return existing, reset
        uid = uid or synthetic_uid(email)
        self.accounts[uid] = email
        return uid, True

    async def reset_to_default(self, uid: str) -> None:
        self.resets.append(uid)

    async def verify(self, token: str) -> Verified:
        if not token.startswith("fake:") or token[5:] not in self.accounts:
            raise ApiError(401, "Your sign-in has expired. Sign in again.")
        uid = token[5:]
        return Verified(uid=uid, email=self.accounts[uid])


def provider(settings: Settings) -> IdentityProvider:
    return FakeIdentity() if settings.identity == "fake" else FirebaseIdentity(settings)


# --- the agents and Google's own callers (SC-66) ----------------------------------------------------------------------


class Callers(Protocol):
    async def verify(self, token: str) -> str:
        """the service account a Google ID token was minted for, if it is one this API lets in"""
        ...


class GoogleCallers:
    """backend-api's /internal routes take Google ID tokens: from the agents (sc-agents, or sc-agents-local on a
    laptop), and from Pub/Sub's pushes and Cloud Scheduler's jobs (sc-invoker), each minted for INTERNAL_AUDIENCE"""

    def __init__(self, settings: Settings):
        self.audience = settings.internal_audience
        self.allowed = {e.lower() for e in settings.internal_callers}

    def _verify(self, token: str) -> str:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        try:
            claims = id_token.verify_oauth2_token(token, google_requests.Request(), audience=self.audience)
        except ValueError as e:
            raise ApiError(401, "Not a valid Google ID token for this API.") from e
        email = (claims.get("email") or "").lower()
        if not claims.get("email_verified") or email not in self.allowed:
            raise ApiError(403, "This caller may not use the internal routes.")
        return email

    async def verify(self, token: str) -> str:
        return await asyncio.to_thread(self._verify, token)


@dataclass
class FakeCallers:
    """the test suite's: a token is "internal:<email>", and any email the settings allow passes"""

    allowed: set[str] = field(default_factory=lambda: {"sc-agents@test.example", "sc-invoker@test.example"})

    async def verify(self, token: str) -> str:
        if not token.startswith("internal:"):
            raise ApiError(401, "Not a valid Google ID token for this API.")
        email = token[len("internal:") :]
        if email not in self.allowed:
            raise ApiError(403, "This caller may not use the internal routes.")
        return email


def callers(settings: Settings) -> Callers:
    return FakeCallers() if settings.identity == "fake" else GoogleCallers(settings)

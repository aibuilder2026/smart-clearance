"""backend-api's configuration, from the environment (and backend-api/.env, which is git-ignored).

Nothing secret is configured by value. A secret is named by its Secret Manager reference
(projects/<project>/secrets/<id>/versions/latest) and read into memory when it is first needed, with the
service's own credentials. The one exception is DB_PASSWORD, for throwaway databases (CI's service container).
"""

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

Env = Literal["local", "test", "prod"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    sc_env: Env = "local"
    google_cloud_project: str = ""
    # a local backend acts as this service account (sc-api-local), from the developer's own credentials
    sc_impersonate_sa: str | None = None

    db_mode: Literal["dsn", "cloudsql"] = "dsn"
    db_host: str = "127.0.0.1"
    db_port: int = 5432
    db_name: str = "smart_clearance"
    db_user: str = "sc_api"
    db_password: str | None = Field(default=None, repr=False)
    db_password_secret: str | None = None
    db_instance: str | None = None  # Cloud SQL: project:region:instance
    db_app_user: str | None = None  # the login the migrate job grants the app's privileges to
    db_pool_size: int = 5

    # Firebase Authentication: "fake" is only for the test suite, which never reaches Google
    identity: Literal["firebase", "fake"] = "firebase"
    default_password_secret: str | None = None

    staff_email_domain: str = "smartclearance.example"
    workspace_domain: str = "smartclearance.com"
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:4173",
            "http://localhost:4176",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            # the workspace app's dev and preview servers (SC-66)
            "http://localhost:5175",
            "http://localhost:4177",
            "http://127.0.0.1:5175",
            "http://127.0.0.1:4177",
        ]
    )
    lookup_rate: str = "10/minute"
    log_level: str = "INFO"
    # json on Cloud Run (infra/prod/run.tf): one JSON object a line, for Cloud Logging (logs.py)
    log_format: Literal["text", "json"] = "text"
    # otlp on Cloud Run: sampled spans go to Cloud Trace (tracing.py). Locally every request is sampled, nothing sent.
    trace_export: Literal["none", "otlp"] = "none"
    trace_sample_rate: float = Field(default=1.0, ge=0.0, le=1.0)

    # --- the live workspace (SC-66) ---
    # which environment's topics, buckets and dataset this process uses: prod on Cloud Run, local on a laptop
    # (infra/prod/events.tf, storage.tf); test publishes nowhere
    events_env: Literal["prod", "local", "test"] = "local"
    # the cloud services, or in-process fakes for the test suite (refused outside SC_ENV=test, as IDENTITY=fake is)
    cloud: Literal["google", "fake"] = "google"
    photos_bucket: str | None = None
    docs_bucket: str | None = None
    exports_bucket: str | None = None
    # the agents' calls to /internal/*: Google ID tokens for this audience, from these service accounts
    internal_audience: str = "sc-backend-api"
    internal_callers: Annotated[list[str], NoDecode] = Field(default_factory=list)
    # how the Notifier hears its messages: Pub/Sub pushes to /internal/pubsub/notify (Cloud Run), or this process pulls
    # local.notify.api (a laptop, which nothing can push to); none: tests call it directly
    notify_mode: Literal["push", "pull", "none"] = "push"
    # a laptop's own tick, every so many seconds (Cloud Scheduler calls /internal/jobs/tick in the cloud); 0: none
    tick_seconds: int = 0
    # the live stream: each one ends after this long (the app reconnects with a fresh token), with a keep-alive comment
    stream_max_seconds: int = 900
    stream_heartbeat_seconds: int = 20
    db_max_overflow: int = 10
    # where a member's push opens the app (the workspace's own origin); relative links are used when unset
    workspace_origin: str | None = None

    @field_validator("internal_callers", mode="before")
    @classmethod
    def _callers(cls, v: object) -> object:
        if isinstance(v, str):
            import json

            v = v.strip()
            return json.loads(v) if v.startswith("[") else [o.strip() for o in v.split(",") if o.strip()]
        return v

    @field_validator("cloud")
    @classmethod
    def _fake_cloud_only_in_tests(cls, v: str, info) -> str:
        if v == "fake" and info.data.get("sc_env") != "test":
            raise ValueError("CLOUD=fake is only for the test suite (SC_ENV=test)")
        return v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _origins(cls, v: object) -> object:
        if isinstance(v, str):
            import json

            v = v.strip()
            return json.loads(v) if v.startswith("[") else [o.strip() for o in v.split(",") if o.strip()]
        return v

    @field_validator("identity")
    @classmethod
    def _fake_only_in_tests(cls, v: str, info) -> str:
        if v == "fake" and info.data.get("sc_env") != "test":
            raise ValueError("IDENTITY=fake is only for the test suite (SC_ENV=test)")
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()

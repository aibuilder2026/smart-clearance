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
        ]
    )
    lookup_rate: str = "10/minute"
    log_level: str = "INFO"

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

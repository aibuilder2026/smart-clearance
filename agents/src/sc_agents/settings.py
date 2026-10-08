"""The agents service's configuration, from the environment (and agents/.env, which is git-ignored).

Nothing secret is configured: the service calls Gemini on Vertex AI, BigQuery, Cloud Storage and backend-api with its
own Google credentials (sc-agents on Cloud Run, sc-agents-local impersonated in code on a laptop), and no key exists.

The model ids have no default: they change with Google's releases (README, "Models"), so each environment names them
(MODEL_PRO, MODEL_FLASH). MODEL_TIER=stub replays recorded responses instead, and needs neither.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

Env = Literal["local", "prod", "test"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # which environment's topics, buckets and dataset: prod on Cloud Run, local on a laptop, test in the suite
    agents_env: Env = "local"
    google_cloud_project: str = ""
    # a laptop acts as this service account (sc-agents-local), from the developer's own credentials
    sc_impersonate_sa: str | None = None

    # backend-api, and the audience its /internal routes check on our Google ID tokens
    api_base: str = "http://localhost:8000"
    internal_audience: str = "sc-backend-api"
    api_timeout_s: float = 30.0
    api_retries: int = 3

    # Gemini on Vertex AI (google-genai, no API key); stub replays agents/src/sc_agents/recordings/
    model_tier: Literal["live", "stub"] = "live"
    model_pro: str | None = None
    model_flash: str | None = None
    genai_location: str = "global"
    # each attempt's deadline, and how many attempts a call gets on Vertex AI's capacity answers (429, 500, 503, 504):
    # the first live eval run met the Pro preview's quota and 20 s deadlines (SC-77)
    model_timeout_s: float = Field(default=30.0, gt=0)
    model_attempts: int = Field(default=3, ge=1, le=5)
    model_calls_per_run: int = Field(default=12, ge=1)
    # the Impact agent's BRSR narrative (one Flash call a cleared batch, not sent back yet): off unless asked for
    impact_narrative: bool = False

    # BigQuery and Cloud Storage (infra/prod analytics.tf, storage.tf), each environment's own
    bq_dataset: str = "smartclearance_local"
    bq_location: str = "asia-south1"
    photos_bucket: str | None = None
    docs_bucket: str | None = None
    exports_bucket: str | None = None
    # the run log in BigQuery (agent_runs): its failures only log
    run_log: bool = True

    # Pub/Sub: a message that fails this many times goes to the dead letter (infra/prod events.tf)
    max_attempts: int = 5

    log_level: str = "INFO"
    log_format: Literal["text", "json"] = "text"
    trace_export: Literal["none", "otlp"] = "none"
    trace_sample_rate: float = Field(default=1.0, ge=0.0, le=1.0)

    def model_id(self, tier: Literal["pro", "flash"]) -> str:
        """the model a tier calls, as a run reports it ("stub" when recordings stand in)"""
        if self.model_tier == "stub":
            return "stub"
        name = self.model_pro if tier == "pro" else self.model_flash
        if not name:
            raise RuntimeError(f"MODEL_{tier.upper()} is not set (README, 'Models')")
        return name

    def topic(self, name: str) -> str:
        return f"{self.agents_env}.{name}"


@lru_cache
def get_settings() -> Settings:
    return Settings()

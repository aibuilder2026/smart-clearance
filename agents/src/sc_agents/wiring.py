"""The real services, put together for the push service and the pull worker."""

from sc_agents import logs, tracing
from sc_agents.backend import Backend
from sc_agents.gcp import GoogleIdTokens
from sc_agents.models import ModelTier
from sc_agents.runs import Deps
from sc_agents.settings import Settings, get_settings
from sc_agents.tools import pdf
from sc_agents.tools.bigquery import BigQueryWarehouse
from sc_agents.tools.storage import GcsStore


def deps(settings: Settings | None = None) -> Deps:
    settings = settings or get_settings()
    logs.configure(settings)
    tracing.setup(settings)
    return Deps(
        settings=settings,
        backend=Backend(
            settings.api_base,
            GoogleIdTokens(settings),
            timeout=settings.api_timeout_s,
            retries=settings.api_retries,
        ),
        models=ModelTier(settings),
        warehouse=BigQueryWarehouse(settings),
        store=GcsStore(settings),
        render_pdf=pdf.render,
    )

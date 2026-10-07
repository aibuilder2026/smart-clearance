# The agents service's image: what Cloud Run serves (infra phase B, SC-74), POST /pubsub for Pub/Sub's pushes.
# Built from agents/ alone. WeasyPrint draws the Paperwork agent's PDFs with Pango and HarfBuzz from the system (it has
# not needed Cairo since version 53: it writes PDF itself), and the papers need fonts for Latin text, the rupee sign
# and Devanagari.
FROM python:3.14-slim AS build
COPY --from=ghcr.io/astral-sh/uv:0.12.9 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
WORKDIR /app
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project
COPY src ./src
RUN uv sync --frozen --no-dev

FROM python:3.14-slim
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b libharfbuzz-subset0 fonts-dejavu-core fonts-noto-core \
	&& rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 10001 --home /app agents
WORKDIR /app
COPY --from=build --chown=agents /app /app
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1 PORT=8080 LOG_FORMAT=json
USER agents
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn sc_agents.service:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]

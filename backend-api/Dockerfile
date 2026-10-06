# backend-api's image: what Cloud Run serves (infra/prod/run.tf) and what `docker compose up` runs locally.
# Built from backend-api/ alone; the reference data it loads at migrate time is in src/sc_api/reference/.
FROM python:3.14-slim AS build
COPY --from=ghcr.io/astral-sh/uv:0.12.9 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
WORKDIR /app
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project
COPY src ./src
RUN uv sync --frozen --no-dev

FROM python:3.14-slim
RUN useradd --system --uid 10001 --home /app api
WORKDIR /app
COPY --from=build --chown=api /app /app
COPY --chown=api alembic.ini ./
COPY --chown=api migrations ./migrations
COPY --chown=api db ./db
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1 PORT=8080
USER api
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn sc_api.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]

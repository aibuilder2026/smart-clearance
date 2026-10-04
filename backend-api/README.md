# backend-api

The platform's API, planned: the service the frontend reads instead of its in-browser mock. Nothing is built yet. This
folder holds the contract the frontend already speaks, so the service can be written to it.

## Planned stack

Per `docs/smart-clearance-tech-stack.html`:

| Area | Choice |
| --- | --- |
| Runtime | Python 3.12, uv (lockfile committed), ruff |
| API | FastAPI on Uvicorn, Pydantic models |
| Data | PostgreSQL 16 (Cloud SQL), BigQuery for sell-through |
| Hosting | Cloud Run, behind the Firebase Hosting domain |
| Sign-in | Firebase Authentication ID tokens in the `Authorization` header (not needed for the public endpoints below) |
| Contracts | the Pydantic models export JSON Schema and OpenAPI into `contracts/`; `openapi-typescript` turns them into the frontend's types |

When the service exists, its gate runs on any `*.py` or `pyproject.toml` change here: `uv run ruff check . && uv run pytest`
(`.claude/jira-flow.json`).

## The endpoints the frontend calls

The shapes are `frontend/admin/src/lib/api/types.ts`. The mock (`mock.ts` there) answers them today from data generated from
`design3/core`, the prototype's figures. The service must answer them the same way. Point the frontend at it with
`PUBLIC_API_BASE=https://…`.

| Endpoint | Returns | Notes |
| --- | --- | --- |
| `GET /v1/site/showcase` | `Showcase` | the customer story on the landing page: one batch, its plan and every figure. Public, cacheable. |
| `GET /v1/platform/catalog` | `Catalog` | the agents, connectors and plans the platform offers. Public, cacheable. |
| `POST /v1/workspaces/lookup` `{ query }` | `WorkspaceMatch[]` | "Find your workspace": an email or an Indian mobile number (10 digits, with or without +91). A member, an invitee and a deactivated account each name their workspace and how they belong; an address at a client's email domain names that client's workspace; a marketplace buyer finds nothing. 422 for anything else. A POST, so the identifier never lands in a URL or a log line. Rate-limit it: it reveals whether an address belongs to a workspace. |
| `POST /v1/demo-requests` `DemoRequestInput` | `DemoRequest` | Book a demo. 422 with `{ message, fields: { name?, company?, email? } }` naming each field's problem in the frontend's words. Stores the request for the console's Overview. |

Errors are JSON, `{ message, fields? }`; the frontend's HTTP client (`http.ts`) reads both.

## Money

Every figure the API returns must equal the prototype's: `design3/core/money.js` is the reference implementation of the
journey map's rules (`docs/dobara-journey-map.html` v4.1). Port it with tests that compare against the seed in
`frontend/admin/src/lib/seed/`.

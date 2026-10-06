# @smart-clearance/api

The frontend's side of backend-api: the contract, the HTTP client, and an in-browser mock of each surface's calls,
seeded from design3. The landing page (`../admin`) and the console (`../console`) both use it, so the shapes they share
(the catalog, finding a workspace, demo requests) are written once.

| Entry                          | What                                                                                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@smart-clearance/api`         | the shared types, `ApiError`, and `transport()`: JSON over HTTP, a bearer token when one is given                                                                                   |
| `@smart-clearance/api/site`    | the landing page's `SiteApi`: `siteHttp(base)`, `siteMock()`, `demoRequestErrors()`                                                                                                 |
| `@smart-clearance/api/console` | the console's `ConsoleApi`: `consoleHttp(base)`, `consoleMock()`, and the platform's rules (`exitsFor`, `profileLines`, `summary`, `agentDefaults`, `inviteError`, `setupErrors` …) |
| `@smart-clearance/api/seed/*`  | the generated seed, for tests                                                                                                                                                       |

Each surface is its own entry and the package has no side effects, so an app bundles only its own client and mock.

```ts
import { consoleHttp, consoleMock } from '@smart-clearance/api/console';
export const api = PUBLIC_API_BASE ? consoleHttp(PUBLIC_API_BASE) : consoleMock({ latency: 0 });
```

## The contract

`src/types/` holds it until backend-api publishes its OpenAPI schema; then openapi-typescript generates these types and
these files re-export them. The shapes are the prototype's (`design3/core`).

**Shared** (`types/shared.ts`)

| Call                      | Endpoint                     |
| ------------------------- | ---------------------------- |
| `catalog()`               | `GET /v1/platform/catalog`   |
| `lookupWorkspaces(query)` | `POST /v1/workspaces/lookup` |

**The landing page** (`types/site.ts`)

| Call                 | Endpoint                 |
| -------------------- | ------------------------ |
| `showcase()`         | `GET /v1/site/showcase`  |
| `requestDemo(input)` | `POST /v1/demo-requests` |

**The console** (`types/console.ts`): every change is written to the audit log by the server, in the signed-in staff
member's name.

| Call                                                           | Endpoint                                                               |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `config()`                                                     | `GET /v1/console/config`                                               |
| `signIn(input)`                                                | Firebase, then `POST /v1/console/session`                              |
| `me()`, `signOut()`                                            | `GET`, `DELETE /v1/console/session`                                    |
| `overview()`                                                   | `GET /v1/console/overview`                                             |
| `clients()`, `client(id)`                                      | `GET /v1/console/clients`, `GET /v1/console/clients/{id}`              |
| `createClient(input)`                                          | `POST /v1/console/clients`                                             |
| `updateAgent(id, agent, patch)`                                | `PATCH /v1/console/clients/{id}/agents/{agent}`                        |
| `runAgent(id, agent)`                                          | `POST …/agents/{agent}/runs`                                           |
| `setAllAgents(id, on)`                                         | `POST …/agents/pause`, `POST …/agents/resume`                          |
| `goLive(id)`, `setPlan(id, plan)`                              | `POST …/go-live`, `PATCH /v1/console/clients/{id}`                     |
| `saveProfile(id, input)`, `saveRules(id, input)`               | `PUT …/profile`, `PUT …/rules`                                         |
| `clientBatches(id, sku?)`                                      | `GET …/batches?sku=`                                                   |
| `saveSkuGates(id, sku, gates)`                                 | `PUT …/skus/{sku}/gates`                                               |
| `overrideBatch(id, ref, input)`, `clearBatchOverride(id, ref)` | `PUT`, `DELETE …/batches/{ref}/override`                               |
| `remindDistributor(id, d)`                                     | `POST …/distributors/{d}/reminders`                                    |
| `requestFirstExport(id)`                                       | `POST …/integrations/dms/requests`                                     |
| `invitePerson`, `updatePerson`, `resendInvite`                 | `POST …/people`, `PATCH …/people/{p}`, `POST …/people/{p}/invitations` |
| `staff()`, `inviteStaff(input)`                                | `GET`, `POST /v1/console/staff`                                        |
| `audit(client?)`                                               | `GET /v1/console/audit?client=`                                        |
| `demoRequests()`                                               | `GET /v1/demo-requests`                                                |

A 422 carries the message and, where it names an input, `fields`. `client(id)` and `me()` answer `null` for a 404 and a 401. backend-api serves these routes (SC-45; `backend-api/README.md`, `backend-api/contracts/openapi.json`).

**Signing in** (SC-46): `signIn({ email, password })`. Over HTTP, `consoleHttp(base, { auth })` takes the app's
`ConsoleAuth` (Firebase Authentication in `frontend/console`): it signs in with Firebase, then `POST /v1/console/session`
answers the staff member the account belongs to; every call carries the Firebase ID token. The mock lets any active
staff member's address in with any password. A wrong sign-in is a 401 with `SIGN_IN_FAILED`, one message whichever part
was wrong. Find your workspace (`WorkspaceMatch`) names the workspace only, never the person's role.

**Quick-commerce gates** (SC-47): an SKU's own gates (`Sku.gates`, each value absent for the client's default), and a
batch's override with its reason. `clientBatches` answers a client's open batches with their gates as the agents read
them: each gate's source (`default`, `sku` or `override`) and pass or fail. `platform.ts` has the rule (`batchGates`),
the checks (`skuGatesError`, `overrideError`) and the audit lines, as `platform.js` has them.

## The mocks

- **`siteMock`**: the showcase and catalog from the seed, the prototype's workspace lookup, and demo requests kept in
  `localStorage` (`sc-demo-requests`).
- **`consoleMock`**: the platform as `design3/core/platform.js` keeps it: Munchly Foods as the only client, the
  platform's two staff, today's runs and batches, the audit log, plus two fictional demo requests (the prototype gets
  its requests from the landing page in the same browser, which a console on its own subdomain cannot see). Every change
  writes its audit line in the prototype's words. State is kept in `localStorage` (`sc-console`), the session in
  `sc-console-session`. Inputs are serialised as JSON, as they would be over HTTP, and answers are copies.

## The seed

`src/seed/` is generated by `corepack pnpm seed` (`../scripts/seed.mjs`), which runs design3/core as the browser does:

| File             | What                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `showcase.json`  | the landing page's one batch, every figure computed by money.js, no client named                                                                                                |
| `catalog.json`   | the agents, connectors and plans                                                                                                                                                |
| `directory.json` | who belongs to which workspace (the mock's lookup; a real API never sends this)                                                                                                 |
| `console.json`   | the console's config (autonomy levels, agent settings, exits, the supply-chain profile, presets, the nine stages and their times, money.js's defaults) and the platform's state |

Never edit them; `seed:check` fails the gate when design3 changes and the seed was not regenerated.

## Tests

`corepack pnpm test`: the site mock's lookup and demo rules; the console mock's seed, attention list, every change and
its audit line, validation and persistence; and the platform's rules against `design3/core/platform.js` itself, run in
a sandbox (summaries, setting values, exits and profile lines for every profile, slugs, presets).

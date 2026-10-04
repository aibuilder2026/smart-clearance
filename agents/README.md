# agents

The AI agents service, planned: the agents that watch a client's stock, price every exit, and carry out the plan a
person approves. Nothing is built yet. The prototype's agents (`design3/core/platform.js`, `design3/core/flow.js`) and the
Tech Stack doc (`docs/smart-clearance-tech-stack.html`) describe what it will do.

## Planned stack

| Area | Choice |
| --- | --- |
| Runtime | Python 3.12, uv, ruff, pytest |
| Agents | Google's Agent Development Kit (ADK): one orchestrator over the specialists, sequential where a step needs the last one's result and parallel where it does not |
| Models | Gemini on Vertex AI: Pro for reading labels and routing, Flash for drafts, offers and chat |
| Events | Cloud Pub/Sub (`batch.at_risk`, `offer.received`, `deal.closed`); runs resume from Postgres |
| To the apps | server-sent events for the live agent feed, with polling as the fallback; push through Firebase Cloud Messaging |
| Hosting | Cloud Run |

When the service exists, its gate runs on any `*.py` or `pyproject.toml` change here: `uv run ruff check . && uv run pytest`
(`.claude/jira-flow.json`).

## The agents

In the order they work along the nine stops; the approval is a person, never an agent.

| Stop | Agent | Job |
| --- | --- | --- |
| Connect | Data | Loads each distributor's stock export and maps its columns |
| Detect | Watcher | Flags batches that won't sell in time, against the quick-commerce gates |
| Verify | Vision | Reads the label photo from the godown |
| Value | Valuer | Prices every exit, the bin included |
| Decide | Router | Splits the batch under each exit's caps |
| Approve | (a person) | Approves every plan, with the money on screen |
| Execute | Lister | Lists on ExpireSoon in the distributor's name |
| Execute | Outreach | Sends kirana offers |
| Execute | Negotiator | Answers bids |
| Settle | Paperwork | Drafts the invoice, e-way bill check, credit note, GST memo and FSSAI checklist |
| Report | Impact | Posts the ledger and the BRSR rows |

Each agent's settings (autonomy: suggest, ask or act; its schedule and limits) are a client's workspace configuration.
The staff console edits them (`design3/console`). Money is never an agent's guess: the Valuer and Router use the journey
map's rules as `design3/core/money.js` implements them.

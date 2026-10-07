# The agents' identities (SC-66). No key exists for any of them.
# - sc-agents is what the agents service runs as on Cloud Run (infra phase B adds the service itself, SC-74).
# - sc-agents-local is what a developer's agents run as, by impersonation (agents/scripts/dev.sh), as sc-api-local is
#   for backend-api: a laptop gets the cloud service's least privilege, scoped to the local environment's resources.
# - sc-invoker is the identity Pub/Sub's push subscriptions and Cloud Scheduler sign their requests as (OIDC); the
#   agents service lets only it in, and backend-api's internal routes check its email (SC-74 wires it up).
# Each agent calls Gemini on Vertex AI, runs BigQuery jobs and sends its spans to Cloud Trace. Its data access is per
# environment: BigQuery in analytics.tf, the buckets in storage.tf, the subscriptions in events.tf.

locals {
  # Who acts in each environment: the API that publishes events and signs upload links, and the agents that consume
  # them. prod's API exists only with the runtime on (run.tf).
  env_identities = {
    prod = {
      api    = var.backend_runtime ? google_service_account.api[0].member : null
      agents = google_service_account.agents.member
    }
    local = {
      api    = google_service_account.api_local.member
      agents = google_service_account.agents_local.member
    }
  }
}

resource "google_service_account" "agents" {
  account_id   = "sc-agents"
  display_name = "agents (Cloud Run)"
  description  = "What the ADK agents service runs as on Cloud Run. No key."

  depends_on = [google_project_service.this]
}

resource "google_service_account" "agents_local" {
  account_id   = "sc-agents-local"
  display_name = "agents (local)"
  description  = "What a developer's local agents run as, by impersonation. No key."

  depends_on = [google_project_service.this]
}

resource "google_service_account" "invoker" {
  account_id   = "sc-invoker"
  display_name = "Pub/Sub push and Cloud Scheduler"
  description  = "The identity push subscriptions and Scheduler jobs sign their OIDC tokens as. No key."

  depends_on = [google_project_service.this]
}

resource "google_project_iam_member" "agents" {
  for_each = {
    for pair in setproduct(
      ["agents", "agents_local"],
      [
        "roles/aiplatform.user",        # Gemini on Vertex AI
        "roles/bigquery.jobUser",       # load and query jobs; the data itself is granted per dataset (analytics.tf)
        "roles/telemetry.tracesWriter", # spans to Cloud Trace, as backend-api sends its own (SC-57)
      ],
    ) : "${pair[0]} ${pair[1]}" => { sa = pair[0], role = pair[1] }
  }

  project = var.project_id
  role    = each.value.role
  member  = each.value.sa == "agents" ? google_service_account.agents.member : google_service_account.agents_local.member
}

# The operators may act as sc-agents-local, which is how agents/scripts/dev.sh runs the agents and mints the ID tokens
# backend-api's internal routes check.
resource "google_service_account_iam_member" "agents_local_operators" {
  for_each = toset(var.operators)

  service_account_id = google_service_account.agents_local.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = each.key
}

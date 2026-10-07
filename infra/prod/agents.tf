# The agents' identities (SC-66), and the agents service on Cloud Run (infra phase B, SC-74). No key exists for any of
# them.
# - sc-agents is what the agents service runs as on Cloud Run.
# - sc-agents-local is what a developer's agents run as, by impersonation (agents/scripts/dev.sh), as sc-api-local is
#   for backend-api: a laptop gets the cloud service's least privilege, scoped to the local environment's resources.
# - sc-invoker is the identity Pub/Sub's push subscriptions and Cloud Scheduler sign their requests as (OIDC); the
#   agents service lets only it in, and backend-api's internal routes check its email (INTERNAL_CALLERS, run.tf).
# Each agent calls Gemini on Vertex AI, runs BigQuery jobs and sends its spans to Cloud Trace. Its data access is per
# environment: BigQuery in analytics.tf, the buckets in storage.tf, the subscriptions in events.tf.
#
# The service (behind agents_runtime): Pub/Sub pushes each prod event to POST /pubsub (events.tf), and the pipeline runs
# to its end inside the request, so the request timeout is the subscriptions' ack deadline, 600 s. Ingress is internal
# only (a push from the project's own Pub/Sub counts as internal) and Cloud Run's IAM lets only sc-invoker in. Terraform
# creates it on var.agents_image (a placeholder); Cloud Build deploys every image after that (agents/cloudbuild.yaml),
# so it ignores its image here, as run.tf does for backend-api. It holds no data: agents_runtime = false removes it.

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

  agents_run = var.agents_runtime ? 1 : 0
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

resource "google_cloud_run_v2_service" "agents" {
  count = local.agents_run

  name                = "agents"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_INTERNAL_ONLY"
  deletion_protection = false
  labels              = { app = "smart-clearance" }

  template {
    service_account = google_service_account.agents.email
    timeout         = "600s" # the push subscriptions' ack deadline: a run finishes inside its request

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = var.agents_image

      ports {
        container_port = 8080
      }
      resources {
        limits            = { cpu = "1", memory = "1Gi" } # ADK, the Google clients and WeasyPrint's PDFs
        cpu_idle          = true
        startup_cpu_boost = true
      }

      # agents/src/sc_agents/settings.py, by its names
      dynamic "env" {
        for_each = {
          GOOGLE_CLOUD_PROJECT = var.project_id
          AGENTS_ENV           = "prod" # prod's topics, buckets and dataset
          API_BASE             = google_cloud_run_v2_service.api[0].uri
          INTERNAL_AUDIENCE    = local.internal_audience
          BQ_DATASET           = google_bigquery_dataset.this["prod"].dataset_id
          BQ_LOCATION          = var.region # the dataset's (analytics.tf)
          PHOTOS_BUCKET        = google_storage_bucket.app["prod.photos"].name
          DOCS_BUCKET          = google_storage_bucket.app["prod.docs"].name
          EXPORTS_BUCKET       = google_storage_bucket.app["prod.exports"].name
          MODEL_TIER           = "live"
          MODEL_PRO            = var.model_pro
          MODEL_FLASH          = var.model_flash
          GENAI_LOCATION       = var.genai_location
          LOG_FORMAT           = "json"
          TRACE_EXPORT         = "otlp" # spans to Cloud Trace, as backend-api's (SC-57)
          TRACE_SAMPLE_RATE    = tostring(var.trace_sample_rate)
        }
        content {
          name  = env.key
          value = env.value
        }
      }

      # /readyz reads both models' metadata on Vertex AI (up to 10 s each, never generating), so a revision whose model
      # ids do not resolve never takes traffic; /healthz is the process
      startup_probe {
        timeout_seconds   = 25
        period_seconds    = 30
        failure_threshold = 4
        http_get {
          path = "/readyz"
        }
      }
      liveness_probe {
        http_get {
          path = "/healthz"
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version]
  }

  depends_on = [
    google_project_iam_member.agents,
    google_bigquery_dataset_iam_member.agents,
    google_storage_bucket_iam_member.app,
  ]
}

# Only sc-invoker may call it: Pub/Sub's pushes sign as it (events.tf)
resource "google_cloud_run_v2_service_iam_member" "agents_invoker" {
  count = local.agents_run

  name     = google_cloud_run_v2_service.agents[0].name
  location = google_cloud_run_v2_service.agents[0].location
  role     = "roles/run.invoker"
  member   = google_service_account.invoker.member
}

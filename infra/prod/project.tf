# The project's billing link and the APIs the workloads need. infra/bootstrap enables the ones Terraform itself calls.

# The project was linked to billing before Terraform; the import adopts that link instead of creating it.
import {
  to = google_billing_project_info.this
  id = "projects/${var.project_id}"
}

resource "google_billing_project_info" "this" {
  project         = var.project_id
  billing_account = var.billing_account

  # A destroy, or removing this block, forgets the link and never unlinks billing from the project.
  deletion_policy = "ABANDON"
}

locals {
  services = toset(concat([
    "firebase.googleapis.com",        # Firebase Management: adding Firebase to the project
    "firebasehosting.googleapis.com", # Hosting sites, versions and releases
    "iam.googleapis.com",             # the Workload Identity pool and the service accounts
    "iamcredentials.googleapis.com",  # GitHub's jobs acting as the deployer; local backends acting as sc-api-local
    "sts.googleapis.com",             # exchanging GitHub's OIDC token for a Google one
    "identitytoolkit.googleapis.com", # Firebase Authentication (Identity Platform)
    "apikeys.googleapis.com",         # the console's restricted browser key
    "secretmanager.googleapis.com",   # backend-api's secrets
    "telemetry.googleapis.com",       # the OTLP endpoint backend-api sends its spans to (SC-57)
    "cloudtrace.googleapis.com",      # Cloud Trace, where those spans are read (on by default; adopted here)
    ], var.backend_runtime ? [
    "sqladmin.googleapis.com",         # Cloud SQL
    "run.googleapis.com",              # Cloud Run
    "artifactregistry.googleapis.com", # backend-api's images
    "billingbudgets.googleapis.com",   # the project's budget alert
    "cloudbuild.googleapis.com",       # backend-api's image builds and deploys (build.tf)
    "monitoring.googleapis.com",       # the uptime check, the alerts and the dashboard (monitoring.tf)
    "logging.googleapis.com",          # Cloud Run's, Cloud SQL's and Cloud Build's logs
  ] : []))
}

resource "google_project_service" "this" {
  for_each = local.services

  service            = each.key
  disable_on_destroy = false

  depends_on = [google_billing_project_info.this]
}

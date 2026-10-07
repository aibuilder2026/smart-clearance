# backend-api is built and deployed by Cloud Build (backend-api/cloudbuild.yaml), started keylessly from GitHub Actions
# (SC-50), and so are the agents (agents/cloudbuild.yaml, SC-74). Behind backend_runtime, like everything that costs
# money; builds sit in Cloud Build's free 2,500 minutes.
# - sc-builder is what the build runs as. It pushes to the sc repository, runs the migrate job, and deploys new
#   revisions of the API and its jobs as sc-api and sc-migrator, and of the agents service as sc-agents (with
#   agents_runtime on), and nothing else.
# - github-backend is what the workflow signs in as, through the same Workload Identity pool as the deployer, and only
#   from the prod environment. It may start builds as sc-builder and stage their source, and nothing else: it cannot
#   deploy or read data itself. github-deployer stays Hosting-only (deployer.tf).
# - The source each build is given is staged in its own bucket, in the region, and deleted after a week.

resource "google_storage_bucket" "builds" {
  count = local.runtime

  name                        = "${var.project_id}-builds"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = { app = "smart-clearance" }

  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "Delete"
    }
  }

  depends_on = [google_project_service.this]
}

resource "google_service_account" "builder" {
  count = local.runtime

  account_id   = "sc-builder"
  display_name = "backend-api builds (Cloud Build)"
  description  = "Builds backend-api's image, migrates the database and deploys Cloud Run. No key."
}

resource "google_project_iam_member" "builder" {
  for_each = var.backend_runtime ? toset([
    "roles/logging.logWriter", # the build's own log (CLOUD_LOGGING_ONLY)
    "roles/run.developer",     # new revisions of the API and its jobs; run the migrate job
  ]) : toset([])

  project = var.project_id
  role    = each.key
  member  = google_service_account.builder[0].member
}

resource "google_artifact_registry_repository_iam_member" "builder" {
  count = local.runtime

  location   = google_artifact_registry_repository.sc[0].location
  repository = google_artifact_registry_repository.sc[0].name
  role       = "roles/artifactregistry.writer"
  member     = google_service_account.builder[0].member
}

resource "google_storage_bucket_iam_member" "builder" {
  count = local.runtime

  bucket = google_storage_bucket.builds[0].name
  role   = "roles/storage.objectViewer" # the staged source
  member = google_service_account.builder[0].member
}

# deploying a revision or a job that runs as sc-api or sc-migrator means acting as them; and as sc-agents for the agents
# service's revisions (agents/cloudbuild.yaml, infra phase B, SC-74), which roles/run.developer already lets it deploy
resource "google_service_account_iam_member" "builder_acts_as" {
  for_each = var.backend_runtime ? merge({
    api      = google_service_account.api[0].name
    migrator = google_service_account.migrator[0].name
  }, var.agents_runtime ? { agents = google_service_account.agents.name } : {}) : {}

  service_account_id = each.value
  role               = "roles/iam.serviceAccountUser"
  member             = google_service_account.builder[0].member
}

resource "google_service_account" "github_backend" {
  count = local.runtime

  account_id   = "github-backend"
  display_name = "GitHub Actions backend builds"
  description  = "Starts backend-api's Cloud Build from the prod environment of ${var.github_repository}. No key."
}

resource "google_service_account_iam_member" "github_backend_from_github" {
  count = local.runtime

  service_account_id = google_service_account.github_backend[0].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.environment/${local.github_environment}"
}

resource "google_project_iam_member" "github_backend" {
  for_each = var.backend_runtime ? toset([
    "roles/cloudbuild.builds.editor",          # start a build, and follow it
    "roles/serviceusage.serviceUsageConsumer", # gcloud bills its calls to the project
  ]) : toset([])

  project = var.project_id
  role    = each.key
  member  = google_service_account.github_backend[0].member
}

resource "google_service_account_iam_member" "github_backend_acts_as_builder" {
  count = local.runtime

  service_account_id = google_service_account.builder[0].name
  role               = "roles/iam.serviceAccountUser"
  member             = google_service_account.github_backend[0].member
}

resource "google_storage_bucket_iam_member" "github_backend" {
  for_each = var.backend_runtime ? toset([
    "roles/storage.objectAdmin",        # stage the source
    "roles/storage.legacyBucketReader", # find the bucket, and list what is staged
  ]) : toset([])

  bucket = google_storage_bucket.builds[0].name
  role   = each.key
  member = google_service_account.github_backend[0].member
}

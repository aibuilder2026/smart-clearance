# backend-api's identities. No key exists for any of them.
# - sc-api-local is what a developer's local backend runs as: the backend impersonates it in code (SC_IMPERSONATE_SA),
#   from the developer's own credentials, so a laptop has the cloud service's least privilege and no more.
# - The Cloud Run identities (sc-api, sc-migrator) are in run.tf, behind backend_runtime.
# - Firebase user management goes through a custom role. roles/firebaseauth.admin would also let the backend change the
#   auth config and read its password-hash parameters.

resource "google_project_iam_custom_role" "auth_users" {
  role_id     = "scAuthUsers"
  title       = "Smart-Clearance: Firebase Auth users"
  description = "Create, read, update and delete Firebase Auth users, and nothing else (backend-api)."
  permissions = [
    "firebaseauth.users.create",
    "firebaseauth.users.delete",
    "firebaseauth.users.get",
    "firebaseauth.users.update",
  ]
}

resource "google_service_account" "api_local" {
  account_id   = "sc-api-local"
  display_name = "backend-api (local)"
  description  = "What a developer's local backend-api runs as, by impersonation. No key."

  depends_on = [google_project_service.this]
}

resource "google_project_iam_member" "api_local_auth" {
  project = var.project_id
  role    = google_project_iam_custom_role.auth_users.id
  member  = google_service_account.api_local.member
}

# A local backend may send its spans to Cloud Trace too (TRACE_EXPORT=otlp, SC-57), as the cloud service does.
resource "google_project_iam_member" "api_local_traces" {
  project = var.project_id
  role    = "roles/telemetry.tracesWriter"
  member  = google_service_account.api_local.member
}

resource "google_secret_manager_secret_iam_member" "api_local" {
  for_each = { for id, s in local.secrets : id => s if contains(s.readers, "local") }

  secret_id = google_secret_manager_secret.this[each.key].id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.api_local.member
}

# The operators may act as sc-api-local, which is how backend-api/scripts/dev.sh runs the backend.
resource "google_service_account_iam_member" "api_local_operators" {
  for_each = toset(var.operators)

  service_account_id = google_service_account.api_local.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = each.key
}

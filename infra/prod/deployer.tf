# GitHub Actions deploys as a service account it reaches through Workload Identity Federation, so no key exists.
# - The pool's provider accepts only this repository's jobs, pinned by its numeric ids. Those survive a rename, and a
#   new repository that takes the old name cannot claim them.
# - Only jobs running in the repository's prod environment may act as the deployer, and only main may deploy to
#   that environment (github.tf).

data "github_repository" "this" {
  full_name = var.github_repository
}

data "github_organization" "this" {
  name         = local.github_owner
  summary_only = true
}

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"
  description               = "Jobs from ${var.github_repository}"

  depends_on = [google_project_service.this]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions"
  display_name                       = "GitHub Actions OIDC"

  attribute_mapping = {
    "google.subject"                = "assertion.sub"
    "attribute.repository"          = "assertion.repository"
    "attribute.repository_id"       = "assertion.repository_id"
    "attribute.repository_owner_id" = "assertion.repository_owner_id"
    "attribute.environment"         = "assertion.environment"
    "attribute.ref"                 = "assertion.ref"
  }
  attribute_condition = join(" && ", [
    "assertion.repository_id == '${data.github_repository.this.repo_id}'",
    "assertion.repository_owner_id == '${data.github_organization.this.id}'",
  ])

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "deployer" {
  account_id   = "github-deployer"
  display_name = "GitHub Actions deployer"
  description  = "Releases the frontend to Firebase Hosting from the prod environment of ${var.github_repository}."

  depends_on = [google_project_service.this]
}

# What `firebase deploy --only hosting` checks and calls, and no more.
resource "google_project_iam_member" "deployer" {
  for_each = toset([
    "roles/firebasehosting.admin",             # firebase.projects.get, and the sites' versions and releases
    "roles/serviceusage.serviceUsageConsumer", # deploy.sh bills firebase-tools' calls to the project (x-goog-user-project)
  ])

  project = var.project_id
  role    = each.key
  member  = google_service_account.deployer.member
}

resource "google_service_account_iam_member" "deployer_from_github" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.environment/${local.github_environment}"
}

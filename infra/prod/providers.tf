# user_project_override sends each call on the project's own quota. Firebase's APIs need that when Terraform runs as
# a person (application-default credentials or a gcloud token) rather than as a service account.

provider "google" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}

provider "google-beta" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}

# Signs in with GITHUB_TOKEN, which infra/scripts sets from `gh auth token` (the repo scope is enough).
provider "github" {
  owner = local.github_owner
}

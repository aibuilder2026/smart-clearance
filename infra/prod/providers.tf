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

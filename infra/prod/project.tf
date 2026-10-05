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
  services = toset([
    "firebase.googleapis.com",        # Firebase Management: adding Firebase to the project
    "firebasehosting.googleapis.com", # Hosting sites, versions and releases
    "iam.googleapis.com",             # the Workload Identity pool and the deployer service account
    "iamcredentials.googleapis.com",  # GitHub's jobs acting as the deployer
    "sts.googleapis.com",             # exchanging GitHub's OIDC token for a Google one
  ])
}

resource "google_project_service" "this" {
  for_each = local.services

  service            = each.key
  disable_on_destroy = false

  depends_on = [google_billing_project_info.this]
}

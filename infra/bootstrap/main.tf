# What Terraform itself needs before anything else: a bucket for its state, and the APIs the provider calls on
# the project's quota (user_project_override) when it runs as a person rather than a service account.

provider "google" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}

locals {
  services = toset([
    "cloudbilling.googleapis.com",         # the billing link, in infra/prod
    "cloudresourcemanager.googleapis.com", # project lookups
    "serviceusage.googleapis.com",         # enabling every other API
    "storage.googleapis.com",              # the state bucket
  ])
}

resource "google_project_service" "this" {
  for_each = local.services

  service            = each.key
  disable_on_destroy = false
}

resource "google_storage_bucket" "state" {
  name     = "${var.project_id}-tfstate"
  location = var.region

  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  # Kept in state: a destroy or a replacement of this bucket fails until this is changed and applied.
  deletion_policy = "PREVENT"

  versioning {
    enabled = true
  }

  # Every state write leaves a noncurrent version. Keep the last 20 of each file, and none for longer than 90 days.
  lifecycle_rule {
    condition {
      num_newer_versions = 20
      with_state         = "ARCHIVED"
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      days_since_noncurrent_time = 90
      with_state                 = "ARCHIVED"
    }
    action {
      type = "Delete"
    }
  }

  depends_on = [google_project_service.this]
}

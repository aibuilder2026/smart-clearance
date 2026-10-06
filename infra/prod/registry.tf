# Where backend-api's images go once it runs in the cloud. Behind backend_runtime, like everything that costs money.

resource "google_artifact_registry_repository" "sc" {
  count = var.backend_runtime ? 1 : 0

  repository_id = "sc"
  location      = var.region
  format        = "DOCKER"
  description   = "Smart-Clearance service images (backend-api)."
  labels        = { app = "smart-clearance" }

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }
  cleanup_policies {
    id     = "drop-old"
    action = "DELETE"
    condition {
      older_than = "2592000s" # 30 days, for anything the rule above doesn't keep
    }
  }

  depends_on = [google_project_service.this]
}

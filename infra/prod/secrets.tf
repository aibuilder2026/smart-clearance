# The secrets backend-api needs, as Secret Manager containers only. Terraform never holds a value: each version is added
# by backend-api/scripts/secrets.sh, generated on the spot and piped to gcloud on stdin, so no value reaches state, a
# file, a command line or git. Kept in the project's region.

locals {
  secrets = {
    "sc-default-user-password" = {
      description = "The password every user is onboarded with; no email is ever sent (backend-api)."
      readers     = ["local", "runtime"]
    }
    "sc-local-db-app-password" = {
      description = "The local Postgres login sc_app (backend-api/scripts/db-init.sh)."
      readers     = ["local"]
    }
    "sc-local-db-migrator-password" = {
      description = "The local Postgres login sc_migrator (backend-api/scripts/db-init.sh)."
      readers     = ["local"]
    }
  }
}

resource "google_secret_manager_secret" "this" {
  for_each = local.secrets

  secret_id = each.key
  labels    = { app = "smart-clearance" }
  annotations = {
    description = each.value.description
  }

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  # A destroy, or a change that would replace one, fails until this is changed and applied.
  deletion_protection = true

  depends_on = [google_project_service.this]
}

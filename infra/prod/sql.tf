# The platform's one database, Cloud SQL for PostgreSQL, behind backend_runtime (it costs money; written, not applied).
# - Smallest tier: Enterprise edition, shared core, zonal. PostgreSQL 16 and later default to Enterprise Plus, which has
#   no shared-core tiers, so the edition is set.
# - No passwords: IAM database authentication only, and only through a Cloud SQL connector (the Python connector, or
#   the Auth Proxy for a person), over TLS. No network is authorised.
# - sc-migrator holds cloudsqlsuperuser, to create the schema's roles and run migrations; sc-api gets sc_app's
#   privileges from the migrate job (backend-api's db-init), never from Terraform.

locals {
  runtime = var.backend_runtime ? 1 : 0
  db_name = "smart_clearance"
}

resource "google_sql_database_instance" "main" {
  count = local.runtime

  name             = "sc-main"
  database_version = var.db_version
  region           = var.region

  # Kept in state: a destroy, or a change that would replace the instance, fails until this is changed and applied.
  deletion_protection = true

  settings {
    edition                     = "ENTERPRISE"
    tier                        = var.db_tier
    availability_type           = "ZONAL"
    disk_type                   = "PD_SSD"
    disk_size                   = 10
    disk_autoresize             = true
    deletion_protection_enabled = true
    connector_enforcement       = "REQUIRED"
    user_labels                 = { app = "smart-clearance" }

    ip_configuration {
      ipv4_enabled = true # reached only through connectors, which authenticate with IAM; no authorised networks
      ssl_mode     = "ENCRYPTED_ONLY"
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "20:30" # UTC: 02:00 in India
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
      }
    }

    maintenance_window {
      day  = 7  # Sunday
      hour = 21 # UTC: 02:30 on Monday in India
    }

    insights_config {
      query_insights_enabled = true
    }
  }

  depends_on = [google_project_service.this]
}

resource "google_sql_database" "main" {
  count = local.runtime

  name     = local.db_name
  instance = google_sql_database_instance.main[0].name
}

# IAM users are named by their service account's email without ".gserviceaccount.com".
resource "google_sql_user" "migrator" {
  count = local.runtime

  name           = trimsuffix(google_service_account.migrator[0].email, ".gserviceaccount.com")
  instance       = google_sql_database_instance.main[0].name
  type           = "CLOUD_IAM_SERVICE_ACCOUNT"
  database_roles = ["cloudsqlsuperuser"]
}

resource "google_sql_user" "api" {
  count = local.runtime

  name     = trimsuffix(google_service_account.api[0].email, ".gserviceaccount.com")
  instance = google_sql_database_instance.main[0].name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}

# backend-api on Cloud Run, behind backend_runtime (it costs money; written, not applied).
# - sc-api serves the API. It reaches Cloud SQL as its own IAM user, manages Firebase users through the custom role in
#   backend.tf, and reads only the default-password secret.
# - sc-migrator runs the migrate job: the schema's roles and grants, Alembic, and the reference data.
# - Ingress is public and Cloud Run's own IAM check is off: the API checks Firebase ID tokens itself, and its public
#   routes (the landing page's) need no token.
# - The hydrate job builds the synthetic world through the services, as sc-api (the maintainer's call for prod, SC-50).
# - Terraform creates them on var.backend_image (a placeholder); Cloud Build deploys every image after that
#   (backend-api/cloudbuild.yaml), so each one ignores its image here.

locals {
  api_origins = distinct(flatten([
    for site in var.hosting_sites : concat(
      ["https://${site.site_id}.web.app", "https://${site.site_id}.firebaseapp.com"],
      site.custom_domain == null ? [] : ["https://${site.custom_domain}"],
    )
  ]))
  default_password_secret = "${google_secret_manager_secret.this["sc-default-user-password"].id}/versions/latest"
  # what the API and the hydrate job both need: the project, the database as sc-api, and the default password
  api_env = var.backend_runtime ? {
    SC_ENV                  = "prod"
    GOOGLE_CLOUD_PROJECT    = var.project_id
    DB_MODE                 = "cloudsql"
    DB_INSTANCE             = google_sql_database_instance.main[0].connection_name
    DB_NAME                 = local.db_name
    DB_USER                 = google_sql_user.api[0].name
    STAFF_EMAIL_DOMAIN      = var.staff_email_domain
    DEFAULT_PASSWORD_SECRET = local.default_password_secret
    LOG_FORMAT              = "json" # one JSON object a line, so Cloud Logging reads each line's severity
  } : {}
}

resource "google_service_account" "api" {
  count = local.runtime

  account_id   = "sc-api"
  display_name = "backend-api (Cloud Run)"
  description  = "What backend-api runs as on Cloud Run. No key."
}

resource "google_service_account" "migrator" {
  count = local.runtime

  account_id   = "sc-migrator"
  display_name = "backend-api migrations (Cloud Run job)"
  description  = "Runs backend-api's schema setup and migrations. No key."
}

resource "google_project_iam_member" "api" {
  for_each = var.backend_runtime ? toset([
    google_project_iam_custom_role.auth_users.id, # Firebase users
    "roles/cloudsql.client",                      # connect through the connector
    "roles/cloudsql.instanceUser",                # sign in to Postgres as its IAM user
  ]) : toset([])

  project = var.project_id
  role    = each.key
  member  = google_service_account.api[0].member
}

resource "google_project_iam_member" "migrator" {
  for_each = var.backend_runtime ? toset(["roles/cloudsql.client", "roles/cloudsql.instanceUser"]) : toset([])

  project = var.project_id
  role    = each.key
  member  = google_service_account.migrator[0].member
}

resource "google_secret_manager_secret_iam_member" "api" {
  for_each = var.backend_runtime ? { for id, s in local.secrets : id => s if contains(s.readers, "runtime") } : {}

  secret_id = google_secret_manager_secret.this[each.key].id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.api[0].member
}

resource "google_cloud_run_v2_service" "api" {
  count = local.runtime

  name                 = "backend-api"
  location             = var.region
  ingress              = "INGRESS_TRAFFIC_ALL"
  invoker_iam_disabled = true
  deletion_protection  = true
  labels               = { app = "smart-clearance" }

  template {
    service_account = google_service_account.api[0].email
    timeout         = "60s"

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = var.backend_image

      ports {
        container_port = 8080
      }
      resources {
        limits            = { cpu = "1", memory = "512Mi" }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      dynamic "env" {
        for_each = merge(local.api_env, { CORS_ORIGINS = jsonencode(local.api_origins) })
        content {
          name  = env.key
          value = env.value
        }
      }

      startup_probe {
        http_get {
          path = "/healthz"
        }
      }
      liveness_probe {
        http_get {
          path = "/healthz"
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version]
  }

  depends_on = [google_project_iam_member.api, google_secret_manager_secret_iam_member.api]
}

resource "google_cloud_run_v2_job" "migrate" {
  count = local.runtime

  name                = "backend-api-migrate"
  location            = var.region
  deletion_protection = true
  labels              = { app = "smart-clearance" }

  template {
    task_count = 1

    template {
      service_account = google_service_account.migrator[0].email
      max_retries     = 0
      timeout         = "600s"

      containers {
        image   = var.backend_image
        command = ["sc-admin", "migrate"]

        dynamic "env" {
          for_each = {
            SC_ENV               = "prod"
            GOOGLE_CLOUD_PROJECT = var.project_id
            DB_MODE              = "cloudsql"
            DB_INSTANCE          = google_sql_database_instance.main[0].connection_name
            DB_NAME              = local.db_name
            DB_USER              = google_sql_user.migrator[0].name
            DB_APP_USER          = google_sql_user.api[0].name
            LOG_FORMAT           = "json"
          }
          content {
            name  = env.key
            value = env.value
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].template[0].containers[0].image, client, client_version]
  }

  depends_on = [google_project_iam_member.migrator]
}

# The synthetic world (backend-api/src/sc_api/cli/synth.py), built through the services as sc-api: run once after the
# first migrate, and again with --tick to move some batches on (gcloud run jobs execute backend-api-hydrate).
resource "google_cloud_run_v2_job" "hydrate" {
  count = local.runtime

  name                = "backend-api-hydrate"
  location            = var.region
  deletion_protection = true
  labels              = { app = "smart-clearance" }

  template {
    task_count = 1

    template {
      service_account = google_service_account.api[0].email
      max_retries     = 0
      timeout         = "1800s"

      containers {
        image   = var.backend_image
        command = ["sc-hydrate"]
        args    = ["--allow-env", "prod"]

        resources {
          limits = { cpu = "1", memory = "1Gi" }
        }

        dynamic "env" {
          for_each = local.api_env
          content {
            name  = env.key
            value = env.value
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].template[0].containers[0].image, client, client_version]
  }

  depends_on = [google_project_iam_member.api, google_secret_manager_secret_iam_member.api]
}

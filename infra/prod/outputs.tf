output "project_id" {
  description = "The GCP and Firebase project."
  value       = var.project_id
}

locals {
  hosting_sites = {
    for target, site in google_firebase_hosting_site.this : target => {
      site_id = site.site_id
      url     = site.default_url
    }
  }
}

output "hosting_sites" {
  description = "Each app's Hosting site, keyed by its frontend/firebase.json target. infra/scripts/deploy.sh reads this (in CI, from the HOSTING_SITES variable)."
  value       = local.hosting_sites
}

output "github_deployer" {
  description = "What the deploy job signs in with; also set as variables on the GitHub environment."
  value = {
    workload_identity_provider = google_iam_workload_identity_pool_provider.github.name
    service_account            = google_service_account.deployer.email
    environment                = github_repository_environment.prod.environment
  }
}

output "custom_domain_dns" {
  description = "For each custom domain, the DNS records Firebase Hosting wants, to add at the registrar."
  value = {
    for target, domain in google_firebase_hosting_custom_domain.this : domain.custom_domain => flatten([
      for update in domain.required_dns_updates : [
        for desired in update.desired : [
          for record in desired.records : {
            name   = record.domain_name
            type   = record.type
            value  = record.rdata
            action = record.required_action
          }
        ]
      ]
    ])
  }
}

output "console_firebase_config" {
  description = "The console's Firebase web config. Public by design (it ships in the console's JavaScript), never committed: backend-api/scripts/console-env.sh writes it into the console's git-ignored .env.local."
  value = {
    apiKey     = data.google_firebase_web_app_config.console.api_key
    authDomain = data.google_firebase_web_app_config.console.auth_domain
    projectId  = var.project_id
    appId      = google_firebase_web_app.console.app_id
  }
}

output "backend" {
  description = "What backend-api's scripts read: its identity, its secrets (names only), and the runtime when it is on."
  value = {
    project_id         = var.project_id
    region             = var.region
    local_identity     = google_service_account.api_local.email
    staff_email_domain = var.staff_email_domain
    secrets            = { for id, s in google_secret_manager_secret.this : id => s.id }
    runtime            = var.backend_runtime
    api_url            = var.backend_runtime ? google_cloud_run_v2_service.api[0].uri : null
    db_instance        = var.backend_runtime ? google_sql_database_instance.main[0].connection_name : null
    migrate_job        = var.backend_runtime ? google_cloud_run_v2_job.migrate[0].name : null
    image_repository   = var.backend_runtime ? "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.sc[0].repository_id}" : null
  }
}

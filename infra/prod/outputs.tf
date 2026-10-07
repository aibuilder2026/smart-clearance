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
    hydrate_job        = var.backend_runtime ? google_cloud_run_v2_job.hydrate[0].name : null
    image_repository   = var.backend_runtime ? "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.sc[0].repository_id}" : null
    builder            = var.backend_runtime ? google_service_account.builder[0].email : null
    build_bucket       = var.backend_runtime ? google_storage_bucket.builds[0].name : null
  }
}

output "workspace_firebase_config" {
  description = "The workspace app's Firebase web config (SC-66). Public by design, never committed: backend-api/scripts/app-env.sh writes it into the workspace's git-ignored .env.local."
  value = {
    apiKey            = data.google_firebase_web_app_config.workspace.api_key
    authDomain        = data.google_firebase_web_app_config.workspace.auth_domain
    projectId         = var.project_id
    appId             = google_firebase_web_app.workspace.app_id
    messagingSenderId = data.google_firebase_web_app_config.workspace.messaging_sender_id
  }
}

output "journey" {
  description = "What backend-api's and the agents' scripts read for each environment (SC-66): Pub/Sub topics, the pull subscriptions (local) and push subscriptions (prod, with agents_runtime), the BigQuery dataset, the buckets, and the identities."
  value = {
    for env in local.event_envs : env => {
      topics        = { for id, t in local.topics : t.name => google_pubsub_topic.this[id].name if t.env == env }
      subscriptions = { for id, s in local.pull_subscriptions : id => google_pubsub_subscription.pull[id].name if s.env == env }
      pushed        = env == "prod" ? { for id, s in google_pubsub_subscription.push : id => s.push_config[0].push_endpoint } : {}
      dataset       = google_bigquery_dataset.this[env].dataset_id
      buckets       = { for id, b in local.buckets : b.kind => google_storage_bucket.app[id].name if b.env == env }
      agents        = env == "prod" ? google_service_account.agents.email : google_service_account.agents_local.email
      invoker       = google_service_account.invoker.email
    }
  }
}

output "agents" {
  description = "The agents service in prod (infra phase B, SC-74), with agents_runtime on: its address (internal only, so only Pub/Sub's pushes reach it), its identity, its models, and the Scheduler jobs."
  value = {
    runtime         = var.agents_runtime
    url             = var.agents_runtime ? google_cloud_run_v2_service.agents[0].uri : null
    service         = var.agents_runtime ? google_cloud_run_v2_service.agents[0].name : null
    service_account = google_service_account.agents.email
    invoker         = google_service_account.invoker.email
    models          = { pro = var.model_pro, flash = var.model_flash, location = var.genai_location }
    scheduler_jobs  = { for job in concat(google_cloud_scheduler_job.tick, google_cloud_scheduler_job.journey_reset) : job.name => job.paused == true ? "paused" : job.schedule }
  }
}

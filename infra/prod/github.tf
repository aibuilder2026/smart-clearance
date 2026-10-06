# The repository's side of the deploy: the prod environment, which only main may deploy to, the variables its deploy
# jobs read (.github/workflows/ci.yml), and the apps' build settings once backend-api runs in the cloud. None of them is
# a secret: the identity provider and the service accounts are names, GitHub's OIDC token is what proves the job, and
# the console's Firebase config ships in its JavaScript.

locals {
  github_owner       = split("/", var.github_repository)[0]
  github_repo        = split("/", var.github_repository)[1]
  github_environment = "prod"
}

resource "github_repository_environment" "prod" {
  repository  = local.github_repo
  environment = local.github_environment

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "main" {
  repository     = local.github_repo
  environment    = github_repository_environment.prod.environment
  branch_pattern = "main"
}

resource "github_actions_environment_variable" "prod" {
  for_each = merge({
    GCP_WORKLOAD_IDENTITY_PROVIDER = google_iam_workload_identity_pool_provider.github.name
    GCP_SERVICE_ACCOUNT            = google_service_account.deployer.email
    HOSTING_SITES                  = jsonencode(local.hosting_sites)
    }, var.backend_runtime ? {
    # What the backend job starts Cloud Build with (build.tf, backend-api/cloudbuild.yaml)
    GCP_PROJECT_ID              = var.project_id
    GCP_BACKEND_SERVICE_ACCOUNT = google_service_account.github_backend[0].email
    GCP_BUILDER_SERVICE_ACCOUNT = google_service_account.builder[0].id
    GCP_BUILD_BUCKET            = google_storage_bucket.builds[0].name
    GCP_REGION                  = var.region
  } : {})

  repository    = local.github_repo
  environment   = github_repository_environment.prod.environment
  variable_name = each.key
  value         = each.value
}

# Once the runtime is on, both apps' builds talk to backend-api, and the console signs in through Firebase (run.tf,
# auth.tf). Repository variables, not the environment's: the build job runs outside the environment (on pull
# requests too), and none of them is a secret, as each ships in the apps' JavaScript.
resource "github_actions_variable" "app" {
  for_each = var.backend_runtime ? {
    PUBLIC_API_BASE             = google_cloud_run_v2_service.api[0].uri
    PUBLIC_FIREBASE_API_KEY     = data.google_firebase_web_app_config.console.api_key
    PUBLIC_FIREBASE_AUTH_DOMAIN = data.google_firebase_web_app_config.console.auth_domain
    PUBLIC_FIREBASE_PROJECT_ID  = var.project_id
    PUBLIC_FIREBASE_APP_ID      = google_firebase_web_app.console.app_id
  } : {}

  repository    = local.github_repo
  variable_name = each.key
  value         = each.value
}

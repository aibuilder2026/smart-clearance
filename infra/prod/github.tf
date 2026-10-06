# The repository's side of the deploy: the prod environment, which only main may deploy to, and the variables its
# deploy job reads (.github/workflows/ci.yml). None of them is a secret: the identity provider and the service account
# are names, GitHub's OIDC token is what proves the job, and the console's Firebase config ships in its JavaScript.

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
    # The console's build talks to backend-api and signs in through Firebase once the runtime is on (run.tf, auth.tf).
    PUBLIC_API_BASE             = google_cloud_run_v2_service.api[0].uri
    PUBLIC_FIREBASE_API_KEY     = data.google_firebase_web_app_config.console.api_key
    PUBLIC_FIREBASE_AUTH_DOMAIN = data.google_firebase_web_app_config.console.auth_domain
    PUBLIC_FIREBASE_PROJECT_ID  = var.project_id
    PUBLIC_FIREBASE_APP_ID      = google_firebase_web_app.console.app_id
  } : {})

  repository    = local.github_repo
  environment   = github_repository_environment.prod.environment
  variable_name = each.key
  value         = each.value
}

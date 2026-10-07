project_id      = "aibuilder-510213"
region          = "asia-south1"
billing_account = "012B20-D65DBD-FBAC0E"

# Its Actions deploy the frontend, from the prod environment only (deployer.tf, github.tf).
github_repository = "aibuilder2026/smart-clearance"

# Keyed by the targets in frontend/firebase.json. Add custom_domain = "smartclearance.com" (and
# "console.smartclearance.com", "munchly.smartclearance.com") once the domain is registered.
hosting_sites = {
  site = {
    site_id = "smartclearance"
  }
  console = {
    site_id = "smartclearance-console"
  }
  # Munchly Foods' workspace (SC-62); munchly.smartclearance.com once the domain is registered
  workspace = {
    site_id = "munchly-smartclearance"
  }
  # the guided demo (SC-63, SC-64); "demo-" names are reserved by Firebase
  demo = {
    site_id = "smartclearance-demo"
  }
}

# Who may run backend-api locally as its service account, sc-api-local (backend.tf): the account Terraform runs as.
operators = ["user:gilchristfan@gmail.com"]

# backend-api in the cloud (SC-50): Cloud SQL, Cloud Run, Cloud Build, Artifact Registry, monitoring and the budget.
# About GBP 9 a month, nearly all Cloud SQL.
backend_runtime = true
alert_email     = "gilchristfan@gmail.com"

# The journey in prod (infra phase B, SC-74): the agents service, the push subscriptions, Cloud Scheduler, backend-api's
# live-workspace settings and the agents' alerts. GBP 1 to 3 a month with light use, 8 to 15 with heavy use (Gemini
# above all), on top of the GBP 9; so the budget warns at GBP 30.
agents_runtime = true
budget_amount  = 30

# The workspace app runs on backend-api: WORKSPACE_API_BASE for CI's workspace build (SC-75, after the prod hydrate).
workspace_live = true

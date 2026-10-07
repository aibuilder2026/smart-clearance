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
# About GBP 9 a month, nearly all Cloud SQL; the budget warns at GBP 20.
backend_runtime = true
alert_email     = "gilchristfan@gmail.com"

variable "project_id" {
  description = "The GCP project, which Firebase is added to."
  type        = string
}

variable "region" {
  description = "The default region for regional resources."
  type        = string
}

variable "billing_account" {
  description = "The Cloud Billing account the project is linked to, as XXXXXX-XXXXXX-XXXXXX."
  type        = string

  validation {
    condition     = can(regex("^[0-9A-F]{6}-[0-9A-F]{6}-[0-9A-F]{6}$", var.billing_account))
    error_message = "billing_account is the bare id, XXXXXX-XXXXXX-XXXXXX, without billingAccounts/."
  }
}

variable "github_repository" {
  description = "The GitHub repository whose Actions deploy, as owner/name. The owner must be an organization."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$", var.github_repository))
    error_message = "github_repository is owner/name."
  }
}

variable "hosting_sites" {
  description = <<-EOT
    One Firebase Hosting site per app, keyed by the app's target in frontend/firebase.json (site, console, workspace).
    site_id is global across Firebase and becomes <site_id>.web.app. custom_domain is optional; Terraform registers it
    and outputs the DNS records to add at the registrar.
  EOT
  type = map(object({
    site_id       = string
    custom_domain = optional(string)
  }))

  validation {
    condition     = alltrue([for s in values(var.hosting_sites) : can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$", s.site_id))])
    error_message = "Each site_id becomes a domain label: lowercase letters, digits and hyphens, not starting or ending with a hyphen."
  }
}

# --- backend-api (auth.tf, secrets.tf, backend.tf; the runtime in registry.tf, sql.tf, run.tf, budget.tf)

variable "operators" {
  description = "IAM members who may run backend-api locally as sc-api-local (user:… or group:…): the project's developers."
  type        = list(string)

  validation {
    condition     = alltrue([for m in var.operators : can(regex("^(user|group|serviceAccount):[^@\\s]+@[^@\\s]+$", m))])
    error_message = "Each operator is an IAM member: user:name@domain, group:name@domain or serviceAccount:name@domain."
  }
}

variable "console_dev_origins" {
  description = "Local origins the console runs on (its dev and preview servers), allowed to use its browser key."
  type        = list(string)
  default     = ["http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:4176", "http://127.0.0.1:4176"]
}

variable "extra_auth_domains" {
  description = "Domains to authorise for Firebase Auth beyond localhost, the project's own and the Hosting sites'."
  type        = list(string)
  default     = []
}

variable "staff_email_domain" {
  description = "The email domain console staff must use. smartclearance.example until smartclearance.com is owned: a password reset goes to whoever receives the domain's mail."
  type        = string
  default     = "smartclearance.example"
}

variable "backend_runtime" {
  description = "Run backend-api in the cloud: Artifact Registry, Cloud SQL, Cloud Run, Cloud Build, monitoring and a budget alert. These cost money, so off until asked for (SC-50 turned it on)."
  type        = bool
  default     = false
}

variable "backend_image" {
  description = <<-EOT
    The image the API and its jobs are created with. Google's placeholder answers 200 on every path until Cloud Build
    deploys backend-api's own image (backend-api/cloudbuild.yaml); from then on Cloud Build owns the image and Terraform
    leaves it alone (lifecycle.ignore_changes in run.tf).
  EOT
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "alert_email" {
  description = "Where the runtime's alerts and the budget's warnings are emailed (monitoring.tf, budget.tf). Null sends none beyond the billing account's admins."
  type        = string
  default     = null
}

variable "db_version" {
  description = "Cloud SQL's PostgreSQL version; local development runs the same major version in Docker."
  type        = string
  default     = "POSTGRES_18"
}

variable "db_tier" {
  description = "Cloud SQL's machine tier (Enterprise edition): the shared-core db-f1-micro is the smallest."
  type        = string
  default     = "db-f1-micro"
}

variable "budget_amount" {
  description = "The project's monthly budget, in the billing account's currency (GBP), once the runtime is on. The runtime is expected to cost about 9 a month, nearly all Cloud SQL."
  type        = number
  default     = 20
}

variable "trace_sample_rate" {
  description = "The share of backend-api's requests whose spans go to Cloud Trace, beyond those Cloud Run samples itself (at most one every ten seconds an instance), which are always kept (SC-57). Cloud Trace ingests 2.5 million spans a month free, then 0.20 USD a million."
  type        = number
  default     = 0.25

  validation {
    condition     = var.trace_sample_rate >= 0 && var.trace_sample_rate <= 1
    error_message = "trace_sample_rate is a share: between 0 and 1."
  }
}

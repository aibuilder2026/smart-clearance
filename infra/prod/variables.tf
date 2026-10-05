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
    One Firebase Hosting site per app, keyed by the app's target in frontend/firebase.json (site, console).
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

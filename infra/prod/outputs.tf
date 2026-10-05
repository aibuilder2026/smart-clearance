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

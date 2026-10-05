# Firebase on the project, and one Hosting site per frontend app, each deployed on its own.
# Terraform owns the sites; releases (the files) go out with infra/scripts/deploy.sh, through firebase-tools, because the
# Hosting resources in the provider cannot upload files.

resource "google_firebase_project" "this" {
  provider = google-beta
  project  = var.project_id

  depends_on = [google_project_service.this]
}

resource "google_firebase_hosting_site" "this" {
  provider = google-beta
  for_each = var.hosting_sites

  project = google_firebase_project.this.project
  site_id = each.value.site_id

  # A deleted site's id cannot be reused for a while, and its URL goes dark: kept in state, so a destroy fails until
  # this is changed and applied.
  deletion_policy = "PREVENT"
}

resource "google_firebase_hosting_custom_domain" "this" {
  provider = google-beta
  for_each = { for target, site in var.hosting_sites : target => site if site.custom_domain != null }

  project       = google_firebase_project.this.project
  site_id       = google_firebase_hosting_site.this[each.key].site_id
  custom_domain = each.value.custom_domain

  # The records go in at the registrar, outside Terraform; see the custom_domain_dns output.
  wait_dns_verification = false
}

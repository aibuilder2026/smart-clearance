# Cloud Storage (SC-66): three buckets per environment, in the region, private, and emptied after 30 days.
# - photos: the label photos Rakesh takes for the Vision agent. The workspace app uploads straight to the bucket through
#   a signed URL backend-api makes (sc-api signs as itself; no key), so the bucket answers the app's origins (CORS).
# - docs: the PDFs the Paperwork agent renders (invoice, credit note, ITC memo, FSSAI checklist), downloaded through
#   short signed URLs.
# - exports: the distributors' DMS exports as CSV, which the Data agent loads into BigQuery. No real DMS exists yet:
#   backend-api's hydrate and its tick write synthetic ones, and Setup's upload, and the console's first export for a
#   client (SC-84), come in through signed URLs too.
# Each environment's identities reach only its own buckets. A few megabytes: under GBP 0.01 a month.

locals {
  bucket_kinds = ["photos", "docs", "exports"]
  buckets = {
    for pair in setproduct(local.event_envs, local.bucket_kinds) :
    "${pair[0]}.${pair[1]}" => { env = pair[0], kind = pair[1] }
  }

  # the browser origins that upload through signed URLs: the workspace's site, or its local dev and preview servers
  workspace_site = var.hosting_sites["workspace"]
  workspace_origins = concat(
    ["https://${local.workspace_site.site_id}.web.app", "https://${local.workspace_site.site_id}.firebaseapp.com"],
    local.workspace_site.custom_domain == null ? [] : ["https://${local.workspace_site.custom_domain}"],
  )
  upload_origins = {
    prod  = local.workspace_origins
    local = var.workspace_dev_origins
  }
  # staff upload a client's first stock export from the console (SC-84), so the exports buckets answer its origins too
  export_origins = {
    prod  = concat(local.workspace_origins, local.console_origins)
    local = concat(var.workspace_dev_origins, var.console_dev_origins)
  }

  # who may do what with each kind of bucket
  bucket_grants = flatten([
    for id, b in local.buckets : [
      for grant in {
        photos = [
          { who = "api", role = "roles/storage.objectAdmin" },     # sign the upload URL, check the upload, sign a viewing URL
          { who = "agents", role = "roles/storage.objectViewer" }, # Vision reads the photo
        ]
        docs = [
          { who = "agents", role = "roles/storage.objectAdmin" }, # Paperwork writes (and rewrites) the PDFs
          { who = "api", role = "roles/storage.objectViewer" },   # sign a download URL
        ]
        exports = [
          { who = "api", role = "roles/storage.objectCreator" },   # hydrate's and the tick's synthetic exports; Setup's upload URL
          { who = "api", role = "roles/storage.objectViewer" },    # check an upload arrived
          { who = "agents", role = "roles/storage.objectViewer" }, # the Data agent's BigQuery load reads them
        ]
      }[b.kind] : { bucket = id, env = b.env, who = grant.who, role = grant.role }
    ]
  ])
}

resource "google_storage_bucket" "app" {
  for_each = local.buckets

  name                        = "${var.project_id}-sc-${each.value.kind}-${each.value.env}"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = { app = "smart-clearance", env = each.value.env }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  dynamic "cors" {
    for_each = each.value.kind == "docs" ? [] : [1]
    content {
      origin          = each.value.kind == "exports" ? local.export_origins[each.value.env] : local.upload_origins[each.value.env]
      method          = ["PUT", "GET", "HEAD"]
      response_header = ["Content-Type"]
      max_age_seconds = 3600
    }
  }

  depends_on = [google_project_service.this]
}

resource "google_storage_bucket_iam_member" "app" {
  for_each = {
    for g in local.bucket_grants : "${g.bucket} ${g.who} ${g.role}" => g
    if local.env_identities[g.env][g.who] != null
  }

  bucket = google_storage_bucket.app[each.value.bucket].name
  role   = each.value.role
  member = local.env_identities[each.value.env][each.value.who]
}

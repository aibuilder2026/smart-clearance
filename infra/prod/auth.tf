# Firebase Authentication (Identity Platform) for the console, and later the client workspaces: email and password only.
# - Nobody signs themselves up. backend-api creates every account with the Admin SDK, onboarded with the default password
#   (secrets.tf), and no email is ever sent.
# - The password policy and email enumeration protection have no Terraform block; infra/scripts/auth-policy.sh sets both.
# - The console signs in through its own Firebase web app, whose browser key may only call the two auth APIs, and only
#   from the console's origins.

locals {
  # Each Hosting site answers on <site_id>.web.app and <site_id>.firebaseapp.com, as does the project's default app.
  hosting_domains = flatten([
    for site in var.hosting_sites : concat(
      ["${site.site_id}.web.app", "${site.site_id}.firebaseapp.com"],
      site.custom_domain == null ? [] : [site.custom_domain],
    )
  ])
  auth_domains = distinct(concat(
    ["localhost", "${var.project_id}.firebaseapp.com", "${var.project_id}.web.app"],
    local.hosting_domains,
    var.extra_auth_domains,
  ))

  # Where the console runs: its own site (and custom domain), the project's auth handler, and the local dev servers.
  console_site = var.hosting_sites["console"]
  console_origins = concat(
    ["https://${local.console_site.site_id}.web.app", "https://${local.console_site.site_id}.firebaseapp.com"],
    local.console_site.custom_domain == null ? [] : ["https://${local.console_site.custom_domain}"],
  )
  console_referrers = concat(
    [for origin in local.console_origins : "${origin}/*"],
    ["https://${var.project_id}.firebaseapp.com/*"],
    [for origin in var.console_dev_origins : "${origin}/*"],
  )
}

resource "google_identity_platform_config" "this" {
  project = var.project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = true
      password_required = true
    }

    # Off, as Identity Platform reports it; stated so a plan shows no drift. Phone sign-in comes with the workspace app.
    phone_number {
      enabled = false
    }
  }

  client {
    permissions {
      # Accounts are made by backend-api only; the public browser key cannot sign anyone up.
      disabled_user_signup   = true
      disabled_user_deletion = true
    }
  }

  authorized_domains = local.auth_domains

  depends_on = [google_project_service.this, google_firebase_project.this]
}

resource "google_apikeys_key" "console" {
  name         = "console-browser"
  display_name = "Console (browser): Firebase Auth only"
  project      = var.project_id

  restrictions {
    api_targets {
      service = "identitytoolkit.googleapis.com"
    }
    api_targets {
      service = "securetoken.googleapis.com"
    }
    browser_key_restrictions {
      allowed_referrers = local.console_referrers
    }
  }

  depends_on = [google_project_service.this]
}

resource "google_firebase_web_app" "console" {
  provider     = google-beta
  project      = google_firebase_project.this.project
  display_name = "Smart-Clearance console"
  api_key_id   = google_apikeys_key.console.uid
}

# The web app's config is public by design (it ships in the console's JavaScript). It is not a secret, but it is never
# committed either: backend-api/scripts/console-env.sh writes it into the console's git-ignored .env.local.
data "google_firebase_web_app_config" "console" {
  provider   = google-beta
  project    = google_firebase_project.this.project
  web_app_id = google_firebase_web_app.console.app_id
}

# The workspace app (SC-66) signs its members in the same way, through its own Firebase web app, and registers for push
# (FCM): its browser key may call the two auth APIs and the two that FCM's web SDK registers a device through, only from
# the workspace's origins. FCM's default VAPID key is used: a custom key pair can only be made by hand in the Firebase
# console, which this repository's rules forbid.
locals {
  workspace_referrers = concat(
    [for origin in local.workspace_origins : "${origin}/*"],
    ["https://${var.project_id}.firebaseapp.com/*"],
    [for origin in var.workspace_dev_origins : "${origin}/*"],
  )
}

resource "google_apikeys_key" "workspace" {
  name         = "workspace-browser"
  display_name = "Workspace (browser): Firebase Auth and FCM registration only"
  project      = var.project_id

  restrictions {
    api_targets {
      service = "identitytoolkit.googleapis.com"
    }
    api_targets {
      service = "securetoken.googleapis.com"
    }
    api_targets {
      service = "firebaseinstallations.googleapis.com"
    }
    api_targets {
      service = "fcmregistrations.googleapis.com"
    }
    browser_key_restrictions {
      allowed_referrers = local.workspace_referrers
    }
  }

  depends_on = [google_project_service.this]
}

resource "google_firebase_web_app" "workspace" {
  provider     = google-beta
  project      = google_firebase_project.this.project
  display_name = "Smart-Clearance workspace"
  api_key_id   = google_apikeys_key.workspace.uid
}

# Public by design, like the console's: backend-api/scripts/app-env.sh writes it into the workspace's git-ignored
# .env.local, and CI's workspace build reads it from repository variables (github.tf).
data "google_firebase_web_app_config" "workspace" {
  provider   = google-beta
  project    = google_firebase_project.this.project
  web_app_id = google_firebase_web_app.workspace.app_id
}

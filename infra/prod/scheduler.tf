# Cloud Scheduler (infra phase B, SC-74, behind agents_runtime): the journey's clock in prod. Each job POSTs one of
# backend-api's /internal routes with an OIDC token signed as sc-invoker for the API's audience (sc-backend-api), which
# backend-api checks in code (identity.py). Cloud Scheduler's own service agent mints the token (roles/
# cloudscheduler.serviceAgent allows it project-wide). Two jobs, inside the billing account's three free ones.
# - sc-tick, every minute: the daily runs on journey time, the timers that are due, stalled journeys (their event sent
#   again after ten minutes), then the outbox (backend-api/src/sc_api/services/journey/tick.py). The next minute is the
#   retry, so a failed tick is not retried.
# - sc-journey-reset, paused: the story from its start for the workspace's client (reset.py). Resumed, it runs every
#   morning at 07:30 in India, before the Data agent's 08:30; run it once with `gcloud scheduler jobs run`.

resource "google_cloud_scheduler_job" "tick" {
  count = local.agents_run

  name             = "sc-tick"
  description      = "The journey's tick: POST backend-api /internal/jobs/tick every minute (SC-74)."
  region           = var.region
  schedule         = "* * * * *"
  time_zone        = "Asia/Kolkata"
  attempt_deadline = "120s"

  retry_config {
    retry_count = 0
  }

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.api[0].uri}/internal/jobs/tick"

    oidc_token {
      service_account_email = google_service_account.invoker.email
      audience              = local.internal_audience
    }
  }

  depends_on = [google_project_service.this]
}

resource "google_cloud_scheduler_job" "journey_reset" {
  count = local.agents_run

  name             = "sc-journey-reset"
  description      = "${var.workspace_client}'s journey from its start: POST backend-api /internal/jobs/journey-reset. Paused (SC-74)."
  region           = var.region
  schedule         = "30 7 * * *"
  time_zone        = "Asia/Kolkata"
  attempt_deadline = "300s"
  paused           = true

  retry_config {
    retry_count = 0
  }

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.api[0].uri}/internal/jobs/journey-reset"
    body        = base64encode(jsonencode({ client = var.workspace_client }))
    headers     = { "Content-Type" = "application/json" }

    oidc_token {
      service_account_email = google_service_account.invoker.email
      audience              = local.internal_audience
    }
  }

  depends_on = [google_project_service.this]
}

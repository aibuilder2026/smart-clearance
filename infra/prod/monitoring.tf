# Logging and monitoring for backend-api in the cloud (SC-50), behind backend_runtime.
# - Logs: Cloud Run, Cloud SQL and Cloud Build write to Cloud Logging's _Default bucket (30 days, inside the free
#   50 GiB a month). backend-api logs one JSON object a line (LOG_FORMAT=json, run.tf), so each line keeps its
#   severity, and Error Reporting groups its stack traces.
# - An uptime check on /readyz every 5 minutes, from three regions: the API answers and reaches the database. (Cloud Run
#   reserves /healthz on the public address; the container's own probes still use it, inside.)
# - Alerts, emailed to var.alert_email: the API down, server errors, slow responses, errors in the logs, and the
#   database's CPU, memory and disk.
# - A dashboard: requests by status, latency, instances, and the database.
# - With agents_runtime on (infra phase B, SC-74), four more alerts: messages waiting in prod's dead letter, the agents
#   service's server errors, the agents falling back on backend-api's templates (a log-based metric from each run's
#   log line), and FCM refusing the Notifier's pushes (a log-based metric from its warning).
# Google's own metrics, log-based metrics, uptime checks within 1M a month and alerting are free at this size.

locals {
  alerts        = var.backend_runtime && var.alert_email != null ? 1 : 0
  agents_alerts = local.alerts == 1 && var.agents_runtime ? 1 : 0
  channels      = local.alerts == 1 ? [google_monitoring_notification_channel.email[0].id] : []
  api_run       = "resource.type=\"cloud_run_revision\" AND resource.label.service_name=\"backend-api\""
  agents_srv    = "resource.type=\"cloud_run_revision\" AND resource.label.service_name=\"agents\""
  database      = "resource.type=\"cloudsql_database\" AND resource.label.database_id=\"${var.project_id}:sc-main\""
}

resource "google_monitoring_notification_channel" "email" {
  count = local.alerts

  display_name = "Smart-Clearance operator"
  type         = "email"
  labels       = { email_address = var.alert_email }

  depends_on = [google_project_service.this]
}

resource "google_monitoring_uptime_check_config" "api" {
  count = local.runtime

  display_name     = "backend-api /readyz"
  timeout          = "10s"
  period           = "300s"
  selected_regions = ["ASIA_PACIFIC", "EUROPE", "USA_VIRGINIA"]

  http_check {
    path         = "/readyz"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = trimprefix(google_cloud_run_v2_service.api[0].uri, "https://")
    }
  }

  depends_on = [google_project_service.this]
}

resource "google_monitoring_alert_policy" "api_down" {
  count = local.alerts

  display_name          = "backend-api is down"
  combiner              = "OR"
  notification_channels = local.channels

  conditions {
    display_name = "/readyz fails from two or more regions for 10 minutes"
    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND resource.type=\"uptime_url\" AND metric.label.check_id=\"${google_monitoring_uptime_check_config.api[0].uptime_check_id}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "600s"
      aggregations {
        alignment_period     = "1200s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.label.*"]
      }
      trigger {
        count = 1
      }
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "The API's readiness check (it reaches the database) is failing. Look at the backend-api service's logs in Cloud Run, its latest revision, and Cloud SQL sc-main."
  }
}

resource "google_monitoring_alert_policy" "api_errors" {
  count = local.alerts

  display_name          = "backend-api answers with server errors"
  combiner              = "OR"
  notification_channels = local.channels

  conditions {
    display_name = "More than 5 responses of 5xx in 5 minutes"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_count\" AND ${local.api_run} AND metric.label.response_code_class=\"5xx\""
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      duration        = "0s"
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "backend-api is answering with 5xx. Its errors, with their stack traces, are in Error Reporting and in the service's logs."
  }
}

resource "google_monitoring_alert_policy" "api_slow" {
  count = local.alerts

  display_name          = "backend-api is slow"
  combiner              = "OR"
  notification_channels = local.channels

  conditions {
    display_name = "95th percentile latency over 5 s for 15 minutes"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_latencies\" AND ${local.api_run}"
      comparison      = "COMPARISON_GT"
      threshold_value = 5000
      duration        = "900s"
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_MAX"
      }
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "Requests are slow for a sustained period, beyond a cold start (the service scales to zero, so one slow request after a quiet spell is expected). Check the database's CPU and the service's logs."
  }
}

resource "google_monitoring_alert_policy" "api_logged_errors" {
  count = local.alerts

  display_name          = "backend-api logs an error"
  combiner              = "OR"
  notification_channels = local.channels

  conditions {
    display_name = "A line at ERROR or above from the API or its jobs"
    condition_matched_log {
      filter = join(" ", [
        "severity>=ERROR AND (",
        "(resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"backend-api\")",
        "OR (resource.type=\"cloud_run_job\" AND resource.labels.job_name:\"backend-api\")",
        ")",
      ])
    }
  }

  alert_strategy {
    notification_rate_limit {
      period = "3600s" # one email an hour at most
    }
    auto_close = "1800s"
  }

  documentation {
    mime_type = "text/markdown"
    content   = "backend-api, its migrate job or its hydrate job logged an error. Open Logs Explorer from this incident."
  }
}

resource "google_monitoring_alert_policy" "database" {
  for_each = local.alerts == 1 ? {
    cpu    = { metric = "cpu/utilization", over = 0.8, for = "900s", what = "CPU over 80% for 15 minutes" }
    memory = { metric = "memory/utilization", over = 0.9, for = "900s", what = "memory over 90% for 15 minutes" }
    disk   = { metric = "disk/utilization", over = 0.8, for = "1800s", what = "disk over 80% for 30 minutes" }
  } : {}

  display_name          = "Cloud SQL sc-main: ${each.value.what}"
  combiner              = "OR"
  notification_channels = local.channels

  conditions {
    display_name = each.value.what
    condition_threshold {
      filter          = "metric.type=\"cloudsql.googleapis.com/database/${each.value.metric}\" AND ${local.database}"
      comparison      = "COMPARISON_GT"
      threshold_value = each.value.over
      duration        = each.value.for
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "The database (db-f1-micro, a shared core and 0.6 GB of memory) is near a limit. Query Insights shows what it is busy with; the disk grows on its own."
  }
}

resource "google_monitoring_dashboard" "backend" {
  count = local.runtime

  dashboard_json = jsonencode({
    displayName = "Smart-Clearance backend-api"
    mosaicLayout = {
      columns = 12
      tiles = [for i, t in [
        { title = "Requests by status class", filter = "metric.type=\"run.googleapis.com/request_count\" AND ${local.api_run}", aligner = "ALIGN_RATE", reducer = "REDUCE_SUM", by = ["metric.label.response_code_class"] },
        { title = "Latency, 95th percentile (ms)", filter = "metric.type=\"run.googleapis.com/request_latencies\" AND ${local.api_run}", aligner = "ALIGN_PERCENTILE_95", reducer = "REDUCE_MAX", by = [] },
        { title = "Instances", filter = "metric.type=\"run.googleapis.com/container/instance_count\" AND ${local.api_run}", aligner = "ALIGN_MAX", reducer = "REDUCE_SUM", by = ["metric.label.state"] },
        { title = "Container CPU", filter = "metric.type=\"run.googleapis.com/container/cpu/utilizations\" AND ${local.api_run}", aligner = "ALIGN_PERCENTILE_95", reducer = "REDUCE_MAX", by = [] },
        { title = "Database CPU", filter = "metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\" AND ${local.database}", aligner = "ALIGN_MEAN", reducer = "REDUCE_NONE", by = [] },
        { title = "Database memory", filter = "metric.type=\"cloudsql.googleapis.com/database/memory/utilization\" AND ${local.database}", aligner = "ALIGN_MEAN", reducer = "REDUCE_NONE", by = [] },
        { title = "Database connections", filter = "metric.type=\"cloudsql.googleapis.com/database/postgresql/num_backends\" AND ${local.database}", aligner = "ALIGN_MEAN", reducer = "REDUCE_SUM", by = [] },
        { title = "Database disk", filter = "metric.type=\"cloudsql.googleapis.com/database/disk/utilization\" AND ${local.database}", aligner = "ALIGN_MEAN", reducer = "REDUCE_NONE", by = [] },
        # as Cloud Monitoring stores it (zero positions left out, the axis named), so a plan shows no drift
        ] : merge(i % 2 == 0 ? {} : { xPos = 6 }, i < 2 ? {} : { yPos = floor(i / 2) * 4 }, {
          width                            = 6
          height                           = 4
          widget = {
            title = t.title
            xyChart = {
              dataSets = [{
                plotType   = "LINE"
                targetAxis = "Y1"
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = t.filter
                    aggregation = merge(
                      { alignmentPeriod = "60s", perSeriesAligner = t.aligner },
                      t.reducer == "REDUCE_NONE" ? {} : { crossSeriesReducer = t.reducer },
                      length(t.by) > 0 ? { groupByFields = t.by } : {},
                    )
                  }
                }
              }]
            }
          }
      })]
    }
  })

  depends_on = [google_project_service.this]
}

# --- the journey in prod (infra phase B, SC-74) -----------------------------------------------------------------------

# Each agent's run on an event writes one line (agents/src/sc_agents/dispatch.py, record()):
#   run <run id>: <agent> on <event> <batch or client>, <status>[ (<note>)]
# with status done, noop, failed or fallback (a writer's words were left out, so backend-api's template stood in).
# Regular expressions here use [^ ] and [(] rather than backslashes, which the logging query language would escape.
resource "google_logging_metric" "agent_runs" {
  count = local.agents_run

  name        = "sc_agents_runs"
  description = "The agents' runs by agent and status (done, noop, failed or fallback), from each run's log line in the agents service (dispatch.py, record())."
  filter = join(" AND ", [
    "resource.type=\"cloud_run_revision\"",
    "resource.labels.service_name=\"agents\"",
    "jsonPayload.logger=\"sc_agents.dispatch\"",
    "jsonPayload.message=~\"^run [^ ]+: [^ ]+ on \"",
  ])

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"

    labels {
      key         = "status"
      value_type  = "STRING"
      description = "done, noop, failed or fallback"
    }
    labels {
      key         = "agent"
      value_type  = "STRING"
      description = "The agent, as BigQuery's agent_runs names it"
    }
  }

  label_extractors = {
    status = "REGEXP_EXTRACT(jsonPayload.message, \", (done|noop|failed|fallback)(?:$| [(])\")"
    agent  = "REGEXP_EXTRACT(jsonPayload.message, \"^run [^ ]+: ([^ ]+) on \")"
  }
}

# The Notifier's warning when FCM refuses a notification's push for a reason other than the device being gone
# (backend-api/src/sc_api/services/journey/notifier.py): one line a notification. The inbox row is already written,
# so the member still reads it in the app.
resource "google_logging_metric" "push_failures" {
  count = local.agents_run

  name        = "sc_fcm_push_failures"
  description = "Notifications whose push FCM refused, for a reason other than the device being gone, from backend-api's Notifier (notifier.py)."
  filter = join(" AND ", [
    "resource.type=\"cloud_run_revision\"",
    "resource.labels.service_name=\"backend-api\"",
    "jsonPayload.logger=\"sc_api.notifier\"",
    "jsonPayload.message=~\"^notification [0-9]+: FCM refused \"",
  ])

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}

resource "google_monitoring_alert_policy" "dead_letters" {
  count = local.agents_alerts

  display_name          = "Prod events are waiting in the dead letter"
  combiner              = "OR"
  notification_channels = local.channels

  conditions {
    display_name = "prod.dead-letter.hold holds an undelivered message"
    condition_threshold {
      filter          = "metric.type=\"pubsub.googleapis.com/subscription/num_undelivered_messages\" AND resource.type=\"pubsub_subscription\" AND resource.label.subscription_id=\"${google_pubsub_subscription.dead_letter_hold["prod"].name}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      duration        = "0s"
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MAX"
      }
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "A prod event failed five deliveries to the agents or the Notifier and went to `prod.dead-letter`. Read it with `gcloud pubsub subscriptions pull prod.dead-letter.hold --limit=10` (add `--auto-ack` once it is handled; the hold keeps a week), and look at the agents service's or backend-api's logs at that time. The tick sends a journey stalled for ten minutes its event again, so the journey itself goes on."
  }
}

resource "google_monitoring_alert_policy" "agents_errors" {
  count = local.agents_alerts

  display_name          = "The agents service answers with server errors"
  combiner              = "OR"
  notification_channels = local.channels

  conditions {
    display_name = "More than 5 responses of 5xx in 5 minutes"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_count\" AND ${local.agents_srv} AND metric.label.response_code_class=\"5xx\""
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      duration        = "0s"
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "A 503 is how the agents ask Pub/Sub for another delivery (backend-api or a Google service did not answer); a run of them, or any 500, means the agents keep failing. Look at the agents service's logs in Cloud Run, its latest revision (its startup probe, /readyz, checks both models resolve on Vertex AI), and backend-api."
  }
}

resource "google_monitoring_alert_policy" "agents_fallbacks" {
  count = local.agents_alerts

  display_name          = "The agents fall back on backend-api's templates"
  combiner              = "OR"
  notification_channels = local.channels

  conditions {
    display_name = "Over 25% of the agents' runs in an hour fell back"
    condition_threshold {
      filter             = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.agent_runs[0].name}\" AND resource.type=\"cloud_run_revision\" AND metric.label.status=\"fallback\""
      denominator_filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.agent_runs[0].name}\" AND resource.type=\"cloud_run_revision\" AND metric.label.status=one_of(\"done\", \"fallback\", \"failed\")"
      comparison         = "COMPARISON_GT"
      threshold_value    = 0.25
      duration           = "0s"
      aggregations {
        alignment_period     = "3600s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_SUM"
      }
      denominator_aggregations {
        alignment_period     = "3600s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "The model calls are failing, timing out (20 s) or writing words that fail their checks, so backend-api's templates stand in: the journey goes on, in plainer words. Each run's note says why (`run …: <agent> … fallback (<why>)` in the agents service's logs; BigQuery's `smartclearance.agent_runs` has the model and latency). Check the models still resolve on Vertex AI (MODEL_PRO, MODEL_FLASH)."
  }
}

resource "google_monitoring_alert_policy" "push_failures" {
  count = local.agents_alerts

  display_name          = "FCM refuses the workspace's pushes"
  combiner              = "OR"
  notification_channels = local.channels

  conditions {
    display_name = "FCM refused a push in the last 10 minutes"
    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.push_failures[0].name}\" AND resource.type=\"cloud_run_revision\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      duration        = "0s"
      aggregations {
        alignment_period     = "600s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "FCM refused a notification's push for a reason other than the device being gone (those devices are dropped). The Notifier's warning in backend-api's logs names FCM's error: PERMISSION_DENIED or UNAUTHENTICATED points at sc-api's scMessagingSend role or the web push setup, RESOURCE_EXHAUSTED, UNAVAILABLE or INTERNAL at FCM itself. The member still reads the notification in the app's inbox."
  }
}

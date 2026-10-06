# Logging and monitoring for backend-api in the cloud (SC-50), behind backend_runtime.
# - Logs: Cloud Run, Cloud SQL and Cloud Build write to Cloud Logging's _Default bucket (30 days, inside the free
#   50 GiB a month). backend-api logs one JSON object a line (LOG_FORMAT=json, run.tf), so each line keeps its
#   severity, and Error Reporting groups its stack traces.
# - An uptime check on /readyz every 5 minutes, from three regions: the API answers and reaches the database. (Cloud Run
#   reserves /healthz on the public address; the container's own probes still use it, inside.)
# - Alerts, emailed to var.alert_email: the API down, server errors, slow responses, errors in the logs, and the
#   database's CPU, memory and disk.
# - A dashboard: requests by status, latency, instances, and the database.
# Google's own metrics, uptime checks within 1M a month and alerting are free at this size.

locals {
  alerts   = var.backend_runtime && var.alert_email != null ? 1 : 0
  channels = local.alerts == 1 ? [google_monitoring_notification_channel.email[0].id] : []
  api_run  = "resource.type=\"cloud_run_revision\" AND resource.label.service_name=\"backend-api\""
  database = "resource.type=\"cloudsql_database\" AND resource.label.database_id=\"${var.project_id}:sc-main\""
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

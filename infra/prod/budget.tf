# A monthly budget on the project, with alerts to the billing account's admins and the operator's email, once the
# backend's runtime costs money. The amount is in the billing account's own currency (GBP).

resource "google_billing_budget" "project" {
  count = local.runtime

  billing_account = var.billing_account
  display_name    = "${var.project_id} monthly"

  budget_filter {
    projects = ["projects/${data.google_project.this.number}"]
  }

  amount {
    specified_amount {
      units = tostring(var.budget_amount)
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 0.9
  }
  threshold_rules {
    threshold_percent = 1.0
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "FORECASTED_SPEND"
  }

  # and to the operator's email (monitoring.tf), as well as the billing account's admins
  dynamic "all_updates_rule" {
    for_each = local.alerts == 1 ? [1] : []
    content {
      monitoring_notification_channels = local.channels
      disable_default_iam_recipients   = false
    }
  }

  depends_on = [google_project_service.this]
}

data "google_project" "this" {
  project_id = var.project_id
}

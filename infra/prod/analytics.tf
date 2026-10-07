# BigQuery (SC-66): the history the agents analyse, one dataset per environment. Postgres stays the record the apps
# read and write; nothing here is personal (sales are by pincode, shops are fictional, no names, emails or phones).
# - The Data agent loads the distributors' DMS exports from the exports bucket (storage.tf): secondary sales, stock,
#   shelf counts and 90 days of channel prices. The Watcher reads sell-through, the Valuer recent prices, Outreach the
#   pincodes that sell an SKU and the day-7 shelf counts.
# - The Impact agent appends each cleared batch's exits to the impact ledger; every agent logs its runs; eval.sh writes
#   each eval case's score.
# - Schemas live beside this file, in bigquery/. Every table is partitioned by its date and clustered for the agents'
#   queries. The prod tables cannot be deleted by Terraform.
# Free at this size: 10 GiB of storage and 1 TiB of queries a month, and batch loads cost nothing.

locals {
  datasets = {
    prod  = "smartclearance"
    local = "smartclearance_local"
  }
  bq_tables = {
    secondary_sales = { partition = "sale_date", cluster = ["client_id", "sku_id", "pincode"], expire_days = null }
    stock_snapshots = { partition = "snapshot_date", cluster = ["client_id", "sku_id", "distributor_id"], expire_days = null }
    shelf_counts    = { partition = "counted_on", cluster = ["client_id", "sku_id", "kirana_id"], expire_days = null }
    channel_prices  = { partition = "priced_on", cluster = ["client_id", "sku_id", "channel"], expire_days = null }
    impact_ledger   = { partition = "closed_on", cluster = ["client_id", "sku_id", "channel"], expire_days = null }
    agent_runs      = { partition = "started_at", cluster = ["client_id", "agent_id"], expire_days = 90 }
    agent_evals     = { partition = "run_at", cluster = ["agent_id", "model"], expire_days = null }
  }
  env_tables = {
    for pair in setproduct(keys(local.datasets), keys(local.bq_tables)) :
    "${pair[0]}.${pair[1]}" => merge(local.bq_tables[pair[1]], { env = pair[0], table = pair[1] })
  }
}

resource "google_bigquery_dataset" "this" {
  for_each = local.datasets

  dataset_id    = each.value
  friendly_name = "Smart-Clearance analytics (${each.key})"
  description   = "The history the agents analyse (${each.key}): DMS sales, stock, shelf counts, channel prices, the impact ledger, agent runs and evals."
  location      = var.region
  labels        = { app = "smart-clearance", env = each.key }

  # A destroy never empties a dataset; its tables must go first, and prod's are protected.
  delete_contents_on_destroy = false

  depends_on = [google_project_service.this]
}

resource "google_bigquery_table" "this" {
  for_each = local.env_tables

  dataset_id  = google_bigquery_dataset.this[each.value.env].dataset_id
  table_id    = each.value.table
  schema      = file("${path.module}/bigquery/${each.value.table}.json")
  clustering  = each.value.cluster
  labels      = { app = "smart-clearance", env = each.value.env }
  description = "See infra/prod/bigquery/${each.value.table}.json."

  time_partitioning {
    type          = "DAY"
    field         = each.value.partition
    expiration_ms = each.value.expire_days == null ? null : each.value.expire_days * 86400000
  }

  deletion_protection = each.value.env == "prod"
}

# Each environment's agents read and write their own dataset only, and run jobs in the project (agents.tf).
resource "google_bigquery_dataset_iam_member" "agents" {
  for_each = local.datasets

  dataset_id = google_bigquery_dataset.this[each.key].dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = local.env_identities[each.key].agents
}

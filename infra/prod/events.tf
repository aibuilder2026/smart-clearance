# The journey's events on Pub/Sub (SC-66), one set per environment so a laptop never crosses into prod.
# - backend-api is the only publisher: every change it commits writes its events to an outbox in the same transaction,
#   then publishes them (the ordering key is the client and batch, so one batch's events arrive in order).
# - The agents consume batch.at_risk, offer.received, deal.closed and journey.step; backend-api's Notifier consumes
#   notify and sends the FCM push.
# - In prod the consumers are push subscriptions to Cloud Run (infra phase B, SC-74). Locally they are pull
#   subscriptions, which a developer's backend-api and agents read as sc-api-local and sc-agents-local: nothing on
#   the internet can push to a laptop, and no emulator is used.
# - A message that fails five times goes to the environment's dead-letter topic, kept for a week in its hold
#   subscription for an operator to read.
# - Subscriptions never expire: an idle one otherwise disappears after 31 days.
# Pub/Sub's first 10 GiB a month are free; the journey's messages are a few kilobytes each.

locals {
  event_envs   = ["prod", "local"]
  agent_topics = ["batch.at_risk", "offer.received", "deal.closed", "journey.step"]
  topics = {
    for pair in setproduct(local.event_envs, concat(local.agent_topics, ["notify", "dead-letter"])) :
    "${pair[0]}.${pair[1]}" => { env = pair[0], name = pair[1] }
  }

  # what each environment consumes by pulling: only local, for now (prod's push subscriptions come with the agents
  # service, SC-74)
  pull_subscriptions = merge(
    {
      for topic in local.agent_topics : "local.agents.${topic}" => {
        env = "local", topic = "local.${topic}", consumer = "agents", ordered = true
      }
    },
    {
      "local.notify.api" = { env = "local", topic = "local.notify", consumer = "api", ordered = false }
    },
  )
}

resource "google_pubsub_topic" "this" {
  for_each = local.topics

  name   = each.key
  labels = { app = "smart-clearance", env = each.value.env }

  depends_on = [google_project_service.this]
}

# Pub/Sub's own service agent forwards failed messages to the dead-letter topics, so it publishes there and
# acknowledges on the source subscriptions. Made here so it exists before those grants.
resource "google_project_service_identity" "pubsub" {
  provider = google-beta
  project  = var.project_id
  service  = "pubsub.googleapis.com"

  depends_on = [google_project_service.this]
}

resource "google_pubsub_subscription" "pull" {
  for_each = local.pull_subscriptions

  name  = each.key
  topic = google_pubsub_topic.this[each.value.topic].id

  ack_deadline_seconds    = 600 # an agent's run finishes within its ack deadline (Gemini calls time out at 20 s)
  enable_message_ordering = each.value.ordered
  labels                  = { app = "smart-clearance", env = each.value.env }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.this["${each.value.env}.dead-letter"].id
    max_delivery_attempts = 5
  }

  expiration_policy {
    ttl = ""
  }
}

# where an operator reads what failed: a week of each environment's dead letters
resource "google_pubsub_subscription" "dead_letter_hold" {
  for_each = toset(local.event_envs)

  name                       = "${each.key}.dead-letter.hold"
  topic                      = google_pubsub_topic.this["${each.key}.dead-letter"].id
  message_retention_duration = "604800s"
  ack_deadline_seconds       = 60
  labels                     = { app = "smart-clearance", env = each.key }

  expiration_policy {
    ttl = ""
  }
}

# backend-api publishes its environment's events (not the dead letters, which only Pub/Sub writes)
resource "google_pubsub_topic_iam_member" "api_publishes" {
  for_each = {
    for id, t in local.topics : id => t
    if t.name != "dead-letter" && local.env_identities[t.env].api != null
  }

  topic  = google_pubsub_topic.this[each.key].id
  role   = "roles/pubsub.publisher"
  member = local.env_identities[each.value.env].api
}

resource "google_pubsub_subscription_iam_member" "pull_consumer" {
  for_each = local.pull_subscriptions

  subscription = google_pubsub_subscription.pull[each.key].id
  role         = "roles/pubsub.subscriber"
  member       = local.env_identities[each.value.env][each.value.consumer]
}

resource "google_pubsub_topic_iam_member" "dead_letter_publisher" {
  for_each = toset(local.event_envs)

  topic  = google_pubsub_topic.this["${each.key}.dead-letter"].id
  role   = "roles/pubsub.publisher"
  member = google_project_service_identity.pubsub.member
}

resource "google_pubsub_subscription_iam_member" "dead_letter_forwarder" {
  for_each = local.pull_subscriptions

  subscription = google_pubsub_subscription.pull[each.key].id
  role         = "roles/pubsub.subscriber"
  member       = google_project_service_identity.pubsub.member
}

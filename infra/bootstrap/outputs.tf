output "state_bucket" {
  description = "The bucket every Terraform root in infra/ keeps its state in, each under its own prefix."
  value       = google_storage_bucket.state.name
}

terraform {
  required_version = ">= 1.9"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.5"
    }
  }

  # This root keeps its own state in the bucket it creates. On the first run there is no bucket yet:
  # infra/scripts/bootstrap.sh starts on local state, then migrates it here.
  # A backend block cannot read variables, so the bucket is written out: "<project_id>-tfstate".
  backend "gcs" {
    bucket = "aibuilder-510213-tfstate"
    prefix = "bootstrap"
  }
}

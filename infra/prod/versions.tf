terraform {
  required_version = ">= 1.9"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.5"
    }
    # Firebase's resources are in the beta provider only.
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 8.5"
    }
  }

  # The bucket infra/bootstrap creates ("<project_id>-tfstate"); a backend block cannot read variables.
  backend "gcs" {
    bucket = "aibuilder-510213-tfstate"
    prefix = "prod"
  }
}

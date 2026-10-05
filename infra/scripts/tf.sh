#!/usr/bin/env bash
# Terraform in infra/prod, with credentials and init taken care of.
#   infra/scripts/tf.sh plan
#   infra/scripts/tf.sh apply
#   infra/scripts/tf.sh output hosting_sites
# Any terraform subcommand and flags pass through. Run infra/scripts/bootstrap.sh once before the first plan.

source "$(dirname "$0")/lib.sh"
use_terraform_credentials

[[ $# -gt 0 ]] || die "usage: ${0##*/} <terraform subcommand> [args...]"
tf prod "$@"

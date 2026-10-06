#!/usr/bin/env bash
# The password every account starts on, for handing to whoever signs in next (no email is ever sent).
#   backend-api/scripts/default-password.sh          show it in this terminal
#   backend-api/scripts/default-password.sh --copy   copy it to the clipboard instead (macOS pbcopy)
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
need gcloud

if [[ ${1:-} == --copy ]]; then
	need pbcopy
	secret_value sc-default-user-password | pbcopy
	echo "default-password: copied to the clipboard"
else
	secret_value sc-default-user-password
	echo
fi

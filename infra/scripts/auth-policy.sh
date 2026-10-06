#!/usr/bin/env bash
# Firebase Authentication's password policy and email enumeration protection, which the Terraform provider has no block
# for. Run after `tf.sh apply` has created the Identity Platform config (auth.tf); safe to re-run.
#   infra/scripts/auth-policy.sh          set both, then print what the project now has
#   infra/scripts/auth-policy.sh --check  only print it
#
# - Passwords: at least 12 characters, with an upper-case and a lower-case letter and a digit. Enforced at sign-in and
#   on change; accounts backend-api creates use the default password, which secrets.sh generates to this policy.
# - Email enumeration protection: sign-in answers the same for a wrong password and an unknown address.

# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

command -v gcloud >/dev/null || die "needs gcloud"
command -v jq >/dev/null || die "needs jq"

CONFIG="https://identitytoolkit.googleapis.com/admin/v2/projects/$PROJECT_ID/config"

api() {
	local method=$1 url=$2
	shift 2
	curl -sS --fail-with-body -X "$method" "$url" \
		-H "Authorization: Bearer $(gcloud auth print-access-token)" \
		-H "x-goog-user-project: $PROJECT_ID" \
		-H "Content-Type: application/json" "$@"
}

if [[ ${1:-} != --check ]]; then
	jq -n '{
		passwordPolicyConfig: {
			passwordPolicyEnforcementState: "ENFORCE",
			forceUpgradeOnSignin: false,
			passwordPolicyVersions: [{
				customStrengthOptions: {
					minPasswordLength: 12,
					containsLowercaseCharacter: true,
					containsUppercaseCharacter: true,
					containsNumericCharacter: true
				}
			}]
		},
		emailPrivacyConfig: { enableImprovedEmailPrivacy: true }
	}' | api PATCH "$CONFIG?updateMask=passwordPolicyConfig,emailPrivacyConfig" --data-binary @- >/dev/null ||
		die "the PATCH failed: has 'tf.sh apply' created the Identity Platform config (auth.tf)?"
fi

api GET "$CONFIG" | jq '{
	email: .signIn.email,
	signUpDisabled: (.client.permissions.disabledUserSignup // false),
	authorizedDomains,
	passwordPolicy: .passwordPolicyConfig.passwordPolicyVersions[0].customStrengthOptions,
	enforcement: .passwordPolicyConfig.passwordPolicyEnforcementState,
	emailEnumerationProtection: (.emailPrivacyConfig.enableImprovedEmailPrivacy // false)
}'

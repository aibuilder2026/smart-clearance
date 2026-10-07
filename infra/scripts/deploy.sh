#!/usr/bin/env bash
# Build the frontend and release it to Firebase Hosting, each app to its own site.
#   infra/scripts/deploy.sh               every app
#   infra/scripts/deploy.sh console       one app, by its frontend/firebase.json target: site (the landing page), console,
#                                         workspace (Munchly Foods' workspace) or demo (the guided demo)
#   SKIP_BUILD=1 infra/scripts/deploy.sh  release the builds already on disk
#
# The sites come from Terraform's hosting_sites output, or from HOSTING_SITES, which carries the same JSON (in CI, the
# prod environment's variable of that name). firebase-tools signs in with application-default credentials: on a
# workstation, run `gcloud auth application-default login` once; in CI, google-github-actions/auth provides them.

# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

FIREBASE_TOOLS="firebase-tools@15.32.1"

has_adc || die "firebase-tools needs application-default credentials: run 'gcloud auth application-default login'"
# firebase-tools bills its calls to this project when it runs as a person
export GOOGLE_CLOUD_QUOTA_PROJECT="$PROJECT_ID"

targets="${*:-site console workspace demo}"
sites="${HOSTING_SITES:-}"
[[ -n $sites ]] || sites="$(tf prod output -json hosting_sites)"

builds=""
for target in $targets; do
	case $target in
	site) build=build:admin ;;
	console) build=build:console ;;
	workspace) build=build:workspace ;;
	demo) build=build:demo ;;
	*) die "unknown target '$target': site, console, workspace or demo" ;;
	esac
	jq -e --arg t "$target" 'has($t)' <<<"$sites" >/dev/null ||
		die "Terraform has no Hosting site for '$target' (infra/prod/terraform.tfvars, then tf.sh apply)"
	jq -e --arg t "$target" '.hosting | any(.target == $t)' "$FRONTEND_DIR/firebase.json" >/dev/null ||
		die "frontend/firebase.json has no '$target' target"
	builds="$builds $build"
done

if [[ -z ${SKIP_BUILD:-} ]]; then
	(cd "$FRONTEND_DIR" && corepack pnpm install --frozen-lockfile)
	for build in $builds; do
		(cd "$FRONTEND_DIR" && corepack pnpm "$build")
	done
fi

# Bind firebase.json's targets to Terraform's sites; this file is written fresh on every deploy, never committed.
jq -n --arg project "$PROJECT_ID" --argjson sites "$sites" \
	'{projects: {default: $project}, targets: {($project): {hosting: ($sites | map_values([.site_id]))}}}' \
	>"$FRONTEND_DIR/.firebaserc"

only=""
for target in $targets; do only="$only,hosting:$target"; done
# The release message names the commit, marked -dirty when frontend/ has changes not committed
revision="$(git -C "$REPO_DIR" rev-parse --short HEAD)"
git -C "$REPO_DIR" diff --quiet HEAD -- frontend || revision="$revision-dirty"

(cd "$FRONTEND_DIR" && npx --yes "$FIREBASE_TOOLS" deploy \
	--only "${only#,}" --project "$PROJECT_ID" --non-interactive --message "$revision")

for target in $targets; do
	url="$(jq -r --arg t "$target" '.[$t].url' <<<"$sites")"
	status="$(curl -s -o /dev/null -w '%{http_code}' "$url/")"
	echo "$target: $url ($status)"
	[[ $status == 200 ]] || die "$url answered $status"
done

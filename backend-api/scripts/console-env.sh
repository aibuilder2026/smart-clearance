#!/usr/bin/env bash
# The older name of app-env.sh (SC-66), which now writes the workspace app's .env.local too.
exec "$(dirname "$0")/app-env.sh" "$@"

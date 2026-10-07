#!/usr/bin/env bash
# The workspace app's live-source fixtures (frontend/workspace/tests/live/fixtures/): what backend-api answers each
# person at five moments of the story's journey, walked on the test database (tests/test_live_fixtures.py). Run it after
# a change to what the workspace routes answer, then the workspace app's tests.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
out="$BACKEND_DIR/../frontend/workspace/tests/live/fixtures"
mkdir -p "$out"
LIVE_FIXTURES_OUT="$out" "$BACKEND_DIR/scripts/test.sh" -q tests/test_live_fixtures.py
ls -la "$out"

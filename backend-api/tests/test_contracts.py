"""contracts/openapi.json is the API as it is: scripts/contracts.sh rewrites it after a change."""

import json
from pathlib import Path

from sc_api.main import create_app
from tests.conftest import settings


def test_the_published_openapi_is_current():
    published = json.loads((Path(__file__).parents[1] / "contracts" / "openapi.json").read_text())
    assert create_app(settings()).openapi() == published, "run backend-api/scripts/contracts.sh"

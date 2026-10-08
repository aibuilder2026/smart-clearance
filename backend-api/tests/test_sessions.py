"""The people the Munchly Chips E2E suite signs in (SC-95): every member of the journey and Neha, on the uids hydrate
gives them, and nobody the reference data does not name."""

import pytest

from sc_api.cli import sessions
from sc_api.identity import synthetic_uid
from sc_api.services.reference import load


def test_every_member_and_neha_on_hydrates_uids():
    people = sessions.people()
    members = load("journey.json")["members"]
    assert set(people) == {m["id"] for m in members} | {"neha"}
    for m in members:
        assert people[m["id"]]["email"] == m["login"]
        assert people[m["id"]]["uid"] == synthetic_uid(m["login"])
    assert people["neha"]["email"].startswith("neha.kulkarni@")
    assert people["rakesh"]["role"] == "distributor"


def test_unknown_people_are_refused_before_anything_is_signed():
    with pytest.raises(SystemExit, match="nobody-here"):
        sessions.main(["priya", "nobody-here"])
    with pytest.raises(SystemExit, match="none given"):
        sessions.main([])

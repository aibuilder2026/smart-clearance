"""What the server enforces that the prototype's mock never did, the roles, the error envelope, and the audit log's
append-only guard."""

import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from sc_api.services import staff
from tests.conftest import STAFF_DOMAIN, token

C = "/v1/console/clients"


async def test_the_approval_step_is_always_on(api, neha):
    r = await api.patch(f"{C}/munchly/agents/gate", json={"on": False}, headers=neha)
    assert r.status_code == 422
    r = await api.patch(f"{C}/munchly/agents/gate", json={"autonomy": "act"}, headers=neha)
    assert r.status_code == 422


async def test_settings_are_checked_against_the_consoles_fields(api, neha):
    r = await api.patch(f"{C}/munchly/agents/negotiator", json={"settings": {"tokenPct": 90}}, headers=neha)
    assert r.status_code == 422 and r.json()["fields"] == {"tokenPct": "Token on award: 5 to 30 %."}
    r = await api.patch(f"{C}/munchly/agents/valuer", json={"settings": {"indicative": False}}, headers=neha)
    assert r.status_code == 422
    r = await api.patch(f"{C}/munchly/agents/router", json={"settings": {"objective": "Anything"}}, headers=neha)
    assert r.status_code == 422
    r = await api.patch(f"{C}/munchly/agents/data", json={"settings": {"nope": 1}}, headers=neha)
    assert r.status_code == 422
    r = await api.patch(f"{C}/munchly/agents/gate", json={"settings": {"approver": "krishna"}}, headers=neha)
    assert r.status_code == 422  # deactivated, and a partner
    r = await api.patch(f"{C}/munchly/agents/nobody", json={"on": True}, headers=neha)
    assert r.status_code == 404 and r.json() == {"message": "No such agent."}


async def test_a_locked_exit_stays_off_and_one_exit_stays_on(api, neha):
    c = (await api.get(f"{C}/munchly", headers=neha)).json()
    r = await api.put(
        f"{C}/munchly/rules", json={"rules": c["rules"], "exits": {**c["exits"], "d2c": {"on": True}}}, headers=neha
    )
    assert r.status_code == 422 and r.json()["message"] == "Only for the manufacturer's own stock."
    off = {k: {"on": False} for k in c["exits"]}
    r = await api.put(f"{C}/munchly/rules", json={"rules": c["rules"], "exits": off}, headers=neha)
    assert r.json() == {"message": "Keep at least one exit on."}


async def test_the_reserve_token_and_scheme_belong_to_their_agents(api, neha):
    c = (await api.get(f"{C}/munchly", headers=neha)).json()
    sent = {"rules": {**c["rules"], "reserve": 20}, "exits": c["exits"]}
    r = await api.put(f"{C}/munchly/rules", json=sent, headers=neha)
    assert r.status_code == 422 and "reserve" in r.json()["fields"]


async def test_no_line_when_the_rules_are_unchanged(api, neha):
    c = (await api.get(f"{C}/munchly", headers=neha)).json()
    n = len((await api.get("/v1/console/audit", headers=neha)).json())
    r = await api.put(f"{C}/munchly/rules", json={"rules": c["rules"], "exits": c["exits"]}, headers=neha)
    assert r.status_code == 200
    assert len((await api.get("/v1/console/audit", headers=neha)).json()) == n


async def test_plans_must_exist_and_the_approver_stays_active(api, neha):
    assert (await api.patch(f"{C}/munchly", json={"plan": "platinum"}, headers=neha)).status_code == 422
    r = await api.patch(f"{C}/munchly/people/priya", json={"status": "deactivated"}, headers=neha)
    assert r.status_code == 422


@pytest.fixture
async def support(ctx, api):
    kiran = staff.StaffSpec(name="Kiran Das", email=f"kiran.das@{STAFF_DOMAIN}", role="Support", active=True)
    await staff.add(ctx, kiran)
    await ctx.session.commit()
    return token(f"kiran.das@{STAFF_DOMAIN}")


async def test_support_may_help_but_not_invite_staff_or_change_plans(api, support):
    r = await api.post(
        "/v1/console/staff", json={"name": "X Y", "email": f"x.y@{STAFF_DOMAIN}", "role": "Support"}, headers=support
    )
    assert r.status_code == 403 and r.json() == {"message": "Only a Super admin can invite staff."}
    r = await api.patch(f"{C}/munchly", json={"plan": "growth"}, headers=support)
    assert r.status_code == 403 and r.json() == {"message": "Only a Super admin can change a client's plan."}
    r = await api.post(f"{C}/munchly/distributors/gupta/reminders", headers=support)
    assert r.status_code == 204


async def test_a_platform_engineer_cannot_take_a_client_live(api, sameer):
    r = await api.patch(f"{C}/munchly", json={"plan": "growth"}, headers=sameer)
    assert r.status_code == 403
    r = await api.patch(f"{C}/munchly/agents/vision", json={"autonomy": "act"}, headers=sameer)
    assert r.status_code == 200
    line = (await api.get("/v1/console/audit", headers=sameer)).json()[0]
    assert line["who"] == "Sameer Rao"


async def test_errors_are_one_shape(api, neha):
    r = await api.get("/v1/nowhere")
    assert r.status_code == 404 and r.json() == {"message": "Not found."}
    r = await api.post(f"{C}/munchly/people", json={"name": "X"}, headers=neha)
    assert r.status_code == 422 and r.json()["message"] == "Check the highlighted fields."
    assert set(r.json()["fields"]) == {"contact", "access"}
    r = await api.get(f"{C}/munchly", headers=neha)
    assert r.headers["cache-control"] == "no-store"


async def test_the_audit_log_is_append_only(conn):
    line = (await conn.execute(text("select id from sc.audit_log limit 1"))).scalar_one()
    for statement in (
        f"update sc.audit_log set text = 'x' where id = {line}",
        f"delete from sc.audit_log where id = {line}",
        "truncate sc.audit_log",
    ):
        savepoint = await conn.begin_nested()
        with pytest.raises(DBAPIError):
            await conn.execute(text(statement))
        await savepoint.rollback()


async def test_the_api_cannot_write_the_reference_data(conn):
    savepoint = await conn.begin_nested()
    with pytest.raises(DBAPIError):
        await conn.execute(text("update sc.plans set name = 'x'"))
    await savepoint.rollback()


def test_settings_never_show_a_password():
    from sc_api.settings import Settings

    assert "s3cret" not in repr(Settings(sc_env="test", db_password="s3cret"))

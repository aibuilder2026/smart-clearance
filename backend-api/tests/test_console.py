"""The console's routes, ported from frontend/api/tests/console.test.ts: the same story, and an audit line for every
change in the prototype's words. Addresses are the reserved ones the story is imported with (munchly.example, the
staff domain smartclearance.example)."""

import pytest

from sc_api.domain.rules import exits_for
from sc_api.identity import synthetic_uid
from sc_api.services.reference import load
from tests.conftest import STAFF_DOMAIN, token

C = "/v1/console/clients"


async def last_audit(api, h) -> dict:
    return (await api.get("/v1/console/audit", headers=h)).json()[0]


def kesari(**patch) -> dict:
    profile = {"route": "distributors", "owner": "manufacturer", "expiry": "full-credit"}
    return {
        "name": "Kesari Foods",
        "city": "Indore",
        "industry": "Snacks and drinks",
        "colour": "#2563eb",
        "slug": "kesari",
        "emailDomain": "kesari.example",
        "signGoogle": True,
        "signPhone": True,
        "profile": profile,
        "exits": exits_for(profile, 50),
        "preset": "standard",
        "adminName": "Ritu Malhotra",
        "adminEmail": "ritu@kesari.example",
        "plan": "pilot",
        "request": None,
        **patch,
    }


# --- signing in -----------------------------------------------------------------------------------------------------


async def test_lets_in_active_staff_only(api, neha):
    assert (await api.get("/v1/console/session/accounts")).status_code == 404  # never lists staff before sign-in
    r = await api.post("/v1/console/session", headers=neha)
    assert r.status_code == 200, r.text
    assert r.json() == {
        "id": "neha",
        "name": "Neha Kulkarni",
        "short": "Neha",
        "role": "Super admin",
        "team": "Customer success",
        "email": f"neha.kulkarni@{STAFF_DOMAIN}",
        "passkey": "Email and password",
        "status": "active",
    }
    assert (await api.get("/v1/console/session", headers=neha)).json()["name"] == "Neha Kulkarni"
    stranger = await api.post("/v1/console/session", headers={"Authorization": "Bearer fake:nobody"})
    assert stranger.status_code == 401


async def test_a_client_person_cannot_sign_in_to_the_console(api):
    r = await api.get("/v1/console/session", headers=token("priya.deshmukh@munchly.example"))
    assert r.status_code == 401
    assert r.json() == {"message": "This account cannot sign in to the console."}


async def test_refuses_changes_when_signed_out(api):
    assert (await api.get("/v1/console/session")).status_code == 401
    r = await api.post(f"{C}/munchly/go-live")
    assert r.status_code == 401
    assert r.json() == {"message": "Sign in to the console first."}
    assert (await api.delete("/v1/console/session")).status_code == 204


async def test_config_and_catalog_answer_before_sign_in(api):
    config = (await api.get("/v1/console/config")).json()
    assert config["staffEmailDomain"] == STAFF_DOMAIN
    assert set(config) >= {"autonomy", "fields", "exits", "profile", "presets", "stages", "defaults"}
    assert (await api.get("/v1/platform/catalog", headers={"Authorization": "Bearer junk"})).status_code == 200


# --- the day the console opens on ----------------------------------------------------------------------------------


async def test_munchly_is_the_story_as_design3_seeds_it(api, neha):
    from sc_api.cli.story import rewrite
    from tests.conftest import STAFF_DOMAIN as domain

    seed = rewrite(load("console.json")["state"]["clients"][0], domain)
    got = (await api.get(f"{C}/munchly", headers=neha)).json()
    assert got == seed


async def test_the_day_munchly_tracks_runs_and_requests(api, neha):
    assert [c["id"] for c in (await api.get(C, headers=neha)).json()] == ["munchly"]
    o = (await api.get("/v1/console/overview", headers=neha)).json()
    assert [f"{t['batch']}: {t['product']} · {t['distributor']}, {t['city']}" for t in o["tracks"]] == [
        "MF-2409-117: Masala Chips 150 g · Rakesh Traders, Nagpur",
        "MF-2410-118: Mango Drink 200 ml · Lakshmi Agencies, Hyderabad",
    ]
    assert "split" not in o["tracks"][0] and o["tracks"][0]["money"] == 21152.4
    assert len(o["runs"]) == 8
    assert o["runs"][0] == {
        "at": "11:05",
        "agent": "paperwork",
        "client": "munchly",
        "text": "FSSAI checklist for Feeding India",
    }


async def test_attention_two_permissions_and_a_late_export(api, neha):
    attention = (await api.get("/v1/console/overview", headers=neha)).json()["attention"]
    assert [f"{a['title']}: {a['text']} → {a['action']['label']}" for a in attention] == [
        "Patil Distributors: one-time permission not given yet → Ask again",
        "Gupta & Sons: one-time permission not given yet → Ask again",
        "Gupta & Sons: stock export arrived 2 h late today → Open",
    ]


async def test_a_client_that_is_not_there(api, neha):
    r = await api.get(f"{C}/nope", headers=neha)
    assert r.status_code == 404
    assert r.json() == {"message": "No such client."}


async def test_the_audit_log_newest_first(api, neha):
    log = (await api.get("/v1/console/audit?client=munchly", headers=neha)).json()
    assert log[0] == {
        "id": log[0]["id"],
        "at": "4 Oct, 16:20",
        "who": "Neha Kulkarni",
        "client": "munchly",
        "text": "Overrode MF-2409-204's quick-commerce gates: Zepto and Instamart 30% of life (Zepto's Pune warehouse "
        "agreed to take this lot at 30% of its life)",
    }
    assert log[1]["text"] == "Deactivated Krishna Kirana Bhandar"
    assert log[-1]["text"].startswith("Set up Munchly Foods")


# --- every change is logged in the words the prototype uses --------------------------------------------------------


async def test_an_agents_autonomy_and_nothing_when_unchanged(api, neha):
    r = await api.patch(f"{C}/munchly/agents/negotiator", json={"autonomy": "act"}, headers=neha)
    assert r.status_code == 200, r.text
    line = await last_audit(api, neha)
    assert {k: line[k] for k in ("at", "who", "client", "text")} == {
        "at": "Today, 12:00",
        "who": "Neha Kulkarni",
        "client": "munchly",
        "text": "Set the Negotiator agent to Act for Munchly Foods (was Ask)",
    }
    n = len((await api.get("/v1/console/audit", headers=neha)).json())
    await api.patch(f"{C}/munchly/agents/negotiator", json={"autonomy": "act"}, headers=neha)
    assert len((await api.get("/v1/console/audit", headers=neha)).json()) == n


async def test_an_agents_settings_and_its_approver(api, neha):
    c = (await api.get(f"{C}/munchly", headers=neha)).json()
    settings = {**c["agents"]["negotiator"]["settings"], "floor": 14, "counters": 1}
    r = await api.patch(f"{C}/munchly/agents/negotiator", json={"settings": settings}, headers=neha)
    assert r.status_code == 200, r.text
    assert (await last_audit(api, neha))["text"] == (
        "Changed the Negotiator agent for Munchly Foods: floor ₹13.50 to ₹14.00; counter offers 2 to 1"
    )
    r = await api.patch(f"{C}/munchly/agents/gate", json={"settings": {"approver": "arjun"}}, headers=neha)
    assert r.json()["approver"] == "arjun" and r.json()["agents"]["gate"]["settings"]["approver"] == "arjun"
    assert (await last_audit(api, neha))["text"] == (
        "Changed the Approval agent for Munchly Foods: approver Priya Deshmukh to Arjun Nair"
    )


async def test_switching_off_running_and_pausing(api, neha):
    await api.patch(f"{C}/munchly/agents/outreach", json={"on": False}, headers=neha)
    assert (await last_audit(api, neha))["text"] == "Switched off the Outreach agent for Munchly Foods"
    ran = (await api.post(f"{C}/munchly/agents/data/runs", headers=neha)).json()
    assert ran["agents"]["data"]["last"] == "12:00 today · ran on request; nothing new"
    o = (await api.get("/v1/console/overview", headers=neha)).json()
    assert {k: o["runs"][0][k] for k in ("agent", "text")} == {"agent": "data", "text": "ran on request; nothing new"}
    paused = (await api.post(f"{C}/munchly/agents/pause", headers=neha)).json()
    assert [a for a, cfg in paused["agents"].items() if a != "gate" and cfg["on"]] == []
    assert paused["agents"]["gate"]["on"] is True
    assert (await last_audit(api, neha))["text"] == "Paused every agent for Munchly Foods"


async def test_channels_and_rules(api, neha):
    c = (await api.get(f"{C}/munchly", headers=neha)).json()
    r = await api.put(
        f"{C}/munchly/rules",
        json={
            "rules": {**c["rules"], "staffCap": 60, "hindiOffers": False},
            "exits": {**c["exits"], "foodbank": {"on": False}},
        },
        headers=neha,
    )
    assert r.status_code == 200, r.text
    assert r.json()["exits"]["staff"] == {"on": True, "cap": 60}
    assert (await last_audit(api, neha))["text"] == (
        "Changed Munchly Foods's channels and rules: Food bank off; staff sale cap 60; Hindi offers off"
    )


async def test_the_profile_rederives_the_exits_and_carries_the_gates(api, neha):
    r = await api.put(
        f"{C}/munchly/profile",
        json={
            "profile": {"route": "own", "owner": "manufacturer", "expiry": "none"},
            "gates": {"blinkitDays": 70, "qcomPct": 50},
            "returnWindowDays": 21,
        },
        headers=neha,
    )
    assert r.status_code == 200, r.text
    c = r.json()
    assert c["exits"]["d2c"] == {"on": False, "locked": None}
    assert {k: c["agents"]["watcher"]["settings"][k] for k in ("blinkitDays", "qcomPct")} == {
        "blinkitDays": 70,
        "qcomPct": 50,
    }
    assert c["agents"]["impact"]["settings"]["returnWindowDays"] == 21
    assert (await last_audit(api, neha))["text"] == (
        "Changed Munchly Foods's supply-chain profile: "
        "own warehouses and d2c, the manufacturer owns the stock, no returns"
    )


async def test_people_an_invitation_its_access_and_reactivation(api, neha, identity):
    bad = await api.post(
        f"{C}/munchly/people", json={"name": "Sunil", "contact": "sunil@gmail.com", "access": "Member"}, headers=neha
    )
    assert bad.status_code == 422
    assert bad.json()["fields"]["contact"] == (
        "Munchly Foods staff need a munchly.example address. Partners can use any address or a phone number."
    )
    c = (
        await api.post(
            f"{C}/munchly/people",
            json={"name": " Sunil Rao ", "contact": "+91 98230 11111", "access": "Partner"},
            headers=neha,
        )
    ).json()
    p = c["people"][-1]
    assert {k: p[k] for k in ("name", "org", "provider", "status", "phone", "email")} == {
        "name": "Sunil Rao",
        "org": "Sunil Rao",
        "provider": "Phone and code",
        "status": "invited",
        "phone": "+91 98230 11111",
        "email": "",
    }
    assert p["id"].startswith("p-")
    assert (await last_audit(api, neha))["text"] == "Invited Sunil Rao as Partner"
    await api.patch(f"{C}/munchly/people/{p['id']}", json={"access": "Member"}, headers=neha)
    assert (await last_audit(api, neha))["text"] == "Gave Sunil Rao Member access"
    await api.patch(f"{C}/munchly/people/krishna", json={"status": "active"}, headers=neha)
    assert (await last_audit(api, neha))["text"] == "Reactivated Krishna Kirana Bhandar"


async def test_an_emailed_invitation_makes_an_account_on_the_default_password(api, neha, identity):
    c = (
        await api.post(
            f"{C}/munchly/people",
            json={"name": "Kavya Iyer", "contact": "Kavya.Iyer@munchly.example", "access": "Member"},
            headers=neha,
        )
    ).json()
    p = c["people"][-1]
    assert (p["email"], p["provider"], p["status"]) == ("kavya.iyer@munchly.example", "Email and password", "invited")
    assert "kavya.iyer@munchly.example" in identity.accounts.values()
    again = await api.post(
        f"{C}/munchly/people",
        json={"name": "Kavya Iyer", "contact": "kavya.iyer@munchly.example", "access": "Member"},
        headers=neha,
    )
    assert again.status_code == 422
    resent = await api.post(f"{C}/munchly/people/{p['id']}/invitations", headers=neha)
    assert resent.status_code == 204 and resent.content == b""
    joined = await api.post(f"{C}/munchly/people/priya/invitations", headers=neha)
    assert joined.status_code == 422 and joined.json()["message"] == "Priya Deshmukh has already joined."


async def test_a_reminder_the_plan_and_going_live(api, neha):
    r = await api.post(f"{C}/munchly/distributors/patil/reminders", headers=neha)
    assert r.status_code == 204 and r.content == b""
    assert (await last_audit(api, neha))["text"] == "Asked Patil Distributors again for its one-time permission"
    await api.patch(f"{C}/munchly", json={"plan": "growth"}, headers=neha)
    assert (await last_audit(api, neha))["text"] == "Moved Munchly Foods from Pilot to Growth"
    gone = await api.post(f"{C}/munchly/distributors/nobody/reminders", headers=neha)
    assert gone.status_code == 404 and gone.json() == {"message": "No such distributor."}


async def test_the_length_of_a_journey_day_and_its_audit_line(api, neha, sameer):
    """SC-68: the client answers its length of a journey day; a change writes the console prototype's line in the
    staff member's name, and nothing when it is unchanged"""
    assert (await api.get(f"{C}/munchly", headers=neha)).json()["dayMinutes"] == 1440
    r = await api.put(f"{C}/munchly/clock", json={"dayMinutes": 5}, headers=neha)
    assert r.status_code == 200, r.text
    assert r.json()["dayMinutes"] == 5
    assert (await api.get(f"{C}/munchly", headers=neha)).json()["dayMinutes"] == 5
    line = await last_audit(api, neha)
    assert (line["who"], line["client"], line["text"]) == (
        "Neha Kulkarni",
        "munchly",
        "Set the length of a journey day for Munchly Foods to 5 minutes (was a day)",
    )
    n = len((await api.get("/v1/console/audit", headers=neha)).json())
    assert (await api.put(f"{C}/munchly/clock", json={"dayMinutes": 5}, headers=neha)).status_code == 200
    assert len((await api.get("/v1/console/audit", headers=neha)).json()) == n
    await api.put(f"{C}/munchly/clock", json={"dayMinutes": 90}, headers=sameer)
    line = await last_audit(api, neha)
    assert (line["who"], line["text"]) == (
        "Sameer Rao",
        "Set the length of a journey day for Munchly Foods to 1 h 30 min (was 5 minutes)",
    )
    await api.put(f"{C}/munchly/clock", json={"dayMinutes": 1440}, headers=neha)
    assert (await last_audit(api, neha))["text"] == (
        "Set the length of a journey day for Munchly Foods to a day (was 1 h 30 min)"
    )
    for bad in (0, 1441, -5):
        r = await api.put(f"{C}/munchly/clock", json={"dayMinutes": bad}, headers=neha)
        assert r.status_code == 422
        assert r.json() == {
            "message": "Enter a whole number of minutes, from 1 to 1,440.",
            "fields": {"dayMinutes": "Enter a whole number of minutes, from 1 to 1,440."},
        }
    assert (await api.put(f"{C}/munchly/clock", json={"dayMinutes": 4.5}, headers=neha)).status_code == 422
    assert (await api.put(f"{C}/nope/clock", json={"dayMinutes": 5}, headers=neha)).status_code == 404
    assert (await api.put(f"{C}/munchly/clock", json={"dayMinutes": 5})).status_code == 401


# --- a new client ----------------------------------------------------------------------------------------------------


async def test_a_new_client_from_its_demo_request(api, neha):
    req = (
        await api.post(
            "/v1/demo-requests",
            json={
                "name": "Ritu Malhotra",
                "company": "Kesari Foods",
                "email": "ritu@kesari.example",
                "makes": "Snacks and drinks",
                "plan": "Pilot",
                "note": "",
            },
        )
    ).json()
    r = await api.post(C, json=kesari(request=req["id"]), headers=neha)
    assert r.status_code == 201, r.text
    c = r.json()
    assert {k: c[k] for k in ("id", "domain", "status", "approver", "since", "dayMinutes")} == {
        "id": "kesari",
        "domain": "kesari.smartclearance.com",
        "status": "setting-up",
        "approver": "admin-kesari",
        "since": None,
        "dayMinutes": 1440,
    }
    assert c["agents"]["negotiator"]["autonomy"] == "ask"
    assert c["agents"]["gate"]["settings"]["approver"] == "admin-kesari"
    assert c["agents"]["data"]["last"] == "not run yet"
    assert c["exits"]["d2c"]["on"] is True
    assert c["people"][0]["email"] == "ritu@kesari.example"
    listed = {r["id"]: r for r in (await api.get("/v1/demo-requests", headers=neha)).json()}
    assert {k: listed[req["id"]][k] for k in ("status", "client")} == {"status": "set up", "client": "kesari"}
    assert (await last_audit(api, neha))["text"] == (
        "Set up Kesari Foods from its supply-chain profile: through distributors, the manufacturer owns the stock, "
        "full credit at expiry; invited Ritu Malhotra as admin"
    )
    attention = (await api.get("/v1/console/overview", headers=neha)).json()["attention"]
    assert next(a for a in attention if a["id"] == "kesari-invite")["text"] == (
        "waiting for Ritu Malhotra to accept the invitation"
    )
    live = (await api.post(f"{C}/kesari/go-live", headers=neha)).json()
    assert live["since"] == "6 Oct 2026"
    assert (await last_audit(api, neha))["text"] == "Moved Kesari Foods to Live on the Pilot plan"
    again = await api.post(f"{C}/kesari/go-live", headers=neha)
    assert again.status_code == 422


async def test_a_new_client_is_refused_a_taken_address_or_an_admin_outside_its_domain(api, neha):
    r = await api.post(C, json=kesari(slug="munchly"), headers=neha)
    assert r.json() == {"message": "munchly.smartclearance.com is taken."}
    r = await api.post(C, json=kesari(adminEmail="ritu@gmail.com"), headers=neha)
    assert r.json() == {"message": "Enter the admin's name and a @kesari.example address."}
    r = await api.post(C, json=kesari(slug="console"), headers=neha)
    assert r.json() == {"message": "console.smartclearance.com is reserved for the platform."}


# --- staff ---------------------------------------------------------------------------------------------------------


async def test_invites_a_colleague_at_the_staff_domain_only(api, neha):
    asha = {"name": "Asha", "email": "asha@gmail.com", "role": "Support"}
    r = await api.post("/v1/console/staff", json=asha, headers=neha)
    assert r.status_code == 422
    assert r.json()["fields"] == {"email": f"Staff use a {STAFF_DOMAIN} address."}
    r = await api.post(
        "/v1/console/staff",
        json={"name": "Asha Iyer", "email": f"Asha.Iyer@{STAFF_DOMAIN}", "role": "Support"},
        headers=neha,
    )
    assert r.status_code == 201, r.text
    s = r.json()
    assert {k: s[k] for k in ("short", "team", "email", "status", "passkey")} == {
        "short": "Asha",
        "team": "Customer success",
        "email": f"asha.iyer@{STAFF_DOMAIN}",
        "status": "invited",
        "passkey": "not set up yet",
    }
    line = await last_audit(api, neha)
    assert (line["client"], line["text"]) == (None, "Invited Asha Iyer to the console as Support")
    # her first sign-in makes her active
    asha = await api.post("/v1/console/session", headers=token(f"asha.iyer@{STAFF_DOMAIN}"))
    assert asha.status_code == 200 and asha.json()["status"] == "active"


@pytest.mark.parametrize("uid_email", [f"neha.kulkarni@{STAFF_DOMAIN}"])
async def test_tokens_are_per_account(uid_email):
    assert token(uid_email)["Authorization"] == f"Bearer fake:{synthetic_uid(uid_email)}"

"""The landing page's routes (frontend/api/tests/site.test.ts, ported), with Find your workspace answering less: the
workspace only, never a person's role or whether they were deactivated."""


async def lookup(api, q: str) -> list[str]:
    r = await api.post("/v1/workspaces/lookup", json={"query": q})
    assert r.status_code == 200, r.text
    assert all(set(m) == {"workspace", "value"} for m in r.json())
    return [m["workspace"]["id"] for m in r.json()]


async def test_finds_a_member_by_email_in_any_case(api):
    assert await lookup(api, "Priya.Deshmukh@munchly.example") == ["munchly"]


async def test_finds_a_member_by_mobile_with_or_without_91(api):
    assert await lookup(api, "98230 44118") == ["munchly"]
    assert await lookup(api, "+91 9823044118") == ["munchly"]


async def test_names_the_workspace_only_for_invitees_and_deactivated_accounts(api):
    assert await lookup(api, "98230 60013") == ["munchly"]
    assert await lookup(api, "9823060012") == ["munchly"]


async def test_points_a_colleague_at_their_companys_workspace(api):
    assert await lookup(api, "new.joiner@munchly.example") == ["munchly"]


async def test_never_shows_a_marketplace_buyer_a_workspace(api):
    assert await lookup(api, "orders@agrawalwholesale.example") == []


async def test_refuses_what_is_neither_an_email_nor_a_mobile(api):
    r = await api.post("/v1/workspaces/lookup", json={"query": "12345"})
    assert r.status_code == 422
    assert r.json() == {"message": "Enter an email address, or a 10-digit mobile number."}


async def test_the_workspace_summary(api):
    r = await api.post("/v1/workspaces/lookup", json={"query": "arjun.nair@munchly.example"})
    assert r.json()[0] == {
        "workspace": {
            "id": "munchly",
            "name": "Munchly Foods",
            "short": "Munchly",
            "domain": "munchly.smartclearance.com",
            "emailDomain": "munchly.example",
            "mark": {"from": "#f68d3e", "to": "#d6461e", "ink": "#ffffff"},
        },
        "value": "arjun.nair@munchly.example",
    }


async def test_takes_a_demo_request_in_the_prototypes_shape(api, neha):
    r = await api.post(
        "/v1/demo-requests",
        json={
            "name": " Ritu Malhotra ",
            "company": "Kesari Foods",
            "email": "Ritu@Kesari.example",
            "makes": "Dairy",
            "plan": "Growth",
            "note": "",
        },
    )
    assert r.status_code == 201, r.text
    req = r.json()
    assert req["id"].startswith("rq-")
    assert {k: req[k] for k in ("name", "email", "plan", "status", "at")} == {
        "name": "Ritu Malhotra",
        "email": "ritu@kesari.example",
        "plan": "Growth",
        "status": "new",
        "at": "6 Oct, 12:00 pm",
    }
    assert "client" not in req
    listed = (await api.get("/v1/demo-requests", headers=neha)).json()
    assert listed[0]["id"] == req["id"]


async def test_names_each_field_a_demo_request_is_missing(api):
    r = await api.post(
        "/v1/demo-requests",
        json={"name": "", "company": "", "email": "nope", "makes": "Dairy", "plan": None, "note": ""},
    )
    assert r.status_code == 422
    assert r.json()["message"] == "Check the highlighted fields."
    assert list(r.json()["fields"]) == ["name", "company", "email"]


async def test_catalog_and_showcase(api):
    catalog = (await api.get("/v1/platform/catalog")).json()
    assert [a["id"] for a in catalog["agents"]][:3] == ["data", "watcher", "vision"]
    gate = next(a for a in catalog["agents"] if a["id"] == "gate")
    assert "model" not in gate and gate["gate"] is True
    assert [p["id"] for p in catalog["plans"]] == ["pilot", "growth", "enterprise"]
    showcase = await api.get("/v1/site/showcase")
    assert showcase.headers["cache-control"] == "public, max-age=300"
    assert showcase.json()["shops"] == 31

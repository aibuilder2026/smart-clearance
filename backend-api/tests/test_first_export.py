"""A client's stock export, set up by staff in the console (SC-84): uploaded through a signed link, handed to the Data
agent as the workspace's Setup upload is, mapped once the agent's report names it, and kept through a journey reset,
so the workspace's Setup opens mapped and its operator only confirms the guardrails."""

from tests.test_workspace import AGENT, PRIYA, WS, agent

C = "/v1/console/clients/munchly"
# the map the Data agent reports with the stock file (agents' data.FIELD)
COLUMNS = [["distributor", "distributor_name"], ["sku", "item_code"], ["batch", "batch_no"], ["units", "closing_qty"]]


def due(cloud) -> list[dict]:
    return [p["payload"] for p in cloud.publisher.sent if p["payload"].get("type") == "export.uploaded"]


async def upload(api, cloud, h, name: str = "dms_export_2026-10-01.csv") -> tuple[dict, str]:
    """the console's two steps: the link, the file in the bucket, then arrived"""
    r = await api.post(f"{C}/exports", json={"contentType": "text/csv", "bytes": 2048, "fileName": name}, headers=h)
    assert r.status_code == 200, r.text
    link = r.json()
    obj = link["url"].split("exports-test/", 1)[1].split("?", 1)[0]
    cloud.storage.objects[("exports-test", obj)] = b"distributor_name,item_code\n"
    r = await api.post(f"{C}/exports/{link['id']}", json={"fileName": name}, headers=h)
    assert r.status_code == 200, r.text
    return r.json(), f"gs://exports-test/{obj}"


async def test_the_story_starts_with_munchlys_export_mapped(api, neha):
    fx = (await api.get(C, headers=neha)).json()["firstExport"]
    assert (fx["status"], fx["file"], fx["rows"], fx["by"]) == (
        "mapped",
        "dms_export_2026-10-01.csv",
        312,
        "Neha Kulkarni",
    )
    assert fx["columns"][0] == {"field": "distributor", "column": "distributor_name"} and len(fx["columns"]) == 8
    # a client nobody has set up an export for has none
    others = (await api.get("/v1/console/clients", headers=neha)).json()
    assert [x["firstExport"] for x in others if x["id"] != "munchly"] == [None] * (len(others) - 1)


async def test_staff_upload_a_clients_export_and_the_data_agent_maps_it(api, munchly, neha, cloud):
    client, uri = await upload(api, cloud, neha)
    fx = client["firstExport"]
    assert (fx["status"], fx["file"], fx["by"]) == ("mapping", "dms_export_2026-10-01.csv", "Neha Kulkarni")
    assert [x["field"] for x in fx["columns"]][:3] == ["distributor", "sku", "batch"]
    assert {x["column"] for x in fx["columns"]} == {None}  # every field waits for the agent
    # the Data agent gets the file, as from the workspace's Setup
    assert (due(cloud)[-1]["client"], due(cloud)[-1]["file"]) == ("munchly", uri)
    line = (await api.get("/v1/console/audit", headers=neha)).json()[0]
    assert (line["who"], line["text"]) == (
        "Neha Kulkarni",
        "Uploaded Munchly Foods' stock export dms_export_2026-10-01.csv; the Data agent maps and loads it",
    )
    # its report names the file: mapped, with what the file brought
    batches = (await api.get("/internal/clients/munchly/batches", headers=AGENT)).json()["batches"]
    await agent(
        api, "/exports", "data-up", "data", batches=batches, mapped=8, rows=312, days=90, file=uri, columns=COLUMNS
    )
    fx = (await api.get(C, headers=neha)).json()["firstExport"]
    assert (fx["status"], fx["rows"], fx["batches"], fx["by"]) == ("mapped", 312, len(batches), "Neha Kulkarni")
    assert fx["columns"] == [{"field": f, "column": col} for f, col in COLUMNS]
    assert fx["distributors"] == len((await api.get(C, headers=neha)).json()["distributors"])
    # the workspace's Setup opens mapped
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    assert (snap["setup"]["mapped"], snap["setup"]["confirmed"]) == (8, False)


async def test_a_journey_started_again_keeps_the_export_mapped(api, munchly, neha, cloud, ctx):
    from sc_api.services.journey import reset

    _, uri = await upload(api, cloud, neha)
    batches = (await api.get("/internal/clients/munchly/batches", headers=AGENT)).json()["batches"]
    await agent(api, "/exports", "data-up", "data", batches=batches, mapped=8, rows=312, days=90, file=uri)
    assert (await api.post(f"{WS}/setup/confirm", headers=PRIYA)).status_code == 200
    await reset.reset(ctx, "munchly")
    await ctx.session.flush()
    snap = (await api.get(f"{WS}/snapshot", headers=PRIYA)).json()
    # the mapping stays; only the confirmation goes back to not given
    assert (snap["setup"]["mapped"], snap["setup"]["confirmed"]) == (8, False)
    fx = (await api.get(C, headers=neha)).json()["firstExport"]
    assert (fx["status"], fx["by"]) == ("mapped", "Neha Kulkarni")


async def test_an_export_must_arrive_and_be_a_size_staff_may_send(api, munchly, neha):
    r = await api.post(f"{C}/exports", json={"contentType": "text/csv", "bytes": 21 * 1024 * 1024}, headers=neha)
    assert r.status_code == 422 and r.json()["message"] == "An export must be under 20 MB."
    link = (await api.post(f"{C}/exports", json={"contentType": "text/csv", "bytes": 10}, headers=neha)).json()
    r = await api.post(f"{C}/exports/{link['id']}", json={}, headers=neha)
    assert r.status_code == 422 and r.json()["message"] == "The export has not arrived yet. Upload it again."
    assert (
        await api.post("/v1/console/clients/nope/exports", json={"contentType": "text/csv", "bytes": 10}, headers=neha)
    ).status_code == 404
    assert (await api.post(f"{C}/exports", json={"contentType": "text/csv", "bytes": 10})).status_code == 401

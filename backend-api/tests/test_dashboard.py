"""SC-48: the Overview's dashboard and its page of batches, as aggregates over the database: Munchly's day (the story's
6 Oct, noon in India) and what changes when a batch closes."""

from sc_api.services import supply

D = "/v1/console/dashboard"
B = "/v1/console/batches"


async def test_the_dashboard_over_a_week(api, neha):
    r = await api.get(f"{D}?days=7", headers=neha)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["readAt"] == "12:00:00" and d["days"] == 7
    assert [x["label"] for x in d["byDay"]] == ["30 Sep", "1 Oct", "2 Oct", "3 Oct", "4 Oct", "5 Oct", "6 Oct"]
    # the hero batch's recovery counts on the day it was flagged, while it waits for the return window
    assert [x["recovered"] for x in d["byDay"]] == [0, 0, 21152.4, 0, 0, 0, 0]
    assert d["recovered"] == 21152.4 and d["recoveredBefore"] == 0
    assert d["inFlight"] == 9 and d["inFlightClients"] == 1
    assert d["inFlightSeries"] == [0, 0, 9, 9, 9, 9, 9]
    assert d["byStop"] == [0, 7, 0, 0, 0, 0, 1, 0, 1]
    assert d["waiting"] == 0 and "oldestWaiting" not in d
    # today's runs, as the story has them
    assert d["runsToday"] == 8 and d["byDay"][-1]["runs"] == 8


async def test_the_dashboard_counts_a_closed_batch_and_one_waiting(api, neha, ctx, clock):
    await supply.close_batch(ctx, "munchly", "MF-2410-402", recovered=31_500, outcome="cleared")
    await supply.open_batch(
        ctx,
        "munchly",
        ref="MF-2410-499",
        sku="poha",
        distributor="patil",
        units=600,
        done=5,
        current=5,
        best_before=clock.today(),
        at=clock.now().replace(hour=6),
    )
    d = (await api.get(f"{D}?days=7", headers=neha)).json()
    assert d["byDay"][-1]["recovered"] == 31_500 and d["byDay"][-1]["closed"] == 1 and d["byDay"][-1]["units"] == 1200
    assert d["waiting"] == 1 and d["oldestWaiting"] == {"hours": 6, "client": "Munchly Foods"}
    assert d["inFlight"] == 9 and d["byStop"][5] == 1
    only = (await api.get(f"{D}?days=7&client=nobody", headers=neha)).json()
    assert only["inFlight"] == 0 and only["recovered"] == 0


async def test_the_dashboard_takes_a_week_a_month_or_a_quarter(api, neha):
    for days in (7, 30, 90):
        assert len((await api.get(f"{D}?days={days}", headers=neha)).json()["byDay"]) == days
    r = await api.get(f"{D}?days=10", headers=neha)
    assert r.status_code == 422 and r.json()["message"] == "Show 7, 30 or 90 days."


async def test_a_page_of_batches_the_fewest_days_left_first(api, neha):
    p = (await api.get(B, headers=neha)).json()
    assert (p["total"], p["page"], p["size"], len(p["rows"])) == (9, 1, 8, 8)
    assert p["counts"] == {"inFlight": 9, "waiting": 0, "closed": 0}
    first = p["rows"][0]
    assert first == {
        "client": "munchly",
        "ref": "MF-2410-118",
        "product": "Mango Drink 200 ml",
        "distributor": "Lakshmi Agencies",
        "city": "Hyderabad",
        "stage": 6,
        "done": 6,
        "daysLeft": 18,
        "units": 2000,
        "value": 40000.0,
        "valueKind": "mrp",
        "updated": "2 Oct",
        "closed": False,
    }
    hero = next(x for x in p["rows"] if x["ref"] == "MF-2409-117")
    assert (hero["value"], hero["valueKind"]) == (21152.4, "recovered")
    second = (await api.get(f"{B}?page=2", headers=neha)).json()
    assert [x["ref"] for x in second["rows"]] == ["GL-2410-012"]


async def test_batches_filtered_searched_and_sorted(api, neha):
    chips = (await api.get(f"{B}?q=chips", headers=neha)).json()
    assert sorted(x["ref"] for x in chips["rows"]) == ["MF-2408-209", "MF-2409-117"] and chips["total"] == 2
    assert (await api.get(f"{B}?q=Nagpur", headers=neha)).json()["total"] == 2  # Rakesh Traders: chips and face wash
    assert (await api.get(f"{B}?stop=1", headers=neha)).json()["total"] == 7
    top = (await api.get(f"{B}?sort=value&dir=desc", headers=neha)).json()["rows"][0]
    assert (top["ref"], top["value"]) == ("MF-2409-204", 115200.0)
    assert (await api.get(f"{B}?status=closed", headers=neha)).json()["total"] == 0
    assert (await api.get(f"{B}?client=nobody", headers=neha)).json()["counts"]["inFlight"] == 0
    r = await api.get(f"{B}?size=10", headers=neha)
    assert r.status_code == 422 and r.json()["message"] == "Show 8, 16 or 32 rows a page."
    assert (await api.get(f"{B}?status=lost", headers=neha)).status_code == 422


async def test_a_closed_batch_lists_what_it_recovered(api, neha, ctx):
    await supply.close_batch(ctx, "munchly", "MF-2410-402", recovered=31_500, outcome="cleared")
    p = (await api.get(f"{B}?status=closed", headers=neha)).json()
    assert p["counts"] == {"inFlight": 8, "waiting": 0, "closed": 1}
    row = p["rows"][0]
    assert (row["ref"], row["value"], row["valueKind"], row["closed"], row["outcome"], row["updated"]) == (
        "MF-2410-402",
        31500.0,
        "recovered",
        True,
        "cleared",
        "12:00",
    )


async def test_the_dashboard_needs_staff(api):
    assert (await api.get(D)).status_code == 401
    assert (await api.get(B)).status_code == 401


async def test_the_api_answers_what_platform_js_answers(api, neha):
    """the Overview's figures and pages, as design3's mock backend computes them on the same day (rules.json)"""
    from sc_api.services.reference import load

    fixtures = load("rules.json")
    for case in fixtures["dashboard"]:
        got = (await api.get(f"{D}?days={case['days']}", headers=neha)).json()
        assert got == case["figures"], case["days"]
    for case in fixtures["batchPages"]:
        got = (await api.get(B, params=case["query"], headers=neha)).json()
        assert got == case["page"], case["query"]

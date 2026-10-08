"""What the workspace app reads from backend-api at five moments of the story's journey, written out for the frontend's
live-source test (frontend/workspace/tests/live/), so the screens are drawn on real answers rather than hand-made ones.

It runs only when asked: scripts/live-fixtures.sh sets LIVE_FIXTURES_OUT and runs this file alone. Each moment's file
holds the public workspace, and for each person the snapshot, the cases they see, the quarter and the audit log, exactly
as the API answered them."""

import json
import os
from pathlib import Path

import pytest

from tests.test_workspace import (
    AGRAWAL,
    ANITA,
    ARJUN,
    GANESH,
    HERO,
    LAKSHMI,
    MANGO,
    MEERA,
    PRIYA,
    RAKESH,
    VIKRAM,
    WS,
    J,
    agent,
    detect,
    put_photo,
    setup,
    token,
)

OUT = os.environ.get("LIVE_FIXTURES_OUT")
pytestmark = pytest.mark.skipif(not OUT, reason="writes the frontend's fixtures only when LIVE_FIXTURES_OUT is set")
WHO = {
    "priya": PRIYA,
    "rakesh": RAKESH,
    "ganesh": GANESH,
    "agrawal": AGRAWAL,
    "meera": MEERA,
    "anita": ANITA,
    "vikram": VIKRAM,
    "arjun": ARJUN,
    "lakshmi-owner": LAKSHMI,
}


async def _write(api, moment: str, people: list[str]) -> None:
    out: dict = {"public": (await api.get(WS)).json(), "members": {}}
    for who in people:
        h = WHO[who]
        snap = (await api.get(f"{WS}/snapshot", headers=h)).json()
        cases = {}
        for c in snap["cases"]:
            r = await api.get(f"{WS}/cases/{c['ref']}", headers=h)
            if r.status_code == 200:
                cases[c["ref"]] = r.json()
        q = await api.get(f"{WS}/quarter", headers=h)
        a = await api.get(f"{WS}/audit", headers=h)
        out["members"][who] = {
            "snapshot": snap,
            "cases": cases,
            "quarter": q.json() if q.status_code == 200 else None,
            "audit": a.json()["rows"] if a.status_code == 200 else [],
        }
    path = Path(OUT) / f"{moment}.json"
    path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n")


async def test_write_the_live_fixtures(api, munchly, cloud):
    # before the journey: the setup to confirm, the permission to give
    await _write(api, "start", ["priya", "rakesh", "arjun"])

    await setup(api)
    assert await detect(api) == [HERO, MANGO]
    await agent(api, f"/cases/{HERO}/photo-request", "vision-ask", "vision")
    await _write(api, "at-risk", ["priya", "rakesh"])

    await put_photo(api, cloud, HERO)
    label = J["label"]
    await agent(
        api,
        f"/cases/{HERO}/photo-read",
        "vision-read",
        "vision",
        read={"batch": HERO, "mrp": label["mrp"], "confidence": 0.97},
    )
    await agent(api, f"/cases/{HERO}/valuation", "valuer", "valuer")
    await agent(api, f"/cases/{HERO}/plan", "router", "router")
    await _write(api, "planned", ["priya", "rakesh", "anita"])

    assert (await api.post(f"{WS}/cases/{HERO}/approval", json={"device": "phone"}, headers=PRIYA)).status_code == 200
    await agent(api, f"/cases/{HERO}/listing", "lister", "lister")
    await agent(api, f"/cases/{HERO}/offer", "outreach", "outreach")
    # the Mango Drink runs its own journey to its donation (SC-86): Lakshmi Agencies' label, the plan, Priya's yes
    await agent(api, f"/cases/{MANGO}/photo-request", "vision-ask-m", "vision")
    await put_photo(api, cloud, MANGO, LAKSHMI)
    read = {"batch": MANGO, "mrp": J["labels"][MANGO]["mrp"], "confidence": 0.96}
    await agent(api, f"/cases/{MANGO}/photo-read", "vision-read-m", "vision", read=read)
    await agent(api, f"/cases/{MANGO}/valuation", "valuer-m", "valuer")
    await agent(api, f"/cases/{MANGO}/plan", "router-m", "router")
    assert (
        await api.post(f"{WS}/cases/{MANGO}/approval", json={"device": "desktop"}, headers=PRIYA)
    ).status_code == 200
    await agent(api, f"/cases/{MANGO}/offer", "outreach-m", "outreach")
    await agent(api, f"/cases/{MANGO}/donation", "donation", "outreach")
    nagpur = [k for k in J["kiranas"] if k["distributor"] == "rakesh"]
    for k in nagpur[:5]:
        member = next(x for x in J["members"] if x["id"] == k["member"])
        r = await api.post(f"{WS}/cases/{HERO}/orders", json={"units": k["orders"]}, headers=token(member["login"]))
        assert r.status_code == 200, r.text
    r = await api.post(f"{WS}/cases/{HERO}/bids", json={"price": 13}, headers=AGRAWAL)
    bid = r.json()["case"]["journey"]["bids"][-1]
    await agent(api, f"/cases/{HERO}/bids/{bid['id']}/answer", "negotiator-1", "negotiator")
    await _write(api, "executing", ["priya", "rakesh", "ganesh", "agrawal", "meera", "lakshmi-owner"])

    for k in nagpur[5:]:
        if not k["orders"]:
            continue
        member = next(x for x in J["members"] if x["id"] == k["member"])
        r = await api.post(f"{WS}/cases/{HERO}/orders", json={"units": k["orders"]}, headers=token(member["login"]))
        assert r.status_code == 200, r.text
    assert (await api.post(f"{WS}/cases/{HERO}/bids/{bid['id']}/accept", headers=AGRAWAL)).status_code == 200
    assert (await api.post(f"{WS}/cases/{MANGO}/donation/confirm", headers=MEERA)).status_code == 200
    assert (await api.post(f"{WS}/cases/{MANGO}/donation/collect", headers=MEERA)).status_code == 200
    assert (await api.post(f"{WS}/cases/{HERO}/dispatches", json={"kind": "truck"}, headers=RAKESH)).status_code == 200
    await agent(api, f"/cases/{HERO}/documents", "paperwork", "paperwork")
    assert (await api.post(f"{WS}/cases/{HERO}/documents/invoice/issue", headers=RAKESH)).status_code == 200
    assert (await api.post(f"{WS}/cases/{HERO}/review", headers=ANITA)).status_code == 200
    assert (await api.post(f"{WS}/cases/{HERO}/dispatches", json={"kind": "van"}, headers=RAKESH)).status_code == 200
    await agent(api, f"/cases/{HERO}/report", "impact", "impact")
    # the Mango Drink to its report too (SC-86): three of Lakshmi Agencies' kiranas order, the scheme closes, the staff
    # sale is recorded, and its papers (no invoice) follow the last of its lines; at its report the packs left at the
    # godown settle by Munchly's expiry policy, full credit (SC-94)
    hyd = [k for k in J["kiranas"] if k["distributor"] == "lakshmi"][:3]
    for k in hyd:
        member = next(x for x in J["members"] if x["id"] == k["member"])
        r = await api.post(
            f"{WS}/cases/{MANGO}/orders", json={"units": 4 * k["sales14"]}, headers=token(member["login"])
        )
        assert r.status_code == 200, r.text
    await agent(api, f"/cases/{MANGO}/offer/close", "close-m", "outreach")
    r = await api.post(f"{WS}/cases/{MANGO}/staff-sale", json={"sold": 120}, headers=LAKSHMI)
    assert r.status_code == 200, r.text
    await agent(api, f"/cases/{MANGO}/documents", "paperwork-m", "paperwork")
    assert (await api.post(f"{WS}/cases/{MANGO}/dispatches", json={"kind": "van"}, headers=LAKSHMI)).status_code == 200
    await agent(api, f"/cases/{MANGO}/report", "impact-m", "impact")
    await _write(api, "cleared", ["priya", "rakesh", "anita", "vikram", "arjun", "meera", "lakshmi-owner"])

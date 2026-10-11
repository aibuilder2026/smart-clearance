"""SC-158: walks the Mango Drink's happy path on the live stack, one stage at a time, and captures each person's
screens at every stage for the demo film (capture.mjs). The same calls as backend-api's walk (sc_api.cli.walk), for the
Mango Drink alone: the chips stay flagged and waiting for their photo. The journey's pushes are written down as the
film's pop-ups (pushes.json). Run through director.sh, which sets the walk's environment.

  director.sh [--day-minutes 2] [--from STAGE] [--skip-captures]
"""

import argparse
import os
import asyncio
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

import httpx
from sc_api.cli import walk as W
from sc_api.cli.walk import LAKSHMI, Tokens, Walk, load, say, world

HERE = Path(__file__).resolve().parent
PORT = os.environ.get("PORT", "8001")
W.API = f"http://localhost:{PORT}"
W.WS = f"{W.API}/v1/workspaces/munchly"
W.ORIGIN = os.environ.get("WS_ORIGIN", "http://localhost:5175")  # the browser key allows this referrer; the API allows it too
CAPTURE = HERE / "capture.mjs"
STAGES = ["quiet", "detect", "verified", "planned", "approved", "ordered", "staff", "collected", "papers", "van", "ledger", "console"]


def capture(stage: str, enabled: bool) -> None:
    if not enabled:
        return
    say(f"capturing {stage}")
    r = subprocess.run(["node", str(CAPTURE), "--stage", stage], cwd=HERE, text=True, capture_output=True)
    for line in (r.stdout + r.stderr).strip().splitlines():
        print("   ", line, flush=True)


async def run(day_minutes: int, start: str, captures: bool) -> None:
    uids, w = world()
    mango = next(b["id"] for b in load("journey.json")["batches"] if b.get("second"))
    WS, C = W.WS, "/v1/console/clients/munchly"
    begin = STAGES.index(start)
    pushes: dict[str, Any] = {}

    def keep(c: dict[str, Any] | None) -> None:
        if c and c.get("push"):
            pushes.update(c["push"])

    async with httpx.AsyncClient(base_url=W.API, timeout=60) as http:
        walk = Walk(Tokens(uids), http)

        async def case(who: str = "priya") -> dict[str, Any] | None:
            c = await walk.case(who, mango)
            keep(c)
            return c

        snap = await walk.call("priya", "GET", f"{WS}/snapshot")
        say(f"signed in as {snap['me']['name']}; journey day 0 is {snap['clock']['day0']}")
        if not snap["setup"]["confirmed"]:
            body: bytes = w["csv"]
            link = await walk.call("priya", "POST", f"{WS}/setup/exports", {"contentType": "text/csv", "bytes": len(body)})
            r = await walk.http.put(link["url"], content=body, headers=link["headers"])
            if r.status_code >= 300:
                raise SystemExit(f"director: Cloud Storage refused the export: {r.status_code}")
            await walk.call("priya", "POST", f"{WS}/setup/exports/{link['id']}")

            async def mapped():
                return (await walk.call("priya", "GET", f"{WS}/snapshot"))["setup"]["mapped"]

            await walk.until("the Data agent mapped the export", mapped)
            await walk.call("priya", "POST", f"{WS}/setup/confirm")
            say("Priya confirmed Setup")
        dist = (await walk.call(LAKSHMI, "GET", f"{WS}/snapshot"))["distributors"]
        if not dist["lakshmi"]["permission"]:
            await walk.call(LAKSHMI, "POST", f"{WS}/permission")
            say("Lakshmi Agencies gave the one-time permission")
        await walk.call("neha", "PUT", f"{C}/clock", {"dayMinutes": day_minutes})
        say(f"Neha set Munchly's journey day to {day_minutes} min")

        # 0. the quiet morning
        if begin <= 0 and not await case():
            capture("quiet", captures)

        # 1. detect
        if begin <= 1:
            if not await case():
                await walk.call("neha", "POST", f"{C}/agents/watcher/runs")
                say("Neha ran the Watcher from the console")
                await walk.until(f"the Watcher flagged {mango}", case)

            async def photo_asked():
                c = await case(LAKSHMI)
                return c if c and c["journey"]["photo"]["status"] == "requested" else None

            c = await case()
            if c["journey"]["photo"]["status"] in ("none", "requested"):
                await walk.until("Vision asked Lakshmi Agencies for the label photo", photo_asked)
                capture("detect", captures)

        # 2. verify
        if begin <= 2:
            c = await case(LAKSHMI)
            if c["journey"]["photo"]["status"] == "requested":
                path = W.REPO / "agents/evals/vision/images/mango.webp"
                data = path.read_bytes()
                link = await walk.call(LAKSHMI, "POST", f"{WS}/cases/{mango}/photos", {"contentType": "image/webp", "bytes": len(data)})
                r = await walk.http.put(link["url"], content=data, headers=link["headers"])
                if r.status_code >= 300:
                    raise SystemExit(f"director: Cloud Storage refused the photo: {r.status_code}")
                await walk.call(LAKSHMI, "POST", f"{WS}/cases/{mango}/photos/{link['id']}")
                say("Lakshmi Agencies sent the label photo")

            async def planned():
                c = await case()
                return c if c and c["journey"]["phase"] == "planned" else None

            c = await walk.until("Vision read the label, the Valuer priced it, the Router planned it", planned)
            lines = ", ".join(f"{x['id']} {x['units']}" for x in c["plan"]["lines"])
            say(f"  plan: net ₹{c['plan']['net']:,.0f}, {lines}")
            capture("verified", captures)
            capture("planned", captures)

        # 3. the yes
        if begin <= 3:
            c = await case()
            if c["journey"]["phase"] == "planned":
                await walk.call("priya", "POST", f"{WS}/cases/{mango}/approval", {"device": "phone"})
                say("Priya approved the plan from her phone")

            async def executing():
                c = await case()
                j = c and c["journey"]
                return c if j and j.get("offer") and c.get("donation") else None

            c = await walk.until("Outreach sent the scheme and Donation booked a food bank", executing)
            say(f"  offer to {c['journey']['offer']['shops']} kiranas; {c['donation']['units']} packs to {c['donation']['partner']}")
            await asyncio.sleep(3)
            capture("approved", captures)

        # 4. the kiranas order
        if begin <= 4:
            members = {x["id"]: x for x in load("journey.json")["members"]}
            c = await case()
            already = {o.get("shop") or o.get("kirana") for o in (c["journey"].get("orders") or [])}
            ordered = 0
            for k in w["kiranas"]:
                if not k["orders"] or k["distributor"] != "lakshmi" or members[k["member"]]["id"] not in walk.t.uids:
                    continue
                if k["name"] in already:
                    continue
                r = await walk.http.request("POST", f"{WS}/cases/{mango}/orders", json={"units": k["orders"]}, headers=await walk.t.header(k["member"]))
                if r.status_code in (200, 204):
                    ordered += k["orders"]
                if ordered == k["orders"]:  # the first shop's order: capture the kirana's own view once it has ordered
                    pass
            say(f"Lakshmi Agencies' kiranas ordered {ordered} packets")
            await asyncio.sleep(3)
            capture("ordered", captures)

        # 5. the staff sale
        if begin <= 5:
            c = await case(LAKSHMI)
            staff = (c or {}).get("journey", {}).get("staff")
            if staff and staff["status"] == "open":
                await walk.call(LAKSHMI, "POST", f"{WS}/cases/{mango}/staff-sale", {"sold": staff["units"]})
                say(f"Lakshmi Agencies recorded the staff sale: {staff['units']} packs")
            await asyncio.sleep(2)
            capture("staff", captures)

        # 6. the donation
        if begin <= 6:
            c = await case("meera")
            if c and c["donation"] and c["donation"]["status"] == "booked":
                await walk.call("meera", "POST", f"{WS}/cases/{mango}/donation/confirm")
                say("Meera confirmed the pickup")
                await asyncio.sleep(2)
                await walk.call("meera", "POST", f"{WS}/cases/{mango}/donation/collect")
                say("Meera collected the packs")
            elif c and c["donation"] and c["donation"]["status"] == "confirmed":
                await walk.call("meera", "POST", f"{WS}/cases/{mango}/donation/collect")
                say("Meera collected the packs")
            await asyncio.sleep(3)
            capture("collected", captures)

        # 7. the papers: once every line is done (the scheme closes itself once full, else its window closes early)
        if begin <= 7:
            async def papers():
                c = await case()
                return c if c and c["docs"] else None

            c = await case()
            if not c["docs"]:
                j = await walk.call("neha", "GET", f"{C}/journey")
                closer = next((t for t in j["triggers"] if t.get("key") == "offer.close" and not t.get("blocked")), None)
                if closer and (c["journey"].get("offer") or {}).get("status") not in ("closed", "filled"):
                    await walk.call("neha", "POST", f"{C}/journey/triggers/{closer['id']}")
                    say("Neha closed the offer window from the console")
            c = await walk.until("Paperwork drafted the papers", papers)
            say("  " + ", ".join(f"{d['type']} {d['no'] or ''}" for d in c["docs"]))
            await asyncio.sleep(8)  # the PDFs follow
            capture("papers", captures)

        # 8. the review and the van round
        if begin <= 8:
            c = await case()
            if not c.get("reviewed"):
                await walk.call("priya", "POST", f"{WS}/cases/{mango}/review")
                say("Priya reviewed the pack")
            if not (c["journey"].get("van") or {}).get("ran"):
                r = await walk.http.request("POST", f"{WS}/cases/{mango}/dispatches", json={"kind": "van"}, headers=await walk.t.header(LAKSHMI))
                say(f"Lakshmi Agencies ran the van round ({r.status_code})")
            await asyncio.sleep(3)
            capture("van", captures)

        # 9. the report: Impact posts on expiry day; Neha calls it from the console
        if begin <= 9:
            async def posted():
                c = await case()
                return c if c and c.get("ledger") else None

            c = await case()
            if not c.get("ledger"):
                j = await walk.call("neha", "GET", f"{C}/journey")
                rep = next((t for t in j["triggers"] if str(t.get("key", "")).startswith("report") and not t.get("blocked")), None)
                if not rep:
                    say("  no report trigger is ready: " + json.dumps([(t.get("key"), t.get("blocked")) for t in j["triggers"]]))
                else:
                    await walk.call("neha", "POST", f"{C}/journey/triggers/{rep['id']}")
                    say("Neha fired the report from the console")
            c = await walk.until("Impact posted the ledger", posted)
            say(f"  actual net ₹{(c['actual'] or {}).get('net', 0):,.0f}; the batch is {c['journey']['phase']}")
            await asyncio.sleep(5)
            capture("ledger", captures)
        if begin <= 10:
            capture("console", captures)

        await walk.call("neha", "PUT", f"{C}/clock", {"dayMinutes": 1440})
        say("Neha set Munchly's journey day back to 24 hours")
        (HERE / "pushes.json").write_text(json.dumps(pushes, indent=1, ensure_ascii=False))
        say(f"kept {len(pushes)} pushes in pushes.json")


async def dump() -> None:
    """the run's figures, for film.py: the case as Priya sees it, its ledger row, and the pushes it carries"""
    uids, _ = world()
    mango = next(b["id"] for b in load("journey.json")["batches"] if b.get("second"))
    async with httpx.AsyncClient(base_url=W.API, timeout=60) as http:
        walk = Walk(Tokens(uids), http)
        c = await walk.case("priya", mango)
        ledger = await walk.call("priya", "GET", f"{W.WS}/ledger")
        row = next((r for r in ledger.get("batches", ledger.get("rows", [])) if r.get("ref") == mango), None)
        out = {"case": c, "ledgerRow": row, "ledger": {k: v for k, v in ledger.items() if k != "batches"}}
        (HERE / "figures.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
        if c and c.get("push"):
            (HERE / "pushes.json").write_text(json.dumps(c["push"], indent=1, ensure_ascii=False))
        say(f"figures.json: phase {c and c['journey']['phase']}, plan net {c and c['plan'] and c['plan']['net']}, ledger row {'yes' if row else 'no'}")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dump-only", action="store_true", help="write figures.json and pushes.json from the case as it stands")
    p.add_argument("--day-minutes", type=int, default=2)
    p.add_argument("--from", dest="start", choices=STAGES, default="quiet")
    p.add_argument("--skip-captures", action="store_true")
    a = p.parse_args()
    if a.dump_only:
        asyncio.run(dump())
        return
    asyncio.run(run(a.day_minutes, a.start, not a.skip_captures))


if __name__ == "__main__":
    main()

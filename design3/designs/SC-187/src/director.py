"""SC-187: walks BOTH demo batches' happy paths on the live stack, one stage at a time, exactly as backend-api's walk
(sc_api.cli.walk.steps) does, and captures each person's screens at every stage for the demo film (capture.mjs). Each
stage is skipped when the state shows it is done, so the walk can be run again from where it stopped. The pushes
backend-api composes for both batches are kept as the film's pop-ups (pushes.json, keyed by batch ref), and the run's
figures (both cases, the ledger, each batch's row) in figures.json. Run through director.sh, which sets the walk's
environment (the main checkout's lib.sh, SC_REPO).

  director.sh [--day-minutes 2] [--from STAGE] [--skip-captures]
  director.sh --state                     # where both batches stand, and exit
  director.sh --capture STAGE [--only NAME]   # only the captures of one stage (after a failed shot)
  director.sh --dump-only                 # figures.json and pushes.json from the cases as they stand
"""

import argparse
import asyncio
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

import httpx
from sc_api.cli import walk as W
from sc_api.cli.walk import LAKSHMI, Tokens, Walk, load, say, world
from sc_api.domain.journey import PHASES

HERE = Path(__file__).resolve().parent
PORT = os.environ.get("PORT", "8000")
W.API = f"http://localhost:{PORT}"
W.WS = f"{W.API}/v1/workspaces/munchly"
W.ORIGIN = os.environ.get("WS_ORIGIN", "http://localhost:5175")
CAPTURE = HERE / "capture.mjs"
STAGES = ["quiet", "detect", "plan", "approve", "orders", "deal", "donation", "settle", "papers", "ledger", "history"]
C = "/v1/console/clients/munchly"
WAIT = 480  # the agents on live Gemini, with room for retries


def phase_at_least(c: dict[str, Any] | None, phase: str) -> bool:
    return bool(c) and PHASES.index(c["journey"]["phase"]) >= PHASES.index(phase)


def capture(stage: str, enabled: bool, only: str | None = None) -> None:
    if not enabled:
        return
    say(f"capturing {stage}")
    cmd = ["node", str(CAPTURE), "--stage", stage]
    if only:
        cmd += ["--only", only]
    r = subprocess.run(cmd, cwd=HERE, text=True, capture_output=True)
    for line in (r.stdout + r.stderr).strip().splitlines():
        print("   ", line, flush=True)


class Director:
    def __init__(self, walk: Walk, hero: str, mango: str, w: dict[str, Any]):
        self.walk, self.hero, self.mango, self.w = walk, hero, mango, w
        self.pushes: dict[str, dict[str, Any]] = {}

    async def case(self, ref: str, who: str = "priya") -> dict[str, Any] | None:
        c = await self.walk.case(who, ref)
        if c and c.get("push"):
            self.pushes.setdefault(ref, {}).update(c["push"])
        return c

    async def both(self) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
        return await self.case(self.hero), await self.case(self.mango)

    async def wait_phase(self, ref: str, phase: str, what: str) -> dict[str, Any]:
        async def check():
            c = await self.case(ref)
            return c if c and c["journey"]["phase"] == phase else None

        return await self.walk.until(what, check, within=WAIT)

    def save_pushes(self) -> None:
        (HERE / "pushes.json").write_text(json.dumps(self.pushes, indent=1, ensure_ascii=False))

    async def state(self) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for ref in (self.hero, self.mango):
            c = await self.case(ref)
            if not c:
                out[ref] = None
                continue
            j = c["journey"]
            out[ref] = {
                "phase": j["phase"],
                "photo": j["photo"]["status"],
                "plan": c["plan"] and c["plan"]["net"],
                "listing": j.get("listing") and j["listing"]["status"],
                "offer": j.get("offer") and j["offer"]["status"],
                "orders": len(j.get("orders") or []),
                "bids": [(b["status"], b.get("counter")) for b in (j.get("bids") or [])],
                "award": j.get("award"),
                "staff": j.get("staff") and j["staff"]["status"],
                "donation": c.get("donation") and c["donation"]["status"],
                "truck": j.get("truck") and j["truck"].get("status"),
                "van": j.get("van") and j["van"].get("status"),
                "docs": [(d["id"], d.get("no"), d["status"], d.get("pdf")) for d in (c.get("docs") or [])],
                "invoiceIssued": j.get("invoiceIssued"),
                "reviewed": j.get("reviewed"),
                "ledger": bool(c.get("ledger")),
                "actual": c.get("actual") and c["actual"].get("net"),
            }
        return out


async def preamble(d: Director) -> None:
    walk, w, WS = d.walk, d.w, W.WS
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

        await walk.until("the Data agent mapped the export", mapped, within=WAIT)
        await walk.call("priya", "POST", f"{WS}/setup/confirm")
        say("Priya confirmed Setup")
    for who, key in (("rakesh", "rakesh"), (LAKSHMI, "lakshmi")):
        dist = (await walk.call(who, "GET", f"{WS}/snapshot"))["distributors"]
        if not dist[key]["permission"]:
            await walk.call(who, "POST", f"{WS}/permission")
            say(f"{who} gave the one-time permission")


async def run(day_minutes: int, start: str, captures: bool) -> None:
    uids, w = world()
    hero = next(b["id"] for b in load("journey.json")["batches"] if b.get("hero"))
    mango = next(b["id"] for b in load("journey.json")["batches"] if b.get("second"))
    begin = STAGES.index(start)
    async with httpx.AsyncClient(base_url=W.API, timeout=60) as http:
        walk = Walk(Tokens(uids), http)
        d = Director(walk, hero, mango, w)
        WS = W.WS
        await preamble(d)

        def at(stage: str) -> bool:
            return begin <= STAGES.index(stage)

        # 0. the quiet morning, before any batch is flagged
        if at("quiet"):
            h, m_ = await d.both()
            if not h and not m_:
                capture("quiet", captures)
            else:
                say("quiet: a case is open already, skipped")
        # the compressed day only now: at 2 min a day, the tick's 09:00 check flags both batches within seconds of
        # Setup's confirmation, which would have spoilt the quiet captures
        await walk.call("neha", "PUT", f"{C}/clock", {"dayMinutes": day_minutes})
        say(f"Neha set Munchly's journey day to {day_minutes} min")

        # 1. detect: Run now starts the Watcher, which flags both batches; Vision asks for each label photo
        if at("detect"):
            h, m_ = await d.both()
            did = False
            if not (h and m_):
                await walk.call("neha", "POST", f"{C}/agents/watcher/runs")
                say("Neha ran the Watcher from the console")
                await walk.until(f"the Watcher flagged {hero}", lambda: d.case(hero), within=WAIT)
                await walk.until(f"the Watcher flagged {mango}", lambda: d.case(mango), within=WAIT)
                did = True

            def photo_asked(who: str, ref: str):
                async def check():
                    c = await d.case(ref, who)
                    return c if c and c["journey"]["photo"]["status"] == "requested" else None

                return check

            h, m_ = await d.both()
            if h["journey"]["photo"]["status"] in ("none", "requested") and not phase_at_least(h, "verified"):
                await walk.until("Vision asked Rakesh for the chips' label photo", photo_asked("rakesh", hero), within=WAIT)
                did = True
            if m_["journey"]["photo"]["status"] in ("none", "requested") and not phase_at_least(m_, "verified"):
                await walk.until("Vision asked Lakshmi Agencies for the Mango Drink's", photo_asked(LAKSHMI, mango), within=WAIT)
                did = True
            if did or start == "detect":
                capture("detect", captures)
            else:
                say("detect: both flagged and asked already, skipped")

        # 2. verify and plan: each distributor's photo to Cloud Storage, then Vision reads, the Valuer prices, the Router plans
        if at("plan"):
            images = W.REPO / "agents/evals/vision/images"
            did = False
            for who, ref, name in (("rakesh", hero, "story-clean.webp"), (LAKSHMI, mango, "mango.webp")):
                c = await d.case(ref, who)
                if c and c["journey"]["photo"]["status"] == "requested":
                    data = (images / name).read_bytes()
                    link = await walk.call(who, "POST", f"{WS}/cases/{ref}/photos", {"contentType": "image/webp", "bytes": len(data)})
                    r = await walk.http.put(link["url"], content=data, headers=link["headers"])
                    if r.status_code >= 300:
                        raise SystemExit(f"director: Cloud Storage refused the photo: {r.status_code}")
                    await walk.call(who, "POST", f"{WS}/cases/{ref}/photos/{link['id']}")
                    say(f"{who} sent {ref}'s label photo ({name})")
                    did = True
            for ref in (hero, mango):
                c = await d.case(ref)
                if c and c["journey"]["phase"] in ("at-risk", "verified", "valued"):
                    c = await d.wait_phase(ref, "planned", f"Vision read {ref}'s label, the Valuer priced it, the Router planned it")
                    did = True
                if c and c.get("plan"):
                    lines = ", ".join(f"{x['id']} {x['units']}" for x in c["plan"]["lines"])
                    say(f"  {ref} plan: net ₹{c['plan']['net']:,.2f}, {lines}")
            if did or start == "plan":
                capture("plan", captures)
            else:
                say("plan: both planned already, skipped")

        # 3. the yes, then the agents execute each plan's lines: the listing, the schemes, the donation
        if at("approve"):
            did = False
            for ref, device in ((hero, "phone"), (mango, "desktop")):
                c = await d.case(ref)
                if c and c["journey"]["phase"] == "planned":
                    await walk.call("priya", "POST", f"{WS}/cases/{ref}/approval", {"device": device})
                    say(f"Priya approved {ref} ({device})")
                    did = True

            def executing(ref: str, *need: str):
                async def check():
                    c = await d.case(ref)
                    j = c and c["journey"]
                    return c if j and all(j.get(k) or (c.get(k) if k == "donation" else None) for k in need) else None

                return check

            c = await walk.until("the Lister listed the chips and Outreach sent its scheme", executing(hero, "listing", "offer"), within=WAIT)
            say(f"  listing {c['journey']['listing']['id']}, offer to {c['journey']['offer']['shops']} kiranas")
            c = await walk.until("Outreach sent the Mango's scheme and Donation booked a food bank", executing(mango, "offer", "donation"), within=WAIT)
            gift = c["donation"]
            say(f"  offer to {c['journey']['offer']['shops']} kiranas; {gift['units']} packs to {gift['partner']}")
            if did or start == "approve":
                await asyncio.sleep(3)
                capture("approve", captures)
            else:
                say("approve: both approved already, skipped")

        # 4. each cluster's kiranas order their own share, by distributor
        if at("orders"):
            members = {x["id"]: x for x in load("journey.json")["members"]}
            did = False
            for ref, dist in ((hero, "rakesh"), (mango, "lakshmi")):
                c = await d.case(ref)
                already = {o.get("by") or o.get("shop") or o.get("kirana") for o in ((c or {}).get("journey", {}).get("orders") or [])}
                placed = len((c or {}).get("journey", {}).get("orders") or [])
                ordered = 0
                for k in w["kiranas"]:
                    if not k["orders"] or k["distributor"] != dist or members[k["member"]]["id"] not in walk.t.uids:
                        continue
                    if placed and (k["name"] in already or k["member"] in already or k["id"] in already):
                        continue
                    r = await walk.http.request("POST", f"{WS}/cases/{ref}/orders", json={"units": k["orders"]}, headers=await walk.t.header(k["member"]))
                    if r.status_code in (200, 204):
                        ordered += k["orders"]
                        did = True
                    else:
                        say(f"  {k['name']}'s order answered {r.status_code}: {r.text[:120]}")
                say(f"{dist}'s kiranas ordered {ordered} packets of {ref} (had {placed} orders before)")
            if did or start == "orders":
                await asyncio.sleep(4)
                capture("orders", captures)
            else:
                say("orders: placed already, skipped")

        # 5. the deal: Agrawal bids, the Negotiator counters, Agrawal takes it
        if at("deal"):
            c = await d.case(hero, "agrawal")
            did = False
            if not c["journey"].get("award"):
                bids = c["journey"].get("bids") or []
                live = next((b for b in bids if b["status"] in ("open", "countered")), None)
                if not live:
                    r = await walk.call("agrawal", "POST", f"{WS}/cases/{hero}/bids", {"price": 13})
                    bid = r["case"]["journey"]["bids"][-1]["id"]
                    say("Agrawal bid ₹13 a packet")
                else:
                    bid = live["id"]

                async def countered():
                    c = await d.case(hero, "agrawal")
                    b = next((b for b in c["journey"]["bids"] if b["id"] == bid), None)
                    return b if b and b["status"] == "countered" else None

                b = await walk.until("the Negotiator countered", countered, within=WAIT)
                say(f"  counter ₹{b['counter']:.2f}")
                await walk.call("agrawal", "POST", f"{WS}/cases/{hero}/bids/{bid}/accept")
                say("Agrawal took the counter and paid the token")
                did = True
            c = await d.case(hero)
            aw = c["journey"].get("award") or {}
            say(f"  award: {aw.get('units')} at ₹{aw.get('price')}, token ₹{aw.get('token')}")
            if did or start == "deal":
                await asyncio.sleep(3)
                capture("deal", captures)
            else:
                say("deal: awarded already, skipped")

        # 6. the Mango's other lines: Lakshmi Agencies' staff sale on its receipt, and Meera's pickup
        if at("donation"):
            did = False
            m_ = await d.case(mango, LAKSHMI)
            staff = (m_ or {}).get("journey", {}).get("staff")
            if staff and staff["status"] == "open":
                data = (W.REPO / f"backend-api/src/sc_api/reference/receipts/{mango}.webp").read_bytes()
                link = await walk.call(LAKSHMI, "POST", f"{WS}/cases/{mango}/staff-sale/receipt", {"contentType": "image/webp", "bytes": len(data)})
                r = await walk.http.put(link["url"], content=data, headers=link["headers"])
                if r.status_code >= 300:
                    raise SystemExit(f"director: Cloud Storage refused the receipt: {r.status_code}")
                await walk.call(LAKSHMI, "POST", f"{WS}/cases/{mango}/staff-sale/receipt/{link['id']}")

                async def receipt_read():
                    c = await d.case(mango, LAKSHMI)
                    rc = (c or {}).get("journey", {}).get("staff", {}).get("receipt") or {}
                    return rc if rc.get("status") in ("read", "unreadable") else None

                rc = await walk.until("Vision read the staff sale's receipt", receipt_read, within=WAIT)
                say(f"  Vision read {rc.get('no')}: {len(rc.get('payments') or [])} UPI payments, ₹{rc.get('paid')}")
                sold = round(float(rc.get("paid") or 0) / float(staff["price"])) if rc.get("status") == "read" else staff["units"]
                await walk.call(LAKSHMI, "POST", f"{WS}/cases/{mango}/staff-sale", {"sold": sold, "receipt": link["id"]})
                say(f"Lakshmi Agencies recorded the staff sale at {staff['godown']}: {sold} of {staff['units']} packs")
                did = True
            m_ = await d.case(mango, "meera")
            dn = (m_ or {}).get("donation") or {}
            if dn.get("status") == "booked":
                await walk.call("meera", "POST", f"{WS}/cases/{mango}/donation/confirm")
                await walk.call("meera", "POST", f"{WS}/cases/{mango}/donation/collect")
                say(f"Meera confirmed and collected {dn['units']} packs at {dn.get('from')}")
                did = True
            elif dn.get("status") == "confirmed":
                await walk.call("meera", "POST", f"{WS}/cases/{mango}/donation/collect")
                say(f"Meera collected {dn['units']} packs")
                did = True
            if did or start == "donation":
                await asyncio.sleep(4)
                capture("donation", captures)
            else:
                say("donation: the staff sale recorded and the pickup collected already, skipped")

        # 7. settle: the truck, then Paperwork drafts both packs (and their PDFs follow)
        if at("settle"):
            did = False
            c = await d.case(hero, "rakesh")
            if not c["docs"]:
                r = await walk.http.request("POST", f"{WS}/cases/{hero}/dispatches", json={"kind": "truck"}, headers=await walk.t.header("rakesh"))
                say(f"Rakesh loaded the buyer's truck ({r.status_code}{'' if r.status_code < 300 else ' ' + r.text[:120]})")
                did = True

            def papers(ref: str):
                async def check():
                    c = await d.case(ref)
                    return c if c and c["docs"] else None

                return check

            for ref in (hero, mango):
                c = await d.case(ref)
                if not c["docs"]:
                    c = await walk.until(f"Paperwork drafted {ref}'s papers", papers(ref), within=WAIT)
                    did = True
                say(f"  {ref}: " + ", ".join(f"{x['type']} {x.get('no') or ''}".strip() for x in c["docs"]))

            async def pdfs():
                ok = True
                for ref in (hero, mango):
                    c = await d.case(ref)
                    for x in c["docs"]:
                        if x["status"] in ("drafted", "generated", "issued") and x["id"] in ("invoice", "support", "itc", "fssai", "receipt", "staff") and not x.get("pdf"):
                            ok = False
                return ok

            if did or start == "settle":
                # the PDFs are not essential to the captures, so wait for them softly
                ends = time.monotonic() + 150
                while time.monotonic() < ends and not await pdfs():
                    await asyncio.sleep(3)
                say("  the PDFs are in" if await pdfs() else "  some PDFs are still to come")
                capture("settle", captures)
            else:
                say("settle: both packs drafted already, skipped")

        # 8. the papers: Rakesh issues his invoice, Priya reviews both packs, both van rounds run
        if at("papers"):
            did = False
            c = await d.case(hero)
            if not c["journey"].get("invoiceIssued"):
                await walk.call("rakesh", "POST", f"{WS}/cases/{hero}/documents/invoice/issue")
                say("Rakesh issued the invoice from Tally")
                did = True
            for ref in (hero, mango):
                c = await d.case(ref)
                if not c["journey"].get("reviewed"):
                    await walk.call("priya", "POST", f"{WS}/cases/{ref}/review")
                    say(f"Priya reviewed {ref}'s pack")
                    did = True
            for who, ref in (("rakesh", hero), (LAKSHMI, mango)):
                c = await d.case(ref, who)
                van = (c["journey"].get("van") or {})
                if van.get("status") not in ("done", "ran", "delivered"):
                    r = await walk.http.request("POST", f"{WS}/cases/{ref}/dispatches", json={"kind": "van"}, headers=await walk.t.header(who))
                    say(f"{who} ran the van round for {ref} ({r.status_code}{'' if r.status_code < 300 else ' ' + r.text[:120]})")
                    did = did or r.status_code < 300
            for ref in (hero, mango):
                c = await d.case(ref)
                say(f"  {ref} is {c['journey']['phase']}; actual net ₹{(c['actual'] or {}).get('net', 0):,.2f}; van {(c['journey'].get('van') or {}).get('status')}")
            if did or start == "papers":
                await asyncio.sleep(8)  # the issued invoice's PDF with its e-invoice follows
                capture("papers", captures)
            else:
                say("papers: issued, reviewed and delivered already, skipped")

        # 9. the report: expiry day, called early from the console for each batch; Impact posts each ledger
        if at("ledger"):
            did = False
            for ref in (hero, mango):
                c = await d.case(ref)
                if c.get("ledger"):
                    continue
                j = await walk.call("neha", "GET", f"{C}/journey")
                rep = next((t for t in j["triggers"] if t.get("key") == "report.due" and t.get("ref") == ref and not t.get("blocked")), None)
                if not rep:
                    say(f"  no report trigger is ready for {ref}: " + json.dumps([(t.get("key"), t.get("ref"), t.get("blocked")) for t in j["triggers"]]))
                    continue
                await walk.call("neha", "POST", f"{C}/journey/triggers/{rep['id']}")
                say(f"Neha fired {ref}'s report from the console")
                did = True

            def posted(ref: str):
                async def check():
                    c = await d.case(ref)
                    return c if c and c.get("ledger") and c["journey"]["phase"] == "cleared" else None

                return check

            for ref in (hero, mango):
                c = await walk.until(f"Impact posted {ref}'s ledger", posted(ref), within=WAIT)
                say(f"  {ref}: actual net ₹{(c['actual'] or {}).get('net', 0):,.2f}; the batch is {c['journey']['phase']}")
            if did or start == "ledger":
                await asyncio.sleep(5)
                capture("ledger", captures)
            else:
                say("ledger: both cleared already, skipped")

        # 10. the history: a pilot-quarter batch destroyed at the godown, independent of the walk
        if at("history"):
            capture("history", captures)

        await walk.call("neha", "PUT", f"{C}/clock", {"dayMinutes": 1440})
        say("Neha set Munchly's journey day back to 24 hours")
        d.save_pushes()
        say(f"kept pushes for {list(d.pushes)} in pushes.json")
        await dump(d)


async def dump(d: Director) -> None:
    """the run's figures: both cases as Priya sees them, the ledger, and each batch's ledger row"""
    walk = d.walk
    cases = {ref: await d.case(ref) for ref in (d.hero, d.mango)}
    ledger = await walk.call("priya", "GET", f"{W.WS}/ledger")
    batches = ledger.get("batches", ledger.get("rows", []))
    rows = {ref: next((r for r in batches if r.get("ref") == ref), None) for ref in cases}
    out = {"cases": cases, "rows": rows, "ledger": ledger}
    (HERE / "figures.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
    for ref, c in cases.items():
        say(f"figures.json: {ref} phase {c and c['journey']['phase']}, plan net {c and c['plan'] and c['plan']['net']}, actual {c and c.get('actual') and c['actual'].get('net')}, ledger row {'yes' if rows[ref] else 'no'}")
    d.save_pushes()


async def standalone(mode: str, stage: str | None = None, only: str | None = None) -> None:
    uids, w = world()
    hero = next(b["id"] for b in load("journey.json")["batches"] if b.get("hero"))
    mango = next(b["id"] for b in load("journey.json")["batches"] if b.get("second"))
    async with httpx.AsyncClient(base_url=W.API, timeout=60) as http:
        d = Director(Walk(Tokens(uids), http), hero, mango, w)
        if mode == "state":
            snap = await d.walk.call("priya", "GET", f"{W.WS}/snapshot")
            j = await d.walk.call("neha", "GET", f"{C}/journey")
            print(json.dumps({"clock": j["clock"], "setup": snap["setup"], "distributors": {k: v.get("permission") for k, v in snap["distributors"].items()}, "cases": await d.state(), "triggers": [(t["key"], t.get("ref"), t.get("blocked")) for t in j["triggers"]]}, indent=1, ensure_ascii=False, default=str))
        elif mode == "dump":
            await dump(d)
        elif mode == "capture":
            capture(stage or "", True, only)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--state", action="store_true", help="print where both batches stand, and exit")
    p.add_argument("--dump-only", action="store_true", help="write figures.json and pushes.json from the cases as they stand")
    p.add_argument("--capture", choices=STAGES, help="only run one stage's captures")
    p.add_argument("--only", help="with --capture: one capture by name")
    p.add_argument("--day-minutes", type=int, default=2)
    p.add_argument("--from", dest="start", choices=STAGES, default="quiet")
    p.add_argument("--skip-captures", action="store_true")
    a = p.parse_args()
    if a.state:
        asyncio.run(standalone("state"))
    elif a.dump_only:
        asyncio.run(standalone("dump"))
    elif a.capture:
        asyncio.run(standalone("capture", a.capture, a.only))
    else:
        asyncio.run(run(a.day_minutes, a.start, not a.skip_captures))


if __name__ == "__main__":
    main()

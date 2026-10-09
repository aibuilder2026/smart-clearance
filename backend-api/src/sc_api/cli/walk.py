"""Munchly's live journey, walked (SC-73, SC-75): every person's step over HTTP against backend-api (this machine's, or
production's with --api and --allow-env prod), signed in through Firebase Authentication, while the agents answer
through Pub/Sub, BigQuery and Cloud Storage. It checks the whole loop the workspace app runs on, with no browser.

- Each person signs in with a Firebase custom token, minted as sc-api-local (impersonated in code) and exchanged with
  the workspace's browser key: no password is handled, typed or printed.
- The walk follows the story, both demo batches at once (SC-86): Priya uploads the day's stock export in Setup and
  confirms it, Rakesh gives the one-time permission, Run now starts the Watcher, which flags the chips and the Mango
  Drink; Rakesh and Lakshmi Agencies each send their label photo to Cloud Storage, Priya approves both, each cluster's
  kiranas order, Agrawal bids and takes the counter, Lakshmi Agencies records the staff sale, Meera collects the
  donation, Rakesh loads the truck, issues the invoice and runs his van, Lakshmi Agencies runs hers, Priya reviews the
  papers. Meanwhile Priya's SSE stream is read, and counted.
- It reads no database: the people's uids are the ones hydrate gives them (identity.synthetic_uid), and the stock export
  is the story's batches as the journey stages them (reference/journey.json, the story's own calendar).
- Locally, scripts/hydrate.sh --reset makes a fresh world and --journey-reset munchly starts the journey again. In
  production the agents call live Gemini, about GBP 0.05-0.10 a journey: walk it there only on the maintainer's yes.

  backend-api/scripts/walk.sh [--day-minutes N] [--until STEP]
  backend-api/scripts/walk.sh --api https://backend-api-….run.app --origin https://munchly-smartclearance.web.app \
      --allow-env prod
"""

import argparse
import asyncio
import json
import time
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import httpx

from sc_api.identity import synthetic_uid
from sc_api.services.journey import dms
from sc_api.services.reference import load
from sc_api.settings import get_settings

# where the walk goes: this machine's backend-api and workspace app, unless --api and --origin say otherwise (main)
API = "http://localhost:8000"
WS = f"{API}/v1/workspaces/munchly"
ORIGIN = "http://localhost:5175"
REPO = Path(__file__).resolve().parents[4]
STEPS = ["setup", "detect", "photo", "plan", "approve", "orders", "deal", "donation", "settle", "papers"]
T0 = time.monotonic()


def say(text: str) -> None:
    print(f"walk {time.monotonic() - T0:6.1f}s  {text}", flush=True)


def browser_key() -> str:
    for line in (REPO / "frontend/workspace/.env.local").read_text().splitlines():
        if line.startswith("PUBLIC_FIREBASE_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("walk: no frontend/workspace/.env.local; run backend-api/scripts/app-env.sh")


class Tokens:
    """Firebase ID tokens for the people the walk acts as. Each comes from a Firebase custom token: a JWT signed with
    the impersonated sc-api-local's own signer (IAM signBlob through the operator's impersonation, as the API signs its
    upload links), exchanged at Identity Toolkit with the workspace's browser key"""

    AUD = "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit"

    def __init__(self, uids: dict[str, str]):
        from sc_api.gcp import credentials

        self.creds = credentials()
        self.uids, self.key, self.cache = uids, browser_key(), {}

    def custom(self, uid: str) -> str:
        import base64

        def b64(b: bytes) -> str:
            return base64.urlsafe_b64encode(b).rstrip(b"=").decode()

        sa = self.creds.signer_email
        now = int(time.time())
        claims = {"iss": sa, "sub": sa, "aud": self.AUD, "iat": now, "exp": now + 3600, "uid": uid}
        head = b64(json.dumps({"alg": "RS256", "typ": "JWT"}).encode()) + "." + b64(json.dumps(claims).encode())
        return head + "." + b64(self.creds.sign_bytes(head.encode()))

    async def header(self, who: str) -> dict[str, str]:
        if who not in self.cache:
            custom = await asyncio.to_thread(self.custom, self.uids[who])
            async with httpx.AsyncClient(timeout=20) as c:
                r = await c.post(
                    f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={self.key}",
                    json={"token": custom, "returnSecureToken": True},
                    headers={"Referer": ORIGIN + "/"},
                )
            if r.status_code != 200:
                raise SystemExit(f"walk: Firebase refused {who}'s custom token: {r.text[:200]}")
            self.cache[who] = r.json()["idToken"]
        return {"Authorization": f"Bearer {self.cache[who]}", "Origin": ORIGIN}


class Walk:
    def __init__(self, tokens: Tokens, http: httpx.AsyncClient):
        self.t, self.http = tokens, http
        self.heard: list[str] = []

    async def call(self, who: str, method: str, path: str, body: Any = None, ok: tuple[int, ...] = (200, 204)) -> Any:
        r = await self.http.request(method, path, json=body, headers=await self.t.header(who))
        if r.status_code not in ok:
            raise SystemExit(f"walk: {who} {method} {path} answered {r.status_code}: {r.text[:300]}")
        return r.json() if r.content else None

    async def case(self, who: str, ref: str) -> dict[str, Any] | None:
        r = await self.http.get(f"{WS}/cases/{ref}", headers=await self.t.header(who))
        return r.json() if r.status_code == 200 else None

    async def until(self, what: str, check, within: float = 240) -> Any:
        ends = time.monotonic() + within
        while time.monotonic() < ends:
            got = await check()
            if got:
                say(f"  {what}")
                return got
            await asyncio.sleep(2)
        raise SystemExit(f"walk: timed out waiting for {what}")

    async def listen(self, who: str) -> None:
        """Priya's live stream, for as long as the walk lasts: what it hears is counted"""
        while True:
            try:
                async with self.http.stream(
                    "GET", f"{WS}/events/stream", headers={**await self.t.header(who), "Accept": "text/event-stream"}
                ) as r:
                    async for line in r.aiter_lines():
                        if line.startswith("event: "):
                            self.heard.append(line[7:])
            except httpx.HTTPError, asyncio.CancelledError:
                return


def world() -> tuple[dict[str, str], dict[str, Any]]:
    """the uids of the people the walk acts as, and the day's stock export, from the reference data alone"""
    j = load("journey.json")
    s = get_settings()
    logins = {x["id"]: x["login"] for x in j["members"]}
    emails = {**logins, "neha": f"neha.kulkarni@{s.staff_email_domain}"}
    uids = {who: synthetic_uid(e) for who, e in emails.items()}
    # the open batches as the journey stages them on the story's calendar (reset.py), as dms.stock_rows writes them
    rows = []
    for b in j["batches"]:
        d, x = j["distributors"][b["distributor"]], j["skus"][b["sku"]]
        pin = ((d.get("pins") or "").split(",")[0].strip() or "400") + "008"
        best = (date.fromisoformat(j["day0"]) + timedelta(days=b["daysLeft"])).isoformat()
        rows.append(
            [d["name"], x["code"], b["id"], b.get("mfg") or best, best, b["units"], d.get("godown") or d["city"], pin]
        )
    return uids, {"csv": dms._csv(dms.STOCK, rows), "kiranas": j["kiranas"], "logins": logins}


LAKSHMI = "lakshmi-owner"  # Lakshmi Agencies' own account, the Mango Drink's distributor


async def run(day_minutes: int, until: str) -> None:
    uids, w = world()
    hero = next(b["id"] for b in load("journey.json")["batches"] if b.get("hero"))
    mango = next(b["id"] for b in load("journey.json")["batches"] if b.get("second"))
    async with httpx.AsyncClient(base_url=API, timeout=60) as http:
        walk = Walk(Tokens(uids), http)
        listener = asyncio.create_task(walk.listen("priya"))
        stop = STEPS.index(until) if until in STEPS else len(STEPS) - 1
        try:
            await steps(walk, w, hero, mango, day_minutes, stop)
        finally:
            listener.cancel()
            await asyncio.gather(listener, return_exceptions=True)
        counts = {k: walk.heard.count(k) for k in sorted(set(walk.heard))}
        say(f"Priya's stream heard {len(walk.heard)} events: {json.dumps(counts)}")


async def steps(walk: Walk, w: dict[str, Any], hero: str, mango: str, day_minutes: int, stop: int) -> None:
    C = "/v1/console/clients/munchly"
    # 1. connect: the day's stock export through Setup, the mapping confirmed, the permission given
    snap = await walk.call("priya", "GET", f"{WS}/snapshot")
    say(f"signed in as {snap['me']['name']} ({snap['me']['email']}); journey day 0 is {snap['clock']['day0']}")
    if not snap["setup"]["confirmed"]:
        body: bytes = w["csv"]
        link = await walk.call("priya", "POST", f"{WS}/setup/exports", {"contentType": "text/csv", "bytes": len(body)})
        r = await walk.http.put(link["url"], content=body, headers=link["headers"])
        if r.status_code >= 300:
            raise SystemExit(f"walk: Cloud Storage refused the export: {r.status_code} {r.text[:200]}")
        await walk.call("priya", "POST", f"{WS}/setup/exports/{link['id']}")
        say("Priya uploaded the day's stock export to Cloud Storage; the Data agent maps it")

        async def mapped():
            return (await walk.call("priya", "GET", f"{WS}/snapshot"))["setup"]["mapped"]

        await walk.until("the Data agent mapped it and loaded BigQuery", mapped)
        await walk.call("priya", "POST", f"{WS}/setup/confirm")
        say("Priya confirmed the mapping and the guardrails")
    if not (await walk.call("rakesh", "GET", f"{WS}/snapshot"))["distributors"]["rakesh"]["permission"]:
        await walk.call("rakesh", "POST", f"{WS}/permission")
        say("Rakesh gave the one-time permission")
    await walk.call("neha", "PUT", f"{C}/clock", {"dayMinutes": day_minutes})
    say(f"Neha set Munchly's journey day to {day_minutes} min in the console")
    if stop < 1:
        return

    # 2. detect: Run now starts the Watcher, which flags the chips batch and the Mango Drink, each its own journey
    await walk.call("neha", "POST", f"{C}/agents/watcher/runs")
    say("Neha ran the Watcher from the console")
    await walk.until(f"the Watcher flagged {hero}", lambda: walk.case("priya", hero))
    await walk.until(f"the Watcher flagged {mango}", lambda: walk.case("priya", mango))

    def photo_asked(who: str, ref: str):
        async def check():
            c = await walk.case(who, ref)
            return c and c["journey"]["photo"]["status"] == "requested"

        return check

    await walk.until("Vision asked Rakesh for the chips' label photo", photo_asked("rakesh", hero))
    await walk.until("Vision asked Lakshmi Agencies for the Mango Drink's", photo_asked(LAKSHMI, mango))
    if stop < 2:
        return

    # 3. verify: each distributor's photo straight to Cloud Storage, then Vision reads it
    images = REPO / "agents/evals/vision/images"
    for who, ref, name in (("rakesh", hero, "story-clean.webp"), (LAKSHMI, mango, "mango.webp")):
        path = images / name
        data = path.read_bytes() if path.exists() else b"\xff\xd8\xff"
        link = await walk.call(
            who, "POST", f"{WS}/cases/{ref}/photos", {"contentType": "image/webp", "bytes": len(data)}
        )
        r = await walk.http.put(link["url"], content=data, headers=link["headers"])
        if r.status_code >= 300:
            raise SystemExit(f"walk: Cloud Storage refused the photo: {r.status_code}")
        await walk.call(who, "POST", f"{WS}/cases/{ref}/photos/{link['id']}")
        say(f"{who} sent {ref}'s label photo ({name if path.exists() else 'a placeholder'})")
    if stop < 3:
        return

    def phase_is(ref: str, phase: str):
        async def check():
            c = await walk.case("priya", ref)
            return c if c and c["journey"]["phase"] == phase else None

        return check

    for ref in (hero, mango):
        c = await walk.until(
            f"Vision read {ref}'s label, the Valuer priced it, the Router planned it", phase_is(ref, "planned")
        )
        lines = ", ".join(f"{x['id']} {x['units']}" for x in c["plan"]["lines"])
        say(f"  plan: net ₹{c['plan']['net']:,.0f}, {lines}")
    if stop < 4:
        return

    # 4. approve, then the agents execute each plan's lines: the listing, the schemes, the donation
    await walk.call("priya", "POST", f"{WS}/cases/{hero}/approval", {"device": "phone"})
    await walk.call("priya", "POST", f"{WS}/cases/{mango}/approval", {"device": "desktop"})
    say("Priya approved both: the chips on her phone, the Mango Drink at her desk")

    def executing(ref: str, *need: str):
        async def check():
            c = await walk.case("priya", ref)
            j = c and c["journey"]
            return c if j and all(j.get(k) or (c.get(k) if k == "donation" else None) for k in need) else None

        return check

    c = await walk.until(
        "the Lister listed the chips and Outreach sent its scheme", executing(hero, "listing", "offer")
    )
    say(f"  listing {c['journey']['listing']['id']}, offer to {c['journey']['offer']['shops']} kiranas")
    c = await walk.until(
        "Outreach sent the Mango's scheme and Donation booked a food bank", executing(mango, "offer", "donation")
    )
    gift = c["donation"]
    say(f"  offer to {c['journey']['offer']['shops']} kiranas; {gift['units']} packs to {gift['partner']}")
    if stop < 5:
        return

    # 5. each cluster's kiranas order their own share, by distributor
    members = {x["id"]: x for x in load("journey.json")["members"]}
    for ref, dist in ((hero, "rakesh"), (mango, "lakshmi")):
        ordered = 0
        for k in w["kiranas"]:
            if not k["orders"] or k["distributor"] != dist or members[k["member"]]["id"] not in walk.t.uids:
                continue
            await walk.call(k["member"], "POST", f"{WS}/cases/{ref}/orders", {"units": k["orders"]})
            ordered += k["orders"]
        say(f"{dist}'s kiranas ordered {ordered} packets of {ref}")
    if stop < 6:
        return

    # 6. the deal: Agrawal bids, the Negotiator counters, Agrawal takes it
    r = await walk.call("agrawal", "POST", f"{WS}/cases/{hero}/bids", {"price": 13})
    bid = r["case"]["journey"]["bids"][-1]["id"]
    say("Agrawal bid ₹13 a packet")

    async def countered():
        c = await walk.case("agrawal", hero)
        b = c and c["journey"]["bids"][-1]
        return b if b and b["status"] == "countered" else None

    b = await walk.until("the Negotiator countered", countered)
    say(f"  counter ₹{b['counter']:.2f}")
    await walk.call("agrawal", "POST", f"{WS}/cases/{hero}/bids/{bid}/accept")
    say("Agrawal took the counter and paid the token")
    if stop < 7:
        return

    # 7. the Mango's other lines: Lakshmi Agencies' staff sale, and Meera's pickup
    m_ = await walk.case(LAKSHMI, mango)
    staff = (m_ or {}).get("journey", {}).get("staff")
    if staff and staff["status"] == "open":
        await walk.call(LAKSHMI, "POST", f"{WS}/cases/{mango}/staff-sale", {"sold": staff["units"]})
        say(f"Lakshmi Agencies recorded the staff sale at {staff['godown']}: {staff['units']} packs")
    m_ = await walk.case("meera", mango)
    if m_ and m_["donation"] and m_["donation"]["status"] == "booked":
        await walk.call("meera", "POST", f"{WS}/cases/{mango}/donation/confirm")
        await walk.call("meera", "POST", f"{WS}/cases/{mango}/donation/collect")
        say(f"Meera confirmed and collected {m_['donation']['units']} packs at {m_['donation']['from']}")
    if stop < 8:
        return

    # 8. settle: the truck, then Paperwork drafts the pack
    await walk.call("rakesh", "POST", f"{WS}/cases/{hero}/dispatches", {"kind": "truck"})
    say("Rakesh loaded the buyer's truck")

    async def papers():
        c = await walk.case("priya", hero)
        return c if c and c["docs"] else None

    c = await walk.until("Paperwork drafted the papers", papers)
    say("  " + ", ".join(f"{d['type']} {d['no']}" for d in c["docs"] if d["no"]))

    async def mango_papers():
        c = await walk.case("priya", mango)
        return c if c and c["docs"] else None

    c = await walk.until("Paperwork drafted the Mango Drink's papers", mango_papers)
    say("  " + ", ".join(f"{d['type']}" for d in c["docs"]))
    if stop < 9:
        return

    # 9. the papers: Rakesh issues his invoice, Priya reviews, the van round runs
    await walk.call("rakesh", "POST", f"{WS}/cases/{hero}/documents/invoice/issue")
    await walk.call("priya", "POST", f"{WS}/cases/{hero}/review")
    await walk.call("rakesh", "POST", f"{WS}/cases/{hero}/dispatches", {"kind": "van"})
    c = await walk.case("priya", hero)
    say(f"Rakesh issued the invoice, Priya reviewed the pack, the van ran; the batch is {c['journey']['phase']}")
    say(f"  actual net ₹{(c['actual'] or {}).get('net', 0):,.0f}; the report follows on journey time")
    await walk.call(LAKSHMI, "POST", f"{WS}/cases/{mango}/dispatches", {"kind": "van"})
    c = await walk.case("priya", mango)
    left = (c["realised"] or {}).get("godown", 0)
    say(f"Lakshmi Agencies ran the van round; the Mango Drink is {c['journey']['phase']}")
    say(f"  actual net ₹{(c['actual'] or {}).get('net', 0):,.0f}, {left} packs left at the godown")


def main(argv: list[str] | None = None) -> None:
    global API, WS, ORIGIN
    p = argparse.ArgumentParser(prog="sc-walk", description=__doc__.split("\n\n")[0])
    p.add_argument("--day-minutes", type=int, default=5, help="Munchly's journey day while a batch is at risk")
    p.add_argument("--until", choices=STEPS, default=STEPS[-1], help="stop after this step")
    p.add_argument("--api", default=API, help="backend-api's address (default: this machine's)")
    p.add_argument("--origin", default=ORIGIN, help="the workspace app's address the browser key allows")
    p.add_argument("--allow-env", help="walk an environment other than local (named, to be sure): prod")
    a = p.parse_args(argv)
    API, ORIGIN = a.api.rstrip("/"), a.origin.rstrip("/")
    WS = f"{API}/v1/workspaces/munchly"
    local = API.startswith(("http://localhost", "http://127.0.0.1"))
    if not local and a.allow_env != "prod":
        raise SystemExit("walk: a backend other than this machine's is production: pass --allow-env prod to walk it")
    asyncio.run(run(a.day_minutes, a.until))


if __name__ == "__main__":
    main()

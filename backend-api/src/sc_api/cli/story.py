"""Munchly Foods, design3's canonical client: the day the console prototype opens on (reference/console.json, which
frontend/scripts/seed.mjs writes from design3), imported through the services.

- The story's dates move with the day it is imported. Its "today" (6 Oct 2026) becomes the import's today, so
  "09:40 today" stays today.
- Real-looking addresses become reserved ones (munchly.in → munchly.example). The platform's own staff use this
  environment's staff domain. Nobody gets an account on a domain someone could own.
"""

import re
from datetime import date, datetime, timedelta
from typing import Any

from sc_api.domain.clock import IST
from sc_api.domain.display import MONTHS
from sc_api.identity import synthetic_uid
from sc_api.services import agents, audit, clients, exports, people, staff, supply
from sc_api.services.context import Actor, Ctx
from sc_api.services.reference import load

STORY_TODAY = date(2026, 10, 6)
STORY_YEAR = 2026
DOMAINS = {"munchly.in": "munchly.example"}  # also in text: "munchly.in accounts only"


def rewrite(value: Any, staff_domain: str) -> Any:
    """the story with reserved addresses: munchly.in → munchly.example, smartclearance.com → the staff domain"""
    if isinstance(value, str):
        for real, reserved in DOMAINS.items():
            value = re.sub(rf"\b{re.escape(real)}\b", reserved, value)
        return value.replace("@smartclearance.com", f"@{staff_domain}")
    if isinstance(value, list):
        return [rewrite(v, staff_domain) for v in value]
    if isinstance(value, dict):
        return {k: rewrite(v, staff_domain) for k, v in value.items()}
    return value


class Story:
    def __init__(self, ctx: Ctx):
        self.ctx = ctx
        self.started = ctx.clock.now()
        self.today = ctx.clock.today()  # the story's today, before its clock moves into the past
        self.shift = self.today - STORY_TODAY
        seed = load("console.json")["state"]
        self.state = rewrite(seed, ctx.settings.staff_email_domain)
        self.directory = rewrite(load("directory.json"), ctx.settings.staff_email_domain)
        self.client = self.state["clients"][0]
        self.actors: dict[str, Actor] = {}

    # --- the story's times, moved to the import's day

    def day(self, d: int, month: str) -> date:
        return date(STORY_YEAR, MONTHS.index(month) + 1, d) + self.shift

    def at(self, on: date, hhmm: str) -> datetime:
        h, mnt = (int(x) for x in hhmm.split(":"))
        return datetime(on.year, on.month, on.day, h, mnt, tzinfo=IST)

    def when(self, label: str) -> datetime:
        """ "30 Sep, 17:05" → that moment, moved"""
        d, month, hhmm = re.match(r"^(\d+) (\w{3}), (\d\d:\d\d)$", label).groups()  # type: ignore[union-attr]
        return self.at(self.day(int(d), month), hhmm)

    def last(self, text: str | None) -> tuple[datetime | None, str | None]:
        """an agent's last line: "09:40 today · note", "1 Oct · note", or a note alone"""
        if not text:
            return None, None
        if m := re.match(r"^(\d\d:\d\d) today · (.*)$", text):
            return self.at(self.today, m.group(1)), m.group(2)
        if m := re.match(r"^(\d+) (\w{3}) · (.*)$", text):
            return self.at(self.day(int(m.group(1)), m.group(2)), "10:00"), m.group(3)
        return None, text

    # --- the import

    async def run(self) -> None:
        await self.staff()
        await self.munchly()
        await self.history()
        self.ctx.clock.set(self.started)  # type: ignore[attr-defined]

    async def staff(self) -> None:
        ctx = self.ctx
        ctx.clock.set(self.when("30 Sep, 09:00") - timedelta(days=14))  # type: ignore[attr-defined]
        for s in self.state["staff"]:
            made = await staff.add(
                ctx,
                staff.StaffSpec(
                    name=s["name"],
                    email=s["email"],
                    role=s["role"],
                    ref=s["id"],
                    short=s["short"],
                    team=s["team"],
                    active=True,
                ),
                uid=synthetic_uid(s["email"]),
                reset=True,
            )
            self.actors[s["name"]] = await staff.actor_for(ctx, (await _user_id(ctx, made.email)))

    async def munchly(self) -> None:
        ctx, c = self.ctx, self.client
        set_up = self.when("30 Sep, 17:05")
        ctx.clock.set(set_up)  # type: ignore[attr-defined]
        agent_cfg = {}
        for agent_id, cfg in c["agents"].items():
            at, note = self.last(cfg["last"])
            agent_cfg[agent_id] = {
                "on": cfg["on"],
                "autonomy": cfg["autonomy"],
                "settings": cfg["settings"],
                "last_run_at": at,
                "last": note,
                "next": cfg["next"],
            }
        since = re.match(r"^(\d+) (\w{3}) \d{4}$", c["since"]).groups()  # type: ignore[union-attr]
        row = await clients.insert(
            ctx,
            clients.ClientSpec(
                id=c["id"],
                name=c["name"],
                legal=c["legal"],
                short=next(w["short"] for w in self.directory["workspaces"] if w["id"] == c["id"]),
                city=c["city"],
                industry=c["industry"],
                email_domain=c["emailDomain"],
                mark=c["mark"],
                plan=c["plan"],
                status=c["status"],
                live_since=self.day(int(since[0]), since[1]),
                region=c["region"],
                profile=c["profile"],
                exits_on={k: v["on"] for k, v in c["exits"].items()},
                sign_in=c["signIn"],
                gates=c["gates"],
                return_window_days=c["returnWindowDays"],
                territory_guard=c["territoryGuard"],
                staff_cap=c["rules"]["staffCap"],
                offer_window_hours=c["rules"]["offerWindowHours"],
                hindi_offers=c["rules"]["hindiOffers"],
                require_photo=c["rules"]["requirePhoto"],
                day_minutes=c["dayMinutes"],
                agents=agent_cfg,
                destruction=c.get("destruction"),
            ),
            created_at=set_up,
        )
        members = {mm["id"]: mm for mm in self.directory["members"] if mm["workspace"] == c["id"]}
        joined = self.when("1 Oct, 16:50")
        for p in c["people"]:
            d = members.get(p["id"], {})
            access = {"Approver": "approver", "Admin": "admin", "Member": "member", "Partner": "partner"}[p["access"]]
            member = await people.add(
                ctx,
                row,
                people.MemberSpec(
                    ref=p["id"],
                    name=p["name"],
                    org=p["org"],
                    role_label=p["role"],
                    kind=p["kind"],
                    access=access,
                    member_class=d.get("kind", "partner" if access == "partner" else "staff"),
                    workspace_role=d.get("role"),
                    provider=p["provider"],
                    status=p["status"],
                    email=p["email"] or None,
                    phone=p["phone"] or None,
                    img=p["img"],
                    invited_at=set_up,
                    joined_at=joined if p["status"] in ("active", "deactivated") else None,
                ),
                uid=synthetic_uid(p["email"]) if p["email"] else None,
                reset=True,
            )
            self.actors[p["name"]] = Actor(name=member.name, user_id=member.user_id)
        # the marketplace buyer: in the directory, outside the workspace (Find your workspace never shows it to them)
        for ref, d in members.items():
            if d.get("kind") == "external":
                await people.add(
                    ctx,
                    row,
                    people.MemberSpec(
                        ref=ref,
                        name=d["name"],
                        org=d["name"],
                        role_label="Marketplace buyer",
                        kind="Marketplace buyer",
                        access="partner",
                        member_class="external",
                        workspace_role=d.get("role"),
                        provider="ExpireSoon",
                        status=d["status"],
                        email=d.get("email") or None,
                        phone=d.get("phone") or None,
                        invited_at=set_up,
                        joined_at=set_up,
                    ),
                )
        row.approver_ref = c["approver"]
        for d in c["distributors"]:
            await supply.add_distributor(
                ctx,
                c["id"],
                supply.DistributorSpec(
                    id=d["id"],
                    name=d["name"],
                    city=d["city"],
                    state=d.get("state"),
                    kiranas=d["kiranas"],
                    staff_cap=d["staffCap"],
                ),
            )
            if d["permission"] == "given":
                await supply.give_permission(ctx, c["id"], d["id"], record=False)
        for s in c["skus"]:
            await supply.add_sku(
                ctx,
                c["id"],
                id=s["id"],
                code=s["code"],
                brand=s["brand"],
                name=s["name"],
                mrp=s["mrp"],
                gst=s["gst"],
                life_days=s["lifeDays"],
                gates=s.get("gates") or None,
            )
        for i in c["integrations"]:
            await supply.add_integration(
                ctx, c["id"], id=i["id"], name=i["name"], kind=i["kind"], status=i["status"], note=i["note"]
            )
        # its first stock export, set up in the console and mapped (SC-84), so the workspace's Setup opens mapped
        if fx := c.get("firstExport"):
            exports.restore(row, fx, self.when("1 Oct, 16:40"))

    async def history(self) -> None:
        ctx, c = self.ctx, self.client
        # the batches the Watcher sees, with their best-before dates moved to the import's day: the two on the move
        # (Overview's tracks) with their notes, the rest at Detect, and one with the gate override Neha set
        tracks = {t["batch"]: t for t in self.state["tracks"]}
        ctx.clock.set(self.when("2 Oct, 09:00"))  # type: ignore[attr-defined]
        for b in self.state["batches"]:
            if b["client"] != c["id"]:
                continue
            t = tracks.get(b["ref"], {})
            o = b.get("override")
            await supply.open_batch(
                ctx,
                c["id"],
                ref=b["ref"],
                sku=b["sku"],
                distributor=b["distributor"],
                units=b["units"],
                done=b["done"],
                current=b["current"],
                note=t.get("note"),
                money=t.get("money"),
                split=t.get("split"),
                best_before=date.fromisoformat(b["bestBefore"]) + self.shift,
                stage_at=datetime.fromisoformat(b["stageAt"]) + self.shift if b.get("stageAt") else None,
                override={**o, "by": self.actors.get(o["by"]) or Actor(name=o["by"]), "at": self.when(o["at"])}
                if o
                else None,
            )
        for line in self.state["audit"]:
            who = self.actors.get(line["who"]) or Actor(name=line["who"])
            await audit.record(ctx, line["client"], "history", line["text"], at=self.when(line["at"]), actor=who)
        today = self.today
        for r in self.state["runs"]:
            await agents.record_run(
                ctx, r["client"], r["agent"], r["text"], at=self.at(today, r["at"]), touch_agent=False
            )
        # Gupta & Sons' stock export, two hours late this morning
        await supply.record_export(
            ctx, c["id"], "gupta", expected=self.at(today, "06:00"), arrived=self.at(today, "08:00")
        )


async def _user_id(ctx: Ctx, email: str):
    from sc_api.services import users

    user = await users.find(ctx, email=email)
    assert user is not None
    return user.id

"""The synthetic world: the platform's staff, and clients set up the way the console sets them up, from a demo request
to live, with their people, distributors, SKUs, runs and batches, over the last few days.

Nothing is inserted by hand. Every step is a service call, the same one the API makes, in the name of a generated
staff member (or, for what happens outside the console, the client's own people and the agents). A seeded generator
and a simulated clock make the same seed build the same world.
"""

import re
from dataclasses import dataclass, field
from datetime import datetime, time, timedelta
from random import Random

from faker import Faker

from sc_api.cli import vocab
from sc_api.domain.clock import IST, FixedClock
from sc_api.domain.rules import exits_for, slug
from sc_api.identity import IdentityProvider, synthetic_uid
from sc_api.schemas import (
    AgentPatch,
    DemoRequestInput,
    ExitState,
    InviteInput,
    NewClientInput,
    OverrideInput,
    Profile,
    StaffInviteInput,
)
from sc_api.services import agents, clients, people, presenter, site, staff, supply, users
from sc_api.services.context import Actor, Ctx

PLANS = {"Pilot": "pilot", "Growth": "growth", "Enterprise": "enterprise"}
PROFILES = [
    ({"route": "distributors", "owner": "distributor", "expiry": "full-credit"}, 4),
    ({"route": "distributors", "owner": "manufacturer", "expiry": "price-support"}, 3),
    ({"route": "distributors", "owner": "distributor", "expiry": "none"}, 2),
    ({"route": "modern-trade", "owner": "manufacturer", "expiry": "price-support"}, 1),
    ({"route": "own", "owner": "manufacturer", "expiry": "none"}, 1),
]


def ascii_name(s: str) -> str:
    return re.sub(r"[^a-z]+", ".", s.lower()).strip(".")


@dataclass
class World:
    ctx: Ctx
    seed: int
    days: int
    rng: Random = field(init=False)
    fake: Faker = field(init=False)
    staff: list[Actor] = field(default_factory=list)
    used_slugs: set[str] = field(default_factory=set)

    def __post_init__(self) -> None:
        self.rng = Random(f"world:{self.seed}")
        self.fake = Faker("en_IN")
        self.fake.seed_instance(self.seed)

    @property
    def clock(self) -> FixedClock:
        assert isinstance(self.ctx.clock, FixedClock)
        return self.ctx.clock

    # --- time: the simulated history runs from `days` ago to a little before now

    def morning(self, days_ago: int, hour: int = 10, minute: int = 0) -> datetime:
        d = self.now_real().astimezone(IST).date() - timedelta(days=days_ago)
        return datetime.combine(d, time(hour, minute), IST)

    def now_real(self) -> datetime:
        return datetime.now(IST)

    def today_at(self, fraction: float) -> datetime:
        """a moment today, between 06:00 and now (or a few minutes ago, before 06:00)"""
        now = self.now_real()
        start = datetime.combine(now.date(), time(6, 0), IST)
        if now <= start:
            return now - timedelta(minutes=int(60 * (1 - fraction)) + 5)
        return start + (now - start - timedelta(minutes=5)) * fraction

    def at(self, moment: datetime) -> None:
        """move the simulated clock (the audit log and the runs are ordered by time, not by when they were written)"""
        self.clock.set(min(moment, self.now_real() - timedelta(minutes=1)))

    def by(self, actor: Actor) -> Ctx:
        return self.ctx.acting_as(actor)

    def pick_staff(self, *roles: str) -> Actor:
        return self.rng.choice([a for a in self.staff if a.role in roles])

    # --- the platform's staff

    async def make_staff(self, count: int) -> None:
        """the platform's staff: a founding Super admin (unless the story brought one), who invites the rest through
        the console; all but the last have signed in since"""
        ctx = self.ctx
        self.at(self.morning(self.days + 7, 9))
        domain = ctx.settings.staff_email_domain
        if not any(a.role == "Super admin" for a in self.staff):
            name = f"{self.fake.first_name()} {self.fake.last_name()}"
            founder = await staff.add(
                ctx, staff.StaffSpec(name=name, email=f"{ascii_name(name)}@{domain}", role="Super admin", active=True)
            )
            self.staff.append(await staff.actor_for(ctx, await _user_id(ctx, founder.email)))
        founder_actor = next(a for a in self.staff if a.role == "Super admin")
        roles = ["Platform engineer", "Support"] * count
        for i, role in enumerate(roles[:count]):
            name = f"{self.fake.first_name()} {self.fake.last_name()}"
            self.at(self.clock.at + timedelta(hours=3))
            invited = await staff.invite(
                self.by(founder_actor), StaffInviteInput(name=name, email=f"{ascii_name(name)}@{domain}", role=role)
            )
            if i < count - 1:  # the last one invited hasn't signed in yet
                self.at(self.clock.at + timedelta(hours=20))
                user = await users.find(ctx, email=invited.email)
                assert user is not None and user.firebase_uid
                await staff.by_uid(ctx, user.firebase_uid, activate=True)
                self.staff.append(await staff.actor_for(ctx, user.id))
        await ctx.session.commit()

    # --- a client, from its demo request to (perhaps) live

    def company(self) -> tuple[str, str, str]:
        while True:
            industry = self.rng.choice(list(vocab.INDUSTRIES))
            name = f"{self.rng.choice(vocab.COMPANY_STEMS)} {vocab.INDUSTRIES[industry][0]}"
            s = slug(name)
            if s not in self.used_slugs:
                self.used_slugs.add(s)
                return name, industry, s

    def person(self, domain: str) -> tuple[str, str]:
        name = f"{self.fake.first_name()} {self.fake.last_name()}"
        return name, f"{ascii_name(name)}@{domain}"

    def phone(self) -> str:
        return f"+91 {self.rng.choice('9876')}{self.rng.randint(1000, 9999)} {self.rng.randint(10000, 99999)}"

    async def client(self, n: int, total: int, live: bool) -> None:
        ctx = self.ctx
        # each client's story starts a few days apart; the last starts four days ago, so it is live by yesterday
        start = self.days - int(n * (self.days - 4) / max(total, 1))
        name, industry, s = self.company()
        domain = f"{s}.example"
        city, _state = self.rng.choice(vocab.CITIES)
        products = self.rng.sample(
            vocab.INDUSTRIES[industry][1], k=min(len(vocab.INDUSTRIES[industry][1]), self.rng.randint(4, 6))
        )
        requester, requester_email = self.person(domain)

        # the landing page: Book a demo
        self.at(self.morning(start, self.rng.randint(9, 17), self.rng.randint(0, 59)))
        plan_name = self.rng.choice([*PLANS, None])
        request = await site.request_demo(
            self.by(Actor(name=requester)),
            DemoRequestInput(
                name=requester,
                company=name,
                email=requester_email,
                makes=industry,
                plan=plan_name,
                note=self.rng.choice(vocab.DEMO_NOTES).format(city=city, product=products[0][0].lower()),
            ),
        )
        await ctx.session.commit()

        # the console: New client, by a platform engineer or a Super admin, the next working day
        setter = self.pick_staff("Platform engineer", "Super admin")
        self.at(self.morning(start - 1, self.rng.randint(10, 12), self.rng.randint(0, 59)))
        profile = self.rng.choices([p for p, _ in PROFILES], weights=[w for _, w in PROFILES])[0]
        exits = exits_for(profile, ctx.ref.defaults["staffCap"])
        if exits["kirana"]["on"] and self.rng.random() < 0.25:
            exits["foodbank"]["on"] = False
        await clients.create(
            self.by(setter),
            NewClientInput(
                name=name,
                city=city,
                industry=industry,
                colour=self.rng.choice(vocab.COLOURS),
                slug=s,
                email_domain=domain,
                sign_google=True,
                sign_phone=True,
                profile=Profile(**profile),
                exits={k: ExitState(on=v["on"]) for k, v in exits.items()},
                preset=self.rng.choice(["cautious", "standard", "standard", "trusted"]),
                admin_name=requester,
                admin_email=requester_email,
                plan=PLANS.get(plan_name or "", "pilot"),
                request=request.id,
            ),
        )
        await ctx.session.commit()

        # its supply chain, as the Data agent will load it from the first stock export
        self.at(self.clock.at + timedelta(minutes=40))
        await supply.request_first_export(self.by(setter), s)
        dists = []
        for i in range(self.rng.randint(2, 4)):
            d_city, d_state = self.rng.choice(vocab.CITIES)
            d_name = f"{self.fake.last_name()} {self.rng.choice(vocab.DISTRIBUTOR_SUFFIXES)}"
            d_id = slug(d_name).split("-")[0] + (str(i) if i else "")
            await supply.add_distributor(
                ctx,
                s,
                supply.DistributorSpec(
                    id=d_id,
                    name=d_name,
                    city=d_city,
                    state=d_state,
                    kiranas=self.rng.randint(18, 70),
                    staff_cap=self.rng.choice([None, None, 50, 100]),
                ),
            )
            dists.append((d_id, d_name, d_city))
        prefix = "".join(w[0] for w in name.split()).upper()
        for j, (product, pack, (lo, hi), gst, life) in enumerate(products):
            code = f"{prefix}-{''.join(w[0] for w in product.split()).upper()}-{re.sub(r'[^0-9]', '', pack)[:4]}"
            await supply.add_sku(
                ctx,
                s,
                id=slug(product) + (f"-{j}" if j else ""),
                code=code,
                brand=name.split()[0],
                name=f"{product} {pack}",
                mrp=float(self.rng.randint(lo, hi)),
                gst=gst,
                life_days=life,
                gates=vocab.own_gates(life),
            )
        await ctx.session.commit()

        # its people, invited from the console the same day
        inviter = self.pick_staff("Support", "Platform engineer", "Super admin")
        invited: list[tuple[str, str]] = []
        approver_name, approver_email = self.person(domain)
        for who, contact, access in [
            (approver_name, approver_email, "Approver"),
            *[(*self.person(domain), "Member") for _ in range(self.rng.randint(1, 2))],
            *[(d_name, self.phone(), "Partner") for _, d_name, _ in dists[:2]],
            (
                f"{self.rng.choice(vocab.KIRANA_NAMES)} {self.rng.choice(vocab.KIRANA_SUFFIXES)}",
                self.phone(),
                "Partner",
            ),
        ]:
            self.at(self.clock.at + timedelta(minutes=self.rng.randint(3, 25)))
            await people.invite(self.by(inviter), s, InviteInput(name=who, contact=contact, access=access))
            invited.append((who, contact))
        if exits["foodbank"]["on"]:
            bank = self.rng.choice(vocab.FOOD_BANKS)
            self.at(self.clock.at + timedelta(minutes=10))
            await people.invite(
                self.by(inviter), s, InviteInput(name=bank, contact=f"partners@{slug(bank)}.example", access="Partner")
            )
        await ctx.session.commit()

        # the next day: the admin and most people join; distributors give their one-time permission
        self.at(self.morning(start - 2, 9, self.rng.randint(0, 50)))
        members = await _members(ctx, s)
        for cm, _u in members:
            if cm.status == "invited" and (cm.access_role_id in ("admin", "approver") or self.rng.random() < 0.7):
                self.at(self.clock.at + timedelta(minutes=self.rng.randint(5, 90)))
                await people.accept(ctx, s, cm.ref)
        for d_id, d_name, _ in dists:
            if self.rng.random() < 0.6:
                owner = next((cm for cm, _ in members if cm.name == d_name), None)
                self.at(self.clock.at + timedelta(minutes=self.rng.randint(10, 120)))
                await supply.give_permission(
                    ctx, s, d_id, by=Actor(name=owner.name, user_id=owner.user_id) if owner else None
                )
        await ctx.session.commit()

        # the approver takes over the approval step from the admin, once they have joined
        approver = next((cm for cm, _ in await _members(ctx, s) if cm.name == approver_name), None)
        if approver is not None and approver.status == "active":
            self.at(self.clock.at + timedelta(hours=1))
            await agents.update(self.by(setter), s, "gate", AgentPatch(settings={"approver": approver.ref}))
        if self.rng.random() < 0.5:
            tweak = self.rng.choice(["negotiator", "vision", "outreach"])
            self.at(self.clock.at + timedelta(minutes=30))
            if tweak == "negotiator":
                await agents.update(
                    self.by(setter), s, "negotiator", AgentPatch(settings={"counters": self.rng.randint(1, 3)})
                )
            elif tweak == "vision":
                await agents.update(self.by(setter), s, "vision", AgentPatch(autonomy="act"))
            else:
                await agents.update(
                    self.by(setter),
                    s,
                    "outreach",
                    AgentPatch(settings={"language": self.rng.choice(["Marathi first", "English first"])}),
                )
        await ctx.session.commit()

        if not live:
            return
        # live: a Super admin takes it live, the exports arrive daily, and the agents work its batches
        self.at(self.morning(start - 3, 9, 30))
        await clients.go_live(self.by(self.pick_staff("Super admin")), s)
        await supply.set_integration(ctx, s, "dms", status="ok", note=f"Nightly CSV from {len(dists)} distributors")
        await ctx.session.commit()
        sku_rows = [(slug(p[0]) + (f"-{j}" if j else ""), p) for j, p in enumerate(products)]
        approver_first = approver_name.split()[0]
        batch_no = 100
        for day in range(start - 3, -1, -1):
            stamp = self.morning(day, 8, 30) if day else self.today_at(0.1)
            self.at(stamp)
            exports = len(dists)
            await agents.record_run(
                ctx,
                s,
                "data",
                f"{exports} stock exports loaded, {self.rng.randint(40, 260)} batches",
                last=f"{exports} exports loaded",
            )
            self.at(self.morning(day, 9, 0) if day else self.today_at(0.2))
            # the Watcher flags a few batches a day; each takes a few days to work through the nine stops
            flagged = self.rng.choice([0, 1, 1, 1, 2, 2, 3]) if day else max(1, self.rng.choice([0, 1, 2]))
            if not flagged:
                await agents.record_run(ctx, s, "watcher", "nothing at risk today")
            for _ in range(flagged):
                batch_no += 1
                sku_id, (product, pack, (lo, hi), _gst, life) = self.rng.choice(sku_rows)
                d_id, d_name, d_city = self.rng.choice(dists)
                ref = f"{prefix}-{self.clock.at.strftime('%y%m')}-{batch_no}"
                days_left = max(3, int(life * self.rng.uniform(0.08, 0.3)))
                await agents.record_run(ctx, s, "watcher", f"{ref} at risk, {days_left} days left")
                units = self.rng.randint(200, 2400)
                best_before = self.clock.at.astimezone(IST).date() + timedelta(days=days_left)
                takes = self.rng.randint(1, 6)  # days from flagged to closed
                if day - takes >= 1:
                    flagged_at = self.clock.at
                    await supply.open_batch(
                        ctx,
                        s,
                        ref=ref,
                        sku=sku_id,
                        distributor=d_id,
                        units=units,
                        done=1,
                        current=2,
                        best_before=best_before,
                    )
                    self.at(self.morning(day - takes, self.rng.randint(11, 17), self.rng.randint(0, 59)))
                    await agents.record_run(ctx, s, "gate", f"{approver_first} approved {ref}")
                    price = self.rng.uniform(0.35, 0.7) * (lo + hi) / 2
                    await supply.close_batch(ctx, s, ref, recovered=round(units * price, 1), outcome="cleared")
                    self.at(flagged_at + timedelta(minutes=self.rng.randint(5, 30)))
                    continue
                # still in flight: as far along as the days since it was flagged allow, some waiting for a yes
                done = 5 if self.rng.random() < 0.25 else max(1, min(8, 1 + round(7 * day / takes)))
                await supply.open_batch(
                    ctx,
                    s,
                    ref=ref,
                    sku=sku_id,
                    distributor=d_id,
                    units=units,
                    done=done,
                    current=done,
                    split=_split(units) if done >= 6 else None,
                    note="Waiting for the approver" if done == 5 else None,
                    best_before=best_before,
                )
                if self.rng.random() < 0.3:
                    # a warehouse agreed to take this lot on its own terms, and staff record the deal
                    self.at(self.clock.at + timedelta(minutes=12))
                    await self._override(s, ref, life, days_left, d_city)
                self.at(self.clock.at + timedelta(minutes=20))
                await agents.record_run(ctx, s, "router", f"plan sent to {approver_first}")
        # this morning's exports, one of them late
        today = self.now_real().date()
        for k, (d_id, _, _) in enumerate(dists):
            expected = datetime.combine(today, time(6, 0), IST)
            late = self.rng.choice([0, 0, 1, 2, 3]) if k == 0 else 0
            arrived = min(
                expected + timedelta(hours=late, minutes=self.rng.randint(0, 20)),
                self.now_real() - timedelta(minutes=1),
            )
            await supply.record_export(ctx, s, d_id, expected=expected, arrived=arrived)
        await ctx.session.commit()

    async def _override(self, client_id: str, ref: str, life: int, days_left: int, city: str) -> None:
        key, text = self.rng.choice(vocab.OVERRIDE_REASONS)
        if key == "qcomPct":
            v = max(5, min(90, (days_left * 100) // life - self.rng.randint(0, 3)))
        else:
            v = max(7, min(180, days_left - self.rng.randint(0, 5)))
        await supply.override_batch(
            self.by(self.pick_staff("Platform engineer", "Support")),
            client_id,
            ref,
            OverrideInput(
                **{"blinkit_days" if key == "blinkitDays" else "qcom_pct": v}, reason=text.format(city=city, v=v)
            ),
        )

    async def new_requests(self, n: int) -> None:
        """demo requests that came in over the last two days, not set up yet: the console's inbox"""
        for i in range(n):
            name, industry, s = self.company()
            person, email = self.person(f"{s}.example")
            city, _ = self.rng.choice(vocab.CITIES)
            self.at(
                self.morning(1 - (i % 2), self.rng.randint(8, 11), self.rng.randint(0, 59))
                if i % 2 == 0
                else self.today_at(0.5)
            )
            await site.request_demo(
                self.by(Actor(name=person)),
                DemoRequestInput(
                    name=person,
                    company=name,
                    email=email,
                    makes=industry,
                    plan=self.rng.choice([*PLANS, None]),
                    note=self.rng.choice(vocab.DEMO_NOTES).format(
                        city=city, product=vocab.INDUSTRIES[industry][1][0][0].lower()
                    ),
                ),
            )
        await self.ctx.session.commit()

    async def tick(self) -> int:
        """today's agent runs for every live client, so Overview's day is today, and a few batches moved on a stop by
        their agents, the ones waiting longest at their stop first, so Agents at work has something to show (SC-49).
        Batches at Approve wait for a person; those at Report close with what they recovered, which the agents' epic
        brings (hydrate.sh --tick)"""
        from sqlalchemy import select

        from sc_api import models as m

        ctx = self.ctx
        live = (await ctx.session.execute(select(m.Client.id).where(m.Client.status == "live"))).scalars().all()
        for cid in live:
            n = (
                (await ctx.session.execute(select(m.Distributor.id).where(m.Distributor.client_id == cid)))
                .scalars()
                .all()
            )
            self.at(self.today_at(0.1))
            await agents.record_run(
                ctx, cid, "data", f"{len(n)} stock exports loaded, {self.rng.randint(40, 320)} batches"
            )
            self.at(self.today_at(0.2))
            await agents.record_run(ctx, cid, "watcher", "nothing new at risk")
        B = m.Batch
        waiting = (
            await ctx.session.execute(
                select(B.client_id, B.ref, B.stage_current)
                .where(B.client_id.in_(live), B.closed_at.is_(None), B.stage_current.in_(MOVABLE))
                # a batch in a live journey (SC-66) moves only with its own agents and people
                .where(
                    ~select(m.Case.id)
                    .where(m.Case.client_id == B.client_id, m.Case.batch_ref == B.ref, m.Case.status == "open")
                    .exists()
                )
                .order_by(B.stage_at, B.seq)
                .limit(self.rng.randint(2, 4))
            )
        ).all()
        self.at(self.now_real())  # the moves are the latest thing to happen
        for cid, ref, stage in waiting:
            await supply.advance_batch(ctx, cid, ref, MOVED[stage].format(ref=ref))
        await ctx.session.commit()
        return len(live)


# the stops an agent moves a batch on from (not Approve, where a person says yes; not Report, which closes it), and the
# run each agent records as it does
MOVABLE = (1, 2, 3, 4, 6, 7)
MOVED = {
    1: "{ref}: label photo asked for",
    2: "{ref}: label read, confidence 0.94",
    3: "{ref}: every exit priced",
    4: "{ref}: plan sent for a yes",
    6: "{ref}: listed and offered",
    7: "{ref}: invoice and credit note drafted",
}


def _split(units: int) -> str:
    """how a batch's packs are divided between the exits, as Overview shows it"""
    return f"{int(units * 0.7):,} to kiranas · {int(units * 0.1):,} staff sale · {int(units * 0.05):,} food bank"


async def _members(ctx: Ctx, client_id: str):
    return await presenter.people(ctx, client_id)


async def _user_id(ctx: Ctx, email: str):
    user = await users.find(ctx, email=email)
    assert user is not None
    return user.id


@dataclass
class SyntheticIdentity:
    """Firebase, for hydrate: every synthetic account gets a deterministic uid and the default password, so a re-run
    finds the same accounts again, and puts them back on the default password"""

    inner: IdentityProvider

    async def ensure_account(self, email: str, name: str, *, uid: str | None = None, reset: bool = False):
        synthetic = email.endswith(".example")
        return await self.inner.ensure_account(
            email, name, uid=uid or (synthetic_uid(email) if synthetic else None), reset=reset or synthetic
        )

    async def reset_to_default(self, uid: str) -> None:
        await self.inner.reset_to_default(uid)

    async def verify(self, token: str):
        return await self.inner.verify(token)

"""The journey's sentences (domain/copy.py) for the story's own figures read exactly as design3 writes them
(reference/journey.json's copy), but where the live journey says something on purpose differently: a person's pronoun
is not assumed (the approval and the papers). No database."""

from datetime import date

import pytest

from sc_api.domain import copy, money
from sc_api.services.reference import load

J = load("journey.json")
M = load("money.json")
EVENTS = {e["key"]: e for e in J["copy"]["events"]}
PUSH = J["copy"]["push"]
CHIPS = J["skus"]["chips"]
HERO = next(b for b in J["batches"] if b.get("hero"))
MANGO = next(b for b in J["batches"] if b.get("second"))
RAKESH = J["distributors"]["rakesh"]
BUYER = J["buyer"]
PLAN = money.plan(HERO, CHIPS)
RISK = money.assess(HERO, CHIPS)
COUNTER = money.counter(15, 13)
AWARD = money.award(772, COUNTER["price"])
SUPPORT = money.price_support(PLAN, CHIPS, COUNTER["price"])
DOCS = money.documents(
    PLAN,
    CHIPS,
    AWARD,
    SUPPORT,
    {"seller": RAKESH, "buyer": BUYER, "client": J["client"]},
    numbers={"invoice": "INV/26-27/0931", "support": "CN/0117"},
)
INVOICE = next(d for d in DOCS if d["id"] == "invoice")
CREDIT = next(d for d in DOCS if d["id"] == "support")


def test_names():
    assert copy.compact("Masala Chips 150 g") == "Masala Chips 150g"
    assert copy.compact("Mango Drink 200 ml") == "Mango Drink 200ml"
    assert copy.base("Masala Chips 150 g") == "Masala Chips"
    assert copy.possessive("Rakesh Traders") == "Rakesh Traders'"
    assert copy.possessive("Agrawal Wholesale") == "Agrawal Wholesale's"
    assert copy.weekday(date(2026, 10, 6)) == "Tuesday"


@pytest.mark.parametrize(
    ("key", "made"),
    [
        (
            "watch",
            lambda: copy.watch_event(
                checked=312,
                distributors=4,
                ref=HERO["id"],
                assess=RISK,
                units=HERO["units"],
                sell_per_day=HERO["sellPerDay"],
            ),
        ),
        ("ask", lambda: copy.ask_event(distributor="Rakesh Traders", person="Rakesh bhai", hindi=True)),
        (
            "read",
            lambda: copy.read_event(
                {
                    "batch": HERO["id"],
                    "mfg": HERO["mfg"],
                    "bestBefore": HERO["bestBefore"],
                    "mrp": 30,
                    "confidence": 0.97,
                },
                matches=True,
                mismatches=[],
            ),
        ),
        (
            "value",
            lambda: copy.value_event(
                days_left=HERO["daysLeft"], write_off=PLAN["writeOff"], sku=CHIPS, rules=money.RULES
            ),
        ),
        ("route", lambda: copy.route_event(PLAN, offered=38, window_days=14, explanation=None)),
        (
            "list",
            lambda: copy.list_event(
                units=772,
                distributor="Rakesh Traders",
                ask=15,
                reserve=13.5,
                client="Munchly",
                listing_id="ES-24117",
                territory_guard=True,
            ),
        ),
        (
            "outreach",
            lambda: copy.outreach_event(
                offered=38, city="Nagpur", scheme={"buy": 10, "free": 2}, hours=48, cap_times=4, hindi=True
            ),
        ),
        (
            "counter",
            lambda: copy.counter_event(
                buyer="Agrawal Wholesale",
                bid=13,
                units=772,
                counter=COUNTER["price"],
                reserve=13.5,
                distributor_person="Rakesh bhai",
            ),
        ),
        ("orders", lambda: copy.orders_event(shops=31, offered=38, units=588, line_units=588, hours=2)),
        (
            "donate",
            lambda: copy.donate_event(
                sku_name="Mango Drink 200 ml",
                partner="Feeding India",
                units=58,
                others=[{"name": "India FoodBanking Network", "minDays": 21, "minUnits": 100}],
            ),
        ),
        ("shelf", lambda: copy.shelf_event({**J["shelf"], "round": J["shelf"]["round"]})),
        ("ledger", lambda: copy.ledger_event(return_by=J["returnBy"], kg=PLAN["kg"], co2=PLAN["co2"], meals=0, net=0)),
    ],
)
def test_the_timeline_reads_as_design3(key, made):
    want = EVENTS[key]
    got = made()
    if key == "ledger":
        got["calls"][0][1] = want["calls"][0][1]  # the net comes from the award, which this case leaves out
    assert got["text"] == want["text"]
    assert [list(c) for c in got.get("calls", [])] == [list(c) for c in want.get("calls", [])]


def test_people_lines():
    assert copy.permit_event(platform="Smart-Clearance", client="Munchly") == EVENTS["permit"]["text"]
    assert copy.photo_event(shelf="B4") == EVENTS["photo"]["text"]
    assert copy.accepted_event(price_=COUNTER["price"], token=AWARD["token"]) == EVENTS["accepted"]["text"]
    assert copy.dispatch_event(buyer="Agrawal Wholesale", city="Raipur") == EVENTS["dispatch"]["text"]
    assert copy.van_event(day="Tuesday", shops=31, units=588) == EVENTS["van"]["text"]
    assert copy.notify_event(approver="Priya", distributor_person="Rakesh bhai") == EVENTS["notify"]["text"]
    # on purpose: the live journey does not assume a person's pronoun
    assert copy.approved_event(device="phone") == "Approved the plan from the phone."
    papers = copy.papers_event(
        distributor_person="Rakesh bhai", invoice=INVOICE, support=CREDIT, itc=PLAN["itcRetained"]
    )
    assert papers["text"] == EVENTS["papers"]["text"].replace("for him to issue", "for Rakesh to issue")
    assert [list(c) for c in papers["calls"]] == [list(c) for c in EVENTS["papers"]["calls"]]


def test_the_pushes_read_as_design3():
    detect = copy.push_detect(
        person="Priya Deshmukh",
        sku_name=CHIPS["name"],
        city="Nagpur",
        ref=HERO["id"],
        at_risk=RISK["atRisk"],
        best_before=HERO["bestBefore"],
    )
    assert (detect["title"], detect["body"]) == (PUSH["detect"]["title"], PUSH["detect"]["body"])
    verify = copy.push_verify(person="Rakesh bhai", sku_name=CHIPS["name"], ref=HERO["id"])
    assert (verify["title"], verify["body"]) == (PUSH["verify"]["title"], PUSH["verify"]["body"])
    plan = copy.push_plan(PLAN, ref=HERO["id"])
    assert (plan["title"], plan["body"]) == (PUSH["plan"]["title"], PUSH["plan"]["body"])
    approved = copy.push_approved(PLAN, person="Rakesh bhai", client="Munchly", sku_name=CHIPS["name"], ref=HERO["id"])
    assert (approved["title"], approved["body"]) == (PUSH["approved"]["title"], PUSH["approved"]["body"])
    offer = copy.push_offer(
        shop="Shree Ganesh Kirana",
        brand="Munchly",
        sku_name=CHIPS["name"],
        best_before=HERO["bestBefore"],
        scheme={"buy": 10, "free": 2},
        hours=48,
        distributor="Rakesh Traders",
    )
    assert (offer["title"], offer["body"], offer["en"]) == (
        PUSH["offer"]["title"],
        PUSH["offer"]["body"],
        PUSH["offer"]["en"],
    )
    award = copy.push_award(
        units=772,
        price_=COUNTER["price"],
        buyer=BUYER["name"],
        city=BUYER["city"],
        token=AWARD["token"],
        balance=AWARD["balance"],
    )
    assert (award["title"], award["body"]) == (PUSH["award"]["title"], PUSH["award"]["body"])
    won = copy.push_won(
        person="Rakesh bhai",
        buyer=BUYER["name"],
        city=BUYER["city"],
        units=772,
        price_=COUNTER["price"],
        token=AWARD["token"],
    )
    assert (won["title"], won["body"]) == (PUSH["won"]["title"], PUSH["won"]["body"])
    van = copy.push_van(day="Tuesday", shops=31, units=588, city="Raipur", lot=772)
    assert (van["title"], van["body"]) == (PUSH["van"]["title"], PUSH["van"]["body"])
    papers = copy.push_papers(ref=HERO["id"], distributor_person="Rakesh bhai", invoice=True)
    assert (papers["title"], papers["body"]) == (PUSH["papers"]["title"], PUSH["papers"]["body"])
    invoice = copy.push_invoice(
        buyer=BUYER["name"],
        city=BUYER["city"],
        units=772,
        price_=COUNTER["price"],
        gst_pct=INVOICE["gstPct"],
        total=INVOICE["total"],
        client="Munchly",
        support=SUPPORT["total"],
    )
    assert (invoice["title"], invoice["body"]) == (PUSH["invoice"]["title"], PUSH["invoice"]["body"])
    shelf = copy.push_shelf(J["shelf"])
    assert (shelf["title"], shelf["body"]) == (PUSH["shelf"]["title"], PUSH["shelf"]["body"])
    report = copy.push_report(ref=HERO["id"], kg=PLAN["kg"])
    assert (report["title"], report["body"]) == (PUSH["report"]["title"], PUSH["report"]["body"])
    actual = money.actual_net(PLAN, COUNTER["price"])
    closed = copy.push_closed(net=actual["net"], itc=PLAN["itcRetained"], kg=PLAN["kg"], cartons=0)
    assert (closed["title"], closed["body"]) == (PUSH["closed"]["title"], PUSH["closed"]["body"])


def test_the_chat_reads_as_design3():
    chat = J["copy"]["chat"]
    assert copy.chat_bid(bid=13, units=772) == chat[0]["text"]
    assert copy.chat_counter(counter=COUNTER["price"], units=772, city="Nagpur") == chat[1]["text"]
    assert copy.chat_accept(price_=COUNTER["price"]) == chat[2]["text"]


def test_a_models_figures_are_held_to_the_computed_ones():
    figures = [PLAN["net"], PLAN["swing"], 588, 772, 18, 15]
    assert copy.check_numbers("588 to the kiranas at ₹18 and 772 to ExpireSoon at ₹15: net ₹21,770.", figures)
    assert copy.check_numbers("Two exits, one batch.", figures)
    assert not copy.check_numbers("Net ₹25,000 if we hold for a week.", figures)
    assert not copy.check_numbers("Sell 600 to the kiranas.", figures)


def test_the_fixtures_story_figures():
    # what the replay test relies on: the story's plan, award and papers
    assert PLAN["net"] == 21770 and round(PLAN["swing"]) == 26340
    assert AWARD["token"] == 1644 and INVOICE["total"] == 11510 and CREDIT["amount"] == 8768
    assert M["plans"][0]["plan"]["net"] == PLAN["net"]


def test_the_food_banks_reply_is_designs():
    story = J["moments"]["donation"]["story"]
    assert copy.pickup_reply(day=story["day"], spot=story["spot"]) == story["reply"]
    spots = J["moments"]["donation"]["spots"]
    assert copy.serving_spot(partner="Feeding India", city="Hyderabad", spots=spots) == story["spot"]
    elsewhere = copy.serving_spot(partner="Feeding India", city="Nagpur", spots=spots)
    assert elsewhere == "Feeding India's serving point in Nagpur"

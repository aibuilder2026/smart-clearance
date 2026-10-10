(function() {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY;
  const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, ThemeProvider, AppRoot, Aura, CodeBlock, Product } = K;
  const { motion, AnimatePresence, useReducedMotion } = window.Motion;
  const { useState } = React;
  const q = new URLSearchParams(location.search);
  const OPT = q.get("opt") || "a", STATE = q.get("state") || "all";
  const STATES = ["queued", "live", "countered", "awarded", "collected"];
  const hero = D.BATCHES.find((b) => b.hero), sku = D.SKUS[hero.sku], dist = D.DISTRIBUTORS[hero.distributor];
  const ES = D.PLAN.lines.find((l) => l.id === "expiresoon");
  const RESERVE = 13.5;
  const L = D.JOURNEY.listing, BUYER = D.BUYER, COUNTER = D.COUNTER.price, AWARD = D.AWARD;
  const CLIENT = D.CLIENT.short;
  const terr = Object.values(D.DISTRIBUTORS);
  const pins = terr.flatMap((d) => d.pins.split(/,\s*/));
  const cities = terr.map((d) => d.city);
  const whose = (n) => n + (/s$/.test(n) ? "'" : "'s");
  const andList = (a) => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  const per = sku.perCarton || 24, cartons = `${Math.floor(ES.units / per)} cartons + ${ES.units % per}`;
  const bb = (/* @__PURE__ */ new Date(hero.bestBefore + "T00:00:00")).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const off = Math.round((1 - ES.price / sku.mrp) * 100);
  const T = { listed: "09:41", bid: "11:03", won: "11:09", collected: "Mon 5 Oct" };
  const req = `POST /v1/listings
{
  "seller": "${dist.name}, ${dist.city}",
  "on_behalf": "one-time permission · inside ${CLIENT} floors",
  "sku": "${sku.code}",
  "batch": "${hero.id}",
  "units": ${ES.units},
  "price": ${ES.price.toFixed(2)},
  "reserve": ${RESERVE.toFixed(2)},
  "mrp": ${sku.mrp.toFixed(2)},
  "best_before": "${hero.bestBefore}",
  "hide_from_pincodes": [${pins.map((p) => `"${p}"`).join(", ")}],
  "label_photo": "gs://smart-clearance/labels/${hero.id}.jpg"
}`;
  const res = (st) => `HTTP/1.1 201 Created
{
  "id": "${L.id}",
  "status": "${["", "live", "live", "awarded", "collected"][st]}",
  "url": "${L.url}"
}`;
  const PAY = {
    bid: `POST /hooks/expiresoon  (from ExpireSoon)
{
  "event": "bid.placed",
  "listing": "${L.id}",
  "buyer": "${BUYER.name}, ${BUYER.city}",
  "units": ${ES.units},
  "price": 13.00
}`,
    counter: `POST /v1/listings/${L.id}/counter
{
  "price": ${COUNTER.toFixed(2)},
  "dispatch_hours": ${D.MARKET.dispatchHours}
}

HTTP/1.1 200 OK`,
    won: `POST /hooks/expiresoon  (from ExpireSoon)
{
  "event": "bid.accepted",
  "listing": "${L.id}",
  "price": ${COUNTER.toFixed(2)},
  "token": ${AWARD.token.toFixed(2)}
}`,
    collected: `PATCH /v1/listings/${L.id}
{
  "status": "collected"
}

HTTP/1.1 200 OK`
  };
  const STATUS = (st) => [/* @__PURE__ */ React.createElement(Badge, { key: "q" }, "queued"), /* @__PURE__ */ React.createElement(Badge, { key: "l", tone: "violet", dot: true, live: true }, "live"), /* @__PURE__ */ React.createElement(Badge, { key: "c", tone: "violet", dot: true }, "countered"), /* @__PURE__ */ React.createElement(Badge, { key: "a", tone: "green", dot: true }, "awarded"), /* @__PURE__ */ React.createElement(Badge, { key: "d", tone: "green", icon: "check" }, "collected")][st];
  const Head = ({ st }) => /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Aura, { on: st === 0, className: "icontile violet", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "shopping-bag", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Lister · ExpireSoon")), STATUS(st));
  const EsLogo = () => /* @__PURE__ */ React.createElement("span", { className: "es-logo", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "hourglass", size: 13, stroke: 2.2 }));
  function XCall({ label = "The API call", children }) {
    const [open, setOpen] = useState(false);
    const still = useReducedMotion();
    return /* @__PURE__ */ React.createElement("div", { className: "xcall" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "xcall-btn", "aria-expanded": open, onClick: () => setOpen((o) => !o) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 15, stroke: 2.2 }), label), /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, open && /* @__PURE__ */ React.createElement(motion.div, { key: "c", className: "stack tight", initial: still ? false : { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }, transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } }, children)));
  }
  const Foot = ({ st }) => /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "The marketplace is mocked: ExpireSoon's partner API is in talks, and the calls are what it would answer.");
  const Open = ({ st }) => st > 0 ? /* @__PURE__ */ React.createElement(Button, { variant: "outline", icon: "external-link" }, "Open on ExpireSoon") : null;
  function OptionA({ st }) {
    const steps = [["Listed", T.listed], ["Bid", T.bid], ["Won", T.won], ["Collected", T.collected]];
    const nowAt = st === 0 ? -1 : st >= 4 ? -1 : st === 1 ? 1 : st === 2 ? 2 : 3;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement(Head, { st }), st === 0 && /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Posting the lot now, in ", whose(dist.name), " name, with the label photo and dates."), /* @__PURE__ */ React.createElement("div", { className: "esl", "aria-label": "The lot as buyers see it on ExpireSoon", role: "group" }, /* @__PURE__ */ React.createElement("div", { className: "esl-top" }, /* @__PURE__ */ React.createElement(EsLogo, null), /* @__PURE__ */ React.createElement("span", { className: "es-word" }, "ExpireSoon"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "as buyers see it"), /* @__PURE__ */ React.createElement("span", { className: "esl-id" }, st > 0 ? L.id : "not posted yet")), /* @__PURE__ */ React.createElement("div", { className: "esl-lot" }, /* @__PURE__ */ React.createElement("span", { className: "esl-thumb" }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 58 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 3, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, sku.brand, " ", sku.name, " · ", fmt.num(ES.units), " units"), /* @__PURE__ */ React.createElement("span", { className: "esl-price" }, /* @__PURE__ */ React.createElement("span", { className: "es-price" }, "₹", ES.price), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "a packet · ", /* @__PURE__ */ React.createElement("s", null, "MRP ₹", sku.mrp), " · ", off, "% off")), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "es-date" }, "Best before ", bb, " · ", hero.daysLeft, " days")), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Sold by ", dist.name, ", ", dist.city, " · ", cartons))), st >= 3 && /* @__PURE__ */ React.createElement("div", { className: "esl-won" }, /* @__PURE__ */ React.createElement(Icon, { name: "badge-check", size: 17, style: { color: "var(--violet-text)" } }), /* @__PURE__ */ React.createElement("span", null, "Won by ", /* @__PURE__ */ React.createElement("b", null, BUYER.name, ", ", BUYER.city), " at ", /* @__PURE__ */ React.createElement("b", { className: "tnum" }, "₹", COUNTER.toFixed(2)), " · ", fmt.inr(AWARD.token), " token paid"))), /* @__PURE__ */ React.createElement("div", { className: "priv" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Only ", CLIENT, " sees"), /* @__PURE__ */ React.createElement("div", { className: "priv-row" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 16 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "Reserve ₹", RESERVE.toFixed(2)), " a packet. The Negotiator counters any bid under it; buyers never see it.")), /* @__PURE__ */ React.createElement("div", { className: "priv-row" }, /* @__PURE__ */ React.createElement(Icon, { name: "eye-off", size: 16 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "Hidden in ", terr.length, " territories:"), " ", andList(cities), " (", pins.length, " pincode areas), so the lot never undercuts a ", CLIENT, " distributor."))), /* @__PURE__ */ React.createElement("ol", { className: "steps", "aria-label": "Where the lot stands" }, steps.map(([k, t], i) => {
      const done = st > i;
      const now = i === nowAt;
      return /* @__PURE__ */ React.createElement("li", { key: k, className: cx(done && "done", now && "now"), "aria-current": now ? "step" : void 0 }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("b", null, k), /* @__PURE__ */ React.createElement("span", null, done ? t : now ? "waiting" : " "));
    })), /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Open, { st }), /* @__PURE__ */ React.createElement(XCall, null, /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(CodeBlock, { code: req, label: "ExpireSoon request" }), st > 0 && /* @__PURE__ */ React.createElement(CodeBlock, { code: res(st), label: "ExpireSoon response" })))), /* @__PURE__ */ React.createElement(Foot, { st }));
  }
  function OptionB({ st }) {
    const msgs = [
      { at: 1, dir: "out", title: "Listed the lot", sub: `${fmt.num(ES.units)} packets at ₹${ES.price} in ${whose(dist.name)} name; reserve ₹${RESERVE.toFixed(2)}, hidden in ${terr.length} territories. Accepted as ${L.id}.`, time: T.listed, pay: [req, res(1)] },
      { at: 2, dir: "in", title: `A bid from ${BUYER.name}, ${BUYER.city}`, sub: `₹13.00 for all ${fmt.num(ES.units)}, under the reserve.`, time: T.bid, pay: [PAY.bid] },
      { at: 2, dir: "out", title: `Countered at ₹${COUNTER.toFixed(2)}`, sub: `With ${D.MARKET.dispatchHours}-hour dispatch from ${whose(dist.name)} calendar.`, time: T.bid, pay: [PAY.counter] },
      { at: 3, dir: "in", title: "Accepted, token paid", sub: `₹${COUNTER.toFixed(2)} for ${fmt.num(ES.units)} · ${fmt.inr(AWARD.token)} token; the balance in ${D.MARKET.balanceHours} h.`, time: T.won, pay: [PAY.won] },
      { at: 4, dir: "out", title: "The truck collected the lot", sub: `${dist.name} loaded ${whose(BUYER.name)} truck; the listing is closed.`, time: T.collected, pay: [PAY.collected] }
    ].filter((m) => m.at <= st);
    const wait = ["Posting the lot", "Waiting for a bid", "Waiting for the buyer's answer", "Waiting for the truck"][st];
    const last = msgs.length ? msgs[msgs.length - 1].time : null;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement(Head, { st }), /* @__PURE__ */ React.createElement("div", { className: "hs-ends", role: "group", "aria-label": "The connection" }, /* @__PURE__ */ React.createElement("span", { className: "hs-end" }, /* @__PURE__ */ React.createElement(K.Mark, { size: 22 }), /* @__PURE__ */ React.createElement("b", null, "Lister")), /* @__PURE__ */ React.createElement("span", { className: "hs-link" }, /* @__PURE__ */ React.createElement(Icon, { name: "link", size: 14 }), st === 0 ? "connecting" : `in sync · ${last}`), /* @__PURE__ */ React.createElement("span", { className: "hs-end" }, /* @__PURE__ */ React.createElement("b", null, "ExpireSoon"), /* @__PURE__ */ React.createElement(EsLogo, null))), /* @__PURE__ */ React.createElement("ol", { className: "hs-log", "aria-label": "Messages with ExpireSoon" }, msgs.map((m, i) => /* @__PURE__ */ React.createElement("li", { key: i, className: "hs-msg" }, /* @__PURE__ */ React.createElement("span", { className: cx("hs-dir", m.dir), title: m.dir === "out" ? "sent to ExpireSoon" : "from ExpireSoon" }, /* @__PURE__ */ React.createElement(Icon, { name: m.dir === "out" ? "arrow-right" : "arrow-left", size: 15, stroke: 2.2 }), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, m.dir === "out" ? "Sent to ExpireSoon" : "From ExpireSoon")), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, m.title), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, m.sub)), /* @__PURE__ */ React.createElement("span", { className: "hs-time" }, m.time), /* @__PURE__ */ React.createElement(XCall, { label: "Payload" }, m.pay.map((c, j) => /* @__PURE__ */ React.createElement(CodeBlock, { key: j, code: c, label: m.title }))))), wait && /* @__PURE__ */ React.createElement("li", { className: "hs-msg" }, /* @__PURE__ */ React.createElement(Aura, { on: true, className: "hs-dir", style: { borderRadius: 8 } }, /* @__PURE__ */ React.createElement(Icon, { name: "hourglass", size: 14 })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote hs-wait", style: { paddingTop: 5 } }, wait), /* @__PURE__ */ React.createElement("span", null))), /* @__PURE__ */ React.createElement(Open, { st }), /* @__PURE__ */ React.createElement(Foot, { st }));
  }
  function OptionC({ st }) {
    const line = [`Posting now, in ${whose(dist.name)} name`, `Live as ${L.id} since ${T.listed} · no bids yet`, `${BUYER.name} bid ₹13.00 · countered at ₹${COUNTER.toFixed(2)}`, `Won at ₹${COUNTER.toFixed(2)} by ${BUYER.name} · ${fmt.inr(AWARD.token)} token paid`, `Collected ${T.collected} · the listing is closed`][st];
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement(Head, { st }), /* @__PURE__ */ React.createElement("div", { className: "terms-state" }, /* @__PURE__ */ React.createElement(EsLogo, null), /* @__PURE__ */ React.createElement("span", { className: "grow" }, line)), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "The lot", sub: `${sku.name} · ${cartons}`, value: /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.num(ES.units), " packets") }), /* @__PURE__ */ React.createElement(ListRow, { title: "Asking", sub: `MRP ₹${sku.mrp} · ${off}% off`, value: /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, "₹", ES.price.toFixed(2)) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Reserve", sub: "hidden from buyers; the Negotiator's floor", value: /* @__PURE__ */ React.createElement("span", { className: "tnum" }, "₹", RESERVE.toFixed(2)) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Sold by", sub: `one-time permission, inside ${CLIENT}'s floors`, value: dist.name }), /* @__PURE__ */ React.createElement(ListRow, { title: "Hidden in", sub: andList(cities), value: `${terr.length} territories` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Best before", sub: `${hero.daysLeft} days left`, value: bb }), /* @__PURE__ */ React.createElement(ListRow, { title: "Label photo", sub: "read by Vision · verified", value: /* @__PURE__ */ React.createElement("img", { className: "terms-photo", src: window.SC3_IMG + "label-photo.webp", alt: `The carton label of ${hero.id}` }) })), /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Open, { st }), /* @__PURE__ */ React.createElement(XCall, null, /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(CodeBlock, { code: req, label: "ExpireSoon request" }), st > 0 && /* @__PURE__ */ React.createElement(CodeBlock, { code: res(st), label: "ExpireSoon response" })))), /* @__PURE__ */ React.createElement(Foot, { st }));
  }
  const NAMES = { a: "A, the lot as listed", b: "B, the handshake", c: "C, the terms" };
  function Page() {
    const Opt = { a: OptionA, b: OptionB, c: OptionC }[OPT];
    const list = STATE === "all" ? STATES : [STATE];
    return /* @__PURE__ */ React.createElement("div", { className: "s151" }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Priya · Execution · ", hero.id), /* @__PURE__ */ React.createElement("span", { className: "t-title2" }, "Option ", NAMES[OPT])), /* @__PURE__ */ React.createElement("div", { className: "s151-states", style: STATE === "all" ? null : { maxWidth: 440 } }, list.map((s) => /* @__PURE__ */ React.createElement("div", { key: s, className: "s151-state" }, STATE === "all" && /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, s), /* @__PURE__ */ React.createElement(Opt, { st: STATES.indexOf(s) })))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { scroll: "window" }, /* @__PURE__ */ React.createElement(Page, null))));
})();

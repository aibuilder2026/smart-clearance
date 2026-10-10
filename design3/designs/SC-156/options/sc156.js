(function() {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, W = window.SC3_WORLD;
  const fmt = M.fmt;
  const { cx, Icon, Badge, Card, Aura, Product, Progress, Roll, ClusterMap, ThemeProvider, AppRoot } = K;
  const { motion, AnimatePresence, useReducedMotion } = window.Motion;
  const { useState } = React;
  const q = new URLSearchParams(location.search);
  const OPT = q.get("opt") || "a", STATE = q.get("state") || "all";
  const STATES = ["queued", "open", "filled", "over", "delivered"];
  const hero = D.BATCHES.find((b) => b.hero), sku = D.SKUS[hero.sku], dist = D.DISTRIBUTORS[hero.distributor];
  const KL = D.PLAN.lines.find((l) => l.id === "kirana");
  const SCHEME = M.RULES.scheme, CAP = M.RULES.shopCapTimes, HOURS = 48;
  const SHOPS = W.KIRANAS.filter((k) => k.distributor === hero.distributor);
  const ORDERING = D.KIRANAS;
  const bb = (/* @__PURE__ */ new Date(hero.bestBefore + "T00:00:00")).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const whose = (n) => n + (/s$/.test(n) ? "'" : "'s");
  const first = (n) => n.split(" ")[0];
  const T = { sent: "09:41", closes: "Sun 4 Oct · 09:41", filled: "11:41", van: D.JOURNEY.van.date };
  const hourOf = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h + m / 60 - (9 + 41 / 60);
  };
  const snap = (st) => {
    const orders = st === 0 ? [] : st === 1 ? ORDERING.slice(0, 12) : st === 3 ? ORDERING.slice(0, 23) : ORDERING;
    const units = orders.reduce((t, o) => t + o.units, 0);
    return {
      st,
      orders,
      units,
      left: KL.units - units,
      declined: st === 3 ? ["k24", "k27", "k30"] : st === 1 ? ["k27"] : [],
      offer: st === 0 ? null : { at: T.sent, closesAt: T.closes, status: st === 1 ? "open" : "closed", closedAt: st === 2 || st === 4 ? T.filled : T.closes, how: st === 2 || st === 4 ? "filled" : "ended" },
      elapsed: st === 0 ? 0 : st === 1 ? 17 : st === 2 || st === 4 ? 2 : HOURS,
      // hours of the window gone
      van: st === 4 ? { status: "done", at: T.van } : { status: "idle" }
    };
  };
  const badge = (s) => s.st === 0 ? /* @__PURE__ */ React.createElement(Badge, null, "queued") : s.st === 1 ? /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true, live: true }, "open · ", HOURS - s.elapsed, " h left") : s.st === 2 ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", dot: true }, "filled · ", HOURS - 2, " h early") : s.st === 3 ? /* @__PURE__ */ React.createElement(Badge, { icon: "hourglass" }, "window over") : /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "delivered");
  const Head = ({ s }) => /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Aura, { on: s.st === 1, className: "icontile", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "send", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Outreach · ", SHOPS.length, " kiranas")), badge(s));
  const Figures = ({ s }) => /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, /* @__PURE__ */ React.createElement(Roll, { value: s.orders.length }), /* @__PURE__ */ React.createElement("span", { className: "subtle", style: { fontSize: "0.45em" } }, " / ", SHOPS.length)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "kiranas ordered")), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, /* @__PURE__ */ React.createElement(Roll, { value: s.units }), /* @__PURE__ */ React.createElement("span", { className: "subtle", style: { fontSize: "0.45em" } }, " / ", KL.units)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "packets")));
  const Map = ({ s }) => /* @__PURE__ */ React.createElement(ClusterMap, { kiranas: ORDERING, orderedCount: s.orders.length, route: true, height: 200 });
  const Last = ({ s }) => /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, s.orders.slice(-3).reverse().map((o) => /* @__PURE__ */ React.createElement("div", { key: o.id, className: "row between t-subhead" }, /* @__PURE__ */ React.createElement("span", null, o.name, " ", /* @__PURE__ */ React.createElement("span", { className: "subtle t-footnote" }, o.area)), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, o.units, " ", /* @__PURE__ */ React.createElement("span", { className: "subtle t-caption" }, o.at)))), !s.orders.length && /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Orders arrive as shops tap the offer. No shop can order more than ", CAP, "× its own 14-day sales."));
  function PushSent() {
    const [open, setOpen] = useState(false);
    const still = useReducedMotion();
    return /* @__PURE__ */ React.createElement("div", { className: "xcall" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "xcall-btn", "aria-expanded": open, onClick: () => setOpen((o) => !o) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 15, stroke: 2.2 }), "The push, as sent"), /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, open && /* @__PURE__ */ React.createElement(motion.div, { key: "p", className: "kpush", initial: still ? false : { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }, transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } }, /* @__PURE__ */ React.createElement(K.Mark, { size: 28 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "hi t-subhead", lang: "hi" }, D.PUSH.offer.body.replace("Shree Ganesh Kirana", "{shop}")), /* @__PURE__ */ React.createElement("small", null, D.PUSH.offer.en, " · one message to all ", SHOPS.length, " shops, each with its own name, in Hindi (FCM).")))));
  }
  const Foot = () => /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "A shop that says Not this time keeps its ", HOURS, " hours to change its mind. What no shop takes moves to ExpireSoon when the window ends.");
  const whenLine = (s) => s.st === 0 ? `Sending the scheme to ${SHOPS.length} kiranas now, in ${whose(dist.name)} name.` : s.st === 1 ? `Open until ${s.offer.closesAt}: ${s.orders.length} of ${SHOPS.length} shops have ordered ${fmt.num(s.units)} of ${fmt.num(KL.units)} packets.` : s.st === 2 ? `Filled at ${T.filled}, ${HOURS - 2} h before the window would close: ${s.orders.length} of ${SHOPS.length} shops took every packet.` : s.st === 3 ? `The window ended ${s.offer.closesAt} with ${s.orders.length} of ${SHOPS.length} shops ordering ${fmt.num(s.units)}; the ${fmt.num(s.left)} left moved to ExpireSoon.` : `Delivered on ${whose(first(dist.name))} van round, ${T.van}: ${fmt.num(s.units)} packets to ${s.orders.length} shops.`;
  function OptionA({ s }) {
    const steps = [["Sent", s.offer && s.offer.at], ["First order", s.orders[0] && s.orders[0].at], ["Closed", s.offer && s.offer.status === "closed" && s.offer.closedAt], ["Van round", s.van.status === "done" && s.van.at]];
    const done = s.st === 0 ? 0 : s.st === 1 ? s.orders.length ? 2 : 1 : s.st === 4 ? 4 : 3;
    const nowAt = s.st === 0 ? -1 : s.st === 1 ? s.orders.length ? 2 : 1 : s.st === 4 ? -1 : 3;
    const pct = Math.min(1, s.elapsed / HOURS);
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement(Head, { s }), s.st === 0 && /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, whenLine(s)), /* @__PURE__ */ React.createElement("div", { className: "ks", role: "group", "aria-label": "The scheme as the shops see it" }, /* @__PURE__ */ React.createElement("div", { className: "ks-top" }, /* @__PURE__ */ React.createElement("span", { className: "ks-logo", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "store", size: 13, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", { className: "ks-word" }, "The scheme"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "as the shops see it"), /* @__PURE__ */ React.createElement("span", { className: "ks-win" }, HOURS, "-hour window")), /* @__PURE__ */ React.createElement("div", { className: "ks-lot" }, /* @__PURE__ */ React.createElement("span", { className: "ks-thumb" }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 50 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 3, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, sku.brand, " ", sku.name, " · ", fmt.num(KL.units), " packets"), /* @__PURE__ */ React.createElement("span", { className: "ks-price" }, /* @__PURE__ */ React.createElement("span", { className: "ks-big" }, "₹", KL.packPrice.toFixed(2)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "a pack · ", SCHEME.free, " free with every ", SCHEME.buy, " · ₹", KL.price.toFixed(2), " effective")), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "ks-date" }, "Best before ", bb, " · ", hero.daysLeft, " days")), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "From ", dist.name, ", ", dist.city, " · each shop up to ", CAP, "× its 14-day sales"))), s.st >= 2 && /* @__PURE__ */ React.createElement("div", { className: "ks-result" }, /* @__PURE__ */ React.createElement(Icon, { name: s.st === 3 ? "hourglass" : "badge-check", size: 17 }), /* @__PURE__ */ React.createElement("span", null, whenLine(s)))), /* @__PURE__ */ React.createElement(Figures, { s }), /* @__PURE__ */ React.createElement("div", { className: "kwin", "aria-label": "The offer window" }, /* @__PURE__ */ React.createElement("div", { className: "kwin-head" }, /* @__PURE__ */ React.createElement("span", null, "Offer window · ", /* @__PURE__ */ React.createElement("b", null, HOURS, " h")), /* @__PURE__ */ React.createElement("span", null, s.st === 0 ? "opens when the push goes out" : s.st === 1 ? /* @__PURE__ */ React.createElement(React.Fragment, null, "closes ", /* @__PURE__ */ React.createElement("b", null, s.offer.closesAt), " · ", HOURS - s.elapsed, " h left") : s.offer.how === "filled" ? /* @__PURE__ */ React.createElement(React.Fragment, null, "filled at ", /* @__PURE__ */ React.createElement("b", null, s.offer.closedAt), " · closed early") : /* @__PURE__ */ React.createElement(React.Fragment, null, "ended ", /* @__PURE__ */ React.createElement("b", null, s.offer.closedAt)))), /* @__PURE__ */ React.createElement("div", { className: "kwin-bar" }, /* @__PURE__ */ React.createElement("i", { className: cx(s.offer && s.offer.how === "filled" && "filled", s.st === 3 && "over"), style: { width: pct * 100 + "%" } }), s.st >= 2 && /* @__PURE__ */ React.createElement("s", { style: { left: pct * 100 + "%" } })), /* @__PURE__ */ React.createElement("div", { className: "kwin-ticks", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", null, s.offer ? s.offer.at : "—"), /* @__PURE__ */ React.createElement("span", null, "24 h"), /* @__PURE__ */ React.createElement("span", null, HOURS, " h"))), /* @__PURE__ */ React.createElement("ol", { className: "esl-steps green", "aria-label": "Where the scheme stands" }, steps.map(([k, t], i) => {
      const d = done > i && !!t;
      const now = i === nowAt;
      return /* @__PURE__ */ React.createElement("li", { key: k, className: cx(d && "done", now && "now"), "aria-current": now ? "step" : void 0 }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("b", null, k), /* @__PURE__ */ React.createElement("span", null, d ? t : now ? "waiting" : " "));
    })), /* @__PURE__ */ React.createElement(Map, { s }), /* @__PURE__ */ React.createElement(Last, { s }), /* @__PURE__ */ React.createElement(PushSent, null), /* @__PURE__ */ React.createElement(Foot, null));
  }
  function Timeline({ s }) {
    const W2 = 420, H = 150, pl = 6, pr = 6, pt = 18, pb = 24;
    const X = (h) => pl + Math.max(0, Math.min(HOURS, h)) / HOURS * (W2 - pl - pr), Y = (u) => pt + (1 - u / KL.units) * (H - pt - pb);
    let acc = 0;
    const pts = s.orders.map((o) => {
      acc += o.units;
      return [X(hourOf(o.at)), Y(acc), o];
    });
    const endX = X(s.elapsed);
    let d = `M${X(0)} ${Y(0)}`, py = Y(0);
    pts.forEach(([x, y]) => {
      d += ` L${x} ${py} L${x} ${y}`;
      py = y;
    });
    const step = pts.length ? d + ` L${endX} ${py} L${endX} ${Y(0)} Z` : "";
    return /* @__PURE__ */ React.createElement("div", { className: "ktl", role: "img", "aria-label": `The ${HOURS}-hour window: ${s.orders.length} orders, ${fmt.num(s.units)} packets` }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W2} ${H}` }, /* @__PURE__ */ React.createElement("rect", { className: "elapsed", x: X(0), y: pt, width: Math.max(0, endX - X(0)), height: H - pt - pb, rx: "4" }), step && /* @__PURE__ */ React.createElement("path", { className: "cum", d: step }), pts.map(([x, y, o]) => /* @__PURE__ */ React.createElement("circle", { key: o.id, className: "dot", cx: x, cy: y, r: "3.5" }, /* @__PURE__ */ React.createElement("title", null, o.name, " · ", o.units, " at ", o.at))), s.st === 1 && /* @__PURE__ */ React.createElement("line", { className: "now", x1: endX, x2: endX, y1: pt - 4, y2: H - pb + 2 }), s.offer && s.offer.status === "closed" && /* @__PURE__ */ React.createElement("line", { className: "close", x1: endX, x2: endX, y1: pt - 4, y2: H - pb + 2 }), [0, 12, 24, 36, 48].map((h) => /* @__PURE__ */ React.createElement("text", { key: h, className: "ax", x: X(h), y: H - 6, textAnchor: h === 0 ? "start" : h === 48 ? "end" : "middle" }, h === 0 ? `sent ${T.sent}` : h === 48 ? `closes ${T.closes.split(" · ")[1]}` : `${h} h`)), s.st === 1 && /* @__PURE__ */ React.createElement("text", { className: "lbl", x: Math.min(endX + 6, W2 - 60), y: pt + 10 }, "now · ", HOURS - s.elapsed, " h left"), s.offer && s.offer.how === "filled" && /* @__PURE__ */ React.createElement("text", { className: "lbl", x: endX + 6, y: pt + 10 }, "filled ", s.offer.closedAt), s.st === 3 && /* @__PURE__ */ React.createElement("text", { className: "lbl", x: endX - 6, y: pt + 10, textAnchor: "end" }, "ended · ", fmt.num(s.left), " left"), /* @__PURE__ */ React.createElement("text", { className: "ax", x: W2 - pr, y: pt - 3, textAnchor: "end" }, fmt.num(KL.units), " packets")));
  }
  function OptionB({ s }) {
    const icon = s.st === 0 ? "send" : s.st === 1 ? "timer" : s.st === 2 ? "badge-check" : s.st === 3 ? "hourglass" : "truck";
    const lead = s.st === 0 ? "Queued" : s.st === 1 ? "Window open" : s.st === 2 ? "Filled early" : s.st === 3 ? "Window over" : "Delivered";
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement(Head, { s }), /* @__PURE__ */ React.createElement("div", { className: "kstat" }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", s.st === 3 && "gray"), style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, lead, "."), " ", whenLine(s).replace(/^[^:]*: /, (m) => s.st === 1 || s.st === 2 || s.st === 3 ? "" : m), /* @__PURE__ */ React.createElement("small", null, fmt.num(KL.units), " packets at ₹", KL.packPrice.toFixed(2), " a pack, ", SCHEME.free, " free with every ", SCHEME.buy, " · ", SHOPS.length, " shops, each up to ", CAP, "× its 14-day sales · ", s.declined.length ? `${s.declined.length} said not this time` : "none declined"))), s.st > 0 && /* @__PURE__ */ React.createElement(Timeline, { s }), /* @__PURE__ */ React.createElement(Figures, { s }), /* @__PURE__ */ React.createElement(Progress, { value: s.units / KL.units, label: "Packets ordered" }), /* @__PURE__ */ React.createElement(Map, { s }), /* @__PURE__ */ React.createElement(Last, { s }), /* @__PURE__ */ React.createElement(PushSent, null), /* @__PURE__ */ React.createElement(Foot, null));
  }
  function OptionC({ s }) {
    const cell = (k) => {
      const o = s.orders.find((x) => x.id === k.id);
      if (o) return ["ordered", `${o.units}`, o.at];
      if (s.declined.includes(k.id)) return ["declined", "no", "not this time"];
      if (s.st === 0) return ["waiting", "·", "not sent"];
      if (s.st === 1) return ["waiting", "…", "waiting"];
      return ["missed", "—", "no answer"];
    };
    const counts = { ordered: s.orders.length, declined: s.declined.length };
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement(Head, { s }), /* @__PURE__ */ React.createElement("span", { className: "t-subhead", style: { color: "var(--fg)" } }, whenLine(s)), /* @__PURE__ */ React.createElement("ol", { className: "kgrid", "aria-label": `The ${SHOPS.length} shops` }, SHOPS.map((k) => {
      const [cls, v, sub] = cell(k);
      return /* @__PURE__ */ React.createElement("li", { key: k.id, className: cls, title: `${k.name}, ${k.area}: ${sub}` }, /* @__PURE__ */ React.createElement("b", null, v), /* @__PURE__ */ React.createElement("span", null, first(k.name)));
    })), /* @__PURE__ */ React.createElement("div", { className: "kgrid-legend", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "ordered" }), "Ordered · ", counts.ordered), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", null), "Not this time · ", counts.declined), s.st === 1 && /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "waiting" }), "Waiting · ", SHOPS.length - counts.ordered - counts.declined), s.st >= 2 && SHOPS.length - counts.ordered - counts.declined > 0 && /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "missed" }), "No answer · ", SHOPS.length - counts.ordered - counts.declined)), /* @__PURE__ */ React.createElement(Figures, { s }), /* @__PURE__ */ React.createElement(Progress, { value: s.units / KL.units, label: "Packets ordered" }), /* @__PURE__ */ React.createElement(Map, { s }), /* @__PURE__ */ React.createElement(PushSent, null), /* @__PURE__ */ React.createElement(Foot, null));
  }
  const NAMES = { a: "A, the scheme's stops", b: "B, the window first", c: "C, the shops" };
  function Page() {
    const Opt = { a: OptionA, b: OptionB, c: OptionC }[OPT];
    const list = STATE === "all" ? STATES : [STATE];
    return /* @__PURE__ */ React.createElement("div", { className: "s156" }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Priya · Execution · ", hero.id), /* @__PURE__ */ React.createElement("span", { className: "t-title2" }, "Option ", NAMES[OPT])), /* @__PURE__ */ React.createElement("div", { className: "s156-states", style: STATE === "all" ? null : { maxWidth: 440 } }, list.map((st) => /* @__PURE__ */ React.createElement("div", { key: st, className: "s156-state" }, STATE === "all" && /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, st), /* @__PURE__ */ React.createElement(Opt, { s: snap(STATES.indexOf(st)) })))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { scroll: "window" }, /* @__PURE__ */ React.createElement(Page, null))));
})();

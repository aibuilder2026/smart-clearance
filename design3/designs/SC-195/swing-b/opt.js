(function() {
  const K = window.SC3, Store = window.SC3_STORE, X = window.SC195;
  const { cx, Icon, Money, useApp } = K;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const { inr2, n0, fmt } = X;
  const Orig = K.TrackerCard;
  const useS = () => React.useSyncExternalStore(Store.subscribe, Store.get);
  const label = (w, s) => w.posted ? w.C.ES ? "recovered, after the negotiation" : "recovered, every line done" : ["approved", "executing", "dispatched", "settled", "cleared"].includes(s.hero.phase) ? "on plan · settles day 3–7" : "net recovered on the plan";
  const nil = "₹0";
  function Two({ w }) {
    const R = K.RULES || window.SC3_MONEY.RULES;
    const rows = [
      ["Sold or given", `${n0(w.units)} packs to ${w.exits.length} exits`, nil, "+" + inr2(w.gross)],
      ["Van, fees and handling", "", nil, inr2(-w.costs)],
      ["GST input credit reversed", w.given ? `only the ${n0(w.given)} donated packs, with the plan` : "", inr2(-w.wo.itc), w.itcLost ? inr2(-w.itcLost) : nil],
      ["Disposal", `${n0(w.units)} × ₹${R.disposalPerUnit.toFixed(2)}`, inr2(-w.wo.disposal), nil],
      ["EPR", `${w.wo.kg.toLocaleString("en-IN")} kg × ₹${R.eprPerKg.toFixed(2)}`, inr2(-w.wo.epr), nil],
      ["Stock at cost", "leaves the books either way", inr2(-w.book), inr2(-w.book)]
    ];
    return /* @__PURE__ */ React.createElement("div", { className: "sw-two", role: "table", "aria-label": "The working: destroyed against the plan" }, /* @__PURE__ */ React.createElement("div", { className: "sw-two-r head", role: "row" }, /* @__PURE__ */ React.createElement("span", { role: "columnheader" }), /* @__PURE__ */ React.createElement("span", { role: "columnheader" }, "Destroyed"), /* @__PURE__ */ React.createElement("span", { role: "columnheader" }, "With the plan")), rows.map(([k, sub, a, b]) => /* @__PURE__ */ React.createElement("div", { key: k, className: "sw-two-r", role: "row" }, /* @__PURE__ */ React.createElement("span", { role: "rowheader", className: "k" }, /* @__PURE__ */ React.createElement("span", null, k), sub && /* @__PURE__ */ React.createElement("span", { className: "sub" }, sub)), /* @__PURE__ */ React.createElement("span", { role: "cell", className: "tnum" }, a), /* @__PURE__ */ React.createElement("span", { role: "cell", className: "tnum" }, b))), /* @__PURE__ */ React.createElement("div", { className: "sw-two-r total", role: "row" }, /* @__PURE__ */ React.createElement("span", { role: "rowheader", className: "k" }, "P&L"), /* @__PURE__ */ React.createElement("span", { role: "cell", className: "tnum gone" }, inr2(-w.wo.total)), /* @__PURE__ */ React.createElement("span", { role: "cell", className: "tnum" }, inr2(w.pnl))), /* @__PURE__ */ React.createElement("div", { className: "sw-two-r swing", role: "row" }, /* @__PURE__ */ React.createElement("span", { role: "rowheader", className: "k" }, "The swing: the plan is better by"), /* @__PURE__ */ React.createElement("span", { role: "cell", className: "tnum", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { role: "cell", className: "tnum" }, inr2(w.swing))), /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle" }, "The plan kept the GST credit on the ", n0(w.sold), " packs sold and paid no disposal or EPR; the stock leaves the books at cost either way."));
  }
  function MoneyB() {
    const s = useS();
    const app = useApp();
    const reduce = useReducedMotion();
    const [open, setOpen] = React.useState(false);
    const w = X.working(s);
    const phone = app.bp === "phone";
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 4, width: "100%" } }, /* @__PURE__ */ React.createElement(Money, { value: w.net, size: phone ? "s" : "m", roll: true, style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, label(w, s), " · swing ", fmt.inr(w.swing)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "sw-disc", "aria-expanded": open, "aria-controls": "sw-two", onClick: () => setOpen(!open) }, /* @__PURE__ */ React.createElement("span", null, open ? "Hide the working" : "Show the working"), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-down", size: 16, stroke: 2.2, style: { transform: open ? "rotate(180deg)" : void 0, transition: "transform 240ms var(--ease)" } })), /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, open && /* @__PURE__ */ React.createElement(motion.div, { id: "sw-two", key: "two", style: { overflow: "hidden" }, initial: reduce ? false : { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }, /* @__PURE__ */ React.createElement(Two, { w }))));
  }
  K.TrackerCard = (props) => /* @__PURE__ */ React.createElement(Orig, { ...props, money: props.money ? /* @__PURE__ */ React.createElement(MoneyB, null) : props.money });
})();

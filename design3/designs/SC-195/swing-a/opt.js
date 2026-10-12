(function() {
  const K = window.SC3, Store = window.SC3_STORE, X = window.SC195;
  const { cx, Icon, Money, Sheet, useApp } = K;
  const { motion, useReducedMotion } = Motion;
  const { inr2, n0, fmt } = X;
  const Orig = K.TrackerCard;
  const useS = () => React.useSyncExternalStore(Store.subscribe, Store.get);
  const label = (w, s) => w.posted ? w.C.ES ? "recovered, after the negotiation" : "recovered, every line done" : ["approved", "executing", "dispatched", "settled", "cleared"].includes(s.hero.phase) ? "on plan · settles day 3–7" : "net recovered on the plan";
  function Bridge({ w }) {
    const reduce = useReducedMotion();
    const steps = [{ k: "If destroyed", v: -w.wo.total, end: true, tone: "gone" }].concat(w.exits.map((e) => ({ k: e.name, v: e.net, tone: e.net < 0 ? "gone" : "kept" }))).concat([{ k: "Not paid", v: w.extra, tone: "kept", soft: true }, { k: "With the plan", v: w.pnl, end: true, tone: "plan" }]);
    let run = 0;
    const bars = steps.map((st) => {
      if (st.end) {
        run = st.v;
        return { ...st, from: 0, to: st.v };
      }
      const b = { ...st, from: run, to: run + st.v };
      run += st.v;
      return b;
    });
    const lo = Math.min(0, ...bars.map((b) => Math.min(b.from, b.to))) * 1.06, hi = Math.max(0, ...bars.map((b) => Math.max(b.from, b.to))) + Math.abs(lo) * 0.14;
    const W = 436, H = 250, top = 20, bot = 62, n = bars.length, bw = 40, gap = (W - n * bw) / (n + 1);
    const y = (v) => top + (hi - v) / (hi - lo) * (H - top - bot);
    return /* @__PURE__ */ React.createElement("figure", { className: "sw-bridge", role: "img", "aria-label": `A bridge from ${inr2(-w.wo.total)} if destroyed to ${inr2(w.pnl)} with the plan: ${inr2(w.swing)} better` }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("line", { x1: "0", x2: W, y1: y(0), y2: y(0), className: "zero" }), bars.map((b, i) => {
      const x = gap + i * (bw + gap), y0 = y(Math.max(b.from, b.to)), h = Math.max(2, Math.abs(y(b.from) - y(b.to)));
      const below = b.v < 0 && !b.end;
      return /* @__PURE__ */ React.createElement("g", { key: b.k }, i > 0 && /* @__PURE__ */ React.createElement("line", { x1: x - gap, x2: x, y1: y(b.end ? b.to : b.from), y2: y(b.end ? b.to : b.from), className: "link" }), /* @__PURE__ */ React.createElement(motion.rect, { x, width: bw, rx: "5", className: cx("bar", b.tone, b.soft && "soft"), initial: reduce ? false : { y: y(0), height: 0 }, animate: { y: y0, height: h }, transition: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : i * 0.07, ease: [0.22, 1, 0.36, 1] } }), /* @__PURE__ */ React.createElement("text", { x: x + bw / 2, y: below || b.end && b.v < 0 && h > 40 ? y(b.to) + 15 : y0 - 7, className: cx("val", b.tone), textAnchor: "middle" }, (b.v > 0 && !b.end ? "+" : "") + fmt.inr(Math.round(b.v))), (b.k.includes(" ") ? [b.k.slice(0, b.k.indexOf(" ")), b.k.slice(b.k.indexOf(" ") + 1)] : [b.k]).map((t, j) => /* @__PURE__ */ React.createElement("text", { key: j, x: x + bw / 2, y: H - 26 + j * 13, className: "lab", textAnchor: "middle" }, t)));
    })), /* @__PURE__ */ React.createElement("figcaption", null, '"Not paid": what destroying would have cost beyond the stock (the GST credit, disposal and EPR).'));
  }
  function Row({ k, sub, v, strong, tone }) {
    return /* @__PURE__ */ React.createElement("div", { className: cx("sw-row", strong && "strong") }, /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("span", null, k), sub && /* @__PURE__ */ React.createElement("span", { className: "sub" }, sub)), /* @__PURE__ */ React.createElement("span", { className: cx("v tnum", tone) }, v));
  }
  function Working({ w }) {
    const first = w.exits.slice().sort((a, b) => b.perPack - a.perPack)[0];
    return /* @__PURE__ */ React.createElement("div", { className: "sw-work" }, /* @__PURE__ */ React.createElement("div", { className: "sw-hero" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "The swing on ", w.batch.id), /* @__PURE__ */ React.createElement("span", { className: "sw-big tnum" }, inr2(w.swing)), /* @__PURE__ */ React.createElement("p", null, "Sending the batch to its exits left Munchly ", inr2(w.swing), " better off than destroying it: a P&L of ", inr2(w.pnl), " instead of ", inr2(-w.wo.total), ".")), /* @__PURE__ */ React.createElement(Bridge, { w }), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "If it were destroyed"), X.binRows(w).map(([k, sub, v]) => /* @__PURE__ */ React.createElement(Row, { key: k, k, sub, v: inr2(-v) })), /* @__PURE__ */ React.createElement(Row, { k: "The bin would cost", sub: `₹${w.wo.perUnit.toFixed(2)} a pack`, v: inr2(-w.wo.total), strong: true, tone: "gone" })), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "What the plan did"), w.exits.map((e) => /* @__PURE__ */ React.createElement(Row, { key: e.id, k: e.name, sub: X.lineHow(e), v: (e.net < 0 ? "" : "+") + inr2(e.net), tone: e.net < 0 ? "gone" : void 0 })), /* @__PURE__ */ React.createElement(Row, { k: "Recovered", v: inr2(w.net), strong: true, tone: "kept" }), /* @__PURE__ */ React.createElement(Row, { k: "The stock leaves the books at cost", sub: `either way: ${n0(w.units)} × ₹${w.sku.cost.toFixed(2)}`, v: inr2(-w.book) }), /* @__PURE__ */ React.createElement(Row, { k: "The P&L with the plan", v: inr2(w.pnl), strong: true })), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "The swing"), /* @__PURE__ */ React.createElement("p", { className: "sw-sum tnum" }, inr2(w.pnl), " − (", inr2(-w.wo.total), ") = ", /* @__PURE__ */ React.createElement("b", null, inr2(w.swing))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted" }, "Put another way: ", inr2(w.net), " recovered, plus the ", inr2(w.extra), " destroying it would have cost beyond the stock (the GST credit, disposal and EPR), which nobody paid.")), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "How the loss was kept small"), /* @__PURE__ */ React.createElement("ul", { className: "sw-why" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Icon, { name: "route", size: 16 }), /* @__PURE__ */ React.createElement("span", null, "The Router filled the best-paying exit first: the ", first.name.toLowerCase(), " at ", inr2(first.perPack), " a pack, net, against ", inr2(-w.wo.perUnit), " a pack in the bin.")), w.left.slice(0, 2).map((r) => /* @__PURE__ */ React.createElement("li", { key: r.id }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-x", size: 16 }), /* @__PURE__ */ React.createElement("span", null, r.short || r.name, " was left out: ", r.reason, "."))), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 16 }), /* @__PURE__ */ React.createElement("span", null, "The GST input credit stays on the ", n0(w.sold), " packs sold", w.given ? `; only the ${n0(w.given)} donated packs reverse theirs (${inr2(w.itcLost)})` : "", ".")), !w.leftover && /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Icon, { name: "recycle", size: 16 }), /* @__PURE__ */ React.createElement("span", null, "No disposal or EPR to pay: every pack went somewhere.")))), /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle" }, "Worked out from Munchly's cost sheet and the platform's rules, as the Valuer prices every exit."));
  }
  function MoneyA() {
    const s = useS();
    const app = useApp();
    const [open, setOpen] = React.useState(false);
    const w = X.working(s);
    const phone = app.bp === "phone";
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 4 } }, /* @__PURE__ */ React.createElement(Money, { value: w.net, size: phone ? "s" : "m", roll: true, style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, label(w, s)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "sw-note", "aria-haspopup": "dialog", onClick: () => setOpen(true) }, /* @__PURE__ */ React.createElement(Icon, { name: "scale", size: 15, stroke: 2.1 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, fmt.inr(w.swing), " better"), " than destroying it"), /* @__PURE__ */ React.createElement("span", { className: "sw-how" }, "How it adds up")), /* @__PURE__ */ React.createElement(Sheet, { open, onClose: () => setOpen(false), title: "How the swing adds up", side: phone ? "bottom" : "side", detent: "large" }, /* @__PURE__ */ React.createElement(Working, { w })));
  }
  K.TrackerCard = (props) => /* @__PURE__ */ React.createElement(Orig, { ...props, money: props.money ? /* @__PURE__ */ React.createElement(MoneyA, null) : props.money });
  window.SC195.label = label;
})();

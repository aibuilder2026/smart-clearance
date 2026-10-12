(function() {
  const K = window.SC3, Store = window.SC3_STORE, X = window.SC195;
  const { cx, Icon, Money, Sheet, useApp } = K;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const { inr2, n0, fmt } = X;
  const Orig = K.TrackerCard;
  const useS = () => React.useSyncExternalStore(Store.subscribe, Store.get);
  const label = (w, s) => w.posted ? w.C.ES ? "recovered, after the negotiation" : "recovered, every line done" : ["approved", "executing", "dispatched", "settled", "cleared"].includes(s.hero.phase) ? "on plan · settles day 3–7" : "net recovered on the plan";
  function Where({ w }) {
    const reduce = useReducedMotion();
    const parts = w.exits.slice().sort((a, b) => b.contrib - a.contrib);
    const max = Math.max(w.wo.perUnit, ...w.exits.map((e) => Math.abs(e.perPack)));
    const packs = [{ id: "bin", name: "The bin", perPack: -w.wo.perUnit, tone: "gone" }].concat(w.exits.map((e) => ({ id: e.id, name: e.name, perPack: e.perPack, tone: e.perPack < 0 ? "gone" : "kept" })));
    return /* @__PURE__ */ React.createElement("div", { className: "sw-where" }, /* @__PURE__ */ React.createElement("div", { className: "sw-where-head" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Where the swing came from"), /* @__PURE__ */ React.createElement("b", { className: "tnum" }, inr2(w.swing))), /* @__PURE__ */ React.createElement("div", { className: "sw-stack", role: "img", "aria-label": parts.map((p) => `${p.name} ${inr2(p.contrib)}`).join(", ") }, parts.map((p, i) => /* @__PURE__ */ React.createElement(motion.span, { key: p.id, className: cx("seg", i === 0 && "first"), style: { flexGrow: Math.max(p.contrib, 0) }, initial: reduce ? false : { scaleX: 0 }, animate: { scaleX: 1 }, transition: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : i * 0.08, ease: [0.22, 1, 0.36, 1] } }))), /* @__PURE__ */ React.createElement("ul", { className: "sw-parts" }, parts.map((p) => /* @__PURE__ */ React.createElement("li", { key: p.id }, /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("b", null, p.name), /* @__PURE__ */ React.createElement("span", { className: "sub" }, n0(p.units), " packs · ", inr2(r(p.contrib / p.units)), " a pack better than the bin")), /* @__PURE__ */ React.createElement("span", { className: "v tnum" }, inr2(p.contrib)), /* @__PURE__ */ React.createElement("span", { className: "pct tnum" }, Math.round(p.contrib / w.swing * 100), "%")))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted" }, "A pack's share is what it fetched, net, plus the ", inr2(w.extraPer), " destroying it would have cost beyond its book cost: its GST credit, disposal and EPR."), /* @__PURE__ */ React.createElement("div", { className: "sw-packs", "aria-label": "What a pack was worth, net, at each exit and in the bin" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "One pack, net"), packs.map((p, i) => {
      const pct = Math.abs(p.perPack) / max * 50;
      return /* @__PURE__ */ React.createElement("div", { key: p.id, className: "sw-pack" }, /* @__PURE__ */ React.createElement("span", { className: "name" }, p.name), /* @__PURE__ */ React.createElement("span", { className: "track" }, /* @__PURE__ */ React.createElement("span", { className: "mid" }), /* @__PURE__ */ React.createElement(motion.span, { className: cx("fill", p.tone), style: { [p.perPack < 0 ? "right" : "left"]: "50%", width: pct + "%", transformOrigin: p.perPack < 0 ? "right" : "left" }, initial: reduce ? false : { scaleX: 0 }, animate: { scaleX: 1 }, transition: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] } })), /* @__PURE__ */ React.createElement("span", { className: cx("v tnum", p.tone) }, inr2(p.perPack)));
    })));
  }
  const r = (n) => Math.round(n * 100) / 100;
  function Pop({ open, onClose, anchor, children }) {
    const ref = React.useRef(null);
    const reduce = useReducedMotion();
    const [at, setAt] = React.useState(null);
    React.useLayoutEffect(() => {
      if (!open || !anchor.current) return;
      const r2 = anchor.current.getBoundingClientRect(), w = Math.min(420, innerWidth - 24), below = innerHeight - r2.bottom - 20, above = r2.top - 20;
      const left = Math.max(12, Math.min(r2.left + r2.width / 2 - 60, innerWidth - w - 12));
      setAt(below >= 420 || below >= above ? { top: r2.bottom + 8, left, width: w, maxHeight: below } : { bottom: innerHeight - r2.top + 8, left, width: w, maxHeight: above });
    }, [open]);
    React.useEffect(() => {
      if (!open) return;
      const el = ref.current;
      el && el.focus();
      const key = (e) => {
        if (e.key === "Escape") {
          onClose();
          anchor.current && anchor.current.focus();
        }
      };
      const out = (e) => {
        if (el && !el.contains(e.target) && !anchor.current.contains(e.target)) onClose();
      };
      window.addEventListener("keydown", key);
      window.addEventListener("pointerdown", out);
      return () => {
        window.removeEventListener("keydown", key);
        window.removeEventListener("pointerdown", out);
      };
    }, [open]);
    return ReactDOM.createPortal(/* @__PURE__ */ React.createElement(AnimatePresence, null, open && at && /* @__PURE__ */ React.createElement(motion.div, { ref, tabIndex: -1, role: "dialog", "aria-label": "Where the swing came from", className: "sw-pop", style: at, initial: reduce ? false : { opacity: 0, y: -6, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, transition: { duration: 0.12 } }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }, children)), document.body);
  }
  function MoneyC() {
    const s = useS();
    const app = useApp();
    const [open, setOpen] = React.useState(false);
    const w = X.working(s);
    const phone = app.bp === "phone";
    const btn = React.useRef(null);
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2, position: "relative" } }, /* @__PURE__ */ React.createElement(Money, { value: w.net, size: phone ? "s" : "m", roll: true, style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle sw-line" }, label(w, s), " · swing ", fmt.inr(w.swing), /* @__PURE__ */ React.createElement("button", { ref: btn, type: "button", className: "sw-i", "aria-haspopup": "dialog", "aria-expanded": open, "aria-label": "Where the swing came from", onClick: () => setOpen(!open) }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 15, stroke: 2.2 }))), phone ? /* @__PURE__ */ React.createElement(Sheet, { open, onClose: () => setOpen(false), title: "Where the swing came from", side: "bottom", detent: "large" }, /* @__PURE__ */ React.createElement(Where, { w })) : /* @__PURE__ */ React.createElement(Pop, { open, onClose: () => setOpen(false), anchor: btn }, /* @__PURE__ */ React.createElement(Where, { w })));
  }
  K.TrackerCard = (props) => /* @__PURE__ */ React.createElement(Orig, { ...props, money: props.money ? /* @__PURE__ */ React.createElement(MoneyC, null) : props.money });
})();

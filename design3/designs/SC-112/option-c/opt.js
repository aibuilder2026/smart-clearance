(function() {
  const { useState, useEffect, useRef } = React;
  const { motion, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, X = S.SC112;
  const fmt = M.fmt;
  const { cx, Icon, Card, Product, DaysNum, GateChips, Menu, useApp } = K;
  const NAV = [
    { id: "command", label: "Command Center", short: "Today", icon: "layout-dashboard" },
    { id: "batches", label: "Batches", icon: "boxes" },
    { id: "setup", label: "Setup", icon: "sliders-horizontal", phoneHidden: true },
    { id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line", section: "Reports" }
  ];
  const WORKSPACE = ["command", "batches", "setup", "report", "inbox", "profile"];
  const STOP_SCREEN = [null, "journey", "route", "route", "route", "route", "execution", "paperwork", "ledger"];
  const SCREENS = ["journey", "route", "execution", "paperwork", "ledger"];
  const ANCHOR = { 2: "label", 3: "channels", 4: "split", 5: "approve" };
  const MANGO_TIMES = () => ({ connect: "once", detect: D.PUSH.detect.at, verify: "asked " + D.PUSH.verify.at });
  const stopFor = (name, it) => name === "route" ? X.at(it) >= 2 && X.at(it) <= 5 ? X.at(it) : 2 : STOP_SCREEN.indexOf(name);
  const stateWords = (it, i) => i < it.done ? "done" : i === it.current ? D.STAGES[i].human ? "where the batch is, waiting for your yes" : "where the batch is" : "not yet";
  function Stops({ it, view, onStop }) {
    const n = D.STAGES.length;
    const pos = it.current >= 0 ? it.current : Math.max(0, it.done - 1);
    const times = it.hero ? K.STAGE_TIMES : MANGO_TIMES();
    return /* @__PURE__ */ React.createElement("nav", { className: "tracker c-stops", style: { "--stops": n }, "aria-label": `${it.sku.name}: its stops` }, /* @__PURE__ */ React.createElement("div", { className: "rail", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", { style: { "--p": pos / (n - 1) } })), D.STAGES.map((st, i) => {
      const state = i < it.done ? "done" : i === it.current ? "now" : "";
      const body = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "dot" }, state === "done" && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 12, stroke: 3.2 })), /* @__PURE__ */ React.createElement("span", { className: "st-label" }, st.title), times[st.id] && /* @__PURE__ */ React.createElement("span", { className: "st-time" }, times[st.id]));
      return /* @__PURE__ */ React.createElement("div", { key: st.id, className: cx("stop", state, st.human && "human") }, i === 0 ? /* @__PURE__ */ React.createElement("span", { className: "c-fixed", title: "Set once for the workspace, in Setup" }, body) : /* @__PURE__ */ React.createElement("button", { type: "button", className: "stop-btn c-stop", "aria-current": view === i ? "page" : void 0, "aria-label": `${st.title}, ${stateWords(it, i)}`, onClick: () => onStop(i) }, view === i && /* @__PURE__ */ React.createElement(motion.span, { layoutId: "c-view", className: "c-view", transition: { type: "spring", stiffness: 500, damping: 40 } }), body));
    }));
  }
  function Strip({ it, view, onStop, mini }) {
    const reduce = useReducedMotion();
    const ref = useRef(null);
    useEffect(() => {
      const box = ref.current;
      const el = box && box.querySelector('[aria-current="page"]');
      if (el) box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
    }, [view]);
    return /* @__PURE__ */ React.createElement("nav", { ref, className: cx("c-strip", mini && "mini"), "aria-label": `${it.sku.name}: its stops` }, D.STAGES.map((st, i) => {
      if (i === 0) return null;
      const state = i < it.done ? "done" : i === it.current ? "now" : "";
      return /* @__PURE__ */ React.createElement("button", { key: st.id, type: "button", className: cx("c-chip", state, st.human && "human"), "aria-current": view === i ? "page" : void 0, "aria-label": `${st.title}, ${stateWords(it, i)}`, onClick: () => onStop(i) }, view === i && /* @__PURE__ */ React.createElement(motion.span, { layoutId: mini ? "c-chip-mini" : "c-chip", className: "c-chip-on", transition: { type: "spring", stiffness: 500, damping: 40 } }), /* @__PURE__ */ React.createElement("i", { className: "c-dot", "aria-hidden": "true" }, state === "done" && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 10, stroke: 3.4 })), /* @__PURE__ */ React.createElement("span", null, st.title));
    }));
  }
  function Head({ it, items, view, onStop, onBatch }) {
    const app = useApp();
    const phone = app.bp === "phone";
    const live = S.useLive();
    const [open, setOpen] = useState(false);
    const v = it.view;
    const sku = it.sku;
    const routed = X.at(it) >= 6;
    const card = useRef(null);
    const [away, setAway] = useState(false);
    useEffect(() => {
      const el = card.current;
      if (!el) return;
      let root = el.parentElement;
      while (root && !(root.classList && root.classList.contains("scroll"))) root = root.parentElement;
      const io = new IntersectionObserver(([e]) => setAway(!e.isIntersecting && e.boundingClientRect.top < 0), { root, threshold: 0, rootMargin: "-120px 0px 0px 0px" });
      io.observe(el);
      return () => io.disconnect();
    }, [it.ref]);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "sc-head c-head" }, /* @__PURE__ */ React.createElement("div", { className: "c-title" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("button", { type: "button", className: "c-switch", "aria-haspopup": "menu", "aria-expanded": open, onClick: () => setOpen((o) => !o) }, /* @__PURE__ */ React.createElement("span", null, sku.name), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-down", size: phone ? 20 : 24, stroke: 2.4 }))), /* @__PURE__ */ React.createElement(Menu, { open, onClose: () => setOpen(false), align: "left", width: 300, label: "Batches in a journey", items: [{ label: "Batches in a journey", heading: true }].concat(items.map((b) => ({ label: b.sku.name, icon: b.human ? "hand" : "route", checked: b.ref === it.ref, right: /* @__PURE__ */ React.createElement("span", { className: cx("c-mstop", b.human && "human") }, b.stop), onClick: () => {
      setOpen(false);
      onBatch(b);
    } }))) })), /* @__PURE__ */ React.createElement("div", { className: "sc-meta" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, it.ref), /* @__PURE__ */ React.createElement("span", { className: "sep", "aria-hidden": "true" }, "·"), /* @__PURE__ */ React.createElement("span", null, it.dist.name, ", ", it.dist.city), live && /* @__PURE__ */ React.createElement(S.Live.Line, null)), /* @__PURE__ */ React.createElement("div", { ref: card }, /* @__PURE__ */ React.createElement(Card, { className: "stack c-card", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: phone ? 64 : 84 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("div", { className: "row base", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(DaysNum, { days: v.daysLeft, life: sku.lifeDays, size: "l", style: { color: routed ? "var(--fg)" : "var(--red-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, "days left"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "best before ", fmt.date(v.bestBefore))))), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: phone ? "start" : "end" } }, /* @__PURE__ */ React.createElement(GateChips, { gates: v.assess.gates }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, fmt.num(v.assess.atRisk), " of ", fmt.num(v.units), " units at risk · sells ", v.sellPerDay, " a day"))), phone ? /* @__PURE__ */ React.createElement(Strip, { it, view, onStop }) : /* @__PURE__ */ React.createElement(Stops, { it, view, onStop })))), /* @__PURE__ */ React.createElement("div", { className: cx("c-stick", away && "on"), "aria-hidden": !away, inert: !away ? "" : void 0 }, /* @__PURE__ */ React.createElement(Strip, { it, view, onStop, mini: true })));
  }
  function Operator({ me, route, onGo, onBack, pushStep }) {
    const s = S.useStore();
    const live = S.useLive();
    const reduce = useReducedMotion();
    const items = X.journeys(s, live);
    const asked = route && route.name;
    const name = WORKSPACE.includes(asked) || SCREENS.includes(asked) ? asked : "command";
    const inBatch = (n) => SCREENS.includes(n);
    const it = inBatch(name) ? X.find(items, route.params && route.params.ref) : null;
    const from = X.useCameFrom(name, inBatch, X.LABELS);
    const go = (n, params, replace) => onGo({ name: n, params, replace });
    const [view, setView] = useState(() => it ? stopFor(name, it) : -1);
    const key = name + (it ? it.ref : "");
    const lastKey = useRef(key);
    const dir = useRef(0);
    const pending = useRef(null);
    if (lastKey.current !== key) {
      const next = it ? pending.current != null ? pending.current : stopFor(name, it) : -1;
      dir.current = it && view >= 0 && next >= 0 ? Math.sign(next - view) : 0;
      lastKey.current = key;
      if (next !== view) setView(next);
    }
    const scrollTo = (i) => {
      const sc = document.getElementById("main");
      if (!sc) return;
      if (i === 5) {
        sc.scrollTo({ top: sc.scrollHeight, behavior: reduce ? "auto" : "smooth" });
        return;
      }
      const el = document.querySelector(`[data-anchor="${ANCHOR[i]}"]`);
      if (!el) return;
      sc.scrollTo({ top: sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 116, behavior: reduce ? "auto" : "smooth" });
    };
    useEffect(() => {
      if (pending.current == null) return;
      const i = pending.current;
      pending.current = null;
      if (ANCHOR[i]) setTimeout(() => scrollTo(i), 60);
    }, [key]);
    useEffect(() => {
      if (name !== "route") return;
      const sc = document.getElementById("main");
      if (!sc) return;
      const f = () => {
        const top = sc.getBoundingClientRect().top + 180;
        let i = 2;
        ["label", "channels", "split"].forEach((a, k) => {
          const el = document.querySelector(`[data-anchor="${a}"]`);
          if (el && el.getBoundingClientRect().top < top) i = 2 + k;
        });
        if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4 && sc.scrollTop > 40) i = Math.max(i, 5);
        setView((v) => v === i ? v : i);
      };
      sc.addEventListener("scroll", f, { passive: true });
      return () => sc.removeEventListener("scroll", f);
    }, [name, it && it.ref]);
    const onStop = (i) => {
      const target = STOP_SCREEN[i];
      if (!target) return;
      if (target === name) {
        setView(i);
        if (ANCHOR[i]) scrollTo(i);
        return;
      }
      pending.current = i;
      go(target, { ref: it.ref }, true);
    };
    const r = { name: name === "ledger" ? "report" : name, params: it ? { ref: it.ref } : route && route.params };
    const frame = it ? { title: it.sku.name, hideLarge: true, back: from.label, sub: null, below: /* @__PURE__ */ React.createElement(Head, { it, items, view, onStop, onBatch: (b) => go(STOP_SCREEN[X.at(b)] || "journey", { ref: b.ref }) }) } : null;
    const body = !it ? S.screenFor(me, name, {}) : name === "journey" ? /* @__PURE__ */ React.createElement(X.JourneyView, { me, it, head: false, title: "Detect" }) : name === "ledger" ? /* @__PURE__ */ React.createElement(X.PartBody, { me, it, part: "report" }) : /* @__PURE__ */ React.createElement(X.PartBody, { me, it, part: name });
    const current = it ? from.id === "batches" ? "batches" : "command" : name;
    return /* @__PURE__ */ React.createElement(X.Chrome, { me, route: r, onGo, onBack, nav: NAV, current, onNav: (id) => go(id, {}, true), screenKey: it ? "batch:" + it.ref : name, scrollKey: key, className: it ? cx("sc-frame c-frame", dir.current > 0 && "go-on", dir.current < 0 && "go-back") : void 0, pushStep }, /* @__PURE__ */ React.createElement(X.FrameCtx.Provider, { value: frame }, body));
  }
  S.RoleApp = X.roleApp(Operator);
})();

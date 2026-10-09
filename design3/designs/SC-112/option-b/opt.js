(function() {
  const { useState, useRef } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, X = S.SC112;
  const { cx, Icon, Badge, Product, List, ListRow, BatchRow, useApp } = K;
  const NAV = [
    { id: "command", label: "Command Center", short: "Today", icon: "layout-dashboard" },
    { id: "batches", label: "Batches", icon: "boxes" },
    { id: "setup", label: "Setup", icon: "sliders-horizontal", phoneHidden: true },
    { id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line", section: "Reports" }
  ];
  const WORKSPACE = ["command", "batches", "setup", "report", "inbox", "profile"];
  const RAIL = ["batches", "batch"].concat(X.PART_IDS);
  const SLIDE = { enter: (d) => ({ opacity: 0, x: d * 28 }), center: { opacity: 1, x: 0 }, exit: (d) => ({ opacity: 0, x: -d * 28 }) };
  function RailBatch({ b, open, part, onOpen, onPart }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement("div", { className: cx("rl-b", open && "open") }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "rl-row", "aria-expanded": open, onClick: onOpen, title: `${b.sku.name} · ${b.ref}` }, /* @__PURE__ */ React.createElement("span", { className: "rl-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: b.sku.img, size: 30, alt: "" })), /* @__PURE__ */ React.createElement("span", { className: "rl-t" }, /* @__PURE__ */ React.createElement("b", null, X.shortName(b.sku)), /* @__PURE__ */ React.createElement("span", { className: cx("rl-stop", b.human && "human") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), b.human ? "Approve · your yes" : b.stop)), /* @__PURE__ */ React.createElement("span", { className: "rl-days" }, /* @__PURE__ */ React.createElement("b", null, b.days), "d")), /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, open && /* @__PURE__ */ React.createElement(motion.div, { className: "rl-parts", initial: reduce ? false : { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: reduce ? void 0 : { height: 0, opacity: 0 }, transition: { type: "spring", stiffness: 420, damping: 40, mass: 0.9 } }, X.PARTS.map((p) => {
      const st = X.partState(b, p);
      return /* @__PURE__ */ React.createElement("button", { key: p.id, type: "button", className: cx("rl-part", st.ahead && "ahead"), "aria-current": part === p.id ? "page" : void 0, onClick: () => onPart(p.id) }, /* @__PURE__ */ React.createElement(Icon, { name: p.icon, size: 16 }), /* @__PURE__ */ React.createElement("span", null, p.label), st.here ? /* @__PURE__ */ React.createElement("span", { className: cx("rl-here", st.human && "human") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), st.human ? "your yes" : "now") : st.ahead ? /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, ", ", st.words) : null);
    }))));
  }
  function RailWatch({ v, onOpen }) {
    const risk = v.assess.status === "at-risk";
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "rl-row rl-w", onClick: onOpen }, /* @__PURE__ */ React.createElement("span", { className: "rl-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: v.skuObj.img, size: 30, alt: "" })), /* @__PURE__ */ React.createElement("span", { className: "rl-t" }, /* @__PURE__ */ React.createElement("b", null, X.shortName(v.skuObj)), /* @__PURE__ */ React.createElement("span", { className: "mono" }, v.id)), /* @__PURE__ */ React.createElement("span", { className: cx("rl-days", risk && "risk") }, /* @__PURE__ */ React.createElement("b", null, v.daysLeft), "d", risk && /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, ", at risk")));
  }
  function Rail({ items, it, part, onBack, go, onWatch, allOn }) {
    const needs = items.filter((i) => i.human), moving = items.filter((i) => !i.human && i.current >= 0), done = items.filter((i) => i.current < 0);
    const group = (label, list) => list.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "rl-group" }, /* @__PURE__ */ React.createElement("div", { className: "sb-label" }, label, " · ", list.length), list.map((b) => /* @__PURE__ */ React.createElement(RailBatch, { key: b.ref, b, open: !!it && it.ref === b.ref, part, onOpen: () => go(X.partAt(b), { ref: b.ref }), onPart: (p) => go(p, { ref: b.ref }, true) })));
    const w = X.watched(items);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", className: "sb-item rl-back", onClick: onBack }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 19 }), /* @__PURE__ */ React.createElement("span", null, "Command Center")), /* @__PURE__ */ React.createElement("div", { className: "rl-title" }, /* @__PURE__ */ React.createElement("span", null, "Batches")), /* @__PURE__ */ React.createElement(X.SbItem, { icon: "boxes", label: "All batches", count: D.BATCHES.length, on: allOn, onClick: () => go("batches", {}, true) }), group("Needs your yes", needs), group("In a journey", moving), group("Cleared", done), /* @__PURE__ */ React.createElement("div", { className: "rl-group" }, /* @__PURE__ */ React.createElement("div", { className: "sb-label" }, "Watching · ", w.length), w.map((v) => /* @__PURE__ */ React.createElement(RailWatch, { key: v.id, v, onOpen: () => onWatch(v) }))));
  }
  function WorkspaceMenu({ name, go, items }) {
    const needs = items.filter((i) => i.human).length;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(X.SbItem, { icon: "layout-dashboard", label: "Command Center", on: name === "command", onClick: () => go("command") }), /* @__PURE__ */ React.createElement(X.SbItem, { icon: "boxes", label: "Batches", on: false, onClick: () => go("batches") }, needs ? /* @__PURE__ */ React.createElement("span", { className: "sbb-yes", "aria-label": `${needs} needs your yes` }, needs) : /* @__PURE__ */ React.createElement("span", { className: "sb-n" }, D.BATCHES.length), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16, className: "subtle" })), /* @__PURE__ */ React.createElement(X.SbItem, { icon: "sliders-horizontal", label: "Setup", on: name === "setup", onClick: () => go("setup") }), /* @__PURE__ */ React.createElement("div", { className: "sb-label" }, "Reports"), /* @__PURE__ */ React.createElement(X.SbItem, { icon: "chart-line", label: "Finance & ESG", on: name === "report", onClick: () => go("report") }));
  }
  function BatchList({ me, items, go, onWatch }) {
    const needs = items.filter((i) => i.human), moving = items.filter((i) => !i.human && i.current >= 0);
    const w = X.watched(items);
    const row = (b) => {
      const v = Object.assign({}, b.view, { phase: b.view.phase || "routing" });
      return /* @__PURE__ */ React.createElement(BatchRow, { key: b.ref, view: v, compact: true, onOpen: () => go("batch", { ref: b.ref }) });
    };
    return /* @__PURE__ */ React.createElement(S.Screen, { me, title: "Batches", sub: "Every lot the Watcher sees, by where it stands" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, needs.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(S.SectionTitle, null, "Needs your yes"), /* @__PURE__ */ React.createElement("div", { className: "list" }, needs.map(row))), moving.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(S.SectionTitle, null, "In a journey"), /* @__PURE__ */ React.createElement("div", { className: "list" }, moving.map(row))), /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Nearest best-before first" }, "Watching"), /* @__PURE__ */ React.createElement("div", { className: "list" }, w.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, compact: true, onOpen: () => onWatch(v) }))))));
  }
  function Parts({ it, go }) {
    return /* @__PURE__ */ React.createElement(List, { head: "This batch" }, X.PARTS.filter((p) => p.id !== "journey").map((p) => {
      const st = X.partState(it, p);
      return /* @__PURE__ */ React.createElement(ListRow, { key: p.id, icon: p.icon, iconTone: st.here ? st.human ? "amber" : void 0 : st.ahead ? "gray" : void 0, title: p.label, sub: st.here ? st.human ? "Waiting for your yes" : "Where the batch is now" : st.ahead ? st.words.replace(/^./, (c) => c.toUpperCase()) : "Done", value: st.here ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: st.human ? "amber" : "green", dot: true }, it.stop) : null, chevron: true, onClick: () => go(p.id, { ref: it.ref }) });
    }));
  }
  function Operator({ me, route, onGo, onBack, pushStep }) {
    const s = S.useStore();
    const live = S.useLive();
    const app = useApp();
    const phone = app.bp === "phone";
    const reduce = useReducedMotion();
    const items = X.journeys(s, live);
    const [watch, setWatch] = useState(null);
    const asked = route && route.name;
    let name = WORKSPACE.includes(asked) || RAIL.includes(asked) ? asked : "command";
    const inBatch = (n) => n === "batch" || X.PART_IDS.includes(n);
    const it = inBatch(name) ? X.find(items, route.params && route.params.ref) : null;
    if (name === "batch" && !phone) name = X.partAt(it);
    const from = X.useCameFrom(name, inBatch, X.LABELS);
    const go = (n, params, replace) => onGo({ name: n, params, replace });
    const rail = RAIL.includes(name);
    const was = useRef(rail);
    const dir = useRef(1);
    if (rail !== was.current) dir.current = rail ? 1 : -1;
    was.current = rail;
    const menu = /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "popLayout", initial: false, custom: dir.current }, /* @__PURE__ */ React.createElement(motion.div, { key: rail ? "rail" : "ws", className: "rl-pane", custom: dir.current, variants: SLIDE, initial: reduce ? false : "enter", animate: "center", exit: reduce ? void 0 : "exit", transition: { duration: 0.24, ease: X.EASE } }, rail ? /* @__PURE__ */ React.createElement(Rail, { items, it, part: name, go, onBack: () => go("command"), onWatch: setWatch, allOn: name === "batches" }) : /* @__PURE__ */ React.createElement(WorkspaceMenu, { name, go, items })));
    const r = { name, params: it ? { ref: it.ref } : route && route.params };
    const batchSub = it ? `${it.sku.brand} ${it.sku.name} · ${it.ref} · ${it.dist.name}, ${it.dist.city}` : null;
    let frame = null, body;
    if (name === "batch") {
      frame = { back: from.label, sub: `${it.ref} · ${it.dist.name}, ${it.dist.city}` };
      body = /* @__PURE__ */ React.createElement(X.JourneyView, { me, it, title: it.sku.name, before: /* @__PURE__ */ React.createElement(Parts, { it, go }) });
    } else if (it) {
      frame = { sub: batchSub, below: null, back: phone ? X.shortName(it.sku) : null };
      body = /* @__PURE__ */ React.createElement(X.PartBody, { me, it, part: name });
    } else if (name === "batches" && phone) body = /* @__PURE__ */ React.createElement(BatchList, { me, items, go, onWatch: setWatch });
    else body = S.screenFor(me, name, {});
    const current = rail ? "batches" : name;
    return /* @__PURE__ */ React.createElement(X.Chrome, { me, route: r, onGo, onBack: phone && it && name !== "batch" ? () => go("batch", { ref: it.ref }) : onBack, nav: NAV, current, onNav: (id) => go(id, {}, true), menu, screenKey: name + (it ? it.ref : ""), pushStep }, /* @__PURE__ */ React.createElement(X.FrameCtx.Provider, { value: frame }, body), /* @__PURE__ */ React.createElement(X.WatchSheet, { view: watch, onClose: () => setWatch(null) }));
  }
  X.FrameCtx = S.SC112.FrameCtx;
  S.RoleApp = X.roleApp(Operator);
})();

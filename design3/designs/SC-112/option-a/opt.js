(function() {
  const { useState } = React;
  const { motion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS, X = S.SC112;
  const { cx, Icon, Badge, Product, useApp } = K;
  const NAV = [
    { id: "command", label: "Command Center", short: "Today", icon: "layout-dashboard" },
    { id: "batches", label: "Batches", icon: "boxes" },
    { id: "setup", label: "Setup", icon: "sliders-horizontal", phoneHidden: true },
    { id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line", section: "Reports" }
  ];
  const WORKSPACE = ["command", "batches", "setup", "report", "inbox", "profile"];
  function Head({ it, part, onPart }) {
    const s = S.useStore();
    const app = useApp();
    const phone = app.bp === "phone";
    const live = S.useLive();
    const st = X.stateOf(it, s);
    return /* @__PURE__ */ React.createElement("div", { className: "sc-head" }, /* @__PURE__ */ React.createElement("div", { className: "sc-id" }, /* @__PURE__ */ React.createElement("span", { className: "sc-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: it.sku.img, size: phone ? 46 : 72, alt: "" })), /* @__PURE__ */ React.createElement("div", { className: "sc-tt" }, /* @__PURE__ */ React.createElement("h1", null, it.sku.name), /* @__PURE__ */ React.createElement("div", { className: "sc-meta" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, it.ref), /* @__PURE__ */ React.createElement("span", { className: "sep", "aria-hidden": "true" }, "·"), /* @__PURE__ */ React.createElement("span", null, it.dist.name, ", ", it.dist.city)), /* @__PURE__ */ React.createElement("div", { className: "sc-meta" }, /* @__PURE__ */ React.createElement(Badge, { tone: st.tone, dot: true, live: st.live }, st.text), live && /* @__PURE__ */ React.createElement(S.Live.Line, null)))), /* @__PURE__ */ React.createElement(Tabs, { it, part, onPart }));
  }
  function Tabs({ it, part, onPart }) {
    const phone = useApp().bp === "phone";
    return /* @__PURE__ */ React.createElement("nav", { className: "sc-tabs", "aria-label": `${it.sku.name}, ${it.ref}` }, X.PARTS.map((p) => {
      const st = X.partState(it, p);
      const on = part === p.id;
      return /* @__PURE__ */ React.createElement("button", { key: p.id, type: "button", className: cx("sc-tab", st.ahead && "ahead"), "aria-current": on ? "page" : void 0, onClick: () => onPart(p.id), title: st.words || void 0 }, on && /* @__PURE__ */ React.createElement(motion.span, { layoutId: "sc-tab-thumb", className: "sc-tab-thumb", transition: { type: "spring", stiffness: 500, damping: 40 } }), !phone && /* @__PURE__ */ React.createElement(Icon, { name: p.icon, size: 16 }), /* @__PURE__ */ React.createElement("span", null, phone ? p.short : p.label), st.here && /* @__PURE__ */ React.createElement("i", { className: cx("sc-here", st.human && "human"), "aria-hidden": "true" }), st.words && /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, ", ", st.words));
    }));
  }
  function Operator({ me, route, onGo, onBack, pushStep }) {
    const s = S.useStore();
    const live = S.useLive();
    const app = useApp();
    const items = X.journeys(s, live);
    const asked = route && route.name;
    const name = WORKSPACE.includes(asked) || X.PART_IDS.includes(asked) ? asked : "command";
    const inBatch = (n) => X.PART_IDS.includes(n);
    const it = inBatch(name) ? X.find(items, route.params && route.params.ref) : null;
    const from = X.useCameFrom(name, inBatch, X.LABELS);
    const go = (n, params, replace) => onGo({ name: n, params, replace });
    const r = { name, params: it ? { ref: it.ref } : route && route.params };
    const menu = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(X.SbItem, { icon: "layout-dashboard", label: "Command Center", on: name === "command", onClick: () => go("command") }), /* @__PURE__ */ React.createElement(X.SbItem, { icon: "boxes", label: "Batches", count: D.BATCHES.length, on: name === "batches", onClick: () => go("batches") }), /* @__PURE__ */ React.createElement(X.SbItem, { icon: "sliders-horizontal", label: "Setup", on: name === "setup", onClick: () => go("setup") }), /* @__PURE__ */ React.createElement("div", { className: "sb-label" }, "In a journey · ", items.length), items.map((b) => /* @__PURE__ */ React.createElement(X.SbBatch, { key: b.ref, it: b, on: !!it && it.ref === b.ref, onClick: () => go(X.partAt(b), { ref: b.ref }) })), /* @__PURE__ */ React.createElement("div", { className: "sb-label" }, "Reports"), /* @__PURE__ */ React.createElement(X.SbItem, { icon: "chart-line", label: "Finance & ESG", on: name === "report", onClick: () => go("report") }));
    const frame = it ? { title: it.sku.name, hideLarge: true, back: from.label, sub: null, below: /* @__PURE__ */ React.createElement(Head, { it, part: name, onPart: (p) => go(p, { ref: it.ref }, true) }) } : null;
    const body = it ? /* @__PURE__ */ React.createElement(X.PartBody, { me, it, part: name }) : S.screenFor(me, name, {});
    const current = it ? from.id === "batches" ? "batches" : "command" : name;
    return /* @__PURE__ */ React.createElement(X.Chrome, { me, route: r, onGo, onBack, nav: NAV, current, onNav: (id) => go(id, {}, true), menu, screenKey: it ? "batch:" + it.ref : name, scrollKey: name + (it ? it.ref : ""), className: it ? "sc-frame" : void 0, pushStep }, /* @__PURE__ */ React.createElement(X.FrameCtx.Provider, { value: frame }, body));
  }
  X.FrameCtx = S.SC112.FrameCtx;
  S.RoleApp = X.roleApp(Operator);
})();

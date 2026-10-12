(function() {
  const K = window.SC3, P = window.SC196;
  const { Mark, useApp } = K;
  const { useRef, useMemo } = React;
  const EXITS = ["outreach", "lister", "negotiator"];
  const GAP = [1, 1, 1, 1, 1, 1, 1.9, 1];
  function relay(w, h, tab) {
    const pad = tab ? 34 : 18, unit = (w - 2 * pad) / GAP.reduce((a, b) => a + b, 0), cy = h * (tab ? 0.52 : 0.5), d = tab ? 52 : 36;
    const xs = [pad];
    GAP.forEach((g) => xs.push(xs[xs.length - 1] + g * unit));
    return P.AG_CREW.map((c) => {
      const e = EXITS.indexOf(c.id);
      return { c, x: xs[c.stop], y: e < 0 ? cy : cy + (e - 1) * d, ox: 0, oy: 1 };
    });
  }
  const side = (n) => EXITS.includes(n.c.id) ? "right" : "below";
  function Band() {
    const app = useApp(), tab = app.bp === "tablet", w = P.useAgentWalk(), box = useRef(null), size = P.useBox(box, tab);
    const stars = useMemo(() => size ? relay(size.w, size.h, tab) : [], [size && size.w, size && size.h, tab]);
    const k = w.held ? w.held.stop : w.done ? P.AG_N : w.k;
    return /* @__PURE__ */ React.createElement("div", { className: "ag-band pb-band" }, /* @__PURE__ */ React.createElement("div", { className: "ag-bandhead" }, /* @__PURE__ */ React.createElement(Mark, { size: 22, still: true }), /* @__PURE__ */ React.createElement("b", null, "Ten agents. ", /* @__PURE__ */ React.createElement("span", null, "One yes.")), /* @__PURE__ */ React.createElement(P.AgentPlay, { w, compact: true })), /* @__PURE__ */ React.createElement("div", { ref: box, className: "pb-stage" }, /* @__PURE__ */ React.createElement(P.AgentField, { w, stars, band: !tab, local: true }), tab && size && /* @__PURE__ */ React.createElement("div", { className: "pb-stops", "aria-hidden": "true" }, P.AG_STOPS.map((s, i) => /* @__PURE__ */ React.createElement("span", { key: s.id, className: i < k ? "done" : i === k ? "now" : "", style: { left: stars.find((n) => n.c.stop === i).x } }, s.t))), size && /* @__PURE__ */ React.createElement(P.Tiles, { w, stars, names: tab, side, size: tab ? 34 : 28 })), /* @__PURE__ */ React.createElement(P.AgentCaption, { w, className: "band pb-cap" }), /* @__PURE__ */ React.createElement(P.AgentWords, { w }));
  }
  const Orig = K.AgentStage;
  K.AgentStage = function AgentStage(props) {
    const app = useApp();
    return (props.band != null ? props.band : app.bp !== "desktop") ? /* @__PURE__ */ React.createElement(Band, null) : /* @__PURE__ */ React.createElement(Orig, { ...props });
  };
})();

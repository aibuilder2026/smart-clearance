(function() {
  const K = window.SC3, P = window.SC196;
  const { cx, Mark, useApp } = K;
  const { useRef, useMemo } = React;
  function ring(w, h, tab) {
    const R = Math.min(w, h) / 2 - (tab ? 34 : 20), cxp = w / 2, cyp = h / 2;
    return P.AG_CREW.map((c, i) => {
      const a = (-90 + i * 360 / P.AG_CREW.length) * Math.PI / 180, ox = Math.cos(a), oy = Math.sin(a);
      return { c, x: cxp + R * ox, y: cyp + R * oy, ox, oy };
    });
  }
  const side = (n) => n.oy < -0.86 ? "above" : n.oy > 0.86 ? "below" : n.ox < 0 ? "left" : "right";
  function Band() {
    const app = useApp(), tab = app.bp === "tablet", w = P.useAgentWalk(), box = useRef(null), size = P.useBox(box, tab);
    const stars = useMemo(() => size ? ring(size.w, size.h, tab) : [], [size && size.w, size && size.h, tab]);
    return /* @__PURE__ */ React.createElement("div", { className: "ag-band pa-band" }, /* @__PURE__ */ React.createElement("div", { className: "ag-bandhead" }, /* @__PURE__ */ React.createElement(Mark, { size: 22, still: true }), /* @__PURE__ */ React.createElement("b", null, "Ten agents. ", /* @__PURE__ */ React.createElement("span", null, "One yes.")), /* @__PURE__ */ React.createElement(P.AgentPlay, { w, compact: true })), /* @__PURE__ */ React.createElement("div", { ref: box, className: "pa-stage" }, /* @__PURE__ */ React.createElement(P.AgentField, { w, stars, band: !tab, local: true }), /* @__PURE__ */ React.createElement("div", { className: "pa-centre" }, /* @__PURE__ */ React.createElement(P.AgentCaption, { w, className: "pa-cap" })), size && /* @__PURE__ */ React.createElement(P.Tiles, { w, stars, names: tab, side, size: tab ? 36 : 30 })), /* @__PURE__ */ React.createElement(P.AgentWords, { w }));
  }
  const Orig = K.AgentStage;
  K.AgentStage = function AgentStage(props) {
    const app = useApp();
    return (props.band != null ? props.band : app.bp !== "desktop") ? /* @__PURE__ */ React.createElement(Band, null) : /* @__PURE__ */ React.createElement(Orig, { ...props });
  };
})();

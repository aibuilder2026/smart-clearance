(function() {
  const K = window.SC3, P = window.SC196;
  const { cx, Icon, Mark, useApp } = K;
  const { useRef, useMemo, useState, useEffect, Fragment } = React;
  function around(w, h, tab) {
    const rx = w / 2 - (tab ? 40 : 24), ry = h * (tab ? 0.4 : 0.42), cxp = w / 2, cyp = h * 0.55;
    return P.AG_CREW.map((c, i) => {
      const a = (-90 + i * 360 / P.AG_CREW.length) * Math.PI / 180, ox = Math.cos(a), oy = Math.sin(a);
      return { c, x: cxp + rx * ox, y: cyp + ry * oy, ox, oy };
    });
  }
  function Around() {
    const app = useApp(), tab = app.bp === "tablet", w = P.useAgentWalk(), pill = useRef(null);
    const [host, setHost] = useState(null);
    useEffect(() => {
      const el = pill.current && pill.current.parentElement;
      if (!el) return;
      const f = () => setHost({ w: el.clientWidth, h: el.clientHeight });
      f();
      const o = new ResizeObserver(f);
      o.observe(el);
      return () => o.disconnect();
    }, []);
    const stars = useMemo(() => host ? around(host.w, host.h, tab) : [], [host && host.w, host && host.h, tab]);
    const now = w.held ? [w.held] : w.playing ? P.agAt(w.k) : [];
    const k = w.held ? w.held.stop : w.done ? P.AG_N : w.k;
    return /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement(P.AgentField, { w, stars, local: true, height: host && host.h }), /* @__PURE__ */ React.createElement("div", { className: "pc-layer", style: host ? { height: host.h } : void 0 }, host && /* @__PURE__ */ React.createElement(P.Tiles, { w, stars, size: tab ? 34 : 28 })), /* @__PURE__ */ React.createElement("div", { ref: pill, className: "sv-pill" }, /* @__PURE__ */ React.createElement("div", { className: "pc-row" }, /* @__PURE__ */ React.createElement(Mark, { size: 22, still: true }), /* @__PURE__ */ React.createElement("b", null, "Ten agents. ", /* @__PURE__ */ React.createElement("span", null, "One yes.")), /* @__PURE__ */ React.createElement(P.AgentPlay, { w, compact: true })), /* @__PURE__ */ React.createElement("div", { className: "pc-now", "aria-hidden": "true" }, now.length ? now.map((c) => /* @__PURE__ */ React.createElement("span", { key: c.id, className: cx("pc-who", c.human && "human") }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: c.icon, size: 12, stroke: 2.2 })), c.name)) : /* @__PURE__ */ React.createElement("span", { className: "pc-who rest" }, w.k < 0 ? "A batch the gates will refuse" : "Sold, not binned"), /* @__PURE__ */ React.createElement("span", { className: "pc-did" }, w.held ? w.held.did : w.playing ? now.length > 1 ? "Work the exits at once" : now[0].did : w.k < 0 ? "Ten agents and one person take it from here." : "Ten agents worked the batch. One person said yes.")), /* @__PURE__ */ React.createElement("div", { className: "pc-rail", "aria-hidden": "true" }, P.AG_STOPS.map((s, i) => /* @__PURE__ */ React.createElement("i", { key: s.id, className: cx(i < k && "done", i === k && "now", s.human && "human") }))), /* @__PURE__ */ React.createElement(P.AgentWords, { w })));
  }
  const Orig = K.AgentStage;
  K.AgentStage = function AgentStage(props) {
    const app = useApp();
    return (props.band != null ? props.band : app.bp !== "desktop") ? /* @__PURE__ */ React.createElement(Around, null) : /* @__PURE__ */ React.createElement(Orig, { ...props });
  };
})();

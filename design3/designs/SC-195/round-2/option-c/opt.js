(function() {
  const K = window.SC3, S = window.SC3_SCREENS, R = window.SC195R2;
  const { cx, Icon } = K;
  const { motion, animate, useReducedMotion } = Motion;
  const { useRef, useEffect, useState } = React;
  const W = 640, H = 470;
  const ROUTE = "M44 70 H520 A70 70 0 0 1 520 210 H120 A70 70 0 0 0 120 350 H596";
  const EXITS = ["outreach", "lister", "negotiator"];
  function Route({ w }) {
    const path = useRef(null), reduce = useReducedMotion();
    const [L, setL] = useState(0);
    const [d, setD] = useState(0);
    useEffect(() => {
      if (path.current) setL(path.current.getTotalLength());
    }, []);
    const stopAt = (i) => L * i / (R.N - 1);
    const at = (len) => path.current && L ? path.current.getPointAtLength(Math.max(0, Math.min(L, len))) : { x: 44, y: 70 };
    useEffect(() => {
      if (!L) return;
      const to = w.done ? L : w.k < 0 ? 0 : stopAt(w.k);
      if (reduce) {
        setD(to);
        return;
      }
      const c = animate(d, to, { duration: w.k <= 0 ? 0.3 : 0.38, ease: R.EASE, onUpdate: setD });
      return () => c.stop();
    }, [w.k, w.done, L, reduce]);
    const k = w.done ? R.N : w.k, dot = at(d);
    const execAt = at(stopAt(6)), forks = EXITS.map((id, i) => ({ id, x: execAt.x + 70 + i * 140, y: H - 26 }));
    return /* @__PURE__ */ React.createElement("div", { className: "r2c-route" }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, className: "r2c-svg", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: ROUTE, className: "r2c-road" }), /* @__PURE__ */ React.createElement("path", { ref: path, d: ROUTE, className: "r2c-done", style: { strokeDasharray: L || 1, strokeDashoffset: L ? L - d : 1 } }), k >= 6 && forks.map((f, i) => {
      const p = `M${execAt.x} ${execAt.y} C${execAt.x} ${execAt.y + 60}, ${f.x} ${f.y - 70}, ${f.x} ${f.y - 18}`;
      return /* @__PURE__ */ React.createElement("g", { key: f.id }, /* @__PURE__ */ React.createElement(motion.path, { d: p, className: "r2c-fork", initial: reduce ? false : { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : i * 0.06, ease: R.EASE } }), w.playing && w.k === 6 && [0, 1, 2].map((j) => /* @__PURE__ */ React.createElement("circle", { key: j, r: "3.2", className: "r2c-packet" }, /* @__PURE__ */ React.createElement("animateMotion", { dur: "0.75s", begin: `${j * 0.25}s`, repeatCount: "2", path: p }))));
    }), R.STOPS.map((s, i) => {
      const p = at(stopAt(i)), st = i < k ? "done" : i === k && w.playing ? "now" : "later";
      return /* @__PURE__ */ React.createElement("g", { key: s.id, className: cx("r2c-stop", st, s.human && "human") }, /* @__PURE__ */ React.createElement("circle", { cx: p.x, cy: p.y, r: s.human ? 10 : 7.5 }));
    }), L > 0 && !w.done && w.k >= 0 && /* @__PURE__ */ React.createElement("circle", { cx: dot.x, cy: dot.y, r: "6", className: "r2c-batch" }), w.done && /* @__PURE__ */ React.createElement("g", { transform: `translate(${at(L).x} ${at(L).y})` }, /* @__PURE__ */ React.createElement(motion.g, { initial: reduce ? false : { y: -26, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 22, mass: 1 } }, /* @__PURE__ */ React.createElement("path", { d: "M0 0 C-7 -9 -12 -14 -12 -21 A12 12 0 0 1 12 -21 C12 -14 7 -9 0 0 Z", className: "r2c-pin" }), /* @__PURE__ */ React.createElement("circle", { cy: "-21", r: "4.5", className: "r2c-pin-eye" })), !reduce && /* @__PURE__ */ React.createElement(motion.circle, { r: "10", className: "r2c-ping", initial: { scale: 0.6, opacity: 0.9 }, animate: { scale: 2.4, opacity: 0 }, transition: { duration: 0.9, ease: "easeOut" } }))), L > 0 && R.STOPS.map((s, i) => {
      if (s.id === "execute") return null;
      const p = at(stopAt(i)), below = p.y < 140 || s.id === "report", crew = R.crewAt(i);
      return /* @__PURE__ */ React.createElement("div", { key: s.id, className: cx("r2c-at", below ? "below" : "above"), style: { left: p.x / W * 100 + "%", top: p.y / H * 100 + "%" } }, /* @__PURE__ */ React.createElement("span", { className: "r2c-name" }, s.t), crew.map((c) => /* @__PURE__ */ React.createElement(R.Chip, { key: c.id, c, st: w.state(c), small: true })));
    }), L > 0 && /* @__PURE__ */ React.createElement("div", { className: "r2c-at above", style: { left: execAt.x / W * 100 + "%", top: execAt.y / H * 100 + "%" } }, /* @__PURE__ */ React.createElement("span", { className: "r2c-name" }, "Execute")), L > 0 && k >= 6 && forks.map((f) => {
      const c = R.CREW.find((x) => x.id === f.id);
      return /* @__PURE__ */ React.createElement("div", { key: f.id, className: "r2c-at exit", style: { left: f.x / W * 100 + "%", top: f.y / H * 100 + "%" } }, /* @__PURE__ */ React.createElement(R.Chip, { c, st: w.state(c), small: true }));
    }));
  }
  function Line({ w }) {
    const k = w.done ? R.N : w.k;
    return /* @__PURE__ */ React.createElement("div", { className: "r2c-line" }, /* @__PURE__ */ React.createElement("div", { className: "r2c-track" }, /* @__PURE__ */ React.createElement("i", { style: { width: `${Math.max(0, Math.min(1, (w.done ? 8 : Math.max(0, w.k)) / 8)) * 100}%` } })), R.STOPS.map((s, i) => /* @__PURE__ */ React.createElement("span", { key: s.id, className: cx("r2c-tick", i < k ? "done" : i === k && w.playing ? "now" : "later", s.human && "human"), style: { left: i / 8 * 100 + "%" } })));
  }
  function Grid() {
    return /* @__PURE__ */ React.createElement("div", { className: "r2c-grid" });
  }
  function Stage() {
    const w = R.useWalk();
    return /* @__PURE__ */ React.createElement("div", { className: "si-stage r2-stage" }, /* @__PURE__ */ React.createElement(R.Head, null, /* @__PURE__ */ React.createElement(R.Replay, { w })), /* @__PURE__ */ React.createElement(R.SrStops, null), /* @__PURE__ */ React.createElement("div", { className: "r2c-area" }, /* @__PURE__ */ React.createElement(Route, { w }), /* @__PURE__ */ React.createElement(R.Caption, { w, className: "r2c-cap" })), /* @__PURE__ */ React.createElement(R.Ground, null, /* @__PURE__ */ React.createElement(Grid, null)));
  }
  const BandLine = () => {
    const w = R.useWalk();
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(R.BandHead, null), /* @__PURE__ */ React.createElement(Line, { w }), /* @__PURE__ */ React.createElement(R.Caption, { w, className: "band" }));
  };
  S.HeroStage = Stage;
  const Orig = S.Live.SignInLive;
  S.Live.SignInLive = (props) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Orig, { ...props }), /* @__PURE__ */ React.createElement(R.Band, null, /* @__PURE__ */ React.createElement(BandLine, null)));
})();

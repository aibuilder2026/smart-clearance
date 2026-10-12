(function() {
  const K = window.SC3, S = window.SC3_SCREENS, R = window.SC195R2;
  const { cx, Icon, Aura } = K;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const SPRING = { type: "spring", stiffness: 300, damping: 30, mass: 1 };
  function Run({ c, now, compact }) {
    const s = R.STOPS[c.stop];
    return /* @__PURE__ */ React.createElement("div", { className: cx("r2b-run", c.human && "human", compact && "compact") }, /* @__PURE__ */ React.createElement(Aura, { on: now, as: "span", className: "r2b-tile" }, /* @__PURE__ */ React.createElement(Icon, { name: c.icon, size: compact ? 16 : 20, stroke: 2 })), /* @__PURE__ */ React.createElement("div", { className: "r2b-body" }, /* @__PURE__ */ React.createElement("div", { className: "r2b-top" }, /* @__PURE__ */ React.createElement("b", null, c.name), /* @__PURE__ */ React.createElement("span", { className: "r2b-stop" }, s.t, " · ", c.stop + 1, " of 9"), now && /* @__PURE__ */ React.createElement("span", { className: "r2b-now" }, c.human ? "your yes" : "working")), /* @__PURE__ */ React.createElement("p", null, c.did), !compact && /* @__PURE__ */ React.createElement("code", null, c.call)));
  }
  function Deck({ w, compact }) {
    const reduce = useReducedMotion();
    const shown = R.CREW.filter((c) => c.stop <= (w.done ? R.N : w.k));
    const groups = [];
    shown.forEach((c) => {
      const g = groups.find((x) => x.stop === c.stop);
      g ? g.crew.push(c) : groups.push({ stop: c.stop, crew: [c] });
    });
    const depth = groups.length;
    return /* @__PURE__ */ React.createElement("div", { className: cx("r2b-deck", compact && "compact") }, /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, groups.map((g, gi) => {
      const d = depth - 1 - gi;
      if (d > (compact ? 2 : 5)) return null;
      return g.crew.map((c, ci) => {
        const fan = g.crew.length > 1 ? ci - (g.crew.length - 1) / 2 : 0;
        const target = { y: -d * (compact ? 26 : 50), x: fan * (compact ? 14 : 22) * (d === 0 ? 1 : 0.4), rotate: fan * (d === 0 ? 2.2 : 1), scale: 1 - d * 0.055, opacity: d > (compact ? 2 : 4) ? 0 : 1 - d * 0.14, filter: `blur(${(d * (compact ? 1.2 : 1.5)).toFixed(1)}px)` };
        return /* @__PURE__ */ React.createElement(motion.div, { key: c.id, className: "r2b-slot", style: { zIndex: 20 - d * 3 + ci }, initial: reduce ? false : { y: 70, opacity: 0, scale: 1.04, filter: "blur(0px)" }, animate: target, exit: { opacity: 0 }, transition: reduce ? { duration: 0 } : SPRING }, /* @__PURE__ */ React.createElement(Run, { c, now: w.playing && c.stop === w.k, compact }));
      });
    })));
  }
  function Haze() {
    const reduce = useReducedMotion();
    const rnd = R.seeded(1951);
    const ghosts = R.CREW.map((c, i) => ({ c, x: 4 + rnd() * 88, y: 4 + rnd() * 86, s: 0.7 + rnd() * 0.5, b: 3.5 + rnd() * 4, o: 0.34 + rnd() * 0.22 }));
    return /* @__PURE__ */ React.createElement("div", { className: "r2b-haze" }, ghosts.map((g, i) => /* @__PURE__ */ React.createElement(motion.div, { key: g.c.id, className: "r2b-ghost", style: { left: g.x + "%", top: g.y + "%", filter: `blur(${g.b.toFixed(1)}px)` }, initial: reduce ? false : { opacity: 0, y: 24, scale: g.s * 0.96 }, animate: { opacity: g.o, y: 0, scale: g.s }, transition: { duration: reduce ? 0 : 2.4, delay: reduce ? 0 : i * 0.08, ease: R.EASE } }, /* @__PURE__ */ React.createElement(Run, { c: g.c, compact: true }))));
  }
  function Stage() {
    const w = R.useWalk();
    return /* @__PURE__ */ React.createElement("div", { className: "si-stage r2-stage" }, /* @__PURE__ */ React.createElement(R.Head, null, /* @__PURE__ */ React.createElement(R.Replay, { w })), /* @__PURE__ */ React.createElement(R.SrStops, null), /* @__PURE__ */ React.createElement("div", { className: "r2b-area" }, /* @__PURE__ */ React.createElement(Deck, { w }), /* @__PURE__ */ React.createElement(R.Caption, { w, className: "r2b-cap" })), /* @__PURE__ */ React.createElement(R.Ground, null, /* @__PURE__ */ React.createElement(Haze, null)));
  }
  const BandDeck = () => {
    const w = R.useWalk();
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(R.BandHead, null), /* @__PURE__ */ React.createElement(Deck, { w, compact: true }), /* @__PURE__ */ React.createElement(R.Caption, { w, className: "band" }));
  };
  S.HeroStage = Stage;
  const Orig = S.Live.SignInLive;
  S.Live.SignInLive = (props) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Orig, { ...props }), /* @__PURE__ */ React.createElement(R.Band, null, /* @__PURE__ */ React.createElement(BandDeck, null)));
})();

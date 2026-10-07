(function() {
  const { createContext, useContext, useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, S = window.SC3_SCREENS, D = window.SC3_DATA;
  const { cx, Icon, useApp } = K;
  Object.assign(window.SC3_ICONS, {
    "book-open": '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    "bell-off": '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742"/><path d="m2 2 20 20"/><path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05"/>',
    "square-plus": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>',
    "fast-forward": '<path d="M12 6v12l8.5-6z"/><path d="M3.5 6v12l8.5-6z"/>',
    "share-ios": '<path d="M12 2v13"/><path d="m16 6-4-4-4 4"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>'
  });
  const LiveCtx = createContext({ conn: "live", since: "09:31", clock: { date: "Fri 2 Oct", long: "Friday 2 October", time: "09:31", perDay: 5 } });
  const useLive = () => useContext(LiveCtx);
  const OPT = () => window.SC68_OPT || {};
  const cue = (perDay) => perDay >= 1440 ? "real time" : perDay >= 60 ? `1 day = ${Math.round(perDay / 60 * 10) / 10} h` : `1 day = ${perDay} min`;
  const journeySpan = (perDay) => {
    const m = 47 * perDay;
    return perDay >= 1440 ? "A 47-day batch journey takes 47 days." : `A 47-day batch journey takes about ${m < 90 ? Math.round(m) + " minutes" : Math.round(m / 6) / 10 + " hours"}.`;
  };
  const untilNine = (clock) => {
    const [h, m] = clock.time.split(":").map(Number);
    const j = (1440 - (h * 60 + m) + 540) % 1440 || 1440;
    const r = j / 1440 * clock.perDay;
    return r < 1.5 ? "about a minute" : r < 90 ? `about ${Math.round(r)} minutes` : `about ${Math.round(r / 60)} hours`;
  };
  const cueLong = (perDay) => perDay >= 1440 ? "The journey runs in real time." : `One journey day lasts ${perDay >= 60 ? Math.round(perDay / 60 * 10) / 10 + " hours" : perDay + " minutes"} of real time.`;
  function ConnMark({ conn, size = 8 }) {
    const reduce = useReducedMotion();
    const was = useRef(conn);
    const [ping, setPing] = useState(0);
    useEffect(() => {
      if (was.current !== conn && conn === "live" && !reduce) setPing((p) => p + 1);
      was.current = conn;
    }, [conn]);
    if (conn === "reconnecting" || conn === "connecting") return /* @__PURE__ */ React.createElement("span", { className: "x68-conn x68-conn-spin", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "loader", size: size + 6, stroke: 2.4 }));
    if (conn === "offline") return /* @__PURE__ */ React.createElement("span", { className: "x68-conn x68-conn-off", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "wifi-off", size: size + 6, stroke: 2.2 }));
    return /* @__PURE__ */ React.createElement("span", { className: "x68-conn", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", { className: "x68-dot", style: { width: size, height: size } }), ping > 0 && /* @__PURE__ */ React.createElement(motion.i, { key: ping, className: "x68-ping", style: { width: size, height: size }, initial: { scale: 1, opacity: 0.7 }, animate: { scale: 2.8, opacity: 0 }, transition: { duration: 0.9, repeat: 1, ease: "easeOut" } }));
  }
  const connWords = (conn, since) => conn === "reconnecting" ? `Reconnecting \xB7 updates paused at ${since}` : conn === "offline" ? `Offline \xB7 showing ${since}` : conn === "connecting" ? "Catching up" : "Live";
  function ClockTime({ clock, withDate = true, className }) {
    return /* @__PURE__ */ React.createElement("span", { className: cx("x68-time", className) }, withDate && /* @__PURE__ */ React.createElement("span", { className: "x68-date" }, clock.date), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, clock.time));
  }
  function Cue({ perDay, short }) {
    if (perDay >= 1440) return null;
    return /* @__PURE__ */ React.createElement("span", { className: "x68-cue", title: cueLong(perDay) }, /* @__PURE__ */ React.createElement(Icon, { name: "fast-forward", size: 13, stroke: 2.2 }), short ? /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, cue(perDay)) : /* @__PURE__ */ React.createElement("span", null, cue(perDay)));
  }
  function Page68({ title, sub, back, onBack, actions, lead, children, wide, pad = true, hideLarge, barSub, below, top }) {
    const sentinel = useRef(null);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
      const s = sentinel.current;
      if (!s) return;
      let root = s.parentElement;
      while (root && !(root.classList && root.classList.contains("scroll"))) root = root.parentElement;
      const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { root: root || null, threshold: 0 });
      io.observe(s);
      return () => io.disconnect();
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "layer" }, /* @__PURE__ */ React.createElement("header", { className: cx("navbar", scrolled && "scrolled", barSub && "x68-nb2") }, back ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "nb-back", onClick: onBack, "aria-label": "Back to " + back }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 22, stroke: 2.2 }), /* @__PURE__ */ React.createElement("span", { className: "nb-back-t" }, back)) : lead || null, /* @__PURE__ */ React.createElement("span", { className: "nb-title" }, title, barSub && /* @__PURE__ */ React.createElement("span", { className: "x68-nbsub" }, barSub)), /* @__PURE__ */ React.createElement("div", { className: "nb-actions" }, actions)), top, !hideLarge && /* @__PURE__ */ React.createElement("div", { className: "largetitle" }, /* @__PURE__ */ React.createElement("h1", null, title), sub && /* @__PURE__ */ React.createElement("div", { className: "lt-sub" }, sub)), below, /* @__PURE__ */ React.createElement("div", { ref: sentinel, style: { height: 1, marginTop: -1 }, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "pagebody", style: pad ? { padding: "0 var(--page-x, 16px) 40px", maxWidth: wide ? "none" : 1320 } : void 0 }, children));
  }
  function Screen68({ me, title, sub, back, children, actions, wide, hideLarge, below }) {
    const { back: goBack } = S.useRoute();
    const app = useApp();
    const ws = useContext(S.WorkspaceCtx);
    const o = OPT();
    const lead = app.bp === "phone" && ws ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "ws-lead", onClick: ws.open, "aria-label": `${ws.name} workspace, on Smart-Clearance` }, /* @__PURE__ */ React.createElement(K.Mark, { size: 24, still: true }), /* @__PURE__ */ React.createElement("span", { className: "ws-sep", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement(K.WorkspaceMark, { ws: D.WORKSPACE, size: 26 })) : null;
    const extra = /* @__PURE__ */ React.createElement(React.Fragment, null, o.NavExtra ? /* @__PURE__ */ React.createElement(o.NavExtra, { me }) : null, actions);
    const subNode = o.HeaderLine ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "x68-subtext" }, sub), /* @__PURE__ */ React.createElement(o.HeaderLine, { me })) : sub;
    return /* @__PURE__ */ React.createElement(
      Page68,
      {
        title,
        sub: subNode,
        back,
        onBack: goBack,
        lead,
        actions: /* @__PURE__ */ React.createElement(S.TopActions, { me, extra }),
        wide,
        hideLarge,
        barSub: o.BarSub ? /* @__PURE__ */ React.createElement(o.BarSub, null) : null,
        below,
        top: o.PageTop ? /* @__PURE__ */ React.createElement(o.PageTop, { me }) : null
      },
      children
    );
  }
  S.Screen = Screen68;
  window.SC68 = Object.assign(window.SC68 || {}, { LiveCtx, useLive, OPT, cue, cueLong, journeySpan, untilNine, ConnMark, connWords, ClockTime, Cue, Page68, Screen68 });
})();

(function() {
  const { useState, useEffect, useRef, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion, LayoutGroup } = Motion;
  const K = window.SC3, W = window.SC49_SHARED, P = window.SC3_PLATFORM, D = window.SC3_DATA, fmt = window.SC3_MONEY.fmt;
  const { cx, Icon, Page, WorkspaceMark, Roll, useApp } = K;
  const EASE = W.EASE;
  function RouteBar({ done }) {
    const reduce = useReducedMotion();
    const [gone, setGone] = useState(false);
    useEffect(() => {
      if (!done) return;
      const t = setTimeout(() => setGone(true), reduce ? 0 : 760);
      return () => clearTimeout(t);
    }, [done]);
    if (gone) return null;
    return /* @__PURE__ */ React.createElement(motion.div, { className: "a-route", "aria-hidden": "true", animate: { opacity: done ? 0 : 1 }, transition: { duration: 0.24, delay: done && !reduce ? 0.5 : 0 } }, /* @__PURE__ */ React.createElement(motion.i, { className: "line", initial: { width: reduce ? "88%" : "0%" }, animate: { width: done ? "100%" : "88%" }, transition: done ? { duration: reduce ? 0 : 0.16, ease: EASE } : { duration: reduce ? 0 : W.FILL / 1e3 * 1.25, ease: [0.3, 0.7, 0.4, 1] } }, /* @__PURE__ */ React.createElement(motion.b, { className: "pin", initial: false, animate: done ? { scale: [0, 1.35, 1], opacity: 1 } : { scale: 0.6, opacity: 1 }, transition: { duration: reduce ? 0 : 0.42, ease: EASE, delay: done && !reduce ? 0.12 : 0 } })));
  }
  function Bones({ kind }) {
    if (kind === "tile") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b w40" }), /* @__PURE__ */ React.createElement("i", { className: "b big w60" }), /* @__PURE__ */ React.createElement("i", { className: "b spark" }));
    if (kind === "card") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b w30" }), /* @__PURE__ */ React.createElement("i", { className: "b w20 thin" }), /* @__PURE__ */ React.createElement("i", { className: "b area" }));
    if (kind === "row") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b dot" }), /* @__PURE__ */ React.createElement("span", { className: "col" }, /* @__PURE__ */ React.createElement("i", { className: "b w50" }), /* @__PURE__ */ React.createElement("i", { className: "b w30 thin" })), /* @__PURE__ */ React.createElement("i", { className: "b w10" }));
    if (kind === "head") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b mark" }), /* @__PURE__ */ React.createElement("span", { className: "col" }, /* @__PURE__ */ React.createElement("i", { className: "b w30" }), /* @__PURE__ */ React.createElement("i", { className: "b w50 thin" })));
    if (kind === "field") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b w30 thin" }), /* @__PURE__ */ React.createElement("i", { className: "b input" }));
    return /* @__PURE__ */ React.createElement("i", { className: "b fill" });
  }
  function Skeleton({ shape }) {
    const app = useApp();
    const phone = app.bp === "phone";
    return /* @__PURE__ */ React.createElement("div", { className: "a-skel" }, W.blocks(shape, phone).map((r) => /* @__PURE__ */ React.createElement("div", { key: r.row, className: cx("a-row", "k-" + r.kind), style: { gridTemplateColumns: r.widths ? r.widths.map((x) => x + "fr").join(" ") : `repeat(${r.cols}, minmax(0, 1fr))`, width: r.width ? r.width * 100 + "%" : void 0 } }, r.items.map((i) => /* @__PURE__ */ React.createElement("div", { key: i, className: cx("a-blk", "k-" + r.kind), style: { height: r.h, "--i": i } }, /* @__PURE__ */ React.createElement(Bones, { kind: r.kind }))))));
  }
  function Stage({ k, shape, kind, title, children }) {
    const ready = W.useLoad(k, kind);
    const skel = /* @__PURE__ */ React.createElement("div", { className: "a-load", role: "status", "aria-busy": "true" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Loading ", kind === "tab" ? "the tab" : title), /* @__PURE__ */ React.createElement(Skeleton, { shape }));
    return /* @__PURE__ */ React.createElement("div", { className: "a-stage", "data-kind": kind }, /* @__PURE__ */ React.createElement(RouteBar, { key: k, done: ready }), ready ? /* @__PURE__ */ React.createElement("div", { className: "a-in", "data-kind": kind }, children) : kind === "screen" ? /* @__PURE__ */ React.createElement(Page, { title }, skel) : skel);
  }
  const S_PATH = "M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5";
  function RouteS() {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement("svg", { className: "a-s", width: "20", height: "20", viewBox: "12 12 40 40", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("circle", { cx: "43.5", cy: "19", r: "4", fill: "currentColor" }), /* @__PURE__ */ React.createElement(motion.path, { d: S_PATH, fill: "none", stroke: "currentColor", strokeWidth: "5", strokeLinecap: "round", strokeLinejoin: "round", initial: { pathLength: reduce ? 1 : 0 }, animate: { pathLength: 1 }, transition: { duration: reduce ? 0 : 1.1, ease: [0.65, 0, 0.35, 1] } }));
  }
  function Tick() {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement(motion.svg, { className: "a-tick", width: "20", height: "20", viewBox: "0 0 24 24", "aria-hidden": "true", initial: reduce ? false : { scale: 0.4 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 520, damping: 22 } }, /* @__PURE__ */ React.createElement(motion.path, { d: "M5 12.5l4.5 4.5L19 7.5", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", initial: { pathLength: reduce ? 1 : 0 }, animate: { pathLength: 1 }, transition: { duration: reduce ? 0 : 0.28, ease: EASE } }));
  }
  function SignInButton({ phase, name }) {
    const reduce = useReducedMotion();
    const busy = phase === "busy", done = phase === "done", err = phase === "error";
    const label = done ? `Welcome, ${name}` : busy ? "Signing in\u2026" : "Sign in";
    return /* @__PURE__ */ React.createElement(
      motion.button,
      {
        type: "submit",
        className: cx("btn btn-primary btn-lg btn-block a-signin", (busy || done) && "on"),
        "aria-disabled": busy || done || void 0,
        animate: err && !reduce ? { x: [0, -8, 8, -5, 5, -2, 0] } : { x: 0 },
        transition: { duration: 0.36, ease: "easeOut" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "a-si-ic", "aria-hidden": "true" }, done ? /* @__PURE__ */ React.createElement(Tick, null) : busy ? /* @__PURE__ */ React.createElement(RouteS, null) : /* @__PURE__ */ React.createElement(Icon, { name: "log-in", size: 18 })),
      /* @__PURE__ */ React.createElement("span", { className: "a-si-lbl" }, /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "popLayout", initial: false }, /* @__PURE__ */ React.createElement(motion.span, { key: label, initial: reduce ? false : { y: 12, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -12, opacity: 0 }, transition: { duration: 0.24, ease: EASE } }, label))),
      (busy || done) && /* @__PURE__ */ React.createElement(motion.i, { className: "a-si-prog", "aria-hidden": "true", initial: { scaleX: reduce ? 0.9 : 0 }, animate: { scaleX: done ? 1 : 0.9 }, transition: { duration: reduce ? 0 : done ? 0.16 : 1.3, ease: done ? EASE : [0.3, 0.7, 0.4, 1] } }),
      /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, busy ? "Signing in" : done ? `Signed in. Welcome, ${name}.` : "")
    );
  }
  function Num({ value, format }) {
    return /* @__PURE__ */ React.createElement(Roll, { value, format, from: 0 });
  }
  function Sparkline({ values, tone }) {
    const box = useRef(null);
    const w = W.useWidth(box, 220);
    const reduce = useReducedMotion();
    const H = 36, max = Math.max(1, ...values), n = values.length;
    const X = (i) => n > 1 ? i / (n - 1) * w : w / 2, Y = (v) => H - 3 - v / max * (H - 8);
    const line = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const col = tone === "amber" ? "var(--amber)" : "var(--primary)";
    return /* @__PURE__ */ React.createElement("div", { ref: box, className: "a-spark-box" }, /* @__PURE__ */ React.createElement("svg", { className: "cs-ov-spark", viewBox: `0 0 ${w} ${H}`, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(motion.path, { key: "a" + n, fill: col, initial: { opacity: 0, d: `${line} L${w} ${H} L0 ${H} Z` }, animate: { opacity: 0.1, d: `${line} L${w} ${H} L0 ${H} Z` }, transition: { opacity: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : 0.45 }, d: { duration: reduce ? 0 : 0.42, ease: EASE } } }), /* @__PURE__ */ React.createElement(motion.path, { key: "l" + n, fill: "none", stroke: col, strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round", initial: { pathLength: reduce ? 1 : 0, d: line }, animate: { pathLength: 1, d: line }, transition: { pathLength: { duration: reduce ? 0 : 0.7, ease: EASE, delay: reduce ? 0 : 0.15 }, d: { duration: reduce ? 0 : 0.42, ease: EASE } } })));
  }
  function RecoveredChart({ byDay, height }) {
    const box = useRef(null);
    const w = W.useWidth(box);
    const [hover, setHover] = useState(null);
    const reduce = useReducedMotion();
    const g = W.chartGeometry(byDay, w, height);
    const today = byDay[byDay.length - 1];
    const prev = W.usePrevious(today ? today.recovered : 0);
    const [gain, setGain] = useState(null);
    useEffect(() => {
      if (today && prev != null && today.recovered > prev) {
        setGain({ v: today.recovered - prev, at: Date.now() });
        const t = setTimeout(() => setGain(null), 2600);
        return () => clearTimeout(t);
      }
    }, [today && today.recovered]);
    const tx = g.X(g.n - 1), ty = g.Y(today ? today.recovered : 0);
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ov-chart a-chart", ref: box, onMouseLeave: () => setHover(null) }, /* @__PURE__ */ React.createElement(W.ChartFrame, { byDay, H: height, w, g, hover, setHover, label: W.chartLabel(byDay) }, /* @__PURE__ */ React.createElement(motion.path, { key: "a" + g.n, fill: "var(--primary)", initial: { opacity: 0, d: g.area }, animate: { opacity: 0.1, d: g.area }, transition: { opacity: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : 0.7 }, d: { duration: reduce ? 0 : 0.42, ease: EASE } } }), /* @__PURE__ */ React.createElement(motion.path, { key: "l" + g.n, fill: "none", stroke: "var(--primary)", strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round", initial: { pathLength: reduce ? 1 : 0, d: g.line }, animate: { pathLength: 1, d: g.line }, transition: { pathLength: { duration: reduce ? 0 : 0.9, ease: [0.45, 0, 0.25, 1] }, d: { duration: reduce ? 0 : 0.42, ease: EASE } } }), /* @__PURE__ */ React.createElement(motion.g, { key: "t" + g.n, initial: reduce ? false : { scale: 0, opacity: 0, x: tx, y: ty }, animate: { scale: 1, opacity: 1, x: tx, y: ty }, transition: { scale: { delay: reduce ? 0 : 0.9, type: "spring", stiffness: 420, damping: 20 }, opacity: { delay: reduce ? 0 : 0.9, duration: 0.16 }, x: { duration: reduce ? 0 : 0.42, ease: EASE }, y: { duration: reduce ? 0 : 0.42, ease: EASE } } }, gain && !reduce && /* @__PURE__ */ React.createElement(motion.circle, { key: gain.at, r: "5", fill: "none", stroke: "var(--primary)", strokeWidth: "2", initial: { scale: 1, opacity: 0.7 }, animate: { scale: 3, opacity: 0 }, transition: { duration: 1.2, ease: "easeOut" } }), /* @__PURE__ */ React.createElement("circle", { r: "4.5", fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: "2" }))), /* @__PURE__ */ React.createElement(AnimatePresence, null, gain && /* @__PURE__ */ React.createElement(motion.span, { key: gain.at, className: "a-gain", style: { left: `${tx / w * 100}%`, top: ty - 36, x: "-100%" }, initial: reduce ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: reduce ? 0 : -6 }, transition: { duration: 0.24, ease: EASE } }, "+", fmt.inr(gain.v))), /* @__PURE__ */ React.createElement(W.ChartTip, { byDay, hover, g, w }));
  }
  const STAGES = D.STAGES.map((x) => x.id);
  const AT = STAGES.map((id) => P.AGENTS.filter((a) => a.stage === id));
  const SHOW = 3;
  const todayISO = () => P.TODAY;
  function Token({ b, c, moved }) {
    return /* @__PURE__ */ React.createElement(motion.span, { layoutId: "tok-" + b.client + "/" + b.ref, layout: "position", className: cx("a-tok", moved && "moved"), transition: { layout: { type: "spring", stiffness: 170, damping: 24, mass: 1 } } }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 22 }));
  }
  function AgentsAtWork({ s, d, paused, titles, client, value, onPick }) {
    const app = useApp();
    const reduce = useReducedMotion();
    const phone = app.bp === "phone";
    const all = useMemo(() => s.batches.map((b) => Object.assign({}, b, { current: b.closedAt ? 9 : b.current })), [s.batches]);
    const moves = W.useMoves(all);
    const recent = useMemo(() => new Set(moves.map((m) => m.key)), [moves]);
    const [lit, setLit] = useState({});
    useEffect(() => {
      if (!moves.length) return;
      const l = {};
      moves.forEach((m) => {
        l[m.to] = Date.now();
      });
      setLit(l);
      const t = setTimeout(() => setLit({}), 1600);
      return () => clearTimeout(t);
    }, [moves]);
    const day = todayISO();
    const dayStart = Date.parse(day + "T00:00:00+05:30");
    const at = (i) => all.filter((b) => i === 9 ? b.closedAt && Date.parse(b.closedAt) >= dayStart : !b.closedAt && Math.min(b.current, 8) === i).sort((x, y) => (recent.has(y.client + "/" + y.ref) ? 1 : 0) - (recent.has(x.client + "/" + x.ref) ? 1 : 0) || (i === 9 ? y.closedAt > x.closedAt ? 1 : -1 : x.ref < y.ref ? -1 : 1));
    const closedToday = at(9);
    const recToday = d.byDay[d.byDay.length - 1] ? d.byDay[d.byDay.length - 1].recovered : 0;
    const run = s.runs[0];
    const ra = run && P.AGENTS.find((a) => a.id === run.agent);
    const rc = run && client(run.client);
    const cols = titles.map((t, i) => ({ i, t, list: at(i), human: i === 5, agents: AT[i] }));
    return /* @__PURE__ */ React.createElement("section", { className: "cs-ov-card a-work", "aria-labelledby": "a-work-t" }, /* @__PURE__ */ React.createElement("div", { className: "cs-ov-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "t", id: "a-work-t" }, "Agents at work"), /* @__PURE__ */ React.createElement("div", { className: "s" }, d.inFlight, " batch", d.inFlight === 1 ? "" : "es", " on the route \xB7 each mark is a client's batch, moving as the agents finish")), /* @__PURE__ */ React.createElement("span", { className: cx("a-state", paused && "paused") }, paused ? "Paused" : "Moving as readings arrive")), /* @__PURE__ */ React.createElement(LayoutGroup, { id: "a-route" }, /* @__PURE__ */ React.createElement("div", { className: "a-track", role: "group", "aria-label": "Batches in flight by stop" }, /* @__PURE__ */ React.createElement("i", { className: "a-rail", "aria-hidden": "true" }), cols.map((col) => {
      const shown = col.list.slice(0, SHOW), more = col.list.length - shown.length, on = lit[col.i];
      const name = col.human ? "You" : col.agents.length > 1 ? `${col.agents[0].name} +${col.agents.length - 1}` : col.agents[0] ? col.agents[0].name : "";
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: col.t,
          type: "button",
          className: cx("a-stop", col.human && "human", !col.list.length && "zero", on && "lit"),
          "aria-pressed": value === col.i,
          "aria-label": `${col.t}, ${col.human ? "waiting for a person" : name}: ${col.list.length} batch${col.list.length === 1 ? "" : "es"}. ${value === col.i ? "Shown in the table" : "Show them in the table"}`,
          onClick: () => onPick(value === col.i ? null : col.i)
        },
        /* @__PURE__ */ React.createElement("span", { className: "toks", "aria-hidden": "true" }, shown.map((b) => /* @__PURE__ */ React.createElement(Token, { key: b.client + "/" + b.ref, b, c: client(b.client), moved: recent.has(b.client + "/" + b.ref) })), more > 0 && /* @__PURE__ */ React.createElement("span", { className: "more" }, "+", more)),
        /* @__PURE__ */ React.createElement("span", { className: "node", "aria-hidden": "true" }, on && !reduce && /* @__PURE__ */ React.createElement(motion.i, { className: "ping", initial: { scale: 1, opacity: 0.55 }, animate: { scale: 2.1, opacity: 0 }, transition: { duration: 1.2, ease: "easeOut" } }), /* @__PURE__ */ React.createElement(Icon, { name: col.human ? "hand" : (col.agents[0] || {}).icon || "bot", size: 16 })),
        /* @__PURE__ */ React.createElement("span", { className: "lbl", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("b", null, col.t), /* @__PURE__ */ React.createElement("span", null, name)),
        /* @__PURE__ */ React.createElement("span", { className: "n", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Roll, { value: col.list.length }))
      );
    }), /* @__PURE__ */ React.createElement("div", { className: "a-stop end", "aria-label": `Closed today: ${closedToday.length} batch${closedToday.length === 1 ? "" : "es"}, ${fmt.inr(recToday)} recovered`, role: "img" }, /* @__PURE__ */ React.createElement("span", { className: "toks", "aria-hidden": "true" }, closedToday.slice(0, SHOW).map((b) => /* @__PURE__ */ React.createElement(Token, { key: b.client + "/" + b.ref, b, c: client(b.client), moved: recent.has(b.client + "/" + b.ref) })), closedToday.length > SHOW && /* @__PURE__ */ React.createElement("span", { className: "more" }, "+", closedToday.length - SHOW)), /* @__PURE__ */ React.createElement("span", { className: "node", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "indian-rupee", size: 16 })), /* @__PURE__ */ React.createElement("span", { className: "lbl", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("b", null, "Closed today"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Roll, { value: Math.round(recToday), format: (v) => "\u20B9" + Math.round(v).toLocaleString("en-IN") }))), /* @__PURE__ */ React.createElement("span", { className: "n", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Roll, { value: closedToday.length }))))), /* @__PURE__ */ React.createElement("div", { className: "a-ticker", "aria-live": "polite" }, run && /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "popLayout", initial: false }, /* @__PURE__ */ React.createElement(motion.p, { key: (run.fresh || "") + run.at + run.text, initial: reduce ? false : { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -10 }, transition: { duration: 0.24, ease: EASE } }, /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote" }, run.at), /* @__PURE__ */ React.createElement("b", null, ra ? ra.name : run.agent), /* @__PURE__ */ React.createElement("span", { className: "who" }, rc ? rc.name : run.client), /* @__PURE__ */ React.createElement("span", { className: "txt" }, run.text)))));
  }
  window.SC49 = { option: "a", Stage, SignInButton, ERROR_MS: 360, SIGNED_IN_MS: 720, Num, Sparkline, RecoveredChart, AgentsAtWork, hideStops: true };
})();

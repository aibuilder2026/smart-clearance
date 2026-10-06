(function() {
  const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, W = window.SC49_SHARED, P = window.SC3_PLATFORM, D = window.SC3_DATA, fmt = window.SC3_MONEY.fmt;
  const { cx, Icon, Page, useApp } = K;
  const EASE = W.EASE;
  const SLOSH = { type: "spring", stiffness: 140, damping: 14, mass: 1 };
  function Vessels({ shape, level, still }) {
    const app = useApp();
    const phone = app.bp === "phone";
    return /* @__PURE__ */ React.createElement("div", { className: "b-skel" }, W.blocks(shape, phone).map((r) => /* @__PURE__ */ React.createElement("div", { key: r.row, className: cx("b-row", "k-" + r.kind), style: { gridTemplateColumns: r.widths ? r.widths.map((x) => x + "fr").join(" ") : `repeat(${r.cols}, minmax(0, 1fr))`, width: r.width ? r.width * 100 + "%" : void 0 } }, r.items.map((i) => /* @__PURE__ */ React.createElement("div", { key: i, className: cx("b-blk", "k-" + r.kind), style: { height: r.h } }, /* @__PURE__ */ React.createElement(motion.i, { className: "b-ink", initial: { y: "100%" }, animate: { y: `${(1 - level) * 100}%` }, transition: still ? { duration: 0 } : level >= 1 ? { duration: 0.2, ease: EASE } : { duration: W.FILL / 1e3 * 1.3, ease: [0.25, 0.6, 0.35, 1], delay: i * 0.04 } }))))));
  }
  function Stage({ k, shape, kind, title, children }) {
    const ready = W.useLoad(k, kind);
    const reduce = useReducedMotion();
    const [drain, setDrain] = useState(false);
    useEffect(() => {
      if (!ready) {
        setDrain(false);
        return;
      }
      if (reduce) return;
      setDrain(true);
      const t = setTimeout(() => setDrain(false), 420);
      return () => clearTimeout(t);
    }, [ready]);
    const skel = (level) => /* @__PURE__ */ React.createElement("div", { className: "b-load", role: level < 1 ? "status" : void 0, "aria-busy": level < 1 || void 0 }, level < 1 && /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Loading ", kind === "tab" ? "the tab" : title), /* @__PURE__ */ React.createElement(Vessels, { shape, level, still: reduce }));
    const wrap = (node) => kind === "screen" ? /* @__PURE__ */ React.createElement(Page, { title }, node) : node;
    if (!ready) return /* @__PURE__ */ React.createElement("div", { className: "b-stage" }, wrap(skel(0.86)));
    return /* @__PURE__ */ React.createElement("div", { className: "b-stage" }, /* @__PURE__ */ React.createElement(motion.div, { className: "b-in", initial: reduce ? false : { opacity: 0, scale: 0.992 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.32, ease: EASE, delay: 0.1 } }, children), drain && /* @__PURE__ */ React.createElement(motion.div, { className: "b-over", "aria-hidden": "true", initial: { opacity: 1 }, animate: { opacity: 0 }, transition: { duration: 0.3, delay: 0.12, ease: "easeOut" } }, wrap(skel(1))));
  }
  function SignInButton({ phase, name }) {
    const reduce = useReducedMotion();
    const ref = useRef(null);
    const busy = phase === "busy", done = phase === "done", err = phase === "error";
    useEffect(() => {
      if (!done || reduce || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const el = document.createElement("div");
      el.className = "b-flood";
      el.setAttribute("aria-hidden", "true");
      el.style.setProperty("--x", r.left + r.width / 2 + "px");
      el.style.setProperty("--y", r.top + r.height / 2 + "px");
      document.body.appendChild(el);
      const t = setTimeout(() => el.remove(), 1500);
      return () => clearTimeout(t);
    }, [done]);
    const label = done ? `Signed in` : busy ? "Signing in\u2026" : "Sign in";
    return /* @__PURE__ */ React.createElement(
      motion.button,
      {
        ref,
        type: "submit",
        className: cx("btn btn-primary btn-lg btn-block b-signin", (busy || done) && "on"),
        "aria-disabled": busy || done || void 0,
        animate: err && !reduce ? { rotate: [0, -1.6, 1.4, -0.8, 0.5, 0] } : { rotate: 0 },
        transition: { duration: 0.42, ease: "easeOut" }
      },
      /* @__PURE__ */ React.createElement(motion.i, { className: "b-si-ink", "aria-hidden": "true", initial: false, animate: { x: done ? "0%" : busy ? "-12%" : "-101%" }, transition: reduce ? { duration: 0 } : busy ? { duration: 1.3, ease: [0.25, 0.6, 0.35, 1] } : { duration: done ? 0.18 : 0.36, ease: EASE } }, /* @__PURE__ */ React.createElement("svg", { className: "edge", viewBox: "0 0 10 40", preserveAspectRatio: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M0 0 H4 Q9 5 4 10 T4 20 T4 30 T4 40 H0 Z" }))),
      /* @__PURE__ */ React.createElement("span", { className: "b-si-row" }, done ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 18 }) : /* @__PURE__ */ React.createElement(Icon, { name: "log-in", size: 18 }), /* @__PURE__ */ React.createElement("span", null, label)),
      /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, busy ? "Signing in" : done ? `Signed in. Welcome, ${name}.` : "")
    );
  }
  function Num({ value, format }) {
    const reduce = useReducedMotion();
    const [shown, setShown] = useState(reduce ? value : 0);
    const from = useRef(reduce ? value : 0);
    useEffect(() => {
      if (reduce) {
        setShown(value);
        from.current = value;
        return;
      }
      const c = Motion.animate(from.current, value, { duration: 0.7, ease: EASE, onUpdate: (v) => {
        from.current = v;
        setShown(v);
      } });
      return () => c.stop();
    }, [value]);
    const f = format || ((v) => Math.round(v).toLocaleString("en-IN"));
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, f(Math.round(shown))), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, f(value)));
  }
  function useClip() {
    return useMemo(() => "bf" + Math.random().toString(36).slice(2, 8), []);
  }
  function Sparkline({ values, tone }) {
    const box = useRef(null);
    const w = W.useWidth(box, 220);
    const reduce = useReducedMotion();
    const id = useClip();
    const H = 36, max = Math.max(1, ...values), n = values.length;
    const X = (i) => n > 1 ? i / (n - 1) * w : w / 2, Y = (v) => H - 3 - v / max * (H - 8);
    const line = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const col = tone === "amber" ? "var(--amber)" : "var(--primary)";
    return /* @__PURE__ */ React.createElement("div", { ref: box, className: "b-spark-box" }, /* @__PURE__ */ React.createElement("svg", { className: "cs-ov-spark", viewBox: `0 0 ${w} ${H}`, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("clipPath", { id }, /* @__PURE__ */ React.createElement(motion.rect, { x: "0", width: w, initial: { y: reduce ? 0 : H, height: H }, animate: { y: 0 }, transition: { duration: reduce ? 0 : 0.8, ease: [0.25, 0.6, 0.35, 1] } }))), /* @__PURE__ */ React.createElement(motion.path, { clipPath: `url(#${id})`, fill: col, opacity: "0.16", initial: false, animate: { d: `${line} L${w} ${H} L0 ${H} Z` }, transition: { duration: reduce ? 0 : 0.42, ease: EASE } }), /* @__PURE__ */ React.createElement(motion.path, { fill: "none", stroke: col, strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round", initial: { opacity: reduce ? 1 : 0, d: line }, animate: { opacity: 1, d: line }, transition: { opacity: { duration: reduce ? 0 : 0.24, delay: reduce ? 0 : 0.65 }, d: { duration: reduce ? 0 : 0.42, ease: EASE } } })));
  }
  function RecoveredChart({ byDay, height }) {
    const box = useRef(null);
    const w = W.useWidth(box);
    const [hover, setHover] = useState(null);
    const reduce = useReducedMotion();
    const id = useClip();
    const g = W.chartGeometry(byDay, w, height);
    const today = byDay[byDay.length - 1];
    const prev = W.usePrevious(today ? today.recovered : 0);
    const [drop, setDrop] = useState(null);
    useEffect(() => {
      if (today && prev != null && today.recovered > prev && !reduce) {
        setDrop({ v: today.recovered - prev, at: Date.now() });
        const t = setTimeout(() => setDrop(null), 2600);
        return () => clearTimeout(t);
      }
    }, [today && today.recovered]);
    const tx = g.X(g.n - 1), ty = g.Y(today ? today.recovered : 0);
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ov-chart b-chart", ref: box, onMouseLeave: () => setHover(null) }, /* @__PURE__ */ React.createElement(W.ChartFrame, { byDay, H: height, w, g, hover, setHover, label: W.chartLabel(byDay) }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("clipPath", { id }, /* @__PURE__ */ React.createElement(motion.rect, { key: g.n, x: "0", width: w, height, initial: { y: reduce ? 0 : height - g.pb }, animate: { y: 0 }, transition: { duration: reduce ? 0 : 1, ease: [0.25, 0.6, 0.35, 1] } }))), /* @__PURE__ */ React.createElement(motion.path, { key: "a" + g.n, clipPath: `url(#${id})`, fill: "var(--primary)", opacity: "0.16", initial: false, animate: { d: g.area }, transition: { duration: reduce ? 0 : 0.42, ease: EASE } }), /* @__PURE__ */ React.createElement(motion.path, { key: "l" + g.n, fill: "none", stroke: "var(--primary)", strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round", initial: { opacity: reduce ? 1 : 0, d: g.line }, animate: { opacity: 1, d: g.line }, transition: { opacity: { duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.85 }, d: { duration: reduce ? 0 : 0.42, ease: EASE } } }), /* @__PURE__ */ React.createElement(motion.circle, { r: "4.5", fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: "2", initial: false, animate: { cx: tx, cy: ty }, transition: { duration: reduce ? 0 : 0.42, ease: EASE } }), drop && /* @__PURE__ */ React.createElement(motion.circle, { key: drop.at, r: "4", fill: "var(--primary)", cx: tx, initial: { cy: g.pt - 6, opacity: 1 }, animate: { cy: ty, opacity: [1, 1, 0] }, transition: { duration: 0.5, ease: [0.55, 0, 1, 0.45], times: [0, 0.9, 1] } }), drop && /* @__PURE__ */ React.createElement(motion.ellipse, { key: "s" + drop.at, cx: tx, cy: ty, fill: "none", stroke: "var(--primary)", strokeWidth: "1.5", initial: { rx: 3, ry: 1.5, opacity: 0 }, animate: { rx: [3, 16], ry: [1.5, 5], opacity: [0.8, 0] }, transition: { duration: 0.7, delay: 0.48, ease: "easeOut" } })), /* @__PURE__ */ React.createElement(AnimatePresence, null, drop && /* @__PURE__ */ React.createElement(motion.span, { key: drop.at, className: "b-gain", style: { left: `${tx / w * 100}%`, top: ty - 38, x: "-100%" }, initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.24, delay: 0.5, ease: EASE } }, "+", fmt.inr(drop.v))), /* @__PURE__ */ React.createElement(W.ChartTip, { byDay, hover, g, w }));
  }
  const STAGES = D.STAGES.map((x) => x.id);
  const AT = STAGES.map((id) => P.AGENTS.filter((a) => a.stage === id));
  function AgentsAtWork({ s, d, paused, titles, client, value, onPick }) {
    const app = useApp();
    const reduce = useReducedMotion();
    const phone = app.bp === "phone";
    const all = useMemo(() => s.batches.map((b) => Object.assign({}, b, { current: b.closedAt ? 9 : b.current })), [s.batches]);
    const moves = W.useMoves(all);
    const box = useRef(null);
    const cells = useRef([]);
    const [drops, setDrops] = useState([]);
    const dayStart = Date.parse(P.TODAY + "T00:00:00+05:30");
    const closedToday = all.filter((b) => b.closedAt && Date.parse(b.closedAt) >= dayStart).length;
    const recToday = d.byDay[d.byDay.length - 1] ? d.byDay[d.byDay.length - 1].recovered : 0;
    const counts = d.byStop.concat([closedToday]);
    const top = Math.max(6, ...d.byStop);
    useLayoutEffect(() => {
      if (!moves.length || reduce || !box.current) return;
      const at = box.current.getBoundingClientRect();
      const pt = (i) => {
        const el = cells.current[i];
        if (!el) return null;
        const r = el.querySelector(".liq").getBoundingClientRect();
        return { x: r.left + r.width / 2 - at.left, y: r.top - at.top };
      };
      const list = moves.slice(0, 4).map((m, k) => {
        const a = pt(Math.min(m.from, 9)), b = pt(Math.min(m.to, 9));
        return a && b ? { id: m.key + m.at, a, b, delay: k * 0.12, client: client(m.client) } : null;
      }).filter(Boolean);
      setDrops(list);
      const t = setTimeout(() => setDrops([]), 1400);
      return () => clearTimeout(t);
    }, [moves]);
    const run = s.runs[0];
    const ra = run && P.AGENTS.find((a) => a.id === run.agent);
    const rc = run && client(run.client);
    return /* @__PURE__ */ React.createElement("section", { className: "cs-ov-card b-work", "aria-labelledby": "b-work-t" }, /* @__PURE__ */ React.createElement("div", { className: "cs-ov-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "t", id: "b-work-t" }, "The flow"), /* @__PURE__ */ React.createElement("div", { className: "s" }, d.inFlight, " batch", d.inFlight === 1 ? "" : "es", " in flight \xB7 each stop fills with the batches waiting there; a drop falls to the next as an agent finishes")), /* @__PURE__ */ React.createElement("span", { className: cx("b-state", paused && "paused") }, paused ? "Paused" : "Live")), /* @__PURE__ */ React.createElement("div", { className: "b-flow", ref: box, role: "group", "aria-label": "Batches in flight by stop" }, counts.map((n, i) => {
      const end = i === 9, human = i === 5, ag = AT[i] || [];
      const name = end ? fmt.inr(recToday) : human ? "You" : ag.length > 1 ? `${ag[0].name} +${ag.length - 1}` : ag[0] ? ag[0].name : "";
      const lvl = end ? Math.min(1, n / Math.max(4, n)) : n / top;
      const inner = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n tnum", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Num, { value: n })), /* @__PURE__ */ React.createElement("span", { className: "vessel", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(motion.span, { className: "liq", initial: { scaleY: reduce ? lvl : 0 }, animate: { scaleY: lvl }, transition: reduce ? { duration: 0 } : SLOSH })), /* @__PURE__ */ React.createElement("span", { className: "lbl", "aria-hidden": "true" }, phone ? /* @__PURE__ */ React.createElement(Icon, { name: end ? "indian-rupee" : human ? "hand" : (ag[0] || {}).icon || "bot", size: 15 }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, end ? "Closed today" : titles[i]), /* @__PURE__ */ React.createElement("span", null, name))));
      return end ? /* @__PURE__ */ React.createElement("div", { key: "end", ref: (el) => cells.current[i] = el, className: "b-cell end", role: "img", "aria-label": `Closed today: ${n} batch${n === 1 ? "" : "es"}, ${fmt.inr(recToday)} recovered` }, inner) : /* @__PURE__ */ React.createElement(
        "button",
        {
          key: titles[i],
          ref: (el) => cells.current[i] = el,
          type: "button",
          className: cx("b-cell", human && "human", !n && "zero"),
          "aria-pressed": value === i,
          onClick: () => onPick(value === i ? null : i),
          "aria-label": `${titles[i]}, ${human ? "waiting for a person" : name}: ${n} batch${n === 1 ? "" : "es"}. ${value === i ? "Shown in the table" : "Show them in the table"}`
        },
        inner
      );
    }), /* @__PURE__ */ React.createElement("div", { className: "b-drops", "aria-hidden": "true" }, drops.map((x) => /* @__PURE__ */ React.createElement(
      motion.span,
      {
        key: x.id,
        className: "b-drop",
        style: { background: x.client && x.client.mark ? x.client.mark.from : "var(--primary)" },
        initial: { x: x.a.x - 5, y: x.a.y - 5, scale: 0.4, opacity: 0 },
        animate: { x: [x.a.x - 5, (x.a.x + x.b.x) / 2 - 5, x.b.x - 5], y: [x.a.y - 5, Math.min(x.a.y, x.b.y) - 46, x.b.y - 5], scale: [0.6, 1, 0.8], opacity: [1, 1, 0] },
        transition: { duration: 0.8, delay: x.delay, ease: [0.45, 0, 0.55, 1], times: [0, 0.45, 1] }
      }
    )))), /* @__PURE__ */ React.createElement("p", { className: "b-last", "aria-live": "polite" }, run && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote" }, run.at), " ", /* @__PURE__ */ React.createElement("b", null, ra ? ra.name : run.agent), " \xB7 ", rc ? rc.name : run.client, " \xB7 ", run.text)));
  }
  window.SC49 = { option: "b", Stage, SignInButton, ERROR_MS: 420, SIGNED_IN_MS: 700, Num, Sparkline, RecoveredChart, AgentsAtWork, hideStops: true };
})();

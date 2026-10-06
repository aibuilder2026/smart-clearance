(function() {
  const { useState, useEffect, useRef, useMemo } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, W = window.SC49_SHARED, P = window.SC3_PLATFORM, D = window.SC3_DATA, fmt = window.SC3_MONEY.fmt;
  const { cx, Icon, Page, Spinner, WorkspaceMark, useApp } = K;
  const EASE = W.EASE;
  function Progress({ done }) {
    const reduce = useReducedMotion();
    const [gone, setGone] = useState(false);
    useEffect(() => {
      if (!done) return;
      const t = setTimeout(() => setGone(true), reduce ? 0 : 400);
      return () => clearTimeout(t);
    }, [done]);
    if (gone) return null;
    return /* @__PURE__ */ React.createElement(motion.i, { className: "c-prog", "aria-hidden": "true", initial: { scaleX: reduce ? 0.8 : 0 }, animate: { scaleX: done ? 1 : 0.8, opacity: done ? 0 : 1 }, transition: done ? { scaleX: { duration: reduce ? 0 : 0.16 }, opacity: { duration: reduce ? 0 : 0.2, delay: reduce ? 0 : 0.18 } } : { duration: reduce ? 0 : W.FILL / 1e3 * 1.2, ease: [0.3, 0.7, 0.4, 1] } });
  }
  function Skeleton({ shape }) {
    const app = useApp();
    const phone = app.bp === "phone";
    return /* @__PURE__ */ React.createElement("div", { className: "c-skel" }, W.blocks(shape, phone).map((r) => /* @__PURE__ */ React.createElement("div", { key: r.row, className: cx("c-row", "k-" + r.kind), style: { gridTemplateColumns: r.widths ? r.widths.map((x) => x + "fr").join(" ") : `repeat(${r.cols}, minmax(0, 1fr))`, width: r.width ? r.width * 100 + "%" : void 0 } }, r.items.map((i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "skeleton c-blk", style: { height: r.h } })))));
  }
  function Stage({ k, shape, kind, title, children }) {
    const ready = W.useLoad(k, kind);
    const reduce = useReducedMotion();
    const skel = /* @__PURE__ */ React.createElement("div", { className: "c-load", role: "status", "aria-busy": "true" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Loading ", kind === "tab" ? "the tab" : title), /* @__PURE__ */ React.createElement(Skeleton, { shape }));
    return /* @__PURE__ */ React.createElement("div", { className: "c-stage" }, /* @__PURE__ */ React.createElement(Progress, { key: k, done: ready }), ready ? /* @__PURE__ */ React.createElement(motion.div, { initial: reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.16 } }, children) : kind === "screen" ? /* @__PURE__ */ React.createElement(Page, { title }, skel) : skel);
  }
  function SignInButton({ phase, name }) {
    const busy = phase === "busy", done = phase === "done";
    return /* @__PURE__ */ React.createElement("button", { type: "submit", className: cx("btn btn-primary btn-lg btn-block c-signin", (busy || done) && "on"), "aria-disabled": busy || done || void 0 }, /* @__PURE__ */ React.createElement("span", { className: "c-si-ic", "aria-hidden": "true" }, busy ? /* @__PURE__ */ React.createElement(Spinner, { size: 18 }) : /* @__PURE__ */ React.createElement(Icon, { name: done ? "check" : "log-in", size: 18 })), /* @__PURE__ */ React.createElement("span", null, done ? "Signed in" : busy ? "Signing in\u2026" : "Sign in"), /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, busy ? "Signing in" : done ? `Signed in. Welcome, ${name}.` : ""));
  }
  function Num({ value, format }) {
    const prev = W.usePrevious(value);
    const [mark, setMark] = useState(null);
    useEffect(() => {
      if (prev != null && prev !== value) {
        setMark({ up: value > prev, at: Date.now() });
        const t = setTimeout(() => setMark(null), 1800);
        return () => clearTimeout(t);
      }
    }, [value]);
    const f = format || ((v) => Math.round(v).toLocaleString("en-IN"));
    return /* @__PURE__ */ React.createElement("span", { className: cx("c-num", mark && "marked"), key: mark ? mark.at : "n" }, f(value), mark && /* @__PURE__ */ React.createElement(Icon, { name: mark.up ? "trending-up" : "trending-down", size: 14, className: "c-arrow" }));
  }
  function Sparkline({ values, tone }) {
    const box = useRef(null);
    const w = W.useWidth(box, 220);
    const reduce = useReducedMotion();
    const H = 36, max = Math.max(1, ...values), n = values.length;
    const X = (i) => n > 1 ? i / (n - 1) * w : w / 2, Y = (v) => H - 3 - v / max * (H - 8);
    const line = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const col = tone === "amber" ? "var(--amber)" : "var(--primary)";
    const tr = { duration: reduce ? 0 : 0.42, ease: EASE };
    return /* @__PURE__ */ React.createElement("div", { ref: box, className: "c-spark-box" }, /* @__PURE__ */ React.createElement("svg", { className: "cs-ov-spark", viewBox: `0 0 ${w} ${H}`, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(motion.path, { key: "a" + n, fill: col, opacity: "0.1", initial: false, animate: { d: `${line} L${w} ${H} L0 ${H} Z` }, transition: tr }), /* @__PURE__ */ React.createElement(motion.path, { key: "l" + n, fill: "none", stroke: col, strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round", initial: false, animate: { d: line }, transition: tr })));
  }
  function RecoveredChart({ byDay, height }) {
    const box = useRef(null);
    const w = W.useWidth(box);
    const [hover, setHover] = useState(null);
    const reduce = useReducedMotion();
    const g = W.chartGeometry(byDay, w, height);
    const today = byDay[byDay.length - 1];
    const prev = W.usePrevious(today ? today.recovered : 0);
    const [mark, setMark] = useState(null);
    useEffect(() => {
      if (today && prev != null && today.recovered !== prev) {
        setMark({ v: today.recovered - prev, at: Date.now() });
        const t = setTimeout(() => setMark(null), 2400);
        return () => clearTimeout(t);
      }
    }, [today && today.recovered]);
    const tx = g.X(g.n - 1), ty = g.Y(today ? today.recovered : 0);
    const tr = { duration: reduce ? 0 : 0.42, ease: EASE };
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ov-chart c-chart", ref: box, onMouseLeave: () => setHover(null) }, /* @__PURE__ */ React.createElement(W.ChartFrame, { byDay, H: height, w, g, hover, setHover, label: W.chartLabel(byDay) }, /* @__PURE__ */ React.createElement(motion.path, { key: "a" + g.n, fill: "var(--primary)", opacity: "0.1", initial: false, animate: { d: g.area }, transition: tr }), /* @__PURE__ */ React.createElement(motion.path, { key: "l" + g.n, fill: "none", stroke: "var(--primary)", strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round", initial: false, animate: { d: g.line }, transition: tr }), mark && /* @__PURE__ */ React.createElement("circle", { cx: tx, cy: ty, r: "10", fill: "var(--primary-soft)", stroke: "var(--primary)", strokeWidth: "1.5", className: "c-ring" }), /* @__PURE__ */ React.createElement(motion.circle, { r: "4.5", fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: "2", initial: false, animate: { cx: tx, cy: ty }, transition: tr })), mark && mark.v > 0 && /* @__PURE__ */ React.createElement("span", { className: "c-gain", style: { left: `calc(${tx / w * 100}% - 16px)`, top: ty - 40 } }, "+", fmt.inr(mark.v), " today"), /* @__PURE__ */ React.createElement(W.ChartTip, { byDay, hover, g, w }));
  }
  function StopBars({ byStop, value, onPick }) {
    const titles = D.STAGES.map((x) => x.title);
    const max = Math.max(1, ...byStop);
    const prev = W.usePrevious(byStop);
    const [lit, setLit] = useState({});
    useEffect(() => {
      if (!prev) return;
      const l = {};
      byStop.forEach((n, i) => {
        if (prev[i] !== n) l[i] = true;
      });
      if (Object.keys(l).length) {
        setLit(l);
        const t = setTimeout(() => setLit({}), 1800);
        return () => clearTimeout(t);
      }
    }, [byStop.join(",")]);
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ov-stops c-stops", role: "group", "aria-label": "Batches in flight by stop" }, titles.map((t, i) => /* @__PURE__ */ React.createElement("button", { key: t, type: "button", className: cx("cs-ov-stop", i === 5 && "human", !byStop[i] && "zero", lit[i] && "c-lit"), "aria-pressed": value === i, "aria-label": `${t}: ${byStop[i]} batch${byStop[i] === 1 ? "" : "es"}. ${value === i ? "Shown in the table" : "Show them in the table"}`, onClick: () => onPick(value === i ? null : i) }, /* @__PURE__ */ React.createElement("span", null, t), /* @__PURE__ */ React.createElement("span", { className: "bar", style: { width: byStop[i] / max * 100 + "%" } }), /* @__PURE__ */ React.createElement("span", { className: "n" }, byStop[i]))));
  }
  function Seg({ from, to }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement("span", { className: "cs-ov-seg c-seg", "aria-hidden": "true" }, D.STAGES.map((_, i) => /* @__PURE__ */ React.createElement("i", { key: i, className: cx(i < from && "done", i === to && to < 9 && "now", i === to && i === 5 && "human") }, i >= from && i < to && /* @__PURE__ */ React.createElement(motion.b, { initial: { scaleX: reduce ? 1 : 0 }, animate: { scaleX: 1 }, transition: { duration: reduce ? 0 : 0.42, ease: EASE, delay: reduce ? 0 : 0.1 + (i - from) * 0.08 } }))));
  }
  function AgentsAtWork({ s, paused, titles, client, go }) {
    const reduce = useReducedMotion();
    const all = useMemo(() => s.batches.map((b) => Object.assign({}, b, { current: b.closedAt ? 9 : b.current })), [s.batches]);
    const moves = W.useMoves(all);
    const [moved, setMoved] = useState([]);
    useEffect(() => {
      if (moves.length) setMoved((m) => moves.concat(m).slice(0, 5));
    }, [moves]);
    const runs = s.runs.slice(0, 6);
    return /* @__PURE__ */ React.createElement("section", { className: "cs-ov-card c-work", "aria-labelledby": "c-work-t" }, /* @__PURE__ */ React.createElement("div", { className: "cs-ov-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "t", id: "c-work-t" }, "Live activity"), /* @__PURE__ */ React.createElement("div", { className: "s" }, "The agents' runs as they land, and the batches they moved")), /* @__PURE__ */ React.createElement("span", { className: cx("c-state", paused && "paused") }, paused ? "Paused" : "Live")), /* @__PURE__ */ React.createElement("div", { className: "c-cols" }, /* @__PURE__ */ React.createElement("div", { className: "c-feed" }, /* @__PURE__ */ React.createElement("div", { className: "c-sub" }, "Agent runs"), /* @__PURE__ */ React.createElement("ul", { className: "c-list", "aria-live": "polite" }, runs.map((r) => {
      const a = P.AGENTS.find((x) => x.id === r.agent), c = client(r.client);
      const fresh = r.fresh && Date.now() - r.fresh < 4e3;
      return /* @__PURE__ */ React.createElement(motion.li, { key: (r.fresh || "") + r.at + r.text, layout: reduce ? false : "position", initial: fresh && !reduce ? { opacity: 0, y: -8 } : false, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: EASE }, className: cx(fresh && "fresh") }, /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote c-at" }, r.at), /* @__PURE__ */ React.createElement("span", { className: "c-ic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: a ? a.icon : "bot", size: 15 })), /* @__PURE__ */ React.createElement("span", { className: "c-txt" }, /* @__PURE__ */ React.createElement("span", { className: "l1" }, /* @__PURE__ */ React.createElement("b", null, a ? a.name : r.agent), " \xB7 ", c ? c.name : r.client), /* @__PURE__ */ React.createElement("span", null, r.text)));
    }))), /* @__PURE__ */ React.createElement("div", { className: "c-feed" }, /* @__PURE__ */ React.createElement("div", { className: "c-sub" }, "Batches that moved"), moved.length ? /* @__PURE__ */ React.createElement("ul", { className: "c-list" }, moved.map((m) => {
      const c = client(m.client);
      return /* @__PURE__ */ React.createElement(motion.li, { key: m.key + m.at, layout: reduce ? false : "position", initial: reduce ? false : { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: EASE }, className: cx(Date.now() - m.at < 4e3 && "fresh") }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 24 }), /* @__PURE__ */ React.createElement("span", { className: "c-txt" }, /* @__PURE__ */ React.createElement("span", { className: "l1" }, /* @__PURE__ */ React.createElement("b", { className: "mono" }, m.ref), " \xB7 ", c ? c.name : m.client), /* @__PURE__ */ React.createElement("span", null, m.to >= 9 ? "Closed" : `${titles[Math.min(m.from, 8)]} \u2192 ${titles[m.to]}`)), /* @__PURE__ */ React.createElement(Seg, { from: m.from, to: m.to }));
    })) : /* @__PURE__ */ React.createElement("p", { className: "c-empty" }, paused ? "Updates are paused." : "Batches show here as the agents move them on."))));
  }
  window.SC49 = { option: "c", Stage, SignInButton, ERROR_MS: 0, SIGNED_IN_MS: 320, Num, Sparkline, RecoveredChart, StopBars, AgentsAtWork };
})();

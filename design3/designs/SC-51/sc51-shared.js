(function() {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const Q = new URLSearchParams(location.search);
  const ms = (k, d) => Math.max(0, Number(Q.get(k)) || d);
  const EASE = [0.22, 1, 0.36, 1];
  const READS = {
    boot: [
      { id: "session", label: "Connecting", said: "Who is signed in" },
      { id: "config", label: "The platform", said: "How the platform is set up" },
      { id: "catalog", label: "The agents", said: "The agents and the plans" }
    ],
    enter: [
      { id: "clients", label: "Your clients", said: "Every client's workspace" },
      { id: "dashboard", label: "Today", said: "Recovered, in flight, waiting for a yes" },
      { id: "batches", label: "The batches", said: "Every batch at its stop" },
      { id: "runs", label: "The agents", said: "The agents' runs today" }
    ],
    leave: [
      { id: "session-end", label: "Closing your session", said: "The session ends on the platform" },
      { id: "firebase", label: "Signed out", said: "Signed out of Firebase" }
    ]
  };
  const TOTAL = { boot: ms("boot", 2200), enter: ms("enter", 1700), leave: ms("leave", 1100) };
  function useReads(kind, key) {
    const fresh = () => ({ k: kind + "/" + key, steps: (READS[kind] || []).map((s) => ({ ...s, at: null })) });
    const [state, setState] = useState(fresh);
    const steps = state.k === kind + "/" + key ? state.steps : fresh().steps;
    const setSteps = (f) => setState((st) => ({ k: kind + "/" + key, steps: f(st.k === kind + "/" + key ? st.steps : fresh().steps) }));
    useEffect(() => {
      const list = READS[kind] || [], total = TOTAL[kind] || 1e3;
      setState(fresh());
      const timers = list.map((s, i) => {
        const frac = list.length === 1 ? 1 : 0.28 + 0.72 * (i / (list.length - 1)), jitter = i * 7919 % 13 / 13 * 0.08 - 0.04;
        return setTimeout(() => setSteps((prev) => prev.map((p) => p.id === s.id ? { ...p, at: performance.now() } : p)), Math.round(total * Math.min(1, Math.max(0.1, frac + jitter))));
      });
      return () => timers.forEach(clearTimeout);
    }, [kind, key]);
    const done = steps.length > 0 && steps.every((s) => s.at != null);
    const landed = steps.filter((s) => s.at != null).length;
    return { steps, done, landed, current: steps.find((s) => s.at == null) || null };
  }
  function useProgress(reads, { minRun = 900, reduce = false } = {}) {
    const [shown, setShown] = useState(0);
    const S = useRef({ shown: 0, last: performance.now(), t0: performance.now(), raf: 0 });
    const target = reads.steps.length ? reads.landed / reads.steps.length : 0;
    useEffect(() => {
      S.current.last = performance.now();
    }, [reads.landed]);
    useEffect(() => {
      if (reduce) {
        setShown(reads.done ? 1 : target);
        return;
      }
      let alive = true, prev = performance.now();
      const loop = (t) => {
        if (!alive) return;
        const dt = Math.min(64, t - prev);
        prev = t;
        const st = S.current, pend = 1 - target;
        let aim = reads.done ? 1 : Math.min(0.96, target + pend * 0.4 * (1 - Math.exp(-(t - st.last) / 1600)));
        aim = Math.min(aim, (t - st.t0) / minRun);
        let s = st.shown + (aim - st.shown) * (1 - Math.exp(-dt / (reads.done ? 80 : 190)));
        if (aim >= 1 && aim - s < 0.01) s = 1;
        if (s > st.shown) {
          st.shown = s;
          setShown(s);
        }
        if (s < 1) st.raf = requestAnimationFrame(loop);
      };
      S.current.raf = requestAnimationFrame(loop);
      return () => {
        alive = false;
        cancelAnimationFrame(S.current.raf);
      };
    }, [target, reads.done, reduce]);
    return shown;
  }
  const S_PATH = "M43.5 19H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14H20.5";
  function LoadMark({ size = 112, drawn = 0, landed = false, className, style }) {
    const gid = useMemo(() => "m51" + Math.random().toString(36).slice(2, 7), []);
    const show = Math.min(1, Math.max(0, drawn));
    return /* @__PURE__ */ React.createElement("svg", { className: "mark sc51-mark " + (className || ""), width: size, height: size, viewBox: "0 0 64 64", "aria-hidden": "true", focusable: "false", style }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: gid + "g", x1: "8", y1: "4", x2: "58", y2: "62", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#2fbf7f" }), /* @__PURE__ */ React.createElement("stop", { offset: "0.55", stopColor: "#178258" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#0d5a3e" })), /* @__PURE__ */ React.createElement("linearGradient", { id: gid + "h", x1: "32", y1: "2", x2: "32", y2: "34", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#fff", stopOpacity: "0.28" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#fff", stopOpacity: "0" }))), /* @__PURE__ */ React.createElement("g", { className: "sq" }, /* @__PURE__ */ React.createElement("path", { d: "M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z", fill: `url(#${gid}g)` }), /* @__PURE__ */ React.createElement("path", { d: "M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z", fill: `url(#${gid}h)` })), /* @__PURE__ */ React.createElement("path", { className: "route", d: S_PATH, pathLength: "1", fill: "none", stroke: "#fff", strokeWidth: "6", strokeLinecap: "round", strokeLinejoin: "round", style: { strokeDasharray: 1, strokeDashoffset: 1 - show, opacity: show > 4e-3 ? 1 : 0 } }), /* @__PURE__ */ React.createElement("circle", { cx: "43.5", cy: "19", r: "3.4", fill: "#0d5a3e", stroke: "#fff", strokeWidth: "2.6" }), landed && /* @__PURE__ */ React.createElement("circle", { className: "ping", cx: "20.5", cy: "47", r: "5", fill: "none", stroke: "#f7c04a", strokeWidth: "2" }), /* @__PURE__ */ React.createElement("circle", { className: "pin" + (landed ? " on" : ""), cx: "20.5", cy: "47", r: "5.2", fill: "#f7c04a", stroke: "#fff", strokeWidth: "2.2" }));
  }
  const SQ = [[32, 2], [9.5, 2], [2, 9.5], [2, 32], [2, 54.5], [9.5, 62], [32, 62], [54.5, 62], [62, 54.5], [62, 32], [62, 9.5], [54.5, 2], [32, 2]];
  function squircle(cx, cy, k) {
    const p = SQ.map((q) => (cx + (q[0] - 32) * k).toFixed(1) + " " + (cy + (q[1] - 32) * k).toFixed(1));
    return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3] + "C" + p[4] + " " + p[5] + " " + p[6] + "C" + p[7] + " " + p[8] + " " + p[9] + "C" + p[10] + " " + p[11] + " " + p[12] + "Z";
  }
  function coverK(cx, cy, w, h) {
    return Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy)) / 30 * 1.04;
  }
  const windowClip = (cx, cy, k0, K, w, h, v) => `path(evenodd, "M0 0H${w}V${h}H0Z${squircle(cx, cy, k0 * Math.pow(K / k0, v))}")`;
  const greet = (name) => {
    const h = (/* @__PURE__ */ new Date()).getHours();
    const g = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    return name ? `${g}, ${name}` : g;
  };
  const today = () => (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  window.SC51_SHARED = { READS, TOTAL, EASE, Q, useReads, useProgress, LoadMark, S_PATH, squircle, coverK, windowClip, greet, today };
})();

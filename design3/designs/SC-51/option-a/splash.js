(function() {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo } = React;
  const { motion, AnimatePresence, useReducedMotion, animate } = Motion;
  const SH = window.SC51_SHARED, K = window.SC3;
  const { Wordmark, cx, useApp } = K;
  const EASE = SH.EASE;
  const MIN = { boot: 1250, enter: 900, leave: 900 }, MAX = 8e3;
  const WORDS = {
    boot: { title: "Opening the console", sub: "Smart-Clearance staff", late: "Waking the platform up\u2026" },
    enter: { title: (who) => SH.greet(who), sub: (who) => `${SH.today()} \xB7 opening your console` },
    leave: { title: "Signing you out", sub: (who) => `Until next time, ${who}.`, done: "Signed out" }
  };
  const secs = (t) => (t / 1e3).toFixed(1) + " s";
  function ReadTracker({ reads, progress, kind }) {
    const n = reads.steps.length, cur = reads.steps.findIndex((s) => s.at == null);
    const t0 = useRef(performance.now());
    useEffect(() => {
      t0.current = performance.now();
    }, [kind]);
    return /* @__PURE__ */ React.createElement("div", { className: cx("tracker sc51a-tracker", kind === "leave" && "leave"), style: { "--stops": n }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "rail" }, /* @__PURE__ */ React.createElement("i", { style: { transform: `scaleX(${progress})`, transition: "none" } })), reads.steps.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: s.id, className: cx("stop", s.at != null && "done", i === cur && "now") }, /* @__PURE__ */ React.createElement("span", { className: "dot" }, s.at != null && /* @__PURE__ */ React.createElement("svg", { width: "11", height: "11", viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M5 12.5l4.5 4.5L19 7.5", fill: "none", stroke: "currentColor", strokeWidth: "3.4", strokeLinecap: "round", strokeLinejoin: "round" }))), /* @__PURE__ */ React.createElement("span", { className: "st-label" }, s.label), /* @__PURE__ */ React.createElement("span", { className: "st-time" }, s.at != null ? secs(s.at - t0.current) : i === cur ? "\u2026" : ""))));
  }
  function Cover({ kind, who, reads, from, findAnchor, onOpening, onOpen }) {
    const app = useApp();
    const reduce = useReducedMotion();
    const phone = app.bp === "phone";
    const progress = SH.useProgress(reads, { minRun: 900, reduce });
    const [stage, setStage] = useState("in");
    const root = useRef(null), mk = useRef(null), cover = useRef(null), born = useRef(performance.now());
    const w = WORDS[kind], title = typeof w.title === "function" ? w.title(who) : w.title, sub = typeof w.sub === "function" ? w.sub(who) : w.sub;
    const [late, setLate] = useState(false);
    useEffect(() => {
      if (kind !== "boot") return;
      const t = setTimeout(() => setLate(true), 2600);
      return () => clearTimeout(t);
    }, [kind]);
    useLayoutEffect(() => {
      if (!from || reduce || !mk.current) return;
      const r = mk.current.getBoundingClientRect(), dx = from.left + from.width / 2 - (r.left + r.width / 2), dy = from.top + from.height / 2 - (r.top + r.height / 2), sc = from.width / r.width;
      animate(mk.current, { x: [dx, 0], y: [dy, 0], scale: [sc, 1] }, { type: "spring", stiffness: 260, damping: 28, mass: 1 });
    }, []);
    const ready = reads.done && progress >= 1 || performance.now() - born.current > MAX;
    useEffect(() => {
      if (!ready || stage !== "in") return;
      const wait = Math.max(0, MIN[kind] - (performance.now() - born.current));
      const t = setTimeout(() => setStage("fly"), reduce ? Math.max(wait, 600) : wait + 260);
      return () => clearTimeout(t);
    }, [ready, stage]);
    useEffect(() => {
      if (stage !== "fly") return;
      const el = root.current, c = cover.current, m = mk.current;
      if (!el) return;
      if (reduce) {
        onOpen();
        return;
      }
      el.style.pointerEvents = "none";
      const to = findAnchor && findAnchor();
      setTimeout(onOpening, to ? 380 : 0);
      const r0 = m.getBoundingClientRect();
      const W = el.clientWidth, Hh = el.clientHeight;
      const cxTo = to ? to.left + to.width / 2 : r0.left + r0.width / 2, cyTo = to ? to.top + to.height / 2 : r0.top + r0.height / 2, kTo = (to ? to.width : r0.width) / 64;
      const fly = to ? animate(m, { x: cxTo - (r0.left + r0.width / 2), y: cyTo - (r0.top + r0.height / 2), scale: to.width / r0.width }, { type: "spring", stiffness: 260, damping: 30, mass: 1 }) : null;
      animate(el.querySelectorAll(".sc51a-words, .sc51a-tracker"), { opacity: 0, y: 8 }, { duration: 0.24, ease: [0.55, 0, 1, 0.45] });
      const K2 = SH.coverK(cxTo, cyTo, W, Hh);
      setTimeout(() => {
        animate(m.querySelector(".sq"), { opacity: 0 }, { duration: 0.24, ease: "linear" });
        animate(0, 1, {
          duration: 0.74,
          ease: [0.7, 0, 0.2, 1],
          onUpdate: (v) => {
            c.style.clipPath = SH.windowClip(cxTo, cyTo, kTo, K2, W, Hh, v);
            m.style.opacity = String(1 - Math.min(1, Math.max(0, (v - 0.18) / 0.44)));
          },
          onComplete: () => {
            setStage("open");
            onOpen();
          }
        });
      }, to ? 420 : 60);
    }, [stage]);
    const landed = reads.done && progress >= 1;
    return /* @__PURE__ */ React.createElement("div", { ref: root, className: cx("sc51a", kind, phone && "phone", stage), "data-stage": stage }, /* @__PURE__ */ React.createElement("div", { ref: cover, className: "sc51a-cover" }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" })), /* @__PURE__ */ React.createElement("div", { className: "sc51a-lock" }, /* @__PURE__ */ React.createElement("div", { ref: mk, className: "sc51a-mk" }, /* @__PURE__ */ React.createElement(SH.LoadMark, { size: phone ? 84 : 112, drawn: progress, landed })), /* @__PURE__ */ React.createElement("div", { className: "sc51a-words" }, /* @__PURE__ */ React.createElement("span", { className: "sc51a-brand" }, /* @__PURE__ */ React.createElement(Wordmark, { size: phone ? 20 : 24 }), /* @__PURE__ */ React.createElement("span", { className: "sc51a-console" }, "Console")), /* @__PURE__ */ React.createElement("h1", { className: "sc51a-title" }, kind === "leave" && landed ? WORDS.leave.done : title), /* @__PURE__ */ React.createElement("p", { className: "sc51a-sub" }, kind === "boot" && late && !reads.done ? w.late : sub)), /* @__PURE__ */ React.createElement(ReadTracker, { reads, progress, kind })), /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, kind === "leave" ? landed ? "Signed out." : "Signing you out." : kind === "enter" ? `Signed in. Opening the console for ${who}.` : "Opening the console."));
  }
  function Stage({ phase, me, reads, signin, console: cs, onDone }) {
    const reduce = useReducedMotion();
    const covering = phase === "boot" || phase === "enter" || phase === "leave";
    const [opened, setOpened] = useState(false);
    const [opening, setOpening] = useState(false);
    const [coverIn, setCoverIn] = useState(false);
    const prev = useRef(phase);
    const fromRef = useRef(null);
    if (prev.current !== phase) {
      if (phase === "enter") {
        const m = document.querySelector(".si-ws .mark");
        fromRef.current = m ? m.getBoundingClientRect() : null;
      }
      prev.current = phase;
    }
    useEffect(() => {
      setOpened(false);
      setOpening(false);
      setCoverIn(phase === "boot" || reduce);
    }, [phase]);
    const behind = phase === "signin" ? signin : phase === "console" ? cs : phase === "boot" ? me ? cs : signin : phase === "enter" ? coverIn ? cs : signin : reads.done ? signin : cs;
    const findAnchor = () => {
      const q = phase === "leave" || phase === "boot" && !me ? ".si-ws .mark" : ".sidebar .mark, .rail-compact .mark";
      const m = document.querySelector(q);
      if (!m) return null;
      const r = m.getBoundingClientRect();
      return r.width ? r : null;
    };
    const who = me ? me.name.split(" ")[0] : "";
    return /* @__PURE__ */ React.createElement("div", { className: cx("sc51a-stage", covering && !opened && !opening && "covered", phase === "leave" && !reads.done && "receding"), "aria-busy": covering || void 0 }, /* @__PURE__ */ React.createElement("div", { className: "sc51a-behind", inert: covering && !opened ? "" : void 0 }, behind), /* @__PURE__ */ React.createElement(AnimatePresence, null, covering && /* @__PURE__ */ React.createElement(motion.div, { key: phase + (reads.steps[0] ? reads.steps[0].id : ""), className: "sc51a-layer", initial: reduce || phase === "boot" ? false : { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: reduce ? 0 : 0.2 } }, transition: { duration: 0.32, ease: "linear" }, onAnimationComplete: (def) => {
      if (def && def.opacity === 1) setCoverIn(true);
    } }, /* @__PURE__ */ React.createElement(Cover, { kind: phase, who, reads, from: phase === "enter" ? fromRef.current : null, findAnchor, onOpening: () => setOpening(true), onOpen: () => {
      setOpened(true);
      onDone();
    } }))));
  }
  window.SC51 = { Stage };
})();

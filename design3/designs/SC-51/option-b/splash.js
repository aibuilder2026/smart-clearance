(function() {
  const { useState, useEffect, useLayoutEffect, useRef } = React;
  const { motion, AnimatePresence, useReducedMotion, animate } = Motion;
  const SH = window.SC51_SHARED, K = window.SC3;
  const { cx, useApp } = K;
  const MIN = { boot: 1e3, enter: 900, leave: 800 }, MAX = 8e3;
  const SHAPE = [
    { kind: "bar", h: 28, cols: 1, w: 0.38, read: "clients" },
    { kind: "tile", h: 132, cols: 4, read: "dashboard", heads: ["Recovered, 30 days", "Batches in flight", "Waiting for a yes", "Agent runs today"] },
    { kind: "card", h: 300, cols: 1, read: "batches", heads: ["Agents at work"] },
    { kind: "card", h: 300, cols: 1, read: "runs", heads: ["Recovered, by day"] },
    { kind: "bar", h: 40, cols: 1, w: 0.3, read: "runs" },
    { kind: "row", h: 58, cols: 1, read: "runs" },
    { kind: "row", h: 58, cols: 1, read: "runs" },
    { kind: "row", h: 58, cols: 1, read: "runs" }
  ];
  const LEAVE_HEADS = { "session-end": "Closing your session", firebase: "Signed out" };
  function Bones({ kind }) {
    if (kind === "tile") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b w40" }), /* @__PURE__ */ React.createElement("i", { className: "b big w60" }), /* @__PURE__ */ React.createElement("i", { className: "b spark" }));
    if (kind === "card") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b w30" }), /* @__PURE__ */ React.createElement("i", { className: "b w20 thin" }), /* @__PURE__ */ React.createElement("i", { className: "b area" }));
    if (kind === "row") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b dot" }), /* @__PURE__ */ React.createElement("span", { className: "col" }, /* @__PURE__ */ React.createElement("i", { className: "b w50" }), /* @__PURE__ */ React.createElement("i", { className: "b w30 thin" })), /* @__PURE__ */ React.createElement("i", { className: "b w10" }));
    return /* @__PURE__ */ React.createElement("i", { className: "b fill" });
  }
  function Route({ done }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement("div", { className: "cs-route sc51b-route", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(motion.i, { className: "line", initial: { width: reduce ? "88%" : "0%" }, animate: { width: done ? "100%" : "88%" }, transition: done ? { duration: reduce ? 0 : 0.16, ease: SH.EASE } : { duration: reduce ? 0 : 1.2, ease: [0.3, 0.7, 0.4, 1] } }, /* @__PURE__ */ React.createElement(motion.b, { className: "pin", initial: false, animate: done ? { scale: [0, 1.35, 1] } : { scale: 0.6 }, transition: { duration: reduce ? 0 : 0.42, ease: SH.EASE, delay: done && !reduce ? 0.12 : 0 } })));
  }
  function Veil({ reads, leaving, box, who, lifting }) {
    const app = useApp();
    const phone = app.bp === "phone";
    let n = 0;
    const landed = (id) => reads.steps.some((s) => s.id === id && s.at != null);
    const headsFor = (row, i) => row.heads && (leaving ? false : landed(row.read)) ? row.heads[i % row.heads.length] : null;
    if (!box) return null;
    return /* @__PURE__ */ React.createElement("div", { className: cx("sc51b-veil", lifting && "lift", leaving && "leaving"), style: { left: box.left, top: box.top, width: box.width, height: box.height }, role: "status", "aria-busy": "true" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, leaving ? "Signing you out." : `Signed in. Opening the console for ${who}.`), /* @__PURE__ */ React.createElement(Route, { done: reads.done }), /* @__PURE__ */ React.createElement("div", { className: "sc51b-page" }, /* @__PURE__ */ React.createElement("div", { className: "sc51b-title" }, leaving ? landed("firebase") ? "Signed out" : "Signing you out" : "Overview"), /* @__PURE__ */ React.createElement("div", { className: "cs-ph" }, SHAPE.map((row, r) => {
      const many = phone ? Math.min(row.cols, row.kind === "tile" ? 2 : 1) : row.cols, inn = leaving ? !landed(row.read === "clients" ? "session-end" : "session-end") : landed(row.read);
      return /* @__PURE__ */ React.createElement("div", { key: r, className: cx("cs-ph-row", "k-" + row.kind), style: { gridTemplateColumns: `repeat(${many}, minmax(0, 1fr))`, width: typeof row.w === "number" ? row.w * 100 + "%" : void 0, "--r": r } }, Array.from({ length: many }, () => n++).map((i) => {
        const head = headsFor(row, i);
        return /* @__PURE__ */ React.createElement("div", { key: i, className: cx("cs-ph-blk", "k-" + row.kind, inn && "in"), style: { height: phone && row.kind === "card" ? Math.min(row.h, 220) : row.h, "--i": i } }, head ? /* @__PURE__ */ React.createElement("span", { className: "sc51b-head" }, head) : null, /* @__PURE__ */ React.createElement(Bones, { kind: row.kind }));
      }));
    }))));
  }
  function Flyer({ from, to, size, onDone }) {
    const ref = useRef(null);
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el || !from || !to) {
        onDone && onDone();
        return;
      }
      el.style.left = from.left + "px";
      el.style.top = from.top + "px";
      el.style.width = from.width + "px";
      el.style.height = from.height + "px";
      const c = animate(el, { x: to.left + to.width / 2 - (from.left + from.width / 2), y: to.top + to.height / 2 - (from.top + from.height / 2), scale: to.width / from.width }, { type: "spring", stiffness: 220, damping: 26, mass: 1 });
      const t = setTimeout(() => onDone && onDone(), 780);
      return () => {
        c.stop();
        clearTimeout(t);
      };
    }, []);
    return /* @__PURE__ */ React.createElement("div", { ref, className: "sc51b-flyer", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SH.LoadMark, { size, drawn: 1 }));
  }
  function Stage({ phase, me, reads, signin, console: cs, onDone }) {
    const reduce = useReducedMotion();
    const app = useApp();
    const phone = app.bp === "phone";
    const prev = useRef(phase);
    const fromRef = useRef(null);
    const born = useRef(performance.now());
    if (prev.current !== phase) {
      born.current = performance.now();
      const m = document.querySelector(phase === "enter" ? ".si-ws .mark" : ".sb-brand .mark, .sidebar .mark");
      fromRef.current = m ? m.getBoundingClientRect() : null;
      prev.current = phase;
    }
    const covering = phase === "boot" || phase === "enter" || phase === "leave";
    const [box, setBox] = useState(null);
    const [fly, setFly] = useState(null);
    const [flown, setFlown] = useState(false);
    const [lifting, setLifting] = useState(false);
    const [sidebarIn, setSidebarIn] = useState(true);
    const root = useRef(null);
    useEffect(() => {
      setFly(null);
      setFlown(false);
      setLifting(false);
      setSidebarIn(true);
    }, [phase]);
    const measure = () => {
      const sc = root.current && root.current.querySelector(".scroll");
      if (sc) {
        const r = sc.getBoundingClientRect();
        setBox({ left: r.left, top: r.top, width: r.width, height: r.height });
      }
    };
    useLayoutEffect(() => {
      if (phase === "enter" || phase === "boot" && me || phase === "leave") {
        measure();
        if (phase === "enter" && !reduce) {
          const sb = root.current.querySelector(".sidebar, .tabbar"), brand = root.current.querySelector(".sb-brand .mark, .sidebar .mark");
          if (sb && brand && fromRef.current) {
            const was = sb.style.animation;
            sb.style.animation = "none";
            const to = brand.getBoundingClientRect();
            sb.style.animation = was;
            setFly({ from: fromRef.current, to, size: fromRef.current.width });
          } else setFlown(true);
        } else setFlown(true);
      } else setBox(null);
      const ro = () => measure();
      window.addEventListener("resize", ro);
      return () => window.removeEventListener("resize", ro);
    }, [phase]);
    const ready = reads.done || performance.now() - born.current > MAX;
    useEffect(() => {
      if (!covering || !ready) return;
      const wait = Math.max(0, MIN[phase] - (performance.now() - born.current)) + (reduce ? 400 : 200);
      const t = setTimeout(() => {
        if (phase === "leave") {
          setSidebarIn(false);
          const brand = fromRef.current;
          setTimeout(() => {
            const m = document.querySelector(".si-ws .mark");
            const to = m ? m.getBoundingClientRect() : null;
            if (!reduce && brand && to) setFly({ from: brand, to, size: brand.width, back: true });
            else onDone();
          }, reduce ? 0 : 60);
        } else {
          setLifting(true);
          setTimeout(onDone, reduce ? 0 : 520);
        }
      }, wait);
      return () => clearTimeout(t);
    }, [ready, covering, phase]);
    const who = me ? me.name.split(" ")[0] : "";
    const bootSignedOut = phase === "boot" && !me;
    const leaving = phase === "leave";
    const showConsole = phase === "console" || phase === "enter" || phase === "boot" && me || leaving && sidebarIn;
    return /* @__PURE__ */ React.createElement("div", { ref: root, className: cx("sc51b-stage", phase, phone && "phone", (phase === "enter" || phase === "boot" && me) && "assembling", leaving && !sidebarIn && "withdrawing", bootSignedOut && "bones"), "aria-busy": covering || void 0 }, showConsole && /* @__PURE__ */ React.createElement("div", { className: cx("sc51b-console", fly && !flown && !fly.back && "mark-hidden"), inert: covering ? "" : void 0 }, cs), (phase === "signin" || bootSignedOut || leaving && !sidebarIn || phase === "enter" && !flown) && /* @__PURE__ */ React.createElement("div", { className: cx("sc51b-signin", phase === "enter" && "folding", leaving && "arriving", fly && fly.back && !flown && "mark-hidden"), inert: covering ? "" : void 0 }, signin, bootSignedOut && /* @__PURE__ */ React.createElement("div", { className: "sc51b-formveil", role: "status", "aria-busy": "true" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Opening the console."), /* @__PURE__ */ React.createElement(Route, { done: reads.done }))), covering && !bootSignedOut && /* @__PURE__ */ React.createElement(Veil, { reads, leaving, box, who, lifting }), fly && !flown && /* @__PURE__ */ React.createElement(Flyer, { from: fly.from, to: fly.to, size: fly.size, onDone: () => {
      setFlown(true);
      if (fly.back) onDone();
    } }));
  }
  window.SC51 = { Stage };
})();

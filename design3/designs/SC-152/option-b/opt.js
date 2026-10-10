(function() {
  const { useState, useEffect, useRef } = React;
  const { motion, useReducedMotion } = Motion;
  const { Icon, Segmented, Switch, useNotice, cx } = window.SC3;
  const { usePhase, useFreeze, REFUSAL } = window.SC152;
  const EASE = [0.22, 1, 0.36, 1];
  const POP = { type: "spring", stiffness: 520, damping: 22, mass: 1 };
  function Tick({ size = 18 }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement(motion.svg, { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", initial: reduce ? false : { scale: 0.4 }, animate: { scale: 1 }, transition: POP }, /* @__PURE__ */ React.createElement(motion.path, { d: "M5 12.5l4.5 4.5L19 7.5", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", initial: { pathLength: reduce ? 1 : 0 }, animate: { pathLength: 1 }, transition: { duration: reduce ? 0 : 0.28, ease: EASE } }));
  }
  function useTell(p, err, busy, go) {
    const notice = useNotice();
    const told = useRef("");
    useEffect(() => {
      if (p === "slow" && told.current !== "slow") {
        told.current = "slow";
        notice.toast({ text: `${busy.replace(/…$/, "")}: still working. The platform can take a few seconds to wake.`, icon: "cloud", ms: 4200 });
      }
      if (p === "error" && told.current !== "error") {
        told.current = "error";
        const say = () => notice.toast({ text: err, tone: "err", ms: window.SC152.FROZEN ? 6e4 : 6e3 });
        window.SC152.FROZEN ? setTimeout(say, 60) : say();
      }
      if (p === "idle" || p === "wait") told.current = "";
    }, [p]);
  }
  function Action({ variant = "secondary", size, icon, block, label, busy, done, run, reason, onApply, className }) {
    const reduce = useReducedMotion();
    const { phase: p, err, go } = usePhase({ run, reason, onApply });
    useTell(p, err, busy, go);
    const sz = size === "sm" ? 16 : size === "xl" ? 20 : 18;
    const working = p === "wait" || p === "busy" || p === "slow";
    const filling = p === "busy" || p === "slow";
    const fill = p === "done" ? 1 : filling ? 0.9 : 0;
    const glyph = (k) => k === "done" ? /* @__PURE__ */ React.createElement(Tick, { size: sz }) : icon ? /* @__PURE__ */ React.createElement(Icon, { name: icon, size: sz }) : null;
    const rest = p === "done" ? "done" : "rest";
    return /* @__PURE__ */ React.createElement(
      motion.button,
      {
        type: "button",
        className: cx("btn", `btn-${variant}`, size && `btn-${size}`, block && "btn-block", "pf-btn", className),
        "data-phase": p,
        "aria-disabled": working || p === "done" || void 0,
        onClick: go,
        animate: p === "error" && !reduce ? { x: [0, -8, 8, -5, 5, -2, 0] } : { x: 0 },
        transition: { duration: 0.36, ease: "easeOut" }
      },
      /* @__PURE__ */ React.createElement(
        motion.span,
        {
          className: cx("pf-fill", p === "error" && "err"),
          "aria-hidden": "true",
          initial: false,
          animate: { scaleX: p === "error" ? 0 : fill, opacity: p === "done" ? [1, 1, 0] : 1 },
          transition: p === "done" ? { scaleX: { duration: 0.18, ease: EASE }, opacity: { duration: 1.1, times: [0, 0.6, 1] } } : p === "error" ? { duration: reduce ? 0 : 0.42, ease: EASE } : { duration: reduce || !filling ? 0 : 1.4, ease: [0.3, 0.7, 0.4, 1] }
        }
      ),
      /* @__PURE__ */ React.createElement("span", { className: "pf-faces" }, ["rest", "done"].map((k) => /* @__PURE__ */ React.createElement("span", { key: k, className: cx("pf-face", k !== rest && "off"), "aria-hidden": k !== rest || void 0 }, glyph(k) && /* @__PURE__ */ React.createElement("span", { className: "pf-ic" }, glyph(k)), /* @__PURE__ */ React.createElement("span", null, label)))),
      /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, filling ? busy : p === "done" ? done : "")
    );
  }
  function Toggle({ kind, label, initial, options, reason }) {
    const run = () => window.SC152.call(reason);
    const freeze = useFreeze();
    const notice = useNotice();
    const reduce = useReducedMotion();
    const changed = kind === "switch" ? !initial : "tell";
    const [value, setValue] = useState(freeze && freeze !== "error" ? changed : initial);
    const [state, setState] = useState(freeze === "pending" ? "busy" : freeze || "idle");
    useEffect(() => {
      if (freeze === "error") setTimeout(() => notice.toast({ text: `${reason} Put back as it was.`, tone: "err", ms: 6e4 }), 60);
    }, []);
    useEffect(() => {
      if (freeze) return;
      if (state !== "done" && state !== "error") return;
      const t = setTimeout(() => setState("idle"), 1100);
      return () => clearTimeout(t);
    }, [state]);
    const change = (v) => {
      if (freeze || state === "busy" || state === "slow") return;
      const before = value;
      setValue(v);
      setState("busy");
      run().then(() => setState("done"), (e) => {
        setValue(before);
        setState("error");
        notice.toast({ text: `${e.message} Put back as it was.`, tone: "err", ms: 6e3 });
      });
    };
    const busyNow = state === "busy" || state === "slow";
    return /* @__PURE__ */ React.createElement("div", { className: "lab-toggle pf-row", "aria-busy": busyNow || void 0 }, /* @__PURE__ */ React.createElement("span", { className: "t-lbl" }, label), kind === "switch" ? /* @__PURE__ */ React.createElement(Switch, { checked: value, onChange: change, label }) : /* @__PURE__ */ React.createElement(Segmented, { label, value, onChange: change, options }), /* @__PURE__ */ React.createElement(motion.i, { className: cx("pf-rowline", state === "error" && "err"), "aria-hidden": "true", initial: false, animate: { scaleX: state === "done" ? 1 : busyNow ? 0.9 : 0, opacity: state === "idle" ? 0 : 1 }, transition: { duration: reduce ? 0 : busyNow ? 1.4 : 0.2, ease: busyNow ? [0.3, 0.7, 0.4, 1] : EASE } }), /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, busyNow ? "Saving" : state === "done" ? "Saved" : ""));
  }
  Object.assign(window.SC152, {
    name: "Option B · The fill",
    lede: "The button is its own progress bar. Its words never change. Its ground fills from the left in a deeper tone of its own colour, creeping to 90% while it waits, with a sheen passing over the filled part. The answer completes the fill, and a tick takes the icon's place. A refusal drains the fill back with a shake. The reason, or a long wait, comes as a toast, so nothing on the page moves. Controls take their new value at once, with a line filling under their row. Try Slow and Refused.",
    Action,
    Toggle
  });
})();

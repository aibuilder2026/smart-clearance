(function() {
  const { useState, useEffect, useSyncExternalStore } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const { Icon, Segmented, Switch, cx } = window.SC3;
  const { usePhase, useFreeze, REFUSAL } = window.SC152;
  const EASE = [0.22, 1, 0.36, 1];
  const POP = { type: "spring", stiffness: 520, damping: 22, mass: 1 };
  const CHIP = { type: "spring", stiffness: 420, damping: 34, mass: 1 };
  let calls = [];
  const subs = /* @__PURE__ */ new Set();
  const emit = () => subs.forEach((f) => f());
  const put = (c) => {
    calls = [...calls.filter((x) => x.id !== c.id), c];
    emit();
  };
  const drop = (id) => {
    calls = calls.filter((x) => x.id !== id);
    emit();
  };
  const useCalls = () => useSyncExternalStore((f) => {
    subs.add(f);
    return () => subs.delete(f);
  }, () => calls);
  let n = 0;
  function Arc({ size = 18 }) {
    return /* @__PURE__ */ React.createElement("svg", { className: "pc-arc", width: size, height: size, viewBox: "0 0 20 20", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("circle", { cx: "10", cy: "10", r: "7.5", fill: "none", stroke: "currentColor", strokeOpacity: "0.28", strokeWidth: "2.25" }), /* @__PURE__ */ React.createElement("path", { d: "M10 2.5a7.5 7.5 0 0 1 7.5 7.5", fill: "none", stroke: "currentColor", strokeWidth: "2.25", strokeLinecap: "round" }));
  }
  function Tick({ size = 18 }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement(motion.svg, { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", initial: reduce ? false : { scale: 0.4 }, animate: { scale: 1 }, transition: POP }, /* @__PURE__ */ React.createElement(motion.path, { d: "M5 12.5l4.5 4.5L19 7.5", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", initial: { pathLength: reduce ? 1 : 0 }, animate: { pathLength: 1 }, transition: { duration: reduce ? 0 : 0.28, ease: EASE } }));
  }
  function useChip(text, p, err, go) {
    const [id] = useState(() => "c" + ++n);
    useEffect(() => {
      if (p === "busy" || p === "slow") put({ id, text, state: p });
      else if (p === "done") {
        if (calls.some((c) => c.id === id)) {
          put({ id, text, state: "done" });
          const t = setTimeout(() => drop(id), 1200);
          return () => clearTimeout(t);
        }
      } else if (p === "error") put({ id, text, state: "error", err, retry: () => {
        drop(id);
        go();
      } });
    }, [p]);
  }
  function Action({ variant = "secondary", size, icon, block, label, busy, done, run, reason, onApply, answerFirst, className }) {
    const reduce = useReducedMotion();
    const { phase: p, err, go } = usePhase({ run, reason, onApply, optimistic: !answerFirst });
    const sz = size === "sm" ? 16 : size === "xl" ? 20 : 18;
    useChip(label, answerFirst ? "idle" : p, err, go);
    const [landed, setLanded] = useState(false);
    useEffect(() => {
      if (answerFirst) return;
      if (p === "done") setLanded(true);
      if (p === "error") setLanded(false);
    }, [p]);
    const early = !answerFirst && (landed || p === "wait" || p === "busy" || p === "slow" || p === "done");
    const waiting = answerFirst && (p === "busy" || p === "slow");
    const k = early || p === "done" ? "done" : waiting ? "busy" : "rest";
    const faces = { rest: [icon && /* @__PURE__ */ React.createElement(Icon, { name: icon, size: sz }), label], busy: [/* @__PURE__ */ React.createElement(Arc, { size: sz }), busy], done: [/* @__PURE__ */ React.createElement(Tick, { size: sz }), done] };
    return /* @__PURE__ */ React.createElement("div", { className: cx("pc", block && "pc-block") }, /* @__PURE__ */ React.createElement(
      motion.button,
      {
        type: "button",
        className: cx("btn", `btn-${variant}`, size && `btn-${size}`, block && "btn-block", "pc-btn", className),
        "data-phase": k,
        "aria-disabled": k !== "rest" || void 0,
        onClick: go,
        animate: p === "error" && !reduce ? { x: [0, -8, 8, -5, 5, -2, 0] } : { x: 0 },
        transition: { duration: 0.36, ease: "easeOut" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "pc-faces", "aria-hidden": "true" }, Object.keys(faces).map((f) => /* @__PURE__ */ React.createElement("span", { key: f, className: "pc-face" }, faces[f][0] && /* @__PURE__ */ React.createElement("span", { className: "pc-ic" }, faces[f][0]), /* @__PURE__ */ React.createElement("span", null, faces[f][1])))),
      /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false, mode: "popLayout" }, /* @__PURE__ */ React.createElement(motion.span, { key: k, className: "pc-face pc-live", initial: reduce ? false : { y: 12, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -12, opacity: 0 }, transition: { duration: 0.24, ease: EASE } }, faces[k][0] && /* @__PURE__ */ React.createElement("span", { className: "pc-ic" }, faces[k][0]), /* @__PURE__ */ React.createElement("span", null, faces[k][1])))
    ), answerFirst && p === "error" && /* @__PURE__ */ React.createElement("div", { className: "pc-note", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 14 }), /* @__PURE__ */ React.createElement("span", null, err)), /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, k === "done" ? done : k === "busy" ? busy : ""));
  }
  function Toggle({ kind, label, initial, options, reason }) {
    const run = () => window.SC152.call(reason);
    const freeze = useFreeze();
    const changed = kind === "switch" ? !initial : "tell";
    const [value, setValue] = useState(freeze && freeze !== "error" ? changed : initial);
    const [id] = useState(() => "t" + ++n);
    useEffect(() => {
      if (freeze) put({ id, text: label, state: freeze === "pending" ? "busy" : freeze, err: `${reason} Put back as it was.`, retry: () => drop(id) });
    }, []);
    const change = (v) => {
      if (freeze || calls.some((c) => c.id === id && (c.state === "busy" || c.state === "slow"))) return;
      const before = value;
      setValue(v);
      const show = setTimeout(() => put({ id, text: label, state: "busy" }), 100);
      const slow = setTimeout(() => put({ id, text: label, state: "slow" }), 3e3);
      run().then(
        () => {
          clearTimeout(show);
          clearTimeout(slow);
          if (calls.some((c) => c.id === id)) {
            put({ id, text: label, state: "done" });
            setTimeout(() => drop(id), 1200);
          }
        },
        (e) => {
          clearTimeout(show);
          clearTimeout(slow);
          setValue(before);
          put({ id, text: label, state: "error", err: `${e.message} Put back as it was.`, retry: () => {
            drop(id);
            change(v);
          } });
        }
      );
    };
    return /* @__PURE__ */ React.createElement("div", { className: "lab-toggle" }, /* @__PURE__ */ React.createElement("span", { className: "t-lbl" }, label), kind === "switch" ? /* @__PURE__ */ React.createElement(Switch, { checked: value, onChange: change, label }) : /* @__PURE__ */ React.createElement(Segmented, { label, value, onChange: change, options }), /* @__PURE__ */ React.createElement("span", { className: "t-note" }));
  }
  function Host() {
    const list = useCalls();
    const reduce = useReducedMotion();
    const busy = list.filter((c) => c.state === "busy" || c.state === "slow"), saved = list.filter((c) => c.state === "done");
    const many = (xs) => xs.length === 1 ? xs[0].text : `${xs.length} changes`;
    const rows = list.filter((c) => c.state === "error").slice(-2);
    if (busy.length) rows.push({ id: "sum", state: busy.some((c) => c.state === "slow") ? "slow" : "busy", text: many(busy) });
    else if (saved.length) rows.push({ id: "sum", state: "done", text: many(saved) });
    return /* @__PURE__ */ React.createElement("div", { className: "pc-host", "aria-live": "polite" }, /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, rows.map((c) => /* @__PURE__ */ React.createElement(motion.div, { key: c.id, layout: true, className: cx("pc-chip", c.state), initial: reduce ? false : { opacity: 0, y: 16, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 8, transition: { duration: 0.16 } }, transition: CHIP, role: c.state === "error" ? "alert" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "pc-ic" }, c.state === "done" ? /* @__PURE__ */ React.createElement(Tick, { size: 16 }) : c.state === "error" ? /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 16 }) : /* @__PURE__ */ React.createElement(Arc, { size: 16 })), /* @__PURE__ */ React.createElement("span", { className: "pc-txt" }, c.state === "done" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, "Saved"), " · ", c.text) : c.state === "error" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, "Not saved"), " · ", c.err) : c.state === "slow" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, "Still saving"), " · ", c.text, ". The platform can take a few seconds to wake.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, "Saving"), " · ", c.text)), c.state === "error" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm", onClick: c.retry }, "Try again"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "iconbtn round", "aria-label": "Dismiss", onClick: () => drop(c.id) }, /* @__PURE__ */ React.createElement(Icon, { name: "x", size: 14 })))))));
  }
  Object.assign(window.SC152, {
    name: "Option C · Act at once",
    lede: "The button never waits. The press shows its result straight away: the button turns to its done word with a tick, and the screen's state changes. One saving chip at the foot of the window carries the call and turns to Saved. A refusal puts the screen back as it was, and the chip turns red with the reason and Try again. What can't be shown before the answer, like Fire now and Send request here (also sign-in, uploads and opening a PDF), waits in the button, with its words and a spinner. Try Slow and Refused.",
    Action,
    Toggle,
    Host
  });
})();

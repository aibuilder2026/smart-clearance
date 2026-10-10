// Option A · Says what it's doing (recommended). SC-49's Sign in, for every button that calls the network: the button
// keeps its size and says what it is doing ("Approving the plan…"), a spinner turns in the icon's place and a line
// creeps along its foot; the answer lands as a tick and the done word, or as a shake and the reason under the button,
// with Try again. A wait past 3 s says so. Nothing shows for an answer under 100 ms, and a shown wait stays 400 ms.
(function () {
  const { useState, useEffect, useId } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const { Icon, Segmented, Switch, cx } = window.SC3;
  const { usePhase, useFreeze, REFUSAL } = window.SC152;
  const EASE = [0.22, 1, 0.36, 1];
  const POP = { type: "spring", stiffness: 520, damping: 22, mass: 1 }; // the tick's pop, SC-49's

  // the spinner: an arc turning in the button's own ink (a loading indicator, so it turns until the answer lands)
  function Arc({ size = 18 }) {
    return <svg className="pa-arc" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2.25" /><path d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" /></svg>;
  }
  function Tick({ size = 18 }) {
    const reduce = useReducedMotion();
    return <motion.svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }} transition={POP}>
      <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.28, ease: EASE }} /></motion.svg>;
  }

  // one face of the button: what sits in the icon's place, and the words
  const face = (p, { icon, label, busy, done }, sz) =>
    p === "done" ? [<Tick key="t" size={sz} />, done]
      : p === "busy" || p === "slow" ? [<Arc key="a" size={sz} />, busy]
        : [icon ? <Icon key="i" name={icon} size={sz} /> : null, label];

  function Action({ variant = "secondary", size, icon, block, label, busy, done, run, reason, onApply, className }) {
    const reduce = useReducedMotion();
    const { phase: p, err, go } = usePhase({ run, reason, onApply });
    const id = useId();
    const sz = size === "sm" ? 16 : size === "xl" ? 20 : 18;
    const working = p === "wait" || p === "busy" || p === "slow";
    const shown = p === "busy" || p === "slow" ? "busy" : p === "done" ? "done" : "rest";
    const words = { icon, label, busy, done };
    const [glyph, text] = face(p, words, sz);
    return <div className={cx("pa", block && "pa-block")}>
      <motion.button type="button" className={cx("btn", `btn-${variant}`, size && `btn-${size}`, block && "btn-block", "pa-btn", className)} data-phase={p}
        aria-disabled={working || p === "done" || undefined} aria-describedby={p === "error" || p === "slow" ? id : undefined} onClick={go}
        animate={p === "error" && !reduce ? { x: [0, -8, 8, -5, 5, -2, 0] } : { x: 0 }} transition={{ duration: 0.36, ease: "easeOut" }}>
        {/* every face, stacked and hidden, so the button keeps the width of its widest face: it never jumps */}
        <span className="pa-faces" aria-hidden="true">{["rest", "busy", "done"].map(k => { const [g, t] = face(k === "rest" ? "idle" : k, words, sz); return <span key={k} className="pa-face">{g && <span className="pa-ic">{g}</span>}<span>{t}</span></span>; })}</span>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={shown} className="pa-face pa-live" initial={reduce ? false : { y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -12, opacity: 0 }} transition={{ duration: 0.24, ease: EASE }}>
            {glyph && <span className="pa-ic">{glyph}</span>}<span>{text}</span>
          </motion.span>
        </AnimatePresence>
        {(shown !== "rest") && <motion.i className="pa-line" aria-hidden="true" initial={{ scaleX: reduce ? 0.9 : 0 }} animate={{ scaleX: p === "done" ? 1 : 0.9, opacity: p === "done" ? 0 : 1 }} transition={p === "done" ? { scaleX: { duration: 0.16, ease: EASE }, opacity: { delay: 0.5, duration: 0.3 } } : { duration: reduce ? 0 : 1.1, ease: [0.3, 0.7, 0.4, 1] }} />}
      </motion.button>
      <span className="sr-only" role="status">{shown === "busy" ? busy : shown === "done" ? done : ""}</span>
      <AnimatePresence initial={false}>{(p === "slow" || p === "error") && <motion.div key={p} id={id} className={cx("pa-note", p === "error" && "err")} initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.24, ease: EASE }} role={p === "error" ? "alert" : undefined}>
        {p === "slow" ? <><Icon name="cloud" size={14} /><span>Still working. The platform can take a few seconds to wake.</span></>
          : <><Icon name="circle-alert" size={14} /><span>{err}</span><button type="button" className="btn btn-link btn-sm" onClick={go}>Try again</button></>}
      </motion.div>}</AnimatePresence>
    </div>;
  }

  // a control that saves: it takes the new value at once and says so on its own line; a refusal puts it back, with why
  function Toggle({ kind, label, initial, options, reason }) {
    const run = () => window.SC152.call(reason);
    const freeze = useFreeze();
    const changed = kind === "switch" ? !initial : "tell";
    const [value, setValue] = useState(freeze && freeze !== "error" ? changed : initial);
    const [state, setState] = useState(freeze === "pending" ? "busy" : freeze || "idle");
    const [err, setErr] = useState(freeze === "error" ? `${reason} Put back as it was.` : "");
    useEffect(() => { if (state !== "done") return; const t = setTimeout(() => setState("idle"), 1200); return () => clearTimeout(t); }, [state]);
    const change = v => {
      if (freeze || state === "busy" || state === "slow") return;
      const before = value; setValue(v); setState("busy"); setErr("");
      const slow = setTimeout(() => setState(s => (s === "busy" ? "slow" : s)), 3000);
      run().then(() => { clearTimeout(slow); setState("done"); }, e => { clearTimeout(slow); setValue(before); setErr(`${e.message} Put back as it was.`); setState("error"); });
    };
    const busyNow = state === "busy" || state === "slow";
    return <div className="lab-toggle" aria-busy={busyNow || undefined}><span className="t-lbl">{label}</span>
      {kind === "switch" ? <Switch checked={value} onChange={change} label={label} /> : <Segmented label={label} value={value} onChange={change} options={options} />}
      <span className={cx("t-note pa-tnote", state === "error" && "err")} role={state === "error" ? "alert" : "status"}>
        {busyNow ? <><Arc size={14} />{state === "slow" ? "Still saving. The platform can take a few seconds to wake." : "Saving…"}</>
          : state === "done" ? <><span className="pa-ok"><Tick size={14} /></span>Saved</>
            : state === "error" ? <><Icon name="circle-alert" size={14} />{err}</> : null}
      </span></div>;
  }

  Object.assign(window.SC152, {
    name: "Option A · Says what it's doing",
    lede: "Every button that calls the network works like the console's Sign in (SC-49). It keeps its size and says what it is doing, with a spinner in the icon's place and a line creeping along its foot. The answer lands as a tick and the done word, or as a shake and the reason under the button, with Try again. Past 3 seconds a quiet line says it is still working. Controls take their new value at once and say Saving… beside them. Try Slow and Refused.",
    Action, Toggle,
  });
})();

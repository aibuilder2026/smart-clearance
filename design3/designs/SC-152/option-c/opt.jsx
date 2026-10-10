// Option C · Act at once. The button never waits: the press shows its result straight away (the button turns to its
// done word with a tick, the screen's state changes), and one saving chip at the foot of the window carries the call
// ("Saving · Approve · ₹21,770"), turning to Saved. A refusal puts the screen back as it was and the chip turns red
// with the reason and Try again. What can't be shown before the answer (Fire now, Send request, sign-in, uploads,
// opening a PDF) waits in the button, with its words and a spinner.
(function () {
  const { useState, useEffect, useSyncExternalStore } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const { Icon, Segmented, Switch, cx } = window.SC3;
  const { usePhase, useFreeze, REFUSAL } = window.SC152;
  const EASE = [0.22, 1, 0.36, 1];
  const POP = { type: "spring", stiffness: 520, damping: 22, mass: 1 };
  const CHIP = { type: "spring", stiffness: 420, damping: 34, mass: 1 }; // the kit's toast spring

  // the calls in flight, for the chip: { id, text, state: busy | slow | done | error, err, retry }
  let calls = []; const subs = new Set();
  const emit = () => subs.forEach(f => f());
  const put = c => { calls = [...calls.filter(x => x.id !== c.id), c]; emit(); };
  const drop = id => { calls = calls.filter(x => x.id !== id); emit(); };
  const useCalls = () => useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, () => calls);
  let n = 0;

  function Arc({ size = 18 }) {
    return <svg className="pc-arc" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2.25" /><path d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" /></svg>;
  }
  function Tick({ size = 18 }) {
    const reduce = useReducedMotion();
    return <motion.svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }} transition={POP}>
      <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.28, ease: EASE }} /></motion.svg>;
  }

  // the chip follows one call: it shows only once the call has taken 100 ms, and stays 400 ms once shown
  function useChip(text, p, err, go) {
    const [id] = useState(() => "c" + ++n);
    useEffect(() => {
      if (p === "busy" || p === "slow") put({ id, text, state: p });
      else if (p === "done") { if (calls.some(c => c.id === id)) { put({ id, text, state: "done" }); const t = setTimeout(() => drop(id), 1200); return () => clearTimeout(t); } }
      else if (p === "error") put({ id, text, state: "error", err, retry: () => { drop(id); go(); } });
    }, [p]);
  }

  function Action({ variant = "secondary", size, icon, block, label, busy, done, run, reason, onApply, answerFirst, className }) {
    const reduce = useReducedMotion();
    const { phase: p, err, go } = usePhase({ run, reason, onApply, optimistic: !answerFirst });
    const sz = size === "sm" ? 16 : size === "xl" ? 20 : 18;
    useChip(label, answerFirst ? "idle" : p, err, go);
    // once it has landed, the screen has moved on: the button keeps its done word
    const [landed, setLanded] = useState(false);
    useEffect(() => { if (answerFirst) return; if (p === "done") setLanded(true); if (p === "error") setLanded(false); }, [p]);
    // shown at once: the result, while the chip carries the call
    const early = !answerFirst && (landed || p === "wait" || p === "busy" || p === "slow" || p === "done");
    const waiting = answerFirst && (p === "busy" || p === "slow");
    const k = early || p === "done" ? "done" : waiting ? "busy" : "rest";
    const faces = { rest: [icon && <Icon name={icon} size={sz} />, label], busy: [<Arc size={sz} />, busy], done: [<Tick size={sz} />, done] };
    return <div className={cx("pc", block && "pc-block")}>
      <motion.button type="button" className={cx("btn", `btn-${variant}`, size && `btn-${size}`, block && "btn-block", "pc-btn", className)} data-phase={k}
        aria-disabled={k !== "rest" || undefined} onClick={go}
        animate={p === "error" && !reduce ? { x: [0, -8, 8, -5, 5, -2, 0] } : { x: 0 }} transition={{ duration: 0.36, ease: "easeOut" }}>
        <span className="pc-faces" aria-hidden="true">{Object.keys(faces).map(f => <span key={f} className="pc-face">{faces[f][0] && <span className="pc-ic">{faces[f][0]}</span>}<span>{faces[f][1]}</span></span>)}</span>
        <AnimatePresence initial={false} mode="popLayout"><motion.span key={k} className="pc-face pc-live" initial={reduce ? false : { y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -12, opacity: 0 }} transition={{ duration: 0.24, ease: EASE }}>
          {faces[k][0] && <span className="pc-ic">{faces[k][0]}</span>}<span>{faces[k][1]}</span></motion.span></AnimatePresence>
      </motion.button>
      {answerFirst && p === "error" && <div className="pc-note" role="alert"><Icon name="circle-alert" size={14} /><span>{err}</span></div>}
      <span className="sr-only" role="status">{k === "done" ? done : k === "busy" ? busy : ""}</span>
    </div>;
  }

  // a control that saves: the new value at once; the chip carries the call, and a refusal puts the value back
  function Toggle({ kind, label, initial, options, reason }) {
    const run = () => window.SC152.call(reason);
    const freeze = useFreeze();
    const changed = kind === "switch" ? !initial : "tell";
    const [value, setValue] = useState(freeze && freeze !== "error" ? changed : initial);
    const [id] = useState(() => "t" + ++n);
    useEffect(() => { if (freeze) put({ id, text: label, state: freeze === "pending" ? "busy" : freeze, err: `${reason} Put back as it was.`, retry: () => drop(id) }); }, []);
    const change = v => {
      if (freeze || calls.some(c => c.id === id && (c.state === "busy" || c.state === "slow"))) return;
      const before = value; setValue(v);
      const show = setTimeout(() => put({ id, text: label, state: "busy" }), 100);
      const slow = setTimeout(() => put({ id, text: label, state: "slow" }), 3000);
      run().then(() => { clearTimeout(show); clearTimeout(slow); if (calls.some(c => c.id === id)) { put({ id, text: label, state: "done" }); setTimeout(() => drop(id), 1200); } },
        e => { clearTimeout(show); clearTimeout(slow); setValue(before); put({ id, text: label, state: "error", err: `${e.message} Put back as it was.`, retry: () => { drop(id); change(v); } }); });
    };
    return <div className="lab-toggle"><span className="t-lbl">{label}</span>
      {kind === "switch" ? <Switch checked={value} onChange={change} label={label} /> : <Segmented label={label} value={value} onChange={change} options={options} />}
      <span className="t-note" /></div>;
  }

  // the chip at the foot of the window: one chip for every call in flight ("Saving · 3 changes"), turning to Saved;
  // a refusal gets its own chip, the latest two at most
  function Host() {
    const list = useCalls(); const reduce = useReducedMotion();
    const busy = list.filter(c => c.state === "busy" || c.state === "slow"), saved = list.filter(c => c.state === "done");
    const many = xs => (xs.length === 1 ? xs[0].text : `${xs.length} changes`);
    const rows = list.filter(c => c.state === "error").slice(-2);
    if (busy.length) rows.push({ id: "sum", state: busy.some(c => c.state === "slow") ? "slow" : "busy", text: many(busy) });
    else if (saved.length) rows.push({ id: "sum", state: "done", text: many(saved) });
    return <div className="pc-host" aria-live="polite"><AnimatePresence initial={false}>{rows.map(c => <motion.div key={c.id} layout className={cx("pc-chip", c.state)} initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, transition: { duration: 0.16 } }} transition={CHIP} role={c.state === "error" ? "alert" : undefined}>
      <span className="pc-ic">{c.state === "done" ? <Tick size={16} /> : c.state === "error" ? <Icon name="circle-alert" size={16} /> : <Arc size={16} />}</span>
      <span className="pc-txt">{c.state === "done" ? <><b>Saved</b> · {c.text}</> : c.state === "error" ? <><b>Not saved</b> · {c.err}</> : c.state === "slow" ? <><b>Still saving</b> · {c.text}. The platform can take a few seconds to wake.</> : <><b>Saving</b> · {c.text}</>}</span>
      {c.state === "error" && <><button type="button" className="btn btn-link btn-sm" onClick={c.retry}>Try again</button><button type="button" className="iconbtn round" aria-label="Dismiss" onClick={() => drop(c.id)}><Icon name="x" size={14} /></button></>}
    </motion.div>)}</AnimatePresence></div>;
  }

  Object.assign(window.SC152, {
    name: "Option C · Act at once",
    lede: "The button never waits. The press shows its result straight away: the button turns to its done word with a tick, and the screen's state changes. One saving chip at the foot of the window carries the call and turns to Saved. A refusal puts the screen back as it was, and the chip turns red with the reason and Try again. What can't be shown before the answer, like Fire now and Send request here (also sign-in, uploads and opening a PDF), waits in the button, with its words and a spinner. Try Slow and Refused.",
    Action, Toggle, Host,
  });
})();

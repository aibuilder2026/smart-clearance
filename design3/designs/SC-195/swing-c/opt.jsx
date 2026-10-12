// Swing option C · Pack by pack. An info button beside "swing" opens where the swing came from: one bar of the swing,
// split by exit, with each exit's share and what a pack sent there was worth against the bin; then each exit's pack
// beside the bin's on one scale. A popover on desktops and tablets, a sheet on phones. It answers "why so big" by the
// exits, not by the ledger: the bin's own lines are one sentence.
(function () {
  const K = window.SC3, Store = window.SC3_STORE, X = window.SC195;
  const { cx, Icon, Money, Sheet, useApp } = K; const { motion, AnimatePresence, useReducedMotion } = Motion;
  const { inr2, n0, fmt } = X;
  const Orig = K.TrackerCard;
  const useS = () => React.useSyncExternalStore(Store.subscribe, Store.get);
  const label = (w, s) => (w.posted ? (w.C.ES ? "recovered, after the negotiation" : "recovered, every line done") : ["approved", "executing", "dispatched", "settled", "cleared"].includes(s.hero.phase) ? "on plan · settles day 3–7" : "net recovered on the plan");

  function Where({ w }) {
    const reduce = useReducedMotion();
    const parts = w.exits.slice().sort((a, b) => b.contrib - a.contrib);
    const max = Math.max(w.wo.perUnit, ...w.exits.map(e => Math.abs(e.perPack)));
    const packs = [{ id: "bin", name: "The bin", perPack: -w.wo.perUnit, tone: "gone" }].concat(w.exits.map(e => ({ id: e.id, name: e.name, perPack: e.perPack, tone: e.perPack < 0 ? "gone" : "kept" })));
    return <div className="sw-where">
      <div className="sw-where-head"><span className="t-caption subtle">Where the swing came from</span><b className="tnum">{inr2(w.swing)}</b></div>
      <div className="sw-stack" role="img" aria-label={parts.map(p => `${p.name} ${inr2(p.contrib)}`).join(", ")}>
        {parts.map((p, i) => <motion.span key={p.id} className={cx("seg", i === 0 && "first")} style={{ flexGrow: Math.max(p.contrib, 0) }} initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : 0.42, delay: reduce ? 0 : i * 0.08, ease: [0.22, 1, 0.36, 1] }} />)}
      </div>
      <ul className="sw-parts">{parts.map(p => <li key={p.id}><span className="k"><b>{p.name}</b><span className="sub">{n0(p.units)} packs · {inr2(r(p.contrib / p.units))} a pack better than the bin</span></span><span className="v tnum">{inr2(p.contrib)}</span><span className="pct tnum">{Math.round((p.contrib / w.swing) * 100)}%</span></li>)}</ul>
      <p className="t-footnote muted">A pack's share is what it fetched, net, plus the {inr2(w.extraPer)} destroying it would have cost beyond its book cost: its GST credit, disposal and EPR.</p>
      <div className="sw-packs" aria-label="What a pack was worth, net, at each exit and in the bin">
        <span className="t-caption subtle">One pack, net</span>
        {packs.map((p, i) => { const pct = (Math.abs(p.perPack) / max) * 50; return <div key={p.id} className="sw-pack">
          <span className="name">{p.name}</span>
          <span className="track"><span className="mid" /><motion.span className={cx("fill", p.tone)} style={{ [p.perPack < 0 ? "right" : "left"]: "50%", width: pct + "%", transformOrigin: p.perPack < 0 ? "right" : "left" }} initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : 0.42, delay: reduce ? 0 : 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }} /></span>
          <span className={cx("v tnum", p.tone)}>{inr2(p.perPack)}</span>
        </div>; })}
      </div>
    </div>;
  }
  const r = n => Math.round(n * 100) / 100;
  // a popover anchored under the button, drawn over the page (the card clips what overflows it); Escape or a click
  // outside closes it, and focus returns to the button
  function Pop({ open, onClose, anchor, children }) {
    const ref = React.useRef(null); const reduce = useReducedMotion(); const [at, setAt] = React.useState(null);
    React.useLayoutEffect(() => {
      if (!open || !anchor.current) return;
      // below the button, or above it when the window has more room there
      const r = anchor.current.getBoundingClientRect(), w = Math.min(420, innerWidth - 24), below = innerHeight - r.bottom - 20, above = r.top - 20;
      const left = Math.max(12, Math.min(r.left + r.width / 2 - 60, innerWidth - w - 12));
      setAt(below >= 420 || below >= above ? { top: r.bottom + 8, left, width: w, maxHeight: below } : { bottom: innerHeight - r.top + 8, left, width: w, maxHeight: above });
    }, [open]);
    React.useEffect(() => {
      if (!open) return; const el = ref.current; el && el.focus();
      const key = e => { if (e.key === "Escape") { onClose(); anchor.current && anchor.current.focus(); } };
      const out = e => { if (el && !el.contains(e.target) && !anchor.current.contains(e.target)) onClose(); };
      window.addEventListener("keydown", key); window.addEventListener("pointerdown", out);
      return () => { window.removeEventListener("keydown", key); window.removeEventListener("pointerdown", out); };
    }, [open]);
    return ReactDOM.createPortal(<AnimatePresence>{open && at && <motion.div ref={ref} tabIndex={-1} role="dialog" aria-label="Where the swing came from" className="sw-pop" style={at} initial={reduce ? false : { opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>}</AnimatePresence>, document.body);
  }
  function MoneyC() {
    const s = useS(); const app = useApp(); const [open, setOpen] = React.useState(false); const w = X.working(s); const phone = app.bp === "phone"; const btn = React.useRef(null);
    return <div className="stack tight" style={{ gap: 2, position: "relative" }}>
      <Money value={w.net} size={phone ? "s" : "m"} roll style={{ color: "var(--primary-text)" }} />
      <span className="t-footnote subtle sw-line">{label(w, s)} · swing {fmt.inr(w.swing)}<button ref={btn} type="button" className="sw-i" aria-haspopup="dialog" aria-expanded={open} aria-label="Where the swing came from" onClick={() => setOpen(!open)}><Icon name="info" size={15} stroke={2.2} /></button></span>
      {phone ? <Sheet open={open} onClose={() => setOpen(false)} title="Where the swing came from" side="bottom" detent="large"><Where w={w} /></Sheet>
        : <Pop open={open} onClose={() => setOpen(false)} anchor={btn}><Where w={w} /></Pop>}
    </div>;
  }
  K.TrackerCard = props => <Orig {...props} money={props.money ? <MoneyC /> : props.money} />;
})();

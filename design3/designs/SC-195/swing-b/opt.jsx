// Swing option B · Beside the figure. Under the figure, "Show the working" opens two columns in place, on the card
// itself: destroyed against the plan, line by line, each P&L at its foot and the swing as the difference. No sheet and
// no chart: the reader never leaves the card, at the cost of a longer card while it is open.
(function () {
  const K = window.SC3, Store = window.SC3_STORE, X = window.SC195;
  const { cx, Icon, Money, useApp } = K; const { motion, AnimatePresence, useReducedMotion } = Motion;
  const { inr2, n0, fmt } = X;
  const Orig = K.TrackerCard;
  const useS = () => React.useSyncExternalStore(Store.subscribe, Store.get);
  const label = (w, s) => (w.posted ? (w.C.ES ? "recovered, after the negotiation" : "recovered, every line done") : ["approved", "executing", "dispatched", "settled", "cleared"].includes(s.hero.phase) ? "on plan · settles day 3–7" : "net recovered on the plan");
  const nil = "₹0";
  function Two({ w }) {
    const R = K.RULES || window.SC3_MONEY.RULES;
    const rows = [
      ["Sold or given", `${n0(w.units)} packs to ${w.exits.length} exits`, nil, "+" + inr2(w.gross)],
      ["Van, fees and handling", "", nil, inr2(-w.costs)],
      ["GST input credit reversed", w.given ? `only the ${n0(w.given)} donated packs, with the plan` : "", inr2(-w.wo.itc), w.itcLost ? inr2(-w.itcLost) : nil],
      ["Disposal", `${n0(w.units)} × ₹${R.disposalPerUnit.toFixed(2)}`, inr2(-w.wo.disposal), nil],
      ["EPR", `${w.wo.kg.toLocaleString("en-IN")} kg × ₹${R.eprPerKg.toFixed(2)}`, inr2(-w.wo.epr), nil],
      ["Stock at cost", "leaves the books either way", inr2(-w.book), inr2(-w.book)],
    ];
    return <div className="sw-two" role="table" aria-label="The working: destroyed against the plan">
      <div className="sw-two-r head" role="row"><span role="columnheader" /><span role="columnheader">Destroyed</span><span role="columnheader">With the plan</span></div>
      {rows.map(([k, sub, a, b]) => <div key={k} className="sw-two-r" role="row"><span role="rowheader" className="k"><span>{k}</span>{sub && <span className="sub">{sub}</span>}</span><span role="cell" className="tnum">{a}</span><span role="cell" className="tnum">{b}</span></div>)}
      <div className="sw-two-r total" role="row"><span role="rowheader" className="k">P&amp;L</span><span role="cell" className="tnum gone">{inr2(-w.wo.total)}</span><span role="cell" className="tnum">{inr2(w.pnl)}</span></div>
      <div className="sw-two-r swing" role="row"><span role="rowheader" className="k">The swing: the plan is better by</span><span role="cell" className="tnum" aria-hidden="true" /><span role="cell" className="tnum">{inr2(w.swing)}</span></div>
      <p className="t-caption subtle">The plan kept the GST credit on the {n0(w.sold)} packs sold and paid no disposal or EPR; the stock leaves the books at cost either way.</p>
    </div>;
  }
  function MoneyB() {
    const s = useS(); const app = useApp(); const reduce = useReducedMotion(); const [open, setOpen] = React.useState(false); const w = X.working(s); const phone = app.bp === "phone";
    return <div className="stack tight" style={{ gap: 4, width: "100%" }}>
      <Money value={w.net} size={phone ? "s" : "m"} roll style={{ color: "var(--primary-text)" }} />
      <span className="t-footnote subtle">{label(w, s)} · swing {fmt.inr(w.swing)}</span>
      <button type="button" className="sw-disc" aria-expanded={open} aria-controls="sw-two" onClick={() => setOpen(!open)}><span>{open ? "Hide the working" : "Show the working"}</span><Icon name="chevron-down" size={16} stroke={2.2} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 240ms var(--ease)" }} /></button>
      <AnimatePresence initial={false}>{open && <motion.div id="sw-two" key="two" style={{ overflow: "hidden" }} initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}><Two w={w} /></motion.div>}</AnimatePresence>
    </div>;
  }
  K.TrackerCard = props => <Orig {...props} money={props.money ? <MoneyB /> : props.money} />;
})();

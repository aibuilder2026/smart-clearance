// Swing option A · How it adds up. Under the figure, a note says the swing in words ("₹22,194 better than destroying
// it") and opens the working in a sheet: the bin's cost, line by line; what each exit did; the P&L either way and the
// swing between them; a bridge from one P&L to the other; and how the loss was kept small. Recommended: every figure
// on the card can be followed to its rule, in one place, without crowding the card.
(function () {
  const K = window.SC3, Store = window.SC3_STORE, X = window.SC195;
  const { cx, Icon, Money, Sheet, useApp } = K; const { motion, useReducedMotion } = Motion;
  const { inr2, n0, fmt } = X;
  const Orig = K.TrackerCard;
  const useS = () => React.useSyncExternalStore(Store.subscribe, Store.get);
  const label = (w, s) => (w.posted ? (w.C.ES ? "recovered, after the negotiation" : "recovered, every line done") : ["approved", "executing", "dispatched", "settled", "cleared"].includes(s.hero.phase) ? "on plan · settles day 3–7" : "net recovered on the plan");

  // the bridge: from the P&L if the batch were destroyed to the P&L with the plan, a step for each exit and one for what
  // destroying would have cost beyond the stock; green rises, clay falls, the two ends stand on zero
  function Bridge({ w }) {
    const reduce = useReducedMotion();
    const steps = [{ k: "If destroyed", v: -w.wo.total, end: true, tone: "gone" }]
      .concat(w.exits.map(e => ({ k: e.name, v: e.net, tone: e.net < 0 ? "gone" : "kept" })))
      .concat([{ k: "Not paid", v: w.extra, tone: "kept", soft: true }, { k: "With the plan", v: w.pnl, end: true, tone: "plan" }]);
    let run = 0;
    const bars = steps.map(st => { if (st.end) { run = st.v; return { ...st, from: 0, to: st.v }; } const b = { ...st, from: run, to: run + st.v }; run += st.v; return b; });
    const lo = Math.min(0, ...bars.map(b => Math.min(b.from, b.to))) * 1.06, hi = Math.max(0, ...bars.map(b => Math.max(b.from, b.to))) + Math.abs(lo) * 0.14;
    const W = 436, H = 250, top = 20, bot = 62, n = bars.length, bw = 40, gap = (W - n * bw) / (n + 1);
    const y = v => top + ((hi - v) / (hi - lo)) * (H - top - bot);
    return <figure className="sw-bridge" role="img" aria-label={`A bridge from ${inr2(-w.wo.total)} if destroyed to ${inr2(w.pnl)} with the plan: ${inr2(w.swing)} better`}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <line x1="0" x2={W} y1={y(0)} y2={y(0)} className="zero" />
        {bars.map((b, i) => {
          const x = gap + i * (bw + gap), y0 = y(Math.max(b.from, b.to)), h = Math.max(2, Math.abs(y(b.from) - y(b.to)));
          const below = b.v < 0 && !b.end;
          return <g key={b.k}>
            {i > 0 && <line x1={x - gap} x2={x} y1={y(b.end ? b.to : b.from)} y2={y(b.end ? b.to : b.from)} className="link" />}
            <motion.rect x={x} width={bw} rx="5" className={cx("bar", b.tone, b.soft && "soft")} initial={reduce ? false : { y: y(0), height: 0 }} animate={{ y: y0, height: h }} transition={{ duration: reduce ? 0 : 0.42, delay: reduce ? 0 : i * 0.07, ease: [0.22, 1, 0.36, 1] }} />
            <text x={x + bw / 2} y={below || (b.end && b.v < 0 && h > 40) ? y(b.to) + 15 : y0 - 7} className={cx("val", b.tone)} textAnchor="middle">{(b.v > 0 && !b.end ? "+" : "") + fmt.inr(Math.round(b.v))}</text>
            {/* the step's name on up to two lines under the chart */}
            {(b.k.includes(" ") ? [b.k.slice(0, b.k.indexOf(" ")), b.k.slice(b.k.indexOf(" ") + 1)] : [b.k]).map((t, j) => <text key={j} x={x + bw / 2} y={H - 26 + j * 13} className="lab" textAnchor="middle">{t}</text>)}
          </g>;
        })}
      </svg>
      <figcaption>"Not paid": what destroying would have cost beyond the stock (the GST credit, disposal and EPR).</figcaption>
    </figure>;
  }
  function Row({ k, sub, v, strong, tone }) {
    return <div className={cx("sw-row", strong && "strong")}><span className="k"><span>{k}</span>{sub && <span className="sub">{sub}</span>}</span><span className={cx("v tnum", tone)}>{v}</span></div>;
  }
  function Working({ w }) {
    const first = w.exits.slice().sort((a, b) => b.perPack - a.perPack)[0];
    return <div className="sw-work">
      <div className="sw-hero">
        <span className="t-caption subtle">The swing on {w.batch.id}</span>
        <span className="sw-big tnum">{inr2(w.swing)}</span>
        <p>Sending the batch to its exits left Munchly {inr2(w.swing)} better off than destroying it: a P&amp;L of {inr2(w.pnl)} instead of {inr2(-w.wo.total)}.</p>
      </div>
      <Bridge w={w} />
      <section><h3>If it were destroyed</h3>
        {X.binRows(w).map(([k, sub, v]) => <Row key={k} k={k} sub={sub} v={inr2(-v)} />)}
        <Row k="The bin would cost" sub={`₹${w.wo.perUnit.toFixed(2)} a pack`} v={inr2(-w.wo.total)} strong tone="gone" />
      </section>
      <section><h3>What the plan did</h3>
        {w.exits.map(e => <Row key={e.id} k={e.name} sub={X.lineHow(e)} v={(e.net < 0 ? "" : "+") + inr2(e.net)} tone={e.net < 0 ? "gone" : undefined} />)}
        <Row k="Recovered" v={inr2(w.net)} strong tone="kept" />
        <Row k="The stock leaves the books at cost" sub={`either way: ${n0(w.units)} × ₹${w.sku.cost.toFixed(2)}`} v={inr2(-w.book)} />
        <Row k="The P&L with the plan" v={inr2(w.pnl)} strong />
      </section>
      <section><h3>The swing</h3>
        <p className="sw-sum tnum">{inr2(w.pnl)} − ({inr2(-w.wo.total)}) = <b>{inr2(w.swing)}</b></p>
        <p className="t-footnote muted">Put another way: {inr2(w.net)} recovered, plus the {inr2(w.extra)} destroying it would have cost beyond the stock (the GST credit, disposal and EPR), which nobody paid.</p>
      </section>
      <section><h3>How the loss was kept small</h3>
        <ul className="sw-why">
          <li><Icon name="route" size={16} /><span>The Router filled the best-paying exit first: the {first.name.toLowerCase()} at {inr2(first.perPack)} a pack, net, against {inr2(-w.wo.perUnit)} a pack in the bin.</span></li>
          {w.left.slice(0, 2).map(r => <li key={r.id}><Icon name="circle-x" size={16} /><span>{r.short || r.name} was left out: {r.reason}.</span></li>)}
          <li><Icon name="receipt" size={16} /><span>The GST input credit stays on the {n0(w.sold)} packs sold{w.given ? `; only the ${n0(w.given)} donated packs reverse theirs (${inr2(w.itcLost)})` : ""}.</span></li>
          {!w.leftover && <li><Icon name="recycle" size={16} /><span>No disposal or EPR to pay: every pack went somewhere.</span></li>}
        </ul>
      </section>
      <p className="t-caption subtle">Worked out from Munchly's cost sheet and the platform's rules, as the Valuer prices every exit.</p>
    </div>;
  }
  function MoneyA() {
    const s = useS(); const app = useApp(); const [open, setOpen] = React.useState(false); const w = X.working(s); const phone = app.bp === "phone";
    return <div className="stack tight" style={{ gap: 4 }}>
      <Money value={w.net} size={phone ? "s" : "m"} roll style={{ color: "var(--primary-text)" }} />
      <span className="t-footnote subtle">{label(w, s)}</span>
      <button type="button" className="sw-note" aria-haspopup="dialog" onClick={() => setOpen(true)}><Icon name="scale" size={15} stroke={2.1} /><span><b>{fmt.inr(w.swing)} better</b> than destroying it</span><span className="sw-how">How it adds up</span></button>
      <Sheet open={open} onClose={() => setOpen(false)} title="How the swing adds up" side={phone ? "bottom" : "side"} detent="large"><Working w={w} /></Sheet>
    </div>;
  }
  K.TrackerCard = props => <Orig {...props} money={props.money ? <MoneyA /> : props.money} />;
  window.SC195.label = label;
})();

// Smart-Clearance design system v3 · product patterns shared by the demo and the app:
// the live tracker card, batch rows, the channel table, the split bar, the money panel, document cards
(function () {
  const { useState, useMemo, Fragment } = React;
  const { motion, AnimatePresence } = Motion;
  const K = window.SC3; const { cx, Icon, Badge, Button, Card, Product, useApp, Money, DaysNum, GateChips, Countdown, SellBar, Tracker, VTracker, Aura, Roll, Avatar, Sheet } = K;
  const M = window.SC3_MONEY; const fmt = M.fmt;
  const D = () => window.SC3_DATA;

  // word joiners keep a range whole and a no-break space keeps the date whole, so a narrow stop wraps only at the first space
  const STAGE_TIMES = { connect: "once", detect: "09:00", verify: "09:20", value: "09:21", decide: "09:22", approve: "09:40", execute: "day 0⁠–⁠14", settle: "day 3⁠–⁠7", report: "after 29 Oct" };
  const STATUS = {
    "at-risk": { tone: "red", label: "At risk" }, gated: { tone: "amber", label: "Gated · selling through" }, safe: { tone: "green", label: "Safe" },
    executing: { tone: "green", label: "In motion" }, routed: { tone: "green", label: "Routed" }, settled: { tone: "blue", label: "Settled" }, cleared: { tone: "green", label: "Cleared" },
    watching: { label: "Watching" }, routing: { tone: "green", label: "Routing" }, awaiting: { tone: "amber", label: "Awaiting approval" }, dispatched: { tone: "blue", label: "Dispatched" },
  };
  function StatusBadge({ status, live }) { const s = STATUS[status] || { label: status }; return <Badge tone={s.tone} dot live={live}>{s.label}</Badge>; }

  // on a phone the nine stops fold into one row: where the batch is now, and a sheet with every stop and its time
  function TrackerCompact({ done, current, label = "Where the batch is" }) {
    const [open, setOpen] = useState(false); const d = D();
    const stages = d.STAGES.map(s => ({ id: s.id, title: s.title, human: s.human, time: STAGE_TIMES[s.id], text: s.who }));
    const now = current >= 0 ? stages[current] : null;
    return <>
      <button type="button" className={cx("tk-compact", now && now.human && "human")} onClick={() => setOpen(true)} aria-label={`${label}: ${now ? now.title + ", stage " + (current + 1) + " of 9" : "all nine stages done"}. Show every stage`}>
        <span className="tk-seg" aria-hidden="true">{stages.map((s, i) => <i key={s.id} className={cx(i < done && "done", i === current && "now", s.human && "human")} />)}</span>
        <span className="tk-label"><b>{now ? now.title : "Cleared"}</b><span>{now ? `${current + 1} of 9 · ${now.time}` : "9 of 9 · done"}</span></span>
        <Icon name="chevron-right" size={18} className="subtle" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label} detent="medium"><VTracker items={stages} done={done} current={current} /></Sheet>
    </>;
  }

  // the hero: one batch tracked like an order
  function TrackerCard({ view, done = 2, current = 2, eta, etaTone, primary, secondary, money, line, agentLive, onStop, style }) {
    const app = useApp(); const phone = app.bp === "phone";
    const d = D(); const stages = d.STAGES.map(s => ({ id: s.id, title: s.title, human: s.human }));
    const a = view.assess; const sku = view.skuObj;
    return <div className="bezel" style={style}><div className="card raised" style={{ padding: phone ? 18 : 26, overflow: "hidden" }}>
      <div className="row between wrap" style={{ gap: 8 }}>
        <div className="row tight wrap"><StatusBadge status={view.phase || a.status} live={view.phase ? view.phase === "executing" : a.status === "at-risk"} /><span className="mono subtle t-footnote">{view.id}</span></div>
        <span className="row tight subtle t-footnote"><Icon name="map-pin" size={15} />{view.dist.name} · {view.dist.city}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr) 92px" : "minmax(0,1fr) 168px", gap: phone ? 12 : 20, alignItems: "center", marginTop: phone ? 10 : 6 }}>
        <div style={{ minWidth: 0 }}>
          <div className="t-headline" style={{ fontSize: phone ? 17 : 19 }}>{sku.brand} {sku.name}</div>
          <div className="row base" style={{ gap: phone ? 10 : 14, marginTop: phone ? 6 : 10, flexWrap: "wrap" }}>
            <DaysNum days={view.daysLeft} life={sku.lifeDays} size={phone ? "l" : "xl"} style={{ color: a.status === "at-risk" && !view.phase ? "var(--red-text)" : "var(--fg)" }} />
            <span className="stack tight" style={{ gap: 2 }}><span className="t-callout strong">days left</span><span className="t-footnote subtle">best before {fmt.date(view.bestBefore)}</span></span>
          </div>
        </div>
        <Product name={sku.img} size={phone ? 92 : 168} float alt={sku.name} />
      </div>
      <div className="row wrap" style={{ gap: phone ? 10 : 18, marginTop: phone ? 12 : 16, alignItems: "flex-end" }}>
        {money || <div className="stack tight" style={{ gap: 2 }}><Money value={-d.PLAN.writeOff.total} size={phone ? "s" : "m"} style={{ color: "var(--red-text)" }} /><span className="t-footnote subtle">if destroyed · {fmt.num(a.atRisk)} units at risk</span></div>}
        <div className="grow t-subhead muted" style={{ minWidth: 220, maxWidth: 520 }}>{line || `Blocked from Blinkit, Zepto and Instamart. ${fmt.num(a.atRisk)} of ${fmt.num(view.units)} units will not sell by ${fmt.date(view.bestBefore).replace(/ \d{4}$/, "")}.`}</div>
      </div>
      <div style={{ marginTop: phone ? 14 : 22 }}>
        {phone ? <TrackerCompact done={done} current={current} /> : <Tracker stages={stages} done={done} current={current} times={STAGE_TIMES} onStop={onStop} />}
      </div>
      <div className="row between wrap" style={{ marginTop: phone ? 16 : 20, gap: 10 }}>
        <div className="row tight wrap">
          {eta && <Badge tone={etaTone || "green"} icon="clock">{eta}</Badge>}
          {agentLive && <span className="row tight t-footnote muted"><Aura on className="icontile soft" style={{ width: 24, height: 24, borderRadius: 8 }}><Icon name="sparkles" size={13} /></Aura>{agentLive}</span>}
        </div>
        <div className="row tight">{secondary}{primary}</div>
      </div>
    </div></div>;
  }

  // a batch as a row in the watchlist; list and map share the selection
  // a gated batch that sells through, as the watchlist draws it (SC-83, option C): the days its packs take to sell at
  // today's rate against the days retailers still take it (money.js's usable days), and how many days that leaves
  function sellThrough(view) {
    const a = view.assess;
    if (view.phase || a.status !== "gated" || a.atRisk > 0) return null;
    const sell = Math.ceil(view.units / view.sellPerDay); const spare = a.usableDays - sell;
    return { sell, usable: a.usableDays, words: spare > 0 ? `Sells out ${spare} ${spare === 1 ? "day" : "days"} before retailers stop` : "Sells out the day retailers stop" };
  }
  function BatchRow({ view, onOpen, selected, compact }) {
    const a = view.assess; const sku = view.skuObj; const phase = view.phase; const st = sellThrough(view);
    return <button type="button" className="list-row batchrow" onClick={onOpen} aria-current={selected ? "true" : undefined} style={{ background: selected ? "var(--fill)" : undefined }}>
      <Product name={sku.img} size={compact ? 46 : 54} alt="" />
      <span className="br-main">
        <span className="br-line"><span className="lr-title br-name">{sku.name}</span><StatusBadge status={phase || a.status} live={phase === "executing" || (!phase && a.status === "at-risk")} /></span>
        <span className="lr-sub br-name">{view.dist.name} · {view.dist.city}{!compact && <span className="mono br-id"> · {view.id}</span>}</span>
        <span className="br-bar">{st ? <SellBar days={view.daysLeft} sell={st.sell} usable={st.usable} /> : <Countdown days={view.daysLeft} life={sku.lifeDays} status={phase ? "" : a.status} />}<span className="t-caption subtle tnum">{view.daysLeft} days left</span>{st ? <span className="t-caption br-ok tnum">{st.words}</span> : a.atRisk > 0 && !phase && <span className="t-caption neg strong tnum">{fmt.num(a.atRisk)} at risk</span>}</span>
      </span>
      {!compact && <span className="not-phone br-gates"><GateChips gates={a.gates} size="sm" quiet={(phase || a.status) !== "at-risk"} /></span>}
      <Icon name="chevron-right" size={18} className="chev" />
    </button>;
  }

  // the Valuer's table (S2): ineligible channels greyed with the reason; a table view of the chart
  function ChannelTable({ rows, chosen = [] }) {
    const ordered = K.CH_ORDER.map(id => rows.find(r => r.id === id)).filter(Boolean);
    return <div className="table-wrap" tabIndex={0} role="region" aria-label="Channels compared"><table className="table">
      <thead><tr><th>Channel</th><th>Needs</th><th className="n">Price</th><th className="n">Net a unit</th><th className="n">Capacity</th><th>Clears in</th><th>GST credit</th></tr></thead>
      <tbody>{ordered.map(r => <tr key={r.id} className={cx(!r.eligible && "dim")}>
        <td><span className="row tight"><span style={{ width: 10, height: 10, borderRadius: 3, background: `var(--ch-${r.id})`, opacity: r.eligible ? 1 : 0.35 }} /><b style={{ fontWeight: chosen.includes(r.id) ? 650 : 500 }}>{r.name}</b>{chosen.includes(r.id) && <Badge size="sm" tone="green">in plan</Badge>}</span>{!r.eligible && <div className="t-caption neg" style={{ marginTop: 2 }}>{r.reason}</div>}</td>
        <td className="muted">{r.need}</td>
        <td className="n">{r.price ? `₹${r.price.toFixed(2)}` : "₹0"}<span className="subtle t-caption"> {r.pricePctLabel !== "—" ? r.pricePctLabel : ""}</span></td>
        <td className={cx("n", r.net < 0 ? "neg" : "")} style={{ fontWeight: 600 }}>{(r.net < 0 ? "−₹" : "₹") + Math.abs(r.net).toFixed(2)}</td>
        <td className="n">{r.capacity === Infinity ? "unlimited" : fmt.num(r.capacity)}</td>
        <td className="muted">{r.clears}</td>
        <td>{r.itc === "retained" ? <Badge size="sm" tone="green">retained</Badge> : <Badge size="sm" tone="red">reversed{r.indicative ? " · indicative" : ""}</Badge>}</td>
      </tr>)}</tbody>
    </table></div>;
  }

  // the recommended split as one bar of the at-risk units, filled in channel order
  function SplitBar({ plan, sku }) {
    return <div className="stack snug">
      <div style={{ display: "flex", height: 44, borderRadius: 14, overflow: "hidden", gap: 3, background: "var(--surface)" }}>
        {plan.lines.map(l => <motion.div key={l.id} initial={{ flexGrow: 0.001 }} animate={{ flexGrow: l.units }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} style={{ flexBasis: 0, background: `var(--ch-${l.id})`, color: "#fff", display: "flex", alignItems: "center", padding: "0 12px", fontWeight: 650, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden" }}>{fmt.num(l.units)} · {l.short}</motion.div>)}
      </div>
      <div className="row between t-caption subtle"><span>0</span><span className="tnum">{fmt.num(plan.units)} units at risk</span></div>
    </div>;
  }

  // the money panel, set out the way a challan would be: what destroying does to the P&L, what the split recovers
  // and its P&L effect. The book cost of the stock appears once on each side, so the swing does not count it twice.
  // actual: the result after negotiation ({ net, swing, pnl }), when there is one
  function MoneyPanel({ plan, actual, compact }) {
    const wo = plan.writeOff; const sku = window.SC3_DATA.SKUS.chips;
    const net = actual ? actual.net : plan.net, pnl = actual ? actual.pnl : plan.pnl, swing = actual ? actual.swing : plan.swing;
    const row = (k, n, v, tone) => <div key={k} className="row between"><span><span>{k}</span> <span className="subtle t-caption">{n}</span></span><span className={cx("tnum", tone)}>{fmt.inr(v)}</span></div>;
    return <div className="stack" style={{ gap: 12 }}><div style={{ display: "grid", gap: 12, gridTemplateColumns: compact ? "minmax(0,1fr)" : "repeat(auto-fit, minmax(280px, 1fr))" }}>
      <div className="card pad stack snug">
        <div className="card-head"><span className="card-title">If destroyed</span><Badge tone="red" icon="trash-2">write-off</Badge></div>
        <div className="stack tight t-subhead">
          {row("Stock at cost", `${fmt.num(plan.units)} × ₹${sku.cost}`, -wo.stock, "neg")}
          {row("GST credit reversed", `s.17(5)(h) · ₹${wo.itcPerUnit.toFixed(2)} a unit`, -wo.itc, "neg")}
          {row("Disposal and transport", "₹1.50 a unit, indicative", -wo.disposal, "neg")}
          {row("EPR and waste liability", `${fmt.kg(wo.kg)} × ₹6, indicative`, -wo.epr, "neg")}
          <div className="hairline" style={{ margin: "4px 0" }} />
          <div className="row between"><b>Effect on the P&amp;L</b><Money value={-wo.total} size="s" style={{ color: "var(--red-text)" }} /></div>
        </div>
      </div>
      <div className="card pad stack snug">
        <div className="card-head"><span className="card-title">If routed</span><Badge tone="green" icon="route">recommended</Badge></div>
        <div className="stack tight t-subhead">
          {plan.lines.map(l => row(`${fmt.num(l.units)} → ${l.short}`, l.packPrice ? `at ₹${l.price} effective, ${fmt.num(l.charged)} charged at ₹${l.packPrice.toFixed(2)}` : `at ₹${l.price}${actual && l.id === "expiresoon" ? `, sold at ₹${(actual.esActual / l.units).toFixed(2)}` : ""}`, actual && l.id === "expiresoon" ? actual.esActual : l.gross, "pos"))}
          {row("Van delivery and listing fee", "", -plan.costs, "neg")}
          <div className="row between"><b>Net recovered <span className="subtle t-caption" style={{ fontWeight: 500 }}>{Math.round(net / (plan.units * sku.mrp) * 100)}% of MRP</span></b><Money value={net} size="s" style={{ color: "var(--primary-text)" }} /></div>
          {row("Book cost of the stock sold", `${fmt.num(plan.units)} × ₹${sku.cost}`, -plan.bookCost, "neg")}
          <div className="hairline" style={{ margin: "4px 0" }} />
          <div className="row between"><b>Effect on the P&amp;L</b><span className={cx("tnum strong", pnl < 0 ? "neg" : "pos")}>{fmt.signed(pnl)}</span></div>
        </div>
      </div>
    </div>
      <div className="card row wrap" style={{ padding: "14px 18px", gap: 12 }}><Money value={swing} size="s" style={{ color: "var(--primary-text)" }} /><span className="grow t-subhead muted" style={{ minWidth: 220 }}><b style={{ color: "var(--fg)" }}>better than destroying it{actual ? ", after the haggle" : ""}:</b> {fmt.signed(pnl)} instead of {fmt.inr(-wo.total)}. In cash, the {fmt.inr(net)} recovered plus {fmt.inr(plan.cashAvoided)} of credit reversal, disposal and EPR never spent.</span></div>
    </div>;
  }

  // a document in the pack: generated by Munchly, drafted for the distributor to issue, awaiting another's (the agency's
  // destruction certificate, SC-139), or not required
  function DocCard({ doc, onOpen }) {
    const ready = doc.status === "generated" || doc.status === "drafted";
    const icon = { invoice: "receipt", eway: "truck", support: "hand-coins", itc: "badge-check", fssai: "clipboard-check" }[doc.id] || "file-check";
    return <button type="button" className="card interactive" onClick={onOpen} style={{ padding: 18, textAlign: "left", display: "grid", gap: 10 }}>
      <div className="row between"><span className={cx("icontile", ready ? "" : "soft")}><Icon name={icon} size={17} stroke={2} /></span><Badge size="sm" tone={doc.status === "generated" ? "green" : doc.status === "awaiting" ? "amber" : undefined}>{doc.status}</Badge></div>
      <div><div className="strong">{doc.type}</div><div className="mono subtle t-caption">{doc.no}{doc.owner ? " · " + doc.owner : ""}</div></div>
      {doc.amount ? <Money value={doc.amount} size="s" /> : <span className="t-footnote muted">{doc.note || (ready ? "Attached" : "Nothing to file")}</span>}
    </button>;
  }

  Object.assign(window.SC3, { STAGE_TIMES, StatusBadge, TrackerCompact, TrackerCard, BatchRow, ChannelTable, SplitBar, MoneyPanel, DocCard });
})();

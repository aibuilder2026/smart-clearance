// Smart-Clearance design system v3 · product patterns shared by the demo and the app:
// the live tracker card, batch rows, the channel table, the split bar, the money panel, document cards, and the agents
// at work behind the sign-ins
(function () {
  const { useState, useMemo, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3; const { cx, Icon, Mark, Badge, Button, Card, Product, useApp, Money, DaysNum, GateChips, Countdown, SellBar, Tracker, VTracker, Aura, Roll, Avatar, Sheet } = K;
  const M = window.SC3_MONEY; const fmt = M.fmt;
  const D = () => window.SC3_DATA;

  // word joiners keep a range whole and a no-break space keeps the date whole, so a narrow stop wraps only at the first space
  const STAGE_TIMES = { connect: "once", detect: "09:00", verify: "09:20", value: "09:21", decide: "09:22", approve: "09:40", execute: "day 0⁠–⁠14", settle: "day 3⁠–⁠7", report: "after 29 Oct" };
  // the stops' times on the journey the store holds (SC-168: the Mango Drink's own, the slow chips'), else the story's
  const timesNow = () => { const d = D(); return (d.story && d.story().times) || STAGE_TIMES; };
  const STATUS = {
    "at-risk": { tone: "red", label: "At risk" }, gated: { tone: "amber", label: "Gated · selling through" }, safe: { tone: "green", label: "Safe" },
    executing: { tone: "green", label: "In motion" }, routed: { tone: "green", label: "Routed" }, settled: { tone: "blue", label: "Settled" }, cleared: { tone: "green", label: "Cleared" },
    watching: { label: "Watching" }, routing: { tone: "green", label: "Routing" }, awaiting: { tone: "amber", label: "Awaiting approval" }, dispatched: { tone: "blue", label: "Dispatched" },
  };
  function StatusBadge({ status, live }) { const s = STATUS[status] || { label: status }; return <Badge tone={s.tone} dot live={live}>{s.label}</Badge>; }

  // on a phone the nine stops fold into one row: where the batch is now, and a sheet with every stop and its time
  function TrackerCompact({ done, current, label = "Where the batch is" }) {
    const [open, setOpen] = useState(false); const d = D();
    const times = timesNow(), stages = d.STAGES.map(s => ({ id: s.id, title: s.title, human: s.human, time: times[s.id], text: s.who }));
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
        {money || <div className="stack tight" style={{ gap: 2 }}><Money value={-(d.story ? d.story().plan : d.PLAN).writeOff.total} size={phone ? "s" : "m"} style={{ color: "var(--red-text)" }} /><span className="t-footnote subtle">if destroyed · {fmt.num(a.atRisk)} units at risk</span></div>}
        <div className="grow t-subhead muted" style={{ minWidth: 220, maxWidth: 520 }}>{line || `Blocked from Blinkit, Zepto and Instamart. ${fmt.num(a.atRisk)} of ${fmt.num(view.units)} units will not sell by ${fmt.date(view.bestBefore).replace(/ \d{4}$/, "")}.`}</div>
      </div>
      <div style={{ marginTop: phone ? 14 : 22 }}>
        {phone ? <TrackerCompact done={done} current={current} /> : <Tracker stages={stages} done={done} current={current} times={timesNow()} onStop={onStop} />}
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

  // a document in the pack: generated by Munchly, drafted for the distributor to issue (issued, once he has: SC-148),
  // awaiting another's (the agency's destruction certificate, SC-139), or not required
  function DocCard({ doc, onOpen }) {
    const ready = doc.status === "generated" || doc.status === "drafted" || doc.status === "issued";
    const icon = { invoice: "receipt", eway: "truck", support: "hand-coins", itc: "badge-check", fssai: "clipboard-check" }[doc.id] || "file-check";
    return <button type="button" className="card interactive" onClick={onOpen} style={{ padding: 18, textAlign: "left", display: "grid", gap: 10 }}>
      <div className="row between"><span className={cx("icontile", ready ? "" : "soft")}><Icon name={icon} size={17} stroke={2} /></span><Badge size="sm" tone={doc.status === "generated" || doc.status === "issued" ? "green" : doc.status === "awaiting" ? "amber" : undefined}>{doc.status}</Badge></div>
      <div><div className="strong">{doc.type}</div><div className="mono subtle t-caption">{doc.no}{doc.owner ? " · " + doc.owner : ""}</div></div>
      {doc.amount ? <Money value={doc.amount} size="s" /> : <span className="t-footnote muted">{doc.note || (ready ? "Attached" : "Nothing to file")}</span>}
    </button>;
  }

  /* ---------- the agents at work: the sign-ins' stage (SC-195, round 2, option A, The agent mesh) ---------- */
  // ThreeUI's constellation field (adapted, as SC-30's option 1 did; MIT, see THIRD_PARTY_NOTICES.md beside this file)
  // drifts behind the whole sign-in, under the card's glass. Eleven of its nodes are named: the platform's ten agents and
  // the one person, on an orbit in the stage, in the order they work a batch through the nine stops. As the batch walks,
  // each lights in turn and the handoff from the one before draws; at Approve the thread turns amber, and at Execute
  // sparks run from the yes to the three agents that work the exits at once. It holds on the result, then walks again.
  // It loops, so it has Pause and Play (WCAG 2.2.2), remembered in the browser; under reduced motion it is drawn at rest,
  // every agent lit. It is live: the field gives way to the pointer and draws its links to it, a click or a tap sends a
  // ripple through it (and lets go of an agent), and each agent, pressed, holds the walk at its stop and says what it does.
  // No client's data, so a live workspace shows it before anyone signs in. On a phone or a tablet it is a band over the card.
  const AG_STOPS = [
    { id: "connect", t: "Connect" }, { id: "detect", t: "Detect" }, { id: "verify", t: "Verify" }, { id: "value", t: "Value" },
    { id: "decide", t: "Decide" }, { id: "approve", t: "Approve", human: true }, { id: "execute", t: "Execute" }, { id: "settle", t: "Settle" },
    { id: "report", t: "Report" },
  ];
  const AG_CREW = [
    { id: "data", name: "Data", icon: "database", stop: 0, did: "Loaded the stock export and mapped its columns", call: "dms.map → 8 fields" },
    { id: "watcher", name: "Watcher", icon: "eye", stop: 1, did: "Flagged a batch the quick-commerce gates will refuse", call: "gates.check → blinkit · zepto · instamart" },
    { id: "vision", name: "Vision", icon: "scan-line", stop: 2, did: "Read the carton's label from one photo", call: "gemini.vision.read_label → match" },
    { id: "valuer", name: "Valuer", icon: "scale", stop: 3, did: "Priced every exit, the bin included", call: "price.exits → 5 priced" },
    { id: "router", name: "Router", icon: "route", stop: 4, did: "Split the batch under each exit's caps", call: "split.fill → under the caps" },
    { id: "you", name: "You", icon: "hand", stop: 5, human: true, did: "One yes, with the money on screen", call: "plan.approve → one tap" },
    { id: "outreach", name: "Outreach", icon: "send", stop: 6, did: "Offered the kiranas a scheme in Hindi", call: "fcm.send → kiranas · Hindi" },
    { id: "lister", name: "Lister", icon: "store", stop: 6, did: "Listed the lot outside the client's territory", call: "expiresoon.list → hidden in territory" },
    { id: "negotiator", name: "Negotiator", icon: "gavel", stop: 6, did: "Countered a bid, never below the reserve", call: "bid.counter → above reserve" },
    { id: "paperwork", name: "Paperwork", icon: "file-text", stop: 7, did: "Drafted the invoice, credit note and GST memo", call: "invoice.draft · credit_note.issue" },
    { id: "impact", name: "Impact", icon: "leaf", stop: 8, did: "Posted the ledger and the BRSR row", call: "ledger.post · brsr.row" },
  ];
  const AG_N = AG_STOPS.length;
  const agAt = k => AG_CREW.filter(c => c.stop === k);
  const agNames = k => { const c = agAt(k).map(x => x.name); return c.length > 1 ? c.slice(0, -1).join(", ") + " and " + c[c.length - 1] : c[0]; };
  // the walk: -1 before it sets off, 0 to 8 at a stop, 9 when it is done. 420 ms a stop, 800 on the yes and 900 while the
  // exits work (4.64 s), 600 ms before it sets off, and 2.8 s on the result before it walks again; the handoffs drawn
  // fade over 500 ms as it starts again
  const AG_T = { step: 420, yes: 800, exec: 900, start: 600, hold: 2800, fade: 500 };
  const agStays = k => (AG_STOPS[k].human ? AG_T.yes : AG_STOPS[k].id === "execute" ? AG_T.exec : AG_T.step);
  const AG_KEY = "sc3-agents";
  function useAgentWalk() {
    const reduce = !!useReducedMotion();
    const [paused, setPausedState] = useState(() => { try { return localStorage.getItem(AG_KEY) === "paused"; } catch (e) { return false; } });
    const [held, setHeld] = useState(null);
    const [k, setK] = useState(reduce ? AG_N : -1);
    const moving = !reduce && !paused && !held;
    useEffect(() => {
      if (reduce) { if (!held) setK(AG_N); return; }
      if (!moving) return;
      const t = setTimeout(() => setK(k >= AG_N ? -1 : k + 1), k < 0 ? AG_T.start : k >= AG_N ? AG_T.hold : agStays(k));
      return () => clearTimeout(t);
    }, [k, moving, reduce, held]);
    const setPaused = v => { setPausedState(v); try { localStorage.setItem(AG_KEY, v ? "paused" : "playing"); } catch (e) {} };
    // an agent pressed holds the walk at its stop; pressed again, or Play, or a click in the field lets it go on
    const pick = c => { if (held && held.id === c.id) { setHeld(null); return; } setHeld(c); setK(c.stop); };
    const release = () => setHeld(null);
    const toggle = () => { if (held) { setHeld(null); if (paused) setPaused(false); return; } setPaused(!paused); };
    const state = c => (held ? (c.id === held.id ? "now" : c.stop < held.stop ? "done" : "later") : c.stop < k || k >= AG_N ? "done" : c.stop === k ? "now" : "later");
    return { k, reduce, paused, held, moving, playing: !held && k >= 0 && k < AG_N, done: k >= AG_N, state, pick, release, toggle };
  }

  // where the named nodes sit in a box: on an orbit round its middle, in the order they work, from the upper left
  // clockwise, with a gap at the left between the last and the first
  function agOrbit(w, h, band) {
    const rx = band ? w * 0.38 : Math.min(w * 0.36, w / 2 - 124), ry = band ? h * 0.36 : Math.min(h * 0.36, h / 2 - 44);
    return AG_CREW.map((c, i) => { const a = ((band ? 196 : 200) + i * 29.5) * Math.PI / 180, ox = Math.cos(a), oy = Math.sin(a); return { c, x: w / 2 + rx * ox, y: h / 2 + ry * oy, ox, oy }; });
  }
  // the handoffs: each agent to the next, the yes to all three of the exits, and all three to Paperwork
  function agThreads(stars) {
    const at = id => stars.find(s => s.c.id === id), out = [];
    const order = ["data", "watcher", "vision", "valuer", "router", "you"];
    for (let i = 1; i < order.length; i++) out.push({ a: at(order[i - 1]), b: at(order[i]), stop: i });
    ["outreach", "lister", "negotiator"].forEach(id => { out.push({ a: at("you"), b: at(id), stop: 6, fan: true }); out.push({ a: at(id), b: at("paperwork"), stop: 7 }); });
    out.push({ a: at("paperwork"), b: at("impact"), stop: 8 });
    return out;
  }
  // the field's inks, as rgb, by day and by night (the agents' green and the yes's amber validated on the sign-in's ground)
  const AG_INK = {
    light: { ink: "13, 28, 21", lit: "22, 122, 82", amber: "211, 154, 18", hole: "#f2f6f3" },
    dark: { ink: "214, 255, 232", lit: "60, 203, 138", amber: "247, 192, 74", hole: "#0b110e" },
  };
  const agSeeded = seed => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  // the ambient field, seeded so every visit draws the same
  function agField(w, h, band) {
    const rnd = agSeeded(195), n = band ? 26 : Math.min(110, Math.round(w * h / 15000)), out = [];
    while (out.length < n) { const vx = (rnd() - 0.5) * 0.28, vy = (rnd() - 0.5) * 0.28; out.push({ x: rnd() * w, y: rnd() * h, vx, vy, bx: vx, by: vy, r: 1.1 + rnd() * 1.3 }); }
    return out;
  }
  // one frame of the field: the drift (only while the walk moves), the pointer pushing nodes aside, a ripple's front
  // pushing them out; nodes bounce off the edges. dt is in 60ths of a second
  function agStep(f, dt) {
    const go = f.moving ? 1 : 0, P = f.band ? 60 : 100;
    f.nodes.forEach(n => {
      if (f.pointer && !f.reduce) { const dx = n.x - f.pointer.x, dy = n.y - f.pointer.y, d = Math.hypot(dx, dy); if (d < P && d > 0.5) { const s = (1 - d / P) * 0.2 * dt; n.vx += (dx / d) * s; n.vy += (dy / d) * s; } }
      f.ripples.forEach(r => { const dx = n.x - r.x, dy = n.y - r.y, d = Math.hypot(dx, dy), off = Math.abs(d - r.r); if (off < 26 && d > 0.5) { const s = (1 - off / 26) * 1.1 * (1 - r.t) * dt; n.vx += (dx / d) * s; n.vy += (dy / d) * s; } });
      n.vx += (n.bx * go - n.vx) * Math.min(1, 0.045 * dt); n.vy += (n.by * go - n.vy) * Math.min(1, 0.045 * dt);
      n.x += n.vx * dt; n.y += n.vy * dt;
      if (n.x < 0 || n.x > f.w) { n.x = Math.max(0, Math.min(f.w, n.x)); n.vx *= -1; n.bx = Math.abs(n.bx) * (n.x <= 0 ? 1 : -1); }
      if (n.y < 0 || n.y > f.h) { n.y = Math.max(0, Math.min(f.h, n.y)); n.vy *= -1; n.by = Math.abs(n.by) * (n.y <= 0 ? 1 : -1); }
    });
    // how much is still moving off its drift, so the frames can stop once it has settled
    return f.nodes.reduce((e, n) => e + Math.abs(n.vx - n.bx * go) + Math.abs(n.vy - n.by * go), 0);
  }
  // one frame drawn: the field and its links, the links to the pointer, the handoffs as far as the batch has walked (the
  // one being made drawing along its length), the sparks, the ripples, and the named nodes
  function agDraw(ctx, f, now) {
    const I = AG_INK[f.dark ? "dark" : "light"], band = f.band, stars = f.stars, all = f.nodes.concat(stars), link = band ? 70 : 120;
    ctx.clearRect(0, 0, f.w, f.h);
    ctx.lineWidth = 1;
    for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
      const d = Math.hypot(all[a].x - all[b].x, all[a].y - all[b].y); if (d >= link) continue;
      ctx.strokeStyle = `rgba(${I.ink}, ${(0.05 + (1 - d / link) * (f.dark ? 0.16 : 0.14)).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(all[a].x, all[a].y); ctx.lineTo(all[b].x, all[b].y); ctx.stroke();
    }
    ctx.fillStyle = `rgba(${I.ink}, ${f.dark ? 0.34 : 0.26})`;
    f.nodes.forEach(n => { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); });
    if (f.pointer) {
      const P = band ? 110 : 190; ctx.lineWidth = 1.2;
      all.forEach(n => { const d = Math.hypot(n.x - f.pointer.x, n.y - f.pointer.y); if (d >= P) return; ctx.strokeStyle = `rgba(${I.lit}, ${((1 - d / P) * 0.75).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(f.pointer.x, f.pointer.y); ctx.lineTo(n.x, n.y); ctx.stroke(); });
      // the pointer joins the field as a node of its own
      ctx.fillStyle = `rgba(${I.lit}, 0.14)`; ctx.beginPath(); ctx.arc(f.pointer.x, f.pointer.y, band ? 9 : 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgb(${I.lit})`; ctx.beginPath(); ctx.arc(f.pointer.x, f.pointer.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (!stars.length) return;
    const k = f.done ? AG_N : f.k, since = now - f.stepAt;
    const fading = k < 0 && now - f.resetAt < AG_T.fade ? 1 - (now - f.resetAt) / AG_T.fade : 0;
    const p = f.playing ? Math.min(1, since / (f.k === 6 ? 700 : 340)) : 1;
    ctx.lineCap = "round";
    agThreads(stars).forEach(t => {
      const shown = fading ? true : f.held ? t.stop < f.held.stop || (t.stop === f.held.stop && t.b.c.id === f.held.id) : t.stop <= k;
      if (!shown) return;
      const along = !fading && t.stop === k && f.playing ? p : 1;
      ctx.globalAlpha = fading || 1; ctx.lineWidth = band ? 1.6 : 2.2; ctx.strokeStyle = `rgb(${t.a.c.human || t.b.c.human ? I.amber : I.lit})`;
      ctx.beginPath(); ctx.moveTo(t.a.x, t.a.y); ctx.lineTo(t.a.x + (t.b.x - t.a.x) * along, t.a.y + (t.b.y - t.a.y) * along); ctx.stroke();
      if (t.fan && t.stop === k && f.playing && !fading) for (let j = 0; j < 3; j++) {
        const u = (since / 520 + j / 3) % 1; ctx.fillStyle = `rgb(${I.lit})`;
        ctx.beginPath(); ctx.arc(t.a.x + (t.b.x - t.a.x) * u, t.a.y + (t.b.y - t.a.y) * u, band ? 2 : 2.8, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    f.ripples.forEach(r => { ctx.lineWidth = 2; ctx.strokeStyle = `rgba(${I.lit}, ${(0.55 * (1 - r.t)).toFixed(3)})`; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke(); });
    stars.forEach(n => {
      const st = f.state(n.c), col = n.c.human ? I.amber : I.lit, rad = (band ? 4 : 5.5) + (st === "now" ? 1 : 0);
      if (st === "now" && f.moving) { const u = (since % 1200) / 1200; ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(${col}, ${(0.6 * (1 - u)).toFixed(3)})`; ctx.beginPath(); ctx.arc(n.x, n.y, rad + 2 + u * (band ? 10 : 14), 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(n.x, n.y, rad, 0, Math.PI * 2);
      if (st === "later") { ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(${I.ink}, ${f.dark ? 0.45 : 0.35})`; ctx.fillStyle = I.hole; ctx.fill(); ctx.stroke(); }
      else { ctx.fillStyle = `rgb(${col})`; ctx.fill(); }
    });
  }

  // the size of an element, as it resizes
  function useBox(ref, dep) {
    const [s, setS] = useState(null);
    useEffect(() => { const el = ref.current; if (!el) return; const f = () => setS({ w: el.clientWidth, h: el.clientHeight }); f(); const o = new ResizeObserver(f); o.observe(el); return () => o.disconnect(); }, [dep]);
    return s;
  }
  // the canvas: over the whole sign-in on a desktop (the named nodes where the stage's orbit is), or the band's own box
  function AgentField({ w, stars, band, orbit, height }) {
    const box = useRef(null), cv = useRef(null), size = useBox(box);
    const f = useRef({ nodes: [], ripples: [], pointer: null, stepAt: 0, resetAt: -1e9, raf: 0, last: 0, off: { x: 0, y: 0 } }).current;
    const prevK = useRef(w.k);
    if (prevK.current !== w.k) { if (w.k < 0 && prevK.current >= AG_N) f.resetAt = performance.now(); prevK.current = w.k; f.stepAt = performance.now(); }
    // where the orbit sits in the canvas (the band's canvas is the orbit)
    useEffect(() => {
      if (!size) return; f.nodes = agField(size.w, size.h, band);
      if (!band && orbit.current && box.current) { const a = orbit.current.getBoundingClientRect(), b = box.current.getBoundingClientRect(), z = scaleOf(); f.off = { x: (a.left - b.left) / z, y: (a.top - b.top) / z }; }
    }, [size && size.w, size && size.h, stars]);
    // a device preview scales the page (the guided demo): the screen's pixels are not the canvas's
    const scaleOf = () => { const el = box.current; return el && el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1; };
    const isDark = () => { const t = box.current && box.current.closest("[data-theme]"); return !!t && t.getAttribute("data-theme") === "dark"; };
    const frame = now => {
      const c = cv.current; if (!c || !size) { f.raf = 0; return; }
      const dt = f.last ? Math.min(3, (now - f.last) / (1000 / 60)) : 1; f.last = now;
      Object.assign(f, { w: size.w, h: size.h, band, k: w.k, done: w.done, playing: w.playing, held: w.held, moving: w.moving, reduce: w.reduce, state: w.state, dark: isDark(), stars: stars.map(s => ({ ...s, x: s.x + f.off.x, y: s.y + f.off.y })) });
      f.ripples = f.ripples.map(r => ({ ...r, t: (now - r.born) / 900, r: 6 + (band ? 150 : 260) * (1 - Math.pow(1 - Math.min(1, (now - r.born) / 900), 3)) })).filter(r => r.t < 1);
      const energy = w.reduce ? 0 : agStep(f, dt);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (c.width !== Math.round(size.w * dpr) || c.height !== Math.round(size.h * dpr)) { c.width = Math.round(size.w * dpr); c.height = Math.round(size.h * dpr); }
      const ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); agDraw(ctx, f, now);
      // frames run while the walk moves, the pointer is in the field, a ripple spreads or the field is still settling
      const live = w.moving || f.pointer || f.ripples.length || energy > 0.05 || (w.k < 0 && now - f.resetAt < AG_T.fade);
      f.raf = live ? requestAnimationFrame(frame) : 0; if (!live) f.last = 0;
    };
    const kick = () => { if (!f.raf) f.raf = requestAnimationFrame(frame); };
    useEffect(() => { cancelAnimationFrame(f.raf); f.raf = 0; kick(); });
    useEffect(() => () => cancelAnimationFrame(f.raf), []);
    // a change of theme redraws the field, moving or not
    useEffect(() => { const o = new MutationObserver(kick); o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] }); const t = box.current && box.current.closest(".app"); if (t) o.observe(t, { attributes: true, attributeFilter: ["data-theme"] }); return () => o.disconnect(); }, []);
    const at = e => { const r = box.current.getBoundingClientRect(), z = scaleOf(); return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z }; };
    const down = useRef(null);
    const onMove = e => { f.pointer = at(e); kick(); };
    const onLeave = () => { f.pointer = null; kick(); };
    const onDown = e => { down.current = at(e); if (e.pointerType !== "mouse") { f.pointer = down.current; kick(); } };
    // a click or a tap: on a named node, that agent; anywhere else, a ripple, and the walk let go
    const onUp = e => {
      const p = at(e), d = down.current; down.current = null; if (e.pointerType !== "mouse") f.pointer = null;
      if (!d || Math.hypot(p.x - d.x, p.y - d.y) > 10) { kick(); return; }
      const hit = (f.stars || []).map(s => ({ s, d: Math.hypot(s.x - p.x, s.y - p.y) })).filter(x => x.d < (band ? 24 : 18)).sort((a, b) => a.d - b.d)[0];
      if (hit) w.pick(hit.s.c); else { if (!w.reduce) f.ripples.push({ x: p.x, y: p.y, born: performance.now(), t: 0, r: 6 }); w.release(); }
      kick();
    };
    return <div ref={box} className={cx("ag-field", band && "band")} style={height ? { height } : undefined} aria-hidden="true" onPointerMove={onMove} onPointerLeave={onLeave} onPointerCancel={onLeave} onPointerDown={onDown} onPointerUp={onUp}>
      <canvas ref={cv} className="ag-canvas" />
    </div>;
  }
  // what the batch is doing: before it sets off, at each stop, when it is done, or the agent the visitor picked
  function AgentCaption({ w, className }) {
    const s = w.held ? AG_STOPS[w.held.stop] : w.playing ? AG_STOPS[w.k] : null, h = w.held;
    return <div className={cx("ag-caption", s && s.human && "human", h && "held", className)} aria-hidden="true">
      {h ? <><span className="n">{h.stop + 1} of 9 · {s.t}</span><b>{h.name}</b><span className="did">{h.did}</span><code>{h.call}</code></>
        : w.k < 0 ? <><span className="n">A batch the gates will refuse</span><b>Ten agents and one person take it from here.</b></>
        : s ? <><span className="n">{w.k + 1} of 9 · {s.t}</span><b>{agNames(w.k)}</b><span className="did">{agAt(w.k).length > 1 ? "Work the exits at once: the kiranas, the marketplace, a bid" : agAt(w.k)[0].did}</span></>
        : <><span className="n">9 of 9 · Report</span><b>Sold, not binned.</b><span className="did">Ten agents worked the batch. One person said yes.</span></>}
    </div>;
  }
  // an agent's chip: its icon and name, lit once it has worked, wearing the aura while it works (in the band, the agent
  // at work is its tile on its node, the caption naming it)
  const AgentChip = ({ c }) => <><i><Icon name={c.icon} size={14} stroke={2.2} /></i>{c.name}</>;
  // Pause and Play: the walk loops, so it can be stopped (WCAG 2.2.2); held on an agent, Play lets it go on
  function AgentPlay({ w, compact }) {
    if (w.reduce) return null;
    const label = w.moving ? "Pause" : "Play", icon = w.moving ? "pause" : "play";
    return compact ? <button type="button" className="btn btn-ghost btn-sm btn-icon ag-play" aria-label={`${label} the agents`} onClick={w.toggle}><Icon name={icon} size={16} /></button>
      : <button type="button" className="btn btn-ghost btn-sm ag-play" aria-label={`${label} the agents`} onClick={w.toggle}><Icon name={icon} size={15} />{label}</button>;
  }
  // for a screen reader: the nine stops in words (the picture is hidden from it), and the agent picked
  const AgentWords = ({ w }) => <>
    <ol className="sr-only" aria-label="How Smart-Clearance's agents work a batch">{AG_STOPS.map((s, i) => <li key={s.id}>{s.t}: {agNames(i)}. {agAt(i).map(c => c.did).join(". ")}.</li>)}</ol>
    <p className="sr-only" role="status">{w.held ? `${w.held.name}, ${AG_STOPS[w.held.stop].t}: ${w.held.did}.` : ""}</p>
  </>;
  // the stage: on a desktop, the head, the orbit with its chips (one stop in a tab, arrows between them) and the caption
  // in its middle, and Pause; the field behind the whole sign-in. On a phone or a tablet, a band over the card
  function AgentStage({ children, band }) {
    const app = useApp(); const w = useAgentWalk(); const orbit = useRef(null);
    const isBand = band != null ? band : app.bp !== "desktop"; const size = useBox(orbit, isBand);
    const stars = useMemo(() => (size ? agOrbit(size.w, size.h, isBand) : []), [size && size.w, size && size.h, isBand]);
    const [rove, setRove] = useState(0); const chips = useRef([]);
    // on a desktop the stage and the field keep to the sign-in's visible height, pinned while a long card scrolls by
    const stage = useRef(null); const [height, setHeight] = useState(null);
    useEffect(() => { const host = stage.current && stage.current.parentElement; if (!host) return; const f = () => setHeight(host.clientHeight); f(); const o = new ResizeObserver(f); o.observe(host); return () => o.disconnect(); }, [isBand]);
    const key = e => {
      const n = AG_CREW.length, to = { ArrowRight: rove + 1, ArrowDown: rove + 1, ArrowLeft: rove - 1, ArrowUp: rove - 1, Home: 0, End: n - 1 }[e.key];
      if (e.key === "Escape" && w.held) { w.release(); return; }
      if (to == null) return; e.preventDefault(); const i = (to + n) % n; setRove(i); chips.current[i] && chips.current[i].focus();
    };
    const place = n => ({ left: n.x, top: n.y, transform: Math.abs(n.ox) < 0.2 ? (n.oy < 0 ? "translate(-50%, calc(-100% - 12px))" : "translate(-50%, 12px)") : n.ox < 0 ? "translate(calc(-100% - 12px), -50%)" : "translate(12px, -50%)" });
    if (isBand) return <div className="ag-band">
      <div className="ag-bandhead"><Mark size={22} still /><b>Ten agents. <span>One yes.</span></b><AgentPlay w={w} compact /></div>
      <div ref={orbit} className="ag-orbit band" aria-hidden="true">
        <AgentField w={w} stars={stars} band orbit={orbit} />
        {size && stars.map(n => { const st = w.state(n.c); return (st === "now" || (w.done && !w.held && n.c.human)) && <span key={n.c.id} className={cx("ag-tile", n.c.human && "human", st, st === "now" && !w.reduce && "aura")} style={{ left: n.x, top: n.y }}><Icon name={n.c.icon} size={13} stroke={2.2} /></span>; })}
      </div>
      <AgentCaption w={w} className="band" />
      <AgentWords w={w} />
    </div>;
    return <Fragment>
      <AgentField w={w} stars={stars} orbit={orbit} height={height} />
      <div ref={stage} className="ag-stage" style={height ? { height } : undefined}>
        <div className="ag-head">{children}</div>
        <div ref={orbit} className="ag-orbit">
          <div className="ag-crew" role="toolbar" aria-label="The agents, in the order they work" onKeyDown={key}>
            {size && stars.map((n, i) => { const st = w.state(n.c);
              return <button key={n.c.id} type="button" ref={el => (chips.current[i] = el)} tabIndex={i === rove ? 0 : -1} aria-pressed={!!w.held && w.held.id === n.c.id} className={cx("ag-chip", n.c.human && "human", st, st === "now" && !w.reduce && "aura")} style={place(n)} onFocus={() => setRove(i)} onClick={() => w.pick(n.c)}>
                <AgentChip c={n.c} /><span className="sr-only">, {AG_STOPS[n.c.stop].t}</span>
              </button>; })}
          </div>
          <AgentCaption w={w} className="centre" />
        </div>
        <div className="ag-foot"><AgentPlay w={w} /><span className="ag-hint">Pick an agent to see its work</span></div>
        <AgentWords w={w} />
      </div>
    </Fragment>;
  }

  Object.assign(window.SC3, { STAGE_TIMES, StatusBadge, TrackerCompact, TrackerCard, BatchRow, ChannelTable, SplitBar, MoneyPanel, DocCard, AgentStage });
})();

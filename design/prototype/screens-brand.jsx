// Smart-Clearance prototype · brand-side screens: sign in, shelf-life board, Route Room, Execution, Paperwork, Ledger, Inbox
(function () {
  const { useState, useEffect, useMemo } = React;
  const { motion, AnimatePresence, LayoutGroup, useReducedMotion } = Motion;
  const D = window.SC_DATA;
  const { Icon, Avatar, Mark, Btn, Chip, CountUp, useVW, Sheet, TopBar, Steps, Timeline, inr, num, inrDec, stagger } = window.SC;
  const HERO = D.batches.find(b => b.hero);
  const CARTON = D.IMG + "01-carton.jpg";

  // ---------- sign in ----------
  function SignIn({ a }) {
    return <div className="signin scroll">
      <div className="hero"><Mark size="lg" /><h1>Smart-Clearance</h1><p className="tag">{D.strings.tagline}</p><p className="hi hindi">{D.strings.hindiTag}</p><p className="small" style={{ color: "#8fb3a0" }}>Demo mode · pre-provisioned accounts · pick a person to sign in as them</p></div>
      <div className="roles">{D.roles.map((r, i) => { const p = D.people[r.who]; return <motion.button type="button" key={r.id} className="rolecard" onClick={() => a.signIn(r.id)} {...stagger(i, 0.06)}><img src={p.img} alt="" /><div><b>{p.name}</b><span>{p.role}</span></div><em>{r.signin}</em></motion.button>; })}</div>
    </div>;
  }

  // ---------- shelf-life board ----------
  function zoneOf(b, stage) { return b.hero ? (stage >= 7 ? "cleared" : "risk") : b.zone; }
  function dayColor(d) { return d >= 108 ? "var(--green)" : d >= 90 ? "#7f9a2a" : d >= 60 ? "var(--amber)" : "var(--red)"; }
  const STRIP = ["risk", "blinkit", "zepto", "safe", "cleared"];
  function BatchCard({ b, stage, onOpen, i }) {
    const p = D.products[b.sku]; const hot = b.hero && stage < 7; const pct = Math.min(100, Math.round(b.days / 180 * 100)); const reduced = useReducedMotion();
    return <motion.button type="button" layout layoutId={"card-" + b.id} className={"bcard " + (hot ? "hot" : "")} onClick={onOpen} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3, layout: { type: "spring", stiffness: 260, damping: 30 } }}>
      {hot && !reduced ? <motion.span className="ring" aria-hidden="true" animate={{ scale: [1, 1.05], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} /> : null}
      <div className="bn">{p.name}</div>
      <div className="bid">{b.id} · {b.where}</div>
      <div className="cd"><div className="track"><motion.i initial={{ width: 0 }} animate={{ width: pct + "%" }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} style={{ background: dayColor(b.days) }} /></div><b style={{ color: dayColor(b.days) }}>{b.days} d</b></div>
      <div className="bm"><span>{b.cartons} cartons</span><span>{num(b.packets)} packets</span><span>{b.sell}/day</span></div>
      {hot ? <div className="loss">{b.atRisk ? num(b.atRisk) + " packets won't sell · " : ""}{inr(-b.binCost)} if binned</div> : null}
      {b.hero && stage >= 4 && stage < 7 ? <Chip tone="green" icon="check">approved · executing</Chip> : null}
      {b.routed || (b.hero && stage >= 7) ? <Chip tone="green" icon="check">{b.routed || "24½ cartons to shops · 32 online · 0 binned"}</Chip> : null}
      {hot ? <div className="row" style={{ marginTop: 2 }}><span className="btn primary sm"><Icon name="arrow" size={16} />Open</span></div> : null}
    </motion.button>;
  }
  function AgentNote({ s, a }) {
    if (s.stage >= 7) return <div className="agentnote">
      <div className="an-h"><Mark size="sm" />Watcher agent</div>
      <div className="an-t">Thu 2 Oct · 09:00 IST · 4 distributors · 312 batches checked</div>
      <p className="small">{HERO.id} is routed and moving: 24½ cartons on the Tuesday round, 32 cartons + 4 on the truck to Hyderabad, 0 to the bin.</p>
      <div className="gate ok"><Icon name="check" size={16} /><span>No other batch fails the app gates or sell-through today</span></div>
      <div className="gate"><Icon name="clock" size={16} /><span>Next check tomorrow, 09:00</span></div>
      <Btn variant="secondary" icon="chart" onClick={() => a.go("ledger")}>Open the ledger</Btn>
    </div>;
    return <div className="agentnote">
      <div className="an-h"><Mark size="sm" />Watcher agent</div>
      <div className="an-t">Thu 2 Oct · 09:00 IST · 4 distributors · 312 batches checked</div>
      <p className="small">One batch fails both checks: the delivery-app date gates and real sell-through in its pincode.</p>
      {D.gates.map(g => <div key={g.app} className="gate no"><Icon name="x" size={16} /><span><b>{g.app}</b> {g.rule} · has {g.has}</span></div>)}
      <div className="gate"><Icon name="chart" size={16} /><span>sell-through 12 / day × 40 days = 480 of 1,840</span></div>
      <div className="gate no"><Icon name="info" size={16} /><span><b>1,360 packets</b> at risk · 57 cartons · {inr(-HERO.binCost)} if binned</span></div>
      <Btn variant="amber" icon="arrow" onClick={() => a.go("batch", HERO.id)}>{s.stage >= 4 ? "Watch " + HERO.id : "Open " + HERO.id}</Btn>
    </div>;
  }
  function Board({ s, a }) {
    const [zone, setZone] = useState("risk");
    const counts = useMemo(() => { const c = {}; D.batches.forEach(b => { const z = zoneOf(b, s.stage); c[z] = (c[z] || 0) + 1; }); return c; }, [s.stage]);
    useEffect(() => { if (s.stage >= 7 && zone === "risk") setZone("cleared"); }, [s.stage]);
    return <>
      <TopBar who="priya" title="Munchly Foods" sub="Supply chain · Thu 2 Oct · 09:00" badge={s.unread} onBell={() => a.go("inbox")} />
      <div className="page board">
        <div className="stack">
          <div className="row between wrap"><h1>Shelf-life board</h1><Chip tone="outline" icon="clock">days to best-before · 6-month products</Chip></div>
          <div className="zonestrip" role="tablist" aria-label="Zones">{STRIP.map(id => D.zones.find(z => z.id === id)).map(z => <button type="button" key={z.id} role="tab" aria-pressed={zone === z.id} onClick={() => setZone(z.id)}>{z.label}<b>{counts[z.id] || 0}</b></button>)}</div>
          <LayoutGroup><div className="zones">{D.zones.map(z => <section key={z.id} className={"zone " + z.id + (zone === z.id ? " on" : "")} aria-label={z.label}>
            <div className="zh"><div><b>{z.label}</b><br /><span>{z.rule}</span></div><em>{counts[z.id] || 0}</em></div>
            <AnimatePresence>{D.batches.filter(b => zoneOf(b, s.stage) === z.id).map((b, i) => <BatchCard key={b.id} b={b} stage={s.stage} i={i} onOpen={() => a.go("batch", b.id)} />)}</AnimatePresence>
            {!(counts[z.id]) ? <div className="empty small">Nothing here today</div> : null}
          </section>)}</div></LayoutGroup>
        </div>
        <aside className="stack"><AgentNote s={s} a={a} /></aside>
      </div>
    </>;
  }

  // ---------- route room (case file) ----------
  function LabelCard({ s, a }) {
    return <div className="card labelcard">
      <div className="photo">{s.photo === "taken" ? <><img src={CARTON} alt="Carton label photo from shelf B4" /><span className="ver"><Chip tone="green" icon="check">Verified · Gemini vision · 0.97</Chip></span></> : <div className="skeleton" style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}><span className="small muted" style={{ background: "var(--surface)", padding: "6px 10px", borderRadius: 8 }}>{s.photo === "requested" ? "Waiting for Rakesh bhai's photo" : "No label photo yet"}</span></div>}</div>
      <div className="stack-sm">
        <h3>Label, read from the shelf</h3>
        {s.photo === "taken" ? <div className="vis">
          {[["Batch", HERO.id], ["Manufactured", HERO.mfg], ["Best before", HERO.bestBefore], ["MRP", "₹30.00 · 24 × 150 g"], ["Pack", "sealed, dry"], ["Records", "match"]].map(([k, v], i) => <motion.div key={k} className="vr" {...stagger(i, 0.08)}><span>{k}</span><span>{v}</span></motion.div>)}
        </div> : s.photo === "requested" ? <>
          <p className="small muted">Push sent at 09:05 to Rakesh bhai's phone. Warehouse records are often a week old, so the agent waits for the label before pricing anything.</p>
          <Btn variant="secondary" icon="phone" onClick={() => a.nav("distributor", "photo")}>Open Rakesh bhai's phone</Btn>
        </> : <>
          <p className="small muted">The agent prices nothing until a person photographs one carton label on the shelf and Gemini reads it.</p>
          <Btn variant="primary" icon="camera" onClick={() => a.requestPhoto()}>Ask Rakesh bhai for one photo</Btn>
        </>}
      </div>
    </div>;
  }
  function Doors({ s }) {
    if (s.stage < 3) return <div className="card tint"><div className="row"><Icon name="shield" /><div><b>Six doors, priced after verification</b><p className="small muted">Marketplace, kirana shops, own site, staff sale, food bank, and the bin at its true cost.</p></div></div></div>;
    return <div className="stack-sm"><div className="row between wrap"><h3>Six doors, per carton of 24, after costs</h3><span className="tiny muted">Valuer agent · 09:21</span></div>
      <div className="doors">{D.doors.map((d, i) => <motion.div key={d.id} className={"door " + (d.cls || "")} {...stagger(i, 0.07)}>{d.pick ? <span className="pick"><Icon name="check" size={16} /></span> : null}<div className="dn">{d.name}</div><div className="dv">{inr(d.net)}</div><div className="dr">{d.rule}{d.needs ? " · " + d.needs : ""} · {d.cap}</div></motion.div>)}</div></div>;
  }
  function Split({ s }) {
    const P = D.plan; if (s.stage < 3) return null;
    return <div className="card stack">
      <div className="row between wrap"><h3>Recommended split</h3><span className="tiny muted">Router agent · 09:22 · fills the best door to its cap, then the next</span></div>
      <div className="bar tall"><motion.i className="c-shops" initial={{ width: 0 }} animate={{ width: "43%" }} transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}>588 to shops</motion.i><motion.i className="c-online" initial={{ width: 0 }} animate={{ width: "57%" }} transition={{ duration: 1, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}>772 online</motion.i></div>
      <div className="ledger">
        <div className="lrow pos"><span>{P.shops.packets} packets · {P.shops.cartons} cartons → 14 Nagpur kirana shops at ₹{P.shops.price}<small>buy 10 get 2 · 48-hour scheme in Hindi</small></span><span className="v"><CountUp to={P.shops.gross} /></span></div>
        <div className="lrow pos"><span>{P.online.packets} packets · {P.online.cartons} cartons → ExpireSoon at ₹{P.online.price}<small>floor ₹{P.online.floor} · dates and label photo visible to buyers</small></span><span className="v"><CountUp to={P.online.gross} delay={0.1} /></span></div>
        <div className="lrow neg"><span>Van delivery (588 × ₹0.50) and listing fee ₹100</span><span className="v">{inr(-P.costs)}</span></div>
        <div className="lrow sum pos"><span>Net recovered · {P.pctMrp}% of MRP</span><span className="v"><CountUp to={P.net} delay={0.25} /></span></div>
        <div className="lrow"><span>If binned instead<small>stock + GST credit paid back + disposal + packaging charge</small></span><span className="v" style={{ color: "var(--red)" }}>{inr(-P.bin)}</span></div>
        <div className="lrow"><span>Swing against the bin</span><span className="v">{inr(P.swing)}</span></div>
        <div className="lrow"><span>GST input credit stays safe <span className="tiny muted">(indicative)</span></span><span className="v" style={{ color: "var(--green)" }}>{inr(P.itc)}</span></div>
      </div>
      <div className="row wrap"><Chip tone="outline">Alternative considered: {P.alt.label} · {inr(P.alt.net)} · not chosen</Chip><Chip tone="outline">Floor 35% of MRP respected</Chip></div>
    </div>;
  }
  function ApproveSheet({ open, onClose, a }) {
    const [busy, setBusy] = useState(false); const P = D.plan;
    const go = () => { setBusy(true); setTimeout(() => { setBusy(false); onClose(); a.approve(); }, 900); };
    return <Sheet open={open} onClose={onClose} title="Approve the plan" footer={<><Btn variant="amber" size="lg" full icon="check" loading={busy} onClick={go}>Approve · release the agents</Btn><Btn variant="ghost" full onClick={onClose}>Not now</Btn></>}>
      <div className="stack">
        <div className="ledger"><div className="lrow pos"><span>You get</span><span className="v" style={{ fontSize: 22 }}>{inr(P.net)}</span></div><div className="lrow neg"><span>Instead of losing</span><span className="v" style={{ fontSize: 22 }}>{inr(-P.bin)}</span></div><div className="lrow pos"><span>GST credit stays safe</span><span className="v" style={{ fontSize: 22 }}>{inr(P.itc)}</span></div></div>
        <h4>What happens the moment you tap</h4>
        <div className="stack-sm small"><div className="row top"><Icon name="tag" size={18} /><span>Lister posts 772 packets on ExpireSoon at ₹15, floor ₹14, with the label photo and dates.</span></div><div className="row top"><Icon name="send" size={18} /><span>Outreach pushes the Hindi scheme to 38 shops: 588 packets at ₹18, buy 10 get 2, 48 hours.</span></div><div className="row top"><Icon name="shield" size={18} /><span>Nothing is listed, messaged or shipped before this tap. Approval is logged with who, when and device.</span></div></div>
      </div>
    </Sheet>;
  }
  function RouteRoom({ s, a, id }) {
    const b = D.batches.find(x => x.id === id) || HERO; const p = D.products[b.sku]; const [open, setOpen] = useState(false);
    const current = s.stage < 2 ? 0 : s.stage < 3 ? 1 : s.stage < 4 ? 2 : s.stage < 5 ? 3 : s.stage < 8 ? 4 : s.stage < 9 ? 5 : 6;
    if (!b.hero) return <><TopBar back="Board" onBack={() => a.go("board")} /><div className="page stack"><h1>{p.name}</h1><div className="row wrap"><Chip mono>{b.id}</Chip><Chip tone="green" icon="clock">{b.days} days left</Chip><Chip>{b.cartons} cartons · {b.where}</Chip></div><div className="card"><b>{b.routed ? "Routed" : "Nothing to do"}</b><p className="small muted">{b.routed || "Inside every app's date gate and selling through at " + b.sell + " packets a day. The Watcher checks it again tomorrow at 09:00."}</p></div></div></>;
    return <>
      <TopBar back="Board" onBack={() => a.go("board")} badge={s.unread} onBell={() => a.go("inbox")} />
      <div className="page stack">
        <div className="stack-sm"><h1>{p.name}</h1><div className="row wrap"><Chip mono>{b.id}</Chip><Chip tone="red" icon="clock">{b.days} days left · best before {b.bestBefore}</Chip><Chip>{b.cartons} cartons · {num(b.packets)} packets</Chip><Chip icon="pin">{b.where} · shelf {b.shelf}</Chip></div></div>
        <Steps items={["Verify", "Value", "Route", "Approve", "Execute", "Settle"]} current={current} />
        <div className="case">
          <div className="main-col stack">
            <LabelCard s={s} a={a} />
            <Doors s={s} />
            <Split s={s} />
            {s.stage === 3 ? <div className="approvebar"><div className="inner"><div className="nums"><div>You get<b>{inr(D.plan.net)}</b></div><div>Instead of<b style={{ color: "var(--red)" }}>{inr(-D.plan.bin)}</b></div><div>GST credit safe<b style={{ color: "var(--green)" }}>{inr(D.plan.itc)}</b></div></div><Btn variant="amber" size="lg" icon="check" onClick={() => setOpen(true)}>Review and approve</Btn></div></div> : null}
            {s.stage >= 4 ? <div className="approvebar"><div className="inner"><Avatar who="priya" size={36} /><div className="grow"><b>Approved by Priya · 09:40 · phone</b><div className="small muted">{s.stage >= 7 ? "Executed. 0 cartons binned." : "Agents are executing: listing, outreach, negotiation."}</div></div><Btn variant="primary" icon="play" onClick={() => a.go("execution", b.id)}>Watch execution</Btn></div></div> : null}
          </div>
          <aside className="stack"><div className="card"><h3 style={{ marginBottom: 8 }}>Agent timeline</h3><Timeline stage={s.stage} /></div></aside>
        </div>
      </div>
      <ApproveSheet open={open} onClose={() => setOpen(false)} a={a} />
    </>;
  }

  // ---------- execution ----------
  function Execution({ s, a }) {
    const P = D.plan; const orders = D.shops.slice(0, s.orders); const packets = orders.reduce((t, o) => t + o.packets, 0);
    return <>
      <TopBar back="Batch" onBack={() => a.go("batch", HERO.id)} badge={s.unread} onBell={() => a.go("inbox")} />
      <div className="page stack">
        <div className="row between wrap"><h1>Execution · {HERO.id}</h1><Chip tone={s.stage >= 7 ? "green" : "amber"} icon={s.stage >= 7 ? "check" : "refresh"}>{s.stage >= 7 ? "done · 0 binned" : "four agents working"}</Chip></div>
        <div className="exec">
          <div className="card stack-sm"><div className="row between"><h3>Lister · ExpireSoon</h3><Chip tone="purple">201 Created</Chip></div>
            <div className="code scroll">{`POST /v1/listings\n{ "sku": "MF-MC-150", "batch": "${HERO.id}",\n  "qty": 772, "price": 15.00, "floor": 14.00,\n  "best_before": "2026-11-18", "label_photo": "gs://…/b4.jpg" }\n\n201 { "id": "ES-88213", "status": "live", "url": "/l/ES-88213" }`}</div>
            <p className="small muted">Mocked marketplace; the agent fills the real listing form the same way.</p>
            <Btn variant="secondary" size="sm" icon="external" onClick={() => a.nav("buyer", "listing")}>Open the listing as Venkat</Btn></div>
          <div className="card stack-sm"><div className="row between"><h3>Outreach · 38 shops</h3><Chip tone="blue">push · Hindi</Chip></div>
            <p className="hindi small" style={{ background: "var(--blue-soft)", padding: "8px 10px", borderRadius: 10 }}>{D.strings.offerHindi}</p>
            <div className="g38" aria-label={s.orders + " of 38 shops ordered"}>{Array.from({ length: 38 }).map((_, i) => <b key={i} className={i < s.orders ? "lit" : ""} />)}</div>
            <div className="row between"><b><CountUp to={packets} format={num} /> / 588 packets</b><span className="small muted">{s.orders} of 14 shops ordered</span></div>
            <div className="orders">{orders.slice(-5).reverse().map(o => <div key={o.id} className="or"><span>{o.name} <small>{o.area}</small></span><b>{o.packets}</b><small>{o.at}</small></div>)}{!orders.length ? <div className="empty small">{s.stage >= 5 ? "Orders arrive as shops tap the offer" : "Sends after approval"}</div> : null}</div>
            <Btn variant="secondary" size="sm" icon="external" onClick={() => a.nav("retailer", "offers")}>Open as Ganesh ji</Btn></div>
          <div className="card stack-sm"><div className="row between"><h3>Negotiator</h3><Chip tone={s.bid === "accepted" ? "green" : "outline"}>{s.bid === "accepted" ? "awarded · ₹14.20" : "floor ₹14 · hidden"}</Chip></div>
            <ChatThread s={s} />
            {s.bid === "accepted" ? <div className="ledger"><div className="lrow"><span>Planned: 772 × ₹15</span><span className="v">{inr(P.online.gross)}</span></div><div className="lrow"><span>Actual: 772 × ₹14.20</span><span className="v">{inr(P.actualOnline.gross)}</span></div><div className="lrow sum"><span>Net recovered, actual</span><span className="v">{inr(P.actualNet)}</span></div></div> : <Btn variant="secondary" size="sm" icon="external" onClick={() => a.nav("buyer", "listing")}>Bid as Venkat</Btn>}</div>
        </div>
      </div>
    </>;
  }
  function ChatThread({ s, compact }) {
    const msgs = s.bid === "none" ? [] : s.bid === "placed" ? [D.chat[0]] : s.bid === "countered" ? D.chat.slice(0, 2) : D.chat;
    return <div className="chat">
      {!msgs.length ? <div className="empty small">Waiting for a bid. The agent counters anything under the floor and promises only what the van can keep.</div> : null}
      <AnimatePresence>{msgs.map((m, i) => <motion.div key={i} className={"msg " + (m.from === "venkat" ? "me" : "")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>{m.from === "venkat" ? <Avatar who="venkat" size={36} /> : <Mark size="sm" />}<div className={"bub " + (m.from === "agent" ? "ag" : "")}>{m.text}<small>{m.from === "venkat" ? "Venkat · " + m.at : m.at}</small></div></motion.div>)}</AnimatePresence>
      {s.bid === "placed" ? <div className="msg"><Mark size="sm" /><div className="bub ag dots" aria-label="Agent is typing"><span /><span /><span /></div></div> : null}
      {s.bid === "accepted" ? <Chip tone="green" icon="check">Token ₹1,644 received · balance ₹9,318 due before dispatch</Chip> : null}
    </div>;
  }

  // ---------- paperwork ----------
  function Paper({ id }) {
    if (id === "invoice") return <div className="paper"><h3>Tax invoice · INV/26-27/0931</h3><div className="row between wrap small"><span><b>Rakesh Traders</b><br />Kalamna Market, Nagpur 440008<br />GSTIN 27AABCR1234F1Z5</span><span><b>Sri Venkateswara Traders</b><br />Begum Bazaar, Hyderabad 500012<br />GSTIN 36AAACS9876K1Z2</span></div><table><thead><tr><th>Item</th><th>HSN</th><th className="n">Qty</th><th className="n">Rate</th><th className="n">Amount</th></tr></thead><tbody><tr><td>Munchly Masala Chips 150 g, batch MF-2409-117, BB 18 Nov 2026</td><td>2005</td><td className="n">772</td><td className="n">14.20</td><td className="n">10,962.40</td></tr><tr><td colSpan="4">IGST 12% (inter-state, Maharashtra → Telangana)</td><td className="n">1,315.49</td></tr><tr><td colSpan="4"><b>Total</b></td><td className="n"><b>12,277.89</b></td></tr></tbody></table><p className="small muted" style={{ marginTop: 8 }}>E-way bill not required: consignment under ₹50,000. Token ₹1,644 received 2 Oct; balance ₹9,318 before dispatch.</p><div style={{ marginTop: 12 }}><Chip tone="green" icon="check">Token received · balance due before dispatch</Chip></div></div>;
    if (id === "itc") return <div className="paper"><h3>GST input credit memo · indicative</h3><p>Batch MF-2409-117: 1,360 packets sold through ExpireSoon (772) and the Nagpur kirana scheme (588). No goods were destroyed, written off or disposed of; CGST Act s.17(5)(h) reversal does not apply.</p><table><tbody><tr><td>Input credit on stock (1,360 × ₹16 × 12%)</td><td className="n">2,611.20</td></tr><tr><td>Reversal required in GSTR-3B</td><td className="n">0.00</td></tr></tbody></table><p className="small muted" style={{ marginTop: 8 }}>Indicative treatment based on Circular 72/46/2018; confirm with the company's GST adviser.</p><div style={{ marginTop: 12 }}><Chip tone="green" icon="check">Input credit kept · ₹2,611</Chip></div></div>;
    const d = D.docs.find(x => x.id === id); return <div className="paper"><h3>{d.title} · {d.no}</h3>{d.lines.map(l => <p key={l}>{l}</p>)}<p style={{ marginTop: 8 }}><b>{d.total}</b></p></div>;
  }
  function Paperwork({ s, a, who = "anita" }) {
    const [open, setOpen] = useState(null); const [busy, setBusy] = useState(false);
    const prep = () => { setBusy(true); setTimeout(() => { setBusy(false); a.generatePapers(); }, 1500); };
    return <>
      <TopBar who={who} title={D.people[who].short} sub={D.people[who].role} badge={s.unread} onBell={() => a.go("inbox")} />
      <div className="page stack">
        <div className="row between wrap"><h1>Paperwork · {HERO.id}</h1>{s.stage >= 8 ? <Chip tone="green" icon="check">pack ready · day 3</Chip> : <Chip tone="outline" icon="clock">{s.stage >= 7 ? "stock moved · ready to prepare" : "waits for the stock to move"}</Chip>}</div>
        {s.stage < 7 ? <div className="docs">{[0, 1, 2, 3].map(i => <div key={i} className="doc" aria-hidden="true"><div className="skeleton" style={{ height: 18, width: "60%" }} /><div className="skeleton" style={{ height: 12 }} /><div className="skeleton" style={{ height: 12, width: "80%" }} /><div className="skeleton" style={{ height: 24, width: "40%" }} /></div>)}</div> : null}
        {s.stage < 7 ? <p className="small muted">The Paperwork agent drafts the invoice, the credit note, the e-way bill check and the ITC memo once the cartons have left the godown. Nothing to chase.</p> : null}
        {s.stage === 7 ? <div className="card row wrap"><div className="grow"><b>Cartons dispatched. Prepare the document pack?</b><p className="small muted">Invoice to Hyderabad, credit note for the shop scheme, e-way bill check, GST memo.</p></div><Btn variant="primary" icon="file" loading={busy} onClick={prep}>Prepare the pack</Btn></div> : null}
        {s.stage >= 8 ? <div className="docs">{D.docs.filter(d => d.id !== "fssai").map((d, i) => <motion.button type="button" key={d.id} className={"doc " + (d.status === "not required" ? "na" : "")} onClick={() => setOpen(d.id)} {...stagger(i, 0.08)}><div className="dh"><b>{d.title}</b><Chip tone={d.status === "generated" ? "green" : "outline"} icon={d.status === "generated" ? "check" : "minus"}>{d.status}</Chip></div><div className="dl mono tiny">{d.no}</div>{d.lines.map(l => <div key={l} className="dl">{l}</div>)}<div className="dt">{d.total}</div><span className="small" style={{ color: "var(--green)" }}>Preview</span></motion.button>)}</div> : null}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Preview" footer={<Btn variant="secondary" icon="download" onClick={() => setOpen(null)}>Download PDF</Btn>}>{open ? <Paper id={open} /> : null}</Sheet>
    </>;
  }

  // ---------- ledger: finance & ESG ----------
  function downloadCSV() { const rows = [["Category", "Generated", "Recycled", "Diverted from landfill", "Evidence"], ...D.ledger.brsr]; const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const u = URL.createObjectURL(blob); const el = document.createElement("a"); el.href = u; el.download = "brsr-principle-6-q3-fy27.csv"; el.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }
  function Ledger({ s, a, who = "anita", focus = "money" }) {
    const Q = D.ledger.quarter; const [busy, setBusy] = useState(false);
    const write = () => { setBusy(true); setTimeout(() => { setBusy(false); a.closeLedger(); }, 1200); };
    return <>
      <TopBar who={who} title={D.people[who].short} sub={D.people[who].role} badge={s.unread} onBell={() => a.go("inbox")} />
      <div className="page stack-lg">
        <div className="row between wrap"><h1>{focus === "esg" ? "Impact · Q3 FY27" : "Finance & ESG ledger · Q3 FY27"}</h1><Chip tone="outline">{Q.batches} batches routed this quarter</Chip></div>
        <div className="case"><div className="main-col stack">
          <div className="card stack-sm"><div className="row between wrap"><h3>This batch · {HERO.id}</h3>{s.stage >= 8 ? <Chip tone="green" icon="check">closed · day 3</Chip> : <Chip tone="outline" icon="clock">open</Chip>}</div>{s.stage >= 8 ? <div className="ledger">{D.ledger.batch.map(([k, v, t]) => <div key={k} className={"lrow " + t}><span>{k}</span><span className="v">{v}</span></div>)}</div> : <p className="small muted">Closes when the document pack is ready. Both readings of the same event land here: the money reading for finance and the waste reading for sustainability.</p>}{s.stage >= 8 ? <p className="small muted">Evidence: tax invoice INV/26-27/0931 · ExpireSoon listing ES-88213 · 14 shop orders · credit note CN/0117 · ITC memo.</p> : null}</div>
          <div className="card stack-sm"><h3>BRSR Principle 6 · waste (Q3 FY27)</h3><div className="tablewrap"><table className="table"><thead><tr><th>Category</th><th className="n">Generated</th><th className="n">Recycled</th><th className="n">Diverted</th><th>Evidence</th></tr></thead><tbody>{D.ledger.brsr.map(r => <tr key={r[0]}><td>{r[0]}</td><td className="n">{r[1]}</td><td className="n">{r[2]}</td><td className="n">{r[3]}</td><td className="small muted">{r[4]}</td></tr>)}</tbody></table></div>
            <div className="row wrap">{focus === "esg" && s.stage === 8 ? <Btn variant="primary" icon="check" loading={busy} onClick={write}>Write this batch's row</Btn> : null}{s.stage >= 9 ? <Chip tone="green" icon="check">MF-2409-117 · 217.6 kg · row written with 4 evidence links</Chip> : null}<Btn variant="secondary" icon="download" onClick={downloadCSV}>Export BRSR table (CSV)</Btn></div></div>
        </div><aside className="stack"><div className="card stack-sm"><h3>Quarter so far</h3><div className="hbar"><span>Recovered</span><motion.i className="m" initial={{ width: 0 }} animate={{ width: "86%" }} transition={{ duration: 1 }} /><b>₹6.3 L</b></div><div className="hbar"><span>GST credit kept</span><motion.i className="m" initial={{ width: 0 }} animate={{ width: "30%" }} transition={{ duration: 1, delay: 0.1 }} /><b>₹79 k</b></div><div className="hbar"><span>Waste avoided</span><motion.i initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ duration: 1, delay: 0.2 }} /><b>5.7 t</b></div><div className="hbar"><span>Meals</span><motion.i initial={{ width: 0 }} animate={{ width: "40%" }} transition={{ duration: 1, delay: 0.3 }} /><b>3,700</b></div><p className="tiny muted">{Q.batches} batches routed · net of costs · ITC indicative</p></div>
          <div className="card tint small"><b>How the waste number is built</b><p className="muted">cartons × gross weight (chips 3.84 kg a carton) for every batch sold, donated or staff-sold instead of destroyed; each row links its invoice, listing, shop orders or food-bank receipt.</p></div></aside></div>
      </div>
    </>;
  }

  // ---------- inbox ----------
  function Inbox({ s, a, role }) {
    const items = s.inbox.filter(n => n.role === role);
    return <>
      <TopBar back="Back" onBack={() => a.go(D.roles.find(r => r.id === role).nav[0][0])} />
      <div className="page stack"><h1>Inbox</h1>
        {!items.length ? <div className="empty">No notifications yet</div> : <div className="stack-sm">{items.map((n, i) => <motion.button type="button" key={n.id} className="card row top" style={{ textAlign: "left", width: "100%" }} onClick={() => { a.read(n.id); n.go && n.go(); }} {...stagger(i, 0.05)}><Mark size="sm" /><div className="grow"><div className="row between"><b>{n.title}</b><span className="tiny muted mono">{n.at}</span></div><div className={"small " + (n.hindi ? "hindi" : "")}>{n.body}</div></div>{!n.read ? <span className="chip amber">new</span> : null}</motion.button>)}</div>}
      </div>
    </>;
  }

  Object.assign(window.SC, { SignIn, Board, RouteRoom, Execution, ChatThread, Paperwork, Ledger, Inbox, HERO, CARTON, zoneOf });
})();

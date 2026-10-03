// Smart-Clearance demo v2 · brand-side screens: sign in, the sheet, the Route Room, Execution, Paperwork, Ledger, Inbox
(function () {
  const { useState, useEffect, useMemo } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const D = window.SC_DATA; const K = window.SC2;
  const { Icon, Avatar, Mark, Wordmark, Btn, Chip, Plate, CountUp, Sheet, TopBar, RunHead, Stages, Timeline, Label, Door, Tape, LiveTile, Notice, Gate, Sun, Emblem, ModeSwitch, Empty, Skeleton, usePhone, inr, num, inrDec, cx } = K;
  const HERO = D.batches.find(b => b.hero);
  const P = D.people;

  // ---------- sign in: the sheet of people ----------
  function SignIn({ a }) {
    const reduce = useReducedMotion();
    return <div className="signin scroll">
      <div className="sihead"><Mark /><Wordmark size={18} /><div className="grow" /><Chip mono>demo · pre-provisioned accounts</Chip><ModeSwitch /></div>
      <div className="sibody">
        <div className="sihero">
          <div className="sunstage"><Sun size={180} /><Mark size="xl" print={!reduce} /></div>
          <Wordmark size={34} />
          <p className="tag">{D.strings.tagline}</p>
          <p className="tag hi">{D.strings.hindiTag}</p>
          <p className="meta">Pick a person to sign in as them. Six roles, one batch, nine moments.</p>
        </div>
        <div className="roles">{D.roles.map((r, i) => { const p = P[r.who]; return <button type="button" key={r.id} className="rolelabel register" style={{ animationDelay: (i * 60) + "ms" }} onClick={() => a.signIn(r.id)}>
          <Avatar person={p} size="lg" /><div><b>{p.name}</b><span>{p.role}</span><span className="mono" style={{ marginTop: 4 }}>{r.signin}</span></div><Chip tone={p.tone}>{r.label}</Chip><img className="rl-emb" src={p.emblem} alt="" />
        </button>; })}</div>
      </div>
    </div>;
  }

  // ---------- the sheet ----------
  function stateOf(b, stage) { return b.hero ? (stage >= 7 ? "cleared" : "risk") : b.zone; }
  function WatcherNotice({ s, a }) {
    if (s.stage >= 7) return <Notice who="Watcher" when="Thu 2 Oct · 09:00 IST · 312 batches checked">
      <p className="t-small">{HERO.id} is routed and moving: 24½ cartons on the Tuesday round, 32 cartons + 4 on the truck to Hyderabad, 0 to the bin.</p>
      <div><div className="gate"><span>No other batch fails the gates or sell-through today</span><Chip tone="emerald" icon="check">clear</Chip></div><div className="gate"><span>Next check</span><Chip mono>tomorrow 09:00</Chip></div></div>
      <Btn icon="chart" onClick={() => a.go("ledger")}>Open the ledger</Btn>
    </Notice>;
    return <Notice who="Watcher" when="Thu 2 Oct · 09:00 IST · 312 batches checked">
      <p className="t-small">One batch fails both checks: the delivery-app date gates and real sell-through in its pincode.</p>
      <div>{D.gates.map(g => <Gate key={g.app} app={g.app} rule={g.rule + " · has " + g.has} ok={g.ok} />)}<div className="gate"><span>Sell-through 12 a day × 40 days</span><Chip mono>480 of 1,840</Chip></div><div className="gate"><span><b>1,360 packets</b> at risk · 57 cartons</span><Chip tone="vermilion" dot>{inr(HERO.binCost)} if binned</Chip></div></div>
      <Btn kind="yes" icon="arrow" onClick={() => a.go("batch", HERO.id)}>{s.stage >= 4 ? "Watch " + HERO.id : "Open " + HERO.id}</Btn>
    </Notice>;
  }
  function Board({ s, a }) {
    const [filter, setFilter] = useState("all");
    const list = useMemo(() => D.batches.map(b => ({ b, st: stateOf(b, s.stage) })).filter(x => filter === "all" || x.st === filter || (filter === "gated" && (x.st === "zepto" || x.st === "blinkit"))).sort((x, y) => (x.st === "risk" ? -1 : 0) - (y.st === "risk" ? -1 : 0) || x.b.days - y.b.days), [s.stage, filter]);
    const counts = useMemo(() => { const c = { all: D.batches.length, risk: 0, gated: 0, safe: 0, cleared: 0 }; D.batches.forEach(b => { const st = stateOf(b, s.stage); c[st === "zepto" || st === "blinkit" ? "gated" : st]++; }); return c; }, [s.stage]);
    const atRisk = counts.risk, stake = s.stage >= 7 ? 0 : HERO.binCost;
    return <>
      <TopBar who={P.priya} sub="Munchly Foods · Thu 2 Oct · 09:00" runhead={<RunHead parts={[{ b: "Today" }, { b: String(D.batches.length), t: "batches" }, { b: String(atRisk), t: "at risk", hot: atRisk > 0 }, s.stage >= 7 ? { b: inr(D.plan.actualNet), t: "recovered" } : { b: inr(stake), t: "at stake", hot: true }]} />} unread={s.unread} onBell={() => a.go("inbox")} />
      <div className="page">
        <div className="board">
          <div className="stack">
            <div className="row between wrap"><h1>The sheet</h1><Chip icon="clock">sorted by days to best-before</Chip></div>
            <div className="sheetstrip" role="group" aria-label="Filter">{[["all", "All"], ["risk", "At risk"], ["gated", "Gated"], ["safe", "Safe"], ["cleared", "Cleared"]].map(([id, l]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{l}<b>{counts[id] || 0}</b></button>)}</div>
            <div className="sheetgrid">
              {list.map(({ b, st }) => { const p = D.products[b.sku]; const hot = b.hero && s.stage < 7; return <Label key={b.id} batch={b} product={p} state={st} hot={hot} img={hot ? D.IMG + "hero-carton.webp" : undefined} onOpen={() => a.go("batch", b.id)}
                action={b.hero ? <Btn kind={s.stage >= 7 ? "secondary" : "yes"} size="sm" icon={s.stage >= 7 ? "check" : "arrow"} onClick={() => a.go(s.stage >= 4 && s.stage < 7 ? "execution" : "batch", b.id)}>{s.stage >= 7 ? "Cleared" : s.stage >= 4 ? "Watch execution" : "Open the batch"}</Btn> : b.routed ? <Chip tone="ultra" icon="check">routed</Chip> : undefined}>
                {b.hero && s.stage >= 4 && s.stage < 7 ? <Chip tone="emerald" icon="check">approved · executing</Chip> : null}
                {b.hero && s.stage >= 7 ? <Chip tone="ultra" icon="check">routed · 0 binned</Chip> : null}
              </Label>; })}
            </div>
          </div>
          <aside className="aside">
            <WatcherNotice s={s} a={a} />
            <div className="tilerow">
              <LiveTile value={atRisk} label="at risk" tone={atRisk ? "vermilion" : "emerald"} />
              <LiveTile value={s.stage >= 5 ? s.orders : 0} label="shops ordered" tone="emerald" />
              <LiveTile value={s.stage >= 8 ? inr(D.plan.actualNet) : inr(0)} label="recovered" />
            </div>
          </aside>
        </div>
      </div>
    </>;
  }

  // ---------- route room ----------
  function LabelCard({ s, a }) {
    return <Plate className="labelcard">
      <div className="photo">
        {s.photo === "taken" ? <><img className="real" src={D.CARTON_PHOTO} alt="Carton label photo from shelf B4" /><span className="ver"><Chip tone="emerald" solid icon="check">Verified · Gemini vision · 0.97</Chip></span></>
          : <><img className="plate-img" src={D.IMG + "hero-carton.webp"} alt="" /><div className="waiting">{s.photo === "requested" ? <Chip tone="chrome" icon="clock">waiting for Rakesh bhai's photo · asked 09:05</Chip> : <Chip icon="camera">no label photo yet</Chip>}</div></>}
      </div>
      <div className="stack-sm">
        <h3>Label, read from the shelf</h3>
        {s.photo === "taken" ? <dl className="kv">{[["Batch", HERO.id], ["Manufactured", HERO.mfg], ["Best before", HERO.bestBefore], ["MRP", "₹30.00 · 24 × 150 g"], ["Pack", "sealed, dry"], ["Records", "match"]].map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
          : s.photo === "requested" ? <><p className="t-small muted">Push sent at 09:05 to Rakesh bhai's phone. Warehouse records are often a week old, so the agent waits for the label before pricing anything.</p><Btn icon="phone" onClick={() => a.nav("distributor", "photo")}>Open Rakesh bhai's phone</Btn></>
          : <><p className="t-small muted">The agent prices nothing until a person photographs one carton label on the shelf and Gemini reads it.</p><Btn kind="primary" icon="camera" onClick={() => a.requestPhoto()}>Ask Rakesh bhai for one photo</Btn></>}
      </div>
    </Plate>;
  }
  function Doors({ s }) {
    if (s.stage < 3) return <Plate tone="kraft-soft"><div className="row"><Icon name="shield" /><div><b>Six doors, priced after verification</b><p className="t-small muted">Marketplace, kirana shops, own site, staff sale, food bank, and the bin at its true cost.</p></div></div></Plate>;
    return <div className="stack-sm"><div className="row between wrap"><h3>Six doors, per carton of 24, after costs</h3><Chip mono>Valuer · 09:21</Chip></div>
      <div className="doors stagger">{D.doors.map(d => <Door key={d.id} door={d} selected={!!d.pick} />)}</div></div>;
  }
  function Split({ s }) {
    const PL = D.plan; if (s.stage < 3) return null;
    return <Plate className="stack">
      <div className="row between wrap"><h3>Recommended split</h3><Chip mono>Router · 09:22</Chip></div>
      <p className="t-small muted">The tape is the 1,360 packets at risk. The router fills the best door to its cap, then the next; nothing overflows.</p>
      <Tape total={1360} capLabel="pkts" segments={[{ id: "shops", label: "shops 588", value: PL.shops.packets }, { id: "online", label: "online 772", value: PL.online.packets }]} />
      <div className="ledger">
        <div className="lrow pos"><span>{PL.shops.packets} packets · {PL.shops.cartons} cartons → 14 Nagpur kirana shops at ₹{PL.shops.price}<small>buy 10 get 2 · 48-hour scheme in Hindi</small></span><span className="v"><CountUp value={PL.shops.gross} /></span></div>
        <div className="lrow pos"><span>{PL.online.packets} packets · {PL.online.cartons} cartons → ExpireSoon at ₹{PL.online.price}<small>floor ₹{PL.online.floor} · dates and label photo visible to buyers</small></span><span className="v"><CountUp value={PL.online.gross} /></span></div>
        <div className="lrow neg"><span>Van delivery (588 × ₹0.50) and listing fee ₹100</span><span className="v">− {inr(PL.costs)}</span></div>
        <div className="lrow sum"><span>Net recovered · {PL.pctMrp}% of MRP</span><span className="v"><CountUp value={PL.net} /></span></div>
        <div className="lrow neg"><span>If binned instead<small>stock + GST credit paid back + disposal + packaging charge</small></span><span className="v">− {inr(PL.bin)}</span></div>
        <div className="lrow pos"><span>Swing against the bin</span><span className="v">{inr(PL.swing)}</span></div>
        <div className="lrow pos"><span>GST input credit stays safe <span className="t-xs muted">(indicative)</span></span><span className="v">{inr(PL.itc)}</span></div>
      </div>
      <div className="row wrap"><Chip>Alternative considered: {PL.alt.label} · {inr(PL.alt.net)} · not chosen</Chip><Chip>Floor 35% of MRP respected</Chip></div>
    </Plate>;
  }
  function ApproveSheet({ open, onClose, a }) {
    const [busy, setBusy] = useState(false); const PL = D.plan;
    const go = () => { setBusy(true); setTimeout(() => { setBusy(false); onClose(); a.approve(); }, 900); };
    return <Sheet open={open} onClose={onClose} title="Approve the plan" footer={<><Btn kind="yes" size="lg" full icon="check" loading={busy} onClick={go}>Approve · release the agents</Btn><Btn kind="ghost" full onClick={onClose}>Not now</Btn></>}>
      <div className="stack">
        <div className="ledger"><div className="lrow pos"><span>You get</span><span className="v" style={{ fontSize: 22 }}>{inr(PL.net)}</span></div><div className="lrow neg"><span>Instead of losing</span><span className="v" style={{ fontSize: 22 }}>− {inr(PL.bin)}</span></div><div className="lrow pos"><span>GST credit stays safe</span><span className="v" style={{ fontSize: 22 }}>{inr(PL.itc)}</span></div></div>
        <h4>What happens the moment you tap</h4>
        <div className="stack-sm t-small"><div className="row top"><Icon name="tag" size={18} /><span>Lister posts 772 packets on ExpireSoon at ₹15, floor ₹14, with the label photo and dates.</span></div><div className="row top"><Icon name="send" size={18} /><span>Outreach pushes the Hindi scheme to 38 shops: 588 packets at ₹18, buy 10 get 2, 48 hours.</span></div><div className="row top"><Icon name="shield" size={18} /><span>Nothing is listed, messaged or shipped before this tap. Approval is logged with who, when and device.</span></div></div>
      </div>
    </Sheet>;
  }
  function AgentTimeline({ s }) {
    const items = D.timeline.map(t => ({ ...t, state: t.stage <= s.stage ? "done" : t.stage === s.stage + 1 ? "now" : "todo" }));
    return <Plate><h3>Agent timeline</h3><p className="t-xs muted" style={{ marginBottom: 8 }}>Gaps are drawn to the clock: a long wait looks long.</p><Timeline items={items} scale={0.5} cap={56} /></Plate>;
  }
  function RouteRoom({ s, a, id }) {
    const b = D.batches.find(x => x.id === id) || HERO; const p = D.products[b.sku]; const [open, setOpen] = useState(false);
    const current = s.stage < 2 ? 0 : s.stage < 3 ? 1 : s.stage < 4 ? 2 : s.stage < 5 ? 3 : s.stage < 8 ? 4 : s.stage < 9 ? 5 : 6;
    const head = <RunHead parts={[{ b: b.id }, { b: String(b.days), t: "days left", hot: b.hero && s.stage < 7 }, b.hero ? { b: "57", t: "cartons at risk", hot: s.stage < 7 } : { b: String(b.cartons), t: "cartons" }]} />;
    if (!b.hero) return <><TopBar back="Sheet" onBack={() => a.go("board")} runhead={head} unread={s.unread} onBell={() => a.go("inbox")} /><div className="page"><div className="stack-sm"><h1>{p.name}</h1><div className="row wrap"><Chip mono>{b.id}</Chip><Chip tone="emerald" icon="clock">{b.days} days left</Chip><Chip>{b.cartons} cartons · {b.where}</Chip></div></div><Plate><b>{b.routed ? "Routed" : "Nothing to do"}</b><p className="t-small muted">{b.routed || "Inside every app's date gate and selling through at " + b.sell + " packets a day. The Watcher checks it again tomorrow at 09:00."}</p></Plate></div></>;
    return <>
      <TopBar back="Sheet" onBack={() => a.go("board")} runhead={head} unread={s.unread} onBell={() => a.go("inbox")} />
      <div className="page">
        <div className="stack-sm"><h1>{p.name}</h1><div className="row wrap"><Chip mono>{b.id}</Chip><Chip tone="vermilion" icon="clock">{b.days} days left · best before {b.bestBefore}</Chip><Chip>{b.cartons} cartons · {num(b.packets)} packets</Chip><Chip icon="pin">{b.where} · shelf {b.shelf}</Chip></div></div>
        <Stages steps={["Verify", "Value", "Route", "Approve", "Execute", "Settle"]} now={current} />
        <div className="case">
          <div className="main-col">
            <LabelCard s={s} a={a} />
            <Doors s={s} />
            <Split s={s} />
            {s.stage === 3 ? <div className="approvebar"><Plate lift><div className="inner"><div className="nums"><div>You get<b>{inr(D.plan.net)}</b></div><div>Instead of<b style={{ color: "var(--vermilion-text)" }}>− {inr(D.plan.bin)}</b></div><div>GST credit safe<b style={{ color: "var(--emerald-text)" }}>{inr(D.plan.itc)}</b></div></div><Btn kind="yes" size="lg" icon="check" onClick={() => setOpen(true)}>Review and approve</Btn></div></Plate></div> : null}
            {s.stage >= 4 ? <div className="approvebar"><Plate lift><div className="inner"><Avatar person={P.priya} size="md" /><div className="grow"><div className="row wrap"><b>Approved by Priya · 09:40 · phone</b><Chip tone="chrome" solid className="stamp">APPROVED</Chip></div><div className="t-small muted">{s.stage >= 7 ? "Executed. 0 cartons binned." : "Agents are executing: listing, outreach, negotiation."}</div></div><Btn kind="primary" icon="play" onClick={() => a.go("execution", b.id)}>Watch execution</Btn></div></Plate></div> : null}
          </div>
          <aside className="stack"><AgentTimeline s={s} /></aside>
        </div>
      </div>
      <ApproveSheet open={open} onClose={() => setOpen(false)} a={a} />
    </>;
  }

  // ---------- execution ----------
  function Execution({ s, a }) {
    const PL = D.plan; const orders = D.shops.slice(0, s.orders); const packets = orders.reduce((t, o) => t + o.packets, 0);
    return <>
      <TopBar back="Batch" onBack={() => a.go("batch", HERO.id)} runhead={<RunHead parts={[{ b: HERO.id }, { b: "execution" }, { b: String(s.orders), t: "of 14 shops" }, { b: s.bid === "accepted" ? "₹14.20" : "₹15", t: s.bid === "accepted" ? "awarded" : "listed" }]} />} unread={s.unread} onBell={() => a.go("inbox")} />
      <div className="page">
        <div className="row between wrap"><h1>Execution</h1><Chip tone={s.stage >= 7 ? "emerald" : "chrome"} icon={s.stage >= 7 ? "check" : "spark"}>{s.stage >= 7 ? "done · 0 binned" : "four agents working"}</Chip></div>
        <div className="exec">
          <Plate className="stack-sm"><div className="row between"><h3>Lister · ExpireSoon</h3><Chip tone="violet" solid>201 Created</Chip></div>
            <div className="code scroll">{`POST /v1/listings\n{ "sku": "MF-MC-150", "batch": "${HERO.id}",\n  "qty": 772, "price": 15.00, "floor": 14.00,\n  "best_before": "2026-11-18", "label_photo": "gs://…/b4.jpg" }\n\n201 { "id": "ES-88213", "status": "live", "url": "/l/ES-88213" }`}</div>
            <p className="t-small muted">Mocked marketplace; the agent fills the real listing form the same way.</p>
            <Btn size="sm" icon="external" onClick={() => a.nav("buyer", "listing")}>Open the listing as Venkat</Btn></Plate>
          <Plate className="stack-sm"><div className="row between"><h3>Outreach · 38 shops</h3><Chip tone="ultra" solid icon="bell">push · Hindi</Chip></div>
            <Plate tone="chrome-soft" tight><p className="hi" style={{ fontSize: 15 }}>{D.strings.offerHindi}</p></Plate>
            <div className="g38" aria-label={s.orders + " of 38 shops ordered"}>{Array.from({ length: 38 }).map((_, i) => <b key={i} className={i < s.orders ? "lit" : ""} />)}</div>
            <div className="tilerow"><LiveTile value={s.orders} label="of 14 shops ordered" tone="emerald" /><LiveTile value={packets} label="of 588 packets" format={num} /></div>
            <div className="orders">{orders.slice(-5).reverse().map(o => <div key={o.id} className="or"><span>{o.name} <small>{o.area}</small></span><b>{o.packets}</b><small>{o.at}</small></div>)}{!orders.length ? <div className="empty t-small">{s.stage >= 5 ? "Orders arrive as shops tap the offer" : "Sends after approval"}</div> : null}</div>
            <Btn size="sm" icon="external" onClick={() => a.nav("retailer", "offers")}>Open as Ganesh ji</Btn></Plate>
          <Plate className="stack-sm"><div className="row between"><h3>Negotiator</h3><Chip tone={s.bid === "accepted" ? "emerald" : undefined} solid={s.bid === "accepted"}>{s.bid === "accepted" ? "awarded · ₹14.20" : "floor ₹14 · hidden"}</Chip></div>
            <ChatThread s={s} />
            {s.bid === "accepted" ? <div className="ledger"><div className="lrow"><span>Planned: 772 × ₹15</span><span className="v">{inr(PL.online.gross)}</span></div><div className="lrow"><span>Actual: 772 × ₹14.20</span><span className="v">{inr(PL.actualOnline.gross)}</span></div><div className="lrow sum"><span>Net recovered, actual</span><span className="v">{inr(PL.actualNet)}</span></div></div> : <Btn size="sm" icon="external" onClick={() => a.nav("buyer", "listing")}>Bid as Venkat</Btn>}</Plate>
        </div>
      </div>
    </>;
  }
  function ChatThread({ s }) {
    const msgs = s.bid === "none" ? [] : s.bid === "placed" ? [D.chat[0]] : s.bid === "countered" ? D.chat.slice(0, 2) : D.chat;
    return <div className="chat">
      {!msgs.length ? <div className="empty t-small" style={{ padding: "16px 8px" }}>Waiting for a bid. The agent counters anything under the floor and promises only what the van can keep.</div> : null}
      <AnimatePresence>{msgs.map((m, i) => <motion.div key={i} className={cx("msg", m.from === "venkat" && "me")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>{m.from === "venkat" ? <Avatar person={P.venkat} size="md" /> : <Mark size="sm" sun={false} />}<div className={cx("bub", m.from === "agent" && "ag")}>{m.text}<small>{m.from === "venkat" ? "Venkat · " + m.at : m.at}</small></div></motion.div>)}</AnimatePresence>
      {s.bid === "placed" ? <div className="msg"><Mark size="sm" sun={false} /><div className="bub ag dots" aria-label="Agent is typing"><span /><span /><span /></div></div> : null}
      {s.bid === "accepted" ? <Chip tone="emerald" icon="check">Token ₹1,644 received · balance ₹9,318 due before dispatch</Chip> : null}
    </div>;
  }

  // ---------- paperwork ----------
  function Paper({ id }) {
    if (id === "invoice") return <div className="paper"><h3>Tax invoice · INV/26-27/0931</h3><div className="row between wrap t-small"><span><b>Rakesh Traders</b><br />Kalamna Market, Nagpur 440008<br />GSTIN 27AABCR1234F1Z5</span><span><b>Sri Venkateswara Traders</b><br />Begum Bazaar, Hyderabad 500012<br />GSTIN 36AAACS9876K1Z2</span></div><table><thead><tr><th>Item</th><th>HSN</th><th className="n">Qty</th><th className="n">Rate</th><th className="n">Amount</th></tr></thead><tbody><tr><td>Munchly Masala Chips 150 g, batch MF-2409-117, BB 18 Nov 2026</td><td>2005</td><td className="n">772</td><td className="n">14.20</td><td className="n">10,962.40</td></tr><tr><td colSpan="4">IGST 12% (inter-state, Maharashtra → Telangana)</td><td className="n">1,315.49</td></tr><tr><td colSpan="4"><b>Total</b></td><td className="n"><b>12,277.89</b></td></tr></tbody></table><p className="t-small muted" style={{ marginTop: 8 }}>E-way bill not required: consignment under ₹50,000. Token ₹1,644 received 2 Oct; balance ₹9,318 before dispatch.</p><div style={{ marginTop: 12 }}><Chip tone="emerald" icon="check">Token received · balance due before dispatch</Chip></div></div>;
    if (id === "itc") return <div className="paper"><h3>GST input credit memo · indicative</h3><p>Batch MF-2409-117: 1,360 packets sold through ExpireSoon (772) and the Nagpur kirana scheme (588). No goods were destroyed, written off or disposed of; CGST Act s.17(5)(h) reversal does not apply.</p><table><tbody><tr><td>Input credit on stock (1,360 × ₹16 × 12%)</td><td className="n">2,611.20</td></tr><tr><td>Reversal required in GSTR-3B</td><td className="n">0.00</td></tr></tbody></table><p className="t-small muted" style={{ marginTop: 8 }}>Indicative treatment based on Circular 72/46/2018; confirm with the company's GST adviser.</p><div style={{ marginTop: 12 }}><Chip tone="emerald" icon="check">Input credit kept · ₹2,611</Chip></div></div>;
    const d = D.docs.find(x => x.id === id); return <div className="paper"><h3>{d.title} · {d.no}</h3>{d.lines.map(l => <p key={l}>{l}</p>)}<p style={{ marginTop: 8 }}><b>{d.total}</b></p></div>;
  }
  function Paperwork({ s, a, who = "anita" }) {
    const [open, setOpen] = useState(null); const [busy, setBusy] = useState(false);
    const prep = () => { setBusy(true); setTimeout(() => { setBusy(false); a.generatePapers(); }, 1500); };
    return <>
      <TopBar who={P[who]} runhead={<RunHead parts={[{ b: HERO.id }, { b: "papers" }, { b: s.stage >= 8 ? "4" : "0", t: "of 4 ready" }]} />} unread={s.unread} onBell={() => a.go("inbox")} />
      <div className="page">
        <div className="row between wrap"><h1>Paperwork</h1>{s.stage >= 8 ? <Chip tone="emerald" icon="check">pack ready · day 3</Chip> : <Chip icon="clock">{s.stage >= 7 ? "stock moved · ready to prepare" : "waits for the stock to move"}</Chip>}</div>
        {s.stage < 7 ? <div className="docs">{[0, 1, 2, 3].map(i => <div key={i} className="doc" aria-hidden="true"><div className="dh"><span>&nbsp;</span></div><div className="db"><Skeleton h={18} w="60%" /><Skeleton /><Skeleton w="80%" /><Skeleton h={24} w="40%" /></div><div className="df">&nbsp;</div></div>)}</div> : null}
        {s.stage < 7 ? <p className="t-small muted">The Paperwork agent drafts the invoice, the credit note, the e-way bill check and the ITC memo once the cartons have left the godown. Nothing to chase.</p> : null}
        {s.stage === 7 ? <Plate tone="chrome-soft"><div className="row wrap"><div className="grow"><b>Cartons dispatched. Prepare the document pack?</b><p className="t-small muted">Invoice to Hyderabad, credit note for the shop scheme, e-way bill check, GST memo.</p></div><Btn kind="primary" icon="file" loading={busy} onClick={prep}>Prepare the pack</Btn></div></Plate> : null}
        {s.stage >= 8 ? <div className="docs stagger">{D.docs.filter(d => d.id !== "fssai").map(d => <button type="button" key={d.id} className={cx("doc", d.status === "not required" && "na")} onClick={() => setOpen(d.id)}><div className="dh"><span>{d.short}</span><span className="mono" style={{ letterSpacing: 0, fontSize: 11 }}>{d.no}</span></div><div className="db">{d.lines.map(l => <div key={l} className="dl">{l}</div>)}<div className="dt">{d.total}</div><Chip tone={d.status === "generated" ? "emerald" : undefined} icon={d.status === "generated" ? "check" : "minus"}>{d.status}</Chip></div><div className="df">Preview</div></button>)}</div> : null}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Preview" footer={<Btn icon="download" onClick={() => setOpen(null)}>Download PDF</Btn>}>{open ? <Paper id={open} /> : null}</Sheet>
    </>;
  }

  // ---------- ledger: finance & ESG ----------
  function downloadCSV() { const rows = [["Category", "Generated", "Recycled", "Diverted from landfill", "Evidence"], ...D.ledger.brsr]; const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const u = URL.createObjectURL(blob); const el = document.createElement("a"); el.href = u; el.download = "brsr-principle-6-q3-fy27.csv"; el.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }
  function Ledger({ s, a, who = "anita", focus = "money" }) {
    const Q = D.ledger.quarter; const [busy, setBusy] = useState(false);
    const write = () => { setBusy(true); setTimeout(() => { setBusy(false); a.closeLedger(); }, 1200); };
    return <>
      <TopBar who={P[who]} runhead={<RunHead parts={[{ b: "Q3 FY27" }, { b: String(Q.batches), t: "batches routed" }, { b: "₹6.3 L", t: "recovered" }, { b: "5.7 t", t: "kept out of landfill" }]} />} unread={s.unread} onBell={() => a.go("inbox")} />
      <div className="page">
        <div className="row between wrap"><h1>{focus === "esg" ? "Impact" : "Ledger"}</h1><Chip>{Q.batches} batches routed this quarter</Chip></div>
        <div className="case"><div className="main-col">
          <Plate className="stack-sm"><div className="row between wrap"><h3>This batch · {HERO.id}</h3>{s.stage >= 8 ? <Chip tone="emerald" icon="check">closed · day 3</Chip> : <Chip icon="clock">open</Chip>}</div>{s.stage >= 8 ? <div className="ledger">{D.ledger.batch.map(([k, v, t]) => <div key={k} className={cx("lrow", t)}><span>{k}</span><span className="v">{v}</span></div>)}</div> : <p className="t-small muted">Closes when the document pack is ready. Both readings of the same event land here: the money reading for finance and the waste reading for sustainability.</p>}{s.stage >= 8 ? <p className="t-xs muted">Evidence: tax invoice INV/26-27/0931 · ExpireSoon listing ES-88213 · 14 shop orders · credit note CN/0117 · ITC memo.</p> : null}</Plate>
          <Plate className="stack-sm"><h3>BRSR Principle 6 · waste (Q3 FY27)</h3><div className="tablewrap"><table className="table"><thead><tr><th>Category</th><th className="n">Generated</th><th className="n">Recycled</th><th className="n">Diverted</th><th>Evidence</th></tr></thead><tbody>{D.ledger.brsr.map(r => <tr key={r[0]}><td>{r[0]}</td><td className="n">{r[1]}</td><td className="n">{r[2]}</td><td className="n">{r[3]}</td><td className="t-small muted">{r[4]}</td></tr>)}</tbody></table></div>
            <div className="row wrap">{focus === "esg" && s.stage === 8 ? <Btn kind="yes" icon="check" loading={busy} onClick={write}>Write this batch's row</Btn> : null}{s.stage >= 9 ? <Chip tone="emerald" solid icon="check">MF-2409-117 · 217.6 kg · row written with 4 evidence links</Chip> : null}<Btn icon="download" onClick={downloadCSV}>Export BRSR table (CSV)</Btn></div></Plate>
        </div><aside className="stack">
          <Plate className="stack-sm"><h3>Quarter so far</h3>
            <div className="hbar"><span>Recovered</span><motion.i className="m" initial={{ width: 0 }} animate={{ width: "86%" }} transition={{ duration: 1 }} /><b>₹6.3 L</b></div>
            <div className="hbar"><span>GST credit kept</span><motion.i className="m" initial={{ width: 0 }} animate={{ width: "30%" }} transition={{ duration: 1, delay: 0.1 }} /><b>₹79 k</b></div>
            <div className="hbar"><span>Waste avoided</span><motion.i initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ duration: 1, delay: 0.2 }} /><b>5.7 t</b></div>
            <div className="hbar"><span>Meals</span><motion.i initial={{ width: 0 }} animate={{ width: "40%" }} transition={{ duration: 1, delay: 0.3 }} /><b>3,700</b></div>
            <p className="t-xs muted">{Q.batches} batches routed · net of costs · ITC indicative</p></Plate>
          <Plate tone="emerald-soft" className="t-small"><b>How the waste number is built</b><p className="muted">cartons × gross weight (chips 3.84 kg a carton) for every batch sold, donated or staff-sold instead of destroyed; each row links its invoice, listing, shop orders or food-bank receipt.</p></Plate>
        </aside></div>
      </div>
    </>;
  }

  // ---------- inbox ----------
  function Inbox({ s, a, role }) {
    const items = s.inbox.filter(n => n.role === role);
    return <>
      <TopBar back="Back" onBack={() => a.go(D.roles.find(r => r.id === role).nav[0].id)} />
      <div className="page"><h1>Inbox</h1>
        {!items.length ? <Plate><Empty icon="bell" title="No notifications yet" body="Pushes from the agents land here, newest first." /></Plate> : <div className="stack-sm stagger">{items.map(n => <Plate key={n.id} as="button" type="button" tone={n.read ? undefined : "ultra-soft"} className="inboxitem" onClick={() => { a.read(n.id); n.go && n.go(); }}><Mark size="sm" sun={false} /><div className="grow"><div className="row between"><b>{n.title}</b><span className="t-xs muted mono">{n.at}</span></div><div className={cx("t-small", n.hindi && "hi")}>{n.body}</div></div>{!n.read ? <Chip tone="chrome" solid>new</Chip> : null}</Plate>)}</div>}
      </div>
    </>;
  }

  window.SC_DEMO = Object.assign(window.SC_DEMO || {}, { SignIn, Board, RouteRoom, Execution, ChatThread, Paperwork, Ledger, Inbox, HERO, stateOf });
})();

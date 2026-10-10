// Smart-Clearance v3 · brand screens: S0 Setup, S1 Command Center, S2 Route Room, S3 Execution, Batches
(function () {
  const { useState, useEffect, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Tabs, Sheet, DataTable, Product, Empty, Progress, Money, Roll, DaysNum, GateChips, Tile, Aura, Tracker, VTracker, AgentFeed, ClusterMap, HaulLine, ChannelBars, MixBar, CodeBlock, TrackerCard, TrackerCompact, BatchRow, ChannelTable, SplitBar, MoneyPanel, StatusBadge, useApp, useNotice } = K;
  const { useStore, useRoute, heroModel, Screen, Columns, SectionTitle, Locked } = S;
  const CH_NAMES = D.SETUP.channelNames;
  const ES = D.PLAN.lines.find(l => l.id === "expiresoon"), KL = D.PLAN.lines.find(l => l.id === "kirana");
  const SHOPS = D.KIRANAS.length;
  const Pass = ({ children }) => children;
  const HERO = D.BATCHES.find(b => b.hero);
  const possessive = n => (/s$/.test(n) ? `${n}'` : `${n}'s`);

  /* ---------- S0 Setup ---------- */
  const FLOOR_ROWS = [["snacks", "Snacks", "chips"], ["biscuits", "Biscuits", "biscuits"], ["staples", "Staples", "poha"], ["beverages", "Beverages", "mango"], ["personal-care", "Personal care", "facewash"]];
  // a distributor's one-time permission, as the store holds it
  function permissionOf(s, id) {
    if (id === "rakesh") { const p = s.setup.permission; return p ? (p.paused ? { tone: "amber", label: "paused" } : { tone: "green", label: "granted · " + p.at }) : { tone: undefined, label: "requested" }; }
    return D.SETUP.permissions[id] ? { tone: "green", label: "granted · " + D.SETUP.permissions[id] } : { tone: undefined, label: "requested" };
  }
  // the DMS export's card (SC-79): before the first mapping it says so, keeps the fields the Data agent looks for, and
  // offers the upload; while the Data agent reads one it says that; once mapped it is the card as designed
  function ExportCard({ phase, done, live, exp, onChoose, fileRef, pick, nextRun }) {
    const mapped = phase === "mapped", reading = phase === "mapping", waiting = phase === "waiting"; const n = D.SETUP.dms.columns.length;
    const title = mapped ? D.SETUP.dms.file : reading ? exp.name : "No stock export mapped yet";
    const sub = mapped ? `Bizom-style DMS export · ${D.SETUP.dms.rows} batches · ${Object.keys(D.DISTRIBUTORS).length} distributors` : reading ? "The Data agent is reading its columns" : `The Data agent maps your distributors' first export, then loads ${D.SETUP.dms.salesDays} days of sell-through`;
    const status = done ? <Badge tone="green" icon="check">Loaded into BigQuery</Badge> : mapped ? <Badge dot>Mapped · confirm below</Badge> : reading ? <Badge tone="blue" dot>Mapping</Badge> : <Badge dot>Waiting for an export</Badge>;
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight" style={{ minWidth: 0 }}><span className={cx("icontile", !mapped && "soft")}><Icon name="file-spreadsheet" size={17} stroke={2} /></span><span className="stack tight" style={{ gap: 0, minWidth: 0 }}><b style={{ overflowWrap: "anywhere" }}>{title}</b><span className="t-footnote subtle">{sub}</span></span></span><span className="row tight wrap">{live && !reading && <><Button size="sm" variant={waiting ? "primary" : undefined} icon="upload" onClick={onChoose}>Upload an export</Button><input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={pick} /></>}{status}</span></div>
      <div className="table-wrap" style={{ boxShadow: "none" }} tabIndex={0} role="region" aria-label="Field mapping"><table className="table"><thead><tr><th>Smart-Clearance field</th><th>Column in your file</th><th>Status</th></tr></thead><tbody>
        {D.SETUP.dms.columns.map(([f, c]) => <tr key={f}><td className="strong">{f.replace("_", " ")}</td><td className={mapped ? "mono" : "subtle"}>{mapped ? c : reading ? "reading…" : "not mapped yet"}</td><td>{mapped ? <Badge size="sm" tone="green" icon="check">mapped</Badge> : reading ? <Badge size="sm" tone="blue" dot>mapping</Badge> : <Badge size="sm" dot>waiting</Badge>}</td></tr>)}
      </tbody></table></div>
      <div className="row tight t-footnote muted"><Aura on={!done && !waiting} className="icontile soft" style={{ width: 26, height: 26, borderRadius: 8 }}><Icon name="database" size={14} /></Aura>{mapped ? `Data Agent mapped ${n} of ${n} columns and back-filled ${D.SETUP.dms.salesDays} days of sell-through by pincode and by shop.` : reading ? "Data Agent is matching the file's columns to these fields." : <span>Upload an export now, or the Data Agent maps the day's export at its run at <b className="tnum">{nextRun}</b>.</span>}</div>
    </Card>;
  }
  function Setup({ me, onConfirm }) {
    const s = useStore(); const { go } = useRoute(); const app = useApp(); const { toast } = useNotice();
    const [floors, setFloors] = useState(s.rules.floors); const [taps, setTaps] = useState(s.rules.approvalTaps); const [busy, setBusy] = useState(false);
    const [ret, setRet] = useState(s.rules.returnWindowDays); const [uplift, setUplift] = useState(s.rules.kiranaUplift); const [van, setVan] = useState(s.rules.vanPerUnit);
    const done = s.setup.confirmed;
    const confirm = () => { setBusy(true); setTimeout(() => { setBusy(false); Flow.act("connect"); toast({ text: "Setup confirmed · the Watcher starts at 09:00", tone: "ok" }); onConfirm && onConfirm(); }, 900); };
    const chans = D.SETUP.channels; const wo = D.PLAN.writeOff; const chips = D.SKUS.chips;
    // live (SC-73): a new stock export goes straight to the workspace's storage, its progress shown as it goes
    const live = S.useLive(); const [exp, setExp] = useState({ name: D.SETUP.dms.file, size: 4.8e6 }); const fileRef = React.useRef(null);
    // SC-79: a live workspace starts (and a reset leaves it) with no export mapped. Until the Data agent has mapped one,
    // the card says so and Confirm waits; here the Data agent's mapping is simulated once the upload lands
    const [reading, setReading] = useState(false);
    const pick = e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return; setExp({ name: f.name, size: f.size }); live.uploadExport(() => { setReading(true); toast({ text: "Export uploaded · the Data agent is mapping its columns", tone: "ok" }); setTimeout(() => { Store.update(st => { st.setup.mapped = D.SETUP.dms.columns.length; }); setReading(false); toast({ text: `The Data agent mapped ${D.SETUP.dms.columns.length} of ${D.SETUP.dms.columns.length} columns`, tone: "ok", icon: "database" }); }, 1800); }); };
    const uploading = live && live.uploads.dms != null;
    const mapped = done || !live || s.setup.mapped > 0;
    const phase = mapped ? "mapped" : uploading ? "uploading" : reading ? "mapping" : "waiting";
    const choose = () => fileRef.current && fileRef.current.click();
    return <Screen me={me} title="Setup" sub="Connect the stock data once and set the rules the agents must obey">
      <div className="stack" style={{ gap: 20 }}>
        {uploading && <S.Live.ExportUpload name={exp.name} size={exp.size} p={live.uploads.dms} onCancel={() => live.cancelUpload("dms")} />}
        {phase !== "uploading" && <ExportCard phase={phase} done={done} live={!!live} exp={exp} onChoose={choose} fileRef={fileRef} pick={pick} nextRun={`${s.rules.dataTime} ${live && live.clock.time < s.rules.dataTime ? "today" : "tomorrow"}`} />}
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: app.bp === "desktop" ? "repeat(2, minmax(0,1fr))" : "minmax(0,1fr)", alignItems: "start" }}>
          <div className="stack" style={{ gap: 20 }}>
            <List head="Floor price by category" foot="No channel may sell below its category's floor.">
              {FLOOR_ROWS.map(([k, l, sku]) => <ListRow key={k} title={l} sub={`${fmt.inr2(D.SKUS[sku].mrp * floors[k] / 100)} on a ₹${D.SKUS[sku].mrp} pack`} value={<Stepper value={floors[k]} onChange={v => setFloors({ ...floors, [k]: v })} min={20} max={70} step={5} label={"Floor for " + l} format={v => v + "%"} />} />)}
            </List>
            <List head="Territory guard" foot="ExpireSoon listings are hidden from buyers inside these territories, matched by pincode, so clearance stock never undercuts a Munchly distributor.">
              {Object.values(D.DISTRIBUTORS).map(d => <ListRow key={d.id} icon="map-pin" iconTone="gray" title={d.territory} sub={`${d.name} · pincodes ${d.pins}…`} />)}
              <ListRow title="Hide listings inside the territories" value={<Switch checked={s.rules.territoryGuard} onChange={() => {}} label="Territory guard" />} />
            </List>
            <List head="Approval policy" foot="After that the agents run inside the guardrails and report.">
              <ListRow icon="shield-check" iconTone="blue" title="Routes per channel that need a tap" value={<Stepper value={taps} onChange={setTaps} min={1} max={50} label="routes" />} />
              <ListRow icon="ban" iconTone="red" title="Personal care never goes to food banks" value={<Switch checked onChange={() => {}} label="Personal care never to food banks" />} />
              <ListRow icon="gift" iconTone="amber" title="Premium gift packs never go to a staff sale" value={<Switch checked onChange={() => {}} label="Gift packs never to staff sale" />} />
            </List>
          </div>
          <div className="stack" style={{ gap: 20 }}>
            <Card className="stack snug">
              <span className="card-title">Channel allow-list</span>
              <div className="table-wrap" style={{ boxShadow: "none" }} tabIndex={0} role="region" aria-label="Channel rules by category"><table className="table"><thead><tr><th>Category</th>{chans.map(c => <th key={c} style={{ textAlign: "center" }}>{CH_NAMES[c]}</th>)}</tr></thead><tbody>
                {D.SETUP.allowList.map(([cat, ok]) => <tr key={cat}><td className="strong" style={{ textTransform: "capitalize" }}>{cat.replace("-", " ")}</td>{chans.map(c => <td key={c} style={{ textAlign: "center" }}>{ok.includes(c) ? <Icon name="circle-check" size={18} title="Allowed" style={{ color: "var(--primary-text)", margin: "0 auto" }} /> : <Icon name="circle-x" size={18} title="Never" style={{ color: "var(--fg-3)", margin: "0 auto" }} />}</td>)}</tr>)}
              </tbody></table></div>
              <span className="t-footnote subtle">Discount D2C applies only to Munchly's own warehouse stock. A distributor's stock is his, so it never goes to Munchly's own site.</span>
            </Card>
            <List head="Distributors' one-time permission" foot="Each distributor lets the agent list his Munchly stock, offer schemes to his kiranas, draft his invoices and book dispatch slots, inside Munchly's floors. He can pause it at any time.">
              {Object.values(D.DISTRIBUTORS).map(d => { const p = permissionOf(s, d.id); return <ListRow key={d.id} icon="handshake" iconTone={p.tone === "green" ? undefined : "gray"} title={d.name} sub={d.city} value={<Badge size="sm" tone={p.tone} dot={!p.tone}>{p.label}</Badge>} />; })}
            </List>
            {!s.setup.permission && <S.PlayAs who="rakesh" route="home">Give the permission as Rakesh bhai</S.PlayAs>}
            <List head="Scheme returns and planning" foot="The uplift and the van rate are planning assumptions. The return window lets returned packs reach the godown in time for a staff sale or a food bank.">
              <ListRow title="Kiranas may return scheme packs until" sub={`${fmt.day(D.addDays(D.BATCHES[0].bestBefore, -ret))} for this batch`} value={<Stepper value={ret} onChange={setRet} min={15} max={30} label="days before best-before" format={v => v + " days before"} />} />
              <ListRow title="Scheme uplift on normal sales" value={<Stepper value={uplift} onChange={v => setUplift(Math.round(v * 10) / 10)} min={2} max={5} step={0.5} label="Scheme uplift" format={v => v.toFixed(1) + "×"} />} />
              <ListRow title="Van rate, a unit" value={<Stepper value={van} onChange={v => setVan(Math.round(v * 100) / 100)} min={0.25} max={2} step={0.25} label="Van rate" format={v => "₹" + v.toFixed(2)} />} />
            </List>
            <div className="stack snug">{D.SETUP.partners.map(p => <Card key={p.name} className="stack tight"><div className="card-head"><span className="row tight"><span className="icontile red"><Icon name="heart-handshake" size={17} stroke={2} /></span><b>{p.name}</b></span><Badge tone="green" icon="check">partner</Badge></div><span className="t-footnote muted">{p.minDays}+ days left · at least {p.minUnits} units · {p.logistics}</span><span className="t-caption subtle">{p.paper}</span></Card>)}</div>
          </div>
        </div>
        <Card className="stack snug" style={{ background: "var(--surface)" }}>
          <div className="card-head"><span className="card-title">The true cost of a write-off</span><Badge tone="red" icon="trash-2">shown before any batch is routed</Badge></div>
          <div className="row wrap" style={{ gap: 10, alignItems: "stretch" }}>
            {[["Stock at cost", chips.cost], ["GST credit reversed", wo.itcPerUnit], ["Disposal", M.RULES.disposalPerUnit], ["EPR, indicative", chips.kgPerUnit * M.RULES.eprPerKg]].map(([k, v], i) => <Fragment key={k}>{i > 0 && <span className="center subtle" style={{ fontSize: 20 }} aria-hidden="true">+</span>}<div className="tile" style={{ minWidth: 130, flex: "1 1 130px" }}><span className="tl-label">{k}</span><span className="num s neg">{fmt.inr2(v)}</span></div></Fragment>)}
            <span className="center subtle" style={{ fontSize: 20 }} aria-hidden="true">=</span>
            <div className="tile" style={{ minWidth: 150, flex: "1 1 150px", boxShadow: "0 0 0 1.5px color-mix(in oklab, var(--red) 45%, transparent)" }}><span className="tl-label">Destroying, a unit</span><Money value={-wo.perUnit} size="s" decimals style={{ color: "var(--red-text)" }} /></div>
          </div>
          <span className="t-footnote subtle">For Masala Chips 150 g: cost ₹{chips.cost}; {fmt.inr2(wo.itcPerUnit)} of input GST a packet from the cost sheet (chips are at {Math.round(chips.gst * 100)}% GST since GST 2.0); disposal {fmt.inr2(M.RULES.disposalPerUnit)} a unit; EPR ₹{M.RULES.eprPerKg} a kilo of product and pack. Factors marked indicative are editable here.</span>
        </Card>
        <div className="row wrap" style={{ gap: 10 }}>{done ? <><Badge tone="green" icon="check">Watching since setup</Badge><Button variant="primary" iconRight="arrow-right" onClick={() => go("command")}>Open Command Center</Button></> : <><Button variant="primary" size="lg" icon="check" loading={busy} disabled={!mapped} aria-describedby={mapped ? undefined : "setup-why"} onClick={confirm}>Confirm and start watching</Button>{!mapped && <span id="setup-why" className="setup-why"><Icon name="info" size={15} stroke={2.2} />Confirm once the Data agent has mapped an export.</span>}</>}</div>
      </div>
    </Screen>;
  }

  /* ---------- S1 Command Center ---------- */
  // the first viewport is the batch, tracked like an order: tracker first, the agents beside it, the cluster under it
  function CommandCenter({ me, onOpenRoute }) {
    const s = useStore(); const { go } = useRoute(); const app = useApp(); const hm = heroModel(s); const phone = app.bp === "phone";
    const [sel, setSel] = useState(null); const [dz, setDz] = useState(false);
    const views = useMemo(() => D.BATCHES.map(b => { const v = D.batchView(b); if (b.hero) v.phase = hm.view.phase; if (b.second) v.phase = "executing"; return v; }), [s.seq]);
    const watchlist = views.filter(v => !(v.hero && s.hero.phase === "watching")).sort((a, b) => (a.phase === "at-risk" || (!a.phase && a.assess.status === "at-risk") ? -1 : 0) - (b.phase === "at-risk" || (!b.phase && b.assess.status === "at-risk") ? -1 : 0) || a.daysLeft - b.daysLeft);
    const openRoute = () => (onOpenRoute ? onOpenRoute() : go("route"));
    // every row opens its batch's page (SC-112), on the screen for where the batch stands
    const journeys = journeyItems(s, null); const openBatch = ref => { const it = journeys.find(i => i.ref === ref); go(partAt(it), { ref }); };
    const dzWaits = s.hero.destruction && s.hero.destruction.status === "checked";
    const primary = dzWaits ? <Button variant="approve" icon="check" onClick={() => setDz(true)}>Review the destruction</Button> : s.hero.phase === "planned" ? <Button variant="approve" icon="check" onClick={openRoute}>Review and approve</Button> : ["approved", "executing"].includes(s.hero.phase) ? <Button variant="primary" iconRight="arrow-right" onClick={() => go("execution", { ref: s.hero.id })}>Watch execution</Button> : <Button variant="primary" iconRight="arrow-right" onClick={openRoute}>Open Route Room</Button>;
    const flagged = s.hero.phase !== "watching" && s.setup.confirmed;
    const routed = ["approved", "executing", "dispatched", "settled", "cleared"].includes(s.hero.phase);
    const perm = s.setup.permission;
    const money = s.hero.plan ? <div className="stack tight" style={{ gap: 2 }}><Money value={s.hero.posted ? D.ACTUAL.net : D.PLAN.net} size={phone ? "s" : "m"} roll style={{ color: "var(--primary-text)" }} /><span className="t-footnote subtle">{s.hero.posted ? "recovered, after the negotiation" : routed ? "on plan · settles day 3–7" : "net recovered on the plan"} · swing {fmt.inr(s.hero.posted ? D.ACTUAL.swing : D.PLAN.swing)}</span></div> : undefined;
    // the stock export mapped (on the live workspace once the console or Setup has an export mapped; SC-84): what is
    // left before the Watcher starts is the operator's yes to the guardrails
    const ready = !S.useLive() || s.setup.mapped > 0;
    const tracker = flagged ? <TrackerCard view={hm.view} done={hm.done} current={hm.current} eta={perm && perm.paused ? "Paused by Rakesh bhai" : hm.eta} etaTone={perm && perm.paused ? "amber" : hm.etaTone} agentLive={perm && perm.paused ? "" : hm.agentLive} primary={primary} money={money}
      line={s.hero.phase === "cleared" ? (s.hero.destruction ? `${fmt.num(D.PLAN.units - s.hero.destruction.units)} of ${fmt.num(D.PLAN.units)} units placed; ${fmt.num(s.hero.destruction.units)} expired and were destroyed at ${D.DISTRIBUTORS[HERO.distributor].godown}, on your yes.` : `All ${fmt.num(D.PLAN.units)} units placed: ${KL.units} with ${SHOPS} kiranas, ${ES.units} with a ${D.BUYER.city} wholesaler. Nothing went to the bin.`) : undefined} />
      : <Card><Empty img="sprout-box" title={!s.setup.confirmed ? (ready ? "Confirm Setup to start watching" : "Connect your stock data to start") : !perm ? "Waiting for Rakesh Traders' permission" : "Nothing at risk yet"} body={!s.setup.confirmed ? (ready ? `Your distributors' stock export is mapped: ${fmt.num(D.SETUP.dms.rows)} batches from ${Object.keys(D.DISTRIBUTORS).length} distributors. Review the guardrails and confirm; the Watcher checks at ${s.rules.watchTime} the next morning.` : `Upload the distributor export once and set the guardrails. It takes about ${D.SETUP.minutes} minutes; the Watcher starts the next morning.`) : !perm ? "Rakesh bhai's stock is listed and offered in his name, so he gives a one-time permission in his app first. He can pause it at any time." : "The Watcher checks every batch against the quick-commerce gates and sell-through at 09:00. You get a push the moment one cannot make it."} action={!s.setup.confirmed ? <Button variant="primary" iconRight="arrow-right" onClick={() => go("setup")}>{ready ? "Review and confirm" : "Open Setup"}</Button> : !perm ? <S.PlayAs who="rakesh" route="home">Give the permission as Rakesh bhai</S.PlayAs> : null} /></Card>;
    const cluster = flagged && <Card pad={false} className="stack" style={{ overflow: "hidden", gap: 0 }}>
      <div className="card-head" style={{ padding: "14px 16px 10px" }}><span className="card-title">Nagpur cluster</span><Badge size="sm" tone={hm.ordered ? "green" : undefined} dot={!!hm.ordered} live={hm.ordered > 0 && hm.ordered < SHOPS}>{hm.ordered ? `${hm.ordered} of ${D.OFFERED} kiranas ordered` : s.hero.offer ? `${D.OFFERED} kiranas messaged` : `${D.OFFERED} kiranas`}</Badge></div>
      <ClusterMap kiranas={D.KIRANAS} orderedCount={hm.ordered} route={routed} vanProgress={s.hero.van.status === "done" ? 1 : hm.ordered / SHOPS * 0.6} height={phone ? 220 : 280} />
    </Card>;
    const feed = <div className="stack snug"><SectionTitle sub="Every hand-off, as it happens">Agent activity</SectionTitle><Card>{s.feed.length ? <AgentFeed events={s.feed} people={D.PEOPLE} live={hm.agentLive ? s.feed.length - 1 : -1} max={phone ? 3 : 6} /> : <span className="t-footnote muted">The agents report here once the Watcher runs.</span>}</Card></div>;
    const list = <div className="stack snug"><SectionTitle sub="Sorted by days to best-before; at-risk batches first">Watchlist</SectionTitle><div className="list">{watchlist.map(v => <BatchRow key={v.id} view={v} selected={sel === v.id} compact={phone} onOpen={() => { setSel(v.id); openBatch(v.id); }} />)}</div></div>;
    const live = S.useLive();
    if (live) return <LiveCommandCenter me={me} live={live} hm={hm} money={money} watchlist={watchlist} sel={sel} setSel={setSel} feed={feed} cluster={cluster} />;
    return <Screen me={me} title="Command Center" sub={flagged ? `${D.JOURNEY.today} · Watcher checked 312 batches at 09:00` : "Watcher runs daily at 09:00 across 312 batches"}>
      {app.bp === "desktop" ? <Columns sideWidth={340} main={<>{tracker}{cluster}{list}</>} side={feed} />
        : <div className="stack" style={{ gap: 20 }}>{tracker}{feed}{list}{cluster}</div>}
      <DestructionSheet open={dz && !!s.hero.destruction} onClose={() => setDz(false)} d={s.hero.destruction} x={s.hero.expiry} dist={D.DISTRIBUTORS[HERO.distributor]} sku={D.SKUS[HERO.sku]} batch={HERO} />
    </Screen>;
  }
  // the Command Center on the live workspace (SC-73, SC-68 option B): the flagged batches as tabs over the tracker card,
  // grey while updates are paused, and a quiet day when nothing is at risk. The date moves into the live line
  function LiveCommandCenter({ me, live, hm, money, watchlist, sel, setSel, feed, cluster }) {
    const s = useStore(); const { go } = useRoute(); const app = useApp(); const phone = app.bp === "phone"; const L = S.Live;
    const dim = L.down(live.conn); const offline = live.conn === "offline"; const items = L.flaggedItems(s, live);
    const watch = s.rules.watchTime; const rows = D.SETUP.dms.rows;
    const openRoute = ref => go("route", { ref });
    const primary = s.hero.phase === "planned" ? <Button variant="approve" icon="check" disabled={offline} onClick={() => openRoute(items[0].ref)}>Review and approve</Button> : ["approved", "executing"].includes(s.hero.phase) ? <Button variant="primary" iconRight="arrow-right" onClick={() => go("execution", { ref: s.hero.id })}>Watch execution</Button> : <Button variant="primary" iconRight="arrow-right" onClick={() => openRoute(items[0].ref)}>Open Route Room</Button>;
    const hero = <L.Dim on={dim}><TrackerCard view={hm.view} done={hm.done} current={hm.current} eta={dim ? L.pausedWords(live) : hm.eta} etaTone={dim ? "gray" : hm.etaTone} agentLive={dim ? "" : hm.agentLive} primary={primary} money={money} /></L.Dim>;
    const top = live.quiet ? <L.Quiet /> : items.length > 1 ? <L.Flagged items={items}>{it => (it.hero ? hero : <L.MangoCard item={it} dim={dim} />)}</L.Flagged> : hero;
    const list = <div className="stack snug"><SectionTitle sub={live.quiet ? "Every batch clears inside its date at today's sell-through" : "Flagged batches first, then by days to best-before"}>Watchlist</SectionTitle><div className="list">{watchlist.map(v => <BatchRow key={v.id} view={v} selected={sel === v.id} compact={phone} onOpen={() => { setSel(v.id); const it = journeyItems(s, live).find(i => i.ref === v.id); go(partAt(it), { ref: v.id }); }} />)}</div></div>;
    const side = <L.Dim on={dim}>{feed}</L.Dim>;
    const map = !live.quiet && cluster;
    return <Screen me={me} title="Command Center" sub={`Watcher checked ${rows} batches at ${watch} · ${live.quiet ? "nothing flagged" : items.length + " flagged"}`}>
      {app.bp === "desktop" ? <Columns sideWidth={340} main={<>{top}{map}{list}</>} side={side} />
        : <div className="stack" style={{ gap: 20 }}>{top}{side}{list}{map}</div>}
    </Screen>;
  }

  /* ---------- S2 Route Room ---------- */
  // the carton on shelf B4, with its label printed in type so it stays legible at any size
  function LabelShot({ cover, dim, children }) {
    return <div className={cx("lshot", cover && "cover")} style={dim ? { filter: "saturate(0.85) brightness(0.94)" } : undefined}>
      <img src={(window.SC3_IMG || "system/img/") + "label-shot.webp"} alt="" />
      <div className="lshot-label" aria-hidden="true"><b>MUNCHLY</b><span className="ls-prod">Masala Chips 150 g</span><span>BATCH&nbsp; MF-2409-117</span><span>MFG&nbsp; 18 MAY 2026</span><span>BEST BEFORE&nbsp; 18 NOV 2026</span><span>MRP ₹30.00 incl. of all taxes</span><span>24 × 150 g</span></div>
      {children}
    </div>;
  }
  function LabelPhoto({ status }) {
    const reduce = useReducedMotion();
    return <div role="img" aria-label={status === "verified" ? "Carton label on shelf B4: batch MF-2409-117, MFG 18 May 2026, best before 18 Nov 2026, MRP ₹30.00" : "Carton label, not yet photographed"} style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", background: "var(--surface-sunken)" }}>
      <LabelShot dim={status !== "verified"} />
      {status === "reading" && !reduce && <motion.div aria-hidden="true" initial={{ top: "18%" }} animate={{ top: ["18%", "78%", "18%"] }} transition={{ duration: 1.6, repeat: 2, ease: "easeInOut" }} style={{ position: "absolute", left: "10%", right: "10%", height: 3, borderRadius: 3, background: "var(--glow)", boxShadow: "0 0 18px var(--glow)" }} />}
      {status === "verified" && <span style={{ position: "absolute", left: 10, bottom: 10 }}><Badge solid tone="green" icon="check">Verified · Gemini vision · 0.97</Badge></span>}
      {(status === "requested" || status === "none") && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "color-mix(in oklab, var(--bg) 55%, transparent)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}><div className="stack tight" style={{ justifyItems: "center", textAlign: "center", padding: 16 }}><Avatar person={D.PEOPLE.rakesh} size="lg" /><b>{status === "requested" ? "Waiting for Rakesh bhai's photo" : "No label photo yet"}</b><span className="t-footnote muted">{status === "requested" ? "Asked at 09:05 · one carton on shelf B4" : "Vision asks the godown before quoting any price"}</span>{status === "requested" && <S.PlayAs who="rakesh" route="photo">Take the photo as Rakesh bhai</S.PlayAs>}</div></div>}
    </div>;
  }
  function ApproveSheet({ open, onClose, me }) {
    const { go } = useRoute(); const hero = useStore().hero; const [busy, setBusy] = useState(false); const [placed, setPlaced] = useState(false); const reduce = useReducedMotion();
    const s = S.useStore(); const approvedNow = !!(s.hero.plan && s.hero.plan.status === "approved");
    useEffect(() => { if (open) setPlaced(approvedNow); }, [open]);
    useEffect(() => { if (open && approvedNow) setPlaced(true); }, [approvedNow]);
    // live (SC-73): the approval goes to the workspace's backend, which may not answer; the sheet says so and offers Retry.
    // Offline, approving waits for a connection
    const live = S.useLive(); const failed = live && live.failed && live.failed.action === "approve" ? live.failed : null; const offline = !!live && live.conn === "offline";
    const approve = () => {
      setBusy(true);
      if (live) { live.act("approve", () => Flow.act("approve", me ? me.id : "priya")).then(ok => { setBusy(false); if (ok) setPlaced(true); }); return; }
      setTimeout(() => { setBusy(false); Flow.act("approve", me ? me.id : "priya"); setPlaced(true); }, 650);
    };
    const yes = offline ? <><Button variant="approve" size="lg" block icon="check" aria-disabled="true" aria-describedby="lv-sheet-net" className="lv-blocked">Approve · release the agents</Button><span style={{ justifySelf: "center" }}><S.Live.NeedsNet id="lv-sheet-net" /></span></>
      : <Button variant="approve" size="lg" block icon={failed ? "refresh-cw" : "check"} loading={busy} onClick={approve}>{failed ? "Retry · release the agents" : "Approve · release the agents"}</Button>;
    return <Sheet open={open} onClose={onClose} title={placed ? "Plan placed" : "Approve the plan"} footer={placed ? <Button variant="primary" size="lg" block iconRight="arrow-right" onClick={() => { onClose(); go("execution", { ref: hero.id }); }}>Watch execution</Button> : <>{failed && !busy && <S.Live.ApproveFailed message={failed.message} />}{yes}<Button variant="ghost" block onClick={onClose}>Not now</Button></>}>
      {placed ? <div className="stack" style={{ justifyItems: "center", textAlign: "center", padding: "12px 0 8px" }}>
        <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true"><motion.circle cx="48" cy="48" r="42" fill="none" stroke="var(--primary)" strokeWidth="6" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }} /><motion.path d="M30 49 L43 62 L67 36" fill="none" stroke="var(--primary)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.4 }} /></svg>
        <div className="t-title2">Approved · 09:40</div>
        <div className="stack tight" style={{ justifyItems: "center" }}><Money value={D.PLAN.swing} size="l" roll from={0} style={{ color: "var(--primary-text)" }} /><span className="muted">better than the bin, on one batch of chips</span></div>
        <p className="t-subhead muted" style={{ maxWidth: 40 + "ch" }}>The Lister is posting on ExpireSoon in Rakesh Traders' name and Outreach is messaging {D.OFFERED} kiranas now. Rakesh bhai has the plan in his app. The approval is logged with who, when and device.</p>
      </div> : <div className="stack">
        <div className="stack tight"><Money value={D.PLAN.net} size="l" style={{ color: "var(--primary-text)" }} /><span className="muted">net recovered, {D.PLAN.pctMRP}% of MRP</span></div>
        <List><ListRow icon="trending-up" title="Instead of destroying" value={fmt.inr(-D.PLAN.writeOff.total)} /><ListRow icon="scale" iconTone="blue" title="Swing on this batch" value={fmt.inr(D.PLAN.swing)} /><ListRow icon="badge-check" iconTone="gray" title="GST input credit retained" value={fmt.inr(D.PLAN.itcRetained)} /></List>
        <div className="stack tight"><b className="t-subhead">What happens the moment you tap</b>
          {[["shopping-bag", `Lister posts ${ES.units} units on ExpireSoon at ₹15 in Rakesh Traders' name, with the label photo and dates; reserve ₹13.50, hidden from buyers inside Munchly's territories.`], ["send", `Outreach pushes the Hindi scheme to ${D.OFFERED} kiranas: ${KL.units} units at ₹${KL.packPrice.toFixed(2)} a pack, 2 free with every 10, for 48 hours.`], ["smartphone", "Rakesh bhai gets the same plan in his app and can pause it."], ["shield-check", "Nothing is listed, messaged or shipped before this tap. The approval is logged with who, when and device."]].map(([ic, t]) => <div key={ic} className="row top t-subhead" style={{ gap: 10 }}><Icon name={ic} size={18} style={{ marginTop: 2, color: "var(--fg-3)" }} /><span>{t}</span></div>)}
        </div>
      </div>}
    </Sheet>;
  }
  function RouteRoom({ me }) {
    const s = useStore(); const app = useApp(); const hm = heroModel(s); const h = s.hero; const [view, setView] = useState("chart"); const [sheet, setSheet] = useState(false);
    const { go } = useRoute();
    const stages = D.STAGES.map(x => ({ id: x.id, title: x.title, human: x.human }));
    const valued = ["valued", "planned", "approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const planned = ["planned", "approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const approved = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const v = hm.view; const sku = v.skuObj;
    // the split, one sentence per line of the plan (SC-85); then the exits the Router left out: one that pays, but less
    // than the last it chose, and one that may not take the batch, with its reason (the food bank and write-off are the floor)
    const heroDist = D.DISTRIBUTORS[D.BATCHES.find(b => b.hero).distributor];
    const leftOut = D.PLAN.rows.filter(r => r.id !== "writeoff" && r.id !== "foodbank" && !D.PLAN.lines.some(l => l.id === r.id) && (!r.eligible || r.net > 0));
    const lowest = (D.PLAN.lines.filter(l => l.id !== "writeoff").sort((a, b) => a.net / a.units - b.net / b.units)[0] || {}).short || "";
    useEffect(() => { const f = () => setSheet(true); window.addEventListener("sc3:approve-open", f); return () => window.removeEventListener("sc3:approve-open", f); }, []);
    // live (SC-73): each flagged batch has its own Route Room (#/route/<batch>), with the batches as tabs under the
    // title; updates paused grey the tracker, and offline the approval waits for a connection
    const live = S.useLive(); const { route } = useRoute(); const L = S.Live;
    const items = live ? L.flaggedItems(s, live) : null; const item = items && (items.find(i => i.ref === (route.params && route.params.ref)) || items[0]);
    const below = items && items.length > 1 ? <L.Switcher items={items} current={item.ref} /> : null;
    if (item && !item.hero) return <L.MangoRoom me={me} item={item} below={below} />;
    const dim = !!live && L.down(live.conn); const offline = !!live && live.conn === "offline";
    const Dim = live ? L.Dim : Pass;
    const framed = React.useContext(S.BatchCtx); // on a batch's page its head names the batch (SC-112)
    return <Screen me={me} title="Route Room" sub={below || framed ? null : `${v.id} · ${sku.brand} ${sku.name} · ${v.dist.name}, ${v.dist.city}`} back="Command Center" below={below}>
      <div className="stack" style={{ gap: 20, paddingBottom: h.phase === "planned" ? 96 : 0 }}>
        <Card className="stack" style={{ gap: 16 }}>
          <div className="row wrap" style={{ gap: 16 }}>
            <Product name={sku.img} size={app.bp === "phone" ? 64 : 84} />
            <div className="grow"><div className="row base" style={{ gap: 10 }}><DaysNum days={v.daysLeft} life={sku.lifeDays} size="l" style={{ color: approved ? "var(--fg)" : "var(--red-text)" }} /><span className="stack tight" style={{ gap: 0 }}><b>days left</b><span className="t-footnote subtle">best before {fmt.date(v.bestBefore)}</span></span></div></div>
            <div className="stack tight" style={{ justifyItems: app.bp === "phone" ? "start" : "end" }}><GateChips gates={v.assess.gates} /><span className="t-footnote subtle">{fmt.num(v.assess.atRisk)} of {fmt.num(v.units)} units at risk · sells {v.sellPerDay} a day</span></div>
          </div>
          <Dim on={dim}>{app.bp === "phone" ? <TrackerCompact done={hm.done} current={hm.current} /> : <Tracker stages={stages} done={hm.done} current={hm.current} times={K.STAGE_TIMES} />}</Dim>
        </Card>
        <Columns sideWidth={340}
          main={<>
            <div data-anchor="label" />
            <SectionTitle sub="Vision · 09:20" right={h.photo.status === "verified" && <Badge tone="green" icon="check">matches the DMS record</Badge>}>Label, read from the shelf</SectionTitle>
            <Card className="stack" style={{ gap: 16 }}>
              <div style={{ containerType: "inline-size" }}><div className="labelgrid">
                <LabelPhoto status={h.photo.status} />
                <div className="stack snug">{h.photo.status === "verified" ? <List>{[["Batch", "MF-2409-117"], ["Manufactured", "18 May 2026"], ["Best before", "18 Nov 2026"], ["Shelf life", `${v.assess.life} days · ${v.assess.lifeUsedPct}% used`], ["MRP", "₹30.00 · 24 × 150 g"], ["Records", "match"]].map(([k, val]) => <ListRow key={k} title={k} value={val} />)}</List>
                  : <><Locked icon="scan-line" agent="Vision Agent" live={h.photo.status !== "none"} text={h.photo.status === "reading" ? "Reading batch, MFG, best-before and MRP from the photo." : "Prices nothing until a person photographs one carton label on the shelf."} />{[0, 1, 2, 3].map(i => <K.Skeleton key={i} h={44} r={12} />)}</>}</div>
              </div></div>
            </Card>
            <div data-anchor="channels" />
            <SectionTitle sub="Valuer · 09:21 · per unit, after costs" right={valued && <Segmented options={[{ id: "chart", label: "Chart" }, { id: "table", label: "Table" }]} value={view} onChange={setView} label="View" />}>Five channels, priced</SectionTitle>
            {valued ? (view === "chart" ? <Card><ChannelBars rows={D.PLAN.rows} chosen={planned ? D.PLAN.lines.map(l => l.id) : []} /><p className="t-footnote subtle" style={{ marginTop: 6 }}>Hover a bar for price, capacity, time to clear and what happens to the GST credit. Destroying costs {fmt.inr2(-D.PLAN.writeOff.perUnit)} a unit; a donation costs {fmt.inr2(-D.PLAN.rows.find(r => r.id === "foodbank").net)}, because the credit on a gift is reversed.</p></Card> : <ChannelTable rows={D.PLAN.rows} chosen={planned ? D.PLAN.lines.map(l => l.id) : []} />)
              : <Locked icon="scale" agent="Valuer Agent" live={h.photo.status === "verified"} text={h.photo.status === "verified" ? `Pricing five channels against ${v.daysLeft} days left, capacities and the floor.` : "Prices five channels once the label is verified."} />}
            <div data-anchor="split" />
            <SectionTitle sub="Router · 09:22">Recommended split</SectionTitle>
            {planned ? <div className="stack" style={{ gap: 16 }}>
              <Card className="stack snug"><SplitBar plan={D.PLAN} sku={sku} />
                <div className="stack tight t-subhead" style={{ marginTop: 4 }}>
                  {D.PLAN.lines.map(ln => <div key={ln.id} className="row top" style={{ gap: 10 }}><span className="dotmark" style={{ background: `var(--ch-${ln.id})` }} />{
                    ln.id === "kirana" ? <span><b>{KL.units} units to the kirana cluster at ₹{KL.price} effective</b> (₹{KL.packPrice.toFixed(2)} a pack, 2 free with every 10). The best price, and it keeps stock inside Munchly's own trade. Capped by what {heroDist.kiranas} kiranas can move in 14 days with the scheme, on top of the {v.sellPerDay} a day they already sell.</span>
                    : ln.id === "expiresoon" ? <span><b>{ES.units} units to ExpireSoon at ₹{ES.price}</b> (reserve ₹13.50), listed in Rakesh Traders' name and hidden from buyers inside Munchly's territories: unlimited depth, 5 to 9 days, the buyer pays freight.</span>
                    : ln.id === "staff" ? <span><b>{ln.units} units to the {ln.name} at ₹{ln.price}</b>, at {heroDist.godown}: {heroDist.short} sells them to staff and records what sold.</span>
                    : ln.id === "foodbank" ? <span><b>{ln.units} units to a food bank</b>, the last of the batch, booked with a partner whose rules it meets; the credit on a gift is reversed.</span>
                    : <span><b>{ln.units} units written off</b>: no exit takes them in time.</span>}</div>)}
                  {leftOut.map(r => <div key={r.id} className="row top muted" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--fill-3)" }} /><span>{r.eligible ? `The ${r.name} is eligible but pays less a unit than ${lowest}, so it gets nothing this time.` : `${r.short} is left out (${r.reason}).`}</span></div>)}
                </div>
              </Card>
              {D.PLAN.alt && <Card className="row wrap" style={{ gap: 14, background: "var(--surface-2)" }}><span className="icontile soft"><Icon name="git-branch" size={17} /></span><div className="grow"><b>Alternative considered: {D.PLAN.alt.label}</b><div className="t-footnote muted">Net {fmt.inr(D.PLAN.alt.net)}: {fmt.inr(D.PLAN.net - D.PLAN.alt.net)} less, and nothing stays in Munchly's own trade.</div></div><Badge>not chosen</Badge></Card>}
              <MoneyPanel plan={D.PLAN} compact={app.bp !== "desktop"} />
            </div> : <Locked icon="split" agent="Router Agent" live={h.phase === "valued"} text={h.phase === "valued" ? "Filling the best-paying channel to its cap, then the next." : "Proposes a split once the channels are priced."} />}
            {approved && <Card className="row wrap" style={{ gap: 14 }}><Avatar person={D.PEOPLE[(h.plan && h.plan.by) || "priya"]} size="lg" /><div className="grow"><b>Approved by {D.PEOPLE[(h.plan && h.plan.by) || "priya"].short} · 09:40 · phone</b><div className="t-footnote muted">Logged with who, when and device. The agents are executing; Rakesh bhai has the same plan in his app.</div></div><Button variant="primary" iconRight="arrow-right" onClick={() => go("execution", { ref: h.id })}>Watch execution</Button></Card>}
          </>}
          side={<><SectionTitle sub="Gaps drawn to the clock">Agent timeline</SectionTitle><Card><Dim on={dim}><AgentFeed events={s.feed.filter(e => e.stage !== "connect")} people={D.PEOPLE} live={hm.agentLive && !dim ? s.feed.filter(e => e.stage !== "connect").length - 1 : -1} /></Dim></Card></>} />
      </div>
      {h.phase === "planned" && <div style={{ position: "sticky", bottom: 0, zIndex: 5, padding: "12px 0 16px", background: "linear-gradient(180deg, transparent, var(--bg) 35%)" }}>
        <div className="card raised row wrap" style={{ padding: "14px 16px", gap: 14 }}>
          <div className="row wrap grow" style={{ gap: 18 }}>{[["You get", D.PLAN.net, "var(--primary-text)"], ["Instead of", -D.PLAN.writeOff.total, "var(--red-text)"], ["GST credit safe", D.PLAN.itcRetained, "var(--fg)"]].map(([k, val, c]) => <div key={k} className="stack tight" style={{ gap: 0 }}><span className="t-caption subtle strong">{k}</span><Money value={val} size="s" style={{ color: c, fontSize: 26 }} /></div>)}</div>
          {offline ? <div className="stack tight" style={{ justifyItems: "end", gap: 6 }}><Button variant="approve" size="lg" icon="check" aria-disabled="true" aria-describedby="lv-needs-net" className="lv-blocked">Review and approve</Button><L.NeedsNet id="lv-needs-net" /></div>
            : <Button variant="approve" size="lg" icon="check" onClick={() => setSheet(true)}>Review and approve</Button>}
        </div>
      </div>}
      <ApproveSheet open={sheet} onClose={() => setSheet(false)} me={me} />
    </Screen>;
  }

  /* ---------- S3 Execution ---------- */
  function Chat({ chat, typing, me }) {
    return <div className="stack snug">{chat.map((m, i) => { const mine = m.from === "buyer"; return <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="row end" style={{ justifyContent: mine ? "flex-end" : "flex-start", gap: 8 }}>
      {!mine && <K.Mark size={28} />}
      <div style={{ maxWidth: "82%", padding: "10px 13px", borderRadius: 18, borderBottomLeftRadius: mine ? 18 : 6, borderBottomRightRadius: mine ? 6 : 18, background: mine ? "var(--violet)" : "var(--fill-2)", color: mine ? "var(--violet-fg)" : "var(--fg)", fontSize: 14.5, lineHeight: 1.4 }}>{m.text}<div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 3 }}>{mine ? `${D.BUYER.name}, ${D.BUYER.city}` : "Rakesh Traders · Negotiator agent"} · {m.at}</div></div>
      {mine && <Avatar person={D.PEOPLE.agrawal} size="sm" />}
    </motion.div>; })}{typing && <div className="row" style={{ gap: 8 }}><K.Mark size={28} /><div style={{ padding: "12px 14px", borderRadius: 18, background: "var(--fill-2)" }}><span className="typing"><i /><i /><i /></span></div></div>}</div>;
  }
  // the staff sale on Execution (SC-87, option A): the distributor runs it at the godown and records what sold, once; no
  // agent acts here. Before it opens, the plan's line
  function StaffOps({ staff, line, dist }) {
    const units = staff ? staff.units : line.units, price = staff ? staff.price : line.price, sold = staff && staff.status === "recorded" ? staff.sold : null;
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className="icontile" style={{ borderRadius: 9 }}><Icon name="users" size={17} stroke={2} /></span><span className="card-title">Staff sale · {dist.short}</span></span>{!staff ? <Badge>opens on approval</Badge> : sold == null ? <Badge tone="blue" dot>open</Badge> : <Badge tone="green" icon="check">recorded</Badge>}</div>
      <div className="row wrap" style={{ gap: 18 }}><div className="stack tight" style={{ gap: 0 }}><span className="num m">{sold == null ? "—" : fmt.num(sold)}<span className="subtle" style={{ fontSize: "0.45em" }}>{` / ${fmt.num(units)}`}</span></span><span className="t-footnote subtle">sold to staff</span></div><div className="stack tight" style={{ gap: 0 }}><span className="num m">₹{price}</span><span className="t-footnote subtle">a pack, by UPI</span></div></div>
      <K.Progress value={(sold || 0) / units} label="Staff packs sold" />
      <span className="t-footnote muted">{dist.short} runs it at {(staff && staff.godown) || dist.godown} and records what sold; no agent acts here.</span>
    </Card>;
  }
  // what no channel took, once every line is done (SC-87, option A): each line's planned packs it did not take, which
  // still face the write-off, and the net the lines came to against the plan's
  function GodownLeft({ realised, plan, actual, dist }) {
    const took = id => (realised.lines.find(l => l.id === id) || { units: 0 }).units;
    const rows = plan.lines.filter(l => l.id !== "writeoff" && l.units > took(l.id)).map(l => [l.id, l.short, l.units - took(l.id)]);
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className="icontile gray" style={{ borderRadius: 9 }}><Icon name="warehouse" size={17} stroke={2} /></span><span className="card-title">Left at the godown</span></span><Badge>{fmt.num(realised.godown)} {realised.godown === 1 ? "pack" : "packs"}</Badge></div>
      <List>{rows.map(([id, name, n]) => <ListRow key={id} title={name} sub="planned, not taken" value={<span className="tnum strong">{fmt.num(n)}</span>} />)}</List>
      <span className="t-footnote muted">Not recovered: {fmt.num(realised.godown)} {realised.godown === 1 ? "pack" : "packs"} at {dist.godown}, still facing the write-off at best-before. The figures count only what each channel took: net {fmt.inr(actual)} of the {fmt.inr(plan.net)} planned.</span>
    </Card>;
  }

  // expiry day's settlement (SC-94, option B): the packs left at the godown, settled by the client's expiry policy:
  // the policy, three figures (the credit to the distributor, who destroys the packs, the client's other costs), the
  // sentence, and the paper
  const POLICY_NAME = { godown: "Destroyed at the godown", "full-credit": "Full credit at expiry", "price-support": "Price support only", none: "No returns" };
  function expirySentence(x, client, dist) {
    const n = fmt.num(x.units), amount = x.credit != null ? ` (${fmt.inr(x.credit)})` : "";
    const whose = dist.name + (/s$/.test(dist.name) ? "'" : "'s");
    if (x.policy === "godown") return `The ${n} packs are destroyed at ${dist.godown} through an authorised agency; ${client} credits ${dist.name} the dealer price, the GST it reverses and the agency's charges${x.amount != null ? ` (${fmt.inr(x.amount)})` : ""}.`;
    if (x.policy === "full-credit") return `The ${n} packs come back to ${client} for full credit${amount || " at the dealer price"}, and ${client} destroys them.`;
    if (x.policy === "price-support") return `The ${n} packs stay with ${dist.name}, which destroys them; ${client} pays it the gap to its price${amount}.`;
    return `With no returns, the ${n} packs are ${whose} loss, and it destroys them.`;
  }
  function ExpirySettlement({ settle: x, dist }) {
    const { go } = useRoute(); const client = D.CLIENT.short;
    const figures = x.policy === "godown" ? [[`Credit to ${dist.short}`, x.amount != null ? fmt.inr(x.amount) : "at the dealer price"], ["Destroyed by", dist.short], ["Of it: GST and charges", fmt.inr((x.gst || 0) + (x.charges || 0))]]
      : [[`Credit to ${dist.short}`, x.policy === "none" ? "—" : x.credit != null ? fmt.inr(x.credit) : "at the dealer price"], ["Destroyed by", x.destroyedBy === "client" ? client : dist.short], [x.policy === "full-credit" ? "Disposal, EPR, GST" : "Client's other costs", x.policy === "full-credit" ? fmt.inr(x.disposal + x.epr + x.itc) : "—"]];
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className="icontile" style={{ borderRadius: 9 }}><Icon name="hand-coins" size={17} stroke={2} /></span><span className="card-title">Expiry settlement</span></span><Badge tone={x.policy === "none" ? undefined : "green"} icon="check">{POLICY_NAME[x.policy]}</Badge></div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))" }}>{figures.map(([k, v]) => <div key={k} className="stack tight" style={{ gap: 2, padding: "10px 12px", borderRadius: 12, background: "var(--fill)" }}><span className="t-caption subtle">{k}</span><b className="tnum">{v}</b></div>)}</div>
      <span className="t-footnote muted">{expirySentence(x, client, dist)}</span>
      {x.policy !== "none" && <Button variant="outline" icon="file-text" onClick={() => go("paperwork", { ref: D.BATCHES.find(b => b.hero).id })}>Open the paper</Button>}
    </Card>;
  }

  // packs destroyed at the distributor's godown on expiry day (SC-139, option B): where the evidence stands, and on
  // Priya's desk the review: both photos, Vision's checks, the agency, and what her yes issues. The batch closes on it
  const evidenceSrc = (ref, which, d) => (d && d.photos && d.photos[which] && d.photos[which].url) || `${window.SC3_IMG}evidence/${ref}-${which}.webp`;
  const DSTATE = { requested: ["amber", "waiting for the evidence"], asked: ["amber", "asked again"], reading: ["violet", "Vision is checking"], checked: ["amber", "waiting for your yes"], approved: ["green", "approved"] };
  function DestructionCard({ d, dist, onReview }) {
    const [tone, label] = DSTATE[d.status] || [undefined, d.status];
    const body = { requested: `${dist.name} is asked to destroy the ${fmt.num(d.units)} packs at ${dist.godown} through an authorised agency, and to send two photos and its certificate.`,
      asked: `You asked ${dist.short} again${d.reason ? `: ${d.reason}` : ""}.`, reading: "Vision is reading the batch, the count and the slate off the photos.",
      checked: `${dist.short} sent the evidence: ${d.agency ? d.agency.name : "the agency"}, certificate ${d.certificate}. Vision checked it.`,
      approved: `Approved${d.approvedBy && D.PEOPLE[d.approvedBy] ? ` by ${D.PEOPLE[d.approvedBy].short}` : ""}: the credit note and the agency's certificate are issued.` }[d.status];
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className={cx("icontile", tone === "amber" && "amber")} style={{ borderRadius: 9 }}><Icon name="recycle" size={17} stroke={2} /></span><span className="card-title">Destruction at the godown</span></span><Badge tone={tone} dot={d.status !== "approved"} live={d.status === "reading"} icon={d.status === "approved" ? "check" : undefined}>{label}</Badge></div>
      {d.photos && <div className="dz-two dz-pair">{["before", "after"].map(w => <div key={w} className="cam dz-cam"><img className="cam-feed whole" src={evidenceSrc(HERO.id, w, d)} alt={w === "before" ? "The packs at the godown, the batch label in view" : "The packs slit open at the landfill, the slate in view"} /><span className="cam-tag">{w === "before" ? "Before" : "After"}</span></div>)}</div>}
      <span className="t-footnote muted">{body}</span>
      {d.status === "checked" && <Button variant="approve" icon="check" onClick={onReview}>Review and approve</Button>}
    </Card>;
  }
  function DestructionSheet({ open, onClose, d, x, dist, sku, batch }) {
    const [asking, setAsking] = useState(false); const [why, setWhy] = useState("");
    const C = D.CLIENT.short, live = S.useLive();
    const close = () => { onClose(); setAsking(false); setWhy(""); };
    const act = (name, arg) => { if (live && live.destruction) live.destruction(name, arg); else Flow.act(name, arg); close(); };
    const footer = asking
      ? <div className="dz-foot"><Button variant="ghost" size="lg" onClick={() => setAsking(false)}>Back</Button><Button variant="primary" size="lg" block icon="send" disabled={!why.trim()} onClick={() => act("askDestructionAgain", why.trim())}>Ask {dist.short} again</Button></div>
      : <div className="dz-foot"><Button variant="secondary" size="lg" icon="rotate-ccw" onClick={() => setAsking(true)}>Ask again</Button><Button variant="approve" size="lg" block icon="check" onClick={() => act("approveDestruction")}>Approve · issue the papers</Button></div>;
    const at = w => d.photos && d.photos[w] && d.photos[w].at ? ` · ${String(d.photos[w].at).slice(-5)}` : "";
    return <Sheet open={open} onClose={close} title="Approve the destruction" footer={d && d.status === "checked" ? footer : null}>
      {d && <div className="stack" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12 }}><Product name={sku.img} size={44} alt="" /><div className="grow"><b>{sku.name} · {fmt.num(d.units)} packs</b><div className="t-footnote muted">Batch <span className="mono">{batch.id}</span> · expired at {dist.godown} · sent by {dist.name}</div></div></div>
        <div className="dz-two dz-pair">{["before", "after"].map(w => <div key={w} className="cam dz-cam"><img className="cam-feed whole" src={evidenceSrc(batch.id, w, d)} alt={w === "before" ? "The packs at the godown, the batch label in view" : "The packs slit open at the landfill, the slate in view"} /><span className="cam-tag">{w === "before" ? "Before" : "After"}{at(w)}</span></div>)}</div>
        {asking ? <K.Field label={`What ${dist.short} should send again`} htmlFor="dz-why"><K.Textarea id="dz-why" rows={3} value={why} onChange={e => setWhy(e.target.value)} placeholder="The batch label is not readable in the before photo" /></K.Field>
          : <div className="stack" style={{ gap: 16 }}>
            <div className="stack tight"><b className="t-subhead">{possessive("Vision")} checks</b>{(d.checks || []).map(ck => <div key={ck.id} className="row tight t-subhead dz-check"><Icon name={ck.ok ? "circle-check" : "circle-alert"} size={16} className={ck.ok ? "dz-ok" : "dz-warn"} />{ck.label}</div>)}
              {d.agency && <div className="row tight t-subhead dz-check"><Icon name="circle-check" size={16} className="dz-ok" />{d.agency.name} is on {possessive(C)} list (authorisation {d.agency.auth}) · certificate {d.certificate}</div>}</div>
            {x && <div className="stack tight dz-yes"><b className="t-subhead">On your yes</b><List>
              <ListRow title={`Expiry credit note to ${dist.name}`} sub={`${fmt.num(x.units)} × ₹${sku.dp} + ${fmt.inr2(x.gst || 0)} GST he reverses + ${fmt.inr2(x.charges || 0)} destruction`} value={<span className="tnum">{fmt.inr2(x.amount)}</span>} />
              <ListRow title="Destruction certificate" sub={`${d.agency ? d.agency.name : "the agency"}, ${d.certificate || ""}`} value={<span className="tnum">{fmt.num(d.units)} packs</span>} />
              <ListRow title={`${possessive(C)} input GST`} sub={`the packs were ${possessive(dist.name)} stock`} value="kept" />
            </List></div>}
          </div>}
      </div>}
    </Sheet>;
  }

  function Execution({ me, onOpenListing }) {
    const s = useStore(); const h = s.hero; const app = useApp(); const hm = heroModel(s); const [sheet, setSheet] = useState(false); const [dz, setDz] = useState(false);
    const started = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const units = h.orders.reduce((t, o) => t + o.units, 0);
    const lastBid = h.bids[h.bids.length - 1];
    const ML = id => D.MANGO_PLAN.lines.find(l => l.id === id) || { units: 0 };
    // the cards follow the case's own plan (SC-85): a channel the Router left out says why, and its agent stands by
    const hasLine = id => D.PLAN.lines.some(l => l.id === id && l.units > 0);
    const esRow = D.PLAN.rows.find(r => r.id === "expiresoon");
    const req = `POST /v1/listings\n{\n  "seller": "Rakesh Traders, Nagpur",\n  "on_behalf": "one-time permission · inside Munchly floors",\n  "sku": "MF-MC-150",\n  "batch": "MF-2409-117",\n  "units": ${ES.units},\n  "price": 15.00,\n  "reserve": 13.50,\n  "mrp": 30.00,\n  "best_before": "2026-11-18",\n  "hide_from_pincodes": ["440", "441", "442", "411", "412", "452", "453", "500", "501"],\n  "label_photo": "gs://smart-clearance/labels/MF-2409-117.jpg"\n}`;
    const res = h.listing ? `HTTP/1.1 201 Created\n{\n  "id": "${D.JOURNEY.listing.id}",\n  "status": "${h.listing.status}",\n  "url": "${D.JOURNEY.listing.url}"\n}` : "";
    return <Screen me={me} title="Execution" sub="MF-2409-117 · day 0 to 14 · four agents" back="Route Room">
      {!started ? <Card><Empty icon="sparkles" title="Nothing is executing yet" body="Listing, outreach, negotiation and the food-bank booking start the moment the plan is approved." /></Card> :
      <Columns sideWidth={340}
        main={<div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", alignItems: "start" }}>
          {hasLine("expiresoon") ? <Card className="stack snug">
            <div className="card-head"><span className="row tight"><Aura on={!h.listing} className="icontile violet" style={{ borderRadius: 9 }}><Icon name="shopping-bag" size={17} stroke={2} /></Aura><span className="card-title">Lister · ExpireSoon</span></span>{h.listing ? <Badge tone={h.listing.status === "awarded" ? "green" : "violet"} dot live={h.listing.status === "live"}>{h.listing.status}</Badge> : <Badge>queued</Badge>}</div>
            <CodeBlock code={req} label="ExpireSoon request" />{h.listing && <CodeBlock code={res} label="ExpireSoon response" />}
            <span className="t-footnote subtle">The marketplace is mocked; the request and response are what a partner API returns. Buyers in Munchly's territories never see the lot.</span>
            {h.listing && <Button variant="outline" icon="external-link" onClick={() => (onOpenListing ? onOpenListing() : setSheet(true))}>Open on ExpireSoon</Button>}
          </Card> : <Card className="stack snug">
            <div className="card-head"><span className="row tight"><span className="icontile gray" style={{ borderRadius: 9 }}><Icon name="shopping-bag" size={17} stroke={2} /></span><span className="card-title">Lister · ExpireSoon</span></span><Badge>not in this plan</Badge></div>
            <span className="t-footnote muted">{esRow && !esRow.eligible ? `ExpireSoon is left out of this plan (${esRow.reason}).` : "The Router gave ExpireSoon nothing: the other exits pay more a unit."} The Lister has nothing to list.</span>
          </Card>}
          <Card className="stack snug">
            <div className="card-head"><span className="row tight"><Aura on={h.offer && units < KL.units} className="icontile" style={{ borderRadius: 9 }}><Icon name="send" size={17} stroke={2} /></Aura><span className="card-title">Outreach · {D.OFFERED} kiranas</span></span><Badge tone="blue" icon="bell">push · Hindi</Badge></div>
            {h.offer && <div className="banner" style={{ boxShadow: "none", background: "var(--fill)", gridTemplateColumns: "28px minmax(0,1fr)" }}><K.Mark size={28} /><span className="hi t-subhead" lang="hi" style={{ lineHeight: 1.45 }}>{D.PUSH.offer.body}</span></div>}
            <div className="row wrap" style={{ gap: 18 }}><div className="stack tight" style={{ gap: 0 }}><span className="num m"><Roll value={h.orders.length} /><span className="subtle" style={{ fontSize: "0.45em" }}> / {D.OFFERED}</span></span><span className="t-footnote subtle">kiranas ordered</span></div><div className="stack tight" style={{ gap: 0 }}><span className="num m"><Roll value={units} /><span className="subtle" style={{ fontSize: "0.45em" }}> / {KL.units}</span></span><span className="t-footnote subtle">units</span></div></div>
            <K.Progress value={units / KL.units} label="Units ordered" />
            {h.offer && !h.orders.some(o => o.id === "k0") && <S.PlayAs who="ganesh" route="offer">Order as Ganesh ji</S.PlayAs>}
            <ClusterMap kiranas={D.KIRANAS} orderedCount={h.orders.length} route height={200} />
            <div className="stack tight">{h.orders.slice(-3).reverse().map(o => { const k = D.KIRANAS.find(x => x.id === o.id) || window.SC3_WORLD.KIRANAS.find(x => x.id === o.id); return <div key={o.id} className="row between t-subhead"><span>{k.name} <span className="subtle t-footnote">{k.area}</span></span><span className="tnum strong">{o.units} <span className="subtle t-caption">{o.at}</span></span></div>; })}{!h.orders.length && <span className="t-footnote muted">Orders arrive as shops tap the offer. No shop can order more than {M.RULES.shopCapTimes}× its own 14-day sales.</span>}</div>
          </Card>
          <Card className="stack snug">
            <div className="card-head"><span className="row tight"><Aura on={!!lastBid && lastBid.status === "placed"} className="icontile gray" style={{ borderRadius: 9 }}><Icon name="messages-square" size={17} stroke={2} /></Aura><span className="card-title">Negotiator</span></span>{h.award ? <Badge tone="green" icon="check">awarded · ₹{D.COUNTER.price.toFixed(2)}</Badge> : <Badge>reserve ₹13.50 · hidden</Badge>}</div>
            {h.chat.length ? <Chat chat={h.chat} typing={lastBid && lastBid.status === "placed"} /> : <span className="t-footnote muted">Waiting for a bid from outside Munchly's territories. The agent counters anything under the reserve and promises only what Rakesh's calendar can keep.</span>}
            {h.listing && !h.award && (!lastBid || lastBid.status === "countered") && <S.PlayAs who="agrawal" route="listing">{lastBid ? "Answer the counter as Agrawal ji" : "Bid as Agrawal ji on ExpireSoon"}</S.PlayAs>}
            {h.award && <List>{[["ExpireSoon, planned", `${ES.units} × ₹15.00`, fmt.inr(D.ACTUAL.esPlanned)], ["ExpireSoon, actual", `${ES.units} × ₹${D.COUNTER.price.toFixed(2)}`, fmt.inr(D.ACTUAL.esActual)], ["Net, planned", "", fmt.inr(D.PLAN.net)], ["Net, actual", `−${fmt.inr(D.ACTUAL.delta)} on the counter`, fmt.inr(D.ACTUAL.net)]].map(([k, sub, val]) => <ListRow key={k} title={k} sub={sub || undefined} value={<span className="tnum strong">{val}</span>} />)}</List>}
            {h.award && <Badge tone="green" icon="badge-check">Token {fmt.inr(D.AWARD.token)} received · balance {fmt.inr(D.AWARD.balance)} plus IGST in {D.MARKET.balanceHours} h</Badge>}
            {h.award && all(h) && h.truck.status !== "dispatched" && <S.PlayAs who="rakesh" route="van">Load the buyer's truck as Rakesh bhai</S.PlayAs>}
          </Card>
          <Card className="stack snug">
            <div className="card-head"><span className="row tight"><Aura on={!s.mango.donation} className="icontile red" style={{ borderRadius: 9 }}><Icon name="heart-handshake" size={17} stroke={2} /></Aura><span className="card-title">Donation · Mango Drink</span></span>{s.mango.donation ? <Badge tone="green" icon="check">{s.mango.donation === "collected" ? "collected" : s.mango.donation === "confirmed" ? "pickup confirmed" : "pickup booked"}</Badge> : <Badge>matching partners</Badge>}</div>
            <div className="row" style={{ gap: 14 }}><Product name="pack-mango" size={72} /><div className="stack tight" style={{ gap: 2 }}><b>MF-2410-118 · 22 days left</b><span className="t-footnote muted">Lakshmi Agencies, Hyderabad: {fmt.num(ML("kirana").units)} packs to her kiranas, {ML("staff").units} to her staff sale, {D.MANGO_FB} left for a food bank. Too few days for ExpireSoon.</span></div></div>
            <List><ListRow icon="circle-check" title="Feeding India" sub={`15+ days, 50+ units · ${D.SETUP.partners[0].pickup}`} value={<Badge size="sm" tone="green">matches</Badge>} /><ListRow icon="circle-x" iconTone="gray" title="India FoodBanking Network" sub="needs 21+ days and 100+ units" value={<Badge size="sm">{D.MANGO_FB} units</Badge>} /></List>
            <span className="t-footnote subtle">The GST credit on donated packs is reversed: section 17(5)(h) blocks it on gifts, and since 1 October 2023 section 17(5)(fa) blocks it on CSR donations too.</span>
            {s.mango.donation === "booked" && <S.PlayAs who="meera" route="pickups">Confirm as Meera</S.PlayAs>}
          </Card>
          {hasLine("staff") && <StaffOps staff={h.staff} line={D.PLAN.lines.find(l => l.id === "staff")} dist={D.DISTRIBUTORS[D.BATCHES.find(b => b.hero).distributor]} />}
          {h.realised && h.realised.godown > 0 && ["dispatched", "settled", "cleared"].includes(h.phase) && <GodownLeft realised={h.realised} plan={D.PLAN} actual={h.realisedNet} dist={D.DISTRIBUTORS[D.BATCHES.find(b => b.hero).distributor]} />}
          {h.expiry && h.expiry.units > 0 && <ExpirySettlement settle={h.expiry} dist={D.DISTRIBUTORS[D.BATCHES.find(b => b.hero).distributor]} />}
          {h.destruction && <DestructionCard d={h.destruction} dist={D.DISTRIBUTORS[HERO.distributor]} onReview={() => setDz(true)} />}
        </div>}
        side={<><SectionTitle>Agent timeline</SectionTitle><Card><AgentFeed events={s.feed.filter(e => ["approve", "execute", "settle", "report"].includes(e.stage))} people={D.PEOPLE} live={hm.agentLive ? s.feed.filter(e => ["approve", "execute", "settle", "report"].includes(e.stage)).length - 1 : -1} /></Card></>} />}
      <Sheet open={sheet} onClose={() => setSheet(false)} title="ExpireSoon · as buyers see it">{window.SC3_SCREENS.ListingView ? React.createElement(window.SC3_SCREENS.ListingView, { readOnly: true }) : null}</Sheet>
      <DestructionSheet open={dz && !!h.destruction} onClose={() => setDz(false)} d={h.destruction} x={h.expiry} dist={D.DISTRIBUTORS[HERO.distributor]} sku={D.SKUS[HERO.sku]} batch={HERO} />
    </Screen>;
  }
  const all = h => h.orders.length === D.KIRANAS.length;

  /* ---------- a batch's page (SC-112) ---------- */
  // the operator reads the workspace top down: the workspace, then a batch, then the batch's screens. A batch's page
  // gives each of its screens one head (its pack, name, id, distributor and where it stands) with the screens as tabs
  // under it; each screen's body is as it was. A batch the Watcher only watches has its Journey alone
  const BATCH_PARTS = [
    { id: "journey", label: "Journey", short: "Journey", icon: "radar", from: 1, to: 1, ahead: "" },
    { id: "route", label: "Route Room", short: "Route", icon: "route", from: 2, to: 5, ahead: "from Verify" },
    { id: "execution", label: "Execution", short: "Execution", icon: "activity", from: 6, to: 6, ahead: "starts on approval" },
    { id: "paperwork", label: "Paperwork", short: "Papers", icon: "file-text", from: 7, to: 7, ahead: "after the lines close" },
    // the batch's record (SC-142): open at every stop, like its Journey
    { id: "record", label: "Record", short: "Record", icon: "history", from: 99, to: 99, ahead: "" },
  ];
  const BATCH_PART_IDS = BATCH_PARTS.map(p => p.id);
  const stopOf = it => (it.current >= 0 ? it.current : 9);
  // where a batch opens: the screen for the stop it is at; its journey before Verify, once it has cleared, and for a
  // batch in no journey
  const partAt = it => (it ? (BATCH_PARTS.find(p => p.id !== "journey" && stopOf(it) >= p.from && stopOf(it) <= p.to) || BATCH_PARTS[0]).id : "journey");
  // a screen of the batch, as its tab says it: where the batch stands (amber while it waits for a yes), done, or not yet
  function partState(it, p) {
    if (p.id === "journey" || p.id === "record") return {};
    if (p.id === partAt(it)) return { here: true, human: it.human, words: it.human ? "needs your yes" : "where the batch is" };
    return stopOf(it) < p.from ? { ahead: true, words: p.ahead } : { done: true, words: "done" };
  }
  const shortName = sku => sku.name.replace(/\s+\d+(\.\d+)?\s?(g|ml|kg|l)$/i, "");
  // the batches in a journey, most urgent first, each with its view, its stop and whether it waits for a person: the
  // chips once the Watcher has flagged them, and on the live workspace the batches it flagged (screens/live.jsx)
  function journeyItems(s, live) {
    const hm = heroModel(s); const stage = D.STAGES[hm.current];
    const items = live && S.Live ? S.Live.flaggedItems(s, live) : [{ ref: D.BATCHES[0].id, hero: true, view: hm.view, done: hm.done, current: hm.current, stop: stage ? stage.title : "Cleared", human: !!(stage && stage.human) }];
    return items.filter(it => !it.hero || s.hero.phase !== "watching");
  }
  // any batch's view, as the Command Center shows it
  function viewOf(s, ref, live) {
    const b = D.BATCHES.find(x => x.id === ref); if (!b) return null;
    if (b.hero) return heroModel(s).view;
    const v = D.batchView(b); if (b.second && !live) v.phase = "executing"; return v;
  }
  // the batch's state in its head: the agents' ETA for the batch the store follows; the Mango Drink waits on its photo
  function stateOf(it, s) {
    if (it.hero) { const hm = heroModel(s); return { text: hm.eta, tone: hm.etaTone, live: !!hm.agentLive }; }
    return { text: `Vision is waiting for ${it.view.dist.name}' label photo`, tone: "green", live: true };
  }
  // the head every screen of a batch shares: its pack, its name, its id and distributor, where it stands, its screens
  function BatchHead({ it, v, part, onPart }) {
    const s = useStore(); const app = useApp(); const phone = app.bp === "phone"; const live = S.useLive(); const sku = v.skuObj; const st = it && stateOf(it, s);
    return <div className="bhead">
      <div className="bh-id">
        <span className="bh-pic" aria-hidden="true"><Product name={sku.img} size={phone ? 46 : 72} alt="" /></span>
        <div className="bh-tt">
          <h1>{sku.name}</h1>
          <div className="bh-meta"><span className="mono">{v.id}</span><span className="sep" aria-hidden="true">·</span><span>{v.dist.name}, {v.dist.city}</span></div>
          <div className="bh-meta">{st ? <Badge tone={st.tone} dot live={st.live}>{st.text}</Badge> : <><StatusBadge status={v.phase || v.assess.status} /><span>The Watcher checks it every morning at {s.rules.watchTime}</span></>}{live && <S.Live.Line />}</div>
        </div>
      </div>
      {it && <BatchTabs it={it} part={part} onPart={onPart} />}
    </div>;
  }
  // the batch's screens as tabs: a pill track with a sliding thumb (the kit's tabs at page size); the tab for where the
  // batch stands carries a dot, amber while it waits for a yes; a screen it has not reached dims its icon and says when
  function BatchTabs({ it, part, onPart }) {
    const phone = useApp().bp === "phone";
    return <nav className="bh-tabs" aria-label={`${it.view.skuObj.name}, ${it.ref}`}>
      {BATCH_PARTS.map(p => { const st = partState(it, p); const on = part === p.id;
        return <button key={p.id} type="button" className={cx("bh-tab", st.ahead && "ahead")} aria-current={on ? "page" : undefined} onClick={() => onPart(p.id)} title={st.words || undefined}>
          {on && <motion.span layoutId="bh-tab-thumb" className="bh-tab-thumb" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
          {!phone && <Icon name={p.icon} size={16} />}<span>{phone ? p.short : p.label}</span>
          {st.here && <i className={cx("bh-here", st.human && "human")} aria-hidden="true" />}
          {st.words && <span className="sr-only">, {st.words}</span>}
        </button>; })}
    </nav>;
  }
  // a screen of a batch the batch has not reached (the Mango Drink's on the live workspace), in the screen's own words
  function NotYet({ me, title, icon, head, body }) { return <Screen me={me} title={title}><Card><Empty icon={icon} title={head} body={body} /></Card></Screen>; }
  // the Mango Drink batch's agents on the live workspace, as its Route Room tells them
  function mangoFeed(v) {
    return [
      { id: "m1", stage: "detect", agent: "Watcher", icon: "radar", at: D.PUSH.detect.at, min: 0, text: `${v.id} fails all three quick-commerce gates; ${fmt.num(v.assess.atRisk)} of ${fmt.num(v.units)} units will not sell by ${fmt.date(v.bestBefore).replace(/ \d{4}$/, "")}.`, calls: [["gates.check", v.assess.gates.map(g => `${g.app} ${g.has}/${g.need}`).join(" · "), "bad"], ["pubsub.publish", "batch.at_risk", "ok"]] },
      { id: "m2", stage: "verify", agent: "Vision", icon: "scan-line", at: D.PUSH.verify.at, min: 5, text: `Asked ${v.dist.name} for one label photo before quoting any price.`, calls: [["fcm.send", v.dist.name, "ok"]] },
    ];
  }
  // the batch's Journey: the Command Center's pieces for this batch alone (its tracker card, its cluster, its agents);
  // a batch in no journey shows what the Watcher sees of it and what happens next
  function BatchJourney({ me, it, v }) {
    const s = useStore(); const app = useApp(); const { go } = useRoute(); const hm = heroModel(s); const h = s.hero; const phone = app.bp === "phone"; const live = S.useLive();
    if (!it) return <Screen me={me} title="Journey"><Columns sideWidth={340} main={<Card className="stack"><BatchFacts view={v} /></Card>} side={<div className="stack snug"><SectionTitle sub="Every hand-off on this batch, as it happens">Agent activity</SectionTitle><Card><span className="t-footnote muted">The agents report here once the Watcher flags this batch.</span></Card></div>} /></Screen>;
    const routed = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase); const SHOPS = D.KIRANAS.length;
    let card;
    if (it.hero) {
      const primary = h.phase === "planned" ? <Button variant="approve" icon="check" onClick={() => go("route", { ref: it.ref })}>Review and approve</Button> : ["approved", "executing"].includes(h.phase) ? <Button variant="primary" iconRight="arrow-right" onClick={() => go("execution", { ref: it.ref })}>Watch execution</Button> : <Button variant="primary" iconRight="arrow-right" onClick={() => go("route", { ref: it.ref })}>Open Route Room</Button>;
      const money = h.plan ? <div className="stack tight" style={{ gap: 2 }}><Money value={h.posted ? D.ACTUAL.net : D.PLAN.net} size={phone ? "s" : "m"} roll style={{ color: "var(--primary-text)" }} /><span className="t-footnote subtle">{h.posted ? "recovered, after the negotiation" : routed ? "on plan · settles day 3–7" : "net recovered on the plan"} · swing {fmt.inr(h.posted ? D.ACTUAL.swing : D.PLAN.swing)}</span></div> : undefined;
      card = <TrackerCard view={hm.view} done={hm.done} current={hm.current} eta={hm.eta} etaTone={hm.etaTone} agentLive={hm.agentLive} primary={primary} money={money} />;
    } else card = <S.Live.MangoCard item={it} dim={!!live && S.Live.down(live.conn)} />;
    const cluster = it.hero && <Card pad={false} className="stack" style={{ overflow: "hidden", gap: 0 }}>
      <div className="card-head" style={{ padding: "14px 16px 10px" }}><span className="card-title">{v.dist.city} cluster</span><Badge size="sm" tone={hm.ordered ? "green" : undefined} dot={!!hm.ordered}>{hm.ordered ? `${hm.ordered} of ${D.OFFERED} kiranas ordered` : h.offer ? `${D.OFFERED} kiranas messaged` : `${D.OFFERED} kiranas`}</Badge></div>
      <ClusterMap kiranas={D.KIRANAS} orderedCount={hm.ordered} route={routed} vanProgress={h.van.status === "done" ? 1 : hm.ordered / SHOPS * 0.6} height={phone ? 220 : 280} />
    </Card>;
    const events = it.hero ? s.feed : mangoFeed(v);
    const feed = <div className="stack snug"><SectionTitle sub="Every hand-off on this batch, as it happens">Agent activity</SectionTitle><Card>{events.length ? <AgentFeed events={events} people={D.PEOPLE} live={it.hero && hm.agentLive ? s.feed.length - 1 : -1} max={phone ? 4 : 8} /> : <span className="t-footnote muted">The agents report here as they work this batch.</span>}</Card></div>;
    return <Screen me={me} title="Journey"><Columns sideWidth={340} main={<>{card}{cluster}</>} side={feed} /></Screen>;
  }
  // the Record of a batch in a journey (SC-142): the story's batch from its feed and audit; the stub keeps no record of
  // the Mango Drink, which it leaves at its label photo
  function BatchRecord({ me, it, v }) {
    const s = useStore(); const L = window.SC3_LEDGER.record;
    return <Screen me={me} title="Record"><S.RecordTab batch={v.id} steps={it.hero ? L.storyRecord(s).steps : []} photos={it.hero ? L.storyPhotos(s) : []} /></Screen>;
  }
  // one screen of a batch's page
  function BatchPart({ me, it, v, part }) {
    if (it && part === "record") return <BatchRecord me={me} it={it} v={v} />;
    if (!it || part === "journey") return <BatchJourney me={me} it={it} v={v} />;
    if (part === "route") return <RouteRoom me={me} />;
    if (part === "execution") return it.hero ? <Execution me={me} /> : <NotYet me={me} title="Execution" icon="sparkles" head="Nothing is executing yet" body="Listing, outreach, negotiation and the food-bank booking start the moment the plan is approved." />;
    return it.hero ? <S.Paperwork me={me} /> : <NotYet me={me} title="Paperwork" icon="file-text" head="The pack follows the last of its lines" body={`Munchly's price-support credit note, the ITC memo and the FSSAI checklist, drafted by the Paperwork agent once every line of ${it.ref}'s plan is done.`} />;
  }

  /* ---------- Batches ---------- */
  function Batches({ me }) {
    const s = useStore(); const app = useApp(); const { go } = useRoute(); const hm = heroModel(s);
    const views = D.BATCHES.map(b => { const v = D.batchView(b); if (b.hero) v.phase = hm.view.phase; if (b.second) v.phase = "executing"; return v; });
    // each row opens the batch's page (SC-112): Batches is the operator's (SC-127)
    const live = S.useLive();
    const openRow = v => go(partAt(journeyItems(s, live).find(i => i.ref === v.id)), { ref: v.id });
    // every batch that has cleared and passed its best-before (SC-126 took them off the table), by month, each opening
    // its page on its Record (SC-142)
    const LG = window.SC3_LEDGER, past = LG.HISTORY.map(h => LG.caseOf(h.ref)).sort((a, z) => (a.cleared < z.cleared ? 1 : -1));
    const months = []; past.forEach(c => { const m = c.cleared.slice(0, 7); let g = months.find(x => x.m === m); if (!g) months.push(g = { m, label: new Date(c.cleared.slice(0, 10) + "T00:00:00+05:30").toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }), items: [] }); g.items.push(c); });
    const phone = app.bp === "phone";
    return <Screen me={me} title="Batches" sub="Every lot the Watcher sees, and every batch that has cleared">
      <div className="stack" style={{ gap: 20 }}><div className="stack tight"><div className="list-head">In view · from the DMS export</div>
      {app.bp === "phone" ? <div className="list">{views.map(v => <BatchRow key={v.id} view={v} compact onOpen={() => openRow(v)} />)}</div> :
      <DataTable label="Batches" rows={views.map(v => ({ ...v, name: v.skuObj.name }))} onRow={openRow} initialSort={["daysLeft", "asc"]} columns={[
        { key: "name", label: "Product", render: v => <span className="row tight"><Product name={v.skuObj.img} size={36} /><span className="stack tight" style={{ gap: 0 }}><b>{v.skuObj.name}</b><span className="mono subtle t-caption">{v.id}</span></span></span> },
        { key: "dist", label: "Distributor", sortValue: v => v.dist.name, render: v => <span>{v.dist.name}<div className="t-caption subtle">{v.dist.city}</div></span> },
        { key: "daysLeft", label: "Days left", num: true }, { key: "units", label: "Units", num: true, render: v => fmt.num(v.units) },
        { key: "risk", label: "At risk", num: true, sortValue: v => v.assess.atRisk, render: v => v.assess.atRisk ? <span className="neg strong">{fmt.num(v.assess.atRisk)}</span> : "—" },
        { key: "gates", label: "Quick-commerce gates", sortable: false, render: v => <GateChips gates={v.assess.gates} size="sm" /> },
        { key: "status", label: "Status", sortValue: v => v.phase || v.assess.status, render: v => <StatusBadge status={v.phase || v.assess.status} /> },
      ]} />}</div>
      {months.map(g => <List key={g.m} head={`Cleared · ${g.label}`}>{g.items.map(c => { const ph = LG.record.photosOf(c), net = LG.rowOf(c).figures.net;
        return <ListRow key={c.ref} chevron onClick={() => go("report", { ref: c.ref, tab: "record" })} leading={<Product name={c.sku.img} size={40} />}
          title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{c.sku.name}</span><S.OutcomeBadge o={c.outcome} size="sm" /></span>}
          sub={`${c.ref} · ${c.dist.name} · flagged ${fmt.day(c.flagged)} · cleared ${fmt.day(c.cleared)}${phone ? ` · ${fmt.inr(net)}` : ""}`}
          value={phone ? null : <span className="row" style={{ gap: 16 }}><span className="rec-count"><Icon name="camera" size={15} />{ph.length} {ph.length === 1 ? "photo" : "photos"}</span><b className="tnum">{fmt.inr(net)}</b></span>} />; })}</List>)}
      </div>
    </Screen>;
  }
  // what the Watcher sees of a batch, on a watched batch's Journey on the operator's batch page: its days, gates and
  // figures, and what happens to it next. An at-risk batch the Watcher has not flagged says when it will be
  function BatchFacts({ view: sel }) {
    const s = useStore(); const ML = id => D.MANGO_PLAN.lines.find(l => l.id === id) || { units: 0 };
    const next = !sel ? "" : sel.phase === "executing" ? `Routed yesterday: ${fmt.num(ML("kirana").units)} packs to Hyderabad kiranas, ${ML("staff").units} to the staff sale at Lakshmi's godown, ${D.MANGO_FB} to Feeding India.`
      : sel.phase && sel.phase !== "watching" ? "In a journey: the agents are working it, and its Route Room shows where it stands."
      : sel.assess.status === "at-risk" ? `At risk: ${fmt.num(sel.assess.atRisk)} packs will not sell before the last week. The Watcher checks every morning at ${s.rules.watchTime}, and flags it once Setup is confirmed and ${sel.dist.name} has given ${D.PLATFORM.name} permission to act.`
      : sel.assess.status === "gated" ? `Outside at least one quick-commerce gate, but real sell-through clears it in time. The Watcher checks again tomorrow at ${s.rules.watchTime}.` : "Inside every gate and selling through. Nothing to do.";
    return <div className="stack">
      <div className="row" style={{ gap: 14 }}><Product name={sel.skuObj.img} size={88} /><div className="stack tight"><DaysNum days={sel.daysLeft} life={sel.skuObj.lifeDays} size="l" /><span className="t-footnote subtle">days left · best before {fmt.date(sel.bestBefore)}</span></div></div>
      <GateChips gates={sel.assess.gates} />
      <List>{[["Batch", sel.id], ["Distributor", `${sel.dist.name}, ${sel.dist.city}`], ["Units", fmt.num(sel.units)], ["Sells", `${sel.sellPerDay} a day`], ["Will sell before the last week", fmt.num(sel.assess.willSell)], ["At risk", sel.assess.atRisk ? fmt.num(sel.assess.atRisk) : "none"]].map(([k, val]) => <ListRow key={k} title={k} value={val} />)}</List>
      <p className="t-footnote muted">{next}</p>
    </div>;
  }

  Object.assign(window.SC3_SCREENS, { Setup, CommandCenter, RouteRoom, Execution, Batches, ApproveSheet, LabelPhoto, LabelShot, Chat, permissionOf, BATCH_PARTS, BATCH_PART_IDS, partAt, journeyItems, viewOf, shortName, BatchHead, BatchPart, BatchFacts });
})();

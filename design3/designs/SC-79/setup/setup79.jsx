// SC-79's Setup mockup: the workspace's Setup screen (design3/screens/brand.jsx) before the Data agent has mapped the
// first stock export, which is how a live workspace starts and how a reset leaves it. Loaded after screens/brand.js, it
// replaces SC3_SCREENS.Setup. ?opt=a|b the option (A: waiting in the export card; B: three steps, the export first, with
// a docked confirm bar); ?moment=waiting|uploading|mapping|mapped; ?shot=1 holds it still. Fictional throughout.
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
  const Q79 = new URLSearchParams(location.search);
  const OPT = Q79.get("opt") === "b" ? "b" : "a";
  const MOMENT = ["waiting", "uploading", "mapping", "mapped"].includes(Q79.get("moment")) ? Q79.get("moment") : "waiting";
  const SHOT = Q79.get("shot") === "1";

  // SC-79 A and B: the export card. Before the first mapping it says so, keeps the fields the Data agent looks for, and
  // offers the upload; once mapped it is the card as designed
  const NEXT_RUN = "08:30 tomorrow, Fri 2 Oct";
  function ExportCard({ phase, mapped, done, exp, onChoose, fileRef, pick }) {
    const waiting = phase === "waiting", reading = phase === "mapping";
    const title = mapped ? D.SETUP.dms.file : reading ? exp.name : "No stock export mapped yet";
    const sub = mapped ? "Bizom-style DMS export · 312 batches · 4 distributors" : reading ? "The Data agent is reading its columns" : "The Data agent maps your distributors' first export, then loads 90 days of sell-through";
    const status = done ? <Badge tone="green" icon="check">Loaded into BigQuery</Badge> : mapped ? <Badge dot>Mapped · confirm below</Badge> : reading ? <Badge tone="blue" dot>Mapping</Badge> : <Badge dot>Waiting for an export</Badge>;
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight" style={{ minWidth: 0 }}><span className={cx("icontile", !mapped && "soft")}><Icon name="file-spreadsheet" size={17} stroke={2} /></span><span className="stack tight" style={{ gap: 0, minWidth: 0 }}><b style={{ overflowWrap: "anywhere" }}>{title}</b><span className="t-footnote subtle">{sub}</span></span></span><span className="row tight wrap">{!reading && <><Button size="sm" variant={waiting ? "primary" : undefined} icon="upload" onClick={onChoose}>Upload an export</Button><input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={pick} /></>}{status}</span></div>
      <div className="table-wrap" style={{ boxShadow: "none" }} tabIndex={0} role="region" aria-label="Field mapping"><table className="table"><thead><tr><th>Smart-Clearance field</th><th>Column in your file</th><th>Status</th></tr></thead><tbody>
        {D.SETUP.dms.columns.map(([f, c]) => <tr key={f}><td className="strong">{f.replace("_", " ")}</td><td className={mapped ? "mono" : "subtle"}>{mapped ? c : reading ? "reading…" : "not mapped yet"}</td><td>{mapped ? <Badge size="sm" tone="green" icon="check">mapped</Badge> : reading ? <Badge size="sm" tone="blue" dot>mapping</Badge> : <Badge size="sm" dot>waiting</Badge>}</td></tr>)}
      </tbody></table></div>
      <div className="row tight t-footnote muted"><Aura on={!done && (mapped || reading)} className="icontile soft" style={{ width: 26, height: 26, borderRadius: 8 }}><Icon name="database" size={14} /></Aura>{mapped ? "Data Agent mapped 8 of 8 columns and back-filled 90 days of sell-through by pincode and by shop." : reading ? "Data Agent is matching the file's columns to these fields." : <span>Upload an export now, or the Data Agent maps the day's export at its run at <b className="tnum">{NEXT_RUN}</b>.</span>}</div>
    </Card>;
  }
  // SC-79 B: the first step is the export itself, as a place to drop it
  function DropZone({ onChoose, fileRef, pick }) {
    const [over, setOver] = useState(false);
    return <Card className={cx("s79-drop", over && "over")} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) pick({ target: { files: [f], value: "" } }); }}>
      <span className="icontile soft" style={{ width: 44, height: 44, borderRadius: 13 }}><Icon name="upload" size={20} stroke={2} /></span>
      <b className="t-title3">Your distributors' stock export</b>
      <span className="t-subhead muted">A CSV from the DMS: batches, best-before dates and stock on hand. The Data agent maps its columns and loads 90 days of sell-through.</span>
      <span className="row tight wrap" style={{ justifyContent: "center" }}><Button variant="primary" icon="upload" onClick={onChoose}>Choose a CSV</Button><input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={pick} /><span className="t-footnote subtle">or drop it here</span></span>
      <span className="t-footnote subtle s79-wait"><Icon name="clock" size={13} stroke={2.2} /><span>Or wait: the Data agent picks up the day's export at its run at <b className="tnum">{NEXT_RUN}</b>.</span></span>
    </Card>;
  }
  // SC-79 B: three steps to start watching, the current one marked
  function Steps({ phase }) {
    const at = phase === "done" ? 3 : phase === "mapped" ? 2 : phase === "waiting" ? 0 : 1;
    const steps = [["Your stock export", "upload one, or wait for the 08:30 run"], ["The column mapping", "the Data agent maps it"], ["Rules, then confirm", "the Watcher starts at 09:00"]];
    return <ol className="s79-steps" aria-label="Setting up, in three steps">{steps.map(([t, sub], i) => <li key={t} className={cx(i < at && "done", i === at && "now")} aria-current={i === at ? "step" : undefined}><span className="s79-dot" aria-hidden="true">{i < at ? <Icon name="check" size={13} stroke={3} /> : i + 1}</span><span className="stack tight" style={{ gap: 0, minWidth: 0 }}><b>{t}</b><span>{sub}</span></span></li>)}</ol>;
  }
  /* ---------- S0 Setup ---------- */
  const FLOOR_ROWS = [["snacks", "Snacks", "chips"], ["biscuits", "Biscuits", "biscuits"], ["staples", "Staples", "poha"], ["beverages", "Beverages", "mango"], ["personal-care", "Personal care", "facewash"]];
  // a distributor's one-time permission, as the store holds it
  function permissionOf(s, id) {
    if (id === "rakesh") { const p = s.setup.permission; return p ? (p.paused ? { tone: "amber", label: "paused" } : { tone: "green", label: "granted · " + p.at }) : { tone: undefined, label: "requested" }; }
    return D.SETUP.permissions[id] ? { tone: "green", label: "granted · " + D.SETUP.permissions[id] } : { tone: undefined, label: "requested" };
  }
  function Setup({ me, onConfirm }) {
    const s = useStore(); const { go } = useRoute(); const app = useApp(); const { toast } = useNotice();
    const [floors, setFloors] = useState(s.rules.floors); const [taps, setTaps] = useState(s.rules.approvalTaps); const [busy, setBusy] = useState(false);
    const [ret, setRet] = useState(s.rules.returnWindowDays); const [uplift, setUplift] = useState(s.rules.kiranaUplift); const [van, setVan] = useState(s.rules.vanPerUnit);
    const done = s.setup.confirmed;
    // SC-79: the export's way in. waiting (nothing mapped yet) · uploading · mapping (the Data agent reads it) · mapped
    const [phase, setPhase] = useState(MOMENT); const [p, setP] = useState(MOMENT === "uploading" ? 0.62 : 0);
    const mapped = done || phase === "mapped";
    const startUpload = (name, size) => {
      setExp({ name, size }); setPhase("uploading"); setP(0); if (SHOT) return;
      const t0 = performance.now(); const tick = now => { const v = Math.min(1, (now - t0) / 2400); setP(v); if (v < 1) requestAnimationFrame(tick); else { setPhase("mapping"); toast({ text: "Export uploaded · the Data agent is mapping its columns", tone: "ok" }); setTimeout(() => { setPhase("mapped"); toast({ text: "The Data agent mapped 8 of 8 columns", tone: "ok", icon: "database" }); }, 1800); } };
      requestAnimationFrame(tick);
    };
    const confirm = () => { setBusy(true); setTimeout(() => { setBusy(false); Flow.act("connect"); toast({ text: "Setup confirmed · the Watcher starts at 09:00", tone: "ok" }); onConfirm && onConfirm(); }, 900); };
    const chans = D.SETUP.channels; const wo = D.PLAN.writeOff; const chips = D.SKUS.chips;
    // live (SC-73): a new stock export goes straight to the workspace's storage, its progress shown as it goes
    const live = S.useLive(); const [exp, setExp] = useState({ name: D.SETUP.dms.file, size: 4.8e6 }); const fileRef = React.useRef(null);
    const pick = e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return; startUpload(f.name, f.size); };
    const uploading = phase === "uploading";
    const choose = () => (SHOT ? startUpload(D.SETUP.dms.file, 4.8e6) : fileRef.current && fileRef.current.click());
    return <Screen me={me} title="Setup" sub="Connect the stock data once and set the rules the agents must obey">
      <div className="stack" style={{ gap: 20 }}>
        {OPT === "b" && <Steps phase={done ? "done" : phase} />}
        {uploading && <S.Live.ExportUpload name={exp.name} size={exp.size} p={p} onCancel={() => setPhase("waiting")} />}
        {!uploading && (OPT === "b" && phase === "waiting" ? <DropZone onChoose={choose} fileRef={fileRef} pick={pick} /> : <ExportCard phase={phase} mapped={mapped} done={done} exp={exp} onChoose={choose} fileRef={fileRef} pick={pick} />)}
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
        {done ? <div className="row wrap" style={{ gap: 10 }}><Badge tone="green" icon="check">Watching since setup</Badge><Button variant="primary" iconRight="arrow-right" onClick={() => go("command")}>Open Command Center</Button></div>
          : OPT === "a" ? <div className="row wrap" style={{ gap: 10 }}><Button variant="primary" size="lg" icon="check" loading={busy} disabled={!mapped} aria-describedby={mapped ? undefined : "s79-why"} onClick={confirm}>Confirm and start watching</Button>{!mapped && <span id="s79-why" className="s79-why"><Icon name="info" size={15} stroke={2.2} />Confirm once the Data agent has mapped an export.</span>}</div>
          : <div className="s79-bar" role="region" aria-label="Start watching"><span className="stack tight grow" style={{ gap: 0, minWidth: 0 }}><b>{mapped ? "Step 3 of 3 · check the rules" : phase === "waiting" ? (app.bp === "phone" ? "Step 1 of 3 · an export" : "Step 1 of 3 · waiting for an export") : "Step 2 of 3 · the Data agent is mapping it"}</b><span id="s79-why" className="t-footnote subtle">{mapped ? "The Watcher starts at 09:00 once you confirm." : "Confirm once the Data agent has mapped an export."}</span></span><Button variant="primary" size={app.bp === "phone" ? undefined : "lg"} icon="check" loading={busy} disabled={!mapped} aria-describedby="s79-why" onClick={confirm}>{app.bp === "phone" ? "Confirm" : "Confirm and start watching"}</Button></div>}
      </div>
    </Screen>;
  }

  window.SC3_SCREENS.Setup = Setup;
})();

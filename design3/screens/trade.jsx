// Smart-Clearance v3 · the trade: Rakesh bhai (distributor), Ganesh ji (kirana), Agrawal ji on ExpireSoon (buyer), Meera (food bank)
(function () {
  const { useState, useEffect, useRef, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Sheet, Product, Empty, Money, Roll, DaysNum, GateChips, Tile, Aura, AgentFeed, ClusterMap, HaulLine, StatusBadge, BatchRow, useApp, useNotice, Mark, WorkspaceMark } = K;
  const { useStore, useRoute, heroModel, Screen, Columns, SectionTitle, Locked } = S;
  const IMG = () => window.SC3_IMG || "system/img/";
  const distOf = me => Object.values(D.DISTRIBUTORS).find(d => d.name === (me && me.org)) || D.DISTRIBUTORS.rakesh;
  // a kirana by its member's shop: one of the story's 31, else another of Rakesh's shops, an invited one (world.js, SC-130)
  const WK = () => (window.SC3_WORLD && window.SC3_WORLD.KIRANAS) || [];
  const kOf = me => { const name = me && me.org; const d = D.KIRANAS.find(k => k.name === name); if (d) return d; const w = WK().find(k => k.name === name); return w ? { id: w.id, name: w.name, area: w.area, units: w.sales14 * M.RULES.shopCapTimes, at: "10:15" } : D.KIRANAS[0]; };
  const shopOf = me => WK().find(k => k.name === (me && me.org)) || WK()[0];
  const shopById = id => D.KIRANAS.find(k => k.id === id) || WK().find(k => k.id === id);
  // a partner's own history (SC-130): ledger.js's partners, and the pieces their pages share
  const P = () => window.SC3_LEDGER.partners;
  const asDate = iso => new Date((iso.length > 10 ? iso : iso + "T00:00") + ":00+05:30");
  const day = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const when = iso => (iso.length > 10 ? `${day(iso)}, ${iso.slice(11, 16)}` : day(iso));
  const weekday = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
  const monthOf = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  // the head of a partner's batch, offer or pickup page: the pack, the name, the id and where, and how it stands
  function PtHead({ sku, id, where, badge, line, children }) {
    const phone = useApp().bp === "phone";
    return <div className="bhead"><div className="bh-id">
      <span className="bh-pic" aria-hidden="true"><Product name={sku.img} size={phone ? 46 : 72} alt="" /></span>
      <div className="bh-tt"><h1>{sku.name}</h1>
        <div className="bh-meta"><span className="mono">{id}</span><span className="sep" aria-hidden="true">·</span><span>{where}</span></div>
        <div className="bh-meta">{badge}{line && <span>{line}</span>}</div>
      </div>
    </div>{children}</div>;
  }
  // a page's own tabs, as the operator's batch page draws them (SC-112)
  function PtTabs({ tabs, value, onChange, label }) {
    const phone = useApp().bp === "phone";
    return <nav className="bh-tabs" aria-label={label}>{tabs.map(t => { const on = t.id === value;
      return <button key={t.id} type="button" className="bh-tab" aria-current={on ? "page" : undefined} onClick={() => onChange(t.id)}>
        {on && <motion.span layoutId="pt-tab-thumb" className="bh-tab-thumb" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
        {!phone && <Icon name={t.icon} size={16} />}<span>{t.label}</span></button>; })}</nav>;
  }
  const PtLine = ({ k, sub, v, strong, onClick }) => <div className={cx("pt-line", strong && "strong")}><span>{k}{sub && <em> {onClick ? <button type="button" className="pt-link" onClick={onClick}>{sub}</button> : sub}</em>}</span><span className="tnum">{v}</span></div>;
  // what happened to a batch, its moments down a spine; those still to come dimmed
  function PtMoments({ items }) {
    return <div className="pt-moments" role="list">{items.map((m, i) => <div key={m.k + i} role="listitem" className={cx("pt-moment", m.ahead && "ahead")}>
      <span className="icontile"><Icon name={m.icon} size={17} stroke={2} /></span>
      <div><b>{m.title}</b>{m.sub && <span className="sub">{m.sub}</span>}</div>
      <time>{m.at ? (m.at.length > 10 ? when(m.at) : m.at) : "next"}</time>
    </div>)}</div>;
  }
  // a paper on its page, in a sheet, with its PDF (the Paperwork agent's own on the live workspace; printed here)
  function PaperSheet({ open, onClose, c, id, receipt }) {
    const ref = useRef(null);
    const d = receipt || (c && id && c.docs.find(x => x.id === id));
    const pdf = () => { const n = ref.current; if (n && d) S.printPage(`${d.type || "Donation receipt"} ${d.no || ""}`, `<div class="${n.className}">${n.innerHTML}</div>`, { styles: true }); };
    return <Sheet open={open && !!d} onClose={onClose} title={d ? d.type || "Donation receipt" : ""} footer={d ? <Button variant="secondary" block icon="download" onClick={pdf}>Download PDF</Button> : null}>
      {d && <div ref={ref} className="stack snug">{receipt ? <S.Receipt doc={receipt} batch={receipt.batch || (c && c.batch)} sku={receipt.sku || (c && c.sku)} dist={receipt.dist || (c && c.dist)} /> : <S.Paper id={id} c={c} />}</div>}
    </Sheet>;
  }
  const PAPER_ICON = { invoice: "receipt", eway: "truck", support: "hand-coins", expiry: "warehouse", receipt: "heart-handshake", destruction: "trash-2" };
  const issuedBy = (c, d) => (d.id === "invoice" || d.id === "eway" ? "You issue it" : d.id === "receipt" ? `${c.partner ? c.partner.name : "The food bank"} issued it to ${D.WORKSPACE.short} · a copy for you` : d.id === "destruction" ? `${D.WORKSPACE.short} destroyed the packs · a copy for you` : `${D.WORKSPACE.short} issued it to you`);
  // one paper as a row: its icon, type, number, who issued it, its amount
  function PaperRow({ c, d, onOpen }) {
    const amount = d.status === "not required" || d.id === "receipt" ? null : d.id === "invoice" ? d.total || d.amount : d.amount;
    return <button type="button" className="pt-paper" onClick={() => onOpen(d.id)}>
      <span className="icontile"><Icon name={PAPER_ICON[d.id] || "file-text"} size={17} stroke={2} /></span>
      <span className="grow"><b>{d.type}</b><span className="t-footnote muted"><span className="mono">{d.no}</span> · {issuedBy(c, d)}{d.status === "not required" ? " · not required" : ""}</span></span>
      {amount ? <span className="tnum strong">{fmt.inr(amount)}</span> : null}<Icon name="chevron-right" size={16} className="subtle" />
    </button>;
  }
  const cartons = u => { const c = Math.floor(u / 24), r = u % 24; return r === 12 ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? "" : "s"}`; };
  const ES = D.PLAN.lines.find(l => l.id === "expiresoon"), KL = D.PLAN.lines.find(l => l.id === "kirana");
  const SHOPS = D.KIRANAS.length, CHIPS = D.SKUS.chips;
  const all = h => h.orders.length === SHOPS;

  /* ======================= Rakesh bhai · distributor ======================= */
  // the one-time permission: the agent may act in his name, inside Munchly's floors, and he can pause it
  function PermissionCard() {
    const [busy, setBusy] = useState(false); const [later, setLater] = useState(false); const { toast } = useNotice();
    const allow = () => { setBusy(true); setTimeout(() => { setBusy(false); Flow.act("permit"); toast({ text: "Allowed · you can pause it any time", tone: "ok" }); }, 600); };
    if (later) return <Card className="row wrap" style={{ gap: 14 }}><WorkspaceMark ws={D.WORKSPACE} size={36} /><div className="grow"><b>Munchly is waiting for your permission</b><div className="t-footnote muted">Nothing is listed or offered in your name until you allow it.</div></div><Button variant="secondary" onClick={() => setLater(false)}>Review</Button></Card>;
    return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bezel"><div className="card raised stack snug" style={{ padding: 20 }}>
      <div className="row tight"><WorkspaceMark ws={D.WORKSPACE} size={30} /><span className="t-footnote subtle strong">{D.WORKSPACE.name} · {D.JOURNEY.permissionAsked}</span></div>
      <div className="t-title3">Let Smart-Clearance act for Rakesh Traders</div>
      <div className="stack tight">{D.SETUP.acts.map(t => <div key={t} className="row top t-subhead" style={{ gap: 10 }}><Icon name="check" size={17} stroke={2.4} style={{ color: "var(--primary-text)", marginTop: 2, flex: "none" }} /><span>{t}</span></div>)}</div>
      <p className="t-footnote muted" style={{ margin: 0 }}>Always within Munchly's price floors. Every action shows here, and you can pause any of it. Munchly pays you the gap to the ₹{CHIPS.dp} you paid, so you end whole.</p>
      <div className="row wrap" style={{ gap: 10 }}><Button variant="approve" size="lg" icon="check" loading={busy} onClick={allow}>Allow</Button><Button variant="ghost" size="lg" onClick={() => setLater(true)}>Not now</Button></div>
    </div></motion.div>;
  }
  function ActingFor({ p }) {
    const { toast } = useNotice();
    const flip = () => { Flow.act("pause", !p.paused); toast({ text: p.paused ? "Resumed · the agents carry on" : "Paused · nothing more happens in your name", tone: "ok" }); };
    return <Card className="row wrap" style={{ gap: 12 }}><span className={cx("icontile", p.paused ? "amber" : "")} style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name={p.paused ? "circle-pause" : "handshake"} size={19} /></span><div className="grow" style={{ minWidth: 0 }}><b>{p.paused ? "Paused: nothing happens in your name" : "Smart-Clearance acts for you"}</b><div className="t-footnote muted">{p.paused ? "Listings, offers and invoice drafts wait until you resume." : `Inside Munchly's floors · since ${p.at} · listings, scheme offers, invoice drafts, dispatch slots`}</div></div><Button variant={p.paused ? "primary" : "secondary"} size="sm" icon={p.paused ? "play" : "pause"} onClick={flip}>{p.paused ? "Resume" : "Pause"}</Button></Card>;
  }
  // what he receives and what he paid: the price support makes the two equal
  // on expiry day, the expiry credit for the packs left at the godown joins what he receives (SC-94)
  function EndWhole({ settled }) {
    const h = useStore().hero; const x = settled && h.expiry && h.expiry.units > 0 && h.expiry.credit ? h.expiry : null;
    const recv = KL.gross + D.AWARD.gross + D.SUPPORT.total + (x ? x.credit : 0); const paid = D.PLAN.units * CHIPS.dp + D.SUPPORT.van + D.SUPPORT.fee;
    return <Card className="stack snug">
      <div className="card-head"><span className="card-title">You end whole</span><Badge tone={settled ? "green" : undefined} icon={settled ? "check" : "clock"}>{settled ? "credit note issued" : "on the plan"}</Badge></div>
      <div className="stack tight t-subhead">
        {[[`From ${SHOPS} kiranas (${KL.units} packets)`, KL.gross], [`From ${D.BUYER.name} (${ES.units} packets)`, D.AWARD.gross], ["Price-support credit note from Munchly", D.SUPPORT.total], ...(x ? [[`Expiry credit note for ${fmt.num(x.units)} packs from Munchly`, x.credit]] : [])].map(([k, v]) => <div key={k} className="row between"><span>{k}</span><span className="tnum">{fmt.inr(v)}</span></div>)}
        <div className="hairline" style={{ margin: "4px 0" }} />
        <div className="row between"><b>What you receive</b><span className="tnum strong">{fmt.inr(recv)}</span></div>
        <div className="row between"><span>What you paid: {fmt.num(D.PLAN.units)} × ₹{CHIPS.dp}, the van and the listing fee</span><span className="tnum">{fmt.inr(-paid)}</span></div>
        <div className="row between"><b>Your gain or loss</b><span className="tnum strong">{fmt.inr(Math.round(recv - paid))}</span></div>
      </div>
      <span className="t-caption subtle">Instead of waiting weeks for an expiry claim, with no claim paperwork.</span>
    </Card>;
  }
  function InvoiceDraft({ h }) {
    const inv = D.INVOICE; const { toast } = useNotice();
    return <Card className="row wrap" style={{ gap: 14 }}><span className="icontile"><Icon name="receipt" size={17} stroke={2} /></span><div className="grow" style={{ minWidth: 0 }}><b>Invoice {inv.no} to {D.BUYER.name}</b><div className="t-footnote muted">{ES.units} × ₹{D.COUNTER.price.toFixed(2)} + IGST {inv.gstPct}% · {fmt.inr(inv.total)} · drafted by the Paperwork agent for you</div></div>{h.invoiceIssued ? <Badge tone="green" icon="check">issued from Tally</Badge> : <Button variant="primary" size="sm" icon="check" onClick={() => { Flow.act("issueInvoice"); toast({ text: "Marked issued from Tally", tone: "ok" }); }}>Issue from Tally</Button>}</Card>;
  }
  // the staff sale at the godown (SC-87, option A): the packs and the price, the distributor's UPI address to show staff,
  // and one count to record what sold, once, when the sale is over. The code beside the address is an illustration drawn
  // from it, not a payment code: nothing scans it
  function payCells(upi, n = 21) {
    let seed = [...upi].reduce((t, ch) => (t * 31 + ch.charCodeAt(0)) >>> 0, 7);
    const r = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32;
    const corner = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].find(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
    const cells = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const f = corner(x, y);
      if (f) { if (Math.max(Math.abs(x - f[0] - 3), Math.abs(y - f[1] - 3)) !== 2) cells.push([x, y]); }
      else if (r() < 0.47) cells.push([x, y]);
    }
    return cells;
  }
  function PayCode({ upi, size = 92 }) {
    const cells = useMemo(() => payCells(upi), [upi]);
    return <svg className="paycode" width={size} height={size} viewBox="-1 -1 23 23" aria-hidden="true">{cells.map(([x, y]) => <rect key={x + "-" + y} x={x} y={y} width="1" height="1" />)}</svg>;
  }
  function StaffSale({ staff, dist, product, clears }) {
    const [n, setN] = useState(staff.units); const [busy, setBusy] = useState(false); const { toast } = useNotice();
    const record = () => { setBusy(true); setTimeout(() => { setBusy(false); Flow.act("recordStaffSale", n); toast({ text: `Recorded · ${fmt.num(n)} of ${fmt.num(staff.units)} packs sold`, tone: "ok" }); }, 400); };
    const open = staff.status === "open";
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className="icontile"><Icon name="users" size={17} stroke={2} /></span><span className="card-title">Staff sale · {product}</span></span>{open ? <Badge tone="blue" dot>open</Badge> : <Badge tone="green" icon="check">recorded</Badge>}</div>
      {open ? <>
        <span className="t-subhead">{fmt.num(staff.units)} packs for your staff at <b>₹{staff.price}</b> a pack, at {staff.godown}. Staff pay you by UPI.</span>
        {dist.upi && <div className="row" style={{ gap: 14 }}><PayCode upi={dist.upi} /><div className="stack tight" style={{ gap: 2, minWidth: 0 }}><b className="mono t-footnote" style={{ overflowWrap: "anywhere" }}>{dist.upi}</b><span className="t-footnote muted">Your own UPI: staff pay you at the godown{clears ? `, over ${clears}` : ""}.</span></div></div>}
        <div className="row wrap" style={{ gap: 12 }}><Stepper value={n} onChange={setN} min={0} max={staff.units} label="packs sold to staff" /><span className="t-subhead muted">of {fmt.num(staff.units)} packs sold</span></div>
        <Button variant="primary" size="lg" block icon="check" loading={busy} onClick={record}>Record the sale</Button>
        <span className="t-caption subtle">Record once, when the sale is over. What does not sell stays at the godown.</span>
      </> : <>
        <span className="t-subhead"><b>{fmt.num(staff.sold)} of {fmt.num(staff.units)}</b> sold to staff at ₹{staff.price} a pack</span>
        <K.Progress value={staff.sold / staff.units} label="Staff packs sold" />
        <span className="t-footnote muted">{staff.left ? `${fmt.num(staff.left)} ${staff.left === 1 ? "pack stays" : "packs stay"} at ${staff.godown}.` : "Every pack sold."}</span>
      </>}
    </Card>;
  }

  function DistHome({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const app = useApp();
    const dist = distOf(me); const hero = dist.id === "rakesh"; const perm = s.setup.permission;
    const mine = D.BATCHES.filter(b => b.distributor === dist.id).map(b => { const v = D.batchView(b); if (b.hero) v.phase = heroModel(s).view.phase; if (b.second) v.phase = "executing"; return v; });
    const units = h.orders.reduce((t, o) => t + o.units, 0);
    const approved = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const settled = ["settled", "cleared"].includes(h.phase);
    // live (SC-73): a day with nothing asked of the distributor
    const live = S.useLive();
    if (live && live.quiet) return <S.Live.DistQuiet me={me} dist={dist} perm={hero ? (perm ? <ActingFor p={perm} /> : <PermissionCard />) : null} />;
    return <Screen me={me} title="Today" sub={`${dist.name} · ${dist.godown}, ${dist.city}`}>
      <div className="stack" style={{ gap: 16 }}>
        {hero && !perm && <PermissionCard />}
        {hero && perm && <ActingFor p={perm} />}
        {!hero && <Card className="row wrap" style={{ gap: 14 }}><Product name="godown" size={72} /><div className="grow"><b>Nothing to do today</b><div className="t-footnote muted">No photo requests, scheme orders or marketplace lots for {dist.name} right now. The Watcher checks your stock every morning at 09:00.</div></div></Card>}
        {hero && h.photo.status === "requested" && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bezel"><div className="card raised stack snug" style={{ padding: 20 }}>
          <div className="row tight"><Mark size={30} /><span className="t-footnote subtle strong">Smart-Clearance · {D.PUSH.verify.at}</span></div>
          <div className="t-title3">{D.PUSH.verify.title}</div>
          <p className="t-body" style={{ margin: 0 }}>{D.PUSH.verify.body}</p>
          <div className="row" style={{ gap: 12 }}><Product name="phone-scan" size={72} /><span className="t-footnote muted">Shelf B4 · one carton of Masala Chips 150 g · batch MF-2409-117</span></div>
          <Button variant="primary" size="lg" icon="camera" block onClick={() => go("photo")}>Open camera</Button>
        </div></motion.div>}
        {hero && ["reading", "verified"].includes(h.photo.status) && !approved && <Card className="row" style={{ gap: 14 }}><Aura on={h.photo.status === "reading"} className="icontile" style={{ borderRadius: 12, width: 40, height: 40 }}><Icon name={h.photo.status === "verified" ? "check" : "scan-line"} size={19} stroke={2.2} /></Aura><div className="grow"><b>{h.photo.status === "verified" ? "Label verified · thank you" : "Photo sent · reading the label"}</b><div className="t-footnote muted">{h.photo.status === "verified" ? "Batch, dates and MRP match your DMS record. Munchly gets a plan in a few minutes." : "Sent at 09:19. Nothing else needed from you."}</div></div></Card>}
        {hero && approved && !settled && <Card className="stack snug">
          <div className="card-head"><span className="card-title">Munchly's plan for your Masala Chips</span><Badge tone="green" icon="check">approved 09:40</Badge></div>
          <div className="stack tight t-subhead">
            <div className="row top" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--ch-kirana)" }} /><span><b>{KL.units} packets to your kiranas</b> on the scheme: ₹{KL.packPrice.toFixed(2)} a pack, 2 free with every 10, delivered on your {D.JOURNEY.van.day} round.</span></div>
            <div className="row top" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--ch-expiresoon)" }} /><span><b>{ES.units} on ExpireSoon in your name</b> at ₹15, hidden from buyers in Munchly's territories. The buyer collects with his own truck.</span></div>
          </div>
        </Card>}
        {hero && h.staff && <StaffSale staff={h.staff} dist={dist} product={CHIPS.name.replace(/ \d.*$/, "")} clears={(M.CHANNELS.find(x => x.id === "staff") || {}).clears} />}
        {hero && approved && <div style={{ display: "grid", gap: 16, gridTemplateColumns: app.bp === "phone" ? "minmax(0,1fr)" : "repeat(2, minmax(0,1fr))" }}>
          <Card interactive className="stack snug" onClick={() => go("van")} role="button" tabIndex={0} onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go("van"))}>
            <div className="card-head"><span className="row tight"><span className="icontile"><Icon name="truck" size={17} stroke={2} /></span><span className="card-title">{D.JOURNEY.van.day} van round</span></span><Icon name="chevron-right" size={18} className="subtle" /></div>
            <div className="row base" style={{ gap: 8 }}><span className="num m"><Roll value={h.orders.length} /></span><span className="muted">shops · {cartons(units)}</span></div>
            <span className="t-footnote subtle">{h.van.status === "done" ? `Delivered · all ${SHOPS} shops` : h.orders.length ? "Orders from the Masala Chips scheme join this round" : "Scheme orders will appear here"}</span>
          </Card>
          <Card interactive className="stack snug" onClick={() => go("van")} role="button" tabIndex={0} onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go("van"))}>
            <div className="card-head"><span className="row tight"><span className="icontile violet"><Icon name="package" size={17} stroke={2} /></span><span className="card-title">{D.BUYER.city} lot · ExpireSoon</span></span><Icon name="chevron-right" size={18} className="subtle" /></div>
            <div className="row base" style={{ gap: 8 }}><span className="num m">{ES.units}</span><span className="muted">units · {cartons(ES.units)}</span></div>
            <span className="t-footnote subtle">{h.truck.status === "dispatched" ? `Collected by ${D.BUYER.name}'s truck` : h.award ? `Sold at ₹${D.COUNTER.price.toFixed(2)} · token ${fmt.inr(D.AWARD.token)} paid` : h.listing ? "Listed at ₹15 in your name · waiting for a buyer" : "Not listed"}</span>
          </Card>
        </div>}
        {hero && settled && <InvoiceDraft h={h} />}
        {hero && approved && <EndWhole settled={settled} />}
        <SectionTitle sub="From your nightly DMS export">Your stock</SectionTitle>
        <div className="list">{mine.map(v => <BatchRow key={v.id} view={v} compact={app.bp === "phone"} onOpen={() => (v.phase && v.phase !== "watching" ? go("batches", { ref: v.id }) : null)} />)}</div>
      </div>
    </Screen>;
  }

  function CameraScreen({ me, realCamera }) {
    if (distOf(me).id !== "rakesh") return <Screen me={me} title="Label photo" sub="Requests from the Vision agent"><Card style={{ maxWidth: 560 }}><Empty img="phone-scan" title="No photo requests" body="When a batch needs checking, Vision asks for one picture of a carton label here." /></Card></Screen>;
    return <CameraInner me={me} realCamera={realCamera} />;
  }
  // the label photo (SC-80, option A): the frame shows what Vision needs, and under it the two ways, Take a photo and
  // Upload a photo, the primary following the device. A phone takes the photo with its own camera app; on the live
  // workspace a laptop opens its camera in the frame. A photo in hand shows whole before it goes. What is sent is what
  // backend-api takes, a JPEG, PNG or WebP under 8 MB; naming the types makes an iPhone hand over its HEIC as a JPEG
  const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"], PHOTO_MAX_MB = 8;
  const PHOTO_RULE = `JPEG, PNG or WebP, under ${PHOTO_MAX_MB}\u00a0MB`;
  const CAM_BLOCKED = "The camera is blocked for this page. Allow it in the browser's site settings, or upload a photo.";
  const CAM_NONE = "No camera was found. Upload a photo instead.";
  function CameraInner({ me, realCamera }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const reduce = useReducedMotion(); const app = useApp();
    const phoneCam = useRef(null), files = useRef(null), video = useRef(null), stream = useRef(null);
    const [shot, setShot] = useState(null); const [flash, setFlash] = useState(false); const [sending, setSending] = useState(false);
    const [camOn, setCamOn] = useState(false); const [camLive, setCamLive] = useState(null); const [over, setOver] = useState(false);
    const [err, setErr] = useState(null); const [ratio, setRatio] = useState(null);
    const sent = h.photo.status === "reading" || h.photo.status === "verified";
    // live (SC-73): the photo goes to the workspace's storage, and Send fills as it goes
    const live = S.useLive(); const uploading = !!live && live.uploads.photo != null;
    const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    const desk = !coarse && app.bp !== "phone";
    const stopCam = () => { if (stream.current) stream.current.getTracks().forEach(t => t.stop()); stream.current = null; setCamLive(null); setCamOn(false); };
    useEffect(() => () => { if (stream.current) stream.current.getTracks().forEach(t => t.stop()); }, []);
    // a photo picked, dropped or taken: refused with its reason if backend-api would refuse it
    const use = (f, how) => {
      setOver(false); if (!f) return;
      if (!PHOTO_TYPES.includes(f.type)) { setErr("That file is not a photo Vision can read. Send a JPEG, PNG or WebP."); return; }
      if (f.size >= PHOTO_MAX_MB * 1048576) { setErr(`That photo is ${(f.size / 1048576).toFixed(1)}\u00a0MB. Send one under ${PHOTO_MAX_MB}\u00a0MB.`); return; }
      setErr(null); setRatio(null); setShot({ url: URL.createObjectURL(f), how, name: f.name });
    };
    const picked = how => e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; use(f, how); };
    // a laptop's camera in the frame (the rear one where there is one); refused or missing, it says so
    const openCam = async () => {
      const md = navigator.mediaDevices; if (!md || !md.getUserMedia) { setErr(CAM_NONE); return; }
      setCamOn(true);
      try { const st = await md.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); stream.current = st; setCamLive(st); }
      catch (e) { stopCam(); setErr(e && e.name === "NotAllowedError" ? CAM_BLOCKED : CAM_NONE); }
    };
    const feed = el => { video.current = el; if (el && camLive && el.srcObject !== camLive) { el.srcObject = camLive; el.play().catch(() => {}); } };
    const blink = () => { setFlash(true); setTimeout(() => setFlash(false), reduce ? 0 : 180); };
    const take = () => {
      setErr(null);
      if (realCamera && coarse && phoneCam.current) { phoneCam.current.click(); return; }
      if (realCamera && live) { openCam(); return; }
      // the prototype's stand-in: the shelf as the photo
      blink(); setTimeout(() => setShot({ demo: true, how: "camera" }), reduce ? 0 : 180);
    };
    const shutter = () => {
      const v = video.current; if (!v || !v.videoWidth) return;
      const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0);
      blink(); c.toBlob(b => { stopCam(); if (b) use(new File([b], "label-photo.jpg", { type: "image/jpeg" }), "camera"); }, "image/jpeg", 0.92);
    };
    const upload = () => { setErr(null); files.current && files.current.click(); };
    const again = () => { setShot(null); setRatio(null); (shot && shot.how === "camera" ? take : upload)(); };
    const drop = sent || uploading ? {} : { onDragOver: e => { e.preventDefault(); setOver(true); }, onDragLeave: () => setOver(false), onDrop: e => { e.preventDefault(); use(e.dataTransfer.files && e.dataTransfer.files[0], "upload"); } };
    const send = () => { if (live) { live.sendPhoto(() => Flow.act("sendPhoto")); return; } setSending(true); setTimeout(() => { setSending(false); Flow.act("sendPhoto"); }, 700); };
    const busy = sent || uploading;
    const photo = shot && !shot.demo;
    const caption = shot ? "Check that you can read the batch, both dates and the MRP." : camOn ? "Hold the label flat to the camera, close enough to read." : desk ? `${PHOTO_RULE}. Or drop a photo on the frame.` : `Take a photo opens your camera. ${PHOTO_RULE}.`;
    return <Screen me={me} title="Label photo" sub="Batch MF-2409-117 · shelf B4" back="Today">
      <div className="stack" style={{ gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <div className={cx("cam", camOn && "landscape")} style={photo && ratio ? { aspectRatio: String(ratio) } : undefined} {...drop}>
          {photo ? <motion.img key={shot.url} className="cam-feed whole" src={shot.url} alt="Your photo of the carton label" onLoad={e => setRatio(Math.max(0.75, Math.min(1.5, e.target.naturalWidth / e.target.naturalHeight)))} initial={reduce ? false : { opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} />
            : camOn ? <video ref={feed} className="cam-feed" playsInline muted aria-label="The laptop's camera" />
            : <S.LabelShot cover dim={!shot && !busy} />}
          {!shot && !busy && <><div className="cam-frame" aria-hidden="true"><i /><i /><i /><i /></div><div className="cam-hint">{camOn ? (camLive ? "Fit one carton label in the frame" : "Starting the camera…") : "Like this: one carton label, close up"}</div></>}
          {!shot && !camOn && !busy && <span className="cam-tag">Example</span>}
          {camOn && <span className="cam-tag on"><i aria-hidden="true" />Laptop camera</span>}
          {shot && !busy && <span className="cam-tag">{photo && shot.how === "upload" && shot.name ? shot.name : "Your photo"}</span>}
          <AnimatePresence>{over && !busy && <motion.div key="d" className="cam-drop" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}><span className="cam-drop-in"><Icon name="image" size={22} /><b>Drop the photo to use it</b></span></motion.div>}</AnimatePresence>
          {sent && <div className="cam-hint" style={{ background: "var(--green-700)" }}><Icon name={h.photo.status === "verified" ? "check" : "loader"} size={14} className={h.photo.status === "verified" ? "" : "spin"} /> {h.photo.status === "verified" ? "Verified · matches your records" : "Sent · Vision is reading the label"}</div>}
          <AnimatePresence>{flash && <motion.div key="f" className="cam-flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} />}</AnimatePresence>
          {h.photo.status === "reading" && !reduce && <motion.div aria-hidden="true" className="cam-scan" animate={{ top: ["20%", "76%", "20%"] }} transition={{ duration: 1.6, repeat: 2, ease: "easeInOut" }} />}
        </div>
        {sent ? <Card className="stack snug">
          <div className="row" style={{ gap: 12 }}><Aura on={h.photo.status === "reading"} className="icontile" style={{ borderRadius: 12, width: 40, height: 40 }}><Icon name={h.photo.status === "verified" ? "badge-check" : "scan-line"} size={19} /></Aura><div className="grow"><b>{h.photo.status === "verified" ? "Done. Dhanyavaad, Rakesh bhai." : "Reading batch, dates and MRP"}</b><div className="t-footnote muted">{h.photo.status === "verified" ? "The plan for this batch will reach Priya in a few minutes." : "This takes a few seconds."}</div></div></div>
          {h.photo.status === "verified" && <List>{[["Batch", "MF-2409-117"], ["Best before", "18 Nov 2026"], ["MRP", "₹30.00"]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>}
          <Button variant="secondary" block onClick={() => go("home")}>Back to today</Button>
        </Card> : uploading ? <S.Live.SendFill p={live.uploads.photo} onCancel={() => live.cancelUpload("photo")} />
          : <AnimatePresence mode="wait" initial={false}>
            {shot ? <motion.div key="send" className="row" style={{ gap: 10 }} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}><Button variant="secondary" size="lg" icon={shot.how === "camera" ? "rotate-ccw" : "image"} onClick={again} style={{ flex: "none" }}>{shot.how === "camera" ? "Retake" : "Choose another"}</Button><Button variant="primary" size="lg" block icon="send" loading={sending} onClick={send}>Send photo</Button></motion.div>
              : camOn ? <motion.div key="cam" className="cam-bar" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}><Button variant="ghost" onClick={stopCam}>Cancel</Button><button type="button" className="shutter" aria-label="Take the photo" disabled={!camLive} onClick={shutter}><span /></button><Button variant="ghost" icon="image" onClick={() => { stopCam(); upload(); }}>Upload</Button></motion.div>
              : <motion.div key="two" className="cam-two" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}><Button variant={desk ? "secondary" : "primary"} size="lg" icon="camera" onClick={take}>Take a photo</Button><Button variant={desk ? "primary" : "secondary"} size="lg" icon="upload" onClick={upload}>Upload a photo</Button></motion.div>}
          </AnimatePresence>}
        <input ref={phoneCam} type="file" accept={PHOTO_TYPES.join(",")} capture="environment" onChange={picked("camera")} className="sr-only" tabIndex={-1} aria-hidden="true" />
        <input ref={files} type="file" accept={PHOTO_TYPES.join(",")} onChange={picked("upload")} className="sr-only" tabIndex={-1} aria-hidden="true" />
        {err && !busy ? <p className="cam-alert" role="alert"><Icon name="triangle-alert" size={15} />{err}</p>
          : uploading ? <p className="t-caption subtle" style={{ textAlign: "center", margin: 0 }}>A slow connection only slows the send.</p>
          : !sent && realCamera && <p className="t-caption subtle" style={{ textAlign: "center", margin: 0 }}>{live ? caption : `${caption} In this prototype a stub stands in for Gemini vision and returns the batch record.`}</p>}
      </div>
    </Screen>;
  }

  function VanRoute({ me }) {
    if (distOf(me).id !== "rakesh") return <Screen me={me} title="Van route" sub={distOf(me).cluster}><Card style={{ maxWidth: 560 }}><Empty img="van" title="No scheme orders on the van" body="Orders from Smart-Clearance offers join your next round automatically." /></Card></Screen>;
    return <VanInner me={me} />;
  }
  function VanInner({ me }) {
    const s = useStore(); const h = s.hero; const app = useApp(); const reduce = useReducedMotion(); const { toast } = useNotice();
    const units = h.orders.reduce((t, o) => t + o.units, 0); const full = all(h);
    // the truck loads once the kirana scheme is over: closed, or every shop has ordered (SC-118)
    const schemeOpen = !!h.offer && h.offer.status === "sent" && !full;
    const [p, setP] = useState(h.van.status === "done" ? 1 : 0); const [running, setRunning] = useState(false);
    useEffect(() => { if (h.van.status === "done" && !running) setP(1); }, [h.van.status]);
    const start = () => { setRunning(true); const t0 = performance.now(), dur = reduce ? 10 : 3600; const step = now => { const k = Math.min(1, (now - t0) / dur); setP(k); if (k < 1) requestAnimationFrame(step); else { setRunning(false); Flow.act("vanRound"); toast({ text: `Round done · ${SHOPS} shops, ${cartons(units)}`, tone: "ok" }); } }; requestAnimationFrame(step); };
    const dispatch = () => { Flow.act("dispatch"); toast({ text: `${D.BUYER.city} lot on the buyer's truck · invoice draft next`, tone: "ok" }); };
    const stops = D.KIRANAS.map(k => ({ ...k, ordered: h.orders.find(o => o.id === k.id) }));
    return <Screen me={me} title="Van route" sub={`${D.JOURNEY.van.depot} · Nagpur, Wardha and Kamptee`} back="Today">
      <Columns sideWidth={380}
        main={<>
          <Card pad={false} style={{ overflow: "hidden" }}><ClusterMap kiranas={D.KIRANAS} orderedCount={h.orders.length} route={h.orders.length > 0} vanProgress={p} height={app.bp === "phone" ? 260 : 380} /></Card>
          <Card className="stack snug">
            <div className="card-head"><span className="card-title">{D.JOURNEY.van.day} round</span><Badge tone={h.van.status === "done" ? "green" : undefined} icon={h.van.status === "done" ? "check" : "calendar"}>{h.van.status === "done" ? "delivered" : `${D.JOURNEY.van.date} · from ${D.JOURNEY.van.leaves}`}</Badge></div>
            <div className="row wrap" style={{ gap: 20 }}><div className="stack tight" style={{ gap: 0 }}><span className="num m"><Roll value={h.orders.length} /><span className="subtle" style={{ fontSize: "0.45em" }}> / {SHOPS}</span></span><span className="t-footnote subtle">shops on the round</span></div><div className="stack tight" style={{ gap: 0 }}><span className="num m"><Roll value={units} /></span><span className="t-footnote subtle">packets · {cartons(units)}</span></div></div>
            {h.van.status !== "done" && <Button variant="primary" size="lg" icon="navigation" loading={running} disabled={!full || running} onClick={start}>{full ? "Start the round" : `Waiting for orders · ${h.orders.length} of ${SHOPS}`}</Button>}
            <span className="t-caption subtle">₹{M.RULES.vanPerUnit.toFixed(2)} a packet for the van, repaid by Munchly in the price support.</span>
            <div className="feed" style={{ gap: 10 }}>
              <div className="row top" style={{ gap: 10 }}><Mark size={28} /><div className="t-subhead" style={{ padding: "9px 12px", borderRadius: 16, borderTopLeftRadius: 6, background: "var(--fill-2)" }}>{D.PUSH.van.body}<div className="t-caption muted">Outreach agent · Mon 18:00</div></div></div>
              <div className="row top" style={{ gap: 10, justifyContent: "flex-end" }}><div className="t-subhead" style={{ padding: "9px 12px", borderRadius: 16, borderTopRightRadius: 6, background: "var(--primary)", color: "var(--primary-fg)" }}>{D.JOURNEY.van.reply}<div className="t-caption" style={{ opacity: 0.9 }}>Rakesh bhai · {D.JOURNEY.van.replyAt}</div></div><Avatar person={D.PEOPLE.rakesh} size="sm" /></div>
            </div>
          </Card>
        </>}
        side={<>
          <div data-anchor="lot" />
          <Card className="stack snug">
            <div className="card-head"><span className="row tight"><span className="icontile violet"><Icon name="package" size={17} stroke={2} /></span><span className="card-title">{D.BUYER.city} lot</span></span><Badge tone={h.truck.status === "dispatched" ? "blue" : h.award ? "green" : "violet"}>{h.truck.status === "dispatched" ? "collected" : h.award ? "sold" : h.listing ? "listed" : "not listed"}</Badge></div>
            <HaulLine progress={h.truck.status === "dispatched" ? (h.phase === "cleared" || h.phase === "settled" ? 1 : 0.55) : 0} />
            <List>{[["Buyer", h.award ? `${D.BUYER.name}, ${D.BUYER.city}` : "—"], ["Units", `${ES.units} · ${cartons(ES.units)}`], ["Price", h.award ? `₹${D.COUNTER.price.toFixed(2)} a packet` : "₹15.00 asked"], ["Token", h.award ? fmt.inr(D.AWARD.token) + " received" : "—"], ["Freight", "the buyer's own truck"]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>
            {h.truck.status !== "dispatched" && <Button variant="primary" size="lg" icon="truck" disabled={!h.award || schemeOpen} onClick={dispatch}>{!h.award ? "Load after the award" : schemeOpen ? "Load once the scheme closes" : "Load the buyer's truck"}</Button>}
            <span className="t-caption subtle">Your staff load it as normal godown work, once the balance lands.</span>
          </Card>
          <div className="stack snug"><SectionTitle sub="In the order they were placed">Stops</SectionTitle>
            <div className="list">{stops.map((k, i) => <div key={k.id} className="list-row" style={{ gridTemplateColumns: "28px minmax(0,1fr) auto" }}><span className="center t-caption strong" style={{ width: 24, height: 24, borderRadius: 99, background: k.ordered ? "var(--primary)" : "var(--fill-2)", color: k.ordered ? "var(--primary-fg)" : "var(--fg-2)" }}>{i + 1}</span><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{k.name}</b><span className="t-caption subtle">{k.area}{k.ordered ? ` · ordered ${k.ordered.at}` : " · not yet"}</span></span><span className="tnum strong t-subhead">{k.ordered ? k.units : "—"}</span></div>)}</div>
          </div>
        </>} />
    </Screen>;
  }

  function DistOrders({ me }) {
    const s = useStore(); const h = s.hero; const hero = distOf(me).id === "rakesh";
    if (!hero) return <Screen me={me} title="Orders" sub="Scheme orders and marketplace sales"><Card style={{ maxWidth: 560 }}><Empty img="van" title="No orders yet" body="Kirana orders from offers and marketplace awards for your stock appear here." /></Card></Screen>;
    const rows = h.orders.slice().reverse().map(o => ({ ...o, k: shopById(o.id) }));
    return <Screen me={me} title="Orders" sub="Scheme orders and marketplace sales">
      <div className="stack" style={{ gap: 16 }}>
        {h.award && <Card className="row wrap" style={{ gap: 14 }}><span className="icontile violet"><Icon name="shopping-bag" size={17} stroke={2} /></span><div className="grow"><b>{D.BUYER.name}, {D.BUYER.city} · ExpireSoon</b><div className="t-footnote muted">{ES.units} × ₹{D.COUNTER.price.toFixed(2)} · token {fmt.inr(D.AWARD.token)} · balance {fmt.inr(D.AWARD.balance)}, plus {fmt.inr(D.INVOICE.igst)} IGST on your invoice</div></div><Money value={D.AWARD.gross} size="s" decimals /></Card>}
        {h.docs && <InvoiceDraft h={h} />}
        {rows.length ? <div className="list">{rows.map(o => <div key={o.id} className="list-row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{o.k.name}</b><span className="t-caption subtle">{o.k.area} · {o.at} · buy 10 get 2</span></span><span className="stack tight" style={{ gap: 0, justifyItems: "end" }}><span className="tnum strong">{o.units} packets</span><span className="t-caption subtle">{cartons(o.units)}</span></span></div>)}</div> : <Card><Empty img="van" title="No scheme orders yet" body="When a kirana taps the offer, the order lands here and joins your next van round." /></Card>}
      </div>
    </Screen>;
  }

  /* ======================= Rakesh bhai · his batches (SC-130, option A) ======================= */
  // every batch of Munchly's the Watcher flagged at his godown: in a journey now, everything he cleared by month under
  // the one figure (what Munchly credited him), and the stock it is watching; each opening its own page
  const stopOf = phase => ({ "at-risk": "Verify", verified: "Value", valued: "Decide", planned: "Approve", approved: "Execute", executing: "Execute", dispatched: "Settle", settled: "Settle", cleared: "Report" }[phase] || "Detect");
  function DistBatches({ me }) {
    const s = useStore(); const { route, go } = useRoute(); const phone = useApp().bp === "phone";
    const dist = distOf(me); const ref = route && route.params && route.params.ref;
    if (ref) return <DistBatch me={me} dist={dist} id={ref} />;
    const { journey, watching, past } = P().distBatches(dist.id, s);
    const credit = past.reduce((t, c) => t + c.support.total + ((c.expiry && c.expiry.credit) || 0), 0);
    const notes = past.reduce((t, c) => t + c.docs.filter(d => (d.id === "support" || d.id === "expiry") && d.status !== "not required").length, 0);
    const months = []; past.forEach(c => { const m = c.cleared.slice(0, 7); let g = months.find(x => x.m === m); if (!g) months.push(g = { m, label: monthOf(c.cleared), items: [] }); g.items.push(c); });
    return <Screen me={me} title="Batches" sub={`${dist.name} · every batch of ${D.WORKSPACE.short}'s the Watcher flagged at your godown`}>
      <div className="stack" style={{ gap: 20 }}>
        {journey.length ? <List head="In a journey now">{journey.map(b => { const sku = D.SKUS[b.sku]; const phase = b.hero ? s.hero.phase : s.mango.phase;
          return <ListRow key={b.id} chevron onClick={() => go("batches", { ref: b.id })} leading={<Product name={sku.img} size={40} />}
            title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{sku.name}</span><Badge size="sm" tone="blue" dot live>{stopOf(phase)}</Badge></span>}
            sub={`${b.id} · flagged ${day(D.DAY0)} · the agents act in your name`} value={phone ? null : `${fmt.num(b.hero ? D.PLAN.units : D.MANGO_PLAN.units)} packs`} />; })}</List> : null}
        {past.length ? <Card className="stack" style={{ gap: 10 }}>
          <div className="lg-fig"><Money value={credit} size="l" /><span className="lg-what">from {D.WORKSPACE.short} since July</span></div>
          <p className="lg-working">{past.length} batches cleared at your godown. On each, the price support (and on expiry day the expiry credit) made up the gap to the dealer price you paid, so you ended whole: <b>{notes} credit notes</b>, each in its batch's papers.</p>
        </Card> : null}
        {months.map(g => <List key={g.m} head={`Cleared · ${g.label}`}>{g.items.map(c => { const cr = c.support.total + ((c.expiry && c.expiry.credit) || 0); const p = P().distPapers(c);
          return <ListRow key={c.ref} chevron onClick={() => go("batches", { ref: c.ref })} leading={<Product name={c.sku.img} size={40} />}
            title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{c.sku.name}</span>{!phone && <S.OutcomeBadge o={c.outcome} size="sm" />}</span>}
            sub={`${c.ref} · flagged ${day(c.flagged)} · cleared ${day(c.cleared)}`}
            value={<span className="lg-val"><b className="tnum">{fmt.inr(cr)}</b><em>{p.mine.filter(d => d.status !== "not required").length + p.copies.length} papers</em></span>} />; })}</List>)}
        {watching.length ? <><SectionTitle sub="From your nightly DMS export: nothing at risk">Watching</SectionTitle><div className="list">{watching.map(b => <BatchRow key={b.id} view={D.batchView(b)} compact={phone} onOpen={() => {}} />)}</div></> : null}
      </div>
    </Screen>;
  }
  // a batch's own page: its head, then What happened, Money (how he ended whole) and Papers
  const DIST_TABS = [{ id: "what", label: "What happened", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }];
  function DistBatch({ me, dist, id }) {
    const s = useStore(); const reduce = useReducedMotion(); const [tab, setTab] = useState("what"); const [paper, setPaper] = useState(null);
    const L = window.SC3_LEDGER; const past = P().distBatches(dist.id, s).past.find(c => c.ref === id);
    const mine = D.BATCHES.find(b => b.id === id && b.distributor === dist.id); const hero = mine && mine.hero ? mine : null, second = mine && mine.second ? mine : null;
    const c = past || (hero ? L.storyCase() : null);
    if (!c && !second) return <Screen me={me} title="Batches" back="Batches"><Card><Empty icon="boxes" title="Not one of your batches" body="This batch is not at your godown." /></Card></Screen>;
    const sku = c ? c.sku : D.SKUS[second.sku];
    const head = <PtHead sku={sku} id={id} where={`${dist.godown}, ${dist.city}`} badge={past ? <S.OutcomeBadge o={c.outcome} size="sm" /> : <Badge size="sm" tone="blue" dot live>{stopOf(hero ? s.hero.phase : s.mango.phase)}</Badge>}
      line={past ? `Flagged ${day(c.flagged)} · cleared ${day(c.cleared)}` : `Flagged ${day(D.DAY0)} · the agents act in your name`}>
      <PtTabs tabs={DIST_TABS} value={tab} onChange={setTab} label={`${sku.name}, ${id}`} /></PtHead>;
    let body;
    if (second) body = <Locked icon="history" agent="Smart-Clearance" text={`The agents act in your name on ${sku.name}: its moments, its money and its papers show here once it settles.`} />;
    else if (tab === "what") body = <Card><PtMoments items={past ? P().moments(c) : P().storyMoments(s)} /></Card>;
    else if (tab === "money") body = <WholeCard c={c} story={!past} s={s} onPaper={setPaper} />;
    else body = <DistPapers c={c} ready={!!past || !!s.hero.docs} onOpen={setPaper} />;
    return <Screen me={me} title={sku.name} back="Batches" hideLarge below={head}>
      <motion.div key={tab} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="pt-body">{body}</motion.div>
      {c && <PaperSheet open={!!paper} onClose={() => setPaper(null)} c={c} id={paper} receipt={paper === "receipt" ? c.receipt : null} />}
    </Screen>;
  }
  // how he ended whole: what he received against what he paid
  function WholeCard({ c, story, s, onPaper }) {
    const w = story ? P().storyWhole(s) : P().whole(c); const open = story && s.hero.phase !== "cleared";
    return <Card className="stack snug">
      <div className="card-head"><span className="card-title">You end whole</span><Badge tone={open ? undefined : "green"} icon={open ? "clock" : "check"}>{open ? "on the plan" : "settled"}</Badge></div>
      <div className="stack tight">{w.rows.map(r => <PtLine key={r.k} k={r.k} sub={r.sub} v={fmt.inr(r.v)} onClick={r.paper && !story ? () => onPaper(r.paper) : null} />)}
        <div className="hairline" style={{ margin: "4px 0" }} />
        <PtLine k="What you receive" v={fmt.inr(w.recv)} strong />
        <PtLine k="What you paid" sub={`${fmt.num(w.units)} × ₹${w.dp}, the van and the listing fee`} v={fmt.inr(-w.paid)} />
        <PtLine k="Your gain or loss" v={fmt.inr(w.gain)} strong /></div>
      <span className="t-caption subtle">Instead of waiting weeks for an expiry claim, with no claim paperwork.</span>
    </Card>;
  }
  // his papers, then copies of what concerns his packs
  function DistPapers({ c, ready, onOpen }) {
    if (!ready) return <Locked icon="file-text" agent="Paperwork agent" text="Drafts your tax invoice to the buyer and Munchly's price-support credit note to you once every line of the plan is done." />;
    const p = P().distPapers(c);
    return <div className="stack" style={{ gap: 16 }}>
      <div><div className="pt-head">Your papers</div><div className="pt-papers">{p.mine.map(d => <PaperRow key={d.id} c={c} d={d} onOpen={onOpen} />)}</div></div>
      {p.copies.length ? <div><div className="pt-head">Copies for your records</div><div className="pt-papers">{p.copies.map(d => <PaperRow key={d.id} c={c} d={d} onOpen={onOpen} />)}</div></div> : null}
      <p className="t-footnote subtle" style={{ margin: 0 }}>Each opens on paper with its PDF. {D.WORKSPACE.short}'s own GST memo and FSSAI checklist stay with {D.WORKSPACE.short}.</p>
    </div>;
  }

  /* ======================= Ganesh ji · kirana ======================= */
  // the scheme: pay the pack price for 10 of every 12, sell all 12 at MRP
  const offerMath = n => { const free = Math.floor(n / 12) * 2, paid = n - free, pack = KL.packPrice; return { n, free, paid, pack, pay: paid * pack, sell: n * CHIPS.mrp, margin: n * CHIPS.mrp - paid * pack }; };
  function OfferCard({ onOpen, compact, shop }) {
    const [en, setEn] = useState(false); const p0 = D.PUSH.offer; const name = shop || "Shree Ganesh Kirana";
    const p = Object.assign({}, p0, { body: p0.body.replace("Shree Ganesh Kirana", name) });
    return <div className="bezel"><div className="card raised" style={{ padding: compact ? 16 : 22, display: "grid", gap: 14 }}>
      <div className="row between"><span className="row tight"><Mark size={28} /><span className="t-footnote subtle strong">Rakesh Traders · {p.at}</span></span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setEn(!en)} aria-pressed={en}>{en ? <span lang="hi">हिन्दी में पढ़ें</span> : "Read in English"}</button></div>
      <div className="row" style={{ gap: 14, alignItems: "center" }}><Product name="pack-chips" size={compact ? 76 : 96} float /><div className="stack tight" style={{ gap: 4 }}><div className={cx("t-title2", !en && "hi")} lang={en ? "en" : "hi"}>{en ? "Today's special offer" : p.title}</div><div className="row base" style={{ gap: 8 }}><span className="num m">₹{KL.packPrice.toFixed(2)}</span><span className="subtle t-subhead">a packet · MRP ₹{CHIPS.mrp}</span></div><span className="row tight wrap"><Badge tone="green" icon="gift">{en ? "Buy 10, get 2 free" : <span lang="hi">10 लो, 2 मुफ़्त</span>}</Badge><Badge icon="clock">{en ? "48 hours" : <span lang="hi">सिर्फ़ 48 घंटे</span>}</Badge></span></div></div>
      <p className={cx("t-body", !en && "hi")} lang={en ? "en" : "hi"} style={{ margin: 0, lineHeight: 1.55 }}>{en ? p.en : p.body}</p>
      {onOpen && <Button variant="primary" size="lg" block iconRight="arrow-right" onClick={onOpen}>{en ? "See the offer" : <span lang="hi">ऑफर देखें</span>}</Button>}
    </div></div>;
  }
  // the kirana's offers (SC-130, option A): the open one first, with Not this time, then every earlier offer, ordered,
  // declined or expired, each opening on what was offered and what came of it (ledger.js partners)
  const OFFER_STATUS = { open: { label: "Open", tone: "blue", icon: "clock" }, ordered: { label: "Ordered", tone: "green", icon: "check" }, declined: { label: "Declined", icon: "x" }, expired: { label: "Expired", icon: "clock" } };
  function OfferStatus({ o, size }) { const x = OFFER_STATUS[o.status]; return <Badge size={size} tone={x.tone} icon={x.icon}>{o.status === "ordered" ? `Ordered · ${o.units}` : x.label}</Badge>; }
  const whyText = o => (o.status === "declined" ? `You declined on ${when(o.declinedAt)}` : o.why === "filled" ? `The scheme filled on ${when(o.closed)} before you ordered` : o.status === "expired" ? `Its 48 hours ended on ${when(o.closed)}` : null);
  function RetailHome({ me }) {
    const s = useStore(); const { go } = useRoute(); const { toast } = useNotice(); const k = kOf(me); const shop = shopOf(me); const dist = D.DISTRIBUTORS[shop.distributor];
    const list = P().offersFor(shop, s); const now = list.find(o => o.story); const top = now && (now.status === "ordered" || now.open) ? now : null; const earlier = list.filter(o => o !== top);
    const no = () => { Flow.act("decline", shop.id); toast({ text: `Declined · ${dist.short}'s next scheme still comes to you` }); };
    const after = () => { Store.update(st => { if (st.hero.declined) delete st.hero.declined[shop.id]; }); go("offer"); };
    return <Screen me={me} title="Offers" sub={`${k.name} · ${k.area}, ${dist.city}`}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {top && top.status === "open" ? <><OfferCard shop={k.name} onOpen={() => go("offer")} /><Button variant="ghost" size="lg" block onClick={no}>Not this time</Button></>
          : top && top.status === "ordered" ? <Card className="stack snug"><div className="row" style={{ gap: 14 }}><Product name={top.sku.img} size={64} /><div className="grow"><b>Ordered · {top.units} packets</b><div className="t-footnote muted">{top.sku.name} · placed {top.orderedAt.slice(11)} · comes on {D.JOURNEY.van.day}'s van</div></div><Badge tone="green" icon="check">confirmed</Badge></div></Card>
          : top && top.status === "declined" ? <Card className="stack snug"><div className="row" style={{ gap: 14 }}><Product name={top.sku.img} size={64} /><div className="grow"><b>You said not this time</b><div className="t-footnote muted">{top.sku.name} · declined {when(top.declinedAt)}. The offer stays open until {when(top.closed)} if you change your mind.</div></div></div><Button variant="secondary" block onClick={after}>Order after all</Button></Card>
          : <Card><Empty img="kirana" title="No open offer" body={`${dist.short}'s schemes arrive here as a notification, in Hindi, ready to order in one tap.`} /></Card>}
        {earlier.length ? <List head="Earlier offers">{earlier.map(o => <ListRow key={o.ref} chevron onClick={() => go("offer", { ref: o.ref })} leading={<Product name={o.sku.img} size={40} />}
          title={o.sku.name} sub={`${day(o.sent)} · ${o.dist.short} · ₹${o.pack.toFixed(2)} a packet`} value={<OfferStatus o={o} size="sm" />} />)}</List> : null}
        <SectionTitle>Your shop</SectionTitle>
        <List>{[["Distributor", `${dist.name}, ${dist.city}`], ["Van day", D.JOURNEY.van.day], ["Unsold scheme packs", `back to the salesman until ${fmt.day(D.RETURN_BY)}`], ["Language", "हिन्दी · English"]].map(([a, v]) => <ListRow key={a} title={a} value={a === "Language" ? <span lang="hi">{v}</span> : v} />)}</List>
      </div>
    </Screen>;
  }
  // an offer's own page: what came of it, and what was offered
  function OfferPage({ me, o }) {
    const head = <PtHead sku={o.sku} id={o.ref} where={`From ${o.dist.short}`} badge={<OfferStatus o={o} size="sm" />} line={`Sent ${when(o.sent)}`} />;
    return <Screen me={me} title={o.sku.name} back="Offers" below={head} hideLarge>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {o.status === "ordered" ? <Card className="stack snug">
          <div className="card-head"><span className="card-title">Your order</span><Badge tone="green" icon="check">{o.van ? `delivered ${weekday(o.van)}` : "on the round"}</Badge></div>
          <div className="stack tight">
            <PtLine k={`You ordered ${o.units} packets`} sub={when(o.orderedAt)} v="" />
            <PtLine k="You paid" sub={`${o.m.paid} × ₹${o.pack.toFixed(2)}`} v={fmt.inr(o.m.pay)} />
            <PtLine k="Free packets" sub="2 with every 10" v={o.m.free} />
            <PtLine k="You sell at MRP" sub={`${o.units} × ₹${o.mrp}`} v={fmt.inr(o.m.sell)} />
            <div className="hairline" style={{ margin: "4px 0" }} />
            <PtLine k="Your margin" v={fmt.inr(o.m.margin)} strong />
          </div>
          {o.van && <span className="t-footnote subtle">Delivered on {weekday(o.van)}'s van, {day(o.van)} · paid on delivery to {o.dist.short}</span>}
        </Card> : <Card className="row top" style={{ gap: 14 }}><span className="icontile soft"><Icon name={o.status === "declined" ? "x" : "clock"} size={18} /></span>
          <div className="grow"><b>{o.status === "declined" ? "You said not this time" : "This offer expired"}</b><div className="t-footnote muted">{whyText(o)}. Nothing was ordered and nothing is owed.</div></div></Card>}
        <List head="What was offered">
          <ListRow title="Price" value={`₹${o.pack.toFixed(2)} a packet · MRP ₹${o.mrp}`} />
          <ListRow title="Scheme" value="Buy 10, get 2 free" />
          <ListRow title="Your share" value={`up to ${o.share} packets`} />
          <ListRow title="Open for" value="48 hours" />
          <ListRow title="Best before" value={fmt.date(o.bestBefore)} />
        </List>
      </div>
    </Screen>;
  }
  // the offer route: an earlier offer by its ref opens its page; otherwise the open offer, to order from
  function OfferDetail({ me }) {
    const s = useStore(); const { route } = useRoute(); const ref = route && route.params && route.params.ref;
    const o = ref && P().offersFor(shopOf(me), s).find(x => x.ref === ref);
    return o && o.status !== "open" ? <OfferPage me={me} o={o} /> : <OfferOrder me={me} />;
  }
  function OfferOrder({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const k = kOf(me); const [n, setN] = useState(k.units); const [busy, setBusy] = useState(false); const m = offerMath(n);
    const mine = h.orders.find(o => o.id === k.id);
    const order = () => { setBusy(true); setTimeout(() => { setBusy(false); Store.update(st => { Flow.A.order(st, k.id); const o = st.hero.orders.find(x => x.id === k.id); if (o) o.units = n; }); }, 650); };
    return <Screen me={me} title="Masala Chips 150 g" sub="Rakesh Traders · scheme for 48 hours" back="Offers">
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {h.offer ? <OfferCard compact shop={k.name} /> : <Card><Empty img="kirana" title="No offer right now" body="This offer has not been sent to your shop yet." /></Card>}
        {!h.offer ? null : mine ? <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card stack" style={{ padding: 22, justifyItems: "center", textAlign: "center" }}>
          <span className="icontile" style={{ width: 56, height: 56, borderRadius: 18 }}><Icon name="check" size={28} stroke={2.4} /></span>
          <div className="t-title2 hi" lang="hi">ऑर्डर हो गया</div>
          <span className="muted">{mine.units} packets on {D.JOURNEY.van.day}'s van · pay on delivery</span>
          <Money value={offerMath(mine.units).margin} size="m" style={{ color: "var(--primary-text)" }} /><span className="t-footnote subtle">your margin at MRP on this order</span>
          <Button variant="secondary" onClick={() => go("home")}>Done</Button>
        </motion.div> : <Card className="stack" style={{ gap: 16 }}>
          <div className="row between"><div className="stack tight" style={{ gap: 0 }}><b>How many packets?</b><span className="t-footnote subtle">In twelves · your share is up to {k.units}</span></div><Stepper value={n} onChange={setN} min={12} max={k.units} step={12} label="Packets" /></div>
          <div className="stack tight">{[["You pay", `${m.paid} × ₹${m.pack.toFixed(2)}`, fmt.inr(m.pay)], ["Free packets", "2 with every 10", `${m.free}`], ["You sell at MRP", `${n} × ₹${CHIPS.mrp}`, fmt.inr(m.sell)]].map(([k, sub, v]) => <div key={k} className="row between t-subhead"><span>{k} <span className="subtle t-footnote">{sub}</span></span><span className="tnum strong">{v}</span></div>)}</div>
          <div className="row between" style={{ padding: "12px 14px", borderRadius: 14, background: "var(--primary-soft)" }}><span className="stack tight" style={{ gap: 0 }}><b>Margin today</b><span className="t-footnote muted">₹{(m.pay / n).toFixed(2)} a packet in effect, sold at ₹{CHIPS.mrp}</span></span><Money value={m.margin} size="s" roll style={{ color: "var(--primary-text)" }} /></div>
          <Button variant="primary" size="xl" block loading={busy} onClick={order}><span className="hi" lang="hi">ऑर्डर करें</span> · {n} packets</Button>
          <span className="t-caption subtle" style={{ textAlign: "center" }}>Best before 18 Nov 2026 · 47 days on every packet · unsold packs go back to the salesman until {fmt.day(D.RETURN_BY)}</span>
        </Card>}
      </div>
    </Screen>;
  }
  // the kirana's orders (SC-130): what each order earned, every one opening its offer's page
  function RetailOrders({ me }) {
    const s = useStore(); const { go } = useRoute(); const k = kOf(me); const list = P().offersFor(shopOf(me), s).filter(o => o.status === "ordered");
    const margin = list.reduce((t, o) => t + o.m.margin, 0), packets = list.reduce((t, o) => t + o.units, 0);
    return <Screen me={me} title="Orders" sub={k.name}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {list.length ? <><Card className="stack" style={{ gap: 8 }}><div className="lg-fig"><Money value={margin} size="l" /><span className="lg-what">your margin at MRP</span></div><p className="lg-working">{list.length} {list.length === 1 ? "order" : "orders"} since July, {fmt.num(packets)} packets, each delivered on the van with 2 free in every 12.</p></Card>
          <List>{list.map(o => <ListRow key={o.ref} chevron onClick={() => go("offer", { ref: o.ref })} leading={<Product name={o.sku.img} size={40} />} title={`${o.sku.name} · ${o.units} packets`} sub={`ordered ${when(o.orderedAt)}${o.van ? ` · ${weekday(o.van)}'s van` : " · on the round"}`} value={<span className="lg-val"><b className="tnum">{fmt.inr(o.m.margin)}</b><em>margin</em></span>} />)}</List></>
          : <Card><Empty icon="shopping-basket" title="No orders yet" body="Orders you place from an offer show here with the van day." /></Card>}
      </div>
    </Screen>;
  }

  /* ======================= Agrawal ji · ExpireSoon (another company's marketplace) ======================= */
  const OTHER_LISTINGS = D.MARKET.lots;
  function EsBar({ me, title }) {
    return <div className="es-top"><span className="row tight"><span className="es-logo" aria-hidden="true"><Icon name="hourglass" size={16} stroke={2.2} /></span><span className="es-word">ExpireSoon</span></span><span className="t-caption subtle es-tag">Near-expiry B2B marketplace · dates visible</span><span className="grow" />{title}</div>;
  }
  function EsDate({ days, date }) { return <span className="es-date">{date ? date + " · " : ""}{days} days</span>; }
  function ListingCard({ l, onOpen, hero }) {
    return <button type="button" className="es-card" onClick={onOpen}>
      <div className="es-thumb">{hero ? <Product name="pack-chips" size={92} /> : <Icon name={l.icon} size={38} stroke={1.5} />}</div>
      <div className="stack tight" style={{ gap: 4, padding: "12px 14px 14px" }}>
        <b className="t-subhead" style={{ lineHeight: 1.25 }}>{l.name}</b>
        <span className="row base" style={{ gap: 6 }}><span className="es-price">₹{l.price}</span><span className="t-caption subtle">MRP ₹{l.mrp} · {Math.round((1 - l.price / l.mrp) * 100)}% off</span></span>
        <span className="row tight wrap"><EsDate days={l.days} />{hero && <Badge size="sm" tone="violet" icon="badge-check">label verified</Badge>}</span>
        <span className="t-caption subtle">{fmt.num(l.units)} units · {l.seller}</span>
      </div>
    </button>;
  }
  function Market({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const app = useApp(); const [q, setQ] = useState(""); const [cat, setCat] = useState("all");
    const hero = h.listing && { id: D.JOURNEY.listing.id, name: "Munchly Masala Chips 150 g", units: ES.units, price: 15, mrp: 30, days: 47, seller: "Rakesh Traders, Nagpur" };
    const list = [hero, ...OTHER_LISTINGS].filter(Boolean).filter(l => (!q || l.name.toLowerCase().includes(q.toLowerCase())) && (cat === "all" || (cat === "snacks" ? /chips|biscuit|noodle/i.test(l.name) : cat === "staples" ? /atta|milk/i.test(l.name) : true)));
    return <div className="esw"><Screen me={me} title="Marketplace" sub={`Lots for ${D.BUYER.city} · every listing shows its dates`} hideLarge={false}>
      <div className="stack" style={{ gap: 16 }}>
        <EsBar />
        <div className="row wrap" style={{ gap: 10 }}><div className="grow" style={{ minWidth: 200 }}><K.SearchField value={q} onChange={setQ} placeholder="Search lots" /></div><K.Segmented options={[{ id: "all", label: "All" }, { id: "snacks", label: "Snacks" }, { id: "staples", label: "Staples" }]} value={cat} onChange={setCat} label="Category" /></div>
        {hero && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="es-feature" onClick={() => go("listing")}>
          <Product name="pack-chips" size={app.bp === "phone" ? 96 : 132} float />
          <div className="stack tight grow" style={{ gap: 6 }}><span className="row tight wrap"><Badge tone="violet" solid size="sm">new · {h.listing.at}</Badge><Badge size="sm" tone="violet" icon="badge-check">label photo verified</Badge></span><div className="t-title2">Munchly Masala Chips 150 g · {ES.units} units</div><span className="row base wrap" style={{ gap: 8 }}><span className="es-price lg">₹15</span><span className="muted">MRP ₹30 · 50% off</span><EsDate days={47} date="Best before 18 Nov 2026" /></span><span className="t-footnote subtle">Rakesh Traders, Nagpur · verified seller · dispatch {D.MARKET.dispatchHours} h after balance</span></div>
          <Button variant="violet" iconRight="arrow-right">View lot</Button>
        </motion.div>}
        <div className="es-grid">{list.filter(l => l !== hero).map(l => <ListingCard key={l.id} l={l} onOpen={() => {}} />)}</div>
        <p className="t-caption subtle" style={{ margin: 0 }}>ExpireSoon is mocked in this prototype; the other lots are illustrative.</p>
      </div>
    </Screen></div>;
  }
  function ListingView({ readOnly, me }) {
    const s = useStore(); const h = s.hero; const app = useApp(); const [price, setPrice] = useState(13); const [msg, setMsg] = useState("");
    const last = h.bids[h.bids.length - 1]; const open = !last || last.status === "declined";
    const token = Math.round(price * ES.units * M.RULES.tokenPct * 100) / 100; const inv = D.INVOICE;
    const place = () => Flow.act("bid", price);
    const accept = () => Flow.act("accept");
    if (!h.listing) return <Card><Empty icon="hourglass" title="Not listed yet" body="The Lister posts this lot the moment the plan is approved." /></Card>;
    return <div style={{ display: "grid", gap: 16, gridTemplateColumns: app.bp === "desktop" && !readOnly ? "minmax(0, 1.2fr) minmax(0, 1fr)" : "minmax(0,1fr)", alignItems: "start" }}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="es-gallery"><div className="es-thumb big"><Product name="pack-chips" size={app.bp === "phone" ? 150 : 190} float /></div><div className="es-thumb big" style={{ padding: 0, overflow: "hidden", containerType: "inline-size" }}><S.LabelPhoto status="verified" /></div></div>
        <div className="stack tight"><div className="t-title2">Munchly Masala Chips 150 g · {ES.units} units</div><span className="row base wrap" style={{ gap: 8 }}><span className="es-price lg">₹15</span><span className="muted">a packet · MRP ₹30 · 50% off</span></span><span className="row tight wrap"><EsDate days={47} date="Best before 18 Nov 2026" /><Badge size="sm" tone="violet" icon="badge-check">label photo verified</Badge></span></div>
        <List>{[["Seller", "Rakesh Traders, Nagpur · verified"], ["Visible to", "buyers outside Munchly's distributor territories"], ["Dispatch", `${D.MARKET.dispatchHours} h after the balance · buyer pays freight`], ["Lot", `${cartons(ES.units)} · 24 × 150 g a carton`], ["Minimum order", `${D.MARKET.minOrder} units`], ["Listing", h.listing.id]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>
      </div>
      <div className="stack" style={{ gap: 16 }}>
        {!readOnly && (h.award ? <Card className="stack snug"><div className="row" style={{ gap: 12 }}><span className="icontile violet" style={{ width: 44, height: 44, borderRadius: 14 }}><Icon name="badge-check" size={22} /></span><div className="grow"><b>Lot won at ₹{D.COUNTER.price.toFixed(2)}</b><div className="t-footnote muted">Token {fmt.inr(D.AWARD.token)} paid · {fmt.inr(D.AWARD.balance)} of the bid and {fmt.inr(inv.igst)} IGST due in {D.MARKET.balanceHours} h</div></div></div><List>{[[`${ES.units} × ₹${D.COUNTER.price.toFixed(2)}`, fmt.inr2(inv.taxable)], [`IGST ${inv.gstPct}%, Maharashtra to Chhattisgarh`, fmt.inr2(inv.igst)], ["Round off", fmt.inr2(inv.roundOff)], ["Invoice total", fmt.inr2(inv.total)]].map(([k, v]) => <ListRow key={k} title={k} value={<span className="tnum strong">{v}</span>} />)}</List><span className="t-caption subtle">Rakesh Traders issues the invoice from its own Tally.</span></Card>
          : open ? <Card className="stack snug">
            <div className="card-head"><span className="card-title">Place a bid</span><span className="t-caption subtle">ask ₹15.00</span></div>
            <div className="row between"><span className="stack tight" style={{ gap: 0 }}><b>Your price a packet</b><span className="t-footnote subtle">for all {ES.units} units</span></span><Stepper value={price} onChange={setPrice} min={10} max={14} step={0.5} label="Bid price" format={v => "₹" + v.toFixed(2)} /></div>
            <div className="row between t-subhead"><span>15% token on your bid</span><span className="tnum strong">{fmt.inr2(token)}</span></div>
            <Button variant="violet" size="lg" block icon="gavel" onClick={place}>Bid ₹{price.toFixed(2)} for {ES.units}</Button>
            <span className="t-caption subtle">Balance in {D.MARKET.balanceHours} h. The seller's agent replies in about a minute.</span>
          </Card> : <Card className="stack snug"><div className="card-head"><span className="card-title">Your bid</span><Badge tone={last.status === "countered" ? "violet" : undefined} dot live={last.status === "placed"}>{last.status === "placed" ? "waiting for the seller" : last.status}</Badge></div>
            <div className="row base" style={{ gap: 8 }}><span className="es-price lg">₹{last.price.toFixed(2)}</span><span className="muted">→ counter ₹{(last.counter || D.COUNTER.price).toFixed(2)}</span></div>
            {last.status === "countered" && <Button variant="violet" size="lg" block icon="check" onClick={accept}>Accept ₹{D.COUNTER.price.toFixed(2)} · pay {fmt.inr(D.AWARD.token)} token</Button>}
          </Card>)}
        <Card className="stack snug"><div className="card-head"><span className="card-title">Chat with the seller</span><span className="t-caption subtle">answered by an agent</span></div>
          {h.chat.length ? <S.Chat chat={h.chat} typing={last && last.status === "placed"} /> : <span className="t-footnote muted">Ask about dates, dispatch or a lower price.</span>}
          {!readOnly && !h.award && <form className="row" style={{ gap: 8 }} onSubmit={e => { e.preventDefault(); setMsg(""); }}><input className="input grow" placeholder="Message Rakesh Traders" value={msg} onChange={e => setMsg(e.target.value)} aria-label="Message the seller" /><IconButton icon="send" label="Send" type="submit" /></form>}
        </Card>
      </div>
    </div>;
  }
  function Listing({ me }) { return <div className="esw"><Screen me={me} title={`Lot ${D.JOURNEY.listing.id}`} sub="Munchly Masala Chips 150 g · Rakesh Traders, Nagpur" back="Marketplace"><div className="stack" style={{ gap: 16 }}><EsBar /><ListingView me={me} /></div></Screen></div>; }
  function MyBids({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute();
    return <div className="esw"><Screen me={me} title="My bids" sub={`${D.BUYER.name} · ${D.BUYER.city}`}><div className="stack" style={{ gap: 16 }}><EsBar />
      {h.bids.length ? <div className="list" data-x="bids">{h.bids.map(b => <button type="button" key={b.id} className="list-row" onClick={() => go("listing")} style={{ gridTemplateColumns: "48px minmax(0,1fr) auto", textAlign: "left", width: "100%" }}><Product name="pack-chips" size={44} /><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{D.JOURNEY.listing.id} · Masala Chips 150 g · {ES.units} units</b><span className="t-caption subtle">bid ₹{b.price.toFixed(2)} · {b.at}{b.counter ? ` · counter ₹${b.counter.toFixed(2)}` : ""}</span></span><Badge size="sm" tone={b.status === "accepted" ? "green" : "violet"}>{b.status === "accepted" ? "won" : b.status}</Badge></button>)}</div> : <Card><Empty img="marketplace-bag" title="No bids yet" body="Bids you place show here with the seller's reply." /></Card>}
    </div></Screen></div>;
  }

  /* ======================= Meera · Feeding India ======================= */
  // the food bank's pickups (SC-130, option A): the request in front of it, then every pickup it has collected for
  // Munchly, each opening on its tracker, its receipt and its FSSAI checklist
  function Pickups({ me }) {
    const s = useStore(); const { route, go } = useRoute(); const ref = route && route.params && route.params.ref;
    const past = P().pickupsFor(me.org, s).filter(p => !p.story);
    const hit = ref && past.find(p => p.ref === ref);
    if (hit) return <PickupPage me={me} p={hit} />;
    return <PickupsNow me={me} past={past} onOpen={p => go("pickups", { ref: p.ref })} />;
  }
  function PickupsNow({ me, past, onOpen }) {
    const s = useStore(); const DN = D.JOURNEY.donation; const d = me.org === DN.partner ? s.mango.donation : null; const app = useApp(); const [later, setLater] = useState(false); const [paper, setPaper] = useState(false); const { toast } = useNotice(); const n = D.MANGO_FB;
    const bb = fmt.date(D.BATCHES[1].bestBefore);
    // the receipt Feeding India issued as the packs were collected (SC-110): opened from the pickup, in a sheet
    const R = D.MANGO_RECEIPT, mb = D.BATCHES[1];
    const org = (D.SETUP.partners.find(x => x.name === me.org) || {});
    const history = <PickupHistory past={past} onOpen={onOpen} />;
    return <Screen me={me} title="Pickups" sub={me.org === DN.partner ? "Feeding India · Hyderabad" : `${me.org} · surplus food from ${D.WORKSPACE.short}`}>
      {!d ? <div className="stack" style={{ gap: 20, maxWidth: 760 }}><Card><Empty img="donation-crate" title="No pickup requests" body={`Brands' donation agents send surplus food here when it fits your intake rules: ${org.minDays || 15}+ days left, ${org.minUnits || 50}+ units.`} /></Card>{history}</div> :
      <Columns sideWidth={340}
        main={<>
          <div className="bezel"><div className="card raised stack" style={{ padding: 22, gap: 16 }}>
            <div className="row tight"><Mark size={28} /><span className="t-footnote subtle strong">Donation agent · Munchly Foods · {DN.asked}</span></div>
            <div className="row" style={{ gap: 16 }}><Product name="pack-mango" size={app.bp === "phone" ? 80 : 104} float /><div className="stack tight" style={{ gap: 4 }}><div className="t-title2">{n} packs of Mango Drink</div><span className="row tight wrap"><Badge icon="calendar">22 days left</Badge><Badge icon="map-pin">{DN.from}</Badge><Badge tone="green" icon="clipboard-check">FSSAI checklist</Badge></span></div></div>
            <p className="t-body" style={{ margin: 0 }}>{n} packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup {DN.day} {DN.hour} from {DN.from}?</p>
            {d === "booked" ? <div className="row wrap" style={{ gap: 10 }}><Button variant="primary" size="lg" icon="check" onClick={() => Flow.act("confirmPickup")}>Confirm {DN.day} {DN.time}</Button><Button variant="secondary" size="lg" onClick={() => setLater(true)}>Suggest another time</Button></div>
              : <div className="row top" style={{ gap: 10, justifyContent: "flex-end" }}><div className="t-subhead" style={{ padding: "9px 12px", borderRadius: 16, borderTopRightRadius: 6, background: "var(--primary)", color: "var(--primary-fg)", maxWidth: "85%" }}>{DN.reply}<div className="t-caption" style={{ opacity: 0.9 }}>Meera · {DN.confirmed}</div></div><Avatar person={D.PEOPLE.meera} size="sm" /></div>}
          </div></div>
          {d !== "booked" && <Card className="stack snug"><div className="card-head"><span className="card-title">Pickup</span><Badge tone="green" icon={d === "collected" ? "check" : "calendar"}>{d === "collected" ? "collected" : `${DN.date} · ${DN.time}`}</Badge></div>
            <K.VTracker items={[{ id: "req", title: "Requested by the donation agent", time: DN.asked }, { id: "conf", title: "Confirmed by Meera", time: DN.confirmed }, { id: "col", title: `Collected from ${DN.from}`, time: d === "collected" ? DN.collected : `${DN.date.split(" ")[0]} ${DN.time}` }, { id: "serve", title: `Served at ${DN.spot}`, time: "this week" }]} done={d === "collected" ? 3 : 2} current={d === "collected" ? 3 : 2} />
            {d === "confirmed" && <Button variant="primary" size="lg" icon="package-check" onClick={() => { Flow.act("collect"); toast({ text: `${R.type} ${R.no} issued`, tone: "ok" }); }}>Mark collected</Button>}
            {d === "collected" && <button type="button" className="receipt-row" onClick={() => setPaper(true)}><Icon name="receipt" size={20} /><span className="grow"><b>{R.type} {R.no}</b><span className="t-footnote">{fmt.num(R.units)} packs · {fmt.num(R.meals)} meals · shared with Munchly for its BRSR table</span></span><span className="receipt-view">View<Icon name="chevron-right" size={16} /></span></button>}
          </Card>}
          {history}
        </>}
        side={<><SectionTitle>FSSAI surplus-food checklist</SectionTitle><Card className="paper stack tight" style={{ padding: 18 }}>{["Sealed, undamaged packs", `Best before ${bb}, 22 days left`, "Ambient storage, away from sunlight", "Batch MF-2410-118 on every carton", "Donor: Munchly Foods via Lakshmi Agencies"].map(t => <div key={t} className="row top" style={{ gap: 8 }}><Icon name="square-check" size={17} style={{ color: "#167a52", marginTop: 1 }} /><span className="t-subhead">{t}</span></div>)}</Card>
          <List head="Your intake rules"><ListRow title="Days left" value="15 or more" /><ListRow title="Minimum lot" value="50 units" /><ListRow title="Logistics" value={D.SETUP.partners[0].pickup} /></List></>} />}
      <Sheet open={paper} onClose={() => setPaper(false)} title={R.type} footer={R.pdf ? <Button variant="secondary" block icon="download">Download the PDF</Button> : null}><div className="stack snug"><S.Receipt doc={R} batch={mb} sku={D.SKUS[mb.sku]} dist={D.DISTRIBUTORS[mb.distributor]} /><span className="t-footnote muted">The same paper is in Munchly's document pack for {mb.id}.</span></div></Sheet>
      <Sheet open={later} onClose={() => setLater(false)} title="Suggest another time" detent="medium" footer={<Button variant="primary" block onClick={() => { setLater(false); toast({ text: "Sent · the agent will confirm with Lakshmi Agencies" }); }}>Send</Button>}><div className="stack snug">{DN.slots.map(t => <label key={t} className="list-row" style={{ gridTemplateColumns: "auto 1fr", cursor: "pointer" }}><input type="radio" name="slot" defaultChecked={t === DN.slots[0]} /> {t}</label>)}</div></Sheet>
    </Screen>;
  }

  // what a food bank has collected for Munchly: the meals they made, then each pickup by when it was collected
  function PickupHistory({ past, onOpen }) {
    if (!past.length) return null;
    const meals = past.reduce((t, p) => t + p.meals, 0), packs = past.reduce((t, p) => t + p.units, 0), kg = Math.round(past.reduce((t, p) => t + p.kg, 0) * 100) / 100;
    return <>
      <Card className="stack" style={{ gap: 8 }}><div className="lg-fig"><span className="num l">{fmt.num(meals)}</span><span className="lg-what">meals from {D.WORKSPACE.short}'s surplus since July</span></div>
        <p className="lg-working">{past.length} {past.length === 1 ? "pickup" : "pickups"}, {fmt.num(packs)} packs, {fmt.kg(kg)} kept out of landfill, each with its receipt and the FSSAI checklist.</p></Card>
      <List head="Collected">{past.map(p => <ListRow key={p.ref} chevron onClick={() => onOpen(p)} leading={<Product name={p.sku.img} size={44} />}
        title={`${fmt.num(p.units)} packs of ${p.sku.name.replace(/ \d.*$/, "")}`} sub={`Collected ${when(p.collected)} · ${p.from}`}
        value={<span className="lg-val"><b className="mono">{p.receipt.no}</b><em>{fmt.num(p.meals)} meals</em></span>} />)}</List>
    </>;
  }
  // a collected pickup's own page: its tracker, its receipt and the FSSAI checklist that came with it
  function PickupPage({ me, p }) {
    const [open, setOpen] = useState(false);
    const head = <PtHead sku={p.sku} id={p.ref} where={p.from} badge={<Badge size="sm" tone="green" icon="check">collected</Badge>} line={`Donor: ${D.CLIENT.name} via ${p.dist.name}`} />;
    return <Screen me={me} title={p.sku.name} back="Pickups" hideLarge below={head}>
      <Columns sideWidth={340}
        main={<Card className="stack snug"><div className="card-head"><span className="card-title">Pickup</span><Badge tone="green" icon="check">{fmt.num(p.units)} packs</Badge></div>
          <K.VTracker items={[{ id: "req", title: "Requested by the donation agent", time: when(p.asked) }, { id: "conf", title: "Confirmed by you", time: when(p.confirmed) }, { id: "col", title: `Collected from ${p.from}`, time: when(p.collected) }, { id: "serve", title: `Served at ${p.spot}`, time: "that week" }]} done={4} />
          <button type="button" className="receipt-row" onClick={() => setOpen(true)}><Icon name="receipt" size={20} /><span className="grow"><b>{p.receipt.type} {p.receipt.no}</b><span className="t-footnote">{fmt.num(p.units)} packs · {fmt.num(p.meals)} meals · shared with {D.WORKSPACE.short} for its BRSR table</span></span><span className="receipt-view">View<Icon name="chevron-right" size={16} /></span></button>
        </Card>}
        side={<><SectionTitle>FSSAI surplus-food checklist</SectionTitle><Card className="paper stack tight" style={{ padding: 18 }}>{P().fssaiItems(p).map(t => <div key={t} className="row top" style={{ gap: 8 }}><Icon name="square-check" size={17} style={{ color: "#167a52", marginTop: 1 }} /><span className="t-subhead">{t}</span></div>)}</Card></>} />
      <PaperSheet open={open} onClose={() => setOpen(false)} c={p.c} receipt={p.receipt} />
    </Screen>;
  }

  Object.assign(window.SC3_SCREENS, { distOf, kOf, shopOf, DistBatches, DistBatch, PaperSheet, PaperRow, PtHead, PtTabs, PtMoments, OfferStatus, OfferPage, OfferOrder, DistHome, CameraScreen, VanRoute, DistOrders, OfferCard, RetailHome, OfferDetail, RetailOrders, Market, Listing, ListingView, MyBids, Pickups, EsBar, offerMath, cartons, PermissionCard });
})();

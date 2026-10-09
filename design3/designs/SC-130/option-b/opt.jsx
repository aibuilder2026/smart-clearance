// SC-130 option B · One timeline. Each partner gets one History: everything that happened to it, newest first, by
// month, down one rail. Each batch, offer or pickup is a card on the rail with its outcome, one line of what came of
// it and its papers as chips; "What happened" opens it in place. A filter narrows the rail by outcome.
//   the distributor: Today, History, Van route, Orders (Label photo off the phone's tabs);
//   the kirana: Offers (the open one, with Not this time) and History, its orders inside it;
//   the food bank: Pickups and History, each pickup with its receipt and FSSAI checklist.
(function () {
  const { useState } = React;
  const { motion, AnimatePresence } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER, Z = window.SC130;
  const { cx, Icon, Badge, Button, Card, Product, Segmented, Sheet, Empty, useApp, useNotice } = K;
  const { useStore, useRoute, Screen } = S;
  const fmt = M.fmt;

  S.NAV.distributor.splice(0, S.NAV.distributor.length,
    { id: "home", label: "Today", icon: "house" }, { id: "report", label: "History", icon: "history" },
    { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true }, { id: "van", label: "Van route", short: "Van", icon: "truck" }, { id: "orders", label: "Orders", icon: "clipboard-list" });
  S.NAV.retailer.splice(0, S.NAV.retailer.length, { id: "home", label: "Offers", icon: "tag" }, { id: "report", label: "History", icon: "history" });
  S.NAV.foodbank.splice(0, S.NAV.foodbank.length, { id: "pickups", label: "Pickups", icon: "heart-handshake" }, { id: "report", label: "History", icon: "history" });

  /* ---------- the rail ---------- */
  // items: { key, at (iso), dot ("now" | "muted" | undefined), card }
  function Rail({ items }) {
    const months = []; items.forEach(i => { const m = i.now ? "now" : i.at.slice(0, 7); let g = months.find(x => x.m === m); if (!g) months.push(g = { m, label: i.now ? "Now" : Z.month(i.at), items: [] }); g.items.push(i); });
    return <div className="sc130-tl">{months.map(g => <section key={g.m} aria-label={g.label}><div className="sc130-tl-month">{g.label}</div>
      {g.items.map(i => <div key={i.key} className="sc130-tl-item">
        <div className="sc130-tl-rail"><span className={cx("sc130-tl-dot", i.dot)} aria-hidden="true" /></div>
        <div>{!i.now && <div className="sc130-tl-when"><b>{Z.day(i.at)}</b>{i.at.length > 10 && <> · <span className="mono">{i.at.slice(11, 16)}</span></>}{i.what && <> · {i.what}</>}</div>}{i.card}</div>
      </div>)}</section>)}</div>;
  }
  function More({ open, onToggle, label = "What happened" }) {
    return <button type="button" className="sc130-more" aria-expanded={open} onClick={onToggle}>{open ? "Hide" : label}<Icon name={open ? "chevron-up" : "chevron-down"} size={16} /></button>;
  }
  const Reveal = ({ open, children }) => <AnimatePresence initial={false}>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>}</AnimatePresence>;
  function Chip({ icon, label, no, onClick }) { return <button type="button" className="sc130-chip" onClick={onClick}><Icon name={icon} size={15} />{label}{no && <span className="mono">{no}</span>}</button>; }
  const SHORT = { invoice: "Tax invoice", eway: "E-way bill", support: "Credit note", expiry: "Expiry credit note", receipt: "Receipt", destruction: "Destruction certificate" };
  function Moments({ items }) {
    return <div className="sc130-moments" role="list" style={{ marginTop: 14 }}>{items.map((m, i) => <div key={m.k + i} role="listitem" className={cx("sc130-moment", m.ahead && "ahead")}>
      <span className="icontile"><Icon name={m.icon} size={16} stroke={2} /></span><div><b style={{ fontSize: 14 }}>{m.title}</b>{m.sub && <span className="sub">{m.sub}</span>}</div><time>{m.at ? (m.at.length > 10 ? Z.when(m.at) : m.at) : ""}</time></div>)}</div>;
  }
  const Line = ({ k, sub, v, strong }) => <div className={cx("sc130-line", strong && "strong")}><span>{k}{sub && <em> {sub}</em>}</span><span className="tnum">{v}</span></div>;

  /* ======================= the distributor ======================= */
  const OUT = [{ id: "all", label: "All" }, { id: "sold", label: "Sold through" }, { id: "leftover", label: "Left at the godown" }, { id: "donation", label: "Donated" }];
  function DistCard({ b, onPaper }) {
    const [open, setOpen] = useState(false); const c = b.c; const w = Z.whole(c); const p = Z.distPapers(c);
    const kl = Z.lineOf(c, "kirana"), es = Z.lineOf(c, "expiresoon"), fb = Z.lineOf(c, "foodbank");
    const what = [kl && `${c.kiranas.length} kiranas took ${fmt.num(kl.units)}`, es && `${D.BUYER.name} ${fmt.num(es.units)}`, fb && `${c.partner.name} ${fmt.num(fb.units)}`, c.expiry && c.expiry.units && `${fmt.num(c.expiry.units)} expired at your godown`].filter(Boolean).join(" · ");
    return <Card className="stack snug">
      <div className="row" style={{ gap: 12 }}><Product name={c.sku.img} size={44} /><div className="grow" style={{ minWidth: 0 }}><div className="row tight wrap" style={{ gap: 8 }}><b>{c.sku.name}</b><S.OutcomeBadge o={c.outcome} size="sm" /></div><span className="t-footnote muted"><span className="mono">{c.ref}</span> · {fmt.num(c.plan.units)} packs at risk · cleared {Z.day(c.cleared)}</span></div></div>
      <span className="t-subhead">{what}. You ended whole: {Z.inr(w.recv)} received for {Z.inr(w.paid)} paid.</span>
      <div className="sc130-chips">{p.mine.filter(d => d.status !== "not required").concat(p.copies).map(d => <Chip key={d.id} icon={Z.PAPER_ICON[d.id]} label={SHORT[d.id]} no={d.no} onClick={() => onPaper(c, d.id)} />)}</div>
      <More open={open} onToggle={() => setOpen(o => !o)} />
      <Reveal open={open}><Moments items={Z.moments(c, b.h)} /></Reveal>
    </Card>;
  }
  function DistHistory({ me }) {
    const s = useStore(); const { go } = useRoute(); const dist = S.distOf(me); const [f, setF] = useState("all"); const [paper, setPaper] = useState(null);
    const { journey, past } = Z.distBatches(dist.id, s);
    const items = journey.map(b => ({ key: b.id, now: true, dot: "now", card: <Card className="row wrap" style={{ gap: 12 }}><Product name={D.SKUS[b.sku].img} size={44} /><div className="grow" style={{ minWidth: 0 }}><div className="row tight wrap" style={{ gap: 8 }}><b>{D.SKUS[b.sku].name}</b><Badge size="sm" tone="blue" dot live>in a journey</Badge></div><span className="t-footnote muted"><span className="mono">{b.id}</span> · the agents act in your name · its papers join this history once every line is done</span></div><Button variant="secondary" size="sm" onClick={() => go("home")}>Open Today</Button></Card> }))
      .concat(past.filter(b => f === "all" || b.c.outcome === f).map(b => ({ key: b.ref, at: Z.stepAt(b.h, "report"), what: "settled", card: <DistCard b={b} onPaper={(c, id) => setPaper({ c, id })} /> })));
    return <Screen me={me} title="History" sub={`${dist.name} · every batch of ${Z.C}'s at your godown, and its papers`}>
      <div className="stack" style={{ gap: 18, maxWidth: 820 }}>
        <div className="sc130-fit"><Segmented label="Show" value={f} onChange={setF} options={OUT} size="sm" /></div>
        <Rail items={items} />
      </div>
      <Z.PaperSheet open={!!paper} onClose={() => setPaper(null)} c={paper && paper.c} id={paper && paper.id} receipt={paper && paper.id === "receipt" ? paper.c.receipt : null} />
    </Screen>;
  }

  /* ======================= the kirana ======================= */
  const KF = [{ id: "all", label: "All" }, { id: "ordered", label: "Ordered" }, { id: "declined", label: "Declined" }, { id: "expired", label: "Expired" }];
  function OfferCardB({ o }) {
    const [open, setOpen] = useState(false);
    return <Card className="stack snug">
      <div className="row" style={{ gap: 12 }}><Product name={o.sku.img} size={44} /><div className="grow" style={{ minWidth: 0 }}><div className="row tight wrap" style={{ gap: 8 }}><b>{o.sku.name}</b><Z.OfferStatus o={o} size="sm" /></div><span className="t-footnote muted">{o.dist.short} · ₹{o.pack.toFixed(2)} a packet, buy 10 get 2 · your share up to {o.share}</span></div></div>
      <span className="t-subhead">{o.status === "ordered" ? <>You ordered {o.units} packets on {Z.when(o.orderedAt)}{o.van ? `, delivered on ${Z.weekday(o.van)}'s van` : ", on the round"}. Your margin at MRP: <b>{fmt.inr(o.m.margin)}</b>.</> : o.status === "open" ? `Open until ${Z.when(o.closed)}.` : `${Z.whyText(o)}.`}</span>
      {o.status === "ordered" && <><More open={open} onToggle={() => setOpen(x => !x)} label="The bill" /><Reveal open={open}><div className="stack tight" style={{ marginTop: 6 }}>
        <Line k="You paid" sub={`${o.m.paid} × ₹${o.pack.toFixed(2)}`} v={fmt.inr(o.m.pay)} /><Line k="Free packets" sub="2 with every 10" v={o.m.free} /><Line k="You sell at MRP" sub={`${o.units} × ₹${o.mrp}`} v={fmt.inr(o.m.sell)} /><Line k="Your margin" v={fmt.inr(o.m.margin)} strong /></div></Reveal></>}
    </Card>;
  }
  function KiranaHistory({ me }) {
    const s = useStore(); const k = Z.shopOf(me); const [f, setF] = useState("all");
    const list = Z.offersFor(k, s, Z.declinedAt()).filter(o => o.status !== "open" && (f === "all" || o.status === f));
    const all = Z.offersFor(k, s, Z.declinedAt()).filter(o => o.status === "ordered"); const margin = all.reduce((t, o) => t + o.m.margin, 0);
    return <Screen me={me} title="History" sub={`${k.name} · every scheme ${k.distributor === "rakesh" ? "Rakesh Traders" : "your distributor"} offered you`}>
      <div className="stack" style={{ gap: 18, maxWidth: 720 }}>
        <span className="t-subhead">{all.length ? <>You ordered from {all.length} of them, for <b>{fmt.inr(margin)}</b> of margin at MRP.</> : "You have not ordered from a scheme yet."}</span>
        <div className="sc130-fit"><Segmented label="Show" value={f} onChange={setF} options={KF} size="sm" /></div>
        {list.length ? <Rail items={list.map(o => ({ key: o.ref, at: o.sent, what: "offer sent", dot: o.status === "ordered" ? undefined : "muted", card: <OfferCardB o={o} /> }))} /> : <Card><Empty icon="history" title="Nothing here" body="Offers you order from, decline or let expire show here." /></Card>}
      </div>
    </Screen>;
  }
  function Offers({ me }) {
    const s = useStore(); const { go } = useRoute(); const { toast } = useNotice(); const k = Z.shopOf(me); const [dec, setDec] = useState(Z.declinedAt());
    const now = Z.offersFor(k, s, dec).find(o => o.story);
    const no = () => { Z.decline(); setDec(Z.declinedAt()); toast({ text: "Declined · it is in your History" }); };
    return <Screen me={me} title="Offers" sub={`${k.name} · ${k.area}, Nagpur`}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {now && now.status === "open" ? <><S.OfferCard shop={k.name} onOpen={() => go("offer")} /><Button variant="ghost" size="lg" block onClick={no}>Not this time</Button></>
          : now ? <OfferCardB o={now} /> : <Card><Empty img="kirana" title="No open offer" body="Rakesh Traders' schemes arrive here as a notification, in Hindi, ready to order in one tap." /></Card>}
        <Button variant="secondary" icon="history" onClick={() => go("report")}>Earlier offers and orders</Button>
      </div>
    </Screen>;
  }

  /* ======================= the food bank ======================= */
  function PickupCard({ p, onReceipt, onChecklist }) {
    const [open, setOpen] = useState(false);
    return <Card className="stack snug">
      <div className="row" style={{ gap: 12 }}><Product name={p.sku.img} size={44} /><div className="grow" style={{ minWidth: 0 }}><div className="row tight wrap" style={{ gap: 8 }}><b>{p.units} packs of {p.sku.name.replace(/ \d.*$/, "")}</b><Badge size="sm" tone="green" icon="check">collected</Badge></div><span className="t-footnote muted">From {p.from} · donor {D.CLIENT.name} via {p.dist.name}</span></div></div>
      <span className="t-subhead">{fmt.num(p.meals)} meals served at {p.spot}, {fmt.kg(Math.round(p.kg * 100) / 100)} kept out of landfill.</span>
      <div className="sc130-chips"><Chip icon="receipt" label={p.receipt.type} no={p.receipt.no} onClick={() => onReceipt(p)} /><Chip icon="clipboard-check" label="FSSAI checklist" onClick={() => onChecklist(p)} /></div>
      <More open={open} onToggle={() => setOpen(x => !x)} label="The pickup" />
      <Reveal open={open}><div style={{ marginTop: 10 }}><K.VTracker items={[{ id: "req", title: "Requested by the donation agent", time: Z.when(p.asked) }, { id: "conf", title: "Confirmed by you", time: Z.when(p.confirmed) }, { id: "col", title: `Collected from ${p.from}`, time: Z.when(p.collected) }, { id: "serve", title: `Served at ${p.spot}`, time: "that week" }]} done={4} /></div></Reveal>
    </Card>;
  }
  function FbHistory({ me }) {
    const s = useStore(); const { go } = useRoute(); const [rec, setRec] = useState(null); const [chk, setChk] = useState(null);
    const list = Z.pickupsFor(me.org, s); const done = list.filter(p => p.state === "collected"); const coming = list.filter(p => p.state !== "collected");
    const meals = done.reduce((t, p) => t + p.meals, 0);
    const items = coming.map(p => ({ key: p.ref, now: true, dot: "now", card: <Card className="row wrap" style={{ gap: 12 }}><Product name={p.sku.img} size={44} /><div className="grow" style={{ minWidth: 0 }}><b>{p.units} packs of {p.sku.name.replace(/ \d.*$/, "")}</b><div className="t-footnote muted">{p.slot} · from {p.from}</div></div><Button variant="secondary" size="sm" onClick={() => go("pickups")}>Open the pickup</Button></Card> }))
      .concat(done.map(p => ({ key: p.ref, at: p.collected, what: "collected", card: <PickupCard p={p} onReceipt={setRec} onChecklist={setChk} /> })));
    return <Screen me={me} title="History" sub={`${me.org} · every pickup from ${Z.C}, with its receipt`}>
      <div className="stack" style={{ gap: 18, maxWidth: 760 }}>
        {done.length ? <span className="t-subhead"><b>{fmt.num(meals)} meals</b> from {done.length} pickups since July.</span> : null}
        <Rail items={items} />
      </div>
      <Z.PaperSheet open={!!rec} onClose={() => setRec(null)} c={rec && rec.c} receipt={rec && rec.receipt} />
      <Sheet open={!!chk} onClose={() => setChk(null)} title="FSSAI surplus-food checklist">{chk && <div className="paper stack tight" style={{ padding: 18 }}>{Z.fssaiItems(chk).map(t => <div key={t} className="row top" style={{ gap: 8 }}><Icon name="square-check" size={17} style={{ color: "#167a52", marginTop: 1 }} /><span className="t-subhead">{t}</span></div>)}</div>}</Sheet>
    </Screen>;
  }

  /* ---------- the routes these screens take over ---------- */
  const ReportOrig = S.Report;
  S.Report = props => { const r = props.me.role; return r === "distributor" ? <DistHistory {...props} /> : r === "retailer" ? <KiranaHistory {...props} /> : r === "foodbank" ? <FbHistory {...props} /> : <ReportOrig {...props} />; };
  S.RetailHome = Offers;
})();

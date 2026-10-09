// SC-130 option A · Batch by batch. Every partner reads its own batches the way Priya reads hers (SC-112, SC-121): a
// list of what was and is at stake, each opening its own page.
//   the distributor: Batches (in a journey now, everything he cleared by month, the stock the Watcher reads), each with
//   What happened, Money (how he ended whole) and Papers (his invoice and Munchly's credit notes, with copies of what
//   concerns his packs);
//   the kirana: Offers, the open one first (with Not this time), then every earlier offer, ordered, declined or
//   expired, each opening on what was offered and what came of it; Orders, with what each order earned;
//   the food bank: Pickups, coming then collected, each opening on its tracker, its receipt and its FSSAI checklist.
(function () {
  const { useState } = React;
  const { motion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER, Z = window.SC130;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, Money, Empty, VTracker, BatchRow, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle, Locked } = S;
  const fmt = M.fmt;

  // the navigation: the distributor's Batches between Today and the van (Label photo stays reachable, off the phone's
  // four tabs); the kirana and the food bank keep theirs
  S.NAV.distributor.splice(0, S.NAV.distributor.length,
    { id: "home", label: "Today", icon: "house" }, { id: "batches", label: "Batches", icon: "boxes" },
    { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true }, { id: "van", label: "Van route", short: "Van", icon: "truck" }, { id: "orders", label: "Orders", icon: "clipboard-list" });

  /* ---------- shared pieces ---------- */
  function Tabs({ tabs, value, onChange, label }) {
    const phone = useApp().bp === "phone";
    return <nav className="bh-tabs sc130-tabs" aria-label={label}>{tabs.map(t => { const on = t.id === value;
      return <button key={t.id} type="button" className="bh-tab" aria-current={on ? "page" : undefined} onClick={() => onChange(t.id)}>
        {on && <motion.span layoutId="sc130a-thumb" className="bh-tab-thumb" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
        {!phone && <Icon name={t.icon} size={16} />}<span>{t.label}</span></button>; })}</nav>;
  }
  function Moments({ items }) {
    return <div className="sc130-moments" role="list">{items.map((m, i) => <div key={m.k + i} role="listitem" className={cx("sc130-moment", m.ahead && "ahead")}>
      <span className="icontile"><Icon name={m.icon} size={17} stroke={2} /></span>
      <div><b>{m.title}</b>{m.sub && <span className="sub">{m.sub}</span>}</div>
      <time>{m.at ? (m.at.length > 10 ? Z.when(m.at) : m.at) : m.ahead ? "next" : ""}</time>
    </div>)}</div>;
  }
  const Line = ({ k, sub, v, strong, onClick }) => <div className={cx("sc130-line", strong && "strong")}><span>{k}{sub && <em> {onClick ? <button type="button" className="sc130-more" style={{ minHeight: 0, fontSize: 13.5 }} onClick={onClick}>{sub}</button> : sub}</em>}</span><span className="tnum">{v}</span></div>;
  const stage = phase => ({ "at-risk": "Verify", verified: "Value", valued: "Decide", planned: "Approve", approved: "Execute", executing: "Execute", dispatched: "Settle", settled: "Settle", cleared: "Report" }[phase] || "Detect");

  /* ======================= the distributor ======================= */
  function DistBatches({ me }) {
    const s = useStore(); const { route, go } = useRoute(); const app = useApp(); const phone = app.bp === "phone";
    const dist = S.distOf(me); const ref = route.params && route.params.ref;
    if (ref) return <DistBatch me={me} dist={dist} id={ref} />;
    const { journey, watching, past } = Z.distBatches(dist.id, s);
    const credit = past.reduce((t, b) => t + b.c.support.total + ((b.c.expiry && b.c.expiry.credit) || 0), 0);
    const notes = past.reduce((t, b) => t + b.c.docs.filter(d => (d.id === "support" || d.id === "expiry") && d.status !== "not required").length, 0);
    const months = []; past.forEach(b => { const m = b.c.cleared.slice(0, 7); let g = months.find(x => x.m === m); if (!g) months.push(g = { m, label: Z.month(b.c.cleared), items: [] }); g.items.push(b); });
    return <Screen me={me} title="Batches" sub={`${dist.name} · every batch of ${Z.C}'s the Watcher flagged at your godown`}>
      <div className="stack" style={{ gap: 20 }}>
        {journey.length ? <List head="In a journey now">{journey.map(b => { const sku = D.SKUS[b.sku]; const phase = b.hero ? s.hero.phase : s.mango.phase;
          return <ListRow key={b.id} chevron onClick={() => go("batches", { ref: b.id })} leading={<Product name={sku.img} size={40} />}
            title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{sku.name}</span><Badge size="sm" tone="blue" dot live>{stage(phase)}</Badge></span>}
            sub={`${b.id} · flagged ${Z.day(Z.STORY_DAY)} · the agents act in your name`} value={phone ? null : `${fmt.num(b.hero ? D.PLAN.units : D.MANGO_PLAN.units)} packs`} />; })}</List> : null}
        {past.length ? <Card className="stack" style={{ gap: 10 }}>
          <div className="lg-fig"><Money value={credit} size="l" /><span className="lg-what">from {Z.C} since July</span></div>
          <p className="lg-working">{past.length} batches cleared at your godown. On each, the price support (and on expiry day the expiry credit) made up the gap to the dealer price you paid, so you ended whole: <b>{notes} credit notes</b>, each in its batch's papers.</p>
        </Card> : null}
        {months.map(g => <List key={g.m} head={`Cleared · ${g.label}`}>{g.items.map(b => { const c = b.c; const cr = c.support.total + ((c.expiry && c.expiry.credit) || 0); const papers = Z.distPapers(c);
          return <ListRow key={b.ref} chevron onClick={() => go("batches", { ref: b.ref })} leading={<Product name={c.sku.img} size={40} />}
            title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{c.sku.name}</span>{!phone && <S.OutcomeBadge o={c.outcome} size="sm" />}</span>}
            sub={`${c.ref} · flagged ${Z.day(c.flagged)} · cleared ${Z.day(c.cleared)}`}
            value={<span className="lg-val"><b className="tnum">{Z.inr(cr)}</b><em>{papers.mine.filter(d => d.status !== "not required").length + papers.copies.length} papers</em></span>} />; })}</List>)}
        {watching.length ? <><SectionTitle sub="From your nightly DMS export: nothing at risk">Watching</SectionTitle><div className="list">{watching.map(b => <BatchRow key={b.id} view={D.batchView(b)} compact={phone} onOpen={() => {}} />)}</div></> : null}
      </div>
    </Screen>;
  }

  // a batch's own page: its head, then What happened, Money and Papers
  const TABS = [{ id: "what", label: "What happened", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }];
  function DistBatch({ me, dist, id }) {
    const s = useStore(); const [tab, setTab] = useState("what"); const [paper, setPaper] = useState(null);
    const past = Z.distBatches(dist.id, s).past.find(b => b.ref === id);
    const story = !past && D.BATCHES.find(b => b.id === id && b.hero);
    const c = past ? past.c : L.storyCase(); const sku = c.sku;
    const cleared = !!past || s.hero.phase === "cleared";
    const head = <><Z.Head sku={sku} id={id} where={`${dist.godown}, ${dist.city}`} badge={past ? <S.OutcomeBadge o={c.outcome} size="sm" /> : <Badge size="sm" tone="blue" dot live>{stage(s.hero.phase)}</Badge>}
      line={past ? `Flagged ${Z.day(c.flagged)} · cleared ${Z.day(c.cleared)}` : `Flagged ${Z.day(Z.STORY_DAY)} · the agents act in your name`} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} label={`${sku.name}, ${id}`} /></>;
    let body;
    if (tab === "what") body = <Card><Moments items={past ? Z.moments(c, past.h) : storyMoments(s)} /></Card>;
    else if (tab === "money") body = <WholeCard c={c} story={!past} s={s} onPaper={setPaper} />;
    else body = <Papers c={c} ready={!!past || !!s.hero.docs} onOpen={setPaper} />;
    return <Screen me={me} title={sku.name} back="Batches" hideLarge below={head}>
      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} style={{ maxWidth: 820, marginTop: 4 }}>{body}</motion.div>
      <Z.PaperSheet open={!!paper} onClose={() => setPaper(null)} c={c} id={paper} receipt={paper === "receipt" ? c.receipt : null} />
    </Screen>;
  }

  // the story's batch while it is in a journey: what has happened so far, from the store's feed, and what is next
  const FEED = [["permit", "handshake", "You gave the one-time permission"], ["watch", "radar", "The Watcher flagged 1,360 packs at risk"], ["ask", "scan-line", "Vision asked you for a label photo"], ["photo", "camera", "You sent the label photo"], ["read", "scan-line", "Vision read the label"],
    ["approved", "check", `${Z.C} approved the plan`], ["list", "shopping-bag", "772 listed on ExpireSoon in your name"], ["outreach", "send", "The scheme went to 38 of your kiranas"], ["accepted", "handshake", `${D.BUYER.name} took the counter at ₹14.20`], ["orders", "store", "31 kiranas ordered 588 packets"],
    ["dispatch", "truck", `You loaded ${D.BUYER.name}'s truck`], ["papers", "file-check", "The Paperwork agent drafted your papers"], ["van", "route", "Your Tuesday van round delivered the scheme"], ["ledger", "badge-check", "Settled: you ended whole"]];
  function storyMoments(s) {
    const seen = new Set((s.feed || []).map(e => e.key)); const items = []; let next = 0;
    FEED.forEach(([k, icon, title]) => { const e = (s.feed || []).find(x => x.key === k); if (e) items.push({ k, icon, title, at: e.at }); else if (next < 3 && seen.size) { items.push({ k, icon, title, ahead: true }); next++; } });
    return items;
  }

  // how he ended whole: what he received against what he paid
  function WholeCard({ c, story, s, onPaper }) {
    const w = story ? storyWhole(s) : Z.whole(c);
    return <div className="stack" style={{ gap: 16 }}>
      <Card className="stack snug">
        <div className="card-head"><span className="card-title">You end whole</span><Badge tone={story && s.hero.phase !== "cleared" ? undefined : "green"} icon={story && s.hero.phase !== "cleared" ? "clock" : "check"}>{story && s.hero.phase !== "cleared" ? "on the plan" : "settled"}</Badge></div>
        <div className="stack tight">{w.rows.map(r => <Line key={r.k} k={r.k} sub={r.sub} v={Z.inr(r.v)} onClick={r.paper && !story ? () => onPaper(r.paper) : null} />)}
          <div className="hairline" style={{ margin: "4px 0" }} />
          <Line k="What you receive" v={Z.inr(w.recv)} strong />
          <Line k="What you paid" sub={`${fmt.num(w.units)} × ₹${w.dp}, the van and the listing fee`} v={Z.inr(-w.paid)} />
          <Line k="Your gain or loss" v={Z.inr(w.gain)} strong /></div>
        <span className="t-caption subtle">Instead of waiting weeks for an expiry claim, with no claim paperwork.</span>
      </Card>
    </div>;
  }
  function storyWhole(s) {
    const KL = D.PLAN.lines.find(l => l.id === "kirana"), ES = D.PLAN.lines.find(l => l.id === "expiresoon"), sku = D.SKUS.chips;
    const rows = [{ k: "From your kiranas", sub: `${fmt.num(KL.units)} packets on the scheme`, v: KL.gross }, { k: `From ${D.BUYER.name}`, sub: `${fmt.num(ES.units)} packets`, v: s.hero.award ? D.AWARD.gross : ES.gross }, { k: "Price-support credit note", sub: "from Munchly", v: D.SUPPORT.total }];
    const recv = rows.reduce((t, r) => t + r.v, 0), paid = D.PLAN.units * sku.dp + D.SUPPORT.van + D.SUPPORT.fee;
    return { rows, recv, paid, gain: Math.round(recv - paid), dp: sku.dp, units: D.PLAN.units };
  }

  // his papers, then copies of what concerns his packs
  function Papers({ c, ready, onOpen }) {
    if (!ready) return <Locked icon="file-text" agent="Paperwork agent" text="Drafts your tax invoice to the buyer and Munchly's price-support credit note to you once every line of the plan is done." />;
    const p = Z.distPapers(c);
    return <div className="stack" style={{ gap: 16 }}>
      <div><div className="sc130-head">Your papers</div><div className="sc130-papers">{p.mine.map(d => <Z.PaperRow key={d.id} c={c} d={d} onOpen={onOpen} />)}</div></div>
      {p.copies.length ? <div><div className="sc130-head">Copies for your records</div><div className="sc130-papers">{p.copies.map(d => <Z.PaperRow key={d.id} c={c} d={d} onOpen={onOpen} />)}</div></div> : null}
      <p className="t-footnote subtle" style={{ margin: 0 }}>Each opens on paper with its PDF. {Z.C}'s own GST memo and FSSAI checklist stay with {Z.C}.</p>
    </div>;
  }

  /* ======================= the kirana ======================= */
  function Offers({ me }) {
    const s = useStore(); const { go } = useRoute(); const { toast } = useNotice(); const k = Z.shopOf(me); const [dec, setDec] = useState(Z.declinedAt());
    const list = Z.offersFor(k, s, dec); const open = list.find(o => o.status === "open"); const now = list.find(o => o.story);
    const earlier = list.filter(o => o !== open);
    const no = () => { Z.decline(); setDec(Z.declinedAt()); toast({ text: "Declined · Rakesh Traders' next scheme still comes to you" }); };
    const after = () => { Z.undecline(); setDec(null); go("offer"); };
    return <Screen me={me} title="Offers" sub={`${k.name} · ${k.area}, Nagpur`}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {open ? <><S.OfferCard shop={k.name} onOpen={() => go("offer")} /><Button variant="ghost" size="lg" block onClick={no}>Not this time</Button></>
          : now && now.status === "declined" ? <Card className="stack snug"><div className="row" style={{ gap: 14 }}><Product name="pack-chips" size={64} /><div className="grow"><b>You said not this time</b><div className="t-footnote muted">Masala Chips 150 g · declined {Z.when(now.declinedAt)}. The offer stays open until {Z.when(now.closed)} if you change your mind.</div></div></div><Button variant="secondary" block onClick={after}>Order after all</Button></Card>
          : now && now.status === "ordered" ? <Card className="row" style={{ gap: 14 }}><Product name="pack-chips" size={64} /><div className="grow"><b>Ordered · {now.units} packets</b><div className="t-footnote muted">Masala Chips 150 g · comes on Tuesday's van</div></div><Badge tone="green" icon="check">confirmed</Badge></Card>
          : <Card><Empty img="kirana" title="No open offer" body="Rakesh Traders' schemes arrive here as a notification, in Hindi, ready to order in one tap." /></Card>}
        <List head="Earlier offers">{earlier.map(o => <ListRow key={o.ref} chevron onClick={() => go("offer", { ref: o.ref })} leading={<Product name={o.sku.img} size={40} />}
          title={o.sku.name} sub={`${Z.day(o.sent)} · ${o.dist.short} · ₹${o.pack.toFixed(2)} a packet`} value={<Z.OfferStatus o={o} size="sm" />} />)}</List>
      </div>
    </Screen>;
  }

  // one offer's page: what was offered, and what came of it
  function OfferPage({ me, o, k }) {
    const head = <Z.Head sku={o.sku} id={o.ref} where={`From ${o.dist.short}`} badge={<Z.OfferStatus o={o} size="sm" />} line={`Sent ${Z.when(o.sent)}`} />;
    return <Screen me={me} title={o.sku.name} back="Offers" hideLarge below={head}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {o.status === "ordered" ? <Card className="stack snug">
          <div className="card-head"><span className="card-title">Your order</span><Badge tone="green" icon="check">{o.van ? `delivered ${Z.weekday(o.van)}` : "on the round"}</Badge></div>
          <div className="stack tight">
            <Line k={`You ordered ${o.units} packets`} sub={Z.when(o.orderedAt)} v="" />
            <Line k="You paid" sub={`${o.m.paid} × ₹${o.pack.toFixed(2)}`} v={fmt.inr(o.m.pay)} />
            <Line k="Free packets" sub="2 with every 10" v={o.m.free} />
            <Line k="You sell at MRP" sub={`${o.units} × ₹${o.mrp}`} v={fmt.inr(o.m.sell)} />
            <div className="hairline" style={{ margin: "4px 0" }} />
            <Line k="Your margin" v={fmt.inr(o.m.margin)} strong />
          </div>
          {o.van && <span className="t-footnote subtle">Delivered on {Z.weekday(o.van)}'s van, {Z.day(o.van)} · paid on delivery to {o.dist.short}</span>}
        </Card> : <Card className="row top" style={{ gap: 14 }}><span className="icontile" style={{ background: "var(--fill-2)", color: "var(--fg-2)" }}><Icon name={o.status === "declined" ? "x" : "clock"} size={18} /></span>
          <div className="grow"><b>{o.status === "declined" ? "You said not this time" : "This offer expired"}</b><div className="t-footnote muted">{Z.whyText(o)}. Nothing was ordered and nothing is owed.</div></div></Card>}
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

  function Orders({ me }) {
    const s = useStore(); const { go } = useRoute(); const k = Z.shopOf(me); const list = Z.offersFor(k, s, Z.declinedAt()).filter(o => o.status === "ordered");
    const margin = list.reduce((t, o) => t + o.m.margin, 0), packets = list.reduce((t, o) => t + o.units, 0);
    return <Screen me={me} title="Orders" sub={k.name}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {list.length ? <><Card className="stack" style={{ gap: 8 }}><div className="lg-fig"><Money value={margin} size="l" /><span className="lg-what">your margin at MRP</span></div><p className="lg-working">{list.length} orders since July, {fmt.num(packets)} packets, each delivered on the van with 2 free in every 12.</p></Card>
          <List>{list.map(o => <ListRow key={o.ref} chevron onClick={() => go("offer", { ref: o.ref })} leading={<Product name={o.sku.img} size={40} />} title={`${o.sku.name} · ${o.units} packets`} sub={`ordered ${Z.when(o.orderedAt)}${o.van ? ` · ${Z.weekday(o.van)}'s van` : " · on the round"}`} value={<Money value={o.m.margin} size="s" />} />)}</List></>
          : <Card><Empty icon="shopping-basket" title="No orders yet" body="Orders you place from an offer show here with the van day." /></Card>}
      </div>
    </Screen>;
  }

  /* ======================= the food bank ======================= */
  const PickupsOrig = S.Pickups;
  function Pickups({ me }) {
    const s = useStore(); const { route, go } = useRoute(); const ref = route.params && route.params.ref;
    const list = Z.pickupsFor(me.org, s);
    if (ref) { const p = list.find(x => x.ref === ref); if (p && p.story) return <PickupsOrig me={me} />; if (p) return <PickupPage me={me} p={p} />; }
    const coming = list.filter(p => p.state !== "collected"), done = list.filter(p => p.state === "collected");
    const meals = done.reduce((t, p) => t + p.meals, 0), packs = done.reduce((t, p) => t + p.units, 0), kg = done.reduce((t, p) => t + p.kg, 0);
    return <Screen me={me} title="Pickups" sub={`${me.org} · surplus food from ${Z.C}`}>
      <div className="stack" style={{ gap: 20, maxWidth: 760 }}>
        {coming.length ? <List head="Coming">{coming.map(p => <ListRow key={p.ref} chevron onClick={() => go("pickups", { ref: p.ref })} leading={<Product name={p.sku.img} size={44} />}
          title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{p.units} packs of {p.sku.name.replace(/ \d.*$/, "")}</span><Badge size="sm" tone="blue" dot live>{p.state === "booked" ? "asks for a time" : "confirmed"}</Badge></span>}
          sub={`${p.slot} · from ${p.from}`} />)}</List> : null}
        {done.length ? <Card className="stack" style={{ gap: 8 }}><div className="lg-fig"><span className="num l">{fmt.num(meals)}</span><span className="lg-what">meals from {Z.C}'s surplus since July</span></div>
          <p className="lg-working">{done.length} pickups, {fmt.num(packs)} packs, {fmt.kg(Math.round(kg * 100) / 100)} kept out of landfill, each with its receipt and the FSSAI checklist.</p></Card> : null}
        {done.length ? <List head="Collected">{done.map(p => <ListRow key={p.ref} chevron onClick={() => go("pickups", { ref: p.ref })} leading={<Product name={p.sku.img} size={44} />}
          title={`${p.units} packs of ${p.sku.name.replace(/ \d.*$/, "")}`} sub={`Collected ${Z.when(p.collected)} · ${p.from}`}
          value={<span className="lg-val"><b className="mono" style={{ fontSize: 13 }}>{p.receipt.no}</b><em>{fmt.num(p.meals)} meals</em></span>} />)}</List>
          : <Card><Empty img="donation-crate" title="No pickups yet" body="Brands' donation agents send surplus food here when it fits your intake rules." /></Card>}
      </div>
    </Screen>;
  }
  function PickupPage({ me, p }) {
    const [open, setOpen] = useState(false);
    const head = <Z.Head sku={p.sku} id={p.ref} where={p.from} badge={<Badge size="sm" tone="green" icon="check">collected</Badge>} line={`Donor: ${D.CLIENT.name} via ${p.dist.name}`} />;
    return <Screen me={me} title={p.sku.name} back="Pickups" hideLarge below={head}>
      <Columns sideWidth={340}
        main={<div className="stack" style={{ gap: 16 }}><Card className="stack snug"><div className="card-head"><span className="card-title">Pickup</span><Badge tone="green" icon="check">{p.units} packs</Badge></div>
          <VTracker items={[{ id: "req", title: "Requested by the donation agent", time: Z.when(p.asked) }, { id: "conf", title: "Confirmed by you", time: Z.when(p.confirmed) }, { id: "col", title: `Collected from ${p.from}`, time: Z.when(p.collected) }, { id: "serve", title: `Served at ${p.spot}`, time: "that week" }]} done={4} />
          <button type="button" className="receipt-row" onClick={() => setOpen(true)}><Icon name="receipt" size={20} /><span className="grow"><b>{p.receipt.type} {p.receipt.no}</b><span className="t-footnote">{fmt.num(p.units)} packs · {fmt.num(p.meals)} meals · shared with {Z.C} for its BRSR table</span></span><span className="receipt-view">View<Icon name="chevron-right" size={16} /></span></button>
        </Card></div>}
        side={<><SectionTitle>FSSAI surplus-food checklist</SectionTitle><Card className="paper stack tight" style={{ padding: 18 }}>{Z.fssaiItems(p).map(t => <div key={t} className="row top" style={{ gap: 8 }}><Icon name="square-check" size={17} style={{ color: "#167a52", marginTop: 1 }} /><span className="t-subhead">{t}</span></div>)}</Card></>} />
      <Z.PaperSheet open={open} onClose={() => setOpen(false)} c={p.c} receipt={p.receipt} />
    </Screen>;
  }

  /* ---------- the routes these screens take over ---------- */
  const BatchesOrig = S.Batches, OfferOrig = S.OfferDetail;
  S.Batches = props => (props.me.role === "distributor" ? <DistBatches {...props} /> : <BatchesOrig {...props} />);
  S.RetailHome = Offers;
  S.RetailOrders = Orders;
  S.OfferDetail = props => {
    const s = useStore(); const { route } = useRoute(); const ref = route.params && route.params.ref; const k = Z.shopOf(props.me);
    const o = ref && Z.offersFor(k, s, Z.declinedAt()).find(x => x.ref === ref);
    return o && o.status !== "open" ? <OfferPage {...props} o={o} k={k} /> : <OfferOrig {...props} />;
  };
  S.Pickups = Pickups;
})();

// Smart-Clearance v3 · the trade: Rakesh bhai (distributor), Ganesh ji (kirana), Venkat on ExpireSoon (buyer), Meera (food bank)
(function () {
  const { useState, useEffect, useRef, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Sheet, Product, Empty, Money, Roll, DaysNum, GateChips, Tile, Aura, AgentFeed, ClusterMap, HaulLine, StatusBadge, BatchRow, useApp, useNotice, Mark } = K;
  const { useStore, useRoute, heroModel, Screen, Columns, SectionTitle, Locked } = S;
  const IMG = () => window.SC3_IMG || "system/img/";
  const distOf = me => Object.values(D.DISTRIBUTORS).find(d => d.name === (me && me.org)) || D.DISTRIBUTORS.rakesh;
  const kOf = me => D.KIRANAS.find(k => k.name === (me && me.org)) || D.KIRANAS[0];
  const cartons = u => { const c = Math.floor(u / 24), r = u % 24; return r === 12 ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? "" : "s"}`; };

  /* ======================= Rakesh bhai · distributor ======================= */
  function DistHome({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const app = useApp();
    const dist = distOf(me); const hero = dist.id === "rakesh";
    const mine = D.BATCHES.filter(b => b.distributor === dist.id).map(b => { const v = D.batchView(b); if (b.hero) v.phase = heroModel(s).view.phase; if (b.second) v.phase = "executing"; return v; });
    const units = h.orders.reduce((t, o) => t + o.units, 0);
    return <Screen me={me} title="Today" sub={`${dist.name} · ${dist.godown}, ${dist.city}`}>
      <div className="stack" style={{ gap: 16 }}>
        {!hero && <Card className="row wrap" style={{ gap: 14 }}><Product name="godown" size={72} /><div className="grow"><b>Nothing to do today</b><div className="t-footnote muted">No photo requests, scheme orders or marketplace lots for {dist.name} right now. The Watcher checks your stock every morning at 09:00.</div></div></Card>}
        {hero && h.photo.status === "requested" && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bezel"><div className="card raised stack snug" style={{ padding: 20 }}>
          <div className="row tight"><Mark size={30} /><span className="t-footnote subtle strong">Smart-Clearance · {D.PUSH.verify.at}</span></div>
          <div className="t-title3">{D.PUSH.verify.title}</div>
          <p className="t-body" style={{ margin: 0 }}>{D.PUSH.verify.body}</p>
          <div className="row" style={{ gap: 12 }}><Product name="phone-scan" size={72} /><span className="t-footnote muted">Shelf B4 · one carton of Masala Chips 150 g · batch MF-2409-117</span></div>
          <Button variant="primary" size="lg" icon="camera" block onClick={() => go("photo")}>Open camera</Button>
        </div></motion.div>}
        {hero && ["reading", "verified"].includes(h.photo.status) && <Card className="row" style={{ gap: 14 }}><Aura on={h.photo.status === "reading"} className="icontile" style={{ borderRadius: 12, width: 40, height: 40 }}><Icon name={h.photo.status === "verified" ? "check" : "scan-line"} size={19} stroke={2.2} /></Aura><div className="grow"><b>{h.photo.status === "verified" ? "Label verified · thank you" : "Photo sent · reading the label"}</b><div className="t-footnote muted">{h.photo.status === "verified" ? "Batch, dates and MRP match your DMS record." : "Sent at 09:19. Nothing else needed from you."}</div></div></Card>}
        {hero && <div style={{ display: "grid", gap: 16, gridTemplateColumns: app.bp === "phone" ? "minmax(0,1fr)" : "repeat(2, minmax(0,1fr))" }}>
          <Card interactive className="stack snug" onClick={() => go("van")} role="button" tabIndex={0}>
            <div className="card-head"><span className="row tight"><span className="icontile"><Icon name="truck" size={17} stroke={2} /></span><span className="card-title">Tuesday van round</span></span><Icon name="chevron-right" size={18} className="subtle" /></div>
            <div className="row base" style={{ gap: 8 }}><span className="num m"><Roll value={h.orders.length} /></span><span className="muted">shops · {cartons(units)}</span></div>
            <span className="t-footnote subtle">{h.van.status === "done" ? "Delivered · all 14 shops" : h.orders.length ? "Orders from the Masala Chips scheme join this round" : "Scheme orders will appear here"}</span>
          </Card>
          <Card interactive className="stack snug" onClick={() => go("van")} role="button" tabIndex={0}>
            <div className="card-head"><span className="row tight"><span className="icontile violet"><Icon name="package" size={17} stroke={2} /></span><span className="card-title">Hyderabad lot · ExpireSoon</span></span><Icon name="chevron-right" size={18} className="subtle" /></div>
            <div className="row base" style={{ gap: 8 }}><span className="num m">772</span><span className="muted">units · 32 cartons + 4</span></div>
            <span className="t-footnote subtle">{h.truck.status === "dispatched" ? "Dispatched · on NH 44" : h.award ? `Sold at ₹${D.COUNTER.price.toFixed(2)} · token ${fmt.inr(D.AWARD.token)} paid` : h.listing ? "Listed at ₹15 · waiting for a buyer" : "Not listed"}</span>
          </Card>
        </div>}
        <SectionTitle sub="From your nightly DMS export">Your stock</SectionTitle>
        <div className="list">{mine.map(v => <BatchRow key={v.id} view={v} compact={app.bp === "phone"} onOpen={() => {}} />)}</div>
      </div>
    </Screen>;
  }

  function CameraScreen({ me, realCamera }) {
    if (distOf(me).id !== "rakesh") return <Screen me={me} title="Label photo" sub="Requests from the Vision agent"><Card style={{ maxWidth: 560 }}><Empty img="phone-scan" title="No photo requests" body="When a batch needs checking, Vision asks for one picture of a carton label here." /></Card></Screen>;
    return <CameraInner me={me} realCamera={realCamera} />;
  }
  function CameraInner({ me, realCamera }) {
    const s = useStore(); const h = s.hero; const { go, back } = useRoute(); const reduce = useReducedMotion(); const file = useRef(null);
    const [shot, setShot] = useState(null); const [flash, setFlash] = useState(false); const [sending, setSending] = useState(false);
    const sent = h.photo.status === "reading" || h.photo.status === "verified";
    const take = () => { if (realCamera && file.current && window.matchMedia("(pointer: coarse)").matches) { file.current.click(); return; } setFlash(true); setTimeout(() => { setFlash(false); setShot("demo"); }, reduce ? 0 : 180); };
    const picked = e => { const f = e.target.files && e.target.files[0]; if (f) setShot(URL.createObjectURL(f)); };
    const send = () => { setSending(true); setTimeout(() => { setSending(false); Flow.act("sendPhoto"); }, 700); };
    return <Screen me={me} title="Label photo" sub="Batch MF-2409-117 · shelf B4" back="Today">
      <div className="stack" style={{ gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <div className="cam">
          {shot && shot !== "demo" ? <img className="cam-feed" src={shot} alt="Your photo of the carton label" /> : <S.LabelShot cover dim={!shot && !sent} />}
          {!shot && !sent && <><div className="cam-frame" aria-hidden="true"><i /><i /><i /><i /></div><div className="cam-hint">Fit one carton label in the frame</div></>}
          {sent && <div className="cam-hint" style={{ background: "color-mix(in oklab, var(--primary) 85%, black)" }}><Icon name={h.photo.status === "verified" ? "check" : "loader"} size={14} className={h.photo.status === "verified" ? "" : "spin"} /> {h.photo.status === "verified" ? "Verified · matches your records" : "Sent · Vision is reading the label"}</div>}
          <AnimatePresence>{flash && <motion.div key="f" className="cam-flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} />}</AnimatePresence>
          {h.photo.status === "reading" && !reduce && <motion.div aria-hidden="true" className="cam-scan" animate={{ top: ["20%", "76%", "20%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />}
        </div>
        {sent ? <Card className="stack snug">
          <div className="row" style={{ gap: 12 }}><Aura on={h.photo.status === "reading"} className="icontile" style={{ borderRadius: 12, width: 40, height: 40 }}><Icon name={h.photo.status === "verified" ? "badge-check" : "scan-line"} size={19} /></Aura><div className="grow"><b>{h.photo.status === "verified" ? "Done. Dhanyavaad, Rakesh bhai." : "Reading batch, dates and MRP"}</b><div className="t-footnote muted">{h.photo.status === "verified" ? "The plan for this batch will reach Priya in a few minutes." : "This takes a few seconds."}</div></div></div>
          {h.photo.status === "verified" && <List>{[["Batch", "MF-2409-117"], ["Best before", "18 Nov 2026"], ["MRP", "₹30.00"]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>}
          <Button variant="secondary" block onClick={() => go("home")}>Back to today</Button>
        </Card> : shot ? <div className="row" style={{ gap: 10 }}><Button variant="secondary" size="lg" icon="rotate-ccw" onClick={() => setShot(null)}>Retake</Button><Button variant="primary" size="lg" block icon="send" loading={sending} onClick={send}>Send photo</Button></div>
          : <div className="cam-bar"><label className="iconbtn round" aria-label="Choose a photo from the gallery" style={{ cursor: "pointer" }}><Icon name="image" size={22} /><input type="file" accept="image/*" onChange={picked} className="sr-only" /></label><button type="button" className="shutter" aria-label="Take the photo" onClick={take}><span /></button><span style={{ width: 44 }} /><input ref={file} type="file" accept="image/*" capture="environment" onChange={picked} className="sr-only" tabIndex={-1} aria-hidden="true" /></div>}
        {realCamera && <p className="t-caption subtle" style={{ textAlign: "center", margin: 0 }}>On a phone the shutter opens your camera. In this prototype a stub stands in for Gemini vision and returns the batch record.</p>}
      </div>
    </Screen>;
  }

  function VanRoute({ me }) {
    if (distOf(me).id !== "rakesh") return <Screen me={me} title="Van route" sub={distOf(me).cluster}><Card style={{ maxWidth: 560 }}><Empty img="van" title="No scheme orders on the van" body="Orders from Smart-Clearance offers join your next round automatically." /></Card></Screen>;
    return <VanInner me={me} />;
  }
  function VanInner({ me }) {
    const s = useStore(); const h = s.hero; const app = useApp(); const reduce = useReducedMotion(); const { toast } = useNotice();
    const units = h.orders.reduce((t, o) => t + o.units, 0); const all = h.orders.length === D.KIRANAS.length;
    const [p, setP] = useState(h.van.status === "done" ? 1 : 0); const [running, setRunning] = useState(false);
    useEffect(() => { if (h.van.status === "done" && !running) setP(1); }, [h.van.status]);
    const start = () => { setRunning(true); const t0 = performance.now(), dur = reduce ? 10 : 3600; const step = now => { const k = Math.min(1, (now - t0) / dur); setP(k); if (k < 1) requestAnimationFrame(step); else { setRunning(false); Flow.act("vanRound"); toast({ text: "Round done · 14 shops, 24½ cartons", tone: "ok" }); } }; requestAnimationFrame(step); };
    const dispatch = () => { Flow.act("dispatch"); toast({ text: "Hyderabad lot dispatched · invoice on its way", tone: "ok" }); };
    const stops = D.KIRANAS.map(k => ({ ...k, ordered: h.orders.find(o => o.id === k.id) }));
    return <Screen me={me} title="Van route" sub="Kalamna godown · Nagpur, Wardha and Kamptee" back="Today">
      <Columns sideWidth={380}
        main={<>
          <Card pad={false} style={{ overflow: "hidden" }}><ClusterMap kiranas={D.KIRANAS} orderedCount={h.orders.length} route={h.orders.length > 0} vanProgress={p} height={app.bp === "phone" ? 260 : 380} /></Card>
          <Card className="stack snug">
            <div className="card-head"><span className="card-title">Tuesday round</span><Badge tone={h.van.status === "done" ? "green" : undefined} icon={h.van.status === "done" ? "check" : "calendar"}>{h.van.status === "done" ? "delivered" : "Tue 6 Oct · from 07:00"}</Badge></div>
            <div className="row wrap" style={{ gap: 20 }}><div className="stack tight" style={{ gap: 0 }}><span className="num m"><Roll value={h.orders.length} /><span className="subtle" style={{ fontSize: "0.45em" }}> / 14</span></span><span className="t-footnote subtle">shops on the round</span></div><div className="stack tight" style={{ gap: 0 }}><span className="num m"><Roll value={units} /></span><span className="t-footnote subtle">packets · {cartons(units)}</span></div></div>
            {h.van.status !== "done" && <Button variant="primary" size="lg" icon="navigation" loading={running} disabled={!all || running} onClick={start}>{all ? "Start the round" : `Waiting for orders · ${h.orders.length} of 14`}</Button>}
            <div className="feed" style={{ gap: 10 }}>
              <div className="row top" style={{ gap: 10 }}><Mark size={28} /><div className="t-subhead" style={{ padding: "9px 12px", borderRadius: 16, borderTopLeftRadius: 6, background: "var(--fill-2)" }}>Van route updated: 14 shops, 24½ cartons on the Tuesday round. The ExpireSoon lot goes to Hyderabad once the balance lands.<div className="t-caption subtle">Outreach agent · Mon 18:02</div></div></div>
              <div className="row top" style={{ gap: 10, justifyContent: "flex-end" }}><div className="t-subhead" style={{ padding: "9px 12px", borderRadius: 16, borderTopRightRadius: 6, background: "var(--primary)", color: "var(--primary-fg)" }}>Theek hai. Mangalvaar subah nikal jaunga.<div className="t-caption" style={{ opacity: 0.8 }}>Rakesh bhai · Mon 18:04</div></div><Avatar person={D.PEOPLE.rakesh} size="sm" /></div>
            </div>
          </Card>
        </>}
        side={<>
          <Card className="stack snug">
            <div className="card-head"><span className="row tight"><span className="icontile violet"><Icon name="package" size={17} stroke={2} /></span><span className="card-title">Hyderabad lot</span></span><Badge tone={h.truck.status === "dispatched" ? "blue" : h.award ? "green" : "violet"}>{h.truck.status === "dispatched" ? "dispatched" : h.award ? "sold" : h.listing ? "listed" : "not listed"}</Badge></div>
            <HaulLine progress={h.truck.status === "dispatched" ? (h.phase === "cleared" || h.phase === "settled" ? 1 : 0.55) : 0} />
            <List>{[["Buyer", h.award ? D.BUYER.name : "—"], ["Units", "772 · 32 cartons + 4"], ["Price", h.award ? `₹${D.COUNTER.price.toFixed(2)} a packet` : "₹15.00 asked"], ["Token", h.award ? fmt.inr(D.AWARD.token) + " received" : "—"], ["Freight", "paid by the buyer"]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>
            {h.truck.status !== "dispatched" && <Button variant="primary" size="lg" icon="truck" disabled={!h.award} onClick={dispatch}>{h.award ? "Dispatch to Hyderabad" : "Dispatch after the award"}</Button>}
          </Card>
          <div className="stack snug"><SectionTitle sub="In the order they were placed">Stops</SectionTitle>
            <div className="list">{stops.map((k, i) => <div key={k.id} className="list-row" style={{ gridTemplateColumns: "28px minmax(0,1fr) auto" }}><span className="center t-caption strong" style={{ width: 24, height: 24, borderRadius: 99, background: k.ordered ? "var(--primary)" : "var(--fill-2)", color: k.ordered ? "var(--primary-fg)" : "var(--fg-3)" }}>{i + 1}</span><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{k.name}</b><span className="t-caption subtle">{k.area}{k.ordered ? ` · ordered ${k.ordered.at}` : " · not yet"}</span></span><span className="tnum strong t-subhead">{k.ordered ? k.units : "—"}</span></div>)}</div>
          </div>
        </>} />
    </Screen>;
  }

  function DistOrders({ me }) {
    const s = useStore(); const h = s.hero; const hero = distOf(me).id === "rakesh";
    if (!hero) return <Screen me={me} title="Orders" sub="Scheme orders and marketplace sales"><Card style={{ maxWidth: 560 }}><Empty img="van" title="No orders yet" body="Kirana orders from offers and marketplace awards for your stock appear here." /></Card></Screen>;
    const rows = h.orders.slice().reverse().map(o => ({ ...o, k: D.KIRANAS.find(k => k.id === o.id) }));
    return <Screen me={me} title="Orders" sub="Scheme orders and marketplace sales">
      <div className="stack" style={{ gap: 16 }}>
        {h.award && <Card className="row wrap" style={{ gap: 14 }}><span className="icontile violet"><Icon name="shopping-bag" size={17} stroke={2} /></span><div className="grow"><b>{D.BUYER.name} · ExpireSoon</b><div className="t-footnote muted">772 × ₹{D.COUNTER.price.toFixed(2)} · token {fmt.inr(D.AWARD.token)} · balance {fmt.inr(D.AWARD.balance)}</div></div><Money value={D.AWARD.gross} size="s" decimals /></Card>}
        {rows.length ? <div className="list">{rows.map(o => <div key={o.id} className="list-row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{o.k.name}</b><span className="t-caption subtle">{o.k.area} · {o.at} · buy 10 get 2</span></span><span className="stack tight" style={{ gap: 0, justifyItems: "end" }}><span className="tnum strong">{o.units} packets</span><span className="t-caption subtle">{cartons(o.units)}</span></span></div>)}</div> : <Card><Empty img="van" title="No scheme orders yet" body="When a kirana taps the offer, the order lands here and joins your next van round." /></Card>}
      </div>
    </Screen>;
  }

  /* ======================= Ganesh ji · kirana ======================= */
  const offerMath = n => { const free = Math.floor(n / 12) * 2, paid = n - free; return { n, free, paid, pay: paid * 18, sell: n * 30, margin: n * 30 - paid * 18, usual: n * 3.75 }; };
  function OfferCard({ onOpen, compact, shop }) {
    const [en, setEn] = useState(false); const p0 = D.PUSH.offer; const name = shop || "Shree Ganesh Kirana";
    const p = Object.assign({}, p0, { body: p0.body.replace("Shree Ganesh Kirana", name) });
    return <div className="bezel"><div className="card raised" style={{ padding: compact ? 16 : 22, display: "grid", gap: 14 }}>
      <div className="row between"><span className="row tight"><Mark size={28} /><span className="t-footnote subtle strong">Rakesh Traders · {p.at}</span></span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setEn(!en)} aria-pressed={en}>{en ? "हिन्दी में पढ़ें" : "Read in English"}</button></div>
      <div className="row" style={{ gap: 14, alignItems: "center" }}><Product name="pack-chips" size={compact ? 76 : 96} float /><div className="stack tight" style={{ gap: 4 }}><div className={cx("t-title2", !en && "hi")} lang={en ? "en" : "hi"}>{en ? "Today's special offer" : p.title}</div><div className="row base" style={{ gap: 8 }}><span className="num m">₹18</span><span className="subtle t-subhead">a packet · MRP ₹30</span></div><span className="row tight wrap"><Badge tone="green" icon="gift">{en ? "Buy 10, get 2 free" : "10 लो, 2 मुफ़्त"}</Badge><Badge icon="clock">{en ? "48 hours" : "सिर्फ़ 48 घंटे"}</Badge></span></div></div>
      <p className={cx("t-body", !en && "hi")} lang={en ? "en" : "hi"} style={{ margin: 0, lineHeight: 1.55 }}>{en ? p.en : p.body}</p>
      {onOpen && <Button variant="primary" size="lg" block iconRight="arrow-right" onClick={onOpen}>{en ? "See the offer" : "ऑफर देखें"}</Button>}
    </div></div>;
  }
  function RetailHome({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const k = kOf(me); const mine = h.orders.find(o => o.id === k.id);
    return <Screen me={me} title="Offers" sub={`${k.name} · ${k.area}, Nagpur`}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {h.offer ? (mine ? <Card className="stack snug"><div className="row" style={{ gap: 14 }}><Product name="pack-chips" size={64} /><div className="grow"><b>Ordered · {mine.units} packets</b><div className="t-footnote muted">Masala Chips 150 g · placed {mine.at} · comes on Tuesday's van</div></div><Badge tone="green" icon="check">confirmed</Badge></div></Card> : <OfferCard shop={k.name} onOpen={() => go("offer")} />)
          : <Card><Empty img="kirana" title="No offers today" body="Rakesh Traders' schemes arrive here as a notification, in Hindi, ready to order in one tap." /></Card>}
        <SectionTitle>Your shop</SectionTitle>
        <List>{[["Distributor", "Rakesh Traders, Nagpur"], ["Van day", "Tuesday"], ["Language", "हिन्दी · English"]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>
      </div>
    </Screen>;
  }
  function OfferDetail({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const k = kOf(me); const [n, setN] = useState(k.units); const [busy, setBusy] = useState(false); const m = offerMath(n);
    const mine = h.orders.find(o => o.id === k.id);
    const order = () => { setBusy(true); setTimeout(() => { setBusy(false); Store.update(st => { Flow.A.order(st, k.id); const o = st.hero.orders.find(x => x.id === k.id); if (o) o.units = n; }); }, 650); };
    return <Screen me={me} title="Masala Chips 150 g" sub="Rakesh Traders · scheme for 48 hours" back="Offers">
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {h.offer ? <OfferCard compact shop={k.name} /> : <Card><Empty img="kirana" title="No offer right now" body="This offer has not been sent to your shop yet." /></Card>}
        {!h.offer ? null : mine ? <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card stack" style={{ padding: 22, justifyItems: "center", textAlign: "center" }}>
          <span className="icontile" style={{ width: 56, height: 56, borderRadius: 18 }}><Icon name="check" size={28} stroke={2.4} /></span>
          <div className="t-title2 hi" lang="hi">ऑर्डर हो गया</div>
          <span className="muted">{mine.units} packets on Tuesday's van · pay on delivery</span>
          <Money value={offerMath(mine.units).margin} size="m" style={{ color: "var(--primary-text)" }} /><span className="t-footnote subtle">your margin at MRP on this order</span>
          <Button variant="secondary" onClick={() => go("home")}>Done</Button>
        </motion.div> : <Card className="stack" style={{ gap: 16 }}>
          <div className="row between"><div className="stack tight" style={{ gap: 0 }}><b>How many packets?</b><span className="t-footnote subtle">In twelves · your share is up to {k.units}</span></div><Stepper value={n} onChange={setN} min={12} max={k.units} step={12} label="Packets" /></div>
          <div className="stack tight">{[["You pay", `${m.paid} × ₹18`, fmt.inr(m.pay)], ["Free packets", `buy 10 get 2`, `${m.free}`], ["You sell at MRP", `${n} × ₹30`, fmt.inr(m.sell)]].map(([k, sub, v]) => <div key={k} className="row between t-subhead"><span>{k} <span className="subtle t-footnote">{sub}</span></span><span className="tnum strong">{v}</span></div>)}</div>
          <div className="row between" style={{ padding: "12px 14px", borderRadius: 14, background: "var(--primary-soft)" }}><span className="stack tight" style={{ gap: 0 }}><b>Margin today</b><span className="t-footnote muted">usually {fmt.inr(m.usual)} on {n} packets</span></span><Money value={m.margin} size="s" roll style={{ color: "var(--primary-text)" }} /></div>
          <Button variant="primary" size="xl" block loading={busy} onClick={order}><span className="hi" lang="hi">ऑर्डर करें</span> · {n} packets</Button>
          <span className="t-caption subtle" style={{ textAlign: "center" }}>Best before 18 Nov 2026 · 47 days on every packet</span>
        </Card>}
      </div>
    </Screen>;
  }
  function RetailOrders({ me }) {
    const s = useStore(); const k = kOf(me); const mine = s.hero.orders.find(o => o.id === k.id);
    return <Screen me={me} title="Orders" sub={k.name}>
      {mine ? <div className="list" style={{ maxWidth: 620 }}><div className="list-row" style={{ gridTemplateColumns: "48px minmax(0,1fr) auto" }}><Product name="pack-chips" size={44} /><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">Masala Chips 150 g · {mine.units} packets</b><span className="t-caption subtle">{mine.at} · buy 10 get 2 · Tuesday's van</span></span><Badge size="sm" tone={s.hero.van.status === "done" ? "green" : undefined}>{s.hero.van.status === "done" ? "delivered" : "on the round"}</Badge></div></div> : <Card style={{ maxWidth: 620 }}><Empty icon="shopping-basket" title="No orders yet" body="Orders you place from an offer show here with the van day." /></Card>}
    </Screen>;
  }

  /* ======================= Venkat · ExpireSoon (another company's marketplace) ======================= */
  const OTHER_LISTINGS = [
    { id: "ES-23988", name: "Cream biscuits 75 g", icon: "cookie", units: 2400, price: 6, mrp: 10, days: 88, seller: "FMCG distributor, Secunderabad" },
    { id: "ES-24031", name: "Instant noodles 70 g", icon: "soup", units: 1800, price: 8, mrp: 14, days: 41, seller: "Wholesaler, Vijayawada" },
    { id: "ES-24076", name: "UHT toned milk 1 L", icon: "milk", units: 600, price: 38, mrp: 72, days: 34, seller: "Dairy distributor, Warangal" },
    { id: "ES-24102", name: "Whole-wheat atta 5 kg", icon: "wheat", units: 240, price: 160, mrp: 285, days: 52, seller: "Mill outlet, Nizamabad" },
  ];
  function EsBar({ me, title }) {
    const { go } = useRoute();
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
    const hero = h.listing && { id: "ES-24117", name: "Munchly Masala Chips 150 g", units: 772, price: 15, mrp: 30, days: 47, seller: "Rakesh Traders, Nagpur" };
    const list = [hero, ...OTHER_LISTINGS].filter(Boolean).filter(l => (!q || l.name.toLowerCase().includes(q.toLowerCase())) && (cat === "all" || (cat === "snacks" ? /chips|biscuit|noodle/i.test(l.name) : cat === "staples" ? /atta|milk/i.test(l.name) : true)));
    return <div className="esw"><Screen me={me} title="Marketplace" sub="Lots near Hyderabad · every listing shows its dates" hideLarge={false}>
      <div className="stack" style={{ gap: 16 }}>
        <EsBar />
        <div className="row wrap" style={{ gap: 10 }}><div className="grow" style={{ minWidth: 200 }}><K.SearchField value={q} onChange={setQ} placeholder="Search lots" /></div><K.Segmented options={[{ id: "all", label: "All" }, { id: "snacks", label: "Snacks" }, { id: "staples", label: "Staples" }]} value={cat} onChange={setCat} label="Category" /></div>
        {hero && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="es-feature" onClick={() => go("listing")} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && go("listing")}>
          <Product name="pack-chips" size={app.bp === "phone" ? 96 : 132} float />
          <div className="stack tight grow" style={{ gap: 6 }}><span className="row tight wrap"><Badge tone="violet" solid size="sm">new · {h.listing.at}</Badge><Badge size="sm" tone="violet" icon="badge-check">label photo verified</Badge></span><div className="t-title2">Munchly Masala Chips 150 g · 772 units</div><span className="row base wrap" style={{ gap: 8 }}><span className="es-price lg">₹15</span><span className="muted">MRP ₹30 · 50% off</span><EsDate days={47} date="Best before 18 Nov 2026" /></span><span className="t-footnote subtle">Rakesh Traders, Nagpur · verified seller · dispatch 24 h after balance</span></div>
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
    const token = Math.round(price * 772 * 0.15 * 100) / 100;
    const place = () => Flow.act("bid", price);
    const accept = () => Flow.act("accept");
    const hasListing = !!h.listing;
    if (!hasListing) return <Card><Empty icon="hourglass" title="Not listed yet" body="The Lister posts this lot the moment the plan is approved." /></Card>;
    return <div style={{ display: "grid", gap: 16, gridTemplateColumns: app.bp === "desktop" && !readOnly ? "minmax(0, 1.2fr) minmax(0, 1fr)" : "minmax(0,1fr)", alignItems: "start" }}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="es-gallery"><div className="es-thumb big"><Product name="pack-chips" size={app.bp === "phone" ? 150 : 190} float /></div><div className="es-thumb big" style={{ padding: 0, overflow: "hidden", containerType: "inline-size" }}><S.LabelPhoto status="verified" /></div></div>
        <div className="stack tight"><div className="t-title2">Munchly Masala Chips 150 g · 772 units</div><span className="row base wrap" style={{ gap: 8 }}><span className="es-price lg">₹15</span><span className="muted">a packet · MRP ₹30 · 50% off</span></span><span className="row tight wrap"><EsDate days={47} date="Best before 18 Nov 2026" /><Badge size="sm" tone="violet" icon="badge-check">label photo verified</Badge></span></div>
        <List>{[["Seller", "Rakesh Traders, Nagpur · verified"], ["Dispatch", "24 h after the balance · buyer pays freight"], ["Lot", "32 cartons + 4 · 24 × 150 g a carton"], ["Minimum order", "100 units"], ["Listing", h.listing.id]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>
      </div>
      <div className="stack" style={{ gap: 16 }}>
        {!readOnly && (h.award ? <Card className="stack snug"><div className="row" style={{ gap: 12 }}><span className="icontile violet" style={{ width: 44, height: 44, borderRadius: 14 }}><Icon name="badge-check" size={22} /></span><div className="grow"><b>Lot won at ₹{D.COUNTER.price.toFixed(2)}</b><div className="t-footnote muted">Token {fmt.inr(D.AWARD.token)} paid · balance {fmt.inr(D.AWARD.balance)} due in 48 h</div></div></div><List>{[["772 × ₹14.20", fmt.inr2(D.AWARD.gross)], ["IGST 12%", fmt.inr2(1315.49)], ["Invoice total", fmt.inr2(12277.89)]].map(([k, v]) => <ListRow key={k} title={k} value={<span className="tnum strong">{v}</span>} />)}</List></Card>
          : open ? <Card className="stack snug">
            <div className="card-head"><span className="card-title">Place a bid</span><span className="t-caption subtle">ask ₹15.00</span></div>
            <div className="row between"><span className="stack tight" style={{ gap: 0 }}><b>Your price a packet</b><span className="t-footnote subtle">for all 772 units</span></span><Stepper value={price} onChange={setPrice} min={10} max={14} step={0.5} label="Bid price" format={v => "₹" + v.toFixed(2)} /></div>
            <div className="row between t-subhead"><span>15% token on your bid</span><span className="tnum strong">{fmt.inr2(token)}</span></div>
            <Button variant="violet" size="lg" block icon="gavel" onClick={place}>Bid ₹{price.toFixed(2)} for 772</Button>
            <span className="t-caption subtle">Balance in 48 h. The seller's agent replies in about a minute.</span>
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
  function Listing({ me }) { return <div className="esw"><Screen me={me} title="Lot ES-24117" sub="Munchly Masala Chips 150 g · Rakesh Traders, Nagpur" back="Marketplace"><div className="stack" style={{ gap: 16 }}><EsBar /><ListingView me={me} /></div></Screen></div>; }
  function MyBids({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute();
    return <div className="esw"><Screen me={me} title="My bids" sub="Sri Venkateswara Traders · Hyderabad"><div className="stack" style={{ gap: 16 }}><EsBar />
      {h.bids.length ? <div className="list" data-x="bids">{h.bids.map(b => <button type="button" key={b.id} className="list-row" onClick={() => go("listing")} style={{ gridTemplateColumns: "48px minmax(0,1fr) auto", textAlign: "left", width: "100%" }}><Product name="pack-chips" size={44} /><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">ES-24117 · Masala Chips 150 g · 772 units</b><span className="t-caption subtle">bid ₹{b.price.toFixed(2)} · {b.at}{b.counter ? ` · counter ₹${b.counter.toFixed(2)}` : ""}</span></span><Badge size="sm" tone={b.status === "accepted" ? "green" : "violet"}>{b.status === "accepted" ? "won" : b.status}</Badge></button>)}</div> : <Card><Empty img="marketplace-bag" title="No bids yet" body="Bids you place show here with the seller's reply." /></Card>}
    </div></Screen></div>;
  }

  /* ======================= Meera · Feeding India ======================= */
  function Pickups({ me }) {
    const s = useStore(); const d = s.mango.donation; const app = useApp(); const [later, setLater] = useState(false); const { toast } = useNotice();
    return <Screen me={me} title="Pickups" sub="Feeding India · Hyderabad">
      {!d ? <Card style={{ maxWidth: 640 }}><Empty img="donation-crate" title="No pickup requests" body="Brands' donation agents send surplus food here when it fits your intake rules: 15+ days left, 50+ units." /></Card> :
      <Columns sideWidth={340}
        main={<>
          <div className="bezel"><div className="card raised stack" style={{ padding: 22, gap: 16 }}>
            <div className="row tight"><Mark size={28} /><span className="t-footnote subtle strong">Donation agent · Munchly Foods · Day 0</span></div>
            <div className="row" style={{ gap: 16 }}><Product name="pack-mango" size={app.bp === "phone" ? 80 : 104} float /><div className="stack tight" style={{ gap: 4 }}><div className="t-title2">58 packs of Mango Drink</div><span className="row tight wrap"><Badge icon="calendar">22 days left</Badge><Badge icon="map-pin">Begum Bazaar</Badge><Badge tone="green" icon="clipboard-check">FSSAI checklist</Badge></span></div></div>
            <p className="t-body" style={{ margin: 0 }}>58 packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup Tuesday 10 am from Begum Bazaar?</p>
            {d === "booked" ? <div className="row wrap" style={{ gap: 10 }}><Button variant="primary" size="lg" icon="check" onClick={() => Flow.act("confirmPickup")}>Confirm Tuesday 10:00</Button><Button variant="secondary" size="lg" onClick={() => setLater(true)}>Suggest another time</Button></div>
              : <div className="row top" style={{ gap: 10, justifyContent: "flex-end" }}><div className="t-subhead" style={{ padding: "9px 12px", borderRadius: 16, borderTopRightRadius: 6, background: "var(--primary)", color: "var(--primary-fg)", maxWidth: "85%" }}>Tuesday works. We'll serve them at the Charminar hunger spot this week.<div className="t-caption" style={{ opacity: 0.8 }}>Meera · Day 1</div></div><Avatar person={D.PEOPLE.meera} size="sm" /></div>}
          </div></div>
          {d !== "booked" && <Card className="stack snug"><div className="card-head"><span className="card-title">Pickup</span><Badge tone="green" icon={d === "collected" ? "check" : "calendar"}>{d === "collected" ? "collected" : "Tue 6 Oct · 10:00"}</Badge></div>
            <K.VTracker items={[{ id: "req", title: "Requested by the donation agent", time: "Day 0" }, { id: "conf", title: "Confirmed by Meera", time: "Day 1" }, { id: "col", title: "Collected from Begum Bazaar", time: d === "collected" ? "Day 4" : "Tue 10:00" }, { id: "serve", title: "Served at the Charminar hunger spot", time: "this week" }]} done={d === "collected" ? 3 : 2} current={d === "collected" ? 3 : 2} />
            {d === "confirmed" && <Button variant="primary" size="lg" icon="package-check" onClick={() => { Flow.act("collect"); toast({ text: "Receipt issued · 58 drinks", tone: "ok" }); }}>Mark collected</Button>}
            {d === "collected" && <div className="row" style={{ gap: 12, padding: "12px 14px", borderRadius: 14, background: "var(--primary-soft)" }}><Icon name="receipt" size={20} /><span className="grow"><b>In-app receipt issued</b><div className="t-footnote muted">58 drinks served · shared with Munchly for its BRSR table</div></span></div>}
          </Card>}
        </>}
        side={<><SectionTitle>FSSAI surplus-food checklist</SectionTitle><Card className="paper stack tight" style={{ padding: 18 }}>{["Sealed, undamaged packs", "Best before 24 Oct 2026, 22 days left", "Ambient storage, away from sunlight", "Batch MF-2410-118 on every carton", "Donor: Munchly Foods via Lakshmi Agencies"].map(t => <div key={t} className="row top" style={{ gap: 8 }}><Icon name="square-check" size={17} style={{ color: "#167a52", marginTop: 1 }} /><span className="t-subhead">{t}</span></div>)}</Card>
          <List head="Your intake rules"><ListRow title="Days left" value="15 or more" /><ListRow title="Minimum lot" value="50 units" /><ListRow title="Logistics" value="volunteer pickup in 48 h" /></List></>} />}
      <Sheet open={later} onClose={() => setLater(false)} title="Suggest another time" detent="medium" footer={<Button variant="primary" block onClick={() => { setLater(false); toast({ text: "Sent · the agent will confirm with Lakshmi Agencies" }); }}>Send</Button>}><div className="stack snug">{["Wednesday 10:00", "Wednesday 16:00", "Thursday 11:00"].map(t => <label key={t} className="list-row" style={{ gridTemplateColumns: "auto 1fr", cursor: "pointer" }}><input type="radio" name="slot" defaultChecked={t.startsWith("Wednesday 10")} /> {t}</label>)}</div></Sheet>
    </Screen>;
  }

  Object.assign(window.SC3_SCREENS, { distOf, kOf, DistHome, CameraScreen, VanRoute, DistOrders, OfferCard, RetailHome, OfferDetail, RetailOrders, Market, Listing, ListingView, MyBids, Pickups, EsBar, offerMath, cartons });
})();

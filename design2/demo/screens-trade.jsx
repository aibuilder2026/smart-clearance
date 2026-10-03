// Smart-Clearance demo v2 · trade-side screens: distributor (home, photo, van, orders), retailer (offer, orders), ExpireSoon buyer (listing, bids)
(function () {
  const { useState, useEffect } = React;
  const { motion, AnimatePresence } = Motion;
  const D = window.SC_DATA; const K = window.SC2;
  const { Icon, Avatar, Mark, Btn, Chip, Plate, CountUp, TopBar, RunHead, Stepper, Field, Input, Empty, LiveTile, Emblem, ModeSwitch, usePhone, inr, num, inrDec, cx } = K;
  const { ChatThread, HERO } = window.SC_DEMO;
  const P = D.people;
  const mine = D.batches.filter(b => b.where.startsWith("Rakesh"));

  // ---------- distributor ----------
  function DistHome({ s, a }) {
    const phone = usePhone();
    const askCard = s.photo === "requested" ? <Plate tone="ultra" framed className="stack register"><div className="row"><Mark size="sm" sun={false} /><b>Smart-Clearance · 09:05</b></div><p className="hi" style={{ fontSize: 18 }}>{D.strings.photoHindi}</p><Btn kind="yes" size="lg" icon="camera" onClick={() => a.go("photo")}>Take the photo</Btn></Plate> : null;
    return <>
      <TopBar who={P.rakesh} sub="Rakesh Traders · Kalamna Market, Nagpur" runhead={<RunHead parts={[{ b: "Godown" }, { b: String(mine.length), t: "batches" }, { b: HERO.id, t: s.stage < 7 ? "needs you" : "moving", hot: s.stage < 7 }]} />} unread={s.unread} onBell={() => a.go("inbox")} />
      <div className="page trade">
        <h1>Namaste, Rakesh bhai</h1>
        {askCard}
        {s.stage >= 2 && s.stage < 4 ? <Plate tone="emerald-soft"><div className="row"><Icon name="check" /><div><b>Photo sent 09:19, verified 09:20</b><p className="t-small muted">Priya is deciding. You will get the van route once she approves.</p></div></div></Plate> : null}
        {s.stage >= 4 ? <Plate className="stack-sm register"><div className="row between"><b>Tuesday round updated</b><Chip tone={s.stage >= 7 ? "emerald" : "chrome"} icon={s.stage >= 7 ? "check" : "truck"}>{s.stage >= 7 ? "done" : "14 drops · 24½ cartons"}</Chip></div><p className="t-small muted">Hyderabad lot (32 cartons + 4) goes on the truck once Venkat's balance lands.</p><Btn kind="primary" icon="truck" onClick={() => a.go("route")}>Open the van route</Btn></Plate> : null}
        <Plate className="godown stack-sm"><h3>My godown</h3>{mine.map(b => { const p = D.products[b.sku]; const hot = b.hero && s.stage < 7; return <div key={b.id} className="row between"><div><b>{p.name}</b><div className="t-xs muted mono">{b.id} · {b.cartons} cartons</div></div><Chip tone={hot ? "vermilion" : b.hero ? "ultra" : "emerald"} icon="clock">{b.days} d</Chip></div>; })}</Plate>
        {s.stage >= 5 ? <Plate className="row between"><div><b>{s.orders} shop orders</b><div className="t-small muted">{num(D.shops.slice(0, s.orders).reduce((t, o) => t + o.packets, 0))} packets from the scheme</div></div><Btn kind="ghost" size="sm" onClick={() => a.go("orders")}>See orders <Icon name="right" size={16} /></Btn></Plate> : null}
      </div>
    </>;
  }
  function PhotoFlow({ s, a }) {
    const [phase, setPhase] = useState("view");
    const shoot = () => { setPhase("flash"); setTimeout(() => setPhase("reading"), 350); setTimeout(() => setPhase("result"), 2300); };
    if (s.photo === "taken") return <><TopBar back="Home" onBack={() => a.go("home")} /><div className="page trade"><h1>Label photo sent</h1><Plate className="labelcard"><div className="photo"><img className="real" src={D.CARTON_PHOTO} alt="Carton label photo" /><span className="ver"><Chip tone="emerald" solid icon="check">Verified 09:20</Chip></span></div><div className="stack-sm"><p className="t-small muted">Gemini read the batch, both dates and the MRP straight off the pack. Priya has the plan now.</p><Btn icon="external" onClick={() => a.nav("brand", "batch", HERO.id)}>Open Priya's Route Room</Btn></div></Plate></div></>;
    if (s.photo !== "requested") return <><TopBar back="Home" onBack={() => a.go("home")} /><div className="page trade"><h1>Photo</h1><Plate><Empty icon="camera" title="No photo requested yet" body="Requests arrive as a push when the agent needs the truth from the shelf." /></Plate></div></>;
    return <div className="cam">
      <div className="camtop"><button type="button" className="btn ghost sm" style={{ color: "#fff" }} onClick={() => a.go("home")}>Cancel</button><span className="mono t-xs">{HERO.id} · carton label</span><span style={{ width: 60 }} /></div>
      <div className="vf"><img src={D.CARTON_PHOTO} alt="" />
        {phase === "view" || phase === "flash" ? <div className="frame" aria-hidden="true" /> : null}
        <AnimatePresence>{phase === "flash" ? <motion.div key="flash" className="flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.95, 0] }} transition={{ duration: 0.5 }} /> : null}</AnimatePresence>
        {phase === "reading" ? <motion.div className="scanline" initial={{ top: "14%" }} animate={{ top: ["14%", "86%", "14%"] }} transition={{ duration: 1.8, ease: "linear" }} /> : null}
        {phase === "view" ? <div className="hint">Fill the frame with the label on one carton</div> : null}
        {phase === "reading" ? <div className="hint"><span className="row" style={{ justifyContent: "center" }}><span className="spinner" style={{ width: 14, height: 14 }} />Gemini is reading the label…</span></div> : null}
        <AnimatePresence>{phase === "result" ? <motion.div key="res" className="result" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}><Plate className="stack-sm"><div className="row between"><b>Read in 1.2 s</b><Chip tone="emerald" solid icon="check">confidence 0.97</Chip></div><dl className="kv">{[["Batch", HERO.id], ["Best before", HERO.bestBefore], ["MRP", "₹30.00 · 24 × 150 g"], ["Records", "match"]].map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl><Btn kind="yes" size="lg" icon="send" onClick={() => a.takePhoto()}>Send to Priya</Btn></Plate></motion.div> : null}</AnimatePresence>
      </div>
      <div className="shutterbar">{phase === "view" ? <button type="button" className="shutter" onClick={shoot} aria-label="Take photo"><i /></button> : phase === "result" ? <Btn onClick={() => setPhase("view")}>Retake</Btn> : <span className="t-small" aria-live="polite">{phase === "flash" ? "Captured" : "Reading…"}</span>}</div>
    </div>;
  }
  function VanRoute({ s, a }) {
    const [done, setDone] = useState(s.stage >= 7 ? 14 : 0); const [running, setRunning] = useState(false);
    useEffect(() => { if (!running) return; if (done >= 14) { setRunning(false); return; } const t = setTimeout(() => setDone(d => d + 1), 320); return () => clearTimeout(t); }, [running, done]);
    const packets = D.shops.reduce((t, o) => t + o.packets, 0);
    return <>
      <TopBar who={P.rakesh} sub={s.stage >= 4 ? "Tuesday round · 14 drops · 24½ cartons" : "no route yet"} runhead={<RunHead parts={[{ b: "Tuesday round" }, { b: String(done), t: "of 14 drops" }, { b: num(packets), t: "packets" }]} />} unread={s.unread} onBell={() => a.go("inbox")} />
      <div className="page trade">
        <h1>Van route</h1>
        {s.stage < 4 ? <Plate><Empty emblem={D.IMG + "emblem-van.webp"} title="No round planned" body="Drops appear here once Priya approves a plan. The van keeps its normal round." /></Plate> : <>
          <Plate className="row wrap"><div className="grow"><b>{done} of 14 drops done</b><div className="t-small muted">{num(packets)} packets on board · one or two cartons a shop</div></div>{done < 14 && s.stage < 7 ? <Btn kind="primary" icon="truck" loading={running} onClick={() => setRunning(true)}>{done ? "Resume" : "Start the round"}</Btn> : null}{done >= 14 && s.stage < 7 ? (s.bid === "accepted" ? <Btn kind="yes" icon="box" onClick={() => a.dispatch()}>Dispatch Hyderabad lot · 32 cartons + 4</Btn> : <Chip tone="chrome" icon="clock">Hyderabad lot waits for Venkat's balance</Chip>) : null}{s.stage >= 7 ? <Chip tone="emerald" solid icon="check">Round done · truck left Thursday 11:30</Chip> : null}</Plate>
          <div className="progress"><i style={{ width: (done / 14 * 100) + "%" }} /></div>
          <Plate><div className="route">{D.shops.map((o, i) => <div key={o.id} className={cx("stop", i < done && "done")}><i>{i < done ? <Icon name="check" size={14} /> : i + 1}</i><div><div className="sn">{o.name}</div><div className="sa">{o.area}</div></div><b>{o.packets}</b></div>)}</div></Plate>
        </>}
      </div>
    </>;
  }
  function DistOrders({ s, a }) {
    const orders = D.shops.slice(0, s.orders);
    return <><TopBar who={P.rakesh} sub="Masala Chips scheme · 48 hours" runhead={<RunHead parts={[{ b: "Orders" }, { b: String(orders.length), t: "shops" }, { b: num(orders.reduce((t, o) => t + o.packets, 0)), t: "packets" }]} />} unread={s.unread} onBell={() => a.go("inbox")} /><div className="page trade"><h1>Retailer orders</h1>{!orders.length ? <Plate><Empty emblem={D.IMG + "emblem-shop.webp"} title="No orders yet" body="Shops get the scheme as a push once Priya approves." /></Plate> : <Plate><div className="row between" style={{ marginBottom: 8 }}><b>{orders.length} orders · {num(orders.reduce((t, o) => t + o.packets, 0))} packets</b><Chip tone="emerald">₹18 a packet · scheme credited</Chip></div><div className="orders">{orders.map(o => <div key={o.id} className="or"><span>{o.name} <small>{o.area}</small></span><b>{o.packets}</b><small>{o.at}</small></div>)}</div></Plate>}</div></>;
  }

  // ---------- retailer ----------
  function RetailOffers({ s, a }) {
    const [qty, setQty] = useState(24); const [busy, setBusy] = useState(false); const phone = usePhone();
    const place = () => { setBusy(true); setTimeout(() => { setBusy(false); a.orderPlaced(qty); }, 900); };
    const pay = q => q / 12 * 10 * 18, margin = q => q * 30 - pay(q);
    const offer = s.stage < 5 ? <Plate><Empty emblem={D.IMG + "emblem-shop.webp"} title="आज कोई ऑफर नहीं" body="ऑफर आते ही यहाँ और नोटिफिकेशन में दिखेगा." /></Plate>
      : s.retailOrder ? <Plate className="offer stack register"><div className="row between"><Mark size="sm" sun={false} /><Chip tone="emerald" solid icon="check">ऑर्डर हो गया · {s.retailOrder.at}</Chip></div><div className="obig">{s.retailOrder.qty} पैकेट · {inr(pay(s.retailOrder.qty))}</div><p className="hi">राकेश भाई की वैन मंगलवार को लाएगी. {s.stage >= 7 ? "डिलीवर हो गया." : "पैसा डिलीवरी पर."}</p><div className="ledger"><div className="lrow"><span className="hi">आप बेचेंगे {s.retailOrder.qty} × ₹30</span><span className="v">{inr(s.retailOrder.qty * 30)}</span></div><div className="lrow pos sum"><span className="hi">आपका मार्जिन</span><span className="v">{inr(margin(s.retailOrder.qty))}</span></div></div><Btn kind="ghost" onClick={() => a.go("myorders")}>मेरे ऑर्डर <Icon name="right" size={16} /></Btn></Plate>
      : <Plate className="offer stack register">
          <div className="row between"><div className="row"><Mark size="sm" sun={false} /><span className="t-xs muted mono">09:41 · Munchly Foods</span></div><Chip tone="chrome" solid icon="clock">48 घंटे</Chip></div>
          <img src={D.products.chips.plate} alt="" style={{ width: 110, justifySelf: "center" }} />
          <div className="obig">Munchly Masala Chips 150 g · 10 पैकेट लो, 2 मुफ़्त</div>
          <div className="scheme"><div><b>₹18</b><span>प्रति पैकेट</span></div><div><b>+2</b><span>हर 10 पर मुफ़्त</span></div><div><b>₹30</b><span>MRP · 18 नवंबर तक</span></div></div>
          <Field label={<span className="hi">कितने पैकेट?</span>} help={<span className="hi">{qty / 24} कार्टन · आप देंगे {inr(pay(qty))} · मार्जिन {inr(margin(qty))}</span>}><Stepper value={qty} onChange={setQty} min={12} max={120} step={12} label="packets" /></Field>
          <Btn kind="yes" size="lg" full icon="check" loading={busy} onClick={place}><span className="hi">ऑर्डर करें</span> · {qty} packets</Btn>
          <p className="t-xs muted hi">डिलीवरी मंगलवार, राकेश ट्रेडर्स की वैन · पैसा डिलीवरी पर</p>
        </Plate>;
    return <>
      <TopBar who={P.ganesh} sub="Shree Ganesh Kirana · Itwari, Nagpur" runhead={<RunHead parts={[{ b: "आज के ऑफर" }, { b: s.stage >= 5 ? "1" : "0", t: "offer" }, s.retailOrder ? { b: String(s.retailOrder.qty), t: "packets ordered" } : { b: "48 h", t: "window" }]} />} unread={s.unread} onBell={() => a.go("inbox")} />
      <div className="page trade"><h1 className="hi" style={{ fontFamily: "var(--font-hi)", fontWeight: 800 }}>आज के ऑफर</h1>{offer}</div>
    </>;
  }
  function RetailOrders({ s, a }) {
    return <><TopBar who={P.ganesh} sub="Shree Ganesh Kirana" unread={s.unread} onBell={() => a.go("inbox")} /><div className="page trade"><h1 className="hi" style={{ fontFamily: "var(--font-hi)", fontWeight: 800 }}>मेरे ऑर्डर</h1>{!s.retailOrder ? <Plate><Empty icon="store" title="अभी कोई ऑर्डर नहीं" /></Plate> : <Plate className="row between"><div><b>Masala Chips 150 g · {s.retailOrder.qty} पैकेट</b><div className="t-small muted">{s.retailOrder.at} · {inr(s.retailOrder.qty / 12 * 10 * 18)}</div></div><Chip tone={s.stage >= 7 ? "emerald" : "chrome"} icon={s.stage >= 7 ? "check" : "truck"}>{s.stage >= 7 ? "डिलीवर हो गया" : "मंगलवार को वैन से"}</Chip></Plate>}</div></>;
  }

  // ---------- ExpireSoon buyer ----------
  function ESTop({ sub }) { return <div className="es-top"><span className="esword">EXPIRESOON</span><span>{sub}</span><div className="grow" /><ModeSwitch /><Avatar person={P.venkat} size="md" /></div>; }
  function BuyerListing({ s, a }) {
    const [bid, setBid] = useState(13); const [busy, setBusy] = useState(false);
    const place = () => { setBusy(true); setTimeout(() => { setBusy(false); a.placeBid(bid); }, 700); };
    return <div style={{ minHeight: "100%" }}>
      <ESTop sub="clearance marketplace · mocked for the prototype" />
      <div className="page">
        {s.stage < 5 ? <Plate><Empty emblem={D.IMG + "emblem-ship.webp"} title="No live listings for Munchly today" body="Listings appear here the moment a plan is approved." /></Plate> : <div className="es-listing">
          <div className="stack-sm"><div className="ph"><img src={D.CARTON_PHOTO} alt="Carton of Masala Chips, label photo verified" /></div><div className="row wrap"><Chip tone="emerald" icon="check">label photo verified</Chip><Chip icon="clock">best before {HERO.bestBefore} · {HERO.days} days</Chip><Chip icon="pin">Nagpur · dispatch 24 h after balance</Chip></div></div>
          <div className="stack">
            <div><h1 style={{ fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: 24 }}>Munchly Masala Chips 150 g</h1><p className="muted t-small">772 packets · 32 cartons + 4 · batch {HERO.id} · seller Rakesh Traders via Smart-Clearance</p></div>
            <div className="es-price">{inr(15)}<small style={{ fontSize: 16, fontFamily: "var(--font-ui)", fontWeight: 400, color: "var(--ink-2)" }}> / packet</small><s>MRP ₹30</s></div>
            {s.bid === "accepted" ? <Plate className="stack-sm"><Chip tone="emerald" solid icon="check">Order ES-88213 · awarded at ₹14.20</Chip><div className="ledger"><div className="lrow"><span>772 × ₹14.20</span><span className="v">{inr(D.plan.actualOnline.gross)}</span></div><div className="lrow pos"><span>Token paid (15%)</span><span className="v">{inr(D.plan.actualOnline.token)}</span></div><div className="lrow sum"><span>Balance before dispatch</span><span className="v">{inr(D.plan.actualOnline.balance)}</span></div></div><p className="t-small muted">You resell to Hyderabad kiranas at ₹20 to ₹22, with six weeks on the label.</p></Plate> : <Plate className="stack-sm">
              <Field label="Your bid per packet" help="For all 772 packets · 15% token on acceptance" id="bid"><Input id="bid" mono type="number" inputMode="decimal" step="0.1" min="10" max="15" value={bid} onChange={e => setBid(parseFloat(e.target.value) || 0)} disabled={s.bid !== "none"} /></Field>
              {s.bid === "none" ? <Btn kind="market" size="lg" full icon="tag" loading={busy} onClick={place}>Place bid · {inrDec(bid)}</Btn> : null}
              <ChatThread s={s} />
              {s.bid === "countered" ? <Btn kind="market" size="lg" full icon="check" onClick={() => a.acceptCounter()}>Accept ₹14.20 · pay token {inr(1644)}</Btn> : null}
            </Plate>}
          </div>
        </div>}
      </div>
    </div>;
  }
  function BuyerBids({ s, a }) {
    return <div style={{ minHeight: "100%" }}><ESTop sub="my bids" /><div className="page"><h1 style={{ fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: 24 }}>My bids</h1>{s.bid === "none" ? <Plate><Empty icon="tag" title="No bids yet" /></Plate> : <Plate className="stack-sm"><div className="row between"><b>Munchly Masala Chips 150 g · 772</b><Chip tone={s.bid === "accepted" ? "emerald" : "violet"} solid>{s.bid === "accepted" ? "awarded · ₹14.20" : s.bid === "countered" ? "countered · ₹14.20" : "bid · ₹13"}</Chip></div><ChatThread s={s} />{s.bid === "countered" ? <Btn kind="market" icon="check" onClick={() => a.acceptCounter()}>Accept ₹14.20</Btn> : null}</Plate>}</div></div>;
  }

  Object.assign(window.SC_DEMO, { DistHome, PhotoFlow, VanRoute, DistOrders, RetailOffers, RetailOrders, BuyerListing, BuyerBids });
})();

// Smart-Clearance prototype · trade-side screens: distributor (photo, van, orders), retailer (offer), ExpireSoon buyer (listing, bid)
(function () {
  const { useState, useEffect, useRef } = React;
  const { motion, AnimatePresence } = Motion;
  const D = window.SC_DATA;
  const { Icon, Avatar, Mark, Btn, Chip, CountUp, TopBar, inr, num, inrDec, stagger, ChatThread, HERO, CARTON } = window.SC;
  const mine = D.batches.filter(b => b.where.startsWith("Rakesh"));

  // ---------- distributor ----------
  function DistHome({ s, a }) {
    return <>
      <TopBar who="rakesh" title="Rakesh Traders" sub="Kalamna Market, Nagpur" badge={s.unread} onBell={() => a.go("inbox")} />
      <div className="page stack">
        <h1 className="hindi" style={{ fontFamily: "var(--display)" }}>Namaste, Rakesh bhai</h1>
        {s.photo === "requested" ? <motion.div className="hero-push" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><div className="row"><Mark size="sm" /><b>Smart-Clearance · 09:05</b></div><p className="hindi" style={{ fontSize: 17 }}>{D.strings.photoHindi}</p><Btn variant="primary" size="lg" icon="camera" onClick={() => a.go("photo")}>Take the photo</Btn></motion.div> : null}
        {s.stage >= 2 && s.stage < 4 ? <div className="card row"><Icon name="check" /><div><b>Photo sent 09:19, verified 09:20</b><p className="small muted">Priya is deciding. You will get the van route once she approves.</p></div></div> : null}
        {s.stage >= 4 ? <motion.div className="card stack-sm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><div className="row between"><b>Tuesday round updated</b><Chip tone={s.stage >= 7 ? "green" : "amber"}>{s.stage >= 7 ? "done" : "14 drops · 24½ cartons"}</Chip></div><p className="small muted">Hyderabad lot (32 cartons + 4) goes on the truck once Venkat's balance lands.</p><Btn variant="secondary" icon="truck" onClick={() => a.go("route")}>Open the van route</Btn></motion.div> : null}
        <div className="card stack-sm"><h3>My godown</h3>{mine.map(b => { const p = D.products[b.sku]; const hot = b.hero && s.stage < 7; return <div key={b.id} className="row between" style={{ padding: "8px 0", borderBottom: "1px dashed var(--line)" }}><div><b>{p.name}</b><div className="tiny muted mono">{b.id} · {b.cartons} cartons</div></div><Chip tone={hot ? "red" : b.hero ? "green" : "outline"} icon="clock">{b.days} d</Chip></div>; })}</div>
        {s.stage >= 5 ? <div className="card row between"><div><b>{s.orders} shop orders</b><div className="small muted">{num(D.shops.slice(0, s.orders).reduce((t, o) => t + o.packets, 0))} packets from the scheme</div></div><Btn variant="ghost" size="sm" iconRight="right" onClick={() => a.go("orders")}>See orders</Btn></div> : null}
      </div>
    </>;
  }
  function PhotoFlow({ s, a }) {
    const [phase, setPhase] = useState("view");
    const shoot = () => { setPhase("flash"); setTimeout(() => setPhase("reading"), 350); setTimeout(() => setPhase("result"), 2300); };
    if (s.photo === "taken") return <><TopBar back="Home" onBack={() => a.go("home")} /><div className="page stack"><h1>Label photo sent</h1><div className="card labelcard"><div className="photo"><img src={CARTON} alt="Carton label photo" /><span className="ver"><Chip tone="green" icon="check">Verified 09:20</Chip></span></div><div className="stack-sm"><p className="small muted">Gemini read the batch, both dates and the MRP straight off the pack. Priya has the plan now.</p><Btn variant="secondary" icon="external" onClick={() => a.nav("brand", "batch", HERO.id)}>Open Priya's Route Room</Btn></div></div></div></>;
    if (s.photo !== "requested") return <><TopBar back="Home" onBack={() => a.go("home")} /><div className="page stack"><h1>Photo</h1><div className="empty">No photo requested yet. Requests arrive as a push when the agent needs the truth from the shelf.</div></div></>;
    return <div className="cam">
      <div className="camtop"><button type="button" className="btn ghost sm" style={{ color: "#fff" }} onClick={() => a.go("home")}>Cancel</button><span className="mono tiny">{HERO.id} · carton label</span><span style={{ width: 60 }} /></div>
      <div className="vf"><img src={CARTON} alt="" />
        {phase === "view" || phase === "flash" ? <div className="frame" aria-hidden="true" /> : null}
        <AnimatePresence>{phase === "flash" ? <motion.div key="flash" className="flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.95, 0] }} transition={{ duration: 0.5 }} /> : null}</AnimatePresence>
        {phase === "reading" ? <motion.div className="scanline" initial={{ top: "14%" }} animate={{ top: ["14%", "86%", "14%"] }} transition={{ duration: 1.8, ease: "linear" }} /> : null}
        {phase === "view" ? <div className="hint">Fill the frame with the label on one carton</div> : null}
        {phase === "reading" ? <div className="hint"><span className="row" style={{ justifyContent: "center" }}><span className="spin" style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #fff", borderRightColor: "transparent", display: "inline-block", animation: "spin .8s linear infinite" }} />Gemini is reading the label…</span></div> : null}
        <AnimatePresence>{phase === "result" ? <motion.div key="res" className="card stack-sm" style={{ position: "absolute", left: 12, right: 12, bottom: 12 }} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}><div className="row between"><b>Read in 1.2 s</b><Chip tone="green" icon="check">confidence 0.97</Chip></div><div className="vis">{[["Batch", HERO.id], ["Best before", HERO.bestBefore], ["MRP", "₹30.00 · 24 × 150 g"], ["Records", "match"]].map(([k, v], i) => <motion.div key={k} className="vr" {...stagger(i, 0.08)}><span>{k}</span><span>{v}</span></motion.div>)}</div><Btn variant="primary" size="lg" icon="send" onClick={() => a.takePhoto()}>Send to Priya</Btn></motion.div> : null}</AnimatePresence>
      </div>
      <div className="shutterbar">{phase === "view" ? <button type="button" className="shutter" onClick={shoot} aria-label="Take photo"><i /></button> : phase === "result" ? <Btn variant="secondary" onClick={() => setPhase("view")}>Retake</Btn> : <span className="small" aria-live="polite">{phase === "flash" ? "Captured" : "Reading…"}</span>}</div>
    </div>;
  }
  function VanRoute({ s, a }) {
    const [done, setDone] = useState(s.stage >= 7 ? 14 : 0); const [running, setRunning] = useState(false);
    useEffect(() => { if (!running) return; if (done >= 14) { setRunning(false); return; } const t = setTimeout(() => setDone(d => d + 1), 320); return () => clearTimeout(t); }, [running, done]);
    const packets = D.shops.reduce((t, o) => t + o.packets, 0);
    return <>
      <TopBar who="rakesh" title="Tuesday round" sub={s.stage >= 4 ? "14 drops · 24½ cartons · Kamptee Rd, Itwari, Wardha Rd" : "no route yet"} badge={s.unread} onBell={() => a.go("inbox")} />
      <div className="page stack">
        {s.stage < 4 ? <div className="empty">Drops appear here once Priya approves a plan. The van keeps its normal round.</div> : <>
          <div className="card row wrap"><div className="grow"><b>{done} of 14 drops done</b><div className="small muted">{num(packets)} packets on board · one or two cartons a shop</div></div>{done < 14 && s.stage < 7 ? <Btn variant="primary" icon="truck" loading={running} onClick={() => setRunning(true)}>{done ? "Resume" : "Start the round"}</Btn> : null}{done >= 14 && s.stage < 7 ? (s.bid === "accepted" ? <Btn variant="amber" icon="box" onClick={() => a.dispatch()}>Dispatch Hyderabad lot · 32 cartons + 4</Btn> : <Chip tone="amber" icon="clock">Hyderabad lot waits for Venkat's balance</Chip>) : null}{s.stage >= 7 ? <Chip tone="green" icon="check">Round done · truck left Thursday 11:30</Chip> : null}</div>
          <div className="card"><div className="route">{D.shops.map((o, i) => <div key={o.id} className={"stop " + (i < done ? "done" : "")}><i>{i < done ? <Icon name="check" size={14} /> : i + 1}</i><div><div className="sn">{o.name}</div><div className="sa">{o.area}</div></div><b>{o.packets}</b></div>)}</div></div>
        </>}
      </div>
    </>;
  }
  function DistOrders({ s, a }) {
    const orders = D.shops.slice(0, s.orders);
    return <><TopBar who="rakesh" title="Retailer orders" sub="Masala Chips scheme · 48 hours" badge={s.unread} onBell={() => a.go("inbox")} /><div className="page stack">{!orders.length ? <div className="empty">No orders yet. Shops get the scheme as a push once Priya approves.</div> : <div className="card"><div className="row between" style={{ marginBottom: 8 }}><b>{orders.length} orders · {num(orders.reduce((t, o) => t + o.packets, 0))} packets</b><Chip tone="green">₹18 a packet · scheme credited</Chip></div><div className="orders">{orders.map(o => <div key={o.id} className="or"><span>{o.name} <small>{o.area}</small></span><b>{o.packets}</b><small>{o.at}</small></div>)}</div></div>}</div></>;
  }

  // ---------- retailer ----------
  function RetailOffers({ s, a }) {
    const [qty, setQty] = useState(24); const [busy, setBusy] = useState(false);
    const place = () => { setBusy(true); setTimeout(() => { setBusy(false); a.orderPlaced(qty); }, 900); };
    return <>
      <TopBar who="ganesh" title="Shree Ganesh Kirana" sub="Itwari, Nagpur" badge={s.unread} onBell={() => a.go("inbox")} />
      <div className="page stack">
        <h1 className="hindi">आज के ऑफर</h1>
        {s.stage < 5 ? <div className="empty">आज कोई ऑफर नहीं. ऑफर आते ही यहाँ और नोटिफिकेशन में दिखेगा.</div> : s.retailOrder ? <motion.div className="offer" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}><div className="row"><span className="mark sm">SC<i /></span><Chip tone="green" icon="check">ऑर्डर हो गया · {s.retailOrder.at}</Chip></div><div className="big">{s.retailOrder.qty} पैकेट · {inr(s.retailOrder.qty / 12 * 10 * 18)}</div><p className="hindi">राकेश भाई की वैन मंगलवार को लाएगी. {s.stage >= 7 ? "डिलीवर हो गया." : "पैसा डिलीवरी पर."}</p><div className="ledger"><div className="lrow"><span>आप बेचेंगे {s.retailOrder.qty} × ₹30</span><span className="v">{inr(s.retailOrder.qty * 30)}</span></div><div className="lrow pos sum"><span>आपका मार्जिन (आम तौर पर ₹90 प्रति कार्टन)</span><span className="v">{inr(s.retailOrder.qty * 30 - s.retailOrder.qty / 12 * 10 * 18)}</span></div></div><Btn variant="ghost" iconRight="right" onClick={() => a.go("myorders")}>मेरे ऑर्डर</Btn></motion.div> : <motion.div className="offer" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="row between"><div className="row"><span className="mark sm">SC<i /></span><span className="small muted mono">09:41 · Munchly Foods</span></div><Chip tone="amber" icon="clock">48 घंटे</Chip></div>
          <div className="big hindi">Munchly Masala Chips 150 g · 10 पैकेट लो, 2 मुफ़्त</div>
          <div className="scheme"><div><b>₹18</b><span>प्रति पैकेट</span></div><div><b>+2</b><span>हर 10 पर मुफ़्त</span></div><div><b>₹30</b><span>MRP · 18 नवंबर तक</span></div></div>
          <div className="row between wrap"><div className="field"><label htmlFor="qty">कितने पैकेट?</label><div className="stepper" id="qty"><button type="button" aria-label="12 कम" onClick={() => setQty(q => Math.max(12, q - 12))}><Icon name="minus" /></button><output>{qty}</output><button type="button" aria-label="12 ज़्यादा" onClick={() => setQty(q => Math.min(120, q + 12))}><Icon name="plus" /></button></div><span className="help">{qty / 24} कार्टन · आप देंगे {inr(qty / 12 * 10 * 18)} · मार्जिन {inr(qty * 30 - qty / 12 * 10 * 18)}</span></div></div>
          <Btn variant="amber" size="lg" full icon="check" loading={busy} onClick={place}><span className="hindi">ऑर्डर करें</span> · {qty} packets</Btn>
          <p className="tiny muted">डिलीवरी मंगलवार, राकेश ट्रेडर्स की वैन · पैसा डिलीवरी पर</p>
        </motion.div>}
      </div>
    </>;
  }
  function RetailOrders({ s, a }) {
    return <><TopBar who="ganesh" title="मेरे ऑर्डर" sub="Shree Ganesh Kirana" badge={s.unread} onBell={() => a.go("inbox")} /><div className="page stack">{!s.retailOrder ? <div className="empty hindi">अभी कोई ऑर्डर नहीं</div> : <div className="card row between"><div><b>Masala Chips 150 g · {s.retailOrder.qty} पैकेट</b><div className="small muted">{s.retailOrder.at} · {inr(s.retailOrder.qty / 12 * 10 * 18)}</div></div><Chip tone={s.stage >= 7 ? "green" : "amber"} icon={s.stage >= 7 ? "check" : "truck"}>{s.stage >= 7 ? "डिलीवर हो गया" : "मंगलवार को वैन से"}</Chip></div>}</div></>;
  }

  // ---------- ExpireSoon buyer ----------
  function BuyerListing({ s, a }) {
    const [bid, setBid] = useState(13); const [busy, setBusy] = useState(false);
    const place = () => { setBusy(true); setTimeout(() => { setBusy(false); a.placeBid(bid); }, 700); };
    return <div className="es" style={{ minHeight: "100%" }}>
      <div className="es-top"><b>ExpireSoon</b><span>clearance marketplace · mocked for the prototype</span><div className="grow" /><Avatar who="venkat" size={32} /></div>
      <div className="page stack">
        {s.stage < 5 ? <div className="empty">No live listings for Munchly today. Listings appear here the moment a plan is approved.</div> : <div className="es-listing">
          <div className="stack-sm"><div className="ph"><img src={CARTON} alt="Carton of Masala Chips, label photo verified" /></div><div className="row wrap"><Chip tone="green" icon="check">label photo verified</Chip><Chip tone="outline" icon="clock">best before {HERO.bestBefore} · {HERO.days} days</Chip><Chip tone="outline" icon="pin">Nagpur · dispatch 24 h after balance</Chip></div></div>
          <div className="stack">
            <div><h1>Munchly Masala Chips 150 g</h1><p className="muted">772 packets · 32 cartons + 4 · batch {HERO.id} · seller Rakesh Traders via Smart-Clearance</p></div>
            <div className="es-price">{inr(15)}<small style={{ fontSize: 16, fontFamily: "var(--body)", fontWeight: 400, color: "var(--ink-2)" }}> / packet</small><s>MRP ₹30</s></div>
            {s.bid === "accepted" ? <div className="card stack-sm"><Chip tone="green" icon="check">Order ES-88213 · awarded at ₹14.20</Chip><div className="ledger"><div className="lrow"><span>772 × ₹14.20</span><span className="v">{inr(D.plan.actualOnline.gross)}</span></div><div className="lrow pos"><span>Token paid (15%)</span><span className="v">{inr(D.plan.actualOnline.token)}</span></div><div className="lrow sum"><span>Balance before dispatch</span><span className="v">{inr(D.plan.actualOnline.balance)}</span></div></div><p className="small muted">You resell to Hyderabad kiranas at ₹20 to ₹22, with six weeks on the label.</p></div> : <div className="card stack-sm">
              <div className="field"><label htmlFor="bid">Your bid per packet</label><div className="row"><span className="mono" style={{ fontSize: 22 }}>₹</span><input id="bid" className="input" type="number" inputMode="decimal" step="0.1" min="10" max="15" value={bid} onChange={e => setBid(parseFloat(e.target.value) || 0)} disabled={s.bid !== "none"} /></div><span className="help">For all 772 packets · 15% token on acceptance</span></div>
              {s.bid === "none" ? <Btn variant="purple" size="lg" full icon="tag" loading={busy} onClick={place}>Place bid · {inrDec(bid)}</Btn> : null}
              <ChatThread s={s} />
              {s.bid === "countered" ? <Btn variant="purple" size="lg" full icon="check" onClick={() => a.acceptCounter()}>Accept ₹14.20 · pay token {inr(1644)}</Btn> : null}
            </div>}
          </div>
        </div>}
      </div>
    </div>;
  }
  function BuyerBids({ s, a }) {
    return <div className="es" style={{ minHeight: "100%" }}><div className="es-top"><b>ExpireSoon</b><span>my bids</span><div className="grow" /><Avatar who="venkat" size={32} /></div><div className="page stack"><h1>My bids</h1>{s.bid === "none" ? <div className="empty">No bids yet</div> : <div className="card stack-sm"><div className="row between"><b>Munchly Masala Chips 150 g · 772</b><Chip tone={s.bid === "accepted" ? "green" : "purple"}>{s.bid === "accepted" ? "awarded · ₹14.20" : s.bid === "countered" ? "countered · ₹14.20" : "bid · ₹13"}</Chip></div><ChatThread s={s} />{s.bid === "countered" ? <Btn variant="purple" icon="check" onClick={() => a.acceptCounter()}>Accept ₹14.20</Btn> : null}</div>}</div></div>;
  }

  Object.assign(window.SC, { DistHome, PhotoFlow, VanRoute, DistOrders, RetailOffers, RetailOrders, BuyerListing, BuyerBids });
})();

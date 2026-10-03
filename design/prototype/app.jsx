// Smart-Clearance prototype · app: state, routing, device frame, demo guide
(function () {
  const { useState, useEffect, useReducer, useRef, useMemo, useCallback } = React;
  const { motion, AnimatePresence } = Motion;
  const D = window.SC_DATA; const SC = window.SC;
  const HERO = SC.HERO;
  const DEVICES = { phone: [390, 844], tablet: [820, 1180], desktop: [1440, 900] };

  const initial = { stage: 0, role: null, screen: "board", param: null, photo: "none", orders: 0, bid: "none", retailOrder: null, inbox: [], viewport: "fit" };
  function reducer(s, ac) {
    switch (ac.type) {
      case "SIGN_IN": { const r = D.roles.find(x => x.id === ac.role); return { ...s, role: ac.role, screen: ac.screen || r.nav[0][0], param: ac.param || null }; }
      case "SIGN_OUT": return { ...s, role: null, screen: "board", param: null };
      case "NAV": return { ...s, role: ac.role || s.role, screen: ac.screen, param: ac.param || null };
      case "SET": return { ...s, ...ac.patch };
      case "PUSH": return { ...s, inbox: [{ id: Date.now() + Math.random(), read: false, ...ac.item }, ...s.inbox] };
      case "READ": return { ...s, inbox: s.inbox.map(n => n.id === ac.id ? { ...n, read: true } : n) };
      case "RESET": return { ...initial, viewport: s.viewport };
      default: return s;
    }
  }

  const GUIDE = [
    { role: "brand", screen: "board", title: "The warning", hint: "Priya opens the batch at the red edge and asks Rakesh bhai for one label photo.", done: s => s.photo !== "none" },
    { role: "distributor", screen: "photo", title: "The photo", hint: "Rakesh bhai photographs the carton label; Gemini reads it.", done: s => s.photo === "taken" },
    { role: "brand", screen: "batch", param: () => HERO.id, title: "Six doors, one tap", hint: "Priya reads the doors, the split and the money, then approves.", done: s => s.stage >= 4 },
    { role: "retailer", screen: "offers", title: "The scheme", hint: "Ganesh ji accepts the Hindi offer from his phone.", done: s => !!s.retailOrder },
    { role: "buyer", screen: "listing", title: "The haggle", hint: "Venkat bids ₹13; the agent counters at ₹14.20; he accepts.", done: s => s.bid === "accepted" },
    { role: "distributor", screen: "route", title: "On the road", hint: "Rakesh bhai runs the Tuesday round and dispatches the Hyderabad lot.", done: s => s.stage >= 7 },
    { role: "finance", screen: "paperwork", title: "The paperwork", hint: "Anita prepares the pack: invoice, credit note, e-way bill check, ITC memo.", done: s => s.stage >= 8 },
    { role: "esg", screen: "impact", title: "The report", hint: "Vikram writes the batch's BRSR row and exports the table.", done: s => s.stage >= 9 },
    { role: "brand", screen: "board", title: "Cleared", hint: "Back on Priya's board, the batch has moved to Cleared. 0 cartons binned.", done: () => false },
  ];

  function parseHash() { const m = location.hash.match(/^#\/([a-z]+)(?:\/([a-z]+))?(?:\/([^/]+))?/); if (!m) return null; return { role: m[1], screen: m[2], param: m[3] ? decodeURIComponent(m[3]) : null }; }

  function App() {
    const [s, dispatch] = useReducer(reducer, initial);
    const [appEl, setAppEl] = useState(null);
    const toastRef = useRef(null);
    const timers = useRef([]);
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    // hash routing (deep links, back button)
    useEffect(() => { const h = parseHash(); if (h && D.roles.some(r => r.id === h.role)) dispatch({ type: "SIGN_IN", role: h.role, screen: h.screen, param: h.param });
      const onHash = () => { const x = parseHash(); if (!x) { dispatch({ type: "SIGN_OUT" }); return; } dispatch({ type: "SIGN_IN", role: x.role, screen: x.screen, param: x.param }); }; window.addEventListener("hashchange", onHash); return () => window.removeEventListener("hashchange", onHash); }, []);
    useEffect(() => { const want = s.role ? "#/" + s.role + "/" + s.screen + (s.param ? "/" + encodeURIComponent(s.param) : "") : "#/"; if (location.hash !== want) history.pushState(null, "", want); }, [s.role, s.screen, s.param]);

    const toast = t => toastRef.current && toastRef.current(t);
    const push = (role, item, show = true) => { dispatch({ type: "PUSH", item: { role, ...item } }); if (show) { const r = D.roles.find(x => x.id === role); const who = D.people[r.who].short; toast({ title: (s.role === role ? "" : "To " + who + " · ") + item.title, body: item.body, hindi: item.hindi, actionLabel: s.role === role ? "Open" : "Open as " + who, action: item.go }); } };

    const a = useMemo(() => ({
      signIn: role => dispatch({ type: "SIGN_IN", role }),
      signOut: () => dispatch({ type: "SIGN_OUT" }),
      nav: (role, screen, param) => dispatch({ type: "NAV", role, screen, param }),
      go: (screen, param) => dispatch({ type: "NAV", screen, param }),
      read: id => dispatch({ type: "READ", id }),
      setViewport: v => dispatch({ type: "SET", patch: { viewport: v } }),
      reset: () => { timers.current.forEach(clearTimeout); dispatch({ type: "RESET" }); },
      requestPhoto: () => { dispatch({ type: "SET", patch: { photo: "requested" } }); push("distributor", { title: "Ek photo chahiye", body: D.strings.photoHindi, hindi: true, at: "09:05", go: () => a.nav("distributor", "photo") }); },
      takePhoto: () => { dispatch({ type: "SET", patch: { photo: "taken", stage: 2 } }); later(() => { dispatch({ type: "SET", patch: { stage: 3 } }); push("brand", { title: "Plan ready for MF-2409-117", body: "24½ cartons to Nagpur shops at ₹18, 32 cartons online at ₹15. You get ₹21,770 instead of losing ₹27,717. GST credit ₹2,611 stays safe. Tap to review.", at: "09:23", go: () => a.nav("brand", "batch", HERO.id) }); }, 1400); },
      approve: () => { dispatch({ type: "SET", patch: { stage: 4 } }); toast({ title: "Approved · 09:40", body: "Listing going up and 38 shops being notified now." }); later(() => { dispatch({ type: "SET", patch: { stage: 5 } }); push("retailer", { title: "आज का ऑफर", body: D.strings.offerHindi, hindi: true, at: "09:41", go: () => a.nav("retailer", "offers") }); push("distributor", { title: "Van route for Tuesday updated", body: "14 drops, 24½ cartons. Hyderabad lot (32 cartons + 4) ships when Venkat's balance lands.", at: "09:41", go: () => a.nav("distributor", "route") }, false); }, 1100); },
      orderPlaced: qty => { dispatch({ type: "SET", patch: { retailOrder: { qty, at: "09:52" } } }); toast({ title: "Order received · Shree Ganesh Kirana", body: qty + " packets · on Rakesh bhai's Tuesday round" }); },
      placeBid: v => { dispatch({ type: "SET", patch: { bid: "placed" } }); later(() => dispatch({ type: "SET", patch: { bid: "countered" } }), 1600); },
      acceptCounter: () => { dispatch({ type: "SET", patch: { bid: "accepted", stage: 6 } }); push("brand", { title: "Awarded · ExpireSoon", body: "772 packets at ₹14.20 to Sri Venkateswara Traders. Token ₹1,644 received; balance ₹9,318 before dispatch.", at: "11:09", go: () => a.nav("brand", "execution", HERO.id) }); },
      dispatch: () => { dispatch({ type: "SET", patch: { stage: 7 } }); push("finance", { title: "Stock moved · MF-2409-117", body: "24½ cartons delivered to 14 shops; 32 cartons + 4 on the truck to Hyderabad. The document pack is ready to prepare.", at: "Day 3", go: () => a.nav("finance", "paperwork") }); },
      generatePapers: () => { dispatch({ type: "SET", patch: { stage: 8 } }); push("esg", { title: "Ledger closed · MF-2409-117", body: "217.6 kg kept out of landfill with invoices behind every kilo. Write the BRSR row.", at: "Day 3", go: () => a.nav("esg", "impact") }); push("brand", { title: "Papers ready", body: "Invoice, credit note, e-way bill check, GST memo. Nothing to chase.", at: "Day 3", go: () => a.nav("brand", "paperwork") }, false); },
      closeLedger: () => { dispatch({ type: "SET", patch: { stage: 9 } }); push("brand", { title: "Batch closed · 0 cartons binned", body: "₹21,222 recovered, ₹2,611 GST credit kept, 217.6 kg out of landfill. MF-2409-117 is cleared.", at: "Day 3", go: () => a.nav("brand", "board") }); },
    }), [s.role]);

    // first sign-in as Priya: the morning warning
    useEffect(() => { if (s.role === "brand" && s.stage === 0) later(() => { dispatch({ type: "SET", patch: { stage: 1 } }); push("brand", { title: "Masala Chips 150 g · Nagpur", body: "Priya ji, 57 cartons (1,360 packets) won't sell before 18 Nov. Blinkit, Zepto and Instamart have all stopped taking the batch. Tap to see the options.", at: "09:00", go: () => a.nav("brand", "batch", HERO.id) }); }, 700); }, [s.role]);
    // orders arrive while the scheme runs
    useEffect(() => { if (s.stage < 5 || s.orders >= 14) return; const t = setTimeout(() => dispatch({ type: "SET", patch: { orders: s.orders + 1 } }), s.orders === 0 ? 900 : 650); return () => clearTimeout(t); }, [s.stage, s.orders]);

    const unread = s.inbox.filter(n => n.role === s.role && !n.read).length;
    const sx = { ...s, unread };
    const stepIdx = Math.max(0, GUIDE.findIndex(g => !g.done(s))); const step = GUIDE[stepIdx];
    const goStep = g => { if (!s.role) dispatch({ type: "SIGN_IN", role: g.role, screen: g.screen, param: g.param ? g.param() : null }); else dispatch({ type: "NAV", role: g.role, screen: g.screen, param: g.param ? g.param() : null }); };

    return <div id="stage">
      <DemoBar s={sx} a={a} step={step} stepIdx={stepIdx} goStep={goStep} />
      <Viewport viewport={s.viewport}>
        <div className="app" ref={setAppEl}>
          <SC.VWProvider el={appEl}><SC.ToastHost resetKey={s.role}><ToastBridge bind={fn => { toastRef.current = fn; }} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={(s.role || "signin") + "/" + s.screen + "/" + (s.param || "")} style={{ position: "absolute", inset: 0 }} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}>
                {!s.role ? <SC.SignIn a={a} /> : <SC.Shell role={s.role} screen={s.screen} onNav={id => a.go(id)} badge={unread} onSignOut={a.signOut}><Screen s={sx} a={a} /></SC.Shell>}
              </motion.div>
            </AnimatePresence>
          </SC.ToastHost></SC.VWProvider>
        </div>
      </Viewport>
    </div>;
  }
  function ToastBridge({ bind }) { const { push } = SC.useToasts(); useEffect(() => { bind(push); }, [push]); return null; }

  function Screen({ s, a }) {
    const r = s.role, sc = s.screen;
    if (sc === "inbox") return <SC.Inbox s={s} a={a} role={r} />;
    if (r === "brand") { if (sc === "batch") return <SC.RouteRoom s={s} a={a} id={s.param} />; if (sc === "execution") return <SC.Execution s={s} a={a} />; if (sc === "paperwork") return <SC.Paperwork s={s} a={a} who="priya" />; if (sc === "ledger") return <SC.Ledger s={s} a={a} who="priya" />; return <SC.Board s={s} a={a} />; }
    if (r === "distributor") { if (sc === "photo") return <SC.PhotoFlow s={s} a={a} />; if (sc === "route") return <SC.VanRoute s={s} a={a} />; if (sc === "orders") return <SC.DistOrders s={s} a={a} />; return <SC.DistHome s={s} a={a} />; }
    if (r === "retailer") { if (sc === "myorders") return <SC.RetailOrders s={s} a={a} />; return <SC.RetailOffers s={s} a={a} />; }
    if (r === "buyer") { if (sc === "bids") return <SC.BuyerBids s={s} a={a} />; return <SC.BuyerListing s={s} a={a} />; }
    if (r === "finance") { if (sc === "ledger") return <SC.Ledger s={s} a={a} who="anita" />; return <SC.Paperwork s={s} a={a} who="anita" />; }
    if (r === "esg") { if (sc === "ledger") return <SC.Ledger s={s} a={a} who="vikram" />; return <SC.Ledger s={s} a={a} who="vikram" focus="esg" />; }
    return null;
  }

  function DemoBar({ s, a, step, stepIdx, goStep }) {
    return <div className="demobar" role="toolbar" aria-label="Demo controls">
      <div className="brand"><SC.Mark size="sm" />Smart-Clearance <span className="lbl" style={{ marginLeft: 6 }}>prototype</span></div>
      <div className="group"><span className="lbl">Sign in as</span>{D.roles.map(r => <button type="button" key={r.id} className="rolebtn" aria-pressed={s.role === r.id} onClick={() => a.signIn(r.id)} title={D.people[r.who].name}><img src={D.people[r.who].img} alt="" />{D.people[r.who].short}</button>)}</div>
      <div className="group"><span className="lbl">Device</span><div className="seg">{[["fit", "Fit"], ["phone", "Phone"], ["tablet", "Tablet"], ["desktop", "Desktop"]].map(([id, l]) => <button type="button" key={id} aria-pressed={s.viewport === id} onClick={() => a.setViewport(id)}>{l}</button>)}</div></div>
      <div className="spacer" />
      <div className="guide"><span className="step">{stepIdx + 1}/{GUIDE.length}</span><div className="ttl">{step.title}<small>{step.hint}</small></div><button type="button" className="dbtn" onClick={() => goStep(step)}><SC.Icon name="play" size={16} />Take me there</button><button type="button" className="dbtn ghost" onClick={a.reset} title="Reset the demo"><SC.Icon name="refresh" size={16} />Reset</button></div>
    </div>;
  }

  function Viewport({ viewport, children }) {
    const ref = useRef(null); const [scale, setScale] = useState(1);
    useEffect(() => { if (viewport === "fit") return; const el = ref.current; const [W, H] = DEVICES[viewport]; const pad = viewport === "desktop" ? [0, 34] : viewport === "phone" ? [24, 24] : [28, 28];
      const ro = new ResizeObserver(([e]) => { const w = e.contentRect.width - 36, h = e.contentRect.height - 36; setScale(Math.min(1, w / (W + pad[0]), h / (H + pad[1]))); }); ro.observe(el); return () => ro.disconnect(); }, [viewport]);
    if (viewport === "fit") return <div id="viewport" className="fit" ref={ref}>{children}</div>;
    const [W, H] = DEVICES[viewport];
    return <div id="viewport" ref={ref}><div className={"device " + viewport} style={{ width: viewport === "desktop" ? W : W + (viewport === "phone" ? 24 : 28), height: viewport === "desktop" ? H + 34 : H + (viewport === "phone" ? 24 : 28), transform: "scale(" + scale + ")", marginBottom: -(1 - scale) * H }}><div style={{ width: W, height: H, position: "relative" }}>{children}</div></div></div>;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();

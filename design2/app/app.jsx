// Smart-Clearance app v2 · the application: auth gate, routing, role shells, notifications, device stage, splash
(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const { motion, AnimatePresence } = Motion;
  const K = window.SC2; const A = window.SC_APP; const DB = window.DB; const Auth = window.Auth; const Bus = window.Bus;
  const DEVICES = { phone: [390, 844], tablet: [820, 1180], desktop: [1440, 900] };

  const NAV = {
    operator: [["today", "Today", "sheet"], ["batches", "Batches", "box"], ["approvals", "Approvals", "check"], ["orders", "Orders", "store"], ["partners", "Partners", "users"], ["reports", "Reports", "chart"]],
    admin: [["today", "Today", "sheet"], ["users", "Users", "users"], ["partners", "Partners", "store"], ["rules", "Rules", "settings"], ["integrations", "Systems", "plug"], ["audit", "Audit", "history"], ["batches", "Batches", "box"]],
    finance: [["today", "Today", "sheet"], ["documents", "Documents", "file"], ["ledger", "Ledger", "chart"], ["gst", "GST", "percent"], ["batches", "Batches", "box"]],
    sustainability: [["impact", "Impact", "leaf"], ["brsr", "BRSR", "doc"], ["evidence", "Evidence", "shield"], ["batches", "Batches", "box"]],
    distributor: [["home", "Home", "home"], ["photos", "Photos", "camera"], ["rounds", "Rounds", "truck"], ["orders", "Orders", "store"], ["stock", "Stock", "box"]],
    retailer: [["offers", "Offers", "tag"], ["myorders", "Orders", "store"], ["shop", "My shop", "home"]],
    buyer: [["listings", "Listings", "tag"], ["bids", "My bids", "chat"], ["buyorders", "Orders", "rupee"]],
    foodbank: [["pickups", "Pickups", "truck"]],
  };
  function parseHash() { const h = location.hash.replace(/^#\/?/, ""); const [path, query] = h.split("?"); const seg = path.split("/").filter(Boolean).map(decodeURIComponent); return { section: seg[0] || "", id: seg[1] || null, tab: seg[2] || null, query: query || "" }; }
  function splashSeen() { try { return sessionStorage.getItem("sc2-app-splash") === "1"; } catch (e) { return true; } }

  function App() {
    const appRef = useRef(null);
    const [viewport, setViewport] = useState("fit");
    const [splash, setSplash] = useState(!splashSeen());
    return <K.ThemeProvider><Stage viewport={viewport} setViewport={setViewport} appRef={appRef} onReplay={() => setSplash(true)}>
      <K.VWProvider targetRef={appRef}><K.ToastHost resetKey="app"><Gate />{splash && <K.Splash onDone={() => { try { sessionStorage.setItem("sc2-app-splash", "1"); } catch (e) {} setSplash(false); }} />}</K.ToastHost></K.VWProvider>
    </Stage></K.ThemeProvider>;
  }

  function Gate() {
    const user = A.useAuth(); const [route, setRoute] = useState(parseHash()); const [notif, setNotif] = useState(false);
    const { push } = K.useToasts(); const seen = useRef(new Set()); const v = A.useDB();
    useEffect(() => { const h = () => { const r = parseHash(); if (r.section === "notifications") { setNotif(true); history.replaceState(null, "", location.hash.replace(/#\/notifications.*/, "#/" + (route.section || ""))); return; } setRoute(r); }; window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h); }, [route.section]);
    const nav = path => { if (path === "notifications") { setNotif(true); return; } location.hash = "#/" + path; };
    // new notifications for this person print in as pushes
    useEffect(() => { if (!user) return; const items = DB.list("notifications", { where: { user: user.id, read: false } }); if (!seen.current.size) { items.forEach(n => seen.current.add(n.id)); return; } items.forEach(n => { if (!seen.current.has(n.id)) { seen.current.add(n.id); push({ title: n.title, body: n.body, hindi: n.hindi, at: "now", go: () => { DB.update("notifications", n.id, { read: true }); if (n.link) nav(n.link); } }); } }); }, [v, user && user.id]);
    useEffect(() => { seen.current = new Set(); if (!user && location.hash && location.hash !== "#/") history.replaceState(null, "", "#/"); }, [user && user.id]);
    if (!user) return <A.SignIn onSignedIn={u => { const first = (NAV[u.role] || NAV.operator)[0][0]; location.hash = "#/" + first; }} />;
    const nav_ = (NAV[user.role] || NAV.operator).map(([id, label, icon]) => ({ id, label, icon }));
    // a route is only reachable when the role's navigation carries it (plus profile, and documents for the money roles)
    const allowed = nav_.map(n => n.id).concat(["profile"], ["operator", "admin", "finance", "sustainability"].includes(user.role) ? ["documents"] : []);
    const section = route.section && allowed.includes(route.section) ? route.section : nav_[0].id;
    const unread = DB.list("notifications", { where: { user: user.id, read: false } }).length;
    const navItems = nav_.map(n => n.id === "today" ? n : n);
    return <>
      <K.Shell nav={navItems} current={section} onNav={id => nav(id)} who={{ name: user.name, img: user.avatar || DB.PORTRAITS + "p-meera.jpg", short: user.name.split(" ")[0] }} onWho={() => nav("profile")} footer={<button type="button" className="btn onchrome sm" onClick={() => Auth.signOut()}><K.Icon name="logout" size={16} />Sign out</button>}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={section + "/" + (route.id || "") + "/" + (route.tab || "")} style={{ position: "absolute", inset: 0, overflow: "auto" }} className="scroll" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
            <Screen user={user} section={section} id={route.id} tab={route.tab} nav={nav} />
          </motion.div>
        </AnimatePresence>
      </K.Shell>
      <A.NotificationsSheet open={notif} onClose={() => setNotif(false)} user={user} onOpenLink={l => nav(l)} />
    </>;
  }

  function Screen({ user, section, id, tab, nav }) {
    const r = user.role; const S = A;
    if (section === "profile") return <S.Profile user={user} nav={nav} onSignOut={() => Auth.signOut()} />;
    if (section === "batches") return id ? <S.BatchDetail user={user} nav={nav} id={id} tab={tab || "overview"} /> : <S.Batches user={user} nav={nav} />;
    if (section === "documents" && ["finance", "operator", "admin", "sustainability"].includes(r)) return <S.Documents user={user} nav={nav} id={id} />;
    if (section === "partners" && ["operator", "admin", "finance"].includes(r)) return <S.Partners user={user} nav={nav} id={id} />;
    if (r === "operator" || r === "admin" || r === "finance") {
      if (section === "today") return <S.Today user={user} nav={nav} />;
      if (section === "approvals") return <S.Approvals user={user} nav={nav} />;
      if (section === "orders") return <S.Orders user={user} nav={nav} />;
      if (section === "reports") return <S.Reports user={user} nav={nav} />;
      if (section === "ledger") return <S.Ledger user={user} nav={nav} />;
      if (section === "gst") return <S.GST user={user} nav={nav} />;
      if (r === "admin" || user.admin) { if (section === "users") return <S.Users user={user} nav={nav} />; if (section === "rules") return <S.Rules user={user} nav={nav} />; if (section === "integrations") return <S.Integrations user={user} nav={nav} />; if (section === "audit") return <S.Audit user={user} nav={nav} />; }
      return <S.Today user={user} nav={nav} />;
    }
    if (r === "sustainability") { if (section === "brsr") return <S.BRSR user={user} nav={nav} />; if (section === "evidence") return <S.Evidence user={user} nav={nav} />; return <S.Impact user={user} nav={nav} />; }
    if (r === "distributor") { if (section === "photos") return <S.Photos user={user} nav={nav} id={id} />; if (section === "rounds") return <S.Rounds user={user} nav={nav} id={id} />; if (section === "orders") return <S.DistOrders user={user} nav={nav} />; if (section === "stock") return <S.Stock user={user} nav={nav} />; return <S.DistHome user={user} nav={nav} />; }
    if (r === "retailer") { if (section === "myorders") return <S.MyOrders user={user} nav={nav} />; if (section === "shop") return <S.Shop user={user} nav={nav} />; return <S.Offers user={user} nav={nav} id={id} />; }
    if (r === "buyer") { if (section === "bids") return <S.Bids user={user} nav={nav} />; if (section === "buyorders") return <S.BuyOrders user={user} nav={nav} />; return <S.Listings user={user} nav={nav} id={id} />; }
    if (r === "foodbank") return <S.Pickups user={user} nav={nav} />;
    return <S.Today user={user} nav={nav} />;
  }

  function Stage({ viewport, setViewport, appRef, onReplay, children }) {
    const { resolved } = K.useTheme(); const [confirm, setConfirm] = useState(false);
    return <div id="stage">
      <div className="demobar" role="toolbar" aria-label="Prototype controls">
        <div className="brand"><K.Mark size="sm" sun={false} /><K.Wordmark size={13} /><span className="lbl" style={{ marginLeft: 6 }}>app v2 · mock backend</span></div>
        <div className="group device"><span className="lbl">Device</span><div className="seg">{[["fit", "Fit"], ["phone", "Phone"], ["tablet", "Tablet"], ["desktop", "Desktop"]].map(([id, l]) => <button type="button" key={id} aria-pressed={viewport === id} onClick={() => setViewport(id)}>{l}</button>)}</div></div>
        <div className="spacer" />
        <div className="guide"><button type="button" className="dbtn ghost" onClick={onReplay}><K.Icon name="play" size={16} />Splash</button><button type="button" className="dbtn ghost" onClick={() => setConfirm(true)} title="Restore the seeded data"><K.Icon name="refresh" size={16} />Reset data</button></div>
      </div>
      <Viewport viewport={viewport}><div className="app" data-theme={resolved} ref={appRef}>{children}{confirm && <ResetConfirm onClose={() => setConfirm(false)} />}</div></Viewport>
    </div>;
  }
  function ResetConfirm({ onClose }) { return <A.ConfirmSheet open onClose={onClose} title="Reset the demo data?" body="The store returns to its seed. Sessions stay signed in." confirmLabel="Reset" danger onConfirm={async () => { Bus.cancelAll(); DB.reset(); }} />; }

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

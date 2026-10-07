// Smart-Clearance v3 · each role's navigation and the shell that hosts its screens (used by the demo's frames and the app)
(function () {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS;
  const { Icon, Shell, useApp } = K;

  const NAV = {
    operator: [{ id: "command", label: "Command Center", short: "Today", icon: "layout-dashboard" }, { id: "route", label: "Route Room", short: "Route", icon: "route" }, { id: "execution", label: "Execution", short: "Live", icon: "activity" }, { id: "batches", label: "Batches", icon: "boxes" }, { id: "setup", label: "Setup", icon: "sliders-horizontal", phoneHidden: true }, { id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line", section: "Reports", phoneHidden: true }],
    distributor: [{ id: "home", label: "Today", icon: "house" }, { id: "photo", label: "Label photo", short: "Photo", icon: "camera" }, { id: "van", label: "Van route", short: "Van", icon: "truck" }, { id: "orders", label: "Orders", icon: "clipboard-list" }],
    retailer: [{ id: "home", label: "Offers", icon: "tag" }, { id: "orders", label: "Orders", icon: "shopping-basket" }],
    buyer: [{ id: "market", label: "Marketplace", short: "Market", icon: "store" }, { id: "bids", label: "My bids", short: "Bids", icon: "gavel" }],
    finance: [{ id: "paperwork", label: "Paperwork", icon: "file-text" }, { id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line" }, { id: "batches", label: "Batches", icon: "boxes" }],
    sustainability: [{ id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line" }, { id: "paperwork", label: "Evidence", icon: "file-text" }, { id: "batches", label: "Batches", icon: "boxes" }],
    foodbank: [{ id: "pickups", label: "Pickups", icon: "heart-handshake" }],
    admin: [{ id: "workspace", label: "Workspace", icon: "building-2" }, { id: "users", label: "Users", icon: "users" }, { id: "rules", label: "Guardrails", icon: "shield" }, { id: "integrations", label: "Integrations", short: "Apps", icon: "plug", phoneHidden: true }, { id: "audit", label: "Audit log", short: "Audit", icon: "scroll-text" }],
  };
  const HOME = { operator: "command", distributor: "home", retailer: "home", buyer: "market", finance: "paperwork", sustainability: "report", foodbank: "pickups", admin: "workspace" };
  const PARENT = { listing: "market", offer: "home" };
  const ALWAYS = ["inbox", "profile"];
  const routesFor = role => NAV[role].map(n => n.id).concat(ALWAYS, role === "buyer" ? ["listing"] : role === "retailer" ? ["offer"] : role === "operator" ? ["paperwork"] : []);

  function screenFor(me, name, opts) {
    const X = S, r = me.role;
    switch (name) {
      case "command": return <X.CommandCenter me={me} />;
      case "route": return <X.RouteRoom me={me} />;
      case "execution": return <X.Execution me={me} />;
      case "batches": return <X.Batches me={me} />;
      case "setup": return <X.Setup me={me} />;
      case "report": return <X.Report me={me} />;
      case "paperwork": return <X.Paperwork me={me} />;
      case "home": return r === "retailer" ? <X.RetailHome me={me} /> : <X.DistHome me={me} />;
      case "photo": return <X.CameraScreen me={me} realCamera={opts && opts.realCamera} />;
      case "van": return <X.VanRoute me={me} />;
      case "orders": return r === "retailer" ? <X.RetailOrders me={me} /> : <X.DistOrders me={me} />;
      case "offer": return <X.OfferDetail me={me} />;
      case "market": return <X.Market me={me} />;
      case "listing": return <X.Listing me={me} />;
      case "bids": return <X.MyBids me={me} />;
      case "pickups": return <X.Pickups me={me} />;
      case "workspace": return <X.WorkspaceSettings me={me} />;
      case "users": return <X.Users me={me} />;
      case "rules": return <X.Rules me={me} />;
      case "integrations": return <X.Integrations me={me} />;
      case "audit": return <X.Audit me={me} />;
      case "inbox": return <X.Inbox me={me} routes={routesFor(r)} />;
      case "profile": return <X.Profile me={me} />;
      default: return screenFor(me, HOME[r], opts);
    }
  }

  const EsBrand = () => <span className="row tight"><span className="es-logo" aria-hidden="true"><Icon name="hourglass" size={16} stroke={2.2} /></span><span className="es-word">ExpireSoon</span></span>;

  // one person's app: their shell, their nav, the screen for the route. Everyone but the ExpireSoon buyer is inside
  // Munchly's workspace, so the product's mark leads the shell and the workspace sits under it. pushStep (the live
  // workspace, SC-73): the first sign-in on a device ends on one step that asks for notifications, before the home
  function RoleApp({ me, route, onGo, onBack, realCamera, pushStep }) {
    const reduce = useReducedMotion(); const top = useRef(null); const [wsOpen, setWsOpen] = useState(false);
    const name = route && route.name ? route.name : HOME[me.role];
    const allowed = routesFor(me.role); const safe = allowed.includes(name) ? name : HOME[me.role];
    const nav = NAV[me.role]; const current = PARENT[safe] || safe;
    const ref = route && route.params && route.params.ref;
    React.useLayoutEffect(() => { const el = top.current; const sc = el && el.closest(".scroll"); if (sc) sc.scrollTop = 0; }, [safe, me.id, ref]);
    useEffect(() => setWsOpen(false), [me.id]);
    const display = Object.assign({}, me, { role: S.ROLES[me.role] });
    const inside = me.role !== "buyer"; const W = D.WORKSPACE;
    const ws = inside ? { name: W.name, domain: W.domain, open: () => setWsOpen(true) } : null;
    const body = <Shell nav={nav} current={current} onNav={id => onGo({ name: id, params: {}, replace: true })} user={display} onUser={() => onGo({ name: "profile" })} ws={inside ? W : null} onWorkspace={() => setWsOpen(true)} brand={me.role === "buyer" ? <EsBrand /> : undefined} brandMark={me.role === "buyer" ? <span className="es-logo" style={{ width: 36, height: 36, borderRadius: 11 }}><Icon name="hourglass" size={18} stroke={2.2} /></span> : undefined}>
      {pushStep ? <S.Live.PushStep me={me} home={(nav.find(n => n.id === HOME[me.role]) || nav[0]).label} {...pushStep} /> : <AnimatePresence mode="wait" initial={false}>
        <motion.div key={safe + (ref || "")} ref={top} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
          {screenFor(me, safe, { realCamera })}
        </motion.div>
      </AnimatePresence>}
    </Shell>;
    const openNote = n => { window.SC3_STORE.update(st => { const x = st.notifications.find(y => y.id === n.id); if (x) x.read = true; }); if (n.link && allowed.includes(n.link)) onGo({ name: n.link }); };
    return <S.Router route={{ name: safe, params: route && route.params }} onGo={r => onGo(r)} onBack={onBack}><S.WorkspaceCtx.Provider value={ws}>
      <S.PushBanners key={me.id} me={me} onOpen={openNote} />{me.role === "buyer" ? <div className="esw">{body}</div> : body}
      {inside && <S.WorkspaceSheet open={wsOpen} onClose={() => setWsOpen(false)} me={me} onSettings={allowed.includes("workspace") ? () => { setWsOpen(false); onGo({ name: "workspace" }); } : null} />}
    </S.WorkspaceCtx.Provider></S.Router>;
  }

  Object.assign(window.SC3_SCREENS, { NAV, HOME, routesFor, screenFor, RoleApp });
})();

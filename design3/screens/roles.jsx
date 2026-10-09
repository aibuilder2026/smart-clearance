// Smart-Clearance v3 · each role's navigation and the shell that hosts its screens (used by the demo's frames and the app)
(function () {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS;
  const { Icon, Shell, useApp } = K;

  const NAV = {
    // the operator's batches (SC-112): the workspace's own places here, and the batches in a journey between Setup and
    // Reports (RoleApp adds them); a batch's screens are tabs on its page
    operator: [{ id: "command", label: "Command Center", short: "Today", icon: "layout-dashboard" }, { id: "batches", label: "Batches", icon: "boxes" }, { id: "setup", label: "Setup", icon: "sliders-horizontal", phoneHidden: true }, { id: "report", label: "Ledger", icon: "book-open", section: "Reports" }],
    // the distributor's portal, batch by batch (SC-133): Today, Batches (SC-130), each batch's Deliveries (the van round, the
    // buyer's truck, the staff sale, the pickup, then the earlier ones), the label photo (opened from its request on a
    // phone, so it leaves the phone's four tabs) and every batch's Orders
    distributor: [{ id: "home", label: "Today", icon: "house" }, { id: "batches", label: "Batches", icon: "boxes" }, { id: "van", label: "Deliveries", short: "Deliveries", icon: "truck" }, { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true }, { id: "orders", label: "Orders", icon: "clipboard-list" }],
    retailer: [{ id: "home", label: "Offers", icon: "tag" }, { id: "orders", label: "Orders", icon: "shopping-basket" }],
    buyer: [{ id: "market", label: "Marketplace", short: "Market", icon: "store" }, { id: "bids", label: "My bids", short: "Bids", icon: "gavel" }],
    foodbank: [{ id: "pickups", label: "Pickups", icon: "heart-handshake" }],
    admin: [{ id: "workspace", label: "Workspace", icon: "building-2" }, { id: "users", label: "Users", icon: "users" }, { id: "rules", label: "Guardrails", icon: "shield" }, { id: "integrations", label: "Integrations", short: "Apps", icon: "plug", phoneHidden: true }, { id: "audit", label: "Audit log", short: "Audit", icon: "scroll-text" }],
  };
  const HOME = { operator: "command", distributor: "home", retailer: "home", buyer: "market", foodbank: "pickups", admin: "workspace" };
  const PARENT = { listing: "market", offer: "home" };
  const ALWAYS = ["inbox", "profile"];
  const routesFor = role => NAV[role].map(n => n.id).concat(ALWAYS, role === "buyer" ? ["listing"] : role === "retailer" ? ["offer"] : role === "operator" ? ["journey", "route", "execution", "paperwork"] : []);
  // the batches in a journey the sidebar lists by name and stop, before "N more" takes the rest to Batches
  const SIDEBAR_BATCHES = 5;
  const WHERE = { command: "Command Center", batches: "Batches", inbox: "Inbox", report: "Ledger", setup: "Setup", profile: "Profile" };

  function screenFor(me, name, opts) {
    const X = S, r = me.role;
    switch (name) {
      case "command": return <X.CommandCenter me={me} />;
      case "route": return <X.RouteRoom me={me} />;
      case "execution": return <X.Execution me={me} />;
      case "batches": return r === "distributor" ? <X.DistBatches me={me} /> : <X.Batches me={me} />;
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

  // the operator's batch page (SC-112): which batch the route names (a screen opened without one keeps the batch in a
  // journey it was on, else the first), whether it is in a journey, the screen shown (a batch in no journey has only its
  // Journey), the sidebar's batches, and the back link to where the batch was opened from
  function useBatchPage(me, name, ref) {
    const s = S.useStore(); const live = S.useLive(); const app = K.useApp();
    const from = useRef("command"); const last = useRef(null); const prev = useRef(name);
    const operator = me.role === "operator"; const items = operator ? S.journeyItems(s, live) : [];
    const inBatch = operator && S.BATCH_PART_IDS.includes(name);
    if (prev.current !== name) { if (inBatch && !S.BATCH_PART_IDS.includes(prev.current)) from.current = prev.current; prev.current = name; }
    if (!operator) return { nav: NAV[me.role], frame: null };
    const want = ref || (inBatch && last.current) || null;
    const it = inBatch ? (want ? items.find(i => i.ref === want) : items[0]) || null : null;
    const v = inBatch ? (it ? it.view : S.viewOf(s, want || D.BATCHES[0].id, live)) : null;
    if (inBatch && v) last.current = v.id;
    const part = it ? name : "journey";
    // the sidebar lists the batches still in a journey (a cleared one is in Batches and on the Command Center)
    const open = items.filter(i => i.current >= 0);
    const shown = open.slice(0, open.length > SIDEBAR_BATCHES + 1 ? SIDEBAR_BATCHES : open.length);
    const batchNav = shown.map((b, i) => ({ id: "batch:" + b.ref, ref: b.ref, label: S.shortName(b.view.skuObj), product: b.view.skuObj.img, stop: b.stop, human: b.human, phoneHidden: true, section: i === 0 ? `In a journey · ${open.length}` : undefined, aria: `${b.view.skuObj.name}, ${b.ref}, at ${b.stop}${b.human ? ", needs your yes" : ""}` }))
      .concat(open.length > shown.length ? [{ id: "more", label: `${open.length - shown.length} more in Batches`, icon: "ellipsis", phoneHidden: true }] : []);
    const ops = NAV.operator; const nav = [ops[0], ops[1], ops[2]].concat(batchNav, ops.slice(3));
    const back = WHERE[from.current] || WHERE.command;
    return { nav, items, it, v, part, inBatch: inBatch && !!v, back, fromId: WHERE[from.current] ? from.current : "command", sidebar: app.bp !== "phone", live };
  }

  // one person's app: their shell, their nav, the screen for the route. Everyone but the ExpireSoon buyer is inside
  // Munchly's workspace, so the product's mark leads the shell and the workspace sits under it. pushStep (the live
  // workspace, SC-73): the first sign-in on a device ends on one step that asks for notifications, before the home
  function RoleApp({ me, route, onGo, onBack, realCamera, pushStep }) {
    const reduce = useReducedMotion(); const top = useRef(null); const [wsOpen, setWsOpen] = useState(false);
    const name = route && route.name ? route.name : HOME[me.role];
    const allowed = routesFor(me.role); const safe = allowed.includes(name) ? name : HOME[me.role];
    const ref = route && route.params && route.params.ref;
    const bp = useBatchPage(me, safe, ref); const nav = bp.nav;
    const current = bp.inBatch ? (bp.sidebar && bp.it ? "batch:" + bp.it.ref : bp.fromId) : PARENT[safe] || safe;
    const onNav = id => { const b = nav.find(n => n.id === id && n.ref); if (id === "more") onGo({ name: "batches", params: {} }); else if (b) onGo({ name: S.partAt(bp.items.find(i => i.ref === b.ref)), params: { ref: b.ref } }); else onGo({ name: id, params: {}, replace: true }); };
    const frame = bp.inBatch ? { title: `${S.shortName(bp.v.skuObj)} · ${S.BATCH_PARTS.find(p => p.id === bp.part).label}`, back: bp.back, head: <S.BatchHead it={bp.it} v={bp.v} part={bp.part} onPart={p => onGo({ name: p, params: { ref: bp.v.id }, replace: true })} /> } : null;
    React.useLayoutEffect(() => { const el = top.current; const sc = el && el.closest(".scroll"); if (sc) sc.scrollTop = 0; }, [safe, me.id, ref]);
    useEffect(() => setWsOpen(false), [me.id]);
    const display = Object.assign({}, me, { role: S.ROLES[me.role] });
    const inside = me.role !== "buyer"; const W = D.WORKSPACE;
    const ws = inside ? { name: W.name, domain: W.domain, open: () => setWsOpen(true) } : null;
    const body = <Shell nav={nav} current={current} onNav={onNav} user={display} onUser={() => onGo({ name: "profile" })} ws={inside ? W : null} onWorkspace={() => setWsOpen(true)} brand={me.role === "buyer" ? <EsBrand /> : undefined} brandMark={me.role === "buyer" ? <span className="es-logo" style={{ width: 36, height: 36, borderRadius: 11 }}><Icon name="hourglass" size={18} stroke={2.2} /></span> : undefined}>
      {pushStep ? <S.Live.PushStep me={me} home={(nav.find(n => n.id === HOME[me.role]) || nav[0]).label} {...pushStep} /> : <AnimatePresence mode="wait" initial={false}>
        <motion.div key={bp.inBatch ? "batch:" + bp.v.id : safe + (ref || "")} ref={top} className={bp.inBatch ? "bpage" : undefined} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
          {bp.inBatch ? <S.BatchCtx.Provider value={frame}><S.BatchPart me={me} it={bp.it} v={bp.v} part={bp.part} /></S.BatchCtx.Provider> : screenFor(me, safe, { realCamera })}
        </motion.div>
      </AnimatePresence>}
    </Shell>;
    const openNote = n => { window.SC3_STORE.update(st => { const x = st.notifications.find(y => y.id === n.id); if (x) x.read = true; }); if (n.link && allowed.includes(n.link)) onGo({ name: n.link }); };
    return <S.Router route={bp.inBatch ? { name: bp.part, params: { ref: bp.v.id } } : { name: safe, params: route && route.params }} onGo={r => onGo(r)} onBack={onBack}><S.WorkspaceCtx.Provider value={ws}>
      <S.PushBanners key={me.id} me={me} onOpen={openNote} />{me.role === "buyer" ? <div className="esw">{body}</div> : body}
      {inside && <S.WorkspaceSheet open={wsOpen} onClose={() => setWsOpen(false)} me={me} onSettings={allowed.includes("workspace") ? () => { setWsOpen(false); onGo({ name: "workspace" }); } : null} />}
    </S.WorkspaceCtx.Provider></S.Router>;
  }

  Object.assign(window.SC3_SCREENS, { NAV, HOME, routesFor, screenFor, RoleApp });
})();

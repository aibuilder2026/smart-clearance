// SC-112's mockups: the operator's workspace, batch first. Loaded after screens/roles.js and before app.js; each option
// (option-x/opt.jsx) builds its RoleApp from what is here. Every other role keeps the app's own RoleApp, and every
// screen's body is the app's own: only the way between them changes.
//   - the batches in a journey, most urgent first, and where each stands (its stop, its state in words);
//   - the parts of a batch (Journey, Route Room, Execution, Paperwork) and the screen each shows;
//   - the Journey view: the batch's tracker card, its cluster and its agents, from the Command Center's pieces;
//   - Chrome: what RoleApp wraps a screen in (router, workspace, pushes, the shell, the entrance), with a desktop
//     sidebar an option fills itself.
(function () {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, Empty, Product, Money, AgentFeed, ClusterMap, TrackerCard, Mark, Wordmark, WorkspaceMark, Avatar, useApp } = K;
  const OrigRoleApp = S.RoleApp;
  const EASE = [0.22, 1, 0.36, 1];

  /* ---------- the batches in a journey ---------- */
  // the Masala Chips the store follows and, on the live workspace with two flagged, the Mango Drink at Verify, waiting
  // for Lakshmi Agencies' photo (screens/live.jsx's flaggedItems): most urgent first
  function journeys(s, live) {
    return S.Live.flaggedItems(s, live || { two: false }).map(it => Object.assign({}, it, { sku: it.view.skuObj, dist: it.view.dist, days: it.view.daysLeft }));
  }
  const find = (items, ref) => items.find(i => i.ref === ref) || items[0];
  const shortName = sku => sku.name.replace(/\s+\d+(\.\d+)?\s?(g|ml|kg|l)$/i, "");
  // the stop a batch is at: 0 to 8, or 9 once it has cleared
  const at = it => (it.current >= 0 ? it.current : 9);
  // the batch's state in words, for its head: the hero model's ETA for the chips; the Mango Drink waits on its photo
  function stateOf(it, s) {
    if (it.hero) { const hm = S.heroModel(s); return { text: hm.eta, tone: hm.etaTone, live: !!hm.agentLive }; }
    return { text: `Vision is waiting for ${it.dist.name}' label photo`, tone: "green", live: true };
  }

  /* ---------- the parts of a batch ---------- */
  // each shows one screen of the app as it is; a part is where the batch stands from its first stop to its last
  const PARTS = [
    { id: "journey", label: "Journey", short: "Journey", icon: "radar", from: 1, to: 1, ahead: "" },
    { id: "route", label: "Route Room", short: "Route", icon: "route", from: 2, to: 5, ahead: "from Verify" },
    { id: "execution", label: "Execution", short: "Execution", icon: "activity", from: 6, to: 6, ahead: "starts on approval" },
    { id: "paperwork", label: "Paperwork", short: "Papers", icon: "file-text", from: 7, to: 7, ahead: "after the lines close" },
  ];
  const PART_IDS = PARTS.map(p => p.id);
  // where a batch opens: the part for the stop it is at (its journey before Verify and once it has cleared)
  const partAt = it => (PARTS.find(p => p.id !== "journey" && at(it) >= p.from && at(it) <= p.to) || PARTS[0]).id;
  // a part, for a batch: here (where it stands; amber when it waits for a person's yes), done, or not yet
  function partState(it, p) {
    const i = at(it);
    if (p.id === partAt(it) && p.id !== "journey") return { here: true, human: it.human, words: it.human ? "needs your yes" : "working now" };
    if (p.id === "journey") return { words: "" };
    if (i < p.from) return { ahead: true, words: p.ahead };
    return { done: true, words: "done" };
  }

  // a part's screen for a batch not yet there, in the app's own words
  function NotYet({ me, title, icon, head, body }) { return <S.Screen me={me} title={title}><Card><Empty icon={icon} title={head} body={body} /></Card></S.Screen>; }
  function PartBody({ me, it, part }) {
    if (part === "journey") return <JourneyView me={me} it={it} />;
    if (part === "route") return <S.RouteRoom me={me} />;
    if (part === "execution") return it.hero ? <S.Execution me={me} /> : <NotYet me={me} title="Execution" icon="sparkles" head="Nothing is executing yet" body="Listing, outreach, negotiation and the food-bank booking start the moment the plan is approved." />;
    if (part === "paperwork") return it.hero ? <S.Paperwork me={me} /> : <NotYet me={me} title="Paperwork" icon="file-text" head="The pack follows the last of its lines" body={`Munchly's price-support credit note, the ITC memo and the FSSAI checklist, drafted by the Paperwork agent once every line of ${it.ref}'s plan is done.`} />;
    if (part === "report") return <S.Report me={me} />;
    return null;
  }

  /* ---------- the Journey view ---------- */
  // the Command Center's pieces for one batch: its tracker card, its cluster and its agents. head: false leaves the card
  // out where the frame already shows the batch (option C)
  const MANGO_TIMES = () => ({ detect: D.PUSH.detect.at, verify: D.PUSH.verify.at });
  function mangoFeed(v) {
    const gates = v.assess.gates.map(g => `${g.app} ${g.has}/${g.need}`).join(" · ");
    return [
      { id: "m1", stage: "detect", agent: "Watcher", icon: "radar", at: D.PUSH.detect.at, min: 0, text: `${v.id} fails all three quick-commerce gates; ${fmt.num(v.assess.atRisk)} of ${fmt.num(v.units)} units will not sell by ${fmt.date(v.bestBefore).replace(/ \d{4}$/, "")}.`, calls: [["gates.check", gates, "bad"], ["sellthrough.project", `${v.sellPerDay}/day × ${v.assess.usableDays} days = ${fmt.num(v.assess.willSell)} of ${fmt.num(v.units)}`, ""], ["pubsub.publish", "batch.at_risk", "ok"]] },
      { id: "m2", stage: "verify", agent: "Vision", icon: "scan-line", at: D.PUSH.verify.at, min: 5, text: `Asked ${v.dist.name} for one label photo before quoting any price.`, calls: [["fcm.send", v.dist.name, "ok"]] },
    ];
  }
  function JourneyView({ me, it, head = true, title = "Journey", before, after }) {
    const s = S.useStore(); const app = useApp(); const { go } = S.useRoute(); const hm = S.heroModel(s); const phone = app.bp === "phone"; const h = s.hero;
    const SHOPS = D.KIRANAS.length; const routed = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    let card = null;
    if (head && it.hero) {
      const primary = h.phase === "planned" ? <Button variant="approve" icon="check" onClick={() => go("route", { ref: it.ref })}>Review and approve</Button> : ["approved", "executing"].includes(h.phase) ? <Button variant="primary" iconRight="arrow-right" onClick={() => go("execution", { ref: it.ref })}>Watch execution</Button> : <Button variant="primary" iconRight="arrow-right" onClick={() => go("route", { ref: it.ref })}>Open Route Room</Button>;
      const money = h.plan ? <div className="stack tight" style={{ gap: 2 }}><Money value={h.posted ? D.ACTUAL.net : D.PLAN.net} size={phone ? "s" : "m"} roll style={{ color: "var(--primary-text)" }} /><span className="t-footnote subtle">{h.posted ? "recovered, after the negotiation" : routed ? "on plan · settles day 3–7" : "net recovered on the plan"} · swing {fmt.inr(h.posted ? D.ACTUAL.swing : D.PLAN.swing)}</span></div> : undefined;
      card = <TrackerCard view={hm.view} done={hm.done} current={hm.current} eta={hm.eta} etaTone={hm.etaTone} agentLive={hm.agentLive} primary={primary} money={money} />;
    } else if (head) card = <S.Live.MangoCard item={it} dim={false} />;
    const cluster = it.hero && <Card pad={false} className="stack" style={{ overflow: "hidden", gap: 0 }}>
      <div className="card-head" style={{ padding: "14px 16px 10px" }}><span className="card-title">{it.dist.city} cluster</span><Badge size="sm" tone={hm.ordered ? "green" : undefined} dot={!!hm.ordered}>{hm.ordered ? `${hm.ordered} of ${D.OFFERED} kiranas ordered` : h.offer ? `${D.OFFERED} kiranas messaged` : `${D.OFFERED} kiranas`}</Badge></div>
      <ClusterMap kiranas={D.KIRANAS} orderedCount={hm.ordered} route={routed} vanProgress={h.van.status === "done" ? 1 : hm.ordered / SHOPS * 0.6} height={phone ? 220 : 280} />
    </Card>;
    const events = it.hero ? s.feed : mangoFeed(it.view);
    const feed = <div className="stack snug"><S.SectionTitle sub="Every hand-off on this batch, as it happens">Agent activity</S.SectionTitle><Card><AgentFeed events={events} people={D.PEOPLE} live={it.hero && hm.agentLive ? s.feed.length - 1 : -1} max={phone ? 4 : 8} /></Card></div>;
    return <S.Screen me={me} title={title} sub={`${it.ref} · ${it.sku.brand} ${it.sku.name} · ${it.dist.name}, ${it.dist.city}`}>
      <S.Columns sideWidth={340} main={<>{before}{card}{after}{cluster}{!it.hero && !head && <Card><Empty icon="map" title={`${it.dist.city} cluster`} body={`The ${it.dist.city} kiranas appear here once the Router plans a kirana line for ${it.ref}.`} /></Card>}</>} side={feed} />
    </S.Screen>;
  }

  /* ---------- the batches the Watcher only watches ---------- */
  // every other batch in the stock export, nearest best-before first
  function watched(items) {
    return D.BATCHES.filter(b => !items.some(i => i.ref === b.id)).map(b => D.batchView(b)).sort((a, b) => a.daysLeft - b.daysLeft);
  }
  // one of them in a sheet, as the Batches screen opens it (brand.jsx's BatchSheet): its days, gates and figures, and
  // what happens to it next
  function WatchSheet({ view: v, onClose }) {
    const s = S.useStore();
    const next = !v ? "" : v.assess.status === "at-risk" ? `At risk: ${fmt.num(v.assess.atRisk)} packs will not sell before the last week. The Watcher checks every morning at ${s.rules.watchTime}, and flags it once Setup is confirmed and ${v.dist.name} has given ${D.PLATFORM.name} permission to act.`
      : v.assess.status === "gated" ? `Outside at least one quick-commerce gate, but real sell-through clears it in time. The Watcher checks again tomorrow at ${s.rules.watchTime}.` : "Inside every gate and selling through. Nothing to do.";
    return <K.Sheet open={!!v} onClose={onClose} title={v ? v.skuObj.name : ""}>{v && <div className="stack">
      <div className="row" style={{ gap: 14 }}><Product name={v.skuObj.img} size={88} /><div className="stack tight"><K.DaysNum days={v.daysLeft} life={v.skuObj.lifeDays} size="l" /><span className="t-footnote subtle">days left · best before {fmt.date(v.bestBefore)}</span></div></div>
      <K.GateChips gates={v.assess.gates} />
      <K.List>{[["Batch", v.id], ["Distributor", `${v.dist.name}, ${v.dist.city}`], ["Units", fmt.num(v.units)], ["Sells", `${v.sellPerDay} a day`], ["Will sell before the last week", fmt.num(v.assess.willSell)], ["At risk", v.assess.atRisk ? fmt.num(v.assess.atRisk) : "none"]].map(([k, val]) => <K.ListRow key={k} title={k} value={val} />)}</K.List>
      <p className="t-footnote muted">{next}</p>
    </div>}</K.Sheet>;
  }

  /* ---------- the shell ---------- */
  function SbItem({ icon, label, on, onClick, count, children, className }) {
    return <button type="button" className={cx("sb-item", className)} aria-current={on ? "page" : undefined} onClick={onClick}>{icon && <Icon name={icon} size={19} />}<span>{label}</span>{count != null && <span className="sb-n">{count}</span>}{children}</button>;
  }
  // a batch in the sidebar: its product, its short name and the stop it is at (amber when it waits for a yes)
  function SbBatch({ it, on, onClick }) {
    return <button type="button" className="sb-item sb-batch" aria-current={on ? "page" : undefined} onClick={onClick} aria-label={`${it.sku.name}, ${it.ref}, at ${it.stop}${it.human ? ", needs your yes" : ""}`}>
      <span className="sbb-pic" aria-hidden="true"><Product name={it.sku.img} size={24} alt="" /></span>
      <span className="sbb-name">{shortName(it.sku)}</span>
      <span className={cx("sbb-stop", it.human && "human")} aria-hidden="true"><i />{it.stop}</span>
    </button>;
  }
  // the kit's Shell, with the desktop sidebar's middle given as menu (phones and tablets keep the kit's tab bar and rail)
  function DeskShell({ nav, current, onNav, menu, user, onUser, ws, onWorkspace, children }) {
    const app = useApp();
    if (app.bp !== "desktop" || !menu) return <K.Shell nav={nav} current={current} onNav={onNav} user={user} onUser={onUser} ws={ws} onWorkspace={onWorkspace}>{children}</K.Shell>;
    return <div className="layer" style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "var(--sidebar-w) minmax(0,1fr)" }}>
      <nav className="sidebar sc112-side" aria-label="Main">
        <div className="sb-brand"><Mark size={32} /><Wordmark size={18} /></div>
        {ws && <button type="button" className="sb-ws" onClick={onWorkspace} aria-label={`${ws.name} workspace, ${ws.domain}`}><WorkspaceMark ws={ws} size={30} /><span className="who"><span className="ws-name"><b>{ws.name}</b><Icon name="chevron-down" size={15} className="subtle" /></span><span className="ws-dom">{ws.domain}</span></span></button>}
        <div className="sc112-menu">{menu}</div>
        <div className="sb-foot">{user && <button type="button" className="sb-user" onClick={onUser} title={`${user.name} · ${user.role}`}><Avatar person={user} size="sm" /><span className="who"><b>{user.name}</b><span>{user.role}</span></span><Icon name="ellipsis" size={18} className="subtle" /></button>}</div>
      </nav>
      <div className="scroll" style={{ position: "relative", minWidth: 0 }} id="main">{children}</div>
    </div>;
  }
  // RoleApp's wrapping (screens/roles.jsx), for the operator: the router, the workspace, pushes, the shell and the
  // screen's entrance. dir: +1 moving down the batch's journey (the screen rises from below), -1 back up it
  // screenKey: what the entrance plays on (a batch's frame keeps it across its own screens, so its head stays put);
  // scrollKey: what starts the page again at its top
  function Chrome({ me, route, onGo, onBack, nav, current, onNav, menu, screenKey, scrollKey, dir = 0, className, pushStep, children }) {
    const reduce = useReducedMotion(); const top = useRef(null); const [wsOpen, setWsOpen] = useState(false);
    const W = D.WORKSPACE; const display = Object.assign({}, me, { role: S.ROLES[me.role] });
    React.useLayoutEffect(() => { const el = top.current; const sc = el && el.closest(".scroll"); if (sc) sc.scrollTop = 0; }, [scrollKey || screenKey]);
    useEffect(() => setWsOpen(false), [me.id]);
    const ws = { name: W.name, domain: W.domain, open: () => setWsOpen(true) };
    const y = dir > 0 ? 22 : dir < 0 ? -22 : 6;
    const allowed = ["command", "batches", "setup", "report", "inbox", "profile"].concat(PART_IDS);
    const openNote = n => { window.SC3_STORE.update(st => { const x = st.notifications.find(z => z.id === n.id); if (x) x.read = true; }); if (n.link && allowed.includes(n.link)) onGo({ name: n.link }); };
    const home = (nav.find(n => n.id === "command") || nav[0]).label;
    const body = <DeskShell nav={nav} current={current} onNav={onNav} menu={menu} user={display} onUser={() => onGo({ name: "profile" })} ws={W} onWorkspace={() => setWsOpen(true)}>
      {pushStep ? <S.Live.PushStep me={me} home={home} {...pushStep} /> : <AnimatePresence mode="wait" initial={false}>
        <motion.div key={screenKey} ref={top} className={className} initial={reduce ? false : { opacity: 0, y }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -y / 2 }} transition={{ duration: dir ? 0.26 : 0.18, ease: EASE }}>
          {children}
        </motion.div>
      </AnimatePresence>}
    </DeskShell>;
    return <S.Router route={route} onGo={r => onGo(r)} onBack={onBack}><S.WorkspaceCtx.Provider value={ws}>
      <S.PushBanners key={me.id} me={me} onOpen={openNote} />{body}
      <S.WorkspaceSheet open={wsOpen} onClose={() => setWsOpen(false)} me={me} onSettings={null} />
    </S.WorkspaceCtx.Provider></S.Router>;
  }
  // the label of the place a batch was opened from, for its back link: remembered as the person enters a batch
  function useCameFrom(name, inBatch, labels) {
    const prev = useRef(name); const from = useRef("command");
    if (prev.current !== name) { if (inBatch && !inBatch(prev.current)) from.current = prev.current; prev.current = name; }
    return { id: from.current, label: labels[from.current] || "Command Center" };
  }
  const LABELS = { command: "Command Center", batches: "Batches", inbox: "Inbox", report: "Finance & ESG", setup: "Setup", profile: "Profile" };

  // RoleApp for every role: the operator gets the option's, everyone else the app's own
  function roleApp(Operator) {
    return function RoleApp(props) { return props.me.role === "operator" ? <Operator {...props} /> : <OrigRoleApp {...props} />; };
  }

  Object.assign(S.SC112, { EASE, journeys, find, shortName, at, stateOf, PARTS, PART_IDS, partAt, partState, PartBody, JourneyView, NotYet, watched, WatchSheet, SbItem, SbBatch, DeskShell, Chrome, useCameFrom, LABELS, roleApp, OrigRoleApp, MANGO_TIMES });
})();

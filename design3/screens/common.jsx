// Smart-Clearance v3 · screens shared by the demo and the app: store hook, router, the hero batch's live model, page chrome
(function () {
  const { useSyncExternalStore, createContext, useContext, useState, useRef, useCallback, useEffect, Fragment } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW; const fmt = M.fmt;
  const { Icon, IconButton, Avatar, Badge, Button, useApp, Page, ModeMenuButton, Menu, cx } = K;
  const { motion, AnimatePresence, useReducedMotion } = Motion;

  const useStore = () => useSyncExternalStore(Store.subscribe, Store.get);

  // a small router: the app binds it to the URL hash, the demo gives each device frame its own
  const RouteCtx = createContext({ route: { name: "command" }, go: () => {}, back: () => {} });
  function Router({ initial = "command", route: controlled, onGo, onBack, children }) {
    const [inner, setInner] = useState(() => (typeof initial === "string" ? { name: initial } : initial));
    const stack = useRef([]);
    const route = controlled || inner;
    const go = useCallback((name, params) => { if (onGo) onGo({ name, params }); else { stack.current.push(inner); setInner({ name, params }); } }, [onGo, inner]);
    const back = useCallback(() => { if (onBack) onBack(); else setInner(stack.current.pop() || (typeof initial === "string" ? { name: initial } : initial)); }, [onBack, initial]);
    return <RouteCtx.Provider value={{ route, go, back }}>{children}</RouteCtx.Provider>;
  }
  const useRoute = () => useContext(RouteCtx);

  // the hero batch, read from the store: phase, tracker position, ETA, which agent is working
  const PHASE_STATUS = { watching: "watching", "at-risk": "at-risk", verified: "routing", valued: "routing", planned: "awaiting", approved: "executing", executing: "executing", dispatched: "dispatched", settled: "settled", cleared: "cleared" };
  function heroModel(s) {
    const h = s.hero; const view = D.batchView(D.BATCHES[0]); const idx = Flow.stageOf(s);
    view.phase = PHASE_STATUS[h.phase];
    const ordered = h.orders.length, orderedUnits = h.orders.reduce((t, o) => t + o.units, 0);
    let eta = "", etaTone = "green", agentLive = "";
    if (h.phase === "watching") { eta = "Watcher runs daily at 09:00"; etaTone = undefined; }
    else if (h.phase === "at-risk") { eta = h.photo.status === "reading" ? "Reading the label" : "Plan ready in about 20 min"; agentLive = h.photo.status === "reading" ? "Vision is reading the label" : h.photo.status === "requested" ? "Vision is waiting for the label photo" : "Vision is asking for a label photo"; }
    else if (h.phase === "verified") { eta = "Pricing six channels"; agentLive = "Valuer is pricing six channels"; }
    else if (h.phase === "valued") { eta = "Splitting the batch"; agentLive = "Router is splitting the batch"; }
    else if (h.phase === "planned") { eta = "Waiting for your approval"; etaTone = "amber"; }
    else if (h.phase === "approved" || h.phase === "executing") { eta = h.award ? `Awarded at ₹${D.COUNTER.price.toFixed(2)} · ${ordered} of ${D.KIRANAS.length} kiranas ordered` : `Listing live · ${ordered} of ${D.KIRANAS.length} kiranas ordered`; agentLive = h.award && ordered === D.KIRANAS.length ? "" : "Lister, Outreach and Negotiator at work"; }
    else if (h.phase === "dispatched") { eta = "Paperwork in progress"; agentLive = "Paperwork is drafting the pack"; }
    else if (h.phase === "settled") { eta = "Papers ready · ledger next"; agentLive = "Impact is posting the ledger"; }
    else if (h.phase === "cleared") { eta = "Cleared · 0 cartons destroyed"; }
    return { h, view, idx, done: Math.min(idx, 9), current: idx < 9 ? idx : -1, eta, etaTone, agentLive, ordered, orderedUnits, plan: D.PLAN };
  }
  const unreadFor = (s, me) => s.notifications.filter(n => n.to === (me && me.id) && !n.read).length;

  // page chrome: inbox bell, appearance, the person
  function TopActions({ me, extra }) {
    const s = useStore(); const { go } = useRoute(); const app = useApp();
    const n = unreadFor(s, me);
    return <Fragment>{extra}<ModeMenuButton /><IconButton icon="bell" label={n ? `${n} unread notifications` : "Notifications"} badge={n || undefined} onClick={() => go("inbox")} />{me && <button type="button" className="iconbtn" style={{ width: 40 }} aria-label="Profile and settings" onClick={() => go("profile")}><Avatar person={me} size="sm" /></button>}</Fragment>;
  }
  function Screen({ me, title, sub, back, children, actions, wide, hideLarge }) {
    const { back: goBack } = useRoute();
    return <Page title={title} sub={sub} back={back} onBack={goBack} actions={<TopActions me={me} extra={actions} />} wide={wide} hideLarge={hideLarge}>{children}</Page>;
  }
  // two columns on desktop, one on phones and tablets
  function Columns({ main, side, sideWidth = 360, gap = 20 }) {
    const app = useApp();
    if (app.bp !== "desktop") return <div className="stack" style={{ gap }}>{main}{side}</div>;
    return <div style={{ display: "grid", gridTemplateColumns: `minmax(0, 1fr) ${sideWidth}px`, gap, alignItems: "start" }}><div className="stack" style={{ gap }}>{main}</div><div className="stack" style={{ gap, position: "sticky", top: 72 }}>{side}</div></div>;
  }
  function SectionTitle({ children, right, sub }) { return <div className="row between wrap" style={{ gap: 8, marginTop: 6 }}><div><div className="t-title3">{children}</div>{sub && <div className="t-footnote subtle" style={{ marginTop: 2 }}>{sub}</div>}</div>{right}</div>; }
  function Locked({ icon = "sparkles", agent, text, live }) {
    return <div className="card pad row" style={{ gap: 14, borderStyle: "dashed" }}><K.Aura on={live} className="icontile soft" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name={icon} size={19} /></K.Aura><div className="stack tight" style={{ gap: 2 }}><b className="t-subhead">{agent}</b><span className="t-footnote muted">{text}</span></div>{live && <span className="typing" style={{ marginLeft: "auto" }}><i /><i /><i /></span>}</div>;
  }
  // the app's account controls (switch person, sign out, install); the demo leaves it empty
  const AccountCtx = createContext({});
  // in the app, a quiet way to step into the partner the journey is waiting on
  function PlayAs({ who, route, children }) {
    const acc = useContext(AccountCtx); const p = D.PEOPLE[who];
    if (!acc.switchTo || !p) return null;
    return <button type="button" className="playas" onClick={() => acc.switchTo(who, route)}><Avatar person={p} size="xs" /><span>{children || `Continue as ${p.short}`}</span><Icon name="arrow-right" size={14} /></button>;
  }
  // in-app banners for notifications that arrive while the person has the app open
  function PushBanners({ me, onOpen }) {
    const s = useStore(); const { push } = K.useNotice(); const seen = useRef(null);
    useEffect(() => {
      const mine = s.notifications.filter(n => n.to === me.id);
      if (seen.current === null) { seen.current = new Set(mine.map(n => n.id)); return; }
      mine.forEach(n => { if (n.read) seen.current.add(n.id); });
      mine.filter(n => !seen.current.has(n.id) && !n.read).reverse().forEach(n => { seen.current.add(n.id); push({ title: n.title, body: n.body, at: n.at, hindi: n.hindi, onOpen: () => onOpen && onOpen(n) }); });
    }, [s.notifications, me.id]);
    return null;
  }
  // a phone's lock screen with one push: the trigger for every human moment in the journey
  function LockScreen({ who, push, time, date, onOpen }) {
    const reduce = useReducedMotion(); const p = (Store.get().users.find(u => u.id === who)) || D.PEOPLE[who] || {}; const hindi = push && /[ऀ-ॿ]/.test(push.body);
    return <div className="lock" onClick={push ? onOpen : undefined}>
      <div className="lock-top"><Icon name="lock" size={16} stroke={2.4} /><div className="lock-date">{date}</div><div className="lock-time">{time}</div></div>
      <AnimatePresence>{push && <motion.button type="button" key={push.title} className="lock-note" onClick={e => { e.stopPropagation(); onOpen(); }} initial={reduce ? false : { opacity: 0, y: -26, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
        <span className="ln-head"><K.Mark size={22} still /><span>Smart-Clearance</span><span className="ln-now">now</span></span>
        <b>{push.title}</b><span className={cx("ln-body", hindi && "hi")} lang={hindi ? "hi" : undefined}>{push.body}</span>
      </motion.button>}</AnimatePresence>
      <div className="lock-foot">{push ? "Tap the notification to open" : `${p.short || p.name}'s phone`}</div>
    </div>;
  }

  const PEOPLE_BY_ID = id => D.PEOPLE[id] || (Store.get().users.find(u => u.id === id) || { name: id });

  window.SC3_SCREENS = Object.assign(window.SC3_SCREENS || {}, { LockScreen, AccountCtx, PlayAs, PushBanners, useStore, Router, useRoute, heroModel, unreadFor, TopActions, Screen, Columns, SectionTitle, Locked, PEOPLE_BY_ID, PHASE_STATUS });
})();

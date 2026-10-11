// Smart-Clearance v3 · screens shared by the demo and the app: store hook, router, the hero batch's live model, page chrome
(function () {
  const { useSyncExternalStore, createContext, useContext, useState, useRef, useCallback, useEffect, Fragment } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW; const fmt = M.fmt;
  const { Icon, IconButton, Avatar, Badge, Button, useApp, Page, ModeMenuButton, Menu, Skeleton, cx } = K;
  const { motion, AnimatePresence, useReducedMotion } = Motion;

  const useStore = () => useSyncExternalStore(Store.subscribe, Store.get);

  // a photo that loads from the network (SC-144): the kit's Skeleton holds its frame until it has loaded, then it fades
  // in; one that does not load says so. Its frame is positioned (.cam, .rec-shot, .rec-big), and the photo fills it. The
  // frames are near-black and the shimmer is a translucent tint, so the skeleton sits on the page's own surface, under
  // the photo's tag (SC-146)
  function Photo({ src, alt = "", className, style, ...rest }) {
    const [st, setSt] = useState("loading"); const ref = useRef(null);
    useEffect(() => { const i = ref.current; setSt(i && i.complete && i.naturalWidth ? "ready" : "loading"); }, [src]);
    const shown = style && style.opacity != null ? style.opacity : 1;
    return <>
      {st === "loading" && <Skeleton r={0} style={{ position: "absolute", inset: 0, height: "auto", zIndex: 1, borderRadius: "inherit", backgroundColor: "var(--surface-2)" }} />}
      {st === "failed" && <span className="photo-failed"><Icon name="image" size={20} /><span className="t-caption">The photo did not load</span></span>}
      <img ref={ref} src={src} alt={alt} className={className} onLoad={() => setSt("ready")} onError={() => setSt("failed")} style={{ ...style, opacity: st === "ready" ? shown : 0, transition: "opacity 240ms var(--ease)" }} {...rest} />
    </>;
  }

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
  // the batch is the journey's own (SC-168, data.js STORIES): the chips, or the Mango Drink in its own journey
  function heroModel(s) {
    const h = s.hero, C = D.story(s); const view = D.batchView(C.batch); const idx = Flow.stageOf(s);
    view.phase = PHASE_STATUS[h.phase];
    const ordered = h.orders.length, orderedUnits = h.orders.reduce((t, o) => t + o.units, 0);
    let eta = "", etaTone = "green", agentLive = "";
    if (h.phase === "watching") { eta = "Watcher runs daily at 09:00"; etaTone = undefined; }
    else if (h.phase === "at-risk") { eta = h.photo.status === "reading" ? "Reading the label" : `Plan ready in about ${D.JOURNEY.planMinutes} min`; agentLive = h.photo.status === "reading" ? "Vision is reading the label" : h.photo.status === "requested" ? "Vision is waiting for the label photo" : "Vision is asking for a label photo"; }
    else if (h.phase === "verified") { eta = "Pricing five channels"; agentLive = "Valuer is pricing five channels"; }
    else if (h.phase === "valued") { eta = "Splitting the batch"; agentLive = "Router is splitting the batch"; }
    else if (h.phase === "planned") { eta = "Waiting for your approval"; etaTone = "amber"; }
    else if (h.phase === "approved" || h.phase === "executing") {
      // what is under way follows the plan's lines (SC-85): the lot and the scheme, or the scheme and the donation
      const has = id => C.plan.lines.some(l => l.id === id && l.units > 0), shops = `${ordered} of ${C.kiranas.length} kiranas ordered`;
      if (has("expiresoon")) { eta = h.award ? `Awarded at ₹${C.counter.price.toFixed(2)} · ${shops}` : `Listing live · ${shops}`; agentLive = h.award && ordered === C.kiranas.length ? "" : "Lister, Outreach and Negotiator at work"; }
      else { eta = has("kirana") ? `Scheme open · ${shops}` : "Carrying out the plan"; const at = [has("kirana") && "Outreach", has("foodbank") && "Donation"].filter(Boolean); agentLive = at.length ? `${at.join(" and ")} at work` : ""; }
    }
    else if (h.phase === "dispatched") { eta = "Paperwork in progress"; agentLive = "Paperwork is drafting the pack"; }
    else if (h.phase === "settled") { eta = "Papers ready · ledger next"; agentLive = "Impact is posting the ledger"; }
    else if (h.phase === "cleared") { eta = h.destruction ? `Cleared · ${h.destruction.units} packs destroyed at the godown` : "Cleared · 0 cartons destroyed"; }
    // packs destroyed at the distributor's godown (SC-139): the batch waits on the evidence, then on the second yes
    const dz = h.destruction && h.phase !== "cleared" ? h.destruction.status : null;
    if (dz === "requested" || dz === "asked") { const who = C.dist.short; eta = `Waiting for ${who + (/s$/.test(who) ? "'" : "'s")} destruction evidence`; etaTone = "amber"; agentLive = ""; }
    else if (dz === "reading") { eta = "Checking the destruction's evidence"; agentLive = "Vision is checking the evidence"; }
    else if (dz === "checked") { eta = "The destruction waits for your yes"; etaTone = "amber"; agentLive = ""; }
    return { h, view, idx, done: Math.min(idx, 9), current: idx < 9 ? idx : -1, eta, etaTone, agentLive, ordered, orderedUnits, plan: C.plan };
  }
  // the journey's story (data.js STORIES) as a screen reads it, kept up to date with the store
  const useStory = () => D.story(useStore());
  const unreadFor = (s, me) => s.notifications.filter(n => n.to === (me && me.id) && !n.read).length;

  // page chrome: inbox bell, appearance, the person
  function TopActions({ me, extra }) {
    const s = useStore(); const { go } = useRoute(); const app = useApp();
    const n = unreadFor(s, me);
    return <Fragment>{extra}{app.bp !== "phone" && <ModeMenuButton />}<IconButton icon="bell" label={n ? `${n} unread notifications` : "Notifications"} badge={n || undefined} onClick={() => go("inbox")} />{me && <button type="button" className="iconbtn" style={{ width: 40 }} aria-label="Profile and settings" onClick={() => go("profile")}><Avatar person={me} size="sm" /></button>}</Fragment>;
  }
  // the client workspace the person is in; RoleApp provides it, and on a phone it sits at the left of the bar
  const WorkspaceCtx = createContext(null);
  // the workspace on a live backend (SC-73, SC-68 option B): the connection, the journey clock, the batches flagged, a
  // step that failed. The app provides it in its live mode (?live); the stub and the guided demo leave it null, so no
  // screen changes there. Its pieces are screens/live.jsx's (window.SC3_SCREENS.Live)
  const LiveCtx = createContext(null);
  const useLive = () => useContext(LiveCtx);
  // a screen of a batch (SC-112): the operator's batch page gives each of its screens the batch's head (its pack, name,
  // id, distributor and state, then its screens as tabs) in place of the screen's own title and the row under it, with
  // the screen's own line under the tabs, and a back link to where the batch was opened from. RoleApp provides it; the
  // screens' bodies are as they were
  const BatchCtx = createContext(null);
  // below: a row under the large title (the Route Room's batch tabs)
  function Screen({ me, title, sub, back, children, actions, wide, hideLarge, below }) {
    const frame = useContext(BatchCtx);
    if (frame) { title = frame.title; back = frame.back; below = <>{frame.head}{sub ? <div className="bh-sub">{sub}</div> : null}</>; hideLarge = true; sub = null; }
    const { back: goBack } = useRoute(); const app = useApp(); const ws = useContext(WorkspaceCtx); const live = useLive(); const L = live && window.SC3_SCREENS.Live;
    const lead = app.bp === "phone" && ws ? <button type="button" className="ws-lead" onClick={ws.open} aria-label={`${ws.name} workspace, on Smart-Clearance`}><K.Mark size={24} still /><span className="ws-sep" aria-hidden="true" /><K.WorkspaceMark ws={D.WORKSPACE} size={26} /></button> : null;
    // live: every page says under its title whether it is live and what journey time it is; a dropped stream is a band
    const subNode = L ? <><span className="lv-subtext">{sub}</span><L.Line /></> : sub;
    return <Page title={title} sub={subNode} back={back} onBack={goBack} lead={lead} actions={<TopActions me={me} extra={actions} />} wide={wide} hideLarge={hideLarge} below={below} top={L ? <L.Band /> : null} barSub={L ? <L.BarSub /> : null}>{children}</Page>;
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
    const acc = useContext(AccountCtx); const p = D.story(Store.get()).people[who] || Store.get().users.find(u => u.id === who);
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
        <span className="ln-head">{push.app ? <><span className="ln-app" aria-hidden="true"><Icon name={push.icon || "message-circle"} size={14} stroke={2.2} /></span><span>{push.app}</span></> : <><K.Mark size={22} still /><span>Smart-Clearance</span></>}<span className="ln-now">now</span></span>
        <b>{push.title}</b><span className={cx("ln-body", hindi && "hi")} lang={hindi ? "hi" : undefined}>{push.body}</span>
      </motion.button>}</AnimatePresence>
      <div className="lock-foot">{push ? "Tap the notification to open" : `${p.short || p.name}'s phone`}</div>
    </div>;
  }

  /* ---------- the journey clock explained (SC-176, option B) ---------- */
  // A synthetic workspace replays the story's own calendar, so its batches keep their best-before dates and every figure
  // holds. Wherever the journey's date and time show (the clock under every title, a batch's head, the console's client
  // head), a note under them says so, and "How to reset or fast-forward" opens one guide: why, the journey time now, and
  // how Smart-Clearance staff start the journey again or move it forward in the console. Shown to everyone: a judge may
  // sign in as anyone.
  const CONSOLE_URL = "https://smartclearance-console.web.app";
  const dayPace = m => (m >= 1440 ? "real time" : m >= 60 ? `1 day = ${Math.round(m / 6) / 10} h` : `1 day = ${m} min`);
  const ClockStep = ({ n, children }) => <li className="jc-step"><span className="jc-n" aria-hidden="true">{n}</span><span>{children}</span></li>;
  const Ui = ({ children }) => <b className="jc-ui">{children}</b>;
  // client: the workspace's name; clock: the journey's { date, long, time, perDay }, when there is one; here: opened in
  // the console, which needs no way to the console
  function ClockGuide({ open, onClose, client, clock, here }) {
    return <K.Sheet open={open} onClose={onClose} title="Prototype time" detent="large"
      footer={here ? <Button variant="secondary" size="lg" block onClick={onClose}>Close</Button> : <><Button variant="primary" size="lg" block icon="external-link" onClick={() => window.open(CONSOLE_URL, "_blank", "noopener")}>Open the console</Button><Button variant="ghost" block onClick={onClose}>Close</Button></>}>
      <div className="jc-body">
        <p className="jc-lede">This is a prototype. {client}' workspace runs on a <b>fixed dataset</b>: its SKUs and their batches, each batch with its own best-before date. So that the gates, the sell-through and every figure come out as the story has them, the workspace keeps <b>its own journey clock</b>. It starts on the story's day 0, not on today's date, and a journey day can be shorter than a real one.</p>
        {clock && <div className="jc-now"><Icon name="calendar-clock" size={18} /><span className="jc-now-t"><span className="jc-now-k">Journey time now</span><span className="jc-now-v tnum">{clock.long || clock.date}, {clock.time}</span></span><span className="jc-now-p"><Icon name={clock.perDay >= 1440 ? "clock" : "fast-forward"} size={13} stroke={2.2} />{dayPace(clock.perDay)}</span></div>}
        <section className="jc-sec" aria-labelledby="jc-reset">
          <h3 id="jc-reset" className="jc-h"><Icon name="rotate-ccw" size={16} />Start the journey again</h3>
          <p className="jc-where">{here ? "Here in the console:" : <>In the staff console (<span className="jc-url">smartclearance-console.web.app</span>), signed in as Smart-Clearance staff:</>}</p>
          <ol className="jc-steps">
            <ClockStep n="1"><Ui>Clients</Ui>, then <Ui>{client}</Ui>.</ClockStep>
            <ClockStep n="2">The client's actions menu <span className="jc-key" aria-hidden="true">⋯</span><span className="sr-only">(More)</span>, then <Ui>Reset journey…</Ui></ClockStep>
            <ClockStep n="3">Pick how long a journey day lasts, such as <Ui>Demo</Ui> (five minutes a day), then <Ui>Reset journey</Ui>.</ClockStep>
          </ol>
          <p className="jc-foot">Back to day 0 with the story's batches. The client's setup stays: gates, overrides, guardrails, agents and people.</p>
        </section>
        <section className="jc-sec" aria-labelledby="jc-ff">
          <h3 id="jc-ff" className="jc-h"><Icon name="fast-forward" size={16} />Move it forward</h3>
          <ol className="jc-steps">
            <ClockStep n="1"><b>Shorter days.</b> The badge in the client's head (<Ui>Real time</Ui>), then <Ui>Rehearsal</Ui> (an hour a day), <Ui>Demo</Ui> (five minutes) or <Ui>Fast</Ui> (a minute).</ClockStep>
            <ClockStep n="2"><b>What falls due, now.</b> The <Ui>Agents</Ui> tab lists each agent's scheduled runs and timers with their journey time: <Ui>Run now</Ui> for the daily load and the Watcher's check, <Ui>Close now</Ui> for a kirana offer or an unsold lot, <Ui>Report now</Ui> for expiry day.</ClockStep>
          </ol>
          <p className="jc-foot">Afterwards, set the badge back to <Ui>Real time</Ui>, so the journey waits for the next demo.</p>
        </section>
      </div>
    </K.Sheet>;
  }
  // the note under the clock, and its guide
  function ClockNote({ client, clock, here }) {
    const [open, setOpen] = useState(false);
    return <><span className="jc-note"><Icon name="info" size={14} stroke={2.2} /><span><b>Prototype time:</b> the story's own calendar, so its batches' best-before dates hold. <button type="button" className="jc-link" onClick={() => setOpen(true)} aria-haspopup="dialog">How to reset or fast-forward</button></span></span><ClockGuide open={open} onClose={() => setOpen(false)} client={client} clock={clock} here={here} /></>;
  }
  // under the bar's collapsed title the note is its icon, opening the same guide
  function ClockInfo({ client, clock }) {
    const [open, setOpen] = useState(false);
    return <><button type="button" className="jc-info" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Prototype time: why this date, and how to reset or fast-forward the journey"><Icon name="info" size={14} stroke={2.2} /></button><ClockGuide open={open} onClose={() => setOpen(false)} client={client} clock={clock} /></>;
  }

  const PEOPLE_BY_ID = id => D.PEOPLE[id] || (Store.get().users.find(u => u.id === id) || { name: id });

  window.SC3_SCREENS = Object.assign(window.SC3_SCREENS || {}, { LockScreen, AccountCtx, WorkspaceCtx, LiveCtx, BatchCtx, useLive, PlayAs, Photo, ClockGuide, ClockNote, ClockInfo, PushBanners, useStore, useStory, Router, useRoute, heroModel, unreadFor, TopActions, Screen, Columns, SectionTitle, Locked, PEOPLE_BY_ID, PHASE_STATUS });
})();

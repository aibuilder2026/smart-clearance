// SC-68's mockups, part 2: Munchly's workspace on a live backend. One app for the three options: the scenario from
// ?state= (sign-in states, the push ask, the live states, the journey clock, several batches flagged), the screens
// that change forked from design3/screens (Command Center, Route Room, the approve sheet, the label photo, Setup's
// upload, a partner's quiet day), and the shell. Each option's own pieces come from window.SC68_OPT (option-x/opt.jsx),
// which loads after this file; the app starts on DOMContentLoaded, once both are in.
(function () {
  const { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS, X = window.SC68;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Sheet, Field, Input, Product, Money, DaysNum, GateChips, Tracker, VTracker, TrackerCompact, Progress, Skeleton, Empty, Mark, Wordmark, WorkspaceMark, PoweredBy, ThemeProvider, AppRoot, NoticeHost, useApp, useNotice, Aura, AgentFeed, ClusterMap, BatchRow, StatusBadge, SplitBar, MoneyPanel, ChannelBars, ChannelTable, Segmented, Stepper, Switch, Shell } = K;
  const WS = D.WORKSPACE;
  const EASE = [0.22, 1, 0.36, 1];
  const S_PATH = "M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5";

  /* ---------- the scenario ---------- */
  // who: the person signed in; route and ref: the screen and the batch in focus; stage: the journey's stage
  // (Flow.fastForward); two: the Watcher flagged two batches this morning; conn: the live stream; push: the ask's
  // variant; quiet: a day with nothing at risk; fail: Approve did not go through; upload: a file on its way
  const DAY = { date: "Fri 2 Oct", long: "Friday 2 October 2026", time: "09:31", perDay: 5 };
  const STATES = {
    "signin":         { label: "Sign-in", group: "Sign-in", screen: "signin" },
    "signin-wrong":   { label: "A wrong sign-in", group: "Sign-in", screen: "signin", si: "wrong" },
    "signin-busy":    { label: "Signing in", group: "Sign-in", screen: "signin", si: "busy" },
    "not-member":     { label: "Signed in, not a member", group: "Sign-in", screen: "signin", si: "notmember" },
    "firstload":      { label: "The first load", group: "Live states", who: "priya", route: "command", stage: 5, two: true, load: true, conn: "connecting" },
    "push-ask":       { label: "Push: the ask", group: "Push permission", who: "priya", route: "command", stage: 5, two: true, push: "ask" },
    "push-install":   { label: "Push: install first (iPhone)", group: "Push permission", who: "priya", route: "command", stage: 5, two: true, push: "install", phoneOnly: true },
    "push-denied":    { label: "Push: blocked", group: "Push permission", who: "priya", route: "command", stage: 5, two: true, push: "denied" },
    "live":           { label: "Live, two batches flagged", group: "Clock and focus", who: "priya", route: "command", stage: 5, two: true },
    "route-switch":   { label: "Switching batch in the Route Room", group: "Clock and focus", who: "priya", route: "route", ref: "MF-2410-118", stage: 5, two: true, switcher: true },
    "reconnecting":   { label: "Reconnecting", group: "Live states", who: "priya", route: "command", stage: 5, two: true, conn: "reconnecting" },
    "offline":        { label: "Offline", group: "Live states", who: "priya", route: "route", ref: "MF-2409-117", stage: 5, two: true, conn: "offline" },
    "quiet":          { label: "A quiet day", group: "Live states", who: "priya", route: "command", stage: 9, quiet: true, clock: { date: "Sat 31 Oct", long: "Saturday 31 October 2026", time: "09:14" } },
    "quiet-partner":  { label: "A quiet day, Rakesh bhai", group: "Live states", who: "rakesh", route: "home", stage: 9, quiet: true, clock: { date: "Sat 31 Oct", long: "Saturday 31 October 2026", time: "09:14" } },
    "quiet-kirana":   { label: "A quiet day, Ganesh ji", group: "Live states", who: "ganesh", route: "home", stage: 1, quiet: true, clock: { date: "Thu 1 Oct", long: "Thursday 1 October 2026", time: "17:05" } },
    "approve-failed": { label: "Approve failed", group: "Live states", who: "priya", route: "route", ref: "MF-2409-117", stage: 5, two: true, fail: true },
    "upload-photo":   { label: "Uploading the label photo", group: "Live states", who: "rakesh", route: "photo", stage: 2, photo: true, upload: "photo", clock: { date: "Fri 2 Oct", long: "Friday 2 October 2026", time: "09:18" } },
    "upload-dms":     { label: "Uploading the DMS export", group: "Live states", who: "priya", route: "setup", stage: 0, upload: "dms", desktopOnly: true, clock: { date: "Thu 1 Oct", long: "Thursday 1 October 2026", time: "16:33" } },
  };
  const Q = new URLSearchParams(location.search);
  const SHOT = Q.get("shot") === "1";
  const STATE = STATES[Q.get("state")] ? Q.get("state") : "live";
  const SCN = Object.assign({ state: STATE, conn: "live", since: (STATES[STATE].clock || DAY).time }, STATES[STATE]);
  const ScnCtx = createContext(SCN);
  const useScn = () => useContext(ScnCtx);

  // the journey clock steps by a quarter hour; at 1 day = 5 min that is every 3.1 s of real time. Still in a still.
  function useClock(base) {
    const [k, setK] = useState(0); const step = base.perDay * 60000 / 96;
    useEffect(() => { if (SHOT || base.perDay >= 1440) return; const t = setInterval(() => setK(x => x + 1), step); return () => clearInterval(t); }, [step]);
    if (!k) return base;
    const [h, m] = base.time.split(":").map(Number); const t = h * 60 + m + k * 15;
    return Object.assign({}, base, { time: String(Math.floor(t / 60) % 24).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0") });
  }

  /* ---------- the batches the Watcher flagged this morning ---------- */
  // the chips batch at Approve (the store's hero), and the Mango Drink batch at Verify, waiting for Lakshmi Agencies'
  // label photo. Every figure comes from money.js through data.js.
  const MANGO = D.BATCHES[1];
  function mangoView() { const v = D.batchView(MANGO); return v; }
  const mangoGates = v => v.assess.gates.map(g => `${g.app} ${g.has}/${g.need}`).join(" · ");
  function mangoFeed(v) {
    return [
      { id: "m1", stage: "detect", agent: "Watcher", icon: "radar", at: "09:00", min: 0, text: `MF-2410-118 fails all three quick-commerce gates; ${fmt.num(v.assess.atRisk)} of ${fmt.num(v.units)} units will not sell by ${fmt.date(v.bestBefore).replace(/ \d{4}$/, "")}.`, calls: [["gates.check", mangoGates(v), "bad"], ["sellthrough.project", `${v.sellPerDay}/day × ${v.assess.usableDays} days = ${fmt.num(v.assess.willSell)} of ${fmt.num(v.units)}`, ""], ["pubsub.publish", "batch.at_risk", "ok"]] },
      { id: "m2", stage: "verify", agent: "Vision", icon: "scan-line", at: "09:05", min: 5, text: "Asked Lakshmi Agencies for one label photo before quoting any price.", calls: [["fcm.send", "Lakshmi Agencies", "ok"]] },
    ];
  }
  function flaggedItems(s, scn) {
    const hm = S.heroModel(s);
    const chips = { ref: D.BATCHES[0].id, hero: true, view: hm.view, done: hm.done, current: hm.current, stop: D.STAGES[hm.current] ? D.STAGES[hm.current].title : "Cleared", human: hm.current === 5, eta: hm.eta, etaTone: hm.etaTone, agentLive: hm.agentLive, waiting: hm.current === 5 ? "Waiting for your yes" : hm.eta };
    if (!scn.two) return [chips];
    const v = mangoView();
    const mango = { ref: MANGO.id, view: v, done: 2, current: 2, stop: "Verify", human: false, eta: "Label photo asked at 09:05", etaTone: "green", agentLive: "Vision is waiting for Lakshmi Agencies' photo", waiting: "Waiting for Lakshmi Agencies' label photo" };
    return [chips, mango];
  }
  const itemFor = (items, ref) => items.find(i => i.ref === ref) || items[0];

  /* ---------- small pieces every option uses ---------- */
  // a flagged batch as one row: the pack, the batch, its stop on nine short segments, and where it waits
  function FlagRow({ item, onOpen, selected, dim }) {
    const v = item.view; const sku = v.skuObj;
    return <button type="button" className={cx("x68-flagrow", selected && "on")} onClick={onOpen} aria-current={selected ? "true" : undefined}>
      <Product name={sku.img} size={44} alt="" />
      <span className="x68-fr-main">
        <span className="x68-fr-top"><b>{sku.name}</b><span className="mono subtle t-caption">{v.id}</span></span>
        <span className="x68-fr-sub">{v.dist.name} · {v.daysLeft} days left</span>
        <Segs done={item.done} current={item.current} human={item.human} dim={dim} label={`${item.stop}, stop ${item.current + 1} of 9`} />
      </span>
      <span className="x68-fr-stop"><b>{item.stop}</b><span>{dim ? "paused" : item.human ? "your yes" : "agents"}</span></span>
      <Icon name="chevron-right" size={18} className="subtle" />
    </button>;
  }
  // nine short segments: done in green, the current half filled (amber when it waits on a person), grey when paused
  function Segs({ done, current, human, dim, label, small }) {
    return <span className={cx("x68-segs", small && "sm", dim && "dim")} role="img" aria-label={label}>{D.STAGES.map((st, i) => <i key={st.id} className={cx(i < done && "done", i === current && "now", i === current && human && "human")} />)}</span>;
  }

  // the push ask, its words by role and by what the browser allows (ask, install first, blocked)
  const ASK_WORDS = {
    operator: ["Get a push when a batch needs you", "The Watcher checks 312 batches at 09:00 every journey day. When one needs your yes, the plan reaches your lock screen with the money on it."],
    distributor: ["Get photo requests and orders as a push", "When Vision needs a label photo or your kiranas order on a scheme, it reaches your lock screen, in Hindi."],
    retailer: ["Get Rakesh Traders' offers as a push", "Schemes arrive in Hindi, ready to order in one tap."],
  };
  function PushContent({ variant, me, compact, onAllow, onLater, standalone }) {
    const app = useApp(); const [title, body] = ASK_WORDS[me.role] || ASK_WORDS.operator; const phone = app.bp === "phone";
    if (variant === "install") return <div className={cx("x68-push", compact && "compact")}>
      <span className="icontile blue x68-push-ic"><Icon name="bell-ring" size={19} /></span>
      <div className="x68-push-body">
        <b className="x68-push-t">On iPhone, add the app to your Home Screen first</b>
        <p>Safari only sends notifications to web apps opened from the Home Screen. It takes three taps.</p>
        <ol className="x68-steps">
          <li><span className="x68-stepn">1</span><span>Tap <b>Share</b><span className="x68-glyph"><Icon name="share-ios" size={15} /></span>in Safari's toolbar</span></li>
          <li><span className="x68-stepn">2</span><span>Choose <span className="x68-nowrap"><b>Add to Home Screen</b><span className="x68-glyph"><Icon name="square-plus" size={15} /></span></span></span></li>
          <li><span className="x68-stepn">3</span><span>Open <b>Clearance</b> from your Home Screen, then turn on notifications here</span></li>
        </ol>
        <div className="x68-push-acts"><Button variant="ghost" size="sm" onClick={onLater}>Not now</Button></div>
      </div>
    </div>;
    if (variant === "denied") return <div className={cx("x68-push", compact && "compact")}>
      <span className="icontile soft x68-push-ic"><Icon name="bell-off" size={19} /></span>
      <div className="x68-push-body">
        <b className="x68-push-t">Notifications are blocked</b>
        <p>Your browser blocks notifications from <span className="mono">{WS.domain}</span>. Everything still reaches your inbox (the bell) while they are off.</p>
        <ol className="x68-steps">{(phone ? [["In Chrome, open the menu (the three dots), then", "Settings", ""], ["Open", "Site settings", "and then Notifications"], ["Find", WS.domain, "and choose Allow"]] : [["Click", "the site settings icon", "at the left of the address bar"], ["Set", "Notifications", "to Allow"], ["Reload", "the page", ""]]).map(([a, b, c], i) => <li key={i}><span className="x68-stepn">{i + 1}</span><span>{a} <b>{b}</b> {c}</span></li>)}</ol>
        <div className="x68-push-acts"><Button variant="secondary" size="sm" icon="refresh-cw">Check again</Button><Button variant="ghost" size="sm" onClick={onLater}>Not now</Button></div>
      </div>
    </div>;
    return <div className={cx("x68-push", compact && "compact")}>
      <span className="icontile blue x68-push-ic"><Icon name="bell-ring" size={19} /></span>
      <div className="x68-push-body">
        <b className="x68-push-t">{title}</b>
        <p>{body}</p>
        <div className="x68-push-acts"><Button variant="primary" size="sm" icon="bell" onClick={onAllow}>Turn on notifications</Button><Button variant="ghost" size="sm" onClick={onLater}>Not now</Button></div>
      </div>
    </div>;
  }

  // what loads, in the shape of what is coming (SC-49's placeholders); one green wash crosses them while the read is out
  function Ph({ w = "100%", h = 12, r = 6, i = 0 }) { return <span className="x68-ph" style={{ width: w, height: h, borderRadius: r, "--i": i }} aria-hidden="true" />; }
  function CCSkeleton({ phone }) {
    const card = <div className="bezel"><div className="card raised x68-phcard" style={{ padding: phone ? 18 : 26 }}>
      <div className="row between"><Ph w={150} h={22} r={99} /><Ph w={140} h={12} i={1} /></div>
      <div style={{ display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr) 92px" : "minmax(0,1fr) 168px", gap: 18, marginTop: 14, alignItems: "center" }}>
        <div className="stack tight" style={{ gap: 12 }}><Ph w="62%" h={18} i={2} /><Ph w={phone ? 120 : 200} h={phone ? 56 : 84} r={14} i={3} /></div>
        <Ph w={phone ? 92 : 168} h={phone ? 92 : 150} r={22} i={2} />
      </div>
      <div className="stack tight" style={{ gap: 10, marginTop: 18 }}><Ph w={phone ? 120 : 180} h={28} r={8} i={4} /><Ph w="88%" h={12} i={5} /></div>
      <div style={{ marginTop: 22 }}>{phone ? <Ph h={58} r={16} i={6} /> : <div style={{ display: "grid", gridTemplateColumns: "repeat(9, minmax(0, 1fr))", gap: 10 }}>{D.STAGES.map((st, i) => <Ph key={st.id} h={8} r={4} i={i % 4 + 4} />)}</div>}</div>
      <div className="row between" style={{ marginTop: 22 }}><Ph w={190} h={26} r={99} i={6} /><Ph w={170} h={44} r={12} i={7} /></div>
    </div></div>;
    const rows = <div className="list">{[0, 1, 2, 3].map(i => <div key={i} className="list-row" style={{ gridTemplateColumns: "54px minmax(0,1fr)", minHeight: 78 }}><Ph w={54} h={54} r={14} i={i} /><span className="stack tight" style={{ gap: 8 }}><Ph w="46%" h={13} i={i + 1} /><Ph w="70%" h={10} i={i + 2} /><Ph w="58%" h={6} i={i + 3} /></span></div>)}</div>;
    if (phone) return <div className="stack x68-load" style={{ gap: 20 }} aria-busy="true">{card}<Ph w={160} h={18} />{rows}</div>;
    return <div className="x68-load" aria-busy="true" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 20, alignItems: "start" }}><div className="stack" style={{ gap: 20 }}>{card}<Ph w={160} h={20} />{rows}</div><div className="stack" style={{ gap: 12 }}><Ph w={150} h={20} /><div className="card" style={{ display: "grid", gap: 18 }}>{[0, 1, 2, 3].map(i => <div key={i} className="row top" style={{ gap: 12 }}><Ph w={34} h={34} r={11} i={i} /><span className="stack tight grow" style={{ gap: 8 }}><Ph w="40%" h={12} i={i + 1} /><Ph w="92%" h={10} i={i + 2} /><Ph w="60%" h={10} i={i + 3} /></span></div>)}</div></div></div>;
  }

  /* ---------- the tracker card, with what a live backend adds ---------- */
  // K.TrackerCard, plus: dim (the stream is paused, so the agent line holds and says since when), head (a slot at the
  // card's top right for the clock, option C), note (a line under the actions), money for any batch
  function TrackerCard68({ item, primary, money, line, dim, head, note, cluster }) {
    const app = useApp(); const phone = app.bp === "phone"; const live = X.useLive();
    const view = item.view; const a = view.assess; const sku = view.skuObj; const stages = D.STAGES.map(st => ({ id: st.id, title: st.title, human: st.human }));
    return <div className="bezel"><div className={cx("card raised", dim && "x68-dimcard")} style={{ padding: phone ? 18 : 26, overflow: "hidden" }}>
      <div className="row between wrap" style={{ gap: 8 }}>
        <div className="row tight wrap"><StatusBadge status={view.phase || a.status} live={!dim && (view.phase ? view.phase === "executing" : a.status === "at-risk")} /><span className="mono subtle t-footnote">{view.id}</span></div>
        {head || <span className="row tight subtle t-footnote"><Icon name="map-pin" size={15} />{view.dist.name} · {view.dist.city}</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr) 92px" : "minmax(0,1fr) 168px", gap: phone ? 12 : 20, alignItems: "center", marginTop: phone ? 10 : 6 }}>
        <div style={{ minWidth: 0 }}>
          <div className="t-headline" style={{ fontSize: phone ? 17 : 19 }}>{sku.brand} {sku.name}</div>
          {head && <div className="t-footnote subtle" style={{ marginTop: 2 }}>{view.dist.name} · {view.dist.city}</div>}
          <div className="row base" style={{ gap: phone ? 10 : 14, marginTop: phone ? 6 : 10, flexWrap: "wrap" }}>
            <DaysNum days={view.daysLeft} life={sku.lifeDays} size={phone ? "l" : "xl"} style={{ color: a.status === "at-risk" && !view.phase ? "var(--red-text)" : "var(--fg)" }} />
            <span className="stack tight" style={{ gap: 2 }}><span className="t-callout strong">days left</span><span className="t-footnote subtle">best before {fmt.date(view.bestBefore)}</span></span>
          </div>
        </div>
        <Product name={sku.img} size={phone ? 92 : 168} float={!dim} alt={sku.name} />
      </div>
      <div className="row wrap" style={{ gap: phone ? 10 : 18, marginTop: phone ? 12 : 16, alignItems: "flex-end" }}>
        {money}
        <div className="grow t-subhead muted" style={{ minWidth: 220, maxWidth: 520 }}>{line || `Blocked from Blinkit, Zepto and Instamart. ${fmt.num(a.atRisk)} of ${fmt.num(view.units)} units will not sell by ${fmt.date(view.bestBefore).replace(/ \d{4}$/, "")}.`}</div>
      </div>
      <div style={{ marginTop: phone ? 14 : 22 }} className={dim ? "x68-dimtrack" : undefined}>
        {phone ? <TrackerCompact done={item.done} current={item.current} /> : <Tracker stages={stages} done={item.done} current={item.current} times={K.STAGE_TIMES} />}
      </div>
      <div className="row between wrap" style={{ marginTop: phone ? 16 : 20, gap: 10 }}>
        <div className="row tight wrap">
          {dim ? <span className="row tight t-footnote x68-paused"><X.ConnMark conn={live.conn} />{live.conn === "offline" ? `Offline · as of ${live.since}` : `Updates paused at ${live.since}`}</span>
            : <>{item.eta && <Badge tone={item.etaTone || "green"} icon="clock">{item.eta}</Badge>}
              {item.agentLive && <span className="row tight t-footnote muted"><Aura on className="icontile soft" style={{ width: 24, height: 24, borderRadius: 8 }}><Icon name="sparkles" size={13} /></Aura>{item.agentLive}</span>}</>}
        </div>
        <div className="row tight">{primary}</div>
      </div>
      {note}
    </div></div>;
  }
  const chipsMoney = phone => <div className="stack tight" style={{ gap: 2 }}><Money value={D.PLAN.net} size={phone ? "s" : "m"} style={{ color: "var(--primary-text)" }} /><span className="t-footnote subtle">net recovered on the plan · swing {fmt.inr(D.PLAN.swing)}</span></div>;
  const mangoMoney = (phone, v) => <div className="stack tight" style={{ gap: 2 }}><Money value={-D.MANGO_PLAN.writeOff.total} size={phone ? "s" : "m"} style={{ color: "var(--red-text)" }} /><span className="t-footnote subtle">if destroyed · {fmt.num(v.assess.atRisk)} units at risk</span></div>;
  function trackerFor(item, { phone, go, dim, offline, head, note }) {
    const primary = item.hero ? (item.human ? <Button variant="approve" icon="check" disabled={offline} onClick={() => go("route", { ref: item.ref })}>Review and approve</Button> : <Button variant="primary" iconRight="arrow-right" onClick={() => go("route", { ref: item.ref })}>Open Route Room</Button>)
      : <Button variant="primary" iconRight="arrow-right" onClick={() => go("route", { ref: item.ref })}>Open Route Room</Button>;
    return <TrackerCard68 key={item.ref} item={item} dim={dim} head={head} note={note} primary={primary} money={item.hero ? chipsMoney(phone) : mangoMoney(phone, item.view)} />;
  }

  /* ---------- S1 Command Center, on the live backend ---------- */
  function CommandCenter68({ me }) {
    const s = S.useStore(); const { go } = S.useRoute(); const app = useApp(); const phone = app.bp === "phone"; const scn = useScn(); const live = X.useLive(); const o = X.OPT();
    const [later, setLater] = useState(false); const { toast } = useNotice(); const wasLoading = useRef(false);
    const dim = live.conn === "reconnecting" || live.conn === "offline";
    if (scn.load && o.firstLoad !== "splash") { wasLoading.current = true; return <X.Screen68 me={me} title="Command Center" sub="Catching up with the agents…"><CCSkeleton phone={phone} /></X.Screen68>; }
    // once the snapshot is in, the content rises into the placeholders' places (SC-49)
    const rise = c => (wasLoading.current && !SHOT ? <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: EASE }}>{c}</motion.div> : c);
    const allow = () => { setLater(true); toast({ text: "Notifications are on. The 09:00 push reaches this device.", tone: "ok", icon: "bell" }); };
    const items = flaggedItems(s, scn);
    const views = D.BATCHES.map(b => { const v = D.batchView(b); if (b.hero) v.phase = scn.quiet ? "cleared" : S.heroModel(s).view.phase; if (b.second && !scn.two) v.phase = scn.quiet ? "cleared" : "executing"; return v; });
    const watch = views.filter(v => !(v.phase === "cleared")).sort((a, b) => ((a.phase === "awaiting" || (!a.phase && a.assess.status === "at-risk")) ? -1 : 0) - ((b.phase === "awaiting" || (!b.phase && b.assess.status === "at-risk")) ? -1 : 0) || a.daysLeft - b.daysLeft);
    const open = v => (v.id === items[0].ref || (scn.two && v.id === MANGO.id) ? go("route", { ref: v.id }) : null);
    const push = scn.push && o.pushPlace === "home" && !later ? <motion.div initial={SHOT ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: EASE }}><Card className="x68-pushcard"><PushContent variant={scn.push} me={me} onAllow={allow} onLater={() => setLater(true)} /></Card></motion.div> : null;
    const feed = <div className="stack snug"><S.SectionTitle sub="Every hand-off, as it happens">Agent activity</S.SectionTitle><Card className={dim ? "x68-dimcard" : undefined}><AgentFeed events={scn.two ? s.feed.concat(mangoFeed(items[1].view)).sort((a, b) => (a.at < b.at ? -1 : 1)) : s.feed} people={D.PEOPLE} live={-1} max={phone ? 3 : 6} /></Card></div>;
    const list = <div className="stack snug"><S.SectionTitle sub={scn.quiet ? "Every batch clears inside its date at today's sell-through" : "Flagged batches first, then by days to best-before"}>Watchlist</S.SectionTitle><div className="list">{watch.map(v => <BatchRow key={v.id} view={v} compact={phone} onOpen={() => open(v)} />)}</div></div>;
    let top;
    if (scn.quiet) {
      const next = "Sun 1 Nov, 09:00";
      top = <Card className="x68-quiet"><div className="x68-quiet-in"><Product name="sprout-box" size={phone ? 96 : 120} alt="" /><div className="stack tight" style={{ gap: 6 }}>
        <div className="t-title3">Nothing at risk today</div>
        <p className="t-subhead muted" style={{ margin: 0 }}>The Watcher checked 312 batches at 09:00. Every one sells through inside its date, so nothing needs you. The next check is {next}, {X.untilNine(live.clock)} from now at this pace.</p>
        <div className="row tight wrap" style={{ marginTop: 6 }}><Badge tone="green" icon="check">Last cleared · MF-2409-117</Badge><span className="t-footnote subtle">{fmt.inr(D.ACTUAL.net)} recovered, 0 cartons destroyed</span></div>
      </div></div></Card>;
    } else top = o.Flagged ? <o.Flagged items={items} phone={phone} go={go} dim={dim} offline={live.conn === "offline"} trackerFor={trackerFor} FlagRow={FlagRow} /> : trackerFor(items[0], { phone, go, dim });
    const cluster = !scn.quiet && <Card pad={false} className="stack" style={{ overflow: "hidden", gap: 0 }}><div className="card-head" style={{ padding: "14px 16px 10px" }}><span className="card-title">Nagpur cluster</span><Badge size="sm">{D.OFFERED} kiranas</Badge></div><ClusterMap kiranas={D.KIRANAS} orderedCount={0} route={false} vanProgress={0} height={phone ? 220 : 280} /></Card>;
    const sub = scn.quiet ? "Watcher checked 312 batches at 09:00 · nothing flagged" : `Watcher checked 312 batches at 09:00 · ${items.length} flagged`;
    return <X.Screen68 me={me} title="Command Center" sub={sub}>
      {rise(app.bp === "desktop" ? <S.Columns sideWidth={340} main={<>{push}{top}{cluster}{list}</>} side={feed} /> : <div className="stack" style={{ gap: 20 }}>{push}{top}{feed}{list}{cluster}</div>)}
    </X.Screen68>;
  }

  /* ---------- S2 Route Room, for the batch in the address ---------- */
  function RouteRoom68({ me }) {
    const { route } = S.useRoute(); const s = S.useStore(); const scn = useScn(); const o = X.OPT(); const app = useApp();
    const items = flaggedItems(s, Object.assign({}, scn, { two: scn.two }));
    const ref = (route.params && route.params.ref) || items[0].ref; const item = itemFor(items, ref);
    const below = o.Switcher && items.length > 1 ? <o.Switcher items={items} current={item.ref} phone={app.bp === "phone"} open={scn.switcher} /> : null;
    return item.hero ? <HeroRoom me={me} item={item} items={items} below={below} /> : <MangoRoom me={me} item={item} below={below} />;
  }
  function HeroRoom({ me, item, items, below }) {
    const s = S.useStore(); const app = useApp(); const hm = S.heroModel(s); const h = s.hero; const [view, setView] = useState("chart"); const scn = useScn(); const live = X.useLive(); const o = X.OPT();
    const [sheet, setSheet] = useState(!!scn.fail && !(o.failSheetClosed && SHOT)); const { go } = S.useRoute(); const offline = live.conn === "offline"; const dim = offline || live.conn === "reconnecting";
    const stages = D.STAGES.map(x => ({ id: x.id, title: x.title, human: x.human }));
    const planned = h.phase === "planned"; const v = hm.view; const sku = v.skuObj; const staff = D.PLAN.rows.find(r => r.id === "staff");
    const ES = D.PLAN.lines.find(l => l.id === "expiresoon"), KL = D.PLAN.lines.find(l => l.id === "kirana");
    useEffect(() => { const f = () => setSheet(true); window.addEventListener("sc68:approve", f); return () => window.removeEventListener("sc68:approve", f); }, []);
    const dock = planned && !o.dockApproves;
    return <X.Screen68 me={me} title="Route Room" sub={below ? null : `${v.id} · ${sku.brand} ${sku.name} · ${v.dist.name}, ${v.dist.city}`} back="Command Center" below={below}>
      <div className="stack" style={{ gap: 20, paddingBottom: dock ? 96 : 0 }}>
        <Card className="stack" style={{ gap: 16 }}>
          <div className="row wrap" style={{ gap: 16 }}>
            <Product name={sku.img} size={app.bp === "phone" ? 64 : 84} />
            <div className="grow"><div className="row base" style={{ gap: 10 }}><DaysNum days={v.daysLeft} life={sku.lifeDays} size="l" style={{ color: "var(--red-text)" }} /><span className="stack tight" style={{ gap: 0 }}><b>days left</b><span className="t-footnote subtle">best before {fmt.date(v.bestBefore)}</span></span></div></div>
            <div className="stack tight" style={{ justifyItems: app.bp === "phone" ? "start" : "end" }}><GateChips gates={v.assess.gates} /><span className="t-footnote subtle">{fmt.num(v.assess.atRisk)} of {fmt.num(v.units)} units at risk · sells {v.sellPerDay} a day</span></div>
          </div>
          <div className={dim ? "x68-dimtrack" : undefined}>{app.bp === "phone" ? <TrackerCompact done={hm.done} current={hm.current} /> : <Tracker stages={stages} done={hm.done} current={hm.current} times={K.STAGE_TIMES} />}</div>
        </Card>
        <S.Columns sideWidth={340}
          main={<>
            <S.SectionTitle sub="Vision · 09:20" right={<Badge tone="green" icon="check">matches the DMS record</Badge>}>Label, read from the shelf</S.SectionTitle>
            <Card className="stack" style={{ gap: 16 }}><div style={{ containerType: "inline-size" }}><div className="labelgrid"><S.LabelPhoto status="verified" /><div className="stack snug"><List>{[["Batch", "MF-2409-117"], ["Manufactured", "18 May 2026"], ["Best before", "18 Nov 2026"], ["Shelf life", `${v.assess.life} days · ${v.assess.lifeUsedPct}% used`], ["MRP", "₹30.00 · 24 × 150 g"], ["Records", "match"]].map(([k, val]) => <ListRow key={k} title={k} value={val} />)}</List></div></div></div></Card>
            <S.SectionTitle sub="Valuer · 09:21 · per unit, after costs" right={<Segmented options={[{ id: "chart", label: "Chart" }, { id: "table", label: "Table" }]} value={view} onChange={setView} label="View" />}>Five channels, priced</S.SectionTitle>
            {view === "chart" ? <Card><ChannelBars rows={D.PLAN.rows} chosen={D.PLAN.lines.map(l => l.id)} /></Card> : <ChannelTable rows={D.PLAN.rows} chosen={D.PLAN.lines.map(l => l.id)} />}
            <S.SectionTitle sub="Router · 09:22">Recommended split</S.SectionTitle>
            <Card className="stack snug"><SplitBar plan={D.PLAN} sku={sku} />
              <div className="stack tight t-subhead" style={{ marginTop: 4 }}>
                <div className="row top" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--ch-kirana)" }} /><span><b>{KL.units} units to the kirana cluster at ₹18 effective</b> (₹{KL.packPrice.toFixed(2)} a pack, 2 free with every 10).</span></div>
                <div className="row top" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--ch-expiresoon)" }} /><span><b>{ES.units} units to ExpireSoon at ₹15</b> (reserve ₹13.50), listed in Rakesh Traders' name.</span></div>
                <div className="row top muted" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--fill-3)" }} /><span>The {staff.name} is eligible but pays less a unit than ExpireSoon, so it gets nothing this time.</span></div>
              </div>
            </Card>
            <MoneyPanel plan={D.PLAN} compact={app.bp !== "desktop"} />
          </>}
          side={<><S.SectionTitle sub="Gaps drawn to the clock">Agent timeline</S.SectionTitle><Card className={dim ? "x68-dimcard" : undefined}><AgentFeed events={s.feed.filter(e => e.stage !== "connect")} people={D.PEOPLE} live={-1} /></Card></>} />
      </div>
      {dock && <div style={{ position: "sticky", bottom: 0, zIndex: 5, padding: "12px 0 16px", background: "linear-gradient(180deg, transparent, var(--bg) 35%)" }}>
        <div className="card raised row wrap" style={{ padding: "14px 16px", gap: 14 }}>
          <div className="row wrap grow" style={{ gap: 18 }}>{[["You get", D.PLAN.net, "var(--primary-text)"], ["Instead of", -D.PLAN.writeOff.total, "var(--red-text)"], ["GST credit safe", D.PLAN.itcRetained, "var(--fg)"]].map(([k, val, c]) => <div key={k} className="stack tight" style={{ gap: 0 }}><span className="t-caption subtle strong">{k}</span><Money value={val} size="s" style={{ color: c, fontSize: 26 }} /></div>)}</div>
          <div className="stack tight" style={{ justifyItems: "end", gap: 6 }}>
            <Button variant="approve" size="lg" icon="check" aria-disabled={offline || undefined} className={offline ? "x68-blocked" : undefined} aria-describedby={offline ? "x68-needs-net" : undefined} onClick={() => !offline && setSheet(true)}>Review and approve</Button>
            {offline && <span id="x68-needs-net" className="t-footnote x68-needs"><Icon name="wifi-off" size={14} />Approving needs a connection</span>}
          </div>
        </div>
      </div>}
      <ApproveSheet68 open={sheet} onClose={() => setSheet(false)} me={me} fail={scn.fail} />
    </X.Screen68>;
  }
  // the Mango Drink batch, at Verify: nothing is priced until Lakshmi Agencies sends the label photo from her own phone
  function MangoRoom({ me, item, below }) {
    const app = useApp(); const v = item.view; const sku = v.skuObj; const live = X.useLive(); const dim = live.conn !== "live";
    const stages = D.STAGES.map(x => ({ id: x.id, title: x.title, human: x.human }));
    return <X.Screen68 me={me} title="Route Room" sub={below ? null : `${v.id} · ${sku.brand} ${sku.name} · ${v.dist.name}, ${v.dist.city}`} back="Command Center" below={below}>
      <div className="stack" style={{ gap: 20 }}>
        <Card className="stack" style={{ gap: 16 }}>
          <div className="row wrap" style={{ gap: 16 }}>
            <Product name={sku.img} size={app.bp === "phone" ? 64 : 84} />
            <div className="grow"><div className="row base" style={{ gap: 10 }}><DaysNum days={v.daysLeft} life={sku.lifeDays} size="l" style={{ color: "var(--red-text)" }} /><span className="stack tight" style={{ gap: 0 }}><b>days left</b><span className="t-footnote subtle">best before {fmt.date(v.bestBefore)}</span></span></div></div>
            <div className="stack tight" style={{ justifyItems: app.bp === "phone" ? "start" : "end" }}><GateChips gates={v.assess.gates} /><span className="t-footnote subtle">{fmt.num(v.assess.atRisk)} of {fmt.num(v.units)} units at risk · sells {v.sellPerDay} a day</span></div>
          </div>
          <div className={dim ? "x68-dimtrack" : undefined}>{app.bp === "phone" ? <TrackerCompact done={item.done} current={item.current} /> : <Tracker stages={stages} done={item.done} current={item.current} times={{ connect: "once", detect: "09:00", verify: "asked 09:05" }} />}</div>
        </Card>
        <S.Columns sideWidth={340}
          main={<>
            <S.SectionTitle sub="Vision · asked at 09:05">Label, read from the shelf</S.SectionTitle>
            <Card className="stack" style={{ gap: 16 }}><div style={{ containerType: "inline-size" }}><div className="labelgrid">
              <div className="x68-await"><Product name="pack-mango" size={app.bp === "phone" ? 110 : 140} alt="" /><div className="stack tight" style={{ justifyItems: "center", textAlign: "center", gap: 4 }}><b>Waiting for Lakshmi Agencies' photo</b><span className="t-footnote muted">One carton in the Begum Bazaar godown. She sends it from her own phone; the request reached her at 09:05.</span></div></div>
              <div className="stack snug"><S.Locked icon="scan-line" agent="Vision Agent" live={!dim} text="Prices nothing until a person photographs one carton label on the shelf." />{[0, 1, 2, 3].map(i => <Skeleton key={i} h={44} r={12} />)}</div>
            </div></div></Card>
            <S.SectionTitle sub="Valuer">Five channels, priced</S.SectionTitle>
            <S.Locked icon="scale" agent="Valuer Agent" text="Prices five channels once the label is verified." />
            <S.SectionTitle sub="Router">Recommended split</S.SectionTitle>
            <S.Locked icon="split" agent="Router Agent" text="Proposes a split once the channels are priced." />
          </>}
          side={<><S.SectionTitle sub="Gaps drawn to the clock">Agent timeline</S.SectionTitle><Card className={dim ? "x68-dimcard" : undefined}><AgentFeed events={mangoFeed(v)} people={D.PEOPLE} live={-1} /></Card></>} />
      </div>
    </X.Screen68>;
  }

  /* ---------- the approve sheet, when the approval does not go through ---------- */
  function ApproveSheet68({ open, onClose, me, fail }) {
    const [busy, setBusy] = useState(false); const [err, setErr] = useState(!!fail && SHOT); const reduce = useReducedMotion(); const o = X.OPT();
    const KL = D.PLAN.lines.find(l => l.id === "kirana"), ES = D.PLAN.lines.find(l => l.id === "expiresoon");
    const approve = () => { setErr(false); setBusy(true); setTimeout(() => { setBusy(false); setErr(true); if (o.onFail) o.onFail(); }, 900); };
    return <Sheet open={open} onClose={onClose} title="Approve the plan" footer={<>
      <AnimatePresence initial={false}>{err && <motion.div key="e" className="x68-err" role="alert" initial={reduce || SHOT ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.24, ease: EASE }}>
        <Icon name="circle-alert" size={18} /><span><b>The approval didn't go through.</b> Smart-Clearance didn't answer in time, so nothing was listed, offered or sent. The plan is still waiting for you.</span>
      </motion.div>}</AnimatePresence>
      <Button variant="approve" size="lg" block icon={err ? "refresh-cw" : "check"} loading={busy} onClick={approve}>{err ? "Retry · release the agents" : "Approve · release the agents"}</Button><Button variant="ghost" block onClick={onClose}>Not now</Button></>}>
      <div className="stack">
        <div className="stack tight"><Money value={D.PLAN.net} size="l" style={{ color: "var(--primary-text)" }} /><span className="muted">net recovered, {D.PLAN.pctMRP}% of MRP</span></div>
        <List><ListRow icon="trending-up" title="Instead of destroying" value={fmt.inr(-D.PLAN.writeOff.total)} /><ListRow icon="scale" iconTone="blue" title="Swing on this batch" value={fmt.inr(D.PLAN.swing)} /><ListRow icon="badge-check" iconTone="gray" title="GST input credit retained" value={fmt.inr(D.PLAN.itcRetained)} /></List>
        <div className="stack tight"><b className="t-subhead">What happens the moment you tap</b>
          {[["shopping-bag", `Lister posts ${ES.units} units on ExpireSoon at ₹15 in Rakesh Traders' name; reserve ₹13.50.`], ["send", `Outreach pushes the Hindi scheme to ${D.OFFERED} kiranas: ${KL.units} units at ₹${KL.packPrice.toFixed(2)} a pack.`], ["shield-check", "Nothing is listed, messaged or shipped before this tap. The approval is logged with who, when and device."]].map(([ic, t]) => <div key={ic} className="row top t-subhead" style={{ gap: 10 }}><Icon name={ic} size={18} style={{ marginTop: 2, color: "var(--fg-3)" }} /><span>{t}</span></div>)}
        </div>
      </div>
    </Sheet>;
  }

  /* ---------- the label photo, on its way ---------- */
  function Camera68({ me }) {
    const scn = useScn(); const o = X.OPT(); const [p, setP] = useState(0.62); const reduce = useReducedMotion();
    useEffect(() => { if (SHOT || !scn.upload) return; let raf = 0; const t0 = performance.now(); const tick = now => { const k = Math.min(0.97, 0.18 + (now - t0) / 9000); setP(k); if (k < 0.97) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, []);
    const mb = (2.3 * p).toFixed(1);
    return <X.Screen68 me={me} title="Label photo" sub="Batch MF-2409-117 · shelf B4" back="Today">
      <div className="stack" style={{ gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <div className="cam"><S.LabelShot cover />{o.UploadOnPhoto && <o.UploadOnPhoto p={p} />}</div>
        {o.UploadUnderPhoto ? <o.UploadUnderPhoto p={p} mb={mb} /> : <UploadLine p={p} mb={mb} total="2.3 MB" label="Sending the photo" />}
        <p className="t-caption subtle" style={{ textAlign: "center", margin: 0 }}>A slow connection only slows the send; the photo is kept on this phone until it arrives.</p>
      </div>
    </X.Screen68>;
  }
  function UploadLine({ p, mb, total, label, name, onCancel }) {
    return <Card className="stack snug x68-upload">
      <div className="row between" style={{ gap: 10 }}><span className="stack tight" style={{ gap: 1, minWidth: 0 }}><b className="t-subhead">{label}</b>{name && <span className="mono t-caption subtle" style={{ overflowWrap: "anywhere" }}>{name}</span>}</span><Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div>
      <Progress value={p} label={label} />
      <span className="row between t-footnote subtle"><span className="tnum">{mb} of {total}</span><span className="tnum">{Math.round(p * 100)}%</span></span>
    </Card>;
  }

  /* ---------- S0 Setup, while the DMS export uploads ---------- */
  function Setup68({ me }) {
    const app = useApp(); const o = X.OPT(); const [p, setP] = useState(0.64);
    useEffect(() => { if (SHOT) return; let raf = 0; const t0 = performance.now(); const tick = now => { const k = Math.min(0.98, 0.2 + (now - t0) / 12000); setP(k); if (k < 0.98) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, []);
    const steps = [["Upload", "now"], ["Map columns", "Data Agent"], ["Load into BigQuery", "then the Watcher starts"]];
    const chips = D.SKUS.chips; const wo = D.PLAN.writeOff;
    return <X.Screen68 me={me} title="Setup" sub="Connect the stock data once and set the rules the agents must obey">
      <div className="stack" style={{ gap: 20 }}>
        <Card className="stack snug x68-upload">
          <div className="card-head"><span className="row tight"><span className="icontile"><Icon name="file-spreadsheet" size={17} stroke={2} /></span><span className="stack tight" style={{ gap: 0 }}><b>dms_export_2026-10-01.csv</b><span className="t-footnote subtle">Bizom-style DMS export · 4.8 MB</span></span></span><Button variant="ghost" size="sm">Cancel</Button></div>
          <Progress value={p} label="Uploading the DMS export" />
          <span className="row between t-footnote subtle"><span className="tnum">Uploading · {(4.8 * p).toFixed(1)} of 4.8 MB</span><span className="tnum">{Math.round(p * 100)}%</span></span>
          <ol className="x68-mini" aria-label="What happens to the file">{steps.map(([t, sub], i) => <li key={t} className={i === 0 ? "now" : ""}><i aria-hidden="true" /><b>{t}</b><span>{sub}</span></li>)}</ol>
          <span className="t-footnote muted">You can keep setting the rules below while it uploads. The column mapping appears here when the Data Agent has read the file.</span>
        </Card>
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: app.bp === "desktop" ? "repeat(2, minmax(0,1fr))" : "minmax(0,1fr)", alignItems: "start" }}>
          <List head="Floor price by category" foot="No channel may sell below its category's floor.">{[["Snacks", 35, "chips"], ["Biscuits", 35, "biscuits"], ["Staples", 40, "poha"], ["Beverages", 30, "mango"], ["Personal care", 40, "facewash"]].map(([l, f, sku]) => <ListRow key={l} title={l} sub={`${fmt.inr2(D.SKUS[sku].mrp * f / 100)} on a ₹${D.SKUS[sku].mrp} pack`} value={<Stepper value={f} onChange={() => {}} min={20} max={70} step={5} label={"Floor for " + l} format={x => x + "%"} />} />)}</List>
          <List head="Territory guard" foot="ExpireSoon listings are hidden from buyers inside these territories, matched by pincode.">{Object.values(D.DISTRIBUTORS).map(d => <ListRow key={d.id} icon="map-pin" iconTone="gray" title={d.territory} sub={`${d.name} · pincodes ${d.pins}…`} />)}<ListRow title="Hide listings inside the territories" value={<Switch checked onChange={() => {}} label="Territory guard" />} /></List>
        </div>
        <Card className="stack snug"><div className="card-head"><span className="card-title">The true cost of a write-off</span><Badge tone="red" icon="trash-2">shown before any batch is routed</Badge></div><span className="t-footnote subtle">For Masala Chips 150 g: destroying costs {fmt.inr2(-wo.perUnit)} a unit (cost ₹{chips.cost}, GST credit reversed, disposal and EPR).</span></Card>
      </div>
    </X.Screen68>;
  }

  /* ---------- a partner's quiet day ---------- */
  function DistQuiet68({ me }) {
    const app = useApp(); const s = S.useStore(); const dist = S.distOf(me);
    const mine = D.BATCHES.filter(b => b.distributor === dist.id && !b.hero).map(b => D.batchView(b));
    return <X.Screen68 me={me} title="Today" sub={`${dist.name} · ${dist.godown}, ${dist.city}`}>
      <div className="stack" style={{ gap: 16 }}>
        <Card className="row wrap" style={{ gap: 12 }}><span className="icontile" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name="handshake" size={19} /></span><div className="grow" style={{ minWidth: 0 }}><b>Smart-Clearance acts for you</b><div className="t-footnote muted">Listings, scheme offers, invoice drafts and dispatch slots in Rakesh Traders' name, inside Munchly's floors. Given Thu 1 Oct, 16:52.</div></div><Button variant="secondary" size="sm" icon="pause">Pause</Button></Card>
        <Card className="x68-quiet"><div className="x68-quiet-in"><Product name="godown" size={app.bp === "phone" ? 92 : 112} alt="" /><div className="stack tight" style={{ gap: 6 }}>
          <div className="t-title3">Nothing for you today</div>
          <p className="t-subhead muted" style={{ margin: 0 }}>No photo requests, scheme orders or marketplace lots. The Watcher checks your stock every morning at 09:00; when it needs you, it sends a push.</p>
          <div className="row tight wrap" style={{ marginTop: 6 }}><Badge tone="green" icon="check">Masala Chips cleared</Badge><span className="t-footnote subtle">credit note {fmt.inr(D.SUPPORT.total)} from Munchly · you ended whole</span></div>
        </div></div></Card>
        <S.SectionTitle sub="From your nightly DMS export">Your stock</S.SectionTitle>
        <div className="list">{mine.map(v => <BatchRow key={v.id} view={v} compact={app.bp === "phone"} onOpen={() => {}} />)}</div>
      </div>
    </X.Screen68>;
  }

  /* ---------- the sign-in: email and password, in Munchly's card ---------- */
  // the console's sign-in (SC-46, picked A), inside the client-led card (SC-24): one message for any wrong sign-in,
  // no forgot-password, and a signed-in person who is not a member of this workspace
  const WRONG = "That email and password don't match. Check both, or ask whoever invited you to reset your password.";
  function SignInButton({ phase, name }) {
    const reduce = useReducedMotion(); const busy = phase === "busy", done = phase === "done", err = phase === "error";
    const label = done ? `Welcome, ${name}` : busy ? "Signing in…" : "Sign in";
    return <motion.button type="submit" className={cx("btn btn-primary btn-lg btn-block x68-si-btn", (busy || done) && "on")} aria-disabled={busy || done || undefined}
      animate={err && !reduce ? { x: [0, -8, 8, -5, 5, -2, 0] } : { x: 0 }} transition={{ duration: 0.36, ease: "easeOut" }}>
      <span className="x68-si-ic" aria-hidden="true">{done ? <svg width="20" height="20" viewBox="0 0 24 24"><motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce || SHOT ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.28, ease: EASE }} /></svg>
        : busy ? <svg width="20" height="20" viewBox="12 12 40 40"><circle cx="43.5" cy="19" r="4" fill="currentColor" /><motion.path d={S_PATH} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce || SHOT ? 0.62 : 0 }} animate={{ pathLength: SHOT ? 0.62 : 1 }} transition={{ duration: reduce ? 0 : 1.1, ease: [0.65, 0, 0.35, 1] }} /></svg>
        : <Icon name="log-in" size={18} />}</span>
      <span className="x68-si-lbl"><AnimatePresence initial={false}><motion.span key={label} initial={reduce ? false : { y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -12, opacity: 0 }} transition={{ duration: 0.24, ease: EASE }}>{label}</motion.span></AnimatePresence></span>
      {(busy || done) && <motion.i className="x68-si-prog" aria-hidden="true" initial={{ scaleX: reduce || SHOT ? 0.6 : 0 }} animate={{ scaleX: done ? 1 : SHOT ? 0.6 : 0.9 }} transition={{ duration: reduce ? 0 : done ? 0.16 : 1.1, ease: done ? EASE : [0.3, 0.7, 0.4, 1] }} />}
      <span className="sr-only" role="status">{busy ? "Signing in" : done ? `Signed in. Welcome, ${name}.` : ""}</span>
    </motion.button>;
  }
  const NEHA = { name: "Neha Kulkarni", email: "neha.kulkarni@smartclearance.example", initials: "NK" };
  function SignIn68({ onSignIn }) {
    const app = useApp(); const scn = useScn(); const o = X.OPT();
    const [email, setEmail] = useState(scn.si === "notmember" ? NEHA.email : "priya.deshmukh@munchly.example"); const [pw, setPw] = useState(scn.si === "wrong" ? "" : "default-pass-1");
    const [show, setShow] = useState(false); const [err, setErr] = useState(scn.si === "wrong" ? WRONG : ""); const [phase, setPhase] = useState(scn.si === "busy" ? "busy" : "idle"); const [nm, setNm] = useState(scn.si === "notmember");
    const reduce = useReducedMotion();
    const submit = e => {
      e.preventDefault(); setErr("");
      const known = /^(priya\.deshmukh@munchly\.example|rakesh\.traders@google\.example)$/i.test(email.trim());
      if (/smartclearance\.example$/i.test(email.trim()) && pw) { setPhase("busy"); setTimeout(() => { setPhase("idle"); setNm(true); }, 1100); return; }
      if (!known || !pw) { setPhase("error"); setTimeout(() => { setPhase("idle"); setErr(WRONG); setPw(""); }, reduce ? 0 : 360); return; }
      setPhase("busy"); setTimeout(() => { setPhase("done"); setTimeout(() => { setPhase("idle"); onSignIn(/rakesh/i.test(email) ? "rakesh" : "priya"); }, 720); }, 1100);
    };
    const edit = set => ev => { set(ev.target.value); setErr(""); };
    const form = nm ? <NotMember onOther={() => { setNm(false); setEmail(""); setPw(""); }} />
      : <form className="si-form" noValidate onSubmit={submit}>
        <Field label="Email" htmlFor="si-email"><Input id="si-email" icon="mail" type="email" value={email} onChange={edit(setEmail)} autoComplete="username" spellCheck={false} autoCapitalize="none" placeholder="name@munchly.example" /></Field>
        <Field label="Password" htmlFor="si-pw"><span className="input-wrap x68-si-pw"><Icon name="lock" size={17} /><input id="si-pw" className="input" type={show ? "text" : "password"} value={pw} onChange={edit(setPw)} autoComplete="current-password" aria-invalid={err ? "true" : undefined} aria-describedby={err ? "si-err" : undefined} /><button type="button" className="x68-si-eye" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow(!show)}><Icon name={show ? "eye-off" : "eye"} size={20} /></button></span></Field>
        {err && <div className="x68-si-error" id="si-err" role="alert"><Icon name="circle-alert" size={18} /><span>{err}</span></div>}
        <SignInButton phase={phase} name="Priya" />
        <p className="t-footnote muted x68-si-hint">First time here? Whoever invited you gives you your first password. Nothing is sent by email.</p>
      </form>;
    return <div className="signin">
      <div className="ground" aria-hidden="true" />
      {app.bp === "desktop" && <S.HeroStage />}
      <div className="si-panel">
        <div className="si-card">
          <div className="si-ws"><WorkspaceMark ws={WS} size={app.bp === "phone" ? 52 : 60} /><div className="si-ws-name">{WS.name}</div><span className="si-url"><Icon name="lock" size={12} stroke={2.2} />{WS.domain}</span></div>
          {app.bp !== "desktop" && !nm && <div className="si-hero" aria-hidden="true"><Product name="carton-hero" size={app.bp === "phone" ? 120 : 150} float /></div>}
          <div className="stack tight" style={{ gap: 6 }}><h1 className="si-title">{nm ? "Not a member here" : "Sign in"}</h1>{!nm && <p className="si-sub">Use the email address you were invited with, and your password.</p>}</div>
          {form}
          <div className="si-foot">
            <PoweredBy />
            <span className="si-foot-row"><button type="button" className="btn btn-link btn-sm">Not your workspace? Find yours</button></span>
            <span className="si-note">Prototype · every company, person and number is fictional</span>
          </div>
        </div>
      </div>
    </div>;
  }
  // signed in, so the password was right; the account simply isn't in this workspace, and it's safe to say so
  function NotMember({ onOther }) {
    const o = X.OPT();
    return <div className="si-form" style={{ gap: 14 }}>
      <div className="x68-acct"><span className="x68-av" aria-hidden="true">{NEHA.initials}</span><span className="x68-acct-who"><span className="x68-acct-k">Signed in as</span><b>{NEHA.name}</b><span>{NEHA.email}</span></span></div>
      <div className="x68-note" role="alert"><Icon name="info" size={18} /><span>This account isn't a member of <b>{WS.name}' workspace</b>. Ask Munchly's workspace admin to invite you, or open a workspace you belong to.</span></div>
      {o.NotMemberExtra && <o.NotMemberExtra />}
      <Button variant="secondary" size="lg" block icon="log-out" onClick={onOther}>Sign in with another account</Button>
      {!o.NotMemberExtra && <button type="button" className="btn btn-link btn-sm" style={{ justifySelf: "center" }}>Find your workspace</button>}
    </div>;
  }

  /* ---------- the person's app: their shell, with each option's live pieces ---------- */
  function screenFor68(me, name) {
    switch (name) {
      case "command": return <CommandCenter68 me={me} />;
      case "route": return <RouteRoom68 me={me} />;
      case "photo": return <Camera68 me={me} />;
      case "setup": return <Setup68 me={me} />;
      case "home": return me.role === "distributor" && SCN.quiet ? <DistQuiet68 me={me} /> : S.screenFor(me, name, {});
      default: return S.screenFor(me, name, {});
    }
  }
  function RoleApp68({ me, route, onGo, onBack }) {
    const reduce = useReducedMotion(); const top = useRef(null); const [wsOpen, setWsOpen] = useState(false); const o = X.OPT(); const scn = useScn(); const app = useApp();
    const name = route && route.name ? route.name : S.HOME[me.role];
    const allowed = S.routesFor(me.role); const safe = allowed.includes(name) ? name : S.HOME[me.role];
    const nav = S.NAV[me.role]; const W = D.WORKSPACE;
    React.useLayoutEffect(() => { const el = top.current; const sc = el && el.closest(".scroll"); if (sc) sc.scrollTop = 0; }, [safe, route && route.params && route.params.ref]);
    const display = Object.assign({}, me, { role: S.ROLES[me.role] });
    const ws = { name: W.name, domain: W.domain, open: () => setWsOpen(true) };
    const [stepDone, setStepDone] = useState(false); const step = o.Step && scn.push && !stepDone ? o.Step : null;
    const body = <Shell nav={nav} current={safe} onNav={id => onGo({ name: id, params: {}, replace: true })} user={display} onUser={() => onGo({ name: "profile" })} ws={W} onWorkspace={() => setWsOpen(true)} footer={o.ShellFoot ? <o.ShellFoot me={me} /> : null}>
      {step ? <o.Step me={me} onDone={() => setStepDone(true)} /> : <AnimatePresence mode="wait" initial={false}>
        <motion.div key={safe + (route.params && route.params.ref || "")} ref={top} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.18, ease: EASE }}>
          {screenFor68(me, safe)}
        </motion.div>
      </AnimatePresence>}
    </Shell>;
    return <S.Router route={{ name: safe, params: route && route.params }} onGo={r => onGo(r)} onBack={onBack}><S.WorkspaceCtx.Provider value={ws}>
      {body}
      {o.Dock && !step && <K.Portal><o.Dock me={me} route={safe} /></K.Portal>}
      <S.WorkspaceSheet open={wsOpen} onClose={() => setWsOpen(false)} me={me} onSettings={null} />
    </S.WorkspaceCtx.Provider></S.Router>;
  }

  /* ---------- the mockup's app ---------- */
  const parseHash = () => { const m = /^#\/([a-z-]+)(?:\/([A-Z0-9-]+))?/.exec(location.hash || ""); return m ? { name: m[1], params: m[2] ? { ref: m[2] } : {} } : null; };
  function App68() {
    const scn = SCN; const o = X.OPT(); const app = useApp();
    const [who, setWho] = useState(scn.who || null);
    const [route, setRoute] = useState(() => parseHash() || { name: scn.route || "command", params: scn.ref ? { ref: scn.ref } : {} });
    const [conn, setConn] = useState(scn.conn);
    const [load, setLoad] = useState(!!scn.load);
    const clock = useClock(Object.assign({}, DAY, scn.clock || {}));
    useMemo(() => { Flow.fastForward(scn.stage || 0); if (scn.photo) Store.update(st => { Flow.A.requestPhoto(st); }); }, []);
    useEffect(() => { const f = () => { const r = parseHash(); if (r) setRoute(r); }; window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
    // outside a still, the first load finishes and a dropped stream comes back, so the motion can be seen
    useEffect(() => { if (SHOT || !load) return; const t = setTimeout(() => { setLoad(false); setConn("live"); }, 2600); return () => clearTimeout(t); }, [load]);
    const go = useCallback(r => { const h = "#/" + r.name + (r.params && r.params.ref ? "/" + r.params.ref : ""); history[r.replace ? "replaceState" : "pushState"](null, "", location.pathname + location.search + h); setRoute({ name: r.name, params: r.params || {} }); }, []);
    const me = who && Store.get().users.find(u => u.id === who);
    const live = useMemo(() => ({ conn, since: scn.since, clock, setConn }), [conn, clock.time]);
    const [after, setAfter] = useState(null);
    const scnNow = useMemo(() => Object.assign({}, scn, after, { load, conn }), [load, conn, after]);
    // signing in from the form opens this morning's journey: two batches flagged, the chips plan waiting for a yes
    const signIn = id => { Flow.fastForward(5); setAfter({ two: true, stage: 5 }); setLoad(true); setConn("connecting"); setWho(id); go({ name: S.HOME[Store.get().users.find(u => u.id === id).role], replace: true }); };
    return <ScnCtx.Provider value={scnNow}><X.LiveCtx.Provider value={live}>
      <NoticeHost resetKey={who}><Reconnector />{!me ? <SignIn68 onSignIn={signIn} /> : <RoleApp68 me={me} route={route} onGo={go} onBack={() => history.back()} />}</NoticeHost>
      <AnimatePresence>{me && load && o.Splash && <motion.div key="splash" className="x68-splash-wrap" exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.42, ease: EASE }}><o.Splash me={me} /></motion.div>}</AnimatePresence>
      {!SHOT && <Review />}
    </X.LiveCtx.Provider></ScnCtx.Provider>;
  }
  // outside a still, a dropped stream comes back after a few seconds: the dot pings, and a toast says it caught up
  function Reconnector() {
    const live = X.useLive(); const { toast } = useNotice(); const prev = useRef(live.conn);
    useEffect(() => { if (!SHOT && (prev.current === "reconnecting" || prev.current === "offline") && live.conn === "live") toast({ text: `Back live. Caught up from ${live.since}.`, tone: "ok", icon: "activity" }); prev.current = live.conn; }, [live.conn]);
    useEffect(() => { if (SHOT || (live.conn !== "reconnecting" && live.conn !== "offline")) return; const t = setTimeout(() => live.setConn("live"), 5200); return () => clearTimeout(t); }, [live.conn]);
    return null;
  }
  // the review switcher: every state of this option, outside the stills
  function Review() {
    const [open, setOpen] = useState(false);
    const groups = Object.entries(STATES).reduce((t, [id, st]) => { (t[st.group] = t[st.group] || []).push([id, st]); return t; }, {});
    const link = id => { const p = new URLSearchParams(location.search); p.set("state", id); return location.pathname + "?" + p.toString(); };
    return <div className="x68-review">
      <button type="button" className="x68-review-btn" aria-expanded={open} aria-controls="x68-review-list" onClick={() => setOpen(!open)}><Icon name={open ? "x" : "list"} size={18} /><span>{STATES[STATE].label}</span></button>
      {open && <nav id="x68-review-list" className="x68-review-list" aria-label="Mockup states">{Object.entries(groups).map(([g, list]) => <div key={g}><b>{g}</b>{list.map(([id, st]) => <a key={id} href={link(id)} aria-current={id === STATE ? "page" : undefined}>{st.label}</a>)}</div>)}</nav>}
    </div>;
  }

  window.SC68 = Object.assign(window.SC68, { SHOT, STATES, SCN, useScn, flaggedItems, itemFor, FlagRow, Segs, PushContent, CCSkeleton, TrackerCard68, trackerFor, UploadLine, NEHA, WS, EASE, S_PATH });
  document.addEventListener("DOMContentLoaded", () => {
    if (window.SC68_OPT && window.SC68_OPT.init) window.SC68_OPT.init();
    ReactDOM.createRoot(document.getElementById("root")).render(<ThemeProvider><AppRoot className="app-root" style={{ position: "fixed", inset: 0 }}><App68 /></AppRoot></ThemeProvider>);
  });
})();

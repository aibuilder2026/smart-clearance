// Smart-Clearance v3 · Munchly's workspace on a live backend (SC-73): SC-68's pick, option B, "In the header, batch by
// batch". Every page says under its title whether it is live and what journey time it is, and a dropped stream is a band
// across the page; the batches the Watcher flagged are tabs over the Command Center's tracker card and under the Route
// Room's title; the first load and signing in are the console's splash (SC-51); the first sign-in ends on one step that
// asks for notifications, with a preview of the push itself; the label photo's Send fills as the photo goes; a step that
// did not go through says so, with Retry; and a day with nothing at risk says that. The app provides the live facts
// through S.LiveCtx in its live mode (app.jsx, ?live); without them, as on the stub and in the guided demo, none of this
// draws. The SvelteKit build reads the same facts from its live source (frontend/core/src/lib/workspace/source.ts).
(function () {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, Avatar, Badge, Button, Card, List, ListRow, Field, Input, Product, Mark, WorkspaceMark, PoweredBy, DaysNum, GateChips, Tracker, TrackerCompact, AgentFeed, Skeleton, TrackerCard, Money, BatchRow, useApp, useNotice } = K;
  const WS = D.WORKSPACE;
  const EASE = [0.22, 1, 0.36, 1];
  const S_PATH = "M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5";
  const useLive = () => S.useLive();
  // the address the sign-in suggests: the workspace's own staff domain, as backend-api states it (the app sets it)
  const liveDomain = () => (S.liveDomain ? S.liveDomain() : WS.emailDomain);

  /* ---------- the journey clock and the connection ---------- */
  // the client's pace: one journey day lasts perDay minutes of real time (1 to 1,440; 1,440 is real time)
  const hours = m => Math.round(m / 6) / 10;
  const cue = perDay => (perDay >= 1440 ? "" : perDay >= 60 ? `1 day = ${hours(perDay)} h` : `1 day = ${perDay} min`);
  const cueLong = perDay => (perDay >= 1440 ? "The journey runs in real time." : `One journey day lasts ${perDay >= 60 ? hours(perDay) + " hours" : perDay + " minutes"} of real time.`);
  const down = conn => conn === "reconnecting" || conn === "offline";
  const stateWord = conn => (conn === "connecting" ? "Catching up" : conn === "reconnecting" ? "Reconnecting" : conn === "offline" ? "Offline" : "Live");

  // the connection, as one small mark: a still green dot when live, a turning loader while it catches up or reconnects
  // (a loading indicator, so it may turn until the stream is back), the wifi-off glyph when offline. Never red or amber.
  // Back to live, the dot pings twice and rests
  function ConnMark({ conn, size = 8 }) {
    const reduce = useReducedMotion(); const was = useRef(conn); const [ping, setPing] = useState(0);
    useEffect(() => { if (was.current !== conn && conn === "live" && !reduce) setPing(p => p + 1); was.current = conn; }, [conn]);
    if (conn === "reconnecting" || conn === "connecting") return <span className="lv-conn lv-conn-spin" aria-hidden="true"><Icon name="loader" size={size + 6} stroke={2.4} /></span>;
    if (conn === "offline") return <span className="lv-conn" aria-hidden="true"><Icon name="wifi-off" size={size + 6} stroke={2.2} /></span>;
    return <span className="lv-conn" aria-hidden="true"><i className="lv-dot" style={{ width: size, height: size }} />{ping > 0 && <motion.i key={ping} className="lv-ping" style={{ width: size, height: size }} initial={{ scale: 1, opacity: 0.7 }} animate={{ scale: 2.8, opacity: 0 }} transition={{ duration: 0.9, repeat: 1, ease: "easeOut" }} />}</span>;
  }
  // the pace, when days are compressed
  function Cue({ perDay, short }) {
    const c = cue(perDay); if (!c) return null;
    return <span className="lv-cue" title={cueLong(perDay)}><Icon name="fast-forward" size={13} stroke={2.2} />{short ? <span className="sr-only">{c}</span> : <span>{c}</span>}</span>;
  }
  // under every large title: live or not, the journey's date and time, and the pace. The time steps a quarter hour at
  // a time and is never announced (WCAG 2.2.2: the journey clock is essential, so it has no pause)
  function Line() {
    const live = useLive(); const c = live.clock;
    return <span className={cx("lv-line", live.conn !== "live" && "off")}><ConnMark conn={live.conn} /><span className="lv-st">{stateWord(live.conn)}</span><span className="lv-sep" aria-hidden="true" /><span className="lv-time"><span className="lv-date">{c.date}</span><span className="tnum">{c.time}</span></span><Cue perDay={c.perDay} /></span>;
  }
  // once the large title has collapsed into the bar, the same line, shorter, under the bar's title
  function BarSub() { const live = useLive(); return <span className="lv-barsub"><ConnMark conn={live.conn} size={6} /><span className="tnum">{live.clock.time}</span><Cue perDay={live.clock.perDay} short /></span>; }
  // a dropped stream is a band across the page, under the bar, that stays while it lasts
  function Band() {
    const live = useLive(); const f = live.failed && live.failed.action !== "approve" ? live.failed : null;
    if (f) return <div className="lv-band lv-band-err" role="alert"><Icon name="circle-alert" size={18} /><span className="lv-band-t"><b>That didn't go through.</b> {f.message}</span><Button size="sm" variant="secondary" icon="refresh-cw" onClick={live.retry}>Retry</Button><K.IconButton icon="x" label="Dismiss" onClick={live.dismiss} /></div>;
    if (!down(live.conn)) return null; const off = live.conn === "offline";
    return <div className="lv-band" role="status"><ConnMark conn={live.conn} /><span className="lv-band-t"><b>{off ? "You're offline." : "Reconnecting…"}</b> {off ? `Showing what was here at ${live.since}. Approving and sending wait for a connection.` : `Updates paused at ${live.since}, so what you see may be behind. Anything you do still goes through.`}</span>{off && <Button size="sm" variant="secondary" icon="refresh-cw" onClick={live.reconnect}>Try again</Button>}</div>;
  }
  // a card whose updates have paused: its tracker goes grey and its agents stop
  const Dim = ({ on, children }) => <div className={cx(on && "lv-dim")}>{children}</div>;

  /* ---------- the batches the Watcher flagged this morning ---------- */
  // the chips batch the store follows, and, when two are flagged, the Mango Drink batch at Verify, waiting for Lakshmi
  // Agencies' label photo. Every figure comes from money.js through data.js
  const MANGO = D.BATCHES.find(b => b.second);
  function flaggedItems(s, live) {
    const hm = S.heroModel(s); const stage = D.STAGES[hm.current];
    const chips = { ref: D.BATCHES[0].id, hero: true, view: hm.view, done: hm.done, current: hm.current, stop: stage ? stage.title : "Cleared", human: !!(stage && stage.human) };
    if (!live || !live.two) return [chips];
    const v = D.batchView(MANGO);
    return [chips, { ref: MANGO.id, view: v, done: 2, current: 2, stop: D.STAGES[2].title, human: false }];
  }
  function BatchTabs({ items, current, onPick, asTabs, label }) {
    return <div className="lv-tabs" role={asTabs ? "tablist" : undefined} aria-label={label}>
      {items.map(it => { const on = it.ref === current; const sku = it.view.skuObj;
        return <button key={it.ref} type="button" id={"lv-tab-" + it.ref} role={asTabs ? "tab" : undefined} aria-selected={asTabs ? on : undefined} aria-controls={asTabs ? "lv-flagged" : undefined} aria-current={!asTabs && on ? "page" : undefined} tabIndex={asTabs && !on ? -1 : undefined} className={cx("lv-tab", on && "on")} onClick={() => onPick(it.ref)}
          onKeyDown={asTabs ? e => { const i = items.indexOf(it); const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -2; if (n === -2) return; e.preventDefault(); const next = items[(n + items.length) % items.length]; onPick(next.ref); const el = document.getElementById("lv-tab-" + next.ref); if (el) el.focus(); } : undefined}>
          <Product name={sku.img} size={30} alt="" />
          <span className="lv-tab-t"><b>{sku.name}</b><span className="mono">{it.ref}</span></span>
          <span className={cx("lv-tab-stop", it.human && "human")}><i aria-hidden="true" />{it.stop}</span>
        </button>; })}
    </div>;
  }
  // over the Command Center's tracker card: one tab a batch, the card for the one picked
  function Flagged({ items, children }) {
    const [cur, setCur] = useState(items[0].ref); const item = items.find(i => i.ref === cur) || items[0];
    const human = items.filter(i => i.human).length;
    return <div className="stack" style={{ gap: 10 }}>
      <div className="row between wrap lv-qhead"><b className="t-subhead">Flagged batches</b><span className="t-footnote subtle">{items.length} batches{human ? ` · ${human === 1 ? "one needs" : human + " need"} a yes` : ""}</span></div>
      <BatchTabs items={items} current={item.ref} onPick={setCur} asTabs label="Flagged batches" />
      <div role="tabpanel" id="lv-flagged" aria-labelledby={"lv-tab-" + item.ref}>{children(item)}</div>
    </div>;
  }
  // under the Route Room's title: each batch has its own Route Room, so the tabs go to it
  function Switcher({ items, current }) { const { go } = S.useRoute(); return <div className="lv-tabs-row"><BatchTabs items={items} current={current} onPick={ref => go("route", { ref })} label="Flagged batches" /></div>; }

  // the Mango Drink batch's tracker card on the Command Center: what destroying it would cost, and where it waits
  function MangoCard({ item, dim }) {
    const { go } = S.useRoute(); const live = useLive(); const app = useApp(); const v = item.view;
    const money = <div className="stack tight" style={{ gap: 2 }}><Money value={-D.MANGO_PLAN.writeOff.total} size={app.bp === "phone" ? "s" : "m"} style={{ color: "var(--red-text)" }} /><span className="t-footnote subtle">if destroyed · {fmt.num(v.assess.atRisk)} units at risk</span></div>;
    return <Dim on={dim}><TrackerCard view={v} done={item.done} current={item.current} money={money} eta={dim ? pausedWords(live) : `Label photo asked at ${D.PUSH.verify.at}`} etaTone={dim ? "gray" : undefined} agentLive={dim ? "" : `Vision is waiting for ${v.dist.name}' photo`} primary={<Button variant="primary" iconRight="arrow-right" onClick={() => go("route", { ref: item.ref })}>Open Route Room</Button>} /></Dim>;
  }
  const pausedWords = live => (live.conn === "offline" ? `Offline · as of ${live.since}` : `Updates paused at ${live.since}`);
  // the Mango Drink batch's Route Room, at Verify: nothing is priced until Lakshmi Agencies sends the label photo
  const MANGO_TIMES = { connect: "once", detect: D.PUSH.detect.at, verify: "asked " + D.PUSH.verify.at };
  function mangoFeed(v) {
    const gates = v.assess.gates.map(g => `${g.app} ${g.has}/${g.need}`).join(" · ");
    return [
      { id: "m1", stage: "detect", agent: "Watcher", icon: "radar", at: D.PUSH.detect.at, min: 0, text: `${v.id} fails all three quick-commerce gates; ${fmt.num(v.assess.atRisk)} of ${fmt.num(v.units)} units will not sell by ${fmt.date(v.bestBefore).replace(/ \d{4}$/, "")}.`, calls: [["gates.check", gates, "bad"], ["sellthrough.project", `${v.sellPerDay}/day × ${v.assess.usableDays} days = ${fmt.num(v.assess.willSell)} of ${fmt.num(v.units)}`, ""], ["pubsub.publish", "batch.at_risk", "ok"]] },
      { id: "m2", stage: "verify", agent: "Vision", icon: "scan-line", at: D.PUSH.verify.at, min: 5, text: `Asked ${v.dist.name} for one label photo before quoting any price.`, calls: [["fcm.send", v.dist.name, "ok"]] },
    ];
  }
  function MangoRoom({ me, item, below }) {
    const app = useApp(); const v = item.view; const sku = v.skuObj; const live = useLive(); const dim = live.conn !== "live";
    const stages = D.STAGES.map(x => ({ id: x.id, title: x.title, human: x.human }));
    return <S.Screen me={me} title="Route Room" sub={below ? null : `${v.id} · ${sku.brand} ${sku.name} · ${v.dist.name}, ${v.dist.city}`} back="Command Center" below={below}>
      <div className="stack" style={{ gap: 20 }}>
        <Card className="stack" style={{ gap: 16 }}>
          <div className="row wrap" style={{ gap: 16 }}>
            <Product name={sku.img} size={app.bp === "phone" ? 64 : 84} />
            <div className="grow"><div className="row base" style={{ gap: 10 }}><DaysNum days={v.daysLeft} life={sku.lifeDays} size="l" style={{ color: "var(--red-text)" }} /><span className="stack tight" style={{ gap: 0 }}><b>days left</b><span className="t-footnote subtle">best before {fmt.date(v.bestBefore)}</span></span></div></div>
            <div className="stack tight" style={{ justifyItems: app.bp === "phone" ? "start" : "end" }}><GateChips gates={v.assess.gates} /><span className="t-footnote subtle">{fmt.num(v.assess.atRisk)} of {fmt.num(v.units)} units at risk · sells {v.sellPerDay} a day</span></div>
          </div>
          <Dim on={dim}>{app.bp === "phone" ? <TrackerCompact done={item.done} current={item.current} /> : <Tracker stages={stages} done={item.done} current={item.current} times={MANGO_TIMES} />}</Dim>
        </Card>
        <S.Columns sideWidth={340}
          main={<>
            <S.SectionTitle sub={`Vision · asked at ${D.PUSH.verify.at}`}>Label, read from the shelf</S.SectionTitle>
            <Card className="stack" style={{ gap: 16 }}><div style={{ containerType: "inline-size" }}><div className="labelgrid">
              <div className="lv-await"><Product name={sku.img} size={app.bp === "phone" ? 110 : 140} alt="" /><div className="stack tight" style={{ justifyItems: "center", textAlign: "center", gap: 4 }}><b>Waiting for {v.dist.name}' photo</b><span className="t-footnote muted">One carton in the {v.dist.godown}. They send it from their own phone; the request reached them at {D.PUSH.verify.at}.</span></div></div>
              <div className="stack snug"><S.Locked icon="scan-line" agent="Vision Agent" live={!dim} text="Prices nothing until a person photographs one carton label on the shelf." />{[0, 1, 2, 3].map(i => <Skeleton key={i} h={44} r={12} />)}</div>
            </div></div></Card>
            <S.SectionTitle sub="Valuer">Five channels, priced</S.SectionTitle>
            <S.Locked icon="scale" agent="Valuer Agent" text="Prices five channels once the label is verified." />
            <S.SectionTitle sub="Router">Recommended split</S.SectionTitle>
            <S.Locked icon="split" agent="Router Agent" text="Proposes a split once the channels are priced." />
          </>}
          side={<><S.SectionTitle sub="Gaps drawn to the clock">Agent timeline</S.SectionTitle><Card><Dim on={dim}><AgentFeed events={mangoFeed(v)} people={D.PEOPLE} live={-1} /></Dim></Card></>} />
      </div>
    </S.Screen>;
  }

  /* ---------- a day with nothing at risk ---------- */
  // the next 09:00 on the journey clock, and how long that is in real time at this pace
  function nextCheck(clock) {
    const [h, m] = clock.time.split(":").map(Number); const [wh, wm] = Store.get().rules.watchTime.split(":").map(Number);
    const left = (1440 - (h * 60 + m) + wh * 60 + wm) % 1440 || 1440; const real = left / 1440 * clock.perDay;
    return real < 1.5 ? "about a minute" : real < 90 ? `about ${Math.round(real)} minutes` : `about ${Math.round(real / 60)} hours`;
  }
  function Quiet() {
    const s = S.useStore(); const app = useApp(); const live = useLive(); const watch = s.rules.watchTime; const cleared = s.hero.phase === "cleared";
    return <Card className="lv-quiet"><div className="lv-quiet-in"><Product name="sprout-box" size={app.bp === "phone" ? 96 : 120} alt="" /><div className="stack tight" style={{ gap: 6 }}>
      <div className="t-title3">Nothing at risk today</div>
      <p className="t-subhead muted" style={{ margin: 0 }}>The Watcher checked {D.SETUP.dms.rows} batches at {watch}. Every one sells through inside its date, so nothing needs you. The next check is tomorrow at {watch}, {nextCheck(live.clock)} from now at this pace.</p>
      {cleared && <div className="row tight wrap" style={{ marginTop: 6 }}><Badge tone="green" icon="check">Last cleared · {D.BATCHES[0].id}</Badge><span className="t-footnote subtle">{fmt.inr(D.ACTUAL.net)} recovered, 0 cartons destroyed</span></div>}
    </div></div></Card>;
  }
  // a partner's quiet day: nothing asked of them, and their own stock
  function DistQuiet({ me, dist, perm }) {
    const app = useApp(); const s = S.useStore();
    const mine = D.BATCHES.filter(b => b.distributor === dist.id && !b.hero && !b.second).map(b => D.batchView(b));
    return <S.Screen me={me} title="Today" sub={`${dist.name} · ${dist.godown}, ${dist.city}`}>
      <div className="stack" style={{ gap: 16 }}>
        {perm}
        <Card className="lv-quiet"><div className="lv-quiet-in"><Product name="godown" size={app.bp === "phone" ? 92 : 112} alt="" /><div className="stack tight" style={{ gap: 6 }}>
          <div className="t-title3">Nothing for you today</div>
          <p className="t-subhead muted" style={{ margin: 0 }}>No photo requests, scheme orders or marketplace lots. The Watcher checks your stock every morning at {s.rules.watchTime}; when it needs you, it sends a push.</p>
          {s.hero.phase === "cleared" && <div className="row tight wrap" style={{ marginTop: 6 }}><Badge tone="green" icon="check">{D.SKUS[D.BATCHES[0].sku].name.replace(/ \d+ ?(g|ml)$/, "")} cleared</Badge><span className="t-footnote subtle">credit note {fmt.inr(D.SUPPORT.total)} from {WS.short} · you ended whole</span></div>}
        </div></div></Card>
        <S.SectionTitle sub="From your nightly DMS export">Your stock</S.SectionTitle>
        <div className="list">{mine.map(v => <BatchRow key={v.id} view={v} compact={app.bp === "phone"} onOpen={() => {}} />)}</div>
      </div>
    </S.Screen>;
  }

  /* ---------- uploads: the label photo's Send fills as it goes; the DMS export shows its progress ---------- */
  function SendFill({ p, onCancel }) {
    const pct = Math.round(p * 100); const label = <><Icon name="send" size={18} />Sending · {pct}%</>;
    return <div className="stack tight" style={{ gap: 10 }}>
      <div className="lv-fill" role="progressbar" aria-label="Sending the photo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span className="lv-fill-off">{label}</span>
        <span className="lv-fill-on" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} aria-hidden="true">{label}</span>
      </div>
      {onCancel && <Button variant="ghost" block onClick={onCancel}>Cancel</Button>}
    </div>;
  }
  // Setup's stock export on its way: the file, its progress, and what happens to it next
  function ExportUpload({ name, size, p, onCancel }) {
    const steps = [["Upload", "now"], ["Map columns", "Data Agent"], ["Load into BigQuery", "then the Watcher starts"]];
    return <Card className="stack snug lv-upload">
      <div className="card-head"><span className="row tight" style={{ minWidth: 0 }}><span className="icontile"><Icon name="file-spreadsheet" size={17} stroke={2} /></span><span className="stack tight" style={{ gap: 0, minWidth: 0 }}><b style={{ overflowWrap: "anywhere" }}>{name}</b><span className="t-footnote subtle">DMS export · {fmt.num(Math.round(size / 1e5) / 10)} MB</span></span></span>{onCancel && <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}</div>
      <K.Progress value={p} label="Uploading the DMS export" />
      <span className="row between t-footnote subtle"><span className="tnum">Uploading · {(size / 1e6 * p).toFixed(1)} of {(size / 1e6).toFixed(1)} MB</span><span className="tnum">{Math.round(p * 100)}%</span></span>
      <ol className="lv-mini" aria-label="What happens to the file">{steps.map(([t, sub], i) => <li key={t} className={i === 0 ? "now" : ""}><i aria-hidden="true" /><b>{t}</b><span>{sub}</span></li>)}</ol>
      <span className="t-footnote muted">You can keep setting the rules below while it uploads. The column mapping appears here when the Data Agent has read the file.</span>
    </Card>;
  }

  /* ---------- a step that did not go through ---------- */
  // in the approve sheet: what happened, in the backend's words, and that nothing was done
  function ApproveFailed({ message }) {
    const reduce = useReducedMotion();
    return <motion.div className="lv-err" role="alert" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: EASE }}>
      <Icon name="circle-alert" size={18} /><span><b>The approval didn't go through.</b> {message} Nothing was listed, offered or sent; the plan is still waiting for you.</span>
    </motion.div>;
  }
  // offline, approving waits: the button says why
  function NeedsNet({ id }) { return <span id={id} className="t-footnote lv-needs"><Icon name="wifi-off" size={14} />Approving needs a connection</span>; }

  /* ---------- the first sign-in ends on one step: notifications, before the home ---------- */
  // the push this person gets, as their lock screen shows it
  const LEAD_PUSH = { operator: "plan", distributor: "verify", retailer: "offer", finance: "papers", sustainability: "report" };
  const myPush = me => { const lead = D.PUSH[LEAD_PUSH[me.role]]; return lead && lead.title ? lead : Object.values(D.PUSH).find(p => p.to === me.id && p.title); };
  function PushPreview({ me, blocked }) {
    const live = useLive(); const p = myPush(me); const time = p && /^\d\d:\d\d$/.test(p.at) ? p.at : live.clock.time;
    return <div className={cx("lv-pp", blocked && "blocked")} aria-hidden="true">
      <span className="lv-pp-time tnum">{time}</span><span className="lv-pp-date">{live.clock.long}</span>
      <div className="lv-pp-note"><span className="lv-pp-head"><Mark size={20} still /><span>{D.PLATFORM.name}</span><span className="lv-pp-now">now</span></span><b>{p ? p.title : WS.name}</b><span lang={p && p.hindi ? "hi" : undefined}>{p ? p.body : "When something needs you, it arrives here."}</span></div>
      {blocked && <span className="lv-pp-block"><Icon name="bell-off" size={16} />Blocked in this browser</span>}
    </div>;
  }
  function InstallArt() {
    return <div className="lv-ia" aria-hidden="true">
      <div className="lv-ia-bar"><Icon name="chevron-left" size={18} /><Icon name="chevron-right" size={18} /><span className="lv-ia-share"><Icon name="share-ios" size={18} /></span><Icon name="book-open" size={18} /><Icon name="copy" size={18} /></div>
      <div className="lv-ia-sheet"><span className="lv-ia-row"><span>Copy</span><Icon name="copy" size={18} /></span><span className="lv-ia-row on"><span>Add to Home Screen</span><Icon name="square-plus" size={18} /></span><span className="lv-ia-row"><span>Add Bookmark</span><Icon name="book-open" size={18} /></span></div>
    </div>;
  }
  // what the push brings, by role
  function askWords(me) {
    const watch = Store.get().rules.watchTime; const dist = D.DISTRIBUTORS[Object.keys(D.DISTRIBUTORS).find(k => D.DISTRIBUTORS[k].name === me.org) || "rakesh"];
    if (me.role === "operator") return ["Get the morning push", `When the Watcher flags a batch at ${watch} journey time, the plan reaches your lock screen with the money on it, and one tap opens it here.`];
    if (me.role === "distributor") return ["Get photo requests and orders as a push", "When Vision needs a label photo or your kiranas order on a scheme, it reaches your lock screen, in your language."];
    if (me.role === "retailer") return [`Get ${dist.name}' offers as a push`, "Schemes arrive in your language, ready to order in one tap."];
    return ["Get a push when something needs you", "When the journey needs you, it reaches your lock screen, and one tap opens it here."];
  }
  function PushStep({ me, variant, home, onAllow, onCheck, onDone }) {
    const app = useApp(); const [title, body] = askWords(me);
    const T = { ask: [title, body],
      install: ["Add the app to your Home Screen", "On iPhone, Safari sends notifications only to web apps opened from the Home Screen. Three taps, then open Clearance from there."],
      denied: ["Notifications are blocked", `Your browser blocks notifications from ${WS.domain}. Everything still reaches your inbox while they are off.`] }[variant];
    const steps = variant === "install" ? [["Tap", "Share", "in Safari's toolbar"], ["Choose", "Add to Home Screen", ""], ["Open", "Clearance", "from your Home Screen"]]
      : variant === "denied" ? (app.bp === "phone" ? [["In Chrome, open the menu (the three dots), then", "Settings", ""], ["Open", "Site settings", "and then Notifications"], ["Find", WS.domain, "and choose Allow"]] : [["Click", "the site settings icon", "at the left of the address bar"], ["Set", "Notifications", "to Allow"], ["Reload", "the page", ""]]) : null;
    return <S.Screen me={me} title={T[0]} hideLarge>
      <div className="lv-step">
        <div className="lv-step-art">{variant === "install" ? <InstallArt /> : <PushPreview me={me} blocked={variant === "denied"} />}</div>
        <div className="lv-step-copy">
          <h1 className="lv-step-t">{T[0]}</h1>
          <p className="lv-step-p">{T[1]}</p>
          {steps && <ol className="lv-steps">{steps.map(([a, b, c], i) => <li key={i}><span className="lv-stepn">{i + 1}</span><span>{a} <b>{b}</b> {c}</span></li>)}</ol>}
          <div className="lv-step-acts">
            {variant === "ask" && <Button variant="primary" size="lg" icon="bell" onClick={onAllow}>Turn on notifications</Button>}
            {variant === "denied" && <Button variant="secondary" size="lg" icon="refresh-cw" onClick={onCheck}>Check again</Button>}
            <Button variant={variant === "ask" ? "ghost" : "primary"} size="lg" iconRight="arrow-right" onClick={onDone}>{variant === "ask" ? "Not now" : `Continue to ${home}`}</Button>
          </div>
          <p className="t-footnote subtle" style={{ margin: 0 }}>You can change this in Profile at any time.</p>
        </div>
      </div>
    </S.Screen>;
  }

  /* ---------- the sign-in: email and password, in Munchly's card ---------- */
  // Sign in keeps its label (the console's, SC-46 and SC-49): "Signing in…" with the mark's S drawing in the icon's
  // place and a line along the foot, then a welcome and a tick; a wrong sign-in shakes it before the message
  function SignInButton({ phase, name }) {
    const reduce = useReducedMotion(); const busy = phase === "busy", done = phase === "done", err = phase === "error";
    const label = done ? `Welcome, ${name}` : busy ? "Signing in…" : "Sign in";
    return <motion.button type="submit" className={cx("btn btn-primary btn-lg btn-block si-btn", (busy || done) && "on")} aria-disabled={busy || done || undefined}
      animate={err && !reduce ? { x: [0, -8, 8, -5, 5, -2, 0] } : { x: 0 }} transition={{ duration: 0.36, ease: "easeOut" }}>
      <span className="si-btn-ic" aria-hidden="true">{done ? <svg width="20" height="20" viewBox="0 0 24 24"><motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.28, ease: EASE }} /></svg>
        : busy ? <svg width="20" height="20" viewBox="12 12 40 40"><circle cx="43.5" cy="19" r="4" fill="currentColor" /><motion.path d={S_PATH} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 1.1, ease: [0.65, 0, 0.35, 1] }} /></svg>
        : <Icon name="log-in" size={18} />}</span>
      <span className="si-btn-lbl"><AnimatePresence initial={false}><motion.span key={label} initial={reduce ? false : { y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -12, opacity: 0 }} transition={{ duration: 0.24, ease: EASE }}>{label}</motion.span></AnimatePresence></span>
      {(busy || done) && <motion.i className="si-btn-prog" aria-hidden="true" initial={{ scaleX: reduce ? 0.9 : 0 }} animate={{ scaleX: done ? 1 : 0.9 }} transition={{ duration: reduce ? 0 : done ? 0.16 : 1.1, ease: done ? EASE : [0.3, 0.7, 0.4, 1] }} />}
      <span className="sr-only" role="status">{busy ? "Signing in" : done ? `Signed in. Welcome, ${name}.` : ""}</span>
    </motion.button>;
  }
  // the story's people a judge may sign in as: a chip fills the email only; the password is handed over apart
  function Chips({ groups, onPick }) {
    return <div className="si-try">
      <span className="t-caption subtle strong">People in the story</span>
      {groups.map(g => <div key={g.group} className="si-chips"><span className="t-caption subtle">{g.group}</span><div className="row tight wrap" style={{ justifyContent: "center" }}>
        {g.people.map(p => <button key={p.id} type="button" className="chip" onClick={() => onPick(p.email)}><Avatar person={p} size="xs" />{p.short || p.name}</button>)}
      </div></div>)}
      <span className="t-caption subtle">A name fills in its email. The password is handed over with the invitation.</span>
    </div>;
  }
  // signed in, so the password was right; the account simply isn't in this workspace, and it's safe to say so
  function NotMember({ email, message, onOther }) {
    return <div className="si-form" style={{ gap: 14 }}>
      {email && <div className="si-who"><span className="si-who-av" aria-hidden="true"><Icon name="user" size={20} /></span><span className="si-who-t"><span className="si-who-k">Signed in as</span><b>{email}</b></span></div>}
      <div className="si-out" role="alert"><Icon name="info" size={18} /><span>{message} Ask {WS.short}'s workspace admin to invite you, or open a workspace you belong to.</span></div>
      <Button variant="secondary" size="lg" block icon="log-out" onClick={onOther}>Sign in with another account</Button>
    </div>;
  }
  // live: the workspace's email and password (the console's sign-in, SC-46), in the client's own card (SC-24). One message
  // for any wrong sign-in, and no forgot-password, since nothing is mailed
  function SignInLive({ groups, check, onSignedIn }) {
    const app = useApp(); const reduce = useReducedMotion(); const live = useLive(); const [find, setFind] = useState(false); const onFind = () => setFind(true);
    const [email, setEmail] = useState(live.prefill || ""); const [pw, setPw] = useState(live.prefill && !live.wrong ? "············" : ""); const [show, setShow] = useState(false);
    const [err, setErr] = useState(live.wrong || ""); const [phase, setPhase] = useState(live.busy ? "busy" : "idle"); const [first, setFirst] = useState("");
    const [out, setOut] = useState(live.outsider || null); const pwRef = useRef(null);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const fail = async message => { setPhase("error"); await wait(reduce ? 0 : 360); setPhase("idle"); setErr(message); setPw(""); };
    const submit = async e => {
      e.preventDefault(); if (phase === "busy" || phase === "done") return; setErr("");
      if (!email.trim() || !pw) return fail(live.wrongWords);
      setPhase("busy");
      let r; try { r = await check(email, pw); } catch (x) { if (x && x.outsider) { setPhase("idle"); setOut({ email: email.trim(), message: x.message }); return; } return fail(x.message); }
      setFirst(r.short || r.name.split(" ")[0]); setPhase("done"); await wait(720); onSignedIn(r);
    };
    const edit = set => ev => { set(ev.target.value); setErr(""); };
    const form = out ? <NotMember email={out.email} message={out.message} onOther={() => { setOut(null); setEmail(""); setPw(""); setPhase("idle"); }} />
      : <form className="si-form" noValidate onSubmit={submit}>
        <Field label="Email" htmlFor="si-email"><Input id="si-email" icon="mail" type="email" value={email} onChange={edit(setEmail)} autoComplete="username" spellCheck={false} autoCapitalize="none" placeholder={`name@${liveDomain()}`} /></Field>
        <Field label="Password" htmlFor="si-pw"><span className="input-wrap si-pw"><Icon name="lock" size={17} /><input ref={pwRef} id="si-pw" className="input" type={show ? "text" : "password"} value={pw} onChange={edit(setPw)} autoComplete="current-password" aria-invalid={err ? "true" : undefined} aria-describedby={err ? "si-err" : undefined} /><button type="button" className="si-eye" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow(!show)}><Icon name={show ? "eye-off" : "eye"} size={20} /></button></span></Field>
        {err && <div className="si-err" id="si-err" role="alert"><Icon name="circle-alert" size={18} /><span>{err}</span></div>}
        <SignInButton phase={phase} name={first} />
        <p className="t-footnote muted si-hint">First time here? Whoever invited you gives you your first password. Nothing is sent by email.</p>
      </form>;
    return <div className="signin">
      <div className="ground" aria-hidden="true" />
      {app.bp === "desktop" && <S.HeroStage />}
      <div className="si-panel">
        <div className="si-card">
          <div className="si-ws"><WorkspaceMark ws={WS} size={app.bp === "phone" ? 52 : 60} /><div className="si-ws-name">{WS.name}</div><span className="si-url"><Icon name="lock" size={12} stroke={2.2} />{WS.domain}</span></div>
          {app.bp !== "desktop" && !out && <div className="si-hero" aria-hidden="true"><Product name="carton-hero" size={app.bp === "phone" ? 120 : 150} float /></div>}
          <div className="stack tight" style={{ gap: 6 }}><h1 className="si-title">{out ? "Not a member here" : "Sign in"}</h1>{!out && <p className="si-sub">Use the email address you were invited with, and your password.</p>}</div>
          {form}
          {!out && groups && groups.length > 0 && <Chips groups={groups} onPick={v => { setEmail(v); setErr(""); if (pwRef.current) pwRef.current.focus(); }} />}
          <div className="si-foot">
            <PoweredBy />
            <span className="si-foot-row"><button type="button" className="btn btn-link btn-sm" onClick={onFind}>Not your workspace? Find yours</button></span>
            <span className="si-note">Prototype · every company, person and number is fictional</span>
          </div>
        </div>
      </div>
      <S.FindWorkspace open={find} onClose={() => setFind(false)} initial={email} note={`Only ${WS.name} is set up in this prototype.`} onUse={v => { setFind(false); setOut(null); setEmail(v); setErr(""); }} />
    </div>;
  }

  window.SC3_SCREENS.Live = { cue, cueLong, down, stateWord, ConnMark, Cue, Line, BarSub, Band, Dim, flaggedItems, BatchTabs, Flagged, Switcher, MangoCard, MangoRoom, pausedWords, Quiet, DistQuiet, SendFill, ExportUpload, ApproveFailed, NeedsNet, PushStep, SignInLive, SignInButton };
})();

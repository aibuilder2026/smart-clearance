// SC-68 · option B, "In the header, batch by batch". Every page says under its title whether it is live and what
// journey time it is; a dropped stream becomes a band across the page. The batches flagged this morning are tabs, over
// the Command Center's tracker card and under the Route Room's title. After signing in, the console's splash (SC-51)
// covers the first reads, and the first sign-in ends on one step that asks for notifications before the home opens.
(function () {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS, X = window.SC68, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, IconButton, Badge, Button, Card, Product, Mark, WorkspaceMark, useApp } = K;
  const WS = D.WORKSPACE;

  // under every large title: live or not, the journey's date and time, and the pace
  function HeaderLine() {
    const live = X.useLive(); const off = live.conn !== "live";
    return <span className={cx("x68-liveline", off && "off")}><X.ConnMark conn={live.conn} /><span className="x68-ll-st">{live.conn === "live" ? "Live" : live.conn === "connecting" ? "Catching up" : live.conn === "offline" ? "Offline" : "Reconnecting"}</span><span className="x68-sep" aria-hidden="true" /><X.ClockTime clock={live.clock} /><X.Cue perDay={live.clock.perDay} /></span>;
  }
  // once the title has collapsed into the bar, the same line shrinks under it
  function BarSub() { const live = X.useLive(); return <span className="x68-barsub"><X.ConnMark conn={live.conn} size={6} /><span className="tnum">{live.clock.time}</span><X.Cue perDay={live.clock.perDay} short /></span>; }
  // a dropped stream is a band across the page, under the bar, that stays while it lasts
  function PageTop() {
    const live = X.useLive(); if (live.conn !== "reconnecting" && live.conn !== "offline") return null; const off = live.conn === "offline";
    return <div className="x68-band" role="status"><X.ConnMark conn={live.conn} /><span className="x68-band-t"><b>{off ? "You're offline." : "Reconnecting…"}</b> {off ? `Showing what was here at ${live.since}. Approving and sending wait for a connection.` : `Updates paused at ${live.since}, so what you see may be behind. Anything you do still goes through.`}</span>{off && <Button size="sm" variant="secondary" icon="refresh-cw">Try again</Button>}</div>;
  }

  // the batches flagged this morning, as tabs: each with its pack, its id and the stop it is at
  function BatchTabs({ items, current, onPick, asTabs, label }) {
    return <div className="x68-tabs" role={asTabs ? "tablist" : undefined} aria-label={label}>
      {items.map(it => { const on = it.ref === current; const sku = it.view.skuObj;
        return <button key={it.ref} type="button" id={"tab-" + it.ref} role={asTabs ? "tab" : undefined} aria-selected={asTabs ? on : undefined} aria-controls={asTabs ? "panel-flagged" : undefined} aria-current={!asTabs && on ? "page" : undefined} className={cx("x68-tab", on && "on")} onClick={() => onPick(it.ref)}>
          <Product name={sku.img} size={30} alt="" />
          <span className="x68-tab-t"><b>{sku.name}</b><span className="mono">{it.ref}</span></span>
          <span className={cx("x68-tab-stop", it.human && "human")}><i aria-hidden="true" />{it.stop}</span>
        </button>; })}
    </div>;
  }
  function Flagged({ items, phone, go, dim, offline, trackerFor }) {
    const [cur, setCur] = useState(items[0].ref); const item = items.find(i => i.ref === cur) || items[0];
    if (items.length < 2) return trackerFor(item, { phone, go, dim, offline });
    return <div className="stack" style={{ gap: 10 }}>
      <div className="row between wrap x68-qhead"><b className="t-subhead">Flagged this morning</b><span className="t-footnote subtle">{items.length} batches · one needs your yes</span></div>
      <BatchTabs items={items} current={cur} onPick={setCur} asTabs label="Batches flagged this morning" />
      <div role="tabpanel" id="panel-flagged" aria-labelledby={"tab-" + item.ref}>{trackerFor(item, { phone, go, dim, offline })}</div>
    </div>;
  }
  function Switcher({ items, current }) { const { go } = S.useRoute(); return <div className="x68-switch-tabs"><BatchTabs items={items} current={current} onPick={ref => go("route", { ref })} label="Batches flagged this morning" /></div>; }

  /* ---------- the first load: the console's splash, in Munchly's workspace ---------- */
  function MarkDraw({ size = 96, p }) {
    return <svg className="mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs><linearGradient id="x68g" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2fbf7f" /><stop offset="0.55" stopColor="#178258" /><stop offset="1" stopColor="#0d5a3e" /></linearGradient></defs>
      <path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#x68g)" />
      <path d={X.S_PATH} fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d={X.S_PATH} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: p }} transition={{ duration: 0.42, ease: X.EASE }} />
      <circle cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" strokeWidth="2.6" />
      {p >= 1 && <circle cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" strokeWidth="2.2" />}
    </svg>;
  }
  const READS = [["Signed in", "0.4 s"], [`${WS.name}' workspace`, "0.3 s"], ["This morning's batches", "0.9 s"], ["Live updates", "0.5 s"]];
  function Splash({ me }) {
    const reduce = useReducedMotion(); const app = useApp(); const [n, setN] = useState(X.SHOT ? 3 : 1);
    useEffect(() => { if (X.SHOT || n >= 4) return; const t = setTimeout(() => setN(n + 1), reduce ? 0 : 620); return () => clearTimeout(t); }, [n]);
    const hour = Number(X.useLive().clock.time.slice(0, 2)); const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    return <div className="x68-splash" aria-hidden={false}>
      <div className="ground" aria-hidden="true" />
      <div className="x68-sp-in">
        <MarkDraw size={app.bp === "phone" ? 84 : 104} p={n / 4} />
        <span className="x68-sp-ws"><WorkspaceMark ws={WS} size={22} /><span>{WS.name}</span></span>
        <h2 className="x68-sp-title">{greet}, {me.short || me.name}</h2>
        <ol className="x68-sp-stops">{READS.map(([t, time], i) => <li key={t} className={i < n ? "done" : i === n ? "now" : ""}><i aria-hidden="true" /><b>{t}</b><span className="mono">{i < n ? time : i === n ? "…" : ""}</span></li>)}</ol>
      </div>
      <span className="sr-only" role="status">Signed in. Opening {WS.name}' workspace for {me.short || me.name}.</span>
    </div>;
  }

  /* ---------- the first sign-in ends on one step: notifications, before the home ---------- */
  function PushPreview({ blocked }) {
    const p = D.PUSH.plan;
    return <div className={cx("x68-pp", blocked && "blocked")} aria-hidden="true">
      <span className="x68-pp-time tnum">09:23</span><span className="x68-pp-date">Friday 2 October</span>
      <div className="x68-pp-note"><span className="x68-pp-head"><Mark size={20} still /><span>Smart-Clearance</span><span className="x68-pp-now">now</span></span><b>{p.title}</b><span>Net {fmt.inr(D.PLAN.net)}, {fmt.inr(D.PLAN.swing)} better than write-off. Tap to review and approve.</span></div>
      {blocked && <span className="x68-pp-block"><Icon name="bell-off" size={16} />Blocked in this browser</span>}
    </div>;
  }
  function InstallArt() {
    return <div className="x68-ia" aria-hidden="true">
      <div className="x68-ia-bar"><Icon name="chevron-left" size={18} /><Icon name="chevron-right" size={18} /><span className="x68-ia-share"><Icon name="share-ios" size={18} /></span><Icon name="book-open" size={18} /><Icon name="copy" size={18} /></div>
      <div className="x68-ia-sheet"><span className="x68-ia-row"><span>Copy</span><Icon name="copy" size={18} /></span><span className="x68-ia-row on"><span>Add to Home Screen</span><Icon name="square-plus" size={18} /></span><span className="x68-ia-row"><span>Add Bookmark</span><Icon name="book-open" size={18} /></span></div>
    </div>;
  }
  function Step({ me, onDone }) {
    const scn = X.useScn(); const v = scn.push; const app = useApp(); const { toast } = K.useNotice();
    const allow = () => { toast({ text: "Notifications are on. The 09:00 push reaches this device.", tone: "ok", icon: "bell" }); onDone(); };
    const T = { ask: ["Get the morning push", "When the Watcher flags a batch at 09:00 journey time, the plan reaches your lock screen with the money on it, and one tap opens it here."],
      install: ["Add the app to your Home Screen", "On iPhone, Safari sends notifications only to web apps opened from the Home Screen. Three taps, then open Clearance from there."],
      denied: ["Notifications are blocked", `Your browser blocks notifications from ${WS.domain}. Everything still reaches your inbox while they are off.`] }[v];
    const steps = v === "install" ? [["Tap", "Share", "in Safari's toolbar"], ["Choose", "Add to Home Screen", ""], ["Open", "Clearance", "from your Home Screen"]]
      : v === "denied" ? (app.bp === "phone" ? [["In Chrome, open the menu (the three dots), then", "Settings", ""], ["Open", "Site settings", "and then Notifications"], ["Find", WS.domain, "and choose Allow"]] : [["Click", "the site settings icon", "at the left of the address bar"], ["Set", "Notifications", "to Allow"], ["Reload", "the page", ""]]) : null;
    return <X.Screen68 me={me} title={T[0]} hideLarge>
      <div className="x68-step">
        <div className="x68-step-art">{v === "install" ? <InstallArt /> : <PushPreview blocked={v === "denied"} />}</div>
        <div className="x68-step-copy">
          <h1 className="x68-step-t">{T[0]}</h1>
          <p className="x68-step-p">{T[1]}</p>
          {steps && <ol className="x68-steps">{steps.map(([a, b, c], i) => <li key={i}><span className="x68-stepn">{i + 1}</span><span>{a} <b>{b}</b> {c}</span></li>)}</ol>}
          <div className="x68-step-acts">
            {v === "ask" && <Button variant="primary" size="lg" icon="bell" onClick={allow}>Turn on notifications</Button>}
            {v === "denied" && <Button variant="secondary" size="lg" icon="refresh-cw">Check again</Button>}
            <Button variant={v === "ask" ? "ghost" : "primary"} size="lg" iconRight="arrow-right" onClick={onDone}>{v === "ask" ? "Not now" : "Continue to the Command Center"}</Button>
          </div>
          <p className="t-footnote subtle" style={{ margin: 0 }}>You can change this in Profile at any time.</p>
        </div>
      </div>
    </X.Screen68>;
  }

  // signed in, but not here: where this account does sign in, from its own memberships
  function NotMemberExtra() {
    return <div className="stack tight" style={{ gap: 8 }}>
      <span className="t-caption subtle strong" style={{ textAlign: "left" }}>Where this account signs in</span>
      <div className="card row x68-where"><Mark size={34} still /><span className="stack tight grow" style={{ gap: 1, minWidth: 0, textAlign: "left" }}><b className="t-subhead">Smart-Clearance console</b><span className="mono t-caption subtle">console.smartclearance.com</span></span><Button size="sm" variant="secondary" iconRight="external-link">Open</Button></div>
    </div>;
  }

  // the label photo: the send button fills as the photo goes, its words staying readable over both halves
  function UploadUnderPhoto({ p }) {
    const pct = Math.round(p * 100); const label = <><Icon name="send" size={18} />Sending · {pct}%</>;
    return <div className="stack tight" style={{ gap: 10 }}>
      <div className="x68-fill" role="progressbar" aria-label="Sending the photo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span className="x68-fill-off">{label}</span>
        <span className="x68-fill-on" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} aria-hidden="true">{label}</span>
      </div>
      <Button variant="ghost" block>Cancel</Button>
    </div>;
  }

  window.SC68_OPT = { id: "b", name: "In the header, batch by batch", pushPlace: "step", firstLoad: "splash", HeaderLine, BarSub, PageTop, Flagged, Switcher, Splash, Step, NotMemberExtra, UploadUnderPhoto,
    init: () => { document.documentElement.dataset.opt = "b"; } };
})();

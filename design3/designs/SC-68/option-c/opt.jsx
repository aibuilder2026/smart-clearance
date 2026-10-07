// SC-68 · option C, "On the tracker". The tracker leaves the card and docks at the foot of every screen, the way a
// delivery app keeps a live order in view: the batch in focus, its stop, journey time and the pace, whether updates are
// arriving, and a pager across the batches flagged this morning. Whatever is in motion uses the same bar: the first
// load catching up, an upload on its way, an approval that did not go through, and the push ask after the first sign-in.
(function () {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS, X = window.SC68, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, IconButton, Badge, Button, Card, Product, Progress, Mark, useApp } = K;

  // the clock where the batch's time is told: the tracker card's head, and the bar
  function TrackClock({ compact }) {
    const live = X.useLive();
    return <span className={cx("x68-tkclock", live.conn !== "live" && "off")}><X.ConnMark conn={live.conn} /><X.ClockTime clock={live.clock} withDate={!compact} /><X.Cue perDay={live.clock.perDay} short={compact} /></span>;
  }

  // the batch in front of the deck, which the bar follows on the Command Center (the Route Room's comes from its address)
  const FOCUS = { i: 0, subs: new Set() };
  const setFocus = i => { FOCUS.i = i; FOCUS.subs.forEach(f => f(i)); };
  function useFocus() { const [i, setI] = useState(FOCUS.i); useEffect(() => { FOCUS.subs.add(setI); return () => FOCUS.subs.delete(setI); }, []); return [i, setFocus]; }

  // the Command Center: the flagged batches as a deck of tracker cards, one in front, a pager under them
  function Flagged({ items, phone, go, dim, offline, trackerFor }) {
    const [i, setI] = useFocus(); const item = items[Math.min(i, items.length - 1)]; const n = items.length;
    const card = trackerFor(item, { phone, go, dim, offline, head: <TrackClock compact={phone} /> });
    if (n < 2) return card;
    const next = items[(i + 1) % n];
    return <div className="x68-deck">
      <div className="x68-deck-stack"><span className="x68-deck-peek" aria-hidden="true" />{card}</div>
      <div className="x68-pager">
        <IconButton icon="chevron-left" label="Previous flagged batch" disabled={i === 0} onClick={() => setI(i - 1)} />
        <span className="x68-pager-mid"><span className="x68-dots">{items.map((it, k) => <button key={it.ref} type="button" className={k === i ? "on" : ""} aria-label={`${it.view.skuObj.name}, ${it.ref}`} aria-current={k === i ? "true" : undefined} onClick={() => setI(k)}><i /></button>)}</span>
          <span className="t-footnote subtle">{i + 1} of {n} flagged this morning · next, {next.view.skuObj.name} at {next.stop}</span></span>
        <IconButton icon="chevron-right" label="Next flagged batch" disabled={i === n - 1} onClick={() => setI(i + 1)} />
      </div>
    </div>;
  }
  // the Route Room keeps its identity line, says which flagged batch this is; the bar below pages between them
  function Switcher({ items, current }) {
    const i = Math.max(0, items.findIndex(x => x.ref === current)); const v = items[i].view;
    return <div className="x68-idline"><span><span className="mono">{v.id}</span> · {v.skuObj.brand} {v.skuObj.name} · {v.dist.name}, {v.dist.city}</span><Badge size="sm">{i + 1} of {items.length} flagged</Badge></div>;
  }

  /* ---------- the live order bar ---------- */
  function Dock({ me, route }) {
    const live = X.useLive(); const scn = X.useScn(); const s = S.useStore(); const app = useApp(); const phone = app.bp === "phone"; const { route: r, go } = S.useRoute(); const reduce = useReducedMotion();
    const [asked, setAsked] = useState(false); const [failed, setFailed] = useState(!!scn.fail && X.SHOT); const { toast } = K.useNotice();
    useEffect(() => { const f = () => setFailed(true); window.addEventListener("sc68:failed", f); return () => window.removeEventListener("sc68:failed", f); }, []);
    const op = me.role === "operator"; const items = op && !scn.quiet && route !== "setup" ? X.flaggedItems(s, scn) : [];
    const [fi] = useFocus(); const onRoom = route === "route";
    const ref = (onRoom && r.params && r.params.ref) || (items[Math.min(fi, items.length - 1)] && items[Math.min(fi, items.length - 1)].ref); const idx = Math.max(0, items.findIndex(x => x.ref === ref)); const item = items[idx];
    const pageTo = k => (onRoom ? go("route", { ref: items[k].ref }) : setFocus(k));
    const off = live.conn === "reconnecting" || live.conn === "offline";
    let key, body;
    if (scn.push && !asked) { key = "push"; body = <div className="x68-dock-push"><X.PushContent variant={scn.push} me={me} compact onAllow={() => { setAsked(true); toast({ text: "Notifications are on. The 09:00 push reaches this device.", tone: "ok", icon: "bell" }); }} onLater={() => setAsked(true)} /></div>; }
    else if (live.conn === "connecting") { key = "load"; body = <div className="x68-dock-row"><span className="x68-dock-lead"><X.ConnMark conn="connecting" /></span><span className="x68-dock-main"><b>Catching up with the agents</b><span>This morning's batches are in · live updates next</span></span><TrackClock compact={phone} /></div>; }
    else if (scn.upload) { const photo = scn.upload === "photo"; key = "up"; body = <div className="x68-dock-row"><span className="x68-dock-lead"><span className="icontile soft"><Icon name="cloud-upload" size={17} /></span></span><span className="x68-dock-main"><b>{photo ? "Label photo · sending" : "dms_export_2026-10-01.csv · uploading"}</b><Progress value={photo ? 0.62 : 0.64} label={photo ? "Sending the label photo" : "Uploading the DMS export"} /><span className="tnum">{photo ? "1.4 of 2.3 MB · you can leave this screen" : "3.1 of 4.8 MB · keep setting the rules meanwhile"}</span></span>{!phone && <TrackClock />}</div>; }
    else if (failed) { key = "fail"; body = <div className="x68-dock-row x68-dock-fail" role="alert"><span className="x68-dock-lead"><Icon name="circle-alert" size={20} /></span><span className="x68-dock-main"><b>Approval not sent · MF-2409-117</b><span>Nothing was listed, offered or sent. The plan still waits for you.</span></span><Button variant="approve" size="sm" icon="refresh-cw" onClick={() => window.dispatchEvent(new Event("sc68:approve"))}>Retry</Button></div>; }
    else if (scn.quiet || !item) { key = "quiet"; body = <div className="x68-dock-row"><span className="x68-dock-lead"><span className="icontile soft"><Icon name="radar" size={17} /></span></span><span className="x68-dock-main"><b>Nothing in motion</b><span>Next Watcher check: 09:00 tomorrow, {X.untilNine(live.clock)} from now</span></span><TrackClock compact={phone} /></div>; }
    else {
      key = "item";
      const approveHere = route === "route" && item.hero && item.human;
      body = <div className={cx("x68-dock-row", off && "off")}>
        <button type="button" className="x68-dock-open" onClick={() => go("route", { ref: item.ref })} aria-label={`${item.view.skuObj.name}, ${item.ref}: ${item.stop}, ${item.waiting}. Open its Route Room`}>
          <Product name={item.view.skuObj.img} size={phone ? 34 : 40} alt="" />
          <span className="x68-dock-main">
            <span className="x68-dock-top"><b>{item.stop}</b><span>{off ? (live.conn === "offline" ? `offline · as of ${live.since}` : `reconnecting · paused at ${live.since}`) : item.waiting.replace(/^Waiting for /, "waiting for ")}</span></span>
            <X.Segs done={item.done} current={item.current} human={item.human} dim={off} small label={`${item.stop}, stop ${item.current + 1} of 9`} />
            <span className="x68-dock-id"><span className="mono">{item.ref}</span>{phone ? null : ` · ${item.view.skuObj.name}`}</span>
          </span>
        </button>
        {!phone && <TrackClock />}
        {items.length > 1 && <span className="x68-dock-pager"><IconButton icon="chevron-left" label="Previous flagged batch" disabled={idx === 0} onClick={() => pageTo(idx - 1)} /><span className="tnum">{idx + 1}/{items.length}</span><IconButton icon="chevron-right" label="Next flagged batch" disabled={idx === items.length - 1} onClick={() => pageTo(idx + 1)} /></span>}
        {approveHere && !phone && <Button variant="approve" icon="check" aria-disabled={live.conn === "offline" || undefined} className={live.conn === "offline" ? "x68-blocked" : undefined} onClick={() => live.conn !== "offline" && window.dispatchEvent(new Event("sc68:approve"))}>Review and approve</Button>}
      </div>;
      if (phone) body = <>{body}<div className="x68-dock-sub">{approveHere ? <Button variant="approve" size="sm" icon="check" block aria-disabled={live.conn === "offline" || undefined} className={live.conn === "offline" ? "x68-blocked" : undefined} onClick={() => live.conn !== "offline" && window.dispatchEvent(new Event("sc68:approve"))}>{live.conn === "offline" ? "Approving needs a connection" : "Review and approve"}</Button> : <TrackClock />}</div></>;
    }
    return <div className={cx("x68-dock", key === "push" && "tall")} role="region" aria-label="In motion">
      <AnimatePresence mode="popLayout" initial={false}><motion.div key={key} className="x68-dock-in" initial={reduce || X.SHOT ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 10 }} transition={{ type: "spring", stiffness: 420, damping: 34, mass: 1 }}>{body}</motion.div></AnimatePresence>
    </div>;
  }

  function UploadUnderPhoto({ p, mb }) {
    return <><X.UploadLine p={p} mb={mb} total="2.3 MB" label="Sending the photo" /><p className="t-footnote muted" style={{ margin: 0, textAlign: "center" }}>You can leave this screen. The bar at the foot keeps sending and says when the photo has landed.</p></>;
  }

  window.SC68_OPT = { id: "c", name: "On the tracker", pushPlace: "dock", firstLoad: "skeleton", dockApproves: true, failSheetClosed: true, Flagged, Switcher, Dock, UploadUnderPhoto,
    onFail: () => window.dispatchEvent(new Event("sc68:failed")),
    init: () => { document.documentElement.dataset.opt = "c"; } };
})();

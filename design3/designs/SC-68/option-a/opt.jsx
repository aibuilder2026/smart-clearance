// SC-68 · option A, "In the shell". Everything live sits in one quiet place the person already has on every screen:
// the journey clock and the connection at the foot of the sidebar (a chip in the bar on phones); the push ask as a
// card at the top of home after the first sign-in; the first load as the screen's own shape; the batch in focus named
// where the Route Room names its batch, with a switcher and the next and previous flagged batch.
(function () {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS, X = window.SC68, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, IconButton, Badge, Button, Sheet, List, ListRow, Product, useApp } = K;

  // the clock's own sheet: what the time means, how fast it runs, and whether updates are arriving
  function ClockSheet({ open, onClose }) {
    const live = X.useLive(); const app = useApp();
    return <Sheet open={open} onClose={onClose} title="Journey time" side={app.bp === "phone" ? "bottom" : "center"} detent="medium">
      <div className="stack">
        <div className="stack tight" style={{ gap: 2 }}><span className="x68-bigtime tnum">{live.clock.time}</span><span className="t-subhead muted">{live.clock.long}</span></div>
        <List>
          <ListRow icon="fast-forward" iconTone="blue" title="Pace" sub={X.cueLong(live.clock.perDay) + " " + X.journeySpan(live.clock.perDay)} />
          <ListRow icon={live.conn === "offline" ? "wifi-off" : "activity"} iconTone={live.conn === "live" ? undefined : "gray"} title="Updates" sub={live.conn === "live" ? "Live. Agents' work arrives as it happens." : X.connWords(live.conn, live.since)} />
        </List>
        <p className="t-footnote subtle" style={{ margin: 0 }}>Every time on these screens is journey time. Smart-Clearance sets the pace for Munchly's workspace in the console.</p>
      </div>
    </Sheet>;
  }
  // desktop: a quiet block above the person at the foot of the sidebar
  function ShellFoot() {
    const live = X.useLive(); const [open, setOpen] = useState(false); const app = useApp();
    if (app.bp === "phone") return null;
    const off = live.conn !== "live";
    return <>
      <button type="button" className={cx("x68-clock", off && "off")} onClick={() => setOpen(true)} aria-label={`Journey time, ${live.clock.long}, ${live.clock.time}. ${X.cueLong(live.clock.perDay)} ${X.connWords(live.conn, live.since)}.`}>
        <span className="x68-clock-st"><X.ConnMark conn={live.conn} /><span>{X.connWords(live.conn, live.since)}</span></span>
        <span className="x68-clock-time"><span className="x68-clock-date">{live.clock.date}</span><b className="tnum">{live.clock.time}</b></span>
        <span className="x68-clock-foot"><span>Journey time</span><X.Cue perDay={live.clock.perDay} /></span>
      </button>
      <ClockSheet open={open} onClose={() => setOpen(false)} />
    </>;
  }
  // phone: a chip in the navigation bar, beside the bell; when updates stop it says so instead of the time
  function NavExtra() {
    const live = X.useLive(); const [open, setOpen] = useState(false); const app = useApp();
    if (app.bp !== "phone") return null;
    const off = live.conn !== "live";
    const word = live.conn === "reconnecting" ? "Reconnecting" : live.conn === "offline" ? "Offline" : live.conn === "connecting" ? "Catching up" : null;
    return <>
      <button type="button" className={cx("x68-navclock", off && "off")} onClick={() => setOpen(true)} aria-label={`Journey time ${live.clock.time}, ${live.clock.date}. ${X.connWords(live.conn, live.since)}. Details`}>
        <X.ConnMark conn={live.conn} size={7} />{word ? <span>{word}</span> : <><span className="tnum">{live.clock.time}</span><X.Cue perDay={live.clock.perDay} short /></>}
      </button>
      <ClockSheet open={open} onClose={() => setOpen(false)} />
    </>;
  }

  // the Command Center: the batch that needs a person first, as the tracker card; the rest flagged today under it
  function Flagged({ items, phone, go, dim, offline, trackerFor, FlagRow }) {
    const [first, ...rest] = items;
    return <div className="stack" style={{ gap: 14 }}>
      {trackerFor(first, { phone, go, dim, offline })}
      {rest.length > 0 && <div className="stack tight" style={{ gap: 8 }}>
        <div className="row between" style={{ padding: "0 4px" }}><b className="t-subhead">Also flagged this morning</b><span className="t-footnote subtle">{rest.length} more</span></div>
        <div className="list">{rest.map(i => <FlagRow key={i.ref} item={i} dim={dim} onOpen={() => go("route", { ref: i.ref })} />)}</div>
      </div>}
    </div>;
  }

  // the Route Room names its batch with a switcher: the flagged batches in a menu, and the previous and next one
  function Switcher({ items, current, phone, open: initial }) {
    const { go } = S.useRoute(); const [open, setOpen] = useState(!!initial); const btn = useRef(null); const list = useRef(null);
    const i = Math.max(0, items.findIndex(x => x.ref === current)); const item = items[i]; const v = item.view; const sku = v.skuObj;
    const pick = ref => { setOpen(false); if (ref !== current) go("route", { ref }); };
    useEffect(() => { if (!open || X.SHOT) return; const el = list.current && list.current.querySelector('[aria-checked="true"]'); if (el) el.focus(); }, [open]);
    const key = e => { const all = [...list.current.querySelectorAll("[role=menuitemradio]")]; const k = all.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); all[(k + 1) % all.length].focus(); } else if (e.key === "ArrowUp") { e.preventDefault(); all[(k - 1 + all.length) % all.length].focus(); } else if (e.key === "Escape") { setOpen(false); btn.current && btn.current.focus(); } else if (e.key === "Tab") setOpen(false); };
    return <div className="x68-switch-row">
      <div className="x68-switch-wrap">
        <button ref={btn} type="button" className="x68-switch" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Product name={sku.img} size={phone ? 36 : 40} alt="" />
          <span className="x68-switch-t"><b>{phone ? sku.name : `${sku.brand} ${sku.name}`}</b><span><span className="mono">{v.id}</span> · {phone ? v.dist.city : `${v.dist.name}, ${v.dist.city}`}</span></span>
          <span className="x68-switch-n">{i + 1} of {items.length}</span>
          <Icon name="chevron-down" size={18} />
        </button>
        {open && <div ref={list} className="x68-menu" role="menu" aria-label="Batches flagged this morning" onKeyDown={key}>
          <div className="x68-menu-h">Flagged this morning</div>
          {items.map(it => <button key={it.ref} type="button" role="menuitemradio" aria-checked={it.ref === current} className="x68-menu-i" onClick={() => pick(it.ref)}>
            <Product name={it.view.skuObj.img} size={36} alt="" />
            <span className="x68-menu-t"><b>{it.view.skuObj.name}</b><span><span className="mono">{it.ref}</span> · {it.view.daysLeft} days left</span><X.Segs done={it.done} current={it.current} human={it.human} small label={`${it.stop}, stop ${it.current + 1} of 9`} /></span>
            <span className={cx("x68-menu-stop", it.human && "human")}>{it.stop}</span>
            {it.ref === current ? <Icon name="check" size={16} /> : <span style={{ width: 16 }} />}
          </button>)}
          <div className="x68-menu-sep" />
          <button type="button" role="menuitem" className="x68-menu-i x68-menu-all" onClick={() => { setOpen(false); go("batches"); }}><Icon name="boxes" size={18} /><span>All batches</span></button>
        </div>}
      </div>
      {!phone && <span className="row tight"><IconButton icon="chevron-left" label="Previous flagged batch" disabled={i === 0} onClick={() => pick(items[i - 1].ref)} /><IconButton icon="chevron-right" label="Next flagged batch" disabled={i === items.length - 1} onClick={() => pick(items[i + 1].ref)} /></span>}
    </div>;
  }

  // the label photo: progress drawn on the photo itself, as the messaging apps people already know do it
  function UploadOnPhoto({ p }) {
    const r = 28, c = 2 * Math.PI * r;
    return <div className="x68-ringwrap"><div className="x68-ring" role="progressbar" aria-label="Sending the photo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}>
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r={r} fill="none" stroke="rgb(255 255 255 / 0.28)" strokeWidth="5" /><circle cx="36" cy="36" r={r} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 36 36)" style={{ transition: "stroke-dashoffset 240ms var(--ease)" }} /></svg>
      <button type="button" className="x68-ring-x" aria-label="Cancel sending"><Icon name="x" size={22} stroke={2.4} /></button>
    </div></div>;
  }
  function UploadUnderPhoto({ p, mb }) {
    return <div className="card row" style={{ gap: 12, padding: "14px 16px" }}><span className="icontile soft" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name="cloud-upload" size={19} /></span><div className="grow stack tight" style={{ gap: 1 }}><b>Sending the photo</b><span className="t-footnote muted tnum">{mb} of 2.3 MB · {Math.round(p * 100)}%</span></div><Button variant="ghost" size="sm">Cancel</Button></div>;
  }

  window.SC68_OPT = { id: "a", name: "In the shell", pushPlace: "home", firstLoad: "skeleton", ShellFoot, NavExtra, Flagged, Switcher, UploadOnPhoto, UploadUnderPhoto,
    init: () => { document.documentElement.dataset.opt = "a"; } };
})();

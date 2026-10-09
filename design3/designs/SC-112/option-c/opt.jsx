// SC-112 option C · The stops lead. A batch is a page headed by its own tracker, the card the Route Room opens with, and
// the tracker's stops are the way through the batch: Detect opens its journey, Verify, Value, Decide and Approve the
// Route Room at that part, Execute its Execution, Settle its papers, Report its line in the ledger. The fill says where
// the batch is; the pill says where you are. Going down the journey the screen rises from below, going back it drops in
// from above. Once the card scrolls away the stops stay under the bar. The batch's name switches batch.
(function () {
  const { useState, useEffect, useRef } = React;
  const { motion, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, X = S.SC112; const fmt = M.fmt;
  const { cx, Icon, Card, Product, DaysNum, GateChips, Menu, useApp } = K;

  const NAV = [
    { id: "command", label: "Command Center", short: "Today", icon: "layout-dashboard" },
    { id: "batches", label: "Batches", icon: "boxes" },
    { id: "setup", label: "Setup", icon: "sliders-horizontal", phoneHidden: true },
    { id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line", section: "Reports" },
  ];
  const WORKSPACE = ["command", "batches", "setup", "report", "inbox", "profile"];
  // each stop's screen (Connect is the workspace's, set once in Setup); the Route Room's four stops are its parts
  const STOP_SCREEN = [null, "journey", "route", "route", "route", "route", "execution", "paperwork", "ledger"];
  const SCREENS = ["journey", "route", "execution", "paperwork", "ledger"];
  const ANCHOR = { 2: "label", 3: "channels", 4: "split", 5: "approve" };
  const MANGO_TIMES = () => ({ connect: "once", detect: D.PUSH.detect.at, verify: "asked " + D.PUSH.verify.at });
  // the stop a screen shows when it opens: the Route Room at the batch's own stop, if it is in the room
  const stopFor = (name, it) => (name === "route" ? (X.at(it) >= 2 && X.at(it) <= 5 ? X.at(it) : 2) : STOP_SCREEN.indexOf(name));
  const stateWords = (it, i) => (i < it.done ? "done" : i === it.current ? (D.STAGES[i].human ? "where the batch is, waiting for your yes" : "where the batch is") : "not yet");

  // the stops as the batch's navigation: the tracker as the app draws it, each stop a button, the pill on the one viewed
  function Stops({ it, view, onStop }) {
    const n = D.STAGES.length; const pos = it.current >= 0 ? it.current : Math.max(0, it.done - 1); const times = it.hero ? K.STAGE_TIMES : MANGO_TIMES();
    return <nav className="tracker c-stops" style={{ "--stops": n }} aria-label={`${it.sku.name}: its stops`}>
      <div className="rail" aria-hidden="true"><i style={{ "--p": pos / (n - 1) }} /></div>
      {D.STAGES.map((st, i) => { const state = i < it.done ? "done" : i === it.current ? "now" : "";
        const body = <><span className="dot">{state === "done" && <Icon name="check" size={12} stroke={3.2} />}</span><span className="st-label">{st.title}</span>{times[st.id] && <span className="st-time">{times[st.id]}</span>}</>;
        return <div key={st.id} className={cx("stop", state, st.human && "human")}>{i === 0 ? <span className="c-fixed" title="Set once for the workspace, in Setup">{body}</span>
          : <button type="button" className="stop-btn c-stop" aria-current={view === i ? "page" : undefined} aria-label={`${st.title}, ${stateWords(it, i)}`} onClick={() => onStop(i)}>
            {view === i && <motion.span layoutId="c-view" className="c-view" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}{body}</button>}</div>; })}
    </nav>;
  }
  // the same stops as a strip of chips: on phones under the card, and on every screen under the bar once the card has
  // scrolled away
  function Strip({ it, view, onStop, mini }) {
    const reduce = useReducedMotion(); const ref = useRef(null);
    useEffect(() => { const box = ref.current; const el = box && box.querySelector('[aria-current="page"]'); if (el) box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" }); }, [view]);
    return <nav ref={ref} className={cx("c-strip", mini && "mini")} aria-label={`${it.sku.name}: its stops`}>
      {D.STAGES.map((st, i) => { if (i === 0) return null; const state = i < it.done ? "done" : i === it.current ? "now" : "";
        return <button key={st.id} type="button" className={cx("c-chip", state, st.human && "human")} aria-current={view === i ? "page" : undefined} aria-label={`${st.title}, ${stateWords(it, i)}`} onClick={() => onStop(i)}>
          {view === i && <motion.span layoutId={mini ? "c-chip-mini" : "c-chip"} className="c-chip-on" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
          <i className="c-dot" aria-hidden="true">{state === "done" && <Icon name="check" size={10} stroke={3.4} />}</i><span>{st.title}</span></button>; })}
    </nav>;
  }
  // the head: the batch's name (it switches batch), its id and distributor, then the Route Room's own first card with
  // its stops, then the strip that stays under the bar
  function Head({ it, items, view, onStop, onBatch }) {
    const app = useApp(); const phone = app.bp === "phone"; const live = S.useLive(); const [open, setOpen] = useState(false);
    const v = it.view; const sku = it.sku; const routed = X.at(it) >= 6;
    const card = useRef(null); const [away, setAway] = useState(false);
    useEffect(() => { const el = card.current; if (!el) return; let root = el.parentElement; while (root && !(root.classList && root.classList.contains("scroll"))) root = root.parentElement;
      const io = new IntersectionObserver(([e]) => setAway(!e.isIntersecting && e.boundingClientRect.top < 0), { root, threshold: 0, rootMargin: "-120px 0px 0px 0px" }); io.observe(el); return () => io.disconnect(); }, [it.ref]);
    return <>
      <div className="sc-head c-head">
        <div className="c-title">
          <h1><button type="button" className="c-switch" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}><span>{sku.name}</span><Icon name="chevron-down" size={phone ? 20 : 24} stroke={2.4} /></button></h1>
          <Menu open={open} onClose={() => setOpen(false)} align="left" width={300} label="Batches in a journey" items={[{ label: "Batches in a journey", heading: true }].concat(items.map(b => ({ label: b.sku.name, icon: b.human ? "hand" : "route", checked: b.ref === it.ref, right: <span className={cx("c-mstop", b.human && "human")}>{b.stop}</span>, onClick: () => { setOpen(false); onBatch(b); } })))} />
        </div>
        <div className="sc-meta"><span className="mono">{it.ref}</span><span className="sep" aria-hidden="true">·</span><span>{it.dist.name}, {it.dist.city}</span>{live && <S.Live.Line />}</div>
        <div ref={card}><Card className="stack c-card" style={{ gap: 16 }}>
          <div className="row wrap" style={{ gap: 16 }}>
            <Product name={sku.img} size={phone ? 64 : 84} />
            <div className="grow"><div className="row base" style={{ gap: 10 }}><DaysNum days={v.daysLeft} life={sku.lifeDays} size="l" style={{ color: routed ? "var(--fg)" : "var(--red-text)" }} /><span className="stack tight" style={{ gap: 0 }}><b>days left</b><span className="t-footnote subtle">best before {fmt.date(v.bestBefore)}</span></span></div></div>
            <div className="stack tight" style={{ justifyItems: phone ? "start" : "end" }}><GateChips gates={v.assess.gates} /><span className="t-footnote subtle">{fmt.num(v.assess.atRisk)} of {fmt.num(v.units)} units at risk · sells {v.sellPerDay} a day</span></div>
          </div>
          {phone ? <Strip it={it} view={view} onStop={onStop} /> : <Stops it={it} view={view} onStop={onStop} />}
        </Card></div>
      </div>
      <div className={cx("c-stick", away && "on")} aria-hidden={!away} inert={!away ? "" : undefined}><Strip it={it} view={view} onStop={onStop} mini /></div>
    </>;
  }

  function Operator({ me, route, onGo, onBack, pushStep }) {
    const s = S.useStore(); const live = S.useLive(); const reduce = useReducedMotion();
    const items = X.journeys(s, live);
    const asked = route && route.name; const name = WORKSPACE.includes(asked) || SCREENS.includes(asked) ? asked : "command";
    const inBatch = n => SCREENS.includes(n);
    const it = inBatch(name) ? X.find(items, route.params && route.params.ref) : null;
    const from = X.useCameFrom(name, inBatch, X.LABELS);
    const go = (n, params, replace) => onGo({ name: n, params, replace });
    // the stop in view: the screen's own, then whichever part of the Route Room is in view as it scrolls
    const [view, setView] = useState(() => (it ? stopFor(name, it) : -1)); const key = name + (it ? it.ref : "");
    const lastKey = useRef(key); const dir = useRef(0); const pending = useRef(null);
    if (lastKey.current !== key) { const next = it ? (pending.current != null ? pending.current : stopFor(name, it)) : -1; dir.current = it && view >= 0 && next >= 0 ? Math.sign(next - view) : 0; lastKey.current = key; if (next !== view) setView(next); }
    const scrollTo = i => {
      const sc = document.getElementById("main"); if (!sc) return;
      if (i === 5) { sc.scrollTo({ top: sc.scrollHeight, behavior: reduce ? "auto" : "smooth" }); return; }
      const el = document.querySelector(`[data-anchor="${ANCHOR[i]}"]`); if (!el) return;
      sc.scrollTo({ top: sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 116, behavior: reduce ? "auto" : "smooth" });
    };
    useEffect(() => { if (pending.current == null) return; const i = pending.current; pending.current = null; if (ANCHOR[i]) setTimeout(() => scrollTo(i), 60); }, [key]);
    // scrolling the Route Room moves the pill: Verify at the label, Value at the channels, Decide at the split, Approve
    // at its foot
    useEffect(() => {
      if (name !== "route") return; const sc = document.getElementById("main"); if (!sc) return;
      const f = () => { const top = sc.getBoundingClientRect().top + 180; let i = 2;
        ["label", "channels", "split"].forEach((a, k) => { const el = document.querySelector(`[data-anchor="${a}"]`); if (el && el.getBoundingClientRect().top < top) i = 2 + k; });
        if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4 && sc.scrollTop > 40) i = Math.max(i, 5); setView(v => (v === i ? v : i)); };
      sc.addEventListener("scroll", f, { passive: true }); return () => sc.removeEventListener("scroll", f);
    }, [name, it && it.ref]);
    const onStop = i => {
      const target = STOP_SCREEN[i]; if (!target) return;
      if (target === name) { setView(i); if (ANCHOR[i]) scrollTo(i); return; }
      pending.current = i; go(target, { ref: it.ref }, true);
    };
    const r = { name: name === "ledger" ? "report" : name, params: it ? { ref: it.ref } : route && route.params };
    const frame = it ? { title: it.sku.name, hideLarge: true, back: from.label, sub: null, below: <Head it={it} items={items} view={view} onStop={onStop} onBatch={b => go(STOP_SCREEN[X.at(b)] || "journey", { ref: b.ref })} /> } : null;
    const body = !it ? S.screenFor(me, name, {}) : name === "journey" ? <X.JourneyView me={me} it={it} head={false} title="Detect" /> : name === "ledger" ? <X.PartBody me={me} it={it} part="report" /> : <X.PartBody me={me} it={it} part={name} />;
    const current = it ? (from.id === "batches" ? "batches" : "command") : name;
    return <X.Chrome me={me} route={r} onGo={onGo} onBack={onBack} nav={NAV} current={current} onNav={id => go(id, {}, true)} screenKey={it ? "batch:" + it.ref : name} scrollKey={key} className={it ? cx("sc-frame c-frame", dir.current > 0 && "go-on", dir.current < 0 && "go-back") : undefined} pushStep={pushStep}>
      <X.FrameCtx.Provider value={frame}>{body}</X.FrameCtx.Provider>
    </X.Chrome>;
  }
  S.RoleApp = X.roleApp(Operator);
})();

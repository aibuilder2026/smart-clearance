// SC-167 · option A, Four chapters: a lobby of four chapters (the platform, then the three journeys), each played as
// the demo is today: the chapter's stations in the top bar, the notes beside the devices, Next and Back. The notes now
// name the screen on show, and each chapter ends on its outcome with the next one offered.
(function () {
  const { useState, useEffect, useRef } = React; const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Button, Kbd, Money, Mark, Wordmark, WorkspaceMark, ThemeProvider, AppRoot, NoticeHost, ModeMenuButton } = K;
  const { ACTS } = window.SC167_ACTS; const V = window.SC167_DEV;
  const WS = D.WORKSPACE; const img = n => window.SC3_IMG + n + ".webp";
  const total = ACTS.reduce((t, a) => t + a.minutes, 0);
  const screensOf = a => [...new Set(a.stations.flatMap(s => s.beats.map(b => b.screen.split(" · ")[0])))];

  /* ---------- the lobby ---------- */
  function Visual({ a }) {
    if (a.console) return <div className="la-vis la-console"><span className="la-tile"><Icon name="layout-dashboard" size={30} /></span><span className="la-clients">{["#f68d3e", "#be123c", "#16a34a", "#15803d", "#0e7490"].map((c, i) => <i key={i} style={{ background: c }} />)}</span></div>;
    return <div className={cx("la-vis", a.id === "slow" && "la-slow")}><img src={img(a.img)} alt="" />{a.id === "slow" && <img className="la-bin" src={img("bin-plain")} alt="" />}</div>;
  }
  function Lobby({ onPlay }) {
    const reduce = useReducedMotion();
    return <div className="la-lobby">
      <div className="la-head">
        <h1 className="la-title">See Smart-Clearance work</h1>
        <p className="la-sub">Four chapters, about {total} minutes. Start anywhere. Every screen is the real app, on Munchly Foods' sample data.</p>
      </div>
      <ol className="la-cards">{ACTS.map((a, i) => <motion.li key={a.id} className="la-card" initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
        <Visual a={a} />
        <div className="la-body">
          <span className="la-n">{String(i + 1).padStart(2, "0")}</span>
          <h2 className="la-name">{a.title}</h2>
          <p className="la-what">{a.sub}</p>
          <span className="la-place">{a.place}</span>
          <ul className="la-screens" aria-label="Screens it shows">{screensOf(a).slice(0, 6).map(s => <li key={s}>{s}</li>)}</ul>
          <div className="la-foot"><span className="la-cast">{a.who.map(w => <Avatar key={w} person={V.user(w)} size="sm" />)}</span><span className="la-min">{a.minutes} min</span></div>
        </div>
        <Button variant={a.id === "slow" ? "secondary" : "primary"} icon="play" block onClick={() => onPlay(i)}>Play chapter {i + 1}</Button>
      </motion.li>)}</ol>
      <div className="la-all"><Button variant="primary" size="lg" icon="play" onClick={() => onPlay(0, true)}>Play all four · {total} min</Button><span className="t-footnote subtle">It plays itself; pause it, and make any person's move in their device.</span></div>
    </div>;
  }

  /* ---------- in a chapter ---------- */
  function ChapterTabs({ pos, onJump, onLobby }) {
    return <nav className="la-tabs" aria-label="Chapters"><button type="button" className="la-tab lobby" onClick={onLobby} aria-label="All chapters"><Icon name="layout-grid" size={16} /></button>
      {ACTS.map((a, i) => <button key={a.id} type="button" className={cx("la-tab", i === pos.a && "now", i < pos.a && "done")} aria-current={i === pos.a ? "step" : undefined} onClick={() => onJump(i)}><span className="la-tab-n">{i + 1}</span><span className="la-tab-t">{a.title}{a.id === "slow" ? " · slow week" : a.id === "chips" ? " · sold" : ""}</span></button>)}
    </nav>;
  }
  function StationBar({ act, pos, go }) {
    return <nav className="stagebar la-stations" aria-label="Stations">{act.stations.map((st, i) => <button key={st.id} type="button" className={cx("sbtn", i < pos.s && "done", i === pos.s && "now", st.amber && "human")} aria-current={i === pos.s ? "step" : undefined} onClick={() => go(pos.a, i, 0)}><span className="sb-dot">{i < pos.s ? <Icon name="check" size={12} stroke={3} /> : i + 1}</span><span className="sb-t">{st.title}</span></button>)}</nav>;
  }
  function Notes({ p }) {
    const { act, station, pos } = p; const n = pos.s;
    return <aside className="narr" aria-label="Narration"><div className="narr-scroll" tabIndex={0} role="region" aria-label="Station notes">
      <div className="narr-head"><span className="narr-n">{String(n + 1).padStart(2, "0")}</span><div className="stack tight" style={{ gap: 2 }}><h2 className="narr-title">{station.title}</h2><span className="t-footnote subtle">{act.title} · {act.sub} · {station.date}</span></div></div>
      <div className="la-onscreen"><Icon name="monitor" size={15} /><span>On screen</span><b>{p.beat.screen}</b></div>
      {station.figures && <div className="figs">{station.figures.map(f => <div key={f.label} className="fig"><span className="fig-label">{f.label}</span>{!f.count ? <Money value={f.value} size="m" decimals={f.decimals} roll style={{ color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" }} /> : <span className="num m" style={{ color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" }}>{fmt.num(f.value)}</span>}</div>)}</div>}
      <ol className="beats">{station.beats.map((b, i) => { const done = i < pos.b || (i === pos.b && pos.applied); const now = i === pos.b && !pos.applied; return <li key={i} className={cx("beat", done && "done", now && "now", b.human && "human")}>
        <span className="beat-dot">{done ? <Icon name="check" size={13} stroke={3} /> : now && b.agent ? <span className="beat-aura" /> : null}</span>
        <span className="beat-body"><span className="beat-who">{b.agent ? b.agent + " agent" : V.user(b.who).short}{b.time ? " · " + (b.date ? b.date.split(" ")[0] + " " : "") + b.time : ""}</span><span>{b.text}</span>{now && !b.agent && <span className="beat-hint"><Icon name="hand" size={13} />Their move: tap in the device, or press <Kbd>→</Kbd></span>}{now && b.agent && <span className="beat-hint"><span className="typing"><i /><i /><i /></span>working</span>}{b.stub && i === pos.b && <span className="la-stub">The build shows the Mango's own screen here</span>}</span>
      </li>; })}</ol></div>
      <div className="narr-ctrl"><Button variant="secondary" icon="chevron-left" onClick={p.back} aria-label="Back">Back</Button><Button variant={p.beat.human && !pos.applied ? "approve" : "primary"} iconRight="arrow-right" block onClick={p.next}>{pos.b === station.beats.length - 1 && pos.applied ? (pos.s === act.stations.length - 1 ? "End of chapter" : "Next · " + act.stations[pos.s + 1].title) : p.beat.agent ? "Skip ahead" : "Next"}</Button></div>
    </aside>;
  }
  function ChapterEnd({ a, i, onNext, onLobby }) {
    const reduce = useReducedMotion(); const nx = ACTS[i + 1];
    return <motion.div className="finale la-end" role="dialog" aria-modal="true" aria-label={`Chapter ${i + 1} done`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="finale-in">
        <span className="la-n">Chapter {i + 1} of {ACTS.length} · done</span>
        <h2 className="finale-title">{a.title}{a.id === "console" ? "" : " · " + a.sub.toLowerCase()}</h2>
        {a.outcome.value != null ? <div className="finale-hero"><Money value={a.outcome.value} roll from={0} className="finale-num" style={{ color: "var(--primary-text)" }} /><span className="finale-cap">{a.outcome.line}</span></div> : <p className="finale-line">{a.outcome.line}</p>}
        <div className="row wrap" style={{ gap: 10, justifyContent: "center" }}>{nx ? <Button variant="primary" size="lg" iconRight="arrow-right" onClick={onNext}>Chapter {i + 2}: {nx.title}{nx.id === "slow" ? ", a slow week" : ""}</Button> : null}<Button variant="secondary" size="lg" icon="layout-grid" onClick={onLobby}>All chapters</Button></div>
      </div>
    </motion.div>;
  }

  function Demo({ start, onLobby, autoplay }) {
    const p = V.usePlayer(ACTS, start); V.useBeatFx(p);
    const canvas = useRef(null); const size = V.useSize(canvas);
    const [notes, setNotes] = useState(true); const [phoneOnly, setPhoneOnly] = useState(false); const [end, setEnd] = useState(null);
    useEffect(() => { if (autoplay) p.setPlaying(true); }, []);
    // a chapter's last beat done: its outcome, then the next chapter
    const last = p.pos.s === p.act.stations.length - 1 && p.pos.b === p.station.beats.length - 1 && (p.pos.applied || !(p.beat.acts && p.beat.acts.length));
    const next = () => { if (last && end == null) { setEnd(p.pos.a); p.setPlaying(false); return; } p.next(); };
    useEffect(() => { if (p.playing && last && end == null) { const t = setTimeout(() => setEnd(p.pos.a), 1800); return () => clearTimeout(t); } }, [p.playing, last, end]);
    useEffect(() => { const f = e => { if (e.target.closest && e.target.closest("input, textarea, select")) return; if (e.key === "ArrowRight") { e.preventDefault(); next(); } else if (e.key === "ArrowLeft") { e.preventDefault(); p.back(); } }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); });
    return <div className={cx("demo", !notes && "no-notes")}>
      <header className="demo-top la-top">
        <span className="row tight demo-brand"><Mark size={30} /><Wordmark size={17} /><span className="demo-tag">Guided demo</span>{!p.act.console && <span className="demo-ws"><WorkspaceMark ws={WS} size={20} /><span>{WS.name}</span></span>}</span>
        <ChapterTabs pos={p.pos} onJump={i => { setEnd(null); p.go(i, 0, 0); }} onLobby={onLobby} />
        <span className="row tight demo-tools">
          <IconButton icon={p.playing ? "pause" : "play"} label={p.playing ? "Pause autoplay" : "Autoplay"} onClick={() => p.setPlaying(!p.playing)} />
          <IconButton icon={phoneOnly ? "monitor" : "smartphone"} label={phoneOnly ? "Laptop and phone" : "Phone only"} onClick={() => setPhoneOnly(v => !v)} />
          <IconButton icon="presentation" label={notes ? "Hide notes" : "Show notes"} onClick={() => setNotes(v => !v)} />
          <ModeMenuButton />
        </span>
      </header>
      <div className="la-sub-bar"><StationBar act={p.act} pos={p.pos} go={p.go} /></div>
      <div className="demo-body">
        {notes && <Notes p={Object.assign({}, p, { next })} />}
        <main className="demo-canvas" ref={canvas}><V.Stage station={p.station} beat={p.beat} act={p.act} size={size} phoneOnly={phoneOnly} /></main>
      </div>
      <AnimatePresence>{end != null && <ChapterEnd a={ACTS[end]} i={end} onNext={() => { const i = end; setEnd(null); p.go(i + 1, 0, 0); }} onLobby={onLobby} />}</AnimatePresence>
    </div>;
  }

  function App() {
    const [view, setView] = useState(() => (window.SC167_START ? "demo" : "lobby"));
    const [start, setStart] = useState(window.SC167_START || { a: 0, s: 0, b: 0 }); const [auto, setAuto] = useState(window.SC167_PLAY);
    if (view === "lobby") return <div className="demo la-shell"><header className="demo-top la-top"><span className="row tight demo-brand"><Mark size={30} /><Wordmark size={17} /><span className="demo-tag">Guided demo</span></span><span /><span className="row tight demo-tools"><ModeMenuButton /></span></header><main className="la-lobby-wrap"><Lobby onPlay={(i, all) => { setStart({ a: i, s: 0, b: 0 }); setAuto(!!all); setView("demo"); }} /></main></div>;
    return <Demo key={JSON.stringify(start)} start={start} autoplay={auto} onLobby={() => setView("lobby")} />;
  }
  function Root() { return <ThemeProvider><AppRoot className="demo-root" style={{ position: "fixed", inset: 0 }}><NoticeHost><App /></NoticeHost></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();

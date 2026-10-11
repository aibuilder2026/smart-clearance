// SC-167 · option C, The show: the demo plays itself like a film. A title card, then each chapter opens on a card with
// its batch and its cast; the stage is the devices alone, the one in play lit and the other dimmed; a caption over the
// stage says who does what, and the figures sit in the corner as they change. A timeline at the foot holds the four
// chapters to scrub; Pause hands the devices to the visitor. Nothing moves on its own clock but the play itself, which
// Pause stops (WCAG 2.2.2); under reduced motion each beat lands at once.
(function () {
  const { useState, useEffect, useRef, useMemo } = React; const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Button, Kbd, Money, Mark, Wordmark, WorkspaceMark, ThemeProvider, AppRoot, NoticeHost, ModeMenuButton, useApp } = K;
  const { ACTS } = window.SC167_ACTS; const V = window.SC167_DEV;
  const WS = D.WORKSPACE; const img = n => window.SC3_IMG + n + ".webp";
  const total = ACTS.reduce((t, a) => t + a.minutes, 0);
  const ROLE = { neha: "Smart-Clearance", priya: "Supply chain, Munchly", rakesh: "Distributor, Nagpur", ganesh: "Kirana, Nagpur", agrawal: "Buyer, Raipur", "lakshmi-owner": "Distributor, Hyderabad", meera: "Feeding India" };
  const AGENT_IC = { Watcher: "eye", Vision: "scan-line", Valuer: "scale", Router: "split", Lister: "store", Outreach: "send", Negotiator: "messages-square", Donation: "heart-handshake", Paperwork: "file-text", Impact: "leaf", Data: "database" };

  /* ---------- the title card ---------- */
  function Title({ onPlay, onChapter }) {
    const reduce = useReducedMotion();
    return <div className="sh-title">
      <motion.div className="sh-title-in" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <Mark size={72} play={!reduce} />
        <h1 className="sh-h1">A near-expiry batch,<br />start to finish</h1>
        <p className="sh-lede">The guided demo · four chapters · about {total} minutes, on the real screens and sample data</p>
        <button type="button" className="sh-play" onClick={onPlay} aria-label="Play the demo"><Icon name="play" size={34} /></button>
      </motion.div>
      <ol className="sh-chapters" aria-label="Or start at a chapter">{ACTS.map((a, i) => <motion.li key={a.id} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.06, duration: 0.42 }}>
        <button type="button" className="sh-chap" onClick={() => onChapter(i)}>
          <span className="sh-chap-vis">{a.console ? <Icon name="layout-dashboard" size={26} /> : <img src={img(a.img)} alt="" />}{a.id === "slow" && <img className="sh-chap-bin" src={img("bin-plain")} alt="" />}</span>
          <span className="sh-chap-t"><span>Chapter {i + 1} · {a.minutes} min</span><b>{a.title}</b><span>{a.sub}</span></span>
        </button>
      </motion.li>)}</ol>
    </div>;
  }

  /* ---------- a chapter's card ---------- */
  function ChapterCard({ a, i, onGo }) {
    const reduce = useReducedMotion(); const st = a.stations[0];
    return <motion.div className="sh-card" role="dialog" aria-modal="true" aria-label={`Chapter ${i + 1}: ${a.title}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.3 }} onClick={onGo}>
      <div className="sh-card-in">
        <motion.div className="sh-card-copy" initial={reduce ? false : { opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <span className="sh-eyebrow">Chapter {i + 1} of {ACTS.length}</span>
          <h2 className="sh-card-title">{a.title}</h2>
          <p className="sh-card-sub">{a.sub}</p>
          <span className="sh-card-place">{a.place} · from {st.date}</span>
          <ul className="sh-cast">{a.who.map((w, k) => <motion.li key={w} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + k * 0.08 }}><Avatar person={V.user(w)} size="lg" /><b>{V.user(w).short || V.user(w).name}</b><span>{ROLE[w] || ""}</span></motion.li>)}</ul>
          <Button variant="primary" size="lg" icon="play" onClick={e => { e.stopPropagation(); onGo(); }}>Start the chapter</Button>
        </motion.div>
        <motion.div className="sh-card-vis" initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          {a.console ? <span className="sh-card-console"><Mark size={96} /></span> : <img src={img(a.img)} alt="" />}{a.id === "slow" && <img className="sh-card-bin" src={img("bin-plain")} alt="" />}
        </motion.div>
      </div>
    </motion.div>;
  }

  /* ---------- the caption, the figures, the timeline ---------- */
  function Caption({ p }) {
    const reduce = useReducedMotion(); const b = p.beat; const who = b.agent ? null : V.user(b.who);
    const now = !p.pos.applied;
    return <div className="sh-cap-wrap"><AnimatePresence mode="wait"><motion.div key={`${p.pos.a}.${p.pos.s}.${p.pos.b}`} className={cx("sh-cap", b.human && now && "amber")} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} role="status" aria-live="polite">
      <span className="sh-cap-who">{who ? <Avatar person={who} size="lg" /> : <span className={cx("sh-agent", now && "working")}><Icon name={AGENT_IC[b.agent] || "sparkles"} size={20} /></span>}</span>
      <span className="sh-cap-body">
        <span className="sh-cap-meta"><b>{b.agent ? b.agent + " agent" : who.short || who.name}</b><span>{(b.date || p.station.date).replace(/ \d{4}$/, "")} · {b.time}</span><span className="sh-cap-st">{p.station.title}</span></span>
        <span className="sh-cap-text">{b.text}</span>
        {now && !b.agent && <span className="sh-cap-move"><Icon name="hand" size={14} />Their move: tap it in the device, or press <Kbd>→</Kbd></span>}
        {b.stub && <span className="sh-cap-stub">The build shows the Mango's own screen here</span>}
      </span>
    </motion.div></AnimatePresence><Figures p={p} /></div>;
  }
  function Figures({ p }) {
    const f = p.station.figures; if (!f) return null;
    return <div className="sh-figs" key={p.act.id + p.station.id}>{f.map(x => <div key={x.label} className="sh-fig"><span>{x.label}</span>{!x.count ? <Money value={x.value} size="m" decimals={x.decimals} roll style={{ color: x.tone === "red" ? "var(--red-text)" : x.tone === "green" ? "var(--primary-text)" : "var(--fg)" }} /> : <b className="num m" style={{ color: x.tone === "red" ? "var(--red-text)" : x.tone === "green" ? "var(--primary-text)" : "var(--fg)" }}>{fmt.num(x.value)}</b>}</div>)}</div>;
  }
  function Timeline({ p, onChapters }) {
    const counts = ACTS.map(a => a.stations.reduce((t, s) => t + s.beats.length, 0)); const sum = counts.reduce((a, b) => a + b, 0);
    let before = 0; const segs = ACTS.map((a, i) => { const st = before; before += counts[i]; return { a, i, st, n: counts[i] }; });
    const pick = (seg, e) => { const r = e.currentTarget.getBoundingClientRect(); const k = Math.min(seg.n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * seg.n))); const x = p.flat[seg.st + k]; p.go(x.a, x.s, x.b); };
    return <div className="sh-bar">
      <div className="row tight"><IconButton icon="chevron-left" label="Back a beat" onClick={p.back} /><button type="button" className="sh-pp" onClick={() => p.setPlaying(!p.playing)} aria-label={p.playing ? "Pause" : "Play"}><Icon name={p.playing ? "pause" : "play"} size={22} /></button><IconButton icon="chevron-right" label="Next beat" onClick={p.next} /></div>
      <div className="sh-track" role="group" aria-label="The demo's timeline">{segs.map(seg => { const cur = seg.i === p.pos.a; const fill = p.at < seg.st ? 0 : p.at >= seg.st + seg.n ? 1 : (p.at - seg.st + (p.pos.applied ? 1 : 0.4)) / seg.n;
        return <button key={seg.a.id} type="button" className={cx("sh-seg", cur && "now")} style={{ flexGrow: seg.n }} onClick={e => pick(seg, e)} aria-label={`Chapter ${seg.i + 1}: ${seg.a.title}${seg.a.id === "slow" ? ", a slow week" : ""}`} aria-current={cur ? "step" : undefined}>
          <span className="sh-seg-t">{seg.i + 1} · {seg.a.title}{seg.a.id === "slow" ? " · slow week" : ""}</span>
          <span className="sh-seg-rail"><span style={{ transform: `scaleX(${fill})` }} />{seg.a.stations.slice(1).map((s, k) => { const off = seg.a.stations.slice(0, k + 1).reduce((t, x) => t + x.beats.length, 0); return <i key={s.id} style={{ left: `${(off / seg.n) * 100}%` }} />; })}</span>
        </button>; })}</div>
      <div className="row tight sh-bar-r"><span className="sh-count">{p.at + 1} / {sum}</span><IconButton icon="list" label="Chapters" onClick={onChapters} /></div>
    </div>;
  }
  function End({ onAgain }) {
    const reduce = useReducedMotion();
    return <motion.div className="finale sh-end" role="dialog" aria-modal="true" aria-label="The end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="finale-in">
        <Mark size={56} play={!reduce} />
        <h2 className="finale-title">Every carton gets a second chance</h2>
        <p className="finale-hi hi" lang="hi">हर कार्टन को दूसरा मौका</p>
        <div className="sh-ends">{ACTS.filter(a => !a.console).map((a, k) => <motion.div key={a.id} className="sh-endcol" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + k * 0.15 }}><img src={img(a.img)} alt="" /><span className="sh-endname">{a.title}{a.id === "slow" ? " · a slow week" : ""}</span><Money value={a.outcome.value} roll from={0} className="sh-endnum" style={{ color: "var(--primary-text)" }} /><span className={cx("sh-endline", a.outcome.red && "red")}>{a.outcome.line}</span></motion.div>)}</div>
        <Button variant="primary" size="lg" icon="rotate-ccw" onClick={onAgain}>Watch it again</Button>
      </div>
    </motion.div>;
  }

  function Show({ start, autoplay, onTitle }) {
    const [card, setCard] = useState(start.s === 0 && start.b === 0 ? start.a : null); const [list, setList] = useState(false);
    const p = V.usePlayer(ACTS, start, card != null); V.useBeatFx(p); const app = useApp();
    const canvas = useRef(null); const size = V.useSize(canvas);
    useEffect(() => { if (autoplay) p.setPlaying(true); }, []);
    // a chapter opens on its card; playing, the card lifts on its own after a moment, and the play waits for it
    const prevA = useRef(p.pos.a);
    useEffect(() => { if (p.pos.a !== prevA.current) { prevA.current = p.pos.a; setCard(p.pos.a); } }, [p.pos.a]);
    useEffect(() => { if (card == null || !p.playing) return; const t = setTimeout(() => setCard(null), 2800); return () => clearTimeout(t); }, [card, p.playing]);
    useEffect(() => { const f = e => { if (e.target.closest && e.target.closest("input, textarea, select")) return; if (e.key === "ArrowRight") { e.preventDefault(); card != null ? setCard(null) : p.next(); } else if (e.key === "ArrowLeft") { e.preventDefault(); p.back(); } else if (e.key === " " && !(e.target.closest && e.target.closest("button"))) { e.preventDefault(); p.setPlaying(!p.playing); } }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); });
    const real = app.w < 768;
    return <div className={cx("demo sh-demo", real && "sh-real")}>
      <header className="sh-top">
        <span className="row tight"><button type="button" className="sh-home" onClick={onTitle} aria-label="Back to the title"><Mark size={26} /></button>{!real && <Wordmark size={15} />}</span>
        <span className="sh-top-c"><b>{p.act.title}{p.act.id === "slow" ? " · a slow week" : ""}</b><span>{p.station.title} · On screen: {p.beat.screen}</span></span>
        <span className="row tight"><ModeMenuButton /></span>
      </header>
      <main className="sh-stage" ref={canvas}>
        {real ? <V.Stage station={p.station} beat={p.beat} act={p.act} size={size} real /> : <V.Stage station={p.station} beat={p.beat} act={p.act} size={{ w: size.w, h: Math.max(0, size.h - 150) }} labels />}
        <Caption p={p} />
      </main>
      <Timeline p={Object.assign({}, p, { setPlaying: v => { if (card != null) setCard(null); p.setPlaying(v); } })} onChapters={() => setList(true)} />
      <AnimatePresence>{card != null && <ChapterCard a={ACTS[card]} i={card} onGo={() => setCard(null)} />}</AnimatePresence>
      <K.Sheet open={list} onClose={() => setList(false)} title="Chapters" detent="medium"><div className="stack" style={{ gap: 8 }}>{ACTS.map((a, i) => <button key={a.id} type="button" className="sh-chap row" onClick={() => { setList(false); p.go(i, 0, 0); }}><span className="sh-chap-vis sm">{a.console ? <Icon name="layout-dashboard" size={18} /> : <img src={img(a.img)} alt="" />}</span><span className="sh-chap-t"><span>Chapter {i + 1}</span><b>{a.title}</b><span>{a.sub}</span></span></button>)}</div></K.Sheet>
      <AnimatePresence>{p.pos.end && <End onAgain={() => p.go(0, 0, 0)} />}</AnimatePresence>
    </div>;
  }

  function App() {
    const [view, setView] = useState(() => (window.SC167_START ? "show" : "title"));
    const [start, setStart] = useState(window.SC167_START || { a: 0, s: 0, b: 0 }); const [auto, setAuto] = useState(window.SC167_PLAY);
    if (view === "title") return <div className="demo sh-shell"><header className="sh-top"><span className="row tight"><Mark size={26} /><Wordmark size={15} /><span className="demo-tag">Guided demo</span></span><span /><span className="row tight"><ModeMenuButton /></span></header><main className="sh-titlewrap"><Title onPlay={() => { setStart({ a: 0, s: 0, b: 0 }); setAuto(true); setView("show"); }} onChapter={i => { setStart({ a: i, s: 0, b: 0 }); setAuto(false); setView("show"); }} /></main></div>;
    return <Show key={JSON.stringify(start)} start={start} autoplay={auto} onTitle={() => setView("title")} />;
  }
  function Root() { return <ThemeProvider><AppRoot className="demo-root" style={{ position: "fixed", inset: 0 }}><NoticeHost><App /></NoticeHost></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();

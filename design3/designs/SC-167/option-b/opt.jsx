// SC-167 · option B, The route map (recommended): the story is a map of lines in the product's own route idiom. The
// platform's line runs into Munchly's workspace; from there the chips, the Mango Drink and the slow week each run to an
// outcome, the slow week sharing the chips' track up to the yes and branching off after it. Playing, the map folds into
// a strip over the stage and the batch travels it as a token (the console's `token` spring, 170/24/1); the map comes
// back between lines, the token hopping to the next. Resting lines are sage; the line on play lights green, a person's
// yes is amber, the bin red (DESIGN.md, the Live Colour, One Yes and Single Meaning rules).
(function () {
  const { useState, useEffect, useRef, useMemo } = React; const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Button, Kbd, Money, Mark, Wordmark, WorkspaceMark, ThemeProvider, AppRoot, NoticeHost, ModeMenuButton, useApp } = K;
  const { ACTS } = window.SC167_ACTS; const V = window.SC167_DEV;
  const WS = D.WORKSPACE; const img = n => window.SC3_IMG + n + ".webp";
  const TOKEN = { type: "spring", stiffness: 170, damping: 24, mass: 1 };
  const total = ACTS.reduce((t, a) => t + a.minutes, 0);
  const AI = Object.fromEntries(ACTS.map((a, i) => [a.id, i]));

  /* ---------- the map's geometry, in a 1320 × 620 box ---------- */
  const I = [450, 380];
  const GEO = {
    console: { d: "M70 150 H390 L450 210 V380", st: [[70, 150], [150, 150], [230, 150], [310, 150], [390, 150], [450, 290]], side: ["up", "up", "up", "up", "up", "left"] },
    chips: { d: "M450 380 L570 260 H1156", st: [[600, 260], [660, 260], [720, 260], [780, 260], [840, 260], [900, 260], [966, 260], [1032, 260], [1098, 260]], side: "up", end: [1156, 260], out: [1174, 0, "start"] },
    slow: { d: "M900 260 L988 348 H1316", st: [[1020, 348], [1080, 348], [1140, 348], [1200, 348], [1260, 348]], side: "down", end: [1316, 348], out: [1330, 64, "end"] },
    mango: { d: "M450 380 L570 500 H1070", st: [[600, 500], [680, 500], [760, 500], [840, 500], [920, 500], [1000, 500]], side: "down", end: [1070, 500], out: [1088, 0, "start"] },
  };
  // the map's station names, short where the line is tight
  const SHORT = { "Munchly's setup": "Setup", "Agent setup": "Agents", "Existing clients": "Clients", "A new client": "New client", "Expiry day": "Expiry", "The second yes": "Yes" };
  const short = t => SHORT[t] || t;
  // what each line's badge says under its name
  const BADGE = { console: "Smart-Clearance's console", chips: "every pack sold", slow: "destroyed at the godown, on a second yes", mango: "kiranas, a staff sale, a food bank" };
  const toneOf = st => (st.id === "expiry" ? "red" : st.amber ? "amber" : null);

  function RouteMap({ active, hot, setHot, pos, onPick, draw, compact }) {
    const reduce = useReducedMotion(); const animate = draw && !reduce;
    const lit = id => id === active || id === hot || (id === "chips" && (active === "slow" || hot === "slow") ? "shared" : false);
    const stateOf = (ai, si) => (pos ? (ai < pos.a || (ai === pos.a && si < pos.s) ? "done" : ai === pos.a && si === pos.s ? "now" : null) : null);
    const lineOrder = ["console", "mango", "chips", "slow"];
    return <svg className={cx("rb-map", compact && "compact")} viewBox="40 36 1380 640" role="group" aria-label="The demo's route map">
      {/* the lines, resting under the lit one */}
      {lineOrder.map((id, k) => { const on = lit(id) === true; return <g key={id} onMouseEnter={() => setHot && setHot(id)} onMouseLeave={() => setHot && setHot(null)}>
        <motion.path d={GEO[id].d} className={cx("rb-line-shadow", on && "on")} initial={animate ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.12 * k, ease: [0.22, 1, 0.36, 1] }} />
        <motion.path d={GEO[id].d} className={cx("rb-line", on && "on")} initial={animate ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.12 * k, ease: [0.22, 1, 0.36, 1] }} />
      </g>; })}
      {/* the chips' track lit under the slow week, where they share it */}
      {lit("chips") === "shared" && <path d="M450 380 L570 260 H900" className="rb-line on shared" />}
      {/* stations */}
      {["console", "chips", "slow", "mango"].map(id => { const a = ACTS[AI[id]]; const g = GEO[id]; return a.stations.map((st, si) => {
        const [x, y] = g.st[si]; const side = Array.isArray(g.side) ? g.side[si] : g.side; const s = stateOf(AI[id], si); const tone = toneOf(st);
        const ly = side === "up" ? y - 23 : side === "down" ? y + 35 : y + 5; const lx = side === "left" ? x - 18 : x;
        const on = lit(id) === true || (id === "chips" && lit("chips") === "shared" && si <= 5);
        return <g key={id + st.id} className={cx("rb-st", on && "on", s, tone)} role="button" tabIndex={compact ? -1 : 0} aria-label={`${a.title}${id === "slow" ? ", the slow week" : ""}: ${st.title}`}
          onClick={() => onPick && onPick(AI[id], si)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick && onPick(AI[id], si); } }}>
          <motion.circle cx={x} cy={y} r={9} initial={animate ? { scale: 0, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 + 0.12 * lineOrder.indexOf(id) + si * 0.03, duration: 0.24 }} style={{ transformOrigin: `${x}px ${y}px` }} />
          {s === "done" && <path d={`M${x - 4} ${y} l3 3 l5 -6`} className="rb-tick" />}
          {!compact && <text x={lx} y={ly} textAnchor={side === "left" ? "end" : "middle"} className="rb-lbl">{short(st.title)}</text>}
        </g>; }); })}
      {/* the interchange: Munchly's workspace */}
      <g className="rb-hub"><circle cx={I[0]} cy={I[1]} r={24} /><foreignObject x={I[0] - 14} y={I[1] - 14} width={28} height={28}><div className="rb-hub-mark"><WorkspaceMark ws={WS} size={28} /></div></foreignObject>
        {!compact && <text x={I[0] - 34} y={I[1] + 5} textAnchor="end" className="rb-lbl strong">Munchly's workspace</text>}</g>
      {/* the outcomes */}
      {!compact && ["chips", "slow", "mango"].map((id, k) => { const a = ACTS[AI[id]]; const [x, y] = GEO[id].end; const up = id === "chips";
        return <motion.g key={id} className={cx("rb-end", a.outcome.red && "red", lit(id) === true && "on")} initial={animate ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 + 0.12 * k, duration: 0.42 }}>
          <circle cx={x} cy={y} r={11} className="rb-pin" />
          {animate && <motion.circle cx={x} cy={y} r={11} className="rb-ping" initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ delay: 1.3 + 0.12 * k, duration: 1.1, repeat: 1 }} style={{ transformOrigin: `${x}px ${y}px` }} />}
          {(() => { const [ox, dy, anchor] = GEO[id].out; return <><text x={ox} y={y + dy + 9} textAnchor={anchor} className="rb-out">{fmt.inr(a.outcome.value)}</text>
          <text x={ox} y={y + dy + 28} textAnchor={anchor} className="rb-out-sub">{id === "chips" ? "every pack sold" : id === "slow" ? `${window.SC167_ACTS.SLOW.left} destroyed, on a yes` : `${D.MANGO_FB} meals · all placed`}</text></>; })()}
        </motion.g>; })}
      {/* the line badges */}
      {!compact && [["console", 56, 46], ["chips", 588, 152], ["slow", 790, 400], ["mango", 588, 558]].map(([id, x, y]) => { const a = ACTS[AI[id]];
        return <foreignObject key={id} x={x - 10} y={y - 10} width={380} height={76}><div className="rb-badge-pad"><button type="button" className={cx("rb-badge", lit(id) === true && "on")} onMouseEnter={() => setHot && setHot(id)} onMouseLeave={() => setHot && setHot(null)} onFocus={() => setHot && setHot(id)} onBlur={() => setHot && setHot(null)} onClick={() => onPick && onPick(AI[id], 0)}>
          {a.console ? <span className="rb-badge-ic"><Icon name="layout-dashboard" size={18} /></span> : <img src={img(a.img)} alt="" />}
          <span className="rb-badge-t"><b>{a.title}{id === "slow" ? " · a slow week" : ""}</b><span>{BADGE[id]} · {a.minutes} min</span></span>
        </button></div></foreignObject>; })}
      {/* the batch, where the story is */}
      {pos && (() => { const a = ACTS[pos.a]; const [x, y] = GEO[a.id].st[pos.s]; return <motion.g className="rb-token" initial={false} animate={{ x, y }} transition={reduce ? { duration: 0 } : TOKEN}>
        <circle r={17} /><foreignObject x={-13} y={-13} width={26} height={26}><div className="rb-token-in">{a.console ? <Icon name="layout-dashboard" size={15} /> : <img src={img(a.img)} alt="" />}</div></foreignObject>
      </motion.g>; })()}
    </svg>;
  }

  /* ---------- on a phone: the lines as a list, each with its stops and where it ends ---------- */
  function PhoneLines({ onPick }) {
    return <ol className="rb-plines" aria-label="The lines">{["console", "chips", "slow", "mango"].map(id => { const a = ACTS[AI[id]];
      return <li key={id} className={cx("rb-pline", id === "slow" && "branch")}>
        {id === "slow" && <svg className="rb-pline-branch" viewBox="0 0 16 40" preserveAspectRatio="none" aria-hidden="true"><path d="M4 0 V28 Q4 38 14 38" vectorEffect="non-scaling-stroke" /></svg>}
        <button type="button" onClick={() => onPick(AI[id], 0)} className="rb-pline-btn">
          <span className="rb-pline-head">{a.console ? <span className="rb-badge-ic"><Icon name="layout-dashboard" size={18} /></span> : <img src={img(a.img)} alt="" />}<span className="rb-badge-t"><b>{a.title}{id === "slow" ? " · a slow week" : ""}</b><span>{id === "slow" ? "branches off the chips after the yes" : BADGE[id]} · {a.minutes} min</span></span></span>
          <span className="rb-pline-rail">{a.stations.map(st => <i key={st.id} className={toneOf(st) || ""} />)}<em className={a.outcome.red ? "red" : ""} /></span>
          <span className="rb-pline-out">{a.outcome.value != null ? <><b>{fmt.inr(a.outcome.value)}</b> {id === "slow" ? `· ${window.SC167_ACTS.SLOW.left} destroyed, on a yes` : id === "mango" ? `· ${D.MANGO_FB} meals` : "· every pack sold"}</> : "Ends at Munchly's workspace"}</span>
        </button>
      </li>; })}</ol>;
  }

  /* ---------- the start: the map, with the three endings ---------- */
  function Start({ onPick, onAll }) {
    const [hot, setHot] = useState(null); const reduce = useReducedMotion(); const app = useApp();
    const h = hot && ACTS[AI[hot]];
    return <div className="rb-start">
      <div className="rb-intro">
        <div className="rb-intro-l"><span className="rb-eyebrow">Guided demo · about {total} minutes</span><h1 className="rb-title">Three batches. Three endings.</h1></div>
        <div className="rb-intro-r">
          <p className="rb-lede">The platform sets Munchly Foods up. Then a batch of chips sells out, a batch of Mango Drink feeds Hyderabad, and a slow week ends at the bin, on a second yes. Every screen is the real app, on sample data.</p>
          <div className="row wrap" style={{ gap: 18, alignItems: "center" }}><Button variant="primary" size="lg" icon="play" onClick={onAll}>Play the whole route</Button>
            <ul className="rb-legend" aria-label="How to read the map"><li><i className="lg-green" />The agents' work</li><li><i className="lg-amber" />A person's yes</li><li><i className="lg-red" />The bin</li></ul></div>
        </div>
      </div>
      {app.w < 768 ? <PhoneLines onPick={onPick} /> : <div className="rb-mapwrap"><RouteMap hot={hot} setHot={setHot} onPick={onPick} draw />
        <AnimatePresence mode="wait">{h && <motion.div key={h.id} className="rb-peek" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <b>{h.title}{h.id === "slow" ? " · a slow week" : ""}</b><span>{h.place}</span><span className="rb-peek-screens">{[...new Set(h.stations.flatMap(s => s.beats.map(b => b.screen.split(" · ")[0])).filter(x => !/Lock screen|Sign-in/.test(x)))].slice(0, 8).join(" · ")}</span>
        </motion.div>}</AnimatePresence>
      </div>}
    </div>;
  }

  /* ---------- playing: the line as a strip over the stage ---------- */
  function Strip({ p, onMap }) {
    const reduce = useReducedMotion(); const a = p.act; const n = a.stations.length;
    // how far along the line the story is: whole stations done, plus the share of this one's beats
    const along = Math.min(n - 1, p.pos.s + Math.min(1, (p.pos.b + (p.pos.applied ? 1 : 0)) / p.station.beats.length));
    return <div className="rb-strip">
      <button type="button" className="rb-mapbtn" onClick={onMap} aria-label="Open the route map"><Icon name="map" size={18} /><span>Map</span></button>
      <span className="rb-strip-line">{a.console ? <span className="rb-badge-ic sm"><Icon name="layout-dashboard" size={14} /></span> : <img src={img(a.img)} alt="" />}<span className="rb-strip-t"><b>{a.title}{a.id === "slow" ? " · a slow week" : ""}</b><span>{p.station.title} · {p.pos.s + 1} of {n}</span></span></span>
      <ol className="rb-stops" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, "--n": n }} aria-label="Stations on this line">
        <span className="rb-track" aria-hidden="true"><span style={{ transform: `scaleX(${n > 1 ? along / (n - 1) : 1})` }} /></span>
        {a.stations.map((st, i) => { const s2 = i < p.pos.s ? "done" : i === p.pos.s ? "now" : ""; return <li key={st.id} className={cx("rb-stop", s2, toneOf(st))}>
          <button type="button" title={st.title} onClick={() => p.go(p.pos.a, i, 0)} aria-current={s2 === "now" ? "step" : undefined} aria-label={`${st.title}${s2 === "done" ? ", done" : ""}`}>
            <span className="rb-dot">{s2 === "done" ? <Icon name="check" size={11} stroke={3} /> : null}{s2 === "now" && <motion.span layoutId="rb-token" className="rb-tok" transition={reduce ? { duration: 0 } : TOKEN}>{a.console ? <Icon name="layout-dashboard" size={13} /> : <img src={img(a.img)} alt="" />}</motion.span>}</span>
          </button>
        </li>; })}
      </ol>
      <span className="rb-out-mini">{a.outcome.value != null ? <><span>ends at</span><b>{fmt.inr(a.outcome.value)}</b></> : <span>ends at Munchly's workspace</span>}</span>
    </div>;
  }
  function Card({ p }) {
    const { act, station, pos } = p;
    return <aside className="narr rb-card" aria-label="Narration"><div className="narr-scroll" tabIndex={0} role="region" aria-label="Station notes">
      <div className="rb-card-head"><span className={cx("rb-card-n", toneOf(station))}>{pos.s + 1}</span><div className="stack tight" style={{ gap: 2 }}><h2 className="narr-title">{station.title}</h2><span className="t-footnote subtle">{station.date}</span></div></div>
      <div className="rb-onscreen"><span>On screen</span><b>{p.beat.screen}</b></div>
      {station.figures && <div className="figs">{station.figures.map(f => <div key={f.label} className="fig"><span className="fig-label">{f.label}</span>{!f.count ? <Money value={f.value} size="m" decimals={f.decimals} roll style={{ color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" }} /> : <span className="num m" style={{ color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" }}>{fmt.num(f.value)}</span>}</div>)}</div>}
      <ol className="beats">{station.beats.map((b, i) => { const done = i < pos.b || (i === pos.b && pos.applied); const now = i === pos.b && !pos.applied; return <li key={i} className={cx("beat", done && "done", now && "now", b.human && "human")}>
        <span className="beat-dot">{done ? <Icon name="check" size={13} stroke={3} /> : now && b.agent ? <span className="beat-aura" /> : null}</span>
        <span className="beat-body"><span className="beat-who">{b.agent ? b.agent + " agent" : V.user(b.who).short}{b.time ? " · " + (b.date ? b.date.split(" ")[0] + " " : "") + b.time : ""}</span><span>{b.text}</span>{now && !b.agent && <span className="beat-hint"><Icon name="hand" size={13} />Their move: tap in the device, or press <Kbd>→</Kbd></span>}{now && b.agent && <span className="beat-hint"><span className="typing"><i /><i /><i /></span>working</span>}{b.stub && i === pos.b && <span className="la-stub">The build shows the Mango's own screen here</span>}</span>
      </li>; })}</ol></div>
      <div className="narr-ctrl"><Button variant="secondary" icon="chevron-left" onClick={p.back} aria-label="Back">Back</Button><Button variant={p.beat.human && !pos.applied ? "approve" : "primary"} iconRight="arrow-right" block onClick={p.next}>{p.beat.agent && !pos.applied ? "Skip ahead" : "Next"}</Button></div>
    </aside>;
  }
  // between lines, and on Map: the whole map over the stage, the token where the story is
  function MapOver({ p, onPick, onClose, hop }) {
    const reduce = useReducedMotion();
    useEffect(() => { const f = e => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, []);
    return <motion.div className="rb-over" role="dialog" aria-modal="true" aria-label="The route map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.24 }}>
      <div className="rb-over-in">
        <div className="rb-over-head"><div className="rb-over-copy">{hop && <span className="rb-eyebrow">Next line</span>}<h2 className="rb-over-title">{hop ? <>{p.act.title}{p.act.id === "slow" ? " · a slow week" : ""}<span> · {p.act.place}</span></> : "The route"}</h2></div><IconButton icon="x" label="Close the map" onClick={onClose} /></div>
        <RouteMap active={p.act.id} pos={p.pos} onPick={(a, s) => { onPick(a, s); onClose(); }} />
      </div>
    </motion.div>;
  }
  function End({ onRestart, onClose }) {
    return <motion.div className="finale rb-end" role="dialog" aria-modal="true" aria-label="The end of the route" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="finale-in">
        <Mark size={56} play />
        <h2 className="finale-title">Three batches, three endings</h2>
        <div className="rb-ends">{["chips", "mango", "slow"].map(id => { const a = ACTS[AI[id]]; return <div key={id} className={cx("rb-endcard", a.outcome.red && "red")}><img src={img(a.img)} alt="" /><b>{a.title}{id === "slow" ? " · a slow week" : ""}</b><Money value={a.outcome.value} roll from={0} size="l" style={{ color: "var(--primary-text)" }} /><span>{a.outcome.line}</span></div>; })}</div>
        <div className="row wrap" style={{ gap: 10, justifyContent: "center" }}><Button variant="primary" size="lg" icon="rotate-ccw" onClick={onRestart}>Ride it again</Button><Button variant="secondary" size="lg" onClick={onClose}>Stay here</Button></div>
      </div>
    </motion.div>;
  }

  function Demo({ start, autoplay, onHome }) {
    const [map, setMap] = useState(null); const [phoneOnly, setPhoneOnly] = useState(false); const [notes, setNotes] = useState(true);
    const p = V.usePlayer(ACTS, start, !!map); V.useBeatFx(p); const app = useApp();
    const canvas = useRef(null); const size = V.useSize(canvas);
    useEffect(() => { if (autoplay) p.setPlaying(true); }, []);
    // a new line: the map shows the token hopping to it, then the stage comes back
    const prevA = useRef(p.pos.a);
    useEffect(() => { if (p.pos.a !== prevA.current) { prevA.current = p.pos.a; setMap("hop"); if (p.playing) { const t = setTimeout(() => setMap(null), 2600); return () => clearTimeout(t); } } }, [p.pos.a]);
    useEffect(() => { const f = e => { if (map || (e.target.closest && e.target.closest("input, textarea, select"))) return; if (e.key === "ArrowRight") { e.preventDefault(); p.next(); } else if (e.key === "ArrowLeft") { e.preventDefault(); p.back(); } else if (e.key === "m" || e.key === "M") setMap("map"); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); });
    const real = app.w < 768;
    if (real) return <div className="demo-real rb-real">
      <div className="real-bar rb-realbar"><button type="button" className="iconbtn" aria-label="Back" onClick={p.back}><Icon name="chevron-left" size={22} /></button>
        <button type="button" className="real-stage" onClick={() => setMap("map")}><span className={cx("rb-card-n sm", toneOf(p.station))}>{p.pos.s + 1}</span><span className="stack tight" style={{ gap: 0 }}><b>{p.act.title} · {p.station.title}</b><span>{p.beat.text}</span></span></button>
        <button type="button" className={cx("iconbtn real-next", p.beat.human && "amber")} aria-label="Next" onClick={p.next}><Icon name="arrow-right" size={22} /></button></div>
      <V.Stage station={p.station} beat={p.beat} act={p.act} size={size} real />
      <AnimatePresence>{map && <MapOver p={p} hop={map === "hop"} onPick={(a, s) => p.go(a, s, 0)} onClose={() => setMap(null)} />}</AnimatePresence>
    </div>;
    return <div className={cx("demo rb-demo", !notes && "no-notes")}>
      <header className="demo-top rb-top">
        <span className="row tight demo-brand"><button type="button" className="rb-home" onClick={onHome} aria-label="Back to the map"><Mark size={30} /></button><Wordmark size={17} /><span className="demo-tag">Guided demo</span></span>
        <Strip p={p} onMap={() => setMap("map")} />
        <span className="row tight demo-tools">
          <IconButton icon={p.playing ? "pause" : "play"} label={p.playing ? "Pause" : "Play"} onClick={() => p.setPlaying(!p.playing)} />
          <IconButton icon={phoneOnly ? "monitor" : "smartphone"} label={phoneOnly ? "Laptop and phone" : "Phone only"} onClick={() => setPhoneOnly(v => !v)} />
          <IconButton icon="presentation" label={notes ? "Hide notes" : "Show notes"} onClick={() => setNotes(v => !v)} />
          <ModeMenuButton />
        </span>
      </header>
      <div className="demo-body">
        {notes && <Card p={p} />}
        <main className="demo-canvas" ref={canvas}><V.Stage station={p.station} beat={p.beat} act={p.act} size={size} phoneOnly={phoneOnly} /></main>
      </div>
      <AnimatePresence>{map && <MapOver p={p} hop={map === "hop"} onPick={(a, s) => p.go(a, s, 0)} onClose={() => setMap(null)} />}</AnimatePresence>
      <AnimatePresence>{p.pos.end && <End onRestart={() => p.go(0, 0, 0)} onClose={() => {}} />}</AnimatePresence>
    </div>;
  }

  function App() {
    const [view, setView] = useState(() => (window.SC167_START ? "demo" : "start"));
    const [start, setStart] = useState(window.SC167_START || { a: 0, s: 0, b: 0 }); const [auto, setAuto] = useState(window.SC167_PLAY);
    if (view === "start") return <div className="demo rb-shell"><header className="demo-top rb-top"><span className="row tight demo-brand"><Mark size={30} /><Wordmark size={17} /><span className="demo-tag">Guided demo</span></span><span /><span className="row tight demo-tools"><ModeMenuButton /></span></header>
      <main className="rb-startwrap"><Start onPick={(a, s) => { setStart({ a, s, b: 0 }); setAuto(false); setView("demo"); }} onAll={() => { setStart({ a: 0, s: 0, b: 0 }); setAuto(true); setView("demo"); }} /></main></div>;
    return <Demo key={JSON.stringify(start)} start={start} autoplay={auto} onHome={() => setView("start")} />;
  }
  function Root() { return <ThemeProvider><AppRoot className="demo-root" style={{ position: "fixed", inset: 0 }}><NoticeHost><App /></NoticeHost></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();

// SC-49 option C · quiet and quick. Motion only where it tells the reader something: a thin progress line and still
// placeholders while a screen or tab loads, then the content at once; Sign in turns its icon into a spinner beside its
// label; the charts draw as they are and move only when a reading changes them, with what changed marked for a moment;
// and the agents' work is a live feed of their runs and the batches they moved. Under reduced motion every step lands
// at once.
(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, W = window.SC49_SHARED, P = window.SC3_PLATFORM, D = window.SC3_DATA, fmt = window.SC3_MONEY.fmt;
  const { cx, Icon, Page, Spinner, WorkspaceMark, useApp } = K;
  const EASE = W.EASE;

  /* ---------- the loader: a progress line and the kit's placeholders ---------- */
  function Progress({ done }) {
    const reduce = useReducedMotion(); const [gone, setGone] = useState(false);
    useEffect(() => { if (!done) return; const t = setTimeout(() => setGone(true), reduce ? 0 : 400); return () => clearTimeout(t); }, [done]);
    if (gone) return null;
    return <motion.i className="c-prog" aria-hidden="true" initial={{ scaleX: reduce ? 0.8 : 0 }} animate={{ scaleX: done ? 1 : 0.8, opacity: done ? 0 : 1 }} transition={done ? { scaleX: { duration: reduce ? 0 : 0.16 }, opacity: { duration: reduce ? 0 : 0.2, delay: reduce ? 0 : 0.18 } } : { duration: reduce ? 0 : (W.FILL / 1000) * 1.2, ease: [0.3, 0.7, 0.4, 1] }} />;
  }
  function Skeleton({ shape }) {
    const app = useApp(); const phone = app.bp === "phone";
    return <div className="c-skel">{W.blocks(shape, phone).map(r => <div key={r.row} className={cx("c-row", "k-" + r.kind)} style={{ gridTemplateColumns: r.widths ? r.widths.map(x => x + "fr").join(" ") : `repeat(${r.cols}, minmax(0, 1fr))`, width: r.width ? r.width * 100 + "%" : undefined }}>
      {r.items.map(i => <span key={i} className="skeleton c-blk" style={{ height: r.h }} />)}
    </div>)}</div>;
  }
  function Stage({ k, shape, kind, title, children }) {
    const ready = W.useLoad(k, kind); const reduce = useReducedMotion();
    const skel = <div className="c-load" role="status" aria-busy="true"><span className="sr-only">Loading {kind === "tab" ? "the tab" : title}</span><Skeleton shape={shape} /></div>;
    return <div className="c-stage">
      <Progress key={k} done={ready} />
      {ready ? <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}>{children}</motion.div> : kind === "screen" ? <Page title={title}>{skel}</Page> : skel}
    </div>;
  }

  /* ---------- Sign in: a spinner beside the label, a tick when it's in ---------- */
  function SignInButton({ phase, name }) {
    const busy = phase === "busy", done = phase === "done";
    return <button type="submit" className={cx("btn btn-primary btn-lg btn-block c-signin", (busy || done) && "on")} aria-disabled={busy || done || undefined}>
      <span className="c-si-ic" aria-hidden="true">{busy ? <Spinner size={18} /> : <Icon name={done ? "check" : "log-in"} size={18} />}</span>
      <span>{done ? "Signed in" : busy ? "Signing in…" : "Sign in"}</span>
      <span className="sr-only" role="status">{busy ? "Signing in" : done ? `Signed in. Welcome, ${name}.` : ""}</span>
    </button>;
  }

  /* ---------- the Overview: still until a reading changes something, then that thing moves and is marked ---------- */
  // a figure that changed is marked for a moment: a soft green ground and an arrow, then plain again
  function Num({ value, format }) {
    const prev = W.usePrevious(value); const [mark, setMark] = useState(null);
    useEffect(() => { if (prev != null && prev !== value) { setMark({ up: value > prev, at: Date.now() }); const t = setTimeout(() => setMark(null), 1800); return () => clearTimeout(t); } }, [value]);
    const f = format || (v => Math.round(v).toLocaleString("en-IN"));
    return <span className={cx("c-num", mark && "marked")} key={mark ? mark.at : "n"}>{f(value)}{mark && <Icon name={mark.up ? "trending-up" : "trending-down"} size={14} className="c-arrow" />}</span>;
  }
  function Sparkline({ values, tone }) {
    const box = useRef(null); const w = W.useWidth(box, 220); const reduce = useReducedMotion();
    const H = 36, max = Math.max(1, ...values), n = values.length;
    const X = i => (n > 1 ? (i / (n - 1)) * w : w / 2), Y = v => H - 3 - (v / max) * (H - 8);
    const line = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const col = tone === "amber" ? "var(--amber)" : "var(--primary)"; const tr = { duration: reduce ? 0 : 0.42, ease: EASE };
    return <div ref={box} className="c-spark-box"><svg className="cs-ov-spark" viewBox={`0 0 ${w} ${H}`} aria-hidden="true">
      <motion.path key={"a" + n} fill={col} opacity="0.1" initial={false} animate={{ d: `${line} L${w} ${H} L0 ${H} Z` }} transition={tr} />
      <motion.path key={"l" + n} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" initial={false} animate={{ d: line }} transition={tr} />
    </svg></div>;
  }
  function RecoveredChart({ byDay, height }) {
    const box = useRef(null); const w = W.useWidth(box); const [hover, setHover] = useState(null); const reduce = useReducedMotion();
    const g = W.chartGeometry(byDay, w, height); const today = byDay[byDay.length - 1];
    const prev = W.usePrevious(today ? today.recovered : 0); const [mark, setMark] = useState(null);
    useEffect(() => { if (today && prev != null && today.recovered !== prev) { setMark({ v: today.recovered - prev, at: Date.now() }); const t = setTimeout(() => setMark(null), 2400); return () => clearTimeout(t); } }, [today && today.recovered]);
    const tx = g.X(g.n - 1), ty = g.Y(today ? today.recovered : 0); const tr = { duration: reduce ? 0 : 0.42, ease: EASE };
    return <div className="cs-ov-chart c-chart" ref={box} onMouseLeave={() => setHover(null)}>
      <W.ChartFrame byDay={byDay} H={height} w={w} g={g} hover={hover} setHover={setHover} label={W.chartLabel(byDay)}>
        <motion.path key={"a" + g.n} fill="var(--primary)" opacity="0.1" initial={false} animate={{ d: g.area }} transition={tr} />
        <motion.path key={"l" + g.n} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" initial={false} animate={{ d: g.line }} transition={tr} />
        {mark && <circle cx={tx} cy={ty} r="10" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.5" className="c-ring" />}
        <motion.circle r="4.5" fill="var(--primary)" stroke="var(--surface)" strokeWidth="2" initial={false} animate={{ cx: tx, cy: ty }} transition={tr} />
      </W.ChartFrame>
      {mark && mark.v > 0 && <span className="c-gain" style={{ left: `calc(${(tx / w) * 100}% - 16px)`, top: ty - 40 }}>+{fmt.inr(mark.v)} today</span>}
      <W.ChartTip byDay={byDay} hover={hover} g={g} w={w} />
    </div>;
  }
  // the bars by stop, as they are, with the bars that changed marked and their widths eased
  function StopBars({ byStop, value, onPick }) {
    const titles = D.STAGES.map(x => x.title); const max = Math.max(1, ...byStop);
    const prev = W.usePrevious(byStop); const [lit, setLit] = useState({});
    useEffect(() => { if (!prev) return; const l = {}; byStop.forEach((n, i) => { if (prev[i] !== n) l[i] = true; }); if (Object.keys(l).length) { setLit(l); const t = setTimeout(() => setLit({}), 1800); return () => clearTimeout(t); } }, [byStop.join(",")]);
    return <div className="cs-ov-stops c-stops" role="group" aria-label="Batches in flight by stop">{titles.map((t, i) => <button key={t} type="button" className={cx("cs-ov-stop", i === 5 && "human", !byStop[i] && "zero", lit[i] && "c-lit")} aria-pressed={value === i} aria-label={`${t}: ${byStop[i]} batch${byStop[i] === 1 ? "" : "es"}. ${value === i ? "Shown in the table" : "Show them in the table"}`} onClick={() => onPick(value === i ? null : i)}>
      <span>{t}</span><span className="bar" style={{ width: (byStop[i] / max) * 100 + "%" }} /><span className="n">{byStop[i]}</span></button>)}</div>;
  }

  /* ---------- live activity: the agents' runs as they land, and the batches they moved ---------- */
  function Seg({ from, to }) {
    const reduce = useReducedMotion();
    return <span className="cs-ov-seg c-seg" aria-hidden="true">{D.STAGES.map((_, i) => <i key={i} className={cx(i < from && "done", i === to && to < 9 && "now", i === to && i === 5 && "human")}>{i >= from && i < to && <motion.b initial={{ scaleX: reduce ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : 0.42, ease: EASE, delay: reduce ? 0 : 0.1 + (i - from) * 0.08 }} />}</i>)}</span>;
  }
  function AgentsAtWork({ s, paused, titles, client, go }) {
    const reduce = useReducedMotion();
    const all = useMemo(() => s.batches.map(b => Object.assign({}, b, { current: b.closedAt ? 9 : b.current })), [s.batches]);
    const moves = W.useMoves(all);
    const [moved, setMoved] = useState([]);
    useEffect(() => { if (moves.length) setMoved(m => moves.concat(m).slice(0, 5)); }, [moves]);
    const runs = s.runs.slice(0, 6);
    return <section className="cs-ov-card c-work" aria-labelledby="c-work-t">
      <div className="cs-ov-head"><div><div className="t" id="c-work-t">Live activity</div><div className="s">The agents' runs as they land, and the batches they moved</div></div>
        <span className={cx("c-state", paused && "paused")}>{paused ? "Paused" : "Live"}</span></div>
      <div className="c-cols">
        <div className="c-feed"><div className="c-sub">Agent runs</div>
          <ul className="c-list" aria-live="polite">{runs.map(r => { const a = P.AGENTS.find(x => x.id === r.agent), c = client(r.client); const fresh = r.fresh && Date.now() - r.fresh < 4000;
            return <motion.li key={(r.fresh || "") + r.at + r.text} layout={reduce ? false : "position"} initial={fresh && !reduce ? { opacity: 0, y: -8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: EASE }} className={cx(fresh && "fresh")}>
              <span className="mono t-footnote c-at">{r.at}</span><span className="c-ic" aria-hidden="true"><Icon name={a ? a.icon : "bot"} size={15} /></span>
              <span className="c-txt"><span className="l1"><b>{a ? a.name : r.agent}</b> · {c ? c.name : r.client}</span><span>{r.text}</span></span></motion.li>; })}</ul></div>
        <div className="c-feed"><div className="c-sub">Batches that moved</div>
          {moved.length ? <ul className="c-list">{moved.map(m => { const c = client(m.client); return <motion.li key={m.key + m.at} layout={reduce ? false : "position"} initial={reduce ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: EASE }} className={cx(Date.now() - m.at < 4000 && "fresh")}>
              <WorkspaceMark ws={c} size={24} /><span className="c-txt"><span className="l1"><b className="mono">{m.ref}</b> · {c ? c.name : m.client}</span><span>{m.to >= 9 ? "Closed" : `${titles[Math.min(m.from, 8)]} → ${titles[m.to]}`}</span></span><Seg from={m.from} to={m.to} /></motion.li>; })}</ul>
            : <p className="c-empty">{paused ? "Updates are paused." : "Batches show here as the agents move them on."}</p>}</div>
      </div>
    </section>;
  }

  window.SC49 = { option: "c", Stage, SignInButton, ERROR_MS: 0, SIGNED_IN_MS: 320, Num, Sparkline, RecoveredChart, StopBars, AgentsAtWork };
})();

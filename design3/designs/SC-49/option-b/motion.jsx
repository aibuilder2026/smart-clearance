// SC-49 option B · the fill. Loading reads as filling: the screen's shape fills with green ink while the data comes,
// and the content surfaces as it drains. Sign in fills as it checks and floods into the console. The Overview's
// figures count up, the charts fill from their baseline, and the agents' stops are vessels: a batch drops from one to
// the next as an agent finishes, and the levels settle. Under reduced motion every step lands at once.
(function () {
  const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, W = window.SC49_SHARED, P = window.SC3_PLATFORM, D = window.SC3_DATA, fmt = window.SC3_MONEY.fmt;
  const { cx, Icon, Page, useApp } = K;
  const EASE = W.EASE;
  // the spring a level settles on: a little slosh, then still (stiffness 140, damping 14, mass 1)
  const SLOSH = { type: "spring", stiffness: 140, damping: 14, mass: 1 };

  /* ---------- the loader: the screen's shape fills with ink, then the content surfaces ---------- */
  function Vessels({ shape, level, still }) {
    const app = useApp(); const phone = app.bp === "phone";
    return <div className="b-skel">{W.blocks(shape, phone).map(r => <div key={r.row} className={cx("b-row", "k-" + r.kind)} style={{ gridTemplateColumns: r.widths ? r.widths.map(x => x + "fr").join(" ") : `repeat(${r.cols}, minmax(0, 1fr))`, width: r.width ? r.width * 100 + "%" : undefined }}>
      {r.items.map(i => <div key={i} className={cx("b-blk", "k-" + r.kind)} style={{ height: r.h }}>
        <motion.i className="b-ink" initial={{ y: "100%" }} animate={{ y: `${(1 - level) * 100}%` }} transition={still ? { duration: 0 } : level >= 1 ? { duration: 0.2, ease: EASE } : { duration: (W.FILL / 1000) * 1.3, ease: [0.25, 0.6, 0.35, 1], delay: i * 0.04 }} />
      </div>)}
    </div>)}</div>;
  }
  function Stage({ k, shape, kind, title, children }) {
    const ready = W.useLoad(k, kind); const reduce = useReducedMotion();
    const [drain, setDrain] = useState(false);
    useEffect(() => { if (!ready) { setDrain(false); return; } if (reduce) return; setDrain(true); const t = setTimeout(() => setDrain(false), 420); return () => clearTimeout(t); }, [ready]);
    const skel = level => <div className="b-load" role={level < 1 ? "status" : undefined} aria-busy={level < 1 || undefined}>{level < 1 && <span className="sr-only">Loading {kind === "tab" ? "the tab" : title}</span>}<Vessels shape={shape} level={level} still={reduce} /></div>;
    const wrap = node => (kind === "screen" ? <Page title={title}>{node}</Page> : node);
    if (!ready) return <div className="b-stage">{wrap(skel(0.86))}</div>;
    return <div className="b-stage">
      <motion.div className="b-in" initial={reduce ? false : { opacity: 0, scale: 0.992 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.32, ease: EASE, delay: 0.1 }}>{children}</motion.div>
      {drain && <motion.div className="b-over" aria-hidden="true" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}>{wrap(skel(1))}</motion.div>}
    </div>;
  }

  /* ---------- Sign in: the button fills as it checks; signed in, the green floods into the console ---------- */
  function SignInButton({ phase, name }) {
    const reduce = useReducedMotion(); const ref = useRef(null);
    const busy = phase === "busy", done = phase === "done", err = phase === "error";
    useEffect(() => {
      if (!done || reduce || !ref.current) return;
      const r = ref.current.getBoundingClientRect(); const el = document.createElement("div");
      el.className = "b-flood"; el.setAttribute("aria-hidden", "true");
      el.style.setProperty("--x", r.left + r.width / 2 + "px"); el.style.setProperty("--y", r.top + r.height / 2 + "px");
      document.body.appendChild(el); const t = setTimeout(() => el.remove(), 1500); return () => clearTimeout(t);
    }, [done]);
    const label = done ? `Signed in` : busy ? "Signing in…" : "Sign in";
    return <motion.button ref={ref} type="submit" className={cx("btn btn-primary btn-lg btn-block b-signin", (busy || done) && "on")} aria-disabled={busy || done || undefined}
      animate={err && !reduce ? { rotate: [0, -1.6, 1.4, -0.8, 0.5, 0] } : { rotate: 0 }} transition={{ duration: 0.42, ease: "easeOut" }}>
      <motion.i className="b-si-ink" aria-hidden="true" initial={false} animate={{ x: done ? "0%" : busy ? "-12%" : "-101%" }} transition={reduce ? { duration: 0 } : busy ? { duration: 1.3, ease: [0.25, 0.6, 0.35, 1] } : { duration: done ? 0.18 : 0.36, ease: EASE }}>
        <svg className="edge" viewBox="0 0 10 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 H4 Q9 5 4 10 T4 20 T4 30 T4 40 H0 Z" /></svg>
      </motion.i>
      <span className="b-si-row">{done ? <Icon name="check" size={18} /> : <Icon name="log-in" size={18} />}<span>{label}</span></span>
      <span className="sr-only" role="status">{busy ? "Signing in" : done ? `Signed in. Welcome, ${name}.` : ""}</span>
    </motion.button>;
  }

  /* ---------- the Overview's figures and charts: they count up and fill from the baseline ---------- */
  function Num({ value, format }) {
    const reduce = useReducedMotion(); const [shown, setShown] = useState(reduce ? value : 0); const from = useRef(reduce ? value : 0);
    useEffect(() => {
      if (reduce) { setShown(value); from.current = value; return; }
      const c = Motion.animate(from.current, value, { duration: 0.7, ease: EASE, onUpdate: v => { from.current = v; setShown(v); } });
      return () => c.stop();
    }, [value]);
    const f = format || (v => Math.round(v).toLocaleString("en-IN"));
    return <><span aria-hidden="true">{f(Math.round(shown))}</span><span className="sr-only">{f(value)}</span></>;
  }
  function useClip() { return useMemo(() => "bf" + Math.random().toString(36).slice(2, 8), []); }
  function Sparkline({ values, tone }) {
    const box = useRef(null); const w = W.useWidth(box, 220); const reduce = useReducedMotion(); const id = useClip();
    const H = 36, max = Math.max(1, ...values), n = values.length;
    const X = i => (n > 1 ? (i / (n - 1)) * w : w / 2), Y = v => H - 3 - (v / max) * (H - 8);
    const line = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const col = tone === "amber" ? "var(--amber)" : "var(--primary)";
    return <div ref={box} className="b-spark-box"><svg className="cs-ov-spark" viewBox={`0 0 ${w} ${H}`} aria-hidden="true">
      <defs><clipPath id={id}><motion.rect x="0" width={w} initial={{ y: reduce ? 0 : H, height: H }} animate={{ y: 0 }} transition={{ duration: reduce ? 0 : 0.8, ease: [0.25, 0.6, 0.35, 1] }} /></clipPath></defs>
      <motion.path clipPath={`url(#${id})`} fill={col} opacity="0.16" initial={false} animate={{ d: `${line} L${w} ${H} L0 ${H} Z` }} transition={{ duration: reduce ? 0 : 0.42, ease: EASE }} />
      <motion.path fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" initial={{ opacity: reduce ? 1 : 0, d: line }} animate={{ opacity: 1, d: line }} transition={{ opacity: { duration: reduce ? 0 : 0.24, delay: reduce ? 0 : 0.65 }, d: { duration: reduce ? 0 : 0.42, ease: EASE } }} />
    </svg></div>;
  }
  function RecoveredChart({ byDay, height }) {
    const box = useRef(null); const w = W.useWidth(box); const [hover, setHover] = useState(null); const reduce = useReducedMotion(); const id = useClip();
    const g = W.chartGeometry(byDay, w, height); const today = byDay[byDay.length - 1];
    const prev = W.usePrevious(today ? today.recovered : 0); const [drop, setDrop] = useState(null);
    useEffect(() => { if (today && prev != null && today.recovered > prev && !reduce) { setDrop({ v: today.recovered - prev, at: Date.now() }); const t = setTimeout(() => setDrop(null), 2600); return () => clearTimeout(t); } }, [today && today.recovered]);
    const tx = g.X(g.n - 1), ty = g.Y(today ? today.recovered : 0);
    return <div className="cs-ov-chart b-chart" ref={box} onMouseLeave={() => setHover(null)}>
      <W.ChartFrame byDay={byDay} H={height} w={w} g={g} hover={hover} setHover={setHover} label={W.chartLabel(byDay)}>
        <defs><clipPath id={id}><motion.rect key={g.n} x="0" width={w} height={height} initial={{ y: reduce ? 0 : height - g.pb }} animate={{ y: 0 }} transition={{ duration: reduce ? 0 : 1, ease: [0.25, 0.6, 0.35, 1] }} /></clipPath></defs>
        <motion.path key={"a" + g.n} clipPath={`url(#${id})`} fill="var(--primary)" opacity="0.16" initial={false} animate={{ d: g.area }} transition={{ duration: reduce ? 0 : 0.42, ease: EASE }} />
        <motion.path key={"l" + g.n} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" initial={{ opacity: reduce ? 1 : 0, d: g.line }} animate={{ opacity: 1, d: g.line }} transition={{ opacity: { duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.85 }, d: { duration: reduce ? 0 : 0.42, ease: EASE } }} />
        <motion.circle r="4.5" fill="var(--primary)" stroke="var(--surface)" strokeWidth="2" initial={false} animate={{ cx: tx, cy: ty }} transition={{ duration: reduce ? 0 : 0.42, ease: EASE }} />
        {drop && <motion.circle key={drop.at} r="4" fill="var(--primary)" cx={tx} initial={{ cy: g.pt - 6, opacity: 1 }} animate={{ cy: ty, opacity: [1, 1, 0] }} transition={{ duration: 0.5, ease: [0.55, 0, 1, 0.45], times: [0, 0.9, 1] }} />}
        {drop && <motion.ellipse key={"s" + drop.at} cx={tx} cy={ty} fill="none" stroke="var(--primary)" strokeWidth="1.5" initial={{ rx: 3, ry: 1.5, opacity: 0 }} animate={{ rx: [3, 16], ry: [1.5, 5], opacity: [0.8, 0] }} transition={{ duration: 0.7, delay: 0.48, ease: "easeOut" }} />}
      </W.ChartFrame>
      <AnimatePresence>{drop && <motion.span key={drop.at} className="b-gain" style={{ left: `${(tx / w) * 100}%`, top: ty - 38, x: "-100%" }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.24, delay: 0.5, ease: EASE }}>+{fmt.inr(drop.v)}</motion.span>}</AnimatePresence>
      <W.ChartTip byDay={byDay} hover={hover} g={g} w={w} />
    </div>;
  }

  /* ---------- the flow: nine vessels, a drop for every batch that moves ---------- */
  const STAGES = D.STAGES.map(x => x.id);
  const AT = STAGES.map(id => P.AGENTS.filter(a => a.stage === id));
  function AgentsAtWork({ s, d, paused, titles, client, value, onPick }) {
    const app = useApp(); const reduce = useReducedMotion(); const phone = app.bp === "phone";
    const all = useMemo(() => s.batches.map(b => Object.assign({}, b, { current: b.closedAt ? 9 : b.current })), [s.batches]);
    const moves = W.useMoves(all);
    const box = useRef(null); const cells = useRef([]); const [drops, setDrops] = useState([]);
    const dayStart = Date.parse(P.TODAY + "T00:00:00+05:30");
    const closedToday = all.filter(b => b.closedAt && Date.parse(b.closedAt) >= dayStart).length;
    const recToday = d.byDay[d.byDay.length - 1] ? d.byDay[d.byDay.length - 1].recovered : 0;
    const counts = d.byStop.concat([closedToday]);
    const top = Math.max(6, ...d.byStop);
    useLayoutEffect(() => {
      if (!moves.length || reduce || !box.current) return;
      const at = box.current.getBoundingClientRect();
      const pt = i => { const el = cells.current[i]; if (!el) return null; const r = el.querySelector(".liq").getBoundingClientRect(); return { x: r.left + r.width / 2 - at.left, y: r.top - at.top }; };
      const list = moves.slice(0, 4).map((m, k) => { const a = pt(Math.min(m.from, 9)), b = pt(Math.min(m.to, 9)); return a && b ? { id: m.key + m.at, a, b, delay: k * 0.12, client: client(m.client) } : null; }).filter(Boolean);
      setDrops(list); const t = setTimeout(() => setDrops([]), 1400); return () => clearTimeout(t);
    }, [moves]);
    const run = s.runs[0]; const ra = run && P.AGENTS.find(a => a.id === run.agent); const rc = run && client(run.client);
    return <section className="cs-ov-card b-work" aria-labelledby="b-work-t">
      <div className="cs-ov-head"><div><div className="t" id="b-work-t">The flow</div><div className="s">{d.inFlight} batch{d.inFlight === 1 ? "" : "es"} in flight · each stop fills with the batches waiting there; a drop falls to the next as an agent finishes</div></div>
        <span className={cx("b-state", paused && "paused")}>{paused ? "Paused" : "Live"}</span></div>
      <div className="b-flow" ref={box} role="group" aria-label="Batches in flight by stop">
        {counts.map((n, i) => { const end = i === 9, human = i === 5, ag = AT[i] || [];
          const name = end ? fmt.inr(recToday) : human ? "You" : ag.length > 1 ? `${ag[0].name} +${ag.length - 1}` : ag[0] ? ag[0].name : "";
          const lvl = end ? Math.min(1, n / Math.max(4, n)) : n / top;
          const inner = <>
            <span className="n tnum" aria-hidden="true"><Num value={n} /></span>
            <span className="vessel" aria-hidden="true"><motion.span className="liq" initial={{ scaleY: reduce ? lvl : 0 }} animate={{ scaleY: lvl }} transition={reduce ? { duration: 0 } : SLOSH} /></span>
            <span className="lbl" aria-hidden="true">{phone ? <Icon name={end ? "indian-rupee" : human ? "hand" : (ag[0] || {}).icon || "bot"} size={15} /> : <><b>{end ? "Closed today" : titles[i]}</b><span>{name}</span></>}</span>
          </>;
          return end ? <div key="end" ref={el => (cells.current[i] = el)} className="b-cell end" role="img" aria-label={`Closed today: ${n} batch${n === 1 ? "" : "es"}, ${fmt.inr(recToday)} recovered`}>{inner}</div>
            : <button key={titles[i]} ref={el => (cells.current[i] = el)} type="button" className={cx("b-cell", human && "human", !n && "zero")} aria-pressed={value === i} onClick={() => onPick(value === i ? null : i)}
              aria-label={`${titles[i]}, ${human ? "waiting for a person" : name}: ${n} batch${n === 1 ? "" : "es"}. ${value === i ? "Shown in the table" : "Show them in the table"}`}>{inner}</button>; })}
        <div className="b-drops" aria-hidden="true">{drops.map(x => <motion.span key={x.id} className="b-drop" style={{ background: x.client && x.client.mark ? x.client.mark.from : "var(--primary)" }}
          initial={{ x: x.a.x - 5, y: x.a.y - 5, scale: 0.4, opacity: 0 }} animate={{ x: [x.a.x - 5, (x.a.x + x.b.x) / 2 - 5, x.b.x - 5], y: [x.a.y - 5, Math.min(x.a.y, x.b.y) - 46, x.b.y - 5], scale: [0.6, 1, 0.8], opacity: [1, 1, 0] }}
          transition={{ duration: 0.8, delay: x.delay, ease: [0.45, 0, 0.55, 1], times: [0, 0.45, 1] }} />)}</div>
      </div>
      <p className="b-last" aria-live="polite">{run && <><span className="mono t-footnote">{run.at}</span> <b>{ra ? ra.name : run.agent}</b> · {rc ? rc.name : run.client} · {run.text}</>}</p>
    </section>;
  }

  window.SC49 = { option: "b", Stage, SignInButton, ERROR_MS: 420, SIGNED_IN_MS: 700, Num, Sparkline, RecoveredChart, AgentsAtWork, hideStops: true };
})();

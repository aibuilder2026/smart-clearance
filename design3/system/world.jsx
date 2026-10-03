// Smart-Clearance design system v3 · the live-tracking world: rolling numerals, money, the tracker,
// the agent feed, the cluster map, charts, JSON cards and device frames
(function () {
  const { useState, useEffect, useRef, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3; const { cx, Icon, Avatar, Badge, useApp, AppRoot } = K;
  const fmt = window.SC3_MONEY.fmt;

  /* ---------- numerals ---------- */
  // odometer digits: every digit is a strip of 0-9 that rolls to its place when the value changes
  function Roll({ value, format, from, className, stagger = 40, hidden }) {
    const reduce = useReducedMotion();
    const text = (format || (v => Math.round(v).toLocaleString("en-IN")))(value);
    const [armed, setArmed] = useState(from == null || reduce);
    useEffect(() => { if (!armed) { const t = setTimeout(() => setArmed(true), 90); return () => clearTimeout(t); } }, []);
    const chars = text.split(""); const n = chars.length;
    return <span className={cx("roll", className)} aria-hidden={hidden ? "true" : undefined}>{!hidden && <span className="sr-only">{text}</span>}{chars.map((ch, i) => {
      const key = n - i;
      if (!/\d/.test(ch)) return <span key={"s" + key} aria-hidden="true">{ch}</span>;
      const d = armed ? +ch : 0;
      return <span key={"d" + key} className="rd" aria-hidden="true"><span className="ghost">{ch}</span><span className="rs" style={{ transform: `translateY(${-d * 0.98}em)`, transitionDelay: reduce ? "0ms" : `${(n - i) * stagger}ms` }}>{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => <span key={k}>{k}</span>)}</span></span>;
    })}</span>;
  }
  // Monzo-style money: the rupee sign and paise set small beside heavy numerals
  function Money({ value, size, roll, from, decimals, tone, className, style, showSign = true }) {
    const neg = value < 0; const abs = Math.abs(value); const int = decimals ? Math.floor(abs + 1e-9) : Math.round(abs); const paise = decimals ? Math.round((abs - Math.floor(abs + 1e-9)) * 100) : 0;
    const spoken = (neg ? "minus " : "") + "₹" + abs.toLocaleString("en-IN", { maximumFractionDigits: decimals ? 2 : 0 });
    return <span className={cx("num money", size, tone, className)} style={style}>
      <span className="sr-only">{spoken}</span>{neg && showSign && <span className="sign" aria-hidden="true">−</span>}<span className="cur" aria-hidden="true">₹</span>
      {roll ? <Roll value={int} from={from} hidden /> : <span aria-hidden="true">{int.toLocaleString("en-IN")}</span>}
      {decimals ? <span className="dec" aria-hidden="true">.{String(paise).padStart(2, "0")}</span> : null}
    </span>;
  }
  // days left: urgency set in the numeral's own axes, wider and heavier as the date nears
  function DaysNum({ days, life = 180, size = "xl", roll, className, style }) {
    const u = Math.max(0, Math.min(1, 1 - days / life));
    return <span className={cx("num", size, className)} style={{ "--wdth": Math.round(76 + 24 * u), "--wght": Math.round(620 + 180 * u), ...style }}>{roll ? <Roll value={days} from={0} /> : days}</span>;
  }

  /* ---------- small pieces ---------- */
  function GateChips({ gates, size }) {
    return <span className="row tight wrap">{gates.map(g => <span key={g.id} className={cx("gate", g.pass ? "pass" : "fail")} title={`${g.app}: ${g.rule}, has ${g.has}`}><Icon name={g.pass ? "check" : "x"} size={13} stroke={2.6} />{g.app}{size !== "sm" && <span style={{ fontWeight: 500 }}>{g.has}/{g.need}</span>}</span>)}</span>;
  }
  function Countdown({ days, life, status, label }) {
    const p = Math.max(0.025, Math.min(1, days / life));
    return <div className={cx("countdown", status === "at-risk" ? "risk" : status === "gated" ? "gated" : "")} role="img" aria-label={label || `${days} of ${life} days of shelf life left`}><i style={{ "--p": p }} /></div>;
  }
  function Tile({ label, icon, children, foot, live, className, style }) {
    return <div className={cx("tile", live && "live", className)} style={style}><span className="tl-label">{icon && <Icon name={icon} size={15} />}{label}</span><span className="tl-value">{children}</span>{foot && <span className="tl-foot">{foot}</span>}</div>;
  }
  function Aura({ on = true, className, children, style, as: As = "div" }) {
    return <As className={cx(on && "aura", className)} style={style}>{children}</As>;
  }

  /* ---------- the nine-stop tracker ---------- */
  function Tracker({ stages, current = -1, done = 0, times = {}, onStop, label = "Stages" }) {
    const n = stages.length; const pos = current >= 0 ? current : Math.max(0, done - 1);
    return <div className="tracker" style={{ "--stops": n }} role="list" aria-label={label}>
      <div className="rail" aria-hidden="true"><i style={{ "--p": n > 1 ? pos / (n - 1) : 0 }} /></div>
      {stages.map((s, i) => { const st = i < done ? "done" : i === current ? "now" : ""; const body = <Fragment>
        <span className="dot">{st === "done" && <Icon name="check" size={12} stroke={3.2} />}</span>
        <span className="st-label">{s.title}</span>
        {times[s.id] && <span className="st-time">{times[s.id]}</span>}
      </Fragment>; return <div key={s.id} role="listitem" className={cx("stop", st, s.human && "human")} aria-current={i === current ? "step" : undefined}>{onStop ? <button type="button" className="stop-btn" onClick={() => onStop(i)}>{body}</button> : body}</div>; })}
    </div>;
  }
  function VTracker({ items, current = -1, done = 0 }) {
    return <div className="vtracker" role="list">{items.map((s, i) => { const st = i < done ? "done" : i === current ? "now" : ""; return <div key={s.id} role="listitem" className={cx("vstop", st, s.human && "human")} aria-current={i === current ? "step" : undefined}>
      <span className="dot">{st === "done" && <Icon name="check" size={13} stroke={3} />}</span>
      <div><div className="vs-title">{s.title}</div>{s.text && (st || i === current) && <div className="vs-text">{s.text}</div>}</div>
      <span className="vs-time">{s.time || ""}</span>
    </div>; })}</div>;
  }

  /* ---------- the agent feed: hand-offs streamed, gaps drawn to the clock ---------- */
  const gapFor = m => Math.round(12 + Math.min(44, Math.log2(1 + (m || 0)) * 4.6));
  function AgentFeed({ events, people = {}, live = -1, typing, max }) {
    const list = max ? events.slice(-max) : events;
    return <div className="feed" aria-live="polite">{list.map((e, i) => {
      const next = list[i + 1]; const isLive = events.indexOf(e) === live; const person = e.person && people[e.person];
      return <motion.div key={(e.id || e.at) + i + (e.agent || e.person)} className={cx("ev", isLive && "live")} style={{ "--gap": next ? gapFor(next.min) + "px" : "0px" }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
        {person ? <span className="ag person"><img src={person.img} alt="" /></span> : <Aura on={isLive} className="ag" style={{ borderRadius: 11 }}><Icon name={e.icon || "bot"} size={18} /></Aura>}
        <div style={{ minWidth: 0 }}>
          <div className="ev-head"><span className="ev-who">{person ? person.short : e.agent}</span>{e.human || person ? <Badge size="sm" tone="amber">person</Badge> : <Badge size="sm">agent</Badge>}<span className="ev-time">{e.at}</span></div>
          {isLive && typing ? <div className="ev-text"><span className="typing" role="img" aria-label="Working"><i /><i /><i /></span></div> : <div className="ev-text">{e.text}</div>}
          {e.calls && !(isLive && typing) && <div className="ev-calls">{e.calls.map(([fn, res, tone], j) => <span key={j} className={cx("toolcall", tone)} title={`${fn} → ${res}`}><Icon name="zap" />{fn}<span style={{ opacity: 0.6 }}>→</span>{res}</span>)}</div>}
        </div>
      </motion.div>;
    })}</div>;
  }

  /* ---------- the Nagpur cluster map (schematic) ---------- */
  const AREAS = { Itwari: [392, 196], Mahal: [338, 238], Sitabuldi: [292, 206], Sadar: [300, 150], Dharampeth: [226, 184], Kamptee: [486, 82], "Wardha Road": [208, 304], Wardha: [128, 352], Kalamna: [522, 214] };
  const rnd = seed => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  function useKiranaPoints(kiranas, total = 38) {
    return useMemo(() => {
      const r = rnd(7); const pts = []; const used = {};
      kiranas.forEach((k, i) => { const c = AREAS[k.area] || AREAS.Itwari; used[k.area] = (used[k.area] || 0) + 1; const ang = (used[k.area] * 2.4) + i; const rad = 14 + used[k.area] * 9; pts.push({ id: k.id, x: c[0] + Math.cos(ang) * rad, y: c[1] + Math.sin(ang) * rad * 0.8, ordered: true, k }); });
      const names = Object.keys(AREAS).filter(a => a !== "Kalamna");
      for (let i = pts.length; i < total; i++) { const c = AREAS[names[i % names.length]]; pts.push({ id: "x" + i, x: c[0] + (r() - 0.5) * 92, y: c[1] + (r() - 0.5) * 70, ordered: false }); }
      return pts;
    }, [kiranas.length, total]);
  }
  function ClusterMap({ kiranas = [], orderedCount = 0, route, vanProgress, height = 300, title = "Nagpur cluster", total = 38, focus }) {
    const reduce = useReducedMotion();
    const pts = useKiranaPoints(kiranas, total);
    const ordered = pts.filter(p => p.ordered);
    const g = AREAS.Kalamna;
    const routeD = useMemo(() => { const left = ordered.map(p => [p.x, p.y]); const seq = [g]; let cur = g; while (left.length) { let bi = 0, bd = 1e9; left.forEach((p, i) => { const d = (p[0] - cur[0]) ** 2 + (p[1] - cur[1]) ** 2; if (d < bd) { bd = d; bi = i; } }); cur = left.splice(bi, 1)[0]; seq.push(cur); } seq.push(g); return "M" + seq.map(p => p.map(v => v.toFixed(1)).join(" ")).join(" L"); }, [ordered.length]);
    // the ground runs past the frame so any card shape shows the whole cluster ("meet") without bare bands
    const blocks = useMemo(() => { const r = rnd(3); const out = []; for (let y = -398; y < 800; y += 34) for (let x = -626; x < 1270; x += 44) { if (r() < 0.62) out.push([x + r() * 6, y + r() * 6, 30 + r() * 8, 22 + r() * 6]); } return out; }, []);
    const labels = Object.entries(AREAS).filter(([n]) => n !== "Kalamna");
    return <div className="map" style={{ height }} role="img" aria-label={`${title}: Kalamna godown and ${total} kiranas, ${orderedCount} ordered`}>
      <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }}>
        <rect x="-640" y="-400" width="1920" height="1200" fill="var(--map-ground)" />
        {blocks.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="5" fill="var(--map-block)" />)}
        <path d="M-660 280 L-10 262 C 90 238, 160 280, 250 252 S 400 226, 470 248 S 590 270, 660 236 L1300 210" fill="none" stroke="var(--map-water)" strokeWidth="9" strokeLinecap="round" />
        <g className="road-g">
          <ellipse cx="330" cy="212" rx="210" ry="140" fill="none" stroke="var(--map-road)" strokeWidth="9" />
          <path className="road" d="M330 212 L540 214 L660 222 L1300 236" strokeWidth="10" />
          <path className="road" d="M330 212 L486 82 L560 -10 L760 -420" strokeWidth="10" />
          <path className="road" d="M330 212 L208 304 L128 352 L60 410 L-260 820" strokeWidth="10" />
          <path className="road" d="M330 212 L120 170 L-10 150 L-660 110" strokeWidth="8" />
          <path className="road" d="M330 212 L300 40 L292 -10 L270 -420" strokeWidth="8" />
          <path className="road" d="M330 212 L420 380 L440 410 L560 820" strokeWidth="8" />
          <path className="road" d="M226 184 L392 196 M300 150 L338 238" strokeWidth="5" stroke="var(--map-road-2)" />
        </g>
        {route && <>
          <path className="route-shadow" d={routeD} />
          <motion.path className="route" d={routeD} initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }} />
        </>}
        {pts.map(p => { const on = p.ordered && kiranas.indexOf(p.k) < orderedCount; return <g key={p.id}>
          {on && !reduce && <circle className="pulse" cx={p.x} cy={p.y} r="6" />}
          <circle className={cx("kirana", on && "on")} cx={p.x} cy={p.y} r={on ? 5.5 : 4} />
        </g>; })}
        <g transform={`translate(${g[0]} ${g[1]})`}>
          {!reduce && <circle r="16" fill="var(--primary)" opacity="0.18"><animate attributeName="r" values="12;24;12" dur="2.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.28;0;0.28" dur="2.6s" repeatCount="indefinite" /></circle>}
          <rect x="-14" y="-14" width="28" height="28" rx="9" fill="var(--primary)" stroke="var(--surface)" strokeWidth="3" />
          <path d="M-7 5 V-1 L0 -6 L7 -1 V5 M-4 5 V1 H4 V5" fill="none" stroke="var(--primary-fg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {route && vanProgress != null && <motion.g initial={false} animate={{ opacity: 1 }}>
          <circle r="11" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" style={{ offsetPath: `path("${routeD}")`, offsetDistance: `${Math.round(vanProgress * 100)}%`, transition: "offset-distance 600ms var(--ease)" }} />
        </motion.g>}
        {/* labels last, haloed in the ground colour, so routes and dots never strike through them */}
        {labels.map(([n, [x, y]]) => <text key={n} className="pin-label" x={x} y={y - 22} textAnchor="middle" style={{ fontSize: 10.5 }}>{n}</text>)}
        <text className="pin-label" x={g[0]} y={g[1] - 22} textAnchor="middle">Kalamna godown</text>
      </svg>
      <span className="note">Schematic map · not to scale</span>
    </div>;
  }
  // the long haul: Nagpur to Hyderabad for the ExpireSoon lot
  function HaulLine({ progress = 0, from = "Nagpur", to = "Hyderabad", label = "NH 44 · about 500 km" }) {
    return <div className="map" style={{ height: 96 }} role="img" aria-label={`${from} to ${to}, ${label}`}>
      <svg viewBox="0 0 640 96" preserveAspectRatio="none">
        <rect width="640" height="96" fill="var(--map-ground)" />
        <path d="M60 60 C 220 10, 420 100, 580 40" fill="none" stroke="var(--map-road)" strokeWidth="10" strokeLinecap="round" />
        <path d="M60 60 C 220 10, 420 100, 580 40" fill="none" stroke="var(--violet)" strokeWidth="3" strokeDasharray="6 7" strokeLinecap="round" opacity="0.8" />
        <circle cx="60" cy="60" r="7" fill="var(--primary)" stroke="var(--surface)" strokeWidth="3" />
        <circle cx="580" cy="40" r="7" fill="var(--violet)" stroke="var(--surface)" strokeWidth="3" />
        <circle r="9" fill="var(--surface)" stroke="var(--violet)" strokeWidth="2.5" style={{ offsetPath: 'path("M60 60 C 220 10, 420 100, 580 40")', offsetDistance: `${Math.round(progress * 100)}%`, transition: "offset-distance 1.2s var(--ease)" }} />
      </svg>
      <span className="note" style={{ left: 12, top: 8, bottom: "auto", fontWeight: 600, color: "var(--fg-2)" }}>{from}</span>
      <span className="note" style={{ left: "auto", right: 12, top: 8, bottom: "auto", fontWeight: 600, color: "var(--fg-2)" }}>{to}</span>
      <span className="note" style={{ left: "50%", transform: "translateX(-50%)" }}>{label}</span>
    </div>;
  }

  /* ---------- charts (hand-built SVG, hover tooltips, fixed series order) ---------- */
  const CH_ORDER = ["kirana", "expiresoon", "staff", "d2c", "foodbank", "writeoff"];
  const chColor = id => `var(--ch-${id})`;
  // net rupees per unit by channel, the write-off bar below zero (S2 Route Room)
  // measure a chart's own width so it draws 1:1 and its labels keep their size on a phone
  function useWidth(initial) { const ref = useRef(null); const [w, setW] = useState(initial); useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(([e]) => { const v = Math.round(e.contentRect.width); if (v > 0) setW(v); }); ro.observe(el); return () => ro.disconnect(); }, []); return [ref, w]; }
  function ChannelBars({ rows, chosen = [], height }) {
    const [tip, setTip] = useState(null); const [box, cw] = useWidth(560);
    const ordered = CH_ORDER.map(id => rows.find(r => r.id === id)).filter(Boolean);
    const min = Math.min(0, ...ordered.map(r => r.net)), max = Math.max(1, ...ordered.map(r => r.net));
    const W = Math.max(280, cw), rowH = 40, padL = Math.min(130, Math.round(W * 0.3)), padR = 64, H = ordered.length * rowH + 12;
    const x = v => padL + ((v - min) / (max - min)) * (W - padL - padR);
    return <div className="chart" ref={box} onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height || H} role="img" aria-label="Net rupees per unit by channel">
        <line className="zero" x1={x(0)} x2={x(0)} y1="0" y2={H - 6} />
        {ordered.map((r, i) => { const y = 6 + i * rowH; const x0 = x(Math.min(0, r.net)), x1 = x(Math.max(0, r.net)); const pick = chosen.includes(r.id); const fill = !r.eligible ? "var(--fill-3)" : r.id === "writeoff" ? chColor("writeoff") : pick ? chColor(r.id) : `color-mix(in oklab, ${chColor(r.id)} 45%, var(--surface))`;
          return <g key={r.id} onMouseEnter={e => setTip({ r, y })} style={{ cursor: "default" }}>
            <rect x="0" y={y} width={W} height={rowH - 4} fill="transparent" />
            <text x={padL - 12} y={y + rowH / 2 + 1} textAnchor="end" style={{ fontSize: 13, fill: r.eligible ? "var(--fg)" : "var(--fg-3)", fontWeight: pick ? 650 : 500 }}>{r.short}</text>
            <rect x={x0} y={y + 7} width={Math.max(2, x1 - x0)} height={rowH - 18} rx="4" fill={fill} />
            <text x={x(0) + (r.net >= 0 ? x1 - x(0) + 8 : 8)} y={y + rowH / 2 + 1} textAnchor="start" style={{ fontSize: 12.5, fontWeight: 600, fill: r.net < 0 ? "var(--red-text)" : "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>{(r.net < 0 ? "−₹" : "₹") + Math.abs(r.net).toFixed(2)}</text>
          </g>; })}
      </svg>
      {tip && <div className="tip" style={{ left: Math.min(x(Math.max(0, tip.r.net)) / W * 100, 60) + "%", top: tip.y + 36 }}>
        <b>{tip.r.name}</b>
        <div className="tr"><span>Price</span><span>{tip.r.price ? "₹" + tip.r.price.toFixed(2) + " · " + tip.r.pricePctLabel + " of MRP" : "—"}</span></div>
        <div className="tr"><span>Net a unit</span><span>{(tip.r.net < 0 ? "−₹" : "₹") + Math.abs(tip.r.net).toFixed(2)}</span></div>
        <div className="tr"><span>Capacity</span><span>{tip.r.capacity === Infinity ? "unlimited" : tip.r.capacity.toLocaleString("en-IN")}</span></div>
        <div className="tr"><span>Clears in</span><span>{tip.r.clears}</span></div>
        <div className="tr"><span>GST credit</span><span>{tip.r.itc}{tip.r.indicative ? " · indicative" : ""}</span></div>
        {!tip.r.eligible && <div className="tr" style={{ color: "var(--red-text)" }}><span>Not eligible</span><span>{tip.r.reason}</span></div>}
      </div>}
    </div>;
  }
  // weekly recovered against would-be write-off: one axis, two series, crosshair tooltip
  function TrendChart({ weeks, height = 220 }) {
    const [hover, setHover] = useState(null); const ref = useRef(null); const [box, cw] = useWidth(640);
    const W = Math.max(300, cw), H = height, pl = 52, pr = 12, pt = 12, pb = 26;
    const max = Math.ceil(Math.max(...weeks.map(w => Math.max(w[1], w[2]))) / 10000) * 10000;
    const X = i => pl + (i / (weeks.length - 1)) * (W - pl - pr); const Y = v => pt + (1 - v / max) * (H - pt - pb);
    const line = k => weeks.map((w, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(w[k]).toFixed(1)).join(" ");
    const area = line(1) + ` L${X(weeks.length - 1)} ${Y(0)} L${X(0)} ${Y(0)} Z`;
    const ticks = [0, max / 2, max];
    const onMove = e => { const r = ref.current.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; const i = Math.round(((px - pl) / (W - pl - pr)) * (weeks.length - 1)); setHover(Math.max(0, Math.min(weeks.length - 1, i))); };
    return <div className="chart" ref={box} onMouseLeave={() => setHover(null)}>
      <div className="legend" style={{ marginBottom: 8 }}><span><i style={{ background: "var(--primary)" }} />Recovered</span><span><i style={{ background: "var(--red)" }} />Would-be write-off</span></div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" height={H} onMouseMove={onMove} role="img" aria-label="Weekly recovered against would-be write-off">
        <g className="grid">{ticks.map(t => <line key={t} x1={pl} x2={W - pr} y1={Y(t)} y2={Y(t)} />)}</g>
        <g className="axis">{ticks.map(t => <text key={t} x={pl - 8} y={Y(t) + 4} textAnchor="end">{t ? "₹" + Math.round(t / 1000) + "k" : "0"}</text>)}{weeks.map((w, i) => i % (W < 460 ? 3 : 2) === 0 && <text key={w[0]} x={X(i)} y={H - 6} textAnchor="middle">{w[0]}</text>)}</g>
        <path d={area} fill="var(--primary)" opacity="0.1" />
        <path d={line(2)} fill="none" stroke="var(--red)" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
        <path d={line(1)} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {hover != null && <g><line x1={X(hover)} x2={X(hover)} y1={pt} y2={H - pb} stroke="var(--line-2)" /><circle cx={X(hover)} cy={Y(weeks[hover][1])} r="5" fill="var(--primary)" stroke="var(--surface)" strokeWidth="2" /><circle cx={X(hover)} cy={Y(weeks[hover][2])} r="5" fill="var(--red)" stroke="var(--surface)" strokeWidth="2" /></g>}
      </svg>
      {hover != null && <div className="tip" style={{ left: `calc(${(X(hover) / W) * 100}% ${hover > weeks.length / 2 ? "- 170px" : "+ 12px"})`, top: 40 }}><b>{weeks[hover][0]}</b><div className="tr"><span>Recovered</span><span>{fmt.inr(weeks[hover][1])}</span></div><div className="tr"><span>Would-be write-off</span><span>{fmt.inr(-weeks[hover][2])}</span></div></div>}
    </div>;
  }
  // where the units went: one 100% bar with direct labels and a 2px surface gap between segments
  function MixBar({ mix, names }) {
    const total = mix.reduce((t, m) => t + m[1], 0); let acc = 0;
    const ordered = CH_ORDER.map(id => mix.find(m => m[0] === id)).filter(Boolean);
    return <div className="chart stack snug">
      <svg viewBox="0 0 600 28" width="100%" height="28" preserveAspectRatio="none" role="img" aria-label="Channel mix">{ordered.map(([id, v]) => { const w = (v / total) * 600; const x = acc; acc += w; return <rect key={id} x={x + 1} y="0" width={Math.max(0, w - 2)} height="28" rx="5" fill={chColor(id)}><title>{(names && names[id]) || id}: {Math.round((v / total) * 100)}%</title></rect>; })}</svg>
      <div className="legend">{ordered.map(([id, v]) => <span key={id}><i style={{ background: chColor(id) }} />{(names && names[id]) || id} <b className="tnum" style={{ color: "var(--fg)" }}>{Math.round((v / total) * 100)}%</b></span>)}</div>
    </div>;
  }

  /* ---------- JSON card ---------- */
  function CodeBlock({ code, className, label }) {
    const html = useMemo(() => code.replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/^(POST|GET|PUT|PATCH|DELETE|HTTP\/\d\.\d|\d{3})\b[^\n]*/gm, m => `<span class="m">${m}</span>`)
      .replace(/("[^"\n]*")(\s*:)/g, '<span class="k">$1</span>$2')
      .replace(/:\s*("[^"\n]*")/g, (m, s) => m.replace(s, `<span class="s">${s}</span>`))
      .replace(/(:\s*)(-?\d+(?:\.\d+)?)/g, '$1<span class="n">$2</span>'), [code]);
    const first = code.split("\n")[0].trim();
    return <pre className={cx("code", className)} tabIndex={0} role="region" aria-label={label || (/\w/.test(first) ? first : "Code")} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  /* ---------- device frames for the demo stage ---------- */
  function StatusBar({ time = "9:41", dark }) {
    return <div className={cx("statusbar", dark && "on-dark")} aria-hidden="true"><span>{time}</span><span className="sb-icons"><Icon name="signal" size={16} stroke={2.4} /><Icon name="wifi" size={16} stroke={2.4} /><Icon name="battery-full" size={20} stroke={1.8} /></span></div>;
  }
  function PhoneFrame({ children, time, scale = 1, style, dark }) {
    return <div className="device-phone" style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: "top left", ...style }}>
      <div className="screen">
        <AppRoot embedded style={{ "--safe-top": "50px", "--safe-bottom": "22px" }}>
          <StatusBar time={time} dark={dark} />
          {children}
          <div className={cx("homebar", dark && "on-dark")} aria-hidden="true" />
        </AppRoot>
        <div className="island" aria-hidden="true" />
      </div>
    </div>;
  }
  function WindowFrame({ title, children, style }) {
    return <div className="device-window" style={style}><div className="chrome"><span className="lights" aria-hidden="true"><i /><i /><i /></span><span className="wtitle">{title}</span></div><div style={{ position: "relative", minHeight: 0 }}>{children}</div></div>;
  }

  Object.assign(window.SC3, { Roll, Money, DaysNum, GateChips, Countdown, Tile, Aura, Tracker, VTracker, AgentFeed, ClusterMap, HaulLine, ChannelBars, TrendChart, MixBar, CodeBlock, StatusBar, PhoneFrame, WindowFrame, CH_ORDER });
})();

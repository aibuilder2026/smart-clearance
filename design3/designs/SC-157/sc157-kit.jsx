// SC-157's shared pieces: the dashboard's figures derived from the ledger (core/ledger.js, every figure a posted
// ledger's), the food-by-week chart (SC-149's form: kept out of landfill rises from one baseline, destroyed hangs
// under it, hatched), the tiles with their sparklines, the bars by distributor and by product, BRSR's row, and the
// flow picture (option C). Charts follow the dataviz method: one axis, thin marks, a legend for two series, a table view.
(function () {
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, D = window.SC3_DATA; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Segmented, Product, Roll, useApp } = K;
  const { useState, useMemo, useRef, useEffect } = React;
  const { motion, useReducedMotion } = window.Motion;
  const LG = () => window.SC3_LEDGER;
  const MS = 864e5;
  const r1 = x => Math.round(x * 10) / 10;
  const kg = v => (v >= 1000 ? (v / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " t" : Math.round(v).toLocaleString("en-IN") + " kg");
  const kgAxis = v => (v >= 1000 ? (v / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " t" : Math.round(v) + " kg");
  const short = t => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const CH = { kirana: "var(--ch-kirana)", expiresoon: "var(--ch-expiresoon)", staff: "var(--ch-staff)", d2c: "var(--ch-d2c)", foodbank: "var(--ch-foodbank)", writeoff: "var(--viz-gone)" };
  const NAMES = { kirana: "Kirana scheme", expiresoon: "ExpireSoon", staff: "Staff sale", d2c: "Discount D2C", foodbank: "Food bank", writeoff: "Destroyed" };
  const ORDER = ["kirana", "expiresoon", "staff", "d2c", "foodbank", "writeoff"];

  /* ---------- the period's figures, from the ledger's rows ---------- */
  function derive(book, pid) {
    const periods = book.periods; const p = periods.find(x => x.id === pid) || periods[periods.length - 1];
    const rows = book.batches.filter(r => r.cleared >= p.from && r.cleared <= p.to);
    const qs = periods.filter(x => x.kind === "quarter"); const qi = qs.findIndex(x => x.id === p.id);
    const prev = p.kind === "quarter" && qi > 0 ? qs[qi - 1] : null;
    const end = p.current ? book.today : p.to;
    // the weeks run from the period's start, or from the first batch the workspace cleared when that came later (the year
    // starts in April; the workspace since July)
    const firstEver = book.batches.length ? Date.parse(book.batches[0].cleared) : Date.parse(p.from);
    const d0 = Math.max(Date.parse(p.from), firstEver - ((firstEver - Date.parse(p.from)) % (7 * MS))), dEnd = Date.parse(end);
    const weeks = [];
    for (let t = d0; t <= dEnd; t += 7 * MS) weeks.push({ from: t, label: short(t), kept: 0, resold: 0, donated: 0, destroyed: 0, closed: 0, net: 0, meals: 0 });
    rows.forEach(r => { const i = Math.min(weeks.length - 1, Math.floor((Date.parse(r.cleared) - d0) / (7 * MS))); const w = weeks[i]; const F = r.figures; w.kept += F.kg; w.resold += F.resoldKg; w.donated += F.donatedKg; w.destroyed += F.destroyedKg; w.closed += 1; w.net += F.net; w.meals += F.meals; });
    const group = key => { const by = {}; rows.forEach(r => { const k = r[key]; by[k] = by[k] || { label: k, img: r.img, resold: 0, donated: 0, destroyed: 0, batches: 0 }; by[k].resold += r.figures.resoldKg; by[k].donated += r.figures.donatedKg; by[k].destroyed += r.figures.destroyedKg; by[k].batches += 1; }); return Object.values(by).map(x => Object.assign(x, { kept: x.resold + x.donated })).sort((a, b) => b.kept - a.kept); };
    const mix = {}; rows.forEach(r => { const per = (r.figures.kg + r.figures.destroyedKg) / (r.figures.units || 1); r.lines.forEach(l => (mix[l.id] = (mix[l.id] || 0) + l.units * per)); mix.writeoff = (mix.writeoff || 0) + r.figures.destroyedKg; });
    const mixKg = ORDER.filter(id => mix[id] > 0).map(id => [id, r1(mix[id])]);
    const t = p.totals, tPrev = prev ? prev.totals : null;
    const share = t.kg + t.destroyedKg ? Math.round((t.kg / (t.kg + t.destroyedKg)) * 1000) / 10 : null;
    return { p, prev, rows, weeks, byDist: group("distributorName"), bySku: group("name"), mixKg, t, tPrev, share, end };
  }
  const delta = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
  const periodOptions = book => book.periods.map(x => ({ id: x.id, label: x.label }));
  function useW(init) { const ref = useRef(null); const [w, setW] = useState(init); useEffect(() => { if (!ref.current || !window.ResizeObserver) return; const ro = new ResizeObserver(e => setW(e[0].contentRect.width)); ro.observe(ref.current); return () => ro.disconnect(); }, []); return [ref, w]; }

  /* ---------- the tiles ---------- */
  function Spark({ values, gone }) {
    const W = 92, H = 28, max = Math.max(1, ...values); const n = values.length;
    const X = i => (n > 1 ? (i / (n - 1)) * W : W / 2), Y = v => H - 2 - (v / max) * (H - 6);
    const line = values.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
    return <svg className={cx("im-spark", gone && "gone")} viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><path className="a" d={`${line} L${W} ${H} L0 ${H} Z`} /><path className="l" d={line} /></svg>;
  }
  function Tile({ icon, label, value, unit, foot, spark, gone, delta: dl, deltaGood }) {
    const cls = dl == null ? "" : dl === 0 ? "" : (dl > 0) === deltaGood ? "up" : "down";
    return <div className={cx("im-tile", gone && "gone")}>
      <span className="lbl"><Icon name={icon} size={15} />{label}</span>
      <span className="val">{value}{unit && <small>{unit}</small>}</span>
      <span className="foot"><span>{dl != null ? <><span className={cx("delta", cls)}>{dl > 0 ? "+" : ""}{dl}%</span> {foot}</> : foot}</span>{spark}</span>
    </div>;
  }
  const split = v => (v >= 1000 ? [(v / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 }), "t"] : [Math.round(v).toLocaleString("en-IN"), "kg"]);
  function Tiles({ d, compact }) {
    const { t, tPrev, weeks, share } = d; const vs = f => weeks.map(f);
    const [k, ku] = split(t.kg), [g, gu] = split(t.destroyedKg), [c, cu] = split(t.co2);
    const before = tPrev ? `vs ${d.prev.label}` : "first period";
    return <div className="im-tiles">
      <Tile icon="leaf" label="Kept out of landfill" value={k} unit={ku} delta={tPrev ? delta(t.kg, tPrev.kg) : null} deltaGood foot={before} spark={<Spark values={vs(w => w.kept)} />} />
      <Tile icon="trash-2" label="Destroyed" value={g} unit={gu} gone foot={share != null ? `${share}% of the food saved` : "nothing closed yet"} spark={<Spark values={vs(w => w.destroyed)} gone />} />
      <Tile icon="cloud" label="CO₂e avoided" value={c} unit={cu} delta={tPrev ? delta(t.co2, tPrev.co2) : null} deltaGood foot={`indicative, ${M.RULES.co2PerKg} kg a kg`} spark={<Spark values={vs(w => w.kept)} />} />
      {!compact && <Tile icon="utensils" label="Meals" value={fmt.num(t.meals)} delta={tPrev ? delta(t.meals, tPrev.meals) : null} deltaGood foot={`${kg(t.donatedKg)} donated · ${t.outcomes.donation} ${t.outcomes.donation === 1 ? "batch" : "batches"}`} spark={<Spark values={vs(w => w.meals)} />} />}
    </div>;
  }

  /* ---------- food by week ---------- */
  const nice = x => { const mag = Math.pow(10, Math.floor(Math.log10(x))); return mag * ([1, 2, 2.5, 5, 10].find(m => x / mag <= m) || 10); };
  function FoodWeeks({ weeks, height = 230, nowAt }) {
    const [hover, setHover] = useState(null); const [box, cw] = useW(640); const reduce = useReducedMotion();
    const W = Math.max(300, Math.round(cw)), H = height, pl = 52, pr = 8, pt = 12, pb = 26, n = weeks.length;
    const up = Math.max(0, ...weeks.map(w => w.kept)), down = Math.max(0, ...weeks.map(w => w.destroyed));
    const step = up || down ? nice(Math.max(up, down * 2) / 4) : 100;
    const top = Math.max(step * 2, step * Math.ceil(up / step)), bottom = Math.max(step, step * Math.ceil(down / step));
    const Y = x => pt + ((top - x) / (top + bottom)) * (H - pt - pb); const y0 = Y(0);
    const slot = (W - pl - pr) / n, bw = Math.max(3, Math.min(26, slot - 6)); const X = i => pl + slot * (i + 0.5);
    const ticks = []; for (let t = -bottom; t <= top + step / 2; t += step) ticks.push(Math.round(t));
    const every = Math.max(1, Math.ceil(64 / slot)); // a label every 64 px or so, whatever the width
    const bar = (x, y1, from) => { const h = Math.abs(y1 - from), r = Math.min(3, bw / 2, h), k = y1 < from ? 1 : -1; if (h < 0.5) return `M${x} ${from} h${bw} h${-bw} Z`; return `M${x} ${from} V${y1 + k * r} Q${x} ${y1} ${x + r} ${y1} H${x + bw - r} Q${x + bw} ${y1} ${x + bw} ${y1 + k * r} V${from} Z`; };
    const move = e => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(n - 1, Math.floor((px - pl) / slot)))); };
    const kept = weeks.reduce((t, w) => t + w.kept, 0), gone = weeks.reduce((t, w) => t + w.destroyed, 0);
    return <div className={cx("fw", reduce && "still")} ref={box} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} height={H} onMouseMove={move} role="img" aria-label={`Food a week: ${kg(kept)} kept out of landfill and ${kg(gone)} destroyed`}>
        <defs><pattern id="fw-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><rect width="5" height="5" className="hatch-bg" /><line x1="0" y1="0" x2="0" y2="5" className="hatch-ln" /></pattern></defs>
        {ticks.map(t => <line key={t} className={t ? "gl" : "base"} x1={pl} x2={W - pr} y1={Y(t)} y2={Y(t)} />)}
        {ticks.map(t => <text key={"t" + t} className="ax" x={pl - 8} y={Y(t) + 4} textAnchor="end">{t < 0 ? "−" + kgAxis(-t) : kgAxis(t)}</text>)}
        {weeks.map((w, i) => ((i % every === 0 && i < n - 1) || i === n - 1) && <text key={"x" + i} className="ax" x={X(i)} y={H - 6} textAnchor={i === n - 1 ? "end" : "middle"}>{i === n - 1 && nowAt ? "this week" : w.label}</text>)}
        {hover != null && <rect className="col" x={X(hover) - slot / 2} y={pt} width={slot} height={H - pt - pb} />}
        {weeks.map((w, i) => <g key={i}>
          <path className="kept" style={{ animationDelay: `${Math.min(6 * i, 300)}ms` }} d={bar(X(i) - bw / 2, Y(w.kept), y0)} />
          {w.destroyed > 0 && <path className="gone" style={{ animationDelay: `${Math.min(6 * i, 300) + 120}ms` }} d={bar(X(i) - bw / 2, Y(-w.destroyed) + 1, y0 + 1)} />}
        </g>)}
      </svg>
      {hover != null && (w => <div className="tip" style={{ left: hover > n / 2 ? `calc(${(X(hover) / W) * 100}% - 204px)` : `calc(${(X(hover) / W) * 100}% + 12px)`, top: 8 }}>
        <b>Week of {w.label}</b>
        <div className="tr"><span><i className="sw kept" aria-hidden="true" />Kept out of landfill</span><span>{kg(w.kept)}</span></div>
        <div className="tr"><span><i className="sw gone" aria-hidden="true" />Destroyed</span><span>{w.destroyed ? kg(w.destroyed) : "none"}</span></div>
        <div className="tr"><span>Batches cleared</span><span>{w.closed}</span></div>
        <div className="tr"><span>Recovered</span><span>{fmt.inr(w.net)}</span></div>
      </div>)(weeks[hover])}
    </div>;
  }
  function FoodTable({ weeks }) {
    return <table className="fw-table"><thead><tr><th>Week of</th><th>Kept out (kg)</th><th>Resold</th><th>Donated</th><th>Destroyed</th><th>Batches</th><th>Recovered</th></tr></thead>
      <tbody>{weeks.map((w, i) => <tr key={i}><td>{w.label}</td><td>{r1(w.kept)}</td><td>{r1(w.resold)}</td><td>{r1(w.donated)}</td><td>{r1(w.destroyed)}</td><td>{w.closed}</td><td>{fmt.inr(w.net)}</td></tr>)}</tbody></table>;
  }
  // the card: the two figures and the share, the legend, the chart or its table
  function FoodCard({ d, title = "Food, by week", height }) {
    const [table, setTable] = useState(false); const { t, share } = d;
    return <Card className="stack" style={{ gap: 14 }}>
      <div className="card-head"><span className="card-title">{title}</span><Button variant="ghost" size="sm" icon={table ? "bar-chart-3" : "table"} aria-pressed={table} onClick={() => setTable(v => !v)}>{table ? "Show as a chart" : "Show as a table"}</Button></div>
      <div className="fw-head"><span className="fig"><b>{kg(t.kg)}</b><span>kept out of landfill in {d.p.label}</span></span>{share != null && <span className="share">{share}% saved</span>}<span className="fig gone"><b>{kg(t.destroyedKg)}</b><span>destroyed</span></span></div>
      <ul className="fw-legend"><li><i className="sw kept" aria-hidden="true" />Kept out of landfill (sold or given)</li><li><i className="sw gone" aria-hidden="true" />Destroyed (no channel took it)</li></ul>
      {table ? <FoodTable weeks={d.weeks} /> : <FoodWeeks weeks={d.weeks} height={height} nowAt={d.p.current} />}
      <span className="im-note">{d.tPrev ? `${kg(d.tPrev.kg)} kept out and ${kg(d.tPrev.destroyedKg)} destroyed in ${d.prev.label}.` : `Every batch ${D.WORKSPACE.short} has cleared since ${D.WORKSPACE.since}; a week is counted when its batches clear.`} CO₂e, disposal and EPR are indicative.</span>
    </Card>;
  }

  /* ---------- where the kilos went, by distributor, by product ---------- */
  function MixCard({ d }) {
    const total = d.mixKg.reduce((t, m) => t + m[1], 0) || 1; let acc = 0;
    return <Card className="stack" style={{ gap: 12 }}>
      <div className="card-head"><span className="card-title">Where the kilos went</span><span className="t-caption subtle">{kg(total)} flagged at risk</span></div>
      <div className="chart stack snug">
        <svg viewBox="0 0 600 28" width="100%" height="28" preserveAspectRatio="none" role="img" aria-label="Where the kilos went, by channel">{d.mixKg.map(([id, v]) => { const w = (v / total) * 600, x = acc; acc += w; return <rect key={id} x={x + 1} y="0" width={Math.max(0, w - 2)} height="28" rx="5" fill={id === "writeoff" ? "url(#fw-hatch-mix)" : CH[id]} stroke={id === "writeoff" ? "var(--viz-gone)" : "none"}><title>{NAMES[id]}: {kg(v)}</title></rect>; })}
          <defs><pattern id="fw-hatch-mix" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--viz-gone-soft)" /><line x1="0" y1="0" x2="0" y2="5" stroke="var(--viz-gone)" strokeWidth="2.6" /></pattern></defs></svg>
      </div>
      <List>{d.mixKg.map(([id, v]) => <ListRow key={id} leading={<i className="sw" style={{ background: id === "writeoff" ? undefined : CH[id] }} {...(id === "writeoff" ? { className: "sw gone" } : {})} aria-hidden="true" />} title={NAMES[id]} sub={id === "writeoff" ? "expired at the godown; destroyed on your yes" : id === "foodbank" ? `${fmt.num(d.t.meals)} meals, on the food banks' receipts` : "sold under tax invoices and order logs"} value={<span className="tnum strong">{kg(v)} <span className="subtle t-caption">{Math.round((v / total) * 100)}%</span></span>} />)}</List>
    </Card>;
  }
  function HBars({ rows, product }) {
    const max = Math.max(1, ...rows.map(r => r.kept + r.destroyed));
    return <div className="hb">{rows.map(r => <div key={r.label} className="hb-row">
      <span className="lab">{product && <Product name={r.img} size={26} />}<span>{r.label}</span></span>
      <span className="bar" aria-hidden="true"><i className="k" style={{ width: (r.resold / max) * 100 + "%" }} />{r.donated > 0 && <i className="n" style={{ width: (r.donated / max) * 100 + "%" }} />}{r.destroyed > 0 && <i className="d" style={{ width: (r.destroyed / max) * 100 + "%" }} />}</span>
      <span className="v"><b>{kg(r.kept)}</b>{r.destroyed ? ` · ${kg(r.destroyed)} destroyed` : ""} · {r.batches} {r.batches === 1 ? "batch" : "batches"}</span>
    </div>)}</div>;
  }
  function ByCard({ d }) {
    const [by, setBy] = useState("dist");
    return <Card className="stack" style={{ gap: 12 }}>
      <div className="card-head"><span className="card-title">By {by === "dist" ? "distributor" : "product"}</span><Segmented size="sm" label="Group by" value={by} onChange={setBy} options={[{ id: "dist", label: "Distributor" }, { id: "sku", label: "Product" }]} /></div>
      <HBars rows={by === "dist" ? d.byDist : d.bySku} product={by === "sku"} />
      <ul className="fw-legend"><li><i className="sw kept" aria-hidden="true" />Resold</li><li><i className="sw donated" aria-hidden="true" />Donated</li><li><i className="sw gone" aria-hidden="true" />Destroyed</li></ul>
    </Card>;
  }
  function BrsrCard({ d, onExport }) {
    return <Card className="stack" style={{ gap: 12 }}>
      <div className="card-head"><span className="card-title">BRSR Principle 6 · waste</span><Button variant="secondary" size="sm" icon="download" onClick={onExport}>Export the table</Button></div>
      <div style={{ overflowX: "auto" }}><table className="brsr"><thead><tr><th>Category</th><th>Diverted, kg</th><th>Resold</th><th>Donated</th><th>Disposed</th><th style={{ textAlign: "left" }}>Evidence</th></tr></thead>
        <tbody>{d.p.brsr.map(r => <tr key={r.cat}><td>{r.cat}</td><td>{fmt.num(r.diverted)}</td><td>{fmt.num(r.resold)}</td><td>{fmt.num(r.donated)}</td><td>{fmt.num(r.disposed)}</td><td className="ev">{r.evidence}</td></tr>)}</tbody></table></div>
      <span className="im-note">The row the BRSR export carries for {d.p.label}, with the papers behind it: {d.t.invoices} tax invoices, {d.t.creditNotes} credit notes, {d.t.receipts} food-bank receipts.</span>
    </Card>;
  }

  /* ---------- the flow (option C): from the kilos flagged to where each went ---------- */
  function Flow({ d, height = 380 }) {
    const [box, cw] = useW(720); const W = Math.max(520, Math.round(cw)), H = height;
    const ch = d.mixKg.filter(([id]) => id !== "writeoff"); const gone = d.mixKg.find(([id]) => id === "writeoff"); const total = d.mixKg.reduce((t, m) => t + m[1], 0) || 1;
    const nodes = ch.concat(gone ? [gone] : []); const gap = 14, pt = 30, pb = 24, nw = 10, inner = H - pt - pb - gap * (nodes.length - 1);
    const xL = Math.round(W * 0.2), xM = Math.round(W * 0.52), xR = Math.round(W * 0.8);
    let y = pt; const mid = nodes.map(([id, v]) => { const h = Math.max(4, (v / total) * inner); const n = { id, v, y, h }; y += h + gap; return n; });
    const kept = ch.reduce((t, m) => t + m[1], 0), gh = gone ? gone[1] : 0; const totalH = mid.reduce((t, n) => t + n.h, 0);
    const sinks = [{ id: "kept", label: "Kept out of landfill", v: kept, y: pt, h: (kept / total) * totalH }].concat(gone ? [{ id: "gone", label: "Destroyed", v: gh, y: pt + (kept / total) * totalH + gap, h: (gh / total) * totalH }] : []);
    const src = { y: pt, h: totalH + (nodes.length > 1 ? 0 : 0) };
    // ribbons: from the source span to each channel, then each channel to its sink
    let sy = pt; const left = mid.map(n => { const r = { from: sy, h: n.h, to: n.y, id: n.id }; sy += n.h; return r; });
    const sinkY = { kept: sinks[0].y, gone: sinks[1] ? sinks[1].y : 0 };
    const right = mid.map(n => { const k = n.id === "writeoff" ? "gone" : "kept"; const r = { from: n.y, h: n.h, to: sinkY[k], id: n.id, k }; sinkY[k] += n.h; return r; });
    const rib = (x0, y0, x1, y1, h) => { const c = (x0 + x1) / 2; return `M${x0} ${y0} C${c} ${y0} ${c} ${y1} ${x1} ${y1} V${y1 + h} C${c} ${y1 + h} ${c} ${y0 + h} ${x0} ${y0 + h} Z`; };
    return <div className="flow" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} height={H} role="img" aria-label={`${kg(total)} flagged at risk: ${kg(kept)} kept out of landfill, ${kg(gh)} destroyed`}>
        <defs><pattern id="flow-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--viz-gone-soft)" /><line x1="0" y1="0" x2="0" y2="5" stroke="var(--viz-gone)" strokeWidth="2.6" /></pattern></defs>
        {left.map(r => <path key={"l" + r.id} className={cx("rib", r.id === "writeoff" && "gone")} d={rib(xL + nw, r.from, xM, r.to, r.h)} fill={r.id === "writeoff" ? "url(#flow-hatch)" : CH[r.id]}><title>{NAMES[r.id]} · {kg(mid.find(n => n.id === r.id).v)}</title></path>)}
        {right.map(r => <path key={"r" + r.id} className={cx("rib", r.id === "writeoff" && "gone")} d={rib(xM + nw, r.from, xR, r.to, r.h)} fill={r.id === "writeoff" ? "url(#flow-hatch)" : CH[r.id]}><title>{NAMES[r.id]} → {r.k === "gone" ? "Destroyed" : "Kept out of landfill"}</title></path>)}
        <rect className="node" x={xL} y={src.y} width={nw} height={src.h} fill="var(--fg-3)" />
        <text className="nl" x={xL - 10} y={src.y + 14} textAnchor="end">Flagged at risk</text><text className="nv" x={xL - 10} y={src.y + 31} textAnchor="end">{kg(total)} · {d.t.batches} batches</text>
        <text className="nk" x={xL - 10} y={src.y + 47} textAnchor="end">past the quick-commerce gates</text>
        {mid.map(n => <g key={n.id}><rect className="node" x={xM} y={n.y} width={nw} height={n.h} fill={n.id === "writeoff" ? "var(--viz-gone)" : CH[n.id]} />
          {n.h >= 14 ? <text className="nl" x={xM + nw + 8} y={n.y + Math.min(n.h / 2 + 4, 13)}>{NAMES[n.id]} <tspan className="nv">{kg(n.v)}</tspan></text> : <text className="nk" x={xM + nw + 8} y={n.y + n.h / 2 + 4}>{NAMES[n.id]} · {kg(n.v)}</text>}</g>)}
        {sinks.map(s => <g key={s.id}><rect className="node" x={xR} y={s.y} width={nw} height={Math.max(4, s.h)} fill={s.id === "gone" ? "var(--viz-gone)" : "var(--viz-kept)"} />
          <text className={cx("big", s.id === "gone" && "gone")} x={xR + nw + 10} y={s.y + 22}>{kg(s.v)}</text><text className="nl" x={xR + nw + 10} y={s.y + 40}>{s.label}</text>
          {s.id === "kept" && <text className="nk" x={xR + nw + 10} y={s.y + 56}>{kg(d.t.co2)} CO₂e avoided · {fmt.num(d.t.meals)} meals</text>}
          {s.id === "gone" && s.h > 30 && <text className="nk" x={xR + nw + 10} y={s.y + 56}>on your yes, at the godown</text>}</g>)}
      </svg>
    </div>;
  }
  function Ends({ d }) {
    const { t } = d;
    return <div className="flow-ends">
      <div className="flow-end"><b>{kg(t.kg)}</b><span>kept out of landfill{d.tPrev ? ` · ${delta(t.kg, d.tPrev.kg) > 0 ? "+" : ""}${delta(t.kg, d.tPrev.kg)}% vs ${d.prev.label}` : ""}</span></div>
      <div className="flow-end"><b>{kg(t.co2)}</b><span>CO₂e avoided, indicative</span></div>
      <div className="flow-end"><b>{fmt.num(t.meals)}</b><span>meals, from {kg(t.donatedKg)} donated</span></div>
      <div className="flow-end"><b style={{ color: "var(--viz-gone-text)" }}>{kg(t.destroyedKg)}</b><span>destroyed · {d.share != null ? `${d.share}% saved` : ""}</span></div>
    </div>;
  }

  const exportBrsr = d => S.download(`BRSR-P6-waste-${d.p.label.replace(/\s+/g, "-")}.csv`, S.csv([["Category", "Diverted (kg)", "Resold (kg)", "Donated (kg)", "Disposed (kg)", "Evidence"]].concat(d.p.brsr.map(r => [r.cat, r.diverted, r.resold, r.donated, r.disposed, r.evidence]))));
  window.SC157 = { derive, kg, delta, periodOptions, Tiles, Tile, Spark, FoodCard, FoodWeeks, FoodTable, MixCard, ByCard, HBars, BrsrCard, Flow, Ends, exportBrsr, NAMES, CH };
})();

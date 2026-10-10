(function() {
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, D = window.SC3_DATA;
  const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Segmented, Product, Roll, useApp } = K;
  const { useState, useMemo, useRef, useEffect } = React;
  const { motion, useReducedMotion } = window.Motion;
  const LG = () => window.SC3_LEDGER;
  const MS = 864e5;
  const r1 = (x) => Math.round(x * 10) / 10;
  const kg = (v) => v >= 1e3 ? (v / 1e3).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " t" : Math.round(v).toLocaleString("en-IN") + " kg";
  const kgAxis = (v) => v >= 1e3 ? (v / 1e3).toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " t" : Math.round(v) + " kg";
  const short = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const CH = { kirana: "var(--ch-kirana)", expiresoon: "var(--ch-expiresoon)", staff: "var(--ch-staff)", d2c: "var(--ch-d2c)", foodbank: "var(--ch-foodbank)", writeoff: "var(--viz-gone)" };
  const NAMES = { kirana: "Kirana scheme", expiresoon: "ExpireSoon", staff: "Staff sale", d2c: "Discount D2C", foodbank: "Food bank", writeoff: "Destroyed" };
  const ORDER = ["kirana", "expiresoon", "staff", "d2c", "foodbank", "writeoff"];
  function derive(book, pid) {
    const periods = book.periods;
    const p = periods.find((x) => x.id === pid) || periods[periods.length - 1];
    const rows = book.batches.filter((r) => r.cleared >= p.from && r.cleared <= p.to);
    const qs = periods.filter((x) => x.kind === "quarter");
    const qi = qs.findIndex((x) => x.id === p.id);
    const prev = p.kind === "quarter" && qi > 0 ? qs[qi - 1] : null;
    const end = p.current ? book.today : p.to;
    const firstEver = book.batches.length ? Date.parse(book.batches[0].cleared) : Date.parse(p.from);
    const d0 = Math.max(Date.parse(p.from), firstEver - (firstEver - Date.parse(p.from)) % (7 * MS)), dEnd = Date.parse(end);
    const weeks = [];
    for (let t2 = d0; t2 <= dEnd; t2 += 7 * MS) weeks.push({ from: t2, label: short(t2), kept: 0, resold: 0, donated: 0, destroyed: 0, closed: 0, net: 0, meals: 0 });
    rows.forEach((r) => {
      const i = Math.min(weeks.length - 1, Math.floor((Date.parse(r.cleared) - d0) / (7 * MS)));
      const w = weeks[i];
      const F = r.figures;
      w.kept += F.kg;
      w.resold += F.resoldKg;
      w.donated += F.donatedKg;
      w.destroyed += F.destroyedKg;
      w.closed += 1;
      w.net += F.net;
      w.meals += F.meals;
    });
    const group = (key) => {
      const by = {};
      rows.forEach((r) => {
        const k = r[key];
        by[k] = by[k] || { label: k, img: r.img, resold: 0, donated: 0, destroyed: 0, batches: 0 };
        by[k].resold += r.figures.resoldKg;
        by[k].donated += r.figures.donatedKg;
        by[k].destroyed += r.figures.destroyedKg;
        by[k].batches += 1;
      });
      return Object.values(by).map((x) => Object.assign(x, { kept: x.resold + x.donated })).sort((a, b) => b.kept - a.kept);
    };
    const mix = {};
    rows.forEach((r) => {
      const per = (r.figures.kg + r.figures.destroyedKg) / (r.figures.units || 1);
      r.lines.forEach((l) => mix[l.id] = (mix[l.id] || 0) + l.units * per);
      mix.writeoff = (mix.writeoff || 0) + r.figures.destroyedKg;
    });
    const mixKg = ORDER.filter((id) => mix[id] > 0).map((id) => [id, r1(mix[id])]);
    const t = p.totals, tPrev = prev ? prev.totals : null;
    const share = t.kg + t.destroyedKg ? Math.round(t.kg / (t.kg + t.destroyedKg) * 1e3) / 10 : null;
    return { p, prev, rows, weeks, byDist: group("distributorName"), bySku: group("name"), mixKg, t, tPrev, share, end };
  }
  const delta = (a, b) => b ? Math.round((a - b) / b * 100) : null;
  const periodOptions = (book) => book.periods.map((x) => ({ id: x.id, label: x.label }));
  function useW(init) {
    const ref = useRef(null);
    const [w, setW] = useState(init);
    useEffect(() => {
      if (!ref.current || !window.ResizeObserver) return;
      const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
      ro.observe(ref.current);
      return () => ro.disconnect();
    }, []);
    return [ref, w];
  }
  function Spark({ values, gone }) {
    const W = 92, H = 28, max = Math.max(1, ...values);
    const n = values.length;
    const X = (i) => n > 1 ? i / (n - 1) * W : W / 2, Y = (v) => H - 2 - v / max * (H - 6);
    const line = values.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
    return /* @__PURE__ */ React.createElement("svg", { className: cx("im-spark", gone && "gone"), viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { className: "a", d: `${line} L${W} ${H} L0 ${H} Z` }), /* @__PURE__ */ React.createElement("path", { className: "l", d: line }));
  }
  function Tile({ icon, label, value, unit, foot, spark, gone, delta: dl, deltaGood }) {
    const cls = dl == null ? "" : dl === 0 ? "" : dl > 0 === deltaGood ? "up" : "down";
    return /* @__PURE__ */ React.createElement("div", { className: cx("im-tile", gone && "gone") }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 15 }), label), /* @__PURE__ */ React.createElement("span", { className: "val" }, value, unit && /* @__PURE__ */ React.createElement("small", null, unit)), /* @__PURE__ */ React.createElement("span", { className: "foot" }, /* @__PURE__ */ React.createElement("span", null, dl != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: cx("delta", cls) }, dl > 0 ? "+" : "", dl, "%"), " ", foot) : foot), spark));
  }
  const split = (v) => v >= 1e3 ? [(v / 1e3).toLocaleString("en-IN", { maximumFractionDigits: 2 }), "t"] : [Math.round(v).toLocaleString("en-IN"), "kg"];
  function Tiles({ d, compact }) {
    const { t, tPrev, weeks, share } = d;
    const vs = (f) => weeks.map(f);
    const [k, ku] = split(t.kg), [g, gu] = split(t.destroyedKg), [c, cu] = split(t.co2);
    const before = tPrev ? `vs ${d.prev.label}` : "first period";
    return /* @__PURE__ */ React.createElement("div", { className: "im-tiles" }, /* @__PURE__ */ React.createElement(Tile, { icon: "leaf", label: "Kept out of landfill", value: k, unit: ku, delta: tPrev ? delta(t.kg, tPrev.kg) : null, deltaGood: true, foot: before, spark: /* @__PURE__ */ React.createElement(Spark, { values: vs((w) => w.kept) }) }), /* @__PURE__ */ React.createElement(Tile, { icon: "trash-2", label: "Destroyed", value: g, unit: gu, gone: true, foot: share != null ? `${share}% of the food saved` : "nothing closed yet", spark: /* @__PURE__ */ React.createElement(Spark, { values: vs((w) => w.destroyed), gone: true }) }), /* @__PURE__ */ React.createElement(Tile, { icon: "cloud", label: "CO₂e avoided", value: c, unit: cu, delta: tPrev ? delta(t.co2, tPrev.co2) : null, deltaGood: true, foot: `indicative, ${M.RULES.co2PerKg} kg a kg`, spark: /* @__PURE__ */ React.createElement(Spark, { values: vs((w) => w.kept) }) }), !compact && /* @__PURE__ */ React.createElement(Tile, { icon: "utensils", label: "Meals", value: fmt.num(t.meals), delta: tPrev ? delta(t.meals, tPrev.meals) : null, deltaGood: true, foot: `${kg(t.donatedKg)} donated · ${t.outcomes.donation} ${t.outcomes.donation === 1 ? "batch" : "batches"}`, spark: /* @__PURE__ */ React.createElement(Spark, { values: vs((w) => w.meals) }) }));
  }
  const nice = (x) => {
    const mag = Math.pow(10, Math.floor(Math.log10(x)));
    return mag * ([1, 2, 2.5, 5, 10].find((m) => x / mag <= m) || 10);
  };
  function FoodWeeks({ weeks, height = 230, nowAt }) {
    const [hover, setHover] = useState(null);
    const [box, cw] = useW(640);
    const reduce = useReducedMotion();
    const W = Math.max(300, Math.round(cw)), H = height, pl = 52, pr = 8, pt = 12, pb = 26, n = weeks.length;
    const up = Math.max(0, ...weeks.map((w) => w.kept)), down = Math.max(0, ...weeks.map((w) => w.destroyed));
    const step = up || down ? nice(Math.max(up, down * 2) / 4) : 100;
    const top = Math.max(step * 2, step * Math.ceil(up / step)), bottom = Math.max(step, step * Math.ceil(down / step));
    const Y = (x) => pt + (top - x) / (top + bottom) * (H - pt - pb);
    const y0 = Y(0);
    const slot = (W - pl - pr) / n, bw = Math.max(3, Math.min(26, slot - 6));
    const X = (i) => pl + slot * (i + 0.5);
    const ticks = [];
    for (let t = -bottom; t <= top + step / 2; t += step) ticks.push(Math.round(t));
    const every = Math.max(1, Math.ceil(64 / slot));
    const bar = (x, y1, from) => {
      const h = Math.abs(y1 - from), r = Math.min(3, bw / 2, h), k = y1 < from ? 1 : -1;
      if (h < 0.5) return `M${x} ${from} h${bw} h${-bw} Z`;
      return `M${x} ${from} V${y1 + k * r} Q${x} ${y1} ${x + r} ${y1} H${x + bw - r} Q${x + bw} ${y1} ${x + bw} ${y1 + k * r} V${from} Z`;
    };
    const move = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * W;
      setHover(Math.max(0, Math.min(n - 1, Math.floor((px - pl) / slot))));
    };
    const kept = weeks.reduce((t, w) => t + w.kept, 0), gone = weeks.reduce((t, w) => t + w.destroyed, 0);
    return /* @__PURE__ */ React.createElement("div", { className: cx("fw", reduce && "still"), ref: box, onMouseLeave: () => setHover(null) }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, height: H, onMouseMove: move, role: "img", "aria-label": `Food a week: ${kg(kept)} kept out of landfill and ${kg(gone)} destroyed` }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: "fw-hatch", patternUnits: "userSpaceOnUse", width: "5", height: "5", patternTransform: "rotate(45)" }, /* @__PURE__ */ React.createElement("rect", { width: "5", height: "5", className: "hatch-bg" }), /* @__PURE__ */ React.createElement("line", { x1: "0", y1: "0", x2: "0", y2: "5", className: "hatch-ln" }))), ticks.map((t) => /* @__PURE__ */ React.createElement("line", { key: t, className: t ? "gl" : "base", x1: pl, x2: W - pr, y1: Y(t), y2: Y(t) })), ticks.map((t) => /* @__PURE__ */ React.createElement("text", { key: "t" + t, className: "ax", x: pl - 8, y: Y(t) + 4, textAnchor: "end" }, t < 0 ? "−" + kgAxis(-t) : kgAxis(t))), weeks.map((w, i) => (i % every === 0 && i < n - 1 || i === n - 1) && /* @__PURE__ */ React.createElement("text", { key: "x" + i, className: "ax", x: X(i), y: H - 6, textAnchor: i === n - 1 ? "end" : "middle" }, i === n - 1 && nowAt ? "this week" : w.label)), hover != null && /* @__PURE__ */ React.createElement("rect", { className: "col", x: X(hover) - slot / 2, y: pt, width: slot, height: H - pt - pb }), weeks.map((w, i) => /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("path", { className: "kept", style: { animationDelay: `${Math.min(6 * i, 300)}ms` }, d: bar(X(i) - bw / 2, Y(w.kept), y0) }), w.destroyed > 0 && /* @__PURE__ */ React.createElement("path", { className: "gone", style: { animationDelay: `${Math.min(6 * i, 300) + 120}ms` }, d: bar(X(i) - bw / 2, Y(-w.destroyed) + 1, y0 + 1) })))), hover != null && ((w) => /* @__PURE__ */ React.createElement("div", { className: "tip", style: { left: hover > n / 2 ? `calc(${X(hover) / W * 100}% - 204px)` : `calc(${X(hover) / W * 100}% + 12px)`, top: 8 } }, /* @__PURE__ */ React.createElement("b", null, "Week of ", w.label), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "sw kept", "aria-hidden": "true" }), "Kept out of landfill"), /* @__PURE__ */ React.createElement("span", null, kg(w.kept))), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "sw gone", "aria-hidden": "true" }), "Destroyed"), /* @__PURE__ */ React.createElement("span", null, w.destroyed ? kg(w.destroyed) : "none")), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Batches cleared"), /* @__PURE__ */ React.createElement("span", null, w.closed)), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Recovered"), /* @__PURE__ */ React.createElement("span", null, fmt.inr(w.net)))))(weeks[hover]));
  }
  function FoodTable({ weeks }) {
    return /* @__PURE__ */ React.createElement("table", { className: "fw-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Week of"), /* @__PURE__ */ React.createElement("th", null, "Kept out (kg)"), /* @__PURE__ */ React.createElement("th", null, "Resold"), /* @__PURE__ */ React.createElement("th", null, "Donated"), /* @__PURE__ */ React.createElement("th", null, "Destroyed"), /* @__PURE__ */ React.createElement("th", null, "Batches"), /* @__PURE__ */ React.createElement("th", null, "Recovered"))), /* @__PURE__ */ React.createElement("tbody", null, weeks.map((w, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", null, w.label), /* @__PURE__ */ React.createElement("td", null, r1(w.kept)), /* @__PURE__ */ React.createElement("td", null, r1(w.resold)), /* @__PURE__ */ React.createElement("td", null, r1(w.donated)), /* @__PURE__ */ React.createElement("td", null, r1(w.destroyed)), /* @__PURE__ */ React.createElement("td", null, w.closed), /* @__PURE__ */ React.createElement("td", null, fmt.inr(w.net))))));
  }
  function FoodCard({ d, title = "Food, by week", height }) {
    const [table, setTable] = useState(false);
    const { t, share } = d;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, title), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", icon: table ? "bar-chart-3" : "table", "aria-pressed": table, onClick: () => setTable((v) => !v) }, table ? "Show as a chart" : "Show as a table")), /* @__PURE__ */ React.createElement("div", { className: "fw-head" }, /* @__PURE__ */ React.createElement("span", { className: "fig" }, /* @__PURE__ */ React.createElement("b", null, kg(t.kg)), /* @__PURE__ */ React.createElement("span", null, "kept out of landfill in ", d.p.label)), share != null && /* @__PURE__ */ React.createElement("span", { className: "share" }, share, "% saved"), /* @__PURE__ */ React.createElement("span", { className: "fig gone" }, /* @__PURE__ */ React.createElement("b", null, kg(t.destroyedKg)), /* @__PURE__ */ React.createElement("span", null, "destroyed"))), /* @__PURE__ */ React.createElement("ul", { className: "fw-legend" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "sw kept", "aria-hidden": "true" }), "Kept out of landfill (sold or given)"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "sw gone", "aria-hidden": "true" }), "Destroyed (no channel took it)")), table ? /* @__PURE__ */ React.createElement(FoodTable, { weeks: d.weeks }) : /* @__PURE__ */ React.createElement(FoodWeeks, { weeks: d.weeks, height, nowAt: d.p.current }), /* @__PURE__ */ React.createElement("span", { className: "im-note" }, d.tPrev ? `${kg(d.tPrev.kg)} kept out and ${kg(d.tPrev.destroyedKg)} destroyed in ${d.prev.label}.` : `Every batch ${D.WORKSPACE.short} has cleared since ${D.WORKSPACE.since}; a week is counted when its batches clear.`, " CO₂e, disposal and EPR are indicative."));
  }
  function MixCard({ d }) {
    const total = d.mixKg.reduce((t, m) => t + m[1], 0) || 1;
    let acc = 0;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Where the kilos went"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, kg(total), " flagged at risk")), /* @__PURE__ */ React.createElement("div", { className: "chart stack snug" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 600 28", width: "100%", height: "28", preserveAspectRatio: "none", role: "img", "aria-label": "Where the kilos went, by channel" }, d.mixKg.map(([id, v]) => {
      const w = v / total * 600, x = acc;
      acc += w;
      return /* @__PURE__ */ React.createElement("rect", { key: id, x: x + 1, y: "0", width: Math.max(0, w - 2), height: "28", rx: "5", fill: id === "writeoff" ? "url(#fw-hatch-mix)" : CH[id], stroke: id === "writeoff" ? "var(--viz-gone)" : "none" }, /* @__PURE__ */ React.createElement("title", null, NAMES[id], ": ", kg(v)));
    }), /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: "fw-hatch-mix", patternUnits: "userSpaceOnUse", width: "5", height: "5", patternTransform: "rotate(45)" }, /* @__PURE__ */ React.createElement("rect", { width: "5", height: "5", fill: "var(--viz-gone-soft)" }), /* @__PURE__ */ React.createElement("line", { x1: "0", y1: "0", x2: "0", y2: "5", stroke: "var(--viz-gone)", strokeWidth: "2.6" }))))), /* @__PURE__ */ React.createElement(List, null, d.mixKg.map(([id, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: id, leading: /* @__PURE__ */ React.createElement("i", { className: "sw", style: { background: id === "writeoff" ? void 0 : CH[id] }, ...id === "writeoff" ? { className: "sw gone" } : {}, "aria-hidden": "true" }), title: NAMES[id], sub: id === "writeoff" ? "expired at the godown; destroyed on your yes" : id === "foodbank" ? `${fmt.num(d.t.meals)} meals, on the food banks' receipts` : "sold under tax invoices and order logs", value: /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, kg(v), " ", /* @__PURE__ */ React.createElement("span", { className: "subtle t-caption" }, Math.round(v / total * 100), "%")) }))));
  }
  function HBars({ rows, product }) {
    const max = Math.max(1, ...rows.map((r) => r.kept + r.destroyed));
    return /* @__PURE__ */ React.createElement("div", { className: "hb" }, rows.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.label, className: "hb-row" }, /* @__PURE__ */ React.createElement("span", { className: "lab" }, product && /* @__PURE__ */ React.createElement(Product, { name: r.img, size: 26 }), /* @__PURE__ */ React.createElement("span", null, r.label)), /* @__PURE__ */ React.createElement("span", { className: "bar", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", { className: "k", style: { width: r.resold / max * 100 + "%" } }), r.donated > 0 && /* @__PURE__ */ React.createElement("i", { className: "n", style: { width: r.donated / max * 100 + "%" } }), r.destroyed > 0 && /* @__PURE__ */ React.createElement("i", { className: "d", style: { width: r.destroyed / max * 100 + "%" } })), /* @__PURE__ */ React.createElement("span", { className: "v" }, /* @__PURE__ */ React.createElement("b", null, kg(r.kept)), r.destroyed ? ` · ${kg(r.destroyed)} destroyed` : "", " · ", r.batches, " ", r.batches === 1 ? "batch" : "batches"))));
  }
  function ByCard({ d }) {
    const [by, setBy] = useState("dist");
    return /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "By ", by === "dist" ? "distributor" : "product"), /* @__PURE__ */ React.createElement(Segmented, { size: "sm", label: "Group by", value: by, onChange: setBy, options: [{ id: "dist", label: "Distributor" }, { id: "sku", label: "Product" }] })), /* @__PURE__ */ React.createElement(HBars, { rows: by === "dist" ? d.byDist : d.bySku, product: by === "sku" }), /* @__PURE__ */ React.createElement("ul", { className: "fw-legend" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "sw kept", "aria-hidden": "true" }), "Resold"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "sw donated", "aria-hidden": "true" }), "Donated"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "sw gone", "aria-hidden": "true" }), "Destroyed")));
  }
  function BrsrCard({ d, onExport }) {
    return /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "BRSR Principle 6 · waste"), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "download", onClick: onExport }, "Export the table")), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { className: "brsr" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Category"), /* @__PURE__ */ React.createElement("th", null, "Diverted, kg"), /* @__PURE__ */ React.createElement("th", null, "Resold"), /* @__PURE__ */ React.createElement("th", null, "Donated"), /* @__PURE__ */ React.createElement("th", null, "Disposed"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "left" } }, "Evidence"))), /* @__PURE__ */ React.createElement("tbody", null, d.p.brsr.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.cat }, /* @__PURE__ */ React.createElement("td", null, r.cat), /* @__PURE__ */ React.createElement("td", null, fmt.num(r.diverted)), /* @__PURE__ */ React.createElement("td", null, fmt.num(r.resold)), /* @__PURE__ */ React.createElement("td", null, fmt.num(r.donated)), /* @__PURE__ */ React.createElement("td", null, fmt.num(r.disposed)), /* @__PURE__ */ React.createElement("td", { className: "ev" }, r.evidence)))))), /* @__PURE__ */ React.createElement("span", { className: "im-note" }, "The row the BRSR export carries for ", d.p.label, ", with the papers behind it: ", d.t.invoices, " tax invoices, ", d.t.creditNotes, " credit notes, ", d.t.receipts, " food-bank receipts."));
  }
  function Flow({ d, height = 380 }) {
    const [box, cw] = useW(720);
    const W = Math.max(520, Math.round(cw)), H = height;
    const ch = d.mixKg.filter(([id]) => id !== "writeoff");
    const gone = d.mixKg.find(([id]) => id === "writeoff");
    const total = d.mixKg.reduce((t, m) => t + m[1], 0) || 1;
    const nodes = ch.concat(gone ? [gone] : []);
    const gap = 14, pt = 30, pb = 24, nw = 10, inner = H - pt - pb - gap * (nodes.length - 1);
    const xL = Math.round(W * 0.2), xM = Math.round(W * 0.52), xR = Math.round(W * 0.8);
    let y = pt;
    const mid = nodes.map(([id, v]) => {
      const h = Math.max(4, v / total * inner);
      const n = { id, v, y, h };
      y += h + gap;
      return n;
    });
    const kept = ch.reduce((t, m) => t + m[1], 0), gh = gone ? gone[1] : 0;
    const totalH = mid.reduce((t, n) => t + n.h, 0);
    const sinks = [{ id: "kept", label: "Kept out of landfill", v: kept, y: pt, h: kept / total * totalH }].concat(gone ? [{ id: "gone", label: "Destroyed", v: gh, y: pt + kept / total * totalH + gap, h: gh / total * totalH }] : []);
    const src = { y: pt, h: totalH + (nodes.length > 1 ? 0 : 0) };
    let sy = pt;
    const left = mid.map((n) => {
      const r = { from: sy, h: n.h, to: n.y, id: n.id };
      sy += n.h;
      return r;
    });
    const sinkY = { kept: sinks[0].y, gone: sinks[1] ? sinks[1].y : 0 };
    const right = mid.map((n) => {
      const k = n.id === "writeoff" ? "gone" : "kept";
      const r = { from: n.y, h: n.h, to: sinkY[k], id: n.id, k };
      sinkY[k] += n.h;
      return r;
    });
    const rib = (x0, y0, x1, y1, h) => {
      const c = (x0 + x1) / 2;
      return `M${x0} ${y0} C${c} ${y0} ${c} ${y1} ${x1} ${y1} V${y1 + h} C${c} ${y1 + h} ${c} ${y0 + h} ${x0} ${y0 + h} Z`;
    };
    return /* @__PURE__ */ React.createElement("div", { className: "flow", ref: box }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, height: H, role: "img", "aria-label": `${kg(total)} flagged at risk: ${kg(kept)} kept out of landfill, ${kg(gh)} destroyed` }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: "flow-hatch", patternUnits: "userSpaceOnUse", width: "5", height: "5", patternTransform: "rotate(45)" }, /* @__PURE__ */ React.createElement("rect", { width: "5", height: "5", fill: "var(--viz-gone-soft)" }), /* @__PURE__ */ React.createElement("line", { x1: "0", y1: "0", x2: "0", y2: "5", stroke: "var(--viz-gone)", strokeWidth: "2.6" }))), left.map((r) => /* @__PURE__ */ React.createElement("path", { key: "l" + r.id, className: cx("rib", r.id === "writeoff" && "gone"), d: rib(xL + nw, r.from, xM, r.to, r.h), fill: r.id === "writeoff" ? "url(#flow-hatch)" : CH[r.id] }, /* @__PURE__ */ React.createElement("title", null, NAMES[r.id], " · ", kg(mid.find((n) => n.id === r.id).v)))), right.map((r) => /* @__PURE__ */ React.createElement("path", { key: "r" + r.id, className: cx("rib", r.id === "writeoff" && "gone"), d: rib(xM + nw, r.from, xR, r.to, r.h), fill: r.id === "writeoff" ? "url(#flow-hatch)" : CH[r.id] }, /* @__PURE__ */ React.createElement("title", null, NAMES[r.id], " → ", r.k === "gone" ? "Destroyed" : "Kept out of landfill"))), /* @__PURE__ */ React.createElement("rect", { className: "node", x: xL, y: src.y, width: nw, height: src.h, fill: "var(--fg-3)" }), /* @__PURE__ */ React.createElement("text", { className: "nl", x: xL - 10, y: src.y + 14, textAnchor: "end" }, "Flagged at risk"), /* @__PURE__ */ React.createElement("text", { className: "nv", x: xL - 10, y: src.y + 31, textAnchor: "end" }, kg(total), " · ", d.t.batches, " batches"), /* @__PURE__ */ React.createElement("text", { className: "nk", x: xL - 10, y: src.y + 47, textAnchor: "end" }, "past the quick-commerce gates"), mid.map((n) => /* @__PURE__ */ React.createElement("g", { key: n.id }, /* @__PURE__ */ React.createElement("rect", { className: "node", x: xM, y: n.y, width: nw, height: n.h, fill: n.id === "writeoff" ? "var(--viz-gone)" : CH[n.id] }), n.h >= 14 ? /* @__PURE__ */ React.createElement("text", { className: "nl", x: xM + nw + 8, y: n.y + Math.min(n.h / 2 + 4, 13) }, NAMES[n.id], " ", /* @__PURE__ */ React.createElement("tspan", { className: "nv" }, kg(n.v))) : /* @__PURE__ */ React.createElement("text", { className: "nk", x: xM + nw + 8, y: n.y + n.h / 2 + 4 }, NAMES[n.id], " · ", kg(n.v)))), sinks.map((s) => /* @__PURE__ */ React.createElement("g", { key: s.id }, /* @__PURE__ */ React.createElement("rect", { className: "node", x: xR, y: s.y, width: nw, height: Math.max(4, s.h), fill: s.id === "gone" ? "var(--viz-gone)" : "var(--viz-kept)" }), /* @__PURE__ */ React.createElement("text", { className: cx("big", s.id === "gone" && "gone"), x: xR + nw + 10, y: s.y + 22 }, kg(s.v)), /* @__PURE__ */ React.createElement("text", { className: "nl", x: xR + nw + 10, y: s.y + 40 }, s.label), s.id === "kept" && /* @__PURE__ */ React.createElement("text", { className: "nk", x: xR + nw + 10, y: s.y + 56 }, kg(d.t.co2), " CO₂e avoided · ", fmt.num(d.t.meals), " meals"), s.id === "gone" && s.h > 30 && /* @__PURE__ */ React.createElement("text", { className: "nk", x: xR + nw + 10, y: s.y + 56 }, "on your yes, at the godown")))));
  }
  function Ends({ d }) {
    const { t } = d;
    return /* @__PURE__ */ React.createElement("div", { className: "flow-ends" }, /* @__PURE__ */ React.createElement("div", { className: "flow-end" }, /* @__PURE__ */ React.createElement("b", null, kg(t.kg)), /* @__PURE__ */ React.createElement("span", null, "kept out of landfill", d.tPrev ? ` · ${delta(t.kg, d.tPrev.kg) > 0 ? "+" : ""}${delta(t.kg, d.tPrev.kg)}% vs ${d.prev.label}` : "")), /* @__PURE__ */ React.createElement("div", { className: "flow-end" }, /* @__PURE__ */ React.createElement("b", null, kg(t.co2)), /* @__PURE__ */ React.createElement("span", null, "CO₂e avoided, indicative")), /* @__PURE__ */ React.createElement("div", { className: "flow-end" }, /* @__PURE__ */ React.createElement("b", null, fmt.num(t.meals)), /* @__PURE__ */ React.createElement("span", null, "meals, from ", kg(t.donatedKg), " donated")), /* @__PURE__ */ React.createElement("div", { className: "flow-end" }, /* @__PURE__ */ React.createElement("b", { style: { color: "var(--viz-gone-text)" } }, kg(t.destroyedKg)), /* @__PURE__ */ React.createElement("span", null, "destroyed · ", d.share != null ? `${d.share}% saved` : "")));
  }
  const exportBrsr = (d) => S.download(`BRSR-P6-waste-${d.p.label.replace(/\s+/g, "-")}.csv`, S.csv([["Category", "Diverted (kg)", "Resold (kg)", "Donated (kg)", "Disposed (kg)", "Evidence"]].concat(d.p.brsr.map((r) => [r.cat, r.diverted, r.resold, r.donated, r.disposed, r.evidence]))));
  window.SC157 = { derive, kg, delta, periodOptions, Tiles, Tile, Spark, FoodCard, FoodWeeks, FoodTable, MixCard, ByCard, HBars, BrsrCard, Flow, Ends, exportBrsr, NAMES, CH };
})();

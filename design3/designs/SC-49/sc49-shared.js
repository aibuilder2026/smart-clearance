(function() {
  const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;
  const { useReducedMotion } = Motion;
  const Q = new URLSearchParams(location.search);
  const LATENCY = Number(Q.get("latency") || 700);
  const FILL = Math.min(LATENCY, 1200);
  const EASE = [0.22, 1, 0.36, 1];
  const T = { press: 0.16, base: 0.24, state: 0.42, roll: 0.7 };
  let screenAt = 0;
  function useLoad(k, kind) {
    const [ready, setReady] = useState(() => kind === "tab" && Date.now() - screenAt < 200);
    const last = useRef(ready ? k : null);
    useEffect(() => {
      if (last.current === k) return;
      last.current = k;
      setReady(false);
      const t = setTimeout(() => {
        if (kind === "screen") screenAt = Date.now();
        setReady(true);
      }, LATENCY);
      return () => clearTimeout(t);
    }, [k]);
    return ready;
  }
  const SHAPES = {
    dashboard: [["bar", 28, 1, 0.38], ["tile", 132, 4], ["card", 300, 2, [1.7, 1]], ["bar", 40, 1, 0.3], ["row", 58, 1], ["row", 58, 1], ["row", 58, 1], ["row", 58, 1]],
    table: [["bar", 40, 1, 0.4], ["row", 56, 1], ["row", 56, 1], ["row", 56, 1], ["row", 56, 1], ["row", 56, 1], ["row", 56, 1]],
    list: [["bar", 32, 1, 0.3], ["row", 60, 1], ["row", 60, 1], ["row", 60, 1], ["row", 60, 1], ["row", 60, 1]],
    cards: [["bar", 32, 1, 0.3], ["card", 170, 3], ["card", 170, 3]],
    pipeline: [["card", 520, 2, [1.6, 1]]],
    client: [["head", 92, 1], ["bar", 44, 1, 0.62], ["card", 460, 2, [1.6, 1]]],
    form: [["bar", 32, 1, 0.3], ["field", 64, 2], ["field", 64, 2], ["field", 64, 1], ["card", 140, 1]]
  };
  function blocks(shape, phone) {
    const out = [];
    let i = 0;
    (SHAPES[shape] || SHAPES.list).forEach(([kind, h, cols, frac], row) => {
      const n = phone ? Math.min(cols, kind === "tile" ? 2 : 1) : cols;
      const widths = Array.isArray(frac) && !phone ? frac : null;
      out.push({ row, kind, h: phone && kind === "card" ? Math.min(h, 220) : h, cols: n, widths, width: typeof frac === "number" ? frac : null, items: Array.from({ length: n }, () => i++) });
    });
    return out;
  }
  function useMoves(batches) {
    const prev = useRef(null);
    const [moves, setMoves] = useState([]);
    useEffect(() => {
      const now = {};
      batches.forEach((b) => {
        now[b.client + "/" + b.ref] = b.closedAt ? 9 : b.current;
      });
      if (prev.current) {
        const m = [];
        Object.keys(now).forEach((k) => {
          const was = prev.current[k];
          if (was != null && was !== now[k]) m.push({ key: k, ref: k.split("/")[1], client: k.split("/")[0], from: was, to: now[k], at: Date.now() });
        });
        if (m.length) setMoves(m);
      }
      prev.current = now;
    }, [batches]);
    return moves;
  }
  function chartGeometry(byDay, w, H) {
    const pl = 46, pr = 8, pt = 10, pb = 24, n = byDay.length;
    const peak = Math.max(0, ...byDay.map((d) => d.recovered));
    let top = 1e5;
    if (peak > 0) {
      const raw = peak / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const step = mag * ([1, 2, 2.5, 5, 10].find((m) => raw / mag <= m) || 10);
      top = Math.max(step * 4, step * Math.ceil(peak / step));
    }
    const X = (i) => pl + (n > 1 ? i / (n - 1) * (w - pl - pr) : (w - pl - pr) / 2), Y = (v) => pt + (1 - v / top) * (H - pt - pb);
    const line = byDay.map((d, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(d.recovered).toFixed(1)}`).join(" ");
    const area = `${line} L${X(n - 1)} ${Y(0)} L${X(0)} ${Y(0)} Z`;
    const ticks = [0, 1, 2, 3, 4].map((k) => top / 4 * k);
    const every = n <= 7 ? 1 : n <= 30 ? 7 : 14;
    return { pl, pr, pt, pb, n, top, X, Y, line, area, ticks, every };
  }
  const kAxis = (v) => v >= 1e5 ? "\u20B9" + (v / 1e5).toFixed(v % 1e5 ? 1 : 0) + "L" : v ? "\u20B9" + Math.round(v / 1e3) + "k" : "0";
  const inr = (v) => "\u20B9" + Math.round(v).toLocaleString("en-IN");
  function useWidth(ref, initial = 640) {
    const [w, setW] = useState(initial);
    useLayoutEffect(() => {
      if (!ref.current) return;
      const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
      ro.observe(ref.current);
      return () => ro.disconnect();
    }, []);
    return w;
  }
  function ChartFrame({ byDay, H, w, g, hover, setHover, children, label }) {
    const onMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * w;
      setHover(Math.max(0, Math.min(g.n - 1, Math.round((px - g.pl) / (w - g.pl - g.pr) * (g.n - 1)))));
    };
    return /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${w} ${H}`, height: H, onMouseMove: onMove, role: "img", "aria-label": label }, g.ticks.map((t) => /* @__PURE__ */ React.createElement("line", { key: t, className: t ? "gl" : "base", x1: g.pl, x2: w - g.pr, y1: g.Y(t), y2: g.Y(t) })), g.ticks.map((t) => /* @__PURE__ */ React.createElement("text", { key: "t" + t, className: "ax", x: g.pl - 8, y: g.Y(t) + 4, textAnchor: "end" }, kAxis(t))), byDay.map((d, i) => i % g.every === 0 && i < g.n - Math.ceil(g.every / 2) || i === g.n - 1 ? /* @__PURE__ */ React.createElement("text", { key: d.date, className: "ax", x: g.X(i), y: H - 6, textAnchor: i === g.n - 1 ? "end" : "middle" }, i === g.n - 1 ? "Today" : d.label) : null), children, hover != null && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("line", { x1: g.X(hover), x2: g.X(hover), y1: g.pt, y2: H - g.pb, stroke: "var(--line-2)" }), /* @__PURE__ */ React.createElement("circle", { cx: g.X(hover), cy: g.Y(byDay[hover].recovered), r: "5", fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: "2" })));
  }
  function ChartTip({ byDay, hover, g, w }) {
    if (hover == null) return null;
    const d = byDay[hover], n = g.n;
    return /* @__PURE__ */ React.createElement("div", { className: "tip", style: { left: hover > n / 2 ? `calc(${g.X(hover) / w * 100}% - 184px)` : `calc(${g.X(hover) / w * 100}% + 12px)`, top: 8 } }, /* @__PURE__ */ React.createElement("b", null, hover === n - 1 ? "Today" : d.label), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Recovered"), /* @__PURE__ */ React.createElement("span", null, inr(d.recovered))), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Batches closed"), /* @__PURE__ */ React.createElement("span", null, d.closed)), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Packs closed"), /* @__PURE__ */ React.createElement("span", null, d.units.toLocaleString("en-IN"))), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Agent runs"), /* @__PURE__ */ React.createElement("span", null, d.runs)));
  }
  const chartLabel = (byDay) => {
    const total = byDay.reduce((t, d) => t + d.recovered, 0);
    const best = byDay.reduce((a, d) => d.recovered > a.recovered ? d : a, byDay[0]);
    return `Recovered a day, the last ${byDay.length} days: ${inr(total)} in all${best && best.recovered ? `, highest ${inr(best.recovered)} on ${best.label}` : ""}`;
  };
  function usePrevious(v) {
    const r = useRef(v);
    const p = r.current;
    useEffect(() => {
      r.current = v;
    }, [v]);
    return p;
  }
  window.SC49_SHARED = { Q, LATENCY, FILL, EASE, T, useLoad, blocks, useMoves, chartGeometry, kAxis, inr, useWidth, ChartFrame, ChartTip, chartLabel, usePrevious };
})();

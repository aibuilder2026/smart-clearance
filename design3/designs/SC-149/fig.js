(function() {
  const { useState, useRef, useMemo } = React;
  const { motion, useReducedMotion } = Motion;
  const K = window.SC3, M = window.SC3_MONEY;
  const fmt = M.fmt;
  const { cx, Icon, Button, Segmented, DataTable } = K;
  const P = window.SC3_PLATFORM;
  const kg = (v) => v >= 1e3 ? (v / 1e3).toLocaleString("en-IN", { maximumFractionDigits: v >= 1e5 ? 0 : 1 }) + " t" : Math.round(v).toLocaleString("en-IN") + " kg";
  const kgAxis = (v) => !v ? "0" : v >= 1e3 ? (v / 1e3).toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " t" : Math.round(v) + " kg";
  const pct = (a, b) => a + b > 0 ? Math.round(a / (a + b) * 1e3) / 10 : 100;
  const nice = (v) => {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    return p * ([1, 2, 2.5, 5, 10].find((m) => v / p <= m) || 10);
  };
  const useWidth = (ref, initial) => {
    const [w, setW] = useState(initial);
    React.useLayoutEffect(() => {
      if (!ref.current) return;
      const ro = new ResizeObserver(([e]) => setW(Math.max(120, Math.round(e.contentRect.width))));
      ro.observe(ref.current);
      return () => ro.disconnect();
    }, []);
    return w;
  };
  const EASE = [0.22, 1, 0.36, 1];
  function Defs() {
    return /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: "sc149-hatch", patternUnits: "userSpaceOnUse", width: "5", height: "5", patternTransform: "rotate(45)" }, /* @__PURE__ */ React.createElement("rect", { width: "5", height: "5", fill: "var(--viz-destroyed-soft)" }), /* @__PURE__ */ React.createElement("line", { x1: "0", y1: "0", x2: "0", y2: "5", stroke: "var(--viz-destroyed)", strokeWidth: "2.6" })));
  }
  function Legend({ items }) {
    return /* @__PURE__ */ React.createElement("ul", { className: "sc149-legend", "aria-label": "Legend" }, items.map((x) => /* @__PURE__ */ React.createElement("li", { key: x.id }, /* @__PURE__ */ React.createElement("i", { className: cx("sw", x.id), "aria-hidden": "true" }), x.label)));
  }
  function Tip({ row, last, x, w, lines }) {
    const left = x > w / 2 ? `calc(${x / w * 100}% - 204px)` : `calc(${x / w * 100}% + 12px)`;
    return /* @__PURE__ */ React.createElement("div", { className: "tip sc149-tip", style: { left, top: 8 } }, /* @__PURE__ */ React.createElement("b", null, last ? "Today" : row.label), lines.map(([label, value, sw]) => /* @__PURE__ */ React.createElement("div", { className: "tr", key: label }, /* @__PURE__ */ React.createElement("span", null, sw && /* @__PURE__ */ React.createElement("i", { className: cx("sw", sw), "aria-hidden": "true" }), label), /* @__PURE__ */ React.createElement("span", null, value))));
  }
  function DayAxis({ byDay, X, H }) {
    const n = byDay.length, every = n <= 7 ? 1 : n <= 30 ? 7 : 14;
    return byDay.map((d, i) => i % every === 0 && i < n - Math.ceil(every / 2) || i === n - 1 ? /* @__PURE__ */ React.createElement("text", { key: d.date, className: "ax", x: X(i), y: H - 6, textAnchor: i === n - 1 ? "end" : "middle" }, i === n - 1 ? "Today" : d.label) : null);
  }
  const bar = (x, w, y0, y1) => {
    const up = y1 < y0, h = Math.abs(y1 - y0), r = Math.min(3, w / 2, h);
    if (h < 0.5) return `M${x} ${y0} h${w} v0 h${-w} Z`;
    return up ? `M${x} ${y0} V${y1 + r} Q${x} ${y1} ${x + r} ${y1} H${x + w - r} Q${x + w} ${y1} ${x + w} ${y1 + r} V${y0} Z` : `M${x} ${y0} V${y1 - r} Q${x} ${y1} ${x + r} ${y1} H${x + w - r} Q${x + w} ${y1} ${x + w} ${y1 - r} V${y0} Z`;
  };
  function UpDown({ byDay, height, up, down, axis, label, lines }) {
    const box = useRef(null);
    const w = useWidth(box, 640);
    const [hover, setHover] = useState(null);
    const reduce = useReducedMotion();
    const H = height, pl = 50, pr = 8, pt = 10, pb = 24, n = byDay.length;
    const upMax = Math.max(0, ...byDay.map((d) => d[up])), downMax = Math.max(0, ...byDay.map((d) => d[down]));
    const step = nice(Math.max(upMax, downMax * 2, 1) / 4);
    const top = Math.max(step * 2, step * Math.ceil(upMax / step)), bottom = Math.max(step, step * Math.ceil(downMax / step));
    const Y = (v) => pt + (top - v) / (top + bottom) * (H - pt - pb), Y0 = Y(0);
    const slot = (w - pl - pr) / n, bw = Math.max(2, Math.min(16, slot - 2)), X = (i) => pl + slot * (i + 0.5);
    const ticks = [];
    for (let t = -bottom; t <= top + 1e-3; t += step) ticks.push(Math.round(t * 100) / 100);
    const onMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * w;
      setHover(Math.max(0, Math.min(n - 1, Math.floor((px - pl) / slot))));
    };
    const lag = (i) => reduce ? 0 : Math.min(6e-3 * i, 0.3);
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ov-chart sc149-chart", ref: box, onMouseLeave: () => setHover(null) }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${w} ${H}`, height: H, onMouseMove: onMove, role: "img", "aria-label": label }, /* @__PURE__ */ React.createElement(Defs, null), ticks.map((t) => /* @__PURE__ */ React.createElement("line", { key: t, className: t ? "gl" : "base", x1: pl, x2: w - pr, y1: Y(t), y2: Y(t) })), ticks.map((t) => /* @__PURE__ */ React.createElement("text", { key: "t" + t, className: "ax", x: pl - 8, y: Y(t) + 4, textAnchor: "end" }, t < 0 ? "−" + axis(-t) : axis(t))), /* @__PURE__ */ React.createElement(DayAxis, { byDay, X, H }), hover != null && /* @__PURE__ */ React.createElement("rect", { className: "sc149-col", x: X(hover) - slot / 2, y: pt, width: slot, height: H - pt - pb }), byDay.map((d, i) => /* @__PURE__ */ React.createElement(motion.path, { key: "u" + n + i, className: "sc149-up", initial: reduce ? false : { d: bar(X(i) - bw / 2, bw, Y0, Y0) }, animate: { d: bar(X(i) - bw / 2, bw, Y0, Y(d[up])) }, transition: { duration: reduce ? 0 : 0.42, ease: EASE, delay: lag(i) } })), byDay.map((d, i) => d[down] > 0 && /* @__PURE__ */ React.createElement(motion.path, { key: "d" + n + i, className: "sc149-down", initial: reduce ? false : { d: bar(X(i) - bw / 2, bw, Y0 + 1, Y0 + 1) }, animate: { d: bar(X(i) - bw / 2, bw, Y0 + 1, Y(-d[down]) + 1) }, transition: { duration: reduce ? 0 : 0.42, ease: EASE, delay: lag(i) + (reduce ? 0 : 0.12) } }))), hover != null && /* @__PURE__ */ React.createElement(Tip, { row: byDay[hover], last: hover === n - 1, x: X(hover), w, lines: lines(byDay[hover]) }));
  }
  function Mirror({ byDay, height, up, down, label, lines }) {
    const box = useRef(null);
    const w = useWidth(box, 640);
    const [hover, setHover] = useState(null);
    const reduce = useReducedMotion();
    const H = height, pl = 50, pr = 8, pt = 10, pb = 24, n = byDay.length;
    const upMax = Math.max(0, ...byDay.map((d) => d[up])), downMax = Math.max(0, ...byDay.map((d) => d[down]));
    const step = nice(Math.max(upMax, downMax * 2, 1) / 4);
    const top = Math.max(step * 2, step * Math.ceil(upMax / step)), bottom = Math.max(step, step * Math.ceil(downMax / step));
    const Y = (v) => pt + (top - v) / (top + bottom) * (H - pt - pb), Y0 = Y(0);
    const X = (i) => pl + (n > 1 ? i / (n - 1) * (w - pl - pr) : (w - pl - pr) / 2);
    const path = (key, sign) => byDay.map((d, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(sign * d[key]).toFixed(1)}`).join(" ");
    const lineUp = path(up, 1), lineDown = path(down, -1);
    const areaUp = `${lineUp} L${X(n - 1)} ${Y0} L${X(0)} ${Y0} Z`, areaDown = `${lineDown} L${X(n - 1)} ${Y0} L${X(0)} ${Y0} Z`;
    const ticks = [];
    for (let t = -bottom; t <= top + 1e-3; t += step) ticks.push(Math.round(t));
    const onMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * w;
      setHover(Math.max(0, Math.min(n - 1, Math.round((px - pl) / (w - pl - pr) * (n - 1)))));
    };
    const move = { duration: reduce ? 0 : 0.42, ease: EASE };
    const kAxis = (v) => v >= 1e5 ? "₹" + (v / 1e5).toFixed(v % 1e5 ? 1 : 0) + "L" : v ? "₹" + Math.round(v / 1e3) + "k" : "0";
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ov-chart sc149-chart", ref: box, onMouseLeave: () => setHover(null) }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${w} ${H}`, height: H, onMouseMove: onMove, role: "img", "aria-label": label }, /* @__PURE__ */ React.createElement(Defs, null), ticks.map((t) => /* @__PURE__ */ React.createElement("line", { key: t, className: t ? "gl" : "base", x1: pl, x2: w - pr, y1: Y(t), y2: Y(t) })), ticks.map((t) => /* @__PURE__ */ React.createElement("text", { key: "t" + t, className: "ax", x: pl - 8, y: Y(t) + 4, textAnchor: "end" }, t < 0 ? "−" + kAxis(-t) : kAxis(t))), /* @__PURE__ */ React.createElement(DayAxis, { byDay, X, H }), /* @__PURE__ */ React.createElement(motion.path, { key: "au" + n, className: "sc149-wash", initial: { opacity: 0, d: areaUp }, animate: { opacity: 0.1, d: areaUp }, transition: { opacity: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : 0.7 }, d: move } }), /* @__PURE__ */ React.createElement(motion.path, { key: "lu" + n, className: "sc149-line", initial: { pathLength: reduce ? 1 : 0, d: lineUp }, animate: { pathLength: 1, d: lineUp }, transition: { pathLength: { duration: reduce ? 0 : 0.9, ease: [0.45, 0, 0.25, 1] }, d: move } }), /* @__PURE__ */ React.createElement(motion.path, { key: "ad" + n, className: "sc149-down-area", initial: { opacity: 0, d: areaDown }, animate: { opacity: 1, d: areaDown }, transition: { opacity: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : 0.9 }, d: move } }), /* @__PURE__ */ React.createElement(motion.path, { key: "ld" + n, className: "sc149-down-line", initial: { pathLength: reduce ? 1 : 0, d: lineDown }, animate: { pathLength: 1, d: lineDown }, transition: { pathLength: { duration: reduce ? 0 : 0.9, ease: [0.45, 0, 0.25, 1], delay: reduce ? 0 : 0.2 }, d: move } }), hover != null && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("line", { x1: X(hover), x2: X(hover), y1: pt, y2: H - pb, stroke: "var(--line-2)" }), /* @__PURE__ */ React.createElement("circle", { cx: X(hover), cy: Y(byDay[hover][up]), r: "5", className: "sc149-dot-up" }), /* @__PURE__ */ React.createElement("circle", { cx: X(hover), cy: Y(-byDay[hover][down]), r: "5", className: "sc149-dot-down" }))), hover != null && /* @__PURE__ */ React.createElement(Tip, { row: byDay[hover], last: hover === n - 1, x: X(hover), w, lines: lines(byDay[hover]) }));
  }
  function Running({ byDay, height, label, lines }) {
    const box = useRef(null);
    const w = useWidth(box, 640);
    const [hover, setHover] = useState(null);
    const reduce = useReducedMotion();
    const H = height, pl = 50, pr = 112, pt = 12, pb = 24, n = byDay.length;
    const run = useMemo(() => {
      let s = 0, dd = 0;
      return byDay.map((d) => {
        s += d.savedKg;
        dd += d.destroyedKg;
        return { saved: s, destroyed: dd };
      });
    }, [byDay]);
    const end = run[n - 1] || { saved: 0, destroyed: 0 }, peak = end.saved + end.destroyed;
    const step = nice(Math.max(peak, 1) / 4), top = Math.max(step * 4, step * Math.ceil(peak / step));
    const Y = (v) => pt + (1 - v / top) * (H - pt - pb), X = (i) => pl + (n > 1 ? i / (n - 1) * (w - pl - pr) : (w - pl - pr) / 2);
    const lineS = run.map((r, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(r.saved).toFixed(1)}`).join(" ");
    const lineT = run.map((r, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(r.saved + r.destroyed).toFixed(1)}`).join(" ");
    const back = run.map((r, i) => `L${X(n - 1 - i).toFixed(1)} ${Y(run[n - 1 - i].saved).toFixed(1)}`).join(" ");
    const areaS = `${lineS} L${X(n - 1)} ${Y(0)} L${X(0)} ${Y(0)} Z`, areaT = `${lineT} ${back} Z`;
    const ticks = [];
    for (let t = 0; t <= top + 1e-3; t += step) ticks.push(t);
    const onMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * w;
      setHover(Math.max(0, Math.min(n - 1, Math.round((px - pl) / (w - pl - pr) * (n - 1)))));
    };
    const move = { duration: reduce ? 0 : 0.42, ease: EASE };
    const ys = Y(end.saved / 2), yt = Math.min(Y(end.saved) - 4, Y(end.saved + end.destroyed / 2));
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ov-chart sc149-chart", ref: box, onMouseLeave: () => setHover(null) }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${w} ${H}`, height: H, onMouseMove: onMove, role: "img", "aria-label": label }, /* @__PURE__ */ React.createElement(Defs, null), ticks.map((t) => /* @__PURE__ */ React.createElement("line", { key: t, className: t ? "gl" : "base", x1: pl, x2: w - pr, y1: Y(t), y2: Y(t) })), ticks.map((t) => /* @__PURE__ */ React.createElement("text", { key: "t" + t, className: "ax", x: pl - 8, y: Y(t) + 4, textAnchor: "end" }, kgAxis(t))), /* @__PURE__ */ React.createElement(DayAxis, { byDay, X, H }), /* @__PURE__ */ React.createElement(motion.path, { key: "s" + n, className: "sc149-band-saved", initial: reduce ? false : { opacity: 0, d: areaS }, animate: { opacity: 1, d: areaS }, transition: { opacity: { duration: reduce ? 0 : 0.5 }, d: move } }), /* @__PURE__ */ React.createElement(motion.path, { key: "t" + n, className: "sc149-band-destroyed", initial: reduce ? false : { opacity: 0, d: areaT }, animate: { opacity: 1, d: areaT }, transition: { opacity: { duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.25 }, d: move } }), /* @__PURE__ */ React.createElement(motion.path, { key: "ls" + n, className: "sc149-line", initial: { pathLength: reduce ? 1 : 0, d: lineS }, animate: { pathLength: 1, d: lineS }, transition: { pathLength: { duration: reduce ? 0 : 0.9, ease: [0.45, 0, 0.25, 1] }, d: move } }), /* @__PURE__ */ React.createElement(motion.path, { key: "lt" + n, className: "sc149-down-line", initial: { pathLength: reduce ? 1 : 0, d: lineT }, animate: { pathLength: 1, d: lineT }, transition: { pathLength: { duration: reduce ? 0 : 0.9, ease: [0.45, 0, 0.25, 1], delay: reduce ? 0 : 0.15 }, d: move } }), /* @__PURE__ */ React.createElement("g", { className: "sc149-end" }, /* @__PURE__ */ React.createElement("text", { x: w - pr + 10, y: ys + 4 }, /* @__PURE__ */ React.createElement("tspan", { className: "v" }, kg(end.saved)), /* @__PURE__ */ React.createElement("tspan", { x: w - pr + 10, dy: "15" }, "kept out")), /* @__PURE__ */ React.createElement("text", { x: w - pr + 10, y: yt - 12 }, /* @__PURE__ */ React.createElement("tspan", { className: "v" }, kg(end.destroyed)), /* @__PURE__ */ React.createElement("tspan", { x: w - pr + 10, dy: "15" }, "destroyed"))), hover != null && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("line", { x1: X(hover), x2: X(hover), y1: pt, y2: H - pb, stroke: "var(--line-2)" }), /* @__PURE__ */ React.createElement("circle", { cx: X(hover), cy: Y(run[hover].saved + run[hover].destroyed), r: "5", className: "sc149-dot-down" }), /* @__PURE__ */ React.createElement("circle", { cx: X(hover), cy: Y(run[hover].saved), r: "5", className: "sc149-dot-up" }))), hover != null && /* @__PURE__ */ React.createElement(Tip, { row: byDay[hover], last: hover === n - 1, x: X(hover), w, lines: lines(byDay[hover], run[hover]) }));
  }
  function Frame({ title, sub, days, setDays, big, legend, chart, columns, foot }) {
    const [asTable, setAsTable] = useState(false);
    return /* @__PURE__ */ React.createElement("section", { className: "cs-ov-card sc149-card" }, /* @__PURE__ */ React.createElement("div", { className: "cs-ov-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "t" }, title), /* @__PURE__ */ React.createElement("div", { className: "s" }, sub)), /* @__PURE__ */ React.createElement(Segmented, { label: "Range", value: String(days), onChange: (v) => setDays(Number(v)), options: P.RANGES.map((n) => ({ id: String(n), label: `${n} days` })) })), /* @__PURE__ */ React.createElement("div", { className: "sc149-big" }, big), legend, asTable ? /* @__PURE__ */ React.createElement("div", { className: "cs-ov-daytable" }, /* @__PURE__ */ React.createElement(DataTable, { label: title, rows: chart.rows.slice().reverse(), rowKey: "date", dense: true, columns })) : chart.node, /* @__PURE__ */ React.createElement("div", { className: "cs-ov-foot" }, /* @__PURE__ */ React.createElement("span", null, foot), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "link", icon: asTable ? "chart-line" : "file-spreadsheet", onClick: () => setAsTable(!asTable) }, asTable ? "Show as a chart" : "Show as a table")));
  }
  window.SC149_FIG = { kg, kgAxis, pct, Legend, UpDown, Mirror, Running, Frame };
})();

(function() {
  const { useState, useEffect, useRef, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3;
  const { cx, Icon, Avatar, Badge, useApp, AppRoot } = K;
  const fmt = window.SC3_MONEY.fmt;
  function Roll({ value, format, from, className, stagger = 40 }) {
    const reduce = useReducedMotion();
    const text = (format || ((v) => Math.round(v).toLocaleString("en-IN")))(value);
    const [armed, setArmed] = useState(from == null || reduce);
    useEffect(() => {
      if (!armed) {
        const t = setTimeout(() => setArmed(true), 90);
        return () => clearTimeout(t);
      }
    }, []);
    const chars = text.split("");
    const n = chars.length;
    return /* @__PURE__ */ React.createElement("span", { className: cx("roll", className), "aria-label": text, role: "text" }, chars.map((ch, i) => {
      const key = n - i;
      if (!/\d/.test(ch)) return /* @__PURE__ */ React.createElement("span", { key: "s" + key, "aria-hidden": "true" }, ch);
      const d = armed ? +ch : 0;
      return /* @__PURE__ */ React.createElement("span", { key: "d" + key, className: "rd", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "ghost" }, ch), /* @__PURE__ */ React.createElement("span", { className: "rs", style: { transform: `translateY(${-d * 0.98}em)`, transitionDelay: reduce ? "0ms" : `${(n - i) * stagger}ms` } }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => /* @__PURE__ */ React.createElement("span", { key: k }, k))));
    }));
  }
  function Money({ value, size, roll, from, decimals, tone, className, style, showSign = true }) {
    const neg = value < 0;
    const abs = Math.abs(value);
    const int = decimals ? Math.floor(abs + 1e-9) : Math.round(abs);
    const paise = decimals ? Math.round((abs - Math.floor(abs + 1e-9)) * 100) : 0;
    return /* @__PURE__ */ React.createElement("span", { className: cx("num money", size, tone, className), style, "aria-label": (neg ? "minus " : "") + "₹" + abs.toLocaleString("en-IN", { maximumFractionDigits: decimals ? 2 : 0 }) }, neg && showSign && /* @__PURE__ */ React.createElement("span", { className: "sign", "aria-hidden": "true" }, "−"), /* @__PURE__ */ React.createElement("span", { className: "cur", "aria-hidden": "true" }, "₹"), roll ? /* @__PURE__ */ React.createElement(Roll, { value: int, from }) : /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, int.toLocaleString("en-IN")), decimals ? /* @__PURE__ */ React.createElement("span", { className: "dec", "aria-hidden": "true" }, ".", String(paise).padStart(2, "0")) : null);
  }
  function DaysNum({ days, life = 180, size = "xl", roll, className, style }) {
    const u = Math.max(0, Math.min(1, 1 - days / life));
    return /* @__PURE__ */ React.createElement("span", { className: cx("num", size, className), style: { "--wdth": Math.round(76 + 24 * u), "--wght": Math.round(620 + 180 * u), ...style } }, roll ? /* @__PURE__ */ React.createElement(Roll, { value: days, from: 0 }) : days);
  }
  function GateChips({ gates, size }) {
    return /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, gates.map((g) => /* @__PURE__ */ React.createElement("span", { key: g.id, className: cx("gate", g.pass ? "pass" : "fail"), title: `${g.app}: ${g.rule}, has ${g.has}` }, /* @__PURE__ */ React.createElement(Icon, { name: g.pass ? "check" : "x", size: 13, stroke: 2.6 }), g.app, size !== "sm" && /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, opacity: 0.8 } }, g.has, "/", g.need))));
  }
  function Countdown({ days, life, status, label }) {
    const p = Math.max(0.025, Math.min(1, days / life));
    return /* @__PURE__ */ React.createElement("div", { className: cx("countdown", status === "at-risk" ? "risk" : status === "gated" ? "gated" : ""), role: "img", "aria-label": label || `${days} of ${life} days of shelf life left` }, /* @__PURE__ */ React.createElement("i", { style: { "--p": p } }));
  }
  function Tile({ label, icon, children, foot, live, className, style }) {
    return /* @__PURE__ */ React.createElement("div", { className: cx("tile", live && "live", className), style }, /* @__PURE__ */ React.createElement("span", { className: "tl-label" }, icon && /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 15 }), label), /* @__PURE__ */ React.createElement("span", { className: "tl-value" }, children), foot && /* @__PURE__ */ React.createElement("span", { className: "tl-foot" }, foot));
  }
  function Aura({ on = true, className, children, style, as: As = "div" }) {
    return /* @__PURE__ */ React.createElement(As, { className: cx(on && "aura", className), style }, children);
  }
  function Tracker({ stages, current = -1, done = 0, times = {}, onStop, label = "Stages" }) {
    const n = stages.length;
    const pos = current >= 0 ? current : Math.max(0, done - 1);
    return /* @__PURE__ */ React.createElement("div", { className: "tracker", style: { "--stops": n }, role: "list", "aria-label": label }, /* @__PURE__ */ React.createElement("div", { className: "rail", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", { style: { "--p": n > 1 ? pos / (n - 1) : 0 } })), stages.map((s, i) => {
      const st = i < done ? "done" : i === current ? "now" : "";
      return /* @__PURE__ */ React.createElement("button", { key: s.id, type: "button", role: "listitem", className: cx("stop", st, s.human && "human"), "aria-current": i === current ? "step" : void 0, onClick: onStop ? () => onStop(i) : void 0, style: { cursor: onStop ? "pointer" : "default" } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }, st === "done" && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 12, stroke: 3.2 })), /* @__PURE__ */ React.createElement("span", { className: "st-label" }, s.title), times[s.id] && /* @__PURE__ */ React.createElement("span", { className: "st-time" }, times[s.id]));
    }));
  }
  function VTracker({ items, current = -1, done = 0 }) {
    return /* @__PURE__ */ React.createElement("div", { className: "vtracker", role: "list" }, items.map((s, i) => {
      const st = i < done ? "done" : i === current ? "now" : "";
      return /* @__PURE__ */ React.createElement("div", { key: s.id, role: "listitem", className: cx("vstop", st, s.human && "human"), "aria-current": i === current ? "step" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "dot" }, st === "done" && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 3 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "vs-title" }, s.title), s.text && (st || i === current) && /* @__PURE__ */ React.createElement("div", { className: "vs-text" }, s.text)), /* @__PURE__ */ React.createElement("span", { className: "vs-time" }, s.time || ""));
    }));
  }
  const gapFor = (m) => Math.round(12 + Math.min(44, Math.log2(1 + (m || 0)) * 4.6));
  function AgentFeed({ events, people = {}, live = -1, typing, max }) {
    const list = max ? events.slice(-max) : events;
    return /* @__PURE__ */ React.createElement("div", { className: "feed", "aria-live": "polite" }, list.map((e, i) => {
      const next = list[i + 1];
      const isLive = events.indexOf(e) === live;
      const person = e.person && people[e.person];
      return /* @__PURE__ */ React.createElement(motion.div, { key: (e.id || e.at) + i + (e.agent || e.person), className: cx("ev", isLive && "live"), style: { "--gap": next ? gapFor(next.min) + "px" : "0px" }, initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }, person ? /* @__PURE__ */ React.createElement("span", { className: "ag person" }, /* @__PURE__ */ React.createElement("img", { src: person.img, alt: "" })) : /* @__PURE__ */ React.createElement(Aura, { on: isLive, className: "ag", style: { borderRadius: 11 } }, /* @__PURE__ */ React.createElement(Icon, { name: e.icon || "bot", size: 18 })), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "ev-head" }, /* @__PURE__ */ React.createElement("span", { className: "ev-who" }, person ? person.short : e.agent), e.human || person ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, "person") : /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, "agent"), /* @__PURE__ */ React.createElement("span", { className: "ev-time" }, e.at)), isLive && typing ? /* @__PURE__ */ React.createElement("div", { className: "ev-text" }, /* @__PURE__ */ React.createElement("span", { className: "typing", "aria-label": "Working" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null))) : /* @__PURE__ */ React.createElement("div", { className: "ev-text" }, e.text), e.calls && !(isLive && typing) && /* @__PURE__ */ React.createElement("div", { className: "ev-calls" }, e.calls.map(([fn, res, tone], j) => /* @__PURE__ */ React.createElement("span", { key: j, className: cx("toolcall", tone), title: `${fn} → ${res}` }, /* @__PURE__ */ React.createElement(Icon, { name: "zap" }), fn, /* @__PURE__ */ React.createElement("span", { style: { opacity: 0.6 } }, "→"), res)))));
    }));
  }
  const AREAS = { Itwari: [392, 196], Mahal: [338, 238], Sitabuldi: [292, 206], Sadar: [300, 150], Dharampeth: [226, 184], Kamptee: [486, 82], "Wardha Road": [208, 304], Wardha: [128, 352], Kalamna: [522, 214] };
  const rnd = (seed) => () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  function useKiranaPoints(kiranas, total = 38) {
    return useMemo(() => {
      const r = rnd(7);
      const pts = [];
      const used = {};
      kiranas.forEach((k, i) => {
        const c = AREAS[k.area] || AREAS.Itwari;
        used[k.area] = (used[k.area] || 0) + 1;
        const ang = used[k.area] * 2.4 + i;
        const rad = 14 + used[k.area] * 9;
        pts.push({ id: k.id, x: c[0] + Math.cos(ang) * rad, y: c[1] + Math.sin(ang) * rad * 0.8, ordered: true, k });
      });
      const names = Object.keys(AREAS).filter((a) => a !== "Kalamna");
      for (let i = pts.length; i < total; i++) {
        const c = AREAS[names[i % names.length]];
        pts.push({ id: "x" + i, x: c[0] + (r() - 0.5) * 92, y: c[1] + (r() - 0.5) * 70, ordered: false });
      }
      return pts;
    }, [kiranas.length, total]);
  }
  function ClusterMap({ kiranas = [], orderedCount = 0, route, vanProgress, height = 300, title = "Nagpur cluster", total = 38, focus }) {
    const reduce = useReducedMotion();
    const pts = useKiranaPoints(kiranas, total);
    const ordered = pts.filter((p) => p.ordered);
    const g = AREAS.Kalamna;
    const routeD = useMemo(() => {
      const left = ordered.map((p) => [p.x, p.y]);
      const seq = [g];
      let cur = g;
      while (left.length) {
        let bi = 0, bd = 1e9;
        left.forEach((p, i) => {
          const d = (p[0] - cur[0]) ** 2 + (p[1] - cur[1]) ** 2;
          if (d < bd) {
            bd = d;
            bi = i;
          }
        });
        cur = left.splice(bi, 1)[0];
        seq.push(cur);
      }
      seq.push(g);
      return "M" + seq.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L");
    }, [ordered.length]);
    const blocks = useMemo(() => {
      const r = rnd(3);
      const out = [];
      for (let y = -398; y < 800; y += 34) for (let x = -626; x < 1270; x += 44) {
        if (r() < 0.62) out.push([x + r() * 6, y + r() * 6, 30 + r() * 8, 22 + r() * 6]);
      }
      return out;
    }, []);
    const labels = Object.entries(AREAS).filter(([n]) => n !== "Kalamna");
    return /* @__PURE__ */ React.createElement("div", { className: "map", style: { height }, role: "img", "aria-label": `${title}: Kalamna godown and ${total} kiranas, ${orderedCount} ordered` }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 640 400", preserveAspectRatio: "xMidYMid meet", style: { overflow: "visible" } }, /* @__PURE__ */ React.createElement("rect", { x: "-640", y: "-400", width: "1920", height: "1200", fill: "var(--map-ground)" }), blocks.map(([x, y, w, h], i) => /* @__PURE__ */ React.createElement("rect", { key: i, x, y, width: w, height: h, rx: "5", fill: "var(--map-block)" })), /* @__PURE__ */ React.createElement("path", { d: "M-660 280 L-10 262 C 90 238, 160 280, 250 252 S 400 226, 470 248 S 590 270, 660 236 L1300 210", fill: "none", stroke: "var(--map-water)", strokeWidth: "9", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("g", { className: "road-g" }, /* @__PURE__ */ React.createElement("ellipse", { cx: "330", cy: "212", rx: "210", ry: "140", fill: "none", stroke: "var(--map-road)", strokeWidth: "9" }), /* @__PURE__ */ React.createElement("path", { className: "road", d: "M330 212 L540 214 L660 222 L1300 236", strokeWidth: "10" }), /* @__PURE__ */ React.createElement("path", { className: "road", d: "M330 212 L486 82 L560 -10 L760 -420", strokeWidth: "10" }), /* @__PURE__ */ React.createElement("path", { className: "road", d: "M330 212 L208 304 L128 352 L60 410 L-260 820", strokeWidth: "10" }), /* @__PURE__ */ React.createElement("path", { className: "road", d: "M330 212 L120 170 L-10 150 L-660 110", strokeWidth: "8" }), /* @__PURE__ */ React.createElement("path", { className: "road", d: "M330 212 L300 40 L292 -10 L270 -420", strokeWidth: "8" }), /* @__PURE__ */ React.createElement("path", { className: "road", d: "M330 212 L420 380 L440 410 L560 820", strokeWidth: "8" }), /* @__PURE__ */ React.createElement("path", { className: "road", d: "M226 184 L392 196 M300 150 L338 238", strokeWidth: "5", stroke: "var(--map-road-2)" })), route && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { className: "route-shadow", d: routeD }), /* @__PURE__ */ React.createElement(motion.path, { className: "route", d: routeD, initial: reduce ? false : { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1.6, ease: [0.65, 0, 0.35, 1] } })), pts.map((p) => {
      const on = p.ordered && kiranas.indexOf(p.k) < orderedCount;
      return /* @__PURE__ */ React.createElement("g", { key: p.id }, on && !reduce && /* @__PURE__ */ React.createElement("circle", { className: "pulse", cx: p.x, cy: p.y, r: "6" }), /* @__PURE__ */ React.createElement("circle", { className: cx("kirana", on && "on"), cx: p.x, cy: p.y, r: on ? 5.5 : 4 }));
    }), /* @__PURE__ */ React.createElement("g", { transform: `translate(${g[0]} ${g[1]})` }, !reduce && /* @__PURE__ */ React.createElement("circle", { r: "16", fill: "var(--primary)", opacity: "0.18" }, /* @__PURE__ */ React.createElement("animate", { attributeName: "r", values: "12;24;12", dur: "2.6s", repeatCount: "indefinite" }), /* @__PURE__ */ React.createElement("animate", { attributeName: "opacity", values: "0.28;0;0.28", dur: "2.6s", repeatCount: "indefinite" })), /* @__PURE__ */ React.createElement("rect", { x: "-14", y: "-14", width: "28", height: "28", rx: "9", fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M-7 5 V-1 L0 -6 L7 -1 V5 M-4 5 V1 H4 V5", fill: "none", stroke: "var(--primary-fg)", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })), route && vanProgress != null && /* @__PURE__ */ React.createElement(motion.g, { initial: false, animate: { opacity: 1 } }, /* @__PURE__ */ React.createElement("circle", { r: "11", fill: "var(--surface)", stroke: "var(--primary)", strokeWidth: "2.5", style: { offsetPath: `path("${routeD}")`, offsetDistance: `${Math.round(vanProgress * 100)}%`, transition: "offset-distance 600ms var(--ease)" } })), labels.map(([n, [x, y]]) => /* @__PURE__ */ React.createElement("text", { key: n, className: "pin-label", x, y: y - 22, textAnchor: "middle", style: { fontSize: 10.5 } }, n)), /* @__PURE__ */ React.createElement("text", { className: "pin-label", x: g[0], y: g[1] - 22, textAnchor: "middle" }, "Kalamna godown")), /* @__PURE__ */ React.createElement("span", { className: "note" }, "Schematic map · not to scale"));
  }
  function HaulLine({ progress = 0, from = "Nagpur", to = "Hyderabad", label = "NH 44 · about 500 km" }) {
    return /* @__PURE__ */ React.createElement("div", { className: "map", style: { height: 96 }, role: "img", "aria-label": `${from} to ${to}, ${label}` }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 640 96", preserveAspectRatio: "none" }, /* @__PURE__ */ React.createElement("rect", { width: "640", height: "96", fill: "var(--map-ground)" }), /* @__PURE__ */ React.createElement("path", { d: "M60 60 C 220 10, 420 100, 580 40", fill: "none", stroke: "var(--map-road)", strokeWidth: "10", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M60 60 C 220 10, 420 100, 580 40", fill: "none", stroke: "var(--violet)", strokeWidth: "3", strokeDasharray: "6 7", strokeLinecap: "round", opacity: "0.8" }), /* @__PURE__ */ React.createElement("circle", { cx: "60", cy: "60", r: "7", fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: "3" }), /* @__PURE__ */ React.createElement("circle", { cx: "580", cy: "40", r: "7", fill: "var(--violet)", stroke: "var(--surface)", strokeWidth: "3" }), /* @__PURE__ */ React.createElement("circle", { r: "9", fill: "var(--surface)", stroke: "var(--violet)", strokeWidth: "2.5", style: { offsetPath: 'path("M60 60 C 220 10, 420 100, 580 40")', offsetDistance: `${Math.round(progress * 100)}%`, transition: "offset-distance 1.2s var(--ease)" } })), /* @__PURE__ */ React.createElement("span", { className: "note", style: { left: 12, top: 8, bottom: "auto", fontWeight: 600, color: "var(--fg-2)" } }, from), /* @__PURE__ */ React.createElement("span", { className: "note", style: { left: "auto", right: 12, top: 8, bottom: "auto", fontWeight: 600, color: "var(--fg-2)" } }, to), /* @__PURE__ */ React.createElement("span", { className: "note", style: { left: "50%", transform: "translateX(-50%)" } }, label));
  }
  const CH_ORDER = ["kirana", "expiresoon", "staff", "d2c", "foodbank", "writeoff"];
  const chColor = (id) => `var(--ch-${id})`;
  function useWidth(initial) {
    const ref = useRef(null);
    const [w, setW] = useState(initial);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const ro = new ResizeObserver(([e]) => {
        const v = Math.round(e.contentRect.width);
        if (v > 0) setW(v);
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);
    return [ref, w];
  }
  function ChannelBars({ rows, chosen = [], height }) {
    const [tip, setTip] = useState(null);
    const [box, cw] = useWidth(560);
    const ordered = CH_ORDER.map((id) => rows.find((r) => r.id === id)).filter(Boolean);
    const min = Math.min(0, ...ordered.map((r) => r.net)), max = Math.max(1, ...ordered.map((r) => r.net));
    const W = Math.max(280, cw), rowH = 40, padL = Math.min(130, Math.round(W * 0.3)), padR = 64, H = ordered.length * rowH + 12;
    const x = (v) => padL + (v - min) / (max - min) * (W - padL - padR);
    return /* @__PURE__ */ React.createElement("div", { className: "chart", ref: box, onMouseLeave: () => setTip(null) }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: height || H, role: "img", "aria-label": "Net rupees per unit by channel" }, /* @__PURE__ */ React.createElement("line", { className: "zero", x1: x(0), x2: x(0), y1: "0", y2: H - 6 }), ordered.map((r, i) => {
      const y = 6 + i * rowH;
      const x0 = x(Math.min(0, r.net)), x1 = x(Math.max(0, r.net));
      const pick = chosen.includes(r.id);
      const fill = !r.eligible ? "var(--fill-3)" : r.id === "writeoff" ? chColor("writeoff") : pick ? chColor(r.id) : `color-mix(in oklab, ${chColor(r.id)} 45%, var(--surface))`;
      return /* @__PURE__ */ React.createElement("g", { key: r.id, onMouseEnter: (e) => setTip({ r, y }), style: { cursor: "default" } }, /* @__PURE__ */ React.createElement("rect", { x: "0", y, width: W, height: rowH - 4, fill: "transparent" }), /* @__PURE__ */ React.createElement("text", { x: padL - 12, y: y + rowH / 2 + 1, textAnchor: "end", style: { fontSize: 13, fill: r.eligible ? "var(--fg)" : "var(--fg-3)", fontWeight: pick ? 650 : 500 } }, r.short), /* @__PURE__ */ React.createElement("rect", { x: x0, y: y + 7, width: Math.max(2, x1 - x0), height: rowH - 18, rx: "4", fill }), /* @__PURE__ */ React.createElement("text", { x: x(0) + (r.net >= 0 ? x1 - x(0) + 8 : 8), y: y + rowH / 2 + 1, textAnchor: "start", style: { fontSize: 12.5, fontWeight: 600, fill: r.net < 0 ? "var(--red-text)" : "var(--fg-2)", fontVariantNumeric: "tabular-nums" } }, (r.net < 0 ? "−₹" : "₹") + Math.abs(r.net).toFixed(2)));
    })), tip && /* @__PURE__ */ React.createElement("div", { className: "tip", style: { left: Math.min(x(Math.max(0, tip.r.net)) / W * 100, 60) + "%", top: tip.y + 36 } }, /* @__PURE__ */ React.createElement("b", null, tip.r.name), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Price"), /* @__PURE__ */ React.createElement("span", null, tip.r.price ? "₹" + tip.r.price.toFixed(2) + " · " + tip.r.pricePctLabel + " of MRP" : "—")), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Net a unit"), /* @__PURE__ */ React.createElement("span", null, (tip.r.net < 0 ? "−₹" : "₹") + Math.abs(tip.r.net).toFixed(2))), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Capacity"), /* @__PURE__ */ React.createElement("span", null, tip.r.capacity === Infinity ? "unlimited" : tip.r.capacity.toLocaleString("en-IN"))), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Clears in"), /* @__PURE__ */ React.createElement("span", null, tip.r.clears)), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "GST credit"), /* @__PURE__ */ React.createElement("span", null, tip.r.itc, tip.r.indicative ? " · indicative" : "")), !tip.r.eligible && /* @__PURE__ */ React.createElement("div", { className: "tr", style: { color: "var(--red-text)" } }, /* @__PURE__ */ React.createElement("span", null, "Not eligible"), /* @__PURE__ */ React.createElement("span", null, tip.r.reason))));
  }
  function TrendChart({ weeks, height = 220 }) {
    const [hover, setHover] = useState(null);
    const ref = useRef(null);
    const [box, cw] = useWidth(640);
    const W = Math.max(300, cw), H = height, pl = 52, pr = 12, pt = 12, pb = 26;
    const max = Math.ceil(Math.max(...weeks.map((w) => Math.max(w[1], w[2]))) / 1e4) * 1e4;
    const X = (i) => pl + i / (weeks.length - 1) * (W - pl - pr);
    const Y = (v) => pt + (1 - v / max) * (H - pt - pb);
    const line = (k) => weeks.map((w, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(w[k]).toFixed(1)).join(" ");
    const area = line(1) + ` L${X(weeks.length - 1)} ${Y(0)} L${X(0)} ${Y(0)} Z`;
    const ticks = [0, max / 2, max];
    const onMove = (e) => {
      const r = ref.current.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * W;
      const i = Math.round((px - pl) / (W - pl - pr) * (weeks.length - 1));
      setHover(Math.max(0, Math.min(weeks.length - 1, i)));
    };
    return /* @__PURE__ */ React.createElement("div", { className: "chart", ref: box, onMouseLeave: () => setHover(null) }, /* @__PURE__ */ React.createElement("div", { className: "legend", style: { marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { style: { background: "var(--primary)" } }), "Recovered"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { style: { background: "var(--red)" } }), "Would-be write-off")), /* @__PURE__ */ React.createElement("svg", { ref, viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, onMouseMove: onMove, role: "img", "aria-label": "Weekly recovered against would-be write-off" }, /* @__PURE__ */ React.createElement("g", { className: "grid" }, ticks.map((t) => /* @__PURE__ */ React.createElement("line", { key: t, x1: pl, x2: W - pr, y1: Y(t), y2: Y(t) }))), /* @__PURE__ */ React.createElement("g", { className: "axis" }, ticks.map((t) => /* @__PURE__ */ React.createElement("text", { key: t, x: pl - 8, y: Y(t) + 4, textAnchor: "end" }, t ? "₹" + Math.round(t / 1e3) + "k" : "0")), weeks.map((w, i) => i % (W < 460 ? 3 : 2) === 0 && /* @__PURE__ */ React.createElement("text", { key: w[0], x: X(i), y: H - 6, textAnchor: "middle" }, w[0]))), /* @__PURE__ */ React.createElement("path", { d: area, fill: "var(--primary)", opacity: "0.1" }), /* @__PURE__ */ React.createElement("path", { d: line(2), fill: "none", stroke: "var(--red)", strokeWidth: "2", strokeDasharray: "5 5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: line(1), fill: "none", stroke: "var(--primary)", strokeWidth: "2.5", strokeLinejoin: "round", strokeLinecap: "round" }), hover != null && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("line", { x1: X(hover), x2: X(hover), y1: pt, y2: H - pb, stroke: "var(--line-2)" }), /* @__PURE__ */ React.createElement("circle", { cx: X(hover), cy: Y(weeks[hover][1]), r: "5", fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: "2" }), /* @__PURE__ */ React.createElement("circle", { cx: X(hover), cy: Y(weeks[hover][2]), r: "5", fill: "var(--red)", stroke: "var(--surface)", strokeWidth: "2" }))), hover != null && /* @__PURE__ */ React.createElement("div", { className: "tip", style: { left: `calc(${X(hover) / W * 100}% ${hover > weeks.length / 2 ? "- 170px" : "+ 12px"})`, top: 40 } }, /* @__PURE__ */ React.createElement("b", null, weeks[hover][0]), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Recovered"), /* @__PURE__ */ React.createElement("span", null, fmt.inr(weeks[hover][1]))), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Would-be write-off"), /* @__PURE__ */ React.createElement("span", null, fmt.inr(-weeks[hover][2])))));
  }
  function MixBar({ mix, names }) {
    const total = mix.reduce((t, m) => t + m[1], 0);
    let acc = 0;
    const ordered = CH_ORDER.map((id) => mix.find((m) => m[0] === id)).filter(Boolean);
    return /* @__PURE__ */ React.createElement("div", { className: "chart stack snug" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 600 28", width: "100%", height: "28", preserveAspectRatio: "none", role: "img", "aria-label": "Channel mix" }, ordered.map(([id, v]) => {
      const w = v / total * 600;
      const x = acc;
      acc += w;
      return /* @__PURE__ */ React.createElement("rect", { key: id, x: x + 1, y: "0", width: Math.max(0, w - 2), height: "28", rx: "5", fill: chColor(id) }, /* @__PURE__ */ React.createElement("title", null, names && names[id] || id, ": ", Math.round(v / total * 100), "%"));
    })), /* @__PURE__ */ React.createElement("div", { className: "legend" }, ordered.map(([id, v]) => /* @__PURE__ */ React.createElement("span", { key: id }, /* @__PURE__ */ React.createElement("i", { style: { background: chColor(id) } }), names && names[id] || id, " ", /* @__PURE__ */ React.createElement("b", { className: "tnum", style: { color: "var(--fg)" } }, Math.round(v / total * 100), "%")))));
  }
  function CodeBlock({ code, className }) {
    const html = useMemo(() => code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/^(POST|GET|PUT|PATCH|DELETE|HTTP\/\d\.\d|\d{3})\b[^\n]*/gm, (m) => `<span class="m">${m}</span>`).replace(/("[^"\n]*")(\s*:)/g, '<span class="k">$1</span>$2').replace(/:\s*("[^"\n]*")/g, (m, s) => m.replace(s, `<span class="s">${s}</span>`)).replace(/(:\s*)(-?\d+(?:\.\d+)?)/g, '$1<span class="n">$2</span>'), [code]);
    return /* @__PURE__ */ React.createElement("pre", { className: cx("code", className), dangerouslySetInnerHTML: { __html: html } });
  }
  function StatusBar({ time = "9:41", dark }) {
    return /* @__PURE__ */ React.createElement("div", { className: cx("statusbar", dark && "on-dark"), "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", null, time), /* @__PURE__ */ React.createElement("span", { className: "sb-icons" }, /* @__PURE__ */ React.createElement(Icon, { name: "signal", size: 16, stroke: 2.4 }), /* @__PURE__ */ React.createElement(Icon, { name: "wifi", size: 16, stroke: 2.4 }), /* @__PURE__ */ React.createElement(Icon, { name: "battery-full", size: 20, stroke: 1.8 })));
  }
  function PhoneFrame({ children, time, scale = 1, style, dark }) {
    return /* @__PURE__ */ React.createElement("div", { className: "device-phone", style: { transform: scale !== 1 ? `scale(${scale})` : void 0, transformOrigin: "top left", ...style } }, /* @__PURE__ */ React.createElement("div", { className: "screen" }, /* @__PURE__ */ React.createElement(AppRoot, { style: { "--safe-top": "50px", "--safe-bottom": "22px" } }, /* @__PURE__ */ React.createElement(StatusBar, { time, dark }), children, /* @__PURE__ */ React.createElement("div", { className: cx("homebar", dark && "on-dark"), "aria-hidden": "true" })), /* @__PURE__ */ React.createElement("div", { className: "island", "aria-hidden": "true" })));
  }
  function WindowFrame({ title, children, style }) {
    return /* @__PURE__ */ React.createElement("div", { className: "device-window", style }, /* @__PURE__ */ React.createElement("div", { className: "chrome" }, /* @__PURE__ */ React.createElement("span", { className: "lights", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("span", { className: "wtitle" }, title)), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", minHeight: 0 } }, children));
  }
  Object.assign(window.SC3, { Roll, Money, DaysNum, GateChips, Countdown, Tile, Aura, Tracker, VTracker, AgentFeed, ClusterMap, HaulLine, ChannelBars, TrendChart, MixBar, CodeBlock, StatusBar, PhoneFrame, WindowFrame, CH_ORDER });
})();

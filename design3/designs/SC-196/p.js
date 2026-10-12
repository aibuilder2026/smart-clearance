(function() {
  const { useState, useMemo, useEffect, useRef, Fragment } = React;
  const { useReducedMotion } = Motion;
  const K = window.SC3;
  const { cx, Icon, Mark, useApp } = K;
  const AG_STOPS = [
    { id: "connect", t: "Connect" },
    { id: "detect", t: "Detect" },
    { id: "verify", t: "Verify" },
    { id: "value", t: "Value" },
    { id: "decide", t: "Decide" },
    { id: "approve", t: "Approve", human: true },
    { id: "execute", t: "Execute" },
    { id: "settle", t: "Settle" },
    { id: "report", t: "Report" }
  ];
  const AG_CREW = [
    { id: "data", name: "Data", icon: "database", stop: 0, did: "Loaded the stock export and mapped its columns", call: "dms.map → 8 fields" },
    { id: "watcher", name: "Watcher", icon: "eye", stop: 1, did: "Flagged a batch the quick-commerce gates will refuse", call: "gates.check → blinkit · zepto · instamart" },
    { id: "vision", name: "Vision", icon: "scan-line", stop: 2, did: "Read the carton's label from one photo", call: "gemini.vision.read_label → match" },
    { id: "valuer", name: "Valuer", icon: "scale", stop: 3, did: "Priced every exit, the bin included", call: "price.exits → 5 priced" },
    { id: "router", name: "Router", icon: "route", stop: 4, did: "Split the batch under each exit's caps", call: "split.fill → under the caps" },
    { id: "you", name: "You", icon: "hand", stop: 5, human: true, did: "One yes, with the money on screen", call: "plan.approve → one tap" },
    { id: "outreach", name: "Outreach", icon: "send", stop: 6, did: "Offered the kiranas a scheme in Hindi", call: "fcm.send → kiranas · Hindi" },
    { id: "lister", name: "Lister", icon: "store", stop: 6, did: "Listed the lot outside the client's territory", call: "expiresoon.list → hidden in territory" },
    { id: "negotiator", name: "Negotiator", icon: "gavel", stop: 6, did: "Countered a bid, never below the reserve", call: "bid.counter → above reserve" },
    { id: "paperwork", name: "Paperwork", icon: "file-text", stop: 7, did: "Drafted the invoice, credit note and GST memo", call: "invoice.draft · credit_note.issue" },
    { id: "impact", name: "Impact", icon: "leaf", stop: 8, did: "Posted the ledger and the BRSR row", call: "ledger.post · brsr.row" }
  ];
  const AG_N = AG_STOPS.length;
  const agAt = (k) => AG_CREW.filter((c) => c.stop === k);
  const agNames = (k) => {
    const c = agAt(k).map((x) => x.name);
    return c.length > 1 ? c.slice(0, -1).join(", ") + " and " + c[c.length - 1] : c[0];
  };
  const AG_T = { step: 420, yes: 800, exec: 900, start: 600, hold: 2800, fade: 500 };
  const agStays = (k) => AG_STOPS[k].human ? AG_T.yes : AG_STOPS[k].id === "execute" ? AG_T.exec : AG_T.step;
  const AG_KEY = "sc3-agents";
  function useAgentWalk() {
    const reduce = !!useReducedMotion();
    const [paused, setPausedState] = useState(() => {
      try {
        return localStorage.getItem(AG_KEY) === "paused";
      } catch (e) {
        return false;
      }
    });
    const [held, setHeld] = useState(null);
    const [k, setK] = useState(reduce ? AG_N : -1);
    const moving = !reduce && !paused && !held;
    useEffect(() => {
      if (reduce) {
        if (!held) setK(AG_N);
        return;
      }
      if (!moving) return;
      const t = setTimeout(() => setK(k >= AG_N ? -1 : k + 1), k < 0 ? AG_T.start : k >= AG_N ? AG_T.hold : agStays(k));
      return () => clearTimeout(t);
    }, [k, moving, reduce, held]);
    const setPaused = (v) => {
      setPausedState(v);
      try {
        localStorage.setItem(AG_KEY, v ? "paused" : "playing");
      } catch (e) {
      }
    };
    const pick = (c) => {
      if (held && held.id === c.id) {
        setHeld(null);
        return;
      }
      setHeld(c);
      setK(c.stop);
    };
    const release = () => setHeld(null);
    const toggle = () => {
      if (held) {
        setHeld(null);
        if (paused) setPaused(false);
        return;
      }
      setPaused(!paused);
    };
    const state = (c) => held ? c.id === held.id ? "now" : c.stop < held.stop ? "done" : "later" : c.stop < k || k >= AG_N ? "done" : c.stop === k ? "now" : "later";
    return { k, reduce, paused, held, moving, playing: !held && k >= 0 && k < AG_N, done: k >= AG_N, state, pick, release, toggle };
  }
  function agOrbit(w, h, band) {
    const rx = band ? w * 0.38 : Math.min(w * 0.36, w / 2 - 124), ry = band ? h * 0.36 : Math.min(h * 0.36, h / 2 - 44);
    return AG_CREW.map((c, i) => {
      const a = ((band ? 196 : 200) + i * 29.5) * Math.PI / 180, ox = Math.cos(a), oy = Math.sin(a);
      return { c, x: w / 2 + rx * ox, y: h / 2 + ry * oy, ox, oy };
    });
  }
  function agThreads(stars) {
    const at = (id) => stars.find((s) => s.c.id === id), out = [];
    const order = ["data", "watcher", "vision", "valuer", "router", "you"];
    for (let i = 1; i < order.length; i++) out.push({ a: at(order[i - 1]), b: at(order[i]), stop: i });
    ["outreach", "lister", "negotiator"].forEach((id) => {
      out.push({ a: at("you"), b: at(id), stop: 6, fan: true });
      out.push({ a: at(id), b: at("paperwork"), stop: 7 });
    });
    out.push({ a: at("paperwork"), b: at("impact"), stop: 8 });
    return out;
  }
  const AG_INK = {
    light: { ink: "13, 28, 21", lit: "22, 122, 82", amber: "211, 154, 18", hole: "#f2f6f3" },
    dark: { ink: "214, 255, 232", lit: "60, 203, 138", amber: "247, 192, 74", hole: "#0b110e" }
  };
  const agSeeded = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  function agField(w, h, band) {
    const rnd = agSeeded(195), n = band ? 26 : Math.min(110, Math.round(w * h / 15e3)), out = [];
    while (out.length < n) {
      const vx = (rnd() - 0.5) * 0.28, vy = (rnd() - 0.5) * 0.28;
      out.push({ x: rnd() * w, y: rnd() * h, vx, vy, bx: vx, by: vy, r: 1.1 + rnd() * 1.3 });
    }
    return out;
  }
  function agStep(f, dt) {
    const go = f.moving ? 1 : 0, P = f.band ? 60 : 100;
    f.nodes.forEach((n) => {
      if (f.pointer && !f.reduce) {
        const dx = n.x - f.pointer.x, dy = n.y - f.pointer.y, d = Math.hypot(dx, dy);
        if (d < P && d > 0.5) {
          const s = (1 - d / P) * 0.2 * dt;
          n.vx += dx / d * s;
          n.vy += dy / d * s;
        }
      }
      f.ripples.forEach((r) => {
        const dx = n.x - r.x, dy = n.y - r.y, d = Math.hypot(dx, dy), off = Math.abs(d - r.r);
        if (off < 26 && d > 0.5) {
          const s = (1 - off / 26) * 1.1 * (1 - r.t) * dt;
          n.vx += dx / d * s;
          n.vy += dy / d * s;
        }
      });
      n.vx += (n.bx * go - n.vx) * Math.min(1, 0.045 * dt);
      n.vy += (n.by * go - n.vy) * Math.min(1, 0.045 * dt);
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < 0 || n.x > f.w) {
        n.x = Math.max(0, Math.min(f.w, n.x));
        n.vx *= -1;
        n.bx = Math.abs(n.bx) * (n.x <= 0 ? 1 : -1);
      }
      if (n.y < 0 || n.y > f.h) {
        n.y = Math.max(0, Math.min(f.h, n.y));
        n.vy *= -1;
        n.by = Math.abs(n.by) * (n.y <= 0 ? 1 : -1);
      }
    });
    return f.nodes.reduce((e, n) => e + Math.abs(n.vx - n.bx * go) + Math.abs(n.vy - n.by * go), 0);
  }
  function agDraw(ctx, f, now) {
    const I = AG_INK[f.dark ? "dark" : "light"], band = f.band, stars = f.stars, all = f.nodes.concat(stars), link = band ? 70 : 120;
    ctx.clearRect(0, 0, f.w, f.h);
    ctx.lineWidth = 1;
    for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
      const d = Math.hypot(all[a].x - all[b].x, all[a].y - all[b].y);
      if (d >= link) continue;
      ctx.strokeStyle = `rgba(${I.ink}, ${(0.05 + (1 - d / link) * (f.dark ? 0.16 : 0.14)).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(all[a].x, all[a].y);
      ctx.lineTo(all[b].x, all[b].y);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(${I.ink}, ${f.dark ? 0.34 : 0.26})`;
    f.nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (f.pointer) {
      const P = band ? 110 : 190;
      ctx.lineWidth = 1.2;
      all.forEach((n) => {
        const d = Math.hypot(n.x - f.pointer.x, n.y - f.pointer.y);
        if (d >= P) return;
        ctx.strokeStyle = `rgba(${I.lit}, ${((1 - d / P) * 0.75).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(f.pointer.x, f.pointer.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      });
      ctx.fillStyle = `rgba(${I.lit}, 0.14)`;
      ctx.beginPath();
      ctx.arc(f.pointer.x, f.pointer.y, band ? 9 : 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgb(${I.lit})`;
      ctx.beginPath();
      ctx.arc(f.pointer.x, f.pointer.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!stars.length) return;
    const k = f.done ? AG_N : f.k, since = now - f.stepAt;
    const fading = k < 0 && now - f.resetAt < AG_T.fade ? 1 - (now - f.resetAt) / AG_T.fade : 0;
    const p = f.playing ? Math.min(1, since / (f.k === 6 ? 700 : 340)) : 1;
    ctx.lineCap = "round";
    agThreads(stars).forEach((t) => {
      const shown = fading ? true : f.held ? t.stop < f.held.stop || t.stop === f.held.stop && t.b.c.id === f.held.id : t.stop <= k;
      if (!shown) return;
      const along = !fading && t.stop === k && f.playing ? p : 1;
      ctx.globalAlpha = fading || 1;
      ctx.lineWidth = band ? 1.6 : 2.2;
      ctx.strokeStyle = `rgb(${t.a.c.human || t.b.c.human ? I.amber : I.lit})`;
      ctx.beginPath();
      ctx.moveTo(t.a.x, t.a.y);
      ctx.lineTo(t.a.x + (t.b.x - t.a.x) * along, t.a.y + (t.b.y - t.a.y) * along);
      ctx.stroke();
      if (t.fan && t.stop === k && f.playing && !fading) for (let j = 0; j < 3; j++) {
        const u = (since / 520 + j / 3) % 1;
        ctx.fillStyle = `rgb(${I.lit})`;
        ctx.beginPath();
        ctx.arc(t.a.x + (t.b.x - t.a.x) * u, t.a.y + (t.b.y - t.a.y) * u, band ? 2 : 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    f.ripples.forEach((r) => {
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(${I.lit}, ${(0.55 * (1 - r.t)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    });
    stars.forEach((n) => {
      const st = f.state(n.c), col = n.c.human ? I.amber : I.lit, rad = (band ? 4 : 5.5) + (st === "now" ? 1 : 0);
      if (st === "now" && f.moving) {
        const u = since % 1200 / 1200;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(${col}, ${(0.6 * (1 - u)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, rad + 2 + u * (band ? 10 : 14), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, rad, 0, Math.PI * 2);
      if (st === "later") {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(${I.ink}, ${f.dark ? 0.45 : 0.35})`;
        ctx.fillStyle = I.hole;
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgb(${col})`;
        ctx.fill();
      }
    });
  }
  function useBox(ref, dep) {
    const [s, setS] = useState(null);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const f = () => setS({ w: el.clientWidth, h: el.clientHeight });
      f();
      const o = new ResizeObserver(f);
      o.observe(el);
      return () => o.disconnect();
    }, [dep]);
    return s;
  }
  function AgentField({ w, stars, band, orbit, height, local }) {
    const box = useRef(null), cv = useRef(null), size = useBox(box);
    const f = useRef({ nodes: [], ripples: [], pointer: null, stepAt: 0, resetAt: -1e9, raf: 0, last: 0, off: { x: 0, y: 0 } }).current;
    const prevK = useRef(w.k);
    if (prevK.current !== w.k) {
      if (w.k < 0 && prevK.current >= AG_N) f.resetAt = performance.now();
      prevK.current = w.k;
      f.stepAt = performance.now();
    }
    useEffect(() => {
      if (!size) return;
      f.nodes = agField(size.w, size.h, band);
      if (!band && !local && orbit && orbit.current && box.current) {
        const a = orbit.current.getBoundingClientRect(), b = box.current.getBoundingClientRect(), z = scaleOf();
        f.off = { x: (a.left - b.left) / z, y: (a.top - b.top) / z };
      }
    }, [size && size.w, size && size.h, stars]);
    const scaleOf = () => {
      const el = box.current;
      return el && el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1;
    };
    const isDark = () => {
      const t = box.current && box.current.closest("[data-theme]");
      return !!t && t.getAttribute("data-theme") === "dark";
    };
    const frame = (now) => {
      const c = cv.current;
      if (!c || !size) {
        f.raf = 0;
        return;
      }
      const dt = f.last ? Math.min(3, (now - f.last) / (1e3 / 60)) : 1;
      f.last = now;
      Object.assign(f, { w: size.w, h: size.h, band, k: w.k, done: w.done, playing: w.playing, held: w.held, moving: w.moving, reduce: w.reduce, state: w.state, dark: isDark(), stars: stars.map((s) => ({ ...s, x: s.x + f.off.x, y: s.y + f.off.y })) });
      f.ripples = f.ripples.map((r) => ({ ...r, t: (now - r.born) / 900, r: 6 + (band ? 150 : 260) * (1 - Math.pow(1 - Math.min(1, (now - r.born) / 900), 3)) })).filter((r) => r.t < 1);
      const energy = w.reduce ? 0 : agStep(f, dt);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (c.width !== Math.round(size.w * dpr) || c.height !== Math.round(size.h * dpr)) {
        c.width = Math.round(size.w * dpr);
        c.height = Math.round(size.h * dpr);
      }
      const ctx = c.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      agDraw(ctx, f, now);
      const live = w.moving || f.pointer || f.ripples.length || energy > 0.05 || w.k < 0 && now - f.resetAt < AG_T.fade;
      f.raf = live ? requestAnimationFrame(frame) : 0;
      if (!live) f.last = 0;
    };
    const kick = () => {
      if (!f.raf) f.raf = requestAnimationFrame(frame);
    };
    useEffect(() => {
      cancelAnimationFrame(f.raf);
      f.raf = 0;
      kick();
    });
    useEffect(() => () => cancelAnimationFrame(f.raf), []);
    useEffect(() => {
      const o = new MutationObserver(kick);
      o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      const t = box.current && box.current.closest(".app");
      if (t) o.observe(t, { attributes: true, attributeFilter: ["data-theme"] });
      return () => o.disconnect();
    }, []);
    const at = (e) => {
      const r = box.current.getBoundingClientRect(), z = scaleOf();
      return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z };
    };
    const down = useRef(null);
    const onMove = (e) => {
      f.pointer = at(e);
      kick();
    };
    const onLeave = () => {
      f.pointer = null;
      kick();
    };
    const onDown = (e) => {
      down.current = at(e);
      if (e.pointerType !== "mouse") {
        f.pointer = down.current;
        kick();
      }
    };
    const onUp = (e) => {
      const p = at(e), d = down.current;
      down.current = null;
      if (e.pointerType !== "mouse") f.pointer = null;
      if (!d || Math.hypot(p.x - d.x, p.y - d.y) > 10) {
        kick();
        return;
      }
      const hit = (f.stars || []).map((s) => ({ s, d: Math.hypot(s.x - p.x, s.y - p.y) })).filter((x) => x.d < (band ? 24 : 18)).sort((a, b) => a.d - b.d)[0];
      if (hit) w.pick(hit.s.c);
      else {
        if (!w.reduce) f.ripples.push({ x: p.x, y: p.y, born: performance.now(), t: 0, r: 6 });
        w.release();
      }
      kick();
    };
    return /* @__PURE__ */ React.createElement("div", { ref: box, className: cx("ag-field", band && "band"), style: height ? { height } : void 0, "aria-hidden": "true", onPointerMove: onMove, onPointerLeave: onLeave, onPointerCancel: onLeave, onPointerDown: onDown, onPointerUp: onUp }, /* @__PURE__ */ React.createElement("canvas", { ref: cv, className: "ag-canvas" }));
  }
  function AgentCaption({ w, className }) {
    const s = w.held ? AG_STOPS[w.held.stop] : w.playing ? AG_STOPS[w.k] : null, h = w.held;
    return /* @__PURE__ */ React.createElement("div", { className: cx("ag-caption", s && s.human && "human", h && "held", className), "aria-hidden": "true" }, h ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, h.stop + 1, " of 9 · ", s.t), /* @__PURE__ */ React.createElement("b", null, h.name), /* @__PURE__ */ React.createElement("span", { className: "did" }, h.did), /* @__PURE__ */ React.createElement("code", null, h.call)) : w.k < 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, "A batch the gates will refuse"), /* @__PURE__ */ React.createElement("b", null, "Ten agents and one person take it from here.")) : s ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, w.k + 1, " of 9 · ", s.t), /* @__PURE__ */ React.createElement("b", null, agNames(w.k)), /* @__PURE__ */ React.createElement("span", { className: "did" }, agAt(w.k).length > 1 ? "Work the exits at once: the kiranas, the marketplace, a bid" : agAt(w.k)[0].did)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, "9 of 9 · Report"), /* @__PURE__ */ React.createElement("b", null, "Sold, not binned."), /* @__PURE__ */ React.createElement("span", { className: "did" }, "Ten agents worked the batch. One person said yes.")));
  }
  const AgentChip = ({ c }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: c.icon, size: 14, stroke: 2.2 })), c.name);
  function AgentPlay({ w, compact }) {
    if (w.reduce) return null;
    const label = w.moving ? "Pause" : "Play", icon = w.moving ? "pause" : "play";
    return compact ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon ag-play", "aria-label": `${label} the agents`, onClick: w.toggle }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 16 })) : /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm ag-play", "aria-label": `${label} the agents`, onClick: w.toggle }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 15 }), label);
  }
  const AgentWords = ({ w }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("ol", { className: "sr-only", "aria-label": "How Smart-Clearance's agents work a batch" }, AG_STOPS.map((s, i) => /* @__PURE__ */ React.createElement("li", { key: s.id }, s.t, ": ", agNames(i), ". ", agAt(i).map((c) => c.did).join(". "), "."))), /* @__PURE__ */ React.createElement("p", { className: "sr-only", role: "status" }, w.held ? `${w.held.name}, ${AG_STOPS[w.held.stop].t}: ${w.held.did}.` : ""));
  function Tiles({ w, stars, names, side, size = 30 }) {
    const [rove, setRove] = useState(0);
    const refs = useRef([]);
    const key = (e) => {
      const n = stars.length, to = { ArrowRight: rove + 1, ArrowDown: rove + 1, ArrowLeft: rove - 1, ArrowUp: rove - 1, Home: 0, End: n - 1 }[e.key];
      if (e.key === "Escape" && w.held) {
        w.release();
        return;
      }
      if (to == null) return;
      e.preventDefault();
      const i = (to + n) % n;
      setRove(i);
      refs.current[i] && refs.current[i].focus();
    };
    return /* @__PURE__ */ React.createElement("div", { className: "sv-tiles", role: "toolbar", "aria-label": "The agents, in the order they work", onKeyDown: key }, stars.map((n, i) => {
      const st = w.state(n.c);
      return /* @__PURE__ */ React.createElement("button", { key: n.c.id, type: "button", ref: (el) => refs.current[i] = el, tabIndex: i === rove ? 0 : -1, "aria-pressed": !!w.held && w.held.id === n.c.id, className: cx("sv-tile", n.c.human && "human", st, st === "now" && !w.reduce && "aura"), style: { left: n.x, top: n.y, width: size, height: size }, onFocus: () => setRove(i), onClick: () => w.pick(n.c) }, /* @__PURE__ */ React.createElement(Icon, { name: n.c.icon, size: Math.round(size * 0.46), stroke: 2.2 }), names ? /* @__PURE__ */ React.createElement("span", { className: cx("sv-name", side ? side(n) : "below") }, n.c.name) : /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, n.c.name), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, ", ", AG_STOPS[n.c.stop].t));
    }));
  }
  window.SC196 = { AG_STOPS, AG_CREW, AG_N, AG_T, agAt, agNames, useAgentWalk, agThreads, agField, agStep, agDraw, useBox, AgentField, AgentCaption, AgentPlay, AgentWords, AgentChip, Tiles };
})();

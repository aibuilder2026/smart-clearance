(function() {
  function boot() {
    if (!window.React || !window.ReactDOM || !window.Motion) return;
    const { useState, useEffect, useRef, useLayoutEffect } = React;
    const { motion, AnimatePresence, useReducedMotion, animate } = window.Motion;
    const EASE = [0.22, 1, 0.36, 1];
    const ICONS = window.SC3_ICONS || {};
    const cx = (...a) => a.filter(Boolean).join(" ");
    const Icon = ({ name, size = 16, stroke = 1.75, className }) => /* @__PURE__ */ React.createElement(
      "svg",
      {
        className: cx("ic", className),
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: stroke,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        dangerouslySetInnerHTML: { __html: ICONS[name] || "" }
      }
    );
    const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
    const STOPS = [
      { id: "connect", t: "Connect", who: [["Data", "database"]], did: "stock export mapped · permission given" },
      { id: "detect", t: "Detect", who: [["Watcher", "eye"]], did: "1,360 packs won't sell in the 47 days left" },
      { id: "verify", t: "Verify", who: [["Vision", "scan-line"]], did: "label read · the date matches" },
      { id: "value", t: "Value", who: [["Valuer", "scale"]], did: "five exits priced · the bin costs ₹26,330" },
      { id: "decide", t: "Decide", who: [["Router", "route"]], did: "588 packs to 31 kiranas · 772 to one buyer" },
      { id: "approve", t: "Approve", who: [["a person", "hand"]], human: true, did: "approved in one tap · ₹21,770 on screen" },
      { id: "execute", t: "Execute", who: [["Lister", "store"], ["Outreach", "send"], ["Negotiator", "gavel"]], did: "listed · offers sent · a bid countered to ₹14.20" },
      { id: "settle", t: "Settle", who: [["Paperwork", "file-text"]], did: "invoice, credit note and GST memo drafted" },
      { id: "report", t: "Report", who: [["Impact", "leaf"]], did: "₹21,152 recovered · 218 kg kept out of landfill" }
    ];
    const N = STOPS.length;
    const RECOVERED = 21152, BIN = 26330;
    const names = (s) => s.who.map((w) => w[0]).join(" · ");
    const CREW = STOPS.flatMap((s, i) => s.who.map(([name, icon]) => ({ name, icon, stop: i, human: !!s.human })));
    const CARTON = [[0.393, 0.334], [0.466, 0.316], [0.65, 0.346], [0.651, 0.75], [0.525, 0.805], [0.393, 0.746]];
    const EXITS = [
      { id: "kirana", name: "Kiranas", packs: 588, ink: "var(--ch-kirana)" },
      { id: "expiresoon", name: "Marketplace", packs: 772, ink: "var(--ch-expiresoon)" },
      { id: "staff", name: "Staff sale", packs: 0, note: "not needed" },
      { id: "foodbank", name: "Food bank", packs: 0, note: "not needed" },
      { id: "bin", name: "The bin", packs: 0, note: "not taken", bin: true }
    ];
    function usePlate(layer) {
      const [g, setG] = useState(null);
      const [ready, setReady] = useState(false);
      useLayoutEffect(() => {
        const el = layer.current;
        if (!el) return;
        const hero = el.closest(".hero");
        const imgs = [...hero.querySelectorAll(".hero-scene img")];
        const shown = () => imgs.find((i) => i.getClientRects().length) || imgs[0];
        const measure = () => {
          const img = shown(), host = el.offsetParent;
          if (!img || !host) return;
          const r = img.getBoundingClientRect(), p = host.getBoundingClientRect();
          const nw = img.naturalWidth || +img.getAttribute("width"), nh = img.naturalHeight || +img.getAttribute("height");
          const [px, py] = (getComputedStyle(img).objectPosition || "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
          const s = Math.max(r.width / nw, r.height / nh);
          setG({ left: r.left - p.left, top: r.top - p.top, w: r.width, h: r.height, s, ox: (r.width - nw * s) * px, oy: (r.height - nh * s) * py, nw, nh });
        };
        measure();
        const ro = new ResizeObserver(measure);
        imgs.forEach((i) => ro.observe(i));
        ro.observe(hero);
        const mo = new MutationObserver(() => requestAnimationFrame(measure));
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        imgs.forEach((i) => {
          if (i.complete && i.naturalWidth) setReady(true);
          else i.addEventListener("load", () => {
            measure();
            setReady(true);
          }, { once: true });
        });
        return () => {
          ro.disconnect();
          mo.disconnect();
        };
      }, []);
      const at = (p) => g ? [g.ox + p[0] * g.nw * g.s, g.oy + p[1] * g.nh * g.s] : [0, 0];
      const style = g ? { left: g.left, top: g.top, width: g.w, height: g.h } : { visibility: "hidden" };
      return { g, at, ready, style, wide: !!g && g.w >= 900 };
    }
    const poly = (at, pts) => pts.map((p) => at(p).map((v) => v.toFixed(1)).join(" ")).join(" L");
    function useDark() {
      const read = () => document.documentElement.getAttribute("data-theme") === "dark";
      const [d, setD] = useState(read);
      useEffect(() => {
        const mo = new MutationObserver(() => setD(read()));
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        return () => mo.disconnect();
      }, []);
      return d;
    }
    const seeded = (seed) => () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    function fitCanvas(cv, g) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(g.w), h = Math.round(g.h);
      if (cv.width !== w * dpr || cv.height !== h * dpr) {
        cv.width = w * dpr;
        cv.height = h * dpr;
      }
      const ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return ctx;
    }
    const STEP = 430, YES = 980, LAST = 700;
    const stays = (k) => STOPS[k].human ? YES : k === N - 1 ? LAST : STEP;
    function useWalk(ready) {
      const reduce = !!useReducedMotion();
      const [k, setK] = useState(reduce ? N : -1);
      const [run, setRun] = useState(0);
      useEffect(() => {
        if (reduce) {
          setK(N);
          return;
        }
        if (!ready) return;
        setK(-1);
        const t = setTimeout(() => setK(0), 500);
        return () => clearTimeout(t);
      }, [ready, run, reduce]);
      useEffect(() => {
        if (reduce || k < 0 || k >= N) return;
        const t = setTimeout(() => setK(k + 1), stays(k));
        return () => clearTimeout(t);
      }, [k, reduce]);
      return { k, reduce, run, playing: k >= 0 && k < N, done: k >= N, replay: () => setRun((r) => r + 1) };
    }
    function useCount(on, to, reduce) {
      const [v, setV] = useState(on || reduce ? to : 0);
      useEffect(() => {
        if (reduce) {
          setV(to);
          return;
        }
        if (!on) {
          setV(0);
          return;
        }
        const c = animate(0, to, { duration: 0.7, ease: EASE, onUpdate: (x) => setV(x) });
        return () => c.stop();
      }, [on, reduce]);
      return v;
    }
    const Replay = ({ w, label = "Replay the batch" }) => w.reduce ? null : /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: w.replay }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16, stroke: 2 }), label);
    const SrStops = () => /* @__PURE__ */ React.createElement("ol", { className: "sr-only", "aria-label": "The nine stops" }, STOPS.map((s) => /* @__PURE__ */ React.createElement("li", { key: s.id }, s.t, ", ", names(s), ": ", s.did, ".")));
    function Caption({ w, money }) {
      const s = w.playing ? STOPS[w.k] : null;
      return /* @__PURE__ */ React.createElement("div", { className: cx("h30-caption", s && s.human && "human"), "aria-hidden": "true" }, w.k < 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, "1,360 packs, 47 days left."), /* @__PURE__ */ React.createElement("span", null, "Ten agents and one person take it from here.")) : s ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, w.k + 1, " of 9"), /* @__PURE__ */ React.createElement("b", null, s.t), /* @__PURE__ */ React.createElement("span", null, names(s)), /* @__PURE__ */ React.createElement("span", { className: "did" }, s.id === "report" ? `${inr(money)} recovered · 218 kg kept out of landfill` : s.did)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, "9 of 9"), /* @__PURE__ */ React.createElement("b", null, "Sold, not binned."), /* @__PURE__ */ React.createElement("span", { className: "did" }, inr(money), " recovered, instead of −", inr(BIN), " to destroy it")));
    }
    const AgentChip = ({ c, w }) => {
      const done = c.stop < w.k || w.done, now = c.stop === w.k && w.playing;
      return /* @__PURE__ */ React.createElement("span", { className: cx("h30-agent", c.human && "human", done && "on", now && "now", w.playing && !done && !now && "later") }, /* @__PURE__ */ React.createElement("span", { className: cx(now && "aura") }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: c.icon, size: 13, stroke: 2.2 })), c.name));
    };
    function Constellation() {
      const layer = useRef(null), cv = useRef(null);
      const P = usePlate(layer);
      const w = useWalk(P.ready);
      const dark = useDark();
      const money = useCount(w.k >= N - 1, RECOVERED, w.reduce);
      const field = useRef(null), state = useRef({ k: w.k, done: w.done, dark, P }), pointer = useRef({ x: -1e4, y: -1e4, until: 0 }), raf = useRef(0);
      state.current = { k: w.k, done: w.done, dark, P, reduce: w.reduce };
      const arc = (i) => {
        const a = (195 + i * 15) * Math.PI / 180, A = P.wide ? { cx: 0.522, cy: 0.7, rx: 0.38, ry: 0.36 } : { cx: 0.512, cy: 0.66, rx: 0.17, ry: 0.27 };
        return [A.cx + A.rx * Math.cos(a), A.cy + A.ry * Math.sin(a)];
      };
      const stars = P.g ? CREW.map((c, i) => {
        const [x, y] = P.at(arc(i));
        return { ...c, i, x, y };
      }) : [];
      useEffect(() => {
        if (!P.g) return;
        const rnd = seeded(30), n = P.wide ? 46 : 22, nodes = [], box = P.g;
        const carton = new Path2D("M" + poly(P.at, CARTON) + " Z"), probe = document.createElement("canvas").getContext("2d");
        while (nodes.length < n) {
          const x = rnd() * box.w, y = rnd() * box.h * 0.92;
          if (probe.isPointInPath(carton, x, y)) continue;
          if (P.wide && y < box.h * 0.31 && x > box.w * 0.14 && x < box.w * 0.86) continue;
          nodes.push({ x, y, vx: (rnd() - 0.5) * 0.32, vy: (rnd() - 0.5) * 0.32, r: 1.4 + rnd() * 1.4 });
        }
        field.current = nodes;
      }, [P.g && P.g.w, P.g && P.g.h]);
      const draw = () => {
        const c = cv.current, st = state.current;
        if (!c || !st.P.g || !field.current) return;
        const g = st.P.g, ctx = fitCanvas(c, g), link = Math.max(90, g.w * 0.085), k = st.done ? N : st.k;
        ctx.clearRect(0, 0, g.w, g.h);
        const ink = st.dark ? "236, 242, 238" : "13, 28, 21", lit = st.dark ? "#3ccb8a" : "#167a52", amber = st.dark ? "#f7c04a" : "#e8a722";
        const nodes = field.current, all = nodes.concat(stars);
        ctx.lineWidth = 1;
        for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
          const d = Math.hypot(all[a].x - all[b].x, all[a].y - all[b].y);
          if (d >= link) continue;
          ctx.strokeStyle = `rgba(${ink}, ${((st.dark ? 0.16 : 0.12) + (1 - d / link) * (st.dark ? 0.32 : 0.26)).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(all[a].x, all[a].y);
          ctx.lineTo(all[b].x, all[b].y);
          ctx.stroke();
        }
        const upto = stars.filter((s) => s.stop <= k && (s.stop < k || k >= N || st.k >= 0)).length;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        for (let i = 1; i < Math.min(upto, stars.length); i++) {
          ctx.strokeStyle = stars[i].human || stars[i - 1].human ? amber : lit;
          ctx.beginPath();
          ctx.moveTo(stars[i - 1].x, stars[i - 1].y);
          ctx.lineTo(stars[i].x, stars[i].y);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${ink}, ${st.dark ? 0.78 : 0.42})`;
        nodes.forEach((n) => {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        });
      };
      const step = () => {
        const st = state.current, g = st.P.g, p = pointer.current, now = performance.now(), live = st.k >= 0 && st.k < N || now < p.until;
        if (g && field.current && !st.reduce) field.current.forEach((n) => {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > g.w) n.vx *= -1;
          if (n.y < 0 || n.y > g.h * 0.92) n.vy *= -1;
          const d = Math.hypot(n.x - p.x, n.y - p.y);
          if (d < 200) {
            n.x -= (n.x - p.x) * 6e-3;
            n.y -= (n.y - p.y) * 6e-3;
          }
        });
        draw();
        raf.current = live ? requestAnimationFrame(step) : 0;
      };
      const wake = () => {
        if (!raf.current) raf.current = requestAnimationFrame(step);
      };
      useEffect(() => {
        if (w.reduce) {
          draw();
          return;
        }
        wake();
      }, [w.k, w.reduce, dark, P.g, field.current]);
      useEffect(() => () => cancelAnimationFrame(raf.current), []);
      useEffect(() => {
        const hero = layer.current && layer.current.closest(".hero");
        if (!hero || w.reduce) return;
        const move = (e) => {
          const r = layer.current.getBoundingClientRect();
          pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top, until: performance.now() + 700 };
          wake();
        };
        const out = () => {
          pointer.current = { x: -1e4, y: -1e4, until: 0 };
        };
        hero.addEventListener("pointermove", move);
        hero.addEventListener("pointerleave", out);
        return () => {
          hero.removeEventListener("pointermove", move);
          hero.removeEventListener("pointerleave", out);
        };
      }, [P.g, w.reduce]);
      const labelAt = (s) => {
        const top = Math.abs(s.i - 5) <= 2, out = P.wide ? s.i < 5 : s.i > 5;
        return { left: s.x, top: s.y, transform: top ? "translate(-50%, 12px)" : out ? "translate(calc(-100% - 10px), -50%)" : "translate(10px, -50%)" };
      };
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "h30-layer", ref: layer, style: P.style, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("canvas", { ref: cv, className: "h30-canvas" }), stars.map((s) => {
        const done = s.stop < w.k || w.done, now = s.stop === w.k && w.playing;
        return /* @__PURE__ */ React.createElement(React.Fragment, { key: s.name }, /* @__PURE__ */ React.createElement("span", { className: cx("h30-star", s.human && "human", done && "on", now && "now"), style: { left: s.x, top: s.y } }), (P.wide || now || w.done && s.human) && /* @__PURE__ */ React.createElement("span", { className: "h30-label", style: labelAt(s) }, /* @__PURE__ */ React.createElement(AgentChip, { c: s, w })));
      })), /* @__PURE__ */ React.createElement(SrStops, null), /* @__PURE__ */ React.createElement(Caption, { w, money }), /* @__PURE__ */ React.createElement("div", { className: "h30-ctl" }, /* @__PURE__ */ React.createElement(Replay, { w })));
    }
    function Gateway() {
      const layer = useRef(null), cv = useRef(null);
      const P = usePlate(layer);
      const w = useWalk(P.ready);
      const dark = useDark();
      const money = useCount(w.k >= N - 1, RECOVERED, w.reduce);
      const st = useRef({});
      st.current = { k: w.k, done: w.done, dark, P, reduce: w.reduce };
      const raf = useRef(0), sim = useRef(null), [got, setGot] = useState(w.reduce ? EXITS.map((e) => e.packs) : EXITS.map(() => 0));
      const [exW, setExW] = useState(0);
      useLayoutEffect(() => {
        const el = layer.current;
        if (!el || !P.wide) return;
        const fit = () => setExW(Math.max(0, ...[...el.querySelectorAll(".h30-exit")].map((c) => c.offsetWidth)));
        fit();
        document.fonts && document.fonts.ready.then(fit);
      }, [P.g && P.g.w, P.wide]);
      const geo = () => {
        if (P.wide) {
          const src2 = Array.from({ length: 22 }, (_, i) => [0.652 + i % 3 * 4e-3, 0.4 + i * (0.34 / 21)]);
          return { src: src2, gate: [0.748, 0.575], ex: EXITS.map((e, i) => [0.852, 0.37 + i * 0.1]), out: [0.04, -0.05] };
        }
        const src = Array.from({ length: 16 }, (_, i) => [0.41 + i * (0.22 / 15), 0.765 + Math.abs(i - 7.5) * -4e-3]);
        return { src, gate: [0.522, 0.855], ex: EXITS.map((e, i) => [0.36 + i * 0.075, 1.02]), out: [0, 0.03] };
      };
      const paths = () => {
        if (!P.g) return null;
        const G = geo(), edge = P.g.w * 0.978 - exW;
        const ex = G.ex.map((p) => {
          const a = P.at(p);
          return P.wide && exW ? [Math.min(a[0], edge), a[1]] : a;
        });
        const g0 = P.at(G.gate), gate = P.wide ? [Math.min(g0[0], ex[0][0] - 0.075 * P.g.w), g0[1]] : g0;
        const into = G.src.map((p) => {
          const a = P.at(p);
          return P.wide ? [a, [a[0] + 0.05 * P.g.w, a[1]], [gate[0] - 0.05 * P.g.w, gate[1]], gate] : [a, [a[0], a[1] + 0.04 * P.g.h], [gate[0], gate[1] - 0.06 * P.g.h], gate];
        });
        const out = ex.map((b) => {
          return P.wide ? [gate, [gate[0] + 0.05 * P.g.w, gate[1]], [b[0] - 0.06 * P.g.w, b[1]], b] : [gate, [gate[0], gate[1] + 0.03 * P.g.h], [b[0], b[1] - 0.04 * P.g.h], b];
        });
        return { into, out, gate };
      };
      const bez = (c, t) => {
        const u = 1 - t;
        return [0, 1].map((j) => u * u * u * c[0][j] + 3 * u * u * t * c[1][j] + 3 * u * t * t * c[2][j] + t * t * t * c[3][j]);
      };
      useEffect(() => {
        const rnd = seeded(31), ps2 = paths();
        if (!ps2) return;
        sim.current = { in: ps2.into.map((c, i) => ({ c, t: rnd() * 0.6, v: 6e-3 + rnd() * 6e-3, i })), out: [], sent: false };
      }, [P.g && P.g.w, P.g && P.g.h, w.run, exW]);
      const draw = () => {
        const s2 = st.current, g = s2.P.g, c = cv.current, ps2 = paths();
        if (!c || !g || !ps2 || !sim.current) return;
        const ctx = fitCanvas(c, g), k = s2.done ? N : s2.k, ink = s2.dark ? "255, 255, 255" : "18, 112, 74", decided = k >= 5;
        ctx.clearRect(0, 0, g.w, g.h);
        ctx.lineWidth = 1.2;
        ctx.setLineDash([1, 4]);
        ctx.strokeStyle = `rgba(${ink}, ${s2.dark ? 0.42 : 0.55})`;
        ps2.into.forEach((b) => {
          ctx.beginPath();
          ctx.moveTo(...b[0]);
          ctx.bezierCurveTo(...b[1], ...b[2], ...b[3]);
          ctx.stroke();
        });
        ps2.out.forEach((b, i) => {
          const e = EXITS[i], taken = decided && e.packs > 0;
          ctx.lineWidth = taken ? 2.4 : 1.4;
          ctx.setLineDash(taken ? [] : [5, 7]);
          ctx.strokeStyle = taken ? e.id === "kirana" ? s2.dark ? "#24a068" : "#178a58" : s2.dark ? "#8a6ee8" : "#7c5cd6" : e.bin ? s2.dark ? "rgba(217, 70, 67, 0.75)" : "rgba(210, 59, 59, 0.7)" : s2.dark ? "rgba(255, 255, 255, 0.4)" : "rgba(13, 28, 21, 0.4)";
          ctx.beginPath();
          ctx.moveTo(...b[0]);
          ctx.bezierCurveTo(...b[1], ...b[2], ...b[3]);
          ctx.stroke();
        });
        ctx.setLineDash([]);
        sim.current.in.forEach((p) => {
          if (p.t <= 0) return;
          const [x, y] = bez(p.c, Math.min(p.t, 1));
          ctx.fillStyle = s2.dark ? "rgba(255, 255, 255, 0.88)" : "#12704a";
          ctx.fillRect(x - 1.8, y - 1.8, 3.6, 3.6);
        });
        sim.current.out.forEach((p) => {
          if (p.t <= 0 || p.t >= 1) return;
          const [x, y] = bez(p.c, p.t);
          ctx.fillStyle = p.e === "kirana" ? s2.dark ? "#24a068" : "#178a58" : s2.dark ? "#8a6ee8" : "#7c5cd6";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      };
      const step = () => {
        const s2 = st.current, m = sim.current;
        if (!m) return;
        const k = s2.done ? N : s2.k, open = k >= 6;
        m.in.forEach((p) => {
          if (s2.reduce) return;
          if (p.t < 1) p.t += p.v * (p.t > 0.8 ? 0.45 : 1);
          else if (!open) p.t = 1;
          else {
            p.t = 0;
            p.v *= 0.9;
          }
        });
        if (open && !m.sent) {
          m.sent = true;
          const ps2 = paths(), order = [];
          for (let i = 0; i < 27; i++) order.push(i % 9 < 4 ? "kirana" : "expiresoon");
          let kq = 0, eq = 0;
          order.forEach((e, i) => {
            const idx = e === "kirana" ? 0 : 1;
            m.out.push({ c: ps2.out[idx], e, t: -i * 0.06, n: e === "kirana" ? ++kq : ++eq });
          });
          m.kTotal = kq;
          m.eTotal = eq;
        }
        let kIn = 0, eIn = 0;
        m.out.forEach((p) => {
          if (p.t < 1) p.t += 0.045;
          if (p.t >= 1) {
            if (p.e === "kirana") kIn++;
            else eIn++;
          }
        });
        if (m.sent) setGot(EXITS.map((e) => e.id === "kirana" ? Math.round(588 * kIn / m.kTotal) : e.id === "expiresoon" ? Math.round(772 * eIn / m.eTotal) : 0));
        draw();
        const moving = k >= 0 && k < N || m.out.some((p) => p.t < 1);
        raf.current = moving ? requestAnimationFrame(step) : 0;
      };
      useEffect(() => {
        if (w.reduce) {
          setGot(EXITS.map((e) => e.packs));
          if (sim.current) sim.current.in.forEach((p) => {
            p.t = 1;
          });
          draw();
          return;
        }
        if (w.k < 0) setGot(EXITS.map(() => 0));
        if (!raf.current) raf.current = requestAnimationFrame(step);
      }, [w.k, w.reduce, dark, P.g, sim.current]);
      useEffect(() => () => cancelAnimationFrame(raf.current), []);
      const ps = P.g && paths(), s = w.playing ? STOPS[w.k] : null, approved = w.k >= 6 || w.done;
      const gateIcon = s ? s.who[Math.floor(s.who.length / 2)][1] : approved ? "check" : "hand";
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "h30-layer", ref: layer, style: P.style, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("canvas", { ref: cv, className: "h30-canvas" }), ps && /* @__PURE__ */ React.createElement("span", { className: cx("h30-gate", s && s.human && "human", approved && "open"), style: { left: ps.gate[0], top: ps.gate[1] } }, /* @__PURE__ */ React.createElement("span", { className: cx(s && "aura") }, /* @__PURE__ */ React.createElement(Icon, { name: gateIcon, size: 18, stroke: 2.2 })), /* @__PURE__ */ React.createElement("b", { className: "h30-gate-who" }, s ? names(s) : w.k < 0 ? "the gate" : "Ten agents · one yes")), ps && P.wide && EXITS.map((e, i) => /* @__PURE__ */ React.createElement("span", { key: e.id, className: cx("h30-exit", e.id, e.packs && (w.k >= 5 || w.done) && "taken"), style: { left: ps.out[i][3][0], top: ps.out[i][3][1] } }, /* @__PURE__ */ React.createElement("i", { style: { background: e.ink || (e.bin ? "var(--ch-writeoff)" : "var(--fg-4)") } }), /* @__PURE__ */ React.createElement("b", null, e.name), /* @__PURE__ */ React.createElement("span", { style: e.packs ? { minWidth: `${String(e.packs).length + 6}ch` } : null }, e.packs ? `${got[i].toLocaleString("en-IN")} packs` : e.note)))), /* @__PURE__ */ React.createElement(SrStops, null), /* @__PURE__ */ React.createElement(Caption, { w, money }), !P.wide && /* @__PURE__ */ React.createElement("ul", { className: "h30-exits", "aria-label": "Where the packs went" }, EXITS.map((e, i) => /* @__PURE__ */ React.createElement("li", { key: e.id, className: cx("h30-exit", e.id, e.packs && (w.k >= 5 || w.done) && "taken") }, /* @__PURE__ */ React.createElement("i", { style: { background: e.ink || (e.bin ? "var(--ch-writeoff)" : "var(--fg-4)") } }), /* @__PURE__ */ React.createElement("b", null, e.name), /* @__PURE__ */ React.createElement("span", null, e.packs ? `${got[i].toLocaleString("en-IN")} packs` : e.note)))), P.wide && /* @__PURE__ */ React.createElement("ul", { className: "sr-only", "aria-label": "Where the packs went" }, EXITS.map((e) => /* @__PURE__ */ React.createElement("li", { key: e.id }, e.name, ": ", e.packs ? `${e.packs} packs` : e.note))), /* @__PURE__ */ React.createElement("div", { className: "h30-ctl" }, /* @__PURE__ */ React.createElement(Replay, { w })));
    }
    const T = 2 * Math.PI / CREW.length;
    const frontOf = (k) => {
      if (k < 0) return -1.5;
      if (k >= N) return CREW.length - 1;
      const ids = CREW.map((c, j) => c.stop === k ? j : -1).filter((j) => j >= 0);
      return ids[Math.floor(ids.length / 2)];
    };
    function Crew() {
      const layer = useRef(null);
      const P = usePlate(layer);
      const w = useWalk(P.ready);
      const [rot, setRot] = useState(frontOf(w.k) * T);
      const rotNow = useRef(rot);
      useEffect(() => {
        const to = frontOf(w.k) * T;
        if (w.reduce) {
          rotNow.current = to;
          setRot(to);
          return;
        }
        const c = animate(rotNow.current, to, { duration: w.k < 0 ? 0.5 : 0.42, ease: [0.45, 0, 0.4, 1], onUpdate: (v) => {
          rotNow.current = v;
          setRot(v);
        } });
        return () => c.stop();
      }, [w.k, w.reduce]);
      const money = useCount(w.k >= N - 1, RECOVERED, w.reduce);
      const g = P.g;
      const ring = g && (() => {
        const [x, y] = P.at(P.wide ? [0.522, 0.565] : [0.512, 0.565]);
        return { x, y, rx: (P.wide ? 0.245 : 0.178) * g.nw * g.s, ry: (P.wide ? 0.13 : 0.12) * g.nh * g.s };
      })();
      const tiles = g ? CREW.map((c, j) => {
        const a = j * T - rot, d = Math.cos(a), x = ring.x + ring.rx * Math.sin(a), y = ring.y + ring.ry * d;
        const done = c.stop < w.k || w.done, now = c.stop === w.k && w.playing;
        return { ...c, j, x, y, d, done, now, scale: (0.8 + 0.2 * (d + 1) / 2) * (now ? 1.14 : 1) };
      }) : [];
      const outline = g ? "M0 0 H" + g.w + " V" + g.h + " H0 Z M" + poly(P.at, CARTON) + " Z" : "";
      const reached = tiles.filter((t) => t.done || t.now).length;
      const threads = tiles.slice(1, Math.max(1, reached)).map((t, i) => [tiles[i], t]);
      const Tile = (t) => /* @__PURE__ */ React.createElement(
        "span",
        {
          key: t.name,
          className: cx("h30-tile", t.human && "human", t.done && "on", w.playing && !t.done && !t.now && "later", !P.wide && !t.now && !(w.done && t.j === CREW.length - 1) && "icon"),
          style: { transform: `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px) translate(-50%, -50%) scale(${t.scale.toFixed(3)})`, zIndex: Math.round((t.d + 1) * 50) + (t.now ? 200 : 0) }
        },
        /* @__PURE__ */ React.createElement("span", { className: cx(t.now && "aura") }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: 13, stroke: 2.2 })), t.name)
      );
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "h30-layer", ref: layer, style: P.style, "aria-hidden": "true" }, g && /* @__PURE__ */ React.createElement("svg", null, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("clipPath", { id: "h30-behind" }, /* @__PURE__ */ React.createElement("path", { clipRule: "evenodd", d: outline }))), /* @__PURE__ */ React.createElement("ellipse", { className: "h30-ring", cx: ring.x, cy: ring.y, rx: ring.rx, ry: ring.ry, clipPath: "url(#h30-behind)" }), /* @__PURE__ */ React.createElement("path", { className: "h30-ring", d: `M${ring.x - ring.rx} ${ring.y} A${ring.rx} ${ring.ry} 0 0 0 ${ring.x + ring.rx} ${ring.y}` })), g && /* @__PURE__ */ React.createElement("svg", { className: "h30-threads" }, threads.map(([a, b]) => /* @__PURE__ */ React.createElement("line", { key: a.name + b.name, className: cx("h30-thread", (a.human || b.human) && "human"), x1: a.x, y1: a.y, x2: b.x, y2: b.y, clipPath: a.d < 0 || b.d < 0 ? "url(#h30-behind)" : void 0 }))), g && /* @__PURE__ */ React.createElement("div", { className: "h30-back", style: { clipPath: `path(evenodd, '${outline}')` } }, tiles.filter((t) => t.d < 0).map(Tile)), g && /* @__PURE__ */ React.createElement("div", { className: "h30-front" }, tiles.filter((t) => t.d >= 0).map(Tile))), /* @__PURE__ */ React.createElement(SrStops, null), /* @__PURE__ */ React.createElement(Caption, { w, money }), /* @__PURE__ */ React.createElement("div", { className: "h30-ctl" }, /* @__PURE__ */ React.createElement(Replay, { w })));
    }
    const VIEWS = { constellation: Constellation, gateway: Gateway, crew: Crew };
    document.querySelectorAll("[data-hero]").forEach((el) => {
      const V = VIEWS[el.getAttribute("data-hero")];
      if (V) ReactDOM.createRoot(el).render(/* @__PURE__ */ React.createElement(V, null));
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

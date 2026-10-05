window.SC32_GEO = {
  "day": "../img/journey.webp",
  "night": "../img/journey-night.webp",
  "approveDay": "../../../site/assets/plates/approve.webp",
  "approveNight": "../../../site/assets/plates/approve-night.webp",
  "stages": {
    "factory": [
      0.135,
      0.505
    ],
    "godown": [
      0.535,
      0.47
    ],
    "shops": [
      0.795,
      0.445
    ]
  },
  "stagesNarrow": {
    "factory": [
      0.135,
      0.505
    ],
    "godown": [
      0.52,
      0.47
    ],
    "shops": [
      0.875,
      0.445
    ]
  },
  "route": [
    [
      0.205,
      0.69
    ],
    [
      0.26,
      0.712
    ],
    [
      0.36,
      0.716
    ],
    [
      0.455,
      0.722
    ],
    [
      0.56,
      0.728
    ],
    [
      0.645,
      0.722
    ],
    [
      0.7,
      0.705
    ],
    [
      0.78,
      0.7
    ],
    [
      0.86,
      0.71
    ]
  ],
  "routeGodown": 3,
  "flag": [
    0.53,
    0.555
  ],
  "buyer": [
    0.97,
    0.37
  ],
  "buyerChip": [
    0.985,
    0.37
  ],
  "sky": [
    0.03,
    0.36
  ],
  "stars": {
    "wide": {
      "data": [
        0.035,
        0.215
      ],
      "watcher": [
        0.128,
        0.2582
      ],
      "vision": [
        0.221,
        0.2918
      ],
      "valuer": [
        0.314,
        0.3158
      ],
      "router": [
        0.407,
        0.3302
      ],
      "you": [
        0.5,
        0.335
      ],
      "lister": [
        0.593,
        0.3302
      ],
      "outreach": [
        0.686,
        0.3158
      ],
      "negotiator": [
        0.779,
        0.2918
      ],
      "paperwork": [
        0.872,
        0.2582
      ],
      "impact": [
        0.965,
        0.215
      ]
    },
    "narrow": {
      "data": [
        0.13,
        0.13
      ],
      "watcher": [
        0.204,
        0.1804
      ],
      "vision": [
        0.278,
        0.2196
      ],
      "valuer": [
        0.352,
        0.2476
      ],
      "router": [
        0.426,
        0.2644
      ],
      "you": [
        0.5,
        0.27
      ],
      "lister": [
        0.574,
        0.2644
      ],
      "outreach": [
        0.648,
        0.2476
      ],
      "negotiator": [
        0.722,
        0.2196
      ],
      "paperwork": [
        0.796,
        0.1804
      ],
      "impact": [
        0.87,
        0.13
      ]
    }
  },
  "labels": {
    "wide": {
      "data": "above",
      "watcher": "above",
      "paperwork": "above",
      "impact": "above"
    },
    "narrow": {
      "data": "above",
      "watcher": "above",
      "vision": "above",
      "valuer": "above",
      "router": "above",
      "you": "above",
      "lister": "above",
      "outreach": "above",
      "negotiator": "above",
      "paperwork": "above",
      "impact": "above"
    }
  },
  "ring": {
    "make": {
      "x": 0,
      "y": 0.27,
      "w": 0.33,
      "ar": 0.5581
    },
    "stock": {
      "x": 0.3,
      "y": 0.3,
      "w": 0.33,
      "ar": 0.5581
    },
    "risk": {
      "x": 0.36,
      "y": 0.4,
      "w": 0.24,
      "ar": 0.5581
    },
    "yes": {
      "plate": "approve",
      "x": 0.08,
      "y": 0.08,
      "w": 0.84,
      "ar": 0.7105
    },
    "sold": {
      "x": 0.62,
      "y": 0.3,
      "w": 0.38,
      "ar": 0.5581
    }
  },
  "camera": {
    "make": {
      "x": 0.15,
      "y": 0.6399999999999999,
      "z": 1.6
    },
    "stock": {
      "x": 0.47,
      "y": 0.6399999999999999,
      "z": 1.6
    },
    "risk": {
      "x": 0.47,
      "y": 0.6399999999999999,
      "z": 1.75
    },
    "route": {
      "x": 0.47,
      "y": 0.6200000000000001,
      "z": 1.5
    },
    "yes": {
      "x": 0.3,
      "y": 0.6100000000000001,
      "z": 1.25
    },
    "sell": {
      "x": 0.78,
      "y": 0.6399999999999999,
      "z": 1.6
    },
    "report": {
      "x": 0.5,
      "y": 0.5,
      "z": 1
    },
    "rest": {
      "x": 0.5,
      "y": 0.5,
      "z": 1
    }
  },
  "batch": {
    "factory": [
      0.17,
      0.62
    ],
    "godown": [
      0.47,
      0.62
    ],
    "shops": [
      0.8,
      0.64
    ]
  }
};
(function() {
  function boot() {
    if (!window.React || !window.ReactDOM || !window.Motion) return;
    const { useState, useEffect, useRef, useLayoutEffect, useMemo } = React;
    const { motion, AnimatePresence, useReducedMotion, animate } = window.Motion;
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
    const num = (n) => Math.round(n).toLocaleString("en-IN");
    const inr = (n) => (n < 0 ? "−₹" : "₹") + num(Math.abs(n));
    const EASE = [0.22, 1, 0.36, 1];
    const F = { packs: 1840, perDay: 12, atRisk: 1360, daysLeft: 47, kiranas: 588, shops: 31, buyer: 772, counter: "₹14.20", planNet: 21770, recovered: 21152, bin: 26330, kg: 218 };
    const STAGES = [
      { id: "factory", t: "Manufacturer", icon: "factory" },
      { id: "godown", t: "Distributor · stockist", short: "Distributor", icon: "warehouse" },
      { id: "shops", t: "Retailers", icon: "store" }
    ];
    const AGENTS = {
      data: { name: "Data", icon: "database" },
      watcher: { name: "Watcher", icon: "eye" },
      vision: { name: "Vision", icon: "scan-line" },
      valuer: { name: "Valuer", icon: "scale" },
      router: { name: "Router", icon: "route" },
      you: { name: "You", icon: "hand", human: true },
      lister: { name: "Lister", icon: "store" },
      outreach: { name: "Outreach", icon: "send" },
      negotiator: { name: "Negotiator", icon: "gavel" },
      paperwork: { name: "Paperwork", icon: "file-text" },
      impact: { name: "Impact", icon: "leaf" }
    };
    const BEATS = [
      { id: "make", at: "factory", t: "Made", did: `The manufacturer ships ${num(F.packs)} packs to its distributor`, who: [], ms: 600 },
      { id: "stock", at: "godown", t: "Stocked", did: `${num(F.packs)} packs in the distributor's godown, selling ${F.perDay} a day`, who: [], ms: 500 },
      { id: "risk", at: "godown", t: "At risk", did: `${num(F.atRisk)} packs won't sell in the ${F.daysLeft} days left`, who: ["data", "watcher", "vision"], ms: 700 },
      { id: "route", at: "godown", t: "Priced and split", did: `Five exits priced · ${F.kiranas} to ${F.shops} kiranas, ${F.buyer} to one buyer`, who: ["valuer", "router"], ms: 600 },
      { id: "yes", at: "factory", t: "One yes", did: `You approve in one tap · ${inr(F.planNet)} on screen`, who: ["you"], human: true, ms: 900 },
      { id: "sell", at: "shops", t: "Sold", did: `${F.kiranas} packs to ${F.shops} kiranas · ${F.buyer} to a buyer, countered to ${F.counter}`, who: ["lister", "outreach", "negotiator"], ms: 700 },
      { id: "report", at: "factory", t: "Settled", did: `${inr(F.recovered)} recovered · ${F.kg} kg kept out of landfill`, who: ["paperwork", "impact"], ms: 700 }
    ];
    const NB = BEATS.length;
    const beatOf = (id) => BEATS.findIndex((b) => b.id === id);
    const names = (b) => b.who.map((w) => AGENTS[w].name).join(" · ");
    const CREW = BEATS.flatMap((b, i) => b.who.map((id) => ({ id, ...AGENTS[id], beat: i, at: b.at })));
    const RESULT = `${inr(F.recovered)} recovered, instead of ${inr(-F.bin)} to destroy it`;
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
          const w = img.offsetWidth || r.width, h = img.offsetHeight || r.height;
          const nw = img.naturalWidth || +img.getAttribute("width"), nh = img.naturalHeight || +img.getAttribute("height");
          const [px, py] = (getComputedStyle(img).objectPosition || "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
          const s = Math.max(w / nw, h / nh);
          const pic = img.closest(".hero-scene");
          const o = pic.getBoundingClientRect();
          setG({ left: pic.offsetLeft, top: pic.offsetTop, w, h, s, ox: (w - nw * s) * px, oy: (h - nh * s) * py, nw, nh, hero: hero.getBoundingClientRect().width, ow: o.width });
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
    function along(pts, t) {
      const seg = [];
      let L = 0;
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        seg.push(d);
        L += d;
      }
      let s = Math.max(0, Math.min(1, t)) * L;
      for (let i = 0; i < seg.length; i++) {
        if (s <= seg[i] || i === seg.length - 1) {
          const u = seg[i] ? Math.min(1, s / seg[i]) : 0;
          return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
        }
        s -= seg[i];
      }
      return pts[pts.length - 1];
    }
    function useWalk(ready) {
      const reduce = !!useReducedMotion();
      const [k, setK] = useState(reduce ? NB : -1);
      const [run, setRun] = useState(0);
      useEffect(() => {
        if (reduce) {
          setK(NB);
          return;
        }
        if (!ready) return;
        setK(-1);
        const t = setTimeout(() => setK(0), 500);
        return () => clearTimeout(t);
      }, [ready, run, reduce]);
      useEffect(() => {
        if (reduce || k < 0 || k >= NB) return;
        const t = setTimeout(() => setK(k + 1), BEATS[k].ms);
        return () => clearTimeout(t);
      }, [k, reduce]);
      return { k, reduce, run, playing: k >= 0 && k < NB, done: k >= NB, beat: k >= 0 && k < NB ? BEATS[k] : null, go: (i) => setK(i), replay: () => setRun((r) => r + 1) };
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
    const crewState = (c, w) => ({ done: c.beat < w.k || w.done, now: c.beat === w.k && w.playing });
    const Replay = ({ w }) => w.reduce ? null : /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: w.replay }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16, stroke: 2 }), "Replay the journey");
    const SrJourney = () => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("ol", { className: "sr-only", "aria-label": "One batch's journey" }, BEATS.map((b) => /* @__PURE__ */ React.createElement("li", { key: b.id }, b.t, b.who.length ? `, ${names(b)}` : "", ": ", b.did, "."))), /* @__PURE__ */ React.createElement("p", { className: "sr-only" }, "Sold, not binned: ", RESULT, "."));
    function Caption({ w, money, className }) {
      const b = w.beat;
      return /* @__PURE__ */ React.createElement("div", { className: cx("h32-caption", b && b.human && "human", className), "aria-hidden": "true" }, w.k < 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, num(F.packs), " packs leave the factory."), /* @__PURE__ */ React.createElement("span", null, "Follow them to the shelf.")) : b ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, w.k + 1, " of ", NB), /* @__PURE__ */ React.createElement("b", null, b.t), b.who.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "who" }, names(b)), /* @__PURE__ */ React.createElement("span", { className: "did" }, b.id === "report" ? `${inr(money)} recovered · ${F.kg} kg kept out of landfill` : b.did)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, NB, " of ", NB), /* @__PURE__ */ React.createElement("b", null, "Sold, not binned."), /* @__PURE__ */ React.createElement("span", { className: "did" }, RESULT)));
    }
    const AgentChip = ({ c, w, compact, iconOnly }) => {
      const { done, now } = crewState(c, w);
      return /* @__PURE__ */ React.createElement("span", { className: cx("h32-agent", c.human && "human", done && "on", now && "now", w.playing && !done && !now && "later", (iconOnly || compact && !now) && "icon") }, /* @__PURE__ */ React.createElement("span", { className: cx(now && "aura") }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: c.icon, size: 13, stroke: 2.2 })), c.name));
    };
    const StagePin = ({ s, x, y, w, compact, short, edge }) => {
      const here = w.beat && w.beat.at === s.id;
      return /* @__PURE__ */ React.createElement("span", { className: cx("h32-pin", here && "here", compact && "compact", edge && "edge-" + edge), style: { left: x, top: y } }, /* @__PURE__ */ React.createElement("span", { className: "h32-pin-body" }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: s.icon, size: 14, stroke: 2 })), /* @__PURE__ */ React.createElement("b", null, short && s.short || s.t)), /* @__PURE__ */ React.createElement("span", { className: "h32-pin-stem" }));
    };
    window.SC32 = {
      React,
      useState,
      useEffect,
      useRef,
      useLayoutEffect,
      useMemo,
      motion,
      AnimatePresence,
      animate,
      cx,
      Icon,
      num,
      inr,
      EASE,
      F,
      STAGES,
      AGENTS,
      BEATS,
      NB,
      beatOf,
      names,
      CREW,
      RESULT,
      usePlate,
      useDark,
      seeded,
      fitCanvas,
      along,
      useWalk,
      useCount,
      crewState,
      Replay,
      SrJourney,
      Caption,
      AgentChip,
      StagePin
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
(function() {
  function boot() {
    const S = window.SC32;
    if (!S) return;
    const {
      React,
      useState,
      useEffect,
      useRef,
      useMemo,
      animate,
      cx,
      Icon,
      num,
      inr,
      F,
      STAGES,
      AGENTS,
      BEATS,
      NB,
      beatOf,
      names,
      CREW,
      RESULT,
      usePlate,
      useDark,
      seeded,
      fitCanvas,
      along,
      useWalk,
      useCount,
      crewState,
      Replay,
      SrJourney,
      Caption,
      AgentChip,
      StagePin
    } = S;
    const GEO = window.SC32_GEO;
    const stageAt = (id, wide) => (wide ? GEO.stages : GEO.stagesNarrow)[id];
    const labelSide = (s, wide) => GEO.labels[wide ? "wide" : "narrow"][s.id] || "below";
    const labelStyle = (s, side) => ({ left: s.x, top: s.y, transform: side === "left" ? "translate(calc(-100% - 10px), -50%)" : side === "right" ? "translate(10px, -50%)" : side === "above" ? "translate(-50%, calc(-100% - 10px))" : "translate(-50%, 10px)" });
    function Constellation() {
      const layer = useRef(null), cv = useRef(null);
      const P = usePlate(layer);
      const w = useWalk(P.ready);
      const dark = useDark();
      const money = useCount(w.k >= beatOf("report"), F.recovered, w.reduce);
      const st = useRef({});
      st.current = { w, dark, P };
      const raf = useRef(0), t0 = useRef(0), field = useRef(null), pointer = useRef({ x: -1e4, y: -1e4, until: 0 });
      const stars = P.g ? CREW.map((c, i) => {
        const [x, y] = P.at(GEO.stars[P.wide ? "wide" : "narrow"][c.id]);
        return { ...c, i, x, y };
      }) : [];
      useEffect(() => {
        if (!P.g) return;
        const rnd = seeded(32), n = 0, out = [], g = P.g, [y0, y1] = GEO.sky;
        for (let tries = 0; out.length < n && tries < 4e3; tries++) {
          const x = rnd() * g.w, y = (y0 + rnd() * (y1 - y0)) * g.nh * g.s + g.oy;
          if (P.wide && x > g.w * 0.12 && x < g.w * 0.88) continue;
          out.push({ x, y, vx: (rnd() - 0.5) * 0.26, vy: (rnd() - 0.5) * 0.2, r: 1.2 + rnd() * 1.3 });
        }
        field.current = out;
      }, [P.g && P.g.w, P.g && P.g.h]);
      const route = () => GEO.route.map((p) => P.at(p));
      const draw = (now) => {
        const c = cv.current, s = st.current, g = s.P.g;
        if (!c || !g || !field.current) return;
        const ctx = fitCanvas(c, g), k = s.w.done ? NB : s.w.k, el = now - t0.current;
        ctx.clearRect(0, 0, g.w, g.h);
        const ink = s.dark ? "236, 242, 238" : "13, 28, 21", lit = s.dark ? "#3ccb8a" : "#167a52", amber = s.dark ? "#f7c04a" : "#e8a722", violet = s.dark ? "#8a6ee8" : "#7c5cd6";
        const nodes = field.current, link = Math.max(80, g.w * 0.07);
        ctx.lineWidth = 1;
        for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
          const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
          if (d >= link) continue;
          ctx.strokeStyle = `rgba(${ink}, ${((s.dark ? 0.12 : 0.1) + (1 - d / link) * (s.dark ? 0.26 : 0.2)).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(nodes[a].x, nodes[a].y);
          ctx.lineTo(nodes[b].x, nodes[b].y);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${ink}, ${s.dark ? 0.7 : 0.36})`;
        nodes.forEach((n) => {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.lineWidth = 2.25;
        ctx.lineCap = "round";
        const reached = stars.filter((t) => t.beat < k || t.beat === k && s.w.playing);
        for (let i = 1; i < reached.length; i++) {
          const a = reached[i - 1], b = reached[i], fresh = b.beat === k && s.w.playing ? Math.min(1, el / 320) : 1;
          const mx = (a.x + b.x) / 2, lift = Math.min(90, Math.abs(b.x - a.x) * 0.22), my = Math.min(a.y, b.y) - lift;
          ctx.strokeStyle = a.human || b.human ? amber : lit;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          if (fresh >= 1) ctx.quadraticCurveTo(mx, my, b.x, b.y);
          else {
            const qx = a.x + (mx - a.x) * fresh, qy = a.y + (my - a.y) * fresh, rx = mx + (b.x - mx) * fresh, ry = my + (b.y - my) * fresh;
            ctx.quadraticCurveTo(qx, qy, qx + (rx - qx) * fresh, qy + (ry - qy) * fresh);
          }
          ctx.stroke();
        }
        const R = route(), mid = GEO.routeGodown;
        const pack = (x, y, color, r = 3.4) => {
          ctx.fillStyle = color;
          ctx.strokeStyle = s.dark ? "rgba(7, 11, 9, 0.9)" : "#ffffff";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        };
        if (k === beatOf("make") || k === beatOf("stock")) {
          const span = k === beatOf("make") ? el / 1100 : 0.55 + el / 1100;
          for (let i = 0; i < 6; i++) {
            const t = span - i * 0.09;
            if (t > 0 && t < 1) {
              const [x, y] = along(R.slice(0, mid + 1), t);
              pack(x, y, s.dark ? "#ecf2ee" : "#0d1c15", 3);
            }
          }
        }
        if (k === beatOf("sell")) {
          for (let i = 0; i < 8; i++) {
            const t = el / 650 - i * 0.1;
            if (t > 0 && t < 1) {
              const [x, y] = along(R.slice(mid), t);
              pack(x, y, lit);
            }
          }
          const [gx, gy] = P.at(GEO.stages.godown), [bx, by] = P.at(GEO.buyer);
          for (let i = 0; i < 6; i++) {
            const t = el / 650 - i * 0.12;
            if (t > 0 && t < 1) {
              const u = 1 - t;
              const cxp = (gx + bx) / 2, cyp = Math.min(gy, by) - g.h * 0.18;
              pack(u * u * gx + 2 * u * t * cxp + t * t * bx, u * u * gy + 2 * u * t * cyp + t * t * by, violet);
            }
          }
        }
      };
      const step = (now) => {
        const s = st.current, g = s.P.g, p = pointer.current, el = now - t0.current, live = s.w.playing || now < p.until;
        if (g && field.current && !s.w.reduce) field.current.forEach((n) => {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > g.w) n.vx *= -1;
          const [y0, y1] = GEO.sky;
          if (n.y < g.oy + y0 * g.nh * g.s || n.y > g.oy + y1 * g.nh * g.s) n.vy *= -1;
          const d = Math.hypot(n.x - p.x, n.y - p.y);
          if (d < 200) {
            n.x -= (n.x - p.x) * 6e-3;
            n.y -= (n.y - p.y) * 6e-3;
          }
        });
        draw(now);
        raf.current = live ? requestAnimationFrame(step) : 0;
      };
      const wake = () => {
        if (!raf.current) raf.current = requestAnimationFrame(step);
      };
      useEffect(() => {
        t0.current = performance.now();
        if (w.reduce) {
          draw(t0.current + 1e4);
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
      const risk = w.k >= beatOf("risk") && w.k < beatOf("sell") && !w.done, cleared = w.k >= beatOf("sell") && !w.done, sold = w.k >= beatOf("sell") || w.done;
      const flagAt = P.g && P.at(GEO.flag), buyerAt = P.g && P.at(GEO.buyerChip);
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "h32-layer", ref: layer, style: P.style, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("canvas", { ref: cv, className: "h32-canvas" }), P.g && STAGES.map((s) => {
        const [x, y] = P.at(stageAt(s.id, P.wide));
        return /* @__PURE__ */ React.createElement(StagePin, { key: s.id, s, x, y, w, compact: !P.wide, short: !P.wide, edge: x < 90 ? "start" : x > P.g.w - 90 ? "end" : null });
      }), stars.map((s) => {
        const { done, now } = crewState(s, w), show = P.wide || s.human && (now || w.done);
        return /* @__PURE__ */ React.createElement(React.Fragment, { key: s.id }, /* @__PURE__ */ React.createElement("span", { className: cx("h32-star", s.human && "human", done && "on", now && "now"), style: { left: s.x, top: s.y } }), show && /* @__PURE__ */ React.createElement("span", { className: "h32-label", style: labelStyle(s, labelSide(s, P.wide)) }, /* @__PURE__ */ React.createElement(AgentChip, { c: s, w })));
      }), P.g && (risk || cleared) && /* @__PURE__ */ React.createElement("span", { className: cx("h32-flag", risk ? "risk" : "clear"), style: { left: flagAt[0], top: flagAt[1], translate: "-50% -100%" } }, /* @__PURE__ */ React.createElement("i", null), risk ? /* @__PURE__ */ React.createElement("span", null, num(F.atRisk), " packs · ", F.daysLeft, " days left") : /* @__PURE__ */ React.createElement("span", null, "Cleared · none to the bin")), P.g && sold && P.wide && /* @__PURE__ */ React.createElement("span", { className: "h32-flag buyer", style: { left: buyerAt[0], top: buyerAt[1], translate: "-100% -50%" } }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("b", null, "A buyer elsewhere"), /* @__PURE__ */ React.createElement("span", null, "· ", F.buyer, " packs"))), /* @__PURE__ */ React.createElement(SrJourney, null), /* @__PURE__ */ React.createElement(Caption, { w, money }), /* @__PURE__ */ React.createElement("div", { className: "h32-ctl" }, /* @__PURE__ */ React.createElement(Replay, { w })));
    }
    const CHAPTERS = [
      { id: "make", t: "Made", at: "factory", beats: ["make"] },
      { id: "stock", t: "Stocked", at: "godown", beats: ["stock"] },
      { id: "risk", t: "At risk", at: "godown", beats: ["risk", "route"] },
      { id: "yes", t: "One yes", at: "factory", beats: ["yes"] },
      { id: "sold", t: "Sold", at: "shops", beats: ["sell", "report"] }
    ];
    const chapterOf = (k) => k < 0 ? 0 : k >= NB ? CHAPTERS.length - 1 : CHAPTERS.findIndex((c) => c.beats.includes(BEATS[k].id));
    function Ring() {
      const box = useRef(null);
      const [ready, setReady] = useState(false);
      const w = useWalk(ready);
      const dark = useDark();
      const money = useCount(w.k >= beatOf("report"), F.recovered, w.reduce);
      const [width, setWidth] = useState(0);
      useEffect(() => {
        const el = box.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setWidth(el.clientWidth));
        ro.observe(el);
        setWidth(el.clientWidth);
        const imgs = [...el.closest(".hero").querySelectorAll(".hero-scene img")];
        const shown = imgs.find((i) => i.getClientRects().length) || imgs[0];
        if (shown && shown.complete && shown.naturalWidth) setReady(true);
        else imgs.forEach((i) => i.addEventListener("load", () => setReady(true), { once: true }));
        return () => ro.disconnect();
      }, []);
      const ch = chapterOf(w.k);
      const STEP = 45;
      const [turn, setTurn] = useState(-ch * STEP);
      const turnNow = useRef(turn);
      useEffect(() => {
        const to = -ch * STEP;
        if (w.reduce) {
          turnNow.current = to;
          setTurn(to);
          return;
        }
        const c = animate(turnNow.current, to, { duration: 0.62, ease: [0.65, 0, 0.35, 1], onUpdate: (v) => {
          turnNow.current = v;
          setTurn(v);
        } });
        return () => c.stop();
      }, [ch, w.reduce]);
      const phone = width > 0 && width < 600;
      const W = phone ? Math.min(290, width * 0.74) : Math.min(540, width * 0.38), H = W * 0.72, R = W / 0.7, SL = phone ? 10 : 14;
      const img = (id) => GEO.ring[id].plate === "approve" ? dark ? GEO.approveNight : GEO.approveDay : dark ? GEO.night : GEO.day;
      const cur = CHAPTERS[ch];
      const crew = CREW.filter((c) => cur.beats.includes(BEATS[c.beat].id));
      const pick = (i) => {
        if (w.reduce) return;
        const b = beatOf(CHAPTERS[i].beats[CHAPTERS[i].beats.length - 1]);
        w.go(b);
      };
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "h32-ring-stage", ref: box, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "h32-ring", style: { "--r": R + "px", width: W, height: H, transform: `translateZ(${-R}px) rotateY(${turn}deg)` } }, CHAPTERS.map((c, i) => {
        const crop = GEO.ring[c.id];
        return Array.from({ length: SL }, (_, j) => {
          const a = i * STEP + ((j + 0.5) / SL - 0.5) * (W / R) * (180 / Math.PI), sw = W / SL + 0.6;
          return /* @__PURE__ */ React.createElement("span", { key: c.id + j, className: cx("h32-slice", i === ch && "front"), style: {
            width: sw,
            height: H,
            transform: `rotateY(${a}deg) translateZ(${R}px)`,
            backgroundImage: `url("${img(c.id)}")`,
            backgroundSize: `${W / crop.w}px auto`,
            backgroundPosition: `${-(crop.x * W / crop.w) - j * (W / SL)}px ${-(crop.y * W / crop.w * crop.ar)}px`
          } });
        });
      })), /* @__PURE__ */ React.createElement("div", { className: "h32-ring-front", style: { width: W, height: H } }, /* @__PURE__ */ React.createElement("span", { className: "h32-chapter" }, /* @__PURE__ */ React.createElement("b", null, cur.t), cur.id === "risk" && /* @__PURE__ */ React.createElement("span", { className: "h32-flag risk inline" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("span", null, num(F.atRisk), " packs · ", F.daysLeft, " days left")), cur.id === "sold" && /* @__PURE__ */ React.createElement("span", { className: "h32-flag clear inline" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("span", null, "Cleared · none to the bin"))), /* @__PURE__ */ React.createElement("span", { className: "h32-ring-crew" }, crew.map((c) => /* @__PURE__ */ React.createElement(AgentChip, { key: c.id, c, w, compact: phone }))))), /* @__PURE__ */ React.createElement(SrJourney, null), /* @__PURE__ */ React.createElement("ol", { className: "h32-steps", "aria-label": "The journey's chapters" }, CHAPTERS.map((c, i) => /* @__PURE__ */ React.createElement("li", { key: c.id }, /* @__PURE__ */ React.createElement("button", { type: "button", className: cx(i === ch && "on", i < ch && "past"), "aria-current": i === ch ? "step" : void 0, onClick: () => pick(i), disabled: w.reduce }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: STAGES.find((s) => s.id === c.at).icon, size: 14, stroke: 2 })), /* @__PURE__ */ React.createElement("span", null, c.t))))), /* @__PURE__ */ React.createElement(Caption, { w, money, className: "h32-ring-caption" }), /* @__PURE__ */ React.createElement("div", { className: "h32-ctl" }, /* @__PURE__ */ React.createElement(Replay, { w })));
    }
    function Follow() {
      const layer = useRef(null), cv = useRef(null);
      const P = usePlate(layer);
      const w = useWalk(P.ready);
      const dark = useDark();
      const money = useCount(w.k >= beatOf("report"), F.recovered, w.reduce);
      const shot = (k) => {
        if (k < 0) return GEO.camera.make;
        if (k >= NB) return GEO.camera.rest;
        return GEO.camera[BEATS[k].id] || GEO.camera.rest;
      };
      const [cam, setCam] = useState(shot(w.k));
      const camNow = useRef(cam);
      useEffect(() => {
        const to = shot(w.k);
        if (w.reduce) {
          camNow.current = to;
          setCam(to);
          return;
        }
        const from = camNow.current;
        const c = animate(0, 1, { duration: w.k < 0 ? 0.01 : 0.6, ease: [0.65, 0, 0.35, 1], onUpdate: (u) => {
          const v = { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u, z: from.z + (to.z - from.z) * u };
          camNow.current = v;
          setCam(v);
        } });
        return () => c.stop();
      }, [w.k, w.reduce]);
      useEffect(() => {
        const hero = layer.current && layer.current.closest(".hero");
        if (!hero || !P.g) return;
        const g = P.g;
        const [fx, fy] = P.at([cam.x, cam.y]);
        const tx = g.w / 2 - fx * cam.z, ty = g.h * 0.7 - fy * cam.z;
        const clampX = Math.min(0, Math.max(g.w - g.w * cam.z, tx)), clampY = Math.min(0, Math.max(g.h - g.h * cam.z, ty));
        hero.style.setProperty("--cam", `translate(${clampX.toFixed(1)}px, ${clampY.toFixed(1)}px) scale(${cam.z.toFixed(4)})`);
        hero.style.setProperty("--z", cam.z.toFixed(4));
      }, [cam, P.g]);
      const placeOf = (k) => k < 0 ? "factory" : k >= NB ? "godown" : BEATS[k].at === "factory" && BEATS[k].id === "yes" ? "godown" : BEATS[k].id === "report" ? "shops" : BEATS[k].at;
      const at = P.g ? P.at(GEO.batch[placeOf(w.k)]) : [0, 0];
      const ringCrew = w.done ? [] : CREW.filter((c) => c.beat <= Math.max(0, w.k) + 0);
      const T = 2 * Math.PI / Math.max(1, CREW.length);
      const front = w.k < 0 ? 0 : CREW.findIndex((c) => c.beat === w.k);
      const [rot, setRot] = useState(0);
      const rotNow = useRef(0);
      useEffect(() => {
        const to = (front < 0 ? CREW.length - 1 : front) * T;
        if (w.reduce) {
          rotNow.current = to;
          setRot(to);
          return;
        }
        const c = animate(rotNow.current, to, { duration: 0.42, ease: [0.45, 0, 0.4, 1], onUpdate: (v) => {
          rotNow.current = v;
          setRot(v);
        } });
        return () => c.stop();
      }, [front, w.reduce]);
      const rx = P.wide ? 168 : 100, ry = P.wide ? 50 : 34;
      const stars = P.g ? CREW.map((c, i) => {
        const [x, y] = P.at(GEO.stars[P.wide ? "wide" : "narrow"][c.id]);
        return { ...c, i, x, y };
      }) : [];
      useEffect(() => {
        const c = cv.current;
        if (!c || !P.g) return;
        const ctx = fitCanvas(c, P.g), k = w.done ? NB : w.k;
        ctx.clearRect(0, 0, P.g.w, P.g.h);
        const lit = dark ? "#3ccb8a" : "#167a52", amber = dark ? "#f7c04a" : "#e8a722";
        if (cam.z > 1.01) return;
        const reached = stars.filter((t) => t.beat < k || t.beat === k && w.playing);
        ctx.lineWidth = 2.25;
        ctx.lineCap = "round";
        for (let i = 1; i < reached.length; i++) {
          const a = reached[i - 1], b = reached[i], mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - Math.min(90, Math.abs(b.x - a.x) * 0.22);
          ctx.strokeStyle = a.human || b.human ? amber : lit;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(mx, my, b.x, b.y);
          ctx.stroke();
        }
      }, [w.k, w.done, dark, P.g, cam.z > 1.01]);
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "h32-layer h32-cam", ref: layer, style: P.style, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "h32-cam-inner" }, /* @__PURE__ */ React.createElement("canvas", { ref: cv, className: "h32-canvas" }), P.g && STAGES.filter((s) => cam.z <= 1.01 || w.beat && w.beat.at === s.id).map((s) => {
        const [x, y] = P.at(stageAt(s.id, P.wide));
        return /* @__PURE__ */ React.createElement(StagePin, { key: s.id, s, x, y, w, compact: !P.wide || cam.z > 1.2, short: !P.wide, edge: !P.wide && x < 90 ? "start" : !P.wide && x > P.g.w - 90 ? "end" : null });
      }), cam.z <= 1.01 && stars.map((s) => {
        const { done, now } = crewState(s, w), show = w.done && P.wide || w.done && s.human;
        return (done || now) && /* @__PURE__ */ React.createElement(React.Fragment, { key: s.id }, /* @__PURE__ */ React.createElement("span", { className: cx("h32-star", s.human && "human", done && "on", now && "now"), style: { left: s.x, top: s.y } }), show && /* @__PURE__ */ React.createElement("span", { className: "h32-label", style: labelStyle(s, labelSide(s, P.wide)) }, /* @__PURE__ */ React.createElement(AgentChip, { c: s, w })));
      }), P.g && !w.done && /* @__PURE__ */ React.createElement("span", { className: "h32-batch", style: { transform: `translate(${at[0]}px, ${at[1]}px) scale(${(1 / cam.z).toFixed(4)})` } }, /* @__PURE__ */ React.createElement("span", { className: "h32-batch-card" }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: "package", size: 14, stroke: 2 })), /* @__PURE__ */ React.createElement("b", null, w.k >= beatOf("risk") && w.k < beatOf("sell") ? `${num(F.atRisk)} at risk` : w.k >= beatOf("sell") ? `${F.kiranas} + ${F.buyer} sold` : `${num(F.packs)} packs`)), ringCrew.map((c) => {
        const j = CREW.indexOf(c), a = j * T - rot, d = Math.cos(a), { done, now } = crewState(c, w);
        return /* @__PURE__ */ React.createElement("span", { key: c.id, className: "h32-ride", style: { transform: `translate(${(rx * Math.sin(a)).toFixed(1)}px, ${(ry * d).toFixed(1)}px) translate(-50%, -50%) scale(${(0.82 + 0.18 * (d + 1) / 2) * (now ? 1.12 : 1)})`, zIndex: Math.round((d + 1) * 50) + (now ? 100 : 0), opacity: d < -0.2 ? 0 : 1 } }, /* @__PURE__ */ React.createElement(AgentChip, { c, w, compact: !P.wide || !now, iconOnly: !P.wide }));
      })))), /* @__PURE__ */ React.createElement(SrJourney, null), /* @__PURE__ */ React.createElement(Caption, { w, money }), /* @__PURE__ */ React.createElement("div", { className: "h32-ctl" }, /* @__PURE__ */ React.createElement(Replay, { w })));
    }
    const VIEWS = { constellation: Constellation, ring: Ring, follow: Follow };
    document.querySelectorAll("[data-hero32]").forEach((el) => {
      const V = VIEWS[el.getAttribute("data-hero32")];
      if (V) ReactDOM.createRoot(el).render(/* @__PURE__ */ React.createElement(V, null));
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

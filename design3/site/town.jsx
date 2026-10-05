// Smart-Clearance v3 · smartclearance.com's first viewport (SC-32): the whole business as one miniature town, in depth.
// The maker's factory and office, the distributor's godown, the kirana lane, a buyer in the next town, a food bank and
// the landfill. Every agent works at a post in the town, and the handoffs between them are the agent graph. A camera
// follows one batch through it, once (4.7 s, WCAG 2.2.2), then the town is the visitor's: drag or swipe to look round,
// pinch or Ctrl-scroll to zoom, double-click to go nearer, and open a place or an agent for what it did. Drawn in WebGL2
// from the plate and its depth map, so it parallaxes as the camera travels, tilts under the pointer and keeps its focus
// on what the camera looks at; without WebGL2 the plate is drawn flat. Under reduced motion the batch is at its result
// from the start and the camera jumps. Every figure comes from core/money.js through the data; no client is named.
(function () {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } = React;
  const { useReducedMotion, motion, AnimatePresence } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, P = window.SC3_PLATFORM; const fmt = M.fmt;
  const { cx, Icon, useTheme } = K;
  const IMG = window.SC3_SITE_IMG || "assets/plates/";
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const EASE = [0.22, 1, 0.36, 1], FLY = [0.65, 0, 0.35, 1];

  /* ---------- the batch and the business, from the data ---------- */
  const lineOf = id => D.PLAN.lines.find(l => l.id === id);
  const BATCH = D.BATCHES.find(b => b.hero), KL = lineOf("kirana"), AW = D.AWARD, SHOPS = D.KIRANAS.length, BIN = D.PLAN.writeOff.total, SCHEME = M.RULES.scheme;
  const FOOD = M.CHANNELS.find(c => c.id === "foodbank");
  const rate = v => Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v);
  const RESULT = `${fmt.inr(D.ACTUAL.net)} recovered, instead of ${fmt.inr(-BIN)} to destroy it`;
  // every place in the town, and what it is to this batch
  const PLACES = [
    { id: "maker", t: "Manufacturer", short: "Maker", icon: "factory", line: `Makes the batch. You approve each plan here, and the money comes back here: ${fmt.inr(D.ACTUAL.net)}.` },
    { id: "godown", t: "Distributor · stockist", short: "Distributor", icon: "warehouse", line: `${fmt.num(BATCH.units)} packs of the batch, selling ${BATCH.sellPerDay} a day: ${fmt.num(D.RISK.atRisk)} won't sell in the ${BATCH.daysLeft} days left.` },
    { id: "kiranas", t: "Retailers", short: "Kiranas", icon: "store", line: `${SHOPS} kiranas take ${fmt.num(KL.units)} packs, buy ${SCHEME.buy} get ${SCHEME.free} free.` },
    { id: "buyer", t: "A buyer elsewhere", short: "Buyer", icon: "shopping-bag", line: `${fmt.num(AW.units)} packs through an ExpireSoon listing, at ${rate(AW.price)} a pack.` },
    { id: "foodbank", t: "Food bank", short: "Food bank", icon: "heart-handshake", line: `Takes food with ${FOOD.minDays} or more days left, as a donation. This batch sold before it was needed.` },
    { id: "landfill", t: "Landfill", short: "Landfill", icon: "trash-2", line: `Destroying the ${fmt.num(D.RISK.atRisk)} packs would cost ${fmt.inr(-BIN)}. This batch sends none here.` },
  ];
  const PLACE = Object.fromEntries(PLACES.map(p => [p.id, p]));
  // the agents and the person who says yes, each at its post, with its job (as the platform gives it) and what it did
  const POST = { data: "godown", watcher: "godown", vision: "godown", valuer: "godown", router: "godown", gate: "maker", lister: "buyer", outreach: "kiranas", negotiator: "buyer", paperwork: "maker", impact: "landfill" };
  const DID = {
    data: `${fmt.num(BATCH.units)} packs in stock, selling ${BATCH.sellPerDay} a day`,
    watcher: `${fmt.num(D.RISK.atRisk)} packs won't sell in the ${BATCH.daysLeft} days left`,
    vision: "Read the label: the date matches",
    valuer: `Five exits priced; the bin would cost ${fmt.inr(-BIN)}`,
    router: `${fmt.num(KL.units)} to ${SHOPS} kiranas, ${fmt.num(AW.units)} to one buyer`,
    gate: `Approved in one tap, ${fmt.inr(D.PLAN.net)} on screen`,
    outreach: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas, buy ${SCHEME.buy} get ${SCHEME.free} free`,
    lister: `${fmt.num(AW.units)} packs listed`,
    negotiator: `Countered a bid to ${rate(AW.price)} a pack`,
    paperwork: "The invoice, credit note and GST memo, drafted",
    impact: `${fmt.num(D.PLAN.kg)} kg kept out of landfill`,
  };
  const AGENTS = P.AGENTS.map(a => ({ id: a.gate ? "you" : a.id, key: a.id, name: a.gate ? "You" : a.name, icon: a.icon, human: !!a.gate, at: POST[a.id],
    job: a.gate ? "You approve every plan, with the money on screen" : a.job, did: DID[a.id] }));
  const AGENT = Object.fromEntries(AGENTS.map(a => [a.id, a]));
  // the handoffs, in the order they happen: the agent graph
  const EDGES = [["data", "watcher"], ["watcher", "vision"], ["vision", "valuer"], ["valuer", "router"], ["router", "you"], ["you", "outreach"], ["you", "lister"],
    ["lister", "negotiator"], ["outreach", "paperwork"], ["negotiator", "paperwork"], ["paperwork", "impact"]];
  // the journey, beat by beat: where it happens, who works, what it did, how long it holds (ms), and where the batch is
  const BEATS = [
    { id: "make", at: ["maker"], t: "Made", did: `${fmt.num(BATCH.units)} packs leave the factory for the distributor`, who: [], ms: 600, batch: "maker" },
    { id: "stock", at: ["godown"], t: "Stocked", did: `${fmt.num(BATCH.units)} packs in the distributor's godown, selling ${BATCH.sellPerDay} a day`, who: [], ms: 500, batch: "godown" },
    { id: "risk", at: ["godown"], t: "At risk", did: `${fmt.num(D.RISK.atRisk)} packs won't sell in the ${BATCH.daysLeft} days left`, who: ["data", "watcher", "vision"], ms: 700, batch: "godown" },
    { id: "route", at: ["godown"], t: "Priced and split", did: `Five exits priced · ${fmt.num(KL.units)} to ${SHOPS} kiranas, ${fmt.num(AW.units)} to one buyer`, who: ["valuer", "router"], ms: 600, batch: "godown" },
    { id: "yes", at: ["maker"], t: "One yes", did: `You approve in one tap · ${fmt.inr(D.PLAN.net)} on screen`, who: ["you"], human: true, ms: 900, batch: "godown" },
    { id: "sell", at: ["kiranas", "buyer"], t: "Sold", did: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas · ${fmt.num(AW.units)} to a buyer, countered to ${rate(AW.price)}`, who: ["outreach", "lister", "negotiator"], ms: 700, batch: "sold" },
    { id: "report", at: ["maker", "landfill"], t: "Settled", did: "", who: ["paperwork", "impact"], ms: 700, batch: null },
  ];
  const NB = BEATS.length;
  const beatOf = id => BEATS.findIndex(b => b.id === id);
  const names = b => b.who.map(w => AGENT[w].name).join(" · ");
  AGENTS.forEach(a => { a.beat = BEATS.findIndex(b => b.who.includes(a.id)); });
  const agentState = (a, j) => ({ done: a.beat < j.k || j.done, now: a.beat === j.k && j.playing });

  /* ---------- the town's geography: fractions of the plate (business.webp, its night and its depth, composed alike) ---------- */
  // Pins sit on their places' roofs; each agent's post is where it works, its name to the side the label says; the
  // routes follow the plate's green path from the maker's loading bay, along the front road to the kiranas, and up to
  // the highway to the buyer's warehouse.
  const GEO = {
    nw: 2752, nh: 1536,
    places: { maker: [0.175, 0.415], godown: [0.47, 0.44], kiranas: [0.79, 0.45], buyer: [0.8, 0.32], foodbank: [0.55, 0.385], landfill: [0.16, 0.265] },
    // on phones the food bank's pin moves to the kitchen's right, clear of the distributor's
    phonePlaces: { foodbank: [0.6, 0.36] },
    posts: { data: [0.355, 0.6], watcher: [0.395, 0.475], vision: [0.585, 0.455], valuer: [0.645, 0.545], router: [0.6, 0.705], you: [0.15, 0.585], paperwork: [0.085, 0.64],
      outreach: [0.875, 0.5], lister: [0.885, 0.415], negotiator: [0.955, 0.47], impact: [0.27, 0.315] },
    labels: { data: "left", watcher: "left", negotiator: "left", lister: "left", outreach: "left" },
    routes: {
      out: [[0.312, 0.66], [0.335, 0.72], [0.38, 0.748], [0.436, 0.756], [0.5, 0.762]],
      kiranas: [[0.5, 0.762], [0.58, 0.78], [0.65, 0.795], [0.727, 0.814], [0.8, 0.83]],
      buyer: [[0.5, 0.762], [0.58, 0.78], [0.727, 0.814], [0.836, 0.833], [0.86, 0.8], [0.85, 0.68], [0.815, 0.51], [0.735, 0.38], [0.69, 0.31], [0.75, 0.31], [0.84, 0.335]],
    },
    batch: { maker: [0.31, 0.655], godown: [0.5, 0.665] },
    // the camera, per beat and per place: the plate point it centres and how near; desktops and phones apart
    shots: {
      wide: { rest: [0.5, 0.5, 1], make: [0.22, 0.58, 1.65], stock: [0.5, 0.56, 1.55], risk: [0.5, 0.55, 1.7], route: [0.56, 0.52, 1.3], yes: [0.17, 0.58, 1.7], sell: [0.8, 0.53, 1.3], report: [0.2, 0.47, 1.4],
        maker: [0.18, 0.58, 1.8], godown: [0.5, 0.6, 1.8], kiranas: [0.8, 0.62, 1.8], buyer: [0.8, 0.3, 2], foodbank: [0.52, 0.4, 2], landfill: [0.17, 0.32, 2] },
      phone: { rest: [0.5, 0.55, 1], make: [0.22, 0.6, 1.3], stock: [0.5, 0.62, 1.3], risk: [0.5, 0.6, 1.45], route: [0.55, 0.55, 1.1], yes: [0.15, 0.6, 1.4], sell: [0.8, 0.6, 1.15], report: [0.17, 0.5, 1.2],
        maker: [0.18, 0.58, 1.4], godown: [0.5, 0.6, 1.4], kiranas: [0.8, 0.62, 1.4], buyer: [0.8, 0.32, 1.6], foodbank: [0.52, 0.4, 1.6], landfill: [0.17, 0.32, 1.6] },
    },
    // the band behind the heading on desktops, as fractions of the stage: solid haze, then clear
    haze: [0.3, 0.42],
  };
  const shotOf = (g, id) => { const S = GEO.shots[g && g.wide ? "wide" : "phone"]; return S[id] || S.rest; };
  const placeAt = (g, id) => (!g.wide && GEO.phonePlaces[id]) || GEO.places[id];
  const wpx = (g, p) => [p[0] * g.w, p[1] * g.h];

  /* ---------- the stage, and the town laid in it ---------- */
  // The plate is cover-fitted in the stage: the world box. The world moves under the camera; everything placed on the
  // town sits in the world, in its px at rest, and keeps its own size as the camera nears.
  function useStage(ref) {
    const [g, setG] = useState(null);
    useLayoutEffect(() => {
      const el = ref.current; if (!el) return;
      const measure = () => {
        const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return;
        const s = Math.max(W / GEO.nw, H / GEO.nh), w = GEO.nw * s, h = GEO.nh * s;
        setG(o => (o && o.W === W && o.H === H ? o : { W, H, w, h, ox: (W - w) / 2, oy: (H - h) / 2, wide: W >= 900 }));
      };
      measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
    }, []);
    return g;
  }

  /* ---------- the camera ---------- */
  // It looks at a plate point, held at the stage's anchor, from a zoom of 1 (the whole town) up to ZMAX, clamped so the
  // town always fills the stage. It writes the world's transform itself, frame by frame, and tells whoever listens (the
  // graph, the depth renderer); React hears only when the zoom passes a step.
  const ZMAX = 2.6;
  function useCamera(g, worlds, haze, reduce) {
    const cam = useRef({ x: 0.5, y: 0.5, z: 1 }), live = useRef(null), subs = useRef(new Set()), views = useRef(new Set()), gRef = useRef(g), fly = useRef(null);
    const [zoom, setZoom] = useState(1);
    gRef.current = g;
    const anchor = G => (G.wide ? [0.5, 0.64] : [0.5, 0.5]);
    const solve = (c, G = gRef.current) => {
      const z = clamp(c.z, 1, ZMAX), [ax, ay] = anchor(G);
      return { tx: clamp(ax * G.W - G.ox - c.x * G.w * z, G.W - G.ox - G.w * z, -G.ox), ty: clamp(ay * G.H - G.oy - c.y * G.h * z, G.H - G.oy - G.h * z, -G.oy), z };
    };
    const focusOf = (t, G = gRef.current) => { const [ax, ay] = anchor(G); return { x: (ax * G.W - G.ox - t.tx) / (G.w * t.z), y: (ay * G.H - G.oy - t.ty) / (G.h * t.z), z: t.z }; };
    const write = c => {
      if (!gRef.current) return;
      const t = solve(c); cam.current = focusOf(t); live.current = t;
      worlds.current.forEach(el => { el.style.transform = `translate(${t.tx.toFixed(2)}px, ${t.ty.toFixed(2)}px) scale(${t.z.toFixed(4)})`; el.style.setProperty("--iz", (1 / t.z).toFixed(4)); });
      if (haze.current) haze.current.style.opacity = clamp((t.z - 1) / 0.28, 0, 1).toFixed(3);
      subs.current.forEach(f => f(t));
      const step = Math.round(t.z * 10) / 10; setZoom(s => (s === step ? s : step));
    };
    const stop = () => { if (fly.current) { fly.current.stop(); fly.current = null; } };
    const api = useMemo(() => ({
      get: () => cam.current, t: () => live.current || (gRef.current ? solve(cam.current) : { tx: 0, ty: 0, z: 1 }),
      // fly to a shot ([x, y, z]); jumps under reduced motion
      to: (shot, dur = 0.7) => {
        stop(); const to = { x: shot[0], y: shot[1], z: shot[2] };
        if (reduce || dur <= 0) { write(to); return; }
        const from = { ...cam.current }, lz0 = Math.log(from.z), lz1 = Math.log(to.z);
        fly.current = Motion.animate(0, 1, { duration: dur, ease: FLY, onUpdate: u => write({ x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u, z: Math.exp(lz0 + (lz1 - lz0) * u) }) });
      },
      // move by a drag, in stage px, from a transform taken at its start
      drag: (t0, dx, dy) => { stop(); write(focusOf(solve(focusOf({ tx: t0.tx + dx, ty: t0.ty + dy, z: t0.z })))); },
      // zoom by a factor about a stage point, which stays under the pointer
      zoomAt: (f, sx, sy, smooth) => {
        const G = gRef.current, t = api.t(), z1 = clamp(t.z * f, 1, ZMAX);
        const px = (sx - G.ox - t.tx) / (G.w * t.z), py = (sy - G.oy - t.ty) / (G.h * t.z);
        const c1 = focusOf({ tx: sx - G.ox - px * G.w * z1, ty: sy - G.oy - py * G.h * z1, z: z1 });
        if (smooth) api.to([c1.x, c1.y, c1.z], 0.42); else { stop(); write(c1); }
      },
      // a plate point on the stage, now
      toStage: p => { const G = gRef.current, t = api.t(); return [G.ox + t.tx + p[0] * G.w * t.z, G.oy + t.ty + p[1] * G.h * t.z]; },
      listen: f => { subs.current.add(f); return () => subs.current.delete(f); },
      // the depth renderer's own changes (its tilt and focus), for what sits on the town
      listenView: f => { views.current.add(f); return () => views.current.delete(f); },
      viewChanged: () => views.current.forEach(f => f()),
    }), [reduce]);
    useLayoutEffect(() => { if (g) write(cam.current); }, [g]);
    return { api, zoom };
  }

  /* ---------- gestures: drag or swipe, pinch, Ctrl-scroll (a trackpad's pinch), double-click ---------- */
  // A drag that starts on a node still pans, and then the node's click is swallowed. Plain scrolling stays the page's;
  // on touch screens the stage leaves vertical swipes to the page (touch-action: pan-y).
  function useGestures(stageRef, api, onUser) {
    const user = useRef(onUser); user.current = onUser;
    useEffect(() => {
      const el = stageRef.current; if (!el) return;
      const pts = new Map(); let drag = null, pinch = null, moved = false;
      const local = (x, y) => { const r = el.getBoundingClientRect(); return [x - r.left, y - r.top]; };
      const two = () => { const [a, b] = [...pts.values()]; return { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: local((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) }; };
      const down = e => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 1) moved = false;
        if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, t: api.t() };
        if (pts.size === 2) { pinch = { ...two(), t: api.t() }; drag = null; }
      };
      const move = e => {
        if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
        if (pinch && pts.size >= 2) {
          const s = two(); if (!moved) { moved = true; user.current(); }
          api.zoomAt(s.d / pinch.d * pinch.t.z / api.t().z, pinch.m[0], pinch.m[1], false); pinch.d = s.d; pinch.t = api.t();
          return;
        }
        if (!drag) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!moved) { if (Math.hypot(dx, dy) < 6) return; moved = true; user.current(); el.classList.add("dragging"); try { el.setPointerCapture(e.pointerId); } catch (_) {} }
        api.drag(drag.t, dx, dy);
      };
      const up = e => {
        pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
        if (pts.size === 1) { const [p] = [...pts.values()]; drag = { x: p[0], y: p[1], t: api.t() }; }
        if (pts.size === 0) { drag = null; el.classList.remove("dragging"); }
      };
      const click = e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } };
      const wheel = e => { if (!e.ctrlKey) return; e.preventDefault(); user.current(); const [x, y] = local(e.clientX, e.clientY); api.zoomAt(Math.exp(-e.deltaY * 0.01), x, y, false); };
      const dbl = e => { if (e.target.closest("button")) return; user.current(); const [x, y] = local(e.clientX, e.clientY); const z = api.t().z; api.zoomAt(z >= 2.2 ? 1 / z : 1.7, x, y, true); };
      el.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
      el.addEventListener("click", click, true); el.addEventListener("wheel", wheel, { passive: false }); el.addEventListener("dblclick", dbl);
      return () => {
        el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
        el.removeEventListener("click", click, true); el.removeEventListener("wheel", wheel); el.removeEventListener("dblclick", dbl);
      };
    }, [api]);
  }

  /* ---------- the journey ---------- */
  // -1 before it sets off, 0 to 6 at a beat, 7 when it is done. It sets off half a second after the town has loaded, so
  // it never plays over an empty frame. Stepping by hand stops the clock.
  function useJourney(ready) {
    const reduce = !!useReducedMotion();
    const [k, setK] = useState(reduce ? NB : -1); const [run, setRun] = useState(0); const [manual, setManual] = useState(false);
    useEffect(() => { if (reduce) { setK(NB); return; } if (!ready) return; setK(-1); const t = setTimeout(() => setK(0), 500); return () => clearTimeout(t); }, [ready, run, reduce]);
    useEffect(() => { if (reduce || manual || k < 0 || k >= NB) return; const t = setTimeout(() => setK(k + 1), BEATS[k].ms); return () => clearTimeout(t); }, [k, reduce, manual]);
    const j = { k, reduce, run, playing: k >= 0 && k < NB && !manual, manual, done: k >= NB, beat: k >= 0 && k < NB ? BEATS[k] : null };
    j.replay = () => { setManual(false); setRun(r => r + 1); if (reduce) setK(NB); };
    j.step = d => { setManual(true); setK(v => clamp((v < 0 ? 0 : v) + d, 0, NB)); };
    return j;
  }
  // the money, rolled in once over the settling beat (the system's roll, 700 ms); at its value under reduced motion
  function useCount(on, to, reduce) {
    const [v, setV] = useState(on || reduce ? to : 0);
    useEffect(() => { if (reduce) { setV(to); return; } if (!on) { setV(0); return; } const c = Motion.animate(0, to, { duration: 0.7, ease: EASE, onUpdate: setV }); return () => c.stop(); }, [on, reduce]);
    return v;
  }
  // a point along a polyline, t from 0 to 1 by length
  function along(pts, t) {
    const seg = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let s = clamp(t, 0, 1) * L;
    for (let i = 0; i < seg.length; i++) { if (s <= seg[i] || i === seg.length - 1) { const u = seg[i] ? Math.min(1, s / seg[i]) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; } s -= seg[i]; }
    return pts[pts.length - 1];
  }
  function fitCanvas(cv, W, H) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(W), h = Math.round(H);
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px"; }
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
  }

  /* ---------- the depth renderer ---------- */
  // WebGL2. The plate and its depth map (white near, black far). Each pixel is shifted by its depth against the focus's
  // depth: along a tilt that follows the pointer (a swipe sways it on touch screens), and about the focus as the camera
  // nears, so near things move more than far and grow faster; the focus follows the camera and what is far from it goes
  // soft, through the plate's own mipmaps. Behind the heading on desktops the top of the frame goes to haze as the camera
  // nears, as a tilt-shift lens's does. It draws only while something moves.
  const VS = `#version 300 es
in vec2 p; out vec2 v; void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
  const FS = `#version 300 es
precision highp float;
uniform sampler2D uPlate, uDepth; uniform vec2 uRes; uniform vec4 uWorld; uniform vec3 uCam; uniform vec2 uTilt; uniform float uFocus, uBlur, uSky; uniform vec2 uBand; uniform vec3 uDolly; uniform vec3 uSkyCol;
in vec2 v; out vec4 o;
vec2 plate(vec2 px, vec3 c) { return (px - uWorld.xy - c.xy) / (uWorld.zw * c.z); }
void main() {
  vec2 px = vec2(v.x, 1.0 - v.y) * uRes;
  vec2 uv = plate(px, uCam);
  float d = texture(uDepth, uv).r; vec2 q = uv - (uTilt + (uv - uDolly.xy) * uDolly.z) * (d - uFocus);
  d = texture(uDepth, q).r; q = uv - (uTilt + (uv - uDolly.xy) * uDolly.z) * (d - uFocus);
  float soft = uBlur * smoothstep(0.06, 0.42, abs(d - uFocus));
  vec4 c = texture(uPlate, q, soft);
  if (uSky > 0.0) { float k = uSky * (1.0 - smoothstep(uBand.x, uBand.y, px.y / uRes.y)); vec4 h = texture(uPlate, q, 4.5); c = mix(c, mix(h, vec4(uSkyCol, 1.0), 0.62), k); }
  o = vec4(c.rgb, 1.0);
}`;
  // how strongly the town dollies as the camera nears (at full zoom), and sways as it travels
  const DOLLY = 0.42, SWAY = 0.9;
  // where a plate point shows once the renderer has shifted it (the shader's shift, run forward)
  const shifted = (p, d, v) => [p[0] + (v.tilt[0] + (p[0] - v.foc[0]) * v.dolly) * (d - v.focus), p[1] + (v.tilt[1] + (p[1] - v.foc[1]) * v.dolly) * (d - v.focus)];
  // the depth map's pixels, to place the pins and agents where the shader puts the town
  function useDepthMap(on) {
    const [m, setM] = useState(null);
    useEffect(() => {
      if (!on) return;
      const W = 256, H = Math.round(256 * GEO.nh / GEO.nw), c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d", { willReadFrequently: true });
      const im = new Image(); im.crossOrigin = "anonymous";
      im.onload = () => { x.drawImage(im, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data; setM({ canvas: c, at: p => d[(clamp(Math.round(p[1] * (H - 1)), 0, H - 1) * W + clamp(Math.round(p[0] * (W - 1)), 0, W - 1)) * 4] / 255 }); };
      im.src = IMG + "business-depth.webp";
    }, [on]);
    return m;
  }
  function DepthPlate(props) {
    const { g: g0, api, dark, reduce: reduce0, map: map0, stageRef } = props;
    const cv = useRef(null), gl = useRef(null), st = useRef({ tilt: [0, 0], want: [0, 0], focus: 0.5, blur: 0, raf: 0 }), P2 = useRef(props); P2.current = props;
    useEffect(() => {
      const c = cv.current, ctx = c && c.getContext("webgl2", { antialias: false, premultipliedAlpha: false, alpha: false });
      if (!ctx) { P2.current.onFail(); return; }
      const sh = (t, s) => { const o = ctx.createShader(t); ctx.shaderSource(o, s); ctx.compileShader(o); return o; };
      const pr = ctx.createProgram(); ctx.attachShader(pr, sh(ctx.VERTEX_SHADER, VS)); ctx.attachShader(pr, sh(ctx.FRAGMENT_SHADER, FS)); ctx.linkProgram(pr);
      if (!ctx.getProgramParameter(pr, ctx.LINK_STATUS)) { P2.current.onFail(); return; }
      ctx.useProgram(pr);
      const b = ctx.createBuffer(); ctx.bindBuffer(ctx.ARRAY_BUFFER, b); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
      const loc = ctx.getAttribLocation(pr, "p"); ctx.enableVertexAttribArray(loc); ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
      const U = n => ctx.getUniformLocation(pr, n);
      gl.current = { ctx, U: { plate: U("uPlate"), depth: U("uDepth"), res: U("uRes"), world: U("uWorld"), cam: U("uCam"), tilt: U("uTilt"), focus: U("uFocus"), blur: U("uBlur"), sky: U("uSky"), band: U("uBand"), dolly: U("uDolly"), skyCol: U("uSkyCol") } };
      ctx.uniform1i(gl.current.U.plate, 0); ctx.uniform1i(gl.current.U.depth, 1);
      return () => { const ext = ctx.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); };
    }, []);
    const upload = (unit, src, mip) => {
      const G = gl.current; if (!G) return; const ctx = G.ctx, t = ctx.createTexture();
      ctx.activeTexture(ctx.TEXTURE0 + unit); ctx.bindTexture(ctx.TEXTURE_2D, t);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE); ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, mip ? ctx.LINEAR_MIPMAP_LINEAR : ctx.LINEAR); ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
      ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, src); if (mip) ctx.generateMipmap(ctx.TEXTURE_2D);
    };
    const draw = () => {
      const G = gl.current, s = st.current, c = cv.current, { g } = P2.current; if (!G || !c || !g || !s.ready || !s.depth) return;
      const ctx = G.ctx, dpr = Math.min(window.devicePixelRatio || 1, g.wide ? 2 : 1.5), W = Math.round(g.W * dpr), H = Math.round(g.H * dpr);
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      ctx.viewport(0, 0, W, H);
      const t = api.t(), fc = api.get(), dz = P2.current.reduce ? 0 : DOLLY * (1 - 1 / t.z), sk = P2.current.dark ? [3, 19, 48] : [236, 231, 228];
      ctx.uniform2f(G.U.res, W, H); ctx.uniform4f(G.U.world, g.ox * dpr, g.oy * dpr, g.w * dpr, g.h * dpr); ctx.uniform3f(G.U.cam, t.tx * dpr, t.ty * dpr, t.z);
      ctx.uniform2f(G.U.tilt, s.tilt[0], s.tilt[1]); ctx.uniform1f(G.U.focus, s.focus); ctx.uniform1f(G.U.blur, s.blur);
      ctx.uniform1f(G.U.sky, g.wide ? clamp((t.z - 1) / 0.28, 0, 1) : 0); ctx.uniform2f(G.U.band, GEO.haze[0], GEO.haze[1]);
      ctx.uniform3f(G.U.dolly, fc.x, fc.y, dz); ctx.uniform3f(G.U.skyCol, sk[0] / 255, sk[1] / 255, sk[2] / 255);
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
      P2.current.view.current = { tilt: s.tilt, focus: s.focus, foc: [fc.x, fc.y], dolly: dz };
    };
    // the loop: eases the tilt toward its aim and the focus toward the camera's, while either is moving
    const loop = () => {
      const s = st.current, t = api.t(), c = api.get(), { map, reduce } = P2.current;
      const f = map ? map.at([c.x, c.y]) : 0.6, fb = clamp((t.z - 1) / 0.45, 0, 1) * 2.4, k = reduce ? 1 : 0.14;
      s.tilt = [s.tilt[0] + (s.want[0] - s.tilt[0]) * k, s.tilt[1] + (s.want[1] - s.tilt[1]) * k];
      s.focus += (f - s.focus) * (reduce ? 1 : 0.12); s.blur += (fb - s.blur) * (reduce ? 1 : 0.12);
      s.want = [s.want[0] * 0.9, s.want[1] * 0.9]; if (s.hover) s.want = s.hover.slice();
      draw(); api.viewChanged();
      const moving = Math.abs(s.want[0] - s.tilt[0]) + Math.abs(s.want[1] - s.tilt[1]) > 1e-5 || Math.abs(f - s.focus) > 1e-3 || Math.abs(fb - s.blur) > 1e-3 || Math.abs(s.want[0]) + Math.abs(s.want[1]) > 1e-5;
      s.raf = moving ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!st.current.raf) st.current.raf = requestAnimationFrame(loop); };
    useEffect(() => () => cancelAnimationFrame(st.current.raf), []);
    // the depth map, once read; the town is ready once both the plate and its depth are in
    useEffect(() => { if (map0 && gl.current) { upload(1, map0.canvas, false); st.current.depth = true; if (st.current.ready) P2.current.onReady(); draw(); kick(); } }, [map0]);
    // the plate for the theme
    useEffect(() => {
      let alive = true; const im = new Image(); im.decoding = "async"; im.crossOrigin = "anonymous";
      im.onload = () => { if (!alive) return; upload(0, im, true); st.current.ready = true; if (st.current.depth) P2.current.onReady(); draw(); kick(); };
      im.onerror = () => P2.current.onFail(); im.src = IMG + (dark ? "business-night.webp" : "business.webp");
      return () => { alive = false; };
    }, [dark]);
    // the camera's travel sways the town: near things lead, far things lag
    useEffect(() => {
      let last = null;
      return api.listen(() => {
        const c = api.get(), s = st.current;
        if (last && !P2.current.reduce) s.want = [clamp(s.want[0] - (c.x - last.x) * SWAY, -0.035, 0.035), clamp(s.want[1] - (c.y - last.y) * SWAY * 0.6, -0.02, 0.02)];
        last = { ...c }; draw(); kick();
      });
    }, [api]);
    useEffect(() => { draw(); kick(); }, [g0, map0]);
    // the pointer tilts the town (desktops); a swipe sways it (touch screens); never under reduced motion
    useEffect(() => {
      const el = stageRef.current; if (!el || reduce0) return;
      let last = null;
      const mv = e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        if (e.pointerType === "mouse") st.current.hover = [x * 0.03, y * 0.018];
        else if (last) st.current.want = [clamp(st.current.want[0] + (e.clientX - last[0]) * 0.0006, -0.03, 0.03), clamp(st.current.want[1] + (e.clientY - last[1]) * 0.0004, -0.02, 0.02)];
        last = [e.clientX, e.clientY]; kick();
      };
      const lv = () => { st.current.hover = null; st.current.want = [0, 0]; last = null; kick(); };
      const up = () => { last = null; };
      el.addEventListener("pointermove", mv); el.addEventListener("pointerleave", lv); el.addEventListener("pointerup", up);
      return () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerleave", lv); el.removeEventListener("pointerup", up); };
    }, [reduce0]);
    return <canvas ref={cv} className="town-gl" aria-hidden="true" />;
  }

  /* ---------- the graph, the packs and the route, drawn over the town ---------- */
  // Each handoff draws in (320 ms) as its agent starts work: a bow between the posts, up within a place, dipping between
  // places as if it travelled the road; amber where the person is in it. It rests quiet, thin and faint; the handoff
  // happening now, or those of what is hovered or open, stand out on a thin casing of the plate's light. When the batch
  // sells, its packs run out to the kiranas (green) and up the highway to the buyer (violet), and settle.
  function Graph({ g, api, j, dark, focus, project, holes }) {
    const cv = useRef(null), prog = useRef({}), raf = useRef(0), packs = useRef(null);
    const st = useRef({}); st.current = { g, j, dark, focus, project, holes };
    const draw = useCallback(() => {
      const c = cv.current, s = st.current; if (!c || !s.g) return;
      const ctx = fitCanvas(c, s.g.W, s.g.H); ctx.clearRect(0, 0, s.g.W, s.g.H); ctx.save();
      const hs = s.holes ? s.holes() : [];
      if (hs.length) { ctx.beginPath(); ctx.rect(0, 0, s.g.W, s.g.H); hs.forEach(h => ctx.rect(h[0], h[1], h[2] - h[0], h[3] - h[1])); ctx.clip("evenodd"); }
      const Pt = id => (s.project ? s.project(GEO.posts[id], id) : api.toStage(GEO.posts[id]));
      const lit = s.dark ? "#3ccb8a" : "#167a52", amber = s.dark ? "#f7c04a" : "#e8a722", casing = s.dark ? "rgba(8,14,11,0.6)" : "rgba(255,255,255,0.75)";
      const k = s.j.done ? NB : s.j.k;
      EDGES.forEach(([a, b]) => {
        const p = prog.current[a + b] || 0; if (p <= 0) return;
        const A = Pt(a), B = Pt(b), d = Math.hypot(B[0] - A[0], B[1] - A[1]), mx = (A[0] + B[0]) / 2, far = AGENT[a].at !== AGENT[b].at;
        const my = (A[1] + B[1]) / 2 + (far ? Math.min(110, d * 0.2) : -Math.min(70, d * 0.22));
        const loud = s.focus ? s.focus.has(a) && s.focus.has(b) : AGENT[b].beat === k && !s.j.done;
        const hue = AGENT[a].human || AGENT[b].human ? amber : lit, n = 36, m = Math.max(1, Math.round(n * p));
        const path = () => { ctx.beginPath(); ctx.moveTo(A[0], A[1]); for (let i = 1; i <= m; i++) { const t = i / n, u = 1 - t; ctx.lineTo(u * u * A[0] + 2 * u * t * mx + t * t * B[0], u * u * A[1] + 2 * u * t * my + t * t * B[1]); } };
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        if (loud) { path(); ctx.lineWidth = 6; ctx.strokeStyle = casing; ctx.stroke(); path(); ctx.lineWidth = 3; ctx.strokeStyle = hue; ctx.stroke(); }
        else { ctx.globalAlpha = s.focus ? 0.22 : 0.5; path(); ctx.lineWidth = 1.5; ctx.strokeStyle = hue; ctx.stroke(); ctx.globalAlpha = 1; }
      });
      const pk = packs.current;
      if (pk) {
        const now = performance.now(), u = clamp((now - pk.t0) / pk.dur, 0, 1), z = api.t().z;
        pk.list.forEach(dot => {
          const t = clamp((u - dot.delay) / (1 - dot.delay), 0, 1); if (t <= 0) return;
          const q = along(GEO.routes[dot.to], 1 - Math.pow(1 - t, 3)), [x, y] = s.project ? s.project(q) : api.toStage(q);
          ctx.globalAlpha = t >= 1 ? clamp(1 - (now - pk.t0 - pk.dur) / 400, 0, 1) : 1;
          ctx.beginPath(); ctx.arc(x, y, 3.6 * Math.max(1, Math.sqrt(z)), 0, Math.PI * 2);
          ctx.fillStyle = dot.to === "buyer" ? (s.dark ? "#8a6ee8" : "#7c5cd6") : lit; ctx.fill();
          ctx.lineWidth = 1.2; ctx.strokeStyle = s.dark ? "rgba(10,16,13,0.8)" : "#ffffff"; ctx.stroke();
        });
        ctx.globalAlpha = 1;
        if (now - pk.t0 > pk.dur + 420) packs.current = null;
      }
      ctx.restore();
    }, [api]);
    // draw each handoff in as the journey reaches it
    useEffect(() => {
      const k = j.done ? NB : j.k, want = {};
      EDGES.forEach(([a, b]) => { want[a + b] = AGENT[b].beat >= 0 && (AGENT[b].beat < k || (AGENT[b].beat === k && (j.playing || j.manual))) ? 1 : 0; });
      if (j.reduce) { prog.current = want; draw(); return; }
      let alive = true; const t0 = performance.now(), from = { ...prog.current };
      const tick = () => {
        if (!alive) return; const u = clamp((performance.now() - t0) / 320, 0, 1);
        Object.keys(want).forEach(key => { const f = from[key] || 0; prog.current[key] = f + (want[key] - f) * (want[key] > f ? u : 1); });
        draw(); if (u < 1 || packs.current) raf.current = requestAnimationFrame(tick);
      };
      if (BEATS[j.k] && BEATS[j.k].id === "sell" && j.playing) {
        const list = []; for (let i = 0; i < 26; i++) list.push({ to: i % 13 < 6 ? "kiranas" : "buyer", delay: (i / 26) * 0.45 });
        packs.current = { t0: performance.now(), dur: 650, list };
      }
      cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(tick);
      return () => { alive = false; cancelAnimationFrame(raf.current); };
    }, [j.k, j.done, j.reduce, j.run]);
    useEffect(() => { const a = api.listen(() => draw()), b = api.listenView(() => draw()); return () => { a(); b(); }; }, [api, draw]);
    useEffect(() => { draw(); }, [dark, focus, g]);
    return <canvas ref={cv} className="town-graph" aria-hidden="true" />;
  }

  /* ---------- what stands on the town ---------- */
  // a place's pin: its icon and name on a short stem, lit while the batch is there; a button that opens the place
  const Pin = ({ p, g, j, sel, onOpen, hover }) => {
    const at = wpx(g, placeAt(g, p.id)), here = j.beat && j.beat.at.includes(p.id), open = sel && sel.kind === "place" && sel.id === p.id;
    return <span className="town-at" style={{ left: at[0], top: at[1] }}>
      <button type="button" className={cx("town-pin", here && "here", open && "open")} aria-expanded={open} aria-controls={open ? "town-panel" : undefined}
        aria-label={`${p.t}: what happens here`} onClick={() => onOpen({ kind: "place", id: p.id })} onPointerEnter={() => hover({ kind: "place", id: p.id })} onPointerLeave={() => hover(null)}>
        <span className="town-pin-body"><i><Icon name={p.icon} size={14} stroke={2} /></i><b>{g.wide ? p.t : p.short}</b></span><span className="town-pin-stem" />
      </button></span>;
  };
  // an agent at its post: its icon, and its name beside it (on desktops at rest and while it works; on phones when open,
  // or for the person); lit once it has worked, the aura while it works, amber for the person. The places' panels list
  // every agent for the keyboard, so the posts are for the pointer.
  const Node = ({ a, g, j, sel, onOpen, hover, named }) => {
    const at = wpx(g, GEO.posts[a.id]), { done, now } = agentState(a, j), open = sel && sel.kind === "agent" && sel.id === a.id;
    const side = GEO.labels[a.id] || "right", show = named || open || (now && (g.wide || a.human));
    return <span className="town-at" style={{ left: at[0], top: at[1] }}>
      <button type="button" tabIndex={-1} aria-hidden="true" className={cx("town-node", "side-" + side, a.human && "human", done && "on", now && "now", !done && !now && j.k >= 0 && "later", open && "open", show && "named")}
        onClick={() => onOpen({ kind: "agent", id: a.id })} onPointerEnter={() => hover({ kind: "agent", id: a.id })} onPointerLeave={() => hover(null)}>
        <span className={cx("town-node-dot", now && "aura")}><Icon name={a.icon} size={14} stroke={2.1} /></span><span className="town-node-name">{a.name}</span>
      </button></span>;
  };
  // the batch: a card on the town that travels the route with it
  function Batch({ g, j }) {
    const ref = useRef(null), pos = useRef(null), b = j.beat;
    const place = j.done ? null : b ? b.batch : j.k < 0 ? "maker" : null;
    useEffect(() => {
      const el = ref.current; if (!el || !g || !place || place === "sold") return;
      const to = wpx(g, GEO.batch[place]), set = p => { pos.current = p; el.style.left = p[0] + "px"; el.style.top = p[1] + "px"; };
      if (!pos.current || j.reduce || place !== "godown") { set(to); return; }
      const route = GEO.routes.out.map(p => wpx(g, p));
      const c = Motion.animate(0, 1, { duration: 0.5, ease: EASE, onUpdate: u => set(along(route, u)) }); return () => c.stop();
    }, [place, g]);
    if (!place) return null;
    const risk = j.k >= beatOf("risk") && j.k < beatOf("sell");
    const text = b && b.id === "sell" ? `${fmt.num(KL.units)} + ${fmt.num(AW.units)} sold` : j.k >= beatOf("risk") ? `${fmt.num(D.RISK.atRisk)} at risk` : `${fmt.num(BATCH.units)} packs`;
    return <span className="town-at town-batch" ref={ref} aria-hidden="true"><span className={cx("town-batch-card", risk && "risk")}><i><Icon name="package" size={14} stroke={2} /></i><b>{text}</b></span></span>;
  }

  /* ---------- the panel: a place or an agent, opened ---------- */
  function Panel({ sel, j, onOpen, onClose }) {
    const ref = useRef(null);
    useEffect(() => { if (sel && ref.current) ref.current.focus({ preventScroll: true }); }, [sel && sel.kind, sel && sel.id]);
    if (!sel) return null;
    const chips = ids => <span className="town-panel-chips">{ids.map(id => { const a = AGENT[id], { done } = agentState(a, j);
      return <button key={id} type="button" className={cx("town-chip", a.human && "human", done && "on")} onClick={() => onOpen({ kind: "agent", id })}><i><Icon name={a.icon} size={13} stroke={2.2} /></i>{a.name}</button>; })}</span>;
    let body;
    if (sel.kind === "place") {
      const p = PLACE[sel.id], team = AGENTS.filter(a => a.at === p.id).map(a => a.id);
      body = <>
        <header><i><Icon name={p.icon} size={16} stroke={2} /></i><h3 id="town-panel-h">{p.t}</h3></header>
        <p>{p.line}</p>
        {team.length > 0 ? <><span className="town-panel-k">Who works here</span>{chips(team)}</> : <span className="town-panel-k">The Valuer prices it on every plan</span>}
      </>;
    } else {
      const a = AGENT[sel.id], from = EDGES.filter(e => e[1] === a.id).map(e => e[0]), to = EDGES.filter(e => e[0] === a.id).map(e => e[1]);
      body = <>
        <header><i className={cx(a.human && "human")}><Icon name={a.icon} size={16} stroke={2} /></i><h3 id="town-panel-h">{a.name}</h3>
          <button type="button" className="town-panel-at" onClick={() => onOpen({ kind: "place", id: a.at })}>at the {PLACE[a.at].short.toLowerCase()}</button></header>
        <p>{a.job}.</p>
        <p className="town-panel-did"><span className="town-panel-k">This batch</span>{a.did}</p>
        {(from.length > 0 || to.length > 0) && <div className="town-panel-flow">{from.length > 0 && <span><span className="town-panel-k">From</span>{chips(from)}</span>}{to.length > 0 && <span><span className="town-panel-k">Hands to</span>{chips(to)}</span>}</div>}
      </>;
    }
    return <motion.div key={sel.kind + sel.id} id="town-panel" className="town-panel" role="region" aria-labelledby="town-panel-h" tabIndex={-1} ref={ref}
      initial={j.reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: EASE }}
      onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}>
      {body}
      <button type="button" className="town-panel-x" aria-label="Close" onClick={onClose}><Icon name="x" size={16} stroke={2} /></button>
    </motion.div>;
  }

  /* ---------- the caption with its steps, what a screen reader hears, and the controls ---------- */
  function Caption({ j, money, hint }) {
    const b = j.beat;
    return <div className={cx("town-caption", b && b.human && "human")}>
      <button type="button" className="town-step" aria-label="The step before" disabled={j.k <= 0} onClick={() => j.step(-1)}><Icon name="chevron-left" size={16} stroke={2} /></button>
      <span className="town-caption-text" aria-hidden="true">
        {j.k < 0 ? <><b>{fmt.num(BATCH.units)} packs leave the factory.</b><span>Follow them through the business.</span></>
          : b ? <><span className="n">{j.k + 1} of {NB}</span><b>{b.t}</b>{b.who.length > 0 && <span className="who">{names(b)}</span>}<span className="did">{b.id === "report" ? `${fmt.inr(money)} recovered · ${fmt.num(D.PLAN.kg)} kg kept out of landfill` : b.did}</span></>
            : <><span className="n">{NB} of {NB}</span><b>Sold, not binned.</b><span className="did">{RESULT}</span>{hint && <span className="hint">{hint}</span>}</>}
      </span>
      <button type="button" className="town-step" aria-label="The next step" disabled={j.done} onClick={() => j.step(1)}><Icon name="chevron-right" size={16} stroke={2} /></button>
    </div>;
  }
  const said = b => b.id === "report" ? `${fmt.inr(D.ACTUAL.net)} recovered, ${fmt.num(D.PLAN.kg)} kg kept out of landfill` : b.did;
  const SrJourney = ({ j }) => <>
    <ol className="sr-only" aria-label="One batch's journey through the business">{BEATS.map(b => <li key={b.id}>{b.t}{b.who.length ? `, ${names(b)}` : ""}: {said(b)}.</li>)}</ol>
    <p className="sr-only">Sold, not binned: {RESULT}.</p>
    <p className="sr-only" aria-live="polite">{j.manual ? (j.beat ? `${j.k + 1} of ${NB}, ${j.beat.t}: ${said(j.beat)}.` : `Sold, not binned: ${RESULT}.`) : ""}</p>
  </>;
  function Controls({ j, api, g, zoom, onWhole, onReplay }) {
    const c = () => [g.W / 2, g.H * (g.wide ? 0.64 : 0.5)];
    return <div className="town-ctl">
      {!j.reduce && <button type="button" className="replay" onClick={onReplay}><Icon name="rotate-ccw" size={16} stroke={2} />Replay</button>}
      <span className="town-zoom" role="group" aria-label="Zoom">
        <button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => api.zoomAt(1 / 1.45, ...c(), true)}><Icon name="minus" size={16} stroke={2} /></button>
        <button type="button" aria-label="Zoom in" disabled={zoom >= ZMAX} onClick={() => api.zoomAt(1.45, ...c(), true)}><Icon name="plus" size={16} stroke={2} /></button>
        <button type="button" aria-label="The whole business" disabled={zoom <= 1} onClick={onWhole}><Icon name="minimize-2" size={16} stroke={2} /></button>
      </span>
    </div>;
  }

  /* ---------- the town ---------- */
  function Town() {
    const stageRef = useRef(null), plateWorld = useRef(null), topWorld = useRef(null), hazeRef = useRef(null), view = useRef(null);
    const g = useStage(stageRef), { resolved } = useTheme(), dark = resolved === "dark";
    const [ready, setReady] = useState(false), [gl, setGl] = useState(true);
    const j = useJourney(ready);
    const worlds = useMemo(() => ({ get current() { return [plateWorld.current, topWorld.current].filter(Boolean); } }), []);
    const { api, zoom } = useCamera(g, worlds, gl ? { current: null } : hazeRef, j.reduce);
    const depth = useDepthMap(true), map = gl ? depth : null;
    const [follow, setFollow] = useState(true), [sel, setSel] = useState(null), [hov, setHov] = useState(null);
    const money = useCount(j.k >= beatOf("report"), D.ACTUAL.net, j.reduce);
    useGestures(stageRef, api, () => setFollow(false));
    // the camera follows the journey until the visitor takes it: the whole business first, then in to the factory
    useEffect(() => { if (!g || !follow) return; const id = j.done || j.k < 0 ? "rest" : BEATS[j.k].id; api.to(shotOf(g, id), j.k < 0 ? 0 : 0.6); }, [j.k, j.done, follow, g && g.wide, g && g.W]);
    const open = s => {
      setFollow(false); setSel(s);
      const place = s.kind === "place" ? s.id : AGENT[s.id].at, shot = shotOf(g, place);
      api.to(s.kind === "agent" ? [GEO.posts[s.id][0], GEO.posts[s.id][1] + (g.wide ? 0.06 : 0.04), shot[2]] : shot, 0.7);
    };
    const whole = () => { setSel(null); api.to(shotOf(g, "rest"), 0.7); };
    const replay = () => { setSel(null); setFollow(true); j.replay(); };
    useEffect(() => { const k = e => { if (e.key === "Escape" && sel) setSel(null); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [sel]);
    // what the graph lifts: an agent, or a place's team, and its neighbours in the graph
    const focus = useMemo(() => {
      const s = hov || sel; if (!s) return null;
      const core = s.kind === "agent" ? [s.id] : AGENTS.filter(a => a.at === s.id).map(a => a.id), set = new Set(core);
      EDGES.forEach(([a, b]) => { if (core.includes(a)) set.add(b); if (core.includes(b)) set.add(a); });
      return set;
    }, [hov, sel]);
    // where the renderer puts a plate point, for the graph and the pins
    const project = useCallback(gl && map ? (p, id) => { const v = view.current; if (!v) return api.toStage(p); return api.toStage(shifted(p, map.at(p) + (id ? 0.04 : 0), v)); } : null, [gl, map, api]);
    useEffect(() => {
      if (!(gl && map)) return; const el = topWorld.current; if (!el || !g) return;
      const items = [...el.querySelectorAll("[data-at]")];
      const place = () => { const v = view.current; if (!v) return; items.forEach(n => { const p = JSON.parse(n.dataset.at), q = shifted(p, map.at(p) + 0.04, v); n.style.translate = `${((q[0] - p[0]) * g.w).toFixed(2)}px ${((q[1] - p[1]) * g.h).toFixed(2)}px`; }); };
      place(); const a = api.listen(place), b = api.listenView(place); return () => { a(); b(); };
    }, [gl, map, g, api]);
    // Nothing on the town sits under the heading's text or buttons, the caption, the controls or the panel, or half off
    // the stage; once the camera is nearer, nothing it carries into the haze either. The graph is clipped round the
    // heading's boxes.
    const boxes = (sels, pad) => {
      const s = stageRef.current, hero = s && s.closest(".hero"); if (!s || !g || !g.wide) return [];
      const o = s.getBoundingClientRect();
      return [...hero.querySelectorAll(sels)].map(e => { const r = e.getBoundingClientRect(); return [r.left - o.left - pad, r.top - o.top - pad, r.right - o.left + pad, r.bottom - o.top + pad]; });
    };
    const holes = useCallback(() => boxes(".hero-h, .hero-sub, .hero-ctas > *", 8), [g]);
    useEffect(() => {
      const el = topWorld.current, s = stageRef.current; if (!el || !g) return;
      const check = () => {
        const o = s.getBoundingClientRect(), hs = holes().concat(boxes(".town-caption, .town-ctl > *, .town-panel", 6)), near = g.wide && api.t().z > 1.02, haze = GEO.haze[0] * g.H;
        [...el.querySelectorAll("[data-at], .town-batch")].forEach(n => {
          const b = (n.querySelector(".town-pin-body, .town-node, .town-batch-card") || n).getBoundingClientRect(), x0 = b.left - o.left, y0 = b.top - o.top, x1 = b.right - o.left, y1 = b.bottom - o.top;
          const out = x1 < 4 || x0 > g.W - 4 || y1 < 4 || y0 > g.H - 4 || (b.width > 0 && (x0 < -6 || x1 > g.W + 6));
          const under = hs.some(h => x0 < h[2] && x1 > h[0] && y0 < h[3] && y1 > h[1]);
          n.classList.toggle("off", out || under || (near && (y0 + y1) / 2 < haze));
        });
      };
      check(); const a = api.listen(check), b = api.listenView(check); return () => { a(); b(); };
    }, [g, api, holes, j.k, j.done, sel, hov]);
    const named = g && g.wide && (j.done || j.k < 0);
    const hint = g && (g.wide ? "Drag to look round · click a place or an agent" : "Swipe to look round · tap a place");
    return <>
      <div className={cx("hero-scene town-stage", gl && "is-gl", ready && "ready")} ref={stageRef}>
        {gl && g && <DepthPlate g={g} api={api} dark={dark} reduce={j.reduce} map={map} stageRef={stageRef} view={view} onReady={() => setReady(true)} onFail={() => setGl(false)} />}
        <div className="town-world" ref={plateWorld} style={g ? { left: g.ox, top: g.oy, width: g.w, height: g.h } : { visibility: "hidden" }}>
          {!gl && <img src={IMG + (dark ? "business-night.webp" : "business.webp")} width={GEO.nw} height={GEO.nh} draggable="false" onLoad={() => setReady(true)} alt="" />}
        </div>
        {!gl && g && g.wide && <div className="town-haze" ref={hazeRef} aria-hidden="true" />}
        {g && <Graph g={g} api={api} j={j} dark={dark} focus={focus} project={project} holes={holes} />}
        <div className="town-world town-top" ref={topWorld} style={g ? { left: g.ox, top: g.oy, width: g.w, height: g.h } : { visibility: "hidden" }}>
          {g && PLACES.map(p => <span key={p.id} data-at={JSON.stringify(placeAt(g, p.id))} className="town-shift"><Pin p={p} g={g} j={j} sel={sel} onOpen={open} hover={setHov} /></span>)}
          {g && AGENTS.map(a => <span key={a.id} data-at={JSON.stringify(GEO.posts[a.id])} className="town-shift"><Node a={a} g={g} j={j} sel={sel} onOpen={open} hover={setHov} named={named && (!focus || focus.has(a.id))} /></span>)}
          {g && <Batch g={g} j={j} />}
        </div>
        <p className="sr-only">{dark
          ? "The whole business as a miniature town at night: the snack maker's factory and office, the distributor's godown, a lane of kirana shops, a highway to a buyer's warehouse, a food bank, and a fenced landfill, dark."
          : "The whole business as a miniature town in the morning: on the left the snack maker's factory and office, in the middle the distributor's godown full of cartons, on the right a lane of kirana shops hung with snack packets; behind them a highway to a buyer's warehouse in the next town, a food bank, and a fenced landfill, empty."}</p>
      </div>
      <SrJourney j={j} />
      <Caption j={j} money={money} hint={j.done && !sel ? hint : null} />
      <AnimatePresence>{sel && <Panel key="panel" sel={sel} j={j} onOpen={open} onClose={() => setSel(null)} />}</AnimatePresence>
      {g && <Controls j={j} api={api} g={g} zoom={zoom} onWhole={whole} onReplay={replay} />}
    </>;
  }

  window.SC3_TOWN = { Town };
})();

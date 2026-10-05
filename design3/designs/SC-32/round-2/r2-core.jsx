/* SC-32 round 2: the hero as the whole business, built on round 1's option 3 (Follow the batch). One picture holds every
   place the batch can go: the maker's factory and its office, the distributor's godown, the kirana lane, a buyer in the
   next town, a food bank and the landfill. Every agent works at a post in that picture, and the handoffs between them
   draw the agent graph over it. The picture and the graph answer touch, pointer and keyboard: drag or swipe to look
   round, pinch or Ctrl-scroll to zoom, double-click to go nearer, and tap a place or an agent for what it did.

   The journey plays once, in seven beats (4.7 s, WCAG 2.2.2), then holds; Replay plays it again. Under reduced motion
   it is at its result from the start and the camera jumps rather than flies. React 18.3.1 and framer-motion 11.18.2, as
   the other mockups. r2-geo.js, this core and r2-options.jsx compile into r2.js. Every figure is the illustrative
   batch's, worked out by design3/core/money.js. */
(function () {
  function boot() {
    if (!window.React || !window.ReactDOM || !window.Motion || !window.SC32R2_GEO) return;
    const { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } = React;
    const { motion, AnimatePresence, useReducedMotion, animate } = window.Motion;
    const GEO = window.SC32R2_GEO;
    const ICONS = window.SC3_ICONS || {};
    const cx = (...a) => a.filter(Boolean).join(' ');
    const Icon = ({ name, size = 16, stroke = 1.75, className }) => <svg className={cx('ic', className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />;
    const num = n => Math.round(n).toLocaleString('en-IN');
    const inr = n => (n < 0 ? '−₹' : '₹') + num(Math.abs(n));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const EASE = [0.22, 1, 0.36, 1], FLY = [0.65, 0, 0.35, 1];

    /* ---------- the batch and the business ---------- */
    // the illustrative batch's figures, as money.js works them out
    const F = { packs: 1840, perDay: 12, atRisk: 1360, daysLeft: 47, kiranas: 588, shops: 31, buyer: 772, counter: '₹14.20', planNet: 21770, recovered: 21152, bin: 26330, kg: 218 };
    // every place in the picture, and what it is to this batch
    const PLACES = [
      { id: 'maker', t: 'Manufacturer', short: 'Maker', icon: 'factory', line: `Makes the batch. You approve each plan here, and the money comes back here: ${inr(F.recovered)}.` },
      { id: 'godown', t: 'Distributor · stockist', short: 'Distributor', icon: 'warehouse', line: `${num(F.packs)} packs of the batch, selling ${F.perDay} a day: ${num(F.atRisk)} won't sell in the ${F.daysLeft} days left.` },
      { id: 'kiranas', t: 'Retailers', short: 'Kiranas', icon: 'store', line: `${F.shops} kiranas take ${F.kiranas} packs, buy 10 get 2 free.` },
      { id: 'buyer', t: 'A buyer elsewhere', short: 'Buyer', icon: 'shopping-bag', line: `${F.buyer} packs through an ExpireSoon listing, at ${F.counter} a pack.` },
      { id: 'foodbank', t: 'Food bank', short: 'Food bank', icon: 'heart-handshake', line: 'Takes food with 15 or more days left, as a donation. This batch sold before it was needed.' },
      { id: 'landfill', t: 'Landfill', short: 'Landfill', icon: 'trash-2', line: `Destroying the ${num(F.atRisk)} packs would cost ${inr(-F.bin)}. This batch sends none here.` },
    ];
    const PLACE = Object.fromEntries(PLACES.map(p => [p.id, p]));
    // the agents and the person who says yes, each at its post: what it does, and what it did for this batch
    // (jobs as design3/core/platform.js gives them)
    const AGENTS = [
      { id: 'data', name: 'Data', icon: 'database', at: 'godown', job: "Loads the distributor's stock export", did: `${num(F.packs)} packs in stock, selling ${F.perDay} a day` },
      { id: 'watcher', name: 'Watcher', icon: 'eye', at: 'godown', job: "Flags batches that won't sell in time", did: `${num(F.atRisk)} packs won't sell in the ${F.daysLeft} days left` },
      { id: 'vision', name: 'Vision', icon: 'scan-line', at: 'godown', job: 'Reads the label photo from the godown', did: `Read the best-before: ${F.daysLeft} days left` },
      { id: 'valuer', name: 'Valuer', icon: 'scale', at: 'godown', job: 'Prices every exit, the bin included', did: `Five exits priced; the bin would cost ${inr(-F.bin)}` },
      { id: 'router', name: 'Router', icon: 'route', at: 'godown', job: "Splits the batch under each exit's caps", did: `${F.kiranas} to ${F.shops} kiranas, ${F.buyer} to one buyer` },
      { id: 'you', name: 'You', icon: 'hand', at: 'maker', human: true, job: 'You approve every plan, with the money on screen', did: `Approved in one tap, ${inr(F.planNet)} on screen` },
      { id: 'outreach', name: 'Outreach', icon: 'send', at: 'kiranas', job: 'Sends kirana offers', did: `${F.kiranas} packs to ${F.shops} kiranas, buy 10 get 2 free` },
      { id: 'lister', name: 'Lister', icon: 'store', at: 'buyer', job: "Lists on ExpireSoon in the distributor's name", did: `${F.buyer} packs listed` },
      { id: 'negotiator', name: 'Negotiator', icon: 'gavel', at: 'buyer', job: 'Answers bids', did: `Countered a bid to ${F.counter} a pack` },
      { id: 'paperwork', name: 'Paperwork', icon: 'file-text', at: 'maker', job: 'Drafts the invoices, the e-way bill check, the credit note and the GST memo', did: 'Invoices and the price-support credit note, drafted' },
      { id: 'impact', name: 'Impact', icon: 'leaf', at: 'landfill', job: 'Posts the ledger and the sustainability report', did: `${F.kg} kg kept out of landfill` },
    ];
    const AGENT = Object.fromEntries(AGENTS.map(a => [a.id, a]));
    // the handoffs, in the order they happen: the agent graph
    const EDGES = [['data', 'watcher'], ['watcher', 'vision'], ['vision', 'valuer'], ['valuer', 'router'], ['router', 'you'], ['you', 'outreach'], ['you', 'lister'],
      ['lister', 'negotiator'], ['outreach', 'paperwork'], ['negotiator', 'paperwork'], ['paperwork', 'impact']];
    // the journey, beat by beat: where it happens, who works, what it did, how long it holds (ms), and where the batch is
    const BEATS = [
      { id: 'make', at: ['maker'], t: 'Made', did: `${num(F.packs)} packs leave the factory for the distributor`, who: [], ms: 600, batch: 'maker' },
      { id: 'stock', at: ['godown'], t: 'Stocked', did: `${num(F.packs)} packs in the distributor's godown, selling ${F.perDay} a day`, who: [], ms: 500, batch: 'godown' },
      { id: 'risk', at: ['godown'], t: 'At risk', did: `${num(F.atRisk)} packs won't sell in the ${F.daysLeft} days left`, who: ['data', 'watcher', 'vision'], ms: 700, batch: 'godown' },
      { id: 'route', at: ['godown'], t: 'Priced and split', did: `Five exits priced · ${F.kiranas} to ${F.shops} kiranas, ${F.buyer} to one buyer`, who: ['valuer', 'router'], ms: 600, batch: 'godown' },
      { id: 'yes', at: ['maker'], t: 'One yes', did: `You approve in one tap · ${inr(F.planNet)} on screen`, who: ['you'], human: true, ms: 900, batch: 'godown' },
      { id: 'sell', at: ['kiranas', 'buyer'], t: 'Sold', did: `${F.kiranas} packs to ${F.shops} kiranas · ${F.buyer} to a buyer, countered to ${F.counter}`, who: ['outreach', 'lister', 'negotiator'], ms: 700, batch: 'sold' },
      { id: 'report', at: ['maker', 'landfill'], t: 'Settled', did: `${inr(F.recovered)} recovered · ${F.kg} kg kept out of landfill`, who: ['paperwork', 'impact'], ms: 700, batch: null },
    ];
    const NB = BEATS.length;
    const beatOf = id => BEATS.findIndex(b => b.id === id);
    const names = b => b.who.map(w => AGENT[w].name).join(' · ');
    // the beat each agent works in
    AGENTS.forEach(a => { a.beat = BEATS.findIndex(b => b.who.includes(a.id)); });
    const RESULT = `${inr(F.recovered)} recovered, instead of ${inr(-F.bin)} to destroy it`;
    // where an agent stands in the journey: done once its beat is past, working during it
    const agentState = (a, j) => ({ done: a.beat < j.k || j.done, now: a.beat === j.k && j.playing });

    /* ---------- the stage, and the picture laid in it ---------- */
    // The picture is cover-fitted in the stage at the plate's aspect: the world box. The world moves under the camera;
    // everything placed on the picture sits in the world, in its px at rest, and keeps its own size as the camera nears.
    function useStage(ref) {
      const [g, setG] = useState(null);
      useLayoutEffect(() => {
        const el = ref.current; if (!el) return;
        const measure = () => {
          const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return;
          const s = Math.max(W / GEO.nw, H / GEO.nh), w = GEO.nw * s, h = GEO.nh * s;
          const wide = W >= 900;
          const [px, py] = wide ? [0.5, 0.5] : GEO.phoneRest || [0.5, 0.5];
          setG(o => (o && o.W === W && o.H === H ? o : { W, H, w, h, s, ox: (W - w) * px, oy: (H - h) * py, wide }));
        };
        measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
      }, []);
      return g;
    }
    // a plate point, in the world's px
    const wpx = (g, p) => [p[0] * g.w, p[1] * g.h];

    /* ---------- the camera ---------- */
    // It looks at a plate point, held at the stage's anchor, from a zoom of 1 (the whole picture) up to ZMAX; clamped so
    // the picture always fills the stage. It writes the world's transform itself, frame by frame, and tells whoever
    // listens (the graph, the depth renderer); React hears only when the zoom passes a step.
    const ZMAX = 2.6;
    function useCamera(g, worldRef, skyRef, reduce) {
      const cam = useRef({ x: 0.5, y: 0.5, z: 1 }), live = useRef(null), subs = useRef(new Set()), views = useRef(new Set()), gRef = useRef(g);
      const [zoom, setZoom] = useState(1);
      gRef.current = g;
      const anchor = G => (G.wide ? [0.5, 0.64] : [0.5, 0.5]);
      const solve = (c, G = gRef.current) => {
        const z = clamp(c.z, 1, ZMAX), [ax, ay] = anchor(G);
        const tx = clamp(ax * G.W - G.ox - c.x * G.w * z, G.W - G.ox - G.w * z, -G.ox), ty = clamp(ay * G.H - G.oy - c.y * G.h * z, G.H - G.oy - G.h * z, -G.oy);
        return { tx, ty, z };
      };
      // the focus a transform holds at the anchor, so a clamped camera never drifts
      const focusOf = (t, G = gRef.current) => { const [ax, ay] = anchor(G); return { x: (ax * G.W - G.ox - t.tx) / (G.w * t.z), y: (ay * G.H - G.oy - t.ty) / (G.h * t.z), z: t.z }; };
      const write = c => {
        const G = gRef.current; if (!G) return;
        const t = solve(c); cam.current = focusOf(t); live.current = t;
        [].concat(worldRef.current || []).forEach(el => { el.style.transform = `translate(${t.tx.toFixed(2)}px, ${t.ty.toFixed(2)}px) scale(${t.z.toFixed(4)})`; el.style.setProperty('--iz', (1 / t.z).toFixed(4)); });
        if (skyRef && skyRef.current) skyRef.current.style.opacity = clamp((t.z - 1) / 0.28, 0, 1).toFixed(3);
        subs.current.forEach(f => f(t));
        const step = Math.round(t.z * 10) / 10; setZoom(s => (s === step ? s : step));
      };
      const fly = useRef(null);
      const stop = () => { if (fly.current) { fly.current.stop(); fly.current = null; } };
      const api = useMemo(() => ({
        get: () => cam.current, t: () => live.current || (gRef.current ? solve(cam.current) : { tx: 0, ty: 0, z: 1 }),
        set: c => { stop(); write(c); },
        // fly to a shot ([x, y, z]); jumps under reduced motion
        to: (shot, dur = 0.7) => {
          stop(); const to = { x: shot[0], y: shot[1], z: shot[2] };
          if (reduce || dur <= 0) { write(to); return; }
          const from = { ...cam.current }, lz0 = Math.log(from.z), lz1 = Math.log(to.z);
          fly.current = animate(0, 1, { duration: dur, ease: FLY, onUpdate: u => write({ x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u, z: Math.exp(lz0 + (lz1 - lz0) * u) }) });
        },
        stop,
        // move by a drag, in stage px, from a transform taken at its start
        drag: (t0, dx, dy) => { stop(); write(focusOf(solve(focusOf({ tx: t0.tx + dx, ty: t0.ty + dy, z: t0.z })))); },
        // zoom by a factor about a stage point, which stays under the pointer
        zoomAt: (f, sx, sy, smooth) => {
          const G = gRef.current, t = api.t(), z1 = clamp(t.z * f, 1, ZMAX);
          const px = (sx - G.ox - t.tx) / (G.w * t.z), py = (sy - G.oy - t.ty) / (G.h * t.z);
          const t1 = { tx: sx - G.ox - px * G.w * z1, ty: sy - G.oy - py * G.h * z1, z: z1 }, c1 = focusOf(t1);
          if (smooth) api.to([c1.x, c1.y, c1.z], 0.42); else { stop(); write(c1); }
        },
        // a plate point on the stage, now
        toStage: p => { const G = gRef.current, t = api.t(); return [G.ox + t.tx + p[0] * G.w * t.z, G.oy + t.ty + p[1] * G.h * t.z]; },
        listen: f => { subs.current.add(f); return () => subs.current.delete(f); },
        // the depth renderer's own changes (its tilt and focus), for what sits on the picture
        listenView: f => { views.current.add(f); return () => views.current.delete(f); },
        viewChanged: () => views.current.forEach(f => f()),
        refresh: () => write(cam.current),
      }), [reduce]);
      // keep the framing as the stage resizes
      useLayoutEffect(() => { if (g) write(cam.current); }, [g]);
      return { api, zoom };
    }
    // the shot for a beat or a place, at this width
    const shotOf = (g, id) => { const S = GEO.shots[g && g.wide ? 'wide' : 'phone']; return S[id] || S.rest; };

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
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 1) moved = false;
          if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, t: api.t() };
          if (pts.size === 2) { const s = two(); pinch = { ...s, t: api.t() }; drag = null; }
        };
        const move = e => {
          if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
          if (pinch && pts.size >= 2) {
            const s = two(), G = api.t(); if (!moved) { moved = true; user.current(); }
            api.zoomAt(s.d / pinch.d * pinch.t.z / G.z, pinch.m[0], pinch.m[1], false); pinch.d = s.d; pinch.t = api.t();
            return;
          }
          if (!drag) return;
          const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          if (!moved) { if (Math.hypot(dx, dy) < 6) return; moved = true; user.current(); el.classList.add('dragging'); try { el.setPointerCapture(e.pointerId); } catch (_) {} }
          api.drag(drag.t, dx, dy);
        };
        const up = e => {
          pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
          if (pts.size === 1) { const [p] = [...pts.values()]; drag = { x: p[0], y: p[1], t: api.t() }; }
          if (pts.size === 0) { drag = null; el.classList.remove('dragging'); }
        };
        const click = e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } };
        const wheel = e => { if (!e.ctrlKey) return; e.preventDefault(); user.current(); const [x, y] = local(e.clientX, e.clientY); api.zoomAt(Math.exp(-e.deltaY * 0.01), x, y, false); };
        const dbl = e => { if (e.target.closest('button')) return; user.current(); const [x, y] = local(e.clientX, e.clientY); const z = api.t().z; api.zoomAt(z >= 2.2 ? 1 / z : 1.7, x, y, true); };
        el.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
        el.addEventListener('click', click, true); el.addEventListener('wheel', wheel, { passive: false }); el.addEventListener('dblclick', dbl);
        return () => {
          el.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
          el.removeEventListener('click', click, true); el.removeEventListener('wheel', wheel); el.removeEventListener('dblclick', dbl);
        };
      }, [api]);
    }

    /* ---------- the journey ---------- */
    // -1 before it sets off, 0 to 6 at a beat, 7 when it is done. It sets off half a second after the picture has loaded.
    // holdAt: a beat it waits at until the visitor acts (option 3's yes). Stepping by hand stops the clock.
    function useJourney(ready, holdAt) {
      const reduce = !!useReducedMotion();
      const rest = holdAt != null ? holdAt : NB;
      const [k, setK] = useState(reduce ? rest : -1); const [run, setRun] = useState(0);
      const [held, setHeld] = useState(holdAt != null); const [manual, setManual] = useState(false);
      useEffect(() => { if (reduce) { setK(holdAt != null ? holdAt : NB); return; } if (!ready) return; setK(-1); const t = setTimeout(() => setK(0), 500); return () => clearTimeout(t); }, [ready, run, reduce]);
      useEffect(() => {
        if (reduce || manual || k < 0 || k >= NB) return; if (held && k === holdAt) return;
        const t = setTimeout(() => setK(k + 1), BEATS[k].ms); return () => clearTimeout(t);
      }, [k, reduce, held, manual]);
      const j = { k, reduce, run, held: held && k === holdAt, playing: k >= 0 && k < NB && !manual, manual, done: k >= NB, beat: k >= 0 && k < NB ? BEATS[k] : null };
      j.replay = () => { setManual(false); setHeld(holdAt != null); setRun(r => r + 1); if (reduce) setK(holdAt != null ? holdAt : NB); };
      j.approve = () => { setHeld(false); if (reduce || manual) setK(NB); else setK(holdAt + 1); };
      j.step = d => { setManual(true); setK(v => { const n = clamp((v < 0 ? 0 : v) + d, 0, NB); if (held && holdAt != null && v <= holdAt && n > holdAt) { setHeld(false); } return n; }); };
      j.finish = () => { if (!(held && k === holdAt)) { setManual(true); setK(NB); } };
      return j;
    }
    // a figure that counts up once while `on` (700 ms, the system's roll), at its value under reduced motion
    function useCount(on, to, reduce) {
      const [v, setV] = useState(on || reduce ? to : 0);
      useEffect(() => { if (reduce) { setV(to); return; } if (!on) { setV(0); return; } const c = animate(0, to, { duration: 0.7, ease: EASE, onUpdate: x => setV(x) }); return () => c.stop(); }, [on, reduce]);
      return v;
    }
    // is the page dark? (the theme's own attribute, set by sc28.js)
    function useDark() {
      const read = () => document.documentElement.getAttribute('data-theme') === 'dark';
      const [d, setD] = useState(read);
      useEffect(() => { const mo = new MutationObserver(() => setD(read())); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); return () => mo.disconnect(); }, []);
      return d;
    }
    // a point along a polyline, t from 0 to 1 by length
    function along(pts, t) {
      const seg = []; let L = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
      let s = clamp(t, 0, 1) * L;
      for (let i = 0; i < seg.length; i++) { if (s <= seg[i] || i === seg.length - 1) { const u = seg[i] ? Math.min(1, s / seg[i]) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; } s -= seg[i]; }
      return pts[pts.length - 1];
    }
    // a canvas the size of the stage, at the device's pixel ratio (at most 2)
    function fitCanvas(cv, W, H) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(W), h = Math.round(H);
      if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
      const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
    }

    /* ---------- the graph, the packs and the route, drawn over the picture ---------- */
    // Each handoff draws in (320 ms) as its agent starts work, an arc from post to post; amber where the person is in it.
    // Hovering or opening an agent or a place lifts its handoffs and quiets the rest. When the batch sells, its packs run
    // out to the kiranas (green) and up the highway to the buyer (violet), and settle.
    function GraphCanvas({ g, api, j, dark, focus, project, holes }) {
      const cv = useRef(null), prog = useRef({}), raf = useRef(0), packs = useRef(null);
      const st = useRef({}); st.current = { g, j, dark, focus, project, holes };
      const draw = useCallback(() => {
        const c = cv.current, s = st.current; if (!c || !s.g) return;
        const ctx = fitCanvas(c, s.g.W, s.g.H); ctx.clearRect(0, 0, s.g.W, s.g.H);
        const z = api.t().z; ctx.save();
        // round the heading's text and buttons, never across them
        const hs = s.holes ? s.holes() : [];
        if (hs.length) { ctx.beginPath(); ctx.rect(0, 0, s.g.W, s.g.H); hs.forEach(h => ctx.rect(h[0], h[1], h[2] - h[0], h[3] - h[1])); ctx.clip('evenodd'); }
        const P = id => (s.project ? s.project(GEO.posts[id], id) : api.toStage(GEO.posts[id]));
        const lit = s.dark ? '#3ccb8a' : '#167a52', amber = s.dark ? '#f7c04a' : '#e8a722';
        // Each handoff is a bow between its posts. The graph rests quiet: thin lines in their own colour, faint. The handoff
        // happening now, or those of what is hovered or open, stand out: bolder, on a thin casing of the plate's light.
        const casing = s.dark ? 'rgba(8,14,11,0.6)' : 'rgba(255,255,255,0.75)';
        const k = s.j.done ? NB : s.j.k;
        EDGES.forEach(([a, b]) => {
          const p = prog.current[a + b] || 0; if (p <= 0) return;
          // a handoff within a place bows up; one between places dips, as if it travelled the road
          const A = P(a), B = P(b), d = Math.hypot(B[0] - A[0], B[1] - A[1]), mx = (A[0] + B[0]) / 2, far = AGENT[a].at !== AGENT[b].at;
          const my = (A[1] + B[1]) / 2 + (far ? Math.min(110, d * 0.2) : -Math.min(70, d * 0.22));
          const loud = s.focus ? s.focus.has(a) && s.focus.has(b) : AGENT[b].beat === k && !s.j.done;
          const hue = AGENT[a].human || AGENT[b].human ? amber : lit;
          const n = 36, m = Math.max(1, Math.round(n * p));
          const path = () => { ctx.beginPath(); ctx.moveTo(A[0], A[1]); for (let i = 1; i <= m; i++) { const t = i / n, u = 1 - t; ctx.lineTo(u * u * A[0] + 2 * u * t * mx + t * t * B[0], u * u * A[1] + 2 * u * t * my + t * t * B[1]); } };
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          if (loud) { path(); ctx.lineWidth = 6; ctx.strokeStyle = casing; ctx.stroke(); path(); ctx.lineWidth = 3; ctx.strokeStyle = hue; ctx.stroke(); }
          else { ctx.globalAlpha = s.focus ? 0.22 : 0.5; path(); ctx.lineWidth = 1.5; ctx.strokeStyle = hue; ctx.stroke(); ctx.globalAlpha = 1; }
        });
        // the packs, out from the godown when the batch sells
        const pk = packs.current;
        if (pk) {
          const now = performance.now(), u = clamp((now - pk.t0) / pk.dur, 0, 1);
          pk.list.forEach(d => {
            const t = clamp((u - d.delay) / (1 - d.delay), 0, 1); if (t <= 0) return;
            const e = 1 - Math.pow(1 - t, 3), q = along(GEO.routes[d.to], e), [x, y] = s.project ? s.project(q) : api.toStage(q);
            ctx.globalAlpha = t >= 1 ? clamp(1 - (now - pk.t0 - pk.dur) / 400, 0, 1) : 1;
            ctx.beginPath(); ctx.arc(x, y, 3.6 * Math.max(1, Math.sqrt(z)), 0, Math.PI * 2);
            ctx.fillStyle = d.to === 'buyer' ? (s.dark ? '#8a6ee8' : '#7c5cd6') : lit; ctx.fill();
            ctx.lineWidth = 1.2; ctx.strokeStyle = s.dark ? 'rgba(10,16,13,0.8)' : '#ffffff'; ctx.stroke();
          });
          ctx.globalAlpha = 1;
          if (now - pk.t0 > pk.dur + 420) packs.current = null;
        }
        ctx.restore();
      }, [api]);
      // animate the handoffs in as the journey reaches them
      useEffect(() => {
        const k = j.done ? NB : j.k; const want = {};
        EDGES.forEach(([a, b]) => { want[a + b] = AGENT[b].beat >= 0 && (AGENT[b].beat < k || (AGENT[b].beat === k && (j.playing || j.manual))) ? 1 : 0; });
        if (j.reduce) { prog.current = want; draw(); return; }
        let alive = true; const t0 = performance.now(), from = { ...prog.current };
        const tick = () => {
          if (!alive) return; const u = clamp((performance.now() - t0) / 320, 0, 1);
          Object.keys(want).forEach(key => { prog.current[key] = (from[key] || 0) + (want[key] - (from[key] || 0)) * (want[key] > (from[key] || 0) ? u : 1); });
          draw(); if (u < 1 || packs.current) raf.current = requestAnimationFrame(tick);
        };
        if (BEATS[j.k] && BEATS[j.k].id === 'sell' && j.playing) {
          const list = []; for (let i = 0; i < 26; i++) list.push({ to: i % 13 < 6 ? 'kiranas' : 'buyer', delay: (i / 26) * 0.45 });
          packs.current = { t0: performance.now(), dur: 650, list };
        }
        cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(tick);
        return () => { alive = false; cancelAnimationFrame(raf.current); };
      }, [j.k, j.done, j.reduce, j.run]);
      useEffect(() => { const a = api.listen(() => draw()), b = api.listenView(() => draw()); return () => { a(); b(); }; }, [api, draw]);
      useEffect(() => { draw(); }, [dark, focus, g]);
      return <canvas ref={cv} className="r2-graph" aria-hidden="true" />;
    }

    /* ---------- what sits on the picture ---------- */
    // a place's pin: its icon and name on a short stem, lit while the batch is there; a button that opens the place
    const Pin = ({ p, g, j, sel, onOpen, hover }) => {
      const at = wpx(g, GEO.places[p.id].pin), here = j.beat && j.beat.at.includes(p.id), open = sel && sel.kind === 'place' && sel.id === p.id;
      const edge = GEO.places[p.id].edge;
      return <span className="r2-at" style={{ left: at[0], top: at[1] }}>
        <button type="button" className={cx('r2-pin', here && 'here', open && 'open', edge && 'edge-' + edge)} aria-expanded={open} aria-controls={open ? 'r2-panel' : undefined}
          aria-label={`${p.t}: what happens here`} onClick={() => onOpen({ kind: 'place', id: p.id })} onPointerEnter={() => hover({ kind: 'place', id: p.id })} onPointerLeave={() => hover(null)}>
          <span className="r2-pin-body"><i><Icon name={p.icon} size={14} stroke={2} /></i><b>{g.wide ? p.t : p.short}</b></span><span className="r2-pin-stem" />
        </button></span>;
    };
    // an agent at its post: its icon, and its name beside it (on desktops at rest and while it works; on phones when open);
    // lit once it has worked, wearing the aura while it works, amber for the person
    const Node = ({ a, g, j, sel, onOpen, hover, named }) => {
      const at = wpx(g, GEO.posts[a.id]), { done, now } = agentState(a, j), open = sel && sel.kind === 'agent' && sel.id === a.id;
      // on phones only the person keeps a name through the tour; the caption names whoever is working
      const side = (GEO.labels || {})[a.id] || 'right', show = named || open || (now && (g.wide || a.human)) || (!g.wide && a.human && j.held);
      return <span className="r2-at" style={{ left: at[0], top: at[1] }}>
        <button type="button" tabIndex={-1} aria-hidden="true" className={cx('r2-node', 'side-' + side, a.human && 'human', done && 'on', now && 'now', !done && !now && j.k >= 0 && 'later', open && 'open', show && 'named')}
          onClick={() => onOpen({ kind: 'agent', id: a.id })} onPointerEnter={() => hover({ kind: 'agent', id: a.id })} onPointerLeave={() => hover(null)}>
          <span className={cx('r2-node-dot', now && 'aura')}><Icon name={a.icon} size={14} stroke={2.1} /></span><span className="r2-node-name">{a.name}</span>
        </button></span>;
    };
    // the batch: a card on the picture that travels the route with it
    function Batch({ g, j }) {
      const ref = useRef(null), pos = useRef(null), b = j.beat;
      const place = j.done ? null : b ? b.batch : j.k < 0 ? 'maker' : null;
      useEffect(() => {
        const el = ref.current; if (!el || !g || !place || place === 'sold') return;
        const to = wpx(g, GEO.batch[place]);
        const from = pos.current;
        const set = p => { pos.current = p; el.style.left = p[0] + 'px'; el.style.top = p[1] + 'px'; };
        if (!from || j.reduce || place !== 'godown' || !GEO.routes.out) { set(to); return; }
        const route = GEO.routes.out.map(p => wpx(g, p));
        const c = animate(0, 1, { duration: 0.5, ease: EASE, onUpdate: u => set(along(route, u)) }); return () => c.stop();
      }, [place, g]);
      if (!place) return null;
      const text = b && b.id === 'sell' ? `${F.kiranas} + ${F.buyer} sold` : j.k >= beatOf('risk') ? `${num(F.atRisk)} at risk` : `${num(F.packs)} packs`;
      return <span className="r2-at r2-batch" ref={ref} aria-hidden="true"><span className={cx('r2-batch-card', j.k >= beatOf('risk') && j.k < beatOf('sell') && 'risk')}><i><Icon name="package" size={14} stroke={2} /></i><b>{text}</b></span></span>;
    }

    /* ---------- the panel: a place or an agent, opened ---------- */
    function Panel({ sel, j, onOpen, onClose, money }) {
      const ref = useRef(null);
      useEffect(() => { if (sel && ref.current) ref.current.focus({ preventScroll: true }); }, [sel && sel.kind, sel && sel.id]);
      if (!sel) return null;
      const chips = ids => <span className="r2-panel-chips">{ids.map(id => { const a = AGENT[id], { done } = agentState(a, j);
        return <button key={id} type="button" className={cx('r2-chip', a.human && 'human', done && 'on')} onClick={() => onOpen({ kind: 'agent', id })}><i><Icon name={a.icon} size={13} stroke={2.2} /></i>{a.name}</button>; })}</span>;
      let body;
      if (sel.kind === 'place') {
        const p = PLACE[sel.id], team = AGENTS.filter(a => a.at === p.id).map(a => a.id);
        body = <>
          <header><i><Icon name={p.icon} size={16} stroke={2} /></i><h3 id="r2-panel-h">{p.t}</h3></header>
          <p>{p.id === 'maker' && j.done ? `Makes the batch. You approve each plan here, and the money comes back here: ${inr(money)}.` : p.line}</p>
          {team.length > 0 ? <><span className="r2-panel-k">Who works here</span>{chips(team)}</> : <span className="r2-panel-k">The Valuer prices it on every plan</span>}
        </>;
      } else {
        const a = AGENT[sel.id], from = EDGES.filter(e => e[1] === a.id).map(e => e[0]), to = EDGES.filter(e => e[0] === a.id).map(e => e[1]);
        body = <>
          <header><i className={cx(a.human && 'human')}><Icon name={a.icon} size={16} stroke={2} /></i><h3 id="r2-panel-h">{a.name}</h3>
            <button type="button" className="r2-panel-at" onClick={() => onOpen({ kind: 'place', id: a.at })}>at the {PLACE[a.at].short.toLowerCase()}</button></header>
          <p>{a.job}.</p>
          <p className="r2-panel-did"><span className="r2-panel-k">This batch</span>{a.did}</p>
          {(from.length > 0 || to.length > 0) && <div className="r2-panel-flow">{from.length > 0 && <span><span className="r2-panel-k">From</span>{chips(from)}</span>}{to.length > 0 && <span><span className="r2-panel-k">Hands to</span>{chips(to)}</span>}</div>}
        </>;
      }
      return <motion.div key={sel.kind + sel.id} id="r2-panel" className="r2-panel" role="region" aria-labelledby="r2-panel-h" tabIndex={-1} ref={ref}
        initial={j.reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: EASE }}
        onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
        {body}
        <button type="button" className="r2-panel-x" aria-label="Close" onClick={onClose}><Icon name="x" size={16} stroke={2} /></button>
      </motion.div>;
    }

    /* ---------- the caption, the steps and the controls ---------- */
    function Caption({ j, money, hint }) {
      const b = j.beat;
      return <div className={cx('r2-caption', b && b.human && 'human')}>
        <button type="button" className="r2-step" aria-label="The step before" disabled={j.k <= 0} onClick={() => j.step(-1)}><Icon name="chevron-left" size={16} stroke={2} /></button>
        <span className="r2-caption-text" aria-hidden="true">
          {j.k < 0 ? <><b>{num(F.packs)} packs leave the factory.</b><span>Follow them through the business.</span></>
            : b ? <><span className="n">{j.k + 1} of {NB}</span><b>{b.t}</b>{b.who.length > 0 && <span className="who">{names(b)}</span>}<span className="did">{b.id === 'report' ? `${inr(money)} recovered · ${F.kg} kg kept out of landfill` : b.did}</span></>
              : <><span className="n">{NB} of {NB}</span><b>Sold, not binned.</b><span className="did">{RESULT}</span>{hint && <span className="hint">{hint}</span>}</>}
        </span>
        <button type="button" className="r2-step" aria-label="The next step" disabled={j.done || j.held} onClick={() => j.step(1)}><Icon name="chevron-right" size={16} stroke={2} /></button>
      </div>;
    }
    // what a screen reader hears: the journey as a list, and each step as it is taken by hand
    const SrJourney = ({ j }) => <>
      <ol className="sr-only" aria-label="One batch's journey through the business">{BEATS.map(b => <li key={b.id}>{b.t}{b.who.length ? `, ${names(b)}` : ''}: {b.did}.</li>)}</ol>
      <p className="sr-only">Sold, not binned: {RESULT}.</p>
      <p className="sr-only" aria-live="polite">{j.manual ? (j.beat ? `${j.k + 1} of ${NB}, ${j.beat.t}: ${j.beat.did}.` : `Sold, not binned: ${RESULT}.`) : ''}</p>
    </>;
    function Controls({ j, api, g, zoom, onWhole }) {
      const c = () => [g.W / 2, g.H * (g.wide ? 0.64 : 0.5)];
      return <div className="r2-ctl">
        {!j.reduce && <button type="button" className="replay" onClick={j.replay}><Icon name="rotate-ccw" size={16} stroke={2} />Replay</button>}
        <span className="r2-zoom" role="group" aria-label="Zoom">
          <button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => api.zoomAt(1 / 1.45, ...c(), true)}><Icon name="minus" size={16} stroke={2} /></button>
          <button type="button" aria-label="Zoom in" disabled={zoom >= ZMAX} onClick={() => api.zoomAt(1.45, ...c(), true)}><Icon name="plus" size={16} stroke={2} /></button>
          <button type="button" aria-label="The whole business" disabled={zoom <= 1} onClick={onWhole}><Icon name="minimize-2" size={16} stroke={2} /></button>
        </span>
      </div>;
    }

    window.SC32R2 = { React, useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback, motion, AnimatePresence, useReducedMotion, animate, cx, Icon, num, inr, clamp, EASE, FLY,
      GEO, F, PLACES, PLACE, AGENTS, AGENT, EDGES, BEATS, NB, beatOf, names, RESULT, agentState, useStage, wpx, useCamera, shotOf, useGestures, useJourney, useCount, useDark, along, fitCanvas,
      GraphCanvas, Pin, Node, Batch, Panel, Caption, SrJourney, Controls, ZMAX };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

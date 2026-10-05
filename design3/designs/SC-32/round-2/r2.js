/* SC-32 round 2: the whole-business plate's geography, as fractions of the plate (img/business.webp, business-night.webp
   and business-depth.webp, composed alike). Pins sit on their places' roofs; each agent's post is where it works, its
   name to the side the label says; the routes follow the plate's green path from the maker's loading bay, along the
   front road to the kiranas, and up to the highway to the buyer's warehouse. */
window.SC32R2_GEO = {
  day: '../img/business.webp', night: '../img/business-night.webp', depth: '../img/business-depth.webp', nw: 2752, nh: 1536,
  phoneRest: [0.5, 0.5],
  places: {
    maker: { pin: [0.175, 0.415] }, godown: { pin: [0.47, 0.44] }, kiranas: { pin: [0.79, 0.45] },
    buyer: { pin: [0.8, 0.32] }, foodbank: { pin: [0.55, 0.385] }, landfill: { pin: [0.16, 0.265] },
  },
  posts: {
    data: [0.355, 0.6], watcher: [0.395, 0.475], vision: [0.585, 0.455], valuer: [0.645, 0.545], router: [0.6, 0.705],
    you: [0.15, 0.585], paperwork: [0.085, 0.64], outreach: [0.875, 0.5], lister: [0.885, 0.415], negotiator: [0.955, 0.47], impact: [0.27, 0.315],
  },
  labels: { data: 'left', watcher: 'left', paperwork: 'right', negotiator: 'left', lister: 'left', impact: 'right', outreach: 'left' },
  routes: {
    out: [[0.312, 0.66], [0.335, 0.72], [0.38, 0.748], [0.436, 0.756], [0.5, 0.762]],
    kiranas: [[0.5, 0.762], [0.58, 0.78], [0.65, 0.795], [0.727, 0.814], [0.8, 0.83]],
    buyer: [[0.5, 0.762], [0.58, 0.78], [0.727, 0.814], [0.836, 0.833], [0.86, 0.8], [0.85, 0.68], [0.815, 0.51], [0.735, 0.38], [0.69, 0.31], [0.75, 0.31], [0.84, 0.335]],
  },
  batch: { maker: [0.31, 0.655], godown: [0.5, 0.665], kiranas: [0.8, 0.8], buyer: [0.84, 0.335] },
  shots: {
    wide: { rest: [0.5, 0.5, 1], make: [0.22, 0.58, 1.65], stock: [0.5, 0.56, 1.55], risk: [0.5, 0.55, 1.7], route: [0.56, 0.52, 1.3],
      yes: [0.17, 0.58, 1.7], sell: [0.8, 0.53, 1.3], report: [0.2, 0.47, 1.4],
      maker: [0.18, 0.58, 1.8], godown: [0.5, 0.6, 1.8], kiranas: [0.8, 0.62, 1.8], buyer: [0.8, 0.3, 2], foodbank: [0.52, 0.4, 2], landfill: [0.17, 0.32, 2] },
    phone: { rest: [0.5, 0.55, 1], make: [0.22, 0.6, 1.3], stock: [0.5, 0.62, 1.3], risk: [0.5, 0.6, 1.45], route: [0.55, 0.55, 1.1],
      yes: [0.15, 0.6, 1.4], sell: [0.8, 0.6, 1.15], report: [0.17, 0.5, 1.2],
      maker: [0.18, 0.58, 1.4], godown: [0.5, 0.6, 1.4], kiranas: [0.8, 0.62, 1.4], buyer: [0.8, 0.32, 1.6], foodbank: [0.52, 0.4, 1.6], landfill: [0.17, 0.32, 1.6] },
  },
  // the band behind the heading on desktops, as fractions of the stage's height: solid sky, then fading out
  sky: [0.3, 0.42],
};
// a published copy sets window.SC32R2_BASE (the commit's raw folder for round 2) before this runs, and the plates load
// from there
(function (b) { if (!b) return; const G = window.SC32R2_GEO; ['day', 'night', 'depth'].forEach(k => { if (G[k]) G[k] = G[k].replace('../', b); }); })(window.SC32R2_BASE);
(function() {
  function boot() {
    if (!window.React || !window.ReactDOM || !window.Motion || !window.SC32R2_GEO) return;
    const { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } = React;
    const { motion, AnimatePresence, useReducedMotion, animate } = window.Motion;
    const GEO = window.SC32R2_GEO;
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
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const EASE = [0.22, 1, 0.36, 1], FLY = [0.65, 0, 0.35, 1];
    const F = { packs: 1840, perDay: 12, atRisk: 1360, daysLeft: 47, kiranas: 588, shops: 31, buyer: 772, counter: "₹14.20", planNet: 21770, recovered: 21152, bin: 26330, kg: 218 };
    const PLACES = [
      { id: "maker", t: "Manufacturer", short: "Maker", icon: "factory", line: `Makes the batch. You approve each plan here, and the money comes back here: ${inr(F.recovered)}.` },
      { id: "godown", t: "Distributor · stockist", short: "Distributor", icon: "warehouse", line: `${num(F.packs)} packs of the batch, selling ${F.perDay} a day: ${num(F.atRisk)} won't sell in the ${F.daysLeft} days left.` },
      { id: "kiranas", t: "Retailers", short: "Kiranas", icon: "store", line: `${F.shops} kiranas take ${F.kiranas} packs, buy 10 get 2 free.` },
      { id: "buyer", t: "A buyer elsewhere", short: "Buyer", icon: "shopping-bag", line: `${F.buyer} packs through an ExpireSoon listing, at ${F.counter} a pack.` },
      { id: "foodbank", t: "Food bank", short: "Food bank", icon: "heart-handshake", line: "Takes food with 15 or more days left, as a donation. This batch sold before it was needed." },
      { id: "landfill", t: "Landfill", short: "Landfill", icon: "trash-2", line: `Destroying the ${num(F.atRisk)} packs would cost ${inr(-F.bin)}. This batch sends none here.` }
    ];
    const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p]));
    const AGENTS = [
      { id: "data", name: "Data", icon: "database", at: "godown", job: "Loads the distributor's stock export", did: `${num(F.packs)} packs in stock, selling ${F.perDay} a day` },
      { id: "watcher", name: "Watcher", icon: "eye", at: "godown", job: "Flags batches that won't sell in time", did: `${num(F.atRisk)} packs won't sell in the ${F.daysLeft} days left` },
      { id: "vision", name: "Vision", icon: "scan-line", at: "godown", job: "Reads the label photo from the godown", did: `Read the best-before: ${F.daysLeft} days left` },
      { id: "valuer", name: "Valuer", icon: "scale", at: "godown", job: "Prices every exit, the bin included", did: `Five exits priced; the bin would cost ${inr(-F.bin)}` },
      { id: "router", name: "Router", icon: "route", at: "godown", job: "Splits the batch under each exit's caps", did: `${F.kiranas} to ${F.shops} kiranas, ${F.buyer} to one buyer` },
      { id: "you", name: "You", icon: "hand", at: "maker", human: true, job: "You approve every plan, with the money on screen", did: `Approved in one tap, ${inr(F.planNet)} on screen` },
      { id: "outreach", name: "Outreach", icon: "send", at: "kiranas", job: "Sends kirana offers", did: `${F.kiranas} packs to ${F.shops} kiranas, buy 10 get 2 free` },
      { id: "lister", name: "Lister", icon: "store", at: "buyer", job: "Lists on ExpireSoon in the distributor's name", did: `${F.buyer} packs listed` },
      { id: "negotiator", name: "Negotiator", icon: "gavel", at: "buyer", job: "Answers bids", did: `Countered a bid to ${F.counter} a pack` },
      { id: "paperwork", name: "Paperwork", icon: "file-text", at: "maker", job: "Drafts the invoices, the e-way bill check, the credit note and the GST memo", did: "Invoices and the price-support credit note, drafted" },
      { id: "impact", name: "Impact", icon: "leaf", at: "landfill", job: "Posts the ledger and the sustainability report", did: `${F.kg} kg kept out of landfill` }
    ];
    const AGENT = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
    const EDGES = [
      ["data", "watcher"],
      ["watcher", "vision"],
      ["vision", "valuer"],
      ["valuer", "router"],
      ["router", "you"],
      ["you", "outreach"],
      ["you", "lister"],
      ["lister", "negotiator"],
      ["outreach", "paperwork"],
      ["negotiator", "paperwork"],
      ["paperwork", "impact"]
    ];
    const BEATS = [
      { id: "make", at: ["maker"], t: "Made", did: `${num(F.packs)} packs leave the factory for the distributor`, who: [], ms: 600, batch: "maker" },
      { id: "stock", at: ["godown"], t: "Stocked", did: `${num(F.packs)} packs in the distributor's godown, selling ${F.perDay} a day`, who: [], ms: 500, batch: "godown" },
      { id: "risk", at: ["godown"], t: "At risk", did: `${num(F.atRisk)} packs won't sell in the ${F.daysLeft} days left`, who: ["data", "watcher", "vision"], ms: 700, batch: "godown" },
      { id: "route", at: ["godown"], t: "Priced and split", did: `Five exits priced · ${F.kiranas} to ${F.shops} kiranas, ${F.buyer} to one buyer`, who: ["valuer", "router"], ms: 600, batch: "godown" },
      { id: "yes", at: ["maker"], t: "One yes", did: `You approve in one tap · ${inr(F.planNet)} on screen`, who: ["you"], human: true, ms: 900, batch: "godown" },
      { id: "sell", at: ["kiranas", "buyer"], t: "Sold", did: `${F.kiranas} packs to ${F.shops} kiranas · ${F.buyer} to a buyer, countered to ${F.counter}`, who: ["outreach", "lister", "negotiator"], ms: 700, batch: "sold" },
      { id: "report", at: ["maker", "landfill"], t: "Settled", did: `${inr(F.recovered)} recovered · ${F.kg} kg kept out of landfill`, who: ["paperwork", "impact"], ms: 700, batch: null }
    ];
    const NB = BEATS.length;
    const beatOf = (id) => BEATS.findIndex((b) => b.id === id);
    const names = (b) => b.who.map((w) => AGENT[w].name).join(" · ");
    AGENTS.forEach((a) => {
      a.beat = BEATS.findIndex((b) => b.who.includes(a.id));
    });
    const RESULT = `${inr(F.recovered)} recovered, instead of ${inr(-F.bin)} to destroy it`;
    const agentState = (a, j) => ({ done: a.beat < j.k || j.done, now: a.beat === j.k && j.playing });
    function useStage(ref) {
      const [g, setG] = useState(null);
      useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const measure = () => {
          const W = el.clientWidth, H = el.clientHeight;
          if (!W || !H) return;
          const s = Math.max(W / GEO.nw, H / GEO.nh), w = GEO.nw * s, h = GEO.nh * s;
          const wide = W >= 900;
          const [px, py] = wide ? [0.5, 0.5] : GEO.phoneRest || [0.5, 0.5];
          setG((o) => o && o.W === W && o.H === H ? o : { W, H, w, h, s, ox: (W - w) * px, oy: (H - h) * py, wide });
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
      }, []);
      return g;
    }
    const wpx = (g, p) => [p[0] * g.w, p[1] * g.h];
    const ZMAX = 2.6;
    function useCamera(g, worldRef, skyRef, reduce) {
      const cam = useRef({ x: 0.5, y: 0.5, z: 1 }), live = useRef(null), subs = useRef(/* @__PURE__ */ new Set()), views = useRef(/* @__PURE__ */ new Set()), gRef = useRef(g);
      const [zoom, setZoom] = useState(1);
      gRef.current = g;
      const anchor = (G) => G.wide ? [0.5, 0.64] : [0.5, 0.5];
      const solve = (c, G = gRef.current) => {
        const z = clamp(c.z, 1, ZMAX), [ax, ay] = anchor(G);
        const tx = clamp(ax * G.W - G.ox - c.x * G.w * z, G.W - G.ox - G.w * z, -G.ox), ty = clamp(ay * G.H - G.oy - c.y * G.h * z, G.H - G.oy - G.h * z, -G.oy);
        return { tx, ty, z };
      };
      const focusOf = (t, G = gRef.current) => {
        const [ax, ay] = anchor(G);
        return { x: (ax * G.W - G.ox - t.tx) / (G.w * t.z), y: (ay * G.H - G.oy - t.ty) / (G.h * t.z), z: t.z };
      };
      const write = (c) => {
        const G = gRef.current;
        if (!G) return;
        const t = solve(c);
        cam.current = focusOf(t);
        live.current = t;
        [].concat(worldRef.current || []).forEach((el) => {
          el.style.transform = `translate(${t.tx.toFixed(2)}px, ${t.ty.toFixed(2)}px) scale(${t.z.toFixed(4)})`;
          el.style.setProperty("--iz", (1 / t.z).toFixed(4));
        });
        if (skyRef && skyRef.current) skyRef.current.style.opacity = clamp((t.z - 1) / 0.28, 0, 1).toFixed(3);
        subs.current.forEach((f) => f(t));
        const step = Math.round(t.z * 10) / 10;
        setZoom((s) => s === step ? s : step);
      };
      const fly = useRef(null);
      const stop = () => {
        if (fly.current) {
          fly.current.stop();
          fly.current = null;
        }
      };
      const api = useMemo(() => ({
        get: () => cam.current,
        t: () => live.current || (gRef.current ? solve(cam.current) : { tx: 0, ty: 0, z: 1 }),
        set: (c) => {
          stop();
          write(c);
        },
        // fly to a shot ([x, y, z]); jumps under reduced motion
        to: (shot, dur = 0.7) => {
          stop();
          const to = { x: shot[0], y: shot[1], z: shot[2] };
          if (reduce || dur <= 0) {
            write(to);
            return;
          }
          const from = { ...cam.current }, lz0 = Math.log(from.z), lz1 = Math.log(to.z);
          fly.current = animate(0, 1, { duration: dur, ease: FLY, onUpdate: (u) => write({ x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u, z: Math.exp(lz0 + (lz1 - lz0) * u) }) });
        },
        stop,
        // move by a drag, in stage px, from a transform taken at its start
        drag: (t0, dx, dy) => {
          stop();
          write(focusOf(solve(focusOf({ tx: t0.tx + dx, ty: t0.ty + dy, z: t0.z }))));
        },
        // zoom by a factor about a stage point, which stays under the pointer
        zoomAt: (f, sx, sy, smooth) => {
          const G = gRef.current, t = api.t(), z1 = clamp(t.z * f, 1, ZMAX);
          const px = (sx - G.ox - t.tx) / (G.w * t.z), py = (sy - G.oy - t.ty) / (G.h * t.z);
          const t1 = { tx: sx - G.ox - px * G.w * z1, ty: sy - G.oy - py * G.h * z1, z: z1 }, c1 = focusOf(t1);
          if (smooth) api.to([c1.x, c1.y, c1.z], 0.42);
          else {
            stop();
            write(c1);
          }
        },
        // a plate point on the stage, now
        toStage: (p) => {
          const G = gRef.current, t = api.t();
          return [G.ox + t.tx + p[0] * G.w * t.z, G.oy + t.ty + p[1] * G.h * t.z];
        },
        listen: (f) => {
          subs.current.add(f);
          return () => subs.current.delete(f);
        },
        // the depth renderer's own changes (its tilt and focus), for what sits on the picture
        listenView: (f) => {
          views.current.add(f);
          return () => views.current.delete(f);
        },
        viewChanged: () => views.current.forEach((f) => f()),
        refresh: () => write(cam.current)
      }), [reduce]);
      useLayoutEffect(() => {
        if (g) write(cam.current);
      }, [g]);
      return { api, zoom };
    }
    const shotOf = (g, id) => {
      const S = GEO.shots[g && g.wide ? "wide" : "phone"];
      return S[id] || S.rest;
    };
    function useGestures(stageRef, api, onUser) {
      const user = useRef(onUser);
      user.current = onUser;
      useEffect(() => {
        const el = stageRef.current;
        if (!el) return;
        const pts = /* @__PURE__ */ new Map();
        let drag = null, pinch = null, moved = false;
        const local = (x, y) => {
          const r = el.getBoundingClientRect();
          return [x - r.left, y - r.top];
        };
        const two = () => {
          const [a, b] = [...pts.values()];
          return { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: local((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) };
        };
        const down = (e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          pts.set(e.pointerId, [e.clientX, e.clientY]);
          if (pts.size === 1) moved = false;
          if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, t: api.t() };
          if (pts.size === 2) {
            const s = two();
            pinch = { ...s, t: api.t() };
            drag = null;
          }
        };
        const move = (e) => {
          if (!pts.has(e.pointerId)) return;
          pts.set(e.pointerId, [e.clientX, e.clientY]);
          if (pinch && pts.size >= 2) {
            const s = two(), G = api.t();
            if (!moved) {
              moved = true;
              user.current();
            }
            api.zoomAt(s.d / pinch.d * pinch.t.z / G.z, pinch.m[0], pinch.m[1], false);
            pinch.d = s.d;
            pinch.t = api.t();
            return;
          }
          if (!drag) return;
          const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          if (!moved) {
            if (Math.hypot(dx, dy) < 6) return;
            moved = true;
            user.current();
            el.classList.add("dragging");
            try {
              el.setPointerCapture(e.pointerId);
            } catch (_) {
            }
          }
          api.drag(drag.t, dx, dy);
        };
        const up = (e) => {
          pts.delete(e.pointerId);
          if (pts.size < 2) pinch = null;
          if (pts.size === 1) {
            const [p] = [...pts.values()];
            drag = { x: p[0], y: p[1], t: api.t() };
          }
          if (pts.size === 0) {
            drag = null;
            el.classList.remove("dragging");
          }
        };
        const click = (e) => {
          if (moved) {
            e.stopPropagation();
            e.preventDefault();
            moved = false;
          }
        };
        const wheel = (e) => {
          if (!e.ctrlKey) return;
          e.preventDefault();
          user.current();
          const [x, y] = local(e.clientX, e.clientY);
          api.zoomAt(Math.exp(-e.deltaY * 0.01), x, y, false);
        };
        const dbl = (e) => {
          if (e.target.closest("button")) return;
          user.current();
          const [x, y] = local(e.clientX, e.clientY);
          const z = api.t().z;
          api.zoomAt(z >= 2.2 ? 1 / z : 1.7, x, y, true);
        };
        el.addEventListener("pointerdown", down);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
        el.addEventListener("click", click, true);
        el.addEventListener("wheel", wheel, { passive: false });
        el.addEventListener("dblclick", dbl);
        return () => {
          el.removeEventListener("pointerdown", down);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
          el.removeEventListener("click", click, true);
          el.removeEventListener("wheel", wheel);
          el.removeEventListener("dblclick", dbl);
        };
      }, [api]);
    }
    function useJourney(ready, holdAt) {
      const reduce = !!useReducedMotion();
      const rest = holdAt != null ? holdAt : NB;
      const [k, setK] = useState(reduce ? rest : -1);
      const [run, setRun] = useState(0);
      const [held, setHeld] = useState(holdAt != null);
      const [manual, setManual] = useState(false);
      useEffect(() => {
        if (reduce) {
          setK(holdAt != null ? holdAt : NB);
          return;
        }
        if (!ready) return;
        setK(-1);
        const t = setTimeout(() => setK(0), 500);
        return () => clearTimeout(t);
      }, [ready, run, reduce]);
      useEffect(() => {
        if (reduce || manual || k < 0 || k >= NB) return;
        if (held && k === holdAt) return;
        const t = setTimeout(() => setK(k + 1), BEATS[k].ms);
        return () => clearTimeout(t);
      }, [k, reduce, held, manual]);
      const j = { k, reduce, run, held: held && k === holdAt, playing: k >= 0 && k < NB && !manual, manual, done: k >= NB, beat: k >= 0 && k < NB ? BEATS[k] : null };
      j.replay = () => {
        setManual(false);
        setHeld(holdAt != null);
        setRun((r) => r + 1);
        if (reduce) setK(holdAt != null ? holdAt : NB);
      };
      j.approve = () => {
        setHeld(false);
        if (reduce || manual) setK(NB);
        else setK(holdAt + 1);
      };
      j.step = (d) => {
        setManual(true);
        setK((v) => {
          const n = clamp((v < 0 ? 0 : v) + d, 0, NB);
          if (held && holdAt != null && v <= holdAt && n > holdAt) {
            setHeld(false);
          }
          return n;
        });
      };
      j.finish = () => {
        if (!(held && k === holdAt)) {
          setManual(true);
          setK(NB);
        }
      };
      return j;
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
    function along(pts, t) {
      const seg = [];
      let L = 0;
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        seg.push(d);
        L += d;
      }
      let s = clamp(t, 0, 1) * L;
      for (let i = 0; i < seg.length; i++) {
        if (s <= seg[i] || i === seg.length - 1) {
          const u = seg[i] ? Math.min(1, s / seg[i]) : 0;
          return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
        }
        s -= seg[i];
      }
      return pts[pts.length - 1];
    }
    function fitCanvas(cv, W, H) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(W), h = Math.round(H);
      if (cv.width !== w * dpr || cv.height !== h * dpr) {
        cv.width = w * dpr;
        cv.height = h * dpr;
        cv.style.width = w + "px";
        cv.style.height = h + "px";
      }
      const ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return ctx;
    }
    function GraphCanvas({ g, api, j, dark, focus, project, holes }) {
      const cv = useRef(null), prog = useRef({}), raf = useRef(0), packs = useRef(null);
      const st = useRef({});
      st.current = { g, j, dark, focus, project, holes };
      const draw = useCallback(() => {
        const c = cv.current, s = st.current;
        if (!c || !s.g) return;
        const ctx = fitCanvas(c, s.g.W, s.g.H);
        ctx.clearRect(0, 0, s.g.W, s.g.H);
        const z = api.t().z;
        ctx.save();
        const hs = s.holes ? s.holes() : [];
        if (hs.length) {
          ctx.beginPath();
          ctx.rect(0, 0, s.g.W, s.g.H);
          hs.forEach((h) => ctx.rect(h[0], h[1], h[2] - h[0], h[3] - h[1]));
          ctx.clip("evenodd");
        }
        const P = (id) => s.project ? s.project(GEO.posts[id], id) : api.toStage(GEO.posts[id]);
        const lit = s.dark ? "#3ccb8a" : "#167a52", amber = s.dark ? "#f7c04a" : "#e8a722";
        const casing = s.dark ? "rgba(8,14,11,0.6)" : "rgba(255,255,255,0.75)";
        const k = s.j.done ? NB : s.j.k;
        EDGES.forEach(([a, b]) => {
          const p = prog.current[a + b] || 0;
          if (p <= 0) return;
          const A = P(a), B = P(b), d = Math.hypot(B[0] - A[0], B[1] - A[1]), mx = (A[0] + B[0]) / 2, far = AGENT[a].at !== AGENT[b].at;
          const my = (A[1] + B[1]) / 2 + (far ? Math.min(110, d * 0.2) : -Math.min(70, d * 0.22));
          const loud = s.focus ? s.focus.has(a) && s.focus.has(b) : AGENT[b].beat === k && !s.j.done;
          const hue = AGENT[a].human || AGENT[b].human ? amber : lit;
          const n = 36, m = Math.max(1, Math.round(n * p));
          const path = () => {
            ctx.beginPath();
            ctx.moveTo(A[0], A[1]);
            for (let i = 1; i <= m; i++) {
              const t = i / n, u = 1 - t;
              ctx.lineTo(u * u * A[0] + 2 * u * t * mx + t * t * B[0], u * u * A[1] + 2 * u * t * my + t * t * B[1]);
            }
          };
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          if (loud) {
            path();
            ctx.lineWidth = 6;
            ctx.strokeStyle = casing;
            ctx.stroke();
            path();
            ctx.lineWidth = 3;
            ctx.strokeStyle = hue;
            ctx.stroke();
          } else {
            ctx.globalAlpha = s.focus ? 0.22 : 0.5;
            path();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = hue;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });
        const pk = packs.current;
        if (pk) {
          const now = performance.now(), u = clamp((now - pk.t0) / pk.dur, 0, 1);
          pk.list.forEach((d) => {
            const t = clamp((u - d.delay) / (1 - d.delay), 0, 1);
            if (t <= 0) return;
            const e = 1 - Math.pow(1 - t, 3), q = along(GEO.routes[d.to], e), [x, y] = s.project ? s.project(q) : api.toStage(q);
            ctx.globalAlpha = t >= 1 ? clamp(1 - (now - pk.t0 - pk.dur) / 400, 0, 1) : 1;
            ctx.beginPath();
            ctx.arc(x, y, 3.6 * Math.max(1, Math.sqrt(z)), 0, Math.PI * 2);
            ctx.fillStyle = d.to === "buyer" ? s.dark ? "#8a6ee8" : "#7c5cd6" : lit;
            ctx.fill();
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = s.dark ? "rgba(10,16,13,0.8)" : "#ffffff";
            ctx.stroke();
          });
          ctx.globalAlpha = 1;
          if (now - pk.t0 > pk.dur + 420) packs.current = null;
        }
        ctx.restore();
      }, [api]);
      useEffect(() => {
        const k = j.done ? NB : j.k;
        const want = {};
        EDGES.forEach(([a, b]) => {
          want[a + b] = AGENT[b].beat >= 0 && (AGENT[b].beat < k || AGENT[b].beat === k && (j.playing || j.manual)) ? 1 : 0;
        });
        if (j.reduce) {
          prog.current = want;
          draw();
          return;
        }
        let alive = true;
        const t0 = performance.now(), from = { ...prog.current };
        const tick = () => {
          if (!alive) return;
          const u = clamp((performance.now() - t0) / 320, 0, 1);
          Object.keys(want).forEach((key) => {
            prog.current[key] = (from[key] || 0) + (want[key] - (from[key] || 0)) * (want[key] > (from[key] || 0) ? u : 1);
          });
          draw();
          if (u < 1 || packs.current) raf.current = requestAnimationFrame(tick);
        };
        if (BEATS[j.k] && BEATS[j.k].id === "sell" && j.playing) {
          const list = [];
          for (let i = 0; i < 26; i++) list.push({ to: i % 13 < 6 ? "kiranas" : "buyer", delay: i / 26 * 0.45 });
          packs.current = { t0: performance.now(), dur: 650, list };
        }
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(tick);
        return () => {
          alive = false;
          cancelAnimationFrame(raf.current);
        };
      }, [j.k, j.done, j.reduce, j.run]);
      useEffect(() => {
        const a = api.listen(() => draw()), b = api.listenView(() => draw());
        return () => {
          a();
          b();
        };
      }, [api, draw]);
      useEffect(() => {
        draw();
      }, [dark, focus, g]);
      return /* @__PURE__ */ React.createElement("canvas", { ref: cv, className: "r2-graph", "aria-hidden": "true" });
    }
    const Pin = ({ p, g, j, sel, onOpen, hover }) => {
      const at = wpx(g, GEO.places[p.id].pin), here = j.beat && j.beat.at.includes(p.id), open = sel && sel.kind === "place" && sel.id === p.id;
      const edge = GEO.places[p.id].edge;
      return /* @__PURE__ */ React.createElement("span", { className: "r2-at", style: { left: at[0], top: at[1] } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: cx("r2-pin", here && "here", open && "open", edge && "edge-" + edge),
          "aria-expanded": open,
          "aria-controls": open ? "r2-panel" : void 0,
          "aria-label": `${p.t}: what happens here`,
          onClick: () => onOpen({ kind: "place", id: p.id }),
          onPointerEnter: () => hover({ kind: "place", id: p.id }),
          onPointerLeave: () => hover(null)
        },
        /* @__PURE__ */ React.createElement("span", { className: "r2-pin-body" }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: p.icon, size: 14, stroke: 2 })), /* @__PURE__ */ React.createElement("b", null, g.wide ? p.t : p.short)),
        /* @__PURE__ */ React.createElement("span", { className: "r2-pin-stem" })
      ));
    };
    const Node = ({ a, g, j, sel, onOpen, hover, named }) => {
      const at = wpx(g, GEO.posts[a.id]), { done, now } = agentState(a, j), open = sel && sel.kind === "agent" && sel.id === a.id;
      const side = (GEO.labels || {})[a.id] || "right", show = named || open || now && (g.wide || a.human) || !g.wide && a.human && j.held;
      return /* @__PURE__ */ React.createElement("span", { className: "r2-at", style: { left: at[0], top: at[1] } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          tabIndex: -1,
          "aria-hidden": "true",
          className: cx("r2-node", "side-" + side, a.human && "human", done && "on", now && "now", !done && !now && j.k >= 0 && "later", open && "open", show && "named"),
          onClick: () => onOpen({ kind: "agent", id: a.id }),
          onPointerEnter: () => hover({ kind: "agent", id: a.id }),
          onPointerLeave: () => hover(null)
        },
        /* @__PURE__ */ React.createElement("span", { className: cx("r2-node-dot", now && "aura") }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 14, stroke: 2.1 })),
        /* @__PURE__ */ React.createElement("span", { className: "r2-node-name" }, a.name)
      ));
    };
    function Batch({ g, j }) {
      const ref = useRef(null), pos = useRef(null), b = j.beat;
      const place = j.done ? null : b ? b.batch : j.k < 0 ? "maker" : null;
      useEffect(() => {
        const el = ref.current;
        if (!el || !g || !place || place === "sold") return;
        const to = wpx(g, GEO.batch[place]);
        const from = pos.current;
        const set = (p) => {
          pos.current = p;
          el.style.left = p[0] + "px";
          el.style.top = p[1] + "px";
        };
        if (!from || j.reduce || place !== "godown" || !GEO.routes.out) {
          set(to);
          return;
        }
        const route = GEO.routes.out.map((p) => wpx(g, p));
        const c = animate(0, 1, { duration: 0.5, ease: EASE, onUpdate: (u) => set(along(route, u)) });
        return () => c.stop();
      }, [place, g]);
      if (!place) return null;
      const text = b && b.id === "sell" ? `${F.kiranas} + ${F.buyer} sold` : j.k >= beatOf("risk") ? `${num(F.atRisk)} at risk` : `${num(F.packs)} packs`;
      return /* @__PURE__ */ React.createElement("span", { className: "r2-at r2-batch", ref, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: cx("r2-batch-card", j.k >= beatOf("risk") && j.k < beatOf("sell") && "risk") }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: "package", size: 14, stroke: 2 })), /* @__PURE__ */ React.createElement("b", null, text)));
    }
    function Panel({ sel, j, onOpen, onClose, money }) {
      const ref = useRef(null);
      useEffect(() => {
        if (sel && ref.current) ref.current.focus({ preventScroll: true });
      }, [sel && sel.kind, sel && sel.id]);
      if (!sel) return null;
      const chips = (ids) => /* @__PURE__ */ React.createElement("span", { className: "r2-panel-chips" }, ids.map((id) => {
        const a = AGENT[id], { done } = agentState(a, j);
        return /* @__PURE__ */ React.createElement("button", { key: id, type: "button", className: cx("r2-chip", a.human && "human", done && "on"), onClick: () => onOpen({ kind: "agent", id }) }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 13, stroke: 2.2 })), a.name);
      }));
      let body;
      if (sel.kind === "place") {
        const p = PLACE[sel.id], team = AGENTS.filter((a) => a.at === p.id).map((a) => a.id);
        body = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: p.icon, size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("h3", { id: "r2-panel-h" }, p.t)), /* @__PURE__ */ React.createElement("p", null, p.id === "maker" && j.done ? `Makes the batch. You approve each plan here, and the money comes back here: ${inr(money)}.` : p.line), team.length > 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "r2-panel-k" }, "Who works here"), chips(team)) : /* @__PURE__ */ React.createElement("span", { className: "r2-panel-k" }, "The Valuer prices it on every plan"));
      } else {
        const a = AGENT[sel.id], from = EDGES.filter((e) => e[1] === a.id).map((e) => e[0]), to = EDGES.filter((e) => e[0] === a.id).map((e) => e[1]);
        body = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("i", { className: cx(a.human && "human") }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("h3", { id: "r2-panel-h" }, a.name), /* @__PURE__ */ React.createElement("button", { type: "button", className: "r2-panel-at", onClick: () => onOpen({ kind: "place", id: a.at }) }, "at the ", PLACE[a.at].short.toLowerCase())), /* @__PURE__ */ React.createElement("p", null, a.job, "."), /* @__PURE__ */ React.createElement("p", { className: "r2-panel-did" }, /* @__PURE__ */ React.createElement("span", { className: "r2-panel-k" }, "This batch"), a.did), (from.length > 0 || to.length > 0) && /* @__PURE__ */ React.createElement("div", { className: "r2-panel-flow" }, from.length > 0 && /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "r2-panel-k" }, "From"), chips(from)), to.length > 0 && /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "r2-panel-k" }, "Hands to"), chips(to))));
      }
      return /* @__PURE__ */ React.createElement(
        motion.div,
        {
          key: sel.kind + sel.id,
          id: "r2-panel",
          className: "r2-panel",
          role: "region",
          "aria-labelledby": "r2-panel-h",
          tabIndex: -1,
          ref,
          initial: j.reduce ? false : { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.24, ease: EASE },
          onKeyDown: (e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onClose();
            }
          }
        },
        body,
        /* @__PURE__ */ React.createElement("button", { type: "button", className: "r2-panel-x", "aria-label": "Close", onClick: onClose }, /* @__PURE__ */ React.createElement(Icon, { name: "x", size: 16, stroke: 2 }))
      );
    }
    function Caption({ j, money, hint }) {
      const b = j.beat;
      return /* @__PURE__ */ React.createElement("div", { className: cx("r2-caption", b && b.human && "human") }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "r2-step", "aria-label": "The step before", disabled: j.k <= 0, onClick: () => j.step(-1) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "r2-caption-text", "aria-hidden": "true" }, j.k < 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, num(F.packs), " packs leave the factory."), /* @__PURE__ */ React.createElement("span", null, "Follow them through the business.")) : b ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, j.k + 1, " of ", NB), /* @__PURE__ */ React.createElement("b", null, b.t), b.who.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "who" }, names(b)), /* @__PURE__ */ React.createElement("span", { className: "did" }, b.id === "report" ? `${inr(money)} recovered · ${F.kg} kg kept out of landfill` : b.did)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, NB, " of ", NB), /* @__PURE__ */ React.createElement("b", null, "Sold, not binned."), /* @__PURE__ */ React.createElement("span", { className: "did" }, RESULT), hint && /* @__PURE__ */ React.createElement("span", { className: "hint" }, hint))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "r2-step", "aria-label": "The next step", disabled: j.done || j.held, onClick: () => j.step(1) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16, stroke: 2 })));
    }
    const SrJourney = ({ j }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("ol", { className: "sr-only", "aria-label": "One batch's journey through the business" }, BEATS.map((b) => /* @__PURE__ */ React.createElement("li", { key: b.id }, b.t, b.who.length ? `, ${names(b)}` : "", ": ", b.did, "."))), /* @__PURE__ */ React.createElement("p", { className: "sr-only" }, "Sold, not binned: ", RESULT, "."), /* @__PURE__ */ React.createElement("p", { className: "sr-only", "aria-live": "polite" }, j.manual ? j.beat ? `${j.k + 1} of ${NB}, ${j.beat.t}: ${j.beat.did}.` : `Sold, not binned: ${RESULT}.` : ""));
    function Controls({ j, api, g, zoom, onWhole }) {
      const c = () => [g.W / 2, g.H * (g.wide ? 0.64 : 0.5)];
      return /* @__PURE__ */ React.createElement("div", { className: "r2-ctl" }, !j.reduce && /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: j.replay }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16, stroke: 2 }), "Replay"), /* @__PURE__ */ React.createElement("span", { className: "r2-zoom", role: "group", "aria-label": "Zoom" }, /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "Zoom out", disabled: zoom <= 1, onClick: () => api.zoomAt(1 / 1.45, ...c(), true) }, /* @__PURE__ */ React.createElement(Icon, { name: "minus", size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "Zoom in", disabled: zoom >= ZMAX, onClick: () => api.zoomAt(1.45, ...c(), true) }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "The whole business", disabled: zoom <= 1, onClick: onWhole }, /* @__PURE__ */ React.createElement(Icon, { name: "minimize-2", size: 16, stroke: 2 }))));
    }
    window.SC32R2 = {
      React,
      useState,
      useEffect,
      useRef,
      useLayoutEffect,
      useMemo,
      useCallback,
      motion,
      AnimatePresence,
      useReducedMotion,
      animate,
      cx,
      Icon,
      num,
      inr,
      clamp,
      EASE,
      FLY,
      GEO,
      F,
      PLACES,
      PLACE,
      AGENTS,
      AGENT,
      EDGES,
      BEATS,
      NB,
      beatOf,
      names,
      RESULT,
      agentState,
      useStage,
      wpx,
      useCamera,
      shotOf,
      useGestures,
      useJourney,
      useCount,
      useDark,
      along,
      fitCanvas,
      GraphCanvas,
      Pin,
      Node,
      Batch,
      Panel,
      Caption,
      SrJourney,
      Controls,
      ZMAX
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
(function() {
  function boot() {
    const S = window.SC32R2;
    if (!S) return;
    const {
      React,
      useState,
      useEffect,
      useRef,
      useMemo,
      useCallback,
      motion,
      AnimatePresence,
      cx,
      Icon,
      num,
      inr,
      clamp,
      EASE,
      GEO,
      F,
      PLACES,
      AGENTS,
      AGENT,
      EDGES,
      BEATS,
      NB,
      beatOf,
      agentState,
      useStage,
      wpx,
      useCamera,
      shotOf,
      useGestures,
      useJourney,
      useCount,
      useDark,
      GraphCanvas,
      Pin,
      Node,
      Batch,
      Panel,
      Caption,
      SrJourney,
      Controls
    } = S;
    const Plate = ({ onLoad }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("img", { className: "when-light", src: GEO.day, width: GEO.nw, height: GEO.nh, draggable: "false", onLoad, alt: "The whole business as a miniature town in the morning: on the left the snack maker's factory and its office, in the middle the distributor's godown full of cartons, on the right a lane of kirana shops; behind them a highway to a buyer's warehouse in the next town, a food bank, and a fenced landfill, empty." }), /* @__PURE__ */ React.createElement("img", { className: "when-dark", src: GEO.night, width: GEO.nw, height: GEO.nh, draggable: "false", onLoad, alt: "The same town at night, its windows lit, the landfill dark." }));
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
    const DOLLY = 0.42, SWAY = 0.9;
    const shifted = (p, d, v) => [p[0] + (v.tilt[0] + (p[0] - v.foc[0]) * v.dolly) * (d - v.focus), p[1] + (v.tilt[1] + (p[1] - v.foc[1]) * v.dolly) * (d - v.focus)];
    function useDepthMap(on) {
      const [m, setM] = useState(null);
      useEffect(() => {
        if (!on) return;
        const W = 256, H = Math.round(256 * GEO.nh / GEO.nw), c = document.createElement("canvas");
        c.width = W;
        c.height = H;
        const x = c.getContext("2d", { willReadFrequently: true });
        const done = () => {
          const d = x.getImageData(0, 0, W, H).data;
          setM({ canvas: c, at: (p) => d[(clamp(Math.round(p[1] * (H - 1)), 0, H - 1) * W + clamp(Math.round(p[0] * (W - 1)), 0, W - 1)) * 4] / 255 });
        };
        if (GEO.depth) {
          const im = new Image();
          im.crossOrigin = "anonymous";
          im.onload = () => {
            x.drawImage(im, 0, 0, W, H);
            done();
          };
          im.src = GEO.depth;
        } else {
          const gr = x.createLinearGradient(0, 0, 0, H);
          gr.addColorStop(0, "#000");
          gr.addColorStop(0.36, "#1a1a1a");
          gr.addColorStop(1, "#fff");
          x.fillStyle = gr;
          x.fillRect(0, 0, W, H);
          done();
        }
      }, []);
      return m;
    }
    function DepthPlate(props) {
      const { g: g0, api, dark, reduce: reduce0, map: map0, stageRef, onReady, onFail, view } = props;
      const cv = useRef(null), gl = useRef(null), st = useRef({ tilt: [0, 0], want: [0, 0], focus: 0.5, blur: 0, raf: 0 }), P = useRef(props);
      P.current = props;
      useEffect(() => {
        const c = cv.current, ctx = c && c.getContext("webgl2", { antialias: false, premultipliedAlpha: false, alpha: false });
        if (!ctx) {
          onFail();
          return;
        }
        const sh = (t, s) => {
          const o = ctx.createShader(t);
          ctx.shaderSource(o, s);
          ctx.compileShader(o);
          return o;
        };
        const pr = ctx.createProgram();
        ctx.attachShader(pr, sh(ctx.VERTEX_SHADER, VS));
        ctx.attachShader(pr, sh(ctx.FRAGMENT_SHADER, FS));
        ctx.linkProgram(pr);
        if (!ctx.getProgramParameter(pr, ctx.LINK_STATUS)) {
          onFail();
          return;
        }
        ctx.useProgram(pr);
        const b = ctx.createBuffer();
        ctx.bindBuffer(ctx.ARRAY_BUFFER, b);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
        const loc = ctx.getAttribLocation(pr, "p");
        ctx.enableVertexAttribArray(loc);
        ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
        const U = (n) => ctx.getUniformLocation(pr, n);
        gl.current = { ctx, U: { plate: U("uPlate"), depth: U("uDepth"), res: U("uRes"), world: U("uWorld"), cam: U("uCam"), tilt: U("uTilt"), focus: U("uFocus"), blur: U("uBlur"), sky: U("uSky"), band: U("uBand"), dolly: U("uDolly"), skyCol: U("uSkyCol") } };
        ctx.uniform1i(gl.current.U.plate, 0);
        ctx.uniform1i(gl.current.U.depth, 1);
        return () => {
          const ext = ctx.getExtension("WEBGL_lose_context");
          if (ext) ext.loseContext();
        };
      }, []);
      const upload = (unit, src, mip) => {
        const G = gl.current;
        if (!G) return;
        const ctx = G.ctx, t = ctx.createTexture();
        ctx.activeTexture(ctx.TEXTURE0 + unit);
        ctx.bindTexture(ctx.TEXTURE_2D, t);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, mip ? ctx.LINEAR_MIPMAP_LINEAR : ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, src);
        if (mip) ctx.generateMipmap(ctx.TEXTURE_2D);
      };
      useEffect(() => {
        if (map0 && gl.current) {
          upload(1, map0.canvas, false);
          draw();
        }
      }, [map0]);
      useEffect(() => {
        let alive = true;
        const im = new Image();
        im.decoding = "async";
        im.crossOrigin = "anonymous";
        im.onload = () => {
          if (!alive) return;
          upload(0, im, true);
          st.current.ready = true;
          P.current.onReady();
          draw();
          kick();
        };
        im.onerror = () => P.current.onFail();
        im.src = dark ? GEO.night : GEO.day;
        return () => {
          alive = false;
        };
      }, [dark]);
      const draw = () => {
        const G = gl.current, s = st.current, c = cv.current, { g } = P.current;
        if (!G || !c || !g || !s.ready) return;
        const ctx = G.ctx, dpr = Math.min(window.devicePixelRatio || 1, g.wide ? 2 : 1.5), W = Math.round(g.W * dpr), H = Math.round(g.H * dpr);
        if (c.width !== W || c.height !== H) {
          c.width = W;
          c.height = H;
        }
        ctx.viewport(0, 0, W, H);
        const t = api.t();
        ctx.uniform2f(G.U.res, W, H);
        ctx.uniform4f(G.U.world, g.ox * dpr, g.oy * dpr, g.w * dpr, g.h * dpr);
        ctx.uniform3f(G.U.cam, t.tx * dpr, t.ty * dpr, t.z);
        ctx.uniform2f(G.U.tilt, s.tilt[0], s.tilt[1]);
        ctx.uniform1f(G.U.focus, s.focus);
        ctx.uniform1f(G.U.blur, s.blur);
        ctx.uniform1f(G.U.sky, g.wide ? clamp((t.z - 1) / 0.28, 0, 1) : 0);
        ctx.uniform2f(G.U.band, GEO.sky[0], GEO.sky[1]);
        const sk = P.current.dark ? [3, 19, 48] : [236, 231, 228];
        ctx.uniform3f(G.U.skyCol, sk[0] / 255, sk[1] / 255, sk[2] / 255);
        const fc = api.get(), dz = P.current.reduce ? 0 : DOLLY * (1 - 1 / t.z);
        ctx.uniform3f(G.U.dolly, fc.x, fc.y, dz);
        ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
        P.current.view.current = { tilt: s.tilt, focus: s.focus, foc: [fc.x, fc.y], dolly: dz };
      };
      const loop = () => {
        const s = st.current, t = api.t(), c = api.get(), { map, reduce } = P.current;
        const f = map ? map.at([c.x, c.y]) : 0.6, fb = clamp((t.z - 1) / 0.45, 0, 1) * 2.4;
        const k = reduce ? 1 : 0.14;
        s.tilt = [s.tilt[0] + (s.want[0] - s.tilt[0]) * k, s.tilt[1] + (s.want[1] - s.tilt[1]) * k];
        s.focus += (f - s.focus) * (reduce ? 1 : 0.12);
        s.blur += (fb - s.blur) * (reduce ? 1 : 0.12);
        s.want = [s.want[0] * 0.9, s.want[1] * 0.9];
        if (s.hover) s.want = s.hover.slice();
        draw();
        api.viewChanged();
        const moving = Math.abs(s.want[0] - s.tilt[0]) + Math.abs(s.want[1] - s.tilt[1]) > 1e-5 || Math.abs(f - s.focus) > 1e-3 || Math.abs(fb - s.blur) > 1e-3 || Math.abs(s.want[0]) + Math.abs(s.want[1]) > 1e-5;
        s.raf = moving ? requestAnimationFrame(loop) : 0;
      };
      const kick = () => {
        if (!st.current.raf) st.current.raf = requestAnimationFrame(loop);
      };
      useEffect(() => {
        let last = null;
        return api.listen(() => {
          const c = api.get(), s = st.current;
          if (last && !P.current.reduce) s.want = [clamp(s.want[0] - (c.x - last.x) * SWAY, -0.035, 0.035), clamp(s.want[1] - (c.y - last.y) * SWAY * 0.6, -0.02, 0.02)];
          last = { ...c };
          draw();
          kick();
        });
      }, [api]);
      useEffect(() => {
        draw();
        kick();
      }, [g0, map0]);
      useEffect(() => {
        const el = stageRef.current;
        if (!el || reduce0) return;
        let last = null;
        const mv = (e) => {
          const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          if (e.pointerType === "mouse") st.current.hover = [x * 0.03, y * 0.018];
          else if (last) {
            st.current.want = [clamp(st.current.want[0] + (e.clientX - last[0]) * 6e-4, -0.03, 0.03), clamp(st.current.want[1] + (e.clientY - last[1]) * 4e-4, -0.02, 0.02)];
          }
          last = [e.clientX, e.clientY];
          kick();
        };
        const lv = () => {
          st.current.hover = null;
          st.current.want = [0, 0];
          last = null;
          kick();
        };
        const up = () => {
          last = null;
        };
        el.addEventListener("pointermove", mv);
        el.addEventListener("pointerleave", lv);
        el.addEventListener("pointerup", up);
        return () => {
          el.removeEventListener("pointermove", mv);
          el.removeEventListener("pointerleave", lv);
          el.removeEventListener("pointerup", up);
        };
      }, [reduce0]);
      return /* @__PURE__ */ React.createElement("canvas", { ref: cv, className: "r2-gl", "aria-hidden": "true" });
    }
    function Hero({ variant }) {
      const stageRef = useRef(null), plateWorld = useRef(null), topWorld = useRef(null), skyRef = useRef(null), view = useRef(null);
      const g = useStage(stageRef), dark = useDark();
      const [ready, setReady] = useState(false), [gl, setGl] = useState(variant === "depth");
      const holdAt = variant === "yes" ? beatOf("yes") : null;
      const j = useJourney(ready, holdAt);
      const worlds = useMemo(() => ({ get current() {
        return [plateWorld.current, topWorld.current].filter(Boolean);
      } }), []);
      const { api, zoom } = useCamera(g, worlds, gl ? null : skyRef, j.reduce);
      const depth = useDepthMap(variant === "depth"), map = gl ? depth : null;
      const [follow, setFollow] = useState(true), [sel, setSel] = useState(null), [hov, setHov] = useState(null);
      const money = useCount(j.k >= beatOf("report"), F.recovered, j.reduce);
      useGestures(stageRef, api, () => setFollow(false));
      useEffect(() => {
        if (!g || !follow) return;
        const id = j.done || j.k < 0 ? "rest" : BEATS[j.k].id;
        api.to(shotOf(g, id), j.k < 0 ? 0 : 0.6);
      }, [j.k, j.done, follow, g && g.wide, g && g.W]);
      const open = (s) => {
        setFollow(false);
        setSel(s);
        const place = s.kind === "place" ? s.id : AGENT[s.id].at, shot = shotOf(g, place);
        api.to(s.kind === "agent" ? [GEO.posts[s.id][0], GEO.posts[s.id][1] + (g.wide ? 0.06 : 0.04), shot[2]] : shot, 0.7);
      };
      const close = () => setSel(null);
      const whole = () => {
        setSel(null);
        api.to(shotOf(g, "rest"), 0.7);
      };
      const replay = () => {
        setSel(null);
        setFollow(true);
        j.replay();
      };
      const approve = () => {
        setFollow(true);
        j.approve();
      };
      useEffect(() => {
        const k = (e) => {
          if (e.key === "Escape" && sel) setSel(null);
        };
        window.addEventListener("keydown", k);
        return () => window.removeEventListener("keydown", k);
      }, [sel]);
      const focus = useMemo(() => {
        const s = hov || sel;
        if (!s) return null;
        const core = s.kind === "agent" ? [s.id] : AGENTS.filter((a) => a.at === s.id).map((a) => a.id), set = new Set(core);
        EDGES.forEach(([a, b]) => {
          if (core.includes(a)) set.add(b);
          if (core.includes(b)) set.add(a);
        });
        return set;
      }, [hov, sel]);
      const project = useCallback(gl && map ? (p, id) => {
        const v = view.current;
        if (!v) return api.toStage(p);
        return api.toStage(shifted(p, map.at(p) + (id ? 0.04 : 0), v));
      } : null, [gl, map, api]);
      useEffect(() => {
        if (!(gl && map)) return;
        const el = topWorld.current;
        if (!el || !g) return;
        const items = [...el.querySelectorAll("[data-at]")];
        const place = () => {
          const v = view.current;
          if (!v) return;
          items.forEach((n) => {
            const p = JSON.parse(n.dataset.at), q = shifted(p, map.at(p) + 0.04, v);
            n.style.translate = `${((q[0] - p[0]) * g.w).toFixed(2)}px ${((q[1] - p[1]) * g.h).toFixed(2)}px`;
          });
        };
        place();
        const a = api.listen(place), b = api.listenView(place);
        return () => {
          a();
          b();
        };
      }, [gl, map, g, api]);
      const holes = useCallback(() => {
        const st = stageRef.current, hero = st && st.closest(".hero");
        if (!st || !g || !g.wide) return [];
        const o = st.getBoundingClientRect();
        return [...hero.querySelectorAll(".hero-h, .hero-sub, .hero-ctas > *")].map((e) => {
          const r = e.getBoundingClientRect();
          return [r.left - o.left - 8, r.top - o.top - 8, r.right - o.left + 8, r.bottom - o.top + 8];
        });
      }, [g]);
      const covers = () => {
        const st = stageRef.current, hero = st && st.closest(".hero");
        if (!st || !g || !g.wide) return [];
        const o = st.getBoundingClientRect();
        return [...hero.querySelectorAll(".r2-caption, .r2-ctl > *, .r2-panel")].map((e) => {
          const r = e.getBoundingClientRect();
          return [r.left - o.left - 6, r.top - o.top - 6, r.right - o.left + 6, r.bottom - o.top + 6];
        });
      };
      useEffect(() => {
        const el = topWorld.current, st = stageRef.current;
        if (!el || !g) return;
        const check = () => {
          const o = st.getBoundingClientRect(), hs = holes().concat(covers()), near = g.wide && api.t().z > 1.02, haze = GEO.sky[0] * g.H;
          [...el.querySelectorAll("[data-at], .r2-batch")].forEach((n) => {
            const b2 = (n.querySelector(".r2-pin-body, .r2-node, .r2-batch-card") || n).getBoundingClientRect(), x0 = b2.left - o.left, y0 = b2.top - o.top, x1 = b2.right - o.left, y1 = b2.bottom - o.top;
            const out = x1 < 4 || x0 > g.W - 4 || y1 < 4 || y0 > g.H - 4 || b2.width > 0 && (x0 < -6 || x1 > g.W + 6);
            const under = hs.some((h) => x0 < h[2] && x1 > h[0] && y0 < h[3] && y1 > h[1]);
            const hazed = near && (y0 + y1) / 2 < haze;
            n.classList.toggle("off", out || under || hazed);
          });
        };
        check();
        const a = api.listen(check), b = api.listenView(check);
        return () => {
          a();
          b();
        };
      }, [g, api, holes, j.k, j.done, sel, hov]);
      const named = g && g.wide && (j.done || j.k < 0 || j.held);
      const hint = g && (g.wide ? "Drag to look round · click a place or an agent" : "Swipe to look round · tap a place");
      const yesAt = g && wpx(g, GEO.posts.you);
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: cx("hero-scene r2-stage", gl && "is-gl", variant === "yes" && j.held && "is-held"), ref: stageRef }, gl && g && /* @__PURE__ */ React.createElement(DepthPlate, { g, api, dark, reduce: j.reduce, map, stageRef, view, onReady: () => setReady(true), onFail: () => setGl(false) }), /* @__PURE__ */ React.createElement("div", { className: "r2-world", ref: plateWorld, style: g ? { left: g.ox, top: g.oy, width: g.w, height: g.h } : { visibility: "hidden" } }, !gl && /* @__PURE__ */ React.createElement(Plate, { onLoad: () => setReady(true) })), !gl && g && g.wide && /* @__PURE__ */ React.createElement("div", { className: "r2-sky", ref: skyRef, "aria-hidden": "true" }), g && /* @__PURE__ */ React.createElement(GraphCanvas, { g, api, j, dark, focus, project, holes }), /* @__PURE__ */ React.createElement("div", { className: "r2-world r2-top", ref: topWorld, style: g ? { left: g.ox, top: g.oy, width: g.w, height: g.h } : { visibility: "hidden" } }, g && PLACES.map((p) => /* @__PURE__ */ React.createElement("span", { key: p.id, "data-at": JSON.stringify(GEO.places[p.id].pin), className: "r2-shift" }, /* @__PURE__ */ React.createElement(Pin, { p, g, j, sel, onOpen: open, hover: setHov }))), g && AGENTS.map((a) => /* @__PURE__ */ React.createElement("span", { key: a.id, "data-at": JSON.stringify(GEO.posts[a.id]), className: "r2-shift" }, /* @__PURE__ */ React.createElement(Node, { a, g, j, sel, onOpen: open, hover: setHov, named: named && (!focus || focus.has(a.id)) }))), g && /* @__PURE__ */ React.createElement(Batch, { g, j }), variant === "yes" && g && j.held && /* @__PURE__ */ React.createElement("span", { className: "r2-at", style: { left: yesAt[0], top: yesAt[1] } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "r2-yes", onClick: approve }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: "hand", size: 16, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "Approve the plan"), /* @__PURE__ */ React.createElement("span", null, inr(F.planNet), " back, instead of ", inr(-F.bin))))))), /* @__PURE__ */ React.createElement(SrJourney, { j }), variant === "yes" && j.held ? /* @__PURE__ */ React.createElement("div", { className: "r2-caption human" }, /* @__PURE__ */ React.createElement("span", { className: "r2-caption-text" }, /* @__PURE__ */ React.createElement("span", { className: "n" }, "5 of ", NB), /* @__PURE__ */ React.createElement("b", null, "Your yes."), /* @__PURE__ */ React.createElement("span", { className: "did" }, "The plan: ", F.kiranas, " packs to ", F.shops, " kiranas, ", F.buyer, " to one buyer · ", inr(F.planNet), " back, instead of ", inr(-F.bin), " to destroy them"))) : /* @__PURE__ */ React.createElement(Caption, { j, money, hint: j.done && !sel ? hint : null }), /* @__PURE__ */ React.createElement(AnimatePresence, null, sel && /* @__PURE__ */ React.createElement(Panel, { key: "panel", sel, j, onOpen: open, onClose: close, money })), g && /* @__PURE__ */ React.createElement(Controls, { j: { ...j, replay }, api, g, zoom, onWhole: whole }));
    }
    document.querySelectorAll("[data-r2]").forEach((el) => ReactDOM.createRoot(el).render(/* @__PURE__ */ React.createElement(Hero, { variant: el.getAttribute("data-r2") })));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

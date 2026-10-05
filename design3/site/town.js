(function() {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } = React;
  const { useReducedMotion, motion, AnimatePresence } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, P = window.SC3_PLATFORM;
  const fmt = M.fmt;
  const { cx, Icon, useTheme } = K;
  const IMG = window.SC3_SITE_IMG || "assets/plates/";
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const EASE = [0.22, 1, 0.36, 1], FLY = [0.65, 0, 0.35, 1];
  const lineOf = (id) => D.PLAN.lines.find((l) => l.id === id);
  const BATCH = D.BATCHES.find((b) => b.hero), KL = lineOf("kirana"), AW = D.AWARD, SHOPS = D.KIRANAS.length, BIN = D.PLAN.writeOff.total, SCHEME = M.RULES.scheme;
  const FOOD = M.CHANNELS.find((c) => c.id === "foodbank");
  const rate = (v) => Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v);
  const RESULT = `${fmt.inr(D.ACTUAL.net)} recovered, instead of ${fmt.inr(-BIN)} to destroy it`;
  const PLACES = [
    { id: "maker", t: "Manufacturer", short: "Maker", icon: "factory", line: `Makes the batch. You approve each plan here, and the money comes back here: ${fmt.inr(D.ACTUAL.net)}.` },
    { id: "godown", t: "Distributor · stockist", short: "Distributor", icon: "warehouse", line: `${fmt.num(BATCH.units)} packs of the batch, selling ${BATCH.sellPerDay} a day: ${fmt.num(D.RISK.atRisk)} won't sell in the ${BATCH.daysLeft} days left.` },
    { id: "kiranas", t: "Retailers", short: "Kiranas", icon: "store", line: `${SHOPS} kiranas take ${fmt.num(KL.units)} packs, buy ${SCHEME.buy} get ${SCHEME.free} free.` },
    { id: "buyer", t: "A buyer elsewhere", short: "Buyer", icon: "shopping-bag", line: `${fmt.num(AW.units)} packs through an ExpireSoon listing, at ${rate(AW.price)} a pack.` },
    { id: "foodbank", t: "Food bank", short: "Food bank", icon: "heart-handshake", line: `Takes food with ${FOOD.minDays} or more days left, as a donation. This batch sold before it was needed.` },
    { id: "landfill", t: "Landfill", short: "Landfill", icon: "trash-2", line: `Destroying the ${fmt.num(D.RISK.atRisk)} packs would cost ${fmt.inr(-BIN)}. This batch sends none here.` }
  ];
  const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p]));
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
    impact: `${fmt.num(D.PLAN.kg)} kg kept out of landfill`
  };
  const AGENTS = P.AGENTS.map((a) => ({
    id: a.gate ? "you" : a.id,
    key: a.id,
    name: a.gate ? "You" : a.name,
    icon: a.icon,
    human: !!a.gate,
    at: POST[a.id],
    job: a.gate ? "You approve every plan, with the money on screen" : a.job,
    did: DID[a.id]
  }));
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
    { id: "make", at: ["maker"], t: "Made", did: `${fmt.num(BATCH.units)} packs leave the factory for the distributor`, who: [], batch: "maker" },
    { id: "stock", at: ["godown"], t: "Stocked", did: `${fmt.num(BATCH.units)} packs in the distributor's godown, selling ${BATCH.sellPerDay} a day`, who: [], batch: "godown" },
    { id: "risk", at: ["godown"], t: "At risk", did: `${fmt.num(D.RISK.atRisk)} packs won't sell in the ${BATCH.daysLeft} days left`, who: ["data", "watcher", "vision"], batch: "godown" },
    { id: "route", at: ["godown"], t: "Priced and split", did: `Five exits priced · ${fmt.num(KL.units)} to ${SHOPS} kiranas, ${fmt.num(AW.units)} to one buyer`, who: ["valuer", "router"], batch: "godown" },
    { id: "yes", at: ["maker"], t: "One yes", did: `You approve in one tap · ${fmt.inr(D.PLAN.net)} on screen`, who: ["you"], human: true, batch: "godown" },
    { id: "sell", at: ["kiranas", "buyer"], t: "Sold", did: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas · ${fmt.num(AW.units)} to a buyer, countered to ${rate(AW.price)}`, who: ["outreach", "lister", "negotiator"], batch: "sold" },
    { id: "report", at: ["maker", "landfill"], t: "Settled", did: "", who: ["paperwork", "impact"], batch: null }
  ];
  const NB = BEATS.length;
  const beatOf = (id) => BEATS.findIndex((b) => b.id === id);
  const names = (b) => b.who.map((w) => AGENT[w].name).join(" · ");
  AGENTS.forEach((a) => {
    a.beat = BEATS.findIndex((b) => b.who.includes(a.id));
  });
  const PACE = { beat: 1100, agent: 1300, you: 1700 };
  const STOPS = [];
  BEATS.forEach((b, i) => {
    if (!b.who.length) STOPS.push({ beat: i, agent: null, ms: PACE.beat });
    else b.who.forEach((w) => STOPS.push({ beat: i, agent: w, ms: w === "you" ? PACE.you : PACE.agent }));
  });
  const NS = STOPS.length;
  AGENTS.forEach((a) => {
    a.stop = STOPS.findIndex((s) => s.agent === a.id);
  });
  const agentState = (a, j) => ({ done: a.stop < j.s || j.done, now: a.stop === j.s && !j.done });
  const GEO = {
    nw: 2752,
    nh: 1536,
    places: { maker: [0.175, 0.415], godown: [0.47, 0.44], kiranas: [0.79, 0.45], buyer: [0.8, 0.32], foodbank: [0.55, 0.385], landfill: [0.16, 0.265] },
    // on phones the food bank's pin moves to the kitchen's right, clear of the distributor's
    phonePlaces: { foodbank: [0.6, 0.36] },
    posts: {
      data: [0.355, 0.6],
      watcher: [0.395, 0.475],
      vision: [0.585, 0.455],
      valuer: [0.645, 0.545],
      router: [0.6, 0.705],
      you: [0.15, 0.585],
      paperwork: [0.085, 0.64],
      outreach: [0.875, 0.5],
      lister: [0.72, 0.235],
      negotiator: [0.9, 0.265],
      impact: [0.27, 0.315]
    },
    labels: { data: "left", watcher: "left", lister: "left", outreach: "left" },
    routes: {
      out: [[0.312, 0.66], [0.335, 0.72], [0.38, 0.748], [0.436, 0.756], [0.5, 0.762]],
      kiranas: [[0.5, 0.762], [0.58, 0.78], [0.65, 0.795], [0.727, 0.814], [0.8, 0.83]],
      buyer: [[0.5, 0.762], [0.58, 0.78], [0.727, 0.814], [0.836, 0.833], [0.86, 0.8], [0.85, 0.68], [0.815, 0.51], [0.735, 0.38], [0.69, 0.31], [0.75, 0.31], [0.84, 0.335]]
    },
    batch: { maker: [0.31, 0.655], godown: [0.5, 0.665] },
    // the camera: the whole business, and each place: the plate point it centres and how near; desktops and phones apart
    shots: {
      wide: { rest: [0.5, 0.5, 1], maker: [0.18, 0.58, 1.8], godown: [0.5, 0.6, 1.8], kiranas: [0.8, 0.62, 1.8], buyer: [0.8, 0.3, 2], foodbank: [0.52, 0.4, 2], landfill: [0.17, 0.32, 2] },
      phone: { rest: [0.5, 0.55, 1], maker: [0.18, 0.58, 1.4], godown: [0.5, 0.6, 1.4], kiranas: [0.8, 0.62, 1.4], buyer: [0.8, 0.32, 1.6], foodbank: [0.52, 0.4, 1.6], landfill: [0.17, 0.32, 1.6] }
    },
    // the band behind the buttons on desktops, as fractions of the stage: solid haze, then clear. The stage starts under
    // the heading (SC-42), so only its top edge sits behind the buttons
    haze: [0.06, 0.16]
  };
  const shotOf = (g, id) => {
    const S = GEO.shots[g && g.wide ? "wide" : "phone"];
    return S[id] || S.rest;
  };
  const placeAt = (g, id) => !g.wide && GEO.phonePlaces[id] || GEO.places[id];
  const wpx = (g, p) => [p[0] * g.w, p[1] * g.h];
  function useStage(ref) {
    const [g, setG] = useState(null);
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;
      const measure = () => {
        const W = el.clientWidth, H = el.clientHeight;
        if (!W || !H) return;
        const s = Math.max(W / GEO.nw, H / GEO.nh), w = GEO.nw * s, h = GEO.nh * s;
        setG((o) => o && o.W === W && o.H === H ? o : { W, H, w, h, ox: (W - w) / 2, oy: (H - h) / 2, wide: W >= 900 });
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);
    return g;
  }
  const ZMAX = 2.6;
  const DWELL = 600, PEEK_Z = 1.8;
  function useCamera(g, worlds, haze, reduce) {
    const cam = useRef({ x: 0.5, y: 0.5, z: 1 }), live = useRef(null), subs = useRef(/* @__PURE__ */ new Set()), views = useRef(/* @__PURE__ */ new Set()), gRef = useRef(g), fly = useRef(null);
    const [zoom, setZoom] = useState(1);
    gRef.current = g;
    const anchor = (G) => G.wide ? [0.5, 0.64] : [0.5, 0.5];
    const solve = (c, G = gRef.current) => {
      const z = clamp(c.z, 1, ZMAX), [ax, ay] = anchor(G);
      return { tx: clamp(ax * G.W - G.ox - c.x * G.w * z, G.W - G.ox - G.w * z, -G.ox), ty: clamp(ay * G.H - G.oy - c.y * G.h * z, G.H - G.oy - G.h * z, -G.oy), z };
    };
    const focusOf = (t, G = gRef.current) => {
      const [ax, ay] = anchor(G);
      return { x: (ax * G.W - G.ox - t.tx) / (G.w * t.z), y: (ay * G.H - G.oy - t.ty) / (G.h * t.z), z: t.z };
    };
    const write = (c) => {
      if (!gRef.current) return;
      const t = solve(c);
      cam.current = focusOf(t);
      live.current = t;
      worlds.current.forEach((el) => {
        el.style.transform = `translate(${t.tx.toFixed(2)}px, ${t.ty.toFixed(2)}px) scale(${t.z.toFixed(4)})`;
        el.style.setProperty("--iz", (1 / t.z).toFixed(4));
      });
      if (haze.current) haze.current.style.opacity = clamp((t.z - 1) / 0.28, 0, 1).toFixed(3);
      subs.current.forEach((f) => f(t));
      const step = Math.round(t.z * 10) / 10;
      setZoom((s) => s === step ? s : step);
    };
    const stop = () => {
      if (fly.current) {
        fly.current.stop();
        fly.current = null;
      }
    };
    const api = useMemo(() => ({
      get: () => cam.current,
      t: () => live.current || (gRef.current ? solve(cam.current) : { tx: 0, ty: 0, z: 1 }),
      // fly to a shot ([x, y, z]); jumps under reduced motion
      to: (shot, dur = 0.7) => {
        stop();
        const to = { x: shot[0], y: shot[1], z: shot[2] };
        if (reduce || dur <= 0) {
          write(to);
          return;
        }
        const from = { ...cam.current }, lz0 = Math.log(from.z), lz1 = Math.log(to.z);
        fly.current = Motion.animate(0, 1, { duration: dur, ease: FLY, onUpdate: (u) => write({ x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u, z: Math.exp(lz0 + (lz1 - lz0) * u) }) });
      },
      // move by a drag, in stage px, from a transform taken at its start
      drag: (t0, dx, dy) => {
        stop();
        write(focusOf(solve(focusOf({ tx: t0.tx + dx, ty: t0.ty + dy, z: t0.z }))));
      },
      // zoom by a factor about a stage point, which stays under the pointer
      zoomAt: (f, sx, sy, smooth) => {
        const G = gRef.current, t = api.t(), z1 = clamp(t.z * f, 1, ZMAX);
        const px = (sx - G.ox - t.tx) / (G.w * t.z), py = (sy - G.oy - t.ty) / (G.h * t.z);
        const c1 = focusOf({ tx: sx - G.ox - px * G.w * z1, ty: sy - G.oy - py * G.h * z1, z: z1 });
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
      // the depth renderer's own changes (its tilt and focus), for what sits on the town
      listenView: (f) => {
        views.current.add(f);
        return () => views.current.delete(f);
      },
      viewChanged: () => views.current.forEach((f) => f())
    }), [reduce]);
    useLayoutEffect(() => {
      if (g) write(cam.current);
    }, [g]);
    return { api, zoom };
  }
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
          pinch = { ...two(), t: api.t() };
          drag = null;
        }
      };
      const move = (e) => {
        if (!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, [e.clientX, e.clientY]);
        if (pinch && pts.size >= 2) {
          const s = two();
          if (!moved) {
            moved = true;
            user.current();
          }
          api.zoomAt(s.d / pinch.d * pinch.t.z / api.t().z, pinch.m[0], pinch.m[1], false);
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
  const loaderSays = (fn, arg) => {
    const L = window.SC3_LOADER;
    if (L && L[fn]) requestAnimationFrame(() => L[fn](arg));
  };
  function useLifted() {
    const [v, setV] = useState(() => !window.SC3_LOADER || window.SC3_LOADER.lifted);
    useEffect(() => {
      if (v) return;
      const f = () => setV(true);
      window.addEventListener("sc3:loader-lifted", f);
      return () => window.removeEventListener("sc3:loader-lifted", f);
    }, [v]);
    return v;
  }
  function useJourney(ready, inView, looking) {
    const reduce = !!useReducedMotion(), lifted = useLifted();
    const [s, setS] = useState(reduce ? NS : -1);
    const [run, setRun] = useState(0);
    const [manual, setManual] = useState(false);
    const [paused, setPaused] = useState(false);
    useEffect(() => {
      if (reduce) {
        setS(NS);
        return;
      }
      if (!ready || !lifted) return;
      setS(-1);
      setPaused(false);
      const t = setTimeout(() => setS(0), 500);
      return () => clearTimeout(t);
    }, [ready, lifted, run, reduce]);
    const hold = paused || manual || !inView || !!looking;
    useEffect(() => {
      if (reduce || hold || s < 0 || s >= NS) return;
      const t = setTimeout(() => setS(s + 1), STOPS[s].ms);
      return () => clearTimeout(t);
    }, [s, reduce, hold]);
    const stop = s >= 0 && s < NS ? STOPS[s] : null, k = s < 0 ? -1 : stop ? stop.beat : NB;
    const j = { s, k, reduce, run, manual, paused, stop, ms: stop ? stop.ms : 0, held: hold, playing: s < NS && !manual && !paused, touring: !!stop && !manual, done: s >= NS, beat: stop ? BEATS[stop.beat] : null, agent: stop ? stop.agent : null };
    j.replay = () => {
      setManual(false);
      setPaused(false);
      setRun((r) => r + 1);
      if (reduce) setS(NS);
    };
    j.step = (d) => {
      setManual(true);
      setPaused(false);
      setS((v) => clamp((v < 0 ? 0 : v) + d, 0, NS));
    };
    j.pause = () => setPaused(true);
    j.play = () => {
      setManual(false);
      setPaused(false);
      setS((v) => v >= NS ? v : Math.max(0, v));
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
      const c = Motion.animate(0, to, { duration: 0.7, ease: EASE, onUpdate: setV });
      return () => c.stop();
    }, [on, reduce]);
    return v;
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
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => {
        x.drawImage(im, 0, 0, W, H);
        const d = x.getImageData(0, 0, W, H).data;
        setM({ canvas: c, at: (p) => d[(clamp(Math.round(p[1] * (H - 1)), 0, H - 1) * W + clamp(Math.round(p[0] * (W - 1)), 0, W - 1)) * 4] / 255 });
        loaderSays("depthIn");
      };
      im.src = IMG + "business-depth.webp";
    }, [on]);
    return m;
  }
  function DepthPlate(props) {
    const { g: g0, api, dark, reduce: reduce0, map: map0, stageRef } = props;
    const cv = useRef(null), gl = useRef(null), st = useRef({ tilt: [0, 0], want: [0, 0], focus: 0.5, blur: 0, raf: 0 }), P2 = useRef(props);
    P2.current = props;
    useEffect(() => {
      const c = cv.current, ctx = c && c.getContext("webgl2", { antialias: false, premultipliedAlpha: false, alpha: false });
      if (!ctx) {
        P2.current.onFail();
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
        P2.current.onFail();
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
    const draw = () => {
      const G = gl.current, s = st.current, c = cv.current, { g } = P2.current;
      if (!G || !c || !g || !s.ready || !s.depth) return;
      const ctx = G.ctx, dpr = Math.min(window.devicePixelRatio || 1, g.wide ? 2 : 1.5), W = Math.round(g.W * dpr), H = Math.round(g.H * dpr);
      if (c.width !== W || c.height !== H) {
        c.width = W;
        c.height = H;
      }
      ctx.viewport(0, 0, W, H);
      const t = api.t(), fc = api.get(), dz = P2.current.reduce ? 0 : DOLLY * (1 - 1 / t.z), sk = P2.current.dark ? [3, 19, 48] : [236, 231, 228];
      ctx.uniform2f(G.U.res, W, H);
      ctx.uniform4f(G.U.world, g.ox * dpr, g.oy * dpr, g.w * dpr, g.h * dpr);
      ctx.uniform3f(G.U.cam, t.tx * dpr, t.ty * dpr, t.z);
      ctx.uniform2f(G.U.tilt, s.tilt[0], s.tilt[1]);
      ctx.uniform1f(G.U.focus, s.focus);
      ctx.uniform1f(G.U.blur, s.blur);
      ctx.uniform1f(G.U.sky, g.wide ? clamp((t.z - 1) / 0.28, 0, 1) : 0);
      ctx.uniform2f(G.U.band, GEO.haze[0], GEO.haze[1]);
      ctx.uniform3f(G.U.dolly, fc.x, fc.y, dz);
      ctx.uniform3f(G.U.skyCol, sk[0] / 255, sk[1] / 255, sk[2] / 255);
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
      P2.current.view.current = { tilt: s.tilt, focus: s.focus, foc: [fc.x, fc.y], dolly: dz };
    };
    const loop = () => {
      const s = st.current, t = api.t(), c = api.get(), { map, reduce } = P2.current;
      const f = map ? map.at([c.x, c.y]) : 0.6, fb = clamp((t.z - 1) / 0.45, 0, 1) * 2.4, k = reduce ? 1 : 0.14;
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
    useEffect(() => () => cancelAnimationFrame(st.current.raf), []);
    useEffect(() => {
      if (map0 && gl.current) {
        upload(1, map0.canvas, false);
        st.current.depth = true;
        if (st.current.ready) {
          P2.current.onReady();
          loaderSays("plateDrawn", P2.current.dark);
        }
        draw();
        kick();
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
        if (st.current.depth) {
          P2.current.onReady();
          loaderSays("plateDrawn", dark);
        }
        draw();
        kick();
      };
      im.onerror = () => P2.current.onFail();
      im.src = IMG + (dark ? "business-night.webp" : "business.webp");
      return () => {
        alive = false;
      };
    }, [dark]);
    useEffect(() => {
      let last = null;
      return api.listen(() => {
        const c = api.get(), s = st.current;
        if (last && !P2.current.reduce) s.want = [clamp(s.want[0] - (c.x - last.x) * SWAY, -0.035, 0.035), clamp(s.want[1] - (c.y - last.y) * SWAY * 0.6, -0.02, 0.02)];
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
        else if (last) st.current.want = [clamp(st.current.want[0] + (e.clientX - last[0]) * 6e-4, -0.03, 0.03), clamp(st.current.want[1] + (e.clientY - last[1]) * 4e-4, -0.02, 0.02)];
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
    return /* @__PURE__ */ React.createElement("canvas", { ref: cv, className: "town-gl", "aria-hidden": "true" });
  }
  function Graph({ g, api, j, dark, focus, project, holes }) {
    const cv = useRef(null), prog = useRef({}), raf = useRef(0), packs = useRef(null);
    const st = useRef({});
    st.current = { g, j, dark, focus, project, holes };
    const draw = useCallback(() => {
      const c = cv.current, s = st.current;
      if (!c || !s.g) return;
      const ctx = fitCanvas(c, s.g.W, s.g.H);
      ctx.clearRect(0, 0, s.g.W, s.g.H);
      ctx.save();
      const hs = s.holes ? s.holes() : [];
      if (hs.length) {
        ctx.beginPath();
        ctx.rect(0, 0, s.g.W, s.g.H);
        hs.forEach((h) => ctx.rect(h[0], h[1], h[2] - h[0], h[3] - h[1]));
        ctx.clip("evenodd");
      }
      const Pt = (id) => s.project ? s.project(GEO.posts[id], id) : api.toStage(GEO.posts[id]);
      const lit = s.dark ? "#3ccb8a" : "#167a52", amber = s.dark ? "#f7c04a" : "#e8a722", casing = s.dark ? "rgba(8,14,11,0.6)" : "rgba(255,255,255,0.75)";
      const k = s.j.done ? NB : s.j.k;
      EDGES.forEach(([a, b]) => {
        const p = prog.current[a + b] || 0;
        if (p <= 0) return;
        const A = Pt(a), B = Pt(b), d = Math.hypot(B[0] - A[0], B[1] - A[1]), mx = (A[0] + B[0]) / 2, far = AGENT[a].at !== AGENT[b].at;
        const my = (A[1] + B[1]) / 2 + (far ? Math.min(110, d * 0.2) : -Math.min(70, d * 0.22));
        const loud = s.focus ? s.focus.has(a) && s.focus.has(b) : AGENT[b].stop === s.j.s && !s.j.done;
        const hue = AGENT[a].human || AGENT[b].human ? amber : lit, n = 36, m = Math.max(1, Math.round(n * p));
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
          ctx.globalAlpha = s.focus ? 0.16 : 0.32;
          path();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = hue;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });
      const pk = packs.current;
      if (pk) {
        const now = performance.now(), u = clamp((now - pk.t0) / pk.dur, 0, 1), z = api.t().z;
        pk.list.forEach((dot) => {
          const t = clamp((u - dot.delay) / (1 - dot.delay), 0, 1);
          if (t <= 0) return;
          const q = along(GEO.routes[dot.to], 1 - Math.pow(1 - t, 3)), [x, y] = s.project ? s.project(q) : api.toStage(q);
          ctx.globalAlpha = t >= 1 ? clamp(1 - (now - pk.t0 - pk.dur) / 400, 0, 1) : 1;
          ctx.beginPath();
          ctx.arc(x, y, 3.6 * Math.max(1, Math.sqrt(z)), 0, Math.PI * 2);
          ctx.fillStyle = dot.to === "buyer" ? s.dark ? "#8a6ee8" : "#7c5cd6" : lit;
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
      const n = j.done ? NS : j.s, want = {};
      EDGES.forEach(([a, b]) => {
        want[a + b] = AGENT[b].stop >= 0 && (AGENT[b].stop < n || AGENT[b].stop === n && (j.touring || j.manual)) ? 1 : 0;
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
          const f = from[key] || 0;
          prog.current[key] = f + (want[key] - f) * (want[key] > f ? u : 1);
        });
        draw();
        if (u < 1 || packs.current) raf.current = requestAnimationFrame(tick);
      };
      if (j.stop && BEATS[j.stop.beat].id === "sell" && j.stop.agent === BEATS[j.stop.beat].who[0] && j.playing) {
        const list = [];
        for (let i = 0; i < 26; i++) list.push({ to: i % 13 < 6 ? "kiranas" : "buyer", delay: i / 26 * 0.45 });
        packs.current = { t0: performance.now(), dur: 900, list };
      }
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(tick);
      return () => {
        alive = false;
        cancelAnimationFrame(raf.current);
      };
    }, [j.s, j.done, j.reduce, j.run]);
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
    return /* @__PURE__ */ React.createElement("canvas", { ref: cv, className: "town-graph", "aria-hidden": "true" });
  }
  const Pin = ({ p, g, j, sel, onOpen, hover, peek }) => {
    const at = wpx(g, placeAt(g, p.id)), here = j.beat && j.beat.at.includes(p.id), open = sel && sel.kind === "place" && sel.id === p.id, me = { kind: "place", id: p.id };
    const looked = peek && same(peek.s, me);
    return /* @__PURE__ */ React.createElement("span", { className: "town-at", style: { left: at[0], top: at[1] } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: cx("town-pin", here && "here", (open || looked) && "open", looked && peek.ring && "ring"),
        "aria-expanded": open,
        "aria-controls": open ? "town-panel" : void 0,
        "aria-describedby": looked && !peek.pinned ? "town-peek" : void 0,
        "aria-label": `${p.t}: what happens here`,
        onClick: (e) => onOpen(me, e),
        onPointerEnter: (e) => e.pointerType === "mouse" && hover(me),
        onPointerLeave: (e) => e.pointerType === "mouse" && hover(null),
        onFocus: (e) => e.target.matches(":focus-visible") && hover(me),
        onBlur: (e) => hover(null, e.relatedTarget)
      },
      /* @__PURE__ */ React.createElement("span", { className: "town-pin-body" }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: p.icon, size: 14, stroke: 2 })), /* @__PURE__ */ React.createElement("b", null, g.wide ? p.t : p.short)),
      /* @__PURE__ */ React.createElement("span", { className: "town-pin-stem" })
    ));
  };
  const Node = ({ a, g, j, sel, onOpen, hover, named, tipped, peek }) => {
    const me = { kind: "agent", id: a.id }, looked = peek && same(peek.s, me);
    const at = wpx(g, GEO.posts[a.id]), { done, now } = agentState(a, j), open = sel && sel.kind === "agent" && sel.id === a.id || looked;
    const side = GEO.labels[a.id] || "right", show = !tipped && (named || open || now && (g.wide || a.human));
    return /* @__PURE__ */ React.createElement("span", { className: "town-at", style: { left: at[0], top: at[1] } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        tabIndex: -1,
        "aria-hidden": "true",
        className: cx("town-node", "side-" + side, a.human && "human", done && "on", now && "now", !done && !now && j.k >= 0 && "later", open && "open", show && "named", looked && peek.ring && "ring"),
        onClick: (e) => onOpen(me, e),
        onPointerEnter: (e) => e.pointerType === "mouse" && hover(me),
        onPointerLeave: (e) => e.pointerType === "mouse" && hover(null)
      },
      /* @__PURE__ */ React.createElement("span", { className: cx("town-node-dot", now && "aura") }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 14, stroke: 2.1 })),
      /* @__PURE__ */ React.createElement("span", { className: "town-node-name" }, a.name)
    ));
  };
  function Batch({ g, j }) {
    const ref = useRef(null), pos = useRef(null), b = j.beat;
    const place = j.done ? null : b ? b.batch : j.k < 0 ? "maker" : null;
    useEffect(() => {
      const el = ref.current;
      if (!el || !g || !place || place === "sold") return;
      const to = wpx(g, GEO.batch[place]), set = (p) => {
        pos.current = p;
        el.style.left = p[0] + "px";
        el.style.top = p[1] + "px";
      };
      if (!pos.current || j.reduce || place !== "godown") {
        set(to);
        return;
      }
      const route = GEO.routes.out.map((p) => wpx(g, p));
      const c = Motion.animate(0, 1, { duration: 0.5, ease: EASE, onUpdate: (u) => set(along(route, u)) });
      return () => c.stop();
    }, [place, g]);
    if (!place) return null;
    const risk = j.k >= beatOf("risk") && j.k < beatOf("sell");
    const text = b && b.id === "sell" ? `${fmt.num(KL.units)} + ${fmt.num(AW.units)} sold` : j.k >= beatOf("risk") ? `${fmt.num(D.RISK.atRisk)} at risk` : `${fmt.num(BATCH.units)} packs`;
    return /* @__PURE__ */ React.createElement("span", { className: "town-at town-batch", ref, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: cx("town-batch-card", risk && "risk") }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: "package", size: 14, stroke: 2 })), /* @__PURE__ */ React.createElement("b", null, text)));
  }
  const same = (a, b) => !!a && !!b && a.kind === b.kind && a.id === b.id;
  function CardBody({ sel, j, onOpen, live = true }) {
    const chips = (ids) => /* @__PURE__ */ React.createElement("span", { className: "town-panel-chips" }, ids.map((id) => {
      const a2 = AGENT[id], { done } = agentState(a2, j), c = cx("town-chip", a2.human && "human", done && "on");
      const inner = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: a2.icon, size: 13, stroke: 2.2 })), a2.name);
      return live ? /* @__PURE__ */ React.createElement("button", { key: id, type: "button", className: c, onClick: () => onOpen({ kind: "agent", id }) }, inner) : /* @__PURE__ */ React.createElement("span", { key: id, className: c }, inner);
    }));
    if (sel.kind === "place") {
      const p = PLACE[sel.id], team = AGENTS.filter((a2) => a2.at === p.id).map((a2) => a2.id);
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: p.icon, size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("h3", { id: "town-panel-h" }, p.t)), /* @__PURE__ */ React.createElement("p", null, p.line), team.length > 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "town-panel-k" }, "Who works here"), chips(team)) : /* @__PURE__ */ React.createElement("span", { className: "town-panel-k" }, "The Valuer prices it on every plan"));
    }
    const a = AGENT[sel.id], from = EDGES.filter((e) => e[1] === a.id).map((e) => e[0]), to = EDGES.filter((e) => e[0] === a.id).map((e) => e[1]);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("i", { className: cx(a.human && "human") }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("h3", { id: "town-panel-h" }, a.name), live ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "town-panel-at", onClick: () => onOpen({ kind: "place", id: a.at }) }, "at the ", PLACE[a.at].short.toLowerCase()) : /* @__PURE__ */ React.createElement("span", { className: "town-panel-at plain" }, "at the ", PLACE[a.at].short.toLowerCase())), /* @__PURE__ */ React.createElement("p", null, a.job, "."), /* @__PURE__ */ React.createElement("p", { className: "town-panel-did" }, /* @__PURE__ */ React.createElement("span", { className: "town-panel-k" }, "This batch"), a.did), (from.length > 0 || to.length > 0) && /* @__PURE__ */ React.createElement("div", { className: "town-panel-flow" }, from.length > 0 && /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "town-panel-k" }, "From"), chips(from)), to.length > 0 && /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "town-panel-k" }, "Hands to"), chips(to))));
  }
  function Panel({ sel, j, onOpen, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
      if (sel && ref.current) ref.current.focus({ preventScroll: true });
    }, [sel && sel.kind, sel && sel.id]);
    if (!sel) return null;
    return /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: sel.kind + sel.id,
        id: "town-panel",
        className: "town-panel",
        role: "region",
        "aria-labelledby": "town-panel-h",
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
      /* @__PURE__ */ React.createElement(CardBody, { sel, j, onOpen }),
      /* @__PURE__ */ React.createElement("button", { type: "button", className: "town-panel-x", "aria-label": "Close", onClick: onClose }, /* @__PURE__ */ React.createElement(Icon, { name: "x", size: 16, stroke: 2 }))
    );
  }
  function Peek({ g, pk, j, api, project, room, onOpen, onEnter, onLeave, onClose }) {
    const ref = useRef(null), s = pk && pk.s;
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el || !s || !g) return;
      const pos = s.kind === "place" ? placeAt(g, s.id) : GEO.posts[s.id], lift = s.kind === "place" ? 54 : 24, drop = s.kind === "place" ? 12 : 24;
      const put = () => {
        const p = project ? project(pos, s.id) : api.toStage(pos), w = el.offsetWidth, h = el.offsetHeight, R = room ? room() : { top: 8, bottom: g.H - 8 };
        let x, y, side;
        if (p[1] - lift - h >= R.top) {
          side = "above";
          y = p[1] - lift - h;
          x = clamp(p[0] - w / 2, 8, g.W - w - 8);
        } else if (p[1] + drop + h <= R.bottom) {
          side = "below";
          y = p[1] + drop;
          x = clamp(p[0] - w / 2, 8, g.W - w - 8);
        } else {
          side = p[0] + 30 + w <= g.W - 8 ? "right" : "left";
          x = side === "right" ? p[0] + 30 : p[0] - 30 - w;
          y = clamp(p[1] - h / 2, R.top, Math.max(R.top, R.bottom - h));
        }
        el.style.left = x.toFixed(1) + "px";
        el.style.top = y.toFixed(1) + "px";
        el.style.setProperty("--caret", clamp(p[0] - x, 14, w - 14).toFixed(1) + "px");
        el.style.setProperty("--caret-y", clamp(p[1] - y, 14, h - 14).toFixed(1) + "px");
        el.dataset.side = side;
      };
      put();
      const u1 = api.listen(put), u2 = api.listenView(put);
      return () => {
        u1();
        u2();
      };
    }, [s && s.kind, s && s.id, pk && pk.pinned, g, project]);
    const human = s && s.kind === "agent" && AGENT[s.id].human;
    return /* @__PURE__ */ React.createElement(AnimatePresence, null, s && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: s.kind + s.id,
        ref,
        id: "town-peek",
        className: cx("town-peek", human && "human", pk.pinned && "kept"),
        role: pk.pinned ? "region" : "tooltip",
        "aria-labelledby": pk.pinned ? "town-panel-h" : void 0,
        onPointerEnter: onEnter,
        onPointerLeave: onLeave,
        initial: j.reduce ? false : { opacity: 0, scale: 0.96, y: 4 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, transition: { duration: 0.12 } },
        transition: { duration: 0.2, ease: EASE }
      },
      /* @__PURE__ */ React.createElement(CardBody, { sel: s, j, onOpen, live: pk.pinned }),
      pk.pinned && /* @__PURE__ */ React.createElement("button", { type: "button", className: "town-panel-x", "aria-label": "Close", onClick: onClose }, /* @__PURE__ */ React.createElement(Icon, { name: "x", size: 16, stroke: 2 }))
    ));
  }
  function Tip({ g, j, api, project }) {
    const ref = useRef(null), id = j.agent, a = id ? AGENT[id] : null;
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el || !a || !g) return;
      const put = () => {
        const p = project ? project(GEO.posts[id], id) : api.toStage(GEO.posts[id]), w = el.offsetWidth, h = el.offsetHeight, up = p[1] - 28 - h > 8;
        const x = clamp(p[0] - w / 2, 8, g.W - w - 8);
        el.style.left = x.toFixed(1) + "px";
        el.style.top = (up ? p[1] - 28 - h : p[1] + 28).toFixed(1) + "px";
        el.style.setProperty("--caret", clamp(p[0] - x, 14, w - 14).toFixed(1) + "px");
        el.classList.toggle("below", !up);
      };
      put();
      const u1 = api.listen(put), u2 = api.listenView(put);
      return () => {
        u1();
        u2();
      };
    }, [id, g, project]);
    return /* @__PURE__ */ React.createElement(AnimatePresence, null, a && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: id,
        ref,
        className: cx("town-tip", a.human && "human"),
        "aria-hidden": "true",
        initial: j.reduce ? false : { opacity: 0, scale: 0.94 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, transition: { duration: 0.14 } },
        transition: { duration: 0.22, ease: EASE }
      },
      /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 13, stroke: 2.2 })), /* @__PURE__ */ React.createElement("b", null, a.name), /* @__PURE__ */ React.createElement("span", null, "at the ", PLACE[a.at].short.toLowerCase())),
      /* @__PURE__ */ React.createElement("p", null, a.did),
      !j.reduce && /* @__PURE__ */ React.createElement("span", { key: j.s, className: "town-tip-time", style: { animationDuration: j.ms + "ms", animationPlayState: j.held ? "paused" : "running" } })
    ));
  }
  function Caption({ j, money, hint }) {
    const b = j.beat;
    return /* @__PURE__ */ React.createElement("div", { className: cx("town-caption", b && b.human && "human") }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "town-step", "aria-label": "The step before", disabled: j.s <= 0, onClick: () => j.step(-1) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "town-caption-text", "aria-hidden": "true" }, j.s < 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, fmt.num(BATCH.units), " packs leave the factory."), /* @__PURE__ */ React.createElement("span", null, "Follow them through the business.")) : b ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, j.k + 1, " of ", NB), /* @__PURE__ */ React.createElement("b", null, b.t), b.who.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "who" }, names(b)), /* @__PURE__ */ React.createElement("span", { className: "did" }, b.id === "report" ? `${fmt.inr(money)} recovered · ${fmt.num(D.PLAN.kg)} kg kept out of landfill` : b.did)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, NB, " of ", NB), /* @__PURE__ */ React.createElement("b", null, "Sold, not binned."), /* @__PURE__ */ React.createElement("span", { className: "did" }, RESULT), hint && /* @__PURE__ */ React.createElement("span", { className: "hint" }, hint))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "town-step", "aria-label": "The next step", disabled: j.done, onClick: () => j.step(1) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16, stroke: 2 })));
  }
  const said = (b) => b.id === "report" ? `${fmt.inr(D.ACTUAL.net)} recovered, ${fmt.num(D.PLAN.kg)} kg kept out of landfill` : b.did;
  const SrJourney = ({ j }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("ol", { className: "sr-only", "aria-label": "One batch's journey through the business" }, BEATS.map((b) => /* @__PURE__ */ React.createElement("li", { key: b.id }, b.t, b.who.length ? `, ${names(b)}` : "", ": ", said(b), "."))), /* @__PURE__ */ React.createElement("p", { className: "sr-only" }, "Sold, not binned: ", RESULT, "."), /* @__PURE__ */ React.createElement("p", { className: "sr-only", "aria-live": "polite" }, j.manual ? j.beat ? `${j.k + 1} of ${NB}, ${j.beat.t}${j.agent ? `, ${AGENT[j.agent].name}: ${AGENT[j.agent].did}` : `: ${said(j.beat)}`}.` : `Sold, not binned: ${RESULT}.` : ""));
  function Controls({ j, api, g, zoom, onWhole, onReplay, onPlay, onTake }) {
    const c = () => [g.W / 2, g.H * (g.wide ? 0.64 : 0.5)];
    const zoomBy = (f) => {
      onTake();
      api.zoomAt(f, ...c(), true);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "town-ctl" }, !j.reduce && (j.done ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: onReplay }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16, stroke: 2 }), "Replay") : j.playing ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: j.pause }, /* @__PURE__ */ React.createElement(Icon, { name: "pause", size: 16, stroke: 2 }), "Pause") : /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: onPlay }, /* @__PURE__ */ React.createElement(Icon, { name: "play", size: 16, stroke: 2 }), "Play")), /* @__PURE__ */ React.createElement("span", { className: "town-zoom", role: "group", "aria-label": "Zoom" }, /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "Zoom out", disabled: zoom <= 1, onClick: () => zoomBy(1 / 1.45) }, /* @__PURE__ */ React.createElement(Icon, { name: "minus", size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "Zoom in", disabled: zoom >= ZMAX, onClick: () => zoomBy(1.45) }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "The whole business", disabled: zoom <= 1, onClick: onWhole }, /* @__PURE__ */ React.createElement(Icon, { name: "minimize-2", size: 16, stroke: 2 }))));
  }
  function Town() {
    const stageRef = useRef(null), plateWorld = useRef(null), topWorld = useRef(null), hazeRef = useRef(null), view = useRef(null);
    const g = useStage(stageRef), { resolved } = useTheme(), dark = resolved === "dark";
    const [ready, setReady] = useState(false), [gl, setGl] = useState(true), [inView, setInView] = useState(true);
    const [peek, setPeekState] = useState(null), peekNow = useRef(null);
    peekNow.current = peek;
    const setPeek = (v) => {
      const next = typeof v === "function" ? v(peekNow.current) : v;
      peekNow.current = next;
      setPeekState(next);
    };
    const j = useJourney(ready, inView, peek);
    const worlds = useMemo(() => ({ get current() {
      return [plateWorld.current, topWorld.current].filter(Boolean);
    } }), []);
    const { api, zoom } = useCamera(g, worlds, gl ? { current: null } : hazeRef, j.reduce);
    const depth = useDepthMap(true), map = gl ? depth : null;
    const [follow, setFollow] = useState(true), [sel, setSel] = useState(null), [hov, setHov] = useState(null);
    const money = useCount(j.k >= beatOf("report"), D.ACTUAL.net, j.reduce);
    const take = () => {
      setFollow(false);
      if (!j.done && j.playing) j.pause();
    };
    useGestures(stageRef, api, take);
    const keep = g && g.w > g.W + 1 && !j.done && j.s >= 0 ? j.agent ? GEO.posts[j.agent] : placeAt(g, j.beat.at[0]) : null;
    useEffect(() => {
      if (!g || !follow) return;
      const rest = shotOf(g, "rest");
      api.to(keep ? [keep[0], rest[1], rest[2]] : rest, j.s < 0 ? 0 : 0.9);
    }, [follow, g && g.wide, g && g.W, j.run, keep]);
    const T = useRef({ dwell: 0, leave: 0, before: null });
    const outOfView = (p) => {
      const R = room();
      return p[0] < 80 || p[0] > g.W - 80 || p[1] < R.top + 40 || p[1] > R.bottom - 40;
    };
    const zoomOn = (sv) => {
      const pk = peekNow.current;
      if (!g || !pk || !same(pk.s, sv)) return;
      const pos = sv.kind === "place" ? placeAt(g, sv.id) : GEO.posts[sv.id], p = project ? project(pos, sv.id) : api.toStage(pos), z = api.t().z;
      if (!T.current.before) T.current.before = { ...api.get() };
      if (z < PEEK_Z - 0.05) api.zoomAt(PEEK_Z / z, p[0], p[1], true);
      else if (outOfView(p)) api.to([pos[0], pos[1], z], j.reduce ? 0 : 0.6);
      setPeek((v) => v && same(v.s, sv) ? { ...v, ring: false, zoomed: true } : v);
    };
    const unlook = (force) => {
      const t = T.current;
      clearTimeout(t.dwell);
      clearTimeout(t.leave);
      const pk = peekNow.current;
      if (!pk || pk.pinned && !force) return;
      setPeek(null);
      setHov(null);
      if (t.before) {
        const b = t.before;
        t.before = null;
        api.to([b.x, b.y, b.z], j.reduce ? 0 : 0.6);
      }
    };
    const look = (sv, to) => {
      const t = T.current;
      if (!sv) {
        clearTimeout(t.dwell);
        if (to && to.closest && to.closest(".town-peek")) return;
        clearTimeout(t.leave);
        t.leave = setTimeout(() => unlook(false), 250);
        return;
      }
      setHov(sv);
      clearTimeout(t.leave);
      if (!g || !g.wide || sel) return;
      const pk = peekNow.current;
      if (pk && pk.pinned) return;
      if (!pk || !same(pk.s, sv)) setPeek({ s: sv, ring: !j.reduce, zoomed: !!(pk && pk.zoomed), pinned: false });
      clearTimeout(t.dwell);
      t.dwell = setTimeout(() => zoomOn(sv), DWELL);
    };
    const pinCard = (sv) => {
      const t = T.current;
      clearTimeout(t.leave);
      clearTimeout(t.dwell);
      const was = peekNow.current;
      setPeek({ s: sv, ring: false, zoomed: true, pinned: true });
      if (!was || !was.zoomed || !same(was.s, sv)) setTimeout(() => zoomOn(sv), 0);
    };
    const open = (s, e) => {
      const pk = peekNow.current;
      if (g && g.wide && e && e.detail > 0 && pk && (same(pk.s, s) || pk.pinned)) {
        pinCard(s);
        return;
      }
      unlook(true);
      take();
      setSel(s);
      const place = s.kind === "place" ? s.id : AGENT[s.id].at, shot = shotOf(g, place);
      api.to(s.kind === "agent" ? [GEO.posts[s.id][0], GEO.posts[s.id][1] + (g.wide ? 0.06 : 0.04), shot[2]] : shot, 0.7);
    };
    const whole = () => {
      setSel(null);
      api.to(shotOf(g, "rest"), 0.7);
    };
    const replay = () => {
      setSel(null);
      setFollow(true);
      j.replay();
    };
    const play = () => {
      setSel(null);
      setFollow(true);
      j.play();
    };
    useEffect(() => {
      const k = (e) => {
        if (e.key !== "Escape") return;
        if (peekNow.current) unlook(true);
        else if (sel) setSel(null);
      };
      window.addEventListener("keydown", k);
      return () => window.removeEventListener("keydown", k);
    }, [sel]);
    const unlookRef = useRef(unlook);
    unlookRef.current = unlook;
    const live = useRef(null);
    live.current = { j, follow, g };
    useEffect(() => {
      const st = stageRef.current, hero = st && st.closest(".hero");
      if (!hero) return;
      let t = 0;
      const back = () => {
        clearTimeout(t);
        const L = live.current;
        unlookRef.current(true);
        setSel(null);
        setHov(null);
        if (L.g && !(L.follow && L.j.playing)) api.to(shotOf(L.g, "rest"), L.j.reduce ? 0 : 0.7);
      };
      const enter = (e) => {
        if (e.pointerType === "mouse") clearTimeout(t);
      };
      const leave = (e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(t);
        t = setTimeout(back, 300);
      };
      const out = (e) => {
        if (e.relatedTarget && !hero.contains(e.relatedTarget)) back();
      };
      const down = (e) => {
        if (!hero.contains(e.target)) back();
      };
      hero.addEventListener("pointerenter", enter);
      hero.addEventListener("pointerleave", leave);
      hero.addEventListener("focusout", out);
      document.addEventListener("pointerdown", down, true);
      const io = new IntersectionObserver(([e]) => {
        const v = e.intersectionRatio >= 0.3;
        setInView(v);
        if (!v) back();
      }, { threshold: [0, 0.3, 0.6] });
      io.observe(st);
      return () => {
        clearTimeout(t);
        hero.removeEventListener("pointerenter", enter);
        hero.removeEventListener("pointerleave", leave);
        hero.removeEventListener("focusout", out);
        document.removeEventListener("pointerdown", down, true);
        io.disconnect();
      };
    }, [api]);
    const tour = follow && !sel && !peek && j.touring && j.agent ? j.agent : null;
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
    const boxes = (sels, pad, any) => {
      const s = stageRef.current, hero = s && s.closest(".hero");
      if (!s || !g || !g.wide && !any) return [];
      const o = s.getBoundingClientRect();
      return [...hero.querySelectorAll(sels)].map((e) => {
        const r = e.getBoundingClientRect();
        return [r.left - o.left - pad, r.top - o.top - pad, r.right - o.left + pad, r.bottom - o.top + pad];
      });
    };
    const holes = useCallback(() => boxes(".hero-h, .hero-sub, .hero-ctas > *", 8), [g]);
    const room = useCallback(() => {
      const st = stageRef.current, hero = st && st.closest(".hero");
      if (!st || !g) return { top: 8, bottom: 0 };
      const o = st.getBoundingClientRect();
      let top = 8;
      hero.querySelectorAll(".hero-h, .hero-sub, .hero-ctas > *").forEach((e) => {
        top = Math.max(top, e.getBoundingClientRect().bottom - o.top + 10);
      });
      const cap = hero.querySelector(".town-caption"), bottom = Math.min(g.H - 8, cap ? cap.getBoundingClientRect().top - o.top - 10 : g.H - 8);
      return { top, bottom };
    }, [g]);
    useEffect(() => {
      const el = topWorld.current, s = stageRef.current;
      if (!el || !g) return;
      const check = () => {
        const o = s.getBoundingClientRect(), hs = holes().concat(boxes(".town-caption, .town-ctl > *, .town-panel", 6), boxes(".town-tip, .town-peek", 4, true)), near = g.wide && api.t().z > 1.02, haze = GEO.haze[0] * g.H;
        [...el.querySelectorAll("[data-at], .town-batch")].forEach((n) => {
          const b2 = (n.querySelector(".town-pin-body, .town-node, .town-batch-card") || n).getBoundingClientRect(), x0 = b2.left - o.left, y0 = b2.top - o.top, x1 = b2.right - o.left, y1 = b2.bottom - o.top;
          const out = x1 < 4 || x0 > g.W - 4 || y1 < 4 || y0 > g.H - 4 || b2.width > 0 && (x0 < -6 || x1 > g.W + 6);
          const kept = n.querySelector(".town-node.now, .town-node.open, .town-pin.open");
          const under = !kept && hs.some((h) => x0 < h[2] && x1 > h[0] && y0 < h[3] && y1 > h[1]);
          n.classList.toggle("off", !kept && (out || under || near && (y0 + y1) / 2 < haze));
        });
      };
      check();
      const a = api.listen(check), b = api.listenView(check), t = setTimeout(check, 260);
      return () => {
        a();
        b();
        clearTimeout(t);
      };
    }, [g, api, holes, j.s, j.done, sel, hov, follow, peek]);
    const named = g && g.wide && (j.done || j.k < 0);
    const hint = g && (g.wide ? "Point at a place or an agent · drag to look round" : "Swipe to look round · tap a place");
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: cx("hero-scene town-stage", gl && "is-gl", ready && "ready"), ref: stageRef }, gl && g && /* @__PURE__ */ React.createElement(DepthPlate, { g, api, dark, reduce: j.reduce, map, stageRef, view, onReady: () => setReady(true), onFail: () => setGl(false) }), /* @__PURE__ */ React.createElement("div", { className: "town-world", ref: plateWorld, style: g ? { left: g.ox, top: g.oy, width: g.w, height: g.h } : { visibility: "hidden" } }, !gl && /* @__PURE__ */ React.createElement("img", { src: IMG + (dark ? "business-night.webp" : "business.webp"), width: GEO.nw, height: GEO.nh, draggable: "false", onLoad: () => {
      setReady(true);
      loaderSays("plateDrawn", dark);
    }, alt: "" })), !gl && g && g.wide && /* @__PURE__ */ React.createElement("div", { className: "town-haze", ref: hazeRef, "aria-hidden": "true" }), g && /* @__PURE__ */ React.createElement(Graph, { g, api, j, dark, focus, project, holes }), /* @__PURE__ */ React.createElement("div", { className: "town-world town-top", ref: topWorld, style: g ? { left: g.ox, top: g.oy, width: g.w, height: g.h } : { visibility: "hidden" } }, g && PLACES.map((p) => /* @__PURE__ */ React.createElement("span", { key: p.id, "data-at": JSON.stringify(placeAt(g, p.id)), className: "town-shift" }, /* @__PURE__ */ React.createElement(Pin, { p, g, j, sel, onOpen: open, hover: look, peek }))), g && AGENTS.map((a) => /* @__PURE__ */ React.createElement("span", { key: a.id, "data-at": JSON.stringify(GEO.posts[a.id]), className: "town-shift" }, /* @__PURE__ */ React.createElement(Node, { a, g, j, sel, onOpen: open, hover: look, peek, named: named && (!focus || focus.has(a.id)), tipped: tour === a.id }))), g && /* @__PURE__ */ React.createElement(Batch, { g, j })), g && /* @__PURE__ */ React.createElement(Tip, { g, j: { ...j, agent: tour }, api, project }), g && /* @__PURE__ */ React.createElement(
      Peek,
      {
        g,
        pk: peek,
        j,
        api,
        project,
        room,
        onOpen: (s) => open(s, { detail: 1 }),
        onClose: () => unlook(true),
        onEnter: () => clearTimeout(T.current.leave),
        onLeave: () => {
          if (!peekNow.current || !peekNow.current.pinned) {
            clearTimeout(T.current.leave);
            T.current.leave = setTimeout(() => unlook(false), 250);
          }
        }
      }
    ), /* @__PURE__ */ React.createElement("p", { className: "sr-only" }, dark ? "The whole business as a miniature town at night: the snack maker's factory and office, the distributor's godown, a lane of kirana shops, a highway to a buyer's warehouse, a food bank, and a fenced landfill, dark." : "The whole business as a miniature town in the morning: on the left the snack maker's factory and office, in the middle the distributor's godown full of cartons, on the right a lane of kirana shops hung with snack packets; behind them a highway to a buyer's warehouse in the next town, a food bank, and a fenced landfill, empty.")), /* @__PURE__ */ React.createElement(SrJourney, { j }), /* @__PURE__ */ React.createElement(Caption, { j, money, hint: j.done && !sel && !peek ? hint : null }), /* @__PURE__ */ React.createElement(AnimatePresence, null, sel && /* @__PURE__ */ React.createElement(Panel, { key: "panel", sel, j, onOpen: open, onClose: () => setSel(null) })), g && /* @__PURE__ */ React.createElement(Controls, { j, api, g, zoom, onWhole: whole, onReplay: replay, onPlay: play, onTake: take }));
  }
  window.SC3_TOWN = { Town };
})();

(function() {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Button, Kbd, Money, Mark, Wordmark, WorkspaceMark, PhoneFrame, WindowFrame, ThemeProvider, AppRoot, NoticeHost, useTheme, useApp, ModeMenuButton } = K;
  const { ACTS, SLOW, doneOf } = window.SC3_STORY;
  const WS = D.WORKSPACE;
  const img = (n) => window.SC3_IMG + n + ".webp";
  const TOKEN = { type: "spring", stiffness: 170, damping: 24, mass: 1 };
  const total = ACTS.reduce((t, a) => t + a.minutes, 0);
  const AI = Object.fromEntries(ACTS.map((a, i) => [a.id, i]));
  const LABEL = { priya: "Priya's", rakesh: "Rakesh bhai's", ganesh: "Ganesh ji's", agrawal: "Agrawal ji's", meera: "Meera's", "lakshmi-owner": "Lakshmi Agencies'", neha: "Neha's", "kirana-shubham-provision": "Shubham Provision's", "kirana-sri-lakshmi-ganapathi-kirana": "Sri Lakshmi Ganapathi Kirana's" };
  const PLACE = { priya: "Munchly Foods, Pune", rakesh: "Kalamna godown, Nagpur", ganesh: "Shree Ganesh Kirana, Itwari", agrawal: "Agrawal Wholesale, Raipur", meera: "Feeding India, Hyderabad", "lakshmi-owner": "Begum Bazaar godown, Hyderabad", neha: "Smart-Clearance, Bengaluru", "kirana-shubham-provision": "Dharampeth, Nagpur", "kirana-sri-lakshmi-ganapathi-kirana": "Begum Bazaar, Hyderabad" };
  const NEHA = { id: "neha", name: "Neha Kulkarni", short: "Neha", org: "Smart-Clearance", role: "Super admin" };
  const PREFILL = { priya: D.PEOPLE.priya.email, rakesh: D.PEOPLE.rakesh.phone.replace("+91 ", "") };
  const user = (id) => id === "neha" ? NEHA : Store.get().users.find((u) => u.id === id) || D.PEOPLE[id] || { id, name: id, short: id };
  const runActs = (acts) => (acts || []).forEach((a) => typeof a === "function" ? Store.update(a) : Flow.run(a[0], a[1]));
  function sceneOf(station, j) {
    Flow.Agents.setLive(false);
    const key = station.scenario || "chips";
    if (Flow.scenario() !== key) Flow.useScenario(key);
    Flow.fastForward(station.ff || 0);
    runActs(station.prep);
    station.beats.slice(0, j).forEach((b) => runActs(b.acts));
    Store.update((s) => s.notifications.forEach((n) => n.read = true));
  }
  const specsOf = (station, beat) => ({ desk: Object.assign({}, station.desk, beat.desk), phone: beat.phone === null ? null : station.phone === null && !beat.phone ? null : Object.assign({}, station.phone, beat.phone) });
  const tapOf = (station, beat) => {
    const sp = specsOf(station, beat);
    const f = beat.focus === "desk" ? sp.desk : sp.phone || sp.desk;
    return !!(f.lock && f.lock.push || f.signin);
  };
  function usePlayer(start, hold) {
    const s = S.useStore();
    const [pos, setPos] = useState(() => Object.assign({ a: 0, s: 0, b: 0 }, start));
    const [ran, setRan] = useState({});
    const [playing, setPlaying] = useState(false);
    const [end, setEnd] = useState(false);
    const act = ACTS[pos.a], station = act.stations[pos.s], n = station.beats.length;
    const complete = pos.b >= n;
    const beat = station.beats[Math.min(pos.b, n - 1)];
    const doneAt = useCallback((i) => {
      const b = station.beats[i];
      if (!b) return true;
      if (ran[i]) return true;
      const d = act.console ? null : doneOf(b, s);
      return d === true;
    }, [station, ran, s, act]);
    const go = useCallback((a, st, b) => {
      const S2 = ACTS[a].stations[st];
      if (!ACTS[a].console) sceneOf(S2, b || 0);
      setRan({});
      setEnd(false);
      setPos({ a, s: st, b: b || 0 });
    }, []);
    useEffect(() => {
      go(pos.a, pos.s, pos.b);
      return () => Flow.Agents.setLive(false);
    }, []);
    useEffect(() => {
      try {
        history.replaceState(null, "", "#at=" + [pos.a, pos.s, Math.min(pos.b, n - 1)].join("."));
      } catch (e) {
      }
    }, [pos.a, pos.s, pos.b]);
    const advance = useCallback(() => setPos((p) => Object.assign({}, p, { b: p.b + 1 })), []);
    const nextStation = useCallback(() => {
      if (pos.s + 1 < act.stations.length) go(pos.a, pos.s + 1, 0);
      else if (pos.a + 1 < ACTS.length) go(pos.a + 1, 0, 0);
      else {
        setPlaying(false);
        setEnd(true);
      }
    }, [pos, act, go]);
    const next = useCallback(() => {
      if (complete) {
        nextStation();
        return;
      }
      if (!doneAt(pos.b)) {
        if (!act.console) runActs(beat.acts);
        setRan((r) => Object.assign({}, r, { [pos.b]: true }));
      }
      advance();
    }, [complete, doneAt, pos, beat, act, advance, nextStation]);
    const tap = useCallback(() => {
      if (complete) return;
      setRan((r) => Object.assign({}, r, { [pos.b]: true }));
      advance();
    }, [complete, pos, advance]);
    const back = useCallback(() => {
      if (pos.b > 0) go(pos.a, pos.s, Math.min(pos.b, n) - 1);
      else if (pos.s > 0) go(pos.a, pos.s - 1, 0);
      else if (pos.a > 0) go(pos.a - 1, ACTS[pos.a - 1].stations.length - 1, 0);
    }, [pos, n, go]);
    const done = !complete && doneAt(pos.b);
    useEffect(() => {
      if (!done || hold) return;
      const t = setTimeout(advance, ran[pos.b] ? 0 : 700);
      return () => clearTimeout(t);
    }, [done, pos.a, pos.s, pos.b, hold]);
    useEffect(() => {
      if (complete || done || hold || !beat.agent || act.console) return;
      const t = setTimeout(() => {
        runActs(beat.acts);
        setRan((r) => Object.assign({}, r, { [pos.b]: true }));
      }, 1500);
      return () => clearTimeout(t);
    }, [pos.a, pos.s, pos.b, done, hold]);
    useEffect(() => {
      if (!playing || hold || end) return;
      if (complete) {
        const t2 = setTimeout(nextStation, 1900);
        return () => clearTimeout(t2);
      }
      if (done || beat.agent && !act.console) return;
      const t = setTimeout(next, act.console ? 2600 : beat.acts && beat.acts.length ? 2400 : 2300);
      return () => clearTimeout(t);
    }, [playing, hold, end, complete, done, pos.a, pos.s, pos.b, next, nextStation]);
    return { pos, act, station, beat, complete, end, ran, doneAt, go, next, back, tap, playing, setPlaying, setEnd };
  }
  function ConsoleScreen({ spec }) {
    const C = window.SC3_CONSOLE, P = window.SC3_PLATFORM;
    const raw = spec.console || "/overview";
    const [path, search] = raw.split("?");
    const key = `${raw}|${spec.scrollTo}|${!!spec.signin}`;
    const box = useRef(null);
    const [route, setRoute] = useState(() => C.routeOf("#" + path));
    useEffect(() => {
      const rq = new URLSearchParams(search || "").get("request");
      const r = rq && (P.get().requests || []).find((x) => x.id === rq);
      if (r) P.update((x) => {
        x.draft = { name: r.company, industry: r.makes, emailDomain: (r.email.split("@")[1] || "").toLowerCase(), adminName: r.name, adminEmail: r.email, plan: (P.PLANS.find((p) => p.name === r.plan) || P.PLANS[0]).id, request: r.id };
      });
      setRoute(C.routeOf("#" + path));
      const t = setTimeout(() => {
        const root = box.current;
        if (!root) return;
        const el = spec.scrollTo && [...root.querySelectorAll("h1, h2, h3, h4, .section-title, b, strong")].find((x) => x.textContent.trim().startsWith(spec.scrollTo));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else {
          const sc = root.querySelector(".scroll");
          sc && sc.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 700);
      return () => clearTimeout(t);
    }, [key]);
    if (!C) return null;
    return /* @__PURE__ */ React.createElement("div", { ref: box, className: "console-screen", style: { position: "absolute", inset: 0 } }, /* @__PURE__ */ React.createElement(AppRoot, { embedded: true, style: { position: "absolute", inset: 0 } }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(C.App, { key: spec.signin ? "in" : "app", route, go: (name, id, tab) => setRoute({ name, id, tab }), signIn: !!spec.signin, world: "demo" }))));
  }
  function DevLabel({ who, kind, focus, amber }) {
    const me = user(who);
    return /* @__PURE__ */ React.createElement("div", { className: cx("dev-label", focus && "focus", focus && amber && "amber") }, /* @__PURE__ */ React.createElement(Avatar, { person: me, size: "sm" }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, (LABEL[who] || me.short || me.name) + " " + kind), /* @__PURE__ */ React.createElement("span", null, PLACE[who] || me.org)));
  }
  function ConsoleDevice({ spec, width, height, scale, onSignIn }) {
    const url = "https://smartclearance-console.web.app" + (spec.signin ? "/sign-in" : spec.console === "/overview" ? "/" : spec.console);
    return /* @__PURE__ */ React.createElement("div", { className: "dev", style: { width: width * scale } }, /* @__PURE__ */ React.createElement(DevLabel, { who: "neha", kind: "laptop", focus: true }), /* @__PURE__ */ React.createElement("div", { className: "dev-ring on", style: { width: width * scale, height: height * scale, borderRadius: 14 * scale } }, /* @__PURE__ */ React.createElement("div", { style: { width, height, transform: `scale(${scale})`, transformOrigin: "top left" } }, /* @__PURE__ */ React.createElement(WindowFrame, { url, style: { width, height } }, /* @__PURE__ */ React.createElement("div", { className: "console-in-demo", style: { position: "absolute", inset: 0 } }, /* @__PURE__ */ React.createElement(ConsoleScreen, { spec, onSignIn }))))));
  }
  function Device({ kind, spec, time, date, scale = 1, width = 1280, height = 800, focus, amber, onTap }) {
    S.useStore();
    const ref = useRef(null);
    const key = `${spec.who}|${spec.route}|${JSON.stringify(spec.params || {})}`;
    const [route, setRoute] = useState({ name: spec.route, params: spec.params || {} });
    useEffect(() => setRoute({ name: spec.route, params: spec.params || {} }), [key]);
    const me = user(spec.who);
    useEffect(() => {
      if (!spec.anchor || spec.lock) return;
      const t = setTimeout(() => {
        const root = ref.current;
        if (!root) return;
        const el = root.querySelector(`[data-anchor="${spec.anchor}"]`);
        const sc = root.querySelector(".scroll");
        if (!el || !sc) return;
        const k = sc.getBoundingClientRect().height / (sc.clientHeight || 1) || 1;
        sc.scrollTo({ top: Math.max(0, (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) / k + sc.scrollTop - 64), behavior: "smooth" });
      }, 420);
      return () => clearTimeout(t);
    }, [spec.anchor, key, !!spec.lock]);
    const go = (r) => setRoute({ name: r.name, params: r.params || {} });
    const app = spec.lock ? /* @__PURE__ */ React.createElement(S.LockScreen, { who: spec.lock.who, push: spec.lock.push, time, date, onOpen: onTap }) : spec.signin ? /* @__PURE__ */ React.createElement(NoticeHost, { resetKey: "in-" + spec.who }, /* @__PURE__ */ React.createElement(S.SignIn, { guided: true, key: spec.signin, prefill: PREFILL[spec.signin], onSignIn: onTap })) : /* @__PURE__ */ React.createElement(NoticeHost, { resetKey: spec.who }, /* @__PURE__ */ React.createElement(S.RoleApp, { key, me, route, onGo: go, onBack: () => go({ name: S.HOME[me.role] }) }));
    if (kind === "bare") return /* @__PURE__ */ React.createElement(AppRoot, { embedded: true, className: "real-app", style: { "--safe-top": "calc(env(safe-area-inset-top, 0px) + 60px)" } }, /* @__PURE__ */ React.createElement("div", { ref, style: { position: "absolute", inset: 0 } }, app));
    const lbl = /* @__PURE__ */ React.createElement(DevLabel, { who: spec.who, kind: kind === "phone" ? "phone" : "laptop", focus, amber });
    if (kind === "phone") return /* @__PURE__ */ React.createElement("div", { className: "dev", style: { width: 414 * scale } }, lbl, /* @__PURE__ */ React.createElement("div", { className: cx("dev-ring", focus && "on", amber && "amber"), style: { width: 414 * scale, height: 868 * scale, borderRadius: 60 * scale } }, /* @__PURE__ */ React.createElement("div", { ref, style: { width: 414, height: 868, transform: `scale(${scale})`, transformOrigin: "top left" } }, /* @__PURE__ */ React.createElement(PhoneFrame, { time, dark: !!spec.lock }, app))));
    const path = spec.signin ? "sign-in" : [route.name || S.HOME[me.role], route.params && route.params.ref].filter(Boolean).join("/") + (route.params && route.params.tab ? "?tab=" + route.params.tab : route.params && route.params.reading ? "?reading=" + route.params.reading : "");
    const url = me.role === "buyer" ? "https://expiresoon.example/l/ES-24117" : `https://${WS.domain}/${path}`;
    return /* @__PURE__ */ React.createElement("div", { className: "dev", style: { width: width * scale } }, lbl, /* @__PURE__ */ React.createElement("div", { className: cx("dev-ring", focus && "on", amber && "amber"), style: { width: width * scale, height: height * scale, borderRadius: 14 * scale } }, /* @__PURE__ */ React.createElement("div", { ref, style: { width, height, transform: `scale(${scale})`, transformOrigin: "top left" } }, /* @__PURE__ */ React.createElement(WindowFrame, { url, style: { width, height } }, /* @__PURE__ */ React.createElement(AppRoot, { embedded: true, style: { position: "absolute", inset: 0 } }, app)))));
  }
  function useBeatEffects(p) {
    useEffect(() => {
      if (p.act.console || p.complete) return;
      const b = p.beat;
      if (!b.event && !b.click) return;
      const t = setTimeout(() => {
        if (b.event) window.dispatchEvent(new Event(b.event));
        if (b.click) {
          const el = [...document.querySelectorAll(".device-window button")].find((x) => x.textContent.trim() === b.click);
          el && el.click();
        }
      }, 900);
      return () => clearTimeout(t);
    }, [p.pos.a, p.pos.s, p.pos.b]);
  }
  function useSize(ref) {
    const [sz, set] = useState({ w: 0, h: 0 });
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const ro = new ResizeObserver(([e]) => set({ w: e.contentRect.width, h: e.contentRect.height }));
      ro.observe(el);
      return () => ro.disconnect();
    }, []);
    return sz;
  }
  function Stage({ p, size, phoneOnly, real }) {
    const { station, beat, act } = p;
    const W = size.w, H = size.h;
    const sp = specsOf(station, beat);
    const time = beat.time || "09:00", date = beat.date || station.date;
    const focus = p.complete ? null : beat.focus;
    if (real) {
      if (act.console) return /* @__PURE__ */ React.createElement("div", { className: "real-console" }, /* @__PURE__ */ React.createElement(ConsoleScreen, { spec: sp.desk, onSignIn: p.tap }));
      const spec = focus === "desk" ? sp.desk : sp.phone || sp.desk;
      return /* @__PURE__ */ React.createElement(Device, { kind: "bare", spec, time, date, onTap: p.tap });
    }
    if (!W || !H) return null;
    const labelH = 50;
    if (act.console) {
      const winW2 = 1440;
      const sw2 = Math.min(1, Math.max(0.3, Math.min((W - 8) / winW2, (H - labelH - 8) / 860)));
      return /* @__PURE__ */ React.createElement("div", { className: "devices" }, /* @__PURE__ */ React.createElement(ConsoleDevice, { spec: sp.desk, width: winW2, height: Math.max(720, (H - labelH - 8) / sw2), scale: sw2, onSignIn: p.tap }));
    }
    const ps = Math.min(0.84, Math.max(0.3, (H - labelH - 8) / 868));
    if (phoneOnly) {
      const spec = focus === "desk" ? sp.desk : sp.phone || sp.desk;
      return /* @__PURE__ */ React.createElement("div", { className: "devices" }, /* @__PURE__ */ React.createElement(Device, { kind: "phone", spec, time, date, scale: Math.min(1.04, ps * 1.18), focus: !!focus, amber: beat.human, onTap: p.tap }));
    }
    const hasPhone = !!sp.phone;
    const winW = 1280;
    const avail = W - (hasPhone ? 414 * ps + 40 : 0);
    const sw = Math.min(1, Math.max(0.3, avail / winW));
    const winH = Math.max(640, (H - labelH - 8) / sw);
    return /* @__PURE__ */ React.createElement("div", { className: "devices" }, /* @__PURE__ */ React.createElement(Device, { kind: "desk", spec: sp.desk, time, date, scale: sw, width: winW, height: winH, focus: focus === "desk", amber: focus === "desk" && beat.human, onTap: p.tap }), hasPhone && /* @__PURE__ */ React.createElement(Device, { kind: "phone", spec: sp.phone, time, date, scale: ps, focus: focus === "phone", amber: focus === "phone" && beat.human, onTap: p.tap }));
  }
  const I = [450, 380];
  const GEO = {
    console: { d: "M70 150 H390 L450 210 V380", st: [[70, 150], [150, 150], [230, 150], [310, 150], [390, 150], [450, 290]], side: ["up", "up", "up", "up", "up", "left"] },
    chips: { d: "M450 380 L570 260 H1156", st: [[600, 260], [660, 260], [720, 260], [780, 260], [840, 260], [900, 260], [966, 260], [1032, 260], [1098, 260]], side: "up", end: [1156, 260], out: [1174, 0, "start"] },
    slow: { d: "M900 260 L988 348 H1316", st: [[1020, 348], [1080, 348], [1140, 348], [1200, 348], [1260, 348]], side: "down", end: [1316, 348], out: [1330, 64, "end"] },
    mango: { d: "M450 380 L570 500 H1070", st: [[600, 500], [680, 500], [760, 500], [840, 500], [920, 500], [1e3, 500]], side: "down", end: [1070, 500], out: [1088, 0, "start"] }
  };
  const SHORT = { "Munchly's setup": "Setup", "Agent setup": "Agents", "Existing clients": "Clients", "A new client": "New client", "Expiry day": "Expiry", "The second yes": "Yes" };
  const short = (t) => SHORT[t] || t;
  const BADGE = { console: "Smart-Clearance's console", chips: "every pack sold", slow: "destroyed at the godown, on a second yes", mango: "kiranas, a staff sale, a food bank" };
  const OUT = { chips: "every pack sold", slow: `${SLOW.left} destroyed, on a yes`, mango: `${D.MANGO_FB} meals · all placed` };
  const lineName = (a) => a.title + (a.id === "slow" ? " · a slow week" : "");
  const BLOCKS = [];
  [[752, 66, 3, 2], [1148, 64, 4, 2], [70, 446, 2, 2], [70, 570, 3, 1], [640, 300, 3, 2], [1206, 560, 3, 2]].forEach(([x0, y0, c, r]) => {
    for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) BLOCKS.push([x0 + i * 62, y0 + j * 46]);
  });
  const toneOf = (st) => st.id === "expiry" ? "red" : st.amber ? "amber" : null;
  function RouteMap({ active, hot, setHot, pos, onPick, draw, compact }) {
    const reduce = useReducedMotion();
    const animate = draw && !reduce;
    const uid = "rm" + React.useId().replace(/:/g, "");
    const lit = (id) => id === active || id === hot || (id === "chips" && (active === "slow" || hot === "slow") ? "shared" : false);
    const stateOf = (ai, si) => pos ? ai < pos.a || ai === pos.a && si < pos.s ? "done" : ai === pos.a && si === pos.s ? "now" : null : null;
    const order = ["console", "mango", "chips", "slow"];
    const draws = (k) => animate ? { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.9, delay: 0.12 * k, ease: [0.22, 1, 0.36, 1] } } : { initial: false, animate: { pathLength: 1 } };
    return /* @__PURE__ */ React.createElement("svg", { className: cx("rb-map", compact && "compact"), viewBox: "40 36 1380 640", role: "group", "aria-label": "The demo's route map: the platform's line into Munchly's workspace, then three journeys" }, /* @__PURE__ */ React.createElement("g", { className: "rb-plate", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: uid + "d", width: "22", height: "22", patternUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("circle", { cx: "2", cy: "2", r: "1.3", className: "rb-dot" })), /* @__PURE__ */ React.createElement("clipPath", { id: uid + "c" }, /* @__PURE__ */ React.createElement("rect", { x: "44", y: "40", width: "1372", height: "632", rx: "36" }))), /* @__PURE__ */ React.createElement("rect", { x: "44", y: "40", width: "1372", height: "632", rx: "36", className: "rb-ground" }), /* @__PURE__ */ React.createElement("g", { clipPath: `url(#${uid}c)` }, /* @__PURE__ */ React.createElement("rect", { x: "44", y: "40", width: "1372", height: "632", fill: `url(#${uid}d)`, className: "rb-dots" }), BLOCKS.map(([x, y], i) => /* @__PURE__ */ React.createElement("rect", { key: i, x, y, width: "54", height: "38", rx: "9", className: "rb-block" })), /* @__PURE__ */ React.createElement("path", { d: "M20 612 C 300 548, 520 694, 772 604 S 1180 492, 1440 528", className: "rb-water" }))), order.map((id, k) => {
      const on = lit(id) === true;
      return /* @__PURE__ */ React.createElement("g", { key: id, onMouseEnter: () => setHot && setHot(id), onMouseLeave: () => setHot && setHot(null) }, /* @__PURE__ */ React.createElement(motion.path, { d: GEO[id].d, className: cx("rb-line-road", on && "on"), ...draws(k) }), /* @__PURE__ */ React.createElement(motion.path, { d: GEO[id].d, className: cx("rb-line-shadow", on && "on"), ...draws(k) }), /* @__PURE__ */ React.createElement(motion.path, { d: GEO[id].d, className: cx("rb-line", on && "on"), ...draws(k) }));
    }), lit("chips") === "shared" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M450 380 L570 260 H900", className: "rb-line-road on" }), /* @__PURE__ */ React.createElement("path", { d: "M450 380 L570 260 H900", className: "rb-line on" })), ["console", "chips", "slow", "mango"].map((id) => {
      const a = ACTS[AI[id]];
      const g = GEO[id];
      return a.stations.map((st, si) => {
        const [x, y] = g.st[si];
        const side = Array.isArray(g.side) ? g.side[si] : g.side;
        const s = stateOf(AI[id], si);
        const tone = toneOf(st);
        const ly = side === "up" ? y - 23 : side === "down" ? y + 35 : y + 5;
        const lx = side === "left" ? x - 18 : x;
        const on = lit(id) === true || id === "chips" && lit("chips") === "shared" && si <= 5;
        return /* @__PURE__ */ React.createElement(
          "g",
          {
            key: id + st.id,
            className: cx("rb-st", on && "on", s, tone),
            role: "button",
            tabIndex: compact ? -1 : 0,
            "aria-label": `${lineName(a)}: ${st.title}`,
            onClick: () => onPick && onPick(AI[id], si),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick && onPick(AI[id], si);
              }
            },
            onFocus: () => setHot && setHot(id),
            onBlur: () => setHot && setHot(null)
          },
          /* @__PURE__ */ React.createElement(motion.circle, { cx: x, cy: y, r: 9, initial: animate ? { scale: 0, opacity: 0 } : false, animate: { scale: 1, opacity: 1 }, transition: { delay: 0.5 + 0.12 * order.indexOf(id) + si * 0.03, duration: 0.24 }, style: { transformOrigin: `${x}px ${y}px` } }),
          s === "done" && /* @__PURE__ */ React.createElement("path", { d: `M${x - 4} ${y} l3 3 l5 -6`, className: "rb-tick" }),
          !compact && /* @__PURE__ */ React.createElement("text", { x: lx, y: ly, textAnchor: side === "left" ? "end" : "middle", className: "rb-lbl" }, short(st.title))
        );
      });
    }), /* @__PURE__ */ React.createElement("g", { className: "rb-hub" }, /* @__PURE__ */ React.createElement("circle", { cx: I[0], cy: I[1], r: 24 }), /* @__PURE__ */ React.createElement("foreignObject", { x: I[0] - 14, y: I[1] - 14, width: 28, height: 28 }, /* @__PURE__ */ React.createElement("div", { className: "rb-hub-mark" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 28 }))), !compact && /* @__PURE__ */ React.createElement("text", { x: I[0] - 34, y: I[1] + 5, textAnchor: "end", className: "rb-lbl strong" }, "Munchly's workspace")), !compact && ["chips", "slow", "mango"].map((id, k) => {
      const a = ACTS[AI[id]];
      const [x, y] = GEO[id].end;
      const [ox, dy, anchor] = GEO[id].out;
      return /* @__PURE__ */ React.createElement(motion.g, { key: id, className: cx("rb-end", a.outcome.red && "red", lit(id) === true && "on"), initial: animate ? { opacity: 0, y: 6 } : false, animate: { opacity: 1, y: 0 }, transition: { delay: 1.1 + 0.12 * k, duration: 0.42 } }, /* @__PURE__ */ React.createElement("circle", { cx: x, cy: y, r: 11, className: "rb-pin" }), animate && /* @__PURE__ */ React.createElement(motion.circle, { cx: x, cy: y, r: 11, className: "rb-ping", initial: { scale: 1, opacity: 0.6 }, animate: { scale: 2.4, opacity: 0 }, transition: { delay: 1.3 + 0.12 * k, duration: 1.1, repeat: 1 }, style: { transformOrigin: `${x}px ${y}px` } }), /* @__PURE__ */ React.createElement("text", { x: ox, y: y + dy + 9, textAnchor: anchor, className: "rb-out" }, fmt.inr(a.outcome.value)), /* @__PURE__ */ React.createElement("text", { x: ox, y: y + dy + 28, textAnchor: anchor, className: "rb-out-sub" }, OUT[id]));
    }), !compact && [["console", 56, 46], ["chips", 588, 152], ["slow", 790, 400], ["mango", 588, 558]].map(([id, x, y]) => {
      const a = ACTS[AI[id]];
      return /* @__PURE__ */ React.createElement("foreignObject", { key: id, x: x - 10, y: y - 10, width: 380, height: 76 }, /* @__PURE__ */ React.createElement("div", { className: "rb-badge-pad" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("rb-badge", lit(id) === true && "on"), onMouseEnter: () => setHot && setHot(id), onMouseLeave: () => setHot && setHot(null), onFocus: () => setHot && setHot(id), onBlur: () => setHot && setHot(null), onClick: () => onPick && onPick(AI[id], 0) }, a.console ? /* @__PURE__ */ React.createElement("span", { className: "rb-badge-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 18 })) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "rb-badge-t" }, /* @__PURE__ */ React.createElement("b", null, lineName(a)), /* @__PURE__ */ React.createElement("span", null, BADGE[id], " · ", a.minutes, " min")))));
    }), pos && (() => {
      const a = ACTS[pos.a];
      const [x, y] = GEO[a.id].st[pos.s];
      return /* @__PURE__ */ React.createElement(motion.g, { className: "rb-token", initial: false, animate: { x, y }, transition: reduce ? { duration: 0 } : TOKEN, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("circle", { r: 17 }), /* @__PURE__ */ React.createElement("foreignObject", { x: -13, y: -13, width: 26, height: 26 }, /* @__PURE__ */ React.createElement("div", { className: "rb-token-in" }, a.console ? /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 15 }) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }))));
    })());
  }
  function PhoneLines({ onPick }) {
    return /* @__PURE__ */ React.createElement("ol", { className: "rb-plines", "aria-label": "The lines" }, ["console", "chips", "slow", "mango"].map((id) => {
      const a = ACTS[AI[id]];
      return /* @__PURE__ */ React.createElement("li", { key: id, className: cx("rb-pline", id === "slow" && "branch") }, id === "slow" && /* @__PURE__ */ React.createElement("svg", { className: "rb-pline-branch", viewBox: "0 0 16 40", preserveAspectRatio: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M4 0 V28 Q4 38 14 38", vectorEffect: "non-scaling-stroke" })), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => onPick(AI[id], 0), className: "rb-pline-btn" }, /* @__PURE__ */ React.createElement("span", { className: "rb-pline-head" }, a.console ? /* @__PURE__ */ React.createElement("span", { className: "rb-badge-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 18 })) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "rb-badge-t" }, /* @__PURE__ */ React.createElement("b", null, lineName(a)), /* @__PURE__ */ React.createElement("span", null, id === "slow" ? "branches off the chips after the yes" : BADGE[id], " · ", a.minutes, " min"))), /* @__PURE__ */ React.createElement("span", { className: "rb-pline-rail", "aria-hidden": "true" }, a.stations.map((st) => /* @__PURE__ */ React.createElement("i", { key: st.id, className: toneOf(st) || "" })), /* @__PURE__ */ React.createElement("em", { className: a.outcome.red ? "red" : "" })), /* @__PURE__ */ React.createElement("span", { className: "rb-pline-out" }, a.outcome.value != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, fmt.inr(a.outcome.value)), " · ", OUT[id]) : "Ends at Munchly's workspace")));
    }));
  }
  function Start({ onPick, onAll }) {
    const [hot, setHot] = useState(null);
    const reduce = useReducedMotion();
    const app = useApp();
    const h = hot && ACTS[AI[hot]];
    return /* @__PURE__ */ React.createElement("div", { className: "rb-start" }, /* @__PURE__ */ React.createElement("div", { className: "rb-intro" }, /* @__PURE__ */ React.createElement("div", { className: "rb-intro-l" }, /* @__PURE__ */ React.createElement("span", { className: "rb-eyebrow" }, "Guided demo · about ", total, " minutes"), /* @__PURE__ */ React.createElement("h1", { className: "rb-title" }, "Three batches. Three endings.")), /* @__PURE__ */ React.createElement("div", { className: "rb-intro-r" }, /* @__PURE__ */ React.createElement("p", { className: "rb-lede" }, "The platform sets Munchly Foods up. Then a batch of chips sells out, a batch of Mango Drink feeds Hyderabad, and a slow week ends at the bin, on a second yes. Every screen is the real app, on sample data."), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 18, alignItems: "center" } }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "play", onClick: onAll }, "Play the whole route"), /* @__PURE__ */ React.createElement("ul", { className: "rb-legend", "aria-label": "How to read the map" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "lg-green" }), "The agents' work"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "lg-amber" }), "A person's yes"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "lg-red" }), "The bin"))))), app.w < 768 ? /* @__PURE__ */ React.createElement(PhoneLines, { onPick }) : /* @__PURE__ */ React.createElement("div", { className: "rb-mapwrap" }, /* @__PURE__ */ React.createElement(RouteMap, { hot, setHot, onPick, draw: true }), /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, h && /* @__PURE__ */ React.createElement(motion.div, { key: h.id, className: "rb-peek", initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.18 } }, /* @__PURE__ */ React.createElement("b", null, lineName(h)), /* @__PURE__ */ React.createElement("span", null, h.place), /* @__PURE__ */ React.createElement("span", { className: "rb-peek-screens" }, [...new Set(h.stations.flatMap((s) => s.beats.map((b) => b.screen.split(" · ")[0])).filter((x) => !/Lock screen|Sign-in/.test(x)))].slice(0, 8).join(" · "))))));
  }
  function Strip({ p, onMap }) {
    const reduce = useReducedMotion();
    const a = p.act;
    const n = a.stations.length;
    const nb = p.station.beats.length;
    const along = Math.min(n - 1, p.pos.s + Math.min(1, p.pos.b / nb));
    return /* @__PURE__ */ React.createElement("div", { className: "rb-strip" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "rb-mapbtn", onClick: onMap, "aria-label": "Open the route map", "aria-keyshortcuts": "M" }, /* @__PURE__ */ React.createElement(Icon, { name: "map", size: 18 }), /* @__PURE__ */ React.createElement("span", null, "Map")), /* @__PURE__ */ React.createElement("span", { className: "rb-strip-line" }, a.console ? /* @__PURE__ */ React.createElement("span", { className: "rb-badge-ic sm" }, /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 14 })) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "rb-strip-t" }, /* @__PURE__ */ React.createElement("b", null, lineName(a)), /* @__PURE__ */ React.createElement("span", null, p.station.title, " · ", p.pos.s + 1, " of ", n))), /* @__PURE__ */ React.createElement("ol", { className: "rb-stops", style: { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, "--n": n }, "aria-label": "Stations on this line" }, /* @__PURE__ */ React.createElement("span", { className: "rb-track", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { style: { transform: `scaleX(${n > 1 ? along / (n - 1) : 1})` } })), a.stations.map((st, i) => {
      const s2 = i < p.pos.s ? "done" : i === p.pos.s ? "now" : "";
      return /* @__PURE__ */ React.createElement("li", { key: st.id, className: cx("rb-stop", s2, toneOf(st)) }, /* @__PURE__ */ React.createElement("button", { type: "button", title: st.title, onClick: () => p.go(p.pos.a, i, 0), "aria-current": s2 === "now" ? "step" : void 0, "aria-label": `${st.title}${s2 === "done" ? ", done" : ""}` }, /* @__PURE__ */ React.createElement("span", { className: "rb-dot" }, s2 === "done" ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 11, stroke: 3 }) : null, s2 === "now" && /* @__PURE__ */ React.createElement(motion.span, { layoutId: "rb-token", className: "rb-tok", transition: reduce ? { duration: 0 } : TOKEN }, a.console ? /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 13 }) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" })))));
    })), /* @__PURE__ */ React.createElement("span", { className: "rb-out-mini" }, a.outcome.value != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, "ends at"), /* @__PURE__ */ React.createElement("b", null, fmt.inr(a.outcome.value))) : /* @__PURE__ */ React.createElement("span", null, "ends at Munchly's workspace")));
  }
  function Figures({ figs }) {
    return /* @__PURE__ */ React.createElement("div", { className: "figs" }, figs.map((f) => /* @__PURE__ */ React.createElement("div", { key: f.label, className: "fig" }, /* @__PURE__ */ React.createElement("span", { className: "fig-label" }, f.label), f.count ? /* @__PURE__ */ React.createElement("span", { className: "num m", style: { color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" } }, fmt.num(f.value)) : /* @__PURE__ */ React.createElement(Money, { value: f.value, size: "m", decimals: f.decimals, roll: true, style: { color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" } }))));
  }
  function Notes({ p, compact }) {
    const { act, station, pos } = p;
    const nb = station.beats.length;
    const last = pos.s === act.stations.length - 1;
    const nextLabel = p.complete ? last ? pos.a + 1 < ACTS.length ? "Next line · " + lineName(ACTS[pos.a + 1]) : "The end" : "Next · " + act.stations[pos.s + 1].title : p.beat.agent && !act.console ? "Skip ahead" : "Next";
    return /* @__PURE__ */ React.createElement("aside", { className: cx("narr rb-card", compact && "compact"), "aria-label": "Narration" }, /* @__PURE__ */ React.createElement("div", { className: "narr-scroll", ...compact ? {} : { tabIndex: 0, role: "region", "aria-label": "Station notes" } }, /* @__PURE__ */ React.createElement("div", { className: "rb-card-head" }, /* @__PURE__ */ React.createElement("span", { className: cx("rb-card-n", toneOf(station)) }, pos.s + 1), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("h2", { className: "narr-title" }, station.title), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, lineName(act), " · ", station.date))), /* @__PURE__ */ React.createElement("div", { className: "rb-onscreen" }, /* @__PURE__ */ React.createElement("span", null, "On screen"), /* @__PURE__ */ React.createElement("b", null, p.beat.screen)), station.figures && /* @__PURE__ */ React.createElement(Figures, { figs: station.figures }), /* @__PURE__ */ React.createElement("ol", { className: "beats" }, station.beats.map((b, i) => {
      const done = i < pos.b;
      const now = i === pos.b;
      const working = b.agent && !act.console;
      return /* @__PURE__ */ React.createElement("li", { key: i, className: cx("beat", done && "done", now && "now", b.human && "human") }, /* @__PURE__ */ React.createElement("span", { className: "beat-dot" }, done ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 3 }) : now && working ? /* @__PURE__ */ React.createElement("span", { className: "beat-aura" }) : null), /* @__PURE__ */ React.createElement("span", { className: "beat-body" }, /* @__PURE__ */ React.createElement("span", { className: "beat-who" }, b.agent ? b.agent + " agent" : user(b.who).short, b.time ? " · " + (b.date ? b.date.split(" ")[0] + " " : "") + b.time : ""), /* @__PURE__ */ React.createElement("span", null, b.text), now && !working && /* @__PURE__ */ React.createElement("span", { className: "beat-hint" }, /* @__PURE__ */ React.createElement(Icon, { name: "hand", size: 13 }), act.console ? "Look in the console" : tapOf(station, b) ? "Tap it in the device" : "Their move: in the device", ", or press ", /* @__PURE__ */ React.createElement(Kbd, null, "→")), now && working && /* @__PURE__ */ React.createElement("span", { className: "beat-hint" }, /* @__PURE__ */ React.createElement("span", { className: "typing" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), "working")));
    }))), /* @__PURE__ */ React.createElement("div", { className: "narr-ctrl" }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "chevron-left", onClick: p.back, disabled: pos.a === 0 && pos.s === 0 && pos.b === 0, "aria-label": "Back" }, "Back"), /* @__PURE__ */ React.createElement(Button, { variant: !p.complete && p.beat.human ? "approve" : "primary", iconRight: "arrow-right", block: true, onClick: p.next }, nextLabel)));
  }
  function MapOver({ p, onPick, onClose, hop }) {
    const reduce = useReducedMotion();
    const ref = useRef(null);
    useEffect(() => {
      const f = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", f);
      const prev = document.activeElement;
      ref.current && ref.current.querySelector("button").focus();
      return () => {
        window.removeEventListener("keydown", f);
        prev && prev.focus && prev.focus();
      };
    }, []);
    return /* @__PURE__ */ React.createElement(motion.div, { ref, className: "rb-over", role: "dialog", "aria-modal": "true", "aria-label": "The route map", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: reduce ? 0 : 0.24 } }, /* @__PURE__ */ React.createElement("div", { className: "rb-over-in" }, /* @__PURE__ */ React.createElement("div", { className: "rb-over-head" }, /* @__PURE__ */ React.createElement("div", { className: "rb-over-copy" }, hop && /* @__PURE__ */ React.createElement("span", { className: "rb-eyebrow" }, "Next line"), /* @__PURE__ */ React.createElement("h2", { className: "rb-over-title" }, hop ? /* @__PURE__ */ React.createElement(React.Fragment, null, lineName(p.act), /* @__PURE__ */ React.createElement("span", null, " · ", p.act.place)) : "The route")), /* @__PURE__ */ React.createElement(IconButton, { icon: "x", label: "Close the map", onClick: onClose })), /* @__PURE__ */ React.createElement("div", { className: "rb-over-map" }, /* @__PURE__ */ React.createElement(RouteMap, { active: p.act.id, pos: p.pos, onPick: (a, s) => {
      onPick(a, s);
      onClose();
    } }))));
  }
  function End({ onRestart, onClose }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement(motion.div, { className: "finale rb-end", role: "dialog", "aria-modal": "true", "aria-label": "The end of the route", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "finale-in" }, /* @__PURE__ */ React.createElement(Mark, { size: 56, play: !reduce }), /* @__PURE__ */ React.createElement("span", { className: "finale-ws" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 22 }), /* @__PURE__ */ React.createElement("span", null, WS.name, " · ", WS.domain)), /* @__PURE__ */ React.createElement("h2", { className: "finale-title" }, "Three batches, three endings"), /* @__PURE__ */ React.createElement("p", { className: "finale-hi hi", lang: "hi" }, "हर कार्टन को दूसरा मौका"), /* @__PURE__ */ React.createElement("div", { className: "rb-ends" }, ["chips", "mango", "slow"].map((id, k) => {
      const a = ACTS[AI[id]];
      return /* @__PURE__ */ React.createElement(motion.div, { key: id, className: cx("rb-endcard", a.outcome.red && "red"), initial: reduce ? false : { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 + k * 0.12 } }, /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), /* @__PURE__ */ React.createElement("b", null, lineName(a)), /* @__PURE__ */ React.createElement(Money, { value: a.outcome.value, roll: true, from: 0, size: "l", style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", null, a.outcome.line));
    })), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10, justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "rotate-ccw", onClick: onRestart }, "Ride it again"), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", onClick: onClose }, "Stay on the last stop"))));
  }
  function Director({ start, autoplay, onHome }) {
    const [map, setMap] = useState(null);
    const [phoneOnly, setPhoneOnly] = useState(false);
    const [notes, setNotes] = useState(true);
    const p = usePlayer(start, !!map);
    useBeatEffects(p);
    const app = useApp();
    const canvas = useRef(null);
    const size = useSize(canvas);
    const shell = useRef(null);
    useEffect(() => {
      if (autoplay) p.setPlaying(true);
    }, []);
    const prevA = useRef(p.pos.a);
    useEffect(() => {
      if (p.pos.a !== prevA.current) {
        prevA.current = p.pos.a;
        setMap("hop");
      }
    }, [p.pos.a]);
    useEffect(() => {
      if (map !== "hop" || !p.playing) return;
      const t = setTimeout(() => setMap(null), 2600);
      return () => clearTimeout(t);
    }, [map, p.playing]);
    useEffect(() => {
      const f = (e) => {
        if (map || e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
        if (e.key === "ArrowRight" || e.key === "PageDown") {
          e.preventDefault();
          p.next();
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          p.back();
        } else if (e.key === "m" || e.key === "M") setMap("map");
        else if (e.key === "p" || e.key === "P") setPhoneOnly((v) => !v);
        else if (e.key === "n" || e.key === "N") setNotes((v) => !v);
      };
      window.addEventListener("keydown", f);
      return () => window.removeEventListener("keydown", f);
    });
    const dialog = !!map || p.end;
    useEffect(() => {
      const el = shell.current;
      if (!el || !dialog) return;
      const behind = [...el.children].filter((c) => !c.classList.contains("rb-over") && !c.classList.contains("finale"));
      behind.forEach((c) => c.setAttribute("inert", ""));
      return () => behind.forEach((c) => c.removeAttribute("inert"));
    }, [dialog]);
    const overlays = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(AnimatePresence, null, map && /* @__PURE__ */ React.createElement(MapOver, { p, hop: map === "hop", onPick: (a, s) => p.go(a, s, 0), onClose: () => setMap(null) })), /* @__PURE__ */ React.createElement(AnimatePresence, null, p.end && /* @__PURE__ */ React.createElement(End, { onRestart: () => p.go(0, 0, 0), onClose: () => p.setEnd(false) })));
    if (app.w < 768) return /* @__PURE__ */ React.createElement("div", { className: "demo-real rb-real", ref: shell }, /* @__PURE__ */ React.createElement("div", { className: "real-bar" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "iconbtn", "aria-label": "Back", onClick: p.back }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 22 })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "real-stage", onClick: () => setNotes((v) => !v), "aria-label": "Station notes" }, /* @__PURE__ */ React.createElement("span", { className: cx("rb-card-n sm", toneOf(p.station)) }, p.pos.s + 1), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, lineName(p.act), " · ", p.station.title), /* @__PURE__ */ React.createElement("span", null, p.complete ? "Station done" : p.beat.text))), /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("iconbtn real-next", !p.complete && p.beat.human && "amber"), "aria-label": "Next", onClick: p.next }, /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 22 }))), /* @__PURE__ */ React.createElement(Stage, { p, size, real: true }), /* @__PURE__ */ React.createElement(K.Sheet, { open: notes, onClose: () => setNotes(false), title: `${lineName(p.act)} · ${p.station.title}`, detent: "medium" }, /* @__PURE__ */ React.createElement(Notes, { p, compact: true }), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8, marginTop: 12 } }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "map", onClick: () => {
      setNotes(false);
      setMap("map");
    } }, "The route map"), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "layout-grid", onClick: onHome }, "All lines"))), overlays);
    return /* @__PURE__ */ React.createElement("div", { className: cx("demo rb-demo", !notes && "no-notes"), ref: shell }, /* @__PURE__ */ React.createElement("header", { className: "demo-top rb-top" }, /* @__PURE__ */ React.createElement("span", { className: "row tight demo-brand" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "rb-home", onClick: onHome, "aria-label": "Back to the route map" }, /* @__PURE__ */ React.createElement(Mark, { size: 30 })), /* @__PURE__ */ React.createElement(Wordmark, { size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "demo-tag" }, "Guided demo")), /* @__PURE__ */ React.createElement(Strip, { p, onMap: () => setMap("map") }), /* @__PURE__ */ React.createElement("span", { className: "row tight demo-tools" }, /* @__PURE__ */ React.createElement(IconButton, { icon: p.playing ? "pause" : "play", label: p.playing ? "Pause" : "Play the route", onClick: () => p.setPlaying(!p.playing) }), /* @__PURE__ */ React.createElement(IconButton, { icon: phoneOnly ? "monitor" : "smartphone", label: phoneOnly ? "Laptop and phone" : "Phone only", onClick: () => setPhoneOnly((v) => !v) }), /* @__PURE__ */ React.createElement(IconButton, { icon: "presentation", label: notes ? "Hide notes" : "Show notes", onClick: () => setNotes((v) => !v) }), /* @__PURE__ */ React.createElement(ModeMenuButton, null))), /* @__PURE__ */ React.createElement("div", { className: "demo-body" }, notes && /* @__PURE__ */ React.createElement(Notes, { p }), /* @__PURE__ */ React.createElement("main", { className: "demo-canvas", ref: canvas }, /* @__PURE__ */ React.createElement(Stage, { p, size, phoneOnly }))), overlays);
  }
  function startOf() {
    const h = location.hash;
    let m = /at=(\d+)\.(\d+)\.(\d+)/.exec(h);
    if (m) {
      const a = Math.min(ACTS.length - 1, +m[1]);
      const st = Math.min(ACTS[a].stations.length - 1, +m[2]);
      return { a, s: st, b: Math.min(ACTS[a].stations[st].beats.length - 1, +m[3]) };
    }
    m = /stage=(\d)/.exec(h);
    if (m) return { a: AI.chips, s: Math.min(8, Math.max(0, +m[1] - 1)), b: 0 };
    return null;
  }
  function App() {
    const [start, setStart] = useState(startOf);
    const [auto, setAuto] = useState(false);
    if (!start) return /* @__PURE__ */ React.createElement("div", { className: "demo rb-shell" }, /* @__PURE__ */ React.createElement("header", { className: "demo-top rb-top" }, /* @__PURE__ */ React.createElement("span", { className: "row tight demo-brand" }, /* @__PURE__ */ React.createElement(Mark, { size: 30 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "demo-tag" }, "Guided demo")), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", { className: "row tight demo-tools" }, /* @__PURE__ */ React.createElement(ModeMenuButton, null))), /* @__PURE__ */ React.createElement("main", { className: "rb-startwrap" }, /* @__PURE__ */ React.createElement(Start, { onPick: (a, s) => {
      setAuto(false);
      setStart({ a, s, b: 0 });
    }, onAll: () => {
      setAuto(true);
      setStart({ a: 0, s: 0, b: 0 });
    } })));
    return /* @__PURE__ */ React.createElement(Director, { key: JSON.stringify(start), start, autoplay: auto, onHome: () => {
      try {
        history.replaceState(null, "", location.pathname + location.search);
      } catch (e) {
      }
      setStart(null);
    } });
  }
  function Root() {
    return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "demo-root", style: { position: "fixed", inset: 0 } }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(App, null))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
})();

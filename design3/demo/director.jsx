// Smart-Clearance v3 · the guided demo (SC-167, option B, the route map): the platform's console, then three journeys
// in Munchly Foods' workspace (the chips sold through, the Mango Drink sold through, the chips' slow week destroyed at
// the godown on a second yes), drawn as lines on a route map. Playing, the map folds into a strip over the stage and
// the batch travels it as a token; a laptop and a phone run the real screens on the stub (the console on its own demo
// world), the station's notes beside them. The agents' beats run on their own; a person's beat waits for the visitor's
// tap in the device, or Next. Nothing is kept between visits.
(function () {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Button, Kbd, Money, Mark, Wordmark, WorkspaceMark, PhoneFrame, WindowFrame, ThemeProvider, AppRoot, NoticeHost, useTheme, useApp, ModeMenuButton } = K;
  const { ACTS, SLOW, doneOf } = window.SC3_STORY;
  const WS = D.WORKSPACE; const img = n => window.SC3_IMG + n + ".webp";
  const TOKEN = { type: "spring", stiffness: 170, damping: 24, mass: 1 }; // the console's token spring (SC-49)
  const total = ACTS.reduce((t, a) => t + a.minutes, 0);
  const AI = Object.fromEntries(ACTS.map((a, i) => [a.id, i]));

  /* ---------- the people on the devices ---------- */
  const LABEL = { priya: "Priya's", rakesh: "Rakesh bhai's", ganesh: "Ganesh ji's", agrawal: "Agrawal ji's", meera: "Meera's", "lakshmi-owner": "Lakshmi Agencies'", neha: "Neha's", "kirana-shubham-provision": "Shubham Provision's", "kirana-sri-lakshmi-ganapathi-kirana": "Sri Lakshmi Ganapathi Kirana's" };
  const PLACE = { priya: "Munchly Foods, Pune", rakesh: "Kalamna godown, Nagpur", ganesh: "Shree Ganesh Kirana, Itwari", agrawal: "Agrawal Wholesale, Raipur", meera: "Feeding India, Hyderabad", "lakshmi-owner": "Begum Bazaar godown, Hyderabad", neha: "Smart-Clearance, Bengaluru", "kirana-shubham-provision": "Dharampeth, Nagpur", "kirana-sri-lakshmi-ganapathi-kirana": "Begum Bazaar, Hyderabad" };
  const NEHA = { id: "neha", name: "Neha Kulkarni", short: "Neha", org: "Smart-Clearance", role: "Super admin" };
  const PREFILL = { priya: D.PEOPLE.priya.email, rakesh: D.PEOPLE.rakesh.phone.replace("+91 ", "") };
  // someone in the journey's store (with their role and sign-in), or in the story
  const user = id => (id === "neha" ? NEHA : Store.get().users.find(u => u.id === id) || D.PEOPLE[id] || { id, name: id, short: id });

  /* ---------- the store for a beat: where its station starts, and what the beats before it did ---------- */
  const runActs = acts => (acts || []).forEach(a => (typeof a === "function" ? Store.update(a) : Flow.run(a[0], a[1])));
  function sceneOf(station, j) {
    Flow.Agents.setLive(false);
    // the journey this station plays (SC-168: the chips, the Mango Drink, the slow week), then the stage it starts from
    const key = station.scenario || "chips"; if (Flow.scenario() !== key) Flow.useScenario(key);
    Flow.fastForward(station.ff || 0);
    runActs(station.prep);
    station.beats.slice(0, j).forEach(b => runActs(b.acts));
    Store.update(s => s.notifications.forEach(n => (n.read = true)));
  }
  const specsOf = (station, beat) => ({ desk: Object.assign({}, station.desk, beat.desk), phone: beat.phone === null ? null : station.phone === null && !beat.phone ? null : Object.assign({}, station.phone, beat.phone) });
  // a beat the visitor ticks in a device: a push on a lock screen, or a sign-in
  const tapOf = (station, beat) => { const sp = specsOf(station, beat); const f = beat.focus === "desk" ? sp.desk : sp.phone || sp.desk; return !!((f.lock && f.lock.push) || f.signin); };

  /* ---------- the player: where the story is, Next and Back, the agents' own beats, autoplay ---------- */
  // pos = { a: act, s: station, b: beat (b = the station's length once every beat is done) }; ran: the beats the
  // director has run or the visitor has passed, by index
  function usePlayer(start, hold) {
    const s = S.useStore();
    const [pos, setPos] = useState(() => Object.assign({ a: 0, s: 0, b: 0 }, start));
    const [ran, setRan] = useState({}); const [playing, setPlaying] = useState(false); const [end, setEnd] = useState(false);
    const [hops, setHops] = useState(0); // the story moved on to the next line by Next (a jump by the map, the keys or Back is not a hop)
    const act = ACTS[pos.a], station = act.stations[pos.s], n = station.beats.length;
    const complete = pos.b >= n; const beat = station.beats[Math.min(pos.b, n - 1)];
    const doneAt = useCallback(i => { const b = station.beats[i]; if (!b) return true; if (ran[i]) return true; const d = act.console ? null : doneOf(b, s); return d === true; }, [station, ran, s, act]);
    const go = useCallback((a, st, b) => { const S2 = ACTS[a].stations[st]; if (!ACTS[a].console) sceneOf(S2, b || 0); setRan({}); setEnd(false); setPos({ a, s: st, b: b || 0 }); }, []);
    useEffect(() => { go(pos.a, pos.s, pos.b); return () => Flow.Agents.setLive(false); }, []);
    // the address keeps the place (#at=act.station.beat)
    useEffect(() => { try { history.replaceState(null, "", "#at=" + [pos.a, pos.s, Math.min(pos.b, n - 1)].join(".")); } catch (e) {} }, [pos.a, pos.s, pos.b]);
    const advance = useCallback(() => setPos(p => Object.assign({}, p, { b: p.b + 1 })), []);
    const nextStation = useCallback(() => {
      if (pos.s + 1 < act.stations.length) go(pos.a, pos.s + 1, 0);
      else if (pos.a + 1 < ACTS.length) { go(pos.a + 1, 0, 0); setHops(h => h + 1); }
      else { setPlaying(false); setEnd(true); }
    }, [pos, act, go]);
    // Next: make this beat happen (a person's move, or skip ahead to the agent's), then the next beat
    const next = useCallback(() => {
      if (complete) { nextStation(); return; }
      if (!doneAt(pos.b)) { if (!act.console) runActs(beat.acts); setRan(r => Object.assign({}, r, { [pos.b]: true })); }
      advance();
    }, [complete, doneAt, pos, beat, act, advance, nextStation]);
    const tap = useCallback(() => { if (complete) return; setRan(r => Object.assign({}, r, { [pos.b]: true })); advance(); }, [complete, pos, advance]);
    // Back: the beat before, past any an agent would make again on its own at once; from the first, the station before
    const back = useCallback(() => { let j = Math.min(pos.b, n) - 1; while (j >= 0 && station.beats[j].agent && !act.console) j--; if (j >= 0) go(pos.a, pos.s, j); else if (pos.s > 0) go(pos.a, pos.s - 1, 0); else if (pos.a > 0) go(pos.a - 1, ACTS[pos.a - 1].stations.length - 1, 0); }, [pos, n, go, station, act]);
    // a move made in a device: once the store says this beat has happened, the notes move on
    const done = !complete && doneAt(pos.b);
    useEffect(() => { if (!done || hold) return; const t = setTimeout(advance, ran[pos.b] ? 0 : 700); return () => clearTimeout(t); }, [done, pos.a, pos.s, pos.b, hold]);
    // the agents' beats happen on their own
    useEffect(() => { if (complete || done || hold || !beat.agent || act.console) return; const t = setTimeout(() => { runActs(beat.acts); setRan(r => Object.assign({}, r, { [pos.b]: true })); }, 1500); return () => clearTimeout(t); }, [pos.a, pos.s, pos.b, done, hold]);
    // autoplay: a person's beat after a moment, a station's end after a breath
    useEffect(() => {
      if (!playing || hold || end) return;
      if (complete) { const t = setTimeout(nextStation, 1900); return () => clearTimeout(t); }
      if (done || (beat.agent && !act.console)) return;
      const t = setTimeout(next, act.console ? 2600 : beat.acts && beat.acts.length ? 2400 : 2300);
      return () => clearTimeout(t);
    }, [playing, hold, end, complete, done, pos.a, pos.s, pos.b, next, nextStation]);
    return { pos, act, station, beat, complete, end, ran, doneAt, go, next, back, tap, playing, setPlaying, setEnd, hops };
  }

  /* ---------- the staff console on a laptop: the console's own app, on its demo world ---------- */
  // the console's own app (SC-169, SC3_CONSOLE.App) on its demo world, at the beat's route; the visitor can wander off in
  // it, and a new beat points it back. A beat can name a heading to scroll to, and New client opens from a demo request
  // (?request=) as the Overview's Set up does
  function ConsoleScreen({ spec }) {
    const C = window.SC3_CONSOLE, P = window.SC3_PLATFORM;
    const raw = spec.console || "/overview"; const [path, search] = raw.split("?");
    const key = `${raw}|${spec.scrollTo}|${!!spec.signin}`; const box = useRef(null);
    const [route, setRoute] = useState(() => C.routeOf("#" + path));
    useEffect(() => {
      const rq = new URLSearchParams(search || "").get("request"); const r = rq && (P.get().requests || []).find(x => x.id === rq);
      if (r) P.update(x => { x.draft = { name: r.company, industry: r.makes, emailDomain: (r.email.split("@")[1] || "").toLowerCase(), adminName: r.name, adminEmail: r.email, plan: (P.PLANS.find(p => p.name === r.plan) || P.PLANS[0]).id, request: r.id }; });
      setRoute(C.routeOf("#" + path));
      const t = setTimeout(() => { const root = box.current; if (!root) return; const el = spec.scrollTo && [...root.querySelectorAll("h1, h2, h3, h4, .section-title, b, strong")].find(x => x.textContent.trim().startsWith(spec.scrollTo)); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); else { const sc = root.querySelector(".scroll"); sc && sc.scrollTo({ top: 0, behavior: "smooth" }); } }, 700);
      return () => clearTimeout(t);
    }, [key]);
    if (!C) return null;
    return <div ref={box} className="console-screen" style={{ position: "absolute", inset: 0 }}><AppRoot embedded style={{ position: "absolute", inset: 0 }}><NoticeHost><C.App key={spec.signin ? "in" : "app"} route={route} go={(name, id, tab) => setRoute({ name, id, tab })} signIn={!!spec.signin} world="demo" /></NoticeHost></AppRoot></div>;
  }
  function DevLabel({ who, kind, focus, amber }) {
    const me = user(who);
    return <div className={cx("dev-label", focus && "focus", focus && amber && "amber")}><Avatar person={me} size="sm" /><span><b>{(LABEL[who] || me.short || me.name) + " " + kind}</b><span>{PLACE[who] || me.org}</span></span></div>;
  }
  function ConsoleDevice({ spec, width, height, scale, onSignIn }) {
    const url = "https://smartclearance-console.web.app" + (spec.signin ? "/sign-in" : spec.console === "/overview" ? "/" : spec.console);
    return <div className="dev" style={{ width: width * scale }}><DevLabel who="neha" kind="laptop" focus />
      <div className="dev-ring on" style={{ width: width * scale, height: height * scale, borderRadius: 14 * scale }}><div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <WindowFrame url={url} style={{ width, height }}><div className="console-in-demo" style={{ position: "absolute", inset: 0 }}><ConsoleScreen spec={spec} onSignIn={onSignIn} /></div></WindowFrame>
      </div></div></div>;
  }

  /* ---------- a person's device: the app at a route, their sign-in, or their lock screen ---------- */
  function Device({ kind, spec, time, date, scale = 1, width = 1280, height = 800, focus, amber, onTap }) {
    S.useStore(); const ref = useRef(null);
    const key = `${spec.who}|${spec.route}|${JSON.stringify(spec.params || {})}`;
    const [route, setRoute] = useState({ name: spec.route, params: spec.params || {} });
    useEffect(() => setRoute({ name: spec.route, params: spec.params || {} }), [key]);
    const me = user(spec.who);
    // scroll to the section the beat is about, once the screen has drawn (the device is scaled: measure in its pixels)
    useEffect(() => {
      if (!spec.anchor || spec.lock) return;
      const t = setTimeout(() => { const root = ref.current; if (!root) return; const el = root.querySelector(`[data-anchor="${spec.anchor}"]`); const sc = root.querySelector(".scroll"); if (!el || !sc) return; const k = sc.getBoundingClientRect().height / (sc.clientHeight || 1) || 1; sc.scrollTo({ top: Math.max(0, (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) / k + sc.scrollTop - 64), behavior: "smooth" }); }, 420);
      return () => clearTimeout(t);
    }, [spec.anchor, key, !!spec.lock]);
    const go = r => setRoute({ name: r.name, params: r.params || {} });
    const app = spec.lock ? <S.LockScreen who={spec.lock.who} push={spec.lock.push} time={time} date={date} onOpen={onTap} />
      : spec.signin ? <NoticeHost resetKey={"in-" + spec.who}><S.SignIn guided key={spec.signin} prefill={PREFILL[spec.signin]} onSignIn={onTap} /></NoticeHost>
      : <NoticeHost resetKey={spec.who}><S.RoleApp key={key} me={me} route={route} onGo={go} onBack={() => go({ name: S.HOME[me.role] })} /></NoticeHost>;
    if (kind === "bare") return <AppRoot embedded className="real-app" style={{ "--safe-top": "calc(env(safe-area-inset-top, 0px) + 60px)" }}><div ref={ref} style={{ position: "absolute", inset: 0 }}>{app}</div></AppRoot>;
    const lbl = <DevLabel who={spec.who} kind={kind === "phone" ? "phone" : "laptop"} focus={focus} amber={amber} />;
    if (kind === "phone") return <div className="dev" style={{ width: 414 * scale }}>{lbl}<div className={cx("dev-ring", focus && "on", amber && "amber")} style={{ width: 414 * scale, height: 868 * scale, borderRadius: 60 * scale }}><div ref={ref} style={{ width: 414, height: 868, transform: `scale(${scale})`, transformOrigin: "top left" }}><PhoneFrame time={time} dark={!!spec.lock}>{app}</PhoneFrame></div></div></div>;
    const path = spec.signin ? "sign-in" : [route.name || S.HOME[me.role], route.params && route.params.ref].filter(Boolean).join("/") + (route.params && route.params.tab ? "?tab=" + route.params.tab : route.params && route.params.reading ? "?reading=" + route.params.reading : "");
    const url = me.role === "buyer" ? "https://expiresoon.example/l/ES-24117" : `https://${WS.domain}/${path}`;
    return <div className="dev" style={{ width: width * scale }}>{lbl}<div className={cx("dev-ring", focus && "on", amber && "amber")} style={{ width: width * scale, height: height * scale, borderRadius: 14 * scale }}><div ref={ref} style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}><WindowFrame url={url} style={{ width, height }}><AppRoot embedded style={{ position: "absolute", inset: 0 }}>{app}</AppRoot></WindowFrame></div></div></div>;
  }

  // what a beat does in the devices besides the store: open the approve sheet, or press a button by its words
  function useBeatEffects(p) {
    useEffect(() => {
      if (p.act.console || p.complete) return;
      const b = p.beat; if (!b.event && !b.click) return;
      const t = setTimeout(() => {
        if (b.event) window.dispatchEvent(new Event(b.event));
        if (b.click) { const el = [...document.querySelectorAll(".device-window button")].find(x => x.textContent.trim() === b.click); el && el.click(); }
      }, 900);
      return () => clearTimeout(t);
    }, [p.pos.a, p.pos.s, p.pos.b]);
  }

  function useSize(ref) { const [sz, set] = useState({ w: 0, h: 0 }); useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(([e]) => set({ w: e.contentRect.width, h: e.contentRect.height })); ro.observe(el); return () => ro.disconnect(); }, []); return sz; }

  // the stage: the laptop and the phone fitted into their box (the console's laptop alone, wider)
  function Stage({ p, size, phoneOnly, real }) {
    const { station, beat, act } = p; const W = size.w, H = size.h;
    const sp = specsOf(station, beat); const time = beat.time || "09:00", date = beat.date || station.date; const focus = p.complete ? null : beat.focus;
    if (real) { if (act.console) return <div className="real-console"><ConsoleScreen spec={sp.desk} onSignIn={p.tap} /></div>; const spec = focus === "desk" ? sp.desk : sp.phone || sp.desk; return <Device kind="bare" spec={spec} time={time} date={date} onTap={p.tap} />; }
    if (!W || !H) return null;
    const labelH = 50;
    if (act.console) { const winW = 1440; const sw = Math.min(1, Math.max(0.3, Math.min((W - 8) / winW, (H - labelH - 8) / 860))); return <div className="devices"><ConsoleDevice spec={sp.desk} width={winW} height={Math.max(720, (H - labelH - 8) / sw)} scale={sw} onSignIn={p.tap} /></div>; }
    const ps = Math.min(0.84, Math.max(0.3, (H - labelH - 8) / 868));
    if (phoneOnly) { const spec = focus === "desk" ? sp.desk : sp.phone || sp.desk; return <div className="devices"><Device kind="phone" spec={spec} time={time} date={date} scale={Math.min(1.04, ps * 1.18)} focus={!!focus} amber={beat.human} onTap={p.tap} /></div>; }
    const hasPhone = !!sp.phone; const winW = 1280; const avail = W - (hasPhone ? 414 * ps + 40 : 0);
    const sw = Math.min(1, Math.max(0.3, avail / winW)); const winH = Math.max(640, (H - labelH - 8) / sw);
    return <div className="devices">
      <Device kind="desk" spec={sp.desk} time={time} date={date} scale={sw} width={winW} height={winH} focus={focus === "desk"} amber={focus === "desk" && beat.human} onTap={p.tap} />
      {hasPhone && <Device kind="phone" spec={sp.phone} time={time} date={date} scale={ps} focus={focus === "phone"} amber={focus === "phone" && beat.human} onTap={p.tap} />}
    </div>;
  }

  /* ---------- the route map, in a 1320 × 620 box (viewBox 40 36 1380 640) ---------- */
  const I = [450, 380];
  const GEO = {
    console: { d: "M70 150 H390 L450 210 V380", st: [[70, 150], [150, 150], [230, 150], [310, 150], [390, 150], [450, 290]], side: ["up", "up", "up", "up", "up", "left"] },
    chips: { d: "M450 380 L570 260 H1156", st: [[600, 260], [660, 260], [720, 260], [780, 260], [840, 260], [900, 260], [966, 260], [1032, 260], [1098, 260]], side: "up", end: [1156, 260], out: [1174, 0, "start"] },
    slow: { d: "M900 260 L988 348 H1316", st: [[1020, 348], [1080, 348], [1140, 348], [1200, 348], [1260, 348]], side: "down", end: [1316, 348], out: [1330, 64, "end"] },
    mango: { d: "M450 380 L570 500 H1070", st: [[600, 500], [680, 500], [760, 500], [840, 500], [920, 500], [1000, 500]], side: "down", end: [1070, 500], out: [1088, 0, "start"] },
  };
  const SHORT = { "Munchly's setup": "Setup", "Agent setup": "Agents", "Existing clients": "Clients", "A new client": "New client", "Expiry day": "Expiry", "The second yes": "Yes" };
  const short = t => SHORT[t] || t;
  const BADGE = { console: "Smart-Clearance's console", chips: "every pack sold", slow: "destroyed at the godown, on a second yes", mango: "kiranas, a staff sale, a food bank" };
  const OUT = { chips: "every pack sold", slow: `${SLOW.left} destroyed, on a yes`, mango: `${D.MANGO_FB} meals · all placed` };
  const lineName = a => a.title + (a.id === "slow" ? " · a slow week" : "");
  // the plate's city blocks: small clusters in the map's gaps (light only)
  const BLOCKS = []; [[752, 66, 3, 2], [1148, 64, 4, 2], [70, 446, 2, 2], [70, 570, 3, 1], [640, 300, 3, 2], [1206, 560, 3, 2]].forEach(([x0, y0, c, r]) => { for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) BLOCKS.push([x0 + i * 62, y0 + j * 46]); });
  const toneOf = st => (st.id === "expiry" ? "red" : st.amber ? "amber" : null);

  function RouteMap({ active, hot, setHot, pos, onPick, draw, compact }) {
    const reduce = useReducedMotion(); const animate = draw && !reduce; const uid = "rm" + React.useId().replace(/:/g, "");
    const lit = id => id === active || id === hot || (id === "chips" && (active === "slow" || hot === "slow") ? "shared" : false);
    const stateOf = (ai, si) => (pos ? (ai < pos.a || (ai === pos.a && si < pos.s) ? "done" : ai === pos.a && si === pos.s ? "now" : null) : null);
    const order = ["console", "mango", "chips", "slow"];
    const draws = k => (animate ? { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.9, delay: 0.12 * k, ease: [0.22, 1, 0.36, 1] } } : { initial: false, animate: { pathLength: 1 } });
    return <svg className={cx("rb-map", compact && "compact")} viewBox="40 36 1380 640" role="group" aria-label="The demo's route map: the platform's line into Munchly's workspace, then three journeys">
      <g className="rb-plate" aria-hidden="true">
        <defs><pattern id={uid + "d"} width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" className="rb-dot" /></pattern><clipPath id={uid + "c"}><rect x="44" y="40" width="1372" height="632" rx="36" /></clipPath></defs>
        <rect x="44" y="40" width="1372" height="632" rx="36" className="rb-ground" />
        <g clipPath={`url(#${uid}c)`}><rect x="44" y="40" width="1372" height="632" fill={`url(#${uid}d)`} className="rb-dots" />{BLOCKS.map(([x, y], i) => <rect key={i} x={x} y={y} width="54" height="38" rx="9" className="rb-block" />)}<path d="M20 612 C 300 548, 520 694, 772 604 S 1180 492, 1440 528" className="rb-water" /></g>
      </g>
      {order.map((id, k) => { const on = lit(id) === true; return <g key={id} onMouseEnter={() => setHot && setHot(id)} onMouseLeave={() => setHot && setHot(null)}>
        <motion.path d={GEO[id].d} className={cx("rb-line-road", on && "on")} {...draws(k)} />
        <motion.path d={GEO[id].d} className={cx("rb-line-shadow", on && "on")} {...draws(k)} />
        <motion.path d={GEO[id].d} className={cx("rb-line", on && "on")} {...draws(k)} />
      </g>; })}
      {lit("chips") === "shared" && <><path d="M450 380 L570 260 H900" className="rb-line-road on" /><path d="M450 380 L570 260 H900" className="rb-line on" /></>}
      {["console", "chips", "slow", "mango"].map(id => { const a = ACTS[AI[id]]; const g = GEO[id]; return a.stations.map((st, si) => {
        const [x, y] = g.st[si]; const side = Array.isArray(g.side) ? g.side[si] : g.side; const s = stateOf(AI[id], si); const tone = toneOf(st);
        const ly = side === "up" ? y - 23 : side === "down" ? y + 35 : y + 5; const lx = side === "left" ? x - 18 : x;
        const on = lit(id) === true || (id === "chips" && lit("chips") === "shared" && si <= 5);
        return <g key={id + st.id} className={cx("rb-st", on && "on", s, tone)} role="button" tabIndex={compact ? -1 : 0} aria-label={`${lineName(a)}: ${st.title}`}
          onClick={() => onPick && onPick(AI[id], si)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick && onPick(AI[id], si); } }} onFocus={() => setHot && setHot(id)} onBlur={() => setHot && setHot(null)}>
          <motion.circle cx={x} cy={y} r={9} initial={animate ? { scale: 0, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 + 0.12 * order.indexOf(id) + si * 0.03, duration: 0.24 }} style={{ transformOrigin: `${x}px ${y}px` }} />
          {s === "done" && <path d={`M${x - 4} ${y} l3 3 l5 -6`} className="rb-tick" />}
          {!compact && <text x={lx} y={ly} textAnchor={side === "left" ? "end" : "middle"} className="rb-lbl">{short(st.title)}</text>}
        </g>; }); })}
      <g className="rb-hub"><circle cx={I[0]} cy={I[1]} r={24} /><foreignObject x={I[0] - 14} y={I[1] - 14} width={28} height={28}><div className="rb-hub-mark"><WorkspaceMark ws={WS} size={28} /></div></foreignObject>
        {!compact && <text x={I[0] - 34} y={I[1] + 5} textAnchor="end" className="rb-lbl strong">Munchly's workspace</text>}</g>
      {!compact && ["chips", "slow", "mango"].map((id, k) => { const a = ACTS[AI[id]]; const [x, y] = GEO[id].end; const [ox, dy, anchor] = GEO[id].out;
        return <motion.g key={id} className={cx("rb-end", a.outcome.red && "red", lit(id) === true && "on")} initial={animate ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 + 0.12 * k, duration: 0.42 }}>
          <circle cx={x} cy={y} r={11} className="rb-pin" />
          {animate && <motion.circle cx={x} cy={y} r={11} className="rb-ping" initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ delay: 1.3 + 0.12 * k, duration: 1.1, repeat: 1 }} style={{ transformOrigin: `${x}px ${y}px` }} />}
          <text x={ox} y={y + dy + 9} textAnchor={anchor} className="rb-out">{fmt.inr(a.outcome.value)}</text>
          <text x={ox} y={y + dy + 28} textAnchor={anchor} className="rb-out-sub">{OUT[id]}</text>
        </motion.g>; })}
      {!compact && [["console", 56, 46], ["chips", 588, 152], ["slow", 790, 400], ["mango", 588, 558]].map(([id, x, y]) => { const a = ACTS[AI[id]];
        return <foreignObject key={id} x={x - 10} y={y - 10} width={380} height={76}><div className="rb-badge-pad"><button type="button" className={cx("rb-badge", lit(id) === true && "on")} onMouseEnter={() => setHot && setHot(id)} onMouseLeave={() => setHot && setHot(null)} onFocus={() => setHot && setHot(id)} onBlur={() => setHot && setHot(null)} onClick={() => onPick && onPick(AI[id], 0)}>
          {a.console ? <span className="rb-badge-ic"><Icon name="layout-dashboard" size={18} /></span> : <img src={img(a.img)} alt="" />}
          <span className="rb-badge-t"><b>{lineName(a)}</b><span>{BADGE[id]} · {a.minutes} min</span></span>
        </button></div></foreignObject>; })}
      {pos && (() => { const a = ACTS[pos.a]; const [x, y] = GEO[a.id].st[pos.s]; return <motion.g className="rb-token" initial={false} animate={{ x, y }} transition={reduce ? { duration: 0 } : TOKEN} aria-hidden="true">
        <circle r={17} /><foreignObject x={-13} y={-13} width={26} height={26}><div className="rb-token-in">{a.console ? <Icon name="layout-dashboard" size={15} /> : <img src={img(a.img)} alt="" />}</div></foreignObject>
      </motion.g>; })()}
    </svg>;
  }

  // on a phone: the lines as a list, each with its stops and where it ends
  function PhoneLines({ onPick }) {
    return <ol className="rb-plines" aria-label="The lines">{["console", "chips", "slow", "mango"].map(id => { const a = ACTS[AI[id]];
      return <li key={id} className={cx("rb-pline", id === "slow" && "branch")}>
        {id === "slow" && <svg className="rb-pline-branch" viewBox="0 0 16 40" preserveAspectRatio="none" aria-hidden="true"><path d="M4 0 V28 Q4 38 14 38" vectorEffect="non-scaling-stroke" /></svg>}
        <button type="button" onClick={() => onPick(AI[id], 0)} className="rb-pline-btn">
          <span className="rb-pline-head">{a.console ? <span className="rb-badge-ic"><Icon name="layout-dashboard" size={18} /></span> : <img src={img(a.img)} alt="" />}<span className="rb-badge-t"><b>{lineName(a)}</b><span>{id === "slow" ? "branches off the chips after the yes" : BADGE[id]} · {a.minutes} min</span></span></span>
          <span className="rb-pline-rail" aria-hidden="true">{a.stations.map(st => <i key={st.id} className={toneOf(st) || ""} />)}<em className={a.outcome.red ? "red" : ""} /></span>
          <span className="rb-pline-out">{a.outcome.value != null ? <><b>{fmt.inr(a.outcome.value)}</b> · {OUT[id]}</> : "Ends at Munchly's workspace"}</span>
        </button>
      </li>; })}</ol>;
  }

  /* ---------- the start: the map, with the three endings ---------- */
  function Start({ onPick, onAll }) {
    const [hot, setHot] = useState(null); const reduce = useReducedMotion(); const app = useApp();
    const h = hot && ACTS[AI[hot]];
    return <div className="rb-start">
      <div className="rb-intro">
        <div className="rb-intro-l"><span className="rb-eyebrow">Guided demo · about {total} minutes</span><h1 className="rb-title">Three batches. Three endings.</h1></div>
        <div className="rb-intro-r">
          <p className="rb-lede">The platform sets Munchly Foods up. Then a batch of chips sells out, a batch of Mango Drink feeds Hyderabad, and a slow week ends at the bin, on a second yes. Every screen is the real app, on sample data.</p>
          <div className="row wrap" style={{ gap: 18, alignItems: "center" }}><Button variant="primary" size="lg" icon="play" onClick={onAll}>Play the whole route</Button>
            <ul className="rb-legend" aria-label="How to read the map"><li><i className="lg-green" />The agents' work</li><li><i className="lg-amber" />A person's yes</li><li><i className="lg-red" />The bin</li></ul></div>
        </div>
      </div>
      {app.w < 768 ? <PhoneLines onPick={onPick} /> : <div className="rb-mapwrap"><RouteMap hot={hot} setHot={setHot} onPick={onPick} draw />
        <AnimatePresence mode="wait">{h && <motion.div key={h.id} className="rb-peek" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <b>{lineName(h)}</b><span>{h.place}</span><span className="rb-peek-screens">{[...new Set(h.stations.flatMap(s => s.beats.map(b => b.screen.split(" · ")[0])).filter(x => !/Lock screen|Sign-in/.test(x)))].slice(0, 8).join(" · ")}</span>
        </motion.div>}</AnimatePresence>
      </div>}
    </div>;
  }

  /* ---------- playing: the line as a strip over the stage, the station's notes ---------- */
  function Strip({ p, onMap }) {
    const reduce = useReducedMotion(); const a = p.act; const n = a.stations.length; const nb = p.station.beats.length;
    const along = Math.min(n - 1, p.pos.s + Math.min(1, p.pos.b / nb));
    return <div className="rb-strip">
      <button type="button" className="rb-mapbtn" onClick={onMap} aria-label="Open the route map" aria-keyshortcuts="M"><Icon name="map" size={18} /><span>Map</span></button>
      <span className="rb-strip-line">{a.console ? <span className="rb-badge-ic sm"><Icon name="layout-dashboard" size={14} /></span> : <img src={img(a.img)} alt="" />}<span className="rb-strip-t"><b>{lineName(a)}</b><span>{p.station.title} · {p.pos.s + 1} of {n}</span></span></span>
      <ol className="rb-stops" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, "--n": n }} aria-label="Stations on this line">
        <span className="rb-track" aria-hidden="true"><span style={{ transform: `scaleX(${n > 1 ? along / (n - 1) : 1})` }} /></span>
        {a.stations.map((st, i) => { const s2 = i < p.pos.s ? "done" : i === p.pos.s ? "now" : ""; return <li key={st.id} className={cx("rb-stop", s2, toneOf(st))}>
          <button type="button" title={st.title} onClick={() => p.go(p.pos.a, i, 0)} aria-current={s2 === "now" ? "step" : undefined} aria-label={`${st.title}${s2 === "done" ? ", done" : ""}`}>
            <span className="rb-dot">{s2 === "done" ? <Icon name="check" size={11} stroke={3} /> : null}{s2 === "now" && <motion.span layoutId="rb-token" className="rb-tok" transition={reduce ? { duration: 0 } : TOKEN}>{a.console ? <Icon name="layout-dashboard" size={13} /> : <img src={img(a.img)} alt="" />}</motion.span>}</span>
          </button>
        </li>; })}
      </ol>
      <span className="rb-out-mini">{a.outcome.value != null ? <><span>ends at</span><b>{fmt.inr(a.outcome.value)}</b></> : <span>ends at Munchly's workspace</span>}</span>
    </div>;
  }
  function Figures({ figs }) {
    return <div className="figs">{figs.map(f => <div key={f.label} className="fig"><span className="fig-label">{f.label}</span>{f.count ? <span className="num m" style={{ color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" }}>{fmt.num(f.value)}</span> : <Money value={f.value} size="m" decimals={f.decimals} roll style={{ color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" }} />}</div>)}</div>;
  }
  function Notes({ p, compact }) {
    const { act, station, pos } = p; const nb = station.beats.length; const last = pos.s === act.stations.length - 1;
    const nextLabel = p.complete ? (last ? (pos.a + 1 < ACTS.length ? "Next line · " + lineName(ACTS[pos.a + 1]) : "The end") : "Next · " + act.stations[pos.s + 1].title) : p.beat.agent && !act.console ? "Skip ahead" : "Next";
    return <aside className={cx("narr rb-card", compact && "compact")} aria-label="Narration"><div className="narr-scroll" {...(compact ? {} : { tabIndex: 0, role: "region", "aria-label": "Station notes" })}>
      <div className="rb-card-head"><span className={cx("rb-card-n", toneOf(station))}>{pos.s + 1}</span><div className="stack tight" style={{ gap: 2 }}><h2 className="narr-title">{station.title}</h2><span className="t-footnote subtle">{lineName(act)} · {station.date}</span></div></div>
      <div className="rb-onscreen"><span>On screen</span><b>{p.beat.screen}</b></div>
      {station.figures && <Figures figs={station.figures} />}
      <ol className="beats">{station.beats.map((b, i) => { const done = i < pos.b; const now = i === pos.b; const working = b.agent && !act.console; return <li key={i} className={cx("beat", done && "done", now && "now", b.human && "human")}>
        <span className="beat-dot">{done ? <Icon name="check" size={13} stroke={3} /> : now && working ? <span className="beat-aura" /> : null}</span>
        <span className="beat-body"><span className="beat-who">{b.agent ? b.agent + " agent" : user(b.who).short}{b.time ? " · " + (b.date ? b.date.split(" ")[0] + " " : "") + b.time : ""}</span><span>{b.text}</span>
          {now && !working && <span className="beat-hint"><Icon name="hand" size={13} />{act.console ? "Look in the console" : tapOf(station, b) ? "Tap it in the device" : "Their move: in the device"}, or press <Kbd>→</Kbd></span>}
          {now && working && <span className="beat-hint"><span className="typing"><i /><i /><i /></span>working</span>}</span>
      </li>; })}</ol></div>
      <div className="narr-ctrl"><Button variant="secondary" icon="chevron-left" onClick={p.back} disabled={pos.a === 0 && pos.s === 0 && pos.b === 0} aria-label="Back">Back</Button><Button variant={!p.complete && p.beat.human ? "approve" : "primary"} iconRight="arrow-right" block onClick={p.next}>{nextLabel}</Button></div>
    </aside>;
  }
  // between lines, and on Map: the whole map over the stage, the token where the story is
  function MapOver({ p, onPick, onClose, hop }) {
    const reduce = useReducedMotion(); const ref = useRef(null);
    useEffect(() => { const f = e => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", f); const prev = document.activeElement; ref.current && ref.current.querySelector("button").focus(); return () => { window.removeEventListener("keydown", f); prev && prev.focus && prev.focus(); }; }, []);
    return <motion.div ref={ref} className="rb-over" role="dialog" aria-modal="true" aria-label="The route map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.24 }}>
      <div className="rb-over-in">
        <div className="rb-over-head"><div className="rb-over-copy">{hop && <span className="rb-eyebrow">Next line</span>}<h2 className="rb-over-title">{hop ? <>{lineName(p.act)}<span> · {p.act.place}</span></> : "The route"}</h2></div><IconButton icon="x" label="Close the map" onClick={onClose} /></div>
        <div className="rb-over-map"><RouteMap active={p.act.id} pos={p.pos} onPick={(a, s) => { onPick(a, s); onClose(); }} /></div>
      </div>
    </motion.div>;
  }
  function End({ onRestart, onClose }) {
    const reduce = useReducedMotion();
    return <motion.div className="finale rb-end" role="dialog" aria-modal="true" aria-label="The end of the route" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="finale-in">
        <Mark size={56} play={!reduce} />
        <span className="finale-ws"><WorkspaceMark ws={WS} size={22} /><span>{WS.name} · {WS.domain}</span></span>
        <h2 className="finale-title">Three batches, three endings</h2>
        <p className="finale-hi hi" lang="hi">हर कार्टन को दूसरा मौका</p>
        <div className="rb-ends">{["chips", "mango", "slow"].map((id, k) => { const a = ACTS[AI[id]]; return <motion.div key={id} className={cx("rb-endcard", a.outcome.red && "red")} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + k * 0.12 }}><img src={img(a.img)} alt="" /><b>{lineName(a)}</b><Money value={a.outcome.value} roll from={0} size="l" style={{ color: "var(--primary-text)" }} /><span>{a.outcome.line}</span></motion.div>; })}</div>
        <div className="row wrap" style={{ gap: 10, justifyContent: "center" }}><Button variant="primary" size="lg" icon="rotate-ccw" onClick={onRestart}>Ride it again</Button><Button variant="secondary" size="lg" onClick={onClose}>Stay on the last stop</Button></div>
      </div>
    </motion.div>;
  }

  /* ---------- the director ---------- */
  function Director({ start, autoplay, onHome }) {
    const [map, setMap] = useState(null); const [phoneOnly, setPhoneOnly] = useState(false); const [notes, setNotes] = useState(() => window.innerWidth >= 768); // on a real phone the notes wait in their sheet
    const p = usePlayer(start, !!map); useBeatEffects(p); const app = useApp();
    const canvas = useRef(null); const size = useSize(canvas); const shell = useRef(null);
    useEffect(() => { if (autoplay) p.setPlaying(true); }, []);
    // the story moves on to a new line: the map shows the token hopping to it; playing, the stage comes back on its own
    useEffect(() => { if (p.hops) setMap("hop"); }, [p.hops]);
    useEffect(() => { if (map !== "hop" || !p.playing) return; const t = setTimeout(() => setMap(null), 2600); return () => clearTimeout(t); }, [map, p.playing]);
    // the keys: → and ← by beats, 1 to 4 to a line's start, M the map, P the phone alone, N the notes
    useEffect(() => { const f = e => { if (map || (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"))) return; if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); p.next(); } else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); p.back(); } else if (e.key === "m" || e.key === "M") setMap("map"); else if (/^[1-4]$/.test(e.key)) p.go(+e.key - 1, 0, 0); else if (e.key === "p" || e.key === "P") setPhoneOnly(v => !v); else if (e.key === "n" || e.key === "N") setNotes(v => !v); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); });
    // while a dialog is up, what it covers is inert (WCAG 2.4.3)
    const dialog = !!map || p.end;
    useEffect(() => { const el = shell.current; if (!el || !dialog) return; const behind = [...el.children].filter(c => !c.classList.contains("rb-over") && !c.classList.contains("finale")); behind.forEach(c => c.setAttribute("inert", "")); return () => behind.forEach(c => c.removeAttribute("inert")); }, [dialog]);
    const overlays = <>
      <AnimatePresence>{map && <MapOver p={p} hop={map === "hop"} onPick={(a, s) => p.go(a, s, 0)} onClose={() => setMap(null)} />}</AnimatePresence>
      <AnimatePresence>{p.end && <End onRestart={() => p.go(0, 0, 0)} onClose={() => p.setEnd(false)} />}</AnimatePresence>
    </>;
    if (app.w < 768) return <div className="demo-real rb-real" ref={shell}>
      <div className="real-bar"><button type="button" className="iconbtn" aria-label="Back" onClick={p.back}><Icon name="chevron-left" size={22} /></button>
        <button type="button" className="real-stage" onClick={() => setNotes(v => !v)} aria-label="Station notes"><span className={cx("rb-card-n sm", toneOf(p.station))}>{p.pos.s + 1}</span><span className="stack tight" style={{ gap: 0 }}><b>{lineName(p.act)} · {p.station.title}</b><span>{p.complete ? "Station done" : p.beat.text}</span></span></button>
        <button type="button" className={cx("iconbtn real-next", !p.complete && p.beat.human && "amber")} aria-label="Next" onClick={p.next}><Icon name="arrow-right" size={22} /></button></div>
      <Stage p={p} size={size} real />
      <K.Sheet open={notes} onClose={() => setNotes(false)} title={`${lineName(p.act)} · ${p.station.title}`} detent="medium"><Notes p={p} compact /><div className="row" style={{ gap: 8, marginTop: 12 }}><Button variant="secondary" icon="map" onClick={() => { setNotes(false); setMap("map"); }}>The route map</Button><Button variant="secondary" icon="layout-grid" onClick={onHome}>All lines</Button></div></K.Sheet>
      {overlays}
    </div>;
    return <div className={cx("demo rb-demo", !notes && "no-notes")} ref={shell}>
      <header className="demo-top rb-top">
        <span className="row tight demo-brand"><button type="button" className="rb-home" onClick={onHome} aria-label="Back to the route map"><Mark size={30} /></button><Wordmark size={17} /><span className="demo-tag">Guided demo</span></span>
        <Strip p={p} onMap={() => setMap("map")} />
        <span className="row tight demo-tools">
          <IconButton icon={p.playing ? "pause" : "play"} label={p.playing ? "Pause" : "Play the route"} onClick={() => p.setPlaying(!p.playing)} />
          <IconButton icon={phoneOnly ? "monitor" : "smartphone"} label={phoneOnly ? "Laptop and phone" : "Phone only"} onClick={() => setPhoneOnly(v => !v)} />
          <IconButton icon="presentation" label={notes ? "Hide notes" : "Show notes"} onClick={() => setNotes(v => !v)} />
          <ModeMenuButton />
        </span>
      </header>
      <div className="demo-body">
        {notes && <Notes p={p} />}
        <main className="demo-canvas" ref={canvas}><Stage p={p} size={size} phoneOnly={phoneOnly} /></main>
      </div>
      {overlays}
    </div>;
  }

  // where the visitor lands: the map, or a place in the story from the address (#at=act.station.beat; the old
  // #stage=N opens the chips' station N)
  function startOf() {
    const h = location.hash; let m = /at=(\d+)\.(\d+)\.(\d+)/.exec(h);
    if (m) { const a = Math.min(ACTS.length - 1, +m[1]); const st = Math.min(ACTS[a].stations.length - 1, +m[2]); return { a, s: st, b: Math.min(ACTS[a].stations[st].beats.length - 1, +m[3]) }; }
    m = /stage=(\d)/.exec(h); if (m) return { a: AI.chips, s: Math.min(8, Math.max(0, +m[1] - 1)), b: 0 };
    return null;
  }
  function App() {
    const [start, setStart] = useState(startOf); const [auto, setAuto] = useState(false);
    // an address typed or followed by hand (#at=…) moves the story there; the director's own updates replace the entry
    // without a hashchange
    useEffect(() => { const f = () => { setAuto(false); setStart(startOf()); }; window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
    if (!start) return <div className="demo rb-shell"><header className="demo-top rb-top"><span className="row tight demo-brand"><Mark size={30} /><Wordmark size={17} /><span className="demo-tag">Guided demo</span></span><span /><span className="row tight demo-tools"><ModeMenuButton /></span></header>
      <main className="rb-startwrap"><Start onPick={(a, s) => { setAuto(false); setStart({ a, s, b: 0 }); }} onAll={() => { setAuto(true); setStart({ a: 0, s: 0, b: 0 }); }} /></main></div>;
    return <Director key={JSON.stringify(start)} start={start} autoplay={auto} onHome={() => { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} setStart(null); }} />;
  }
  function Root() { return <ThemeProvider><AppRoot className="demo-root" style={{ position: "fixed", inset: 0 }}><NoticeHost><App /></NoticeHost></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();

// SC-78 · the landing page refined: three options for each of the four parts the maintainer asked about, on the real
// kit. The page is design3/site/site.jsx (SC-60) with the hero, the day scene, the workspace section and the bar made
// switchable: ?hero=a|b|c  ?scene=a|b  ?ws=a|b|c  ?nav=a|b|c (or window.SC78 from the mockup page). Everything else is
// the page as it is.
(function () {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } = React;
  const { useReducedMotion, motion, useScroll, useTransform, useInView, AnimatePresence, animate, useSpring } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, P = window.SC3_PLATFORM; const fmt = M.fmt;
  const { cx, Icon, IconButton, Button, Badge, Sheet, Field, Input, Select, Textarea, Menu, Mark, Wordmark, Money, Roll, GateChips, Product, Segmented, ModeMenuButton, ThemeProvider, AppRoot, NoticeHost, useApp, useTheme, WindowFrame, PhoneFrame } = K;
  const IMG = window.SC3_SITE_IMG || "assets/plates/", MEDIA = window.SC3_SITE_MEDIA || "assets/media/";
  const IMG78 = window.SC78_IMG || "../img/", MEDIA78 = window.SC78_MEDIA || "../media/";
  // which option of each part this page shows
  const QS = new URLSearchParams(location.search);
  const OPT = Object.assign({ hero: "a", scene: "a", ws: "a", nav: "a" }, window.SC78 || {});
  for (const k of ["hero", "scene", "ws", "nav"]) if (QS.get(k)) OPT[k] = QS.get(k);
  const LINKS = Object.assign({ demo: "../../../demo/Smart-Clearance%20demo%20v3.html", app: "../../../app/Smart-Clearance%20app%20v3.html", console: "../../../console/Smart-Clearance%20console%20v3.html" }, window.SC3_LINKS || {});
  const external = href => /^https?:/.test(href);
  const linkProps = href => external(href) ? { href, target: "_blank", rel: "noopener" } : { href };
  const open = href => { if (external(href)) { if (!window.open(href, "_blank", "noopener")) location.href = href; } else location.href = href; };
  if (P) P.usePersistence();

  /* ---------- the figures every section quotes, all of them computed in core/money.js ---------- */
  const lineOf = id => D.PLAN.lines.find(l => l.id === id);
  const KL = lineOf("kirana"), ESL = lineOf("expiresoon"), AW = D.AWARD;
  const BATCH = D.BATCHES.find(b => b.hero), DIST = D.DISTRIBUTORS[BATCH.distributor], SKU = D.SKUS[BATCH.sku];
  const SHOPS = D.KIRANAS.length, BIN = D.PLAN.writeOff.total, ES_NET = AW.gross - ESL.cost, N = D.RISK.atRisk;
  const row = id => D.PLAN.rows.find(r => r.id === id);
  const planned = id => D.PLAN.lines.some(l => l.id === id);
  const rate = v => Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v);
  const SCHEME = M.RULES.scheme, BID = 13;
  const BEST_BEFORE = new Date(BATCH.bestBefore + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const OFFER = { title: D.PUSH.offer.title, body: `नमस्ते! ${SKU.name} पर आज खास ऑफर: ${SCHEME.buy} पैकेट लो, ${SCHEME.free} मुफ़्त. Best before ${BEST_BEFORE}. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें.` };
  const EASE = [0.22, 1, 0.36, 1];
  const agentsAt = (...stages) => P.AGENTS.filter(a => !a.gate && stages.includes(a.stage)).map(a => a.name);
  const DID = {
    data: `${fmt.num(BATCH.units)} packs in stock, selling ${BATCH.sellPerDay} a day`,
    watcher: `${fmt.num(N)} packs won't sell in the ${BATCH.daysLeft} days left`,
    vision: "Read the label: the date matches",
    valuer: `Five exits priced; the bin would cost ${fmt.inr(-BIN)}`,
    router: `${fmt.num(KL.units)} to ${SHOPS} kiranas, ${fmt.num(AW.units)} to one buyer`,
    gate: `Approved in one tap, ${fmt.inr(D.PLAN.net)} on screen`,
    outreach: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas, buy ${SCHEME.buy} get ${SCHEME.free} free`,
    lister: `${fmt.num(AW.units)} packs listed in the distributor's name`,
    negotiator: `Countered a bid to ${rate(AW.price)} a pack`,
    paperwork: "The invoice, credit note and GST memo, drafted",
    impact: `${fmt.num(D.PLAN.kg)} kg kept out of landfill`,
  };
  const AGENTS = P.AGENTS.map(a => ({ id: a.gate ? "you" : a.id, name: a.gate ? "You" : a.name, icon: a.icon, human: !!a.gate, did: DID[a.id] }));
  const AGENT = Object.fromEntries(AGENTS.map(a => [a.id, a]));

  /* ---------- small shared pieces ---------- */
  function useRise(amount = 0.3) {
    const ref = useRef(null); const reduce = useReducedMotion();
    const inView = useInView(ref, { once: true, amount }); const shown = reduce || inView;
    const move = (y, delay) => ({ initial: reduce ? false : { opacity: 0, y }, animate: shown ? { opacity: 1, y: 0 } : undefined, transition: { duration: 0.42, delay: reduce ? 0 : delay, ease: EASE } });
    return { shown, card: { ref, ...move(16, 0) }, rise: i => move(10, 0.16 + i * 0.11) };
  }
  function useLit(on, n, first, every) {
    const reduce = useReducedMotion(); const [k, setK] = useState(reduce ? n : 0);
    useEffect(() => {
      if (reduce) { setK(n); return; }
      if (!on || k >= n) return;
      const t = setTimeout(() => setK(k + 1), k === 0 ? first : every); return () => clearTimeout(t);
    }, [on, k, reduce]);
    return k;
  }
  function AgentChips({ who, lit, person }) {
    return <span className="agents">{who.map((w, j) => <span key={w} className={cx("chip-agent", (lit == null || j < lit) && "on", person && j === 0 && "person")}><i aria-hidden="true" />{w}</span>)}</span>;
  }
  // which section the reader is in: the last one whose top has passed 45% of the window
  function useActiveSection(ids) {
    const [active, setActive] = useState(null);
    useEffect(() => {
      const f = () => { const line = window.innerHeight * 0.45; let cur = null; for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= line) cur = id; } setActive(cur); };
      f(); window.addEventListener("scroll", f, { passive: true }); window.addEventListener("resize", f); return () => { window.removeEventListener("scroll", f); window.removeEventListener("resize", f); };
    }, []);
    return active;
  }

  /* ---------- the bar, three ways (part 4) ---------- */
  const SECTIONS = [["how", "How it works"], ["agents", "Agents"], ["teams", "For teams"], ["pricing", "Pricing"]];
  const goTo = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  // the links, with the current section marked: a sliding highlight (A and C) or a dot under the word (B)
  function NavLinks({ active, slide }) {
    const reduce = useReducedMotion();
    return <nav className="nav-links" aria-label="Sections">{SECTIONS.map(([id, t]) => <a key={id} href={"#" + id} className={cx(active === id && "on")} aria-current={active === id ? "location" : undefined}>
      {slide && active === id && <motion.span className="nav-ind" layoutId="nav-ind" aria-hidden="true" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} />}
      <span className="nav-t">{t}</span>
    </a>)}</nav>;
  }
  function Nav({ onFind, onDemo }) {
    const app = useApp(); const [menu, setMenu] = useState(false); const [sheet, setSheet] = useState(false); const desk = app.bp === "desktop";
    const active = useActiveSection(SECTIONS.map(s => s[0]));
    const { scrollYProgress } = useScroll(); const reduce = useReducedMotion();
    const signInItems = [
      { label: "Sign in to", heading: true },
      { label: "Find your workspace", icon: "search", onClick: onFind },
      "-",
      { label: "Smart-Clearance staff", icon: "shield", onClick: () => open(LINKS.console) },
    ];
    const brand = <a className="nav-brand" href="#top" aria-label="Smart-Clearance, back to the top"><span className="nav-mark"><Mark size={OPT.nav === "a" ? 28 : 30} /></span><Wordmark size={16} /></a>;
    const mode = <span className="nav-mode"><ModeMenuButton /></span>;
    const signIn = <span className="nav-signin"><button type="button" className="nav-text" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(m => !m)}>Sign in</button><Menu open={menu} onClose={() => setMenu(false)} items={signInItems} width={268} label="Sign in to" /></span>;
    const demo = app.bp !== "phone" ? <Button variant="primary" pill className="nav-demo" onClick={() => onDemo()}>Book a demo</Button> : <IconButton icon="menu" label="Menu" onClick={() => setSheet(true)} />;
    const sheetEl = <Sheet open={sheet} onClose={() => setSheet(false)} title="Smart-Clearance" side="bottom" detent="medium">
      <div className="stack">
        <div className="list">{SECTIONS.map(([id, t]) => <button type="button" key={id} className="list-row" onClick={() => { setSheet(false); setTimeout(() => goTo(id), 60); }}><span className="lr-main"><span className="lr-title">{t}</span></span><Icon name="chevron-right" size={18} className="chev" /></button>)}</div>
        <Button variant="primary" size="lg" block onClick={() => { setSheet(false); onDemo(); }}>Book a demo</Button>
      </div>
    </Sheet>;
    if (OPT.nav === "a") {
      // A · the floating pill: one glass capsule, its own ground from the first paint, so it never muddies over the film
      return <header className="site-nav nav-a"><div className="nav-pill">
        {brand}
        {desk && <span className="nav-sep" aria-hidden="true" />}
        {desk && <NavLinks active={active} slide />}
        <span className="grow" />
        {mode}{signIn}{demo}
        {sheetEl}
      </div></header>;
    }
    if (OPT.nav === "c") {
      // C · the brand and the actions free on the edges, the links in one centred capsule
      return <header className="site-nav nav-c">
        {brand}
        {desk && <div className="nav-capsule"><NavLinks active={active} slide /></div>}
        <span className="grow" />
        {mode}{signIn}{demo}
        {sheetEl}
      </header>;
    }
    // B · the full-width bar, structured: brand | links centred | actions, with a progress line along its foot once scrolled
    return <header className="site-nav nav-b">
      <div className="nav-b-in">
        {brand}
        {desk && <NavLinks active={active} />}
        <span className="nav-actions">{mode}{signIn}{demo}</span>
      </div>
      <motion.span className="nav-progress" aria-hidden="true" style={{ scaleX: reduce ? 0 : scrollYProgress }} />
      {sheetEl}
    </header>;
  }

  /* ---------- 1. the first viewport, three ways (part 1): a longer film that loops and tells the story ---------- */
  // the story the film tells, four beats to a pass: the figures are money.js's
  const BEATS = [
    { at: "09:00", who: "The Watcher", t: `flags ${fmt.num(N)} packs at risk` },
    { at: "09:40", who: "You", t: `say yes once, ${fmt.inr(D.PLAN.net)} on screen`, human: true },
    { at: "09:41", who: "Outreach", t: `offers ${fmt.num(KL.units)} packs to ${SHOPS} kiranas` },
    { at: "11:30", who: "The Lister", t: `sends ${fmt.num(AW.units)} to a buyer, none to the bin` },
  ];
  // option C's day: the beats as hours of one day, then the night
  const DAY_BEATS = [
    { at: "09:00", who: "The Watcher", t: `flags ${fmt.num(N)} packs at risk` },
    { at: "09:40", who: "You", t: `say yes once, ${fmt.inr(D.PLAN.net)} on screen`, human: true },
    { at: "13:00", who: "Outreach", t: `${SHOPS} kiranas order ${fmt.num(KL.units)} packs` },
    { at: "17:30", who: "The Negotiator", t: `closes a buyer at ${rate(AW.price)} a pack` },
  ];
  const NIGHT_BEATS = [
    { at: "21:00", who: "Paperwork", t: "drafts the invoice and the credit note" },
    { at: "23:30", who: "The kiranas", t: `sell on; ${fmt.num(D.PLAN.soldUnits)} packs on tax invoices` },
    { at: "05:00", who: "Impact", t: `posts ${fmt.num(D.PLAN.kg)} kg kept out of landfill` },
    { at: "09:00", who: "The Watcher", t: "runs again, on the next batch" },
  ];
  const WORDS = ["buyer", "shelf", "invoice", "ledger line", "chance"];
  // the film drifts with the scroll, not with the clock: a slow rise and a touch of scale as the page is read
  function useFilmDrift(ref) {
    const reduce = useReducedMotion();
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 900], [0, reduce ? 0 : 120]);
    const scale = useTransform(scrollY, [0, 900], [1, reduce ? 1 : 1.06]);
    return { y, scale };
  }
  // the story strip under the film: the beat the film is on, with a line that fills through it
  function Story({ beats, i, p, label }) {
    return <div className="film-story" aria-label={label} role="group">
      {beats.map((b, j) => <span key={j} className={cx("fs", j === i && "now", j < i && "done", b.human && "human")}><span className="fs-at">{b.at}</span><span className="fs-t"><b>{b.who}</b> {b.t}</span><i className="fs-bar" aria-hidden="true" style={j === i ? { transform: `scaleX(${p})` } : undefined} /></span>)}
    </div>;
  }
  function Hero({ onDemo }) {
    const night = useTheme().resolved === "dark"; const reduce = useReducedMotion(); const app = useApp();
    const poster = IMG + (night ? "business-night.webp" : "business.webp");
    const media = useRef(null); const drift = useFilmDrift(media);
    useEffect(() => {
      const L = window.SC3_LOADER; if (!L) return; let live = true;
      const im = new Image(); im.decoding = "async"; im.src = poster;
      const done = () => { if (live && L.plateDrawn) requestAnimationFrame(() => L.plateDrawn(night)); };
      (im.decode ? im.decode() : new Promise(r => { im.onload = r; im.onerror = r; })).then(done, done);
      return () => { live = false; };
    }, [poster, night]);
    const [w, setW] = useState(reduce ? WORDS.length - 1 : 0);
    useEffect(() => { if (reduce || w >= WORDS.length - 1) return; const t = setTimeout(() => setW(w + 1), w === 0 ? 1600 : 1100); return () => clearTimeout(t); }, [w, reduce]);
    const copy = <div className="film-copy">
      <h1 id="hero-h" className="film-h">Every near-expiry carton gets a second <span className="film-word"><span className="sr-only">chance</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={WORDS[w]} aria-hidden="true" initial={reduce ? false : { opacity: 0, y: "0.5em" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "-0.5em" }} transition={{ duration: 0.42, ease: EASE }}>{WORDS[w]}</motion.span>
        </AnimatePresence></span>.</h1>
      <p className="film-sub">AI agents find the best exit for short-dated stock, and do the running around. You say yes once.</p>
      <div className="film-ctas"><Button variant="primary" size="lg" pill onClick={() => onDemo()}>Book a demo</Button><a className="btn btn-lg btn-pill film-ghost" {...linkProps(LINKS.demo)}><i aria-hidden="true"><Icon name="play" size={12} stroke={2.6} /></i>Watch the 6-minute demo</a></div>
    </div>;
    if (OPT.hero === "c") return <HeroDay night={night} reduce={reduce} poster={poster} copy={copy} drift={drift} media={media} />;
    if (OPT.hero === "b") return <HeroPush night={night} reduce={reduce} poster={poster} copy={copy} drift={drift} media={media} />;
    return <HeroLoop night={night} reduce={reduce} poster={poster} copy={copy} drift={drift} media={media} />;
  }
  // the film's clock: which beat a time falls in (n beats across a clip of `dur` seconds), and how far through it
  const beatAt = (t, dur, n) => { const seg = dur / n; const i = Math.min(n - 1, Math.floor(t / seg)); return { i, p: Math.min(1, (t - i * seg) / seg) }; };
  function useClock(vid, playing, dur, n) {
    const [clk, setClk] = useState({ i: 0, p: 0 });
    useEffect(() => {
      if (!playing) return; let raf;
      const tick = () => { const v = vid.current; if (v && v.duration) setClk(beatAt(v.currentTime, v.duration, n)); raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
    }, [playing, n]);
    return clk;
  }
  function Ctl({ playing, onToggle }) {
    return <div className="film-ctl"><button type="button" onClick={onToggle} aria-pressed={!playing}><Icon name={playing ? "pause" : "play"} size={16} />{playing ? "Pause" : "Play"}</button></div>;
  }
  // A · one take, ten seconds, looping: the whole business at work, the clip's last frame its first, so the loop is
  // seamless; the story strip names the beat the film is on
  function HeroLoop({ night, reduce, poster, copy, drift, media }) {
    const vid = useRef(null); const [playing, setPlaying] = useState(!reduce);
    const src = MEDIA78 + (night ? "a-loop-night.mp4" : "a-loop.mp4");
    useEffect(() => { setPlaying(!reduce); }, [src, reduce]);
    const toggle = () => { const v = vid.current; if (!v) return; if (playing) { v.pause(); setPlaying(false); } else { v.play(); setPlaying(true); } };
    const clk = useClock(vid, playing && !reduce, 10, BEATS.length);
    return <section className="hero film hero-a" id="top-hero" aria-labelledby="hero-h">
      <motion.div className="film-media" aria-hidden="true" ref={media} style={{ y: drift.y, scale: drift.scale }}>
        {reduce ? <img src={poster} alt="" /> : <video key={src} ref={vid} src={src} poster={poster} muted playsInline autoPlay loop preload="auto" />}
        <div className="film-shade" />
      </motion.div>
      {copy}
      <Story beats={BEATS} i={reduce ? BEATS.length - 1 : clk.i} p={reduce ? 1 : clk.p} label="The story the film tells" />
      {!reduce && <Ctl playing={playing} onToggle={toggle} />}
    </section>;
  }
  // B · the push-in: the camera glides from the whole business to the kirana lane over ten seconds, then dissolves
  // back to the wide shot and goes again (two players, a one-second cross-fade)
  function HeroPush({ night, reduce, poster, copy, drift, media }) {
    const src = MEDIA78 + (night ? "b-push-night.mp4" : "b-push.mp4");
    const va = useRef(null), vb = useRef(null); const [front, setFront] = useState(0); const [playing, setPlaying] = useState(!reduce); const handing = useRef(false);
    const cur = () => (front === 0 ? va : vb).current, other = () => (front === 0 ? vb : va).current;
    useEffect(() => { setFront(0); setPlaying(!reduce); handing.current = false; }, [src, reduce]);
    const onTime = () => { const v = cur(); if (!v || !v.duration || handing.current) return; if (v.currentTime >= v.duration - 1.0) { handing.current = true; const o = other(); o.currentTime = 0; o.play(); setFront(f => 1 - f); setTimeout(() => { v.pause(); handing.current = false; }, 1050); } };
    const toggle = () => { const v = cur(); if (!v) return; if (playing) { v.pause(); setPlaying(false); } else { v.play(); setPlaying(true); } };
    const clk = useClock(front === 0 ? va : vb, playing && !reduce, 10, BEATS.length);
    return <section className="hero film hero-b" id="top-hero" aria-labelledby="hero-h">
      <motion.div className="film-media" aria-hidden="true" ref={media} style={{ y: drift.y, scale: drift.scale }}>
        {reduce ? <img src={poster} alt="" /> : <>
          <video key={src + "a"} ref={va} className={cx("fx", front === 0 && "front")} src={src} poster={poster} muted playsInline autoPlay preload="auto" onTimeUpdate={front === 0 ? onTime : undefined} />
          <video key={src + "b"} ref={vb} className={cx("fx", front === 1 && "front")} src={src} muted playsInline preload="auto" onTimeUpdate={front === 1 ? onTime : undefined} />
        </>}
        <div className="film-shade" />
      </motion.div>
      {copy}
      <Story beats={BEATS} i={reduce ? BEATS.length - 1 : clk.i} p={reduce ? 1 : clk.p} label="The story the film tells" />
      {!reduce && <Ctl playing={playing} onToggle={toggle} />}
    </section>;
  }
  // C · one day, dawn to dusk: a ten-second clip from morning to night, then one from night to morning, chained
  // without a cut (each ends on the frame the other begins on). The light theme starts in the morning, the dark one
  // at night; the strip reads the hours of the day
  function HeroDay({ night, reduce, poster, copy, drift, media }) {
    const CLIPS = night ? ["c-dawn.mp4", "c-dusk.mp4"] : ["c-dusk.mp4", "c-dawn.mp4"];
    const va = useRef(null), vb = useRef(null); const [front, setFront] = useState(0); const [playing, setPlaying] = useState(!reduce);
    useEffect(() => { setFront(0); setPlaying(!reduce); }, [night, reduce]);
    const onEnded = () => { const o = (front === 0 ? vb : va).current; if (!o) return; o.currentTime = 0; o.play(); setFront(f => 1 - f); };
    const toggle = () => { const v = (front === 0 ? va : vb).current; if (!v) return; if (playing) { v.pause(); setPlaying(false); } else { v.play(); setPlaying(true); } };
    const clk = useClock(front === 0 ? va : vb, playing && !reduce, 10, 4);
    // which half of the day the clip in front shows
    const dayHalf = (front === 0) !== night; const beats = dayHalf ? DAY_BEATS : NIGHT_BEATS;
    return <section className="hero film hero-c" id="top-hero" aria-labelledby="hero-h">
      <motion.div className="film-media" aria-hidden="true" ref={media} style={{ y: drift.y, scale: drift.scale }}>
        {reduce ? <img src={poster} alt="" /> : <>
          <video key={CLIPS[0] + "a"} ref={va} className={cx("fx", front === 0 && "front")} src={MEDIA78 + CLIPS[0]} poster={poster} muted playsInline autoPlay preload="auto" onEnded={front === 0 ? onEnded : undefined} />
          <video key={CLIPS[1] + "b"} ref={vb} className={cx("fx", front === 1 && "front")} src={MEDIA78 + CLIPS[1]} muted playsInline preload="auto" onEnded={front === 1 ? onEnded : undefined} />
        </>}
        <div className="film-shade" />
      </motion.div>
      {copy}
      <Story beats={beats} i={reduce ? 3 : clk.i} p={reduce ? 1 : clk.p} label={dayHalf ? "The day, hour by hour" : "The night, hour by hour"} />
      {!reduce && <Ctl playing={playing} onToggle={toggle} />}
    </section>;
  }

  /* ---------- 2. the statement ---------- */
  function Word({ p, a, b, text, reduce }) {
    const o = useTransform(p, [a, b], [0, 1]);
    return <span className="sw">{text}<motion.span className="lit" aria-hidden="true" style={{ opacity: reduce ? 1 : o }}>{text}</motion.span></span>;
  }
  function Statement({ text, id }) {
    const ref = useRef(null); const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
    const words = text.split(" "); const n = words.length;
    return <section className="say" id={id} aria-label="In short">
      <p ref={ref}>{words.map((w, i) => <React.Fragment key={i}><Word p={scrollYProgress} a={i / n * 0.92} b={Math.min(1, i / n * 0.92 + 0.1)} text={w} reduce={reduce} />{i < n - 1 ? " " : ""}</React.Fragment>)}</p>
    </section>;
  }

  /* ---------- 3. the agents at work on the table (SC-60), the day plate by option (part 2) ---------- */
  const TAB_AR = 2752 / 1536;
  const PHONE = { x: 0.633, y: 0.152, w: 0.097, h: 0.398 };
  const POST = { data: { x: 0.14, y: 0.62, side: "left" }, watcher: { x: 0.25, y: 0.47 }, vision: { x: 0.33, y: 0.66 }, valuer: { x: 0.16, y: 0.74, side: "left" }, router: { x: 0.37, y: 0.77 },
    you: { x: 0.615, y: 0.4, side: "left" }, outreach: { x: 0.47, y: 0.58 }, lister: { x: 0.6, y: 0.64 }, negotiator: { x: 0.635, y: 0.77, side: "left" }, paperwork: { x: 0.755, y: 0.58 }, impact: { x: 0.91, y: 0.79, side: "left" } };
  const WHERE = { data: "at the godown", watcher: "at the godown", vision: "at the godown", valuer: "at the godown", router: "at the godown", you: "on your phone", outreach: "at the kiranas", lister: "at the buyer's bay", negotiator: "at the buyer's truck", paperwork: "on your phone", impact: "at the landfill" };
  const TAGS = [
    { id: "kirana", at: { x: 0.49, y: 0.55 }, name: "Kiranas", line: got => `${fmt.num(got.kirana)} of ${fmt.num(KL.units)} packs · ${SHOPS} shops` },
    { id: "expiresoon", at: { x: 0.66, y: 0.6 }, name: "A buyer elsewhere", line: got => `${fmt.num(got.expiresoon)} of ${fmt.num(AW.units)} packs · ${rate(AW.price)} a pack` },
    { id: "dump", at: { x: 0.84, y: 0.72 }, name: "Landfill", line: (got, done) => done ? `${fmt.num(D.PLAN.kg)} kg kept out` : `the bin would cost ${fmt.inr(-BIN)}` },
  ];
  const DROP = { kirana: { x: 0.49, y: 0.63 }, expiresoon: { x: 0.67, y: 0.71 } };
  const ORDER = ["data", "watcher", "vision", "valuer", "router", "you", "outreach", "lister", "negotiator", "paperwork", "impact"];
  const NS = ORDER.length, YES = ORDER.indexOf("you"), OUT = ORDER.indexOf("outreach"), LIST = ORDER.indexOf("lister");
  const PACE = { agent: 1400, you: 1800 };
  const AFTER = ["outreach", "lister", "negotiator", "paperwork", "impact"], BEFORE = ORDER.slice(0, YES), ROUTER = ORDER.indexOf("router");
  const curve = (a, b, lift) => `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y}`;
  function useCover(stageRef, ar, pan = 0.5, panY = 0.5) {
    const [fit, setFit] = useState(null);
    useLayoutEffect(() => {
      const el = stageRef.current; if (!el) return;
      const measure = () => { const w = el.clientWidth, h = el.clientHeight; const s = Math.max(w / ar, h); const pw = s * ar, ph = s; setFit({ w, h, pw, ph, x: (w - pw) * pan, y: (h - ph) * panY }); };
      measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
    }, [ar, pan, panY]);
    return fit;
  }
  const at = (fit, p) => ({ left: fit.x + p.x * fit.pw, top: fit.y + p.y * fit.ph });
  const on = (fit, p) => ({ left: p.x * fit.pw, top: p.y * fit.ph });
  function Frag({ id }) {
    switch (id) {
      case "data": return <><Product name="pack-snack-plain" size={56} /><span className="k">{fmt.num(BATCH.units)} packs · selling <b>{BATCH.sellPerDay}</b> a day · <b>{BATCH.daysLeft}</b> days to the date</span></>;
      case "watcher": return <><span className="num red">{fmt.num(N)}</span><span className="k">packs won't sell in time</span><GateChips gates={D.RISK.gates} size="sm" /></>;
      case "vision": return <><Product name="phone-scan" size={56} /><span className="k">One label photo from the godown · <b>the date matches</b> the export</span></>;
      case "valuer": return <>{[["kirana", "Kiranas"], ["expiresoon", "ExpireSoon"], ["staff", "Staff sale"], ["foodbank", "Food bank"], ["writeoff", "The bin"]].map(([id, n]) => <span key={id} className="k"><i className={"ex-dot " + (id === "writeoff" ? "bin" : id)} aria-hidden="true" />{n} <b style={id === "writeoff" ? { color: "var(--red-text)" } : undefined}>{fmt.inr2(row(id).net)}</b></span>)}</>;
      case "router": return <><div className="m-split" aria-hidden="true"><span className="k" style={{ flexGrow: KL.units }} /><span className="e" style={{ flexGrow: ESL.units }} /></div><span className="k"><i className="ex-dot kirana" aria-hidden="true" /><b>{fmt.num(KL.units)}</b> to {SHOPS} kiranas</span><span className="k"><i className="ex-dot expiresoon" aria-hidden="true" /><b>{fmt.num(AW.units)}</b> to one buyer</span></>;
      case "you": return <><Money value={D.PLAN.net} /><span className="k">on screen, against {fmt.inr(-BIN)} to destroy it</span><span className="btn btn-approve"><Icon name="check" size={16} />Approve · release the agents</span></>;
      case "outreach": return <><span className="hi" lang="hi">{OFFER.title}</span><span className="k">to <b>{SHOPS}</b> kiranas in Hindi · buy {SCHEME.buy}, get {SCHEME.free} free · 48 hours</span></>;
      case "lister": return <><Product name="marketplace-bag" size={56} /><span className="k"><b>{fmt.num(AW.units)}</b> packs listed in the distributor's name · reserve {rate(M.RULES.negotiation.reservePerUnit)}</span></>;
      case "negotiator": return <><span className="k">A bid of <b>{fmt.inr(BID)}</b></span><Icon name="arrow-right" size={16} /><span className="k">countered to <b>{rate(AW.price)}</b>, accepted</span><span className="k">· token <b>{fmt.inr(AW.token)}</b></span></>;
      case "paperwork": return <><Product name="documents" size={56} /><span className="k">The distributor's invoice · the brand's credit note <b>{fmt.inr(D.SUPPORT.total)}</b> · the GST memo</span></>;
      case "impact": return <><span className="num">{fmt.num(D.PLAN.kg)} kg</span><span className="k">kept out of landfill · <b>{fmt.inr(D.ACTUAL.net)}</b> recovered · 0 cartons destroyed</span></>;
      default: return null;
    }
  }
  function PhoneScreen({ phase, lit }) {
    const list = phase === "placed" ? AFTER : BEFORE;
    return <div className="ps" aria-hidden="true">
      <div className="top"><span className="who"><Mark size={24} /><b>Route Room</b></span>{phase === "placed" ? <Badge tone="green" icon="check">Placed · 09:40</Badge> : phase === "plan" ? <Badge tone="amber" dot>Waiting for you</Badge> : <Badge tone="red" dot>At risk</Badge>}</div>
      {phase === "placed" ? <><div className="placed"><span className="t">Plan placed</span><Money value={D.PLAN.swing} /><p>better than the bin, on one batch of chips.</p></div>
          <div className="work">{list.map((id, i) => <span key={id} className={cx("w", i < lit && "on")}><i><Icon name={AGENT[id].icon} size={11} stroke={2.4} /></i><b>{AGENT[id].name}</b><span>· {AGENT[id].did}</span></span>)}</div></>
        : phase === "building" ? <><h4>{SKU.name}</h4><div className="big"><span className="num red">{fmt.num(N)}</span><span>packs won't sell in the {BATCH.daysLeft} days left</span></div>
          <div className="work">{list.map((id, i) => <span key={id} className={cx("w", i < lit && "on")}><i><Icon name={AGENT[id].icon} size={11} stroke={2.4} /></i><b>{AGENT[id].name}</b><span>· {i < lit ? AGENT[id].did : "waiting"}</span></span>)}</div></>
        : <><h4>Approve the plan</h4><div className="big"><Money value={D.PLAN.net} /><span>net recovered, {D.PLAN.pctMRP}% of MRP</span></div>
          <div><div className="r"><span>Instead of destroying</span><b className="red">{fmt.inr(-BIN)}</b></div><div className="r"><span>{fmt.num(KL.units)} packs to {SHOPS} kiranas</span><b>{fmt.inr(KL.net)}</b></div><div className="r"><span>{fmt.num(ESL.units)} packs on ExpireSoon</span><b>{fmt.inr(ESL.net)}</b></div></div>
          <span className="btn btn-approve btn-lg"><Icon name="check" size={18} />Approve · release the agents</span></>}
    </div>;
  }
  // the day plate: A, the plate re-lit by Qwen (the same geometry, an edit of the approved plate); B, the approved plate
  // graded (warmer, deeper). The night plate is the one that is
  const DAY_PLATE = { a: IMG78 + "table-warm.webp", b: IMG78 + "table-graded.webp" };
  function Table() {
    const night = useTheme().resolved === "dark"; const reduce = useReducedMotion(); const app = useApp(); const desk = app.bp === "desktop";
    const stage = useRef(null); const fit = useCover(stage, TAB_AR, desk ? 0.5 : 0.42, 0.5);
    const seen = useInView(stage, { amount: 0.6 });
    const [s, setS] = useState(reduce ? NS : -1); const [hold, setHold] = useState(false); const [run, setRun] = useState(0);
    useEffect(() => { if (reduce) return; if (s === -1 && seen) setS(0); }, [seen, reduce, s]);
    useEffect(() => { if (reduce || hold || !seen || s < 0 || s >= NS) return; const t = setTimeout(() => setS(s + 1), ORDER[s] === "you" ? PACE.you : PACE.agent); return () => clearTimeout(t); }, [s, hold, seen, reduce]);
    const go = i => { setHold(true); setS(i); };
    const replay = () => { setHold(false); setGot({ kirana: 0, expiresoon: 0 }); setRun(r => r + 1); setS(0); };
    const agent = s >= 0 && s < NS ? ORDER[s] : null; const done = s >= NS; const working = agent != null;
    const W = 1000, H = Math.round(W / TAB_AR);
    let cam = { tx: 0, ty: 0, sc: 1 };
    if (fit && working) {
      const sc = desk ? 1.6 : 1.45; const f = at(fit, !desk && agent === "you" ? { x: 0.66, y: PHONE.y + PHONE.h / 2 } : POST[agent]);
      const cx0 = fit.w * 0.5, cy0 = fit.h * 0.42;
      let tx = cx0 - f.left * sc, ty = cy0 - f.top * sc;
      tx = Math.min(-fit.x * sc, Math.max(fit.w - (fit.x + fit.pw) * sc, tx)); ty = Math.min(-fit.y * sc, Math.max(fit.h - (fit.y + fit.ph) * sc, ty));
      cam = { tx, ty, sc };
    }
    const iz = 1 / cam.sc;
    const dots = useRef([]), paths = useRef({}); const [got, setGot] = useState(reduce ? { kirana: KL.units, expiresoon: AW.units } : { kirana: 0, expiresoon: 0 });
    const from = { x: (PHONE.x + PHONE.w / 2) * W, y: (PHONE.y + PHONE.h / 2) * H };
    const routes = { kirana: curve(from, { x: DROP.kirana.x * W, y: DROP.kirana.y * H }, 40), expiresoon: curve(from, { x: DROP.expiresoon.x * W, y: DROP.expiresoon.y * H }, 30) };
    const DOTS = useMemo(() => { const out = []; const nk = Math.round(KL.units / 50), ne = Math.round(AW.units / 50); for (let i = 0; i < nk; i++) out.push("kirana"); for (let i = 0; i < ne; i++) out.push("expiresoon"); return out; }, []);
    const sent = useRef({ kirana: false, expiresoon: false }); const ctrls = useRef([]);
    useEffect(() => { if (s === 0 || s === -1) sent.current = { kirana: false, expiresoon: false }; }, [s, run]);
    useEffect(() => () => { ctrls.current.forEach(c => c.stop()); ctrls.current = []; }, [run]);
    useEffect(() => {
      if (reduce) return;
      const id = s === OUT ? "kirana" : s === LIST ? "expiresoon" : null; if (!id || sent.current[id]) return; sent.current[id] = true;
      const path = paths.current[id]; if (!path) return; const L = path.getTotalLength(); const mine = DOTS.map((d, i) => [d, i]).filter(([d]) => d === id); let arrived = 0;
      mine.forEach(([, i], j) => { const c = dots.current[i]; if (!c) return; ctrls.current.push(animate(0, 1, { duration: 0.8, delay: 0.1 + j * 0.07, ease: [0.45, 0, 0.4, 1],
        onUpdate: v => { const q = path.getPointAtLength(v * L); c.setAttribute("cx", q.x); c.setAttribute("cy", q.y); c.setAttribute("opacity", v < 0.06 ? v * 16 : v > 0.94 ? Math.max(0, (1 - v) * 16) : 1); },
        onComplete: () => { c.setAttribute("opacity", 0); arrived += 1; setGot(g => ({ ...g, [id]: Math.round((id === "kirana" ? KL.units : AW.units) * arrived / mine.length) })); } })); });
    }, [s, reduce, run]);
    useEffect(() => { if (done) setGot({ kirana: KL.units, expiresoon: AW.units }); }, [done]);
    const a = agent && AGENT[agent]; const human = agent === "you";
    const mini = fit ? { ...on(fit, PHONE), width: PHONE.w * fit.pw, height: PHONE.h * fit.ph, "--s": (PHONE.w * fit.pw) / 360 } : null;
    const card = a && <div className={cx("tb-focus", human && "human")} role="group" aria-live="polite">
      <span className="icn" aria-hidden="true"><Icon name={a.icon} size={26} stroke={2} /></span>
      <header><span className="n">{s + 1} of {NS}</span><h3>{a.name}</h3><span>{WHERE[agent]}</span></header>
      <p>{a.did}</p>
      <div className="frag"><Frag id={agent} /></div>
      {desk && <div className="rail" role="group" aria-label="The agents, in order">{ORDER.map((id, i) => <button key={id} type="button" className={cx(i < s && "on", AGENT[id].human && "human")} aria-current={i === s ? "step" : undefined} onClick={() => go(i)}><i aria-hidden="true"><Icon name={AGENT[id].icon} size={10} stroke={2.4} /></i>{AGENT[id].name}</button>)}</div>}
    </div>;
    const plate = night ? IMG + "table-night.webp" : DAY_PLATE[OPT.scene] || DAY_PLATE.a;
    return <section id="agents" className={cx("sec-table sc78-scene", "scene-" + OPT.scene)} aria-labelledby="tb-h">
      <header className="tb-head"><h2 id="tb-h" className="sec-h plain">Five exits, one batch. Ten agents at work.</h2><p className="sec-sub">{fmt.num(N)} packs of masala chips that won't sell in the {BATCH.daysLeft} days they have left, on the table. The agents work the batch stop by stop; a person says yes once; the packs leave for the kiranas and a buyer, and nothing goes to the bin.</p></header>
      <div className={cx("tb-stage", working && "working")} ref={stage}>
        <div className="tb-world" style={{ transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.sc})` }}>
          <img className="tb-plate" style={fit ? { left: fit.x, top: fit.y, width: fit.pw, height: fit.ph } : { objectPosition: `${(desk ? 0.5 : 0.42) * 100}% 50%` }} src={plate} alt={`A ${night ? "lamp-lit evening" : "morning"} table by a window: a hand holds a phone over a handmade miniature of a snack trade, a tiny godown full of cartons, a lane of kirana shops, a wholesale warehouse with a blue truck, a community kitchen, a closed dump yard in the far corner, a steel tumbler of chai, and a thin glowing green path along the table.`} />
          {fit && <div className="tb-layer" style={{ left: fit.x, top: fit.y, width: fit.pw, height: fit.ph }}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
              {Object.entries(routes).map(([id, d]) => <path key={id} ref={el => { paths.current[id] = el; }} className="tb-path" d={d} />)}
              {DOTS.map((id, i) => <circle key={i + ":" + run} ref={el => { dots.current[i] = el; }} className={"tb-dot " + id} r="9" opacity="0" />)}
            </svg>
            {mini && <div className="tb-mini" style={mini} aria-hidden="true"><div className="tb-mini-in"><PhoneScreen phase={done || s > YES ? "placed" : s >= ROUTER ? "plan" : "building"} lit={done ? AFTER.length : s > YES ? s - YES : s + 1} /></div></div>}
            {TAGS.map(t => <span key={t.id} className={cx("tb-tag", t.id, got[t.id] > 0 && "in")} style={{ ...on(fit, t.at), "--iz": iz }} aria-hidden="true"><span className="tb-tag-body"><b><i className={"ex-dot " + (t.id === "dump" ? "bin" : t.id)} />{t.name}</b><span>{t.line(got, done)}</span></span><span className="stem" /></span>)}
            <ul className="sr-only" aria-label="The agents at their posts">{ORDER.map(id => <li key={id}>{AGENT[id].name}, {WHERE[id]}: {AGENT[id].did}</li>)}</ul>
            {ORDER.map((id, i) => { const ag = AGENT[id]; const st = i < s || done ? "on" : i === s ? "now on" : "later"; return <span key={id} className={cx("tb-node", st, ag.human && "human", POST[id].side === "left" && "left")} style={{ ...on(fit, POST[id]), "--iz": iz }} aria-hidden="true"><i className="dot"><Icon name={ag.icon} size={13} stroke={2.4} /></i><span className="name">{ag.name}</span></span>; })}
          </div>}
        </div>
        <div className="tb-shade" aria-hidden="true" />
        <AnimatePresence mode="wait">{a && <motion.div key={agent} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }} style={{ display: "contents" }}>{card}</motion.div>}</AnimatePresence>
        {done && <div className="tb-result" role="status"><b>Sold, not binned.</b><span className="did">{fmt.inr(D.ACTUAL.net)} recovered, instead of {fmt.inr(-BIN)} to destroy it</span>{!reduce && <button type="button" className="replay" onClick={replay}><Icon name="rotate-ccw" size={16} />Replay</button>}</div>}
        {!reduce && working && <div className="tb-ctl"><button type="button" className="replay" aria-pressed={hold} onClick={() => setHold(h => !h)}><Icon name={hold ? "play" : "pause"} size={16} />{hold ? "Play" : "Pause"}</button></div>}
      </div>
    </section>;
  }

  /* ---------- 4. the chapters, as they are ---------- */
  function Chapter({ id, tone, title, lede, who, person, children, wide }) {
    const { card, rise } = useRise(0.2);
    return <motion.section id={id} className={cx("ch", "tone-" + tone)} aria-labelledby={id + "-h"} {...card}>
      <div className={cx("ch-in", wide && "wide")}>
        <div className="ch-copy">
          <motion.h2 id={id + "-h"} className="ch-h" {...rise(0)}>{title}</motion.h2>
          <motion.p className="ch-lede" {...rise(1)}>{lede}</motion.p>
          {who && <motion.span {...rise(2)}><AgentChips who={who} person={person} /></motion.span>}
        </div>
        <div className="ch-stage">{children}</div>
      </div>
    </motion.section>;
  }
  function AlertCard() {
    const { shown, card, rise } = useRise(); const rolled = useLit(shown, 1, 490, 0) > 0;
    return <motion.div className="m-card" role="group" aria-label="The Watcher's alert" {...card}>
      <motion.div className="m-head" {...rise(0)}><span className="chip-agent on"><i aria-hidden="true" />Watcher · 09:00</span><Badge tone="red" dot>At risk</Badge></motion.div>
      <motion.div className="m-batch" {...rise(1)}><Product name="pack-snack-plain" size={52} /><span><b>{SKU.name}</b><span>{fmt.num(BATCH.units)} packs in a distributor's godown, {DIST.city}</span></span></motion.div>
      <motion.div className="m-gates" {...rise(2)}><GateChips gates={D.RISK.gates} /></motion.div>
      <motion.div className="m-big" {...rise(3)}><span className="num"><Roll key={rolled ? "on" : "off"} value={N} from={rolled ? 0 : undefined} /></span><span>packs won't sell in the {BATCH.daysLeft} days they have left</span></motion.div>
    </motion.div>;
  }
  const PRICED = [
    { id: "kirana", name: "Kiranas", s: `up to ${fmt.num(row("kirana").capacity)} packs in ${M.RULES.kiranaWindowDays} days` },
    { id: "expiresoon", name: "ExpireSoon", s: "no limit; listed in the distributor's name" },
    { id: "staff", name: "Staff sale", s: `up to ${fmt.num(row("staff").capacity)} packs at the godown` },
    { id: "foodbank", name: "Food bank", s: "a donation reverses the GST credit" },
    { id: "writeoff", dot: "bin", name: "The bin", s: "stock, GST credit, disposal and EPR" },
  ];
  function PricesCard() {
    const { card, rise } = useRise();
    return <motion.div className="m-card" role="group" aria-label="The Valuer's prices, net a pack" {...card}>
      <motion.div className="m-head" {...rise(0)}><span className="chip-agent on"><i aria-hidden="true" />Valuer</span><span className="t-footnote subtle">net a pack, after costs</span></motion.div>
      {PRICED.map((p, i) => <motion.div key={p.id} className={cx("m-row", p.dot === "bin" ? "bin" : !planned(p.id) && "off")} {...rise(i + 1)}>
        <span className="k"><i className={"ex-dot " + (p.dot || p.id)} aria-hidden="true" />{p.name}</span><span className="v">{fmt.inr2(row(p.id).net)}</span><span className="s">{p.s}</span>
      </motion.div>)}
      <motion.div {...rise(PRICED.length + 1)}>
        <div className="m-split-cap"><span>The Router's split</span><span>{fmt.num(N)} packs</span></div>
        <div className="m-split" aria-hidden="true"><span className="k" style={{ flexGrow: KL.units }} /><span className="e" style={{ flexGrow: ESL.units }} /></div>
        <div className="m-split-legend"><span><i className="ex-dot kirana" aria-hidden="true" />{fmt.num(KL.units)} to {SHOPS} kiranas</span><span><i className="ex-dot expiresoon" aria-hidden="true" />{fmt.num(ESL.units)} on ExpireSoon</span></div>
      </motion.div>
    </motion.div>;
  }
  const RELEASED = agentsAt("execute", "settle", "report");
  function PlanCard({ still }) {
    const { shown, card, rise } = useRise(); const rolled = useLit(shown, 1, 270, 0) > 0; const lit = useLit(shown, RELEASED.length, 900, 220);
    return <motion.div className="m-card yes" role="group" aria-label="The plan, waiting for one yes" {...card}>
      <motion.div className="m-head" {...rise(0)}><b>Approve the plan</b><Badge tone="amber" dot>Waiting for you</Badge></motion.div>
      <motion.div className="m-big flush" {...rise(1)}><Money key={rolled ? "on" : "off"} value={D.PLAN.net} roll from={rolled ? 0 : undefined} /><span>recovered, against {fmt.inr(-BIN)} to destroy it</span></motion.div>
      <motion.div className="m-row" {...rise(2)}><span className="k"><i className="ex-dot kirana" aria-hidden="true" />{fmt.num(KL.units)} packs to {SHOPS} kiranas</span><span className="v">{fmt.inr(KL.net)}</span></motion.div>
      <motion.div className="m-row" {...rise(3)}><span className="k"><i className="ex-dot expiresoon" aria-hidden="true" />{fmt.num(ESL.units)} packs on ExpireSoon</span><span className="v">{fmt.inr(ESL.net)}</span></motion.div>
      <motion.div className="m-go" {...rise(4)}><span className="btn btn-approve btn-lg"><Icon name="check" size={18} />Approve · release the agents</span></motion.div>
      <motion.div className="m-after" {...rise(5)}>{RELEASED.map((w, i) => <span key={w} className={cx("chip-agent", i < lit && "on")}><i aria-hidden="true" />{w}</span>)}</motion.div>
    </motion.div>;
  }
  function PaperCard({ lit = true, rise }) {
    const Tag = rise ? motion.div : "div";
    return <Tag className="m-card" role="group" aria-label="Paperwork: the documents, drafted" {...(rise || {})}>
      <div className="m-head"><span className={cx("chip-agent", lit && "on")}><i aria-hidden="true" />Paperwork</span><Badge tone="gray">drafted</Badge></div>
      <div className="m-batch"><Product name="documents" size={52} /><span><b>Everything finance needs, drafted</b><span>each on paper, with who keeps what</span></span></div>
      {[["The distributor's invoice to the buyer", "IGST 5%"], ["The brand's price-support credit note", fmt.inr(D.SUPPORT.total)], ["GST input credit memo", fmt.inr(D.PLAN.itcRetained)]].map(([k, v]) => <div key={k} className="m-row"><span className="k">{k}</span><span className="v">{v}</span></div>)}
    </Tag>;
  }
  function WorkCards() {
    const { shown, card, rise } = useRise(0.2); const lit = useLit(shown, 3, 300, 420); const p0 = OFFER;
    return <motion.div className="ch-row three" {...card}>
      <motion.div className="m-card" role="group" aria-label="Outreach: the kirana offer, in Hindi" {...rise(0)}>
        <div className="m-head"><span className={cx("chip-agent", lit > 0 && "on")}><i aria-hidden="true" />Outreach · 09:41</span><Badge tone="green" icon="gift">{SCHEME.buy} + {SCHEME.free}</Badge></div>
        <div className="m-batch"><Product name="pack-snack-plain" size={52} /><span><b lang="hi" className="hi">{p0.title}</b><span>{fmt.inr2(KL.packPrice)} a pack · MRP {fmt.inr(SKU.mrp)} · 48 hours</span></span></div>
        <p lang="hi" className="hi m-hindi">{p0.body}</p>
        <div className="m-row"><span className="k">{fmt.num(SHOPS)} shops ordered</span><span className="v">{fmt.num(KL.units)} packs</span></div>
      </motion.div>
      <motion.div className="m-card violet" role="group" aria-label="Lister and Negotiator: the lot on ExpireSoon" {...rise(1)}>
        <div className="m-head"><span className={cx("chip-agent", lit > 1 && "on")}><i aria-hidden="true" />Lister · Negotiator</span><Badge tone="violet" dot>ExpireSoon</Badge></div>
        <div className="m-batch"><Product name="marketplace-bag" size={52} /><span><b>{fmt.num(AW.units)} packs, listed in the distributor's name</b><span>reserve {rate(M.RULES.negotiation.reservePerUnit)} · hidden inside the brand's territories</span></span></div>
        <div className="m-row"><span className="k">A buyer bids</span><span className="v">{rate(BID)}</span></div>
        <div className="m-row"><span className="k">Countered, accepted</span><span className="v">{rate(AW.price)} a pack</span></div>
        <div className="m-row"><span className="k">Token paid</span><span className="v">{fmt.inr(AW.token)}</span></div>
      </motion.div>
      <PaperCard lit={lit > 2} rise={rise(2)} />
    </motion.div>;
  }
  function Chapters() {
    return <>
      <Chapter id="watch" tone="green" title="Spot it while there is time to sell" lede="Every morning at 09:00 the Watcher checks each batch against its date and the quick-commerce shelf-life rules. Vision reads the label photo from the godown to be sure." who={agentsAt("connect", "detect", "verify")}><AlertCard /></Chapter>
      <Chapter id="price" tone="sunken" title="Price every exit, the bin included" lede={`Kiranas on a ${SCHEME.free}-free-with-${SCHEME.buy} scheme, a clearance marketplace, a staff sale at the godown, a food bank: the Valuer prices each against the true cost of destroying the stock, and the Router splits the batch within each exit's limits.`} who={agentsAt("value", "decide")}><PricesCard /></Chapter>
      <Chapter id="yes" tone="amber" title="Say yes once." lede="A person approves the plan with the money on screen. Nothing is listed, messaged or shipped before that tap." who={["a person"]} person><PlanCard /></Chapter>
      <Chapter id="work" tone="night" title="The agents do the rest." lede="They send the kirana offers in Hindi, list the lot in the distributor's name, answer bids, draft the invoice, credit note and GST memo, and post the impact." who={agentsAt("execute", "settle", "report")} wide><WorkCards /></Chapter>
    </>;
  }

  /* ---------- 5. the ledger, as it is ---------- */
  const LEDGER_LINES = rolled => [
    { k: "Recovered, net", s: `${fmt.inr(KL.net)} from ${SHOPS} kiranas after the van, ${fmt.inr(ES_NET)} from a marketplace buyer after the fee`, v: <Money value={D.ACTUAL.net} roll={rolled} from={rolled ? 0 : undefined} /> },
    { k: "Better than the bin", s: `against ${fmt.inr(-BIN)} to destroy the stock: the goods, the GST credit, disposal and EPR`, v: <Money value={D.ACTUAL.swing} roll={rolled} from={rolled ? 0 : undefined} /> },
    { k: "GST input credit kept", s: "goods supplied under tax invoices, so the Section 17(5)(h) reversal does not apply", v: <Money value={D.PLAN.itcRetained} roll={rolled} from={rolled ? 0 : undefined} /> },
    { k: "Kept out of landfill", s: `${fmt.num(D.PLAN.co2)} kg CO₂e, indicative`, v: <span className="num"><Roll value={D.PLAN.kg} from={rolled ? 0 : undefined} /> kg</span> },
    { k: "Cartons destroyed", s: `${fmt.num(D.PLAN.soldUnits)} packs sold on tax invoices`, v: <span className="num">0</span>, zero: true },
  ];
  function Ledger() {
    const { shown, card, rise } = useRise(0.3); const rolled = useLit(shown, 1, 300, 0) > 0;
    const lines = LEDGER_LINES(rolled);
    return <section className="sec-ledger" id="ledger" aria-labelledby="ledger-h">
      <motion.div className="ledger" role="group" aria-labelledby="ledger-h" {...card}>
        <motion.div className="ledger-head" {...rise(0)}><b><i aria-hidden="true"><Icon name="leaf" size={14} stroke={2.2} /></i><span id="ledger-h">Impact · the ledger for one batch</span></b><span>posted after the return window</span></motion.div>
        {lines.map((l, i) => <motion.div key={l.k} className={cx("ledger-row", l.zero && "zero")} {...rise(i + 1)}><span className="k">{l.k}</span><span className="v">{l.v}</span><span className="s">{l.s}</span></motion.div>)}
        <motion.div className="ledger-foot" {...rise(lines.length + 1)}><span>BRSR Principle 6 · two rows an auditor can follow back to the batch</span><span>one illustrative batch</span></motion.div>
      </motion.div>
      <p className="ledger-note">An illustrative batch. Every figure is worked out from the journey map.</p>
    </section>;
  }
  function DemoPill({ hidden }) {
    return <a className={cx("pill", hidden && "off")} {...linkProps(LINKS.demo)} aria-label="Watch the 6-minute demo">
      <span className="thumb" aria-hidden="true"><img src={(window.SC3_IMG || "system/img/").replace(/img\/$/, "media/") + "carton-loop-poster.webp"} alt="" /><i><Icon name="play" size={12} stroke={2.6} /></i></span>
      <span>Watch the 6-minute demo</span>
    </a>;
  }

  /* ---------- 6. a workspace per manufacturer, three ways (part 3) ---------- */
  const TEAMS = [
    { id: "supply", icon: "route", t: "Supply chain", route: "route", d: "One tap to approve a plan, with the money on screen." },
    { id: "finance", icon: "receipt", t: "Finance", route: "paperwork", d: "The invoice, credit note and GST memo, drafted." },
    { id: "impact", icon: "leaf", t: "Sustainability", route: "report", d: "A BRSR line an auditor can follow back to the batch." },
    { id: "dist", icon: "handshake", t: "Distributors", route: "permissions", d: "Nothing listed in their name without their permission." },
  ];
  const CONN = ["dms", "tally", "bq", "sso", "expiresoon", "irp", "whatsapp"].map(id => P.CONNECTORS.find(c => c.id === id)).filter(Boolean);
  const ADDR = [
    { id: "brand", url: "your-brand.smartclearance.com", live: true },
    { id: "company", url: "your-company.smartclearance.com" },
    { id: "group", url: "your-group.smartclearance.com" },
  ];
  function WsHead() { return <header className="sec-head"><h2 id="ws-h" className="sec-h plain">Your own workspace, set up for your supply chain.</h2><p className="sec-sub">Each manufacturer gets its own address, configured for how its stock really moves.</p></header>; }
  function WsTail({ urls }) {
    return <>
      {urls}
      <ul className="teams" aria-label="What each team gets">{TEAMS.map(t => <li key={t.t} className="team"><Icon name={t.icon} size={26} /><b>{t.t}</b><p>{t.d}</p></li>)}</ul>
      <div className="conn"><ul className="conn-list" aria-label="Works with">{CONN.map(c => <li key={c.id}>{c.name}{c.status === "soon" && <span className="soon"> · soon</span>}</li>)}</ul></div>
    </>;
  }
  // an address on a stem, standing at its island's foot
  function AddrTag({ a, x, y, below }) {
    const body = <span className="body"><i aria-hidden="true" />{a.url}{a.live && <span className="isl-live"> · live</span>}</span>, stem = <span className="stem" aria-hidden="true" />;
    return <li className={cx("isd-tag", below && "below", a.live && "live")} style={{ "--x": x, "--y": y }}>{below ? <>{stem}{body}</> : <>{body}{stem}</>}</li>;
  }
  // A · the islands in depth: a new 16:9 plate, three islands at three distances with their products drawn in, under
  // a sky that moves with the scroll (the plate, the clouds and the tags at three speeds). Everything on the plate is
  // placed from the plate's own drawn rectangle, measured on the plate (fractions of its width and height)
  const ISD_AR = 2752 / 1536;
  const ISD = { brand: { x: 0.21, y: 0.775 }, company: { x: 0.53, y: 0.565 }, group: { x: 0.83, y: 0.475 }, hub: { x: 0.51, y: 0.905 } };
  function useIslandFit(stageRef, pan, over = 1.08) {
    const [fit, setFit] = useState(null);
    useLayoutEffect(() => {
      const el = stageRef.current; if (!el) return;
      const measure = () => { const w = el.clientWidth, h = el.clientHeight; const pw = Math.max(w, h * over * ISD_AR), ph = pw / ISD_AR; setFit({ w, h, pw, ph, x: (w - pw) * pan, y: (h - ph) * 0.5 }); };
      measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
    }, [pan, over]);
    return fit;
  }
  function IslandsDepth() {
    const { resolved } = useTheme(); const reduce = useReducedMotion(); const app = useApp(); const ref = useRef(null);
    const onPlate = app.bp === "desktop"; const fit = useIslandFit(ref, onPlate ? 0.5 : 0.3);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const plateY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-40, 40]);
    const cloudY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["14%", "-14%"]);
    const tagY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [22, -22]);
    const pos = p => fit ? { left: fit.x + p.x * fit.pw, top: fit.y + p.y * fit.ph } : { left: `${p.x * 100}%`, top: `${p.y * 100}%` };
    return <section id="teams" className="sec sec-ws ws-a" aria-labelledby="ws-h">
      <div className="wrap"><WsHead /></div>
      <figure className="isd" ref={ref}>
        <motion.img className="isd-plate" style={{ y: plateY, ...(fit ? { left: fit.x, top: fit.y, width: fit.pw, height: fit.ph } : {}) }} src={IMG78 + (resolved === "dark" ? "islands-depth-night.webp" : "islands-depth.webp")} alt="" loading="lazy" />
        <motion.div className="isd-cloud" style={{ y: cloudY }} aria-hidden="true" />
        <motion.div className="isd-layer" style={{ y: tagY }}>
          {onPlate && <ul className="isd-tags" aria-label="Workspace addresses">{ADDR.map(a => <li key={a.id} className={cx("isd-tag below", a.live && "live")} style={pos(ISD[a.id])}><span className="stem" aria-hidden="true" /><span className="body"><i aria-hidden="true" />{a.url}{a.live && <span className="isl-live"> · live</span>}</span></li>)}</ul>}
          <span className="isd-hub" style={pos(ISD.hub)} aria-hidden="true"><Mark size={56} /></span>
        </motion.div>
        <figcaption className="sr-only">Three islands floating at three distances in a morning sky over a miniature town, each a manufacturer's workspace carrying its own product, joined to Smart-Clearance by ribbons of green light.</figcaption>
      </figure>
      <div className="wrap ws-a-tail"><WsTail urls={!onPlate && <ul className="isl-urls below" aria-label="Workspace addresses">{ADDR.map(a => <li key={a.id} className={cx("isl-url", a.live && "live")}><i aria-hidden="true" />{a.url}{a.live && <span className="isl-live"> · live</span>}</li>)}</ul>} /></div>
    </section>;
  }
  // B · the workspace itself, on a device: its address typed in, and what each team sees, one tab each
  function useTyped(text, on, ms = 70) {
    const reduce = useReducedMotion(); const [n, setN] = useState(reduce ? text.length : 0);
    useEffect(() => { if (reduce || !on || n >= text.length) return; const t = setTimeout(() => setN(n + 1), n === 0 ? 400 : ms); return () => clearTimeout(t); }, [on, n, reduce, text]);
    return text.slice(0, n);
  }
  function PermissionCard() {
    return <div className="m-card" role="group" aria-label="The distributor's permission">
      <div className="m-head"><b>The distributor's permission</b><Badge tone="green" icon="check">given once</Badge></div>
      <div className="m-batch"><span className="wsd-avatar" aria-hidden="true"><Icon name="handshake" size={22} /></span><span><b>Asked on the distributor's own phone, once</b><span>nothing is listed or offered in their name before it</span></span></div>
      {[["List short-dated stock on ExpireSoon in our name", "allowed"], ["Send kirana offers from our godown's stock", "allowed"], ["Share our stock export every morning", "allowed"], ["Sell below the reserve", "never"]].map(([k, v]) => <div key={k} className="m-row"><span className="k">{k}</span><span className={cx("v", v === "never" && "red")}>{v}</span></div>)}
    </div>;
  }
  function LedgerCard() {
    const lines = LEDGER_LINES(false).slice(0, 4);
    return <div className="m-card" role="group" aria-label="Impact's ledger for the batch">
      <div className="m-head"><span className="chip-agent on"><i aria-hidden="true" />Impact</span><Badge tone="gray">BRSR Principle 6</Badge></div>
      {lines.map(l => <div key={l.k} className="m-row"><span className="k">{l.k}</span><span className="v">{l.v}</span></div>)}
    </div>;
  }
  const TEAM_FEED = {
    supply: [["09:00", "watcher"], ["09:12", "vision"], ["09:31", "router"]],
    finance: [["09:40", "gate"], ["14:05", "negotiator"], ["18:20", "paperwork"]],
    impact: [["18:20", "paperwork"], ["Day 7", "impact"], ["Day 7", "data"]],
    dist: [["09:00", "data"], ["09:41", "outreach"], ["11:30", "lister"]],
  };
  function TeamFeed({ id }) {
    return <aside className="wsd-side" aria-label="Today, for this team"><b>Today</b>{TEAM_FEED[id].map(([at, a]) => { const ag = AGENT[a === "gate" ? "you" : a]; return <span key={at + a} className="wsd-line"><i aria-hidden="true"><Icon name={ag.icon} size={12} stroke={2.4} /></i><span><b>{ag.name}</b> · {ag.did}</span><span className="at">{at}</span></span>; })}</aside>;
  }
  function TeamScreen({ id }) {
    switch (id) {
      case "supply": return <PlanCard />;
      case "finance": return <PaperCard />;
      case "impact": return <LedgerCard />;
      default: return <PermissionCard />;
    }
  }
  function useWidth(ref) {
    const [w, setW] = useState(0);
    useLayoutEffect(() => { const el = ref.current; if (!el) return; const m = () => setW(el.clientWidth); m(); const ro = new ResizeObserver(m); ro.observe(el); return () => ro.disconnect(); }, []);
    return w;
  }
  function WorkspaceDevice() {
    const app = useApp(); const reduce = useReducedMotion(); const ref = useRef(null); const seen = useInView(ref, { amount: 0.4, once: true });
    const stageW = useWidth(ref); const ps = Math.min(1, Math.max(0.5, (stageW - 32) / 414));
    const [tab, setTab] = useState(0); const [auto, setAuto] = useState(true);
    const host = useTyped("your-brand", seen); const typed = host.length >= 10;
    // once the address is typed, the tabs play through once, 2.4 s each, unless the reader takes the rail
    useEffect(() => { if (reduce || !auto || !typed || tab >= TEAMS.length - 1) return; const t = setTimeout(() => setTab(tab + 1), 2400); return () => clearTimeout(t); }, [typed, tab, auto, reduce]);
    const pick = i => { setAuto(false); setTab(i); };
    const team = TEAMS[tab]; const phone = app.bp === "phone";
    const rail = <div className="wsd-rail" role="tablist" aria-label="Teams">
      <span className="who"><K.WorkspaceMark ws={{ id: "yours", name: "Your brand", mark: { from: "#2fbf7f", to: "#0d5a3e", ink: "#ffffff" } }} size={28} /><span>Your brand</span></span>
      {TEAMS.map((t, i) => <button key={t.id} type="button" role="tab" aria-selected={i === tab} onClick={() => pick(i)}><Icon name={t.icon} size={18} />{t.t}</button>)}
    </div>;
    const main = <div className="wsd-main" role="tabpanel">
      <div className="wsd-title"><h3>{team.t}</h3><p>{team.d}</p></div>
      <AnimatePresence mode="wait"><motion.div key={team.id} className="wsd-body" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: EASE }}><TeamScreen id={team.id} />{!phone && <TeamFeed id={team.id} />}</motion.div></AnimatePresence>
    </div>;
    const url = `https://${host || "·"}.smartclearance.com/${team.route}`;
    return <section id="teams" className="sec sec-ws ws-b" aria-labelledby="ws-h">
      <div className="wrap"><WsHead /></div>
      <div className="wsd-stage" ref={ref}>
        <div className="wsd-ground" aria-hidden="true" />
        {phone ? <div className="wsd-phone" style={{ height: 868 * ps }}><div className="wsd-phone-in" style={{ transform: `scale(${ps})` }}><PhoneFrame time="09:41"><div className="wsd phone"><div className="wsd-addr"><Icon name="lock" size={11} stroke={2.2} />{host || "·"}.smartclearance.com</div>{rail}{main}</div></PhoneFrame></div></div>
          : <WindowFrame url={url} style={{ width: "100%" }}><div className="wsd">{rail}{main}</div></WindowFrame>}
      </div>
      <div className="wrap"><WsTail urls={<ul className="isl-urls below" aria-label="Workspace addresses">{ADDR.map(a => <li key={a.id} className={cx("isl-url", a.live && "live")}><i aria-hidden="true" />{a.url}{a.live && <span className="isl-live"> · live</span>}</li>)}</ul>} /></div>
    </section>;
  }
  // C · the strip as it is, its products drawn into the plate instead of pasted on, the addresses on stems, and the
  // plate drifting under them with the scroll
  const ISLANDS = [
    { id: "brand", x: 0.22, ly: 0.84 }, { id: "company", x: 0.575, ly: 0.79 }, { id: "group", x: 0.8, ly: 0.82 },
  ];
  const HUB = { x: 0.425, y: 0.69 }, ISL_AR = 3776 / 1120;
  function IslandsStrip() {
    const app = useApp(); const { resolved } = useTheme(); const reduce = useReducedMotion(); const swipe = app.bp === "phone"; const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const plateY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-5%", "5%"]);
    const urls = cls => <ul className={cx("isl-urls", cls)} aria-label="Workspace addresses">{ISLANDS.map(i => { const a = ADDR.find(x => x.id === i.id); return cls === "on-plate" ? <AddrTag key={i.id} a={a} x={i.x} y={i.ly} below /> : <li key={i.id} className={cx("isl-url", a.live && "live")}><i aria-hidden="true" />{a.url}{a.live && <span className="isl-live"> · live</span>}</li>; })}</ul>;
    return <section id="teams" className="sec sec-ws ws-c" aria-labelledby="ws-h">
      <div className="wrap"><WsHead /></div>
      <div className="isl-pan" {...(swipe ? { tabIndex: 0, role: "region", "aria-label": "Workspaces, one island each; scroll sideways" } : {})}>
        <figure className="islands" style={{ "--ar": ISL_AR }} ref={ref}>
          <motion.img className="isl-plate" style={{ y: plateY }} src={IMG78 + (resolved === "dark" ? "islands-packs-night.webp" : "islands-packs.webp")} alt="" loading="lazy" />
          <span className="isl-hub" style={{ "--x": HUB.x, "--y": HUB.y }} aria-hidden="true"><Mark size={52} /></span>
          {urls("on-plate")}
          <figcaption className="sr-only">Three islands over a miniature town, each a manufacturer's workspace with its own product, joined to Smart-Clearance by green paths.</figcaption>
        </figure>
      </div>
      <div className="wrap"><WsTail urls={urls("below")} /></div>
    </section>;
  }
  function Workspace() { return OPT.ws === "b" ? <WorkspaceDevice /> : OPT.ws === "c" ? <IslandsStrip /> : <IslandsDepth />; }

  /* ---------- 7. plans and the close, as they are ---------- */
  function Plans({ onDemo }) {
    return <section id="pricing" className="sec sec-plans" aria-labelledby="plans-h">
      <div className="wrap">
        <header className="sec-head"><h2 id="plans-h" className="sec-h plain">Start with one distributor.</h2><p className="sec-sub">A pilot runs on one distributor's stock for 90 days. Prices are set with each manufacturer.</p></header>
        <ul className="plans">{P.PLANS.map(p => <li key={p.id} className="plan">
          <b className="plan-name">{p.name}</b>
          <ul className="plan-scope">{p.scope.map(s => <li key={s}>{s.replace(/^The client's /, "Your ")}</li>)}</ul>
          <span className="plan-foot"><span>Prices on request</span><button type="button" className="btn btn-link" onClick={() => onDemo(p.name)}>Talk to us<span className="sr-only"> about {p.name}</span></button></span>
        </li>)}</ul>
      </div>
    </section>;
  }
  function Close({ onDemo, closeRef }) {
    return <section className="close" aria-labelledby="close-h" ref={closeRef}>
      <div className="close-copy">
        <h2 id="close-h" className="close-h">Give your next batch a second chance.</h2>
        <div className="close-ctas"><Button variant="primary" onClick={() => onDemo()}>Book a demo</Button><a className="btn btn-secondary" {...linkProps(LINKS.demo)}>Watch the 6-minute demo</a></div>
      </div>
      <img className="close-plate" src={IMG + "dusk.webp"} width="4128" height="1024" alt="" loading="lazy" />
    </section>;
  }
  function Footer({ onFind }) {
    const { mode, setMode } = useTheme();
    const cols = [
      ["Product", SECTIONS.map(([id, t]) => <a key={id} href={"#" + id}>{t}</a>)],
      ["Sign in", [<button key="find" type="button" className="foot-link" onClick={onFind}>Find your workspace</button>, <a key="staff" {...linkProps(LINKS.console)}>Staff console</a>]],
    ];
    return <footer className="foot">
      <div className="wrap foot-grid">
        <div className="foot-brand"><Mark size={40} /><span><Wordmark size={17} /><span className="foot-tag">Every near-expiry carton gets a second chance.</span></span></div>
        <nav className="foot-cols" aria-label="Footer">{cols.map(([h, items]) => <div key={h} className="foot-col"><b>{h}</b>{items}</div>)}</nav>
      </div>
      <div className="wrap foot-base">
        <p>Prototype · every company, person and number is fictional · Google AI Hackathon 2026</p>
        <Segmented options={[{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }, { id: "system", label: "Auto" }]} value={mode} onChange={setMode} label="Appearance" size="sm" />
      </div>
    </footer>;
  }
  function DemoSheet({ open: isOpen, plan, onClose }) {
    const app = useApp(); const blank = { name: "", company: "", email: "", makes: "Snacks and drinks", note: "" };
    const [f, setF] = useState(blank); const [err, setErr] = useState({}); const [sent, setSent] = useState(null);
    useEffect(() => { if (isOpen) { setSent(null); setErr({}); } }, [isOpen]);
    const edit = k => e => { setF({ ...f, [k]: e.target.value }); if (err[k]) setErr({ ...err, [k]: null }); };
    const send = () => {
      const e = { name: !f.name.trim() && "Enter your name.", company: !f.company.trim() && "Enter your company's name.", email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) && "Enter a work email address, like name@company.in." };
      if (e.name || e.company || e.email) { setErr(e); return; }
      const req = { id: "rq-" + Date.now().toString(36), at: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), name: f.name.trim(), company: f.company.trim(), email: f.email.trim().toLowerCase(), makes: f.makes, plan: plan || null, note: f.note.trim(), status: "new" };
      if (P) P.update(d => { d.requests = [req].concat(d.requests || []); });
      setSent(req); setF(blank);
    };
    return <Sheet open={isOpen} onClose={onClose} title={plan ? `Talk to us about ${plan}` : "Book a demo"} side={app.bp === "phone" ? "bottom" : "center"} detent="large"
      footer={sent ? <Button variant="primary" size="lg" block onClick={onClose}>Done</Button> : <Button variant="primary" size="lg" block icon="send" onClick={send}>Send request</Button>}>
      {sent ? <div className="stack" style={{ justifyItems: "center", textAlign: "center", paddingTop: 8 }}>
        <span className="sd-done" aria-hidden="true"><Icon name="circle-check" size={36} /></span>
        <b className="t-title3">Thanks, {sent.name.split(" ")[0]}.</b>
        <p className="t-subhead muted" style={{ margin: 0, maxWidth: "40ch" }}>We'll set up a walkthrough for {sent.company} on its own supply chain. In this prototype your request appears in the Smart-Clearance console, under Overview.</p>
        <button type="button" className="btn btn-link" onClick={() => open(LINKS.console)}>Open the console</button>
      </div> : <form className="stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); send(); }} noValidate>
        <p className="t-subhead muted" style={{ margin: 0 }}>Thirty minutes on your own stock: we price one batch that's headed for the bin and show you the plan.</p>
        <Field label="Your name" htmlFor="bd-name" error={err.name || null}><Input id="bd-name" value={f.name} onChange={edit("name")} autoComplete="name" /></Field>
        <Field label="Company" htmlFor="bd-company" error={err.company || null}><Input id="bd-company" value={f.company} onChange={edit("company")} autoComplete="organization" /></Field>
        <Field label="Work email" htmlFor="bd-email" error={err.email || null}><Input id="bd-email" type="email" value={f.email} onChange={edit("email")} autoComplete="email" spellCheck={false} autoCapitalize="none" /></Field>
        <Field label="What you make" htmlFor="bd-makes"><Select id="bd-makes" value={f.makes} onChange={e => setF({ ...f, makes: e.target.value })}>{["Snacks and drinks", "Personal care", "Dairy", "Staples", "Home care"].map(x => <option key={x}>{x}</option>)}</Select></Field>
        <Field label="Anything we should know (optional)" htmlFor="bd-note"><Textarea id="bd-note" rows={3} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></Field>
        <p className="t-footnote subtle" style={{ margin: 0 }}>Prototype: nothing is sent anywhere; the request stays in this browser.</p>
      </form>}
    </Sheet>;
  }

  /* ---------- the review switcher: swap any part's option without leaving the page (?switch=0 hides it) ---------- */
  function Switcher() {
    const app = useApp(); const [openSw, setOpenSw] = useState(false);
    if (QS.get("switch") === "0") return null;
    if (app.bp === "phone" && !openSw) return <button type="button" className="sw78-open" onClick={() => setOpenSw(true)} aria-label="Review: switch an option">A·B·C</button>;
    const parts = [["hero", "Hero", ["a", "b", "c"]], ["scene", "Day scene", ["a", "b"]], ["ws", "Workspace", ["a", "b", "c"]], ["nav", "Bar", ["a", "b", "c"]]];
    const link = (k, v) => { const q = new URLSearchParams(location.search); q.set(k, v); return "?" + q.toString(); };
    return <nav className="sw78" aria-label="Review: switch an option">{app.bp === "phone" && <button type="button" className="sw78-close" onClick={() => setOpenSw(false)} aria-label="Close">×</button>}{parts.map(([k, l, vs]) => <span key={k}><b>{l}</b>{vs.map(v => <a key={v} href={link(k, v)} className={cx(OPT[k] === v && "on")} aria-current={OPT[k] === v ? "true" : undefined}>{v.toUpperCase()}</a>)}</span>)}</nav>;
  }

  function Site() {
    const [find, setFind] = useState(false); const [demo, setDemo] = useState(null); const [scrolled, setScrolled] = useState(false);
    const closeRef = useRef(null); const nearEnd = useInView(closeRef, { amount: 0.2 });
    const [pastHero, setPastHero] = useState(false); const [onTeams, setOnTeams] = useState(false);
    useEffect(() => { const el = document.getElementById("top-hero"); if (!el) return; const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { threshold: 0.12 }); io.observe(el); return () => io.disconnect(); }, []);
    useEffect(() => { const el = document.getElementById("teams"); if (!el) return; const io = new IntersectionObserver(([e]) => setOnTeams(e.isIntersecting), { threshold: 0.2 }); io.observe(el); return () => io.disconnect(); }, []);
    useEffect(() => { document.title = "Smart-Clearance · SC-78 option " + OPT.hero.toUpperCase(); if (window.SC3_LOADER) window.SC3_LOADER.mark("app"); }, []);
    useEffect(() => { const f = () => setScrolled(window.scrollY > 40); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
    const onDemo = plan => setDemo({ plan: typeof plan === "string" ? plan : null });
    return <div className={cx("site", scrolled && "scrolled", "sc78", "nav-" + OPT.nav + "-page", "hero-" + OPT.hero + "-page")} id="top">
      <Nav onFind={() => setFind(true)} onDemo={onDemo} />
      <main>
        <Hero onDemo={onDemo} />
        <Statement id="how" text="Short-dated stock that quick commerce sent back. Priced to every exit, the bin included. Sold in the days it has left." />
        <Table />
        <Chapters />
        <Ledger />
        <Workspace />
        <Plans onDemo={onDemo} />
        <Close onDemo={onDemo} closeRef={closeRef} />
      </main>
      <Footer onFind={() => setFind(true)} />
      <DemoPill hidden={nearEnd || !pastHero || onTeams} />
      <Switcher />
      <S.FindWorkspace open={find} onClose={() => setFind(false)} onUse={() => { setFind(false); open(LINKS.app); }} note="One manufacturer's workspace is set up in this prototype." />
      <DemoSheet open={!!demo} plan={demo && demo.plan} onClose={() => setDemo(null)} />
    </div>;
  }
  const gate = window.SC3_LOADER && window.SC3_LOADER.switchTheme;
  function Root() { return <ThemeProvider gate={gate}><AppRoot className="site-root" scroll="window"><NoticeHost><Site /></NoticeHost></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();

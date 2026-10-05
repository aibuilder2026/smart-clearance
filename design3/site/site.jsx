// Smart-Clearance v3 · smartclearance.com: the product's own landing page, independent of any client. One carton
// the size of a godown, parked in a miniature Indian town, and the page follows where its packs go.
(function () {
  const { useState, useEffect, useLayoutEffect, useRef } = React;
  const { useReducedMotion, motion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, P = window.SC3_PLATFORM; const fmt = M.fmt;
  const { cx, Icon, IconButton, Button, Badge, Sheet, Field, Input, Select, Textarea, Menu, Mark, Wordmark, Money, Roll, GateChips, Product, Segmented, ModeMenuButton, ThemeProvider, AppRoot, NoticeHost, useApp, useTheme } = K;
  const IMG = window.SC3_SITE_IMG || "assets/plates/";
  // where the other pages live: relative next to each other here, the claude.ai/design links on the hosted pages
  const LINKS = Object.assign({ demo: "../demo/Smart-Clearance%20demo%20v3.html", app: "../app/Smart-Clearance%20app%20v3.html", console: "../console/Smart-Clearance%20console%20v3.html" }, window.SC3_LINKS || {});
  const external = href => /^https?:/.test(href);
  const linkProps = href => external(href) ? { href, target: "_blank", rel: "noopener" } : { href };
  const open = href => { if (external(href)) { if (!window.open(href, "_blank", "noopener")) location.href = href; } else location.href = href; };
  if (P) P.usePersistence();

  /* ---------- the figures every section quotes, all of them computed in core/money.js ---------- */
  const lineOf = id => D.PLAN.lines.find(l => l.id === id);
  const KL = lineOf("kirana"), ESL = lineOf("expiresoon"), AW = D.AWARD;
  const BATCH = D.BATCHES.find(b => b.hero), DIST = D.DISTRIBUTORS[BATCH.distributor];
  const SHOPS = D.KIRANAS.length, BIN = D.PLAN.writeOff.total, ES_NET = AW.gross - ESL.cost;
  const rate = v => Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v); // ₹12 a pack, ₹14.20 a pack

  /* ---------- the bar: the product, its sections, the ways in ---------- */
  // no client is named on this page: a manufacturer finds its own workspace (SC-28)
  const SECTIONS = [["how", "How it works"], ["agents", "Agents"], ["teams", "For teams"], ["pricing", "Pricing"]];
  const goTo = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  function Nav({ onFind, onDemo }) {
    const app = useApp(); const [menu, setMenu] = useState(false); const [sheet, setSheet] = useState(false);
    const signInItems = [
      { label: "Sign in to", heading: true },
      { label: "Find your workspace", icon: "search", onClick: onFind },
      "-",
      { label: "Smart-Clearance staff", icon: "shield", onClick: () => open(LINKS.console) },
    ];
    return <header className="site-nav">
      <a className="nav-brand" href="#top" aria-label="Smart-Clearance, back to the top"><span className="nav-mark"><Mark size={36} /></span><Wordmark size={15} /></a>
      {app.bp === "desktop" && <nav className="nav-links" aria-label="Sections">{SECTIONS.map(([id, t]) => <a key={id} href={"#" + id}>{t}</a>)}</nav>}
      <span className="grow" />
      <span className="nav-mode"><ModeMenuButton /></span>
      <span className="nav-signin"><button type="button" className="nav-text" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(m => !m)}>Sign in</button><Menu open={menu} onClose={() => setMenu(false)} items={signInItems} width={268} label="Sign in to" /></span>
      {app.bp !== "phone" ? <Button variant="primary" pill className="nav-demo" onClick={() => onDemo()}>Book a demo</Button> : <IconButton icon="menu" label="Menu" onClick={() => setSheet(true)} />}
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Smart-Clearance" side="bottom" detent="medium">
        <div className="stack">
          <div className="list">{SECTIONS.map(([id, t]) => <button type="button" key={id} className="list-row" onClick={() => { setSheet(false); setTimeout(() => goTo(id), 60); }}><span className="lr-main"><span className="lr-title">{t}</span></span><Icon name="chevron-right" size={18} className="chev" /></button>)}</div>
          <Button variant="primary" size="lg" block onClick={() => { setSheet(false); onDemo(); }}>Book a demo</Button>
        </div>
      </Sheet>
    </header>;
  }

  /* ---------- the first viewport: the carton's crew (SC-30) ---------- */
  // The ten agents and the person ride a ring around the giant carton, passing behind it. The batch walks its nine
  // stops once, as soon as the plate has loaded, since the hero is the first viewport. The ring turns each stop's agent
  // to the front, where it wears the aura while it works and the caption under the carton says what it did; a thread
  // draws from each agent to the next. 430 ms a stop, 980 ms on the person's yes and 700 ms on the report while the
  // money rolls in: 4.69 s in all, so every motion is over within five seconds (WCAG 2.2.2). It holds on the result and
  // offers Replay; under reduced motion it is at its result from the start.
  // what each stop did for this batch
  const STOP_DONE = {
    connect: "stock export mapped · permission given",
    detect: `${fmt.num(D.RISK.atRisk)} packs won't sell in the ${BATCH.daysLeft} days left`,
    verify: "label read · the date matches",
    value: `five exits priced · the bin costs ${fmt.inr(BIN)}`,
    decide: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas · ${fmt.num(AW.units)} to one buyer`,
    approve: `approved in one tap · ${fmt.inr(D.PLAN.net)} on screen`,
    execute: `listed · offers sent · a bid countered to ${rate(AW.price)}`,
    settle: "invoice, credit note and GST memo drafted",
    report: `${fmt.inr(D.ACTUAL.net)} recovered · ${fmt.num(D.PLAN.kg)} kg kept out of landfill`,
  };
  const NS = D.STAGES.length, STAGE_AT = Object.fromEntries(D.STAGES.map((s, i) => [s.id, i]));
  // the crew, in the order they work: every agent, and the person who says yes
  const CREW = P.AGENTS.map(a => ({ name: a.gate ? "a person" : a.name, icon: a.icon, stop: STAGE_AT[a.stage], human: !!a.gate })).sort((a, b) => a.stop - b.stop);
  const WHO = D.STAGES.map((s, i) => CREW.filter(c => c.stop === i).map(c => c.name).join(" · "));
  // the carton's outline on the plate, as fractions of it (the day and night plates are composed alike)
  const CARTON = [[0.393, 0.334], [0.466, 0.316], [0.65, 0.346], [0.651, 0.75], [0.525, 0.805], [0.393, 0.746]];
  const STEP = 430, YES = 980, LAST = 700;
  const stays = k => D.STAGES[k].human ? YES : k === NS - 1 ? LAST : STEP;
  // The plate is cover-fitted in its box at its own object-position (50% 50% on desktops, 50% 64% below), so a point of
  // the plate lands where at(p) says, in the layer's pixels. The layer is laid exactly over the plate's box and measured
  // again as the page resizes or the night plate comes in.
  function usePlate(layer) {
    const [g, setG] = useState(null); const [ready, setReady] = useState(false);
    useLayoutEffect(() => {
      const el = layer.current; if (!el) return;
      const hero = el.closest(".hero"), img = hero.querySelector(".hero-scene img");
      const measure = () => {
        const host = el.offsetParent; if (!host) return;
        const r = img.getBoundingClientRect(), p = host.getBoundingClientRect();
        const nw = img.naturalWidth || +img.getAttribute("width"), nh = img.naturalHeight || +img.getAttribute("height");
        const [px, py] = (getComputedStyle(img).objectPosition || "50% 50%").split(" ").map(v => parseFloat(v) / 100);
        const s = Math.max(r.width / nw, r.height / nh);
        setG({ left: r.left - p.left, top: r.top - p.top, w: r.width, h: r.height, s, ox: (r.width - nw * s) * px, oy: (r.height - nh * s) * py, nw, nh });
      };
      const loaded = () => { measure(); setReady(true); };
      measure(); if (img.complete && img.naturalWidth) setReady(true);
      img.addEventListener("load", loaded);
      const ro = new ResizeObserver(measure); ro.observe(img); ro.observe(hero);
      return () => { ro.disconnect(); img.removeEventListener("load", loaded); };
    }, []);
    const at = p => g ? [g.ox + p[0] * g.nw * g.s, g.oy + p[1] * g.nh * g.s] : [0, 0];
    // wide: the desktop frame, where the plate is the hero's whole picture and the copy sits in its sky
    return { g, at, ready, wide: !!g && g.w >= 900 };
  }
  const poly = (at, pts) => pts.map(p => at(p).map(v => v.toFixed(1)).join(" ")).join(" L");
  // where the batch is: -1 before it sets off, 0 to 8 at a stop, 9 when it is done (how it rests, and how it is from the
  // start under reduced motion). It sets off half a second after the plate has loaded, so it never plays over an empty frame.
  function useWalk(ready) {
    const reduce = !!useReducedMotion();
    const [k, setK] = useState(reduce ? NS : -1); const [run, setRun] = useState(0);
    useEffect(() => { if (reduce) { setK(NS); return; } if (!ready) return; setK(-1); const t = setTimeout(() => setK(0), 500); return () => clearTimeout(t); }, [ready, run, reduce]);
    useEffect(() => { if (reduce || k < 0 || k >= NS) return; const t = setTimeout(() => setK(k + 1), stays(k)); return () => clearTimeout(t); }, [k, reduce]);
    return { k, reduce, playing: k >= 0 && k < NS, done: k >= NS, replay: () => setRun(r => r + 1) };
  }
  // the money, rolled in once over the report stop (the system's roll, 700 ms); at its value under reduced motion
  function useCount(on, to, reduce) {
    const [v, setV] = useState(on || reduce ? to : 0);
    useEffect(() => {
      if (reduce) { setV(to); return; } if (!on) { setV(0); return; }
      const c = Motion.animate(0, to, { duration: LAST / 1000, ease: [0.22, 1, 0.36, 1], onUpdate: setV }); return () => c.stop();
    }, [on, reduce]);
    return v;
  }
  // what the batch is doing, under the carton: before it sets off, at each stop, and when it is done. The picture is
  // hidden from screen readers, which get the nine stops and the result as text instead.
  function Caption({ w, money }) {
    const s = w.playing ? D.STAGES[w.k] : null;
    return <div className={cx("hero-caption", s && s.human && "human")} aria-hidden="true">
      {w.k < 0 ? <><b>{fmt.num(D.RISK.atRisk)} packs, {BATCH.daysLeft} days left.</b><span>Ten agents and one person take it from here.</span></>
        : s ? <><span className="n">{w.k + 1} of {NS}</span><b>{s.title}</b><span>{WHO[w.k]}</span><span className="did">{s.id === "report" ? `${fmt.inr(money)} recovered · ${fmt.num(D.PLAN.kg)} kg kept out of landfill` : STOP_DONE[s.id]}</span></>
        : <><span className="n">{NS} of {NS}</span><b>Sold, not binned.</b><span className="did">{fmt.inr(D.ACTUAL.net)} recovered, instead of {fmt.inr(-BIN)} to destroy it</span></>}
    </div>;
  }
  const T = 2 * Math.PI / CREW.length;
  // the ring's turn that brings stop k's agent to the front (the middle one, where a stop has three): before the walk,
  // between the last agent and the first; at rest, the last
  const frontOf = k => { if (k < 0) return -1.5; if (k >= NS) return CREW.length - 1; const at = CREW.map((c, j) => c.stop === k ? j : -1).filter(j => j >= 0); return at[Math.floor(at.length / 2)]; };
  function Crew() {
    const layer = useRef(null); const plate = usePlate(layer); const w = useWalk(plate.ready);
    const [rot, setRot] = useState(frontOf(w.k) * T); const rotNow = useRef(rot);
    useEffect(() => {
      const to = frontOf(w.k) * T; if (w.reduce) { rotNow.current = to; setRot(to); return; }
      const c = Motion.animate(rotNow.current, to, { duration: w.k < 0 ? 0.5 : 0.42, ease: [0.45, 0, 0.4, 1], onUpdate: v => { rotNow.current = v; setRot(v); } });
      return () => c.stop();
    }, [w.k, w.reduce]);
    const money = useCount(w.k >= NS - 1, D.ACTUAL.net, w.reduce);
    const g = plate.g, wide = plate.wide;
    // the ring sits round the carton's middle, tilted as if seen from above; on narrow plates it pulls in to stay on the plate
    const ring = g && (() => { const [x, y] = plate.at(wide ? [0.522, 0.565] : [0.512, 0.565]); return { x, y, rx: (wide ? 0.245 : 0.178) * g.nw * g.s, ry: (wide ? 0.13 : 0.12) * g.nh * g.s }; })();
    const tiles = g ? CREW.map((c, j) => {
      const a = j * T - rot, d = Math.cos(a), x = ring.x + ring.rx * Math.sin(a), y = ring.y + ring.ry * d;
      const done = c.stop < w.k || w.done, now = c.stop === w.k && w.playing;
      return { ...c, j, x, y, d, done, now, scale: (0.8 + 0.2 * (d + 1) / 2) * (now ? 1.14 : 1) };
    }) : [];
    // the carton cut out of the layer: what rides behind it (the back of the ring, its tiles and threads) is hidden by it
    const outline = g ? "M0 0 H" + g.w + " V" + g.h + " H0 Z M" + poly(plate.at, CARTON) + " Z" : "";
    // the handoff threads: from each agent that has worked to the next one in the crew
    const reached = tiles.filter(t => t.done || t.now).length;
    const threads = tiles.slice(1, Math.max(1, reached)).map((t, i) => [tiles[i], t]);
    // on a phone each tile is its icon, except the agent at work (and, at rest, the last)
    const Tile = t => <span key={t.name} className={cx("crew-tile", t.human && "human", t.done && "on", w.playing && !t.done && !t.now && "later", !wide && !t.now && !(w.done && t.j === CREW.length - 1) && "icon")}
      style={{ transform: `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px) translate(-50%, -50%) scale(${t.scale.toFixed(3)})`, zIndex: Math.round((t.d + 1) * 50) + (t.now ? 200 : 0) }}>
      <span className={cx(t.now && "aura")}><i><Icon name={t.icon} size={13} stroke={2.2} /></i>{t.name}</span></span>;
    return <>
      <div className="crew-layer" ref={layer} style={g ? { left: g.left, top: g.top, width: g.w, height: g.h } : { visibility: "hidden" }} aria-hidden="true">
        {g && <svg>
          <defs><clipPath id="crew-behind"><path clipRule="evenodd" d={outline} /></clipPath></defs>
          <ellipse className="crew-ring" cx={ring.x} cy={ring.y} rx={ring.rx} ry={ring.ry} clipPath="url(#crew-behind)" />
          <path className="crew-ring" d={`M${ring.x - ring.rx} ${ring.y} A${ring.rx} ${ring.ry} 0 0 0 ${ring.x + ring.rx} ${ring.y}`} />
        </svg>}
        {g && <svg>{threads.map(([a, b]) => <line key={a.name + b.name} className={cx("crew-thread", (a.human || b.human) && "human")} x1={a.x} y1={a.y} x2={b.x} y2={b.y} clipPath={a.d < 0 || b.d < 0 ? "url(#crew-behind)" : undefined} />)}</svg>}
        {g && <div className="crew-back" style={{ clipPath: `path(evenodd, '${outline}')` }}>{tiles.filter(t => t.d < 0).map(Tile)}</div>}
        {g && <div className="crew-front">{tiles.filter(t => t.d >= 0).map(Tile)}</div>}
      </div>
      <ol className="sr-only" aria-label="The nine stops">{D.STAGES.map((s, i) => <li key={s.id}>{s.title}, {WHO[i]}: {STOP_DONE[s.id]}.</li>)}</ol>
      <p className="sr-only">Sold, not binned: {fmt.inr(D.ACTUAL.net)} recovered, instead of {fmt.inr(-BIN)} to destroy it.</p>
      <Caption w={w} money={money} />
      <div className="hero-replay">{!w.reduce && <button type="button" className="replay" onClick={w.replay}><Icon name="rotate-ccw" size={16} stroke={2} />Replay the batch</button>}</div>
    </>;
  }
  function Hero({ onFind }) {
    const { resolved } = useTheme(); const night = resolved === "dark";
    const stops = [["kiranas", "Kiranas"], ["market", "Marketplace"], ["staff", "Staff sale"], ["foodbank", "Food bank"]];
    return <section className="hero" id="agents" aria-labelledby="hero-h">
      <div className="hero-frame">
        <div className="hero-copy">
          <h1 id="hero-h" className="hero-h">Every near-expiry carton gets a second chance.</h1>
          <p className="hero-sub">AI agents find the best exit for short-dated stock. You say yes once.</p>
          <div className="hero-ctas"><a className="btn btn-primary" {...linkProps(LINKS.demo)}>Watch the 6-minute demo</a><button type="button" className="btn btn-secondary" onClick={onFind}>Find your workspace</button></div>
        </div>
        <div className="hero-stage">
          {/* the town is composed twice, by day and by night, never inverted */}
          <picture className="hero-scene"><img src={IMG + (night ? "scene-night.webp" : "scene.webp")} width="2752" height="1504" alt={night
            ? "A miniature Indian town at night: one giant cardboard carton stands among tiny kirana shops with lit windows, a van and a handcart, lit from below by a glowing green path that runs from it to the shops."
            : "A miniature Indian town in the morning: one giant cardboard carton stands among tiny kirana shops, a van and a handcart, with a green path running from it to the shops."} /></picture>
          <Crew />
          <ol className="hero-stops" aria-label="Where its packs can go">{stops.map(([id, t]) => <li key={id} className={"st-" + id}>{t}</li>)}</ol>
          <span className="hero-line l1" aria-hidden="true" /><span className="hero-line l2" aria-hidden="true" /><span className="hero-line l3" aria-hidden="true" />
        </div>
      </div>
    </section>;
  }

  /* ---------- 2. how it works: the moments each team actually sees, the agents named beside each (SC-28, option B) ---------- */
  const agentsAt = (...stages) => P.AGENTS.filter(a => !a.gate && stages.includes(a.stage)).map(a => a.name);
  const EASE = [0.22, 1, 0.36, 1];
  const SKU = D.SKUS[BATCH.sku], SCHEME = M.RULES.scheme;
  const row = id => D.PLAN.rows.find(r => r.id === id);
  const planned = id => D.PLAN.lines.some(l => l.id === id);
  // a card rises once it comes into view, then its rows follow it in turn, about a second and a half, once; under
  // reduced motion it is in place from the start
  function useRise() {
    const ref = useRef(null); const reduce = useReducedMotion();
    const inView = Motion.useInView(ref, { once: true, amount: 0.3 }); const shown = reduce || inView;
    const move = (y, delay) => ({ initial: reduce ? false : { opacity: 0, y }, animate: shown ? { opacity: 1, y: 0 } : undefined, transition: { duration: 0.42, delay: reduce ? 0 : delay, ease: EASE } });
    return { shown, card: { ref, ...move(16, 0) }, rise: i => move(10, 0.16 + i * 0.11) };
  }
  // n things light in turn once `on`: the first after `first` ms, then one every `every` ms; all at once under reduced motion
  function useLit(on, n, first, every) {
    const reduce = useReducedMotion(); const [k, setK] = useState(reduce ? n : 0);
    useEffect(() => {
      if (reduce) { setK(n); return; }
      if (!on || k >= n) return;
      const t = setTimeout(() => setK(k + 1), k === 0 ? first : every); return () => clearTimeout(t);
    }, [on, k, reduce]);
    return k;
  }
  // 1 · the Watcher's alert. Its figure rolls in as its row arrives; the spoken figure is the final one throughout
  function AlertCard() {
    const { shown, card, rise } = useRise(); const rolled = useLit(shown, 1, 490, 0) > 0;
    return <motion.div className="m-card" role="group" aria-label="The Watcher's alert" {...card}>
      <motion.div className="m-head" {...rise(0)}><span className="chip-agent on"><i aria-hidden="true" />Watcher · 09:00</span><Badge tone="red" dot>At risk</Badge></motion.div>
      <motion.div className="m-batch" {...rise(1)}><Product name="pack-snack-plain" size={52} /><span><b>{SKU.name}</b><span>{fmt.num(BATCH.units)} packs in a distributor's godown, {DIST.city}</span></span></motion.div>
      <motion.div className="m-gates" {...rise(2)}><GateChips gates={D.RISK.gates} /></motion.div>
      <motion.div className="m-big" {...rise(3)}><span className="num"><Roll key={rolled ? "on" : "off"} value={D.RISK.atRisk} from={rolled ? 0 : undefined} /></span><span>packs won't sell in the {BATCH.daysLeft} days they have left</span></motion.div>
    </motion.div>;
  }
  // 2 · the Valuer's price for every exit, net a pack, and the Router's split
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
        <div className="m-split-cap"><span>The Router's split</span><span>{fmt.num(D.RISK.atRisk)} packs</span></div>
        <div className="m-split" aria-hidden="true"><span className="k" style={{ flexGrow: KL.units }} /><span className="e" style={{ flexGrow: ESL.units }} /></div>
        <div className="m-split-legend"><span><i className="ex-dot kirana" aria-hidden="true" />{fmt.num(KL.units)} to {SHOPS} kiranas</span><span><i className="ex-dot expiresoon" aria-hidden="true" />{fmt.num(ESL.units)} on ExpireSoon</span></div>
      </motion.div>
    </motion.div>;
  }
  // 3 · the plan, waiting for one yes, and the agents it releases, lighting in turn. The button is the plan's own,
  // pictured: it does nothing here
  const RELEASED = agentsAt("execute", "settle", "report");
  function PlanCard() {
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
  const MOMENTS = [
    { t: "Spot it while there is time to sell", art: "godown-plain", who: agentsAt("connect", "detect", "verify"), Card: AlertCard,
      text: "Every morning at 09:00 the Watcher checks each batch against its date and the quick-commerce shelf-life rules, and flags the stock that won't sell in time. Vision reads the label photo from the godown to be sure." },
    { t: "Price every exit, the bin included", art: "kirana-plain", who: agentsAt("value", "decide"), Card: PricesCard,
      text: `Kiranas on a ${SCHEME.free}-free-with-${SCHEME.buy} scheme, a clearance marketplace, a staff sale at the godown, a food bank: the Valuer prices each exit against the true cost of destroying the stock, and the Router splits the batch within each exit's limits.` },
    { t: "Say yes once. The agents do the rest.", art: "documents", yes: true, who: ["a person"].concat(RELEASED), Card: PlanCard,
      text: "A person approves the plan with the money on screen; nothing is listed, messaged or shipped before that tap. Then the agents list the lot, send kirana offers in Hindi, answer bids, draft the invoice, credit note and GST memo, and post the impact." },
  ];
  function How() {
    return <section id="how" className="sec sec-how" aria-labelledby="how-h">
      <div className="wrap">
        <header className="sec-head"><h2 id="how-h" className="sec-h plain">How Smart‑Clearance works</h2>
          <p className="sec-sub">It watches the stock in your distributors' godowns. When a batch won't sell before its date, its agents find the exit that recovers the most and do the work, once a person says yes.</p></header>
        <ol className="moments">{MOMENTS.map((m, i) => <li key={m.t} className={cx("moment", i % 2 === 1 && "flip")}>
          <div className="m-copy">
            <span className="row tight"><span className={cx("step-n", m.yes && "yes")} aria-hidden="true">{i + 1}</span><h3>{m.t}</h3></span>
            <p>{m.text}</p>
            <span className="agents">{m.who.map((w, j) => <span key={w} className={cx("chip-agent on", m.yes && j === 0 && "person")}><i aria-hidden="true" />{w}</span>)}</span>
          </div>
          <div className="m-stage"><Product name={m.art} size={124} className="m-art" /><m.Card /></div>
        </li>)}</ol>
      </div>
    </section>;
  }

  /* ---------- 3. five exits, one batch: the packs take the street, then the batch is split by exit (SC-28, options 1 and 2) ---------- */
  // x: where each exit stands along the street plate, as a share of its width
  const N = D.RISK.atRisk;
  const EXITS = [
    { id: "kirana", name: "Kiranas", x: 0.35, packs: KL.units, taken: true, art: "kirana-plain", total: KL.net,
      per: `${rate(row("kirana").net)} a pack, after the van`, line: n => `${fmt.num(n)} packs · ${SHOPS} shops` },
    { id: "expiresoon", name: "ExpireSoon", x: 0.515, packs: AW.units, taken: true, art: "marketplace-bag", total: ES_NET,
      per: `${rate(AW.price)} a pack, countered from ${rate(ESL.price)}`, line: n => `${fmt.num(n)} packs · ${rate(AW.price)}` },
    { id: "staff", name: "Staff sale", x: 0.65, packs: 0, art: "godown-plain", note: "priced, not needed",
      per: `${rate(row("staff").net)} a pack, up to ${row("staff").capacity} packs` },
    { id: "foodbank", name: "Food bank", x: 0.785, packs: 0, art: "donation-crate", note: "priced, not needed",
      per: `${rate(row("foodbank").net)} a pack: a donation reverses the GST credit` },
    { id: "bin", name: "The bin", x: 0.93, packs: 0, bin: true, art: "bin-plain", total: -BIN, note: "not taken",
      per: `${rate(-D.PLAN.writeOff.perUnit)} a pack` },
  ];
  const TAKEN = EXITS.filter(e => e.taken);
  // the street plate's own coordinates (4256 × 992): the godown's door, the road, the shopfronts and the heap. The packs
  // leave the door, take the road, and turn up into each exit that took some
  const PW = 4256, PH = 992, DOOR = { x: 610, y: 690 }, ROAD = 812, FRONT = 646, HEAP = 742, EX_AR = PW / PH;
  const exX = e => Math.round(e.x * PW), endY = e => e.bin ? HEAP : FRONT;
  const OUT = `M${DOOR.x} ${DOOR.y} C${DOOR.x + 30} ${ROAD - 40} ${DOOR.x + 120} ${ROAD} ${DOOR.x + 260} ${ROAD}`;
  const TRUNK = `${OUT} L${exX(EXITS[4]) - 110} ${ROAD}`;
  const turn = e => { const x = exX(e); return ` Q${x} ${ROAD} ${x} ${ROAD - 100} L${x} ${endY(e)}`; };
  const spur = e => `M${exX(e) - 110} ${ROAD}${turn(e)}`;
  const route = e => `${OUT} L${exX(e) - 110} ${ROAD}${turn(e)}`;
  // a dot is about 50 packs; the two streams leave the godown interleaved, 12 to the kiranas and 15 to the buyer
  const DOT = 50, DOTS = [];
  { const k = Math.round(TAKEN[0].packs / DOT), n = k + Math.round(TAKEN[1].packs / DOT); let sent = 0;
    for (let i = 0; i < n; i++) { const toK = sent < Math.round((i + 1) * k / n); DOTS.push(toK ? TAKEN[0] : TAKEN[1]); if (toK) sent += 1; } }
  const dotsTo = id => DOTS.filter(d => d.id === id).length;
  const NONE = { kirana: 0, expiresoon: 0 }, ALL = Object.fromEntries(TAKEN.map(e => [e.id, e.packs]));
  // the street's drawing, over the plate: the road the packs take, each exit's way in (solid where packs went, dashed
  // where none did, a cross on the bin's), the dots, and the godown's count draining as they leave
  function Flow({ stage, left, reduce, dots, routes }) {
    const drawn = stage !== "wait"; const t = (duration, delay = 0) => reduce ? { duration: 0 } : { duration, delay, ease: EASE };
    return <div className={cx("flow-layer", stage)} aria-hidden="true">
      <svg viewBox={`0 0 ${PW} ${PH}`} preserveAspectRatio="none">
        <defs><filter id="fl-glow" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="14" /></filter></defs>
        <motion.path className="fl-glow" d={TRUNK} initial={false} animate={{ opacity: drawn ? 1 : 0 }} transition={t(0.6)} />
        <motion.path className="fl-trunk" d={TRUNK} initial={false} animate={{ pathLength: drawn ? 1 : 0 }} transition={t(0.7)} />
        {EXITS.map((e, i) => e.taken
          ? <motion.path key={e.id} className={"fl-spur " + e.id} d={spur(e)} initial={false} animate={{ pathLength: drawn ? 1 : 0 }} transition={t(0.35, 0.3 + i * 0.12)} />
          : <motion.path key={e.id} className={"fl-spur none " + e.id} d={spur(e)} initial={false} animate={{ opacity: drawn ? 1 : 0 }} transition={t(0.4, 0.5 + i * 0.08)} />)}
        {EXITS.map(e => <circle key={"at" + e.id} className={cx("fl-drop", e.id, e.taken && "taken")} cx={exX(e)} cy={endY(e)} r={e.taken ? 30 : 24} />)}
        <path className="fl-x" d={`M${exX(EXITS[4]) - 15} ${HEAP - 15} l30 30 m0 -30 l-30 30`} />
        {TAKEN.map(e => <path key={"way" + e.id} ref={el => { routes.current[e.id] = el; }} d={route(e)} fill="none" stroke="none" />)}
        {DOTS.map((e, i) => <circle key={i} ref={el => { dots.current[i] = el; }} className={"fl-dot " + e.id} r="22" cx={DOOR.x} cy={DOOR.y} opacity="0" />)}
      </svg>
      <div className="fl-tag" style={{ left: (DOOR.x / PW * 100) + "%" }}><b>{fmt.num(left)}</b><span>{left ? " packs at the godown" : " packs left at the godown"}</span></div>
    </div>;
  }
  // the batch split by exit: ribbons as wide as the packs each exit took (threads where it took none), each exit's
  // render, price a pack and what it came to; on a phone a bar of each exit's share stands in for the ribbons
  function Split({ boxRef, drawn, reduce, run }) {
    const svg = useRef(null), src = useRef(null), rows = useRef([]); const [geo, setGeo] = useState(null);
    // the ribbons meet the rows wherever they wrap to: measured, and measured again on resize
    React.useLayoutEffect(() => {
      const measure = () => {
        const s = svg.current, b = src.current;
        if (!s || !b || getComputedStyle(s).display === "none") { setGeo(null); return; }
        const r = s.getBoundingClientRect(), br = b.getBoundingClientRect();
        const band = Math.min(150, br.height * 0.8); let y0 = br.top + br.height / 2 - band / 2 - r.top;
        setGeo({ w: r.width, h: r.height, rows: EXITS.map((e, i) => { const q = rows.current[i].getBoundingClientRect(), t = e.packs / N * band, g = { e, a: y0, t, cy: q.top + q.height / 2 - r.top }; y0 += t; return g; }) });
      };
      measure(); const ro = new ResizeObserver(measure); ro.observe(boxRef.current); return () => ro.disconnect();
    }, []);
    const t = (duration, delay) => reduce ? { duration: 0 } : { duration, delay, ease: EASE };
    const ribbon = g => { const c = geo.w * 0.55, h = g.t / 2, ya = g.a + h; return `M12 ${ya - h} C${c} ${ya - h} ${c} ${g.cy - h} ${geo.w} ${g.cy - h} L${geo.w} ${g.cy + h} C${c} ${g.cy + h} ${c} ${ya + h} 12 ${ya + h} Z`; };
    const thread = g => { const c = geo.w * 0.55; return `M12 ${g.a} C${c} ${g.a} ${c} ${g.cy} ${geo.w} ${g.cy}`; };
    return <div className="split" ref={boxRef} role="group" aria-label="Where the batch went">
      <div className="split-src" ref={src}><Product name="pack-snack-plain" size={72} /><span className="split-n">{fmt.num(N)}</span><span className="split-cap">packs of masala chips with {BATCH.daysLeft} days left, at the distributor's godown</span></div>
      <svg className="split-svg" ref={svg} aria-hidden="true" viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : "0 0 1 1"} preserveAspectRatio="none">
        {geo && <defs><clipPath id="sp-wipe"><motion.rect key={"w" + run} x="0" y="0" height={geo.h} initial={reduce ? false : { width: 0 }} animate={{ width: drawn ? geo.w : 0 }} transition={t(1.1, 0.2)} /></clipPath></defs>}
        {geo && <g clipPath="url(#sp-wipe)">{geo.rows.map(g => <path key={g.e.id} className={cx(g.e.packs ? "sp-band" : "sp-none", g.e.id)} d={g.e.packs ? ribbon(g) : thread(g)} />)}</g>}
        {geo && geo.rows.filter(g => g.e.packs).map(g => <rect key={"src" + g.e.id} className={"sp-src " + g.e.id} x="0" y={g.a} width="12" height={g.t} />)}
      </svg>
      <ol className="split-rows">{EXITS.map((e, i) => <li key={e.id} ref={el => { rows.current[i] = el; }} className={cx("split-row", e.id, e.taken ? "taken" : "none", e.bin && "bin")}>
        <Product name={e.art} size={52} className="sr-art" />
        <span className="sr-main"><b>{e.name}</b><span>{e.taken ? `${fmt.num(e.packs)} packs · ${e.per}` : e.per}</span>
          <span className="sr-share" aria-hidden="true"><motion.i key={"s" + run} initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: drawn ? e.packs / N : 0 }} transition={t(0.7, 0.3 + i * 0.12)} /></span></span>
        <motion.span key={"v" + run} className="sr-v" initial={reduce || !e.taken ? false : { opacity: 0, y: 6 }} animate={{ opacity: drawn || !e.taken ? 1 : 0, y: drawn || !e.taken ? 0 : 6 }} transition={t(0.4, 1 + i * 0.12)}>
          {e.taken ? fmt.inr(e.total) : e.bin ? <><span className="sr-no">{e.note}</span><span className="sr-cost">{fmt.inr(e.total)} if destroyed</span></> : <span className="sr-no">{e.note}</span>}
        </motion.span>
      </li>)}</ol>
    </div>;
  }
  function Exits() {
    const app = useApp(); const reduce = useReducedMotion(); const night = useTheme().resolved === "dark"; const swipe = app.bp !== "desktop";
    const pan = useRef(null), split = useRef(null), dots = useRef([]), routes = useRef({});
    // the street plays once nearly all of its strip is in view, since the road runs along its foot (on a phone the strip
    // is a window onto a street about three screens wide); the split is drawn once the packs have arrived, or as soon as
    // it is seen if the street hasn't started. Each plays once, under five seconds; Replay runs both again
    const streetSeen = Motion.useInView(pan, { once: true, amount: 0.9 }), splitSeen = Motion.useInView(split, { once: true, amount: 0.4 });
    const [run, setRun] = useState(0), [stage, setStage] = useState(reduce ? "done" : "wait"), [left, setLeft] = useState(reduce ? 0 : N);
    const [got, setGot] = useState(reduce ? ALL : NONE), [splitRun, setSplitRun] = useState(reduce ? 0 : -1);
    useEffect(() => { if (reduce) { setStage("done"); setLeft(0); setGot(ALL); } }, [reduce]);
    // where the street is a strip, it opens on the godown, where the packs start; with nothing to follow under reduced
    // motion, it opens on the kiranas, the first exit that took some
    useEffect(() => {
      const el = pan.current, li = el && el.querySelector(".ex-chips > li"), fig = el && el.querySelector(".ex-pano");
      if (!swipe || !li || !fig) return;
      el.scrollLeft = reduce ? Math.max(0, fig.offsetLeft + li.offsetLeft - el.clientWidth / 2) : 0;
    }, [swipe, reduce]);
    useEffect(() => {
      if (reduce || !streetSeen) return;
      setStage("play"); setLeft(N); setGot(NONE);
      const controls = [], timers = [], arrived = { ...NONE }, el = pan.current, fig = el && el.querySelector(".ex-pano");
      const x0 = fig ? fig.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft : 0; let gone = 0, lead = 0;
      DOTS.forEach((e, i) => {
        const path = routes.current[e.id], c = dots.current[i]; if (!path || !c) return;
        const L = path.getTotalLength(), delay = 0.55 + i * 0.105, duration = 0.42 + L / 5200;
        timers.push(setTimeout(() => { gone += 1; setLeft(Math.round(N * (1 - gone / DOTS.length))); }, delay * 1000));
        controls.push(Motion.animate(0, 1, { duration, delay, ease: [0.45, 0, 0.4, 1],
          onUpdate: v => {
            const pt = path.getPointAtLength(v * L);
            c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y); c.setAttribute("opacity", v < 0.05 ? v * 20 : v > 0.93 ? Math.max(0, (1 - v) * 14) : 1);
            // where the street is a strip that scrolls, it follows the leading dot, this once
            if (fig && el.scrollWidth > el.clientWidth + 4 && pt.x > lead) { lead = pt.x; el.scrollLeft = Math.max(0, x0 + pt.x / PW * fig.clientWidth - el.clientWidth * 0.6); }
          },
          onComplete: () => {
            arrived[e.id] += 1; setGot(Object.fromEntries(TAKEN.map(x => [x.id, Math.round(x.packs * arrived[x.id] / dotsTo(x.id))])));
            if (arrived.kirana + arrived.expiresoon === DOTS.length) setStage("done");
          } }));
      });
      return () => { controls.forEach(c => c.stop()); timers.forEach(clearTimeout); };
    }, [streetSeen, run, reduce]);
    useEffect(() => {
      if (reduce) { setSplitRun(run); return; }
      if (splitSeen && splitRun !== run && stage !== "play") setSplitRun(run);
    }, [splitSeen, stage, run, reduce]);
    // the street is set going in the same render as the new run, so the split waits for its packs
    const replay = () => { setStage("play"); setLeft(N); setGot(NONE); setRun(r => r + 1); };
    // what the batch came to: the board's three cards (L2), each with the arithmetic that makes it
    const results = [
      { n: <Money value={D.ACTUAL.net} className="r-n" />, l: "recovered", w: `${fmt.inr(KL.net)} from ${SHOPS} kiranas, after the van, and ${fmt.inr(ES_NET)} from a marketplace buyer, after the listing fee` },
      { n: <Money value={D.ACTUAL.swing} className="r-n" />, l: "better than the bin", w: `${fmt.inr(D.ACTUAL.pnl)} on the brand's books with the plan, price support included, against ${fmt.inr(-BIN)} to destroy it` },
      { n: <span className="num r-n">0</span>, l: "cartons destroyed", w: `${fmt.num(D.PLAN.soldUnits)} packs sold on tax invoices, so the ${fmt.inr(D.PLAN.itcRetained)} GST credit stays` },
    ];
    return <section id="exits" className="sec sec-exits" aria-labelledby="exits-h">
      <div className="wrap">
        <header className="sec-head"><h2 id="exits-h" className="sec-h">Five exits, one batch</h2>
          <p className="sec-sub">One batch: {fmt.num(N)} packs of masala chips that won't sell in the {BATCH.daysLeft} days they have left. The agents priced every exit, the bin included, and sent the packs where they recover the most.</p></header>
      </div>
      <div className="ex-body">
        <div ref={pan} className="ex-pan" {...(swipe ? { tabIndex: 0, role: "region", "aria-label": "The street from the godown to the bin; scroll sideways" } : {})}>
          <figure className="ex-pano" style={{ "--ar": EX_AR }}>
            <img src={IMG + (night ? "exits-night.webp" : "exits.webp")} alt={`One miniature street from end to end${night ? " at night" : ""}: the distributor's godown, two kirana shops hung with snack packets, a general store, more small shops, a van, and a smouldering rubbish heap at the far end.`} />
            <Flow stage={stage} left={left} reduce={reduce} dots={dots} routes={routes} />
            {/* each taken exit counts its packs in as they arrive; the spoken count is the final one throughout */}
            <ul className="ex-chips">{EXITS.map(e => <li key={e.id} style={{ "--x": e.x }}>
              <span className={cx("ex-chip", e.id, e.taken && "taken", e.bin && "bin", e.taken && got[e.id] > 0 && "in")}>
                <span className="ex-name"><i className={"ex-dot " + e.id} aria-hidden="true" />{e.name}{e.taken && <Icon name="check" size={14} stroke={2.6} className="ex-took" />}</span>
                {e.taken ? <span className="ex-line"><span aria-hidden="true">{e.line(got[e.id])}</span><span className="sr-only">{e.line(e.packs)}</span></span>
                  : <span className="ex-line">{e.bin ? `${fmt.inr(-BIN)} · ${e.note}` : e.note}</span>}
              </span>
            </li>)}</ul>
          </figure>
        </div>
        <div className="flow-key">
          <span className="fk-dots" aria-hidden="true"><i className="kirana" /><i className="expiresoon" /></span>
          <p>Each dot is about {DOT} packs: green to {SHOPS} kiranas, violet to one buyer on ExpireSoon. The staff sale and the food bank were priced and not needed, and nothing went to the bin.</p>
          {!reduce && <button type="button" className="replay" onClick={replay}><Icon name="rotate-ccw" size={16} />{stage === "wait" ? "Send the batch" : "Send the batch again"}</button>}
        </div>
      </div>
      <div className="wrap">
        <Split boxRef={split} drawn={splitRun === run} reduce={reduce} run={run} />
        <div className="results" role="group" aria-label="What the batch came to">{results.map(r => <div key={r.l} className="result">{r.n}<span className="r-l">{r.l}</span><span className="r-w">{r.w}</span></div>)}</div>
        <p className="results-note">An illustrative batch. Every figure is worked out from the journey map.</p>
      </div>
    </section>;
  }

  /* ---------- 4. a workspace per manufacturer: the board's comp L5 (SC-28) ---------- */
  // x and y: where each island's flat top sits on the plate, as a share of its width and height; ly: its address label.
  // One product a manufacturer, none of them a client's.
  const ISLANDS = [
    { id: "brand", x: 0.22, y: 0.6, ly: 0.86, product: "pack-snack-plain", url: "your-brand.smartclearance.com", live: true },
    { id: "company", x: 0.575, y: 0.59, ly: 0.84, product: "pack-carton-plain", url: "your-company.smartclearance.com" },
    { id: "group", x: 0.8, y: 0.61, ly: 0.87, product: "bottle-oil-plain", url: "your-group.smartclearance.com" },
  ];
  const HUB = { x: 0.425, y: 0.69 }, ISL_AR = 3776 / 1120;
  // inside a workspace, each team gets its own part of the same batch
  const TEAMS = [
    { icon: "route", t: "Supply chain", d: "One tap to approve a plan, with the money on screen." },
    { icon: "receipt", t: "Finance", d: "The invoice, credit note and GST memo, drafted." },
    { icon: "leaf", t: "Sustainability", d: "A BRSR line an auditor can follow back to the batch." },
    { icon: "handshake", t: "Distributors", d: "Nothing listed in their name without their permission." },
  ];
  const CONN = ["dms", "tally", "bq", "sso", "expiresoon", "irp", "whatsapp"].map(id => P.CONNECTORS.find(c => c.id === id)).filter(Boolean);
  function Workspace() {
    const app = useApp(); const { resolved } = useTheme(); const swipe = app.bp === "phone";
    const urls = cls => <ul className={cx("isl-urls", cls)} aria-label="Workspace addresses">{ISLANDS.map(i => <li key={i.id} className={cx("isl-url", i.live && "live")} style={{ "--x": i.x, "--y": i.ly }}><i aria-hidden="true" />{i.url}{i.live && <span className="isl-live"> · live</span>}</li>)}</ul>;
    return <section id="teams" className="sec sec-ws" aria-labelledby="ws-h">
      <div className="wrap"><header className="sec-head"><h2 id="ws-h" className="sec-h plain">Your own workspace, set up for your supply chain.</h2><p className="sec-sub">Each manufacturer gets its own address, configured for how its stock really moves.</p></header></div>
      <div className="isl-pan" {...(swipe ? { tabIndex: 0, role: "region", "aria-label": "Workspaces, one island each; scroll sideways" } : {})}>
        <figure className="islands" style={{ "--ar": ISL_AR }}>
          <img className="isl-plate" src={IMG + (resolved === "dark" ? "islands-night.webp" : "islands.webp")} alt="" loading="lazy" />
          {ISLANDS.map(i => <span key={i.id} className="isl-packs" style={{ "--x": i.x, "--y": i.y }} aria-hidden="true"><Product name={i.product} size={160} className="isl-pack" /></span>)}
          <span className="isl-hub" style={{ "--x": HUB.x, "--y": HUB.y }} aria-hidden="true"><Mark size={52} /></span>
          {urls("on-plate")}
          <figcaption className="sr-only">Three islands over a miniature town, each a manufacturer's workspace with its own products, joined to Smart-Clearance by green paths.</figcaption>
        </figure>
      </div>
      <div className="wrap">
        {urls("below")}
        <ul className="teams" aria-label="What each team gets">{TEAMS.map(t => <li key={t.t} className="team"><Icon name={t.icon} size={26} /><b>{t.t}</b><p>{t.d}</p></li>)}</ul>
        <div className="conn"><ul className="conn-list" aria-label="Works with">{CONN.map(c => <li key={c.id}>{c.name}{c.status === "soon" && <span className="soon"> · soon</span>}</li>)}</ul></div>
      </div>
    </section>;
  }

  /* ---------- 5. plans, without prices, and the close: the board's comp L6 (SC-28) ---------- */
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
  function Close({ onDemo }) {
    // the heading and the buttons sit in the dusk plate's own sky
    return <section className="close" aria-labelledby="close-h">
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

  /* ---------- book a demo: the request lands in the console ---------- */
  function DemoSheet({ open: isOpen, plan, onClose }) {
    const app = useApp(); const blank = { name: "", company: "", email: "", makes: "Snacks and drinks", note: "" };
    const [f, setF] = useState(blank); const [err, setErr] = useState({}); const [sent, setSent] = useState(null);
    useEffect(() => { if (isOpen) { setSent(null); setErr({}); } }, [isOpen]);
    // each problem is said under its own field
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

  function Site() {
    const [find, setFind] = useState(false); const [demo, setDemo] = useState(null);
    useEffect(() => { document.title = "Smart-Clearance"; }, []);
    const onDemo = plan => setDemo({ plan: typeof plan === "string" ? plan : null });
    return <div className="site" id="top">
      <Nav onFind={() => setFind(true)} onDemo={onDemo} />
      <main>
        <Hero onFind={() => setFind(true)} />
        <How />
        <Exits />
        <Workspace />
        <Plans onDemo={onDemo} />
        <Close onDemo={onDemo} />
      </main>
      <Footer onFind={() => setFind(true)} />
      <S.FindWorkspace open={find} onClose={() => setFind(false)} onUse={() => { setFind(false); open(LINKS.app); }} note="One manufacturer's workspace is set up in this prototype." />
      <DemoSheet open={!!demo} plan={demo && demo.plan} onClose={() => setDemo(null)} />
    </div>;
  }
  function Root() { return <ThemeProvider><AppRoot className="site-root" style={{ position: "fixed", inset: 0 }}><NoticeHost><Site /></NoticeHost></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();

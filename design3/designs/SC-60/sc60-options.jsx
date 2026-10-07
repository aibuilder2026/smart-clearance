// SC-60 · the three options. Each is a complete landing page on the shared grammar (sc60-core.jsx), with its own first
// viewport and its own spine:
//   A · the film: the miniature business alive on film under enormous type, then the story in chapters;
//   B · islands in the sky: the business as islands in a sky, the batch flowing between them as the page is scrolled;
//   C · one yes: the plan on a phone over a table of miniatures; your tap sends the packs on their way.
(function () {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo } = React;
  const { useReducedMotion, motion, useScroll, useTransform, useInView, useMotionValueEvent, AnimatePresence, animate } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, Button, Badge, Mark, Money, Roll, Product, useApp, useTheme, StatusBar } = K;
  const C = window.SC60; const { FIG, AGENTS, AGENT, LINKS, linkProps, IMG, EASE, useRise, useLit, AgentChips } = C;
  const { KL, ESL, AW, BATCH, DIST, SKU, SHOPS, BIN, ES_NET, N, row, rate, SCHEME } = FIG;
  const OPT = window.SC60_OPTION || "c"; const S60 = window.SC60_IMG || "./", S60M = window.SC60_MEDIA || S60;
  const plate = (name, night) => S60 + name + (night ? "-night" : "") + ".webp";
  // where the plate is drawn inside a stage that covers it (object-fit: cover), so pins and the overlay follow it
  function useCover(stageRef, ar, pan = 0.5, panY = 0.5) {
    const [fit, setFit] = useState(null);
    useLayoutEffect(() => {
      const el = stageRef.current; if (!el) return;
      const measure = () => { const w = el.clientWidth, h = el.clientHeight; const s = Math.max(w / ar, h); const pw = s * ar, ph = s; setFit({ w, h, pw, ph, x: (w - pw) * pan, y: (h - ph) * panY }); };
      measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
    }, [ar, pan, panY]);
    return fit;
  }
  const at = (fit, p) => fit ? { left: fit.x + p.x * fit.pw, top: fit.y + p.y * fit.ph } : { left: 0, top: 0 };

  /* ================= A · the film ================= */
  const WORDS = ["buyer", "shelf", "invoice", "ledger line", "chance"];
  function HeroFilm({ onDemo }) {
    const night = useTheme().resolved === "dark"; const reduce = useReducedMotion(); const vid = useRef(null);
    const [state, setState] = useState(reduce ? "still" : "playing");
    const [w, setW] = useState(reduce ? WORDS.length - 1 : 0);
    useEffect(() => { if (reduce || w >= WORDS.length - 1) return; const t = setTimeout(() => setW(w + 1), w === 0 ? 1500 : 1000); return () => clearTimeout(t); }, [w, reduce]);
    const src = S60M + (night ? "a-town-night.mp4" : "a-town.mp4"), poster = IMG + (night ? "business-night.webp" : "business.webp");
    const toggle = () => { const v = vid.current; if (!v) return; if (state === "playing") { v.pause(); setState("paused"); } else { if (state === "ended") v.currentTime = 0; v.play(); setState("playing"); } };
    return <section className="s60-hero s60-film" id="agents" aria-labelledby="hero-h">
      <div className="film-media" aria-hidden="true">
        {reduce ? <img src={poster} alt="" /> : <video key={src} ref={vid} src={src} poster={poster} muted playsInline autoPlay preload="auto" onEnded={() => setState("ended")} />}
        <div className="film-shade" />
      </div>
      <div className="film-copy">
        <h1 id="hero-h" className="film-h">Every near-expiry carton gets a second <span className="film-word"><span className="sr-only">chance</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={WORDS[w]} aria-hidden="true" initial={reduce ? false : { opacity: 0, y: "0.5em" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "-0.5em" }} transition={{ duration: 0.42, ease: EASE }}>{WORDS[w]}</motion.span>
          </AnimatePresence></span>.</h1>
        <p className="film-sub">AI agents find the best exit for short-dated stock, and do the running around. You say yes once.</p>
        <div className="film-ctas"><Button variant="primary" size="lg" pill onClick={() => onDemo()}>Book a demo</Button><a className="btn btn-lg btn-pill film-ghost" {...linkProps(LINKS.demo)}><i aria-hidden="true"><Icon name="play" size={12} stroke={2.6} /></i>Watch the 6-minute demo</a></div>
      </div>
      {!reduce && <div className="film-ctl"><button type="button" onClick={toggle}><Icon name={state === "playing" ? "pause" : state === "ended" ? "rotate-ccw" : "play"} size={16} />{state === "playing" ? "Pause" : state === "ended" ? "Replay" : "Play"}</button></div>}
    </section>;
  }
  const PhoneStage = ({ children, scale = 0.78 }) => <div className="ch-phone" style={{ height: 868 * scale }}><K.PhoneFrame time="09:00" scale={scale} dark={false}><div style={{ padding: "60px 14px 30px", display: "grid", gap: 12, alignContent: "start" }}>{children}</div></K.PhoneFrame></div>;
  function PageA({ onFind, onDemo, closeRef }) {
    return <>
      <HeroFilm onDemo={onDemo} />
      <C.Statement text="Short-dated stock that quick commerce sent back. Priced to every exit, the bin included. Sold in the days it has left." id="how" />
      <C.Chapter id="watch" tone="green" title="Spot it while there is time to sell" lede={`Every morning at 09:00 the Watcher checks each batch against its date and the quick-commerce shelf-life rules. Vision reads the label photo from the godown to be sure.`} who={C.agentsAt("connect", "detect", "verify")}>
        <C.AlertCard />
      </C.Chapter>
      <C.Chapter id="price" tone="sunken" title="Price every exit, the bin included" lede={`Kiranas on a ${SCHEME.free}-free-with-${SCHEME.buy} scheme, a clearance marketplace, a staff sale at the godown, a food bank: the Valuer prices each against the true cost of destroying the stock, and the Router splits the batch within each exit's limits.`} who={C.agentsAt("value", "decide")}>
        <C.PricesCard />
      </C.Chapter>
      <C.Chapter id="yes" tone="amber" title="Say yes once." lede="A person approves the plan with the money on screen. Nothing is listed, messaged or shipped before that tap." who={["a person"]} person>
        <C.PlanCard />
      </C.Chapter>
      <C.Chapter id="work" tone="night" title="The agents do the rest." lede="They send the kirana offers in Hindi, list the lot in the distributor's name, answer bids, draft the invoice, credit note and GST memo, and post the impact." who={C.agentsAt("execute", "settle", "report")} wide>
        <C.WorkCards />
      </C.Chapter>
      <C.Ledger />
      <C.ExitsRow />
      <C.Workspace />
      <C.Plans onDemo={onDemo} />
      <C.Close onDemo={onDemo} closeRef={closeRef} />
    </>;
  }

  /* ================= B · islands in the sky ================= */
  // where each island sits on the plate (fractions of its width and height), measured from the render
  const ISL = window.SC60_ISLANDS || { factory: { x: 0.18, y: 0.66 }, godown: { x: 0.31, y: 0.3 }, kitchen: { x: 0.55, y: 0.15 }, kiranas: { x: 0.71, y: 0.37 }, buyer: { x: 0.82, y: 0.17 }, dump: { x: 0.84, y: 0.68 } };
  const SKY_AR = 2752 / 1536;
  const BEATS = [
    { id: "stock", t: "Stocked", at: "godown", who: [], did: `${fmt.num(BATCH.units)} packs of masala chips in the distributor's godown, selling ${BATCH.sellPerDay} a day.`, fig: <><span className="num">{fmt.num(BATCH.units)}</span><span>packs, {BATCH.daysLeft} days to the date</span></> },
    { id: "risk", t: "At risk", at: "godown", who: ["data", "watcher", "vision"], did: `The quick-commerce apps won't take stock this close to its date. Vision reads the label from the godown; the date matches.`, fig: <><span className="num red">{fmt.num(N)}</span><span>packs won't sell in time</span></>, risk: true },
    { id: "route", t: "Priced and split", at: "godown", who: ["valuer", "router"], did: `Kiranas, a marketplace, a staff sale, a food bank, the bin: each priced net a pack. ${fmt.num(KL.units)} packs to ${SHOPS} kiranas, ${fmt.num(AW.units)} to one buyer.`, fig: <><Money value={-BIN} /><span>to destroy it, the GST credit lost</span></> },
    { id: "yes", t: "One yes", at: "factory", who: ["you"], human: true, did: "At the maker's office a person approves the plan in one tap, with the money on screen. Nothing moves before it.", fig: <><Money value={D.PLAN.net} /><span>on screen before the yes</span></> },
    { id: "sell", t: "Sold", at: ["kiranas", "buyer"], who: ["outreach", "lister", "negotiator"], did: `Outreach sends the offer to ${SHOPS} kiranas in Hindi. The Lister posts the lot in the distributor's name; the Negotiator counters a bid to ${rate(AW.price)}.`, fig: <><span className="num">{fmt.num(KL.units + AW.units)}</span><span>packs sold, 0 destroyed</span></> },
    { id: "settle", t: "Settled", at: ["factory", "dump"], who: ["paperwork", "impact"], did: `Paperwork drafts the invoice, the price-support credit note and the GST memo. Impact posts ${fmt.num(D.PLAN.kg)} kg kept out of the landfill.`, fig: <><Money value={D.ACTUAL.net} /><span>recovered, net</span></> },
  ];
  const NB = BEATS.length; const PINS = { factory: ["The maker", "factory"], godown: ["Distributor · stockist", "warehouse"], kitchen: ["Food bank", "heart-handshake"], kiranas: ["Retailers", "store"], buyer: ["A buyer elsewhere", "truck"], dump: ["Landfill", "trash-2"] };
  const curve = (a, b, lift) => `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y}`;
  function HeroSky({ onFind, onDemo }) {
    const night = useTheme().resolved === "dark"; const reduce = useReducedMotion(); const app = useApp();
    const track = useRef(null), stage = useRef(null); const fit = useCover(stage, SKY_AR, app.bp === "phone" ? 0.42 : 0.5);
    const { scrollYProgress: p } = useScroll({ target: track, offset: ["start start", "end end"] });
    const [k, setK] = useState(-1);
    const segs = NB + 1; // the copy first, then a stop a segment
    useMotionValueEvent(p, "change", v => { const i = Math.min(NB - 1, Math.floor(v * segs) - 1); if (i !== k) setK(i); });
    const copyO = useTransform(p, [0, 0.9 / segs], [1, 0]), copyY = useTransform(p, [0, 0.9 / segs], [0, -40]);
    // on phones and tablets the pins wait until the copy has gone, so nothing stands over the heading
    const layerO = useTransform(p, [0.3 / segs, 0.9 / segs], [0, 1]); const desk = app.bp === "desktop";
    // the packs leave the godown during Sold
    const sold = useTransform(p, [(4 + 0.1) / segs, (5 - 0.05) / segs], [0, 1]);
    const dots = useRef([]), paths = useRef({});
    const W = 1000, H = Math.round(W / SKY_AR); const pt = id => ({ x: ISL[id].x * W, y: ISL[id].y * H });
    // the plate's own painted road, traced in the layer's units (1000 wide): the godown's forecourt to the lane, and the
    // upper loop past the kitchen to the buyer
    const R = window.SC60_ROADS || { kirana: "M470 291 C 530 302, 585 300, 640 282", expiresoon: "M470 291 C 490 230, 530 180, 600 165 L 700 160 C 760 158, 790 150, 805 140" };
    const routes = { kirana: R.kirana, expiresoon: R.expiresoon };
    const DOTS = useMemo(() => { const out = []; const nk = Math.round(KL.units / 50), ne = Math.round(AW.units / 50); for (let i = 0; i < nk + ne; i++) out.push(i % 2 === 0 && i / 2 < nk ? "kirana" : "expiresoon"); return out; }, []);
    useMotionValueEvent(sold, "change", v => {
      DOTS.forEach((id, i) => { const c = dots.current[i], path = paths.current[id]; if (!c || !path) return; const L = path.getTotalLength(); const u = Math.max(0, Math.min(1, (v - i * 0.02) / 0.6)); const q = path.getPointAtLength(u * L); c.setAttribute("cx", q.x); c.setAttribute("cy", q.y); c.setAttribute("opacity", u <= 0 || u >= 1 ? 0 : 1); });
    });
    const go = i => { const el = track.current; if (!el) return; const top = el.getBoundingClientRect().top + window.scrollY; const h = el.offsetHeight - window.innerHeight; window.scrollTo({ top: top + h * ((i + 1.5) / segs), behavior: reduce ? "auto" : "smooth" }); };
    const beat = k >= 0 ? BEATS[k] : null; const here = beat ? [].concat(beat.at) : [];
    const card = b => <div className="sky-card" role="group" aria-live="polite">
      <header><span className="n">{BEATS.indexOf(b) + 1} of {NB}</span><h2>{b.t}</h2></header>
      <div className="fig">{b.fig}</div><p>{b.did}</p>
      {b.who.length > 0 && <AgentChips who={b.who.map(w => AGENT[w].name)} person={b.human} />}
    </div>;
    const still = reduce;
    return <section className={cx("s60-hero s60-sky", still && "still")} id="agents" aria-labelledby="hero-h" ref={track}>
      <div className="sky-stage" ref={stage}>
        <img className="sky-plate" src={plate("b-islands", night)} alt={`A miniature diorama of a snack business as six islands floating in a ${night ? "night" : "morning"} sky: a factory and its office, a distributor's godown full of cartons, a lane of kirana shops, a wholesale warehouse, a community kitchen and, far off and small, a closed dump yard, joined by thin glowing green roads through the air.`} />
        {fit && <motion.div className="sky-layer" style={{ left: fit.x, top: fit.y, width: fit.pw, height: fit.ph, opacity: still || desk ? 1 : layerO }} aria-hidden="true">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {Object.entries(routes).map(([id, d]) => <path key={id} ref={el => { paths.current[id] = el; }} className={"sky-route " + id} d={d} style={{ opacity: 0 }} />)}
            {!still && DOTS.map((id, i) => <circle key={i} ref={el => { dots.current[i] = el; }} className={"sky-dot " + id} r="9" opacity="0" />)}
          </svg>
          {Object.entries(PINS).map(([id, [name, icon]]) => <span key={id} className={cx("sky-pin", here.includes(id) && (beat && beat.risk ? "risk" : beat && beat.human ? "human" : "here"))} style={at(fit, ISL[id])}><span className="sky-pin-body"><i><Icon name={icon} size={13} stroke={2.2} /></i>{name}</span><span className="stem" /></span>)}
        </motion.div>}
        <motion.div className="sky-scrim" aria-hidden="true" style={still ? undefined : { opacity: copyO }} />
        <motion.div className="sky-copy" style={still ? undefined : { opacity: copyO, y: copyY }}>
          <h1 id="hero-h" className="sky-h">Every near-expiry carton gets a second chance.</h1>
          <p className="sky-sub">AI agents find the best exit for short-dated stock. You say yes once.{!still && " Scroll to follow one batch."}</p>
          <div className="sky-ctas"><Button variant="primary" size="lg" onClick={() => onDemo()}>Book a demo</Button><button type="button" className="btn btn-secondary btn-lg" onClick={onFind}>Find your workspace</button></div>
        </motion.div>
        {!still && <ol className="sky-rail" aria-label="The batch's stops">{BEATS.map((b, i) => <li key={b.id}><button type="button" className={cx(i < k && "done", i === k && "on")} aria-current={i === k ? "step" : undefined} onClick={() => go(i)}><i aria-hidden="true" /><span>{b.t}</span></button></li>)}</ol>}
        {!still && <AnimatePresence mode="wait">{beat && <motion.div key={beat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: EASE }} style={{ display: "contents" }}>{card(beat)}</motion.div>}</AnimatePresence>}
        {!still && k === NB - 1 && <div className="sky-ctl"><button type="button" className="replay" onClick={() => go(-1)}><Icon name="rotate-ccw" size={16} />From the start</button></div>}
      </div>
      {still && <ol className="sky-list" aria-label="The batch's stops">{BEATS.map(b => <li key={b.id}>{card(b)}</li>)}</ol>}
    </section>;
  }
  function PageB({ onFind, onDemo, closeRef }) {
    return <>
      <HeroSky onFind={onFind} onDemo={onDemo} />
      <C.Statement text="The agents watch, verify, price and route. A person says yes once. Then they list, message, negotiate, draft and report, and every rupee and kilo lands in one ledger." id="how" />
      <C.Ledger />
      <C.ExitsRow />
      <C.Workspace />
      <C.Plans onDemo={onDemo} />
      <C.Close onDemo={onDemo} closeRef={closeRef} />
    </>;
  }

  /* ================= C · one yes ================= */
  // the phone's screen and the miniatures on the plate (fractions of its width and height), measured from the render
  const TAB = window.SC60_TABLE || { phone: { x: 0.68, y: 0.35, w: 0.107, h: 0.42 }, card: { x: 0.49, y: 0.31 },
    kiranas: { x: 0.44, y: 0.585 }, buyer: { x: 0.635, y: 0.63 }, godown: { x: 0.25, y: 0.535 }, kitchen: { x: 0.75, y: 0.72 }, dump: { x: 0.86, y: 0.7 },
    dropK: { x: 0.47, y: 0.66 }, dropB: { x: 0.66, y: 0.69 } };
  const TAB_AR = 2752 / 1536;
  const WORK = [["lister", 0], ["outreach", 300], ["negotiator", 1700], ["paperwork", 2500], ["impact", 3100]];
  function YesSheet({ phase, lit, onApprove, nudge }) {
    const reduce = useReducedMotion();
    return <div className="ys" role="group" aria-label={phase === "idle" || phase === "busy" ? "The plan, waiting for your yes" : "The plan, placed"}>
      <div className="ys-top"><span className="who"><Mark size={24} /><b>Route Room</b></span>{phase === "idle" || phase === "busy" ? <Badge tone="amber" dot>Waiting for you</Badge> : <Badge tone="green" icon="check">Placed · 09:40</Badge>}</div>
      {phase === "idle" || phase === "busy" ? <>
        <h3>Approve the plan</h3>
        <div className="big"><Money value={D.PLAN.net} /><span>net recovered, {D.PLAN.pctMRP}% of MRP</span></div>
        <div className="rows">
          <div className="r"><span>Instead of destroying</span><b className="red">{fmt.inr(-BIN)}</b></div>
          <div className="r"><span>{fmt.num(KL.units)} packs to {SHOPS} kiranas</span><b>{fmt.inr(KL.net)}</b></div>
          <div className="r"><span>{fmt.num(ESL.units)} packs on ExpireSoon</span><b>{fmt.inr(ESL.net)}</b></div>
          <div className="r"><span>GST input credit kept</span><b>{fmt.inr(D.PLAN.itcRetained)}</b></div>
        </div>
        <div className="then"><span>Nothing is listed or messaged before this tap.</span></div>
        <div className={cx("go", nudge && "nudge")}><Button variant="approve" size="lg" block icon="check" loading={phase === "busy"} onClick={onApprove}>Approve · release the agents</Button></div>
      </> : <>
        <div className="placed">
          <svg width="64" height="64" viewBox="0 0 96 96" aria-hidden="true"><motion.circle cx="48" cy="48" r="42" fill="none" stroke="var(--primary)" strokeWidth="6" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }} /><motion.path d="M30 49 L43 62 L67 36" fill="none" stroke="var(--primary)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.4 }} /></svg>
          <span className="t">Plan placed</span>
          <Money value={D.PLAN.swing} roll from={reduce ? undefined : 0} /><p>better than the bin, on one batch of chips.</p>
        </div>
        <div className="work" aria-label="The agents at work">{WORK.map(([id], i) => <span key={id} className={cx("w", i < lit && "on")}><i aria-hidden="true"><Icon name={AGENT[id].icon} size={11} stroke={2.4} /></i><b>{AGENT[id].name}</b><span>· {AGENT[id].did}</span></span>)}</div>
      </>}
    </div>;
  }
  function HeroYes({ onFind, onDemo }) {
    const night = useTheme().resolved === "dark"; const reduce = useReducedMotion(); const app = useApp(); const desk = app.bp === "desktop";
    const stage = useRef(null); const fit = useCover(stage, TAB_AR, desk ? 0.5 : 0.3, desk ? 0.5 : 0.72);
    const [phase, setPhase] = useState(reduce ? "done" : "idle"); const [run, setRun] = useState(0); const [nudge, setNudge] = useState(false);
    const [got, setGot] = useState(reduce ? { kirana: KL.units, expiresoon: AW.units } : { kirana: 0, expiresoon: 0 });
    const lit = useLit(phase === "placed" || phase === "done", WORK.length, 200, 650);
    useEffect(() => { if (reduce || phase !== "idle") return; const t = setTimeout(() => setNudge(true), 3600); return () => clearTimeout(t); }, [phase, reduce, run]);
    const dots = useRef([]), paths = useRef({});
    const W = 1000, H = Math.round(W / TAB_AR); const pt = id => ({ x: TAB[id].x * W, y: TAB[id].y * H });
    // the packs leave the phone's screen (its foot, in the picture) or the card above the table (on phones)
    const cardEl = useRef(null); const [cardH, setCardH] = useState(440);
    useLayoutEffect(() => { const el = cardEl.current; if (!el) return; const m = () => setCardH(el.offsetHeight); m(); const ro = new ResizeObserver(m); ro.observe(el); return () => ro.disconnect(); }, [phase, desk]);
    const cardW = 360, half = fit ? (cardH / 2) / fit.ph * H : 0;
    const from = desk ? { x: TAB.card.x * W, y: TAB.card.y * H + half } : { x: W * 0.5, y: 0 };
    // the line from the plan, lifted off the phone, back to the phone's screen
    const tie = desk && fit ? `M${TAB.card.x * W + (cardW / 2) / fit.pw * W} ${TAB.card.y * H} L${(TAB.phone.x - TAB.phone.w / 2) * W} ${TAB.phone.y * H}` : null;
    const routes = { kirana: curve(from, pt("dropK"), desk ? 50 : 40), expiresoon: curve(from, pt("dropB"), desk ? 30 : 30) };
    const DOTS = useMemo(() => { const out = []; const nk = Math.round(KL.units / 50), ne = Math.round(AW.units / 50); let k = 0, e = 0; for (let i = 0; i < nk + ne; i++) { const toK = k < Math.round((i + 1) * nk / (nk + ne)); out.push(toK ? "kirana" : "expiresoon"); toK ? k++ : e++; } return out; }, []);
    const approve = () => { setNudge(false); setPhase("busy"); setTimeout(() => { setPhase("placed"); if (!desk && stage.current) stage.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" }); }, 650); };
    useEffect(() => {
      if (phase !== "placed") return;
      const arrived = { kirana: 0, expiresoon: 0 }, total = { kirana: DOTS.filter(d => d === "kirana").length, expiresoon: DOTS.filter(d => d === "expiresoon").length }; const controls = [];
      DOTS.forEach((id, i) => {
        const path = paths.current[id], c = dots.current[i]; if (!path || !c) return; const L = path.getTotalLength();
        controls.push(animate(0, 1, { duration: 0.9, delay: 0.3 + i * 0.1, ease: [0.45, 0, 0.4, 1],
          onUpdate: v => { const q = path.getPointAtLength(v * L); c.setAttribute("cx", q.x); c.setAttribute("cy", q.y); c.setAttribute("opacity", v < 0.06 ? v * 16 : v > 0.94 ? Math.max(0, (1 - v) * 16) : 1); },
          onComplete: () => { arrived[id] += 1; setGot({ kirana: Math.round(KL.units * arrived.kirana / total.kirana), expiresoon: Math.round(AW.units * arrived.expiresoon / total.expiresoon) }); if (arrived.kirana + arrived.expiresoon === DOTS.length) setPhase("done"); } }));
      });
      return () => controls.forEach(c => c.stop());
    }, [phase]);
    const replay = () => { setPhase("idle"); setGot({ kirana: 0, expiresoon: 0 }); setRun(r => r + 1); };
    const sheet = <YesSheet key={run} phase={phase} lit={lit} onApprove={approve} nudge={nudge} />;
    const mini = fit && desk ? { left: at(fit, TAB.phone).left, top: at(fit, TAB.phone).top, width: TAB.phone.w * fit.pw, height: TAB.phone.h * fit.ph, "--s": (TAB.phone.w * fit.pw) / cardW } : null;
    const tags = [
      { id: "kirana", at: "kiranas", name: "Kiranas", icon: "store", line: `${fmt.num(got.kirana)} of ${fmt.num(KL.units)} packs · ${SHOPS} shops` },
      { id: "expiresoon", at: "buyer", name: "A buyer elsewhere", icon: "truck", line: `${fmt.num(got.expiresoon)} of ${fmt.num(AW.units)} packs · ${rate(AW.price)} a pack` },
      { id: "godown", at: "godown", name: "The godown", icon: "warehouse", line: phase === "done" ? "0 packs left at risk" : `${fmt.num(N)} packs at risk` },
      { id: "dump", at: "dump", name: "Landfill", icon: "trash-2", line: phase === "done" ? `${fmt.num(D.PLAN.kg)} kg kept out` : "the bin would cost " + fmt.inr(-BIN) },
    ];
    return <section className="s60-hero s60-yes" id="agents" aria-labelledby="hero-h">
      <div className="yes-frame">
        <div className="yes-copy">
          <h1 id="hero-h" className="yes-h">Every near-expiry carton gets a second chance.</h1>
          <p className="yes-sub">AI agents find the best exit for short-dated stock. You say yes once.</p>
          <div className="yes-ctas"><Button variant="primary" size="lg" onClick={() => onDemo()}>Book a demo</Button><a className="btn btn-secondary btn-lg" {...linkProps(LINKS.demo)}>Watch the 6-minute demo</a></div>
        </div>
        {!desk && <div className="yes-phone">{sheet}</div>}
        <div className="yes-stage" ref={stage}>
          <img className="yes-plate" style={{ objectPosition: `${(desk ? 0.5 : 0.3) * 100}% ${(desk ? 0.5 : 0.72) * 100}%` }} src={plate("c-table", night)} alt={`A ${night ? "lamp-lit evening" : "morning"} table by a window: a hand holds a phone over a handmade miniature of a snack trade, a tiny godown full of cartons, a lane of kirana shops, a wholesale warehouse with a blue truck, a community kitchen, a closed dump yard in the far corner, a steel tumbler of chai, and a thin glowing green path along the table.`} />
          {fit && <div className="yes-layer" style={{ left: fit.x, top: fit.y, width: fit.pw, height: fit.ph }} aria-hidden="true">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {tie && <path className="yes-tie" d={tie} />}
              {Object.entries(routes).map(([id, d]) => <path key={id} ref={el => { paths.current[id] = el; }} className={"yes-path " + id} d={d} />)}
              {DOTS.map((id, i) => <circle key={i} ref={el => { dots.current[i] = el; }} className={"yes-dot " + id} r="9" opacity="0" />)}
            </svg>
            {tags.map(t => <span key={t.id} className={cx("yes-tag", t.id, got[t.id] > 0 && "in")} style={at(fit, TAB[t.at])}><span className="yes-tag-body"><b><i className={"ex-dot " + (t.id === "dump" ? "bin" : t.id === "godown" ? "" : t.id)} aria-hidden="true" />{t.name}</b><span>{t.line}</span></span><span className="stem" /></span>)}
          </div>}
          {mini && <div className="yes-mini" style={mini} aria-hidden="true"><div className="yes-mini-in">{sheet}</div></div>}
          {desk && fit && <div className="yes-phone" ref={cardEl} style={{ left: at(fit, TAB.card).left, top: at(fit, TAB.card).top }}>{sheet}</div>}
          {phase === "done" && <div className="yes-result" role="status"><b>Sold, not binned.</b><span className="did">{fmt.inr(D.ACTUAL.net)} recovered, instead of {fmt.inr(-BIN)} to destroy it</span>{!reduce && <button type="button" className="replay" onClick={replay}><Icon name="rotate-ccw" size={16} />Replay</button>}</div>}
        </div>
      </div>
    </section>;
  }
  // the agents' day: one line from 09:00 to the ledger
  const DAY = [
    { at: "09:00", who: "Watcher", t: `${fmt.num(N)} packs won't sell in time`, p: `The daily check against the date and the quick-commerce gates.`, art: "godown-plain", fig: <span className="fig red">{fmt.num(N)}</span> },
    { at: "09:12", who: "Vision", t: "The label, read from the shelf", p: "One photo from the godown; the date matches the export.", art: "phone-scan" },
    { at: "09:30", who: "Valuer · Router", t: "Five exits priced, the bin included", p: `${fmt.num(KL.units)} packs to kiranas, ${fmt.num(AW.units)} to a marketplace buyer.`, art: "kirana-plain", fig: <span className="fig"><Money value={D.PLAN.net} /></span> },
    { at: "09:40", who: "You", t: "One tap", p: "The money on screen, the plan approved. Nothing moved before this.", art: "pack-snack-plain", yes: true },
    { at: "09:41", who: "Outreach", t: <span lang="hi" className="hi">{D.PUSH.offer.title}</span>, p: `The scheme to ${SHOPS} kiranas in Hindi: buy ${SCHEME.buy}, get ${SCHEME.free} free, for 48 hours.`, art: "kirana" },
    { at: "09:41", who: "Lister", t: `${fmt.num(AW.units)} packs listed`, p: "On ExpireSoon, in the distributor's name, hidden inside the brand's own territories.", art: "marketplace-bag", violet: true },
    { at: "14:10", who: "Negotiator", t: `A bid countered to ${rate(AW.price)}`, p: `Accepted. A ${Math.round(M.RULES.tokenPct * 100)}% token paid.`, art: "marketplace-bag", fig: <span className="fig violet"><Money value={ES_NET} /></span> },
    { at: "Day 2", who: "Paperwork", t: "The invoice, credit note and GST memo", p: "Each on paper, with who keeps what. The GST input credit stays.", art: "documents" },
    { at: "Day 7", who: "Outreach", t: "The shelf check", p: "On the van's round: what sold, what comes back before the return window.", art: "van" },
    { at: "Day 30", who: "Impact", t: `${fmt.num(D.PLAN.kg)} kg kept out of landfill`, p: "The ledger finance and sustainability both read, with two BRSR rows.", art: "sprout-box", fig: <span className="fig"><Money value={D.ACTUAL.net} /></span> },
  ];
  function Day() {
    const app = useApp(); const reduce = useReducedMotion(); const pinned = app.bp === "desktop" && !reduce;
    const track = useRef(null), strip = useRef(null); const [over, setOver] = useState(0);
    useLayoutEffect(() => { if (!pinned) return; const m = () => setOver(Math.max(0, (strip.current ? strip.current.scrollWidth : 0) - window.innerWidth)); m(); window.addEventListener("resize", m); return () => window.removeEventListener("resize", m); }, [pinned]);
    const { scrollYProgress: p } = useScroll({ target: track, offset: ["start start", "end end"] });
    const x = useTransform(p, [0.06, 0.94], [0, -over]);
    const list = <motion.ol ref={strip} className="day-strip" aria-label="The agents' day" style={pinned ? { x } : undefined}>{DAY.map((m, i) => <li key={i} className={cx("day-m", m.yes && "yes")}>
      <div className="when"><time>{m.at}</time><span className={cx("chip-agent on", m.yes && "person")}><i aria-hidden="true" />{m.who}</span></div>
      <div className="body"><Product name={m.art} size={84} /><h3>{m.t}</h3><p>{m.p}</p>{m.fig}</div>
    </li>)}</motion.ol>;
    return <section id="how" className={cx("s60-day", pinned && "pinned")} aria-labelledby="day-h">
      <div className="day-track" ref={track}><div className="day-stage">
        <header className="day-head"><h2 id="day-h" className="sec-h plain">One batch, one day. The agents did the running around.</h2><p className="sec-sub">From the Watcher's alert at 09:00 to the ledger a month on, with one human tap at 09:40.</p></header>
        {list}
      </div></div>
    </section>;
  }
  function PageC({ onFind, onDemo, closeRef }) {
    return <>
      <HeroYes onFind={onFind} onDemo={onDemo} />
      <C.Statement text="Nothing is listed, messaged or shipped before your tap. After it, the agents do the running around, in the distributor's name, and show their work." />
      <Day />
      <C.ExitsRow />
      <C.Ledger />
      <C.Workspace />
      <C.Plans onDemo={onDemo} />
      <C.Close onDemo={onDemo} closeRef={closeRef} />
    </>;
  }

  const PAGES = { a: PageA, b: PageB, c: PageC };
  const SECTIONS = OPT === "a" ? [["how", "How it works"], ["work", "Agents"], ["teams", "For teams"], ["pricing", "Pricing"]] : [["how", "How it works"], ["exits", "The exits"], ["teams", "For teams"], ["pricing", "Pricing"]];
  function Site() { const Page = PAGES[OPT] || PageC; return <C.Shell option={OPT} sections={SECTIONS}>{ctx => <Page {...ctx} />}</C.Shell>; }
  // round 2 builds on these without mounting this page
  window.SC60_OPTS = { HeroFilm, HeroSky, HeroYes, Day, PageA, PageB, PageC, WORDS };
  if (!window.SC60_NO_MOUNT) C.mount(Site);
})();

// Smart-Clearance v3 · smartclearance.com: the product's own landing page, independent of any client. One carton
// the size of a godown, parked in a miniature Indian town, and the page follows where its packs go.
(function () {
  const { useState, useEffect, useRef } = React;
  const { useReducedMotion, motion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, P = window.SC3_PLATFORM; const fmt = M.fmt;
  const { cx, Icon, IconButton, Button, Badge, Sheet, Field, Input, Select, Textarea, Menu, Mark, Wordmark, WorkspaceMark, Money, Avatar, Product, Segmented, ModeMenuButton, ThemeProvider, AppRoot, NoticeHost, useApp, useTheme } = K;
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
  const BATCH = D.BATCHES.find(b => b.hero), SKU = D.SKUS[BATCH.sku], DIST = D.DISTRIBUTORS[BATCH.distributor];
  const SHOPS = D.KIRANAS.length, BIN = D.PLAN.writeOff.total, ES_NET = AW.gross - ESL.cost;
  const rate = v => Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v); // ₹12 a pack, ₹14.20 a pack

  /* ---------- the bar: the product, its sections, the ways in ---------- */
  const SECTIONS = [["how", "How it works"], ["agents", "Agents"], ["customers", "Customers"], ["pricing", "Pricing"]];
  const goTo = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  function Nav({ onFind, onDemo }) {
    const app = useApp(); const [menu, setMenu] = useState(false); const [sheet, setSheet] = useState(false);
    const signInItems = [
      { label: "Sign in to", heading: true },
      { label: "Find your workspace", icon: "search", onClick: onFind },
      { label: "Munchly Foods", icon: "building-2", right: <span className="t-caption subtle mono">munchly</span>, onClick: () => open(LINKS.app) },
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

  /* ---------- the first viewport ---------- */
  function HeroCard() {
    const reduce = useReducedMotion();
    const [k, setK] = useState(reduce ? 8 : 0);
    // the batch walks its stops once, about two and a half seconds, and holds on the result (WCAG 2.2.2)
    useEffect(() => { if (reduce) { setK(8); return; } if (k >= 8) return; const t = setTimeout(() => setK(k + 1), k === 0 ? 500 : 260); return () => clearTimeout(t); }, [k, reduce]);
    return <div className="hero-card" role="group" aria-label={`Batch ${BATCH.id}: eight of nine stops done, ${fmt.inr(D.ACTUAL.net)} recovered`}>
      <span className="hc-id mono">{BATCH.id}</span>
      <span className="hc-dots" aria-hidden="true">{Array.from({ length: 9 }).map((_, i) => <i key={i} className={cx(i < k && "on")} />)}</span>
      <Money value={k >= 8 ? D.ACTUAL.net : Math.round(D.ACTUAL.net * k / 8)} roll={!reduce} from={0} className="hc-money" />
      <span className="hc-cap">recovered</span>
    </div>;
  }
  function Hero({ onFind }) {
    const { resolved } = useTheme(); const night = resolved === "dark";
    const stops = [["kiranas", "Kiranas"], ["market", "Marketplace"], ["staff", "Staff sale"], ["foodbank", "Food bank"]];
    return <section className="hero" aria-labelledby="hero-h">
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
          <HeroCard />
          <ol className="hero-stops" aria-label="Where its packs can go">{stops.map(([id, t]) => <li key={id} className={"st-" + id}>{t}</li>)}</ol>
          <span className="hero-line l1" aria-hidden="true" /><span className="hero-line l2" aria-hidden="true" /><span className="hero-line l3" aria-hidden="true" />
        </div>
      </div>
    </section>;
  }

  /* ---------- 2. one batch, five exits: the street the packs went down ---------- */
  // x: where each exit stands along the panorama, as a share of its width
  const row = id => D.PLAN.rows.find(r => r.id === id);
  const EXITS = [
    { id: "kirana", name: "Kiranas", line: `${fmt.num(KL.units)} packs · ${SHOPS} shops`, x: 0.35, taken: true,
      detail: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas at ${fmt.inr(KL.price)} a pack, 2 free with every 10: ${fmt.inr(KL.net)} after the van.` },
    { id: "expiresoon", name: "ExpireSoon", line: `${fmt.num(AW.units)} packs · ${rate(AW.price)}`, x: 0.515, taken: true,
      detail: `${fmt.num(AW.units)} packs to ${D.BUYER.name} in ${D.BUYER.city} at ${rate(AW.price)}, countered from ${rate(ESL.price)}: ${fmt.inr(ES_NET)} after the listing fee.` },
    { id: "staff", name: "Staff sale", line: "priced, not needed", x: 0.65,
      detail: `${rate(row("staff").net)} a pack for up to ${row("staff").capacity} packs at the ${DIST.city} godown. Not needed this time.` },
    { id: "foodbank", name: "Food bank", line: "priced, not needed", x: 0.785,
      detail: `${rate(row("foodbank").net)} a pack, because a donation reverses the GST credit. Kept for food that can't sell.` },
    { id: "bin", name: "The bin", line: `${fmt.inr(-BIN)} · not taken`, x: 0.93, bin: true,
      detail: `${rate(-D.PLAN.writeOff.perUnit)} a pack: the stock, the GST credit, disposal and EPR, ${fmt.inr(-BIN)} for the batch. Not taken.` },
  ];
  const EX_AR = 4256 / 992, EX_ZOOM = 1.8;
  // the street pans as the page scrolls and holds on each exit: hold, move, hold … over nine equal steps
  const holdShift = x => Math.max(1 / EX_ZOOM - 1, Math.min(0, 0.5 / EX_ZOOM - x));
  const EX_P = [], EX_X = [];
  EXITS.forEach((e, i) => { const t = (holdShift(e.x) * 100).toFixed(2) + "%"; EX_P.push(2 * i / 9, (2 * i + 1) / 9); EX_X.push(i === 0 ? "0%" : t, i === 0 ? "0%" : t); });
  const ScrollCtx = React.createContext(null);
  function ExitsPanned({ active, setActive, children }) {
    const site = React.useContext(ScrollCtx); const track = useRef(null); const app = useApp();
    // the street pins in the middle of the window, under the bar, and pans while the track scrolls past
    const top = Math.max(68, Math.round(app.h * 0.5 - 280));
    const { scrollYProgress } = Motion.useScroll({ container: site, target: track, offset: [`start ${top}px`, "end end"] });
    const x = Motion.useTransform(scrollYProgress, EX_P, EX_X);
    Motion.useMotionValueEvent(scrollYProgress, "change", v => { const i = Math.min(EXITS.length - 1, Math.floor(v * 4.5 + 0.25)); if (i !== active) setActive(i); });
    // a chip scrolls the page to that exit's hold
    const jump = i => {
      const s = site.current, t = track.current; if (!s || !t) return;
      const at = t.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop;
      const from = at - top, to = at + t.offsetHeight - s.clientHeight;
      s.scrollTo({ top: from + (to - from) * (2 * i + 0.5) / 9, behavior: "smooth" });
    };
    return <div className="ex-track" ref={track}><div className="ex-stick" style={{ top }}>{children({ x, jump })}</div></div>;
  }
  function Exits() {
    const app = useApp(); const reduce = useReducedMotion(); const night = useTheme().resolved === "dark"; const site = React.useContext(ScrollCtx); const swipe = app.bp !== "desktop"; const panned = !swipe && !reduce && !!site;
    const [active, setActive] = useState(0); const pan = useRef(null); const placed = useRef(false);
    // on tablets and phones the strip opens on the first exit and slides to whichever exit is tapped
    useEffect(() => {
      const el = pan.current; if (!swipe || !el) return;
      const li = el.querySelectorAll(".ex-chips > li")[active]; const fig = el.querySelector(".ex-pano"); if (!li || !fig) return;
      const left = fig.offsetLeft + li.offsetLeft - el.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, left), behavior: placed.current && !reduce ? "smooth" : "auto" }); placed.current = true;
    }, [active, swipe]);
    const stage = ({ x, jump } = {}) => <>
      <div ref={pan} className={cx("ex-pan", panned && "panned")} {...(swipe ? { tabIndex: 0, role: "region", "aria-label": "The street from the godown to the bin; scroll sideways" } : {})}>
        <motion.figure className="ex-pano" style={{ "--ar": EX_AR, x: panned ? x : undefined }}>
          <img src={IMG + (night ? "exits-night.webp" : "exits.webp")} alt={`One miniature street from end to end${night ? " at night" : ""}: the distributor's godown, two kirana shops hung with snack packets, a general store, more small shops, a van, and a smouldering rubbish heap at the far end.`} />
          <ul className="ex-chips">{EXITS.map((e, i) => <li key={e.id} style={{ "--x": e.x }}>
            <button type="button" className={cx("ex-chip", e.taken && "taken", e.bin && "bin", i === active && "on")} aria-pressed={i === active} onClick={() => panned ? jump(i) : setActive(i)} onFocus={() => { if (panned && i !== active) jump(i); }}>
              <span className="ex-name"><i className={"ex-dot " + e.id} aria-hidden="true" />{e.name}{e.taken && <Icon name="check" size={14} stroke={2.6} className="ex-took" />}</span>
              <span className="ex-line">{e.line}</span>
            </button>
          </li>)}</ul>
        </motion.figure>
      </div>
      <p className="ex-cap" aria-live="polite"><i className={"ex-dot " + EXITS[active].id} aria-hidden="true" /><span><b>{EXITS[active].name}.</b> {EXITS[active].detail}</span></p>
    </>;
    // the batch's ledger: each result with the arithmetic that makes it
    const ledger = [
      { d: <>{fmt.inr(KL.net)} from {SHOPS} kiranas, after the van, <span className="lg-op">+</span> {fmt.inr(ES_NET)} from a buyer in Raipur, after the listing fee</>, n: <Money value={D.ACTUAL.net} className="lg-n" />, l: "recovered" },
      { d: <>{fmt.inr(D.ACTUAL.pnl)} on Munchly's books with the plan, price support included, against {fmt.inr(-BIN)} to destroy the batch</>, n: <Money value={D.ACTUAL.swing} className="lg-n" />, l: "better than the bin" },
      { d: <>{fmt.num(D.PLAN.soldUnits)} packs sold on tax invoices, so the {fmt.inr(D.PLAN.itcRetained)} GST credit stays</>, n: <span className="num lg-n">0</span>, l: "cartons destroyed" },
    ];
    return <section id="how" className="sec sec-exits" aria-labelledby="exits-h">
      <div className="wrap">
        <header className="sec-head"><h2 id="exits-h" className="sec-h">Five exits, one batch</h2>
          <p className="sec-sub"><span className="mono">{BATCH.id}</span>: {fmt.num(D.RISK.atRisk)} packs of masala chips that won't sell in the {BATCH.daysLeft} days they have left. The agents priced every exit; two of them took the batch.</p></header>
      </div>
      <div className="ex-body">{panned ? <ExitsPanned active={active} setActive={setActive}>{stage}</ExitsPanned> : stage()}</div>
      <div className="wrap"><div className="ledger" role="group" aria-label={`${BATCH.id}, the batch's ledger`}>
        <span className="lg-head"><span className="mono">{BATCH.id}</span><span>{fmt.num(D.RISK.atRisk)} packs, five exits priced, one plan approved</span></span>
        <dl className="lg-rows">{ledger.map(r => <div key={r.l} className="lg-row"><dt>{r.d}</dt><dd><span className="lg-eq" aria-hidden="true">=</span>{r.n}<span className="lg-l">{r.l}</span></dd></div>)}</dl>
      </div></div>
    </section>;
  }

  /* ---------- 3. nine stops, ten agents, one yes ---------- */
  const STOP_LINES = { connect: "the distributor's stock export and one permission", detect: "shelf life checked against every gate at 09:00", verify: "the label photo read and matched", value: "five exits priced, the bin included", decide: "the batch split, with the reasons", approve: "one tap, with the money on screen", execute: "listing, offers in Hindi, bids answered, pick-up", settle: "invoice, e-way bill, credit note, GST memo", report: "a BRSR line after the return window" };
  function Stops() {
    const night = useTheme().resolved === "dark";
    const byStage = {}; P.AGENTS.forEach(a => { if (!a.gate) (byStage[a.stage] = byStage[a.stage] || []).push(a.name); });
    return <section id="agents" className="sec sec-stops" aria-labelledby="stops-h">
      <div className="wrap">
        <header className="sec-head"><h2 id="stops-h" className="sec-h">Nine stops. Ten agents. One yes.</h2><p className="sec-sub">The agents do the running around. A person approves once, with the money on screen.</p></header>
        <div className="stops-grid">
          <figure className="plate-frame stops-plate"><img src={IMG + (night ? "approve-night.webp" : "approve.webp")} alt={`A miniature town square seen from above${night ? " at night" : ""}: a giant amber push-button on a stone plinth, a woman in a sari beside it with her phone, vans and a handcart around the square.`} loading="lazy" /></figure>
          <ol className="stops" aria-label="The nine stops">{D.STAGES.map(s => <li key={s.id} className={cx("stop", s.human && "human")}>
            <span className="st-dot" aria-hidden="true">{s.human && <Icon name="hand" size={14} stroke={2.4} />}</span>
            <span className="st-main"><b>{s.title}</b><span className="st-text">{STOP_LINES[s.id]}</span>
              <span className="st-who">{s.human ? <Badge size="sm" tone="amber">a person</Badge> : (byStage[s.id] || []).map(n => <Badge key={n} size="sm">{n}</Badge>)}</span></span>
          </li>)}</ol>
        </div>
      </div>
    </section>;
  }

  /* ---------- 4. Munchly's batch, told by the people in it ---------- */
  const CAST = [
    { id: "rakesh", role: `Distributor, ${DIST.city}`, did: `Made whole by a ${fmt.inr(D.SUPPORT.total)} credit note` },
    { id: "ganesh", role: "Kirana, Itwari", did: "2 free with every 10" },
    { id: "anita", role: "Finance, Munchly", did: "Credit note and GST memo drafted" },
    { id: "vikram", role: "Sustainability, Munchly", did: `${fmt.num(D.PLAN.kg)} kg kept out of landfill` },
  ];
  function Story() {
    const priya = D.PEOPLE.priya, ws = D.WORKSPACE;
    const rows = [
      ["If destroyed", <Money value={-BIN} className="sc-bin" />],
      ["GST credit kept", <Money value={D.PLAN.itcRetained} />],
      ["Kiranas restocked", <span className="num">{SHOPS}</span>],
      ["Cartons destroyed", <span className="num">0</span>],
    ];
    return <section id="customers" className="sec sec-story" aria-labelledby="story-h">
      <div className="wrap">
        <div className="story">
          <div className="story-copy">
            <h2 id="story-h" className="sec-h story-h"><span>One plan approved.</span> <span>Not one carton destroyed.</span></h2>
            <blockquote className="story-quote"><p>“I approved one plan with the money on screen. The agents did the running around.”</p></blockquote>
            <div className="story-who">
              <Avatar person={priya} size="xl" />
              <span className="sw-text"><b>{priya.name}</b><span>{priya.role}</span><span className="sw-org"><WorkspaceMark ws={ws} size={20} />{ws.name} · snacks and drinks, {D.CLIENT.city}</span></span>
            </div>
            <div className="story-ctas"><a className="btn btn-primary" {...linkProps(LINKS.demo)}>Watch Munchly's batch, stage by stage</a><a className="btn btn-secondary btn-white" {...linkProps(LINKS.app)}>Visit {ws.domain}</a></div>
          </div>
          <div className="story-card" role="group" aria-label={`Batch ${BATCH.id}: eight of nine stops done`}>
            <div className="sc-top">
              <span className="sc-id"><span className="mono">{BATCH.id}</span><span>{SKU.brand} {SKU.name} · {DIST.name}, {DIST.city}</span></span>
              <Product name={SKU.img} size={76} className="sc-pack" />
            </div>
            <span className="sc-dots" aria-hidden="true">{Array.from({ length: 9 }).map((_, i) => <i key={i} className={cx(i === 8 && "next")} />)}</span>
            <Money value={D.ACTUAL.net} className="sc-money" />
            <span className="sc-cap">recovered, eight stops of nine; the BRSR line follows after {fmt.date(D.RETURN_BY).replace(/ \d{4}$/, "")}</span>
            <dl className="sc-rows">{rows.map(([k, v]) => <div key={k} className="sc-row"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>
        </div>
        <ul className="cast" aria-label="The people in Munchly's batch">{CAST.map(c => { const p = D.PEOPLE[c.id]; return <li key={c.id}>
          <Avatar person={p} size="lg" />
          <span className="cast-text"><b>{p.name}</b><span>{c.role}</span><span className="cast-did">{c.did}</span></span>
        </li>; })}</ul>
        <p className="fine">Munchly Foods, its partners and its people are fictional. Every figure is worked out from the journey map.</p>
      </div>
    </section>;
  }

  /* ---------- 5. a workspace per manufacturer ---------- */
  // x and y: where each island's flat top sits on the plate, as a share of its width and height; ly: its address label
  const ISLANDS = [
    { id: "munchly", x: 0.22, y: 0.6, ly: 0.86, packs: ["pack-chips", "pack-mango"], url: "munchly.smartclearance.com", live: true },
    { id: "you", x: 0.575, y: 0.59, ly: 0.84, packs: ["sprout-box"], url: "your-company.smartclearance.com" },
    { id: "next", x: 0.8, y: 0.61, ly: 0.87, packs: ["sprout-box"], url: "your-brand.smartclearance.com", flip: true },
  ];
  const HUB = { x: 0.425, y: 0.69 }, ISL_AR = 3776 / 1120;
  function Workspace() {
    const app = useApp(); const { resolved } = useTheme(); const swipe = app.bp === "phone";
    const urls = cls => <ul className={cx("isl-urls", cls)} aria-label="Workspace addresses">{ISLANDS.map(i => <li key={i.id} className={cx("isl-url", i.live && "live")} style={{ "--x": i.x, "--y": i.ly }}><i aria-hidden="true" />{i.url}{i.live && <span className="isl-live"> · live</span>}</li>)}</ul>;
    return <section id="workspace" className="sec sec-ws" aria-labelledby="ws-h">
      <div className="wrap"><header className="sec-head"><h2 id="ws-h" className="sec-h ws-h"><span>Your own workspace,</span> <span>set up for your supply chain.</span></h2><p className="sec-sub">Each manufacturer gets its own address, configured for how its stock really moves.</p></header></div>
      <div className="isl-pan" {...(swipe ? { tabIndex: 0, role: "region", "aria-label": "Workspaces, one island each; scroll sideways" } : {})}>
        <figure className="islands" style={{ "--ar": ISL_AR }}>
          <img className="isl-plate" src={IMG + (resolved === "dark" ? "islands-night.webp" : "islands.webp")} alt="" loading="lazy" />
          {ISLANDS.map(i => <span key={i.id} className={cx("isl-packs", "isl-" + i.id)} style={{ "--x": i.x, "--y": i.y }} aria-hidden="true">{i.packs.map(n => <Product key={n} name={n} size={160} className={cx("isl-pack", i.flip && "flip")} />)}</span>)}
          <span className="isl-hub" style={{ "--x": HUB.x, "--y": HUB.y }} aria-hidden="true"><Mark size={52} /></span>
          {urls("on-plate")}
          <figcaption className="sr-only">Three islands over a miniature town, joined to Smart-Clearance by green paths: Munchly Foods' workspace, live with its packs, and two waiting for the next manufacturers.</figcaption>
        </figure>
      </div>
      <div className="wrap">
        {urls("below")}
        {/* inside a workspace, each team gets its own part of the same batch */}
        <p className="isl-cap"><b>Inside Munchly's workspace,</b> supply chain approves a plan with one tap, the money on screen. Finance gets the invoice, the credit note and the GST memo, drafted. Sustainability gets a BRSR line an auditor can follow back to the batch. And nothing is listed in a distributor's name without their one-time permission.</p>
        <div className="conn"><span className="conn-h">Works with</span><ul className="conn-list">{P.CONNECTORS.map(c => <li key={c.id} className="chip">{c.name}{c.status === "soon" && <span className="subtle"> · soon</span>}</li>)}</ul></div>
      </div>
    </section>;
  }

  /* ---------- 6. plans, without prices ---------- */
  function Plans({ onDemo }) {
    return <section id="pricing" className="sec sec-plans" aria-labelledby="plans-h">
      <div className="wrap">
        <header className="sec-head"><h2 id="plans-h" className="sec-h">Start with one distributor.</h2><p className="sec-sub">A pilot runs on one distributor's stock for 90 days. Prices are set with each manufacturer.</p></header>
        <ul className="plans">{P.PLANS.map(p => <li key={p.id} className="plan">
          <b className="plan-name">{p.name}</b>
          <ul className="plan-scope">{p.scope.map(s => <li key={s}><Icon name="check" size={16} stroke={2.4} />{s.replace(/^The client's /, "Your ")}</li>)}</ul>
          <span className="plan-foot"><span>Prices on request</span><button type="button" className="btn btn-link" onClick={() => onDemo(p.name)}>Talk to us<span className="sr-only"> about {p.name}</span></button></span>
        </li>)}</ul>
      </div>
    </section>;
  }
  function Close({ onDemo }) {
    // the copy sits in the dusk sky, extended above the picture, which fades up into it
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
      ["Product", SECTIONS.filter(([id]) => id !== "customers").map(([id, t]) => <a key={id} href={"#" + id}>{t}</a>)],
      ["Customers", [<a key="munchly" href="#customers">Munchly Foods</a>]],
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
    // the page scrolls inside .site; the scroll-linked parts mount once it exists, so they measure the right scroller
    const [siteEl, setSiteEl] = useState(null); const siteRef = React.useMemo(() => siteEl ? { current: siteEl } : null, [siteEl]);
    useEffect(() => { document.title = "Smart-Clearance"; }, []);
    const onDemo = plan => setDemo({ plan: typeof plan === "string" ? plan : null });
    return <ScrollCtx.Provider value={siteRef}><div className="site" id="top" ref={setSiteEl}>
      <Nav onFind={() => setFind(true)} onDemo={onDemo} />
      <main>
        <Hero onFind={() => setFind(true)} />
        <Exits />
        <Stops />
        <Story />
        <Workspace />
        <Plans onDemo={onDemo} />
        <Close onDemo={onDemo} />
      </main>
      <Footer onFind={() => setFind(true)} />
      <S.FindWorkspace open={find} onClose={() => setFind(false)} onUse={() => { setFind(false); open(LINKS.app); }} />
      <DemoSheet open={!!demo} plan={demo && demo.plan} onClose={() => setDemo(null)} />
    </div></ScrollCtx.Provider>;
  }
  function Root() { return <ThemeProvider><AppRoot className="site-root" style={{ position: "fixed", inset: 0 }}><NoticeHost><Site /></NoticeHost></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();

// SC-60 · what the three options share: the bar, the statement that fills in as it is read, the chapters (inset colour
// fields with the product at work), the ledger, the exits strip, the way into the demo, and the sections kept from
// the page as it is (the workspace islands, plans, the close, the footer, Book a demo). Every figure comes from
// core/money.js through core/data.js; no client is named.
(function () {
  const { useState, useEffect, useLayoutEffect, useRef } = React;
  const { useReducedMotion, motion, useScroll, useTransform, useInView, AnimatePresence } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, P = window.SC3_PLATFORM; const fmt = M.fmt;
  const { cx, Icon, IconButton, Button, Badge, Sheet, Field, Input, Select, Textarea, Menu, Mark, Wordmark, Money, Roll, GateChips, Product, Segmented, ModeMenuButton, ThemeProvider, AppRoot, NoticeHost, useApp, useTheme } = K;
  const IMG = window.SC3_SITE_IMG || "assets/plates/";
  const LINKS = Object.assign({ demo: "../../../demo/Smart-Clearance%20demo%20v3.html", app: "../../../app/Smart-Clearance%20app%20v3.html", console: "../../../console/Smart-Clearance%20console%20v3.html" }, window.SC3_LINKS || {});
  const external = href => /^https?:/.test(href);
  const linkProps = href => external(href) ? { href, target: "_blank", rel: "noopener" } : { href };
  const open = href => { if (external(href)) { if (!window.open(href, "_blank", "noopener")) location.href = href; } else location.href = href; };
  if (P) P.usePersistence();

  /* ---------- the figures every section quotes ---------- */
  const lineOf = id => D.PLAN.lines.find(l => l.id === id);
  const KL = lineOf("kirana"), ESL = lineOf("expiresoon"), AW = D.AWARD;
  const BATCH = D.BATCHES.find(b => b.hero), DIST = D.DISTRIBUTORS[BATCH.distributor], SKU = D.SKUS[BATCH.sku];
  const SHOPS = D.KIRANAS.length, BIN = D.PLAN.writeOff.total, ES_NET = AW.gross - ESL.cost, N = D.RISK.atRisk;
  const row = id => D.PLAN.rows.find(r => r.id === id);
  const planned = id => D.PLAN.lines.some(l => l.id === id);
  const rate = v => Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v);
  const SCHEME = M.RULES.scheme;
  const EASE = [0.22, 1, 0.36, 1]; const BID = 13; // the buyer's opening bid, as core/data.js counters it
  const FIG = { KL, ESL, AW, BATCH, DIST, SKU, SHOPS, BIN, ES_NET, N, row, planned, rate, SCHEME, EASE };
  // the agents, with what each did for this batch (the town's words, SC-32)
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
  const AGENTS = P.AGENTS.map(a => ({ id: a.gate ? "you" : a.id, key: a.id, name: a.gate ? "You" : a.name, icon: a.icon, human: !!a.gate, job: a.gate ? "You approve every plan, with the money on screen" : a.job, did: DID[a.id] }));
  const AGENT = Object.fromEntries(AGENTS.map(a => [a.id, a]));
  const agentsAt = (...stages) => P.AGENTS.filter(a => !a.gate && stages.includes(a.stage)).map(a => a.name);

  /* ---------- small shared pieces ---------- */
  // a card rises once it comes into view, then its rows follow it in turn; under reduced motion it is in place from the start
  function useRise(amount = 0.3) {
    const ref = useRef(null); const reduce = useReducedMotion();
    const inView = useInView(ref, { once: true, amount }); const shown = reduce || inView;
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
  function AgentChips({ who, lit, person }) {
    return <span className="agents">{who.map((w, j) => <span key={w} className={cx("chip-agent", (lit == null || j < lit) && "on", person && j === 0 && "person")}><i aria-hidden="true" />{w}</span>)}</span>;
  }

  /* ---------- the bar ---------- */
  const SECTIONS = [["how", "How it works"], ["exits", "The exits"], ["teams", "For teams"], ["pricing", "Pricing"]];
  const goTo = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  function Nav({ onFind, onDemo, sections = SECTIONS }) {
    const app = useApp(); const [menu, setMenu] = useState(false); const [sheet, setSheet] = useState(false);
    const signInItems = [{ label: "Sign in to", heading: true }, { label: "Find your workspace", icon: "search", onClick: onFind }, "-", { label: "Smart-Clearance staff", icon: "shield", onClick: () => open(LINKS.console) }];
    return <header className="site-nav">
      <a className="nav-brand" href="#top" aria-label="Smart-Clearance, back to the top"><span className="nav-mark"><Mark size={36} /></span><Wordmark size={15} /></a>
      {app.bp === "desktop" && <nav className="nav-links" aria-label="Sections">{sections.map(([id, t]) => <a key={id} href={"#" + id}>{t}</a>)}</nav>}
      <span className="grow" />
      <span className="nav-mode"><ModeMenuButton /></span>
      <span className="nav-signin"><button type="button" className="nav-text" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(m => !m)}>Sign in</button><Menu open={menu} onClose={() => setMenu(false)} items={signInItems} width={268} label="Sign in to" /></span>
      {app.bp !== "phone" ? <Button variant="primary" pill className="nav-demo" onClick={() => onDemo()}>Book a demo</Button> : <IconButton icon="menu" label="Menu" onClick={() => setSheet(true)} />}
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Smart-Clearance" side="bottom" detent="medium">
        <div className="stack">
          <div className="list">{sections.map(([id, t]) => <button type="button" key={id} className="list-row" onClick={() => { setSheet(false); setTimeout(() => goTo(id), 60); }}><span className="lr-main"><span className="lr-title">{t}</span></span><Icon name="chevron-right" size={18} className="chev" /></button>)}</div>
          <Button variant="primary" size="lg" block onClick={() => { setSheet(false); onDemo(); }}>Book a demo</Button>
        </div>
      </Sheet>
    </header>;
  }

  /* ---------- the statement: words fill in from the tertiary ink to the full ink as the paragraph is read ---------- */
  function Word({ p, a, b, text, reduce }) {
    const o = useTransform(p, [a, b], [0, 1]);
    return <span className="sw">{text}<motion.span className="lit" aria-hidden="true" style={{ opacity: reduce ? 1 : o }}>{text}</motion.span></span>;
  }
  function Statement({ text, id }) {
    const ref = useRef(null); const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
    const words = text.split(" "); const n = words.length;
    return <section className="s60-say" id={id} aria-label="In short">
      <p ref={ref}>{words.map((w, i) => <React.Fragment key={i}><Word p={scrollYProgress} a={i / n * 0.92} b={Math.min(1, i / n * 0.92 + 0.1)} text={w} reduce={reduce} />{i < n - 1 ? " " : ""}</React.Fragment>)}</p>
    </section>;
  }

  /* ---------- a chapter: one moment of the product at work, in a colour field ---------- */
  function Chapter({ id, tone, title, lede, who, person, children, wide }) {
    const { shown, card, rise } = useRise(0.2);
    return <motion.section id={id} className={cx("s60-ch", "tone-" + tone)} aria-labelledby={id + "-h"} {...card}>
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

  /* ---------- the moments' cards (SC-28): the Watcher's alert, the Valuer's prices, the plan ---------- */
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
  // the agents at work after the yes: the kirana offer in Hindi, the lot in the distributor's name, the paperwork
  function WorkCards() {
    const { shown, card, rise } = useRise(0.2); const lit = useLit(shown, 3, 300, 420);
    const p0 = D.PUSH.offer;
    return <motion.div className="ch-row three" {...card}>
      <motion.div className={cx("m-card")} role="group" aria-label="Outreach: the kirana offer, in Hindi" {...rise(0)}>
        <div className="m-head"><span className={cx("chip-agent", lit > 0 && "on")}><i aria-hidden="true" />Outreach · 09:41</span><Badge tone="green" icon="gift">{SCHEME.buy} + {SCHEME.free}</Badge></div>
        <div className="m-batch"><Product name="pack-snack-plain" size={52} /><span><b lang="hi" className="hi">{p0.title}</b><span>{fmt.inr2(KL.packPrice)} a pack · MRP {fmt.inr(SKU.mrp)} · 48 hours</span></span></div>
        <p lang="hi" className="hi" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--fg-2)" }}>{p0.body.split(" ").slice(0, 22).join(" ")}…</p>
        <div className="m-row"><span className="k">{fmt.num(SHOPS)} shops ordered</span><span className="v">{fmt.num(KL.units)} packs</span></div>
      </motion.div>
      <motion.div className="m-card" role="group" aria-label="Lister and Negotiator: the lot on ExpireSoon" {...rise(1)} style={{ "--primary": "var(--violet)", "--primary-text": "var(--violet-text, var(--violet))" }}>
        <div className="m-head"><span className={cx("chip-agent", lit > 1 && "on")}><i aria-hidden="true" />Lister · Negotiator</span><Badge tone="violet" dot>ExpireSoon</Badge></div>
        <div className="m-batch"><Product name="marketplace-bag" size={52} /><span><b>{fmt.num(AW.units)} packs, listed in the distributor's name</b><span>reserve {rate(M.RULES.negotiation.reservePerUnit)} · hidden inside the brand's territories</span></span></div>
        <div className="m-row"><span className="k">A buyer bids</span><span className="v">{rate(BID)}</span></div>
        <div className="m-row"><span className="k">Countered, accepted</span><span className="v">{rate(AW.price)} a pack</span></div>
        <div className="m-row"><span className="k">Token paid</span><span className="v">{fmt.inr(AW.token)}</span></div>
      </motion.div>
      <motion.div className="m-card" role="group" aria-label="Paperwork: the documents, drafted" {...rise(2)}>
        <div className="m-head"><span className={cx("chip-agent", lit > 2 && "on")}><i aria-hidden="true" />Paperwork</span><Badge tone="gray">drafted</Badge></div>
        <div className="m-batch"><Product name="documents" size={52} /><span><b>Everything finance needs, drafted</b><span>each on paper, with who keeps what</span></span></div>
        {[["The distributor's invoice to the buyer", "IGST 5%"], ["The brand's price-support credit note", fmt.inr(D.SUPPORT.total)], ["GST input credit memo", fmt.inr(D.PLAN.itcRetained)]].map(([k, v]) => <div key={k} className="m-row"><span className="k">{k}</span><span className="v">{v}</span></div>)}
      </motion.div>
    </motion.div>;
  }

  /* ---------- the ledger: Impact's document for one batch ---------- */
  function Ledger() {
    const { shown, card, rise } = useRise(0.3); const rolled = useLit(shown, 1, 300, 0) > 0;
    const lines = [
      { k: "Recovered, net", s: `${fmt.inr(KL.net)} from ${SHOPS} kiranas after the van, ${fmt.inr(ES_NET)} from a marketplace buyer after the fee`, v: <Money value={D.ACTUAL.net} roll={rolled} from={rolled ? 0 : undefined} /> },
      { k: "Better than the bin", s: `against ${fmt.inr(-BIN)} to destroy the stock: the goods, the GST credit, disposal and EPR`, v: <Money value={D.ACTUAL.swing} roll={rolled} from={rolled ? 0 : undefined} /> },
      { k: "GST input credit kept", s: "goods supplied under tax invoices, so the Section 17(5)(h) reversal does not apply", v: <Money value={D.PLAN.itcRetained} roll={rolled} from={rolled ? 0 : undefined} /> },
      { k: "Kept out of landfill", s: `${fmt.num(D.PLAN.co2)} kg CO₂e, indicative`, v: <span className="num"><Roll value={D.PLAN.kg} from={rolled ? 0 : undefined} /> kg</span> },
      { k: "Cartons destroyed", s: `${fmt.num(D.PLAN.soldUnits)} packs sold on tax invoices`, v: <span className="num">0</span>, zero: true },
    ];
    return <section className="s60-ledger" id="ledger" aria-labelledby="ledger-h">
      <motion.div className="ledger" role="group" aria-labelledby="ledger-h" {...card}>
        <motion.div className="ledger-head" {...rise(0)}><b><i aria-hidden="true"><Icon name="leaf" size={14} stroke={2.2} /></i><span id="ledger-h">Impact · the ledger for one batch</span></b><span>posted after the return window</span></motion.div>
        {lines.map((l, i) => <motion.div key={l.k} className={cx("ledger-row", l.zero && "zero")} {...rise(i + 1)}><span className="k">{l.k}</span><span className="v">{l.v}</span><span className="s">{l.s}</span></motion.div>)}
        <motion.div className="ledger-foot" {...rise(lines.length + 1)}><span>BRSR Principle 6 · two rows an auditor can follow back to the batch</span><span>one illustrative batch</span></motion.div>
      </motion.div>
      <p className="ledger-note">An illustrative batch. Every figure is worked out from the journey map.</p>
    </section>;
  }

  /* ---------- the exits: five cards ---------- */
  const EXITS = [
    { id: "kirana", name: "Kiranas", taken: true, art: "kirana-plain", total: KL.net, packs: KL.units, per: `${rate(row("kirana").net)} a pack, after the van`, line: `${fmt.num(KL.units)} packs · ${SHOPS} shops` },
    { id: "expiresoon", name: "ExpireSoon", taken: true, art: "marketplace-bag", total: ES_NET, packs: AW.units, per: `${rate(AW.price)} a pack, countered from ${rate(ESL.price)}`, line: `${fmt.num(AW.units)} packs · one buyer` },
    { id: "staff", name: "Staff sale", art: "godown-plain", note: "priced, not needed", per: `${rate(row("staff").net)} a pack, up to ${row("staff").capacity} packs` },
    { id: "foodbank", name: "Food bank", art: "donation-crate", note: "priced, not needed", per: `${rate(row("foodbank").net)} a pack: a donation reverses the GST credit` },
    { id: "bin", name: "The bin", bin: true, art: "bin-plain", total: -BIN, note: "not taken", per: `${rate(-D.PLAN.writeOff.perUnit)} a pack, the GST credit and disposal included` },
  ];
  function ExitsRow({ title = "Five exits, one batch", sub }) {
    const { shown, card, rise } = useRise(0.2);
    return <motion.section id="exits" className="s60-exits" aria-labelledby="exits-h" {...card}>
      <header className="sec-head"><h2 id="exits-h" className="sec-h">{title}</h2><p className="sec-sub">{sub || `${fmt.num(N)} packs of masala chips that won't sell in the ${BATCH.daysLeft} days they have left. The Valuer priced every exit, the bin included, and the Router sent the packs where they recover the most.`}</p></header>
      <ul className="ex-strip" aria-label="The five exits">{EXITS.map((e, i) => <motion.li key={e.id} className={cx("ex-card", e.id, e.taken && "taken", e.bin && "bin")} {...rise(i)}>
        <Product name={e.art} size={112} />
        <span className="exn"><i className={"ex-dot " + (e.bin ? "bin" : e.id)} aria-hidden="true" />{e.name}{e.taken && <Icon name="check" size={15} stroke={2.6} className="ex-took" />}</span>
        <span className="exp">{e.per}</span>
        {e.taken ? <><span className="exv"><Money value={e.total} /></span><span className="exl">{e.line}</span></>
          : e.bin ? <><span className="exv no">{e.note}</span><span className="exl" style={{ color: "var(--red-text)" }}>{fmt.inr(e.total)} if destroyed</span></>
          : <span className="exv no">{e.note}</span>}
      </motion.li>)}</ul>
    </motion.section>;
  }

  /* ---------- the way into the demo, always at hand ---------- */
  function DemoPill({ hidden }) {
    return <a className={cx("s60-pill", hidden && "off")} {...linkProps(LINKS.demo)} aria-label="Watch the 6-minute demo">
      <span className="thumb" aria-hidden="true"><img src={(window.SC3_IMG || "system/img/").replace(/img\/$/, "media/") + "carton-loop-poster.webp"} alt="" /><i><Icon name="play" size={12} stroke={2.6} /></i></span>
      <span>Watch the 6-minute demo</span>
    </a>;
  }

  /* ---------- kept from the page as it is: the workspace islands, plans, the close, the footer, Book a demo ---------- */
  const ISLANDS = [
    { id: "brand", x: 0.22, y: 0.6, ly: 0.86, product: "pack-snack-plain", url: "your-brand.smartclearance.com", live: true },
    { id: "company", x: 0.575, y: 0.59, ly: 0.84, product: "pack-carton-plain", url: "your-company.smartclearance.com" },
    { id: "group", x: 0.8, y: 0.61, ly: 0.87, product: "bottle-oil-plain", url: "your-group.smartclearance.com" },
  ];
  const HUB = { x: 0.425, y: 0.69 }, ISL_AR = 3776 / 1120;
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
  function Footer({ onFind, sections = SECTIONS }) {
    const { mode, setMode } = useTheme();
    const cols = [
      ["Product", sections.map(([id, t]) => <a key={id} href={"#" + id}>{t}</a>)],
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

  /* ---------- the page's shell: the sheets, the demo pill, the bar's state ---------- */
  function Shell({ option, sections, children }) {
    const [find, setFind] = useState(false); const [demo, setDemo] = useState(null); const [scrolled, setScrolled] = useState(false);
    const closeRef = useRef(null); const nearEnd = useInView(closeRef, { amount: 0.2 });
    useEffect(() => { document.title = "Smart-Clearance"; }, []);
    useEffect(() => { const f = () => setScrolled(window.scrollY > 40); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
    const onDemo = plan => setDemo({ plan: typeof plan === "string" ? plan : null });
    const ctx = { onFind: () => setFind(true), onDemo, closeRef };
    return <div className={cx("site s60", "opt-" + option, scrolled && "scrolled")} id="top">
      <Nav onFind={ctx.onFind} onDemo={onDemo} sections={sections} />
      <main>{children(ctx)}</main>
      <Footer onFind={ctx.onFind} sections={sections} />
      <DemoPill hidden={nearEnd} />
      <S.FindWorkspace open={find} onClose={() => setFind(false)} onUse={() => { setFind(false); open(LINKS.app); }} note="One manufacturer's workspace is set up in this prototype." />
      <DemoSheet open={!!demo} plan={demo && demo.plan} onClose={() => setDemo(null)} />
    </div>;
  }
  function mount(Page) {
    function Root() { return <ThemeProvider><AppRoot className="site-root s60-root"><NoticeHost><Page /></NoticeHost></AppRoot></ThemeProvider>; }
    ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
  }

  window.SC60 = { FIG, AGENTS, AGENT, agentsAt, LINKS, linkProps, open, IMG, EASE, useRise, useLit, AgentChips, Nav, Statement, Chapter, AlertCard, PricesCard, PlanCard, WorkCards, Ledger, ExitsRow, EXITS, DemoPill, Workspace, Plans, Close, Footer, DemoSheet, Shell, mount, SECTIONS };
})();

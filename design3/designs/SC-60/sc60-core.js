(function() {
  const { useState, useEffect, useLayoutEffect, useRef } = React;
  const { useReducedMotion, motion, useScroll, useTransform, useInView, AnimatePresence } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, P = window.SC3_PLATFORM;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Button, Badge, Sheet, Field, Input, Select, Textarea, Menu, Mark, Wordmark, Money, Roll, GateChips, Product, Segmented, ModeMenuButton, ThemeProvider, AppRoot, NoticeHost, useApp, useTheme } = K;
  const IMG = window.SC3_SITE_IMG || "assets/plates/";
  const LINKS = Object.assign({ demo: "../../../demo/Smart-Clearance%20demo%20v3.html", app: "../../../app/Smart-Clearance%20app%20v3.html", console: "../../../console/Smart-Clearance%20console%20v3.html" }, window.SC3_LINKS || {});
  const external = (href) => /^https?:/.test(href);
  const linkProps = (href) => external(href) ? { href, target: "_blank", rel: "noopener" } : { href };
  const open = (href) => {
    if (external(href)) {
      if (!window.open(href, "_blank", "noopener")) location.href = href;
    } else location.href = href;
  };
  if (P) P.usePersistence();
  const lineOf = (id) => D.PLAN.lines.find((l) => l.id === id);
  const KL = lineOf("kirana"), ESL = lineOf("expiresoon"), AW = D.AWARD;
  const BATCH = D.BATCHES.find((b) => b.hero), DIST = D.DISTRIBUTORS[BATCH.distributor], SKU = D.SKUS[BATCH.sku];
  const SHOPS = D.KIRANAS.length, BIN = D.PLAN.writeOff.total, ES_NET = AW.gross - ESL.cost, N = D.RISK.atRisk;
  const row = (id) => D.PLAN.rows.find((r) => r.id === id);
  const planned = (id) => D.PLAN.lines.some((l) => l.id === id);
  const rate = (v) => Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v);
  const SCHEME = M.RULES.scheme;
  const EASE = [0.22, 1, 0.36, 1];
  const BID = 13;
  const FIG = { KL, ESL, AW, BATCH, DIST, SKU, SHOPS, BIN, ES_NET, N, row, planned, rate, SCHEME, EASE };
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
    impact: `${fmt.num(D.PLAN.kg)} kg kept out of landfill`
  };
  const AGENTS = P.AGENTS.map((a) => ({ id: a.gate ? "you" : a.id, key: a.id, name: a.gate ? "You" : a.name, icon: a.icon, human: !!a.gate, job: a.gate ? "You approve every plan, with the money on screen" : a.job, did: DID[a.id] }));
  const AGENT = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
  const agentsAt = (...stages) => P.AGENTS.filter((a) => !a.gate && stages.includes(a.stage)).map((a) => a.name);
  function useRise(amount = 0.3) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const inView = useInView(ref, { once: true, amount });
    const shown = reduce || inView;
    const move = (y, delay) => ({ initial: reduce ? false : { opacity: 0, y }, animate: shown ? { opacity: 1, y: 0 } : void 0, transition: { duration: 0.42, delay: reduce ? 0 : delay, ease: EASE } });
    return { shown, card: { ref, ...move(16, 0) }, rise: (i) => move(10, 0.16 + i * 0.11) };
  }
  function useLit(on, n, first, every) {
    const reduce = useReducedMotion();
    const [k, setK] = useState(reduce ? n : 0);
    useEffect(() => {
      if (reduce) {
        setK(n);
        return;
      }
      if (!on || k >= n) return;
      const t = setTimeout(() => setK(k + 1), k === 0 ? first : every);
      return () => clearTimeout(t);
    }, [on, k, reduce]);
    return k;
  }
  function AgentChips({ who, lit, person }) {
    return /* @__PURE__ */ React.createElement("span", { className: "agents" }, who.map((w, j) => /* @__PURE__ */ React.createElement("span", { key: w, className: cx("chip-agent", (lit == null || j < lit) && "on", person && j === 0 && "person") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), w)));
  }
  const SECTIONS = [["how", "How it works"], ["exits", "The exits"], ["teams", "For teams"], ["pricing", "Pricing"]];
  const goTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  function Nav({ onFind, onDemo, sections = SECTIONS }) {
    const app = useApp();
    const [menu, setMenu] = useState(false);
    const [sheet, setSheet] = useState(false);
    const signInItems = [{ label: "Sign in to", heading: true }, { label: "Find your workspace", icon: "search", onClick: onFind }, "-", { label: "Smart-Clearance staff", icon: "shield", onClick: () => open(LINKS.console) }];
    return /* @__PURE__ */ React.createElement("header", { className: "site-nav" }, /* @__PURE__ */ React.createElement("a", { className: "nav-brand", href: "#top", "aria-label": "Smart-Clearance, back to the top" }, /* @__PURE__ */ React.createElement("span", { className: "nav-mark" }, /* @__PURE__ */ React.createElement(Mark, { size: 36 })), /* @__PURE__ */ React.createElement(Wordmark, { size: 15 })), app.bp === "desktop" && /* @__PURE__ */ React.createElement("nav", { className: "nav-links", "aria-label": "Sections" }, sections.map(([id, t]) => /* @__PURE__ */ React.createElement("a", { key: id, href: "#" + id }, t))), /* @__PURE__ */ React.createElement("span", { className: "grow" }), /* @__PURE__ */ React.createElement("span", { className: "nav-mode" }, /* @__PURE__ */ React.createElement(ModeMenuButton, null)), /* @__PURE__ */ React.createElement("span", { className: "nav-signin" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-text", "aria-haspopup": "menu", "aria-expanded": menu, onClick: () => setMenu((m) => !m) }, "Sign in"), /* @__PURE__ */ React.createElement(Menu, { open: menu, onClose: () => setMenu(false), items: signInItems, width: 268, label: "Sign in to" })), app.bp !== "phone" ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", pill: true, className: "nav-demo", onClick: () => onDemo() }, "Book a demo") : /* @__PURE__ */ React.createElement(IconButton, { icon: "menu", label: "Menu", onClick: () => setSheet(true) }), /* @__PURE__ */ React.createElement(Sheet, { open: sheet, onClose: () => setSheet(false), title: "Smart-Clearance", side: "bottom", detent: "medium" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "list" }, sections.map(([id, t]) => /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: "list-row", onClick: () => {
      setSheet(false);
      setTimeout(() => goTo(id), 60);
    } }, /* @__PURE__ */ React.createElement("span", { className: "lr-main" }, /* @__PURE__ */ React.createElement("span", { className: "lr-title" }, t)), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "chev" })))), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, onClick: () => {
      setSheet(false);
      onDemo();
    } }, "Book a demo"))));
  }
  function Word({ p, a, b, text, reduce }) {
    const o = useTransform(p, [a, b], [0, 1]);
    return /* @__PURE__ */ React.createElement("span", { className: "sw" }, text, /* @__PURE__ */ React.createElement(motion.span, { className: "lit", "aria-hidden": "true", style: { opacity: reduce ? 1 : o } }, text));
  }
  function Statement({ text, id }) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
    const words = text.split(" ");
    const n = words.length;
    return /* @__PURE__ */ React.createElement("section", { className: "s60-say", id, "aria-label": "In short" }, /* @__PURE__ */ React.createElement("p", { ref }, words.map((w, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, /* @__PURE__ */ React.createElement(Word, { p: scrollYProgress, a: i / n * 0.92, b: Math.min(1, i / n * 0.92 + 0.1), text: w, reduce }), i < n - 1 ? " " : ""))));
  }
  function Chapter({ id, tone, title, lede, who, person, children, wide }) {
    const { shown, card, rise } = useRise(0.2);
    return /* @__PURE__ */ React.createElement(motion.section, { id, className: cx("s60-ch", "tone-" + tone), "aria-labelledby": id + "-h", ...card }, /* @__PURE__ */ React.createElement("div", { className: cx("ch-in", wide && "wide") }, /* @__PURE__ */ React.createElement("div", { className: "ch-copy" }, /* @__PURE__ */ React.createElement(motion.h2, { id: id + "-h", className: "ch-h", ...rise(0) }, title), /* @__PURE__ */ React.createElement(motion.p, { className: "ch-lede", ...rise(1) }, lede), who && /* @__PURE__ */ React.createElement(motion.span, { ...rise(2) }, /* @__PURE__ */ React.createElement(AgentChips, { who, person }))), /* @__PURE__ */ React.createElement("div", { className: "ch-stage" }, children)));
  }
  function AlertCard() {
    const { shown, card, rise } = useRise();
    const rolled = useLit(shown, 1, 490, 0) > 0;
    return /* @__PURE__ */ React.createElement(motion.div, { className: "m-card", role: "group", "aria-label": "The Watcher's alert", ...card }, /* @__PURE__ */ React.createElement(motion.div, { className: "m-head", ...rise(0) }, /* @__PURE__ */ React.createElement("span", { className: "chip-agent on" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Watcher · 09:00"), /* @__PURE__ */ React.createElement(Badge, { tone: "red", dot: true }, "At risk")), /* @__PURE__ */ React.createElement(motion.div, { className: "m-batch", ...rise(1) }, /* @__PURE__ */ React.createElement(Product, { name: "pack-snack-plain", size: 52 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, SKU.name), /* @__PURE__ */ React.createElement("span", null, fmt.num(BATCH.units), " packs in a distributor's godown, ", DIST.city))), /* @__PURE__ */ React.createElement(motion.div, { className: "m-gates", ...rise(2) }, /* @__PURE__ */ React.createElement(GateChips, { gates: D.RISK.gates })), /* @__PURE__ */ React.createElement(motion.div, { className: "m-big", ...rise(3) }, /* @__PURE__ */ React.createElement("span", { className: "num" }, /* @__PURE__ */ React.createElement(Roll, { key: rolled ? "on" : "off", value: N, from: rolled ? 0 : void 0 })), /* @__PURE__ */ React.createElement("span", null, "packs won't sell in the ", BATCH.daysLeft, " days they have left")));
  }
  const PRICED = [
    { id: "kirana", name: "Kiranas", s: `up to ${fmt.num(row("kirana").capacity)} packs in ${M.RULES.kiranaWindowDays} days` },
    { id: "expiresoon", name: "ExpireSoon", s: "no limit; listed in the distributor's name" },
    { id: "staff", name: "Staff sale", s: `up to ${fmt.num(row("staff").capacity)} packs at the godown` },
    { id: "foodbank", name: "Food bank", s: "a donation reverses the GST credit" },
    { id: "writeoff", dot: "bin", name: "The bin", s: "stock, GST credit, disposal and EPR" }
  ];
  function PricesCard() {
    const { card, rise } = useRise();
    return /* @__PURE__ */ React.createElement(motion.div, { className: "m-card", role: "group", "aria-label": "The Valuer's prices, net a pack", ...card }, /* @__PURE__ */ React.createElement(motion.div, { className: "m-head", ...rise(0) }, /* @__PURE__ */ React.createElement("span", { className: "chip-agent on" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Valuer"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "net a pack, after costs")), PRICED.map((p, i) => /* @__PURE__ */ React.createElement(motion.div, { key: p.id, className: cx("m-row", p.dot === "bin" ? "bin" : !planned(p.id) && "off"), ...rise(i + 1) }, /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot " + (p.dot || p.id), "aria-hidden": "true" }), p.name), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmt.inr2(row(p.id).net)), /* @__PURE__ */ React.createElement("span", { className: "s" }, p.s))), /* @__PURE__ */ React.createElement(motion.div, { ...rise(PRICED.length + 1) }, /* @__PURE__ */ React.createElement("div", { className: "m-split-cap" }, /* @__PURE__ */ React.createElement("span", null, "The Router's split"), /* @__PURE__ */ React.createElement("span", null, fmt.num(N), " packs")), /* @__PURE__ */ React.createElement("div", { className: "m-split", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "k", style: { flexGrow: KL.units } }), /* @__PURE__ */ React.createElement("span", { className: "e", style: { flexGrow: ESL.units } })), /* @__PURE__ */ React.createElement("div", { className: "m-split-legend" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "ex-dot kirana", "aria-hidden": "true" }), fmt.num(KL.units), " to ", SHOPS, " kiranas"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "ex-dot expiresoon", "aria-hidden": "true" }), fmt.num(ESL.units), " on ExpireSoon"))));
  }
  const RELEASED = agentsAt("execute", "settle", "report");
  function PlanCard() {
    const { shown, card, rise } = useRise();
    const rolled = useLit(shown, 1, 270, 0) > 0;
    const lit = useLit(shown, RELEASED.length, 900, 220);
    return /* @__PURE__ */ React.createElement(motion.div, { className: "m-card yes", role: "group", "aria-label": "The plan, waiting for one yes", ...card }, /* @__PURE__ */ React.createElement(motion.div, { className: "m-head", ...rise(0) }, /* @__PURE__ */ React.createElement("b", null, "Approve the plan"), /* @__PURE__ */ React.createElement(Badge, { tone: "amber", dot: true }, "Waiting for you")), /* @__PURE__ */ React.createElement(motion.div, { className: "m-big flush", ...rise(1) }, /* @__PURE__ */ React.createElement(Money, { key: rolled ? "on" : "off", value: D.PLAN.net, roll: true, from: rolled ? 0 : void 0 }), /* @__PURE__ */ React.createElement("span", null, "recovered, against ", fmt.inr(-BIN), " to destroy it")), /* @__PURE__ */ React.createElement(motion.div, { className: "m-row", ...rise(2) }, /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot kirana", "aria-hidden": "true" }), fmt.num(KL.units), " packs to ", SHOPS, " kiranas"), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmt.inr(KL.net))), /* @__PURE__ */ React.createElement(motion.div, { className: "m-row", ...rise(3) }, /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot expiresoon", "aria-hidden": "true" }), fmt.num(ESL.units), " packs on ExpireSoon"), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmt.inr(ESL.net))), /* @__PURE__ */ React.createElement(motion.div, { className: "m-go", ...rise(4) }, /* @__PURE__ */ React.createElement("span", { className: "btn btn-approve btn-lg" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 18 }), "Approve · release the agents")), /* @__PURE__ */ React.createElement(motion.div, { className: "m-after", ...rise(5) }, RELEASED.map((w, i) => /* @__PURE__ */ React.createElement("span", { key: w, className: cx("chip-agent", i < lit && "on") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), w))));
  }
  function WorkCards() {
    const { shown, card, rise } = useRise(0.2);
    const lit = useLit(shown, 3, 300, 420);
    const p0 = D.PUSH.offer;
    return /* @__PURE__ */ React.createElement(motion.div, { className: "ch-row three", ...card }, /* @__PURE__ */ React.createElement(motion.div, { className: cx("m-card"), role: "group", "aria-label": "Outreach: the kirana offer, in Hindi", ...rise(0) }, /* @__PURE__ */ React.createElement("div", { className: "m-head" }, /* @__PURE__ */ React.createElement("span", { className: cx("chip-agent", lit > 0 && "on") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Outreach · 09:41"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "gift" }, SCHEME.buy, " + ", SCHEME.free)), /* @__PURE__ */ React.createElement("div", { className: "m-batch" }, /* @__PURE__ */ React.createElement(Product, { name: "pack-snack-plain", size: 52 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", { lang: "hi", className: "hi" }, p0.title), /* @__PURE__ */ React.createElement("span", null, fmt.inr2(KL.packPrice), " a pack · MRP ", fmt.inr(SKU.mrp), " · 48 hours"))), /* @__PURE__ */ React.createElement("p", { lang: "hi", className: "hi", style: { margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--fg-2)" } }, p0.body.split(" ").slice(0, 22).join(" "), "…"), /* @__PURE__ */ React.createElement("div", { className: "m-row" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, fmt.num(SHOPS), " shops ordered"), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmt.num(KL.units), " packs"))), /* @__PURE__ */ React.createElement(motion.div, { className: "m-card", role: "group", "aria-label": "Lister and Negotiator: the lot on ExpireSoon", ...rise(1), style: { "--primary": "var(--violet)", "--primary-text": "var(--violet-text, var(--violet))" } }, /* @__PURE__ */ React.createElement("div", { className: "m-head" }, /* @__PURE__ */ React.createElement("span", { className: cx("chip-agent", lit > 1 && "on") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Lister · Negotiator"), /* @__PURE__ */ React.createElement(Badge, { tone: "violet", dot: true }, "ExpireSoon")), /* @__PURE__ */ React.createElement("div", { className: "m-batch" }, /* @__PURE__ */ React.createElement(Product, { name: "marketplace-bag", size: 52 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, fmt.num(AW.units), " packs, listed in the distributor's name"), /* @__PURE__ */ React.createElement("span", null, "reserve ", rate(M.RULES.negotiation.reservePerUnit), " · hidden inside the brand's territories"))), /* @__PURE__ */ React.createElement("div", { className: "m-row" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "A buyer bids"), /* @__PURE__ */ React.createElement("span", { className: "v" }, rate(BID))), /* @__PURE__ */ React.createElement("div", { className: "m-row" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Countered, accepted"), /* @__PURE__ */ React.createElement("span", { className: "v" }, rate(AW.price), " a pack")), /* @__PURE__ */ React.createElement("div", { className: "m-row" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Token paid"), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmt.inr(AW.token)))), /* @__PURE__ */ React.createElement(motion.div, { className: "m-card", role: "group", "aria-label": "Paperwork: the documents, drafted", ...rise(2) }, /* @__PURE__ */ React.createElement("div", { className: "m-head" }, /* @__PURE__ */ React.createElement("span", { className: cx("chip-agent", lit > 2 && "on") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Paperwork"), /* @__PURE__ */ React.createElement(Badge, { tone: "gray" }, "drafted")), /* @__PURE__ */ React.createElement("div", { className: "m-batch" }, /* @__PURE__ */ React.createElement(Product, { name: "documents", size: 52 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "Everything finance needs, drafted"), /* @__PURE__ */ React.createElement("span", null, "each on paper, with who keeps what"))), [["The distributor's invoice to the buyer", "IGST 5%"], ["The brand's price-support credit note", fmt.inr(D.SUPPORT.total)], ["GST input credit memo", fmt.inr(D.PLAN.itcRetained)]].map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, className: "m-row" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, k), /* @__PURE__ */ React.createElement("span", { className: "v" }, v)))));
  }
  function Ledger() {
    const { shown, card, rise } = useRise(0.3);
    const rolled = useLit(shown, 1, 300, 0) > 0;
    const lines = [
      { k: "Recovered, net", s: `${fmt.inr(KL.net)} from ${SHOPS} kiranas after the van, ${fmt.inr(ES_NET)} from a marketplace buyer after the fee`, v: /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.net, roll: rolled, from: rolled ? 0 : void 0 }) },
      { k: "Better than the bin", s: `against ${fmt.inr(-BIN)} to destroy the stock: the goods, the GST credit, disposal and EPR`, v: /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.swing, roll: rolled, from: rolled ? 0 : void 0 }) },
      { k: "GST input credit kept", s: "goods supplied under tax invoices, so the Section 17(5)(h) reversal does not apply", v: /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.itcRetained, roll: rolled, from: rolled ? 0 : void 0 }) },
      { k: "Kept out of landfill", s: `${fmt.num(D.PLAN.co2)} kg CO₂e, indicative`, v: /* @__PURE__ */ React.createElement("span", { className: "num" }, /* @__PURE__ */ React.createElement(Roll, { value: D.PLAN.kg, from: rolled ? 0 : void 0 }), " kg") },
      { k: "Cartons destroyed", s: `${fmt.num(D.PLAN.soldUnits)} packs sold on tax invoices`, v: /* @__PURE__ */ React.createElement("span", { className: "num" }, "0"), zero: true }
    ];
    return /* @__PURE__ */ React.createElement("section", { className: "s60-ledger", id: "ledger", "aria-labelledby": "ledger-h" }, /* @__PURE__ */ React.createElement(motion.div, { className: "ledger", role: "group", "aria-labelledby": "ledger-h", ...card }, /* @__PURE__ */ React.createElement(motion.div, { className: "ledger-head", ...rise(0) }, /* @__PURE__ */ React.createElement("b", null, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "leaf", size: 14, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", { id: "ledger-h" }, "Impact · the ledger for one batch")), /* @__PURE__ */ React.createElement("span", null, "posted after the return window")), lines.map((l, i) => /* @__PURE__ */ React.createElement(motion.div, { key: l.k, className: cx("ledger-row", l.zero && "zero"), ...rise(i + 1) }, /* @__PURE__ */ React.createElement("span", { className: "k" }, l.k), /* @__PURE__ */ React.createElement("span", { className: "v" }, l.v), /* @__PURE__ */ React.createElement("span", { className: "s" }, l.s))), /* @__PURE__ */ React.createElement(motion.div, { className: "ledger-foot", ...rise(lines.length + 1) }, /* @__PURE__ */ React.createElement("span", null, "BRSR Principle 6 · two rows an auditor can follow back to the batch"), /* @__PURE__ */ React.createElement("span", null, "one illustrative batch"))), /* @__PURE__ */ React.createElement("p", { className: "ledger-note" }, "An illustrative batch. Every figure is worked out from the journey map."));
  }
  const EXITS = [
    { id: "kirana", name: "Kiranas", taken: true, art: "kirana-plain", total: KL.net, packs: KL.units, per: `${rate(row("kirana").net)} a pack, after the van`, line: `${fmt.num(KL.units)} packs · ${SHOPS} shops` },
    { id: "expiresoon", name: "ExpireSoon", taken: true, art: "marketplace-bag", total: ES_NET, packs: AW.units, per: `${rate(AW.price)} a pack, countered from ${rate(ESL.price)}`, line: `${fmt.num(AW.units)} packs · one buyer` },
    { id: "staff", name: "Staff sale", art: "godown-plain", note: "priced, not needed", per: `${rate(row("staff").net)} a pack, up to ${row("staff").capacity} packs` },
    { id: "foodbank", name: "Food bank", art: "donation-crate", note: "priced, not needed", per: `${rate(row("foodbank").net)} a pack: a donation reverses the GST credit` },
    { id: "bin", name: "The bin", bin: true, art: "bin-plain", total: -BIN, note: "not taken", per: `${rate(-D.PLAN.writeOff.perUnit)} a pack, the GST credit and disposal included` }
  ];
  function ExitsRow({ title = "Five exits, one batch", sub }) {
    const { shown, card, rise } = useRise(0.2);
    return /* @__PURE__ */ React.createElement(motion.section, { id: "exits", className: "s60-exits", "aria-labelledby": "exits-h", ...card }, /* @__PURE__ */ React.createElement("header", { className: "sec-head" }, /* @__PURE__ */ React.createElement("h2", { id: "exits-h", className: "sec-h" }, title), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, sub || `${fmt.num(N)} packs of masala chips that won't sell in the ${BATCH.daysLeft} days they have left. The Valuer priced every exit, the bin included, and the Router sent the packs where they recover the most.`)), /* @__PURE__ */ React.createElement("ul", { className: "ex-strip", "aria-label": "The five exits" }, EXITS.map((e, i) => /* @__PURE__ */ React.createElement(motion.li, { key: e.id, className: cx("ex-card", e.id, e.taken && "taken", e.bin && "bin"), ...rise(i) }, /* @__PURE__ */ React.createElement(Product, { name: e.art, size: 112 }), /* @__PURE__ */ React.createElement("span", { className: "exn" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot " + (e.bin ? "bin" : e.id), "aria-hidden": "true" }), e.name, e.taken && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15, stroke: 2.6, className: "ex-took" })), /* @__PURE__ */ React.createElement("span", { className: "exp" }, e.per), e.taken ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "exv" }, /* @__PURE__ */ React.createElement(Money, { value: e.total })), /* @__PURE__ */ React.createElement("span", { className: "exl" }, e.line)) : e.bin ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "exv no" }, e.note), /* @__PURE__ */ React.createElement("span", { className: "exl", style: { color: "var(--red-text)" } }, fmt.inr(e.total), " if destroyed")) : /* @__PURE__ */ React.createElement("span", { className: "exv no" }, e.note)))));
  }
  function DemoPill({ hidden }) {
    return /* @__PURE__ */ React.createElement("a", { className: cx("s60-pill", hidden && "off"), ...linkProps(LINKS.demo), "aria-label": "Watch the 6-minute demo" }, /* @__PURE__ */ React.createElement("span", { className: "thumb", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("img", { src: (window.SC3_IMG || "system/img/").replace(/img\/$/, "media/") + "carton-loop-poster.webp", alt: "" }), /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: "play", size: 12, stroke: 2.6 }))), /* @__PURE__ */ React.createElement("span", null, "Watch the 6-minute demo"));
  }
  const ISLANDS = [
    { id: "brand", x: 0.22, y: 0.6, ly: 0.86, product: "pack-snack-plain", url: "your-brand.smartclearance.com", live: true },
    { id: "company", x: 0.575, y: 0.59, ly: 0.84, product: "pack-carton-plain", url: "your-company.smartclearance.com" },
    { id: "group", x: 0.8, y: 0.61, ly: 0.87, product: "bottle-oil-plain", url: "your-group.smartclearance.com" }
  ];
  const HUB = { x: 0.425, y: 0.69 }, ISL_AR = 3776 / 1120;
  const TEAMS = [
    { icon: "route", t: "Supply chain", d: "One tap to approve a plan, with the money on screen." },
    { icon: "receipt", t: "Finance", d: "The invoice, credit note and GST memo, drafted." },
    { icon: "leaf", t: "Sustainability", d: "A BRSR line an auditor can follow back to the batch." },
    { icon: "handshake", t: "Distributors", d: "Nothing listed in their name without their permission." }
  ];
  const CONN = ["dms", "tally", "bq", "sso", "expiresoon", "irp", "whatsapp"].map((id) => P.CONNECTORS.find((c) => c.id === id)).filter(Boolean);
  function Workspace() {
    const app = useApp();
    const { resolved } = useTheme();
    const swipe = app.bp === "phone";
    const urls = (cls) => /* @__PURE__ */ React.createElement("ul", { className: cx("isl-urls", cls), "aria-label": "Workspace addresses" }, ISLANDS.map((i) => /* @__PURE__ */ React.createElement("li", { key: i.id, className: cx("isl-url", i.live && "live"), style: { "--x": i.x, "--y": i.ly } }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), i.url, i.live && /* @__PURE__ */ React.createElement("span", { className: "isl-live" }, " · live"))));
    return /* @__PURE__ */ React.createElement("section", { id: "teams", className: "sec sec-ws", "aria-labelledby": "ws-h" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("header", { className: "sec-head" }, /* @__PURE__ */ React.createElement("h2", { id: "ws-h", className: "sec-h plain" }, "Your own workspace, set up for your supply chain."), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, "Each manufacturer gets its own address, configured for how its stock really moves."))), /* @__PURE__ */ React.createElement("div", { className: "isl-pan", ...swipe ? { tabIndex: 0, role: "region", "aria-label": "Workspaces, one island each; scroll sideways" } : {} }, /* @__PURE__ */ React.createElement("figure", { className: "islands", style: { "--ar": ISL_AR } }, /* @__PURE__ */ React.createElement("img", { className: "isl-plate", src: IMG + (resolved === "dark" ? "islands-night.webp" : "islands.webp"), alt: "", loading: "lazy" }), ISLANDS.map((i) => /* @__PURE__ */ React.createElement("span", { key: i.id, className: "isl-packs", style: { "--x": i.x, "--y": i.y }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: i.product, size: 160, className: "isl-pack" }))), /* @__PURE__ */ React.createElement("span", { className: "isl-hub", style: { "--x": HUB.x, "--y": HUB.y }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Mark, { size: 52 })), urls("on-plate"), /* @__PURE__ */ React.createElement("figcaption", { className: "sr-only" }, "Three islands over a miniature town, each a manufacturer's workspace with its own products, joined to Smart-Clearance by green paths."))), /* @__PURE__ */ React.createElement("div", { className: "wrap" }, urls("below"), /* @__PURE__ */ React.createElement("ul", { className: "teams", "aria-label": "What each team gets" }, TEAMS.map((t) => /* @__PURE__ */ React.createElement("li", { key: t.t, className: "team" }, /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: 26 }), /* @__PURE__ */ React.createElement("b", null, t.t), /* @__PURE__ */ React.createElement("p", null, t.d)))), /* @__PURE__ */ React.createElement("div", { className: "conn" }, /* @__PURE__ */ React.createElement("ul", { className: "conn-list", "aria-label": "Works with" }, CONN.map((c) => /* @__PURE__ */ React.createElement("li", { key: c.id }, c.name, c.status === "soon" && /* @__PURE__ */ React.createElement("span", { className: "soon" }, " · soon")))))));
  }
  function Plans({ onDemo }) {
    return /* @__PURE__ */ React.createElement("section", { id: "pricing", className: "sec sec-plans", "aria-labelledby": "plans-h" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("header", { className: "sec-head" }, /* @__PURE__ */ React.createElement("h2", { id: "plans-h", className: "sec-h plain" }, "Start with one distributor."), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, "A pilot runs on one distributor's stock for 90 days. Prices are set with each manufacturer.")), /* @__PURE__ */ React.createElement("ul", { className: "plans" }, P.PLANS.map((p) => /* @__PURE__ */ React.createElement("li", { key: p.id, className: "plan" }, /* @__PURE__ */ React.createElement("b", { className: "plan-name" }, p.name), /* @__PURE__ */ React.createElement("ul", { className: "plan-scope" }, p.scope.map((s) => /* @__PURE__ */ React.createElement("li", { key: s }, s.replace(/^The client's /, "Your ")))), /* @__PURE__ */ React.createElement("span", { className: "plan-foot" }, /* @__PURE__ */ React.createElement("span", null, "Prices on request"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link", onClick: () => onDemo(p.name) }, "Talk to us", /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, " about ", p.name))))))));
  }
  function Close({ onDemo, closeRef }) {
    return /* @__PURE__ */ React.createElement("section", { className: "close", "aria-labelledby": "close-h", ref: closeRef }, /* @__PURE__ */ React.createElement("div", { className: "close-copy" }, /* @__PURE__ */ React.createElement("h2", { id: "close-h", className: "close-h" }, "Give your next batch a second chance."), /* @__PURE__ */ React.createElement("div", { className: "close-ctas" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: () => onDemo() }, "Book a demo"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-secondary", ...linkProps(LINKS.demo) }, "Watch the 6-minute demo"))), /* @__PURE__ */ React.createElement("img", { className: "close-plate", src: IMG + "dusk.webp", width: "4128", height: "1024", alt: "", loading: "lazy" }));
  }
  function Footer({ onFind, sections = SECTIONS }) {
    const { mode, setMode } = useTheme();
    const cols = [
      ["Product", sections.map(([id, t]) => /* @__PURE__ */ React.createElement("a", { key: id, href: "#" + id }, t))],
      ["Sign in", [/* @__PURE__ */ React.createElement("button", { key: "find", type: "button", className: "foot-link", onClick: onFind }, "Find your workspace"), /* @__PURE__ */ React.createElement("a", { key: "staff", ...linkProps(LINKS.console) }, "Staff console")]]
    ];
    return /* @__PURE__ */ React.createElement("footer", { className: "foot" }, /* @__PURE__ */ React.createElement("div", { className: "wrap foot-grid" }, /* @__PURE__ */ React.createElement("div", { className: "foot-brand" }, /* @__PURE__ */ React.createElement(Mark, { size: 40 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Wordmark, { size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "foot-tag" }, "Every near-expiry carton gets a second chance."))), /* @__PURE__ */ React.createElement("nav", { className: "foot-cols", "aria-label": "Footer" }, cols.map(([h, items]) => /* @__PURE__ */ React.createElement("div", { key: h, className: "foot-col" }, /* @__PURE__ */ React.createElement("b", null, h), items)))), /* @__PURE__ */ React.createElement("div", { className: "wrap foot-base" }, /* @__PURE__ */ React.createElement("p", null, "Prototype · every company, person and number is fictional · Google AI Hackathon 2026"), /* @__PURE__ */ React.createElement(Segmented, { options: [{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }, { id: "system", label: "Auto" }], value: mode, onChange: setMode, label: "Appearance", size: "sm" })));
  }
  function DemoSheet({ open: isOpen, plan, onClose }) {
    const app = useApp();
    const blank = { name: "", company: "", email: "", makes: "Snacks and drinks", note: "" };
    const [f, setF] = useState(blank);
    const [err, setErr] = useState({});
    const [sent, setSent] = useState(null);
    useEffect(() => {
      if (isOpen) {
        setSent(null);
        setErr({});
      }
    }, [isOpen]);
    const edit = (k) => (e) => {
      setF({ ...f, [k]: e.target.value });
      if (err[k]) setErr({ ...err, [k]: null });
    };
    const send = () => {
      const e = { name: !f.name.trim() && "Enter your name.", company: !f.company.trim() && "Enter your company's name.", email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) && "Enter a work email address, like name@company.in." };
      if (e.name || e.company || e.email) {
        setErr(e);
        return;
      }
      const req = { id: "rq-" + Date.now().toString(36), at: (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), name: f.name.trim(), company: f.company.trim(), email: f.email.trim().toLowerCase(), makes: f.makes, plan: plan || null, note: f.note.trim(), status: "new" };
      if (P) P.update((d) => {
        d.requests = [req].concat(d.requests || []);
      });
      setSent(req);
      setF(blank);
    };
    return /* @__PURE__ */ React.createElement(
      Sheet,
      {
        open: isOpen,
        onClose,
        title: plan ? `Talk to us about ${plan}` : "Book a demo",
        side: app.bp === "phone" ? "bottom" : "center",
        detent: "large",
        footer: sent ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, onClick: onClose }, "Done") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "send", onClick: send }, "Send request")
      },
      sent ? /* @__PURE__ */ React.createElement("div", { className: "stack", style: { justifyItems: "center", textAlign: "center", paddingTop: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "sd-done", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-check", size: 36 })), /* @__PURE__ */ React.createElement("b", { className: "t-title3" }, "Thanks, ", sent.name.split(" ")[0], "."), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0, maxWidth: "40ch" } }, "We'll set up a walkthrough for ", sent.company, " on its own supply chain. In this prototype your request appears in the Smart-Clearance console, under Overview."), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link", onClick: () => open(LINKS.console) }, "Open the console")) : /* @__PURE__ */ React.createElement("form", { className: "stack", style: { gap: 12 }, onSubmit: (e) => {
        e.preventDefault();
        send();
      }, noValidate: true }, /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, "Thirty minutes on your own stock: we price one batch that's headed for the bin and show you the plan."), /* @__PURE__ */ React.createElement(Field, { label: "Your name", htmlFor: "bd-name", error: err.name || null }, /* @__PURE__ */ React.createElement(Input, { id: "bd-name", value: f.name, onChange: edit("name"), autoComplete: "name" })), /* @__PURE__ */ React.createElement(Field, { label: "Company", htmlFor: "bd-company", error: err.company || null }, /* @__PURE__ */ React.createElement(Input, { id: "bd-company", value: f.company, onChange: edit("company"), autoComplete: "organization" })), /* @__PURE__ */ React.createElement(Field, { label: "Work email", htmlFor: "bd-email", error: err.email || null }, /* @__PURE__ */ React.createElement(Input, { id: "bd-email", type: "email", value: f.email, onChange: edit("email"), autoComplete: "email", spellCheck: false, autoCapitalize: "none" })), /* @__PURE__ */ React.createElement(Field, { label: "What you make", htmlFor: "bd-makes" }, /* @__PURE__ */ React.createElement(Select, { id: "bd-makes", value: f.makes, onChange: (e) => setF({ ...f, makes: e.target.value }) }, ["Snacks and drinks", "Personal care", "Dairy", "Staples", "Home care"].map((x) => /* @__PURE__ */ React.createElement("option", { key: x }, x)))), /* @__PURE__ */ React.createElement(Field, { label: "Anything we should know (optional)", htmlFor: "bd-note" }, /* @__PURE__ */ React.createElement(Textarea, { id: "bd-note", rows: 3, value: f.note, onChange: (e) => setF({ ...f, note: e.target.value }) })), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "Prototype: nothing is sent anywhere; the request stays in this browser."))
    );
  }
  function Shell({ option, sections, children }) {
    const [find, setFind] = useState(false);
    const [demo, setDemo] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const closeRef = useRef(null);
    const nearEnd = useInView(closeRef, { amount: 0.2 });
    useEffect(() => {
      document.title = "Smart-Clearance";
    }, []);
    useEffect(() => {
      const f = () => setScrolled(window.scrollY > 40);
      f();
      window.addEventListener("scroll", f, { passive: true });
      return () => window.removeEventListener("scroll", f);
    }, []);
    const onDemo = (plan) => setDemo({ plan: typeof plan === "string" ? plan : null });
    const ctx = { onFind: () => setFind(true), onDemo, closeRef };
    return /* @__PURE__ */ React.createElement("div", { className: cx("site s60", "opt-" + option, scrolled && "scrolled"), id: "top" }, /* @__PURE__ */ React.createElement(Nav, { onFind: ctx.onFind, onDemo, sections }), /* @__PURE__ */ React.createElement("main", null, children(ctx)), /* @__PURE__ */ React.createElement(Footer, { onFind: ctx.onFind, sections }), /* @__PURE__ */ React.createElement(DemoPill, { hidden: nearEnd }), /* @__PURE__ */ React.createElement(S.FindWorkspace, { open: find, onClose: () => setFind(false), onUse: () => {
      setFind(false);
      open(LINKS.app);
    }, note: "One manufacturer's workspace is set up in this prototype." }), /* @__PURE__ */ React.createElement(DemoSheet, { open: !!demo, plan: demo && demo.plan, onClose: () => setDemo(null) }));
  }
  function mount(Page) {
    function Root() {
      return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "site-root s60-root" }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(Page, null))));
    }
    ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
  }
  window.SC60 = { FIG, AGENTS, AGENT, agentsAt, LINKS, linkProps, open, IMG, EASE, useRise, useLit, AgentChips, Nav, Statement, Chapter, AlertCard, PricesCard, PlanCard, WorkCards, Ledger, ExitsRow, EXITS, DemoPill, Workspace, Plans, Close, Footer, DemoSheet, Shell, mount, SECTIONS };
})();

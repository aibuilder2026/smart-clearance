(function() {
  const { useState, useEffect, useRef } = React;
  const { useReducedMotion, motion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, P = window.SC3_PLATFORM;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Button, Badge, Sheet, Field, Input, Select, Textarea, Menu, Mark, Wordmark, WorkspaceMark, Money, Avatar, Product, Segmented, ThemeProvider, AppRoot, NoticeHost, useApp, useTheme } = K;
  const IMG = window.SC3_SITE_IMG || "assets/plates/";
  const LINKS = Object.assign({ demo: "../demo/Smart-Clearance%20demo%20v3.html", app: "../app/Smart-Clearance%20app%20v3.html", console: "../console/Smart-Clearance%20console%20v3.html" }, window.SC3_LINKS || {});
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
  const BATCH = D.BATCHES.find((b) => b.hero), SKU = D.SKUS[BATCH.sku], DIST = D.DISTRIBUTORS[BATCH.distributor];
  const SHOPS = D.KIRANAS.length, BIN = D.PLAN.writeOff.total, ES_NET = AW.gross - ESL.cost;
  const rate = (v) => Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v);
  const SECTIONS = [["how", "How it works"], ["agents", "Agents"], ["customers", "Customers"], ["pricing", "Pricing"]];
  const goTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  function Nav({ onFind, onDemo }) {
    const app = useApp();
    const [menu, setMenu] = useState(false);
    const [sheet, setSheet] = useState(false);
    const signInItems = [
      { label: "Sign in to", heading: true },
      { label: "Find your workspace", icon: "search", onClick: onFind },
      { label: "Munchly Foods", icon: "building-2", right: /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle mono" }, "munchly"), onClick: () => open(LINKS.app) },
      "-",
      { label: "Smart-Clearance staff", icon: "shield", onClick: () => open(LINKS.console) }
    ];
    return /* @__PURE__ */ React.createElement("header", { className: "site-nav" }, /* @__PURE__ */ React.createElement("a", { className: "nav-brand", href: "#top", "aria-label": "Smart-Clearance, back to the top" }, /* @__PURE__ */ React.createElement("span", { className: "nav-mark" }, /* @__PURE__ */ React.createElement(Mark, { size: 36 })), /* @__PURE__ */ React.createElement(Wordmark, { size: 15 })), app.bp === "desktop" && /* @__PURE__ */ React.createElement("nav", { className: "nav-links", "aria-label": "Sections" }, SECTIONS.map(([id, t]) => /* @__PURE__ */ React.createElement("a", { key: id, href: "#" + id }, t))), /* @__PURE__ */ React.createElement("span", { className: "grow" }), /* @__PURE__ */ React.createElement("span", { className: "nav-signin" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-text", "aria-haspopup": "menu", "aria-expanded": menu, onClick: () => setMenu((m) => !m) }, "Sign in"), /* @__PURE__ */ React.createElement(Menu, { open: menu, onClose: () => setMenu(false), items: signInItems, width: 268, label: "Sign in to" })), app.bp !== "phone" ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", pill: true, className: "nav-demo", onClick: () => onDemo() }, "Book a demo") : /* @__PURE__ */ React.createElement(IconButton, { icon: "menu", label: "Menu", onClick: () => setSheet(true) }), /* @__PURE__ */ React.createElement(Sheet, { open: sheet, onClose: () => setSheet(false), title: "Smart-Clearance", side: "bottom", detent: "medium" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "list" }, SECTIONS.map(([id, t]) => /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: "list-row", onClick: () => {
      setSheet(false);
      setTimeout(() => goTo(id), 60);
    } }, /* @__PURE__ */ React.createElement("span", { className: "lr-main" }, /* @__PURE__ */ React.createElement("span", { className: "lr-title" }, t)), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "chev" })))), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, onClick: () => {
      setSheet(false);
      onDemo();
    } }, "Book a demo"))));
  }
  function HeroCard() {
    const reduce = useReducedMotion();
    const [k, setK] = useState(reduce ? 8 : 0);
    useEffect(() => {
      if (reduce) {
        setK(8);
        return;
      }
      if (k >= 8) return;
      const t = setTimeout(() => setK(k + 1), k === 0 ? 500 : 260);
      return () => clearTimeout(t);
    }, [k, reduce]);
    return /* @__PURE__ */ React.createElement("div", { className: "hero-card", role: "group", "aria-label": `Batch ${BATCH.id}: eight of nine stops done, ${fmt.inr(D.ACTUAL.net)} recovered` }, /* @__PURE__ */ React.createElement("span", { className: "hc-id mono" }, BATCH.id), /* @__PURE__ */ React.createElement("span", { className: "hc-dots", "aria-hidden": "true" }, Array.from({ length: 9 }).map((_, i) => /* @__PURE__ */ React.createElement("i", { key: i, className: cx(i < k && "on") }))), /* @__PURE__ */ React.createElement(Money, { value: k >= 8 ? D.ACTUAL.net : Math.round(D.ACTUAL.net * k / 8), roll: !reduce, from: 0, className: "hc-money" }), /* @__PURE__ */ React.createElement("span", { className: "hc-cap" }, "recovered"));
  }
  function Hero({ onFind }) {
    const { resolved } = useTheme();
    const night = resolved === "dark";
    const stops = [["kiranas", "Kiranas"], ["market", "Marketplace"], ["staff", "Staff sale"], ["foodbank", "Food bank"]];
    return /* @__PURE__ */ React.createElement("section", { className: "hero", "aria-labelledby": "hero-h" }, /* @__PURE__ */ React.createElement("div", { className: "hero-frame" }, /* @__PURE__ */ React.createElement("div", { className: "hero-copy" }, /* @__PURE__ */ React.createElement("h1", { id: "hero-h", className: "hero-h" }, "Every near-expiry carton gets a second chance."), /* @__PURE__ */ React.createElement("p", { className: "hero-sub" }, "AI agents find the best exit for short-dated stock. You say yes once."), /* @__PURE__ */ React.createElement("div", { className: "hero-ctas" }, /* @__PURE__ */ React.createElement("a", { className: "btn btn-primary", ...linkProps(LINKS.demo) }, "Watch the 6-minute demo"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: onFind }, "Find your workspace"))), /* @__PURE__ */ React.createElement("div", { className: "hero-stage" }, /* @__PURE__ */ React.createElement("picture", { className: "hero-scene" }, /* @__PURE__ */ React.createElement("img", { src: IMG + (night ? "scene-night.webp" : "scene.webp"), width: "2752", height: "1504", alt: night ? "A miniature Indian town at night: one giant cardboard carton stands among tiny kirana shops with lit windows, a van and a handcart, lit from below by a glowing green path that runs from it to the shops." : "A miniature Indian town in the morning: one giant cardboard carton stands among tiny kirana shops, a van and a handcart, with a green path running from it to the shops." })), /* @__PURE__ */ React.createElement(HeroCard, null), /* @__PURE__ */ React.createElement("ol", { className: "hero-stops", "aria-label": "Where its packs can go" }, stops.map(([id, t]) => /* @__PURE__ */ React.createElement("li", { key: id, className: "st-" + id }, t))), /* @__PURE__ */ React.createElement("span", { className: "hero-line l1", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { className: "hero-line l2", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { className: "hero-line l3", "aria-hidden": "true" }))));
  }
  const row = (id) => D.PLAN.rows.find((r) => r.id === id);
  const EXITS = [
    {
      id: "kirana",
      name: "Kiranas",
      line: `${fmt.num(KL.units)} packs · ${SHOPS} shops`,
      x: 0.33,
      taken: true,
      detail: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas at ${fmt.inr(KL.price)} a pack, 2 free with every 10: ${fmt.inr(KL.net)} after the van.`
    },
    {
      id: "expiresoon",
      name: "ExpireSoon",
      line: `${fmt.num(AW.units)} packs · ${rate(AW.price)}`,
      x: 0.5,
      taken: true,
      detail: `${fmt.num(AW.units)} packs to ${D.BUYER.name} in ${D.BUYER.city} at ${rate(AW.price)}, countered from ${rate(ESL.price)}: ${fmt.inr(ES_NET)} after the listing fee.`
    },
    {
      id: "staff",
      name: "Staff sale",
      line: "priced, not needed",
      x: 0.665,
      detail: `${rate(row("staff").net)} a pack for up to ${row("staff").capacity} packs at the ${DIST.city} godown. Not needed this time.`
    },
    {
      id: "foodbank",
      name: "Food bank",
      line: "priced, not needed",
      x: 0.8,
      detail: `${rate(row("foodbank").net)} a pack, because a donation reverses the GST credit. Kept for food that can't sell.`
    },
    {
      id: "bin",
      name: "The bin",
      line: `${fmt.inr(-BIN)} · not taken`,
      x: 0.935,
      bin: true,
      detail: `${rate(-D.PLAN.writeOff.perUnit)} a pack: the stock, the GST credit, disposal and EPR, ${fmt.inr(-BIN)} for the batch. Not taken.`
    }
  ];
  const EX_AR = 4.34, EX_ZOOM = 1.8;
  const holdShift = (x) => Math.max(1 / EX_ZOOM - 1, Math.min(0, 0.5 / EX_ZOOM - x));
  const EX_P = [], EX_X = [];
  EXITS.forEach((e, i) => {
    const t = (holdShift(e.x) * 100).toFixed(2) + "%";
    EX_P.push(2 * i / 9, (2 * i + 1) / 9);
    EX_X.push(i === 0 ? "0%" : t, i === 0 ? "0%" : t);
  });
  const ScrollCtx = React.createContext(null);
  function ExitsPanned({ active, setActive, children }) {
    const site = React.useContext(ScrollCtx);
    const track = useRef(null);
    const app = useApp();
    const top = Math.max(68, Math.round(app.h * 0.5 - 280));
    const { scrollYProgress } = Motion.useScroll({ container: site, target: track, offset: [`start ${top}px`, "end end"] });
    const x = Motion.useTransform(scrollYProgress, EX_P, EX_X);
    Motion.useMotionValueEvent(scrollYProgress, "change", (v) => {
      const i = Math.min(EXITS.length - 1, Math.floor(v * 4.5 + 0.25));
      if (i !== active) setActive(i);
    });
    const jump = (i) => {
      const s = site.current, t = track.current;
      if (!s || !t) return;
      const at = t.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop;
      const from = at - top, to = at + t.offsetHeight - s.clientHeight;
      s.scrollTo({ top: from + (to - from) * (2 * i + 0.5) / 9, behavior: "smooth" });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "ex-track", ref: track }, /* @__PURE__ */ React.createElement("div", { className: "ex-stick", style: { top } }, children({ x, jump })));
  }
  function Exits() {
    const app = useApp();
    const reduce = useReducedMotion();
    const site = React.useContext(ScrollCtx);
    const swipe = app.bp !== "desktop";
    const panned = !swipe && !reduce && !!site;
    const [active, setActive] = useState(0);
    const stage = ({ x, jump } = {}) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: cx("ex-pan", panned && "panned"), ...swipe ? { tabIndex: 0, role: "region", "aria-label": "The street from the godown to the bin; scroll sideways" } : {} }, /* @__PURE__ */ React.createElement(motion.figure, { className: "ex-pano", style: { "--ar": EX_AR, x: panned ? x : void 0 } }, /* @__PURE__ */ React.createElement("img", { src: IMG + "exits.webp", alt: "One miniature street from end to end: the distributor's godown, two kirana shops hung with snack packets, a general store, more small shops, a van, and a smouldering rubbish heap at the far end." }), /* @__PURE__ */ React.createElement("ul", { className: "ex-chips" }, EXITS.map((e, i) => /* @__PURE__ */ React.createElement("li", { key: e.id, style: { "--x": e.x } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("ex-chip", e.taken && "taken", e.bin && "bin", i === active && "on"), "aria-pressed": i === active, onClick: () => panned ? jump(i) : setActive(i) }, /* @__PURE__ */ React.createElement("span", { className: "ex-name" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot " + e.id, "aria-hidden": "true" }), e.name, e.taken && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 14, stroke: 2.6, className: "ex-took" })), /* @__PURE__ */ React.createElement("span", { className: "ex-line" }, e.line))))))), /* @__PURE__ */ React.createElement("p", { className: "ex-cap", "aria-live": "polite" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot " + EXITS[active].id, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, EXITS[active].name, "."), " ", EXITS[active].detail)));
    const figs = [
      { n: /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.net, className: "fig-n" }), l: "recovered", d: `${fmt.inr(KL.net)} from ${SHOPS} kiranas and ${fmt.inr(ES_NET)} from a buyer in Raipur, after the van and the listing fee.` },
      { n: /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.swing, className: "fig-n" }), l: "better than the bin", d: `Munchly's books show ${fmt.inr(D.ACTUAL.pnl)} with the plan, price support included, against ${fmt.inr(-BIN)} to destroy the batch.` },
      { n: /* @__PURE__ */ React.createElement("span", { className: "num fig-n" }, "0"), l: "cartons destroyed", d: `All ${fmt.num(D.PLAN.soldUnits)} packs sold on tax invoices, so the ${fmt.inr(D.PLAN.itcRetained)} GST credit stays.` }
    ];
    return /* @__PURE__ */ React.createElement("section", { id: "how", className: "sec sec-exits", "aria-labelledby": "exits-h" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("header", { className: "sec-head" }, /* @__PURE__ */ React.createElement("h2", { id: "exits-h", className: "sec-h" }, "Five exits, one batch"), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, BATCH.id), ": ", fmt.num(D.RISK.atRisk), " packs of masala chips that won't sell in the ", BATCH.daysLeft, " days they have left. The agents priced every exit; two of them took the batch."))), /* @__PURE__ */ React.createElement("div", { className: "ex-body" }, panned ? /* @__PURE__ */ React.createElement(ExitsPanned, { active, setActive }, stage) : stage()), /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("ul", { className: "ex-figs" }, figs.map((f) => /* @__PURE__ */ React.createElement("li", { key: f.l, className: "ex-fig" }, f.n, /* @__PURE__ */ React.createElement("b", { className: "fig-l" }, f.l), /* @__PURE__ */ React.createElement("span", { className: "fig-d" }, f.d))))));
  }
  const STOP_LINES = { connect: "the distributor's stock export and one permission", detect: "shelf life checked against every gate at 09:00", verify: "the label photo read and matched", value: "five exits priced, the bin included", decide: "the batch split, with the reasons", approve: "one tap, with the money on screen", execute: "listing, offers in Hindi, bids answered, pick-up", settle: "invoice, e-way bill, credit note, GST memo", report: "a BRSR line after the return window" };
  function Stops() {
    const byStage = {};
    P.AGENTS.forEach((a) => {
      if (!a.gate) (byStage[a.stage] = byStage[a.stage] || []).push(a.name);
    });
    return /* @__PURE__ */ React.createElement("section", { id: "agents", className: "sec sec-stops", "aria-labelledby": "stops-h" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("header", { className: "sec-head" }, /* @__PURE__ */ React.createElement("h2", { id: "stops-h", className: "sec-h" }, "Nine stops. Ten agents. One yes."), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, "The agents do the running around. A person approves once, with the money on screen.")), /* @__PURE__ */ React.createElement("div", { className: "stops-grid" }, /* @__PURE__ */ React.createElement("figure", { className: "plate-frame stops-plate" }, /* @__PURE__ */ React.createElement("img", { src: IMG + "approve.webp", alt: "A miniature town square seen from above: a giant amber push-button on a stone plinth, a woman in a sari beside it with her phone, vans and a handcart around the square.", loading: "lazy" })), /* @__PURE__ */ React.createElement("ol", { className: "stops", "aria-label": "The nine stops" }, D.STAGES.map((s) => /* @__PURE__ */ React.createElement("li", { key: s.id, className: cx("stop", s.human && "human") }, /* @__PURE__ */ React.createElement("span", { className: "st-dot", "aria-hidden": "true" }, s.human && /* @__PURE__ */ React.createElement(Icon, { name: "hand", size: 14, stroke: 2.4 })), /* @__PURE__ */ React.createElement("span", { className: "st-main" }, /* @__PURE__ */ React.createElement("b", null, s.title), /* @__PURE__ */ React.createElement("span", { className: "st-text" }, STOP_LINES[s.id]), /* @__PURE__ */ React.createElement("span", { className: "st-who" }, s.human ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, "a person") : (byStage[s.id] || []).map((n) => /* @__PURE__ */ React.createElement(Badge, { key: n, size: "sm" }, n))))))))));
  }
  const CAST = [
    { id: "rakesh", role: `Distributor, ${DIST.city}`, did: `Made whole by a ${fmt.inr(D.SUPPORT.total)} credit note` },
    { id: "ganesh", role: "Kirana, Itwari", did: "2 free with every 10" },
    { id: "anita", role: "Finance, Munchly", did: "Credit note and GST memo drafted" },
    { id: "vikram", role: "Sustainability, Munchly", did: `${fmt.num(D.PLAN.kg)} kg kept out of landfill` }
  ];
  function Story() {
    const priya = D.PEOPLE.priya, ws = D.WORKSPACE;
    const rows = [
      ["If destroyed", /* @__PURE__ */ React.createElement(Money, { value: -BIN, className: "sc-bin" })],
      ["GST credit kept", /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.itcRetained })],
      ["Kiranas restocked", /* @__PURE__ */ React.createElement("span", { className: "num" }, SHOPS)],
      ["Cartons destroyed", /* @__PURE__ */ React.createElement("span", { className: "num" }, "0")]
    ];
    return /* @__PURE__ */ React.createElement("section", { id: "customers", className: "sec sec-story", "aria-labelledby": "story-h" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "story" }, /* @__PURE__ */ React.createElement("div", { className: "story-copy" }, /* @__PURE__ */ React.createElement("h2", { id: "story-h", className: "sec-h story-h" }, /* @__PURE__ */ React.createElement("span", null, "One plan approved."), " ", /* @__PURE__ */ React.createElement("span", null, "Not one carton destroyed.")), /* @__PURE__ */ React.createElement("blockquote", { className: "story-quote" }, /* @__PURE__ */ React.createElement("p", null, "“I approved one plan with the money on screen. The agents did the running around.”")), /* @__PURE__ */ React.createElement("div", { className: "story-who" }, /* @__PURE__ */ React.createElement(Avatar, { person: priya, size: "xl" }), /* @__PURE__ */ React.createElement("span", { className: "sw-text" }, /* @__PURE__ */ React.createElement("b", null, priya.name), /* @__PURE__ */ React.createElement("span", null, priya.role), /* @__PURE__ */ React.createElement("span", { className: "sw-org" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws, size: 20 }), ws.name, " · snacks and drinks, ", D.CLIENT.city))), /* @__PURE__ */ React.createElement("div", { className: "story-ctas" }, /* @__PURE__ */ React.createElement("a", { className: "btn btn-primary", ...linkProps(LINKS.demo) }, "Watch Munchly's batch, stage by stage"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-secondary btn-white", ...linkProps(LINKS.app) }, "Visit ", ws.domain))), /* @__PURE__ */ React.createElement("div", { className: "story-card", role: "group", "aria-label": `Batch ${BATCH.id}, cleared` }, /* @__PURE__ */ React.createElement("div", { className: "sc-top" }, /* @__PURE__ */ React.createElement("span", { className: "sc-id" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, BATCH.id), /* @__PURE__ */ React.createElement("span", null, SKU.brand, " ", SKU.name, " · ", DIST.name, ", ", DIST.city)), /* @__PURE__ */ React.createElement(Product, { name: SKU.img, size: 76, className: "sc-pack" })), /* @__PURE__ */ React.createElement("span", { className: "sc-dots", "aria-hidden": "true" }, Array.from({ length: 9 }).map((_, i) => /* @__PURE__ */ React.createElement("i", { key: i }))), /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.net, className: "sc-money" }), /* @__PURE__ */ React.createElement("span", { className: "sc-cap" }, "recovered, nine stops of nine"), /* @__PURE__ */ React.createElement("dl", { className: "sc-rows" }, rows.map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, className: "sc-row" }, /* @__PURE__ */ React.createElement("dt", null, k), /* @__PURE__ */ React.createElement("dd", null, v)))))), /* @__PURE__ */ React.createElement("ul", { className: "cast", "aria-label": "The people in Munchly's batch" }, CAST.map((c) => {
      const p = D.PEOPLE[c.id];
      return /* @__PURE__ */ React.createElement("li", { key: c.id }, /* @__PURE__ */ React.createElement(Avatar, { person: p, size: "lg" }), /* @__PURE__ */ React.createElement("span", { className: "cast-text" }, /* @__PURE__ */ React.createElement("b", null, p.name), /* @__PURE__ */ React.createElement("span", null, c.role), /* @__PURE__ */ React.createElement("span", { className: "cast-did" }, c.did)));
    })), /* @__PURE__ */ React.createElement("p", { className: "fine" }, "Munchly Foods, its partners and its people are fictional. Every figure is worked out from the journey map.")));
  }
  const ISLANDS = [
    { id: "munchly", x: 0.233, y: 0.6, ly: 0.8, packs: ["pack-chips", "pack-mango"], url: "munchly.smartclearance.com", live: true },
    { id: "you", x: 0.574, y: 0.6, ly: 0.8, packs: ["sprout-box"], url: "your-company.smartclearance.com" },
    { id: "next", x: 0.805, y: 0.6, ly: 0.8, packs: ["sprout-box"], url: "your-brand.smartclearance.com", flip: true }
  ];
  const HUB = { x: 0.424, y: 0.78 }, ISL_AR = 3.4;
  const TEAMS = [
    { id: "supply", icon: "route", title: "Supply chain", line: "One tap to approve a plan, with the money on screen.", tag: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, "one tap") },
    { id: "finance", icon: "file-text", title: "Finance", line: "The invoice, the credit note and the GST memo, drafted.", tag: /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, "s.17(5)(h) memo") },
    { id: "esg", icon: "leaf", title: "Sustainability", line: "A BRSR line an auditor can follow back to the batch.", tag: /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, fmt.num(D.PLAN.kg), " kg kept") },
    { id: "dist", icon: "warehouse", title: "Distributors", line: "Nothing listed in their name without their permission.", tag: /* @__PURE__ */ React.createElement(Badge, { size: "sm", icon: "check" }, "one-time permission") }
  ];
  function Workspace() {
    const app = useApp();
    const swipe = app.bp !== "desktop";
    return /* @__PURE__ */ React.createElement("section", { id: "workspace", className: "sec sec-ws", "aria-labelledby": "ws-h" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("header", { className: "sec-head" }, /* @__PURE__ */ React.createElement("h2", { id: "ws-h", className: "sec-h" }, "Your own workspace, set up for your supply chain."), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, "Each manufacturer gets its own address, configured for how its stock really moves."))), /* @__PURE__ */ React.createElement("div", { className: "isl-pan", ...swipe ? { tabIndex: 0, role: "region", "aria-label": "Workspaces, one island each; scroll sideways" } : {} }, /* @__PURE__ */ React.createElement("figure", { className: "islands", style: { "--ar": ISL_AR } }, /* @__PURE__ */ React.createElement("img", { className: "isl-plate", src: IMG + "islands.webp", alt: "", loading: "lazy" }), ISLANDS.map((i) => /* @__PURE__ */ React.createElement("span", { key: i.id, className: cx("isl-packs", "isl-" + i.id), style: { "--x": i.x, "--y": i.y }, "aria-hidden": "true" }, i.packs.map((n) => /* @__PURE__ */ React.createElement(Product, { key: n, name: n, size: 160, className: cx("isl-pack", i.flip && "flip") })))), /* @__PURE__ */ React.createElement("span", { className: "isl-hub", style: { "--x": HUB.x, "--y": HUB.y }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Mark, { size: 52 })), /* @__PURE__ */ React.createElement("ul", { className: "isl-urls", "aria-label": "Workspace addresses" }, ISLANDS.map((i) => /* @__PURE__ */ React.createElement("li", { key: i.id, className: cx("isl-url", i.live && "live"), style: { "--x": i.x, "--y": i.ly } }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), i.url, i.live && /* @__PURE__ */ React.createElement("span", { className: "isl-live" }, " · live")))), /* @__PURE__ */ React.createElement("figcaption", { className: "sr-only" }, "Three islands over a miniature town, joined to Smart-Clearance by green paths: Munchly Foods' workspace, live with its packs, and two waiting for the next manufacturers."))), /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("ul", { className: "teams" }, TEAMS.map((t) => /* @__PURE__ */ React.createElement("li", { key: t.id }, /* @__PURE__ */ React.createElement("span", { className: "tm-head" }, /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: 20, className: "tm-icon" }), /* @__PURE__ */ React.createElement("b", null, t.title)), /* @__PURE__ */ React.createElement("span", { className: "tm-line" }, t.line), t.tag))), /* @__PURE__ */ React.createElement("div", { className: "conn" }, /* @__PURE__ */ React.createElement("span", { className: "conn-h" }, "Works with"), /* @__PURE__ */ React.createElement("ul", { className: "conn-list" }, P.CONNECTORS.map((c) => /* @__PURE__ */ React.createElement("li", { key: c.id, className: "chip" }, c.name, c.status === "soon" && /* @__PURE__ */ React.createElement("span", { className: "subtle" }, " · soon")))))));
  }
  function Plans({ onDemo }) {
    return /* @__PURE__ */ React.createElement("section", { id: "pricing", className: "sec sec-plans", "aria-labelledby": "plans-h" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("header", { className: "sec-head" }, /* @__PURE__ */ React.createElement("h2", { id: "plans-h", className: "sec-h" }, "Start with one distributor."), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, "A pilot runs on one distributor's stock for 90 days. Prices are set with each manufacturer.")), /* @__PURE__ */ React.createElement("ul", { className: "plans" }, P.PLANS.map((p) => /* @__PURE__ */ React.createElement("li", { key: p.id, className: "plan" }, /* @__PURE__ */ React.createElement("b", { className: "plan-name" }, p.name), /* @__PURE__ */ React.createElement("ul", { className: "plan-scope" }, p.scope.map((s) => /* @__PURE__ */ React.createElement("li", { key: s }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 }), s.replace(/^The client's /, "Your ")))), /* @__PURE__ */ React.createElement("span", { className: "plan-foot" }, /* @__PURE__ */ React.createElement("span", null, "Prices on request"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link", onClick: () => onDemo(p.name) }, "Talk to us", /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, " about ", p.name))))))));
  }
  function Close({ onDemo }) {
    return /* @__PURE__ */ React.createElement("section", { className: "close", "aria-labelledby": "close-h" }, /* @__PURE__ */ React.createElement("img", { className: "close-plate", src: IMG + "dusk.webp", alt: "", loading: "lazy" }), /* @__PURE__ */ React.createElement("div", { className: "close-copy" }, /* @__PURE__ */ React.createElement("h2", { id: "close-h", className: "close-h" }, "Give your next batch a second chance."), /* @__PURE__ */ React.createElement("div", { className: "close-ctas" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: () => onDemo() }, "Book a demo"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-secondary", ...linkProps(LINKS.demo) }, "Watch the 6-minute demo"))));
  }
  function Footer({ onFind }) {
    const { mode, setMode } = useTheme();
    const cols = [
      ["Product", SECTIONS.filter(([id]) => id !== "customers").map(([id, t]) => /* @__PURE__ */ React.createElement("a", { key: id, href: "#" + id }, t))],
      ["Customers", [/* @__PURE__ */ React.createElement("a", { key: "munchly", href: "#customers" }, "Munchly Foods")]],
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
  function Site() {
    const [find, setFind] = useState(false);
    const [demo, setDemo] = useState(null);
    const [siteEl, setSiteEl] = useState(null);
    const siteRef = React.useMemo(() => siteEl ? { current: siteEl } : null, [siteEl]);
    useEffect(() => {
      document.title = "Smart-Clearance";
    }, []);
    const onDemo = (plan) => setDemo({ plan: typeof plan === "string" ? plan : null });
    return /* @__PURE__ */ React.createElement(ScrollCtx.Provider, { value: siteRef }, /* @__PURE__ */ React.createElement("div", { className: "site", id: "top", ref: setSiteEl }, /* @__PURE__ */ React.createElement(Nav, { onFind: () => setFind(true), onDemo }), /* @__PURE__ */ React.createElement("main", null, /* @__PURE__ */ React.createElement(Hero, { onFind: () => setFind(true) }), /* @__PURE__ */ React.createElement(Exits, null), /* @__PURE__ */ React.createElement(Stops, null), /* @__PURE__ */ React.createElement(Story, null), /* @__PURE__ */ React.createElement(Workspace, null), /* @__PURE__ */ React.createElement(Plans, { onDemo }), /* @__PURE__ */ React.createElement(Close, { onDemo })), /* @__PURE__ */ React.createElement(Footer, { onFind: () => setFind(true) }), /* @__PURE__ */ React.createElement(S.FindWorkspace, { open: find, onClose: () => setFind(false), onUse: () => {
      setFind(false);
      open(LINKS.app);
    } }), /* @__PURE__ */ React.createElement(DemoSheet, { open: !!demo, plan: demo && demo.plan, onClose: () => setDemo(null) })));
  }
  function Root() {
    return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "site-root", style: { position: "fixed", inset: 0 } }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(Site, null))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
})();

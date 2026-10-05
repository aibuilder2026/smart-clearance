(function() {
  const { useState, useEffect, useLayoutEffect, useRef } = React;
  const { useReducedMotion, motion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, P = window.SC3_PLATFORM;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Button, Badge, Sheet, Field, Input, Select, Textarea, Menu, Mark, Wordmark, Money, Roll, GateChips, Product, Segmented, ModeMenuButton, ThemeProvider, AppRoot, NoticeHost, useApp, useTheme } = K;
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
  const BATCH = D.BATCHES.find((b) => b.hero), DIST = D.DISTRIBUTORS[BATCH.distributor];
  const SHOPS = D.KIRANAS.length, BIN = D.PLAN.writeOff.total, ES_NET = AW.gross - ESL.cost;
  const rate = (v) => Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v);
  const SECTIONS = [["how", "How it works"], ["agents", "Agents"], ["teams", "For teams"], ["pricing", "Pricing"]];
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
      "-",
      { label: "Smart-Clearance staff", icon: "shield", onClick: () => open(LINKS.console) }
    ];
    return /* @__PURE__ */ React.createElement("header", { className: "site-nav" }, /* @__PURE__ */ React.createElement("a", { className: "nav-brand", href: "#top", "aria-label": "Smart-Clearance, back to the top" }, /* @__PURE__ */ React.createElement("span", { className: "nav-mark" }, /* @__PURE__ */ React.createElement(Mark, { size: 36 })), /* @__PURE__ */ React.createElement(Wordmark, { size: 15 })), app.bp === "desktop" && /* @__PURE__ */ React.createElement("nav", { className: "nav-links", "aria-label": "Sections" }, SECTIONS.map(([id, t]) => /* @__PURE__ */ React.createElement("a", { key: id, href: "#" + id }, t))), /* @__PURE__ */ React.createElement("span", { className: "grow" }), /* @__PURE__ */ React.createElement("span", { className: "nav-mode" }, /* @__PURE__ */ React.createElement(ModeMenuButton, null)), /* @__PURE__ */ React.createElement("span", { className: "nav-signin" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "nav-text", "aria-haspopup": "menu", "aria-expanded": menu, onClick: () => setMenu((m) => !m) }, "Sign in"), /* @__PURE__ */ React.createElement(Menu, { open: menu, onClose: () => setMenu(false), items: signInItems, width: 268, label: "Sign in to" })), app.bp !== "phone" ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", pill: true, className: "nav-demo", onClick: () => onDemo() }, "Book a demo") : /* @__PURE__ */ React.createElement(IconButton, { icon: "menu", label: "Menu", onClick: () => setSheet(true) }), /* @__PURE__ */ React.createElement(Sheet, { open: sheet, onClose: () => setSheet(false), title: "Smart-Clearance", side: "bottom", detent: "medium" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "list" }, SECTIONS.map(([id, t]) => /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: "list-row", onClick: () => {
      setSheet(false);
      setTimeout(() => goTo(id), 60);
    } }, /* @__PURE__ */ React.createElement("span", { className: "lr-main" }, /* @__PURE__ */ React.createElement("span", { className: "lr-title" }, t)), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "chev" })))), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, onClick: () => {
      setSheet(false);
      onDemo();
    } }, "Book a demo"))));
  }
  const { Town } = window.SC3_TOWN;
  function Hero({ onFind }) {
    return /* @__PURE__ */ React.createElement("section", { className: "hero", id: "agents", "aria-labelledby": "hero-h" }, /* @__PURE__ */ React.createElement("div", { className: "hero-frame" }, /* @__PURE__ */ React.createElement("div", { className: "hero-copy" }, /* @__PURE__ */ React.createElement("h1", { id: "hero-h", className: "hero-h" }, "Every near-expiry carton gets a second chance."), /* @__PURE__ */ React.createElement("p", { className: "hero-sub" }, "AI agents find the best exit for short-dated stock. You say yes once."), /* @__PURE__ */ React.createElement("div", { className: "hero-ctas" }, /* @__PURE__ */ React.createElement("a", { className: "btn btn-primary", ...linkProps(LINKS.demo) }, "Watch the 6-minute demo"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: onFind }, "Find your workspace"))), /* @__PURE__ */ React.createElement("div", { className: "hero-stage" }, /* @__PURE__ */ React.createElement(Town, null))));
  }
  const agentsAt = (...stages) => P.AGENTS.filter((a) => !a.gate && stages.includes(a.stage)).map((a) => a.name);
  const EASE = [0.22, 1, 0.36, 1];
  const SKU = D.SKUS[BATCH.sku], SCHEME = M.RULES.scheme;
  const row = (id) => D.PLAN.rows.find((r) => r.id === id);
  const planned = (id) => D.PLAN.lines.some((l) => l.id === id);
  function useRise() {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const inView = Motion.useInView(ref, { once: true, amount: 0.3 });
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
  function AlertCard() {
    const { shown, card, rise } = useRise();
    const rolled = useLit(shown, 1, 490, 0) > 0;
    return /* @__PURE__ */ React.createElement(motion.div, { className: "m-card", role: "group", "aria-label": "The Watcher's alert", ...card }, /* @__PURE__ */ React.createElement(motion.div, { className: "m-head", ...rise(0) }, /* @__PURE__ */ React.createElement("span", { className: "chip-agent on" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Watcher · 09:00"), /* @__PURE__ */ React.createElement(Badge, { tone: "red", dot: true }, "At risk")), /* @__PURE__ */ React.createElement(motion.div, { className: "m-batch", ...rise(1) }, /* @__PURE__ */ React.createElement(Product, { name: "pack-snack-plain", size: 52 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, SKU.name), /* @__PURE__ */ React.createElement("span", null, fmt.num(BATCH.units), " packs in a distributor's godown, ", DIST.city))), /* @__PURE__ */ React.createElement(motion.div, { className: "m-gates", ...rise(2) }, /* @__PURE__ */ React.createElement(GateChips, { gates: D.RISK.gates })), /* @__PURE__ */ React.createElement(motion.div, { className: "m-big", ...rise(3) }, /* @__PURE__ */ React.createElement("span", { className: "num" }, /* @__PURE__ */ React.createElement(Roll, { key: rolled ? "on" : "off", value: D.RISK.atRisk, from: rolled ? 0 : void 0 })), /* @__PURE__ */ React.createElement("span", null, "packs won't sell in the ", BATCH.daysLeft, " days they have left")));
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
    return /* @__PURE__ */ React.createElement(motion.div, { className: "m-card", role: "group", "aria-label": "The Valuer's prices, net a pack", ...card }, /* @__PURE__ */ React.createElement(motion.div, { className: "m-head", ...rise(0) }, /* @__PURE__ */ React.createElement("span", { className: "chip-agent on" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Valuer"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "net a pack, after costs")), PRICED.map((p, i) => /* @__PURE__ */ React.createElement(motion.div, { key: p.id, className: cx("m-row", p.dot === "bin" ? "bin" : !planned(p.id) && "off"), ...rise(i + 1) }, /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot " + (p.dot || p.id), "aria-hidden": "true" }), p.name), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmt.inr2(row(p.id).net)), /* @__PURE__ */ React.createElement("span", { className: "s" }, p.s))), /* @__PURE__ */ React.createElement(motion.div, { ...rise(PRICED.length + 1) }, /* @__PURE__ */ React.createElement("div", { className: "m-split-cap" }, /* @__PURE__ */ React.createElement("span", null, "The Router's split"), /* @__PURE__ */ React.createElement("span", null, fmt.num(D.RISK.atRisk), " packs")), /* @__PURE__ */ React.createElement("div", { className: "m-split", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "k", style: { flexGrow: KL.units } }), /* @__PURE__ */ React.createElement("span", { className: "e", style: { flexGrow: ESL.units } })), /* @__PURE__ */ React.createElement("div", { className: "m-split-legend" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "ex-dot kirana", "aria-hidden": "true" }), fmt.num(KL.units), " to ", SHOPS, " kiranas"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "ex-dot expiresoon", "aria-hidden": "true" }), fmt.num(ESL.units), " on ExpireSoon"))));
  }
  const RELEASED = agentsAt("execute", "settle", "report");
  function PlanCard() {
    const { shown, card, rise } = useRise();
    const rolled = useLit(shown, 1, 270, 0) > 0;
    const lit = useLit(shown, RELEASED.length, 900, 220);
    return /* @__PURE__ */ React.createElement(motion.div, { className: "m-card yes", role: "group", "aria-label": "The plan, waiting for one yes", ...card }, /* @__PURE__ */ React.createElement(motion.div, { className: "m-head", ...rise(0) }, /* @__PURE__ */ React.createElement("b", null, "Approve the plan"), /* @__PURE__ */ React.createElement(Badge, { tone: "amber", dot: true }, "Waiting for you")), /* @__PURE__ */ React.createElement(motion.div, { className: "m-big flush", ...rise(1) }, /* @__PURE__ */ React.createElement(Money, { key: rolled ? "on" : "off", value: D.PLAN.net, roll: true, from: rolled ? 0 : void 0 }), /* @__PURE__ */ React.createElement("span", null, "recovered, against ", fmt.inr(-BIN), " to destroy it")), /* @__PURE__ */ React.createElement(motion.div, { className: "m-row", ...rise(2) }, /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot kirana", "aria-hidden": "true" }), fmt.num(KL.units), " packs to ", SHOPS, " kiranas"), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmt.inr(KL.net))), /* @__PURE__ */ React.createElement(motion.div, { className: "m-row", ...rise(3) }, /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot expiresoon", "aria-hidden": "true" }), fmt.num(ESL.units), " packs on ExpireSoon"), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmt.inr(ESL.net))), /* @__PURE__ */ React.createElement(motion.div, { className: "m-go", ...rise(4) }, /* @__PURE__ */ React.createElement("span", { className: "btn btn-approve btn-lg" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 18 }), "Approve · release the agents")), /* @__PURE__ */ React.createElement(motion.div, { className: "m-after", ...rise(5) }, RELEASED.map((w, i) => /* @__PURE__ */ React.createElement("span", { key: w, className: cx("chip-agent", i < lit && "on") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), w))));
  }
  const MOMENTS = [
    {
      t: "Spot it while there is time to sell",
      art: "godown-plain",
      who: agentsAt("connect", "detect", "verify"),
      Card: AlertCard,
      text: "Every morning at 09:00 the Watcher checks each batch against its date and the quick-commerce shelf-life rules, and flags the stock that won't sell in time. Vision reads the label photo from the godown to be sure."
    },
    {
      t: "Price every exit, the bin included",
      art: "kirana-plain",
      who: agentsAt("value", "decide"),
      Card: PricesCard,
      text: `Kiranas on a ${SCHEME.free}-free-with-${SCHEME.buy} scheme, a clearance marketplace, a staff sale at the godown, a food bank: the Valuer prices each exit against the true cost of destroying the stock, and the Router splits the batch within each exit's limits.`
    },
    {
      t: "Say yes once. The agents do the rest.",
      art: "documents",
      yes: true,
      who: ["a person"].concat(RELEASED),
      Card: PlanCard,
      text: "A person approves the plan with the money on screen; nothing is listed, messaged or shipped before that tap. Then the agents list the lot, send kirana offers in Hindi, answer bids, draft the invoice, credit note and GST memo, and post the impact."
    }
  ];
  function How() {
    return /* @__PURE__ */ React.createElement("section", { id: "how", className: "sec sec-how", "aria-labelledby": "how-h" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("header", { className: "sec-head" }, /* @__PURE__ */ React.createElement("h2", { id: "how-h", className: "sec-h plain" }, "How Smart‑Clearance works"), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, "It watches the stock in your distributors' godowns. When a batch won't sell before its date, its agents find the exit that recovers the most and do the work, once a person says yes.")), /* @__PURE__ */ React.createElement("ol", { className: "moments" }, MOMENTS.map((m, i) => /* @__PURE__ */ React.createElement("li", { key: m.t, className: cx("moment", i % 2 === 1 && "flip") }, /* @__PURE__ */ React.createElement("div", { className: "m-copy" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: cx("step-n", m.yes && "yes"), "aria-hidden": "true" }, i + 1), /* @__PURE__ */ React.createElement("h3", null, m.t)), /* @__PURE__ */ React.createElement("p", null, m.text), /* @__PURE__ */ React.createElement("span", { className: "agents" }, m.who.map((w, j) => /* @__PURE__ */ React.createElement("span", { key: w, className: cx("chip-agent on", m.yes && j === 0 && "person") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), w)))), /* @__PURE__ */ React.createElement("div", { className: "m-stage" }, /* @__PURE__ */ React.createElement(Product, { name: m.art, size: 124, className: "m-art" }), /* @__PURE__ */ React.createElement(m.Card, null)))))));
  }
  const N = D.RISK.atRisk;
  const EXITS = [
    {
      id: "kirana",
      name: "Kiranas",
      x: 0.35,
      packs: KL.units,
      taken: true,
      art: "kirana-plain",
      total: KL.net,
      per: `${rate(row("kirana").net)} a pack, after the van`,
      line: (n) => `${fmt.num(n)} packs · ${SHOPS} shops`
    },
    {
      id: "expiresoon",
      name: "ExpireSoon",
      x: 0.515,
      packs: AW.units,
      taken: true,
      art: "marketplace-bag",
      total: ES_NET,
      per: `${rate(AW.price)} a pack, countered from ${rate(ESL.price)}`,
      line: (n) => `${fmt.num(n)} packs · ${rate(AW.price)}`
    },
    {
      id: "staff",
      name: "Staff sale",
      x: 0.65,
      packs: 0,
      art: "godown-plain",
      note: "priced, not needed",
      per: `${rate(row("staff").net)} a pack, up to ${row("staff").capacity} packs`
    },
    {
      id: "foodbank",
      name: "Food bank",
      x: 0.785,
      packs: 0,
      art: "donation-crate",
      note: "priced, not needed",
      per: `${rate(row("foodbank").net)} a pack: a donation reverses the GST credit`
    },
    {
      id: "bin",
      name: "The bin",
      x: 0.93,
      packs: 0,
      bin: true,
      art: "bin-plain",
      total: -BIN,
      note: "not taken",
      per: `${rate(-D.PLAN.writeOff.perUnit)} a pack`
    }
  ];
  const TAKEN = EXITS.filter((e) => e.taken);
  const PW = 4256, PH = 992, DOOR = { x: 610, y: 690 }, ROAD = 812, FRONT = 646, HEAP = 742, EX_AR = PW / PH;
  const exX = (e) => Math.round(e.x * PW), endY = (e) => e.bin ? HEAP : FRONT;
  const OUT = `M${DOOR.x} ${DOOR.y} C${DOOR.x + 30} ${ROAD - 40} ${DOOR.x + 120} ${ROAD} ${DOOR.x + 260} ${ROAD}`;
  const TRUNK = `${OUT} L${exX(EXITS[4]) - 110} ${ROAD}`;
  const turn = (e) => {
    const x = exX(e);
    return ` Q${x} ${ROAD} ${x} ${ROAD - 100} L${x} ${endY(e)}`;
  };
  const spur = (e) => `M${exX(e) - 110} ${ROAD}${turn(e)}`;
  const route = (e) => `${OUT} L${exX(e) - 110} ${ROAD}${turn(e)}`;
  const DOT = 50, DOTS = [];
  {
    const k = Math.round(TAKEN[0].packs / DOT), n = k + Math.round(TAKEN[1].packs / DOT);
    let sent = 0;
    for (let i = 0; i < n; i++) {
      const toK = sent < Math.round((i + 1) * k / n);
      DOTS.push(toK ? TAKEN[0] : TAKEN[1]);
      if (toK) sent += 1;
    }
  }
  const dotsTo = (id) => DOTS.filter((d) => d.id === id).length;
  const NONE = { kirana: 0, expiresoon: 0 }, ALL = Object.fromEntries(TAKEN.map((e) => [e.id, e.packs]));
  function Flow({ stage, left, reduce, dots, routes }) {
    const drawn = stage !== "wait";
    const t = (duration, delay = 0) => reduce ? { duration: 0 } : { duration, delay, ease: EASE };
    return /* @__PURE__ */ React.createElement("div", { className: cx("flow-layer", stage), "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${PW} ${PH}`, preserveAspectRatio: "none" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("filter", { id: "fl-glow", x: "-20%", y: "-60%", width: "140%", height: "220%" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "14" }))), /* @__PURE__ */ React.createElement(motion.path, { className: "fl-glow", d: TRUNK, initial: false, animate: { opacity: drawn ? 1 : 0 }, transition: t(0.6) }), /* @__PURE__ */ React.createElement(motion.path, { className: "fl-trunk", d: TRUNK, initial: false, animate: { pathLength: drawn ? 1 : 0 }, transition: t(0.7) }), EXITS.map((e, i) => e.taken ? /* @__PURE__ */ React.createElement(motion.path, { key: e.id, className: "fl-spur " + e.id, d: spur(e), initial: false, animate: { pathLength: drawn ? 1 : 0 }, transition: t(0.35, 0.3 + i * 0.12) }) : /* @__PURE__ */ React.createElement(motion.path, { key: e.id, className: "fl-spur none " + e.id, d: spur(e), initial: false, animate: { opacity: drawn ? 1 : 0 }, transition: t(0.4, 0.5 + i * 0.08) })), EXITS.map((e) => /* @__PURE__ */ React.createElement("circle", { key: "at" + e.id, className: cx("fl-drop", e.id, e.taken && "taken"), cx: exX(e), cy: endY(e), r: e.taken ? 30 : 24 })), /* @__PURE__ */ React.createElement("path", { className: "fl-x", d: `M${exX(EXITS[4]) - 15} ${HEAP - 15} l30 30 m0 -30 l-30 30` }), TAKEN.map((e) => /* @__PURE__ */ React.createElement("path", { key: "way" + e.id, ref: (el) => {
      routes.current[e.id] = el;
    }, d: route(e), fill: "none", stroke: "none" })), DOTS.map((e, i) => /* @__PURE__ */ React.createElement("circle", { key: i, ref: (el) => {
      dots.current[i] = el;
    }, className: "fl-dot " + e.id, r: "22", cx: DOOR.x, cy: DOOR.y, opacity: "0" }))), /* @__PURE__ */ React.createElement("div", { className: "fl-tag", style: { left: DOOR.x / PW * 100 + "%" } }, /* @__PURE__ */ React.createElement("b", null, fmt.num(left)), /* @__PURE__ */ React.createElement("span", null, left ? " packs at the godown" : " packs left at the godown")));
  }
  function Split({ boxRef, drawn, reduce, run }) {
    const svg = useRef(null), src = useRef(null), rows = useRef([]);
    const [geo, setGeo] = useState(null);
    React.useLayoutEffect(() => {
      const measure = () => {
        const s = svg.current, b = src.current;
        if (!s || !b || getComputedStyle(s).display === "none") {
          setGeo(null);
          return;
        }
        const r = s.getBoundingClientRect(), br = b.getBoundingClientRect();
        const band = Math.min(150, br.height * 0.8);
        let y0 = br.top + br.height / 2 - band / 2 - r.top;
        setGeo({ w: r.width, h: r.height, rows: EXITS.map((e, i) => {
          const q = rows.current[i].getBoundingClientRect(), t2 = e.packs / N * band, g = { e, a: y0, t: t2, cy: q.top + q.height / 2 - r.top };
          y0 += t2;
          return g;
        }) });
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(boxRef.current);
      return () => ro.disconnect();
    }, []);
    const t = (duration, delay) => reduce ? { duration: 0 } : { duration, delay, ease: EASE };
    const ribbon = (g) => {
      const c = geo.w * 0.55, h = g.t / 2, ya = g.a + h;
      return `M12 ${ya - h} C${c} ${ya - h} ${c} ${g.cy - h} ${geo.w} ${g.cy - h} L${geo.w} ${g.cy + h} C${c} ${g.cy + h} ${c} ${ya + h} 12 ${ya + h} Z`;
    };
    const thread = (g) => {
      const c = geo.w * 0.55;
      return `M12 ${g.a} C${c} ${g.a} ${c} ${g.cy} ${geo.w} ${g.cy}`;
    };
    return /* @__PURE__ */ React.createElement("div", { className: "split", ref: boxRef, role: "group", "aria-label": "Where the batch went" }, /* @__PURE__ */ React.createElement("div", { className: "split-src", ref: src }, /* @__PURE__ */ React.createElement(Product, { name: "pack-snack-plain", size: 72 }), /* @__PURE__ */ React.createElement("span", { className: "split-n" }, fmt.num(N)), /* @__PURE__ */ React.createElement("span", { className: "split-cap" }, "packs of masala chips with ", BATCH.daysLeft, " days left, at the distributor's godown")), /* @__PURE__ */ React.createElement("svg", { className: "split-svg", ref: svg, "aria-hidden": "true", viewBox: geo ? `0 0 ${geo.w} ${geo.h}` : "0 0 1 1", preserveAspectRatio: "none" }, geo && /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("clipPath", { id: "sp-wipe" }, /* @__PURE__ */ React.createElement(motion.rect, { key: "w" + run, x: "0", y: "0", height: geo.h, initial: reduce ? false : { width: 0 }, animate: { width: drawn ? geo.w : 0 }, transition: t(1.1, 0.2) }))), geo && /* @__PURE__ */ React.createElement("g", { clipPath: "url(#sp-wipe)" }, geo.rows.map((g) => /* @__PURE__ */ React.createElement("path", { key: g.e.id, className: cx(g.e.packs ? "sp-band" : "sp-none", g.e.id), d: g.e.packs ? ribbon(g) : thread(g) }))), geo && geo.rows.filter((g) => g.e.packs).map((g) => /* @__PURE__ */ React.createElement("rect", { key: "src" + g.e.id, className: "sp-src " + g.e.id, x: "0", y: g.a, width: "12", height: g.t }))), /* @__PURE__ */ React.createElement("ol", { className: "split-rows" }, EXITS.map((e, i) => /* @__PURE__ */ React.createElement("li", { key: e.id, ref: (el) => {
      rows.current[i] = el;
    }, className: cx("split-row", e.id, e.taken ? "taken" : "none", e.bin && "bin") }, /* @__PURE__ */ React.createElement(Product, { name: e.art, size: 52, className: "sr-art" }), /* @__PURE__ */ React.createElement("span", { className: "sr-main" }, /* @__PURE__ */ React.createElement("b", null, e.name), /* @__PURE__ */ React.createElement("span", null, e.taken ? `${fmt.num(e.packs)} packs · ${e.per}` : e.per), /* @__PURE__ */ React.createElement("span", { className: "sr-share", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(motion.i, { key: "s" + run, initial: reduce ? false : { scaleX: 0 }, animate: { scaleX: drawn ? e.packs / N : 0 }, transition: t(0.7, 0.3 + i * 0.12) }))), /* @__PURE__ */ React.createElement(motion.span, { key: "v" + run, className: "sr-v", initial: reduce || !e.taken ? false : { opacity: 0, y: 6 }, animate: { opacity: drawn || !e.taken ? 1 : 0, y: drawn || !e.taken ? 0 : 6 }, transition: t(0.4, 1 + i * 0.12) }, e.taken ? fmt.inr(e.total) : e.bin ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "sr-no" }, e.note), /* @__PURE__ */ React.createElement("span", { className: "sr-cost" }, fmt.inr(e.total), " if destroyed")) : /* @__PURE__ */ React.createElement("span", { className: "sr-no" }, e.note))))));
  }
  function Exits() {
    const app = useApp();
    const reduce = useReducedMotion();
    const night = useTheme().resolved === "dark";
    const swipe = app.bp !== "desktop";
    const pan = useRef(null), split = useRef(null), dots = useRef([]), routes = useRef({});
    const streetSeen = Motion.useInView(pan, { once: true, amount: 0.9 }), splitSeen = Motion.useInView(split, { once: true, amount: 0.4 });
    const [run, setRun] = useState(0), [stage, setStage] = useState(reduce ? "done" : "wait"), [left, setLeft] = useState(reduce ? 0 : N);
    const [got, setGot] = useState(reduce ? ALL : NONE), [splitRun, setSplitRun] = useState(reduce ? 0 : -1);
    useEffect(() => {
      if (reduce) {
        setStage("done");
        setLeft(0);
        setGot(ALL);
      }
    }, [reduce]);
    useEffect(() => {
      const el = pan.current, li = el && el.querySelector(".ex-chips > li"), fig = el && el.querySelector(".ex-pano");
      if (!swipe || !li || !fig) return;
      el.scrollLeft = reduce ? Math.max(0, fig.offsetLeft + li.offsetLeft - el.clientWidth / 2) : 0;
    }, [swipe, reduce]);
    useEffect(() => {
      if (reduce || !streetSeen) return;
      setStage("play");
      setLeft(N);
      setGot(NONE);
      const controls = [], timers = [], arrived = { ...NONE }, el = pan.current, fig = el && el.querySelector(".ex-pano");
      const x0 = fig ? fig.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft : 0;
      let gone = 0, lead = 0;
      DOTS.forEach((e, i) => {
        const path = routes.current[e.id], c = dots.current[i];
        if (!path || !c) return;
        const L = path.getTotalLength(), delay = 0.55 + i * 0.105, duration = 0.42 + L / 5200;
        timers.push(setTimeout(() => {
          gone += 1;
          setLeft(Math.round(N * (1 - gone / DOTS.length)));
        }, delay * 1e3));
        controls.push(Motion.animate(0, 1, {
          duration,
          delay,
          ease: [0.45, 0, 0.4, 1],
          onUpdate: (v) => {
            const pt = path.getPointAtLength(v * L);
            c.setAttribute("cx", pt.x);
            c.setAttribute("cy", pt.y);
            c.setAttribute("opacity", v < 0.05 ? v * 20 : v > 0.93 ? Math.max(0, (1 - v) * 14) : 1);
            if (fig && el.scrollWidth > el.clientWidth + 4 && pt.x > lead) {
              lead = pt.x;
              el.scrollLeft = Math.max(0, x0 + pt.x / PW * fig.clientWidth - el.clientWidth * 0.6);
            }
          },
          onComplete: () => {
            arrived[e.id] += 1;
            setGot(Object.fromEntries(TAKEN.map((x) => [x.id, Math.round(x.packs * arrived[x.id] / dotsTo(x.id))])));
            if (arrived.kirana + arrived.expiresoon === DOTS.length) setStage("done");
          }
        }));
      });
      return () => {
        controls.forEach((c) => c.stop());
        timers.forEach(clearTimeout);
      };
    }, [streetSeen, run, reduce]);
    useEffect(() => {
      if (reduce) {
        setSplitRun(run);
        return;
      }
      if (splitSeen && splitRun !== run && stage !== "play") setSplitRun(run);
    }, [splitSeen, stage, run, reduce]);
    const replay = () => {
      setStage("play");
      setLeft(N);
      setGot(NONE);
      setRun((r) => r + 1);
    };
    const results = [
      { n: /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.net, className: "r-n" }), l: "recovered", w: `${fmt.inr(KL.net)} from ${SHOPS} kiranas, after the van, and ${fmt.inr(ES_NET)} from a marketplace buyer, after the listing fee` },
      { n: /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.swing, className: "r-n" }), l: "better than the bin", w: `${fmt.inr(D.ACTUAL.pnl)} on the brand's books with the plan, price support included, against ${fmt.inr(-BIN)} to destroy it` },
      { n: /* @__PURE__ */ React.createElement("span", { className: "num r-n" }, "0"), l: "cartons destroyed", w: `${fmt.num(D.PLAN.soldUnits)} packs sold on tax invoices, so the ${fmt.inr(D.PLAN.itcRetained)} GST credit stays` }
    ];
    return /* @__PURE__ */ React.createElement("section", { id: "exits", className: "sec sec-exits", "aria-labelledby": "exits-h" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("header", { className: "sec-head" }, /* @__PURE__ */ React.createElement("h2", { id: "exits-h", className: "sec-h" }, "Five exits, one batch"), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, "One batch: ", fmt.num(N), " packs of masala chips that won't sell in the ", BATCH.daysLeft, " days they have left. The agents priced every exit, the bin included, and sent the packs where they recover the most."))), /* @__PURE__ */ React.createElement("div", { className: "ex-body" }, /* @__PURE__ */ React.createElement("div", { ref: pan, className: "ex-pan", ...swipe ? { tabIndex: 0, role: "region", "aria-label": "The street from the godown to the bin; scroll sideways" } : {} }, /* @__PURE__ */ React.createElement("figure", { className: "ex-pano", style: { "--ar": EX_AR } }, /* @__PURE__ */ React.createElement("img", { src: IMG + (night ? "exits-night.webp" : "exits.webp"), alt: `One miniature street from end to end${night ? " at night" : ""}: the distributor's godown, two kirana shops hung with snack packets, a general store, more small shops, a van, and a smouldering rubbish heap at the far end.` }), /* @__PURE__ */ React.createElement(Flow, { stage, left, reduce, dots, routes }), /* @__PURE__ */ React.createElement("ul", { className: "ex-chips" }, EXITS.map((e) => /* @__PURE__ */ React.createElement("li", { key: e.id, style: { "--x": e.x } }, /* @__PURE__ */ React.createElement("span", { className: cx("ex-chip", e.id, e.taken && "taken", e.bin && "bin", e.taken && got[e.id] > 0 && "in") }, /* @__PURE__ */ React.createElement("span", { className: "ex-name" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot " + e.id, "aria-hidden": "true" }), e.name, e.taken && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 14, stroke: 2.6, className: "ex-took" })), e.taken ? /* @__PURE__ */ React.createElement("span", { className: "ex-line" }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, e.line(got[e.id])), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, e.line(e.packs))) : /* @__PURE__ */ React.createElement("span", { className: "ex-line" }, e.bin ? `${fmt.inr(-BIN)} · ${e.note}` : e.note))))))), /* @__PURE__ */ React.createElement("div", { className: "flow-key" }, /* @__PURE__ */ React.createElement("span", { className: "fk-dots", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", { className: "kirana" }), /* @__PURE__ */ React.createElement("i", { className: "expiresoon" })), /* @__PURE__ */ React.createElement("p", null, "Each dot is about ", DOT, " packs: green to ", SHOPS, " kiranas, violet to one buyer on ExpireSoon. The staff sale and the food bank were priced and not needed, and nothing went to the bin."), !reduce && /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: replay }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16 }), stage === "wait" ? "Send the batch" : "Send the batch again"))), /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement(Split, { boxRef: split, drawn: splitRun === run, reduce, run }), /* @__PURE__ */ React.createElement("div", { className: "results", role: "group", "aria-label": "What the batch came to" }, results.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.l, className: "result" }, r.n, /* @__PURE__ */ React.createElement("span", { className: "r-l" }, r.l), /* @__PURE__ */ React.createElement("span", { className: "r-w" }, r.w)))), /* @__PURE__ */ React.createElement("p", { className: "results-note" }, "An illustrative batch. Every figure is worked out from the journey map.")));
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
  function Close({ onDemo }) {
    return /* @__PURE__ */ React.createElement("section", { className: "close", "aria-labelledby": "close-h" }, /* @__PURE__ */ React.createElement("div", { className: "close-copy" }, /* @__PURE__ */ React.createElement("h2", { id: "close-h", className: "close-h" }, "Give your next batch a second chance."), /* @__PURE__ */ React.createElement("div", { className: "close-ctas" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", onClick: () => onDemo() }, "Book a demo"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-secondary", ...linkProps(LINKS.demo) }, "Watch the 6-minute demo"))), /* @__PURE__ */ React.createElement("img", { className: "close-plate", src: IMG + "dusk.webp", width: "4128", height: "1024", alt: "", loading: "lazy" }));
  }
  function Footer({ onFind }) {
    const { mode, setMode } = useTheme();
    const cols = [
      ["Product", SECTIONS.map(([id, t]) => /* @__PURE__ */ React.createElement("a", { key: id, href: "#" + id }, t))],
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
    useEffect(() => {
      document.title = "Smart-Clearance";
    }, []);
    const onDemo = (plan) => setDemo({ plan: typeof plan === "string" ? plan : null });
    return /* @__PURE__ */ React.createElement("div", { className: "site", id: "top" }, /* @__PURE__ */ React.createElement(Nav, { onFind: () => setFind(true), onDemo }), /* @__PURE__ */ React.createElement("main", null, /* @__PURE__ */ React.createElement(Hero, { onFind: () => setFind(true) }), /* @__PURE__ */ React.createElement(How, null), /* @__PURE__ */ React.createElement(Exits, null), /* @__PURE__ */ React.createElement(Workspace, null), /* @__PURE__ */ React.createElement(Plans, { onDemo }), /* @__PURE__ */ React.createElement(Close, { onDemo })), /* @__PURE__ */ React.createElement(Footer, { onFind: () => setFind(true) }), /* @__PURE__ */ React.createElement(S.FindWorkspace, { open: find, onClose: () => setFind(false), onUse: () => {
      setFind(false);
      open(LINKS.app);
    }, note: "One manufacturer's workspace is set up in this prototype." }), /* @__PURE__ */ React.createElement(DemoSheet, { open: !!demo, plan: demo && demo.plan, onClose: () => setDemo(null) }));
  }
  function Root() {
    return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "site-root", style: { position: "fixed", inset: 0 } }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(Site, null))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
})();

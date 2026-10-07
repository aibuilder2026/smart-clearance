(function() {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo } = React;
  const { useReducedMotion, motion, useScroll, useTransform, useInView, AnimatePresence, animate } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, P = window.SC3_PLATFORM;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Button, Badge, Sheet, Field, Input, Select, Textarea, Menu, Mark, Wordmark, Money, Roll, GateChips, Product, Segmented, ModeMenuButton, ThemeProvider, AppRoot, NoticeHost, useApp, useTheme } = K;
  const IMG = window.SC3_SITE_IMG || "assets/plates/", MEDIA = window.SC3_SITE_MEDIA || "assets/media/";
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
  const BATCH = D.BATCHES.find((b) => b.hero), DIST = D.DISTRIBUTORS[BATCH.distributor], SKU = D.SKUS[BATCH.sku];
  const SHOPS = D.KIRANAS.length, BIN = D.PLAN.writeOff.total, ES_NET = AW.gross - ESL.cost, N = D.RISK.atRisk;
  const row = (id) => D.PLAN.rows.find((r) => r.id === id);
  const planned = (id) => D.PLAN.lines.some((l) => l.id === id);
  const rate = (v) => Math.abs(v % 1) < 1e-9 ? fmt.inr(v) : fmt.inr2(v);
  const SCHEME = M.RULES.scheme, BID = 13;
  const BEST_BEFORE = (/* @__PURE__ */ new Date(BATCH.bestBefore + "T00:00:00")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const OFFER = { title: D.PUSH.offer.title, body: `नमस्ते! ${SKU.name} पर आज खास ऑफर: ${SCHEME.buy} पैकेट लो, ${SCHEME.free} मुफ़्त. Best before ${BEST_BEFORE}. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें.` };
  const EASE = [0.22, 1, 0.36, 1];
  const agentsAt = (...stages) => P.AGENTS.filter((a) => !a.gate && stages.includes(a.stage)).map((a) => a.name);
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
  const AGENTS = P.AGENTS.map((a) => ({ id: a.gate ? "you" : a.id, name: a.gate ? "You" : a.name, icon: a.icon, human: !!a.gate, did: DID[a.id] }));
  const AGENT = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
  function useRise(amount = 0.3) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const inView = useInView(ref, { once: true, amount });
    const shown = reduce || inView;
    const move = (y, delay) => ({ initial: reduce ? false : { opacity: 0, y }, animate: shown ? { opacity: 1, y: 0 } : void 0, transition: { duration: 0.42, delay: reduce ? 0 : delay, ease: EASE } });
    return { shown, card: { ref, ...move(16, 0) }, rise: (i) => move(10, 0.16 + i * 0.11) };
  }
  function useLit(on2, n, first, every) {
    const reduce = useReducedMotion();
    const [k, setK] = useState(reduce ? n : 0);
    useEffect(() => {
      if (reduce) {
        setK(n);
        return;
      }
      if (!on2 || k >= n) return;
      const t = setTimeout(() => setK(k + 1), k === 0 ? first : every);
      return () => clearTimeout(t);
    }, [on2, k, reduce]);
    return k;
  }
  function AgentChips({ who, lit, person }) {
    return /* @__PURE__ */ React.createElement("span", { className: "agents" }, who.map((w, j) => /* @__PURE__ */ React.createElement("span", { key: w, className: cx("chip-agent", (lit == null || j < lit) && "on", person && j === 0 && "person") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), w)));
  }
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
  const WORDS = ["buyer", "shelf", "invoice", "ledger line", "chance"];
  function Hero({ onDemo }) {
    const night = useTheme().resolved === "dark";
    const reduce = useReducedMotion();
    const vid = useRef(null);
    const [state, setState] = useState(reduce ? "still" : "playing");
    const [w, setW] = useState(reduce ? WORDS.length - 1 : 0);
    useEffect(() => {
      if (reduce || w >= WORDS.length - 1) return;
      const t = setTimeout(() => setW(w + 1), w === 0 ? 1500 : 1e3);
      return () => clearTimeout(t);
    }, [w, reduce]);
    const src = MEDIA + (night ? "town-night.mp4" : "town.mp4"), poster = IMG + (night ? "business-night.webp" : "business.webp");
    useEffect(() => {
      const L = window.SC3_LOADER;
      if (!L) return;
      let live = true;
      const im = new Image();
      im.decoding = "async";
      im.src = poster;
      const done = () => {
        if (live && L.plateDrawn) requestAnimationFrame(() => L.plateDrawn(night));
      };
      (im.decode ? im.decode() : new Promise((r) => {
        im.onload = r;
        im.onerror = r;
      })).then(done, done);
      return () => {
        live = false;
      };
    }, [poster, night]);
    useEffect(() => {
      setState(reduce ? "still" : "playing");
    }, [src, reduce]);
    const toggle = () => {
      const v = vid.current;
      if (!v) return;
      if (state === "playing") {
        v.pause();
        setState("paused");
      } else {
        if (state === "ended") v.currentTime = 0;
        v.play();
        setState("playing");
      }
    };
    return /* @__PURE__ */ React.createElement("section", { className: "hero film", id: "top-hero", "aria-labelledby": "hero-h" }, /* @__PURE__ */ React.createElement("div", { className: "film-media", "aria-hidden": "true" }, reduce ? /* @__PURE__ */ React.createElement("img", { src: poster, alt: "" }) : /* @__PURE__ */ React.createElement("video", { key: src, ref: vid, src, poster, muted: true, playsInline: true, autoPlay: true, preload: "auto", onEnded: () => setState("ended") }), /* @__PURE__ */ React.createElement("div", { className: "film-shade" })), /* @__PURE__ */ React.createElement("div", { className: "film-copy" }, /* @__PURE__ */ React.createElement("h1", { id: "hero-h", className: "film-h" }, "Every near-expiry carton gets a second ", /* @__PURE__ */ React.createElement("span", { className: "film-word" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "chance"), /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "popLayout", initial: false }, /* @__PURE__ */ React.createElement(motion.span, { key: WORDS[w], "aria-hidden": "true", initial: reduce ? false : { opacity: 0, y: "0.5em" }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: "-0.5em" }, transition: { duration: 0.42, ease: EASE } }, WORDS[w]))), "."), /* @__PURE__ */ React.createElement("p", { className: "film-sub" }, "AI agents find the best exit for short-dated stock, and do the running around. You say yes once."), /* @__PURE__ */ React.createElement("div", { className: "film-ctas" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", pill: true, onClick: () => onDemo() }, "Book a demo"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-lg btn-pill film-ghost", ...linkProps(LINKS.demo) }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "play", size: 12, stroke: 2.6 })), "Watch the 6-minute demo"))), !reduce && /* @__PURE__ */ React.createElement("div", { className: "film-ctl" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: toggle }, /* @__PURE__ */ React.createElement(Icon, { name: state === "playing" ? "pause" : state === "ended" ? "rotate-ccw" : "play", size: 16 }), state === "playing" ? "Pause" : state === "ended" ? "Replay" : "Play")));
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
    return /* @__PURE__ */ React.createElement("section", { className: "say", id, "aria-label": "In short" }, /* @__PURE__ */ React.createElement("p", { ref }, words.map((w, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, /* @__PURE__ */ React.createElement(Word, { p: scrollYProgress, a: i / n * 0.92, b: Math.min(1, i / n * 0.92 + 0.1), text: w, reduce }), i < n - 1 ? " " : ""))));
  }
  const TAB_AR = 2752 / 1536;
  const PHONE = { x: 0.633, y: 0.152, w: 0.097, h: 0.398 };
  const POST = {
    data: { x: 0.14, y: 0.62, side: "left" },
    watcher: { x: 0.25, y: 0.47 },
    vision: { x: 0.33, y: 0.66 },
    valuer: { x: 0.16, y: 0.74, side: "left" },
    router: { x: 0.37, y: 0.77 },
    you: { x: 0.615, y: 0.4, side: "left" },
    outreach: { x: 0.47, y: 0.58 },
    lister: { x: 0.6, y: 0.64 },
    negotiator: { x: 0.635, y: 0.77, side: "left" },
    paperwork: { x: 0.755, y: 0.58 },
    impact: { x: 0.91, y: 0.79, side: "left" }
  };
  const WHERE = { data: "at the godown", watcher: "at the godown", vision: "at the godown", valuer: "at the godown", router: "at the godown", you: "on your phone", outreach: "at the kiranas", lister: "at the buyer's bay", negotiator: "at the buyer's truck", paperwork: "on your phone", impact: "at the landfill" };
  const TAGS = [
    { id: "kirana", at: { x: 0.49, y: 0.55 }, name: "Kiranas", line: (got) => `${fmt.num(got.kirana)} of ${fmt.num(KL.units)} packs · ${SHOPS} shops` },
    { id: "expiresoon", at: { x: 0.66, y: 0.6 }, name: "A buyer elsewhere", line: (got) => `${fmt.num(got.expiresoon)} of ${fmt.num(AW.units)} packs · ${rate(AW.price)} a pack` },
    { id: "dump", at: { x: 0.84, y: 0.72 }, name: "Landfill", line: (got, done) => done ? `${fmt.num(D.PLAN.kg)} kg kept out` : `the bin would cost ${fmt.inr(-BIN)}` }
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
      const el = stageRef.current;
      if (!el) return;
      const measure = () => {
        const w = el.clientWidth, h = el.clientHeight;
        const s = Math.max(w / ar, h);
        const pw = s * ar, ph = s;
        setFit({ w, h, pw, ph, x: (w - pw) * pan, y: (h - ph) * panY });
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, [ar, pan, panY]);
    return fit;
  }
  const at = (fit, p) => ({ left: fit.x + p.x * fit.pw, top: fit.y + p.y * fit.ph });
  const on = (fit, p) => ({ left: p.x * fit.pw, top: p.y * fit.ph });
  function Frag({ id }) {
    switch (id) {
      case "data":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Product, { name: "pack-snack-plain", size: 56 }), /* @__PURE__ */ React.createElement("span", { className: "k" }, fmt.num(BATCH.units), " packs · selling ", /* @__PURE__ */ React.createElement("b", null, BATCH.sellPerDay), " a day · ", /* @__PURE__ */ React.createElement("b", null, BATCH.daysLeft), " days to the date"));
      case "watcher":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "num red" }, fmt.num(N)), /* @__PURE__ */ React.createElement("span", { className: "k" }, "packs won't sell in time"), /* @__PURE__ */ React.createElement(GateChips, { gates: D.RISK.gates, size: "sm" }));
      case "vision":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Product, { name: "phone-scan", size: 56 }), /* @__PURE__ */ React.createElement("span", { className: "k" }, "One label photo from the godown · ", /* @__PURE__ */ React.createElement("b", null, "the date matches"), " the export"));
      case "valuer":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, [["kirana", "Kiranas"], ["expiresoon", "ExpireSoon"], ["staff", "Staff sale"], ["foodbank", "Food bank"], ["writeoff", "The bin"]].map(([id2, n]) => /* @__PURE__ */ React.createElement("span", { key: id2, className: "k" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot " + (id2 === "writeoff" ? "bin" : id2), "aria-hidden": "true" }), n, " ", /* @__PURE__ */ React.createElement("b", { style: id2 === "writeoff" ? { color: "var(--red-text)" } : void 0 }, fmt.inr2(row(id2).net)))));
      case "router":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "m-split", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "k", style: { flexGrow: KL.units } }), /* @__PURE__ */ React.createElement("span", { className: "e", style: { flexGrow: ESL.units } })), /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot kirana", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("b", null, fmt.num(KL.units)), " to ", SHOPS, " kiranas"), /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("i", { className: "ex-dot expiresoon", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("b", null, fmt.num(AW.units)), " to one buyer"));
      case "you":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.net }), /* @__PURE__ */ React.createElement("span", { className: "k" }, "on screen, against ", fmt.inr(-BIN), " to destroy it"), /* @__PURE__ */ React.createElement("span", { className: "btn btn-approve" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16 }), "Approve · release the agents"));
      case "outreach":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "hi", lang: "hi" }, OFFER.title), /* @__PURE__ */ React.createElement("span", { className: "k" }, "to ", /* @__PURE__ */ React.createElement("b", null, SHOPS), " kiranas in Hindi · buy ", SCHEME.buy, ", get ", SCHEME.free, " free · 48 hours"));
      case "lister":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Product, { name: "marketplace-bag", size: 56 }), /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("b", null, fmt.num(AW.units)), " packs listed in the distributor's name · reserve ", rate(M.RULES.negotiation.reservePerUnit)));
      case "negotiator":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "k" }, "A bid of ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(BID))), /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 16 }), /* @__PURE__ */ React.createElement("span", { className: "k" }, "countered to ", /* @__PURE__ */ React.createElement("b", null, rate(AW.price)), ", accepted"), /* @__PURE__ */ React.createElement("span", { className: "k" }, "· token ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(AW.token))));
      case "paperwork":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Product, { name: "documents", size: 56 }), /* @__PURE__ */ React.createElement("span", { className: "k" }, "The distributor's invoice · the brand's credit note ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(D.SUPPORT.total)), " · the GST memo"));
      case "impact":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "num" }, fmt.num(D.PLAN.kg), " kg"), /* @__PURE__ */ React.createElement("span", { className: "k" }, "kept out of landfill · ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(D.ACTUAL.net)), " recovered · 0 cartons destroyed"));
      default:
        return null;
    }
  }
  function PhoneScreen({ phase, lit }) {
    const list = phase === "placed" ? AFTER : BEFORE;
    return /* @__PURE__ */ React.createElement("div", { className: "ps", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "top" }, /* @__PURE__ */ React.createElement("span", { className: "who" }, /* @__PURE__ */ React.createElement(Mark, { size: 24 }), /* @__PURE__ */ React.createElement("b", null, "Route Room")), phase === "placed" ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "Placed · 09:40") : phase === "plan" ? /* @__PURE__ */ React.createElement(Badge, { tone: "amber", dot: true }, "Waiting for you") : /* @__PURE__ */ React.createElement(Badge, { tone: "red", dot: true }, "At risk")), phase === "placed" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "placed" }, /* @__PURE__ */ React.createElement("span", { className: "t" }, "Plan placed"), /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.swing }), /* @__PURE__ */ React.createElement("p", null, "better than the bin, on one batch of chips.")), /* @__PURE__ */ React.createElement("div", { className: "work" }, list.map((id, i) => /* @__PURE__ */ React.createElement("span", { key: id, className: cx("w", i < lit && "on") }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: AGENT[id].icon, size: 11, stroke: 2.4 })), /* @__PURE__ */ React.createElement("b", null, AGENT[id].name), /* @__PURE__ */ React.createElement("span", null, "· ", AGENT[id].did))))) : phase === "building" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h4", null, SKU.name), /* @__PURE__ */ React.createElement("div", { className: "big" }, /* @__PURE__ */ React.createElement("span", { className: "num red" }, fmt.num(N)), /* @__PURE__ */ React.createElement("span", null, "packs won't sell in the ", BATCH.daysLeft, " days left")), /* @__PURE__ */ React.createElement("div", { className: "work" }, list.map((id, i) => /* @__PURE__ */ React.createElement("span", { key: id, className: cx("w", i < lit && "on") }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: AGENT[id].icon, size: 11, stroke: 2.4 })), /* @__PURE__ */ React.createElement("b", null, AGENT[id].name), /* @__PURE__ */ React.createElement("span", null, "· ", i < lit ? AGENT[id].did : "waiting"))))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h4", null, "Approve the plan"), /* @__PURE__ */ React.createElement("div", { className: "big" }, /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.net }), /* @__PURE__ */ React.createElement("span", null, "net recovered, ", D.PLAN.pctMRP, "% of MRP")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "r" }, /* @__PURE__ */ React.createElement("span", null, "Instead of destroying"), /* @__PURE__ */ React.createElement("b", { className: "red" }, fmt.inr(-BIN))), /* @__PURE__ */ React.createElement("div", { className: "r" }, /* @__PURE__ */ React.createElement("span", null, fmt.num(KL.units), " packs to ", SHOPS, " kiranas"), /* @__PURE__ */ React.createElement("b", null, fmt.inr(KL.net))), /* @__PURE__ */ React.createElement("div", { className: "r" }, /* @__PURE__ */ React.createElement("span", null, fmt.num(ESL.units), " packs on ExpireSoon"), /* @__PURE__ */ React.createElement("b", null, fmt.inr(ESL.net)))), /* @__PURE__ */ React.createElement("span", { className: "btn btn-approve btn-lg" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 18 }), "Approve · release the agents")));
  }
  function Table() {
    const night = useTheme().resolved === "dark";
    const reduce = useReducedMotion();
    const app = useApp();
    const desk = app.bp === "desktop";
    const stage = useRef(null);
    const fit = useCover(stage, TAB_AR, desk ? 0.5 : 0.42, 0.5);
    const seen = useInView(stage, { amount: 0.6 });
    const [s, setS] = useState(reduce ? NS : -1);
    const [hold, setHold] = useState(false);
    const [run, setRun] = useState(0);
    useEffect(() => {
      if (reduce) return;
      if (s === -1 && seen) setS(0);
    }, [seen, reduce, s]);
    useEffect(() => {
      if (reduce || hold || !seen || s < 0 || s >= NS) return;
      const t = setTimeout(() => setS(s + 1), ORDER[s] === "you" ? PACE.you : PACE.agent);
      return () => clearTimeout(t);
    }, [s, hold, seen, reduce]);
    const go = (i) => {
      setHold(true);
      setS(i);
    };
    const replay = () => {
      setHold(false);
      setGot({ kirana: 0, expiresoon: 0 });
      setRun((r) => r + 1);
      setS(0);
    };
    const agent = s >= 0 && s < NS ? ORDER[s] : null;
    const done = s >= NS;
    const working = agent != null;
    const W = 1e3, H = Math.round(W / TAB_AR);
    let cam = { tx: 0, ty: 0, sc: 1 };
    if (fit && working) {
      const sc = desk ? 1.6 : 1.45;
      const f = at(fit, !desk && agent === "you" ? { x: 0.66, y: PHONE.y + PHONE.h / 2 } : POST[agent]);
      const cx0 = fit.w * 0.5, cy0 = fit.h * 0.42;
      let tx = cx0 - f.left * sc, ty = cy0 - f.top * sc;
      tx = Math.min(-fit.x * sc, Math.max(fit.w - (fit.x + fit.pw) * sc, tx));
      ty = Math.min(-fit.y * sc, Math.max(fit.h - (fit.y + fit.ph) * sc, ty));
      cam = { tx, ty, sc };
    }
    const iz = 1 / cam.sc;
    const dots = useRef([]), paths = useRef({});
    const [got, setGot] = useState(reduce ? { kirana: KL.units, expiresoon: AW.units } : { kirana: 0, expiresoon: 0 });
    const from = { x: (PHONE.x + PHONE.w / 2) * W, y: (PHONE.y + PHONE.h / 2) * H };
    const routes = { kirana: curve(from, { x: DROP.kirana.x * W, y: DROP.kirana.y * H }, 40), expiresoon: curve(from, { x: DROP.expiresoon.x * W, y: DROP.expiresoon.y * H }, 30) };
    const DOTS = useMemo(() => {
      const out = [];
      const nk = Math.round(KL.units / 50), ne = Math.round(AW.units / 50);
      for (let i = 0; i < nk; i++) out.push("kirana");
      for (let i = 0; i < ne; i++) out.push("expiresoon");
      return out;
    }, []);
    const sent = useRef({ kirana: false, expiresoon: false });
    const ctrls = useRef([]);
    useEffect(() => {
      if (s === 0 || s === -1) sent.current = { kirana: false, expiresoon: false };
    }, [s, run]);
    useEffect(() => () => {
      ctrls.current.forEach((c) => c.stop());
      ctrls.current = [];
    }, [run]);
    useEffect(() => {
      if (reduce) return;
      const id = s === OUT ? "kirana" : s === LIST ? "expiresoon" : null;
      if (!id || sent.current[id]) return;
      sent.current[id] = true;
      const path = paths.current[id];
      if (!path) return;
      const L = path.getTotalLength();
      const mine = DOTS.map((d, i) => [d, i]).filter(([d]) => d === id);
      let arrived = 0;
      mine.forEach(([, i], j) => {
        const c = dots.current[i];
        if (!c) return;
        ctrls.current.push(animate(0, 1, {
          duration: 0.8,
          delay: 0.1 + j * 0.07,
          ease: [0.45, 0, 0.4, 1],
          onUpdate: (v) => {
            const q = path.getPointAtLength(v * L);
            c.setAttribute("cx", q.x);
            c.setAttribute("cy", q.y);
            c.setAttribute("opacity", v < 0.06 ? v * 16 : v > 0.94 ? Math.max(0, (1 - v) * 16) : 1);
          },
          onComplete: () => {
            c.setAttribute("opacity", 0);
            arrived += 1;
            setGot((g) => ({ ...g, [id]: Math.round((id === "kirana" ? KL.units : AW.units) * arrived / mine.length) }));
          }
        }));
      });
    }, [s, reduce, run]);
    useEffect(() => {
      if (done) setGot({ kirana: KL.units, expiresoon: AW.units });
    }, [done]);
    const a = agent && AGENT[agent];
    const human = agent === "you";
    const mini = fit ? { ...on(fit, PHONE), width: PHONE.w * fit.pw, height: PHONE.h * fit.ph, "--s": PHONE.w * fit.pw / 360 } : null;
    const card = a && /* @__PURE__ */ React.createElement("div", { className: cx("tb-focus", human && "human"), role: "group", "aria-live": "polite" }, /* @__PURE__ */ React.createElement("span", { className: "icn", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 26, stroke: 2 })), /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("span", { className: "n" }, s + 1, " of ", NS), /* @__PURE__ */ React.createElement("h3", null, a.name), /* @__PURE__ */ React.createElement("span", null, WHERE[agent])), /* @__PURE__ */ React.createElement("p", null, a.did), /* @__PURE__ */ React.createElement("div", { className: "frag" }, /* @__PURE__ */ React.createElement(Frag, { id: agent })), desk && /* @__PURE__ */ React.createElement("div", { className: "rail", role: "group", "aria-label": "The agents, in order" }, ORDER.map((id, i) => /* @__PURE__ */ React.createElement("button", { key: id, type: "button", className: cx(i < s && "on", AGENT[id].human && "human"), "aria-current": i === s ? "step" : void 0, onClick: () => go(i) }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: AGENT[id].icon, size: 10, stroke: 2.4 })), AGENT[id].name))));
    return /* @__PURE__ */ React.createElement("section", { id: "agents", className: "sec-table", "aria-labelledby": "tb-h" }, /* @__PURE__ */ React.createElement("header", { className: "tb-head" }, /* @__PURE__ */ React.createElement("h2", { id: "tb-h", className: "sec-h plain" }, "Five exits, one batch. Ten agents at work."), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, fmt.num(N), " packs of masala chips that won't sell in the ", BATCH.daysLeft, " days they have left, on the table. The agents work the batch stop by stop; a person says yes once; the packs leave for the kiranas and a buyer, and nothing goes to the bin.")), /* @__PURE__ */ React.createElement("div", { className: cx("tb-stage", working && "working"), ref: stage }, /* @__PURE__ */ React.createElement("div", { className: "tb-world", style: { transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.sc})` } }, /* @__PURE__ */ React.createElement("img", { className: "tb-plate", style: fit ? { left: fit.x, top: fit.y, width: fit.pw, height: fit.ph } : { objectPosition: `${(desk ? 0.5 : 0.42) * 100}% 50%` }, src: IMG + (night ? "table-night.webp" : "table.webp"), alt: `A ${night ? "lamp-lit evening" : "morning"} table by a window: a hand holds a phone over a handmade miniature of a snack trade, a tiny godown full of cartons, a lane of kirana shops, a wholesale warehouse with a blue truck, a community kitchen, a closed dump yard in the far corner, a steel tumbler of chai, and a thin glowing green path along the table.` }), fit && /* @__PURE__ */ React.createElement("div", { className: "tb-layer", style: { left: fit.x, top: fit.y, width: fit.pw, height: fit.ph } }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", "aria-hidden": "true" }, Object.entries(routes).map(([id, d]) => /* @__PURE__ */ React.createElement("path", { key: id, ref: (el) => {
      paths.current[id] = el;
    }, className: "tb-path", d })), DOTS.map((id, i) => /* @__PURE__ */ React.createElement("circle", { key: i + ":" + run, ref: (el) => {
      dots.current[i] = el;
    }, className: "tb-dot " + id, r: "9", opacity: "0" }))), mini && /* @__PURE__ */ React.createElement("div", { className: "tb-mini", style: mini, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "tb-mini-in" }, /* @__PURE__ */ React.createElement(PhoneScreen, { phase: done || s > YES ? "placed" : s >= ROUTER ? "plan" : "building", lit: done ? AFTER.length : s > YES ? s - YES : s + 1 }))), TAGS.map((t) => /* @__PURE__ */ React.createElement("span", { key: t.id, className: cx("tb-tag", t.id, got[t.id] > 0 && "in"), style: { ...on(fit, t.at), "--iz": iz }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "tb-tag-body" }, /* @__PURE__ */ React.createElement("b", null, /* @__PURE__ */ React.createElement("i", { className: "ex-dot " + (t.id === "dump" ? "bin" : t.id) }), t.name), /* @__PURE__ */ React.createElement("span", null, t.line(got, done))), /* @__PURE__ */ React.createElement("span", { className: "stem" }))), /* @__PURE__ */ React.createElement("ul", { className: "sr-only", "aria-label": "The agents at their posts" }, ORDER.map((id) => /* @__PURE__ */ React.createElement("li", { key: id }, AGENT[id].name, ", ", WHERE[id], ": ", AGENT[id].did))), ORDER.map((id, i) => {
      const ag = AGENT[id];
      const st = i < s || done ? "on" : i === s ? "now on" : "later";
      return /* @__PURE__ */ React.createElement("span", { key: id, className: cx("tb-node", st, ag.human && "human", POST[id].side === "left" && "left"), style: { ...on(fit, POST[id]), "--iz": iz }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", { className: "dot" }, /* @__PURE__ */ React.createElement(Icon, { name: ag.icon, size: 13, stroke: 2.4 })), /* @__PURE__ */ React.createElement("span", { className: "name" }, ag.name));
    }))), /* @__PURE__ */ React.createElement("div", { className: "tb-shade", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, a && /* @__PURE__ */ React.createElement(motion.div, { key: agent, initial: reduce ? false : { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.3, ease: EASE }, style: { display: "contents" } }, card)), done && /* @__PURE__ */ React.createElement("div", { className: "tb-result", role: "status" }, /* @__PURE__ */ React.createElement("b", null, "Sold, not binned."), /* @__PURE__ */ React.createElement("span", { className: "did" }, fmt.inr(D.ACTUAL.net), " recovered, instead of ", fmt.inr(-BIN), " to destroy it"), !reduce && /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: replay }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16 }), "Replay")), !reduce && working && /* @__PURE__ */ React.createElement("div", { className: "tb-ctl" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", "aria-pressed": hold, onClick: () => setHold((h) => !h) }, /* @__PURE__ */ React.createElement(Icon, { name: hold ? "play" : "pause", size: 16 }), hold ? "Play" : "Pause"))));
  }
  function Chapter({ id, tone, title, lede, who, person, children, wide }) {
    const { card, rise } = useRise(0.2);
    return /* @__PURE__ */ React.createElement(motion.section, { id, className: cx("ch", "tone-" + tone), "aria-labelledby": id + "-h", ...card }, /* @__PURE__ */ React.createElement("div", { className: cx("ch-in", wide && "wide") }, /* @__PURE__ */ React.createElement("div", { className: "ch-copy" }, /* @__PURE__ */ React.createElement(motion.h2, { id: id + "-h", className: "ch-h", ...rise(0) }, title), /* @__PURE__ */ React.createElement(motion.p, { className: "ch-lede", ...rise(1) }, lede), who && /* @__PURE__ */ React.createElement(motion.span, { ...rise(2) }, /* @__PURE__ */ React.createElement(AgentChips, { who, person }))), /* @__PURE__ */ React.createElement("div", { className: "ch-stage" }, children)));
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
    const p0 = OFFER;
    return /* @__PURE__ */ React.createElement(motion.div, { className: "ch-row three", ...card }, /* @__PURE__ */ React.createElement(motion.div, { className: "m-card", role: "group", "aria-label": "Outreach: the kirana offer, in Hindi", ...rise(0) }, /* @__PURE__ */ React.createElement("div", { className: "m-head" }, /* @__PURE__ */ React.createElement("span", { className: cx("chip-agent", lit > 0 && "on") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Outreach · 09:41"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "gift" }, SCHEME.buy, " + ", SCHEME.free)), /* @__PURE__ */ React.createElement("div", { className: "m-batch" }, /* @__PURE__ */ React.createElement(Product, { name: "pack-snack-plain", size: 52 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", { lang: "hi", className: "hi" }, p0.title), /* @__PURE__ */ React.createElement("span", null, fmt.inr2(KL.packPrice), " a pack · MRP ", fmt.inr(SKU.mrp), " · 48 hours"))), /* @__PURE__ */ React.createElement("p", { lang: "hi", className: "hi m-hindi" }, p0.body), /* @__PURE__ */ React.createElement("div", { className: "m-row" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, fmt.num(SHOPS), " shops ordered"), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmt.num(KL.units), " packs"))), /* @__PURE__ */ React.createElement(motion.div, { className: "m-card violet", role: "group", "aria-label": "Lister and Negotiator: the lot on ExpireSoon", ...rise(1) }, /* @__PURE__ */ React.createElement("div", { className: "m-head" }, /* @__PURE__ */ React.createElement("span", { className: cx("chip-agent", lit > 1 && "on") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Lister · Negotiator"), /* @__PURE__ */ React.createElement(Badge, { tone: "violet", dot: true }, "ExpireSoon")), /* @__PURE__ */ React.createElement("div", { className: "m-batch" }, /* @__PURE__ */ React.createElement(Product, { name: "marketplace-bag", size: 52 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, fmt.num(AW.units), " packs, listed in the distributor's name"), /* @__PURE__ */ React.createElement("span", null, "reserve ", rate(M.RULES.negotiation.reservePerUnit), " · hidden inside the brand's territories"))), /* @__PURE__ */ React.createElement("div", { className: "m-row" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "A buyer bids"), /* @__PURE__ */ React.createElement("span", { className: "v" }, rate(BID))), /* @__PURE__ */ React.createElement("div", { className: "m-row" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Countered, accepted"), /* @__PURE__ */ React.createElement("span", { className: "v" }, rate(AW.price), " a pack")), /* @__PURE__ */ React.createElement("div", { className: "m-row" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Token paid"), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmt.inr(AW.token)))), /* @__PURE__ */ React.createElement(motion.div, { className: "m-card", role: "group", "aria-label": "Paperwork: the documents, drafted", ...rise(2) }, /* @__PURE__ */ React.createElement("div", { className: "m-head" }, /* @__PURE__ */ React.createElement("span", { className: cx("chip-agent", lit > 2 && "on") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Paperwork"), /* @__PURE__ */ React.createElement(Badge, { tone: "gray" }, "drafted")), /* @__PURE__ */ React.createElement("div", { className: "m-batch" }, /* @__PURE__ */ React.createElement(Product, { name: "documents", size: 52 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "Everything finance needs, drafted"), /* @__PURE__ */ React.createElement("span", null, "each on paper, with who keeps what"))), [["The distributor's invoice to the buyer", "IGST 5%"], ["The brand's price-support credit note", fmt.inr(D.SUPPORT.total)], ["GST input credit memo", fmt.inr(D.PLAN.itcRetained)]].map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, className: "m-row" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, k), /* @__PURE__ */ React.createElement("span", { className: "v" }, v)))));
  }
  function Chapters() {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Chapter, { id: "watch", tone: "green", title: "Spot it while there is time to sell", lede: "Every morning at 09:00 the Watcher checks each batch against its date and the quick-commerce shelf-life rules. Vision reads the label photo from the godown to be sure.", who: agentsAt("connect", "detect", "verify") }, /* @__PURE__ */ React.createElement(AlertCard, null)), /* @__PURE__ */ React.createElement(Chapter, { id: "price", tone: "sunken", title: "Price every exit, the bin included", lede: `Kiranas on a ${SCHEME.free}-free-with-${SCHEME.buy} scheme, a clearance marketplace, a staff sale at the godown, a food bank: the Valuer prices each against the true cost of destroying the stock, and the Router splits the batch within each exit's limits.`, who: agentsAt("value", "decide") }, /* @__PURE__ */ React.createElement(PricesCard, null)), /* @__PURE__ */ React.createElement(Chapter, { id: "yes", tone: "amber", title: "Say yes once.", lede: "A person approves the plan with the money on screen. Nothing is listed, messaged or shipped before that tap.", who: ["a person"], person: true }, /* @__PURE__ */ React.createElement(PlanCard, null)), /* @__PURE__ */ React.createElement(Chapter, { id: "work", tone: "night", title: "The agents do the rest.", lede: "They send the kirana offers in Hindi, list the lot in the distributor's name, answer bids, draft the invoice, credit note and GST memo, and post the impact.", who: agentsAt("execute", "settle", "report"), wide: true }, /* @__PURE__ */ React.createElement(WorkCards, null)));
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
    return /* @__PURE__ */ React.createElement("section", { className: "sec-ledger", id: "ledger", "aria-labelledby": "ledger-h" }, /* @__PURE__ */ React.createElement(motion.div, { className: "ledger", role: "group", "aria-labelledby": "ledger-h", ...card }, /* @__PURE__ */ React.createElement(motion.div, { className: "ledger-head", ...rise(0) }, /* @__PURE__ */ React.createElement("b", null, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "leaf", size: 14, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", { id: "ledger-h" }, "Impact · the ledger for one batch")), /* @__PURE__ */ React.createElement("span", null, "posted after the return window")), lines.map((l, i) => /* @__PURE__ */ React.createElement(motion.div, { key: l.k, className: cx("ledger-row", l.zero && "zero"), ...rise(i + 1) }, /* @__PURE__ */ React.createElement("span", { className: "k" }, l.k), /* @__PURE__ */ React.createElement("span", { className: "v" }, l.v), /* @__PURE__ */ React.createElement("span", { className: "s" }, l.s))), /* @__PURE__ */ React.createElement(motion.div, { className: "ledger-foot", ...rise(lines.length + 1) }, /* @__PURE__ */ React.createElement("span", null, "BRSR Principle 6 · two rows an auditor can follow back to the batch"), /* @__PURE__ */ React.createElement("span", null, "one illustrative batch"))), /* @__PURE__ */ React.createElement("p", { className: "ledger-note" }, "An illustrative batch. Every figure is worked out from the journey map."));
  }
  function DemoPill({ hidden }) {
    return /* @__PURE__ */ React.createElement("a", { className: cx("pill", hidden && "off"), ...linkProps(LINKS.demo), "aria-label": "Watch the 6-minute demo" }, /* @__PURE__ */ React.createElement("span", { className: "thumb", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("img", { src: (window.SC3_IMG || "system/img/").replace(/img\/$/, "media/") + "carton-loop-poster.webp", alt: "" }), /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: "play", size: 12, stroke: 2.6 }))), /* @__PURE__ */ React.createElement("span", null, "Watch the 6-minute demo"));
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
    const [scrolled, setScrolled] = useState(false);
    const closeRef = useRef(null);
    const nearEnd = useInView(closeRef, { amount: 0.2 });
    useEffect(() => {
      document.title = "Smart-Clearance";
      if (window.SC3_LOADER) window.SC3_LOADER.mark("app");
    }, []);
    useEffect(() => {
      const f = () => setScrolled(window.scrollY > 40);
      f();
      window.addEventListener("scroll", f, { passive: true });
      return () => window.removeEventListener("scroll", f);
    }, []);
    const onDemo = (plan) => setDemo({ plan: typeof plan === "string" ? plan : null });
    return /* @__PURE__ */ React.createElement("div", { className: cx("site", scrolled && "scrolled"), id: "top" }, /* @__PURE__ */ React.createElement(Nav, { onFind: () => setFind(true), onDemo }), /* @__PURE__ */ React.createElement("main", null, /* @__PURE__ */ React.createElement(Hero, { onDemo }), /* @__PURE__ */ React.createElement(Statement, { id: "how", text: "Short-dated stock that quick commerce sent back. Priced to every exit, the bin included. Sold in the days it has left." }), /* @__PURE__ */ React.createElement(Table, null), /* @__PURE__ */ React.createElement(Chapters, null), /* @__PURE__ */ React.createElement(Ledger, null), /* @__PURE__ */ React.createElement(Workspace, null), /* @__PURE__ */ React.createElement(Plans, { onDemo }), /* @__PURE__ */ React.createElement(Close, { onDemo, closeRef })), /* @__PURE__ */ React.createElement(Footer, { onFind: () => setFind(true) }), /* @__PURE__ */ React.createElement(DemoPill, { hidden: nearEnd }), /* @__PURE__ */ React.createElement(S.FindWorkspace, { open: find, onClose: () => setFind(false), onUse: () => {
      setFind(false);
      open(LINKS.app);
    }, note: "One manufacturer's workspace is set up in this prototype." }), /* @__PURE__ */ React.createElement(DemoSheet, { open: !!demo, plan: demo && demo.plan, onClose: () => setDemo(null) }));
  }
  const gate = window.SC3_LOADER && window.SC3_LOADER.switchTheme;
  function Root() {
    return /* @__PURE__ */ React.createElement(ThemeProvider, { gate }, /* @__PURE__ */ React.createElement(AppRoot, { className: "site-root" }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(Site, null))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
})();

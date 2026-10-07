(function() {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo } = React;
  const { useReducedMotion, motion, useScroll, useTransform, useInView, useMotionValueEvent, AnimatePresence, animate } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY;
  const fmt = M.fmt;
  const { cx, Icon, Button, Badge, Mark, Money, Roll, Product, useApp, useTheme, StatusBar } = K;
  const C = window.SC60;
  const { FIG, AGENTS, AGENT, LINKS, linkProps, IMG, EASE, useRise, useLit, AgentChips } = C;
  const { KL, ESL, AW, BATCH, DIST, SKU, SHOPS, BIN, ES_NET, N, row, rate, SCHEME } = FIG;
  const OPT = window.SC60_OPTION || "c";
  const S60 = window.SC60_IMG || "./", S60M = window.SC60_MEDIA || S60;
  const plate = (name, night) => S60 + name + (night ? "-night" : "") + ".webp";
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
  const at = (fit, p) => fit ? { left: fit.x + p.x * fit.pw, top: fit.y + p.y * fit.ph } : { left: 0, top: 0 };
  const WORDS = ["buyer", "shelf", "invoice", "ledger line", "chance"];
  function HeroFilm({ onDemo }) {
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
    const src = S60M + (night ? "a-town-night.mp4" : "a-town.mp4"), poster = IMG + (night ? "business-night.webp" : "business.webp");
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
    return /* @__PURE__ */ React.createElement("section", { className: "s60-hero s60-film", id: "agents", "aria-labelledby": "hero-h" }, /* @__PURE__ */ React.createElement("div", { className: "film-media", "aria-hidden": "true" }, reduce ? /* @__PURE__ */ React.createElement("img", { src: poster, alt: "" }) : /* @__PURE__ */ React.createElement("video", { key: src, ref: vid, src, poster, muted: true, playsInline: true, autoPlay: true, preload: "auto", onEnded: () => setState("ended") }), /* @__PURE__ */ React.createElement("div", { className: "film-shade" })), /* @__PURE__ */ React.createElement("div", { className: "film-copy" }, /* @__PURE__ */ React.createElement("h1", { id: "hero-h", className: "film-h" }, "Every near-expiry carton gets a second ", /* @__PURE__ */ React.createElement("span", { className: "film-word" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "chance"), /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "popLayout", initial: false }, /* @__PURE__ */ React.createElement(motion.span, { key: WORDS[w], "aria-hidden": "true", initial: reduce ? false : { opacity: 0, y: "0.5em" }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: "-0.5em" }, transition: { duration: 0.42, ease: EASE } }, WORDS[w]))), "."), /* @__PURE__ */ React.createElement("p", { className: "film-sub" }, "AI agents find the best exit for short-dated stock, and do the running around. You say yes once."), /* @__PURE__ */ React.createElement("div", { className: "film-ctas" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", pill: true, onClick: () => onDemo() }, "Book a demo"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-lg btn-pill film-ghost", ...linkProps(LINKS.demo) }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "play", size: 12, stroke: 2.6 })), "Watch the 6-minute demo"))), !reduce && /* @__PURE__ */ React.createElement("div", { className: "film-ctl" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: toggle }, /* @__PURE__ */ React.createElement(Icon, { name: state === "playing" ? "pause" : state === "ended" ? "rotate-ccw" : "play", size: 16 }), state === "playing" ? "Pause" : state === "ended" ? "Replay" : "Play")));
  }
  const PhoneStage = ({ children, scale = 0.78 }) => /* @__PURE__ */ React.createElement("div", { className: "ch-phone", style: { height: 868 * scale } }, /* @__PURE__ */ React.createElement(K.PhoneFrame, { time: "09:00", scale, dark: false }, /* @__PURE__ */ React.createElement("div", { style: { padding: "60px 14px 30px", display: "grid", gap: 12, alignContent: "start" } }, children)));
  function PageA({ onFind, onDemo, closeRef }) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(HeroFilm, { onDemo }), /* @__PURE__ */ React.createElement(C.Statement, { text: "Short-dated stock that quick commerce sent back. Priced to every exit, the bin included. Sold in the days it has left.", id: "how" }), /* @__PURE__ */ React.createElement(C.Chapter, { id: "watch", tone: "green", title: "Spot it while there is time to sell", lede: `Every morning at 09:00 the Watcher checks each batch against its date and the quick-commerce shelf-life rules. Vision reads the label photo from the godown to be sure.`, who: C.agentsAt("connect", "detect", "verify") }, /* @__PURE__ */ React.createElement(C.AlertCard, null)), /* @__PURE__ */ React.createElement(C.Chapter, { id: "price", tone: "sunken", title: "Price every exit, the bin included", lede: `Kiranas on a ${SCHEME.free}-free-with-${SCHEME.buy} scheme, a clearance marketplace, a staff sale at the godown, a food bank: the Valuer prices each against the true cost of destroying the stock, and the Router splits the batch within each exit's limits.`, who: C.agentsAt("value", "decide") }, /* @__PURE__ */ React.createElement(C.PricesCard, null)), /* @__PURE__ */ React.createElement(C.Chapter, { id: "yes", tone: "amber", title: "Say yes once.", lede: "A person approves the plan with the money on screen. Nothing is listed, messaged or shipped before that tap.", who: ["a person"], person: true }, /* @__PURE__ */ React.createElement(C.PlanCard, null)), /* @__PURE__ */ React.createElement(C.Chapter, { id: "work", tone: "night", title: "The agents do the rest.", lede: "They send the kirana offers in Hindi, list the lot in the distributor's name, answer bids, draft the invoice, credit note and GST memo, and post the impact.", who: C.agentsAt("execute", "settle", "report"), wide: true }, /* @__PURE__ */ React.createElement(C.WorkCards, null)), /* @__PURE__ */ React.createElement(C.Ledger, null), /* @__PURE__ */ React.createElement(C.ExitsRow, null), /* @__PURE__ */ React.createElement(C.Workspace, null), /* @__PURE__ */ React.createElement(C.Plans, { onDemo }), /* @__PURE__ */ React.createElement(C.Close, { onDemo, closeRef }));
  }
  const ISL = window.SC60_ISLANDS || { factory: { x: 0.18, y: 0.66 }, godown: { x: 0.31, y: 0.3 }, kitchen: { x: 0.55, y: 0.15 }, kiranas: { x: 0.71, y: 0.37 }, buyer: { x: 0.82, y: 0.17 }, dump: { x: 0.84, y: 0.68 } };
  const SKY_AR = 2752 / 1536;
  const BEATS = [
    { id: "stock", t: "Stocked", at: "godown", who: [], did: `${fmt.num(BATCH.units)} packs of masala chips in the distributor's godown, selling ${BATCH.sellPerDay} a day.`, fig: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "num" }, fmt.num(BATCH.units)), /* @__PURE__ */ React.createElement("span", null, "packs, ", BATCH.daysLeft, " days to the date")) },
    { id: "risk", t: "At risk", at: "godown", who: ["data", "watcher", "vision"], did: `The quick-commerce apps won't take stock this close to its date. Vision reads the label from the godown; the date matches.`, fig: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "num red" }, fmt.num(N)), /* @__PURE__ */ React.createElement("span", null, "packs won't sell in time")), risk: true },
    { id: "route", t: "Priced and split", at: "godown", who: ["valuer", "router"], did: `Kiranas, a marketplace, a staff sale, a food bank, the bin: each priced net a pack. ${fmt.num(KL.units)} packs to ${SHOPS} kiranas, ${fmt.num(AW.units)} to one buyer.`, fig: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Money, { value: -BIN }), /* @__PURE__ */ React.createElement("span", null, "to destroy it, the GST credit lost")) },
    { id: "yes", t: "One yes", at: "factory", who: ["you"], human: true, did: "At the maker's office a person approves the plan in one tap, with the money on screen. Nothing moves before it.", fig: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.net }), /* @__PURE__ */ React.createElement("span", null, "on screen before the yes")) },
    { id: "sell", t: "Sold", at: ["kiranas", "buyer"], who: ["outreach", "lister", "negotiator"], did: `Outreach sends the offer to ${SHOPS} kiranas in Hindi. The Lister posts the lot in the distributor's name; the Negotiator counters a bid to ${rate(AW.price)}.`, fig: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "num" }, fmt.num(KL.units + AW.units)), /* @__PURE__ */ React.createElement("span", null, "packs sold, 0 destroyed")) },
    { id: "settle", t: "Settled", at: ["factory", "dump"], who: ["paperwork", "impact"], did: `Paperwork drafts the invoice, the price-support credit note and the GST memo. Impact posts ${fmt.num(D.PLAN.kg)} kg kept out of the landfill.`, fig: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.net }), /* @__PURE__ */ React.createElement("span", null, "recovered, net")) }
  ];
  const NB = BEATS.length;
  const PINS = { factory: ["The maker", "factory"], godown: ["Distributor · stockist", "warehouse"], kitchen: ["Food bank", "heart-handshake"], kiranas: ["Retailers", "store"], buyer: ["A buyer elsewhere", "truck"], dump: ["Landfill", "trash-2"] };
  const curve = (a, b, lift) => `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y}`;
  function HeroSky({ onFind, onDemo }) {
    const night = useTheme().resolved === "dark";
    const reduce = useReducedMotion();
    const app = useApp();
    const track = useRef(null), stage = useRef(null);
    const fit = useCover(stage, SKY_AR, app.bp === "phone" ? 0.42 : 0.5);
    const { scrollYProgress: p } = useScroll({ target: track, offset: ["start start", "end end"] });
    const [k, setK] = useState(-1);
    const segs = NB + 1;
    useMotionValueEvent(p, "change", (v) => {
      const i = Math.min(NB - 1, Math.floor(v * segs) - 1);
      if (i !== k) setK(i);
    });
    const copyO = useTransform(p, [0, 0.9 / segs], [1, 0]), copyY = useTransform(p, [0, 0.9 / segs], [0, -40]);
    const layerO = useTransform(p, [0.3 / segs, 0.9 / segs], [0, 1]);
    const desk = app.bp === "desktop";
    const sold = useTransform(p, [(4 + 0.1) / segs, (5 - 0.05) / segs], [0, 1]);
    const dots = useRef([]), paths = useRef({});
    const W = 1e3, H = Math.round(W / SKY_AR);
    const pt = (id) => ({ x: ISL[id].x * W, y: ISL[id].y * H });
    const R = window.SC60_ROADS || { kirana: "M470 291 C 530 302, 585 300, 640 282", expiresoon: "M470 291 C 490 230, 530 180, 600 165 L 700 160 C 760 158, 790 150, 805 140" };
    const routes = { kirana: R.kirana, expiresoon: R.expiresoon };
    const DOTS = useMemo(() => {
      const out = [];
      const nk = Math.round(KL.units / 50), ne = Math.round(AW.units / 50);
      for (let i = 0; i < nk + ne; i++) out.push(i % 2 === 0 && i / 2 < nk ? "kirana" : "expiresoon");
      return out;
    }, []);
    useMotionValueEvent(sold, "change", (v) => {
      DOTS.forEach((id, i) => {
        const c = dots.current[i], path = paths.current[id];
        if (!c || !path) return;
        const L = path.getTotalLength();
        const u = Math.max(0, Math.min(1, (v - i * 0.02) / 0.6));
        const q = path.getPointAtLength(u * L);
        c.setAttribute("cx", q.x);
        c.setAttribute("cy", q.y);
        c.setAttribute("opacity", u <= 0 || u >= 1 ? 0 : 1);
      });
    });
    const go = (i) => {
      const el = track.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const h = el.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + h * ((i + 1.5) / segs), behavior: reduce ? "auto" : "smooth" });
    };
    const beat = k >= 0 ? BEATS[k] : null;
    const here = beat ? [].concat(beat.at) : [];
    const card = (b) => /* @__PURE__ */ React.createElement("div", { className: "sky-card", role: "group", "aria-live": "polite" }, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("span", { className: "n" }, BEATS.indexOf(b) + 1, " of ", NB), /* @__PURE__ */ React.createElement("h2", null, b.t)), /* @__PURE__ */ React.createElement("div", { className: "fig" }, b.fig), /* @__PURE__ */ React.createElement("p", null, b.did), b.who.length > 0 && /* @__PURE__ */ React.createElement(AgentChips, { who: b.who.map((w) => AGENT[w].name), person: b.human }));
    const still = reduce;
    return /* @__PURE__ */ React.createElement("section", { className: cx("s60-hero s60-sky", still && "still"), id: "agents", "aria-labelledby": "hero-h", ref: track }, /* @__PURE__ */ React.createElement("div", { className: "sky-stage", ref: stage }, /* @__PURE__ */ React.createElement("img", { className: "sky-plate", src: plate("b-islands", night), alt: `A miniature diorama of a snack business as six islands floating in a ${night ? "night" : "morning"} sky: a factory and its office, a distributor's godown full of cartons, a lane of kirana shops, a wholesale warehouse, a community kitchen and, far off and small, a closed dump yard, joined by thin glowing green roads through the air.` }), fit && /* @__PURE__ */ React.createElement(motion.div, { className: "sky-layer", style: { left: fit.x, top: fit.y, width: fit.pw, height: fit.ph, opacity: still || desk ? 1 : layerO }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none" }, Object.entries(routes).map(([id, d]) => /* @__PURE__ */ React.createElement("path", { key: id, ref: (el) => {
      paths.current[id] = el;
    }, className: "sky-route " + id, d, style: { opacity: 0 } })), !still && DOTS.map((id, i) => /* @__PURE__ */ React.createElement("circle", { key: i, ref: (el) => {
      dots.current[i] = el;
    }, className: "sky-dot " + id, r: "9", opacity: "0" }))), Object.entries(PINS).map(([id, [name, icon]]) => /* @__PURE__ */ React.createElement("span", { key: id, className: cx("sky-pin", here.includes(id) && (beat && beat.risk ? "risk" : beat && beat.human ? "human" : "here")), style: at(fit, ISL[id]) }, /* @__PURE__ */ React.createElement("span", { className: "sky-pin-body" }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 13, stroke: 2.2 })), name), /* @__PURE__ */ React.createElement("span", { className: "stem" })))), /* @__PURE__ */ React.createElement(motion.div, { className: "sky-scrim", "aria-hidden": "true", style: still ? void 0 : { opacity: copyO } }), /* @__PURE__ */ React.createElement(motion.div, { className: "sky-copy", style: still ? void 0 : { opacity: copyO, y: copyY } }, /* @__PURE__ */ React.createElement("h1", { id: "hero-h", className: "sky-h" }, "Every near-expiry carton gets a second chance."), /* @__PURE__ */ React.createElement("p", { className: "sky-sub" }, "AI agents find the best exit for short-dated stock. You say yes once.", !still && " Scroll to follow one batch."), /* @__PURE__ */ React.createElement("div", { className: "sky-ctas" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", onClick: () => onDemo() }, "Book a demo"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary btn-lg", onClick: onFind }, "Find your workspace"))), !still && /* @__PURE__ */ React.createElement("ol", { className: "sky-rail", "aria-label": "The batch's stops" }, BEATS.map((b, i) => /* @__PURE__ */ React.createElement("li", { key: b.id }, /* @__PURE__ */ React.createElement("button", { type: "button", className: cx(i < k && "done", i === k && "on"), "aria-current": i === k ? "step" : void 0, onClick: () => go(i) }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", null, b.t))))), !still && /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, beat && /* @__PURE__ */ React.createElement(motion.div, { key: beat.id, initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.28, ease: EASE }, style: { display: "contents" } }, card(beat))), !still && k === NB - 1 && /* @__PURE__ */ React.createElement("div", { className: "sky-ctl" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: () => go(-1) }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16 }), "From the start"))), still && /* @__PURE__ */ React.createElement("ol", { className: "sky-list", "aria-label": "The batch's stops" }, BEATS.map((b) => /* @__PURE__ */ React.createElement("li", { key: b.id }, card(b)))));
  }
  function PageB({ onFind, onDemo, closeRef }) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(HeroSky, { onFind, onDemo }), /* @__PURE__ */ React.createElement(C.Statement, { text: "The agents watch, verify, price and route. A person says yes once. Then they list, message, negotiate, draft and report, and every rupee and kilo lands in one ledger.", id: "how" }), /* @__PURE__ */ React.createElement(C.Ledger, null), /* @__PURE__ */ React.createElement(C.ExitsRow, null), /* @__PURE__ */ React.createElement(C.Workspace, null), /* @__PURE__ */ React.createElement(C.Plans, { onDemo }), /* @__PURE__ */ React.createElement(C.Close, { onDemo, closeRef }));
  }
  const TAB = window.SC60_TABLE || {
    phone: { x: 0.68, y: 0.35, w: 0.107, h: 0.42 },
    card: { x: 0.49, y: 0.31 },
    kiranas: { x: 0.44, y: 0.585 },
    buyer: { x: 0.635, y: 0.63 },
    godown: { x: 0.25, y: 0.535 },
    kitchen: { x: 0.75, y: 0.72 },
    dump: { x: 0.86, y: 0.7 },
    dropK: { x: 0.47, y: 0.66 },
    dropB: { x: 0.66, y: 0.69 }
  };
  const TAB_AR = 2752 / 1536;
  const WORK = [["lister", 0], ["outreach", 300], ["negotiator", 1700], ["paperwork", 2500], ["impact", 3100]];
  function YesSheet({ phase, lit, onApprove, nudge }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement("div", { className: "ys", role: "group", "aria-label": phase === "idle" || phase === "busy" ? "The plan, waiting for your yes" : "The plan, placed" }, /* @__PURE__ */ React.createElement("div", { className: "ys-top" }, /* @__PURE__ */ React.createElement("span", { className: "who" }, /* @__PURE__ */ React.createElement(Mark, { size: 24 }), /* @__PURE__ */ React.createElement("b", null, "Route Room")), phase === "idle" || phase === "busy" ? /* @__PURE__ */ React.createElement(Badge, { tone: "amber", dot: true }, "Waiting for you") : /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "Placed · 09:40")), phase === "idle" || phase === "busy" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h3", null, "Approve the plan"), /* @__PURE__ */ React.createElement("div", { className: "big" }, /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.net }), /* @__PURE__ */ React.createElement("span", null, "net recovered, ", D.PLAN.pctMRP, "% of MRP")), /* @__PURE__ */ React.createElement("div", { className: "rows" }, /* @__PURE__ */ React.createElement("div", { className: "r" }, /* @__PURE__ */ React.createElement("span", null, "Instead of destroying"), /* @__PURE__ */ React.createElement("b", { className: "red" }, fmt.inr(-BIN))), /* @__PURE__ */ React.createElement("div", { className: "r" }, /* @__PURE__ */ React.createElement("span", null, fmt.num(KL.units), " packs to ", SHOPS, " kiranas"), /* @__PURE__ */ React.createElement("b", null, fmt.inr(KL.net))), /* @__PURE__ */ React.createElement("div", { className: "r" }, /* @__PURE__ */ React.createElement("span", null, fmt.num(ESL.units), " packs on ExpireSoon"), /* @__PURE__ */ React.createElement("b", null, fmt.inr(ESL.net))), /* @__PURE__ */ React.createElement("div", { className: "r" }, /* @__PURE__ */ React.createElement("span", null, "GST input credit kept"), /* @__PURE__ */ React.createElement("b", null, fmt.inr(D.PLAN.itcRetained)))), /* @__PURE__ */ React.createElement("div", { className: "then" }, /* @__PURE__ */ React.createElement("span", null, "Nothing is listed or messaged before this tap.")), /* @__PURE__ */ React.createElement("div", { className: cx("go", nudge && "nudge") }, /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "lg", block: true, icon: "check", loading: phase === "busy", onClick: onApprove }, "Approve · release the agents"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "placed" }, /* @__PURE__ */ React.createElement("svg", { width: "64", height: "64", viewBox: "0 0 96 96", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(motion.circle, { cx: "48", cy: "48", r: "42", fill: "none", stroke: "var(--primary)", strokeWidth: "6", initial: reduce ? false : { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.6, ease: [0.65, 0, 0.35, 1] } }), /* @__PURE__ */ React.createElement(motion.path, { d: "M30 49 L43 62 L67 36", fill: "none", stroke: "var(--primary)", strokeWidth: "7", strokeLinecap: "round", strokeLinejoin: "round", initial: reduce ? false : { pathLength: 0 }, animate: { pathLength: 1 }, transition: { delay: 0.45, duration: 0.4 } })), /* @__PURE__ */ React.createElement("span", { className: "t" }, "Plan placed"), /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.swing, roll: true, from: reduce ? void 0 : 0 }), /* @__PURE__ */ React.createElement("p", null, "better than the bin, on one batch of chips.")), /* @__PURE__ */ React.createElement("div", { className: "work", "aria-label": "The agents at work" }, WORK.map(([id], i) => /* @__PURE__ */ React.createElement("span", { key: id, className: cx("w", i < lit && "on") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: AGENT[id].icon, size: 11, stroke: 2.4 })), /* @__PURE__ */ React.createElement("b", null, AGENT[id].name), /* @__PURE__ */ React.createElement("span", null, "· ", AGENT[id].did))))));
  }
  function HeroYes({ onFind, onDemo }) {
    const night = useTheme().resolved === "dark";
    const reduce = useReducedMotion();
    const app = useApp();
    const desk = app.bp === "desktop";
    const stage = useRef(null);
    const fit = useCover(stage, TAB_AR, desk ? 0.5 : 0.3, desk ? 0.5 : 0.72);
    const [phase, setPhase] = useState(reduce ? "done" : "idle");
    const [run, setRun] = useState(0);
    const [nudge, setNudge] = useState(false);
    const [got, setGot] = useState(reduce ? { kirana: KL.units, expiresoon: AW.units } : { kirana: 0, expiresoon: 0 });
    const lit = useLit(phase === "placed" || phase === "done", WORK.length, 200, 650);
    useEffect(() => {
      if (reduce || phase !== "idle") return;
      const t = setTimeout(() => setNudge(true), 3600);
      return () => clearTimeout(t);
    }, [phase, reduce, run]);
    const dots = useRef([]), paths = useRef({});
    const W = 1e3, H = Math.round(W / TAB_AR);
    const pt = (id) => ({ x: TAB[id].x * W, y: TAB[id].y * H });
    const cardEl = useRef(null);
    const [cardH, setCardH] = useState(440);
    useLayoutEffect(() => {
      const el = cardEl.current;
      if (!el) return;
      const m = () => setCardH(el.offsetHeight);
      m();
      const ro = new ResizeObserver(m);
      ro.observe(el);
      return () => ro.disconnect();
    }, [phase, desk]);
    const cardW = 360, half = fit ? cardH / 2 / fit.ph * H : 0;
    const from = desk ? { x: TAB.card.x * W, y: TAB.card.y * H + half } : { x: W * 0.5, y: 0 };
    const tie = desk && fit ? `M${TAB.card.x * W + cardW / 2 / fit.pw * W} ${TAB.card.y * H} L${(TAB.phone.x - TAB.phone.w / 2) * W} ${TAB.phone.y * H}` : null;
    const routes = { kirana: curve(from, pt("dropK"), desk ? 50 : 40), expiresoon: curve(from, pt("dropB"), desk ? 30 : 30) };
    const DOTS = useMemo(() => {
      const out = [];
      const nk = Math.round(KL.units / 50), ne = Math.round(AW.units / 50);
      let k = 0, e = 0;
      for (let i = 0; i < nk + ne; i++) {
        const toK = k < Math.round((i + 1) * nk / (nk + ne));
        out.push(toK ? "kirana" : "expiresoon");
        toK ? k++ : e++;
      }
      return out;
    }, []);
    const approve = () => {
      setNudge(false);
      setPhase("busy");
      setTimeout(() => {
        setPhase("placed");
        if (!desk && stage.current) stage.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
      }, 650);
    };
    useEffect(() => {
      if (phase !== "placed") return;
      const arrived = { kirana: 0, expiresoon: 0 }, total = { kirana: DOTS.filter((d) => d === "kirana").length, expiresoon: DOTS.filter((d) => d === "expiresoon").length };
      const controls = [];
      DOTS.forEach((id, i) => {
        const path = paths.current[id], c = dots.current[i];
        if (!path || !c) return;
        const L = path.getTotalLength();
        controls.push(animate(0, 1, {
          duration: 0.9,
          delay: 0.3 + i * 0.1,
          ease: [0.45, 0, 0.4, 1],
          onUpdate: (v) => {
            const q = path.getPointAtLength(v * L);
            c.setAttribute("cx", q.x);
            c.setAttribute("cy", q.y);
            c.setAttribute("opacity", v < 0.06 ? v * 16 : v > 0.94 ? Math.max(0, (1 - v) * 16) : 1);
          },
          onComplete: () => {
            arrived[id] += 1;
            setGot({ kirana: Math.round(KL.units * arrived.kirana / total.kirana), expiresoon: Math.round(AW.units * arrived.expiresoon / total.expiresoon) });
            if (arrived.kirana + arrived.expiresoon === DOTS.length) setPhase("done");
          }
        }));
      });
      return () => controls.forEach((c) => c.stop());
    }, [phase]);
    const replay = () => {
      setPhase("idle");
      setGot({ kirana: 0, expiresoon: 0 });
      setRun((r) => r + 1);
    };
    const sheet = /* @__PURE__ */ React.createElement(YesSheet, { key: run, phase, lit, onApprove: approve, nudge });
    const mini = fit && desk ? { left: at(fit, TAB.phone).left, top: at(fit, TAB.phone).top, width: TAB.phone.w * fit.pw, height: TAB.phone.h * fit.ph, "--s": TAB.phone.w * fit.pw / cardW } : null;
    const tags = [
      { id: "kirana", at: "kiranas", name: "Kiranas", icon: "store", line: `${fmt.num(got.kirana)} of ${fmt.num(KL.units)} packs · ${SHOPS} shops` },
      { id: "expiresoon", at: "buyer", name: "A buyer elsewhere", icon: "truck", line: `${fmt.num(got.expiresoon)} of ${fmt.num(AW.units)} packs · ${rate(AW.price)} a pack` },
      { id: "godown", at: "godown", name: "The godown", icon: "warehouse", line: phase === "done" ? "0 packs left at risk" : `${fmt.num(N)} packs at risk` },
      { id: "dump", at: "dump", name: "Landfill", icon: "trash-2", line: phase === "done" ? `${fmt.num(D.PLAN.kg)} kg kept out` : "the bin would cost " + fmt.inr(-BIN) }
    ];
    return /* @__PURE__ */ React.createElement("section", { className: "s60-hero s60-yes", id: "agents", "aria-labelledby": "hero-h" }, /* @__PURE__ */ React.createElement("div", { className: "yes-frame" }, /* @__PURE__ */ React.createElement("div", { className: "yes-copy" }, /* @__PURE__ */ React.createElement("h1", { id: "hero-h", className: "yes-h" }, "Every near-expiry carton gets a second chance."), /* @__PURE__ */ React.createElement("p", { className: "yes-sub" }, "AI agents find the best exit for short-dated stock. You say yes once."), /* @__PURE__ */ React.createElement("div", { className: "yes-ctas" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", onClick: () => onDemo() }, "Book a demo"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-secondary btn-lg", ...linkProps(LINKS.demo) }, "Watch the 6-minute demo"))), !desk && /* @__PURE__ */ React.createElement("div", { className: "yes-phone" }, sheet), /* @__PURE__ */ React.createElement("div", { className: "yes-stage", ref: stage }, /* @__PURE__ */ React.createElement("img", { className: "yes-plate", style: { objectPosition: `${(desk ? 0.5 : 0.3) * 100}% ${(desk ? 0.5 : 0.72) * 100}%` }, src: plate("c-table", night), alt: `A ${night ? "lamp-lit evening" : "morning"} table by a window: a hand holds a phone over a handmade miniature of a snack trade, a tiny godown full of cartons, a lane of kirana shops, a wholesale warehouse with a blue truck, a community kitchen, a closed dump yard in the far corner, a steel tumbler of chai, and a thin glowing green path along the table.` }), fit && /* @__PURE__ */ React.createElement("div", { className: "yes-layer", style: { left: fit.x, top: fit.y, width: fit.pw, height: fit.ph }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none" }, tie && /* @__PURE__ */ React.createElement("path", { className: "yes-tie", d: tie }), Object.entries(routes).map(([id, d]) => /* @__PURE__ */ React.createElement("path", { key: id, ref: (el) => {
      paths.current[id] = el;
    }, className: "yes-path " + id, d })), DOTS.map((id, i) => /* @__PURE__ */ React.createElement("circle", { key: i, ref: (el) => {
      dots.current[i] = el;
    }, className: "yes-dot " + id, r: "9", opacity: "0" }))), tags.map((t) => /* @__PURE__ */ React.createElement("span", { key: t.id, className: cx("yes-tag", t.id, got[t.id] > 0 && "in"), style: at(fit, TAB[t.at]) }, /* @__PURE__ */ React.createElement("span", { className: "yes-tag-body" }, /* @__PURE__ */ React.createElement("b", null, /* @__PURE__ */ React.createElement("i", { className: "ex-dot " + (t.id === "dump" ? "bin" : t.id === "godown" ? "" : t.id), "aria-hidden": "true" }), t.name), /* @__PURE__ */ React.createElement("span", null, t.line)), /* @__PURE__ */ React.createElement("span", { className: "stem" })))), mini && /* @__PURE__ */ React.createElement("div", { className: "yes-mini", style: mini, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "yes-mini-in" }, sheet)), desk && fit && /* @__PURE__ */ React.createElement("div", { className: "yes-phone", ref: cardEl, style: { left: at(fit, TAB.card).left, top: at(fit, TAB.card).top } }, sheet), phase === "done" && /* @__PURE__ */ React.createElement("div", { className: "yes-result", role: "status" }, /* @__PURE__ */ React.createElement("b", null, "Sold, not binned."), /* @__PURE__ */ React.createElement("span", { className: "did" }, fmt.inr(D.ACTUAL.net), " recovered, instead of ", fmt.inr(-BIN), " to destroy it"), !reduce && /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: replay }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16 }), "Replay")))));
  }
  const DAY = [
    { at: "09:00", who: "Watcher", t: `${fmt.num(N)} packs won't sell in time`, p: `The daily check against the date and the quick-commerce gates.`, art: "godown-plain", fig: /* @__PURE__ */ React.createElement("span", { className: "fig red" }, fmt.num(N)) },
    { at: "09:12", who: "Vision", t: "The label, read from the shelf", p: "One photo from the godown; the date matches the export.", art: "phone-scan" },
    { at: "09:30", who: "Valuer · Router", t: "Five exits priced, the bin included", p: `${fmt.num(KL.units)} packs to kiranas, ${fmt.num(AW.units)} to a marketplace buyer.`, art: "kirana-plain", fig: /* @__PURE__ */ React.createElement("span", { className: "fig" }, /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.net })) },
    { at: "09:40", who: "You", t: "One tap", p: "The money on screen, the plan approved. Nothing moved before this.", art: "pack-snack-plain", yes: true },
    { at: "09:41", who: "Outreach", t: /* @__PURE__ */ React.createElement("span", { lang: "hi", className: "hi" }, D.PUSH.offer.title), p: `The scheme to ${SHOPS} kiranas in Hindi: buy ${SCHEME.buy}, get ${SCHEME.free} free, for 48 hours.`, art: "kirana" },
    { at: "09:41", who: "Lister", t: `${fmt.num(AW.units)} packs listed`, p: "On ExpireSoon, in the distributor's name, hidden inside the brand's own territories.", art: "marketplace-bag", violet: true },
    { at: "14:10", who: "Negotiator", t: `A bid countered to ${rate(AW.price)}`, p: `Accepted. A ${Math.round(M.RULES.tokenPct * 100)}% token paid.`, art: "marketplace-bag", fig: /* @__PURE__ */ React.createElement("span", { className: "fig violet" }, /* @__PURE__ */ React.createElement(Money, { value: ES_NET })) },
    { at: "Day 2", who: "Paperwork", t: "The invoice, credit note and GST memo", p: "Each on paper, with who keeps what. The GST input credit stays.", art: "documents" },
    { at: "Day 7", who: "Outreach", t: "The shelf check", p: "On the van's round: what sold, what comes back before the return window.", art: "van" },
    { at: "Day 30", who: "Impact", t: `${fmt.num(D.PLAN.kg)} kg kept out of landfill`, p: "The ledger finance and sustainability both read, with two BRSR rows.", art: "sprout-box", fig: /* @__PURE__ */ React.createElement("span", { className: "fig" }, /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.net })) }
  ];
  function Day() {
    const app = useApp();
    const reduce = useReducedMotion();
    const pinned = app.bp === "desktop" && !reduce;
    const track = useRef(null), strip = useRef(null);
    const [over, setOver] = useState(0);
    useLayoutEffect(() => {
      if (!pinned) return;
      const m = () => setOver(Math.max(0, (strip.current ? strip.current.scrollWidth : 0) - window.innerWidth));
      m();
      window.addEventListener("resize", m);
      return () => window.removeEventListener("resize", m);
    }, [pinned]);
    const { scrollYProgress: p } = useScroll({ target: track, offset: ["start start", "end end"] });
    const x = useTransform(p, [0.06, 0.94], [0, -over]);
    const list = /* @__PURE__ */ React.createElement(motion.ol, { ref: strip, className: "day-strip", "aria-label": "The agents' day", style: pinned ? { x } : void 0 }, DAY.map((m, i) => /* @__PURE__ */ React.createElement("li", { key: i, className: cx("day-m", m.yes && "yes") }, /* @__PURE__ */ React.createElement("div", { className: "when" }, /* @__PURE__ */ React.createElement("time", null, m.at), /* @__PURE__ */ React.createElement("span", { className: cx("chip-agent on", m.yes && "person") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), m.who)), /* @__PURE__ */ React.createElement("div", { className: "body" }, /* @__PURE__ */ React.createElement(Product, { name: m.art, size: 84 }), /* @__PURE__ */ React.createElement("h3", null, m.t), /* @__PURE__ */ React.createElement("p", null, m.p), m.fig))));
    return /* @__PURE__ */ React.createElement("section", { id: "how", className: cx("s60-day", pinned && "pinned"), "aria-labelledby": "day-h" }, /* @__PURE__ */ React.createElement("div", { className: "day-track", ref: track }, /* @__PURE__ */ React.createElement("div", { className: "day-stage" }, /* @__PURE__ */ React.createElement("header", { className: "day-head" }, /* @__PURE__ */ React.createElement("h2", { id: "day-h", className: "sec-h plain" }, "One batch, one day. The agents did the running around."), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, "From the Watcher's alert at 09:00 to the ledger a month on, with one human tap at 09:40.")), list)));
  }
  function PageC({ onFind, onDemo, closeRef }) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(HeroYes, { onFind, onDemo }), /* @__PURE__ */ React.createElement(C.Statement, { text: "Nothing is listed, messaged or shipped before your tap. After it, the agents do the running around, in the distributor's name, and show their work." }), /* @__PURE__ */ React.createElement(Day, null), /* @__PURE__ */ React.createElement(C.ExitsRow, null), /* @__PURE__ */ React.createElement(C.Ledger, null), /* @__PURE__ */ React.createElement(C.Workspace, null), /* @__PURE__ */ React.createElement(C.Plans, { onDemo }), /* @__PURE__ */ React.createElement(C.Close, { onDemo, closeRef }));
  }
  const PAGES = { a: PageA, b: PageB, c: PageC };
  const SECTIONS = OPT === "a" ? [["how", "How it works"], ["work", "Agents"], ["teams", "For teams"], ["pricing", "Pricing"]] : [["how", "How it works"], ["exits", "The exits"], ["teams", "For teams"], ["pricing", "Pricing"]];
  function Site() {
    const Page = PAGES[OPT] || PageC;
    return /* @__PURE__ */ React.createElement(C.Shell, { option: OPT, sections: SECTIONS }, (ctx) => /* @__PURE__ */ React.createElement(Page, { ...ctx }));
  }
  C.mount(Site);
})();

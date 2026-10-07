(function() {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo } = React;
  const { useReducedMotion, motion, useScroll, useInView, useMotionValueEvent, AnimatePresence, animate } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY;
  const fmt = M.fmt;
  const { cx, Icon, Button, Badge, Mark, Money, Roll, Product, GateChips, useApp, useTheme } = K;
  const C = window.SC60, O = window.SC60_OPTS;
  const { FIG, AGENTS, AGENT, LINKS, IMG, EASE, useLit, AgentChips } = C;
  const { KL, ESL, AW, BATCH, DIST, SKU, SHOPS, BIN, ES_NET, N, row, rate, SCHEME } = FIG;
  const VAR = String(window.SC60_R2 || "2");
  const S60 = window.SC60_IMG || "./";
  const plate = (name, night) => S60 + name + (night ? "-night" : "") + ".webp";
  const TAB_AR = 2752 / 1536;
  const PHONE = { x: 0.68, y: 0.35, w: 0.107, h: 0.42 };
  const POST = {
    data: { x: 0.11, y: 0.6, side: "left" },
    watcher: { x: 0.24, y: 0.42 },
    vision: { x: 0.36, y: 0.6 },
    valuer: { x: 0.17, y: 0.74, side: "left" },
    router: { x: 0.33, y: 0.78 },
    you: { x: 0.62, y: 0.38, side: "left" },
    outreach: { x: 0.48, y: 0.52 },
    lister: { x: 0.635, y: 0.5 },
    negotiator: { x: 0.6, y: 0.74, side: "left" },
    paperwork: { x: 0.77, y: 0.56 },
    impact: { x: 0.86, y: 0.63 }
  };
  const WHERE = { data: "at the godown", watcher: "at the godown", vision: "at the godown", valuer: "at the godown", router: "at the godown", you: "on your phone", outreach: "at the kiranas", lister: "at the buyer's bay", negotiator: "at the buyer's truck", paperwork: "on your phone", impact: "at the landfill" };
  const TAGS = [
    { id: "kirana", at: { x: 0.44, y: 0.6 }, name: "Kiranas", line: (got) => `${fmt.num(got.kirana)} of ${fmt.num(KL.units)} packs · ${SHOPS} shops` },
    { id: "expiresoon", at: { x: 0.69, y: 0.64 }, name: "A buyer elsewhere", line: (got) => `${fmt.num(got.expiresoon)} of ${fmt.num(AW.units)} packs · ${rate(AW.price)} a pack` },
    { id: "dump", at: { x: 0.9, y: 0.72 }, name: "Landfill", line: (got, done) => done ? `${fmt.num(D.PLAN.kg)} kg kept out` : `the bin would cost ${fmt.inr(-BIN)}` }
  ];
  const DROP = { kirana: { x: 0.47, y: 0.66 }, expiresoon: { x: 0.66, y: 0.69 } };
  const ORDER = ["data", "watcher", "vision", "valuer", "router", "you", "outreach", "lister", "negotiator", "paperwork", "impact"];
  const NS = ORDER.length, YES = ORDER.indexOf("you"), OUT = ORDER.indexOf("outreach"), LIST = ORDER.indexOf("lister");
  const PACE = { agent: 1400, you: 1800 };
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
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "hi", lang: "hi" }, D.PUSH.offer.title), /* @__PURE__ */ React.createElement("span", { className: "k" }, "to ", /* @__PURE__ */ React.createElement("b", null, SHOPS), " kiranas in Hindi · buy ", SCHEME.buy, ", get ", SCHEME.free, " free · 48 hours"));
      case "lister":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Product, { name: "marketplace-bag", size: 56 }), /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("b", null, fmt.num(AW.units)), " packs listed in the distributor's name · reserve ", rate(M.RULES.negotiation.reservePerUnit)));
      case "negotiator":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "k" }, "A bid of ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(13))), /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 16 }), /* @__PURE__ */ React.createElement("span", { className: "k" }, "countered to ", /* @__PURE__ */ React.createElement("b", null, rate(AW.price)), ", accepted"), /* @__PURE__ */ React.createElement("span", { className: "k" }, "· token ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(AW.token))));
      case "paperwork":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Product, { name: "documents", size: 56 }), /* @__PURE__ */ React.createElement("span", { className: "k" }, "The distributor's invoice · the brand's credit note ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(D.SUPPORT.total)), " · the GST memo"));
      case "impact":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "num" }, fmt.num(D.PLAN.kg), " kg"), /* @__PURE__ */ React.createElement("span", { className: "k" }, "kept out of landfill · ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(D.ACTUAL.net)), " recovered · 0 cartons destroyed"));
      default:
        return null;
    }
  }
  const AFTER = ["outreach", "lister", "negotiator", "paperwork", "impact"];
  function PhoneScreen({ placed, lit }) {
    return /* @__PURE__ */ React.createElement("div", { className: "ps", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "top" }, /* @__PURE__ */ React.createElement("span", { className: "who" }, /* @__PURE__ */ React.createElement(Mark, { size: 24 }), /* @__PURE__ */ React.createElement("b", null, "Route Room")), placed ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "Placed · 09:40") : /* @__PURE__ */ React.createElement(Badge, { tone: "amber", dot: true }, "Waiting for you")), placed ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "placed" }, /* @__PURE__ */ React.createElement("span", { className: "t" }, "Plan placed"), /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.swing }), /* @__PURE__ */ React.createElement("p", null, "better than the bin, on one batch of chips.")), /* @__PURE__ */ React.createElement("div", { className: "work" }, AFTER.map((id, i) => /* @__PURE__ */ React.createElement("span", { key: id, className: cx("w", i < lit && "on") }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: AGENT[id].icon, size: 11, stroke: 2.4 })), /* @__PURE__ */ React.createElement("b", null, AGENT[id].name), /* @__PURE__ */ React.createElement("span", null, "· ", AGENT[id].did))))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h4", null, "Approve the plan"), /* @__PURE__ */ React.createElement("div", { className: "big" }, /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.net }), /* @__PURE__ */ React.createElement("span", null, "net recovered, ", D.PLAN.pctMRP, "% of MRP")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "r" }, /* @__PURE__ */ React.createElement("span", null, "Instead of destroying"), /* @__PURE__ */ React.createElement("b", { className: "red" }, fmt.inr(-BIN))), /* @__PURE__ */ React.createElement("div", { className: "r" }, /* @__PURE__ */ React.createElement("span", null, fmt.num(KL.units), " packs to ", SHOPS, " kiranas"), /* @__PURE__ */ React.createElement("b", null, fmt.inr(KL.net))), /* @__PURE__ */ React.createElement("div", { className: "r" }, /* @__PURE__ */ React.createElement("span", null, fmt.num(ESL.units), " packs on ExpireSoon"), /* @__PURE__ */ React.createElement("b", null, fmt.inr(ESL.net)))), /* @__PURE__ */ React.createElement("span", { className: "btn btn-approve btn-lg" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 18 }), "Approve · release the agents")));
  }
  function TableScene() {
    const night = useTheme().resolved === "dark";
    const reduce = useReducedMotion();
    const app = useApp();
    const desk = app.bp === "desktop";
    const focus = VAR !== "1", scroll = VAR === "3";
    const sec = useRef(null), track = useRef(null), stage = useRef(null);
    const fit = useCover(stage, TAB_AR, desk ? 0.5 : 0.42, 0.5);
    const seen = useInView(stage, { amount: 0.6 });
    const [s, setS] = useState(reduce ? NS : -1);
    const [hold, setHold] = useState(false);
    const [run, setRun] = useState(0);
    useEffect(() => {
      if (scroll || reduce) return;
      if (s === -1 && seen) setS(0);
    }, [seen, scroll, reduce, s]);
    useEffect(() => {
      if (scroll || reduce || hold || !seen || s < 0 || s >= NS) return;
      const t = setTimeout(() => setS(s + 1), ORDER[s] === "you" ? PACE.you : PACE.agent);
      return () => clearTimeout(t);
    }, [s, hold, seen, scroll, reduce]);
    const { scrollYProgress: p } = useScroll({ target: track, offset: ["start start", "end end"] });
    useMotionValueEvent(p, "change", (v) => {
      if (!scroll || reduce) return;
      const k = Math.min(NS, Math.floor(v * (NS + 2)) - 1);
      if (k !== s) setS(Math.max(-1, k));
    });
    const go = (i) => {
      if (scroll) {
        const el = track.current;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const h = el.offsetHeight - window.innerHeight;
        window.scrollTo({ top: top + h * ((i + 1.5) / (NS + 2)), behavior: reduce ? "auto" : "smooth" });
      } else {
        setHold(true);
        setS(i);
      }
    };
    const replay = () => {
      setHold(false);
      setGot({ kirana: 0, expiresoon: 0 });
      setRun((r) => r + 1);
      if (scroll) go(-1);
      else setS(0);
    };
    const agent = s >= 0 && s < NS ? ORDER[s] : null;
    const done = s >= NS;
    const working = agent != null;
    const W = 1e3, H = Math.round(W / TAB_AR);
    let cam = { tx: 0, ty: 0, sc: 1 };
    if (fit && working) {
      const sc = focus ? desk ? 1.6 : 1.45 : desk ? 1.35 : 1.3;
      const f = at(fit, POST[agent]);
      const cx2 = fit.w * 0.5, cy = fit.h * (focus ? 0.42 : 0.46);
      let tx = cx2 - f.left * sc, ty = cy - f.top * sc;
      tx = Math.min(0, Math.max(fit.w - fit.w * sc, tx));
      ty = Math.min(0, Math.max(fit.h - fit.h * sc, ty));
      cam = { tx, ty, sc };
    }
    const iz = 1 / cam.sc;
    const dots = useRef([]), paths = useRef({});
    const [got, setGot] = useState(reduce ? { kirana: KL.units, expiresoon: AW.units } : { kirana: 0, expiresoon: 0 });
    const from = { x: PHONE.x * W, y: (PHONE.y + PHONE.h / 2) * H };
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
    const mini = fit ? { left: at(fit, PHONE).left, top: at(fit, PHONE).top, width: PHONE.w * fit.pw, height: PHONE.h * fit.ph, "--s": PHONE.w * fit.pw / 360 } : null;
    const card = a && /* @__PURE__ */ React.createElement("div", { className: cx("tb-focus", human && "human"), role: "group", "aria-live": "polite" }, /* @__PURE__ */ React.createElement("span", { className: "icn", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 26, stroke: 2 })), /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("span", { className: "n" }, s + 1, " of ", NS), /* @__PURE__ */ React.createElement("h3", null, a.name), /* @__PURE__ */ React.createElement("span", null, WHERE[agent])), /* @__PURE__ */ React.createElement("p", null, a.did), /* @__PURE__ */ React.createElement("div", { className: "frag" }, /* @__PURE__ */ React.createElement(Frag, { id: agent })), desk && /* @__PURE__ */ React.createElement("div", { className: "rail", role: "list", "aria-label": "The agents, in order" }, ORDER.map((id, i) => /* @__PURE__ */ React.createElement("button", { key: id, type: "button", className: cx(i < s && "on", AGENT[id].human && "human"), "aria-current": i === s ? "step" : void 0, onClick: () => go(i) }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: AGENT[id].icon, size: 10, stroke: 2.4 })), AGENT[id].name))));
    const tip = a && fit && /* @__PURE__ */ React.createElement("div", { key: agent + run, className: cx("tb-tip", human && "human", POST[agent].y < 0.3 && "below"), style: { ...at(fit, POST[agent]), "--iz": iz, animationDuration: (human ? PACE.you : PACE.agent) + "ms", animationPlayState: hold ? "paused" : "running" } }, /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 12, stroke: 2.4 })), /* @__PURE__ */ React.createElement("b", null, a.name), /* @__PURE__ */ React.createElement("span", null, WHERE[agent])), /* @__PURE__ */ React.createElement("p", null, a.did), /* @__PURE__ */ React.createElement("span", { className: "time", "aria-hidden": "true", style: { animationDuration: "inherit", animationPlayState: "inherit" } }));
    const text = `Five exits, one batch. Ten agents at work.`;
    return /* @__PURE__ */ React.createElement("section", { id: "agents-at-work", className: cx("s60-table", focus && "focus", scroll && "scroll"), "aria-labelledby": "tb-h", ref: sec }, /* @__PURE__ */ React.createElement("header", { className: "tb-head" }, /* @__PURE__ */ React.createElement("h2", { id: "tb-h", className: "sec-h plain" }, text), /* @__PURE__ */ React.createElement("p", { className: "sec-sub" }, fmt.num(N), " packs of masala chips that won't sell in the ", BATCH.daysLeft, " days they have left, on the table. The agents work the batch stop by stop; a person says yes once; the packs leave for the kiranas and a buyer, and nothing goes to the bin.", scroll && !reduce ? " Scroll to follow them." : "")), /* @__PURE__ */ React.createElement("div", { className: "tb-track", ref: track }, /* @__PURE__ */ React.createElement("div", { className: cx("tb-stage", working && "working"), ref: stage }, /* @__PURE__ */ React.createElement("div", { className: "tb-world", style: { transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.sc})` } }, /* @__PURE__ */ React.createElement("img", { className: "tb-plate", style: { objectPosition: `${(desk ? 0.5 : 0.42) * 100}% 50%` }, src: plate("c-table", night), alt: `A ${night ? "lamp-lit evening" : "morning"} table by a window: a hand holds a phone over a handmade miniature of a snack trade, a tiny godown full of cartons, a lane of kirana shops, a wholesale warehouse with a blue truck, a community kitchen, a closed dump yard in the far corner, a steel tumbler of chai, and a thin glowing green path along the table.` }), fit && /* @__PURE__ */ React.createElement("div", { className: "tb-layer", style: { left: fit.x, top: fit.y, width: fit.pw, height: fit.ph } }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", "aria-hidden": "true" }, Object.entries(routes).map(([id, d]) => /* @__PURE__ */ React.createElement("path", { key: id, ref: (el) => {
      paths.current[id] = el;
    }, className: "tb-path", d })), DOTS.map((id, i) => /* @__PURE__ */ React.createElement("circle", { key: i + ":" + run, ref: (el) => {
      dots.current[i] = el;
    }, className: "tb-dot " + id, r: "9", opacity: "0" }))), mini && /* @__PURE__ */ React.createElement("div", { className: "tb-mini", style: mini, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "tb-mini-in" }, /* @__PURE__ */ React.createElement(PhoneScreen, { placed: s > YES || done, lit: done ? AFTER.length : Math.max(0, s - YES) }))), TAGS.map((t) => /* @__PURE__ */ React.createElement("span", { key: t.id, className: cx("tb-tag", t.id, got[t.id] > 0 && "in"), style: { ...at(fit, t.at), "--iz": iz }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "tb-tag-body" }, /* @__PURE__ */ React.createElement("b", null, /* @__PURE__ */ React.createElement("i", { className: "ex-dot " + (t.id === "dump" ? "bin" : t.id) }), t.name), /* @__PURE__ */ React.createElement("span", null, t.line(got, done))), /* @__PURE__ */ React.createElement("span", { className: "stem" }))), /* @__PURE__ */ React.createElement("ul", { className: "sr-only", "aria-label": "The agents at their posts" }, ORDER.map((id) => /* @__PURE__ */ React.createElement("li", { key: id }, AGENT[id].name, ", ", WHERE[id], ": ", AGENT[id].did))), ORDER.map((id, i) => {
      const ag = AGENT[id];
      const st = i < s || done ? "on" : i === s ? "now on" : "later";
      return /* @__PURE__ */ React.createElement("span", { key: id, className: cx("tb-node", st, ag.human && "human", POST[id].side === "left" && "left"), style: { ...at(fit, POST[id]), "--iz": iz }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", { className: "dot" }, /* @__PURE__ */ React.createElement(Icon, { name: ag.icon, size: 13, stroke: 2.4 })), /* @__PURE__ */ React.createElement("span", { className: "name" }, ag.name));
    }), !focus && tip)), /* @__PURE__ */ React.createElement("div", { className: "tb-shade", "aria-hidden": "true" }), focus && /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, a && /* @__PURE__ */ React.createElement(motion.div, { key: agent, initial: reduce ? false : { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.3, ease: EASE }, style: { display: "contents" } }, card)), !focus && working && /* @__PURE__ */ React.createElement("div", { className: cx("tb-cap", human && "human"), role: "status" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "step", "aria-label": "Previous agent", disabled: s <= 0, onClick: () => go(s - 1) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 18 })), /* @__PURE__ */ React.createElement("span", { className: "text" }, /* @__PURE__ */ React.createElement("span", { className: "n" }, s + 1, " of ", NS), /* @__PURE__ */ React.createElement("b", null, a.name), /* @__PURE__ */ React.createElement("span", { className: "did" }, a.did)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "step", "aria-label": "Next agent", disabled: s >= NS - 1, onClick: () => go(s + 1) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18 }))), done && /* @__PURE__ */ React.createElement("div", { className: "tb-result", role: "status" }, /* @__PURE__ */ React.createElement("b", null, "Sold, not binned."), /* @__PURE__ */ React.createElement("span", { className: "did" }, fmt.inr(D.ACTUAL.net), " recovered, instead of ", fmt.inr(-BIN), " to destroy it"), !reduce && /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", onClick: replay }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16 }), "Replay")), !reduce && !scroll && working && /* @__PURE__ */ React.createElement("div", { className: "tb-ctl" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "replay", "aria-pressed": hold, onClick: () => setHold((h) => !h) }, /* @__PURE__ */ React.createElement(Icon, { name: hold ? "play" : "pause", size: 16 }), hold ? "Play" : "Pause")), scroll && !reduce && /* @__PURE__ */ React.createElement("ol", { className: "tb-rail", "aria-label": "The agents, in order" }, ORDER.map((id, i) => /* @__PURE__ */ React.createElement("li", { key: id }, /* @__PURE__ */ React.createElement("button", { type: "button", className: cx(i < s && "on", AGENT[id].human && "human"), "aria-current": i === s ? "step" : void 0, onClick: () => go(i) }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: AGENT[id].icon, size: 10, stroke: 2.4 })), /* @__PURE__ */ React.createElement("span", null, AGENT[id].name))))))));
  }
  function Page({ onFind, onDemo, closeRef }) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(O.HeroFilm, { onDemo }), /* @__PURE__ */ React.createElement(C.Statement, { text: "Short-dated stock that quick commerce sent back. Priced to every exit, the bin included. Sold in the days it has left.", id: "how" }), /* @__PURE__ */ React.createElement(TableScene, null), /* @__PURE__ */ React.createElement(C.Chapter, { id: "watch", tone: "green", title: "Spot it while there is time to sell", lede: "Every morning at 09:00 the Watcher checks each batch against its date and the quick-commerce shelf-life rules. Vision reads the label photo from the godown to be sure.", who: C.agentsAt("connect", "detect", "verify") }, /* @__PURE__ */ React.createElement(C.AlertCard, null)), /* @__PURE__ */ React.createElement(C.Chapter, { id: "price", tone: "sunken", title: "Price every exit, the bin included", lede: `Kiranas on a ${SCHEME.free}-free-with-${SCHEME.buy} scheme, a clearance marketplace, a staff sale at the godown, a food bank: the Valuer prices each against the true cost of destroying the stock, and the Router splits the batch within each exit's limits.`, who: C.agentsAt("value", "decide") }, /* @__PURE__ */ React.createElement(C.PricesCard, null)), /* @__PURE__ */ React.createElement(C.Chapter, { id: "yes", tone: "amber", title: "Say yes once.", lede: "A person approves the plan with the money on screen. Nothing is listed, messaged or shipped before that tap.", who: ["a person"], person: true }, /* @__PURE__ */ React.createElement(C.PlanCard, null)), /* @__PURE__ */ React.createElement(C.Chapter, { id: "work", tone: "night", title: "The agents do the rest.", lede: "They send the kirana offers in Hindi, list the lot in the distributor's name, answer bids, draft the invoice, credit note and GST memo, and post the impact.", who: C.agentsAt("execute", "settle", "report"), wide: true }, /* @__PURE__ */ React.createElement(C.WorkCards, null)), /* @__PURE__ */ React.createElement(C.Ledger, null), /* @__PURE__ */ React.createElement(C.Workspace, null), /* @__PURE__ */ React.createElement(C.Plans, { onDemo }), /* @__PURE__ */ React.createElement(C.Close, { onDemo, closeRef }));
  }
  const SECTIONS = [["how", "How it works"], ["agents-at-work", "Agents"], ["teams", "For teams"], ["pricing", "Pricing"]];
  function Site() {
    return /* @__PURE__ */ React.createElement(C.Shell, { option: "a", sections: SECTIONS }, (ctx) => /* @__PURE__ */ React.createElement(Page, { ...ctx }));
  }
  C.mount(Site);
})();

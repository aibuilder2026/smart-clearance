(function() {
  const { useState, useEffect, useRef, useMemo } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Button, Kbd, Money, Mark, Wordmark, WorkspaceMark, ThemeProvider, AppRoot, NoticeHost, ModeMenuButton, useApp } = K;
  const { ACTS } = window.SC167_ACTS;
  const V = window.SC167_DEV;
  const WS = D.WORKSPACE;
  const img = (n) => window.SC3_IMG + n + ".webp";
  const TOKEN = { type: "spring", stiffness: 170, damping: 24, mass: 1 };
  const total = ACTS.reduce((t, a) => t + a.minutes, 0);
  const AI = Object.fromEntries(ACTS.map((a, i) => [a.id, i]));
  const I = [450, 380];
  const GEO = {
    console: { d: "M70 150 H390 L450 210 V380", st: [[70, 150], [150, 150], [230, 150], [310, 150], [390, 150], [450, 290]], side: ["up", "up", "up", "up", "up", "left"] },
    chips: { d: "M450 380 L570 260 H1156", st: [[600, 260], [660, 260], [720, 260], [780, 260], [840, 260], [900, 260], [966, 260], [1032, 260], [1098, 260]], side: "up", end: [1156, 260], out: [1174, 0, "start"] },
    slow: { d: "M900 260 L988 348 H1316", st: [[1020, 348], [1080, 348], [1140, 348], [1200, 348], [1260, 348]], side: "down", end: [1316, 348], out: [1330, 64, "end"] },
    mango: { d: "M450 380 L570 500 H1070", st: [[600, 500], [680, 500], [760, 500], [840, 500], [920, 500], [1e3, 500]], side: "down", end: [1070, 500], out: [1088, 0, "start"] }
  };
  const SHORT = { "Munchly's setup": "Setup", "Agent setup": "Agents", "Existing clients": "Clients", "A new client": "New client", "Expiry day": "Expiry", "The second yes": "Yes" };
  const short = (t) => SHORT[t] || t;
  const BADGE = { console: "Smart-Clearance's console", chips: "every pack sold", slow: "destroyed at the godown, on a second yes", mango: "kiranas, a staff sale, a food bank" };
  const toneOf = (st) => st.id === "expiry" ? "red" : st.amber ? "amber" : null;
  function RouteMap({ active, hot, setHot, pos, onPick, draw, compact }) {
    const reduce = useReducedMotion();
    const animate = draw && !reduce;
    const lit = (id) => id === active || id === hot || (id === "chips" && (active === "slow" || hot === "slow") ? "shared" : false);
    const stateOf = (ai, si) => pos ? ai < pos.a || ai === pos.a && si < pos.s ? "done" : ai === pos.a && si === pos.s ? "now" : null : null;
    const lineOrder = ["console", "mango", "chips", "slow"];
    return /* @__PURE__ */ React.createElement("svg", { className: cx("rb-map", compact && "compact"), viewBox: "40 36 1380 640", role: "group", "aria-label": "The demo's route map" }, lineOrder.map((id, k) => {
      const on = lit(id) === true;
      return /* @__PURE__ */ React.createElement("g", { key: id, onMouseEnter: () => setHot && setHot(id), onMouseLeave: () => setHot && setHot(null) }, /* @__PURE__ */ React.createElement(motion.path, { d: GEO[id].d, className: cx("rb-line-shadow", on && "on"), initial: animate ? { pathLength: 0 } : false, animate: { pathLength: 1 }, transition: { duration: 0.9, delay: 0.12 * k, ease: [0.22, 1, 0.36, 1] } }), /* @__PURE__ */ React.createElement(motion.path, { d: GEO[id].d, className: cx("rb-line", on && "on"), initial: animate ? { pathLength: 0 } : false, animate: { pathLength: 1 }, transition: { duration: 0.9, delay: 0.12 * k, ease: [0.22, 1, 0.36, 1] } }));
    }), lit("chips") === "shared" && /* @__PURE__ */ React.createElement("path", { d: "M450 380 L570 260 H900", className: "rb-line on shared" }), ["console", "chips", "slow", "mango"].map((id) => {
      const a = ACTS[AI[id]];
      const g = GEO[id];
      return a.stations.map((st, si) => {
        const [x, y] = g.st[si];
        const side = Array.isArray(g.side) ? g.side[si] : g.side;
        const s = stateOf(AI[id], si);
        const tone = toneOf(st);
        const ly = side === "up" ? y - 23 : side === "down" ? y + 35 : y + 5;
        const lx = side === "left" ? x - 18 : x;
        const on = lit(id) === true || id === "chips" && lit("chips") === "shared" && si <= 5;
        return /* @__PURE__ */ React.createElement(
          "g",
          {
            key: id + st.id,
            className: cx("rb-st", on && "on", s, tone),
            role: "button",
            tabIndex: compact ? -1 : 0,
            "aria-label": `${a.title}${id === "slow" ? ", the slow week" : ""}: ${st.title}`,
            onClick: () => onPick && onPick(AI[id], si),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick && onPick(AI[id], si);
              }
            }
          },
          /* @__PURE__ */ React.createElement(motion.circle, { cx: x, cy: y, r: 9, initial: animate ? { scale: 0, opacity: 0 } : false, animate: { scale: 1, opacity: 1 }, transition: { delay: 0.5 + 0.12 * lineOrder.indexOf(id) + si * 0.03, duration: 0.24 }, style: { transformOrigin: `${x}px ${y}px` } }),
          s === "done" && /* @__PURE__ */ React.createElement("path", { d: `M${x - 4} ${y} l3 3 l5 -6`, className: "rb-tick" }),
          !compact && /* @__PURE__ */ React.createElement("text", { x: lx, y: ly, textAnchor: side === "left" ? "end" : "middle", className: "rb-lbl" }, short(st.title))
        );
      });
    }), /* @__PURE__ */ React.createElement("g", { className: "rb-hub" }, /* @__PURE__ */ React.createElement("circle", { cx: I[0], cy: I[1], r: 24 }), /* @__PURE__ */ React.createElement("foreignObject", { x: I[0] - 14, y: I[1] - 14, width: 28, height: 28 }, /* @__PURE__ */ React.createElement("div", { className: "rb-hub-mark" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 28 }))), !compact && /* @__PURE__ */ React.createElement("text", { x: I[0] - 34, y: I[1] + 5, textAnchor: "end", className: "rb-lbl strong" }, "Munchly's workspace")), !compact && ["chips", "slow", "mango"].map((id, k) => {
      const a = ACTS[AI[id]];
      const [x, y] = GEO[id].end;
      const up = id === "chips";
      return /* @__PURE__ */ React.createElement(motion.g, { key: id, className: cx("rb-end", a.outcome.red && "red", lit(id) === true && "on"), initial: animate ? { opacity: 0, y: 6 } : false, animate: { opacity: 1, y: 0 }, transition: { delay: 1.1 + 0.12 * k, duration: 0.42 } }, /* @__PURE__ */ React.createElement("circle", { cx: x, cy: y, r: 11, className: "rb-pin" }), animate && /* @__PURE__ */ React.createElement(motion.circle, { cx: x, cy: y, r: 11, className: "rb-ping", initial: { scale: 1, opacity: 0.6 }, animate: { scale: 2.4, opacity: 0 }, transition: { delay: 1.3 + 0.12 * k, duration: 1.1, repeat: 1 }, style: { transformOrigin: `${x}px ${y}px` } }), (() => {
        const [ox, dy, anchor] = GEO[id].out;
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("text", { x: ox, y: y + dy + 9, textAnchor: anchor, className: "rb-out" }, fmt.inr(a.outcome.value)), /* @__PURE__ */ React.createElement("text", { x: ox, y: y + dy + 28, textAnchor: anchor, className: "rb-out-sub" }, id === "chips" ? "every pack sold" : id === "slow" ? `${window.SC167_ACTS.SLOW.left} destroyed, on a yes` : `${D.MANGO_FB} meals · all placed`));
      })());
    }), !compact && [["console", 56, 46], ["chips", 588, 152], ["slow", 790, 400], ["mango", 588, 558]].map(([id, x, y]) => {
      const a = ACTS[AI[id]];
      return /* @__PURE__ */ React.createElement("foreignObject", { key: id, x: x - 10, y: y - 10, width: 380, height: 76 }, /* @__PURE__ */ React.createElement("div", { className: "rb-badge-pad" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("rb-badge", lit(id) === true && "on"), onMouseEnter: () => setHot && setHot(id), onMouseLeave: () => setHot && setHot(null), onFocus: () => setHot && setHot(id), onBlur: () => setHot && setHot(null), onClick: () => onPick && onPick(AI[id], 0) }, a.console ? /* @__PURE__ */ React.createElement("span", { className: "rb-badge-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 18 })) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "rb-badge-t" }, /* @__PURE__ */ React.createElement("b", null, a.title, id === "slow" ? " · a slow week" : ""), /* @__PURE__ */ React.createElement("span", null, BADGE[id], " · ", a.minutes, " min")))));
    }), pos && (() => {
      const a = ACTS[pos.a];
      const [x, y] = GEO[a.id].st[pos.s];
      return /* @__PURE__ */ React.createElement(motion.g, { className: "rb-token", initial: false, animate: { x, y }, transition: reduce ? { duration: 0 } : TOKEN }, /* @__PURE__ */ React.createElement("circle", { r: 17 }), /* @__PURE__ */ React.createElement("foreignObject", { x: -13, y: -13, width: 26, height: 26 }, /* @__PURE__ */ React.createElement("div", { className: "rb-token-in" }, a.console ? /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 15 }) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }))));
    })());
  }
  function PhoneLines({ onPick }) {
    return /* @__PURE__ */ React.createElement("ol", { className: "rb-plines", "aria-label": "The lines" }, ["console", "chips", "slow", "mango"].map((id) => {
      const a = ACTS[AI[id]];
      return /* @__PURE__ */ React.createElement("li", { key: id, className: cx("rb-pline", id === "slow" && "branch") }, id === "slow" && /* @__PURE__ */ React.createElement("svg", { className: "rb-pline-branch", viewBox: "0 0 16 40", preserveAspectRatio: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M4 0 V28 Q4 38 14 38", vectorEffect: "non-scaling-stroke" })), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => onPick(AI[id], 0), className: "rb-pline-btn" }, /* @__PURE__ */ React.createElement("span", { className: "rb-pline-head" }, a.console ? /* @__PURE__ */ React.createElement("span", { className: "rb-badge-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 18 })) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "rb-badge-t" }, /* @__PURE__ */ React.createElement("b", null, a.title, id === "slow" ? " · a slow week" : ""), /* @__PURE__ */ React.createElement("span", null, id === "slow" ? "branches off the chips after the yes" : BADGE[id], " · ", a.minutes, " min"))), /* @__PURE__ */ React.createElement("span", { className: "rb-pline-rail" }, a.stations.map((st) => /* @__PURE__ */ React.createElement("i", { key: st.id, className: toneOf(st) || "" })), /* @__PURE__ */ React.createElement("em", { className: a.outcome.red ? "red" : "" })), /* @__PURE__ */ React.createElement("span", { className: "rb-pline-out" }, a.outcome.value != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", null, fmt.inr(a.outcome.value)), " ", id === "slow" ? `· ${window.SC167_ACTS.SLOW.left} destroyed, on a yes` : id === "mango" ? `· ${D.MANGO_FB} meals` : "· every pack sold") : "Ends at Munchly's workspace")));
    }));
  }
  function Start({ onPick, onAll }) {
    const [hot, setHot] = useState(null);
    const reduce = useReducedMotion();
    const app = useApp();
    const h = hot && ACTS[AI[hot]];
    return /* @__PURE__ */ React.createElement("div", { className: "rb-start" }, /* @__PURE__ */ React.createElement("div", { className: "rb-intro" }, /* @__PURE__ */ React.createElement("div", { className: "rb-intro-l" }, /* @__PURE__ */ React.createElement("span", { className: "rb-eyebrow" }, "Guided demo · about ", total, " minutes"), /* @__PURE__ */ React.createElement("h1", { className: "rb-title" }, "Three batches. Three endings.")), /* @__PURE__ */ React.createElement("div", { className: "rb-intro-r" }, /* @__PURE__ */ React.createElement("p", { className: "rb-lede" }, "The platform sets Munchly Foods up. Then a batch of chips sells out, a batch of Mango Drink feeds Hyderabad, and a slow week ends at the bin, on a second yes. Every screen is the real app, on sample data."), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 18, alignItems: "center" } }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "play", onClick: onAll }, "Play the whole route"), /* @__PURE__ */ React.createElement("ul", { className: "rb-legend", "aria-label": "How to read the map" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "lg-green" }), "The agents' work"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "lg-amber" }), "A person's yes"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("i", { className: "lg-red" }), "The bin"))))), app.w < 768 ? /* @__PURE__ */ React.createElement(PhoneLines, { onPick }) : /* @__PURE__ */ React.createElement("div", { className: "rb-mapwrap" }, /* @__PURE__ */ React.createElement(RouteMap, { hot, setHot, onPick, draw: true }), /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, h && /* @__PURE__ */ React.createElement(motion.div, { key: h.id, className: "rb-peek", initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.18 } }, /* @__PURE__ */ React.createElement("b", null, h.title, h.id === "slow" ? " · a slow week" : ""), /* @__PURE__ */ React.createElement("span", null, h.place), /* @__PURE__ */ React.createElement("span", { className: "rb-peek-screens" }, [...new Set(h.stations.flatMap((s) => s.beats.map((b) => b.screen.split(" · ")[0])).filter((x) => !/Lock screen|Sign-in/.test(x)))].slice(0, 8).join(" · "))))));
  }
  function Strip({ p, onMap }) {
    const reduce = useReducedMotion();
    const a = p.act;
    const n = a.stations.length;
    const along = Math.min(n - 1, p.pos.s + Math.min(1, (p.pos.b + (p.pos.applied ? 1 : 0)) / p.station.beats.length));
    return /* @__PURE__ */ React.createElement("div", { className: "rb-strip" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "rb-mapbtn", onClick: onMap, "aria-label": "Open the route map" }, /* @__PURE__ */ React.createElement(Icon, { name: "map", size: 18 }), /* @__PURE__ */ React.createElement("span", null, "Map")), /* @__PURE__ */ React.createElement("span", { className: "rb-strip-line" }, a.console ? /* @__PURE__ */ React.createElement("span", { className: "rb-badge-ic sm" }, /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 14 })) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "rb-strip-t" }, /* @__PURE__ */ React.createElement("b", null, a.title, a.id === "slow" ? " · a slow week" : ""), /* @__PURE__ */ React.createElement("span", null, p.station.title, " · ", p.pos.s + 1, " of ", n))), /* @__PURE__ */ React.createElement("ol", { className: "rb-stops", style: { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, "--n": n }, "aria-label": "Stations on this line" }, /* @__PURE__ */ React.createElement("span", { className: "rb-track", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { style: { transform: `scaleX(${n > 1 ? along / (n - 1) : 1})` } })), a.stations.map((st, i) => {
      const s2 = i < p.pos.s ? "done" : i === p.pos.s ? "now" : "";
      return /* @__PURE__ */ React.createElement("li", { key: st.id, className: cx("rb-stop", s2, toneOf(st)) }, /* @__PURE__ */ React.createElement("button", { type: "button", title: st.title, onClick: () => p.go(p.pos.a, i, 0), "aria-current": s2 === "now" ? "step" : void 0, "aria-label": `${st.title}${s2 === "done" ? ", done" : ""}` }, /* @__PURE__ */ React.createElement("span", { className: "rb-dot" }, s2 === "done" ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 11, stroke: 3 }) : null, s2 === "now" && /* @__PURE__ */ React.createElement(motion.span, { layoutId: "rb-token", className: "rb-tok", transition: reduce ? { duration: 0 } : TOKEN }, a.console ? /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 13 }) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" })))));
    })), /* @__PURE__ */ React.createElement("span", { className: "rb-out-mini" }, a.outcome.value != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, "ends at"), /* @__PURE__ */ React.createElement("b", null, fmt.inr(a.outcome.value))) : /* @__PURE__ */ React.createElement("span", null, "ends at Munchly's workspace")));
  }
  function Card({ p }) {
    const { act, station, pos } = p;
    return /* @__PURE__ */ React.createElement("aside", { className: "narr rb-card", "aria-label": "Narration" }, /* @__PURE__ */ React.createElement("div", { className: "narr-scroll", tabIndex: 0, role: "region", "aria-label": "Station notes" }, /* @__PURE__ */ React.createElement("div", { className: "rb-card-head" }, /* @__PURE__ */ React.createElement("span", { className: cx("rb-card-n", toneOf(station)) }, pos.s + 1), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("h2", { className: "narr-title" }, station.title), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, station.date))), /* @__PURE__ */ React.createElement("div", { className: "rb-onscreen" }, /* @__PURE__ */ React.createElement("span", null, "On screen"), /* @__PURE__ */ React.createElement("b", null, p.beat.screen)), station.figures && /* @__PURE__ */ React.createElement("div", { className: "figs" }, station.figures.map((f) => /* @__PURE__ */ React.createElement("div", { key: f.label, className: "fig" }, /* @__PURE__ */ React.createElement("span", { className: "fig-label" }, f.label), !f.count ? /* @__PURE__ */ React.createElement(Money, { value: f.value, size: "m", decimals: f.decimals, roll: true, style: { color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" } }) : /* @__PURE__ */ React.createElement("span", { className: "num m", style: { color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" } }, fmt.num(f.value))))), /* @__PURE__ */ React.createElement("ol", { className: "beats" }, station.beats.map((b, i) => {
      const done = i < pos.b || i === pos.b && pos.applied;
      const now = i === pos.b && !pos.applied;
      return /* @__PURE__ */ React.createElement("li", { key: i, className: cx("beat", done && "done", now && "now", b.human && "human") }, /* @__PURE__ */ React.createElement("span", { className: "beat-dot" }, done ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 3 }) : now && b.agent ? /* @__PURE__ */ React.createElement("span", { className: "beat-aura" }) : null), /* @__PURE__ */ React.createElement("span", { className: "beat-body" }, /* @__PURE__ */ React.createElement("span", { className: "beat-who" }, b.agent ? b.agent + " agent" : V.user(b.who).short, b.time ? " · " + (b.date ? b.date.split(" ")[0] + " " : "") + b.time : ""), /* @__PURE__ */ React.createElement("span", null, b.text), now && !b.agent && /* @__PURE__ */ React.createElement("span", { className: "beat-hint" }, /* @__PURE__ */ React.createElement(Icon, { name: "hand", size: 13 }), "Their move: tap in the device, or press ", /* @__PURE__ */ React.createElement(Kbd, null, "→")), now && b.agent && /* @__PURE__ */ React.createElement("span", { className: "beat-hint" }, /* @__PURE__ */ React.createElement("span", { className: "typing" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), "working"), b.stub && i === pos.b && /* @__PURE__ */ React.createElement("span", { className: "la-stub" }, "The build shows the Mango's own screen here")));
    }))), /* @__PURE__ */ React.createElement("div", { className: "narr-ctrl" }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "chevron-left", onClick: p.back, "aria-label": "Back" }, "Back"), /* @__PURE__ */ React.createElement(Button, { variant: p.beat.human && !pos.applied ? "approve" : "primary", iconRight: "arrow-right", block: true, onClick: p.next }, p.beat.agent && !pos.applied ? "Skip ahead" : "Next")));
  }
  function MapOver({ p, onPick, onClose, hop }) {
    const reduce = useReducedMotion();
    useEffect(() => {
      const f = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", f);
      return () => window.removeEventListener("keydown", f);
    }, []);
    return /* @__PURE__ */ React.createElement(motion.div, { className: "rb-over", role: "dialog", "aria-modal": "true", "aria-label": "The route map", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: reduce ? 0 : 0.24 } }, /* @__PURE__ */ React.createElement("div", { className: "rb-over-in" }, /* @__PURE__ */ React.createElement("div", { className: "rb-over-head" }, /* @__PURE__ */ React.createElement("div", { className: "rb-over-copy" }, hop && /* @__PURE__ */ React.createElement("span", { className: "rb-eyebrow" }, "Next line"), /* @__PURE__ */ React.createElement("h2", { className: "rb-over-title" }, hop ? /* @__PURE__ */ React.createElement(React.Fragment, null, p.act.title, p.act.id === "slow" ? " · a slow week" : "", /* @__PURE__ */ React.createElement("span", null, " · ", p.act.place)) : "The route")), /* @__PURE__ */ React.createElement(IconButton, { icon: "x", label: "Close the map", onClick: onClose })), /* @__PURE__ */ React.createElement(RouteMap, { active: p.act.id, pos: p.pos, onPick: (a, s) => {
      onPick(a, s);
      onClose();
    } })));
  }
  function End({ onRestart, onClose }) {
    return /* @__PURE__ */ React.createElement(motion.div, { className: "finale rb-end", role: "dialog", "aria-modal": "true", "aria-label": "The end of the route", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "finale-in" }, /* @__PURE__ */ React.createElement(Mark, { size: 56, play: true }), /* @__PURE__ */ React.createElement("h2", { className: "finale-title" }, "Three batches, three endings"), /* @__PURE__ */ React.createElement("div", { className: "rb-ends" }, ["chips", "mango", "slow"].map((id) => {
      const a = ACTS[AI[id]];
      return /* @__PURE__ */ React.createElement("div", { key: id, className: cx("rb-endcard", a.outcome.red && "red") }, /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), /* @__PURE__ */ React.createElement("b", null, a.title, id === "slow" ? " · a slow week" : ""), /* @__PURE__ */ React.createElement(Money, { value: a.outcome.value, roll: true, from: 0, size: "l", style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", null, a.outcome.line));
    })), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10, justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "rotate-ccw", onClick: onRestart }, "Ride it again"), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", onClick: onClose }, "Stay here"))));
  }
  function Demo({ start, autoplay, onHome }) {
    const [map, setMap] = useState(null);
    const [phoneOnly, setPhoneOnly] = useState(false);
    const [notes, setNotes] = useState(true);
    const p = V.usePlayer(ACTS, start, !!map);
    V.useBeatFx(p);
    const app = useApp();
    const canvas = useRef(null);
    const size = V.useSize(canvas);
    useEffect(() => {
      if (autoplay) p.setPlaying(true);
    }, []);
    const prevA = useRef(p.pos.a);
    useEffect(() => {
      if (p.pos.a !== prevA.current) {
        prevA.current = p.pos.a;
        setMap("hop");
        if (p.playing) {
          const t = setTimeout(() => setMap(null), 2600);
          return () => clearTimeout(t);
        }
      }
    }, [p.pos.a]);
    useEffect(() => {
      const f = (e) => {
        if (map || e.target.closest && e.target.closest("input, textarea, select")) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          p.next();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          p.back();
        } else if (e.key === "m" || e.key === "M") setMap("map");
      };
      window.addEventListener("keydown", f);
      return () => window.removeEventListener("keydown", f);
    });
    const real = app.w < 768;
    if (real) return /* @__PURE__ */ React.createElement("div", { className: "demo-real rb-real" }, /* @__PURE__ */ React.createElement("div", { className: "real-bar rb-realbar" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "iconbtn", "aria-label": "Back", onClick: p.back }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 22 })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "real-stage", onClick: () => setMap("map") }, /* @__PURE__ */ React.createElement("span", { className: cx("rb-card-n sm", toneOf(p.station)) }, p.pos.s + 1), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, p.act.title, " · ", p.station.title), /* @__PURE__ */ React.createElement("span", null, p.beat.text))), /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("iconbtn real-next", p.beat.human && "amber"), "aria-label": "Next", onClick: p.next }, /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 22 }))), /* @__PURE__ */ React.createElement(V.Stage, { station: p.station, beat: p.beat, act: p.act, size, real: true }), /* @__PURE__ */ React.createElement(AnimatePresence, null, map && /* @__PURE__ */ React.createElement(MapOver, { p, hop: map === "hop", onPick: (a, s) => p.go(a, s, 0), onClose: () => setMap(null) })));
    return /* @__PURE__ */ React.createElement("div", { className: cx("demo rb-demo", !notes && "no-notes") }, /* @__PURE__ */ React.createElement("header", { className: "demo-top rb-top" }, /* @__PURE__ */ React.createElement("span", { className: "row tight demo-brand" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "rb-home", onClick: onHome, "aria-label": "Back to the map" }, /* @__PURE__ */ React.createElement(Mark, { size: 30 })), /* @__PURE__ */ React.createElement(Wordmark, { size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "demo-tag" }, "Guided demo")), /* @__PURE__ */ React.createElement(Strip, { p, onMap: () => setMap("map") }), /* @__PURE__ */ React.createElement("span", { className: "row tight demo-tools" }, /* @__PURE__ */ React.createElement(IconButton, { icon: p.playing ? "pause" : "play", label: p.playing ? "Pause" : "Play", onClick: () => p.setPlaying(!p.playing) }), /* @__PURE__ */ React.createElement(IconButton, { icon: phoneOnly ? "monitor" : "smartphone", label: phoneOnly ? "Laptop and phone" : "Phone only", onClick: () => setPhoneOnly((v) => !v) }), /* @__PURE__ */ React.createElement(IconButton, { icon: "presentation", label: notes ? "Hide notes" : "Show notes", onClick: () => setNotes((v) => !v) }), /* @__PURE__ */ React.createElement(ModeMenuButton, null))), /* @__PURE__ */ React.createElement("div", { className: "demo-body" }, notes && /* @__PURE__ */ React.createElement(Card, { p }), /* @__PURE__ */ React.createElement("main", { className: "demo-canvas", ref: canvas }, /* @__PURE__ */ React.createElement(V.Stage, { station: p.station, beat: p.beat, act: p.act, size, phoneOnly }))), /* @__PURE__ */ React.createElement(AnimatePresence, null, map && /* @__PURE__ */ React.createElement(MapOver, { p, hop: map === "hop", onPick: (a, s) => p.go(a, s, 0), onClose: () => setMap(null) })), /* @__PURE__ */ React.createElement(AnimatePresence, null, p.pos.end && /* @__PURE__ */ React.createElement(End, { onRestart: () => p.go(0, 0, 0), onClose: () => {
    } })));
  }
  function App() {
    const [view, setView] = useState(() => window.SC167_START ? "demo" : "start");
    const [start, setStart] = useState(window.SC167_START || { a: 0, s: 0, b: 0 });
    const [auto, setAuto] = useState(window.SC167_PLAY);
    if (view === "start") return /* @__PURE__ */ React.createElement("div", { className: "demo rb-shell" }, /* @__PURE__ */ React.createElement("header", { className: "demo-top rb-top" }, /* @__PURE__ */ React.createElement("span", { className: "row tight demo-brand" }, /* @__PURE__ */ React.createElement(Mark, { size: 30 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "demo-tag" }, "Guided demo")), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", { className: "row tight demo-tools" }, /* @__PURE__ */ React.createElement(ModeMenuButton, null))), /* @__PURE__ */ React.createElement("main", { className: "rb-startwrap" }, /* @__PURE__ */ React.createElement(Start, { onPick: (a, s) => {
      setStart({ a, s, b: 0 });
      setAuto(false);
      setView("demo");
    }, onAll: () => {
      setStart({ a: 0, s: 0, b: 0 });
      setAuto(true);
      setView("demo");
    } })));
    return /* @__PURE__ */ React.createElement(Demo, { key: JSON.stringify(start), start, autoplay: auto, onHome: () => setView("start") });
  }
  function Root() {
    return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "demo-root", style: { position: "fixed", inset: 0 } }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(App, null))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
})();

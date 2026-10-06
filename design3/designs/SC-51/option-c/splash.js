(function() {
  const { useState, useEffect, useRef, useMemo } = React;
  const { motion, AnimatePresence, useReducedMotion, animate } = Motion;
  const SH = window.SC51_SHARED, K = window.SC3, P = window.SC3_PLATFORM, M = window.SC3_MONEY;
  const { cx, Icon, Wordmark, useApp } = K;
  const MIN = { boot: 1250, enter: 1e3, leave: 900 }, MAX = 8e3;
  const AGENTS = P.AGENTS;
  function lines(s, reads) {
    const landed = (id) => reads.steps.some((r) => r.id === id && r.at != null);
    const d = s ? P.dashboard(s) : null, clients = s ? s.clients.length : 0, live = s ? s.clients.filter((c) => c.status === "live").length : 0;
    const n = (v, one, many) => `${v} ${v === 1 ? one : many}`;
    return {
      data: s && landed("clients") ? `${n(clients, "client workspace", "client workspaces")}, ${live} live` : "Loads each distributor's stock export",
      watcher: d && landed("batches") ? `${n(d.inFlight, "batch", "batches")} in flight` : "Watches every batch against its gates",
      vision: "Reads the label photo from the godown",
      valuer: d && landed("dashboard") ? `${M.fmt.inr(d.recovered || 0)} recovered in 30 days` : "Prices every exit, the bin included",
      router: "Splits each batch under its caps",
      gate: d && landed("dashboard") ? d.waiting ? `${n(d.waiting, "plan", "plans")} waiting for a yes` : "Nothing waiting for a yes" : "A person approves every plan",
      lister: "Lists on ExpireSoon in the distributor's name",
      outreach: "Sends the kirana offers",
      negotiator: "Answers the bids",
      paperwork: "Drafts the invoice and the credit note",
      impact: d && landed("runs") ? `${n(d.runsToday, "agent run", "agent runs")} today` : "Posts the ledger and the BRSR rows"
    };
  }
  const WORDS = {
    boot: { title: "Opening the console", end: "Everyone is at their post" },
    enter: { title: (who) => SH.greet(who), end: "Everyone is at their post" },
    leave: { title: "Signing you out", done: "Signed out", end: (who) => `The agents keep working while you're away, ${who}.` }
  };
  function Ring({ kind, who, reads, onOpening, onOpen }) {
    const app = useApp();
    const reduce = useReducedMotion();
    const phone = app.bp === "phone";
    const s = P.get();
    const progress = SH.useProgress(reads, { minRun: 1100, reduce });
    const [stage, setStage] = useState("in");
    const root = useRef(null), born = useRef(performance.now());
    const N = AGENTS.length, R = phone ? 118 : 172, size = phone ? 36 : 46, box = R * 2 + size + 24;
    const awake = kind === "leave" ? N : reads.done && progress >= 1 ? N : Math.min(N - 1, Math.floor(progress * N + 1e-4));
    const said = useMemo(() => lines(kind === "boot" && !who ? null : s, reads), [reads.landed, kind]);
    const last = awake > 0 ? AGENTS[awake - 1] : null;
    const w = WORDS[kind], title = typeof w.title === "function" ? w.title(who) : w.title;
    const landed = reads.done && progress >= 1;
    const caption = kind === "leave" ? landed ? w.end(who) : "Closing your session\u2026" : landed ? w.end : last ? `${last.name} \xB7 ${said[last.id]}` : "Connecting\u2026";
    const pos = (i) => {
      const a = -Math.PI / 2 + i / N * Math.PI * 2;
      return [box / 2 + Math.cos(a) * R, box / 2 + Math.sin(a) * R];
    };
    const ready = landed || performance.now() - born.current > MAX;
    useEffect(() => {
      if (!ready || stage !== "in") return;
      const wait = Math.max(0, MIN[kind] - (performance.now() - born.current));
      const t = setTimeout(() => setStage("open"), reduce ? Math.max(wait, 600) : wait + 420);
      return () => clearTimeout(t);
    }, [ready, stage]);
    useEffect(() => {
      if (stage !== "open") return;
      if (reduce) {
        onOpening();
        onOpen();
        return;
      }
      const el = root.current;
      el.style.pointerEvents = "none";
      onOpening();
      animate(el.querySelector(".sc51c-ring"), { scale: 2.6, opacity: 0 }, { duration: 0.7, ease: [0.7, 0, 0.2, 1] });
      animate(el.querySelectorAll(".sc51c-words"), { opacity: 0, y: 10 }, { duration: 0.24, ease: [0.55, 0, 1, 0.45] });
      animate(el.querySelector(".sc51c-cover"), { opacity: 0 }, { duration: 0.46, delay: 0.16, ease: "linear", onComplete: onOpen });
    }, [stage]);
    return /* @__PURE__ */ React.createElement("div", { ref: root, className: cx("sc51c", kind, phone && "phone") }, /* @__PURE__ */ React.createElement("div", { className: "sc51c-cover" }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" })), /* @__PURE__ */ React.createElement("div", { className: "sc51c-lock" }, /* @__PURE__ */ React.createElement("div", { className: "sc51c-ring", style: { width: box, height: box }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { className: "sc51c-lines", viewBox: `0 0 ${box} ${box}` }, AGENTS.map((a, i) => {
      const [x1, y1] = pos(i), [x2, y2] = pos((i + 1) % N);
      const on = i + 1 < awake || awake === N && i < N;
      return /* @__PURE__ */ React.createElement("line", { key: a.id, className: cx(on && "on"), x1, y1, x2, y2, pathLength: "1" });
    })), AGENTS.map((a, i) => {
      const [x, y] = pos(i);
      const on = i < awake;
      return /* @__PURE__ */ React.createElement("div", { key: a.id, className: cx("sc51c-node", on && "on", a.gate && "gate", kind === "leave" && "rest"), style: { left: x - size / 2, top: y - size / 2, width: size, height: size, "--i": i } }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: phone ? 17 : 21, stroke: on ? 2 : 1.7 }), /* @__PURE__ */ React.createElement("span", { className: "sc51c-name" }, a.name));
    }), /* @__PURE__ */ React.createElement("div", { className: "sc51c-centre" }, /* @__PURE__ */ React.createElement(SH.LoadMark, { size: phone ? 64 : 80, drawn: progress, landed }))), /* @__PURE__ */ React.createElement("div", { className: "sc51c-words" }, /* @__PURE__ */ React.createElement("span", { className: "sc51c-brand" }, /* @__PURE__ */ React.createElement(Wordmark, { size: phone ? 18 : 22 }), /* @__PURE__ */ React.createElement("span", { className: "sc51c-console" }, "Console")), /* @__PURE__ */ React.createElement("h1", { className: "sc51c-title" }, kind === "leave" && landed ? w.done : title), /* @__PURE__ */ React.createElement("p", { className: "sc51c-cap", "aria-live": "off" }, /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait", initial: false }, /* @__PURE__ */ React.createElement(motion.span, { key: caption, initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6, transition: { duration: reduce ? 0 : 0.14 } }, transition: { duration: 0.22, ease: SH.EASE } }, caption))))), /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, kind === "leave" ? landed ? "Signed out." : "Signing you out." : kind === "enter" ? `Signed in. Opening the console for ${who}.` : "Opening the console."));
  }
  function Stage({ phase, me, reads, signin, console: cs, onDone }) {
    const reduce = useReducedMotion();
    const covering = phase === "boot" || phase === "enter" || phase === "leave";
    const [opened, setOpened] = useState(false);
    const [opening, setOpening] = useState(false);
    const [coverIn, setCoverIn] = useState(false);
    useEffect(() => {
      setOpened(false);
      setOpening(false);
      setCoverIn(phase === "boot" || reduce);
    }, [phase]);
    const behind = phase === "signin" ? signin : phase === "console" ? cs : phase === "boot" ? me ? cs : signin : phase === "enter" ? coverIn ? cs : signin : reads.done ? signin : cs;
    const who = me ? me.name.split(" ")[0] : "";
    return /* @__PURE__ */ React.createElement("div", { className: cx("sc51c-stage", covering && !opened && !opening && "covered", phase === "leave" && !reads.done && "receding"), "aria-busy": covering || void 0 }, /* @__PURE__ */ React.createElement("div", { className: "sc51c-behind", inert: covering && !opened ? "" : void 0 }, behind), /* @__PURE__ */ React.createElement(AnimatePresence, null, covering && /* @__PURE__ */ React.createElement(motion.div, { key: phase, className: "sc51c-layer", initial: reduce || phase === "boot" ? false : { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } }, transition: { duration: 0.32, ease: "linear" }, onAnimationComplete: (def) => {
      if (def && def.opacity === 1) setCoverIn(true);
    } }, /* @__PURE__ */ React.createElement(Ring, { kind: phase, who, reads, onOpening: () => setOpening(true), onOpen: () => {
      setOpened(true);
      onDone();
    } }))));
  }
  window.SC51 = { Stage };
})();

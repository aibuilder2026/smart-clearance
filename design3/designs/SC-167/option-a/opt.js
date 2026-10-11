(function() {
  const { useState, useEffect, useRef } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Button, Kbd, Money, Mark, Wordmark, WorkspaceMark, ThemeProvider, AppRoot, NoticeHost, ModeMenuButton } = K;
  const { ACTS } = window.SC167_ACTS;
  const V = window.SC167_DEV;
  const WS = D.WORKSPACE;
  const img = (n) => window.SC3_IMG + n + ".webp";
  const total = ACTS.reduce((t, a) => t + a.minutes, 0);
  const screensOf = (a) => [...new Set(a.stations.flatMap((s) => s.beats.map((b) => b.screen.split(" · ")[0])))];
  function Visual({ a }) {
    if (a.console) return /* @__PURE__ */ React.createElement("div", { className: "la-vis la-console" }, /* @__PURE__ */ React.createElement("span", { className: "la-tile" }, /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 30 })), /* @__PURE__ */ React.createElement("span", { className: "la-clients" }, ["#f68d3e", "#be123c", "#16a34a", "#15803d", "#0e7490"].map((c, i) => /* @__PURE__ */ React.createElement("i", { key: i, style: { background: c } }))));
    return /* @__PURE__ */ React.createElement("div", { className: cx("la-vis", a.id === "slow" && "la-slow") }, /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), a.id === "slow" && /* @__PURE__ */ React.createElement("img", { className: "la-bin", src: img("bin-plain"), alt: "" }));
  }
  function Lobby({ onPlay }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement("div", { className: "la-lobby" }, /* @__PURE__ */ React.createElement("div", { className: "la-head" }, /* @__PURE__ */ React.createElement("h1", { className: "la-title" }, "See Smart-Clearance work"), /* @__PURE__ */ React.createElement("p", { className: "la-sub" }, "Four chapters, about ", total, " minutes. Start anywhere. Every screen is the real app, on Munchly Foods' sample data.")), /* @__PURE__ */ React.createElement("ol", { className: "la-cards" }, ACTS.map((a, i) => /* @__PURE__ */ React.createElement(motion.li, { key: a.id, className: "la-card", initial: reduce ? false : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.06 * i, duration: 0.42, ease: [0.22, 1, 0.36, 1] } }, /* @__PURE__ */ React.createElement(Visual, { a }), /* @__PURE__ */ React.createElement("div", { className: "la-body" }, /* @__PURE__ */ React.createElement("span", { className: "la-n" }, String(i + 1).padStart(2, "0")), /* @__PURE__ */ React.createElement("h2", { className: "la-name" }, a.title), /* @__PURE__ */ React.createElement("p", { className: "la-what" }, a.sub), /* @__PURE__ */ React.createElement("span", { className: "la-place" }, a.place), /* @__PURE__ */ React.createElement("ul", { className: "la-screens", "aria-label": "Screens it shows" }, screensOf(a).slice(0, 6).map((s) => /* @__PURE__ */ React.createElement("li", { key: s }, s))), /* @__PURE__ */ React.createElement("div", { className: "la-foot" }, /* @__PURE__ */ React.createElement("span", { className: "la-cast" }, a.who.map((w) => /* @__PURE__ */ React.createElement(Avatar, { key: w, person: V.user(w), size: "sm" }))), /* @__PURE__ */ React.createElement("span", { className: "la-min" }, a.minutes, " min"))), /* @__PURE__ */ React.createElement(Button, { variant: a.id === "slow" ? "secondary" : "primary", icon: "play", block: true, onClick: () => onPlay(i) }, "Play chapter ", i + 1)))), /* @__PURE__ */ React.createElement("div", { className: "la-all" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "play", onClick: () => onPlay(0, true) }, "Play all four · ", total, " min"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "It plays itself; pause it, and make any person's move in their device.")));
  }
  function ChapterTabs({ pos, onJump, onLobby }) {
    return /* @__PURE__ */ React.createElement("nav", { className: "la-tabs", "aria-label": "Chapters" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "la-tab lobby", onClick: onLobby, "aria-label": "All chapters" }, /* @__PURE__ */ React.createElement(Icon, { name: "layout-grid", size: 16 })), ACTS.map((a, i) => /* @__PURE__ */ React.createElement("button", { key: a.id, type: "button", className: cx("la-tab", i === pos.a && "now", i < pos.a && "done"), "aria-current": i === pos.a ? "step" : void 0, onClick: () => onJump(i) }, /* @__PURE__ */ React.createElement("span", { className: "la-tab-n" }, i + 1), /* @__PURE__ */ React.createElement("span", { className: "la-tab-t" }, a.title, a.id === "slow" ? " · slow week" : a.id === "chips" ? " · sold" : ""))));
  }
  function StationBar({ act, pos, go }) {
    return /* @__PURE__ */ React.createElement("nav", { className: "stagebar la-stations", "aria-label": "Stations" }, act.stations.map((st, i) => /* @__PURE__ */ React.createElement("button", { key: st.id, type: "button", className: cx("sbtn", i < pos.s && "done", i === pos.s && "now", st.amber && "human"), "aria-current": i === pos.s ? "step" : void 0, onClick: () => go(pos.a, i, 0) }, /* @__PURE__ */ React.createElement("span", { className: "sb-dot" }, i < pos.s ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 12, stroke: 3 }) : i + 1), /* @__PURE__ */ React.createElement("span", { className: "sb-t" }, st.title))));
  }
  function Notes({ p }) {
    const { act, station, pos } = p;
    const n = pos.s;
    return /* @__PURE__ */ React.createElement("aside", { className: "narr", "aria-label": "Narration" }, /* @__PURE__ */ React.createElement("div", { className: "narr-scroll", tabIndex: 0, role: "region", "aria-label": "Station notes" }, /* @__PURE__ */ React.createElement("div", { className: "narr-head" }, /* @__PURE__ */ React.createElement("span", { className: "narr-n" }, String(n + 1).padStart(2, "0")), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("h2", { className: "narr-title" }, station.title), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, act.title, " · ", act.sub, " · ", station.date))), /* @__PURE__ */ React.createElement("div", { className: "la-onscreen" }, /* @__PURE__ */ React.createElement(Icon, { name: "monitor", size: 15 }), /* @__PURE__ */ React.createElement("span", null, "On screen"), /* @__PURE__ */ React.createElement("b", null, p.beat.screen)), station.figures && /* @__PURE__ */ React.createElement("div", { className: "figs" }, station.figures.map((f) => /* @__PURE__ */ React.createElement("div", { key: f.label, className: "fig" }, /* @__PURE__ */ React.createElement("span", { className: "fig-label" }, f.label), !f.count ? /* @__PURE__ */ React.createElement(Money, { value: f.value, size: "m", decimals: f.decimals, roll: true, style: { color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" } }) : /* @__PURE__ */ React.createElement("span", { className: "num m", style: { color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" } }, fmt.num(f.value))))), /* @__PURE__ */ React.createElement("ol", { className: "beats" }, station.beats.map((b, i) => {
      const done = i < pos.b || i === pos.b && pos.applied;
      const now = i === pos.b && !pos.applied;
      return /* @__PURE__ */ React.createElement("li", { key: i, className: cx("beat", done && "done", now && "now", b.human && "human") }, /* @__PURE__ */ React.createElement("span", { className: "beat-dot" }, done ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 3 }) : now && b.agent ? /* @__PURE__ */ React.createElement("span", { className: "beat-aura" }) : null), /* @__PURE__ */ React.createElement("span", { className: "beat-body" }, /* @__PURE__ */ React.createElement("span", { className: "beat-who" }, b.agent ? b.agent + " agent" : V.user(b.who).short, b.time ? " · " + (b.date ? b.date.split(" ")[0] + " " : "") + b.time : ""), /* @__PURE__ */ React.createElement("span", null, b.text), now && !b.agent && /* @__PURE__ */ React.createElement("span", { className: "beat-hint" }, /* @__PURE__ */ React.createElement(Icon, { name: "hand", size: 13 }), "Their move: tap in the device, or press ", /* @__PURE__ */ React.createElement(Kbd, null, "→")), now && b.agent && /* @__PURE__ */ React.createElement("span", { className: "beat-hint" }, /* @__PURE__ */ React.createElement("span", { className: "typing" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), "working"), b.stub && i === pos.b && /* @__PURE__ */ React.createElement("span", { className: "la-stub" }, "The build shows the Mango's own screen here")));
    }))), /* @__PURE__ */ React.createElement("div", { className: "narr-ctrl" }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "chevron-left", onClick: p.back, "aria-label": "Back" }, "Back"), /* @__PURE__ */ React.createElement(Button, { variant: p.beat.human && !pos.applied ? "approve" : "primary", iconRight: "arrow-right", block: true, onClick: p.next }, pos.b === station.beats.length - 1 && pos.applied ? pos.s === act.stations.length - 1 ? "End of chapter" : "Next · " + act.stations[pos.s + 1].title : p.beat.agent ? "Skip ahead" : "Next")));
  }
  function ChapterEnd({ a, i, onNext, onLobby }) {
    const reduce = useReducedMotion();
    const nx = ACTS[i + 1];
    return /* @__PURE__ */ React.createElement(motion.div, { className: "finale la-end", role: "dialog", "aria-modal": "true", "aria-label": `Chapter ${i + 1} done`, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "finale-in" }, /* @__PURE__ */ React.createElement("span", { className: "la-n" }, "Chapter ", i + 1, " of ", ACTS.length, " · done"), /* @__PURE__ */ React.createElement("h2", { className: "finale-title" }, a.title, a.id === "console" ? "" : " · " + a.sub.toLowerCase()), a.outcome.value != null ? /* @__PURE__ */ React.createElement("div", { className: "finale-hero" }, /* @__PURE__ */ React.createElement(Money, { value: a.outcome.value, roll: true, from: 0, className: "finale-num", style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "finale-cap" }, a.outcome.line)) : /* @__PURE__ */ React.createElement("p", { className: "finale-line" }, a.outcome.line), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10, justifyContent: "center" } }, nx ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", iconRight: "arrow-right", onClick: onNext }, "Chapter ", i + 2, ": ", nx.title, nx.id === "slow" ? ", a slow week" : "") : null, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", icon: "layout-grid", onClick: onLobby }, "All chapters"))));
  }
  function Demo({ start, onLobby, autoplay }) {
    const p = V.usePlayer(ACTS, start);
    V.useBeatFx(p);
    const canvas = useRef(null);
    const size = V.useSize(canvas);
    const [notes, setNotes] = useState(true);
    const [phoneOnly, setPhoneOnly] = useState(false);
    const [end, setEnd] = useState(null);
    useEffect(() => {
      if (autoplay) p.setPlaying(true);
    }, []);
    const last = p.pos.s === p.act.stations.length - 1 && p.pos.b === p.station.beats.length - 1 && (p.pos.applied || !(p.beat.acts && p.beat.acts.length));
    const next = () => {
      if (last && end == null) {
        setEnd(p.pos.a);
        p.setPlaying(false);
        return;
      }
      p.next();
    };
    useEffect(() => {
      if (p.playing && last && end == null) {
        const t = setTimeout(() => setEnd(p.pos.a), 1800);
        return () => clearTimeout(t);
      }
    }, [p.playing, last, end]);
    useEffect(() => {
      const f = (e) => {
        if (e.target.closest && e.target.closest("input, textarea, select")) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          next();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          p.back();
        }
      };
      window.addEventListener("keydown", f);
      return () => window.removeEventListener("keydown", f);
    });
    return /* @__PURE__ */ React.createElement("div", { className: cx("demo", !notes && "no-notes") }, /* @__PURE__ */ React.createElement("header", { className: "demo-top la-top" }, /* @__PURE__ */ React.createElement("span", { className: "row tight demo-brand" }, /* @__PURE__ */ React.createElement(Mark, { size: 30 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "demo-tag" }, "Guided demo"), !p.act.console && /* @__PURE__ */ React.createElement("span", { className: "demo-ws" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 20 }), /* @__PURE__ */ React.createElement("span", null, WS.name))), /* @__PURE__ */ React.createElement(ChapterTabs, { pos: p.pos, onJump: (i) => {
      setEnd(null);
      p.go(i, 0, 0);
    }, onLobby }), /* @__PURE__ */ React.createElement("span", { className: "row tight demo-tools" }, /* @__PURE__ */ React.createElement(IconButton, { icon: p.playing ? "pause" : "play", label: p.playing ? "Pause autoplay" : "Autoplay", onClick: () => p.setPlaying(!p.playing) }), /* @__PURE__ */ React.createElement(IconButton, { icon: phoneOnly ? "monitor" : "smartphone", label: phoneOnly ? "Laptop and phone" : "Phone only", onClick: () => setPhoneOnly((v) => !v) }), /* @__PURE__ */ React.createElement(IconButton, { icon: "presentation", label: notes ? "Hide notes" : "Show notes", onClick: () => setNotes((v) => !v) }), /* @__PURE__ */ React.createElement(ModeMenuButton, null))), /* @__PURE__ */ React.createElement("div", { className: "la-sub-bar" }, /* @__PURE__ */ React.createElement(StationBar, { act: p.act, pos: p.pos, go: p.go })), /* @__PURE__ */ React.createElement("div", { className: "demo-body" }, notes && /* @__PURE__ */ React.createElement(Notes, { p: Object.assign({}, p, { next }) }), /* @__PURE__ */ React.createElement("main", { className: "demo-canvas", ref: canvas }, /* @__PURE__ */ React.createElement(V.Stage, { station: p.station, beat: p.beat, act: p.act, size, phoneOnly }))), /* @__PURE__ */ React.createElement(AnimatePresence, null, end != null && /* @__PURE__ */ React.createElement(ChapterEnd, { a: ACTS[end], i: end, onNext: () => {
      const i = end;
      setEnd(null);
      p.go(i + 1, 0, 0);
    }, onLobby })));
  }
  function App() {
    const [view, setView] = useState(() => window.SC167_START ? "demo" : "lobby");
    const [start, setStart] = useState(window.SC167_START || { a: 0, s: 0, b: 0 });
    const [auto, setAuto] = useState(window.SC167_PLAY);
    if (view === "lobby") return /* @__PURE__ */ React.createElement("div", { className: "demo la-shell" }, /* @__PURE__ */ React.createElement("header", { className: "demo-top la-top" }, /* @__PURE__ */ React.createElement("span", { className: "row tight demo-brand" }, /* @__PURE__ */ React.createElement(Mark, { size: 30 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "demo-tag" }, "Guided demo")), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", { className: "row tight demo-tools" }, /* @__PURE__ */ React.createElement(ModeMenuButton, null))), /* @__PURE__ */ React.createElement("main", { className: "la-lobby-wrap" }, /* @__PURE__ */ React.createElement(Lobby, { onPlay: (i, all) => {
      setStart({ a: i, s: 0, b: 0 });
      setAuto(!!all);
      setView("demo");
    } })));
    return /* @__PURE__ */ React.createElement(Demo, { key: JSON.stringify(start), start, autoplay: auto, onLobby: () => setView("lobby") });
  }
  function Root() {
    return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "demo-root", style: { position: "fixed", inset: 0 } }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(App, null))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
})();

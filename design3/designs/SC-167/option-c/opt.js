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
  const total = ACTS.reduce((t, a) => t + a.minutes, 0);
  const ROLE = { neha: "Smart-Clearance", priya: "Supply chain, Munchly", rakesh: "Distributor, Nagpur", ganesh: "Kirana, Nagpur", agrawal: "Buyer, Raipur", "lakshmi-owner": "Distributor, Hyderabad", meera: "Feeding India" };
  const AGENT_IC = { Watcher: "eye", Vision: "scan-line", Valuer: "scale", Router: "split", Lister: "store", Outreach: "send", Negotiator: "messages-square", Donation: "heart-handshake", Paperwork: "file-text", Impact: "leaf", Data: "database" };
  function Title({ onPlay, onChapter }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement("div", { className: "sh-title" }, /* @__PURE__ */ React.createElement(motion.div, { className: "sh-title-in", initial: reduce ? false : { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }, /* @__PURE__ */ React.createElement(Mark, { size: 72, play: !reduce }), /* @__PURE__ */ React.createElement("h1", { className: "sh-h1" }, "A near-expiry batch,", /* @__PURE__ */ React.createElement("br", null), "start to finish"), /* @__PURE__ */ React.createElement("p", { className: "sh-lede" }, "The guided demo · four chapters · about ", total, " minutes, on the real screens and sample data"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "sh-play", onClick: onPlay, "aria-label": "Play the demo" }, /* @__PURE__ */ React.createElement(Icon, { name: "play", size: 34 }))), /* @__PURE__ */ React.createElement("ol", { className: "sh-chapters", "aria-label": "Or start at a chapter" }, ACTS.map((a, i) => /* @__PURE__ */ React.createElement(motion.li, { key: a.id, initial: reduce ? false : { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 + i * 0.06, duration: 0.42 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "sh-chap", onClick: () => onChapter(i) }, /* @__PURE__ */ React.createElement("span", { className: "sh-chap-vis" }, a.console ? /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 26 }) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), a.id === "slow" && /* @__PURE__ */ React.createElement("img", { className: "sh-chap-bin", src: img("bin-plain"), alt: "" })), /* @__PURE__ */ React.createElement("span", { className: "sh-chap-t" }, /* @__PURE__ */ React.createElement("span", null, "Chapter ", i + 1, " · ", a.minutes, " min"), /* @__PURE__ */ React.createElement("b", null, a.title), /* @__PURE__ */ React.createElement("span", null, a.sub)))))));
  }
  function ChapterCard({ a, i, onGo }) {
    const reduce = useReducedMotion();
    const st = a.stations[0];
    return /* @__PURE__ */ React.createElement(motion.div, { className: "sh-card", role: "dialog", "aria-modal": "true", "aria-label": `Chapter ${i + 1}: ${a.title}`, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: reduce ? 0 : 0.3 }, onClick: onGo }, /* @__PURE__ */ React.createElement("div", { className: "sh-card-in" }, /* @__PURE__ */ React.createElement(motion.div, { className: "sh-card-copy", initial: reduce ? false : { opacity: 0, x: -16 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }, /* @__PURE__ */ React.createElement("span", { className: "sh-eyebrow" }, "Chapter ", i + 1, " of ", ACTS.length), /* @__PURE__ */ React.createElement("h2", { className: "sh-card-title" }, a.title), /* @__PURE__ */ React.createElement("p", { className: "sh-card-sub" }, a.sub), /* @__PURE__ */ React.createElement("span", { className: "sh-card-place" }, a.place, " · from ", st.date), /* @__PURE__ */ React.createElement("ul", { className: "sh-cast" }, a.who.map((w, k) => /* @__PURE__ */ React.createElement(motion.li, { key: w, initial: reduce ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.35 + k * 0.08 } }, /* @__PURE__ */ React.createElement(Avatar, { person: V.user(w), size: "lg" }), /* @__PURE__ */ React.createElement("b", null, V.user(w).short || V.user(w).name), /* @__PURE__ */ React.createElement("span", null, ROLE[w] || "")))), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "play", onClick: (e) => {
      e.stopPropagation();
      onGo();
    } }, "Start the chapter")), /* @__PURE__ */ React.createElement(motion.div, { className: "sh-card-vis", initial: reduce ? false : { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }, a.console ? /* @__PURE__ */ React.createElement("span", { className: "sh-card-console" }, /* @__PURE__ */ React.createElement(Mark, { size: 96 })) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), a.id === "slow" && /* @__PURE__ */ React.createElement("img", { className: "sh-card-bin", src: img("bin-plain"), alt: "" }))));
  }
  function Caption({ p }) {
    const reduce = useReducedMotion();
    const b = p.beat;
    const who = b.agent ? null : V.user(b.who);
    const now = !p.pos.applied;
    return /* @__PURE__ */ React.createElement("div", { className: "sh-cap-wrap" }, /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, /* @__PURE__ */ React.createElement(motion.div, { key: `${p.pos.a}.${p.pos.s}.${p.pos.b}`, className: cx("sh-cap", b.human && now && "amber"), initial: reduce ? false : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: reduce ? void 0 : { opacity: 0, y: -6 }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }, role: "status", "aria-live": "polite" }, /* @__PURE__ */ React.createElement("span", { className: "sh-cap-who" }, who ? /* @__PURE__ */ React.createElement(Avatar, { person: who, size: "lg" }) : /* @__PURE__ */ React.createElement("span", { className: cx("sh-agent", now && "working") }, /* @__PURE__ */ React.createElement(Icon, { name: AGENT_IC[b.agent] || "sparkles", size: 20 }))), /* @__PURE__ */ React.createElement("span", { className: "sh-cap-body" }, /* @__PURE__ */ React.createElement("span", { className: "sh-cap-meta" }, /* @__PURE__ */ React.createElement("b", null, b.agent ? b.agent + " agent" : who.short || who.name), /* @__PURE__ */ React.createElement("span", null, (b.date || p.station.date).replace(/ \d{4}$/, ""), " · ", b.time), /* @__PURE__ */ React.createElement("span", { className: "sh-cap-st" }, p.station.title)), /* @__PURE__ */ React.createElement("span", { className: "sh-cap-text" }, b.text), now && !b.agent && /* @__PURE__ */ React.createElement("span", { className: "sh-cap-move" }, /* @__PURE__ */ React.createElement(Icon, { name: "hand", size: 14 }), "Their move: tap it in the device, or press ", /* @__PURE__ */ React.createElement(Kbd, null, "→")), b.stub && /* @__PURE__ */ React.createElement("span", { className: "sh-cap-stub" }, "The build shows the Mango's own screen here")))), /* @__PURE__ */ React.createElement(Figures, { p }));
  }
  function Figures({ p }) {
    const f = p.station.figures;
    if (!f) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "sh-figs", key: p.act.id + p.station.id }, f.map((x) => /* @__PURE__ */ React.createElement("div", { key: x.label, className: "sh-fig" }, /* @__PURE__ */ React.createElement("span", null, x.label), !x.count ? /* @__PURE__ */ React.createElement(Money, { value: x.value, size: "m", decimals: x.decimals, roll: true, style: { color: x.tone === "red" ? "var(--red-text)" : x.tone === "green" ? "var(--primary-text)" : "var(--fg)" } }) : /* @__PURE__ */ React.createElement("b", { className: "num m", style: { color: x.tone === "red" ? "var(--red-text)" : x.tone === "green" ? "var(--primary-text)" : "var(--fg)" } }, fmt.num(x.value)))));
  }
  function Timeline({ p, onChapters }) {
    const counts = ACTS.map((a) => a.stations.reduce((t, s) => t + s.beats.length, 0));
    const sum = counts.reduce((a, b) => a + b, 0);
    let before = 0;
    const segs = ACTS.map((a, i) => {
      const st = before;
      before += counts[i];
      return { a, i, st, n: counts[i] };
    });
    const pick = (seg, e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const k = Math.min(seg.n - 1, Math.max(0, Math.floor((e.clientX - r.left) / r.width * seg.n)));
      const x = p.flat[seg.st + k];
      p.go(x.a, x.s, x.b);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "sh-bar" }, /* @__PURE__ */ React.createElement("div", { className: "row tight" }, /* @__PURE__ */ React.createElement(IconButton, { icon: "chevron-left", label: "Back a beat", onClick: p.back }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "sh-pp", onClick: () => p.setPlaying(!p.playing), "aria-label": p.playing ? "Pause" : "Play" }, /* @__PURE__ */ React.createElement(Icon, { name: p.playing ? "pause" : "play", size: 22 })), /* @__PURE__ */ React.createElement(IconButton, { icon: "chevron-right", label: "Next beat", onClick: p.next })), /* @__PURE__ */ React.createElement("div", { className: "sh-track", role: "group", "aria-label": "The demo's timeline" }, segs.map((seg) => {
      const cur = seg.i === p.pos.a;
      const fill = p.at < seg.st ? 0 : p.at >= seg.st + seg.n ? 1 : (p.at - seg.st + (p.pos.applied ? 1 : 0.4)) / seg.n;
      return /* @__PURE__ */ React.createElement("button", { key: seg.a.id, type: "button", className: cx("sh-seg", cur && "now"), style: { flexGrow: seg.n }, onClick: (e) => pick(seg, e), "aria-label": `Chapter ${seg.i + 1}: ${seg.a.title}${seg.a.id === "slow" ? ", a slow week" : ""}`, "aria-current": cur ? "step" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "sh-seg-t" }, seg.i + 1, " · ", seg.a.title, seg.a.id === "slow" ? " · slow week" : ""), /* @__PURE__ */ React.createElement("span", { className: "sh-seg-rail" }, /* @__PURE__ */ React.createElement("span", { style: { transform: `scaleX(${fill})` } }), seg.a.stations.slice(1).map((s, k) => {
        const off = seg.a.stations.slice(0, k + 1).reduce((t, x) => t + x.beats.length, 0);
        return /* @__PURE__ */ React.createElement("i", { key: s.id, style: { left: `${off / seg.n * 100}%` } });
      })));
    })), /* @__PURE__ */ React.createElement("div", { className: "row tight sh-bar-r" }, /* @__PURE__ */ React.createElement("span", { className: "sh-count" }, p.at + 1, " / ", sum), /* @__PURE__ */ React.createElement(IconButton, { icon: "list", label: "Chapters", onClick: onChapters })));
  }
  function End({ onAgain }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement(motion.div, { className: "finale sh-end", role: "dialog", "aria-modal": "true", "aria-label": "The end", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "finale-in" }, /* @__PURE__ */ React.createElement(Mark, { size: 56, play: !reduce }), /* @__PURE__ */ React.createElement("h2", { className: "finale-title" }, "Every carton gets a second chance"), /* @__PURE__ */ React.createElement("p", { className: "finale-hi hi", lang: "hi" }, "हर कार्टन को दूसरा मौका"), /* @__PURE__ */ React.createElement("div", { className: "sh-ends" }, ACTS.filter((a) => !a.console).map((a, k) => /* @__PURE__ */ React.createElement(motion.div, { key: a.id, className: "sh-endcol", initial: reduce ? false : { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 + k * 0.15 } }, /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "sh-endname" }, a.title, a.id === "slow" ? " · a slow week" : ""), /* @__PURE__ */ React.createElement(Money, { value: a.outcome.value, roll: true, from: 0, className: "sh-endnum", style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: cx("sh-endline", a.outcome.red && "red") }, a.outcome.line)))), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "rotate-ccw", onClick: onAgain }, "Watch it again")));
  }
  function Show({ start, autoplay, onTitle }) {
    const [card, setCard] = useState(start.s === 0 && start.b === 0 ? start.a : null);
    const [list, setList] = useState(false);
    const p = V.usePlayer(ACTS, start, card != null);
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
        setCard(p.pos.a);
      }
    }, [p.pos.a]);
    useEffect(() => {
      if (card == null || !p.playing) return;
      const t = setTimeout(() => setCard(null), 2800);
      return () => clearTimeout(t);
    }, [card, p.playing]);
    useEffect(() => {
      const f = (e) => {
        if (e.target.closest && e.target.closest("input, textarea, select")) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          card != null ? setCard(null) : p.next();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          p.back();
        } else if (e.key === " " && !(e.target.closest && e.target.closest("button"))) {
          e.preventDefault();
          p.setPlaying(!p.playing);
        }
      };
      window.addEventListener("keydown", f);
      return () => window.removeEventListener("keydown", f);
    });
    const real = app.w < 768;
    return /* @__PURE__ */ React.createElement("div", { className: cx("demo sh-demo", real && "sh-real") }, /* @__PURE__ */ React.createElement("header", { className: "sh-top" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "sh-home", onClick: onTitle, "aria-label": "Back to the title" }, /* @__PURE__ */ React.createElement(Mark, { size: 26 })), !real && /* @__PURE__ */ React.createElement(Wordmark, { size: 15 })), /* @__PURE__ */ React.createElement("span", { className: "sh-top-c" }, /* @__PURE__ */ React.createElement("b", null, p.act.title, p.act.id === "slow" ? " · a slow week" : ""), /* @__PURE__ */ React.createElement("span", null, p.station.title, " · On screen: ", p.beat.screen)), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(ModeMenuButton, null))), /* @__PURE__ */ React.createElement("main", { className: "sh-stage", ref: canvas }, real ? /* @__PURE__ */ React.createElement(V.Stage, { station: p.station, beat: p.beat, act: p.act, size, real: true }) : /* @__PURE__ */ React.createElement(V.Stage, { station: p.station, beat: p.beat, act: p.act, size: { w: size.w, h: Math.max(0, size.h - 150) }, labels: true }), /* @__PURE__ */ React.createElement(Caption, { p })), /* @__PURE__ */ React.createElement(Timeline, { p: Object.assign({}, p, { setPlaying: (v) => {
      if (card != null) setCard(null);
      p.setPlaying(v);
    } }), onChapters: () => setList(true) }), /* @__PURE__ */ React.createElement(AnimatePresence, null, card != null && /* @__PURE__ */ React.createElement(ChapterCard, { a: ACTS[card], i: card, onGo: () => setCard(null) })), /* @__PURE__ */ React.createElement(K.Sheet, { open: list, onClose: () => setList(false), title: "Chapters", detent: "medium" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 8 } }, ACTS.map((a, i) => /* @__PURE__ */ React.createElement("button", { key: a.id, type: "button", className: "sh-chap row", onClick: () => {
      setList(false);
      p.go(i, 0, 0);
    } }, /* @__PURE__ */ React.createElement("span", { className: "sh-chap-vis sm" }, a.console ? /* @__PURE__ */ React.createElement(Icon, { name: "layout-dashboard", size: 18 }) : /* @__PURE__ */ React.createElement("img", { src: img(a.img), alt: "" })), /* @__PURE__ */ React.createElement("span", { className: "sh-chap-t" }, /* @__PURE__ */ React.createElement("span", null, "Chapter ", i + 1), /* @__PURE__ */ React.createElement("b", null, a.title), /* @__PURE__ */ React.createElement("span", null, a.sub)))))), /* @__PURE__ */ React.createElement(AnimatePresence, null, p.pos.end && /* @__PURE__ */ React.createElement(End, { onAgain: () => p.go(0, 0, 0) })));
  }
  function App() {
    const [view, setView] = useState(() => window.SC167_START ? "show" : "title");
    const [start, setStart] = useState(window.SC167_START || { a: 0, s: 0, b: 0 });
    const [auto, setAuto] = useState(window.SC167_PLAY);
    if (view === "title") return /* @__PURE__ */ React.createElement("div", { className: "demo sh-shell" }, /* @__PURE__ */ React.createElement("header", { className: "sh-top" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Mark, { size: 26 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 15 }), /* @__PURE__ */ React.createElement("span", { className: "demo-tag" }, "Guided demo")), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(ModeMenuButton, null))), /* @__PURE__ */ React.createElement("main", { className: "sh-titlewrap" }, /* @__PURE__ */ React.createElement(Title, { onPlay: () => {
      setStart({ a: 0, s: 0, b: 0 });
      setAuto(true);
      setView("show");
    }, onChapter: (i) => {
      setStart({ a: i, s: 0, b: 0 });
      setAuto(false);
      setView("show");
    } })));
    return /* @__PURE__ */ React.createElement(Show, { key: JSON.stringify(start), start, autoplay: auto, onTitle: () => setView("title") });
  }
  function Root() {
    return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "demo-root", style: { position: "fixed", inset: 0 } }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(App, null))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
})();

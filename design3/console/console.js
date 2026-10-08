(function() {
  const { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, Fragment, useSyncExternalStore } = React;
  const { motion, AnimatePresence, useReducedMotion, LayoutGroup } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, P = window.SC3_PLATFORM, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Sheet, Alert, Field, Input, Select, Menu, Tabs, Check, DataTable, Empty, Mark, Wordmark, WorkspaceMark, Page, Shell, Tracker, TrackerCompact, Product, ThemeProvider, AppRoot, NoticeHost, useApp, useNotice, ModeMenuButton, Roll } = K;
  const { Columns, SectionTitle } = S;
  P.usePersistence();
  const usePlatform = () => useSyncExternalStore(P.subscribe, P.get);
  const LINKS = Object.assign({ site: "../site/Smart-Clearance%20site%20v3.html", app: "../app/Smart-Clearance%20app%20v3.html", demo: "../demo/Smart-Clearance%20demo%20v3.html" }, window.SC3_LINKS || {});
  const PLATE = (window.SC3_SITE_IMG || "../site/assets/plates/") + "scene.webp";
  const STAGES = D.STAGES.map((x) => ({ id: x.id, title: x.title, human: x.human }));
  const AGENT = (id) => P.AGENTS.find((a) => a.id === id);
  const LEVEL = (id) => P.AUTONOMY.find((x) => x.id === id);
  const hhmm = () => {
    const d = /* @__PURE__ */ new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };
  const parse = () => {
    const m = /^#\/([a-z-]+)(?:\/([a-z0-9-]+))?(?:\/([a-z-]+))?/.exec(location.hash || "");
    return m ? { name: m[1], id: m[2] || null, tab: m[3] || null } : { name: "overview", id: null, tab: null };
  };
  function useHashRoute() {
    const [route, setRoute] = useState(parse);
    useEffect(() => {
      const f = () => setRoute(parse());
      window.addEventListener("hashchange", f);
      window.addEventListener("popstate", f);
      return () => {
        window.removeEventListener("hashchange", f);
        window.removeEventListener("popstate", f);
      };
    }, []);
    const go = useCallback((name, id, tab, replace) => {
      const h = "#/" + [name, id, tab].filter(Boolean).join("/");
      if (location.hash !== h) {
        if (replace) history.replaceState(null, "", h);
        else history.pushState(null, "", h);
      }
      setRoute(parse());
    }, []);
    return [route, go];
  }
  const SESSION = "sc3-console-session";
  const readSession = () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION) || "null");
    } catch (e) {
      return null;
    }
  };
  const writeSession = (v) => {
    try {
      if (v) localStorage.setItem(SESSION, JSON.stringify(v));
      else localStorage.removeItem(SESSION);
    } catch (e) {
    }
  };
  const NAV = [
    { id: "overview", label: "Overview", short: "Today", icon: "layout-dashboard" },
    { id: "clients", label: "Clients", icon: "building-2" },
    { id: "agents", label: "Agents", icon: "bot" },
    { id: "connectors", label: "Connectors", icon: "plug", phoneHidden: true },
    { id: "plans", label: "Plans", icon: "layout-grid", phoneHidden: true },
    { id: "staff", label: "Staff", icon: "users", phoneHidden: true },
    { id: "audit", label: "Audit log", short: "Audit", icon: "scroll-text" }
  ];
  function Screen({ title, sub, back, onBack, actions, children }) {
    const app = useApp();
    return /* @__PURE__ */ React.createElement(Page, { title, sub, back, onBack, actions: /* @__PURE__ */ React.createElement(React.Fragment, null, actions, app.bp !== "phone" && /* @__PURE__ */ React.createElement(ModeMenuButton, null)) }, children);
  }
  const statusBadge = (c) => c.status === "live" ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", dot: true }, "Live") : /* @__PURE__ */ React.createElement(Badge, { size: "sm", dot: true }, "Setting up");
  const planName = (id) => (P.PLANS.find((p) => p.id === id) || { name: id }).name;
  const agentsOn = (c) => P.AGENTS.filter((a) => !a.gate && c.agents[a.id].on).length;
  const Q = new URLSearchParams(location.search), READ_MS = Number(Q.get("read")) || 450, EASE = [0.22, 1, 0.36, 1];
  const SHAPES = {
    dashboard: [["bar", 28, 1, 0.38], ["tile", 132, 4], ["card", 300, 1], ["card", 300, 1], ["bar", 40, 1, 0.3], ["row", 58, 1], ["row", 58, 1], ["row", 58, 1]],
    table: [["bar", 40, 1, 0.4], ["row", 56, 1], ["row", 56, 1], ["row", 56, 1], ["row", 56, 1], ["row", 56, 1], ["row", 56, 1]],
    list: [["bar", 32, 1, 0.3], ["row", 60, 1], ["row", 60, 1], ["row", 60, 1], ["row", 60, 1], ["row", 60, 1]],
    cards: [["bar", 32, 1, 0.3], ["card", 170, 3], ["card", 170, 3]],
    pipeline: [["card", 520, 2, [1.6, 1]]],
    form: [["bar", 32, 1, 0.3], ["field", 64, 2], ["field", 64, 2], ["field", 64, 1], ["card", 140, 1]],
    client: [["head", 92, 1], ["bar", 44, 1, 0.62], ["card", 460, 2, [1.6, 1]]]
  };
  const SCREEN_SHAPE = { overview: "dashboard", clients: "table", "new-client": "form", agents: "cards", connectors: "cards", plans: "cards", staff: "table", audit: "list" };
  const TAB_SHAPE = { agents: "pipeline", supply: "table", rules: "form", people: "list", integrations: "list", plan: "cards", audit: "list" };
  let screenAt = 0;
  function useRead(k, kind) {
    const [ready, setReady] = useState(() => kind === "tab" && Date.now() - screenAt < 200);
    const last = useRef(ready ? k : null);
    useEffect(() => {
      if (last.current === k) return;
      last.current = k;
      setReady(false);
      const t = setTimeout(() => {
        if (kind === "screen") screenAt = Date.now();
        setReady(true);
      }, READ_MS);
      return () => clearTimeout(t);
    }, [k]);
    return ready;
  }
  function RouteBar({ done }) {
    const reduce = useReducedMotion();
    const [gone, setGone] = useState(false);
    useEffect(() => {
      if (!done) return;
      const t = setTimeout(() => setGone(true), reduce ? 0 : 760);
      return () => clearTimeout(t);
    }, [done]);
    if (gone) return null;
    return /* @__PURE__ */ React.createElement(motion.div, { className: "cs-route", "aria-hidden": "true", animate: { opacity: done ? 0 : 1 }, transition: { duration: 0.24, delay: done && !reduce ? 0.5 : 0 } }, /* @__PURE__ */ React.createElement(motion.i, { className: "line", initial: { width: reduce ? "88%" : "0%" }, animate: { width: done ? "100%" : "88%" }, transition: done ? { duration: reduce ? 0 : 0.16, ease: EASE } : { duration: reduce ? 0 : 1.2, ease: [0.3, 0.7, 0.4, 1] } }, /* @__PURE__ */ React.createElement(motion.b, { className: "pin", initial: false, animate: done ? { scale: [0, 1.35, 1] } : { scale: 0.6 }, transition: { duration: reduce ? 0 : 0.42, ease: EASE, delay: done && !reduce ? 0.12 : 0 } })));
  }
  function Bones({ kind }) {
    if (kind === "tile") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b w40" }), /* @__PURE__ */ React.createElement("i", { className: "b big w60" }), /* @__PURE__ */ React.createElement("i", { className: "b spark" }));
    if (kind === "card") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b w30" }), /* @__PURE__ */ React.createElement("i", { className: "b w20 thin" }), /* @__PURE__ */ React.createElement("i", { className: "b area" }));
    if (kind === "row") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b dot" }), /* @__PURE__ */ React.createElement("span", { className: "col" }, /* @__PURE__ */ React.createElement("i", { className: "b w50" }), /* @__PURE__ */ React.createElement("i", { className: "b w30 thin" })), /* @__PURE__ */ React.createElement("i", { className: "b w10" }));
    if (kind === "head") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b mark" }), /* @__PURE__ */ React.createElement("span", { className: "col" }, /* @__PURE__ */ React.createElement("i", { className: "b w30" }), /* @__PURE__ */ React.createElement("i", { className: "b w50 thin" })));
    if (kind === "field") return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "b w30 thin" }), /* @__PURE__ */ React.createElement("i", { className: "b input" }));
    return /* @__PURE__ */ React.createElement("i", { className: "b fill" });
  }
  function Placeholder({ shape }) {
    const app = useApp();
    const phone = app.bp === "phone";
    let n = 0;
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ph" }, (SHAPES[shape] || SHAPES.list).map(([kind, h, cols, w], row) => {
      const many = phone ? Math.min(cols, kind === "tile" ? 2 : 1) : cols, weights = Array.isArray(w) && !phone ? w : null;
      return /* @__PURE__ */ React.createElement("div", { key: row, className: cx("cs-ph-row", "k-" + kind), style: { gridTemplateColumns: weights ? weights.map((x) => x + "fr").join(" ") : `repeat(${many}, minmax(0, 1fr))`, width: typeof w === "number" ? w * 100 + "%" : void 0 } }, Array.from({ length: many }, () => n++).map((i) => /* @__PURE__ */ React.createElement("div", { key: i, className: cx("cs-ph-blk", "k-" + kind), style: { height: phone && kind === "card" ? Math.min(h, 220) : h, "--i": i } }, /* @__PURE__ */ React.createElement(Bones, { kind }))));
    }));
  }
  function Loading({ k, shape, kind, title, children }) {
    const ready = useRead(k, kind);
    const ph = /* @__PURE__ */ React.createElement("div", { className: "cs-load", role: "status", "aria-busy": "true" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Loading ", kind === "tab" ? "the tab" : title), /* @__PURE__ */ React.createElement(Placeholder, { shape }));
    return /* @__PURE__ */ React.createElement("div", { className: "cs-loading" }, /* @__PURE__ */ React.createElement(RouteBar, { key: k, done: ready }), ready ? /* @__PURE__ */ React.createElement("div", { className: "cs-in", "data-kind": kind }, children) : kind === "screen" ? /* @__PURE__ */ React.createElement(Page, { title }, ph) : ph);
  }
  const WRONG = "That email and password don't match. Check both, or ask a Super admin to put your account back on its first password.";
  function SignIn({ onIn }) {
    const app = useApp();
    const s = usePlatform();
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [show, setShow] = useState(false);
    const [err, setErr] = useState("");
    const [phase, setPhase] = useState("idle");
    const [first, setFirst] = useState("");
    const [find, setFind] = useState(false);
    const reduce = useReducedMotion();
    const submit = (e) => {
      e.preventDefault();
      setErr("");
      const who = s.staff.find((x) => x.status === "active" && x.email.toLowerCase() === email.trim().toLowerCase());
      if (!who || !pw) {
        setPhase("error");
        setTimeout(() => {
          setPhase("idle");
          setErr(WRONG);
        }, reduce ? 0 : 360);
        return;
      }
      setPhase("busy");
      setFirst(who.name.split(" ")[0]);
      setTimeout(() => {
        setPhase("done");
        setTimeout(() => {
          setPhase("idle");
          onIn(who.id);
        }, 720);
      }, Math.max(1100, READ_MS));
    };
    const edit = (set) => (e) => {
      set(e.target.value);
      setErr("");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "signin cs-signin" }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" }), app.bp === "desktop" && /* @__PURE__ */ React.createElement("div", { className: "cs-si-stage" }, /* @__PURE__ */ React.createElement("div", { className: "si-product" }, /* @__PURE__ */ React.createElement(Mark, { size: 36 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 21 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("h2", { className: "cs-si-title" }, "Console"), /* @__PURE__ */ React.createElement("p", { className: "cs-si-lede" }, "Set up and run every client's workspace: its agents, its supply chain, its people.")), /* @__PURE__ */ React.createElement("img", { className: "cs-si-plate", src: PLATE, alt: "", width: "1376", height: "752" })), /* @__PURE__ */ React.createElement("div", { className: "si-panel" }, /* @__PURE__ */ React.createElement("div", { className: "si-card" }, /* @__PURE__ */ React.createElement("div", { className: "si-ws" }, /* @__PURE__ */ React.createElement(Mark, { size: app.bp === "phone" ? 52 : 60 }), /* @__PURE__ */ React.createElement("div", { className: "si-ws-name" }, "Smart-Clearance staff"), /* @__PURE__ */ React.createElement("span", { className: "si-url" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 12, stroke: 2.2 }), "console.smartclearance.com")), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("h1", { className: "si-title" }, "Sign in"), /* @__PURE__ */ React.createElement("p", { className: "si-sub" }, "Your smartclearance.com email address and your password.")), /* @__PURE__ */ React.createElement("form", { className: "si-form", noValidate: true, onSubmit: submit }, /* @__PURE__ */ React.createElement(Field, { label: "Work email", htmlFor: "si-email" }, /* @__PURE__ */ React.createElement(Input, { id: "si-email", icon: "mail", type: "email", value: email, onChange: edit(setEmail), autoComplete: "username", spellCheck: false, autoCapitalize: "none", placeholder: "name@smartclearance.com" })), /* @__PURE__ */ React.createElement(Field, { label: "Password", htmlFor: "si-pw" }, /* @__PURE__ */ React.createElement("span", { className: "input-wrap cs-si-pw" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 17 }), /* @__PURE__ */ React.createElement("input", { id: "si-pw", className: "input", type: show ? "text" : "password", value: pw, onChange: edit(setPw), autoComplete: "current-password" }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "cs-si-eye", "aria-label": show ? "Hide password" : "Show password", "aria-pressed": show, onClick: () => setShow(!show) }, /* @__PURE__ */ React.createElement(Icon, { name: show ? "eye-off" : "eye", size: 20 })))), err && /* @__PURE__ */ React.createElement("div", { className: "cs-si-error", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 18 }), /* @__PURE__ */ React.createElement("span", null, err)), /* @__PURE__ */ React.createElement(SignInButton, { phase, name: first }), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted cs-si-hint" }, "New to the console? The platform team gives you your first password. Nothing is sent by email.")), /* @__PURE__ */ React.createElement("div", { className: "si-foot" }, /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted", style: { maxWidth: "36ch" } }, "Client teams sign in at their own workspace address, such as munchly.smartclearance.com."), /* @__PURE__ */ React.createElement("span", { className: "si-foot-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm", onClick: () => setFind(true) }, "Find a workspace"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-link btn-sm", href: LINKS.site }, "smartclearance.com")), /* @__PURE__ */ React.createElement("span", { className: "si-note" }, "Prototype · every person and number is fictional")))), /* @__PURE__ */ React.createElement(S.FindWorkspace, { open: find, onClose: () => setFind(false), onUse: () => {
      setFind(false);
      if (!window.open(LINKS.app, "_blank", "noopener")) location.href = LINKS.app;
    } }));
  }
  const S_PATH = "M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5";
  function SignInButton({ phase, name }) {
    const reduce = useReducedMotion();
    const busy = phase === "busy", done = phase === "done", err = phase === "error";
    const label = done ? `Welcome, ${name}` : busy ? "Signing in…" : "Sign in";
    return /* @__PURE__ */ React.createElement(
      motion.button,
      {
        type: "submit",
        className: cx("btn btn-primary btn-lg btn-block cs-si-btn", (busy || done) && "on"),
        "aria-disabled": busy || done || void 0,
        animate: err && !reduce ? { x: [0, -8, 8, -5, 5, -2, 0] } : { x: 0 },
        transition: { duration: 0.36, ease: "easeOut" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "cs-si-ic", "aria-hidden": "true" }, done ? /* @__PURE__ */ React.createElement(motion.svg, { width: "20", height: "20", viewBox: "0 0 24 24", initial: reduce ? false : { scale: 0.4 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 520, damping: 22 } }, /* @__PURE__ */ React.createElement(motion.path, { d: "M5 12.5l4.5 4.5L19 7.5", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", initial: { pathLength: reduce ? 1 : 0 }, animate: { pathLength: 1 }, transition: { duration: reduce ? 0 : 0.28, ease: EASE } })) : busy ? /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "12 12 40 40" }, /* @__PURE__ */ React.createElement("circle", { cx: "43.5", cy: "19", r: "4", fill: "currentColor" }), /* @__PURE__ */ React.createElement(motion.path, { d: S_PATH, fill: "none", stroke: "currentColor", strokeWidth: "5", strokeLinecap: "round", strokeLinejoin: "round", initial: { pathLength: reduce ? 1 : 0 }, animate: { pathLength: 1 }, transition: { duration: reduce ? 0 : 1.1, ease: [0.65, 0, 0.35, 1] } })) : /* @__PURE__ */ React.createElement(Icon, { name: "log-in", size: 18 })),
      /* @__PURE__ */ React.createElement("span", { className: "cs-si-lbl" }, /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, /* @__PURE__ */ React.createElement(motion.span, { key: label, initial: reduce ? false : { y: 12, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -12, opacity: 0 }, transition: { duration: 0.24, ease: EASE } }, label))),
      (busy || done) && /* @__PURE__ */ React.createElement(motion.i, { className: "cs-si-prog", "aria-hidden": "true", initial: { scaleX: reduce ? 0.9 : 0 }, animate: { scaleX: done ? 1 : 0.9 }, transition: { duration: reduce ? 0 : done ? 0.16 : 1.1, ease: done ? EASE : [0.3, 0.7, 0.4, 1] } }),
      /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, busy ? "Signing in" : done ? `Signed in. Welcome, ${name}.` : "")
    );
  }
  const LIVE_KEY = "sc3-console-live";
  const STOP_TITLES = D.STAGES.map((x) => x.title);
  const two = (n) => String(n).padStart(2, "0");
  const lakh = (v) => "₹" + (v / 1e5).toFixed(1) + " lakh";
  const kAxis = (v) => v >= 1e5 ? "₹" + (v / 1e5).toFixed(v % 1e5 ? 1 : 0) + "L" : v ? "₹" + Math.round(v / 1e3) + "k" : "0";
  function MoneyFig({ value }) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "cur", "aria-hidden": "true" }, "₹"), /* @__PURE__ */ React.createElement(Roll, { value: Math.round(value), from: 0, hidden: true }), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, fmt.inr(value)));
  }
  const useWidth = (ref, initial) => {
    const [w, setW] = useState(initial);
    useLayoutEffect(() => {
      if (!ref.current) return;
      const ro = new ResizeObserver(([e]) => setW(Math.max(120, Math.round(e.contentRect.width))));
      ro.observe(ref.current);
      return () => ro.disconnect();
    }, []);
    return w;
  };
  function Sparkline({ values, tone }) {
    const box = useRef(null);
    const W = useWidth(box, 220);
    const reduce = useReducedMotion();
    const H = 36, max = Math.max(1, ...values), n = values.length;
    const X = (i) => n > 1 ? i / (n - 1) * W : W / 2, Y = (v) => H - 3 - v / max * (H - 8);
    const line = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" "), area = `${line} L${W} ${H} L0 ${H} Z`;
    const col = tone === "amber" ? "var(--amber)" : "var(--primary)", move = { duration: reduce ? 0 : 0.42, ease: EASE };
    return /* @__PURE__ */ React.createElement("div", { ref: box, className: "cs-ov-sparkbox" }, /* @__PURE__ */ React.createElement("svg", { className: "cs-ov-spark", viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(motion.path, { key: "a" + n, fill: col, initial: { opacity: 0, d: area }, animate: { opacity: 0.1, d: area }, transition: { opacity: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : 0.45 }, d: move } }), /* @__PURE__ */ React.createElement(motion.path, { key: "l" + n, fill: "none", stroke: col, strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round", initial: { pathLength: reduce ? 1 : 0, d: line }, animate: { pathLength: 1, d: line }, transition: { pathLength: { duration: reduce ? 0 : 0.7, ease: EASE, delay: reduce ? 0 : 0.15 }, d: move } })));
  }
  function Kpi({ label, icon, children, foot, spark, tone }) {
    return /* @__PURE__ */ React.createElement("div", { className: cx("cs-ov-kpi", tone) }, /* @__PURE__ */ React.createElement("span", { className: "k-label" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 15 }), label), /* @__PURE__ */ React.createElement("span", { className: "k-value" }, typeof children === "number" ? /* @__PURE__ */ React.createElement(Roll, { value: children, from: 0 }) : children), /* @__PURE__ */ React.createElement("span", { className: "k-foot" }, foot), spark && /* @__PURE__ */ React.createElement(Sparkline, { values: spark, tone }));
  }
  function RecoveredChart({ byDay, height }) {
    const box = useRef(null);
    const w = useWidth(box, 640);
    const [hover, setHover] = useState(null);
    const reduce = useReducedMotion();
    const today = byDay[byDay.length - 1], was = useRef(today ? today.recovered : 0);
    const [gain, setGain] = useState(null);
    useEffect(() => {
      const v = today ? today.recovered : 0, before = was.current;
      was.current = v;
      if (v > before) {
        setGain({ v: v - before, at: Date.now() });
        const t = setTimeout(() => setGain(null), 2600);
        return () => clearTimeout(t);
      }
    }, [today && today.recovered]);
    const H = height, pl = 46, pr = 8, pt = 10, pb = 24, n = byDay.length;
    const peak = Math.max(0, ...byDay.map((d) => d.recovered));
    const step = peak <= 0 ? 25e3 : Math.pow(10, Math.floor(Math.log10(peak / 4))) * ([1, 2, 2.5, 5, 10].find((m) => peak / 4 / Math.pow(10, Math.floor(Math.log10(peak / 4))) <= m) || 10);
    const top = Math.max(step * 4, step * Math.ceil(peak / step));
    const X = (i) => pl + (n > 1 ? i / (n - 1) * (w - pl - pr) : (w - pl - pr) / 2), Y = (v) => pt + (1 - v / top) * (H - pt - pb);
    const line = byDay.map((d, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(d.recovered).toFixed(1)}`).join(" ");
    const ticks = [];
    for (let t = 0; t <= top + 1; t += top / 4) ticks.push(t);
    const every = n <= 7 ? 1 : n <= 30 ? 7 : 14;
    const best = byDay.reduce((a, d) => d.recovered > a.recovered ? d : a, byDay[0] || { recovered: 0 });
    const onMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * w;
      setHover(Math.max(0, Math.min(n - 1, Math.round((px - pl) / (w - pl - pr) * (n - 1)))));
    };
    const total = byDay.reduce((t, d) => t + d.recovered, 0);
    const area = `${line} L${X(n - 1)} ${Y(0)} L${X(0)} ${Y(0)} Z`, move = { duration: reduce ? 0 : 0.42, ease: EASE }, tx = X(n - 1), ty = Y(today ? today.recovered : 0);
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ov-chart", ref: box, onMouseLeave: () => setHover(null) }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${w} ${H}`, height: H, onMouseMove: onMove, role: "img", "aria-label": `Recovered a day, the last ${n} days: ${fmt.inr(total)} in all${best.recovered ? `, highest ${fmt.inr(best.recovered)} on ${best.label}` : ""}` }, ticks.map((t) => /* @__PURE__ */ React.createElement("line", { key: t, className: t ? "gl" : "base", x1: pl, x2: w - pr, y1: Y(t), y2: Y(t) })), ticks.map((t) => /* @__PURE__ */ React.createElement("text", { key: "t" + t, className: "ax", x: pl - 8, y: Y(t) + 4, textAnchor: "end" }, kAxis(t))), byDay.map((d, i) => i % every === 0 && i < n - Math.ceil(every / 2) || i === n - 1 ? /* @__PURE__ */ React.createElement("text", { key: d.date, className: "ax", x: X(i), y: H - 6, textAnchor: i === n - 1 ? "end" : "middle" }, i === n - 1 ? "Today" : d.label) : null), /* @__PURE__ */ React.createElement(motion.path, { key: "a" + n, fill: "var(--primary)", initial: { opacity: 0, d: area }, animate: { opacity: 0.1, d: area }, transition: { opacity: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : 0.7 }, d: move } }), /* @__PURE__ */ React.createElement(motion.path, { key: "l" + n, fill: "none", stroke: "var(--primary)", strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round", initial: { pathLength: reduce ? 1 : 0, d: line }, animate: { pathLength: 1, d: line }, transition: { pathLength: { duration: reduce ? 0 : 0.9, ease: [0.45, 0, 0.25, 1] }, d: move } }), /* @__PURE__ */ React.createElement(motion.g, { key: "t" + n, initial: reduce ? false : { scale: 0, opacity: 0, x: tx, y: ty }, animate: { scale: 1, opacity: 1, x: tx, y: ty }, transition: { scale: { delay: reduce ? 0 : 0.9, type: "spring", stiffness: 420, damping: 20 }, opacity: { delay: reduce ? 0 : 0.9, duration: 0.16 }, x: move, y: move } }, gain && !reduce && /* @__PURE__ */ React.createElement(motion.circle, { key: gain.at, r: "5", fill: "none", stroke: "var(--primary)", strokeWidth: "2", initial: { scale: 1, opacity: 0.7 }, animate: { scale: 3, opacity: 0 }, transition: { duration: 1.2, ease: "easeOut" } }), /* @__PURE__ */ React.createElement("circle", { r: "4.5", fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: "2" })), hover != null && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("line", { x1: X(hover), x2: X(hover), y1: pt, y2: H - pb, stroke: "var(--line-2)" }), /* @__PURE__ */ React.createElement("circle", { cx: X(hover), cy: Y(byDay[hover].recovered), r: "5", fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: "2" }))), /* @__PURE__ */ React.createElement(AnimatePresence, null, gain && /* @__PURE__ */ React.createElement(motion.span, { key: gain.at, className: "cs-ov-gain", style: { left: `${tx / w * 100}%`, top: ty - 36, x: "-100%" }, initial: reduce ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: reduce ? 0 : -6 }, transition: { duration: 0.24, ease: EASE } }, "+", fmt.inr(gain.v))), hover != null && /* @__PURE__ */ React.createElement("div", { className: "tip", style: { left: hover > n / 2 ? `calc(${X(hover) / w * 100}% - 184px)` : `calc(${X(hover) / w * 100}% + 12px)`, top: 8 } }, /* @__PURE__ */ React.createElement("b", null, hover === n - 1 ? "Today" : byDay[hover].label), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Recovered"), /* @__PURE__ */ React.createElement("span", null, fmt.inr(byDay[hover].recovered))), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Batches closed"), /* @__PURE__ */ React.createElement("span", null, byDay[hover].closed)), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Packs closed"), /* @__PURE__ */ React.createElement("span", null, byDay[hover].units.toLocaleString("en-IN"))), /* @__PURE__ */ React.createElement("div", { className: "tr" }, /* @__PURE__ */ React.createElement("span", null, "Agent runs"), /* @__PURE__ */ React.createElement("span", null, byDay[hover].runs))));
  }
  const STOP_AGENTS = D.STAGES.map((x) => P.AGENTS.filter((a) => a.stage === x.id));
  const markKey = (b) => b.client + "/" + b.ref;
  function AgentsAtWork({ d, run, paused, client, value, onPick }) {
    const reduce = useReducedMotion();
    const stops = useMemo(() => d.atStop.concat([d.closedToday.batches]), [d]);
    const latest = useMemo(() => Math.max(0, ...stops.flat().map((b) => Date.parse(b.at))), [stops]);
    const was = useRef(null);
    const [moved, setMoved] = useState({ keys: {}, stops: {} });
    useEffect(() => {
      const before = was.current;
      was.current = latest;
      if (before == null || latest <= before) return;
      const keys = {}, lit = {};
      stops.forEach((list, i) => list.forEach((b) => {
        if (Date.parse(b.at) > before) {
          keys[markKey(b)] = true;
          lit[i] = true;
        }
      }));
      setMoved({ keys, stops: lit });
      const t = setTimeout(() => setMoved({ keys: {}, stops: {} }), 1600);
      return () => clearTimeout(t);
    }, [latest]);
    const ra = run && AGENT(run.agent), rc = run && client(run.client);
    const token = (b) => {
      const c = client(b.client);
      return /* @__PURE__ */ React.createElement(motion.span, { key: markKey(b), layoutId: "aw-" + markKey(b), layout: reduce ? false : "position", className: cx("cs-aw-tok", moved.keys[markKey(b)] && "moved"), transition: { layout: { type: "spring", stiffness: 170, damping: 24, mass: 1 } } }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 22 }));
    };
    const stop = (i, inner, n, more) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "toks", "aria-hidden": "true" }, inner, more > 0 && /* @__PURE__ */ React.createElement("span", { className: "more" }, "+", more)), /* @__PURE__ */ React.createElement("span", { className: "node", "aria-hidden": "true" }, moved.stops[i] && !reduce && /* @__PURE__ */ React.createElement(motion.i, { className: "ping", initial: { scale: 1, opacity: 0.55 }, animate: { scale: 2.1, opacity: 0 }, transition: { duration: 1.2, ease: "easeOut" } }), /* @__PURE__ */ React.createElement(Icon, { name: i === 9 ? "indian-rupee" : i === 5 ? "hand" : (STOP_AGENTS[i][0] || {}).icon || "bot", size: 16 })));
    return /* @__PURE__ */ React.createElement("section", { className: "cs-ov-card cs-aw", "aria-labelledby": "cs-aw-t" }, /* @__PURE__ */ React.createElement("div", { className: "cs-ov-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "t", id: "cs-aw-t" }, "Agents at work"), /* @__PURE__ */ React.createElement("div", { className: "s" }, d.inFlight, " batch", d.inFlight === 1 ? "" : "es", " on the route · each mark is a client's batch, moving as the agents finish · choose a stop to list them")), /* @__PURE__ */ React.createElement("span", { className: cx("cs-aw-state", paused && "paused") }, paused ? "Paused" : "Moving as readings arrive")), /* @__PURE__ */ React.createElement(LayoutGroup, { id: "cs-aw" }, /* @__PURE__ */ React.createElement("div", { className: "cs-aw-track", role: "group", "aria-label": "Batches in flight by stop" }, /* @__PURE__ */ React.createElement("i", { className: "cs-aw-rail", "aria-hidden": "true" }), STOP_TITLES.map((t, i) => {
      const n = d.byStop[i], list = d.atStop[i], ag = STOP_AGENTS[i], human = i === 5;
      const who = human ? "You" : ag.length > 1 ? `${ag[0].name} +${ag.length - 1}` : ag[0] ? ag[0].name : "";
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: t,
          type: "button",
          className: cx("cs-aw-stop", human && "human", !n && "zero", moved.stops[i] && "lit"),
          "aria-pressed": value === i,
          "aria-label": `${t}: ${n} batch${n === 1 ? "" : "es"}, ${human ? "waiting for a person" : "with the " + (ag.length > 1 ? ag.map((a) => a.name).join(", ") : who)}. ${value === i ? "Shown in the table" : "Show them in the table"}`,
          onClick: () => onPick(value === i ? null : i)
        },
        stop(i, list.map(token), n, n - list.length),
        /* @__PURE__ */ React.createElement("span", { className: "lbl", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("b", null, t), /* @__PURE__ */ React.createElement("span", null, who)),
        /* @__PURE__ */ React.createElement("span", { className: "n", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Roll, { value: n }))
      );
    }), /* @__PURE__ */ React.createElement("div", { className: cx("cs-aw-stop end", moved.stops[9] && "lit"), role: "img", "aria-label": `Closed today: ${d.closedToday.count} batch${d.closedToday.count === 1 ? "" : "es"}, ${fmt.inr(d.closedToday.recovered)} recovered` }, stop(9, d.closedToday.batches.map(token), d.closedToday.count, d.closedToday.count - d.closedToday.batches.length), /* @__PURE__ */ React.createElement("span", { className: "lbl", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("b", null, "Closed today"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Roll, { value: Math.round(d.closedToday.recovered), format: (v) => "₹" + Math.round(v).toLocaleString("en-IN") }))), /* @__PURE__ */ React.createElement("span", { className: "n", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Roll, { value: d.closedToday.count }))))), /* @__PURE__ */ React.createElement("div", { className: "cs-aw-ticker", "aria-live": "polite" }, run ? /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, /* @__PURE__ */ React.createElement(motion.p, { key: run.at + run.agent + run.text, initial: reduce ? false : { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -10 }, transition: { duration: 0.24, ease: EASE } }, /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote" }, run.at), /* @__PURE__ */ React.createElement("b", null, ra ? ra.name : run.agent), /* @__PURE__ */ React.createElement("span", { className: "who" }, rc ? rc.name : run.client), /* @__PURE__ */ React.createElement("span", { className: "txt" }, run.text))) : /* @__PURE__ */ React.createElement("p", null, "No runs yet today")));
  }
  function StopSeg({ stage }) {
    return /* @__PURE__ */ React.createElement("span", { className: "cs-ov-seg", "aria-hidden": "true" }, STOP_TITLES.map((_, i) => /* @__PURE__ */ React.createElement("i", { key: i, className: cx(i < stage && "done", i === stage && "now", i === stage && i === 5 && "human") })));
  }
  const stopText = (r) => r.closed ? r.outcome ? r.outcome[0].toUpperCase() + r.outcome.slice(1) : "Closed" : r.stage === 5 ? "Waiting for a yes" : STOP_TITLES[r.stage];
  function Pager({ page, size, total, onPage, onSize, phone }) {
    const pages = Math.max(1, Math.ceil(total / size));
    const from = total ? (page - 1) * size + 1 : 0, to = Math.min(total, page * size);
    const nums = [];
    for (let p = Math.max(1, Math.min(page - 2, pages - 4)); p <= Math.min(pages, Math.max(1, Math.min(page - 2, pages - 4)) + 4); p++) nums.push(p);
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ov-pager" }, /* @__PURE__ */ React.createElement("span", null, total ? `${from}–${to} of ${total}` : "None", !phone && /* @__PURE__ */ React.createElement(React.Fragment, null, " · ", /* @__PURE__ */ React.createElement("label", { className: "cs-ov-rows" }, "Rows ", /* @__PURE__ */ React.createElement("select", { className: "cs-ov-sel", value: size, onChange: (e) => onSize(Number(e.target.value)) }, P.SIZES.map((n) => /* @__PURE__ */ React.createElement("option", { key: n, value: n }, n)))))), /* @__PURE__ */ React.createElement("nav", { className: "pg", "aria-label": "Pages" }, /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "Previous page", disabled: page <= 1, onClick: () => onPage(page - 1) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 16 })), !phone && nums.map((p) => /* @__PURE__ */ React.createElement("button", { key: p, type: "button", "aria-current": p === page ? "page" : void 0, "aria-label": `Page ${p}`, onClick: () => onPage(p) }, p)), /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "Next page", disabled: page >= pages, onClick: () => onPage(page + 1) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16 }))));
  }
  function Overview({ go, me }) {
    const s = usePlatform();
    const app = useApp();
    const { toast } = useNotice();
    const phone = app.bp === "phone";
    const [paused, setPaused] = useState(() => {
      try {
        return localStorage.getItem(LIVE_KEY) === "paused";
      } catch (e) {
        return false;
      }
    });
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
      if (paused) return;
      const t = setInterval(() => setNow(Date.now()), 3e4);
      return () => clearInterval(t);
    }, [paused]);
    useEffect(() => {
      if (!paused) setNow(Date.now());
    }, [s.seq]);
    const togglePause = () => {
      const next = !paused;
      setPaused(next);
      try {
        localStorage.setItem(LIVE_KEY, next ? "paused" : "live");
      } catch (e) {
      }
      if (!next) setNow(Date.now());
    };
    const [days, setDays] = useState(30);
    const [q, setQ] = useState({ status: "in-flight", client: null, stop: null, q: "", sort: "priority", dir: "asc", page: 1, size: 8 });
    const set = (patch) => setQ((x) => Object.assign({}, x, patch, "page" in patch ? {} : { page: 1 }));
    const d = useMemo(() => P.dashboard(s, { days, now }), [s, days, now]);
    const page = useMemo(() => P.batchPage(s, q), [s, q, now]);
    const live = s.clients.filter((c) => c.status === "live"), setup = s.clients.length - live.length;
    const on = live.reduce((t, c) => t + agentsOn(c), 0);
    const date = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    const client = (id) => s.clients.find((c) => c.id === id);
    const change = d.recoveredBefore ? Math.round((d.recovered - d.recoveredBefore) / d.recoveredBefore * 100) : null;
    const attention = [];
    s.clients.forEach((c) => {
      c.distributors.filter((x) => x.permission !== "given").forEach((x) => attention.push({ id: c.id + "-" + x.id, c, tone: "amber", title: x.name, text: "one-time permission not given yet", act: "Ask again", run: () => {
        P.update(() => {
        }, { who: me.name, client: c.id, text: `Asked ${x.name} again for its one-time permission` });
        toast({ text: `Reminder sent to ${x.name}`, tone: "ok" });
      } }));
      if (c.status !== "live") {
        const admin = c.people.find((p) => p.access === "Admin");
        attention.push({ id: c.id + "-invite", c, tone: "amber", title: c.name, text: `waiting for ${admin ? admin.name : "its admin"} to accept the invitation`, act: "Open", run: () => go("clients", c.id, "people") });
      }
    });
    if (s.clients.some((c) => c.id === "munchly")) attention.push({ id: "gupta-export", c: client("munchly"), tone: "blue", title: "Gupta & Sons", text: "stock export arrived 2 h late today", act: "Open", run: () => go("clients", "munchly", "supply") });
    const startFrom = (r) => {
      const plan = (P.PLANS.find((p) => p.name === r.plan) || P.PLANS[0]).id;
      const domain = (r.email.split("@")[1] || "").toLowerCase();
      P.update((x) => {
        x.draft = { name: r.company, industry: INDUSTRIES.includes(r.makes) ? r.makes : INDUSTRIES[0], emailDomain: domain, adminName: r.name, adminEmail: r.email, plan, request: r.id };
      });
      go("new-client");
    };
    const [asTable, setAsTable] = useState(false);
    const header = (label, key, num2 = true) => /* @__PURE__ */ React.createElement("th", { className: num2 ? "n" : void 0, "aria-sort": q.sort === key ? q.dir === "asc" ? "ascending" : "descending" : void 0 }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => set({ sort: key, dir: q.sort === key && q.dir === "asc" ? "desc" : "asc" }) }, label, q.sort === key && /* @__PURE__ */ React.createElement(Icon, { name: q.dir === "asc" ? "chevron-up" : "chevron-down", size: 13 })));
    const liveBar = /* @__PURE__ */ React.createElement("div", { className: "cs-ov-live", role: "status" }, /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: paused ? void 0 : "green", dot: true }, paused ? "Paused" : "Live"), /* @__PURE__ */ React.createElement("span", null, "Read at ", /* @__PURE__ */ React.createElement("span", { className: "tnum" }, d.readAt), paused ? "" : " · every 30 s"), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", icon: paused ? "play" : "pause", "aria-pressed": paused, onClick: togglePause }, paused ? "Resume updates" : "Pause updates"));
    const kpis = /* @__PURE__ */ React.createElement("div", { className: "cs-ov-kpis" }, /* @__PURE__ */ React.createElement(Kpi, { label: `Recovered, ${days} days`, icon: "indian-rupee", spark: d.byDay.map((x) => x.recovered), foot: change == null ? `nothing in the ${days} days before` : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: change >= 0 ? "up" : "warn" }, /* @__PURE__ */ React.createElement(Icon, { name: change >= 0 ? "trending-up" : "trending-down", size: 14 }), change >= 1e3 ? `${Math.round(d.recovered / d.recoveredBefore)}×` : `${Math.abs(change)}%`), " on the ", days, " days before") }, /* @__PURE__ */ React.createElement(MoneyFig, { value: d.recovered })), /* @__PURE__ */ React.createElement(Kpi, { label: "Batches in flight", icon: "boxes", spark: d.inFlightSeries, foot: `across ${d.inFlightClients} client${d.inFlightClients === 1 ? "" : "s"}` }, d.inFlight), /* @__PURE__ */ React.createElement(Kpi, { label: "Waiting for a yes", icon: "hand", tone: d.waiting ? "amber" : void 0, foot: d.oldestWaiting ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "warn" }, "oldest ", d.oldestWaiting.hours, " h"), " · ", d.oldestWaiting.client) : "nothing waiting" }, d.waiting), /* @__PURE__ */ React.createElement(Kpi, { label: "Agent runs today", icon: "bot", spark: d.byDay.map((x) => x.runs), foot: `${on} agents on` }, d.runsToday));
    const best = d.byDay.reduce((a, x) => x.recovered > a.recovered ? x : a, d.byDay[0]);
    const trend = /* @__PURE__ */ React.createElement("section", { className: "cs-ov-card" }, /* @__PURE__ */ React.createElement("div", { className: "cs-ov-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "t" }, "Recovered, by day"), /* @__PURE__ */ React.createElement("div", { className: "s" }, "Every client · what closed batches recovered")), /* @__PURE__ */ React.createElement(Segmented, { label: "Range", value: String(days), onChange: (v) => setDays(Number(v)), options: P.RANGES.map((n) => ({ id: String(n), label: `${n} days` })) })), /* @__PURE__ */ React.createElement("div", { className: "cs-ov-big" }, /* @__PURE__ */ React.createElement(MoneyFig, { value: d.recovered }), " ", /* @__PURE__ */ React.createElement("span", { className: "cs-ov-in" }, "in ", days, " days")), asTable ? /* @__PURE__ */ React.createElement("div", { className: "cs-ov-daytable" }, /* @__PURE__ */ React.createElement(DataTable, { label: "Recovered, by day", rows: d.byDay.slice().reverse(), rowKey: "date", dense: true, columns: [{ key: "label", label: "Day" }, { key: "recovered", label: "Recovered", num: true, render: (x) => fmt.inr(x.recovered) }, { key: "closed", label: "Closed", num: true }, { key: "units", label: "Packs", num: true, render: (x) => x.units.toLocaleString("en-IN") }, { key: "runs", label: "Runs", num: true }] })) : /* @__PURE__ */ React.createElement(RecoveredChart, { byDay: d.byDay, height: phone ? 180 : 210 }), /* @__PURE__ */ React.createElement("div", { className: "cs-ov-foot" }, /* @__PURE__ */ React.createElement("span", null, best && best.recovered ? `Highest ${fmt.inr(best.recovered)} on ${best.label}` : "Nothing recovered yet in this range", d.recoveredBefore ? ` · ${lakh(d.recoveredBefore)} the ${days} days before` : ""), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "link", icon: asTable ? "chart-line" : "file-spreadsheet", onClick: () => setAsTable(!asTable) }, asTable ? "Show as a chart" : "Show as a table")));
    const agents = /* @__PURE__ */ React.createElement(AgentsAtWork, { d, run: s.runs[0], paused, client, value: q.status === "in-flight" ? q.stop : null, onPick: (i) => set({ status: "in-flight", stop: i }) });
    const STATUS2 = [{ id: "in-flight", label: "In flight", n: page.counts.inFlight }, { id: "waiting", label: "Waiting for a yes", n: page.counts.waiting }, { id: "closed", label: "Closed", n: page.counts.closed }];
    const tableTitle = q.stop != null && q.status === "in-flight" ? `At ${STOP_TITLES[q.stop]}` : q.status === "waiting" ? "Waiting for a yes" : q.status === "closed" ? "Closed batches" : "Live batches";
    const tableSub = q.stop != null && q.status === "in-flight" ? `${page.total} batch${page.total === 1 ? "" : "es"} at this stop` : q.status === "closed" ? "What each batch recovered, the newest first" : "Every client's batches in flight, the ones waiting for a yes first";
    const filters = /* @__PURE__ */ React.createElement("div", { className: "cs-ov-filters" }, /* @__PURE__ */ React.createElement("label", { className: "cs-ov-search" }, /* @__PURE__ */ React.createElement(Icon, { name: "search", size: 16 }), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Find a batch"), /* @__PURE__ */ React.createElement("input", { type: "search", placeholder: "Batch, product or distributor", value: q.q, onChange: (e) => set({ q: e.target.value }) })), /* @__PURE__ */ React.createElement("select", { className: "cs-ov-sel", "aria-label": "Client", value: q.client || "", onChange: (e) => set({ client: e.target.value || null }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "All clients"), s.clients.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name))), q.status !== "closed" && /* @__PURE__ */ React.createElement("select", { className: "cs-ov-sel", "aria-label": "Stop", value: q.stop == null ? "" : String(q.stop), onChange: (e) => set({ stop: e.target.value === "" ? null : Number(e.target.value) }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "All stops"), STOP_TITLES.map((t, i) => /* @__PURE__ */ React.createElement("option", { key: t, value: i }, t))), /* @__PURE__ */ React.createElement(Segmented, { label: "Which batches", value: q.status, onChange: (v) => set({ status: v, stop: v === "in-flight" ? q.stop : null, sort: v === "closed" ? "updated" : "priority", dir: v === "closed" ? "desc" : "asc" }), options: STATUS2.map((x) => ({ id: x.id, label: `${x.label} ${x.n}` })) }));
    const rows = page.rows;
    const table = !rows.length ? /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "package", title: q.q || q.client || q.stop != null ? "No batches match" : q.status === "closed" ? "No closed batches yet" : "Nothing in flight", body: q.q || q.client || q.stop != null ? "Try another search, client or stop." : "Batches show here once the Watcher flags them." })) : phone ? /* @__PURE__ */ React.createElement("div", { className: "cs-ov-tablecard" }, /* @__PURE__ */ React.createElement("div", { className: "list cs-ov-rows" }, rows.map((r) => /* @__PURE__ */ React.createElement("button", { key: r.ref, type: "button", className: "list-row", onClick: () => go("clients", r.client, "supply") }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: client(r.client), size: 28 }), /* @__PURE__ */ React.createElement("span", { className: "lr-main" }, /* @__PURE__ */ React.createElement("span", { className: "r1" }, /* @__PURE__ */ React.createElement("b", null, r.product), r.daysLeft != null && !r.closed && /* @__PURE__ */ React.createElement("span", { className: cx("t-footnote tnum", r.daysLeft < 20 && "cs-ov-low") }, r.daysLeft < 0 ? "expired" : `${r.daysLeft} d`)), /* @__PURE__ */ React.createElement("span", { className: "r2" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, r.ref), " · ", r.distributor, ", ", r.city), !r.closed && /* @__PURE__ */ React.createElement(StopSeg, { stage: r.stage }), /* @__PURE__ */ React.createElement("span", { className: "r2" }, /* @__PURE__ */ React.createElement("b", { className: cx(r.stage === 5 && !r.closed && "cs-ov-human") }, stopText(r)), " · ", fmt.inr(r.value), " ", r.valueKind === "mrp" ? "at MRP" : "recovered"))))), /* @__PURE__ */ React.createElement(Pager, { phone: true, page: page.page, size: page.size, total: page.total, onPage: (p) => set({ page: p }), onSize: (n) => set({ size: n }) })) : /* @__PURE__ */ React.createElement("div", { className: "cs-ov-tablecard" }, /* @__PURE__ */ React.createElement("div", { className: "table-wrap", tabIndex: 0, role: "region", "aria-label": tableTitle }, /* @__PURE__ */ React.createElement("table", { className: "table cs-ov-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Batch"), /* @__PURE__ */ React.createElement("th", null, "Client"), header("Stop", "stop", false), header("Days left", "days"), header("Units", "units"), header(q.status === "closed" ? "Recovered" : "Value", "value"), header("Updated", "updated"))), /* @__PURE__ */ React.createElement("tbody", null, rows.map((r) => {
      const c = client(r.client);
      return /* @__PURE__ */ React.createElement("tr", { key: r.ref, className: "clickable", onClick: (e) => {
        if (!e.target.closest("button, a")) go("clients", r.client, "supply");
      } }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "cs-ov-bt" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "cs-cellbtn", onClick: () => go("clients", r.client, "supply") }, r.product), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, r.ref), " · ", r.distributor, ", ", r.city))), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "cs-ov-who" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 22 }), c ? c.name : r.client)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "cs-ov-stage" }, !r.closed && /* @__PURE__ */ React.createElement(StopSeg, { stage: r.stage }), /* @__PURE__ */ React.createElement("span", { className: cx(r.stage === 5 && !r.closed && "cs-ov-human") }, stopText(r)))), /* @__PURE__ */ React.createElement("td", { className: "n" }, r.daysLeft == null || r.closed ? /* @__PURE__ */ React.createElement("span", { className: "subtle" }, "—") : /* @__PURE__ */ React.createElement("span", { className: cx(r.daysLeft < 20 && "cs-ov-low") }, r.daysLeft < 0 ? "expired" : r.daysLeft)), /* @__PURE__ */ React.createElement("td", { className: "n" }, r.units.toLocaleString("en-IN")), /* @__PURE__ */ React.createElement("td", { className: "n" }, fmt.inr(r.value), /* @__PURE__ */ React.createElement("div", { className: "t-caption subtle" }, r.valueKind === "mrp" ? "at MRP" : "recovered")), /* @__PURE__ */ React.createElement("td", { className: "n mono t-footnote subtle" }, r.updated));
    })))), /* @__PURE__ */ React.createElement(Pager, { page: page.page, size: page.size, total: page.total, onPage: (p) => set({ page: p }), onSize: (n) => set({ size: n }) }));
    const batches = /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: tableSub, right: q.stop != null && q.status === "in-flight" ? /* @__PURE__ */ React.createElement(Button, { size: "sm", icon: "x", onClick: () => set({ stop: null }) }, "Every stop") : null }, tableTitle), filters, table);
    const lists = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Waiting on a person, or on a file" }, "Needs attention"), attention.length ? /* @__PURE__ */ React.createElement(List, null, attention.map((x) => /* @__PURE__ */ React.createElement(ListRow, { key: x.id, leading: /* @__PURE__ */ React.createElement("span", { className: cx("cs-att", x.tone), "aria-hidden": "true" }), title: x.title, sub: `${x.c.name} · ${x.text}`, value: /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", onClick: x.run }, x.act) }))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "circle-check", title: "Nothing is waiting", body: "Every client's partners have given their permissions." }))), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "From Book a demo on smartclearance.com" }, "Demo requests"), (s.requests || []).length ? /* @__PURE__ */ React.createElement(List, null, s.requests.map((r) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: r.id,
        icon: "mail",
        iconTone: "soft",
        title: r.company,
        sub: [r.name, r.email, r.makes, r.plan && `${r.plan} plan`, r.at].filter(Boolean).join(" · "),
        value: r.status === "set up" ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "set up") : /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => startFrom(r) }, "Set up")
      }
    ))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "mail", title: "No requests yet", body: "When someone books a demo on smartclearance.com, the request lands here, ready to become a client." }))), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "The latest, as they land" }, "Agent runs today"), s.runs.length ? /* @__PURE__ */ React.createElement(List, null, s.runs.slice(0, 5).map((r, i) => {
      const a = AGENT(r.agent);
      const c = client(r.client);
      return /* @__PURE__ */ React.createElement(ListRow, { key: i, leading: /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote cs-time" }, r.at), title: `${a.name} · ${c ? c.name : r.client}`, sub: r.text });
    })) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "bot", title: "No runs yet today", body: "Each client's agents run on their own schedule." }))));
    return /* @__PURE__ */ React.createElement(Screen, { title: "Overview", sub: `${date} · ${live.length} client${live.length === 1 ? "" : "s"} live${setup ? `, ${setup} setting up` : ""} · ${on} agents on` }, /* @__PURE__ */ React.createElement("div", { className: "cs-ov" }, liveBar, kpis, agents, trend, batches, /* @__PURE__ */ React.createElement("div", { className: "cs-ov-three" }, lists), phone && /* @__PURE__ */ React.createElement(List, { head: "Platform" }, NAV.filter((n) => n.phoneHidden).map((n) => /* @__PURE__ */ React.createElement(ListRow, { key: n.id, icon: n.icon, iconTone: "soft", title: n.label, chevron: true, onClick: () => go(n.id) })))));
  }
  function Clients({ go }) {
    const s = usePlatform();
    const app = useApp();
    const [q, setQ] = useState("");
    const rows = s.clients.filter((c) => !q || (c.name + " " + c.domain + " " + c.city).toLowerCase().includes(q.toLowerCase()));
    return /* @__PURE__ */ React.createElement(Screen, { title: "Clients", sub: "Every manufacturer's workspace on Smart-Clearance", actions: app.bp !== "phone" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "plus", onClick: () => go("new-client") }, "New client") }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 220 } }, /* @__PURE__ */ React.createElement(K.SearchField, { value: q, onChange: setQ, placeholder: "Search clients, addresses, people" })), app.bp === "phone" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "plus", onClick: () => go("new-client") }, "New client")), app.bp === "phone" ? /* @__PURE__ */ React.createElement("div", { className: "list" }, rows.map((c) => /* @__PURE__ */ React.createElement("button", { type: "button", key: c.id, className: "list-row", style: { gridTemplateColumns: "40px minmax(0,1fr) auto", width: "100%", textAlign: "left" }, onClick: () => go("clients", c.id, "agents") }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 36 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, c.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle mono", style: { overflowWrap: "anywhere" } }, c.domain)), statusBadge(c)))) : /* @__PURE__ */ React.createElement(DataTable, { label: "Clients", rows, onRow: (c) => go("clients", c.id, "agents"), initialSort: ["name", "asc"], columns: [
      { key: "name", label: "Client", render: (c) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 30 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, c.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, c.city))) },
      { key: "domain", label: "Workspace", render: (c) => /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote" }, c.domain) },
      { key: "plan", label: "Plan", sortValue: (c) => planName(c.plan), render: (c) => planName(c.plan) },
      { key: "status", label: "Status", render: statusBadge },
      { key: "distributors", label: "Distributors", num: true, sortValue: (c) => c.distributors.length, render: (c) => c.distributors.length },
      { key: "skus", label: "SKUs", num: true, sortValue: (c) => c.skus.length, render: (c) => c.skus.length },
      { key: "agents", label: "Agents", sortValue: agentsOn, render: (c) => `${agentsOn(c)} of ${P.AGENTS.length - 1} on` },
      { key: "recovered", label: "Recovered", num: true, render: (c) => c.recovered ? fmt.inr(c.recovered) : "none yet" }
    ] }), s.clients.length < 3 && /* @__PURE__ */ React.createElement(Card, { className: "cs-next" }, /* @__PURE__ */ React.createElement(Product, { name: "sprout-box", size: app.bp === "phone" ? 96 : 132 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("b", { className: "t-title3" }, s.clients.length === 1 ? "Only Munchly is set up so far." : "Set up the next manufacturer."), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0, maxWidth: "52ch" } }, "Each client starts from its supply-chain profile: route to market, who owns the stock, its expiry policy and the exits it allows. The agents and their limits follow from it."), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "plus", onClick: () => go("new-client") }, "New client"))))));
  }
  function JourneyBadge({ c, onOpen }) {
    const m = c.dayMinutes, fast = m < P.DAY_MINUTES;
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("cs-jday", fast && "fast"), onClick: onOpen, "aria-haspopup": "dialog" }, /* @__PURE__ */ React.createElement(Icon, { name: fast ? "fast-forward" : "clock", size: 13, stroke: 2.2 }), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Length of a journey day: "), P.dayBadge(m), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-down", size: 13 }));
  }
  function JourneyDaySheet({ c, me, open, onClose }) {
    const app = useApp();
    const { toast } = useNotice();
    const cur = c.dayMinutes;
    const [v, setV] = useState(cur);
    const [txt, setTxt] = useState(String(cur));
    const [err, setErr] = useState("");
    useEffect(() => {
      if (open) {
        setV(cur);
        setTxt(String(cur));
        setErr("");
      }
    }, [open, c.id, cur]);
    const type = (t) => {
      setTxt(t);
      const n = /^\s*\d+\s*$/.test(t) ? Number(t) : NaN;
      const e = P.dayMinutesError(n);
      setErr(e || "");
      if (!e) setV(n);
    };
    const pick = (n) => {
      setV(n);
      setTxt(String(n));
      setErr("");
    };
    const save = () => {
      if (err) return;
      if (v !== cur) {
        P.update((d) => {
          d.clients.find((y) => y.id === c.id).dayMinutes = v;
        }, { who: me.name, client: c.id, text: P.dayMinutesLine(c, v, cur) });
        toast({ text: `${c.name}: ${v >= P.DAY_MINUTES ? "back to real time" : "a journey day now lasts " + P.dayWords(v)}`, tone: "ok" });
      }
      onClose();
    };
    return /* @__PURE__ */ React.createElement(
      Sheet,
      {
        open,
        onClose,
        title: "Length of a journey day",
        side: app.bp === "phone" ? "bottom" : "center",
        detent: "large",
        footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, disabled: !!err, onClick: save }, "Save"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", block: true, onClick: onClose }, "Cancel"))
      },
      /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, "How many minutes of real time one day of ", P.poss(c.name), " journey lasts. The agents' schedules, the offer windows and every time in the workspace follow it."), /* @__PURE__ */ React.createElement("fieldset", { className: "cs-jd-presets" }, /* @__PURE__ */ React.createElement("legend", { className: "sr-only" }, "Presets"), P.DAY_PRESETS.map((p) => /* @__PURE__ */ React.createElement("label", { key: p.id, className: cx("cs-jd-preset", v === p.id && "on") }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "jd-preset", checked: v === p.id, onChange: () => pick(p.id) }), /* @__PURE__ */ React.createElement("span", { className: "cs-jd-p-n" }, p.label), /* @__PURE__ */ React.createElement("span", { className: "cs-jd-p-v tnum" }, p.id.toLocaleString("en-IN"), " min"), /* @__PURE__ */ React.createElement("span", { className: "cs-jd-p-s" }, p.sub), v === p.id && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 })))), /* @__PURE__ */ React.createElement(Field, { label: "Or any number of minutes", htmlFor: "jd-min", help: err ? null : "From 1 to 1,440. 1,440 is real time.", error: err || null }, /* @__PURE__ */ React.createElement("span", { className: "cs-jd-num" }, /* @__PURE__ */ React.createElement(Input, { id: "jd-min", inputMode: "numeric", autoComplete: "off", value: txt, onChange: (e) => type(e.target.value) }), /* @__PURE__ */ React.createElement("span", { className: "cs-jd-unit" }, "minutes a day"))), /* @__PURE__ */ React.createElement(List, { head: P.dayHead(v) }, P.dayReadouts(v).map((r) => /* @__PURE__ */ React.createElement(ListRow, { key: r.title, icon: r.icon, iconTone: "soft", title: r.title, value: r.value }))), /* @__PURE__ */ React.createElement("div", { "aria-live": "polite" }, c.status === "live" && v < P.DAY_MINUTES && /* @__PURE__ */ React.createElement("div", { className: "cs-jd-note" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 18 }), /* @__PURE__ */ React.createElement("span", null, c.name, " is live. Below real time its partners get less time to answer than a real day gives them, so keep short days for demos and rehearsals."))))
    );
  }
  const TABS = [{ id: "agents", label: "Agents" }, { id: "supply", label: "Supply chain" }, { id: "rules", label: "Channels & rules" }, { id: "people", label: "People" }, { id: "integrations", label: "Integrations" }, { id: "plan", label: "Plan" }, { id: "audit", label: "Audit" }];
  function ClientPage({ id, tab, go, me }) {
    const s = usePlatform();
    const app = useApp();
    const c = s.clients.find((x) => x.id === id);
    const [menu, setMenu] = useState(false);
    const [pause, setPause] = useState(false);
    const [clock, setClock] = useState(false);
    const [reset, setReset] = useState(false);
    const { toast } = useNotice();
    if (!c) return /* @__PURE__ */ React.createElement(Screen, { title: "No such client", back: "Clients", onBack: () => go("clients") }, /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "search", title: "This client isn't set up", body: "It may have been removed when the prototype's data was reset.", action: /* @__PURE__ */ React.createElement(Button, { onClick: () => go("clients") }, "All clients") })));
    const t = TABS.some((x) => x.id === tab) ? tab : "agents";
    const allOff = agentsOn(c) === 0;
    const setAll = (v) => {
      P.update((d) => {
        const x = d.clients.find((y) => y.id === c.id);
        P.AGENTS.filter((a) => !a.gate).forEach((a) => {
          x.agents[a.id].on = v;
        });
      }, { who: me.name, client: c.id, text: v ? `Resumed every agent for ${c.name}` : `Paused every agent for ${c.name}` });
      toast({ text: v ? `Agents resumed for ${c.name}` : `Every agent paused for ${c.name}`, tone: "ok" });
    };
    const goLive = () => {
      P.update((d) => {
        const x = d.clients.find((y) => y.id === c.id);
        x.status = "live";
        x.since = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      }, { who: me.name, client: c.id, text: `Moved ${c.name} to Live on the ${planName(c.plan)} plan` });
      toast({ text: `${c.name} is live`, tone: "ok" });
    };
    const items = [
      c.id === "munchly" ? { label: "Open the workspace", icon: "external-link", onClick: () => {
        window.open(LINKS.app, "_blank", "noopener");
      } } : null,
      c.status !== "live" ? { label: "Go live", icon: "circle-play", onClick: goLive } : null,
      allOff ? { label: "Resume every agent", icon: "play", onClick: () => setAll(true) } : { label: "Pause every agent", icon: "pause", danger: true, onClick: () => setPause(true) },
      P.journey(s, c.id).live ? { label: "Reset journey…", icon: "rotate-ccw", danger: true, onClick: () => setReset(true) } : null
    ];
    return /* @__PURE__ */ React.createElement(
      Screen,
      {
        title: c.name,
        sub: `${c.domain} · ${planName(c.plan)}${c.since ? " since " + c.since : ""}`,
        back: "Clients",
        onBack: () => go("clients"),
        actions: /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: "ellipsis", label: `Actions for ${c.name}`, "aria-haspopup": "menu", "aria-expanded": menu, onClick: () => setMenu((m) => !m) }), /* @__PURE__ */ React.createElement(Menu, { open: menu, onClose: () => setMenu(false), items, width: 230, label: `Actions for ${c.name}` }))
      },
      /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "cs-head" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: app.bp === "phone" ? 48 : 60 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight grow", style: { gap: 6, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "si-url", style: { justifySelf: "start" } }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 12, stroke: 2.2 }), c.domain), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, statusBadge(c), /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, planName(c.plan)), /* @__PURE__ */ React.createElement(Badge, { size: "sm", icon: "map-pin" }, c.city, c.region && c.region !== "India" ? " · " + c.region : ""), /* @__PURE__ */ React.createElement(Badge, { size: "sm", icon: "bot" }, agentsOn(c), " of ", P.AGENTS.length - 1, " agents on"), /* @__PURE__ */ React.createElement(JourneyBadge, { c, onOpen: () => setClock(true) })))), /* @__PURE__ */ React.createElement("div", { className: "cs-tabs" }, /* @__PURE__ */ React.createElement(Tabs, { id: "client-tabs", tabs: TABS, value: t, onChange: (v) => go("clients", c.id, v, true) })), /* @__PURE__ */ React.createElement(Loading, { k: c.id + "/" + t, shape: TAB_SHAPE[t] || "list", kind: "tab" }, t === "agents" && /* @__PURE__ */ React.createElement(AgentsTab, { c, me }), t === "supply" && /* @__PURE__ */ React.createElement(SupplyTab, { c, me }), t === "rules" && /* @__PURE__ */ React.createElement(RulesTab, { c, me }), t === "people" && /* @__PURE__ */ React.createElement(PeopleTab, { c, me }), t === "integrations" && /* @__PURE__ */ React.createElement(IntegrationsTab, { c, me }), t === "plan" && /* @__PURE__ */ React.createElement(PlanTab, { c, me, onLive: goLive }), t === "audit" && /* @__PURE__ */ React.createElement(AuditList, { filter: c.id }))),
      /* @__PURE__ */ React.createElement(JourneyDaySheet, { c, me, open: clock, onClose: () => setClock(false) }),
      /* @__PURE__ */ React.createElement(ResetJourneySheet, { c, me, open: reset, onClose: () => setReset(false) }),
      /* @__PURE__ */ React.createElement(Alert, { open: pause, onClose: () => setPause(false), title: `Pause every agent for ${c.name}?`, message: "Nothing new is detected, priced, listed or sent until you resume. Plans already approved stay where they are.", actions: [{ label: "Cancel" }, { label: "Pause", danger: true, strong: true, onClick: () => setAll(false) }] })
    );
  }
  const TRIG = {
    "data.daily": { title: "Daily load", act: "Run now", icon: "play" },
    "watcher.daily": { title: "Daily check", act: "Run now", icon: "play" },
    "offer.close": { title: "Offer window closes", act: "Close now", icon: "timer", every: (c) => `${c.rules.offerWindowHours} h after the offer went out`, ask: (t, when) => ({ title: "Close the offer window now?", message: `The kiranas' offer for ${t.ref} closes now instead of ${when}, and what they did not take is planned again. This can't be undone for this offer.` }) },
    "shelf.due": { title: "Day-7 shelf check", act: "Check now", icon: "timer", every: () => "7 days after the offer", ask: (t, when) => ({ title: "Check the shelves now?", message: `Outreach counts what is left on each kirana's shelf for ${t.ref} now instead of ${when}, and books the pickups.` }) },
    "report.due": { title: "Report due", act: "Report now", icon: "timer", every: () => "the morning after the return window", ask: (t, when) => ({ title: "Write the report now?", message: `Impact writes the report for ${t.ref} now instead of ${when}.` }) }
  };
  const EVENT_OF = { vision: "a label photo arrives", valuer: "the label is verified", router: "the channels are priced", lister: "a plan is approved", outreach: "a plan is approved", negotiator: "a buyer bids or writes", paperwork: "a deal closes", impact: "the batch is settled" };
  const JT = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const journeyTime = (iso) => JT.format(new Date(iso));
  function fromNow(iso, now = Date.now()) {
    const ms = Date.parse(iso) - now;
    const m = Math.round(ms / 6e4);
    if (ms <= 0) return "due now";
    if (m < 1) return "in under a minute";
    if (m < 60) return `in ${m} min`;
    const h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (h < 24) return `in ${h} h${m % 60 ? ` ${m % 60} min` : ""}`;
    return d < 7 && h % 24 ? `in ${d} day${d === 1 ? "" : "s"} ${h % 24} h` : `in ${d} day${d === 1 ? "" : "s"}`;
  }
  function useTriggers(c, me, s) {
    const { toast } = useNotice();
    const j = useMemo(() => P.journey(s, c.id), [s, c.id]);
    const [just, setJust] = useState({});
    const [asking, setAsking] = useState(null);
    const fire = (t) => {
      const a = AGENT(t.agent);
      const words = TRIG[t.key];
      P.update((d) => P.fire(d, c.id, t, hhmm()), { who: me.name, client: c.id, text: P.fireLine(c, t) });
      setJust((x) => ({ ...x, [t.id]: true }));
      setAsking(null);
      toast({ text: t.kind === "run" ? `${a.name} · ${words.title.toLowerCase()} running for ${c.name}` : `${a.name} · ${words.title.toLowerCase()}: fired for ${t.ref}`, tone: "ok" });
    };
    return { j, just, asking, ask: (t) => t.kind === "timer" ? setAsking(t) : fire(t), fire, cancel: () => setAsking(null) };
  }
  function TrigRow({ c, t, trig, dense }) {
    const words = TRIG[t.key];
    const a = AGENT(t.agent);
    const off = !c.agents[t.agent] || !c.agents[t.agent].on;
    const every = t.time ? `every day at ${t.time}` : words.every ? words.every(c) : "";
    const sub = !t.due ? "Not scheduled: its workspace isn't live · runs on request" : `${trig.just[t.id] ? "Ran just now · next " : ""}${journeyTime(t.due)} · ${fromNow(t.dueWall)} · ${every}`;
    const blocked = t.blocked || (off ? `The ${a.name} agent is off` : null);
    return /* @__PURE__ */ React.createElement("div", { className: cx("cs-trig", dense && "dense", trig.just[t.id] && "fired") }, /* @__PURE__ */ React.createElement("span", { className: "cs-trig-txt" }, /* @__PURE__ */ React.createElement("span", { className: "cs-trig-t" }, /* @__PURE__ */ React.createElement("b", null, words.title), t.ref && /* @__PURE__ */ React.createElement("span", { className: "mono cs-trig-ref" }, t.ref)), /* @__PURE__ */ React.createElement("span", { className: "cs-trig-s" }, sub), blocked && /* @__PURE__ */ React.createElement("span", { className: "cs-trig-s cs-trig-why" }, /* @__PURE__ */ React.createElement(Icon, { name: "hourglass", size: 12, stroke: 2.2 }), blocked)), /* @__PURE__ */ React.createElement("span", { className: "cs-trig-act" }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: words.icon, disabled: !!blocked, onClick: () => trig.ask(t), "aria-label": `${words.act}: ${a.name}, ${words.title.toLowerCase()}${t.ref ? ", " + t.ref : ""}` }, words.act)));
  }
  function StopTriggers({ c, agent, trig }) {
    const mine = trig.j.triggers.filter((t) => t.agent === agent);
    if (!mine.length) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "cs-trigs", role: "group", "aria-label": `${AGENT(agent).name}: scheduled runs and timers` }, mine.map((t) => /* @__PURE__ */ React.createElement(TrigRow, { key: t.id, c, t, trig, dense: true })));
  }
  function InspectorTriggers({ c, agent, trig }) {
    const mine = trig.j.triggers.filter((t) => t.agent === agent);
    if (!mine.length) return /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "When it runs", sub: EVENT_OF[agent] ? `When ${EVENT_OF[agent]}; nothing to run now` : "On its own events" }));
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "t-footnote strong" }, "Scheduled runs and timers"), mine.map((t) => /* @__PURE__ */ React.createElement(TrigRow, { key: t.id, c, t, trig })));
  }
  function TimerAlert({ c, trig }) {
    const t = trig.asking;
    const q = t ? TRIG[t.key].ask(t, journeyTime(t.due)) : { title: "", message: "" };
    return /* @__PURE__ */ React.createElement(Alert, { open: !!t, onClose: trig.cancel, title: q.title, message: q.message, actions: [{ label: "Cancel" }, { label: t ? TRIG[t.key].act : "", strong: true, onClick: () => t && trig.fire(t) }] });
  }
  function ResetJourneySheet({ c, me, open, onClose }) {
    const app = useApp();
    const { toast } = useNotice();
    const [v, setV] = useState(c.dayMinutes);
    useEffect(() => {
      if (open) setV(c.dayMinutes);
    }, [open, c.id, c.dayMinutes]);
    const go = () => {
      if (v !== c.dayMinutes) P.update((d) => {
        d.clients.find((y) => y.id === c.id).dayMinutes = v;
      }, { who: me.name, client: c.id, text: P.dayMinutesLine(c, v, c.dayMinutes) });
      P.update((d) => P.resetJourney(d, c.id), { who: me.name, client: c.id, text: P.resetLine() });
      toast({ text: `${P.poss(c.name)} journey starts again: day 0, at ${v >= P.DAY_MINUTES ? "real time" : P.dayBadge(v).toLowerCase()}`, tone: "ok", icon: "rotate-ccw" });
      onClose();
    };
    return /* @__PURE__ */ React.createElement(
      Sheet,
      {
        open,
        onClose,
        title: `Start ${P.poss(c.name)} journey again?`,
        side: app.bp === "phone" ? "bottom" : "center",
        detent: "large",
        footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Button, { variant: "destructive", size: "lg", block: true, icon: "rotate-ccw", onClick: go }, "Reset journey"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", block: true, onClick: onClose }, "Cancel"))
      },
      /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, "Its open batches close as reset, and the story's batches start again on day 0 at 08:00. The Data agent runs at 08:30 and the Watcher at 09:00. Nothing is deleted: the audit log keeps the journey that was."), /* @__PURE__ */ React.createElement("fieldset", { className: "cs-jd-presets" }, /* @__PURE__ */ React.createElement("legend", { className: "t-footnote strong", style: { marginBottom: 8 } }, "Length of a journey day"), P.DAY_PRESETS.map((p) => /* @__PURE__ */ React.createElement("label", { key: p.id, className: cx("cs-jd-preset", v === p.id && "on") }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "reset-day", checked: v === p.id, onChange: () => setV(p.id) }), /* @__PURE__ */ React.createElement("span", { className: "cs-jd-p-n" }, p.label, p.id === c.dayMinutes ? " · now" : ""), /* @__PURE__ */ React.createElement("span", { className: "cs-jd-p-v tnum" }, p.id.toLocaleString("en-IN"), " min"), /* @__PURE__ */ React.createElement("span", { className: "cs-jd-p-s" }, p.sub), v === p.id && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 })))), !P.DAY_PRESETS.some((p) => p.id === c.dayMinutes) && /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Now ", P.dayWords(c.dayMinutes), " a day; pick one to change it."))
    );
  }
  function AgentsTab({ c, me }) {
    const app = useApp();
    const { toast } = useNotice();
    const s = usePlatform();
    const trig = useTriggers(c, me, s);
    const [sel, setSel] = useState(() => app.bp === "desktop" ? "negotiator" : null);
    const setAutonomy = (a, v) => {
      const from = c.agents[a.id].autonomy;
      if (from === v) return;
      P.update((d) => {
        d.clients.find((x) => x.id === c.id).agents[a.id].autonomy = v;
      }, { who: me.name, client: c.id, text: `Set the ${a.name} agent to ${LEVEL(v).label} for ${c.name} (was ${LEVEL(from).label})` });
      toast({ text: `${a.name}: ${LEVEL(v).label}, for ${c.name}`, tone: "ok" });
    };
    const legend = /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle cs-legend" }, P.AUTONOMY.map((l) => /* @__PURE__ */ React.createElement("span", { key: l.id }, /* @__PURE__ */ React.createElement("span", { className: cx("cs-key", "auto-" + l.id), "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("b", null, l.label), " ", l.text.charAt(0).toLowerCase() + l.text.slice(1))));
    const pipe = /* @__PURE__ */ React.createElement(AgentPipeline, { c, sel, onSelect: setSel, onAutonomy: setAutonomy, compact: app.bp === "phone", trig });
    const insp = sel ? /* @__PURE__ */ React.createElement(AgentInspector, { key: c.id + sel, c, id: sel, me, onAutonomy: setAutonomy, trig }) : null;
    const shell = (body) => /* @__PURE__ */ React.createElement(React.Fragment, null, body, /* @__PURE__ */ React.createElement(TimerAlert, { c, trig }));
    if (app.bp === "desktop") return shell(/* @__PURE__ */ React.createElement("div", { className: "cs-agents" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12, minWidth: 0 } }, legend, pipe), /* @__PURE__ */ React.createElement("aside", { className: "cs-inspector card", "aria-label": "Selected agent" }, insp || /* @__PURE__ */ React.createElement(Empty, { icon: "mouse-pointer-click", title: "Choose an agent", body: "Its limits, schedule and last run open here." }))));
    return shell(/* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, legend, pipe, /* @__PURE__ */ React.createElement(Sheet, { open: !!sel, onClose: () => setSel(null), title: sel ? AGENT(sel).name : "", side: app.bp === "phone" ? "bottom" : "side", detent: "large" }, insp)));
  }
  function AgentPipeline({ c, sel, onSelect, onAutonomy, compact, trig }) {
    return /* @__PURE__ */ React.createElement("ol", { className: "cs-pipe", "aria-label": `${c.name}'s agents, in the order they work` }, P.AGENTS.map((a) => {
      const cfg = c.agents[a.id];
      const on = sel === a.id;
      return /* @__PURE__ */ React.createElement("li", { key: a.id, className: "cs-pipe-item" }, /* @__PURE__ */ React.createElement("div", { className: cx("cs-stop", a.gate && "is-gate", on && "on", !cfg.on && "off", "auto-" + cfg.autonomy) }, /* @__PURE__ */ React.createElement("span", { className: "cs-node", "aria-hidden": "true" }, a.gate && /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 11, stroke: 2.6 })), /* @__PURE__ */ React.createElement("div", { className: "cs-card" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "cs-open", "aria-pressed": on, onClick: () => onSelect(a.id) }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", a.gate ? "amber" : "soft") }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "cs-text" }, /* @__PURE__ */ React.createElement("span", { className: "cs-name" }, /* @__PURE__ */ React.createElement("b", null, a.name), /* @__PURE__ */ React.createElement("span", { className: "cs-stage" }, P.STAGE_NAME[a.stage]), !cfg.on && !a.gate && /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, "Off")), /* @__PURE__ */ React.createElement("span", { className: "cs-sum" }, a.gate ? P.summary("gate", cfg.settings, c) : a.job.charAt(0).toLowerCase() + a.job.slice(1) + " · " + P.summary(a.id, cfg.settings, c)))), /* @__PURE__ */ React.createElement("div", { className: "cs-ctl" }, a.gate ? /* @__PURE__ */ React.createElement(Badge, { tone: "amber", icon: "lock" }, "Always on") : compact ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: cfg.autonomy === "act" ? "green" : void 0 }, LEVEL(cfg.autonomy).label) : /* @__PURE__ */ React.createElement(Segmented, { className: "sm", label: `${a.name}: autonomy`, options: P.AUTONOMY.map((x) => ({ id: x.id, label: x.label })), value: cfg.autonomy, onChange: (v) => onAutonomy(a, v) })))), trig && /* @__PURE__ */ React.createElement(StopTriggers, { c, agent: a.id, trig }));
    }));
  }
  function AgentInspector({ c, id, me, onAutonomy, trig }) {
    const a = AGENT(id);
    const cfg = c.agents[id];
    const { toast } = useNotice();
    const [draft, setDraft] = useState(cfg.settings);
    const key = JSON.stringify(cfg.settings);
    useEffect(() => setDraft(cfg.settings), [c.id, id, key]);
    const fields = P.FIELDS[id] || [];
    const dirty = JSON.stringify(draft) !== key;
    const save = () => {
      const changes = fields.filter((f) => JSON.stringify(draft[f.key]) !== JSON.stringify(cfg.settings[f.key])).map((f) => f.type === "approver" ? `approver ${nameOf(c, cfg.settings[f.key])} to ${nameOf(c, draft[f.key])}` : `${f.short || f.label.toLowerCase()} ${P.showValue(f, cfg.settings[f.key])} to ${P.showValue(f, draft[f.key])}`);
      P.update((d) => {
        d.clients.find((x) => x.id === c.id).agents[id].settings = draft;
      }, { who: me.name, client: c.id, text: `Changed the ${a.name} agent for ${c.name}: ${changes.join("; ")}` });
      toast({ text: `${a.name} saved for ${c.name}`, tone: "ok" });
    };
    const toggle = (v) => P.update((d) => {
      d.clients.find((x) => x.id === c.id).agents[id].on = v;
    }, { who: me.name, client: c.id, text: `${v ? "Switched on" : "Switched off"} the ${a.name} agent for ${c.name}` });
    return /* @__PURE__ */ React.createElement("div", { className: "stack cs-insp", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", a.gate ? "amber" : ""), style: { width: 42, height: 42, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 21, stroke: 2 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", { className: "t-title3" }, a.name), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, P.STAGE_NAME[a.stage], " · ", a.gate ? "a person, always" : a.model + " on Vertex AI"))), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, a.job, "."), a.gate ? /* @__PURE__ */ React.createElement("div", { className: "cs-gate-note" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 16, stroke: 2.2 }), /* @__PURE__ */ React.createElement("span", null, "Every plan waits for one person's approval, with the money on screen, for every client. It can't be switched off.")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "On", sub: cfg.on ? "Runs for this client" : "Skipped; the stops around it carry on", value: /* @__PURE__ */ React.createElement(Switch, { checked: cfg.on, onChange: toggle, label: `${a.name} on for ${c.name}` }) })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "t-footnote strong" }, "Autonomy"), /* @__PURE__ */ React.createElement(Segmented, { label: `${a.name}: autonomy`, options: P.AUTONOMY.map((x) => ({ id: x.id, label: x.label })), value: cfg.autonomy, onChange: (v) => onAutonomy(a, v) }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, LEVEL(cfg.autonomy).text, "."))), fields.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, fields.map((f) => /* @__PURE__ */ React.createElement(SettingField, { key: f.key, f, c, agent: a, value: draft[f.key], onChange: (v) => setDraft((x) => ({ ...x, [f.key]: v })) }))), !a.gate && trig && /* @__PURE__ */ React.createElement(InspectorTriggers, { c, agent: id, trig }), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "Last run", sub: cfg.last || "not run yet" })), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement("span", { className: "grow" }), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", disabled: !dirty, onClick: save }, "Save")));
  }
  const nameOf = (c, pid) => {
    const p = c.people.find((x) => x.id === pid);
    return p ? p.name : "nobody";
  };
  function SettingField({ f, c, agent, value, onChange }) {
    const id = `set-${agent.id}-${f.key}`;
    if (f.type === "switch") return /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: f.label, sub: f.locked || null, value: /* @__PURE__ */ React.createElement(Switch, { checked: !!value, disabled: !!f.locked, onChange, label: f.label }) }));
    if (f.type === "stepper") return /* @__PURE__ */ React.createElement("div", { className: "row between", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, f.label), /* @__PURE__ */ React.createElement(Stepper, { value, min: f.min, max: f.max, onChange, label: f.label.toLowerCase() }));
    if (f.type === "approver") {
      const people = c.people.filter((p) => p.status === "active" && (p.access === "Approver" || p.access === "Admin" || p.access === "Member"));
      return /* @__PURE__ */ React.createElement(Field, { label: f.label, htmlFor: id, help: "Plans go to this person's phone; nothing moves until they tap Approve." }, /* @__PURE__ */ React.createElement(Select, { id, value: value || "", onChange: (e) => onChange(e.target.value) }, !people.length && /* @__PURE__ */ React.createElement("option", { value: "" }, "No one yet"), people.map((p) => /* @__PURE__ */ React.createElement("option", { key: p.id, value: p.id }, p.name, " · ", p.role))));
    }
    if (f.type === "select") return /* @__PURE__ */ React.createElement(Field, { label: f.label, htmlFor: id }, /* @__PURE__ */ React.createElement(Select, { id, value, onChange: (e) => onChange(e.target.value) }, f.options.map((o) => /* @__PURE__ */ React.createElement("option", { key: o }, o))));
    if (f.type === "time") return /* @__PURE__ */ React.createElement(Field, { label: f.label, htmlFor: id }, /* @__PURE__ */ React.createElement(Input, { id, type: "time", value, onChange: (e) => onChange(e.target.value) }));
    const num2 = /* @__PURE__ */ React.createElement(Input, { id, type: "number", inputMode: "decimal", min: f.min, max: f.max, step: f.step || 1, value, onChange: (e) => {
      const v = e.target.value === "" ? f.min : Number(e.target.value);
      onChange(Math.max(f.min, Math.min(f.max, v)));
    }, icon: f.type === "money" ? "indian-rupee" : void 0 });
    return /* @__PURE__ */ React.createElement(Field, { label: f.label, htmlFor: id, help: f.unit && f.type !== "money" ? f.unit : void 0 }, num2);
  }
  function SupplyTab({ c, me }) {
    const s = usePlatform();
    const app = useApp();
    const { toast } = useNotice();
    const [edit, setEdit] = useState(false);
    const [menu, setMenu] = useState(null);
    const [skuId, setSkuId] = useState(null);
    const differ = c.skus.filter((x) => x.gates && (x.gates.blinkitDays != null || x.gates.qcomPct != null)).length;
    const open = (s.batches || []).filter((b) => b.client === c.id && b.done < 9);
    const kiranas = c.distributors.reduce((t, d) => t + d.kiranas, 0);
    const Step = ({ icon, t, sub }) => /* @__PURE__ */ React.createElement("div", { className: "wschain-step" }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, t), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, sub));
    const lister = c.agents.lister.settings;
    const rows = [
      ["route", "factory", "Route to market", P.optLabel("route", c.profile.route) + (c.distributors.length ? `, ${c.distributors.length} distributors` : "")],
      ["owner", "warehouse", "Who owns short-dated stock", P.optLabel("owner", c.profile.owner)],
      ["expiry", "undo-2", "Expiry policy", P.optLabel("expiry", c.profile.expiry)],
      ["gates", "shield", "Quick-commerce gates, by default", `New SKUs start at Blinkit ${c.gates.blinkitDays}+ days, Zepto and Instamart ${c.gates.qcomPct}% of life` + (differ ? ` · ${differ} of ${c.skus.length} SKUs differ` : "")],
      ["guard", "map", "Territory guard", lister.territoryGuard ? "Lots hidden from buyers inside the client's territories" : "Off: lots visible everywhere"],
      ["window", "calendar-clock", "Return window", `${c.returnWindowDays} days`]
    ];
    const ask = (d) => {
      P.update(() => {
      }, { who: me.name, client: c.id, text: `Asked ${d.name} again for its one-time permission` });
      toast({ text: `Reminder sent to ${d.name}`, tone: "ok" });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement(Card, { className: "wschain-card" }, /* @__PURE__ */ React.createElement("div", { className: "wschain", role: "img", "aria-label": `${c.name} sells through ${c.distributors.length || "its"} distributors to ${kiranas || "the"} kiranas and the quick-commerce warehouses.` }, /* @__PURE__ */ React.createElement(Step, { icon: "factory", t: c.name, sub: `${c.city} · ${c.profile.route === "distributors" ? "sells only to distributors" : P.optLabel("route", c.profile.route).toLowerCase()}` }), /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 16, className: "subtle wschain-arrow" }), /* @__PURE__ */ React.createElement(Step, { icon: "warehouse", t: c.distributors.length ? `${c.distributors.length} distributors` : "Distributors", sub: c.profile.owner === "distributor" ? "own the stock they buy" : "hold the manufacturer's stock" }), /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 16, className: "subtle wschain-arrow" }), /* @__PURE__ */ React.createElement("div", { className: "wschain-split" }, /* @__PURE__ */ React.createElement(Step, { icon: "store", t: kiranas ? `${kiranas} kiranas` : "Kiranas", sub: "on the salesmen's beats" }), /* @__PURE__ */ React.createElement(Step, { icon: "shopping-bag", t: "Quick-commerce warehouses", sub: "Blinkit, Zepto, Instamart; turn short-dated stock away" })))), /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: app.bp === "desktop" ? 560 : 360,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { right: /* @__PURE__ */ React.createElement(Button, { size: "sm", icon: "sliders-horizontal", onClick: () => setEdit(true) }, "Edit"), sub: "Set at onboarding; the exits and agents follow from it" }, "Profile"), /* @__PURE__ */ React.createElement(List, null, rows.map(([k, icon, t, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, icon, iconTone: "soft", title: t, sub: /* @__PURE__ */ React.createElement("b", { className: "strong", style: { color: "var(--fg-2)" } }, v) })))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Each gives the agents a one-time permission to act in his name" }, "Distributors"), c.distributors.length ? /* @__PURE__ */ React.createElement(List, null, c.distributors.map((d) => /* @__PURE__ */ React.createElement(
          ListRow,
          {
            key: d.id,
            icon: "warehouse",
            iconTone: "soft",
            title: d.name,
            sub: `${d.city} · ${d.kiranas} kiranas · staff sale up to ${d.staffCap || c.rules.staffCap}`,
            value: /* @__PURE__ */ React.createElement("span", { className: "row tight" }, d.permission === "given" ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green" }, "given") : /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, "not yet"), d.permission !== "given" && /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: "ellipsis", label: `Actions for ${d.name}`, "aria-haspopup": "menu", "aria-expanded": menu === d.id, onClick: () => setMenu(menu === d.id ? null : d.id) }), /* @__PURE__ */ React.createElement(Menu, { open: menu === d.id, onClose: () => setMenu(null), width: 240, label: `Actions for ${d.name}`, items: [{ label: "Ask for the permission again", icon: "send", onClick: () => ask(d) }] })))
          }
        ))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "warehouse", title: "No distributors yet", body: "They arrive with the first stock export, and each is invited to give the agents its one-time permission." })))
      }
    ), /* @__PURE__ */ React.createElement(SectionTitle, { sub: c.skus.length ? "From the latest stock export · each SKU's quick-commerce gates, and its batches' overrides" : null }, "SKUs"), !c.skus.length ? /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "package", title: "No SKUs yet", body: "SKUs arrive with the first stock export." })) : app.bp === "phone" ? /* @__PURE__ */ React.createElement(List, null, c.skus.slice().sort((a, b) => a.name.localeCompare(b.name)).map((x) => {
      const own = hasOwn(x), n = open.filter((b) => b.sku === x.id && b.override).length;
      return /* @__PURE__ */ React.createElement(ListRow, { key: x.id, title: x.name, chevron: true, onClick: () => setSkuId(x.id), sub: /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 4 } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "mono" }, x.code), " · ", fmt.inr(x.mrp), " · ", x.lifeDays, " days"), /* @__PURE__ */ React.createElement("span", { className: cx("cs-gline", own && "own") }, "Blinkit ", gateOf(c, x, "blinkitDays"), "+ days · Zepto and Instamart ", gateOf(c, x, "qcomPct"), "%", own ? "" : " · the default", n ? /* @__PURE__ */ React.createElement(React.Fragment, null, " · ", /* @__PURE__ */ React.createElement("span", { className: "cs-gsrc ovr" }, n, " batch override", n === 1 ? "" : "s")) : null)) });
    })) : /* @__PURE__ */ React.createElement(DataTable, { label: `${c.name} SKUs`, rows: c.skus, initialSort: ["name", "asc"], onRow: (x) => setSkuId(x.id), columns: [
      { key: "code", label: "Code", render: (x) => /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote" }, x.code) },
      { key: "name", label: "Product", render: (x) => /* @__PURE__ */ React.createElement("button", { type: "button", className: "cs-cellbtn", onClick: () => setSkuId(x.id) }, x.name) },
      { key: "brand", label: "Brand" },
      { key: "mrp", label: "MRP", num: true, render: (x) => fmt.inr(x.mrp) },
      { key: "gst", label: "GST", num: true, render: (x) => fmt.pct(x.gst) },
      { key: "lifeDays", label: "Shelf life", num: true, render: (x) => `${x.lifeDays} days` },
      { key: "blinkit", label: "Blinkit takes", num: true, sortValue: (x) => gateOf(c, x, "blinkitDays"), render: (x) => /* @__PURE__ */ React.createElement(GateValue, { value: `${gateOf(c, x, "blinkitDays")}+ days`, own: x.gates && x.gates.blinkitDays != null }) },
      { key: "qcom", label: "Zepto, Instamart take", num: true, sortValue: (x) => gateOf(c, x, "qcomPct"), render: (x) => /* @__PURE__ */ React.createElement(GateValue, { value: `${gateOf(c, x, "qcomPct")}% of life`, own: x.gates && x.gates.qcomPct != null }) },
      { key: "open", label: "Open batches", num: true, sortValue: (x) => open.filter((b) => b.sku === x.id).length, render: (x) => {
        const mine = open.filter((b) => b.sku === x.id), n = mine.filter((b) => b.override).length;
        return /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 2, justifyItems: "end" } }, /* @__PURE__ */ React.createElement("span", null, mine.length), n ? /* @__PURE__ */ React.createElement("span", { className: "cs-gsrc ovr" }, n, " override", n === 1 ? "" : "s") : null);
      } }
    ] }), /* @__PURE__ */ React.createElement(ProfileSheet, { open: edit, onClose: () => setEdit(false), c, me }), /* @__PURE__ */ React.createElement(SkuSheet, { open: !!skuId, onClose: () => setSkuId(null), c, sku: c.skus.find((x) => x.id === skuId), batches: open.filter((b) => b.sku === skuId), me }));
  }
  const poss = (n) => n + (/s$/i.test(n) ? "'" : "'s");
  const hasOwn = (x) => !!x.gates && (x.gates.blinkitDays != null || x.gates.qcomPct != null);
  const gateOf = (c, x, k) => x.gates && x.gates[k] != null ? x.gates[k] : c.gates[k];
  const GATE_APP = { blinkit: "Blinkit", zepto: "Zepto", instamart: "Instamart" };
  function GateValue({ value, own }) {
    return /* @__PURE__ */ React.createElement("span", { className: cx("cs-gval", own ? "own" : "def") }, /* @__PURE__ */ React.createElement("b", null, value), /* @__PURE__ */ React.createElement("span", { className: "d" }, own ? "this SKU" : "default"));
  }
  function GateChecks({ checks, full }) {
    return /* @__PURE__ */ React.createElement("span", { className: "cs-gchips" }, checks.map((g) => {
      const unit = g.app === "blinkit" ? " days" : "%";
      return /* @__PURE__ */ React.createElement("span", { key: g.app, className: cx("gate", g.pass ? "pass" : "fail"), title: `${GATE_APP[g.app]}: needs ${g.need}${unit}, has ${g.has}${unit}` }, /* @__PURE__ */ React.createElement(Icon, { name: g.pass ? "check" : "x", size: 13, stroke: 2.6 }), GATE_APP[g.app], full && /* @__PURE__ */ React.createElement("span", { className: "cs-gneed" }, g.has, unit, "/", g.need, unit));
    }));
  }
  const num = (v) => v === "" || v == null ? null : Number(v);
  function SkuSheet({ open, onClose, c, sku, batches, me }) {
    const app = useApp();
    const { toast } = useNotice();
    const [f, setF] = useState(null);
    const [err, setErr] = useState(null);
    const [ovr, setOvr] = useState(null);
    useEffect(() => {
      if (open && sku) {
        setF({ own: hasOwn(sku), bl: String(gateOf(c, sku, "blinkitDays")), qc: String(gateOf(c, sku, "qcomPct")) });
        setErr(null);
        setOvr(null);
      }
    }, [open, sku && sku.id]);
    if (!sku || !f) return null;
    const preview = { blinkitDays: f.own ? num(f.bl) : c.gates.blinkitDays, qcomPct: f.own ? num(f.qc) : c.gates.qcomPct };
    const save = () => {
      const g = f.own ? { blinkitDays: num(f.bl), qcomPct: num(f.qc) } : null;
      const e = P.skuGatesError(g);
      if (e) return setErr(e);
      const was = hasOwn(sku) ? sku.gates : null;
      if (JSON.stringify(was) !== JSON.stringify(g)) P.update((d) => {
        d.clients.find((x) => x.id === c.id).skus.find((x) => x.id === sku.id).gates = g || {};
      }, { who: me.name, client: c.id, text: P.skuGatesLine(c, sku, g) });
      toast({ text: `${sku.name}'s gates saved`, tone: "ok" });
      onClose();
    };
    const saveOverride = (b) => {
      const o = { blinkitDays: num(ovr.bl), qcomPct: num(ovr.qc), reason: ovr.reason };
      const e = P.overrideError(o);
      if (e) return setOvr({ ...ovr, err: e });
      const clean = { reason: o.reason.trim() };
      if (o.blinkitDays != null) clean.blinkitDays = o.blinkitDays;
      if (o.qcomPct != null) clean.qcomPct = o.qcomPct;
      P.update((d) => {
        d.batches.find((x) => x.client === c.id && x.ref === b.ref).override = Object.assign(clean, { by: me.name, at: "Today, " + hhmm(), setAt: (/* @__PURE__ */ new Date()).toISOString() });
      }, { who: me.name, client: c.id, text: P.overrideLine(b.ref, clean) });
      toast({ text: `${b.ref}'s override saved`, tone: "ok" });
      setOvr(null);
    };
    const removeOverride = (b) => {
      P.update((d) => {
        delete d.batches.find((x) => x.client === c.id && x.ref === b.ref).override;
      }, { who: me.name, client: c.id, text: P.clearOverrideLine(b.ref) });
      toast({ text: `${b.ref} is back on its SKU's gates`, tone: "ok" });
    };
    const dist = (id) => c.distributors.find((x) => x.id === id) || { name: id, city: "" };
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title: sku.name, side: app.bp === "phone" ? "bottom" : "side", detent: "large", footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, onClick: save }, "Save gates") }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "cs-gfacts" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, sku.code), /* @__PURE__ */ React.createElement("span", null, sku.brand), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, fmt.inr(sku.mrp)), " MRP"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, sku.lifeDays), "-day shelf life")), /* @__PURE__ */ React.createElement("fieldset", { className: "cs-gset" }, /* @__PURE__ */ React.createElement("legend", null, "Quick-commerce gates for this SKU"), /* @__PURE__ */ React.createElement(Segmented, { label: "Whose gates", value: f.own ? "own" : "default", onChange: (v) => {
      setErr(null);
      setF({ ...f, own: v === "own" });
    }, options: [{ id: "default", label: `${poss(c.name)} default` }, { id: "own", label: "Its own" }] }), /* @__PURE__ */ React.createElement("div", { className: "cs-gtwo" }, /* @__PURE__ */ React.createElement(Field, { label: "Blinkit takes at least", htmlFor: "sk-bl", help: f.own ? `Default: ${c.gates.blinkitDays} days` : `${poss(c.name)} default` }, /* @__PURE__ */ React.createElement("span", { className: "cs-gin" }, /* @__PURE__ */ React.createElement(Input, { id: "sk-bl", type: "number", inputMode: "numeric", min: P.GATE_BOUNDS.sku.blinkitDays[0], max: P.GATE_BOUNDS.sku.blinkitDays[1], disabled: !f.own, value: f.own ? f.bl : c.gates.blinkitDays, onChange: (e) => {
      setErr(null);
      setF({ ...f, bl: e.target.value });
    } }), /* @__PURE__ */ React.createElement("span", { className: "u" }, "days"))), /* @__PURE__ */ React.createElement(Field, { label: "Zepto, Instamart take at least", htmlFor: "sk-qc", help: f.own ? `Default: ${c.gates.qcomPct}%` : `${poss(c.name)} default` }, /* @__PURE__ */ React.createElement("span", { className: "cs-gin" }, /* @__PURE__ */ React.createElement(Input, { id: "sk-qc", type: "number", inputMode: "numeric", min: P.GATE_BOUNDS.sku.qcomPct[0], max: P.GATE_BOUNDS.sku.qcomPct[1], disabled: !f.own, value: f.own ? f.qc : c.gates.qcomPct, onChange: (e) => {
      setErr(null);
      setF({ ...f, qc: e.target.value });
    } }), /* @__PURE__ */ React.createElement("span", { className: "u" }, "% of life")))), err ? /* @__PURE__ */ React.createElement("div", { className: "cs-si-error", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 18 }), /* @__PURE__ */ React.createElement("span", null, err)) : preview.blinkitDays != null && preview.qcomPct != null && /* @__PURE__ */ React.createElement("p", { className: "cs-gmean" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 16 }), /* @__PURE__ */ React.createElement("span", null, "On its ", sku.lifeDays, "-day life, a batch needs ", /* @__PURE__ */ React.createElement("b", null, preview.blinkitDays, " days"), " left for Blinkit and ", /* @__PURE__ */ React.createElement("b", null, Math.ceil(preview.qcomPct * sku.lifeDays / 100), " days"), " left for Zepto and Instamart."))), /* @__PURE__ */ React.createElement(SectionTitle, { sub: batches.length ? `${batches.length} open · an override holds for that batch until it closes` : null }, "Its batches"), batches.length ? batches.map((b) => {
      const g = P.batchGates(c, b), d = dist(b.distributor), editing = ovr && ovr.ref === b.ref;
      return /* @__PURE__ */ React.createElement("div", { key: b.ref, className: "cs-gbatch" }, /* @__PURE__ */ React.createElement("div", { className: "cs-gtop" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", { className: "mono" }, b.ref), " ", /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, d.name, d.city ? `, ${d.city}` : "")), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, g.daysLeft), " days left of ", g.lifeDays)), /* @__PURE__ */ React.createElement(GateChecks, { checks: g.checks, full: true }), editing ? /* @__PURE__ */ React.createElement("div", { className: "cs-govr" }, /* @__PURE__ */ React.createElement("div", { className: "cs-gtwo" }, /* @__PURE__ */ React.createElement(Field, { label: "Blinkit, for this batch", htmlFor: "ob-bl-" + b.ref, help: `Days left; empty keeps the SKU's ${gateOf(c, sku, "blinkitDays")}` }, /* @__PURE__ */ React.createElement("span", { className: "cs-gin" }, /* @__PURE__ */ React.createElement(Input, { id: "ob-bl-" + b.ref, type: "number", inputMode: "numeric", placeholder: String(gateOf(c, sku, "blinkitDays")), value: ovr.bl, onChange: (e) => setOvr({ ...ovr, bl: e.target.value, err: null }) }), /* @__PURE__ */ React.createElement("span", { className: "u" }, "days"))), /* @__PURE__ */ React.createElement(Field, { label: "Zepto, Instamart, for this batch", htmlFor: "ob-qc-" + b.ref, help: `% of life; empty keeps the SKU's ${gateOf(c, sku, "qcomPct")}%` }, /* @__PURE__ */ React.createElement("span", { className: "cs-gin" }, /* @__PURE__ */ React.createElement(Input, { id: "ob-qc-" + b.ref, type: "number", inputMode: "numeric", placeholder: String(gateOf(c, sku, "qcomPct")), value: ovr.qc, onChange: (e) => setOvr({ ...ovr, qc: e.target.value, err: null }) }), /* @__PURE__ */ React.createElement("span", { className: "u" }, "% of life")))), /* @__PURE__ */ React.createElement(Field, { label: "Why", htmlFor: "ob-why-" + b.ref, help: "The agents and the audit log show it with the override" }, /* @__PURE__ */ React.createElement("textarea", { id: "ob-why-" + b.ref, className: "input textarea", rows: 2, maxLength: 200, value: ovr.reason, onChange: (e) => setOvr({ ...ovr, reason: e.target.value, err: null }) })), ovr.err && /* @__PURE__ */ React.createElement("div", { className: "cs-si-error", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 18 }), /* @__PURE__ */ React.createElement("span", null, ovr.err)), /* @__PURE__ */ React.createElement("div", { className: "row tight" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "primary", onClick: () => saveOverride(b) }, "Save the override"), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", onClick: () => setOvr(null) }, "Cancel"))) : b.override ? /* @__PURE__ */ React.createElement("div", { className: "cs-govr" }, /* @__PURE__ */ React.createElement("div", { className: "cs-govr-h" }, /* @__PURE__ */ React.createElement("span", null, "Overridden for this batch: ", P.gateText(b.override)), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => setOvr({ ref: b.ref, bl: b.override.blinkitDays != null ? String(b.override.blinkitDays) : "", qc: b.override.qcomPct != null ? String(b.override.qcomPct) : "", reason: b.override.reason }) }, "Change"), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", onClick: () => removeOverride(b) }, "Remove"))), /* @__PURE__ */ React.createElement("p", null, b.override.reason), /* @__PURE__ */ React.createElement("span", { className: "cs-gwho" }, b.override.by, ", ", b.override.at)) : /* @__PURE__ */ React.createElement(Button, { size: "sm", icon: "sliders-horizontal", onClick: () => setOvr({ ref: b.ref, bl: "", qc: "", reason: "" }), style: { justifySelf: "start" } }, "Override for this batch"));
    }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "package", title: "No open batches", body: "Its batches show here once the Watcher flags them, with their gates." })), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "Closed batches keep the gates they were judged by. Every change writes its line in the audit log.")));
  }
  function ProfileSheet({ open, onClose, c, me }) {
    const app = useApp();
    const { toast } = useNotice();
    const [f, setF] = useState(null);
    useEffect(() => {
      if (open) setF({ ...c.profile, blinkitDays: c.gates.blinkitDays, qcomPct: c.gates.qcomPct, returnWindowDays: c.returnWindowDays });
    }, [open]);
    if (!f) return null;
    const save = () => {
      P.update(
        (d) => {
          const x = d.clients.find((y) => y.id === c.id);
          const was = x.exits;
          x.profile = { route: f.route, owner: f.owner, expiry: f.expiry };
          const ex = P.exitsFor(x.profile);
          Object.keys(ex).forEach((k) => {
            if (!ex[k].locked && was[k]) ex[k].on = was[k].on && ex[k].on;
          });
          x.exits = ex;
          x.gates = { blinkitDays: f.blinkitDays, qcomPct: f.qcomPct };
          x.returnWindowDays = f.returnWindowDays;
          x.agents.watcher.settings.blinkitDays = f.blinkitDays;
          x.agents.watcher.settings.qcomPct = f.qcomPct;
          x.agents.impact.settings.returnWindowDays = f.returnWindowDays;
        },
        { who: me.name, client: c.id, text: `Changed ${c.name}'s supply-chain profile: ${P.optLabel("route", f.route).toLowerCase()}, ${P.optLabel("owner", f.owner).toLowerCase()} owns the stock, ${P.optLabel("expiry", f.expiry).toLowerCase()}` }
      );
      toast({ text: `${c.name}'s profile saved`, tone: "ok" });
      onClose();
    };
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title: "Supply-chain profile", side: app.bp === "phone" ? "bottom" : "side", detent: "large", footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, onClick: save }, "Save profile") }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, Object.keys(P.PROFILE).map((q) => /* @__PURE__ */ React.createElement(Choice, { key: q, name: "pf-" + q, label: P.PROFILE[q].label, options: P.PROFILE[q].options, value: f[q], onChange: (v) => setF({ ...f, [q]: v }) })), /* @__PURE__ */ React.createElement(Field, { label: "New SKUs: Blinkit takes stock with at least", htmlFor: "pf-bl", help: "days of shelf life left · SKUs with gates of their own keep them" }, /* @__PURE__ */ React.createElement(Input, { id: "pf-bl", type: "number", min: 30, max: 180, value: f.blinkitDays, onChange: (e) => setF({ ...f, blinkitDays: Number(e.target.value) || 30 }) })), /* @__PURE__ */ React.createElement(Field, { label: "New SKUs: Zepto and Instamart take at least", htmlFor: "pf-qc", help: "% of shelf life left" }, /* @__PURE__ */ React.createElement(Input, { id: "pf-qc", type: "number", min: 30, max: 90, step: 5, value: f.qcomPct, onChange: (e) => setF({ ...f, qcomPct: Number(e.target.value) || 30 }) })), /* @__PURE__ */ React.createElement("div", { className: "row between", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, "Return window, days"), /* @__PURE__ */ React.createElement(Stepper, { value: f.returnWindowDays, min: 7, max: 45, onChange: (v) => setF({ ...f, returnWindowDays: v }), label: "return window days" })), /* @__PURE__ */ React.createElement(ProfileSummary, { profile: f })));
  }
  function ProfileSummary({ profile }) {
    return /* @__PURE__ */ React.createElement(Card, { className: "cs-summary" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "What this profile sets up"), /* @__PURE__ */ React.createElement("ul", null, P.profileLines(profile).map((l, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Icon, { name: l.icon, size: 16, stroke: 2 }), /* @__PURE__ */ React.createElement("span", null, l.text)))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Every plan still waits for one person's approval."));
  }
  function Choice({ name, label, options, value, onChange }) {
    return /* @__PURE__ */ React.createElement("fieldset", { className: "cs-choice" }, /* @__PURE__ */ React.createElement("legend", null, label), /* @__PURE__ */ React.createElement("div", { className: "cs-opts" }, options.map((o) => /* @__PURE__ */ React.createElement("label", { key: o.id, className: cx("cs-opt", value === o.id && "on") }, /* @__PURE__ */ React.createElement("input", { type: "radio", name, value: o.id, checked: value === o.id, onChange: () => onChange(o.id) }), /* @__PURE__ */ React.createElement("span", null, o.label), value === o.id && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 })))));
  }
  function RulesTab({ c, me }) {
    const { toast } = useNotice();
    const [r, setR] = useState(c.rules);
    const [ex, setEx] = useState(c.exits);
    useEffect(() => {
      setR(c.rules);
      setEx(c.exits);
    }, [c.id, JSON.stringify(c.rules), JSON.stringify(c.exits)]);
    const dirty = JSON.stringify(r) !== JSON.stringify(c.rules) || JSON.stringify(ex) !== JSON.stringify(c.exits);
    const save = () => {
      const changed = [];
      P.EXITS.forEach((e) => {
        if (ex[e.id].on !== c.exits[e.id].on) changed.push(`${e.name} ${ex[e.id].on ? "on" : "off"}`);
      });
      Object.keys(r).forEach((k) => {
        if (r[k] !== c.rules[k]) changed.push(`${RULE_LABEL[k] || k} ${typeof r[k] === "boolean" ? r[k] ? "on" : "off" : r[k]}`);
      });
      P.update((d) => {
        const x = d.clients.find((y) => y.id === c.id);
        x.rules = r;
        x.exits = ex;
      }, { who: me.name, client: c.id, text: `Changed ${c.name}'s channels and rules: ${changed.join("; ")}` });
      toast({ text: "Channels and rules saved", tone: "ok" });
    };
    const set = (k, v) => setR({ ...r, [k]: v });
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 460,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "The exits the agents may price and use; the bin is always the baseline" }, "Exits"), /* @__PURE__ */ React.createElement(List, null, P.EXITS.map((e) => /* @__PURE__ */ React.createElement(ListRow, { key: e.id, icon: e.icon, iconTone: "soft", title: e.name, sub: ex[e.id].locked || (e.id === "staff" ? `Up to ${r.staffCap} packs a godown` : null), value: /* @__PURE__ */ React.createElement(Switch, { checked: !!ex[e.id].on, disabled: !!ex[e.id].locked, onChange: (v) => setEx({ ...ex, [e.id]: { ...ex[e.id], on: v } }), label: `${e.name} for ${c.name}` }) })), /* @__PURE__ */ React.createElement(ListRow, { icon: "trash-2", iconTone: "red", title: "The bin", sub: "Priced every time, so every plan shows what it saves", value: /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, "baseline") }))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "The limits every agent works inside" }, "Guardrails"), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "Staff sale cap", sub: "packs per godown", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.staffCap, min: 0, max: 500, step: 10, onChange: (v) => set("staffCap", v), label: "staff sale cap" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Offer window", sub: "hours a kirana offer stays open", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.offerWindowHours, min: 12, max: 96, step: 12, onChange: (v) => set("offerWindowHours", v), label: "offer window hours" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Kirana offers in Hindi first", sub: "with an English toggle", value: /* @__PURE__ */ React.createElement(Switch, { checked: r.hindiOffers, onChange: (v) => set("hindiOffers", v), label: "Kirana offers in Hindi first" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Label photo before any plan", sub: "Vision reads the date off the shelf, not the spreadsheet", value: /* @__PURE__ */ React.createElement(Switch, { checked: r.requirePhoto, onChange: (v) => set("requirePhoto", v), label: "Label photo before any plan" }) })))
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } }, /* @__PURE__ */ React.createElement(Button, { disabled: !dirty, onClick: () => {
      setR(c.rules);
      setEx(c.exits);
    } }, "Discard"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", disabled: !dirty, onClick: save }, "Save changes")));
  }
  const RULE_LABEL = { staffCap: "staff sale cap", offerWindowHours: "offer window hours", hindiOffers: "Hindi offers", requirePhoto: "label photo first" };
  const ACCESS = ["Approver", "Admin", "Member", "Partner"];
  function PeopleTab({ c, me }) {
    const app = useApp();
    const { toast } = useNotice();
    const [q, setQ] = useState("");
    const [menu, setMenu] = useState(null);
    const [inv, setInv] = useState(false);
    const [accessFor, setAccessFor] = useState(null);
    const rows = c.people.filter((p) => !q || (p.name + " " + p.org + " " + p.role).toLowerCase().includes(q.toLowerCase()));
    const setStatus = (p, status) => {
      P.update((d) => {
        const x = d.clients.find((y) => y.id === c.id).people.find((y) => y.id === p.id);
        x.status = status;
      }, { who: me.name, client: c.id, text: `${status === "deactivated" ? "Deactivated" : "Reactivated"} ${p.name}` });
      toast({ text: `${p.name} ${status === "deactivated" ? "deactivated" : "reactivated"}`, tone: "ok" });
    };
    const setAccess = (p, a) => {
      P.update((d) => {
        const x = d.clients.find((y) => y.id === c.id).people.find((y) => y.id === p.id);
        x.access = a;
      }, { who: me.name, client: c.id, text: `Gave ${p.name} ${a} access` });
      toast({ text: `${p.name}: ${a}`, tone: "ok" });
      setAccessFor(null);
    };
    const tone = (st) => st === "active" ? "green" : void 0;
    const menuFor = (p) => [{ label: "Change access", icon: "user-cog", onClick: () => setAccessFor(p) }, p.status === "invited" ? { label: "Resend invitation", icon: "send", onClick: () => toast({ text: `Invitation resent to ${p.name}`, tone: "ok" }) } : null, p.status === "deactivated" ? { label: "Reactivate", icon: "user-check", onClick: () => setStatus(p, "active") } : { label: "Deactivate", icon: "user-x", danger: true, onClick: () => setStatus(p, "deactivated") }];
    const form = /* @__PURE__ */ React.createElement(InviteForm, { c, me, onDone: () => setInv(false) });
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 220 } }, /* @__PURE__ */ React.createElement(K.SearchField, { value: q, onChange: setQ, placeholder: "Search people" })), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(Badge, { tone: "green", dot: true }, c.people.filter((p) => p.status === "active").length, " active"), /* @__PURE__ */ React.createElement(Badge, { dot: true }, c.people.filter((p) => p.status === "invited").length, " invited")), app.bp !== "desktop" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "user-plus", onClick: () => setInv(true) }, "Invite")), /* @__PURE__ */ React.createElement("div", { className: app.bp === "desktop" ? "cs-people" : "" }, app.bp === "phone" ? /* @__PURE__ */ React.createElement("div", { className: "list" }, rows.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "list-row", style: { gridTemplateColumns: "36px minmax(0,1fr) auto" } }, /* @__PURE__ */ React.createElement(Avatar, { person: p, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, p.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, p.role, " · ", p.provider)), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: tone(p.status), dot: true }, p.status), /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: "ellipsis", label: `Actions for ${p.name}`, "aria-haspopup": "menu", "aria-expanded": menu === p.id, onClick: () => setMenu(menu === p.id ? null : p.id) }), /* @__PURE__ */ React.createElement(Menu, { open: menu === p.id, onClose: () => setMenu(null), width: 210, label: `Actions for ${p.name}`, items: menuFor(p) })))))) : /* @__PURE__ */ React.createElement(DataTable, { label: `People in ${c.name}'s workspace`, rows, initialSort: ["name", "asc"], columns: [
      { key: "name", label: "Person", render: (p) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Avatar, { person: p, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, p.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, p.org))) },
      { key: "role", label: "Role" },
      { key: "provider", label: "Signs in with" },
      { key: "access", label: "Access", render: (p) => p.access === "Approver" ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, "Approver") : p.access },
      { key: "status", label: "Status", render: (p) => /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: tone(p.status), dot: true }, p.status) },
      { key: "act", label: "", sortable: false, render: (p) => /* @__PURE__ */ React.createElement("span", { style: { position: "relative", display: "inline-block" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: "ellipsis", label: `Actions for ${p.name}`, "aria-haspopup": "menu", "aria-expanded": menu === p.id, onClick: () => setMenu(menu === p.id ? null : p.id) }), /* @__PURE__ */ React.createElement(Menu, { open: menu === p.id, onClose: () => setMenu(null), width: 210, label: `Actions for ${p.name}`, items: menuFor(p) })) }
    ] }), app.bp === "desktop" && /* @__PURE__ */ React.createElement(Card, { className: "cs-invite" }, /* @__PURE__ */ React.createElement("b", { className: "t-headline" }, "Invite a person"), form)), app.bp !== "desktop" && /* @__PURE__ */ React.createElement(Sheet, { open: inv, onClose: () => setInv(false), title: "Invite a person", side: app.bp === "phone" ? "bottom" : "center", detent: "large" }, form), /* @__PURE__ */ React.createElement(Sheet, { open: !!accessFor, onClose: () => setAccessFor(null), title: accessFor ? `Access for ${accessFor.name}` : "", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, accessFor && /* @__PURE__ */ React.createElement("div", { className: "list" }, ACCESS.map((a) => /* @__PURE__ */ React.createElement("button", { type: "button", key: a, className: "list-row", style: { gridTemplateColumns: "minmax(0,1fr) auto", width: "100%", textAlign: "left" }, onClick: () => setAccess(accessFor, a) }, /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, a), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, { Approver: "Approves plans with one tap", Admin: "Runs the workspace's people and guardrails", Member: "Sees batches, money and reports", Partner: "A distributor, kirana or food bank" }[a])), accessFor.access === a && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 18 }))))));
  }
  function InviteForm({ c, me, onDone }) {
    const { toast } = useNotice();
    const [f, setF] = useState({ name: "", contact: "", access: "Member" });
    const [err, setErr] = useState("");
    const send = () => {
      const contact = f.contact.trim().toLowerCase();
      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
      if (!f.name.trim()) {
        setErr("Enter a name.");
        return;
      }
      if (!email) {
        setErr(`Enter an email address, such as name@${c.emailDomain}.`);
        return;
      }
      if (f.access !== "Partner" && !contact.endsWith("@" + c.emailDomain)) {
        setErr(`${c.name} staff need a ${c.emailDomain} address. Partners can use any address.`);
        return;
      }
      const id = "p-" + Date.now().toString(36);
      P.update((d) => {
        d.clients.find((y) => y.id === c.id).people.push({ id, name: f.name.trim(), org: f.access === "Partner" ? f.name.trim() : c.name, role: f.access === "Partner" ? "Partner" : "Staff", kind: f.access, access: f.access, provider: "Email and password", status: "invited", img: null, email: contact, phone: "" });
      }, { who: me.name, client: c.id, text: `Invited ${f.name.trim()} as ${f.access}` });
      toast({ text: `${f.name.trim()} can sign in with the default password`, tone: "ok" });
      setF({ name: "", contact: "", access: "Member" });
      setErr("");
      onDone && onDone();
    };
    return /* @__PURE__ */ React.createElement("form", { className: "stack", style: { gap: 12 }, onSubmit: (e) => {
      e.preventDefault();
      send();
    }, noValidate: true }, /* @__PURE__ */ React.createElement(Field, { label: "Name", htmlFor: "inv-name" }, /* @__PURE__ */ React.createElement(Input, { id: "inv-name", value: f.name, onChange: (e) => {
      setF({ ...f, name: e.target.value });
      setErr("");
    }, placeholder: "Name or organisation" })), /* @__PURE__ */ React.createElement(Field, { label: "Email", htmlFor: "inv-contact", error: err || null }, /* @__PURE__ */ React.createElement(Input, { id: "inv-contact", icon: "mail", type: "email", value: f.contact, onChange: (e) => {
      setF({ ...f, contact: e.target.value });
      setErr("");
    }, autoComplete: "off", spellCheck: false, autoCapitalize: "none", placeholder: `name@${c.emailDomain}` })), /* @__PURE__ */ React.createElement(Field, { label: "Access", htmlFor: "inv-access" }, /* @__PURE__ */ React.createElement(Select, { id: "inv-access", value: f.access, onChange: (e) => setF({ ...f, access: e.target.value }) }, ACCESS.map((a) => /* @__PURE__ */ React.createElement("option", { key: a }, a)))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, c.name, " staff need a ", c.emailDomain, " address; partners use any address. They sign in with it and the default password, which you hand over. Nothing is sent by email."), /* @__PURE__ */ React.createElement(Button, { type: "submit", variant: "primary", icon: "user-plus" }, "Invite"));
  }
  const STATUS = { ok: ["green", "Connected"], mock: [void 0, "Mocked"], soon: [void 0, "Soon"], waiting: ["amber", "Waiting for the first file"] };
  function IntegrationsTab({ c, me }) {
    const { toast } = useNotice();
    const connect = () => {
      P.update((d) => {
        d.clients.find((y) => y.id === c.id).integrations.push({ id: "dms", name: "Distributor stock exports", kind: "Inventory", status: "waiting", note: "Upload link sent to the distributors" });
      }, { who: me.name, client: c.id, text: `Asked ${c.name}'s distributors for their first stock export` });
      toast({ text: "Upload link sent", tone: "ok" });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 14 } }, c.integrations.length ? /* @__PURE__ */ React.createElement(List, null, c.integrations.map((i) => {
      const [tone, label] = STATUS[i.status] || [void 0, i.status];
      const con = P.CONNECTORS.find((x) => x.id === i.id);
      return /* @__PURE__ */ React.createElement(ListRow, { key: i.id, icon: con ? con.icon : "plug", iconTone: "soft", title: i.name, sub: `${i.kind} · ${i.note}`, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone, dot: !!tone }, label) });
    })) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "plug", title: "Nothing connected yet", body: "Start with the distributors' stock exports; everything else follows the first file.", action: /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "file-spreadsheet", onClick: connect }, "Ask for the first export") })), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "Mocked connectors stand in for partner APIs in this prototype."));
  }
  function PlanTab({ c, me, onLive }) {
    const app = useApp();
    const { toast } = useNotice();
    const setPlan = (id) => {
      if (id === c.plan) return;
      P.update((d) => {
        d.clients.find((y) => y.id === c.id).plan = id;
      }, { who: me.name, client: c.id, text: `Moved ${c.name} from ${planName(c.plan)} to ${planName(id)}` });
      toast({ text: `${c.name} on ${planName(id)}`, tone: "ok" });
    };
    return /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 420,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Prices on request in this prototype" }, "Plan"), /* @__PURE__ */ React.createElement(Segmented, { label: "Plan", options: P.PLANS.map((p) => ({ id: p.id, label: p.name })), value: c.plan, onChange: setPlan, className: "lg" }), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("ul", { className: "cs-scope" }, (P.PLANS.find((p) => p.id === c.plan) || P.PLANS[0]).scope.map((x) => /* @__PURE__ */ React.createElement("li", { key: x }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 }), x)))), c.status !== "live" && /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight grow", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "Not live yet"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Go live once the admin has accepted and the first stock export has arrived.")), /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "circle-play", onClick: onLive }, "Go live"))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, null, "Usage"), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "Distributors", value: c.distributors.length }), /* @__PURE__ */ React.createElement(ListRow, { title: "SKUs", value: c.skus.length }), /* @__PURE__ */ React.createElement(ListRow, { title: "Batches tracked", value: c.batches }), /* @__PURE__ */ React.createElement(ListRow, { title: "Recovered so far", value: c.recovered ? fmt.inr(c.recovered) : "none yet" }), /* @__PURE__ */ React.createElement(ListRow, { title: "People", value: c.people.filter((p) => p.status === "active").length + " active" })))
      }
    );
  }
  function AuditList({ filter }) {
    const s = usePlatform();
    const app = useApp();
    const rows = s.audit.filter((a) => !filter || a.client === filter);
    if (!rows.length) return /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "scroll-text", title: "Nothing logged yet" }));
    return /* @__PURE__ */ React.createElement(List, null, rows.map((a) => {
      const c = s.clients.find((x) => x.id === a.client);
      return /* @__PURE__ */ React.createElement(ListRow, { key: a.id, leading: !filter && c ? /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 28 }) : null, title: a.text, sub: `${a.who} · ${a.at}${!filter && c ? " · " + c.name : ""}` });
    }));
  }
  const COLOURS = [["#2563eb", "Blue"], ["#7c3aed", "Violet"], ["#db2777", "Pink"], ["#0891b2", "Teal"], ["#b45309", "Brown"]];
  const STEPS = ["Company", "Workspace", "Supply chain", "Exits", "Agents", "People", "Review"];
  const INDUSTRIES = ["Snacks and drinks", "Personal care", "Dairy", "Staples", "Home care"];
  function NewClient({ go, me }) {
    const s = usePlatform();
    const app = useApp();
    const { toast } = useNotice();
    const top = useRef(null);
    const [step, setStep] = useState(0);
    const [f, setF] = useState(() => Object.assign({ name: "", city: "", industry: INDUSTRIES[0], colour: COLOURS[0][0], slug: "", slugTouched: false, emailDomain: "", signGoogle: true, signPhone: true, route: "distributors", owner: "distributor", expiry: "full-credit", exitOff: {}, preset: "standard", adminName: "", adminEmail: "", plan: "pilot", request: null }, s.draft || {}));
    useEffect(() => {
      if (s.draft) P.update((d) => {
        delete d.draft;
      });
    }, []);
    const set = (patch) => setF((x) => ({ ...x, ...patch }));
    const slug = f.slugTouched ? f.slug : P.slug(f.name);
    const profile = { route: f.route, owner: f.owner, expiry: f.expiry };
    const exits = useMemo(() => {
      const ex = P.exitsFor(profile);
      Object.keys(f.exitOff).forEach((k) => {
        if (ex[k] && !ex[k].locked && f.exitOff[k]) ex[k].on = false;
      });
      return ex;
    }, [f.route, f.owner, f.expiry, JSON.stringify(f.exitOff)]);
    const taken = s.clients.some((c) => c.id === slug);
    const domainOk = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(f.emailDomain.trim().toLowerCase());
    const adminOk = f.adminName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.adminEmail.trim()) && f.adminEmail.trim().toLowerCase().endsWith("@" + f.emailDomain.trim().toLowerCase());
    const errs = [
      !f.name.trim() ? "Enter the company's name." : !f.city.trim() ? "Enter its home city." : null,
      !/^[a-z0-9-]{2,24}$/.test(slug) ? "Use 2 to 24 lowercase letters, digits or hyphens." : taken ? `${slug}.smartclearance.com is taken.` : !domainOk ? "Enter the domain its staff email from, such as kesari.in." : !(f.signGoogle || f.signPhone) ? "Keep at least one way to sign in." : null,
      null,
      Object.values(exits).some((x) => x.on) ? null : "Keep at least one exit on.",
      null,
      !adminOk ? `Enter the admin's name and a ${f.emailDomain ? "@" + f.emailDomain : "company"} address.` : null,
      null
    ];
    const [tried, setTried] = useState(false);
    const next = () => {
      if (errs[step]) {
        setTried(true);
        return;
      }
      setTried(false);
      setStep((x) => Math.min(STEPS.length - 1, x + 1));
    };
    const back = () => {
      setTried(false);
      setStep((x) => Math.max(0, x - 1));
    };
    useLayoutEffect(() => {
      const el = top.current;
      const sc = el && el.closest(".scroll");
      if (sc) sc.scrollTop = 0;
    }, [step]);
    const create = () => {
      const client = P.buildClient({ name: f.name.trim(), city: f.city.trim(), industry: f.industry, colour: f.colour, emailDomain: f.emailDomain.trim().toLowerCase(), signGoogle: f.signGoogle, signPhone: f.signPhone, route: f.route, owner: f.owner, expiry: f.expiry, preset: f.preset, adminName: f.adminName.trim(), adminEmail: f.adminEmail.trim().toLowerCase(), plan: f.plan });
      client.id = slug;
      client.domain = slug + ".smartclearance.com";
      client.exits = exits;
      P.update((d) => {
        d.clients.push(client);
        if (f.request) d.requests = (d.requests || []).map((r) => r.id === f.request ? Object.assign({}, r, { status: "set up", client: slug }) : r);
      }, { who: me.name, client: slug, text: `Set up ${client.name} from its supply-chain profile: ${P.optLabel("route", f.route).toLowerCase()}, ${P.optLabel("owner", f.owner).toLowerCase()} owns the stock, ${P.optLabel("expiry", f.expiry).toLowerCase()}; invited ${client.people[0].name} as admin` });
      toast({ text: `${client.name}'s workspace is set up`, tone: "ok" });
      go("clients", slug, "agents", true);
    };
    const preview = { id: slug || "new", name: f.name || "?", mark: { from: f.colour, to: f.colour, ink: "#ffffff" } };
    const body = [
      /* @__PURE__ */ React.createElement("div", { className: "stack cs-form", style: { gap: 14 }, key: "company" }, /* @__PURE__ */ React.createElement(Field, { label: "Company name", htmlFor: "nc-name" }, /* @__PURE__ */ React.createElement(Input, { id: "nc-name", value: f.name, onChange: (e) => set({ name: e.target.value }), placeholder: "Kesari Foods" })), /* @__PURE__ */ React.createElement(Field, { label: "Home city", htmlFor: "nc-city" }, /* @__PURE__ */ React.createElement(Input, { id: "nc-city", value: f.city, onChange: (e) => set({ city: e.target.value }), placeholder: "Indore" })), /* @__PURE__ */ React.createElement(Field, { label: "What it makes", htmlFor: "nc-ind" }, /* @__PURE__ */ React.createElement(Select, { id: "nc-ind", value: f.industry, onChange: (e) => set({ industry: e.target.value }) }, INDUSTRIES.map((x) => /* @__PURE__ */ React.createElement("option", { key: x }, x)))), /* @__PURE__ */ React.createElement("fieldset", { className: "cs-choice" }, /* @__PURE__ */ React.createElement("legend", null, "Workspace mark"), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: preview, size: 52 }), /* @__PURE__ */ React.createElement("div", { className: "cs-swatches" }, COLOURS.map(([hex, name]) => /* @__PURE__ */ React.createElement("label", { key: hex, className: cx("cs-swatch", f.colour === hex && "on"), style: { "--sw": hex } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "nc-colour", checked: f.colour === hex, onChange: () => set({ colour: hex }) }), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, name))))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "The client's colour stays inside its mark; the workspace keeps Smart-Clearance's theming."))),
      /* @__PURE__ */ React.createElement("div", { className: "stack cs-form", style: { gap: 14 }, key: "workspace" }, /* @__PURE__ */ React.createElement(Field, { label: "Workspace address", htmlFor: "nc-slug", help: "Where its people sign in" }, /* @__PURE__ */ React.createElement("span", { className: "cs-slug" }, /* @__PURE__ */ React.createElement(Input, { id: "nc-slug", value: slug, onChange: (e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""), slugTouched: true }), spellCheck: false }), /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote subtle" }, ".smartclearance.com"))), /* @__PURE__ */ React.createElement(Field, { label: "Staff email domain", htmlFor: "nc-domain", help: "Only addresses at this domain can sign in as staff" }, /* @__PURE__ */ React.createElement(Input, { id: "nc-domain", value: f.emailDomain, onChange: (e) => set({ emailDomain: e.target.value }), spellCheck: false, autoCapitalize: "none", placeholder: "kesari.in" })), /* @__PURE__ */ React.createElement("fieldset", { className: "cs-choice" }, /* @__PURE__ */ React.createElement("legend", null, "How people sign in"), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Check, { checked: f.signGoogle, onChange: (v) => set({ signGoogle: v }) }, "Google Workspace, for staff"), /* @__PURE__ */ React.createElement(Check, { checked: f.signPhone, onChange: (v) => set({ signPhone: v }) }, "Mobile number and a one-time code, for invited distributors and kiranas")))),
      /* @__PURE__ */ React.createElement("div", { className: "cs-two", key: "supply" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, Object.keys(P.PROFILE).map((q) => /* @__PURE__ */ React.createElement(Choice, { key: q, name: "nc-" + q, label: P.PROFILE[q].label, options: P.PROFILE[q].options, value: f[q], onChange: (v) => set({ [q]: v, exitOff: {} }) }))), /* @__PURE__ */ React.createElement(ProfileSummary, { profile })),
      /* @__PURE__ */ React.createElement("div", { className: "stack cs-form", style: { gap: 14 }, key: "exits" }, /* @__PURE__ */ React.createElement(List, { foot: "The bin is always priced as the baseline, so every plan shows what it saves." }, P.EXITS.map((e) => /* @__PURE__ */ React.createElement(ListRow, { key: e.id, icon: e.icon, iconTone: "soft", title: e.name, sub: exits[e.id].locked || null, value: /* @__PURE__ */ React.createElement(Switch, { checked: !!exits[e.id].on, disabled: !!exits[e.id].locked, onChange: (v) => set({ exitOff: { ...f.exitOff, [e.id]: !v } }), label: e.name }) })))),
      /* @__PURE__ */ React.createElement("div", { className: "cs-two", key: "agents" }, /* @__PURE__ */ React.createElement(Choice, { name: "nc-preset", label: "How far the agents go at first", options: P.PRESETS.map((p) => ({ id: p.id, label: p.label })), value: f.preset, onChange: (v) => set({ preset: v }) }), /* @__PURE__ */ React.createElement(Card, { className: "cs-summary" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, P.PRESETS.find((p) => p.id === f.preset).text), /* @__PURE__ */ React.createElement("ul", null, P.AGENTS.map((a) => {
        const auto = P.agentDefaults(f.preset, {})[a.id].autonomy;
        return /* @__PURE__ */ React.createElement("li", { key: a.id }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 16, stroke: 2 }), /* @__PURE__ */ React.createElement("span", null, a.name), /* @__PURE__ */ React.createElement("span", { className: "grow" }), a.gate ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber", icon: "lock" }, "Always on") : /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: auto === "act" ? "green" : void 0 }, LEVEL(auto).label));
      })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Each agent can be changed later, one at a time."))),
      /* @__PURE__ */ React.createElement("div", { className: "stack cs-form", style: { gap: 14 }, key: "people" }, /* @__PURE__ */ React.createElement(Field, { label: "Workspace admin's name", htmlFor: "nc-admin" }, /* @__PURE__ */ React.createElement(Input, { id: "nc-admin", value: f.adminName, onChange: (e) => set({ adminName: e.target.value }), placeholder: "Full name" })), /* @__PURE__ */ React.createElement(Field, { label: "Admin's work email", htmlFor: "nc-admin-email", help: `Must be an @${f.emailDomain || "company"} address; the invitation goes there` }, /* @__PURE__ */ React.createElement(Input, { id: "nc-admin-email", type: "email", value: f.adminEmail, onChange: (e) => set({ adminEmail: e.target.value }), spellCheck: false, autoCapitalize: "none", placeholder: `name@${f.emailDomain || "company.in"}` })), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "The admin invites the rest of the team and the distributors, and approves plans until they name an approver.")),
      /* @__PURE__ */ React.createElement("div", { className: "cs-two", key: "review" }, /* @__PURE__ */ React.createElement(List, { head: "Summary" }, /* @__PURE__ */ React.createElement(ListRow, { leading: /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: preview, size: 32 }), title: f.name, sub: `${f.city} · ${f.industry}` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Address", value: /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote" }, slug, ".smartclearance.com") }), /* @__PURE__ */ React.createElement(ListRow, { title: "Staff sign in with", sub: [f.signGoogle && `Google (${f.emailDomain})`, f.signPhone && "a one-time code, by invitation"].filter(Boolean).join("; ") }), /* @__PURE__ */ React.createElement(ListRow, { title: "Supply chain", sub: `${P.optLabel("route", f.route)} · ${P.optLabel("owner", f.owner)} owns the stock · ${P.optLabel("expiry", f.expiry)}` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Exits", sub: P.EXITS.filter((e) => exits[e.id].on).map((e) => e.name).join(", ") }), /* @__PURE__ */ React.createElement(ListRow, { title: "Agents", sub: P.PRESETS.find((p) => p.id === f.preset).label + "; the approval is always on" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Admin", sub: `${f.adminName} · ${f.adminEmail}` })), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Prices on request" }, "Plan"), /* @__PURE__ */ React.createElement(Segmented, { label: "Plan", options: P.PLANS.map((p) => ({ id: p.id, label: p.name })), value: f.plan, onChange: (v) => set({ plan: v }) }), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("ul", { className: "cs-scope" }, P.PLANS.find((p) => p.id === f.plan).scope.map((x) => /* @__PURE__ */ React.createElement("li", { key: x }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 }), x))))))
    ];
    return /* @__PURE__ */ React.createElement(Screen, { title: "New client", sub: `Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`, back: "Clients", onBack: () => go("clients") }, /* @__PURE__ */ React.createElement("div", { ref: top, className: "cs-wizard" }, app.bp !== "phone" ? /* @__PURE__ */ React.createElement("ol", { className: "cs-steps", "aria-label": "Steps" }, STEPS.map((t, i) => /* @__PURE__ */ React.createElement("li", { key: t, className: cx(i < step && "done", i === step && "now"), "aria-current": i === step ? "step" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "cs-sn", "aria-hidden": "true" }, i < step ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 2.8 }) : i + 1), i < step ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-link", onClick: () => setStep(i) }, t) : /* @__PURE__ */ React.createElement("span", null, t)))) : /* @__PURE__ */ React.createElement(K.Progress, { value: (step + 1) / STEPS.length, label: `Step ${step + 1} of ${STEPS.length}` }), /* @__PURE__ */ React.createElement("section", { className: "cs-step", "aria-labelledby": "cs-step-h" }, /* @__PURE__ */ React.createElement("h2", { id: "cs-step-h", className: "t-title3" }, STEPS[step]), body[step], tried && errs[step] && /* @__PURE__ */ React.createElement("p", { className: "cs-err", role: "alert" }, errs[step]), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 10, justifyContent: "flex-end", paddingTop: 6 } }, step > 0 && /* @__PURE__ */ React.createElement(Button, { onClick: back }, "Back"), step < STEPS.length - 1 ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: next }, "Continue") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "check", onClick: create }, "Create workspace")))));
  }
  function AgentsPage({ go }) {
    const s = usePlatform();
    return /* @__PURE__ */ React.createElement(Screen, { title: "Agents", sub: "The agents every workspace runs, in the order they work. Each client sets how far they go." }, /* @__PURE__ */ React.createElement("div", { className: "cs-catalog" }, P.AGENTS.map((a) => /* @__PURE__ */ React.createElement(Card, { key: a.id, className: cx("cs-agentcard", a.gate && "is-gate") }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", a.gate ? "amber" : "") }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, a.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, P.STAGE_NAME[a.stage], " · ", a.gate ? "a person, always" : a.model))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: 0 } }, a.job, "."), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, s.clients.map((c) => {
      const cfg = c.agents[a.id];
      return /* @__PURE__ */ React.createElement("button", { type: "button", key: c.id, className: "chip", onClick: () => go("clients", c.id, "agents") }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 18 }), c.name, ": ", a.gate ? "on" : !cfg.on ? "off" : LEVEL(cfg.autonomy).label);
    }))))));
  }
  function ConnectorsPage({ go }) {
    const s = usePlatform();
    const app = useApp();
    const kinds = [...new Set(P.CONNECTORS.map((x2) => x2.kind))];
    const [open, setOpen] = useState(null);
    const users = (id) => s.clients.filter((c) => c.integrations.some((i) => i.id === id));
    const x = open && P.CONNECTORS.find((y) => y.id === open);
    const xu = x ? users(x.id) : [];
    return /* @__PURE__ */ React.createElement(Screen, { title: "Connectors", sub: "What a workspace can connect to; mocked ones stand in for partner APIs" }, /* @__PURE__ */ React.createElement("div", { className: "cs-connectors" }, kinds.map((k) => /* @__PURE__ */ React.createElement(List, { key: k, head: k }, P.CONNECTORS.filter((y) => y.kind === k).map((y) => {
      const [tone, label] = STATUS[y.status];
      const u = users(y.id);
      return /* @__PURE__ */ React.createElement(ListRow, { key: y.id, icon: y.icon, iconTone: "soft", title: y.name, sub: `${y.note}${u.length ? " · used by " + u.map((c) => c.name).join(", ") : ""}`, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone, dot: !!tone }, label), chevron: true, onClick: () => setOpen(y.id) });
    })))), /* @__PURE__ */ React.createElement(Sheet, { open: !!x, onClose: () => setOpen(null), title: x ? x.name : "", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, x && /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft", style: { width: 40, height: 40, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: x.icon, size: 20 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", { className: "t-headline" }, x.name), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, x.kind, " · ", STATUS[x.status][1]))), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, x.note, ".", x.status === "mock" ? " In this prototype it is mocked: the agents call it, and it answers as the partner would." : x.status === "soon" ? " Not available yet." : ""), /* @__PURE__ */ React.createElement(List, { head: "Used by" }, xu.length ? xu.map((c) => /* @__PURE__ */ React.createElement(ListRow, { key: c.id, leading: /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 28 }), title: c.name, sub: c.domain, chevron: true, onClick: () => {
      setOpen(null);
      go("clients", c.id, "integrations");
    } })) : /* @__PURE__ */ React.createElement(ListRow, { title: "No client yet" })))));
  }
  function PlansPage({ go }) {
    const s = usePlatform();
    return /* @__PURE__ */ React.createElement(Screen, { title: "Plans", sub: "Plans are scoped by reach, not seats; prices on request in this prototype" }, /* @__PURE__ */ React.createElement("div", { className: "cs-plans" }, P.PLANS.map((p) => {
      const on = s.clients.filter((c) => c.plan === p.id);
      return /* @__PURE__ */ React.createElement(Card, { key: p.id, className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("b", { className: "t-title3" }, p.name), /* @__PURE__ */ React.createElement("ul", { className: "cs-scope" }, p.scope.map((x) => /* @__PURE__ */ React.createElement("li", { key: x }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 }), x))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Prices on request"), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, on.length ? on.map((c) => /* @__PURE__ */ React.createElement("button", { type: "button", key: c.id, className: "chip", onClick: () => go("clients", c.id, "plan") }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 18 }), c.name)) : /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "No clients on this plan yet")));
    })));
  }
  function StaffPage({ me }) {
    const s = usePlatform();
    const app = useApp();
    const { toast } = useNotice();
    const [inv, setInv] = useState(false);
    const [f, setF] = useState({ name: "", email: "", role: "Support" });
    const [err, setErr] = useState("");
    const send = () => {
      if (!f.name.trim()) {
        setErr("Enter a name.");
        return;
      }
      if (!/^[^\s@]+@smartclearance\.com$/i.test(f.email.trim())) {
        setErr("Staff use a smartclearance.com address.");
        return;
      }
      P.update((d) => {
        d.staff.push({ id: "st-" + Date.now().toString(36), name: f.name.trim(), short: f.name.trim().split(" ")[0], role: f.role, team: f.role === "Support" ? "Customer success" : "Platform", email: f.email.trim().toLowerCase(), passkey: "not set up yet", status: "invited" });
      }, { who: me.name, client: null, text: `Invited ${f.name.trim()} to the console as ${f.role}` });
      toast({ text: `Invitation sent to ${f.name.trim()}`, tone: "ok" });
      setInv(false);
      setF({ name: "", email: "", role: "Support" });
      setErr("");
    };
    return /* @__PURE__ */ React.createElement(Screen, { title: "Staff", sub: "Smart-Clearance people who can sign in to the console", actions: /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "user-plus", onClick: () => setInv(true) }, "Invite") }, /* @__PURE__ */ React.createElement(DataTable, { label: "Console staff", rows: s.staff, columns: [
      { key: "name", label: "Person", render: (x) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Avatar, { person: x, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, x.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, x.email))) },
      { key: "role", label: "Role" },
      { key: "team", label: "Team" },
      { key: "passkey", label: "Passkey" },
      { key: "status", label: "Status", render: (x) => /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: x.status === "active" ? "green" : void 0, dot: true }, x.status) }
    ] }), /* @__PURE__ */ React.createElement(Sheet, { open: inv, onClose: () => setInv(false), title: "Invite a colleague", side: app.bp === "phone" ? "bottom" : "center", detent: "large", footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "send", onClick: send }, "Send invitation") }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "Name", htmlFor: "st-name" }, /* @__PURE__ */ React.createElement(Input, { id: "st-name", value: f.name, onChange: (e) => {
      setF({ ...f, name: e.target.value });
      setErr("");
    } })), /* @__PURE__ */ React.createElement(Field, { label: "smartclearance.com email", htmlFor: "st-email", error: err || null }, /* @__PURE__ */ React.createElement(Input, { id: "st-email", type: "email", value: f.email, onChange: (e) => {
      setF({ ...f, email: e.target.value });
      setErr("");
    }, spellCheck: false, autoCapitalize: "none", placeholder: "name@smartclearance.com" })), /* @__PURE__ */ React.createElement(Field, { label: "Role", htmlFor: "st-role" }, /* @__PURE__ */ React.createElement(Select, { id: "st-role", value: f.role, onChange: (e) => setF({ ...f, role: e.target.value }) }, ["Super admin", "Platform engineer", "Support"].map((x) => /* @__PURE__ */ React.createElement("option", { key: x }, x)))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "They sign in with Google and set up a passkey on first sign-in."))));
  }
  function AuditPage() {
    const s = usePlatform();
    const [f, setF] = useState(null);
    return /* @__PURE__ */ React.createElement(Screen, { title: "Audit log", sub: "Every change staff and client admins make, newest first" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "chip", "aria-pressed": !f, onClick: () => setF(null) }, "Everything"), s.clients.map((c) => /* @__PURE__ */ React.createElement("button", { type: "button", key: c.id, className: "chip", "aria-pressed": f === c.id, onClick: () => setF(c.id) }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 18 }), c.name))), /* @__PURE__ */ React.createElement(AuditList, { filter: f })));
  }
  function AccountSheet({ open, onClose, me, onOut }) {
    const app = useApp();
    const { toast } = useNotice();
    const [reset, setReset] = useState(false);
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title: "Account", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Avatar, { person: me, size: "lg" }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", { className: "t-headline" }, me.name), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, me.role, " · ", me.team))), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "Email", value: /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, me.email) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Passkey", value: /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, me.passkey) })), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(Button, { icon: "log-out", onClick: onOut }, "Sign out"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", icon: "rotate-ccw", onClick: () => setReset(true) }, "Reset prototype data")), /* @__PURE__ */ React.createElement(Alert, { open: reset, onClose: () => setReset(false), title: "Reset the prototype's data?", message: "Clients you set up and every change go back to the seed: Munchly Foods as the only client.", actions: [{ label: "Cancel" }, { label: "Reset", danger: true, strong: true, onClick: () => {
      P.reset();
      toast({ text: "Back to the seed data", tone: "ok" });
      onClose();
    } }] })));
  }
  const TITLES = { overview: "Overview", clients: "Clients", "new-client": "New client", agents: "Agents", connectors: "Connectors", plans: "Plans", staff: "Staff", audit: "Audit log" };
  const SP = window.SC3_SPLASH;
  const WAIT = { boot: Number(Q.get("boot")) || 1300, enter: Number(Q.get("enter")) || 1200, leave: Number(Q.get("leave")) || 800 };
  const SPLASH_READS = { enter: [{ id: "clients", label: "Your clients" }, { id: "dashboard", label: "Today" }, { id: "batches", label: "The batches" }, { id: "runs", label: "The agents" }], leave: [{ id: "session-end", label: "Closing your session" }, { id: "firebase", label: "Signed out" }] };
  function simulateReads(kind, ids) {
    const total = WAIT[kind];
    return Promise.all(ids.map((id, i) => new Promise((res) => {
      const frac = ids.length === 1 ? 1 : 0.28 + 0.72 * (i / (ids.length - 1)), jitter = i * 7919 % 13 / 13 * 0.08 - 0.04;
      setTimeout(() => {
        SP && SP.mark(id);
        res();
      }, Math.round(total * Math.min(1, Math.max(0.1, frac + jitter))));
    })));
  }
  const MARK_ANCHOR = { console: ".sidebar .mark, .rail-compact .mark", signin: ".si-ws .mark" };
  function App() {
    const [session, setSession] = useState(readSession);
    const [route, go] = useHashRoute();
    const s = usePlatform();
    const [acct, setAcct] = useState(false);
    const top = useRef(null);
    const me = session && s.staff.find((x) => x.id === session.uid && x.status === "active");
    const client = route.name === "clients" && route.id ? s.clients.find((c) => c.id === route.id) : null;
    useEffect(() => {
      document.title = me ? `${client ? client.name : TITLES[route.name] || "Overview"} · Smart-Clearance Console` : "Sign in · Smart-Clearance Console";
    }, [me && me.id, route.name, client && client.name]);
    useLayoutEffect(() => {
      const el = top.current;
      const sc = el && el.closest(".scroll");
      if (sc) sc.scrollTop = 0;
    }, [route.name, route.id]);
    useEffect(() => {
      if (!SP || SP.lifted) return;
      SP.animate = Motion.animate;
      simulateReads("boot", ["session", "config", "catalog"]).then(() => SP.open({ anchor: readSession() ? MARK_ANCHOR.console : MARK_ANCHOR.signin }));
    }, []);
    const onIn = (uid) => {
      const v = { uid, at: Date.now() };
      const enter = () => {
        writeSession(v);
        setSession(v);
        go(route.name && route.name !== "overview" ? route.name : "overview", route.id, route.tab, true);
      };
      if (!SP) {
        enter();
        return;
      }
      SP.animate = Motion.animate;
      const who = (s.staff.find((x) => x.id === uid) || { name: "" }).name.split(" ")[0];
      const m = document.querySelector(".si-ws .mark");
      SP.begin("enter", { who, from: m ? m.getBoundingClientRect() : null, reads: SPLASH_READS.enter }).then(enter);
      simulateReads("enter", SPLASH_READS.enter.map((r) => r.id)).then(() => SP.open({ anchor: MARK_ANCHOR.console }));
    };
    const onOut = () => {
      setAcct(false);
      const leave = () => {
        writeSession(null);
        setSession(null);
        history.replaceState(null, "", location.pathname + location.search);
      };
      if (!SP) {
        leave();
        return;
      }
      SP.animate = Motion.animate;
      SP.begin("leave", { who: me ? me.name.split(" ")[0] : "", reads: SPLASH_READS.leave });
      simulateReads("leave", SPLASH_READS.leave.map((r) => r.id)).then(() => {
        leave();
        SP.open({ anchor: MARK_ANCHOR.signin });
      });
    };
    if (!me) return /* @__PURE__ */ React.createElement(SignIn, { onIn });
    const name = TITLES[route.name] ? route.name : "overview";
    const screen = name === "clients" && route.id ? /* @__PURE__ */ React.createElement(ClientPage, { id: route.id, tab: route.tab, go, me }) : name === "clients" ? /* @__PURE__ */ React.createElement(Clients, { go }) : name === "new-client" ? /* @__PURE__ */ React.createElement(NewClient, { go, me }) : name === "agents" ? /* @__PURE__ */ React.createElement(AgentsPage, { go }) : name === "connectors" ? /* @__PURE__ */ React.createElement(ConnectorsPage, { go }) : name === "plans" ? /* @__PURE__ */ React.createElement(PlansPage, { go }) : name === "staff" ? /* @__PURE__ */ React.createElement(StaffPage, { me }) : name === "audit" ? /* @__PURE__ */ React.createElement(AuditPage, null) : /* @__PURE__ */ React.createElement(Overview, { go, me });
    const nav = NAV.map((n) => n.id === "clients" ? { ...n, count: s.clients.length } : n);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      Shell,
      {
        nav,
        current: name === "new-client" ? "clients" : name,
        onNav: (id) => go(id),
        user: { name: me.name, role: me.role, org: "Smart-Clearance" },
        onUser: () => setAcct(true),
        brand: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Mark, { size: 32 }), /* @__PURE__ */ React.createElement("span", { className: "cs-brand" }, /* @__PURE__ */ React.createElement(Wordmark, { size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "cs-brand-sub" }, "Console")))
      },
      /* @__PURE__ */ React.createElement("div", { ref: top }, /* @__PURE__ */ React.createElement(Loading, { k: name + (route.id || ""), shape: client ? "client" : SCREEN_SHAPE[name] || "list", kind: "screen", title: client ? client.name : TITLES[name] }, screen))
    ), /* @__PURE__ */ React.createElement(AccountSheet, { open: acct, onClose: () => setAcct(false), me, onOut }));
  }
  function Root() {
    return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "app-root", style: { position: "fixed", inset: 0 } }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(App, null))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
})();

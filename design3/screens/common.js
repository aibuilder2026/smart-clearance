(function() {
  const { useSyncExternalStore, createContext, useContext, useState, useRef, useCallback, useEffect, Fragment } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW;
  const fmt = M.fmt;
  const { Icon, IconButton, Avatar, Badge, Button, useApp, Page, ModeMenuButton, Menu, Skeleton, cx } = K;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const useStore = () => useSyncExternalStore(Store.subscribe, Store.get);
  function Photo({ src, alt = "", className, style, ...rest }) {
    const [at, setAt] = useState(src);
    const [st, setSt] = useState("loading");
    const ref = useRef(null);
    useEffect(() => {
      if (src === at) return;
      if (st !== "ready") {
        setAt(src);
        setSt("loading");
        return;
      }
      let on = true;
      const pre = new Image();
      pre.onload = () => {
        if (on) {
          setAt(src);
          setSt("ready");
        }
      };
      pre.onerror = () => {
        if (on) {
          setAt(src);
          setSt("failed");
        }
      };
      pre.src = src;
      return () => {
        on = false;
      };
    }, [src]);
    useEffect(() => {
      const i = ref.current;
      if (i && i.complete && i.naturalWidth) setSt("ready");
    }, [at]);
    const shown = style && style.opacity != null ? style.opacity : 1;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, st === "loading" && /* @__PURE__ */ React.createElement(Skeleton, { r: 0, style: { position: "absolute", inset: 0, height: "auto", zIndex: 1, borderRadius: "inherit", backgroundColor: "var(--surface-2)" } }), st === "failed" && /* @__PURE__ */ React.createElement("span", { className: "photo-failed" }, /* @__PURE__ */ React.createElement(Icon, { name: "image", size: 20 }), /* @__PURE__ */ React.createElement("span", { className: "t-caption" }, "The photo did not load")), /* @__PURE__ */ React.createElement("img", { ref, src: at, alt, className, onLoad: () => setSt("ready"), onError: () => setSt("failed"), style: { ...style, opacity: st === "ready" ? shown : 0, transition: "opacity 240ms var(--ease)" }, ...rest }));
  }
  const RouteCtx = createContext({ route: { name: "command" }, go: () => {
  }, back: () => {
  } });
  function Router({ initial = "command", route: controlled, onGo, onBack, children }) {
    const [inner, setInner] = useState(() => typeof initial === "string" ? { name: initial } : initial);
    const stack = useRef([]);
    const route = controlled || inner;
    const go = useCallback((name, params) => {
      if (onGo) onGo({ name, params });
      else {
        stack.current.push(inner);
        setInner({ name, params });
      }
    }, [onGo, inner]);
    const back = useCallback(() => {
      if (onBack) onBack();
      else setInner(stack.current.pop() || (typeof initial === "string" ? { name: initial } : initial));
    }, [onBack, initial]);
    return /* @__PURE__ */ React.createElement(RouteCtx.Provider, { value: { route, go, back } }, children);
  }
  const useRoute = () => useContext(RouteCtx);
  const PHASE_STATUS = { watching: "watching", "at-risk": "at-risk", verified: "routing", valued: "routing", planned: "awaiting", approved: "executing", executing: "executing", dispatched: "dispatched", settled: "settled", cleared: "cleared" };
  function heroModel(s) {
    const h = s.hero, C = D.story(s);
    const view = D.batchView(C.batch);
    const idx = Flow.stageOf(s);
    view.phase = PHASE_STATUS[h.phase];
    const ordered = h.orders.length, orderedUnits = h.orders.reduce((t, o) => t + o.units, 0);
    let eta = "", etaTone = "green", agentLive = "";
    if (h.phase === "watching") {
      eta = "Watcher runs daily at 09:00";
      etaTone = void 0;
    } else if (h.phase === "at-risk") {
      eta = h.photo.status === "reading" ? "Reading the label" : `Plan ready in about ${D.JOURNEY.planMinutes} min`;
      agentLive = h.photo.status === "reading" ? "Vision is reading the label" : h.photo.status === "requested" ? "Vision is waiting for the label photo" : "Vision is asking for a label photo";
    } else if (h.phase === "verified") {
      eta = "Pricing five channels";
      agentLive = "Valuer is pricing five channels";
    } else if (h.phase === "valued") {
      eta = "Splitting the batch";
      agentLive = "Router is splitting the batch";
    } else if (h.phase === "planned") {
      eta = "Waiting for your approval";
      etaTone = "amber";
    } else if (h.phase === "approved" || h.phase === "executing") {
      const has = (id) => C.plan.lines.some((l) => l.id === id && l.units > 0), shops = `${ordered} of ${C.kiranas.length} kiranas ordered`;
      if (has("expiresoon")) {
        eta = h.award ? `Awarded at ₹${C.counter.price.toFixed(2)} · ${shops}` : `Listing live · ${shops}`;
        agentLive = h.award && ordered === C.kiranas.length ? "" : "Lister, Outreach and Negotiator at work";
      } else {
        eta = has("kirana") ? `Scheme open · ${shops}` : "Carrying out the plan";
        const at = [has("kirana") && "Outreach", has("foodbank") && "Donation"].filter(Boolean);
        agentLive = at.length ? `${at.join(" and ")} at work` : "";
      }
    } else if (h.phase === "dispatched") {
      eta = "Paperwork in progress";
      agentLive = "Paperwork is drafting the pack";
    } else if (h.phase === "settled") {
      eta = "Papers ready · ledger next";
      agentLive = "Impact is posting the ledger";
    } else if (h.phase === "cleared") {
      eta = h.destruction ? `Cleared · ${h.destruction.units} packs destroyed at the godown` : "Cleared · 0 cartons destroyed";
    }
    const dz = h.destruction && h.phase !== "cleared" ? h.destruction.status : null;
    if (dz === "requested" || dz === "asked") {
      const who = C.dist.short;
      eta = `Waiting for ${who + (/s$/.test(who) ? "'" : "'s")} destruction evidence`;
      etaTone = "amber";
      agentLive = "";
    } else if (dz === "reading") {
      eta = "Checking the destruction's evidence";
      agentLive = "Vision is checking the evidence";
    } else if (dz === "checked") {
      eta = "The destruction waits for your yes";
      etaTone = "amber";
      agentLive = "";
    }
    return { h, view, idx, done: Math.min(idx, 9), current: idx < 9 ? idx : -1, eta, etaTone, agentLive, ordered, orderedUnits, plan: C.plan };
  }
  const useStory = () => D.story(useStore());
  const unreadFor = (s, me) => s.notifications.filter((n) => n.to === (me && me.id) && !n.read).length;
  function TopActions({ me, extra }) {
    const s = useStore();
    const { go } = useRoute();
    const app = useApp();
    const n = unreadFor(s, me);
    return /* @__PURE__ */ React.createElement(Fragment, null, extra, app.bp !== "phone" && /* @__PURE__ */ React.createElement(ModeMenuButton, null), /* @__PURE__ */ React.createElement(IconButton, { icon: "bell", label: n ? `${n} unread notifications` : "Notifications", badge: n || void 0, onClick: () => go("inbox") }), me && /* @__PURE__ */ React.createElement("button", { type: "button", className: "iconbtn", style: { width: 40 }, "aria-label": "Profile and settings", onClick: () => go("profile") }, /* @__PURE__ */ React.createElement(Avatar, { person: me, size: "sm" })));
  }
  const WorkspaceCtx = createContext(null);
  const LiveCtx = createContext(null);
  const useLive = () => useContext(LiveCtx);
  const BatchCtx = createContext(null);
  function Screen({ me, title, sub, back, children, actions, wide, hideLarge, below }) {
    const frame = useContext(BatchCtx);
    if (frame) {
      title = frame.title;
      back = frame.back;
      below = /* @__PURE__ */ React.createElement(React.Fragment, null, frame.head, sub ? /* @__PURE__ */ React.createElement("div", { className: "bh-sub" }, sub) : null);
      hideLarge = true;
      sub = null;
    }
    const { back: goBack } = useRoute();
    const app = useApp();
    const ws = useContext(WorkspaceCtx);
    const live = useLive();
    const L = live && window.SC3_SCREENS.Live;
    const lead = app.bp === "phone" && ws ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "ws-lead", onClick: ws.open, "aria-label": `${ws.name} workspace, on Smart-Clearance` }, /* @__PURE__ */ React.createElement(K.Mark, { size: 24, still: true }), /* @__PURE__ */ React.createElement("span", { className: "ws-sep", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement(K.WorkspaceMark, { ws: D.WORKSPACE, size: 26 })) : null;
    const subNode = L ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "lv-subtext" }, sub), /* @__PURE__ */ React.createElement(L.Line, null)) : sub;
    return /* @__PURE__ */ React.createElement(Page, { title, sub: subNode, back, onBack: goBack, lead, actions: /* @__PURE__ */ React.createElement(TopActions, { me, extra: actions }), wide, hideLarge, below, top: L ? /* @__PURE__ */ React.createElement(L.Band, null) : null, barSub: L ? /* @__PURE__ */ React.createElement(L.BarSub, null) : null }, children);
  }
  function Columns({ main, side, sideWidth = 360, gap = 20 }) {
    const app = useApp();
    if (app.bp !== "desktop") return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap } }, main, side);
    return /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: `minmax(0, 1fr) ${sideWidth}px`, gap, alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap } }, main), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap, position: "sticky", top: 72 } }, side));
  }
  function SectionTitle({ children, right, sub }) {
    return /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 8, marginTop: 6 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "t-title3" }, children), sub && /* @__PURE__ */ React.createElement("div", { className: "t-footnote subtle", style: { marginTop: 2 } }, sub)), right);
  }
  function Locked({ icon = "sparkles", agent, text, live }) {
    return /* @__PURE__ */ React.createElement("div", { className: "card pad row", style: { gap: 14, borderStyle: "dashed" } }, /* @__PURE__ */ React.createElement(K.Aura, { on: live, className: "icontile soft", style: { width: 40, height: 40, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, agent), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, text)), live && /* @__PURE__ */ React.createElement("span", { className: "typing", style: { marginLeft: "auto" } }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)));
  }
  const AccountCtx = createContext({});
  function PlayAs({ who, route, children }) {
    const acc = useContext(AccountCtx);
    const p = D.story(Store.get()).people[who] || Store.get().users.find((u) => u.id === who);
    if (!acc.switchTo || !p) return null;
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "playas", onClick: () => acc.switchTo(who, route) }, /* @__PURE__ */ React.createElement(Avatar, { person: p, size: "xs" }), /* @__PURE__ */ React.createElement("span", null, children || `Continue as ${p.short}`), /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 14 }));
  }
  function PushBanners({ me, onOpen }) {
    const s = useStore();
    const { push } = K.useNotice();
    const seen = useRef(null);
    useEffect(() => {
      const mine = s.notifications.filter((n) => n.to === me.id);
      if (seen.current === null) {
        seen.current = new Set(mine.map((n) => n.id));
        return;
      }
      mine.forEach((n) => {
        if (n.read) seen.current.add(n.id);
      });
      mine.filter((n) => !seen.current.has(n.id) && !n.read).reverse().forEach((n) => {
        seen.current.add(n.id);
        push({ title: n.title, body: n.body, at: n.at, hindi: n.hindi, onOpen: () => onOpen && onOpen(n) });
      });
    }, [s.notifications, me.id]);
    return null;
  }
  function LockScreen({ who, push, time, date, onOpen }) {
    const reduce = useReducedMotion();
    const p = Store.get().users.find((u) => u.id === who) || D.PEOPLE[who] || {};
    const hindi = push && /[ऀ-ॿ]/.test(push.body);
    return /* @__PURE__ */ React.createElement("div", { className: "lock", onClick: push ? onOpen : void 0 }, /* @__PURE__ */ React.createElement("div", { className: "lock-top" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 16, stroke: 2.4 }), /* @__PURE__ */ React.createElement("div", { className: "lock-date" }, date), /* @__PURE__ */ React.createElement("div", { className: "lock-time" }, time)), /* @__PURE__ */ React.createElement(AnimatePresence, null, push && /* @__PURE__ */ React.createElement(motion.button, { type: "button", key: push.title, className: "lock-note", onClick: (e) => {
      e.stopPropagation();
      onOpen();
    }, initial: reduce ? false : { opacity: 0, y: -26, scale: 0.94 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { type: "spring", stiffness: 420, damping: 32 } }, /* @__PURE__ */ React.createElement("span", { className: "ln-head" }, push.app ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "ln-app", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: push.icon || "message-circle", size: 14, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", null, push.app)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(K.Mark, { size: 22, still: true }), /* @__PURE__ */ React.createElement("span", null, "Smart-Clearance")), /* @__PURE__ */ React.createElement("span", { className: "ln-now" }, "now")), /* @__PURE__ */ React.createElement("b", null, push.title), /* @__PURE__ */ React.createElement("span", { className: cx("ln-body", hindi && "hi"), lang: hindi ? "hi" : void 0 }, push.body))), /* @__PURE__ */ React.createElement("div", { className: "lock-foot" }, push ? "Tap the notification to open" : `${p.short || p.name}'s phone`));
  }
  const CONSOLE_URL = "https://smartclearance-console.web.app";
  const dayPace = (m) => m >= 1440 ? "real time" : m >= 60 ? `1 day = ${Math.round(m / 6) / 10} h` : `1 day = ${m} min`;
  const ClockStep = ({ n, children }) => /* @__PURE__ */ React.createElement("li", { className: "jc-step" }, /* @__PURE__ */ React.createElement("span", { className: "jc-n", "aria-hidden": "true" }, n), /* @__PURE__ */ React.createElement("span", null, children));
  const Ui = ({ children }) => /* @__PURE__ */ React.createElement("b", { className: "jc-ui" }, children);
  function ClockGuide({ open, onClose, client, clock, here }) {
    return /* @__PURE__ */ React.createElement(
      K.Sheet,
      {
        open,
        onClose,
        title: "Prototype time",
        detent: "large",
        footer: here ? /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", block: true, onClick: onClose }, "Close") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "external-link", onClick: () => window.open(CONSOLE_URL, "_blank", "noopener") }, "Open the console"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", block: true, onClick: onClose }, "Close"))
      },
      /* @__PURE__ */ React.createElement("div", { className: "jc-body" }, /* @__PURE__ */ React.createElement("p", { className: "jc-lede" }, "This is a prototype. ", client, "' workspace runs on a ", /* @__PURE__ */ React.createElement("b", null, "fixed dataset"), ": its SKUs and their batches, each batch with its own best-before date. So that the gates, the sell-through and every figure come out as the story has them, the workspace keeps ", /* @__PURE__ */ React.createElement("b", null, "its own journey clock"), ". It starts on the story's day 0, not on today's date, and a journey day can be shorter than a real one."), clock && /* @__PURE__ */ React.createElement("div", { className: "jc-now" }, /* @__PURE__ */ React.createElement(Icon, { name: "calendar-clock", size: 18 }), /* @__PURE__ */ React.createElement("span", { className: "jc-now-t" }, /* @__PURE__ */ React.createElement("span", { className: "jc-now-k" }, "Journey time now"), /* @__PURE__ */ React.createElement("span", { className: "jc-now-v tnum" }, clock.long || clock.date, ", ", clock.time)), /* @__PURE__ */ React.createElement("span", { className: "jc-now-p" }, /* @__PURE__ */ React.createElement(Icon, { name: clock.perDay >= 1440 ? "clock" : "fast-forward", size: 13, stroke: 2.2 }), dayPace(clock.perDay))), /* @__PURE__ */ React.createElement("section", { className: "jc-sec", "aria-labelledby": "jc-reset" }, /* @__PURE__ */ React.createElement("h3", { id: "jc-reset", className: "jc-h" }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16 }), "Start the journey again"), /* @__PURE__ */ React.createElement("p", { className: "jc-where" }, here ? "Here in the console:" : /* @__PURE__ */ React.createElement(React.Fragment, null, "In the staff console (", /* @__PURE__ */ React.createElement("span", { className: "jc-url" }, "smartclearance-console.web.app"), "), signed in as Smart-Clearance staff:")), /* @__PURE__ */ React.createElement("ol", { className: "jc-steps" }, /* @__PURE__ */ React.createElement(ClockStep, { n: "1" }, /* @__PURE__ */ React.createElement(Ui, null, "Clients"), ", then ", /* @__PURE__ */ React.createElement(Ui, null, client), "."), /* @__PURE__ */ React.createElement(ClockStep, { n: "2" }, "The client's actions menu ", /* @__PURE__ */ React.createElement("span", { className: "jc-key", "aria-hidden": "true" }, "⋯"), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "(More)"), ", then ", /* @__PURE__ */ React.createElement(Ui, null, "Reset journey…")), /* @__PURE__ */ React.createElement(ClockStep, { n: "3" }, "Pick how long a journey day lasts, such as ", /* @__PURE__ */ React.createElement(Ui, null, "Demo"), " (five minutes a day), then ", /* @__PURE__ */ React.createElement(Ui, null, "Reset journey"), ".")), /* @__PURE__ */ React.createElement("p", { className: "jc-foot" }, "Back to day 0 with the story's batches. The client's setup stays: gates, overrides, guardrails, agents and people.")), /* @__PURE__ */ React.createElement("section", { className: "jc-sec", "aria-labelledby": "jc-ff" }, /* @__PURE__ */ React.createElement("h3", { id: "jc-ff", className: "jc-h" }, /* @__PURE__ */ React.createElement(Icon, { name: "fast-forward", size: 16 }), "Move it forward"), /* @__PURE__ */ React.createElement("ol", { className: "jc-steps" }, /* @__PURE__ */ React.createElement(ClockStep, { n: "1" }, /* @__PURE__ */ React.createElement("b", null, "Shorter days."), " The badge in the client's head (", /* @__PURE__ */ React.createElement(Ui, null, "Real time"), "), then ", /* @__PURE__ */ React.createElement(Ui, null, "Rehearsal"), " (an hour a day), ", /* @__PURE__ */ React.createElement(Ui, null, "Demo"), " (five minutes) or ", /* @__PURE__ */ React.createElement(Ui, null, "Fast"), " (a minute)."), /* @__PURE__ */ React.createElement(ClockStep, { n: "2" }, /* @__PURE__ */ React.createElement("b", null, "What falls due, now."), " The ", /* @__PURE__ */ React.createElement(Ui, null, "Agents"), " tab lists each agent's scheduled runs and timers with their journey time: ", /* @__PURE__ */ React.createElement(Ui, null, "Run now"), " for the daily load and the Watcher's check, ", /* @__PURE__ */ React.createElement(Ui, null, "Close now"), " for a kirana offer or an unsold lot, ", /* @__PURE__ */ React.createElement(Ui, null, "Report now"), " for expiry day.")), /* @__PURE__ */ React.createElement("p", { className: "jc-foot" }, "Afterwards, set the badge back to ", /* @__PURE__ */ React.createElement(Ui, null, "Real time"), ", so the journey waits for the next demo.")))
    );
  }
  function ClockNote({ client, clock, here }) {
    const [open, setOpen] = useState(false);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "jc-note" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 14, stroke: 2.2 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "Prototype time:"), " the story's own calendar, so its batches' best-before dates hold. ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "jc-link", onClick: () => setOpen(true), "aria-haspopup": "dialog" }, "How to reset or fast-forward"))), /* @__PURE__ */ React.createElement(ClockGuide, { open, onClose: () => setOpen(false), client, clock, here }));
  }
  function ClockInfo({ client, clock }) {
    const [open, setOpen] = useState(false);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", className: "jc-info", onClick: () => setOpen(true), "aria-haspopup": "dialog", "aria-label": "Prototype time: why this date, and how to reset or fast-forward the journey" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 14, stroke: 2.2 })), /* @__PURE__ */ React.createElement(ClockGuide, { open, onClose: () => setOpen(false), client, clock }));
  }
  const PEOPLE_BY_ID = (id) => D.PEOPLE[id] || (Store.get().users.find((u) => u.id === id) || { name: id });
  window.SC3_SCREENS = Object.assign(window.SC3_SCREENS || {}, { LockScreen, AccountCtx, WorkspaceCtx, LiveCtx, BatchCtx, useLive, PlayAs, Photo, ClockGuide, ClockNote, ClockInfo, PushBanners, useStore, useStory, Router, useRoute, heroModel, unreadFor, TopActions, Screen, Columns, SectionTitle, Locked, PEOPLE_BY_ID, PHASE_STATUS });
})();

(function() {
  const { useSyncExternalStore, createContext, useContext, useState, useRef, useCallback, useEffect, Fragment } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW;
  const fmt = M.fmt;
  const { Icon, IconButton, Avatar, Badge, Button, useApp, Page, ModeMenuButton, Menu, cx } = K;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const useStore = () => useSyncExternalStore(Store.subscribe, Store.get);
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
    const h = s.hero;
    const view = D.batchView(D.BATCHES[0]);
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
      eta = h.award ? `Awarded at ₹${D.COUNTER.price.toFixed(2)} · ${ordered} of ${D.KIRANAS.length} kiranas ordered` : `Listing live · ${ordered} of ${D.KIRANAS.length} kiranas ordered`;
      agentLive = h.award && ordered === D.KIRANAS.length ? "" : "Lister, Outreach and Negotiator at work";
    } else if (h.phase === "dispatched") {
      eta = "Paperwork in progress";
      agentLive = "Paperwork is drafting the pack";
    } else if (h.phase === "settled") {
      eta = "Papers ready · ledger next";
      agentLive = "Impact is posting the ledger";
    } else if (h.phase === "cleared") {
      eta = "Cleared · 0 cartons destroyed";
    }
    return { h, view, idx, done: Math.min(idx, 9), current: idx < 9 ? idx : -1, eta, etaTone, agentLive, ordered, orderedUnits, plan: D.PLAN };
  }
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
  function Screen({ me, title, sub, back, children, actions, wide, hideLarge, below }) {
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
    const p = D.PEOPLE[who];
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
  const PEOPLE_BY_ID = (id) => D.PEOPLE[id] || (Store.get().users.find((u) => u.id === id) || { name: id });
  window.SC3_SCREENS = Object.assign(window.SC3_SCREENS || {}, { LockScreen, AccountCtx, WorkspaceCtx, LiveCtx, useLive, PlayAs, PushBanners, useStore, Router, useRoute, heroModel, unreadFor, TopActions, Screen, Columns, SectionTitle, Locked, PEOPLE_BY_ID, PHASE_STATUS });
})();

(function() {
  const { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS, X = window.SC68;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Sheet, Field, Input, Product, Money, DaysNum, GateChips, Tracker, VTracker, TrackerCompact, Progress, Skeleton, Empty, Mark, Wordmark, WorkspaceMark, PoweredBy, ThemeProvider, AppRoot, NoticeHost, useApp, useNotice, Aura, AgentFeed, ClusterMap, BatchRow, StatusBadge, SplitBar, MoneyPanel, ChannelBars, ChannelTable, Segmented, Stepper, Switch, Shell } = K;
  const WS = D.WORKSPACE;
  const EASE = [0.22, 1, 0.36, 1];
  const S_PATH = "M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5";
  const DAY = { date: "Fri 2 Oct", long: "Friday 2 October 2026", time: "09:31", perDay: 5 };
  const STATES = {
    "signin": { label: "Sign-in", group: "Sign-in", screen: "signin" },
    "signin-wrong": { label: "A wrong sign-in", group: "Sign-in", screen: "signin", si: "wrong" },
    "signin-busy": { label: "Signing in", group: "Sign-in", screen: "signin", si: "busy" },
    "not-member": { label: "Signed in, not a member", group: "Sign-in", screen: "signin", si: "notmember" },
    "firstload": { label: "The first load", group: "Live states", who: "priya", route: "command", stage: 5, two: true, load: true, conn: "connecting" },
    "push-ask": { label: "Push: the ask", group: "Push permission", who: "priya", route: "command", stage: 5, two: true, push: "ask" },
    "push-install": { label: "Push: install first (iPhone)", group: "Push permission", who: "priya", route: "command", stage: 5, two: true, push: "install", phoneOnly: true },
    "push-denied": { label: "Push: blocked", group: "Push permission", who: "priya", route: "command", stage: 5, two: true, push: "denied" },
    "live": { label: "Live, two batches flagged", group: "Clock and focus", who: "priya", route: "command", stage: 5, two: true },
    "route-switch": { label: "Switching batch in the Route Room", group: "Clock and focus", who: "priya", route: "route", ref: "MF-2410-118", stage: 5, two: true, switcher: true },
    "reconnecting": { label: "Reconnecting", group: "Live states", who: "priya", route: "command", stage: 5, two: true, conn: "reconnecting" },
    "offline": { label: "Offline", group: "Live states", who: "priya", route: "route", ref: "MF-2409-117", stage: 5, two: true, conn: "offline" },
    "quiet": { label: "A quiet day", group: "Live states", who: "priya", route: "command", stage: 9, quiet: true, clock: { date: "Sat 31 Oct", long: "Saturday 31 October 2026", time: "09:14" } },
    "quiet-partner": { label: "A quiet day, Rakesh bhai", group: "Live states", who: "rakesh", route: "home", stage: 9, quiet: true, clock: { date: "Sat 31 Oct", long: "Saturday 31 October 2026", time: "09:14" } },
    "quiet-kirana": { label: "A quiet day, Ganesh ji", group: "Live states", who: "ganesh", route: "home", stage: 1, quiet: true, clock: { date: "Thu 1 Oct", long: "Thursday 1 October 2026", time: "17:05" } },
    "approve-failed": { label: "Approve failed", group: "Live states", who: "priya", route: "route", ref: "MF-2409-117", stage: 5, two: true, fail: true },
    "upload-photo": { label: "Uploading the label photo", group: "Live states", who: "rakesh", route: "photo", stage: 2, photo: true, upload: "photo", clock: { date: "Fri 2 Oct", long: "Friday 2 October 2026", time: "09:18" } },
    "upload-dms": { label: "Uploading the DMS export", group: "Live states", who: "priya", route: "setup", stage: 0, upload: "dms", desktopOnly: true, clock: { date: "Thu 1 Oct", long: "Thursday 1 October 2026", time: "16:33" } }
  };
  const Q = new URLSearchParams(location.search);
  const SHOT = Q.get("shot") === "1";
  const STATE = STATES[Q.get("state")] ? Q.get("state") : "live";
  const SCN = Object.assign({ state: STATE, conn: "live", since: (STATES[STATE].clock || DAY).time }, STATES[STATE]);
  const ScnCtx = createContext(SCN);
  const useScn = () => useContext(ScnCtx);
  function useClock(base) {
    const [k, setK] = useState(0);
    const step = base.perDay * 6e4 / 96;
    useEffect(() => {
      if (SHOT || base.perDay >= 1440) return;
      const t2 = setInterval(() => setK((x) => x + 1), step);
      return () => clearInterval(t2);
    }, [step]);
    if (!k) return base;
    const [h, m] = base.time.split(":").map(Number);
    const t = h * 60 + m + k * 15;
    return Object.assign({}, base, { time: String(Math.floor(t / 60) % 24).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0") });
  }
  const MANGO = D.BATCHES[1];
  function mangoView() {
    const v = D.batchView(MANGO);
    return v;
  }
  const mangoGates = (v) => v.assess.gates.map((g) => `${g.app} ${g.has}/${g.need}`).join(" \xB7 ");
  function mangoFeed(v) {
    return [
      { id: "m1", stage: "detect", agent: "Watcher", icon: "radar", at: "09:00", min: 0, text: `MF-2410-118 fails all three quick-commerce gates; ${fmt.num(v.assess.atRisk)} of ${fmt.num(v.units)} units will not sell by ${fmt.date(v.bestBefore).replace(/ \d{4}$/, "")}.`, calls: [["gates.check", mangoGates(v), "bad"], ["sellthrough.project", `${v.sellPerDay}/day \xD7 ${v.assess.usableDays} days = ${fmt.num(v.assess.willSell)} of ${fmt.num(v.units)}`, ""], ["pubsub.publish", "batch.at_risk", "ok"]] },
      { id: "m2", stage: "verify", agent: "Vision", icon: "scan-line", at: "09:05", min: 5, text: "Asked Lakshmi Agencies for one label photo before quoting any price.", calls: [["fcm.send", "Lakshmi Agencies", "ok"]] }
    ];
  }
  function flaggedItems(s, scn) {
    const hm = S.heroModel(s);
    const chips = { ref: D.BATCHES[0].id, hero: true, view: hm.view, done: hm.done, current: hm.current, stop: D.STAGES[hm.current] ? D.STAGES[hm.current].title : "Cleared", human: hm.current === 5, eta: hm.eta, etaTone: hm.etaTone, agentLive: hm.agentLive, waiting: hm.current === 5 ? "Waiting for your yes" : hm.eta };
    if (!scn.two) return [chips];
    const v = mangoView();
    const mango = { ref: MANGO.id, view: v, done: 2, current: 2, stop: "Verify", human: false, eta: "Label photo asked at 09:05", etaTone: "green", agentLive: "Vision is waiting for Lakshmi Agencies' photo", waiting: "Waiting for Lakshmi Agencies' label photo" };
    return [chips, mango];
  }
  const itemFor = (items, ref) => items.find((i) => i.ref === ref) || items[0];
  function FlagRow({ item, onOpen, selected, dim }) {
    const v = item.view;
    const sku = v.skuObj;
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("x68-flagrow", selected && "on"), onClick: onOpen, "aria-current": selected ? "true" : void 0 }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 44, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "x68-fr-main" }, /* @__PURE__ */ React.createElement("span", { className: "x68-fr-top" }, /* @__PURE__ */ React.createElement("b", null, sku.name), /* @__PURE__ */ React.createElement("span", { className: "mono subtle t-caption" }, v.id)), /* @__PURE__ */ React.createElement("span", { className: "x68-fr-sub" }, v.dist.name, " \xB7 ", v.daysLeft, " days left"), /* @__PURE__ */ React.createElement(Segs, { done: item.done, current: item.current, human: item.human, dim, label: `${item.stop}, stop ${item.current + 1} of 9` })), /* @__PURE__ */ React.createElement("span", { className: "x68-fr-stop" }, /* @__PURE__ */ React.createElement("b", null, item.stop), /* @__PURE__ */ React.createElement("span", null, dim ? "paused" : item.human ? "your yes" : "agents")), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "subtle" }));
  }
  function Segs({ done, current, human, dim, label, small }) {
    return /* @__PURE__ */ React.createElement("span", { className: cx("x68-segs", small && "sm", dim && "dim"), role: "img", "aria-label": label }, D.STAGES.map((st, i) => /* @__PURE__ */ React.createElement("i", { key: st.id, className: cx(i < done && "done", i === current && "now", i === current && human && "human") })));
  }
  const ASK_WORDS = {
    operator: ["Get a push when a batch needs you", "The Watcher checks 312 batches at 09:00 every journey day. When one needs your yes, the plan reaches your lock screen with the money on it."],
    distributor: ["Get photo requests and orders as a push", "When Vision needs a label photo or your kiranas order on a scheme, it reaches your lock screen, in Hindi."],
    retailer: ["Get Rakesh Traders' offers as a push", "Schemes arrive in Hindi, ready to order in one tap."]
  };
  function PushContent({ variant, me, compact, onAllow, onLater, standalone }) {
    const app = useApp();
    const [title, body] = ASK_WORDS[me.role] || ASK_WORDS.operator;
    const phone = app.bp === "phone";
    if (variant === "install") return /* @__PURE__ */ React.createElement("div", { className: cx("x68-push", compact && "compact") }, /* @__PURE__ */ React.createElement("span", { className: "icontile blue x68-push-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "bell-ring", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "x68-push-body" }, /* @__PURE__ */ React.createElement("b", { className: "x68-push-t" }, "On iPhone, add the app to your Home Screen first"), /* @__PURE__ */ React.createElement("p", null, "Safari only sends notifications to web apps opened from the Home Screen. It takes three taps."), /* @__PURE__ */ React.createElement("ol", { className: "x68-steps" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "x68-stepn" }, "1"), /* @__PURE__ */ React.createElement("span", null, "Tap ", /* @__PURE__ */ React.createElement("b", null, "Share"), /* @__PURE__ */ React.createElement("span", { className: "x68-glyph" }, /* @__PURE__ */ React.createElement(Icon, { name: "share-ios", size: 15 })), "in Safari's toolbar")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "x68-stepn" }, "2"), /* @__PURE__ */ React.createElement("span", null, "Choose ", /* @__PURE__ */ React.createElement("span", { className: "x68-nowrap" }, /* @__PURE__ */ React.createElement("b", null, "Add to Home Screen"), /* @__PURE__ */ React.createElement("span", { className: "x68-glyph" }, /* @__PURE__ */ React.createElement(Icon, { name: "square-plus", size: 15 }))))), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "x68-stepn" }, "3"), /* @__PURE__ */ React.createElement("span", null, "Open ", /* @__PURE__ */ React.createElement("b", null, "Clearance"), " from your Home Screen, then turn on notifications here"))), /* @__PURE__ */ React.createElement("div", { className: "x68-push-acts" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: onLater }, "Not now"))));
    if (variant === "denied") return /* @__PURE__ */ React.createElement("div", { className: cx("x68-push", compact && "compact") }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft x68-push-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "bell-off", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "x68-push-body" }, /* @__PURE__ */ React.createElement("b", { className: "x68-push-t" }, "Notifications are blocked"), /* @__PURE__ */ React.createElement("p", null, "Your browser blocks notifications from ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, WS.domain), ". Everything still reaches your inbox (the bell) while they are off."), /* @__PURE__ */ React.createElement("ol", { className: "x68-steps" }, (phone ? [["In Chrome, open the menu (the three dots), then", "Settings", ""], ["Open", "Site settings", "and then Notifications"], ["Find", WS.domain, "and choose Allow"]] : [["Click", "the site settings icon", "at the left of the address bar"], ["Set", "Notifications", "to Allow"], ["Reload", "the page", ""]]).map(([a, b, c], i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement("span", { className: "x68-stepn" }, i + 1), /* @__PURE__ */ React.createElement("span", null, a, " ", /* @__PURE__ */ React.createElement("b", null, b), " ", c)))), /* @__PURE__ */ React.createElement("div", { className: "x68-push-acts" }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "refresh-cw" }, "Check again"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: onLater }, "Not now"))));
    return /* @__PURE__ */ React.createElement("div", { className: cx("x68-push", compact && "compact") }, /* @__PURE__ */ React.createElement("span", { className: "icontile blue x68-push-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "bell-ring", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "x68-push-body" }, /* @__PURE__ */ React.createElement("b", { className: "x68-push-t" }, title), /* @__PURE__ */ React.createElement("p", null, body), /* @__PURE__ */ React.createElement("div", { className: "x68-push-acts" }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "bell", onClick: onAllow }, "Turn on notifications"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: onLater }, "Not now"))));
  }
  function Ph({ w = "100%", h = 12, r = 6, i = 0 }) {
    return /* @__PURE__ */ React.createElement("span", { className: "x68-ph", style: { width: w, height: h, borderRadius: r, "--i": i }, "aria-hidden": "true" });
  }
  function CCSkeleton({ phone }) {
    const card = /* @__PURE__ */ React.createElement("div", { className: "bezel" }, /* @__PURE__ */ React.createElement("div", { className: "card raised x68-phcard", style: { padding: phone ? 18 : 26 } }, /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement(Ph, { w: 150, h: 22, r: 99 }), /* @__PURE__ */ React.createElement(Ph, { w: 140, h: 12, i: 1 })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr) 92px" : "minmax(0,1fr) 168px", gap: 18, marginTop: 14, alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Ph, { w: "62%", h: 18, i: 2 }), /* @__PURE__ */ React.createElement(Ph, { w: phone ? 120 : 200, h: phone ? 56 : 84, r: 14, i: 3 })), /* @__PURE__ */ React.createElement(Ph, { w: phone ? 92 : 168, h: phone ? 92 : 150, r: 22, i: 2 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 10, marginTop: 18 } }, /* @__PURE__ */ React.createElement(Ph, { w: phone ? 120 : 180, h: 28, r: 8, i: 4 }), /* @__PURE__ */ React.createElement(Ph, { w: "88%", h: 12, i: 5 })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 22 } }, phone ? /* @__PURE__ */ React.createElement(Ph, { h: 58, r: 16, i: 6 }) : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(9, minmax(0, 1fr))", gap: 10 } }, D.STAGES.map((st, i) => /* @__PURE__ */ React.createElement(Ph, { key: st.id, h: 8, r: 4, i: i % 4 + 4 })))), /* @__PURE__ */ React.createElement("div", { className: "row between", style: { marginTop: 22 } }, /* @__PURE__ */ React.createElement(Ph, { w: 190, h: 26, r: 99, i: 6 }), /* @__PURE__ */ React.createElement(Ph, { w: 170, h: 44, r: 12, i: 7 }))));
    const rows = /* @__PURE__ */ React.createElement("div", { className: "list" }, [0, 1, 2, 3].map((i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "list-row", style: { gridTemplateColumns: "54px minmax(0,1fr)", minHeight: 78 } }, /* @__PURE__ */ React.createElement(Ph, { w: 54, h: 54, r: 14, i }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Ph, { w: "46%", h: 13, i: i + 1 }), /* @__PURE__ */ React.createElement(Ph, { w: "70%", h: 10, i: i + 2 }), /* @__PURE__ */ React.createElement(Ph, { w: "58%", h: 6, i: i + 3 })))));
    if (phone) return /* @__PURE__ */ React.createElement("div", { className: "stack x68-load", style: { gap: 20 }, "aria-busy": "true" }, card, /* @__PURE__ */ React.createElement(Ph, { w: 160, h: 18 }), rows);
    return /* @__PURE__ */ React.createElement("div", { className: "x68-load", "aria-busy": "true", style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 20, alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, card, /* @__PURE__ */ React.createElement(Ph, { w: 160, h: 20 }), rows), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Ph, { w: 150, h: 20 }), /* @__PURE__ */ React.createElement("div", { className: "card", style: { display: "grid", gap: 18 } }, [0, 1, 2, 3].map((i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "row top", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Ph, { w: 34, h: 34, r: 11, i }), /* @__PURE__ */ React.createElement("span", { className: "stack tight grow", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Ph, { w: "40%", h: 12, i: i + 1 }), /* @__PURE__ */ React.createElement(Ph, { w: "92%", h: 10, i: i + 2 }), /* @__PURE__ */ React.createElement(Ph, { w: "60%", h: 10, i: i + 3 })))))));
  }
  function TrackerCard68({ item, primary, money, line, dim, head, note, cluster }) {
    const app = useApp();
    const phone = app.bp === "phone";
    const live = X.useLive();
    const view = item.view;
    const a = view.assess;
    const sku = view.skuObj;
    const stages = D.STAGES.map((st) => ({ id: st.id, title: st.title, human: st.human }));
    return /* @__PURE__ */ React.createElement("div", { className: "bezel" }, /* @__PURE__ */ React.createElement("div", { className: cx("card raised", dim && "x68-dimcard"), style: { padding: phone ? 18 : 26, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(StatusBadge, { status: view.phase || a.status, live: !dim && (view.phase ? view.phase === "executing" : a.status === "at-risk") }), /* @__PURE__ */ React.createElement("span", { className: "mono subtle t-footnote" }, view.id)), head || /* @__PURE__ */ React.createElement("span", { className: "row tight subtle t-footnote" }, /* @__PURE__ */ React.createElement(Icon, { name: "map-pin", size: 15 }), view.dist.name, " \xB7 ", view.dist.city)), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr) 92px" : "minmax(0,1fr) 168px", gap: phone ? 12 : 20, alignItems: "center", marginTop: phone ? 10 : 6 } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "t-headline", style: { fontSize: phone ? 17 : 19 } }, sku.brand, " ", sku.name), head && /* @__PURE__ */ React.createElement("div", { className: "t-footnote subtle", style: { marginTop: 2 } }, view.dist.name, " \xB7 ", view.dist.city), /* @__PURE__ */ React.createElement("div", { className: "row base", style: { gap: phone ? 10 : 14, marginTop: phone ? 6 : 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(DaysNum, { days: view.daysLeft, life: sku.lifeDays, size: phone ? "l" : "xl", style: { color: a.status === "at-risk" && !view.phase ? "var(--red-text)" : "var(--fg)" } }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("span", { className: "t-callout strong" }, "days left"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "best before ", fmt.date(view.bestBefore))))), /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: phone ? 92 : 168, float: !dim, alt: sku.name })), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: phone ? 10 : 18, marginTop: phone ? 12 : 16, alignItems: "flex-end" } }, money, /* @__PURE__ */ React.createElement("div", { className: "grow t-subhead muted", style: { minWidth: 220, maxWidth: 520 } }, line || `Blocked from Blinkit, Zepto and Instamart. ${fmt.num(a.atRisk)} of ${fmt.num(view.units)} units will not sell by ${fmt.date(view.bestBefore).replace(/ \d{4}$/, "")}.`)), /* @__PURE__ */ React.createElement("div", { style: { marginTop: phone ? 14 : 22 }, className: dim ? "x68-dimtrack" : void 0 }, phone ? /* @__PURE__ */ React.createElement(TrackerCompact, { done: item.done, current: item.current }) : /* @__PURE__ */ React.createElement(Tracker, { stages, done: item.done, current: item.current, times: K.STAGE_TIMES })), /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { marginTop: phone ? 16 : 20, gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, dim ? /* @__PURE__ */ React.createElement("span", { className: "row tight t-footnote x68-paused" }, /* @__PURE__ */ React.createElement(X.ConnMark, { conn: live.conn }), live.conn === "offline" ? `Offline \xB7 as of ${live.since}` : `Updates paused at ${live.since}`) : /* @__PURE__ */ React.createElement(React.Fragment, null, item.eta && /* @__PURE__ */ React.createElement(Badge, { tone: item.etaTone || "green", icon: "clock" }, item.eta), item.agentLive && /* @__PURE__ */ React.createElement("span", { className: "row tight t-footnote muted" }, /* @__PURE__ */ React.createElement(Aura, { on: true, className: "icontile soft", style: { width: 24, height: 24, borderRadius: 8 } }, /* @__PURE__ */ React.createElement(Icon, { name: "sparkles", size: 13 })), item.agentLive))), /* @__PURE__ */ React.createElement("div", { className: "row tight" }, primary)), note));
  }
  const chipsMoney = (phone) => /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.net, size: phone ? "s" : "m", style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "net recovered on the plan \xB7 swing ", fmt.inr(D.PLAN.swing)));
  const mangoMoney = (phone, v) => /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement(Money, { value: -D.MANGO_PLAN.writeOff.total, size: phone ? "s" : "m", style: { color: "var(--red-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "if destroyed \xB7 ", fmt.num(v.assess.atRisk), " units at risk"));
  function trackerFor(item, { phone, go, dim, offline, head, note }) {
    const primary = item.hero ? item.human ? /* @__PURE__ */ React.createElement(Button, { variant: "approve", icon: "check", disabled: offline, onClick: () => go("route", { ref: item.ref }) }, "Review and approve") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("route", { ref: item.ref }) }, "Open Route Room") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("route", { ref: item.ref }) }, "Open Route Room");
    return /* @__PURE__ */ React.createElement(TrackerCard68, { key: item.ref, item, dim, head, note, primary, money: item.hero ? chipsMoney(phone) : mangoMoney(phone, item.view) });
  }
  function CommandCenter68({ me }) {
    const s = S.useStore();
    const { go } = S.useRoute();
    const app = useApp();
    const phone = app.bp === "phone";
    const scn = useScn();
    const live = X.useLive();
    const o = X.OPT();
    const [later, setLater] = useState(false);
    const { toast } = useNotice();
    const wasLoading = useRef(false);
    const dim = live.conn === "reconnecting" || live.conn === "offline";
    if (scn.load && o.firstLoad !== "splash") {
      wasLoading.current = true;
      return /* @__PURE__ */ React.createElement(X.Screen68, { me, title: "Command Center", sub: "Catching up with the agents\u2026" }, /* @__PURE__ */ React.createElement(CCSkeleton, { phone }));
    }
    const rise = (c) => wasLoading.current && !SHOT ? /* @__PURE__ */ React.createElement(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.42, ease: EASE } }, c) : c;
    const allow = () => {
      setLater(true);
      toast({ text: "Notifications are on. The 09:00 push reaches this device.", tone: "ok", icon: "bell" });
    };
    const items = flaggedItems(s, scn);
    const views = D.BATCHES.map((b) => {
      const v = D.batchView(b);
      if (b.hero) v.phase = scn.quiet ? "cleared" : S.heroModel(s).view.phase;
      if (b.second && !scn.two) v.phase = scn.quiet ? "cleared" : "executing";
      return v;
    });
    const watch = views.filter((v) => !(v.phase === "cleared")).sort((a, b) => (a.phase === "awaiting" || !a.phase && a.assess.status === "at-risk" ? -1 : 0) - (b.phase === "awaiting" || !b.phase && b.assess.status === "at-risk" ? -1 : 0) || a.daysLeft - b.daysLeft);
    const open = (v) => v.id === items[0].ref || scn.two && v.id === MANGO.id ? go("route", { ref: v.id }) : null;
    const push = scn.push && o.pushPlace === "home" && !later ? /* @__PURE__ */ React.createElement(motion.div, { initial: SHOT ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: EASE } }, /* @__PURE__ */ React.createElement(Card, { className: "x68-pushcard" }, /* @__PURE__ */ React.createElement(PushContent, { variant: scn.push, me, onAllow: allow, onLater: () => setLater(true) }))) : null;
    const feed = /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Every hand-off, as it happens" }, "Agent activity"), /* @__PURE__ */ React.createElement(Card, { className: dim ? "x68-dimcard" : void 0 }, /* @__PURE__ */ React.createElement(AgentFeed, { events: scn.two ? s.feed.concat(mangoFeed(items[1].view)).sort((a, b) => a.at < b.at ? -1 : 1) : s.feed, people: D.PEOPLE, live: -1, max: phone ? 3 : 6 })));
    const list = /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: scn.quiet ? "Every batch clears inside its date at today's sell-through" : "Flagged batches first, then by days to best-before" }, "Watchlist"), /* @__PURE__ */ React.createElement("div", { className: "list" }, watch.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, compact: phone, onOpen: () => open(v) }))));
    let top;
    if (scn.quiet) {
      const next = "Sun 1 Nov, 09:00";
      top = /* @__PURE__ */ React.createElement(Card, { className: "x68-quiet" }, /* @__PURE__ */ React.createElement("div", { className: "x68-quiet-in" }, /* @__PURE__ */ React.createElement(Product, { name: "sprout-box", size: phone ? 96 : 120, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("div", { className: "t-title3" }, "Nothing at risk today"), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, "The Watcher checked 312 batches at 09:00. Every one sells through inside its date, so nothing needs you. The next check is ", next, ", ", X.untilNine(live.clock), " from now at this pace."), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { marginTop: 6 } }, /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "Last cleared \xB7 MF-2409-117"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, fmt.inr(D.ACTUAL.net), " recovered, 0 cartons destroyed")))));
    } else top = o.Flagged ? /* @__PURE__ */ React.createElement(o.Flagged, { items, phone, go, dim, offline: live.conn === "offline", trackerFor, FlagRow }) : trackerFor(items[0], { phone, go, dim });
    const cluster = !scn.quiet && /* @__PURE__ */ React.createElement(Card, { pad: false, className: "stack", style: { overflow: "hidden", gap: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-head", style: { padding: "14px 16px 10px" } }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Nagpur cluster"), /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, D.OFFERED, " kiranas")), /* @__PURE__ */ React.createElement(ClusterMap, { kiranas: D.KIRANAS, orderedCount: 0, route: false, vanProgress: 0, height: phone ? 220 : 280 }));
    const sub = scn.quiet ? "Watcher checked 312 batches at 09:00 \xB7 nothing flagged" : `Watcher checked 312 batches at 09:00 \xB7 ${items.length} flagged`;
    return /* @__PURE__ */ React.createElement(X.Screen68, { me, title: "Command Center", sub }, rise(app.bp === "desktop" ? /* @__PURE__ */ React.createElement(S.Columns, { sideWidth: 340, main: /* @__PURE__ */ React.createElement(React.Fragment, null, push, top, cluster, list), side: feed }) : /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, push, top, feed, list, cluster)));
  }
  function RouteRoom68({ me }) {
    const { route } = S.useRoute();
    const s = S.useStore();
    const scn = useScn();
    const o = X.OPT();
    const app = useApp();
    const items = flaggedItems(s, Object.assign({}, scn, { two: scn.two }));
    const ref = route.params && route.params.ref || items[0].ref;
    const item = itemFor(items, ref);
    const below = o.Switcher && items.length > 1 ? /* @__PURE__ */ React.createElement(o.Switcher, { items, current: item.ref, phone: app.bp === "phone", open: scn.switcher }) : null;
    return item.hero ? /* @__PURE__ */ React.createElement(HeroRoom, { me, item, items, below }) : /* @__PURE__ */ React.createElement(MangoRoom, { me, item, below });
  }
  function HeroRoom({ me, item, items, below }) {
    const s = S.useStore();
    const app = useApp();
    const hm = S.heroModel(s);
    const h = s.hero;
    const [view, setView] = useState("chart");
    const scn = useScn();
    const live = X.useLive();
    const o = X.OPT();
    const [sheet, setSheet] = useState(!!scn.fail && !(o.failSheetClosed && SHOT));
    const { go } = S.useRoute();
    const offline = live.conn === "offline";
    const dim = offline || live.conn === "reconnecting";
    const stages = D.STAGES.map((x) => ({ id: x.id, title: x.title, human: x.human }));
    const planned = h.phase === "planned";
    const v = hm.view;
    const sku = v.skuObj;
    const staff = D.PLAN.rows.find((r) => r.id === "staff");
    const ES = D.PLAN.lines.find((l) => l.id === "expiresoon"), KL = D.PLAN.lines.find((l) => l.id === "kirana");
    useEffect(() => {
      const f = () => setSheet(true);
      window.addEventListener("sc68:approve", f);
      return () => window.removeEventListener("sc68:approve", f);
    }, []);
    const dock = planned && !o.dockApproves;
    return /* @__PURE__ */ React.createElement(X.Screen68, { me, title: "Route Room", sub: below ? null : `${v.id} \xB7 ${sku.brand} ${sku.name} \xB7 ${v.dist.name}, ${v.dist.city}`, back: "Command Center", below }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20, paddingBottom: dock ? 96 : 0 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: app.bp === "phone" ? 64 : 84 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("div", { className: "row base", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(DaysNum, { days: v.daysLeft, life: sku.lifeDays, size: "l", style: { color: "var(--red-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, "days left"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "best before ", fmt.date(v.bestBefore))))), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: app.bp === "phone" ? "start" : "end" } }, /* @__PURE__ */ React.createElement(GateChips, { gates: v.assess.gates }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, fmt.num(v.assess.atRisk), " of ", fmt.num(v.units), " units at risk \xB7 sells ", v.sellPerDay, " a day"))), /* @__PURE__ */ React.createElement("div", { className: dim ? "x68-dimtrack" : void 0 }, app.bp === "phone" ? /* @__PURE__ */ React.createElement(TrackerCompact, { done: hm.done, current: hm.current }) : /* @__PURE__ */ React.createElement(Tracker, { stages, done: hm.done, current: hm.current, times: K.STAGE_TIMES }))), /* @__PURE__ */ React.createElement(
      S.Columns,
      {
        sideWidth: 340,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Vision \xB7 09:20", right: /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "matches the DMS record") }, "Label, read from the shelf"), /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { containerType: "inline-size" } }, /* @__PURE__ */ React.createElement("div", { className: "labelgrid" }, /* @__PURE__ */ React.createElement(S.LabelPhoto, { status: "verified" }), /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(List, null, [["Batch", "MF-2409-117"], ["Manufactured", "18 May 2026"], ["Best before", "18 Nov 2026"], ["Shelf life", `${v.assess.life} days \xB7 ${v.assess.lifeUsedPct}% used`], ["MRP", "\u20B930.00 \xB7 24 \xD7 150 g"], ["Records", "match"]].map(([k, val]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, value: val }))))))), /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Valuer \xB7 09:21 \xB7 per unit, after costs", right: /* @__PURE__ */ React.createElement(Segmented, { options: [{ id: "chart", label: "Chart" }, { id: "table", label: "Table" }], value: view, onChange: setView, label: "View" }) }, "Five channels, priced"), view === "chart" ? /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(ChannelBars, { rows: D.PLAN.rows, chosen: D.PLAN.lines.map((l) => l.id) })) : /* @__PURE__ */ React.createElement(ChannelTable, { rows: D.PLAN.rows, chosen: D.PLAN.lines.map((l) => l.id) }), /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Router \xB7 09:22" }, "Recommended split"), /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement(SplitBar, { plan: D.PLAN, sku }), /* @__PURE__ */ React.createElement("div", { className: "stack tight t-subhead", style: { marginTop: 4 } }, /* @__PURE__ */ React.createElement("div", { className: "row top", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "dotmark", style: { background: "var(--ch-kirana)" } }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, KL.units, " units to the kirana cluster at \u20B918 effective"), " (\u20B9", KL.packPrice.toFixed(2), " a pack, 2 free with every 10).")), /* @__PURE__ */ React.createElement("div", { className: "row top", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "dotmark", style: { background: "var(--ch-expiresoon)" } }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, ES.units, " units to ExpireSoon at \u20B915"), " (reserve \u20B913.50), listed in Rakesh Traders' name.")), /* @__PURE__ */ React.createElement("div", { className: "row top muted", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "dotmark", style: { background: "var(--fill-3)" } }), /* @__PURE__ */ React.createElement("span", null, "The ", staff.name, " is eligible but pays less a unit than ExpireSoon, so it gets nothing this time.")))), /* @__PURE__ */ React.createElement(MoneyPanel, { plan: D.PLAN, compact: app.bp !== "desktop" })),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Gaps drawn to the clock" }, "Agent timeline"), /* @__PURE__ */ React.createElement(Card, { className: dim ? "x68-dimcard" : void 0 }, /* @__PURE__ */ React.createElement(AgentFeed, { events: s.feed.filter((e) => e.stage !== "connect"), people: D.PEOPLE, live: -1 })))
      }
    )), dock && /* @__PURE__ */ React.createElement("div", { style: { position: "sticky", bottom: 0, zIndex: 5, padding: "12px 0 16px", background: "linear-gradient(180deg, transparent, var(--bg) 35%)" } }, /* @__PURE__ */ React.createElement("div", { className: "card raised row wrap", style: { padding: "14px 16px", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap grow", style: { gap: 18 } }, [["You get", D.PLAN.net, "var(--primary-text)"], ["Instead of", -D.PLAN.writeOff.total, "var(--red-text)"], ["GST credit safe", D.PLAN.itcRetained, "var(--fg)"]].map(([k, val, c]) => /* @__PURE__ */ React.createElement("div", { key: k, className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle strong" }, k), /* @__PURE__ */ React.createElement(Money, { value: val, size: "s", style: { color: c, fontSize: 26 } })))), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: "end", gap: 6 } }, /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "lg", icon: "check", "aria-disabled": offline || void 0, className: offline ? "x68-blocked" : void 0, "aria-describedby": offline ? "x68-needs-net" : void 0, onClick: () => !offline && setSheet(true) }, "Review and approve"), offline && /* @__PURE__ */ React.createElement("span", { id: "x68-needs-net", className: "t-footnote x68-needs" }, /* @__PURE__ */ React.createElement(Icon, { name: "wifi-off", size: 14 }), "Approving needs a connection")))), /* @__PURE__ */ React.createElement(ApproveSheet68, { open: sheet, onClose: () => setSheet(false), me, fail: scn.fail }));
  }
  function MangoRoom({ me, item, below }) {
    const app = useApp();
    const v = item.view;
    const sku = v.skuObj;
    const live = X.useLive();
    const dim = live.conn !== "live";
    const stages = D.STAGES.map((x) => ({ id: x.id, title: x.title, human: x.human }));
    return /* @__PURE__ */ React.createElement(X.Screen68, { me, title: "Route Room", sub: below ? null : `${v.id} \xB7 ${sku.brand} ${sku.name} \xB7 ${v.dist.name}, ${v.dist.city}`, back: "Command Center", below }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: app.bp === "phone" ? 64 : 84 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("div", { className: "row base", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(DaysNum, { days: v.daysLeft, life: sku.lifeDays, size: "l", style: { color: "var(--red-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, "days left"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "best before ", fmt.date(v.bestBefore))))), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: app.bp === "phone" ? "start" : "end" } }, /* @__PURE__ */ React.createElement(GateChips, { gates: v.assess.gates }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, fmt.num(v.assess.atRisk), " of ", fmt.num(v.units), " units at risk \xB7 sells ", v.sellPerDay, " a day"))), /* @__PURE__ */ React.createElement("div", { className: dim ? "x68-dimtrack" : void 0 }, app.bp === "phone" ? /* @__PURE__ */ React.createElement(TrackerCompact, { done: item.done, current: item.current }) : /* @__PURE__ */ React.createElement(Tracker, { stages, done: item.done, current: item.current, times: { connect: "once", detect: "09:00", verify: "asked 09:05" } }))), /* @__PURE__ */ React.createElement(
      S.Columns,
      {
        sideWidth: 340,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Vision \xB7 asked at 09:05" }, "Label, read from the shelf"), /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { containerType: "inline-size" } }, /* @__PURE__ */ React.createElement("div", { className: "labelgrid" }, /* @__PURE__ */ React.createElement("div", { className: "x68-await" }, /* @__PURE__ */ React.createElement(Product, { name: "pack-mango", size: app.bp === "phone" ? 110 : 140, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: "center", textAlign: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("b", null, "Waiting for Lakshmi Agencies' photo"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "One carton in the Begum Bazaar godown. She sends it from her own phone; the request reached her at 09:05."))), /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(S.Locked, { icon: "scan-line", agent: "Vision Agent", live: !dim, text: "Prices nothing until a person photographs one carton label on the shelf." }), [0, 1, 2, 3].map((i) => /* @__PURE__ */ React.createElement(Skeleton, { key: i, h: 44, r: 12 })))))), /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Valuer" }, "Five channels, priced"), /* @__PURE__ */ React.createElement(S.Locked, { icon: "scale", agent: "Valuer Agent", text: "Prices five channels once the label is verified." }), /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Router" }, "Recommended split"), /* @__PURE__ */ React.createElement(S.Locked, { icon: "split", agent: "Router Agent", text: "Proposes a split once the channels are priced." })),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Gaps drawn to the clock" }, "Agent timeline"), /* @__PURE__ */ React.createElement(Card, { className: dim ? "x68-dimcard" : void 0 }, /* @__PURE__ */ React.createElement(AgentFeed, { events: mangoFeed(v), people: D.PEOPLE, live: -1 })))
      }
    )));
  }
  function ApproveSheet68({ open, onClose, me, fail }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(!!fail && SHOT);
    const reduce = useReducedMotion();
    const o = X.OPT();
    const KL = D.PLAN.lines.find((l) => l.id === "kirana"), ES = D.PLAN.lines.find((l) => l.id === "expiresoon");
    const approve = () => {
      setErr(false);
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        setErr(true);
        if (o.onFail) o.onFail();
      }, 900);
    };
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title: "Approve the plan", footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, err && /* @__PURE__ */ React.createElement(motion.div, { key: "e", className: "x68-err", role: "alert", initial: reduce || SHOT ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.24, ease: EASE } }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 18 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "The approval didn't go through."), " Smart-Clearance didn't answer in time, so nothing was listed, offered or sent. The plan is still waiting for you."))), /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "lg", block: true, icon: err ? "refresh-cw" : "check", loading: busy, onClick: approve }, err ? "Retry \xB7 release the agents" : "Approve \xB7 release the agents"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", block: true, onClick: onClose }, "Not now")) }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement(Money, { value: D.PLAN.net, size: "l", style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "muted" }, "net recovered, ", D.PLAN.pctMRP, "% of MRP")), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { icon: "trending-up", title: "Instead of destroying", value: fmt.inr(-D.PLAN.writeOff.total) }), /* @__PURE__ */ React.createElement(ListRow, { icon: "scale", iconTone: "blue", title: "Swing on this batch", value: fmt.inr(D.PLAN.swing) }), /* @__PURE__ */ React.createElement(ListRow, { icon: "badge-check", iconTone: "gray", title: "GST input credit retained", value: fmt.inr(D.PLAN.itcRetained) })), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "What happens the moment you tap"), [["shopping-bag", `Lister posts ${ES.units} units on ExpireSoon at \u20B915 in Rakesh Traders' name; reserve \u20B913.50.`], ["send", `Outreach pushes the Hindi scheme to ${D.OFFERED} kiranas: ${KL.units} units at \u20B9${KL.packPrice.toFixed(2)} a pack.`], ["shield-check", "Nothing is listed, messaged or shipped before this tap. The approval is logged with who, when and device."]].map(([ic, t]) => /* @__PURE__ */ React.createElement("div", { key: ic, className: "row top t-subhead", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Icon, { name: ic, size: 18, style: { marginTop: 2, color: "var(--fg-3)" } }), /* @__PURE__ */ React.createElement("span", null, t))))));
  }
  function Camera68({ me }) {
    const scn = useScn();
    const o = X.OPT();
    const [p, setP] = useState(0.62);
    const reduce = useReducedMotion();
    useEffect(() => {
      if (SHOT || !scn.upload) return;
      let raf = 0;
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(0.97, 0.18 + (now - t0) / 9e3);
        setP(k);
        if (k < 0.97) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, []);
    const mb = (2.3 * p).toFixed(1);
    return /* @__PURE__ */ React.createElement(X.Screen68, { me, title: "Label photo", sub: "Batch MF-2409-117 \xB7 shelf B4", back: "Today" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement("div", { className: "cam" }, /* @__PURE__ */ React.createElement(S.LabelShot, { cover: true }), o.UploadOnPhoto && /* @__PURE__ */ React.createElement(o.UploadOnPhoto, { p })), o.UploadUnderPhoto ? /* @__PURE__ */ React.createElement(o.UploadUnderPhoto, { p, mb }) : /* @__PURE__ */ React.createElement(UploadLine, { p, mb, total: "2.3 MB", label: "Sending the photo" }), /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle", style: { textAlign: "center", margin: 0 } }, "A slow connection only slows the send; the photo is kept on this phone until it arrives.")));
  }
  function UploadLine({ p, mb, total, label, name, onCancel }) {
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug x68-upload" }, /* @__PURE__ */ React.createElement("div", { className: "row between", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, label), name && /* @__PURE__ */ React.createElement("span", { className: "mono t-caption subtle", style: { overflowWrap: "anywhere" } }, name)), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: onCancel }, "Cancel")), /* @__PURE__ */ React.createElement(Progress, { value: p, label }), /* @__PURE__ */ React.createElement("span", { className: "row between t-footnote subtle" }, /* @__PURE__ */ React.createElement("span", { className: "tnum" }, mb, " of ", total), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, Math.round(p * 100), "%")));
  }
  function Setup68({ me }) {
    const app = useApp();
    const o = X.OPT();
    const [p, setP] = useState(0.64);
    useEffect(() => {
      if (SHOT) return;
      let raf = 0;
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(0.98, 0.2 + (now - t0) / 12e3);
        setP(k);
        if (k < 0.98) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, []);
    const steps = [["Upload", "now"], ["Map columns", "Data Agent"], ["Load into BigQuery", "then the Watcher starts"]];
    const chips = D.SKUS.chips;
    const wo = D.PLAN.writeOff;
    return /* @__PURE__ */ React.createElement(X.Screen68, { me, title: "Setup", sub: "Connect the stock data once and set the rules the agents must obey" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug x68-upload" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "file-spreadsheet", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, "dms_export_2026-10-01.csv"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Bizom-style DMS export \xB7 4.8 MB"))), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm" }, "Cancel")), /* @__PURE__ */ React.createElement(Progress, { value: p, label: "Uploading the DMS export" }), /* @__PURE__ */ React.createElement("span", { className: "row between t-footnote subtle" }, /* @__PURE__ */ React.createElement("span", { className: "tnum" }, "Uploading \xB7 ", (4.8 * p).toFixed(1), " of 4.8 MB"), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, Math.round(p * 100), "%")), /* @__PURE__ */ React.createElement("ol", { className: "x68-mini", "aria-label": "What happens to the file" }, steps.map(([t, sub], i) => /* @__PURE__ */ React.createElement("li", { key: t, className: i === 0 ? "now" : "" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("b", null, t), /* @__PURE__ */ React.createElement("span", null, sub)))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "You can keep setting the rules below while it uploads. The column mapping appears here when the Data Agent has read the file.")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 20, gridTemplateColumns: app.bp === "desktop" ? "repeat(2, minmax(0,1fr))" : "minmax(0,1fr)", alignItems: "start" } }, /* @__PURE__ */ React.createElement(List, { head: "Floor price by category", foot: "No channel may sell below its category's floor." }, [["Snacks", 35, "chips"], ["Biscuits", 35, "biscuits"], ["Staples", 40, "poha"], ["Beverages", 30, "mango"], ["Personal care", 40, "facewash"]].map(([l, f, sku]) => /* @__PURE__ */ React.createElement(ListRow, { key: l, title: l, sub: `${fmt.inr2(D.SKUS[sku].mrp * f / 100)} on a \u20B9${D.SKUS[sku].mrp} pack`, value: /* @__PURE__ */ React.createElement(Stepper, { value: f, onChange: () => {
    }, min: 20, max: 70, step: 5, label: "Floor for " + l, format: (x) => x + "%" }) }))), /* @__PURE__ */ React.createElement(List, { head: "Territory guard", foot: "ExpireSoon listings are hidden from buyers inside these territories, matched by pincode." }, Object.values(D.DISTRIBUTORS).map((d) => /* @__PURE__ */ React.createElement(ListRow, { key: d.id, icon: "map-pin", iconTone: "gray", title: d.territory, sub: `${d.name} \xB7 pincodes ${d.pins}\u2026` })), /* @__PURE__ */ React.createElement(ListRow, { title: "Hide listings inside the territories", value: /* @__PURE__ */ React.createElement(Switch, { checked: true, onChange: () => {
    }, label: "Territory guard" }) }))), /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "The true cost of a write-off"), /* @__PURE__ */ React.createElement(Badge, { tone: "red", icon: "trash-2" }, "shown before any batch is routed")), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "For Masala Chips 150 g: destroying costs ", fmt.inr2(-wo.perUnit), " a unit (cost \u20B9", chips.cost, ", GST credit reversed, disposal and EPR)."))));
  }
  function DistQuiet68({ me }) {
    const app = useApp();
    const s = S.useStore();
    const dist = S.distOf(me);
    const mine = D.BATCHES.filter((b) => b.distributor === dist.id && !b.hero).map((b) => D.batchView(b));
    return /* @__PURE__ */ React.createElement(X.Screen68, { me, title: "Today", sub: `${dist.name} \xB7 ${dist.godown}, ${dist.city}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile", style: { width: 40, height: 40, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: "handshake", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, "Smart-Clearance acts for you"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Listings, scheme offers, invoice drafts and dispatch slots in Rakesh Traders' name, inside Munchly's floors. Given Thu 1 Oct, 16:52.")), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "pause" }, "Pause")), /* @__PURE__ */ React.createElement(Card, { className: "x68-quiet" }, /* @__PURE__ */ React.createElement("div", { className: "x68-quiet-in" }, /* @__PURE__ */ React.createElement(Product, { name: "godown", size: app.bp === "phone" ? 92 : 112, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("div", { className: "t-title3" }, "Nothing for you today"), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, "No photo requests, scheme orders or marketplace lots. The Watcher checks your stock every morning at 09:00; when it needs you, it sends a push."), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { marginTop: 6 } }, /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "Masala Chips cleared"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "credit note ", fmt.inr(D.SUPPORT.total), " from Munchly \xB7 you ended whole"))))), /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "From your nightly DMS export" }, "Your stock"), /* @__PURE__ */ React.createElement("div", { className: "list" }, mine.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, compact: app.bp === "phone", onOpen: () => {
    } })))));
  }
  const WRONG = "That email and password don't match. Check both, or ask whoever invited you to reset your password.";
  function SignInButton({ phase, name }) {
    const reduce = useReducedMotion();
    const busy = phase === "busy", done = phase === "done", err = phase === "error";
    const label = done ? `Welcome, ${name}` : busy ? "Signing in\u2026" : "Sign in";
    return /* @__PURE__ */ React.createElement(
      motion.button,
      {
        type: "submit",
        className: cx("btn btn-primary btn-lg btn-block x68-si-btn", (busy || done) && "on"),
        "aria-disabled": busy || done || void 0,
        animate: err && !reduce ? { x: [0, -8, 8, -5, 5, -2, 0] } : { x: 0 },
        transition: { duration: 0.36, ease: "easeOut" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "x68-si-ic", "aria-hidden": "true" }, done ? /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement(motion.path, { d: "M5 12.5l4.5 4.5L19 7.5", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", initial: { pathLength: reduce || SHOT ? 1 : 0 }, animate: { pathLength: 1 }, transition: { duration: 0.28, ease: EASE } })) : busy ? /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "12 12 40 40" }, /* @__PURE__ */ React.createElement("circle", { cx: "43.5", cy: "19", r: "4", fill: "currentColor" }), /* @__PURE__ */ React.createElement(motion.path, { d: S_PATH, fill: "none", stroke: "currentColor", strokeWidth: "5", strokeLinecap: "round", strokeLinejoin: "round", initial: { pathLength: reduce || SHOT ? 0.62 : 0 }, animate: { pathLength: SHOT ? 0.62 : 1 }, transition: { duration: reduce ? 0 : 1.1, ease: [0.65, 0, 0.35, 1] } })) : /* @__PURE__ */ React.createElement(Icon, { name: "log-in", size: 18 })),
      /* @__PURE__ */ React.createElement("span", { className: "x68-si-lbl" }, /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, /* @__PURE__ */ React.createElement(motion.span, { key: label, initial: reduce ? false : { y: 12, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -12, opacity: 0 }, transition: { duration: 0.24, ease: EASE } }, label))),
      (busy || done) && /* @__PURE__ */ React.createElement(motion.i, { className: "x68-si-prog", "aria-hidden": "true", initial: { scaleX: reduce || SHOT ? 0.6 : 0 }, animate: { scaleX: done ? 1 : SHOT ? 0.6 : 0.9 }, transition: { duration: reduce ? 0 : done ? 0.16 : 1.1, ease: done ? EASE : [0.3, 0.7, 0.4, 1] } }),
      /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, busy ? "Signing in" : done ? `Signed in. Welcome, ${name}.` : "")
    );
  }
  const NEHA = { name: "Neha Kulkarni", email: "neha.kulkarni@smartclearance.example", initials: "NK" };
  function SignIn68({ onSignIn }) {
    const app = useApp();
    const scn = useScn();
    const o = X.OPT();
    const [email, setEmail] = useState(scn.si === "notmember" ? NEHA.email : "priya.deshmukh@munchly.example");
    const [pw, setPw] = useState(scn.si === "wrong" ? "" : "default-pass-1");
    const [show, setShow] = useState(false);
    const [err, setErr] = useState(scn.si === "wrong" ? WRONG : "");
    const [phase, setPhase] = useState(scn.si === "busy" ? "busy" : "idle");
    const [nm, setNm] = useState(scn.si === "notmember");
    const reduce = useReducedMotion();
    const submit = (e) => {
      e.preventDefault();
      setErr("");
      const known = /^(priya\.deshmukh@munchly\.example|rakesh\.traders@google\.example)$/i.test(email.trim());
      if (/smartclearance\.example$/i.test(email.trim()) && pw) {
        setPhase("busy");
        setTimeout(() => {
          setPhase("idle");
          setNm(true);
        }, 1100);
        return;
      }
      if (!known || !pw) {
        setPhase("error");
        setTimeout(() => {
          setPhase("idle");
          setErr(WRONG);
          setPw("");
        }, reduce ? 0 : 360);
        return;
      }
      setPhase("busy");
      setTimeout(() => {
        setPhase("done");
        setTimeout(() => {
          setPhase("idle");
          onSignIn(/rakesh/i.test(email) ? "rakesh" : "priya");
        }, 720);
      }, 1100);
    };
    const edit = (set) => (ev) => {
      set(ev.target.value);
      setErr("");
    };
    const form = nm ? /* @__PURE__ */ React.createElement(NotMember, { onOther: () => {
      setNm(false);
      setEmail("");
      setPw("");
    } }) : /* @__PURE__ */ React.createElement("form", { className: "si-form", noValidate: true, onSubmit: submit }, /* @__PURE__ */ React.createElement(Field, { label: "Email", htmlFor: "si-email" }, /* @__PURE__ */ React.createElement(Input, { id: "si-email", icon: "mail", type: "email", value: email, onChange: edit(setEmail), autoComplete: "username", spellCheck: false, autoCapitalize: "none", placeholder: "name@munchly.example" })), /* @__PURE__ */ React.createElement(Field, { label: "Password", htmlFor: "si-pw" }, /* @__PURE__ */ React.createElement("span", { className: "input-wrap x68-si-pw" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 17 }), /* @__PURE__ */ React.createElement("input", { id: "si-pw", className: "input", type: show ? "text" : "password", value: pw, onChange: edit(setPw), autoComplete: "current-password", "aria-invalid": err ? "true" : void 0, "aria-describedby": err ? "si-err" : void 0 }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "x68-si-eye", "aria-label": show ? "Hide password" : "Show password", "aria-pressed": show, onClick: () => setShow(!show) }, /* @__PURE__ */ React.createElement(Icon, { name: show ? "eye-off" : "eye", size: 20 })))), err && /* @__PURE__ */ React.createElement("div", { className: "x68-si-error", id: "si-err", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 18 }), /* @__PURE__ */ React.createElement("span", null, err)), /* @__PURE__ */ React.createElement(SignInButton, { phase, name: "Priya" }), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted x68-si-hint" }, "First time here? Whoever invited you gives you your first password. Nothing is sent by email."));
    return /* @__PURE__ */ React.createElement("div", { className: "signin" }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" }), app.bp === "desktop" && /* @__PURE__ */ React.createElement(S.HeroStage, null), /* @__PURE__ */ React.createElement("div", { className: "si-panel" }, /* @__PURE__ */ React.createElement("div", { className: "si-card" }, /* @__PURE__ */ React.createElement("div", { className: "si-ws" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: app.bp === "phone" ? 52 : 60 }), /* @__PURE__ */ React.createElement("div", { className: "si-ws-name" }, WS.name), /* @__PURE__ */ React.createElement("span", { className: "si-url" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 12, stroke: 2.2 }), WS.domain)), app.bp !== "desktop" && !nm && /* @__PURE__ */ React.createElement("div", { className: "si-hero", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: "carton-hero", size: app.bp === "phone" ? 120 : 150, float: true })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("h1", { className: "si-title" }, nm ? "Not a member here" : "Sign in"), !nm && /* @__PURE__ */ React.createElement("p", { className: "si-sub" }, "Use the email address you were invited with, and your password.")), form, /* @__PURE__ */ React.createElement("div", { className: "si-foot" }, /* @__PURE__ */ React.createElement(PoweredBy, null), /* @__PURE__ */ React.createElement("span", { className: "si-foot-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm" }, "Not your workspace? Find yours")), /* @__PURE__ */ React.createElement("span", { className: "si-note" }, "Prototype \xB7 every company, person and number is fictional")))));
  }
  function NotMember({ onOther }) {
    const o = X.OPT();
    return /* @__PURE__ */ React.createElement("div", { className: "si-form", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "x68-acct" }, /* @__PURE__ */ React.createElement("span", { className: "x68-av", "aria-hidden": "true" }, NEHA.initials), /* @__PURE__ */ React.createElement("span", { className: "x68-acct-who" }, /* @__PURE__ */ React.createElement("span", { className: "x68-acct-k" }, "Signed in as"), /* @__PURE__ */ React.createElement("b", null, NEHA.name), /* @__PURE__ */ React.createElement("span", null, NEHA.email))), /* @__PURE__ */ React.createElement("div", { className: "x68-note", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 18 }), /* @__PURE__ */ React.createElement("span", null, "This account isn't a member of ", /* @__PURE__ */ React.createElement("b", null, WS.name, "' workspace"), ". Ask Munchly's workspace admin to invite you, or open a workspace you belong to.")), o.NotMemberExtra && /* @__PURE__ */ React.createElement(o.NotMemberExtra, null), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", block: true, icon: "log-out", onClick: onOther }, "Sign in with another account"), !o.NotMemberExtra && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm", style: { justifySelf: "center" } }, "Find your workspace"));
  }
  function screenFor68(me, name) {
    switch (name) {
      case "command":
        return /* @__PURE__ */ React.createElement(CommandCenter68, { me });
      case "route":
        return /* @__PURE__ */ React.createElement(RouteRoom68, { me });
      case "photo":
        return /* @__PURE__ */ React.createElement(Camera68, { me });
      case "setup":
        return /* @__PURE__ */ React.createElement(Setup68, { me });
      case "home":
        return me.role === "distributor" && SCN.quiet ? /* @__PURE__ */ React.createElement(DistQuiet68, { me }) : S.screenFor(me, name, {});
      default:
        return S.screenFor(me, name, {});
    }
  }
  function RoleApp68({ me, route, onGo, onBack }) {
    const reduce = useReducedMotion();
    const top = useRef(null);
    const [wsOpen, setWsOpen] = useState(false);
    const o = X.OPT();
    const scn = useScn();
    const app = useApp();
    const name = route && route.name ? route.name : S.HOME[me.role];
    const allowed = S.routesFor(me.role);
    const safe = allowed.includes(name) ? name : S.HOME[me.role];
    const nav = S.NAV[me.role];
    const W = D.WORKSPACE;
    React.useLayoutEffect(() => {
      const el = top.current;
      const sc = el && el.closest(".scroll");
      if (sc) sc.scrollTop = 0;
    }, [safe, route && route.params && route.params.ref]);
    const display = Object.assign({}, me, { role: S.ROLES[me.role] });
    const ws = { name: W.name, domain: W.domain, open: () => setWsOpen(true) };
    const [stepDone, setStepDone] = useState(false);
    const step = o.Step && scn.push && !stepDone ? o.Step : null;
    const body = /* @__PURE__ */ React.createElement(Shell, { nav, current: safe, onNav: (id) => onGo({ name: id, params: {}, replace: true }), user: display, onUser: () => onGo({ name: "profile" }), ws: W, onWorkspace: () => setWsOpen(true), footer: o.ShellFoot ? /* @__PURE__ */ React.createElement(o.ShellFoot, { me }) : null }, step ? /* @__PURE__ */ React.createElement(o.Step, { me, onDone: () => setStepDone(true) }) : /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait", initial: false }, /* @__PURE__ */ React.createElement(motion.div, { key: safe + (route.params && route.params.ref || ""), ref: top, initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: reduce ? void 0 : { opacity: 0 }, transition: { duration: 0.18, ease: EASE } }, screenFor68(me, safe))));
    return /* @__PURE__ */ React.createElement(S.Router, { route: { name: safe, params: route && route.params }, onGo: (r) => onGo(r), onBack }, /* @__PURE__ */ React.createElement(S.WorkspaceCtx.Provider, { value: ws }, body, o.Dock && !step && /* @__PURE__ */ React.createElement(K.Portal, null, /* @__PURE__ */ React.createElement(o.Dock, { me, route: safe })), /* @__PURE__ */ React.createElement(S.WorkspaceSheet, { open: wsOpen, onClose: () => setWsOpen(false), me, onSettings: null })));
  }
  const parseHash = () => {
    const m = /^#\/([a-z-]+)(?:\/([A-Z0-9-]+))?/.exec(location.hash || "");
    return m ? { name: m[1], params: m[2] ? { ref: m[2] } : {} } : null;
  };
  function App68() {
    const scn = SCN;
    const o = X.OPT();
    const app = useApp();
    const [who, setWho] = useState(scn.who || null);
    const [route, setRoute] = useState(() => parseHash() || { name: scn.route || "command", params: scn.ref ? { ref: scn.ref } : {} });
    const [conn, setConn] = useState(scn.conn);
    const [load, setLoad] = useState(!!scn.load);
    const clock = useClock(Object.assign({}, DAY, scn.clock || {}));
    useMemo(() => {
      Flow.fastForward(scn.stage || 0);
      if (scn.photo) Store.update((st) => {
        Flow.A.requestPhoto(st);
      });
    }, []);
    useEffect(() => {
      const f = () => {
        const r = parseHash();
        if (r) setRoute(r);
      };
      window.addEventListener("hashchange", f);
      return () => window.removeEventListener("hashchange", f);
    }, []);
    useEffect(() => {
      if (SHOT || !load) return;
      const t = setTimeout(() => {
        setLoad(false);
        setConn("live");
      }, 2600);
      return () => clearTimeout(t);
    }, [load]);
    const go = useCallback((r) => {
      const h = "#/" + r.name + (r.params && r.params.ref ? "/" + r.params.ref : "");
      history[r.replace ? "replaceState" : "pushState"](null, "", location.pathname + location.search + h);
      setRoute({ name: r.name, params: r.params || {} });
    }, []);
    const me = who && Store.get().users.find((u) => u.id === who);
    const live = useMemo(() => ({ conn, since: scn.since, clock, setConn }), [conn, clock.time]);
    const [after, setAfter] = useState(null);
    const scnNow = useMemo(() => Object.assign({}, scn, after, { load, conn }), [load, conn, after]);
    const signIn = (id) => {
      Flow.fastForward(5);
      setAfter({ two: true, stage: 5 });
      setLoad(true);
      setConn("connecting");
      setWho(id);
      go({ name: S.HOME[Store.get().users.find((u) => u.id === id).role], replace: true });
    };
    return /* @__PURE__ */ React.createElement(ScnCtx.Provider, { value: scnNow }, /* @__PURE__ */ React.createElement(X.LiveCtx.Provider, { value: live }, /* @__PURE__ */ React.createElement(NoticeHost, { resetKey: who }, /* @__PURE__ */ React.createElement(Reconnector, null), !me ? /* @__PURE__ */ React.createElement(SignIn68, { onSignIn: signIn }) : /* @__PURE__ */ React.createElement(RoleApp68, { me, route, onGo: go, onBack: () => history.back() })), /* @__PURE__ */ React.createElement(AnimatePresence, null, me && load && o.Splash && /* @__PURE__ */ React.createElement(motion.div, { key: "splash", className: "x68-splash-wrap", exit: { opacity: 0, scale: 1.02 }, transition: { duration: 0.42, ease: EASE } }, /* @__PURE__ */ React.createElement(o.Splash, { me }))), !SHOT && /* @__PURE__ */ React.createElement(Review, null)));
  }
  function Reconnector() {
    const live = X.useLive();
    const { toast } = useNotice();
    const prev = useRef(live.conn);
    useEffect(() => {
      if (!SHOT && (prev.current === "reconnecting" || prev.current === "offline") && live.conn === "live") toast({ text: `Back live. Caught up from ${live.since}.`, tone: "ok", icon: "activity" });
      prev.current = live.conn;
    }, [live.conn]);
    useEffect(() => {
      if (SHOT || live.conn !== "reconnecting" && live.conn !== "offline") return;
      const t = setTimeout(() => live.setConn("live"), 5200);
      return () => clearTimeout(t);
    }, [live.conn]);
    return null;
  }
  function Review() {
    const [open, setOpen] = useState(false);
    const groups = Object.entries(STATES).reduce((t, [id, st]) => {
      (t[st.group] = t[st.group] || []).push([id, st]);
      return t;
    }, {});
    const link = (id) => {
      const p = new URLSearchParams(location.search);
      p.set("state", id);
      return location.pathname + "?" + p.toString();
    };
    return /* @__PURE__ */ React.createElement("div", { className: "x68-review" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "x68-review-btn", "aria-expanded": open, "aria-controls": "x68-review-list", onClick: () => setOpen(!open) }, /* @__PURE__ */ React.createElement(Icon, { name: open ? "x" : "list", size: 18 }), /* @__PURE__ */ React.createElement("span", null, STATES[STATE].label)), open && /* @__PURE__ */ React.createElement("nav", { id: "x68-review-list", className: "x68-review-list", "aria-label": "Mockup states" }, Object.entries(groups).map(([g, list]) => /* @__PURE__ */ React.createElement("div", { key: g }, /* @__PURE__ */ React.createElement("b", null, g), list.map(([id, st]) => /* @__PURE__ */ React.createElement("a", { key: id, href: link(id), "aria-current": id === STATE ? "page" : void 0 }, st.label))))));
  }
  window.SC68 = Object.assign(window.SC68, { SHOT, STATES, SCN, useScn, flaggedItems, itemFor, FlagRow, Segs, PushContent, CCSkeleton, TrackerCard68, trackerFor, UploadLine, NEHA, WS, EASE, S_PATH });
  document.addEventListener("DOMContentLoaded", () => {
    if (window.SC68_OPT && window.SC68_OPT.init) window.SC68_OPT.init();
    ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "app-root", style: { position: "fixed", inset: 0 } }, /* @__PURE__ */ React.createElement(App68, null))));
  });
})();

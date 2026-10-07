(function() {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS, X = window.SC68, M = window.SC3_MONEY;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Badge, Button, Card, Product, Mark, WorkspaceMark, useApp } = K;
  const WS = D.WORKSPACE;
  function HeaderLine() {
    const live = X.useLive();
    const off = live.conn !== "live";
    return /* @__PURE__ */ React.createElement("span", { className: cx("x68-liveline", off && "off") }, /* @__PURE__ */ React.createElement(X.ConnMark, { conn: live.conn }), /* @__PURE__ */ React.createElement("span", { className: "x68-ll-st" }, live.conn === "live" ? "Live" : live.conn === "connecting" ? "Catching up" : live.conn === "offline" ? "Offline" : "Reconnecting"), /* @__PURE__ */ React.createElement("span", { className: "x68-sep", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement(X.ClockTime, { clock: live.clock }), /* @__PURE__ */ React.createElement(X.Cue, { perDay: live.clock.perDay }));
  }
  function BarSub() {
    const live = X.useLive();
    return /* @__PURE__ */ React.createElement("span", { className: "x68-barsub" }, /* @__PURE__ */ React.createElement(X.ConnMark, { conn: live.conn, size: 6 }), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, live.clock.time), /* @__PURE__ */ React.createElement(X.Cue, { perDay: live.clock.perDay, short: true }));
  }
  function PageTop() {
    const live = X.useLive();
    if (live.conn !== "reconnecting" && live.conn !== "offline") return null;
    const off = live.conn === "offline";
    return /* @__PURE__ */ React.createElement("div", { className: "x68-band", role: "status" }, /* @__PURE__ */ React.createElement(X.ConnMark, { conn: live.conn }), /* @__PURE__ */ React.createElement("span", { className: "x68-band-t" }, /* @__PURE__ */ React.createElement("b", null, off ? "You're offline." : "Reconnecting\u2026"), " ", off ? `Showing what was here at ${live.since}. Approving and sending wait for a connection.` : `Updates paused at ${live.since}, so what you see may be behind. Anything you do still goes through.`), off && /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", icon: "refresh-cw" }, "Try again"));
  }
  function BatchTabs({ items, current, onPick, asTabs, label }) {
    return /* @__PURE__ */ React.createElement("div", { className: "x68-tabs", role: asTabs ? "tablist" : void 0, "aria-label": label }, items.map((it) => {
      const on = it.ref === current;
      const sku = it.view.skuObj;
      return /* @__PURE__ */ React.createElement("button", { key: it.ref, type: "button", id: "tab-" + it.ref, role: asTabs ? "tab" : void 0, "aria-selected": asTabs ? on : void 0, "aria-controls": asTabs ? "panel-flagged" : void 0, "aria-current": !asTabs && on ? "page" : void 0, className: cx("x68-tab", on && "on"), onClick: () => onPick(it.ref) }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 30, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "x68-tab-t" }, /* @__PURE__ */ React.createElement("b", null, sku.name), /* @__PURE__ */ React.createElement("span", { className: "mono" }, it.ref)), /* @__PURE__ */ React.createElement("span", { className: cx("x68-tab-stop", it.human && "human") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), it.stop));
    }));
  }
  function Flagged({ items, phone, go, dim, offline, trackerFor }) {
    const [cur, setCur] = useState(items[0].ref);
    const item = items.find((i) => i.ref === cur) || items[0];
    if (items.length < 2) return trackerFor(item, { phone, go, dim, offline });
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap x68-qhead" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "Flagged this morning"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, items.length, " batches \xB7 one needs your yes")), /* @__PURE__ */ React.createElement(BatchTabs, { items, current: cur, onPick: setCur, asTabs: true, label: "Batches flagged this morning" }), /* @__PURE__ */ React.createElement("div", { role: "tabpanel", id: "panel-flagged", "aria-labelledby": "tab-" + item.ref }, trackerFor(item, { phone, go, dim, offline })));
  }
  function Switcher({ items, current }) {
    const { go } = S.useRoute();
    return /* @__PURE__ */ React.createElement("div", { className: "x68-switch-tabs" }, /* @__PURE__ */ React.createElement(BatchTabs, { items, current, onPick: (ref) => go("route", { ref }), label: "Batches flagged this morning" }));
  }
  function MarkDraw({ size = 96, p }) {
    return /* @__PURE__ */ React.createElement("svg", { className: "mark", width: size, height: size, viewBox: "0 0 64 64", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "x68g", x1: "8", y1: "4", x2: "58", y2: "62", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#2fbf7f" }), /* @__PURE__ */ React.createElement("stop", { offset: "0.55", stopColor: "#178258" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#0d5a3e" }))), /* @__PURE__ */ React.createElement("path", { d: "M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z", fill: "url(#x68g)" }), /* @__PURE__ */ React.createElement("path", { d: X.S_PATH, fill: "none", stroke: "rgb(255 255 255 / 0.22)", strokeWidth: "6", strokeLinecap: "round", strokeLinejoin: "round" }), /* @__PURE__ */ React.createElement(motion.path, { d: X.S_PATH, fill: "none", stroke: "#fff", strokeWidth: "6", strokeLinecap: "round", strokeLinejoin: "round", initial: false, animate: { pathLength: p }, transition: { duration: 0.42, ease: X.EASE } }), /* @__PURE__ */ React.createElement("circle", { cx: "43.5", cy: "19", r: "3.4", fill: "#0d5a3e", stroke: "#fff", strokeWidth: "2.6" }), p >= 1 && /* @__PURE__ */ React.createElement("circle", { cx: "20.5", cy: "47", r: "5.2", fill: "#f7c04a", stroke: "#fff", strokeWidth: "2.2" }));
  }
  const READS = [["Signed in", "0.4 s"], [`${WS.name}' workspace`, "0.3 s"], ["This morning's batches", "0.9 s"], ["Live updates", "0.5 s"]];
  function Splash({ me }) {
    const reduce = useReducedMotion();
    const app = useApp();
    const [n, setN] = useState(X.SHOT ? 3 : 1);
    useEffect(() => {
      if (X.SHOT || n >= 4) return;
      const t = setTimeout(() => setN(n + 1), reduce ? 0 : 620);
      return () => clearTimeout(t);
    }, [n]);
    const hour = Number(X.useLive().clock.time.slice(0, 2));
    const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    return /* @__PURE__ */ React.createElement("div", { className: "x68-splash", "aria-hidden": false }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "x68-sp-in" }, /* @__PURE__ */ React.createElement(MarkDraw, { size: app.bp === "phone" ? 84 : 104, p: n / 4 }), /* @__PURE__ */ React.createElement("span", { className: "x68-sp-ws" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 22 }), /* @__PURE__ */ React.createElement("span", null, WS.name)), /* @__PURE__ */ React.createElement("h2", { className: "x68-sp-title" }, greet, ", ", me.short || me.name), /* @__PURE__ */ React.createElement("ol", { className: "x68-sp-stops" }, READS.map(([t, time], i) => /* @__PURE__ */ React.createElement("li", { key: t, className: i < n ? "done" : i === n ? "now" : "" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("b", null, t), /* @__PURE__ */ React.createElement("span", { className: "mono" }, i < n ? time : i === n ? "\u2026" : ""))))), /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, "Signed in. Opening ", WS.name, "' workspace for ", me.short || me.name, "."));
  }
  function PushPreview({ blocked }) {
    const p = D.PUSH.plan;
    return /* @__PURE__ */ React.createElement("div", { className: cx("x68-pp", blocked && "blocked"), "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "x68-pp-time tnum" }, "09:23"), /* @__PURE__ */ React.createElement("span", { className: "x68-pp-date" }, "Friday 2 October"), /* @__PURE__ */ React.createElement("div", { className: "x68-pp-note" }, /* @__PURE__ */ React.createElement("span", { className: "x68-pp-head" }, /* @__PURE__ */ React.createElement(Mark, { size: 20, still: true }), /* @__PURE__ */ React.createElement("span", null, "Smart-Clearance"), /* @__PURE__ */ React.createElement("span", { className: "x68-pp-now" }, "now")), /* @__PURE__ */ React.createElement("b", null, p.title), /* @__PURE__ */ React.createElement("span", null, "Net ", fmt.inr(D.PLAN.net), ", ", fmt.inr(D.PLAN.swing), " better than write-off. Tap to review and approve.")), blocked && /* @__PURE__ */ React.createElement("span", { className: "x68-pp-block" }, /* @__PURE__ */ React.createElement(Icon, { name: "bell-off", size: 16 }), "Blocked in this browser"));
  }
  function InstallArt() {
    return /* @__PURE__ */ React.createElement("div", { className: "x68-ia", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "x68-ia-bar" }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 18 }), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18 }), /* @__PURE__ */ React.createElement("span", { className: "x68-ia-share" }, /* @__PURE__ */ React.createElement(Icon, { name: "share-ios", size: 18 })), /* @__PURE__ */ React.createElement(Icon, { name: "book-open", size: 18 }), /* @__PURE__ */ React.createElement(Icon, { name: "copy", size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "x68-ia-sheet" }, /* @__PURE__ */ React.createElement("span", { className: "x68-ia-row" }, /* @__PURE__ */ React.createElement("span", null, "Copy"), /* @__PURE__ */ React.createElement(Icon, { name: "copy", size: 18 })), /* @__PURE__ */ React.createElement("span", { className: "x68-ia-row on" }, /* @__PURE__ */ React.createElement("span", null, "Add to Home Screen"), /* @__PURE__ */ React.createElement(Icon, { name: "square-plus", size: 18 })), /* @__PURE__ */ React.createElement("span", { className: "x68-ia-row" }, /* @__PURE__ */ React.createElement("span", null, "Add Bookmark"), /* @__PURE__ */ React.createElement(Icon, { name: "book-open", size: 18 }))));
  }
  function Step({ me, onDone }) {
    const scn = X.useScn();
    const v = scn.push;
    const app = useApp();
    const { toast } = K.useNotice();
    const allow = () => {
      toast({ text: "Notifications are on. The 09:00 push reaches this device.", tone: "ok", icon: "bell" });
      onDone();
    };
    const T = {
      ask: ["Get the morning push", "When the Watcher flags a batch at 09:00 journey time, the plan reaches your lock screen with the money on it, and one tap opens it here."],
      install: ["Add the app to your Home Screen", "On iPhone, Safari sends notifications only to web apps opened from the Home Screen. Three taps, then open Clearance from there."],
      denied: ["Notifications are blocked", `Your browser blocks notifications from ${WS.domain}. Everything still reaches your inbox while they are off.`]
    }[v];
    const steps = v === "install" ? [["Tap", "Share", "in Safari's toolbar"], ["Choose", "Add to Home Screen", ""], ["Open", "Clearance", "from your Home Screen"]] : v === "denied" ? app.bp === "phone" ? [["In Chrome, open the menu (the three dots), then", "Settings", ""], ["Open", "Site settings", "and then Notifications"], ["Find", WS.domain, "and choose Allow"]] : [["Click", "the site settings icon", "at the left of the address bar"], ["Set", "Notifications", "to Allow"], ["Reload", "the page", ""]] : null;
    return /* @__PURE__ */ React.createElement(X.Screen68, { me, title: T[0], hideLarge: true }, /* @__PURE__ */ React.createElement("div", { className: "x68-step" }, /* @__PURE__ */ React.createElement("div", { className: "x68-step-art" }, v === "install" ? /* @__PURE__ */ React.createElement(InstallArt, null) : /* @__PURE__ */ React.createElement(PushPreview, { blocked: v === "denied" })), /* @__PURE__ */ React.createElement("div", { className: "x68-step-copy" }, /* @__PURE__ */ React.createElement("h1", { className: "x68-step-t" }, T[0]), /* @__PURE__ */ React.createElement("p", { className: "x68-step-p" }, T[1]), steps && /* @__PURE__ */ React.createElement("ol", { className: "x68-steps" }, steps.map(([a, b, c], i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement("span", { className: "x68-stepn" }, i + 1), /* @__PURE__ */ React.createElement("span", null, a, " ", /* @__PURE__ */ React.createElement("b", null, b), " ", c)))), /* @__PURE__ */ React.createElement("div", { className: "x68-step-acts" }, v === "ask" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "bell", onClick: allow }, "Turn on notifications"), v === "denied" && /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", icon: "refresh-cw" }, "Check again"), /* @__PURE__ */ React.createElement(Button, { variant: v === "ask" ? "ghost" : "primary", size: "lg", iconRight: "arrow-right", onClick: onDone }, v === "ask" ? "Not now" : "Continue to the Command Center")), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "You can change this in Profile at any time."))));
  }
  function NotMemberExtra() {
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle strong", style: { textAlign: "left" } }, "Where this account signs in"), /* @__PURE__ */ React.createElement("div", { className: "card row x68-where" }, /* @__PURE__ */ React.createElement(Mark, { size: 34, still: true }), /* @__PURE__ */ React.createElement("span", { className: "stack tight grow", style: { gap: 1, minWidth: 0, textAlign: "left" } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "Smart-Clearance console"), /* @__PURE__ */ React.createElement("span", { className: "mono t-caption subtle" }, "console.smartclearance.com")), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", iconRight: "external-link" }, "Open")));
  }
  function UploadUnderPhoto({ p }) {
    const pct = Math.round(p * 100);
    const label = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { name: "send", size: 18 }), "Sending \xB7 ", pct, "%");
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "x68-fill", role: "progressbar", "aria-label": "Sending the photo", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct }, /* @__PURE__ */ React.createElement("span", { className: "x68-fill-off" }, label), /* @__PURE__ */ React.createElement("span", { className: "x68-fill-on", style: { clipPath: `inset(0 ${100 - pct}% 0 0)` }, "aria-hidden": "true" }, label)), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", block: true }, "Cancel"));
  }
  window.SC68_OPT = {
    id: "b",
    name: "In the header, batch by batch",
    pushPlace: "step",
    firstLoad: "splash",
    HeaderLine,
    BarSub,
    PageTop,
    Flagged,
    Switcher,
    Splash,
    Step,
    NotMemberExtra,
    UploadUnderPhoto,
    init: () => {
      document.documentElement.dataset.opt = "b";
    }
  };
})();

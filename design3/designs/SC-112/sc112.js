(function() {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, Empty, Product, Money, AgentFeed, ClusterMap, TrackerCard, Mark, Wordmark, WorkspaceMark, Avatar, useApp } = K;
  const OrigRoleApp = S.RoleApp;
  const EASE = [0.22, 1, 0.36, 1];
  function journeys(s, live) {
    return S.Live.flaggedItems(s, live || { two: false }).map((it) => Object.assign({}, it, { sku: it.view.skuObj, dist: it.view.dist, days: it.view.daysLeft }));
  }
  const find = (items, ref) => items.find((i) => i.ref === ref) || items[0];
  const shortName = (sku) => sku.name.replace(/\s+\d+(\.\d+)?\s?(g|ml|kg|l)$/i, "");
  const at = (it) => it.current >= 0 ? it.current : 9;
  function stateOf(it, s) {
    if (it.hero) {
      const hm = S.heroModel(s);
      return { text: hm.eta, tone: hm.etaTone, live: !!hm.agentLive };
    }
    return { text: `Vision is waiting for ${it.dist.name}' label photo`, tone: "green", live: true };
  }
  const PARTS = [
    { id: "journey", label: "Journey", short: "Journey", icon: "radar", from: 1, to: 1, ahead: "" },
    { id: "route", label: "Route Room", short: "Route", icon: "route", from: 2, to: 5, ahead: "from Verify" },
    { id: "execution", label: "Execution", short: "Execution", icon: "activity", from: 6, to: 6, ahead: "starts on approval" },
    { id: "paperwork", label: "Paperwork", short: "Papers", icon: "file-text", from: 7, to: 7, ahead: "after the lines close" }
  ];
  const PART_IDS = PARTS.map((p) => p.id);
  const partAt = (it) => (PARTS.find((p) => p.id !== "journey" && at(it) >= p.from && at(it) <= p.to) || PARTS[0]).id;
  function partState(it, p) {
    const i = at(it);
    if (p.id === partAt(it) && p.id !== "journey") return { here: true, human: it.human, words: it.human ? "needs your yes" : "working now" };
    if (p.id === "journey") return { words: "" };
    if (i < p.from) return { ahead: true, words: p.ahead };
    return { done: true, words: "done" };
  }
  function NotYet({ me, title, icon, head, body }) {
    return /* @__PURE__ */ React.createElement(S.Screen, { me, title }, /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon, title: head, body })));
  }
  function PartBody({ me, it, part }) {
    if (part === "journey") return /* @__PURE__ */ React.createElement(JourneyView, { me, it });
    if (part === "route") return /* @__PURE__ */ React.createElement(S.RouteRoom, { me });
    if (part === "execution") return it.hero ? /* @__PURE__ */ React.createElement(S.Execution, { me }) : /* @__PURE__ */ React.createElement(NotYet, { me, title: "Execution", icon: "sparkles", head: "Nothing is executing yet", body: "Listing, outreach, negotiation and the food-bank booking start the moment the plan is approved." });
    if (part === "paperwork") return it.hero ? /* @__PURE__ */ React.createElement(S.Paperwork, { me }) : /* @__PURE__ */ React.createElement(NotYet, { me, title: "Paperwork", icon: "file-text", head: "The pack follows the last of its lines", body: `Munchly's price-support credit note, the ITC memo and the FSSAI checklist, drafted by the Paperwork agent once every line of ${it.ref}'s plan is done.` });
    if (part === "report") return /* @__PURE__ */ React.createElement(S.Report, { me });
    return null;
  }
  const MANGO_TIMES = () => ({ detect: D.PUSH.detect.at, verify: D.PUSH.verify.at });
  function mangoFeed(v) {
    const gates = v.assess.gates.map((g) => `${g.app} ${g.has}/${g.need}`).join(" · ");
    return [
      { id: "m1", stage: "detect", agent: "Watcher", icon: "radar", at: D.PUSH.detect.at, min: 0, text: `${v.id} fails all three quick-commerce gates; ${fmt.num(v.assess.atRisk)} of ${fmt.num(v.units)} units will not sell by ${fmt.date(v.bestBefore).replace(/ \d{4}$/, "")}.`, calls: [["gates.check", gates, "bad"], ["sellthrough.project", `${v.sellPerDay}/day × ${v.assess.usableDays} days = ${fmt.num(v.assess.willSell)} of ${fmt.num(v.units)}`, ""], ["pubsub.publish", "batch.at_risk", "ok"]] },
      { id: "m2", stage: "verify", agent: "Vision", icon: "scan-line", at: D.PUSH.verify.at, min: 5, text: `Asked ${v.dist.name} for one label photo before quoting any price.`, calls: [["fcm.send", v.dist.name, "ok"]] }
    ];
  }
  function JourneyView({ me, it, head = true, title = "Journey", before, after }) {
    const s = S.useStore();
    const app = useApp();
    const { go } = S.useRoute();
    const hm = S.heroModel(s);
    const phone = app.bp === "phone";
    const h = s.hero;
    const SHOPS = D.KIRANAS.length;
    const routed = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    let card = null;
    if (head && it.hero) {
      const primary = h.phase === "planned" ? /* @__PURE__ */ React.createElement(Button, { variant: "approve", icon: "check", onClick: () => go("route", { ref: it.ref }) }, "Review and approve") : ["approved", "executing"].includes(h.phase) ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("execution", { ref: it.ref }) }, "Watch execution") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("route", { ref: it.ref }) }, "Open Route Room");
      const money = h.plan ? /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement(Money, { value: h.posted ? D.ACTUAL.net : D.PLAN.net, size: phone ? "s" : "m", roll: true, style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, h.posted ? "recovered, after the negotiation" : routed ? "on plan · settles day 3–7" : "net recovered on the plan", " · swing ", fmt.inr(h.posted ? D.ACTUAL.swing : D.PLAN.swing))) : void 0;
      card = /* @__PURE__ */ React.createElement(TrackerCard, { view: hm.view, done: hm.done, current: hm.current, eta: hm.eta, etaTone: hm.etaTone, agentLive: hm.agentLive, primary, money });
    } else if (head) card = /* @__PURE__ */ React.createElement(S.Live.MangoCard, { item: it, dim: false });
    const cluster = it.hero && /* @__PURE__ */ React.createElement(Card, { pad: false, className: "stack", style: { overflow: "hidden", gap: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-head", style: { padding: "14px 16px 10px" } }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, it.dist.city, " cluster"), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: hm.ordered ? "green" : void 0, dot: !!hm.ordered }, hm.ordered ? `${hm.ordered} of ${D.OFFERED} kiranas ordered` : h.offer ? `${D.OFFERED} kiranas messaged` : `${D.OFFERED} kiranas`)), /* @__PURE__ */ React.createElement(ClusterMap, { kiranas: D.KIRANAS, orderedCount: hm.ordered, route: routed, vanProgress: h.van.status === "done" ? 1 : hm.ordered / SHOPS * 0.6, height: phone ? 220 : 280 }));
    const events = it.hero ? s.feed : mangoFeed(it.view);
    const feed = /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Every hand-off on this batch, as it happens" }, "Agent activity"), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(AgentFeed, { events, people: D.PEOPLE, live: it.hero && hm.agentLive ? s.feed.length - 1 : -1, max: phone ? 4 : 8 })));
    return /* @__PURE__ */ React.createElement(S.Screen, { me, title, sub: `${it.ref} · ${it.sku.brand} ${it.sku.name} · ${it.dist.name}, ${it.dist.city}` }, /* @__PURE__ */ React.createElement(S.Columns, { sideWidth: 340, main: /* @__PURE__ */ React.createElement(React.Fragment, null, before, card, after, cluster, !it.hero && !head && /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "map", title: `${it.dist.city} cluster`, body: `The ${it.dist.city} kiranas appear here once the Router plans a kirana line for ${it.ref}.` }))), side: feed }));
  }
  function watched(items) {
    return D.BATCHES.filter((b) => !items.some((i) => i.ref === b.id)).map((b) => D.batchView(b)).sort((a, b) => a.daysLeft - b.daysLeft);
  }
  function WatchSheet({ view: v, onClose }) {
    const s = S.useStore();
    const next = !v ? "" : v.assess.status === "at-risk" ? `At risk: ${fmt.num(v.assess.atRisk)} packs will not sell before the last week. The Watcher checks every morning at ${s.rules.watchTime}, and flags it once Setup is confirmed and ${v.dist.name} has given ${D.PLATFORM.name} permission to act.` : v.assess.status === "gated" ? `Outside at least one quick-commerce gate, but real sell-through clears it in time. The Watcher checks again tomorrow at ${s.rules.watchTime}.` : "Inside every gate and selling through. Nothing to do.";
    return /* @__PURE__ */ React.createElement(K.Sheet, { open: !!v, onClose, title: v ? v.skuObj.name : "" }, v && /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Product, { name: v.skuObj.img, size: 88 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement(K.DaysNum, { days: v.daysLeft, life: v.skuObj.lifeDays, size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "days left · best before ", fmt.date(v.bestBefore)))), /* @__PURE__ */ React.createElement(K.GateChips, { gates: v.assess.gates }), /* @__PURE__ */ React.createElement(K.List, null, [["Batch", v.id], ["Distributor", `${v.dist.name}, ${v.dist.city}`], ["Units", fmt.num(v.units)], ["Sells", `${v.sellPerDay} a day`], ["Will sell before the last week", fmt.num(v.assess.willSell)], ["At risk", v.assess.atRisk ? fmt.num(v.assess.atRisk) : "none"]].map(([k, val]) => /* @__PURE__ */ React.createElement(K.ListRow, { key: k, title: k, value: val }))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted" }, next)));
  }
  function SbItem({ icon, label, on, onClick, count, children, className }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("sb-item", className), "aria-current": on ? "page" : void 0, onClick }, icon && /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 19 }), /* @__PURE__ */ React.createElement("span", null, label), count != null && /* @__PURE__ */ React.createElement("span", { className: "sb-n" }, count), children);
  }
  function SbBatch({ it, on, onClick }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "sb-item sb-batch", "aria-current": on ? "page" : void 0, onClick, "aria-label": `${it.sku.name}, ${it.ref}, at ${it.stop}${it.human ? ", needs your yes" : ""}` }, /* @__PURE__ */ React.createElement("span", { className: "sbb-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: it.sku.img, size: 24, alt: "" })), /* @__PURE__ */ React.createElement("span", { className: "sbb-name" }, shortName(it.sku)), /* @__PURE__ */ React.createElement("span", { className: cx("sbb-stop", it.human && "human"), "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", null), it.stop));
  }
  function DeskShell({ nav, current, onNav, menu, user, onUser, ws, onWorkspace, children }) {
    const app = useApp();
    if (app.bp !== "desktop" || !menu) return /* @__PURE__ */ React.createElement(K.Shell, { nav, current, onNav, user, onUser, ws, onWorkspace }, children);
    return /* @__PURE__ */ React.createElement("div", { className: "layer", style: { position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "var(--sidebar-w) minmax(0,1fr)" } }, /* @__PURE__ */ React.createElement("nav", { className: "sidebar sc112-side", "aria-label": "Main" }, /* @__PURE__ */ React.createElement("div", { className: "sb-brand" }, /* @__PURE__ */ React.createElement(Mark, { size: 32 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 18 })), ws && /* @__PURE__ */ React.createElement("button", { type: "button", className: "sb-ws", onClick: onWorkspace, "aria-label": `${ws.name} workspace, ${ws.domain}` }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws, size: 30 }), /* @__PURE__ */ React.createElement("span", { className: "who" }, /* @__PURE__ */ React.createElement("span", { className: "ws-name" }, /* @__PURE__ */ React.createElement("b", null, ws.name), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-down", size: 15, className: "subtle" })), /* @__PURE__ */ React.createElement("span", { className: "ws-dom" }, ws.domain))), /* @__PURE__ */ React.createElement("div", { className: "sc112-menu" }, menu), /* @__PURE__ */ React.createElement("div", { className: "sb-foot" }, user && /* @__PURE__ */ React.createElement("button", { type: "button", className: "sb-user", onClick: onUser, title: `${user.name} · ${user.role}` }, /* @__PURE__ */ React.createElement(Avatar, { person: user, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "who" }, /* @__PURE__ */ React.createElement("b", null, user.name), /* @__PURE__ */ React.createElement("span", null, user.role)), /* @__PURE__ */ React.createElement(Icon, { name: "ellipsis", size: 18, className: "subtle" })))), /* @__PURE__ */ React.createElement("div", { className: "scroll", style: { position: "relative", minWidth: 0 }, id: "main" }, children));
  }
  function Chrome({ me, route, onGo, onBack, nav, current, onNav, menu, screenKey, scrollKey, dir = 0, className, pushStep, children }) {
    const reduce = useReducedMotion();
    const top = useRef(null);
    const [wsOpen, setWsOpen] = useState(false);
    const W = D.WORKSPACE;
    const display = Object.assign({}, me, { role: S.ROLES[me.role] });
    React.useLayoutEffect(() => {
      const el = top.current;
      const sc = el && el.closest(".scroll");
      if (sc) sc.scrollTop = 0;
    }, [scrollKey || screenKey]);
    useEffect(() => setWsOpen(false), [me.id]);
    const ws = { name: W.name, domain: W.domain, open: () => setWsOpen(true) };
    const y = dir > 0 ? 22 : dir < 0 ? -22 : 6;
    const allowed = ["command", "batches", "setup", "report", "inbox", "profile"].concat(PART_IDS);
    const openNote = (n) => {
      window.SC3_STORE.update((st) => {
        const x = st.notifications.find((z) => z.id === n.id);
        if (x) x.read = true;
      });
      if (n.link && allowed.includes(n.link)) onGo({ name: n.link });
    };
    const home = (nav.find((n) => n.id === "command") || nav[0]).label;
    const body = /* @__PURE__ */ React.createElement(DeskShell, { nav, current, onNav, menu, user: display, onUser: () => onGo({ name: "profile" }), ws: W, onWorkspace: () => setWsOpen(true) }, pushStep ? /* @__PURE__ */ React.createElement(S.Live.PushStep, { me, home, ...pushStep }) : /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait", initial: false }, /* @__PURE__ */ React.createElement(motion.div, { key: screenKey, ref: top, className, initial: reduce ? false : { opacity: 0, y }, animate: { opacity: 1, y: 0 }, exit: reduce ? void 0 : { opacity: 0, y: -y / 2 }, transition: { duration: dir ? 0.26 : 0.18, ease: EASE } }, children)));
    return /* @__PURE__ */ React.createElement(S.Router, { route, onGo: (r) => onGo(r), onBack }, /* @__PURE__ */ React.createElement(S.WorkspaceCtx.Provider, { value: ws }, /* @__PURE__ */ React.createElement(S.PushBanners, { key: me.id, me, onOpen: openNote }), body, /* @__PURE__ */ React.createElement(S.WorkspaceSheet, { open: wsOpen, onClose: () => setWsOpen(false), me, onSettings: null })));
  }
  function useCameFrom(name, inBatch, labels) {
    const prev = useRef(name);
    const from = useRef("command");
    if (prev.current !== name) {
      if (inBatch && !inBatch(prev.current)) from.current = prev.current;
      prev.current = name;
    }
    return { id: from.current, label: labels[from.current] || "Command Center" };
  }
  const LABELS = { command: "Command Center", batches: "Batches", inbox: "Inbox", report: "Finance & ESG", setup: "Setup", profile: "Profile" };
  function roleApp(Operator) {
    return function RoleApp(props) {
      return props.me.role === "operator" ? /* @__PURE__ */ React.createElement(Operator, { ...props }) : /* @__PURE__ */ React.createElement(OrigRoleApp, { ...props });
    };
  }
  Object.assign(S.SC112, { EASE, journeys, find, shortName, at, stateOf, PARTS, PART_IDS, partAt, partState, PartBody, JourneyView, NotYet, watched, WatchSheet, SbItem, SbBatch, DeskShell, Chrome, useCameFrom, LABELS, roleApp, OrigRoleApp, MANGO_TIMES });
})();

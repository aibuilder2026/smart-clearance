(function() {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, Avatar, Badge, Button, Card, List, ListRow, Field, Input, Product, Mark, WorkspaceMark, PoweredBy, DaysNum, GateChips, Tracker, TrackerCompact, AgentFeed, Skeleton, TrackerCard, Money, BatchRow, useApp, useNotice } = K;
  const WS = D.WORKSPACE;
  const EASE = [0.22, 1, 0.36, 1];
  const S_PATH = "M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5";
  const useLive = () => S.useLive();
  const liveDomain = () => S.liveDomain ? S.liveDomain() : WS.emailDomain;
  const hours = (m) => Math.round(m / 6) / 10;
  const cue = (perDay) => perDay >= 1440 ? "" : perDay >= 60 ? `1 day = ${hours(perDay)} h` : `1 day = ${perDay} min`;
  const cueLong = (perDay) => perDay >= 1440 ? "The journey runs in real time." : `One journey day lasts ${perDay >= 60 ? hours(perDay) + " hours" : perDay + " minutes"} of real time.`;
  const down = (conn) => conn === "reconnecting" || conn === "offline";
  const stateWord = (conn) => conn === "connecting" ? "Catching up" : conn === "reconnecting" ? "Reconnecting" : conn === "offline" ? "Offline" : "Live";
  function ConnMark({ conn, size = 8 }) {
    const reduce = useReducedMotion();
    const was = useRef(conn);
    const [ping, setPing] = useState(0);
    useEffect(() => {
      if (was.current !== conn && conn === "live" && !reduce) setPing((p) => p + 1);
      was.current = conn;
    }, [conn]);
    if (conn === "reconnecting" || conn === "connecting") return /* @__PURE__ */ React.createElement("span", { className: "lv-conn lv-conn-spin", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "loader", size: size + 6, stroke: 2.4 }));
    if (conn === "offline") return /* @__PURE__ */ React.createElement("span", { className: "lv-conn", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "wifi-off", size: size + 6, stroke: 2.2 }));
    return /* @__PURE__ */ React.createElement("span", { className: "lv-conn", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", { className: "lv-dot", style: { width: size, height: size } }), ping > 0 && /* @__PURE__ */ React.createElement(motion.i, { key: ping, className: "lv-ping", style: { width: size, height: size }, initial: { scale: 1, opacity: 0.7 }, animate: { scale: 2.8, opacity: 0 }, transition: { duration: 0.9, repeat: 1, ease: "easeOut" } }));
  }
  function Cue({ perDay, short }) {
    const c = cue(perDay);
    if (!c) return null;
    return /* @__PURE__ */ React.createElement("span", { className: "lv-cue", title: cueLong(perDay) }, /* @__PURE__ */ React.createElement(Icon, { name: "fast-forward", size: 13, stroke: 2.2 }), short ? /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, c) : /* @__PURE__ */ React.createElement("span", null, c));
  }
  function Line() {
    const live = useLive();
    const c = live.clock;
    return /* @__PURE__ */ React.createElement("span", { className: cx("lv-line", live.conn !== "live" && "off") }, /* @__PURE__ */ React.createElement(ConnMark, { conn: live.conn }), /* @__PURE__ */ React.createElement("span", { className: "lv-st" }, stateWord(live.conn)), /* @__PURE__ */ React.createElement("span", { className: "lv-sep", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { className: "lv-time" }, /* @__PURE__ */ React.createElement("span", { className: "lv-date" }, c.date), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, c.time)), /* @__PURE__ */ React.createElement(Cue, { perDay: c.perDay }));
  }
  function BarSub() {
    const live = useLive();
    return /* @__PURE__ */ React.createElement("span", { className: "lv-barsub" }, /* @__PURE__ */ React.createElement(ConnMark, { conn: live.conn, size: 6 }), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, live.clock.time), /* @__PURE__ */ React.createElement(Cue, { perDay: live.clock.perDay, short: true }));
  }
  function Band() {
    const live = useLive();
    const f = live.failed && live.failed.action !== "approve" ? live.failed : null;
    if (f) return /* @__PURE__ */ React.createElement("div", { className: "lv-band lv-band-err", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 18 }), /* @__PURE__ */ React.createElement("span", { className: "lv-band-t" }, /* @__PURE__ */ React.createElement("b", null, "That didn't go through."), " ", f.message), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", icon: "refresh-cw", onClick: live.retry }, "Retry"), /* @__PURE__ */ React.createElement(K.IconButton, { icon: "x", label: "Dismiss", onClick: live.dismiss }));
    if (!down(live.conn)) return null;
    const off = live.conn === "offline";
    return /* @__PURE__ */ React.createElement("div", { className: "lv-band", role: "status" }, /* @__PURE__ */ React.createElement(ConnMark, { conn: live.conn }), /* @__PURE__ */ React.createElement("span", { className: "lv-band-t" }, /* @__PURE__ */ React.createElement("b", null, off ? "You're offline." : "Reconnecting…"), " ", off ? `Showing what was here at ${live.since}. Approving and sending wait for a connection.` : `Updates paused at ${live.since}, so what you see may be behind. Anything you do still goes through.`), off && /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", icon: "refresh-cw", onClick: live.reconnect }, "Try again"));
  }
  const Dim = ({ on, children }) => /* @__PURE__ */ React.createElement("div", { className: cx(on && "lv-dim") }, children);
  const MANGO = D.BATCHES.find((b) => b.second);
  function flaggedItems(s, live) {
    const hm = S.heroModel(s);
    const stage = D.STAGES[hm.current];
    const chips = { ref: D.BATCHES[0].id, hero: true, view: hm.view, done: hm.done, current: hm.current, stop: stage ? stage.title : "Cleared", human: !!(stage && stage.human) };
    if (!live || !live.two) return [chips];
    const v = D.batchView(MANGO);
    return [chips, { ref: MANGO.id, view: v, done: 2, current: 2, stop: D.STAGES[2].title, human: false }];
  }
  function BatchTabs({ items, current, onPick, asTabs, label }) {
    return /* @__PURE__ */ React.createElement("div", { className: "lv-tabs", role: asTabs ? "tablist" : void 0, "aria-label": label }, items.map((it) => {
      const on = it.ref === current;
      const sku = it.view.skuObj;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: it.ref,
          type: "button",
          id: "lv-tab-" + it.ref,
          role: asTabs ? "tab" : void 0,
          "aria-selected": asTabs ? on : void 0,
          "aria-controls": asTabs ? "lv-flagged" : void 0,
          "aria-current": !asTabs && on ? "page" : void 0,
          tabIndex: asTabs && !on ? -1 : void 0,
          className: cx("lv-tab", on && "on"),
          onClick: () => onPick(it.ref),
          onKeyDown: asTabs ? (e) => {
            const i = items.indexOf(it);
            const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -2;
            if (n === -2) return;
            e.preventDefault();
            const next = items[(n + items.length) % items.length];
            onPick(next.ref);
            const el = document.getElementById("lv-tab-" + next.ref);
            if (el) el.focus();
          } : void 0
        },
        /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 30, alt: "" }),
        /* @__PURE__ */ React.createElement("span", { className: "lv-tab-t" }, /* @__PURE__ */ React.createElement("b", null, sku.name), /* @__PURE__ */ React.createElement("span", { className: "mono" }, it.ref)),
        /* @__PURE__ */ React.createElement("span", { className: cx("lv-tab-stop", it.human && "human") }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), it.stop)
      );
    }));
  }
  function Flagged({ items, children }) {
    const [cur, setCur] = useState(items[0].ref);
    const item = items.find((i) => i.ref === cur) || items[0];
    const human = items.filter((i) => i.human).length;
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap lv-qhead" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "Flagged this morning"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, items.length, " batches", human ? ` · ${human === 1 ? "one needs" : human + " need"} your yes` : "")), /* @__PURE__ */ React.createElement(BatchTabs, { items, current: item.ref, onPick: setCur, asTabs: true, label: "Batches flagged this morning" }), /* @__PURE__ */ React.createElement("div", { role: "tabpanel", id: "lv-flagged", "aria-labelledby": "lv-tab-" + item.ref }, children(item)));
  }
  function Switcher({ items, current }) {
    const { go } = S.useRoute();
    return /* @__PURE__ */ React.createElement("div", { className: "lv-tabs-row" }, /* @__PURE__ */ React.createElement(BatchTabs, { items, current, onPick: (ref) => go("route", { ref }), label: "Batches flagged this morning" }));
  }
  function MangoCard({ item, dim }) {
    const { go } = S.useRoute();
    const live = useLive();
    const app = useApp();
    const v = item.view;
    const money = /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement(Money, { value: -D.MANGO_PLAN.writeOff.total, size: app.bp === "phone" ? "s" : "m", style: { color: "var(--red-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "if destroyed · ", fmt.num(v.assess.atRisk), " units at risk"));
    return /* @__PURE__ */ React.createElement(Dim, { on: dim }, /* @__PURE__ */ React.createElement(TrackerCard, { view: v, done: item.done, current: item.current, money, eta: dim ? pausedWords(live) : `Label photo asked at ${D.PUSH.verify.at}`, etaTone: dim ? "gray" : void 0, agentLive: dim ? "" : `Vision is waiting for ${v.dist.name}' photo`, primary: /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("route", { ref: item.ref }) }, "Open Route Room") }));
  }
  const pausedWords = (live) => live.conn === "offline" ? `Offline · as of ${live.since}` : `Updates paused at ${live.since}`;
  const MANGO_TIMES = { connect: "once", detect: D.PUSH.detect.at, verify: "asked " + D.PUSH.verify.at };
  function mangoFeed(v) {
    const gates = v.assess.gates.map((g) => `${g.app} ${g.has}/${g.need}`).join(" · ");
    return [
      { id: "m1", stage: "detect", agent: "Watcher", icon: "radar", at: D.PUSH.detect.at, min: 0, text: `${v.id} fails all three quick-commerce gates; ${fmt.num(v.assess.atRisk)} of ${fmt.num(v.units)} units will not sell by ${fmt.date(v.bestBefore).replace(/ \d{4}$/, "")}.`, calls: [["gates.check", gates, "bad"], ["sellthrough.project", `${v.sellPerDay}/day × ${v.assess.usableDays} days = ${fmt.num(v.assess.willSell)} of ${fmt.num(v.units)}`, ""], ["pubsub.publish", "batch.at_risk", "ok"]] },
      { id: "m2", stage: "verify", agent: "Vision", icon: "scan-line", at: D.PUSH.verify.at, min: 5, text: `Asked ${v.dist.name} for one label photo before quoting any price.`, calls: [["fcm.send", v.dist.name, "ok"]] }
    ];
  }
  function MangoRoom({ me, item, below }) {
    const app = useApp();
    const v = item.view;
    const sku = v.skuObj;
    const live = useLive();
    const dim = live.conn !== "live";
    const stages = D.STAGES.map((x) => ({ id: x.id, title: x.title, human: x.human }));
    return /* @__PURE__ */ React.createElement(S.Screen, { me, title: "Route Room", sub: below ? null : `${v.id} · ${sku.brand} ${sku.name} · ${v.dist.name}, ${v.dist.city}`, back: "Command Center", below }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: app.bp === "phone" ? 64 : 84 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("div", { className: "row base", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(DaysNum, { days: v.daysLeft, life: sku.lifeDays, size: "l", style: { color: "var(--red-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, "days left"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "best before ", fmt.date(v.bestBefore))))), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: app.bp === "phone" ? "start" : "end" } }, /* @__PURE__ */ React.createElement(GateChips, { gates: v.assess.gates }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, fmt.num(v.assess.atRisk), " of ", fmt.num(v.units), " units at risk · sells ", v.sellPerDay, " a day"))), /* @__PURE__ */ React.createElement(Dim, { on: dim }, app.bp === "phone" ? /* @__PURE__ */ React.createElement(TrackerCompact, { done: item.done, current: item.current }) : /* @__PURE__ */ React.createElement(Tracker, { stages, done: item.done, current: item.current, times: MANGO_TIMES }))), /* @__PURE__ */ React.createElement(
      S.Columns,
      {
        sideWidth: 340,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: `Vision · asked at ${D.PUSH.verify.at}` }, "Label, read from the shelf"), /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { containerType: "inline-size" } }, /* @__PURE__ */ React.createElement("div", { className: "labelgrid" }, /* @__PURE__ */ React.createElement("div", { className: "lv-await" }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: app.bp === "phone" ? 110 : 140, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: "center", textAlign: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("b", null, "Waiting for ", v.dist.name, "' photo"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "One carton in the ", v.dist.godown, ". They send it from their own phone; the request reached them at ", D.PUSH.verify.at, "."))), /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(S.Locked, { icon: "scan-line", agent: "Vision Agent", live: !dim, text: "Prices nothing until a person photographs one carton label on the shelf." }), [0, 1, 2, 3].map((i) => /* @__PURE__ */ React.createElement(Skeleton, { key: i, h: 44, r: 12 })))))), /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Valuer" }, "Five channels, priced"), /* @__PURE__ */ React.createElement(S.Locked, { icon: "scale", agent: "Valuer Agent", text: "Prices five channels once the label is verified." }), /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Router" }, "Recommended split"), /* @__PURE__ */ React.createElement(S.Locked, { icon: "split", agent: "Router Agent", text: "Proposes a split once the channels are priced." })),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "Gaps drawn to the clock" }, "Agent timeline"), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Dim, { on: dim }, /* @__PURE__ */ React.createElement(AgentFeed, { events: mangoFeed(v), people: D.PEOPLE, live: -1 }))))
      }
    )));
  }
  function nextCheck(clock) {
    const [h, m] = clock.time.split(":").map(Number);
    const [wh, wm] = Store.get().rules.watchTime.split(":").map(Number);
    const left = (1440 - (h * 60 + m) + wh * 60 + wm) % 1440 || 1440;
    const real = left / 1440 * clock.perDay;
    return real < 1.5 ? "about a minute" : real < 90 ? `about ${Math.round(real)} minutes` : `about ${Math.round(real / 60)} hours`;
  }
  function Quiet() {
    const s = S.useStore();
    const app = useApp();
    const live = useLive();
    const watch = s.rules.watchTime;
    const cleared = s.hero.phase === "cleared";
    return /* @__PURE__ */ React.createElement(Card, { className: "lv-quiet" }, /* @__PURE__ */ React.createElement("div", { className: "lv-quiet-in" }, /* @__PURE__ */ React.createElement(Product, { name: "sprout-box", size: app.bp === "phone" ? 96 : 120, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("div", { className: "t-title3" }, "Nothing at risk today"), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, "The Watcher checked ", D.SETUP.dms.rows, " batches at ", watch, ". Every one sells through inside its date, so nothing needs you. The next check is tomorrow at ", watch, ", ", nextCheck(live.clock), " from now at this pace."), cleared && /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { marginTop: 6 } }, /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "Last cleared · ", D.BATCHES[0].id), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, fmt.inr(D.ACTUAL.net), " recovered, 0 cartons destroyed")))));
  }
  function DistQuiet({ me, dist, perm }) {
    const app = useApp();
    const s = S.useStore();
    const mine = D.BATCHES.filter((b) => b.distributor === dist.id && !b.hero && !b.second).map((b) => D.batchView(b));
    return /* @__PURE__ */ React.createElement(S.Screen, { me, title: "Today", sub: `${dist.name} · ${dist.godown}, ${dist.city}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, perm, /* @__PURE__ */ React.createElement(Card, { className: "lv-quiet" }, /* @__PURE__ */ React.createElement("div", { className: "lv-quiet-in" }, /* @__PURE__ */ React.createElement(Product, { name: "godown", size: app.bp === "phone" ? 92 : 112, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("div", { className: "t-title3" }, "Nothing for you today"), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, "No photo requests, scheme orders or marketplace lots. The Watcher checks your stock every morning at ", s.rules.watchTime, "; when it needs you, it sends a push."), s.hero.phase === "cleared" && /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { marginTop: 6 } }, /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, D.SKUS[D.BATCHES[0].sku].name.replace(/ \d+ ?(g|ml)$/, ""), " cleared"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "credit note ", fmt.inr(D.SUPPORT.total), " from ", WS.short, " · you ended whole"))))), /* @__PURE__ */ React.createElement(S.SectionTitle, { sub: "From your nightly DMS export" }, "Your stock"), /* @__PURE__ */ React.createElement("div", { className: "list" }, mine.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, compact: app.bp === "phone", onOpen: () => {
    } })))));
  }
  function SendFill({ p, onCancel }) {
    const pct = Math.round(p * 100);
    const label = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { name: "send", size: 18 }), "Sending · ", pct, "%");
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "lv-fill", role: "progressbar", "aria-label": "Sending the photo", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct }, /* @__PURE__ */ React.createElement("span", { className: "lv-fill-off" }, label), /* @__PURE__ */ React.createElement("span", { className: "lv-fill-on", style: { clipPath: `inset(0 ${100 - pct}% 0 0)` }, "aria-hidden": "true" }, label)), onCancel && /* @__PURE__ */ React.createElement(Button, { variant: "ghost", block: true, onClick: onCancel }, "Cancel"));
  }
  function ExportUpload({ name, size, p, onCancel }) {
    const steps = [["Upload", "now"], ["Map columns", "Data Agent"], ["Load into BigQuery", "then the Watcher starts"]];
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug lv-upload" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "file-spreadsheet", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { style: { overflowWrap: "anywhere" } }, name), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "DMS export · ", fmt.num(Math.round(size / 1e5) / 10), " MB"))), onCancel && /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: onCancel }, "Cancel")), /* @__PURE__ */ React.createElement(K.Progress, { value: p, label: "Uploading the DMS export" }), /* @__PURE__ */ React.createElement("span", { className: "row between t-footnote subtle" }, /* @__PURE__ */ React.createElement("span", { className: "tnum" }, "Uploading · ", (size / 1e6 * p).toFixed(1), " of ", (size / 1e6).toFixed(1), " MB"), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, Math.round(p * 100), "%")), /* @__PURE__ */ React.createElement("ol", { className: "lv-mini", "aria-label": "What happens to the file" }, steps.map(([t, sub], i) => /* @__PURE__ */ React.createElement("li", { key: t, className: i === 0 ? "now" : "" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("b", null, t), /* @__PURE__ */ React.createElement("span", null, sub)))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "You can keep setting the rules below while it uploads. The column mapping appears here when the Data Agent has read the file."));
  }
  function ApproveFailed({ message }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement(motion.div, { className: "lv-err", role: "alert", initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: EASE } }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 18 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "The approval didn't go through."), " ", message, " Nothing was listed, offered or sent; the plan is still waiting for you."));
  }
  function NeedsNet({ id }) {
    return /* @__PURE__ */ React.createElement("span", { id, className: "t-footnote lv-needs" }, /* @__PURE__ */ React.createElement(Icon, { name: "wifi-off", size: 14 }), "Approving needs a connection");
  }
  const LEAD_PUSH = { operator: "plan", distributor: "verify", retailer: "offer", finance: "papers", sustainability: "report" };
  const myPush = (me) => {
    const lead = D.PUSH[LEAD_PUSH[me.role]];
    return lead && lead.title ? lead : Object.values(D.PUSH).find((p) => p.to === me.id && p.title);
  };
  function PushPreview({ me, blocked }) {
    const live = useLive();
    const p = myPush(me);
    const time = p && /^\d\d:\d\d$/.test(p.at) ? p.at : live.clock.time;
    return /* @__PURE__ */ React.createElement("div", { className: cx("lv-pp", blocked && "blocked"), "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "lv-pp-time tnum" }, time), /* @__PURE__ */ React.createElement("span", { className: "lv-pp-date" }, live.clock.long), /* @__PURE__ */ React.createElement("div", { className: "lv-pp-note" }, /* @__PURE__ */ React.createElement("span", { className: "lv-pp-head" }, /* @__PURE__ */ React.createElement(Mark, { size: 20, still: true }), /* @__PURE__ */ React.createElement("span", null, D.PLATFORM.name), /* @__PURE__ */ React.createElement("span", { className: "lv-pp-now" }, "now")), /* @__PURE__ */ React.createElement("b", null, p ? p.title : WS.name), /* @__PURE__ */ React.createElement("span", { lang: p && p.hindi ? "hi" : void 0 }, p ? p.body : "When something needs you, it arrives here.")), blocked && /* @__PURE__ */ React.createElement("span", { className: "lv-pp-block" }, /* @__PURE__ */ React.createElement(Icon, { name: "bell-off", size: 16 }), "Blocked in this browser"));
  }
  function InstallArt() {
    return /* @__PURE__ */ React.createElement("div", { className: "lv-ia", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "lv-ia-bar" }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 18 }), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18 }), /* @__PURE__ */ React.createElement("span", { className: "lv-ia-share" }, /* @__PURE__ */ React.createElement(Icon, { name: "share-ios", size: 18 })), /* @__PURE__ */ React.createElement(Icon, { name: "book-open", size: 18 }), /* @__PURE__ */ React.createElement(Icon, { name: "copy", size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "lv-ia-sheet" }, /* @__PURE__ */ React.createElement("span", { className: "lv-ia-row" }, /* @__PURE__ */ React.createElement("span", null, "Copy"), /* @__PURE__ */ React.createElement(Icon, { name: "copy", size: 18 })), /* @__PURE__ */ React.createElement("span", { className: "lv-ia-row on" }, /* @__PURE__ */ React.createElement("span", null, "Add to Home Screen"), /* @__PURE__ */ React.createElement(Icon, { name: "square-plus", size: 18 })), /* @__PURE__ */ React.createElement("span", { className: "lv-ia-row" }, /* @__PURE__ */ React.createElement("span", null, "Add Bookmark"), /* @__PURE__ */ React.createElement(Icon, { name: "book-open", size: 18 }))));
  }
  function askWords(me) {
    const watch = Store.get().rules.watchTime;
    const dist = D.DISTRIBUTORS[Object.keys(D.DISTRIBUTORS).find((k) => D.DISTRIBUTORS[k].name === me.org) || "rakesh"];
    if (me.role === "operator") return ["Get the morning push", `When the Watcher flags a batch at ${watch} journey time, the plan reaches your lock screen with the money on it, and one tap opens it here.`];
    if (me.role === "distributor") return ["Get photo requests and orders as a push", "When Vision needs a label photo or your kiranas order on a scheme, it reaches your lock screen, in your language."];
    if (me.role === "retailer") return [`Get ${dist.name}' offers as a push`, "Schemes arrive in your language, ready to order in one tap."];
    return ["Get a push when something needs you", "When the journey needs you, it reaches your lock screen, and one tap opens it here."];
  }
  function PushStep({ me, variant, home, onAllow, onCheck, onDone }) {
    const app = useApp();
    const [title, body] = askWords(me);
    const T = {
      ask: [title, body],
      install: ["Add the app to your Home Screen", "On iPhone, Safari sends notifications only to web apps opened from the Home Screen. Three taps, then open Clearance from there."],
      denied: ["Notifications are blocked", `Your browser blocks notifications from ${WS.domain}. Everything still reaches your inbox while they are off.`]
    }[variant];
    const steps = variant === "install" ? [["Tap", "Share", "in Safari's toolbar"], ["Choose", "Add to Home Screen", ""], ["Open", "Clearance", "from your Home Screen"]] : variant === "denied" ? app.bp === "phone" ? [["In Chrome, open the menu (the three dots), then", "Settings", ""], ["Open", "Site settings", "and then Notifications"], ["Find", WS.domain, "and choose Allow"]] : [["Click", "the site settings icon", "at the left of the address bar"], ["Set", "Notifications", "to Allow"], ["Reload", "the page", ""]] : null;
    return /* @__PURE__ */ React.createElement(S.Screen, { me, title: T[0], hideLarge: true }, /* @__PURE__ */ React.createElement("div", { className: "lv-step" }, /* @__PURE__ */ React.createElement("div", { className: "lv-step-art" }, variant === "install" ? /* @__PURE__ */ React.createElement(InstallArt, null) : /* @__PURE__ */ React.createElement(PushPreview, { me, blocked: variant === "denied" })), /* @__PURE__ */ React.createElement("div", { className: "lv-step-copy" }, /* @__PURE__ */ React.createElement("h1", { className: "lv-step-t" }, T[0]), /* @__PURE__ */ React.createElement("p", { className: "lv-step-p" }, T[1]), steps && /* @__PURE__ */ React.createElement("ol", { className: "lv-steps" }, steps.map(([a, b, c], i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement("span", { className: "lv-stepn" }, i + 1), /* @__PURE__ */ React.createElement("span", null, a, " ", /* @__PURE__ */ React.createElement("b", null, b), " ", c)))), /* @__PURE__ */ React.createElement("div", { className: "lv-step-acts" }, variant === "ask" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "bell", onClick: onAllow }, "Turn on notifications"), variant === "denied" && /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", icon: "refresh-cw", onClick: onCheck }, "Check again"), /* @__PURE__ */ React.createElement(Button, { variant: variant === "ask" ? "ghost" : "primary", size: "lg", iconRight: "arrow-right", onClick: onDone }, variant === "ask" ? "Not now" : `Continue to ${home}`)), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "You can change this in Profile at any time."))));
  }
  function SignInButton({ phase, name }) {
    const reduce = useReducedMotion();
    const busy = phase === "busy", done = phase === "done", err = phase === "error";
    const label = done ? `Welcome, ${name}` : busy ? "Signing in…" : "Sign in";
    return /* @__PURE__ */ React.createElement(
      motion.button,
      {
        type: "submit",
        className: cx("btn btn-primary btn-lg btn-block si-btn", (busy || done) && "on"),
        "aria-disabled": busy || done || void 0,
        animate: err && !reduce ? { x: [0, -8, 8, -5, 5, -2, 0] } : { x: 0 },
        transition: { duration: 0.36, ease: "easeOut" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "si-btn-ic", "aria-hidden": "true" }, done ? /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement(motion.path, { d: "M5 12.5l4.5 4.5L19 7.5", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", initial: { pathLength: reduce ? 1 : 0 }, animate: { pathLength: 1 }, transition: { duration: 0.28, ease: EASE } })) : busy ? /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "12 12 40 40" }, /* @__PURE__ */ React.createElement("circle", { cx: "43.5", cy: "19", r: "4", fill: "currentColor" }), /* @__PURE__ */ React.createElement(motion.path, { d: S_PATH, fill: "none", stroke: "currentColor", strokeWidth: "5", strokeLinecap: "round", strokeLinejoin: "round", initial: { pathLength: reduce ? 1 : 0 }, animate: { pathLength: 1 }, transition: { duration: reduce ? 0 : 1.1, ease: [0.65, 0, 0.35, 1] } })) : /* @__PURE__ */ React.createElement(Icon, { name: "log-in", size: 18 })),
      /* @__PURE__ */ React.createElement("span", { className: "si-btn-lbl" }, /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, /* @__PURE__ */ React.createElement(motion.span, { key: label, initial: reduce ? false : { y: 12, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -12, opacity: 0 }, transition: { duration: 0.24, ease: EASE } }, label))),
      (busy || done) && /* @__PURE__ */ React.createElement(motion.i, { className: "si-btn-prog", "aria-hidden": "true", initial: { scaleX: reduce ? 0.9 : 0 }, animate: { scaleX: done ? 1 : 0.9 }, transition: { duration: reduce ? 0 : done ? 0.16 : 1.1, ease: done ? EASE : [0.3, 0.7, 0.4, 1] } }),
      /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, busy ? "Signing in" : done ? `Signed in. Welcome, ${name}.` : "")
    );
  }
  function Chips({ groups, onPick }) {
    return /* @__PURE__ */ React.createElement("div", { className: "si-try" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle strong" }, "People in the story"), groups.map((g) => /* @__PURE__ */ React.createElement("div", { key: g.group, className: "si-chips" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, g.group), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { justifyContent: "center" } }, g.people.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.id, type: "button", className: "chip", onClick: () => onPick(p.email) }, /* @__PURE__ */ React.createElement(Avatar, { person: p, size: "xs" }), p.short || p.name))))), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "A name fills in its email. The password is handed over with the invitation."));
  }
  function NotMember({ email, message, onOther }) {
    return /* @__PURE__ */ React.createElement("div", { className: "si-form", style: { gap: 14 } }, email && /* @__PURE__ */ React.createElement("div", { className: "si-who" }, /* @__PURE__ */ React.createElement("span", { className: "si-who-av", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "user", size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "si-who-t" }, /* @__PURE__ */ React.createElement("span", { className: "si-who-k" }, "Signed in as"), /* @__PURE__ */ React.createElement("b", null, email))), /* @__PURE__ */ React.createElement("div", { className: "si-out", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 18 }), /* @__PURE__ */ React.createElement("span", null, message, " Ask ", WS.short, "'s workspace admin to invite you, or open a workspace you belong to.")), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", block: true, icon: "log-out", onClick: onOther }, "Sign in with another account"));
  }
  function SignInLive({ groups, check, onSignedIn }) {
    const app = useApp();
    const reduce = useReducedMotion();
    const live = useLive();
    const [find, setFind] = useState(false);
    const onFind = () => setFind(true);
    const [email, setEmail] = useState(live.prefill || "");
    const [pw, setPw] = useState(live.prefill && !live.wrong ? "············" : "");
    const [show, setShow] = useState(false);
    const [err, setErr] = useState(live.wrong || "");
    const [phase, setPhase] = useState(live.busy ? "busy" : "idle");
    const [first, setFirst] = useState("");
    const [out, setOut] = useState(live.outsider || null);
    const pwRef = useRef(null);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const fail = async (message) => {
      setPhase("error");
      await wait(reduce ? 0 : 360);
      setPhase("idle");
      setErr(message);
      setPw("");
    };
    const submit = async (e) => {
      e.preventDefault();
      if (phase === "busy" || phase === "done") return;
      setErr("");
      if (!email.trim() || !pw) return fail(live.wrongWords);
      setPhase("busy");
      let r;
      try {
        r = await check(email, pw);
      } catch (x) {
        if (x && x.outsider) {
          setPhase("idle");
          setOut({ email: email.trim(), message: x.message });
          return;
        }
        return fail(x.message);
      }
      setFirst(r.short || r.name.split(" ")[0]);
      setPhase("done");
      await wait(720);
      onSignedIn(r);
    };
    const edit = (set) => (ev) => {
      set(ev.target.value);
      setErr("");
    };
    const form = out ? /* @__PURE__ */ React.createElement(NotMember, { email: out.email, message: out.message, onOther: () => {
      setOut(null);
      setEmail("");
      setPw("");
      setPhase("idle");
    } }) : /* @__PURE__ */ React.createElement("form", { className: "si-form", noValidate: true, onSubmit: submit }, /* @__PURE__ */ React.createElement(Field, { label: "Email", htmlFor: "si-email" }, /* @__PURE__ */ React.createElement(Input, { id: "si-email", icon: "mail", type: "email", value: email, onChange: edit(setEmail), autoComplete: "username", spellCheck: false, autoCapitalize: "none", placeholder: `name@${liveDomain()}` })), /* @__PURE__ */ React.createElement(Field, { label: "Password", htmlFor: "si-pw" }, /* @__PURE__ */ React.createElement("span", { className: "input-wrap si-pw" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 17 }), /* @__PURE__ */ React.createElement("input", { ref: pwRef, id: "si-pw", className: "input", type: show ? "text" : "password", value: pw, onChange: edit(setPw), autoComplete: "current-password", "aria-invalid": err ? "true" : void 0, "aria-describedby": err ? "si-err" : void 0 }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "si-eye", "aria-label": show ? "Hide password" : "Show password", "aria-pressed": show, onClick: () => setShow(!show) }, /* @__PURE__ */ React.createElement(Icon, { name: show ? "eye-off" : "eye", size: 20 })))), err && /* @__PURE__ */ React.createElement("div", { className: "si-err", id: "si-err", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 18 }), /* @__PURE__ */ React.createElement("span", null, err)), /* @__PURE__ */ React.createElement(SignInButton, { phase, name: first }), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted si-hint" }, "First time here? Whoever invited you gives you your first password. Nothing is sent by email."));
    return /* @__PURE__ */ React.createElement("div", { className: "signin" }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" }), app.bp === "desktop" && /* @__PURE__ */ React.createElement(S.HeroStage, null), /* @__PURE__ */ React.createElement("div", { className: "si-panel" }, /* @__PURE__ */ React.createElement("div", { className: "si-card" }, /* @__PURE__ */ React.createElement("div", { className: "si-ws" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: app.bp === "phone" ? 52 : 60 }), /* @__PURE__ */ React.createElement("div", { className: "si-ws-name" }, WS.name), /* @__PURE__ */ React.createElement("span", { className: "si-url" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 12, stroke: 2.2 }), WS.domain)), app.bp !== "desktop" && !out && /* @__PURE__ */ React.createElement("div", { className: "si-hero", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: "carton-hero", size: app.bp === "phone" ? 120 : 150, float: true })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("h1", { className: "si-title" }, out ? "Not a member here" : "Sign in"), !out && /* @__PURE__ */ React.createElement("p", { className: "si-sub" }, "Use the email address you were invited with, and your password.")), form, !out && groups && groups.length > 0 && /* @__PURE__ */ React.createElement(Chips, { groups, onPick: (v) => {
      setEmail(v);
      setErr("");
      if (pwRef.current) pwRef.current.focus();
    } }), /* @__PURE__ */ React.createElement("div", { className: "si-foot" }, /* @__PURE__ */ React.createElement(PoweredBy, null), /* @__PURE__ */ React.createElement("span", { className: "si-foot-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm", onClick: onFind }, "Not your workspace? Find yours")), /* @__PURE__ */ React.createElement("span", { className: "si-note" }, "Prototype · every company, person and number is fictional")))), /* @__PURE__ */ React.createElement(S.FindWorkspace, { open: find, onClose: () => setFind(false), initial: email, note: `Only ${WS.name} is set up in this prototype.`, onUse: (v) => {
      setFind(false);
      setOut(null);
      setEmail(v);
      setErr("");
    } }));
  }
  window.SC3_SCREENS.Live = { cue, cueLong, down, stateWord, ConnMark, Cue, Line, BarSub, Band, Dim, flaggedItems, BatchTabs, Flagged, Switcher, MangoCard, MangoRoom, pausedWords, Quiet, DistQuiet, SendFill, ExportUpload, ApproveFailed, NeedsNet, PushStep, SignInLive, SignInButton };
})();

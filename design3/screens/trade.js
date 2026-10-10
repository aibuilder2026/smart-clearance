(function() {
  const { useState, useEffect, useRef, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Sheet, Product, Empty, Money, Roll, DaysNum, GateChips, Tile, Aura, AgentFeed, ClusterMap, HaulLine, StatusBadge, BatchRow, useApp, useNotice, Mark, WorkspaceMark } = K;
  const { useStore, useRoute, heroModel, Screen, Columns, SectionTitle, Locked } = S;
  const IMG = () => window.SC3_IMG || "system/img/";
  const distOf = (me) => Object.values(D.DISTRIBUTORS).find((d) => d.name === (me && me.org)) || D.DISTRIBUTORS.rakesh;
  const WK = () => window.SC3_WORLD && window.SC3_WORLD.KIRANAS || [];
  const kOf = (me) => {
    const name = me && me.org;
    const d = D.KIRANAS.find((k) => k.name === name);
    if (d) return d;
    const w = WK().find((k) => k.name === name);
    return w ? { id: w.id, name: w.name, area: w.area, units: w.sales14 * M.RULES.shopCapTimes, at: "10:15" } : D.KIRANAS[0];
  };
  const shopOf = (me) => WK().find((k) => k.name === (me && me.org)) || WK()[0];
  const shopById = (id) => D.KIRANAS.find((k) => k.id === id) || WK().find((k) => k.id === id);
  const P = () => window.SC3_LEDGER.partners;
  const creditOf = (c) => c.support.total + (c.expiry && (c.expiry.at === "godown" && c.expiry.amount != null ? c.expiry.amount : c.expiry.credit) || 0);
  const asDate = (iso) => /* @__PURE__ */ new Date((iso.length > 10 ? iso : iso + "T00:00") + ":00+05:30");
  const day = (iso) => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const when = (iso) => iso.length > 10 ? `${day(iso)}, ${iso.slice(11, 16)}` : day(iso);
  const weekday = (iso) => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
  const monthOf = (iso) => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  function PtHead({ sku, id, where, badge, line, children }) {
    const phone = useApp().bp === "phone";
    return /* @__PURE__ */ React.createElement("div", { className: "bhead" }, /* @__PURE__ */ React.createElement("div", { className: "bh-id" }, /* @__PURE__ */ React.createElement("span", { className: "bh-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: phone ? 46 : 72, alt: "" })), /* @__PURE__ */ React.createElement("div", { className: "bh-tt" }, /* @__PURE__ */ React.createElement("h1", null, sku.name), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, id), /* @__PURE__ */ React.createElement("span", { className: "sep", "aria-hidden": "true" }, "·"), /* @__PURE__ */ React.createElement("span", null, where)), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, badge, line && /* @__PURE__ */ React.createElement("span", null, line)))), children);
  }
  function PtTabs({ tabs, value, onChange, label }) {
    const phone = useApp().bp === "phone";
    return /* @__PURE__ */ React.createElement("nav", { className: "bh-tabs", "aria-label": label }, tabs.map((t) => {
      const on = t.id === value;
      return /* @__PURE__ */ React.createElement("button", { key: t.id, type: "button", className: "bh-tab", "aria-current": on ? "page" : void 0, onClick: () => onChange(t.id) }, on && /* @__PURE__ */ React.createElement(motion.span, { layoutId: "pt-tab-thumb", className: "bh-tab-thumb", transition: { type: "spring", stiffness: 500, damping: 40 } }), !phone && /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: 16 }), /* @__PURE__ */ React.createElement("span", null, t.label));
    }));
  }
  const PtLine = ({ k, sub, v, strong, onClick }) => /* @__PURE__ */ React.createElement("div", { className: cx("pt-line", strong && "strong") }, /* @__PURE__ */ React.createElement("span", null, k, sub && /* @__PURE__ */ React.createElement("em", null, " ", onClick ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link", onClick }, sub) : sub)), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, v));
  function PtMoments({ items }) {
    return /* @__PURE__ */ React.createElement("div", { className: "pt-moments", role: "list" }, items.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: m.k + i, role: "listitem", className: cx("pt-moment", m.ahead && "ahead") }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: m.icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, m.title), m.sub && /* @__PURE__ */ React.createElement("span", { className: "sub" }, m.sub)), /* @__PURE__ */ React.createElement("time", null, m.at ? m.at.length > 10 ? when(m.at) : m.at : "next"))));
  }
  function PaperSheet({ open, onClose, c, id, receipt }) {
    const ref = useRef(null);
    const d = receipt || c && id && c.docs.find((x) => x.id === id);
    const pdf = () => {
      const n = ref.current;
      if (n && d) S.printPage(`${d.type || "Donation receipt"} ${d.no || ""}`, `<div class="${n.className}">${n.innerHTML}</div>`, { styles: true });
    };
    return /* @__PURE__ */ React.createElement(Sheet, { open: open && !!d, onClose, title: d ? d.type || "Donation receipt" : "", footer: d ? /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, icon: "download", onClick: pdf }, "Download PDF") : null }, d && /* @__PURE__ */ React.createElement("div", { ref, className: "stack snug" }, receipt ? /* @__PURE__ */ React.createElement(S.Receipt, { doc: receipt, batch: receipt.batch || c && c.batch, sku: receipt.sku || c && c.sku, dist: receipt.dist || c && c.dist }) : /* @__PURE__ */ React.createElement(S.Paper, { id, c })));
  }
  const PAPER_ICON = { invoice: "receipt", eway: "truck", support: "hand-coins", expiry: "warehouse", receipt: "heart-handshake", destruction: "trash-2" };
  const issuedBy = (c, d) => d.id === "invoice" || d.id === "eway" ? "You issue it" : d.id === "receipt" ? `${c.partner ? c.partner.name : "The food bank"} issued it to ${D.WORKSPACE.short} · a copy for you` : d.id === "destruction" ? d.at === "godown" ? `${d.agency || "The agency"} destroyed them for you` : `${D.WORKSPACE.short} destroyed the packs · a copy for you` : `${D.WORKSPACE.short} issued it to you`;
  function PaperRow({ c, d, onOpen }) {
    const amount = d.status === "not required" || d.id === "receipt" ? null : d.id === "invoice" ? d.total || d.amount : d.amount;
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-paper", onClick: () => onOpen(d.id) }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: PAPER_ICON[d.id] || "file-text", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, d.type), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, d.no), " · ", issuedBy(c, d), d.status === "not required" ? " · not required" : "")), amount ? /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(amount)) : null, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16, className: "subtle" }));
  }
  const cartons = (u) => {
    const c = Math.floor(u / 24), r = u % 24;
    return r === 12 ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? "" : "s"}`;
  };
  const ES = D.PLAN.lines.find((l) => l.id === "expiresoon"), KL = D.PLAN.lines.find((l) => l.id === "kirana");
  const SHOPS = D.KIRANAS.length, CHIPS = D.SKUS.chips;
  const all = (h) => h.orders.length === SHOPS;
  function PermissionCard() {
    const [busy, setBusy] = useState(false);
    const [later, setLater] = useState(false);
    const { toast } = useNotice();
    const allow = () => {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        Flow.act("permit");
        toast({ text: "Allowed · you can pause it any time", tone: "ok" });
      }, 600);
    };
    if (later) return /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: D.WORKSPACE, size: 36 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Munchly is waiting for your permission"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Nothing is listed or offered in your name until you allow it.")), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", onClick: () => setLater(false) }, "Review"));
    return /* @__PURE__ */ React.createElement(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: "bezel" }, /* @__PURE__ */ React.createElement("div", { className: "card raised stack snug", style: { padding: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: D.WORKSPACE, size: 30 }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle strong" }, D.WORKSPACE.name, " · ", D.JOURNEY.permissionAsked)), /* @__PURE__ */ React.createElement("div", { className: "t-title3" }, "Let Smart-Clearance act for Rakesh Traders"), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, D.SETUP.acts.map((t) => /* @__PURE__ */ React.createElement("div", { key: t, className: "row top t-subhead", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 17, stroke: 2.4, style: { color: "var(--primary-text)", marginTop: 2, flex: "none" } }), /* @__PURE__ */ React.createElement("span", null, t)))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: 0 } }, "Always within Munchly's price floors. Every action shows here, and you can pause any of it. Munchly pays you the gap to the ₹", CHIPS.dp, " you paid, so you end whole."), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "lg", icon: "check", loading: busy, onClick: allow }, "Allow"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "lg", onClick: () => setLater(true) }, "Not now"))));
  }
  function ActingFor({ p }) {
    const { toast } = useNotice();
    const flip = () => {
      Flow.act("pause", !p.paused);
      toast({ text: p.paused ? "Resumed · the agents carry on" : "Paused · nothing more happens in your name", tone: "ok" });
    };
    return /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", p.paused ? "amber" : ""), style: { width: 40, height: 40, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: p.paused ? "circle-pause" : "handshake", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, p.paused ? "Paused: nothing happens in your name" : "Smart-Clearance acts for you"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, p.paused ? "Listings, offers and invoice drafts wait until you resume." : `Inside Munchly's floors · since ${p.at} · listings, scheme offers, invoice drafts, dispatch slots`)), /* @__PURE__ */ React.createElement(Button, { variant: p.paused ? "primary" : "secondary", size: "sm", icon: p.paused ? "play" : "pause", onClick: flip }, p.paused ? "Resume" : "Pause"));
  }
  function payCells(upi, n = 21) {
    let seed = [...upi].reduce((t, ch) => t * 31 + ch.charCodeAt(0) >>> 0, 7);
    const r = () => (seed = seed * 1103515245 + 12345 >>> 0) / 2 ** 32;
    const corner = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].find(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
    const cells = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const f = corner(x, y);
      if (f) {
        if (Math.max(Math.abs(x - f[0] - 3), Math.abs(y - f[1] - 3)) !== 2) cells.push([x, y]);
      } else if (r() < 0.47) cells.push([x, y]);
    }
    return cells;
  }
  function PayCode({ upi, size = 92 }) {
    const cells = useMemo(() => payCells(upi), [upi]);
    return /* @__PURE__ */ React.createElement("svg", { className: "paycode", width: size, height: size, viewBox: "-1 -1 23 23", "aria-hidden": "true" }, cells.map(([x, y]) => /* @__PURE__ */ React.createElement("rect", { key: x + "-" + y, x, y, width: "1", height: "1" })));
  }
  function StaffSale({ staff, dist, product, clears }) {
    const [n, setN] = useState(staff.units);
    const [busy, setBusy] = useState(false);
    const { toast } = useNotice();
    const record = () => {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        Flow.act("recordStaffSale", n);
        toast({ text: `Recorded · ${fmt.num(n)} of ${fmt.num(staff.units)} packs sold`, tone: "ok" });
      }, 400);
    };
    const open = staff.status === "open";
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "users", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Staff sale · ", product)), open ? /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true }, "open") : /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "recorded")), open ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, fmt.num(staff.units), " packs for your staff at ", /* @__PURE__ */ React.createElement("b", null, "₹", staff.price), " a pack, at ", staff.godown, ". Staff pay you by UPI."), dist.upi && /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(PayCode, { upi: dist.upi }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "mono t-footnote", style: { overflowWrap: "anywhere" } }, dist.upi), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Your own UPI: staff pay you at the godown", clears ? `, over ${clears}` : "", "."))), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Stepper, { value: n, onChange: setN, min: 0, max: staff.units, label: "packs sold to staff" }), /* @__PURE__ */ React.createElement("span", { className: "t-subhead muted" }, "of ", fmt.num(staff.units), " packs sold")), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "check", loading: busy, onClick: record }, "Record the sale"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Record once, when the sale is over. What does not sell stays at the godown.")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, /* @__PURE__ */ React.createElement("b", null, fmt.num(staff.sold), " of ", fmt.num(staff.units)), " sold to staff at ₹", staff.price, " a pack"), /* @__PURE__ */ React.createElement(K.Progress, { value: staff.sold / staff.units, label: "Staff packs sold" }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, staff.left ? `${fmt.num(staff.left)} ${staff.left === 1 ? "pack stays" : "packs stay"} at ${staff.godown}.` : "Every pack sold.")));
  }
  const HERO = D.BATCHES.find((b) => b.hero);
  const CH = { kirana: { icon: "store", name: "Kirana scheme" }, expiresoon: { icon: "shopping-bag", name: "ExpireSoon lot" }, staff: { icon: "users", name: "Staff sale" }, foodbank: { icon: "heart-handshake", name: "Food bank" }, destroy: { icon: "recycle", name: "Destroyed at the godown", ch: "writeoff" } };
  const num = (n) => fmt.num(n), rate = (n) => "₹" + n.toFixed(2);
  const shortName = (sku) => sku.name.replace(/ \d+ ?(g|ml|kg|L)$/, "");
  const Chan = ({ id, icon }) => /* @__PURE__ */ React.createElement("span", { className: "dist-chan", style: { "--ch": `var(--ch-${CH[id] && CH[id].ch || id})` }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: icon || CH[id].icon, size: 16, stroke: 2 }));
  const stopBadge = (j) => /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: j.todo.length ? "amber" : j.phase === "cleared" ? "green" : "blue", dot: true, live: !j.todo.length && j.phase !== "cleared" }, j.todo.length ? `${j.todo.length} for you` : j.stop);
  function BatchLine({ sku, id, badge, sub, size = 48 }) {
    return /* @__PURE__ */ React.createElement("div", { className: "row dist-bl", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "grow stack tight", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("b", { className: "t-headline" }, sku.name), badge), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, id), sub ? ` · ${sub}` : "")));
  }
  function LineRow({ line, onOpen }) {
    const inner = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Chan, { id: line.id }), /* @__PURE__ */ React.createElement("span", { className: "grow stack tight", style: { gap: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, CH[line.id].name), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, line.plan)), /* @__PURE__ */ React.createElement("span", { className: cx("dist-state", line.done && "done", line.live && "live") }, line.done && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 14, stroke: 2.4 }), line.state), onOpen && /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16, className: "subtle" }));
    return onOpen ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "dist-line", onClick: onOpen }, inner) : /* @__PURE__ */ React.createElement("div", { className: "dist-line" }, inner);
  }
  const DONE = { issueInvoice: "Marked issued from Tally" };
  function Step({ t, j, primary }) {
    const { go } = useRoute();
    const { toast } = useNotice();
    const [busy, setBusy] = useState(false);
    const run = () => {
      if (t.route) {
        go(t.route, { ref: j.ref });
        return;
      }
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        Flow.act(t.act);
        toast({ text: DONE[t.act] || "Done", tone: "ok" });
      }, 400);
    };
    return /* @__PURE__ */ React.createElement("div", { className: cx("dist-step", primary && "primary") }, /* @__PURE__ */ React.createElement("span", { className: "icontile", style: { width: primary ? 44 : 36, height: primary ? 44 : 36, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: primary ? 20 : 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "grow stack tight", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: primary ? "t-headline" : "t-subhead" }, t.title), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, t.sub)), /* @__PURE__ */ React.createElement(Button, { variant: primary ? "primary" : "secondary", size: primary ? "md" : "sm", icon: t.icon, loading: busy, onClick: run }, t.cta));
  }
  function BatchCard({ j }) {
    const { go } = useRoute();
    const phone = useApp().bp === "phone";
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement(motion.section, { id: `batch-${j.ref}`, tabIndex: -1, "aria-label": `${j.sku.name}, batch ${j.ref}`, className: "card dist-batch", initial: reduce ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(BatchLine, { sku: j.sku, id: j.ref, badge: stopBadge(j), sub: `${num(j.units)} packs at risk · flagged ${day(j.flagged)}`, size: phone ? 44 : 56 }), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", iconRight: "chevron-right", onClick: () => go("batches", { ref: j.ref }) }, "The batch")), j.todo.length ? /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 8 } }, j.todo.map((t, i) => /* @__PURE__ */ React.createElement(Step, { key: t.id, t, j, primary: i === 0 }))) : /* @__PURE__ */ React.createElement("div", { className: "dist-wait" }, /* @__PURE__ */ React.createElement(Aura, { on: j.phase !== "cleared", className: "icontile soft", style: { width: 36, height: 36, borderRadius: 11 } }, /* @__PURE__ */ React.createElement(Icon, { name: j.phase === "cleared" ? "badge-check" : "sparkles", size: 17 })), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, j.waiting), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Nothing for you now")), j.lines.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "dist-lines" }, j.lines.map((l) => /* @__PURE__ */ React.createElement(LineRow, { key: l.id, line: l, onOpen: () => go(l.id === "destroy" ? "destroy" : "van", { ref: j.ref }) }))));
  }
  function BatchIndex({ js }) {
    const reduce = useReducedMotion();
    const jump = (ref) => {
      const el = document.getElementById(`batch-${ref}`);
      if (el) {
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        el.focus({ preventScroll: true });
      }
    };
    return /* @__PURE__ */ React.createElement("nav", { className: "dist-index", "aria-label": "Your batches in a journey" }, js.map((j) => /* @__PURE__ */ React.createElement("button", { key: j.ref, type: "button", onClick: () => jump(j.ref) }, /* @__PURE__ */ React.createElement(Product, { name: j.sku.img, size: 32, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "grow stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, shortName(j.sku)), /* @__PURE__ */ React.createElement("span", { className: "mono" }, j.ref)), stopBadge(j))));
  }
  function DistHome({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const dist = distOf(me), perm = s.setup.permission, asked = dist.id === HERO.distributor;
    const js = P().journeys(dist.id, s).filter((j) => j.phase !== "cleared" || j.todo.length);
    const b = P().distBatches(dist.id, s);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Today", sub: `${dist.name} · ${dist.godown}, ${dist.city}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 960 } }, asked && (perm ? /* @__PURE__ */ React.createElement(ActingFor, { p: perm }) : /* @__PURE__ */ React.createElement(PermissionCard, null)), /* @__PURE__ */ React.createElement(SectionTitle, { sub: `${D.WORKSPACE.short}'s batches at your godown: what each needs from you, and where each line stands` }, js.length ? `${js.length} ${js.length === 1 ? "batch" : "batches"} in a journey` : "No batch in a journey"), js.length > 1 && /* @__PURE__ */ React.createElement(BatchIndex, { js }), js.length ? js.map((j) => /* @__PURE__ */ React.createElement(BatchCard, { key: j.ref, j })) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "godown", title: "Nothing asks for you today", body: `When the Watcher flags a batch at ${dist.godown}, it opens here with what it needs from you. It checks your stock every morning at ${s.rules.watchTime}.` })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "dist-more", onClick: () => go("batches") }, /* @__PURE__ */ React.createElement(Icon, { name: "boxes", size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "grow" }, "Your other stock and the batches you cleared are on ", /* @__PURE__ */ React.createElement("b", null, "Batches"), ": ", b.watching.length, " the Watcher reads, ", b.past.length, " cleared since ", D.WORKSPACE.since), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16, className: "subtle" }))));
  }
  function Switcher({ js, value, onChange }) {
    if (js.length < 2) return null;
    return /* @__PURE__ */ React.createElement("nav", { className: "bh-tabs", "aria-label": "Batches in a journey" }, js.map((j) => {
      const on = j.ref === value;
      return /* @__PURE__ */ React.createElement("button", { key: j.ref, type: "button", className: "bh-tab", "aria-current": on ? "page" : void 0, onClick: () => onChange(j.ref) }, on && /* @__PURE__ */ React.createElement(motion.span, { layoutId: "dist-thumb", className: "bh-tab-thumb", transition: { type: "spring", stiffness: 500, damping: 40 } }), /* @__PURE__ */ React.createElement(Product, { name: j.sku.img, size: 22, alt: "" }), /* @__PURE__ */ React.createElement("span", null, shortName(j.sku)));
    }));
  }
  function VanCard({ j, n }) {
    const app = useApp();
    const reduce = useReducedMotion();
    const { toast } = useNotice();
    const story = j.ref === HERO.id;
    const kir = story ? D.KIRANAS : WK().filter((k) => k.distributor === j.dist.id).map((k) => ({ id: k.id, name: k.name, area: k.area, units: k.sales14 * M.RULES.shopCapTimes }));
    const o = n.offer || { open: false, offered: kir.length, shops: 0, units: 0 };
    const [p, setP] = useState(n.van ? 1 : 0);
    const [running, setRunning] = useState(false);
    useEffect(() => {
      if (n.van && !running) setP(1);
    }, [n.van]);
    const can = n.papers && o.shops > 0 && !n.van;
    const start = () => {
      setRunning(true);
      const t0 = performance.now(), dur = reduce ? 10 : 3600;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        setP(k);
        if (k < 1) requestAnimationFrame(step);
        else {
          setRunning(false);
          Flow.act("vanRound");
          toast({ text: `Round done · ${o.shops} shops, ${cartons(o.units)}`, tone: "ok" });
        }
      };
      requestAnimationFrame(step);
    };
    const godown = j.dist.godown.replace(/ godown$/, "").replace(/ Market$/, "");
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Chan, { id: "kirana", icon: "route" }), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, n.round ? `${n.round.day} van round` : "Van round")), /* @__PURE__ */ React.createElement(Badge, { tone: n.van ? "green" : void 0, icon: n.van ? "check" : "calendar" }, n.van ? "delivered" : n.round ? `${n.round.date} · from ${n.round.leaves}` : o.open ? "once the scheme closes" : "once the papers are drafted")), /* @__PURE__ */ React.createElement("div", { className: "dist-map" }, /* @__PURE__ */ React.createElement(ClusterMap, { kiranas: kir, orderedCount: o.shops, route: o.shops > 0, vanProgress: p, height: app.bp === "phone" ? 220 : 320, ...story ? {} : { title: j.dist.cluster, total: o.offered, godown } })), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 24 } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, /* @__PURE__ */ React.createElement(Roll, { value: o.shops }), /* @__PURE__ */ React.createElement("span", { className: "subtle", style: { fontSize: "0.45em" } }, " / ", o.offered)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "shops on the round")), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, /* @__PURE__ */ React.createElement(Roll, { value: o.units })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "packets · ", cartons(o.units)))), !n.van && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "navigation", loading: running, disabled: !can || running, onClick: start }, can ? "Start the round" : o.open ? `Waiting for orders · ${o.shops} of ${o.offered}` : !o.shops ? "No shop ordered" : "Runs once the papers are drafted"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "₹", M.RULES.vanPerUnit.toFixed(2), " a packet for the van, repaid by ", D.WORKSPACE.short, " in the price support."));
  }
  function Stops({ n }) {
    if (!n.shops.length) return null;
    const stops = n.shops.slice().sort((a, z) => (a.at || "") < (z.at || "") ? -1 : 1);
    return /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "In the order they were placed" }, "Stops"), /* @__PURE__ */ React.createElement("div", { className: "list" }, stops.map((o, i) => {
      const k = shopById(o.kirana) || { name: o.kirana, area: "" };
      return /* @__PURE__ */ React.createElement("div", { key: o.kirana, className: "list-row", style: { gridTemplateColumns: "28px minmax(0,1fr) auto" } }, /* @__PURE__ */ React.createElement("span", { className: "center t-caption strong dist-stop" }, i + 1), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, k.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, k.area, o.at ? ` · ordered ${when(o.at)}` : "")), /* @__PURE__ */ React.createElement("span", { className: "tnum strong t-subhead" }, o.units));
    })));
  }
  function TruckCard({ j, n }) {
    const { toast } = useNotice();
    const es = n.lines.find((l) => l.id === "expiresoon");
    const kl = n.lines.some((l) => l.id === "kirana"), schemeOpen = kl && (!n.offer || n.offer.open);
    const dispatch = () => {
      Flow.act("dispatch");
      toast({ text: `${D.BUYER.city} lot on the buyer's truck · invoice draft next`, tone: "ok" });
    };
    const balance = n.award ? Math.round((es.units * n.award.price - n.award.token) * 100) / 100 : 0;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { "data-anchor": "lot" }), /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Chan, { id: "expiresoon", icon: "truck" }), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "The buyer's truck · ExpireSoon")), /* @__PURE__ */ React.createElement(Badge, { tone: n.truck ? "blue" : n.award ? "green" : "violet" }, n.truck ? "collected" : n.award ? "sold" : n.listing ? "listed" : "not listed yet")), /* @__PURE__ */ React.createElement(HaulLine, { progress: n.truck ? ["settled", "cleared"].includes(n.phase) ? 1 : 0.55 : 0 }), /* @__PURE__ */ React.createElement(List, null, [["Buyer", n.award ? `${D.BUYER.name}, ${D.BUYER.city}` : "whoever takes the lot"], ["Lot", `${n.listing ? `${n.listing.id} · ` : ""}${num(es.units)} packs · ${cartons(es.units)}`], ["Price", n.award ? `${rate(n.award.price)} a pack, the counter he took` : `${rate(es.price)} asked`], ["Token", n.award ? `${fmt.inr(n.award.token)} received` : "paid when a buyer takes it"], ["Balance", n.award ? `${fmt.inr(balance)} before loading` : "paid before loading"], ["Freight", "the buyer's own truck"]].map(([k, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, value: v }))), !n.truck && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "truck", disabled: !n.award || schemeOpen, onClick: dispatch }, !n.award ? "Load after the award" : schemeOpen ? "Load once the scheme closes" : "Load the buyer's truck"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Your staff load it as normal godown work, once the balance lands.")));
  }
  function PickupCard({ j, n }) {
    const fb = n.lines.find((l) => l.id === "foodbank"), d = n.donation;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Chan, { id: "foodbank" }), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, d ? `${d.partner} collects` : "The food bank's pickup")), /* @__PURE__ */ React.createElement(Badge, { tone: d && d.status === "collected" ? "green" : void 0, icon: d && d.status === "collected" ? "check" : "calendar" }, !d ? "being booked" : d.status === "collected" ? "collected" : d.status === "declined" ? "declined" : d.date ? `${d.date}${d.time ? ` · ${d.time}` : ""}` : d.status === "confirmed" ? "confirmed" : "booked")), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, num(fb.units), " packs from ", j.dist.godown, ", with the FSSAI checklist. ", d && d.status === "declined" ? "The food bank declined, so the packs stay at your godown." : "Their volunteers collect; nothing goes on your van."));
  }
  function EarlierDeliveries({ dist, s }) {
    const { go } = useRoute();
    const past = P().distBatches(dist.id, s).past.map((c) => ({ c, rows: P().deliveriesPast(P().historyFacts(c)) })).filter((x) => x.rows.length);
    if (!past.length) return null;
    return /* @__PURE__ */ React.createElement("section", { className: "stack snug", "aria-label": "Earlier deliveries" }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "What left your godown for the batches you cleared, newest first" }, "Earlier deliveries"), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, past.map(({ c, rows }) => /* @__PURE__ */ React.createElement(Card, { key: c.ref, className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(BatchLine, { sku: c.sku, id: c.ref, size: 40, badge: /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" }), sub: `cleared ${day(c.cleared)}` }), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", iconRight: "chevron-right", onClick: () => go("batches", { ref: c.ref }) }, "The batch")), /* @__PURE__ */ React.createElement("div", { className: "dist-rows" }, rows.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, className: "dist-row" }, /* @__PURE__ */ React.createElement(Chan, { id: r.id, icon: r.id === "kirana" ? "route" : r.id === "expiresoon" ? "truck" : void 0 }), /* @__PURE__ */ React.createElement("span", { className: "grow stack tight", style: { gap: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, r.title), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, r.sub)), /* @__PURE__ */ React.createElement("time", { className: "t-footnote subtle" }, when(r.at)))))))));
  }
  function VanRoute({ me }) {
    const s = useStore();
    const { route, go } = useRoute();
    const dist = distOf(me), js = P().journeys(dist.id, s), ns = P().distNow(dist.id, s);
    const ref = route && route.params && route.params.ref;
    const j = js.find((x) => x.ref === ref) || js[0], n = j && ns.find((x) => x.ref === j.ref);
    const past = /* @__PURE__ */ React.createElement(EarlierDeliveries, { dist, s });
    if (!j) return /* @__PURE__ */ React.createElement(Screen, { me, title: "Deliveries", sub: `${dist.name} · ${dist.cluster}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 560 } }, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "Nothing goes out now", body: "While a batch is in a journey, its van round, the buyer's truck, the staff sale and the pickup show here." })), past));
    const has = (id) => j.lines.some((l) => l.id === id);
    const head = /* @__PURE__ */ React.createElement(PtHead, { sku: j.sku, id: j.ref, where: `${dist.godown}, ${dist.city}`, badge: stopBadge(j), line: "What leaves your godown for this batch, line by line" }, /* @__PURE__ */ React.createElement(Switcher, { js, value: j.ref, onChange: (r) => go("van", { ref: r }) }));
    const staff = has("staff") && n.staff ? /* @__PURE__ */ React.createElement(StaffSale, { staff: Object.assign({}, n.staff, { godown: dist.godown, left: n.staff.sold == null ? 0 : n.staff.units - n.staff.sold }), dist, product: shortName(j.sku), clears: (M.CHANNELS.find((x) => x.id === "staff") || {}).clears }) : null;
    const side = [has("expiresoon") && /* @__PURE__ */ React.createElement(TruckCard, { key: "truck", j, n }), staff && /* @__PURE__ */ React.createElement(Fragment, { key: "staff" }, staff), has("foodbank") && /* @__PURE__ */ React.createElement(PickupCard, { key: "pickup", j, n })].filter(Boolean);
    const main = has("kirana") ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(VanCard, { j, n }), /* @__PURE__ */ React.createElement(Stops, { n })) : null;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Deliveries", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 24 } }, !n.approved ? /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 560 } }, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "Nothing leaves yet", body: `Once ${D.WORKSPACE.short} says yes to the plan for this batch, its van round, the buyer's truck, the staff sale and the pickup show here, each as its plan has it.` })) : main && side.length ? /* @__PURE__ */ React.createElement(Columns, { sideWidth: 380, main, side }) : /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 720 } }, main, side), past));
  }
  function CameraScreen({ me, realCamera }) {
    const s = useStore();
    const dist = distOf(me);
    const ns = P().distNow(dist.id, s);
    const cur = ns.find((n) => n.photo === "requested" || n.photo === "reading" || n.photo === "verified" && !n.approved);
    const story = ns.filter((n) => n !== cur && n.ref === HERO.id && s.hero.photo.at).map((n) => ({ ref: n.ref, sku: D.SKUS[n.sku], sent: `${D.DAY0}T${s.hero.photo.at}`, bestBefore: HERO.bestBefore, mfg: HERO.mfg, mrp: D.SKUS[n.sku].mrp }));
    const earlier = story.concat(P().distBatches(dist.id, s).past.map((c) => P().photoOf(P().historyFacts(c))).filter(Boolean));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Label photo", sub: cur ? `Batch ${cur.ref}${cur.shelf ? ` · shelf ${cur.shelf}` : ""}` : "Requests from the Vision agent", back: "Today" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 24 } }, cur ? /* @__PURE__ */ React.createElement(CameraInner, { realCamera, n: cur }) : /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 560, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement(Empty, { img: "phone-scan", title: "No label photo asked for now", body: "When a batch needs checking, Vision asks here for one picture of a carton label." })), earlier.length > 0 && /* @__PURE__ */ React.createElement("section", { className: "stack snug", "aria-label": "Earlier label photos", style: { maxWidth: 720, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Every label photo you sent, and what Vision read from it" }, "Earlier label photos"), /* @__PURE__ */ React.createElement("div", { className: "list" }, earlier.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.ref, className: "list-row dist-photo" }, /* @__PURE__ */ React.createElement(Product, { name: r.sku.img, size: 40, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, r.sku.name, " ", /* @__PURE__ */ React.createElement("span", { className: "mono subtle" }, r.ref)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Vision read batch ", r.ref, r.mfg ? `, made ${fmt.date(r.mfg)}` : "", ", best before ", fmt.date(r.bestBefore), ", MRP ", rate(r.mrp)), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Sent ", when(r.sent))), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "verified")))))));
  }
  const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"], PHOTO_MAX_MB = 8;
  const PHOTO_RULE = `JPEG, PNG or WebP, under ${PHOTO_MAX_MB} MB`;
  const CAM_BLOCKED = "The camera is blocked for this page. Allow it in the browser's site settings, or upload a photo.";
  const CAM_NONE = "No camera was found. Upload a photo instead.";
  function CameraInner({ realCamera, n }) {
    const s = useStore();
    const h = s.hero;
    const { go } = useRoute();
    const reduce = useReducedMotion();
    const app = useApp();
    const sku = D.SKUS[n.sku], batch = D.BATCHES.find((b) => b.id === n.ref) || HERO;
    const phoneCam = useRef(null), files = useRef(null), video = useRef(null), stream = useRef(null);
    const [shot, setShot] = useState(null);
    const [flash, setFlash] = useState(false);
    const [sending, setSending] = useState(false);
    const [camOn, setCamOn] = useState(false);
    const [camLive, setCamLive] = useState(null);
    const [over, setOver] = useState(false);
    const [err, setErr] = useState(null);
    const [ratio, setRatio] = useState(null);
    const sent = h.photo.status === "reading" || h.photo.status === "verified";
    const live = S.useLive();
    const uploading = !!live && live.uploads.photo != null;
    const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    const desk = !coarse && app.bp !== "phone";
    const stopCam = () => {
      if (stream.current) stream.current.getTracks().forEach((t) => t.stop());
      stream.current = null;
      setCamLive(null);
      setCamOn(false);
    };
    useEffect(() => () => {
      if (stream.current) stream.current.getTracks().forEach((t) => t.stop());
    }, []);
    const use = (f, how) => {
      setOver(false);
      if (!f) return;
      if (!PHOTO_TYPES.includes(f.type)) {
        setErr("That file is not a photo Vision can read. Send a JPEG, PNG or WebP.");
        return;
      }
      if (f.size >= PHOTO_MAX_MB * 1048576) {
        setErr(`That photo is ${(f.size / 1048576).toFixed(1)} MB. Send one under ${PHOTO_MAX_MB} MB.`);
        return;
      }
      setErr(null);
      setRatio(null);
      setShot({ url: URL.createObjectURL(f), how, name: f.name });
    };
    const picked = (how) => (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      use(f, how);
    };
    const openCam = async () => {
      const md = navigator.mediaDevices;
      if (!md || !md.getUserMedia) {
        setErr(CAM_NONE);
        return;
      }
      setCamOn(true);
      try {
        const st = await md.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        stream.current = st;
        setCamLive(st);
      } catch (e) {
        stopCam();
        setErr(e && e.name === "NotAllowedError" ? CAM_BLOCKED : CAM_NONE);
      }
    };
    const feed = (el) => {
      video.current = el;
      if (el && camLive && el.srcObject !== camLive) {
        el.srcObject = camLive;
        el.play().catch(() => {
        });
      }
    };
    const blink = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), reduce ? 0 : 180);
    };
    const take = () => {
      setErr(null);
      if (realCamera && coarse && phoneCam.current) {
        phoneCam.current.click();
        return;
      }
      if (realCamera && live) {
        openCam();
        return;
      }
      blink();
      setTimeout(() => setShot({ demo: true, how: "camera" }), reduce ? 0 : 180);
    };
    const shutter = () => {
      const v = video.current;
      if (!v || !v.videoWidth) return;
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);
      blink();
      c.toBlob((b) => {
        stopCam();
        if (b) use(new File([b], "label-photo.jpg", { type: "image/jpeg" }), "camera");
      }, "image/jpeg", 0.92);
    };
    const upload = () => {
      setErr(null);
      files.current && files.current.click();
    };
    const again = () => {
      setShot(null);
      setRatio(null);
      (shot && shot.how === "camera" ? take : upload)();
    };
    const drop = sent || uploading ? {} : { onDragOver: (e) => {
      e.preventDefault();
      setOver(true);
    }, onDragLeave: () => setOver(false), onDrop: (e) => {
      e.preventDefault();
      use(e.dataTransfer.files && e.dataTransfer.files[0], "upload");
    } };
    const send = () => {
      if (live) {
        live.sendPhoto(() => Flow.act("sendPhoto"));
        return;
      }
      setSending(true);
      setTimeout(() => {
        setSending(false);
        Flow.act("sendPhoto");
      }, 700);
    };
    const busy = sent || uploading;
    const photo = shot && !shot.demo;
    const caption = shot ? "Check that you can read the batch, both dates and the MRP." : camOn ? "Hold the label flat to the camera, close enough to read." : desk ? `${PHOTO_RULE}. Or drop a photo on the frame.` : `Take a photo opens your camera. ${PHOTO_RULE}.`;
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement("div", { className: cx("cam", camOn && "landscape"), style: photo && ratio ? { aspectRatio: String(ratio) } : void 0, ...drop }, photo ? /* @__PURE__ */ React.createElement(motion.img, { key: shot.url, className: "cam-feed whole", src: shot.url, alt: "Your photo of the carton label", onLoad: (e) => setRatio(Math.max(0.75, Math.min(1.5, e.target.naturalWidth / e.target.naturalHeight))), initial: reduce ? false : { opacity: 0, scale: 1.02 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }) : camOn ? /* @__PURE__ */ React.createElement("video", { ref: feed, className: "cam-feed", playsInline: true, muted: true, "aria-label": "The laptop's camera" }) : /* @__PURE__ */ React.createElement(S.LabelShot, { cover: true, dim: !shot && !busy }), !shot && !busy && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cam-frame", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("div", { className: "cam-hint" }, camOn ? camLive ? "Fit one carton label in the frame" : "Starting the camera…" : "Like this: one carton label, close up")), !shot && !camOn && !busy && /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, "Example"), camOn && /* @__PURE__ */ React.createElement("span", { className: "cam-tag on" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Laptop camera"), shot && !busy && /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, photo && shot.how === "upload" && shot.name ? shot.name : "Your photo"), /* @__PURE__ */ React.createElement(AnimatePresence, null, over && !busy && /* @__PURE__ */ React.createElement(motion.div, { key: "d", className: "cam-drop", initial: reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.16 } }, /* @__PURE__ */ React.createElement("span", { className: "cam-drop-in" }, /* @__PURE__ */ React.createElement(Icon, { name: "image", size: 22 }), /* @__PURE__ */ React.createElement("b", null, "Drop the photo to use it")))), sent && /* @__PURE__ */ React.createElement("div", { className: "cam-hint", style: { background: "var(--green-700)" } }, /* @__PURE__ */ React.createElement(Icon, { name: h.photo.status === "verified" ? "check" : "loader", size: 14, className: h.photo.status === "verified" ? "" : "spin" }), " ", h.photo.status === "verified" ? "Verified · matches your records" : "Sent · Vision is reading the label"), /* @__PURE__ */ React.createElement(AnimatePresence, null, flash && /* @__PURE__ */ React.createElement(motion.div, { key: "f", className: "cam-flash", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } })), h.photo.status === "reading" && !reduce && /* @__PURE__ */ React.createElement(motion.div, { "aria-hidden": "true", className: "cam-scan", animate: { top: ["20%", "76%", "20%"] }, transition: { duration: 1.6, repeat: 2, ease: "easeInOut" } })), sent ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Aura, { on: h.photo.status === "reading", className: "icontile", style: { borderRadius: 12, width: 40, height: 40 } }, /* @__PURE__ */ React.createElement(Icon, { name: h.photo.status === "verified" ? "badge-check" : "scan-line", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, h.photo.status === "verified" ? "Done. Dhanyavaad, Rakesh bhai." : "Reading batch, dates and MRP"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, h.photo.status === "verified" ? "The plan for this batch will reach Priya in a few minutes." : "This takes a few seconds."))), h.photo.status === "verified" && /* @__PURE__ */ React.createElement(List, null, [["Batch", n.ref], ["Best before", fmt.date(batch.bestBefore)], ["MRP", rate(sku.mrp)]].map(([k, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, value: v }))), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, onClick: () => go("home") }, "Back to today")) : uploading ? /* @__PURE__ */ React.createElement(S.Live.SendFill, { p: live.uploads.photo, onCancel: () => live.cancelUpload("photo") }) : /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait", initial: false }, shot ? /* @__PURE__ */ React.createElement(motion.div, { key: "send", className: "row", style: { gap: 10 }, initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", icon: shot.how === "camera" ? "rotate-ccw" : "image", onClick: again, style: { flex: "none" } }, shot.how === "camera" ? "Retake" : "Choose another"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "send", loading: sending, onClick: send }, "Send photo")) : camOn ? /* @__PURE__ */ React.createElement(motion.div, { key: "cam", className: "cam-bar", initial: reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.16 } }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: stopCam }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "shutter", "aria-label": "Take the photo", disabled: !camLive, onClick: shutter }, /* @__PURE__ */ React.createElement("span", null)), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", icon: "image", onClick: () => {
      stopCam();
      upload();
    } }, "Upload")) : /* @__PURE__ */ React.createElement(motion.div, { key: "two", className: "cam-two", initial: reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.16 } }, /* @__PURE__ */ React.createElement(Button, { variant: desk ? "secondary" : "primary", size: "lg", icon: "camera", onClick: take }, "Take a photo"), /* @__PURE__ */ React.createElement(Button, { variant: desk ? "primary" : "secondary", size: "lg", icon: "upload", onClick: upload }, "Upload a photo"))), /* @__PURE__ */ React.createElement("input", { ref: phoneCam, type: "file", accept: PHOTO_TYPES.join(","), capture: "environment", onChange: picked("camera"), className: "sr-only", tabIndex: -1, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("input", { ref: files, type: "file", accept: PHOTO_TYPES.join(","), onChange: picked("upload"), className: "sr-only", tabIndex: -1, "aria-hidden": "true" }), err && !busy ? /* @__PURE__ */ React.createElement("p", { className: "cam-alert", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "triangle-alert", size: 15 }), err) : uploading ? /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle", style: { textAlign: "center", margin: 0 } }, "A slow connection only slows the send.") : !sent && realCamera && /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle", style: { textAlign: "center", margin: 0 } }, live ? caption : `${caption} In this prototype a stub stands in for Gemini vision and returns the batch record.`));
  }
  const DZ_SLOTS = [
    { id: "before", n: 1, title: "Before", hint: "The packs at your godown, the batch label in view", alt: "The expired packs at the godown, the carton's batch label in view" },
    { id: "after", n: 2, title: "After", hint: "Slit open at the landfill, the slate in view", alt: "The packs slit open in a landfill pit, a slate with the batch, the count and the date" }
  ];
  const DZ_SAY = {
    reading: ["scan-line", "Vision is checking your photos", "The batch on the label, the count in view, and the slate"],
    checked: ["hourglass", "Sent for approval", "is reviewing your evidence. The credit note follows the yes."],
    approved: ["badge-check", "Approved · you are credited", "The expiry credit note and the agency's certificate are in your papers."]
  };
  function DzSlot({ slot, ref_, shot, busy, onTake, onUpload }) {
    const example = `${IMG()}evidence/${ref_}-${slot.id}.webp`;
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight dz-slot" }, /* @__PURE__ */ React.createElement("div", { className: "cam dz-cam" }, /* @__PURE__ */ React.createElement("img", { className: "cam-feed whole", src: shot ? shot.url || example : example, alt: shot ? slot.alt : "", "aria-hidden": shot ? void 0 : "true", style: shot ? void 0 : { opacity: 0.55 } }), !shot && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cam-frame", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, "Example")), shot && /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, slot.n, " · ", slot.title), /* @__PURE__ */ React.createElement("div", { className: "cam-hint" }, slot.hint)), !busy && /* @__PURE__ */ React.createElement("div", { className: "cam-two" }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: shot ? "ghost" : "secondary", icon: shot ? "rotate-ccw" : "camera", "aria-label": `${shot ? "Retake" : "Take"} the ${slot.id} photo`, onClick: onTake }, shot ? "Retake" : "Take"), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", icon: "upload", "aria-label": `Upload the ${slot.id} photo`, onClick: onUpload }, "Upload")));
  }
  function DestroyScreen({ me }) {
    const s = useStore();
    const dist = distOf(me);
    const { route, go } = useRoute();
    const live = S.useLive();
    const reduce = useReducedMotion();
    const ns = P().distNow(dist.id, s), ref = route.params && route.params.ref;
    const n = ns.find((x) => x.destruction && x.ref === ref) || ns.find((x) => x.destruction);
    const agencies = D.SETUP.destruction.agencies.filter((a2) => a2.city === dist.city);
    const [shots, setShots] = useState({});
    const [agency, setAgency] = useState(agencies[0] ? agencies[0].id : "");
    const [cert, setCert] = useState("");
    const [err, setErr] = useState(null);
    const [sending, setSending] = useState(false);
    const cam = useRef({}), pick = useRef({});
    const C = D.CLIENT.short, op = D.PEOPLE.priya;
    if (!n) return /* @__PURE__ */ React.createElement(Screen, { me, title: "Destroy expired packs", sub: "Requests from the client", back: "Today" }, /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 560, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement(Empty, { img: "godown", title: "No destruction asked for now", body: `When packs expire at your godown and no channel took them, ${C} asks here for the evidence of their destruction.` })));
    const d = n.destruction, sku = D.SKUS[n.sku], due = d.status === "requested" || d.status === "asked";
    const a = agencies.find((x) => x.id === agency);
    const his = Math.round(d.units * sku.dp * sku.gst * 100) / 100;
    const use = (id, f, how) => {
      if (!f) return;
      if (!PHOTO_TYPES.includes(f.type)) {
        setErr("That file is not a photo Vision can read. Send a JPEG, PNG or WebP.");
        return;
      }
      if (f.size >= PHOTO_MAX_MB * 1048576) {
        setErr(`That photo is ${(f.size / 1048576).toFixed(1)} MB. Send one under ${PHOTO_MAX_MB} MB.`);
        return;
      }
      setErr(null);
      setShots((x) => Object.assign({}, x, { [id]: { url: URL.createObjectURL(f), file: f, how } }));
    };
    const picked = (id) => (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      use(id, f, "upload");
    };
    const take = (id) => {
      setErr(null);
      if (live && cam.current[id]) cam.current[id].click();
      else setShots((x) => Object.assign({}, x, { [id]: { demo: true, how: "camera" } }));
    };
    const upload = (id) => {
      setErr(null);
      if (pick.current[id]) pick.current[id].click();
    };
    const ready = shots.before && shots.after && a && cert.trim().length >= 4;
    const send = () => {
      if (!ready) return;
      const x = { agency: a, certificate: cert.trim(), before: shots.before.file, after: shots.after.file };
      if (live && live.destruction) {
        live.destruction("send", x);
        return;
      }
      setSending(true);
      setTimeout(() => {
        setSending(false);
        setShots({});
        setCert("");
        Flow.act("sendDestruction", x);
      }, 700);
    };
    const say = DZ_SAY[d.status];
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Destroy expired packs", sub: `Batch ${n.ref} · ${dist.godown}`, back: "Today" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 640, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement(BatchLine, { sku, id: n.ref, badge: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: due ? "amber" : d.status === "approved" ? "green" : "blue", dot: d.status !== "approved" }, due ? "for you" : d.status === "approved" ? "approved" : "sent"), sub: `${fmt.num(d.units)} packs expired at ${dist.godown}` }), d.status === "asked" && /* @__PURE__ */ React.createElement("p", { className: "cam-alert", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 15 }), op.short, " asked again: ", d.reason), due ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, "Destroy the ", fmt.num(d.units), " packs through an authorised agency, then send the two photos and the agency's certificate number. ", op.short, " at ", C, " approves, and ", C, " credits you the dealer price, the GST you reverse and the agency's charges."), /* @__PURE__ */ React.createElement("div", { className: "dz-two" }, DZ_SLOTS.map((sl) => /* @__PURE__ */ React.createElement(DzSlot, { key: sl.id, slot: sl, ref_: n.ref, shot: shots[sl.id], busy: sending, onTake: () => take(sl.id), onUpload: () => upload(sl.id) }))), DZ_SLOTS.map((sl) => /* @__PURE__ */ React.createElement(Fragment, { key: sl.id }, /* @__PURE__ */ React.createElement("input", { ref: (el) => cam.current[sl.id] = el, type: "file", accept: PHOTO_TYPES.join(","), capture: "environment", onChange: picked(sl.id), className: "sr-only", tabIndex: -1, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("input", { ref: (el) => pick.current[sl.id] = el, type: "file", accept: PHOTO_TYPES.join(","), onChange: picked(sl.id), className: "sr-only", tabIndex: -1, "aria-hidden": "true" }))), /* @__PURE__ */ React.createElement("div", { className: "dz-fields" }, /* @__PURE__ */ React.createElement(K.Field, { label: "Agency", htmlFor: "dz-agency", help: a ? `Authorisation ${a.auth}` : void 0 }, /* @__PURE__ */ React.createElement(K.Select, { id: "dz-agency", value: agency, onChange: (e) => setAgency(e.target.value) }, agencies.map((x) => /* @__PURE__ */ React.createElement("option", { key: x.id, value: x.id }, x.name)))), /* @__PURE__ */ React.createElement(K.Field, { label: "Agency's certificate number", htmlFor: "dz-cert" }, /* @__PURE__ */ React.createElement(K.Input, { id: "dz-cert", value: cert, onChange: (e) => setCert(e.target.value), placeholder: a ? `${a.series.prefix}0000` : "", spellCheck: false, autoCapitalize: "characters" }))), err && /* @__PURE__ */ React.createElement("p", { className: "cam-alert", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "triangle-alert", size: 15 }), err), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "send", loading: sending, disabled: !ready, "aria-describedby": "dz-need", onClick: send }, "Send to ", C, " for approval"), /* @__PURE__ */ React.createElement("span", { id: "dz-need", className: "t-caption subtle" }, ready ? `Then reverse ${fmt.inr2(his)} of input GST on these packs in your GSTR-3B (Table 4(B)(1)). ${possessive(C)} credit note makes it good.` : `Both photos and the certificate number are needed. ${PHOTO_RULE}.`)) : /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Aura, { on: d.status === "reading", className: "icontile", style: { borderRadius: 12, width: 40, height: 40 } }, /* @__PURE__ */ React.createElement(Icon, { name: say[0], size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, say[1]), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, d.status === "checked" ? `${op.short} at ${C} ${say[2]}` : say[2]))), /* @__PURE__ */ React.createElement("div", { className: "dz-two" }, DZ_SLOTS.map((sl) => /* @__PURE__ */ React.createElement("div", { key: sl.id, className: "cam dz-cam" }, /* @__PURE__ */ React.createElement("img", { className: "cam-feed whole", src: `${IMG()}evidence/${n.ref}-${sl.id}.webp`, alt: sl.alt }), /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, sl.n, " · ", sl.title)))), d.status === "reading" && !reduce && /* @__PURE__ */ React.createElement("span", { className: "sr-only", role: "status" }, "Vision is checking your photos"), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, onClick: () => go(d.status === "approved" ? "batches" : "home", d.status === "approved" ? { ref: n.ref } : void 0) }, d.status === "approved" ? "Open the batch's papers" : "Back to today"))));
  }
  const possessive = (n) => /s$/.test(n) ? `${n}'` : `${n}'s`;
  function OrderRow({ o }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const { toast } = useNotice();
    const issue = () => {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        Flow.act("issueInvoice");
        toast({ text: DONE.issueInvoice, tone: "ok" });
      }, 400);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "dist-order" }, /* @__PURE__ */ React.createElement(Chan, { id: o.id }), /* @__PURE__ */ React.createElement("span", { className: "grow stack tight", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, /* @__PURE__ */ React.createElement("b", null, o.who), " · ", o.what), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, CH[o.id].name, o.at ? ` · ${when(o.at)}` : "", o.sub ? ` · ${o.sub}` : ""), o.paper && /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "dist-paper" }, /* @__PURE__ */ React.createElement(Icon, { name: "file-text", size: 13 }), /* @__PURE__ */ React.createElement("span", { className: "mono" }, o.paper.no), /* @__PURE__ */ React.createElement("span", null, o.paper.label)), o.paper.issue && /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "check", loading: busy, onClick: issue }, "Issue from Tally")), o.shops && o.shops.length > 0 && /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link t-footnote dist-toggle", "aria-expanded": open, onClick: () => setOpen(!open) }, open ? "Hide" : "Show", " the ", o.shops.length, " shops' orders"), open && /* @__PURE__ */ React.createElement("div", { className: "dist-shops" }, o.shops.map((k) => /* @__PURE__ */ React.createElement("span", { key: k.name }, /* @__PURE__ */ React.createElement("b", null, k.name), k.at && /* @__PURE__ */ React.createElement("em", null, when(k.at)), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, k.units))))), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, o.amount ? fmt.inr(o.amount) : "given"));
  }
  function DistOrders({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const Px = P();
    const dist = distOf(me);
    const now = Px.distNow(dist.id, s).map((n) => {
      const j = Px.journeyOf(n);
      return { ref: n.ref, sku: j.sku, live: true, j, rows: Px.ordersNow(n, Px.shopName) };
    });
    const past = Px.distBatches(dist.id, s).past.map((c) => ({ ref: c.ref, sku: c.sku, live: false, outcome: c.outcome, cleared: c.cleared, rows: Px.ordersPast(Px.historyFacts(c), Px.shopName) })).filter((b) => b.rows.length);
    const book = now.concat(past);
    const all2 = book.flatMap((b) => b.rows), total = Math.round(all2.reduce((t, o) => t + o.amount, 0) * 100) / 100;
    const shops = all2.filter((o) => o.id === "kirana").reduce((t, o) => t + o.shops.length, 0), lots = all2.filter((o) => o.id === "expiresoon").length, sales = all2.filter((o) => o.id === "staff").length;
    const sum = (rows) => Math.round(rows.reduce((t, o) => t + o.amount, 0) * 100) / 100;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: `${dist.name} · what sold from each of ${D.WORKSPACE.short}'s batches, to whom, on which paper` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 960 } }, all2.length ? /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: total, size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "sold from ", D.WORKSPACE.short, "'s batches since ", D.WORKSPACE.since)), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, book.length, " ", book.length === 1 ? "batch" : "batches", " · ", shops, " kiranas' scheme orders · ", lots, " ExpireSoon ", lots === 1 ? "lot" : "lots", " · ", sales, " staff ", sales === 1 ? "sale" : "sales", ". The price support is on each batch's papers.")) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "No orders yet", body: "When a batch's scheme, lot or staff sale sells, each order shows here under its batch." })), book.map((b) => /* @__PURE__ */ React.createElement(Card, { key: b.ref, className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(BatchLine, { sku: b.sku, id: b.ref, size: 44, badge: b.live ? stopBadge(b.j) : /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: b.outcome, size: "sm" }), sub: b.live ? b.j.phase === "cleared" ? "cleared · every order" : b.rows.length ? "orders so far" : "no orders yet" : `cleared ${day(b.cleared)}` }), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, b.rows.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(sum(b.rows))), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", iconRight: "chevron-right", onClick: () => go("batches", { ref: b.ref }) }, "Papers"))), b.rows.length ? /* @__PURE__ */ React.createElement("div", { className: "dist-orders" }, b.rows.map((o) => /* @__PURE__ */ React.createElement(OrderRow, { key: o.id, o }))) : /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: 0 } }, b.j.waiting || "Its orders show here as they come in.")))));
  }
  const stopOf = (phase) => ({ "at-risk": "Verify", verified: "Value", valued: "Decide", planned: "Approve", approved: "Execute", executing: "Execute", dispatched: "Settle", settled: "Settle", cleared: "Report" })[phase] || "Detect";
  function DistBatches({ me }) {
    const s = useStore();
    const { route, go } = useRoute();
    const phone = useApp().bp === "phone";
    const dist = distOf(me);
    const ref = route && route.params && route.params.ref;
    if (ref) return /* @__PURE__ */ React.createElement(DistBatch, { me, dist, id: ref });
    const { journey, watching, past } = P().distBatches(dist.id, s);
    const credit = past.reduce((t, c) => t + creditOf(c), 0);
    const notes = past.reduce((t, c) => t + c.docs.filter((d) => (d.id === "support" || d.id === "expiry") && d.status !== "not required").length, 0);
    const months = [];
    past.forEach((c) => {
      const m = c.cleared.slice(0, 7);
      let g = months.find((x) => x.m === m);
      if (!g) months.push(g = { m, label: monthOf(c.cleared), items: [] });
      g.items.push(c);
    });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Batches", sub: `${dist.name} · every batch of ${D.WORKSPACE.short}'s the Watcher flagged at your godown` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, journey.length ? /* @__PURE__ */ React.createElement(List, { head: "In a journey now" }, journey.map((b) => {
      const sku = D.SKUS[b.sku];
      const phase = b.hero ? s.hero.phase : s.mango.phase;
      return /* @__PURE__ */ React.createElement(
        ListRow,
        {
          key: b.id,
          chevron: true,
          onClick: () => go("batches", { ref: b.id }),
          leading: /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 40 }),
          title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, sku.name), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true, live: true }, stopOf(phase))),
          sub: `${b.id} · flagged ${day(D.DAY0)} · the agents act in your name`,
          value: phone ? null : `${fmt.num(b.hero ? D.PLAN.units : D.MANGO_PLAN.units)} packs`
        }
      );
    })) : null, past.length ? /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: credit, size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "from ", D.WORKSPACE.short, " since July")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, past.length, " batches cleared at your godown. On each, the price support (and on expiry day the expiry credit) made up the gap to the dealer price you paid, so you ended whole: ", /* @__PURE__ */ React.createElement("b", null, notes, " credit notes"), ", each in its batch's papers.")) : null, months.map((g) => /* @__PURE__ */ React.createElement(List, { key: g.m, head: `Cleared · ${g.label}` }, g.items.map((c) => {
      const cr = creditOf(c);
      const p = P().distPapers(c);
      return /* @__PURE__ */ React.createElement(
        ListRow,
        {
          key: c.ref,
          chevron: true,
          onClick: () => go("batches", { ref: c.ref }),
          leading: /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: 40 }),
          title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, c.sku.name), !phone && /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" })),
          sub: `${c.ref} · flagged ${day(c.flagged)} · cleared ${day(c.cleared)}`,
          value: /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(cr)), /* @__PURE__ */ React.createElement("em", null, p.mine.filter((d) => d.status !== "not required").length + p.copies.length, " papers"))
        }
      );
    }))), watching.length ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "From your nightly DMS export: nothing at risk" }, "Watching"), /* @__PURE__ */ React.createElement("div", { className: "list" }, watching.map((b) => /* @__PURE__ */ React.createElement(BatchRow, { key: b.id, view: D.batchView(b), compact: phone, onOpen: () => {
    } })))) : null));
  }
  const DIST_TABS = [{ id: "what", label: "What happened", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }];
  function DistBatch({ me, dist, id }) {
    const s = useStore();
    const reduce = useReducedMotion();
    const [tab, setTab] = useState("what");
    const [paper, setPaper] = useState(null);
    const L = window.SC3_LEDGER;
    const past = P().distBatches(dist.id, s).past.find((c2) => c2.ref === id);
    const mine = D.BATCHES.find((b) => b.id === id && b.distributor === dist.id);
    const hero = mine && mine.hero ? mine : null, second = mine && mine.second ? mine : null;
    const c = past || (hero ? L.storyCase() : null);
    if (!c && !second) return /* @__PURE__ */ React.createElement(Screen, { me, title: "Batches", back: "Batches" }, /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "boxes", title: "Not one of your batches", body: "This batch is not at your godown." })));
    const sku = c ? c.sku : D.SKUS[second.sku];
    const head = /* @__PURE__ */ React.createElement(
      PtHead,
      {
        sku,
        id,
        where: `${dist.godown}, ${dist.city}`,
        badge: past ? /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" }) : /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true, live: true }, stopOf(hero ? s.hero.phase : s.mango.phase)),
        line: past ? `Flagged ${day(c.flagged)} · cleared ${day(c.cleared)}` : `Flagged ${day(D.DAY0)} · the agents act in your name`
      },
      /* @__PURE__ */ React.createElement(PtTabs, { tabs: DIST_TABS, value: tab, onChange: setTab, label: `${sku.name}, ${id}` })
    );
    let body;
    if (second) body = /* @__PURE__ */ React.createElement(Locked, { icon: "history", agent: "Smart-Clearance", text: `The agents act in your name on ${sku.name}: its moments, its money and its papers show here once it settles.` });
    else if (tab === "what") body = /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(PtMoments, { items: past ? P().moments(c) : P().storyMoments(s) }));
    else if (tab === "money") body = /* @__PURE__ */ React.createElement(WholeCard, { c, story: !past, s, onPaper: setPaper });
    else body = /* @__PURE__ */ React.createElement(DistPapers, { c, ready: !!past || !!s.hero.docs, onOpen: setPaper });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: sku.name, back: "Batches", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement(motion.div, { key: tab, initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] }, className: "pt-body" }, body), c && /* @__PURE__ */ React.createElement(PaperSheet, { open: !!paper, onClose: () => setPaper(null), c, id: paper, receipt: paper === "receipt" ? c.receipt : null }));
  }
  function WholeCard({ c, story, s, onPaper }) {
    const w = story ? P().storyWhole(s) : P().whole(c);
    const open = story && s.hero.phase !== "cleared";
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "You end whole"), /* @__PURE__ */ React.createElement(Badge, { tone: open ? void 0 : "green", icon: open ? "clock" : "check" }, open ? "on the plan" : "settled")), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, w.rows.map((r) => /* @__PURE__ */ React.createElement(PtLine, { key: r.k, k: r.k, sub: r.sub, v: fmt.inr(r.v), onClick: r.paper && !story ? () => onPaper(r.paper) : null })), /* @__PURE__ */ React.createElement("div", { className: "hairline", style: { margin: "4px 0" } }), /* @__PURE__ */ React.createElement(PtLine, { k: "What you receive", v: fmt.inr(w.recv), strong: true }), /* @__PURE__ */ React.createElement(PtLine, { k: "What you paid", sub: w.extra ? `${fmt.num(w.units)} × ₹${w.dp}, the van, the listing fee, the GST you reverse and the agency's charges` : `${fmt.num(w.units)} × ₹${w.dp}, the van and the listing fee`, v: fmt.inr(-w.paid) }), /* @__PURE__ */ React.createElement(PtLine, { k: "Your gain or loss", v: fmt.inr(w.gain), strong: true })), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Instead of waiting weeks for an expiry claim, with no claim paperwork."));
  }
  function DistPapers({ c, ready, onOpen }) {
    if (!ready) return /* @__PURE__ */ React.createElement(Locked, { icon: "file-text", agent: "Paperwork agent", text: "Drafts your tax invoice to the buyer and Munchly's price-support credit note to you once every line of the plan is done." });
    const p = P().distPapers(c);
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pt-head" }, "Your papers"), /* @__PURE__ */ React.createElement("div", { className: "pt-papers" }, p.mine.map((d) => /* @__PURE__ */ React.createElement(PaperRow, { key: d.id, c, d, onOpen })))), p.copies.length ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pt-head" }, "Copies for your records"), /* @__PURE__ */ React.createElement("div", { className: "pt-papers" }, p.copies.map((d) => /* @__PURE__ */ React.createElement(PaperRow, { key: d.id, c, d, onOpen })))) : null, /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "Each opens on paper with its PDF. ", D.WORKSPACE.short, "'s own GST memo and FSSAI checklist stay with ", D.WORKSPACE.short, "."));
  }
  const offerMath = (n) => {
    const free = Math.floor(n / 12) * 2, paid = n - free, pack = KL.packPrice;
    return { n, free, paid, pack, pay: paid * pack, sell: n * CHIPS.mrp, margin: n * CHIPS.mrp - paid * pack };
  };
  function OfferCard({ onOpen, compact, shop }) {
    const [en, setEn] = useState(false);
    const p0 = D.PUSH.offer;
    const name = shop || "Shree Ganesh Kirana";
    const p = Object.assign({}, p0, { body: p0.body.replace("Shree Ganesh Kirana", name) });
    return /* @__PURE__ */ React.createElement("div", { className: "bezel" }, /* @__PURE__ */ React.createElement("div", { className: "card raised", style: { padding: compact ? 16 : 22, display: "grid", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Mark, { size: 28 }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle strong" }, "Rakesh Traders · ", p.at)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => setEn(!en), "aria-pressed": en }, en ? /* @__PURE__ */ React.createElement("span", { lang: "hi" }, "हिन्दी में पढ़ें") : "Read in English")), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14, alignItems: "center" } }, /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: compact ? 76 : 96, float: true }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 4 } }, /* @__PURE__ */ React.createElement("div", { className: cx("t-title2", !en && "hi"), lang: en ? "en" : "hi" }, en ? "Today's special offer" : p.title), /* @__PURE__ */ React.createElement("div", { className: "row base", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, "₹", KL.packPrice.toFixed(2)), /* @__PURE__ */ React.createElement("span", { className: "subtle t-subhead" }, "a packet · MRP ₹", CHIPS.mrp)), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "gift" }, en ? "Buy 10, get 2 free" : /* @__PURE__ */ React.createElement("span", { lang: "hi" }, "10 लो, 2 मुफ़्त")), /* @__PURE__ */ React.createElement(Badge, { icon: "clock" }, en ? "48 hours" : /* @__PURE__ */ React.createElement("span", { lang: "hi" }, "सिर्फ़ 48 घंटे"))))), /* @__PURE__ */ React.createElement("p", { className: cx("t-body", !en && "hi"), lang: en ? "en" : "hi", style: { margin: 0, lineHeight: 1.55 } }, en ? p.en : p.body), onOpen && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, iconRight: "arrow-right", onClick: onOpen }, en ? "See the offer" : /* @__PURE__ */ React.createElement("span", { lang: "hi" }, "ऑफर देखें"))));
  }
  const OFFER_STATUS = { open: { label: "Open", tone: "blue", icon: "clock" }, ordered: { label: "Ordered", tone: "green", icon: "check" }, declined: { label: "Declined", icon: "x" }, expired: { label: "Expired", icon: "clock" } };
  function OfferStatus({ o, size }) {
    const x = OFFER_STATUS[o.status];
    return /* @__PURE__ */ React.createElement(Badge, { size, tone: x.tone, icon: x.icon }, o.status === "ordered" ? `Ordered · ${o.units}` : x.label);
  }
  const whyText = (o) => o.status === "declined" ? `You declined on ${when(o.declinedAt)}` : o.why === "filled" ? `The scheme filled on ${when(o.closed)} before you ordered` : o.status === "expired" ? `Its 48 hours ended on ${when(o.closed)}` : null;
  function RetailHome({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const { toast } = useNotice();
    const k = kOf(me);
    const shop = shopOf(me);
    const dist = D.DISTRIBUTORS[shop.distributor];
    const list = P().offersFor(shop, s);
    const now = list.find((o) => o.story);
    const top = now && (now.status === "ordered" || now.open) ? now : null;
    const earlier = list.filter((o) => o !== top);
    const no = () => {
      Flow.act("decline", shop.id);
      toast({ text: `Declined · ${dist.short}'s next scheme still comes to you` });
    };
    const after = () => {
      Store.update((st) => {
        if (st.hero.declined) delete st.hero.declined[shop.id];
      });
      go("offer");
    };
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Offers", sub: `${k.name} · ${k.area}, ${dist.city}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, top && top.status === "open" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(OfferCard, { shop: k.name, onOpen: () => go("offer") }), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "lg", block: true, onClick: no }, "Not this time")) : top && top.status === "ordered" ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Product, { name: top.sku.img, size: 64 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Ordered · ", top.units, " packets"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, top.sku.name, " · placed ", top.orderedAt.slice(11), " · comes on ", D.JOURNEY.van.day, "'s van")), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "confirmed"))) : top && top.status === "declined" ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Product, { name: top.sku.img, size: 64 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "You said not this time"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, top.sku.name, " · declined ", when(top.declinedAt), ". The offer stays open until ", when(top.closed), " if you change your mind."))), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, onClick: after }, "Order after all")) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "kirana", title: "No open offer", body: `${dist.short}'s schemes arrive here as a notification, in Hindi, ready to order in one tap.` })), earlier.length ? /* @__PURE__ */ React.createElement(List, { head: "Earlier offers" }, earlier.map((o) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: o.ref,
        chevron: true,
        onClick: () => go("offer", { ref: o.ref }),
        leading: /* @__PURE__ */ React.createElement(Product, { name: o.sku.img, size: 40 }),
        title: o.sku.name,
        sub: `${day(o.sent)} · ${o.dist.short} · ₹${o.pack.toFixed(2)} a packet`,
        value: /* @__PURE__ */ React.createElement(OfferStatus, { o, size: "sm" })
      }
    ))) : null, /* @__PURE__ */ React.createElement(SectionTitle, null, "Your shop"), /* @__PURE__ */ React.createElement(List, null, [["Distributor", `${dist.name}, ${dist.city}`], ["Van day", D.JOURNEY.van.day], ["Unsold scheme packs", `back to the salesman until ${fmt.day(D.RETURN_BY)}`], ["Language", "हिन्दी · English"]].map(([a, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: a, title: a, value: a === "Language" ? /* @__PURE__ */ React.createElement("span", { lang: "hi" }, v) : v })))));
  }
  function OfferPage({ me, o }) {
    const head = /* @__PURE__ */ React.createElement(PtHead, { sku: o.sku, id: o.ref, where: `From ${o.dist.short}`, badge: /* @__PURE__ */ React.createElement(OfferStatus, { o, size: "sm" }), line: `Sent ${when(o.sent)}` });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: o.sku.name, back: "Offers", below: head, hideLarge: true }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, o.status === "ordered" ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Your order"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, o.van ? `delivered ${weekday(o.van)}` : "on the round")), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement(PtLine, { k: `You ordered ${o.units} packets`, sub: when(o.orderedAt), v: "" }), /* @__PURE__ */ React.createElement(PtLine, { k: "You paid", sub: `${o.m.paid} × ₹${o.pack.toFixed(2)}`, v: fmt.inr(o.m.pay) }), /* @__PURE__ */ React.createElement(PtLine, { k: "Free packets", sub: "2 with every 10", v: o.m.free }), /* @__PURE__ */ React.createElement(PtLine, { k: "You sell at MRP", sub: `${o.units} × ₹${o.mrp}`, v: fmt.inr(o.m.sell) }), /* @__PURE__ */ React.createElement("div", { className: "hairline", style: { margin: "4px 0" } }), /* @__PURE__ */ React.createElement(PtLine, { k: "Your margin", v: fmt.inr(o.m.margin), strong: true })), o.van && /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Delivered on ", weekday(o.van), "'s van, ", day(o.van), " · paid on delivery to ", o.dist.short)) : /* @__PURE__ */ React.createElement(Card, { className: "row top", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft" }, /* @__PURE__ */ React.createElement(Icon, { name: o.status === "declined" ? "x" : "clock", size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, o.status === "declined" ? "You said not this time" : "This offer expired"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, whyText(o), ". Nothing was ordered and nothing is owed."))), /* @__PURE__ */ React.createElement(List, { head: "What was offered" }, /* @__PURE__ */ React.createElement(ListRow, { title: "Price", value: `₹${o.pack.toFixed(2)} a packet · MRP ₹${o.mrp}` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Scheme", value: "Buy 10, get 2 free" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Your share", value: `up to ${o.share} packets` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Open for", value: "48 hours" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Best before", value: fmt.date(o.bestBefore) }))));
  }
  function OfferDetail({ me }) {
    const s = useStore();
    const { route } = useRoute();
    const ref = route && route.params && route.params.ref;
    const o = ref && P().offersFor(shopOf(me), s).find((x) => x.ref === ref);
    return o && o.status !== "open" ? /* @__PURE__ */ React.createElement(OfferPage, { me, o }) : /* @__PURE__ */ React.createElement(OfferOrder, { me });
  }
  function OfferOrder({ me }) {
    const s = useStore();
    const h = s.hero;
    const { go } = useRoute();
    const k = kOf(me);
    const [n, setN] = useState(k.units);
    const [busy, setBusy] = useState(false);
    const m = offerMath(n);
    const mine = h.orders.find((o) => o.id === k.id);
    const order = () => {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        Store.update((st) => {
          Flow.A.order(st, k.id);
          const o = st.hero.orders.find((x) => x.id === k.id);
          if (o) o.units = n;
        });
      }, 650);
    };
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Masala Chips 150 g", sub: "Rakesh Traders · scheme for 48 hours", back: "Offers" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, h.offer ? /* @__PURE__ */ React.createElement(OfferCard, { compact: true, shop: k.name }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "kirana", title: "No offer right now", body: "This offer has not been sent to your shop yet." })), !h.offer ? null : mine ? /* @__PURE__ */ React.createElement(motion.div, { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, className: "card stack", style: { padding: 22, justifyItems: "center", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "icontile", style: { width: 56, height: 56, borderRadius: 18 } }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 28, stroke: 2.4 })), /* @__PURE__ */ React.createElement("div", { className: "t-title2 hi", lang: "hi" }, "ऑर्डर हो गया"), /* @__PURE__ */ React.createElement("span", { className: "muted" }, mine.units, " packets on ", D.JOURNEY.van.day, "'s van · pay on delivery"), /* @__PURE__ */ React.createElement(Money, { value: offerMath(mine.units).margin, size: "m", style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "your margin at MRP on this order"), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", onClick: () => go("home") }, "Done")) : /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, "How many packets?"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "In twelves · your share is up to ", k.units)), /* @__PURE__ */ React.createElement(Stepper, { value: n, onChange: setN, min: 12, max: k.units, step: 12, label: "Packets" })), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, [["You pay", `${m.paid} × ₹${m.pack.toFixed(2)}`, fmt.inr(m.pay)], ["Free packets", "2 with every 10", `${m.free}`], ["You sell at MRP", `${n} × ₹${CHIPS.mrp}`, fmt.inr(m.sell)]].map(([k2, sub, v]) => /* @__PURE__ */ React.createElement("div", { key: k2, className: "row between t-subhead" }, /* @__PURE__ */ React.createElement("span", null, k2, " ", /* @__PURE__ */ React.createElement("span", { className: "subtle t-footnote" }, sub)), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, v)))), /* @__PURE__ */ React.createElement("div", { className: "row between", style: { padding: "12px 14px", borderRadius: 14, background: "var(--primary-soft)" } }, /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, "Margin today"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "₹", (m.pay / n).toFixed(2), " a packet in effect, sold at ₹", CHIPS.mrp)), /* @__PURE__ */ React.createElement(Money, { value: m.margin, size: "s", roll: true, style: { color: "var(--primary-text)" } })), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "xl", block: true, loading: busy, onClick: order }, /* @__PURE__ */ React.createElement("span", { className: "hi", lang: "hi" }, "ऑर्डर करें"), " · ", n, " packets"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle", style: { textAlign: "center" } }, "Best before 18 Nov 2026 · 47 days on every packet · unsold packs go back to the salesman until ", fmt.day(D.RETURN_BY)))));
  }
  function RetailOrders({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const k = kOf(me);
    const list = P().offersFor(shopOf(me), s).filter((o) => o.status === "ordered");
    const margin = list.reduce((t, o) => t + o.m.margin, 0), packets = list.reduce((t, o) => t + o.units, 0);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: k.name }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, list.length ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: margin, size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "your margin at MRP")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, list.length, " ", list.length === 1 ? "order" : "orders", " since July, ", fmt.num(packets), " packets, each delivered on the van with 2 free in every 12.")), /* @__PURE__ */ React.createElement(List, null, list.map((o) => /* @__PURE__ */ React.createElement(ListRow, { key: o.ref, chevron: true, onClick: () => go("offer", { ref: o.ref }), leading: /* @__PURE__ */ React.createElement(Product, { name: o.sku.img, size: 40 }), title: `${o.sku.name} · ${o.units} packets`, sub: `ordered ${when(o.orderedAt)}${o.van ? ` · ${weekday(o.van)}'s van` : " · on the round"}`, value: /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(o.m.margin)), /* @__PURE__ */ React.createElement("em", null, "margin")) })))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "shopping-basket", title: "No orders yet", body: "Orders you place from an offer show here with the van day." }))));
  }
  const OTHER_LISTINGS = D.MARKET.lots;
  function EsBar({ me, title }) {
    return /* @__PURE__ */ React.createElement("div", { className: "es-top" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "es-logo", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "hourglass", size: 16, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", { className: "es-word" }, "ExpireSoon")), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle es-tag" }, "Near-expiry B2B marketplace · dates visible"), /* @__PURE__ */ React.createElement("span", { className: "grow" }), title);
  }
  function EsDate({ days, date }) {
    return /* @__PURE__ */ React.createElement("span", { className: "es-date" }, date ? date + " · " : "", days, " days");
  }
  function ListingCard({ l, onOpen, hero }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "es-card", onClick: onOpen }, /* @__PURE__ */ React.createElement("div", { className: "es-thumb" }, hero ? /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: 92 }) : /* @__PURE__ */ React.createElement(Icon, { name: l.icon, size: 38, stroke: 1.5 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 4, padding: "12px 14px 14px" } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead", style: { lineHeight: 1.25 } }, l.name), /* @__PURE__ */ React.createElement("span", { className: "row base", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "es-price" }, "₹", l.price), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "MRP ₹", l.mrp, " · ", Math.round((1 - l.price / l.mrp) * 100), "% off")), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(EsDate, { days: l.days }), hero && /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "violet", icon: "badge-check" }, "label verified")), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, fmt.num(l.units), " units · ", l.seller)));
  }
  function Market({ me }) {
    const s = useStore();
    const h = s.hero;
    const { go } = useRoute();
    const app = useApp();
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("all");
    const hero = h.listing && { id: D.JOURNEY.listing.id, name: "Munchly Masala Chips 150 g", units: ES.units, price: 15, mrp: 30, days: 47, seller: "Rakesh Traders, Nagpur" };
    const list = [hero, ...OTHER_LISTINGS].filter(Boolean).filter((l) => (!q || l.name.toLowerCase().includes(q.toLowerCase())) && (cat === "all" || (cat === "snacks" ? /chips|biscuit|noodle/i.test(l.name) : cat === "staples" ? /atta|milk/i.test(l.name) : true)));
    return /* @__PURE__ */ React.createElement("div", { className: "esw" }, /* @__PURE__ */ React.createElement(Screen, { me, title: "Marketplace", sub: `Lots for ${D.BUYER.city} · every listing shows its dates`, hideLarge: false }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(EsBar, null), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 200 } }, /* @__PURE__ */ React.createElement(K.SearchField, { value: q, onChange: setQ, placeholder: "Search lots" })), /* @__PURE__ */ React.createElement(K.Segmented, { options: [{ id: "all", label: "All" }, { id: "snacks", label: "Snacks" }, { id: "staples", label: "Staples" }], value: cat, onChange: setCat, label: "Category" })), hero && /* @__PURE__ */ React.createElement(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: "es-feature", onClick: () => go("listing") }, /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: app.bp === "phone" ? 96 : 132, float: true }), /* @__PURE__ */ React.createElement("div", { className: "stack tight grow", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(Badge, { tone: "violet", solid: true, size: "sm" }, "new · ", h.listing.at), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "violet", icon: "badge-check" }, "label photo verified")), /* @__PURE__ */ React.createElement("div", { className: "t-title2" }, "Munchly Masala Chips 150 g · ", ES.units, " units"), /* @__PURE__ */ React.createElement("span", { className: "row base wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "es-price lg" }, "₹15"), /* @__PURE__ */ React.createElement("span", { className: "muted" }, "MRP ₹30 · 50% off"), /* @__PURE__ */ React.createElement(EsDate, { days: 47, date: "Best before 18 Nov 2026" })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Rakesh Traders, Nagpur · verified seller · dispatch ", D.MARKET.dispatchHours, " h after balance")), /* @__PURE__ */ React.createElement(Button, { variant: "violet", iconRight: "arrow-right" }, "View lot")), /* @__PURE__ */ React.createElement("div", { className: "es-grid" }, list.filter((l) => l !== hero).map((l) => /* @__PURE__ */ React.createElement(ListingCard, { key: l.id, l, onOpen: () => {
    } }))), /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle", style: { margin: 0 } }, "ExpireSoon is mocked in this prototype; the other lots are illustrative."))));
  }
  function ListingView({ readOnly, me }) {
    const s = useStore();
    const h = s.hero;
    const app = useApp();
    const [price, setPrice] = useState(13);
    const [msg, setMsg] = useState("");
    const last = h.bids[h.bids.length - 1];
    const open = !last || last.status === "declined";
    const token = Math.round(price * ES.units * M.RULES.tokenPct * 100) / 100;
    const inv = D.INVOICE;
    const place = () => Flow.act("bid", price);
    const accept = () => Flow.act("accept");
    if (!h.listing) return /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "hourglass", title: "Not listed yet", body: "The Lister posts this lot the moment the plan is approved." }));
    return /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 16, gridTemplateColumns: app.bp === "desktop" && !readOnly ? "minmax(0, 1.2fr) minmax(0, 1fr)" : "minmax(0,1fr)", alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "es-gallery" }, /* @__PURE__ */ React.createElement("div", { className: "es-thumb big" }, /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: app.bp === "phone" ? 150 : 190, float: true })), /* @__PURE__ */ React.createElement("div", { className: "es-thumb big", style: { padding: 0, overflow: "hidden", containerType: "inline-size" } }, /* @__PURE__ */ React.createElement(S.LabelPhoto, { status: "verified" }))), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("div", { className: "t-title2" }, "Munchly Masala Chips 150 g · ", ES.units, " units"), /* @__PURE__ */ React.createElement("span", { className: "row base wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "es-price lg" }, "₹15"), /* @__PURE__ */ React.createElement("span", { className: "muted" }, "a packet · MRP ₹30 · 50% off")), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(EsDate, { days: 47, date: "Best before 18 Nov 2026" }), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "violet", icon: "badge-check" }, "label photo verified"))), /* @__PURE__ */ React.createElement(List, null, [["Seller", "Rakesh Traders, Nagpur · verified"], ["Visible to", "buyers outside Munchly's distributor territories"], ["Dispatch", `${D.MARKET.dispatchHours} h after the balance · buyer pays freight`], ["Lot", `${cartons(ES.units)} · 24 × 150 g a carton`], ["Minimum order", `${D.MARKET.minOrder} units`], ["Listing", h.listing.id]].map(([k, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, value: v })))), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, !readOnly && (h.award ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile violet", style: { width: 44, height: 44, borderRadius: 14 } }, /* @__PURE__ */ React.createElement(Icon, { name: "badge-check", size: 22 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Lot won at ₹", D.COUNTER.price.toFixed(2)), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Token ", fmt.inr(D.AWARD.token), " paid · ", fmt.inr(D.AWARD.balance), " of the bid and ", fmt.inr(inv.igst), " IGST due in ", D.MARKET.balanceHours, " h"))), /* @__PURE__ */ React.createElement(List, null, [[`${ES.units} × ₹${D.COUNTER.price.toFixed(2)}`, fmt.inr2(inv.taxable)], [`IGST ${inv.gstPct}%, Maharashtra to Chhattisgarh`, fmt.inr2(inv.igst)], ["Round off", fmt.inr2(inv.roundOff)], ["Invoice total", fmt.inr2(inv.total)]].map(([k, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, value: /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, v) }))), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Rakesh Traders issues the invoice from its own Tally.")) : open ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Place a bid"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "ask ₹15.00")), /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, "Your price a packet"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "for all ", ES.units, " units")), /* @__PURE__ */ React.createElement(Stepper, { value: price, onChange: setPrice, min: 10, max: 14, step: 0.5, label: "Bid price", format: (v) => "₹" + v.toFixed(2) })), /* @__PURE__ */ React.createElement("div", { className: "row between t-subhead" }, /* @__PURE__ */ React.createElement("span", null, "15% token on your bid"), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr2(token))), /* @__PURE__ */ React.createElement(Button, { variant: "violet", size: "lg", block: true, icon: "gavel", onClick: place }, "Bid ₹", price.toFixed(2), " for ", ES.units), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Balance in ", D.MARKET.balanceHours, " h. The seller's agent replies in about a minute.")) : /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Your bid"), /* @__PURE__ */ React.createElement(Badge, { tone: last.status === "countered" ? "violet" : void 0, dot: true, live: last.status === "placed" }, last.status === "placed" ? "waiting for the seller" : last.status)), /* @__PURE__ */ React.createElement("div", { className: "row base", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "es-price lg" }, "₹", last.price.toFixed(2)), /* @__PURE__ */ React.createElement("span", { className: "muted" }, "→ counter ₹", (last.counter || D.COUNTER.price).toFixed(2))), last.status === "countered" && /* @__PURE__ */ React.createElement(Button, { variant: "violet", size: "lg", block: true, icon: "check", onClick: accept }, "Accept ₹", D.COUNTER.price.toFixed(2), " · pay ", fmt.inr(D.AWARD.token), " token"))), /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Chat with the seller"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "answered by an agent")), h.chat.length ? /* @__PURE__ */ React.createElement(S.Chat, { chat: h.chat, typing: last && last.status === "placed" }) : /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Ask about dates, dispatch or a lower price."), !readOnly && !h.award && /* @__PURE__ */ React.createElement("form", { className: "row", style: { gap: 8 }, onSubmit: (e) => {
      e.preventDefault();
      setMsg("");
    } }, /* @__PURE__ */ React.createElement("input", { className: "input grow", placeholder: "Message Rakesh Traders", value: msg, onChange: (e) => setMsg(e.target.value), "aria-label": "Message the seller" }), /* @__PURE__ */ React.createElement(IconButton, { icon: "send", label: "Send", type: "submit" })))));
  }
  function Listing({ me }) {
    return /* @__PURE__ */ React.createElement("div", { className: "esw" }, /* @__PURE__ */ React.createElement(Screen, { me, title: `Lot ${D.JOURNEY.listing.id}`, sub: "Munchly Masala Chips 150 g · Rakesh Traders, Nagpur", back: "Marketplace" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(EsBar, null), /* @__PURE__ */ React.createElement(ListingView, { me }))));
  }
  function MyBids({ me }) {
    const s = useStore();
    const h = s.hero;
    const { go } = useRoute();
    return /* @__PURE__ */ React.createElement("div", { className: "esw" }, /* @__PURE__ */ React.createElement(Screen, { me, title: "My bids", sub: `${D.BUYER.name} · ${D.BUYER.city}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(EsBar, null), h.bids.length ? /* @__PURE__ */ React.createElement("div", { className: "list", "data-x": "bids" }, h.bids.map((b) => /* @__PURE__ */ React.createElement("button", { type: "button", key: b.id, className: "list-row", onClick: () => go("listing"), style: { gridTemplateColumns: "48px minmax(0,1fr) auto", textAlign: "left", width: "100%" } }, /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: 44 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, D.JOURNEY.listing.id, " · Masala Chips 150 g · ", ES.units, " units"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "bid ₹", b.price.toFixed(2), " · ", b.at, b.counter ? ` · counter ₹${b.counter.toFixed(2)}` : "")), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: b.status === "accepted" ? "green" : "violet" }, b.status === "accepted" ? "won" : b.status)))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "marketplace-bag", title: "No bids yet", body: "Bids you place show here with the seller's reply." })))));
  }
  function Pickups({ me }) {
    const s = useStore();
    const { route, go } = useRoute();
    const ref = route && route.params && route.params.ref;
    const past = P().pickupsFor(me.org, s).filter((p) => !p.story);
    const hit = ref && past.find((p) => p.ref === ref);
    if (hit) return /* @__PURE__ */ React.createElement(PickupPage, { me, p: hit });
    return /* @__PURE__ */ React.createElement(PickupsNow, { me, past, onOpen: (p) => go("pickups", { ref: p.ref }) });
  }
  function PickupsNow({ me, past, onOpen }) {
    const s = useStore();
    const DN = D.JOURNEY.donation;
    const d = me.org === DN.partner ? s.mango.donation : null;
    const app = useApp();
    const [later, setLater] = useState(false);
    const [paper, setPaper] = useState(false);
    const { toast } = useNotice();
    const n = D.MANGO_FB;
    const bb = fmt.date(D.BATCHES[1].bestBefore);
    const R = D.MANGO_RECEIPT, mb = D.BATCHES[1];
    const org = D.SETUP.partners.find((x) => x.name === me.org) || {};
    const history = /* @__PURE__ */ React.createElement(PickupHistory, { past, onOpen });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Pickups", sub: me.org === DN.partner ? "Feeding India · Hyderabad" : `${me.org} · surplus food from ${D.WORKSPACE.short}` }, !d ? /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20, maxWidth: 760 } }, /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "donation-crate", title: "No pickup requests", body: `Brands' donation agents send surplus food here when it fits your intake rules: ${org.minDays || 15}+ days left, ${org.minUnits || 50}+ units.` })), history) : /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 340,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "bezel" }, /* @__PURE__ */ React.createElement("div", { className: "card raised stack", style: { padding: 22, gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight" }, /* @__PURE__ */ React.createElement(Mark, { size: 28 }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle strong" }, "Donation agent · Munchly Foods · ", DN.asked)), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Product, { name: "pack-mango", size: app.bp === "phone" ? 80 : 104, float: true }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 4 } }, /* @__PURE__ */ React.createElement("div", { className: "t-title2" }, n, " packs of Mango Drink"), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(Badge, { icon: "calendar" }, "22 days left"), /* @__PURE__ */ React.createElement(Badge, { icon: "map-pin" }, DN.from), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "clipboard-check" }, "FSSAI checklist")))), /* @__PURE__ */ React.createElement("p", { className: "t-body", style: { margin: 0 } }, n, " packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup ", DN.day, " ", DN.hour, " from ", DN.from, "?"), d === "booked" ? /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "check", onClick: () => Flow.act("confirmPickup") }, "Confirm ", DN.day, " ", DN.time), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", onClick: () => setLater(true) }, "Suggest another time")) : /* @__PURE__ */ React.createElement("div", { className: "row top", style: { gap: 10, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("div", { className: "t-subhead", style: { padding: "9px 12px", borderRadius: 16, borderTopRightRadius: 6, background: "var(--primary)", color: "var(--primary-fg)", maxWidth: "85%" } }, DN.reply, /* @__PURE__ */ React.createElement("div", { className: "t-caption", style: { opacity: 0.9 } }, "Meera · ", DN.confirmed)), /* @__PURE__ */ React.createElement(Avatar, { person: D.PEOPLE.meera, size: "sm" })))), d !== "booked" && /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Pickup"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: d === "collected" ? "check" : "calendar" }, d === "collected" ? "collected" : `${DN.date} · ${DN.time}`)), /* @__PURE__ */ React.createElement(K.VTracker, { items: [{ id: "req", title: "Requested by the donation agent", time: DN.asked }, { id: "conf", title: "Confirmed by Meera", time: DN.confirmed }, { id: "col", title: `Collected from ${DN.from}`, time: d === "collected" ? DN.collected : `${DN.date.split(" ")[0]} ${DN.time}` }, { id: "serve", title: `Served at ${DN.spot}`, time: "this week" }], done: d === "collected" ? 3 : 2, current: d === "collected" ? 3 : 2 }), d === "confirmed" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "package-check", onClick: () => {
          Flow.act("collect");
          toast({ text: `${R.type} ${R.no} issued`, tone: "ok" });
        } }, "Mark collected"), d === "collected" && /* @__PURE__ */ React.createElement("button", { type: "button", className: "receipt-row", onClick: () => setPaper(true) }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 20 }), /* @__PURE__ */ React.createElement("span", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, R.type, " ", R.no), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, fmt.num(R.units), " packs · ", fmt.num(R.meals), " meals · shared with Munchly for its BRSR table")), /* @__PURE__ */ React.createElement("span", { className: "receipt-view" }, "View", /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16 })))), history),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, null, "FSSAI surplus-food checklist"), /* @__PURE__ */ React.createElement(Card, { className: "paper stack tight", style: { padding: 18 } }, ["Sealed, undamaged packs", `Best before ${bb}, 22 days left`, "Ambient storage, away from sunlight", "Batch MF-2410-118 on every carton", "Donor: Munchly Foods via Lakshmi Agencies"].map((t) => /* @__PURE__ */ React.createElement("div", { key: t, className: "row top", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Icon, { name: "square-check", size: 17, style: { color: "#167a52", marginTop: 1 } }), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, t)))), /* @__PURE__ */ React.createElement(List, { head: "Your intake rules" }, /* @__PURE__ */ React.createElement(ListRow, { title: "Days left", value: "15 or more" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Minimum lot", value: "50 units" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Logistics", value: D.SETUP.partners[0].pickup })))
      }
    ), /* @__PURE__ */ React.createElement(Sheet, { open: paper, onClose: () => setPaper(false), title: R.type, footer: R.pdf ? /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, icon: "download" }, "Download the PDF") : null }, /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(S.Receipt, { doc: R, batch: mb, sku: D.SKUS[mb.sku], dist: D.DISTRIBUTORS[mb.distributor] }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "The same paper is in Munchly's document pack for ", mb.id, "."))), /* @__PURE__ */ React.createElement(Sheet, { open: later, onClose: () => setLater(false), title: "Suggest another time", detent: "medium", footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", block: true, onClick: () => {
      setLater(false);
      toast({ text: "Sent · the agent will confirm with Lakshmi Agencies" });
    } }, "Send") }, /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, DN.slots.map((t) => /* @__PURE__ */ React.createElement("label", { key: t, className: "list-row", style: { gridTemplateColumns: "auto 1fr", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "slot", defaultChecked: t === DN.slots[0] }), " ", t)))));
  }
  function PickupHistory({ past, onOpen }) {
    if (!past.length) return null;
    const meals = past.reduce((t, p) => t + p.meals, 0), packs = past.reduce((t, p) => t + p.units, 0), kg = Math.round(past.reduce((t, p) => t + p.kg, 0) * 100) / 100;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement("span", { className: "num l" }, fmt.num(meals)), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "meals from ", D.WORKSPACE.short, "'s surplus since July")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, past.length, " ", past.length === 1 ? "pickup" : "pickups", ", ", fmt.num(packs), " packs, ", fmt.kg(kg), " kept out of landfill, each with its receipt and the FSSAI checklist.")), /* @__PURE__ */ React.createElement(List, { head: "Collected" }, past.map((p) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: p.ref,
        chevron: true,
        onClick: () => onOpen(p),
        leading: /* @__PURE__ */ React.createElement(Product, { name: p.sku.img, size: 44 }),
        title: `${fmt.num(p.units)} packs of ${p.sku.name.replace(/ \d.*$/, "")}`,
        sub: `Collected ${when(p.collected)} · ${p.from}`,
        value: /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "mono" }, p.receipt.no), /* @__PURE__ */ React.createElement("em", null, fmt.num(p.meals), " meals"))
      }
    ))));
  }
  function PickupPage({ me, p }) {
    const [open, setOpen] = useState(false);
    const head = /* @__PURE__ */ React.createElement(PtHead, { sku: p.sku, id: p.ref, where: p.from, badge: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "collected"), line: `Donor: ${D.CLIENT.name} via ${p.dist.name}` });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: p.sku.name, back: "Pickups", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 340,
        main: /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Pickup"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, fmt.num(p.units), " packs")), /* @__PURE__ */ React.createElement(K.VTracker, { items: [{ id: "req", title: "Requested by the donation agent", time: when(p.asked) }, { id: "conf", title: "Confirmed by you", time: when(p.confirmed) }, { id: "col", title: `Collected from ${p.from}`, time: when(p.collected) }, { id: "serve", title: `Served at ${p.spot}`, time: "that week" }], done: 4 }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "receipt-row", onClick: () => setOpen(true) }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 20 }), /* @__PURE__ */ React.createElement("span", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, p.receipt.type, " ", p.receipt.no), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, fmt.num(p.units), " packs · ", fmt.num(p.meals), " meals · shared with ", D.WORKSPACE.short, " for its BRSR table")), /* @__PURE__ */ React.createElement("span", { className: "receipt-view" }, "View", /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16 })))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, null, "FSSAI surplus-food checklist"), /* @__PURE__ */ React.createElement(Card, { className: "paper stack tight", style: { padding: 18 } }, P().fssaiItems(p).map((t) => /* @__PURE__ */ React.createElement("div", { key: t, className: "row top", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Icon, { name: "square-check", size: 17, style: { color: "#167a52", marginTop: 1 } }), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, t)))))
      }
    ), /* @__PURE__ */ React.createElement(PaperSheet, { open, onClose: () => setOpen(false), c: p.c, receipt: p.receipt }));
  }
  Object.assign(window.SC3_SCREENS, { distOf, kOf, shopOf, DistBatches, DistBatch, PaperSheet, PaperRow, PtHead, PtTabs, PtMoments, OfferStatus, OfferPage, OfferOrder, DistHome, CameraScreen, VanRoute, DistOrders, OfferCard, RetailHome, OfferDetail, RetailOrders, Market, Listing, ListingView, MyBids, Pickups, EsBar, offerMath, cartons, PermissionCard, DestroyScreen });
})();

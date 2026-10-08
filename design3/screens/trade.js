(function() {
  const { useState, useEffect, useRef, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Sheet, Product, Empty, Money, Roll, DaysNum, GateChips, Tile, Aura, AgentFeed, ClusterMap, HaulLine, StatusBadge, BatchRow, useApp, useNotice, Mark, WorkspaceMark } = K;
  const { useStore, useRoute, heroModel, Screen, Columns, SectionTitle, Locked } = S;
  const IMG = () => window.SC3_IMG || "system/img/";
  const distOf = (me) => Object.values(D.DISTRIBUTORS).find((d) => d.name === (me && me.org)) || D.DISTRIBUTORS.rakesh;
  const kOf = (me) => D.KIRANAS.find((k) => k.name === (me && me.org)) || D.KIRANAS[0];
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
  function EndWhole({ settled }) {
    const recv = KL.gross + D.AWARD.gross + D.SUPPORT.total;
    const paid = D.PLAN.units * CHIPS.dp + D.SUPPORT.van + D.SUPPORT.fee;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "You end whole"), /* @__PURE__ */ React.createElement(Badge, { tone: settled ? "green" : void 0, icon: settled ? "check" : "clock" }, settled ? "credit note issued" : "on the plan")), /* @__PURE__ */ React.createElement("div", { className: "stack tight t-subhead" }, [[`From ${SHOPS} kiranas (${KL.units} packets)`, KL.gross], [`From ${D.BUYER.name} (${ES.units} packets)`, D.AWARD.gross], ["Price-support credit note from Munchly", D.SUPPORT.total]].map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, className: "row between" }, /* @__PURE__ */ React.createElement("span", null, k), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr(v)))), /* @__PURE__ */ React.createElement("div", { className: "hairline", style: { margin: "4px 0" } }), /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("b", null, "What you receive"), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(recv))), /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", null, "What you paid: ", fmt.num(D.PLAN.units), " × ₹", CHIPS.dp, ", the van and the listing fee"), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr(-paid))), /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("b", null, "Your gain or loss"), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(Math.round(recv - paid))))), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Instead of waiting weeks for an expiry claim, with no claim paperwork."));
  }
  function InvoiceDraft({ h }) {
    const inv = D.INVOICE;
    const { toast } = useNotice();
    return /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, "Invoice ", inv.no, " to ", D.BUYER.name), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, ES.units, " × ₹", D.COUNTER.price.toFixed(2), " + IGST ", inv.gstPct, "% · ", fmt.inr(inv.total), " · drafted by the Paperwork agent for you")), h.invoiceIssued ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "issued from Tally") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "check", onClick: () => {
      Flow.act("issueInvoice");
      toast({ text: "Marked issued from Tally", tone: "ok" });
    } }, "Issue from Tally"));
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
  function DistHome({ me }) {
    const s = useStore();
    const h = s.hero;
    const { go } = useRoute();
    const app = useApp();
    const dist = distOf(me);
    const hero = dist.id === "rakesh";
    const perm = s.setup.permission;
    const mine = D.BATCHES.filter((b) => b.distributor === dist.id).map((b) => {
      const v = D.batchView(b);
      if (b.hero) v.phase = heroModel(s).view.phase;
      if (b.second) v.phase = "executing";
      return v;
    });
    const units = h.orders.reduce((t, o) => t + o.units, 0);
    const approved = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const settled = ["settled", "cleared"].includes(h.phase);
    const live = S.useLive();
    if (live && live.quiet) return /* @__PURE__ */ React.createElement(S.Live.DistQuiet, { me, dist, perm: hero ? perm ? /* @__PURE__ */ React.createElement(ActingFor, { p: perm }) : /* @__PURE__ */ React.createElement(PermissionCard, null) : null });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Today", sub: `${dist.name} · ${dist.godown}, ${dist.city}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, hero && !perm && /* @__PURE__ */ React.createElement(PermissionCard, null), hero && perm && /* @__PURE__ */ React.createElement(ActingFor, { p: perm }), !hero && /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Product, { name: "godown", size: 72 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Nothing to do today"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "No photo requests, scheme orders or marketplace lots for ", dist.name, " right now. The Watcher checks your stock every morning at 09:00."))), hero && h.photo.status === "requested" && /* @__PURE__ */ React.createElement(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: "bezel" }, /* @__PURE__ */ React.createElement("div", { className: "card raised stack snug", style: { padding: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight" }, /* @__PURE__ */ React.createElement(Mark, { size: 30 }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle strong" }, "Smart-Clearance · ", D.PUSH.verify.at)), /* @__PURE__ */ React.createElement("div", { className: "t-title3" }, D.PUSH.verify.title), /* @__PURE__ */ React.createElement("p", { className: "t-body", style: { margin: 0 } }, D.PUSH.verify.body), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: "phone-scan", size: 72 }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Shelf B4 · one carton of Masala Chips 150 g · batch MF-2409-117")), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "camera", block: true, onClick: () => go("photo") }, "Open camera"))), hero && ["reading", "verified"].includes(h.photo.status) && !approved && /* @__PURE__ */ React.createElement(Card, { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Aura, { on: h.photo.status === "reading", className: "icontile", style: { borderRadius: 12, width: 40, height: 40 } }, /* @__PURE__ */ React.createElement(Icon, { name: h.photo.status === "verified" ? "check" : "scan-line", size: 19, stroke: 2.2 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, h.photo.status === "verified" ? "Label verified · thank you" : "Photo sent · reading the label"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, h.photo.status === "verified" ? "Batch, dates and MRP match your DMS record. Munchly gets a plan in a few minutes." : "Sent at 09:19. Nothing else needed from you."))), hero && approved && !settled && /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Munchly's plan for your Masala Chips"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "approved 09:40")), /* @__PURE__ */ React.createElement("div", { className: "stack tight t-subhead" }, /* @__PURE__ */ React.createElement("div", { className: "row top", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "dotmark", style: { background: "var(--ch-kirana)" } }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, KL.units, " packets to your kiranas"), " on the scheme: ₹", KL.packPrice.toFixed(2), " a pack, 2 free with every 10, delivered on your ", D.JOURNEY.van.day, " round.")), /* @__PURE__ */ React.createElement("div", { className: "row top", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "dotmark", style: { background: "var(--ch-expiresoon)" } }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, ES.units, " on ExpireSoon in your name"), " at ₹15, hidden from buyers in Munchly's territories. The buyer collects with his own truck.")))), hero && h.staff && /* @__PURE__ */ React.createElement(StaffSale, { staff: h.staff, dist, product: CHIPS.name.replace(/ \d.*$/, ""), clears: (M.CHANNELS.find((x) => x.id === "staff") || {}).clears }), hero && approved && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 16, gridTemplateColumns: app.bp === "phone" ? "minmax(0,1fr)" : "repeat(2, minmax(0,1fr))" } }, /* @__PURE__ */ React.createElement(Card, { interactive: true, className: "stack snug", onClick: () => go("van"), role: "button", tabIndex: 0, onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go("van")) }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "truck", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, D.JOURNEY.van.day, " van round")), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "subtle" })), /* @__PURE__ */ React.createElement("div", { className: "row base", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, /* @__PURE__ */ React.createElement(Roll, { value: h.orders.length })), /* @__PURE__ */ React.createElement("span", { className: "muted" }, "shops · ", cartons(units))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, h.van.status === "done" ? `Delivered · all ${SHOPS} shops` : h.orders.length ? "Orders from the Masala Chips scheme join this round" : "Scheme orders will appear here")), /* @__PURE__ */ React.createElement(Card, { interactive: true, className: "stack snug", onClick: () => go("van"), role: "button", tabIndex: 0, onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go("van")) }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile violet" }, /* @__PURE__ */ React.createElement(Icon, { name: "package", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, D.BUYER.city, " lot · ExpireSoon")), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "subtle" })), /* @__PURE__ */ React.createElement("div", { className: "row base", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, ES.units), /* @__PURE__ */ React.createElement("span", { className: "muted" }, "units · ", cartons(ES.units))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, h.truck.status === "dispatched" ? `Collected by ${D.BUYER.name}'s truck` : h.award ? `Sold at ₹${D.COUNTER.price.toFixed(2)} · token ${fmt.inr(D.AWARD.token)} paid` : h.listing ? "Listed at ₹15 in your name · waiting for a buyer" : "Not listed"))), hero && settled && /* @__PURE__ */ React.createElement(InvoiceDraft, { h }), hero && approved && /* @__PURE__ */ React.createElement(EndWhole, { settled }), /* @__PURE__ */ React.createElement(SectionTitle, { sub: "From your nightly DMS export" }, "Your stock"), /* @__PURE__ */ React.createElement("div", { className: "list" }, mine.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, compact: app.bp === "phone", onOpen: () => {
    } })))));
  }
  function CameraScreen({ me, realCamera }) {
    if (distOf(me).id !== "rakesh") return /* @__PURE__ */ React.createElement(Screen, { me, title: "Label photo", sub: "Requests from the Vision agent" }, /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 560 } }, /* @__PURE__ */ React.createElement(Empty, { img: "phone-scan", title: "No photo requests", body: "When a batch needs checking, Vision asks for one picture of a carton label here." })));
    return /* @__PURE__ */ React.createElement(CameraInner, { me, realCamera });
  }
  const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"], PHOTO_MAX_MB = 8;
  const PHOTO_RULE = `JPEG, PNG or WebP, under ${PHOTO_MAX_MB} MB`;
  const CAM_BLOCKED = "The camera is blocked for this page. Allow it in the browser's site settings, or upload a photo.";
  const CAM_NONE = "No camera was found. Upload a photo instead.";
  function CameraInner({ me, realCamera }) {
    const s = useStore();
    const h = s.hero;
    const { go } = useRoute();
    const reduce = useReducedMotion();
    const app = useApp();
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
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Label photo", sub: "Batch MF-2409-117 · shelf B4", back: "Today" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement("div", { className: cx("cam", camOn && "landscape"), style: photo && ratio ? { aspectRatio: String(ratio) } : void 0, ...drop }, photo ? /* @__PURE__ */ React.createElement(motion.img, { key: shot.url, className: "cam-feed whole", src: shot.url, alt: "Your photo of the carton label", onLoad: (e) => setRatio(Math.max(0.75, Math.min(1.5, e.target.naturalWidth / e.target.naturalHeight))), initial: reduce ? false : { opacity: 0, scale: 1.02 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }) : camOn ? /* @__PURE__ */ React.createElement("video", { ref: feed, className: "cam-feed", playsInline: true, muted: true, "aria-label": "The laptop's camera" }) : /* @__PURE__ */ React.createElement(S.LabelShot, { cover: true, dim: !shot && !busy }), !shot && !busy && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cam-frame", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("div", { className: "cam-hint" }, camOn ? camLive ? "Fit one carton label in the frame" : "Starting the camera…" : "Like this: one carton label, close up")), !shot && !camOn && !busy && /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, "Example"), camOn && /* @__PURE__ */ React.createElement("span", { className: "cam-tag on" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Laptop camera"), shot && !busy && /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, photo && shot.how === "upload" && shot.name ? shot.name : "Your photo"), /* @__PURE__ */ React.createElement(AnimatePresence, null, over && !busy && /* @__PURE__ */ React.createElement(motion.div, { key: "d", className: "cam-drop", initial: reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.16 } }, /* @__PURE__ */ React.createElement("span", { className: "cam-drop-in" }, /* @__PURE__ */ React.createElement(Icon, { name: "image", size: 22 }), /* @__PURE__ */ React.createElement("b", null, "Drop the photo to use it")))), sent && /* @__PURE__ */ React.createElement("div", { className: "cam-hint", style: { background: "var(--green-700)" } }, /* @__PURE__ */ React.createElement(Icon, { name: h.photo.status === "verified" ? "check" : "loader", size: 14, className: h.photo.status === "verified" ? "" : "spin" }), " ", h.photo.status === "verified" ? "Verified · matches your records" : "Sent · Vision is reading the label"), /* @__PURE__ */ React.createElement(AnimatePresence, null, flash && /* @__PURE__ */ React.createElement(motion.div, { key: "f", className: "cam-flash", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } })), h.photo.status === "reading" && !reduce && /* @__PURE__ */ React.createElement(motion.div, { "aria-hidden": "true", className: "cam-scan", animate: { top: ["20%", "76%", "20%"] }, transition: { duration: 1.6, repeat: 2, ease: "easeInOut" } })), sent ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Aura, { on: h.photo.status === "reading", className: "icontile", style: { borderRadius: 12, width: 40, height: 40 } }, /* @__PURE__ */ React.createElement(Icon, { name: h.photo.status === "verified" ? "badge-check" : "scan-line", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, h.photo.status === "verified" ? "Done. Dhanyavaad, Rakesh bhai." : "Reading batch, dates and MRP"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, h.photo.status === "verified" ? "The plan for this batch will reach Priya in a few minutes." : "This takes a few seconds."))), h.photo.status === "verified" && /* @__PURE__ */ React.createElement(List, null, [["Batch", "MF-2409-117"], ["Best before", "18 Nov 2026"], ["MRP", "₹30.00"]].map(([k, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, value: v }))), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, onClick: () => go("home") }, "Back to today")) : uploading ? /* @__PURE__ */ React.createElement(S.Live.SendFill, { p: live.uploads.photo, onCancel: () => live.cancelUpload("photo") }) : /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait", initial: false }, shot ? /* @__PURE__ */ React.createElement(motion.div, { key: "send", className: "row", style: { gap: 10 }, initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", icon: shot.how === "camera" ? "rotate-ccw" : "image", onClick: again, style: { flex: "none" } }, shot.how === "camera" ? "Retake" : "Choose another"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "send", loading: sending, onClick: send }, "Send photo")) : camOn ? /* @__PURE__ */ React.createElement(motion.div, { key: "cam", className: "cam-bar", initial: reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.16 } }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: stopCam }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "shutter", "aria-label": "Take the photo", disabled: !camLive, onClick: shutter }, /* @__PURE__ */ React.createElement("span", null)), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", icon: "image", onClick: () => {
      stopCam();
      upload();
    } }, "Upload")) : /* @__PURE__ */ React.createElement(motion.div, { key: "two", className: "cam-two", initial: reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.16 } }, /* @__PURE__ */ React.createElement(Button, { variant: desk ? "secondary" : "primary", size: "lg", icon: "camera", onClick: take }, "Take a photo"), /* @__PURE__ */ React.createElement(Button, { variant: desk ? "primary" : "secondary", size: "lg", icon: "upload", onClick: upload }, "Upload a photo"))), /* @__PURE__ */ React.createElement("input", { ref: phoneCam, type: "file", accept: PHOTO_TYPES.join(","), capture: "environment", onChange: picked("camera"), className: "sr-only", tabIndex: -1, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("input", { ref: files, type: "file", accept: PHOTO_TYPES.join(","), onChange: picked("upload"), className: "sr-only", tabIndex: -1, "aria-hidden": "true" }), err && !busy ? /* @__PURE__ */ React.createElement("p", { className: "cam-alert", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "triangle-alert", size: 15 }), err) : uploading ? /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle", style: { textAlign: "center", margin: 0 } }, "A slow connection only slows the send.") : !sent && realCamera && /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle", style: { textAlign: "center", margin: 0 } }, live ? caption : `${caption} In this prototype a stub stands in for Gemini vision and returns the batch record.`)));
  }
  function VanRoute({ me }) {
    if (distOf(me).id !== "rakesh") return /* @__PURE__ */ React.createElement(Screen, { me, title: "Van route", sub: distOf(me).cluster }, /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 560 } }, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "No scheme orders on the van", body: "Orders from Smart-Clearance offers join your next round automatically." })));
    return /* @__PURE__ */ React.createElement(VanInner, { me });
  }
  function VanInner({ me }) {
    const s = useStore();
    const h = s.hero;
    const app = useApp();
    const reduce = useReducedMotion();
    const { toast } = useNotice();
    const units = h.orders.reduce((t, o) => t + o.units, 0);
    const full = all(h);
    const [p, setP] = useState(h.van.status === "done" ? 1 : 0);
    const [running, setRunning] = useState(false);
    useEffect(() => {
      if (h.van.status === "done" && !running) setP(1);
    }, [h.van.status]);
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
          toast({ text: `Round done · ${SHOPS} shops, ${cartons(units)}`, tone: "ok" });
        }
      };
      requestAnimationFrame(step);
    };
    const dispatch = () => {
      Flow.act("dispatch");
      toast({ text: `${D.BUYER.city} lot on the buyer's truck · invoice draft next`, tone: "ok" });
    };
    const stops = D.KIRANAS.map((k) => ({ ...k, ordered: h.orders.find((o) => o.id === k.id) }));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Van route", sub: `${D.JOURNEY.van.depot} · Nagpur, Wardha and Kamptee`, back: "Today" }, /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 380,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Card, { pad: false, style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement(ClusterMap, { kiranas: D.KIRANAS, orderedCount: h.orders.length, route: h.orders.length > 0, vanProgress: p, height: app.bp === "phone" ? 260 : 380 })), /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, D.JOURNEY.van.day, " round"), /* @__PURE__ */ React.createElement(Badge, { tone: h.van.status === "done" ? "green" : void 0, icon: h.van.status === "done" ? "check" : "calendar" }, h.van.status === "done" ? "delivered" : `${D.JOURNEY.van.date} · from ${D.JOURNEY.van.leaves}`)), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, /* @__PURE__ */ React.createElement(Roll, { value: h.orders.length }), /* @__PURE__ */ React.createElement("span", { className: "subtle", style: { fontSize: "0.45em" } }, " / ", SHOPS)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "shops on the round")), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, /* @__PURE__ */ React.createElement(Roll, { value: units })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "packets · ", cartons(units)))), h.van.status !== "done" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "navigation", loading: running, disabled: !full || running, onClick: start }, full ? "Start the round" : `Waiting for orders · ${h.orders.length} of ${SHOPS}`), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "₹", M.RULES.vanPerUnit.toFixed(2), " a packet for the van, repaid by Munchly in the price support."), /* @__PURE__ */ React.createElement("div", { className: "feed", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "row top", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Mark, { size: 28 }), /* @__PURE__ */ React.createElement("div", { className: "t-subhead", style: { padding: "9px 12px", borderRadius: 16, borderTopLeftRadius: 6, background: "var(--fill-2)" } }, D.PUSH.van.body, /* @__PURE__ */ React.createElement("div", { className: "t-caption muted" }, "Outreach agent · Mon 18:00"))), /* @__PURE__ */ React.createElement("div", { className: "row top", style: { gap: 10, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("div", { className: "t-subhead", style: { padding: "9px 12px", borderRadius: 16, borderTopRightRadius: 6, background: "var(--primary)", color: "var(--primary-fg)" } }, D.JOURNEY.van.reply, /* @__PURE__ */ React.createElement("div", { className: "t-caption", style: { opacity: 0.9 } }, "Rakesh bhai · ", D.JOURNEY.van.replyAt)), /* @__PURE__ */ React.createElement(Avatar, { person: D.PEOPLE.rakesh, size: "sm" }))))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { "data-anchor": "lot" }), /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile violet" }, /* @__PURE__ */ React.createElement(Icon, { name: "package", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, D.BUYER.city, " lot")), /* @__PURE__ */ React.createElement(Badge, { tone: h.truck.status === "dispatched" ? "blue" : h.award ? "green" : "violet" }, h.truck.status === "dispatched" ? "collected" : h.award ? "sold" : h.listing ? "listed" : "not listed")), /* @__PURE__ */ React.createElement(HaulLine, { progress: h.truck.status === "dispatched" ? h.phase === "cleared" || h.phase === "settled" ? 1 : 0.55 : 0 }), /* @__PURE__ */ React.createElement(List, null, [["Buyer", h.award ? `${D.BUYER.name}, ${D.BUYER.city}` : "—"], ["Units", `${ES.units} · ${cartons(ES.units)}`], ["Price", h.award ? `₹${D.COUNTER.price.toFixed(2)} a packet` : "₹15.00 asked"], ["Token", h.award ? fmt.inr(D.AWARD.token) + " received" : "—"], ["Freight", "the buyer's own truck"]].map(([k, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, value: v }))), h.truck.status !== "dispatched" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "truck", disabled: !h.award, onClick: dispatch }, h.award ? "Load the buyer's truck" : "Load after the award"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Your staff load it as normal godown work, once the balance lands.")), /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "In the order they were placed" }, "Stops"), /* @__PURE__ */ React.createElement("div", { className: "list" }, stops.map((k, i) => /* @__PURE__ */ React.createElement("div", { key: k.id, className: "list-row", style: { gridTemplateColumns: "28px minmax(0,1fr) auto" } }, /* @__PURE__ */ React.createElement("span", { className: "center t-caption strong", style: { width: 24, height: 24, borderRadius: 99, background: k.ordered ? "var(--primary)" : "var(--fill-2)", color: k.ordered ? "var(--primary-fg)" : "var(--fg-2)" } }, i + 1), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, k.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, k.area, k.ordered ? ` · ordered ${k.ordered.at}` : " · not yet")), /* @__PURE__ */ React.createElement("span", { className: "tnum strong t-subhead" }, k.ordered ? k.units : "—"))))))
      }
    ));
  }
  function DistOrders({ me }) {
    const s = useStore();
    const h = s.hero;
    const hero = distOf(me).id === "rakesh";
    if (!hero) return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: "Scheme orders and marketplace sales" }, /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 560 } }, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "No orders yet", body: "Kirana orders from offers and marketplace awards for your stock appear here." })));
    const rows = h.orders.slice().reverse().map((o) => ({ ...o, k: D.KIRANAS.find((k) => k.id === o.id) }));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: "Scheme orders and marketplace sales" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, h.award && /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile violet" }, /* @__PURE__ */ React.createElement(Icon, { name: "shopping-bag", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, D.BUYER.name, ", ", D.BUYER.city, " · ExpireSoon"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, ES.units, " × ₹", D.COUNTER.price.toFixed(2), " · token ", fmt.inr(D.AWARD.token), " · balance ", fmt.inr(D.AWARD.balance), ", plus ", fmt.inr(D.INVOICE.igst), " IGST on your invoice")), /* @__PURE__ */ React.createElement(Money, { value: D.AWARD.gross, size: "s", decimals: true })), h.docs && /* @__PURE__ */ React.createElement(InvoiceDraft, { h }), rows.length ? /* @__PURE__ */ React.createElement("div", { className: "list" }, rows.map((o) => /* @__PURE__ */ React.createElement("div", { key: o.id, className: "list-row", style: { gridTemplateColumns: "minmax(0,1fr) auto" } }, /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, o.k.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, o.k.area, " · ", o.at, " · buy 10 get 2")), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, justifyItems: "end" } }, /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, o.units, " packets"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, cartons(o.units)))))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "No scheme orders yet", body: "When a kirana taps the offer, the order lands here and joins your next van round." }))));
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
  function RetailHome({ me }) {
    const s = useStore();
    const h = s.hero;
    const { go } = useRoute();
    const k = kOf(me);
    const mine = h.orders.find((o) => o.id === k.id);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Offers", sub: `${k.name} · ${k.area}, Nagpur` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, h.offer ? mine ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: 64 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Ordered · ", mine.units, " packets"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Masala Chips 150 g · placed ", mine.at, " · comes on ", D.JOURNEY.van.day, "'s van")), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "confirmed"))) : /* @__PURE__ */ React.createElement(OfferCard, { shop: k.name, onOpen: () => go("offer") }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "kirana", title: "No offers today", body: "Rakesh Traders' schemes arrive here as a notification, in Hindi, ready to order in one tap." })), /* @__PURE__ */ React.createElement(SectionTitle, null, "Your shop"), /* @__PURE__ */ React.createElement(List, null, [["Distributor", "Rakesh Traders, Nagpur"], ["Van day", D.JOURNEY.van.day], ["Unsold scheme packs", `back to the salesman until ${fmt.day(D.RETURN_BY)}`], ["Language", "हिन्दी · English"]].map(([k2, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: k2, title: k2, value: k2 === "Language" ? /* @__PURE__ */ React.createElement("span", { lang: "hi" }, v) : v })))));
  }
  function OfferDetail({ me }) {
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
    const k = kOf(me);
    const mine = s.hero.orders.find((o) => o.id === k.id);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: k.name }, mine ? /* @__PURE__ */ React.createElement("div", { className: "list", style: { maxWidth: 620 } }, /* @__PURE__ */ React.createElement("div", { className: "list-row", style: { gridTemplateColumns: "48px minmax(0,1fr) auto" } }, /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: 44 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "Masala Chips 150 g · ", mine.units, " packets"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, mine.at, " · buy 10 get 2 · ", D.JOURNEY.van.day, "'s van")), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: s.hero.van.status === "done" ? "green" : void 0 }, s.hero.van.status === "done" ? "delivered" : "on the round"))) : /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 620 } }, /* @__PURE__ */ React.createElement(Empty, { icon: "shopping-basket", title: "No orders yet", body: "Orders you place from an offer show here with the van day." })));
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
    const d = s.mango.donation;
    const app = useApp();
    const [later, setLater] = useState(false);
    const { toast } = useNotice();
    const n = D.MANGO_FB;
    const DN = D.JOURNEY.donation;
    const bb = fmt.date(D.BATCHES[1].bestBefore);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Pickups", sub: "Feeding India · Hyderabad" }, !d ? /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 640 } }, /* @__PURE__ */ React.createElement(Empty, { img: "donation-crate", title: "No pickup requests", body: "Brands' donation agents send surplus food here when it fits your intake rules: 15+ days left, 50+ units." })) : /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 340,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "bezel" }, /* @__PURE__ */ React.createElement("div", { className: "card raised stack", style: { padding: 22, gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight" }, /* @__PURE__ */ React.createElement(Mark, { size: 28 }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle strong" }, "Donation agent · Munchly Foods · ", DN.asked)), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Product, { name: "pack-mango", size: app.bp === "phone" ? 80 : 104, float: true }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 4 } }, /* @__PURE__ */ React.createElement("div", { className: "t-title2" }, n, " packs of Mango Drink"), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(Badge, { icon: "calendar" }, "22 days left"), /* @__PURE__ */ React.createElement(Badge, { icon: "map-pin" }, DN.from), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "clipboard-check" }, "FSSAI checklist")))), /* @__PURE__ */ React.createElement("p", { className: "t-body", style: { margin: 0 } }, n, " packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup ", DN.day, " ", DN.hour, " from ", DN.from, "?"), d === "booked" ? /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "check", onClick: () => Flow.act("confirmPickup") }, "Confirm ", DN.day, " ", DN.time), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", onClick: () => setLater(true) }, "Suggest another time")) : /* @__PURE__ */ React.createElement("div", { className: "row top", style: { gap: 10, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("div", { className: "t-subhead", style: { padding: "9px 12px", borderRadius: 16, borderTopRightRadius: 6, background: "var(--primary)", color: "var(--primary-fg)", maxWidth: "85%" } }, DN.reply, /* @__PURE__ */ React.createElement("div", { className: "t-caption", style: { opacity: 0.9 } }, "Meera · ", DN.confirmed)), /* @__PURE__ */ React.createElement(Avatar, { person: D.PEOPLE.meera, size: "sm" })))), d !== "booked" && /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Pickup"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: d === "collected" ? "check" : "calendar" }, d === "collected" ? "collected" : `${DN.date} · ${DN.time}`)), /* @__PURE__ */ React.createElement(K.VTracker, { items: [{ id: "req", title: "Requested by the donation agent", time: DN.asked }, { id: "conf", title: "Confirmed by Meera", time: DN.confirmed }, { id: "col", title: `Collected from ${DN.from}`, time: d === "collected" ? DN.collected : `${DN.date.split(" ")[0]} ${DN.time}` }, { id: "serve", title: `Served at ${DN.spot}`, time: "this week" }], done: d === "collected" ? 3 : 2, current: d === "collected" ? 3 : 2 }), d === "confirmed" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "package-check", onClick: () => {
          Flow.act("collect");
          toast({ text: `Receipt issued · ${n} drinks`, tone: "ok" });
        } }, "Mark collected"), d === "collected" && /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12, padding: "12px 14px", borderRadius: 14, background: "var(--primary-soft)" } }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 20 }), /* @__PURE__ */ React.createElement("span", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "In-app receipt issued"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, n, " drinks served · shared with Munchly for its BRSR table"))))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, null, "FSSAI surplus-food checklist"), /* @__PURE__ */ React.createElement(Card, { className: "paper stack tight", style: { padding: 18 } }, ["Sealed, undamaged packs", `Best before ${bb}, 22 days left`, "Ambient storage, away from sunlight", "Batch MF-2410-118 on every carton", "Donor: Munchly Foods via Lakshmi Agencies"].map((t) => /* @__PURE__ */ React.createElement("div", { key: t, className: "row top", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Icon, { name: "square-check", size: 17, style: { color: "#167a52", marginTop: 1 } }), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, t)))), /* @__PURE__ */ React.createElement(List, { head: "Your intake rules" }, /* @__PURE__ */ React.createElement(ListRow, { title: "Days left", value: "15 or more" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Minimum lot", value: "50 units" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Logistics", value: D.SETUP.partners[0].pickup })))
      }
    ), /* @__PURE__ */ React.createElement(Sheet, { open: later, onClose: () => setLater(false), title: "Suggest another time", detent: "medium", footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", block: true, onClick: () => {
      setLater(false);
      toast({ text: "Sent · the agent will confirm with Lakshmi Agencies" });
    } }, "Send") }, /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, DN.slots.map((t) => /* @__PURE__ */ React.createElement("label", { key: t, className: "list-row", style: { gridTemplateColumns: "auto 1fr", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "slot", defaultChecked: t === DN.slots[0] }), " ", t)))));
  }
  Object.assign(window.SC3_SCREENS, { distOf, kOf, DistHome, CameraScreen, VanRoute, DistOrders, OfferCard, RetailHome, OfferDetail, RetailOrders, Market, Listing, ListingView, MyBids, Pickups, EsBar, offerMath, cartons, PermissionCard });
})();

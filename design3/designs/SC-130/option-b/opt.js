(function() {
  const { useState } = React;
  const { motion, AnimatePresence } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER, Z = window.SC130;
  const { cx, Icon, Badge, Button, Card, Product, Segmented, Sheet, Empty, useApp, useNotice } = K;
  const { useStore, useRoute, Screen } = S;
  const fmt = M.fmt;
  S.NAV.distributor.splice(
    0,
    S.NAV.distributor.length,
    { id: "home", label: "Today", icon: "house" },
    { id: "report", label: "History", icon: "history" },
    { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true },
    { id: "van", label: "Van route", short: "Van", icon: "truck" },
    { id: "orders", label: "Orders", icon: "clipboard-list" }
  );
  S.NAV.retailer.splice(0, S.NAV.retailer.length, { id: "home", label: "Offers", icon: "tag" }, { id: "report", label: "History", icon: "history" });
  S.NAV.foodbank.splice(0, S.NAV.foodbank.length, { id: "pickups", label: "Pickups", icon: "heart-handshake" }, { id: "report", label: "History", icon: "history" });
  function Rail({ items }) {
    const months = [];
    items.forEach((i) => {
      const m = i.now ? "now" : i.at.slice(0, 7);
      let g = months.find((x) => x.m === m);
      if (!g) months.push(g = { m, label: i.now ? "Now" : Z.month(i.at), items: [] });
      g.items.push(i);
    });
    return /* @__PURE__ */ React.createElement("div", { className: "sc130-tl" }, months.map((g) => /* @__PURE__ */ React.createElement("section", { key: g.m, "aria-label": g.label }, /* @__PURE__ */ React.createElement("div", { className: "sc130-tl-month" }, g.label), g.items.map((i) => /* @__PURE__ */ React.createElement("div", { key: i.key, className: "sc130-tl-item" }, /* @__PURE__ */ React.createElement("div", { className: "sc130-tl-rail" }, /* @__PURE__ */ React.createElement("span", { className: cx("sc130-tl-dot", i.dot), "aria-hidden": "true" })), /* @__PURE__ */ React.createElement("div", null, !i.now && /* @__PURE__ */ React.createElement("div", { className: "sc130-tl-when" }, /* @__PURE__ */ React.createElement("b", null, Z.day(i.at)), i.at.length > 10 && /* @__PURE__ */ React.createElement(React.Fragment, null, " · ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, i.at.slice(11, 16))), i.what && /* @__PURE__ */ React.createElement(React.Fragment, null, " · ", i.what)), i.card))))));
  }
  function More({ open, onToggle, label = "What happened" }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "sc130-more", "aria-expanded": open, onClick: onToggle }, open ? "Hide" : label, /* @__PURE__ */ React.createElement(Icon, { name: open ? "chevron-up" : "chevron-down", size: 16 }));
  }
  const Reveal = ({ open, children }) => /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, open && /* @__PURE__ */ React.createElement(motion.div, { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }, children));
  function Chip({ icon, label, no, onClick }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "sc130-chip", onClick }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 15 }), label, no && /* @__PURE__ */ React.createElement("span", { className: "mono" }, no));
  }
  const SHORT = { invoice: "Tax invoice", eway: "E-way bill", support: "Credit note", expiry: "Expiry credit note", receipt: "Receipt", destruction: "Destruction certificate" };
  function Moments({ items }) {
    return /* @__PURE__ */ React.createElement("div", { className: "sc130-moments", role: "list", style: { marginTop: 14 } }, items.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: m.k + i, role: "listitem", className: cx("sc130-moment", m.ahead && "ahead") }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: m.icon, size: 16, stroke: 2 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", { style: { fontSize: 14 } }, m.title), m.sub && /* @__PURE__ */ React.createElement("span", { className: "sub" }, m.sub)), /* @__PURE__ */ React.createElement("time", null, m.at ? m.at.length > 10 ? Z.when(m.at) : m.at : ""))));
  }
  const Line = ({ k, sub, v, strong }) => /* @__PURE__ */ React.createElement("div", { className: cx("sc130-line", strong && "strong") }, /* @__PURE__ */ React.createElement("span", null, k, sub && /* @__PURE__ */ React.createElement("em", null, " ", sub)), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, v));
  const OUT = [{ id: "all", label: "All" }, { id: "sold", label: "Sold through" }, { id: "leftover", label: "Left at the godown" }, { id: "donation", label: "Donated" }];
  function DistCard({ b, onPaper }) {
    const [open, setOpen] = useState(false);
    const c = b.c;
    const w = Z.whole(c);
    const p = Z.distPapers(c);
    const kl = Z.lineOf(c, "kirana"), es = Z.lineOf(c, "expiresoon"), fb = Z.lineOf(c, "foodbank");
    const what = [kl && `${c.kiranas.length} kiranas took ${fmt.num(kl.units)}`, es && `${D.BUYER.name} ${fmt.num(es.units)}`, fb && `${c.partner.name} ${fmt.num(fb.units)}`, c.expiry && c.expiry.units && `${fmt.num(c.expiry.units)} expired at your godown`].filter(Boolean).join(" · ");
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: 44 }), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("b", null, c.sku.name), /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, c.ref), " · ", fmt.num(c.plan.units), " packs at risk · cleared ", Z.day(c.cleared)))), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, what, ". You ended whole: ", Z.inr(w.recv), " received for ", Z.inr(w.paid), " paid."), /* @__PURE__ */ React.createElement("div", { className: "sc130-chips" }, p.mine.filter((d) => d.status !== "not required").concat(p.copies).map((d) => /* @__PURE__ */ React.createElement(Chip, { key: d.id, icon: Z.PAPER_ICON[d.id], label: SHORT[d.id], no: d.no, onClick: () => onPaper(c, d.id) }))), /* @__PURE__ */ React.createElement(More, { open, onToggle: () => setOpen((o) => !o) }), /* @__PURE__ */ React.createElement(Reveal, { open }, /* @__PURE__ */ React.createElement(Moments, { items: Z.moments(c, b.h) })));
  }
  function DistHistory({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const dist = S.distOf(me);
    const [f, setF] = useState("all");
    const [paper, setPaper] = useState(null);
    const { journey, past } = Z.distBatches(dist.id, s);
    const items = journey.map((b) => ({ key: b.id, now: true, dot: "now", card: /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: D.SKUS[b.sku].img, size: 44 }), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("b", null, D.SKUS[b.sku].name), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true, live: true }, "in a journey")), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, b.id), " · the agents act in your name · its papers join this history once every line is done")), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", onClick: () => go("home") }, "Open Today")) })).concat(past.filter((b) => f === "all" || b.c.outcome === f).map((b) => ({ key: b.ref, at: Z.stepAt(b.h, "report"), what: "settled", card: /* @__PURE__ */ React.createElement(DistCard, { b, onPaper: (c, id) => setPaper({ c, id }) }) })));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "History", sub: `${dist.name} · every batch of ${Z.C}'s at your godown, and its papers` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18, maxWidth: 820 } }, /* @__PURE__ */ React.createElement("div", { className: "sc130-fit" }, /* @__PURE__ */ React.createElement(Segmented, { label: "Show", value: f, onChange: setF, options: OUT, size: "sm" })), /* @__PURE__ */ React.createElement(Rail, { items })), /* @__PURE__ */ React.createElement(Z.PaperSheet, { open: !!paper, onClose: () => setPaper(null), c: paper && paper.c, id: paper && paper.id, receipt: paper && paper.id === "receipt" ? paper.c.receipt : null }));
  }
  const KF = [{ id: "all", label: "All" }, { id: "ordered", label: "Ordered" }, { id: "declined", label: "Declined" }, { id: "expired", label: "Expired" }];
  function OfferCardB({ o }) {
    const [open, setOpen] = useState(false);
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: o.sku.img, size: 44 }), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("b", null, o.sku.name), /* @__PURE__ */ React.createElement(Z.OfferStatus, { o, size: "sm" })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, o.dist.short, " · ₹", o.pack.toFixed(2), " a packet, buy 10 get 2 · your share up to ", o.share))), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, o.status === "ordered" ? /* @__PURE__ */ React.createElement(React.Fragment, null, "You ordered ", o.units, " packets on ", Z.when(o.orderedAt), o.van ? `, delivered on ${Z.weekday(o.van)}'s van` : ", on the round", ". Your margin at MRP: ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(o.m.margin)), ".") : o.status === "open" ? `Open until ${Z.when(o.closed)}.` : `${Z.whyText(o)}.`), o.status === "ordered" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(More, { open, onToggle: () => setOpen((x) => !x), label: "The bill" }), /* @__PURE__ */ React.createElement(Reveal, { open }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { marginTop: 6 } }, /* @__PURE__ */ React.createElement(Line, { k: "You paid", sub: `${o.m.paid} × ₹${o.pack.toFixed(2)}`, v: fmt.inr(o.m.pay) }), /* @__PURE__ */ React.createElement(Line, { k: "Free packets", sub: "2 with every 10", v: o.m.free }), /* @__PURE__ */ React.createElement(Line, { k: "You sell at MRP", sub: `${o.units} × ₹${o.mrp}`, v: fmt.inr(o.m.sell) }), /* @__PURE__ */ React.createElement(Line, { k: "Your margin", v: fmt.inr(o.m.margin), strong: true })))));
  }
  function KiranaHistory({ me }) {
    const s = useStore();
    const k = Z.shopOf(me);
    const [f, setF] = useState("all");
    const list = Z.offersFor(k, s, Z.declinedAt()).filter((o) => o.status !== "open" && (f === "all" || o.status === f));
    const all = Z.offersFor(k, s, Z.declinedAt()).filter((o) => o.status === "ordered");
    const margin = all.reduce((t, o) => t + o.m.margin, 0);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "History", sub: `${k.name} · every scheme ${k.distributor === "rakesh" ? "Rakesh Traders" : "your distributor"} offered you` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18, maxWidth: 720 } }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, all.length ? /* @__PURE__ */ React.createElement(React.Fragment, null, "You ordered from ", all.length, " of them, for ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(margin)), " of margin at MRP.") : "You have not ordered from a scheme yet."), /* @__PURE__ */ React.createElement("div", { className: "sc130-fit" }, /* @__PURE__ */ React.createElement(Segmented, { label: "Show", value: f, onChange: setF, options: KF, size: "sm" })), list.length ? /* @__PURE__ */ React.createElement(Rail, { items: list.map((o) => ({ key: o.ref, at: o.sent, what: "offer sent", dot: o.status === "ordered" ? void 0 : "muted", card: /* @__PURE__ */ React.createElement(OfferCardB, { o }) })) }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "history", title: "Nothing here", body: "Offers you order from, decline or let expire show here." }))));
  }
  function Offers({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const { toast } = useNotice();
    const k = Z.shopOf(me);
    const [dec, setDec] = useState(Z.declinedAt());
    const now = Z.offersFor(k, s, dec).find((o) => o.story);
    const no = () => {
      Z.decline();
      setDec(Z.declinedAt());
      toast({ text: "Declined · it is in your History" });
    };
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Offers", sub: `${k.name} · ${k.area}, Nagpur` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, now && now.status === "open" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(S.OfferCard, { shop: k.name, onOpen: () => go("offer") }), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "lg", block: true, onClick: no }, "Not this time")) : now ? /* @__PURE__ */ React.createElement(OfferCardB, { o: now }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "kirana", title: "No open offer", body: "Rakesh Traders' schemes arrive here as a notification, in Hindi, ready to order in one tap." })), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "history", onClick: () => go("report") }, "Earlier offers and orders")));
  }
  function PickupCard({ p, onReceipt, onChecklist }) {
    const [open, setOpen] = useState(false);
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: p.sku.img, size: 44 }), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("b", null, p.units, " packs of ", p.sku.name.replace(/ \d.*$/, "")), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "collected")), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "From ", p.from, " · donor ", D.CLIENT.name, " via ", p.dist.name))), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, fmt.num(p.meals), " meals served at ", p.spot, ", ", fmt.kg(Math.round(p.kg * 100) / 100), " kept out of landfill."), /* @__PURE__ */ React.createElement("div", { className: "sc130-chips" }, /* @__PURE__ */ React.createElement(Chip, { icon: "receipt", label: p.receipt.type, no: p.receipt.no, onClick: () => onReceipt(p) }), /* @__PURE__ */ React.createElement(Chip, { icon: "clipboard-check", label: "FSSAI checklist", onClick: () => onChecklist(p) })), /* @__PURE__ */ React.createElement(More, { open, onToggle: () => setOpen((x) => !x), label: "The pickup" }), /* @__PURE__ */ React.createElement(Reveal, { open }, /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement(K.VTracker, { items: [{ id: "req", title: "Requested by the donation agent", time: Z.when(p.asked) }, { id: "conf", title: "Confirmed by you", time: Z.when(p.confirmed) }, { id: "col", title: `Collected from ${p.from}`, time: Z.when(p.collected) }, { id: "serve", title: `Served at ${p.spot}`, time: "that week" }], done: 4 }))));
  }
  function FbHistory({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const [rec, setRec] = useState(null);
    const [chk, setChk] = useState(null);
    const list = Z.pickupsFor(me.org, s);
    const done = list.filter((p) => p.state === "collected");
    const coming = list.filter((p) => p.state !== "collected");
    const meals = done.reduce((t, p) => t + p.meals, 0);
    const items = coming.map((p) => ({ key: p.ref, now: true, dot: "now", card: /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: p.sku.img, size: 44 }), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, p.units, " packs of ", p.sku.name.replace(/ \d.*$/, "")), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, p.slot, " · from ", p.from)), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", onClick: () => go("pickups") }, "Open the pickup")) })).concat(done.map((p) => ({ key: p.ref, at: p.collected, what: "collected", card: /* @__PURE__ */ React.createElement(PickupCard, { p, onReceipt: setRec, onChecklist: setChk }) })));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "History", sub: `${me.org} · every pickup from ${Z.C}, with its receipt` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18, maxWidth: 760 } }, done.length ? /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, /* @__PURE__ */ React.createElement("b", null, fmt.num(meals), " meals"), " from ", done.length, " pickups since July.") : null, /* @__PURE__ */ React.createElement(Rail, { items })), /* @__PURE__ */ React.createElement(Z.PaperSheet, { open: !!rec, onClose: () => setRec(null), c: rec && rec.c, receipt: rec && rec.receipt }), /* @__PURE__ */ React.createElement(Sheet, { open: !!chk, onClose: () => setChk(null), title: "FSSAI surplus-food checklist" }, chk && /* @__PURE__ */ React.createElement("div", { className: "paper stack tight", style: { padding: 18 } }, Z.fssaiItems(chk).map((t) => /* @__PURE__ */ React.createElement("div", { key: t, className: "row top", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Icon, { name: "square-check", size: 17, style: { color: "#167a52", marginTop: 1 } }), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, t))))));
  }
  const ReportOrig = S.Report;
  S.Report = (props) => {
    const r = props.me.role;
    return r === "distributor" ? /* @__PURE__ */ React.createElement(DistHistory, { ...props }) : r === "retailer" ? /* @__PURE__ */ React.createElement(KiranaHistory, { ...props }) : r === "foodbank" ? /* @__PURE__ */ React.createElement(FbHistory, { ...props }) : /* @__PURE__ */ React.createElement(ReportOrig, { ...props });
  };
  S.RetailHome = Offers;
})();

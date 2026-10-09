(function() {
  const { useState } = React;
  const { motion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER, Z = window.SC130;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, Money, Empty, VTracker, BatchRow, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle, Locked } = S;
  const fmt = M.fmt;
  S.NAV.distributor.splice(
    0,
    S.NAV.distributor.length,
    { id: "home", label: "Today", icon: "house" },
    { id: "batches", label: "Batches", icon: "boxes" },
    { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true },
    { id: "van", label: "Van route", short: "Van", icon: "truck" },
    { id: "orders", label: "Orders", icon: "clipboard-list" }
  );
  function Tabs({ tabs, value, onChange, label }) {
    const phone = useApp().bp === "phone";
    return /* @__PURE__ */ React.createElement("nav", { className: "bh-tabs sc130-tabs", "aria-label": label }, tabs.map((t) => {
      const on = t.id === value;
      return /* @__PURE__ */ React.createElement("button", { key: t.id, type: "button", className: "bh-tab", "aria-current": on ? "page" : void 0, onClick: () => onChange(t.id) }, on && /* @__PURE__ */ React.createElement(motion.span, { layoutId: "sc130a-thumb", className: "bh-tab-thumb", transition: { type: "spring", stiffness: 500, damping: 40 } }), !phone && /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: 16 }), /* @__PURE__ */ React.createElement("span", null, t.label));
    }));
  }
  function Moments({ items }) {
    return /* @__PURE__ */ React.createElement("div", { className: "sc130-moments", role: "list" }, items.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: m.k + i, role: "listitem", className: cx("sc130-moment", m.ahead && "ahead") }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: m.icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, m.title), m.sub && /* @__PURE__ */ React.createElement("span", { className: "sub" }, m.sub)), /* @__PURE__ */ React.createElement("time", null, m.at ? m.at.length > 10 ? Z.when(m.at) : m.at : m.ahead ? "next" : ""))));
  }
  const Line = ({ k, sub, v, strong, onClick }) => /* @__PURE__ */ React.createElement("div", { className: cx("sc130-line", strong && "strong") }, /* @__PURE__ */ React.createElement("span", null, k, sub && /* @__PURE__ */ React.createElement("em", null, " ", onClick ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "sc130-more", style: { minHeight: 0, fontSize: 13.5 }, onClick }, sub) : sub)), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, v));
  const stage = (phase) => ({ "at-risk": "Verify", verified: "Value", valued: "Decide", planned: "Approve", approved: "Execute", executing: "Execute", dispatched: "Settle", settled: "Settle", cleared: "Report" })[phase] || "Detect";
  function DistBatches({ me }) {
    const s = useStore();
    const { route, go } = useRoute();
    const app = useApp();
    const phone = app.bp === "phone";
    const dist = S.distOf(me);
    const ref = route.params && route.params.ref;
    if (ref) return /* @__PURE__ */ React.createElement(DistBatch, { me, dist, id: ref });
    const { journey, watching, past } = Z.distBatches(dist.id, s);
    const credit = past.reduce((t, b) => t + b.c.support.total + (b.c.expiry && b.c.expiry.credit || 0), 0);
    const notes = past.reduce((t, b) => t + b.c.docs.filter((d) => (d.id === "support" || d.id === "expiry") && d.status !== "not required").length, 0);
    const months = [];
    past.forEach((b) => {
      const m = b.c.cleared.slice(0, 7);
      let g = months.find((x) => x.m === m);
      if (!g) months.push(g = { m, label: Z.month(b.c.cleared), items: [] });
      g.items.push(b);
    });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Batches", sub: `${dist.name} · every batch of ${Z.C}'s the Watcher flagged at your godown` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, journey.length ? /* @__PURE__ */ React.createElement(List, { head: "In a journey now" }, journey.map((b) => {
      const sku = D.SKUS[b.sku];
      const phase = b.hero ? s.hero.phase : s.mango.phase;
      return /* @__PURE__ */ React.createElement(
        ListRow,
        {
          key: b.id,
          chevron: true,
          onClick: () => go("batches", { ref: b.id }),
          leading: /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 40 }),
          title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, sku.name), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true, live: true }, stage(phase))),
          sub: `${b.id} · flagged ${Z.day(Z.STORY_DAY)} · the agents act in your name`,
          value: phone ? null : `${fmt.num(b.hero ? D.PLAN.units : D.MANGO_PLAN.units)} packs`
        }
      );
    })) : null, past.length ? /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: credit, size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "from ", Z.C, " since July")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, past.length, " batches cleared at your godown. On each, the price support (and on expiry day the expiry credit) made up the gap to the dealer price you paid, so you ended whole: ", /* @__PURE__ */ React.createElement("b", null, notes, " credit notes"), ", each in its batch's papers.")) : null, months.map((g) => /* @__PURE__ */ React.createElement(List, { key: g.m, head: `Cleared · ${g.label}` }, g.items.map((b) => {
      const c = b.c;
      const cr = c.support.total + (c.expiry && c.expiry.credit || 0);
      const papers = Z.distPapers(c);
      return /* @__PURE__ */ React.createElement(
        ListRow,
        {
          key: b.ref,
          chevron: true,
          onClick: () => go("batches", { ref: b.ref }),
          leading: /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: 40 }),
          title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, c.sku.name), !phone && /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" })),
          sub: `${c.ref} · flagged ${Z.day(c.flagged)} · cleared ${Z.day(c.cleared)}`,
          value: /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, Z.inr(cr)), /* @__PURE__ */ React.createElement("em", null, papers.mine.filter((d) => d.status !== "not required").length + papers.copies.length, " papers"))
        }
      );
    }))), watching.length ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "From your nightly DMS export: nothing at risk" }, "Watching"), /* @__PURE__ */ React.createElement("div", { className: "list" }, watching.map((b) => /* @__PURE__ */ React.createElement(BatchRow, { key: b.id, view: D.batchView(b), compact: phone, onOpen: () => {
    } })))) : null));
  }
  const TABS = [{ id: "what", label: "What happened", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }];
  function DistBatch({ me, dist, id }) {
    const s = useStore();
    const [tab, setTab] = useState("what");
    const [paper, setPaper] = useState(null);
    const past = Z.distBatches(dist.id, s).past.find((b) => b.ref === id);
    const story = !past && D.BATCHES.find((b) => b.id === id && b.hero);
    const c = past ? past.c : L.storyCase();
    const sku = c.sku;
    const cleared = !!past || s.hero.phase === "cleared";
    const head = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      Z.Head,
      {
        sku,
        id,
        where: `${dist.godown}, ${dist.city}`,
        badge: past ? /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" }) : /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true, live: true }, stage(s.hero.phase)),
        line: past ? `Flagged ${Z.day(c.flagged)} · cleared ${Z.day(c.cleared)}` : `Flagged ${Z.day(Z.STORY_DAY)} · the agents act in your name`
      }
    ), /* @__PURE__ */ React.createElement(Tabs, { tabs: TABS, value: tab, onChange: setTab, label: `${sku.name}, ${id}` }));
    let body;
    if (tab === "what") body = /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Moments, { items: past ? Z.moments(c, past.h) : storyMoments(s) }));
    else if (tab === "money") body = /* @__PURE__ */ React.createElement(WholeCard, { c, story: !past, s, onPaper: setPaper });
    else body = /* @__PURE__ */ React.createElement(Papers, { c, ready: !!past || !!s.hero.docs, onOpen: setPaper });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: sku.name, back: "Batches", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement(motion.div, { key: tab, initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] }, style: { maxWidth: 820, marginTop: 4 } }, body), /* @__PURE__ */ React.createElement(Z.PaperSheet, { open: !!paper, onClose: () => setPaper(null), c, id: paper, receipt: paper === "receipt" ? c.receipt : null }));
  }
  const FEED = [
    ["permit", "handshake", "You gave the one-time permission"],
    ["watch", "radar", "The Watcher flagged 1,360 packs at risk"],
    ["ask", "scan-line", "Vision asked you for a label photo"],
    ["photo", "camera", "You sent the label photo"],
    ["read", "scan-line", "Vision read the label"],
    ["approved", "check", `${Z.C} approved the plan`],
    ["list", "shopping-bag", "772 listed on ExpireSoon in your name"],
    ["outreach", "send", "The scheme went to 38 of your kiranas"],
    ["accepted", "handshake", `${D.BUYER.name} took the counter at ₹14.20`],
    ["orders", "store", "31 kiranas ordered 588 packets"],
    ["dispatch", "truck", `You loaded ${D.BUYER.name}'s truck`],
    ["papers", "file-check", "The Paperwork agent drafted your papers"],
    ["van", "route", "Your Tuesday van round delivered the scheme"],
    ["ledger", "badge-check", "Settled: you ended whole"]
  ];
  function storyMoments(s) {
    const seen = new Set((s.feed || []).map((e) => e.key));
    const items = [];
    let next = 0;
    FEED.forEach(([k, icon, title]) => {
      const e = (s.feed || []).find((x) => x.key === k);
      if (e) items.push({ k, icon, title, at: e.at });
      else if (next < 3 && seen.size) {
        items.push({ k, icon, title, ahead: true });
        next++;
      }
    });
    return items;
  }
  function WholeCard({ c, story, s, onPaper }) {
    const w = story ? storyWhole(s) : Z.whole(c);
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "You end whole"), /* @__PURE__ */ React.createElement(Badge, { tone: story && s.hero.phase !== "cleared" ? void 0 : "green", icon: story && s.hero.phase !== "cleared" ? "clock" : "check" }, story && s.hero.phase !== "cleared" ? "on the plan" : "settled")), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, w.rows.map((r) => /* @__PURE__ */ React.createElement(Line, { key: r.k, k: r.k, sub: r.sub, v: Z.inr(r.v), onClick: r.paper && !story ? () => onPaper(r.paper) : null })), /* @__PURE__ */ React.createElement("div", { className: "hairline", style: { margin: "4px 0" } }), /* @__PURE__ */ React.createElement(Line, { k: "What you receive", v: Z.inr(w.recv), strong: true }), /* @__PURE__ */ React.createElement(Line, { k: "What you paid", sub: `${fmt.num(w.units)} × ₹${w.dp}, the van and the listing fee`, v: Z.inr(-w.paid) }), /* @__PURE__ */ React.createElement(Line, { k: "Your gain or loss", v: Z.inr(w.gain), strong: true })), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Instead of waiting weeks for an expiry claim, with no claim paperwork.")));
  }
  function storyWhole(s) {
    const KL = D.PLAN.lines.find((l) => l.id === "kirana"), ES = D.PLAN.lines.find((l) => l.id === "expiresoon"), sku = D.SKUS.chips;
    const rows = [{ k: "From your kiranas", sub: `${fmt.num(KL.units)} packets on the scheme`, v: KL.gross }, { k: `From ${D.BUYER.name}`, sub: `${fmt.num(ES.units)} packets`, v: s.hero.award ? D.AWARD.gross : ES.gross }, { k: "Price-support credit note", sub: "from Munchly", v: D.SUPPORT.total }];
    const recv = rows.reduce((t, r) => t + r.v, 0), paid = D.PLAN.units * sku.dp + D.SUPPORT.van + D.SUPPORT.fee;
    return { rows, recv, paid, gain: Math.round(recv - paid), dp: sku.dp, units: D.PLAN.units };
  }
  function Papers({ c, ready, onOpen }) {
    if (!ready) return /* @__PURE__ */ React.createElement(Locked, { icon: "file-text", agent: "Paperwork agent", text: "Drafts your tax invoice to the buyer and Munchly's price-support credit note to you once every line of the plan is done." });
    const p = Z.distPapers(c);
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "sc130-head" }, "Your papers"), /* @__PURE__ */ React.createElement("div", { className: "sc130-papers" }, p.mine.map((d) => /* @__PURE__ */ React.createElement(Z.PaperRow, { key: d.id, c, d, onOpen })))), p.copies.length ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "sc130-head" }, "Copies for your records"), /* @__PURE__ */ React.createElement("div", { className: "sc130-papers" }, p.copies.map((d) => /* @__PURE__ */ React.createElement(Z.PaperRow, { key: d.id, c, d, onOpen })))) : null, /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "Each opens on paper with its PDF. ", Z.C, "'s own GST memo and FSSAI checklist stay with ", Z.C, "."));
  }
  function Offers({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const { toast } = useNotice();
    const k = Z.shopOf(me);
    const [dec, setDec] = useState(Z.declinedAt());
    const list = Z.offersFor(k, s, dec);
    const open = list.find((o) => o.status === "open");
    const now = list.find((o) => o.story);
    const earlier = list.filter((o) => o !== open);
    const no = () => {
      Z.decline();
      setDec(Z.declinedAt());
      toast({ text: "Declined · Rakesh Traders' next scheme still comes to you" });
    };
    const after = () => {
      Z.undecline();
      setDec(null);
      go("offer");
    };
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Offers", sub: `${k.name} · ${k.area}, Nagpur` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, open ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(S.OfferCard, { shop: k.name, onOpen: () => go("offer") }), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "lg", block: true, onClick: no }, "Not this time")) : now && now.status === "declined" ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: 64 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "You said not this time"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Masala Chips 150 g · declined ", Z.when(now.declinedAt), ". The offer stays open until ", Z.when(now.closed), " if you change your mind."))), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, onClick: after }, "Order after all")) : now && now.status === "ordered" ? /* @__PURE__ */ React.createElement(Card, { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: 64 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Ordered · ", now.units, " packets"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Masala Chips 150 g · comes on Tuesday's van")), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "confirmed")) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "kirana", title: "No open offer", body: "Rakesh Traders' schemes arrive here as a notification, in Hindi, ready to order in one tap." })), /* @__PURE__ */ React.createElement(List, { head: "Earlier offers" }, earlier.map((o) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: o.ref,
        chevron: true,
        onClick: () => go("offer", { ref: o.ref }),
        leading: /* @__PURE__ */ React.createElement(Product, { name: o.sku.img, size: 40 }),
        title: o.sku.name,
        sub: `${Z.day(o.sent)} · ${o.dist.short} · ₹${o.pack.toFixed(2)} a packet`,
        value: /* @__PURE__ */ React.createElement(Z.OfferStatus, { o, size: "sm" })
      }
    )))));
  }
  function OfferPage({ me, o, k }) {
    const head = /* @__PURE__ */ React.createElement(Z.Head, { sku: o.sku, id: o.ref, where: `From ${o.dist.short}`, badge: /* @__PURE__ */ React.createElement(Z.OfferStatus, { o, size: "sm" }), line: `Sent ${Z.when(o.sent)}` });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: o.sku.name, back: "Offers", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, o.status === "ordered" ? /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Your order"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, o.van ? `delivered ${Z.weekday(o.van)}` : "on the round")), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement(Line, { k: `You ordered ${o.units} packets`, sub: Z.when(o.orderedAt), v: "" }), /* @__PURE__ */ React.createElement(Line, { k: "You paid", sub: `${o.m.paid} × ₹${o.pack.toFixed(2)}`, v: fmt.inr(o.m.pay) }), /* @__PURE__ */ React.createElement(Line, { k: "Free packets", sub: "2 with every 10", v: o.m.free }), /* @__PURE__ */ React.createElement(Line, { k: "You sell at MRP", sub: `${o.units} × ₹${o.mrp}`, v: fmt.inr(o.m.sell) }), /* @__PURE__ */ React.createElement("div", { className: "hairline", style: { margin: "4px 0" } }), /* @__PURE__ */ React.createElement(Line, { k: "Your margin", v: fmt.inr(o.m.margin), strong: true })), o.van && /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Delivered on ", Z.weekday(o.van), "'s van, ", Z.day(o.van), " · paid on delivery to ", o.dist.short)) : /* @__PURE__ */ React.createElement(Card, { className: "row top", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile", style: { background: "var(--fill-2)", color: "var(--fg-2)" } }, /* @__PURE__ */ React.createElement(Icon, { name: o.status === "declined" ? "x" : "clock", size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, o.status === "declined" ? "You said not this time" : "This offer expired"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, Z.whyText(o), ". Nothing was ordered and nothing is owed."))), /* @__PURE__ */ React.createElement(List, { head: "What was offered" }, /* @__PURE__ */ React.createElement(ListRow, { title: "Price", value: `₹${o.pack.toFixed(2)} a packet · MRP ₹${o.mrp}` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Scheme", value: "Buy 10, get 2 free" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Your share", value: `up to ${o.share} packets` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Open for", value: "48 hours" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Best before", value: fmt.date(o.bestBefore) }))));
  }
  function Orders({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const k = Z.shopOf(me);
    const list = Z.offersFor(k, s, Z.declinedAt()).filter((o) => o.status === "ordered");
    const margin = list.reduce((t, o) => t + o.m.margin, 0), packets = list.reduce((t, o) => t + o.units, 0);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: k.name }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, list.length ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: margin, size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "your margin at MRP")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, list.length, " orders since July, ", fmt.num(packets), " packets, each delivered on the van with 2 free in every 12.")), /* @__PURE__ */ React.createElement(List, null, list.map((o) => /* @__PURE__ */ React.createElement(ListRow, { key: o.ref, chevron: true, onClick: () => go("offer", { ref: o.ref }), leading: /* @__PURE__ */ React.createElement(Product, { name: o.sku.img, size: 40 }), title: `${o.sku.name} · ${o.units} packets`, sub: `ordered ${Z.when(o.orderedAt)}${o.van ? ` · ${Z.weekday(o.van)}'s van` : " · on the round"}`, value: /* @__PURE__ */ React.createElement(Money, { value: o.m.margin, size: "s" }) })))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "shopping-basket", title: "No orders yet", body: "Orders you place from an offer show here with the van day." }))));
  }
  const PickupsOrig = S.Pickups;
  function Pickups({ me }) {
    const s = useStore();
    const { route, go } = useRoute();
    const ref = route.params && route.params.ref;
    const list = Z.pickupsFor(me.org, s);
    if (ref) {
      const p = list.find((x) => x.ref === ref);
      if (p && p.story) return /* @__PURE__ */ React.createElement(PickupsOrig, { me });
      if (p) return /* @__PURE__ */ React.createElement(PickupPage, { me, p });
    }
    const coming = list.filter((p) => p.state !== "collected"), done = list.filter((p) => p.state === "collected");
    const meals = done.reduce((t, p) => t + p.meals, 0), packs = done.reduce((t, p) => t + p.units, 0), kg = done.reduce((t, p) => t + p.kg, 0);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Pickups", sub: `${me.org} · surplus food from ${Z.C}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20, maxWidth: 760 } }, coming.length ? /* @__PURE__ */ React.createElement(List, { head: "Coming" }, coming.map((p) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: p.ref,
        chevron: true,
        onClick: () => go("pickups", { ref: p.ref }),
        leading: /* @__PURE__ */ React.createElement(Product, { name: p.sku.img, size: 44 }),
        title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, p.units, " packs of ", p.sku.name.replace(/ \d.*$/, "")), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true, live: true }, p.state === "booked" ? "asks for a time" : "confirmed")),
        sub: `${p.slot} · from ${p.from}`
      }
    ))) : null, done.length ? /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement("span", { className: "num l" }, fmt.num(meals)), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "meals from ", Z.C, "'s surplus since July")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, done.length, " pickups, ", fmt.num(packs), " packs, ", fmt.kg(Math.round(kg * 100) / 100), " kept out of landfill, each with its receipt and the FSSAI checklist.")) : null, done.length ? /* @__PURE__ */ React.createElement(List, { head: "Collected" }, done.map((p) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: p.ref,
        chevron: true,
        onClick: () => go("pickups", { ref: p.ref }),
        leading: /* @__PURE__ */ React.createElement(Product, { name: p.sku.img, size: 44 }),
        title: `${p.units} packs of ${p.sku.name.replace(/ \d.*$/, "")}`,
        sub: `Collected ${Z.when(p.collected)} · ${p.from}`,
        value: /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "mono", style: { fontSize: 13 } }, p.receipt.no), /* @__PURE__ */ React.createElement("em", null, fmt.num(p.meals), " meals"))
      }
    ))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "donation-crate", title: "No pickups yet", body: "Brands' donation agents send surplus food here when it fits your intake rules." }))));
  }
  function PickupPage({ me, p }) {
    const [open, setOpen] = useState(false);
    const head = /* @__PURE__ */ React.createElement(Z.Head, { sku: p.sku, id: p.ref, where: p.from, badge: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "collected"), line: `Donor: ${D.CLIENT.name} via ${p.dist.name}` });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: p.sku.name, back: "Pickups", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 340,
        main: /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Pickup"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, p.units, " packs")), /* @__PURE__ */ React.createElement(VTracker, { items: [{ id: "req", title: "Requested by the donation agent", time: Z.when(p.asked) }, { id: "conf", title: "Confirmed by you", time: Z.when(p.confirmed) }, { id: "col", title: `Collected from ${p.from}`, time: Z.when(p.collected) }, { id: "serve", title: `Served at ${p.spot}`, time: "that week" }], done: 4 }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "receipt-row", onClick: () => setOpen(true) }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 20 }), /* @__PURE__ */ React.createElement("span", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, p.receipt.type, " ", p.receipt.no), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, fmt.num(p.units), " packs · ", fmt.num(p.meals), " meals · shared with ", Z.C, " for its BRSR table")), /* @__PURE__ */ React.createElement("span", { className: "receipt-view" }, "View", /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16 }))))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, null, "FSSAI surplus-food checklist"), /* @__PURE__ */ React.createElement(Card, { className: "paper stack tight", style: { padding: 18 } }, Z.fssaiItems(p).map((t) => /* @__PURE__ */ React.createElement("div", { key: t, className: "row top", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Icon, { name: "square-check", size: 17, style: { color: "#167a52", marginTop: 1 } }), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, t)))))
      }
    ), /* @__PURE__ */ React.createElement(Z.PaperSheet, { open, onClose: () => setOpen(false), c: p.c, receipt: p.receipt }));
  }
  const BatchesOrig = S.Batches, OfferOrig = S.OfferDetail;
  S.Batches = (props) => props.me.role === "distributor" ? /* @__PURE__ */ React.createElement(DistBatches, { ...props }) : /* @__PURE__ */ React.createElement(BatchesOrig, { ...props });
  S.RetailHome = Offers;
  S.RetailOrders = Orders;
  S.OfferDetail = (props) => {
    const s = useStore();
    const { route } = useRoute();
    const ref = route.params && route.params.ref;
    const k = Z.shopOf(props.me);
    const o = ref && Z.offersFor(k, s, Z.declinedAt()).find((x) => x.ref === ref);
    return o && o.status !== "open" ? /* @__PURE__ */ React.createElement(OfferPage, { ...props, o, k }) : /* @__PURE__ */ React.createElement(OfferOrig, { ...props });
  };
  S.Pickups = Pickups;
})();

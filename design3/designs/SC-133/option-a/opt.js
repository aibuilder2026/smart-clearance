(function() {
  const { useState } = React;
  const { motion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER, W = window.SC3_WORLD, Flow = window.SC3_FLOW, X = window.SCD;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, Money, Empty, ClusterMap, HaulLine, Aura, Mark, WorkspaceMark, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle } = S;
  const fmt = M.fmt;
  S.NAV.distributor.splice(
    0,
    S.NAV.distributor.length,
    { id: "home", label: "Today", icon: "house" },
    { id: "batches", label: "Batches", icon: "boxes" },
    { id: "van", label: "Deliveries", short: "Deliveries", icon: "truck", phoneHidden: true },
    { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true },
    { id: "orders", label: "Orders", icon: "clipboard-list" }
  );
  function Acting({ p }) {
    return /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile", style: { width: 40, height: 40, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: "handshake", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, "Smart-Clearance acts for you"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Inside ", D.WORKSPACE.short, "'s floors · since ", p.at, " · listings, scheme offers, invoice drafts, dispatch slots")), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "pause" }, "Pause"));
  }
  function Step({ t, j, primary }) {
    const { go } = useRoute();
    const { toast } = useNotice();
    const run = () => {
      if (t.act && !t.route) {
        Flow.act(t.act);
        toast({ text: `${t.title} · done`, tone: "ok" });
      } else go(t.route, t.route === "van" ? { ref: j.ref } : void 0);
    };
    return /* @__PURE__ */ React.createElement("div", { className: cx("dk-step", primary && "primary") }, /* @__PURE__ */ React.createElement("span", { className: "icontile", style: { width: primary ? 44 : 36, height: primary ? 44 : 36, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: primary ? 20 : 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "grow stack tight", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: primary ? "t-headline" : "t-subhead" }, t.title), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, t.sub)), /* @__PURE__ */ React.createElement(Button, { variant: primary ? "primary" : "secondary", size: primary ? "md" : "sm", icon: t.icon, onClick: run }, t.cta));
  }
  function BatchCard({ j }) {
    const { go } = useRoute();
    const phone = useApp().bp === "phone";
    return /* @__PURE__ */ React.createElement(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }, className: "card dk-batch" }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(X.BatchLine, { sku: j.sku, id: j.ref, badge: X.stopBadge(j), sub: `${X.num(j.units)} packs at risk · flagged ${X.day(j.flagged)}`, size: phone ? 44 : 56 }), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", iconRight: "chevron-right", onClick: () => go("batches", { ref: j.ref }) }, "The batch")), j.todo.length ? /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 8 } }, j.todo.map((t, i) => /* @__PURE__ */ React.createElement(Step, { key: t.id, t, j, primary: i === 0 }))) : /* @__PURE__ */ React.createElement("div", { className: "dk-wait" }, /* @__PURE__ */ React.createElement(Aura, { on: true, className: "icontile soft", style: { width: 36, height: 36, borderRadius: 11 } }, /* @__PURE__ */ React.createElement(Icon, { name: "sparkles", size: 17 })), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, j.waiting), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Nothing for you now")), /* @__PURE__ */ React.createElement("div", { className: "dk-lines" }, j.lines.map((l) => /* @__PURE__ */ React.createElement(X.LineRow, { key: l.id, line: l, onOpen: l.route ? () => go(l.route, { ref: j.ref }) : null }))));
  }
  function Today({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const dist = X.distOf(me), perm = s.setup.permission, hero = dist.id === "rakesh";
    const js = X.journey(dist, s);
    const b = L.partners.distBatches(dist.id, s);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Today", sub: `${dist.name} · ${dist.godown}, ${dist.city}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 960 } }, hero && (perm ? /* @__PURE__ */ React.createElement(Acting, { p: perm }) : /* @__PURE__ */ React.createElement(S.PermissionCard, null)), /* @__PURE__ */ React.createElement(SectionTitle, { sub: `${D.WORKSPACE.short}'s batches at your godown: what each needs from you, and where each line stands` }, js.length ? `${js.length} ${js.length === 1 ? "batch" : "batches"} in a journey` : "No batch in a journey"), js.length ? js.map((j) => /* @__PURE__ */ React.createElement(BatchCard, { key: j.ref, j })) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "godown", title: "Nothing asks for you today", body: `When the Watcher flags a batch at ${dist.godown}, it opens here with what it needs from you.` })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "dk-more", onClick: () => go("batches") }, /* @__PURE__ */ React.createElement(Icon, { name: "boxes", size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "grow" }, "Your other stock and the batches you cleared are on ", /* @__PURE__ */ React.createElement("b", null, "Batches"), ": ", b.watching.length, " the Watcher reads, ", b.past.length, " cleared since July"), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16, className: "subtle" }))));
  }
  function Switcher({ js, value, onChange }) {
    if (js.length < 2) return null;
    return /* @__PURE__ */ React.createElement("nav", { className: "bh-tabs", "aria-label": "Batches in a journey" }, js.map((j) => {
      const on = j.ref === value;
      return /* @__PURE__ */ React.createElement("button", { key: j.ref, type: "button", className: "bh-tab", "aria-current": on ? "page" : void 0, onClick: () => onChange(j.ref) }, on && /* @__PURE__ */ React.createElement(motion.span, { layoutId: "dka-thumb", className: "bh-tab-thumb", transition: { type: "spring", stiffness: 500, damping: 40 } }), /* @__PURE__ */ React.createElement(Product, { name: j.sku.img, size: 22 }), /* @__PURE__ */ React.createElement("span", null, j.sku.name.replace(/ \d.*$/, "")));
    }));
  }
  function Deliveries({ me }) {
    const s = useStore();
    const { route, go } = useRoute();
    const dist = X.distOf(me), js = X.journey(dist, s);
    const ref = route && route.params && route.params.ref;
    const j = js.find((x) => x.ref === ref) || js[0];
    if (!j) return /* @__PURE__ */ React.createElement(Screen, { me, title: "Deliveries", sub: dist.cluster }, /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 560 } }, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "Nothing goes out", body: "While a batch is in a journey, its van round and the buyer's truck show here." })));
    const has = (id) => j.lines.some((l) => l.id === id);
    const head = /* @__PURE__ */ React.createElement(S.PtHead, { sku: j.sku, id: j.ref, where: `${dist.godown}, ${dist.city}`, badge: X.stopBadge(j), line: "What leaves your godown for this batch, line by line" }, /* @__PURE__ */ React.createElement(Switcher, { js, value: j.ref, onChange: (r) => go("van", { ref: r }) }));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: j.sku.name, back: "Today", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 380,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, has("kirana") && /* @__PURE__ */ React.createElement(X.VanCard, { j, s }), !has("kirana") && /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "No van round", body: "This batch has no kirana scheme." }))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, has("expiresoon") && /* @__PURE__ */ React.createElement(X.TruckCard, { j, s }), has("staff") && /* @__PURE__ */ React.createElement(X.StaffCard, { j }), has("foodbank") && /* @__PURE__ */ React.createElement(X.PickupCard, { j, s }))
      }
    ));
  }
  function Orders({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const dist = X.distOf(me), book = X.orderBook(dist, s);
    const all = book.flatMap((b) => b.rows), total = all.reduce((t, o) => t + o.amount, 0);
    const shops = all.filter((o) => o.id === "kirana").reduce((t, o) => t + (o.shops ? o.shops.length : 0), 0), lots = all.filter((o) => o.id === "expiresoon").length;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: `${dist.name} · what sold from each of ${D.WORKSPACE.short}'s batches, to whom, on which paper` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 960 } }, book.length ? /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: total, size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "sold from ", D.WORKSPACE.short, "'s batches since July")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, book.length, " batches · ", shops, " kiranas' scheme orders · ", lots, " ExpireSoon ", lots === 1 ? "lot" : "lots", " · every staff sale. The price support is on each batch's papers.")) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "No orders yet", body: "When a batch's scheme, lot or staff sale sells, each order shows here under its batch." })), book.map((b) => /* @__PURE__ */ React.createElement(Card, { key: b.ref, className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(X.BatchLine, { sku: b.sku, id: b.ref, size: 44, badge: b.live ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true, live: true }, "In a journey · ", b.stop) : /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: b.outcome, size: "sm" }), sub: b.live ? "orders so far" : `cleared ${X.day(b.cleared)}` }), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, X.inr(b.rows.reduce((t, o) => t + o.amount, 0))), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", iconRight: "chevron-right", onClick: () => go("batches", { ref: b.ref }) }, "Papers"))), /* @__PURE__ */ React.createElement("div", { className: "dk-orders" }, b.rows.map((o) => /* @__PURE__ */ React.createElement(X.OrderRow, { key: o.id, o })))))));
  }
  S.DistHome = Today;
  S.VanRoute = Deliveries;
  S.DistOrders = Orders;
})();

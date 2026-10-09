(function() {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER, Flow = window.SC3_FLOW, X = window.SCD;
  const { cx, Icon, Badge, Button, Card, Product, Money, Empty, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle } = S;
  const P = L.partners;
  S.NAV.distributor.splice(
    0,
    S.NAV.distributor.length,
    { id: "home", label: "Today", icon: "house" },
    { id: "batches", label: "Batches", icon: "boxes" },
    { id: "van", label: "Deliveries", icon: "truck" },
    { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true },
    { id: "orders", label: "Orders", icon: "clipboard-list" }
  );
  function useFocus(me, screen, all) {
    const s = useStore();
    const { route, go } = useRoute();
    const dist = X.distOf(me), js = X.journey(dist, s);
    const ref = route && route.params && route.params.ref;
    const j = ref === "all" && all ? null : js.find((x) => x.ref === ref) || js[0] || null;
    const bar = /* @__PURE__ */ React.createElement("nav", { className: "dk-focus", "aria-label": "The batch in focus" }, js.map((x) => /* @__PURE__ */ React.createElement("button", { key: x.ref, type: "button", "aria-current": j && j.ref === x.ref ? "true" : void 0, onClick: () => go(screen, { ref: x.ref }) }, /* @__PURE__ */ React.createElement(Product, { name: x.sku.img, size: 26 }), /* @__PURE__ */ React.createElement("span", null, x.sku.name.replace(/ \d.*$/, "")), /* @__PURE__ */ React.createElement("span", { className: "mono t-caption", style: { opacity: 0.75 } }, x.ref), x.todo.length ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, x.todo.length) : null)), all && /* @__PURE__ */ React.createElement("button", { type: "button", "aria-current": !j ? "true" : void 0, onClick: () => go(screen, { ref: "all" }) }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft", style: { width: 26, height: 26, borderRadius: 99 } }, /* @__PURE__ */ React.createElement(Icon, { name: "boxes", size: 14 })), /* @__PURE__ */ React.createElement("span", null, "All batches, past too")));
    return { s, dist, js, j, bar };
  }
  const YOURS = { photo: "photo", dispatch: "truck", van: "van" };
  function RunSheet({ j, s }) {
    const { go } = useRoute();
    const { toast } = useNotice();
    const run = (t) => {
      if (t.act && !t.route) {
        Flow.act(t.act);
        toast({ text: `${t.title} · done`, tone: "ok" });
      } else go(t.route, t.route === "van" ? { ref: j.ref } : void 0);
    };
    const items = j.b.hero ? P.storyMoments(s) : [
      { k: "watch", icon: "radar", title: `The Watcher flagged ${X.num(j.units)} packs at risk`, at: "done" },
      { k: "approved", icon: "check", title: `${D.WORKSPACE.short} approved the plan`, at: "done" },
      { k: "outreach", icon: "send", title: "The scheme went to your kiranas", at: "done" },
      { k: "staff", icon: "users", title: "Record the staff sale", ahead: true },
      { k: "pickup", icon: "heart-handshake", title: `${D.JOURNEY.donation.partner} collects ${X.num(X.MF.units)} packs`, ahead: true },
      { k: "van", icon: "route", title: "Your van round delivers the scheme", ahead: true }
    ];
    const todoFor = (k) => j.todo.find((t) => t.id === (YOURS[k] || k));
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "The batch's run sheet"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "every step, yours in amber")), /* @__PURE__ */ React.createElement("div", { className: "dk-run" }, items.map((m, i) => {
      const t = todoFor(m.k);
      const mine = !!YOURS[m.k] || m.k === "staff";
      return /* @__PURE__ */ React.createElement("div", { key: m.k + i, className: cx(m.ahead && "ahead", mine && (t || m.ahead) && "yours") }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: m.icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("b", null, m.title), t && /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: t.icon, onClick: () => run(t) }, t.cta))), /* @__PURE__ */ React.createElement("time", null, m.at ? m.at : mine ? "yours" : "next"));
    }), j.todo.filter((t) => t.id === "invoice").map((t) => /* @__PURE__ */ React.createElement("div", { key: "inv", className: "yours" }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("b", null, t.title), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "receipt", onClick: () => run(t) }, t.cta))), /* @__PURE__ */ React.createElement("time", null, "yours")))));
  }
  function Today({ me }) {
    const { go } = useRoute();
    const f = useFocus(me, "home");
    const { s, dist, j } = f, perm = s.setup.permission, hero = dist.id === "rakesh";
    const w = j && j.b.hero ? P.storyWhole(s) : null;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Today", sub: `${dist.name} · ${dist.godown}, ${dist.city}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, hero && !perm && /* @__PURE__ */ React.createElement(S.PermissionCard, null), f.bar, !j ? /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "godown", title: "No batch in a journey", body: `When the Watcher flags a batch at ${dist.godown}, it opens here, step by step.` })) : /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 380,
        main: /* @__PURE__ */ React.createElement(RunSheet, { j, s }),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement(X.BatchLine, { sku: j.sku, id: j.ref, badge: X.stopBadge(j), sub: `${X.num(j.units)} packs at risk`, size: 48 }), /* @__PURE__ */ React.createElement("div", { className: "dk-lines stacked" }, j.lines.map((l) => /* @__PURE__ */ React.createElement(X.LineRow, { key: l.id, line: l, onOpen: l.route ? () => go(l.route, { ref: j.ref }) : null }))), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", iconRight: "chevron-right", onClick: () => go("batches", { ref: j.ref }) }, "The batch's page")), w && /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "You end whole"), /* @__PURE__ */ React.createElement(Badge, { icon: "clock" }, "on the plan")), w.rows.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.k, className: "row between t-subhead" }, /* @__PURE__ */ React.createElement("span", null, r.k), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, X.inr(r.v)))), /* @__PURE__ */ React.createElement("div", { className: "hairline" }), /* @__PURE__ */ React.createElement("div", { className: "row between t-subhead" }, /* @__PURE__ */ React.createElement("span", null, "What you paid: ", X.num(w.units), " × ₹", w.dp, ", the van and the fee"), /* @__PURE__ */ React.createElement("span", { className: "tnum", style: { whiteSpace: "nowrap" } }, X.inr(-w.paid))), /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("b", null, "Your gain or loss"), /* @__PURE__ */ React.createElement("b", { className: "tnum" }, X.inr(w.gain)))))
      }
    )));
  }
  function Deliveries({ me }) {
    const f = useFocus(me, "van");
    const { s, dist, j } = f;
    const has = (id) => j && j.lines.some((l) => l.id === id);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Deliveries", sub: `${dist.name} · what leaves your godown for the batch in focus` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, f.bar, !j ? /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "Nothing goes out", body: "While a batch is in a journey, its van round and the buyer's truck show here." })) : /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 380,
        main: has("kirana") ? /* @__PURE__ */ React.createElement(X.VanCard, { j, s }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "No van round", body: "This batch has no kirana scheme." })),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, has("expiresoon") && /* @__PURE__ */ React.createElement(X.TruckCard, { j, s }), has("staff") && /* @__PURE__ */ React.createElement(X.StaffCard, { j }), has("foodbank") && /* @__PURE__ */ React.createElement(X.PickupCard, { j, s }))
      }
    )));
  }
  function Orders({ me }) {
    const { go } = useRoute();
    const f = useFocus(me, "orders", true);
    const { s, dist, j } = f;
    const book = X.orderBook(dist, s).filter((b) => !j || b.ref === j.ref);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: `${dist.name} · who bought what from ${j ? "the batch in focus" : "each batch"}, on which paper` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 960 } }, f.bar, book.length ? book.map((b) => /* @__PURE__ */ React.createElement(Card, { key: b.ref, className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(X.BatchLine, { sku: b.sku, id: b.ref, size: 44, badge: b.live ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true, live: true }, "In a journey · ", b.stop) : /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: b.outcome, size: "sm" }), sub: b.live ? "orders so far" : `cleared ${X.day(b.cleared)}` }), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Money, { value: b.rows.reduce((t, o) => t + o.amount, 0), size: "s" }), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", iconRight: "chevron-right", onClick: () => go("batches", { ref: b.ref }) }, "Papers"))), /* @__PURE__ */ React.createElement("div", { className: "dk-orders" }, b.rows.map((o) => /* @__PURE__ */ React.createElement(X.OrderRow, { key: o.id, o }))))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "No orders yet", body: "The scheme's orders, the lot and the staff sale of this batch show here as they come in." }))));
  }
  S.DistHome = Today;
  S.VanRoute = Deliveries;
  S.DistOrders = Orders;
})();

(function() {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, Flow = window.SC3_FLOW;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, Empty, BatchRow, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, SectionTitle } = S;
  const fmt = M.fmt;
  const P = () => window.SC3_LEDGER.partners;
  const r2 = (n) => Math.round(n * 100) / 100;
  const asDate = (iso) => /* @__PURE__ */ new Date((iso.length > 10 ? iso : iso + "T00:00") + ":00+05:30");
  const day = (iso) => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const when = (iso) => iso.length > 10 ? `${day(iso)}, ${iso.slice(11, 16)}` : day(iso);
  const monthOf = (iso) => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const CH = { kirana: { icon: "store", name: "Kirana scheme" }, expiresoon: { icon: "shopping-bag", name: "ExpireSoon lot" }, staff: { icon: "users", name: "Staff sale" }, foodbank: { icon: "heart-handshake", name: "Food bank" } };
  const Chan = ({ id }) => /* @__PURE__ */ React.createElement("span", { className: "dist-chan", style: { "--ch": `var(--ch-${id})` }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: CH[id].icon, size: 16, stroke: 2 }));
  const stopBadge = (j) => /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: j.todo.length ? "amber" : j.phase === "cleared" ? "green" : "blue", dot: true, live: !j.todo.length && j.phase !== "cleared" }, j.todo.length ? `${j.todo.length} for you` : j.stop);
  const stopOf = (phase) => ({ "at-risk": "Verify", verified: "Value", valued: "Decide", planned: "Approve", approved: "Execute", executing: "Execute", dispatched: "Settle", settled: "Settle", cleared: "Report" })[phase] || "Detect";
  function BatchLine({ sku, id, badge, sub, size = 48 }) {
    return /* @__PURE__ */ React.createElement("div", { className: "row dist-bl", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "grow stack tight", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("b", { className: "t-headline" }, sku.name), badge), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, id), sub ? ` · ${sub}` : "")));
  }
  function OrderRow({ o }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const { toast } = useNotice();
    const issue = () => {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        Flow.act("issueInvoice");
        toast({ text: "Marked issued from Tally", tone: "ok" });
      }, 400);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "dist-order" }, /* @__PURE__ */ React.createElement(Chan, { id: o.id }), /* @__PURE__ */ React.createElement("span", { className: "grow stack tight", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, /* @__PURE__ */ React.createElement("b", null, o.who), " · ", o.what), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, CH[o.id].name, o.at ? ` · ${when(o.at)}` : "", o.sub ? ` · ${o.sub}` : ""), o.paper && /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "dist-paper" }, /* @__PURE__ */ React.createElement(Icon, { name: "file-text", size: 13 }), /* @__PURE__ */ React.createElement("span", { className: "mono" }, o.paper.no), /* @__PURE__ */ React.createElement("span", null, o.paper.label)), o.paper.issue && /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "check", loading: busy, onClick: issue }, "Issue from Tally")), o.shops && o.shops.length > 0 && /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link t-footnote dist-toggle", "aria-expanded": open, onClick: () => setOpen(!open) }, open ? "Hide" : "Show", " the ", o.shops.length, " shops' orders"), open && /* @__PURE__ */ React.createElement("div", { className: "dist-shops" }, o.shops.map((k) => /* @__PURE__ */ React.createElement("span", { key: k.name }, /* @__PURE__ */ React.createElement("b", null, k.name), k.at && /* @__PURE__ */ React.createElement("em", null, when(k.at)), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, k.units))))), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, o.amount ? fmt.inr(o.amount) : "given"));
  }
  function sumOf(c) {
    const w = P().whole(c);
    const sold = r2(w.rows.filter((r) => !r.paper).reduce((t, r) => t + r.v, 0));
    const credit = r2(w.rows.filter((r) => r.paper).reduce((t, r) => t + r.v, 0));
    return { ref: c.ref, sku: c.sku, cost: w.paid, sold, credit, gain: w.gain, rows: w.rows, units: w.units, dp: w.dp, extra: w.extra };
  }
  function book(distId, s) {
    const past = P().distBatches(distId, s).past;
    const sums = past.map(sumOf);
    const t = (k) => r2(sums.reduce((a, x) => a + x[k], 0));
    const notes = past.reduce((n, c) => n + c.docs.filter((d) => (d.id === "support" || d.id === "expiry") && d.status !== "not required").length, 0);
    return { past, sums, n: past.length, cost: t("cost"), sold: t("sold"), credit: t("credit"), notes, of: (ref) => sums.find((x) => x.ref === ref) };
  }
  function DistBatchesPage({ me, Head, RowValue, Below }) {
    const s = useStore();
    const { route, go } = useRoute();
    const phone = useApp().bp === "phone";
    const dist = S.distOf(me);
    const ref = route && route.params && route.params.ref;
    if (ref) return /* @__PURE__ */ React.createElement(S.DistBatch, { me, dist, id: ref });
    const { journey, watching } = P().distBatches(dist.id, s);
    const b = book(dist.id, s);
    const months = [];
    b.past.forEach((c) => {
      const m = c.cleared.slice(0, 7);
      let g = months.find((x) => x.m === m);
      if (!g) months.push(g = { m, label: monthOf(c.cleared), items: [] });
      g.items.push(c);
    });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Batches", sub: `${dist.name} · every batch of ${D.WORKSPACE.short}'s the Watcher flagged at your godown` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, journey.length ? /* @__PURE__ */ React.createElement(List, { head: "In a journey now" }, journey.map((x) => {
      const sku = D.SKUS[x.sku];
      const phase = x.hero ? s.hero.phase : s.mango.phase;
      return /* @__PURE__ */ React.createElement(
        ListRow,
        {
          key: x.id,
          chevron: true,
          onClick: () => go("batches", { ref: x.id }),
          leading: /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 40 }),
          title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, sku.name), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true, live: true }, stopOf(phase))),
          sub: `${x.id} · flagged ${day(D.DAY0)} · the agents act in your name`,
          value: phone ? null : `${fmt.num(x.hero ? D.PLAN.units : D.MANGO_PLAN.units)} packs`
        }
      );
    })) : null, b.n ? /* @__PURE__ */ React.createElement(Head, { b, page: "batches" }) : null, Below && b.n ? /* @__PURE__ */ React.createElement(Below, { b, page: "batches" }) : null, months.map((g) => /* @__PURE__ */ React.createElement(List, { key: g.m, head: `Cleared · ${g.label}` }, g.items.map((c) => {
      const x = b.of(c.ref);
      return /* @__PURE__ */ React.createElement(
        ListRow,
        {
          key: c.ref,
          chevron: true,
          onClick: () => go("batches", { ref: c.ref }),
          leading: /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: 40 }),
          title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, c.sku.name), !phone && /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" })),
          sub: `${c.ref} · flagged ${day(c.flagged)} · cleared ${day(c.cleared)}`,
          value: /* @__PURE__ */ React.createElement(RowValue, { c, x, page: "batches" })
        }
      );
    }))), watching.length ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "From your nightly DMS export: nothing at risk" }, "Watching"), /* @__PURE__ */ React.createElement("div", { className: "list" }, watching.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: D.batchView(v), compact: phone, onOpen: () => {
    } })))) : null));
  }
  function DistOrdersPage({ me, Head, BatchValue, Below }) {
    const s = useStore();
    const { go } = useRoute();
    const Px = P();
    const dist = S.distOf(me);
    const now = Px.distNow(dist.id, s).map((n) => {
      const j = Px.journeyOf(n);
      return { ref: n.ref, sku: j.sku, live: true, j, rows: Px.ordersNow(n, Px.shopName) };
    });
    const pastB = Px.distBatches(dist.id, s).past.map((c) => ({ ref: c.ref, sku: c.sku, live: false, outcome: c.outcome, cleared: c.cleared, rows: Px.ordersPast(Px.historyFacts(c), Px.shopName) })).filter((x) => x.rows.length);
    const all = now.concat(pastB);
    const b = book(dist.id, s);
    const sum = (rows) => r2(rows.reduce((t, o) => t + o.amount, 0));
    const live = r2(now.reduce((t, x) => t + sum(x.rows), 0));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: `${dist.name} · what sold from each of ${D.WORKSPACE.short}'s batches, to whom, on which paper` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 960 } }, all.length ? /* @__PURE__ */ React.createElement(Head, { b, page: "orders", live }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "van", title: "No orders yet", body: "When a batch's scheme, lot or staff sale sells, each order shows here under its batch." })), Below && b.n ? /* @__PURE__ */ React.createElement(Below, { b, page: "orders" }) : null, all.map((x) => /* @__PURE__ */ React.createElement(Card, { key: x.ref, className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(BatchLine, { sku: x.sku, id: x.ref, size: 44, badge: x.live ? stopBadge(x.j) : /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: x.outcome, size: "sm" }), sub: x.live ? x.j.phase === "cleared" ? "cleared · every order" : x.rows.length ? "orders so far" : "no orders yet" : `cleared ${day(x.cleared)}` }), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, x.rows.length > 0 && /* @__PURE__ */ React.createElement(BatchValue, { x: b.of(x.ref), sold: sum(x.rows), live: x.live }), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", iconRight: "chevron-right", onClick: () => go("batches", { ref: x.ref }) }, "Papers"))), x.rows.length ? /* @__PURE__ */ React.createElement("div", { className: "dist-orders" }, x.rows.map((o) => /* @__PURE__ */ React.createElement(OrderRow, { key: o.id, o }))) : /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: 0 } }, x.j.waiting || "Its orders show here as they come in.")))));
  }
  function SplitBar({ sold, credit, label }) {
    const t = sold + credit || 1;
    return /* @__PURE__ */ React.createElement("span", { className: "fx-bar", role: "img", "aria-label": label }, /* @__PURE__ */ React.createElement("i", { className: "sold", style: { width: `${sold / t * 100}%` } }), /* @__PURE__ */ React.createElement("i", { className: "credit", style: { width: `${credit / t * 100}%` } }));
  }
  window.SCF = { sumOf, book, DistBatchesPage, DistOrdersPage, SplitBar, r2, day, monthOf };
})();

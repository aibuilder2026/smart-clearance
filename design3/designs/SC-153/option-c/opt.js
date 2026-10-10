(function() {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCK;
  const fmt = M.fmt;
  const { Icon, Badge, Button, Card, List, ListRow, Product, Money, useNotice } = K;
  const { useStore, useRoute, Screen } = S;
  const P = () => window.SC3_LEDGER.partners;
  const orig = { OfferDetail: S.OfferDetail, DistBatches: S.DistBatches };
  const useSave = () => {
    const { toast } = useNotice();
    return (name) => toast({ text: `${name}.pdf saved`, tone: "ok" });
  };
  function OfferDetail({ me }) {
    const s = useStore();
    const save = useSave();
    const { route } = useRoute();
    const ref = route && route.params && route.params.ref;
    const shop = S.shopOf(me);
    const o = ref && P().offersFor(shop, s).find((x) => x.ref === ref);
    const inv = o && o.status === "ordered" && F.shopInvoices(shop, s).find((x) => x.ref === o.ref);
    if (!inv) return /* @__PURE__ */ React.createElement(orig.OfferDetail, { me });
    const head = /* @__PURE__ */ React.createElement(S.PtHead, { sku: o.sku, id: o.ref, where: `From ${o.dist.short}`, badge: /* @__PURE__ */ React.createElement(S.OfferStatus, { o, size: "sm" }), line: `Sent ${F.when(o.sent)}` });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: o.sku.name, back: "Offers", below: head, hideLarge: true }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Your order"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "delivered Tuesday")), /* @__PURE__ */ React.createElement(F.OrderFigures, { inv }), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, icon: "download", onClick: () => save(inv.no), style: { marginTop: 8 } }, "Tax invoice ", /* @__PURE__ */ React.createElement("span", { className: "mono", style: { marginLeft: 6 } }, inv.no), " · PDF"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, o.dist.name, " issued it from Tally · paid on delivery")), /* @__PURE__ */ React.createElement(List, { head: "What was offered" }, /* @__PURE__ */ React.createElement(ListRow, { title: "Price", value: `₹${o.pack.toFixed(2)} a packet, before GST · MRP ₹${o.mrp}` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Scheme", value: "Buy 10, get 2 free, as a discount on the invoice" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Your share", value: `up to ${o.share} packets` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Best before", value: fmt.date(o.bestBefore) }))));
  }
  function RetailOrders({ me }) {
    const s = useStore();
    const save = useSave();
    const { go } = useRoute();
    const shop = S.shopOf(me);
    const list = F.shopInvoices(shop, s).slice().reverse();
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: shop.name }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: F.sum(list, "margin"), size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "your margin at MRP")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, list.length, " orders since July, ", fmt.num(F.sum(list, "units")), " packets, ", fmt.inr(F.sum(list, "total")), " paid, GST included. Each invoice is a PDF.")), /* @__PURE__ */ React.createElement(List, null, list.map((x) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: x.no,
        onClick: () => go("offer", { ref: x.ref }),
        chevron: true,
        leading: /* @__PURE__ */ React.createElement(Product, { name: x.sku.img, size: 40 }),
        title: `${x.sku.name} · ${x.units} packets`,
        sub: /* @__PURE__ */ React.createElement("span", null, F.when(x.at), " · ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link", onClick: (e) => {
          e.stopPropagation();
          save(x.no);
        } }, /* @__PURE__ */ React.createElement(Icon, { name: "download", size: 12 }), " ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, x.no))),
        value: /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr2(x.margin)), /* @__PURE__ */ React.createElement("em", null, "margin"))
      }
    )))));
  }
  function Shops({ inv }) {
    const save = useSave();
    return /* @__PURE__ */ React.createElement("div", { className: "sk-pdfs" }, inv.map((v) => /* @__PURE__ */ React.createElement("span", { key: v.no, className: "sk-pdf" }, /* @__PURE__ */ React.createElement("b", null, v.shop.name, " · ", v.units), /* @__PURE__ */ React.createElement("em", null, /* @__PURE__ */ React.createElement("span", { className: "mono" }, v.no), " · ", fmt.inr(v.total)), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", icon: "download", onClick: () => save(v.no), "aria-label": `Download ${v.no} as a PDF` }, "PDF"))));
  }
  function PapersMore({ c, dist }) {
    const s = useStore();
    const save = useSave();
    const list = F.invoicesOf(c.batch.id, dist.id, s);
    if (!list.length) return null;
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-paper", onClick: () => save(`${c.batch.id}-kirana-invoices`) }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Tax invoices to kiranas · ", list.length, ", one PDF"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, F.range(list)), " · You issue them")), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(F.sum(list, "total"))), /* @__PURE__ */ React.createElement(Icon, { name: "download", size: 16, className: "subtle" }));
  }
  function PdfList({ list }) {
    const save = useSave();
    return /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, icon: "download", onClick: () => save("all") }, "All ", list.length, " invoices as one PDF"), /* @__PURE__ */ React.createElement("div", { className: "pt-papers" }, list.map((x) => /* @__PURE__ */ React.createElement("button", { key: x.no, type: "button", className: "pt-paper", onClick: () => save(x.no) }, /* @__PURE__ */ React.createElement("span", { className: "grow" }, /* @__PURE__ */ React.createElement("b", { className: "mono" }, x.no), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, x.shop.name, " · ", x.units, " packets · ", F.dmy(x.date))), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(x.total)), /* @__PURE__ */ React.createElement(Icon, { name: "download", size: 16, className: "subtle" })))));
  }
  function Paperwork({ me }) {
    const s = useStore();
    const c = window.SC3_LEDGER.storyCase();
    const list = F.invoicesOf(c.batch.id, c.dist.id, s);
    const card = { doc: { id: "kirana", type: "Tax invoices to kiranas", owner: c.dist.name, no: `${list.length} PDFs`, status: "generated", amount: F.sum(list, "total") }, sub: `${c.dist.name}' invoices, each the Paperwork agent's PDF`, list };
    return /* @__PURE__ */ React.createElement(F.PackPage, { me, cards: [card], paperOf: (x) => /* @__PURE__ */ React.createElement(PdfList, { list: x.list }), startOn: new URLSearchParams(location.search).get("open") || null });
  }
  Object.assign(S, {
    OfferDetail,
    RetailOrders,
    Paperwork,
    DistOrders: (props) => /* @__PURE__ */ React.createElement(F.DistOrdersPage, { ...props, Shops }),
    DistBatches: (props) => {
      const { route } = useRoute();
      const ref = route && route.params && route.params.ref;
      return ref ? /* @__PURE__ */ React.createElement(F.DistBatchPage, { ...props, id: ref, PapersMore, start: new URLSearchParams(location.search).get("tab") || "papers" }) : /* @__PURE__ */ React.createElement(orig.DistBatches, { ...props });
    }
  });
})();

(function() {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCK;
  const fmt = M.fmt;
  const { Icon, Badge, Card, List, ListRow, Product, Money } = K;
  const { useStore, useRoute, Screen } = S;
  const P = () => window.SC3_LEDGER.partners;
  const orig = { OfferDetail: S.OfferDetail, DistBatches: S.DistBatches };
  const InvoiceRow = ({ inv, who, onOpen }) => /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-paper", onClick: onOpen }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Tax invoice"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, inv.no), " · ", who)), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(inv.total)), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16, className: "subtle" }));
  function OfferDetail({ me }) {
    const s = useStore();
    const { route } = useRoute();
    const ref = route && route.params && route.params.ref;
    const shop = S.shopOf(me);
    const o = ref && P().offersFor(shop, s).find((x) => x.ref === ref);
    const [open, setOpen] = useState(false);
    const inv = o && o.status === "ordered" && F.shopInvoices(shop, s).find((x) => x.ref === o.ref);
    if (!inv) return /* @__PURE__ */ React.createElement(orig.OfferDetail, { me });
    const head = /* @__PURE__ */ React.createElement(S.PtHead, { sku: o.sku, id: o.ref, where: `From ${o.dist.short}`, badge: /* @__PURE__ */ React.createElement(S.OfferStatus, { o, size: "sm" }), line: `Sent ${F.when(o.sent)}` });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: o.sku.name, back: "Offers", below: head, hideLarge: true }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Your order"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "delivered Tuesday")), /* @__PURE__ */ React.createElement(F.OrderFigures, { inv }), /* @__PURE__ */ React.createElement("div", { className: "pt-papers", style: { marginTop: 6 } }, /* @__PURE__ */ React.createElement(InvoiceRow, { inv, who: `${o.dist.short} issued it · paid on delivery`, onOpen: () => setOpen(true) }))), /* @__PURE__ */ React.createElement(List, { head: "What was offered" }, /* @__PURE__ */ React.createElement(ListRow, { title: "Price", value: `₹${o.pack.toFixed(2)} a packet, before GST · MRP ₹${o.mrp}` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Scheme", value: "Buy 10, get 2 free, as a discount on the invoice" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Your share", value: `up to ${o.share} packets` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Best before", value: fmt.date(o.bestBefore) }))), /* @__PURE__ */ React.createElement(F.PaperSheet, { title: "Tax invoice", pdfName: `Tax invoice ${inv.no}`, open, onClose: () => setOpen(false) }, /* @__PURE__ */ React.createElement(F.KiranaInvoice, { inv })));
  }
  function RetailOrders({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const shop = S.shopOf(me);
    const list = F.shopInvoices(shop, s).slice().reverse();
    const P_ = P().offersFor(shop, s);
    const sku = (ref) => (P_.find((o) => o.ref === ref) || {}).sku || list[0].sku;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: shop.name }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: F.sum(list, "margin"), size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "your margin at MRP")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, list.length, " orders since July, ", fmt.num(F.sum(list, "units")), " packets, ", fmt.inr(F.sum(list, "total")), " paid on ", list.length, " tax invoices from ", list[0].dist.short, ", GST included.")), /* @__PURE__ */ React.createElement(List, null, list.map((x) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: x.no,
        chevron: true,
        onClick: () => go("offer", { ref: x.ref }),
        leading: /* @__PURE__ */ React.createElement(Product, { name: sku(x.ref).img, size: 40 }),
        title: `${x.sku.name} · ${x.units} packets`,
        sub: /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "mono" }, x.no), " · ", F.when(x.at), " · paid ", fmt.inr(x.total)),
        value: /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr2(x.margin)), /* @__PURE__ */ React.createElement("em", null, "margin"))
      }
    )))));
  }
  function Shops({ inv }) {
    const [x, setX] = useState(null);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dist-shops sk-shops" }, inv.map((v) => /* @__PURE__ */ React.createElement("button", { type: "button", key: v.no, className: "sk-shop", onClick: () => setX(v) }, /* @__PURE__ */ React.createElement("b", null, v.shop.name), /* @__PURE__ */ React.createElement("em", null, F.when(v.at)), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, v.units), /* @__PURE__ */ React.createElement("span", { className: "sk-no" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, v.no), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr(v.total)))))), x && /* @__PURE__ */ React.createElement(F.PaperSheet, { title: "Tax invoice", pdfName: `Tax invoice ${x.no}`, open: true, onClose: () => setX(null) }, /* @__PURE__ */ React.createElement(F.KiranaInvoice, { inv: x })));
  }
  function PapersMore({ c, dist }) {
    const s = useStore();
    const list = F.invoicesOf(c.batch.id, dist.id, s);
    const [open, setOpen] = useState(false);
    const [x, setX] = useState(null);
    if (!list.length) return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-paper", onClick: () => setOpen(true) }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Tax invoices to kiranas · ", list.length), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, F.range(list)), " · You issue them")), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(F.sum(list, "total"))), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16, className: "subtle" })), /* @__PURE__ */ React.createElement(F.PaperSheet, { title: "Sales register", pdfName: `Sales register ${c.batch.id}`, open: open && !x, onClose: () => setOpen(false) }, /* @__PURE__ */ React.createElement(F.Register, { list, onOpen: setX })), x && /* @__PURE__ */ React.createElement(F.PaperSheet, { title: "Tax invoice", pdfName: `Tax invoice ${x.no}`, open: true, onClose: () => setX(null) }, /* @__PURE__ */ React.createElement(F.KiranaInvoice, { inv: x })));
  }
  function RegisterSide({ list }) {
    const [x, setX] = useState(null);
    return x ? /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link t-footnote", onClick: () => setX(null) }, "← All ", list.length, " invoices"), /* @__PURE__ */ React.createElement(F.KiranaInvoice, { inv: x })) : /* @__PURE__ */ React.createElement(F.Register, { list, onOpen: setX });
  }
  function Paperwork({ me }) {
    const s = useStore();
    const c = window.SC3_LEDGER.storyCase();
    const list = F.invoicesOf(c.batch.id, c.dist.id, s);
    const card = { doc: { id: "kirana", type: "Tax invoices to kiranas", owner: c.dist.name, no: `${list.length} invoices`, status: "generated", amount: F.sum(list, "total") }, sub: `Issued by ${c.dist.name} from Tally · one for each shop's order`, list };
    return /* @__PURE__ */ React.createElement(F.PackPage, { me, cards: [card], paperOf: (x) => /* @__PURE__ */ React.createElement(RegisterSide, { list: x.list }), startOn: new URLSearchParams(location.search).get("open") || null });
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

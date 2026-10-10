(function() {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCK;
  const fmt = M.fmt;
  const { Icon, Badge, Button, Card, List, ListRow, Product, Money } = K;
  const { useStore, useRoute, Screen, SectionTitle } = S;
  const P = () => window.SC3_LEDGER.partners;
  const orig = { OfferDetail: S.OfferDetail, DistBatches: S.DistBatches };
  function OfferDetail({ me }) {
    const s = useStore();
    const { route } = useRoute();
    const ref = route && route.params && route.params.ref;
    const shop = S.shopOf(me);
    const o = ref && P().offersFor(shop, s).find((x) => x.ref === ref);
    const inv = o && o.status === "ordered" && F.shopInvoices(shop, s).find((x) => x.ref === o.ref);
    if (!inv) return /* @__PURE__ */ React.createElement(orig.OfferDetail, { me });
    const head = /* @__PURE__ */ React.createElement(S.PtHead, { sku: o.sku, id: o.ref, where: `From ${o.dist.short}`, badge: /* @__PURE__ */ React.createElement(S.OfferStatus, { o, size: "sm" }), line: `Sent ${F.when(o.sent)}` });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: o.sku.name, back: "Orders and bills", below: head, hideLarge: true }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 720 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Your order"), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "delivered Tuesday")), /* @__PURE__ */ React.createElement(F.OrderFigures, { inv })), /* @__PURE__ */ React.createElement(SectionTitle, { sub: `${o.dist.name} issued it from Tally · paid on delivery`, right: /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "download" }, "Download PDF") }, "Your tax invoice"), /* @__PURE__ */ React.createElement("div", { className: "sk-inline" }, /* @__PURE__ */ React.createElement(F.KiranaInvoice, { inv }))));
  }
  function RetailOrders({ me }) {
    const s = useStore();
    const { go } = useRoute();
    const shop = S.shopOf(me);
    const list = F.shopInvoices(shop, s).slice().reverse();
    const months = [];
    list.forEach((x) => {
      const m = x.date.slice(0, 7);
      let g = months.find((y) => y.m === m);
      if (!g) months.push(g = { m, label: (/* @__PURE__ */ new Date(x.date + "T00:00:00+05:30")).toLocaleDateString("en-IN", { month: "long", year: "numeric" }), items: [] });
      g.items.push(x);
    });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders and bills", sub: `${shop.name} · every tax invoice from ${list[0].dist.short}` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 620 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: F.sum(list, "total"), size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "paid on ", list.length, " invoices since July")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, fmt.inr2(F.sum(list, "taxable")), " before GST, ", fmt.inr2(F.sum(list, "tax")), " of GST. Sold at MRP they made ", fmt.inr2(F.sum(list, "margin")), " of margin.")), months.map((g) => /* @__PURE__ */ React.createElement(List, { key: g.m, head: g.label }, g.items.map((x) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: x.no,
        chevron: true,
        onClick: () => go("offer", { ref: x.ref }),
        leading: /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 17, stroke: 2 })),
        title: /* @__PURE__ */ React.createElement("span", { className: "mono" }, x.no),
        sub: `${F.when(x.at)} · ${x.sku.name}, ${x.units} packets`,
        value: /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(x.total)), /* @__PURE__ */ React.createElement("em", null, "GST incl."))
      }
    ))))));
  }
  const TABS = F.DIST_TABS.slice(0, 3).concat([{ id: "invoices", label: "Invoices", icon: "receipt" }], F.DIST_TABS.slice(3));
  function Invoices({ c, dist }) {
    const s = useStore();
    const list = F.invoicesOf(c.batch.id, dist.id, s);
    const [x, setX] = useState(null);
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(K.Tile, { label: "Invoices to kiranas", icon: "receipt" }, /* @__PURE__ */ React.createElement("span", { className: "num s" }, list.length)), /* @__PURE__ */ React.createElement(K.Tile, { label: "Taxable value", icon: "coins" }, /* @__PURE__ */ React.createElement(Money, { value: F.sum(list, "taxable"), size: "s" })), /* @__PURE__ */ React.createElement(K.Tile, { label: "GST you collected", icon: "badge-check" }, /* @__PURE__ */ React.createElement(Money, { value: F.sum(list, "tax"), size: "s" }))), /* @__PURE__ */ React.createElement("div", { className: "skr-wrap" }, /* @__PURE__ */ React.createElement(F.Register, { list, onOpen: setX })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "The CGST and SGST go on your GSTR-1 as B2C sales within ", dist.state, "; the PDF of each is the Paperwork agent's."), x && /* @__PURE__ */ React.createElement(F.PaperSheet, { title: "Tax invoice", pdfName: `Tax invoice ${x.no}`, open: true, onClose: () => setX(null) }, /* @__PURE__ */ React.createElement(F.KiranaInvoice, { inv: x })));
  }
  const Extra = ({ tab, c, dist }) => tab === "invoices" ? /* @__PURE__ */ React.createElement(Invoices, { c, dist }) : null;
  function Shops({ o, inv }) {
    const { go } = useRoute();
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dist-shops" }, inv.map((v) => /* @__PURE__ */ React.createElement("span", { key: v.no }, /* @__PURE__ */ React.createElement("b", null, v.shop.name), /* @__PURE__ */ React.createElement("em", null, F.when(v.at)), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, v.units)))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link t-footnote", style: { justifySelf: "start" }, onClick: () => go("batches", { ref: inv[0].ref }) }, "Their ", inv.length, " invoices are on the batch's Invoices tab"));
  }
  function RegisterSide({ list }) {
    const [x, setX] = useState(null);
    return x ? /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link t-footnote", onClick: () => setX(null) }, "← All ", list.length, " invoices"), /* @__PURE__ */ React.createElement(F.KiranaInvoice, { inv: x })) : /* @__PURE__ */ React.createElement(F.Register, { list, onOpen: setX });
  }
  function Paperwork({ me }) {
    const s = useStore();
    const c = window.SC3_LEDGER.storyCase();
    const list = F.invoicesOf(c.batch.id, c.dist.id, s);
    const card = { doc: { id: "kirana", type: "Sales register · kiranas", owner: c.dist.name, no: `${list.length} invoices`, status: "generated", amount: F.sum(list, "total") }, sub: `${c.dist.name}' invoices to the scheme's shops`, list };
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
      return ref ? /* @__PURE__ */ React.createElement(F.DistBatchPage, { ...props, id: ref, tabs: TABS, Extra, start: new URLSearchParams(location.search).get("tab") || "invoices" }) : /* @__PURE__ */ React.createElement(orig.DistBatches, { ...props });
    }
  });
})();

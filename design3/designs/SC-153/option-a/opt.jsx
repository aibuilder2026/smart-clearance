// Option A · With each order (recommended). The invoice sits with the order it bills, opening in a sheet with its PDF,
// as every other paper does (SC-130):
// - the kirana: his order's figures follow the invoice (before GST, the GST, what he paid, his margin), and "Your tax
//   invoice" opens it; his Orders name each order's invoice;
// - the distributor: each shop's order names its invoice and opens it; the batch's papers gain the sales register;
// - Priya: the pack gains one card, the batch's invoices to kiranas as a register, each opening its invoice.
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCK; const fmt = M.fmt;
  const { Icon, Badge, Card, List, ListRow, Product, Money } = K; const { useStore, useRoute, Screen } = S;
  const P = () => window.SC3_LEDGER.partners;
  const orig = { OfferDetail: S.OfferDetail, DistBatches: S.DistBatches };

  // a paper as a row, as the distributor's papers are (SC-130)
  const InvoiceRow = ({ inv, who, onOpen }) => <button type="button" className="pt-paper" onClick={onOpen}>
    <span className="icontile"><Icon name="receipt" size={17} stroke={2} /></span>
    <span className="grow"><b>Tax invoice</b><span className="t-footnote muted"><span className="mono">{inv.no}</span> · {who}</span></span>
    <span className="tnum strong">{fmt.inr(inv.total)}</span><Icon name="chevron-right" size={16} className="subtle" />
  </button>;

  function OfferDetail({ me }) {
    const s = useStore(); const { route } = useRoute(); const ref = route && route.params && route.params.ref; const shop = S.shopOf(me);
    const o = ref && P().offersFor(shop, s).find(x => x.ref === ref); const [open, setOpen] = useState(false);
    const inv = o && o.status === "ordered" && F.shopInvoices(shop, s).find(x => x.ref === o.ref);
    if (!inv) return <orig.OfferDetail me={me} />;
    const head = <S.PtHead sku={o.sku} id={o.ref} where={`From ${o.dist.short}`} badge={<S.OfferStatus o={o} size="sm" />} line={`Sent ${F.when(o.sent)}`} />;
    return <Screen me={me} title={o.sku.name} back="Offers" below={head} hideLarge>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        <Card className="stack snug">
          <div className="card-head"><span className="card-title">Your order</span><Badge tone="green" icon="check">delivered Tuesday</Badge></div>
          <F.OrderFigures inv={inv} />
          <div className="pt-papers" style={{ marginTop: 6 }}><InvoiceRow inv={inv} who={`${o.dist.short} issued it · paid on delivery`} onOpen={() => setOpen(true)} /></div>
        </Card>
        <List head="What was offered">
          <ListRow title="Price" value={`₹${o.pack.toFixed(2)} a packet, before GST · MRP ₹${o.mrp}`} />
          <ListRow title="Scheme" value="Buy 10, get 2 free, as a discount on the invoice" />
          <ListRow title="Your share" value={`up to ${o.share} packets`} />
          <ListRow title="Best before" value={fmt.date(o.bestBefore)} />
        </List>
      </div>
      <F.PaperSheet title="Tax invoice" pdfName={`Tax invoice ${inv.no}`} open={open} onClose={() => setOpen(false)}><F.KiranaInvoice inv={inv} /></F.PaperSheet>
    </Screen>;
  }
  function RetailOrders({ me }) {
    const s = useStore(); const { go } = useRoute(); const shop = S.shopOf(me); const list = F.shopInvoices(shop, s).slice().reverse();
    const P_ = P().offersFor(shop, s); const sku = ref => (P_.find(o => o.ref === ref) || {}).sku || list[0].sku;
    return <Screen me={me} title="Orders" sub={shop.name}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        <Card className="stack" style={{ gap: 8 }}><div className="lg-fig"><Money value={F.sum(list, "margin")} size="l" /><span className="lg-what">your margin at MRP</span></div>
          <p className="lg-working">{list.length} orders since July, {fmt.num(F.sum(list, "units"))} packets, {fmt.inr(F.sum(list, "total"))} paid on {list.length} tax invoices from {list[0].dist.short}, GST included.</p></Card>
        <List>{list.map(x => <ListRow key={x.no} chevron onClick={() => go("offer", { ref: x.ref })} leading={<Product name={sku(x.ref).img} size={40} />} title={`${x.sku.name} · ${x.units} packets`}
          sub={<span><span className="mono">{x.no}</span> · {F.when(x.at)} · paid {fmt.inr(x.total)}</span>} value={<span className="lg-val"><b className="tnum">{fmt.inr2(x.margin)}</b><em>margin</em></span>} />)}</List>
      </div>
    </Screen>;
  }
  // the distributor's shops, each with its invoice, opening it
  function Shops({ inv }) {
    const [x, setX] = useState(null);
    return <><div className="dist-shops sk-shops">{inv.map(v => <button type="button" key={v.no} className="sk-shop" onClick={() => setX(v)}><b>{v.shop.name}</b><em>{F.when(v.at)}</em><span className="tnum">{v.units}</span><span className="sk-no"><span className="mono">{v.no}</span><span className="tnum">{fmt.inr(v.total)}</span></span></button>)}</div>
      {x && <F.PaperSheet title="Tax invoice" pdfName={`Tax invoice ${x.no}`} open onClose={() => setX(null)}><F.KiranaInvoice inv={x} /></F.PaperSheet>}</>;
  }
  // the batch's papers gain its invoices to kiranas, as the sales register
  function PapersMore({ c, dist }) {
    const s = useStore(); const list = F.invoicesOf(c.batch.id, dist.id, s); const [open, setOpen] = useState(false); const [x, setX] = useState(null);
    if (!list.length) return null;
    return <><button type="button" className="pt-paper" onClick={() => setOpen(true)}>
      <span className="icontile"><Icon name="receipt" size={17} stroke={2} /></span>
      <span className="grow"><b>Tax invoices to kiranas · {list.length}</b><span className="t-footnote muted"><span className="mono">{F.range(list)}</span> · You issue them</span></span>
      <span className="tnum strong">{fmt.inr(F.sum(list, "total"))}</span><Icon name="chevron-right" size={16} className="subtle" /></button>
      <F.PaperSheet title="Sales register" pdfName={`Sales register ${c.batch.id}`} open={open && !x} onClose={() => setOpen(false)}><F.Register list={list} onOpen={setX} /></F.PaperSheet>
      {x && <F.PaperSheet title="Tax invoice" pdfName={`Tax invoice ${x.no}`} open onClose={() => setX(null)}><F.KiranaInvoice inv={x} /></F.PaperSheet>}</>;
  }
  // Priya's pack: one card, the register, each invoice opening beside it
  function RegisterSide({ list }) {
    const [x, setX] = useState(null);
    return x ? <div className="stack snug"><button type="button" className="pt-link t-footnote" onClick={() => setX(null)}>← All {list.length} invoices</button><F.KiranaInvoice inv={x} /></div> : <F.Register list={list} onOpen={setX} />;
  }
  function Paperwork({ me }) {
    const s = useStore(); const c = window.SC3_LEDGER.storyCase(); const list = F.invoicesOf(c.batch.id, c.dist.id, s);
    const card = { doc: { id: "kirana", type: "Tax invoices to kiranas", owner: c.dist.name, no: `${list.length} invoices`, status: "generated", amount: F.sum(list, "total") }, sub: `Issued by ${c.dist.name} from Tally · one for each shop's order`, list };
    return <F.PackPage me={me} cards={[card]} paperOf={x => <RegisterSide list={x.list} />} startOn={new URLSearchParams(location.search).get("open") || null} />;
  }

  Object.assign(S, {
    OfferDetail, RetailOrders, Paperwork,
    DistOrders: props => <F.DistOrdersPage {...props} Shops={Shops} />,
    DistBatches: props => { const { route } = useRoute(); const ref = route && route.params && route.params.ref;
      return ref ? <F.DistBatchPage {...props} id={ref} PapersMore={PapersMore} start={new URLSearchParams(location.search).get("tab") || "papers"} /> : <orig.DistBatches {...props} />; },
  });
})();

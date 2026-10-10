// Option C · As PDFs. The fewest new screens: each invoice is the Paperwork agent's PDF, named where its order is and
// downloaded from there; nothing is drawn as a paper in the app:
// - the kirana: his order's figures follow the invoice, with one button for its PDF; his Orders name each invoice;
// - the distributor: each shop's order names its invoice, with its PDF; the batch's papers gain all of them as one PDF;
// - Priya: the pack gains one card listing the invoices, each with its PDF, and all of them as one.
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCK; const fmt = M.fmt;
  const { Icon, Badge, Button, Card, List, ListRow, Product, Money, useNotice } = K; const { useStore, useRoute, Screen } = S;
  const P = () => window.SC3_LEDGER.partners;
  const orig = { OfferDetail: S.OfferDetail, DistBatches: S.DistBatches };
  const useSave = () => { const { toast } = useNotice(); return name => toast({ text: `${name}.pdf saved`, tone: "ok" }); };

  function OfferDetail({ me }) {
    const s = useStore(); const save = useSave(); const { route } = useRoute(); const ref = route && route.params && route.params.ref; const shop = S.shopOf(me);
    const o = ref && P().offersFor(shop, s).find(x => x.ref === ref);
    const inv = o && o.status === "ordered" && F.shopInvoices(shop, s).find(x => x.ref === o.ref);
    if (!inv) return <orig.OfferDetail me={me} />;
    const head = <S.PtHead sku={o.sku} id={o.ref} where={`From ${o.dist.short}`} badge={<S.OfferStatus o={o} size="sm" />} line={`Sent ${F.when(o.sent)}`} />;
    return <Screen me={me} title={o.sku.name} back="Offers" below={head} hideLarge>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        <Card className="stack snug">
          <div className="card-head"><span className="card-title">Your order</span><Badge tone="green" icon="check">delivered Tuesday</Badge></div>
          <F.OrderFigures inv={inv} />
          <Button variant="secondary" block icon="download" onClick={() => save(inv.no)} style={{ marginTop: 8 }}>Tax invoice <span className="mono" style={{ marginLeft: 6 }}>{inv.no}</span> · PDF</Button>
          <span className="t-footnote subtle">{o.dist.name} issued it from Tally · paid on delivery</span>
        </Card>
        <List head="What was offered">
          <ListRow title="Price" value={`₹${o.pack.toFixed(2)} a packet, before GST · MRP ₹${o.mrp}`} />
          <ListRow title="Scheme" value="Buy 10, get 2 free, as a discount on the invoice" />
          <ListRow title="Your share" value={`up to ${o.share} packets`} />
          <ListRow title="Best before" value={fmt.date(o.bestBefore)} />
        </List>
      </div>
    </Screen>;
  }
  function RetailOrders({ me }) {
    const s = useStore(); const save = useSave(); const { go } = useRoute(); const shop = S.shopOf(me); const list = F.shopInvoices(shop, s).slice().reverse();
    return <Screen me={me} title="Orders" sub={shop.name}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        <Card className="stack" style={{ gap: 8 }}><div className="lg-fig"><Money value={F.sum(list, "margin")} size="l" /><span className="lg-what">your margin at MRP</span></div>
          <p className="lg-working">{list.length} orders since July, {fmt.num(F.sum(list, "units"))} packets, {fmt.inr(F.sum(list, "total"))} paid, GST included. Each invoice is a PDF.</p></Card>
        <List>{list.map(x => <ListRow key={x.no} onClick={() => go("offer", { ref: x.ref })} chevron leading={<Product name={x.sku.img} size={40} />} title={`${x.sku.name} · ${x.units} packets`}
          sub={<span>{F.when(x.at)} · <button type="button" className="pt-link" onClick={e => { e.stopPropagation(); save(x.no); }}><Icon name="download" size={12} /> <span className="mono">{x.no}</span></button></span>} value={<span className="lg-val"><b className="tnum">{fmt.inr2(x.margin)}</b><em>margin</em></span>} />)}</List>
      </div>
    </Screen>;
  }
  function Shops({ inv }) {
    const save = useSave();
    return <div className="sk-pdfs">{inv.map(v => <span key={v.no} className="sk-pdf"><b>{v.shop.name} · {v.units}</b><em><span className="mono">{v.no}</span> · {fmt.inr(v.total)}</em><Button variant="ghost" size="sm" icon="download" onClick={() => save(v.no)} aria-label={`Download ${v.no} as a PDF`}>PDF</Button></span>)}</div>;
  }
  function PapersMore({ c, dist }) {
    const s = useStore(); const save = useSave(); const list = F.invoicesOf(c.batch.id, dist.id, s);
    if (!list.length) return null;
    return <button type="button" className="pt-paper" onClick={() => save(`${c.batch.id}-kirana-invoices`)}>
      <span className="icontile"><Icon name="receipt" size={17} stroke={2} /></span>
      <span className="grow"><b>Tax invoices to kiranas · {list.length}, one PDF</b><span className="t-footnote muted"><span className="mono">{F.range(list)}</span> · You issue them</span></span>
      <span className="tnum strong">{fmt.inr(F.sum(list, "total"))}</span><Icon name="download" size={16} className="subtle" /></button>;
  }
  function PdfList({ list }) {
    const save = useSave();
    return <div className="stack snug">
      <Button variant="secondary" block icon="download" onClick={() => save("all")}>All {list.length} invoices as one PDF</Button>
      <div className="pt-papers">{list.map(x => <button key={x.no} type="button" className="pt-paper" onClick={() => save(x.no)}>
        <span className="grow"><b className="mono">{x.no}</b><span className="t-footnote muted">{x.shop.name} · {x.units} packets · {F.dmy(x.date)}</span></span>
        <span className="tnum strong">{fmt.inr(x.total)}</span><Icon name="download" size={16} className="subtle" /></button>)}</div>
    </div>;
  }
  function Paperwork({ me }) {
    const s = useStore(); const c = window.SC3_LEDGER.storyCase(); const list = F.invoicesOf(c.batch.id, c.dist.id, s);
    const card = { doc: { id: "kirana", type: "Tax invoices to kiranas", owner: c.dist.name, no: `${list.length} PDFs`, status: "generated", amount: F.sum(list, "total") }, sub: `${c.dist.name}' invoices, each the Paperwork agent's PDF`, list };
    return <F.PackPage me={me} cards={[card]} paperOf={x => <PdfList list={x.list} />} startOn={new URLSearchParams(location.search).get("open") || null} />;
  }

  Object.assign(S, {
    OfferDetail, RetailOrders, Paperwork,
    DistOrders: props => <F.DistOrdersPage {...props} Shops={Shops} />,
    DistBatches: props => { const { route } = useRoute(); const ref = route && route.params && route.params.ref;
      return ref ? <F.DistBatchPage {...props} id={ref} PapersMore={PapersMore} start={new URLSearchParams(location.search).get("tab") || "papers"} /> : <orig.DistBatches {...props} />; },
  });
})();

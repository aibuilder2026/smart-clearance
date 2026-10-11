// Option B · The bill book. The invoices are kept together, as Tally's books keep them:
// - the kirana: Orders becomes his bill book, every invoice he was given, newest first; an order's page shows its
//   invoice in full on the page, under its figures;
// - the distributor: his batch page gains an Invoices tab, the batch's sales register, each invoice opening in a sheet;
//   Orders points to it;
// - Priya: the pack gains the register as one card, as in A.
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCK; const fmt = M.fmt;
  const { Icon, Badge, Button, Card, List, ListRow, Product, Money } = K; const { useStore, useRoute, Screen, SectionTitle } = S;
  const P = () => window.SC3_LEDGER.partners;
  const orig = { OfferDetail: S.OfferDetail, DistBatches: S.DistBatches };

  function OfferDetail({ me }) {
    const s = useStore(); const { route } = useRoute(); const ref = route && route.params && route.params.ref; const shop = S.shopOf(me);
    const o = ref && P().offersFor(shop, s).find(x => x.ref === ref);
    const inv = o && o.status === "ordered" && F.shopInvoices(shop, s).find(x => x.ref === o.ref);
    if (!inv) return <orig.OfferDetail me={me} />;
    const head = <S.PtHead sku={o.sku} id={o.ref} where={`From ${o.dist.short}`} badge={<S.OfferStatus o={o} size="sm" />} line={`Sent ${F.when(o.sent)}`} />;
    return <Screen me={me} title={o.sku.name} back="Orders and bills" below={head} hideLarge>
      <div className="stack" style={{ gap: 16, maxWidth: 720 }}>
        <Card className="stack snug"><div className="card-head"><span className="card-title">Your order</span><Badge tone="green" icon="check">delivered Tuesday</Badge></div><F.OrderFigures inv={inv} /></Card>
        <SectionTitle sub={`${o.dist.name} issued it from Tally · paid on delivery`} right={<Button variant="secondary" size="sm" icon="download">Download PDF</Button>}>Your tax invoice</SectionTitle>
        <div className="sk-inline"><F.KiranaInvoice inv={inv} /></div>
      </div>
    </Screen>;
  }
  // the kirana's bill book: every invoice, newest first, each opening its order's page with the invoice on it
  function RetailOrders({ me }) {
    const s = useStore(); const { go } = useRoute(); const shop = S.shopOf(me); const list = F.shopInvoices(shop, s).slice().reverse();
    const months = []; list.forEach(x => { const m = x.date.slice(0, 7); let g = months.find(y => y.m === m); if (!g) months.push(g = { m, label: new Date(x.date + "T00:00:00+05:30").toLocaleDateString("en-IN", { month: "long", year: "numeric" }), items: [] }); g.items.push(x); });
    return <Screen me={me} title="Orders and bills" sub={`${shop.name} · every tax invoice from ${list[0].dist.short}`}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        <Card className="stack" style={{ gap: 8 }}><div className="lg-fig"><Money value={F.sum(list, "total")} size="l" /><span className="lg-what">paid on {list.length} invoices since July</span></div>
          <p className="lg-working">{fmt.inr2(F.sum(list, "taxable"))} before GST, {fmt.inr2(F.sum(list, "tax"))} of GST. Sold at MRP they made {fmt.inr2(F.sum(list, "margin"))} of margin.</p></Card>
        {months.map(g => <List key={g.m} head={g.label}>{g.items.map(x => <ListRow key={x.no} chevron onClick={() => go("offer", { ref: x.ref })} leading={<span className="icontile"><Icon name="receipt" size={17} stroke={2} /></span>}
          title={<span className="mono">{x.no}</span>} sub={`${F.when(x.at)} · ${x.sku.name}, ${x.units} packets`} value={<span className="lg-val"><b className="tnum">{fmt.inr(x.total)}</b><em>GST incl.</em></span>} />)}</List>)}
      </div>
    </Screen>;
  }
  // the batch's Invoices tab: its sales register, each invoice in a sheet
  const TABS = F.DIST_TABS.slice(0, 3).concat([{ id: "invoices", label: "Invoices", icon: "receipt" }], F.DIST_TABS.slice(3));
  function Invoices({ c, dist }) {
    const s = useStore(); const list = F.invoicesOf(c.batch.id, dist.id, s); const [x, setX] = useState(null);
    return <div className="stack" style={{ gap: 12 }}>
      <div className="row wrap" style={{ gap: 12 }}>
        <K.Tile label="Invoices to kiranas" icon="receipt"><span className="num s">{list.length}</span></K.Tile>
        <K.Tile label="Taxable value" icon="coins"><Money value={F.sum(list, "taxable")} size="s" /></K.Tile>
        <K.Tile label="GST you collected" icon="badge-check"><Money value={F.sum(list, "tax")} size="s" /></K.Tile>
      </div>
      <div className="skr-wrap"><F.Register list={list} onOpen={setX} /></div>
      <span className="t-footnote subtle">The CGST and SGST go on your GSTR-1 as B2C sales within {dist.state}; the PDF of each is the Paperwork agent's.</span>
      {x && <F.PaperSheet title="Tax invoice" pdfName={`Tax invoice ${x.no}`} open onClose={() => setX(null)}><F.KiranaInvoice inv={x} /></F.PaperSheet>}
    </div>;
  }
  const Extra = ({ tab, c, dist }) => (tab === "invoices" ? <Invoices c={c} dist={dist} /> : null);
  // Orders: the shops' orders as today, and a pointer to the batch's invoices
  function Shops({ o, inv }) {
    const { go } = useRoute();
    return <><div className="dist-shops">{inv.map(v => <span key={v.no}><b>{v.shop.name}</b><em>{F.when(v.at)}</em><span className="tnum">{v.units}</span></span>)}</div>
      <button type="button" className="pt-link t-footnote" style={{ justifySelf: "start" }} onClick={() => go("batches", { ref: inv[0].ref })}>Their {inv.length} invoices are on the batch's Invoices tab</button></>;
  }
  function RegisterSide({ list }) {
    const [x, setX] = useState(null);
    return x ? <div className="stack snug"><button type="button" className="pt-link t-footnote" onClick={() => setX(null)}>← All {list.length} invoices</button><F.KiranaInvoice inv={x} /></div> : <F.Register list={list} onOpen={setX} />;
  }
  function Paperwork({ me }) {
    const s = useStore(); const c = window.SC3_LEDGER.storyCase(); const list = F.invoicesOf(c.batch.id, c.dist.id, s);
    const card = { doc: { id: "kirana", type: "Sales register · kiranas", owner: c.dist.name, no: `${list.length} invoices`, status: "generated", amount: F.sum(list, "total") }, sub: `${c.dist.name}' invoices to the scheme's shops`, list };
    return <F.PackPage me={me} cards={[card]} paperOf={x => <RegisterSide list={x.list} />} startOn={new URLSearchParams(location.search).get("open") || null} />;
  }

  Object.assign(S, {
    OfferDetail, RetailOrders, Paperwork,
    DistOrders: props => <F.DistOrdersPage {...props} Shops={Shops} />,
    DistBatches: props => { const { route } = useRoute(); const ref = route && route.params && route.params.ref;
      return ref ? <F.DistBatchPage {...props} id={ref} tabs={TABS} Extra={Extra} start={new URLSearchParams(location.search).get("tab") || "invoices"} /> : <orig.DistBatches {...props} />; },
  });
})();

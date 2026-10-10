// Option B · How this adds up, on request. Each page keeps its own figure as today (Batches: what the client credited
// him; Orders: what he sold), and its card gains "How this adds up". It opens one sheet, the same from both pages: every
// cleared batch with what it cost him, what he sold, what was credited and how he ended, and the totals, so the two
// pages' figures are two columns of one table.
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCF;
  const { Card, Money, Button, Sheet, Product } = K; const fmt = M.fmt;
  function Table({ b, page }) {
    return <div className="stack" style={{ gap: 14 }}>
      <p className="t-subhead" style={{ margin: 0 }}>What you sold plus what {D.WORKSPACE.short} credited you is what each batch cost you, so you end whole on every one.</p>
      <div className="fx-table" role="table" aria-label="How your cleared batches add up">
        <div className="fx-tr head" role="row"><span role="columnheader">Batch</span><span role="columnheader">Cost you</span><span role="columnheader" className={page === "orders" ? "here" : undefined}>Sold</span><span role="columnheader" className={page === "batches" ? "here" : undefined}>Credited</span><span role="columnheader">You end</span></div>
        {b.sums.map(x => { const sku = x.sku.img ? x.sku : D.SKUS[x.sku];
          return <div className="fx-tr" role="row" key={x.ref}><span role="cell" className="row tight" style={{ gap: 8 }}><Product name={sku.img} size={28} alt="" /><span className="stack" style={{ gap: 0 }}><b>{sku.name}</b><span className="mono t-caption subtle">{x.ref}</span></span></span>
            <span role="cell" className="tnum">{fmt.inr(x.cost)}</span><span role="cell" className="tnum">{fmt.inr(x.sold)}</span><span role="cell" className="tnum">{fmt.inr(x.credit)}</span><span role="cell" className="tnum">{fmt.inr(x.gain)}</span></div>; })}
        <div className="fx-tr total" role="row"><span role="cell"><b>{b.n} batches</b></span><span role="cell" className="tnum">{fmt.inr(b.cost)}</span><span role="cell" className="tnum">{fmt.inr(b.sold)}</span><span role="cell" className="tnum">{fmt.inr(b.credit)}</span><span role="cell" className="tnum">₹0</span></div>
      </div>
      <p className="t-footnote muted" style={{ margin: 0 }}>Sold is on Orders, every order on its paper; credited is on Batches, {b.notes} credit notes in the batches' papers. Each batch's Money tab shows its own lines.</p>
    </div>;
  }
  function Head({ b, page, live }) {
    const [open, setOpen] = useState(false); const W = D.WORKSPACE.short;
    const v = page === "batches" ? b.credit : b.sold + (live || 0);
    return <Card className="stack" style={{ gap: 10 }}>
      <div className="lg-fig"><Money value={v} size="l" /><span className="lg-what">{page === "batches" ? `credited by ${W} since July` : `sold from ${W}'s batches since ${D.WORKSPACE.since}`}</span></div>
      <p className="lg-working">{page === "batches" ? `The price support and the expiry credit on ${b.n} batches cleared at your godown: ${b.notes} credit notes, each in its batch's papers.` : `From the kiranas' schemes, the ExpireSoon lots and the staff sales of ${W}'s batches.`}</p>
      <div><Button variant="secondary" size="sm" icon="coins" onClick={() => setOpen(true)}>How this adds up</Button></div>
      <Sheet open={open} onClose={() => setOpen(false)} title="How your batches add up"><Table b={b} page={page} /></Sheet>
    </Card>;
  }
  const RowValue = ({ x }) => <span className="lg-val"><b className="tnum">{fmt.inr(x.credit)}</b><em>credited</em></span>;
  const BatchValue = ({ sold }) => <span className="tnum strong">{fmt.inr(sold)}</span>;
  Object.assign(S, {
    DistBatches: props => <F.DistBatchesPage {...props} Head={Head} RowValue={RowValue} />,
    DistOrders: props => <F.DistOrdersPage {...props} Head={Head} BatchValue={BatchValue} />,
  });
})();

// Option C · One figure on both pages. Batches and Orders lead with the same figure: what came back to him from the
// batches he cleared, everything they cost him, then where it came from, sold (Orders) and credited (Batches). Every
// batch reads the same on both pages: what came back, its split as a bar, and its two parts.
(function () {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCF;
  const { Card, Money, Chip, Icon } = K; const { useRoute } = S; const fmt = M.fmt;
  function Part({ k, v, what, to, here }) {
    const { go } = useRoute();
    const inner = <><i className={`fx-dot ${k}`} aria-hidden="true" /><b className="tnum">{fmt.inr(v)}</b><span>{what}</span>{here ? <em>this page</em> : <Icon name="arrow-right" size={13} />}</>;
    return here ? <span className="fx-part">{inner}</span> : <button type="button" className="fx-part link" onClick={() => go(to)}>{inner}</button>;
  }
  function Head({ b, page, live }) {
    const W = D.WORKSPACE.short;
    return <Card className="stack" style={{ gap: 12 }}>
      <div className="lg-fig"><Money value={b.cost} size="l" /><span className="lg-what">came back to you from {b.n} batches since July, all they cost you</span></div>
      <F.SplitBar sold={b.sold} credit={b.credit} label={`${fmt.inr(b.sold)} sold and ${fmt.inr(b.credit)} credited`} />
      <div className="row wrap" style={{ gap: 8 }}>
        <Part k="sold" v={b.sold} what="you sold, on Orders" to="orders" here={page === "orders"} />
        <Part k="credit" v={b.credit} what={`${W} credited, ${b.notes} credit notes on Batches`} to="batches" here={page === "batches"} />
      </div>
      {page === "orders" && live ? <p className="lg-working">And {fmt.inr(live)} sold so far from the batch still in a journey.</p> : null}
    </Card>;
  }
  const Back = ({ x }) => <span className="lg-val fx-back"><b className="tnum">{fmt.inr(x.cost)} back</b><F.SplitBar sold={x.sold} credit={x.credit} label={`${fmt.inr(x.sold)} sold, ${fmt.inr(x.credit)} credited`} /><em>{fmt.inr(x.sold)} sold · {fmt.inr(x.credit)} credited</em></span>;
  const BatchValue = ({ x, sold, live }) => live || !x ? <span className="tnum strong">{fmt.inr(sold)} so far</span> : <Back x={x} />;
  Object.assign(S, {
    DistBatches: props => <F.DistBatchesPage {...props} Head={Head} RowValue={Back} />,
    DistOrders: props => <F.DistOrdersPage {...props} Head={Head} BatchValue={BatchValue} />,
  });
})();

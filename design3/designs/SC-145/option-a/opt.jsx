// Option A · The same sum on both pages (recommended). Batches and Orders open with one card that reads the same on both:
// what the cleared batches cost him = what he sold (Orders) + what the client credited him (Batches). The page's own
// part of the sum is marked, the other links to its page, and a bar shows the split. Each batch carries its own sum the
// same way: on Batches its credit leads, on Orders its sales, and both name the other part and the cost.
(function () {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCF;
  const { cx, Card, Money, Icon } = K; const { useRoute } = S; const fmt = M.fmt;
  function Term({ v, what, sub, here, to }) {
    const { go } = useRoute();
    const body = <><Money value={v} size="m" /><span className="fx-what">{what}</span><span className="fx-sub">{here ? "this page" : sub}</span></>;
    return to && !here ? <button type="button" className="fx-term link" onClick={() => go(to)}>{body}<Icon name="arrow-right" size={14} className="fx-go" /></button> : <span className={cx("fx-term", here && "here")}>{body}</span>;
  }
  function Head({ b, page, live }) {
    const W = D.WORKSPACE.short;
    return <Card className="stack" style={{ gap: 14 }}>
      <span className="card-title">How your {b.n} cleared batches add up</span>
      <div className="fx-sum">
        <Term v={b.cost} what="what they cost you" sub={`${fmt.num(b.n)} batches at the dealer price`} />
        <span className="fx-op" aria-hidden="true">=</span>
        <Term v={b.sold} what="you sold" sub="to your kiranas, buyers and staff · on Orders" here={page === "orders"} to="orders" />
        <span className="fx-op" aria-hidden="true">+</span>
        <Term v={b.credit} what={`${W} credited you`} sub={`${b.notes} credit notes · on Batches`} here={page === "batches"} to="batches" />
      </div>
      <F.SplitBar sold={b.sold} credit={b.credit} label={`${fmt.inr(b.sold)} sold and ${fmt.inr(b.credit)} credited, of ${fmt.inr(b.cost)}`} />
      <p className="lg-working">So you ended whole on every batch: ₹0 gained or lost. Each batch below shows its own sum, and its Money tab every line of it.{page === "orders" && live ? ` The ${fmt.inr(live)} sold from the batch still in a journey joins the sum once it clears.` : ""}</p>
    </Card>;
  }
  const RowValue = ({ x }) => <span className="lg-val"><b className="tnum">{fmt.inr(x.credit)} credited</b><em>+ {fmt.inr(x.sold)} sold = {fmt.inr(x.cost)}</em></span>;
  const BatchValue = ({ x, sold, live }) => live || !x ? <span className="tnum strong">{fmt.inr(sold)}</span> : <span className="lg-val"><b className="tnum">{fmt.inr(x.sold)} sold</b><em>+ {fmt.inr(x.credit)} credited = {fmt.inr(x.cost)}</em></span>;
  Object.assign(S, {
    DistBatches: props => <F.DistBatchesPage {...props} Head={Head} RowValue={RowValue} />,
    DistOrders: props => <F.DistOrdersPage {...props} Head={Head} BatchValue={BatchValue} />,
  });
})();

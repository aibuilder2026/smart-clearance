// SC-145's shared pieces: a distributor's Batches and Orders on the stub, drawn as screens/trade.jsx draws them (SC-130,
// SC-133, SC-141), with the parts each option changes as slots: the card at the top and each batch's figure. Every
// figure is ledger.js's partners: a cleared batch's sum (whole) is what it cost him, what he sold from it and what the
// client credited him, and the sold and the credited add up to the cost, so he ends whole.
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, Flow = window.SC3_FLOW;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, Empty, BatchRow, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, SectionTitle } = S;
  const fmt = M.fmt; const P = () => window.SC3_LEDGER.partners;
  const r2 = n => Math.round(n * 100) / 100;
  const asDate = iso => new Date((iso.length > 10 ? iso : iso + "T00:00") + ":00+05:30");
  const day = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const when = iso => (iso.length > 10 ? `${day(iso)}, ${iso.slice(11, 16)}` : day(iso));
  const monthOf = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const CH = { kirana: { icon: "store", name: "Kirana scheme" }, expiresoon: { icon: "shopping-bag", name: "ExpireSoon lot" }, staff: { icon: "users", name: "Staff sale" }, foodbank: { icon: "heart-handshake", name: "Food bank" } };
  const Chan = ({ id }) => <span className="dist-chan" style={{ "--ch": `var(--ch-${id})` }} aria-hidden="true"><Icon name={CH[id].icon} size={16} stroke={2} /></span>;
  const stopBadge = j => <Badge size="sm" tone={j.todo.length ? "amber" : j.phase === "cleared" ? "green" : "blue"} dot live={!j.todo.length && j.phase !== "cleared"}>{j.todo.length ? `${j.todo.length} for you` : j.stop}</Badge>;
  const stopOf = phase => ({ "at-risk": "Verify", verified: "Value", valued: "Decide", planned: "Approve", approved: "Execute", executing: "Execute", dispatched: "Settle", settled: "Settle", cleared: "Report" }[phase] || "Detect");
  function BatchLine({ sku, id, badge, sub, size = 48 }) {
    return <div className="row dist-bl" style={{ gap: 12 }}>
      <Product name={sku.img} size={size} alt="" />
      <div className="grow stack tight" style={{ gap: 2, minWidth: 0 }}>
        <span className="row tight wrap" style={{ gap: 8 }}><b className="t-headline">{sku.name}</b>{badge}</span>
        <span className="t-footnote subtle"><span className="mono">{id}</span>{sub ? ` · ${sub}` : ""}</span>
      </div>
    </div>;
  }
  function OrderRow({ o }) {
    const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const { toast } = useNotice();
    const issue = () => { setBusy(true); setTimeout(() => { setBusy(false); Flow.act("issueInvoice"); toast({ text: "Marked issued from Tally", tone: "ok" }); }, 400); };
    return <div className="dist-order">
      <Chan id={o.id} />
      <span className="grow stack tight" style={{ gap: 2, minWidth: 0 }}>
        <span className="t-subhead"><b>{o.who}</b> · {o.what}</span>
        <span className="t-footnote muted">{CH[o.id].name}{o.at ? ` · ${when(o.at)}` : ""}{o.sub ? ` · ${o.sub}` : ""}</span>
        {o.paper && <span className="row tight wrap" style={{ gap: 8 }}><span className="dist-paper"><Icon name="file-text" size={13} /><span className="mono">{o.paper.no}</span><span>{o.paper.label}</span></span>{o.paper.issue && <Button variant="secondary" size="sm" icon="check" loading={busy} onClick={issue}>Issue from Tally</Button>}</span>}
        {o.shops && o.shops.length > 0 && <button type="button" className="pt-link t-footnote dist-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"} the {o.shops.length} shops' orders</button>}
        {open && <div className="dist-shops">{o.shops.map(k => <span key={k.name}><b>{k.name}</b>{k.at && <em>{when(k.at)}</em>}<span className="tnum">{k.units}</span></span>)}</div>}
      </span>
      <span className="tnum strong">{o.amount ? fmt.inr(o.amount) : "given"}</span>
    </div>;
  }

  /* ---------- the sums ---------- */
  // a cleared batch's sum: the rows of how he ended whole (the buyers' sales, then the credit notes), and their totals
  function sumOf(c) {
    const w = P().whole(c);
    const sold = r2(w.rows.filter(r => !r.paper).reduce((t, r) => t + r.v, 0));
    const credit = r2(w.rows.filter(r => r.paper).reduce((t, r) => t + r.v, 0));
    return { ref: c.ref, sku: c.sku, cost: w.paid, sold, credit, gain: w.gain, rows: w.rows, units: w.units, dp: w.dp, extra: w.extra };
  }
  // every batch he cleared, and their totals: what they cost him, what he sold, what was credited, the credit notes
  function book(distId, s) {
    const past = P().distBatches(distId, s).past;
    const sums = past.map(sumOf);
    const t = k => r2(sums.reduce((a, x) => a + x[k], 0));
    const notes = past.reduce((n, c) => n + c.docs.filter(d => (d.id === "support" || d.id === "expiry") && d.status !== "not required").length, 0);
    return { past, sums, n: past.length, cost: t("cost"), sold: t("sold"), credit: t("credit"), notes, of: ref => sums.find(x => x.ref === ref) };
  }

  /* ---------- Batches ---------- */
  // Head({ b }): the card at the top; RowValue({ c, x }): a cleared batch's figure; Below: what follows the card
  function DistBatchesPage({ me, Head, RowValue, Below }) {
    const s = useStore(); const { route, go } = useRoute(); const phone = useApp().bp === "phone";
    const dist = S.distOf(me); const ref = route && route.params && route.params.ref;
    if (ref) return <S.DistBatch me={me} dist={dist} id={ref} />;
    const { journey, watching } = P().distBatches(dist.id, s);
    const b = book(dist.id, s);
    const months = []; b.past.forEach(c => { const m = c.cleared.slice(0, 7); let g = months.find(x => x.m === m); if (!g) months.push(g = { m, label: monthOf(c.cleared), items: [] }); g.items.push(c); });
    return <Screen me={me} title="Batches" sub={`${dist.name} · every batch of ${D.WORKSPACE.short}'s the Watcher flagged at your godown`}>
      <div className="stack" style={{ gap: 20 }}>
        {journey.length ? <List head="In a journey now">{journey.map(x => { const sku = D.SKUS[x.sku]; const phase = x.hero ? s.hero.phase : s.mango.phase;
          return <ListRow key={x.id} chevron onClick={() => go("batches", { ref: x.id })} leading={<Product name={sku.img} size={40} />}
            title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{sku.name}</span><Badge size="sm" tone="blue" dot live>{stopOf(phase)}</Badge></span>}
            sub={`${x.id} · flagged ${day(D.DAY0)} · the agents act in your name`} value={phone ? null : `${fmt.num(x.hero ? D.PLAN.units : D.MANGO_PLAN.units)} packs`} />; })}</List> : null}
        {b.n ? <Head b={b} page="batches" /> : null}
        {Below && b.n ? <Below b={b} page="batches" /> : null}
        {months.map(g => <List key={g.m} head={`Cleared · ${g.label}`}>{g.items.map(c => { const x = b.of(c.ref);
          return <ListRow key={c.ref} chevron onClick={() => go("batches", { ref: c.ref })} leading={<Product name={c.sku.img} size={40} />}
            title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{c.sku.name}</span>{!phone && <S.OutcomeBadge o={c.outcome} size="sm" />}</span>}
            sub={`${c.ref} · flagged ${day(c.flagged)} · cleared ${day(c.cleared)}`}
            value={<RowValue c={c} x={x} page="batches" />} />; })}</List>)}
        {watching.length ? <><SectionTitle sub="From your nightly DMS export: nothing at risk">Watching</SectionTitle><div className="list">{watching.map(v => <BatchRow key={v.id} view={D.batchView(v)} compact={phone} onOpen={() => {}} />)}</div></> : null}
      </div>
    </Screen>;
  }

  /* ---------- Orders ---------- */
  // Head({ b, live, sold }): the card at the top; BatchValue({ x, rows }): a batch's figure, beside its orders
  function DistOrdersPage({ me, Head, BatchValue, Below }) {
    const s = useStore(); const { go } = useRoute(); const Px = P();
    const dist = S.distOf(me);
    const now = Px.distNow(dist.id, s).map(n => { const j = Px.journeyOf(n); return { ref: n.ref, sku: j.sku, live: true, j, rows: Px.ordersNow(n, Px.shopName) }; });
    const pastB = Px.distBatches(dist.id, s).past.map(c => ({ ref: c.ref, sku: c.sku, live: false, outcome: c.outcome, cleared: c.cleared, rows: Px.ordersPast(Px.historyFacts(c), Px.shopName) })).filter(x => x.rows.length);
    const all = now.concat(pastB);
    const b = book(dist.id, s);
    const sum = rows => r2(rows.reduce((t, o) => t + o.amount, 0));
    const live = r2(now.reduce((t, x) => t + sum(x.rows), 0));
    return <Screen me={me} title="Orders" sub={`${dist.name} · what sold from each of ${D.WORKSPACE.short}'s batches, to whom, on which paper`}>
      <div className="stack" style={{ gap: 16, maxWidth: 960 }}>
        {all.length ? <Head b={b} page="orders" live={live} /> : <Card><Empty img="van" title="No orders yet" body="When a batch's scheme, lot or staff sale sells, each order shows here under its batch." /></Card>}
        {Below && b.n ? <Below b={b} page="orders" /> : null}
        {all.map(x => <Card key={x.ref} className="stack snug">
          <div className="row between wrap" style={{ gap: 12 }}>
            <BatchLine sku={x.sku} id={x.ref} size={44} badge={x.live ? stopBadge(x.j) : <S.OutcomeBadge o={x.outcome} size="sm" />} sub={x.live ? (x.j.phase === "cleared" ? "cleared · every order" : x.rows.length ? "orders so far" : "no orders yet") : `cleared ${day(x.cleared)}`} />
            <span className="row tight">{x.rows.length > 0 && <BatchValue x={b.of(x.ref)} sold={sum(x.rows)} live={x.live} />}<Button variant="ghost" size="sm" iconRight="chevron-right" onClick={() => go("batches", { ref: x.ref })}>Papers</Button></span>
          </div>
          {x.rows.length ? <div className="dist-orders">{x.rows.map(o => <OrderRow key={o.id} o={o} />)}</div>
            : <p className="t-footnote muted" style={{ margin: 0 }}>{x.j.waiting || "Its orders show here as they come in."}</p>}
        </Card>)}
      </div>
    </Screen>;
  }

  /* ---------- pieces the options share ---------- */
  // the sum's split as a bar: what he sold, then what the client credited, as shares of what the batches cost him
  function SplitBar({ sold, credit, label }) {
    const t = sold + credit || 1;
    return <span className="fx-bar" role="img" aria-label={label}><i className="sold" style={{ width: `${(sold / t) * 100}%` }} /><i className="credit" style={{ width: `${(credit / t) * 100}%` }} /></span>;
  }
  window.SCF = { sumOf, book, DistBatchesPage, DistOrdersPage, SplitBar, r2, day, monthOf };
})();

// SC-130 option C · Statement and papers. Each partner gets a register, a row a paper (or a scheme, or a receipt),
// led by the one figure that matters to it, with the batch on every row and an export.
//   the distributor: Account, a statement of account with Munchly: what Munchly credited him since July, then every
//   paper by date (his invoices, Munchly's credit notes, the copies), or grouped by batch with how each ended;
//   the kirana: Orders becomes Schemes, every scheme it was offered with its share, what it ordered and its margin;
//   the food bank: Receipts, every receipt it issued with its packs, kilos and meals, for its own annual report.
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, Z = window.SC130;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, Money, Segmented, Sheet, Empty, useApp, useNotice } = K;
  const { useStore, Screen } = S;
  const fmt = M.fmt;

  S.NAV.distributor.splice(0, S.NAV.distributor.length,
    { id: "home", label: "Today", icon: "house" }, { id: "report", label: "Account", icon: "wallet" },
    { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true }, { id: "van", label: "Van route", short: "Van", icon: "truck" }, { id: "orders", label: "Orders", icon: "clipboard-list" });
  S.NAV.retailer.splice(0, S.NAV.retailer.length, { id: "home", label: "Offers", icon: "tag" }, { id: "report", label: "Schemes", icon: "list" });
  S.NAV.foodbank.splice(0, S.NAV.foodbank.length, { id: "pickups", label: "Pickups", icon: "heart-handshake" }, { id: "report", label: "Receipts", icon: "receipt" });

  const Fig = ({ value, what, money, children }) => <Card className="stack" style={{ gap: 8 }}><div className="lg-fig">{money ? <Money value={value} size="l" /> : <span className="num l">{value}</span>}<span className="lg-what">{what}</span></div><p className="lg-working">{children}</p></Card>;
  const Head = ({ cols, children }) => <div className="sc130-reg-head" style={{ "--cols": cols }}>{children}</div>;
  function exportCsv(name, rows) { S.download(name, S.csv(rows)); }

  /* ======================= the distributor: the statement ======================= */
  const KINDS = [{ id: "all", label: "All" }, { id: "credit", label: "Credit notes" }, { id: "invoice", label: "Tax invoices" }, { id: "copy", label: "Copies" }];
  const kindOf = d => (d.id === "support" || d.id === "expiry" ? "credit" : d.id === "invoice" || d.id === "eway" ? "invoice" : "copy");
  const COLS = "minmax(84px, 0.6fr) minmax(0, 1.6fr) minmax(0, 1.4fr) minmax(96px, 0.7fr)";
  function Account({ me }) {
    const s = useStore(); const app = useApp(); const phone = app.bp === "phone"; const { toast } = useNotice(); const dist = S.distOf(me);
    const [view, setView] = useState("date"); const [kind, setKind] = useState("all"); const [paper, setPaper] = useState(null);
    const { past } = Z.distBatches(dist.id, s);
    const rows = []; past.forEach(b => { const p = Z.distPapers(b.c); p.mine.filter(d => d.status !== "not required").concat(p.copies).forEach(d => rows.push({ b, d, date: d.id === "receipt" ? d.date || b.c.receipt.date : d.date || b.c.cleared })); });
    rows.sort((a, z) => (a.date < z.date ? 1 : a.date > z.date ? -1 : a.d.id < z.d.id ? -1 : 1));
    const shown = rows.filter(r => kind === "all" || kindOf(r.d) === kind);
    const support = past.reduce((t, b) => t + b.c.support.total, 0), credit = past.reduce((t, b) => t + ((b.c.expiry && b.c.expiry.credit) || 0), 0);
    const invoices = rows.filter(r => r.d.id === "invoice"), invTotal = invoices.reduce((t, r) => t + (r.d.total || r.d.amount), 0);
    const amountOf = d => (d.id === "invoice" ? d.total || d.amount : d.id === "support" || d.id === "expiry" ? d.amount : null);
    const csv = () => { exportCsv(`${dist.short}-statement-Munchly.csv`, [["Date", "Paper", "Number", "Batch", "Product", "Amount (₹)", "Credit to you (₹)"], ...rows.map(r => [r.date, r.d.type, r.d.no, r.b.ref, r.b.c.sku.name, amountOf(r.d) || "", kindOf(r.d) === "credit" ? amountOf(r.d) : ""])]); toast({ text: "Statement exported as CSV", tone: "ok" }); };
    return <Screen me={me} title="Account" sub={`${dist.name} with ${D.CLIENT.name}`} actions={!phone && <Button variant="secondary" size="sm" icon="download" onClick={csv}>Export</Button>}>
      <div className="stack" style={{ gap: 18 }}>
        <Fig money value={support + credit} what={`credited by ${Z.C} since July`}>{Z.inr(support)} of price support and {Z.inr(credit)} of expiry credit on {rows.filter(r => kindOf(r.d) === "credit").length} credit notes, across {past.length} batches; each made up the gap to the dealer price you paid. Your tax invoices to buyers: {invoices.length}, for <b>{Z.inr(invTotal)}</b>.</Fig>
        <div className="row wrap between" style={{ gap: 12 }}><Segmented label="View" value={view} onChange={setView} options={[{ id: "date", label: "By date" }, { id: "batch", label: "By batch" }]} />{view === "date" && <Segmented label="Papers" value={kind} onChange={setKind} options={KINDS} size="sm" />}{phone && <Button variant="secondary" size="sm" icon="download" onClick={csv}>Export</Button>}</div>
        {view === "date" ? <div className="sc130-reg" role="table" aria-label="Statement">
          <Head cols={COLS}><span role="columnheader">Date</span><span role="columnheader">Paper</span><span role="columnheader">Batch</span><span role="columnheader" className="n">Amount</span></Head>
          {shown.map(r => { const a = amountOf(r.d); const cr = kindOf(r.d) === "credit";
            return <button key={r.b.ref + r.d.id} type="button" role="row" className="sc130-reg-row" style={{ "--cols": COLS }} onClick={() => setPaper({ c: r.b.c, id: r.d.id })}>
              <span className="wide-only">{Z.day(r.date)}</span>
              <span><b>{r.d.type}</b><span className="sub mono">{r.d.no}{phone ? ` · ${Z.day(r.date)} · ${r.b.c.sku.name}` : ""}</span></span>
              <span className="wide-only">{r.b.c.sku.name}<span className="sub mono">{r.b.ref}</span></span>
              <span className={cx("n strong", cr && "sc130-plus")}>{a == null ? "copy" : `${cr ? "+" : ""}${Z.inr(a)}`}</span>
            </button>; })}
          <div className="sc130-reg-foot" style={{ "--cols": COLS }}><span className="wide-only">Total</span><span>Credited to you</span><span className="wide-only" /><span className="n sc130-plus">+{Z.inr(support + credit)}</span></div>
        </div>
        : <div className="stack" style={{ gap: 16 }}>{past.map(b => { const c = b.c; const w = Z.whole(c); const p = Z.distPapers(c);
          return <List key={b.ref} head={<span className="row tight wrap" style={{ gap: 8 }}><span>{c.sku.name} · {c.ref}</span><S.OutcomeBadge o={c.outcome} size="sm" /></span>} foot={`Received ${Z.inr(w.recv)} for ${Z.inr(w.paid)} paid · you ended whole · cleared ${Z.day(c.cleared)}`}>
            {p.mine.filter(d => d.status !== "not required").concat(p.copies).map(d => <ListRow key={d.id} chevron onClick={() => setPaper({ c, id: d.id })} icon={Z.PAPER_ICON[d.id]} title={d.type} sub={<span className="mono">{d.no}</span>} value={amountOf(d) == null ? "copy" : Z.inr(amountOf(d))} />)}
          </List>; })}</div>}
      </div>
      <Z.PaperSheet open={!!paper} onClose={() => setPaper(null)} c={paper && paper.c} id={paper && paper.id} receipt={paper && paper.id === "receipt" ? paper.c.receipt : null} />
    </Screen>;
  }

  /* ======================= the kirana: every scheme ======================= */
  const KF = [{ id: "all", label: "All" }, { id: "ordered", label: "Ordered" }, { id: "declined", label: "Declined" }, { id: "expired", label: "Expired" }];
  const KCOLS = "minmax(70px, 0.5fr) minmax(0, 1.5fr) minmax(70px, 0.5fr) minmax(110px, 0.8fr) minmax(80px, 0.6fr) minmax(80px, 0.6fr)";
  function Schemes({ me }) {
    const s = useStore(); const app = useApp(); const phone = app.bp === "phone"; const { toast } = useNotice(); const k = Z.shopOf(me); const [f, setF] = useState("all"); const [open, setOpen] = useState(null);
    const all = Z.offersFor(k, s, Z.declinedAt()).filter(o => o.status !== "open"); const list = all.filter(o => f === "all" || o.status === f);
    const ordered = all.filter(o => o.status === "ordered"), margin = ordered.reduce((t, o) => t + o.m.margin, 0), paid = ordered.reduce((t, o) => t + o.m.pay, 0);
    const n = st => all.filter(o => o.status === st).length;
    const csv = () => { exportCsv(`${k.name}-schemes.csv`, [["Sent", "Product", "Distributor", "Your share", "Status", "Ordered", "Paid (₹)", "Margin at MRP (₹)"], ...all.map(o => [o.sent.slice(0, 10), o.sku.name, o.dist.short, o.share, Z.OFFER_STATUS[o.status].label, o.units, o.m ? o.m.pay : "", o.m ? o.m.margin : ""])]); toast({ text: "Schemes exported as CSV", tone: "ok" }); };
    return <Screen me={me} title="Schemes" sub={`${k.name} · every scheme ${k.distributor === "rakesh" ? "Rakesh Traders" : "your distributor"} offered you`} actions={!phone && <Button variant="secondary" size="sm" icon="download" onClick={csv}>Export</Button>}>
      <div className="stack" style={{ gap: 18, maxWidth: 980 }}>
        <Fig money value={margin} what="your margin at MRP">{all.length} schemes since July: you ordered from {n("ordered")}, declined {n("declined")}, and {n("expired")} expired. You paid {Z.inr(paid)} for {fmt.num(ordered.reduce((t, o) => t + o.units, 0))} packets, 2 free in every 12.</Fig>
        <div className="sc130-fit"><Segmented label="Show" value={f} onChange={setF} options={KF} size="sm" /></div>
        {list.length ? <div className="sc130-reg" role="table" aria-label="Schemes">
          <Head cols={KCOLS}><span role="columnheader">Sent</span><span role="columnheader">Product</span><span role="columnheader" className="n">Share</span><span role="columnheader">Status</span><span role="columnheader" className="n">Paid</span><span role="columnheader" className="n">Margin</span></Head>
          {list.map(o => <button key={o.ref} type="button" role="row" className="sc130-reg-row" style={{ "--cols": KCOLS }} onClick={() => setOpen(o)}>
            <span className="wide-only">{Z.day(o.sent)}</span>
            <span><b>{o.sku.name}</b><span className="sub">₹{o.pack.toFixed(2)} a packet{phone ? ` · ${Z.day(o.sent)}` : ""}</span></span>
            <span className="n wide-only">{o.share}</span>
            <span><Z.OfferStatus o={o} size="sm" /></span>
            <span className="n wide-only">{o.m ? Z.inr(o.m.pay) : "–"}</span>
            <span className="n wide-only strong">{o.m ? Z.inr(o.m.margin) : "–"}</span>
          </button>)}
        </div> : <Card><Empty icon="list" title="Nothing here" body="Schemes you order from, decline or let expire show here." /></Card>}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? open.sku.name : ""}>{open && <div className="stack snug">
        <div className="row tight wrap" style={{ gap: 8 }}><Z.OfferStatus o={open} /><span className="t-footnote muted">sent {Z.when(open.sent)} by {open.dist.short}</span></div>
        <p className="t-body" style={{ margin: 0 }}>{open.status === "ordered" ? `You ordered ${open.units} packets on ${Z.when(open.orderedAt)}${open.van ? `, delivered on ${Z.weekday(open.van)}'s van` : ""}: you paid ${open.m.paid} × ₹${open.pack.toFixed(2)} = ${Z.inr(open.m.pay)}, got ${open.m.free} free, and sell all ${open.units} at ₹${open.mrp} for ${Z.inr(open.m.margin)} of margin.` : `${Z.whyText(open)}. Nothing was ordered and nothing is owed.`}</p>
        <List>{[["Price", `₹${open.pack.toFixed(2)} a packet · MRP ₹${open.mrp}`], ["Scheme", "Buy 10, get 2 free"], ["Your share", `up to ${open.share} packets`], ["Best before", fmt.date(open.bestBefore)]].map(([a, b]) => <ListRow key={a} title={a} value={b} />)}</List>
      </div>}</Sheet>
    </Screen>;
  }
  function Offers({ me }) {
    const s = useStore(); const { go } = S.useRoute(); const { toast } = useNotice(); const k = Z.shopOf(me); const [dec, setDec] = useState(Z.declinedAt());
    const now = Z.offersFor(k, s, dec).find(o => o.story);
    const no = () => { Z.decline(); setDec(Z.declinedAt()); toast({ text: "Declined · it is in your Schemes" }); };
    return <Screen me={me} title="Offers" sub={`${k.name} · ${k.area}, Nagpur`}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {now && now.status === "open" ? <><S.OfferCard shop={k.name} onOpen={() => go("offer")} /><Button variant="ghost" size="lg" block onClick={no}>Not this time</Button></>
          : now && now.status === "ordered" ? <Card className="row" style={{ gap: 14 }}><Product name="pack-chips" size={64} /><div className="grow"><b>Ordered · {now.units} packets</b><div className="t-footnote muted">Masala Chips 150 g · comes on Tuesday's van</div></div><Badge tone="green" icon="check">confirmed</Badge></Card>
          : <Card><Empty img="kirana" title="No open offer" body={now && now.status === "declined" ? `You declined the Masala Chips scheme on ${Z.when(now.declinedAt)}. It is in your Schemes.` : "Rakesh Traders' schemes arrive here as a notification, in Hindi, ready to order in one tap."} /></Card>}
      </div>
    </Screen>;
  }

  /* ======================= the food bank: every receipt ======================= */
  const FCOLS = "minmax(78px, 0.6fr) minmax(0, 1.3fr) minmax(0, 1.3fr) minmax(64px, 0.5fr) minmax(64px, 0.5fr) minmax(64px, 0.5fr)";
  function Receipts({ me }) {
    const s = useStore(); const app = useApp(); const phone = app.bp === "phone"; const { toast } = useNotice(); const [rec, setRec] = useState(null);
    const done = Z.pickupsFor(me.org, s).filter(p => p.state === "collected");
    const meals = done.reduce((t, p) => t + p.meals, 0), packs = done.reduce((t, p) => t + p.units, 0), kg = Math.round(done.reduce((t, p) => t + p.kg, 0) * 100) / 100;
    const csv = () => { exportCsv(`${me.org}-receipts-Munchly.csv`, [["Collected", "Receipt", "Product", "Batch", "Donor", "Via", "From", "Packs", "kg", "Meals"], ...done.map(p => [p.collected.slice(0, 10), p.receipt.no, p.sku.name, p.ref, D.CLIENT.name, p.dist.name, p.from, p.units, p.kg, p.meals])]); toast({ text: "Receipts exported as CSV", tone: "ok" }); };
    return <Screen me={me} title="Receipts" sub={`${me.org} · every receipt issued for ${Z.C}'s surplus`} actions={!phone && done.length ? <Button variant="secondary" size="sm" icon="download" onClick={csv}>Export</Button> : null}>
      <div className="stack" style={{ gap: 18, maxWidth: 1000 }}>
        {done.length ? <><Fig value={fmt.num(meals)} what={`meals from ${Z.C}'s surplus since July`}>{done.length} receipts for {fmt.num(packs)} packs, {fmt.kg(kg)} kept out of landfill. Each receipt goes to {Z.C} for its BRSR table; the FSSAI checklist came with every pickup.</Fig>
          <div className="sc130-reg" role="table" aria-label="Receipts">
            <Head cols={FCOLS}><span role="columnheader">Collected</span><span role="columnheader">Receipt</span><span role="columnheader">Product</span><span role="columnheader" className="n">Packs</span><span role="columnheader" className="n">kg</span><span role="columnheader" className="n">Meals</span></Head>
            {done.map(p => <button key={p.ref} type="button" role="row" className="sc130-reg-row" style={{ "--cols": FCOLS }} onClick={() => setRec(p)}>
              <span className="wide-only">{Z.day(p.collected)}</span>
              <span><b className="mono">{p.receipt.no}</b><span className="sub">{p.receipt.type}{phone ? ` · ${Z.day(p.collected)}` : ""}</span></span>
              <span className="wide-only">{p.sku.name}<span className="sub">from {p.from}</span></span>
              <span className="n wide-only">{fmt.num(p.units)}</span>
              <span className="n wide-only">{p.kg}</span>
              <span className="n strong">{fmt.num(p.meals)}</span>
            </button>)}
            <div className="sc130-reg-foot" style={{ "--cols": FCOLS }}><span className="wide-only">Total</span><span>{done.length} receipts</span><span className="wide-only" /><span className="n wide-only">{fmt.num(packs)}</span><span className="n wide-only">{kg}</span><span className="n">{fmt.num(meals)}</span></div>
          </div></> : <Card><Empty icon="receipt" title="No receipts yet" body="Each pickup you collect issues a receipt, and it shows here." /></Card>}
      </div>
      <Z.PaperSheet open={!!rec} onClose={() => setRec(null)} c={rec && rec.c} receipt={rec && rec.receipt} />
    </Screen>;
  }

  /* ---------- the routes these screens take over ---------- */
  const ReportOrig = S.Report;
  S.Report = props => { const r = props.me.role; return r === "distributor" ? <Account {...props} /> : r === "retailer" ? <Schemes {...props} /> : r === "foodbank" ? <Receipts {...props} /> : <ReportOrig {...props} />; };
  S.RetailHome = Offers;
})();

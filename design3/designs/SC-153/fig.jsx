// SC-153's mockups, the pieces every option shares. A tax invoice from the distributor for every kirana order (the
// maintainer's answers on SC-148: an invoice per order, before GST, the scheme as a discount): the pack price less the
// scheme's 16.67% is what the ledger counts, then CGST and SGST at 2.5% each, rounded to the rupee; numbered in the
// distributor's own sales series, history first. The layout is SC-148's option B, Tally's, for a B2C supply within the
// state (the shops are unregistered), so no e-invoice. The options differ in where the invoices show, not in the paper.
(function () {
  const { useState, useRef } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, Sheet, Product, Money } = K;
  const PA = () => window.SC3_PAPERS, L = () => window.SC3_LEDGER, P = () => window.SC3_LEDGER.partners;
  const r2 = n => Math.round(n * 100) / 100;
  const n2 = n => (n < 0 ? "-" : "") + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dmy = iso => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");
  const asDate = iso => new Date((iso.length > 10 ? iso : iso + "T00:00") + ":00+05:30");
  const day = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const when = iso => (iso.length > 10 ? `${day(iso)}, ${iso.slice(11, 16)}` : day(iso));
  const plus = (iso, min) => { const t = new Date(asDate(iso).getTime() + min * 60000); const p = x => String(x).padStart(2, "0"); const i = new Date(t.getTime() + 330 * 60000); return `${i.getUTCFullYear()}-${p(i.getUTCMonth() + 1)}-${p(i.getUTCDate())}T${p(i.getUTCHours())}:${p(i.getUTCMinutes())}`; };

  // each distributor's own sales series (fictional), from his first invoice to a kirana in July
  const SERIES = { rakesh: { prefix: "RT/26-27/", first: 1164 }, lakshmi: { prefix: "LA/26-27/", first: 873 }, patil: { prefix: "PD/26-27/", first: 512 }, gupta: { prefix: "GS/26-27/", first: 2041 } };
  const shopOf = id => (window.SC3_WORLD.KIRANAS.find(k => k.id === id) || D.KIRANAS.find(k => k.id === id));

  // one order's invoice: the pack price on every packet, less the scheme's discount, so the taxable value is what the
  // ledger counts (packets × the effective price); then CGST and SGST, and the total to the rupee
  function invoiceOf({ no, at, c, shopId, units }) {
    const line = c.lines.kirana, sku = c.sku, dist = c.dist, buy = M.RULES.scheme.buy, free = M.RULES.scheme.free;
    const gross = r2(units * line.packPrice), taxable = r2(units * line.price), discount = r2(gross - taxable);
    const gstPct = Math.round(sku.gst * 100), cgst = r2((taxable * sku.gst) / 2), sgst = cgst, exact = r2(taxable + cgst + sgst), total = Math.round(exact);
    return { no, at, date: at.slice(0, 10), ref: c.batch.id, c, sku, dist, shop: shopOf(shopId), units, rate: line.packPrice, gross, discountPct: r2((free / (buy + free)) * 100), discount, taxable, gstPct, cgst, sgst, tax: r2(cgst + sgst), roundOff: r2(total - exact), total, mrp: sku.mrp, sell: units * sku.mrp, margin: r2(units * sku.mrp - total) };
  }
  // every invoice a distributor issued to his kirana shops for the client's batches: the history's orders, two minutes
  // apart from their step as backend-api places them, then the story's, numbered in order
  function invoicesFor(distId, s) {
    const orders = [];
    L().HISTORY.filter(c => c.dist.id === distId).forEach(c => { const at = (c.steps.find(x => x.step === "orders") || {}).at; c.kiranas.forEach((k, i) => orders.push({ at: plus(at, 2 * i), c, shopId: k.kirana, units: k.units })); });
    const sc = L().storyCase();
    if (sc.dist.id === distId) (s.hero.orders || []).forEach(o => orders.push({ at: `${D.DAY0}T${o.at}`, c: sc, shopId: o.id, units: o.units }));
    orders.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
    const sr = SERIES[distId];
    return orders.map((o, i) => invoiceOf(Object.assign({ no: sr.prefix + String(sr.first + i).padStart(4, "0") }, o)));
  }
  const invoicesOf = (ref, distId, s) => invoicesFor(distId, s).filter(x => x.ref === ref);
  const sum = (list, k) => r2(list.reduce((t, x) => t + x[k], 0));
  const range = list => (list.length ? `${list[0].no} to ${list[list.length - 1].no.split("/").pop()}` : "");

  const Cell = ({ k, children, className }) => <div className={cx("tl-cell", className)}>{k && <em>{k}</em>}{children}</div>;
  // the tax invoice he issues from Tally for one shop's scheme order: B2C within the state, so CGST and SGST, no IRN
  function KiranaInvoice({ inv }) {
    const R = inv.dist, k = inv.shop, sku = inv.sku, half = inv.gstPct / 2;
    const rows = [[`Less: Scheme discount, buy ${M.RULES.scheme.buy} get ${M.RULES.scheme.free} free`, `${n2(inv.discountPct)}%`, -inv.discount], [`CGST @ ${half}%`, "", inv.cgst], [`SGST @ ${half}%`, "", inv.sgst], ["Round off", "", inv.roundOff]];
    return <div className="paper tl">
      <div className="tl-title">Tax Invoice</div>
      <div className="tl-copy">(ORIGINAL FOR RECIPIENT)</div>
      <div className="tl-grid tl-two">
        <Cell><b>{R.name}</b><br />{R.address}<br />GSTIN/UIN: {R.gstin}<br />State Name: {R.state}, Code: {R.stateCode}<br />FSSAI Lic. No.: {R.fssai}<br />E-Mail: {R.email}</Cell>
        <div className="tl-meta">
          <Cell k="Invoice No."><b>{inv.no}</b></Cell><Cell k="Dated"><b>{dmy(inv.date)}</b></Cell>
          <Cell k="Buyer's Order No.">Scheme order, {inv.at.slice(11, 16)}</Cell><Cell k="Mode/Terms of Payment">Cash on delivery</Cell>
          <Cell k="Dispatched through">Own van, the scheme's round</Cell><Cell k="Destination">{k.area}</Cell>
        </div>
      </div>
      <div className="tl-grid tl-two">
        <Cell k="Buyer (Bill to and Ship to)"><b>{k.name}</b><br />{k.area}, {R.city} {k.pincode}, {R.state}<br />GSTIN/UIN: Unregistered<br />State Name: {R.state}, Code: {R.stateCode}<br />Place of Supply: {R.state} ({R.stateCode})</Cell>
        <Cell k="Terms of Delivery">Door delivery on the van round<em style={{ marginTop: 8 }}>Reverse charge</em>No<em style={{ marginTop: 8 }}>E-way bill</em>Not required: within {R.city}, under ₹{fmt.num(M.RULES.ewayThreshold)}</Cell>
      </div>
      <table className="tl-table tl-items"><thead><tr><th>Sl</th><th>Description of Goods</th><th>HSN/SAC</th><th>Quantity</th><th>Rate</th><th>per</th><th>Amount</th></tr></thead><tbody>
        <tr><td>1</td><td><b>{sku.brand} {sku.name}</b><br /><span className="tl-small">Batch {inv.ref} · best before {dmy(inv.c.batch.bestBefore)} · MRP ₹{sku.mrp.toFixed(2)} a pack, incl. of all taxes</span>{rows.map(([t, p]) => <div key={t} style={{ marginTop: 6, textAlign: "right" }}><b>{t}</b>{p ? ` @ ${p}` : ""}</div>)}</td>
          <td>{sku.hsn}</td><td className="tl-num"><b>{fmt.num(inv.units)} PCS</b></td><td className="tl-num">{inv.rate.toFixed(2)}</td><td>PCS</td>
          <td className="tl-num">{n2(inv.gross)}{rows.map(([t, , v]) => <div key={t} style={{ marginTop: 6 }}>{n2(v)}</div>)}</td></tr>
        <tr><td /><td className="tl-num"><b>Total</b></td><td /><td className="tl-num"><b>{fmt.num(inv.units)} PCS</b></td><td /><td /><td className="tl-num"><b>₹ {n2(inv.total)}</b></td></tr>
        <tr><td colSpan={7}>Amount Chargeable (in words)<br /><b>{PA().words(inv.total)}</b></td></tr>
      </tbody></table>
      <table className="tl-table"><thead><tr><th>HSN/SAC</th><th>Taxable Value</th><th>CGST · Rate</th><th>Amount</th><th>SGST · Rate</th><th>Amount</th><th>Total Tax</th></tr></thead><tbody>
        <tr><td>{sku.hsn}</td><td className="tl-num">{n2(inv.taxable)}</td><td className="tl-num">{half}%</td><td className="tl-num">{n2(inv.cgst)}</td><td className="tl-num">{half}%</td><td className="tl-num">{n2(inv.sgst)}</td><td className="tl-num">{n2(inv.tax)}</td></tr>
        <tr><td colSpan={7}>Tax Amount (in words): <b>{PA().words(inv.tax)}</b></td></tr>
      </tbody></table>
      <div className="tl-grid tl-two">
        <Cell>Company's PAN: <b>{R.pan}</b><em style={{ marginTop: 8 }}>Declaration</em>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Sold under {D.WORKSPACE.short}'s scheme, within the best-before date.</Cell>
        <Cell k="Company's Bank Details">Bank Name: {R.bank.name}<br />A/c No.: {R.bank.account}<br />Branch &amp; IFS Code: {R.bank.ifsc}<div className="tl-sign">for <b>{R.name}</b></div><div className="tl-num">Authorised Signatory</div></Cell>
      </div>
      <div className="tl-foot">SUBJECT TO {R.city.toUpperCase()} JURISDICTION · This is a Computer Generated Invoice</div>
    </div>;
  }
  // a batch's invoices to its shops as Tally's sales register: each a row, opening its invoice, with the totals
  function Register({ list, onOpen, title }) {
    const R = list[0] && list[0].dist;
    return <div className="paper tl skr">
      <div className="tl-title">{title || "Sales Register"}</div>
      <div className="tl-copy">{R ? `${R.name} · tax invoices to kiranas · ${list[0].sku.brand} ${list[0].sku.name}, batch ${list[0].ref}` : ""}</div>
      <table className="tl-table skr-table"><thead><tr><th>Date</th><th>Invoice No.</th><th>Particulars</th><th>Packs</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>Total</th></tr></thead><tbody>
        {list.map(x => <tr key={x.no}><td className="tnum">{dmy(x.date).slice(0, 5)}</td><td>{onOpen ? <button type="button" className="pt-link mono" onClick={() => onOpen(x)}>{x.no}</button> : <span className="mono">{x.no}</span>}</td><td>{x.shop.name}</td><td className="tl-num">{x.units}</td><td className="tl-num">{n2(x.taxable)}</td><td className="tl-num">{n2(x.cgst)}</td><td className="tl-num">{n2(x.sgst)}</td><td className="tl-num">{n2(x.total)}</td></tr>)}
        <tr><td colSpan={3}><b>{list.length} invoices</b></td><td className="tl-num"><b>{fmt.num(sum(list, "units"))}</b></td><td className="tl-num"><b>{n2(sum(list, "taxable"))}</b></td><td className="tl-num"><b>{n2(sum(list, "cgst"))}</b></td><td className="tl-num"><b>{n2(sum(list, "sgst"))}</b></td><td className="tl-num"><b>{n2(sum(list, "total"))}</b></td></tr>
      </tbody></table>
      <div className="tl-foot">Taxable value {fmt.inr2(sum(list, "taxable"))} is what the scheme sold: {fmt.num(sum(list, "units"))} packets at ₹{list[0] ? list[0].c.lines.kirana.price.toFixed(2) : ""} effective</div>
    </div>;
  }
  // a paper in a sheet, with its PDF (printed here; the Paperwork agent's own on the live workspace)
  function PaperSheet({ title, open, onClose, children, pdfName }) {
    const ref = useRef(null);
    const pdf = () => { const n = ref.current; if (n) S.printPage(pdfName || title, n.innerHTML, { styles: true }); };
    return <Sheet open={open} onClose={onClose} title={title} footer={<Button variant="secondary" block icon="download" onClick={pdf}>Download PDF</Button>}><div ref={ref}>{children}</div></Sheet>;
  }
  // the kirana's order as the invoice has it: before GST, the GST, what he paid, what he sells it for, his margin
  const PtLine = ({ k, sub, v, strong }) => <div className={cx("pt-line", strong && "strong")}><span>{k}{sub && <em> {sub}</em>}</span><span className="tnum">{v}</span></div>;
  function OrderFigures({ inv }) {
    return <div className="stack tight">
      <PtLine k={`You ordered ${inv.units} packets`} sub={when(inv.at)} v="" />
      <PtLine k="Before GST" sub={`${inv.units} × ₹${inv.rate.toFixed(2)}, less the scheme's ${n2(inv.discountPct)}%`} v={fmt.inr2(inv.taxable)} />
      <PtLine k="GST" sub={`CGST ${inv.gstPct / 2}% + SGST ${inv.gstPct / 2}%`} v={fmt.inr2(inv.tax)} />
      <PtLine k="You paid" sub="the invoice, to the rupee" v={fmt.inr(inv.total)} />
      <PtLine k="You sell at MRP" sub={`${inv.units} × ₹${inv.mrp}`} v={fmt.inr(inv.sell)} />
      <div className="hairline" style={{ margin: "4px 0" }} />
      <PtLine k="Your margin" v={fmt.inr2(inv.margin)} strong />
    </div>;
  }
  // a kirana's own invoices: the orders he placed, each with its invoice
  const shopInvoices = (shop, s) => invoicesFor(shop.distributor, s).filter(x => x.shop.id === shop.id);


  /* ---------- the screens each option changes, as design3 draws them today (screens/trade.jsx, finance.jsx), with the
     parts an option fills: the shops' orders, a batch's tabs and papers, the pack's cards ---------- */
  const { Avatar, List, ListRow, Empty, Tile, DocCard, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle, Locked } = S;
  const CH = { kirana: { icon: "store", name: "Kirana scheme" }, expiresoon: { icon: "shopping-bag", name: "ExpireSoon lot" }, staff: { icon: "users", name: "Staff sale" }, foodbank: { icon: "heart-handshake", name: "Food bank" }, destroy: { icon: "recycle", name: "Destroyed at the godown", ch: "writeoff" } };
  const Chan = ({ id, icon }) => <span className="dist-chan" style={{ "--ch": `var(--ch-${(CH[id] && CH[id].ch) || id})` }} aria-hidden="true"><Icon name={icon || CH[id].icon} size={16} stroke={2} /></span>;
  const stopBadge = j => <Badge size="sm" tone={j.todo.length ? "amber" : j.phase === "cleared" ? "green" : "blue"} dot live={!j.todo.length && j.phase !== "cleared"}>{j.todo.length ? `${j.todo.length} for you` : j.stop}</Badge>;
  function BatchLine({ sku, id, badge, sub, size = 48 }) {
    return <div className="row dist-bl" style={{ gap: 12 }}><Product name={sku.img} size={size} alt="" />
      <div className="grow stack tight" style={{ gap: 2, minWidth: 0 }}><span className="row tight wrap" style={{ gap: 8 }}><b className="t-headline">{sku.name}</b>{badge}</span><span className="t-footnote subtle"><span className="mono">{id}</span>{sub ? ` · ${sub}` : ""}</span></div></div>;
  }
  const shown = x => { const sold = Math.round(x.sold), credit = Math.round(x.credit); return { sold, credit, cost: sold + credit }; };
  function SumLine({ x }) { const v = shown(x); return <span className="lg-val"><b className="tnum">{fmt.inr(v.sold)} sold</b><em>+ {fmt.inr(v.credit)} credited = {fmt.inr(v.cost)}</em></span>; }
  // an order on the distributor's Orders; `Shops` draws the scheme's shops (each option its own), `paperOf` the row's line
  function OrderRow({ o, Shops, ref_, distId }) {
    const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const { toast } = useNotice();
    const issue = () => { setBusy(true); setTimeout(() => { setBusy(false); window.SC3_FLOW.act("issueInvoice"); toast({ text: "Marked issued from Tally", tone: "ok" }); }, 400); };
    const s = useStore(); const inv = o.id === "kirana" ? invoicesOf(ref_, distId, s) : [];
    return <div className="dist-order">
      <Chan id={o.id} />
      <span className="grow stack tight" style={{ gap: 2, minWidth: 0 }}>
        <span className="t-subhead"><b>{o.who}</b> · {o.what}</span>
        <span className="t-footnote muted">{CH[o.id].name}{o.at ? ` · ${when(o.at)}` : ""}{o.sub ? ` · ${o.sub}` : ""}</span>
        {o.paper && <span className="row tight wrap" style={{ gap: 8 }}><span className="dist-paper"><Icon name="file-text" size={13} /><span className="mono">{o.paper.no}</span><span>{o.paper.label}</span></span>{o.paper.issue && <Button variant="secondary" size="sm" icon="check" loading={busy} onClick={issue}>Issue from Tally</Button>}</span>}
        {inv.length > 0 && <span className="row tight wrap" style={{ gap: 8 }}><span className="dist-paper"><Icon name="receipt" size={13} /><span className="mono">{range(inv)}</span><span>{inv.length} tax invoices · {fmt.inr2(sum(inv, "tax"))} GST collected</span></span></span>}
        {o.shops && o.shops.length > 0 && <button type="button" className="pt-link t-footnote dist-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"} the {o.shops.length} shops' orders</button>}
        {open && <Shops o={o} inv={inv} />}
      </span>
      <span className="tnum strong">{o.amount ? fmt.inr(o.amount) : "given"}</span>
    </div>;
  }
  function DistOrdersPage({ me, Shops }) {
    const s = useStore(); const { go } = useRoute(); const Px = P(); const dist = S.distOf(me);
    const now = Px.distNow(dist.id, s).map(n => { const j = Px.journeyOf(n); return { ref: n.ref, sku: j.sku, live: true, j, rows: Px.ordersNow(n, Px.shopName) }; });
    const past = Px.distBatches(dist.id, s).past.map(c => ({ ref: c.ref, sku: c.sku, live: false, outcome: c.outcome, cleared: c.cleared, rows: Px.ordersPast(Px.historyFacts(c), Px.shopName) })).filter(b => b.rows.length);
    const sums = Px.sumsOf(Px.distBatches(dist.id, s).past); const total = b => Math.round(b.rows.reduce((t, o) => t + o.amount, 0) * 100) / 100;
    return <Screen me={me} title="Orders" sub={`${dist.name} · what sold from each of ${D.WORKSPACE.short}'s batches, to whom, on which paper`}>
      <div className="stack" style={{ gap: 16, maxWidth: 960 }}>
        {now.concat(past).map(b => <Card key={b.ref} className="stack snug">
          <div className="row between wrap" style={{ gap: 12 }}>
            <BatchLine sku={b.sku} id={b.ref} size={44} badge={b.live ? stopBadge(b.j) : <S.OutcomeBadge o={b.outcome} size="sm" />} sub={b.live ? (b.j.phase === "cleared" ? "cleared · every order" : "orders so far") : `cleared ${day(b.cleared)}`} />
            <span className="row tight">{!b.live && sums.batches.find(x => x.ref === b.ref) ? <SumLine x={sums.batches.find(x => x.ref === b.ref)} /> : <span className="tnum strong">{fmt.inr(total(b))}</span>}<Button variant="ghost" size="sm" iconRight="chevron-right" onClick={() => go("batches", { ref: b.ref })}>Papers</Button></span>
          </div>
          <div className="dist-orders">{b.rows.map(o => <OrderRow key={o.id} o={o} Shops={Shops} ref_={b.ref} distId={dist.id} />)}</div>
        </Card>)}
      </div>
    </Screen>;
  }
  // the distributor's batch page: its head and tabs (an option may add one), What happened, Money and Papers as today
  const DIST_TABS = [{ id: "what", label: "What happened", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "photos", label: "Photos", icon: "camera" }];
  function DistBatchPage({ me, id, tabs, Extra, PapersMore, start }) {
    const s = useStore(); const dist = S.distOf(me); const [tab, setTab] = useState(start || "what"); const [paper, setPaper] = useState(null);
    const past = P().distBatches(dist.id, s).past.find(c => c.ref === id); const c = past || L().storyCase();
    const head = <S.PtHead sku={c.sku} id={id} where={`${dist.godown}, ${dist.city}`} badge={past ? <S.OutcomeBadge o={c.outcome} size="sm" /> : <Badge size="sm" tone="green" dot>Report</Badge>} line={past ? `Flagged ${day(c.flagged)} · cleared ${day(c.cleared)}` : `Flagged ${day(D.DAY0)} · the agents act in your name`}>
      <S.PtTabs tabs={tabs || DIST_TABS} value={tab} onChange={setTab} label={`${c.sku.name}, ${id}`} /></S.PtHead>;
    let body;
    if (tab === "what") body = <Card><S.PtMoments items={past ? P().moments(c) : P().storyMoments(s)} /></Card>;
    else if (tab === "papers") { const p = P().distPapers(c); body = <div className="stack" style={{ gap: 16 }}>
      <div><div className="pt-head">Your papers</div><div className="pt-papers">{p.mine.map(d => <S.PaperRow key={d.id} c={c} d={d} onOpen={setPaper} />)}{PapersMore && <PapersMore c={c} dist={dist} />}</div></div>
      {p.copies.length ? <div><div className="pt-head">Copies for your records</div><div className="pt-papers">{p.copies.map(d => <S.PaperRow key={d.id} c={c} d={d} onOpen={setPaper} />)}</div></div> : null}
    </div>; }
    else body = Extra ? <Extra tab={tab} c={c} dist={dist} /> : null;
    return <Screen me={me} title={c.sku.name} back="Batches" hideLarge below={head}>
      <div className="pt-body">{body}</div>
      <S.PaperSheet open={!!paper} onClose={() => setPaper(null)} c={c} id={paper} receipt={paper === "receipt" ? c.receipt : null} />
    </Screen>;
  }
  // Priya's pack (finance.jsx PaperPack), with the cards and papers an option adds after the client's own
  function PackPage({ me, cards, paperOf, startOn }) {
    const app = useApp(); const s = useStore(); const c = L().storyCase(); const h = s.hero; const paperRef = useRef(null);
    const DOC = id => c.docs.find(d => d.id === id); const extra = cards || [];
    const [picked, setPicked] = useState(startOn || null); const sel = picked || "invoice"; const [sheet, setSheet] = useState(false);
    const own = DOC(sel); const more = extra.find(x => x.doc.id === sel);
    const open = id => { setPicked(id); if (app.bp !== "desktop") setSheet(true); };
    const title = own ? own.type : more ? more.doc.type : "";
    const body = own ? <S.Paper id={sel} c={c} /> : more ? paperOf(more) : null;
    const W = D.WORKSPACE;
    return <Screen me={me} title="Paperwork" sub={`${c.batch.id} · prepared by the Paperwork agent at the award`}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <Tile label="Rakesh's invoice" icon="receipt"><Money value={DOC("invoice").total} size="s" /></Tile>
          <Tile label="Price support" icon="hand-coins"><Money value={DOC("support").amount} size="s" /></Tile>
          <Tile label="GST credit kept" icon="badge-check"><Money value={DOC("itc").amount} size="s" style={{ color: "var(--primary-text)" }} /></Tile>
          <Tile label="Things to chase" icon="list-checks"><span className="num s">0</span></Tile>
        </div>
        <Columns sideWidth={520}
          main={<><SectionTitle sub="Generated, drafted or not required, each with its reason" right={<Badge tone="green" icon="check">reviewed</Badge>}>Document pack</SectionTitle>
            <div className="docgrid">{c.docs.map(d => <div key={d.id} className={cx("docpick", sel === d.id && app.bp === "desktop" && "on")}><DocCard doc={d} onOpen={() => open(d.id)} /></div>)}
              {extra.map(x => <div key={x.doc.id} className={cx("docpick", sel === x.doc.id && app.bp === "desktop" && "on")}><DocCard doc={x.doc} onOpen={() => open(x.doc.id)} /></div>)}</div></>}
          side={app.bp === "desktop" && body ? <><SectionTitle sub={more ? more.sub : own.owner === D.CLIENT.short ? `Issued by ${W.short}` : `Drafted for ${c.dist.name}`} right={<Button variant="secondary" size="sm" icon="download">Download PDF</Button>}>{title}</SectionTitle><div ref={paperRef}>{body}</div></> : null} />
      </div>
      <Sheet open={sheet} onClose={() => setSheet(false)} title={title}>{body}</Sheet>
    </Screen>;
  }

  window.SCK = { r2, n2, dmy, day, when, SERIES, invoicesFor, invoicesOf, shopInvoices, sum, range, KiranaInvoice, Register, PaperSheet, OrderFigures, PtLine, Chan, DistOrdersPage, DistBatchPage, DIST_TABS, PackPage };
})();

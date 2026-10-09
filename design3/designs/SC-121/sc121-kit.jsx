// SC-121's mockups, the pieces every option shares: a batch's outcome, the period, the three readings of one ledger,
// and the batch's own page (the operator's batch head from SC-112, with Money, Papers and Impact as its tabs). Loaded
// after screens/finance.js; each option's opt.jsx builds its home from these.
(function () {
  const { useState, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, X = window.SC121;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Segmented, Sheet, Product, Money, Roll, DocCard, useApp } = K;
  const { useRoute, Screen, Columns, SectionTitle } = S;
  const fmt = M.fmt;
  const r2 = n => Math.round(n * 100) / 100;
  const day = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const month = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { month: "long" });
  const inr2 = n => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const kg = n => fmt.kg(r2(n));

  function OutcomeBadge({ o, size }) { const x = X.OUTCOME[o]; return <Badge size={size} tone={x.tone} icon={x.icon}>{x.label}</Badge>; }

  function PeriodSwitch({ value, onChange }) {
    return <Segmented label="Period" value={value} onChange={onChange} options={X.PERIODS.map(p => ({ id: p.id, label: p.label }))} />;
  }

  // the three readings of the one ledger: what each batch's row and the period's figure say in each
  const READINGS = [
    { id: "money", label: "Money", icon: "coins" },
    { id: "gst", label: "GST", icon: "badge-check" },
    { id: "impact", label: "Impact", icon: "leaf" },
  ];
  const valueOf = (b, reading) => (reading === "money" ? b.ledger.net : reading === "gst" ? b.ledger.itcKept : b.ledger.kg);
  function ReadingSwitch({ value, onChange }) { return <Segmented label="Reading" value={value} onChange={onChange} options={READINGS} />; }

  // quarter-sized rupees read in lakh, as the current screen does
  function Lakh({ value, size = "l" }) {
    return <span className={cx("num money", size)}><span className="sr-only">{"₹" + (value / 1e5).toFixed(2) + " lakh"}</span><span className="cur" aria-hidden="true">₹</span><Roll value={value / 1e5} format={v => v.toFixed(2)} hidden /><span aria-hidden="true" className="sc121-unit">lakh</span></span>;
  }
  function Kilos({ value, size = "l" }) {
    const t = value >= 1000;
    return <span className={cx("num", size)}><span className="sr-only">{kg(value)}</span><Roll value={t ? value / 1000 : value} format={v => (t ? v.toFixed(2) : Math.round(v).toLocaleString("en-IN"))} hidden /><span aria-hidden="true" className="sc121-unit">{t ? "t" : "kg"}</span></span>;
  }

  // the period's one figure for a reading, with its working under it
  function Headline({ t, reading, period }) {
    const p = X.PERIODS.find(x => x.id === period);
    if (reading === "money") return <div className="sc121-head">
      <div className="sc121-fig"><Lakh value={t.net} /><span className="sc121-what">recovered</span></div>
      <p className="sc121-working">From {t.batches} {t.batches === 1 ? "batch" : "batches"} that would have cost {fmt.lakh(t.writeOff)} to destroy: <b>{fmt.lakh(t.swing)}</b> better than the bin, after {fmt.lakh(t.support)} of price support to the distributors{t.credit ? ` and ${fmt.inr(t.credit)} of expiry credit` : ""}.</p>
    </div>;
    if (reading === "gst") return <div className="sc121-head">
      <div className="sc121-fig"><Money value={t.itcKept} size="l" roll /><span className="sc121-what">of input credit kept</span></div>
      <p className="sc121-working">Sold under tax invoices, so the credit stands. <b>{fmt.inr(t.itcReversed)}</b> reversed under s.17(5)(h) on packs destroyed or given away (GSTR-3B Table 4(B)(1)). {t.invoices} distributors' invoices, {t.creditNotes} credit notes, every pack reviewed.</p>
    </div>;
    return <div className="sc121-head">
      <div className="sc121-fig"><Kilos value={t.kg} /><span className="sc121-what">kept out of landfill</span></div>
      <p className="sc121-working">{kg(t.resoldKg)} resold and {kg(t.donatedKg)} donated, {fmt.num(t.meals)} meals. <b>{kg(t.destroyedKg)}</b> destroyed when it expired at the godown. {kg(t.co2)} CO₂e avoided, indicative. {p.long}.</p>
    </div>;
  }

  /* ---------- a batch's own page ---------- */
  const TABS = [{ id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "impact", label: "Impact", icon: "leaf" }];
  const FIRST = { finance: "papers", sustainability: "impact" };
  const Row = ({ k, sub, v, tone, strong }) => <div className={cx("sc121-line", strong && "strong")}><span>{k}{sub && <em> {sub}</em>}</span><span className={cx("tnum", tone)}>{v}</span></div>;

  function MoneyTab({ b }) {
    const s = b.sku, r = b.realised, wo = b.plan.writeOff, lines = r.lines.filter(l => l.id !== "writeoff" && l.units > 0);
    const priceOf = l => (l.id === "expiresoon" && b.price ? b.price : l.price);
    const rev = l => (l.id === "expiresoon" && b.price ? r2(l.units * b.price) : l.gross);
    return <Columns sideWidth={380}
      main={<div className="stack" style={{ gap: 16 }}>
        <Card className="stack snug">
          <div className="card-head"><span className="card-title">What happened</span><OutcomeBadge o={b.outcome} size="sm" /></div>
          {lines.map(l => <Row key={l.id} k={`${fmt.num(l.units)} → ${l.short}`} sub={l.id === "kirana" && b.kirana && b.kirana.ordered < b.kirana.planned ? `ordered of ${fmt.num(b.kirana.planned)} offered` : l.id === "foodbank" ? b.partner.name : `at ${fmt.rate ? fmt.rate(priceOf(l)) : "₹" + priceOf(l)}`} v={l.id === "foodbank" ? "given" : fmt.inr(rev(l))} />)}
          <Row k="Van, listing fee and handling" v={fmt.inr(-r.costs)} tone="neg" />
          {r.itcLoss ? <Row k="Input credit given away with the donation" sub="s.17(5)(h)" v={fmt.inr(-r.itcLoss)} tone="neg" /> : null}
          <Row k="Recovered" v={fmt.inr(b.ledger.net)} strong />
          {b.realised.godown ? <div className="sc121-note"><Icon name="warehouse" size={16} /><span>{fmt.num(b.realised.godown)} packs no channel took expired at {b.dist.godown}. They came back to Munchly for full credit ({fmt.inr(b.expiry.credit)}) and Munchly destroyed them: disposal, EPR and {inr2(b.expiry.itc)} of credit reversed.</span></div> : null}
        </Card>
        <Card className="stack snug">
          <div className="card-head"><span className="card-title">If it had been destroyed</span><Badge size="sm" tone="red" icon="trash-2">write-off</Badge></div>
          <Row k="Stock at cost" sub={`${fmt.num(wo.units)} × ₹${s.cost}`} v={fmt.inr(-wo.stock)} tone="neg" />
          <Row k="Input credit reversed" sub={`s.17(5)(h) · ₹${wo.itcPerUnit} a pack`} v={fmt.inr(-wo.itc)} tone="neg" />
          <Row k="Disposal and EPR" sub="indicative" v={fmt.inr(-(wo.disposal + wo.epr))} tone="neg" />
          <Row k="Effect on the P&L" v={fmt.inr(-wo.total)} tone="neg" strong />
        </Card>
      </div>}
      side={<div className="stack" style={{ gap: 16 }}>
        <Card className="stack tight" style={{ gap: 6 }}><span className="t-footnote subtle">Better than destroying it</span><Money value={b.ledger.swing} size="m" tone="pos" /><span className="t-footnote muted">P&L {fmt.inr(b.ledger.pnl)} instead of {fmt.inr(-wo.total)}.</span></Card>
        <List head="Munchly's side">
          <ListRow icon="hand-coins" title={`Price support to ${b.dist.short}`} sub={b.numbers.support} value={fmt.inr(b.support.total)} />
          {b.expiry ? <ListRow icon="warehouse" title="Expiry credit" sub={`${b.numbers.expiry} · ${fmt.num(b.expiry.units)} packs`} value={fmt.inr(b.expiry.credit)} /> : null}
          {b.award ? <ListRow icon="receipt" title={`${b.dist.short}'s invoice to ${D.BUYER.short}`} sub={b.numbers.invoice} value={fmt.inr(b.docs.find(d => d.id === "invoice").total)} /> : null}
        </List>
      </div>} />;
  }

  function PapersTab({ b }) {
    const [sel, setSel] = useState(null); const app = useApp();
    const r = b.realised, away = r.donated + r.destroyed;
    return <div className="stack" style={{ gap: 16 }}>
      <Card className="stack snug">
        <div className="card-head"><span className="card-title">GST on this batch</span><Badge size="sm" tone="green" icon="check">reviewed · {day(b.reviewed.on)}</Badge></div>
        <div className="sc121-gst">
          <div><span className="t-footnote subtle">Input credit kept</span><Money value={b.ledger.itcKept} size="s" decimals /><span className="t-footnote muted">{fmt.num(r.soldUnits)} packs sold under tax invoices × ₹{b.sku.itcPerUnit}</span></div>
          <div><span className="t-footnote subtle">Reversed, s.17(5)(h)</span><Money value={b.ledger.itcReversed} size="s" decimals tone={b.ledger.itcReversed ? "neg" : undefined} /><span className="t-footnote muted">{away ? `${fmt.num(away)} packs ${r.donated && r.destroyed ? "donated or destroyed" : r.donated ? "donated" : "destroyed"} · GSTR-3B Table 4(B)(1)` : "Nothing destroyed or given away"}</span></div>
          <div><span className="t-footnote subtle">Credit notes</span><span className="num s">{1 + (b.expiry ? 1 : 0)}</span><span className="t-footnote muted">financial, no GST adjustment</span></div>
        </div>
      </Card>
      <SectionTitle sub="Each paper generated, issued or not required, with its number">Document pack</SectionTitle>
      <div className="docgrid">{b.docs.map(d => <DocCard key={d.id} doc={d} onOpen={() => setSel(d.id)} />)}</div>
      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? b.docs.find(d => d.id === sel).type : ""}>{sel ? <PaperSummary d={b.docs.find(x => x.id === sel)} b={b} /> : null}</Sheet>
    </div>;
  }
  function PaperSummary({ d, b }) {
    return <div className="paper pp"><div className="pp-head"><div><div className="pp-title">{d.type}</div><div className="pp-no">{d.no} · {d.owner}</div></div><span className="pp-stamp ok">{d.status}</span></div>
      {d.id === "itc" ? <><Row k="Packs sold under tax invoices" v={fmt.num(b.realised.soldUnits)} /><Row k="Packs donated or destroyed" v={fmt.num(b.realised.donated + b.realised.destroyed)} /><Row k="Input credit kept" v={inr2(d.amount)} strong /><Row k="Reversed in GSTR-3B, Table 4(B)(1)" v={inr2(d.reversed || 0)} /></> : d.amount ? <Row k="Amount" v={inr2(d.amount)} strong /> : <p className="pp-note">{d.note || "Nothing to file."}</p>}
    </div>;
  }

  function ImpactTab({ b }) {
    const L = b.ledger;
    const ev = [b.numbers.invoice, b.numbers.listing, b.kirana ? `${fmt.num(b.kirana.ordered)} packets of kirana orders` : null, b.numbers.support, b.numbers.expiry, b.numbers.receipt, L.donated ? "FSSAI checklist" : null, b.realised.destroyed ? "destruction certificate" : null].filter(Boolean);
    return <Columns sideWidth={380}
      main={<div className="stack" style={{ gap: 16 }}>
        <Card className="stack snug"><div className="card-head"><span className="card-title">BRSR line</span><Badge size="sm" tone="green" icon="check">posted · {day(b.cleared)}</Badge></div>
          <div className="sc121-brsr mono">{kg(L.kg)} diverted from disposal ({kg(L.resoldKg)} resold{L.donatedKg ? `, ${kg(L.donatedKg)} donated` : ""}) · {kg(L.destroyedKg)} destroyed · {kg(L.co2)} CO₂e avoided (indicative) · {L.meals ? `${fmt.num(L.meals)} meals` : "0 meals (nothing donated)"}</div>
          <span className="t-footnote subtle">Evidence: {ev.join(" · ")}</span></Card>
        <List head="Where the kilos went">
          <ListRow icon="store" title="Resold" sub="kiranas, ExpireSoon and staff" value={kg(L.resoldKg)} />
          <ListRow icon="heart-handshake" title="Donated" sub={b.partner ? b.partner.name : "nothing donated"} value={kg(L.donatedKg)} />
          <ListRow icon="trash-2" title="Destroyed" sub={L.destroyedKg ? "expired at the godown" : "nothing destroyed"} value={kg(L.destroyedKg)} />
        </List>
      </div>}
      side={<Card className="stack tight" style={{ gap: 6 }}><span className="t-footnote subtle">Kept out of landfill</span><span className="num m">{kg(L.kg)}</span><span className="t-footnote muted">{kg(L.co2)} CO₂e avoided at {M.RULES.co2PerKg} kg a kg, indicative{L.meals ? ` · ${fmt.num(L.meals)} meals by ${b.partner.name}'s rule` : ""}.</span></Card>} />;
  }

  function BatchPage({ me, b, back, onBack }) {
    const app = useApp(); const phone = app.bp === "phone"; const [tab, setTab] = useState(FIRST[me.role] || "money");
    const head = <div className="bhead">
      <div className="bh-id"><span className="bh-pic" aria-hidden="true"><Product name={b.sku.img} size={phone ? 46 : 72} /></span>
        <div className="bh-tt"><h1>{b.sku.name}</h1>
          <div className="bh-meta"><span className="mono">{b.ref}</span><span className="sep" aria-hidden="true">·</span><span>{b.dist.name}, {b.dist.city}</span></div>
          <div className="bh-meta"><OutcomeBadge o={b.outcome} /><span>Flagged {day(b.flagged)} · cleared {day(b.cleared)}</span></div></div></div>
      <nav className="bh-tabs" aria-label={`${b.sku.name}, ${b.ref}`}>{TABS.map(t => <button key={t.id} type="button" className="bh-tab" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>{tab === t.id && <motion.span layoutId="sc121-tab" className="bh-tab-thumb" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}{!phone && <Icon name={t.icon} size={16} />}<span>{t.label}</span></button>)}</nav>
    </div>;
    return <Screen me={me} title={b.sku.name} back={back} hideLarge below={head}>
      <AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
        {tab === "money" ? <MoneyTab b={b} /> : tab === "papers" ? <PapersTab b={b} /> : <ImpactTab b={b} />}
      </motion.div></AnimatePresence>
    </Screen>;
  }

  // the route: the period's home, or a batch's page when the address names one
  function useBatchOf() { const { route } = useRoute(); const ref = route && route.params && route.params.ref; return ref ? X.batches.find(b => b.ref === ref) || null : null; }

  window.SC121K = { OutcomeBadge, PeriodSwitch, ReadingSwitch, READINGS, valueOf, Headline, Lakh, Kilos, BatchPage, useBatchOf, day, month, kg, inr2 };
})();

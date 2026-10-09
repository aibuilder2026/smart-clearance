// SC-121 option A · One ledger. Finance and ESG share one page, the ledger: the period, a reading (Money, GST,
// Impact), the period's one figure with its working, the period drawn as its batches, and the batches by month. Every
// row is a batch; it opens the batch's own page (Money, Papers, Impact). Anita opens on the GST reading, Vikram on
// Impact. The Paperwork screen becomes the batch's Papers tab.
(function () {
  const { useState, useMemo } = React;
  const { motion, useReducedMotion } = Motion;
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, X = window.SC121, Z = window.SC121K;
  const { cx, Icon, Badge, Card, List, ListRow, Product, Money, useApp } = K;
  const { useRoute, Screen } = S;
  const fmt = M.fmt;

  const START = { finance: "gst", sustainability: "impact" };
  const figure = (b, reading) => (reading === "money" ? fmt.inr(b.ledger.net) : reading === "gst" ? fmt.inr(b.ledger.itcKept) : Z.kg(b.ledger.kg));
  const second = (b, reading) => {
    const L = b.ledger;
    if (reading === "money") return `of ${fmt.inr(L.writeOff)} if destroyed`;
    if (reading === "gst") return L.itcReversed ? `${fmt.inr(L.itcReversed)} reversed` : "nothing reversed";
    return L.meals ? `${fmt.num(L.meals)} meals` : L.destroyedKg ? `${Z.kg(L.destroyedKg)} destroyed` : `${Z.kg(L.co2)} CO₂e`;
  };
  // the share of a batch's segment that went to the bin, drawn hatched: the packs destroyed, or the credit reversed
  const binShare = (b, reading) => {
    const L = b.ledger;
    if (reading === "gst") return L.itcReversed / (L.itcKept + L.itcReversed || 1);
    if (reading === "impact") return L.destroyedKg / (L.kg + L.destroyedKg || 1);
    return b.realised ? b.realised.destroyed / b.plan.units : 0;
  };

  // the period as its batches: one segment a batch, in the order they cleared, as wide as its figure in the reading
  function Strip({ list, reading, onOpen }) {
    const reduce = useReducedMotion(); const app = useApp();
    const months = []; list.forEach((b, i) => { const m = b.cleared.slice(0, 7); if (!months.length || months[months.length - 1].m !== m) months.push({ m, i, label: Z.month(b.cleared) }); });
    const total = list.reduce((t, b) => t + Z.valueOf(b, reading), 0) || 1;
    let at = 0; const starts = list.map(b => { const s = at; at += Z.valueOf(b, reading); return s / total; });
    return <div className="sc121-stripwrap">
      <div className="sc121-strip" role="list" aria-label="The period's batches, each as wide as its figure">
        {list.map((b, i) => { const share = binShare(b, reading);
          return <motion.button key={b.ref + reading} type="button" role="listitem" className={cx("sc121-seg", b.outcome)} style={{ flexGrow: Math.max(Z.valueOf(b, reading), total * 0.012) }} onClick={() => onOpen(b)}
            initial={reduce ? false : { scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.42, delay: reduce ? 0 : i * 0.035, ease: [0.22, 1, 0.36, 1] }}
            aria-label={`${b.sku.name}, ${b.ref}: ${figure(b, reading)}, ${X.OUTCOME[b.outcome].label}`} title={`${b.sku.name} · ${figure(b, reading)}`}>
            {share > 0.004 && <i className="sc121-bin" style={{ width: Math.max(4, share * 100) + "%" }} aria-hidden="true" />}
            {app.bp !== "phone" && <span className="sc121-seglabel" aria-hidden="true">{b.sku.name.split(" ")[0]}</span>}
          </motion.button>; })}
      </div>
      <div className="sc121-ticks" aria-hidden="true">{months.map(m => <span key={m.m} style={{ left: starts[m.i] * 100 + "%" }}>{m.label}</span>)}</div>
      <div className="sc121-legend"><span><i className="sold" />Sold through</span><span><i className="leftover" />Left at the godown</span><span><i className="donation" />Donated</span><span><i className="bin" />{reading === "gst" ? "Credit reversed" : reading === "impact" ? "Destroyed" : "Packs destroyed"}</span></div>
    </div>;
  }

  function Ledger({ me }) {
    const app = useApp(); const phone = app.bp === "phone"; const { go } = useRoute();
    const [period, setPeriod] = useState("ytd"); const [reading, setReading] = useState(START[me.role] || "money");
    const list = useMemo(() => X.inPeriod(period).slice().sort((a, b) => (a.cleared < b.cleared ? -1 : 1)), [period]);
    const t = X.totals(list);
    const open = b => go({ name: "report", params: { ref: b.ref } });
    const byMonth = []; list.slice().reverse().forEach(b => { const m = b.cleared.slice(0, 7); const g = byMonth.find(x => x.m === m) || (byMonth.push({ m, label: Z.month(b.cleared), items: [] }), byMonth[byMonth.length - 1]); g.items.push(b); });
    const flying = period !== "q2" ? X.inFlight : [];
    return <Screen me={me} title="Ledger" sub="One ledger, two readings · every batch Munchly has cleared since 1 Jul">
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap between" style={{ gap: 12 }}><Z.PeriodSwitch value={period} onChange={setPeriod} /><Z.ReadingSwitch value={reading} onChange={setReading} /></div>
        <Card className="stack" style={{ gap: 18 }}>
          <Z.Headline t={t} reading={reading} period={period} />
          <Strip list={list} reading={reading} onOpen={open} />
        </Card>
        {flying.length ? <List head="Still out">{flying.map(b => <ListRow key={b.ref} leading={<Product name={b.sku.img} size={40} />} title={b.sku.name} sub={`${b.ref} · ${b.dist.short} · ${b.note}`} value={<Badge tone="blue" dot live>{b.stage}</Badge>} />)}</List> : null}
        {byMonth.map(g => <List key={g.m} head={`${g.label} · ${g.items.length} ${g.items.length === 1 ? "batch" : "batches"} · ${reading === "impact" ? Z.kg(g.items.reduce((s, b) => s + b.ledger.kg, 0)) : fmt.inr(g.items.reduce((s, b) => s + (reading === "gst" ? b.ledger.itcKept : b.ledger.net), 0))}`}>
          {g.items.map(b => <ListRow key={b.ref} chevron onClick={() => open(b)} leading={<Product name={b.sku.img} size={40} />}
            title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{b.sku.name}</span>{!phone && <Z.OutcomeBadge o={b.outcome} size="sm" />}</span>}
            sub={`${b.ref} · ${b.dist.short} · cleared ${Z.day(b.cleared)}`}
            value={<span className="sc121-val"><b className="tnum">{figure(b, reading)}</b><em>{second(b, reading)}</em></span>} />)}
        </List>)}
        <p className="t-footnote subtle">Every figure is the batch's posted ledger, as money.js works it out. CO₂e, disposal and EPR are indicative. The companies and people are fictional.</p>
      </div>
    </Screen>;
  }

  function Report({ me }) { const b = Z.useBatchOf(); return b ? <Z.BatchPage me={me} b={b} back="Ledger" /> : <Ledger me={me} />; }

  Object.assign(S, { Report });
  S.NAV.finance = [{ id: "report", label: "Ledger", icon: "book-open" }, { id: "batches", label: "Batches", icon: "boxes" }];
  S.NAV.sustainability = S.NAV.finance;
  S.HOME.finance = S.HOME.sustainability = "report";
})();

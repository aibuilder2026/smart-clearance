// SC-157 option B · The Impact reading, grown. No new page: the Ledger's Impact reading (SC-121) becomes the dashboard.
// The headline and its working stay; under them, food by week, where the kilos went and by distributor; then the
// period's batches and the months, as the Ledger has them. Money and GST read as before. (The mockup opens on Impact;
// Money and GST open the Ledger as it is today.)
(function () {
  const { useState, useMemo } = React;
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, D = window.SC3_DATA, X = window.SC157; const fmt = M.fmt;
  const { Card, List, ListRow, Badge, Button, Product, Segmented, useApp } = K; const { Screen } = S; const LG = () => window.SC3_LEDGER;
  const READINGS = [{ id: "money", label: "Money", icon: "coins" }, { id: "gst", label: "GST", icon: "badge-check" }, { id: "impact", label: "Impact", icon: "leaf" }];
  const Orig = S.Report;
  const dayOf = iso => fmt.day(iso);
  function LedgerImpact({ me, onReading }) {
    const s = S.useStore(); const app = useApp(); const phone = app.bp === "phone"; const { go } = S.useRoute(); const { toast } = K.useNotice();
    const book = useMemo(() => LG().ledger(s), [s.hero.posted, s.hero.phase, s.mango.phase]);
    const year = book.periods.find(x => x.kind === "year" && x.current) || book.periods[book.periods.length - 1];
    const [pid, setPid] = useState(year.id); const d = X.derive(book, pid); const t = d.t;
    const list = d.rows; const flying = d.p.current ? book.inFlight : [];
    const months = d.p.months.slice().reverse().map(m => ({ ...m, items: list.filter(r => r.cleared.slice(0, 7) === m.month).reverse() }));
    const open = r => go("report", { ref: r.ref });
    const exports = <Button variant="secondary" size="sm" icon="download" onClick={() => { X.exportBrsr(d); toast({ text: "BRSR table exported as CSV", tone: "ok" }); }}>Export</Button>;
    return <Screen me={me} title="Ledger" sub={`One ledger, three readings · every batch ${D.WORKSPACE.short} has cleared since ${book.since}`} actions={!phone && exports}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap between" style={{ gap: 12 }}><Segmented label="Period" value={d.p.id} onChange={setPid} options={X.periodOptions(book)} /><span className="row tight wrap" style={{ gap: 12 }}><Segmented label="Reading" value="impact" onChange={onReading} options={READINGS} />{phone && exports}</span></div>
        <Card className="stack" style={{ gap: 18 }}>
          <div className="lg-head">
            <div className="lg-fig"><span className="num l"><span className="sr-only">{X.kg(t.kg)}</span><K.Roll value={t.kg >= 1000 ? t.kg / 1000 : t.kg} format={v => (t.kg >= 1000 ? v.toFixed(2) : Math.round(v).toLocaleString("en-IN"))} hidden /><span aria-hidden="true" className="lg-unit">{t.kg >= 1000 ? "t" : "kg"}</span></span><span className="lg-what">kept out of landfill</span></div>
            <p className="lg-working">{X.kg(t.resoldKg)} resold and {X.kg(t.donatedKg)} donated, {fmt.num(t.meals)} meals. <b>{X.kg(t.destroyedKg)}</b> destroyed when it expired at the godown. {X.kg(t.co2)} CO₂e avoided, indicative. {d.p.long}.{d.tPrev ? ` ${X.delta(t.kg, d.tPrev.kg) > 0 ? "+" : ""}${X.delta(t.kg, d.tPrev.kg)}% on ${d.prev.label}.` : ""}</p>
          </div>
          <X.Tiles d={d} compact />
          <X.FoodCard d={d} height={phone ? 200 : 220} />
        </Card>
        <div className="im-grid two"><X.MixCard d={d} /><X.ByCard d={d} /></div>
        {flying.length ? <List head="Still out">{flying.map(b => <ListRow key={b.ref} leading={<Product name={b.img} size={40} />} title={b.name} sub={`${b.ref} · ${b.distributorName} · flagged ${dayOf(b.flagged)}`} value={<Badge tone="blue" dot live>{(D.STAGES.find(x => x.id === b.stage) || { title: b.stage }).title}</Badge>} />)}</List> : null}
        {months.map(g => <List key={g.month} head={`${g.label} · ${g.totals.batches} ${g.totals.batches === 1 ? "batch" : "batches"} · ${X.kg(g.totals.kg)}`}>
          {g.items.map(r => <ListRow key={r.ref} chevron onClick={() => open(r)} leading={<Product name={r.img} size={40} />}
            title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{r.name}</span>{!phone && <S.OutcomeBadge o={r.outcome} size="sm" />}</span>}
            sub={`${r.ref} · ${r.distributorName} · cleared ${dayOf(r.cleared)}`}
            value={<span className="lg-val"><b className="tnum">{X.kg(r.figures.kg)}</b><em>{r.figures.meals ? `${fmt.num(r.figures.meals)} meals` : r.figures.destroyedKg ? `${X.kg(r.figures.destroyedKg)} destroyed` : `${X.kg(r.figures.co2)} CO₂e`}</em></span>} />)}
        </List>)}
        <p className="t-footnote subtle">Every figure is the batch's posted ledger, as money.js works it out. CO₂e, disposal and EPR are indicative. The companies and people are fictional.</p>
      </div>
    </Screen>;
  }
  function Report({ me, at }) {
    const { route } = S.useRoute(); const p = (route && route.params) || {}; const [reading, setReading] = useState("impact");
    if (p.ref || (at && at.ref) || reading !== "impact") return <Orig me={me} at={at} />;
    return <LedgerImpact me={me} onReading={setReading} />;
  }
  Object.assign(S, { Report });
})();

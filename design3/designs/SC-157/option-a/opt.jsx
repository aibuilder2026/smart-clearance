// SC-157 option A · Impact, its own page (recommended). Under Reports, beside the Ledger: the period against the one
// before (four tiles with their weeks as sparklines), food by week, where the kilos went, by distributor and by product,
// and BRSR Principle 6's row with its evidence and export. Every figure is the ledger's.
(function () {
  const { useState, useMemo } = React;
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, D = window.SC3_DATA, X = window.SC157;
  const { Button, Segmented, useApp } = K; const { Screen } = S; const LG = () => window.SC3_LEDGER;
  function Impact({ me }) {
    const s = S.useStore(); const app = useApp(); const phone = app.bp === "phone"; const { toast } = K.useNotice();
    const book = useMemo(() => LG().ledger(s), [s.hero.posted, s.hero.phase, s.mango.phase]);
    const year = book.periods.find(x => x.kind === "year" && x.current) || book.periods[book.periods.length - 1];
    const [pid, setPid] = useState(year.id); const d = X.derive(book, pid);
    const exportIt = () => { X.exportBrsr(d); toast({ text: "BRSR table exported as CSV", tone: "ok" }); };
    return <Screen me={me} title="Impact" sub={`Food kept out of landfill, and what it was worth · every batch ${D.WORKSPACE.short} has cleared since ${book.since}`} actions={!phone && <Button variant="secondary" size="sm" icon="download" onClick={exportIt}>Export</Button>}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap between" style={{ gap: 12 }}><Segmented label="Period" value={d.p.id} onChange={setPid} options={X.periodOptions(book)} /><span className="im-note">{d.p.long}{d.prev ? ` · against ${d.prev.label}` : ""}</span></div>
        <X.Tiles d={d} />
        <X.FoodCard d={d} height={phone ? 200 : 240} />
        <div className="im-grid two"><X.MixCard d={d} /><X.ByCard d={d} /></div>
        <X.BrsrCard d={d} onExport={exportIt} />
        <p className="t-footnote subtle">Every figure is a batch's posted ledger, as money.js works it out; the Ledger has each batch and its papers. CO₂e, disposal and EPR are indicative. The companies and people are fictional.</p>
      </div>
    </Screen>;
  }
  Object.assign(S, { Impact });
})();

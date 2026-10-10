// SC-157 option C · The flow. Impact as its own page, told as one picture: every kilo the Watcher flagged flows to the
// channel that took it, and on to kept out of landfill or destroyed; the ends carry the figures. Then food by week,
// and BRSR's row.
(function () {
  const { useState, useMemo } = React;
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, D = window.SC3_DATA, X = window.SC157;
  const { Card, Button, Segmented, useApp } = K; const { Screen } = S; const LG = () => window.SC3_LEDGER;
  function Impact({ me }) {
    const s = S.useStore(); const app = useApp(); const phone = app.bp === "phone"; const { toast } = K.useNotice();
    const book = useMemo(() => LG().ledger(s), [s.hero.posted, s.hero.phase, s.mango.phase]);
    const year = book.periods.find(x => x.kind === "year" && x.current) || book.periods[book.periods.length - 1];
    const [pid, setPid] = useState(year.id); const d = X.derive(book, pid);
    const exportIt = () => { X.exportBrsr(d); toast({ text: "BRSR table exported as CSV", tone: "ok" }); };
    return <Screen me={me} title="Impact" sub={`Where every kilo the Watcher flagged went · every batch ${D.WORKSPACE.short} has cleared since ${book.since}`} actions={!phone && <Button variant="secondary" size="sm" icon="download" onClick={exportIt}>Export</Button>}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap between" style={{ gap: 12 }}><Segmented label="Period" value={d.p.id} onChange={setPid} options={X.periodOptions(book)} /><span className="im-note">{d.p.long}{d.prev ? ` · against ${d.prev.label}` : ""}</span></div>
        <Card className="stack" style={{ gap: 16 }}>
          <div className="card-head"><span className="card-title">From the godown to where it went</span><span className="t-caption subtle">{d.t.batches} batches · {d.p.label}</span></div>
          {phone ? <X.MixCard d={d} /> : <X.Flow d={d} height={360} />}
          <X.Ends d={d} />
          <span className="im-note">Each ribbon is the kilos a channel took, from the batches' lines; destroyed is what no channel took, settled on your yes. Resold and donated kilos are kept out of landfill.</span>
        </Card>
        <X.FoodCard d={d} height={phone ? 200 : 220} />
        <X.BrsrCard d={d} onExport={exportIt} />
        <p className="t-footnote subtle">Every figure is a batch's posted ledger, as money.js works it out; the Ledger has each batch and its papers. CO₂e, disposal and EPR are indicative. The companies and people are fictional.</p>
      </div>
    </Screen>;
  }
  Object.assign(S, { Impact });
})();

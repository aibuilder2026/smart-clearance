// SC-149 option B · Recovered and written off: the card keeps the money and adds what was lost, in rupees: what closed
// batches recovered above the baseline, and what the packs they destroyed had cost hatched under it, on one scale. The
// first figure gives up its sparkline, which repeated the card, for the food: how much was saved and destroyed.
(function () {
  const F = window.SC149_FIG, M = window.SC3_MONEY, fmt = M.fmt, K = window.SC3;
  const { Icon } = K;
  function Tile({ d, days, change, kit }) {
    const f = d.food, share = F.pct(f.savedKg, f.destroyedKg);
    const foot = change == null ? `nothing in the ${days} days before` : <><span className={change >= 0 ? "up" : "warn"}><Icon name={change >= 0 ? "trending-up" : "trending-down"} size={14} />{change >= 1000 ? `${Math.round(d.recovered / d.recoveredBefore)}×` : `${Math.abs(change)}%`}</span> on the {days} days before</>;
    return <div className="cs-ov-kpi"><span className="k-label"><Icon name="indian-rupee" size={15} />Recovered, {days} days</span><span className="k-value"><kit.MoneyFig value={d.recovered} /></span><span className="k-foot">{foot}</span>
      <div className="sc149-split" role="img" aria-label={`Food: ${share}% saved, ${F.kg(f.destroyedKg)} destroyed`}><span className="bar" aria-hidden="true"><i className="saved" style={{ flex: f.savedKg || 1 }} /><i className="destroyed" style={{ flex: f.destroyedKg }} /></span>
        <span className="t" aria-hidden="true"><b>{share}%</b> of the food saved · {F.kg(f.destroyedKg)} destroyed</span></div></div>;
  }
  function Card({ d, days, setDays, phone, kit }) {
    const f = d.food, worst = d.byDay.reduce((a, x) => (x.writtenOff > a.writtenOff ? x : a), d.byDay[0]);
    const lines = x => [["Recovered", fmt.inr(x.recovered), "recovered"], ["Written off", x.writtenOff ? fmt.inr(x.writtenOff) : "none", "written"], ["Destroyed", x.destroyed ? `${F.kg(x.destroyedKg)} · ${x.destroyed.toLocaleString("en-IN")} packs` : "none"], ["Batches closed", x.closed]];
    return <F.Frame title="Recovered and written off, by day" sub="Every client · what closed batches recovered, and what the packs they destroyed had cost" days={days} setDays={setDays}
      big={<><span className="fig"><b><kit.MoneyFig value={d.recovered} /></b><span>recovered</span></span><span className="fig destroyed"><b><kit.MoneyFig value={f.writtenOff} /></b><span>written off · {F.kg(f.destroyedKg)} destroyed</span></span></>}
      legend={<F.Legend items={[{ id: "recovered", label: "Recovered" }, { id: "written", label: "Written off (packs destroyed, at cost)" }]} />}
      chart={{ rows: d.byDay, node: <F.Mirror byDay={d.byDay} height={phone ? 200 : 230} up="recovered" down="writtenOff" lines={lines}
        label={`Money a day, the last ${days} days: ${fmt.inr(d.recovered)} recovered and ${fmt.inr(f.writtenOff)} written off`} /> }}
      columns={[{ key: "label", label: "Day" }, { key: "recovered", label: "Recovered", num: true, render: x => fmt.inr(x.recovered) }, { key: "writtenOff", label: "Written off", num: true, render: x => (x.writtenOff ? fmt.inr(x.writtenOff) : "none") }, { key: "destroyedKg", label: "Destroyed", num: true, render: x => (x.destroyedKg ? F.kg(x.destroyedKg) : "none") }, { key: "closed", label: "Closed", num: true }]}
      foot={<>{worst && worst.writtenOff ? `Most written off ${fmt.inr(worst.writtenOff)} on ${worst.label}` : "Nothing written off in this range"}{f.writtenOffBefore ? ` · ${kit.lakh(f.writtenOffBefore)} the ${days} days before` : ""}</>} />;
  }
  window.SC149 = { Tile, Card };
})();

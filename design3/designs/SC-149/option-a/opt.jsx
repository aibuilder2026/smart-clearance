// SC-149 option A · Food, by day (recommended): the first figure stays the money, with its sparkline; the card below it
// stops repeating the money and shows the food instead: each day's kilos kept out of landfill rising from the baseline,
// and the kilos destroyed hanging under it, on one scale.
(function () {
  const F = window.SC149_FIG, M = window.SC3_MONEY, fmt = M.fmt;
  function Card({ d, days, setDays, phone }) {
    const f = d.food, share = F.pct(f.savedKg, f.destroyedKg), before = F.pct(f.savedKgBefore, f.destroyedKgBefore);
    const worst = d.byDay.reduce((a, x) => (x.destroyedKg > a.destroyedKg ? x : a), d.byDay[0]);
    const lines = x => [["Kept out of landfill", F.kg(x.savedKg), "saved"], ["Destroyed", x.destroyed ? `${F.kg(x.destroyedKg)} · ${x.destroyed.toLocaleString("en-IN")} packs` : "none", "destroyed"], ["Recovered", fmt.inr(x.recovered)], ["Batches closed", x.closed]];
    return <F.Frame title="Food, by day" sub="Every client · what closed batches kept out of landfill, and what they destroyed" days={days} setDays={setDays}
      big={<><span className="fig"><b>{F.kg(f.savedKg)}</b><span>kept out of landfill</span></span><span className="fig destroyed"><b>{F.kg(f.destroyedKg)}</b><span>destroyed</span></span><span className="sc149-share">{share}% of the food saved</span></>}
      legend={<F.Legend items={[{ id: "saved", label: "Kept out of landfill (sold or given)" }, { id: "destroyed", label: "Destroyed (no channel took it)" }]} />}
      chart={{ rows: d.byDay, node: <F.UpDown byDay={d.byDay} height={phone ? 200 : 230} up="savedKg" down="destroyedKg" axis={F.kgAxis} lines={lines}
        label={`Food a day, the last ${days} days: ${F.kg(f.savedKg)} kept out of landfill and ${F.kg(f.destroyedKg)} destroyed, ${share}% saved`} /> }}
      columns={[{ key: "label", label: "Day" }, { key: "savedKg", label: "Kept out", num: true, render: x => F.kg(x.savedKg) }, { key: "destroyedKg", label: "Destroyed", num: true, render: x => (x.destroyedKg ? F.kg(x.destroyedKg) : "none") }, { key: "destroyed", label: "Packs destroyed", num: true, render: x => x.destroyed.toLocaleString("en-IN") }, { key: "recovered", label: "Recovered", num: true, render: x => fmt.inr(x.recovered) }, { key: "closed", label: "Closed", num: true }]}
      foot={<>{worst && worst.destroyedKg ? `Most destroyed ${F.kg(worst.destroyedKg)} on ${worst.label}` : "Nothing destroyed in this range"}{f.savedKgBefore ? ` · ${before}% saved the ${days} days before` : ""}</>} />;
  }
  window.SC149 = { Card };
})();

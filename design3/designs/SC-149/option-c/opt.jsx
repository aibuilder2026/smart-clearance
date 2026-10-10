// SC-149 option C · Food, so far: the first figure stays the money, with its sparkline; the card below it shows the food
// as it adds up over the range: the kilos kept out of landfill as a band, the kilos destroyed stacked on it, each named
// where the range ends. The days' ups and downs are in the tooltip and the table.
(function () {
  const F = window.SC149_FIG, M = window.SC3_MONEY, fmt = M.fmt;
  function Card({ d, days, setDays, phone }) {
    const f = d.food, share = F.pct(f.savedKg, f.destroyedKg), before = F.pct(f.savedKgBefore, f.destroyedKgBefore);
    const lines = (x, r) => [["Kept out, so far", F.kg(r.saved), "saved"], ["Destroyed, so far", F.kg(r.destroyed), "destroyed"], ["That day", `${F.kg(x.savedKg)} kept · ${x.destroyedKg ? F.kg(x.destroyedKg) : "none"} destroyed`], ["Recovered that day", fmt.inr(x.recovered)]];
    return <F.Frame title="Food kept out of landfill" sub="Every client · what closed batches saved and destroyed, adding up over the range" days={days} setDays={setDays}
      big={<><span className="fig"><b>{F.kg(f.savedKg)}</b><span>kept out of landfill in {days} days</span></span><span className="sc149-share">{share}% saved</span><span className="fig destroyed"><b>{F.kg(f.destroyedKg)}</b><span>destroyed</span></span></>}
      legend={<F.Legend items={[{ id: "saved", label: "Kept out of landfill (sold or given)" }, { id: "destroyed", label: "Destroyed (no channel took it)" }]} />}
      chart={{ rows: d.byDay, node: <F.Running byDay={d.byDay} height={phone ? 200 : 230} lines={lines}
        label={`Food over the last ${days} days, adding up: ${F.kg(f.savedKg)} kept out of landfill and ${F.kg(f.destroyedKg)} destroyed, ${share}% saved`} /> }}
      columns={[{ key: "label", label: "Day" }, { key: "savedKg", label: "Kept out", num: true, render: x => F.kg(x.savedKg) }, { key: "destroyedKg", label: "Destroyed", num: true, render: x => (x.destroyedKg ? F.kg(x.destroyedKg) : "none") }, { key: "recovered", label: "Recovered", num: true, render: x => fmt.inr(x.recovered) }, { key: "closed", label: "Closed", num: true }]}
      foot={<>{f.savedKgBefore ? `${F.kg(f.savedKgBefore)} kept out and ${F.kg(f.destroyedKgBefore)} destroyed the ${days} days before (${before}% saved)` : "Nothing closed the days before"}</>} />;
  }
  window.SC149 = { Card };
})();

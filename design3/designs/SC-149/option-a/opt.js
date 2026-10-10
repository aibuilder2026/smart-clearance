(function() {
  const F = window.SC149_FIG, M = window.SC3_MONEY, fmt = M.fmt;
  function Card({ d, days, setDays, phone }) {
    const f = d.food, share = F.pct(f.savedKg, f.destroyedKg), before = F.pct(f.savedKgBefore, f.destroyedKgBefore);
    const worst = d.byDay.reduce((a, x) => x.destroyedKg > a.destroyedKg ? x : a, d.byDay[0]);
    const lines = (x) => [["Kept out of landfill", F.kg(x.savedKg), "saved"], ["Destroyed", x.destroyed ? `${F.kg(x.destroyedKg)} · ${x.destroyed.toLocaleString("en-IN")} packs` : "none", "destroyed"], ["Recovered", fmt.inr(x.recovered)], ["Batches closed", x.closed]];
    return /* @__PURE__ */ React.createElement(
      F.Frame,
      {
        title: "Food, by day",
        sub: "Every client · what closed batches kept out of landfill, and what they destroyed",
        days,
        setDays,
        big: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "fig" }, /* @__PURE__ */ React.createElement("b", null, F.kg(f.savedKg)), /* @__PURE__ */ React.createElement("span", null, "kept out of landfill")), /* @__PURE__ */ React.createElement("span", { className: "fig destroyed" }, /* @__PURE__ */ React.createElement("b", null, F.kg(f.destroyedKg)), /* @__PURE__ */ React.createElement("span", null, "destroyed")), /* @__PURE__ */ React.createElement("span", { className: "sc149-share" }, share, "% of the food saved")),
        legend: /* @__PURE__ */ React.createElement(F.Legend, { items: [{ id: "saved", label: "Kept out of landfill (sold or given)" }, { id: "destroyed", label: "Destroyed (no channel took it)" }] }),
        chart: { rows: d.byDay, node: /* @__PURE__ */ React.createElement(
          F.UpDown,
          {
            byDay: d.byDay,
            height: phone ? 200 : 230,
            up: "savedKg",
            down: "destroyedKg",
            axis: F.kgAxis,
            lines,
            label: `Food a day, the last ${days} days: ${F.kg(f.savedKg)} kept out of landfill and ${F.kg(f.destroyedKg)} destroyed, ${share}% saved`
          }
        ) },
        columns: [{ key: "label", label: "Day" }, { key: "savedKg", label: "Kept out", num: true, render: (x) => F.kg(x.savedKg) }, { key: "destroyedKg", label: "Destroyed", num: true, render: (x) => x.destroyedKg ? F.kg(x.destroyedKg) : "none" }, { key: "destroyed", label: "Packs destroyed", num: true, render: (x) => x.destroyed.toLocaleString("en-IN") }, { key: "recovered", label: "Recovered", num: true, render: (x) => fmt.inr(x.recovered) }, { key: "closed", label: "Closed", num: true }],
        foot: /* @__PURE__ */ React.createElement(React.Fragment, null, worst && worst.destroyedKg ? `Most destroyed ${F.kg(worst.destroyedKg)} on ${worst.label}` : "Nothing destroyed in this range", f.savedKgBefore ? ` · ${before}% saved the ${days} days before` : "")
      }
    );
  }
  window.SC149 = { Card };
})();

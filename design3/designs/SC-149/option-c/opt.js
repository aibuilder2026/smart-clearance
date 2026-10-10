(function() {
  const F = window.SC149_FIG, M = window.SC3_MONEY, fmt = M.fmt;
  function Card({ d, days, setDays, phone }) {
    const f = d.food, share = F.pct(f.savedKg, f.destroyedKg), before = F.pct(f.savedKgBefore, f.destroyedKgBefore);
    const lines = (x, r) => [["Kept out, so far", F.kg(r.saved), "saved"], ["Destroyed, so far", F.kg(r.destroyed), "destroyed"], ["That day", `${F.kg(x.savedKg)} kept · ${x.destroyedKg ? F.kg(x.destroyedKg) : "none"} destroyed`], ["Recovered that day", fmt.inr(x.recovered)]];
    return /* @__PURE__ */ React.createElement(
      F.Frame,
      {
        title: "Food kept out of landfill",
        sub: "Every client · what closed batches saved and destroyed, adding up over the range",
        days,
        setDays,
        big: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "fig" }, /* @__PURE__ */ React.createElement("b", null, F.kg(f.savedKg)), /* @__PURE__ */ React.createElement("span", null, "kept out of landfill in ", days, " days")), /* @__PURE__ */ React.createElement("span", { className: "sc149-share" }, share, "% saved"), /* @__PURE__ */ React.createElement("span", { className: "fig destroyed" }, /* @__PURE__ */ React.createElement("b", null, F.kg(f.destroyedKg)), /* @__PURE__ */ React.createElement("span", null, "destroyed"))),
        legend: /* @__PURE__ */ React.createElement(F.Legend, { items: [{ id: "saved", label: "Kept out of landfill (sold or given)" }, { id: "destroyed", label: "Destroyed (no channel took it)" }] }),
        chart: { rows: d.byDay, node: /* @__PURE__ */ React.createElement(
          F.Running,
          {
            byDay: d.byDay,
            height: phone ? 200 : 230,
            lines,
            label: `Food over the last ${days} days, adding up: ${F.kg(f.savedKg)} kept out of landfill and ${F.kg(f.destroyedKg)} destroyed, ${share}% saved`
          }
        ) },
        columns: [{ key: "label", label: "Day" }, { key: "savedKg", label: "Kept out", num: true, render: (x) => F.kg(x.savedKg) }, { key: "destroyedKg", label: "Destroyed", num: true, render: (x) => x.destroyedKg ? F.kg(x.destroyedKg) : "none" }, { key: "recovered", label: "Recovered", num: true, render: (x) => fmt.inr(x.recovered) }, { key: "closed", label: "Closed", num: true }],
        foot: /* @__PURE__ */ React.createElement(React.Fragment, null, f.savedKgBefore ? `${F.kg(f.savedKgBefore)} kept out and ${F.kg(f.destroyedKgBefore)} destroyed the ${days} days before (${before}% saved)` : "Nothing closed the days before")
      }
    );
  }
  window.SC149 = { Card };
})();

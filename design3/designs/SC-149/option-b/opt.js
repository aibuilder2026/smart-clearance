(function() {
  const F = window.SC149_FIG, M = window.SC3_MONEY, fmt = M.fmt, K = window.SC3;
  const { Icon } = K;
  function Tile({ d, days, change, kit }) {
    const f = d.food, share = F.pct(f.savedKg, f.destroyedKg);
    const foot = change == null ? `nothing in the ${days} days before` : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: change >= 0 ? "up" : "warn" }, /* @__PURE__ */ React.createElement(Icon, { name: change >= 0 ? "trending-up" : "trending-down", size: 14 }), change >= 1e3 ? `${Math.round(d.recovered / d.recoveredBefore)}×` : `${Math.abs(change)}%`), " on the ", days, " days before");
    return /* @__PURE__ */ React.createElement("div", { className: "cs-ov-kpi" }, /* @__PURE__ */ React.createElement("span", { className: "k-label" }, /* @__PURE__ */ React.createElement(Icon, { name: "indian-rupee", size: 15 }), "Recovered, ", days, " days"), /* @__PURE__ */ React.createElement("span", { className: "k-value" }, /* @__PURE__ */ React.createElement(kit.MoneyFig, { value: d.recovered })), /* @__PURE__ */ React.createElement("span", { className: "k-foot" }, foot), /* @__PURE__ */ React.createElement("div", { className: "sc149-split", role: "img", "aria-label": `Food: ${share}% saved, ${F.kg(f.destroyedKg)} destroyed` }, /* @__PURE__ */ React.createElement("span", { className: "bar", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", { className: "saved", style: { flex: f.savedKg || 1 } }), /* @__PURE__ */ React.createElement("i", { className: "destroyed", style: { flex: f.destroyedKg } })), /* @__PURE__ */ React.createElement("span", { className: "t", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("b", null, share, "%"), " of the food saved · ", F.kg(f.destroyedKg), " destroyed")));
  }
  function Card({ d, days, setDays, phone, kit }) {
    const f = d.food, worst = d.byDay.reduce((a, x) => x.writtenOff > a.writtenOff ? x : a, d.byDay[0]);
    const lines = (x) => [["Recovered", fmt.inr(x.recovered), "recovered"], ["Written off", x.writtenOff ? fmt.inr(x.writtenOff) : "none", "written"], ["Destroyed", x.destroyed ? `${F.kg(x.destroyedKg)} · ${x.destroyed.toLocaleString("en-IN")} packs` : "none"], ["Batches closed", x.closed]];
    return /* @__PURE__ */ React.createElement(
      F.Frame,
      {
        title: "Recovered and written off, by day",
        sub: "Every client · what closed batches recovered, and what the packs they destroyed had cost",
        days,
        setDays,
        big: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "fig" }, /* @__PURE__ */ React.createElement("b", null, /* @__PURE__ */ React.createElement(kit.MoneyFig, { value: d.recovered })), /* @__PURE__ */ React.createElement("span", null, "recovered")), /* @__PURE__ */ React.createElement("span", { className: "fig destroyed" }, /* @__PURE__ */ React.createElement("b", null, /* @__PURE__ */ React.createElement(kit.MoneyFig, { value: f.writtenOff })), /* @__PURE__ */ React.createElement("span", null, "written off · ", F.kg(f.destroyedKg), " destroyed"))),
        legend: /* @__PURE__ */ React.createElement(F.Legend, { items: [{ id: "recovered", label: "Recovered" }, { id: "written", label: "Written off (packs destroyed, at cost)" }] }),
        chart: { rows: d.byDay, node: /* @__PURE__ */ React.createElement(
          F.Mirror,
          {
            byDay: d.byDay,
            height: phone ? 200 : 230,
            up: "recovered",
            down: "writtenOff",
            lines,
            label: `Money a day, the last ${days} days: ${fmt.inr(d.recovered)} recovered and ${fmt.inr(f.writtenOff)} written off`
          }
        ) },
        columns: [{ key: "label", label: "Day" }, { key: "recovered", label: "Recovered", num: true, render: (x) => fmt.inr(x.recovered) }, { key: "writtenOff", label: "Written off", num: true, render: (x) => x.writtenOff ? fmt.inr(x.writtenOff) : "none" }, { key: "destroyedKg", label: "Destroyed", num: true, render: (x) => x.destroyedKg ? F.kg(x.destroyedKg) : "none" }, { key: "closed", label: "Closed", num: true }],
        foot: /* @__PURE__ */ React.createElement(React.Fragment, null, worst && worst.writtenOff ? `Most written off ${fmt.inr(worst.writtenOff)} on ${worst.label}` : "Nothing written off in this range", f.writtenOffBefore ? ` · ${kit.lakh(f.writtenOffBefore)} the ${days} days before` : "")
      }
    );
  }
  window.SC149 = { Tile, Card };
})();

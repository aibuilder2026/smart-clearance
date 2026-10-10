(function() {
  const { useState, useMemo } = React;
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, D = window.SC3_DATA, X = window.SC157;
  const fmt = M.fmt;
  const { Card, List, ListRow, Badge, Button, Product, Segmented, useApp } = K;
  const { Screen } = S;
  const LG = () => window.SC3_LEDGER;
  const READINGS = [{ id: "money", label: "Money", icon: "coins" }, { id: "gst", label: "GST", icon: "badge-check" }, { id: "impact", label: "Impact", icon: "leaf" }];
  const Orig = S.Report;
  const dayOf = (iso) => fmt.day(iso);
  function LedgerImpact({ me, onReading }) {
    const s = S.useStore();
    const app = useApp();
    const phone = app.bp === "phone";
    const { go } = S.useRoute();
    const { toast } = K.useNotice();
    const book = useMemo(() => LG().ledger(s), [s.hero.posted, s.hero.phase, s.mango.phase]);
    const year = book.periods.find((x) => x.kind === "year" && x.current) || book.periods[book.periods.length - 1];
    const [pid, setPid] = useState(year.id);
    const d = X.derive(book, pid);
    const t = d.t;
    const list = d.rows;
    const flying = d.p.current ? book.inFlight : [];
    const months = d.p.months.slice().reverse().map((m) => ({ ...m, items: list.filter((r) => r.cleared.slice(0, 7) === m.month).reverse() }));
    const open = (r) => go("report", { ref: r.ref });
    const exports = /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "download", onClick: () => {
      X.exportBrsr(d);
      toast({ text: "BRSR table exported as CSV", tone: "ok" });
    } }, "Export");
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Ledger", sub: `One ledger, three readings · every batch ${D.WORKSPACE.short} has cleared since ${book.since}`, actions: !phone && exports }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap between", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Segmented, { label: "Period", value: d.p.id, onChange: setPid, options: X.periodOptions(book) }), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Segmented, { label: "Reading", value: "impact", onChange: onReading, options: READINGS }), phone && exports)), /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-head" }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement("span", { className: "num l" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, X.kg(t.kg)), /* @__PURE__ */ React.createElement(K.Roll, { value: t.kg >= 1e3 ? t.kg / 1e3 : t.kg, format: (v) => t.kg >= 1e3 ? v.toFixed(2) : Math.round(v).toLocaleString("en-IN"), hidden: true }), /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true", className: "lg-unit" }, t.kg >= 1e3 ? "t" : "kg")), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "kept out of landfill")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, X.kg(t.resoldKg), " resold and ", X.kg(t.donatedKg), " donated, ", fmt.num(t.meals), " meals. ", /* @__PURE__ */ React.createElement("b", null, X.kg(t.destroyedKg)), " destroyed when it expired at the godown. ", X.kg(t.co2), " CO₂e avoided, indicative. ", d.p.long, ".", d.tPrev ? ` ${X.delta(t.kg, d.tPrev.kg) > 0 ? "+" : ""}${X.delta(t.kg, d.tPrev.kg)}% on ${d.prev.label}.` : "")), /* @__PURE__ */ React.createElement(X.Tiles, { d, compact: true }), /* @__PURE__ */ React.createElement(X.FoodCard, { d, height: phone ? 200 : 220 })), /* @__PURE__ */ React.createElement("div", { className: "im-grid two" }, /* @__PURE__ */ React.createElement(X.MixCard, { d }), /* @__PURE__ */ React.createElement(X.ByCard, { d })), flying.length ? /* @__PURE__ */ React.createElement(List, { head: "Still out" }, flying.map((b) => /* @__PURE__ */ React.createElement(ListRow, { key: b.ref, leading: /* @__PURE__ */ React.createElement(Product, { name: b.img, size: 40 }), title: b.name, sub: `${b.ref} · ${b.distributorName} · flagged ${dayOf(b.flagged)}`, value: /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true, live: true }, (D.STAGES.find((x) => x.id === b.stage) || { title: b.stage }).title) }))) : null, months.map((g) => /* @__PURE__ */ React.createElement(List, { key: g.month, head: `${g.label} · ${g.totals.batches} ${g.totals.batches === 1 ? "batch" : "batches"} · ${X.kg(g.totals.kg)}` }, g.items.map((r) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: r.ref,
        chevron: true,
        onClick: () => open(r),
        leading: /* @__PURE__ */ React.createElement(Product, { name: r.img, size: 40 }),
        title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, r.name), !phone && /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: r.outcome, size: "sm" })),
        sub: `${r.ref} · ${r.distributorName} · cleared ${dayOf(r.cleared)}`,
        value: /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, X.kg(r.figures.kg)), /* @__PURE__ */ React.createElement("em", null, r.figures.meals ? `${fmt.num(r.figures.meals)} meals` : r.figures.destroyedKg ? `${X.kg(r.figures.destroyedKg)} destroyed` : `${X.kg(r.figures.co2)} CO₂e`))
      }
    )))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle" }, "Every figure is the batch's posted ledger, as money.js works it out. CO₂e, disposal and EPR are indicative. The companies and people are fictional.")));
  }
  function Report({ me, at }) {
    const { route } = S.useRoute();
    const p = route && route.params || {};
    const [reading, setReading] = useState("impact");
    if (p.ref || at && at.ref || reading !== "impact") return /* @__PURE__ */ React.createElement(Orig, { me, at });
    return /* @__PURE__ */ React.createElement(LedgerImpact, { me, onReading: setReading });
  }
  Object.assign(S, { Report });
})();

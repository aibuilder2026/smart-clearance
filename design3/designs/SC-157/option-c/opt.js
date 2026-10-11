(function() {
  const { useState, useMemo } = React;
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, D = window.SC3_DATA, X = window.SC157;
  const { Card, Button, Segmented, useApp } = K;
  const { Screen } = S;
  const LG = () => window.SC3_LEDGER;
  function Impact({ me }) {
    const s = S.useStore();
    const app = useApp();
    const phone = app.bp === "phone";
    const { toast } = K.useNotice();
    const book = useMemo(() => LG().ledger(s), [s.hero.posted, s.hero.phase, s.mango.phase]);
    const year = book.periods.find((x) => x.kind === "year" && x.current) || book.periods[book.periods.length - 1];
    const [pid, setPid] = useState(year.id);
    const d = X.derive(book, pid);
    const exportIt = () => {
      X.exportBrsr(d);
      toast({ text: "BRSR table exported as CSV", tone: "ok" });
    };
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Impact", sub: `Where every kilo the Watcher flagged went · every batch ${D.WORKSPACE.short} has cleared since ${book.since}`, actions: !phone && /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "download", onClick: exportIt }, "Export") }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap between", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Segmented, { label: "Period", value: d.p.id, onChange: setPid, options: X.periodOptions(book) }), /* @__PURE__ */ React.createElement("span", { className: "im-note" }, d.p.long, d.prev ? ` · against ${d.prev.label}` : "")), /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "From the godown to where it went"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, d.t.batches, " batches · ", d.p.label)), phone ? /* @__PURE__ */ React.createElement(X.MixCard, { d }) : /* @__PURE__ */ React.createElement(X.Flow, { d, height: 360 }), /* @__PURE__ */ React.createElement(X.Ends, { d }), /* @__PURE__ */ React.createElement("span", { className: "im-note" }, "Each ribbon is the kilos a channel took, from the batches' lines; destroyed is what no channel took, settled on your yes. Resold and donated kilos are kept out of landfill.")), /* @__PURE__ */ React.createElement(X.FoodCard, { d, height: phone ? 200 : 220 }), /* @__PURE__ */ React.createElement(X.BrsrCard, { d, onExport: exportIt }), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle" }, "Every figure is a batch's posted ledger, as money.js works it out; the Ledger has each batch and its papers. CO₂e, disposal and EPR are indicative. The companies and people are fictional.")));
  }
  Object.assign(S, { Impact });
})();

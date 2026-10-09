(function() {
  const { useState, useMemo } = React;
  const { motion, useReducedMotion } = Motion;
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, X = window.SC121, Z = window.SC121K;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, Money, useApp } = K;
  const { useRoute, Screen, SectionTitle } = S;
  const fmt = M.fmt;
  const periodOf = (id) => X.PERIODS.find((p) => p.id === id);
  function CloseTrack({ list, open }) {
    const n = list.length, flying = open.length, all = n + flying;
    const stops = [
      { id: "drafted", label: "Papers drafted", done: n, of: all },
      { id: "issued", label: "Invoices issued", done: n, of: all },
      { id: "reviewed", label: "Reviewed", done: n, of: all },
      { id: "filed", label: "In the GST return", done: list.filter((b) => b.cleared <= "2026-09-30").length, of: all }
    ];
    return /* @__PURE__ */ React.createElement("div", { className: "sc121-close", role: "list", "aria-label": "The close" }, stops.map((s, i) => {
      const done = s.done === s.of && s.of > 0;
      const here = !done && (i === 0 || stops[i - 1].done === stops[i - 1].of);
      return /* @__PURE__ */ React.createElement("div", { key: s.id, role: "listitem", className: cx("sc121-stop", done && "done", here && "here") }, /* @__PURE__ */ React.createElement("span", { className: "sc121-dot" }, done ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.6 }) : /* @__PURE__ */ React.createElement("b", null, i + 1)), /* @__PURE__ */ React.createElement("b", null, s.label), /* @__PURE__ */ React.createElement("span", null, s.done, " of ", s.of));
    }));
  }
  function BatchCard({ b, onOpen }) {
    const L = b.ledger;
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "card interactive sc121-bcard", onClick: () => onOpen(b) }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: b.sku.img, size: 44 }), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "strong" }, b.sku.name), /* @__PURE__ */ React.createElement("div", { className: "t-caption subtle mono" }, b.ref, " · ", b.dist.short)), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "sc121-bfig" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("em", null, "Recovered"), /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(L.net))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("em", null, "Credit kept"), /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(L.itcKept))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("em", null, "Reversed"), /* @__PURE__ */ React.createElement("b", { className: cx("tnum", L.itcReversed && "neg") }, fmt.inr(L.itcReversed)))), /* @__PURE__ */ React.createElement("div", { className: "sc121-chips" }, /* @__PURE__ */ React.createElement(Z.OutcomeBadge, { o: b.outcome, size: "sm" }), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "reviewed"), b.numbers.invoice ? /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, b.numbers.invoice) : null, /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, b.numbers.support), b.numbers.expiry ? /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, b.numbers.expiry) : null));
  }
  function Close({ me }) {
    const { go } = useRoute();
    const [period, setPeriod] = useState("q2");
    const list = useMemo(() => X.inPeriod(period).slice().sort((a, b) => a.cleared < b.cleared ? 1 : -1), [period]);
    const t = X.totals(list), p = periodOf(period), flying = period !== "q2" ? X.inFlight : [];
    const open = (b) => go({ name: "report", params: { ref: b.ref } });
    const months = [];
    list.forEach((b) => {
      const m = b.cleared.slice(0, 7);
      (months.find((x) => x.m === m) || (months.push({ m, label: Z.month(b.cleared), items: [] }), months[months.length - 1])).items.push(b);
    });
    const invoices = list.flatMap((b) => b.docs.filter((d) => d.id === "invoice"));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: `${p.label} close`, sub: `${p.long} · ${t.batches} ${t.batches === 1 ? "batch" : "batches"} cleared` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement(Z.PeriodSwitch, { value: period, onChange: setPeriod })), /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Where the close stands"), flying.length ? /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true, live: true }, flying.length, " still out") : /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "closed")), /* @__PURE__ */ React.createElement(CloseTrack, { list, open: flying })), /* @__PURE__ */ React.createElement("div", { className: "sc121-cards", style: { gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Things to chase"), /* @__PURE__ */ React.createElement(Badge, { tone: flying.length ? "amber" : "green" }, flying.length)), flying.length ? flying.map((b) => /* @__PURE__ */ React.createElement("div", { key: b.ref, className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: b.sku.img, size: 36 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, b.sku.name), /* @__PURE__ */ React.createElement("div", { className: "t-footnote subtle" }, b.ref, " · ", b.note, ". Its papers follow the last of its lines.")))) : /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: 0 } }, "Nothing to chase. Every paper of the quarter is issued, reviewed and in the return.")), /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "For the GST return"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "GSTR-3B · ", p.label)), /* @__PURE__ */ React.createElement("div", { className: "sc121-return" }, /* @__PURE__ */ React.createElement("div", { className: "sc121-line" }, /* @__PURE__ */ React.createElement("span", null, "Input credit kept ", /* @__PURE__ */ React.createElement("em", null, "Table 4(A)(5)")), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr2(t.itcKept))), /* @__PURE__ */ React.createElement("div", { className: "sc121-line" }, /* @__PURE__ */ React.createElement("span", null, "Reversed, s.17(5)(h) ", /* @__PURE__ */ React.createElement("em", null, "Table 4(B)(1)")), /* @__PURE__ */ React.createElement("span", { className: "tnum neg" }, fmt.inr2(t.itcReversed))), /* @__PURE__ */ React.createElement("div", { className: "sc121-line" }, /* @__PURE__ */ React.createElement("span", null, "Credit notes issued ", /* @__PURE__ */ React.createElement("em", null, "financial, no GST")), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, t.creditNotes, " · ", fmt.inr(t.support + t.credit))), /* @__PURE__ */ React.createElement("div", { className: "sc121-line" }, /* @__PURE__ */ React.createElement("span", null, "Distributors' invoices ", /* @__PURE__ */ React.createElement("em", null, "IGST, for their GSTR-1")), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, invoices.length, " · ", fmt.inr(invoices.reduce((s, d) => s + d.igst, 0)), " tax"))))), months.map((g) => /* @__PURE__ */ React.createElement("div", { key: g.m, className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: `${g.items.length} ${g.items.length === 1 ? "batch" : "batches"} · ${fmt.inr(g.items.reduce((s, b) => s + b.ledger.net, 0))} recovered` }, g.label), /* @__PURE__ */ React.createElement("div", { className: "sc121-cards" }, g.items.map((b) => /* @__PURE__ */ React.createElement(BatchCard, { key: b.ref, b, onOpen: open })))))));
  }
  function Brsr({ me }) {
    const { go } = useRoute();
    const [period, setPeriod] = useState("q2");
    const [openRow, setOpenRow] = useState("resold");
    const list = useMemo(() => X.inPeriod(period).slice().sort((a, b) => a.cleared < b.cleared ? 1 : -1), [period]);
    const t = X.totals(list), p = periodOf(period);
    const ROWS = [
      { id: "resold", label: "Waste diverted: resold", sub: "kiranas, ExpireSoon and staff sales", v: t.resoldKg, of: (b) => b.ledger.resoldKg },
      { id: "donated", label: "Waste diverted: donated", sub: `food banks · ${fmt.num(t.meals)} meals`, v: t.donatedKg, of: (b) => b.ledger.donatedKg },
      { id: "destroyed", label: "Waste disposed: destroyed", sub: "expired at the godown, full credit", v: t.destroyedKg, of: (b) => b.ledger.destroyedKg, bin: true },
      { id: "co2", label: "CO₂e avoided", sub: `${M.RULES.co2PerKg} kg a kg diverted, indicative`, v: t.co2, of: (b) => b.ledger.co2 }
    ];
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "BRSR · Principle 6", sub: `${p.long} · built from ${t.batches} cleared ${t.batches === 1 ? "batch" : "batches"}, each with its evidence` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap between", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Z.PeriodSwitch, { value: period, onChange: setPeriod }), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "download" }, "Export BRSR rows")), /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("div", { className: "sc121-fig" }, /* @__PURE__ */ React.createElement(Z.Kilos, { value: t.kg }), /* @__PURE__ */ React.createElement("span", { className: "sc121-what" }, "kept out of landfill")), /* @__PURE__ */ React.createElement("p", { className: "sc121-working" }, t.batches, " batches: ", t.sold, " sold through, ", t.leftover, " with packs left at the godown, ", t.donation, " donated. Every row below is the sum of the batches' posted ledgers.")), ROWS.map((r) => {
      const on = openRow === r.id;
      const items = list.filter((b) => r.of(b) > 0);
      return /* @__PURE__ */ React.createElement(Card, { key: r.id, pad: false, className: "stack", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "row between", style: { gap: 12, padding: "16px 20px", textAlign: "left" }, "aria-expanded": on, onClick: () => setOpenRow(on ? null : r.id) }, /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", null, r.label), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, r.sub, " · ", items.length, " ", items.length === 1 ? "batch" : "batches")), /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: cx("num s", r.bin && r.v ? "neg" : "") }, Z.kg(r.v)), /* @__PURE__ */ React.createElement(Icon, { name: on ? "chevron-up" : "chevron-down", size: 18 }))), on && /* @__PURE__ */ React.createElement(List, null, items.map((b) => /* @__PURE__ */ React.createElement(ListRow, { key: b.ref, chevron: true, onClick: () => go({ name: "report", params: { ref: b.ref } }), leading: /* @__PURE__ */ React.createElement(Product, { name: b.sku.img, size: 32 }), title: b.sku.name, sub: `${b.ref} · ${[b.numbers.invoice, b.numbers.receipt, b.numbers.expiry].filter(Boolean).join(" · ") || b.numbers.support}`, value: Z.kg(r.of(b)) }))));
    })));
  }
  function Report({ me }) {
    const b = Z.useBatchOf();
    if (b) return /* @__PURE__ */ React.createElement(Z.BatchPage, { me, b, back: me.role === "sustainability" ? "BRSR" : "Close" });
    return me.role === "sustainability" ? /* @__PURE__ */ React.createElement(Brsr, { me }) : /* @__PURE__ */ React.createElement(Close, { me });
  }
  Object.assign(S, { Report });
  S.NAV.finance = [{ id: "report", label: "Close", icon: "list-checks" }, { id: "batches", label: "Batches", icon: "boxes" }];
  S.NAV.sustainability = [{ id: "report", label: "BRSR", icon: "leaf" }, { id: "batches", label: "Batches", icon: "boxes" }];
  S.HOME.finance = S.HOME.sustainability = "report";
})();

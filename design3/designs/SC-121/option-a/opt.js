(function() {
  const { useState, useMemo } = React;
  const { motion, useReducedMotion } = Motion;
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, X = window.SC121, Z = window.SC121K;
  const { cx, Icon, Badge, Card, List, ListRow, Product, Money, useApp } = K;
  const { useRoute, Screen } = S;
  const fmt = M.fmt;
  const START = { finance: "gst", sustainability: "impact" };
  const figure = (b, reading) => reading === "money" ? fmt.inr(b.ledger.net) : reading === "gst" ? fmt.inr(b.ledger.itcKept) : Z.kg(b.ledger.kg);
  const second = (b, reading) => {
    const L = b.ledger;
    if (reading === "money") return `of ${fmt.inr(L.writeOff)} if destroyed`;
    if (reading === "gst") return L.itcReversed ? `${fmt.inr(L.itcReversed)} reversed` : "nothing reversed";
    return L.meals ? `${fmt.num(L.meals)} meals` : L.destroyedKg ? `${Z.kg(L.destroyedKg)} destroyed` : `${Z.kg(L.co2)} CO₂e`;
  };
  const binShare = (b, reading) => {
    const L = b.ledger;
    if (reading === "gst") return L.itcReversed / (L.itcKept + L.itcReversed || 1);
    if (reading === "impact") return L.destroyedKg / (L.kg + L.destroyedKg || 1);
    return b.realised ? b.realised.destroyed / b.plan.units : 0;
  };
  function Strip({ list, reading, onOpen }) {
    const reduce = useReducedMotion();
    const app = useApp();
    const months = [];
    list.forEach((b, i) => {
      const m = b.cleared.slice(0, 7);
      if (!months.length || months[months.length - 1].m !== m) months.push({ m, i, label: Z.month(b.cleared) });
    });
    const total = list.reduce((t, b) => t + Z.valueOf(b, reading), 0) || 1;
    let at = 0;
    const starts = list.map((b) => {
      const s = at;
      at += Z.valueOf(b, reading);
      return s / total;
    });
    return /* @__PURE__ */ React.createElement("div", { className: "sc121-stripwrap" }, /* @__PURE__ */ React.createElement("div", { className: "sc121-strip", role: "list", "aria-label": "The period's batches, each as wide as its figure" }, list.map((b, i) => {
      const share = binShare(b, reading);
      return /* @__PURE__ */ React.createElement(
        motion.button,
        {
          key: b.ref + reading,
          type: "button",
          role: "listitem",
          className: cx("sc121-seg", b.outcome),
          style: { flexGrow: Math.max(Z.valueOf(b, reading), total * 0.012) },
          onClick: () => onOpen(b),
          initial: reduce ? false : { scaleX: 0, opacity: 0 },
          animate: { scaleX: 1, opacity: 1 },
          transition: { duration: 0.42, delay: reduce ? 0 : i * 0.035, ease: [0.22, 1, 0.36, 1] },
          "aria-label": `${b.sku.name}, ${b.ref}: ${figure(b, reading)}, ${X.OUTCOME[b.outcome].label}`,
          title: `${b.sku.name} · ${figure(b, reading)}`
        },
        share > 4e-3 && /* @__PURE__ */ React.createElement("i", { className: "sc121-bin", style: { width: Math.max(4, share * 100) + "%" }, "aria-hidden": "true" }),
        app.bp !== "phone" && /* @__PURE__ */ React.createElement("span", { className: "sc121-seglabel", "aria-hidden": "true" }, b.sku.name.split(" ")[0])
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "sc121-ticks", "aria-hidden": "true" }, months.map((m) => /* @__PURE__ */ React.createElement("span", { key: m.m, style: { left: starts[m.i] * 100 + "%" } }, m.label))), /* @__PURE__ */ React.createElement("div", { className: "sc121-legend" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "sold" }), "Sold through"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "leftover" }), "Left at the godown"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "donation" }), "Donated"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "bin" }), reading === "gst" ? "Credit reversed" : reading === "impact" ? "Destroyed" : "Packs destroyed")));
  }
  function Ledger({ me }) {
    const app = useApp();
    const phone = app.bp === "phone";
    const { go } = useRoute();
    const [period, setPeriod] = useState("ytd");
    const [reading, setReading] = useState(START[me.role] || "money");
    const list = useMemo(() => X.inPeriod(period).slice().sort((a, b) => a.cleared < b.cleared ? -1 : 1), [period]);
    const t = X.totals(list);
    const open = (b) => go({ name: "report", params: { ref: b.ref } });
    const byMonth = [];
    list.slice().reverse().forEach((b) => {
      const m = b.cleared.slice(0, 7);
      const g = byMonth.find((x) => x.m === m) || (byMonth.push({ m, label: Z.month(b.cleared), items: [] }), byMonth[byMonth.length - 1]);
      g.items.push(b);
    });
    const flying = period !== "q2" ? X.inFlight : [];
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Ledger", sub: "One ledger, two readings · every batch Munchly has cleared since 1 Jul" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap between", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Z.PeriodSwitch, { value: period, onChange: setPeriod }), /* @__PURE__ */ React.createElement(Z.ReadingSwitch, { value: reading, onChange: setReading })), /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement(Z.Headline, { t, reading, period }), /* @__PURE__ */ React.createElement(Strip, { list, reading, onOpen: open })), flying.length ? /* @__PURE__ */ React.createElement(List, { head: "Still out" }, flying.map((b) => /* @__PURE__ */ React.createElement(ListRow, { key: b.ref, leading: /* @__PURE__ */ React.createElement(Product, { name: b.sku.img, size: 40 }), title: b.sku.name, sub: `${b.ref} · ${b.dist.short} · ${b.note}`, value: /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true, live: true }, b.stage) }))) : null, byMonth.map((g) => /* @__PURE__ */ React.createElement(List, { key: g.m, head: `${g.label} · ${g.items.length} ${g.items.length === 1 ? "batch" : "batches"} · ${reading === "impact" ? Z.kg(g.items.reduce((s, b) => s + b.ledger.kg, 0)) : fmt.inr(g.items.reduce((s, b) => s + (reading === "gst" ? b.ledger.itcKept : b.ledger.net), 0))}` }, g.items.map((b) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: b.ref,
        chevron: true,
        onClick: () => open(b),
        leading: /* @__PURE__ */ React.createElement(Product, { name: b.sku.img, size: 40 }),
        title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, b.sku.name), !phone && /* @__PURE__ */ React.createElement(Z.OutcomeBadge, { o: b.outcome, size: "sm" })),
        sub: `${b.ref} · ${b.dist.short} · cleared ${Z.day(b.cleared)}`,
        value: /* @__PURE__ */ React.createElement("span", { className: "sc121-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, figure(b, reading)), /* @__PURE__ */ React.createElement("em", null, second(b, reading)))
      }
    )))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle" }, "Every figure is the batch's posted ledger, as money.js works it out. CO₂e, disposal and EPR are indicative. The companies and people are fictional.")));
  }
  function Report({ me }) {
    const b = Z.useBatchOf();
    return b ? /* @__PURE__ */ React.createElement(Z.BatchPage, { me, b, back: "Ledger" }) : /* @__PURE__ */ React.createElement(Ledger, { me });
  }
  Object.assign(S, { Report });
  S.NAV.finance = [{ id: "report", label: "Ledger", icon: "book-open" }, { id: "batches", label: "Batches", icon: "boxes" }];
  S.NAV.sustainability = S.NAV.finance;
  S.HOME.finance = S.HOME.sustainability = "report";
})();

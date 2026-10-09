(function() {
  const { useState, useMemo } = React;
  const { motion, useReducedMotion } = Motion;
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, X = window.SC121, Z = window.SC121K;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Sheet, Product, Money, useApp } = K;
  const { useRoute, Screen, Columns, SectionTitle } = S;
  const fmt = M.fmt;
  const START = { finance: "gst", sustainability: "impact" };
  const DAY = 864e5, t0 = (iso) => Date.parse(iso + "T00:00:00Z");
  const bar = (b, reading) => {
    const L = b.ledger;
    if (reading === "money") return { v: L.net, bin: 0, ghost: L.writeOff };
    if (reading === "gst") return { v: L.itcKept, bin: L.itcReversed, ghost: 0 };
    return { v: L.kg, bin: L.destroyedKg, ghost: 0 };
  };
  const show = (n, reading) => reading === "impact" ? Z.kg(n) : fmt.inr(n);
  function Chart({ list, reading, period, sel, onSel }) {
    const reduce = useReducedMotion();
    const app = useApp();
    const p = X.PERIODS.find((x2) => x2.id === period);
    const from = t0(period === "ytd" ? "2026-07-01" : p.from), to = t0(period === "ytd" ? "2026-10-31" : period === "q3" ? "2026-10-31" : p.to);
    const x = (iso) => (t0(iso) - from) / (to - from) * 100;
    const max = Math.max(1, ...list.map((b) => {
      const v = bar(b, reading);
      return Math.max(v.v + v.bin, v.ghost);
    }));
    const raw = max / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    const top = Math.ceil(max / step) * step;
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
    const label = (v) => reading === "impact" ? Math.round(v) + " kg" : v >= 1e3 ? "₹" + (v / 1e3).toLocaleString("en-IN", { maximumFractionDigits: 1 }) + "k" : "₹" + v;
    const gap = app.bp === "phone" ? 5 : 2.8;
    let last = -Infinity;
    const at = Object.fromEntries(list.map((b) => {
      let v = x(b.cleared);
      if (v - last < gap) v = last + gap;
      last = v;
      return [b.ref, v];
    }));
    const months = [];
    for (let d = new Date(from); d.getTime() <= to; d.setUTCMonth(d.getUTCMonth() + 1)) months.push(new Date(d));
    return /* @__PURE__ */ React.createElement("div", { className: "sc121-chart", role: "group", "aria-label": `Cleared batches by the day they cleared, ${reading}` }, /* @__PURE__ */ React.createElement("div", { className: "sc121-grid", "aria-hidden": "true" }, ticks.map((v, i) => /* @__PURE__ */ React.createElement("i", { key: i, style: { bottom: v / top * 100 + "%" } }, /* @__PURE__ */ React.createElement("em", null, label(v))))), /* @__PURE__ */ React.createElement("div", { className: "sc121-bars" }, list.map((b, i) => {
      const v = bar(b, reading);
      const h = (v.v + v.bin) / top * 100;
      const binH = v.bin ? v.bin / (v.v + v.bin) * 100 : 0;
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: b.ref + reading }, v.ghost ? /* @__PURE__ */ React.createElement("span", { className: "sc121-ghost", style: { left: at[b.ref] + "%", height: v.ghost / top * 100 + "%" }, "aria-hidden": "true" }) : null, /* @__PURE__ */ React.createElement(
        motion.button,
        {
          type: "button",
          className: cx("sc121-bar", b.outcome, sel === b.ref && "on"),
          style: { left: at[b.ref] + "%", height: h + "%" },
          onClick: () => onSel(b.ref),
          initial: reduce ? false : { scaleY: 0 },
          animate: { scaleY: 1 },
          transition: { duration: 0.42, delay: reduce ? 0 : i * 0.04, ease: [0.22, 1, 0.36, 1] },
          "aria-pressed": sel === b.ref,
          "aria-label": `${b.sku.name}, ${b.ref}, cleared ${Z.day(b.cleared)}: ${show(v.v, reading)}${v.bin ? `, ${show(v.bin, reading)} to the bin` : ""}`
        },
        /* @__PURE__ */ React.createElement("span", { className: "fill", style: { height: 100 - binH + "%" } }),
        binH ? /* @__PURE__ */ React.createElement("span", { className: "bin", style: { top: 0, height: binH + "%" } }) : null
      ));
    })), /* @__PURE__ */ React.createElement("div", { className: "sc121-axis", "aria-hidden": "true" }, months.map((m) => /* @__PURE__ */ React.createElement("span", { key: m.toISOString(), style: { left: (m.getTime() - from) / (to - from) * 100 + "%" } }, m.toLocaleDateString("en-IN", { month: app.bp === "phone" ? "short" : "long", timeZone: "UTC" })))));
  }
  function Inspector({ b, onOpen }) {
    const L = b.ledger;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: b.sku.img, size: 52 }), /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, b.sku.name), /* @__PURE__ */ React.createElement("div", { className: "t-caption subtle mono" }, b.ref, " · ", b.dist.short))), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 6 } }, /* @__PURE__ */ React.createElement(Z.OutcomeBadge, { o: b.outcome, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "cleared ", Z.day(b.cleared))), /* @__PURE__ */ React.createElement("div", { className: "sc121-line" }, /* @__PURE__ */ React.createElement("span", null, "Recovered ", /* @__PURE__ */ React.createElement("em", null, "of ", fmt.inr(L.writeOff), " if destroyed")), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr(L.net))), /* @__PURE__ */ React.createElement("div", { className: "sc121-line" }, /* @__PURE__ */ React.createElement("span", null, "Better than the bin"), /* @__PURE__ */ React.createElement("span", { className: "tnum pos" }, fmt.inr(L.swing))), /* @__PURE__ */ React.createElement("div", { className: "sc121-line" }, /* @__PURE__ */ React.createElement("span", null, "Input credit kept ", /* @__PURE__ */ React.createElement("em", null, "reversed ", fmt.inr(L.itcReversed))), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr(L.itcKept))), /* @__PURE__ */ React.createElement("div", { className: "sc121-line" }, /* @__PURE__ */ React.createElement("span", null, "Credit notes"), /* @__PURE__ */ React.createElement("span", { className: "tnum mono" }, [b.numbers.support, b.numbers.expiry].filter(Boolean).join(", "))), /* @__PURE__ */ React.createElement("div", { className: "sc121-line" }, /* @__PURE__ */ React.createElement("span", null, "Kept out of landfill ", /* @__PURE__ */ React.createElement("em", null, L.destroyedKg ? `${Z.kg(L.destroyedKg)} destroyed` : L.meals ? `${fmt.num(L.meals)} meals` : "nothing destroyed")), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, Z.kg(L.kg))), /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "arrow-right", onClick: () => onOpen(b) }, "Open the batch"));
  }
  function Timeline({ me }) {
    const app = useApp();
    const { go } = useRoute();
    const desktop = app.bp === "desktop";
    const [period, setPeriod] = useState("ytd");
    const [reading, setReading] = useState(START[me.role] || "money");
    const list = useMemo(() => X.inPeriod(period).slice().sort((a, b) => a.cleared < b.cleared ? -1 : 1), [period]);
    const [sel, setSel] = useState("MF-2407-114");
    const [sheet, setSheet] = useState(false);
    const t = X.totals(list);
    const chosen = list.find((b) => b.ref === sel) || list[list.length - 1];
    const open = (b) => go({ name: "report", params: { ref: b.ref } });
    const pick = (ref) => {
      setSel(ref);
      if (!desktop) setSheet(true);
    };
    const byMonth = [];
    list.forEach((b) => {
      const m = b.cleared.slice(0, 7);
      (byMonth.find((g) => g.m === m) || (byMonth.push({ m, label: Z.month(b.cleared), items: [] }), byMonth[byMonth.length - 1])).items.push(b);
    });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Finance & ESG", sub: "Every batch Munchly has cleared since 1 Jul, on the day it cleared" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap between", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Z.PeriodSwitch, { value: period, onChange: setPeriod }), /* @__PURE__ */ React.createElement(Z.ReadingSwitch, { value: reading, onChange: setReading })), /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 340,
        main: /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Z.Headline, { t, reading, period }), /* @__PURE__ */ React.createElement(Chart, { list, reading, period, sel: chosen && chosen.ref, onSel: pick }), /* @__PURE__ */ React.createElement("div", { className: "sc121-legend" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "sold" }), reading === "money" ? "Recovered" : reading === "gst" ? "Credit kept" : "Diverted"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "donation" }), "Donated batch"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "bin" }), reading === "gst" ? "Credit reversed" : reading === "impact" ? "Destroyed" : "Packs destroyed"), reading === "money" && /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { style: { background: "transparent", boxShadow: "inset 0 0 0 1.5px color-mix(in srgb, var(--red) 55%, transparent)" } }), "If destroyed"))),
        side: desktop && chosen ? /* @__PURE__ */ React.createElement(Inspector, { b: chosen, onOpen: open }) : null
      }
    ), /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Each month's batches, summed from their ledgers" }, "By month"), /* @__PURE__ */ React.createElement("div", { className: "sc121-months" }, byMonth.map((g) => {
      const s = X.totals(g.items);
      return /* @__PURE__ */ React.createElement("div", { key: g.m }, /* @__PURE__ */ React.createElement("b", null, g.label), /* @__PURE__ */ React.createElement("span", { className: "num s" }, reading === "impact" ? Z.kg(s.kg) : fmt.inr(reading === "gst" ? s.itcKept : s.net)), /* @__PURE__ */ React.createElement("em", null, g.items.length, " ", g.items.length === 1 ? "batch" : "batches", " · ", reading === "gst" ? `${fmt.inr(s.itcReversed)} reversed` : reading === "impact" ? `${Z.kg(s.destroyedKg)} destroyed` : `${fmt.inr(s.swing)} better`));
    }))), /* @__PURE__ */ React.createElement(Sheet, { open: sheet, onClose: () => setSheet(false), title: chosen ? chosen.sku.name : "" }, chosen ? /* @__PURE__ */ React.createElement(Inspector, { b: chosen, onOpen: (b) => {
      setSheet(false);
      open(b);
    } }) : null));
  }
  function Report({ me }) {
    const b = Z.useBatchOf();
    return b ? /* @__PURE__ */ React.createElement(Z.BatchPage, { me, b, back: "Finance & ESG" }) : /* @__PURE__ */ React.createElement(Timeline, { me });
  }
  Object.assign(S, { Report });
  S.NAV.finance = [{ id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line" }, { id: "batches", label: "Batches", icon: "boxes" }];
  S.NAV.sustainability = S.NAV.finance;
  S.HOME.finance = S.HOME.sustainability = "report";
})();

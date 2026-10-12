(function() {
  const D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE;
  const fmt = M.fmt;
  const r2 = (n) => Math.round(n * 100) / 100;
  const n0 = (n) => Math.round(n).toLocaleString("en-IN");
  const inr2 = (n) => (n < 0 ? "−" : "") + "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const NAMES = { kirana: "Kirana scheme", staff: "Staff sale", foodbank: "Food bank", expiresoon: "ExpireSoon" };
  function working(s) {
    s = s || Store.get();
    const C = D.story(s);
    const p = C.plan;
    const posted = !!s.hero.posted;
    const a = C.actual || {};
    const delta = posted ? a.delta || 0 : 0;
    const wo = p.writeOff;
    const sku = C.sku;
    const lines = p.lines.filter((l) => l.units > 0 && l.id !== "writeoff").map((l) => {
      const atCounter = l.id === "expiresoon" && delta;
      const price = atCounter ? C.counter.price : l.price;
      const gross2 = atCounter ? r2(l.units * price) : l.gross;
      return { id: l.id, name: NAMES[l.id] || l.short, units: l.units, price, packPrice: l.packPrice, charged: l.charged, gross: gross2, cost: l.cost, itcLoss: l.itcLoss, net: r2(gross2 - l.cost - l.itcLoss) };
    });
    const net = posted ? a.net : p.net, pnl = posted ? a.pnl : p.pnl, swing = posted ? a.swing : p.swing;
    const extra = r2(wo.total - wo.stock), extraPer = r2(extra / p.units);
    const exits = lines.map((l) => ({ ...l, contrib: r2(l.net + l.units * extraPer), perPack: r2(l.net / l.units) }));
    const sold = lines.filter((l) => l.id !== "foodbank").reduce((t, l) => t + l.units, 0);
    const given = lines.filter((l) => l.id === "foodbank").reduce((t, l) => t + l.units, 0);
    const gross = r2(lines.reduce((t, l) => t + l.gross, 0)), costs = r2(lines.reduce((t, l) => t + l.cost, 0)), itcLost = r2(lines.reduce((t, l) => t + l.itcLoss, 0));
    const left = (p.rows || []).filter((r) => !r.baseline && !r.eligible && r.reason);
    return { C, s, p, sku, wo, lines, exits, net, pnl, swing, book: p.bookCost, extra, extraPer, posted, sold, given, gross, costs, itcLost, left, leftover: p.leftover || 0, units: p.units, batch: C.batch };
  }
  function lineHow(l) {
    if (l.id === "kirana") return `${n0(l.units)} packets, ${n0(l.charged)} charged at ₹${l.packPrice.toFixed(2)} (2 free with every 10), less ₹${n0(l.cost)} van`;
    if (l.id === "staff") return `${n0(l.units)} packs at ₹${l.price.toFixed(2)}, by UPI`;
    if (l.id === "foodbank") return `${n0(l.units)} packs given: ₹${l.cost.toFixed(2)} handling, and their GST credit reversed (₹${l.itcLoss.toFixed(2)})`;
    if (l.id === "expiresoon") return `${n0(l.units)} packs at ₹${l.price.toFixed(2)}, less ₹${n0(l.cost)} listing fee`;
    return `${n0(l.units)} packs`;
  }
  function binRows(w) {
    const wo = w.wo, R = M.RULES;
    return [
      ["Stock written off at cost", `${n0(wo.units)} × ₹${w.sku.cost.toFixed(2)}`, wo.stock],
      ["GST input credit reversed", `${n0(wo.units)} × ₹${wo.itcPerUnit.toFixed(2)}`, wo.itc],
      ["Disposal", `${n0(wo.units)} × ₹${R.disposalPerUnit.toFixed(2)}`, wo.disposal],
      ["EPR", `${wo.kg.toLocaleString("en-IN")} kg × ₹${R.eprPerKg.toFixed(2)}`, wo.epr]
    ];
  }
  window.SC195 = { working, lineHow, binRows, inr2, n0, r2, fmt };
})();

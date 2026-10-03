/* Smart-Clearance v3 · money: every figure on screen is computed here from the journey map's rules
   (docs/dobara-journey-map.html, "Channels" and "Money and tax, worked through"). Nothing is typed twice. */
(function () {
  const RULES = {
    projectionStopDays: 7,            // retailers will not take stock in the last week
    gates: { blinkit: { label: "Blinkit", minDays: 90 }, zepto: { label: "Zepto", pctLife: 0.6 }, instamart: { label: "Instamart", pctLife: 0.6 } },
    disposalPerUnit: 1.5,             // indicative, editable in setup
    eprPerKg: 6,                      // indicative, editable in setup
    co2PerKg: 2.5,                    // indicative
    vanPerUnit: 0.5,                  // kirana delivery
    listingFee: 100,                  // ExpireSoon, after the first five free listings
    courierPerUnit: 3,                // D2C
    foodbankFreightPerUnit: 0.5,
    tokenPct: 0.15,                   // ExpireSoon bid token
    kiranaWindowDays: 14, kiranaUplift: 3.5,
    d2cCapPct: 0.08, staffCap: 150,
    floors: { snacks: 0.35, biscuits: 0.35, staples: 0.40, beverages: 0.30, "personal-care": 0.40 },
    ewayThreshold: 50000,
    negotiation: { reservePerUnit: 13.5, counterPctOfAsk: 0.95 },
  };
  const CHANNELS = [
    { id: "expiresoon", name: "ExpireSoon listing", short: "ExpireSoon", minDays: 30, pricePct: 0.5, unlimited: true, clears: "5–9 days", icon: "shopping-bag" },
    { id: "kirana", name: "Kirana cluster push", short: "Kirana cluster", minDays: 20, pricePct: 0.6, clears: "10–14 days", icon: "store" },
    { id: "d2c", name: "Discount D2C", short: "Brand site", minDays: 25, pricePct: 0.5, clears: "7–12 days", icon: "globe" },
    { id: "staff", name: "Staff sale", short: "Staff sale", minDays: 0, pricePct: 0.4, clears: "2–3 days", icon: "users" },
    { id: "foodbank", name: "Food bank donation", short: "Food bank", minDays: 15, pricePct: 0, unlimited: true, clears: "1–2 days", icon: "heart-handshake", foodOnly: true },
    { id: "writeoff", name: "Write-off (destroy)", short: "Write-off", minDays: 0, pricePct: 0, unlimited: true, clears: "—", icon: "trash-2", baseline: true },
  ];

  const r2 = n => Math.round(n * 100) / 100;
  const lifeOf = sku => sku.lifeDays;

  function gates(batch, sku) {
    return Object.entries(RULES.gates).map(([id, g]) => {
      const need = g.minDays != null ? g.minDays : Math.round(lifeOf(sku) * g.pctLife);
      return { id, app: g.label, need, has: batch.daysLeft, pass: batch.daysLeft >= need, rule: g.minDays != null ? `needs ${g.minDays}+ days` : `needs ${Math.round(g.pctLife * 100)}% of life (${need} days)` };
    });
  }

  function assess(batch, sku) {
    const g = gates(batch, sku);
    const usableDays = Math.max(0, batch.daysLeft - RULES.projectionStopDays);
    const willSell = Math.min(batch.units, batch.sellPerDay * usableDays);
    const atRisk = batch.units - willSell;
    const blocked = g.every(x => !x.pass);
    const status = atRisk > 0 && blocked ? "at-risk" : g.some(x => !x.pass) ? "gated" : "safe";
    return { gates: g, usableDays, willSell, atRisk, atRiskMRP: atRisk * sku.mrp, blocked, status, lifeUsedPct: Math.round((1 - batch.daysLeft / lifeOf(sku)) * 100), urgency: Math.max(0, Math.min(1, 1 - batch.daysLeft / lifeOf(sku))) };
  }

  function writeOff(units, sku) {
    const stock = units * sku.cost;
    const itc = stock * sku.gst;
    const disposal = units * RULES.disposalPerUnit;
    const kg = r2(units * sku.kgPerUnit);
    const epr = kg * RULES.eprPerKg;
    const total = stock + itc + disposal + epr;
    return { units, stock, itc: r2(itc), disposal, kg, epr: r2(epr), total: r2(total), perUnit: r2(total / units) };
  }

  function channelTable(batch, sku, units) {
    const wo = writeOff(units, sku);
    const sell = batch.sellPerDay;
    return CHANNELS.map(c => {
      const price = r2(sku.mrp * c.pricePct);
      let costPerUnit = 0, capacity = Infinity, reason = "";
      if (c.id === "kirana") { costPerUnit = RULES.vanPerUnit; capacity = Math.round(sell * RULES.kiranaWindowDays * RULES.kiranaUplift); }
      if (c.id === "d2c") { costPerUnit = RULES.courierPerUnit; capacity = Math.floor(batch.units * RULES.d2cCapPct); }
      if (c.id === "staff") capacity = RULES.staffCap;
      if (c.id === "foodbank") costPerUnit = RULES.foodbankFreightPerUnit;
      const net = c.baseline ? -wo.perUnit : r2(price - costPerUnit);
      let eligible = true;
      if (!c.baseline && batch.daysLeft < c.minDays) { eligible = false; reason = `needs ${c.minDays}+ days, has ${batch.daysLeft}`; }
      if (c.foodOnly && sku.category === "personal-care") { eligible = false; reason = "personal care never goes to food banks"; }
      const floor = RULES.floors[sku.category] || 0.35;
      if (!c.baseline && c.id !== "foodbank" && c.pricePct < floor) { eligible = false; reason = `below the ${Math.round(floor * 100)}% floor`; }
      return {
        ...c, price, pricePctLabel: c.pricePct ? `${Math.round(c.pricePct * 100)}%` : "—", costPerUnit, net, capacity, eligible, reason,
        itc: c.id === "foodbank" || c.baseline ? "reversed" : "retained", indicative: c.id === "foodbank",
        need: c.baseline ? "—" : c.minDays ? `${c.minDays}+ days` : c.foodOnly ? "food only" : "any",
      };
    });
  }

  // fill the best-paying channel to its capacity, then the next; food bank before write-off
  function allocate(rows, units) {
    const order = rows.filter(r => r.eligible && !r.baseline).sort((a, b) => b.net - a.net);
    let left = units; const out = [];
    for (const r of order) { if (left <= 0) break; const take = Math.min(left, r.capacity); if (take > 0) { out.push({ id: r.id, units: take }); left -= take; } }
    if (left > 0) out.push({ id: "writeoff", units: left });
    return out;
  }

  function plan(batch, sku) {
    const a = assess(batch, sku);
    const units = a.atRisk;
    const rows = channelTable(batch, sku, units);
    const alloc = allocate(rows, units);
    const lines = alloc.map(x => {
      const r = rows.find(y => y.id === x.id);
      const gross = r.baseline ? 0 : r2(x.units * r.price);
      let cost = r2(x.units * r.costPerUnit);
      if (r.id === "expiresoon") cost = r2(cost + RULES.listingFee);
      return { id: r.id, name: r.name, short: r.short, units: x.units, price: r.price, gross, cost, net: r2(gross - cost), cartons: x.units / sku.perCarton };
    });
    const gross = r2(lines.reduce((t, l) => t + l.gross, 0));
    const costs = r2(lines.reduce((t, l) => t + l.cost, 0));
    const net = r2(gross - costs);
    const wo = writeOff(units, sku);
    const soldUnits = lines.filter(l => l.id !== "foodbank" && l.id !== "writeoff").reduce((t, l) => t + l.units, 0);
    const donated = lines.filter(l => l.id === "foodbank").reduce((t, l) => t + l.units, 0);
    const best = rows.filter(r => r.eligible && r.unlimited && !r.baseline && r.id !== "foodbank").sort((a, b) => b.net - a.net)[0];
    const alt = best ? { id: best.id, label: `all ${units.toLocaleString("en-IN")} to ${best.short}`, net: r2(units * best.price - units * best.costPerUnit - (best.id === "expiresoon" ? RULES.listingFee : 0)) } : null;
    const kg = r2((units - lines.filter(l => l.id === "writeoff").reduce((t, l) => t + l.units, 0)) * sku.kgPerUnit);
    return {
      batch: batch.id, units, rows, lines, gross, costs, net, pctMRP: Math.round((gross / (units * sku.mrp)) * 100),
      writeOff: wo, swing: r2(net + wo.total), itcRetained: r2(soldUnits * sku.cost * sku.gst), itcReversedIndicative: r2(donated * sku.cost * sku.gst),
      disposalAvoided: r2(wo.disposal + wo.epr), alt, kg, co2: r2(kg * RULES.co2PerKg), meals: donated, soldUnits, donated,
    };
  }

  function counter(ask, bid) {
    const n = RULES.negotiation;
    if (bid >= ask) return { action: "accept", price: bid };
    const counter = Math.max(n.reservePerUnit, Math.floor(ask * n.counterPctOfAsk * 10) / 10);
    if (bid >= counter) return { action: "accept", price: bid };
    return { action: "counter", price: counter, below: bid < n.reservePerUnit };
  }
  function award(units, price) { const gross = r2(units * price); const token = Math.round(gross * RULES.tokenPct); return { units, price, gross, token, balance: r2(gross - token) }; }
  function actualNet(p, awardPrice) {
    const es = p.lines.find(l => l.id === "expiresoon");
    if (!es) return { net: p.net, delta: 0 };
    const delta = r2(es.units * (es.price - awardPrice));
    return { net: r2(p.net - delta), delta, esPlanned: es.gross, esActual: r2(es.units * awardPrice) };
  }

  function documents(p, sku, aw, seller, buyer) {
    const es = p.lines.find(l => l.id === "expiresoon"); const k = p.lines.find(l => l.id === "kirana");
    const docs = [];
    if (es && aw) {
      const taxable = r2(aw.units * aw.price), igst = r2(taxable * sku.gst), total = r2(taxable + igst);
      docs.push({ id: "invoice", type: "Tax invoice", no: "INV/26-27/0931", status: "generated", amount: total, lines: [[`${aw.units} × ${sku.name} at ₹${aw.price.toFixed(2)}`, taxable], [`IGST ${Math.round(sku.gst * 100)}% (inter-state)`, igst]], taxable, igst, total, from: seller, to: buyer, hsn: sku.hsn });
      docs.push({ id: "eway", type: "E-way bill check", no: p.batch, status: total < RULES.ewayThreshold ? "not required" : "generated", amount: total, note: `Consignment ₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })} incl. GST is below the ₹50,000 threshold.` });
    }
    if (k) { const free = Math.floor(k.units / 12) * 2; docs.push({ id: "credit", type: "Credit note", no: "CN/0117", status: "generated", amount: free * sku.cost, free, note: `Buy 10 get 2 scheme: ${free} free units at cost ₹${sku.cost}.` }); }
    docs.push({ id: "itc", type: "GST ITC memo", no: "s.17(5)(h) · indicative", status: "generated", amount: p.itcRetained, note: "Goods supplied under tax invoices, so the Section 17(5)(h) reversal does not apply." });
    docs.push({ id: "fssai", type: "FSSAI surplus-food checklist", no: p.donated ? `${p.donated} units` : "no donation", status: p.donated ? "generated" : "not required", amount: 0 });
    const left = (p.lines.find(l => l.id === "writeoff") || {}).units || 0;
    docs.push({ id: "destruction", type: "Destruction certificate", no: left ? `${left} units` : "0 units left", status: left ? "generated" : "not required", amount: 0 });
    return docs;
  }

  // formatting: Indian digit grouping, rupees, lakhs
  const fmt = {
    num: n => Math.round(n).toLocaleString("en-IN"),
    inr: n => (n < 0 ? "−₹" : "₹") + Math.round(Math.abs(n)).toLocaleString("en-IN"),
    inr2: n => (n < 0 ? "−₹" : "₹") + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    lakh: n => "₹" + (n / 100000).toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " L",
    kg: n => (n >= 1000 ? (n / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " t" : n.toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " kg"),
    pct: n => Math.round(n * 100) + "%",
    date: iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  };

  window.SC3_MONEY = { RULES, CHANNELS, gates, assess, writeOff, channelTable, allocate, plan, counter, award, actualNet, documents, fmt };
})();

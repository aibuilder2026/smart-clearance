/* Smart-Clearance v3 · money: every figure on screen is computed here from the journey map's rules
   (docs/dobara-journey-map.html v4.1, "Channels" and "Money and tax, worked through"). Nothing is typed twice. */
(function () {
  const RULES = {
    projectionStopDays: 7,            // retailers will not take stock in the last week
    gates: { blinkit: { label: "Blinkit", minDays: 90 }, zepto: { label: "Zepto", pctLife: 0.6 }, instamart: { label: "Instamart", pctLife: 0.6 } },
    disposalPerUnit: 1.5,             // indicative, editable in setup
    eprPerKg: 6,                      // indicative, editable in setup
    co2PerKg: 2.5,                    // indicative
    vanPerUnit: 0.5,                  // kirana delivery; a planning assumption, editable in setup
    listingFee: 100,                  // ExpireSoon, after the first five free listings (Rakesh has used his)
    foodbankHandlingPerUnit: 0.5,
    tokenPct: 0.15,                   // ExpireSoon bid token
    kiranaWindowDays: 14, kiranaUplift: 3.5, shopCapTimes: 4, // scheme volume on top of normal sales; no shop over 4× its own 14-day sales
    scheme: { buy: 10, free: 2 },     // a kirana pays the pack price for 10 and gets 2 free
    staffCap: 50,                     // a staff sale at the distributor's godown, unless the godown sets its own cap
    returnWindowDays: 20,             // scheme packs can go back to the distributor until 20 days before best-before
    floors: { snacks: 0.35, biscuits: 0.35, staples: 0.40, beverages: 0.30, "personal-care": 0.40 },
    ewayThreshold: 50000,
    negotiation: { reservePerUnit: 13.5, counterPctOfAsk: 0.95 },
  };
  // the exits for a distributor's stock. Discount D2C is only for a manufacturer's own warehouse stock, so it is not here.
  const CHANNELS = [
    { id: "expiresoon", name: "ExpireSoon listing", short: "ExpireSoon", minDays: 30, need: "30+ days", pricePct: 0.5, unlimited: true, clears: "5–9 days", icon: "shopping-bag" },
    { id: "kirana", name: "Kirana cluster push", short: "Kirana cluster", minDays: 20, need: "20+ days", pricePct: 0.6, clears: "10–14 days", icon: "store" },
    { id: "staff", name: "Staff sale", short: "Staff sale", minDays: 0, need: "until best-before", pricePct: 0.4, clears: "2–3 days", icon: "users" },
    { id: "foodbank", name: "Food bank donation", short: "Food bank", minDays: 15, need: "15+ days, food", pricePct: 0, unlimited: true, clears: "1–2 days", icon: "heart-handshake", foodOnly: true },
    { id: "writeoff", name: "Write-off (destroy)", short: "Write-off", minDays: 0, need: "—", pricePct: 0, unlimited: true, clears: "—", icon: "trash-2", baseline: true },
  ];

  const r2 = n => Math.round(n * 100) / 100;
  const DAY = 86400000;
  // a batch's own shelf life, from the dates on its label when it has them
  const lifeOf = (batch, sku) => (batch && batch.mfg && batch.bestBefore ? Math.round((Date.parse(batch.bestBefore) - Date.parse(batch.mfg)) / DAY) : sku.lifeDays);
  // input GST in each pack, from the cost sheet; reversed if the pack is destroyed or given away
  const itcOf = sku => (sku.itcPerUnit != null ? sku.itcPerUnit : r2(sku.cost * sku.gst));

  function gates(batch, sku) {
    const life = lifeOf(batch, sku);
    return Object.entries(RULES.gates).map(([id, g]) => {
      const need = g.minDays != null ? g.minDays : Math.round(life * g.pctLife);
      return { id, app: g.label, need, has: batch.daysLeft, pass: batch.daysLeft >= need, rule: g.minDays != null ? `needs ${g.minDays}+ days` : `needs ${Math.round(g.pctLife * 100)}% of a ${life}-day life (${need} days)` };
    });
  }

  function assess(batch, sku) {
    const g = gates(batch, sku); const life = lifeOf(batch, sku);
    const usableDays = Math.max(0, batch.daysLeft - RULES.projectionStopDays);
    const willSell = Math.min(batch.units, batch.sellPerDay * usableDays);
    const atRisk = batch.units - willSell;
    const blocked = g.every(x => !x.pass);
    const status = atRisk > 0 && blocked ? "at-risk" : g.some(x => !x.pass) ? "gated" : "safe";
    return { gates: g, life, usableDays, willSell, atRisk, atRiskMRP: atRisk * sku.mrp, blocked, status, lifeUsedPct: Math.round((1 - batch.daysLeft / life) * 100), urgency: Math.max(0, Math.min(1, 1 - batch.daysLeft / life)) };
  }

  // what destroying costs, per the journey map: stock at cost + input credit reversed + disposal + EPR on the kilos
  function writeOff(units, sku) {
    const stock = units * sku.cost;
    const itc = r2(units * itcOf(sku));
    const disposal = units * RULES.disposalPerUnit;
    const kg = r2(units * sku.kgPerUnit);
    const epr = r2(kg * RULES.eprPerKg);
    const total = r2(stock + itc + disposal + epr);
    return { units, stock, itc, itcPerUnit: itcOf(sku), disposal, kg, epr, total, perUnit: r2(total / units) };
  }

  function channelTable(batch, sku, units) {
    const wo = writeOff(units, sku);
    const sell = batch.sellPerDay;
    return CHANNELS.map(c => {
      const price = r2(sku.mrp * c.pricePct);
      let costPerUnit = 0, itcLoss = 0, capacity = Infinity, reason = "", name = c.name, packPrice = null;
      if (c.id === "kirana") { costPerUnit = RULES.vanPerUnit; capacity = Math.round(sell * RULES.kiranaWindowDays * RULES.kiranaUplift); packPrice = r2(price * (RULES.scheme.buy + RULES.scheme.free) / RULES.scheme.buy); }
      if (c.id === "staff") { capacity = batch.staffCap || RULES.staffCap; if (batch.city) name = `${batch.city} staff sale`; }
      // a donation is a gift: handling, and the input credit on it is reversed (s.17(5)(h), and 17(5)(fa) for CSR)
      if (c.id === "foodbank") { costPerUnit = RULES.foodbankHandlingPerUnit; itcLoss = itcOf(sku); }
      const net = c.baseline ? -wo.perUnit : r2(price - costPerUnit - itcLoss);
      let eligible = true;
      if (!c.baseline && batch.daysLeft < c.minDays) { eligible = false; reason = `needs ${c.minDays}+ days, has ${batch.daysLeft}`; }
      if (c.foodOnly && sku.category === "personal-care") { eligible = false; reason = "personal care never goes to food banks"; }
      const floor = RULES.floors[sku.category] || 0.35;
      if (!c.baseline && c.id !== "foodbank" && c.pricePct < floor) { eligible = false; reason = `below the ${Math.round(floor * 100)}% floor`; }
      return {
        ...c, name, price, packPrice, pricePctLabel: c.pricePct ? `${Math.round(c.pricePct * 100)}%` : "—", costPerUnit, itcLoss, net, capacity, eligible, reason,
        itc: c.id === "foodbank" || c.baseline ? "reversed" : "retained",
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

  // one exit's line of a plan: its units at the channel's price, less its costs and any input credit lost
  function lineOf(r, units, sku) {
    const gross = r.baseline ? 0 : r2(units * r.price);
    let cost = r2(units * r.costPerUnit);
    if (r.id === "expiresoon") cost = r2(cost + RULES.listingFee);
    const itcLoss = r.baseline ? 0 : r2(units * r.itcLoss);
    // the scheme: kiranas are charged for 10 of every 12 packets at the pack price
    const charged = r.packPrice ? Math.round(units * RULES.scheme.buy / (RULES.scheme.buy + RULES.scheme.free)) : units;
    return { id: r.id, name: r.name, short: r.short, units, price: r.price, packPrice: r.packPrice, charged, gross, cost, itcLoss, net: r2(gross - cost - itcLoss), cartons: units / sku.perCarton };
  }

  function plan(batch, sku) {
    const a = assess(batch, sku);
    const units = a.atRisk;
    const rows = channelTable(batch, sku, units);
    const alloc = allocate(rows, units);
    const lines = alloc.map(x => lineOf(rows.find(y => y.id === x.id), x.units, sku));
    const sum = k => r2(lines.reduce((t, l) => t + l[k], 0));
    const gross = sum("gross"), costs = sum("cost"), itcLoss = sum("itcLoss");
    const net = r2(gross - costs - itcLoss);
    const wo = writeOff(units, sku);
    const leftover = lines.filter(l => l.id === "writeoff").reduce((t, l) => t + l.units, 0);
    const soldUnits = lines.filter(l => l.id !== "foodbank" && l.id !== "writeoff").reduce((t, l) => t + l.units, 0);
    const donated = lines.filter(l => l.id === "foodbank").reduce((t, l) => t + l.units, 0);
    // the P&L reading: the stock leaves the books at cost either way, so it is counted once on each side
    const bookCost = r2(units * sku.cost);
    const leftoverCost = leftover ? r2(leftover * (wo.perUnit - sku.cost)) : 0;
    const pnl = r2(net - bookCost - leftoverCost);
    const best = rows.filter(r => r.eligible && r.unlimited && !r.baseline && r.id !== "foodbank").sort((a, b) => b.net - a.net)[0];
    const alt = best ? { id: best.id, short: best.short, label: `all ${units.toLocaleString("en-IN")} to ${best.short}`, net: r2(units * best.price - units * best.costPerUnit - (best.id === "expiresoon" ? RULES.listingFee : 0)) } : null;
    const kg = r2((units - leftover) * sku.kgPerUnit);
    return {
      batch: batch.id, units, rows, lines, gross, costs, itcLoss, net, pctMRP: Math.round((net / (units * sku.mrp)) * 100),
      writeOff: wo, bookCost, pnl, swing: r2(pnl + wo.total), cashAvoided: r2(wo.total - wo.stock),
      itcRetained: r2(soldUnits * itcOf(sku)), itcReversed: r2((donated + leftover) * itcOf(sku)),
      disposalAvoided: r2(wo.disposal + wo.epr), alt, kg, co2: r2(kg * RULES.co2PerKg), meals: mealsOf(donated, sku), soldUnits, donated, leftover,
    };
  }

  // the meals a donation makes, by the food bank's own rule (SC-110, data.js SETUP.partners): a meal for every so many
  // packs served, or for every so many kilos of food; without a rule, a pack a meal
  function mealsOf(units, sku, rule) {
    if (rule && rule.kg) return Math.floor(r2(units * sku.kgPerUnit) / rule.kg);
    return Math.floor(units / ((rule && rule.packs) || 1));
  }

  // what a plan came to once its lines were done (SC-86): each line on the units its channel actually took (`done`:
  // ordered by kiranas, awarded on ExpireSoon, sold to staff, collected by the food bank; a channel not in `done` took
  // what was planned). What no channel took is left at the godown: nothing recovered, and it still faces the write-off.
  // A plan done as planned comes back as it was. Its meals are counted by the rule of the food bank that collected
  // (`mealsRule`, SC-110).
  function realised(p, sku, done, mealsRule) {
    const took = l => (l.id !== "writeoff" && done && done[l.id] != null ? Math.max(0, done[l.id]) : l.units);
    if (p.lines.every(l => took(l) === l.units)) return { ...p, godown: 0, meals: mealsOf(p.donated, sku, mealsRule) };
    const lines = p.lines.map(l => (took(l) === l.units ? l : lineOf(p.rows.find(r => r.id === l.id), took(l), sku)));
    const sum = k => r2(lines.reduce((t, l) => t + l[k], 0));
    const units = (pred) => lines.filter(pred).reduce((t, l) => t + l.units, 0);
    const gross = sum("gross"), costs = sum("cost"), itcLoss = sum("itcLoss");
    const net = r2(gross - costs - itcLoss);
    const godown = Math.max(0, p.units - units(() => true));
    const soldUnits = units(l => l.id !== "foodbank" && l.id !== "writeoff");
    const donated = units(l => l.id === "foodbank");
    const left = p.leftover + godown;
    const pnl = r2(net - p.bookCost - (left ? r2(left * (p.writeOff.perUnit - sku.cost)) : 0));
    const kg = r2((p.units - left) * sku.kgPerUnit);
    return {
      ...p, lines, gross, costs, itcLoss, net, pctMRP: Math.round((net / (p.units * sku.mrp)) * 100), pnl, swing: r2(pnl + p.writeOff.total),
      itcRetained: r2(soldUnits * itcOf(sku)), itcReversed: r2((donated + p.leftover) * itcOf(sku)), kg, co2: r2(kg * RULES.co2PerKg), meals: mealsOf(donated, sku, mealsRule), soldUnits, donated, godown,
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
    if (!es) return { net: p.net, delta: 0, swing: p.swing };
    const delta = r2(es.units * (es.price - awardPrice));
    return { net: r2(p.net - delta), delta, swing: r2(p.swing - delta), pnl: r2(p.pnl - delta), esPlanned: es.gross, esActual: r2(es.units * awardPrice) };
  }

  // Munchly's price-support credit note to the distributor who owns the stock: the gap between what he paid and what
  // each channel fetched, plus the van and listing fee he paid, so he ends whole. A financial note, no GST adjustment.
  function priceSupport(p, sku, awardPrice) {
    const rows = p.lines.filter(l => l.id !== "writeoff" && l.units > 0).map(l => {
      const price = l.id === "expiresoon" && awardPrice != null ? awardPrice : l.price;
      return { id: l.id, short: l.short, units: l.units, price, gap: r2(sku.dp - price), amount: r2(l.units * (sku.dp - price)) };
    });
    const gap = r2(rows.reduce((t, r) => t + r.amount, 0));
    const paid = p.lines.filter(l => l.id === "kirana" || l.id === "expiresoon");
    const van = r2(paid.filter(l => l.id === "kirana").reduce((t, l) => t + l.cost, 0));
    const fee = paid.some(l => l.id === "expiresoon") ? RULES.listingFee : 0;
    return { rows, gap, van, fee, total: r2(gap + van + fee) };
  }
  // what the distributor would claim at expiry, and what destroying it then costs Munchly on top
  function expiryClaim(units, sku) {
    const wo = writeOff(units, sku); const credit = r2(units * sku.dp);
    return { units, credit, disposal: wo.disposal, epr: wo.epr, itc: wo.itc, total: r2(credit + wo.disposal + wo.epr + wo.itc) };
  }

  // the packs left at the godown on expiry day, settled by the client's expiry policy (SC-94). Full credit: they come
  // back for the dealer price, and the client destroys them, paying disposal and EPR and reversing the GST credit.
  // Price support: the client pays the distributor the gap to what he paid (they fetched nothing, so the dealer price),
  // and he destroys them. No returns: the distributor's loss. An SKU without its dealer price has no credit to work out
  function expirySettlement(units, sku, policy) {
    const wo = writeOff(units, sku);
    const credit = policy === "none" || !units ? 0 : sku.dp == null ? null : r2(units * sku.dp);
    const ours = policy === "full-credit" && units > 0;
    const disposal = ours ? wo.disposal : 0, epr = ours ? wo.epr : 0, itc = ours ? wo.itc : 0;
    return { policy, units, credit, destroyedBy: units ? (ours ? "client" : "distributor") : null, kg: wo.kg, disposal, epr, itc, total: r2((credit || 0) + disposal + epr + itc) };
  }

  // the food bank's receipt for the packs it collected (SC-110), in its own form (data.js SETUP.partners: Feeding
  // India's in-app receipt, India FoodBanking Network's acknowledgement): the packs, their weight and the meals by its
  // own rule, and on a CSR acknowledgement their value at the donor's cost (indicative). `facts` are the collection's:
  // the number from the food bank's series, the day (ISO) and the time, who collected, the donor and its FSSAI licence,
  // the distributor it came through and from where, and where it is served
  function receipt(units, sku, partner, facts) {
    const r = partner.receipt;
    return {
      id: "receipt", type: r.title, owner: partner.name, no: facts.no, status: "generated", amount: 0, paper: partner.paper, stamp: r.stamp,
      units, kg: r2(units * sku.kgPerUnit), meals: mealsOf(units, sku, partner.meals), mealsRule: partner.meals.rule,
      value: r.csr ? r2(units * sku.cost) : null, csr: r.csr || null,
      date: facts.date, at: facts.at, by: facts.by, donor: facts.donor, fssai: facts.fssai, via: facts.via, from: facts.from, spot: facts.spot, note: r.note,
    };
  }

  // the batch's document pack; a donated batch's carries the food bank's receipt beside the FSSAI checklist (SC-110)
  function documents(p, sku, aw, support, parties, rcpt) {
    const es = p.lines.find(l => l.id === "expiresoon");
    const docs = [];
    if (es && aw) {
      // tax is rounded to the rupee (CGST s.170); the invoice total takes a round-off line
      const taxable = r2(aw.units * aw.price), igst = Math.round(taxable * sku.gst), exact = r2(taxable + igst), total = Math.round(exact);
      docs.push({ id: "invoice", type: "Tax invoice", owner: parties.seller.name, no: "INV/26-27/0931", status: "drafted", amount: total, taxable, igst, roundOff: r2(total - exact), total, units: aw.units, price: aw.price, from: parties.seller, to: parties.buyer, hsn: sku.hsn, gstPct: Math.round(sku.gst * 100), note: `Drafted for ${parties.seller.short || parties.seller.name} to issue from Tally.` });
      docs.push({ id: "eway", type: "E-way bill check", owner: parties.seller.name, no: p.batch, status: total < RULES.ewayThreshold ? "not required" : "generated", amount: total, note: `The consignment is ₹${total.toLocaleString("en-IN")} with GST, under the ₹${RULES.ewayThreshold.toLocaleString("en-IN")} threshold. Checked again if the dispatch is split.` });
    }
    const exact = support.total, total = Math.round(exact);
    docs.push({ id: "support", type: "Price-support credit note", owner: parties.client.short, no: "CN/0117", status: "generated", amount: total, exact, roundOff: r2(total - exact), rows: support.rows, van: support.van, fee: support.fee, note: `${parties.client.short} to ${parties.seller.name}: a financial credit note, no GST adjustment.` });
    docs.push({ id: "itc", type: "GST ITC memo", owner: parties.client.short, no: "s.17(5)(h)", status: "generated", amount: p.itcRetained, note: "Goods supplied under tax invoices, so the Section 17(5)(h) reversal does not apply." });
    docs.push({ id: "fssai", type: "FSSAI surplus-food checklist", owner: parties.client.short, no: p.donated ? `${p.donated} units` : "no donation", status: p.donated ? "generated" : "not required", amount: 0 });
    if (rcpt) docs.push(rcpt);
    docs.push({ id: "destruction", type: "Destruction certificate", owner: parties.client.short, no: p.leftover ? `${p.leftover} units` : "0 units left", status: p.leftover ? "generated" : "not required", amount: 0 });
    return docs;
  }

  // formatting: Indian digit grouping, rupees, lakhs
  const fmt = {
    num: n => Math.round(n).toLocaleString("en-IN"),
    inr: n => (n < 0 ? "−₹" : "₹") + Math.round(Math.abs(n)).toLocaleString("en-IN"),
    inr2: n => (n < 0 ? "−₹" : "₹") + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    signed: n => (n < 0 ? "−₹" : "+₹") + Math.round(Math.abs(n)).toLocaleString("en-IN"),
    rate: n => "₹" + n.toFixed(2),
    lakh: n => "₹" + (n / 100000).toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " L",
    kg: n => (n >= 1000 ? (n / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " t" : n.toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " kg"),
    pct: n => Math.round(n * 100) + "%",
    date: iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    day: iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  };

  window.SC3_MONEY = { RULES, CHANNELS, lifeOf, itcOf, gates, assess, writeOff, channelTable, allocate, plan, counter, award, actualNet, realised, mealsOf, receipt, priceSupport, expiryClaim, expirySettlement, documents, fmt };
})();

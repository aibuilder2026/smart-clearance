/* SC-121's mockups: Munchly's history, the twelve batches cleared in its pilot quarter (Q2 FY27, Jul to Sep 2026) and
   the story's own batch in Q3, every figure worked out by core/money.js. The maintainer's answers (9 Oct): Munchly
   live since 1 Jul; 7 sold through, 3 with packs left at the godown settled at full credit, 2 with a donation; the six
   SKUs without a cost sheet priced at the chips' ratios (fictional). SC-123 moves this into core/data.js and builds it
   in backend-api through the journey's steps; SC-122 moves the `realised` below into money.js. */
(function () {
  const M = window.SC3_MONEY, D = window.SC3_DATA;
  const r2 = n => Math.round(n * 100) / 100;
  const floorHalf = n => Math.floor(n * 2) / 2;
  const addDays = (iso, n) => new Date(Date.parse(iso + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const pad = (n, w) => String(n).padStart(w, "0");

  // the six SKUs without a cost sheet, at the chips' ratios: a dealer price of 22/30 of the MRP (to the ₹0.50 below, as
  // the Mango Drink's ₹14.50), and input GST of the chips' ₹0.90 on ₹16 of cost, at the SKU's own GST rate
  const CHIPS = D.SKUS.chips;
  const sku = id => {
    const s = { ...D.SKUS[id] };
    if (s.dp == null) s.dp = floorHalf((s.mrp * CHIPS.dp) / CHIPS.mrp);
    if (s.itcPerUnit == null) s.itcPerUnit = r2(s.cost * (CHIPS.itcPerUnit / CHIPS.cost) * (s.gst / CHIPS.gst));
    return s;
  };

  // SC-122: what a plan came to, with the packs left at the godown settled by the client's expiry policy. Under full
  // credit the client destroys them, so their input credit is reversed (s.17(5)(h)); the costs avoided count only the
  // packs that were not destroyed
  function realised(p, s, done, policy, mealsRule) {
    const r = M.realised(p, s, done, mealsRule);
    const godown = r.godown || 0, itc = M.itcOf(s), wo = p.writeOff, ours = policy === "full-credit";
    const left = p.leftover + godown;
    return {
      ...r,
      itcRetained: r2((r.soldUnits + (ours ? 0 : godown)) * itc),
      itcReversed: r2((r.donated + p.leftover + (ours ? godown : 0)) * itc),
      cashAvoided: r2(wo.total - wo.stock - left * (wo.perUnit - s.cost)),
      disposalAvoided: r2((p.units - left) * M.RULES.disposalPerUnit + r.kg * M.RULES.eprPerKg),
      destroyed: p.leftover + (ours ? godown : 0),
    };
  }

  const FI = D.SETUP.partners.find(p => p.name === "Feeding India");
  const IFBN = D.SETUP.partners.find(p => p.name === "India FoodBanking Network");
  // ref, SKU, distributor, packs, days left and sales a day when the Watcher flagged it, the day it flagged it, and what
  // happened: sold through, left at the godown (the kiranas ordered fewer), or a donation to the food bank named
  const PAST = [
    ["MF-2406-105", "biscuits", "rakesh", 1400, 42, 10, "2026-07-03", "sold"],
    ["MF-2406-106", "chikki", "lakshmi", 1600, 38, 14, "2026-07-08", "sold"],
    ["MF-2406-107", "oats", "lakshmi", 800, 40, 5, "2026-07-14", "leftover", { kirana: 180 }],
    ["MF-2406-108", "poha", "rakesh", 900, 45, 6, "2026-07-21", "sold"],
    ["MF-2406-109", "poha", "lakshmi", 1100, 26, 8, "2026-07-28", "donation", { partner: FI }],
    ["MF-2407-110", "facewash", "rakesh", 520, 48, 3, "2026-08-04", "sold"],
    ["MF-2407-111", "mango", "rakesh", 1700, 36, 16, "2026-08-10", "leftover", { kirana: 600 }],
    ["MF-2407-112", "hairoil", "lakshmi", 480, 44, 3, "2026-08-17", "sold"],
    ["MF-2407-113", "oats", "rakesh", 900, 22, 6, "2026-08-24", "donation", { partner: IFBN }],
    ["MF-2407-114", "chikki", "rakesh", 1500, 31, 12, "2026-08-27", "leftover", { kirana: 456 }],
    ["MF-2407-115", "chips", "lakshmi", 1500, 40, 13, "2026-08-31", "sold"],
    ["MF-2408-116", "biscuits", "lakshmi", 1300, 34, 11, "2026-09-07", "sold"],
  ];

  // the papers' numbers, below the story's (INV/26-27/0931, CN/0117, ES-24117, FI/HYD/26-27/0417, IFBN/ACK/26-27/0112),
  // given in the order the papers were issued
  const papersOf = [];
  const batches = PAST.map(([ref, skuId, distId, units, daysLeft, sellPerDay, flagged, outcome, x = {}], i) => {
    const s = sku(skuId), d = D.DISTRIBUTORS[distId];
    const bestBefore = addDays(flagged, daysLeft);
    const batch = { id: ref, sku: skuId, distributor: distId, units, daysLeft, sellPerDay, bestBefore, mfg: addDays(bestBefore, -s.lifeDays), city: d.city, staffCap: d.staffCap };
    const p = M.plan(batch, s);
    const es = p.lines.find(l => l.id === "expiresoon");
    const price = es ? Math.floor(es.price * M.RULES.negotiation.counterPctOfAsk * 10) / 10 : null; // the counter, taken
    const partner = x.partner || null;
    const r = realised(p, s, x.kirana != null ? { kirana: x.kirana } : null, "full-credit", partner && partner.meals);
    const actual = es ? M.actualNet(r, price) : { net: r.net, delta: 0, swing: r.swing, pnl: r.pnl };
    const support = M.priceSupport(r, s, price);
    const expiry = r.godown ? M.expirySettlement(r.godown, s, "full-credit") : null;
    const returnBy = addDays(bestBefore, -M.RULES.returnWindowDays);
    const papersOn = addDays(flagged, outcome === "donation" ? 6 : 9);
    const cleared = outcome === "leftover" ? bestBefore : [returnBy, addDays(flagged, 10)].sort().pop();
    const awardOn = addDays(flagged, 5);
    const kirana = p.lines.find(l => l.id === "kirana");
    const ordered = kirana ? (x.kirana != null ? x.kirana : kirana.units) : 0;
    const b = {
      ref, sku: s, dist: d, units, daysLeft, flagged, bestBefore, returnBy, cleared, outcome, plan: p, realised: r, actual, price, support, expiry, partner,
      award: es && price ? M.award(es.units, price) : null, kirana: kirana ? { planned: kirana.units, ordered } : null,
      ledger: {
        net: actual.net, swing: actual.swing, pnl: actual.pnl, writeOff: p.writeOff.total, itcKept: r.itcRetained, itcReversed: r.itcReversed,
        kg: r.kg, co2: r.co2, meals: r.meals, donated: r.donated, godown: r.godown, destroyedKg: r2(r.destroyed * s.kgPerUnit),
        resoldKg: r2(r.soldUnits * s.kgPerUnit), donatedKg: r2(r.donated * s.kgPerUnit), credit: expiry ? expiry.credit : 0, support: support.total,
      },
    };
    if (es) papersOf.push({ b, kind: "invoice", on: awardOn }, { b, kind: "listing", on: addDays(flagged, 3) });
    papersOf.push({ b, kind: "support", on: papersOn });
    if (expiry) papersOf.push({ b, kind: "expiry", on: bestBefore });
    if (partner) papersOf.push({ b, kind: "receipt", on: addDays(flagged, 4) });
    return b;
  });

  // number every paper in issue order, back from the story's next number
  const NEXT = { invoice: ["INV/26-27/", 931, 4], listing: ["ES-", 24117, 5], support: ["CN/", 117, 4], expiry: ["CN/", 117, 4] };
  const counts = {};
  papersOf.forEach(x => { const k = x.kind === "expiry" ? "support" : x.kind; counts[k] = (counts[k] || 0) + 1; });
  const used = {};
  papersOf.sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0)).forEach(x => {
    if (x.kind === "receipt") return;
    const key = x.kind === "expiry" ? "support" : x.kind;
    const [prefix, next, w] = NEXT[x.kind];
    used[key] = (used[key] || 0) + 1;
    x.b.numbers = x.b.numbers || {};
    x.b.numbers[x.kind] = prefix + pad(next - counts[key] + used[key] - 1, w);
  });
  const receipts = { "Feeding India": ["FI/HYD/26-27/", 416], "India FoodBanking Network": ["IFBN/ACK/26-27/", 111] };
  batches.forEach(b => {
    b.numbers = b.numbers || {};
    const cityCode = b.dist.city.slice(0, 3).toUpperCase();
    if (b.partner) b.numbers.receipt = b.partner.name === "Feeding India" ? `FI/${cityCode}/26-27/0${receipts["Feeding India"][1]}` : `IFBN/ACK/26-27/0${receipts["India FoodBanking Network"][1]}`;
    const s = b.sku, parties = { client: D.CLIENT, seller: b.dist, buyer: D.BUYER };
    const docs = M.documents(b.realised, s, b.award, b.support, parties, b.partner ? M.receipt(b.realised.donated, s, b.partner, { no: b.numbers.receipt, date: addDays(b.flagged, 4), at: "11:30", by: "the food bank's volunteers", donor: D.CLIENT.name, fssai: "11524999000123", via: b.dist.name, from: b.dist.godown, spot: `${b.dist.city} hunger spots` }) : null);
    b.docs = docs.map(doc => {
      const o = { ...doc };
      if (o.id === "invoice") { o.no = b.numbers.invoice; o.status = "generated"; o.issued = addDays(b.flagged, 6); }
      if (o.id === "support") o.no = b.numbers.support;
      if (o.id === "itc") { o.amount = b.realised.itcRetained; o.reversed = b.realised.itcReversed; o.status = "generated"; }
      if (o.id === "destruction") { const n = b.realised.destroyed; o.no = n ? `${n} units` : "0 units left"; o.status = n ? "generated" : "not required"; o.units = n; }
      return o;
    });
    if (b.expiry) b.docs.push({ id: "expiry", type: "Expiry credit note", owner: D.CLIENT.short, no: b.numbers.expiry, status: "generated", amount: b.expiry.credit, units: b.expiry.units, note: "A financial credit note, no GST adjustment." });
    b.reviewed = { by: "Anita Rao", on: b.cleared };
    b.listingId = b.numbers.listing || null;
  });

  // the quarter the story runs in (Q3 FY27): its own batch, cleared after the return window, and the Mango Drink still
  // out; the story's figures, from data.js
  const story = {
    ref: D.BATCHES[0].id, sku: CHIPS, dist: D.DISTRIBUTORS.rakesh, flagged: "2026-10-02", cleared: "2026-10-29", outcome: "sold", story: true,
    ledger: { net: D.ACTUAL.net, swing: D.ACTUAL.swing, pnl: D.ACTUAL.pnl, writeOff: D.PLAN.writeOff.total, itcKept: D.PLAN.itcRetained, itcReversed: D.PLAN.itcReversed, kg: D.PLAN.kg, co2: D.PLAN.co2, meals: 0, donated: 0, godown: 0, destroyedKg: 0, resoldKg: D.PLAN.kg, donatedKg: 0, credit: 0, support: D.SUPPORT ? D.SUPPORT.total : 8767.6 },
    numbers: { invoice: D.INVOICE.no, support: "CN/0117", listing: D.JOURNEY.listing.id },
  };
  const inFlight = [{ ref: D.BATCHES[1].id, sku: D.SKUS.mango, dist: D.DISTRIBUTORS.lakshmi, flagged: "2026-10-02", outcome: "open", stage: "Execute", note: "Kirana scheme open, staff sale and pickup booked" }];

  const PERIODS = [
    { id: "q2", label: "Q2 FY27", long: "Jul to Sep 2026", from: "2026-07-01", to: "2026-09-30" },
    { id: "q3", label: "Q3 FY27", long: "Oct to Dec 2026 · so far", from: "2026-10-01", to: "2026-12-31" },
    { id: "ytd", label: "This year", long: "FY 2026-27 so far, since Munchly went live on 1 Jul", from: "2026-04-01", to: "2027-03-31" },
  ];
  const all = [...batches, story];
  const inPeriod = id => { const p = PERIODS.find(x => x.id === id); return all.filter(b => b.cleared >= p.from && b.cleared <= p.to); };
  const sum = (list, k) => r2(list.reduce((t, b) => t + (b.ledger[k] || 0), 0));
  const totals = list => ({
    batches: list.length, net: sum(list, "net"), writeOff: sum(list, "writeOff"), swing: sum(list, "swing"), itcKept: sum(list, "itcKept"), itcReversed: sum(list, "itcReversed"),
    kg: sum(list, "kg"), co2: sum(list, "co2"), meals: sum(list, "meals"), godown: sum(list, "godown"), destroyedKg: sum(list, "destroyedKg"), resoldKg: sum(list, "resoldKg"), donatedKg: sum(list, "donatedKg"),
    credit: sum(list, "credit"), support: sum(list, "support"),
    sold: list.filter(b => b.outcome === "sold").length, leftover: list.filter(b => b.outcome === "leftover").length, donation: list.filter(b => b.outcome === "donation").length,
    creditNotes: list.reduce((t, b) => t + (b.numbers && b.numbers.support ? 1 : 0) + (b.numbers && b.numbers.expiry ? 1 : 0), 0),
    invoices: list.filter(b => b.numbers && b.numbers.invoice).length,
  });
  const OUTCOME = {
    sold: { label: "Sold through", tone: "green", icon: "check" },
    leftover: { label: "Left at the godown", tone: undefined, icon: "warehouse" },
    donation: { label: "Donated", tone: undefined, icon: "heart-handshake" },
    open: { label: "In flight", tone: "blue", icon: "loader" },
  };

  window.SC121 = { batches, story, inFlight, all, PERIODS, inPeriod, totals, OUTCOME, sku, addDays, r2 };
})();

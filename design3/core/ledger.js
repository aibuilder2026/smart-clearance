// Smart-Clearance v3 · the ledger (SC-121, SC-124): every batch Munchly has cleared, as Priya reads it.
//
// Each batch Munchly cleared before the story (data.js HISTORY, SC-123) gets its case here, in the shape the screens
// read a batch in (core's CaseData): its papers as money.js drafts them, numbered and dated as backend-api's history
// issues them, and the kiranas' orders spread over its distributor's shops as the history places them. The story's own
// batch joins once Impact has posted it. Each cleared case is a row of the ledger, and the rows fall into periods: each
// quarter of the Indian financial year from the first batch cleared to today's, then each year so far. backend-api's
// ledger.py works the same out from the ledgers Impact posted; seed.mjs writes this file's answers for the history into
// its reference data, and its tests hold the two together.
(function () {
  const D = window.SC3_DATA, M = window.SC3_MONEY, W = window.SC3_WORLD;
  const r2 = n => Math.round(n * 100) / 100;
  const AT = D.HISTORY_AT;

  // where a food bank serves a donation: the spot the story names for its city, else its own there (copy.serving_spot)
  const SPOTS = { [D.JOURNEY.donation.partner]: { [D.DISTRIBUTORS[D.BATCHES[1].distributor].city]: D.JOURNEY.donation.spot } };
  const spotOf = (partner, city) => (SPOTS[partner] || {})[city] || `${partner}'s serving point in ${city}`;
  const NONE = id => ({ id, name: "", short: "", units: 0, price: 0, gross: 0, cost: 0, net: 0 });
  const C = D.WORKSPACE.short;

  // the kiranas' orders, each shop within 4 × its 14-day sales, in the order the distributor's shops are listed
  // (history.py _orders)
  function ordersOf(distId, units) {
    const cap = M.RULES.shopCapTimes, out = [];
    let left = units;
    for (const k of W.KIRANAS.filter(x => x.distributor === distId)) {
      if (left <= 0) break;
      const n = Math.min(k.sales14 * cap, left);
      out.push({ kirana: k.id, name: k.name, area: k.area, units: n });
      left -= n;
    }
    return out;
  }

  /* ---------- a history batch's case ---------- */
  function historyCase(h) {
    const sku = D.SKUS[h.sku], dist = D.DISTRIBUTORS[h.distributor], n = h.numbers || {};
    const when = k => (h.steps.find(s => s.step === k) || {}).at || null;
    const day = k => (when(k) || "").slice(0, 10) || null;
    const batch = { id: h.ref, sku: h.sku, distributor: h.distributor, units: h.units, daysLeft: h.daysLeft, sellPerDay: h.sellPerDay, bestBefore: h.bestBefore, mfg: h.mfg, city: dist.city, staffCap: dist.staffCap };
    batch.assess = M.assess(batch, sku); // the Watcher's reading the day it flagged the batch
    const line = id => h.plan.lines.find(l => l.id === id && l.units > 0) || null;
    const kl = line("kirana"), es = line("expiresoon"), fb = line("foodbank");
    const partner = h.partner ? D.SETUP.partners.find(p => p.name === h.partner) : null;
    // the food bank's receipt, issued as it collects (SC-110)
    const receipt = partner ? Object.assign(M.receipt(fb.units, sku, partner, {
      no: n.receipt, date: day("collect"), at: AT.collect[1], by: D.PEOPLE.meera.name, donor: D.CLIENT.name, fssai: D.CLIENT.fssai,
      via: dist.name, from: dist.godown ? `${dist.godown}, ${dist.city}` : dist.city, spot: spotOf(partner.name, dist.city),
    })) : null;
    // the pack Paperwork drafts once every line is done, numbered as it was issued; on expiry day the packs left at the
    // godown settle at full credit, on a credit note of their own (SC-94)
    const docs = M.documents(h.realised, sku, h.award, h.support, h.parties, receipt).map(d => {
      if (d.id === "receipt") return d;
      const o = Object.assign({}, d, { date: day("papers") });
      if (d.id === "invoice") o.no = n.invoice;
      if (d.id === "support") o.no = n.support;
      return o;
    });
    if (h.expiry && h.expiry.units) {
      const x = h.expiry, at = dist.godown || `${dist.city} godown`;
      docs.push({ id: "expiry", type: "Expiry credit note", owner: D.CLIENT.short, no: n.expiry, status: "generated", amount: x.credit, units: x.units, policy: x.policy, destroyedBy: x.destroyedBy,
        disposal: x.disposal, epr: x.epr, itc: x.itc, date: h.bestBefore,
        note: `The ${M.fmt.num(x.units)} packs that expired at ${at} come back to ${C} for full credit (${M.fmt.inr(x.credit)}), and ${C} destroys them.` });
    }
    const orders = kl ? ordersOf(h.distributor, h.kirana.ordered) : [];
    return {
      ref: h.ref, history: true, outcome: h.outcome, flagged: h.flagged, cleared: h.bestBefore, numbers: n, steps: h.steps,
      batch, sku, dist, buyer: D.BUYER, plan: h.plan, realised: h.realised, actual: h.actual,
      lines: { kirana: kl || NONE("kirana"), expiresoon: es || NONE("expiresoon") },
      award: h.award ? Object.assign({}, h.award, { price: h.price, bid: h.bid }) : null,
      support: h.support, supportPlan: M.priceSupport(h.plan, sku), claim: M.expiryClaim(h.plan.units, sku),
      docs, invoice: docs.find(d => d.id === "invoice") || null, receipt,
      returnBy: D.addDays(h.bestBefore, -M.RULES.returnWindowDays), expiry: h.expiry,
      listing: n.listing ? { id: n.listing, units: es ? es.units : 0 } : null,
      kiranas: orders, offered: kl ? W.KIRANAS.filter(k => k.distributor === h.distributor).length : 0, scheme: M.RULES.scheme,
      kirana: h.kirana, staff: h.staff, partner,
      donation: partner ? { batch, sku, dist, partner, units: fb.units, from: dist.godown, spot: spotOf(partner.name, dist.city), receipt } : null,
      issued: when("invoice"), reviewed: { by: "priya", at: when("review") },
    };
  }
  const HISTORY = D.HISTORY.batches.map(historyCase);

  /* ---------- the ledger's row for a cleared batch ---------- */
  const FIGURES = ["net", "swing", "pnl", "writeOff", "itcKept", "itcReversed", "kg", "co2", "meals", "units", "sold", "donated", "godown", "destroyed", "resoldKg", "donatedKg", "destroyedKg", "packResoldKg", "packDonatedKg", "packDestroyedKg", "credit", "support"];
  const SOLD = ["kirana", "expiresoon", "staff"];
  const outcomeOf = (godown, donated) => (godown ? "leftover" : donated ? "donation" : "sold");

  // what a cleared case came to (backend-api: the ledger Impact posted), and its papers
  function rowOf(c) {
    const r = c.realised, lines = r.lines.filter(l => l.id !== "writeoff");
    const took = id => (lines.find(l => l.id === id) || { units: 0 }).units;
    const sold = SOLD.reduce((t, id) => t + took(id), 0), donated = took("foodbank"), godown = r.godown || 0;
    const destroyed = r.destroyed != null ? r.destroyed : r.leftover;
    const kg = c.sku.kgPerUnit, pack = c.sku.packKg || 0, support = c.docs.find(d => d.id === "support");
    const priceOf = l => (l.id === "expiresoon" && c.award ? c.award.price : l.price);
    return {
      ref: c.batch.id, sku: c.sku.id, name: c.sku.name, img: c.sku.img, distributor: c.dist.id, distributorName: c.dist.name, city: c.dist.city,
      flagged: c.flagged, cleared: c.cleared, outcome: outcomeOf(godown, donated), history: !!c.history,
      figures: {
        net: c.actual.net, swing: c.actual.swing, pnl: c.actual.pnl, writeOff: c.plan.writeOff.total, itcKept: r.itcRetained, itcReversed: r.itcReversed,
        kg: r.kg, co2: r.co2, meals: r.meals, units: c.plan.units, sold, donated, godown, destroyed,
        resoldKg: r2(sold * kg), donatedKg: r2(donated * kg), destroyedKg: r2(destroyed * kg),
        // the plastic packaging on those packs (SC-125): it goes where its pack goes
        packResoldKg: r2(sold * pack), packDonatedKg: r2(donated * pack), packDestroyedKg: r2(destroyed * pack),
        credit: c.expiry && c.expiry.policy !== "none" ? c.expiry.credit || 0 : 0, support: support ? support.amount : 0,
      },
      lines: lines.filter(l => l.units).map(l => ({ id: l.id, short: l.short, units: l.units, price: priceOf(l), gross: l.id === "expiresoon" && c.award ? r2(l.units * c.award.price) : l.gross })),
      papers: c.docs.map(d => ({ id: d.id, type: d.type, no: d.no, status: d.status, date: d.date || null, amount: d.total != null ? d.total : d.amount != null ? d.amount : null, pdf: !!d.pdf })),
      reviewed: c.reviewed ? { by: c.reviewed.by, at: c.reviewed.at || null } : null,
    };
  }

  /* ---------- the periods ---------- */
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const MIX = { kirana: "Kirana scheme", expiresoon: "ExpireSoon", staff: "Staff sale", foodbank: "Food bank", writeoff: "Destroyed" };
  const FOOD = "Food waste: packaged food past quick-commerce gates", PLASTIC = "Plastic packaging (EPR)";
  const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const fyOf = d => (+d.slice(5, 7) >= 4 ? +d.slice(0, 4) + 1 : +d.slice(0, 4));
  const quarterOf = d => Math.floor(((+d.slice(5, 7) - 4 + 12) % 12) / 3) + 1;
  function quarterSpan(fy, q) {
    const month = [4, 7, 10, 1][q - 1], year = q < 4 ? fy - 1 : fy;
    const end = new Date(Date.UTC(year, month - 1 + 3, 0));
    return [iso(year, month, 1), end.toISOString().slice(0, 10)];
  }

  function totals(rows) {
    const t = {};
    FIGURES.forEach(k => (t[k] = r2(rows.reduce((s, r) => s + r.figures[k], 0))));
    ["meals", "units", "sold", "donated", "godown", "destroyed"].forEach(k => (t[k] = Math.trunc(t[k])));
    t.co2 = r2(t.kg * M.RULES.co2PerKg); // CO₂e is the kilos kept out of landfill × the factor
    const papers = rows.flatMap(r => r.papers).filter(p => p.status !== "not required");
    const count = id => papers.filter(p => p.id === id).length;
    return Object.assign(t, {
      batches: rows.length,
      outcomes: { sold: rows.filter(r => r.outcome === "sold").length, leftover: rows.filter(r => r.outcome === "leftover").length, donation: rows.filter(r => r.outcome === "donation").length },
      invoices: count("invoice"), creditNotes: count("support") + count("expiry"), receipts: count("receipt"), reviewed: rows.filter(r => r.reviewed).length,
    });
  }

  // the share of the packs each channel took, in whole percent that add up to 100 (the largest remainders)
  function mixOf(rows) {
    const took = {};
    rows.forEach(r => { r.lines.forEach(l => (took[l.id] = (took[l.id] || 0) + (l.units || 0))); took.writeoff = (took.writeoff || 0) + r.figures.destroyed; });
    const whole = Object.values(took).reduce((a, b) => a + b, 0);
    if (!whole) return [];
    const ids = Object.keys(MIX).filter(k => took[k]);
    const exact = Object.fromEntries(ids.map(k => [k, (took[k] * 100) / whole])), pct = Object.fromEntries(ids.map(k => [k, Math.floor(exact[k])]));
    const short = 100 - ids.reduce((s, k) => s + pct[k], 0);
    ids.slice().sort((a, b) => exact[b] - pct[b] - (exact[a] - pct[a])).slice(0, short).forEach(k => (pct[k] += 1));
    return ids.map(k => [k, pct[k]]);
  }

  function evidence(rows, t) {
    const orders = rows.reduce((s, r) => s + r.lines.filter(l => l.id === "kirana").reduce((a, l) => a + l.units, 0), 0);
    const listings = rows.filter(r => r.lines.some(l => l.id === "expiresoon")).length;
    const destroyed = rows.filter(r => r.figures.destroyed).length;
    return [t.invoices && `${t.invoices} tax invoices`, listings && `${listings} ExpireSoon listings`, orders && `kirana order logs for ${M.fmt.num(orders)} packs`,
      t.receipts && `${t.receipts} food-bank receipts`, destroyed && `${destroyed} destruction certificates`].filter(Boolean).join(", ");
  }
  // BRSR Principle 6's waste rows, in kilos: what was diverted from disposal (resold or donated) and what was destroyed,
  // of the food and of its plastic packaging (SC-125), which goes where its pack goes
  function brsr(rows, t) {
    if (!rows.length) return [];
    const out = [{ cat: FOOD, diverted: t.kg, resold: t.resoldKg, donated: t.donatedKg, disposed: t.destroyedKg, evidence: evidence(rows, t) }];
    const skus = new Set(rows.map(r => r.sku)).size;
    if (t.packResoldKg + t.packDonatedKg + t.packDestroyedKg > 0)
      out.push({ cat: PLASTIC, diverted: r2(t.packResoldKg + t.packDonatedKg), resold: t.packResoldKg, donated: t.packDonatedKg, disposed: t.packDestroyedKg, evidence: `${skus} SKUs' packaging weights (indicative), on the same papers` });
    return out;
  }

  // the quarter's 13 weeks (the last takes its odd day or two): recovered, and what the same batches would have cost
  function weeksOf(rows, start) {
    const out = Array.from({ length: 13 }, (_, i) => [`W${i + 1}`, 0, 0]);
    rows.forEach(r => {
      const i = Math.min(Math.floor((Date.parse(r.cleared) - Date.parse(start)) / 864e5 / 7), 12);
      out[i][1] = r2(out[i][1] + r.figures.net);
      out[i][2] = r2(out[i][2] + r.figures.writeOff);
    });
    return out;
  }
  function monthsOf(rows) {
    const by = {};
    rows.forEach(r => (by[r.cleared.slice(0, 7)] = by[r.cleared.slice(0, 7)] || []).push(r));
    return Object.keys(by).sort().map(k => ({ month: k, label: `${MONTH_NAMES[+k.slice(5) - 1]} ${k.slice(0, 4)}`, totals: totals(by[k]) }));
  }
  function period(id, label, long, from, to, rows, current, kind) {
    const inside = rows.filter(r => r.cleared >= from && r.cleared <= to), t = totals(inside);
    return { id, kind, label, long, from, to, current, totals: t, months: monthsOf(inside), weeks: kind === "quarter" ? weeksOf(inside, from) : [], mix: mixOf(inside), mixNames: MIX, brsr: brsr(inside, t) };
  }
  // every quarter from the first batch cleared to today's, then each financial year so far
  function periods(rows, today) {
    const first = rows.reduce((a, r) => (r.cleared < a ? r.cleared : a), today);
    let fy = fyOf(first), q = quarterOf(first);
    const now = [fyOf(today), quarterOf(today)], out = [], years = [];
    const before = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]);
    while (before([fy, q], now)) {
      const [from, to] = quarterSpan(fy, q), current = fy === now[0] && q === now[1];
      const span = `${MONTHS[+from.slice(5, 7) - 1]} to ${MONTHS[+to.slice(5, 7) - 1]} ${to.slice(0, 4)}`;
      out.push(period(`fy${String(fy % 100).padStart(2, "0")}-q${q}`, `Q${q} FY${String(fy % 100).padStart(2, "0")}`, span + (current ? " · so far" : ""), from, to, rows, current, "quarter"));
      if (!years.includes(fy)) years.push(fy);
      if (q < 4) q += 1; else { fy += 1; q = 1; }
    }
    years.forEach(y => {
      const current = y === now[0], name = `FY ${y - 1}-${String(y % 100).padStart(2, "0")}`;
      out.push(period(`fy${String(y % 100).padStart(2, "0")}`, current ? "This year" : name, current ? `${name} so far` : name, iso(y - 1, 4, 1), iso(y, 3, 31), rows, current, "year"));
    });
    return out;
  }

  /* ---------- the stub's ledger: the history and the story's own batches ---------- */
  const HERO = D.BATCHES.find(b => b.hero), SECOND = D.BATCHES.find(b => b.second);
  // the story's chips batch, once Impact has posted it: trued up the day after the return window closes
  const STORY_CLEARED = D.addDays(D.RETURN_BY, 1);
  function storyCase() {
    const sku = D.SKUS[HERO.sku], dist = D.DISTRIBUTORS[HERO.distributor];
    const realised = Object.assign({}, D.PLAN, { godown: 0, destroyed: D.PLAN.leftover });
    return {
      ref: HERO.id, history: false, outcome: "sold", flagged: D.DAY0, cleared: STORY_CLEARED, numbers: { invoice: D.INVOICE.no, support: "CN/0117", listing: D.JOURNEY.listing.id },
      batch: HERO, sku, dist, buyer: D.BUYER, plan: D.PLAN, realised, actual: D.ACTUAL,
      lines: { kirana: D.PLAN.lines.find(l => l.id === "kirana"), expiresoon: D.PLAN.lines.find(l => l.id === "expiresoon") },
      award: D.AWARD, support: D.SUPPORT, supportPlan: D.SUPPORT_PLAN, claim: D.CLAIM, docs: D.DOCS, invoice: D.INVOICE, receipt: null, returnBy: D.RETURN_BY, expiry: null,
      listing: D.JOURNEY.listing, kiranas: D.KIRANAS, offered: D.OFFERED, scheme: M.RULES.scheme, kirana: null, staff: null, partner: null,
      // the batch the same agents donate, which the FSSAI checklist points to (data.js MANGO_*)
      donation: { batch: SECOND, sku: D.SKUS[SECOND.sku], dist: D.DISTRIBUTORS[SECOND.distributor], units: D.MANGO_FB, partner: D.SETUP.partners.find(p => p.name === D.JOURNEY.donation.partner) },
      issued: null, reviewed: { by: "priya", at: null },
    };
  }
  // a batch's case by its ref: the history's, or the story's chips batch
  const caseOf = ref => HISTORY.find(c => c.ref === ref) || (ref === HERO.id ? storyCase() : null);

  // the ledger as the stub reads it, from the journey's state: the history, the chips batch once posted, and the story's
  // batches still out
  // cleared cases as the ledger's rows, in the order they cleared
  const rowsOf = cases => cases.map(rowOf).sort((a, b) => (a.cleared < b.cleared ? -1 : a.cleared > b.cleared ? 1 : a.ref < b.ref ? -1 : 1));
  function ledger(state) {
    const h = state.hero, rows = rowsOf(h.posted ? HISTORY.concat([storyCase()]) : HISTORY);
    const today = h.posted ? STORY_CLEARED : D.DAY0;
    const open = b => ({ ref: b.id, sku: b.sku, name: D.SKUS[b.sku].name, img: D.SKUS[b.sku].img, distributor: b.distributor, distributorName: D.DISTRIBUTORS[b.distributor].name, city: D.DISTRIBUTORS[b.distributor].city, flagged: D.DAY0 });
    const inFlight = [];
    if (!h.posted && h.phase !== "watching") inFlight.push(Object.assign(open(HERO), { phase: h.phase, stage: window.SC3_FLOW.STAGE_IDS[window.SC3_FLOW.stageOf(state)] }));
    inFlight.push(Object.assign(open(SECOND), { phase: state.mango.phase, stage: "execute" }));
    return { since: D.WORKSPACE.since, today, co2PerKg: M.RULES.co2PerKg, periods: periods(rows, today), batches: rows, inFlight };
  }

  /* ---------- the partners' own history (SC-130): what a distributor, a kirana and a food bank each read ---------- */
  const stepAt = (c, k) => ((c.steps || []).find(s => s.step === k) || {}).at || null;
  const took = (c, id) => c.realised.lines.find(l => l.id === id && l.units > 0) || null;
  const planned = (c, id) => c.plan.lines.find(l => l.id === id && l.units > 0) || null;
  const rate = n => "₹" + n.toFixed(2);
  const num = n => M.fmt.num(n);
  const weekday = iso => new Date(iso.slice(0, 10) + "T00:00:00+05:30").toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
  // an IST time (2026-08-27T12:10) some hours on
  const plusHours = (iso, h) => { const t = new Date(new Date(iso + ":00+05:30").getTime() + (h + 5.5) * 3600e3); const p = x => String(x).padStart(2, "0"); return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}T${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`; };

  // a distributor's batches: the story's own while in a journey, his other stock the Watcher reads from his DMS export,
  // and every batch he has cleared, newest first
  function distBatches(distId, state) {
    const past = HISTORY.filter(c => c.dist.id === distId).sort((a, z) => (a.flagged < z.flagged ? 1 : -1));
    const story = D.BATCHES.filter(b => b.distributor === distId);
    const inJourney = b => (b.hero && state.hero.phase !== "watching") || (b.second && state.mango.phase && state.mango.phase !== "watching");
    return { journey: story.filter(inJourney), watching: story.filter(b => !inJourney(b)), past };
  }
  // the papers a distributor sees: those he issues (his tax invoice and its e-way bill check) and those issued to him
  // (Munchly's price-support and expiry credit notes); and copies of what concerns his packs (the food bank's receipt,
  // the destruction certificate). Munchly's GST ITC memo and FSSAI checklist stay Munchly's
  function distPapers(c) {
    const has = d => d && d.status !== "not required";
    const doc = id => c.docs.find(d => d.id === id);
    return { mine: ["invoice", "eway", "support", "expiry"].map(doc).filter(d => d && (has(d) || d.id === "eway")), copies: ["receipt", "destruction"].map(doc).filter(has) };
  }
  // what happened to a cleared batch, from where he stands: each moment with its day and time
  function moments(c) {
    const out = []; const add = (k, icon, title, sub) => { const t = stepAt(c, k); if (t) out.push({ k, at: t, icon, title, sub }); };
    const kl = took(c, "kirana"), es = took(c, "expiresoon"), st = took(c, "staff"), fb = took(c, "foodbank");
    const doc = id => c.docs.find(d => d.id === id) || {};
    add("detect", "radar", `The Watcher flagged ${num(c.plan.units)} packs at risk`, `${c.batch.daysLeft} days left, failing Blinkit, Zepto and Instamart's gates`);
    add("photo", "camera", "You sent the label photo", "Vision read the batch, the dates and the MRP");
    add("approve", "check", `${C} approved the plan`, c.plan.lines.filter(l => l.units > 0 && l.id !== "writeoff").map(l => `${num(l.units)} to ${l.short}`).join(" · "));
    if (planned(c, "expiresoon")) add("listing", "shopping-bag", `${num(planned(c, "expiresoon").units)} listed on ExpireSoon in your name`, `Lot ${c.listing.id} at ${rate(planned(c, "expiresoon").price)}`);
    if (planned(c, "kirana")) add("offer", "send", `The scheme went to ${c.offered} of your kiranas`, `Buy 10, get 2 · ${rate(planned(c, "kirana").packPrice)} a packet`);
    if (fb) add("donation", "heart-handshake", `${c.partner.name} booked for ${num(fb.units)} packs`, `Pickup from ${c.dist.godown}`);
    if (kl) add("orders", "store", `${c.kiranas.length} kiranas ordered ${num(kl.units)} packets`, c.kirana.ordered < c.kirana.planned ? `of ${num(c.kirana.planned)} offered` : "The scheme filled");
    if (es) add("accept", "handshake", `${D.BUYER.name} took the counter at ${rate(c.award.price)}`, `${M.fmt.inr(c.award.token)} token paid`);
    if (fb) add("collect", "package-check", `${c.partner.name} collected ${num(fb.units)} packs`, `Receipt ${c.receipt.no}`);
    if (kl && c.realised.godown) add("closeOffer", "clock", "The scheme closed after 48 hours", `${num(c.realised.godown)} packets were not ordered`);
    if (st) add("staff", "users", `Your staff sale sold ${num(st.units)} packs`, `at ${rate(st.price)}`);
    if (es) add("truck", "truck", `${D.BUYER.name}'s truck collected the lot`, `${num(es.units)} packs to ${D.BUYER.city}`);
    add("papers", "file-check", "The Paperwork agent drafted your papers", distPapers(c).mine.filter(d => d.status !== "not required").map(d => d.no).join(" · "));
    if (c.invoice) add("invoice", "receipt", `You issued ${c.invoice.no} from Tally`, `${M.fmt.inr(c.invoice.total || c.invoice.amount)} to ${D.BUYER.name}`);
    if (kl) add("van", "route", `Your ${weekday(stepAt(c, "van"))} van round delivered the scheme`, `${c.kiranas.length} shops · ${num(kl.units)} packets`);
    const x = c.expiry && c.expiry.units ? c.expiry : null;
    add("report", x ? "warehouse" : "badge-check", x ? `${num(x.units)} packs expired at your godown` : "Settled: you ended whole",
      x ? `${C} took them back for full credit: ${M.fmt.inr(x.credit)} on ${doc("expiry").no}` : `${M.fmt.inr(c.support.total)} price support on ${doc("support").no}`);
    return out.sort((a, z) => (a.at < z.at ? -1 : 1));
  }
  // what he received against what he paid: the price support (and on expiry day the expiry credit) makes them equal.
  // The buyer pays the price he took, the Negotiator's counter, not the price listed
  function whole(c) {
    const rows = [];
    const kl = took(c, "kirana"), es = took(c, "expiresoon"), st = took(c, "staff"), fb = took(c, "foodbank");
    if (kl) rows.push({ k: `From ${c.kiranas.length} kiranas`, sub: `${num(kl.units)} packets`, v: kl.gross });
    if (es) rows.push({ k: `From ${D.BUYER.name}`, sub: `${num(es.units)} packets at ${rate(c.award.price)}`, v: Math.round(es.units * c.award.price * 100) / 100 });
    if (st) rows.push({ k: "Your staff sale", sub: `${num(st.units)} packs`, v: st.gross });
    if (fb) rows.push({ k: `Given to ${c.partner.name}`, sub: `${num(fb.units)} packs`, v: 0 });
    const cn = c.docs.find(d => d.id === "support"), ex = c.docs.find(d => d.id === "expiry");
    rows.push({ k: "Price-support credit note", sub: cn && cn.no, v: c.support.total, paper: "support" });
    if (ex) rows.push({ k: `Expiry credit note for ${num(c.expiry.units)} packs`, sub: ex.no, v: ex.amount, paper: "expiry" });
    const recv = Math.round(rows.reduce((t, r) => t + r.v, 0) * 100) / 100;
    const paid = Math.round((c.plan.units * c.sku.dp + c.support.van + c.support.fee) * 100) / 100;
    return { rows, recv, paid, gain: Math.round(recv - paid), dp: c.sku.dp, units: c.plan.units };
  }
  // the story's chips batch while in a journey: what has happened so far (the feed), the next three, and the plan's money
  const STORY_MOMENTS = [["permit", "handshake", "You gave the one-time permission"], ["watch", "radar", "The Watcher flagged 1,360 packs at risk"], ["ask", "scan-line", "Vision asked you for a label photo"], ["photo", "camera", "You sent the label photo"], ["read", "scan-line", "Vision read the label"],
    ["approved", "check", `${C} approved the plan`], ["list", "shopping-bag", "772 listed on ExpireSoon in your name"], ["outreach", "send", "The scheme went to 38 of your kiranas"], ["accepted", "handshake", `${D.BUYER.name} took the counter at ₹14.20`], ["orders", "store", "31 kiranas ordered 588 packets"],
    ["dispatch", "truck", `You loaded ${D.BUYER.name}'s truck`], ["papers", "file-check", "The Paperwork agent drafted your papers"], ["van", "route", "Your Tuesday van round delivered the scheme"], ["ledger", "badge-check", "Settled: you ended whole"]];
  function storyMoments(state) {
    const items = []; let next = 0;
    STORY_MOMENTS.forEach(([k, icon, title]) => { const e = (state.feed || []).find(x => x.key === k); if (e) items.push({ k, icon, title, at: e.at }); else if (next < 3 && state.feed && state.feed.length) { items.push({ k, icon, title, ahead: true }); next++; } });
    return items;
  }
  function storyWhole(state) {
    const KL = D.PLAN.lines.find(l => l.id === "kirana"), ES = D.PLAN.lines.find(l => l.id === "expiresoon"), sku = D.SKUS[HERO.sku];
    const rows = [{ k: "From your kiranas", sub: `${num(KL.units)} packets on the scheme`, v: KL.gross }, { k: `From ${D.BUYER.name}`, sub: `${num(ES.units)} packets`, v: state.hero.award ? D.AWARD.gross : ES.gross }, { k: "Price-support credit note", sub: `from ${C}`, v: D.SUPPORT.total }];
    const recv = rows.reduce((t, r) => t + r.v, 0), paid = D.PLAN.units * sku.dp + D.SUPPORT.van + D.SUPPORT.fee;
    return { rows, recv, paid, gain: Math.round(recv - paid), dp: sku.dp, units: D.PLAN.units };
  }

  // a shop's scheme: pay the pack price for 10 of every 12, sell all 12 at MRP
  const scheme = (n, pack, mrp) => { const free = Math.floor(n / 12) * 2, paid = n - free; return { n, free, paid, pay: Math.round(paid * pack * 100) / 100, sell: n * mrp, margin: Math.round((n * mrp - paid * pack) * 100) / 100 }; };
  // every offer a shop was sent: its distributor's cleared batches with a kirana line, then the story's own. An offer is
  // open, ordered, declined (Not this time) or expired: its 48 hours ended, or the scheme filled before the shop ordered
  function offersFor(shop, state) {
    const cap = M.RULES.shopCapTimes;
    const past = HISTORY.filter(c => c.dist.id === shop.distributor && planned(c, "kirana")).map(c => {
      const o = c.kiranas.find(x => x.kirana === shop.id), kl = planned(c, "kirana");
      const sent = stepAt(c, "offer"), filled = c.kirana.ordered >= c.kirana.planned;
      const closed = filled ? stepAt(c, "orders") : stepAt(c, "closeOffer") || plusHours(sent, 48);
      return { ref: c.ref, sku: c.sku, dist: c.dist, sent, closed, share: shop.sales14 * cap, pack: kl.packPrice, mrp: c.sku.mrp, bestBefore: c.batch.bestBefore,
        status: o ? "ordered" : "expired", why: o ? null : filled ? "filled" : "time", units: o ? o.units : 0, orderedAt: o ? stepAt(c, "orders") : null, van: o ? stepAt(c, "van") : null, m: o ? scheme(o.units, kl.packPrice, c.sku.mrp) : null };
    }).sort((a, z) => (a.sent < z.sent ? 1 : -1));
    const h = state.hero;
    if (shop.distributor !== HERO.distributor || !h.offer) return past;
    const KL = D.PLAN.lines.find(l => l.id === "kirana"), sku = D.SKUS[HERO.sku], o = h.orders.find(x => x.id === shop.id), dec = (h.declined || {})[shop.id];
    const filled = h.orders.reduce((t, x) => t + x.units, 0) >= KL.units;
    const sent = `${D.DAY0}T${h.offer.at}`;
    const status = o ? "ordered" : dec ? "declined" : filled ? "expired" : "open";
    const last = h.orders.reduce((t, x) => (x.at > t ? x.at : t), "00:00");
    return [{ ref: HERO.id, story: true, open: !filled, sku, dist: D.DISTRIBUTORS[HERO.distributor], sent, closed: filled ? `${D.DAY0}T${last}` : plusHours(sent, 48), share: shop.sales14 * cap, pack: KL.packPrice, mrp: sku.mrp, bestBefore: HERO.bestBefore,
      status, why: status === "expired" ? "filled" : null, declinedAt: dec ? `${D.DAY0}T${dec.at}` : null, units: o ? o.units : 0, orderedAt: o ? `${D.DAY0}T${o.at}` : null,
      van: o && h.van.status === "done" ? D.addDays(D.DAY0, 4) + "T09:00" : null, m: o ? scheme(o.units, KL.packPrice, sku.mrp) : null }].concat(past);
  }

  // a food bank's pickups: the story's Mango Drink while it is coming or once collected, then the donations it collected
  // from Munchly's cleared batches, each with the receipt it issued as it collected
  function pickupsFor(org, state) {
    const past = HISTORY.filter(c => c.partner && c.partner.name === org).map(c => ({ ref: c.ref, c, sku: c.sku, dist: c.dist, units: c.donation.units, kg: c.receipt.kg, meals: c.receipt.meals, receipt: c.receipt, spot: c.donation.spot,
      from: `${c.dist.godown}, ${c.dist.city}`, asked: stepAt(c, "donation"), confirmed: stepAt(c, "pickup"), collected: stepAt(c, "collect"), bestBefore: c.batch.bestBefore, daysLeft: c.batch.daysLeft, state: "collected" }))
      .sort((a, z) => (a.collected < z.collected ? 1 : -1));
    const DN = D.JOURNEY.donation, d = state.mango.donation;
    if (org !== DN.partner || !d) return past;
    const dist = D.DISTRIBUTORS[SECOND.distributor], R = D.MANGO_RECEIPT;
    return [{ ref: SECOND.id, story: true, sku: D.SKUS[SECOND.sku], dist, units: D.MANGO_FB, kg: R.kg, meals: R.meals, receipt: d === "collected" ? R : null, spot: DN.spot, from: `${DN.from}, ${dist.city}`,
      bestBefore: SECOND.bestBefore, daysLeft: SECOND.daysLeft, state: d, slot: `${DN.date} · ${DN.time}` }].concat(past);
  }
  const fssaiItems = p => ["Sealed, undamaged packs", `Best before ${M.fmt.date(p.bestBefore)}, ${p.daysLeft} days left when booked`, "Ambient storage, away from sunlight", `Batch ${p.ref} on every carton`, `Donor: ${D.CLIENT.name} via ${p.dist.name}`];

  const partners = { distBatches, distPapers, moments, whole, storyMoments, storyWhole, scheme, offersFor, pickupsFor, fssaiItems, stepAt, plusHours };

  window.SC3_LEDGER = { HISTORY, STORY_CLEARED, historyCase, storyCase, caseOf, rowOf, rowsOf, totals, periods, ledger, ordersOf, outcomeOf, MIX, partners };
})();

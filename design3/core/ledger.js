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
  // the agency's destruction certificate for packs destroyed at a distributor's godown (SC-139): the batch, the packs
  // and their kilos, the method and the site, the agency and its authorisation, the evidence and who approved it, and
  // the input GST he reverses on them
  const possessive = n => n + (/s$/.test(n) ? "'" : "'s");
  function destructionDoc(xd, x, batch, sku, dist) {
    const units = xd.units, approver = D.PEOPLE[xd.approvedBy] || { name: xd.approvedBy };
    return {
      id: "destruction", type: "Destruction certificate", owner: xd.agency.name, no: xd.certificate, status: "generated", amount: 0, units,
      kg: r2(units * sku.kgPerUnit), packKg: r2(units * (sku.packKg || 0)), at: "godown", method: xd.method, site: xd.agency.site,
      agency: xd.agency.name, auth: xd.agency.auth, for: { name: dist.name, address: dist.address, gstin: dist.gstin }, from: dist.godown,
      batch: batch.id, bestBefore: batch.bestBefore, hsn: sku.hsn, destroyedAt: xd.photos.after.at,
      evidence: { photos: 2, checks: xd.checks.filter(c => c.ok).length, of: xd.checks.length }, approvedBy: approver.name, approvedAt: xd.approvedAt,
      reversed: x && x.reversal != null ? x.reversal : r2(units * (sku.dp || 0) * sku.gst), date: xd.approvedAt.slice(0, 10),
      note: `Destroyed at ${xd.agency.site} on expiry day, from ${dist.godown || dist.city}. ${dist.name} reverses the input GST on these packs in GSTR-3B Table 4(B)(1) under section 17(5)(h).`,
    };
  }
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
    const xd = h.destruction;
    if (h.expiry && h.expiry.units) {
      const x = h.expiry, at = dist.godown || `${dist.city} godown`;
      if (x.policy === "godown") {
        // destroyed at his godown (SC-139): a financial credit note against the agency's certificate, on Priya's yes
        docs.push({ id: "expiry", type: "Expiry credit note", owner: D.CLIENT.short, no: n.expiry, status: "generated", amount: x.amount, units: x.units, policy: x.policy, destroyedBy: x.destroyedBy,
          credit: x.credit, gst: x.gst, charges: x.charges, reversal: x.reversal, dp: sku.dp, gstPct: Math.round(sku.gst * 100), certificate: xd.certificate, agency: xd.agency.name,
          disposal: 0, epr: 0, itc: 0, date: xd.approvedAt.slice(0, 10),
          note: `A financial credit note: no GST is charged or adjusted on it, and ${possessive(C)} output tax on the original sale stands. Issued against destruction certificate ${xd.certificate}; adjusted against ${possessive(dist.name)} account.` });
      } else docs.push({ id: "expiry", type: "Expiry credit note", owner: D.CLIENT.short, no: n.expiry, status: "generated", amount: x.credit, units: x.units, policy: x.policy, destroyedBy: x.destroyedBy,
        disposal: x.disposal, epr: x.epr, itc: x.itc, date: h.bestBefore,
        note: `The ${M.fmt.num(x.units)} packs that expired at ${at} come back to ${C} for full credit (${M.fmt.inr(x.credit)}), and ${C} destroys them.` });
    }
    // the agency's destruction certificate, for him, once Priya approved the evidence (SC-139)
    if (xd) {
      const i = docs.findIndex(d => d.id === "destruction");
      docs[i] = destructionDoc(xd, h.expiry, batch, sku, dist);
    }
    const orders = kl ? ordersOf(h.distributor, h.kirana.ordered) : [];
    return {
      ref: h.ref, history: true, outcome: h.outcome, flagged: h.flagged, cleared: day("report") || h.bestBefore, numbers: n, steps: h.steps, destruction: xd || null,
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
    // what was destroyed: by the client, and at his godown at the client's cost (SC-139)
    const destroyed = (r.destroyed != null ? r.destroyed : r.leftover) + (r.atGodown || 0);
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
        credit: c.expiry && c.expiry.policy !== "none" ? (c.expiry.amount != null ? c.expiry.amount : c.expiry.credit) || 0 : 0, support: support ? support.amount : 0,
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
    // packs destroyed at his own godown (SC-139): the agency's certificate is issued for him, so it is his paper
    const his = d => d && d.id === "destruction" && d.at === "godown";
    return { mine: ["invoice", "eway", "support", "expiry", "destruction"].map(doc).filter(d => d && (d.id === "destruction" ? his(d) && has(d) : has(d) || d.id === "eway")), copies: ["receipt", "destruction"].map(doc).filter(d => has(d) && !his(d)) };
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
    // destroyed at his godown on expiry day (SC-139): asked, the evidence sent, Priya's yes
    const xd = c.destruction;
    if (xd) {
      add("destroyAsk", "warehouse", `Asked to destroy ${num(xd.units)} expired packs at your godown`, "Through an authorised agency, with two photos and its certificate");
      add("destroySent", "camera", "You sent the destruction's evidence", `${xd.agency.name} · certificate ${xd.certificate}`);
      add("destroyApproved", "badge-check", `${D.PEOPLE[xd.approvedBy] ? D.PEOPLE[xd.approvedBy].short : C} approved the destruction`, "Vision checked both photos");
    }
    add("report", x ? "warehouse" : "badge-check", x ? (x.at === "godown" ? `${num(x.units)} packs destroyed at your godown` : `${num(x.units)} packs expired at your godown`) : "Settled: you ended whole",
      x ? (x.at === "godown" ? `${C} credited the dealer price, the GST you reverse and the agency's charges: ${M.fmt.inr(x.amount)} on ${doc("expiry").no}` : `${C} took them back for full credit: ${M.fmt.inr(x.credit)} on ${doc("expiry").no}`)
        : `${M.fmt.inr(c.support.total)} price support on ${doc("support").no}`);
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
    // destroyed at his godown (SC-139): he also reverses the input GST on them and pays the agency, which the note makes good
    const g = c.expiry && c.expiry.at === "godown" ? c.expiry : null;
    const extra = g ? { reversal: g.reversal || 0, charges: g.charges || 0 } : null;
    const paid = Math.round((c.plan.units * c.sku.dp + c.support.van + c.support.fee + (extra ? extra.reversal + extra.charges : 0)) * 100) / 100;
    return { rows, recv, paid, gain: Math.round(recv - paid), dp: c.sku.dp, units: c.plan.units, extra };
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

  /* ---------- a distributor's portal, batch by batch (SC-133, option A) ---------- */
  // Every batch of Munchly's at his godown in a journey, as where it stands now: its plan's lines, the label photo, the
  // scheme, the lot, the staff sale, the pickup, the papers. The stub's two story batches come from the journey's state
  // (the chips from the hero, the Mango Drink from the second); the live workspace's from its partner facts (core's
  // dist.ts). From these: the batch's lines and where each stands, the steps that are his, and what it waits for
  const STOP = { "at-risk": "Verify", verified: "Value", valued: "Decide", planned: "Approve", approved: "Execute", executing: "Execute", dispatched: "Settle", settled: "Settle", cleared: "Cleared" };
  const ROUTED = ["approved", "executing", "dispatched", "settled", "cleared"];
  const inr = n => M.fmt.inr(n);
  const cartons = (u, per) => { const c = Math.floor(u / per), r = u % per; return r * 2 === per ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? "" : "s"}`; };
  const linesOf = plan => plan.lines.filter(l => l.units > 0 && l.id !== "writeoff").map(l => ({ id: l.id, units: l.units, price: l.price, packPrice: l.packPrice || null }));
  function nowOfHero(state) {
    const h = state.hero, units = h.orders.reduce((t, o) => t + o.units, 0);
    return { ref: HERO.id, sku: HERO.sku, dist: HERO.distributor, flagged: D.DAY0, phase: h.phase, units: D.PLAN.units, shelf: HERO.shelf || null,
      photo: h.photo.status, approved: ROUTED.includes(h.phase), lines: h.plan ? linesOf(D.PLAN) : [],
      offer: h.offer ? { open: h.offer.status === "sent" && units < D.PLAN.lines.find(l => l.id === "kirana").units, offered: D.OFFERED, shops: h.orders.length, units } : null,
      shops: h.orders.map(o => ({ kirana: o.id, units: o.units, at: `${D.DAY0}T${o.at}` })),
      listing: h.listing ? { id: D.JOURNEY.listing.id } : null, award: h.award ? { price: D.COUNTER.price, token: D.AWARD.token } : null, awardAt: h.award && h.award.at ? `${D.DAY0}T${h.award.at}` : null,
      truck: h.truck.status === "dispatched", van: h.van.status === "done", papers: !!h.docs,
      invoice: h.docs ? { no: D.INVOICE.no, total: D.INVOICE.total, issued: !!h.invoiceIssued } : null,
      staff: h.staff ? { status: h.staff.status, units: h.staff.units, price: h.staff.price, sold: h.staff.sold == null ? null : h.staff.sold } : null,
      // the packs left at his godown on expiry day, destroyed there against evidence the client approves (SC-139)
      destruction: h.destruction ? { status: h.destruction.status, units: h.destruction.units, reason: h.destruction.reason || null } : null,
      donation: null, round: { day: D.JOURNEY.van.day, date: D.JOURNEY.van.date, leaves: D.JOURNEY.van.leaves } };
  }
  // the Mango Drink, executing from the story's start: the scheme open to Lakshmi's shops, the staff sale, the pickup
  function nowOfSecond(state) {
    const m = state.mango, DN = D.JOURNEY.donation, st = D.MANGO_PLAN.lines.find(l => l.id === "staff");
    return { ref: SECOND.id, sku: SECOND.sku, dist: SECOND.distributor, flagged: D.DAY0, phase: m.phase, units: D.MANGO_PLAN.units, shelf: SECOND.shelf || null,
      photo: "verified", approved: ROUTED.includes(m.phase), lines: linesOf(D.MANGO_PLAN),
      offer: { open: true, offered: W.KIRANAS.filter(k => k.distributor === SECOND.distributor).length, shops: 0, units: 0 }, shops: [],
      listing: null, award: null, awardAt: null, truck: false, van: false, papers: false, invoice: null,
      staff: st ? (m.staff ? { status: m.staff.status, units: m.staff.units, price: st.price, sold: m.staff.sold } : { status: "open", units: st.units, price: st.price, sold: null }) : null,
      donation: m.donation ? { status: m.donation, partner: DN.partner, units: D.MANGO_FB, date: DN.date, time: DN.time } : null, round: null };
  }
  // his batches in a journey now, as the stub has them
  function distNow(distId, state) {
    const out = [];
    if (HERO.distributor === distId && state.hero.phase && state.hero.phase !== "watching") out.push(nowOfHero(state));
    if (SECOND.distributor === distId && state.mango.phase && state.mango.phase !== "watching") out.push(nowOfSecond(state));
    return out;
  }
  // a batch in a journey from where he stands: each line of its plan and where it stands, his steps, what it waits for
  function journeyOf(n, w) {
    w = w || WORLD;
    const sku = w.skus[n.sku], dist = w.distributors[n.dist], buyer = w.buyer, sc = w.scheme;
    const line = id => n.lines.find(l => l.id === id) || null;
    const kl = line("kirana"), es = line("expiresoon"), st = line("staff"), fb = line("foodbank");
    const o = n.offer, filled = !!o && (o.shops >= o.offered || (!!kl && o.units >= kl.units)), over = !!o && (!o.open || filled);
    const day = n.round ? `the ${n.round.day} round` : "the van round";
    const lines = [];
    if (kl) lines.push({ id: "kirana", plan: `${num(kl.units)} packets to your kiranas at ${rate(kl.packPrice)}, ${sc.free} free with every ${sc.buy}`,
      state: !n.approved ? "goes out once the plan has its yes" : n.van ? `delivered on ${day}` : !o ? "the scheme goes out next" : over ? `${o.shops} ${o.shops === 1 ? "shop" : "shops"} · ${num(o.units)} packets · on ${day}` : `${o.shops} of ${o.offered} shops · ${num(o.units)} packets ordered`,
      done: n.van, live: !!o && !over && n.approved });
    if (es) lines.push({ id: "expiresoon", plan: `${num(es.units)} packs on ExpireSoon in your name, the buyer's own truck`,
      state: n.truck ? `collected by ${buyer.name}'s truck` : n.award ? `${buyer.name} took it at ${rate(n.award.price)} · token ${inr(n.award.token)} paid` : n.listing ? `lot ${n.listing.id} listed at ${rate(es.price)} · waiting for a buyer` : !n.approved ? "listed once the plan has its yes" : "listing now",
      done: n.truck, live: !!n.listing && !n.award });
    if (st) lines.push({ id: "staff", plan: `${num(st.units)} packs to your staff at ${rate(st.price)}, at ${dist.godown}`,
      state: !n.approved ? "opens once the plan has its yes" : n.staff && n.staff.status === "recorded" ? (n.staff.sold == null ? "recorded" : `${num(n.staff.sold)} of ${num(st.units)} sold`) : "open: record what sold when the sale is over",
      done: !!n.staff && n.staff.status === "recorded", live: false });
    if (fb) { const d = n.donation, who = d ? d.partner : "a food bank";
      lines.push({ id: "foodbank", plan: `${num(fb.units)} packs to ${who}, collected from your godown`,
        state: !n.approved ? "booked once the plan has its yes" : !d ? "the Donation agent is booking a food bank" : d.status === "collected" ? `collected by ${d.partner}` : d.status === "declined" ? `${d.partner} declined: the packs stay at your godown` : d.status === "confirmed" ? (d.date ? `${d.partner} collects ${d.date}${d.time ? `, ${d.time}` : ""}` : `${d.partner} confirmed the pickup`) : `booked · waiting for ${d.partner}`,
        done: !!d && d.status === "collected", live: !!d && d.status === "booked" }); }
    const todo = [];
    if (n.photo === "requested") todo.push({ id: "photo", icon: "camera", title: "Send one photo of the carton label", sub: `${n.shelf ? `Shelf ${n.shelf} · one` : "One"} carton of ${sku.name}, batch ${n.ref}`, cta: "Open camera", route: "photo" });
    if (st && n.approved && !(n.staff && n.staff.status === "recorded")) todo.push({ id: "staff", icon: "users", title: "Record the staff sale", sub: `${num(st.units)} packs at ${rate(st.price)} · count what sold, once`, cta: "Record what sold", route: "van" });
    if (es && n.award && !n.truck && (!kl || over)) todo.push({ id: "truck", icon: "truck", title: `Load ${buyer.name}'s truck`, sub: `${num(es.units)} packs · ${cartons(es.units, sku.perCarton || 24)} · the balance has landed`, cta: "Load the truck", route: "van" });
    if (n.invoice && !n.invoice.issued) todo.push({ id: "invoice", icon: "receipt", title: `Issue ${n.invoice.no} from Tally`, sub: `${inr(n.invoice.total)} to ${buyer.name}, drafted by the Paperwork agent`, cta: "Issue from Tally", act: "issueInvoice" });
    // destroyed at his godown on expiry day (SC-139): the evidence, and again if the client asked for it again
    const xd = n.destruction;
    if (xd && (xd.status === "requested" || xd.status === "asked")) todo.unshift({ id: "destroy", icon: "recycle", title: `Destroy ${num(xd.units)} expired ${xd.units === 1 ? "pack" : "packs"} at your godown`,
      sub: xd.status === "asked" && xd.reason ? `${w.short} asked again: ${xd.reason}` : "Through an authorised agency · two photos and its certificate", cta: "Send the evidence", route: "destroy" });
    if (kl && n.papers && o && o.shops > 0 && !n.van) todo.push({ id: "van", icon: "route", title: n.round ? `Run the ${n.round.day} van round` : "Run the van round", sub: `${o.shops} ${o.shops === 1 ? "shop" : "shops"} · ${num(o.units)} packets${n.round ? ` · leaves the godown ${n.round.leaves}` : ""}`, cta: "Start the round", route: "van" });
    const waiting = todo.length ? null
      : xd && xd.status === "reading" ? "Vision is checking your destruction photos"
      : xd && xd.status === "checked" ? `${w.short} is reviewing your destruction evidence before it credits you`
      : n.photo === "reading" ? "Vision is reading your label photo"
      : n.phase === "at-risk" && n.photo === "none" ? "The Watcher flagged it: Vision checks the batch first, and may ask you for one label photo"
      : !n.approved ? `${w.short} is deciding the plan: nothing moves in your name until it says yes`
      : n.phase === "cleared" ? "Settled: you ended whole"
      : o && !over && n.approved ? `The scheme is open: ${o.shops} of ${o.offered} shops have ordered`
      : n.listing && !n.award ? "The lot waits for a buyer on ExpireSoon"
      : n.donation && n.donation.status !== "collected" && n.donation.status !== "declined" ? `${n.donation.partner} collects from your godown`
      : n.approved && !n.papers ? "The Paperwork agent drafts your papers next"
      : "The agents are on it";
    if (xd) lines.push({ id: "destroy", plan: `${num(xd.units)} ${xd.units === 1 ? "pack" : "packs"} expired at your godown, destroyed there`,
      state: { requested: "send the evidence: two photos and the agency's certificate", asked: "asked again: send the evidence", reading: "Vision is checking the photos", checked: `waiting for ${w.short}'s yes`, approved: `approved by ${w.short} · the credit note follows` }[xd.status] || xd.status,
      done: xd.status === "approved", live: xd.status === "reading" || xd.status === "checked" });
    return { ref: n.ref, sku, dist, phase: n.phase, stop: STOP[n.phase] || "Detect", flagged: n.flagged, units: n.units, lines, todo, waiting };
  }
  // the order he asks most of first, then by the batch
  const byAsk = (a, z) => z.todo.length - a.todo.length || (a.ref < z.ref ? -1 : 1);
  const journeys = (distId, state) => distNow(distId, state).map(n => journeyOf(n)).sort(byAsk);

  // what a batch in a journey has sold so far: the buyer's lot, the kiranas' orders, the staff sale, the food bank
  function ordersNow(n, shopName, w) {
    w = w || WORLD;
    const shops = n.shops.map(k => ({ name: shopName(k.kirana), units: k.units, at: k.at || null }));
    const sku = w.skus[n.sku], dist = w.distributors[n.dist], out = [], o = n.offer;
    const line = id => n.lines.find(l => l.id === id) || null;
    const kl = line("kirana"), es = line("expiresoon"), st = line("staff"), fb = line("foodbank");
    if (es && n.award) out.push({ id: "expiresoon", units: es.units, who: `${w.buyer.name}, ${w.buyer.city}`, what: `lot ${n.listing ? n.listing.id : ""} · ${num(es.units)} × ${rate(n.award.price)}`,
      sub: `token ${inr(n.award.token)} · balance ${inr(Math.round((es.units * n.award.price - n.award.token) * 100) / 100)} · ${n.truck ? "collected by the buyer's truck" : "the buyer's truck collects"}`,
      amount: Math.round(es.units * n.award.price * 100) / 100, at: n.awardAt || null, paper: n.invoice ? { no: n.invoice.no, label: n.invoice.issued ? "issued from Tally" : "drafted by the Paperwork agent", issue: !n.invoice.issued } : null });
    if (kl && o && o.shops) out.push({ id: "kirana", units: o.units, who: `${o.shops} ${o.shops === 1 ? "kirana" : "kiranas"}`, what: `${num(o.units)} packets at ${rate(kl.packPrice)}, ${w.scheme.free} free with every ${w.scheme.buy}`,
      sub: n.van ? `delivered on ${n.round ? `the ${n.round.day} round` : "the van round"}` : n.round ? `on the ${n.round.day} round, ${n.round.date}` : "on the van round once the papers are drafted",
      amount: Math.round(shops.reduce((t, k) => t + scheme(k.units, kl.packPrice, sku.mrp).pay, 0) * 100) / 100, at: shops.reduce((t, k) => (k.at && (!t || k.at > t) ? k.at : t), null), shops });
    if (st && n.staff && n.staff.status === "recorded" && n.staff.sold) out.push({ id: "staff", units: n.staff.sold, who: "Your staff sale", what: `${num(n.staff.sold)} packs at ${rate(st.price)}`, sub: `at ${dist.godown}`, amount: Math.round(n.staff.sold * st.price * 100) / 100, at: null });
    if (fb && n.donation && n.donation.status === "collected") out.push({ id: "foodbank", units: fb.units, who: n.donation.partner, what: `${num(fb.units)} packs given`, sub: "the receipt is in the batch's papers", amount: 0, at: null });
    return out;
  }
  // a cleared batch's orders: the lot the buyer took, the kiranas' scheme, the staff sale, what went to the food bank
  function ordersPast(c, shopName, w) {
    w = w || WORLD;
    const out = [], es = took(c, "expiresoon"), kl = took(c, "kirana"), st = took(c, "staff"), fb = took(c, "foodbank");
    const inv = c.docs.find(d => d.id === "invoice" && d.status !== "not required");
    const issued = !!stepAt(c, "invoice");
    if (es) out.push({ id: "expiresoon", units: es.units, who: `${w.buyer.name}, ${w.buyer.city}`, what: `lot ${c.listing ? c.listing.id : ""} · ${num(es.units)} × ${rate(c.award.price)}`,
      sub: `token ${inr(c.award.token)} · balance ${inr(Math.round((es.units * c.award.price - c.award.token) * 100) / 100)} · collected by the buyer's truck`,
      amount: Math.round(es.units * c.award.price * 100) / 100, at: stepAt(c, "accept"), paper: inv ? { no: inv.no, label: issued ? "issued from Tally" : "drafted" } : null });
    if (kl) out.push({ id: "kirana", units: kl.units, who: `${c.kiranas.length} ${c.kiranas.length === 1 ? "kirana" : "kiranas"}`, what: `${num(kl.units)} packets at ${rate(planned(c, "kirana").packPrice)}, ${w.scheme.free} free with every ${w.scheme.buy}`,
      sub: `${c.kirana && c.kirana.ordered < c.kirana.planned ? `of ${num(c.kirana.planned)} offered · ` : ""}${stepAt(c, "van") ? `delivered on the ${weekday(stepAt(c, "van"))} round` : "delivered on the van round"}`,
      amount: kl.gross, at: stepAt(c, "orders"), shops: c.kiranas.map(k => ({ name: shopName(k.kirana), units: k.units, at: k.at || null })) });
    if (st) out.push({ id: "staff", units: st.units, who: "Your staff sale", what: `${num(st.units)} packs at ${rate(st.price)}`, sub: `at ${w.distributors[c.dist].godown}`, amount: st.gross, at: stepAt(c, "staff") });
    if (fb) out.push({ id: "foodbank", units: fb.units, who: c.partner ? c.partner.name : "The food bank", what: `${num(fb.units)} packs given`, sub: c.receipt ? `receipt ${c.receipt.no} · a copy in the batch's papers` : "", amount: 0, at: stepAt(c, "collect") });
    return out;
  }
  // what left a cleared batch's godown, each with its day: the van round, the buyer's truck, the staff sale, the pickup
  function deliveriesPast(c, w) {
    w = w || WORLD;
    const out = [], es = took(c, "expiresoon"), kl = took(c, "kirana"), st = took(c, "staff"), fb = took(c, "foodbank");
    const at = k => stepAt(c, k);
    if (kl && at("van")) out.push({ id: "kirana", at: at("van"), title: `${weekday(at("van"))} van round`, sub: `${c.kiranas.length} ${c.kiranas.length === 1 ? "shop" : "shops"} · ${num(kl.units)} packets` });
    if (es && at("truck")) out.push({ id: "expiresoon", at: at("truck"), title: `${w.buyer.name}'s truck`, sub: `lot ${c.listing ? c.listing.id : ""} · ${num(es.units)} packs to ${w.buyer.city}` });
    if (st && at("staff")) out.push({ id: "staff", at: at("staff"), title: "Staff sale recorded", sub: `${num(st.units)} packs sold at ${rate(st.price)}` });
    if (fb && at("collect")) out.push({ id: "foodbank", at: at("collect"), title: `${c.partner ? c.partner.name : "The food bank"} collected`, sub: `${num(fb.units)} packs${c.receipt ? ` · receipt ${c.receipt.no}` : ""}` });
    return out.sort((a, z) => (a.at < z.at ? 1 : -1));
  }
  // a label photo he sent, and what Vision read from it: the batch, the dates and the MRP
  function photoOf(c, w) {
    w = w || WORLD;
    const sent = stepAt(c, "photo"); if (!sent) return null;
    const sku = w.skus[c.sku], bb = c.batch.bestBefore;
    return { ref: c.ref, sku, sent, read: stepAt(c, "read"), bestBefore: bb, mfg: c.batch.mfg || (sku.lifeDays ? D.addDays(bb, -sku.lifeDays) : null), mrp: sku.mrp };
  }
  // the stub's world: what the texts name
  const WORLD = { skus: D.SKUS, distributors: D.DISTRIBUTORS, buyer: D.BUYER, scheme: M.RULES.scheme, short: C };
  // the history's cases as partner facts name them: a shop by its id
  const shopName = id => (D.KIRANAS.find(k => k.id === id) || W.KIRANAS.find(k => k.id === id) || { name: id }).name;
  const historyFacts = c => Object.assign({}, c, { sku: c.sku.id || c.sku, dist: c.dist.id || c.dist, kiranas: c.kiranas.map(k => ({ kirana: k.kirana, units: k.units, at: k.at })) });

  const partners = { distBatches, distPapers, moments, whole, storyMoments, storyWhole, scheme, offersFor, pickupsFor, fssaiItems, stepAt, plusHours,
    STOP, distNow, journeyOf, journeys, ordersNow, ordersPast, deliveriesPast, photoOf, shopName, historyFacts, WORLD };

  window.SC3_LEDGER = { HISTORY, STORY_CLEARED, historyCase, storyCase, caseOf, rowOf, rowsOf, totals, periods, ledger, ordersOf, outcomeOf, MIX, partners };
})();

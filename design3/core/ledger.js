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
  const P = () => window.SC3_PAPERS;
  // the certificate in full (SC-174, option B): the goods, the reason, the agency's method and facility, the day and the
  // window they were destroyed in, its supervising officer and the two independent witnesses (a witness on the agency's
  // panel signs with the specimen it keeps), who handed the packs over, and the log from the godown to the cover
  function destructionDetail(xd, batch, sku, dist) {
    const ag = D.SETUP.destruction.agencies.find(a => a.id === xd.agency.id) || {}, how = D.SETUP.destruction.methods[ag.method || "landfill"];
    const after = xd.photos.after.at, on = after.slice(0, 10);
    // the window the agency destroyed them in, as he gave it; else the 25 minutes up to the after photo
    const win = xd.window || { from: new Date(Date.parse(after + ":00Z") - 25 * 60e3).toISOString().slice(11, 16), to: after.slice(11, 16) };
    const panel = ag.witnesses || [];
    // the four signatures as drawn on the certificate at the facility (SC-183): each signer's ink in place of a specimen
    // on file; a certificate signed before keeps its specimens
    const sg = xd.signatures || {}, signed = (role, p) => { const g = sg[role]; return g && p && g.name === p.name ? Object.assign({}, p, { sign: null, ink: { at: g.at, typed: !!g.typed, box: g.box || null, strokes: g.strokes || null } }) : p; };
    const witnesses = (xd.witnesses && xd.witnesses.length ? xd.witnesses : panel).map((w, i) => { const p = panel.find(x => x.name === w.name); return signed(`w${i + 1}`, { name: w.name, address: w.address || (p && p.address) || "", proof: w.proof || (p && p.proof) || null, sign: p ? p.sign : null }); });
    const units = xd.units, kg = r2(units * sku.kgPerUnit), packKg = r2(units * (sku.packKg || 0));
    const photos = { before: { name: xd.photos.before.name, at: xd.photos.before.at }, after: { name: xd.photos.after.name, at: after } };
    return {
      reason: "expiry", methodId: ag.method || "landfill", methodName: how.name, methodHow: how.how, facility: ag.facility || null, vehicle: ag.vehicle || null,
      officer: signed("officer", ag.officer || null), seal: ag.seal || null, witnesses, window: win, destroyedOn: on, photos,
      handedBy: signed("handed", dist.signatory ? { name: dist.signatory.name, title: dist.signatory.title, sign: dist.signatory.sign } : null),
      goods: `${sku.brand} ${sku.name}`, mfg: batch.mfg, mrp: sku.mrp, perCarton: sku.perCarton,
      log: P().destructionLog({ units, kg, packKg, batch: batch.id, no: xd.certificate, from: dist.godown, destroyedOn: on, window: win, photos, agency: xd.agency.name, vehicle: ag.vehicle, facility: ag.facility, method: ag.method }),
    };
  }
  function destructionDoc(xd, x, batch, sku, dist) {
    const units = xd.units, approver = D.PEOPLE[xd.approvedBy] || { name: xd.approvedBy };
    return Object.assign({
      id: "destruction", type: "Destruction certificate", owner: xd.agency.name, no: xd.certificate, status: "generated", amount: 0, units,
      kg: r2(units * sku.kgPerUnit), packKg: r2(units * (sku.packKg || 0)), at: "godown", method: xd.method, site: xd.agency.site,
      agency: xd.agency.name, auth: xd.agency.auth, for: { name: dist.name, address: dist.address, gstin: dist.gstin }, from: dist.godown,
      batch: batch.id, bestBefore: batch.bestBefore, hsn: sku.hsn, destroyedAt: xd.photos.after.at,
      evidence: { photos: 2, checks: xd.checks.filter(c => c.ok).length, of: xd.checks.length }, approvedBy: approver.name, approvedAt: xd.approvedAt,
      reversed: x && x.reversal != null ? x.reversal : r2(units * (sku.dp || 0) * sku.gst), date: xd.approvedAt.slice(0, 10),
      note: `Destroyed at ${xd.agency.site} on expiry day, from ${dist.godown || dist.city}. ${dist.name} reverses the input GST on these packs in GSTR-3B Table 4(B)(1) under section 17(5)(h).`,
    }, destructionDetail(xd, batch, sku, dist));
  }
  // the agency's certificate as it will be issued (SC-183, option B), laid out from the evidence he is sending (or sent)
  // for the four to sign on, and for Priya to review as signed; its times on expiry day, and no yes of hers yet
  function draftCertificate(xd, state) {
    const s = state || store(), S = D.story(s), day = S.expiryDay, at = t => (t && t.length <= 5 ? `${day}T${t}` : t);
    const photos = xd.photos || { before: { name: S.evidence.before, at: "11:40" }, after: { name: S.evidence.after, at: "13:20" } };
    const x = Object.assign({ checks: [], method: D.SETUP.destruction.method }, xd, { approvedAt: `${day}T00:00`, approvedBy: "",
      photos: Object.fromEntries(Object.entries(photos).map(([w, p]) => [w, Object.assign({}, p, { at: at(p.at) })])) });
    return destructionDoc(x, s.hero.expiry, S.batch, S.sku, S.dist);
  }
  // the staff sale's consolidated receipt as a paper of the pack (SC-174): the photo the distributor sent with the sale,
  // his own, and what Vision read from it
  const staffDoc = (r, dist) => ({ id: "staff", type: "Staff sale receipt", owner: dist.short, no: r.no, status: "generated", amount: r.paid, units: r.units, payments: r.payments.length, date: r.date });
  const withStaff = (docs, r, dist) => { if (!r) return docs; const out = docs.slice(), i = out.findIndex(d => d.id === "support"); out.splice(i < 0 ? out.length : i + 1, 0, staffDoc(r, dist)); return out; };
  // on expiry day the packs left at the godown settle by the client's policy, on a credit note of their own (SC-94); and
  // destroyed at his godown, the agency's certificate replaces the paper that waited for it, once Priya approved the
  // evidence (SC-139). A history batch's, or the slow chips' once its destruction is approved (SC-168)
  function expiryPapers(docs, x, xd, batch, sku, dist, no) {
    if (x && x.units) {
      const at = dist.godown || `${dist.city} godown`;
      if (x.policy === "godown") {
        // destroyed at his godown (SC-139): a financial credit note against the agency's certificate, on Priya's yes
        docs.push({ id: "expiry", type: "Expiry credit note", owner: D.CLIENT.short, no, status: "generated", amount: x.amount, units: x.units, policy: x.policy, destroyedBy: x.destroyedBy,
          credit: x.credit, gst: x.gst, charges: x.charges, reversal: x.reversal, dp: sku.dp, gstPct: Math.round(sku.gst * 100), certificate: xd.certificate, agency: xd.agency.name,
          disposal: 0, epr: 0, itc: 0, date: xd.approvedAt.slice(0, 10),
          note: `A financial credit note: no GST is charged or adjusted on it, and ${possessive(C)} output tax on the original sale stands. Issued against destruction certificate ${xd.certificate}; adjusted against ${possessive(dist.name)} account.` });
      } else docs.push({ id: "expiry", type: "Expiry credit note", owner: D.CLIENT.short, no, status: "generated", amount: x.credit, units: x.units, policy: x.policy, destroyedBy: x.destroyedBy,
        disposal: x.disposal, epr: x.epr, itc: x.itc, date: batch.bestBefore,
        note: `The ${M.fmt.num(x.units)} packs that expired at ${at} come back to ${C} for full credit (${M.fmt.inr(x.credit)}), and ${C} destroys them.` });
    }
    if (xd) {
      const i = docs.findIndex(d => d.id === "destruction");
      docs[i] = destructionDoc(xd, x, batch, sku, dist);
    }
    return docs;
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
    expiryPapers(docs, h.expiry, h.destruction, batch, sku, dist, n.expiry);
    const sr = h.staffReceipt ? Object.assign({}, h.staffReceipt, { file: `receipts/${h.ref}.webp`, read: true }) : null;
    const pack = withStaff(docs, sr, dist);
    const orders = kl ? ordersOf(h.distributor, h.kirana.ordered) : [];
    return {
      ref: h.ref, history: true, outcome: h.outcome, flagged: h.flagged, cleared: day("report") || h.bestBefore, numbers: n, steps: h.steps, destruction: h.destruction || null,
      batch, sku, dist, buyer: D.BUYER, plan: h.plan, realised: h.realised, actual: h.actual,
      lines: { kirana: kl || NONE("kirana"), expiresoon: es || NONE("expiresoon") },
      award: h.award ? Object.assign({}, h.award, { price: h.price, bid: h.bid }) : null,
      support: h.support, supportPlan: M.priceSupport(h.plan, sku), claim: M.expiryClaim(h.plan.units, sku),
      // issued from Tally on its invoice step: the e-invoice's IRN and signed QR are worked out from it (SC-148)
      invoiceIssuedAt: es ? when("invoice") : null,
      docs: pack, invoice: pack.find(d => d.id === "invoice") || null, receipt, staffReceipt: sr,
      returnBy: D.addDays(h.bestBefore, -M.RULES.returnWindowDays), expiry: h.expiry,
      listing: n.listing ? { id: n.listing, units: es ? es.units : 0 } : null,
      kiranas: orders, offered: kl ? W.KIRANAS.filter(k => k.distributor === h.distributor).length : 0, scheme: M.RULES.scheme,
      kirana: h.kirana, staff: h.staff, partner,
      donation: partner ? { batch, sku, dist, partner, units: fb.units, from: dist.godown, spot: spotOf(partner.name, dist.city), receipt } : null,
      issued: when("invoice"), reviewed: { by: "priya", at: when("review") },
    };
  }
  const HISTORY = D.HISTORY.batches.map(historyCase);

  /* ---------- the kiranas' tax invoices (SC-153, option A) ---------- */
  // One from the distributor for each shop's order (money.js kiranaInvoice), numbered in his own sales series as the
  // orders were placed: the history's first, then the story's from the series' next. backend-api's steps.order issues
  // them, which history.py runs on the history's timeline: each batch's orders step in turn, its shops two minutes apart
  const SERIES = Object.fromEntries(Object.values(D.DISTRIBUTORS).map(d => [d.id, d.series]));
  const invoiceNo = (distId, n) => SERIES[distId].prefix + String(n).padStart(SERIES[distId].width, "0");
  const plusMinutes = (iso, n) => new Date(Date.parse(iso + ":00Z") + n * 60e3).toISOString().slice(0, 16);
  const shopOf = id => { const k = W.KIRANAS.find(x => x.id === id) || D.KIRANAS.find(x => x.id === id) || { id, name: id, area: "" }; return { id: k.id, name: k.name, area: k.area, pincode: k.pincode || "" }; };
  const invoiceOf = (no, at, kirana, units, line, sku) => Object.assign({ no, date: at.slice(0, 10), at, kirana, shop: shopOf(kirana) }, M.kiranaInvoice(units, line, sku));
  // where each distributor's series began, for backend-api's history to start from (seed.mjs, journey.json history.start)
  const KIRANA_START = {};
  (function () {
    const byDist = {};
    HISTORY.filter(c => c.kiranas.length).map(c => ({ c, at: (c.steps.find(x => x.step === "orders") || {}).at }))
      .sort((a, z) => (a.at < z.at ? -1 : a.at > z.at ? 1 : a.c.ref < z.c.ref ? -1 : 1))
      .forEach(({ c, at }) => c.kiranas.forEach((k, i) => (byDist[c.dist.id] = byDist[c.dist.id] || []).push({ c, k, at: plusMinutes(at, 2 * i) })));
    Object.entries(byDist).forEach(([distId, list]) => {
      const start = SERIES[distId].next - list.length;
      KIRANA_START["kirana." + distId] = start;
      list.forEach(({ c, k, at }, i) => { k.at = at; k.invoice = invoiceOf(invoiceNo(distId, start + i), at, k.kirana, k.units, c.lines.kirana, c.sku); });
    });
  })();
  // the story's: its shops in the order they ordered, from its distributor's next number on (the chips' from Rakesh
  // Traders', the Mango Drink's from Lakshmi Agencies', SC-168)
  function storyInvoices(state) {
    const S = D.story(state), kl = S.KL, sku = S.sku, dist = S.dist.id, next = SERIES[dist].next;
    if (!kl) return [];
    return ((state && state.hero.orders) || []).map((o, i) => invoiceOf(invoiceNo(dist, next + i), `${D.DAY0}T${o.at}`, o.id, o.units, kl, sku));
  }
  // a batch's invoices to its shops, in the order they were issued: the history's from its case, the story's from the
  // journey's state
  const invoicesOf = (c, state) => (c.history ? c.kiranas.map(k => k.invoice) : storyInvoices(state));

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
      // the papers Paperwork laid out (the staff sale's receipt, the distributor's own evidence, is not one of them)
      papers: c.docs.filter(d => d.id !== "staff").map(d => ({ id: d.id, type: d.type, no: d.no, status: d.status, date: d.date || null, amount: d.total != null ? d.total : d.amount != null ? d.amount : null, pdf: !!d.pdf })),
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
  // the story's chips batch, once Impact has posted it: trued up the day after the return window closes
  const STORY_CLEARED = D.addDays(D.RETURN_BY, 1);
  // the batch of the journey the store holds (SC-168): the chips as the story has them, the Mango Drink's own, or the
  // slow chips', whose packs left at the godown settle on expiry day: its expiry credit note and the agency's certificate
  // join its papers once Priya has approved the destruction
  const store = () => window.SC3_STORE.get();
  function storyCase(state) {
    const s = state || store(), S = D.story(s), h = s.hero, sku = S.sku, dist = S.dist;
    const realised = S.realised || Object.assign({}, S.plan, { godown: 0, destroyed: S.plan.leftover });
    const own = S.donation && S.donation.batch.id === S.batch.id ? S.donation : null;
    // the destruction as its papers read it, its times on expiry day and the morning after
    const hd = S.expiry && h.expiry && h.destruction ? h.destruction : null, approved = hd && hd.status === "approved";
    const xd = approved ? Object.assign({}, hd, { method: D.SETUP.destruction.method, approvedAt: `${S.cleared}T${hd.approvedAt || "11:00"}`,
      photos: Object.fromEntries(Object.entries(hd.photos || {}).map(([w, p]) => [w, Object.assign({}, p, { at: `${S.expiryDay}T${p.at}` })])) }) : hd;
    const sr = h.staff && h.staff.receipt && h.staff.receipt.no ? Object.assign({}, h.staff.receipt, { file: h.staff.receipt.file || `receipts/${S.batch.id}.webp` }) : null;
    const docs = withStaff(approved ? expiryPapers(S.docs.slice(), h.expiry, xd, S.batch, sku, dist, S.expiryNo) : S.docs, sr, dist);
    const kl = S.KL, took = id => (realised.lines.find(l => l.id === id && l.units > 0) || { units: 0 }).units;
    return Object.assign({
      ref: S.batch.id, history: false, outcome: S.outcome, flagged: D.DAY0, cleared: S.cleared,
      numbers: Object.assign({}, S.invoice ? { invoice: S.invoice.no } : {}, { support: "CN/0117" }, S.listing ? { listing: S.listing.id } : {}, own ? { receipt: own.receipt.no } : {}, approved ? { expiry: S.expiryNo } : {}),
      batch: S.batch, sku, dist, buyer: D.BUYER, plan: S.plan, realised, actual: S.actual,
      lines: { kirana: kl || NONE("kirana"), expiresoon: S.ES || NONE("expiresoon") },
      award: S.award, support: S.support, supportPlan: S.supportPlan, claim: S.claim, docs, invoice: S.invoice, receipt: own ? own.receipt : null, staffReceipt: sr, returnBy: S.returnBy, expiry: approved ? h.expiry : null,
      listing: S.listing, kiranas: S.kiranas, offered: S.offered, scheme: M.RULES.scheme,
      kirana: S.key === "chips" ? null : kl ? { planned: kl.units, ordered: took("kirana") } : null, staff: S.key === "chips" ? null : took("staff") || null, partner: own ? own.partner : null,
      // the batch the same agents donate, which the FSSAI checklist points to: the Mango Drink beside the chips, or the
      // batch itself in the Mango Drink's own journey
      donation: own ? { batch: S.batch, sku, dist, partner: own.partner, units: own.units, from: dist.godown, spot: spotOf(own.partner.name, dist.city), receipt: own.receipt }
        : S.donation ? { batch: S.donation.batch, sku: S.donation.sku, dist: S.donation.dist, units: S.donation.units, partner: S.donation.partner } : null,
      issued: null, reviewed: { by: "priya", at: null },
    }, xd ? { destruction: xd } : {});
  }
  // a batch's case by its ref: the history's, or the batch of the journey the store holds
  const caseOf = (ref, state) => HISTORY.find(c => c.ref === ref) || (ref === D.story(state || store()).batch.id ? storyCase(state) : null);

  // the ledger as the stub reads it, from the journey's state: the history, the journey's batch once posted, and the
  // story's batches still out
  // cleared cases as the ledger's rows, in the order they cleared
  const rowsOf = cases => cases.map(rowOf).sort((a, b) => (a.cleared < b.cleared ? -1 : a.cleared > b.cleared ? 1 : a.ref < b.ref ? -1 : 1));
  function ledger(state) {
    const S = D.story(state), h = state.hero, rows = rowsOf(h.posted ? HISTORY.concat([storyCase(state)]) : HISTORY);
    const today = h.posted ? S.cleared : D.DAY0;
    const open = b => ({ ref: b.id, sku: b.sku, name: D.SKUS[b.sku].name, img: D.SKUS[b.sku].img, distributor: b.distributor, distributorName: D.DISTRIBUTORS[b.distributor].name, city: D.DISTRIBUTORS[b.distributor].city, flagged: D.DAY0 });
    const inFlight = [];
    if (!h.posted && h.phase !== "watching") inFlight.push(Object.assign(open(S.batch), { phase: h.phase, stage: window.SC3_FLOW.STAGE_IDS[window.SC3_FLOW.stageOf(state)] }));
    if (S.second) inFlight.push(Object.assign(open(S.second), { phase: state.mango.phase, stage: "execute" }));
    return { since: D.WORKSPACE.since, today, co2PerKg: M.RULES.co2PerKg, periods: periods(rows, today), batches: rows, inFlight };
  }

  /* ---------- the partners' own history (SC-130): what a distributor, a kirana and a food bank each read ---------- */
  const stepAt = (c, k) => ((c.steps || []).find(s => s.step === k) || {}).at || null;
  const took = (c, id) => c.realised.lines.find(l => l.id === id && l.units > 0) || null;
  const planned = (c, id) => c.plan.lines.find(l => l.id === id && l.units > 0) || null;
  const rate = n => "₹" + n.toFixed(2);
  const num = n => M.fmt.num(n);
  // a scheme's packets at what each came to, so the row multiplies out to its amount: 2 free in every 12 bring the
  // effective price under the pack's (SC-141)
  const schemeWhat = (units, amount, pack, sc) => `${num(units)} packets at ${rate(units ? Math.round(amount / units * 100) / 100 : 0)} effective (${rate(pack)} a pack, ${sc.free} free with every ${sc.buy})`;
  const weekday = iso => new Date(iso.slice(0, 10) + "T00:00:00+05:30").toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
  // an IST time (2026-08-27T12:10) some hours on
  const plusHours = (iso, h) => { const t = new Date(new Date(iso + ":00+05:30").getTime() + (h + 5.5) * 3600e3); const p = x => String(x).padStart(2, "0"); return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}T${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`; };

  // a distributor's batches: the story's own while in a journey, his other stock the Watcher reads from his DMS export,
  // and every batch he has cleared, newest first
  function distBatches(distId, state) {
    const past = HISTORY.filter(c => c.dist.id === distId).sort((a, z) => (a.flagged < z.flagged ? 1 : -1));
    const S = D.story(state), story = S.batches.filter(b => b.distributor === distId);
    const inJourney = b => (b.hero && state.hero.phase !== "watching") || (b.second && state.mango.phase && state.mango.phase !== "watching");
    // a story batch whose journey has cleared (Impact posted it) is one of his cleared batches, no longer in a journey
    // (SC-162): on Batches in its cleared month, in his sums from the story's own figures (storySum)
    const done = b => b.hero && !!state.hero.posted;
    return { journey: story.filter(b => inJourney(b) && !done(b)), watching: story.filter(b => !inJourney(b)), past,
      done: story.filter(done).map(b => ({ ref: b.id, sku: D.SKUS[b.sku], flagged: D.DAY0, cleared: S.cleared, outcome: S.outcome, story: true })) };
  }
  // the papers a distributor sees: those he issues (his tax invoice and its e-way bill check) and those issued to him
  // (Munchly's price-support and expiry credit notes); and copies of what concerns his packs (the food bank's receipt,
  // the destruction certificate). Munchly's GST ITC memo and FSSAI checklist stay Munchly's
  function distPapers(c) {
    const has = d => d && d.status !== "not required";
    const doc = id => c.docs.find(d => d.id === id);
    // packs destroyed at his own godown (SC-139): the agency's certificate is issued for him, so it is his paper
    const his = d => d && d.id === "destruction" && d.at === "godown";
    return { mine: ["invoice", "eway", "support", "staff", "expiry", "destruction"].map(doc).filter(d => d && (d.id === "destruction" ? his(d) && has(d) : has(d) || d.id === "eway")), copies: ["receipt", "destruction"].map(doc).filter(d => has(d) && !his(d)) };
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
  // a cleared batch's sum, as his Batches and Orders show it (SC-145): what he sold from it (whole's rows from his buyers)
  // and what the client credited him (its credit notes), which together are what it cost him, so he ends whole
  function sumOf(c) {
    const w = whole(c), r2 = n => Math.round(n * 100) / 100;
    return { ref: c.ref, sold: r2(w.rows.filter(r => !r.paper).reduce((t, r) => t + r.v, 0)), credit: r2(w.rows.filter(r => r.paper).reduce((t, r) => t + r.v, 0)), cost: w.paid };
  }
  // every batch he cleared, summed: the sales, the credit, the cost, and the credit notes that carried the credit; with
  // the story's own once its journey has cleared (SC-162: `story`, storySum's, each on its price-support credit note)
  function sumsOf(past, story) {
    story = story || [];
    const xs = past.map(sumOf).concat(story), t = k => Math.round(xs.reduce((a, x) => a + x[k], 0) * 100) / 100;
    const notes = past.reduce((n, c) => n + c.docs.filter(d => (d.id === "support" || d.id === "expiry") && d.status !== "not required").length, 0) + story.reduce((t, x) => t + (x.notes || 1), 0);
    return { n: past.length + story.length, sold: t("sold"), credit: t("credit"), cost: t("cost"), notes, batches: xs };
  }
  // the story's chips batch once its journey has cleared (SC-162): its sum from its own money, as its page's Money tab
  // reads it (storyWhole): what he sold, what the client credited him, and what it cost him
  function storySum(state) {
    const w = storyWhole(state), r2 = n => Math.round(n * 100) / 100;
    const credits = w.rows.filter(creditRow), credit = credits.reduce((t, r) => t + r.v, 0);
    return Object.assign({ ref: D.story(state).batch.id, sold: r2(w.recv - credit), credit: r2(credit), cost: w.paid }, credits.length > 1 ? { notes: credits.length } : {});
  }
  // the story's credit notes among what he received: the price support, and the expiry credit note on expiry day
  const creditRow = r => r.k === "Price-support credit note" || /^Expiry credit note/.test(r.k);
  // his cleared batches summed, the story's with them once its journey has cleared (SC-162), as Batches and Orders show it
  function sumsAt(distId, state) {
    const b = distBatches(distId, state);
    return sumsOf(b.past, b.done.map(() => storySum(state)));
  }
  // the story's chips batch while in a journey: what has happened so far (the feed), the next three, and the plan's money
  // each from the story's own figures: the chips' as they always read, the Mango Drink's own journey, the slow chips'
  function storyMomentsOf(S) {
    const kl = S.KL, es = S.ES, st = S.plan.lines.find(l => l.id === "staff" && l.units > 0), own = S.donation && S.donation.batch.id === S.batch.id ? S.donation : null;
    const ordered = S.kiranas.reduce((t, k) => t + k.units, 0), x = S.expiry;
    const out = S.setupDone ? [] : [["permit", "handshake", "You gave the one-time permission"]];
    out.push(["watch", "radar", `The Watcher flagged ${num(S.plan.units)} packs at risk`], ["ask", "scan-line", "Vision asked you for a label photo"], ["photo", "camera", "You sent the label photo"], ["read", "scan-line", "Vision read the label"], ["approved", "check", `${C} approved the plan`]);
    if (es) out.push(["list", "shopping-bag", `${num(es.units)} listed on ExpireSoon in your name`]);
    if (kl) out.push(["outreach", "send", `The scheme went to ${S.offered} of your kiranas`]);
    if (own) out.push(["donate", "heart-handshake", `${own.partner.name} booked for ${num(own.units)} packs`]);
    if (es) out.push(["accepted", "handshake", `${D.BUYER.name} took the counter at ${rate(S.counter.price)}`]);
    if (kl) out.push(["orders", "store", `${S.kiranas.length} kiranas ordered ${num(ordered)} packets`]);
    if (kl && !S.fills) out.push(["closeOffer", "clock", "The scheme closed after 48 hours", `${num(kl.units - ordered)} packets were not ordered`]);
    if (st) out.push(["staff", "users", `Your staff sale sold ${num(st.units)} packs`]);
    if (own) out.push(["collect", "package-check", `${own.partner.name} collected ${num(own.units)} packs`]);
    if (es) out.push(["dispatch", "truck", `You loaded ${D.BUYER.name}'s truck`]);
    out.push(["papers", "file-check", "The Paperwork agent drafted your papers"]);
    if (kl) out.push(["van", "route", `Your ${S.journey.van.day} van round delivered the scheme`]);
    if (x) out.push(["destroyAsk", "warehouse", `Asked to destroy ${num(x.units)} expired packs at your godown`], ["destroySent", "camera", "You sent the destruction's evidence"], ["destroyApproved", "badge-check", `${D.PEOPLE.priya.short} approved the destruction`]);
    out.push(["ledger", "badge-check", "Settled: you ended whole"]);
    return out;
  }
  function storyMoments(state) {
    const items = []; let next = 0;
    storyMomentsOf(D.story(state)).forEach(([k, icon, title, sub]) => { const e = (state.feed || []).find(x => x.key === k); if (e) items.push(Object.assign({ k, icon, title, at: e.at }, sub ? { sub } : {})); else if (next < 3 && state.feed && state.feed.length) { items.push({ k, icon, title, ahead: true }); next++; } });
    return items;
  }
  // what he received against what he paid: the lines as they came to, the price support and, on expiry day, the expiry
  // credit note, which make them equal; destroyed at his godown, he also reversed the GST on those packs and paid the
  // agency, which the note makes good (SC-139)
  function storyWhole(state) {
    const S = D.story(state), sku = S.sku, h = state.hero, r = S.realised || S.plan;
    const took = id => r.lines.find(l => l.id === id && l.units > 0) || null;
    const kl = took("kirana"), es = took("expiresoon"), st = took("staff"), fb = took("foodbank");
    const rows = [];
    if (kl) rows.push({ k: "From your kiranas", sub: `${num(kl.units)} packets on the scheme`, v: kl.gross });
    if (es) rows.push({ k: `From ${D.BUYER.name}`, sub: `${num(es.units)} packets`, v: h.award ? S.award.gross : es.gross });
    if (st) rows.push({ k: "Your staff sale", sub: `${num(st.units)} packs`, v: st.gross });
    if (fb) rows.push({ k: `Given to ${S.donation.partner.name}`, sub: `${num(fb.units)} packs`, v: 0 });
    rows.push({ k: "Price-support credit note", sub: `from ${C}`, v: S.support.total });
    const x = h.expiry && h.destruction && h.destruction.status === "approved" ? h.expiry : null;
    if (x) rows.push({ k: `Expiry credit note for ${num(x.units)} packs`, sub: `from ${C}`, v: x.amount });
    const recv = rows.reduce((t, r) => t + r.v, 0), paid = S.plan.units * sku.dp + S.support.van + S.support.fee + (x ? (x.reversal || 0) + (x.charges || 0) : 0);
    return { rows, recv, paid, gain: Math.round(recv - paid), dp: sku.dp, units: S.plan.units };
  }

  // a shop's order as its tax invoice has it (SC-153): every packet at the pack price less the scheme's discount, the
  // GST on that, what the shop paid, and its margin selling them all at MRP
  const scheme = (n, line, sku) => { const inv = M.kiranaInvoice(n, line, sku); return { n, rate: inv.rate, discountPct: inv.discountPct, taxable: inv.taxable, gstPct: inv.gstPct, tax: inv.tax, pay: inv.total, sell: n * sku.mrp, margin: r2(n * sku.mrp - inv.total) }; };
  // every offer a shop was sent: its distributor's cleared batches with a kirana line, then the story's own. An offer is
  // open, ordered, declined (Not this time) or expired: its 48 hours ended, or the scheme filled before the shop ordered
  function offersFor(shop, state) {
    const cap = M.RULES.shopCapTimes;
    const past = HISTORY.filter(c => c.dist.id === shop.distributor && planned(c, "kirana")).map(c => {
      const o = c.kiranas.find(x => x.kirana === shop.id), kl = planned(c, "kirana");
      const sent = stepAt(c, "offer"), filled = c.kirana.ordered >= c.kirana.planned;
      const closed = filled ? stepAt(c, "orders") : stepAt(c, "closeOffer") || plusHours(sent, 48);
      return { ref: c.ref, sku: c.sku, dist: c.dist, sent, closed, share: shop.sales14 * cap, pack: kl.packPrice, mrp: c.sku.mrp, bestBefore: c.batch.bestBefore,
        status: o ? "ordered" : "expired", why: o ? null : filled ? "filled" : "time", units: o ? o.units : 0, orderedAt: o ? o.at || stepAt(c, "orders") : null, van: o ? stepAt(c, "van") : null, m: o ? scheme(o.units, kl, c.sku) : null, invoice: o ? o.invoice || null : null };
    }).sort((a, z) => (a.sent < z.sent ? 1 : -1));
    const h = state.hero, S = D.story(state);
    if (shop.distributor !== S.dist.id || !h.offer || !S.KL) return past;
    const KL = S.KL, sku = S.sku, o = h.orders.find(x => x.id === shop.id), dec = (h.declined || {})[shop.id];
    // the scheme filled before the shop ordered, or its 48 hours ended (the slow chips' window, SC-168)
    const filled = h.orders.reduce((t, x) => t + x.units, 0) >= KL.units, over = filled || h.offer.status === "closed";
    const sent = `${D.DAY0}T${h.offer.at}`;
    const status = o ? "ordered" : dec ? "declined" : over ? "expired" : "open";
    const last = h.orders.reduce((t, x) => (x.at > t ? x.at : t), "00:00");
    return [{ ref: S.batch.id, story: true, open: !over, sku, dist: S.dist, sent, closed: filled ? `${D.DAY0}T${last}` : plusHours(sent, 48), share: shop.sales14 * cap, pack: KL.packPrice, mrp: sku.mrp, bestBefore: S.batch.bestBefore,
      status, why: status === "expired" ? (filled ? "filled" : "time") : null, declinedAt: dec ? `${D.DAY0}T${dec.at}` : null, units: o ? o.units : 0, orderedAt: o ? `${D.DAY0}T${o.at}` : null,
      van: o && h.van.status === "done" ? D.addDays(D.DAY0, S.vanDay) + "T09:00" : null, m: o ? scheme(o.units, KL, sku) : null, invoice: o ? storyInvoices(state).find(x => x.kirana === shop.id) || null : null }].concat(past);
  }

  // a food bank's pickups: the story's Mango Drink while it is coming or once collected, then the donations it collected
  // from Munchly's cleared batches, each with the receipt it issued as it collected
  function pickupsFor(org, state) {
    const past = HISTORY.filter(c => c.partner && c.partner.name === org).map(c => ({ ref: c.ref, c, sku: c.sku, dist: c.dist, units: c.donation.units, kg: c.receipt.kg, meals: c.receipt.meals, receipt: c.receipt, spot: c.donation.spot,
      from: `${c.dist.godown}, ${c.dist.city}`, asked: stepAt(c, "donation"), confirmed: stepAt(c, "pickup"), collected: stepAt(c, "collect"), bestBefore: c.batch.bestBefore, daysLeft: c.batch.daysLeft, state: "collected" }))
      .sort((a, z) => (a.collected < z.collected ? 1 : -1));
    const S = D.story(state), x = S.donation, DN = S.journey.donation, d = state.mango.donation;
    if (!x || org !== DN.partner || !d) return past;
    const dist = x.dist, R = x.receipt;
    return [{ ref: x.batch.id, story: true, sku: x.sku, dist, units: x.units, kg: R.kg, meals: R.meals, receipt: d === "collected" ? R : null, spot: DN.spot, from: `${DN.from}, ${dist.city}`,
      bestBefore: x.batch.bestBefore, daysLeft: x.batch.daysLeft, state: d, slot: `${DN.date} · ${DN.time}` }].concat(past);
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
    const h = state.hero, S = D.story(state), units = h.orders.reduce((t, o) => t + o.units, 0), DN = S.journey.donation;
    // the batch's own donation, in the Mango Drink's own journey (SC-168): its pickup as the food bank stands
    const own = S.donation && S.donation.batch.id === S.batch.id ? S.donation : null, m = state.mango;
    return { ref: S.batch.id, sku: S.batch.sku, dist: S.batch.distributor, flagged: D.DAY0, phase: h.phase, units: S.plan.units, shelf: S.batch.shelf || null,
      photo: h.photo.status, approved: ROUTED.includes(h.phase), lines: h.plan ? linesOf(S.plan) : [],
      offer: h.offer ? { open: h.offer.status === "sent" && units < S.KL.units, offered: S.offered, shops: h.orders.length, units } : null,
      shops: storyInvoices(state).map(x => ({ kirana: x.kirana, units: x.units, at: x.at, invoice: { no: x.no, total: x.total, tax: x.tax } })),
      listing: h.listing ? { id: S.listing.id } : null, award: h.award ? { price: S.counter.price, token: S.award.token } : null, awardAt: h.award && h.award.at ? `${D.DAY0}T${h.award.at}` : null,
      truck: h.truck.status === "dispatched", van: h.van.status === "done", papers: !!h.docs,
      invoice: h.docs && S.invoice ? { no: S.invoice.no, total: S.invoice.total, issued: !!h.invoiceIssued } : null,
      staff: h.staff ? { status: h.staff.status, units: h.staff.units, price: h.staff.price, sold: h.staff.sold == null ? null : h.staff.sold, receipt: h.staff.receipt || null } : null,
      // the packs left at his godown on expiry day, destroyed there against evidence the client approves (SC-139)
      destruction: h.destruction ? { status: h.destruction.status, units: h.destruction.units, reason: h.destruction.reason || null } : null,
      donation: own && m.id === h.id && m.donation ? { status: m.donation, partner: DN.partner, units: own.units, date: DN.date, time: DN.time } : null, round: { day: S.journey.van.day, date: S.journey.van.date, leaves: S.journey.van.leaves } };
  }
  // the Mango Drink beside the story's chips, executing from the story's start: the scheme open to Lakshmi's shops, the
  // staff sale, the pickup
  function nowOfSecond(state) {
    const m = state.mango, SECOND = D.story(state).second, DN = D.JOURNEY.donation, st = D.MANGO_PLAN.lines.find(l => l.id === "staff");
    return { ref: SECOND.id, sku: SECOND.sku, dist: SECOND.distributor, flagged: D.DAY0, phase: m.phase, units: D.MANGO_PLAN.units, shelf: SECOND.shelf || null,
      photo: "verified", approved: ROUTED.includes(m.phase), lines: linesOf(D.MANGO_PLAN),
      offer: { open: true, offered: W.KIRANAS.filter(k => k.distributor === SECOND.distributor).length, shops: 0, units: 0 }, shops: [],
      listing: null, award: null, awardAt: null, truck: false, van: false, papers: false, invoice: null,
      staff: st ? (m.staff ? { status: m.staff.status, units: m.staff.units, price: st.price, sold: m.staff.sold, receipt: m.staff.receipt || null } : { status: "open", units: st.units, price: st.price, sold: null }) : null,
      donation: m.donation ? { status: m.donation, partner: DN.partner, units: D.MANGO_FB, date: DN.date, time: DN.time } : null, round: null, destruction: null };
  }
  // his batches in a journey now, as the stub has them: the journey's batch, and the story's second beside the chips
  function distNow(distId, state) {
    const out = [], S = D.story(state);
    if (S.batch.distributor === distId && state.hero.phase && state.hero.phase !== "watching") out.push(nowOfHero(state));
    if (S.second && S.second.distributor === distId && state.mango.phase && state.mango.phase !== "watching") out.push(nowOfSecond(state));
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
    const shops = n.shops.map(k => ({ name: shopName(k.kirana), units: k.units, at: k.at || null, invoice: k.invoice || null }));
    const sku = w.skus[n.sku], dist = w.distributors[n.dist], out = [], o = n.offer;
    const line = id => n.lines.find(l => l.id === id) || null;
    const kl = line("kirana"), es = line("expiresoon"), st = line("staff"), fb = line("foodbank");
    if (es && n.award) out.push({ id: "expiresoon", units: es.units, who: `${w.buyer.name}, ${w.buyer.city}`, what: `lot ${n.listing ? n.listing.id : ""} · ${num(es.units)} × ${rate(n.award.price)}`,
      sub: `token ${inr(n.award.token)} · balance ${inr(Math.round((es.units * n.award.price - n.award.token) * 100) / 100)} · ${n.truck ? "collected by the buyer's truck" : "the buyer's truck collects"}`,
      amount: Math.round(es.units * n.award.price * 100) / 100, at: n.awardAt || null, paper: n.invoice ? { no: n.invoice.no, label: n.invoice.issued ? "issued from Tally" : "drafted by the Paperwork agent", issue: !n.invoice.issued } : null });
    if (kl && o && o.shops) { const amount = Math.round(shops.reduce((t, k) => t + M.kiranaInvoice(k.units, kl, sku).taxable, 0) * 100) / 100;
      out.push({ id: "kirana", units: o.units, who: `${o.shops} ${o.shops === 1 ? "kirana" : "kiranas"}`, what: schemeWhat(o.units, amount, kl.packPrice, w.scheme),
        sub: n.van ? `delivered on ${n.round ? `the ${n.round.day} round` : "the van round"}` : n.round ? `on the ${n.round.day} round, ${n.round.date}` : "on the van round once the papers are drafted",
        amount, at: shops.reduce((t, k) => (k.at && (!t || k.at > t) ? k.at : t), null), shops, invoices: invoicesLine(shops) }); }
    if (st && n.staff && n.staff.status === "recorded" && n.staff.sold) out.push({ id: "staff", units: n.staff.sold, who: "Your staff sale", what: `${num(n.staff.sold)} packs at ${rate(st.price)}`, sub: `at ${dist.godown}`, amount: Math.round(n.staff.sold * st.price * 100) / 100, at: null });
    if (fb && n.donation && n.donation.status === "collected") out.push({ id: "foodbank", units: fb.units, who: n.donation.partner, what: `${num(fb.units)} packs given`, sub: "the receipt is in the batch's papers", amount: 0, at: null });
    return out;
  }
  // a scheme's invoices, as its row names them: how many, from the first number to the last, and the GST he collected
  function invoicesLine(shops) {
    const v = shops.map(k => k.invoice).filter(Boolean); if (!v.length) return null;
    return { n: v.length, first: v[0].no, last: v[v.length - 1].no, tax: r2(v.reduce((t, x) => t + x.tax, 0)), total: r2(v.reduce((t, x) => t + x.total, 0)) };
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
    if (kl) out.push({ id: "kirana", units: kl.units, who: `${c.kiranas.length} ${c.kiranas.length === 1 ? "kirana" : "kiranas"}`, what: schemeWhat(kl.units, kl.gross, planned(c, "kirana").packPrice, w.scheme),
      sub: `${c.kirana && c.kirana.ordered < c.kirana.planned ? `of ${num(c.kirana.planned)} offered · ` : ""}${stepAt(c, "van") ? `delivered on the ${weekday(stepAt(c, "van"))} round` : "delivered on the van round"}`,
      amount: kl.gross, at: stepAt(c, "orders"), shops: c.kiranas.map(k => ({ name: shopName(k.kirana), units: k.units, at: k.at || null, invoice: k.invoice ? { no: k.invoice.no, total: k.invoice.total, tax: k.invoice.tax } : null })) });
    const row = out.find(x => x.id === "kirana"); if (row) row.invoices = invoicesLine(row.shops);
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
  const historyFacts = c => Object.assign({}, c, { sku: c.sku.id || c.sku, dist: c.dist.id || c.dist, kiranas: c.kiranas.map(k => ({ kirana: k.kirana, units: k.units, at: k.at, invoice: k.invoice })) });

  // ---------- a batch's record (SC-142): the photos sent for it, the human yeses and the audit trail ----------
  // backend-api writes the trail from the case's feed (each agent's run) and the audit log (each person's decision, in
  // their name, the kiranas' orders folded into one row); the stub writes the same rows from the history's steps, or
  // from the story's feed and audit. A row: { key, at, who: { kind, id, name, org }, text, yes, items? }
  const YES = ["plan.approve", "docs.review", "destruction.approve"];
  const agentOf = name => ({ kind: "agent", id: name.toLowerCase().replace(/ agent$/, ""), name, org: null });
  const personOf = p => ({ kind: "person", id: p.id || null, name: p.name, org: p.org || null });
  const byOrg = (org, name) => Object.values(D.PEOPLE).find(p => p.org === org) || { id: null, name: name || org, org };
  const sortAt = rows => rows.map((r, i) => [r, i]).sort((a, z) => (a[0].at < z[0].at ? -1 : a[0].at > z[0].at ? 1 : a[1] - z[1])).map(x => x[0]);
  function recordOf(c) {
    const at = k => stepAt(c, k), out = [];
    const add = (key, who, text, t, x) => { if (t) out.push(Object.assign({ key, at: t, who, text, yes: YES.includes(key) }, x)); };
    const dist = personOf(byOrg(c.dist.name)), priya = personOf(D.PEOPLE.priya), buyer = personOf(byOrg(c.buyer.name, c.buyer.name));
    const kl = planned(c, "kirana"), es = planned(c, "expiresoon"), fb = planned(c, "foodbank"), xd = c.destruction;
    const doc = id => c.docs.find(d => d.id === id && d.status !== "not required");
    const mfg = c.batch.mfg || D.addDays(c.batch.bestBefore, -c.sku.lifeDays);
    const split = c.plan.lines.filter(l => l.units > 0 && l.id !== "writeoff").map(l => `${num(l.units)} ${{ kirana: "to the kiranas", expiresoon: "on ExpireSoon", staff: "to the staff sale", foodbank: "to the food bank" }[l.id] || l.id}`).join(", ");
    add("watch", agentOf("Watcher"), `Flagged ${num(c.plan.units)} of ${num(c.batch.units)} packs at ${c.dist.godown}: ${c.batch.daysLeft} days left, failing every quick-commerce gate`, at("detect"));
    add("photo.send", dist, "sent the label photo", at("photo"));
    add("read", agentOf("Vision"), `Read the label: batch ${c.ref}, made ${M.fmt.date(mfg)}, best before ${M.fmt.date(c.batch.bestBefore)}, MRP ${rate(c.sku.mrp)}. Matches the DMS record`, at("read"));
    add("value", agentOf("Valuer"), `Priced every exit against ${c.batch.daysLeft} days left`, at("value"));
    add("route", agentOf("Router"), `Split the batch: ${split}; ${M.fmt.inr(c.plan.net)} planned`, at("route"));
    add("plan.approve", priya, `approved the plan · net ${M.fmt.inr(c.plan.net)}`, at("approve"));
    if (es) add("list", agentOf("Lister"), `Listed ${num(es.units)} on ExpireSoon in ${c.dist.name}' name (${c.numbers.listing})`, at("listing"));
    if (kl) add("outreach", agentOf("Outreach"), `Sent the scheme to ${c.offered} kiranas: buy 10, get 2, for 48 hours`, at("offer"));
    if (fb && c.partner) add("donation", agentOf("Donation"), `Booked ${c.partner.name} for ${num(fb.units)} packs`, at("donation"));
    if (kl && c.kiranas.length) add("offer.order", { kind: "person", id: null, name: `${c.kiranas.length} kiranas`, org: `${c.dist.name}' scheme` }, `ordered ${num(c.kiranas.reduce((t, k) => t + k.units, 0))} packets`, at("orders"),
      { items: c.kiranas.map(k => ({ who: { kind: "person", id: null, name: shopName(k.kirana), org: null }, text: `ordered ${num(k.units)} packets`, at: k.at || at("orders") })) });
    if (c.award) {
      add("listing.bid", buyer, `bid ${rate(c.award.bid)} on ${c.numbers.listing}`, at("bid"));
      add("counter", agentOf("Negotiator"), `Countered at ${rate(c.award.price)}`, at("counter"));
      add("listing.accept", buyer, `accepted ${rate(c.award.price)} and paid the ${M.fmt.inr(c.award.token)} token`, at("accept"));
    }
    if (took(c, "foodbank") && c.partner) add("donation.collect", personOf(byOrg(c.partner.name, c.partner.name)), `collected ${num(took(c, "foodbank").units)} packs`, at("collect"));
    if (kl) add("closeOffer", agentOf("Outreach"), `The scheme closed: ${num(c.kirana.ordered)} of ${num(c.kirana.planned)} packets ordered`, at("closeOffer"));
    if (took(c, "staff")) add("staff.record", dist, `recorded the staff sale: ${num(took(c, "staff").units)} packs`, at("staff"));
    if (c.award) add("dispatch.truck", dist, `loaded ${c.buyer.name}'s truck`, at("truck"));
    add("papers", agentOf("Paperwork"), `Drafted the pack: ${["invoice", "support", "itc", "fssai"].map(doc).filter(Boolean).map(d => (/^s\./.test(d.no) || !d.no ? d.type : d.no)).join(", ")}`, at("papers"));
    if (doc("invoice")) add("invoice.issue", dist, `issued ${doc("invoice").no} from Tally`, at("invoice"));
    if (kl) add("dispatch.van", dist, `ran the ${weekday(at("van") || c.cleared)} round: ${c.kiranas.length} drops`, at("van"));
    add("docs.review", priya, `reviewed ${C}'s credit note and GST memo`, at("review"));
    if (xd) {
      add("destroyAsk", agentOf("Impact"), `Asked ${c.dist.name} to destroy the ${num(xd.units)} packs left at ${c.dist.godown}`, at("destroyAsk"));
      add("destruction.send", dist, `sent the destruction's evidence: ${num(xd.units)} packs, ${xd.agency.name}`, at("destroySent"));
      add("destroyChecked", agentOf("Vision"), `Checked the destruction's evidence: ${xd.checks.filter(x => x.ok).length} of ${xd.checks.length} checks pass`, xd.checkedAt);
      add("destruction.approve", priya, `approved the destruction of ${num(xd.units)} packs at ${c.dist.godown}`, xd.approvedAt);
    }
    add("ledger", agentOf("Impact"), `Posted the ledger: ${M.fmt.inr(c.actual.net)} recovered`, at("report"));
    return { ref: c.ref, steps: sortAt(out) };
  }
  // the story's batch, in a journey: its feed in order (the agents' runs and each person's step), without the workspace's
  // setup or another batch's rows, and the decisions only its audit keeps (the papers' review after the pack, the BRSR
  // sign-off after the ledger). The stub's times are its own (09:19, Mon 5 Oct): kept as they are
  function storyRecord(s) {
    const S = D.story(s), hero = S.batch, others = S.batches.filter(b => b.id !== hero.id).map(b => b.id);
    const who = id => S.people[id] || { id, name: id };
    const KEY = { approved: "plan.approve", destroyApproved: "destruction.approve" };
    // beside the chips, the Mango Drink's donation is the other batch's (SC-168: in its own journey, its own)
    const rows = s.feed.filter(e => e.stage !== "connect" && !(S.second && /^Mango Drink batch/.test(e.text || "")) && !others.some(id => (e.text || "").includes(id)))
      .map(e => { const key = KEY[e.key] || e.key || "step"; return { key, at: e.at, who: e.agent ? agentOf(e.agent) : personOf(who(e.person)), text: e.text, yes: YES.includes(key) }; });
    const after = (key, row) => { const i = rows.map(r => r.key).lastIndexOf(key); if (i >= 0) rows.splice(i + 1, 0, row); else rows.push(row); };
    s.audit.filter(a => a.target === hero.id && /reviewed|signed off/.test(a.what)).slice().reverse().forEach(a => {
      const key = /reviewed/.test(a.what) ? "docs.review" : "report.signoff";
      after(key === "docs.review" ? "papers" : "ledger", { key, at: a.at, who: personOf(who(a.who)), text: a.what, yes: YES.includes(key) });
    });
    return { ref: hero.id, steps: rows };
  }
  // the photos sent for a batch: its label photo, with what Vision read, and the destruction's two, with Vision's checks
  // (img: the file under the design system's img/)
  function photosOf(c) {
    const out = [], dp = byOrg(c.dist.name), xd = c.destruction, at = stepAt(c, "photo");
    const mfg = c.batch.mfg || D.addDays(c.batch.bestBefore, -c.sku.lifeDays);
    if (at) out.push({ id: "label", img: `labels/${c.ref}.webp`, at, by: dp.name,
      read: { at: stepAt(c, "read"), batch: c.ref, mfg, bestBefore: c.batch.bestBefore, mrp: c.sku.mrp, matches: true } });
    if (xd && xd.photos) ["before", "after"].forEach(w => xd.photos[w] && out.push({ id: w, img: `evidence/${xd.photos[w].name}`, at: xd.photos[w].at, by: dp.name,
      checks: xd.checks.filter(x => (w === "before" ? ["batch", "count"] : ["slate", "when"]).includes(x.id)) }));
    // the staff sale's consolidated receipt (SC-174), sent with the sale, and what Vision read from it
    if (c.staffReceipt) out.push(receiptPhoto(c.staffReceipt, c.sku, stepAt(c, "staff"), dp.name));
    return out;
  }
  const receiptPhoto = (r, sku, at, by) => ({ id: "receipt", img: r.file, at: at || r.to, by,
    receipt: { no: r.no, payments: r.payments.length, paid: r.paid, units: r.units, from: r.from, to: r.to, matches: true, list: r.payments } });
  // the story's batch: its label photo once Rakesh has sent it, and the destruction's two once he has sent them
  function storyPhotos(s) {
    const S = D.story(s), hero = S.batch, sku = S.sku, h = s.hero, out = [], at = t => (/^\d\d:\d\d$/.test(t || "") ? `${D.DAY0}T${t}` : D.DAY0);
    const by = (S.people[S.accounts.distributor] || { name: S.dist.name }).name;
    if (h.photo && h.photo.status && h.photo.status !== "requested" && h.photo.status !== "none") out.push({ id: "label", img: `labels/${hero.id}.webp`, at: at(h.photo.at), by,
      read: h.photo.status === "verified" ? { at: at(h.photo.at), batch: hero.id, mfg: hero.mfg || D.addDays(hero.bestBefore, -sku.lifeDays), bestBefore: hero.bestBefore, mrp: sku.mrp, matches: true } : null });
    const xd = h.destruction;
    if (xd && xd.photos) ["before", "after"].forEach(w => xd.photos[w] && out.push({ id: w, img: `evidence/${evidenceFile(hero.id, w, xd.photos[w])}`, at: at(xd.photos[w].at), by,
      checks: (xd.checks || []).filter(x => (w === "before" ? ["batch", "count"] : ["slate", "when"]).includes(x.id)) }));
    const sr = h.staff && h.staff.receipt && h.staff.receipt.no ? h.staff.receipt : null;
    if (sr) out.push(receiptPhoto(Object.assign({}, sr, { file: sr.file || `receipts/${hero.id}.webp` }), sku, h.staff.recordedAt ? at(h.staff.recordedAt) : sr.to, by));
    return out;
  }
  // a destruction photo's file under img/evidence: the one it was sent as (the slow chips' expiry-day landfill photo,
  // SC-168), else the batch's own
  function evidenceFile(ref, which, p) { return p && /\.(webp|jpe?g|png)$/i.test(p.name || "") ? p.name.replace(/^.*\//, "") : `${ref}-${which}.webp`; }
  const record = { recordOf, storyRecord, photosOf, storyPhotos, evidenceFile, YES };

  const partners = { distBatches, distPapers, moments, whole, sumOf, sumsOf, storySum, sumsAt, storyMoments, storyMomentsOf, storyWhole, scheme, offersFor, pickupsFor, fssaiItems, stepAt, plusHours,
    STOP, distNow, journeyOf, journeys, ordersNow, ordersPast, deliveriesPast, photoOf, shopName, historyFacts, WORLD, storyInvoices, invoicesOf };

  /* ---------- the Impact dashboard (SC-157): a period's figures drawn from its rows ---------- */
  // the kilos by the week each batch cleared, by distributor, by product and by channel, and the period before, all from
  // the ledger's rows; the screens (design3 finance.jsx, core's Svelte) read this, and core's ledger.ts is held to it
  const MS = 864e5;
  const CH = ["kirana", "expiresoon", "staff", "d2c", "foodbank", "writeoff"];
  function dashboard(book, pid) {
    const periods = book.periods; const p = periods.find(x => x.id === pid) || periods[periods.length - 1];
    const rows = book.batches.filter(r => r.cleared >= p.from && r.cleared <= p.to);
    const qs = periods.filter(x => x.kind === "quarter"); const qi = qs.findIndex(x => x.id === p.id);
    const prev = p.kind === "quarter" && qi > 0 ? qs[qi - 1] : null;
    const end = p.current ? book.today : p.to;
    // the weeks run from the period's start, or from the first batch the workspace cleared when that came later (the
    // year starts in April; the workspace since July), in whole weeks
    const firstEver = book.batches.length ? Date.parse(book.batches[0].cleared) : Date.parse(p.from);
    const d0 = Math.max(Date.parse(p.from), firstEver - ((firstEver - Date.parse(p.from)) % (7 * MS))), dEnd = Date.parse(end);
    const weeks = [];
    for (let t = d0; t <= dEnd; t += 7 * MS) weeks.push({ from: new Date(t).toISOString().slice(0, 10), kept: 0, resold: 0, donated: 0, destroyed: 0, closed: 0, net: 0, meals: 0 });
    rows.forEach(r => { const i = Math.min(weeks.length - 1, Math.floor((Date.parse(r.cleared) - d0) / (7 * MS))); const w = weeks[i]; const F = r.figures; w.kept = r2(w.kept + F.kg); w.resold = r2(w.resold + F.resoldKg); w.donated = r2(w.donated + F.donatedKg); w.destroyed = r2(w.destroyed + F.destroyedKg); w.closed += 1; w.net = r2(w.net + F.net); w.meals += F.meals; });
    const group = key => { const by = {}; rows.forEach(r => { const k = r[key]; by[k] = by[k] || { label: k, img: r.img, resold: 0, donated: 0, destroyed: 0, batches: 0 }; by[k].resold = r2(by[k].resold + r.figures.resoldKg); by[k].donated = r2(by[k].donated + r.figures.donatedKg); by[k].destroyed = r2(by[k].destroyed + r.figures.destroyedKg); by[k].batches += 1; }); return Object.values(by).map(x => Object.assign(x, { kept: r2(x.resold + x.donated) })).sort((a, b) => b.kept - a.kept || (a.label < b.label ? -1 : 1)); };
    const mix = {}; rows.forEach(r => { const per = (r.figures.kg + r.figures.destroyedKg) / (r.figures.units || 1); r.lines.forEach(l => (mix[l.id] = (mix[l.id] || 0) + l.units * per)); mix.writeoff = (mix.writeoff || 0) + r.figures.destroyedKg; });
    const mixKg = CH.filter(id => mix[id] > 0).map(id => [id, Math.round(mix[id] * 10) / 10]);
    const t = p.totals, tPrev = prev ? prev.totals : null;
    const share = t.kg + t.destroyedKg ? Math.round((t.kg / (t.kg + t.destroyedKg)) * 1000) / 10 : null;
    return { pid: p.id, prev: prev ? prev.id : null, rows: rows.map(r => r.ref), weeks, byDist: group("distributorName"), bySku: group("name"), mixKg, share, end };
  }
  // the period the Command Center's Impact card reads (SC-157): the current quarter once a batch has cleared in it,
  // else the latest quarter that has one, else the year so far
  function impactPeriod(book) {
    const qs = book.periods.filter(x => x.kind === "quarter");
    const cur = qs.find(x => x.current);
    if (cur && cur.totals.batches) return cur;
    const withBatches = qs.filter(x => x.totals.batches);
    return withBatches[withBatches.length - 1] || book.periods[book.periods.length - 1];
  }

  window.SC3_LEDGER = { HISTORY, STORY_CLEARED, historyCase, storyCase, caseOf, draftCertificate, rowOf, rowsOf, totals, periods, ledger, ordersOf, outcomeOf, MIX, partners, record, KIRANA_START, storyInvoices, invoicesOf, dashboard, impactPeriod };
})();

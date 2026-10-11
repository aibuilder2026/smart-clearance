/* Smart-Clearance v3 · the journey as deterministic actions, and the agents that chain them.
   The demo steps through stages (and can fast-forward to any stage); the app lets the agents run live.
   The store runs one journey at a time (SC-168): each action reads the story of the journey the state holds (data.js
   STORIES): the story's chips at Rakesh Traders, the Mango Drink at Lakshmi Agencies, or the slow chips. */
(function () {
  const D = window.SC3_DATA, Store = window.SC3_STORE, M = window.SC3_MONEY; const fmt = M.fmt;
  const CONNECT_EV = { stage: "connect", agent: "Data", icon: "database", at: "Thu 16:30", min: 0, text: "Mapped 8 DMS columns, loaded 312 batches from 4 distributors and back-filled 90 days of sell-through by pincode and by shop into BigQuery.", calls: [["bigquery.load", "312 batches", "ok"], ["sellthrough.backfill", "90 days · by pincode, by shop", "ok"]] };
  let nid = 0; const id = p => p + "-" + Date.now().toString(36) + "-" + (++nid);
  const feed = (s, ev) => { s.feed.push(Object.assign({ id: id("ev") }, ev)); };
  const notify = (s, to, n) => { s.notifications.unshift(Object.assign({ id: id("n"), to, read: false }, n)); };
  const audit = (s, who, what, target, at) => { s.audit.unshift({ id: id("a"), who, what, target, at: at || "now" }); };
  // the story of the journey the state holds, and its timeline's entries by key (a story without one skips it)
  const story = s => D.storyOf(s.scenario || "chips");
  const E = (s, key) => story(s).events.find(e => e.key === key);
  const feedIf = (s, key) => { const ev = E(s, key); if (ev) feed(s, ev); };
  const all = s => s.hero.orders.length >= story(s).kiranas.length;
  const orderedUnits = h => h.orders.reduce((t, o) => t + o.units, 0);
  // the batch in focus moves on; in the Mango Drink's own journey its donation (the same batch) moves with it
  const setPhase = (s, p) => { s.hero.phase = p; if (s.mango && s.mango.id === s.hero.id) s.mango.phase = p; };
  // the scheme is over: closed when its window ended, or filled by every shop that orders in a story whose scheme fills
  const schemeOver = (s, S) => !!s.hero.offer && (s.hero.offer.status === "closed" || (S.fills && all(s)));
  // whether a plan line has run its course (backend-api domain/journey.py line_done): the buyer's truck loaded, the
  // scheme over, the staff sale recorded, the food bank's pickup collected
  function lineDone(s, S, l) {
    const h = s.hero;
    if (l.id === "expiresoon") return h.truck.status === "dispatched";
    if (l.id === "kirana") return schemeOver(s, S) || orderedUnits(h) >= l.units;
    if (l.id === "staff") return !!h.staff && h.staff.status === "recorded";
    if (l.id === "foodbank") return s.mango.id === h.id && (s.mango.donation === "collected" || s.mango.donation === "declined");
    return true;
  }
  // once every line of the plan has run its course, the case is dispatched and the papers follow (steps.py _advance)
  function advance(s) {
    const S = story(s);
    if (["approved", "executing"].includes(s.hero.phase) && S.plan.lines.filter(l => l.units > 0).every(l => lineDone(s, S, l))) setPhase(s, "dispatched");
  }

  // the story's four signatures on the slow chips' certificate (SC-183): the officer's, each witness's and the
  // distributor's strokes as traced from their specimens (data.js STROKES), a minute apart after the cover; a signer
  // with no strokes on file signs typed
  function storySignatures(agency, dist, win) {
    const at = m => { const [h, mm] = win.to.split(":").map(Number), t = h * 60 + mm + m; return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
    const one = (p, m) => { if (!p) return null; const k = p.sign && D.STROKES[p.sign]; return Object.assign({ name: p.name, at: at(m) }, k ? { box: k.box, strokes: k.strokes } : { typed: true }); };
    const w = agency.witnesses || [];
    return { officer: one(agency.officer, 2), w1: one(w[0], 3), w2: one(w[1], 4), handed: one(dist.signatory, 5) };
  }
  // each action mutates a draft of the store; names follow the journey map
  const A = {
    connect: s => { s.setup.confirmed = true; s.setup.mapped = 8; feed(s, CONNECT_EV); audit(s, "priya", "confirmed DMS mapping and guardrails", "Setup", "Thu 16:41"); },
    // Rakesh Traders lets the agent act in his name, inside Munchly's floors; he can pause it at any time
    permit: s => { if (s.setup.permission) return; s.setup.permission = { by: "rakesh", at: "Thu 16:52", paused: false }; feed(s, E(s, "permit")); audit(s, "rakesh", "gave the one-time permission to act in his name", "Rakesh Traders · inside Munchly's floors", "Thu 16:52"); notify(s, "priya", { title: "Rakesh Traders is set up", body: "Rakesh bhai signed in and allowed listings, scheme offers, invoice drafts and dispatch slots in his name, inside your floors.", at: "Thu 16:52", link: "setup" }); },
    pause: (s, on) => { const p = s.setup.permission; if (!p) return; const S = story(s), who = S.dist.short, his = S.pron, he = his === "his" ? "he" : "it"; p.paused = !!on; audit(s, S.accounts.distributor, on ? "paused the agent" : "resumed the agent", `${who} · one-time permission`); notify(s, "priya", on ? { title: `${who} paused the agent`, body: `Nothing more is listed, offered or invoiced in ${his} name until ${he} resumes.`, at: "now", link: "command" } : { title: `${who} resumed the agent`, body: "The agents pick up where they stopped.", at: "now", link: "command" }); },
    join: (s, uid) => { const u = s.users.find(x => x.id === uid); if (!u || u.status !== "invited") return; u.status = "active"; audit(s, uid, "joined Munchly Foods' workspace", u.invitedBy ? "invited by " + u.invitedBy : D.WORKSPACE.domain); },
    detect: s => { setPhase(s, "at-risk"); feed(s, E(s, "watch")); notify(s, "priya", Object.assign({ link: "command" }, story(s).push.detect)); },
    requestPhoto: s => { const S = story(s); s.hero.photo = { status: "requested", at: S.at.ask }; feed(s, E(s, "ask")); notify(s, S.accounts.distributor, Object.assign({ link: "photo", hindi: false }, S.push.verify)); },
    sendPhoto: s => { const S = story(s); s.hero.photo = { status: "reading", at: S.at.photo }; feed(s, E(s, "photo")); audit(s, S.accounts.distributor, "sent the label photo", S.batch.id, S.at.photo); },
    verify: s => { s.hero.photo = { status: "verified", at: story(s).at.read, confidence: 0.97 }; setPhase(s, "verified"); feed(s, E(s, "read")); },
    value: s => { setPhase(s, "valued"); feed(s, E(s, "value")); },
    decide: s => { setPhase(s, "planned"); s.hero.plan = { status: "proposed", at: story(s).at.plan }; feed(s, E(s, "route")); feed(s, E(s, "notify")); notify(s, "priya", Object.assign({ link: "route" }, story(s).push.plan)); },
    approve: (s, by) => {
      const S = story(s); setPhase(s, "approved"); s.hero.plan = { status: "approved", at: S.at.approve, by: by || "priya", device: "phone" }; feed(s, E(s, "approved")); audit(s, by || "priya", "approved the plan", S.batch.id + " · net " + fmt.inr(S.plan.net), S.at.approve); notify(s, S.accounts.distributor, Object.assign({ link: "home" }, S.push.approved));
      // a plan with a staff sale opens it at the distributor's godown on the yes (SC-86); he records what sold, once
      const st = S.plan.lines.find(l => l.id === "staff" && l.units > 0);
      if (st) s.hero.staff = { status: "open", units: st.units, price: st.price, godown: S.dist.godown, at: S.at.approve, sold: null, left: null };
    },
    list: s => { const S = story(s); if (!S.ES) return; setPhase(s, "executing"); s.hero.listing = { id: S.listing.id, status: "live", units: S.ES.units, price: S.ES.price, reserve: M.RULES.negotiation.reservePerUnit, at: S.at.list }; feed(s, E(s, "list")); },
    outreach: s => { const S = story(s); if (s.hero.phase === "approved") setPhase(s, "executing"); s.hero.offer = { status: "sent", at: S.at.offer, closesAt: S.at.closes, shops: S.offered }; feed(s, E(s, "outreach")); notify(s, S.accounts.kirana, Object.assign({ link: "offer" }, S.push.offer)); },
    // a story shop orders its own share; another of the distributor's shops (an invited one, world.js) its cap, while
    // the scheme has room: a full scheme, or one whose window has closed, takes no more orders (SC-130)
    order: (s, kid) => {
      const S = story(s), K = S.kiranas;
      const W = window.SC3_WORLD, w = !K.some(x => x.id === kid) && W && W.KIRANAS.find(x => x.id === kid);
      const k = K.find(x => x.id === kid) || (w ? { id: w.id, units: w.sales14 * M.RULES.shopCapTimes, at: "10:15" } : null) || K[s.hero.orders.length];
      if (!k || s.hero.orders.some(o => o.id === k.id) || (s.hero.offer && s.hero.offer.status === "closed")) return;
      const room = S.KL.units - s.hero.orders.reduce((t, o) => t + o.units, 0);
      if (k.units > room) return;
      if (s.hero.declined) delete s.hero.declined[k.id];
      s.hero.orders.push({ id: k.id, units: k.units, at: k.at }); if (k.id === S.shop) audit(s, S.accounts.kirana, "ordered " + k.units + " packets", S.scheme, k.at); if (all(s)) feed(s, E(s, "orders"));
      advance(s);
    },
    // Not this time (SC-130): a shop declines the open scheme; it stays open for its 48 hours if the shop changes its mind
    decline: (s, kid) => {
      const W = window.SC3_WORLD, w = W && W.KIRANAS.find(x => x.id === kid); if (!w || s.hero.orders.some(o => o.id === kid)) return;
      s.hero.declined = Object.assign({}, s.hero.declined, { [kid]: { at: story(s).at.decline } }); audit(s, w.member, "declined the scheme", story(s).scheme, story(s).at.decline);
    },
    allOrders: s => { story(s).kiranas.forEach(k => A.order(s, k.id)); },
    bid: (s, price) => { const S = story(s); if (!S.ES) return; const p = price || 13; if (s.hero.bids.some(b => b.status === "placed" || b.status === "countered")) return; s.hero.bids.push({ id: "b" + (s.hero.bids.length + 1), price: p, at: S.at.bid, by: S.accounts.buyer, status: "placed" }); s.hero.chat.push(Object.assign({}, S.chat[0], { text: `Can you do ₹${p % 1 ? p.toFixed(2) : p} for all ${S.ES.units}?` })); audit(s, S.accounts.buyer, "bid ₹" + p.toFixed(2), S.listing.id, S.at.bid); },
    counter: s => { const S = story(s); if (!S.ES) return; const b = s.hero.bids[s.hero.bids.length - 1]; if (b) { b.status = "countered"; b.counter = S.counter.price; } s.hero.chat.push(S.chat[1]); feed(s, E(s, "counter")); },
    accept: s => { const S = story(s); if (!S.ES) return; const b = s.hero.bids[s.hero.bids.length - 1]; if (b) b.status = "accepted"; s.hero.chat.push(S.chat[2]); s.hero.award = Object.assign({ at: S.at.award, buyer: S.buyer.name, status: "token paid" }, S.award); s.hero.listing.status = "awarded"; feed(s, E(s, "accepted")); notify(s, "priya", Object.assign({ link: "execution" }, S.push.award)); notify(s, S.accounts.distributor, Object.assign({ link: "orders" }, S.push.won)); },
    // the food bank, booked for the batch the story donates: the Mango Drink beside the chips, or the Mango Drink's own
    donate: s => { const S = story(s), x = S.donation; if (!x) return; const name = x.sku.name.replace(/\s+\d+(\.\d+)?\s?(g|ml|kg|l)$/i, ""); s.mango.donation = "booked"; feed(s, E(s, "donate")); notify(s, S.accounts.foodbank, { title: `Pickup request · ${name}`, body: `${x.units} packs of ${name}, ${x.batch.daysLeft} days left, with the FSSAI checklist. Pickup from ${S.journey.donation.from}?`, at: S.journey.donation.asked, link: "pickups" }); },
    confirmPickup: s => { const S = story(s), x = S.donation, DN = S.journey.donation; if (!x || s.mango.donation !== "booked") return; const name = x.sku.name.replace(/\s+\d+(\.\d+)?\s?(g|ml|kg|l)$/i, ""); s.mango.donation = "confirmed"; audit(s, S.accounts.foodbank, `confirmed the pickup, ${DN.day} ${DN.time}`, `${x.batch.id} · ${x.units} packs`, S.at.confirm); notify(s, "priya", { title: `${x.partner.name} confirmed`, body: `${x.units} packs of ${name}, pickup ${DN.day} ${DN.time} from ${DN.from}. Served at ${DN.spot}.`, at: S.at.confirm, link: "execution" }); },
    // the staff sale, recorded once by the distributor (SC-87): the chips' plan opens none, the Mango Drink's has one at
    // Lakshmi Agencies (SC-133), staged beside the chips or opened by its own journey's approval
    // With it, the consolidated receipt she sent (SC-174): `x` is the count, or { sold, receipt }; in the stub the receipt
    // is the batch's own, its payments as Vision reads them
    recordStaffSale: (s, x) => {
      const S = story(s), st = s.hero.staff, sold = typeof x === "number" ? x : x.sold;
      const receiptOf = r => (r ? Object.assign({ read: true }, r) : null);
      if (st && st.status === "open") {
        Object.assign(st, { status: "recorded", sold, left: st.units - sold, receipt: receiptOf((x && x.receipt) || S.staffReceipt) });
        if (S.key !== "chips") { audit(s, S.accounts.distributor, `recorded the staff sale: ${sold} of ${st.units} packs`, `${S.batch.id} · ${S.dist.godown}`, S.at.staff); feedIf(s, "staff"); advance(s); }
        return;
      }
      if (!S.second) return;
      const line = D.MANGO_PLAN.lines.find(l => l.id === "staff"), m = s.mango;
      if (!line || !m.phase || m.phase === "watching" || (m.staff && m.staff.status === "recorded")) return;
      m.staff = { status: "recorded", units: line.units, sold, left: line.units - sold, receipt: receiptOf((x && x.receipt) || D.STORIES.mango.staffReceipt) };
      audit(s, "lakshmi-owner", `recorded the staff sale: ${sold} of ${line.units} packs`, `${m.id} · ${D.DISTRIBUTORS.lakshmi.godown}`, "Day 1");
    },
    collect: s => { const S = story(s), x = S.donation; if (!x) return; s.mango.donation = "collected"; audit(s, S.accounts.foodbank, `collected ${x.units} packs and issued ${x.receipt.type.toLowerCase()} ${x.receipt.no}`, x.batch.id, S.at.collect); if (s.mango.id === s.hero.id) { feedIf(s, "collect"); advance(s); } },
    // Monday: the buyer's balance lands and his own transporter collects the lot from the godown
    dispatch: s => { const S = story(s); if (!S.ES) return; s.hero.truck = { status: "dispatched", at: S.at.dispatch }; if (s.hero.award) s.hero.award.status = "paid"; setPhase(s, "dispatched"); feed(s, E(s, "dispatch")); audit(s, S.accounts.distributor, `loaded ${S.buyer.name}'s truck`, `${S.listing.id} · ${S.buyer.city}`, S.at.dispatch); },
    settle: s => { const S = story(s); setPhase(s, "settled"); s.hero.docs = S.docs.map(d => ({ id: d.id, status: d.status })); feed(s, E(s, "papers")); notify(s, "priya", Object.assign({ link: "paperwork" }, S.push.papers)); notify(s, S.accounts.distributor, Object.assign({ link: "orders" }, S.push.invoice || S.push.support)); notify(s, S.accounts.distributor, Object.assign({ link: "van" }, S.push.van)); },
    issueInvoice: s => { const S = story(s); if (!S.invoice) return; s.hero.invoiceIssued = true; audit(s, S.accounts.distributor, "issued the invoice from Tally", S.invoice.no + " · " + S.buyer.name, S.at.invoice); },
    review: s => { const S = story(s); s.hero.reviewed = true; audit(s, "priya", "reviewed Munchly's credit note and GST memo", S.batch.id, S.at.review); },
    vanRound: s => { const S = story(s); s.hero.van = { status: "done", done: S.kiranas.length }; feed(s, E(s, "van")); audit(s, S.accounts.distributor, `ran the ${S.journey.van.day} round: ${S.kiranas.length} drops`, `${S.dist.city} cluster`, S.at.van); },
    report: s => {
      const S = story(s);
      setPhase(s, "cleared"); s.hero.posted = true; feed(s, E(s, "ledger"));
      // packs destroyed at his godown (SC-139): the push says how many, and that the credit note is issued
      const d = s.hero.destruction, x = s.hero.expiry;
      notify(s, "priya", Object.assign({ link: "command" }, S.push.closed, d ? { title: `Batch closed · ${d.units} packs destroyed at the godown`, body: `On your yes: ${S.dist.short} credited ${M.fmt.inr2(x ? x.amount : 0)} against ${d.agency ? d.agency.name : "the agency"}'s certificate ${d.certificate}. Your input GST is kept.` } : null));
      audit(s, "priya", "signed off the BRSR row", S.batch.id, S.at.report);
    },
    // packs left at his godown on expiry day, destroyed there (SC-139): the story clears every pack, so these act only on
    // a destruction put in the store or the slow chips' expiry day (the live workspace has its own). Vision's checks land
    // with the evidence; each photo keeps its file
    sendDestruction: (s, x) => {
      const S = story(s), h = s.hero, d = h.destruction; if (!d || (d.status !== "requested" && d.status !== "asked")) return;
      const agency = (x && x.agency) || D.SETUP.destruction.agencies[0];
      Object.assign(d, { status: "checked", agency: { id: agency.id, name: agency.name, auth: agency.auth, site: agency.site }, certificate: (x && x.certificate) || agency.series.prefix + String(agency.series.next).padStart(agency.series.width, "0"), reason: null,
        photos: { before: { name: S.evidence.before, at: "11:40" }, after: { name: S.evidence.after, at: "13:20" } }, sentAt: "14:00",
        // the window the agency destroyed them in and its two independent witnesses, as he gave them (SC-174)
        window: (x && x.window) || { from: "12:55", to: "13:20" }, witnesses: ((x && x.witnesses) || agency.witnesses || []).map(w => ({ name: w.name, address: w.address })),
        // the four signatures as drawn on the certificate at the facility (SC-183): his, or the story's own when nobody
        // plays him (each signer's strokes, a minute apart after the cover)
        signatures: (x && x.signatures) || storySignatures(agency, S.dist, (x && x.window) || { from: "12:55", to: "13:20" }),
        checks: [["batch", `Batch ${h.id} read on the carton label`], ["count", `About ${Math.round(d.units / 10) * 10} packs in view (${d.units} left)`], ["slate", `The slate reads ${h.id} · ${d.units} packets${S.evidence.slate ? " · " + S.evidence.slate : ""}`], ["when", S.evidence.when]].map(([id, label]) => ({ id, label, ok: true })) });
      audit(s, S.accounts.distributor, `sent the destruction's evidence: ${d.units} packs, ${d.agency.name}`, `${h.id} · ${d.certificate}`, S.at.expiry);
      feedIf(s, "destroySent"); feedIf(s, "destroyChecked"); if (S.push.evidence) notify(s, "priya", Object.assign({ link: "command" }, S.push.evidence));
    },
    approveDestruction: s => { const S = story(s), d = s.hero.destruction; if (!d || d.status !== "checked") return; Object.assign(d, { status: "approved", approvedBy: "priya", approvedAt: "11:00" }); audit(s, "priya", `approved the destruction of ${d.units} packs at ${S.dist.godown}`, `${s.hero.id} · ${d.certificate}`, S.at.approved || S.at.expiry); feedIf(s, "destroyApproved"); },
    askDestructionAgain: (s, reason) => { const S = story(s), d = s.hero.destruction; if (!d || d.status !== "checked") return; Object.assign(d, { status: "asked", reason: reason || "the photos do not show the batch clearly" }); audit(s, "priya", `asked again for the destruction's evidence: ${d.reason}`, s.hero.id, S.at.expiry); },
    // the scheme's 48-hour window closes on what the shops ordered (SC-168, the slow chips): what no shop took stays at
    // the godown, and the line has run its course
    closeOffer: s => { const S = story(s), h = s.hero; if (!h.offer || h.offer.status === "closed") return; h.offer.status = "closed"; h.offer.closedAt = S.at.closed || S.at.closes; if (S.godownLeft) h.realised = { lines: S.godownLeft.lines.map(l => Object.assign({}, l)), godown: S.godownLeft.godown }; feedIf(s, "closeOffer"); advance(s); },
    // expiry day, at best-before (SC-94, SC-139): the packs left at the godown expire, and by Munchly's policy he is asked
    // to destroy them there against evidence; Impact waits for the operator's yes on it
    expire: s => { const S = story(s), h = s.hero; if (!S.expiry || h.expiry) return; h.expiry = Object.assign({}, S.expiry); h.destruction = { status: "requested", units: S.expiry.units }; feedIf(s, "expire"); feedIf(s, "destroyAsk"); if (S.push.destroy) notify(s, S.accounts.distributor, Object.assign({ link: "destroy" }, S.push.destroy)); },
  };

  // the order in which each journey happens, grouped by the stage each step belongs to; a step a person takes names who
  const SCRIPTS = {
    chips: [
      ["connect", "connect"], ["connect", "permit", { human: "rakesh" }],
      ["detect", "detect"],
      ["verify", "requestPhoto"], ["verify", "sendPhoto", { human: "rakesh" }], ["verify", "verify"],
      ["value", "value"], ["decide", "decide"], ["approve", "approve", { human: "priya" }],
      ["execute", "list"], ["execute", "outreach"], ["execute", "donate"], ["execute", "order", { arg: "k0", human: "ganesh" }], ["execute", "allOrders"], ["execute", "bid", { arg: 13, human: "agrawal" }], ["execute", "counter"], ["execute", "accept", { human: "agrawal" }], ["execute", "confirmPickup", { human: "meera" }],
      ["settle", "dispatch", { human: "rakesh" }], ["settle", "settle"], ["settle", "review", { human: "priya" }], ["settle", "vanRound", { human: "rakesh" }],
      ["report", "report"],
    ],
    // the Mango Drink's own: Setup and Lakshmi Agencies' permission come with it, so it starts at the Watcher's run
    mango: (S => [
      ["detect", "detect"],
      ["verify", "requestPhoto"], ["verify", "sendPhoto", { human: S.accounts.distributor }], ["verify", "verify"],
      ["value", "value"], ["decide", "decide"], ["approve", "approve", { human: "priya" }],
      ["execute", "outreach"], ["execute", "donate"], ["execute", "order", { arg: S.shop, human: S.accounts.kirana }], ["execute", "allOrders"],
      ["execute", "recordStaffSale", { arg: S.plan.lines.find(l => l.id === "staff").units, human: S.accounts.distributor }], ["execute", "confirmPickup", { human: "meera" }], ["execute", "collect", { human: "meera" }],
      ["settle", "settle"], ["settle", "review", { human: "priya" }], ["settle", "vanRound", { human: S.accounts.distributor }],
      ["report", "report"],
    ])(D.storyOf("mango")),
    // the slow chips: 23 shops order, one says Not this time and the window closes on the rest; the lot still sells; on
    // expiry day the packs left are destroyed at the godown, on Priya's second yes, before Impact reports
    slow: (S => [
      ["connect", "connect"], ["connect", "permit", { human: "rakesh" }],
      ["detect", "detect"],
      ["verify", "requestPhoto"], ["verify", "sendPhoto", { human: "rakesh" }], ["verify", "verify"],
      ["value", "value"], ["decide", "decide"], ["approve", "approve", { human: "priya" }],
      ["execute", "list"], ["execute", "outreach"], ["execute", "order", { arg: "k0", human: "ganesh" }], ["execute", "allOrders"], ["execute", "decline", { arg: S.decliner, human: S.accounts.decliner }], ["execute", "bid", { arg: 13, human: "agrawal" }], ["execute", "counter"], ["execute", "accept", { human: "agrawal" }], ["execute", "closeOffer"],
      ["settle", "dispatch", { human: "rakesh" }], ["settle", "settle"], ["settle", "review", { human: "priya" }], ["settle", "vanRound", { human: "rakesh" }],
      ["report", "expire"], ["report", "sendDestruction", { human: "rakesh" }], ["report", "approveDestruction", { human: "priya" }], ["report", "report"],
    ])(D.storyOf("slow")),
  };
  const SCRIPT = SCRIPTS.chips;
  const STAGE_IDS = D.STAGES.map(s => s.id);
  const scenarioOf = s => (s && s.scenario) || "chips";
  const scriptOf = s => SCRIPTS[scenarioOf(s)] || SCRIPT;
  const run = (name, arg) => Store.update(s => A[name](s, arg));
  // put the store in the state it has when stage n begins (all earlier stages complete), in the journey it holds
  function fastForward(n) { Store.reset(); Store.update(s => { scriptOf(s).filter(([st]) => STAGE_IDS.indexOf(st) < n).forEach(([, name, o]) => A[name](s, o && o.arg)); s.notifications.forEach(x => (x.read = true)); }); }
  // which stage is active (0-8), or 9 when the batch is cleared
  function stageOf(state) {
    const h = state.hero, S = story(state);
    if (!state.setup.confirmed || !state.setup.permission) return 0;
    if (h.phase === "watching") return 1;
    if (h.photo.status !== "verified") return 2;
    if (h.phase === "verified") return 3;
    if (h.phase === "valued") return 4;
    if (h.phase === "planned") return 5;
    if (h.phase === "approved") return 6;
    if (h.phase === "executing") return h.award && schemeOver(state, S) ? 7 : 6;
    if (h.phase === "dispatched") return 7;
    if (h.phase === "settled") return h.van.status === "done" ? 8 : 7;
    return 9;
  }

  // the agents, as a reconciler: after every change it works out the next thing an agent would do
  // (and, in the app, what a partner the user is not playing would do) and schedules it once.
  // The demo caps it at the stage on screen; the app lets it run.
  const stagesOf = script => { const out = {}; script.forEach(([st, name]) => { if (!(name in out)) out[name] = STAGE_IDS.indexOf(st); }); return out; };
  const ACTION_STAGES = Object.fromEntries(Object.entries(SCRIPTS).map(([k, sc]) => [k, stagesOf(sc)]));
  const ACTION_STAGE = ACTION_STAGES.chips;
  const Agents = { live: false, auto: false, maxStage: Infinity, pending: null, plays: () => false };
  const allowed = name => { const at = ACTION_STAGES[scenarioOf(Store.get())] || ACTION_STAGE; return !(name in at) || at[name] <= Agents.maxStage; };
  const ordered = (h, id) => h.orders.some(o => o.id === id);
  // the shop's account, if it has one: in the app a shop the user is playing orders by hand
  const shopUser = (s, k) => (s.users.find(u => u.role === "retailer" && u.org === k.name) || {}).id;
  function nextKirana(s, auto) {
    const h = s.hero, S = story(s), first = S.shop; const left = S.kiranas.filter(k => !ordered(h, k.id)); if (!left.length) return null;
    if (!auto) return ordered(h, first) ? left.filter(k => k.id !== first)[0] || null : null; // in the demo the cluster follows the shop a person plays
    const free = left.filter(k => k.id !== first && !Agents.plays(shopUser(s, k)));
    return free[0] || left[0];
  }
  function nextStep(s) {
    const h = s.hero, auto = Agents.auto, perm = s.setup.permission, S = story(s), who = S.accounts;
    if (!s.setup.confirmed) return null;
    if (perm && perm.paused) return null; // the distributor paused the agent: nothing more happens in his name
    switch (h.phase) {
      case "watching": return !perm ? (auto ? { name: "permit", delay: 6000, partner: "rakesh" } : null) : { name: "detect", delay: 2400 };
      case "at-risk": return h.photo.status === "none" ? { name: "requestPhoto", delay: 1800 } : h.photo.status === "requested" ? (auto ? { name: "sendPhoto", delay: 20000, partner: who.distributor } : null) : h.photo.status === "reading" ? { name: "verify", delay: 1900 } : null;
      case "verified": return { name: "value", delay: 1500 };
      case "valued": return { name: "decide", delay: 1600 };
      case "approved": return S.ES ? { name: "list", delay: 1000 } : { name: "outreach", delay: 1000 };
      case "executing": {
        if (!h.offer) return { name: "outreach", delay: 800 };
        if (S.donation && !s.mango.donation) return { name: "donate", delay: 2400 };
        const last = h.bids[h.bids.length - 1];
        if (last && last.status === "placed") return { name: "counter", delay: 1900 };
        const closed = h.offer.status === "closed";
        const k = !closed && nextKirana(s, auto);
        if (k) return { name: "order", arg: k.id, delay: !h.orders.length ? 6000 : k.id === S.shop ? 12000 : 260 + Math.random() * 260, partner: shopUser(s, k) };
        // the shop that says Not this time (the slow chips), in the app when nobody plays it
        if (auto && S.decliner && !closed && !(h.declined || {})[S.decliner] && !ordered(h, S.decliner)) return { name: "decline", arg: S.decliner, delay: 4000, partner: who.decliner };
        if (S.ES && auto && !h.bids.length) return { name: "bid", arg: 13, delay: 10000, partner: who.buyer };
        if (S.ES && auto && last && last.status === "countered") return { name: "accept", delay: 8000, partner: who.buyer };
        // the window closes on a scheme that does not fill, once the lot has its buyer and the shop has said no
        if (!S.fills && !closed && all(s) && (!S.ES || h.award) && (!S.decliner || (h.declined || {})[S.decliner])) return { name: "closeOffer", delay: 3000 };
        // the staff sale, recorded by the distributor (the Mango Drink's own journey)
        if (auto && h.staff && h.staff.status === "open") return { name: "recordStaffSale", arg: h.staff.units, delay: 9000, partner: who.distributor };
        if (auto && S.donation && s.mango.donation === "booked") return { name: "confirmPickup", delay: 10000, partner: who.foodbank };
        if (auto && S.donation && s.mango.id === h.id && s.mango.donation === "confirmed") return { name: "collect", delay: 10000, partner: who.foodbank };
        if (S.ES && auto && h.award && schemeOver(s, S) && h.truck.status !== "dispatched") return { name: "dispatch", delay: 10000, partner: who.distributor };
        return null;
      }
      case "dispatched": return { name: "settle", delay: 1800 };
      case "settled": {
        if (h.van.status !== "done") return auto ? { name: "vanRound", delay: 9000, partner: who.distributor } : null;
        // expiry day for packs left at the godown (the slow chips), then the evidence and the operator's yes
        if (S.expiry && !h.expiry) return { name: "expire", delay: 3000 };
        if (h.destruction && (h.destruction.status === "requested" || h.destruction.status === "asked")) return auto ? { name: "sendDestruction", delay: 12000, partner: who.distributor } : null;
        // packs destroyed at his godown (SC-139): Impact reports only once the operator has approved the evidence
        if (h.destruction && h.destruction.status !== "approved") return null;
        return { name: "report", delay: 3500 };
      }
      default: return null;
    }
  }
  const keyOf = st => st ? st.name + ":" + (st.arg || "") : "";
  function reconcile() {
    if (!Agents.live) return;
    const st = nextStep(Store.get()); const key = keyOf(st);
    if (Agents.pending && Agents.pending.key === key) return;
    if (Agents.pending) { clearTimeout(Agents.pending.t); Agents.pending = null; }
    if (!st || !allowed(st.name) || (st.partner && Agents.plays(st.partner))) return;
    Agents.pending = { key, step: st, due: Date.now() + st.delay, t: setTimeout(() => {
      Agents.pending = null; if (!Agents.live) return;
      const again = nextStep(Store.get());
      if (keyOf(again) === key && allowed(st.name)) run(st.name, st.arg); else reconcile();
    }, st.delay) };
  }
  Store.subscribe(reconcile);
  Object.assign(Agents, {
    setLive(v) { Agents.live = v; if (!v && Agents.pending) { clearTimeout(Agents.pending.t); Agents.pending = null; } reconcile(); },
    cancel() { if (Agents.pending) { clearTimeout(Agents.pending.t); Agents.pending = null; } },
    reconcile, nextStep, allowed,
  });
  const act = (name, arg) => run(name, arg);
  // the journey the store holds, and another from its start (the guided demo's three journeys): the agents wait for the
  // new state, then pick it up
  const scenario = () => scenarioOf(Store.get());
  function useScenario(key) { Agents.cancel(); Store.reset(D.STORIES[key] ? key : "chips"); }
  window.SC3_FLOW = { A, SCRIPT, SCRIPTS, STAGE_IDS, ACTION_STAGE, ACTION_STAGES, run, act, fastForward, stageOf, Agents, CONNECT_EV, scenario, useScenario, scriptOf, story, SCENARIOS: D.SCENARIOS };
})();

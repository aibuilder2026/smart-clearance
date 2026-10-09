/* Smart-Clearance v3 · the journey as deterministic actions, and the agents that chain them.
   The demo steps through stages (and can fast-forward to any stage); the app lets the agents run live. */
(function () {
  const D = window.SC3_DATA, Store = window.SC3_STORE, M = window.SC3_MONEY; const fmt = M.fmt;
  const E = D.EV; const PLAN = D.PLAN;
  const CONNECT_EV = { stage: "connect", agent: "Data", icon: "database", at: "Thu 16:30", min: 0, text: "Mapped 8 DMS columns, loaded 312 batches from 4 distributors and back-filled 90 days of sell-through by pincode and by shop into BigQuery.", calls: [["bigquery.load", "312 batches", "ok"], ["sellthrough.backfill", "90 days · by pincode, by shop", "ok"]] };
  let nid = 0; const id = p => p + "-" + Date.now().toString(36) + "-" + (++nid);
  const feed = (s, ev) => { s.feed.push(Object.assign({ id: id("ev") }, ev)); };
  const notify = (s, to, n) => { s.notifications.unshift(Object.assign({ id: id("n"), to, read: false }, n)); };
  const audit = (s, who, what, target, at) => { s.audit.unshift({ id: id("a"), who, what, target, at: at || "now" }); };
  const all = s => s.hero.orders.length >= D.KIRANAS.length;

  // each action mutates a draft of the store; names follow the journey map
  const A = {
    connect: s => { s.setup.confirmed = true; s.setup.mapped = 8; feed(s, CONNECT_EV); audit(s, "priya", "confirmed DMS mapping and guardrails", "Setup", "Thu 16:41"); },
    // Rakesh Traders lets the agent act in his name, inside Munchly's floors; he can pause it at any time
    permit: s => { if (s.setup.permission) return; s.setup.permission = { by: "rakesh", at: "Thu 16:52", paused: false }; feed(s, E("permit")); audit(s, "rakesh", "gave the one-time permission to act in his name", "Rakesh Traders · inside Munchly's floors", "Thu 16:52"); notify(s, "priya", { title: "Rakesh Traders is set up", body: "Rakesh bhai signed in and allowed listings, scheme offers, invoice drafts and dispatch slots in his name, inside your floors.", at: "Thu 16:52", link: "setup" }); },
    pause: (s, on) => { const p = s.setup.permission; if (!p) return; p.paused = !!on; audit(s, "rakesh", on ? "paused the agent" : "resumed the agent", "Rakesh Traders · one-time permission"); notify(s, "priya", on ? { title: "Rakesh Traders paused the agent", body: "Nothing more is listed, offered or invoiced in his name until he resumes.", at: "now", link: "command" } : { title: "Rakesh Traders resumed the agent", body: "The agents pick up where they stopped.", at: "now", link: "command" }); },
    join: (s, uid) => { const u = s.users.find(x => x.id === uid); if (!u || u.status !== "invited") return; u.status = "active"; audit(s, uid, "joined Munchly Foods' workspace", u.invitedBy ? "invited by " + u.invitedBy : D.WORKSPACE.domain); },
    detect: s => { s.hero.phase = "at-risk"; feed(s, E("watch")); notify(s, "priya", Object.assign({ link: "command" }, D.PUSH.detect)); },
    requestPhoto: s => { s.hero.photo = { status: "requested", at: "09:05" }; feed(s, E("ask")); notify(s, "rakesh", Object.assign({ link: "photo", hindi: false }, D.PUSH.verify)); },
    sendPhoto: s => { s.hero.photo = { status: "reading", at: "09:19" }; feed(s, E("photo")); audit(s, "rakesh", "sent the label photo", "MF-2409-117", "09:19"); },
    verify: s => { s.hero.photo = { status: "verified", at: "09:20", confidence: 0.97 }; s.hero.phase = "verified"; feed(s, E("read")); },
    value: s => { s.hero.phase = "valued"; feed(s, E("value")); },
    decide: s => { s.hero.phase = "planned"; s.hero.plan = { status: "proposed", at: "09:22" }; feed(s, E("route")); feed(s, E("notify")); notify(s, "priya", Object.assign({ link: "route" }, D.PUSH.plan)); },
    approve: (s, by) => { s.hero.phase = "approved"; s.hero.plan = { status: "approved", at: "09:40", by: by || "priya", device: "phone" }; feed(s, E("approved")); audit(s, by || "priya", "approved the plan", "MF-2409-117 · net " + fmt.inr(PLAN.net), "09:40"); notify(s, "rakesh", Object.assign({ link: "home" }, D.PUSH.approved)); },
    list: s => { s.hero.phase = "executing"; s.hero.listing = { id: "ES-24117", status: "live", units: 772, price: 15, reserve: 13.5, at: "09:41" }; feed(s, E("list")); },
    outreach: s => { s.hero.offer = { status: "sent", at: "09:41", shops: D.OFFERED }; feed(s, E("outreach")); notify(s, "ganesh", Object.assign({ link: "offer" }, D.PUSH.offer)); },
    // a story shop orders its own share; another of Rakesh's shops (an invited one, world.js) its cap, while the scheme
    // has room: a full scheme takes no more orders (SC-130)
    order: (s, kid) => {
      const W = window.SC3_WORLD, w = !D.KIRANAS.some(x => x.id === kid) && W && W.KIRANAS.find(x => x.id === kid);
      const k = D.KIRANAS.find(x => x.id === kid) || (w ? { id: w.id, units: w.sales14 * M.RULES.shopCapTimes, at: "10:15" } : null) || D.KIRANAS[s.hero.orders.length];
      if (!k || s.hero.orders.some(o => o.id === k.id)) return;
      const room = PLAN.lines.find(l => l.id === "kirana").units - s.hero.orders.reduce((t, o) => t + o.units, 0);
      if (k.units > room) return;
      if (s.hero.declined) delete s.hero.declined[k.id];
      s.hero.orders.push({ id: k.id, units: k.units, at: k.at }); if (k.id === "k0") audit(s, "ganesh", "ordered " + k.units + " packets", "Masala Chips scheme", k.at); if (all(s)) feed(s, E("orders"));
    },
    // Not this time (SC-130): a shop declines the open scheme; it stays open for its 48 hours if the shop changes its mind
    decline: (s, kid) => {
      const W = window.SC3_WORLD, w = W && W.KIRANAS.find(x => x.id === kid); if (!w || s.hero.orders.some(o => o.id === kid)) return;
      s.hero.declined = Object.assign({}, s.hero.declined, { [kid]: { at: "10:12" } }); audit(s, w.member, "declined the scheme", "Masala Chips scheme", "10:12");
    },
    allOrders: s => { D.KIRANAS.forEach(k => A.order(s, k.id)); },
    bid: (s, price) => { const p = price || 13; if (s.hero.bids.some(b => b.status === "placed" || b.status === "countered")) return; s.hero.bids.push({ id: "b" + (s.hero.bids.length + 1), price: p, at: "11:02", by: "agrawal", status: "placed" }); s.hero.chat.push(Object.assign({}, D.CHAT[0], { text: `Can you do ₹${p % 1 ? p.toFixed(2) : p} for all 772?` })); audit(s, "agrawal", "bid ₹" + p.toFixed(2), "ES-24117", "11:02"); },
    counter: s => { const b = s.hero.bids[s.hero.bids.length - 1]; if (b) { b.status = "countered"; b.counter = D.COUNTER.price; } s.hero.chat.push(D.CHAT[1]); feed(s, E("counter")); },
    accept: s => { const b = s.hero.bids[s.hero.bids.length - 1]; if (b) b.status = "accepted"; s.hero.chat.push(D.CHAT[2]); s.hero.award = Object.assign({ at: "11:09", buyer: D.BUYER.name, status: "token paid" }, D.AWARD); s.hero.listing.status = "awarded"; feed(s, E("accepted")); notify(s, "priya", Object.assign({ link: "execution" }, D.PUSH.award)); notify(s, "rakesh", Object.assign({ link: "orders" }, D.PUSH.won)); },
    donate: s => { s.mango.donation = "booked"; feed(s, E("donate")); notify(s, "meera", { title: "Pickup request · Mango Drink", body: `${D.MANGO_FB} packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup from Begum Bazaar?`, at: "Day 0", link: "pickups" }); },
    confirmPickup: s => { if (s.mango.donation !== "booked") return; s.mango.donation = "confirmed"; audit(s, "meera", "confirmed the pickup, Tuesday 10:00", `MF-2410-118 · ${D.MANGO_FB} packs`, "Day 1"); notify(s, "priya", { title: "Feeding India confirmed", body: `${D.MANGO_FB} packs of Mango Drink, pickup Tuesday 10:00 from Begum Bazaar. Served at the Charminar hunger spot.`, at: "Day 1", link: "execution" }); },
    // the staff sale, recorded once by the distributor (SC-87); the story's stub opens none
    recordStaffSale: (s, sold) => { const st = s.hero.staff; if (!st || st.status !== "open") return; Object.assign(st, { status: "recorded", sold, left: st.units - sold }); },
    collect: s => { s.mango.donation = "collected"; audit(s, "meera", `collected ${D.MANGO_FB} packs and issued ${D.MANGO_RECEIPT.type.toLowerCase()} ${D.MANGO_RECEIPT.no}`, "MF-2410-118", "Day 4"); },
    // Monday: the buyer's balance lands and his own transporter collects the lot from the godown
    dispatch: s => { s.hero.truck = { status: "dispatched", at: "Mon 5 Oct" }; if (s.hero.award) s.hero.award.status = "paid"; s.hero.phase = "dispatched"; feed(s, E("dispatch")); audit(s, "rakesh", `loaded ${D.BUYER.name}'s truck`, `ES-24117 · ${D.BUYER.city}`, "Mon 5 Oct"); },
    settle: s => { s.hero.phase = "settled"; s.hero.docs = D.DOCS.map(d => ({ id: d.id, status: d.status })); feed(s, E("papers")); notify(s, "priya", Object.assign({ link: "paperwork" }, D.PUSH.papers)); notify(s, "rakesh", Object.assign({ link: "orders" }, D.PUSH.invoice)); notify(s, "rakesh", Object.assign({ link: "van" }, D.PUSH.van)); },
    issueInvoice: s => { s.hero.invoiceIssued = true; audit(s, "rakesh", "issued the invoice from Tally", D.INVOICE.no + " · " + D.BUYER.name, "Mon 5 Oct"); },
    review: s => { s.hero.reviewed = true; audit(s, "priya", "reviewed Munchly's credit note and GST memo", "MF-2409-117", "Mon 5 Oct"); },
    vanRound: s => { s.hero.van = { status: "done", done: D.KIRANAS.length }; feed(s, E("van")); audit(s, "rakesh", `ran the Tuesday round: ${D.KIRANAS.length} drops`, "Nagpur cluster", "Tue 6 Oct"); },
    report: s => { s.hero.phase = "cleared"; s.hero.posted = true; feed(s, E("ledger")); notify(s, "priya", Object.assign({ link: "command" }, D.PUSH.closed)); audit(s, "priya", "signed off the BRSR row", "MF-2409-117", "30 Oct"); },
  };

  // the order in which the journey happens, grouped by the stage each step belongs to
  const SCRIPT = [
    ["connect", "connect"], ["connect", "permit", { human: "rakesh" }],
    ["detect", "detect"],
    ["verify", "requestPhoto"], ["verify", "sendPhoto", { human: "rakesh" }], ["verify", "verify"],
    ["value", "value"], ["decide", "decide"], ["approve", "approve", { human: "priya" }],
    ["execute", "list"], ["execute", "outreach"], ["execute", "donate"], ["execute", "order", { arg: "k0", human: "ganesh" }], ["execute", "allOrders"], ["execute", "bid", { arg: 13, human: "agrawal" }], ["execute", "counter"], ["execute", "accept", { human: "agrawal" }], ["execute", "confirmPickup", { human: "meera" }],
    ["settle", "dispatch", { human: "rakesh" }], ["settle", "settle"], ["settle", "review", { human: "priya" }], ["settle", "vanRound", { human: "rakesh" }],
    ["report", "report"],
  ];
  const STAGE_IDS = D.STAGES.map(s => s.id);
  const run = (name, arg) => Store.update(s => A[name](s, arg));
  // put the store in the state it has when stage n begins (all earlier stages complete)
  function fastForward(n) { Store.reset(); Store.update(s => { SCRIPT.filter(([st]) => STAGE_IDS.indexOf(st) < n).forEach(([, name, o]) => A[name](s, o && o.arg)); s.notifications.forEach(x => (x.read = true)); }); }
  // which stage is active (0-8), or 9 when the batch is cleared
  function stageOf(state) {
    const h = state.hero;
    if (!state.setup.confirmed || !state.setup.permission) return 0;
    if (h.phase === "watching") return 1;
    if (h.photo.status !== "verified") return 2;
    if (h.phase === "verified") return 3;
    if (h.phase === "valued") return 4;
    if (h.phase === "planned") return 5;
    if (h.phase === "approved") return 6;
    if (h.phase === "executing") return h.award && all(state) ? 7 : 6;
    if (h.phase === "dispatched") return 7;
    if (h.phase === "settled") return h.van.status === "done" ? 8 : 7;
    return 9;
  }

  // the agents, as a reconciler: after every change it works out the next thing an agent would do
  // (and, in the app, what a partner the user is not playing would do) and schedules it once.
  // The demo caps it at the stage on screen; the app lets it run.
  const ACTION_STAGE = {}; SCRIPT.forEach(([st, name]) => { if (!(name in ACTION_STAGE)) ACTION_STAGE[name] = STAGE_IDS.indexOf(st); });
  const Agents = { live: false, auto: false, maxStage: Infinity, pending: null, plays: () => false };
  const allowed = name => !(name in ACTION_STAGE) || ACTION_STAGE[name] <= Agents.maxStage;
  const ordered = (h, id) => h.orders.some(o => o.id === id);
  // the shop's account, if it has one: in the app a shop the user is playing orders by hand
  const shopUser = (s, k) => (s.users.find(u => u.role === "retailer" && u.org === k.name) || {}).id;
  function nextKirana(s, auto) {
    const h = s.hero; const left = D.KIRANAS.filter(k => !ordered(h, k.id)); if (!left.length) return null;
    if (!auto) return ordered(h, "k0") ? left.filter(k => k.id !== "k0")[0] || null : null; // in the demo the cluster follows Ganesh ji
    const free = left.filter(k => k.id !== "k0" && !Agents.plays(shopUser(s, k)));
    return free[0] || left[0];
  }
  function nextStep(s) {
    const h = s.hero, auto = Agents.auto, perm = s.setup.permission;
    if (!s.setup.confirmed) return null;
    if (perm && perm.paused) return null; // Rakesh bhai paused the agent: nothing more happens in his name
    switch (h.phase) {
      case "watching": return !perm ? (auto ? { name: "permit", delay: 6000, partner: "rakesh" } : null) : { name: "detect", delay: 2400 };
      case "at-risk": return h.photo.status === "none" ? { name: "requestPhoto", delay: 1800 } : h.photo.status === "requested" ? (auto ? { name: "sendPhoto", delay: 20000, partner: "rakesh" } : null) : h.photo.status === "reading" ? { name: "verify", delay: 1900 } : null;
      case "verified": return { name: "value", delay: 1500 };
      case "valued": return { name: "decide", delay: 1600 };
      case "approved": return { name: "list", delay: 1000 };
      case "executing": {
        if (!h.offer) return { name: "outreach", delay: 800 };
        if (!s.mango.donation) return { name: "donate", delay: 2400 };
        const last = h.bids[h.bids.length - 1];
        if (last && last.status === "placed") return { name: "counter", delay: 1900 };
        const k = nextKirana(s, auto);
        if (k) return { name: "order", arg: k.id, delay: !h.orders.length ? 6000 : k.id === "k0" ? 12000 : 260 + Math.random() * 260, partner: shopUser(s, k) };
        if (auto && !h.bids.length) return { name: "bid", arg: 13, delay: 10000, partner: "agrawal" };
        if (auto && last && last.status === "countered") return { name: "accept", delay: 8000, partner: "agrawal" };
        if (auto && s.mango.donation === "booked") return { name: "confirmPickup", delay: 10000, partner: "meera" };
        if (auto && h.award && all(s) && h.truck.status !== "dispatched") return { name: "dispatch", delay: 10000, partner: "rakesh" };
        return null;
      }
      case "dispatched": return { name: "settle", delay: 1800 };
      case "settled": {
        if (h.van.status !== "done") return auto ? { name: "vanRound", delay: 9000, partner: "rakesh" } : null;
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
  window.SC3_FLOW = { A, SCRIPT, STAGE_IDS, ACTION_STAGE, run, act, fastForward, stageOf, Agents, CONNECT_EV };
})();

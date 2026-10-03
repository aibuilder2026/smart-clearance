/* Smart-Clearance v3 · the journey as deterministic actions, and the agents that chain them.
   The demo steps through stages (and can fast-forward to any stage); the app lets the agents run live. */
(function () {
  const D = window.SC3_DATA, Store = window.SC3_STORE, M = window.SC3_MONEY; const fmt = M.fmt;
  const E = D.EVENTS; const PLAN = D.PLAN;
  const CONNECT_EV = { stage: "connect", agent: "Data", icon: "database", at: "Setup", min: 0, text: "Mapped 8 DMS columns, loaded 312 batches from 4 distributors and back-filled 90 days of sell-through by pincode into BigQuery.", calls: [["bigquery.load", "312 batches", "ok"], ["sellthrough.backfill", "90 days · by pincode", "ok"]] };
  let nid = 0; const id = p => p + "-" + Date.now().toString(36) + "-" + (++nid);
  const feed = (s, ev) => { s.feed.push(Object.assign({ id: id("ev") }, ev)); };
  const notify = (s, to, n) => { s.notifications.unshift(Object.assign({ id: id("n"), to, read: false }, n)); };
  const audit = (s, who, what, target, at) => { s.audit.unshift({ id: id("a"), who, what, target, at: at || "now" }); };

  // each action mutates a draft of the store; names follow the journey map
  const A = {
    connect: s => { s.setup.confirmed = true; s.setup.mapped = 8; feed(s, CONNECT_EV); audit(s, "priya", "confirmed DMS mapping and guardrails", "Setup", "Setup"); },
    detect: s => { s.hero.phase = "at-risk"; feed(s, E[0]); notify(s, "priya", Object.assign({ link: "command" }, D.PUSH.detect)); },
    requestPhoto: s => { s.hero.photo = { status: "requested", at: "09:05" }; feed(s, E[1]); notify(s, "rakesh", Object.assign({ link: "photo", hindi: false }, D.PUSH.verify)); },
    sendPhoto: s => { s.hero.photo = { status: "reading", at: "09:19" }; feed(s, E[2]); audit(s, "rakesh", "sent the label photo", "MF-2409-117", "09:19"); },
    verify: s => { s.hero.photo = { status: "verified", at: "09:20", confidence: 0.97 }; s.hero.phase = "verified"; feed(s, E[3]); },
    value: s => { s.hero.phase = "valued"; feed(s, E[4]); },
    decide: s => { s.hero.phase = "planned"; s.hero.plan = { status: "proposed", at: "09:22" }; feed(s, E[5]); feed(s, E[6]); notify(s, "priya", Object.assign({ link: "route" }, D.PUSH.plan)); },
    approve: (s, by) => { s.hero.phase = "approved"; s.hero.plan = { status: "approved", at: "09:40", by: by || "priya", device: "phone" }; feed(s, E[7]); audit(s, by || "priya", "approved the plan", "MF-2409-117 · net " + fmt.inr(PLAN.net), "09:40"); },
    list: s => { s.hero.phase = "executing"; s.hero.listing = { id: "ES-24117", status: "live", units: 772, price: 15, reserve: 13.5, at: "09:41" }; feed(s, E[8]); },
    outreach: s => { s.hero.offer = { status: "sent", at: "09:41", shops: 38 }; feed(s, E[9]); notify(s, "ganesh", Object.assign({ link: "offer" }, D.PUSH.offer)); notify(s, "rakesh", { title: "Van route updated", body: "Orders from the Masala Chips scheme will join your next round. The ExpireSoon lot ships to Hyderabad once the balance lands.", at: "09:41", link: "route" }); },
    order: (s, kid) => { const k = D.KIRANAS.find(x => x.id === kid) || D.KIRANAS[s.hero.orders.length]; if (!k || s.hero.orders.some(o => o.id === k.id)) return; s.hero.orders.push({ id: k.id, units: k.units, at: k.at }); if (k.id === "k0") audit(s, "ganesh", "ordered " + k.units + " units", "Masala Chips scheme", k.at); if (s.hero.orders.length === D.KIRANAS.length) feed(s, E[12]); },
    allOrders: s => { D.KIRANAS.forEach(k => A.order(s, k.id)); },
    bid: (s, price) => { const p = price || 13; if (s.hero.bids.some(b => b.status === "placed" || b.status === "countered")) return; s.hero.bids.push({ id: "b" + (s.hero.bids.length + 1), price: p, at: "11:02", by: "venkat", status: "placed" }); s.hero.chat.push(Object.assign({}, D.CHAT[0], { text: `Can you do ₹${p % 1 ? p.toFixed(2) : p} for all 772?` })); audit(s, "venkat", "bid ₹" + p.toFixed(2), "ES-24117", "11:02"); },
    counter: s => { const b = s.hero.bids[s.hero.bids.length - 1]; if (b) { b.status = "countered"; b.counter = D.COUNTER.price; } s.hero.chat.push(D.CHAT[1]); feed(s, E[10]); },
    accept: s => { const b = s.hero.bids[s.hero.bids.length - 1]; if (b) b.status = "accepted"; s.hero.chat.push(D.CHAT[2]); s.hero.award = Object.assign({ at: "11:09", buyer: D.BUYER.name, status: "token paid" }, D.AWARD); s.hero.listing.status = "awarded"; feed(s, E[11]); notify(s, "priya", Object.assign({ link: "execution" }, D.PUSH.award)); },
    donate: s => { s.mango.donation = "booked"; feed(s, E[13]); notify(s, "meera", { title: "Pickup request · Mango Drink", body: "58 packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup from Begum Bazaar?", at: "Day 0", link: "pickups" }); },
    vanRound: s => { s.hero.van = { status: "done", done: D.KIRANAS.length }; feed(s, E[14]); },
    dispatch: s => { s.hero.truck = { status: "dispatched", at: "Day 3" }; if (s.hero.award) s.hero.award.status = "paid"; s.hero.phase = "dispatched"; audit(s, "rakesh", "dispatched the Hyderabad lot", "ES-24117", "Day 3"); },
    settle: s => { s.hero.phase = "settled"; s.hero.docs = D.DOCS.map(d => ({ id: d.id, status: d.status })); feed(s, E[15]); notify(s, "anita", Object.assign({ link: "paperwork" }, D.PUSH.papers)); notify(s, "vikram", Object.assign({ link: "report" }, D.PUSH.report)); },
    confirmPickup: s => { s.mango.donation = "confirmed"; audit(s, "meera", "confirmed the pickup, Tuesday 10:00", "MF-2410-118 · 58 packs", "Day 1"); notify(s, "priya", { title: "Feeding India confirmed", body: "58 packs of Mango Drink, pickup Tuesday 10:00 from Begum Bazaar. Served at the Charminar hunger spot.", at: "Day 1", link: "execution" }); },
    collect: s => { s.mango.donation = "collected"; audit(s, "meera", "collected 58 packs and issued the receipt", "MF-2410-118", "Day 4"); },
    review: s => { s.hero.reviewed = true; audit(s, "anita", "reviewed the document pack", "MF-2409-117", "Day 3"); },
    report: s => { s.hero.phase = "cleared"; s.hero.posted = true; feed(s, E[16]); notify(s, "priya", { title: "Batch closed · 0 cartons destroyed", body: `${fmt.inr(D.ACTUAL.net)} recovered, ${fmt.inr(PLAN.itcRetained)} GST credit kept, ${fmt.kg(PLAN.kg)} kept out of landfill.`, at: "Day 3", link: "command" }); audit(s, "vikram", "wrote the BRSR row", "MF-2409-117", "Day 3"); },
  };

  // the order in which the journey happens, grouped by the stage each step belongs to
  const SCRIPT = [
    ["connect", "connect"], ["detect", "detect"],
    ["verify", "requestPhoto"], ["verify", "sendPhoto", { human: "rakesh" }], ["verify", "verify"],
    ["value", "value"], ["decide", "decide"], ["approve", "approve", { human: "priya" }],
    ["execute", "list"], ["execute", "outreach"], ["execute", "order", { arg: "k0", human: "ganesh" }], ["execute", "allOrders"], ["execute", "bid", { arg: 13, human: "venkat" }], ["execute", "counter"], ["execute", "accept", { human: "venkat" }], ["execute", "donate"],
    ["settle", "vanRound"], ["settle", "dispatch", { human: "rakesh" }], ["settle", "settle"],
    ["report", "report", { human: "vikram" }],
  ];
  const STAGE_IDS = D.STAGES.map(s => s.id);
  const run = (name, arg) => Store.update(s => A[name](s, arg));
  // put the store in the state it has when stage n begins (all earlier stages complete)
  function fastForward(n) { Store.reset(); Store.update(s => { SCRIPT.filter(([st]) => STAGE_IDS.indexOf(st) < n).forEach(([, name, o]) => A[name](s, o && o.arg)); s.notifications.forEach(x => (x.read = true)); }); }
  // which stage is active (0-8), or 9 when the batch is cleared
  function stageOf(state) {
    const h = state.hero;
    if (!state.setup.confirmed) return 0;
    if (h.phase === "watching") return 1;
    if (h.photo.status !== "verified") return 2;
    if (h.phase === "verified") return 3;
    if (h.phase === "valued") return 4;
    if (h.phase === "planned") return 5;
    if (h.phase === "approved") return 6;
    if (h.phase === "executing") return h.award && h.orders.length === D.KIRANAS.length ? 7 : 6;
    if (h.phase === "dispatched") return 7;
    if (h.phase === "settled") return 8;
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
    const h = s.hero, auto = Agents.auto;
    if (!s.setup.confirmed) return null;
    switch (h.phase) {
      case "watching": return { name: "detect", delay: 2400 };
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
        if (k) return { name: "order", arg: k.id, delay: !h.orders.length ? 6000 : k.id === "k0" ? 12000 : 450 + Math.random() * 400, partner: shopUser(s, k) };
        if (auto && !h.bids.length) return { name: "bid", arg: 13, delay: 10000, partner: "venkat" };
        if (auto && last && last.status === "countered") return { name: "accept", delay: 8000, partner: "venkat" };
        if (auto && s.mango.donation === "booked") return { name: "confirmPickup", delay: 10000, partner: "meera" };
        if (h.award && h.orders.length === D.KIRANAS.length && h.van.status !== "done") return { name: "vanRound", delay: 3500 };
        if (auto && h.award && h.van.status === "done") return { name: "dispatch", delay: 10000, partner: "rakesh" };
        return null;
      }
      case "dispatched": return { name: "settle", delay: 1800 };
      case "settled": return { name: "report", delay: 3500 };
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

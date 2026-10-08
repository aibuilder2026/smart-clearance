/* Smart-Clearance v3 · the platform's mock backend (stands in for the console's own Firestore). Smart-Clearance's staff,
   the agents and connectors it offers, its plans, and every client workspace: supply chain, agents, exits and rules,
   people, integrations, plan and audit log. Munchly Foods is the only client, seeded from the same data as the app.
   Persisted per browser; every change notifies subscribers, and changes to a client write an audit line. */
(function () {
  const D = window.SC3_DATA, M = window.SC3_MONEY, AppStore = window.SC3_STORE;
  const R = M.RULES;
  const KEY = "sc3-platform", VERSION = 6;

  /* ---------- Smart-Clearance's own people (fictional) ---------- */
  const STAFF = [
    { id: "neha", name: "Neha Kulkarni", short: "Neha", role: "Super admin", team: "Customer success", email: "neha.kulkarni@smartclearance.com", passkey: "MacBook Pro · Touch ID" },
    { id: "sameer", name: "Sameer Rao", short: "Sameer", role: "Platform engineer", team: "Platform", email: "sameer.rao@smartclearance.com", passkey: "YubiKey 5C" },
  ];

  /* ---------- how far an agent may go before a person says yes ---------- */
  const AUTONOMY = [
    { id: "suggest", label: "Suggest", text: "Says what it would do, and does nothing" },
    { id: "ask", label: "Ask", text: "Waits for a person's yes before each action" },
    { id: "act", label: "Act", text: "Acts within its limits and reports what it did" },
  ];

  /* ---------- the agents, in the order they work; the approval gate sits between deciding and doing ---------- */
  const AGENTS = [
    { id: "data", name: "Data", stage: "connect", icon: "database", model: "Gemini Flash", job: "Loads each distributor's stock export and maps its columns" },
    { id: "watcher", name: "Watcher", stage: "detect", icon: "eye", model: "Gemini Flash", job: "Flags batches that won't sell in time, against the quick-commerce gates" },
    { id: "vision", name: "Vision", stage: "verify", icon: "scan-line", model: "Gemini Flash", job: "Reads the label photo from the godown" },
    { id: "valuer", name: "Valuer", stage: "value", icon: "scale", model: "Gemini Pro", job: "Prices every exit, the bin included" },
    { id: "router", name: "Router", stage: "decide", icon: "route", model: "Gemini Pro", job: "Splits the batch under each exit's caps" },
    { id: "gate", name: "Approval", stage: "approve", icon: "hand", gate: true, job: "A person approves every plan, with the money on screen" },
    { id: "lister", name: "Lister", stage: "execute", icon: "store", model: "Gemini Flash", job: "Lists on ExpireSoon in the distributor's name" },
    { id: "outreach", name: "Outreach", stage: "execute", icon: "send", model: "Gemini Flash", job: "Sends kirana offers" },
    { id: "negotiator", name: "Negotiator", stage: "execute", icon: "gavel", model: "Gemini Pro", job: "Answers bids" },
    { id: "paperwork", name: "Paperwork", stage: "settle", icon: "file-text", model: "Gemini Flash", job: "Drafts the invoice, e-way bill check, credit note, GST memo and FSSAI checklist" },
    { id: "impact", name: "Impact", stage: "report", icon: "leaf", model: "Gemini Flash", job: "Posts the ledger and the BRSR rows" },
  ];
  const STAGE_NAME = { connect: "Connect", detect: "Detect", verify: "Verify", value: "Value", decide: "Decide", approve: "Approve", execute: "Execute", settle: "Settle", report: "Report" };

  // each agent's settings, as the console edits them
  const money = v => "₹" + Number(v).toFixed(2);
  const FIELDS = {
    data: [{ key: "time", label: "Runs daily at", short: "daily run", type: "time" }, { key: "backfillDays", label: "History to load", short: "history", type: "number", unit: "days", min: 30, max: 365, step: 30 }],
    watcher: [{ key: "time", label: "Runs daily at", short: "daily run", type: "time" }, { key: "blinkitDays", label: "Blinkit takes stock with at least", short: "Blinkit gate", type: "number", unit: "days left", min: 30, max: 180, step: 5 }, { key: "qcomPct", label: "Zepto and Instamart take at least", short: "Zepto and Instamart gate", type: "number", unit: "% of life left", min: 30, max: 90, step: 5 }],
    vision: [{ key: "confidence", label: "Asks for another photo below", short: "confidence threshold", type: "number", unit: "confidence", min: 0.5, max: 0.99, step: 0.01 }],
    valuer: [{ key: "indicative", label: "Mark EPR, disposal and CO₂e as indicative", type: "switch", locked: "The factors are estimates, so they are always labelled" }],
    router: [{ key: "objective", label: "Aims for", short: "aim", type: "select", options: ["Most money recovered", "Fastest clearance"] }],
    gate: [{ key: "approver", label: "Approver", type: "approver" }],
    lister: [{ key: "reserve", label: "Reserve price, per pack", short: "reserve", type: "money", min: 1, max: 100, step: 0.5 }, { key: "territoryGuard", label: "Hide lots from buyers inside the client's territories", short: "territory guard", type: "switch" }],
    outreach: [{ key: "language", label: "Offers go out in", short: "language", type: "select", options: ["Hindi first", "Marathi first", "English first"] }, { key: "scheme", label: "Kirana scheme", short: "scheme", type: "select", options: ["2 free with every 10", "1 free with every 10", "No scheme"] }],
    negotiator: [{ key: "floor", label: "Never accepts below, per pack", short: "floor", type: "money", min: 1, max: 100, step: 0.5 }, { key: "counters", label: "Counter offers", short: "counter offers", type: "stepper", min: 0, max: 3 }, { key: "tokenPct", label: "Token on award", short: "token", type: "number", unit: "%", min: 5, max: 30, step: 1 }],
    paperwork: [{ key: "draftsOnly", label: "Drafts only; people send them", type: "switch", locked: "Invoices and credit notes always go out from a person" }],
    impact: [{ key: "returnWindowDays", label: "Posts after a return window of", short: "return window", type: "number", unit: "days", min: 7, max: 45, step: 1 }],
  };
  const fieldLabel = (agentId, key) => { const f = (FIELDS[agentId] || []).find(x => x.key === key); return f ? f.label : key; };
  const showValue = (f, v) => f.type === "money" ? money(v) : f.type === "switch" ? (v ? "on" : "off") : f.type === "number" && f.key === "confidence" ? Number(v).toFixed(2) : f.unit ? `${v} ${f.unit}` : String(v);

  // one line under each agent's name
  function summary(agentId, s, client) {
    switch (agentId) {
      case "data": return `daily ${s.time} · ${s.backfillDays} days of history`;
      case "watcher": return `daily ${s.time} · Blinkit ${s.blinkitDays}+ days, Zepto and Instamart ${s.qcomPct}% of life, unless an SKU has its own`;
      case "vision": return `asks again below ${Number(s.confidence).toFixed(2)} confidence`;
      case "valuer": return `${Object.values(client.exits).filter(x => x.on).length} exits on, and the bin`;
      case "router": return s.objective.toLowerCase();
      case "gate": { const p = client.people.find(x => x.id === s.approver); return `${p ? p.name : "no approver"} · one tap, always`; }
      case "lister": return `reserve ${money(s.reserve)} · ${s.territoryGuard ? "hidden inside the client's territories" : "visible everywhere"}`;
      case "outreach": return `${s.language} · ${s.scheme}`;
      case "negotiator": return `floor ${money(s.floor)} · up to ${s.counters} counter${s.counters === 1 ? "" : "s"} · ${s.tokenPct}% token`;
      case "paperwork": return "drafts only; people send them";
      case "impact": return `after the ${s.returnWindowDays}-day return window`;
      default: return "";
    }
  }

  /* ---------- what Smart-Clearance offers every client ---------- */
  const PLANS = [
    { id: "pilot", name: "Pilot", scope: ["One distributor", "Up to 10 SKUs", "90 days"] },
    { id: "growth", name: "Growth", scope: ["Every distributor in a region", "All ten agents", "The client's own sign-in"] },
    { id: "enterprise", name: "Enterprise", scope: ["Every region", "The client's SSO and data residency", "A named team"] },
  ];
  const CONNECTORS = [
    { id: "dms", name: "Distributor stock exports", kind: "Inventory", icon: "file-spreadsheet", note: "DMS exports as CSV, nightly", status: "ok" },
    { id: "bq", name: "BigQuery", kind: "Data", icon: "database", note: "Batches and sell-through by pincode and by shop", status: "ok" },
    { id: "gemini", name: "Gemini on Vertex AI", kind: "Agents", icon: "sparkles", note: "Flash for drafts and chat, Pro for labels and routing", status: "ok" },
    { id: "sso", name: "Google Workspace", kind: "Identity", icon: "google", note: "Client staff sign in with their company accounts", status: "ok" },
    { id: "auth", name: "Firebase Authentication", kind: "Identity", icon: "key-round", note: "One-time codes for invited distributors and kiranas", status: "ok" },
    { id: "fcm", name: "Firebase Cloud Messaging", kind: "Push", icon: "bell", note: "Web push to every role, with an in-app inbox", status: "ok" },
    { id: "expiresoon", name: "ExpireSoon", kind: "Marketplace", icon: "store", note: "Listings in the distributor's name", status: "mock" },
    { id: "tally", name: "Tally", kind: "Accounting", icon: "receipt", note: "Invoice drafts the distributor issues", status: "mock" },
    { id: "irp", name: "GST e-invoice", kind: "Tax", icon: "stamp", note: "Invoice reference numbers where the law asks for them", status: "mock" },
    { id: "foodbank", name: "Food-bank partners", kind: "Donation", icon: "heart-handshake", note: "Feeding India and IFBN intake rules", status: "mock" },
    { id: "whatsapp", name: "WhatsApp Business", kind: "Messaging", icon: "message-circle", note: "Kirana offers on WhatsApp", status: "soon" },
  ];

  /* ---------- a client's exits; D2C exists only for the manufacturer's own stock ---------- */
  const EXITS = [
    { id: "expiresoon", name: "ExpireSoon marketplace", icon: "store" },
    { id: "kirana", name: "Kirana scheme", icon: "shopping-basket" },
    { id: "staff", name: "Staff sale", icon: "users" },
    { id: "foodbank", name: "Food bank", icon: "heart-handshake" },
    { id: "d2c", name: "Discount D2C", icon: "globe" },
  ];
  // the supply-chain questions a new client answers, and what each answer switches on
  const PROFILE = {
    route: { label: "Route to market", options: [{ id: "distributors", label: "Through distributors" }, { id: "modern-trade", label: "Direct to modern trade" }, { id: "own", label: "Own warehouses and D2C" }] },
    owner: { label: "Who owns short-dated stock", options: [{ id: "distributor", label: "The distributor" }, { id: "manufacturer", label: "The manufacturer" }] },
    expiry: { label: "Expiry policy", options: [{ id: "full-credit", label: "Full credit at expiry" }, { id: "price-support", label: "Price support only" }, { id: "none", label: "No returns" }] },
  };
  const optLabel = (q, id) => { const o = PROFILE[q].options.find(x => x.id === id); return o ? o.label : id; };
  function exitsFor(profile) {
    const own = profile.owner === "manufacturer" || profile.route === "own";
    return { expiresoon: { on: true }, kirana: { on: profile.route !== "modern-trade" }, staff: { on: true, cap: R.staffCap }, foodbank: { on: true }, d2c: { on: own, locked: own ? null : "Only for the manufacturer's own stock" } };
  }
  function profileLines(profile) {
    const lines = [];
    if (profile.owner === "distributor") lines.push({ icon: "handshake", text: "Agents list, offer and invoice in the distributor's name, after his one-time permission" });
    else lines.push({ icon: "warehouse", text: "Agents list, offer and invoice in the manufacturer's own name" });
    if (profile.expiry === "full-credit") lines.push({ icon: "hand-coins", text: "Price support is offered before stock expires, so it never comes back for full credit" });
    else if (profile.expiry === "price-support") lines.push({ icon: "hand-coins", text: "Price support is the only lever; nothing comes back" });
    else lines.push({ icon: "ban", text: "No returns: every unsold pack is the distributor's loss, so speed matters most" });
    const ex = exitsFor(profile); const SHORT = { expiresoon: "ExpireSoon", kirana: "kiranas", staff: "staff sale", foodbank: "food bank", d2c: "discount D2C" }; const on = EXITS.filter(e => ex[e.id].on).map(e => SHORT[e.id]);
    lines.push({ icon: "route", text: "Exits: " + on.join(", ") });
    if (!ex.d2c.on) lines.push({ icon: "globe", text: "D2C stays off: it is only for the manufacturer's own stock" });
    return lines;
  }

  /* ---------- quick-commerce gates per SKU, with a per-batch override (SC-47) ---------- */
  // the console's day (the story's 6 Oct), which every batch's days left counts from
  const TODAY = D.addDays(D.DAY0, 4);
  // an SKU's own gates keep the profile's bounds; a batch's override records a deal a warehouse agreed to, so it may go lower
  const GATE_BOUNDS = { sku: { blinkitDays: [30, 180], qcomPct: [30, 90] }, override: { blinkitDays: [7, 180], qcomPct: [5, 90] } };
  const daysBetween = (from, to) => Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);
  // a batch's gates as the agents read them: its override, else its SKU's own, else the client's default, value by value.
  // Blinkit wants days left; Zepto and Instamart a share of the SKU's life left: a batch passes when days x 100 >= share x life
  function batchGates(client, batch, today) {
    const sku = client.skus.find(x => x.id === batch.sku), own = (sku && sku.gates) || {}, o = batch.override || {};
    const pick = k => (o[k] != null ? [o[k], "override"] : own[k] != null ? [own[k], "sku"] : [client.gates[k], "default"]);
    const [bl, blFrom] = pick("blinkitDays"), [qc, qcFrom] = pick("qcomPct");
    const life = sku.lifeDays, days = daysBetween(today || TODAY, batch.bestBefore), pct = Math.floor((days * 100) / life), qcPass = days * 100 >= qc * life;
    return { blinkitDays: bl, qcomPct: qc, daysLeft: days, lifeDays: life, checks: [
      { app: "blinkit", need: bl, has: days, pass: days >= bl, source: blFrom },
      { app: "zepto", need: qc, has: pct, pass: qcPass, source: qcFrom },
      { app: "instamart", need: qc, has: pct, pass: qcPass, source: qcFrom },
    ] };
  }
  const gateText = g => [g.blinkitDays != null && `Blinkit ${g.blinkitDays}+ days`, g.qcomPct != null && `Zepto and Instamart ${g.qcomPct}% of life`].filter(Boolean).join(", ");
  const isInt = v => typeof v === "number" && Number.isInteger(v);
  // what an SKU's own gates must be, or the problem with them (null puts it back on the client's default)
  function skuGatesError(g) {
    if (g == null) return null;
    const [b, q] = [GATE_BOUNDS.sku.blinkitDays, GATE_BOUNDS.sku.qcomPct];
    if (g.blinkitDays == null && g.qcomPct == null) return "Give the SKU at least one gate of its own, or put it back on the default.";
    if (g.blinkitDays != null && (!isInt(g.blinkitDays) || g.blinkitDays < b[0] || g.blinkitDays > b[1])) return `Blinkit takes ${b[0]} to ${b[1]} days.`;
    if (g.qcomPct != null && (!isInt(g.qcomPct) || g.qcomPct < q[0] || g.qcomPct > q[1])) return `Zepto and Instamart take ${q[0]}% to ${q[1]}% of life.`;
    return null;
  }
  // what a batch's override must carry, or the problem with it
  function overrideError(o) {
    const [b, q] = [GATE_BOUNDS.override.blinkitDays, GATE_BOUNDS.override.qcomPct];
    if (o.blinkitDays == null && o.qcomPct == null) return "Override at least one gate.";
    if (o.blinkitDays != null && (!isInt(o.blinkitDays) || o.blinkitDays < b[0] || o.blinkitDays > b[1])) return `A batch's Blinkit gate is ${b[0]} to ${b[1]} days.`;
    if (o.qcomPct != null && (!isInt(o.qcomPct) || o.qcomPct < q[0] || o.qcomPct > q[1])) return `A batch's Zepto and Instamart gate is ${q[0]}% to ${q[1]}% of life.`;
    const why = (o.reason || "").trim();
    if (!why) return "Say why this batch is different.";
    if (why.length > 200) return "Keep the reason to 200 characters.";
    return null;
  }
  const poss = n => n + (/s$/i.test(n) ? "'" : "'s");
  const skuGatesLine = (client, sku, g) => (g ? `Set ${sku.name}'s quick-commerce gates: ${gateText(g)}` : `Put ${sku.name} back on ${poss(client.name)} default quick-commerce gates`);
  const overrideLine = (ref, o) => `Overrode ${ref}'s quick-commerce gates: ${gateText(o)} (${o.reason.trim()})`;
  const clearOverrideLine = ref => `Removed ${ref}'s quick-commerce gate override`;

  /* ---------- the length of a journey day (SC-68, the console's option A) ---------- */
  // how many minutes of real time one day of a client's journey lasts, from 1 to 1,440; 1,440 is real time. The agents'
  // schedules, the offer windows and every time in the workspace follow it (backend-api's journey clock runs on it while
  // a batch is at risk). A client starts in real time
  const DAY_MINUTES = 1440;
  const DAY_PRESETS = [
    { id: 1440, label: "Real time", sub: "A journey day is a day" },
    { id: 60, label: "Rehearsal", sub: "An hour a day" },
    { id: 5, label: "Demo", sub: "Five minutes a day" },
    { id: 1, label: "Fast", sub: "A minute a day" },
  ];
  // a length of day in words: 5 → "5 minutes", 90 → "1 h 30 min", 120 → "2 hours", 1,440 → "a day"
  const dayWords = m => (m >= DAY_MINUTES ? "a day" : m >= 60 ? (m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} hour${m === 60 ? "" : "s"}`) : `${m} minute${m === 1 ? "" : "s"}`);
  // a stretch of real time, roughly: 10 → "10 minutes", 235 → "3.9 hours", 2,880 → "2 days"
  const spanWords = min => (min < 90 ? `${Math.round(min)} minutes` : min < 60 * 36 ? `${Math.round(min / 6) / 10} hours` : `${Math.round(min / 144) / 10} days`);
  // the badge in the client's head: "Real time", "1 day = 5 min", "1 day = 2 hours"
  const dayBadge = m => (m >= DAY_MINUTES ? "Real time" : `1 day = ${m >= 60 ? dayWords(m) : m + " min"}`);
  // what a length of day does to the agents, in their own terms; the list's head says the length
  const dayReadouts = m => [
    { icon: "radar", title: "The Watcher's 09:00 check", value: m >= DAY_MINUTES ? "once a day" : `every ${dayWords(m)}` },
    { icon: "send", title: "A 48-hour kirana offer", value: `open ${spanWords(2 * m)}` },
    { icon: "route", title: "A 47-day batch journey", value: `about ${spanWords(47 * m)}` },
  ];
  const dayHead = m => (m >= DAY_MINUTES ? "In real time" : `At ${dayWords(m)} a day`);
  const dayMinutesError = v => (isInt(v) && v >= 1 && v <= DAY_MINUTES ? null : "Enter a whole number of minutes, from 1 to 1,440.");
  const dayMinutesLine = (client, to, was) => `Set the length of a journey day for ${client.name} to ${dayWords(to)} (was ${dayWords(was)})`;

  /* ---------- the Overview's dashboard (SC-48): every figure an aggregate over the batches and the runs ---------- */
  // a batch's recovery counts on the day it closed, or, while it is still open past Settle, the day it was flagged. It
  // is in flight from being flagged until it closes, and waits for a yes at Approve (the sixth stop). Days are India's
  const APPROVE = 5, RANGES = [7, 30, 90], SIZES = [8, 16, 32], IST_MS = 19800000;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const istDay = at => new Date(Date.parse(at) + IST_MS).toISOString().slice(0, 10);
  const dayLabel = iso => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
  const dayEnd = iso => Date.parse(D.addDays(iso, 1) + "T00:00:00+05:30");
  const updatedAt = b => Math.max(...[b.openedAt, b.override && b.override.setAt, b.closedAt].filter(Boolean).map(Date.parse));
  const two = n => String(n).padStart(2, "0");
  // the figures over the last `days` days, ending today (the console's day in the prototype); `now` is when they are read
  function dashboard(s, { days = 30, client = null, today = TODAY, now = Date.now() } = {}) {
    if (!RANGES.includes(days)) throw new Error("Show 7, 30 or 90 days.");
    const bs = s.batches.filter(b => !client || b.client === client);
    const first = D.addDays(today, -(days - 1)), before = D.addDays(first, -days);
    const range = Array.from({ length: days }, (_, i) => D.addDays(first, i));
    const rec = {}, closed = {}; let recoveredBefore = 0;
    bs.forEach(b => {
      const d = istDay(b.closedAt || b.openedAt);
      if (b.recovered > 0) { if (d >= first && d <= today) rec[d] = (rec[d] || 0) + b.recovered; else if (d >= before && d < first) recoveredBefore += b.recovered; }
      if (b.closedAt) { const c = istDay(b.closedAt); closed[c] = closed[c] || [0, 0]; closed[c][0] += 1; closed[c][1] += b.units; }
    });
    // the runs the prototype keeps are today's
    const runsToday = s.runs.filter(r => !client || r.client === client).length;
    const open = bs.filter(b => !b.closedAt);
    const byStop = Array(9).fill(0); open.forEach(b => { byStop[Math.min(b.current, 8)] += 1; });
    // the batches at each stop, the latest to arrive first (three a stop), and the ones closed today (SC-49)
    const seqOf = new Map(bs.map((b, i) => [b, i])), mark = b => ({ client: b.client, ref: b.ref, at: b.closedAt || b.stageAt || b.openedAt });
    const latest = at => (x, y) => Date.parse(at(y)) - Date.parse(at(x)) || seqOf.get(x) - seqOf.get(y);
    const atStop = byStop.map((_, i) => open.filter(b => Math.min(b.current, 8) === i).sort(latest(b => b.stageAt || b.openedAt)).slice(0, 3).map(mark));
    const shut = bs.filter(b => b.closedAt && istDay(b.closedAt) === today).sort(latest(b => b.closedAt));
    const waiting = open.filter(b => b.current === APPROVE).sort((a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt));
    const r2 = v => Math.round(v * 100) / 100;
    const t = new Date(now + IST_MS);
    const out = {
      readAt: `${two(t.getUTCHours())}:${two(t.getUTCMinutes())}:${two(t.getUTCSeconds())}`, days,
      recovered: r2(range.reduce((sum, d) => sum + (rec[d] || 0), 0)), recoveredBefore: r2(recoveredBefore),
      byDay: range.map(d => ({ date: d, label: dayLabel(d), recovered: r2(rec[d] || 0), closed: (closed[d] || [0])[0], units: (closed[d] || [0, 0])[1], runs: d === today ? runsToday : 0 })),
      inFlight: open.length, inFlightClients: new Set(open.map(b => b.client)).size,
      inFlightSeries: range.map(d => { const cut = d < today ? dayEnd(d) : Math.min(now, dayEnd(d)); return bs.filter(b => Date.parse(b.openedAt) <= cut && (!b.closedAt || Date.parse(b.closedAt) > cut)).length; }),
      waiting: waiting.length, runsToday, byStop, atStop,
      closedToday: { count: shut.length, recovered: r2(shut.reduce((t, b) => t + b.recovered, 0)), batches: shut.slice(0, 3).map(mark) },
    };
    if (waiting.length) { const w = waiting[0], c = s.clients.find(x => x.id === w.client); out.oldestWaiting = { hours: Math.floor((now - Date.parse(w.openedAt)) / 3600000), client: c ? c.name : w.client }; }
    return out;
  }
  // every client's batches, a page at a time: in flight (the ones waiting for a yes first, then the fewest days left),
  // waiting for a yes, or closed; by client, stop and a search over the batch, its product and its distributor
  function batchPage(s, q = {}, today = TODAY) {
    const { status = "in-flight", client = null, stop = null, sort = "priority", dir = "asc", page = 1, size = 8 } = q;
    if (!SIZES.includes(size)) throw new Error("Show 8, 16 or 32 rows a page.");
    const text = (q.q || "").trim().toLowerCase();
    const rows = s.batches.map((b, seq) => {
      const c = s.clients.find(x => x.id === b.client) || { skus: [], distributors: [] };
      const sku = c.skus.find(x => x.id === b.sku) || { name: b.sku, mrp: 0 }, d = c.distributors.find(x => x.id === b.distributor) || { name: b.distributor, city: "" };
      const at = updatedAt(b), local = istDay(new Date(at).toISOString());
      const t = new Date(at + IST_MS);
      const row = { client: b.client, ref: b.ref, product: sku.name, distributor: d.name, city: d.city, stage: b.closedAt ? 9 : b.current, done: b.closedAt ? 9 : b.done,
        units: b.units, value: Math.round((b.recovered > 0 ? b.recovered : b.units * sku.mrp) * 100) / 100, valueKind: b.recovered > 0 || b.closedAt ? "recovered" : "mrp",
        updated: local === today ? `${two(t.getUTCHours())}:${two(t.getUTCMinutes())}` : dayLabel(local), closed: !!b.closedAt };
      if (b.bestBefore) row.daysLeft = daysBetween(today, b.bestBefore);
      if (b.outcome) row.outcome = b.outcome;
      return { row, seq, b, at };
    }).filter(x => (!client || x.b.client === client) && (!text || [x.b.ref, x.row.product, x.row.distributor, x.row.city].some(v => v.toLowerCase().includes(text))));
    const is = { "in-flight": x => !x.b.closedAt, waiting: x => !x.b.closedAt && x.b.current === APPROVE, closed: x => !!x.b.closedAt };
    const counts = { inFlight: rows.filter(is["in-flight"]).length, waiting: rows.filter(is.waiting).length, closed: rows.filter(is.closed).length };
    const picked = rows.filter(is[status]).filter(x => stop == null || status === "closed" || x.b.current === stop);
    const nullsLast = (a, b) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : 0);
    const KEY = { stop: x => x.b.current, days: x => x.row.daysLeft, units: x => x.row.units, value: x => x.row.value, updated: x => x.at };
    picked.sort((x, y) => {
      if (sort === "priority" || !KEY[sort]) return (y.b.current === APPROVE) - (x.b.current === APPROVE) || nullsLast(x.row.daysLeft, y.row.daysLeft) || (x.row.daysLeft || 0) - (y.row.daysLeft || 0) || x.seq - y.seq;
      const a = KEY[sort](x), b = KEY[sort](y);
      return nullsLast(a, b) || (a > b ? 1 : a < b ? -1 : 0) * (dir === "desc" ? -1 : 1) || x.seq - y.seq;
    });
    const p = Math.max(1, page);
    return { rows: picked.slice((p - 1) * size, p * size).map(x => x.row), total: picked.length, page: p, size, counts };
  }

  /* ---------- agent presets for a new client; the approval gate is always on ---------- */
  const PRESETS = [
    { id: "cautious", label: "Cautious", text: "Agents suggest; people do everything" },
    { id: "standard", label: "Standard", text: "Agents act on data and pricing; they ask before bids and paperwork" },
    { id: "trusted", label: "Trusted", text: "Agents act within their limits; they ask only on bids" },
  ];
  function agentDefaults(preset, client) {
    const auto = { cautious: { data: "act", watcher: "act" }, standard: { vision: "ask", negotiator: "ask", paperwork: "ask" }, trusted: { negotiator: "ask", paperwork: "ask" } }[preset] || {};
    const base = preset === "cautious" ? "suggest" : "act";
    const settings = {
      data: { time: "08:30", backfillDays: 90 }, watcher: { time: "09:00", blinkitDays: R.gates.blinkit.minDays, qcomPct: Math.round(R.gates.zepto.pctLife * 100) },
      vision: { confidence: 0.9 }, valuer: { indicative: true }, router: { objective: "Most money recovered" }, gate: { approver: client && client.approver || null },
      lister: { reserve: R.negotiation.reservePerUnit, territoryGuard: true }, outreach: { language: "Hindi first", scheme: "2 free with every 10" },
      negotiator: { floor: R.negotiation.reservePerUnit, counters: 2, tokenPct: Math.round(R.tokenPct * 100) }, paperwork: { draftsOnly: true }, impact: { returnWindowDays: R.returnWindowDays },
    };
    const out = {};
    AGENTS.forEach(a => { out[a.id] = { on: true, autonomy: a.gate ? "gate" : (auto[a.id] || base), settings: settings[a.id], last: null, next: null }; });
    return out;
  }

  /* ---------- Munchly Foods, from the app's own seed ---------- */
  const ROLE_LABEL = { operator: "Supply chain", distributor: "Distributor", retailer: "Kirana", finance: "Finance & GST", sustainability: "Sustainability & BRSR", foodbank: "Food bank", admin: "Workspace admin" };
  function seedMunchly() {
    const app = AppStore.seed(); const W = D.WORKSPACE;
    const people = app.users.filter(u => u.role !== "buyer").map(u => {
      const staff = u.kind === "staff" || (!u.kind && u.provider === "google" && !u.extra && u.org === "Munchly Foods");
      const access = u.id === "priya" ? "Approver" : u.role === "admin" ? "Admin" : staff ? "Member" : "Partner";
      const provider = u.provider === "phone" ? "Phone and code" : staff ? "Google" : "Google, invited";
      const role = u.extra ? (u.invitedBy ? `invited by ${u.invitedBy}` : ROLE_LABEL[u.role]) : (u.role === "operator" || u.role === "finance" || u.role === "sustainability" || u.role === "admin" ? u.role === "admin" ? "Workspace admin" : (D.PEOPLE[u.id] && D.PEOPLE[u.id].role) || ROLE_LABEL[u.role] : u.org);
      return { id: u.id, name: u.name, org: u.org || W.name, role, kind: ROLE_LABEL[u.role], access, provider, status: u.status, img: u.img || null, email: u.email || "", phone: u.phone || "" };
    });
    const permission = { rakesh: "given", lakshmi: "given", patil: "not-yet", gupta: "not-yet" };
    const distributors = Object.values(D.DISTRIBUTORS).map(d => ({ id: d.id, name: d.name, city: d.city, state: d.state, kiranas: d.kiranas, staffCap: d.staffCap || null, permission: permission[d.id] || "not-yet" }));
    // three SKUs keep gates of their own: the drink's shorter shelf, and the two 730-day Glowra packs (illustrative)
    const OWN_GATES = { mango: { blinkitDays: 45, qcomPct: 50 }, facewash: { blinkitDays: 180 }, hairoil: { blinkitDays: 180 } };
    const skus = Object.values(D.SKUS).map(s => ({ id: s.id, code: s.code, brand: s.brand, name: s.name, mrp: s.mrp, gst: s.gst, lifeDays: s.lifeDays, gates: OWN_GATES[s.id] || {} }));
    const profile = { route: "distributors", owner: "distributor", expiry: "full-credit" };
    const client = {
      id: W.id, name: W.name, legal: D.CLIENT && D.CLIENT.name || "Munchly Foods Ltd", city: "Pune", industry: "Snacks, drinks and personal care", domain: W.domain, emailDomain: W.emailDomain, mark: W.mark,
      plan: "pilot", status: "live", since: W.since, region: W.region, profile, gates: { blinkitDays: R.gates.blinkit.minDays, qcomPct: Math.round(R.gates.zepto.pctLife * 100) },
      territoryGuard: true, returnWindowDays: R.returnWindowDays, dayMinutes: DAY_MINUTES, exits: exitsFor(profile), rules: { reserve: R.negotiation.reservePerUnit, scheme: "2 free with every 10", staffCap: R.staffCap, tokenPct: Math.round(R.tokenPct * 100), offerWindowHours: app.rules.offerWindowHours, hindiOffers: app.rules.hindiOffers, requirePhoto: app.rules.requirePhoto },
      signIn: W.signIn.map(s => ({ id: s.id, title: s.title, who: s.who, rule: s.rule, on: true })),
      distributors, skus, people, integrations: app.integrations.map(i => ({ id: i.id, name: i.name, kind: i.kind, status: i.status, note: i.note })),
      recovered: D.ACTUAL.net, batches: D.BATCHES.length,
      // its first stock export, set up in the console by Neha and mapped by the Data agent (SC-84)
      firstExport: { status: "mapped", file: D.SETUP.dms.file, rows: D.SETUP.dms.rows, batches: D.BATCHES.length, distributors: distributors.length, by: "Neha Kulkarni", at: null, columns: exportColumns(true) },
      approver: "priya",
    };
    client.agents = agentDefaults("standard", client);
    const last = { data: "08:30 today · 4 exports, 312 batches", watcher: "09:00 today · MF-2410-118 at risk, 22 days left", vision: "09:14 today · label read, 0.96", valuer: "09:21 today · exits priced; ExpireSoon needs 30+ days", router: "09:22 today · plan sent to Priya", gate: "09:40 today · Priya approved MF-2410-118", lister: "1 Oct · ES-24117 listed in Rakesh Traders' name", outreach: "09:42 today · offers to Lakshmi Agencies' kiranas", negotiator: "1 Oct · countered ₹14.20 on ES-24117", paperwork: "11:05 today · FSSAI checklist for Feeding India", impact: "waits for the return window to close on 29 Oct" };
    const next = { data: "tomorrow 08:30", watcher: "tomorrow 09:00", vision: "on the next label", valuer: "on the next batch", router: "on the next batch", gate: "on the next plan", lister: "on the next plan", outreach: "on the next plan", negotiator: "on the next bid", paperwork: "on the next sale", impact: "30 Oct" };
    Object.keys(client.agents).forEach(k => { client.agents[k].last = last[k]; client.agents[k].next = next[k]; });
    return client;
  }

  /* ---------- the day the console opens on (synthetic, consistent with the story) ---------- */
  const TRACKS = [
    { client: "munchly", batch: "MF-2409-117", sku: "chips", distributor: "rakesh", done: 8, current: 8, note: "Report waits for the return window", money: D.ACTUAL.net, stageAt: "2026-10-05T18:10:00+05:30" },
    { client: "munchly", batch: "MF-2410-118", sku: "mango", distributor: "lakshmi", done: 6, current: 6, split: "1,372 to kiranas · 150 staff sale · 58 food bank", stageAt: "2026-10-06T09:40:00+05:30" },
  ];
  // Munchly's batches the Watcher sees, from the app's own seed: the two on the move (TRACKS), the rest at Detect. One
  // carries a gate override, the deal Zepto's Pune warehouse agreed to (illustrative). stageAt is when a batch reached
  // the stop it is at (SC-49): Overview's agents show the latest arrivals at each stop first
  const BATCHES = D.BATCHES.map(b => {
    const t = TRACKS.find(x => x.batch === b.id), openedAt = "2026-10-02T09:00:00+05:30";
    return { client: "munchly", ref: b.id, sku: b.sku, distributor: b.distributor, units: b.units, bestBefore: b.bestBefore, done: t ? t.done : 1, current: t ? t.current : 1,
      openedAt, stageAt: t && t.stageAt ? t.stageAt : openedAt, recovered: t && t.money ? t.money : 0 };
  });
  BATCHES.find(b => b.ref === "MF-2409-204").override = { qcomPct: 30, reason: "Zepto's Pune warehouse agreed to take this lot at 30% of its life", by: "Neha Kulkarni", at: "4 Oct, 16:20", setAt: "2026-10-04T16:20:00+05:30" };
  const RUNS = [
    { at: "08:30", agent: "data", client: "munchly", text: "4 stock exports loaded, 312 batches" },
    { at: "09:00", agent: "watcher", client: "munchly", text: "MF-2410-118 at risk, 22 days left" },
    { at: "09:14", agent: "vision", client: "munchly", text: "label read, confidence 0.96" },
    { at: "09:21", agent: "valuer", client: "munchly", text: "exits priced; ExpireSoon needs 30+ days" },
    { at: "09:22", agent: "router", client: "munchly", text: "plan sent to Priya" },
    { at: "09:40", agent: "gate", client: "munchly", text: "Priya approved MF-2410-118", tone: "amber" },
    { at: "09:42", agent: "outreach", client: "munchly", text: "offers to Lakshmi Agencies' kiranas" },
    { at: "11:05", agent: "paperwork", client: "munchly", text: "FSSAI checklist for Feeding India" },
  ];
  const AUDIT = [
    { id: "a1", at: "30 Sep, 17:05", who: "Neha Kulkarni", client: "munchly", text: "Set up Munchly Foods from its supply-chain profile: through 4 distributors, the distributor owns the stock, full credit at expiry" },
    { id: "a2", at: "30 Sep, 17:12", who: "Sameer Rao", client: "munchly", text: "Connected the distributors' stock exports, nightly CSV" },
    { id: "a3", at: "1 Oct, 09:00", who: "Neha Kulkarni", client: "munchly", text: "Moved Munchly Foods to Live on the Pilot plan" },
    { id: "a4", at: "1 Oct, 09:15", who: "Arjun Nair", client: "munchly", text: "Invited Rakesh bhai, Ganesh ji and Meera" },
    { id: "a5", at: "1 Oct, 16:50", who: "Rakesh bhai", client: "munchly", text: "Gave the agents his one-time permission for Rakesh Traders" },
    { id: "a6", at: "2 Oct, 11:20", who: "Neha Kulkarni", client: "munchly", text: "Set the Negotiator to Ask for Munchly Foods" },
    { id: "a7", at: "3 Oct, 18:02", who: "Arjun Nair", client: "munchly", text: "Deactivated Krishna Kirana Bhandar" },
    { id: "a8", at: "4 Oct, 16:20", who: "Neha Kulkarni", client: "munchly", text: "Overrode MF-2409-204's quick-commerce gates: Zepto and Instamart 30% of life (Zepto's Pune warehouse agreed to take this lot at 30% of its life)" },
  ];

  /* ---------- a client's journey, driven from the console (SC-79) ---------- */
  // What backend-api answers for a client whose workspace is live (GET …/journey): the Data agent's daily load and the
  // Watcher's daily check, and the timers an offer leaves (its window closing, the day-7 shelf check, the report), each
  // with when it falls due in journey time and the wall time it fires. The prototype holds Munchly's journey still at
  // day 1, Sat 3 Oct 10:15: firing a daily run makes it that day's, firing a timer takes it away, and a reset puts the
  // journey back at day 0, 08:00, with nothing pending but the day's two runs.
  const DAILY = [{ id: "data", name: "Data agent", time: "08:30", what: "daily load" }, { id: "watcher", name: "Watcher", time: "09:00", what: "daily check" }];
  const TIMER_WORDS = { "offer.close": "closed the offer window", "shelf.due": "ran the day-7 shelf check", "report.due": "wrote the report" };
  const JOURNEY_TIMERS = [
    { id: "timer-1", agent: "outreach", key: "offer.close", ref: "MF-2409-117", due: "2026-10-04T12:40:00+05:30" },
    { id: "timer-2", agent: "outreach", key: "shelf.due", ref: "MF-2409-117", due: "2026-10-09T12:40:00+05:30", blocked: "After the van round: the papers come first" },
    { id: "timer-3", agent: "impact", key: "report.due", ref: "MF-2409-117", due: "2026-10-30T10:00:00+05:30", blocked: "After the papers and the shelf check" },
  ];
  const seedJourney = () => ({ day0: D.DAY0, now: D.addDays(D.DAY0, 1) + "T10:15:00+05:30", setupConfirmed: true, daily: { data: D.addDays(D.DAY0, 1), watcher: D.addDays(D.DAY0, 1) }, timers: JOURNEY_TIMERS.map(t => Object.assign({}, t)) });
  const ms = iso => Date.parse(iso);
  function journey(s, id, wall = Date.now()) {
    const c = s.clients.find(x => x.id === id); const j = (s.journeys || {})[id];
    const off = a => (c && c.agents[a.id] && !c.agents[a.id].on ? `The ${a.name} is off` : null);
    if (!c || !j) return { live: false, clock: null, triggers: DAILY.map(a => ({ id: a.id, agent: a.id, kind: "run", key: a.id + ".daily", ref: null, due: null, dueWall: null, time: a.time, blocked: c ? off(a) : null })) };
    const today = j.now.slice(0, 10);
    // a journey day lasts dayMinutes of wall time while a batch is at risk, as backend-api's clock runs
    const wallOf = at => new Date(wall + (ms(at) - ms(j.now)) * c.dayMinutes / DAY_MINUTES).toISOString();
    const runs = DAILY.map(a => { const day = j.daily[a.id] === today ? D.addDays(today, 1) : today; const due = `${day}T${a.time}:00+05:30`; return { id: a.id, agent: a.id, kind: "run", key: a.id + ".daily", ref: null, due, dueWall: wallOf(due), time: a.time, blocked: off(a) || (a.id === "watcher" && !j.setupConfirmed ? "After Setup is confirmed" : null) }; });
    const timers = j.timers.map(t => ({ id: t.id, agent: t.agent, kind: "timer", key: t.key, ref: t.ref, due: t.due, dueWall: wallOf(t.due), time: null, blocked: t.blocked || null }));
    const day = Math.round((ms(today + "T00:00:00+05:30") - ms(j.day0 + "T00:00:00+05:30")) / 864e5);
    return { live: true, clock: { now: j.now, day, day0: j.day0, dayMinutes: c.dayMinutes, compressed: c.dayMinutes < DAY_MINUTES }, triggers: runs.concat(timers).sort((a, b) => ms(a.due) - ms(b.due)) };
  }
  // the audit line a fire writes, in backend-api's words
  function fireLine(c, t) {
    if (t.kind === "run") { const a = DAILY.find(x => x.id === t.id); return t.due ? `Ran the ${a.name}'s ${a.what} now for ${c.name}` : `Ran the ${a.name === "Data agent" ? "Data" : a.name} agent now for ${c.name}`; }
    const agent = AGENTS.find(a => a.id === t.agent);
    return `Fired the ${agent.name} agent's timer now for ${c.name}: ${TIMER_WORDS[t.key]} for ${t.ref}`;
  }
  // a fire, on the draft: a daily run becomes that day's, a timer goes; the run's line joins today's runs
  function fire(draft, id, t, at) {
    const j = (draft.journeys || {})[id];
    if (t.kind === "run") { if (j) j.daily[t.id] = j.now.slice(0, 10); draft.runs.unshift({ at, agent: t.id, client: id, text: j ? `ran the ${DAILY.find(x => x.id === t.id).what} on request` : "ran on request; nothing new" }); return; }
    if (j) j.timers = j.timers.filter(x => x.id !== t.id);
    draft.runs.unshift({ at, agent: t.agent, client: id, text: `${TIMER_WORDS[t.key]} for ${t.ref}, on request` });
  }
  // the journey from day 0 again: nothing pending but the day's two runs, Setup to confirm again
  function resetJourney(draft, id) { draft.journeys[id] = { day0: D.DAY0, now: D.DAY0 + "T08:00:00+05:30", setupConfirmed: false, daily: {}, timers: [] }; }
  const resetLine = () => `started the journey again from ${D.DAY0}`;
  // a client's stock export, uploaded by staff (SC-84): mapping until the Data agent has read it, then mapped with what
  // the file brought (the prototype's export is the story's: its rows, batches and distributors)
  // the Smart-Clearance fields a stock export fills, each with the file's column once the Data agent has mapped it
  function exportColumns(mapped) { return D.SETUP.dms.columns.map(([field, column]) => ({ field, column: mapped ? column : null })); }
  function exportUploaded(draft, id, file, who, at) {
    const c = draft.clients.find(x => x.id === id);
    c.firstExport = { status: "mapping", file, rows: 0, batches: 0, distributors: c.distributors.length, by: who, at, columns: exportColumns(false) };
  }
  function exportMapped(draft, id) {
    const c = draft.clients.find(x => x.id === id);
    if (c.firstExport) c.firstExport = Object.assign({}, c.firstExport, { status: "mapped", rows: D.SETUP.dms.rows, batches: D.BATCHES.length, distributors: Math.max(c.distributors.length, Object.keys(D.DISTRIBUTORS).length), columns: exportColumns(true) });
  }
  const exportLine = (c, file) => `Uploaded ${poss(c.name)} stock export ${file}; the Data agent maps and loads it`;

  function seed() {
    return { v: VERSION, journeys: { munchly: seedJourney() }, clients: [seedMunchly()], staff: STAFF.map(s => Object.assign({ status: "active" }, s)), runs: RUNS.slice(), tracks: TRACKS.slice(), batches: BATCHES.map(b => Object.assign({}, b, b.override ? { override: Object.assign({}, b.override) } : {})), audit: AUDIT.slice(), requests: [], seq: 1, nextAudit: 100 };
  }

  /* ---------- the store ---------- */
  const listeners = new Set();
  let state = seed(); let persist = false;
  const clone = o => (typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
  function save() { if (!persist) return; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function emit() { listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } }); }
  const nowLabel = () => { const d = new Date(); return "Today, " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  // log: append an audit line to the draft (who did what, for which client)
  function log(draft, who, client, text) { draft.audit.unshift({ id: "a" + (draft.nextAudit++), at: nowLabel(), who, client, text }); }
  const slug = name => (name || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-(foods?|ltd|limited|pvt|private|india)$/g, "").slice(0, 24) || "client";

  // a new client from the setup flow: its profile decides the exits, its preset the agents' autonomy
  function buildClient(f) {
    const id = slug(f.name); const profile = { route: f.route, owner: f.owner, expiry: f.expiry };
    const admin = { id: "admin-" + id, name: f.adminName, org: f.name, role: "Workspace admin", kind: "Workspace admin", access: "Admin", provider: "Google", status: "invited", img: null, email: f.adminEmail, phone: "" };
    const client = {
      id, name: f.name, legal: f.name, city: f.city, industry: f.industry, domain: id + ".smartclearance.com", emailDomain: f.emailDomain, mark: { from: f.colour, to: f.colour, ink: "#ffffff" },
      plan: f.plan, status: "setting-up", since: null, region: "India", profile, gates: { blinkitDays: R.gates.blinkit.minDays, qcomPct: Math.round(R.gates.zepto.pctLife * 100) },
      territoryGuard: true, returnWindowDays: R.returnWindowDays, dayMinutes: DAY_MINUTES, exits: exitsFor(profile), rules: { reserve: R.negotiation.reservePerUnit, scheme: "2 free with every 10", staffCap: R.staffCap, tokenPct: Math.round(R.tokenPct * 100), offerWindowHours: 48, hindiOffers: true, requirePhoto: true },
      signIn: [{ id: "google", title: "Google Workspace", who: f.name + " staff", rule: f.emailDomain + " accounts only", on: f.signGoogle }, { id: "phone", title: "Mobile number and a one-time code", who: "Distributors and kirana owners", rule: "Numbers the client or its distributors invite", on: f.signPhone }],
      distributors: [], skus: [], people: [admin], integrations: [], recovered: 0, batches: 0, approver: admin.id, firstExport: null,
    };
    client.agents = agentDefaults(f.preset, client);
    Object.keys(client.agents).forEach(k => { client.agents[k].last = "not run yet"; client.agents[k].next = "after the first stock export"; });
    if (!client.exits.d2c.on) client.exits.d2c.on = false;
    return client;
  }

  const Platform = {
    get: () => state,
    // update(fn, audit?): audit = { who, client, text } adds one line
    update(fn, audit) { const draft = clone(state); fn(draft); if (audit) log(draft, audit.who, audit.client, audit.text); draft.seq = (draft.seq || 0) + 1; state = draft; save(); emit(); return state; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { state = seed(); save(); emit(); },
    usePersistence() { persist = true; try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); if (d && d.v === VERSION) state = d; } } catch (e) {} },
    client: id => state.clients.find(c => c.id === id),
    buildClient, slug, summary, fieldLabel, showValue, money, exitsFor, profileLines, optLabel, agentDefaults,
    dashboard, batchPage, RANGES, SIZES,
    TODAY, GATE_BOUNDS, batchGates, gateText, skuGatesError, overrideError, skuGatesLine, overrideLine, clearOverrideLine,
    DAY_MINUTES, DAY_PRESETS, dayWords, spanWords, dayBadge, dayReadouts, dayHead, dayMinutesError, dayMinutesLine, poss,
    journey, fire, fireLine, resetJourney, resetLine,
    exportUploaded, exportMapped, exportLine,
    STAFF, AUTONOMY, AGENTS, STAGE_NAME, FIELDS, PLANS, CONNECTORS, EXITS, PROFILE, PRESETS, seed,
  };
  window.SC3_PLATFORM = Platform;
})();

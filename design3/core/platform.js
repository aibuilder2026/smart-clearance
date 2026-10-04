/* Smart-Clearance v3 · the platform's mock backend (stands in for the console's own Firestore). Smart-Clearance's staff,
   the agents and connectors it offers, its plans, and every client workspace: supply chain, agents, exits and rules,
   people, integrations, plan and audit log. Munchly Foods is the only client, seeded from the same data as the app.
   Persisted per browser; every change notifies subscribers, and changes to a client write an audit line. */
(function () {
  const D = window.SC3_DATA, M = window.SC3_MONEY, AppStore = window.SC3_STORE;
  const R = M.RULES;
  const KEY = "sc3-platform", VERSION = 1;

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
    { id: "vision", name: "Vision", stage: "verify", icon: "scan-line", model: "Gemini Pro", job: "Reads the label photo from the godown" },
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
      case "watcher": return `daily ${s.time} · Blinkit ${s.blinkitDays}+ days, Zepto and Instamart ${s.qcomPct}% of life`;
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
    const skus = Object.values(D.SKUS).map(s => ({ id: s.id, code: s.code, brand: s.brand, name: s.name, mrp: s.mrp, gst: s.gst, lifeDays: s.lifeDays }));
    const profile = { route: "distributors", owner: "distributor", expiry: "full-credit" };
    const client = {
      id: W.id, name: W.name, legal: D.CLIENT && D.CLIENT.name || "Munchly Foods Ltd", city: "Pune", industry: "Snacks, drinks and personal care", domain: W.domain, emailDomain: W.emailDomain, mark: W.mark,
      plan: "pilot", status: "live", since: W.since, region: W.region, profile, gates: { blinkitDays: R.gates.blinkit.minDays, qcomPct: Math.round(R.gates.zepto.pctLife * 100) },
      territoryGuard: true, returnWindowDays: R.returnWindowDays, exits: exitsFor(profile), rules: { reserve: R.negotiation.reservePerUnit, scheme: "2 free with every 10", staffCap: R.staffCap, tokenPct: Math.round(R.tokenPct * 100), offerWindowHours: app.rules.offerWindowHours, hindiOffers: app.rules.hindiOffers, requirePhoto: app.rules.requirePhoto },
      signIn: W.signIn.map(s => ({ id: s.id, title: s.title, who: s.who, rule: s.rule, on: true })),
      distributors, skus, people, integrations: app.integrations.map(i => ({ id: i.id, name: i.name, kind: i.kind, status: i.status, note: i.note })),
      recovered: D.ACTUAL.net, batches: D.BATCHES.length,
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
    { client: "munchly", batch: "MF-2409-117", sku: "chips", distributor: "rakesh", done: 8, current: 8, note: "Report waits for the return window", money: D.ACTUAL.net },
    { client: "munchly", batch: "MF-2410-118", sku: "mango", distributor: "lakshmi", done: 6, current: 6, split: "1,372 to kiranas · 150 staff sale · 58 food bank" },
  ];
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
  ];

  function seed() {
    return { v: VERSION, clients: [seedMunchly()], staff: STAFF.map(s => Object.assign({ status: "active" }, s)), runs: RUNS.slice(), tracks: TRACKS.slice(), audit: AUDIT.slice(), requests: [], seq: 1, nextAudit: 100 };
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
      territoryGuard: true, returnWindowDays: R.returnWindowDays, exits: exitsFor(profile), rules: { reserve: R.negotiation.reservePerUnit, scheme: "2 free with every 10", staffCap: R.staffCap, tokenPct: Math.round(R.tokenPct * 100), offerWindowHours: 48, hindiOffers: true, requirePhoto: true },
      signIn: [{ id: "google", title: "Google Workspace", who: f.name + " staff", rule: f.emailDomain + " accounts only", on: f.signGoogle }, { id: "phone", title: "Mobile number and a one-time code", who: "Distributors and kirana owners", rule: "Numbers the client or its distributors invite", on: f.signPhone }],
      distributors: [], skus: [], people: [admin], integrations: [], recovered: 0, batches: 0, approver: admin.id,
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
    STAFF, AUTONOMY, AGENTS, STAGE_NAME, FIELDS, PLANS, CONNECTORS, EXITS, PROFILE, PRESETS, seed,
  };
  window.SC3_PLATFORM = Platform;
})();

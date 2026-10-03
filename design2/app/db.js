// Smart-Clearance app v2 · the mock store (stands in for Firestore / Cloud SQL). Seeded, persisted per browser, observable.
// Collections are plain arrays of documents with string ids. Every write bumps a version and notifies subscribers.
(function () {
  const KEY = "sc2-app-db", VERSION = 3;
  const PORTRAITS = "https://raw.githubusercontent.com/aibuilder2026/smart-clearance/main/docs/story-img/";
  const IMG = window.SC2_IMG || "system/img/";
  const now = () => new Date().toISOString();
  const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString();
  const daysOn = n => new Date(Date.now() + n * 864e5);
  const fmtDate = d => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  let seq = 1000; const nid = p => p + "-" + (++seq).toString(36);

  function seed() {
    const users = [
      { id: "u-priya",  name: "Priya Deshmukh", email: "priya.deshmukh@munchly.in", phone: "+91 98230 11201", role: "operator", org: "o-munchly", status: "active", title: "Supply chain lead", provider: "google", avatar: PORTRAITS + "p-priya.jpg", lastSeen: daysAgo(0), createdAt: daysAgo(210), lang: "en", admin: false },
      { id: "u-anita",  name: "Anita Rao", email: "anita.rao@munchly.in", phone: "+91 98230 11202", role: "finance", org: "o-munchly", status: "active", title: "Finance & GST", provider: "google", avatar: PORTRAITS + "p-anita.jpg", lastSeen: daysAgo(1), createdAt: daysAgo(210), lang: "en" },
      { id: "u-vikram", name: "Vikram Sethi", email: "vikram.sethi@munchly.in", phone: "+91 98230 11203", role: "sustainability", org: "o-munchly", status: "active", title: "Sustainability", provider: "google", avatar: PORTRAITS + "p-vikram.jpg", lastSeen: daysAgo(2), createdAt: daysAgo(190), lang: "en" },
      { id: "u-arjun",  name: "Arjun Nair", email: "arjun.nair@munchly.in", phone: "+91 98230 11200", role: "admin", org: "o-munchly", status: "active", title: "Platform admin", provider: "google", avatar: PORTRAITS + "p-arjun.jpg", lastSeen: daysAgo(0), createdAt: daysAgo(240), lang: "en", admin: true },
      { id: "u-rakesh", name: "Rakesh Sharma", email: "", phone: "+91 98230 44118", role: "distributor", org: "o-rakesh", status: "active", title: "Owner", provider: "phone", avatar: PORTRAITS + "p-rakesh.jpg", lastSeen: daysAgo(0), createdAt: daysAgo(160), lang: "hi" },
      { id: "u-ganesh", name: "Ganesh Patil", email: "", phone: "+91 98230 55120", role: "retailer", org: "o-ganesh", status: "active", title: "Owner", provider: "phone", avatar: PORTRAITS + "p-ganesh.jpg", lastSeen: daysAgo(1), createdAt: daysAgo(120), lang: "hi" },
      { id: "u-venkat", name: "Venkat Reddy", email: "venkat@svtraders.in", phone: "+91 98480 22310", role: "buyer", org: "o-svt", status: "active", title: "Proprietor", provider: "expiresoon", avatar: PORTRAITS + "p-venkat.jpg", lastSeen: daysAgo(3), createdAt: daysAgo(90), lang: "en" },
      { id: "u-meera",  name: "Meera Iyer", email: "meera@feedingindia.org", phone: "+91 98480 77001", role: "foodbank", org: "o-fi", status: "active", title: "City lead, Hyderabad", provider: "google", avatar: PORTRAITS + "p-meera.jpg", lastSeen: daysAgo(6), createdAt: daysAgo(80), lang: "en" },
      { id: "u-sunil",  name: "Sunil Lakshmi", email: "", phone: "+91 98480 10550", role: "distributor", org: "o-lakshmi", status: "active", title: "Owner", provider: "phone", avatar: null, lastSeen: daysAgo(2), createdAt: daysAgo(140), lang: "te" },
      { id: "u-pawan",  name: "Pawan Sai", email: "", phone: "+91 98260 31010", role: "distributor", org: "o-srisai", status: "invited", title: "Owner", provider: "phone", avatar: null, lastSeen: null, createdAt: daysAgo(4), lang: "hi" },
      { id: "u-durga",  name: "Jai Durga Stores", email: "", phone: "+91 98230 60011", role: "retailer", org: "o-durga", status: "active", title: "Owner", provider: "phone", avatar: null, lastSeen: daysAgo(1), createdAt: daysAgo(100), lang: "mr" },
      { id: "u-balaji", name: "Balaji General Store", email: "", phone: "+91 98230 60012", role: "retailer", org: "o-balaji", status: "deactivated", title: "Owner", provider: "phone", avatar: null, lastSeen: daysAgo(40), createdAt: daysAgo(100), lang: "mr" },
      { id: "u-neha",   name: "Neha Kulkarni", email: "neha.kulkarni@munchly.in", phone: "+91 98230 11210", role: "operator", org: "o-munchly", status: "invited", title: "Supply chain analyst", provider: "google", avatar: null, lastSeen: null, createdAt: daysAgo(1), lang: "en" },
    ];
    const orgs = [
      { id: "o-munchly", name: "Munchly Foods", kind: "brand", city: "Pune", gstin: "27AADCM1234K1Z8", contact: "u-priya", since: daysAgo(240) },
      { id: "o-rakesh", name: "Rakesh Traders", kind: "distributor", city: "Nagpur", gstin: "27AABCR1234F1Z5", contact: "u-rakesh", since: daysAgo(160), godown: "Kalamna Market", pincodes: ["440008", "440002", "440018"] },
      { id: "o-lakshmi", name: "Lakshmi Agencies", kind: "distributor", city: "Hyderabad", gstin: "36AAACL5678P1Z1", contact: "u-sunil", since: daysAgo(140), godown: "Begum Bazaar", pincodes: ["500012", "500001"] },
      { id: "o-srisai", name: "Sri Sai Distributors", kind: "distributor", city: "Indore", gstin: "23AABCS9999Q1Z3", contact: "u-pawan", since: daysAgo(4), godown: "Siyaganj", pincodes: ["452007"] },
      { id: "o-ganesh", name: "Shree Ganesh Kirana", kind: "retailer", city: "Itwari, Nagpur", contact: "u-ganesh", since: daysAgo(120), cluster: "Nagpur East" },
      { id: "o-durga", name: "Jai Durga Stores", kind: "retailer", city: "Kamptee Rd, Nagpur", contact: "u-durga", since: daysAgo(100), cluster: "Nagpur East" },
      { id: "o-balaji", name: "Balaji General Store", kind: "retailer", city: "Sadar, Nagpur", contact: "u-balaji", since: daysAgo(100), cluster: "Nagpur East" },
      { id: "o-svt", name: "Sri Venkateswara Traders", kind: "buyer", city: "Hyderabad", gstin: "36AAACS9876K1Z2", contact: "u-venkat", since: daysAgo(90), marketplace: "ExpireSoon" },
      { id: "o-fi", name: "Feeding India", kind: "foodbank", city: "Hyderabad", contact: "u-meera", since: daysAgo(80) },
    ];
    const products = [
      { id: "chips", name: "Munchly Masala Chips 150 g", brand: "MUNCHLY", sku: "MF-MC-150", hsn: "2005", perCarton: 24, mrp: 30, cost: 16, gst: 12, life: 180, kgPerCarton: 3.84, plate: IMG + "plate-chips.webp" },
      { id: "biscuit", name: "Munchly Choco Cream Biscuits 200 g", brand: "MUNCHLY", sku: "MF-CB-200", hsn: "1905", perCarton: 24, mrp: 40, cost: 22, gst: 18, life: 270, kgPerCarton: 5.1 },
      { id: "poha", name: "Munchly Instant Poha 250 g", brand: "MUNCHLY", sku: "MF-IP-250", hsn: "1904", perCarton: 20, mrp: 55, cost: 31, gst: 5, life: 365, kgPerCarton: 5.3 },
      { id: "mango", name: "Munchly Mango Drink 200 ml", brand: "MUNCHLY", sku: "MF-MD-200", hsn: "2202", perCarton: 27, mrp: 20, cost: 11, gst: 12, life: 180, kgPerCarton: 5.9, plate: IMG + "plate-mango.webp" },
      { id: "facewash", name: "Glowra Aloe Face Wash 100 ml", brand: "GLOWRA", sku: "GL-AF-100", hsn: "3304", perCarton: 12, mrp: 120, cost: 58, gst: 18, life: 730, kgPerCarton: 1.5 },
      { id: "oil", name: "Glowra Coconut Hair Oil 200 ml", brand: "GLOWRA", sku: "GL-CO-200", hsn: "3305", perCarton: 12, mrp: 150, cost: 72, gst: 18, life: 730, kgPerCarton: 2.7 },
      { id: "namkeen", name: "Munchly Aloo Bhujia 200 g", brand: "MUNCHLY", sku: "MF-AB-200", hsn: "2106", perCarton: 24, mrp: 45, cost: 24, gst: 12, life: 240, kgPerCarton: 5.2 },
    ];
    const B = (id, product, cartons, days, org, sell, extra) => { const p = products.find(x => x.id === product); return Object.assign({ id, product, cartons, packets: cartons * p.perCarton, daysLeft: days, bestBefore: fmtDate(daysOn(days)), org, sellPerDay: sell, status: "watching", photo: { status: "none" }, createdAt: daysAgo(30), updatedAt: daysAgo(0) }, extra || {}); };
    const batches = [
      B("MF-2409-117", "chips", 77, 47, "o-rakesh", 12, { status: "at_risk", atRisk: 1360, binCost: 27717, shelf: "B3 to B5", mfg: "18 May 2026", gates: { blinkit: false, zepto: false, instamart: false } }),
      B("MF-2410-118", "mango", 74, 22, "o-lakshmi", 40, { status: "executing", atRisk: 1580, binCost: 17380, photo: { status: "verified", at: daysAgo(3) }, routed: "51 cartons to shops · 150 packs staff · 58 packs Feeding India" }),
      B("MF-2408-209", "chips", 43, 74, "o-srisai", 22, { status: "watching", gates: { blinkit: false, zepto: false, instamart: false } }),
      B("MF-2409-301", "poha", 60, 96, "o-lakshmi", 30, { status: "watching", gates: { blinkit: true, zepto: false, instamart: false } }),
      B("MF-2410-022", "biscuit", 140, 131, "o-rakesh", 90, { status: "watching", gates: { blinkit: true, zepto: true, instamart: true } }),
      B("GL-2407-044", "facewash", 30, 290, "o-rakesh", 6, { status: "watching", gates: { blinkit: true, zepto: true, instamart: true } }),
      B("GL-2406-012", "oil", 18, 322, "o-srisai", 4, { status: "watching", gates: { blinkit: true, zepto: true, instamart: true } }),
      B("MF-2408-077", "namkeen", 52, 61, "o-rakesh", 18, { status: "watching", gates: { blinkit: false, zepto: false, instamart: false } }),
      B("MF-2407-410", "chips", 36, 9, "o-lakshmi", 15, { status: "cleared", photo: { status: "verified", at: daysAgo(21) }, closedAt: daysAgo(14), recovered: 9860, kg: 138.2 }),
      B("MF-2406-233", "biscuit", 80, 0, "o-srisai", 20, { status: "written_off", closedAt: daysAgo(35), binCost: 21120, note: "Distributor missed the photo window; stock destroyed with EPR certificate." }),
      B("MF-2408-150", "mango", 120, 38, "o-lakshmi", 60, { status: "cleared", photo: { status: "verified", at: daysAgo(12) }, closedAt: daysAgo(6), recovered: 15400, kg: 708 }),
      B("MF-2409-005", "namkeen", 44, 103, "o-lakshmi", 25, { status: "watching", gates: { blinkit: true, zepto: false, instamart: false } }),
    ];
    const shopNames = [["Shree Ganesh Kirana", "Itwari", 24], ["Jai Durga Stores", "Kamptee Rd", 48], ["Balaji General Store", "Sadar", 24], ["Om Sai Provision", "Wardha Rd", 36], ["Maa Bhavani Kirana", "Itwari", 24], ["New Sagar Stores", "Kamptee Rd", 60], ["Gurukripa Traders", "Mahal", 48], ["Mahalaxmi Kirana", "Sitabuldi", 24], ["Shiv Shakti Store", "Wardha Rd", 36], ["Patel Provision", "Dharampeth", 48], ["Annapurna Stores", "Sadar", 24], ["Sahyog Kirana", "Kamptee Rd", 72], ["Raj Super Mart", "Mahal", 60], ["Vaishnavi Stores", "Itwari", 60]];
    const shops = shopNames.map(([name, area, qty], i) => ({ id: "shop-" + i, name, area, cluster: "Nagpur East", typicalQty: qty, phone: "+91 98230 6" + String(100 + i).padStart(4, "0") }));
    const orders = [
      { id: "ord-1001", type: "shop", batch: "MF-2410-118", party: "Begum Bazaar cluster (51 cartons across 23 shops)", qty: 1377, price: 12, status: "delivered", at: daysAgo(2), org: "o-lakshmi" },
      { id: "ord-1002", type: "staff", batch: "MF-2410-118", party: "Munchly staff sale, Pune", qty: 150, price: 10, status: "delivered", at: daysAgo(2), org: "o-munchly" },
      { id: "ord-1003", type: "donation", batch: "MF-2410-118", party: "Feeding India, Hyderabad", qty: 58, price: 0, status: "collected", at: daysAgo(1), org: "o-fi" },
      { id: "ord-0931", type: "online", batch: "MF-2407-410", party: "Sri Venkateswara Traders", qty: 600, price: 13.5, status: "paid", at: daysAgo(18), org: "o-svt" },
      { id: "ord-0870", type: "shop", batch: "MF-2408-150", party: "Begum Bazaar cluster", qty: 2400, price: 12.5, status: "delivered", at: daysAgo(8), org: "o-lakshmi" },
    ];
    const listings = [
      { id: "ES-88190", batch: "MF-2407-410", marketplace: "ExpireSoon", qty: 600, price: 14, floor: 13, status: "awarded", awardedTo: "o-svt", awardedPrice: 13.5, at: daysAgo(20) },
    ];
    const bids = [{ id: "bid-1", listing: "ES-88190", by: "o-svt", price: 13, status: "countered", counter: 13.5, at: daysAgo(19) }];
    const shipments = [
      { id: "round-0929", kind: "van", org: "o-lakshmi", batch: "MF-2408-150", label: "Thursday round · Begum Bazaar", stops: 23, done: 23, status: "done", at: daysAgo(7) },
      { id: "truck-0918", kind: "truck", org: "o-lakshmi", batch: "MF-2407-410", label: "Hyderabad → Hyderabad (buyer pickup)", stops: 1, done: 1, status: "done", at: daysAgo(16) },
    ];
    const documents = [
      { id: "INV/26-27/0870", type: "invoice", batch: "MF-2407-410", title: "Tax invoice", total: 9072, status: "issued", at: daysAgo(16), org: "o-lakshmi" },
      { id: "CN/0098", type: "credit_note", batch: "MF-2408-150", title: "Credit note", total: 2240, status: "issued", at: daysAgo(6), org: "o-munchly" },
      { id: "ITC/0098", type: "itc_memo", batch: "MF-2408-150", title: "GST ITC memo", total: 2772, status: "issued", at: daysAgo(6), org: "o-munchly" },
      { id: "FSSAI/0118", type: "fssai", batch: "MF-2410-118", title: "FSSAI surplus checklist", total: 0, status: "issued", at: daysAgo(1), org: "o-munchly" },
      { id: "EWB/0118", type: "eway", batch: "MF-2410-118", title: "E-way bill check", total: 0, status: "not_required", at: daysAgo(1), org: "o-munchly" },
    ];
    const ledger = [
      { id: "led-410", batch: "MF-2407-410", recovered: 9860, writeoffAvoided: 9600, itc: 1152, disposalAvoided: 1540, kg: 138.2, co2: 0.26, meals: 0, closedAt: daysAgo(14) },
      { id: "led-150", batch: "MF-2408-150", recovered: 15400, writeoffAvoided: 15800, itc: 2772, disposalAvoided: 2900, kg: 708, co2: 1.1, meals: 0, closedAt: daysAgo(6) },
      { id: "led-118", batch: "MF-2410-118", recovered: 17900, writeoffAvoided: 17380, itc: 2640, disposalAvoided: 3100, kg: 436.6, co2: 0.7, meals: 290, closedAt: null },
    ];
    const notifications = [
      { id: "n-1", user: "u-priya", title: "Masala Chips 150 g · Nagpur", body: "57 cartons (1,360 packets) won't sell before 18 Nov. Blinkit, Zepto and Instamart have all stopped taking the batch.", at: daysAgo(0), read: false, link: "batches/MF-2409-117" },
      { id: "n-2", user: "u-priya", title: "Mango Drink · Hyderabad", body: "51 cartons delivered to shops, 58 packs collected by Feeding India. Documents issued.", at: daysAgo(1), read: true, link: "batches/MF-2410-118" },
      { id: "n-3", user: "u-arjun", title: "New distributor invited", body: "Sri Sai Distributors (Pawan Sai) invited by Priya Deshmukh. Phone OTP sign-in.", at: daysAgo(4), read: false, link: "admin/users" },
      { id: "n-4", user: "u-anita", title: "Documents issued · MF-2410-118", body: "FSSAI checklist and e-way bill check filed for the Mango Drink batch.", at: daysAgo(1), read: false, link: "documents" },
      { id: "u-vikram-1", user: "u-vikram", title: "Ledger row · MF-2408-150", body: "708 kg kept out of landfill with invoices behind every kilo.", at: daysAgo(6), read: true, link: "impact" },
    ];
    const audit = [
      { id: "a-1", who: "u-priya", what: "approved plan", target: "MF-2408-150", at: daysAgo(10), device: "phone" },
      { id: "a-2", who: "u-arjun", what: "changed role", target: "u-neha → operator", at: daysAgo(1), device: "desktop" },
      { id: "a-3", who: "u-priya", what: "invited user", target: "u-pawan", at: daysAgo(4), device: "desktop" },
      { id: "a-4", who: "u-arjun", what: "deactivated user", target: "u-balaji", at: daysAgo(40), device: "desktop" },
      { id: "a-5", who: "u-anita", what: "issued document", target: "CN/0098", at: daysAgo(6), device: "desktop" },
      { id: "a-6", who: "system", what: "watcher run", target: "312 batches · 1 flagged", at: daysAgo(0), device: "cloud-run" },
      { id: "a-7", who: "u-arjun", what: "updated rule", target: "floor price 35% of MRP", at: daysAgo(12), device: "desktop" },
    ];
    const rules = { id: "rules", watchTime: "09:00", timezone: "Asia/Kolkata", gates: { blinkit: 90, zepto: 0.6, instamart: 0.6 }, floorPctMrp: 35, caps: { shops: 24.5, d2c: 6, staff: 6 }, autoApproveUnder: 0, requirePhoto: true, hindiOffers: true, offerWindowHours: 48, tokenPct: 15 };
    const integrations = [
      { id: "erp", name: "SAP B1 (Munchly ERP)", kind: "ERP / DMS", status: "ok", lastSync: daysAgo(0), detail: "Stock and sell-through by pincode, nightly" },
      { id: "fcm", name: "Firebase Cloud Messaging", kind: "Push", status: "ok", lastSync: daysAgo(0), detail: "Web push to every role" },
      { id: "auth", name: "Firebase Auth", kind: "Identity", status: "ok", lastSync: daysAgo(0), detail: "Google for staff, phone OTP for the trade" },
      { id: "gemini", name: "Gemini on Vertex AI", kind: "Vision & agents", status: "ok", lastSync: daysAgo(0), detail: "Label reading, valuation, negotiation" },
      { id: "expiresoon", name: "ExpireSoon API", kind: "Marketplace", status: "degraded", lastSync: daysAgo(0.3), detail: "Sandbox; listing endpoint slow since 06:10" },
      { id: "gst", name: "GST Suvidha Provider", kind: "Tax", status: "ok", lastSync: daysAgo(1), detail: "E-way bill check, GSTR-3B reconciliation" },
      { id: "pubsub", name: "Cloud Pub/Sub", kind: "Events", status: "ok", lastSync: daysAgo(0), detail: "14 topics · agents on Cloud Run" },
      { id: "feedingindia", name: "Feeding India", kind: "Food bank", status: "manual", lastSync: daysAgo(1), detail: "Pickup booked by email; API in talks" },
    ];
    const events = [{ id: "e-1", topic: "watcher.run", payload: { checked: 312, flagged: ["MF-2409-117"] }, at: daysAgo(0) }];
    return { v: VERSION, users, orgs, products, batches, shops, orders, listings, bids, shipments, documents, ledger, notifications, audit, rules, integrations, events, plans: [], offers: [] };
  }

  let data = null, listeners = new Set(), version = 0;
  function load() { try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); if (d && d.v === VERSION) return d; } } catch (e) {} return seed(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
  function emit() { version++; listeners.forEach(fn => { try { fn(version); } catch (e) {} }); }
  data = load();

  const DB = {
    get version() { return version; },
    all: coll => data[coll] || [],
    get: (coll, id) => (data[coll] || []).find(d => d.id === id) || null,
    rules: () => data.rules,
    list(coll, opts = {}) {
      let rows = (data[coll] || []).slice();
      if (opts.where) rows = rows.filter(r => Object.entries(opts.where).every(([k, v]) => typeof v === "function" ? v(r[k], r) : Array.isArray(v) ? v.includes(r[k]) : r[k] === v));
      if (opts.search) { const q = opts.search.toLowerCase(); rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(q)); }
      if (opts.sort) { const [k, dir] = opts.sort; rows.sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (dir === "desc" ? -1 : 1)); }
      if (opts.limit) rows = rows.slice(0, opts.limit);
      return rows;
    },
    insert(coll, doc) { if (!data[coll]) data[coll] = []; const d = Object.assign({ id: nid(coll.slice(0, 3)), createdAt: now() }, doc); data[coll].unshift(d); save(); emit(); return d; },
    update(coll, id, patch) { const rows = data[coll] || []; const i = rows.findIndex(d => d.id === id); if (i < 0) return null; rows[i] = Object.assign({}, rows[i], typeof patch === "function" ? patch(rows[i]) : patch, { updatedAt: now() }); save(); emit(); return rows[i]; },
    remove(coll, id) { const rows = data[coll] || []; const i = rows.findIndex(d => d.id === id); if (i < 0) return false; rows.splice(i, 1); save(); emit(); return true; },
    setRules(patch) { data.rules = Object.assign({}, data.rules, patch); save(); emit(); return data.rules; },
    audit(who, what, target, device) { return DB.insert("audit", { who: who || "system", what, target, at: now(), device: device || (window.innerWidth < 760 ? "phone" : "desktop") }); },
    notify(user, n) { return DB.insert("notifications", Object.assign({ user, read: false, at: now() }, n)); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { data = seed(); save(); emit(); },
    export() { return JSON.stringify(data, null, 1); },
    product: id => data.products.find(p => p.id === id),
    org: id => data.orgs.find(o => o.id === id),
    user: id => data.users.find(u => u.id === id),
    counts() { const b = data.batches; return { batches: b.length, atRisk: b.filter(x => x.status === "at_risk").length, executing: b.filter(x => ["approved", "executing"].includes(x.status)).length, cleared: b.filter(x => x.status === "cleared").length, users: data.users.length, invited: data.users.filter(u => u.status === "invited").length }; },
    fmtDate, daysAgo, now, PORTRAITS, IMG,
  };
  window.DB = DB;
})();

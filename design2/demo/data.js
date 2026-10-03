// Smart-Clearance demo v2 · demo data set (synthetic; Munchly Foods, Glowra, ExpireSoon and the people are fictional).
(function () {
  const PORTRAITS = "https://raw.githubusercontent.com/aibuilder2026/smart-clearance/main/docs/story-img/";
  const IMG = window.SC2_IMG || "system/img/";
  const people = {
    priya:  { id: "priya",  name: "Priya Deshmukh", short: "Priya",       role: "Supply chain · Munchly Foods", place: "Pune",           img: PORTRAITS + "p-priya.jpg",  emblem: IMG + "emblem-rooster.webp", tone: "chrome" },
    rakesh: { id: "rakesh", name: "Rakesh Sharma",  short: "Rakesh bhai", role: "Rakesh Traders · distributor", place: "Nagpur",         img: PORTRAITS + "p-rakesh.jpg", emblem: IMG + "emblem-van.webp", tone: "kraft" },
    ganesh: { id: "ganesh", name: "Ganesh Patil",   short: "Ganesh ji",   role: "Shree Ganesh Kirana · retailer", place: "Itwari, Nagpur", img: PORTRAITS + "p-ganesh.jpg", emblem: IMG + "emblem-shop.webp", tone: "vermilion" },
    venkat: { id: "venkat", name: "Venkat Reddy",   short: "Venkat",      role: "Sri Venkateswara Traders · buyer", place: "Hyderabad",   img: PORTRAITS + "p-venkat.jpg", emblem: IMG + "emblem-ship.webp", tone: "violet" },
    anita:  { id: "anita",  name: "Anita Rao",      short: "Anita",       role: "Finance & GST · Munchly Foods", place: "Pune",          img: PORTRAITS + "p-anita.jpg",  emblem: IMG + "emblem-ledger.webp", tone: "ultra" },
    vikram: { id: "vikram", name: "Vikram Sethi",   short: "Vikram",      role: "Sustainability · Munchly Foods", place: "Pune",         img: PORTRAITS + "p-vikram.jpg", emblem: IMG + "emblem-tree.webp", tone: "emerald" },
    meera:  { id: "meera",  name: "Meera Iyer",     short: "Meera",       role: "Feeding India · Hyderabad", place: "Hyderabad",          img: PORTRAITS + "p-meera.jpg",  emblem: IMG + "emblem-sun.webp", tone: "chrome" },
  };
  const roles = [
    { id: "brand",       who: "priya",  label: "Brand",            signin: "Google · brand",          nav: [{ id: "board", label: "Sheet", icon: "sheet" }, { id: "inbox", label: "Inbox", icon: "bell" }, { id: "paperwork", label: "Papers", icon: "file" }, { id: "ledger", label: "Ledger", icon: "chart" }] },
    { id: "distributor", who: "rakesh", label: "Distributor",      signin: "Phone OTP · distributor", nav: [{ id: "home", label: "Home", icon: "home" }, { id: "photo", label: "Photo", icon: "camera" }, { id: "route", label: "Van", icon: "truck" }, { id: "orders", label: "Orders", icon: "store" }] },
    { id: "retailer",    who: "ganesh", label: "Retailer",         signin: "Phone OTP · retailer",    nav: [{ id: "offers", label: "Offers", icon: "tag" }, { id: "myorders", label: "Orders", icon: "store" }, { id: "inbox", label: "Inbox", icon: "bell" }] },
    { id: "buyer",       who: "venkat", label: "ExpireSoon buyer", signin: "ExpireSoon account (mock)", nav: [{ id: "listing", label: "Listing", icon: "tag" }, { id: "bids", label: "My bids", icon: "chat" }] },
    { id: "finance",     who: "anita",  label: "Finance",          signin: "Google · finance",        nav: [{ id: "paperwork", label: "Papers", icon: "file" }, { id: "ledger", label: "Ledger", icon: "chart" }, { id: "inbox", label: "Inbox", icon: "bell" }] },
    { id: "esg",         who: "vikram", label: "Sustainability",   signin: "Google · sustainability", nav: [{ id: "impact", label: "Impact", icon: "leaf" }, { id: "ledger", label: "Ledger", icon: "chart" }, { id: "inbox", label: "Inbox", icon: "bell" }] },
  ];
  const products = {
    chips:   { name: "Munchly Masala Chips 150 g", brand: "MUNCHLY", plate: IMG + "plate-chips.webp", perCarton: 24, mrp: 30, cost: 16, gst: 12, life: 180, kgPerCarton: 3.84 },
    biscuit: { name: "Munchly Choco Cream Biscuits 200 g", brand: "MUNCHLY", perCarton: 24, mrp: 40, cost: 22, gst: 18, life: 270 },
    poha:    { name: "Munchly Instant Poha 250 g", brand: "MUNCHLY", perCarton: 20, mrp: 55, cost: 31, gst: 5, life: 365 },
    mango:   { name: "Munchly Mango Drink 200 ml", brand: "MUNCHLY", plate: IMG + "plate-mango.webp", perCarton: 27, mrp: 20, cost: 11, gst: 12, life: 180 },
    facewash:{ name: "Glowra Aloe Face Wash 100 ml", brand: "GLOWRA", perCarton: 12, mrp: 120, cost: 58, gst: 18, life: 730 },
    oil:     { name: "Glowra Coconut Hair Oil 200 ml", brand: "GLOWRA", perCarton: 12, mrp: 150, cost: 72, gst: 18, life: 730 },
  };
  // states by days left (6-month product: Zepto and Instamart want 60% of life = 108 d; Blinkit wants 90 d)
  const zones = [
    { id: "risk",    label: "At risk",         rule: "will not sell out in time · act now" },
    { id: "blinkit", label: "No app takes it", rule: "60 to 89 days · selling through local shops" },
    { id: "zepto",   label: "Blinkit only",    rule: "90 to 107 days · Zepto and Instamart gate closed" },
    { id: "safe",    label: "Safe",            rule: "108+ days · every app takes it" },
    { id: "cleared", label: "Cleared",         rule: "routed by Smart-Clearance · moving" },
  ];
  const batches = [
    { id: "MF-2409-117", sku: "chips",   cartons: 77,  packets: 1840, days: 47,  where: "Rakesh Traders · Nagpur",      sell: 12, atRisk: 1360, binCost: 27717, zone: "risk", hero: true, bestBefore: "18 Nov 2026", mfg: "18 May 2026", shelf: "B3 to B5, Kalamna Market" },
    { id: "MF-2410-118", sku: "mango",   cartons: 74,  packets: 2000, days: 22,  where: "Lakshmi Agencies · Hyderabad",  sell: 40, atRisk: 1580, binCost: 17380, zone: "cleared", routed: "51 cartons to shops · 150 packs staff · 58 packs Feeding India", bestBefore: "24 Oct 2026" },
    { id: "MF-2408-209", sku: "chips",   cartons: 43,  packets: 1032, days: 74,  where: "Sri Sai Distributors · Indore", sell: 22, zone: "blinkit", bestBefore: "15 Dec 2026" },
    { id: "MF-2409-301", sku: "poha",    cartons: 60,  packets: 1200, days: 96,  where: "Lakshmi Agencies · Hyderabad",  sell: 30, zone: "zepto", bestBefore: "6 Jan 2027" },
    { id: "MF-2410-022", sku: "biscuit", cartons: 140, packets: 3360, days: 131, where: "Rakesh Traders · Nagpur",       sell: 90, zone: "safe", bestBefore: "10 Feb 2027" },
    { id: "GL-2407-044", sku: "facewash",cartons: 30,  packets: 360,  days: 290, where: "Rakesh Traders · Nagpur",       sell: 6,  zone: "safe", bestBefore: "18 Jul 2027" },
    { id: "GL-2406-012", sku: "oil",     cartons: 18,  packets: 216,  days: 322, where: "Sri Sai Distributors · Indore", sell: 4,  zone: "safe", bestBefore: "19 Aug 2027" },
  ];
  const gates = [
    { app: "Blinkit",   rule: "needs 90 days",  has: 47, ok: false },
    { app: "Zepto",     rule: "needs 108 days (60% of life)", has: 47, ok: false },
    { app: "Instamart", rule: "needs 108 days", has: 47, ok: false },
  ];
  const doors = [
    { id: "shops",  short: "SHOPS",      name: "Local kirana shops", net: 420, rule: "₹18 a packet, less ₹12 van delivery · 20+ days · cap 24½ cartons", pick: true, cls: "sel" },
    { id: "online", short: "EXPIRESOON", name: "ExpireSoon marketplace", net: 360, rule: "₹15 a packet, no cap · 30+ days", pick: true, cls: "es" },
    { id: "d2c",    short: "D2C",        name: "Brand's own site", net: 288, rule: "₹15 a packet, less ₹72 courier · 25+ days · cap 6 cartons" },
    { id: "staff",  short: "STAFF",      name: "Staff sale", net: 288, rule: "₹12 a packet · cap 6 cartons" },
    { id: "bank",   short: "FOOD BANK",  name: "Feeding India", net: -12, rule: "freight only · meals, not rupees · 15+ days", cls: "fb" },
    { id: "bin",    short: "THE BIN",    name: "Write off", net: -489, rule: "stock + GST credit back + disposal + packaging · never free", cls: "bin" },
  ];
  const plan = {
    shops:  { packets: 588, cartons: "24½", price: 18, gross: 10584, shopsCount: 14 },
    online: { packets: 772, cartons: "32 + 4", price: 15, floor: 14, gross: 11580 },
    costs: 394, net: 21770, pctMrp: 54, bin: 27717, swing: 49487, itc: 2611, alt: { label: "all 57 cartons online", net: 20300 },
    actualOnline: { price: 14.2, gross: 10962, token: 1644, balance: 9318 }, actualNet: 21222,
  };
  const shops = [
    ["Shree Ganesh Kirana", "Itwari", 24], ["Jai Durga Stores", "Kamptee Rd", 48], ["Balaji General Store", "Sadar", 24], ["Om Sai Provision", "Wardha Rd", 36],
    ["Maa Bhavani Kirana", "Itwari", 24], ["New Sagar Stores", "Kamptee Rd", 60], ["Gurukripa Traders", "Mahal", 48], ["Mahalaxmi Kirana", "Sitabuldi", 24],
    ["Shiv Shakti Store", "Wardha Rd", 36], ["Patel Provision", "Dharampeth", 48], ["Annapurna Stores", "Sadar", 24], ["Sahyog Kirana", "Kamptee Rd", 72],
    ["Raj Super Mart", "Mahal", 60], ["Vaishnavi Stores", "Itwari", 60],
  ].map(([name, area, packets], i) => ({ id: "s" + i, name, area, packets, at: ["09:52", "09:58", "10:04", "10:11", "10:19", "10:26", "10:33", "10:41", "10:55", "11:02", "11:14", "11:27", "11:38", "11:50"][i] }));
  const chat = [
    { from: "venkat", text: "₹13 a packet for all 772?", at: "11:02" },
    { from: "agent",  text: "₹14.20, Nagpur stock, dispatch within 24 hours of the balance.", at: "Negotiator agent as Rakesh Traders · 11:03" },
    { from: "venkat", text: "Done. Token paid.", at: "11:09" },
  ];
  const docs = [
    { id: "invoice", title: "Tax invoice", short: "INVOICE", no: "INV/26-27/0931", lines: ["Rakesh Traders, Nagpur → Sri Venkateswara Traders, Hyderabad", "772 × Masala Chips 150 g at ₹14.20 · HSN 2005", "Taxable ₹10,962 · IGST 12% ₹1,315"], total: "₹12,277", status: "generated" },
    { id: "creditnote", title: "Credit note", short: "CREDIT NOTE", no: "CN/0117", lines: ["Munchly Foods → Rakesh Traders", "Shop scheme: 98 free packets × ₹16", "Against INV 0931 · GST adjusted"], total: "₹1,568", status: "generated" },
    { id: "eway", title: "E-way bill check", short: "E-WAY BILL", no: "MF-2409-117", lines: ["Consignment value ₹12,277", "Inter-state threshold ₹50,000", "Transporter note filed"], total: "Not required", status: "not required" },
    { id: "itc", title: "GST ITC memo", short: "ITC MEMO", no: "s.17(5)(h) · indicative", lines: ["1,360 packets sold, not destroyed", "Input credit on stock retained", "No reversal in GSTR-3B"], total: "₹2,611 kept", status: "generated" },
    { id: "fssai", title: "FSSAI surplus checklist", short: "FSSAI", no: "Mango Drink · Feeding India", lines: ["Packed food, 22 days to date", "Cold chain not required", "Pickup Tue 10:00, Begum Bazaar"], total: "Attached", status: "generated" },
  ];
  const ledger = {
    batch: [
      ["Recovered (net of costs)", "₹21,222", "pos"], ["Write-off avoided", "₹21,760", "pos"], ["GST input credit retained (indicative)", "₹2,611", "pos"], ["Disposal and EPR charge avoided", "₹3,346", "pos"],
      ["Kept out of landfill", "217.6 kg", ""], ["CO₂e avoided (packaging + food waste factors)", "0.41 t", ""], ["Meals (food bank, this batch)", "0", ""],
    ],
    quarter: { recovered: 630000, itc: 79000, waste: 5.7, meals: 3700, batches: 23 },
    brsr: [
      ["Plastic waste (packaging)", "0.86 t", "0.00 t", "0.86 t", "invoices, listing, shop orders"],
      ["Food waste (expired FMCG)", "4.84 t", "0.00 t", "4.84 t", "ledger, food-bank receipts"],
      ["Other non-hazardous", "0.00 t", "0.00 t", "0.00 t", ""],
    ],
  };
  // minutes: time since the previous entry (the timeline draws gaps to scale)
  const timeline = [
    { id: "watch",  who: "Watcher",    text: "312 batches checked against app gates and sell-through; MF-2409-117 fails both", at: "Day 0 · 09:00", stage: 1, minutes: 0 },
    { id: "photo",  who: "Vision",     text: "label photo from Rakesh bhai read: batch, dates, MRP match records", at: "09:20", stage: 2, minutes: 20 },
    { id: "value",  who: "Valuer",     text: "six doors priced per carton; the bin costs ₹489", at: "09:21", stage: 3, minutes: 1 },
    { id: "route",  who: "Router",     text: "shops filled to cap (588), remainder online (772); net ₹21,770", at: "09:22", stage: 3, minutes: 1 },
    { id: "gate",   who: "Priya",      text: "approved from her phone", at: "09:40", stage: 4, human: true, minutes: 18 },
    { id: "list",   who: "Lister",     text: "ExpireSoon listing posted · 201 Created", at: "09:41", stage: 5, minutes: 1 },
    { id: "push",   who: "Outreach",   text: "Hindi scheme pushed to 38 shops; 14 orders by lunch", at: "09:41", stage: 5, minutes: 0 },
    { id: "nego",   who: "Negotiator", text: "bid ₹13 countered at ₹14.20; accepted, token ₹1,644", at: "11:09", stage: 6, minutes: 88 },
    { id: "ship",   who: "Rakesh bhai",text: "Tuesday round: 14 drops; Hyderabad lot on the truck Thursday", at: "Day 1 to 3", stage: 7, human: true, minutes: 1440 },
    { id: "paper",  who: "Paperwork",  text: "invoice, credit note, e-way bill check, ITC memo ready", at: "Day 3", stage: 8, minutes: 2880 },
    { id: "impact", who: "Impact",     text: "217.6 kg and ₹21,222 posted to the ledger; BRSR row written", at: "Day 3", stage: 9, minutes: 30 },
  ];
  const strings = {
    offerHindi: "आज का ऑफर: Munchly Masala Chips 150 g, 10 पैकेट लो, 2 मुफ़्त. सिर्फ़ 48 घंटे.",
    photoHindi: "Rakesh bhai, ek photo chahiye: Masala Chips 150 g, batch MF-2409-117, carton ka label. Bas ek.",
    tagline: "Every carton gets a second chance, chosen by AI.", hindiTag: "हर कार्टन को दूसरा मौका",
  };
  window.SC_DATA = { PORTRAITS, IMG, CARTON_PHOTO: PORTRAITS + "01-carton.jpg", people, roles, products, zones, batches, gates, doors, plan, shops, chat, docs, ledger, timeline, strings };
})();

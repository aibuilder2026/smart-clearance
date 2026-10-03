/* Smart-Clearance v3 · the demo dataset. Facts come from docs/dobara-journey-map.html (solution v4, signed off
   2 Oct 2026) and the walkthrough; Munchly Foods, Glowra, ExpireSoon and every person here are fictional.
   Money is never typed here: it is computed by money.js from these inputs. */
(function () {
  const M = window.SC3_MONEY;
  const IMG = (window.SC3_IMG || "system/img/");
  const PEOPLE_IMG = IMG + "people/";

  const CLIENT = {
    name: "Munchly Foods Pvt Ltd", short: "Munchly Foods", city: "Pune", listed: "NSE", gstin: "27AABCM1234F1Z5", fssai: "10019022001234",
    revenue: "₹640 crore", skus: 8, distributors: 4, kiranas: 195, shortDatedPerQuarter: 1800000, destroyedToday: 0.7,
  };

  const SKUS = {
    chips:    { id: "chips", code: "MF-MC-150", brand: "Munchly", name: "Masala Chips 150 g", category: "snacks", hsn: "2005", mrp: 30, cost: 16, gst: 0.12, perCarton: 24, lifeDays: 180, kgPerUnit: 0.16, img: "pack-chips" },
    biscuits: { id: "biscuits", code: "MF-CC-200", brand: "Munchly", name: "Choco Cream Biscuits 200 g", category: "biscuits", hsn: "1905", mrp: 40, cost: 22, gst: 0.18, perCarton: 24, lifeDays: 270, kgPerUnit: 0.215, img: "pack-biscuits" },
    chikki:   { id: "chikki", code: "MF-PC-100", brand: "Munchly", name: "Peanut Chikki 100 g", category: "snacks", hsn: "1704", mrp: 25, cost: 13, gst: 0.05, perCarton: 30, lifeDays: 180, kgPerUnit: 0.11, img: "pack-chikki" },
    poha:     { id: "poha", code: "MF-IP-250", brand: "Munchly", name: "Instant Poha 250 g", category: "staples", hsn: "1904", mrp: 55, cost: 31, gst: 0.05, perCarton: 20, lifeDays: 270, kgPerUnit: 0.27, img: "pack-poha" },
    oats:     { id: "oats", code: "MF-MO-200", brand: "Munchly", name: "Masala Oats 200 g", category: "staples", hsn: "2106", mrp: 65, cost: 36, gst: 0.05, perCarton: 20, lifeDays: 270, kgPerUnit: 0.22, img: "pack-oats" },
    mango:    { id: "mango", code: "MF-MD-200", brand: "Munchly", name: "Mango Drink 200 ml", category: "beverages", hsn: "2202", mrp: 20, cost: 11, gst: 0.12, perCarton: 27, lifeDays: 180, kgPerUnit: 0.215, img: "pack-mango" },
    facewash: { id: "facewash", code: "GL-AF-100", brand: "Glowra", name: "Aloe Face Wash 100 ml", category: "personal-care", hsn: "3401", mrp: 120, cost: 58, gst: 0.18, perCarton: 12, lifeDays: 730, kgPerUnit: 0.12, img: "pack-facewash" },
    hairoil:  { id: "hairoil", code: "GL-CO-200", brand: "Glowra", name: "Coconut Hair Oil 200 ml", category: "personal-care", hsn: "3305", mrp: 150, cost: 72, gst: 0.18, perCarton: 12, lifeDays: 730, kgPerUnit: 0.23, img: "pack-hairoil" },
  };

  const DISTRIBUTORS = {
    rakesh:  { id: "rakesh", name: "Rakesh Traders", city: "Nagpur", godown: "Kalamna Market godown", gstin: "27AABCR1234F1Z5", kiranas: 38, cluster: "Nagpur, Wardha and Kamptee" },
    patil:   { id: "patil", name: "Patil Distributors", city: "Pune", godown: "Market Yard godown", kiranas: 52, cluster: "Pune city" },
    gupta:   { id: "gupta", name: "Gupta & Sons", city: "Indore", godown: "Siyaganj godown", kiranas: 47, cluster: "Indore" },
    lakshmi: { id: "lakshmi", name: "Lakshmi Agencies", city: "Hyderabad", godown: "Begum Bazaar godown", kiranas: 58, cluster: "Hyderabad old city" },
  };

  const BUYER = { name: "Sri Venkateswara Traders", short: "Venkat", city: "Hyderabad", gstin: "36AAACS9876K1Z2", kind: "Kirana wholesaler · ExpireSoon buyer" };

  const PEOPLE = {
    priya:  { id: "priya", name: "Priya Deshmukh", short: "Priya", role: "Regional Supply-Chain Manager", org: "Munchly Foods", city: "Pune", img: PEOPLE_IMG + "p-priya.webp", email: "priya.deshmukh@munchly.in", sign: "Google" },
    rakesh: { id: "rakesh", name: "Rakesh bhai", short: "Rakesh bhai", role: "Owner, distributor", org: "Rakesh Traders", city: "Nagpur", img: PEOPLE_IMG + "p-rakesh.webp", phone: "+91 98230 44118", sign: "Phone OTP", lang: "hi" },
    ganesh: { id: "ganesh", name: "Ganesh ji", short: "Ganesh ji", role: "Owner, kirana", org: "Shree Ganesh Kirana", city: "Itwari, Nagpur", img: PEOPLE_IMG + "p-ganesh.webp", phone: "+91 98230 55120", sign: "Phone OTP", lang: "hi" },
    venkat: { id: "venkat", name: "Venkat", short: "Venkat", role: "Buyer", org: "Sri Venkateswara Traders", city: "Hyderabad", img: PEOPLE_IMG + "p-venkat.webp", email: "venkat@svtraders.in", sign: "ExpireSoon" },
    anita:  { id: "anita", name: "Anita Rao", short: "Anita", role: "Finance & GST", org: "Munchly Foods", city: "Pune", img: PEOPLE_IMG + "p-anita.webp", email: "anita.rao@munchly.in", sign: "Google" },
    vikram: { id: "vikram", name: "Vikram Sethi", short: "Vikram", role: "Sustainability & BRSR", org: "Munchly Foods", city: "Pune", img: PEOPLE_IMG + "p-vikram.webp", email: "vikram.sethi@munchly.in", sign: "Google" },
    meera:  { id: "meera", name: "Meera", short: "Meera", role: "City lead", org: "Feeding India", city: "Hyderabad", img: PEOPLE_IMG + "p-meera.webp", email: "meera@feedingindia.example", sign: "Google" },
    arjun:  { id: "arjun", name: "Arjun Nair", short: "Arjun", role: "Platform admin", org: "Munchly Foods", city: "Pune", img: PEOPLE_IMG + "p-arjun.webp", email: "arjun.nair@munchly.in", sign: "Google" },
  };

  // the Nagpur cluster: 38 kiranas pushed, 14 order 588 units (multiples of 12 for the buy-10-get-2 scheme)
  const KIRANAS = [
    ["Shree Ganesh Kirana", "Itwari", 24], ["Jai Durga Stores", "Kamptee", 48], ["Balaji General Store", "Sadar", 24], ["Om Sai Provision", "Wardha Road", 36],
    ["Maa Bhavani Kirana", "Itwari", 24], ["New Sagar Stores", "Kamptee", 60], ["Gurukripa Traders", "Mahal", 48], ["Mahalaxmi Kirana", "Sitabuldi", 24],
    ["Shiv Shakti Store", "Wardha", 36], ["Patel Provision", "Dharampeth", 48], ["Annapurna Stores", "Sadar", 24], ["Sahyog Kirana", "Kamptee", 72],
    ["Raj Super Mart", "Mahal", 60], ["Vaishnavi Stores", "Itwari", 60],
  ].map(([name, area, units], i) => ({ id: "k" + i, name, area, units, at: ["09:52", "09:58", "10:04", "10:11", "10:19", "10:26", "10:33", "10:41", "10:55", "11:02", "11:14", "11:27", "11:33", "11:41"][i] }));

  // day 0 of the demo is 2 Oct 2026, 47 days before the chips batch's best-before date
  const DAY0 = "2026-10-02";
  const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const B = (id, sku, distributor, units, daysLeft, sellPerDay, extra) => { const bb = addDays(DAY0, daysLeft); return Object.assign({ id, sku, distributor, units, daysLeft, sellPerDay, bestBefore: bb, mfg: addDays(bb, -SKUS[sku].lifeDays) }, extra || {}); };
  const BATCHES = [
    // the demo batch carries the dates printed on its label (a six-calendar-month life)
    B("MF-2409-117", "chips", "rakesh", 1840, 47, 12, { mfg: "2026-05-18", bestBefore: "2026-11-18", shelf: "B4", hero: true }),
    B("MF-2410-118", "mango", "lakshmi", 2000, 22, 28, { second: true }),
    B("MF-2408-209", "chips", "gupta", 1032, 74, 22),
    B("MF-2408-311", "chikki", "gupta", 960, 61, 20),
    B("MF-2409-415", "oats", "patil", 900, 75, 18),
    B("MF-2409-204", "biscuits", "patil", 2880, 96, 40),
    B("MF-2410-402", "poha", "lakshmi", 1200, 200, 20),
    B("GL-2410-044", "facewash", "rakesh", 360, 460, 6),
    B("GL-2410-012", "hairoil", "gupta", 216, 500, 4),
  ];

  const hero = BATCHES[0];
  const chips = SKUS.chips;
  const PLAN = M.plan(hero, chips);
  const ASK = PLAN.lines.find(l => l.id === "expiresoon").price;
  const COUNTER = M.counter(ASK, 13);
  const AWARD = M.award(PLAN.lines.find(l => l.id === "expiresoon").units, COUNTER.price);
  const ACTUAL = M.actualNet(PLAN, COUNTER.price);
  const DOCS = M.documents(PLAN, chips, AWARD, DISTRIBUTORS.rakesh.name, BUYER.name);
  const MANGO_PLAN = M.plan(BATCHES[1], SKUS.mango);

  // the nine stages, as the journey map lays them out lane by lane
  const STAGES = [
    { id: "connect", n: 1, title: "Connect", when: "once · 15 min", who: "Priya and Anita set the guardrails", screen: "S0 Setup", role: "brand", view: "setup",
      sees: "Connects the distributor stock export, sets the channel allow-list, a floor price per category and the donation partners.",
      agents: "Data Agent maps the DMS columns, loads BigQuery and back-fills 90 days of sell-through by pincode.",
      money: "The true cost of a write-off is shown before any batch is routed: stock at cost + ITC reversal + disposal + EPR.",
      pain: "Another tool to feed", relief: "A 15-minute setup from an export" },
    { id: "detect", n: 2, title: "Detect", when: "day 0 · 09:00", who: "Nobody. The Watcher runs", screen: "S1 Command Center", role: "brand", view: "command",
      sees: "A push and a dashboard alert: MF-2409-117 Masala Chips is blocked from quick commerce and 1,360 units will not sell by 18 Nov.",
      agents: "Watcher checks each quick-commerce gate, projects sell-through to seven days before best-before, raises batch.at_risk.",
      money: "₹40,800 at MRP at risk; destroying it would cost −₹27,717 including the ITC reversal.",
      pain: "We find out when it has already expired", relief: "47 days of warning" },
    { id: "verify", n: 3, title: "Verify", when: "day 0 · 09:20", who: "Rakesh bhai sends one photo", screen: "S2 Route Room · label", role: "distributor", view: "photo",
      sees: "Rakesh bhai gets a Hindi push, taps it, the camera opens, one picture of the carton label.",
      agents: "Vision Agent (Gemini) reads batch, MFG, best-before and MRP from the photo and reconciles them with the DMS record.",
      money: "MRP ₹30 confirmed from the pack: every price anchors to a verified number.",
      pain: "DMS data is wrong half the time", relief: "The photo is the truth" },
    { id: "value", n: 4, title: "Value", when: "day 0 · 09:21", who: "Nobody. The Valuer runs", screen: "S2 Route Room · channels", role: "brand", view: "route",
      sees: "A channel table: price, days to clear and net ₹ per channel, ineligible channels greyed with the reason.",
      agents: "Valuer prices six channels against days left, capacities and the floor, with the GST-aware write-off as the baseline.",
      money: "Net ₹ per unit for every channel, and whether the input credit survives: −₹20.38 a unit if destroyed.",
      pain: "We just dump it to whoever answers", relief: "Six options, priced" },
    { id: "decide", n: 5, title: "Decide", when: "day 0 · 09:22", who: "The Router proposes", screen: "S2 Route Room · split", role: "brand", view: "route",
      sees: "A recommended split with plain-language reasoning and one alternative side by side.",
      agents: "Router fills the best-paying channel to its capacity, then the next, and writes why.",
      money: "₹21,770 net against −₹27,717 if destroyed: a ₹49,487 swing, 54% of MRP.",
      pain: "Who decides?", relief: "A recommendation with reasons" },
    { id: "approve", n: 6, title: "Approve", when: "day 0 · 09:40", who: "Priya, one tap", screen: "S2 Approve sheet", role: "brand", view: "route", human: true,
      sees: "Priya taps Approve from the push or the dashboard. Nothing is listed, messaged or shipped before this.",
      agents: "Agents wait. The approval is logged with who, when and which channels.",
      money: "The sheet repeats the three numbers that matter: net ₹21,770, swing ₹49,487, ITC ₹2,611 retained.",
      pain: "I don't trust a bot to sell my brand", relief: "Nothing goes out without a tap" },
    { id: "execute", n: 7, title: "Execute", when: "day 0 – 3", who: "Kiranas, a buyer and a food bank respond", screen: "S3 Execution · S4 ExpireSoon", role: "brand", view: "execution",
      sees: "The agent timeline: listing live, kirana orders ticking up, a bid countered, the award.",
      agents: "Lister posts to ExpireSoon; Outreach pushes a Hindi offer to 38 kiranas; Negotiator handles the bid; Donation books a pickup for the Mango Drink batch.",
      money: "Planned against actual as the bid lands: ₹15 → ₹14.20 a unit on the ExpireSoon lot.",
      pain: "Listing and chasing takes days", relief: "Live in minutes, the agent chases" },
    { id: "settle", n: 8, title: "Settle", when: "day 3 – 7", who: "Anita reviews, Rakesh bhai dispatches", screen: "S5 Paperwork", role: "finance", view: "paperwork",
      sees: "The document pack is ready: tax invoice, e-way bill check, credit note, ITC memo.",
      agents: "Paperwork drafts the invoice, checks the e-way bill threshold, issues the credit note, writes the ITC memo and the FSSAI checklist.",
      money: "ITC memo: no reversal under s.17(5)(h), goods supplied under invoice. E-way bill not required, under ₹50,000.",
      pain: "Finance finds out at month end", relief: "Papers ready at the award" },
    { id: "report", n: 9, title: "Report", when: "monthly · quarterly", who: "Vikram, Anita and the CFO", screen: "S6 Finance & ESG", role: "sustainability", view: "report",
      sees: "The Finance & ESG dashboard; one click exports the BRSR waste table and the GST memo.",
      agents: "Impact Agent posts the ledger and builds the BRSR Principle 6 rows with evidence links.",
      money: "₹ recovered, ITC protected, disposal and EPR avoided, kg diverted, CO₂e and meals, with evidence.",
      pain: "We have no waste number", relief: "A BRSR line with evidence" },
  ];

  const PUSH = {
    detect: { to: "priya", at: "09:00", title: "Masala Chips 150 g · Nagpur", body: "Priya ji, Nagpur godown mein Masala Chips 150g (batch MF-2409-117) ki 1,360 units 18 Nov se pehle nahi bikengi. Q-commerce block hai. Route dekhne ke liye tap karein." },
    verify: { to: "rakesh", at: "09:05", title: "Ek photo chahiye", body: "Rakesh bhai, Masala Chips 150g ka ek carton ka label photo bhej dein (batch MF-2409-117). Bas ek photo, baaki hum kar lenge." },
    plan: { to: "priya", at: "09:23", title: "Plan ready · MF-2409-117", body: `588 units kirana (₹18), 772 units ExpireSoon (₹15). Net ${M.fmt.inr(PLAN.net)}, vs ${M.fmt.inr(-PLAN.writeOff.total)} write-off. GST ITC ${M.fmt.inr(PLAN.itcRetained)} safe. Tap to review and approve.` },
    offer: { to: "ganesh", at: "09:41", title: "आज का खास ऑफर", hindi: true, body: "नमस्ते Shree Ganesh Kirana! Munchly Masala Chips 150g पर आज खास ऑफर: 10 पैकेट लो, 2 मुफ़्त. Best before 18 Nov 2026. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें — Rakesh Traders", en: "Today's offer on Munchly Masala Chips 150 g: buy 10 packets, get 2 free. Best before 18 Nov 2026. 48 hours only. Tap to order. Rakesh Traders" },
    award: { to: "priya", at: "11:09", title: "Awarded on ExpireSoon", body: `772 units at ₹${COUNTER.price.toFixed(2)} to Sri Venkateswara Traders. Token ${M.fmt.inr(AWARD.token)} received; balance ${M.fmt.inr(AWARD.balance)} due in 48 h.` },
    papers: { to: "anita", at: "Day 3", title: "Document pack ready · MF-2409-117", body: "Tax invoice, e-way bill check, credit note and ITC memo. Nothing to chase." },
    report: { to: "vikram", at: "Day 3", title: "Ledger posted · MF-2409-117", body: `${M.fmt.kg(PLAN.kg)} diverted from disposal with invoices behind every kilo. The BRSR row is ready.` },
  };

  const CHAT = [
    { from: "buyer", text: "Can you do ₹13 for all 772?", at: "11:02" },
    { from: "agent", text: `₹${COUNTER.price.toFixed(2)} for 772, Nagpur stock, dispatch within 24 h of balance.`, at: "11:03" },
    { from: "buyer", text: `Ok, ₹${COUNTER.price.toFixed(2)}. Token paid.`, at: "11:09" },
  ];

  // the agent timeline for the demo batch; minutes since the previous entry draw the gaps to time
  const EVENTS = [
    { stage: "detect", agent: "Watcher", icon: "radar", at: "09:00", min: 0, text: "Checked 312 batches across 4 distributors. MF-2409-117 fails all three quick-commerce gates and will not sell through.", calls: [["gates.check", "Blinkit 47/90 · Zepto 47/108 · Instamart 47/108", "bad"], ["sellthrough.project", "12/day × 40 days = 480 of 1,840", ""], ["pubsub.publish", "batch.at_risk", "ok"]] },
    { stage: "verify", agent: "Vision", icon: "scan-line", at: "09:05", min: 5, text: "Asked Rakesh Traders for one label photo before quoting any price.", calls: [["fcm.send", "Rakesh bhai · Hindi", "ok"]] },
    { stage: "verify", person: "rakesh", at: "09:19", min: 14, text: "Sent one photo of the carton label from shelf B4." },
    { stage: "verify", agent: "Vision", icon: "scan-line", at: "09:20", min: 1, text: "Read the label: batch MF-2409-117, MFG 18 May 2026, best before 18 Nov 2026, MRP ₹30.00, confidence 0.97. Matches the DMS record.", calls: [["gemini.vision.read_label", "confidence 0.97", "ok"], ["dms.reconcile", "match", "ok"]] },
    { stage: "value", agent: "Valuer", icon: "scale", at: "09:21", min: 1, text: `Priced six channels against 47 days left. Destroying costs ${M.fmt.inr2(-PLAN.writeOff.perUnit)} a unit.`, calls: [["bigquery.price_history", "snacks · 47 days", ""], ["gst.rate", "HSN 2005 → 12%", ""], ["epr.factor", "₹6 / kg", ""]] },
    { stage: "decide", agent: "Router", icon: "split", at: "09:22", min: 1, text: `588 units to the kirana cluster at ₹18, capped by what 38 kiranas can move in 14 days; 772 to ExpireSoon at ₹15. D2C and staff sale pay less a unit, so they get nothing this time.`, calls: [["allocate.greedy", `1,360 units → net ${M.fmt.inr(PLAN.net)}`, "ok"]] },
    { stage: "approve", agent: "Notifier", icon: "bell", at: "09:23", min: 1, text: "Sent Priya the plan to review." },
    { stage: "approve", person: "priya", at: "09:40", min: 17, text: "Approved the plan from her phone.", human: true },
    { stage: "execute", agent: "Lister", icon: "shopping-bag", at: "09:41", min: 1, text: "Posted 772 units on ExpireSoon at ₹15 with the label photo and dates. Reserve ₹13.50.", calls: [["POST /v1/listings", "201 · ES-24117", "ok"]] },
    { stage: "execute", agent: "Outreach", icon: "send", at: "09:41", min: 0, text: "Pushed the Hindi scheme to 38 kiranas in the Nagpur cluster: buy 10 get 2, 48 hours.", calls: [["fcm.send", "38 kiranas · Hindi", "ok"]] },
    { stage: "execute", agent: "Negotiator", icon: "messages-square", at: "11:03", min: 82, text: "Venkat bid ₹13 for all 772, below the reserve. Countered at ₹14.20 with 24-hour dispatch from Rakesh bhai's calendar.", calls: [["listing.counter", "₹13.00 → ₹14.20", ""]] },
    { stage: "execute", person: "venkat", at: "11:09", min: 6, text: `Accepted ₹14.20 and paid the ${M.fmt.inr(AWARD.token)} token.` },
    { stage: "execute", agent: "Outreach", icon: "store", at: "11:41", min: 32, text: "14 kiranas ordered all 588 units within about two hours.", calls: [["orders.sum", "588 units · 14 shops", "ok"]] },
    { stage: "execute", agent: "Donation", icon: "heart-handshake", at: "Day 0", min: 60, text: "Mango Drink batch: booked Feeding India for 58 units. India FoodBanking Network needs 21+ days and 100+ units.", calls: [["foodbank.match", "Feeding India · 58 units", "ok"]] },
    { stage: "settle", person: "rakesh", at: "Day 1–3", min: 1440, text: "Van round of 14 drops; the Hyderabad lot ships once the balance lands." },
    { stage: "settle", agent: "Paperwork", icon: "file-check", at: "Day 3", min: 2880, text: "Invoice INV/26-27/0931, e-way bill check (not required), credit note CN/0117 and the ITC memo are ready.", calls: [["docs.invoice", "₹12,277.89", "ok"], ["eway.check", "below ₹50,000", ""], ["itc.memo", "₹2,611 retained", "ok"]] },
    { stage: "report", agent: "Impact", icon: "leaf", at: "Day 3", min: 30, text: `Posted the ledger: ${M.fmt.kg(PLAN.kg)} diverted, ${M.fmt.kg(PLAN.co2)} CO₂e avoided (indicative), 0 meals. BRSR row written.`, calls: [["ledger.post", M.fmt.inr(ACTUAL.net), "ok"], ["brsr.rows", "Principle 6", "ok"]] },
  ];

  // the quarter at its end (Q3 FY27), as the walkthrough reports it; weekly series sum to it
  const QUARTER = {
    label: "Q3 FY27", recovered: 630000, itc: 79000, kg: 5700, meals: 3700, batches: 23,
    weeks: [
      ["W1", 21770, 27717], ["W2", 38400, 45100], ["W3", 41200, 49800], ["W4", 52600, 60300], ["W5", 47900, 55200], ["W6", 55800, 63900],
      ["W7", 49300, 58400], ["W8", 60100, 68700], ["W9", 51800, 60400], ["W10", 57900, 66100], ["W11", 53400, 62800], ["W12", 52830, 61980], ["W13", 47000, 54500],
    ],
    mix: [["kirana", 38], ["expiresoon", 34], ["d2c", 6], ["staff", 9], ["foodbank", 11], ["writeoff", 2]],
    brsr: [
      { cat: "Food waste: packaged food past quick-commerce gates", diverted: 4840, resold: 4260, donated: 580, disposed: 60, evidence: "Tax invoices, ExpireSoon listing IDs, in-app order logs, food-bank receipts" },
      { cat: "Plastic packaging (EPR)", diverted: 860, resold: 770, donated: 90, disposed: 10, evidence: "Packaging weights per SKU, EPR factor, the same invoices" },
    ],
  };
  QUARTER.writeOffAvoided = QUARTER.weeks.reduce((t, w) => t + w[2], 0);
  QUARTER.swing = QUARTER.recovered + QUARTER.writeOffAvoided;
  QUARTER.co2 = QUARTER.kg * M.RULES.co2PerKg;

  const SETUP = {
    dms: { source: "Bizom-style DMS export (CSV)", rows: 312, columns: [["distributor", "distributor_name"], ["sku", "item_code"], ["batch", "batch_no"], ["mfg", "mfg_date"], ["best_before", "bb_date"], ["units", "closing_qty"], ["godown", "location"], ["pincode", "pin"]], salesDays: 90 },
    allowList: [["snacks", ["expiresoon", "kirana", "d2c", "staff", "foodbank"]], ["biscuits", ["expiresoon", "kirana", "d2c", "staff", "foodbank"]], ["staples", ["expiresoon", "kirana", "d2c", "staff", "foodbank"]], ["beverages", ["expiresoon", "kirana", "staff", "foodbank"]], ["personal-care", ["expiresoon", "kirana", "d2c", "staff"]]],
    brandSafety: ["Personal care never goes to food banks", "Premium gift packs never go to a staff sale"],
    partners: [
      { name: "Feeding India", minDays: 15, minUnits: 50, logistics: "Volunteer pickup within 48 h, hunger spots in 100+ cities", paper: "In-app receipt" },
      { name: "India FoodBanking Network", minDays: 21, minUnits: 100, logistics: "Drop at a member warehouse or a scheduled pickup", paper: "Donation acknowledgement (CSR / 80G, indicative)" },
    ],
    approval: "The first 10 routes per channel need a tap; after that the agent runs inside the guardrails and reports.",
  };

  window.SC3_DATA = { DAY0, addDays, CLIENT, SKUS, DISTRIBUTORS, BUYER, PEOPLE, KIRANAS, BATCHES, STAGES, PUSH, CHAT, EVENTS, QUARTER, SETUP, PLAN, ASK, COUNTER, AWARD, ACTUAL, DOCS, MANGO_PLAN, IMG,
    batchView: b => { const sku = SKUS[b.sku]; return { ...b, skuObj: sku, dist: DISTRIBUTORS[b.distributor], assess: M.assess(b, sku) }; } };
})();

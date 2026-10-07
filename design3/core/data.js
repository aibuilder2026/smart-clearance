/* Smart-Clearance v3 · the demo dataset. Facts come from docs/dobara-journey-map.html (Journey Map v4.1, 4 Oct 2026)
   and the story (docs/smart-clearance-story.html, v6); Munchly Foods, Glowra, ExpireSoon and every person here are
   fictional. Money is never typed here: it is computed by money.js from these inputs. */
(function () {
  const M = window.SC3_MONEY; const fmt = M.fmt;
  const IMG = (window.SC3_IMG || "system/img/");
  const PEOPLE_IMG = IMG + "people/";

  // Smart-Clearance is sold to manufacturers, one workspace each, set up for that manufacturer's supply chain.
  // This prototype is Munchly's workspace; another client's would carry its own chain, channels and rules.
  const PLATFORM = { name: "Smart-Clearance", domain: "smartclearance.com" };
  const CLIENT = {
    name: "Munchly Foods Ltd", short: "Munchly Foods", city: "Pune", listed: "NSE", gstin: "27AABCM1234F1Z5", fssai: "10019022001234",
    revenue: "₹640 crore", skus: 8, distributors: 4, kiranas: 195, shortDatedPerQuarter: 1800000, destroyedToday: 0.7,
  };

  const SKUS = {
    chips:    { id: "chips", code: "MF-MC-150", brand: "Munchly", name: "Masala Chips 150 g", category: "snacks", hsn: "2005", mrp: 30, dp: 22, cost: 16, gst: 0.05, itcPerUnit: 0.9, perCarton: 24, lifeDays: 180, kgPerUnit: 0.16, img: "pack-chips" },
    biscuits: { id: "biscuits", code: "MF-CC-200", brand: "Munchly", name: "Choco Cream Biscuits 200 g", category: "biscuits", hsn: "1905", mrp: 40, cost: 22, gst: 0.05, perCarton: 24, lifeDays: 270, kgPerUnit: 0.215, img: "pack-biscuits" },
    chikki:   { id: "chikki", code: "MF-PC-100", brand: "Munchly", name: "Peanut Chikki 100 g", category: "snacks", hsn: "1704", mrp: 25, cost: 13, gst: 0.05, perCarton: 30, lifeDays: 180, kgPerUnit: 0.11, img: "pack-chikki" },
    poha:     { id: "poha", code: "MF-IP-250", brand: "Munchly", name: "Instant Poha 250 g", category: "staples", hsn: "1904", mrp: 55, cost: 31, gst: 0.05, perCarton: 20, lifeDays: 270, kgPerUnit: 0.27, img: "pack-poha" },
    oats:     { id: "oats", code: "MF-MO-200", brand: "Munchly", name: "Masala Oats 200 g", category: "staples", hsn: "2106", mrp: 65, cost: 36, gst: 0.05, perCarton: 20, lifeDays: 270, kgPerUnit: 0.22, img: "pack-oats" },
    mango:    { id: "mango", code: "MF-MD-200", brand: "Munchly", name: "Mango Drink 200 ml", category: "beverages", hsn: "2202", mrp: 20, cost: 11, gst: 0.05, perCarton: 27, lifeDays: 180, kgPerUnit: 0.215, img: "pack-mango" },
    facewash: { id: "facewash", code: "GL-AF-100", brand: "Glowra", name: "Aloe Face Wash 100 ml", category: "personal-care", hsn: "3401", mrp: 120, cost: 58, gst: 0.18, perCarton: 12, lifeDays: 730, kgPerUnit: 0.12, img: "pack-facewash" },
    hairoil:  { id: "hairoil", code: "GL-CO-200", brand: "Glowra", name: "Coconut Hair Oil 200 ml", category: "personal-care", hsn: "3305", mrp: 150, cost: 72, gst: 0.05, perCarton: 12, lifeDays: 730, kgPerUnit: 0.23, img: "pack-hairoil" },
  };

  // each territory is matched by pincode for the territory guard; a godown may set its own staff-sale cap
  const DISTRIBUTORS = {
    rakesh:  { id: "rakesh", name: "Rakesh Traders", short: "Rakesh Traders", city: "Nagpur", state: "Maharashtra", godown: "Kalamna Market godown", address: "Kalamna Market, Nagpur, Maharashtra", gstin: "27AABCR1234F1Z5", kiranas: 38, cluster: "Nagpur, Wardha and Kamptee", territory: "Nagpur with Wardha and Kamptee", pins: "440, 441, 442", staffCap: 50 },
    patil:   { id: "patil", name: "Patil Distributors", short: "Patil Distributors", city: "Pune", state: "Maharashtra", godown: "Market Yard godown", kiranas: 52, cluster: "Pune city", territory: "Pune", pins: "411, 412" },
    gupta:   { id: "gupta", name: "Gupta & Sons", short: "Gupta & Sons", city: "Indore", state: "Madhya Pradesh", godown: "Siyaganj godown", kiranas: 47, cluster: "Indore", territory: "Indore", pins: "452, 453" },
    lakshmi: { id: "lakshmi", name: "Lakshmi Agencies", short: "Lakshmi Agencies", city: "Hyderabad", state: "Telangana", godown: "Begum Bazaar godown", kiranas: 58, cluster: "Hyderabad old city", territory: "Hyderabad", pins: "500, 501", staffCap: 150 },
  };

  // outside every Munchly territory, so the territory guard lets him see the listing
  const BUYER = { id: "agrawal", name: "Agrawal Wholesale", short: "Agrawal Wholesale", city: "Raipur", state: "Chhattisgarh", stateCode: "22", address: "Ganj Mandi, Raipur, Chhattisgarh", gstin: "22AAGFA4821M1Z3", kind: "Kirana wholesaler · ExpireSoon buyer" };

  // kind: Munchly staff, a trade or food-bank partner invited into Munchly's workspace, or someone outside it
  const PEOPLE = {
    priya:   { id: "priya", name: "Priya Deshmukh", short: "Priya", role: "Regional Supply-Chain Manager", org: "Munchly Foods", city: "Pune", img: PEOPLE_IMG + "p-priya.webp", email: "priya.deshmukh@munchly.in", sign: "Google", kind: "staff" },
    rakesh:  { id: "rakesh", name: "Rakesh bhai", short: "Rakesh bhai", role: "Owner, distributor", org: "Rakesh Traders", city: "Nagpur", img: PEOPLE_IMG + "p-rakesh.webp", phone: "+91 98230 44118", sign: "Phone OTP", lang: "hi", kind: "partner" },
    ganesh:  { id: "ganesh", name: "Ganesh ji", short: "Ganesh ji", role: "Owner, kirana", org: "Shree Ganesh Kirana", city: "Itwari, Nagpur", img: PEOPLE_IMG + "p-ganesh.webp", phone: "+91 98230 55120", sign: "Phone OTP", lang: "hi", kind: "partner" },
    agrawal: { id: "agrawal", name: "Agrawal ji", short: "Agrawal ji", role: "Buyer", org: "Agrawal Wholesale", city: "Raipur", img: PEOPLE_IMG + "p-agrawal.webp", email: "orders@agrawalwholesale.example", sign: "ExpireSoon", kind: "external" },
    anita:   { id: "anita", name: "Anita Rao", short: "Anita", role: "Finance & GST", org: "Munchly Foods", city: "Pune", img: PEOPLE_IMG + "p-anita.webp", email: "anita.rao@munchly.in", sign: "Google", kind: "staff" },
    vikram:  { id: "vikram", name: "Vikram Sethi", short: "Vikram", role: "Sustainability & BRSR", org: "Munchly Foods", city: "Pune", img: PEOPLE_IMG + "p-vikram.webp", email: "vikram.sethi@munchly.in", sign: "Google", kind: "staff" },
    meera:   { id: "meera", name: "Meera", short: "Meera", role: "City lead", org: "Feeding India", city: "Hyderabad", img: PEOPLE_IMG + "p-meera.webp", email: "meera@feedingindia.example", sign: "Google", kind: "partner" },
    arjun:   { id: "arjun", name: "Arjun Nair", short: "Arjun", role: "Workspace admin", org: "Munchly Foods", city: "Pune", img: PEOPLE_IMG + "p-arjun.webp", email: "arjun.nair@munchly.in", sign: "Google", kind: "staff" },
  };

  // the Nagpur cluster: 38 kiranas get the offer and 31 order 588 packets between them, in twelves for the
  // buy-10-get-2 scheme, each under its cap of 4× its own 14-day sales
  const KIRANAS = [
    ["Shree Ganesh Kirana", "Itwari", 24], ["Jai Durga Stores", "Kamptee", 24], ["Om Sai Provision", "Wardha Road", 12], ["Maa Bhavani Kirana", "Itwari", 12],
    ["New Sagar Stores", "Kamptee", 36], ["Gurukripa Traders", "Mahal", 24], ["Mahalaxmi Kirana", "Sitabuldi", 12], ["Shiv Shakti Store", "Wardha", 12],
    ["Patel Provision", "Dharampeth", 24], ["Annapurna Stores", "Sadar", 12], ["Sahyog Kirana", "Kamptee", 48], ["Raj Super Mart", "Mahal", 36],
    ["Vaishnavi Stores", "Itwari", 24], ["Sai Kripa Kirana", "Dharampeth", 12], ["Shree Ram Provision", "Sitabuldi", 12], ["Hanuman General Store", "Wardha Road", 12],
    ["Gajanan Kirana", "Wardha", 24], ["Kamal Provision Store", "Mahal", 12], ["Navkar Stores", "Itwari", 12], ["Siddhivinayak Kirana", "Sadar", 24],
    ["Jyoti General Store", "Kamptee", 12], ["Laxmi Narayan Stores", "Wardha", 12], ["Bharat Kirana", "Sitabuldi", 12], ["Shubham Provision", "Dharampeth", 36],
    ["Mauli Kirana", "Wardha Road", 12], ["Ekta Super Bazaar", "Sadar", 24], ["Pooja Provision", "Itwari", 12], ["Tulsi Kirana", "Kamptee", 12],
    ["Vithal Stores", "Mahal", 12], ["Anand General Store", "Dharampeth", 24], ["Sainath Kirana", "Wardha", 12],
  ].map(([name, area, units], i) => ({ id: "k" + i, name, area, units, at: ["09:52", "09:58", "10:01", "10:04", "10:08", "10:11", "10:15", "10:19", "10:22", "10:26", "10:30", "10:33", "10:37", "10:41", "10:44", "10:48", "10:52", "10:55", "10:59", "11:02", "11:06", "11:10", "11:14", "11:17", "11:21", "11:24", "11:27", "11:31", "11:34", "11:38", "11:41"][i] }));
  const OFFERED = 38;

  // day 0 of the demo is Friday 2 Oct 2026, the Watcher's first run after Munchly's workspace went live,
  // 47 days before the chips batch's best-before date
  const DAY0 = "2026-10-02";
  const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const B = (id, sku, distributor, units, daysLeft, sellPerDay, extra) => { const bb = addDays(DAY0, daysLeft); const d = DISTRIBUTORS[distributor]; return Object.assign({ id, sku, distributor, units, daysLeft, sellPerDay, bestBefore: bb, mfg: addDays(bb, -SKUS[sku].lifeDays), city: d.city, staffCap: d.staffCap }, extra || {}); };
  const BATCHES = [
    // the demo batch carries the dates printed on its label: a 184-day life
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
  // the chips' own tax history, as the invoice states it
  chips.gstNote = "Chips moved from 12% to 5% GST under GST 2.0 on 22 September 2025.";
  const RISK = M.assess(hero, chips);
  const PLAN = M.plan(hero, chips);
  const ES = PLAN.lines.find(l => l.id === "expiresoon"), KL = PLAN.lines.find(l => l.id === "kirana");
  const ASK = ES.price;
  const COUNTER = M.counter(ASK, 13);
  const AWARD = M.award(ES.units, COUNTER.price);
  const ACTUAL = M.actualNet(PLAN, COUNTER.price);
  const SUPPORT = M.priceSupport(PLAN, chips, COUNTER.price);
  const SUPPORT_PLAN = M.priceSupport(PLAN, chips);
  const CLAIM = M.expiryClaim(PLAN.units, chips);
  const DOCS = M.documents(PLAN, chips, AWARD, SUPPORT, { seller: DISTRIBUTORS.rakesh, buyer: BUYER, client: CLIENT });
  const INVOICE = DOCS.find(d => d.id === "invoice");
  // drafted on day 3, when the balance lands and the lot is dispatched
  INVOICE.date = addDays(DAY0, 3);
  const MANGO_PLAN = M.plan(BATCHES[1], SKUS.mango);
  const MANGO_FB = (MANGO_PLAN.lines.find(l => l.id === "foodbank") || { units: 0 }).units;
  const RETURN_BY = addDays(hero.bestBefore, -M.RULES.returnWindowDays);

  // the day-7 shelf check: the salesman's count at one Kamptee shop and the pick-up the agent suggests
  const SHELF = { date: "Friday 9 Oct", counted: KIRANAS.length, shop: "Jai Durga Stores", area: "Kamptee", took: 24, left: 18, pickUp: 12, leave: 6, round: "Thursday's round", returnBy: RETURN_BY };

  const WORKSPACE = {
    id: "munchly", name: "Munchly Foods", short: "Munchly", domain: "munchly." + PLATFORM.domain, emailDomain: "munchly.in",
    // the client's own colours live inside its mark and nowhere else in the interface
    mark: { from: "#f68d3e", to: "#d6461e", ink: "#ffffff" },
    since: "1 Oct 2026", plan: "Pilot", region: "India, Mumbai region",
    signIn: [
      { id: "google", icon: "google", title: "Google Workspace", who: "Munchly staff", rule: "munchly.in accounts only" },
      { id: "phone", icon: "smartphone", title: "Mobile number and a one-time code", who: "Distributors and kirana owners", rule: "Numbers Munchly or their distributor invited" },
      { id: "partner", icon: "mail", title: "Google, by invitation", who: "Partners such as food banks", rule: "Addresses Munchly invited" },
    ],
    outside: "Marketplace buyers sign in to ExpireSoon, another company's site. They are never members of this workspace.",
    // what the invite form suggests typing
    invite: { name: "Shree Sai Kirana", contact: "+91 98230 60014" },
    profile: [
      { id: "route", icon: "factory", title: "Route to market", value: `${Object.keys(DISTRIBUTORS).length} distributors`, text: "Munchly sells only to its distributors. Each one supplies the kiranas on his salesman's beat and the Blinkit, Zepto and Instamart warehouses in his city." },
      { id: "owner", icon: "warehouse", title: "Who owns short-dated stock", value: "the distributor", text: `He bought it at ${fmt.rate(chips.dp)} a pack, so the agent lists, offers and invoices in his name, with his one-time permission.` },
      { id: "expiry", icon: "undo-2", title: "Expiry policy", value: "full credit at expiry", text: "Expired stock comes back to Munchly for full credit and is destroyed, so Munchly acts before expiry and pays price support instead of a claim." },
      { id: "gates", icon: "shield", title: "Quick-commerce gates", value: `Blinkit ${M.RULES.gates.blinkit.minDays}+ days · Zepto, Instamart ${Math.round(M.RULES.gates.zepto.pctLife * 100)}% of life`, text: "A batch that misses a gate stays in the distributor's godown." },
      { id: "channels", icon: "route", title: "Exits for distributor stock", value: "four, and the bin as the baseline", text: "ExpireSoon, the kirana scheme, a staff sale at the godown and food banks. Discount D2C and the Pune plant staff sale apply only to Munchly's own warehouse stock." },
      { id: "territory", icon: "map-pin", title: "Territory guard", value: `${Object.keys(DISTRIBUTORS).length} territories`, text: "ExpireSoon listings are hidden from buyers inside Munchly's distributor territories, matched by pincode." },
      { id: "returns", icon: "calendar-clock", title: "Scheme returns", value: `until ${M.RULES.returnWindowDays} days before best-before`, text: "Returned packs reach the godown in time for a staff sale or a food bank." },
    ],
  };

  // what the sign-in suggests typing: an address in the workspace's domain, or an invited number
  WORKSPACE.hint = `name@${WORKSPACE.emailDomain} or ${PEOPLE.rakesh.phone.slice(4)}`;

  const n0 = fmt.num, inr = fmt.inr;
  const shops = KIRANAS.length;
  const gateLine = RISK.gates.map(g => `${g.app} ${g.has}/${g.need}`).join(" · ");

  // the nine stages, as the journey map lays them out lane by lane
  const STAGES = [
    { id: "connect", n: 1, title: "Connect", when: "once · 15 min", who: "Priya and Anita set the guardrails; Rakesh bhai gives a one-time permission", screen: "S0 Setup", role: "brand", view: "setup",
      sees: "Priya signs in to Munchly's workspace, connects the distributor stock export and sets the allow-list, the floors, the donation partners, the territory guard and the return window. Rakesh bhai signs in with his phone and lets the agent act in his name.",
      agents: "Data Agent maps the DMS columns, loads BigQuery and back-fills 90 days of sell-through by pincode and by shop.",
      money: `The true cost of a write-off is shown before any batch is routed: stock at cost + ITC reversal + disposal + EPR, ${fmt.inr2(-PLAN.writeOff.perUnit)} a packet of chips.`,
      pain: "Another tool to feed", relief: "A 15-minute setup from an export" },
    { id: "detect", n: 2, title: "Detect", when: "day 0 · 09:00", who: "Nobody. The Watcher runs", screen: "S1 Command Center", role: "brand", view: "command",
      sees: `A push and a dashboard alert: MF-2409-117 Masala Chips is blocked from quick commerce and ${n0(RISK.atRisk)} units will not sell by 18 Nov.`,
      agents: "Watcher checks each quick-commerce gate, projects sell-through to seven days before best-before, raises batch.at_risk.",
      money: `${inr(RISK.atRiskMRP)} at MRP at risk; destroying it would hit Munchly's P&L by ${inr(-PLAN.writeOff.total)}, the ITC reversal included.`,
      pain: "We find out when it has already expired", relief: "47 days of warning" },
    { id: "verify", n: 3, title: "Verify", when: "day 0 · 09:20", who: "Rakesh bhai sends one photo", screen: "S2 Route Room · label", role: "distributor", view: "photo",
      sees: "Rakesh bhai gets a Hindi push, taps it, the camera opens, one picture of the carton label.",
      agents: "Vision Agent (Gemini) reads batch, MFG, best-before and MRP from the photo and reconciles them with the DMS record.",
      money: "MRP ₹30 confirmed from the pack: every price anchors to a verified number.",
      pain: "DMS data is wrong half the time", relief: "The photo is the truth" },
    { id: "value", n: 4, title: "Value", when: "day 0 · 09:21", who: "Nobody. The Valuer runs", screen: "S2 Route Room · channels", role: "brand", view: "route",
      sees: "A channel table: price, days to clear and net ₹ per channel, ineligible channels greyed with the reason.",
      agents: "Valuer prices five channels against days left, capacities and the floor, with the GST-aware write-off as the baseline.",
      money: `Net ₹ per unit for every channel, and whether the input credit survives: ${fmt.inr2(-PLAN.writeOff.perUnit)} a unit if destroyed.`,
      pain: "We just dump it to whoever answers", relief: "Five options, priced" },
    { id: "decide", n: 5, title: "Decide", when: "day 0 · 09:22", who: "The Router proposes", screen: "S2 Route Room · split", role: "brand", view: "route",
      sees: "A recommended split with plain-language reasoning and one alternative side by side.",
      agents: "Router fills the best-paying channel to its capacity, then the next, and writes why.",
      money: `${inr(PLAN.net)} net, ${PLAN.pctMRP}% of MRP. Munchly's P&L ${fmt.signed(PLAN.pnl)} against ${inr(-PLAN.writeOff.total)} if destroyed: a ${inr(PLAN.swing)} swing.`,
      pain: "Who decides?", relief: "A recommendation with reasons" },
    { id: "approve", n: 6, title: "Approve", when: "day 0 · 09:40", who: "Priya, one tap", screen: "S2 Approve sheet", role: "brand", view: "route", human: true,
      sees: "Priya taps Approve from the push or the dashboard. Nothing is listed, messaged or shipped before this, and Rakesh bhai gets the same plan with a pause button.",
      agents: "Agents wait. The approval is logged with who, when and which channels.",
      money: `The sheet repeats the three numbers that matter: net ${inr(PLAN.net)}, swing ${inr(PLAN.swing)}, ITC ${inr(PLAN.itcRetained)} retained.`,
      pain: "I don't trust a bot to sell my brand", relief: "Nothing goes out without a tap" },
    { id: "execute", n: 7, title: "Execute", when: "day 0 – 14", who: "Kiranas and a buyer in Raipur respond", screen: "S3 Execution · S4 ExpireSoon", role: "brand", view: "execution",
      sees: "The agent timeline: listing live, kirana orders ticking up, a bid countered, the award.",
      agents: "Lister posts to ExpireSoon in Rakesh Traders' name, hidden from buyers inside Munchly's territories; Outreach pushes a Hindi offer to 38 kiranas; Negotiator handles the bid; Donation books Feeding India for the Mango Drink batch.",
      money: `Planned against actual as the bid lands: ₹15 → ₹${COUNTER.price.toFixed(2)} a unit on the ExpireSoon lot, ${inr(PLAN.net)} → ${inr(ACTUAL.net)} net.`,
      pain: "Listing and chasing takes days", relief: "Live in minutes, the agent chases" },
    { id: "settle", n: 8, title: "Settle", when: "day 3 – 7 · true-up 29 Oct", who: "Rakesh bhai issues his invoice and dispatches; Anita reviews Munchly's papers", screen: "S5 Paperwork", role: "finance", view: "paperwork",
      sees: "The document pack: Rakesh's invoice drafted for him to issue, the e-way bill check, Munchly's price-support credit note and the ITC memo. On day 7, the shelf check.",
      agents: "Paperwork drafts Rakesh's invoice, checks the e-way bill threshold, issues the price-support credit note, writes the ITC memo and the FSSAI checklist.",
      money: `No ITC reversal under s.17(5)(h); no e-way bill under ₹50,000. Price support to Rakesh: ${inr(SUPPORT.total)}, the ${inr(SUPPORT.van + SUPPORT.fee)} van and listing fee included, instead of a ${inr(CLAIM.total)} expiry claim.`,
      pain: "Finance finds out at month end", relief: "Papers ready at the award" },
    { id: "report", n: 9, title: "Report", when: "after 29 Oct · quarterly", who: "Vikram, Anita and the CFO", screen: "S6 Finance & ESG", role: "sustainability", view: "report",
      sees: "The Finance & ESG dashboard; one click exports the BRSR waste table and the GST memo.",
      agents: "Impact Agent posts the ledger once the return window closes and builds the BRSR Principle 6 rows with evidence links.",
      money: `${fmt.kg(PLAN.kg)} diverted · ${fmt.kg(PLAN.co2)} CO₂e avoided (indicative) · 0 meals: one line in the BRSR report.`,
      pain: "We have no waste number", relief: "A BRSR line with evidence" },
  ];

  const PUSH = {
    detect: { to: "priya", at: "09:00", title: "Masala Chips 150 g · Nagpur", body: `Priya ji, Nagpur godown mein Masala Chips 150g (batch MF-2409-117) ki ${n0(RISK.atRisk)} units 18 Nov se pehle nahi bikengi. Q-commerce block hai. Route dekhne ke liye tap karein.` },
    verify: { to: "rakesh", at: "09:05", title: "Ek photo chahiye", body: "Rakesh bhai, Masala Chips 150g ka ek carton ka label photo bhej dein (batch MF-2409-117). Bas ek photo, baaki hum kar lenge." },
    plan: { to: "priya", at: "09:23", title: "Plan ready · MF-2409-117", body: `Plan for MF-2409-117: ${KL.units} units kirana (₹18), ${ES.units} units ExpireSoon (₹15). Net ${inr(PLAN.net)}, ${inr(PLAN.swing)} better than write-off. GST ITC ${inr(PLAN.itcRetained)} safe. Tap to review and approve.` },
    approved: { to: "rakesh", at: "09:40", title: "Plan approved · Masala Chips", body: `Rakesh bhai, Munchly ne MF-2409-117 ka plan approve kiya: ${KL.units} packets aapke kiranas ko scheme par, ${ES.units} aapke naam se ExpireSoon par. Kuch rokna ho to app mein Pause dabayein.` },
    offer: { to: "ganesh", at: "09:41", title: "आज का खास ऑफर", hindi: true, body: "नमस्ते Shree Ganesh Kirana! Munchly Masala Chips 150g पर आज खास ऑफर: 10 पैकेट लो, 2 मुफ़्त. Best before 18 Nov 2026. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें — Rakesh Traders", en: "Today's offer on Munchly Masala Chips 150 g: buy 10 packets, get 2 free. Best before 18 Nov 2026. 48 hours only. Tap to order. Rakesh Traders" },
    award: { to: "priya", at: "11:09", title: "Awarded on ExpireSoon", body: `${ES.units} units at ₹${COUNTER.price.toFixed(2)} to ${BUYER.name}, ${BUYER.city}. Token ${inr(AWARD.token)} received; balance ${inr(AWARD.balance)} due in 48 h.` },
    won: { to: "rakesh", at: "11:09", title: "Buyer mil gaya · ExpireSoon", body: `Rakesh bhai, ${BUYER.name} (${BUYER.city}) ne ${ES.units} packets ₹${COUNTER.price.toFixed(2)} par le liye. Token ${inr(AWARD.token)} aa gaya.` },
    van: { to: "rakesh", at: "Mon 18:00", title: "Van route for Tuesday", body: `Van route for Tuesday updated: ${shops} kiranas, ${KL.units} packets. The ${BUYER.city} lot (${ES.units}) is collected by the buyer's truck once the balance lands.` },
    papers: { to: "anita", at: "Mon 5 Oct", title: "Document pack ready · MF-2409-117", body: "Papers ready for MF-2409-117: Rakesh's invoice draft, e-way bill check, price-support credit note, GST memo. Nothing to chase." },
    invoice: { to: "rakesh", at: "Mon 5 Oct", title: "Invoice draft ready", body: `Invoice draft to ${BUYER.name}, ${BUYER.city}: ${ES.units} × ₹${COUNTER.price.toFixed(2)}, IGST ${INVOICE.gstPct}%, ${inr(INVOICE.total)}. Issue it from Tally. Munchly's price support of ${inr(SUPPORT.total)} is on its way.` },
    shelf: { to: "rakesh", at: "Fri 9 Oct", title: "Shelf check · one pick-up", body: `${SHELF.shop}, ${SHELF.area} has ${SHELF.left} of ${SHELF.took} scheme packs left. Pick up ${SHELF.pickUp} on ${SHELF.round}; leave ${SHELF.leave}.` },
    report: { to: "vikram", at: "30 Oct", title: "Ledger posted · MF-2409-117", body: `${fmt.kg(PLAN.kg)} diverted from disposal with invoices behind every kilo. The BRSR row is ready.` },
    closed: { to: "priya", at: "30 Oct", title: "Batch closed · 0 cartons destroyed", body: `${inr(ACTUAL.net)} recovered, ${inr(PLAN.itcRetained)} GST credit kept, ${fmt.kg(PLAN.kg)} kept out of landfill.` },
  };

  const CHAT = [
    { from: "buyer", text: `Can you do ₹13 for all ${ES.units}?`, at: "11:02" },
    { from: "agent", text: `₹${COUNTER.price.toFixed(2)} for ${ES.units}, Nagpur stock, dispatch within 24 h of balance.`, at: "11:03" },
    { from: "buyer", text: `Ok, ₹${COUNTER.price.toFixed(2)}. Token paid.`, at: "11:09" },
  ];

  // the agent timeline for the demo batch; minutes since the previous entry draw the gaps to time
  const EVENTS = [
    { key: "permit", stage: "connect", person: "rakesh", at: "Thu 16:52", min: 0, text: "Gave Smart-Clearance a one-time permission to list his Munchly stock, offer schemes to his kiranas, draft his invoices and book dispatch slots, inside Munchly's floors." },
    { key: "watch", stage: "detect", agent: "Watcher", icon: "radar", at: "09:00", min: 0, text: "Checked 312 batches across 4 distributors. MF-2409-117 fails all three quick-commerce gates and will not sell through.", calls: [["gates.check", gateLine, "bad"], ["sellthrough.project", `${hero.sellPerDay}/day × ${RISK.usableDays} days = ${n0(RISK.willSell)} of ${n0(hero.units)}`, ""], ["pubsub.publish", "batch.at_risk", "ok"]] },
    { key: "ask", stage: "verify", agent: "Vision", icon: "scan-line", at: "09:05", min: 5, text: "Asked Rakesh Traders for one label photo before quoting any price.", calls: [["fcm.send", "Rakesh bhai · Hindi", "ok"]] },
    { key: "photo", stage: "verify", person: "rakesh", at: "09:19", min: 14, text: "Sent one photo of the carton label from shelf B4." },
    { key: "read", stage: "verify", agent: "Vision", icon: "scan-line", at: "09:20", min: 1, text: "Read the label: batch MF-2409-117, MFG 18 May 2026, best before 18 Nov 2026, MRP ₹30.00, confidence 0.97. Matches the DMS record.", calls: [["gemini.vision.read_label", "confidence 0.97", "ok"], ["dms.reconcile", "match", "ok"]] },
    { key: "value", stage: "value", agent: "Valuer", icon: "scale", at: "09:21", min: 1, text: `Priced five channels against ${hero.daysLeft} days left. Destroying costs ${fmt.inr2(-PLAN.writeOff.perUnit)} a unit, ${inr(-PLAN.writeOff.total)} for the batch.`, calls: [["bigquery.price_history", "snacks · 47 days", ""], ["gst.rate", `HSN ${chips.hsn} → ${Math.round(chips.gst * 100)}%`, ""], ["cost_sheet.input_gst", `${fmt.rate(chips.itcPerUnit)} a pack`, ""], ["epr.factor", `₹${M.RULES.eprPerKg} / kg`, ""]] },
    { key: "route", stage: "decide", agent: "Router", icon: "split", at: "09:22", min: 1, text: `${KL.units} units to the kirana cluster at ₹18 effective, capped by what ${OFFERED} kiranas can move in 14 days; ${ES.units} to ExpireSoon at ₹15. The Nagpur staff sale pays less a unit, so it gets nothing this time.`, calls: [["allocate.greedy", `${n0(PLAN.units)} units → net ${inr(PLAN.net)}`, "ok"]] },
    { key: "notify", stage: "approve", agent: "Notifier", icon: "bell", at: "09:23", min: 1, text: "Sent Priya the plan to review, and Rakesh bhai the same plan with a pause button." },
    { key: "approved", stage: "approve", person: "priya", at: "09:40", min: 17, text: "Approved the plan from her phone.", human: true },
    { key: "list", stage: "execute", agent: "Lister", icon: "shopping-bag", at: "09:41", min: 1, text: `Posted ${ES.units} units on ExpireSoon in Rakesh Traders' name at ₹15, with the label photo and dates. Reserve ₹13.50; hidden from buyers inside Munchly's territories.`, calls: [["POST /v1/listings", "201 · ES-24117", "ok"]] },
    { key: "outreach", stage: "execute", agent: "Outreach", icon: "send", at: "09:41", min: 0, text: `Pushed the Hindi scheme to ${OFFERED} kiranas in the Nagpur cluster: buy 10 get 2 for 48 hours, no shop over ${M.RULES.shopCapTimes}× its own 14-day sales.`, calls: [["fcm.send", `${OFFERED} kiranas · Hindi`, "ok"]] },
    { key: "counter", stage: "execute", agent: "Negotiator", icon: "messages-square", at: "11:03", min: 82, text: `${BUYER.name} bid ₹13 for all ${ES.units}, below the reserve. Countered at ₹${COUNTER.price.toFixed(2)} with 24-hour dispatch from Rakesh bhai's calendar.`, calls: [["listing.counter", `₹13.00 → ₹${COUNTER.price.toFixed(2)}`, ""]] },
    { key: "accepted", stage: "execute", person: "agrawal", at: "11:09", min: 6, text: `Accepted ₹${COUNTER.price.toFixed(2)} and paid the ${inr(AWARD.token)} token.` },
    { key: "orders", stage: "execute", agent: "Outreach", icon: "store", at: "11:41", min: 32, text: `${shops} of ${OFFERED} kiranas ordered all ${KL.units} units in about two hours, each under its cap.`, calls: [["orders.sum", `${KL.units} units · ${shops} shops`, "ok"]] },
    { key: "donate", stage: "execute", agent: "Donation", icon: "heart-handshake", at: "Day 0", min: 60, text: `Mango Drink batch: booked Feeding India for ${MANGO_FB} units. India FoodBanking Network needs 21+ days and 100+ units.`, calls: [["foodbank.match", `Feeding India · ${MANGO_FB} units`, "ok"]] },
    { key: "dispatch", stage: "settle", person: "rakesh", at: "Mon 5 Oct", min: 4200, text: `Loaded ${BUYER.name}'s truck for ${BUYER.city} once the balance landed.` },
    { key: "papers", stage: "settle", agent: "Paperwork", icon: "file-check", at: "Mon 5 Oct", min: 20, text: `Drafted Rakesh's invoice ${INVOICE.no} for him to issue, checked the e-way bill rule, issued the price-support credit note CN/0117 and wrote the ITC memo.`, calls: [["docs.invoice", `${inr(INVOICE.total)} · draft`, "ok"], ["eway.check", "below ₹50,000", ""], ["docs.credit_note", inr(SUPPORT.total), "ok"], ["itc.memo", `${inr(PLAN.itcRetained)} retained`, "ok"]] },
    { key: "van", stage: "settle", person: "rakesh", at: "Tue 6 Oct", min: 1440, text: `Ran the Tuesday round: ${shops} drops, ${KL.units} packets.` },
    { key: "shelf", stage: "settle", agent: "Outreach", icon: "list-checks", at: "Fri 9 Oct", min: 4320, text: `Shelf check: the salesman counted the scheme packs at ${SHELF.counted} shops. ${SHELF.shop}, ${SHELF.area}, has ${SHELF.left} of ${SHELF.took} left: pick up ${SHELF.pickUp} on ${SHELF.round} and leave ${SHELF.leave}.`, calls: [["shelf.check", `${SHELF.counted} shops counted`, "ok"]] },
    { key: "ledger", stage: "report", agent: "Impact", icon: "leaf", at: "30 Oct", min: 30000, text: `The return window closed on ${fmt.day(RETURN_BY)}. Posted the ledger: ${fmt.kg(PLAN.kg)} diverted, ${fmt.kg(PLAN.co2)} CO₂e avoided (indicative), 0 meals. BRSR row written.`, calls: [["ledger.post", inr(ACTUAL.net), "ok"], ["brsr.rows", "Principle 6", "ok"]] },
  ];
  const EV = key => EVENTS.find(e => e.key === key);

  // the quarter at its end (Q3 FY27), as the walkthrough reports it; weekly series sum to it, week 1 is this batch
  const QUARTER = {
    label: "Q3 FY27", period: "Oct to Dec 2026", recovered: 630000, itc: 79000, kg: 5700, meals: 3700, batches: 23,
    weeks: [
      ["W1", Math.round(ACTUAL.net), Math.round(PLAN.writeOff.total)], ["W2", 38400, 45100], ["W3", 41200, 49800], ["W4", 52600, 60300], ["W5", 47900, 55200], ["W6", 55800, 63900],
      ["W7", 49300, 58400], ["W8", 60100, 68700], ["W9", 51800, 60400], ["W10", 57900, 66100], ["W11", 53400, 62800], ["W12", 0, 61980], ["W13", 47000, 54500],
    ],
    mix: [["kirana", 42], ["expiresoon", 38], ["staff", 5], ["foodbank", 12], ["writeoff", 3]],
    mixNames: { kirana: "Kirana scheme", expiresoon: "ExpireSoon", staff: "Staff sale", foodbank: "Food bank", writeoff: "Write-off" },
    brsr: [
      { cat: "Food waste: packaged food past quick-commerce gates", diverted: 4840, resold: 4260, donated: 580, disposed: 60, evidence: "Tax invoices, ExpireSoon listing IDs, in-app order logs, food-bank receipts" },
      { cat: "Plastic packaging (EPR)", diverted: 860, resold: 770, donated: 90, disposed: 10, evidence: "Packaging weights per SKU, EPR factor, the same invoices" },
    ],
  };
  // week 12 takes up whatever keeps the weeks summing to the quarter's total
  QUARTER.weeks[11][1] = QUARTER.recovered - QUARTER.weeks.reduce((t, w, i) => t + (i === 11 ? 0 : w[1]), 0);
  QUARTER.writeOffAvoided = QUARTER.weeks.reduce((t, w) => t + w[2], 0);
  QUARTER.co2 = QUARTER.kg * M.RULES.co2PerKg;

  const SETUP = {
    // the setup takes about this many minutes, from one export
    minutes: 15,
    dms: { source: "Bizom-style DMS export (CSV)", file: "dms_export_2026-10-01.csv", rows: 312, columns: [["distributor", "distributor_name"], ["sku", "item_code"], ["batch", "batch_no"], ["mfg", "mfg_date"], ["best_before", "bb_date"], ["units", "closing_qty"], ["godown", "location"], ["pincode", "pin"]], salesDays: 90 },
    channels: ["expiresoon", "kirana", "staff", "foodbank"],
    channelNames: { kirana: "Kiranas", expiresoon: "ExpireSoon", staff: "Staff sale", foodbank: "Food bank", writeoff: "Write-off" },
    allowList: [["snacks", ["expiresoon", "kirana", "staff", "foodbank"]], ["biscuits", ["expiresoon", "kirana", "staff", "foodbank"]], ["staples", ["expiresoon", "kirana", "staff", "foodbank"]], ["beverages", ["expiresoon", "kirana", "staff", "foodbank"]], ["personal-care", ["expiresoon", "kirana", "staff"]]],
    brandSafety: ["Personal care never goes to food banks", "Premium gift packs never go to a staff sale"],
    partners: [
      { name: "Feeding India", minDays: 15, minUnits: 50, logistics: "Volunteer pickup within 48 h, hunger spots in 100+ cities", pickup: "volunteer pickup in 48 h", paper: "In-app receipt" },
      { name: "India FoodBanking Network", minDays: 21, minUnits: 100, logistics: "Drop at a member warehouse or a scheduled pickup", paper: "Donation acknowledgement (CSR / 80G, indicative)" },
    ],
    approval: "The first 10 routes per channel need a tap; after that the agent runs inside the guardrails and reports.",
    // the distributors' one-time permissions; Rakesh Traders gives his in stage 1 of the demo
    permissions: { patil: "1 Oct", gupta: "1 Oct", lakshmi: "1 Oct" },
    acts: ["List your Munchly stock on ExpireSoon", "Send scheme offers to your kiranas", "Draft your invoices", "Book dispatch slots in your calendar"],
  };

  // the moments of the chips batch's journey the screens state beyond its timeline: the day it starts, how soon a plan
  // follows the label, when Munchly asked Rakesh Traders for his permission, the lot's id on ExpireSoon, the Tuesday van
  // round and Rakesh bhai's answer to it, and the Mango Drink donation's pickup
  const JOURNEY = {
    today: "Fri 2 Oct", planMinutes: 20, permissionAsked: "Thu 16:50",
    listing: { id: "ES-24117", url: "https://expiresoon.example/l/ES-24117" },
    van: { day: "Tuesday", date: "Tue 6 Oct", leaves: "07:00", depot: "Kalamna godown", reply: "Theek hai. Mangalvaar subah nikal jaunga.", replyAt: "Mon 18:04" },
    donation: { partner: "Feeding India", from: "Begum Bazaar", spot: "the Charminar hunger spot", day: "Tuesday", date: "Tue 6 Oct", time: "10:00", hour: "10 am", asked: "Day 0", confirmed: "Day 1", collected: "Day 4", slots: ["Wednesday 10:00", "Wednesday 16:00", "Thursday 11:00"] },
  };
  JOURNEY.donation.reply = `${JOURNEY.donation.day} works. We'll serve them at ${JOURNEY.donation.spot} this week.`;

  // ExpireSoon, another company's marketplace: its terms, and the other lots on it (illustrative)
  const MARKET = {
    dispatchHours: 24, balanceHours: 48, minOrder: 100,
    lots: [
      { id: "ES-23988", name: "Cream biscuits 75 g", icon: "cookie", units: 2400, price: 6, mrp: 10, days: 88, seller: "FMCG distributor, Bilaspur" },
      { id: "ES-24031", name: "Instant noodles 70 g", icon: "soup", units: 1800, price: 8, mrp: 14, days: 41, seller: "Wholesaler, Durg" },
      { id: "ES-24076", name: "UHT toned milk 1 L", icon: "milk", units: 600, price: 38, mrp: 72, days: 34, seller: "Dairy distributor, Bhilai" },
      { id: "ES-24102", name: "Whole-wheat atta 5 kg", icon: "wheat", units: 240, price: 160, mrp: 285, days: 52, seller: "Mill outlet, Rajnandgaon" },
    ],
  };

  // someone exploring the prototype steps into the story's people, by where they stand: inside Munchly, invited in, or
  // outside the workspace. The one-time code every invited number gets, and the accounts the sign-in suggests
  const EXPLORE = {
    groups: [
      { group: WORKSPACE.name, note: "staff · Google Workspace", ids: [["priya", "Approve the plan for the chips batch"], ["anita", `Review ${WORKSPACE.short}'s credit note and GST memo`], ["vikram", "Export the BRSR table"], ["arjun", "The workspace, its people and the guardrails"]] },
      { group: "Invited partners", note: "a one-time code or Google", ids: [["rakesh", "Give the permission, send the photo, run the van"], ["ganesh", "Order from the Hindi offer"], ["meera", "Confirm a food-bank pickup"]] },
      { group: "Outside the workspace", note: "ExpireSoon, another company's marketplace", ids: [["agrawal", `Bid on the lot from ${BUYER.city}`]] },
    ],
    code: "246810",
    accounts: [["priya", PEOPLE.priya.email], ["rakesh", PEOPLE.rakesh.phone], ["ganesh", PEOPLE.ganesh.phone], ["shreesai", "+91 98230 60013"]],
  };

  window.SC3_DATA = { DAY0, addDays, PLATFORM, WORKSPACE, CLIENT, SKUS, DISTRIBUTORS, BUYER, PEOPLE, KIRANAS, OFFERED, BATCHES, STAGES, PUSH, CHAT, EVENTS, EV, QUARTER, SETUP, SHELF,
    RISK, PLAN, ASK, COUNTER, AWARD, ACTUAL, SUPPORT, SUPPORT_PLAN, CLAIM, DOCS, INVOICE, MANGO_PLAN, MANGO_FB, RETURN_BY, IMG, JOURNEY, MARKET, EXPLORE,
    batchView: b => { const sku = SKUS[b.sku]; return { ...b, skuObj: sku, dist: DISTRIBUTORS[b.distributor], assess: M.assess(b, sku) }; } };
})();

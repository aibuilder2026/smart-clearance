/* Smart-Clearance v3 · the demo dataset. Facts come from docs/dobara-journey-map.html (Journey Map v4.1, 4 Oct 2026)
   and the story (docs/smart-clearance-story.html, v6); Munchly Foods, Glowra, ExpireSoon and every person here are
   fictional. Money is never typed here: it is computed by money.js from these inputs. */
(function () {
  const M = window.SC3_MONEY; const fmt = M.fmt; const P = window.SC3_PAPERS;
  const IMG = (window.SC3_IMG || "system/img/");
  const PEOPLE_IMG = IMG + "people/";

  // Smart-Clearance is sold to manufacturers, one workspace each, set up for that manufacturer's supply chain.
  // This prototype is Munchly's workspace; another client's would carry its own chain, channels and rules.
  const PLATFORM = { name: "Smart-Clearance", domain: "smartclearance.web.app" };
  const CLIENT = {
    name: "Munchly Foods Ltd", short: "Munchly Foods", city: "Pune", listed: "NSE", gstin: "27AAKCM0000M1ZN", fssai: "10019022001234",
    // the identity its own papers carry (SC-148): every GSTIN is built as the portal builds one, on a PAN whose four digits
    // are 0000, which are never issued, so none is a real taxpayer's
    pan: "AAKCM0000M", cin: "L15400MH2011PLC000117", address: "Plot B-14, MIDC Chakan Phase II, Pune 410501, Maharashtra", state: "Maharashtra", stateCode: "27", email: "accounts@munchly.example",
    revenue: "₹640 crore", skus: 8, distributors: 4, kiranas: 195, shortDatedPerQuarter: 1800000, destroyedToday: 0.7,
    // who signs its papers (SC-174), with a specimen signature on file (system/img/signatures/) and its round seal
    // (system/img/seals/): fictional
    signatory: { name: "Vinod Patwardhan", title: "Head of Accounts", sign: "munchly", seal: "munchly" },
  };

  // the SKUs' cost sheets: the chips' and the Mango Drink's dealer price are the story's; the other six take the chips'
  // ratios (SC-123, the maintainer's call: fictional): a dealer price of 22/30 of the MRP, to the ₹0.50 below, and input
  // GST of the chips' ₹0.90 on ₹16 of cost, at the SKU's own rate. The Mango Drink has no cost sheet of its own, so its
  // input GST is cost × GST, labelled estimated (money.js itcOf)
  // packKg: the plastic packaging on a pack, in kg (fictional, indicative): the pouch, wrapper, tray, tube or bottle, and a
  // drink carton's plastic layer and straw. BRSR's plastic packaging row counts it (SC-125); EPR's money stays on the kilos
  const SKUS = {
    chips:    { id: "chips", code: "MF-MC-150", brand: "Munchly", name: "Masala Chips 150 g", category: "snacks", hsn: "2005", mrp: 30, dp: 22, cost: 16, gst: 0.05, itcPerUnit: 0.9, perCarton: 24, lifeDays: 180, kgPerUnit: 0.16, packKg: 0.006, img: "pack-chips" },
    biscuits: { id: "biscuits", code: "MF-CC-200", brand: "Munchly", name: "Choco Cream Biscuits 200 g", category: "biscuits", hsn: "1905", mrp: 40, dp: 29, cost: 22, gst: 0.05, itcPerUnit: 1.24, perCarton: 24, lifeDays: 270, kgPerUnit: 0.215, packKg: 0.008, img: "pack-biscuits" },
    chikki:   { id: "chikki", code: "MF-PC-100", brand: "Munchly", name: "Peanut Chikki 100 g", category: "snacks", hsn: "1704", mrp: 25, dp: 18, cost: 13, gst: 0.05, itcPerUnit: 0.73, perCarton: 30, lifeDays: 180, kgPerUnit: 0.11, packKg: 0.004, img: "pack-chikki" },
    poha:     { id: "poha", code: "MF-IP-250", brand: "Munchly", name: "Instant Poha 250 g", category: "staples", hsn: "1904", mrp: 55, dp: 40, cost: 31, gst: 0.05, itcPerUnit: 1.74, perCarton: 20, lifeDays: 270, kgPerUnit: 0.27, packKg: 0.006, img: "pack-poha" },
    oats:     { id: "oats", code: "MF-MO-200", brand: "Munchly", name: "Masala Oats 200 g", category: "staples", hsn: "2106", mrp: 65, dp: 47.5, cost: 36, gst: 0.05, itcPerUnit: 2.03, perCarton: 20, lifeDays: 270, kgPerUnit: 0.22, packKg: 0.005, img: "pack-oats" },
    mango:    { id: "mango", code: "MF-MD-200", brand: "Munchly", name: "Mango Drink 200 ml", category: "beverages", hsn: "2202", mrp: 20, dp: 14.5, cost: 11, gst: 0.05, perCarton: 27, lifeDays: 180, kgPerUnit: 0.215, packKg: 0.002, img: "pack-mango" },
    facewash: { id: "facewash", code: "GL-AF-100", brand: "Glowra", name: "Aloe Face Wash 100 ml", category: "personal-care", hsn: "3401", mrp: 120, dp: 88, cost: 58, gst: 0.18, itcPerUnit: 11.75, perCarton: 12, lifeDays: 730, kgPerUnit: 0.12, packKg: 0.012, img: "pack-facewash" },
    hairoil:  { id: "hairoil", code: "GL-CO-200", brand: "Glowra", name: "Coconut Hair Oil 200 ml", category: "personal-care", hsn: "3305", mrp: 150, dp: 110, cost: 72, gst: 0.05, itcPerUnit: 4.05, perCarton: 12, lifeDays: 730, kgPerUnit: 0.23, packKg: 0.02, img: "pack-hairoil" },
  };

  // each territory is matched by pincode for the territory guard; a godown may set its own staff-sale cap. `upi` is the
  // address staff pay at a staff sale (SC-87): fictional, on no real bank's handle. `signatory` signs his papers and
  // `receipts` numbers his staff sales' consolidated receipts (SC-174): fictional
  const DISTRIBUTORS = {
    rakesh:  { id: "rakesh", name: "Rakesh Traders", short: "Rakesh Traders", city: "Nagpur", state: "Maharashtra", stateCode: "27", godown: "Kalamna Market godown", address: "Shop 12, Kalamna Market, Nagpur 440035, Maharashtra", gstin: "27ABHPR0000K1ZW", pan: "ABHPR0000K", fssai: "21526000000117", email: "accounts@rakeshtraders.example", bank: { name: "Example Co-operative Bank, Itwari, Nagpur", account: "0000 0117 2409", ifsc: "EXMP0000117" }, kiranas: 38, cluster: "Nagpur, Wardha and Kamptee", territory: "Nagpur with Wardha and Kamptee", pins: "440, 441, 442", staffCap: 50, upi: "rakesh-traders@exampleupi", series: { prefix: "RT/26-27/", next: 1279, width: 4 }, signatory: { name: "Rakesh Jaiswal", title: "Proprietor", sign: "rakesh", seal: "rakesh" }, receipts: { prefix: "RT/SR/26-27/", next: 2, width: 4 } },
    patil:   { id: "patil", name: "Patil Distributors", short: "Patil Distributors", city: "Pune", state: "Maharashtra", stateCode: "27", godown: "Market Yard godown", address: "Shop 7, Market Yard, Gultekdi, Pune 411037, Maharashtra", gstin: "27AAKFP0000P1Z8", pan: "AAKFP0000P", fssai: "21526000000204", email: "accounts@patildistributors.example", bank: { name: "Example Co-operative Bank, Market Yard, Pune", account: "0000 0204 2409", ifsc: "EXMP0000204" }, kiranas: 52, cluster: "Pune city", territory: "Pune", pins: "411, 412", upi: "patil-distributors@exampleupi", series: { prefix: "PD/26-27/", next: 512, width: 4 }, signatory: { name: "Sanjay Patil", title: "Proprietor", sign: "patil", seal: "patil" }, receipts: { prefix: "PD/SR/26-27/", next: 1, width: 4 } },
    gupta:   { id: "gupta", name: "Gupta & Sons", short: "Gupta & Sons", city: "Indore", state: "Madhya Pradesh", stateCode: "23", godown: "Siyaganj godown", address: "22 Siyaganj Main Road, Indore 452007, Madhya Pradesh", gstin: "23AAHFG0000G1ZB", pan: "AAHFG0000G", fssai: "21426000000209", email: "accounts@guptasons.example", bank: { name: "Example Co-operative Bank, Siyaganj, Indore", account: "0000 0209 2408", ifsc: "EXMP0000209" }, kiranas: 47, cluster: "Indore", territory: "Indore", pins: "452, 453", upi: "gupta-sons@exampleupi", series: { prefix: "GS/26-27/", next: 2041, width: 4 }, signatory: { name: "Ramesh Gupta", title: "Partner", sign: "gupta", seal: "gupta" }, receipts: { prefix: "GS/SR/26-27/", next: 1, width: 4 } },
    lakshmi: { id: "lakshmi", name: "Lakshmi Agencies", short: "Lakshmi Agencies", city: "Hyderabad", state: "Telangana", stateCode: "36", godown: "Begum Bazaar godown", address: "4-2-118 Begum Bazaar, Hyderabad 500012, Telangana", gstin: "36AAJFL0000L1ZM", pan: "AAJFL0000L", fssai: "23626000000118", email: "accounts@lakshmiagencies.example", bank: { name: "Example Co-operative Bank, Begum Bazaar, Hyderabad", account: "0000 0118 2410", ifsc: "EXMP0000118" }, kiranas: 58, cluster: "Hyderabad old city", territory: "Hyderabad", pins: "500, 501", staffCap: 150, upi: "lakshmi-agencies@exampleupi", series: { prefix: "LA/26-27/", next: 972, width: 4 }, signatory: { name: "K. Lakshmi Narayana", title: "Partner", sign: "lakshmi", seal: "lakshmi" }, receipts: { prefix: "LA/SR/26-27/", next: 2, width: 4 } },
  };

  // each godown's staff, who buy at a staff sale and pay by UPI (SC-174): fictional names, a staff sale's consolidated
  // receipt lists their payments (papers.js staffPayments)
  const STAFF = {
    rakesh: ["Sunil Bhagat", "Manoj Raut", "Pooja Shende", "Nitin Gawande", "Kavita Dongre", "Amol Thakur", "Ravi Meshram", "Sneha Bawane", "Prakash Lanjewar", "Dinesh Kale", "Swati Nimje", "Ganesh Barde", "Anil Wasnik", "Seema Dhoble", "Rahul Kumbhare", "Vaishali Pande", "Sachin Ukey", "Komal Gedam", "Mahesh Chaudhari", "Priti Ingle", "Sagar Bisen", "Neha Hedau", "Vikas Tembhurne", "Rupali Sontakke"],
    lakshmi: ["S. Ravi Kumar", "Mohd Irfan", "P. Swathi", "K. Naresh", "Syed Ameer", "B. Lavanya", "G. Srinivas", "Fatima Begum", "T. Rajesh", "M. Anil", "Shaik Imran", "V. Sravani", "N. Mahesh", "R. Kavya", "A. Prakash", "Md Saleem", "D. Ramya", "Ch. Venkatesh", "J. Suresh", "K. Divya", "P. Nagaraju", "S. Haritha", "B. Yadagiri", "Ayesha Sultana"],
    patil: ["Rohit Jadhav", "Snehal More", "Akash Pawar", "Manisha Shinde", "Tushar Kulkarni", "Pallavi Gaikwad", "Ajay Mane", "Rutuja Deshpande", "Kiran Bhosale", "Sonali Patole", "Vishal Kadam", "Ashwini Salunkhe"],
    gupta: ["Rajesh Yadav", "Pooja Sharma", "Deepak Verma", "Anita Patel", "Sanjay Rathore", "Kiran Joshi", "Manish Soni", "Rekha Tiwari", "Arvind Chouhan", "Sunita Malviya", "Vivek Jain", "Shalini Dubey"],
  };

  // outside every Munchly territory, so the territory guard lets him see the listing
  const BUYER = { id: "agrawal", name: "Agrawal Wholesale", short: "Agrawal Wholesale", city: "Raipur", state: "Chhattisgarh", stateCode: "22", address: "Shop 3, Ganj Mandi, Raipur 492001, Chhattisgarh", gstin: "22AAGFA0000A1ZW", pan: "AAGFA0000A", kind: "Kirana wholesaler · ExpireSoon buyer" };

  // kind: Munchly staff, a trade or food-bank partner invited into Munchly's workspace, or someone outside it
  const PEOPLE = {
    priya:   { id: "priya", name: "Priya Deshmukh", short: "Priya", role: "Regional Supply-Chain Manager", org: "Munchly Foods", city: "Pune", img: PEOPLE_IMG + "p-priya.webp", email: "priya.deshmukh@munchly.in", sign: "Google", kind: "staff" },
    rakesh:  { id: "rakesh", name: "Rakesh bhai", short: "Rakesh bhai", role: "Owner, distributor", org: "Rakesh Traders", city: "Nagpur", img: PEOPLE_IMG + "p-rakesh.webp", phone: "+91 98230 44118", sign: "Phone OTP", lang: "hi", kind: "partner" },
    ganesh:  { id: "ganesh", name: "Ganesh ji", short: "Ganesh ji", role: "Owner, kirana", org: "Shree Ganesh Kirana", city: "Itwari, Nagpur", img: PEOPLE_IMG + "p-ganesh.webp", phone: "+91 98230 55120", sign: "Phone OTP", lang: "hi", kind: "partner" },
    agrawal: { id: "agrawal", name: "Agrawal ji", short: "Agrawal ji", role: "Buyer", org: "Agrawal Wholesale", city: "Raipur", img: PEOPLE_IMG + "p-agrawal.webp", email: "orders@agrawalwholesale.example", sign: "ExpireSoon", kind: "external" },
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

  // day 0 of the demo is Friday 2 Oct 2026, the Watcher's first run of the story's journey (Munchly has been live since
  // 1 Jul, SC-123),
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

  // Lakshmi Agencies' cluster in Hyderabad's old city (SC-86), so the Mango Drink's scheme has shops to go to: as many as
  // she supplies, round the Begum Bazaar godown. Their 14-day sales add up to the batch's 28 packets a day (392), so
  // their caps (4×) hold the plan's kirana line; `orders` is what each orders when the scheme runs (walk.sh, and the
  // Mango Drink's own journey in the stub, SC-168): its cap until the line is full. world.js adds their pincodes and
  // accounts
  const HYD_SHOPS = [
    ["Sri Lakshmi Ganapathi Kirana", "Begum Bazaar"], ["Al-Noor Provision Store", "Charminar"], ["Deccan General Stores", "Abids"], ["Sai Krishna Kirana", "Koti"],
    ["Hussaini Provision", "Dabeerpura"], ["Bhavani Kirana", "Malakpet"], ["Golconda Stores", "Afzal Gunj"], ["Moazzam Kirana", "Charminar"],
    ["Anjaneya Provision Store", "Sultan Bazar"], ["Shalimar General Store", "Nampally"], ["Ravi Teja Kirana", "Chaderghat"], ["Madina Provision", "Charminar"],
    ["Sri Durga Bhavani Stores", "Begum Bazaar"], ["Hyderabadi Kirana", "Abids"], ["Gulzar House Stores", "Charminar"], ["Padmavathi Kirana", "Koti"],
    ["Asif Nagar Provisions", "Nampally"], ["Ramakrishna General Store", "Malakpet"], ["Taj Kirana", "Dabeerpura"], ["Sitara Provision Store", "Afzal Gunj"],
    ["Vinayaka Stores", "Sultan Bazar"], ["Nizam Kirana", "Charminar"], ["Annapurna Provisions", "Chaderghat"], ["Musi River Stores", "Afzal Gunj"],
    ["Kothi Kirana", "Koti"], ["Siddiq General Store", "Dabeerpura"], ["Lalitha Provision", "Malakpet"], ["Mehboob Kirana", "Begum Bazaar"],
    ["Srinivasa Stores", "Abids"], ["Zam Zam Provisions", "Charminar"], ["Pochamma Kirana", "Chaderghat"], ["Rahmat General Store", "Nampally"],
    ["Krishnaveni Provisions", "Sultan Bazar"], ["Shah Ali Kirana", "Dabeerpura"], ["Mahalakshmi Stores", "Malakpet"], ["Banjara Provision Store", "Abids"],
    ["Ghouse Kirana", "Charminar"], ["Sri Rama Stores", "Koti"], ["Patel Market Kirana", "Afzal Gunj"], ["Yadamma Provisions", "Chaderghat"],
    ["Darussalam Stores", "Nampally"], ["Gowri Kirana", "Begum Bazaar"], ["Irani Gali Provisions", "Charminar"], ["Satyanarayana Stores", "Sultan Bazar"],
    ["Farhan General Store", "Dabeerpura"], ["Sunanda Kirana", "Malakpet"], ["Mir Alam Provisions", "Afzal Gunj"], ["Jyothi Stores", "Koti"],
    ["Purani Haveli Kirana", "Charminar"], ["Narayana Provision Store", "Abids"], ["Bilal Stores", "Nampally"], ["Saraswathi Kirana", "Chaderghat"],
    ["Osman Gunj Provisions", "Begum Bazaar"], ["Vijaya Stores", "Sultan Bazar"], ["Akbar Kirana", "Dabeerpura"], ["Manjula Provisions", "Malakpet"],
    ["Laad Bazaar Stores", "Charminar"], ["Sri Venu Kirana", "Afzal Gunj"],
  ];
  const HYD_SALES = [6, 7, 8, 5, 9, 6, 7, 4, 8, 7];
  const HYDERABAD = (() => {
    let toOrder = (MANGO_PLAN.lines.find(l => l.id === "kirana") || { units: 0 }).units;
    return HYD_SHOPS.map(([name, area], i) => {
      const sales14 = i < 50 ? HYD_SALES[i % 10] : i < 57 ? 7 : 8;
      const orders = Math.min(toOrder, sales14 * M.RULES.shopCapTimes);
      toOrder -= orders;
      return { id: "h" + i, name, area, sales14, orders };
    });
  })();


  const WORKSPACE = {
    id: "munchly", name: "Munchly Foods", short: "Munchly", domain: "munchly-" + PLATFORM.domain, emailDomain: "munchly.in",
    // the client's own colours live inside its mark and nowhere else in the interface
    mark: { from: "#f68d3e", to: "#d6461e", ink: "#ffffff" },
    since: "1 Jul 2026", plan: "Pilot", region: "India, Mumbai region",
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
      { id: "expiry", icon: "undo-2", title: "Expiry policy", value: "destroyed at the distributor's godown", text: "Packs left at a distributor's godown on expiry day are destroyed there by an authorised agency. Munchly approves the evidence and credits him the dealer price, the input GST he reverses and the agency's charges, so Munchly acts before expiry and pays price support instead of a claim." },
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
    { id: "connect", n: 1, title: "Connect", when: "once · 15 min", who: "Priya sets the guardrails; Rakesh bhai gives a one-time permission", screen: "S0 Setup", role: "brand", view: "setup",
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
    { id: "settle", n: 8, title: "Settle", when: "day 3 – 7 · true-up 29 Oct", who: "Rakesh bhai issues his invoice and dispatches; Priya reviews Munchly's papers", screen: "S5 Paperwork", role: "brand", view: "paperwork",
      sees: "The document pack: Rakesh's invoice drafted for him to issue, the e-way bill check, Munchly's price-support credit note and the ITC memo.",
      agents: "Paperwork drafts Rakesh's invoice, checks the e-way bill threshold, issues the price-support credit note, writes the ITC memo and the FSSAI checklist.",
      money: `No ITC reversal under s.17(5)(h); no e-way bill under ₹50,000. Price support to Rakesh: ${inr(SUPPORT.total)}, the ${inr(SUPPORT.van + SUPPORT.fee)} van and listing fee included, instead of a ${inr(CLAIM.total)} expiry claim.`,
      pain: "Finance finds out at month end", relief: "Papers ready at the award" },
    { id: "report", n: 9, title: "Report", when: "after 29 Oct · quarterly", who: "Priya and the CFO", screen: "S6 Ledger", role: "brand", view: "report",
      sees: "The ledger, by quarter and year; one click exports the BRSR waste table and the GST summary.",
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
    papers: { to: "priya", at: "Mon 5 Oct", title: "Document pack ready · MF-2409-117", body: "Papers ready for MF-2409-117: Rakesh's invoice draft, e-way bill check, price-support credit note, GST memo. Nothing to chase." },
    invoice: { to: "rakesh", at: "Mon 5 Oct", title: "Invoice draft ready", body: `Invoice draft to ${BUYER.name}, ${BUYER.city}: ${ES.units} × ₹${COUNTER.price.toFixed(2)}, IGST ${INVOICE.gstPct}%, ${inr(INVOICE.total)}. Issue it from Tally. Munchly's price support of ${inr(SUPPORT.total)} is on its way.` },
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
      // each food bank's own paper for what it collects (SC-110), numbered in its own series ({city}: the godown's city
      // in three letters), and its own rule for the meals a donation makes; the numbers and rules are fictional
      { name: "Feeding India", minDays: 15, minUnits: 50, logistics: "Volunteer pickup within 48 h, hunger spots in 100+ cities", pickup: "volunteer pickup in 48 h", paper: "In-app receipt",
        receipt: { title: "Donation receipt", stamp: "RECEIVED", series: { prefix: "FI/{city}/26-27/", next: 417, width: 4 }, csr: null, note: "Issued in the app by Feeding India as the packs were collected: the donor's evidence for BRSR Principle 6, not a tax certificate." },
        meals: { packs: 1, rule: "a meal for each pack served, indicative" } },
      { name: "India FoodBanking Network", minDays: 21, minUnits: 100, logistics: "Drop at a member warehouse or a scheduled pickup", paper: "Donation acknowledgement (CSR / 80G, indicative)",
        receipt: { title: "Donation acknowledgement", stamp: "ACKNOWLEDGED", series: { prefix: "IFBN/ACK/26-27/", next: 112, width: 4 }, csr: "Schedule VII (i), eradicating hunger", note: "An acknowledgement for the donor's CSR records, indicative. Section 80G covers gifts of money, so this is not a tax certificate." },
        meals: { kg: 0.4, rule: "a meal for every 400 g of food, indicative" } },
    ],
    approval: "The first 10 routes per channel need a tap; after that the agent runs inside the guardrails and reports.",
    // the client's expiry policy (SC-139, route B): packs left at a distributor's godown on expiry day are destroyed
    // there, through an authorised agency, against evidence Supply Chain approves before the batch closes; a financial
    // credit note pays him the dealer price, the input GST he reverses on them (grossed up) and the agency's charges.
    // The agencies are fictional: the city corporation's authorised waste contractors, each with its own certificates
    expiry: "godown",
    destruction: {
      evidence: [["before", "The packs at the godown, the carton's batch label in view"], ["after", "Slit open at the landfill, the slate with the batch, the count and the date in view"]],
      visionCheck: true, reviewer: "ws-operator", remindDays: 2, grossUp: true, chargesPerUnit: 1.5,
      method: "Slit open, buried and covered at the authorised municipal landfill",
      // the certificate of destruction in full (SC-174): why the packs were destroyed, and how, by the agency's own method
      reasons: [["expiry", "Product expiry"], ["contamination", "Contamination or damage"], ["seizure", "Court-ordered seizure"]],
      methods: {
        landfill: { name: "Sanitary landfill, CPCB-compliant", how: "the packs slit open and emptied into the active cell, covered with 30 cm of soil the same day; the plastic packaging segregated for an EPR-registered recycler" },
        incineration: { name: "Incineration at a CPCB-compliant common facility", how: "the packs fed whole to the incinerator at 850 °C or more, the ash to the facility's secured landfill; the plastic packaging set aside first for an EPR-registered recycler" },
      },
      // each agency's facility (its coordinates), its supervising officer, the covered vehicle it carries the packs in, its
      // own method, and the independent witnesses it brings to a destruction (SC-174); every name, address, vehicle and
      // number is fictional, and each signatory has a specimen signature on file (system/img/signatures/)
      agencies: [
        { id: "oce", name: "Orange City Enviro Services", city: "Nagpur", auth: "MPCB/SWM/NGP/0412", series: { prefix: "OCE/DC/26-27/", next: 219, width: 4 }, site: "the municipal landfill, Nagpur",
          method: "landfill", facility: { name: "Municipal sanitary landfill, cell 4", address: "Pardi Road, Bhandewadi, Nagpur 440035, Maharashtra", gps: "21.1467° N, 79.1563° E" }, vehicle: "MH-31-ZX-0000",
          officer: { name: "Sachin Bhoyar", title: "Site supervisor", sign: "oce" }, seal: "oce",
          witnesses: [{ name: "Pradeep Meshram", address: "Plot 22, Wathoda Layout, Nagpur 440035", proof: "Voter ID, last four 4417", sign: "oce-w1" }, { name: "Asha Kale", address: "House 9, Pardi Naka, Nagpur 440035", proof: "Voter ID, last four 0932", sign: "oce-w2" }] },
        { id: "vwc", name: "Vidarbha Waste Care", city: "Nagpur", auth: "MPCB/SWM/NGP/0538", series: { prefix: "VWC/DC/26-27/", next: 41, width: 4 }, site: "the municipal landfill, Nagpur",
          method: "landfill", facility: { name: "Municipal sanitary landfill, cell 2", address: "Pardi Road, Bhandewadi, Nagpur 440035, Maharashtra", gps: "21.1452° N, 79.1541° E" }, vehicle: "MH-31-ZY-0000",
          officer: { name: "Rahul Dhote", title: "Site supervisor", sign: "vwc" }, seal: "vwc",
          witnesses: [{ name: "Vijay Thakre", address: "Plot 5, Bharatwada Road, Nagpur 440035", proof: "Voter ID, last four 2268", sign: "vwc-w1" }, { name: "Sunita Wankhede", address: "House 31, Kalamna Basti, Nagpur 440035", proof: "Voter ID, last four 7105", sign: "vwc-w2" }] },
        { id: "dgw", name: "Deccan Green Waste Management", city: "Hyderabad", auth: "TSPCB/SWM/HYD/0287", series: { prefix: "DGW/DC/26-27/", next: 86, width: 4 }, site: "the municipal landfill, Hyderabad",
          method: "landfill", facility: { name: "Municipal sanitary landfill, cell 7", address: "Jawaharnagar, Hyderabad 500087, Telangana", gps: "17.5193° N, 78.5862° E" }, vehicle: "TG-09-ZX-0000",
          officer: { name: "M. Srinivas Reddy", title: "Site supervisor", sign: "dgw" }, seal: "dgw",
          witnesses: [{ name: "Syed Mujeeb", address: "House 14, Gandhi Nagar, Hyderabad 500080", proof: "Voter ID, last four 5831", sign: "dgw-w1" }, { name: "P. Anitha", address: "Flat 3, Kavadiguda, Hyderabad 500080", proof: "Voter ID, last four 3390", sign: "dgw-w2" }] },
      ],
    },
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
  // the receipt Feeding India issues as Meera marks the Mango Drink collected (SC-110): the first number of its series,
  // on the day of the collection
  const FOODBANK = SETUP.partners.find(p => p.name === JOURNEY.donation.partner);
  const series = FOODBANK.receipt.series, MANGO_DIST = DISTRIBUTORS[BATCHES[1].distributor];
  const MANGO_RECEIPT = M.receipt(MANGO_FB, SKUS.mango, FOODBANK, {
    no: series.prefix.replace("{city}", MANGO_DIST.city.slice(0, 3).toUpperCase()) + String(series.next).padStart(series.width, "0"),
    date: addDays(DAY0, Number(JOURNEY.donation.collected.replace("Day ", ""))), at: JOURNEY.donation.time, by: PEOPLE.meera.name,
    donor: CLIENT.name, fssai: CLIENT.fssai, via: MANGO_DIST.name, from: `${MANGO_DIST.godown}, ${MANGO_DIST.city}`, spot: JOURNEY.donation.spot,
  });

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

  // Munchly's history (SC-123): the twelve batches its workspace cleared in its pilot quarter, Q2 FY27 (Jul to Sep
  // 2026), before the story's journey on 2 Oct. The Watcher flagged each on the day given, with its packs, days left
  // and sales a day, and money.js plans it as the agents would. What happened is the history's own: sold through; packs
  // left at the godown when the kiranas ordered fewer (destroyed there on expiry day, against evidence Priya approved
  // the day after, and settled by Munchly's policy, SC-139); or a donation, to the
  // first food bank that takes it, as the Donation step books. backend-api builds it through the journey's own steps on this schedule (services/journey/history.py), so
  // its papers carry these numbers and its ledgers these figures. Every company, person and figure is fictional.
  const HISTORY_BATCHES = [
    // ref, SKU, distributor, packs, days left, sales a day, flagged on, what happened, and the kiranas' orders when fewer
    ["MF-2406-105", "biscuits", "rakesh", 1400, 42, 10, "2026-07-03", "sold"],
    ["MF-2406-106", "chikki", "lakshmi", 1600, 38, 14, "2026-07-08", "sold"],
    ["MF-2406-107", "oats", "lakshmi", 800, 40, 5, "2026-07-14", "leftover", { kirana: 180 }],
    ["MF-2406-108", "poha", "rakesh", 900, 45, 6, "2026-07-21", "sold"],
    ["MF-2406-109", "poha", "lakshmi", 1100, 26, 8, "2026-07-28", "donation"],
    ["MF-2407-110", "facewash", "rakesh", 520, 48, 3, "2026-08-04", "sold"],
    ["MF-2407-111", "mango", "rakesh", 1700, 36, 16, "2026-08-10", "leftover", { kirana: 600 }],
    ["MF-2407-112", "hairoil", "lakshmi", 480, 44, 3, "2026-08-17", "sold"],
    ["MF-2407-113", "chips", "lakshmi", 1500, 40, 13, "2026-08-18", "sold"],
    ["MF-2407-114", "oats", "rakesh", 900, 22, 6, "2026-08-24", "donation"],
    ["MF-2407-115", "biscuits", "lakshmi", 1300, 34, 11, "2026-08-25", "sold"],
    ["MF-2407-116", "chikki", "rakesh", 1500, 31, 12, "2026-08-27", "leftover", { kirana: 456 }],
  ];
  // each step's day after the flag and its time (IST); the report falls due at 10:00 on the best-before (SC-94). A step
  // a batch's plan has no line for is left out; the scheme closes when it fills, else when its 48 hours are up
  const HISTORY_AT = {
    open: [0, "08:30"], detect: [0, "09:00"], photo: [0, "11:00"], read: [0, "11:05"], value: [0, "11:10"], route: [0, "11:15"],
    approve: [0, "12:00"], listing: [0, "12:05"], offer: [0, "12:10"], donation: [0, "12:15"], pickup: [1, "09:30"],
    orders: [1, "10:00"], bid: [1, "15:00"], counter: [1, "15:05"], accept: [1, "15:30"], collect: [2, "10:00"],
    closeOffer: [2, "12:10"], staff: [2, "18:00"], truck: [3, "10:00"], papers: [3, "10:30"], invoice: [3, "11:00"],
    van: [4, "09:00"], review: [4, "15:00"],
  };
  const HISTORY = (() => {
    const at = (day, k) => { const [n, t] = HISTORY_AT[k]; return addDays(day, n) + "T" + t; };
    const parties = d => ({ client: CLIENT, seller: d, buyer: BUYER });
    const list = HISTORY_BATCHES.map(([ref, skuId, distId, units, daysLeft, sellPerDay, flagged, outcome, x = {}]) => {
      const sku = SKUS[skuId], d = DISTRIBUTORS[distId], bestBefore = addDays(flagged, daysLeft);
      const batch = { id: ref, sku: skuId, distributor: distId, units, daysLeft, sellPerDay, bestBefore, mfg: addDays(bestBefore, -sku.lifeDays), city: d.city, staffCap: d.staffCap };
      const plan = M.plan(batch, sku);
      const line = id => plan.lines.find(l => l.id === id && l.units > 0) || null;
      const es = line("expiresoon"), kl = line("kirana"), st = line("staff"), fb = line("foodbank");
      // the buyer bids 87% of the ask, and takes the Negotiator's counter
      const bid = es ? Math.floor(es.price * 0.87 * 10) / 10 : null;
      const price = es ? M.counter(es.price, bid).price : null;
      // the first food bank that takes the line, as backend-api's Donation step books it
      const partner = fb ? SETUP.partners.find(p => daysLeft >= p.minDays && fb.units >= p.minUnits) || null : null;
      const done = kl && x.kirana != null ? { kirana: x.kirana } : null;
      const realised = M.realised(plan, sku, done, partner && partner.meals, SETUP.expiry, SETUP.destruction);
      const actual = M.actualNet(realised, price != null ? price : 0);
      const award = es ? M.award(es.units, price) : null;
      const support = M.priceSupport(realised, sku, price != null ? price : undefined);
      const expiry = realised.godown ? M.expirySettlement(realised.godown, sku, SETUP.expiry, SETUP.destruction) : null;
      // destroyed at the godown on expiry day, through the city's authorised agency; the evidence went up that
      // afternoon, Vision checked it, and Priya approved it the next morning, when Impact reported (SC-139)
      const agency = expiry && expiry.at === "godown" ? SETUP.destruction.agencies.find(a => a.city === d.city) : null;
      const destruction = agency ? {
        status: "approved", units: realised.godown, agency: { id: agency.id, name: agency.name, auth: agency.auth, site: agency.site }, method: SETUP.destruction.method,
        askedAt: bestBefore + "T10:00",
        photos: { before: { name: `${ref}-before.webp`, at: bestBefore + "T11:40" }, after: { name: `${ref}-after.webp`, at: bestBefore + "T13:20" } },
        sentAt: bestBefore + "T14:00", checkedAt: bestBefore + "T14:05",
        checks: [["batch", `Batch ${ref} read on the carton label`], ["count", `About ${Math.round(realised.godown / 10) * 10} packs in view (${realised.godown} left)`], ["slate", `The slate reads ${ref} · ${realised.godown} packets · ${bestBefore.slice(8, 10)}-${bestBefore.slice(5, 7)}-${bestBefore.slice(2, 4)}`], ["when", "Both photos taken that day, at the godown and the landfill"]].map(([id, label]) => ({ id, label, ok: true })),
        approvedAt: addDays(bestBefore, 1) + "T11:00", approvedBy: "priya",
        // destroyed in the 25 minutes up to the after photo, before the agency's own two witnesses (SC-174)
        window: { from: "12:55", to: "13:20" }, witnesses: agency.witnesses.map(w => ({ name: w.name, address: w.address, proof: w.proof, sign: w.sign })),
      } : null;
      // the staff sale (SC-174): every pack sold, paid by UPI over the sale's days, from the approval to an hour before
      // the sale was recorded; numbered below (each distributor's own series)
      const staffPaid = st ? P.staffPayments({ ref, units: st.units, price: st.price, staff: STAFF[distId], opens: at(flagged, "approve"), closes: at(flagged, "staff").slice(0, 11) + "17:00" }) : null;
      const steps = ["open", "detect", "photo", "read", "value", "route", "approve"]
        .concat(es ? ["listing"] : [], kl ? ["offer"] : [], fb ? ["donation", "pickup"] : [], kl ? ["orders"] : [], es ? ["bid", "counter", "accept"] : [])
        .concat(fb ? ["collect"] : [], kl && realised.godown ? ["closeOffer"] : [], st ? ["staff"] : [], es ? ["truck"] : [], ["papers"])
        .concat(es ? ["invoice"] : [], kl ? ["van"] : [], ["review"])
        .map(k => ({ step: k, at: at(flagged, k) }))
        // on expiry day: destroyed at the godown, evidenced and approved before Impact reports (SC-139)
        .concat(destruction ? [{ step: "destroyAsk", at: destruction.askedAt }, { step: "destroySent", at: destruction.sentAt }, { step: "destroyApproved", at: destruction.approvedAt }, { step: "report", at: addDays(bestBefore, 1) + "T11:30" }]
          : [{ step: "report", at: bestBefore + "T10:00" }]);
      return { ref, sku: skuId, distributor: distId, units, daysLeft, sellPerDay, flagged, bestBefore, mfg: batch.mfg, outcome, plan, bid, price, award, partner: partner && partner.name,
        kirana: kl ? { planned: kl.units, ordered: x.kirana != null ? x.kirana : kl.units } : null, staff: st ? st.units : null, staffPaid, realised, actual, support, expiry, destruction, steps, parties: parties(d) };
    });
    // each staff sale's consolidated receipt, in its distributor's own series, numbered back from his next (SC-174)
    const receiptCount = {}, receiptUsed = {};
    list.filter(b => b.staffPaid).forEach(b => (receiptCount[b.distributor] = (receiptCount[b.distributor] || 0) + 1));
    list.filter(b => b.staffPaid).forEach(b => {
      const sr = DISTRIBUTORS[b.distributor].receipts, n = sr.next - receiptCount[b.distributor] + (receiptUsed[b.distributor] = (receiptUsed[b.distributor] || 0) + 1) - 1;
      b.staffReceipt = P.staffReceipt({ no: sr.prefix + String(n).padStart(sr.width, "0"), payments: b.staffPaid });
      delete b.staffPaid;
    });
    // the papers, numbered back from the story's (INV/26-27/0931, CN/0117, ES-24117, FI/HYD/26-27/0417,
    // IFBN/ACK/26-27/0112) in the order they were issued: the listing, the receipt as the food bank collects, the
    // invoice then the credit note as the papers are drafted, the expiry credit note on expiry day
    const issued = [];
    list.forEach(b => b.steps.forEach(({ step, at: when }) => {
      if (step === "listing") issued.push({ b, when, series: "listing" });
      if (step === "collect") issued.push({ b, when, series: b.partner === "Feeding India" ? "receipt.feeding-india" : "receipt.india-foodbanking-network" });
      if (step === "papers") { if (b.award) issued.push({ b, when, series: "invoice" }); issued.push({ b, when: when + ":1", series: "support", kind: "support" }); }
      if (step === "report" && b.expiry && b.expiry.credit) issued.push({ b, when, series: "support", kind: "expiry" });
    }));
    issued.sort((a, z) => (a.when < z.when ? -1 : a.when > z.when ? 1 : a.b.ref < z.b.ref ? -1 : 1));
    const SERIES = { invoice: ["INV/26-27/", 931, 4], support: ["CN/", 117, 4], listing: ["ES-", 24117, 5], "receipt.feeding-india": ["FI/{city}/26-27/", 417, 4], "receipt.india-foodbanking-network": ["IFBN/ACK/26-27/", 112, 4] };
    const count = {}; issued.forEach(i => (count[i.series] = (count[i.series] || 0) + 1));
    const used = {};
    issued.forEach(i => {
      const [prefix, next, width] = SERIES[i.series];
      const n = next - count[i.series] + (used[i.series] = (used[i.series] || 0) + 1) - 1;
      const no = prefix.replace("{city}", i.b.parties.seller.city.slice(0, 3).toUpperCase()) + String(n).padStart(width, "0");
      i.b.numbers = Object.assign(i.b.numbers || {}, { [i.kind || i.series.replace(/^receipt\..*/, "receipt")]: no });
    });
    // each destruction's certificate, in its agency's own series, numbered back from the agency's next (SC-139)
    const agencyCount = {};
    list.filter(b => b.destruction).forEach(b => (agencyCount[b.destruction.agency.id] = (agencyCount[b.destruction.agency.id] || 0) + 1));
    const agencyUsed = {};
    list.filter(b => b.destruction).sort((a, z) => (a.destruction.sentAt < z.destruction.sentAt ? -1 : 1)).forEach(b => {
      const ag = SETUP.destruction.agencies.find(a => a.id === b.destruction.agency.id), sr = ag.series;
      const n = sr.next - agencyCount[ag.id] + (agencyUsed[ag.id] = (agencyUsed[ag.id] || 0) + 1) - 1;
      b.destruction.certificate = sr.prefix + String(n).padStart(sr.width, "0");
    });
    return { batches: list, start: Object.fromEntries(Object.entries(count).map(([k, n]) => [k, SERIES[k][1] - n])) };
  })();

  const slugOf = s => s.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  // a shop's account in the workspace, as world.js names it
  const shopMember = name => "kirana-" + slugOf(name);
  // the partner accounts with a face (SC-194): the films' cast (SC-154, SC-158, SC-187) for Lakshmi of Lakshmi Agencies
  // and the owner of Sri Lakshmi Ganapathi Kirana, her first shop in Begum Bazaar. Every other shop is its initials
  const PORTRAITS = { "lakshmi-owner": PEOPLE_IMG + "p-lakshmi.webp", [shopMember(HYDERABAD[0].name)]: PEOPLE_IMG + "p-lakshmi-ganapathi.webp" };

  // someone exploring the prototype steps into the story's people, by where they stand: inside Munchly, invited in, or
  // outside the workspace. The one-time code every invited number gets, and the accounts the sign-in suggests: each
  // distributor with one of its kiranas (SC-194)
  const EXPLORE = {
    groups: [
      { group: WORKSPACE.name, note: "staff · Google Workspace", ids: [["priya", "Approve the plan, review the papers, read the ledger"], ["arjun", "The workspace, its people and the guardrails"]] },
      { group: "Invited partners", note: "a one-time code or Google", ids: [["rakesh", "Give the permission, send the photo, run the van"], ["ganesh", "Order from the Hindi offer"], ["lakshmi-owner", "Send the photo, record the staff sale, run the van"], [shopMember(HYDERABAD[0].name), "Order from Lakshmi Agencies' offer"], ["meera", "Confirm a food-bank pickup"]] },
      { group: "Outside the workspace", note: "ExpireSoon, another company's marketplace", ids: [["agrawal", `Bid on the lot from ${BUYER.city}`]] },
    ],
    code: "246810",
    accounts: [["priya", PEOPLE.priya.email], ["rakesh", PEOPLE.rakesh.phone], ["ganesh", PEOPLE.ganesh.phone], ["shreesai", "+91 98230 60013"]],
  };

  /* ---------- the guided demo's three journeys (SC-168) ----------
     The stub runs one journey at a time, each following its own batch (its hero): the story's Masala Chips at Rakesh
     Traders, the default and as it always was, with the Mango Drink donation staged beside it; the Mango Drink at
     Lakshmi Agencies as the hero of its own journey (its scheme to her Hyderabad kiranas, her staff sale, its donation to
     Feeding India); or the chips again, slow: 23 of the 31 shops order, the window closes on the rest, and the packs left
     at Kalamna Market godown are destroyed there on expiry day, against evidence Priya approves (SC-139). Each story is
     everything its journey and screens read: its batch and people, the plan, the money as money.js works it out, the
     papers, the pushes, the timeline and the moments. flow.js runs it; ledger.js and the screens read it. */
  const clockAt = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  const lineIn = (p, id) => p.lines.find(l => l.id === id && l.units > 0) || null;
  const flagless = b => { const { hero: _h, second: _s, ...rest } = b; return rest; };
  const baseName = sku => sku.name.replace(/\s+\d+(\.\d+)?\s?(g|ml|kg|l)$/i, "");
  const tightName = sku => sku.name.replace(/(\d) (g|ml|kg|l)\b/gi, "$1$2");
  const STAGE_IDS = STAGES.map(s => s.id);

  // the story's own: every value is the constant the prototype always read, so the chips journey is unchanged
  const CHIPS_STORY = {
    key: "chips", title: "Masala Chips at Rakesh Traders", batch: hero, sku: chips, dist: DISTRIBUTORS.rakesh, buyer: BUYER, batches: BATCHES,
    accounts: { distributor: "rakesh", kirana: "ganesh", foodbank: "meera", buyer: "agrawal", decliner: null },
    people: PEOPLE, users: [], kiranas: KIRANAS, offered: OFFERED, shop: "k0", decliner: null, fills: true, scheme: "Masala Chips scheme",
    risk: RISK, plan: PLAN, KL, ES, ask: ASK, counter: COUNTER, award: AWARD, actual: ACTUAL, support: SUPPORT, supportPlan: SUPPORT_PLAN, claim: CLAIM,
    docs: DOCS, invoice: INVOICE, returnBy: RETURN_BY, realised: null, godownLeft: null, expiry: null,
    push: PUSH, chat: CHAT, events: EVENTS, journey: JOURNEY, listing: JOURNEY.listing,
    // the batch the same agents donate beside the story's (its pickup and receipt), and the second batch in motion
    donation: { batch: BATCHES[1], sku: SKUS.mango, dist: DISTRIBUTORS.lakshmi, plan: MANGO_PLAN, units: MANGO_FB, partner: FOODBANK, receipt: MANGO_RECEIPT },
    second: BATCHES[1],
    evidence: { before: "MF-2409-117-before.webp", after: "MF-2409-117-after.webp", slate: null, when: "Both photos taken today, at the godown and the landfill" },
    at: { ask: "09:05", photo: "09:19", read: "09:20", plan: "09:22", approve: "09:40", list: "09:41", offer: "09:41", closes: "Sun 4 Oct · 09:41", decline: "10:12", bid: "11:02", award: "11:09",
      dispatch: "Mon 5 Oct", invoice: "Mon 5 Oct", review: "Mon 5 Oct", van: "Tue 6 Oct", report: "30 Oct", staff: "Day 1", confirm: "Day 1", collect: "Day 4", expiry: "Expiry day" },
    // the day Impact posts it (the return window closed the day before), what it came to, and the van round's day
    cleared: addDays(RETURN_BY, 1), outcome: "sold", vanDay: 4, pron: "his",
    explore: EXPLORE, stages: STAGE_IDS, setupDone: false,
    // each stop's time on the tracker: the kit's own (product.jsx STAGE_TIMES) for the story
    times: null,
  };

  // the Mango Drink at Lakshmi Agencies, as the hero of its own journey: Setup is confirmed and she gave her permission on
  // 1 Oct (SETUP.permissions), so it starts at the Watcher's run. 22 days is too few for ExpireSoon, so its plan is the
  // scheme to her kiranas, her staff sale and a food bank; 52 of her 58 shops order its 1,372 packets by the cap rule
  const MANGO = BATCHES[1], MSKU = SKUS.mango, LAKSHMI = DISTRIBUTORS.lakshmi;
  const MANGO_RISK = M.assess(MANGO, MSKU);
  const MKL = lineIn(MANGO_PLAN, "kirana"), MST = lineIn(MANGO_PLAN, "staff");
  const MANGO_KIRANAS = HYDERABAD.filter(k => k.orders).map((k, i) => ({ id: k.id, name: k.name, area: k.area, units: k.orders, at: clockAt(9 * 60 + 48 + i * 3) }));
  const MANGO_SHOP = HYDERABAD[0];
  const MANGO_REALISED = M.realised(MANGO_PLAN, MSKU, null, FOODBANK.meals, SETUP.expiry, SETUP.destruction);
  const MANGO_SUPPORT = M.priceSupport(MANGO_REALISED, MSKU);
  const MANGO_ACTUAL = M.actualNet(MANGO_REALISED, 0);
  // the staff sale's consolidated receipt (SC-174): Lakshmi Agencies' staff paid by UPI from the evening the plan was
  // approved to the next afternoon, and she sends one receipt listing every payment; the next in her own series
  const MANGO_STAFF_RECEIPT = P.staffReceipt({ no: LAKSHMI.receipts.prefix + String(LAKSHMI.receipts.next).padStart(LAKSHMI.receipts.width, "0"),
    payments: P.staffPayments({ ref: MANGO.id, units: MST.units, price: MST.price, staff: STAFF.lakshmi, opens: `${DAY0}T16:30`, closes: `${addDays(DAY0, 1)}T15:00` }) });
  const MANGO_DOCS = M.documents(MANGO_REALISED, MSKU, null, MANGO_SUPPORT, { seller: LAKSHMI, buyer: BUYER, client: CLIENT }, MANGO_RECEIPT);
  const MANGO_RETURN_BY = addDays(MANGO.bestBefore, -M.RULES.returnWindowDays);
  const MANGO_TOOK = 9 * 60 + 48 + (MANGO_KIRANAS.length - 1) * 3 - (9 * 60 + 36), MANGO_HOURS = Math.round(MANGO_TOOK / 60);
  const lakshmiPerson = { id: "lakshmi-owner", name: LAKSHMI.name, short: LAKSHMI.short, role: "Owner, distributor", org: LAKSHMI.name, city: LAKSHMI.city, img: PORTRAITS["lakshmi-owner"], phone: "+91 98480 10550", sign: "Phone OTP", lang: "hi", kind: "partner" };
  const mangoShopPerson = { id: shopMember(MANGO_SHOP.name), name: MANGO_SHOP.name, short: MANGO_SHOP.name, role: "Owner, kirana", org: MANGO_SHOP.name, city: `${MANGO_SHOP.area}, ${LAKSHMI.city}`, img: PORTRAITS[shopMember(MANGO_SHOP.name)] || null, phone: "+91 98480 60011", sign: "Phone OTP", lang: "hi", kind: "partner" };
  const mGates = MANGO_RISK.gates.map(g => `${g.app} ${g.has}/${g.need}`).join(" · ");
  const MDN = JOURNEY.donation;
  const mangoPush = {
    detect: { to: "priya", at: "09:00", title: `${MSKU.name} · ${LAKSHMI.city}`, body: `Priya ji, ${LAKSHMI.city} godown mein ${tightName(MSKU)} (batch ${MANGO.id}) ki ${n0(MANGO_RISK.atRisk)} units ${fmt.day(MANGO.bestBefore)} se pehle nahi bikengi. Q-commerce block hai. Route dekhne ke liye tap karein.` },
    verify: { to: "lakshmi-owner", at: "09:05", title: "Ek photo chahiye", body: `${LAKSHMI.name}, ${tightName(MSKU)} ka ek carton ka label photo bhej dein (batch ${MANGO.id}). Bas ek photo, baaki hum kar lenge.` },
    plan: { to: "priya", at: "09:20", title: `Plan ready · ${MANGO.id}`, body: `Plan for ${MANGO.id}: ${n0(MKL.units)} units kirana (₹${MKL.price}), ${n0(MST.units)} units staff sale (₹${MST.price}), ${MANGO_FB} units food bank (₹0). Net ${inr(MANGO_PLAN.net)}, ${inr(MANGO_PLAN.swing)} better than write-off. GST ITC ${inr(MANGO_PLAN.itcRetained)} safe. Tap to review and approve.` },
    approved: { to: "lakshmi-owner", at: "09:35", title: `Plan approved · ${baseName(MSKU)}`, body: `${LAKSHMI.name}, Munchly ne ${MANGO.id} ka plan approve kiya: ${n0(MKL.units)} packets aapke kiranas ko scheme par, ${n0(MST.units)} godown ki staff sale mein, ${MANGO_FB} food bank ko. Kuch rokna ho to app mein Pause dabayein.` },
    offer: { to: mangoShopPerson.id, at: "09:36", title: "आज का खास ऑफर", hindi: true, body: `नमस्ते ${MANGO_SHOP.name}! Munchly ${tightName(MSKU)} पर आज खास ऑफर: 10 पैकेट लो, 2 मुफ़्त. Best before ${fmt.date(MANGO.bestBefore)}. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें — ${LAKSHMI.name}`, en: `Today's offer on Munchly ${MSKU.name}: buy 10 packets, get 2 free. Best before ${fmt.date(MANGO.bestBefore)}. 48 hours only. Tap to order. ${LAKSHMI.name}` },
    van: { to: "lakshmi-owner", at: "Tue 18:00", title: "Van route for Wednesday", body: `Van route for Wednesday updated: ${MANGO_KIRANAS.length} kiranas, ${n0(MKL.units)} packets.` },
    papers: { to: "priya", at: "Tue 6 Oct", title: `Document pack ready · ${MANGO.id}`, body: `Papers ready for ${MANGO.id}: price-support credit note, GST memo, FSSAI checklist, ${FOODBANK.name}'s receipt. Nothing to chase.` },
    support: { to: "lakshmi-owner", at: "Tue 6 Oct", title: "Credit note on its way", body: `Munchly's price-support credit note CN/0117 for ${inr(MANGO_SUPPORT.total)} is drafted for ${MANGO.id}: what the kiranas, the staff sale and the food bank fetched, made up to what you paid.` },
    closed: { to: "priya", at: "Wed 7 Oct", title: "Batch closed · 0 cartons destroyed", body: `${inr(MANGO_ACTUAL.net)} recovered, ${inr(MANGO_REALISED.itcRetained)} GST credit kept, ${fmt.kg(MANGO_REALISED.kg)} kept out of landfill, ${MANGO_REALISED.meals} meals.` },
  };
  const MANGO_EVENTS = [
    { key: "watch", stage: "detect", agent: "Watcher", icon: "radar", at: "09:00", min: 0, text: `Checked 312 batches across 4 distributors. ${MANGO.id} fails all three quick-commerce gates and will not sell through.`, calls: [["gates.check", mGates, "bad"], ["sellthrough.project", `${MANGO.sellPerDay}/day × ${MANGO_RISK.usableDays} days = ${n0(MANGO_RISK.willSell)} of ${n0(MANGO.units)}`, ""], ["pubsub.publish", "batch.at_risk", "ok"]] },
    { key: "ask", stage: "verify", agent: "Vision", icon: "scan-line", at: "09:05", min: 5, text: `Asked ${LAKSHMI.name} for one label photo before quoting any price.`, calls: [["fcm.send", `${LAKSHMI.name} · Hindi`, "ok"]] },
    { key: "photo", stage: "verify", person: "lakshmi-owner", at: "09:16", min: 11, text: `Sent one photo of the carton label from ${LAKSHMI.godown}.` },
    { key: "read", stage: "verify", agent: "Vision", icon: "scan-line", at: "09:17", min: 1, text: `Read the label: batch ${MANGO.id}, MFG ${fmt.date(MANGO.mfg)}, best before ${fmt.date(MANGO.bestBefore)}, MRP ${fmt.rate(MSKU.mrp)}, confidence 0.97. Matches the DMS record.`, calls: [["gemini.vision.read_label", "confidence 0.97", "ok"], ["dms.reconcile", "match", "ok"]] },
    { key: "value", stage: "value", agent: "Valuer", icon: "scale", at: "09:18", min: 1, text: `Priced five channels against ${MANGO.daysLeft} days left. Destroying costs ${fmt.inr2(-MANGO_PLAN.writeOff.perUnit)} a unit, ${inr(-MANGO_PLAN.writeOff.total)} for the batch.`, calls: [["bigquery.price_history", `${MSKU.category} · ${MANGO.daysLeft} days`, ""], ["gst.rate", `HSN ${MSKU.hsn} → ${Math.round(MSKU.gst * 100)}%`, ""], ["cost_sheet.input_gst", `${fmt.rate(M.itcOf(MSKU))} a pack, estimated`, ""], ["epr.factor", `₹${M.RULES.eprPerKg} / kg`, ""]] },
    { key: "route", stage: "decide", agent: "Router", icon: "split", at: "09:19", min: 1, text: `${n0(MKL.units)} units to the kirana cluster at ₹${MKL.price} effective, capped by what ${LAKSHMI.kiranas} kiranas can move in 14 days; ${n0(MST.units)} to the ${MST.name} at ₹${MST.price}; ${MANGO_FB} to a food bank. ExpireSoon needs 30+ days, so this batch cannot go there.`, calls: [["allocate.greedy", `${n0(MANGO_PLAN.units)} units → net ${inr(MANGO_PLAN.net)}`, "ok"]] },
    { key: "notify", stage: "approve", agent: "Notifier", icon: "bell", at: "09:20", min: 1, text: `Sent Priya the plan to review, and ${LAKSHMI.name} the same plan with a pause button.` },
    { key: "approved", stage: "approve", person: "priya", at: "09:35", min: 15, text: "Approved the plan from her phone.", human: true },
    { key: "outreach", stage: "execute", agent: "Outreach", icon: "send", at: "09:36", min: 1, text: `Pushed the Hindi scheme to ${LAKSHMI.kiranas} kiranas in the ${LAKSHMI.city} cluster: buy 10 get 2 for 48 hours, no shop over ${M.RULES.shopCapTimes}× its own 14-day sales.`, calls: [["fcm.send", `${LAKSHMI.kiranas} kiranas · Hindi`, "ok"]] },
    EV("donate") && Object.assign({}, EV("donate"), { at: "09:36", min: 0 }),
    { key: "orders", stage: "execute", agent: "Outreach", icon: "store", at: MANGO_KIRANAS[MANGO_KIRANAS.length - 1].at, min: MANGO_TOOK, text: `${MANGO_KIRANAS.length} of ${LAKSHMI.kiranas} kiranas ordered all ${n0(MKL.units)} units in about ${MANGO_HOURS} hours, each under its cap.`, calls: [["orders.sum", `${n0(MKL.units)} units · ${MANGO_KIRANAS.length} shops`, "ok"]] },
    { key: "staff", stage: "execute", person: "lakshmi-owner", at: "Day 1", min: 1200, text: `Recorded the staff sale at ${LAKSHMI.godown}: ${n0(MST.units)} of ${n0(MST.units)} packs sold at ₹${MST.price}, with the consolidated receipt ${MANGO_STAFF_RECEIPT.no} for ${MANGO_STAFF_RECEIPT.payments.length} UPI payments.` },
    { key: "collect", stage: "execute", person: "meera", at: "Day 4", min: 4320, text: `Collected ${MANGO_FB} packs at ${LAKSHMI.godown} and issued ${MANGO_RECEIPT.type.toLowerCase()} ${MANGO_RECEIPT.no}.` },
    { key: "papers", stage: "settle", agent: "Paperwork", icon: "file-check", at: "Tue 6 Oct", min: 30, text: `Issued the price-support credit note CN/0117, wrote the ITC memo and the FSSAI checklist, and filed ${FOODBANK.name}'s receipt ${MANGO_RECEIPT.no} with the pack.`, calls: [["docs.credit_note", inr(MANGO_SUPPORT.total), "ok"], ["itc.memo", `${inr(MANGO_REALISED.itcRetained)} retained`, "ok"], ["fssai.checklist", `${MANGO_FB} units`, "ok"]] },
    { key: "van", stage: "settle", person: "lakshmi-owner", at: "Wed 7 Oct", min: 1260, text: `Ran the Wednesday round: ${MANGO_KIRANAS.length} drops, ${n0(MKL.units)} packets.` },
    { key: "ledger", stage: "report", agent: "Impact", icon: "leaf", at: "Wed 7 Oct", min: 600, text: `The return window closed on ${fmt.day(MANGO_RETURN_BY)}. Posted the ledger: ${fmt.kg(MANGO_REALISED.kg)} diverted, ${fmt.kg(MANGO_REALISED.co2)} CO₂e avoided (indicative), ${MANGO_REALISED.meals} meals. BRSR row written.`, calls: [["ledger.post", inr(MANGO_ACTUAL.net), "ok"], ["brsr.rows", "Principle 6", "ok"]] },
  ].filter(Boolean);
  const MANGO_STORY = {
    key: "mango", title: "Mango Drink at Lakshmi Agencies", batch: Object.assign(flagless(MANGO), { hero: true }), sku: MSKU, dist: LAKSHMI, buyer: BUYER,
    batches: BATCHES.map(b => (b.id === MANGO.id ? Object.assign(flagless(b), { hero: true }) : flagless(b))),
    accounts: { distributor: "lakshmi-owner", kirana: mangoShopPerson.id, foodbank: "meera", buyer: null, decliner: null },
    people: Object.assign({}, PEOPLE, { "lakshmi-owner": lakshmiPerson, [mangoShopPerson.id]: mangoShopPerson }),
    users: [{ id: mangoShopPerson.id, name: MANGO_SHOP.name, short: MANGO_SHOP.name, org: MANGO_SHOP.name, role: "retailer", img: mangoShopPerson.img, provider: "phone", phone: mangoShopPerson.phone, email: "", status: "active", invitedBy: LAKSHMI.name, kind: "partner", lastSeen: null, extra: true }],
    kiranas: MANGO_KIRANAS, offered: LAKSHMI.kiranas, shop: MANGO_SHOP.id, decliner: null, fills: true, scheme: `${baseName(MSKU)} scheme`,
    risk: MANGO_RISK, plan: MANGO_PLAN, KL: MKL, ES: null, ask: null, counter: null, award: null, actual: MANGO_ACTUAL, support: MANGO_SUPPORT, supportPlan: MANGO_SUPPORT, claim: M.expiryClaim(MANGO_PLAN.units, MSKU),
    docs: MANGO_DOCS, invoice: null, returnBy: MANGO_RETURN_BY, staffReceipt: MANGO_STAFF_RECEIPT, realised: MANGO_REALISED, godownLeft: null, expiry: null,
    push: mangoPush, chat: [], events: MANGO_EVENTS,
    journey: { today: JOURNEY.today, planMinutes: 15, permissionAsked: SETUP.permissions.lakshmi, listing: null,
      van: { day: "Wednesday", date: "Wed 7 Oct", leaves: "07:00", depot: LAKSHMI.godown, reply: "Theek hai. Budhwar subah nikal jayenge.", replyAt: "Tue 18:04" },
      donation: MDN },
    listing: null,
    donation: { batch: MANGO, sku: MSKU, dist: LAKSHMI, plan: MANGO_PLAN, units: MANGO_FB, partner: FOODBANK, receipt: MANGO_RECEIPT },
    second: null,
    evidence: { before: `${MANGO.id}-before.webp`, after: `${MANGO.id}-after.webp`, slate: null, when: "Both photos taken at the godown and the landfill" },
    at: { ask: "09:05", photo: "09:16", read: "09:17", plan: "09:19", approve: "09:35", offer: "09:36", closes: "Sun 4 Oct · 09:36", decline: "10:12", staff: "Day 1", confirm: "Day 1", collect: "Day 4",
      review: "Tue 6 Oct", van: "Wed 7 Oct", report: "Wed 7 Oct", expiry: "Expiry day" },
    cleared: "2026-10-07", outcome: "donation", vanDay: 5, pron: "its",
    explore: { groups: [
      { group: WORKSPACE.name, note: "staff · Google Workspace", ids: [["priya", "Approve the plan, review the papers, read the ledger"], ["arjun", "The workspace, its people and the guardrails"]] },
      { group: "Invited partners", note: "a one-time code or Google", ids: [["lakshmi-owner", "Send the photo, record the staff sale, run the van"], [mangoShopPerson.id, "Order from the Hindi offer"], ["meera", "Confirm and collect the food-bank pickup"]] },
    ], code: EXPLORE.code, accounts: [["priya", PEOPLE.priya.email], ["lakshmi-owner", lakshmiPerson.phone], [mangoShopPerson.id, mangoShopPerson.phone]] },
    stages: STAGE_IDS.filter(id => id !== "connect"), setupDone: true,
    // word joiners keep a range whole on the tracker, as the kit's own times do
    times: { connect: "1 Oct", detect: "09:00", verify: "09:17", value: "09:18", decide: "09:19", approve: "09:35", execute: "day 0\u2060–\u20604", settle: "day 4\u2060–\u20605", report: `after ${fmt.day(MANGO_RETURN_BY)}` },
  };

  // the chips, slow: the same batch and plan, but 23 of the 31 shops order (444 of 588 packets), Shubham Provision says
  // Not this time, and the window closes on the rest; the lot still sells on the counter. On expiry day the 144 packs
  // left at Kalamna Market godown are destroyed there through the city's authorised agency, by Munchly's policy
  // (SC-139): Rakesh sends two photos and the certificate, Vision checks them, and Priya's second yes issues the expiry
  // credit note and lets Impact report
  const SLOW_SHOPS = 23, SLOW_DECLINER = KIRANAS[SLOW_SHOPS + 0];
  const SLOW_KIRANAS = KIRANAS.slice(0, SLOW_SHOPS);
  const SLOW_ORDERED = SLOW_KIRANAS.reduce((t, k) => t + k.units, 0);
  const SLOW_REALISED = M.realised(PLAN, chips, { kirana: SLOW_ORDERED }, null, SETUP.expiry, SETUP.destruction);
  const SLOW_ACTUAL = M.actualNet(SLOW_REALISED, COUNTER.price);
  const SLOW_SUPPORT = M.priceSupport(SLOW_REALISED, chips, COUNTER.price);
  const SLOW_EXPIRY = M.expirySettlement(SLOW_REALISED.godown, chips, SETUP.expiry, SETUP.destruction);
  const SLOW_DOCS = M.documents(SLOW_REALISED, chips, AWARD, SLOW_SUPPORT, { seller: DISTRIBUTORS.rakesh, buyer: BUYER, client: CLIENT });
  SLOW_DOCS.find(d => d.id === "invoice").date = INVOICE.date;
  const SLOW_AGENCY = SETUP.destruction.agencies.find(a => a.city === DISTRIBUTORS.rakesh.city);
  const SLOW_CERT = SLOW_AGENCY.series.prefix + String(SLOW_AGENCY.series.next).padStart(SLOW_AGENCY.series.width, "0");
  const slowShopPerson = { id: shopMember(SLOW_DECLINER.name), name: SLOW_DECLINER.name, short: SLOW_DECLINER.name, role: "Owner, kirana", org: SLOW_DECLINER.name, city: `${SLOW_DECLINER.area}, Nagpur`, phone: "+91 98230 60034", sign: "Phone OTP", lang: "hi", kind: "partner" };
  const slate = iso => `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(2, 4)}`;
  const godown = DISTRIBUTORS.rakesh.godown, left = SLOW_REALISED.godown;
  const slowEvent = (key, patch) => Object.assign({}, EV(key), patch);
  const SLOW_EVENTS = EVENTS.filter(e => !["donate", "orders", "papers", "van", "ledger"].includes(e.key)).concat([
    { key: "orders", stage: "execute", agent: "Outreach", icon: "store", at: SLOW_KIRANAS[SLOW_SHOPS - 1].at, min: 5, text: `${SLOW_SHOPS} of ${OFFERED} kiranas ordered ${n0(SLOW_ORDERED)} of ${KL.units} units in the first two hours, each under its cap.`, calls: [["orders.sum", `${n0(SLOW_ORDERED)} units · ${SLOW_SHOPS} shops`, "ok"]] },
    { key: "closeOffer", stage: "execute", agent: "Outreach", icon: "store", at: "Sun 09:41", min: 2787, text: `The 48-hour window closed: ${SLOW_SHOPS} of ${OFFERED} kiranas ordered ${n0(SLOW_ORDERED)} of ${KL.units} packets. The ${n0(left)} no shop took stay at ${godown}.`, calls: [["offer.close", `${n0(left)} packets unordered`, ""]] },
    slowEvent("papers", { calls: [["docs.invoice", `${inr(INVOICE.total)} · draft`, "ok"], ["eway.check", "below ₹50,000", ""], ["docs.credit_note", inr(SLOW_SUPPORT.total), "ok"], ["itc.memo", `${inr(SLOW_REALISED.itcRetained)} retained`, "ok"]] }),
    slowEvent("van", { text: `Ran the Tuesday round: ${SLOW_SHOPS} drops, ${n0(SLOW_ORDERED)} packets.` }),
    { key: "expire", stage: "report", agent: "Impact", icon: "warehouse", at: "18 Nov", min: 60000, text: `Expiry day: the journey closed as it stood. ${n0(left)} packs no channel took expired at ${godown}.` },
    { key: "destroyAsk", stage: "report", agent: "Impact", icon: "recycle", at: "18 Nov · 10:00", min: 0, text: `Asked Rakesh Traders to destroy the ${n0(left)} packs left at ${godown} through an authorised agency, and to send two photos and the agency's certificate number.`, calls: [["fcm.send", "Rakesh bhai · Hindi", "ok"]] },
    { key: "destroySent", stage: "report", person: "rakesh", at: "18 Nov · 14:00", min: 240, text: `Sent the destruction's evidence: two photos, ${SLOW_AGENCY.name}, certificate ${SLOW_CERT}.` },
    { key: "destroyChecked", stage: "report", agent: "Vision", icon: "scan-line", at: "18 Nov · 14:05", min: 5, text: `Checked the evidence: batch ${hero.id} on the carton label, about ${Math.round(left / 10) * 10} packs in view, and the slate at the landfill reads ${hero.id} · ${left} packets · ${slate(hero.bestBefore)}. 4 of 4 checks pass.`, calls: [["gemini.vision.check_destruction", "4 of 4 checks", "ok"]] },
    { key: "destroyApproved", stage: "report", person: "priya", at: "19 Nov · 11:00", min: 1255, text: `Approved the destruction of ${n0(left)} packs at ${godown}.`, human: true },
    { key: "ledger", stage: "report", agent: "Impact", icon: "leaf", at: "19 Nov", min: 30, text: `The return window closed on ${fmt.day(RETURN_BY)}. Posted the ledger: ${fmt.kg(SLOW_REALISED.kg)} diverted, ${fmt.kg(SLOW_REALISED.co2)} CO₂e avoided (indicative), 0 meals. BRSR row written.`, calls: [["ledger.post", inr(SLOW_ACTUAL.net), "ok"], ["brsr.rows", "Principle 6", "ok"]] },
  ]);
  const SLOW_STORY = Object.assign({}, CHIPS_STORY, {
    key: "slow", title: "Masala Chips, a slow scheme", batches: BATCHES.map(b => (b.second ? flagless(b) : b)),
    accounts: { distributor: "rakesh", kirana: "ganesh", foodbank: null, buyer: "agrawal", decliner: slowShopPerson.id },
    people: Object.assign({}, PEOPLE, { [slowShopPerson.id]: slowShopPerson }),
    users: [{ id: slowShopPerson.id, name: SLOW_DECLINER.name, short: SLOW_DECLINER.name, org: SLOW_DECLINER.name, role: "retailer", provider: "phone", phone: slowShopPerson.phone, email: "", status: "active", invitedBy: DISTRIBUTORS.rakesh.name, kind: "partner", lastSeen: null, extra: true }],
    kiranas: SLOW_KIRANAS, decliner: SLOW_DECLINER.id, fills: false,
    actual: SLOW_ACTUAL, support: SLOW_SUPPORT, docs: SLOW_DOCS, realised: SLOW_REALISED, expiry: SLOW_EXPIRY,
    godownLeft: { lines: SLOW_REALISED.lines.filter(l => l.id !== "writeoff" && l.units > 0).map(l => ({ id: l.id, units: l.units })), godown: left },
    push: Object.assign({}, PUSH, {
      van: { to: "rakesh", at: "Mon 18:00", title: "Van route for Tuesday", body: `Van route for Tuesday updated: ${SLOW_SHOPS} kiranas, ${n0(SLOW_ORDERED)} packets. The ${BUYER.city} lot (${ES.units}) is collected by the buyer's truck once the balance lands.` },
      invoice: { to: "rakesh", at: "Mon 5 Oct", title: "Invoice draft ready", body: `Invoice draft to ${BUYER.name}, ${BUYER.city}: ${ES.units} × ₹${COUNTER.price.toFixed(2)}, IGST ${INVOICE.gstPct}%, ${inr(INVOICE.total)}. Issue it from Tally. Munchly's price support of ${inr(SLOW_SUPPORT.total)} is on its way.` },
      destroy: { to: "rakesh", at: "18 Nov · 10:00", title: "Expired packs destroy karein", body: `Rakesh bhai, ${tightName(chips)} (batch ${hero.id}) ke ${n0(left)} packs ${godown} mein expire ho gaye. Authorised agency se destroy karwayein, aur do photo aur certificate number bhej dein. Munchly credit note dega.` },
      evidence: { to: "priya", at: "18 Nov · 14:05", title: `Review the destruction · ${hero.id}`, body: `Rakesh Traders sent the evidence for ${n0(left)} packs at ${godown}, and Vision checked both photos. Your yes issues the expiry credit note and the agency's certificate.` },
    }),
    events: SLOW_EVENTS, donation: null, second: null,
    evidence: { before: `${hero.id}-before.webp`, after: `${hero.id}-after-expiry.webp`, slate: slate(hero.bestBefore), when: "Both photos taken on expiry day, at the godown and the landfill" },
    agency: SLOW_AGENCY, certificate: SLOW_CERT, expiryNo: "CN/0118",
    at: Object.assign({}, CHIPS_STORY.at, { closed: "Sun 4 Oct · 09:41", report: "19 Nov", expiry: "18 Nov", approved: "19 Nov" }),
    // expiry day is the batch's best-before; Priya approves the evidence the next morning, when Impact reports
    expiryDay: hero.bestBefore, cleared: addDays(hero.bestBefore, 1), outcome: "leftover",
    times: { connect: "once", detect: "09:00", verify: "09:20", value: "09:21", decide: "09:22", approve: "09:40", execute: "day 0\u2060–\u20603", settle: "day 3\u2060–\u20604", report: `on ${fmt.day(hero.bestBefore)}` },
    explore: { groups: EXPLORE.groups.map(g => (g.group === "Invited partners" ? Object.assign({}, g, { ids: g.ids.filter(([id]) => id !== "meera").concat([[slowShopPerson.id, "Say Not this time to the scheme"]]) }) : g)), code: EXPLORE.code, accounts: EXPLORE.accounts },
  });
  const STORIES = { chips: CHIPS_STORY, mango: MANGO_STORY, slow: SLOW_STORY };
  const SCENARIOS = Object.keys(STORIES);
  // a journey's story by its key (the stub's state.scenario; chips when it has none)
  const storyOf = key => STORIES[key] || CHIPS_STORY;

  // the signatures drawn on the slow chips' certificate at the landfill (SC-183, option B): each signer's strokes as the
  // pad keeps them (its 640 x 220 box), traced from the specimen scans (designs/SC-183/tools/strokes.py), so the stub,
  // the guided demo and backend-api's walk can sign as a person would. Every name and signature is fictional
  const STROKES = {"rakesh":{"box":[640,220],"strokes":[[[66.4,99.6],[64.6,95.9],[64.6,90.2],[70.2,79.9],[81.4,67.8],[95.5,56.5],[116.1,45.2],[130.2,41.5],[145.2,41.5],[154.6,46.2],[157.4,49.0],[159.2,53.7],[159.2,61.2],[154.6,72.4],[141.4,85.6],[120.8,100.6],[115.2,100.6],[112.4,98.7],[103.9,100.6],[99.2,105.2],[100.2,107.1],[110.5,105.2],[114.2,100.6]],[[98.3,140.9],[101.1,130.6],[111.4,105.2]],[[128.3,52.8],[127.4,64.0],[115.2,94.9],[115.2,98.7]],[[201.4,131.5],[189.2,136.2],[173.3,133.4],[155.5,124.9],[121.8,101.5]],[[194.9,99.6],[183.6,108.1],[178.9,109.9],[176.1,104.3],[178.9,100.6],[178.9,94.9],[174.2,94.0],[169.6,96.8],[162.1,104.3],[159.2,108.1],[159.2,111.8],[163.0,112.8],[173.3,105.2],[175.2,105.2]],[[172.4,160.6],[175.2,160.6],[181.8,155.9],[200.5,149.3],[221.1,143.7],[253.9,137.1],[293.3,133.4],[295.2,137.1],[292.4,139.9],[283.9,143.7]],[[191.1,117.4],[197.7,101.5],[197.7,96.8],[199.6,92.1],[204.2,89.3]],[[215.5,92.1],[213.6,89.3],[211.8,90.2],[198.6,101.5]],[[212.7,79.0],[222.1,64.0],[222.1,55.6],[220.2,53.7],[216.4,54.6],[211.8,60.2],[208.0,67.8],[200.5,90.2]],[[204.2,97.8],[208.9,103.4],[213.6,106.2],[219.2,108.1],[227.7,106.2]],[[219.2,87.4],[216.4,90.2],[214.6,89.3]],[[250.2,99.6],[237.1,108.1],[233.3,109.0],[230.5,108.1],[227.7,105.2],[227.7,98.7],[236.1,89.3],[238.9,90.2],[238.9,94.0],[237.1,97.8],[231.4,103.4],[228.6,104.3]],[[249.2,112.8],[253.9,108.1],[258.6,107.1],[260.5,105.2],[260.5,102.4],[253.9,98.7],[251.1,95.9],[251.1,94.0],[258.6,86.5],[261.4,85.6]],[[252.1,111.8],[257.7,108.1]],[[261.4,103.4],[268.0,101.5],[279.2,94.9],[282.1,88.4],[282.1,81.8],[285.8,68.7],[290.5,62.1],[294.2,63.1],[294.2,69.6],[291.4,77.1],[285.8,86.5],[283.0,88.4]],[[275.5,106.2],[279.2,101.5],[282.1,100.6],[288.6,94.9],[291.4,95.9],[290.5,105.2],[293.3,108.1],[296.1,109.0],[299.9,108.1],[306.4,104.3]],[[278.3,96.8],[278.3,101.5]],[[367.4,65.9],[367.4,76.2],[358.9,109.9],[340.2,121.2],[320.5,139.9],[314.9,148.4],[311.1,158.7],[311.1,167.1],[316.8,174.6],[323.3,176.5],[329.9,173.7],[339.2,162.4],[345.8,148.4],[358.0,111.8]],[[352.4,69.6],[344.9,73.4],[340.2,73.4],[338.3,71.5],[338.3,68.7],[350.5,56.5],[363.6,48.1],[382.4,40.6],[391.8,40.6],[394.6,43.4],[394.6,45.2]],[[359.9,109.0],[374.9,104.3]],[[390.8,94.9],[384.2,95.9],[373.9,106.2],[372.1,110.9],[373.9,112.8],[376.8,111.8],[387.1,103.4],[388.9,99.6],[388.9,95.9]],[[409.6,94.9],[406.8,95.9],[394.6,107.1],[389.9,108.1],[387.1,106.2],[387.1,104.3]],[[418.0,103.4],[411.4,108.1],[406.8,109.0],[404.9,107.1],[404.9,104.3],[408.6,96.8]],[[416.1,112.8],[429.2,106.2],[429.2,103.4],[421.8,96.8],[421.8,94.9],[425.5,91.2],[428.3,91.2]],[[440.5,94.9],[437.7,100.6],[438.6,107.1],[445.2,103.4],[448.0,97.8]],[[459.2,91.2],[454.6,104.3],[451.8,107.1],[449.9,107.1],[447.1,105.2],[447.1,103.4]],[[533.3,108.1],[526.8,111.8],[513.6,113.7],[506.1,111.8],[501.4,107.1],[498.6,98.7],[486.4,104.3],[478.9,104.3],[475.2,98.7],[477.1,95.9],[476.1,92.1],[470.5,94.0],[462.1,102.4],[463.9,106.2],[474.2,99.6]],[[499.6,98.7],[518.3,80.9],[523.0,73.4],[528.6,61.2],[528.6,57.4],[524.9,52.8],[519.2,55.6],[512.7,63.1],[507.1,74.3],[501.4,90.2],[501.4,94.9]]]},"oce":{"box":[640,220],"strokes":[[[65.5,122.1],[63.6,126.8],[63.6,135.2],[65.5,139.9],[70.2,144.6],[80.5,148.4],[91.8,148.4],[104.9,145.6],[113.3,142.8],[127.4,135.2],[139.6,123.1],[141.4,118.4],[140.5,109.0],[134.9,103.4],[131.1,101.5],[94.6,91.2],[86.1,83.7],[85.2,76.2],[88.0,69.6],[103.0,54.6],[121.8,44.3],[137.7,39.6],[151.8,39.6],[156.4,43.4],[157.4,48.1],[149.9,61.2],[140.5,68.7],[129.2,74.3]],[[153.6,136.2],[155.5,136.2],[158.3,132.4]],[[197.7,98.7],[194.9,95.9],[194.9,91.2],[199.6,81.8],[208.0,73.4],[218.3,66.8],[223.9,65.9],[226.8,68.7],[227.7,79.9],[223.9,89.3],[215.5,100.6],[206.1,107.1],[203.3,105.2]],[[196.8,136.2],[199.6,124.0],[200.5,111.8],[202.4,109.0],[202.4,97.8],[204.2,91.2],[204.2,85.6],[206.1,81.8]],[[204.2,132.4],[204.2,136.2],[206.1,138.1],[208.9,138.1],[218.3,132.4],[227.7,122.1],[231.4,114.6],[230.5,108.1],[227.7,109.0],[212.7,122.1],[205.2,131.5]],[[240.8,129.6],[239.9,128.7],[240.8,102.4],[238.9,101.5],[231.4,105.2],[226.8,100.6],[218.3,99.6],[216.4,100.6]],[[240.8,101.5],[245.5,87.4],[256.8,77.1],[258.6,78.1],[258.6,83.7],[250.2,94.0],[243.6,97.8]],[[284.9,106.2],[276.4,109.0],[272.7,104.3],[268.0,105.2],[264.2,109.9],[262.4,120.2],[255.8,126.8],[253.9,126.8],[251.1,124.0],[251.1,112.8],[250.2,111.8],[244.6,116.5],[241.8,121.2]],[[261.4,122.1],[266.1,125.9],[271.8,122.1],[275.5,112.8],[271.8,111.8],[268.9,113.7],[265.2,113.7]],[[268.0,161.5],[268.0,172.8],[271.8,176.5],[275.5,176.5],[280.2,173.7],[288.6,157.8],[291.4,149.3],[291.4,144.6],[288.6,143.7],[278.3,149.3],[268.9,160.6]],[[298.0,99.6],[298.0,105.2],[296.1,111.8],[291.4,115.6],[285.8,123.1],[282.1,121.2],[283.9,108.1]],[[310.2,135.2],[296.1,140.9],[292.4,139.9],[295.2,125.9],[296.1,112.8]],[[319.6,104.3],[316.8,109.0],[315.8,114.6],[308.3,122.1],[304.6,120.2],[304.6,115.6],[307.4,109.0],[313.9,102.4],[316.8,102.4],[317.7,104.3]],[[313.9,134.3],[351.4,124.9],[395.5,119.3],[410.5,120.2],[413.3,123.1],[410.5,126.8],[403.9,130.6]],[[332.7,94.0],[329.9,103.4],[324.2,114.6],[320.5,117.4],[315.8,116.5]],[[354.2,108.1],[345.8,113.7],[335.5,117.4],[333.6,114.6],[333.6,111.8],[337.4,98.7],[332.7,97.8]]]},"oce-w1":{"box":[640,220],"strokes":[[[74.9,91.2],[66.4,86.5],[65.5,83.7],[66.4,79.0],[69.2,74.3],[86.1,59.3],[104.9,49.0],[118.0,44.3],[130.2,41.5],[148.9,41.5],[160.2,45.2],[166.8,51.8],[169.6,58.4],[169.6,66.8],[166.8,74.3],[161.1,82.8],[148.9,94.9],[142.4,99.6],[130.2,105.2],[120.8,105.2],[116.1,103.4],[117.1,96.8],[128.3,62.1],[128.3,58.4]],[[102.1,164.3],[101.1,156.8],[108.6,124.9],[114.2,108.1],[113.3,102.4]],[[146.1,125.9],[147.1,126.8],[150.8,124.9],[157.4,118.4],[161.1,117.4],[176.1,107.1],[181.8,106.2],[186.4,107.1],[190.2,109.9],[194.9,105.2],[197.7,104.3],[200.5,105.2]],[[157.4,132.4],[156.4,131.5],[161.1,118.4]],[[163.0,104.3],[162.1,115.6]],[[204.2,110.9],[199.6,116.5],[185.5,127.8],[182.7,126.8],[181.8,123.1],[184.6,116.5],[189.2,110.9]],[[200.5,116.5],[201.4,122.1],[203.3,124.0],[208.0,123.1],[213.6,118.4]],[[249.2,66.8],[239.9,94.9],[235.2,103.4],[235.2,107.1],[229.6,111.8],[220.2,123.1],[216.4,123.1],[214.6,117.4],[219.2,108.1],[224.9,101.5],[229.6,99.6],[235.2,102.4]],[[234.2,109.0],[236.1,117.4],[238.9,120.2],[243.6,119.3],[250.2,113.7],[251.1,107.1],[253.9,100.6],[260.5,94.9],[263.3,96.8],[263.3,100.6],[258.6,106.2],[252.1,109.9]],[[250.2,114.6],[254.9,119.3],[260.5,119.3],[269.9,112.8],[273.6,105.2],[273.6,100.6],[278.3,94.9],[281.1,94.0],[283.0,95.9],[283.0,98.7],[280.2,102.4],[276.4,105.2],[274.6,105.2],[275.5,104.3],[274.6,103.4]],[[270.8,113.7],[273.6,116.5],[280.2,116.5],[288.6,110.9],[294.2,109.0]],[[281.1,154.9],[292.4,119.3],[294.2,117.4],[294.2,110.9],[298.9,100.6],[298.9,93.1]],[[295.2,118.4],[300.8,118.4],[309.2,113.7],[313.9,109.0],[317.7,102.4],[317.7,96.8],[313.9,93.1],[309.2,93.1],[299.9,97.8]],[[335.5,175.6],[378.6,165.2],[419.9,159.6],[451.8,159.6],[463.0,161.5],[470.5,165.2]],[[336.4,122.1],[341.1,113.7],[348.6,92.1],[358.0,70.6],[357.1,62.1]],[[358.9,66.8],[360.8,66.8],[363.6,64.0],[368.3,55.6],[373.0,50.9],[376.8,49.9],[377.7,50.9],[377.7,63.1],[375.8,67.8],[376.8,70.6]],[[365.5,96.8],[373.0,81.8],[375.8,72.4],[381.4,67.8],[385.2,61.2],[390.8,55.6],[393.6,54.6],[395.5,57.4],[394.6,68.7],[388.9,100.6],[388.9,119.3],[391.8,129.6],[396.4,135.2],[402.1,138.1],[412.4,138.1],[438.6,130.6]],[[396.4,102.4],[402.1,102.4],[403.0,99.6],[406.8,95.9],[405.8,93.1],[410.5,88.4],[413.3,87.4],[415.2,89.3],[415.2,93.1],[409.6,97.8],[407.7,96.8],[405.8,97.8]],[[445.2,85.6],[437.7,86.5],[433.9,90.2],[433.9,92.1],[417.1,107.1],[408.6,109.0],[403.9,105.2],[403.0,102.4]],[[428.3,109.9],[429.2,112.8],[438.6,109.9],[444.2,104.3],[444.2,100.6]],[[429.2,109.0],[441.4,99.6]],[[451.8,108.1],[456.4,100.6],[455.5,93.1],[450.8,94.0],[443.3,99.6],[434.9,93.1]],[[446.1,170.9],[449.9,169.0],[463.9,167.1],[467.7,165.2]],[[471.4,53.7],[472.4,55.6],[471.4,59.3],[458.3,91.2],[456.4,93.1],[461.1,95.9],[466.8,90.2],[470.5,89.3],[471.4,94.0],[469.6,101.5],[471.4,104.3],[475.2,103.4],[478.9,99.6],[484.6,96.8],[491.1,88.4],[497.7,84.6],[506.1,83.7],[509.9,87.4],[505.2,96.8],[507.1,99.6],[509.9,99.6],[513.6,95.9],[519.2,93.1],[520.2,90.2],[523.9,86.5]],[[483.6,103.4],[485.5,99.6],[484.6,97.8],[483.6,98.7]],[[489.2,82.8],[490.2,88.4]],[[520.2,82.8],[517.4,81.8],[510.8,86.5],[508.0,84.6]],[[537.1,95.9],[536.1,94.0],[538.0,90.2],[536.1,87.4],[533.3,88.4],[524.9,95.9],[522.1,95.9],[520.2,93.1]],[[538.9,82.8],[538.9,85.6],[537.1,87.4],[540.8,87.4],[548.3,81.8],[550.2,81.8],[551.1,85.6],[553.0,86.5],[559.6,80.9],[563.3,79.9],[564.2,80.9],[563.3,87.4],[564.2,92.1],[569.9,95.9],[576.4,94.9],[585.8,91.2]],[[548.3,95.9],[548.3,93.1],[552.1,87.4]]]},"oce-w2":{"box":[640,220],"strokes":[[[66.4,127.8],[88.9,122.1],[99.2,120.2],[102.1,121.2],[105.8,119.3],[109.6,110.9],[132.1,80.9],[152.7,58.4],[167.7,46.2],[170.5,47.1],[170.5,53.7],[167.7,64.9],[152.7,107.1],[152.7,109.9],[150.8,111.8],[145.2,111.8],[113.3,118.4],[107.7,118.4]],[[77.7,133.4],[69.2,128.7]],[[80.5,165.2],[79.6,163.4],[80.5,158.7],[99.2,127.8],[101.1,122.1]],[[138.6,163.4],[141.4,144.6],[150.8,112.8]],[[153.6,109.9],[161.1,109.9],[173.3,107.1]],[[157.4,176.5],[167.7,169.9],[185.5,163.4],[207.1,156.8],[253.0,146.5],[318.6,138.1],[347.7,137.1],[348.6,136.2],[368.3,136.2],[378.6,138.1]],[[189.2,102.4],[187.4,99.6],[182.7,100.6],[174.2,108.1],[175.2,116.5],[187.4,127.8],[188.3,130.6],[185.5,138.1],[182.7,140.9],[178.0,143.7],[172.4,143.7],[171.4,142.8],[172.4,138.1],[179.9,130.6],[194.9,120.2],[198.6,118.4],[202.4,118.4],[204.2,112.8],[207.1,109.9],[208.9,109.9],[216.4,101.5],[231.4,79.0],[234.2,71.5],[233.3,64.0],[225.8,66.8],[217.4,78.1],[210.8,91.2],[205.2,110.9]],[[201.4,130.6],[202.4,119.3]],[[265.2,105.2],[263.3,107.1],[261.4,114.6],[250.2,124.0],[246.4,124.9],[243.6,124.0],[241.8,119.3],[232.4,124.0],[227.7,124.0],[225.8,122.1],[225.8,114.6],[227.7,110.9],[227.7,107.1],[224.9,106.2],[221.1,108.1],[206.1,124.0],[203.3,124.9]],[[243.6,116.5],[246.4,111.8],[253.9,105.2],[259.6,103.4],[263.3,106.2]],[[288.6,111.8],[286.8,114.6],[270.8,121.2],[264.2,121.2],[261.4,115.6]],[[311.1,132.4],[324.2,105.2],[322.4,101.5],[317.7,100.6],[315.8,97.8]],[[358.0,44.3],[334.6,85.6],[331.8,94.0],[324.2,102.4]],[[402.1,141.8],[392.7,139.9],[368.3,130.6],[342.1,116.5],[329.9,108.1],[324.2,106.2]],[[392.7,48.1],[392.7,50.9],[390.8,53.7],[372.1,70.6],[343.0,90.2],[334.6,94.9],[331.8,94.9]],[[362.7,109.9],[362.7,112.8],[364.6,114.6],[370.2,114.6],[377.7,109.0],[381.4,108.1],[384.2,103.4],[386.1,94.9],[382.4,92.1],[378.6,92.1],[373.9,94.9],[366.4,102.4],[363.6,109.0]],[[383.3,108.1],[383.3,110.9],[385.2,112.8],[389.9,112.8],[406.8,102.4],[406.8,98.7],[409.6,94.0],[408.6,89.3],[415.2,71.5],[422.7,57.4],[428.3,49.0],[433.9,43.4],[437.7,41.5],[441.4,43.4],[440.5,55.6],[431.1,71.5],[418.0,88.4],[412.4,94.0],[410.5,94.0],[411.4,93.1],[410.5,92.1]],[[406.8,104.3],[406.8,109.0],[411.4,113.7],[418.9,113.7],[433.9,106.2]],[[482.7,102.4],[455.5,109.0],[448.0,109.9],[437.7,109.0],[434.9,106.2],[433.9,102.4],[434.9,95.9],[442.4,86.5],[447.1,84.6],[450.8,88.4],[449.9,92.1],[440.5,101.5],[435.8,103.4]]]}};
  window.SC3_DATA = { DAY0, STROKES, addDays, PLATFORM, WORKSPACE, CLIENT, SKUS, DISTRIBUTORS, BUYER, PEOPLE, KIRANAS, OFFERED, BATCHES, STAGES, PUSH, CHAT, EVENTS, EV, QUARTER, SETUP,
    STAFF, PORTRAITS, RISK, PLAN, ASK, COUNTER, AWARD, ACTUAL, SUPPORT, SUPPORT_PLAN, CLAIM, DOCS, INVOICE, MANGO_PLAN, MANGO_FB, MANGO_RECEIPT, RETURN_BY, IMG, JOURNEY, MARKET, EXPLORE, HISTORY, HISTORY_AT,
    HYDERABAD, SCENARIOS, STORIES, storyOf,
    // the story of the journey the store holds now (the store's scenario; the chips before the store has loaded)
    story: state => storyOf(((state || (window.SC3_STORE && window.SC3_STORE.get()) || {}).scenario) || "chips"),
    batchView: b => { const sku = SKUS[b.sku]; return { ...b, skuObj: sku, dist: DISTRIBUTORS[b.distributor], assess: M.assess(b, sku) }; } };
})();

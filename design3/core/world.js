/* Smart-Clearance v3 · the live world (SC-66): what backend-api and the agents need beyond the prototype's screens, to
   run Munchly Foods' journey for real. Sign-in is email and password for everyone (Munchly's people on munchly.example,
   everyone outside Munchly on google.example); every shop Rakesh Traders or Lakshmi Agencies offers a scheme to has its
   own account; the shops' pincodes and sales feed the synthetic DMS exports the Data agent loads into BigQuery.
   frontend/scripts/seed.mjs runs it after data.js and writes it into backend-api's reference data; of the prototype's
   pages only the app loads it, for its live mode's sign-in addresses (SC-73). Every person and shop here is fictional;
   the places are real. */
(function () {
  const D = window.SC3_DATA;

  // sign-in addresses: a fictional domain for the client, and one for everyone outside it
  const DOMAINS = { staff: "munchly.example", partners: "google.example" };
  const slug = s => s.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const partnerLogin = org => `${slug(org)}@${DOMAINS.partners}`;
  const staffLogin = email => email.replace(/@.*$/, "@" + DOMAINS.staff);

  // the Nagpur cluster's areas and their pincodes (the territory guard and the sales export match by pincode)
  const AREAS = { Itwari: "440002", Sadar: "440001", Dharampeth: "440010", Sitabuldi: "440012", "Wardha Road": "440015", Mahal: "440032", Kamptee: "441001", Wardha: "442001" };

  // Rakesh Traders' 38 kiranas: the 31 who order in the story, then the 7 who get the offer and do not. Each shop's
  // 14-day sales of the chips cap its order at 4×: the 31 order exactly their cap, and the 38 together sell the batch's
  // 12 packets a day (168 in 14 days)
  const OFFERED_ONLY = [
    ["Shree Sai Kirana", "Mahal"], ["Balaji Provision", "Sadar"], ["Rameshwar Stores", "Wardha Road"], ["Ganga Kirana", "Kamptee"],
    ["Navratna General Store", "Dharampeth"], ["Sant Tukaram Kirana", "Wardha"], ["Mohan Stores", "Itwari"],
  ];
  const NAGPUR = D.KIRANAS.map(k => ({ id: k.id, name: k.name, area: k.area, pincode: AREAS[k.area], sales14: k.units / 4, orders: k.units, at: k.at, distributor: "rakesh" }))
    .concat(OFFERED_ONLY.map(([name, area], i) => ({ id: "k" + (D.KIRANAS.length + i), name, area, pincode: AREAS[area], sales14: 3, orders: 0, at: null, distributor: "rakesh" })));
  if (NAGPUR.length !== D.OFFERED) throw new Error("world: the cluster should have " + D.OFFERED + " kiranas");

  // Lakshmi Agencies' cluster in Hyderabad's old city (SC-86), so the Mango Drink's scheme has shops to go to: as many as
  // data.js counts for her, round the Begum Bazaar godown. Their 14-day sales add up to the batch's 28 packets a day
  // (392), so their caps (4×) hold the plan's kirana line; `orders` is what each orders in the scripted walk (walk.sh),
  // its cap until the line is full. In a demo the shops order by hand.
  const HYD_AREAS = { "Begum Bazaar": "500012", "Afzal Gunj": "500012", Abids: "500001", Koti: "500095", "Sultan Bazar": "500095", Malakpet: "500036", Charminar: "500002", Nampally: "500001", Chaderghat: "500024", Dabeerpura: "500023" };
  const HYD = [
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
  const mango = D.BATCHES.find(b => b.distributor === "lakshmi");
  const mangoKirana = window.SC3_MONEY.plan(mango, D.SKUS[mango.sku]).lines.find(l => l.id === "kirana").units;
  let toOrder = mangoKirana;
  const HYDERABAD = HYD.map(([name, area], i) => {
    const sales14 = i < 50 ? HYD_SALES[i % 10] : i < 57 ? 7 : 8;
    const orders = Math.min(toOrder, sales14 * window.SC3_MONEY.RULES.shopCapTimes);
    toOrder -= orders;
    return { id: "h" + i, name, area, pincode: HYD_AREAS[area], sales14, orders, at: null, distributor: "lakshmi" };
  });
  if (HYDERABAD.length !== D.DISTRIBUTORS.lakshmi.kiranas) throw new Error("world: Lakshmi Agencies' cluster should have " + D.DISTRIBUTORS.lakshmi.kiranas + " kiranas");
  if (HYDERABAD.reduce((t, k) => t + k.sales14, 0) !== mango.sellPerDay * 14) throw new Error("world: Lakshmi Agencies' kiranas should sell the Mango Drink's 28 a day");
  if (toOrder) throw new Error("world: Lakshmi Agencies' kiranas should hold the Mango Drink's kirana line");
  const KIRANAS = NAGPUR.concat(HYDERABAD);

  // every member of Munchly's workspace: the story's people, the partner organisations' accounts, and an account for
  // each of the 38 shops (Shree Ganesh Kirana's is Ganesh ji's, Jai Durga Stores' and Shree Sai Kirana's are the
  // prototype's). Roles are the workspace app's; access is the console's (Approver, Admin, Member, Partner).
  const users = window.SC3_STORE.seed().users;
  const ACCESS = { priya: "approver", arjun: "admin", anita: "member", vikram: "member" };
  const MEMBERS = users.map(u => ({
    id: u.id, name: u.name, short: u.short, org: u.org, role: u.role, kind: u.kind === "staff" ? "staff" : u.kind === "external" ? "external" : "partner",
    access: ACCESS[u.id] || "partner", status: u.status, invitedBy: u.invitedBy || null, city: u.city || null, lang: u.lang || null, img: u.img || null,
    login: u.kind === "staff" ? staffLogin(u.email) : partnerLogin(u.org),
  }));
  const kiranaMember = { k0: "ganesh", k1: "jaidurga" };
  KIRANAS.forEach(k => {
    const own = kiranaMember[k.id] || MEMBERS.find(m => m.role === "retailer" && m.org === k.name)?.id;
    if (own) { kiranaMember[k.id] = own; return; }
    const id = "kirana-" + slug(k.name);
    kiranaMember[k.id] = id;
    const dist = D.DISTRIBUTORS[k.distributor];
    MEMBERS.push({ id, name: k.name, short: k.name, org: k.name, role: "retailer", kind: "partner", access: "partner", status: "active", invitedBy: dist.name, city: k.area + ", " + dist.city, lang: "hi", img: null, login: partnerLogin(k.name) });
  });
  KIRANAS.forEach(k => { k.member = kiranaMember[k.id]; });
  const logins = MEMBERS.map(m => m.login);
  if (new Set(logins).size !== logins.length) throw new Error("world: two members share a sign-in address");

  // which distributor each partner account belongs to, so a distributor or a shop sees only its own
  const ORG = Object.fromEntries(MEMBERS.map(m => [m.id,
    m.role === "distributor" ? (Object.values(D.DISTRIBUTORS).find(d => d.name === m.org) || {}).id || null
    : m.role === "retailer" ? (KIRANAS.find(k => k.member === m.id) || {}).id || null
    : m.role === "buyer" ? D.BUYER.id
    : m.role === "foodbank" ? slug(m.org)
    : null]));

  // the live workspace's sign-in, and where the marketplace buyer comes in
  const SIGN_IN = [
    { id: "password", icon: "mail", title: "Email and password", who: "Everyone in Munchly's workspace", rule: `Addresses Munchly invited: ${DOMAINS.staff} for Munchly's people, ${DOMAINS.partners} for distributors, kiranas, buyers and food banks` },
  ];
  const OUTSIDE = "The ExpireSoon buyer signs in to the workspace's marketplace area with the address Munchly invited, and sees only the listings open to him. Buyers inside Munchly's territories never see them.";

  // what the live workspace is connected to
  const INTEGRATIONS = [
    { id: "auth", name: "Firebase Authentication", kind: "Identity", status: "ok", note: `Email and password, by invitation: ${DOMAINS.staff} and ${DOMAINS.partners}` },
    { id: "fcm", name: "Firebase Cloud Messaging", kind: "Push", status: "ok", note: "Web push to every member's devices, with the in-app inbox behind it" },
    { id: "bq", name: "BigQuery", kind: "Data", status: "ok", note: "Sell-through by pincode, stock, shelf counts, channel prices, the impact ledger" },
    { id: "pubsub", name: "Cloud Pub/Sub", kind: "Events", status: "ok", note: "batch.at_risk, offer.received, deal.closed, journey steps and pushes" },
    { id: "gemini", name: "Gemini on Vertex AI", kind: "Agents", status: "ok", note: "Flash for labels, listings and offers; Pro for routing and negotiation" },
    { id: "dms", name: "DMS export (Bizom-style)", kind: "Inventory", status: "mock", note: "A synthetic nightly CSV for each distributor, in Cloud Storage" },
    { id: "tally", name: "Tally invoice drafts", kind: "Accounting", status: "mock", note: "Distributors issue the drafted invoices from their own Tally" },
    { id: "expiresoon", name: "ExpireSoon", kind: "Marketplace", status: "mock", note: "The marketplace area of this workspace, where invited buyers bid" },
    { id: "foodbank", name: "Food-bank partners", kind: "Donation", status: "mock", note: "Feeding India and IFBN intake rules" },
  ];

  // the document numbers the story's papers carry; the live journey issues the next ones in sequence
  const NUMBERS = {
    invoice: { prefix: "INV/26-27/", next: 931, width: 4 },
    support: { prefix: "CN/", next: 117, width: 4 },
    listing: { prefix: "ES-", next: 24117, width: 5 },
  };

  // the label printed on each demo batch, as the Vision agent should read it (the Mango Drink's from SC-86)
  const labelOf = b => ({ batch: b.id, mfg: b.mfg, bestBefore: b.bestBefore, mrp: D.SKUS[b.sku].mrp, pack: D.SKUS[b.sku].name, shelf: b.shelf || null });
  const hero = D.BATCHES.find(b => b.hero);
  const LABEL = { batch: hero.id, mfg: hero.mfg, bestBefore: hero.bestBefore, mrp: D.SKUS[hero.sku].mrp, pack: D.SKUS[hero.sku].name, shelf: hero.shelf };
  const LABELS = Object.fromEntries([hero, mango].map(b => [b.id, labelOf(b)]));

  window.SC3_WORLD = { DOMAINS, AREAS, HYD_AREAS, KIRANAS, MEMBERS, ORG, SIGN_IN, OUTSIDE, INTEGRATIONS, NUMBERS, LABEL, LABELS, slug };
})();

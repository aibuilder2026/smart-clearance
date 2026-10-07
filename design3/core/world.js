/* Smart-Clearance v3 · the live world (SC-66): what backend-api and the agents need beyond the prototype's screens, to
   run Munchly Foods' journey for real. Sign-in is email and password for everyone (Munchly's people on munchly.example,
   everyone outside Munchly on google.example); every shop Rakesh Traders offers the scheme to has its own account; the
   shops' pincodes and sales feed the synthetic DMS exports the Data agent loads into BigQuery.
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
  const KIRANAS = D.KIRANAS.map(k => ({ id: k.id, name: k.name, area: k.area, pincode: AREAS[k.area], sales14: k.units / 4, orders: k.units, at: k.at }))
    .concat(OFFERED_ONLY.map(([name, area], i) => ({ id: "k" + (D.KIRANAS.length + i), name, area, pincode: AREAS[area], sales14: 3, orders: 0, at: null })));
  if (KIRANAS.length !== D.OFFERED) throw new Error("world: the cluster should have " + D.OFFERED + " kiranas");

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
    MEMBERS.push({ id, name: k.name, short: k.name, org: k.name, role: "retailer", kind: "partner", access: "partner", status: "active", invitedBy: "Rakesh Traders", city: k.area + ", Nagpur", lang: "hi", img: null, login: partnerLogin(k.name) });
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

  // the label printed on the story's batch, as the Vision agent should read it
  const hero = D.BATCHES.find(b => b.hero);
  const LABEL = { batch: hero.id, mfg: hero.mfg, bestBefore: hero.bestBefore, mrp: D.SKUS[hero.sku].mrp, pack: D.SKUS[hero.sku].name, shelf: hero.shelf };

  window.SC3_WORLD = { DOMAINS, AREAS, KIRANAS, MEMBERS, ORG, SIGN_IN, OUTSIDE, INTEGRATIONS, NUMBERS, LABEL, slug };
})();

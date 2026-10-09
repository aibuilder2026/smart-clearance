/* Smart-Clearance v3 · the mock backend's store (stands in for Firestore). One observable state object for one
   workspace, Munchly's; in memory for the guided demo, persisted per browser for the app. Every change notifies subscribers. */
(function () {
  const D = window.SC3_DATA;
  const KEY = "sc3-store", VERSION = 5;
  function seed() {
    const P = D.PEOPLE;
    const users = [
      { id: "priya", role: "operator", provider: "google", status: "active" }, { id: "rakesh", role: "distributor", provider: "phone", status: "active" },
      { id: "ganesh", role: "retailer", provider: "phone", status: "active" }, { id: "agrawal", role: "buyer", provider: "expiresoon", status: "active" },
      { id: "meera", role: "foodbank", provider: "google", status: "active" }, { id: "arjun", role: "admin", provider: "google", status: "active" },
    ].map(u => Object.assign({}, P[u.id], u, { lastSeen: null }));
    // the other distributors' and retailers' accounts exist as organisations, not invented people
    [["patil-owner", "Patil Distributors", "distributor", "+91 98220 10431", "active"], ["gupta-owner", "Gupta & Sons", "distributor", "+91 98260 22118", "active"], ["lakshmi-owner", "Lakshmi Agencies", "distributor", "+91 98480 10550", "active"],
     ["jaidurga", "Jai Durga Stores", "retailer", "+91 98230 60011", "active"], ["krishna", "Krishna Kirana Bhandar", "retailer", "+91 98230 60012", "deactivated"],
     ["shreesai", "Shree Sai Kirana", "retailer", "+91 98230 60013", "invited", "Rakesh Traders"], ["ifbn", "India FoodBanking Network", "foodbank", "", "invited", "Munchly Foods"]]
      .forEach(([id, org, role, phone, status, invitedBy]) => users.push({ id, name: org, short: org, org, role: role, provider: phone ? "phone" : "google", phone, email: phone ? "" : "partners@ifbn.example", status, invitedBy, kind: "partner", lastSeen: null, extra: true }));
    return {
      v: VERSION,
      workspace: D.WORKSPACE.id,
      // permission: Rakesh Traders' one-time permission for the agent to act in his name; paused stops every agent step
      setup: { confirmed: false, mapped: 0, permission: null },
      hero: { id: "MF-2409-117", phase: "watching", photo: { status: "none" }, plan: null, listing: null, offer: null, orders: [], declined: {}, bids: [], chat: [], award: null, van: { status: "idle", done: 0 }, truck: { status: "idle" }, docs: null, invoiceIssued: false, posted: false },
      mango: { id: "MF-2410-118", phase: "executing", donation: null },
      feed: [], notifications: [], audit: [], users,
      rules: { watchTime: "09:00", dataTime: "08:30", floors: { snacks: 35, biscuits: 35, staples: 40, beverages: 30, "personal-care": 40 }, approvalTaps: 10, hindiOffers: true, requirePhoto: true, offerWindowHours: 48, tokenPct: 15, disposalPerUnit: 1.5, eprPerKg: 6, territoryGuard: true, returnWindowDays: 20, kiranaUplift: 3.5, vanPerUnit: 0.5 },
      integrations: [
        { id: "sso", name: "Google Workspace SSO", kind: "Identity", status: "ok", note: "Munchly staff sign in with munchly.in accounts only" },
        { id: "auth", name: "Firebase Authentication", kind: "Identity", status: "ok", note: "Phone one-time codes for distributors and kiranas, by invitation" },
        { id: "fcm", name: "Firebase Cloud Messaging", kind: "Push", status: "ok", note: "Web push to every role, in-app inbox as fallback" },
        { id: "bq", name: "BigQuery", kind: "Data", status: "ok", note: "Batches, sell-through by pincode and by shop, price history" },
        { id: "pubsub", name: "Cloud Pub/Sub", kind: "Events", status: "ok", note: "batch.at_risk, offer.received, deal.closed" },
        { id: "gemini", name: "Gemini on Vertex AI", kind: "Agents", status: "ok", note: "Vision for labels, Pro for routing, Flash for chat" },
        { id: "dms", name: "DMS export (Bizom-style)", kind: "Inventory", status: "ok", note: "Nightly CSV, 312 batches across 4 distributors" },
        { id: "tally", name: "Tally invoice drafts", kind: "Accounting", status: "mock", note: "Distributors issue the drafted invoices from their own Tally" },
        { id: "expiresoon", name: "ExpireSoon API", kind: "Marketplace", status: "mock", note: "Mocked POST /v1/listings; partner API in talks" },
        { id: "foodbank", name: "Food-bank partners", kind: "Donation", status: "mock", note: "Feeding India and IFBN intake rules" },
      ],
      seq: 1,
    };
  }
  const listeners = new Set();
  let state = seed(); let persist = false;
  const clone = o => (typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
  function save() { if (!persist) return; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function emit() { listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } }); }
  const Store = {
    get: () => state,
    update(fn) { const draft = clone(state); fn(draft); draft.seq = (draft.seq || 0) + 1; state = draft; save(); emit(); return state; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { state = seed(); save(); emit(); },
    usePersistence() { persist = true; try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); if (d && d.v === VERSION) state = d; } } catch (e) {} },
    seed,
  };
  window.SC3_STORE = Store;
})();

// Smart-Clearance app v2 · mock of Firebase Auth (the shapes the real SDK exposes; everything resolves locally).
// Providers: Google (brand staff), phone OTP (the trade), ExpireSoon account (buyer, mocked), demo accounts (judges).
(function () {
  const KEY = "sc2-app-session";
  const listeners = new Set();
  let current = null;
  const delay = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));
  const PERMS = {
    operator: ["batches.read", "batches.write", "plans.read", "plans.approve", "orders.read", "partners.read", "documents.read", "ledger.read", "photo.request", "users.invite"],
    finance: ["batches.read", "documents.read", "documents.write", "ledger.read", "orders.read", "partners.read"],
    sustainability: ["batches.read", "ledger.read", "ledger.write", "documents.read"],
    distributor: ["stock.read", "photo.send", "shipments.read", "shipments.write", "orders.read"],
    retailer: ["offers.read", "offers.accept", "orders.read"],
    buyer: ["listings.read", "bids.write", "orders.read"],
    foodbank: ["pickups.read"],
    admin: ["*"],
  };
  function user(u) { if (!u) return null; const dbu = window.DB.user(u.id) || u; return Object.assign({}, dbu, { uid: dbu.id, displayName: dbu.name, photoURL: dbu.avatar, providerId: dbu.provider }); }
  function set(u, how) { current = u ? { id: u.id, at: Date.now(), how } : null; try { current ? localStorage.setItem(KEY, JSON.stringify(current)) : localStorage.removeItem(KEY); } catch (e) {} listeners.forEach(fn => fn(Auth.currentUser)); }
  try { const raw = localStorage.getItem(KEY); if (raw) current = JSON.parse(raw); } catch (e) {}

  const Auth = {
    get currentUser() { if (!current) return null; const u = window.DB.user(current.id); if (!u || u.status !== "active") return null; return user(u); },
    get session() { return current; },
    onAuthStateChanged(fn) { listeners.add(fn); fn(Auth.currentUser); return () => listeners.delete(fn); },
    accounts() { return window.DB.list("users", { where: { provider: "google" } }).map(u => ({ id: u.id, email: u.email, name: u.name, avatar: u.avatar, status: u.status })); },
    async signInWithGoogle(email) {
      await delay(700);
      const u = window.DB.list("users").find(x => x.email && x.email.toLowerCase() === String(email).toLowerCase());
      if (!u) throw Object.assign(new Error("No Smart-Clearance account for " + email + ". Ask an admin to invite you."), { code: "auth/user-not-found" });
      if (u.status === "invited") { window.DB.update("users", u.id, { status: "active", lastSeen: new Date().toISOString() }); window.DB.audit(u.id, "accepted invite", u.id); }
      else if (u.status !== "active") throw Object.assign(new Error("This account is deactivated. Ask an admin to reactivate it."), { code: "auth/user-disabled" });
      window.DB.update("users", u.id, { lastSeen: new Date().toISOString() });
      window.DB.audit(u.id, "signed in", "google");
      set(u, "google"); return Auth.currentUser;
    },
    async signInWithPhoneNumber(phone) {
      await delay(600);
      const digits = String(phone).replace(/\D/g, "").slice(-10);
      const u = window.DB.list("users").find(x => x.phone && x.phone.replace(/\D/g, "").slice(-10) === digits);
      if (!u) throw Object.assign(new Error("This number is not registered. Ask your brand contact to add you."), { code: "auth/user-not-found" });
      const verificationId = "v-" + Math.random().toString(36).slice(2, 8);
      return { verificationId, phone: u.phone, async confirm(code) { await delay(500); if (!/^\d{6}$/.test(code)) throw Object.assign(new Error("Enter the 6-digit code from the SMS."), { code: "auth/invalid-verification-code" }); if (u.status === "deactivated") throw Object.assign(new Error("This account is deactivated."), { code: "auth/user-disabled" }); if (u.status === "invited") window.DB.update("users", u.id, { status: "active" }); window.DB.update("users", u.id, { lastSeen: new Date().toISOString() }); window.DB.audit(u.id, "signed in", "phone otp"); set(u, "phone"); return Auth.currentUser; } };
    },
    async signInWithMarketplace(email) { await delay(600); const u = window.DB.list("users").find(x => x.provider === "expiresoon" && (!email || x.email === email)); if (!u) throw new Error("No ExpireSoon account linked."); window.DB.audit(u.id, "signed in", "expiresoon"); set(u, "expiresoon"); return Auth.currentUser; },
    async signInDemo(id) { await delay(350); const u = window.DB.user(id); if (!u) throw new Error("Unknown demo account"); if (u.status !== "active") window.DB.update("users", u.id, { status: "active" }); window.DB.update("users", u.id, { lastSeen: new Date().toISOString() }); window.DB.audit(u.id, "signed in", "demo account"); set(u, "demo"); return Auth.currentUser; },
    async signOut() { const u = Auth.currentUser; await delay(250); if (u) window.DB.audit(u.id, "signed out", u.providerId); set(null); },
    async updateProfile(patch) { const u = Auth.currentUser; if (!u) throw new Error("Not signed in"); window.DB.update("users", u.id, patch); window.DB.audit(u.id, "updated profile", Object.keys(patch).join(", ")); listeners.forEach(fn => fn(Auth.currentUser)); return Auth.currentUser; },
    can(perm) { const u = Auth.currentUser; if (!u) return false; const p = PERMS[u.role] || []; return p.includes("*") || p.includes(perm) || (u.admin && true); },
    role() { const u = Auth.currentUser; return u ? u.role : null; },
    PERMS,
  };
  window.Auth = Auth;
})();

(function() {
  const { useState, useEffect, useMemo, useContext, createContext, Fragment } = React;
  const { motion, AnimatePresence } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Sheet, Field, Input, Select, Menu, DataTable, Empty, Mark, WorkspaceMark, PoweredBy, useApp, useNotice, useTheme } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle } = S;
  const WS = D.WORKSPACE;
  const ROLES = { operator: "Supply-chain operator", distributor: "Distributor", retailer: "Kirana retailer", buyer: "Marketplace buyer", foodbank: "Food-bank partner", admin: "Workspace admin" };
  const PROVIDERS = { google: "Google", phone: "Phone code", expiresoon: "ExpireSoon sign-in" };
  const KINDS = { staff: "Munchly staff", partner: "Invited partner", external: "Outside the workspace" };
  const STATUS_TONE = { active: "green", invited: "blue", deactivated: void 0 };
  const STAFF_ROLES = ["operator", "admin"];
  const audit = (who, what, target) => Store.update((s) => {
    s.audit.unshift({ id: "a-" + Date.now().toString(36), who, what, target, at: "now" });
  });
  const providerOf = (u) => u.provider === "google" ? u.kind === "staff" ? "Google Workspace" : "Google, invited" : PROVIDERS[u.provider];
  function WorkspaceSettings({ me }) {
    const s = useStore();
    const app = useApp();
    const { go } = useRoute();
    const members = s.users.filter((u) => u.kind !== "external" && u.status === "active");
    const counts = [["staff", members.filter((u) => u.kind === "staff").length], ["partner", members.filter((u) => u.kind === "partner").length]];
    const Step = ({ icon, t, sub }) => /* @__PURE__ */ React.createElement("div", { className: "wschain-step" }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, t), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, sub));
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Workspace", sub: `${WS.domain} · set up by Smart-Clearance for Munchly's supply chain` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "bezel" }, /* @__PURE__ */ React.createElement("div", { className: "card raised row wrap", style: { padding: app.bp === "phone" ? 18 : 24, gap: 18 } }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: app.bp === "phone" ? 56 : 72 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight grow", style: { gap: 6, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "t-title2" }, WS.name), /* @__PURE__ */ React.createElement("span", { className: "si-url", style: { justifySelf: "start" } }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 12, stroke: 2.2 }), WS.domain), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", dot: true }, "live since ", WS.since), /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, WS.plan), /* @__PURE__ */ React.createElement(Badge, { size: "sm", icon: "map-pin" }, WS.region), /* @__PURE__ */ React.createElement(Badge, { size: "sm", icon: "users" }, counts[0][1], " staff · ", counts[1][1], " partners"))), /* @__PURE__ */ React.createElement(PoweredBy, null))), /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: app.bp === "desktop" ? 520 : 360,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Each workspace sets its own; these are Munchly's" }, "How people sign in"), /* @__PURE__ */ React.createElement(List, { foot: "Everyone signs in at the same address with an email or a phone number; the workspace picks the method." }, WS.signIn.map((m) => /* @__PURE__ */ React.createElement(ListRow, { key: m.id, icon: m.icon === "google" ? "key-round" : m.icon, iconTone: m.id === "google" ? "blue" : void 0, title: m.title, sub: `${m.who} · ${m.rule}`, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green" }, "on") })), /* @__PURE__ */ React.createElement(ListRow, { icon: "ban", iconTone: "gray", title: "Marketplace buyers", sub: WS.outside, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, "outside") })), /* @__PURE__ */ React.createElement(SectionTitle, { sub: "The client's colours stay inside its mark" }, "Branding"), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { leading: /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 32 }), title: "Workspace mark", sub: "Shown under the Smart-Clearance mark, on the sign-in page and in the workspace sheet" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Name", value: WS.name }), /* @__PURE__ */ React.createElement(ListRow, { title: "Address", value: /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote" }, WS.domain) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Notifications arrive as", value: "Smart-Clearance" })), app.bp === "phone" && /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "plug", onClick: () => go("integrations") }, "Integrations")),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Another manufacturer's workspace is set up for its own chain" }, "Supply chain, as set up for Munchly"), /* @__PURE__ */ React.createElement(Card, { className: "wschain-card" }, /* @__PURE__ */ React.createElement("div", { className: "wschain", role: "img", "aria-label": `Munchly Foods sells to ${Object.keys(D.DISTRIBUTORS).length} distributors, who supply ${D.CLIENT.kiranas} kiranas and the Blinkit, Zepto and Instamart warehouses in their cities.` }, /* @__PURE__ */ React.createElement(Step, { icon: "factory", t: "Munchly Foods", sub: `${D.CLIENT.city} · sells only to distributors` }), /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 16, className: "subtle wschain-arrow" }), /* @__PURE__ */ React.createElement(Step, { icon: "warehouse", t: `${Object.keys(D.DISTRIBUTORS).length} distributors`, sub: "own the stock they buy" }), /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 16, className: "subtle wschain-arrow" }), /* @__PURE__ */ React.createElement("div", { className: "wschain-split" }, /* @__PURE__ */ React.createElement(Step, { icon: "store", t: `${D.CLIENT.kiranas} kiranas`, sub: "on the salesmen's beats" }), /* @__PURE__ */ React.createElement(Step, { icon: "shopping-bag", t: "Quick-commerce warehouses", sub: "Blinkit, Zepto, Instamart; turn short-dated stock away" })))), /* @__PURE__ */ React.createElement(List, null, WS.profile.map((p) => /* @__PURE__ */ React.createElement(ListRow, { key: p.id, icon: p.icon, iconTone: "gray", title: p.title, sub: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("b", { className: "strong", style: { color: "var(--fg-2)" } }, cap(p.value), "."), " ", p.text) }))), /* @__PURE__ */ React.createElement(List, { head: "Distributors", foot: "Territories are matched by pincode for the territory guard; a godown may set its own staff-sale cap." }, Object.values(D.DISTRIBUTORS).map((d) => {
          const p = S.permissionOf(s, d.id);
          return /* @__PURE__ */ React.createElement(ListRow, { key: d.id, icon: "warehouse", iconTone: "gray", title: d.name, sub: `${d.territory} · pincodes ${d.pins}… · staff sale up to ${d.staffCap || M.RULES.staffCap}`, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: p.tone, dot: !p.tone }, p.label) });
        })))
      }
    ), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0, maxWidth: "72ch" } }, "Smart-Clearance sets up each manufacturer's workspace for its own supply chain: who owns short-dated stock, which exits exist, who approves and how people sign in. Changes to this profile go through Smart-Clearance onboarding; the guardrails, users and integrations are Munchly's to run.")));
  }
  function Users({ me }) {
    const s = useStore();
    const app = useApp();
    const { toast } = useNotice();
    const [q, setQ] = useState("");
    const [invite, setInvite] = useState(false);
    const [menu, setMenu] = useState(null);
    const [roleFor, setRoleFor] = useState(null);
    const [form, setForm] = useState({ name: "", contact: "", role: "retailer" });
    const members = s.users.filter((u) => u.kind !== "external");
    const rows = members.filter((u) => !q || (u.name + " " + (u.org || "") + " " + (ROLES[u.role] || "")).toLowerCase().includes(q.toLowerCase()));
    const setStatus = (u, status) => {
      Store.update((st) => {
        const x = st.users.find((y) => y.id === u.id);
        if (x) x.status = status;
      });
      audit(me.id, status === "deactivated" ? "deactivated" : "reactivated", u.name);
      toast({ text: `${u.short || u.name} ${status === "deactivated" ? "deactivated" : "reactivated"}`, tone: "ok" });
    };
    const [err, setErr] = useState("");
    const send = () => {
      const name = form.name.trim(), email = form.contact.trim().toLowerCase();
      setErr("");
      if (!name) return setErr("Enter a name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr(`Enter an email address, such as name@${WS.emailDomain}.`);
      if (STAFF_ROLES.includes(form.role) && !email.endsWith("@" + WS.emailDomain)) return setErr(`${WS.short} staff need a ${WS.emailDomain} address. Partners can use any address.`);
      const staff = email.endsWith("@" + WS.emailDomain);
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36).slice(-3);
      Store.update((st) => {
        st.users.push({ id, name, short: name, org: staff ? D.CLIENT.short : name, role: form.role, provider: "google", phone: "", email, status: "invited", invitedBy: me.name, kind: staff ? "staff" : "partner", lastSeen: null, extra: true });
      });
      audit(me.id, "invited " + name + " as " + ROLES[form.role].toLowerCase(), email);
      setInvite(false);
      setForm({ name: "", contact: "", role: "retailer" });
      toast({ text: `${name} can sign in with the default password`, tone: "ok" });
    };
    const counts = Object.keys(STATUS_TONE).map((k) => [k, members.filter((u) => u.status === k).length]);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Users", sub: `People and partner organisations in ${WS.name}' workspace`, actions: app.bp !== "phone" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "user-plus", onClick: () => setInvite(true) }, "Invite") }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 220 } }, /* @__PURE__ */ React.createElement(K.SearchField, { value: q, onChange: setQ, placeholder: "Search people, organisations, roles" })), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, counts.map(([k, n]) => /* @__PURE__ */ React.createElement(Badge, { key: k, tone: STATUS_TONE[k], dot: true }, n, " ", k))), app.bp === "phone" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "user-plus", onClick: () => setInvite(true) }, "Invite")), app.bp === "phone" ? /* @__PURE__ */ React.createElement("div", { className: "list" }, rows.map((u) => /* @__PURE__ */ React.createElement("div", { key: u.id, className: "list-row", style: { gridTemplateColumns: "40px minmax(0,1fr) auto" } }, /* @__PURE__ */ React.createElement(Avatar, { person: u, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, u.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, ROLES[u.role], " · ", providerOf(u))), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: STATUS_TONE[u.status] }, u.status), /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: "ellipsis", label: "Actions for " + u.name, "aria-haspopup": "menu", "aria-expanded": menu === u.id, onClick: () => setMenu(menu === u.id ? null : u.id) }), /* @__PURE__ */ React.createElement(RowMenu, { u, open: menu === u.id, onClose: () => setMenu(null), onRole: () => setRoleFor(u), onStatus: setStatus, me })))))) : /* @__PURE__ */ React.createElement(DataTable, { label: "Users", rows, initialSort: ["name", "asc"], columns: [
      { key: "name", label: "Person or organisation", render: (u) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Avatar, { person: u, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, u.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, u.extra ? u.phone || u.email : u.org))) },
      { key: "role", label: "Role", sortValue: (u) => ROLES[u.role], render: (u) => ROLES[u.role] },
      { key: "kind", label: "Access", sortValue: (u) => KINDS[u.kind], render: (u) => /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, KINDS[u.kind], u.invitedBy ? /* @__PURE__ */ React.createElement("span", { className: "subtle" }, " · by ", u.invitedBy) : null) },
      { key: "provider", label: "Sign-in", render: (u) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Icon, { name: u.provider === "google" ? "google" : u.provider === "phone" ? "smartphone" : "hourglass", size: 15 }), providerOf(u)) },
      { key: "status", label: "Status", render: (u) => /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: STATUS_TONE[u.status], dot: true }, u.status) },
      { key: "act", label: "", sortable: false, render: (u) => /* @__PURE__ */ React.createElement("span", { style: { position: "relative", display: "inline-block" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(IconButton, { icon: "ellipsis", label: "Actions for " + u.name, "aria-haspopup": "menu", "aria-expanded": menu === u.id, onClick: () => setMenu(menu === u.id ? null : u.id) }), /* @__PURE__ */ React.createElement(RowMenu, { u, open: menu === u.id, onClose: () => setMenu(null), onRole: () => setRoleFor(u), onStatus: setStatus, me })) }
    ] }), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, WS.outside)), /* @__PURE__ */ React.createElement(Sheet, { open: invite, onClose: () => {
      setInvite(false);
      setErr("");
    }, title: "Invite someone", side: app.bp === "phone" ? "bottom" : "center", detent: "medium", footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", block: true, icon: "user-plus", onClick: send }, "Invite") }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement(Field, { label: "Name or organisation", htmlFor: "inv-name" }, /* @__PURE__ */ React.createElement(Input, { id: "inv-name", value: form.name, onChange: (e) => {
      setForm({ ...form, name: e.target.value });
      setErr("");
    }, placeholder: WS.invite.name })), /* @__PURE__ */ React.createElement(Field, { label: "Email", htmlFor: "inv-contact", error: err || null }, /* @__PURE__ */ React.createElement(Input, { id: "inv-contact", icon: "mail", type: "email", value: form.contact, onChange: (e) => {
      setForm({ ...form, contact: e.target.value });
      setErr("");
    }, autoComplete: "off", spellCheck: false, autoCapitalize: "none", placeholder: `name@${WS.emailDomain}` })), /* @__PURE__ */ React.createElement(Field, { label: "Role", htmlFor: "inv-role" }, /* @__PURE__ */ React.createElement(Select, { id: "inv-role", value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }) }, Object.entries(ROLES).filter(([k]) => k !== "buyer").map(([k, v]) => /* @__PURE__ */ React.createElement("option", { key: k, value: k }, v)))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, WS.short, " staff need a ", WS.emailDomain, " address; partners use any address. They sign in with it and the default password, which you hand over. Nothing is sent by email."))), /* @__PURE__ */ React.createElement(Sheet, { open: !!roleFor, onClose: () => setRoleFor(null), title: roleFor ? "Role for " + (roleFor.short || roleFor.name) : "", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, roleFor && /* @__PURE__ */ React.createElement("div", { className: "list" }, Object.entries(ROLES).filter(([k]) => k !== "buyer").map(([k, v]) => /* @__PURE__ */ React.createElement("button", { type: "button", key: k, className: "list-row", style: { gridTemplateColumns: "minmax(0,1fr) auto", width: "100%", textAlign: "left" }, onClick: () => {
      Store.update((st) => {
        const x = st.users.find((y) => y.id === roleFor.id);
        if (x) x.role = k;
      });
      audit(me.id, "changed the role to " + v.toLowerCase(), roleFor.name);
      toast({ text: "Role updated", tone: "ok" });
      setRoleFor(null);
    } }, /* @__PURE__ */ React.createElement("span", null, v), roleFor.role === k && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 18 }))))));
  }
  function RowMenu({ u, open, onClose, onRole, onStatus, me }) {
    const { toast } = useNotice();
    const items = [{ label: "Change role", icon: "user-cog", onClick: onRole }];
    if (u.status === "invited") items.push({ label: "Resend invite", icon: "send", onClick: () => toast({ text: "Invite resent", tone: "ok" }) });
    if (u.id !== me.id) items.push(u.status === "deactivated" ? { label: "Reactivate", icon: "user-check", onClick: () => onStatus(u, "active") } : { label: "Deactivate", icon: "user-x", danger: true, onClick: () => onStatus(u, "deactivated") });
    return /* @__PURE__ */ React.createElement(Menu, { open, onClose, items, width: 200, label: "Actions for " + u.name });
  }
  function Rules({ me }) {
    const s = useStore();
    const app = useApp();
    const { toast } = useNotice();
    const [r, setR] = useState(s.rules);
    const dirty = JSON.stringify(r) !== JSON.stringify(s.rules);
    const set = (k, v) => setR({ ...r, [k]: v });
    const setFloor = (k, v) => setR({ ...r, floors: { ...r.floors, [k]: v } });
    const save = () => {
      Store.update((st) => {
        st.rules = r;
      });
      audit(me.id, "updated the guardrails", "Rules");
      toast({ text: "Guardrails saved · agents use them from the next run", tone: "ok" });
    };
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Guardrails", sub: "What the agents may and may not do in Munchly's name", actions: app.bp !== "phone" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "check", disabled: !dirty, onClick: save }, "Save") }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 20, gridTemplateColumns: app.bp === "desktop" ? "repeat(2, minmax(0,1fr))" : "minmax(0,1fr)", alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(List, { head: "Floor price, % of MRP", foot: "No channel sells below its category's floor." }, Object.keys(r.floors).map((k) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k.replace("-", " ").replace(/^./, (c) => c.toUpperCase()), value: /* @__PURE__ */ React.createElement(Stepper, { value: r.floors[k], onChange: (v) => setFloor(k, v), min: 20, max: 70, step: 5, label: "Floor for " + k, format: (v) => v + "%" }) }))), /* @__PURE__ */ React.createElement(List, { head: "Approvals" }, /* @__PURE__ */ React.createElement(ListRow, { title: "Routes per channel that need a tap", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.approvalTaps, onChange: (v) => set("approvalTaps", v), min: 1, max: 50, label: "Routes needing approval" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Require a label photo before pricing", value: /* @__PURE__ */ React.createElement(Switch, { checked: r.requirePhoto, onChange: (v) => set("requirePhoto", v), label: "Require a label photo" }) })), /* @__PURE__ */ React.createElement(List, { head: "Territory guard", foot: "Matched by pincode against the four distributor territories." }, /* @__PURE__ */ React.createElement(ListRow, { title: "Hide ExpireSoon listings from buyers inside Munchly's territories", value: /* @__PURE__ */ React.createElement(Switch, { checked: r.territoryGuard, onChange: (v) => set("territoryGuard", v), label: "Territory guard" }) }))), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(List, { head: "Offers and marketplace" }, /* @__PURE__ */ React.createElement(ListRow, { title: "Kirana offers in Hindi", value: /* @__PURE__ */ React.createElement(Switch, { checked: r.hindiOffers, onChange: (v) => set("hindiOffers", v), label: "Hindi offers" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Offer window", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.offerWindowHours, onChange: (v) => set("offerWindowHours", v), min: 12, max: 96, step: 12, label: "Offer window hours", format: (v) => v + " h" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Buyer token", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.tokenPct, onChange: (v) => set("tokenPct", v), min: 5, max: 30, step: 5, label: "Token percent", format: (v) => v + "%" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Scheme returns, days before best-before", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.returnWindowDays, onChange: (v) => set("returnWindowDays", v), min: 15, max: 30, label: "Return window", format: (v) => v + " days" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Watcher runs daily at", value: /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, r.watchTime) })), /* @__PURE__ */ React.createElement(List, { head: "Planning assumptions", foot: "Used to size the kirana scheme and its cost." }, /* @__PURE__ */ React.createElement(ListRow, { title: "Scheme uplift on normal sales", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.kiranaUplift, onChange: (v) => set("kiranaUplift", Math.round(v * 10) / 10), min: 2, max: 5, step: 0.5, label: "Scheme uplift", format: (v) => v.toFixed(1) + "×" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Van rate, a unit", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.vanPerUnit, onChange: (v) => set("vanPerUnit", Math.round(v * 100) / 100), min: 0.25, max: 2, step: 0.25, label: "Van rate", format: (v) => "₹" + v.toFixed(2) }) })), /* @__PURE__ */ React.createElement(List, { head: "Write-off factors", foot: "Used for the true cost of destroying a batch. Both are indicative." }, /* @__PURE__ */ React.createElement(ListRow, { title: "Disposal, a unit", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.disposalPerUnit, onChange: (v) => set("disposalPerUnit", Math.round(v * 100) / 100), min: 0.5, max: 5, step: 0.25, label: "Disposal per unit", format: (v) => "₹" + v.toFixed(2) }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "EPR, a kg of product and pack", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.eprPerKg, onChange: (v) => set("eprPerKg", v), min: 1, max: 20, label: "EPR per kg", format: (v) => "₹" + v }) })), app.bp === "phone" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "check", disabled: !dirty, onClick: save }, "Save guardrails"))));
  }
  const KIND_ICON = { Identity: "key-round", Push: "bell", Data: "database", Events: "webhook", Agents: "sparkles", Marketplace: "shopping-bag", Donation: "heart-handshake", Inventory: "file-spreadsheet", Accounting: "receipt" };
  function Integrations({ me }) {
    const s = useStore();
    const { toast } = useNotice();
    const [busy, setBusy] = useState(null);
    const test = (i) => {
      setBusy(i.id);
      setTimeout(() => {
        setBusy(null);
        toast({ text: `${i.name} · ${i.status === "mock" ? "stub answered" : "connected"} in ${80 + Math.round(Math.random() * 160)} ms`, tone: "ok" });
      }, 900);
    };
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Integrations", sub: "Munchly's sign-in, Google Cloud services and partner APIs" }, /* @__PURE__ */ React.createElement("div", { className: "list" }, s.integrations.map((i) => /* @__PURE__ */ React.createElement("div", { key: i.id, className: "list-row", style: { gridTemplateColumns: "40px minmax(0,1fr) auto" } }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", i.status === "mock" && "soft") }, /* @__PURE__ */ React.createElement(Icon, { name: KIND_ICON[i.kind] || "plug", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, i.name, " ", /* @__PURE__ */ React.createElement("span", { className: "subtle t-caption", style: { fontWeight: 500 } }, i.kind)), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, i.note)), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: i.status === "ok" ? "green" : "violet", dot: true }, i.status === "ok" ? "connected" : "mocked"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", loading: busy === i.id, onClick: () => test(i) }, "Test"))))));
  }
  function Audit({ me }) {
    const s = useStore();
    const [who, setWho] = useState("all");
    const people = Array.from(new Set(s.audit.map((a) => a.who)));
    const rows = s.audit.filter((a) => who === "all" || a.who === who);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Audit log", sub: "Every human decision, with who and when" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "chip", "aria-pressed": who === "all", onClick: () => setWho("all") }, "Everyone"), people.map((p) => /* @__PURE__ */ React.createElement("button", { type: "button", key: p, className: "chip", "aria-pressed": who === p, onClick: () => setWho(p) }, S.PEOPLE_BY_ID(p).short || S.PEOPLE_BY_ID(p).name))), rows.length ? /* @__PURE__ */ React.createElement("div", { className: "list" }, rows.map((a) => {
      const p = S.PEOPLE_BY_ID(a.who);
      return /* @__PURE__ */ React.createElement("div", { key: a.id, className: "list-row", style: { gridTemplateColumns: "40px minmax(0,1fr) auto" } }, /* @__PURE__ */ React.createElement(Avatar, { person: p, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, /* @__PURE__ */ React.createElement("b", null, p.short || p.name), " ", a.what), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle mono" }, a.target)), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle tnum" }, a.at));
    })) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "scroll-text", title: "Nothing logged yet", body: "Approvals, permissions, photos, bids, dispatches and settings changes appear here." }))));
  }
  const AccountCtx = S.AccountCtx;
  function Inbox({ me, routes }) {
    const s = useStore();
    const { go } = useRoute();
    const mine = s.notifications.filter((n) => n.to === me.id);
    const open = (n) => {
      Store.update((st) => {
        const x = st.notifications.find((y) => y.id === n.id);
        if (x) x.read = true;
      });
      if (n.link && (!routes || routes.includes(n.link))) go(n.link);
    };
    const unread = mine.filter((n) => !n.read).length;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Inbox", sub: unread ? `${unread} unread` : "All caught up", actions: unread > 0 && /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: () => Store.update((st) => st.notifications.forEach((n) => {
      if (n.to === me.id) n.read = true;
    })) }, "Mark all read") }, mine.length ? /* @__PURE__ */ React.createElement("div", { className: "list", style: { maxWidth: 720 } }, mine.map((n) => /* @__PURE__ */ React.createElement("button", { type: "button", key: n.id, className: "list-row", onClick: () => open(n), style: { gridTemplateColumns: "36px minmax(0,1fr) auto", width: "100%", textAlign: "left", alignItems: "start" } }, /* @__PURE__ */ React.createElement(Mark, { size: 32 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, n.title), /* @__PURE__ */ React.createElement("span", { className: cx("t-footnote muted", n.hindi && "hi"), lang: n.hindi ? "hi" : void 0 }, n.body)), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { justifyItems: "end", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle tnum" }, n.at), !n.read && /* @__PURE__ */ React.createElement("span", { role: "img", "aria-label": "Unread", style: { width: 9, height: 9, borderRadius: 9, background: "var(--primary)" } }))))) : /* @__PURE__ */ React.createElement(Card, { style: { maxWidth: 720 } }, /* @__PURE__ */ React.createElement(Empty, { icon: "bell", title: "No notifications", body: "Pushes from the agents land here too, so nothing is lost if a phone was off." })));
  }
  function Profile({ me }) {
    const { mode, setMode } = useTheme();
    const acc = useContext(AccountCtx);
    const app = useApp();
    const { toast } = useNotice();
    const { go } = useRoute();
    const s = useStore();
    const lkey = "sc3-lang-" + me.id;
    const [lang, setLang] = useState(() => {
      try {
        return localStorage.getItem(lkey) || (["rakesh", "ganesh"].includes(me.id) ? "hi" : "en");
      } catch (e) {
        return "en";
      }
    });
    const setL = (v) => {
      setLang(v);
      try {
        localStorage.setItem(lkey, v);
      } catch (e) {
      }
    };
    const [push, setPush] = useState(true);
    const [digest, setDigest] = useState(false);
    const perm = s.setup.permission;
    const inside = me.role !== "buyer";
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Profile", sub: ROLES[me.role] }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20, maxWidth: 680 } }, /* @__PURE__ */ React.createElement(Card, { className: "row", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Avatar, { person: me, size: "xl", ring: true }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "t-title2" }, me.name), /* @__PURE__ */ React.createElement("span", { className: "muted" }, ROLES[me.role], " · ", me.org), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle row tight" }, /* @__PURE__ */ React.createElement(Icon, { name: me.provider === "google" ? "google" : me.provider === "phone" ? "smartphone" : "hourglass", size: 14 }), providerOf(me), me.email ? " · " + me.email : me.phone ? " · " + me.phone : ""))), inside && /* @__PURE__ */ React.createElement(List, { head: "Workspace" }, /* @__PURE__ */ React.createElement(ListRow, { leading: /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 32 }), title: WS.name, sub: WS.domain, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green" }, KINDS[me.kind] || "member") }), me.role === "admin" && /* @__PURE__ */ React.createElement(ListRow, { icon: "building-2", title: "Workspace settings", sub: "Sign-in, supply-chain profile, branding", chevron: true, onClick: () => go("workspace") })), me.id === "rakesh" && perm && /* @__PURE__ */ React.createElement(List, { head: "Acting for Rakesh Traders", foot: "Inside Munchly's floors: listings, scheme offers, invoice drafts and dispatch slots in your name." }, /* @__PURE__ */ React.createElement(ListRow, { icon: perm.paused ? "circle-pause" : "handshake", title: perm.paused ? "Paused" : "On since " + perm.at, value: /* @__PURE__ */ React.createElement(Switch, { checked: !perm.paused, onChange: (v) => {
      Flow.act("pause", !v);
      toast({ text: v ? "Resumed" : "Paused · nothing more happens in your name", tone: "ok" });
    }, label: "Let Smart-Clearance act for you" }) })), me.role === "operator" && /* @__PURE__ */ React.createElement(List, { head: "Your work" }, /* @__PURE__ */ React.createElement(ListRow, { icon: "sliders-horizontal", title: "Setup and guardrails", sub: "DMS mapping, floors, territory guard, permissions", chevron: true, onClick: () => go("setup") }), /* @__PURE__ */ React.createElement(ListRow, { icon: "book-open", title: "Ledger", sub: "Money, GST and impact by quarter; BRSR and GST exports", chevron: true, onClick: () => go("report") })), /* @__PURE__ */ React.createElement(List, { head: "Appearance" }, /* @__PURE__ */ React.createElement(ListRow, { title: "Theme", value: /* @__PURE__ */ React.createElement(Segmented, { options: [{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }, { id: "system", label: "Auto" }], value: mode, onChange: setMode, label: "Theme", size: "sm" }) })), /* @__PURE__ */ React.createElement(List, { head: "Notifications", foot: "Offers to the trade go out in the language each person picks." }, /* @__PURE__ */ React.createElement(ListRow, { title: "Language", value: /* @__PURE__ */ React.createElement(Segmented, { options: [{ id: "en", label: "English" }, { id: "hi", label: "हिन्दी" }], value: lang, onChange: setL, label: "Notification language", size: "sm" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Push notifications", value: /* @__PURE__ */ React.createElement(Switch, { checked: push, onChange: setPush, label: "Push notifications" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Weekly digest by email", value: /* @__PURE__ */ React.createElement(Switch, { checked: digest, onChange: setDigest, label: "Weekly digest" }) })), acc.install !== void 0 && /* @__PURE__ */ React.createElement(List, { head: "This device" }, /* @__PURE__ */ React.createElement(ListRow, { icon: "download", title: "Install Smart-Clearance", sub: acc.install ? "Opens full screen, works offline, gets pushes" : acc.standalone ? "Installed on this device" : "In Safari, tap Share, then Add to Home Screen", value: acc.install ? /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", onClick: acc.install }, "Install") : null })), (acc.switchTo || acc.signOut || acc.reset) && /* @__PURE__ */ React.createElement(List, { head: "Account" }, acc.switchTo && /* @__PURE__ */ React.createElement(ListRow, { icon: "users", title: "Switch person", sub: "Try the journey as someone else in the story", chevron: true, onClick: acc.switchTo }), acc.reset && /* @__PURE__ */ React.createElement(ListRow, { icon: "rotate-ccw", title: "Reset demo data", sub: "Puts the batch back to the start", onClick: () => {
      acc.reset();
      toast({ text: "Demo data reset" });
    } }), acc.signOut && /* @__PURE__ */ React.createElement(ListRow, { icon: "log-out", iconTone: "red", title: "Sign out", sub: inside ? `Back to ${WS.domain}` : void 0, onClick: acc.signOut }))));
  }
  Object.assign(window.SC3_SCREENS, { WorkspaceSettings, Users, Rules, Integrations, Audit, Inbox, Profile, AccountCtx, ROLES, PROVIDERS, KINDS, providerOf });
})();

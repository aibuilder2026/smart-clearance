// Smart-Clearance app v2 · admin: users, rules and agents, integrations, audit log
(function () {
  const { useState } = React;
  const K = window.SC2; const A = window.SC_APP;
  const { Icon, Avatar, Btn, Chip, Plate, Sheet, Input, Field, Select, Toggle, TopBar, RunHead, Empty, LiveTile, inr, num, cx } = K;
  const { useDB, DataTable, Toolbar, Pills, PageHead, StatusChip, RoleChip, ROLE_LABEL, KV, ConfirmSheet, FormSheet, Actions, Who, ago, when, exportCSV } = A;
  const DB = window.DB, Bus = window.Bus, Auth = window.Auth;
  const Bar = ({ user, nav, title, runhead }) => <TopBar title={title} runhead={runhead} unread={DB.list("notifications", { where: { user: user.id, read: false } }).length} onBell={() => nav("notifications")}><A.UserMenu user={user} onProfile={() => nav("profile")} onSignOut={() => Auth.signOut()} /></TopBar>;

  function Users({ user, nav }) {
    const v = useDB(); const [q, setQ] = useState(""); const [role, setRole] = useState("all"); const [status, setStatus] = useState("all"); const [sort, setSort] = useState(["name", "asc"]);
    const [invite, setInvite] = useState(false); const [edit, setEdit] = useState(null); const [confirm, setConfirm] = useState(null); const { toast } = K.useToasts();
    const [f, setF] = useState({ name: "", email: "", phone: "", role: "operator", org: "o-munchly", title: "" });
    const rows = DB.list("users", { search: q }).filter(u => (role === "all" || u.role === role) && (status === "all" || u.status === status)).map(u => ({ ...u, orgName: (DB.org(u.org) || {}).name }));
    const counts = DB.counts();
    const act = (what, u, patch) => { DB.update("users", u.id, patch); DB.audit(user.id, what, u.id); };
    return <><Bar user={user} nav={nav} title="Users" runhead={<RunHead parts={[{ b: String(counts.users), t: "accounts" }, { b: String(counts.invited), t: "invited", hot: counts.invited > 0 }]} />} />
      <div className="page"><PageHead title="Users" sub="Everyone who can sign in: brand staff on Google, the trade on phone OTP, buyers through ExpireSoon." actions={<><Btn icon="download" onClick={() => exportCSV(rows.map(u => ({ name: u.name, email: u.email, phone: u.phone, role: u.role, org: u.orgName, status: u.status, lastSeen: u.lastSeen })), "users.csv")}>Export</Btn><Btn kind="primary" icon="plus" onClick={() => setInvite(true)}>Invite a user</Btn></>} />
        <Toolbar search={q} onSearch={setQ} placeholder="Name, email, phone, organisation" count={rows.length}>
          <Select value={role} onChange={e => setRole(e.target.value)} aria-label="Role"><option value="all">All roles</option>{Object.keys(ROLE_LABEL).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select>
          <Pills options={[{ id: "all", label: "All" }, { id: "active", label: "Active" }, { id: "invited", label: "Invited" }, { id: "deactivated", label: "Deactivated" }]} value={status} onChange={setStatus} />
        </Toolbar>
        <DataTable rows={rows} sort={sort} onSort={setSort} onRow={u => setEdit(u)} columns={[
          { key: "name", label: "Person", render: u => <Who user={u} /> },
          { key: "role", label: "Role", render: u => <RoleChip role={u.role} /> },
          { key: "orgName", label: "Organisation" },
          { key: "provider", label: "Sign-in", render: u => <Chip mono>{u.provider}</Chip> },
          { key: "status", label: "Status", render: u => <StatusChip status={u.status} /> },
          { key: "lastSeen", label: "Last seen", render: u => <span className="t-xs muted mono">{ago(u.lastSeen)}</span> },
          { key: "x", label: "", sortable: false, render: u => <Actions items={[{ label: "Edit role and details", icon: "edit", onClick: () => setEdit(u) }, u.status === "invited" && { label: "Resend invite", icon: "send", onClick: () => { DB.audit(user.id, "resent invite", u.id); toast({ title: "Invite sent again", body: u.email || u.phone, tone: "ok", icon: "check" }); } }, u.provider === "google" && { label: "Send password reset", icon: "key", onClick: () => { DB.audit(user.id, "sent reset", u.id); toast({ title: "Reset link sent", body: u.email, tone: "ok", icon: "check" }); } }, "-", u.status === "deactivated" ? { label: "Reactivate", icon: "check", onClick: () => act("reactivated user", u, { status: "active" }) } : u.id !== user.id && { label: "Deactivate", icon: "x", danger: true, onClick: () => setConfirm({ kind: "deactivate", u }) }, u.status === "invited" && { label: "Remove invite", icon: "trash", danger: true, onClick: () => setConfirm({ kind: "remove", u }) }]} /> },
        ]} />
      </div>
      <FormSheet open={invite} onClose={() => setInvite(false)} title="Invite a user" submitLabel="Send invite" valid={!!(f.name && (f.email || f.phone))} onSubmit={async () => { const provider = f.email ? "google" : "phone"; const u = DB.insert("users", { name: f.name, email: f.email, phone: f.phone, role: f.role, org: f.org, status: "invited", title: f.title, provider, avatar: null, lang: "en" }); DB.audit(user.id, "invited user", u.id); Bus.publish("user.invited", { user: u.id, by: user.id }); setF({ name: "", email: "", phone: "", role: "operator", org: "o-munchly", title: "" }); }}>
        <Field label="Name" id="in"><Input id="in" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Work email" help="Brand staff sign in with Google on this address." id="ie"><Input id="ie" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="name@munchly.in" /></Field>
        <Field label="Mobile number" help="Distributors and retailers sign in with a one-time code." id="ip"><Input id="ip" mono inputMode="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+91 98XXX XXXXX" /></Field>
        <Field label="Role" id="ir"><Select id="ir" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>{Object.keys(ROLE_LABEL).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select></Field>
        <Field label="Organisation" id="io"><Select id="io" value={f.org} onChange={e => setF({ ...f, org: e.target.value })}>{DB.all("orgs").map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
        <Field label="Title" id="it"><Input id="it" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Supply chain analyst" /></Field>
      </FormSheet>
      <FormSheet open={!!edit} onClose={() => setEdit(null)} title={edit ? edit.name : ""} submitLabel="Save" onSubmit={async () => { const before = DB.user(edit.id); DB.update("users", edit.id, { role: edit.role, org: edit.org, title: edit.title, admin: edit.role === "admin" }); if (before.role !== edit.role) DB.audit(user.id, "changed role", edit.id + " → " + edit.role); else DB.audit(user.id, "edited user", edit.id); }}>
        {edit && <><div className="row"><Who user={edit} /><StatusChip status={edit.status} /></div>
          <Field label="Role" help="Permissions follow the role. Admin can do everything." id="er"><Select id="er" value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })}>{Object.keys(ROLE_LABEL).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select></Field>
          <Field label="Organisation" id="eo"><Select id="eo" value={edit.org} onChange={e => setEdit({ ...edit, org: e.target.value })}>{DB.all("orgs").map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
          <Field label="Title" id="et"><Input id="et" value={edit.title || ""} onChange={e => setEdit({ ...edit, title: e.target.value })} /></Field>
          <KV items={[["Sign-in", edit.provider], ["Email", edit.email || "—"], ["Phone", edit.phone || "—"], ["Created", when(edit.createdAt)], ["Last seen", ago(edit.lastSeen)]]} />
          <Plate tight className="stack-sm"><b className="t-small">Permissions for {ROLE_LABEL[edit.role]}</b><div className="row wrap">{(Auth.PERMS[edit.role] || []).map(p => <Chip key={p} mono>{p}</Chip>)}</div></Plate></>}
      </FormSheet>
      <ConfirmSheet open={!!confirm} onClose={() => setConfirm(null)} title={confirm ? (confirm.kind === "remove" ? "Remove the invite for " : "Deactivate ") + confirm.u.name + "?" : ""} body={confirm && confirm.kind === "remove" ? "The invite link stops working. Nothing else is deleted." : "They are signed out everywhere and cannot sign in until an admin reactivates them. Their history stays."} confirmLabel={confirm && confirm.kind === "remove" ? "Remove" : "Deactivate"} danger onConfirm={async () => { if (confirm.kind === "remove") { DB.remove("users", confirm.u.id); DB.audit(user.id, "removed invite", confirm.u.id); } else act("deactivated user", confirm.u, { status: "deactivated" }); }} />
    </>;
  }

  function Rules({ user, nav }) {
    const v = useDB(); const r = DB.rules(); const [f, setF] = useState(r); const [saved, setSaved] = useState(false);
    const set = (k, val) => setF({ ...f, [k]: val }); const setG = (k, val) => setF({ ...f, gates: { ...f.gates, [k]: val } }); const setC = (k, val) => setF({ ...f, caps: { ...f.caps, [k]: val } });
    const save = () => { DB.setRules(f); DB.audit(user.id, "updated rules", Object.keys(f).filter(k => JSON.stringify(f[k]) !== JSON.stringify(r[k])).join(", ") || "no change"); Bus.publish("rule.changed", { by: user.id }); setSaved(true); setTimeout(() => setSaved(false), 1600); };
    return <><Bar user={user} nav={nav} title="Rules and agents" />
      <div className="page"><PageHead title="Rules and agents" sub="What the Watcher checks, how the Valuer prices, what the Router may do without a human." actions={<><Btn kind="ghost" onClick={() => setF(r)}>Discard</Btn><Btn kind="primary" icon="check" onClick={save}>Save rules</Btn>{saved && <Chip tone="emerald" icon="check">saved</Chip>}</>} />
        <div className="detail"><div className="main-col">
          <Plate className="stack-sm"><h3>Watcher</h3>
            <div className="rulerow"><div><div className="lbl">Daily run</div><div className="help">IST. Every batch is checked against the gates and real sell-through.</div></div><Select className="select" value={f.watchTime} onChange={e => set("watchTime", e.target.value)}>{["06:00", "07:00", "08:00", "09:00", "10:00"].map(t => <option key={t}>{t}</option>)}</Select></div>
            <div className="rulerow"><div><div className="lbl">Blinkit gate</div><div className="help">Minimum days to best-before the app accepts.</div></div><Input className="input" type="number" value={f.gates.blinkit} onChange={e => setG("blinkit", +e.target.value)} /></div>
            <div className="rulerow"><div><div className="lbl">Zepto gate</div><div className="help">Share of shelf life remaining.</div></div><Input className="input" type="number" step="0.05" value={f.gates.zepto} onChange={e => setG("zepto", +e.target.value)} /></div>
            <div className="rulerow"><div><div className="lbl">Instamart gate</div><div className="help">Share of shelf life remaining.</div></div><Input className="input" type="number" step="0.05" value={f.gates.instamart} onChange={e => setG("instamart", +e.target.value)} /></div>
            <div className="rulerow"><div><div className="lbl">Label photo required</div><div className="help">Nothing is priced from the spreadsheet alone.</div></div><Toggle on={f.requirePhoto} onChange={x => set("requirePhoto", x)} label="Require photo" /></div>
          </Plate>
          <Plate className="stack-sm"><h3>Valuer and Router</h3>
            <div className="rulerow"><div><div className="lbl">Floor price</div><div className="help">Percent of MRP below which no door is offered.</div></div><Input className="input" type="number" value={f.floorPctMrp} onChange={e => set("floorPctMrp", +e.target.value)} /></div>
            <div className="rulerow"><div><div className="lbl">Cap · kirana shops</div><div className="help">Cartons a cluster can take in a 48-hour scheme.</div></div><Input className="input" type="number" step="0.5" value={f.caps.shops} onChange={e => setC("shops", +e.target.value)} /></div>
            <div className="rulerow"><div><div className="lbl">Cap · brand site</div><div className="help">Cartons the D2C store will list.</div></div><Input className="input" type="number" value={f.caps.d2c} onChange={e => setC("d2c", +e.target.value)} /></div>
            <div className="rulerow"><div><div className="lbl">Cap · staff sale</div><div className="help">Cartons per office.</div></div><Input className="input" type="number" value={f.caps.staff} onChange={e => setC("staff", +e.target.value)} /></div>
            <div className="rulerow"><div><div className="lbl">Offer window</div><div className="help">Hours a Hindi scheme stays open.</div></div><Input className="input" type="number" value={f.offerWindowHours} onChange={e => set("offerWindowHours", +e.target.value)} /></div>
            <div className="rulerow"><div><div className="lbl">Marketplace token</div><div className="help">Percent of the award paid on acceptance.</div></div><Input className="input" type="number" value={f.tokenPct} onChange={e => set("tokenPct", +e.target.value)} /></div>
          </Plate>
          <Plate className="stack-sm"><h3>Approval policy</h3>
            <div className="rulerow"><div><div className="lbl">Auto-approve plans under</div><div className="help">Rupees at stake. 0 means every plan waits for a human tap.</div></div><Input className="input" type="number" value={f.autoApproveUnder} onChange={e => set("autoApproveUnder", +e.target.value)} /></div>
            <div className="rulerow"><div><div className="lbl">Offers in Hindi</div><div className="help">Retailer pushes go out in the shop's language.</div></div><Toggle on={f.hindiOffers} onChange={x => set("hindiOffers", x)} label="Hindi offers" /></div>
          </Plate>
        </div><aside className="aside"><Plate tone="chrome-soft" className="t-small"><b>Who may change this</b><p>Admins only. Every save is in the audit log with the fields that changed; the agents pick the new rules up on their next run.</p></Plate><Plate className="stack-sm"><h3>Agents on Cloud Run</h3>{["Watcher", "Vision", "Valuer", "Router", "Lister", "Outreach", "Negotiator", "Paperwork", "Impact"].map(a => <div key={a} className="row between t-small"><span>{a}</span><Chip tone="emerald" dot>healthy</Chip></div>)}</Plate></aside></div>
      </div></>;
  }

  function Integrations({ user, nav }) {
    const v = useDB(); const list = DB.all("integrations"); const [testing, setTesting] = useState(null); const [logs, setLogs] = useState(null);
    const test = it => { setTesting(it.id); setTimeout(() => { DB.update("integrations", it.id, { status: it.id === "expiresoon" ? "ok" : it.status, lastSync: new Date().toISOString() }); DB.audit(user.id, "tested integration", it.id); setTesting(null); }, 1400); };
    return <><Bar user={user} nav={nav} title="Integrations" runhead={<RunHead parts={[{ b: String(list.length), t: "systems" }, { b: String(list.filter(i => i.status !== "ok").length), t: "need attention", hot: list.some(i => i.status === "degraded" || i.status === "down") }]} />} />
      <div className="page"><PageHead title="Integrations" sub="The systems the agents read from and write to. Test a connection or read its recent events." />
        <div className="integr">{list.map(it => <Plate key={it.id} className="stack-sm"><div className="row between"><b>{it.name}</b><StatusChip status={it.status} /></div><div className="t-xs muted mono">{it.kind} · synced {ago(it.lastSync)}</div><p className="t-small muted">{it.detail}</p><div className="row wrap"><Btn size="sm" icon="plug" loading={testing === it.id} onClick={() => test(it)}>Test connection</Btn><Btn size="sm" kind="ghost" icon="history" onClick={() => setLogs(it)}>Events</Btn></div></Plate>)}</div>
      </div>
      <Sheet open={!!logs} onClose={() => setLogs(null)} title={logs ? logs.name + " · events" : ""}>{logs && <div className="stack-sm">{DB.list("events", { sort: ["at", "desc"], limit: 12 }).map(e => <div key={e.id} className="row between t-small" style={{ padding: "6px 0", borderBottom: "var(--kl-thin) solid var(--line)" }}><span className="mono">{e.topic}</span><span className="t-xs muted mono">{when(e.at)}</span></div>)}{!DB.list("events").length && <p className="t-small muted">No events yet.</p>}</div>}</Sheet>
    </>;
  }

  function Audit({ user, nav }) {
    const v = useDB(); const [q, setQ] = useState(""); const [who, setWho] = useState("all");
    const rows = DB.list("audit", { search: q, sort: ["at", "desc"] }).filter(a => who === "all" || a.who === who).map(a => ({ ...a, whoName: a.who === "system" ? "System" : (DB.user(a.who) || {}).name || a.who }));
    return <><Bar user={user} nav={nav} title="Audit log" runhead={<RunHead parts={[{ b: String(rows.length), t: "entries" }]} />} />
      <div className="page"><PageHead title="Audit log" sub="Who did what, when, from which device. Approvals, sign-ins, rule changes, documents." actions={<Btn icon="download" onClick={() => exportCSV(rows.map(a => ({ at: a.at, who: a.whoName, what: a.what, target: a.target, device: a.device })), "audit.csv")}>Export</Btn>} />
        <Toolbar search={q} onSearch={setQ} placeholder="Action, target, person" count={rows.length}><Select value={who} onChange={e => setWho(e.target.value)} aria-label="Person"><option value="all">Everyone</option><option value="system">System</option>{DB.all("users").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Toolbar>
        <DataTable rows={rows} columns={[{ key: "at", label: "When", w: 140, render: a => <span className="mono t-xs">{when(a.at)}</span> }, { key: "whoName", label: "Who", render: a => a.who === "system" ? <Chip mono>system</Chip> : <Who user={a.who} /> }, { key: "what", label: "Action", render: a => <span className="auditrow"><span className="what">{a.what}</span></span> }, { key: "target", label: "Target", render: a => <span className="mono t-small">{String(a.target)}</span> }, { key: "device", label: "Device", render: a => <Chip>{a.device}</Chip> }]} />
      </div></>;
  }

  window.SC_APP = Object.assign(window.SC_APP, { Users, Rules, Integrations, Audit });
})();

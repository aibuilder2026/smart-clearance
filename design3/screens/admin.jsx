// Smart-Clearance v3 · admin (Arjun): users, guardrails, integrations, audit · and every role's inbox and profile
(function () {
  const { useState, useEffect, useMemo, useContext, createContext, Fragment } = React;
  const { motion, AnimatePresence } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Sheet, Field, Input, Select, Menu, DataTable, Empty, Mark, useApp, useNotice, useTheme } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle } = S;

  const ROLES = { operator: "Supply-chain operator", distributor: "Distributor", retailer: "Kirana retailer", buyer: "Marketplace buyer", finance: "Finance & GST", sustainability: "Sustainability & BRSR", foodbank: "Food-bank partner", admin: "Platform admin" };
  const PROVIDERS = { google: "Google", phone: "Phone OTP", expiresoon: "ExpireSoon sign-in" };
  const STATUS_TONE = { active: "green", invited: "blue", deactivated: undefined };
  const audit = (who, what, target) => Store.update(s => { s.audit.unshift({ id: "a-" + Date.now().toString(36), who, what, target, at: "now" }); });

  /* ---------- users ---------- */
  function Users({ me }) {
    const s = useStore(); const app = useApp(); const { toast } = useNotice();
    const [q, setQ] = useState(""); const [invite, setInvite] = useState(false); const [menu, setMenu] = useState(null); const [roleFor, setRoleFor] = useState(null);
    const [form, setForm] = useState({ name: "", contact: "", role: "retailer" });
    const rows = s.users.filter(u => !q || (u.name + " " + (u.org || "") + " " + (ROLES[u.role] || "")).toLowerCase().includes(q.toLowerCase()));
    const setStatus = (u, status) => { Store.update(st => { const x = st.users.find(y => y.id === u.id); if (x) x.status = status; }); audit(me.id, status === "deactivated" ? "deactivated" : "reactivated", u.name); toast({ text: `${u.short || u.name} ${status === "deactivated" ? "deactivated" : "reactivated"}`, tone: "ok" }); };
    const send = () => { const phone = /^[+\d\s]+$/.test(form.contact); const id = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36).slice(-3); Store.update(st => { st.users.push({ id, name: form.name, short: form.name, org: form.name, role: form.role, provider: phone ? "phone" : "google", phone: phone ? form.contact : "", email: phone ? "" : form.contact, status: "invited", lastSeen: null, extra: true }); }); audit(me.id, "invited " + form.name + " as " + ROLES[form.role].toLowerCase(), form.contact); setInvite(false); setForm({ name: "", contact: "", role: "retailer" }); toast({ text: `Invite sent to ${form.contact}`, tone: "ok" }); };
    const counts = Object.keys(STATUS_TONE).map(k => [k, s.users.filter(u => u.status === k).length]);
    return <Screen me={me} title="Users" sub="People and partner organisations with access" actions={app.bp !== "phone" && <Button variant="primary" size="sm" icon="user-plus" onClick={() => setInvite(true)}>Invite</Button>}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="row wrap" style={{ gap: 10 }}><div className="grow" style={{ minWidth: 220 }}><K.SearchField value={q} onChange={setQ} placeholder="Search people, organisations, roles" /></div><span className="row tight wrap">{counts.map(([k, n]) => <Badge key={k} tone={STATUS_TONE[k]} dot>{n} {k}</Badge>)}</span>{app.bp === "phone" && <Button variant="primary" icon="user-plus" onClick={() => setInvite(true)}>Invite</Button>}</div>
        {app.bp === "phone" ? <div className="list">{rows.map(u => <div key={u.id} className="list-row" style={{ gridTemplateColumns: "40px minmax(0,1fr) auto" }}><Avatar person={u} size="sm" /><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{u.name}</b><span className="t-caption subtle">{ROLES[u.role]} · {PROVIDERS[u.provider]}</span></span><span className="row tight"><Badge size="sm" tone={STATUS_TONE[u.status]}>{u.status}</Badge><span style={{ position: "relative" }}><IconButton icon="ellipsis" label={"Actions for " + u.name} onClick={() => setMenu(menu === u.id ? null : u.id)} /><RowMenu u={u} open={menu === u.id} onClose={() => setMenu(null)} onRole={() => setRoleFor(u)} onStatus={setStatus} me={me} /></span></span></div>)}</div> :
        <DataTable rows={rows} initialSort={["name", "asc"]} columns={[
          { key: "name", label: "Person or organisation", render: u => <span className="row tight"><Avatar person={u} size="sm" /><span className="stack tight" style={{ gap: 0 }}><b>{u.name}</b><span className="t-caption subtle">{u.extra ? (u.phone || u.email) : u.org}</span></span></span> },
          { key: "role", label: "Role", sortValue: u => ROLES[u.role], render: u => ROLES[u.role] },
          { key: "provider", label: "Sign-in", render: u => <span className="row tight"><Icon name={u.provider === "google" ? "google" : u.provider === "phone" ? "smartphone" : "hourglass"} size={15} />{PROVIDERS[u.provider]}</span> },
          { key: "status", label: "Status", render: u => <Badge size="sm" tone={STATUS_TONE[u.status]} dot>{u.status}</Badge> },
          { key: "act", label: "", sortable: false, render: u => <span style={{ position: "relative", display: "inline-block" }} onClick={e => e.stopPropagation()}><IconButton icon="ellipsis" label={"Actions for " + u.name} onClick={() => setMenu(menu === u.id ? null : u.id)} /><RowMenu u={u} open={menu === u.id} onClose={() => setMenu(null)} onRole={() => setRoleFor(u)} onStatus={setStatus} me={me} /></span> },
        ]} />}
      </div>
      <Sheet open={invite} onClose={() => setInvite(false)} title="Invite someone" side={app.bp === "phone" ? "bottom" : "center"} detent="medium" footer={<Button variant="primary" block icon="send" disabled={!form.name || !form.contact} onClick={send}>Send invite</Button>}>
        <div className="stack">
          <Field label="Name or organisation" htmlFor="inv-name"><Input id="inv-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Shree Sai Kirana" /></Field>
          <Field label="Email or mobile number" htmlFor="inv-contact" help="Brand staff sign in with Google; the trade signs in with a one-time code."><Input id="inv-contact" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="+91 98230 60013" /></Field>
          <Field label="Role" htmlFor="inv-role"><Select id="inv-role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        </div>
      </Sheet>
      <Sheet open={!!roleFor} onClose={() => setRoleFor(null)} title={roleFor ? "Role for " + (roleFor.short || roleFor.name) : ""} side={app.bp === "phone" ? "bottom" : "center"} detent="medium">
        {roleFor && <div className="list">{Object.entries(ROLES).map(([k, v]) => <button type="button" key={k} className="list-row" style={{ gridTemplateColumns: "minmax(0,1fr) auto", width: "100%", textAlign: "left" }} onClick={() => { Store.update(st => { const x = st.users.find(y => y.id === roleFor.id); if (x) x.role = k; }); audit(me.id, "changed the role to " + v.toLowerCase(), roleFor.name); toast({ text: "Role updated", tone: "ok" }); setRoleFor(null); }}><span>{v}</span>{roleFor.role === k && <Icon name="check" size={18} />}</button>)}</div>}
      </Sheet>
    </Screen>;
  }
  function RowMenu({ u, open, onClose, onRole, onStatus, me }) {
    const { toast } = useNotice();
    const items = [{ label: "Change role", icon: "user-cog", onClick: onRole }];
    if (u.status === "invited") items.push({ label: "Resend invite", icon: "send", onClick: () => toast({ text: "Invite resent", tone: "ok" }) });
    if (u.id !== me.id) items.push(u.status === "deactivated" ? { label: "Reactivate", icon: "user-check", onClick: () => onStatus(u, "active") } : { label: "Deactivate", icon: "user-x", danger: true, onClick: () => onStatus(u, "deactivated") });
    return <Menu open={open} onClose={onClose} items={items} width={200} />;
  }

  /* ---------- guardrails ---------- */
  function Rules({ me }) {
    const s = useStore(); const app = useApp(); const { toast } = useNotice(); const [r, setR] = useState(s.rules); const dirty = JSON.stringify(r) !== JSON.stringify(s.rules);
    const set = (k, v) => setR({ ...r, [k]: v }); const setFloor = (k, v) => setR({ ...r, floors: { ...r.floors, [k]: v } });
    const save = () => { Store.update(st => { st.rules = r; }); audit(me.id, "updated the guardrails", "Rules"); toast({ text: "Guardrails saved · agents use them from the next run", tone: "ok" }); };
    return <Screen me={me} title="Guardrails" sub="What the agents may and may not do" actions={app.bp !== "phone" && <Button variant="primary" size="sm" icon="check" disabled={!dirty} onClick={save}>Save</Button>}>
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: app.bp === "desktop" ? "repeat(2, minmax(0,1fr))" : "minmax(0,1fr)", alignItems: "start" }}>
        <div className="stack" style={{ gap: 20 }}>
          <List head="Floor price, % of MRP" foot="No channel sells below its category's floor.">{Object.keys(r.floors).map(k => <ListRow key={k} title={k.replace("-", " ").replace(/^./, c => c.toUpperCase())} value={<Stepper value={r.floors[k]} onChange={v => setFloor(k, v)} min={20} max={70} step={5} label={"Floor for " + k} format={v => v + "%"} />} />)}</List>
          <List head="Approvals"><ListRow title="Routes per channel that need a tap" value={<Stepper value={r.approvalTaps} onChange={v => set("approvalTaps", v)} min={1} max={50} label="Routes needing approval" />} /><ListRow title="Require a label photo before pricing" value={<Switch checked={r.requirePhoto} onChange={v => set("requirePhoto", v)} label="Require a label photo" />} /></List>
        </div>
        <div className="stack" style={{ gap: 20 }}>
          <List head="Offers and marketplace"><ListRow title="Kirana offers in Hindi" value={<Switch checked={r.hindiOffers} onChange={v => set("hindiOffers", v)} label="Hindi offers" />} /><ListRow title="Offer window" value={<Stepper value={r.offerWindowHours} onChange={v => set("offerWindowHours", v)} min={12} max={96} step={12} label="Offer window hours" format={v => v + " h"} />} /><ListRow title="Buyer token" value={<Stepper value={r.tokenPct} onChange={v => set("tokenPct", v)} min={5} max={30} step={5} label="Token percent" format={v => v + "%"} />} /><ListRow title="Watcher runs daily at" value={<span className="tnum strong">{r.watchTime}</span>} /></List>
          <List head="Write-off factors" foot="Used for the true cost of destroying a batch. EPR is indicative."><ListRow title="Disposal, a unit" value={<Stepper value={r.disposalPerUnit} onChange={v => set("disposalPerUnit", Math.round(v * 100) / 100)} min={0.5} max={5} step={0.25} label="Disposal per unit" format={v => "₹" + v.toFixed(2)} />} /><ListRow title="EPR, a kg of packaging" value={<Stepper value={r.eprPerKg} onChange={v => set("eprPerKg", v)} min={1} max={20} label="EPR per kg" format={v => "₹" + v} />} /></List>
          {app.bp === "phone" && <Button variant="primary" size="lg" icon="check" disabled={!dirty} onClick={save}>Save guardrails</Button>}
        </div>
      </div>
    </Screen>;
  }

  /* ---------- integrations ---------- */
  const KIND_ICON = { Identity: "key-round", Push: "bell", Data: "database", Events: "radio-tower", Agents: "sparkles", Marketplace: "shopping-bag", Donation: "heart-handshake", Inventory: "file-spreadsheet" };
  function Integrations({ me }) {
    const s = useStore(); const { toast } = useNotice(); const [busy, setBusy] = useState(null);
    const test = i => { setBusy(i.id); setTimeout(() => { setBusy(null); toast({ text: `${i.name} · ${i.status === "mock" ? "stub answered" : "connected"} in ${80 + Math.round(Math.random() * 160)} ms`, tone: "ok" }); }, 900); };
    return <Screen me={me} title="Integrations" sub="Google Cloud services and partner APIs">
      <div className="list">{s.integrations.map(i => <div key={i.id} className="list-row" style={{ gridTemplateColumns: "40px minmax(0,1fr) auto" }}><span className={cx("icontile", i.status === "mock" && "soft")}><Icon name={KIND_ICON[i.kind] || "plug"} size={17} stroke={2} /></span><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{i.name} <span className="subtle t-caption" style={{ fontWeight: 500 }}>{i.kind}</span></b><span className="t-caption subtle">{i.note}</span></span><span className="row tight"><Badge size="sm" tone={i.status === "ok" ? "green" : "violet"} dot>{i.status === "ok" ? "connected" : "mocked"}</Badge><Button variant="ghost" size="sm" loading={busy === i.id} onClick={() => test(i)}>Test</Button></span></div>)}</div>
    </Screen>;
  }

  /* ---------- audit ---------- */
  function Audit({ me }) {
    const s = useStore(); const [who, setWho] = useState("all");
    const people = Array.from(new Set(s.audit.map(a => a.who)));
    const rows = s.audit.filter(a => who === "all" || a.who === who);
    return <Screen me={me} title="Audit log" sub="Every human decision, with who and when">
      <div className="stack" style={{ gap: 16 }}>
        <div className="row tight wrap"><button type="button" className="chip" aria-pressed={who === "all"} onClick={() => setWho("all")}>Everyone</button>{people.map(p => <button type="button" key={p} className="chip" aria-pressed={who === p} onClick={() => setWho(p)}>{S.PEOPLE_BY_ID(p).short || S.PEOPLE_BY_ID(p).name}</button>)}</div>
        {rows.length ? <div className="list">{rows.map(a => { const p = S.PEOPLE_BY_ID(a.who); return <div key={a.id} className="list-row" style={{ gridTemplateColumns: "40px minmax(0,1fr) auto" }}><Avatar person={p} size="sm" /><span className="stack tight" style={{ gap: 0 }}><span className="t-subhead"><b>{p.short || p.name}</b> {a.what}</span><span className="t-caption subtle mono">{a.target}</span></span><span className="t-caption subtle tnum">{a.at}</span></div>; })}</div> : <Card><Empty icon="scroll-text" title="Nothing logged yet" body="Approvals, photos, bids, dispatches and settings changes appear here." /></Card>}
      </div>
    </Screen>;
  }

  /* ---------- every role: inbox and profile ---------- */
  const AccountCtx = S.AccountCtx;
  function Inbox({ me, routes }) {
    const s = useStore(); const { go } = useRoute(); const mine = s.notifications.filter(n => n.to === me.id);
    const open = n => { Store.update(st => { const x = st.notifications.find(y => y.id === n.id); if (x) x.read = true; }); if (n.link && (!routes || routes.includes(n.link))) go(n.link); };
    const unread = mine.filter(n => !n.read).length;
    return <Screen me={me} title="Inbox" sub={unread ? `${unread} unread` : "All caught up"} actions={unread > 0 && <Button variant="ghost" size="sm" onClick={() => Store.update(st => st.notifications.forEach(n => { if (n.to === me.id) n.read = true; }))}>Mark all read</Button>}>
      {mine.length ? <div className="list" style={{ maxWidth: 720 }}>{mine.map(n => <button type="button" key={n.id} className="list-row" onClick={() => open(n)} style={{ gridTemplateColumns: "36px minmax(0,1fr) auto", width: "100%", textAlign: "left", alignItems: "start" }}><Mark size={32} /><span className="stack tight" style={{ gap: 2 }}><b className="t-subhead">{n.title}</b><span className={cx("t-footnote muted", n.hindi && "hi")} lang={n.hindi ? "hi" : undefined}>{n.body}</span></span><span className="stack tight" style={{ justifyItems: "end", gap: 6 }}><span className="t-caption subtle tnum">{n.at}</span>{!n.read && <span aria-label="unread" style={{ width: 9, height: 9, borderRadius: 9, background: "var(--primary)" }} />}</span></button>)}</div> : <Card style={{ maxWidth: 720 }}><Empty icon="bell" title="No notifications" body="Pushes from the agents land here too, so nothing is lost if a phone was off." /></Card>}
    </Screen>;
  }
  function Profile({ me }) {
    const { mode, setMode } = useTheme(); const acc = useContext(AccountCtx); const app = useApp(); const { toast } = useNotice(); const { go } = useRoute();
    const lkey = "sc3-lang-" + me.id; const [lang, setLang] = useState(() => { try { return localStorage.getItem(lkey) || (["rakesh", "ganesh"].includes(me.id) ? "hi" : "en"); } catch (e) { return "en"; } });
    const setL = v => { setLang(v); try { localStorage.setItem(lkey, v); } catch (e) {} };
    const [push, setPush] = useState(true); const [digest, setDigest] = useState(me.role === "finance" || me.role === "sustainability");
    return <Screen me={me} title="Profile" sub={ROLES[me.role]}>
      <div className="stack" style={{ gap: 20, maxWidth: 680 }}>
        <Card className="row" style={{ gap: 16 }}><Avatar person={me} size="xl" ring /><div className="stack tight" style={{ gap: 2 }}><div className="t-title2">{me.name}</div><span className="muted">{ROLES[me.role]} · {me.org}</span><span className="t-footnote subtle row tight"><Icon name={me.provider === "google" ? "google" : me.provider === "phone" ? "smartphone" : "hourglass"} size={14} />{PROVIDERS[me.provider]}{me.email ? " · " + me.email : me.phone ? " · " + me.phone : ""}</span></div></Card>
        {me.role === "operator" && <List head="Workspace"><ListRow icon="sliders-horizontal" title="Setup and guardrails" sub="DMS mapping, floors, allow-list, partners" chevron onClick={() => go("setup")} /><ListRow icon="chart-line" title="Finance & ESG" sub="Ledger, BRSR export" chevron onClick={() => go("report")} /></List>}
        <List head="Appearance"><ListRow title="Theme" value={<Segmented options={[{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }, { id: "system", label: "Auto" }]} value={mode} onChange={setMode} label="Theme" size="sm" />} /></List>
        <List head="Notifications" foot="Offers to the trade go out in the language each person picks."><ListRow title="Language" value={<Segmented options={[{ id: "en", label: "English" }, { id: "hi", label: "हिन्दी" }]} value={lang} onChange={setL} label="Notification language" size="sm" />} /><ListRow title="Push notifications" value={<Switch checked={push} onChange={setPush} label="Push notifications" />} /><ListRow title="Weekly digest by email" value={<Switch checked={digest} onChange={setDigest} label="Weekly digest" />} /></List>
        {acc.install !== undefined && <List head="This device"><ListRow icon="download" title="Install Smart-Clearance" sub={acc.install ? "Opens full screen, works offline, gets pushes" : acc.standalone ? "Installed on this device" : "In Safari, tap Share, then Add to Home Screen"} value={acc.install ? <Button variant="secondary" size="sm" onClick={acc.install}>Install</Button> : null} /></List>}
        {(acc.switchTo || acc.signOut || acc.reset) && <List head="Account">
          {acc.switchTo && <ListRow icon="users" title="Switch account" sub="Try the journey as another person" chevron onClick={acc.switchTo} />}
          {acc.reset && <ListRow icon="rotate-ccw" title="Reset demo data" sub="Puts the batch back to the start" onClick={() => { acc.reset(); toast({ text: "Demo data reset" }); }} />}
          {acc.signOut && <ListRow icon="log-out" iconTone="red" title="Sign out" onClick={acc.signOut} />}
        </List>}
      </div>
    </Screen>;
  }

  Object.assign(window.SC3_SCREENS, { Users, Rules, Integrations, Audit, Inbox, Profile, AccountCtx, ROLES, PROVIDERS });
})();

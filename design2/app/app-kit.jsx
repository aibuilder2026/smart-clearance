// Smart-Clearance app v2 · app kit: data hooks, tables, filters, detail scaffolding, confirm and form sheets, menus, status chips
(function () {
  const { useState, useEffect, useMemo, useRef, useCallback } = React;
  const K = window.SC2; const { Icon, Avatar, Btn, Chip, Plate, Sheet, Menu, Input, Select, Field, Empty, Skeleton, inr, num, cx } = K;
  const DB = window.DB, Auth = window.Auth;

  /* ---- data hooks: re-render on any store change ---- */
  function useDB() { const [v, setV] = useState(DB.version); useEffect(() => DB.subscribe(setV), []); return v; }
  function useQuery(coll, opts, deps = []) { const v = useDB(); return useMemo(() => DB.list(coll, opts), [coll, v, JSON.stringify(opts && opts.where ? Object.keys(opts.where) : null), opts && opts.search, opts && opts.sort && opts.sort.join(), ...deps]); }
  function useDoc(coll, id) { const v = useDB(); return useMemo(() => DB.get(coll, id), [coll, id, v]); }
  function useAuth() { const [u, setU] = useState(Auth.currentUser); const v = useDB(); useEffect(() => Auth.onAuthStateChanged(setU), []); useEffect(() => { setU(Auth.currentUser); }, [v]); return u; }

  /* ---- formatting ---- */
  const ago = iso => { if (!iso) return "never"; const d = (Date.now() - new Date(iso).getTime()) / 1000; if (d < 90) return "just now"; if (d < 3600) return Math.round(d / 60) + " min ago"; if (d < 86400) return Math.round(d / 3600) + " h ago"; if (d < 86400 * 14) return Math.round(d / 86400) + " d ago"; return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); };
  const when = iso => iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }) : "";
  const initials = name => (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const STATUS = {
    watching: ["", "Watching"], at_risk: ["vermilion", "At risk"], verifying: ["chrome", "Verifying"], planned: ["chrome", "Plan ready"], approved: ["emerald", "Approved"], executing: ["emerald", "Executing"], settling: ["ultra", "Settling"], settled: ["ultra", "Settled"], cleared: ["ultra", "Cleared"], written_off: ["vermilion", "Written off"],
    active: ["emerald", "Active"], invited: ["chrome", "Invited"], deactivated: ["", "Deactivated"],
    ok: ["emerald", "Connected"], degraded: ["chrome", "Degraded"], down: ["vermilion", "Down"], manual: ["", "Manual"],
    confirmed: ["emerald", "Confirmed"], delivered: ["ultra", "Delivered"], paid: ["ultra", "Paid"], token_paid: ["emerald", "Token paid"], collected: ["ultra", "Collected"], pending: ["chrome", "Pending"],
    issued: ["emerald", "Issued"], not_required: ["", "Not required"], draft: ["chrome", "Draft"],
    live: ["emerald", "Live"], awarded: ["ultra", "Awarded"], closed: ["", "Closed"], countered: ["chrome", "Countered"], accepted: ["emerald", "Accepted"], placed: ["chrome", "Placed"],
    awaiting_approval: ["chrome", "Awaiting approval"], rejected: ["vermilion", "Rejected"], planned_round: ["chrome", "Planned"], done: ["emerald", "Done"], running: ["chrome", "Running"],
  };
  function StatusChip({ status, solid }) { const [tone, label] = STATUS[status] || ["", status]; return <Chip tone={tone || undefined} solid={solid} dot={!solid}>{label}</Chip>; }
  const ROLE_LABEL = { operator: "Operator", finance: "Finance", sustainability: "Sustainability", distributor: "Distributor", retailer: "Retailer", buyer: "Buyer", foodbank: "Food bank", admin: "Admin" };
  const ROLE_TONE = { operator: "chrome", finance: "ultra", sustainability: "emerald", distributor: "kraft", retailer: "vermilion", buyer: "violet", foodbank: "emerald", admin: "ultra" };
  function RoleChip({ role }) { return <Chip tone={ROLE_TONE[role]}>{ROLE_LABEL[role] || role}</Chip>; }
  function Who({ user, sub }) { const u = typeof user === "string" ? DB.user(user) : user; if (!u) return <span className="muted">{String(user)}</span>; return <span className="cellwho">{u.avatar ? <Avatar person={{ name: u.name, img: u.avatar }} size="sm" /> : <span className="ginitial" style={{ width: 28, height: 28, fontSize: 12 }}>{initials(u.name)}</span>}<span><b>{u.name}</b><span>{sub || u.email || u.phone}</span></span></span>; }

  /* ---- page head and toolbar ---- */
  function PageHead({ title, sub, actions, children }) { return <div className="pagehead"><div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}{children}</div>{actions && <div className="actions">{actions}</div>}</div>; }
  function Toolbar({ search, onSearch, placeholder = "Search", children, count }) { return <div className="toolbar">{onSearch && <div className="search"><Input icon="search" placeholder={placeholder} value={search} onChange={e => onSearch(e.target.value)} aria-label={placeholder} /></div>}{children}{count != null && <span className="count">{count} rows</span>}</div>; }
  function Pills({ options, value, onChange }) { return <div className="pills" role="group">{options.map(o => <button type="button" key={o.id} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}{o.count != null && <b>{o.count}</b>}</button>)}</div>; }

  /* ---- table ---- */
  function DataTable({ columns, rows, rowKey = "id", onRow, sort, onSort, empty, selectedId, pageSize = 25 }) {
    const [page, setPage] = useState(0);
    useEffect(() => { setPage(0); }, [rows.length]);
    const sorted = useMemo(() => { if (!sort) return rows; const [k, dir] = sort; const col = columns.find(c => c.key === k); const get = r => col && col.sortValue ? col.sortValue(r) : r[k]; return rows.slice().sort((a, b) => { const x = get(a), y = get(b); return (x > y ? 1 : x < y ? -1 : 0) * (dir === "desc" ? -1 : 1); }); }, [rows, sort, columns]);
    const slice = sorted.slice(page * pageSize, (page + 1) * pageSize); const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
    if (!rows.length) return <Plate>{empty || <Empty icon="search" title="Nothing matches" body="Try another search or clear the filters." />}</Plate>;
    return <div className="stack-sm">
      <div className="tablewrap scroll"><table className="table"><thead><tr>{columns.map(c => <th key={c.key} className={cx(c.n && "n")} style={c.w ? { width: c.w } : undefined}>{c.sortable !== false && onSort ? <button type="button" onClick={() => onSort([c.key, sort && sort[0] === c.key && sort[1] === "asc" ? "desc" : "asc"])} aria-label={"Sort by " + c.label}>{c.label}{sort && sort[0] === c.key ? <Icon name={sort[1] === "asc" ? "up" : "down"} size={12} /> : null}</button> : c.label}</th>)}</tr></thead>
        <tbody>{slice.map(r => <tr key={r[rowKey]} className={cx(onRow && "clickable", selectedId === r[rowKey] && "sel")} onClick={onRow ? (e => { if (e.target.closest("button, a, input, select")) return; onRow(r); }) : undefined}>{columns.map(c => <td key={c.key} className={cx(c.n && "n", c.w && "w")}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody></table></div>
      {pages > 1 && <div className="pager"><span>{page * pageSize + 1} to {Math.min(sorted.length, (page + 1) * pageSize)} of {sorted.length}</span><span className="row"><Btn size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} icon="left">Previous</Btn><Btn size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next <Icon name="right" size={14} /></Btn></span></div>}
    </div>;
  }

  /* ---- detail scaffolding ---- */
  function KV({ items }) { return <dl className="kv">{items.filter(Boolean).map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>; }
  function ConfirmSheet({ open, onClose, title, body, confirmLabel = "Confirm", tone = "yes", onConfirm, danger, children }) {
    const [busy, setBusy] = useState(false);
    const go = async () => { setBusy(true); try { await onConfirm(); onClose(); } finally { setBusy(false); } };
    return <Sheet open={open} onClose={onClose} title={title} footer={<><Btn kind={danger ? "danger" : tone} size="lg" full loading={busy} onClick={go}>{confirmLabel}</Btn><Btn kind="ghost" full onClick={onClose}>Cancel</Btn></>}><div className="stack">{body && <p>{body}</p>}{children}</div></Sheet>;
  }
  function FormSheet({ open, onClose, title, submitLabel = "Save", onSubmit, children, valid = true }) {
    const [busy, setBusy] = useState(false); const [err, setErr] = useState(null);
    const go = async () => { setBusy(true); setErr(null); try { await onSubmit(); onClose(); } catch (e) { setErr(e.message || String(e)); } finally { setBusy(false); } };
    return <Sheet open={open} onClose={onClose} title={title} footer={<>{err && <Plate tone="vermilion-soft" tight><b style={{ color: "var(--vermilion-text)" }}>{err}</b></Plate>}<Btn kind="primary" size="lg" full loading={busy} disabled={!valid} onClick={go}>{submitLabel}</Btn><Btn kind="ghost" full onClick={onClose}>Cancel</Btn></>}><div className="formgrid">{children}</div></Sheet>;
  }
  function Actions({ items, label = "Actions" }) {
    const [open, setOpen] = useState(false);
    return <span className="rowmenu"><Btn size="sm" className="sq" aria-label={label} onClick={e => { e.stopPropagation(); setOpen(!open); }}><Icon name="more" size={18} /></Btn><Menu open={open} onClose={() => setOpen(false)}>{items.filter(Boolean).map((it, i) => it === "-" ? <div key={i} className="sep" /> : <button type="button" key={it.label} className={cx(it.danger && "danger")} onClick={e => { e.stopPropagation(); setOpen(false); it.onClick(); }}>{it.icon && <Icon name={it.icon} size={18} />}{it.label}</button>)}</Menu></span>;
  }
  function Stat({ value, label, tone }) { return <div className={cx("tile", tone)}><div className="tv">{value}</div><div className="tl">{label}</div></div>; }

  /* ---- notifications ---- */
  function NotificationsSheet({ open, onClose, user, onOpenLink }) {
    const items = useQuery("notifications", { where: { user: user.id }, sort: ["at", "desc"] });
    const unread = items.filter(n => !n.read).length;
    return <Sheet open={open} onClose={onClose} title={unread ? unread + " unread" : "Notifications"} footer={items.length ? <Btn kind="ghost" full onClick={() => items.forEach(n => !n.read && DB.update("notifications", n.id, { read: true }))}>Mark all read</Btn> : null}>
      {!items.length ? <Empty icon="bell" title="No notifications yet" body="Pushes from the agents land here, newest first." /> : <div className="stack-sm">{items.map(n => <Plate key={n.id} as="button" type="button" tone={n.read ? undefined : "ultra-soft"} tight className="notif" onClick={() => { DB.update("notifications", n.id, { read: true }); onClose(); if (n.link && onOpenLink) onOpenLink(n.link); }}><K.Mark size="sm" sun={false} /><div className="grow"><div className="row between"><b style={{ fontSize: 14 }}>{n.title}</b><span className="t-xs muted mono">{ago(n.at)}</span></div><div className={cx("t-small", n.hindi && "hi")}>{n.body}</div></div>{!n.read ? <Chip tone="chrome" solid>new</Chip> : null}</Plate>)}</div>}
    </Sheet>;
  }

  /* ---- user menu and profile ---- */
  function UserMenu({ user, onProfile, onSignOut, onAdmin }) {
    const [open, setOpen] = useState(false); const { resolved, setTheme } = K.useTheme();
    return <span className="rowmenu"><button type="button" className="iconbtn" style={{ width: "auto", padding: "0 6px" }} aria-label="Account" onClick={() => setOpen(!open)}>{user.avatar ? <Avatar person={{ name: user.name, img: user.avatar }} size="md" /> : <span className="ginitial">{initials(user.name)}</span>}</button>
      <Menu open={open} onClose={() => setOpen(false)}><div className="mh">{user.name} · {ROLE_LABEL[user.role]}</div><button type="button" onClick={() => { setOpen(false); onProfile(); }}><Icon name="user" size={18} />Profile and settings</button><button type="button" onClick={() => setTheme(resolved === "night" ? "day" : "night")}><Icon name={resolved === "night" ? "sun" : "moon"} size={18} />{resolved === "night" ? "Day edition" : "Night edition"}</button>{user.admin && onAdmin && <button type="button" onClick={() => { setOpen(false); onAdmin(); }}><Icon name="shield" size={18} />Admin</button>}<div className="sep" /><button type="button" className="danger" onClick={() => { setOpen(false); onSignOut(); }}><Icon name="logout" size={18} />Sign out</button></Menu></span>;
  }

  window.SC_APP = Object.assign(window.SC_APP || {}, { useDB, useQuery, useDoc, useAuth, ago, when, initials, STATUS, StatusChip, RoleChip, ROLE_LABEL, ROLE_TONE, Who, PageHead, Toolbar, Pills, DataTable, KV, ConfirmSheet, FormSheet, Actions, Stat, NotificationsSheet, UserMenu });
})();

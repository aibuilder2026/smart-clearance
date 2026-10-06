// Smart-Clearance v3 · the console at console.smartclearance.com: where Smart-Clearance staff set up and run each
// client's workspace. A client's agents are laid out as the stops they work, with the human approval as a locked amber
// gate; setting up a client means deciding how far each agent may go before a person says yes.
(function () {
  const { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, Fragment, useSyncExternalStore } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, P = window.SC3_PLATFORM, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Sheet, Alert, Field, Input, Select, Menu, Tabs, Check, DataTable, Empty, Mark, Wordmark, WorkspaceMark, Page, Shell, Tracker, TrackerCompact, Product, ThemeProvider, AppRoot, NoticeHost, useApp, useNotice, ModeMenuButton } = K;
  const { Columns, SectionTitle } = S;

  P.usePersistence();
  const usePlatform = () => useSyncExternalStore(P.subscribe, P.get);
  // where the other pages live: relative next to each other here, the claude.ai/design links on the hosted pages
  const LINKS = Object.assign({ site: "../site/Smart-Clearance%20site%20v3.html", app: "../app/Smart-Clearance%20app%20v3.html", demo: "../demo/Smart-Clearance%20demo%20v3.html" }, window.SC3_LINKS || {});
  const PLATE = (window.SC3_SITE_IMG || "../site/assets/plates/") + "scene.webp";
  const STAGES = D.STAGES.map(x => ({ id: x.id, title: x.title, human: x.human }));
  const AGENT = id => P.AGENTS.find(a => a.id === id);
  const LEVEL = id => P.AUTONOMY.find(x => x.id === id);
  const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };

  /* ---------- routes live in the hash ---------- */
  // #/overview · #/clients · #/clients/<id>/<tab> · #/new-client · #/agents · #/connectors · #/plans · #/staff · #/audit
  const parse = () => { const m = /^#\/([a-z-]+)(?:\/([a-z0-9-]+))?(?:\/([a-z-]+))?/.exec(location.hash || ""); return m ? { name: m[1], id: m[2] || null, tab: m[3] || null } : { name: "overview", id: null, tab: null }; };
  function useHashRoute() {
    const [route, setRoute] = useState(parse);
    useEffect(() => { const f = () => setRoute(parse()); window.addEventListener("hashchange", f); window.addEventListener("popstate", f); return () => { window.removeEventListener("hashchange", f); window.removeEventListener("popstate", f); }; }, []);
    const go = useCallback((name, id, tab, replace) => { const h = "#/" + [name, id, tab].filter(Boolean).join("/"); if (location.hash !== h) { if (replace) history.replaceState(null, "", h); else history.pushState(null, "", h); } setRoute(parse()); }, []);
    return [route, go];
  }
  const SESSION = "sc3-console-session";
  const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION) || "null"); } catch (e) { return null; } };
  const writeSession = v => { try { if (v) localStorage.setItem(SESSION, JSON.stringify(v)); else localStorage.removeItem(SESSION); } catch (e) {} };

  const NAV = [
    { id: "overview", label: "Overview", short: "Today", icon: "layout-dashboard" },
    { id: "clients", label: "Clients", icon: "building-2" },
    { id: "agents", label: "Agents", icon: "bot" },
    { id: "connectors", label: "Connectors", icon: "plug", phoneHidden: true },
    { id: "plans", label: "Plans", icon: "layout-grid", phoneHidden: true },
    { id: "staff", label: "Staff", icon: "users", phoneHidden: true },
    { id: "audit", label: "Audit log", short: "Audit", icon: "scroll-text" },
  ];

  function Screen({ title, sub, back, onBack, actions, children }) {
    const app = useApp();
    return <Page title={title} sub={sub} back={back} onBack={onBack} actions={<>{actions}{app.bp !== "phone" && <ModeMenuButton />}</>}>{children}</Page>;
  }
  const statusBadge = c => c.status === "live" ? <Badge size="sm" tone="green" dot>Live</Badge> : <Badge size="sm" dot>Setting up</Badge>;
  const planName = id => (P.PLANS.find(p => p.id === id) || { name: id }).name;
  const agentsOn = c => P.AGENTS.filter(a => !a.gate && c.agents[a.id].on).length;

  /* ---------- sign-in: platform staff only, a work email and a password (SC-46) ---------- */
  // One message for any wrong sign-in: the real console (Firebase Authentication, with email enumeration protection)
  // never says whether an address has an account. Nothing is mailed, so there is no "forgot password": a Super admin
  // puts an account back on its first password. In the prototype any password lets an active staff member in.
  const WRONG = "That email and password don't match. Check both, or ask a Super admin to put your account back on its first password.";
  function SignIn({ onIn }) {
    const app = useApp(); const s = usePlatform(); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [show, setShow] = useState(false); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [find, setFind] = useState(false);
    const submit = e => {
      e.preventDefault(); setErr("");
      const who = s.staff.find(x => x.status === "active" && x.email.toLowerCase() === email.trim().toLowerCase());
      if (!who || !pw) { setErr(WRONG); return; }
      setBusy(true); setTimeout(() => { setBusy(false); onIn(who.id); }, 600);
    };
    const edit = set => e => { set(e.target.value); setErr(""); };
    return <div className="signin cs-signin">
      <div className="ground" aria-hidden="true" />
      {app.bp === "desktop" && <div className="cs-si-stage">
        <div className="si-product"><Mark size={36} /><Wordmark size={21} /></div>
        <div className="stack tight" style={{ gap: 10 }}><h2 className="cs-si-title">Console</h2><p className="cs-si-lede">Set up and run every client's workspace: its agents, its supply chain, its people.</p></div>
        <img className="cs-si-plate" src={PLATE} alt="" width="1376" height="752" />
      </div>}
      <div className="si-panel"><div className="si-card">
        <div className="si-ws"><Mark size={app.bp === "phone" ? 52 : 60} /><div className="si-ws-name">Smart-Clearance staff</div><span className="si-url"><Icon name="lock" size={12} stroke={2.2} />console.smartclearance.com</span></div>
        <div className="stack tight" style={{ gap: 6 }}><h1 className="si-title">Sign in</h1><p className="si-sub">Your smartclearance.com email address and your password.</p></div>
        <form className="si-form" noValidate onSubmit={submit}>
          <Field label="Work email" htmlFor="si-email"><Input id="si-email" icon="mail" type="email" value={email} onChange={edit(setEmail)} autoComplete="username" spellCheck={false} autoCapitalize="none" placeholder="name@smartclearance.com" /></Field>
          <Field label="Password" htmlFor="si-pw"><span className="input-wrap cs-si-pw"><Icon name="lock" size={17} /><input id="si-pw" className="input" type={show ? "text" : "password"} value={pw} onChange={edit(setPw)} autoComplete="current-password" /><button type="button" className="cs-si-eye" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow(!show)}><Icon name={show ? "eye-off" : "eye"} size={20} /></button></span></Field>
          {err && <div className="cs-si-error" role="alert"><Icon name="circle-alert" size={18} /><span>{err}</span></div>}
          <Button type="submit" variant="primary" size="lg" block icon="log-in" loading={busy}>Sign in</Button>
          <p className="t-footnote muted cs-si-hint">New to the console? The platform team gives you your first password. Nothing is sent by email.</p>
        </form>
        <div className="si-foot">
          <span className="t-footnote muted" style={{ maxWidth: "36ch" }}>Client teams sign in at their own workspace address, such as munchly.smartclearance.com.</span>
          <span className="si-foot-row"><button type="button" className="btn btn-link btn-sm" onClick={() => setFind(true)}>Find a workspace</button><a className="btn btn-link btn-sm" href={LINKS.site}>smartclearance.com</a></span>
          <span className="si-note">Prototype · every person and number is fictional</span>
        </div>
      </div></div>
      <S.FindWorkspace open={find} onClose={() => setFind(false)} onUse={() => { setFind(false); if (!window.open(LINKS.app, "_blank", "noopener")) location.href = LINKS.app; }} />
    </div>;
  }

  /* ---------- overview: batches on the move, what is waiting for a person, today's runs ---------- */
  function Overview({ go, me }) {
    const s = usePlatform(); const app = useApp(); const { toast } = useNotice();
    const live = s.clients.filter(c => c.status === "live");
    const on = live.reduce((t, c) => t + agentsOn(c), 0);
    const date = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    const attention = [];
    s.clients.forEach(c => {
      c.distributors.filter(d => d.permission !== "given").forEach(d => attention.push({ id: c.id + "-" + d.id, c, icon: "hand", tone: "amber", title: d.name, text: "one-time permission not given yet", act: "Ask again", run: () => { P.update(() => {}, { who: me.name, client: c.id, text: `Asked ${d.name} again for its one-time permission` }); toast({ text: `Reminder sent to ${d.name}`, tone: "ok" }); } }));
      if (c.status !== "live") { const admin = c.people.find(p => p.access === "Admin"); attention.push({ id: c.id + "-invite", c, icon: "user-plus", tone: "amber", title: c.name, text: `waiting for ${admin ? admin.name : "its admin"} to accept the invitation`, act: "Open", run: () => go("clients", c.id, "people") }); }
    });
    if (s.clients.some(c => c.id === "munchly")) attention.push({ id: "gupta-export", c: s.clients.find(c => c.id === "munchly"), icon: "file-spreadsheet", tone: "blue", title: "Gupta & Sons", text: "stock export arrived 2 h late today", act: "Open", run: () => go("clients", "munchly", "supply") });
    const tracks = s.tracks.filter(t => s.clients.some(c => c.id === t.client));
    const startFrom = r => {
      const plan = (P.PLANS.find(p => p.name === r.plan) || P.PLANS[0]).id; const domain = (r.email.split("@")[1] || "").toLowerCase();
      P.update(d => { d.draft = { name: r.company, industry: INDUSTRIES.includes(r.makes) ? r.makes : INDUSTRIES[0], emailDomain: domain, adminName: r.name, adminEmail: r.email, plan, request: r.id }; });
      go("new-client");
    };
    return <Screen title="Overview" sub={`${date} · ${live.length} client${live.length === 1 ? "" : "s"} live · ${on} agents on`}>
      <Columns sideWidth={380}
        main={<>
          <SectionTitle sub="Every client's batches, by the stop they have reached">Batches on the move</SectionTitle>
          <div className="stack" style={{ gap: 12 }}>{tracks.map(t => { const c = s.clients.find(x => x.id === t.client); const sku = D.SKUS[t.sku]; const dist = D.DISTRIBUTORS[t.distributor];
            return <Card key={t.batch} className="cs-track">
              <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                <WorkspaceMark ws={c} size={34} />
                <div className="stack tight grow" style={{ gap: 2, minWidth: 0 }}><span className="mono t-footnote subtle">{t.batch}</span><b className="t-subhead">{sku.name} · {dist.name}, {dist.city}</b>{t.note && <span className="t-caption subtle">{t.note}</span>}</div>
                <div className="cs-track-out">{t.money ? <><K.Money value={t.money} size="s" style={{ color: "var(--primary-text)" }} /><span className="t-caption subtle">recovered</span></> : <span className="t-footnote">{t.split}</span>}</div>
              </div>
              {app.bp === "phone" ? <TrackerCompact done={t.done} current={t.current} label={t.batch} /> : <Tracker stages={STAGES} done={t.done} current={t.current} label={t.batch + " stages"} />}
            </Card>; })}</div>
          <SectionTitle sub="What each client's agents did today">Agent runs today</SectionTitle>
          <List>{s.runs.slice(0, 9).map((r, i) => { const a = AGENT(r.agent); const c = s.clients.find(x => x.id === r.client); return <ListRow key={i} leading={<span className="mono t-footnote cs-time">{r.at}</span>} icon={a.icon} iconTone={a.gate ? "amber" : "soft"} title={`${a.name} · ${c ? c.name : r.client}`} sub={r.text} />; })}</List>
        </>}
        side={<>
          <SectionTitle sub="Waiting on a person, or on a file">Needs attention</SectionTitle>
          {attention.length ? <List>{attention.map(x => <ListRow key={x.id} leading={<span className={cx("cs-att", x.tone)} aria-hidden="true" />} title={x.title} sub={`${x.c.name} · ${x.text}`} value={<Button size="sm" variant="secondary" onClick={x.run}>{x.act}</Button>} />)}</List> : <Card><Empty icon="circle-check" title="Nothing is waiting" body="Every client's partners have given their permissions." /></Card>}
          <SectionTitle sub="From Book a demo on smartclearance.com">Demo requests</SectionTitle>
          {(s.requests || []).length ? <List>{s.requests.map(r => <ListRow key={r.id} icon="mail" iconTone="soft" title={r.company} sub={[r.name, r.email, r.makes, r.plan && `${r.plan} plan`, r.at].filter(Boolean).join(" · ")}
            value={r.status === "set up" ? <Badge size="sm" tone="green" icon="check">set up</Badge> : <Button size="sm" variant="secondary" onClick={() => startFrom(r)}>Set up</Button>} />)}</List>
            : <Card><Empty icon="mail" title="No requests yet" body="When someone books a demo on smartclearance.com, the request lands here, ready to become a client." /></Card>}
          {app.bp === "phone" && <List head="Platform">{NAV.filter(n => n.phoneHidden).map(n => <ListRow key={n.id} icon={n.icon} iconTone="soft" title={n.label} chevron onClick={() => go(n.id)} />)}</List>}
        </>} />
    </Screen>;
  }

  /* ---------- clients ---------- */
  function Clients({ go }) {
    const s = usePlatform(); const app = useApp(); const [q, setQ] = useState("");
    const rows = s.clients.filter(c => !q || (c.name + " " + c.domain + " " + c.city).toLowerCase().includes(q.toLowerCase()));
    return <Screen title="Clients" sub="Every manufacturer's workspace on Smart-Clearance" actions={app.bp !== "phone" && <Button variant="primary" size="sm" icon="plus" onClick={() => go("new-client")}>New client</Button>}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="row wrap" style={{ gap: 10 }}><div className="grow" style={{ minWidth: 220 }}><K.SearchField value={q} onChange={setQ} placeholder="Search clients, addresses, people" /></div>{app.bp === "phone" && <Button variant="primary" icon="plus" onClick={() => go("new-client")}>New client</Button>}</div>
        {app.bp === "phone" ? <div className="list">{rows.map(c => <button type="button" key={c.id} className="list-row" style={{ gridTemplateColumns: "40px minmax(0,1fr) auto", width: "100%", textAlign: "left" }} onClick={() => go("clients", c.id, "agents")}><WorkspaceMark ws={c} size={36} /><span className="stack tight" style={{ gap: 0, minWidth: 0 }}><b className="t-subhead">{c.name}</b><span className="t-caption subtle mono" style={{ overflowWrap: "anywhere" }}>{c.domain}</span></span>{statusBadge(c)}</button>)}</div>
          : <DataTable label="Clients" rows={rows} onRow={c => go("clients", c.id, "agents")} initialSort={["name", "asc"]} columns={[
            { key: "name", label: "Client", render: c => <span className="row tight"><WorkspaceMark ws={c} size={30} /><span className="stack tight" style={{ gap: 0 }}><b>{c.name}</b><span className="t-caption subtle">{c.city}</span></span></span> },
            { key: "domain", label: "Workspace", render: c => <span className="mono t-footnote">{c.domain}</span> },
            { key: "plan", label: "Plan", sortValue: c => planName(c.plan), render: c => planName(c.plan) },
            { key: "status", label: "Status", render: statusBadge },
            { key: "distributors", label: "Distributors", num: true, sortValue: c => c.distributors.length, render: c => c.distributors.length },
            { key: "skus", label: "SKUs", num: true, sortValue: c => c.skus.length, render: c => c.skus.length },
            { key: "agents", label: "Agents", sortValue: agentsOn, render: c => `${agentsOn(c)} of ${P.AGENTS.length - 1} on` },
            { key: "recovered", label: "Recovered", num: true, render: c => c.recovered ? fmt.inr(c.recovered) : "none yet" },
          ]} />}
        {s.clients.length < 3 && <Card className="cs-next">
          <Product name="sprout-box" size={app.bp === "phone" ? 96 : 132} />
          <div className="stack tight" style={{ gap: 8 }}>
            <b className="t-title3">{s.clients.length === 1 ? "Only Munchly is set up so far." : "Set up the next manufacturer."}</b>
            <p className="t-subhead muted" style={{ margin: 0, maxWidth: "52ch" }}>Each client starts from its supply-chain profile: route to market, who owns the stock, its expiry policy and the exits it allows. The agents and their limits follow from it.</p>
            <div><Button variant="primary" icon="plus" onClick={() => go("new-client")}>New client</Button></div>
          </div>
        </Card>}
      </div>
    </Screen>;
  }

  /* ---------- one client: header, tabs ---------- */
  const TABS = [{ id: "agents", label: "Agents" }, { id: "supply", label: "Supply chain" }, { id: "rules", label: "Channels & rules" }, { id: "people", label: "People" }, { id: "integrations", label: "Integrations" }, { id: "plan", label: "Plan" }, { id: "audit", label: "Audit" }];
  function ClientPage({ id, tab, go, me }) {
    const s = usePlatform(); const app = useApp(); const c = s.clients.find(x => x.id === id);
    const [menu, setMenu] = useState(false); const [pause, setPause] = useState(false); const { toast } = useNotice();
    if (!c) return <Screen title="No such client" back="Clients" onBack={() => go("clients")}><Card><Empty icon="search" title="This client isn't set up" body="It may have been removed when the prototype's data was reset." action={<Button onClick={() => go("clients")}>All clients</Button>} /></Card></Screen>;
    const t = TABS.some(x => x.id === tab) ? tab : "agents";
    const allOff = agentsOn(c) === 0;
    const setAll = v => { P.update(d => { const x = d.clients.find(y => y.id === c.id); P.AGENTS.filter(a => !a.gate).forEach(a => { x.agents[a.id].on = v; }); }, { who: me.name, client: c.id, text: v ? `Resumed every agent for ${c.name}` : `Paused every agent for ${c.name}` }); toast({ text: v ? `Agents resumed for ${c.name}` : `Every agent paused for ${c.name}`, tone: "ok" }); };
    const goLive = () => { P.update(d => { const x = d.clients.find(y => y.id === c.id); x.status = "live"; x.since = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }, { who: me.name, client: c.id, text: `Moved ${c.name} to Live on the ${planName(c.plan)} plan` }); toast({ text: `${c.name} is live`, tone: "ok" }); };
    const items = [
      c.id === "munchly" ? { label: "Open the workspace", icon: "external-link", onClick: () => { window.open(LINKS.app, "_blank", "noopener"); } } : null,
      c.status !== "live" ? { label: "Go live", icon: "circle-play", onClick: goLive } : null,
      allOff ? { label: "Resume every agent", icon: "play", onClick: () => setAll(true) } : { label: "Pause every agent", icon: "pause", danger: true, onClick: () => setPause(true) },
    ];
    return <Screen title={c.name} sub={`${c.domain} · ${planName(c.plan)}${c.since ? " since " + c.since : ""}`} back="Clients" onBack={() => go("clients")}
      actions={<span style={{ position: "relative" }}><IconButton icon="ellipsis" label={`Actions for ${c.name}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(m => !m)} /><Menu open={menu} onClose={() => setMenu(false)} items={items} width={230} label={`Actions for ${c.name}`} /></span>}>
      <div className="stack" style={{ gap: 18 }}>
        <div className="cs-head">
          <WorkspaceMark ws={c} size={app.bp === "phone" ? 48 : 60} />
          <div className="stack tight grow" style={{ gap: 6, minWidth: 0 }}>
            <span className="si-url" style={{ justifySelf: "start" }}><Icon name="lock" size={12} stroke={2.2} />{c.domain}</span>
            <span className="row tight wrap">{statusBadge(c)}<Badge size="sm">{planName(c.plan)}</Badge><Badge size="sm" icon="map-pin">{c.city}{c.region && c.region !== "India" ? " · " + c.region : ""}</Badge><Badge size="sm" icon="bot">{agentsOn(c)} of {P.AGENTS.length - 1} agents on</Badge></span>
          </div>
        </div>
        <div className="cs-tabs"><Tabs id="client-tabs" tabs={TABS} value={t} onChange={v => go("clients", c.id, v, true)} /></div>
        {t === "agents" && <AgentsTab c={c} me={me} />}
        {t === "supply" && <SupplyTab c={c} me={me} />}
        {t === "rules" && <RulesTab c={c} me={me} />}
        {t === "people" && <PeopleTab c={c} me={me} />}
        {t === "integrations" && <IntegrationsTab c={c} me={me} />}
        {t === "plan" && <PlanTab c={c} me={me} onLive={goLive} />}
        {t === "audit" && <AuditList filter={c.id} />}
      </div>
      <Alert open={pause} onClose={() => setPause(false)} title={`Pause every agent for ${c.name}?`} message="Nothing new is detected, priced, listed or sent until you resume. Plans already approved stay where they are." actions={[{ label: "Cancel" }, { label: "Pause", danger: true, strong: true, onClick: () => setAll(false) }]} />
    </Screen>;
  }

  /* ---------- agents: the pipeline and the selected agent's settings ---------- */
  function AgentsTab({ c, me }) {
    const app = useApp(); const { toast } = useNotice();
    const [sel, setSel] = useState(() => (app.bp === "desktop" ? "negotiator" : null));
    const setAutonomy = (a, v) => { const from = c.agents[a.id].autonomy; if (from === v) return; P.update(d => { d.clients.find(x => x.id === c.id).agents[a.id].autonomy = v; }, { who: me.name, client: c.id, text: `Set the ${a.name} agent to ${LEVEL(v).label} for ${c.name} (was ${LEVEL(from).label})` }); toast({ text: `${a.name}: ${LEVEL(v).label}, for ${c.name}`, tone: "ok" }); };
    const legend = <p className="t-footnote subtle cs-legend">{P.AUTONOMY.map(l => <span key={l.id}><span className={cx("cs-key", "auto-" + l.id)} aria-hidden="true" /><b>{l.label}</b> {l.text.charAt(0).toLowerCase() + l.text.slice(1)}</span>)}</p>;
    const pipe = <AgentPipeline c={c} sel={sel} onSelect={setSel} onAutonomy={setAutonomy} compact={app.bp === "phone"} />;
    const insp = sel ? <AgentInspector key={c.id + sel} c={c} id={sel} me={me} onAutonomy={setAutonomy} /> : null;
    if (app.bp === "desktop") return <div className="cs-agents"><div className="stack" style={{ gap: 12, minWidth: 0 }}>{legend}{pipe}</div><aside className="cs-inspector card" aria-label="Selected agent">{insp || <Empty icon="mouse-pointer-click" title="Choose an agent" body="Its limits, schedule and last run open here." />}</aside></div>;
    return <div className="stack" style={{ gap: 12 }}>{legend}{pipe}<Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? AGENT(sel).name : ""} side={app.bp === "phone" ? "bottom" : "side"} detent="large">{insp}</Sheet></div>;
  }
  function AgentPipeline({ c, sel, onSelect, onAutonomy, compact }) {
    return <ol className="cs-pipe" aria-label={`${c.name}'s agents, in the order they work`}>
      {P.AGENTS.map(a => { const cfg = c.agents[a.id]; const on = sel === a.id;
        return <li key={a.id} className={cx("cs-stop", a.gate && "is-gate", on && "on", !cfg.on && "off", "auto-" + cfg.autonomy)}>
          <span className="cs-node" aria-hidden="true">{a.gate && <Icon name="lock" size={11} stroke={2.6} />}</span>
          <div className="cs-card">
            <button type="button" className="cs-open" aria-pressed={on} onClick={() => onSelect(a.id)}>
              <span className={cx("icontile", a.gate ? "amber" : "soft")}><Icon name={a.icon} size={17} stroke={2} /></span>
              <span className="cs-text"><span className="cs-name"><b>{a.name}</b><span className="cs-stage">{P.STAGE_NAME[a.stage]}</span>{!cfg.on && !a.gate && <Badge size="sm">Off</Badge>}</span><span className="cs-sum">{a.gate ? P.summary("gate", cfg.settings, c) : a.job.charAt(0).toLowerCase() + a.job.slice(1) + " · " + P.summary(a.id, cfg.settings, c)}</span></span>
            </button>
            <div className="cs-ctl">{a.gate ? <Badge tone="amber" icon="lock">Always on</Badge> : compact ? <Badge size="sm" tone={cfg.autonomy === "act" ? "green" : undefined}>{LEVEL(cfg.autonomy).label}</Badge> : <Segmented className="sm" label={`${a.name}: autonomy`} options={P.AUTONOMY.map(x => ({ id: x.id, label: x.label }))} value={cfg.autonomy} onChange={v => onAutonomy(a, v)} />}</div>
          </div>
        </li>; })}
    </ol>;
  }
  function AgentInspector({ c, id, me, onAutonomy }) {
    const a = AGENT(id); const cfg = c.agents[id]; const { toast } = useNotice();
    const [draft, setDraft] = useState(cfg.settings);
    const key = JSON.stringify(cfg.settings);
    useEffect(() => setDraft(cfg.settings), [c.id, id, key]);
    const fields = P.FIELDS[id] || [];
    const dirty = JSON.stringify(draft) !== key;
    const save = () => {
      const changes = fields.filter(f => JSON.stringify(draft[f.key]) !== JSON.stringify(cfg.settings[f.key])).map(f => f.type === "approver" ? `approver ${nameOf(c, cfg.settings[f.key])} to ${nameOf(c, draft[f.key])}` : `${f.short || f.label.toLowerCase()} ${P.showValue(f, cfg.settings[f.key])} to ${P.showValue(f, draft[f.key])}`);
      P.update(d => { d.clients.find(x => x.id === c.id).agents[id].settings = draft; }, { who: me.name, client: c.id, text: `Changed the ${a.name} agent for ${c.name}: ${changes.join("; ")}` });
      toast({ text: `${a.name} saved for ${c.name}`, tone: "ok" });
    };
    const toggle = v => P.update(d => { d.clients.find(x => x.id === c.id).agents[id].on = v; }, { who: me.name, client: c.id, text: `${v ? "Switched on" : "Switched off"} the ${a.name} agent for ${c.name}` });
    const runNow = () => { const at = hhmm(); P.update(d => { d.runs.unshift({ at, agent: id, client: c.id, text: "ran on request; nothing new" }); d.clients.find(x => x.id === c.id).agents[id].last = `${at} today · ran on request; nothing new`; }, { who: me.name, client: c.id, text: `Ran the ${a.name} agent now for ${c.name}` }); toast({ text: `${a.name} ran for ${c.name}: nothing new`, tone: "ok" }); };
    return <div className="stack cs-insp" style={{ gap: 16 }}>
      <div className="row" style={{ gap: 12 }}><span className={cx("icontile", a.gate ? "amber" : "")} style={{ width: 42, height: 42, borderRadius: 12 }}><Icon name={a.icon} size={21} stroke={2} /></span><div className="stack tight" style={{ gap: 2 }}><b className="t-title3">{a.name}</b><span className="t-footnote subtle">{P.STAGE_NAME[a.stage]} · {a.gate ? "a person, always" : a.model + " on Vertex AI"}</span></div></div>
      <p className="t-subhead muted" style={{ margin: 0 }}>{a.job}.</p>
      {a.gate ? <div className="cs-gate-note"><Icon name="lock" size={16} stroke={2.2} /><span>Every plan waits for one person's approval, with the money on screen, for every client. It can't be switched off.</span></div> : <>
        <List><ListRow title="On" sub={cfg.on ? "Runs for this client" : "Skipped; the stops around it carry on"} value={<Switch checked={cfg.on} onChange={toggle} label={`${a.name} on for ${c.name}`} />} /></List>
        <div className="stack tight" style={{ gap: 8 }}><span className="t-footnote strong">Autonomy</span><Segmented label={`${a.name}: autonomy`} options={P.AUTONOMY.map(x => ({ id: x.id, label: x.label }))} value={cfg.autonomy} onChange={v => onAutonomy(a, v)} /><span className="t-footnote subtle">{LEVEL(cfg.autonomy).text}.</span></div>
      </>}
      {fields.length > 0 && <div className="stack" style={{ gap: 12 }}>{fields.map(f => <SettingField key={f.key} f={f} c={c} agent={a} value={draft[f.key]} onChange={v => setDraft(x => ({ ...x, [f.key]: v }))} />)}</div>}
      <List><ListRow title="Last run" sub={cfg.last || "not run yet"} /><ListRow title="Next run" sub={cfg.next || "not scheduled"} /></List>
      <div className="row tight wrap">{!a.gate && <Button variant="secondary" size="sm" icon="play" disabled={!cfg.on} onClick={runNow}>Run now</Button>}<span className="grow" /><Button variant="primary" size="sm" disabled={!dirty} onClick={save}>Save</Button></div>
    </div>;
  }
  const nameOf = (c, pid) => { const p = c.people.find(x => x.id === pid); return p ? p.name : "nobody"; };
  function SettingField({ f, c, agent, value, onChange }) {
    const id = `set-${agent.id}-${f.key}`;
    if (f.type === "switch") return <List><ListRow title={f.label} sub={f.locked || null} value={<Switch checked={!!value} disabled={!!f.locked} onChange={onChange} label={f.label} />} /></List>;
    if (f.type === "stepper") return <div className="row between" style={{ gap: 12 }}><span className="t-subhead">{f.label}</span><Stepper value={value} min={f.min} max={f.max} onChange={onChange} label={f.label.toLowerCase()} /></div>;
    if (f.type === "approver") { const people = c.people.filter(p => p.status === "active" && (p.access === "Approver" || p.access === "Admin" || p.access === "Member")); return <Field label={f.label} htmlFor={id} help="Plans go to this person's phone; nothing moves until they tap Approve."><Select id={id} value={value || ""} onChange={e => onChange(e.target.value)}>{!people.length && <option value="">No one yet</option>}{people.map(p => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}</Select></Field>; }
    if (f.type === "select") return <Field label={f.label} htmlFor={id}><Select id={id} value={value} onChange={e => onChange(e.target.value)}>{f.options.map(o => <option key={o}>{o}</option>)}</Select></Field>;
    if (f.type === "time") return <Field label={f.label} htmlFor={id}><Input id={id} type="time" value={value} onChange={e => onChange(e.target.value)} /></Field>;
    const num = <Input id={id} type="number" inputMode="decimal" min={f.min} max={f.max} step={f.step || 1} value={value} onChange={e => { const v = e.target.value === "" ? f.min : Number(e.target.value); onChange(Math.max(f.min, Math.min(f.max, v))); }} icon={f.type === "money" ? "indian-rupee" : undefined} />;
    return <Field label={f.label} htmlFor={id} help={f.unit && f.type !== "money" ? f.unit : undefined}>{num}</Field>;
  }

  /* ---------- supply chain ---------- */
  function SupplyTab({ c, me }) {
    const s = usePlatform(); const app = useApp(); const { toast } = useNotice(); const [edit, setEdit] = useState(false); const [menu, setMenu] = useState(null); const [skuId, setSkuId] = useState(null);
    const differ = c.skus.filter(x => x.gates && (x.gates.blinkitDays != null || x.gates.qcomPct != null)).length;
    const open = (s.batches || []).filter(b => b.client === c.id && b.done < 9);
    const kiranas = c.distributors.reduce((t, d) => t + d.kiranas, 0);
    const Step = ({ icon, t, sub }) => <div className="wschain-step"><span className="icontile"><Icon name={icon} size={17} stroke={2} /></span><b className="t-subhead">{t}</b><span className="t-caption subtle">{sub}</span></div>;
    const lister = c.agents.lister.settings;
    const rows = [
      ["route", "factory", "Route to market", P.optLabel("route", c.profile.route) + (c.distributors.length ? `, ${c.distributors.length} distributors` : "")],
      ["owner", "warehouse", "Who owns short-dated stock", P.optLabel("owner", c.profile.owner)],
      ["expiry", "undo-2", "Expiry policy", P.optLabel("expiry", c.profile.expiry)],
      ["gates", "shield", "Quick-commerce gates, by default", `New SKUs start at Blinkit ${c.gates.blinkitDays}+ days, Zepto and Instamart ${c.gates.qcomPct}% of life` + (differ ? ` · ${differ} of ${c.skus.length} SKUs differ` : "")],
      ["guard", "map", "Territory guard", lister.territoryGuard ? "Lots hidden from buyers inside the client's territories" : "Off: lots visible everywhere"],
      ["window", "calendar-clock", "Return window", `${c.returnWindowDays} days`],
    ];
    const ask = d => { P.update(() => {}, { who: me.name, client: c.id, text: `Asked ${d.name} again for its one-time permission` }); toast({ text: `Reminder sent to ${d.name}`, tone: "ok" }); };
    return <div className="stack" style={{ gap: 18 }}>
      <Card className="wschain-card">
        <div className="wschain" role="img" aria-label={`${c.name} sells through ${c.distributors.length || "its"} distributors to ${kiranas || "the"} kiranas and the quick-commerce warehouses.`}>
          <Step icon="factory" t={c.name} sub={`${c.city} · ${c.profile.route === "distributors" ? "sells only to distributors" : P.optLabel("route", c.profile.route).toLowerCase()}`} />
          <Icon name="arrow-right" size={16} className="subtle wschain-arrow" />
          <Step icon="warehouse" t={c.distributors.length ? `${c.distributors.length} distributors` : "Distributors"} sub={c.profile.owner === "distributor" ? "own the stock they buy" : "hold the manufacturer's stock"} />
          <Icon name="arrow-right" size={16} className="subtle wschain-arrow" />
          <div className="wschain-split"><Step icon="store" t={kiranas ? `${kiranas} kiranas` : "Kiranas"} sub="on the salesmen's beats" /><Step icon="shopping-bag" t="Quick-commerce warehouses" sub="Blinkit, Zepto, Instamart; turn short-dated stock away" /></div>
        </div>
      </Card>
      <Columns sideWidth={app.bp === "desktop" ? 560 : 360}
        main={<>
          <SectionTitle right={<Button size="sm" icon="sliders-horizontal" onClick={() => setEdit(true)}>Edit</Button>} sub="Set at onboarding; the exits and agents follow from it">Profile</SectionTitle>
          <List>{rows.map(([k, icon, t, v]) => <ListRow key={k} icon={icon} iconTone="soft" title={t} sub={<b className="strong" style={{ color: "var(--fg-2)" }}>{v}</b>} />)}</List>
        </>}
        side={<>
          <SectionTitle sub="Each gives the agents a one-time permission to act in his name">Distributors</SectionTitle>
          {c.distributors.length ? <List>{c.distributors.map(d => <ListRow key={d.id} icon="warehouse" iconTone="soft" title={d.name} sub={`${d.city} · ${d.kiranas} kiranas · staff sale up to ${d.staffCap || c.rules.staffCap}`}
            value={<span className="row tight">{d.permission === "given" ? <Badge size="sm" tone="green">given</Badge> : <Badge size="sm" tone="amber">not yet</Badge>}{d.permission !== "given" && <span style={{ position: "relative" }}><IconButton icon="ellipsis" label={`Actions for ${d.name}`} aria-haspopup="menu" aria-expanded={menu === d.id} onClick={() => setMenu(menu === d.id ? null : d.id)} /><Menu open={menu === d.id} onClose={() => setMenu(null)} width={240} label={`Actions for ${d.name}`} items={[{ label: "Ask for the permission again", icon: "send", onClick: () => ask(d) }]} /></span>}</span>} />)}</List>
            : <Card><Empty icon="warehouse" title="No distributors yet" body="They arrive with the first stock export, and each is invited to give the agents its one-time permission." /></Card>}
        </>} />
      <SectionTitle sub={c.skus.length ? "From the latest stock export · each SKU's quick-commerce gates, and its batches' overrides" : null}>SKUs</SectionTitle>
      {!c.skus.length ? <Card><Empty icon="package" title="No SKUs yet" body="SKUs arrive with the first stock export." /></Card>
        : app.bp === "phone" ? <List>{c.skus.slice().sort((a, b) => a.name.localeCompare(b.name)).map(x => { const own = hasOwn(x), n = open.filter(b => b.sku === x.id && b.override).length;
          return <ListRow key={x.id} title={x.name} chevron onClick={() => setSkuId(x.id)} sub={<span className="stack tight" style={{ gap: 4 }}><span><span className="mono">{x.code}</span> · {fmt.inr(x.mrp)} · {x.lifeDays} days</span><span className={cx("cs-gline", own && "own")}>Blinkit {gateOf(c, x, "blinkitDays")}+ days · Zepto and Instamart {gateOf(c, x, "qcomPct")}%{own ? "" : " · the default"}{n ? <> · <span className="cs-gsrc ovr">{n} batch override{n === 1 ? "" : "s"}</span></> : null}</span></span>} />; })}</List>
        : <DataTable label={`${c.name} SKUs`} rows={c.skus} initialSort={["name", "asc"]} onRow={x => setSkuId(x.id)} columns={[
        { key: "code", label: "Code", render: x => <span className="mono t-footnote">{x.code}</span> },
        { key: "name", label: "Product", render: x => <button type="button" className="cs-cellbtn" onClick={() => setSkuId(x.id)}>{x.name}</button> },
        { key: "brand", label: "Brand" },
        { key: "mrp", label: "MRP", num: true, render: x => fmt.inr(x.mrp) },
        { key: "gst", label: "GST", num: true, render: x => fmt.pct(x.gst) },
        { key: "lifeDays", label: "Shelf life", num: true, render: x => `${x.lifeDays} days` },
        { key: "blinkit", label: "Blinkit takes", num: true, sortValue: x => gateOf(c, x, "blinkitDays"), render: x => <GateValue value={`${gateOf(c, x, "blinkitDays")}+ days`} own={x.gates && x.gates.blinkitDays != null} /> },
        { key: "qcom", label: "Zepto, Instamart take", num: true, sortValue: x => gateOf(c, x, "qcomPct"), render: x => <GateValue value={`${gateOf(c, x, "qcomPct")}% of life`} own={x.gates && x.gates.qcomPct != null} /> },
        { key: "open", label: "Open batches", num: true, sortValue: x => open.filter(b => b.sku === x.id).length, render: x => { const mine = open.filter(b => b.sku === x.id), n = mine.filter(b => b.override).length; return <span className="stack tight" style={{ gap: 2, justifyItems: "end" }}><span>{mine.length}</span>{n ? <span className="cs-gsrc ovr">{n} override{n === 1 ? "" : "s"}</span> : null}</span>; } },
      ]} />}
      <ProfileSheet open={edit} onClose={() => setEdit(false)} c={c} me={me} />
      <SkuSheet open={!!skuId} onClose={() => setSkuId(null)} c={c} sku={c.skus.find(x => x.id === skuId)} batches={open.filter(b => b.sku === skuId)} me={me} />
    </div>;
  }
  /* ---------- an SKU's quick-commerce gates, and each of its batches' override (SC-47) ---------- */
  const poss = n => n + (/s$/i.test(n) ? "'" : "'s");
  const hasOwn = x => !!x.gates && (x.gates.blinkitDays != null || x.gates.qcomPct != null);
  const gateOf = (c, x, k) => (x.gates && x.gates[k] != null ? x.gates[k] : c.gates[k]);
  const GATE_APP = { blinkit: "Blinkit", zepto: "Zepto", instamart: "Instamart" };
  // custom values read in the primary ink, defaults in the secondary ink, each with its word under it, never colour alone
  function GateValue({ value, own }) { return <span className={cx("cs-gval", own ? "own" : "def")}><b>{value}</b><span className="d">{own ? "this SKU" : "default"}</span></span>; }
  function GateChecks({ checks, full }) {
    return <span className="cs-gchips">{checks.map(g => { const unit = g.app === "blinkit" ? " days" : "%"; return <span key={g.app} className={cx("gate", g.pass ? "pass" : "fail")} title={`${GATE_APP[g.app]}: needs ${g.need}${unit}, has ${g.has}${unit}`}><Icon name={g.pass ? "check" : "x"} size={13} stroke={2.6} />{GATE_APP[g.app]}{full && <span className="cs-gneed">{g.has}{unit}/{g.need}{unit}</span>}</span>; })}</span>;
  }
  const num = v => (v === "" || v == null ? null : Number(v));
  function SkuSheet({ open, onClose, c, sku, batches, me }) {
    const app = useApp(); const { toast } = useNotice();
    const [f, setF] = useState(null); const [err, setErr] = useState(null); const [ovr, setOvr] = useState(null);
    useEffect(() => { if (open && sku) { setF({ own: hasOwn(sku), bl: String(gateOf(c, sku, "blinkitDays")), qc: String(gateOf(c, sku, "qcomPct")) }); setErr(null); setOvr(null); } }, [open, sku && sku.id]);
    if (!sku || !f) return null;
    const preview = { blinkitDays: f.own ? num(f.bl) : c.gates.blinkitDays, qcomPct: f.own ? num(f.qc) : c.gates.qcomPct };
    const save = () => {
      const g = f.own ? { blinkitDays: num(f.bl), qcomPct: num(f.qc) } : null; const e = P.skuGatesError(g); if (e) return setErr(e);
      const was = hasOwn(sku) ? sku.gates : null;
      if (JSON.stringify(was) !== JSON.stringify(g)) P.update(d => { d.clients.find(x => x.id === c.id).skus.find(x => x.id === sku.id).gates = g || {}; }, { who: me.name, client: c.id, text: P.skuGatesLine(c, sku, g) });
      toast({ text: `${sku.name}'s gates saved`, tone: "ok" }); onClose();
    };
    const saveOverride = b => {
      const o = { blinkitDays: num(ovr.bl), qcomPct: num(ovr.qc), reason: ovr.reason }; const e = P.overrideError(o); if (e) return setOvr({ ...ovr, err: e });
      const clean = { reason: o.reason.trim() }; if (o.blinkitDays != null) clean.blinkitDays = o.blinkitDays; if (o.qcomPct != null) clean.qcomPct = o.qcomPct;
      P.update(d => { d.batches.find(x => x.client === c.id && x.ref === b.ref).override = Object.assign(clean, { by: me.name, at: "Today, " + hhmm() }); }, { who: me.name, client: c.id, text: P.overrideLine(b.ref, clean) });
      toast({ text: `${b.ref}'s override saved`, tone: "ok" }); setOvr(null);
    };
    const removeOverride = b => { P.update(d => { delete d.batches.find(x => x.client === c.id && x.ref === b.ref).override; }, { who: me.name, client: c.id, text: P.clearOverrideLine(b.ref) }); toast({ text: `${b.ref} is back on its SKU's gates`, tone: "ok" }); };
    const dist = id => (c.distributors.find(x => x.id === id) || { name: id, city: "" });
    return <Sheet open={open} onClose={onClose} title={sku.name} side={app.bp === "phone" ? "bottom" : "side"} detent="large" footer={<Button variant="primary" size="lg" block onClick={save}>Save gates</Button>}>
      <div className="stack" style={{ gap: 18 }}>
        <div className="cs-gfacts"><span className="mono">{sku.code}</span><span>{sku.brand}</span><span><b>{fmt.inr(sku.mrp)}</b> MRP</span><span><b>{sku.lifeDays}</b>-day shelf life</span></div>
        <fieldset className="cs-gset"><legend>Quick-commerce gates for this SKU</legend>
          <Segmented label="Whose gates" value={f.own ? "own" : "default"} onChange={v => { setErr(null); setF({ ...f, own: v === "own" }); }} options={[{ id: "default", label: `${poss(c.name)} default` }, { id: "own", label: "Its own" }]} />
          <div className="cs-gtwo">
            <Field label="Blinkit takes at least" htmlFor="sk-bl" help={f.own ? `Default: ${c.gates.blinkitDays} days` : `${poss(c.name)} default`}><span className="cs-gin"><Input id="sk-bl" type="number" inputMode="numeric" min={P.GATE_BOUNDS.sku.blinkitDays[0]} max={P.GATE_BOUNDS.sku.blinkitDays[1]} disabled={!f.own} value={f.own ? f.bl : c.gates.blinkitDays} onChange={e => { setErr(null); setF({ ...f, bl: e.target.value }); }} /><span className="u">days</span></span></Field>
            <Field label="Zepto, Instamart take at least" htmlFor="sk-qc" help={f.own ? `Default: ${c.gates.qcomPct}%` : `${poss(c.name)} default`}><span className="cs-gin"><Input id="sk-qc" type="number" inputMode="numeric" min={P.GATE_BOUNDS.sku.qcomPct[0]} max={P.GATE_BOUNDS.sku.qcomPct[1]} disabled={!f.own} value={f.own ? f.qc : c.gates.qcomPct} onChange={e => { setErr(null); setF({ ...f, qc: e.target.value }); }} /><span className="u">% of life</span></span></Field>
          </div>
          {err ? <div className="cs-si-error" role="alert"><Icon name="circle-alert" size={18} /><span>{err}</span></div>
            : preview.blinkitDays != null && preview.qcomPct != null && <p className="cs-gmean"><Icon name="info" size={16} /><span>On its {sku.lifeDays}-day life, a batch needs <b>{preview.blinkitDays} days</b> left for Blinkit and <b>{Math.ceil((preview.qcomPct * sku.lifeDays) / 100)} days</b> left for Zepto and Instamart.</span></p>}
        </fieldset>
        <SectionTitle sub={batches.length ? `${batches.length} open · an override holds for that batch until it closes` : null}>Its batches</SectionTitle>
        {batches.length ? batches.map(b => { const g = P.batchGates(c, b), d = dist(b.distributor), editing = ovr && ovr.ref === b.ref;
          return <div key={b.ref} className="cs-gbatch">
            <div className="cs-gtop"><span><b className="mono">{b.ref}</b> <span className="t-footnote subtle">{d.name}{d.city ? `, ${d.city}` : ""}</span></span><span className="t-footnote"><b className="tnum">{g.daysLeft}</b> days left of {g.lifeDays}</span></div>
            <GateChecks checks={g.checks} full />
            {editing ? <div className="cs-govr">
              <div className="cs-gtwo">
                <Field label="Blinkit, for this batch" htmlFor={"ob-bl-" + b.ref} help={`Days left; empty keeps the SKU's ${gateOf(c, sku, "blinkitDays")}`}><span className="cs-gin"><Input id={"ob-bl-" + b.ref} type="number" inputMode="numeric" placeholder={String(gateOf(c, sku, "blinkitDays"))} value={ovr.bl} onChange={e => setOvr({ ...ovr, bl: e.target.value, err: null })} /><span className="u">days</span></span></Field>
                <Field label="Zepto, Instamart, for this batch" htmlFor={"ob-qc-" + b.ref} help={`% of life; empty keeps the SKU's ${gateOf(c, sku, "qcomPct")}%`}><span className="cs-gin"><Input id={"ob-qc-" + b.ref} type="number" inputMode="numeric" placeholder={String(gateOf(c, sku, "qcomPct"))} value={ovr.qc} onChange={e => setOvr({ ...ovr, qc: e.target.value, err: null })} /><span className="u">% of life</span></span></Field>
              </div>
              <Field label="Why" htmlFor={"ob-why-" + b.ref} help="The agents and the audit log show it with the override"><textarea id={"ob-why-" + b.ref} className="input textarea" rows={2} maxLength={200} value={ovr.reason} onChange={e => setOvr({ ...ovr, reason: e.target.value, err: null })} /></Field>
              {ovr.err && <div className="cs-si-error" role="alert"><Icon name="circle-alert" size={18} /><span>{ovr.err}</span></div>}
              <div className="row tight"><Button size="sm" variant="primary" onClick={() => saveOverride(b)}>Save the override</Button><Button size="sm" variant="ghost" onClick={() => setOvr(null)}>Cancel</Button></div>
            </div>
            : b.override ? <div className="cs-govr">
              <div className="cs-govr-h"><span>Overridden for this batch: {P.gateText(b.override)}</span><span className="row tight"><Button size="sm" variant="secondary" onClick={() => setOvr({ ref: b.ref, bl: b.override.blinkitDays != null ? String(b.override.blinkitDays) : "", qc: b.override.qcomPct != null ? String(b.override.qcomPct) : "", reason: b.override.reason })}>Change</Button><Button size="sm" variant="ghost" onClick={() => removeOverride(b)}>Remove</Button></span></div>
              <p>{b.override.reason}</p><span className="cs-gwho">{b.override.by}, {b.override.at}</span>
            </div>
            : <Button size="sm" icon="sliders-horizontal" onClick={() => setOvr({ ref: b.ref, bl: "", qc: "", reason: "" })} style={{ justifySelf: "start" }}>Override for this batch</Button>}
          </div>; })
          : <Card><Empty icon="package" title="No open batches" body="Its batches show here once the Watcher flags them, with their gates." /></Card>}
        <p className="t-footnote subtle" style={{ margin: 0 }}>Closed batches keep the gates they were judged by. Every change writes its line in the audit log.</p>
      </div>
    </Sheet>;
  }
  function ProfileSheet({ open, onClose, c, me }) {
    const app = useApp(); const { toast } = useNotice();
    const [f, setF] = useState(null);
    useEffect(() => { if (open) setF({ ...c.profile, blinkitDays: c.gates.blinkitDays, qcomPct: c.gates.qcomPct, returnWindowDays: c.returnWindowDays }); }, [open]);
    if (!f) return null;
    const save = () => {
      P.update(d => { const x = d.clients.find(y => y.id === c.id); const was = x.exits; x.profile = { route: f.route, owner: f.owner, expiry: f.expiry }; const ex = P.exitsFor(x.profile); Object.keys(ex).forEach(k => { if (!ex[k].locked && was[k]) ex[k].on = was[k].on && ex[k].on; }); x.exits = ex; x.gates = { blinkitDays: f.blinkitDays, qcomPct: f.qcomPct }; x.returnWindowDays = f.returnWindowDays; x.agents.watcher.settings.blinkitDays = f.blinkitDays; x.agents.watcher.settings.qcomPct = f.qcomPct; x.agents.impact.settings.returnWindowDays = f.returnWindowDays; },
        { who: me.name, client: c.id, text: `Changed ${c.name}'s supply-chain profile: ${P.optLabel("route", f.route).toLowerCase()}, ${P.optLabel("owner", f.owner).toLowerCase()} owns the stock, ${P.optLabel("expiry", f.expiry).toLowerCase()}` });
      toast({ text: `${c.name}'s profile saved`, tone: "ok" }); onClose();
    };
    return <Sheet open={open} onClose={onClose} title="Supply-chain profile" side={app.bp === "phone" ? "bottom" : "side"} detent="large" footer={<Button variant="primary" size="lg" block onClick={save}>Save profile</Button>}>
      <div className="stack" style={{ gap: 18 }}>
        {Object.keys(P.PROFILE).map(q => <Choice key={q} name={"pf-" + q} label={P.PROFILE[q].label} options={P.PROFILE[q].options} value={f[q]} onChange={v => setF({ ...f, [q]: v })} />)}
        <Field label="New SKUs: Blinkit takes stock with at least" htmlFor="pf-bl" help="days of shelf life left · SKUs with gates of their own keep them"><Input id="pf-bl" type="number" min={30} max={180} value={f.blinkitDays} onChange={e => setF({ ...f, blinkitDays: Number(e.target.value) || 30 })} /></Field>
        <Field label="New SKUs: Zepto and Instamart take at least" htmlFor="pf-qc" help="% of shelf life left"><Input id="pf-qc" type="number" min={30} max={90} step={5} value={f.qcomPct} onChange={e => setF({ ...f, qcomPct: Number(e.target.value) || 30 })} /></Field>
        <div className="row between" style={{ gap: 12 }}><span className="t-subhead">Return window, days</span><Stepper value={f.returnWindowDays} min={7} max={45} onChange={v => setF({ ...f, returnWindowDays: v })} label="return window days" /></div>
        <ProfileSummary profile={f} />
      </div>
    </Sheet>;
  }
  function ProfileSummary({ profile }) {
    return <Card className="cs-summary"><b className="t-subhead">What this profile sets up</b><ul>{P.profileLines(profile).map((l, i) => <li key={i}><Icon name={l.icon} size={16} stroke={2} /><span>{l.text}</span></li>)}</ul><span className="t-footnote subtle">Every plan still waits for one person's approval.</span></Card>;
  }
  // a question answered by picking one card: native radios, so arrows move between them
  function Choice({ name, label, options, value, onChange }) {
    return <fieldset className="cs-choice"><legend>{label}</legend><div className="cs-opts">{options.map(o => <label key={o.id} className={cx("cs-opt", value === o.id && "on")}><input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} /><span>{o.label}</span>{value === o.id && <Icon name="check" size={16} stroke={2.4} />}</label>)}</div></fieldset>;
  }

  /* ---------- channels and rules ---------- */
  function RulesTab({ c, me }) {
    const { toast } = useNotice(); const [r, setR] = useState(c.rules); const [ex, setEx] = useState(c.exits);
    useEffect(() => { setR(c.rules); setEx(c.exits); }, [c.id, JSON.stringify(c.rules), JSON.stringify(c.exits)]);
    const dirty = JSON.stringify(r) !== JSON.stringify(c.rules) || JSON.stringify(ex) !== JSON.stringify(c.exits);
    const save = () => { const changed = []; P.EXITS.forEach(e => { if (ex[e.id].on !== c.exits[e.id].on) changed.push(`${e.name} ${ex[e.id].on ? "on" : "off"}`); }); Object.keys(r).forEach(k => { if (r[k] !== c.rules[k]) changed.push(`${RULE_LABEL[k] || k} ${typeof r[k] === "boolean" ? (r[k] ? "on" : "off") : r[k]}`); });
      P.update(d => { const x = d.clients.find(y => y.id === c.id); x.rules = r; x.exits = ex; }, { who: me.name, client: c.id, text: `Changed ${c.name}'s channels and rules: ${changed.join("; ")}` }); toast({ text: "Channels and rules saved", tone: "ok" }); };
    const set = (k, v) => setR({ ...r, [k]: v });
    return <div className="stack" style={{ gap: 18 }}>
      <Columns sideWidth={460}
        main={<>
          <SectionTitle sub="The exits the agents may price and use; the bin is always the baseline">Exits</SectionTitle>
          <List>{P.EXITS.map(e => <ListRow key={e.id} icon={e.icon} iconTone="soft" title={e.name} sub={ex[e.id].locked || (e.id === "staff" ? `Up to ${r.staffCap} packs a godown` : null)} value={<Switch checked={!!ex[e.id].on} disabled={!!ex[e.id].locked} onChange={v => setEx({ ...ex, [e.id]: { ...ex[e.id], on: v } })} label={`${e.name} for ${c.name}`} />} />)}
            <ListRow icon="trash-2" iconTone="red" title="The bin" sub="Priced every time, so every plan shows what it saves" value={<Badge size="sm">baseline</Badge>} /></List>
        </>}
        side={<>
          <SectionTitle sub="The limits every agent works inside">Guardrails</SectionTitle>
          <List>
            <ListRow title="Staff sale cap" sub="packs per godown" value={<Stepper value={r.staffCap} min={0} max={500} step={10} onChange={v => set("staffCap", v)} label="staff sale cap" />} />
            <ListRow title="Offer window" sub="hours a kirana offer stays open" value={<Stepper value={r.offerWindowHours} min={12} max={96} step={12} onChange={v => set("offerWindowHours", v)} label="offer window hours" />} />
            <ListRow title="Kirana offers in Hindi first" sub="with an English toggle" value={<Switch checked={r.hindiOffers} onChange={v => set("hindiOffers", v)} label="Kirana offers in Hindi first" />} />
            <ListRow title="Label photo before any plan" sub="Vision reads the date off the shelf, not the spreadsheet" value={<Switch checked={r.requirePhoto} onChange={v => set("requirePhoto", v)} label="Label photo before any plan" />} />
          </List>
        </>} />
      <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}><Button disabled={!dirty} onClick={() => { setR(c.rules); setEx(c.exits); }}>Discard</Button><Button variant="primary" disabled={!dirty} onClick={save}>Save changes</Button></div>
    </div>;
  }
  const RULE_LABEL = { staffCap: "staff sale cap", offerWindowHours: "offer window hours", hindiOffers: "Hindi offers", requirePhoto: "label photo first" };

  /* ---------- people ---------- */
  const ACCESS = ["Approver", "Admin", "Member", "Partner"];
  function PeopleTab({ c, me }) {
    const app = useApp(); const { toast } = useNotice(); const [q, setQ] = useState(""); const [menu, setMenu] = useState(null); const [inv, setInv] = useState(false); const [accessFor, setAccessFor] = useState(null);
    const rows = c.people.filter(p => !q || (p.name + " " + p.org + " " + p.role).toLowerCase().includes(q.toLowerCase()));
    const setStatus = (p, status) => { P.update(d => { const x = d.clients.find(y => y.id === c.id).people.find(y => y.id === p.id); x.status = status; }, { who: me.name, client: c.id, text: `${status === "deactivated" ? "Deactivated" : "Reactivated"} ${p.name}` }); toast({ text: `${p.name} ${status === "deactivated" ? "deactivated" : "reactivated"}`, tone: "ok" }); };
    const setAccess = (p, a) => { P.update(d => { const x = d.clients.find(y => y.id === c.id).people.find(y => y.id === p.id); x.access = a; }, { who: me.name, client: c.id, text: `Gave ${p.name} ${a} access` }); toast({ text: `${p.name}: ${a}`, tone: "ok" }); setAccessFor(null); };
    const tone = st => st === "active" ? "green" : undefined;
    const menuFor = p => [{ label: "Change access", icon: "user-cog", onClick: () => setAccessFor(p) }, p.status === "invited" ? { label: "Resend invitation", icon: "send", onClick: () => toast({ text: `Invitation resent to ${p.name}`, tone: "ok" }) } : null, p.status === "deactivated" ? { label: "Reactivate", icon: "user-check", onClick: () => setStatus(p, "active") } : { label: "Deactivate", icon: "user-x", danger: true, onClick: () => setStatus(p, "deactivated") }];
    const form = <InviteForm c={c} me={me} onDone={() => setInv(false)} />;
    return <div className="stack" style={{ gap: 16 }}>
      <div className="row wrap" style={{ gap: 10 }}><div className="grow" style={{ minWidth: 220 }}><K.SearchField value={q} onChange={setQ} placeholder="Search people" /></div><span className="row tight wrap"><Badge tone="green" dot>{c.people.filter(p => p.status === "active").length} active</Badge><Badge dot>{c.people.filter(p => p.status === "invited").length} invited</Badge></span>{app.bp !== "desktop" && <Button variant="primary" icon="user-plus" onClick={() => setInv(true)}>Invite</Button>}</div>
      <div className={app.bp === "desktop" ? "cs-people" : ""}>
        {app.bp === "phone" ? <div className="list">{rows.map(p => <div key={p.id} className="list-row" style={{ gridTemplateColumns: "36px minmax(0,1fr) auto" }}><Avatar person={p} size="sm" /><span className="stack tight" style={{ gap: 0, minWidth: 0 }}><b className="t-subhead">{p.name}</b><span className="t-caption subtle">{p.role} · {p.provider}</span></span><span className="row tight"><Badge size="sm" tone={tone(p.status)} dot>{p.status}</Badge><span style={{ position: "relative" }}><IconButton icon="ellipsis" label={`Actions for ${p.name}`} aria-haspopup="menu" aria-expanded={menu === p.id} onClick={() => setMenu(menu === p.id ? null : p.id)} /><Menu open={menu === p.id} onClose={() => setMenu(null)} width={210} label={`Actions for ${p.name}`} items={menuFor(p)} /></span></span></div>)}</div>
          : <DataTable label={`People in ${c.name}'s workspace`} rows={rows} initialSort={["name", "asc"]} columns={[
            { key: "name", label: "Person", render: p => <span className="row tight"><Avatar person={p} size="sm" /><span className="stack tight" style={{ gap: 0 }}><b>{p.name}</b><span className="t-caption subtle">{p.org}</span></span></span> },
            { key: "role", label: "Role" },
            { key: "provider", label: "Signs in with" },
            { key: "access", label: "Access", render: p => p.access === "Approver" ? <Badge size="sm" tone="amber">Approver</Badge> : p.access },
            { key: "status", label: "Status", render: p => <Badge size="sm" tone={tone(p.status)} dot>{p.status}</Badge> },
            { key: "act", label: "", sortable: false, render: p => <span style={{ position: "relative", display: "inline-block" }}><IconButton icon="ellipsis" label={`Actions for ${p.name}`} aria-haspopup="menu" aria-expanded={menu === p.id} onClick={() => setMenu(menu === p.id ? null : p.id)} /><Menu open={menu === p.id} onClose={() => setMenu(null)} width={210} label={`Actions for ${p.name}`} items={menuFor(p)} /></span> },
          ]} />}
        {app.bp === "desktop" && <Card className="cs-invite"><b className="t-headline">Invite a person</b>{form}</Card>}
      </div>
      {app.bp !== "desktop" && <Sheet open={inv} onClose={() => setInv(false)} title="Invite a person" side={app.bp === "phone" ? "bottom" : "center"} detent="large">{form}</Sheet>}
      <Sheet open={!!accessFor} onClose={() => setAccessFor(null)} title={accessFor ? `Access for ${accessFor.name}` : ""} side={app.bp === "phone" ? "bottom" : "center"} detent="medium">
        {accessFor && <div className="list">{ACCESS.map(a => <button type="button" key={a} className="list-row" style={{ gridTemplateColumns: "minmax(0,1fr) auto", width: "100%", textAlign: "left" }} onClick={() => setAccess(accessFor, a)}><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{a}</b><span className="t-caption subtle">{{ Approver: "Approves plans with one tap", Admin: "Runs the workspace's people and guardrails", Member: "Sees batches, money and reports", Partner: "A distributor, kirana or food bank" }[a]}</span></span>{accessFor.access === a && <Icon name="check" size={18} />}</button>)}</div>}
      </Sheet>
    </div>;
  }
  function InviteForm({ c, me, onDone }) {
    const { toast } = useNotice(); const [f, setF] = useState({ name: "", contact: "", access: "Member" }); const [err, setErr] = useState("");
    const send = () => {
      const contact = f.contact.trim(); const phone = /^[+\d\s]{10,}$/.test(contact); const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
      if (!f.name.trim()) { setErr("Enter a name."); return; }
      if (!phone && !email) { setErr("Enter a work email address or a mobile number."); return; }
      if (email && f.access !== "Partner" && !contact.toLowerCase().endsWith("@" + c.emailDomain)) { setErr(`${c.name} staff need a ${c.emailDomain} address. Partners can use any address or a phone number.`); return; }
      const id = "p-" + Date.now().toString(36);
      P.update(d => { d.clients.find(y => y.id === c.id).people.push({ id, name: f.name.trim(), org: f.access === "Partner" ? f.name.trim() : c.name, role: f.access === "Partner" ? "Partner" : "Staff", kind: f.access, access: f.access, provider: phone ? "Phone and code" : f.access === "Partner" ? "Google, invited" : "Google", status: "invited", img: null, email: email ? contact : "", phone: phone ? contact : "" }); }, { who: me.name, client: c.id, text: `Invited ${f.name.trim()} as ${f.access}` });
      toast({ text: `Invitation sent to ${f.name.trim()}`, tone: "ok" }); setF({ name: "", contact: "", access: "Member" }); setErr(""); onDone && onDone();
    };
    return <form className="stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); send(); }} noValidate>
      <Field label="Name" htmlFor="inv-name"><Input id="inv-name" value={f.name} onChange={e => { setF({ ...f, name: e.target.value }); setErr(""); }} placeholder="Name or organisation" /></Field>
      <Field label="Work email or mobile number" htmlFor="inv-contact" error={err || null}><Input id="inv-contact" value={f.contact} onChange={e => { setF({ ...f, contact: e.target.value }); setErr(""); }} autoComplete="off" spellCheck={false} placeholder={`name@${c.emailDomain}`} /></Field>
      <Field label="Access" htmlFor="inv-access"><Select id="inv-access" value={f.access} onChange={e => setF({ ...f, access: e.target.value })}>{ACCESS.map(a => <option key={a}>{a}</option>)}</Select></Field>
      <p className="t-footnote subtle" style={{ margin: 0 }}>{c.name} staff need a {c.emailDomain} address; partners sign in with a code or by invitation.</p>
      <Button type="submit" variant="primary" icon="send">Send invitation</Button>
    </form>;
  }

  /* ---------- integrations, plan, audit ---------- */
  const STATUS = { ok: ["green", "Connected"], mock: [undefined, "Mocked"], soon: [undefined, "Soon"], waiting: ["amber", "Waiting for the first file"] };
  function IntegrationsTab({ c, me }) {
    const { toast } = useNotice();
    const connect = () => { P.update(d => { d.clients.find(y => y.id === c.id).integrations.push({ id: "dms", name: "Distributor stock exports", kind: "Inventory", status: "waiting", note: "Upload link sent to the distributors" }); }, { who: me.name, client: c.id, text: `Asked ${c.name}'s distributors for their first stock export` }); toast({ text: "Upload link sent", tone: "ok" }); };
    return <div className="stack" style={{ gap: 14 }}>
      {c.integrations.length ? <List>{c.integrations.map(i => { const [tone, label] = STATUS[i.status] || [undefined, i.status]; const con = P.CONNECTORS.find(x => x.id === i.id); return <ListRow key={i.id} icon={con ? con.icon : "plug"} iconTone="soft" title={i.name} sub={`${i.kind} · ${i.note}`} value={<Badge size="sm" tone={tone} dot={!!tone}>{label}</Badge>} />; })}</List>
        : <Card><Empty icon="plug" title="Nothing connected yet" body="Start with the distributors' stock exports; everything else follows the first file." action={<Button variant="primary" icon="file-spreadsheet" onClick={connect}>Ask for the first export</Button>} /></Card>}
      <p className="t-footnote subtle" style={{ margin: 0 }}>Mocked connectors stand in for partner APIs in this prototype.</p>
    </div>;
  }
  function PlanTab({ c, me, onLive }) {
    const app = useApp(); const { toast } = useNotice();
    const setPlan = id => { if (id === c.plan) return; P.update(d => { d.clients.find(y => y.id === c.id).plan = id; }, { who: me.name, client: c.id, text: `Moved ${c.name} from ${planName(c.plan)} to ${planName(id)}` }); toast({ text: `${c.name} on ${planName(id)}`, tone: "ok" }); };
    return <Columns sideWidth={420}
      main={<>
        <SectionTitle sub="Prices on request in this prototype">Plan</SectionTitle>
        <Segmented label="Plan" options={P.PLANS.map(p => ({ id: p.id, label: p.name }))} value={c.plan} onChange={setPlan} className="lg" />
        <Card><ul className="cs-scope">{(P.PLANS.find(p => p.id === c.plan) || P.PLANS[0]).scope.map(x => <li key={x}><Icon name="check" size={16} stroke={2.4} />{x}</li>)}</ul></Card>
        {c.status !== "live" && <Card className="row wrap" style={{ gap: 12 }}><div className="stack tight grow" style={{ gap: 2 }}><b className="t-subhead">Not live yet</b><span className="t-footnote subtle">Go live once the admin has accepted and the first stock export has arrived.</span></div><Button variant="primary" icon="circle-play" onClick={onLive}>Go live</Button></Card>}
      </>}
      side={<>
        <SectionTitle>Usage</SectionTitle>
        <List>
          <ListRow title="Distributors" value={c.distributors.length} />
          <ListRow title="SKUs" value={c.skus.length} />
          <ListRow title="Batches tracked" value={c.batches} />
          <ListRow title="Recovered so far" value={c.recovered ? fmt.inr(c.recovered) : "none yet"} />
          <ListRow title="People" value={c.people.filter(p => p.status === "active").length + " active"} />
        </List>
      </>} />;
  }
  function AuditList({ filter }) {
    const s = usePlatform(); const app = useApp();
    const rows = s.audit.filter(a => !filter || a.client === filter);
    if (!rows.length) return <Card><Empty icon="scroll-text" title="Nothing logged yet" /></Card>;
    return <List>{rows.map(a => { const c = s.clients.find(x => x.id === a.client); return <ListRow key={a.id} leading={!filter && c ? <WorkspaceMark ws={c} size={28} /> : null} title={a.text} sub={`${a.who} · ${a.at}${!filter && c ? " · " + c.name : ""}`} />; })}</List>;
  }

  /* ---------- a new client, step by step ---------- */
  const COLOURS = [["#2563eb", "Blue"], ["#7c3aed", "Violet"], ["#db2777", "Pink"], ["#0891b2", "Teal"], ["#b45309", "Brown"]];
  const STEPS = ["Company", "Workspace", "Supply chain", "Exits", "Agents", "People", "Review"];
  const INDUSTRIES = ["Snacks and drinks", "Personal care", "Dairy", "Staples", "Home care"];
  function NewClient({ go, me }) {
    const s = usePlatform(); const app = useApp(); const { toast } = useNotice(); const top = useRef(null);
    const [step, setStep] = useState(0);
    // a demo request from smartclearance.com can start the setup: its company, contact and plan come along
    const [f, setF] = useState(() => Object.assign({ name: "", city: "", industry: INDUSTRIES[0], colour: COLOURS[0][0], slug: "", slugTouched: false, emailDomain: "", signGoogle: true, signPhone: true, route: "distributors", owner: "distributor", expiry: "full-credit", exitOff: {}, preset: "standard", adminName: "", adminEmail: "", plan: "pilot", request: null }, s.draft || {}));
    useEffect(() => { if (s.draft) P.update(d => { delete d.draft; }); }, []);
    const set = patch => setF(x => ({ ...x, ...patch }));
    const slug = f.slugTouched ? f.slug : P.slug(f.name);
    const profile = { route: f.route, owner: f.owner, expiry: f.expiry };
    const exits = useMemo(() => { const ex = P.exitsFor(profile); Object.keys(f.exitOff).forEach(k => { if (ex[k] && !ex[k].locked && f.exitOff[k]) ex[k].on = false; }); return ex; }, [f.route, f.owner, f.expiry, JSON.stringify(f.exitOff)]);
    const taken = s.clients.some(c => c.id === slug);
    const domainOk = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(f.emailDomain.trim().toLowerCase());
    const adminOk = f.adminName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.adminEmail.trim()) && f.adminEmail.trim().toLowerCase().endsWith("@" + f.emailDomain.trim().toLowerCase());
    const errs = [
      !f.name.trim() ? "Enter the company's name." : !f.city.trim() ? "Enter its home city." : null,
      !/^[a-z0-9-]{2,24}$/.test(slug) ? "Use 2 to 24 lowercase letters, digits or hyphens." : taken ? `${slug}.smartclearance.com is taken.` : !domainOk ? "Enter the domain its staff email from, such as kesari.in." : !(f.signGoogle || f.signPhone) ? "Keep at least one way to sign in." : null,
      null,
      Object.values(exits).some(x => x.on) ? null : "Keep at least one exit on.",
      null,
      !adminOk ? `Enter the admin's name and a ${f.emailDomain ? "@" + f.emailDomain : "company"} address.` : null,
      null,
    ];
    const [tried, setTried] = useState(false);
    const next = () => { if (errs[step]) { setTried(true); return; } setTried(false); setStep(x => Math.min(STEPS.length - 1, x + 1)); };
    const back = () => { setTried(false); setStep(x => Math.max(0, x - 1)); };
    useLayoutEffect(() => { const el = top.current; const sc = el && el.closest(".scroll"); if (sc) sc.scrollTop = 0; }, [step]);
    const create = () => {
      const client = P.buildClient({ name: f.name.trim(), city: f.city.trim(), industry: f.industry, colour: f.colour, emailDomain: f.emailDomain.trim().toLowerCase(), signGoogle: f.signGoogle, signPhone: f.signPhone, route: f.route, owner: f.owner, expiry: f.expiry, preset: f.preset, adminName: f.adminName.trim(), adminEmail: f.adminEmail.trim().toLowerCase(), plan: f.plan });
      client.id = slug; client.domain = slug + ".smartclearance.com"; client.exits = exits;
      P.update(d => { d.clients.push(client); if (f.request) d.requests = (d.requests || []).map(r => r.id === f.request ? Object.assign({}, r, { status: "set up", client: slug }) : r); }, { who: me.name, client: slug, text: `Set up ${client.name} from its supply-chain profile: ${P.optLabel("route", f.route).toLowerCase()}, ${P.optLabel("owner", f.owner).toLowerCase()} owns the stock, ${P.optLabel("expiry", f.expiry).toLowerCase()}; invited ${client.people[0].name} as admin` });
      toast({ text: `${client.name}'s workspace is set up`, tone: "ok" }); go("clients", slug, "agents", true);
    };
    const preview = { id: slug || "new", name: f.name || "?", mark: { from: f.colour, to: f.colour, ink: "#ffffff" } };
    const body = [
      <div className="stack cs-form" style={{ gap: 14 }} key="company">
        <Field label="Company name" htmlFor="nc-name"><Input id="nc-name" value={f.name} onChange={e => set({ name: e.target.value })} placeholder="Kesari Foods" /></Field>
        <Field label="Home city" htmlFor="nc-city"><Input id="nc-city" value={f.city} onChange={e => set({ city: e.target.value })} placeholder="Indore" /></Field>
        <Field label="What it makes" htmlFor="nc-ind"><Select id="nc-ind" value={f.industry} onChange={e => set({ industry: e.target.value })}>{INDUSTRIES.map(x => <option key={x}>{x}</option>)}</Select></Field>
        <fieldset className="cs-choice"><legend>Workspace mark</legend><div className="row wrap" style={{ gap: 14 }}><WorkspaceMark ws={preview} size={52} /><div className="cs-swatches">{COLOURS.map(([hex, name]) => <label key={hex} className={cx("cs-swatch", f.colour === hex && "on")} style={{ "--sw": hex }}><input type="radio" name="nc-colour" checked={f.colour === hex} onChange={() => set({ colour: hex })} /><span className="sr-only">{name}</span></label>)}</div></div><span className="t-footnote subtle">The client's colour stays inside its mark; the workspace keeps Smart-Clearance's theming.</span></fieldset>
      </div>,
      <div className="stack cs-form" style={{ gap: 14 }} key="workspace">
        <Field label="Workspace address" htmlFor="nc-slug" help="Where its people sign in"><span className="cs-slug"><Input id="nc-slug" value={slug} onChange={e => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""), slugTouched: true })} spellCheck={false} /><span className="mono t-footnote subtle">.smartclearance.com</span></span></Field>
        <Field label="Staff email domain" htmlFor="nc-domain" help="Only addresses at this domain can sign in as staff"><Input id="nc-domain" value={f.emailDomain} onChange={e => set({ emailDomain: e.target.value })} spellCheck={false} autoCapitalize="none" placeholder="kesari.in" /></Field>
        <fieldset className="cs-choice"><legend>How people sign in</legend><div className="stack tight" style={{ gap: 8 }}><Check checked={f.signGoogle} onChange={v => set({ signGoogle: v })}>Google Workspace, for staff</Check><Check checked={f.signPhone} onChange={v => set({ signPhone: v })}>Mobile number and a one-time code, for invited distributors and kiranas</Check></div></fieldset>
      </div>,
      <div className="cs-two" key="supply">
        <div className="stack" style={{ gap: 18 }}>{Object.keys(P.PROFILE).map(q => <Choice key={q} name={"nc-" + q} label={P.PROFILE[q].label} options={P.PROFILE[q].options} value={f[q]} onChange={v => set({ [q]: v, exitOff: {} })} />)}</div>
        <ProfileSummary profile={profile} />
      </div>,
      <div className="stack cs-form" style={{ gap: 14 }} key="exits">
        <List foot="The bin is always priced as the baseline, so every plan shows what it saves.">{P.EXITS.map(e => <ListRow key={e.id} icon={e.icon} iconTone="soft" title={e.name} sub={exits[e.id].locked || null} value={<Switch checked={!!exits[e.id].on} disabled={!!exits[e.id].locked} onChange={v => set({ exitOff: { ...f.exitOff, [e.id]: !v } })} label={e.name} />} />)}</List>
      </div>,
      <div className="cs-two" key="agents">
        <Choice name="nc-preset" label="How far the agents go at first" options={P.PRESETS.map(p => ({ id: p.id, label: p.label }))} value={f.preset} onChange={v => set({ preset: v })} />
        <Card className="cs-summary"><b className="t-subhead">{P.PRESETS.find(p => p.id === f.preset).text}</b><ul>{P.AGENTS.map(a => { const auto = P.agentDefaults(f.preset, {})[a.id].autonomy; return <li key={a.id}><Icon name={a.icon} size={16} stroke={2} /><span>{a.name}</span><span className="grow" />{a.gate ? <Badge size="sm" tone="amber" icon="lock">Always on</Badge> : <Badge size="sm" tone={auto === "act" ? "green" : undefined}>{LEVEL(auto).label}</Badge>}</li>; })}</ul><span className="t-footnote subtle">Each agent can be changed later, one at a time.</span></Card>
      </div>,
      <div className="stack cs-form" style={{ gap: 14 }} key="people">
        <Field label="Workspace admin's name" htmlFor="nc-admin"><Input id="nc-admin" value={f.adminName} onChange={e => set({ adminName: e.target.value })} placeholder="Full name" /></Field>
        <Field label="Admin's work email" htmlFor="nc-admin-email" help={`Must be an @${f.emailDomain || "company"} address; the invitation goes there`}><Input id="nc-admin-email" type="email" value={f.adminEmail} onChange={e => set({ adminEmail: e.target.value })} spellCheck={false} autoCapitalize="none" placeholder={`name@${f.emailDomain || "company.in"}`} /></Field>
        <p className="t-footnote subtle" style={{ margin: 0 }}>The admin invites the rest of the team and the distributors, and approves plans until they name an approver.</p>
      </div>,
      <div className="cs-two" key="review">
        <List head="Summary">
          <ListRow leading={<WorkspaceMark ws={preview} size={32} />} title={f.name} sub={`${f.city} · ${f.industry}`} />
          <ListRow title="Address" value={<span className="mono t-footnote">{slug}.smartclearance.com</span>} />
          <ListRow title="Staff sign in with" sub={[f.signGoogle && `Google (${f.emailDomain})`, f.signPhone && "a one-time code, by invitation"].filter(Boolean).join("; ")} />
          <ListRow title="Supply chain" sub={`${P.optLabel("route", f.route)} · ${P.optLabel("owner", f.owner)} owns the stock · ${P.optLabel("expiry", f.expiry)}`} />
          <ListRow title="Exits" sub={P.EXITS.filter(e => exits[e.id].on).map(e => e.name).join(", ")} />
          <ListRow title="Agents" sub={P.PRESETS.find(p => p.id === f.preset).label + "; the approval is always on"} />
          <ListRow title="Admin" sub={`${f.adminName} · ${f.adminEmail}`} />
        </List>
        <div className="stack" style={{ gap: 12 }}><SectionTitle sub="Prices on request">Plan</SectionTitle><Segmented label="Plan" options={P.PLANS.map(p => ({ id: p.id, label: p.name }))} value={f.plan} onChange={v => set({ plan: v })} /><Card><ul className="cs-scope">{P.PLANS.find(p => p.id === f.plan).scope.map(x => <li key={x}><Icon name="check" size={16} stroke={2.4} />{x}</li>)}</ul></Card></div>
      </div>,
    ];
    return <Screen title="New client" sub={`Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`} back="Clients" onBack={() => go("clients")}>
      <div ref={top} className="cs-wizard">
        {app.bp !== "phone" ? <ol className="cs-steps" aria-label="Steps">{STEPS.map((t, i) => <li key={t} className={cx(i < step && "done", i === step && "now")} aria-current={i === step ? "step" : undefined}><span className="cs-sn" aria-hidden="true">{i < step ? <Icon name="check" size={13} stroke={2.8} /> : i + 1}</span>{i < step ? <button type="button" className="btn-link" onClick={() => setStep(i)}>{t}</button> : <span>{t}</span>}</li>)}</ol>
          : <K.Progress value={(step + 1) / STEPS.length} label={`Step ${step + 1} of ${STEPS.length}`} />}
        <section className="cs-step" aria-labelledby="cs-step-h">
          <h2 id="cs-step-h" className="t-title3">{STEPS[step]}</h2>
          {body[step]}
          {tried && errs[step] && <p className="cs-err" role="alert">{errs[step]}</p>}
          <div className="row" style={{ gap: 10, justifyContent: "flex-end", paddingTop: 6 }}>{step > 0 && <Button onClick={back}>Back</Button>}{step < STEPS.length - 1 ? <Button variant="primary" iconRight="arrow-right" onClick={next}>Continue</Button> : <Button variant="primary" icon="check" onClick={create}>Create workspace</Button>}</div>
        </section>
      </div>
    </Screen>;
  }

  /* ---------- platform pages ---------- */
  function AgentsPage({ go }) {
    const s = usePlatform();
    return <Screen title="Agents" sub="The agents every workspace runs, in the order they work. Each client sets how far they go.">
      <div className="cs-catalog">{P.AGENTS.map(a => <Card key={a.id} className={cx("cs-agentcard", a.gate && "is-gate")}>
        <div className="row" style={{ gap: 12 }}><span className={cx("icontile", a.gate ? "amber" : "")}><Icon name={a.icon} size={17} stroke={2} /></span><div className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{a.name}</b><span className="t-caption subtle">{P.STAGE_NAME[a.stage]} · {a.gate ? "a person, always" : a.model}</span></div></div>
        <p className="t-footnote muted" style={{ margin: 0 }}>{a.job}.</p>
        <div className="row tight wrap">{s.clients.map(c => { const cfg = c.agents[a.id]; return <button type="button" key={c.id} className="chip" onClick={() => go("clients", c.id, "agents")}><WorkspaceMark ws={c} size={18} />{c.name}: {a.gate ? "on" : !cfg.on ? "off" : LEVEL(cfg.autonomy).label}</button>; })}</div>
      </Card>)}</div>
    </Screen>;
  }
  function ConnectorsPage({ go }) {
    const s = usePlatform(); const app = useApp(); const kinds = [...new Set(P.CONNECTORS.map(x => x.kind))]; const [open, setOpen] = useState(null);
    const users = id => s.clients.filter(c => c.integrations.some(i => i.id === id));
    const x = open && P.CONNECTORS.find(y => y.id === open); const xu = x ? users(x.id) : [];
    return <Screen title="Connectors" sub="What a workspace can connect to; mocked ones stand in for partner APIs">
      <div className="cs-connectors">{kinds.map(k => <List key={k} head={k}>{P.CONNECTORS.filter(y => y.kind === k).map(y => { const [tone, label] = STATUS[y.status]; const u = users(y.id); return <ListRow key={y.id} icon={y.icon} iconTone="soft" title={y.name} sub={`${y.note}${u.length ? " · used by " + u.map(c => c.name).join(", ") : ""}`} value={<Badge size="sm" tone={tone} dot={!!tone}>{label}</Badge>} chevron onClick={() => setOpen(y.id)} />; })}</List>)}</div>
      <Sheet open={!!x} onClose={() => setOpen(null)} title={x ? x.name : ""} side={app.bp === "phone" ? "bottom" : "center"} detent="medium">
        {x && <div className="stack">
          <div className="row" style={{ gap: 12 }}><span className="icontile soft" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name={x.icon} size={20} /></span><div className="stack tight" style={{ gap: 2 }}><b className="t-headline">{x.name}</b><span className="t-footnote subtle">{x.kind} · {STATUS[x.status][1]}</span></div></div>
          <p className="t-subhead muted" style={{ margin: 0 }}>{x.note}.{x.status === "mock" ? " In this prototype it is mocked: the agents call it, and it answers as the partner would." : x.status === "soon" ? " Not available yet." : ""}</p>
          <List head="Used by">{xu.length ? xu.map(c => <ListRow key={c.id} leading={<WorkspaceMark ws={c} size={28} />} title={c.name} sub={c.domain} chevron onClick={() => { setOpen(null); go("clients", c.id, "integrations"); }} />) : <ListRow title="No client yet" />}</List>
        </div>}
      </Sheet>
    </Screen>;
  }
  function PlansPage({ go }) {
    const s = usePlatform();
    return <Screen title="Plans" sub="Plans are scoped by reach, not seats; prices on request in this prototype">
      <div className="cs-plans">{P.PLANS.map(p => { const on = s.clients.filter(c => c.plan === p.id); return <Card key={p.id} className="stack" style={{ gap: 12 }}>
        <b className="t-title3">{p.name}</b><ul className="cs-scope">{p.scope.map(x => <li key={x}><Icon name="check" size={16} stroke={2.4} />{x}</li>)}</ul>
        <span className="t-footnote subtle">Prices on request</span>
        <div className="row tight wrap">{on.length ? on.map(c => <button type="button" key={c.id} className="chip" onClick={() => go("clients", c.id, "plan")}><WorkspaceMark ws={c} size={18} />{c.name}</button>) : <span className="t-footnote subtle">No clients on this plan yet</span>}</div>
      </Card>; })}</div>
    </Screen>;
  }
  function StaffPage({ me }) {
    const s = usePlatform(); const app = useApp(); const { toast } = useNotice(); const [inv, setInv] = useState(false); const [f, setF] = useState({ name: "", email: "", role: "Support" }); const [err, setErr] = useState("");
    const send = () => { if (!f.name.trim()) { setErr("Enter a name."); return; } if (!/^[^\s@]+@smartclearance\.com$/i.test(f.email.trim())) { setErr("Staff use a smartclearance.com address."); return; }
      P.update(d => { d.staff.push({ id: "st-" + Date.now().toString(36), name: f.name.trim(), short: f.name.trim().split(" ")[0], role: f.role, team: f.role === "Support" ? "Customer success" : "Platform", email: f.email.trim().toLowerCase(), passkey: "not set up yet", status: "invited" }); }, { who: me.name, client: null, text: `Invited ${f.name.trim()} to the console as ${f.role}` });
      toast({ text: `Invitation sent to ${f.name.trim()}`, tone: "ok" }); setInv(false); setF({ name: "", email: "", role: "Support" }); setErr(""); };
    return <Screen title="Staff" sub="Smart-Clearance people who can sign in to the console" actions={<Button variant="primary" size="sm" icon="user-plus" onClick={() => setInv(true)}>Invite</Button>}>
      <DataTable label="Console staff" rows={s.staff} columns={[
        { key: "name", label: "Person", render: x => <span className="row tight"><Avatar person={x} size="sm" /><span className="stack tight" style={{ gap: 0 }}><b>{x.name}</b><span className="t-caption subtle">{x.email}</span></span></span> },
        { key: "role", label: "Role" }, { key: "team", label: "Team" }, { key: "passkey", label: "Passkey" },
        { key: "status", label: "Status", render: x => <Badge size="sm" tone={x.status === "active" ? "green" : undefined} dot>{x.status}</Badge> },
      ]} />
      <Sheet open={inv} onClose={() => setInv(false)} title="Invite a colleague" side={app.bp === "phone" ? "bottom" : "center"} detent="large" footer={<Button variant="primary" size="lg" block icon="send" onClick={send}>Send invitation</Button>}>
        <div className="stack" style={{ gap: 12 }}>
          <Field label="Name" htmlFor="st-name"><Input id="st-name" value={f.name} onChange={e => { setF({ ...f, name: e.target.value }); setErr(""); }} /></Field>
          <Field label="smartclearance.com email" htmlFor="st-email" error={err || null}><Input id="st-email" type="email" value={f.email} onChange={e => { setF({ ...f, email: e.target.value }); setErr(""); }} spellCheck={false} autoCapitalize="none" placeholder="name@smartclearance.com" /></Field>
          <Field label="Role" htmlFor="st-role"><Select id="st-role" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>{["Super admin", "Platform engineer", "Support"].map(x => <option key={x}>{x}</option>)}</Select></Field>
          <p className="t-footnote subtle" style={{ margin: 0 }}>They sign in with Google and set up a passkey on first sign-in.</p>
        </div>
      </Sheet>
    </Screen>;
  }
  function AuditPage() {
    const s = usePlatform(); const [f, setF] = useState(null);
    return <Screen title="Audit log" sub="Every change staff and client admins make, newest first">
      <div className="stack" style={{ gap: 14 }}>
        <div className="row tight wrap"><button type="button" className="chip" aria-pressed={!f} onClick={() => setF(null)}>Everything</button>{s.clients.map(c => <button type="button" key={c.id} className="chip" aria-pressed={f === c.id} onClick={() => setF(c.id)}><WorkspaceMark ws={c} size={18} />{c.name}</button>)}</div>
        <AuditList filter={f} />
      </div>
    </Screen>;
  }

  /* ---------- the signed-in console ---------- */
  function AccountSheet({ open, onClose, me, onOut }) {
    const app = useApp(); const { toast } = useNotice(); const [reset, setReset] = useState(false);
    return <Sheet open={open} onClose={onClose} title="Account" side={app.bp === "phone" ? "bottom" : "center"} detent="medium">
      <div className="stack">
        <div className="row" style={{ gap: 14 }}><Avatar person={me} size="lg" /><div className="stack tight" style={{ gap: 2 }}><b className="t-headline">{me.name}</b><span className="t-footnote subtle">{me.role} · {me.team}</span></div></div>
        <List><ListRow title="Email" value={<span className="t-footnote">{me.email}</span>} /><ListRow title="Passkey" value={<span className="t-footnote">{me.passkey}</span>} /></List>
        <div className="row tight wrap"><Button icon="log-out" onClick={onOut}>Sign out</Button><Button variant="ghost" icon="rotate-ccw" onClick={() => setReset(true)}>Reset prototype data</Button></div>
        <Alert open={reset} onClose={() => setReset(false)} title="Reset the prototype's data?" message="Clients you set up and every change go back to the seed: Munchly Foods as the only client." actions={[{ label: "Cancel" }, { label: "Reset", danger: true, strong: true, onClick: () => { P.reset(); toast({ text: "Back to the seed data", tone: "ok" }); onClose(); } }]} />
      </div>
    </Sheet>;
  }
  const TITLES = { overview: "Overview", clients: "Clients", "new-client": "New client", agents: "Agents", connectors: "Connectors", plans: "Plans", staff: "Staff", audit: "Audit log" };
  function App() {
    const [session, setSession] = useState(readSession); const [route, go] = useHashRoute(); const s = usePlatform();
    const [acct, setAcct] = useState(false); const reduce = useReducedMotion(); const top = useRef(null);
    const me = session && s.staff.find(x => x.id === session.uid && x.status === "active");
    const client = route.name === "clients" && route.id ? s.clients.find(c => c.id === route.id) : null;
    useEffect(() => { document.title = me ? `${client ? client.name : TITLES[route.name] || "Overview"} · Smart-Clearance Console` : "Sign in · Smart-Clearance Console"; }, [me && me.id, route.name, client && client.name]);
    useLayoutEffect(() => { const el = top.current; const sc = el && el.closest(".scroll"); if (sc) sc.scrollTop = 0; }, [route.name, route.id]);
    if (!me) return <SignIn onIn={uid => { const v = { uid, at: Date.now() }; writeSession(v); setSession(v); go(route.name && route.name !== "overview" ? route.name : "overview", route.id, route.tab, true); }} />;
    const name = TITLES[route.name] ? route.name : "overview";
    const screen = name === "clients" && route.id ? <ClientPage id={route.id} tab={route.tab} go={go} me={me} />
      : name === "clients" ? <Clients go={go} /> : name === "new-client" ? <NewClient go={go} me={me} /> : name === "agents" ? <AgentsPage go={go} />
      : name === "connectors" ? <ConnectorsPage go={go} /> : name === "plans" ? <PlansPage go={go} /> : name === "staff" ? <StaffPage me={me} /> : name === "audit" ? <AuditPage /> : <Overview go={go} me={me} />;
    const nav = NAV.map(n => (n.id === "clients" ? { ...n, count: s.clients.length } : n));
    return <>
      <Shell nav={nav} current={name === "new-client" ? "clients" : name} onNav={id => go(id)} user={{ name: me.name, role: me.role, org: "Smart-Clearance" }} onUser={() => setAcct(true)}
        brand={<><Mark size={32} /><span className="cs-brand"><Wordmark size={17} /><span className="cs-brand-sub">Console</span></span></>}>
        {/* each route fades in; there is no exit animation, so a route change can never wait on the old screen */}
        <motion.div key={name + (route.id || "")} ref={top} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>{screen}</motion.div>
      </Shell>
      <AccountSheet open={acct} onClose={() => setAcct(false)} me={me} onOut={() => { setAcct(false); writeSession(null); setSession(null); history.replaceState(null, "", location.pathname + location.search); }} />
    </>;
  }

  function Root() { return <ThemeProvider><AppRoot className="app-root" style={{ position: "fixed", inset: 0 }}><NoticeHost><App /></NoticeHost></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();

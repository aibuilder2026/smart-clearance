// Option C · The batch file. Evidence first: a cleared batch is a file, its photos on its cover, its steps in a log:
//   Batches (the operator's): In view or Cleared; cleared batches as files, each with its label photo on the cover
//   (or the pack where none was kept), how many photos it holds, its outcome and what it recovered;
//   a batch's page: the evidence across the top, every photo sent for it with what was made of it, and four tabs:
//   Money · Papers · Impact · Audit log. The audit log is a table: time, who, as what, and what they did, filtered to
//   people or agents, exported as CSV;
//   the distributor: Label photo becomes Photos, every photo he sent Munchly, batch by batch.
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, R = window.SCR;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, DataTable, BatchRow, GateChips, StatusBadge, Segmented, Empty, useApp } = K;
  const { useStore, useRoute, Screen } = S;
  const fmt = M.fmt; const L = () => window.SC3_LEDGER, P = () => window.SC3_LEDGER.partners;
  const Orig = { Report: S.Report, CameraScreen: S.CameraScreen };

  // the distributor's navigation: Label photo becomes Photos, every photo he sent
  const nav = S.NAV.distributor.find(n => n.id === "photo"); if (nav) { nav.label = "Photos"; nav.short = "Photos"; nav.icon = "image"; }

  /* ---------- the operator's Batches: in view, or the files of the cleared ---------- */
  function Batches({ me }) {
    const s = useStore(); const app = useApp(); const { go } = useRoute(); const hm = S.heroModel(s); const live = S.useLive();
    const [view, setView] = useState("cleared");
    const views = D.BATCHES.map(b => { const v = D.batchView(b); if (b.hero) v.phase = hm.view.phase; if (b.second) v.phase = "executing"; return v; });
    const past = R.pastBatches();
    const openRow = v => go(S.partAt(S.journeyItems(s, live).find(i => i.ref === v.id)), { ref: v.id });
    return <Screen me={me} title="Batches" sub="Every lot the Watcher sees, and the file of every batch that has cleared"
      actions={<Segmented label="Which batches" value={view} onChange={setView} options={[{ id: "view", label: `In view · ${views.length}` }, { id: "cleared", label: `Cleared · ${past.length}` }]} />}>
      {view === "view" ? (app.bp === "phone" ? <div className="list">{views.map(v => <BatchRow key={v.id} view={v} compact onOpen={() => openRow(v)} />)}</div> :
        <DataTable label="Batches in view" rows={views.map(v => ({ ...v, name: v.skuObj.name }))} onRow={openRow} initialSort={["daysLeft", "asc"]} columns={[
          { key: "name", label: "Product", render: v => <span className="row tight"><Product name={v.skuObj.img} size={36} /><span className="stack tight" style={{ gap: 0 }}><b>{v.skuObj.name}</b><span className="mono subtle t-caption">{v.id}</span></span></span> },
          { key: "dist", label: "Distributor", sortValue: v => v.dist.name, render: v => <span>{v.dist.name}<div className="t-caption subtle">{v.dist.city}</div></span> },
          { key: "daysLeft", label: "Days left", num: true }, { key: "units", label: "Units", num: true, render: v => fmt.num(v.units) },
          { key: "gates", label: "Quick-commerce gates", sortable: false, render: v => <GateChips gates={v.assess.gates} size="sm" /> },
          { key: "status", label: "Status", sortValue: v => v.phase || v.assess.status, render: v => <StatusBadge status={v.phase || v.assess.status} /> },
        ]} />)
      : <div className="rk-grid">{past.map(c => { const ph = R.photosOf(c), cover = ph.find(p => p.src), row = L().rowOf(c);
          return <button key={c.ref} type="button" className="rk-card" onClick={() => go("report", { ref: c.ref, tab: "audit" })} aria-label={`${c.sku.name}, ${c.ref}: open its file`}>
            <span className="rk-cover">{cover ? <img className="photo" src={cover.src} alt="" loading="lazy" /> : <Product name={c.sku.img} size={96} alt="" />}<span className="cam-tag"><Icon name="camera" size={13} />{ph.length} {ph.length === 1 ? "photo" : "photos"}</span></span>
            <span className="rk-body"><span className="row between" style={{ gap: 8 }}><b className="t-subhead">{c.sku.name}</b><S.OutcomeBadge o={c.outcome} size="sm" /></span>
              <span className="t-footnote muted">{c.ref} · {c.dist.name}</span>
              <span className="t-footnote">Cleared {R.day(c.cleared)} · <b className="tnum">{fmt.inr(row.figures.net)}</b> recovered</span></span>
          </button>; })}</div>}
    </Screen>;
  }

  /* ---------- a batch's file: the evidence, then the tabs ---------- */
  function Evidence({ c }) {
    const [open, setOpen] = useState(null); const photos = R.photosOf(c), yes = R.approvalsOf(c);
    return <div className="stack" style={{ gap: 10 }}>
      <div className="rk-strip">{photos.map(p => <div key={p.id} className="rk-photo"><R.Shot p={p} onOpen={() => setOpen(p)} /><span className="t-footnote"><b>{p.title}</b> · {R.when(p.at)}</span></div>)}
        {yes.map(a => <div key={a.k} className="rk-photo"><div className="rk-yes"><R.Actor who={a.who} size={32} /><div><b className="t-subhead">{a.title}</b><div className="t-footnote muted">{a.sub}</div></div></div><span className="t-footnote"><b>{a.who.short}'s yes</b> · {R.when(a.at)}</span></div>)}</div>
      <R.PhotoSheet p={open} onClose={() => setOpen(null)} />
    </div>;
  }
  function AuditLog({ c }) {
    const [who, setWho] = useState("all"); const trail = R.recordOf(c);
    const rows = trail.filter(m => who === "all" || (who === "people" ? m.who.kind !== "agent" : m.who.kind === "agent"));
    const role = m => m.who.kind === "agent" ? "agent" : m.who.kind === "people" ? "kiranas" : m.who.org === D.CLIENT.name ? `${D.CLIENT.short} · supply chain` : m.who.org;
    return <Card className="stack snug">
      <div className="card-head"><span className="card-title">Audit log</span><Button variant="secondary" size="sm" icon="download">Export CSV</Button></div>
      <div className="row between wrap" style={{ gap: 8 }}><div className="rk-filters">{[["all", `Everyone · ${trail.length}`], ["people", "People"], ["agents", "Agents"]].map(([k, t]) => <button key={k} type="button" className="chip" aria-pressed={who === k} onClick={() => setWho(k)}>{t}</button>)}</div>
        <span className="t-footnote subtle">Times in IST · the audit log keeps each person's line in their name</span></div>
      <div style={{ overflowX: "auto" }}><table className="rk-table"><thead><tr><th>When</th><th>Who</th><th>As</th><th>What</th></tr></thead>
        <tbody>{rows.map(m => <tr key={m.k}><td className="t">{R.when(m.at)}</td><td><span className="row tight" style={{ gap: 8 }}><R.Actor who={m.who} size={24} /><b>{m.who.short || m.who.name}</b></span></td><td className="subtle">{role(m)}</td><td>{m.text}{m.yes && <> <Badge size="sm" tone="amber">yes</Badge></>}</td></tr>)}</tbody></table></div>
    </Card>;
  }
  const TABS = [{ id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "impact", label: "Impact", icon: "leaf" }, { id: "audit", label: "Audit log", icon: "scroll-text" }];
  function BatchPage({ me, at, tab: tab0 }) {
    const app = useApp(); const phone = app.bp === "phone"; const c = L().caseOf(at); const row = L().rowOf(c);
    const [tab, setTab] = useState(tab0 || "audit");
    const head = <div className="bhead">
      <div className="bh-id"><span className="bh-pic" aria-hidden="true"><Product name={c.sku.img} size={phone ? 46 : 72} alt="" /></span>
        <div className="bh-tt"><h1>{c.sku.name}</h1>
          <div className="bh-meta"><span className="mono">{c.batch.id}</span><span className="sep" aria-hidden="true">·</span><span>{c.dist.name}, {c.dist.city}</span></div>
          <div className="bh-meta"><S.OutcomeBadge o={row.outcome} /><span>Flagged {R.day(c.flagged)} · cleared {R.day(row.cleared)}</span></div></div></div>
    </div>;
    return <Screen me={me} title={c.sku.name} back="Batches" hideLarge below={head}>
      <div className="stack" style={{ gap: 16 }}>
        <Evidence c={c} />
        <S.PtTabs tabs={TABS} value={tab} onChange={setTab} label={`${c.sku.name}, ${c.batch.id}`} />
        {tab === "audit" ? <AuditLog c={c} /> : <Card><span className="t-footnote muted">{TABS.find(t => t.id === tab).label}, as it is today.</span></Card>}
      </div>
    </Screen>;
  }
  function Report(props) {
    const { route } = useRoute(); const p = (route && route.params) || {};
    return p.ref && L().caseOf(p.ref) && L().caseOf(p.ref).history ? <BatchPage key={p.ref} me={props.me} at={p.ref} tab={p.tab} /> : <Orig.Report {...props} />;
  }

  /* ---------- the distributor's Photos: every photo he sent, batch by batch ---------- */
  function Photos({ me }) {
    const s = useStore(); const dist = S.distOf(me); const { go } = useRoute(); const [open, setOpen] = useState(null);
    if (s.hero.photo === "requested") return <Orig.CameraScreen me={me} />;
    const past = P().distBatches(dist.id, s).past.map(c => L().caseOf(c.ref)).filter(c => c && R.photosOf(c).length);
    return <Screen me={me} title="Photos" sub={`Every photo you sent ${D.CLIENT.short}, batch by batch, and what was made of it`}>
      <div className="stack" style={{ gap: 18, maxWidth: 1080 }}>
        <Card className="row" style={{ gap: 12 }}><span className="icontile soft" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name="camera" size={19} /></span><div className="grow"><b className="t-subhead">No photo asked for now</b><div className="t-footnote muted">When Vision needs a carton label, or a destruction needs its evidence, the request opens here.</div></div></Card>
        {past.map(c => { const ph = R.photosOf(c);
          return <Card key={c.ref} className="stack snug">
            <div className="row between wrap" style={{ gap: 10 }}><button type="button" className="row tight pt-link" style={{ gap: 10 }} onClick={() => go("batches", { ref: c.ref })}><Product name={c.sku.img} size={36} /><span className="stack tight" style={{ gap: 0, textAlign: "left" }}><b className="t-subhead">{c.sku.name}</b><span className="mono t-caption subtle">{c.ref}</span></span></button><span className="row tight" style={{ gap: 8 }}><S.OutcomeBadge o={c.outcome} size="sm" /><span className="t-footnote subtle">cleared {R.day(c.cleared)}</span></span></div>
            <div className={cx("rk-photos", ph.length === 2 && "two")}>{ph.map(p => <div key={p.id} className="rk-photo"><R.Shot p={p} onOpen={() => setOpen(p)} /><b className="t-subhead">{p.title}</b><R.PhotoFacts p={p} /></div>)}</div>
          </Card>; })}
      </div>
      <R.PhotoSheet p={open} onClose={() => setOpen(null)} />
    </Screen>;
  }

  Object.assign(S, { Batches, Report, CameraScreen: Photos });
})();

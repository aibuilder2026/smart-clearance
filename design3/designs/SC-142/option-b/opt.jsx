// Option B · Evidence on the timeline. No new tab: a batch's story is its record, and every photo and yes sits at the
// moment it happened:
//   Batches (the operator's): one table, In view or Cleared; a cleared batch shows its days, its photos and what it
//   recovered, and opens its page on its timeline;
//   a batch's page: Timeline · Money · Papers · Impact. The timeline is every step, day by day, by the agent or the
//   person who took it; the label photo where it was sent, with what Vision read; the destruction's two photos where
//   they were sent, with Vision's checks; each yes in amber. "Audit lines" shows each person's step as the audit log
//   keeps it: when, who, what, on which batch;
//   the distributor's What happened: the same moments, his photos at the moments he sent them.
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, R = window.SCR;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, DataTable, BatchRow, GateChips, StatusBadge, Switch, useApp } = K;
  const { useStore, useRoute, Screen } = S;
  const fmt = M.fmt; const L = () => window.SC3_LEDGER, P = () => window.SC3_LEDGER.partners;
  const Orig = { Report: S.Report, DistBatches: S.DistBatches };

  /* ---------- the operator's Batches: one table, in view or cleared ---------- */
  function Batches({ me }) {
    const s = useStore(); const app = useApp(); const { go } = useRoute(); const hm = S.heroModel(s); const live = S.useLive();
    const [view, setView] = useState("cleared");
    const views = D.BATCHES.map(b => { const v = D.batchView(b); if (b.hero) v.phase = hm.view.phase; if (b.second) v.phase = "executing"; return v; });
    const past = R.pastBatches();
    const openRow = v => go(S.partAt(S.journeyItems(s, live).find(i => i.ref === v.id)), { ref: v.id });
    const openPast = c => go("report", { ref: c.ref, tab: "timeline" });
    const chips = <div className="rk-filters" role="group" aria-label="Which batches">{[["view", `In view · ${views.length}`], ["cleared", `Cleared · ${past.length}`]].map(([k, t]) => <button key={k} type="button" className="chip" aria-pressed={view === k} onClick={() => setView(k)}>{t}</button>)}</div>;
    const phone = app.bp === "phone";
    return <Screen me={me} title="Batches" sub="Every lot the Watcher sees, and every batch that has cleared">
      <div className="stack" style={{ gap: 14 }}>{chips}
        {view === "view" ? (phone ? <div className="list">{views.map(v => <BatchRow key={v.id} view={v} compact onOpen={() => openRow(v)} />)}</div> :
          <DataTable label="Batches in view" rows={views.map(v => ({ ...v, name: v.skuObj.name }))} onRow={openRow} initialSort={["daysLeft", "asc"]} columns={[
            { key: "name", label: "Product", render: v => <span className="row tight"><Product name={v.skuObj.img} size={36} /><span className="stack tight" style={{ gap: 0 }}><b>{v.skuObj.name}</b><span className="mono subtle t-caption">{v.id}</span></span></span> },
            { key: "dist", label: "Distributor", sortValue: v => v.dist.name, render: v => <span>{v.dist.name}<div className="t-caption subtle">{v.dist.city}</div></span> },
            { key: "daysLeft", label: "Days left", num: true }, { key: "units", label: "Units", num: true, render: v => fmt.num(v.units) },
            { key: "gates", label: "Quick-commerce gates", sortable: false, render: v => <GateChips gates={v.assess.gates} size="sm" /> },
            { key: "status", label: "Status", sortValue: v => v.phase || v.assess.status, render: v => <StatusBadge status={v.phase || v.assess.status} /> },
          ]} />)
        : phone ? <List>{past.map(c => <ListRow key={c.ref} chevron onClick={() => openPast(c)} leading={<Product name={c.sku.img} size={40} />} title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{c.sku.name}</span><S.OutcomeBadge o={c.outcome} size="sm" /></span>} sub={`${c.ref} · cleared ${R.day(c.cleared)} · ${fmt.inr(L().rowOf(c).figures.net)}`} />)}</List>
        : <DataTable label="Cleared batches" rows={past.map(c => ({ c, ref: c.ref, name: c.sku.name, dist: c.dist.name, flagged: c.flagged, cleared: c.cleared, net: L().rowOf(c).figures.net, outcome: c.outcome }))} onRow={r => openPast(r.c)} initialSort={["cleared", "desc"]} columns={[
            { key: "name", label: "Product", render: r => <span className="row tight"><Product name={r.c.sku.img} size={36} /><span className="stack tight" style={{ gap: 0 }}><b>{r.name}</b><span className="mono subtle t-caption">{r.ref}</span></span></span> },
            { key: "dist", label: "Distributor", render: r => <span>{r.dist}<div className="t-caption subtle">{r.c.dist.city}</div></span> },
            { key: "flagged", label: "Flagged", render: r => R.day(r.flagged) }, { key: "cleared", label: "Cleared", render: r => R.day(r.cleared) },
            { key: "photos", label: "Photos", sortable: false, render: r => { const ph = R.photosOf(r.c); return <span className="rk-thumbs">{ph.map(p => <R.Shot key={p.id} p={p} size="s" />)}</span>; } },
            { key: "net", label: "Recovered", num: true, render: r => fmt.inr(r.net) },
            { key: "outcome", label: "Outcome", render: r => <S.OutcomeBadge o={r.outcome} size="sm" /> },
          ]} />}
      </div>
    </Screen>;
  }

  /* ---------- the timeline, every photo and yes at its moment ---------- */
  function Timeline({ c, who: only }) {
    const [audit, setAudit] = useState(true); const [open, setOpen] = useState(null);
    const photos = R.photosOf(c), ph = id => photos.find(p => p.id === id);
    const trail = R.recordOf(c).filter(m => !only || m.who.kind !== "agent" || only === "all");
    const days = []; trail.forEach(m => { const d = m.at.slice(0, 10); let g = days.find(x => x.d === d); if (!g) days.push(g = { d, items: [] }); g.items.push(m); });
    const email = w => (w.person && w.person.email) || (w.person && w.person.phone) || w.name;
    const evidence = m => {
      if (m.k === "photo" && ph("label")) return <div className="rk-inline"><R.Shot p={ph("label")} onOpen={() => setOpen(ph("label"))} /></div>;
      if (m.k === "read" && ph("label")) return <div className="stack tight" style={{ marginTop: 8 }}>{ph("label").read.lines.map(t => <R.Check key={t} ok>{t}</R.Check>)}</div>;
      if (m.k === "destroySent" && ph("before")) return <div className="rk-inline">{["before", "after"].map(id => <R.Shot key={id} p={ph(id)} onOpen={() => setOpen(ph(id))} />)}</div>;
      if (m.k === "destroyChecked" && c.destruction) return <div className="stack tight" style={{ marginTop: 8 }}>{c.destruction.checks.map(x => <R.Check key={x.id} ok={x.ok}>{x.label}</R.Check>)}</div>;
      return null;
    };
    return <Card className="stack snug">
      <div className="card-head"><span className="card-title">Timeline</span><span className="row tight t-footnote" style={{ gap: 10 }}>Audit lines<Switch checked={audit} onChange={setAudit} label="Show the audit lines" /></span></div>
      <span className="t-footnote muted">Every step of {c.ref}, by the agent or the person who took it, with the photos where they were sent.</span>
      <div className="rk-trail">{days.map(g => <React.Fragment key={g.d}><div className="rk-day">{R.longDay(g.d)}</div>
        {g.items.map((m, i) => <div key={m.k} className={cx("rk-row", i === g.items.length - 1 && "end")}>
          <R.Actor who={m.who} />
          <div style={{ minWidth: 0 }}><span className="who">{m.who.short || m.who.name}{m.who.kind === "agent" ? " · agent" : m.who.org ? ` · ${m.who.org}` : ""}</span><b>{m.text}{m.yes && <> <Badge size="sm" tone="amber">yes</Badge></>}</b>
            {evidence(m)}
            {audit && m.audit && <div className="rk-audit">{m.at.replace("T", " ")} · {email(m.who)} · {m.audit} · {c.ref}</div>}</div>
          <time>{R.time(m.at)}</time></div>)}</React.Fragment>)}</div>
      <Button variant="secondary" icon="download" style={{ justifySelf: "start" }}>Download the audit lines (CSV)</Button>
      <R.PhotoSheet p={open} onClose={() => setOpen(null)} />
    </Card>;
  }
  const TABS = [{ id: "timeline", label: "Timeline", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "impact", label: "Impact", icon: "leaf" }];
  function BatchPage({ me, at, tab: tab0 }) {
    const app = useApp(); const phone = app.bp === "phone"; const c = L().caseOf(at); const row = L().rowOf(c);
    const [tab, setTab] = useState(tab0 || "timeline");
    const head = <div className="bhead">
      <div className="bh-id"><span className="bh-pic" aria-hidden="true"><Product name={c.sku.img} size={phone ? 46 : 72} alt="" /></span>
        <div className="bh-tt"><h1>{c.sku.name}</h1>
          <div className="bh-meta"><span className="mono">{c.batch.id}</span><span className="sep" aria-hidden="true">·</span><span>{c.dist.name}, {c.dist.city}</span></div>
          <div className="bh-meta"><S.OutcomeBadge o={row.outcome} /><span>Flagged {R.day(c.flagged)} · cleared {R.day(row.cleared)}</span></div></div></div>
      <S.PtTabs tabs={TABS} value={tab} onChange={setTab} label={`${c.sku.name}, ${c.batch.id}`} />
    </div>;
    return <Screen me={me} title={c.sku.name} back="Batches" hideLarge below={head}>
      <div style={{ maxWidth: 900 }}>{tab === "timeline" ? <Timeline c={c} /> : <Card><span className="t-footnote muted">{TABS.find(t => t.id === tab).label}, as it is today.</span></Card>}</div>
    </Screen>;
  }
  function Report(props) {
    const { route } = useRoute(); const p = (route && route.params) || {};
    return p.ref && L().caseOf(p.ref) && L().caseOf(p.ref).history ? <BatchPage key={p.ref} me={props.me} at={p.ref} tab={p.tab} /> : <Orig.Report {...props} />;
  }

  /* ---------- the distributor's What happened, his photos at his moments ---------- */
  const DTABS = [{ id: "what", label: "What happened", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }];
  function DistBatch({ me, id }) {
    const s = useStore(); const dist = S.distOf(me); const [tab, setTab] = useState("what"); const [open, setOpen] = useState(null);
    const c = P().distBatches(dist.id, s).past.find(x => x.ref === id);
    if (!c) return <Orig.DistBatches me={me} />;
    const photos = R.photosOf(c), ph = k => photos.find(p => p.id === k);
    const items = P().moments(c);
    const head = <S.PtHead sku={c.sku} id={id} where={`${dist.godown}, ${dist.city}`} badge={<S.OutcomeBadge o={c.outcome} size="sm" />} line={`Flagged ${R.day(c.flagged)} · cleared ${R.day(c.cleared)}`}>
      <S.PtTabs tabs={DTABS} value={tab} onChange={setTab} label={`${c.sku.name}, ${id}`} /></S.PtHead>;
    const inline = m => m.k === "photo" && ph("label") ? <><div className="rk-inline"><R.Shot p={ph("label")} onOpen={() => setOpen(ph("label"))} /></div><div className="stack tight" style={{ marginTop: 8 }}><R.Check ok>Vision read {ph("label").read.lines.join(", ")}</R.Check></div></>
      : m.k === "destroySent" && ph("before") ? <div className="rk-inline">{["before", "after"].map(k => <R.Shot key={k} p={ph(k)} onOpen={() => setOpen(ph(k))} />)}</div>
      : m.k === "destroyApproved" && c.destruction ? <div className="stack tight" style={{ marginTop: 8 }}>{c.destruction.checks.map(x => <R.Check key={x.id} ok={x.ok}>{x.label}</R.Check>)}</div> : null;
    return <Screen me={me} title={c.sku.name} back="Batches" hideLarge below={head}>
      <div className="pt-body">{tab === "what" ? <Card><div className="rk-trail">{items.map((m, i) => <div key={m.k + i} className={cx("rk-row", i === items.length - 1 && "end")}>
        <span className="icontile" style={{ width: 36, height: 36, borderRadius: 11 }}><Icon name={m.icon} size={17} stroke={2} /></span>
        <div style={{ minWidth: 0 }}><b>{m.title}</b>{m.sub && <span className="t-footnote muted" style={{ display: "block", marginTop: 2 }}>{m.sub}</span>}{inline(m)}</div>
        <time>{R.when(m.at)}</time></div>)}</div></Card> : <Card><span className="t-footnote muted">As it is today.</span></Card>}</div>
      <R.PhotoSheet p={open} onClose={() => setOpen(null)} />
    </Screen>;
  }
  function DistBatches(props) {
    const { route } = useRoute(); const ref = route && route.params && route.params.ref;
    return ref ? <DistBatch me={props.me} id={ref} /> : <Orig.DistBatches {...props} />;
  }

  Object.assign(S, { Batches, Report, DistBatches });
})();

// Option A · The Record tab (recommended). A batch's record gets a tab of its own, beside what it came to:
//   Batches (the operator's): the batches in view as today, then every batch that has cleared, by month, each with its
//   photos counted and what it recovered, opening its page on Record;
//   a batch's page: Money · Papers · Impact · Record. Record holds the photos sent for the batch (the label photo and,
//   destroyed at the godown, the before and after) with what Vision read of each, the human yeses, and the audit
//   trail: every step, by the agent or the person who took it, day by day;
//   the distributor's batch page: What happened · Money · Papers · Photos, the photos he sent for it.
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, R = window.SCR;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, DataTable, BatchRow, GateChips, StatusBadge, Chip, useApp } = K;
  const { useStore, useRoute, Screen } = S;
  const fmt = M.fmt; const L = () => window.SC3_LEDGER, P = () => window.SC3_LEDGER.partners;

  /* ---------- the operator's Batches: in view, then cleared ---------- */
  const Orig = { Batches: S.Batches, Report: S.Report, DistBatches: S.DistBatches };
  function Batches({ me }) {
    const s = useStore(); const app = useApp(); const { go } = useRoute(); const hm = S.heroModel(s); const live = S.useLive();
    const views = D.BATCHES.map(b => { const v = D.batchView(b); if (b.hero) v.phase = hm.view.phase; if (b.second) v.phase = "executing"; return v; });
    const openRow = v => go(S.partAt(S.journeyItems(s, live).find(i => i.ref === v.id)), { ref: v.id });
    const months = R.monthsOf(R.pastBatches());
    return <Screen me={me} title="Batches" sub="Every lot the Watcher sees, and every batch that has cleared">
      <div className="stack" style={{ gap: 20 }}>
        <div className="stack tight"><div className="list-head">In view · from the DMS export</div>
        {app.bp === "phone" ? <div className="list">{views.map(v => <BatchRow key={v.id} view={v} compact onOpen={() => openRow(v)} />)}</div> :
        <DataTable label="Batches in view" rows={views.map(v => ({ ...v, name: v.skuObj.name }))} onRow={openRow} initialSort={["daysLeft", "asc"]} columns={[
          { key: "name", label: "Product", render: v => <span className="row tight"><Product name={v.skuObj.img} size={36} /><span className="stack tight" style={{ gap: 0 }}><b>{v.skuObj.name}</b><span className="mono subtle t-caption">{v.id}</span></span></span> },
          { key: "dist", label: "Distributor", sortValue: v => v.dist.name, render: v => <span>{v.dist.name}<div className="t-caption subtle">{v.dist.city}</div></span> },
          { key: "daysLeft", label: "Days left", num: true }, { key: "units", label: "Units", num: true, render: v => fmt.num(v.units) },
          { key: "gates", label: "Quick-commerce gates", sortable: false, render: v => <GateChips gates={v.assess.gates} size="sm" /> },
          { key: "status", label: "Status", sortValue: v => v.phase || v.assess.status, render: v => <StatusBadge status={v.phase || v.assess.status} /> },
        ]} />}</div>
        {months.map(g => <List key={g.m} head={`Cleared · ${g.label}`}>{g.items.map(c => { const ph = R.photosOf(c); const row = L().rowOf(c);
          return <ListRow key={c.ref} chevron onClick={() => go("report", { ref: c.ref, tab: "record" })} leading={<Product name={c.sku.img} size={40} />}
            title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{c.sku.name}</span><S.OutcomeBadge o={c.outcome} size="sm" /></span>}
            sub={`${c.ref} · ${c.dist.name} · flagged ${R.day(c.flagged)} · cleared ${R.day(c.cleared)}`}
            value={app.bp === "phone" ? null : <span className="row" style={{ gap: 16 }}><span className="rk-count"><Icon name="camera" size={15} />{ph.length} {ph.length === 1 ? "photo" : "photos"}</span><b className="tnum">{fmt.inr(row.figures.net)}</b></span>} />; })}</List>)}
      </div>
    </Screen>;
  }

  /* ---------- a batch's page, with its Record ---------- */
  const TABS = [{ id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "impact", label: "Impact", icon: "leaf" }, { id: "record", label: "Record", icon: "history" }];
  function Record({ c }) {
    const app = useApp(); const phone = app.bp === "phone";
    const [open, setOpen] = useState(null); const [who, setWho] = useState("all");
    const photos = R.photosOf(c), yeses = R.approvalsOf(c), trail = R.recordOf(c);
    const rows = trail.filter(m => who === "all" || (who === "people" ? m.who.kind !== "agent" : m.who.kind === "agent"));
    const days = []; rows.forEach(m => { const d = m.at.slice(0, 10); let g = days.find(x => x.d === d); if (!g) days.push(g = { d, items: [] }); g.items.push(m); });
    const people = trail.filter(m => m.who.kind === "person").length;
    return <div className="stack" style={{ gap: 16 }}>
      <Card className="stack snug">
        <div className="card-head"><span className="card-title">Photos sent for this batch</span><span className="t-footnote subtle">{photos.length} · tap to open</span></div>
        <div className={cx("rk-photos", photos.length === 2 && "two")}>{photos.map(p => <div key={p.id} className="rk-photo"><R.Shot p={p} onOpen={() => setOpen(p)} /><b className="t-subhead">{p.title}</b><R.PhotoFacts p={p} /></div>)}</div>
      </Card>
      <div className="rk-cols">
        <Card className="stack snug">
          <div className="card-head"><span className="card-title">Audit trail</span><span className="t-footnote subtle">{trail.length} steps · {people} by people</span></div>
          <div className="rk-filters">{[["all", "Everyone"], ["people", "People"], ["agents", "Agents"]].map(([k, t]) => <button key={k} type="button" className="chip" aria-pressed={who === k} onClick={() => setWho(k)}>{t}</button>)}</div>
          <div className="rk-trail">{days.map(g => <React.Fragment key={g.d}><div className="rk-day">{R.longDay(g.d)}</div>
            {g.items.map((m, i) => <div key={m.k} className={cx("rk-row", m.yes && "yes", i === g.items.length - 1 && "end")}>
              <R.Actor who={m.who} />
              <div style={{ minWidth: 0 }}><span className="who">{m.who.short || m.who.name}{m.who.kind === "agent" ? " · agent" : m.who.org ? ` · ${m.who.org}` : ""}</span><b>{m.text}{m.yes && <> <Badge size="sm" tone="amber">yes</Badge></>}</b></div>
              <time>{R.time(m.at)}</time></div>)}</React.Fragment>)}</div>
          <Button variant="secondary" icon="download" style={{ justifySelf: "start" }}>Download the audit trail (CSV)</Button>
        </Card>
        <div className="stack" style={{ gap: 16 }}>
          <Card className="stack snug"><span className="card-title">The yeses</span><span className="t-footnote muted">What only a person at {D.CLIENT.short} could let happen, in their name.</span>
            {yeses.map(a => <R.Yes key={a.k} a={a} />)}</Card>
          {!phone && <Card className="stack snug"><span className="card-title">Papers</span>{c.docs.filter(d => d.status !== "not required").map(d => <ListRow key={d.id} title={d.type} sub={d.no && !/^s\./.test(d.no) ? d.no : null} value={<Icon name="chevron-right" size={16} />} />)}</Card>}
        </div>
      </div>
      <R.PhotoSheet p={open} onClose={() => setOpen(null)} />
    </div>;
  }
  function BatchPage({ me, at, tab: tab0 }) {
    const app = useApp(); const phone = app.bp === "phone"; const c = L().caseOf(at); const row = L().rowOf(c);
    const [tab, setTab] = useState(tab0 || "record");
    const head = <div className="bhead">
      <div className="bh-id"><span className="bh-pic" aria-hidden="true"><Product name={c.sku.img} size={phone ? 46 : 72} alt="" /></span>
        <div className="bh-tt"><h1>{c.sku.name}</h1>
          <div className="bh-meta"><span className="mono">{c.batch.id}</span><span className="sep" aria-hidden="true">·</span><span>{c.dist.name}, {c.dist.city}</span></div>
          <div className="bh-meta"><S.OutcomeBadge o={row.outcome} /><span>Flagged {R.day(c.flagged)} · cleared {R.day(row.cleared)}</span></div></div></div>
      <S.PtTabs tabs={TABS} value={tab} onChange={setTab} label={`${c.sku.name}, ${c.batch.id}`} />
    </div>;
    return <Screen me={me} title={c.sku.name} back="Batches" hideLarge below={head}>
      {tab === "record" ? <Record c={c} /> : <Card><span className="t-footnote muted">{TABS.find(t => t.id === tab).label}, as it is today.</span></Card>}
    </Screen>;
  }
  function Report(props) {
    const { route } = useRoute(); const p = (route && route.params) || {};
    return p.ref && L().caseOf(p.ref) && L().caseOf(p.ref).history ? <BatchPage key={p.ref} me={props.me} at={p.ref} tab={p.tab} /> : <Orig.Report {...props} />;
  }

  /* ---------- the distributor's batch page: his photos ---------- */
  const DTABS = [{ id: "what", label: "What happened", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "photos", label: "Photos", icon: "camera" }];
  function DistBatch({ me, id }) {
    const s = useStore(); const dist = S.distOf(me); const [tab, setTab] = useState("photos"); const [open, setOpen] = useState(null);
    const c = P().distBatches(dist.id, s).past.find(x => x.ref === id);
    if (!c) return <Orig.DistBatches me={me} />;
    const photos = R.photosOf(c), yes = R.approvalsOf(c).find(a => a.k === "destroyApproved");
    const head = <S.PtHead sku={c.sku} id={id} where={`${dist.godown}, ${dist.city}`} badge={<S.OutcomeBadge o={c.outcome} size="sm" />} line={`Flagged ${R.day(c.flagged)} · cleared ${R.day(c.cleared)}`}>
      <S.PtTabs tabs={DTABS} value={tab} onChange={setTab} label={`${c.sku.name}, ${id}`} /></S.PtHead>;
    return <Screen me={me} title={c.sku.name} back="Batches" hideLarge below={head}>
      <div className="pt-body stack" style={{ gap: 16 }}>
        {tab === "photos" ? <><Card className="stack snug">
          <div className="card-head"><span className="card-title">Your photos for this batch</span><span className="t-footnote subtle">{photos.length}</span></div>
          <div className={cx("rk-photos", photos.length === 2 && "two")}>{photos.map(p => <div key={p.id} className="rk-photo"><R.Shot p={p} onOpen={() => setOpen(p)} /><b className="t-subhead">{p.title}</b><R.PhotoFacts p={p} /></div>)}</div>
        </Card>{yes && <Card className="stack snug"><span className="card-title">Approved</span><R.Yes a={yes} /><span className="t-footnote muted">{D.CLIENT.short} credited you on {(c.docs.find(d => d.id === "expiry") || {}).no} once it approved.</span></Card>}</>
          : tab === "what" ? <Card><S.PtMoments items={P().moments(c)} /></Card> : <Card><span className="t-footnote muted">As it is today.</span></Card>}
      </div>
      <R.PhotoSheet p={open} onClose={() => setOpen(null)} />
    </Screen>;
  }
  function DistBatches(props) {
    const { route } = useRoute(); const ref = route && route.params && route.params.ref;
    return ref ? <DistBatch me={props.me} id={ref} /> : <Orig.DistBatches {...props} />;
  }

  Object.assign(S, { Batches, Report, DistBatches });
})();

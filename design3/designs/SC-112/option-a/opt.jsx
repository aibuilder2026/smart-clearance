// SC-112 option A · The batch page. A batch is a page of its own, with one head for every screen about it and its
// screens as tabs under the head: Journey, Route Room, Execution, Paperwork. Route Room and Execution leave the sidebar;
// the batches in a journey take their place, by name and stop. The Command Center and every screen's body are as today.
(function () {
  const { useState } = React;
  const { motion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS, X = S.SC112;
  const { cx, Icon, Badge, Product, useApp } = K;

  const NAV = [
    { id: "command", label: "Command Center", short: "Today", icon: "layout-dashboard" },
    { id: "batches", label: "Batches", icon: "boxes" },
    { id: "setup", label: "Setup", icon: "sliders-horizontal", phoneHidden: true },
    { id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line", section: "Reports" },
  ];
  const WORKSPACE = ["command", "batches", "setup", "report", "inbox", "profile"];

  // the batch's head: its product, its name, its id and distributor, where it stands, and its screens as tabs
  function Head({ it, part, onPart }) {
    const s = S.useStore(); const app = useApp(); const phone = app.bp === "phone"; const live = S.useLive(); const st = X.stateOf(it, s);
    return <div className="sc-head">
      <div className="sc-id">
        <span className="sc-pic" aria-hidden="true"><Product name={it.sku.img} size={phone ? 46 : 72} alt="" /></span>
        <div className="sc-tt">
          <h1>{it.sku.name}</h1>
          <div className="sc-meta"><span className="mono">{it.ref}</span><span className="sep" aria-hidden="true">·</span><span>{it.dist.name}, {it.dist.city}</span></div>
          <div className="sc-meta"><Badge tone={st.tone} dot live={st.live}>{st.text}</Badge>{live && <S.Live.Line />}</div>
        </div>
      </div>
      <Tabs it={it} part={part} onPart={onPart} />
    </div>;
  }
  // the batch's screens: a pill track with a sliding thumb (the kit's tabs, at page size). The tab for where the batch
  // stands carries a dot, amber when it waits for a yes; a screen it has not reached reads quieter and says when
  function Tabs({ it, part, onPart }) {
    const phone = useApp().bp === "phone";
    return <nav className="sc-tabs" aria-label={`${it.sku.name}, ${it.ref}`}>
      {X.PARTS.map(p => { const st = X.partState(it, p); const on = part === p.id;
        return <button key={p.id} type="button" className={cx("sc-tab", st.ahead && "ahead")} aria-current={on ? "page" : undefined} onClick={() => onPart(p.id)} title={st.words || undefined}>
          {on && <motion.span layoutId="sc-tab-thumb" className="sc-tab-thumb" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
          {!phone && <Icon name={p.icon} size={16} />}<span>{phone ? p.short : p.label}</span>
          {st.here && <i className={cx("sc-here", st.human && "human")} aria-hidden="true" />}
          {st.words && <span className="sr-only">, {st.words}</span>}
        </button>; })}
    </nav>;
  }

  function Operator({ me, route, onGo, onBack, pushStep }) {
    const s = S.useStore(); const live = S.useLive(); const app = useApp();
    const items = X.journeys(s, live);
    const asked = route && route.name; const name = WORKSPACE.includes(asked) || X.PART_IDS.includes(asked) ? asked : "command";
    const inBatch = n => X.PART_IDS.includes(n);
    const it = inBatch(name) ? X.find(items, route.params && route.params.ref) : null;
    const from = X.useCameFrom(name, inBatch, X.LABELS);
    const go = (n, params, replace) => onGo({ name: n, params, replace });
    const r = { name, params: it ? { ref: it.ref } : route && route.params };
    const menu = <>
      <X.SbItem icon="layout-dashboard" label="Command Center" on={name === "command"} onClick={() => go("command")} />
      <X.SbItem icon="boxes" label="Batches" count={D.BATCHES.length} on={name === "batches"} onClick={() => go("batches")} />
      <X.SbItem icon="sliders-horizontal" label="Setup" on={name === "setup"} onClick={() => go("setup")} />
      <div className="sb-label">In a journey · {items.length}</div>
      {items.map(b => <X.SbBatch key={b.ref} it={b} on={!!it && it.ref === b.ref} onClick={() => go(X.partAt(b), { ref: b.ref })} />)}
      <div className="sb-label">Reports</div>
      <X.SbItem icon="chart-line" label="Finance & ESG" on={name === "report"} onClick={() => go("report")} />
    </>;
    const frame = it ? { title: it.sku.name, hideLarge: true, back: from.label, sub: null, below: <Head it={it} part={name} onPart={p => go(p, { ref: it.ref }, true)} /> } : null;
    const body = it ? <X.PartBody me={me} it={it} part={name} /> : S.screenFor(me, name, {});
    const current = it ? (from.id === "batches" ? "batches" : "command") : name;
    return <X.Chrome me={me} route={r} onGo={onGo} onBack={onBack} nav={NAV} current={current} onNav={id => go(id, {}, true)} menu={menu} screenKey={it ? "batch:" + it.ref : name} scrollKey={name + (it ? it.ref : "")} className={it ? "sc-frame" : undefined} pushStep={pushStep}>
      <X.FrameCtx.Provider value={frame}>{body}</X.FrameCtx.Provider>
    </X.Chrome>;
  }
  X.FrameCtx = S.SC112.FrameCtx;
  S.RoleApp = X.roleApp(Operator);
})();

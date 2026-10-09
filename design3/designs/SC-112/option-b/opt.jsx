// SC-112 option B · The batch rail. The batches are a place of their own: opening Batches, or any batch, turns the
// sidebar into the batch rail, every batch grouped by where it stands (Needs your yes, In a journey, Watching), and the
// batch that is open unfolds its screens under it. The sidebar keeps its width, so every screen keeps its own. On a phone
// the same tree is a stack: Batches, then a batch with its screens as rows, then the screen.
(function () {
  const { useState, useRef } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, X = S.SC112;
  const { cx, Icon, Badge, Product, List, ListRow, BatchRow, useApp } = K;

  const NAV = [
    { id: "command", label: "Command Center", short: "Today", icon: "layout-dashboard" },
    { id: "batches", label: "Batches", icon: "boxes" },
    { id: "setup", label: "Setup", icon: "sliders-horizontal", phoneHidden: true },
    { id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line", section: "Reports" },
  ];
  const WORKSPACE = ["command", "batches", "setup", "report", "inbox", "profile"];
  const RAIL = ["batches", "batch"].concat(X.PART_IDS);
  // the sidebar drills in: the rail enters from the right and the workspace's menu leaves to the left, and back again
  const SLIDE = { enter: d => ({ opacity: 0, x: d * 28 }), center: { opacity: 1, x: 0 }, exit: d => ({ opacity: 0, x: -d * 28 }) };

  // a batch in a journey, in the rail: its product, short name, id and stop, days left; open, its screens under it
  function RailBatch({ b, open, part, onOpen, onPart }) {
    const reduce = useReducedMotion();
    return <div className={cx("rl-b", open && "open")}>
      <button type="button" className="rl-row" aria-expanded={open} onClick={onOpen} title={`${b.sku.name} · ${b.ref}`}>
        <span className="rl-pic" aria-hidden="true"><Product name={b.sku.img} size={30} alt="" /></span>
        <span className="rl-t"><b>{X.shortName(b.sku)}</b><span className={cx("rl-stop", b.human && "human")}><i aria-hidden="true" />{b.human ? "Approve · your yes" : b.stop}</span></span>
        <span className="rl-days"><b>{b.days}</b>d</span>
      </button>
      <AnimatePresence initial={false}>{open && <motion.div className="rl-parts" initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduce ? undefined : { height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 40, mass: 0.9 }}>
        {X.PARTS.map(p => { const st = X.partState(b, p);
          return <button key={p.id} type="button" className={cx("rl-part", st.ahead && "ahead")} aria-current={part === p.id ? "page" : undefined} onClick={() => onPart(p.id)}>
            <Icon name={p.icon} size={16} /><span>{p.label}</span>
            {st.here ? <span className={cx("rl-here", st.human && "human")}><i aria-hidden="true" />{st.human ? "your yes" : "now"}</span> : st.ahead ? <span className="sr-only">, {st.words}</span> : null}
          </button>; })}
      </motion.div>}</AnimatePresence>
    </div>;
  }
  // a batch the Watcher only watches: its sheet opens, as on the Batches screen
  function RailWatch({ v, onOpen }) {
    const risk = v.assess.status === "at-risk";
    return <button type="button" className="rl-row rl-w" onClick={onOpen}>
      <span className="rl-pic" aria-hidden="true"><Product name={v.skuObj.img} size={30} alt="" /></span>
      <span className="rl-t"><b>{X.shortName(v.skuObj)}</b><span className="mono">{v.id}</span></span>
      <span className={cx("rl-days", risk && "risk")}><b>{v.daysLeft}</b>d{risk && <span className="sr-only">, at risk</span>}</span>
    </button>;
  }
  function Rail({ items, it, part, onBack, go, onWatch, allOn }) {
    const needs = items.filter(i => i.human), moving = items.filter(i => !i.human && i.current >= 0), done = items.filter(i => i.current < 0);
    const group = (label, list) => list.length > 0 && <div className="rl-group"><div className="sb-label">{label} · {list.length}</div>{list.map(b => <RailBatch key={b.ref} b={b} open={!!it && it.ref === b.ref} part={part} onOpen={() => go(X.partAt(b), { ref: b.ref })} onPart={p => go(p, { ref: b.ref }, true)} />)}</div>;
    const w = X.watched(items);
    return <>
      <button type="button" className="sb-item rl-back" onClick={onBack}><Icon name="chevron-left" size={19} /><span>Command Center</span></button>
      <div className="rl-title"><span>Batches</span></div>
      <X.SbItem icon="boxes" label="All batches" count={D.BATCHES.length} on={allOn} onClick={() => go("batches", {}, true)} />
      {group("Needs your yes", needs)}
      {group("In a journey", moving)}
      {group("Cleared", done)}
      <div className="rl-group"><div className="sb-label">Watching · {w.length}</div>{w.map(v => <RailWatch key={v.id} v={v} onOpen={() => onWatch(v)} />)}</div>
    </>;
  }
  // the workspace's own menu, before a batch is opened
  function WorkspaceMenu({ name, go, items }) {
    const needs = items.filter(i => i.human).length;
    return <>
      <X.SbItem icon="layout-dashboard" label="Command Center" on={name === "command"} onClick={() => go("command")} />
      <X.SbItem icon="boxes" label="Batches" on={false} onClick={() => go("batches")}>{needs ? <span className="sbb-yes" aria-label={`${needs} needs your yes`}>{needs}</span> : <span className="sb-n">{D.BATCHES.length}</span>}<Icon name="chevron-right" size={16} className="subtle" /></X.SbItem>
      <X.SbItem icon="sliders-horizontal" label="Setup" on={name === "setup"} onClick={() => go("setup")} />
      <div className="sb-label">Reports</div>
      <X.SbItem icon="chart-line" label="Finance & ESG" on={name === "report"} onClick={() => go("report")} />
    </>;
  }

  // phones: Batches is a list grouped like the rail; a batch is its tracker card with its screens as rows
  function BatchList({ me, items, go, onWatch }) {
    const needs = items.filter(i => i.human), moving = items.filter(i => !i.human && i.current >= 0); const w = X.watched(items);
    const row = b => { const v = Object.assign({}, b.view, { phase: b.view.phase || "routing" }); return <BatchRow key={b.ref} view={v} compact onOpen={() => go("batch", { ref: b.ref })} />; };
    return <S.Screen me={me} title="Batches" sub="Every lot the Watcher sees, by where it stands">
      <div className="stack" style={{ gap: 18 }}>
        {needs.length > 0 && <div className="stack snug"><S.SectionTitle>Needs your yes</S.SectionTitle><div className="list">{needs.map(row)}</div></div>}
        {moving.length > 0 && <div className="stack snug"><S.SectionTitle>In a journey</S.SectionTitle><div className="list">{moving.map(row)}</div></div>}
        <div className="stack snug"><S.SectionTitle sub="Nearest best-before first">Watching</S.SectionTitle><div className="list">{w.map(v => <BatchRow key={v.id} view={v} compact onOpen={() => onWatch(v)} />)}</div></div>
      </div>
    </S.Screen>;
  }
  function Parts({ it, go }) {
    return <List head="This batch">{X.PARTS.filter(p => p.id !== "journey").map(p => { const st = X.partState(it, p);
      return <ListRow key={p.id} icon={p.icon} iconTone={st.here ? (st.human ? "amber" : undefined) : st.ahead ? "gray" : undefined} title={p.label} sub={st.here ? (st.human ? "Waiting for your yes" : "Where the batch is now") : st.ahead ? st.words.replace(/^./, c => c.toUpperCase()) : "Done"} value={st.here ? <Badge size="sm" tone={st.human ? "amber" : "green"} dot>{it.stop}</Badge> : null} chevron onClick={() => go(p.id, { ref: it.ref })} />; })}</List>;
  }

  function Operator({ me, route, onGo, onBack, pushStep }) {
    const s = S.useStore(); const live = S.useLive(); const app = useApp(); const phone = app.bp === "phone"; const reduce = useReducedMotion();
    const items = X.journeys(s, live); const [watch, setWatch] = useState(null);
    const asked = route && route.name; let name = WORKSPACE.includes(asked) || RAIL.includes(asked) ? asked : "command";
    const inBatch = n => n === "batch" || X.PART_IDS.includes(n);
    const it = inBatch(name) ? X.find(items, route.params && route.params.ref) : null;
    if (name === "batch" && !phone) name = X.partAt(it);
    const from = X.useCameFrom(name, inBatch, X.LABELS);
    const go = (n, params, replace) => onGo({ name: n, params, replace });
    // the rail slides in from the right as Batches opens, and out again on the way back
    const rail = RAIL.includes(name); const was = useRef(rail); const dir = useRef(1); if (rail !== was.current) dir.current = rail ? 1 : -1; was.current = rail;
    const menu = <AnimatePresence mode="popLayout" initial={false} custom={dir.current}>
      <motion.div key={rail ? "rail" : "ws"} className="rl-pane" custom={dir.current} variants={SLIDE} initial={reduce ? false : "enter"} animate="center" exit={reduce ? undefined : "exit"} transition={{ duration: 0.24, ease: X.EASE }}>
        {rail ? <Rail items={items} it={it} part={name} go={go} onBack={() => go("command")} onWatch={setWatch} allOn={name === "batches"} /> : <WorkspaceMenu name={name} go={go} items={items} />}
      </motion.div>
    </AnimatePresence>;
    const r = { name, params: it ? { ref: it.ref } : route && route.params };
    const batchSub = it ? `${it.sku.brand} ${it.sku.name} · ${it.ref} · ${it.dist.name}, ${it.dist.city}` : null;
    let frame = null, body;
    if (name === "batch") { frame = { back: from.label, sub: `${it.ref} · ${it.dist.name}, ${it.dist.city}` }; body = <X.JourneyView me={me} it={it} title={it.sku.name} before={<Parts it={it} go={go} />} />; }
    else if (it) { frame = { sub: batchSub, below: null, back: phone ? X.shortName(it.sku) : null }; body = <X.PartBody me={me} it={it} part={name} />; }
    else if (name === "batches" && phone) body = <BatchList me={me} items={items} go={go} onWatch={setWatch} />;
    else body = S.screenFor(me, name, {});
    const current = rail ? "batches" : name;
    return <X.Chrome me={me} route={r} onGo={onGo} onBack={phone && it && name !== "batch" ? () => go("batch", { ref: it.ref }) : onBack} nav={NAV} current={current} onNav={id => go(id, {}, true)} menu={menu} screenKey={name + (it ? it.ref : "")} pushStep={pushStep}>
      <X.FrameCtx.Provider value={frame}>{body}</X.FrameCtx.Provider>
      <X.WatchSheet view={watch} onClose={() => setWatch(null)} />
    </X.Chrome>;
  }
  X.FrameCtx = S.SC112.FrameCtx;
  S.RoleApp = X.roleApp(Operator);
})();

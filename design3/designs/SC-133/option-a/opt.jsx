// Option A · A card for each batch. The distributor's work is Munchly's batches at his godown, so every screen of his
// is told batch by batch (Batches, SC-130, stays as it is):
//   Today: one card for each batch in a journey, its next step for him with its one button, and its lines (the scheme,
//   the lot, the staff sale, the pickup), each where it stands; nothing else;
//   Deliveries (the van route, per batch): the batch's van round and the buyer's truck, only the lines its plan has;
//   Orders: every batch's orders, in a journey and cleared, who bought what, for how much, on which paper.
(function () {
  const { useState } = React;
  const { motion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER, W = window.SC3_WORLD, Flow = window.SC3_FLOW, X = window.SCD;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, Money, Empty, ClusterMap, HaulLine, Aura, Mark, WorkspaceMark, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle } = S;
  const fmt = M.fmt;

  // the navigation: Today, Batches and Orders; the van route becomes each batch's Deliveries, reached from its card,
  // and the label photo opens from the step that asks for it
  S.NAV.distributor.splice(0, S.NAV.distributor.length,
    { id: "home", label: "Today", icon: "house" }, { id: "batches", label: "Batches", icon: "boxes" },
    { id: "van", label: "Deliveries", short: "Deliveries", icon: "truck", phoneHidden: true },
    { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true },
    { id: "orders", label: "Orders", icon: "clipboard-list" });

  function Acting({ p }) {
    return <Card className="row wrap" style={{ gap: 12 }}><span className="icontile" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name="handshake" size={19} /></span>
      <div className="grow" style={{ minWidth: 0 }}><b>Smart-Clearance acts for you</b><div className="t-footnote muted">Inside {D.WORKSPACE.short}'s floors · since {p.at} · listings, scheme offers, invoice drafts, dispatch slots</div></div>
      <Button variant="secondary" size="sm" icon="pause">Pause</Button></Card>;
  }

  // a step of his: what, for which batch, and the one button
  function Step({ t, j, primary }) {
    const { go } = useRoute(); const { toast } = useNotice();
    const run = () => { if (t.act && !t.route) { Flow.act(t.act); toast({ text: `${t.title} · done`, tone: "ok" }); } else go(t.route, t.route === "van" ? { ref: j.ref } : undefined); };
    return <div className={cx("dk-step", primary && "primary")}>
      <span className="icontile" style={{ width: primary ? 44 : 36, height: primary ? 44 : 36, borderRadius: 12 }}><Icon name={t.icon} size={primary ? 20 : 17} stroke={2} /></span>
      <span className="grow stack tight" style={{ gap: 2, minWidth: 0 }}><b className={primary ? "t-headline" : "t-subhead"}>{t.title}</b><span className="t-footnote muted">{t.sub}</span></span>
      <Button variant={primary ? "primary" : "secondary"} size={primary ? "md" : "sm"} icon={t.icon} onClick={run}>{t.cta}</Button>
    </div>;
  }

  // a batch in a journey, as one card: the batch, its next step for him, its lines
  function BatchCard({ j }) {
    const { go } = useRoute(); const phone = useApp().bp === "phone";
    return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} className="card dk-batch">
      <div className="row between wrap" style={{ gap: 12 }}>
        <X.BatchLine sku={j.sku} id={j.ref} badge={X.stopBadge(j)} sub={`${X.num(j.units)} packs at risk · flagged ${X.day(j.flagged)}`} size={phone ? 44 : 56} />
        <Button variant="ghost" size="sm" iconRight="chevron-right" onClick={() => go("batches", { ref: j.ref })}>The batch</Button>
      </div>
      {j.todo.length ? <div className="stack" style={{ gap: 8 }}>{j.todo.map((t, i) => <Step key={t.id} t={t} j={j} primary={i === 0} />)}</div>
        : <div className="dk-wait"><Aura on className="icontile soft" style={{ width: 36, height: 36, borderRadius: 11 }}><Icon name="sparkles" size={17} /></Aura><span className="t-subhead">{j.waiting}</span><span className="t-footnote subtle">Nothing for you now</span></div>}
      <div className="dk-lines">{j.lines.map(l => <X.LineRow key={l.id} line={l} onOpen={l.route ? () => go(l.route, { ref: j.ref }) : null} />)}</div>
    </motion.div>;
  }

  function Today({ me }) {
    const s = useStore(); const { go } = useRoute();
    const dist = X.distOf(me), perm = s.setup.permission, hero = dist.id === "rakesh";
    const js = X.journey(dist, s);
    const b = L.partners.distBatches(dist.id, s);
    return <Screen me={me} title="Today" sub={`${dist.name} · ${dist.godown}, ${dist.city}`}>
      <div className="stack" style={{ gap: 16, maxWidth: 960 }}>
        {hero && (perm ? <Acting p={perm} /> : <S.PermissionCard />)}
        <SectionTitle sub={`${D.WORKSPACE.short}'s batches at your godown: what each needs from you, and where each line stands`}>{js.length ? `${js.length} ${js.length === 1 ? "batch" : "batches"} in a journey` : "No batch in a journey"}</SectionTitle>
        {js.length ? js.map(j => <BatchCard key={j.ref} j={j} />)
          : <Card><Empty img="godown" title="Nothing asks for you today" body={`When the Watcher flags a batch at ${dist.godown}, it opens here with what it needs from you.`} /></Card>}
        <button type="button" className="dk-more" onClick={() => go("batches")}><Icon name="boxes" size={17} /><span className="grow">Your other stock and the batches you cleared are on <b>Batches</b>: {b.watching.length} the Watcher reads, {b.past.length} cleared since July</span><Icon name="chevron-right" size={16} className="subtle" /></button>
      </div>
    </Screen>;
  }

  /* ---------- Deliveries: a batch's van round and the buyer's truck ---------- */
  function Switcher({ js, value, onChange }) {
    if (js.length < 2) return null;
    return <nav className="bh-tabs" aria-label="Batches in a journey">{js.map(j => { const on = j.ref === value;
      return <button key={j.ref} type="button" className="bh-tab" aria-current={on ? "page" : undefined} onClick={() => onChange(j.ref)}>{on && <motion.span layoutId="dka-thumb" className="bh-tab-thumb" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}<Product name={j.sku.img} size={22} /><span>{j.sku.name.replace(/ \d.*$/, "")}</span></button>; })}</nav>;
  }
  function Deliveries({ me }) {
    const s = useStore(); const { route, go } = useRoute();
    const dist = X.distOf(me), js = X.journey(dist, s);
    const ref = route && route.params && route.params.ref;
    const j = js.find(x => x.ref === ref) || js[0];
    if (!j) return <Screen me={me} title="Deliveries" sub={dist.cluster}><Card style={{ maxWidth: 560 }}><Empty img="van" title="Nothing goes out" body="While a batch is in a journey, its van round and the buyer's truck show here." /></Card></Screen>;
    const has = id => j.lines.some(l => l.id === id);
    const head = <S.PtHead sku={j.sku} id={j.ref} where={`${dist.godown}, ${dist.city}`} badge={X.stopBadge(j)} line="What leaves your godown for this batch, line by line"><Switcher js={js} value={j.ref} onChange={r => go("van", { ref: r })} /></S.PtHead>;
    return <Screen me={me} title={j.sku.name} back="Today" hideLarge below={head}>
      <Columns sideWidth={380}
        main={<>{has("kirana") && <X.VanCard j={j} s={s} />}{!has("kirana") && <Card><Empty img="van" title="No van round" body="This batch has no kirana scheme." /></Card>}</>}
        side={<>{has("expiresoon") && <X.TruckCard j={j} s={s} />}{has("staff") && <X.StaffCard j={j} />}{has("foodbank") && <X.PickupCard j={j} s={s} />}</>} />
    </Screen>;
  }

  /* ---------- Orders: every batch's orders, past and present ---------- */
  function Orders({ me }) {
    const s = useStore(); const { go } = useRoute();
    const dist = X.distOf(me), book = X.orderBook(dist, s);
    const all = book.flatMap(b => b.rows), total = all.reduce((t, o) => t + o.amount, 0);
    const shops = all.filter(o => o.id === "kirana").reduce((t, o) => t + (o.shops ? o.shops.length : 0), 0), lots = all.filter(o => o.id === "expiresoon").length;
    return <Screen me={me} title="Orders" sub={`${dist.name} · what sold from each of ${D.WORKSPACE.short}'s batches, to whom, on which paper`}>
      <div className="stack" style={{ gap: 16, maxWidth: 960 }}>
        {book.length ? <Card className="stack" style={{ gap: 8 }}><div className="lg-fig"><Money value={total} size="l" /><span className="lg-what">sold from {D.WORKSPACE.short}'s batches since July</span></div>
          <p className="lg-working">{book.length} batches · {shops} kiranas' scheme orders · {lots} ExpireSoon {lots === 1 ? "lot" : "lots"} · every staff sale. The price support is on each batch's papers.</p></Card>
          : <Card><Empty img="van" title="No orders yet" body="When a batch's scheme, lot or staff sale sells, each order shows here under its batch." /></Card>}
        {book.map(b => <Card key={b.ref} className="stack snug">
          <div className="row between wrap" style={{ gap: 12 }}>
            <X.BatchLine sku={b.sku} id={b.ref} size={44} badge={b.live ? <Badge size="sm" tone="blue" dot live>In a journey · {b.stop}</Badge> : <S.OutcomeBadge o={b.outcome} size="sm" />} sub={b.live ? "orders so far" : `cleared ${X.day(b.cleared)}`} />
            <span className="row tight"><span className="tnum strong">{X.inr(b.rows.reduce((t, o) => t + o.amount, 0))}</span><Button variant="ghost" size="sm" iconRight="chevron-right" onClick={() => go("batches", { ref: b.ref })}>Papers</Button></span>
          </div>
          <div className="dk-orders">{b.rows.map(o => <X.OrderRow key={o.id} o={o} />)}</div>
        </Card>)}
      </div>
    </Screen>;
  }

  S.DistHome = Today;
  S.VanRoute = Deliveries;
  S.DistOrders = Orders;
})();

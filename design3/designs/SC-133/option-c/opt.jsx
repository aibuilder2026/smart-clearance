// Option C · A batch in focus. The distributor works one batch at a time, so Today, Deliveries and Orders each open on
// the batch in focus, picked from the batches in a journey at the top of the page (Batches, SC-130, stays as it is):
//   Today: the batch's run sheet, every step from the Watcher's flag to settled, his own steps marked and actionable in
//   place; beside it, the batch's lines and how he ends whole on the plan;
//   Deliveries: the batch's van round, the buyer's truck, the staff sale, the food bank's pickup;
//   Orders: the batch's orders, or all batches, past included.
(function () {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER, Flow = window.SC3_FLOW, X = window.SCD;
  const { cx, Icon, Badge, Button, Card, Product, Money, Empty, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle } = S;
  const P = L.partners;

  S.NAV.distributor.splice(0, S.NAV.distributor.length,
    { id: "home", label: "Today", icon: "house" }, { id: "batches", label: "Batches", icon: "boxes" },
    { id: "van", label: "Deliveries", icon: "truck" },
    { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true },
    { id: "orders", label: "Orders", icon: "clipboard-list" });

  // the batch in focus: the one the address names, else the one asking most of him
  function useFocus(me, screen, all) {
    const s = useStore(); const { route, go } = useRoute();
    const dist = X.distOf(me), js = X.journey(dist, s);
    const ref = route && route.params && route.params.ref;
    const j = ref === "all" && all ? null : js.find(x => x.ref === ref) || js[0] || null;
    const bar = <nav className="dk-focus" aria-label="The batch in focus">{js.map(x => <button key={x.ref} type="button" aria-current={j && j.ref === x.ref ? "true" : undefined} onClick={() => go(screen, { ref: x.ref })}><Product name={x.sku.img} size={26} /><span>{x.sku.name.replace(/ \d.*$/, "")}</span><span className="mono t-caption" style={{ opacity: 0.75 }}>{x.ref}</span>{x.todo.length ? <Badge size="sm" tone="amber">{x.todo.length}</Badge> : null}</button>)}
      {all && <button type="button" aria-current={!j ? "true" : undefined} onClick={() => go(screen, { ref: "all" })}><span className="icontile soft" style={{ width: 26, height: 26, borderRadius: 99 }}><Icon name="boxes" size={14} /></span><span>All batches, past too</span></button>}</nav>;
    return { s, dist, js, j, bar };
  }

  // the run sheet: the batch's moments so far, its next ones, his own marked with their buttons
  const YOURS = { photo: "photo", dispatch: "truck", van: "van" };
  function RunSheet({ j, s }) {
    const { go } = useRoute(); const { toast } = useNotice();
    const run = t => { if (t.act && !t.route) { Flow.act(t.act); toast({ text: `${t.title} · done`, tone: "ok" }); } else go(t.route, t.route === "van" ? { ref: j.ref } : undefined); };
    const items = j.b.hero ? P.storyMoments(s) : [
      { k: "watch", icon: "radar", title: `The Watcher flagged ${X.num(j.units)} packs at risk`, at: "done" },
      { k: "approved", icon: "check", title: `${D.WORKSPACE.short} approved the plan`, at: "done" },
      { k: "outreach", icon: "send", title: "The scheme went to your kiranas", at: "done" },
      { k: "staff", icon: "users", title: "Record the staff sale", ahead: true },
      { k: "pickup", icon: "heart-handshake", title: `${D.JOURNEY.donation.partner} collects ${X.num(X.MF.units)} packs`, ahead: true },
      { k: "van", icon: "route", title: "Your van round delivers the scheme", ahead: true },
    ];
    const todoFor = k => j.todo.find(t => t.id === (YOURS[k] || k));
    return <Card className="stack snug"><div className="card-head"><span className="card-title">The batch's run sheet</span><span className="t-footnote subtle">every step, yours in amber</span></div>
      <div className="dk-run">{items.map((m, i) => { const t = todoFor(m.k); const mine = !!YOURS[m.k] || m.k === "staff";
        return <div key={m.k + i} className={cx(m.ahead && "ahead", mine && (t || m.ahead) && "yours")}><span className="icontile"><Icon name={m.icon} size={17} stroke={2} /></span>
          <div className="stack tight" style={{ gap: 6 }}><b>{m.title}</b>{t && <span><Button variant="primary" size="sm" icon={t.icon} onClick={() => run(t)}>{t.cta}</Button></span>}</div>
          <time>{m.at ? m.at : mine ? "yours" : "next"}</time></div>; })}
        {j.todo.filter(t => t.id === "invoice").map(t => <div key="inv" className="yours"><span className="icontile"><Icon name="receipt" size={17} stroke={2} /></span><div className="stack tight" style={{ gap: 6 }}><b>{t.title}</b><span><Button variant="primary" size="sm" icon="receipt" onClick={() => run(t)}>{t.cta}</Button></span></div><time>yours</time></div>)}
      </div></Card>;
  }

  function Today({ me }) {
    const { go } = useRoute(); const f = useFocus(me, "home");
    const { s, dist, j } = f, perm = s.setup.permission, hero = dist.id === "rakesh";
    const w = j && j.b.hero ? P.storyWhole(s) : null;
    return <Screen me={me} title="Today" sub={`${dist.name} · ${dist.godown}, ${dist.city}`}>
      <div className="stack" style={{ gap: 16 }}>
        {hero && !perm && <S.PermissionCard />}
        {f.bar}
        {!j ? <Card><Empty img="godown" title="No batch in a journey" body={`When the Watcher flags a batch at ${dist.godown}, it opens here, step by step.`} /></Card>
          : <Columns sideWidth={380}
            main={<RunSheet j={j} s={s} />}
            side={<>
              <Card className="stack snug"><X.BatchLine sku={j.sku} id={j.ref} badge={X.stopBadge(j)} sub={`${X.num(j.units)} packs at risk`} size={48} />
                <div className="dk-lines stacked">{j.lines.map(l => <X.LineRow key={l.id} line={l} onOpen={l.route ? () => go(l.route, { ref: j.ref }) : null} />)}</div>
                <Button variant="ghost" size="sm" iconRight="chevron-right" onClick={() => go("batches", { ref: j.ref })}>The batch's page</Button></Card>
              {w && <Card className="stack snug"><div className="card-head"><span className="card-title">You end whole</span><Badge icon="clock">on the plan</Badge></div>
                {w.rows.map(r => <div key={r.k} className="row between t-subhead"><span>{r.k}</span><span className="tnum">{X.inr(r.v)}</span></div>)}
                <div className="hairline" />
                <div className="row between t-subhead"><span>What you paid: {X.num(w.units)} × ₹{w.dp}, the van and the fee</span><span className="tnum" style={{ whiteSpace: "nowrap" }}>{X.inr(-w.paid)}</span></div>
                <div className="row between"><b>Your gain or loss</b><b className="tnum">{X.inr(w.gain)}</b></div></Card>}
            </>} />}
      </div>
    </Screen>;
  }

  function Deliveries({ me }) {
    const f = useFocus(me, "van"); const { s, dist, j } = f;
    const has = id => j && j.lines.some(l => l.id === id);
    return <Screen me={me} title="Deliveries" sub={`${dist.name} · what leaves your godown for the batch in focus`}>
      <div className="stack" style={{ gap: 16 }}>
        {f.bar}
        {!j ? <Card><Empty img="van" title="Nothing goes out" body="While a batch is in a journey, its van round and the buyer's truck show here." /></Card>
          : <Columns sideWidth={380} main={has("kirana") ? <X.VanCard j={j} s={s} /> : <Card><Empty img="van" title="No van round" body="This batch has no kirana scheme." /></Card>}
            side={<>{has("expiresoon") && <X.TruckCard j={j} s={s} />}{has("staff") && <X.StaffCard j={j} />}{has("foodbank") && <X.PickupCard j={j} s={s} />}</>} />}
      </div>
    </Screen>;
  }

  function Orders({ me }) {
    const { go } = useRoute(); const f = useFocus(me, "orders", true); const { s, dist, j } = f;
    const book = X.orderBook(dist, s).filter(b => !j || b.ref === j.ref);
    return <Screen me={me} title="Orders" sub={`${dist.name} · who bought what from ${j ? "the batch in focus" : "each batch"}, on which paper`}>
      <div className="stack" style={{ gap: 16, maxWidth: 960 }}>
        {f.bar}
        {book.length ? book.map(b => <Card key={b.ref} className="stack snug">
          <div className="row between wrap" style={{ gap: 12 }}>
            <X.BatchLine sku={b.sku} id={b.ref} size={44} badge={b.live ? <Badge size="sm" tone="blue" dot live>In a journey · {b.stop}</Badge> : <S.OutcomeBadge o={b.outcome} size="sm" />} sub={b.live ? "orders so far" : `cleared ${X.day(b.cleared)}`} />
            <span className="row tight"><Money value={b.rows.reduce((t, o) => t + o.amount, 0)} size="s" /><Button variant="ghost" size="sm" iconRight="chevron-right" onClick={() => go("batches", { ref: b.ref })}>Papers</Button></span>
          </div>
          <div className="dk-orders">{b.rows.map(o => <X.OrderRow key={o.id} o={o} />)}</div>
        </Card>) : <Card><Empty img="van" title="No orders yet" body="The scheme's orders, the lot and the staff sale of this batch show here as they come in." /></Card>}
      </div>
    </Screen>;
  }

  S.DistHome = Today;
  S.VanRoute = Deliveries;
  S.DistOrders = Orders;
})();

// Option B · One job list. The distributor's day is the jobs Munchly's batches ask of him, so the portal is a list of
// them, each naming its batch (Batches, SC-130, stays as it is):
//   Jobs: what is his now (the label photo, the buyer's truck, the van round, the staff sale, the invoice), then what
//   waits on others (the scheme filling, the lot's buyer, the food bank), then what is done; each job opens its place;
//   Rounds: every van round and truck, dated, coming then past, each with its batch;
//   Orders: one ledger of every order, past and present: date, batch, channel, who, how many, how much, the paper,
//   filtered by batch.
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER, Flow = window.SC3_FLOW, X = window.SCD;
  const { cx, Icon, Badge, Button, Card, Product, Money, Empty, Aura, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle } = S;
  const P = L.partners;

  S.NAV.distributor.splice(0, S.NAV.distributor.length,
    { id: "home", label: "Jobs", icon: "list-checks" }, { id: "batches", label: "Batches", icon: "boxes" },
    { id: "van", label: "Rounds", icon: "truck" },
    { id: "photo", label: "Label photo", short: "Photo", icon: "camera", phoneHidden: true },
    { id: "orders", label: "Orders", icon: "clipboard-list" });

  // a batch named on a job: its pack, its name and its id, small
  const Chip = ({ j }) => <span className="dk-chip"><Product name={j.sku.img} size={20} />{j.sku.name.replace(/ \d.*$/, "")} · <span className="mono">{j.ref}</span></span>;

  // what is done, from the journey's own state
  function doneOf(j, s) {
    if (!j.b.hero) return [];
    const h = s.hero, out = [];
    if (["verified", "valued", "planned", "approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase) || h.photo.status === "verified") out.push({ icon: "camera", title: "Label photo sent", sub: "Vision read the batch, the dates and the MRP", at: "09:19" });
    if (h.award) out.push({ icon: "handshake", title: `${D.BUYER.name} took the lot at ${X.rate(D.COUNTER.price)}`, sub: `token ${X.inr(D.AWARD.token)} paid`, at: "11:09" });
    if (h.orders.length >= D.KIRANAS.length) out.push({ icon: "store", title: `${h.orders.length} shops ordered ${X.num(h.orders.reduce((t, o) => t + o.units, 0))} packets`, sub: "the scheme filled", at: "11:41" });
    if (h.truck.status === "dispatched") out.push({ icon: "truck", title: `Loaded ${D.BUYER.name}'s truck`, sub: `${X.num(X.ES.units)} packs to ${D.BUYER.city}`, at: h.truck.at || "" });
    if (h.van.status === "done") out.push({ icon: "route", title: `Ran the ${D.JOURNEY.van.day} van round`, sub: `${h.van.done} shops`, at: D.JOURNEY.van.date });
    if (h.invoiceIssued) out.push({ icon: "receipt", title: `Issued ${D.INVOICE.no} from Tally`, sub: X.inr(D.INVOICE.total), at: "" });
    return out;
  }

  function Jobs({ me }) {
    const s = useStore(); const { go } = useRoute(); const { toast } = useNotice();
    const dist = X.distOf(me), perm = s.setup.permission, hero = dist.id === "rakesh", js = X.journey(dist, s);
    const now = js.flatMap(j => j.todo.map(t => ({ t, j })));
    const waiting = js.flatMap(j => j.lines.filter(l => !l.done && !j.todo.some(t => (t.id === "van" && l.id === "kirana") || (t.id === "truck" && l.id === "expiresoon") || (t.id === "staff" && l.id === "staff"))).map(l => ({ l, j })));
    const done = js.flatMap(j => doneOf(j, s).map(d => ({ d, j })));
    const run = (t, j) => { if (t.act && !t.route) { Flow.act(t.act); toast({ text: `${t.title} · done`, tone: "ok" }); } else go(t.route, t.route === "van" ? { ref: j.ref } : undefined); };
    return <Screen me={me} title="Jobs" sub={`${dist.name} · what ${D.WORKSPACE.short}'s batches at your godown ask of you`}>
      <div className="stack" style={{ gap: 18, maxWidth: 900 }}>
        {hero && !perm && <S.PermissionCard />}
        <SectionTitle sub={now.length ? "Each names its batch; the first is due first" : "Nothing is asked of you right now"}>Now · {now.length}</SectionTitle>
        {now.length ? <div className="dk-jobs">{now.map(({ t, j }) => <div key={j.ref + t.id} className="dk-job">
          <span className="icontile" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name={t.icon} size={18} stroke={2} /></span>
          <span className="grow stack tight" style={{ gap: 3, minWidth: 0 }}><b className="t-subhead">{t.title}</b><span className="t-footnote muted">{t.sub}</span><Chip j={j} /></span>
          <Button variant="primary" size="sm" icon={t.icon} onClick={() => run(t, j)}>{t.cta}</Button></div>)}</div>
          : <Card><Empty img="godown" title="Nothing for you now" body="When a batch needs your hands (a photo, a truck, the van, an invoice), the job lands here." /></Card>}
        {waiting.length ? <><SectionTitle sub="Moving without you: you are told when it is your turn">Waiting on others · {waiting.length}</SectionTitle>
          <div className="dk-jobs">{waiting.map(({ l, j }) => <div key={j.ref + l.id} className="dk-job"><Aura on className="icontile soft" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name={X.CH[l.id].icon} size={18} /></Aura>
            <span className="grow stack tight" style={{ gap: 3, minWidth: 0 }}><b className="t-subhead">{X.CH[l.id].name}: {l.state}</b><span className="t-footnote muted">{l.plan}</span><Chip j={j} /></span></div>)}</div></> : null}
        {done.length ? <><SectionTitle>Done · {done.length}</SectionTitle>
          <div className="dk-jobs">{done.map(({ d, j }, i) => <div key={j.ref + i} className="dk-job done"><span className="icontile soft" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name="check" size={18} stroke={2.2} /></span>
            <span className="grow stack tight" style={{ gap: 3, minWidth: 0 }}><b className="t-subhead">{d.title}</b><span className="t-footnote">{d.sub}</span><Chip j={j} /></span><span className="t-footnote mono">{d.at}</span></div>)}</div></> : null}
      </div>
    </Screen>;
  }

  /* ---------- Rounds: the van rounds and the trucks, dated ---------- */
  function Rounds({ me }) {
    const s = useStore(); const { route } = useRoute(); const app = useApp();
    const dist = X.distOf(me), js = X.journey(dist, s), h = s.hero;
    const [open, setOpen] = useState(route && route.params && route.params.ref ? route.params.ref + ":van" : null);
    const coming = [];
    js.forEach(j => {
      if (j.b.hero) {
        if (h.truck.status !== "dispatched") coming.push({ key: j.ref + ":truck", when: h.award ? "once the scheme closes" : "once a buyer takes the lot", day: "Next", kind: "Buyer's truck", j, text: `${D.BUYER.name} collects ${X.num(X.ES.units)} packs for ${D.BUYER.city}`, card: <X.TruckCard j={j} s={s} /> });
        if (h.van.status !== "done") coming.push({ key: j.ref + ":van", when: `${D.JOURNEY.van.date.replace(/^\w+ /, "")} · from ${D.JOURNEY.van.leaves}`, day: D.JOURNEY.van.day, kind: "Van round", j, text: `${h.orders.length} shops · ${X.num(h.orders.reduce((t, o) => t + o.units, 0))} packets of the kirana scheme`, card: <X.VanCard j={j} s={s} /> });
      } else {
        const DN = D.JOURNEY.donation;
        coming.push({ key: j.ref + ":pickup", when: `${DN.date.replace(/^\w+ /, "")} · ${DN.time}`, day: DN.day, kind: `${DN.partner} collects`, j, text: `${X.num(X.MF.units)} packs, with the FSSAI checklist`, card: <X.PickupCard j={j} s={s} /> });
        coming.push({ key: j.ref + ":van", when: "once the scheme closes", day: "Next", kind: "Van round", j, text: `${X.num(X.MK.units)} packets on the Hyderabad scheme`, card: <X.VanCard j={j} s={s} /> });
      }
    });
    const past = P.distBatches(dist.id, s).past.flatMap(c => [
      P.stepAt(c, "van") && { at: P.stepAt(c, "van"), kind: "Van round", c, text: `${c.kiranas.length} shops · the kirana scheme` },
      P.stepAt(c, "truck") && { at: P.stepAt(c, "truck"), kind: "Buyer's truck", c, text: `${D.BUYER.name}, ${D.BUYER.city}` },
      P.stepAt(c, "collect") && { at: P.stepAt(c, "collect"), kind: `${c.partner ? c.partner.name : "Food bank"} collected`, c, text: c.receipt ? `receipt ${c.receipt.no}` : "" },
    ].filter(Boolean)).sort((a, z) => (a.at < z.at ? 1 : -1));
    return <Screen me={me} title="Rounds" sub={`${dist.name} · every van round and truck, with its batch`}>
      <div className="stack" style={{ gap: 18, maxWidth: 960 }}>
        <SectionTitle sub="Open one for its map, its stops and its button">Coming · {coming.length}</SectionTitle>
        <Card className="stack" style={{ gap: 0 }}>{coming.map(r => <div key={r.key}>
          <button type="button" className="dk-day" style={{ width: "100%", border: 0, background: "none", font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }} aria-expanded={open === r.key} onClick={() => setOpen(open === r.key ? null : r.key)}>
            <time><b>{r.day}</b>{r.when}</time>
            <span className="row between" style={{ gap: 12 }}><span className="stack tight" style={{ gap: 3 }}><b className="t-subhead">{r.kind}</b><span className="t-footnote muted">{r.text}</span><Chip j={r.j} /></span><Icon name={open === r.key ? "chevron-up" : "chevron-down"} size={18} className="subtle" /></span>
          </button>
          {open === r.key && <div style={{ padding: "0 0 16px" }}>{r.card}</div>}
        </div>)}</Card>
        <SectionTitle sub="From the batches you cleared">Earlier · {past.length}</SectionTitle>
        <Card className="stack" style={{ gap: 0 }}>{past.slice(0, 8).map((r, i) => <div key={i} className="dk-day"><time><b>{X.wday(r.at).split(",")[0].split(" ")[0]}</b>{X.day(r.at)}</time>
          <span className="row" style={{ gap: 12 }}><Product name={r.c.sku.img} size={36} /><span className="stack tight" style={{ gap: 2 }}><b className="t-subhead">{r.kind} · {r.c.sku.name}</b><span className="t-footnote muted"><span className="mono">{r.c.ref}</span> · {r.text}</span></span></span></div>)}</Card>
      </div>
    </Screen>;
  }

  /* ---------- Orders: one ledger ---------- */
  function Orders({ me }) {
    const s = useStore(); const phone = useApp().bp === "phone";
    const dist = X.distOf(me), book = X.orderBook(dist, s);
    const [only, setOnly] = useState(null);
    const rows = book.filter(b => !only || b.ref === only).flatMap(b => b.rows.map(o => ({ o, b }))).sort((a, z) => ((a.o.at || "") < (z.o.at || "") ? 1 : -1));
    const total = rows.reduce((t, r) => t + r.o.amount, 0);
    return <Screen me={me} title="Orders" sub={`${dist.name} · every order from ${D.WORKSPACE.short}'s batches, newest first`}>
      <div className="stack" style={{ gap: 14, maxWidth: 1100 }}>
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="dk-filters" role="group" aria-label="Show the orders of"><button type="button" className="dk-filter" aria-pressed={!only} onClick={() => setOnly(null)}>All batches</button>{book.map(b => <button key={b.ref} type="button" className="dk-filter" aria-pressed={only === b.ref} onClick={() => setOnly(b.ref)}><Product name={b.sku.img} size={18} />{b.sku.name.replace(/ \d.*$/, "")}</button>)}</div>
          <span className="row tight"><span className="t-footnote subtle">{rows.length} orders</span><Money value={total} size="s" /></span>
        </div>
        {phone ? <div className="stack" style={{ gap: 10 }}>{rows.map(({ o, b }, i) => <Card key={i} className="stack tight" style={{ gap: 4 }}><span className="row between"><span className="t-footnote subtle">{o.at ? X.day(o.at) : ""} · {X.CH[o.id].name}</span><b className="tnum">{o.amount ? X.inr(o.amount) : "given"}</b></span><b className="t-subhead">{o.who}</b><span className="t-footnote muted">{o.what}</span><span className="dk-chip"><Product name={b.sku.img} size={20} />{b.sku.name.replace(/ \d.*$/, "")} · <span className="mono">{b.ref}</span></span>{o.paper && <span className="dk-paper"><span className="mono">{o.paper.no}</span>{o.paper.label}</span>}</Card>)}</div>
          : <Card pad={false} style={{ overflow: "hidden" }}><table className="dk-table"><thead><tr><th>Date</th><th>Batch</th><th>Channel</th><th>Bought by</th><th className="dk-n">Packs</th><th className="dk-n">Amount</th><th>Paper</th></tr></thead>
            <tbody>{rows.map(({ o, b }, i) => <tr key={i}><td className="tnum">{o.at ? X.day(o.at) : ""}</td><td><span className="row tight"><Product name={b.sku.img} size={26} /><span className="stack tight" style={{ gap: 0 }}><span>{b.sku.name.replace(/ \d.*$/, "")}</span><span className="mono t-caption subtle">{b.ref}</span></span></span></td>
              <td><span className="row tight"><span className="dk-chan" style={{ "--ch": X.CH[o.id].tone, width: 26, height: 26 }}><Icon name={X.CH[o.id].icon} size={14} stroke={2} /></span>{X.CH[o.id].name}</span></td>
              <td>{o.who}</td><td className="dk-n">{X.num(o.units)}</td><td className="dk-n strong">{o.amount ? X.inr(o.amount) : "given"}</td><td>{o.paper ? <span className="dk-paper"><span className="mono">{o.paper.no}</span>{o.paper.label}</span> : <span className="subtle">—</span>}</td></tr>)}</tbody></table></Card>}
      </div>
    </Screen>;
  }

  S.DistHome = Jobs;
  S.VanRoute = Rounds;
  S.DistOrders = Orders;
})();

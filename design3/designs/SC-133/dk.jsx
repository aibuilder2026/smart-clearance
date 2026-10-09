// The distributor's portal, batch by batch: the pieces every option shares. A distributor's work in the app is Munchly's
// batches at his godown: each batch in a journey has its lines (the kirana scheme and its van round, the ExpireSoon lot
// and the buyer's truck, the staff sale, the food bank's pickup), each line where it stands, and the steps that are his;
// every batch, in a journey or cleared, has its orders: who bought what, for how much, on which paper. Read from
// design3's data (the story's journey in the store, the history's twelve batches in core/ledger.js); every company,
// person and figure is fictional and every figure is money.js's. Loaded after screens/roles.js.
(function () {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER;
  const { cx, Icon, Badge, Button, Product } = K;
  const P = L.partners;
  const fmt = M.fmt;
  const C = D.WORKSPACE.short;
  const num = n => fmt.num(n);
  const inr = n => fmt.inr(n);
  const rate = n => "₹" + n.toFixed(2);
  const r2 = n => Math.round(n * 100) / 100;
  const KL = D.PLAN.lines.find(l => l.id === "kirana"), ES = D.PLAN.lines.find(l => l.id === "expiresoon");
  const MK = D.MANGO_PLAN.lines.find(l => l.id === "kirana"), MS = D.MANGO_PLAN.lines.find(l => l.id === "staff"), MF = D.MANGO_PLAN.lines.find(l => l.id === "foodbank");
  const cartons = (u, per = 24) => { const c = Math.floor(u / per), r = u % per; return r * 2 === per ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? "" : "s"}`; };
  const distOf = me => Object.values(D.DISTRIBUTORS).find(d => d.name === (me && me.org)) || D.DISTRIBUTORS.rakesh;
  const STOP = { "at-risk": "Verify", verified: "Value", valued: "Decide", planned: "Approve", approved: "Execute", executing: "Execute", dispatched: "Settle", settled: "Settle", cleared: "Cleared" };
  const asDate = iso => new Date((iso.length > 10 ? iso : iso + "T00:00") + ":00+05:30");
  const day = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const wday = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const monthOf = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const CH = {
    kirana: { icon: "store", name: "Kirana scheme", tone: "var(--ch-kirana)" },
    expiresoon: { icon: "shopping-bag", name: "ExpireSoon lot", tone: "var(--ch-expiresoon)" },
    staff: { icon: "users", name: "Staff sale", tone: "var(--ch-staff)" },
    foodbank: { icon: "heart-handshake", name: "Food bank", tone: "var(--ch-foodbank)" },
  };

  /* ======================= a batch in a journey ======================= */
  // the chips batch at Rakesh Traders: the story's own, as the store has it
  function chips(b, s) {
    const h = s.hero, sku = D.SKUS[b.sku];
    const units = h.orders.reduce((t, o) => t + o.units, 0), full = h.orders.length >= D.KIRANAS.length;
    const open = !!h.offer && h.offer.status === "sent" && !full;
    const approved = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const van = D.JOURNEY.van;
    const lines = [
      { id: "kirana", plan: `${num(KL.units)} packets to your kiranas at ${rate(KL.packPrice)}, 2 free in every 12`,
        state: !approved ? "goes out once the plan has its yes" : !h.offer ? "goes out with the listing" : h.van.status === "done" ? `delivered on ${van.date}` : full ? `filled · on the ${van.day} round` : `${h.orders.length} of ${D.OFFERED} shops · ${num(units)} packets ordered`,
        done: h.van.status === "done", live: open, route: "van" },
      { id: "expiresoon", plan: `${num(ES.units)} packs on ExpireSoon in your name, the buyer's own truck`,
        state: h.truck.status === "dispatched" ? `collected by ${D.BUYER.name}'s truck` : h.award ? `${D.BUYER.name} took it at ${rate(D.COUNTER.price)} · token ${inr(D.AWARD.token)} paid` : h.listing ? `lot ${h.listing.id} listed at ${rate(ES.price)} · waiting for a buyer` : !approved ? "listed once the plan has its yes" : "listing now",
        done: h.truck.status === "dispatched", live: !!h.listing && !h.award, route: "van" },
    ];
    const todo = [];
    if (h.photo.status === "requested") todo.push({ id: "photo", icon: "camera", title: "Send one photo of the carton label", sub: `Shelf B4 · one carton of ${sku.name}, batch ${b.id}`, cta: "Open camera", route: "photo" });
    if (h.award && !open && h.truck.status !== "dispatched") todo.push({ id: "truck", icon: "truck", title: `Load ${D.BUYER.name}'s truck`, sub: `${num(ES.units)} packs · ${cartons(ES.units)} · the balance has landed`, cta: "Load the truck", route: "van", act: "dispatch" });
    if (full && h.van.status !== "done") todo.push({ id: "van", icon: "route", title: `Run the ${van.day} van round`, sub: `${h.orders.length} shops · ${num(units)} packets · leaves the godown ${van.leaves}`, cta: "Start the round", route: "van", act: "vanRound" });
    if (h.docs && !h.invoiceIssued) todo.push({ id: "invoice", icon: "receipt", title: `Issue ${D.INVOICE.no} from Tally`, sub: `${inr(D.INVOICE.total)} to ${D.BUYER.name}, drafted by the Paperwork agent`, cta: "Issue from Tally", act: "issueInvoice" });
    const waiting = todo.length ? null
      : h.photo.status === "reading" ? "Vision is reading your label photo"
      : !approved ? `${C} is deciding the plan: nothing moves in your name until it says yes`
      : open ? `The scheme is open: ${h.orders.length} of ${D.OFFERED} shops have ordered`
      : h.listing && !h.award ? "The lot waits for a buyer on ExpireSoon"
      : h.phase === "cleared" ? "Settled: you ended whole"
      : "The agents are on it";
    return { ref: b.id, b, sku, dist: D.DISTRIBUTORS[b.distributor], phase: h.phase, stop: STOP[h.phase] || "Detect", flagged: D.DAY0, lines, todo, waiting, units: D.PLAN.units };
  }
  // the Mango Drink at Lakshmi Agencies: the scheme in Hyderabad, the staff sale and Feeding India's pickup (the stub
  // runs this batch's lines as the plan has them)
  function mango(b, s) {
    const sku = D.SKUS[b.sku], dn = s.mango.donation, DN = D.JOURNEY.donation;
    const lines = [
      { id: "kirana", plan: `${num(MK.units)} packets to your kiranas at ${rate(MK.packPrice)}, 2 free in every 12`, state: "the scheme is open: the shops order on the offer", live: true, route: "van" },
      { id: "staff", plan: `${num(MS.units)} packs to your staff at ${rate(MS.price)}, at ${D.DISTRIBUTORS.lakshmi.godown}`, state: "open: record what sold when the sale is over" },
      { id: "foodbank", plan: `${num(MF.units)} packs to ${DN.partner}, collected from your godown`, state: dn === "collected" ? `collected by ${DN.partner}` : dn === "confirmed" ? `${DN.partner} collects ${DN.date}, ${DN.time}` : dn ? "booked · waiting for Feeding India" : "booked with the plan", done: dn === "collected" },
    ];
    const todo = [{ id: "staff", icon: "users", title: "Record the staff sale", sub: `${num(MS.units)} packs at ${rate(MS.price)} · count what sold, once`, cta: "Record what sold", route: "van" }];
    return { ref: b.id, b, sku, dist: D.DISTRIBUTORS[b.distributor], phase: s.mango.phase, stop: STOP[s.mango.phase] || "Execute", flagged: D.DAY0, lines, todo, waiting: null, units: D.MANGO_PLAN.units };
  }
  // a distributor's batches in a journey, the one asking most of him first
  function journey(dist, s) {
    const out = [];
    D.BATCHES.filter(b => b.distributor === dist.id).forEach(b => {
      if (b.hero && s.hero.phase && s.hero.phase !== "watching") out.push(chips(b, s));
      if (b.second && s.mango.phase && s.mango.phase !== "watching") out.push(mango(b, s));
    });
    return out.sort((a, z) => z.todo.length - a.todo.length);
  }

  /* ======================= every order a batch took ======================= */
  const took = (c, id) => c.realised.lines.find(l => l.id === id && l.units > 0) || null;
  const planned = (c, id) => c.plan.lines.find(l => l.id === id && l.units > 0) || null;
  const stepAt = (c, k) => P.stepAt(c, k);
  // a cleared batch's orders: the lot the buyer took, the kiranas' scheme, the staff sale, what went to the food bank
  function ordersOf(c) {
    const out = [], es = took(c, "expiresoon"), kl = took(c, "kirana"), st = took(c, "staff"), fb = took(c, "foodbank");
    const inv = c.docs.find(d => d.id === "invoice" && d.status !== "not required");
    if (es) out.push({ id: "expiresoon", units: es.units, who: `${D.BUYER.name}, ${D.BUYER.city}`, what: `lot ${c.listing.id} · ${num(es.units)} × ${rate(c.award.price)}`, sub: `token ${inr(c.award.token)} · balance ${inr(r2(es.units * c.award.price) - c.award.token)} · collected by the buyer's truck`, amount: r2(es.units * c.award.price), at: stepAt(c, "accept"), paper: inv ? { no: inv.no, label: c.issued ? "issued from Tally" : "drafted" } : null });
    if (kl) out.push({ id: "kirana", units: kl.units, who: `${c.kiranas.length} kiranas`, what: `${num(kl.units)} packets at ${rate(planned(c, "kirana").packPrice)}, 2 free in every 12`, sub: `${c.kirana.ordered < c.kirana.planned ? `of ${num(c.kirana.planned)} offered · ` : ""}delivered on the ${wday(stepAt(c, "van"))} round`, amount: kl.gross, at: stepAt(c, "orders"), shops: c.kiranas.map(k => ({ name: k.name, area: k.area, units: k.units })) });
    if (st) out.push({ id: "staff", units: st.units, who: "Your staff sale", what: `${num(st.units)} packs at ${rate(st.price)}`, sub: `at ${c.dist.godown}`, amount: st.gross, at: stepAt(c, "staff") });
    if (fb) out.push({ id: "foodbank", units: fb.units, who: c.partner.name, what: `${num(fb.units)} packs given`, sub: c.receipt ? `receipt ${c.receipt.no} · a copy in the batch's papers` : "", amount: 0, at: stepAt(c, "collect") });
    return out;
  }
  // the chips batch's orders so far, as the store has them
  function storyOrders(s) {
    const h = s.hero, out = [];
    const units = h.orders.reduce((t, o) => t + o.units, 0);
    if (h.award) out.push({ id: "expiresoon", units: ES.units, who: `${D.BUYER.name}, ${D.BUYER.city}`, what: `lot ${D.JOURNEY.listing.id} · ${num(ES.units)} × ${rate(D.COUNTER.price)}`, sub: `token ${inr(D.AWARD.token)} · balance ${inr(D.AWARD.balance)} · ${h.truck.status === "dispatched" ? "collected by the buyer's truck" : "the buyer's truck collects"}`, amount: D.AWARD.gross, at: `${D.DAY0}T11:09`, paper: h.docs ? { no: D.INVOICE.no, label: h.invoiceIssued ? "issued from Tally" : "drafted · issue it from Tally" } : null });
    if (h.orders.length) out.push({ id: "kirana", units, who: `${h.orders.length} kiranas`, what: `${num(units)} packets at ${rate(KL.packPrice)}, 2 free in every 12`, sub: h.van.status === "done" ? `delivered on the ${D.JOURNEY.van.day} round` : `on the ${D.JOURNEY.van.day} round, ${D.JOURNEY.van.date}`, amount: P.scheme(units, KL.packPrice, D.SKUS.chips.mrp).pay, at: `${D.DAY0}T${h.orders.reduce((t, o) => (o.at > t ? o.at : t), "00:00")}`, shops: h.orders.map(o => { const k = D.KIRANAS.find(x => x.id === o.id) || { name: o.id, area: "" }; return { name: k.name, area: k.area, units: o.units, at: o.at }; }) });
    return out;
  }
  // every batch with its orders: those in a journey first, then those cleared, newest first
  function orderBook(dist, s) {
    const now = journey(dist, s).filter(j => j.b.hero).map(j => ({ ref: j.ref, sku: j.sku, live: true, stop: j.stop, rows: storyOrders(s), date: D.DAY0 }));
    const past = P.distBatches(dist.id, s).past.map(c => ({ ref: c.ref, sku: c.sku, live: false, outcome: c.outcome, cleared: c.cleared, rows: ordersOf(c), date: c.cleared }));
    return now.concat(past).filter(x => x.rows.length);
  }

  /* ======================= shared pieces ======================= */
  // a batch as one line: its pack, its name and id, and where it stands
  function BatchLine({ sku, id, badge, sub, size = 48 }) {
    return <div className="row" style={{ gap: 12, minWidth: 0 }}>
      <Product name={sku.img} size={size} />
      <div className="grow stack tight" style={{ gap: 2, minWidth: 0 }}>
        <span className="row tight wrap" style={{ gap: 8 }}><b className="t-headline">{sku.name}</b>{badge}</span>
        <span className="t-footnote subtle"><span className="mono">{id}</span>{sub ? ` · ${sub}` : ""}</span>
      </div>
    </div>;
  }
  // a line of a batch's plan: the channel, what the plan has, where it stands
  function LineRow({ line, onOpen }) {
    const ch = CH[line.id];
    const inner = <><span className="dk-chan" style={{ "--ch": ch.tone }}><Icon name={ch.icon} size={16} stroke={2} /></span>
      <span className="grow stack tight" style={{ gap: 1, minWidth: 0 }}><b className="t-subhead">{ch.name}</b><span className="t-footnote muted">{line.plan}</span></span>
      <span className={cx("dk-state", line.done && "done", line.live && "live")}>{line.done && <Icon name="check" size={14} stroke={2.4} />}{line.state}</span>
      {onOpen && <Icon name="chevron-right" size={16} className="subtle" />}</>;
    return onOpen ? <button type="button" className="dk-line" onClick={onOpen}>{inner}</button> : <div className="dk-line">{inner}</div>;
  }
  const stopBadge = j => <Badge size="sm" tone={j.todo.length ? "amber" : "blue"} dot live={!j.todo.length}>{j.todo.length ? `${j.todo.length} for you` : j.stop}</Badge>;
  const CHN = CH;


  /* ======================= what leaves the godown, and the orders, as cards ======================= */
  const { useState } = React;
  const { Card, List, ListRow, ClusterMap, HaulLine, useApp, useNotice } = K;
  const W = window.SC3_WORLD, Flow = window.SC3_FLOW;
  const X = { CH, num, inr, rate, cartons, day, ES, MK, MS, MF };
  function VanCard({ j, s }) {
    const { toast } = useNotice(); const app = useApp(); const h = s.hero, story = !!j.b.hero;
    // the batch's own cluster: the story's 31 Nagpur shops, else every shop the distributor's scheme goes to
    const kir = story ? D.KIRANAS : W.KIRANAS.filter(k => k.distributor === j.dist.id).map(k => ({ id: k.id, name: k.name, area: k.area, units: k.sales14 * M.RULES.shopCapTimes }));
    const ordered = story ? h.orders.length : 0, units = story ? h.orders.reduce((t, o) => t + o.units, 0) : X.MK.units;
    const full = story ? ordered >= D.KIRANAS.length : false, done = story && h.van.status === "done";
    const godown = j.dist.godown.replace(/ godown$/, "").replace(/ Market$/, "");
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className="dk-chan" style={{ "--ch": X.CH.kirana.tone }}><Icon name="route" size={16} stroke={2} /></span><span className="card-title">Van round · the kirana scheme</span></span><Badge tone={done ? "green" : undefined} icon={done ? "check" : "calendar"}>{done ? "delivered" : story ? `${D.JOURNEY.van.date} · from ${D.JOURNEY.van.leaves}` : "once the scheme closes"}</Badge></div>
      <div style={{ borderRadius: 14, overflow: "hidden" }}><ClusterMap kiranas={kir} orderedCount={ordered} route={ordered > 0} vanProgress={done ? 1 : 0} height={app.bp === "phone" ? 220 : 300} title={j.dist.cluster} total={story ? D.OFFERED : kir.length} godown={godown} /></div>
      {story ? <div className="row wrap" style={{ gap: 24 }}>
        <div className="stack tight" style={{ gap: 0 }}><span className="num m">{ordered}<span className="subtle" style={{ fontSize: "0.45em" }}> / {D.OFFERED}</span></span><span className="t-footnote subtle">shops on the round</span></div>
        <div className="stack tight" style={{ gap: 0 }}><span className="num m">{X.num(units)}</span><span className="t-footnote subtle">packets · {X.cartons(units)}</span></div>
      </div> : <div className="row wrap" style={{ gap: 24 }}>
        <div className="stack tight" style={{ gap: 0 }}><span className="num m">{kir.length}</span><span className="t-footnote subtle">shops offered the scheme</span></div>
        <div className="stack tight" style={{ gap: 0 }}><span className="num m">{X.num(units)}</span><span className="t-footnote subtle">packets on the scheme · {X.cartons(units)}</span></div>
      </div>}
      {!done && <Button variant="primary" size="lg" icon="navigation" disabled={!full} onClick={() => { Flow.act("vanRound"); toast({ text: `Round done · ${ordered} shops`, tone: "ok" }); }}>{full ? "Start the round" : story ? `Waiting for orders · ${ordered} of ${D.OFFERED}` : "Starts once the scheme closes"}</Button>}
      <span className="t-caption subtle">₹{M.RULES.vanPerUnit.toFixed(2)} a packet for the van, repaid by {D.WORKSPACE.short} in the price support.</span>
    </Card>;
  }
  function TruckCard({ j, s }) {
    const { toast } = useNotice(); const h = s.hero;
    const full = h.orders.length >= D.KIRANAS.length, open = !!h.offer && h.offer.status === "sent" && !full;
    const gone = h.truck.status === "dispatched";
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className="dk-chan" style={{ "--ch": X.CH.expiresoon.tone }}><Icon name="truck" size={16} stroke={2} /></span><span className="card-title">The buyer's truck · ExpireSoon</span></span><Badge tone={gone ? "blue" : h.award ? "green" : "violet"}>{gone ? "collected" : h.award ? "sold" : h.listing ? "listed" : "not listed yet"}</Badge></div>
      <HaulLine progress={gone ? 0.55 : 0} />
      <List>{[["Lot", `${D.JOURNEY.listing.id} · ${X.num(X.ES.units)} packs · ${X.cartons(X.ES.units)}`], ["Price", h.award ? `${X.rate(D.COUNTER.price)} a pack, the counter he took` : `${X.rate(X.ES.price)} asked`], ["Token", h.award ? `${X.inr(D.AWARD.token)} received` : "paid when a buyer takes it"], ["Balance", h.award ? `${X.inr(D.AWARD.balance)} before loading` : "—"]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>
      {!gone && <Button variant="primary" size="lg" icon="truck" disabled={!h.award || open} onClick={() => { Flow.act("dispatch"); toast({ text: "Loaded · the invoice draft is next", tone: "ok" }); }}>{!h.award ? "Load once a buyer takes the lot" : open ? "Load once the scheme closes" : "Load the buyer's truck"}</Button>}
    </Card>;
  }
  function StaffCard({ j }) {
    return <Card className="stack snug"><div className="card-head"><span className="row tight"><span className="dk-chan" style={{ "--ch": X.CH.staff.tone }}><Icon name="users" size={16} stroke={2} /></span><span className="card-title">Staff sale · at your godown</span></span><Badge>open</Badge></div>
      <span className="t-subhead">{X.num(X.MS.units)} packs at {X.rate(X.MS.price)}, sold to your staff at {j.dist.godown}. Count what sold, once, when the sale is over.</span>
      <Button variant="primary" icon="check">Record what sold</Button></Card>;
  }
  function PickupCard({ j, s }) {
    const DN = D.JOURNEY.donation, d = s.mango.donation;
    return <Card className="stack snug"><div className="card-head"><span className="row tight"><span className="dk-chan" style={{ "--ch": X.CH.foodbank.tone }}><Icon name="heart-handshake" size={16} stroke={2} /></span><span className="card-title">{DN.partner} collects</span></span><Badge tone={d === "collected" ? "green" : undefined} icon={d === "collected" ? "check" : "calendar"}>{d === "collected" ? "collected" : `${DN.date} · ${DN.time}`}</Badge></div>
      <span className="t-subhead">{X.num(X.MF.units)} packs from {j.dist.godown}, with the FSSAI checklist. Their volunteers collect; nothing goes on your van.</span></Card>;
  }
  function OrderRow({ o }) {
    const [open, setOpen] = useState(false); const ch = X.CH[o.id];
    return <div className="dk-order">
      <span className="dk-chan" style={{ "--ch": ch.tone }}><Icon name={ch.icon} size={16} stroke={2} /></span>
      <span className="grow stack tight" style={{ gap: 2, minWidth: 0 }}>
        <span className="t-subhead"><b>{o.who}</b> · {o.what}</span>
        <span className="t-footnote muted">{ch.name}{o.at ? ` · ${o.at.length > 10 ? X.day(o.at) + ", " + o.at.slice(11, 16) : X.day(o.at)}` : ""}{o.sub ? ` · ${o.sub}` : ""}</span>
        {o.paper && <span className="dk-paper"><Icon name="file-text" size={13} /><span className="mono">{o.paper.no}</span>{o.paper.label}</span>}
        {o.shops && <button type="button" className="pt-link t-footnote" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"} the {o.shops.length} shops' orders</button>}
        {open && <div className="dk-shops">{o.shops.map(k => <span key={k.name}><b>{k.name}</b><em>{k.area}</em><span className="tnum">{k.units}</span></span>)}</div>}
      </span>
      <span className="tnum strong">{o.amount ? X.inr(o.amount) : "given"}</span>
    </div>;
  }

  window.SCD = { VanCard, TruckCard, StaffCard, PickupCard, OrderRow, distOf, journey, orderBook, ordersOf, storyOrders, BatchLine, LineRow, stopBadge, CH: CHN, cartons, rate, num, inr, day, wday, monthOf, KL, ES, MK, MS, MF };
})();

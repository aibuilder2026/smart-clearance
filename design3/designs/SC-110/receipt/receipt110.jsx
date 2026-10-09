// SC-110's options: the food bank's donation receipt, as a paper, per food bank. The Mango Drink (MF-2410-118):
// 58 packs to Feeding India from Lakshmi Agencies' Begum Bazaar godown, the story's donation (data.js MANGO_FB,
// JOURNEY.donation). Feeding India issues an in-app receipt; India FoodBanking Network a donation acknowledgement
// (CSR / 80G, indicative), shown with the same figures for comparison (it needs 21+ days and 100+ units, so it is
// illustrative here).
//   ?opt=a|b|c                which option
//   ?view=paper|meera|open|desk the receipt alone, Meera's Pickups, the receipt opened there, or the desk view
//                             (Anita's Paperwork for A and B, Vikram's Finance & ESG for C)
//   ?bank=fi|ifbn             which food bank's paper
(function () {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, ThemeProvider, AppRoot, Mark, Product, VTracker, DocCard, Money } = K;
  const q = new URLSearchParams(location.search);
  const OPT = q.get("opt") || "a", VIEW = q.get("view") || "paper", BANK = q.get("bank") || "fi";

  // the story's donation, every figure from money.js and data.js
  const batch = D.BATCHES.find(b => b.id === "MF-2410-118"), sku = D.SKUS[batch.sku], dist = D.DISTRIBUTORS[batch.distributor];
  const n = D.MANGO_FB, DN = D.JOURNEY.donation, C = D.CLIENT;
  const wo = M.writeOff(n, sku);
  const meals = D.MANGO_PLAN.meals;
  const bb = fmt.date(batch.bestBefore);

  // each food bank's own paper (data.js SETUP.partners: Feeding India "In-app receipt", India FoodBanking Network
  // "Donation acknowledgement (CSR / 80G, indicative)"); the numbers are fictional
  const BANKS = {
    fi: {
      name: "Feeding India", kind: "In-app receipt", title: "Donation receipt", stamp: "RECEIVED", no: "FI/HYD/26-27/0417",
      by: "Meera, city lead", at: `${DN.date}, ${DN.time}`, where: `${dist.godown}, ${dist.city}`, to: DN.spot,
      note: `Issued in the app by Feeding India when the packs were collected. Munchly's evidence for BRSR Principle 6; not a tax certificate. The FSSAI surplus-food checklist travels with it.`,
    },
    ifbn: {
      name: "India FoodBanking Network", kind: "Donation acknowledgement (CSR / 80G, indicative)", title: "Donation acknowledgement", stamp: "ACKNOWLEDGED", no: "IFBN/ACK/26-27/0112",
      by: "Warehouse lead, Hyderabad", at: `${DN.date}, ${DN.time}`, where: `${dist.godown}, ${dist.city}`, to: "the member warehouse, Hyderabad",
      note: "An acknowledgement for the donor's CSR records (indicative). Section 80G applies to gifts of money, so this is not a tax certificate.",
    },
  };
  const B = BANKS[BANK];

  /* ---------- the paper ---------- */
  const Line = ({ k, v, strong, sub }) => <div className="pp-line"><span>{k}{sub && <em> {sub}</em>}</span><span className={strong ? "pp-strong" : ""}>{v}</span></div>;
  const head = (title, no, right) => <div className="pp-head"><div><div className="pp-title">{title}</div><div className="pp-no">{no}</div></div>{right}</div>;
  function Receipt({ b = B, inner }) {
    const body = <>
      <div className="pp-parties">
        <div><em>Donor</em><b>{C.name}</b><span>through {dist.name}, {b.where}</span><span className="pp-mono">FSSAI {C.fssai}</span></div>
        <div><em>Received by</em><b>{b.name}</b><span>{dist.city}{BANK === "ifbn" && b === BANKS.ifbn ? " · illustrative" : ""}</span><span className="pp-mono">{b.kind}</span></div>
      </div>
      <table className="pp-table"><thead><tr><th>Goods</th><th>Packs</th><th>Weight</th></tr></thead><tbody><tr>
        <td>{sku.name}<br /><em>Batch {batch.id} · best before {bb}</em></td><td>{fmt.num(n)}</td><td>{fmt.kg(wo.kg)}</td></tr></tbody></table>
      <Line k="Collected" sub={b.by} v={b.at} />
      <Line k="Served at" v={b.to} />
      <Line k="Meals" sub="a pack a meal, indicative" v={fmt.num(meals)} />
      {b === BANKS.ifbn && <><div className="pp-sub">For the donor's CSR records</div><Line k="Value at Munchly's cost" sub={`${fmt.num(n)} × ₹${sku.cost}, indicative`} v={fmt.inr2(wo.stock)} /><Line k="CSR activity" v="Schedule VII (i), hunger" /></>}
      <p className="pp-note">{b.note}</p>
    </>;
    if (inner) return body;
    return <div className="paper pp">{head(b.title, `${b.no} · ${b.kind === "In-app receipt" ? "in-app" : "acknowledgement"} · ${DN.date}`, <span className="pp-stamp ok">{b.stamp}</span>)}{body}</div>;
  }
  const CHECKS = ["Sealed, undamaged packs", `Best before ${bb}, 18 days left`, "Ambient storage, away from sunlight", `Batch ${batch.id} on every carton`, `Donor: ${C.short} via ${dist.name}`];
  // option B: one donation paper, the donor's checklist and the food bank's receipt on one page
  function Handover({ received = true }) {
    return <div className="paper pp">
      {head("Surplus-food handover", `${received ? B.no : "awaiting collection"} · ${C.short} → ${B.name}`, <span className={cx("pp-stamp", received && "ok")}>{received ? B.stamp : "BOOKED"}</span>)}
      <div className="pp-sub">The donor's FSSAI checklist</div>
      {CHECKS.map(c => <div key={c} className="pp-line"><span className="row tight"><Icon name="square-check" size={14} />{c}</span><span /></div>)}
      <div className="pp-sub">{received ? `${B.name}'s ${B.kind === "In-app receipt" ? "receipt" : "acknowledgement"}` : `${B.name} signs here on collection`}</div>
      {received ? <Receipt inner /> : <p className="pp-note">The bottom half fills in when {B.name} marks the packs collected.</p>}
    </div>;
  }

  /* ---------- Meera's Pickups, after the collection ---------- */
  const tracker = <VTracker items={[{ id: "req", title: "Requested by the donation agent", time: DN.asked }, { id: "conf", title: "Confirmed by Meera", time: DN.confirmed }, { id: "col", title: `Collected from ${DN.from}`, time: DN.collected }, { id: "srv", title: `Served at ${DN.spot}`, time: "this week" }]} current={3} done={3} />;
  function PickupCard() {
    return <Card className="stack snug">
      <div className="card-head"><span className="card-title">Pickup</span><Badge tone="green" icon="check">collected</Badge></div>
      {tracker}
      {OPT === "a" && <button type="button" className="row interactive" style={{ gap: 12, padding: "12px 14px", borderRadius: 14, background: "var(--primary-soft)", border: 0, textAlign: "left", color: "inherit", font: "inherit", width: "100%", cursor: "pointer" }}>
        <Icon name="receipt" size={20} /><span className="grow"><b>{B.title} {B.no}</b><div className="t-footnote">{fmt.num(n)} drinks served · shared with {C.short} for its BRSR table</div></span><span className="row tight t-subhead strong" style={{ color: "var(--primary-text)" }}>View<Icon name="chevron-right" size={16} /></span></button>}
      {OPT === "b" && <div className="row" style={{ gap: 12, padding: "12px 14px", borderRadius: 14, background: "var(--primary-soft)" }}><Icon name="clipboard-check" size={20} /><span className="grow"><b>Handover signed · {B.no}</b><div className="t-footnote">Your receipt is on the handover beside: {fmt.num(n)} drinks served</div></span></div>}
      {OPT === "c" && <div className="row" style={{ gap: 12, padding: "12px 14px", borderRadius: 14, background: "var(--primary-soft)" }}><Icon name="receipt" size={20} /><span className="grow"><b>Receipt {B.no} in your register</b><div className="t-footnote">{fmt.num(n)} drinks served · shared with {C.short} for its BRSR table</div></span></div>}
    </Card>;
  }
  // option C: Meera's own register of receipts
  const REGISTER = [
    { no: B.no, date: DN.date, brand: C.short, batch: batch.id, goods: sku.name, packs: n, real: true },
    { no: "FI/HYD/26-27/0398", date: "Wed 30 Sep", brand: "Another brand", batch: "illustrative", goods: "Biscuits 200 g", packs: 120 },
    { no: "FI/HYD/26-27/0371", date: "Mon 21 Sep", brand: "Another brand", batch: "illustrative", goods: "Instant oats 500 g", packs: 64 },
  ];
  function Register({ desk }) {
    return <Card className="stack snug">
      <div className="card-head"><span className="card-title">{desk ? "Donation receipts" : "Your receipts"}</span><Badge>{desk ? "this quarter" : `${REGISTER.length} this month`}</Badge></div>
      <List>{REGISTER.map(r => <ListRow key={r.no} title={desk ? `${r.date} · ${B.name}` : `${r.date} · ${r.brand}`} sub={`${r.goods} · ${r.batch} · ${r.no}`} value={<span className="row tight"><span className="tnum strong">{fmt.num(r.packs)}</span><Icon name="chevron-right" size={16} /></span>} />)}</List>
      {desk && <span className="t-footnote muted">The receipts behind the quarter's donated kilos, each with its PDF. Two rows are illustrative; the Mango Drink's is the story's.</span>}
    </Card>;
  }
  function Meera() {
    const app = K.useApp(); const phone = app.bp === "phone";
    const side = OPT === "b" ? <div className="stack" style={{ gap: 10 }}><span className="t-headline">Surplus-food handover</span><Handover /></div>
      : <div className="stack" style={{ gap: 10 }}><span className="t-headline">FSSAI surplus-food checklist</span><Card className="paper stack tight" style={{ padding: 18 }}>{CHECKS.map(c => <span key={c} className="row tight t-subhead"><Icon name="square-check" size={16} />{c}</span>)}</Card></div>;
    return <div className="stack" style={{ gap: 18 }}>
      <div className="stack tight" style={{ gap: 2 }}><span className="t-caption subtle">Meera · {B.name === "Feeding India" ? "Feeding India" : B.name} · Pickups</span><span className="t-title1" style={{ fontFamily: "var(--font-display)", fontWeight: 760 }}>Pickups</span></div>
      <div className={cx("s110-cols", phone && "one")}>
        <div className="stack" style={{ gap: 16 }}>
          <Card className="row" style={{ gap: 16, padding: 20 }}><Product name="pack-mango" size={phone ? 72 : 92} float /><div className="stack tight" style={{ gap: 4 }}><div className="t-title2">{fmt.num(n)} packs of Mango Drink</div><span className="t-footnote muted">{dist.name} · {DN.from} · {DN.date}</span></div></Card>
          <PickupCard />
          {OPT === "c" && <Register />}
        </div>
        {side}
      </div>
    </div>;
  }
  function Opened() {
    // the receipt as Meera opens it: a sheet on a phone, the panel on a desktop
    return <div className="stack" style={{ gap: 12 }}>
      <div className="row between"><span className="t-headline">{B.title}</span><Button variant="secondary" size="sm" icon="download">PDF</Button></div>
      {OPT === "b" ? <Handover /> : <Receipt />}
      <span className="t-footnote muted">{OPT === "c" ? "Opened from your register; Munchly reads the same receipt in its donation register." : `The same paper is in ${C.short}' document pack for ${batch.id}.`}</span>
    </div>;
  }

  /* ---------- the desk: Anita's Paperwork (A, B), Vikram's Finance & ESG (C) ---------- */
  const PACK = [
    { id: "support", type: "Price-support credit note", no: "CN/0118", owner: C.short, status: "generated", amount: 6338 },
    { id: "itc", type: "GST ITC memo", no: "s.17(5)(h)", owner: C.short, status: "generated", amount: 837 },
  ];
  function Desk() {
    if (OPT === "c") return <div className="stack" style={{ gap: 18 }}>
      <div className="stack tight" style={{ gap: 2 }}><span className="t-caption subtle">Vikram · Finance &amp; ESG · Quarter</span><span className="t-title1" style={{ fontFamily: "var(--font-display)", fontWeight: 760 }}>Finance &amp; ESG</span></div>
      <div className="s110-cols"><div className="stack" style={{ gap: 16 }}>
        <Card className="stack snug"><div className="card-head"><span className="card-title">BRSR Core</span><Button variant="secondary" size="sm" icon="download">Export BRSR table</Button></div>
          <span className="t-footnote">Food waste: packaged food past quick-commerce gates · donated kilos evidenced by the food banks' receipts below.</span></Card>
        <Register desk />
      </div><div className="stack" style={{ gap: 10 }}><span className="t-headline">{B.title} · {B.no}</span><Receipt /></div></div>
    </div>;
    const docs = OPT === "a"
      ? [...PACK, { id: "fssai", type: "FSSAI surplus-food checklist", no: `${n} units`, owner: C.short, status: "generated" }, { id: "receipt", type: B.title, no: B.no, owner: B.name, status: "generated", note: `${fmt.num(n)} packs received · ${fmt.num(meals)} meals` }, { id: "destruction", type: "Destruction certificate", no: "0 units left", owner: C.short, status: "not required" }]
      : [...PACK, { id: "fssai", type: "Surplus-food handover", no: B.no, owner: `${C.short} → ${B.name}`, status: "generated", note: `${fmt.num(n)} packs received` }, { id: "destruction", type: "Destruction certificate", no: "0 units left", owner: C.short, status: "not required" }];
    return <div className="stack" style={{ gap: 18 }}>
      <div className="stack tight" style={{ gap: 2 }}><span className="t-caption subtle">Anita · Paperwork · {batch.id}</span><span className="t-title1" style={{ fontFamily: "var(--font-display)", fontWeight: 760 }}>Paperwork</span><span className="t-footnote muted">{batch.id} · prepared by the Paperwork agent once every line was done</span></div>
      <div className="s110-cols"><div className="stack" style={{ gap: 12 }}>
        <span className="t-headline">Document pack</span>
        <div className="docgrid">{docs.map(d => <div key={d.id} className={cx("docpick", (d.id === "receipt" || (OPT === "b" && d.id === "fssai")) && "on")}><DocCard doc={d} onOpen={() => {}} /></div>)}</div>
        <span className="t-footnote muted">Evidence for the BRSR line: 52 kirana order logs · CN/0118 · {OPT === "a" ? `FSSAI checklist · ${B.no}` : `handover ${B.no}`}</span>
      </div><div className="stack" style={{ gap: 10 }}><span className="t-headline">{OPT === "a" ? B.title : "Surplus-food handover"}</span><span className="t-footnote subtle">Issued by {B.name}</span>{OPT === "a" ? <Receipt /> : <Handover />}</div></div>
    </div>;
  }

  function Page() {
    const view = { paper: () => <div style={{ maxWidth: 560 }}>{OPT === "b" ? <Handover /> : <Receipt />}</div>, meera: Meera, open: Opened, desk: Desk }[VIEW] || Meera;
    return <div className={cx("s110", "v-" + VIEW)}>{view()}</div>;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<ThemeProvider><AppRoot scroll="window"><Page /></AppRoot></ThemeProvider>);
})();

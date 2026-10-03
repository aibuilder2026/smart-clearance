// Smart-Clearance app v2 · finance (documents, ledger, GST) and sustainability (impact, BRSR, evidence)
(function () {
  const { useState } = React;
  const { motion } = Motion;
  const K = window.SC2; const A = window.SC_APP;
  const { Icon, Btn, Chip, Plate, Sheet, TopBar, RunHead, Empty, LiveTile, inr, num, inrDec, cx } = K;
  const { useDB, DataTable, Toolbar, Pills, PageHead, StatusChip, KV, ConfirmSheet, ago, when, exportCSV } = A;
  const DB = window.DB, Bus = window.Bus, Auth = window.Auth;
  const Bar = ({ user, nav, title, back, onBack, runhead }) => <TopBar title={title} back={back} onBack={onBack} runhead={runhead} unread={DB.list("notifications", { where: { user: user.id, read: false } }).length} onBell={() => nav("notifications")}><A.UserMenu user={user} onProfile={() => nav("profile")} onSignOut={() => Auth.signOut()} /></TopBar>;

  function Paper({ d }) {
    const b = DB.get("batches", d.batch) || {}; const p = DB.product(b.product) || {}; const org = DB.org(b.org) || {};
    if (d.type === "invoice") return <div className="paper"><h3>Tax invoice · {d.id}</h3><div className="row between wrap t-small"><span><b>{org.name}</b><br />{org.godown}, {org.city}<br />GSTIN {org.gstin}</span><span><b>Sri Venkateswara Traders</b><br />Begum Bazaar, Hyderabad 500012<br />GSTIN 36AAACS9876K1Z2</span></div><table><thead><tr><th>Item</th><th>HSN</th><th className="n">Qty</th><th className="n">Rate</th><th className="n">Amount</th></tr></thead><tbody><tr><td>{p.name}, batch {b.id}, BB {b.bestBefore}</td><td>{p.hsn}</td><td className="n">772</td><td className="n">14.20</td><td className="n">10,962.40</td></tr><tr><td colSpan="4">IGST {p.gst}% (inter-state)</td><td className="n">1,315.49</td></tr><tr><td colSpan="4"><b>Total</b></td><td className="n"><b>{num(d.total)}.89</b></td></tr></tbody></table><p className="t-small" style={{ marginTop: 8, color: "#5a5347" }}>E-way bill not required: consignment under ₹50,000. Token received; balance before dispatch.</p></div>;
    if (d.type === "itc_memo") return <div className="paper"><h3>GST input credit memo · indicative</h3><p>Batch {b.id}: packets sold through the marketplace and the kirana scheme. No goods were destroyed, written off or disposed of; CGST Act s.17(5)(h) reversal does not apply.</p><table><tbody><tr><td>Input credit on stock</td><td className="n">{num(d.total)}.00</td></tr><tr><td>Reversal required in GSTR-3B</td><td className="n">0.00</td></tr></tbody></table><p className="t-small" style={{ marginTop: 8, color: "#5a5347" }}>Indicative treatment based on Circular 72/46/2018; confirm with the company's GST adviser.</p></div>;
    if (d.type === "credit_note") return <div className="paper"><h3>Credit note · {d.id}</h3><p>Munchly Foods → {org.name}</p><p>Shop scheme: free packets × {inr(p.cost)} against the batch invoice · GST adjusted</p><p style={{ marginTop: 8 }}><b>{inr(d.total)}</b></p></div>;
    if (d.type === "eway") return <div className="paper"><h3>E-way bill check · {d.batch}</h3><p>Consignment value under the ₹50,000 inter-state threshold. Transporter note filed.</p><p style={{ marginTop: 8 }}><b>Not required</b></p></div>;
    return <div className="paper"><h3>{d.title} · {d.id}</h3><p>{p.name} · {b.id}</p><p>Packed food, {b.daysLeft} days to date · cold chain not required · pickup booked.</p><p style={{ marginTop: 8 }}><b>Attached</b></p></div>;
  }
  function Documents({ user, nav, id }) {
    const v = useDB(); const [q, setQ] = useState(""); const [type, setType] = useState("all"); const [busy, setBusy] = useState(null); const { toast } = K.useToasts();
    const rows = DB.list("documents", { search: q, sort: ["at", "desc"] }).filter(d => type === "all" || d.type === type);
    const pending = DB.list("batches", { where: { status: "settling" } });
    const open = id ? DB.get("documents", decodeURIComponent(id)) : null;
    const prep = b => { setBusy(b.id); setTimeout(() => { Bus.publish("documents.ready", { batch: b.id, by: user.id }); setBusy(null); }, 1500); };
    return <><Bar user={user} nav={nav} title="Documents" runhead={<RunHead parts={[{ b: String(rows.length), t: "documents" }, { b: String(pending.length), t: "packs to prepare", hot: pending.length > 0 }]} />} />
      <div className="page"><PageHead title="Documents" sub="Invoices, credit notes, e-way bill checks, ITC memos and FSSAI checklists, drafted by the Paperwork agent." actions={<Btn icon="download" onClick={() => exportCSV(rows.map(d => ({ id: d.id, type: d.type, batch: d.batch, total: d.total, status: d.status, at: d.at })), "documents.csv")}>Export</Btn>} />
        {pending.map(b => <Plate key={b.id} tone="chrome-soft"><div className="row wrap"><div className="grow"><b>Cartons dispatched for {b.id}. Prepare the document pack?</b><p className="t-small muted">Invoice to the buyer, credit note for the shop scheme, e-way bill check, GST memo.</p></div><Btn kind="primary" icon="file" loading={busy === b.id} onClick={() => prep(b)}>Prepare the pack</Btn></div></Plate>)}
        <Toolbar search={q} onSearch={setQ} placeholder="Number, batch" count={rows.length}><Pills options={[{ id: "all", label: "All" }, { id: "invoice", label: "Invoices" }, { id: "credit_note", label: "Credit notes" }, { id: "itc_memo", label: "ITC memos" }, { id: "eway", label: "E-way" }, { id: "fssai", label: "FSSAI" }]} value={type} onChange={setType} /></Toolbar>
        <DataTable rows={rows} onRow={d => nav("documents/" + encodeURIComponent(d.id))} columns={[{ key: "id", label: "Number", render: d => <b className="mono">{d.id}</b> }, { key: "title", label: "Type" }, { key: "batch", label: "Batch", render: d => <span className="mono">{d.batch}</span> }, { key: "total", label: "Amount", n: true, render: d => d.total ? inr(d.total) : "—" }, { key: "status", label: "Status", render: d => <StatusChip status={d.status} /> }, { key: "at", label: "Issued", render: d => <span className="t-xs muted mono">{ago(d.at)}</span> }]} />
      </div>
      <Sheet open={!!open} onClose={() => nav("documents")} title={open ? open.title : ""} footer={open && <div className="row wrap"><Btn icon="download" onClick={() => toast({ title: "PDF downloaded", body: open.id, tone: "ok", icon: "check" })}>Download PDF</Btn><Btn kind="ghost" icon="send" onClick={() => { toast({ title: "Sent to the counterparty", body: open.id, tone: "ok", icon: "check" }); DB.audit(user.id, "sent document", open.id); }}>Send</Btn></div>}>{open && <Paper d={open} />}</Sheet>
    </>;
  }
  function Ledger({ user, nav }) {
    const v = useDB(); const led = DB.list("ledger", { sort: ["closedAt", "desc"] });
    const tot = led.reduce((t, l) => ({ recovered: t.recovered + l.recovered, itc: t.itc + l.itc, kg: t.kg + l.kg, avoided: t.avoided + l.writeoffAvoided }), { recovered: 0, itc: 0, kg: 0, avoided: 0 });
    return <><Bar user={user} nav={nav} title="Ledger" runhead={<RunHead parts={[{ b: "Q3 FY27" }, { b: inr(tot.recovered), t: "recovered" }, { b: inr(tot.itc), t: "ITC kept" }]} />} />
      <div className="page"><PageHead title="Finance ledger" sub="The money reading of every routed batch: recovered, write-off avoided, credit retained, charges avoided." actions={<Btn icon="download" onClick={() => exportCSV(led.map(l => ({ batch: l.batch, recovered: l.recovered, writeoffAvoided: l.writeoffAvoided, itc: l.itc, disposalAvoided: l.disposalAvoided, closed: l.closedAt })), "finance-ledger.csv")}>Export</Btn>} />
        <div className="detail"><div className="main-col">
          <div className="tilerow"><LiveTile value={inr(tot.recovered)} label="recovered" tone="emerald" /><LiveTile value={inr(tot.avoided)} label="write-off avoided" /><LiveTile value={inr(tot.itc)} label="GST credit kept" tone="ultra" /></div>
          <DataTable rows={led} onRow={l => nav("batches/" + l.batch)} columns={[{ key: "batch", label: "Batch", render: l => <b className="mono">{l.batch}</b> }, { key: "recovered", label: "Recovered", n: true, render: l => inr(l.recovered) }, { key: "writeoffAvoided", label: "Write-off avoided", n: true, render: l => inr(l.writeoffAvoided) }, { key: "itc", label: "ITC kept", n: true, render: l => inr(l.itc) }, { key: "disposalAvoided", label: "Charges avoided", n: true, render: l => inr(l.disposalAvoided) }, { key: "closedAt", label: "Closed", render: l => l.closedAt ? <span className="t-xs muted mono">{ago(l.closedAt)}</span> : <Chip tone="chrome">open</Chip> }]} />
        </div><aside className="aside"><Plate className="stack-sm"><h3>Quarter so far</h3><div className="hbar"><span>Recovered</span><motion.i className="m" initial={{ width: 0 }} animate={{ width: "86%" }} transition={{ duration: 1 }} /><b>₹6.3 L</b></div><div className="hbar"><span>GST credit kept</span><motion.i className="m" initial={{ width: 0 }} animate={{ width: "30%" }} transition={{ duration: 1, delay: 0.1 }} /><b>₹79 k</b></div><div className="hbar"><span>Waste avoided</span><motion.i initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ duration: 1, delay: 0.2 }} /><b>5.7 t</b></div><p className="t-xs muted">23 batches routed · net of costs · ITC indicative</p></Plate></aside></div>
      </div></>;
  }
  function GST({ user, nav }) {
    const v = useDB(); const memos = DB.list("documents", { where: { type: "itc_memo" }, sort: ["at", "desc"] }); const kept = memos.reduce((t, d) => t + d.total, 0);
    const reversed = DB.list("batches", { where: { status: "written_off" } }).reduce((t, b) => t + Math.round(b.packets * (DB.product(b.product) || {}).cost * (DB.product(b.product) || {}).gst / 100), 0);
    return <><Bar user={user} nav={nav} title="GST" />
      <div className="page"><PageHead title="GST input credit" sub="Stock that is sold keeps its credit; stock that is destroyed reverses it under s.17(5)(h). Indicative, for the GST adviser." />
        <div className="tilerow"><LiveTile value={inr(kept)} label="credit kept" tone="emerald" /><LiveTile value={inr(reversed)} label="reversed on write-offs" tone="vermilion" /><LiveTile value={String(memos.length)} label="ITC memos" /></div>
        <DataTable rows={memos} onRow={d => nav("documents/" + encodeURIComponent(d.id))} columns={[{ key: "id", label: "Memo", render: d => <b className="mono">{d.id}</b> }, { key: "batch", label: "Batch", render: d => <span className="mono">{d.batch}</span> }, { key: "total", label: "Credit kept", n: true, render: d => inr(d.total) }, { key: "status", label: "Status", render: d => <StatusChip status={d.status} /> }, { key: "at", label: "Issued", render: d => <span className="t-xs muted mono">{ago(d.at)}</span> }]} empty={<Empty icon="percent" title="No ITC memos yet" />} />
        <Plate tone="emerald-soft" className="t-small"><b>GSTR-3B reconciliation</b><p className="muted">Each memo carries the batch, the packets sold and the invoice numbers, so the reversal line in 3B can stay at zero with evidence behind it.</p></Plate>
      </div></>;
  }
  function Impact({ user, nav }) {
    const v = useDB(); const led = DB.list("ledger", { sort: ["closedAt", "desc"] }); const settled = DB.list("batches", { where: { status: "settled" } }); const [busy, setBusy] = useState(null);
    const tot = led.reduce((t, l) => ({ kg: t.kg + l.kg, co2: t.co2 + l.co2, meals: t.meals + l.meals }), { kg: 0, co2: 0, meals: 0 });
    const write = b => { setBusy(b.id); setTimeout(() => { Bus.publish("ledger.closed", { batch: b.id, by: user.id }); setBusy(null); }, 1200); };
    return <><Bar user={user} nav={nav} title="Impact" runhead={<RunHead parts={[{ b: "Q3 FY27" }, { b: Math.round(tot.kg) + " kg", t: "out of landfill" }, { b: tot.co2.toFixed(2) + " t", t: "CO₂e" }]} />} />
      <div className="page"><PageHead title="Impact" sub="The waste reading of the same ledger finance reads: kilos, CO₂e and meals, each with its invoice." />
        {settled.map(b => <Plate key={b.id} tone="chrome-soft"><div className="row wrap"><div className="grow"><b>{b.id} settled. Write this batch's BRSR row?</b><p className="t-small muted">217.6 kg kept out of landfill with invoices behind every kilo.</p></div><Btn kind="yes" icon="check" loading={busy === b.id} onClick={() => write(b)}>Write the row</Btn></div></Plate>)}
        <div className="tilerow"><LiveTile value={Math.round(tot.kg) + " kg"} label="kept out of landfill" tone="emerald" /><LiveTile value={tot.co2.toFixed(2) + " t"} label="CO₂e avoided" /><LiveTile value={num(tot.meals)} label="meals" tone="ultra" /></div>
        <DataTable rows={led} onRow={l => nav("batches/" + l.batch)} columns={[{ key: "batch", label: "Batch", render: l => <b className="mono">{l.batch}</b> }, { key: "kg", label: "kg", n: true }, { key: "co2", label: "tCO₂e", n: true }, { key: "meals", label: "Meals", n: true }, { key: "recovered", label: "Recovered", n: true, render: l => inr(l.recovered) }, { key: "closedAt", label: "Closed", render: l => l.closedAt ? <span className="t-xs muted mono">{ago(l.closedAt)}</span> : <Chip tone="chrome">open</Chip> }]} />
        <Plate tone="emerald-soft" className="t-small"><b>How the waste number is built</b><p className="muted">cartons × gross weight (chips 3.84 kg a carton) for every batch sold, donated or staff-sold instead of destroyed; each row links its invoice, listing, shop orders or food-bank receipt.</p></Plate>
      </div></>;
  }
  function BRSR({ user, nav }) {
    const v = useDB(); const led = DB.list("ledger").filter(l => l.closedAt); const kg = led.reduce((t, l) => t + l.kg, 0); const rows = [["Plastic waste (packaging)", (kg * 0.15 / 1000).toFixed(2) + " t", "0.00 t", (kg * 0.15 / 1000).toFixed(2) + " t", "invoices, listings, shop orders"], ["Food waste (expired FMCG)", (kg * 0.85 / 1000).toFixed(2) + " t", "0.00 t", (kg * 0.85 / 1000).toFixed(2) + " t", "ledger, food-bank receipts"], ["Other non-hazardous", "0.00 t", "0.00 t", "0.00 t", ""]];
    const csv = () => exportCSV(rows.map(r => ({ category: r[0], generated: r[1], recycled: r[2], diverted: r[3], evidence: r[4] })), "brsr-principle-6.csv");
    return <><Bar user={user} nav={nav} title="BRSR" />
      <div className="page"><PageHead title="BRSR Principle 6 · waste" sub="Q3 FY27, built from the ledger. Every tonne points at the documents that prove it." actions={<Btn kind="primary" icon="download" onClick={csv}>Export the table (CSV)</Btn>} />
        <div className="tablewrap"><table className="table"><thead><tr><th>Category</th><th className="n">Generated</th><th className="n">Recycled</th><th className="n">Diverted from landfill</th><th>Evidence</th></tr></thead><tbody>{rows.map(r => <tr key={r[0]}><td>{r[0]}</td><td className="n">{r[1]}</td><td className="n">{r[2]}</td><td className="n">{r[3]}</td><td className="t-small muted">{r[4]}</td></tr>)}</tbody></table></div>
        <Plate className="stack-sm"><h3>Rows by batch</h3>{led.map(l => <div key={l.id} className="row between t-small" style={{ padding: "6px 0", borderBottom: "var(--kl-thin) solid var(--line)" }}><span className="mono">{l.batch}</span><span>{l.kg} kg · {l.co2} t</span><Chip tone="emerald" icon="check">4 evidence links</Chip></div>)}</Plate>
      </div></>;
  }
  function Evidence({ user, nav }) {
    const v = useDB(); const rows = DB.list("documents", { sort: ["at", "desc"] }).concat(DB.list("listings").map(l => ({ id: l.id, title: "Marketplace listing", batch: l.batch, status: l.status, at: l.at, type: "listing" }))).concat(DB.list("orders", { where: { type: "donation" } }).map(o => ({ id: o.id, title: "Food-bank receipt", batch: o.batch, status: o.status, at: o.at, type: "receipt" })));
    return <><Bar user={user} nav={nav} title="Evidence" />
      <div className="page"><PageHead title="Evidence" sub="What an auditor follows from a BRSR row: invoices, listings, shop orders, food-bank receipts." />
        <DataTable rows={rows} onRow={r => r.type === "listing" || r.type === "receipt" ? nav("batches/" + r.batch) : nav("documents/" + encodeURIComponent(r.id))} columns={[{ key: "id", label: "Reference", render: r => <b className="mono">{r.id}</b> }, { key: "title", label: "Kind" }, { key: "batch", label: "Batch", render: r => <span className="mono">{r.batch}</span> }, { key: "status", label: "Status", render: r => <StatusChip status={r.status} /> }, { key: "at", label: "When", render: r => <span className="t-xs muted mono">{ago(r.at)}</span> }]} />
      </div></>;
  }
  window.SC_APP = Object.assign(window.SC_APP, { Documents, Ledger, GST, Impact, BRSR, Evidence, Paper });
})();

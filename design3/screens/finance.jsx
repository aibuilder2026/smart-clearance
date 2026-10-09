// Smart-Clearance v3 · S5 Paperwork (Anita, finance) and S6 Finance & ESG (Vikram, sustainability)
(function () {
  const { useState, useEffect, useMemo, Fragment } = React;
  const { motion, AnimatePresence } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Segmented, Sheet, Product, Empty, Money, Roll, Tile, Aura, AgentFeed, TrendChart, MixBar, MoneyPanel, DocCard, DataTable, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle, Locked } = S;
  const CH_NAMES = D.QUARTER.mixNames;
  const DOC = id => D.DOCS.find(d => d.id === id);
  const ES = D.PLAN.lines.find(l => l.id === "expiresoon");
  const CHIPS = D.SKUS.chips, SHOPS = D.KIRANAS.length;
  const download = (name, text, type = "text/csv") => { const url = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const csv = rows => rows.map(r => r.map(c => { const v = String(c == null ? "" : c); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(",")).join("\n");
  const EVIDENCE = `${D.INVOICE.no} · ${D.JOURNEY.listing.id} · ${SHOPS} kirana order logs · CN/0117`;

  /* ---------- the documents, set on paper ---------- */
  const Line = ({ k, v, strong, sub }) => <div className="pp-line"><span>{k}{sub && <em> {sub}</em>}</span><span className={strong ? "pp-strong" : ""}>{v}</span></div>;
  // the food bank's receipt for the packs it collected (SC-110), in its own form: Feeding India's in-app receipt, India
  // FoodBanking Network's acknowledgement, which adds the value at the donor's cost for its CSR records. The same paper
  // in the batch's pack and on the food bank's pickup
  function Receipt({ doc: r, batch, sku, dist }) {
    return <div className="paper pp">
      <div className="pp-head"><div><div className="pp-title">{r.type}</div><div className="pp-no">{r.no} · {r.paper === "In-app receipt" ? "in-app" : "acknowledgement"} · {fmt.date(r.date)}</div></div><span className="pp-stamp ok">{r.stamp}</span></div>
      <div className="pp-parties"><div><em>Donor</em><b>{r.donor}</b><span>through {r.via}, {r.from}</span><span className="pp-mono">FSSAI {r.fssai}</span></div><div><em>Received by</em><b>{r.owner}</b><span>{dist.city}</span><span className="pp-mono">{r.paper}</span></div></div>
      <table className="pp-table"><thead><tr><th>Goods</th><th>Packs</th><th>Weight</th></tr></thead><tbody><tr><td>{sku.brand} {sku.name}<br /><em>Batch {batch.id} · best before {fmt.date(batch.bestBefore)}</em></td><td>{fmt.num(r.units)}</td><td>{fmt.kg(r.kg)}</td></tr></tbody></table>
      <Line k="Collected" sub={`by ${r.by}`} v={`${fmt.day(r.date)}, ${r.at}`} />
      <Line k="Served at" v={r.spot} />
      <Line k="Meals" sub={r.mealsRule} v={fmt.num(r.meals)} />
      {r.value != null && <><div className="pp-sub">For the donor's CSR records</div><Line k="Value at the donor's cost" sub={`${fmt.num(r.units)} × ₹${sku.cost}, indicative`} v={fmt.inr2(r.value)} /><Line k="CSR activity" v={r.csr} /></>}
      <p className="pp-note">{r.note}</p>
    </div>;
  }
  function Paper({ id }) {
    const d = DOC(id); const inv = DOC("invoice"); const R = D.DISTRIBUTORS.rakesh, B = D.BUYER;
    const head = (title, no, right) => <div className="pp-head"><div><div className="pp-title">{title}</div><div className="pp-no">{no}</div></div>{right}</div>;
    if (id === "invoice") return <div className="paper pp">
      {head("Tax invoice", `${inv.no} · draft · ${fmt.date(inv.date)}`, <span className="pp-stamp">IGST</span>)}
      <div className="pp-parties"><div><em>From</em><b>{R.name}</b><span>{R.address}</span><span className="pp-mono">GSTIN {R.gstin}</span></div><div><em>To</em><b>{B.name}</b><span>{B.address} · place of supply {B.stateCode}</span><span className="pp-mono">GSTIN {B.gstin}</span></div></div>
      <table className="pp-table"><thead><tr><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Taxable</th></tr></thead><tbody><tr><td>Munchly Masala Chips 150 g<br /><em>Batch MF-2409-117 · best before 18 Nov 2026</em></td><td>{CHIPS.hsn}</td><td>{inv.units}</td><td>₹{inv.price.toFixed(2)}</td><td>{fmt.inr2(inv.taxable)}</td></tr></tbody></table>
      <Line k="Taxable value" v={fmt.inr2(inv.taxable)} /><Line k={`IGST ${inv.gstPct}%`} sub="Maharashtra → Chhattisgarh" v={fmt.inr2(inv.igst)} /><Line k="Round off" v={fmt.inr2(inv.roundOff)} /><Line k="Invoice total" v={fmt.inr2(inv.total)} strong />
      <p className="pp-note">Drafted by the Paperwork agent for {R.name} to issue from Tally. {CHIPS.gstNote} The MRP of ₹30.00 stays printed on every pack: a discounted sale is fine, a second MRP is not (Legal Metrology).</p>
    </div>;
    if (id === "eway") return <div className="paper pp">{head("E-way bill check", `MF-2409-117 · ${D.JOURNEY.listing.id}`, <span className="pp-stamp ok">NOT REQUIRED</span>)}<Line k="Consignment value with GST" v={fmt.inr2(inv.total)} /><Line k="Threshold, inter-state" v="₹50,000.00" /><Line k="E-way bill" v="not required" strong /><p className="pp-note">{d.note} A transporter note travels with the {S.cartons(ES.units)} on the buyer's truck instead.</p></div>;
    if (id === "support") { const sp = D.SUPPORT; const es = sp.rows.find(r => r.id === "expiresoon"), k = sp.rows.find(r => r.id === "kirana");
      return <div className="paper pp">{head("Price-support credit note", `${d.no} · ${D.CLIENT.short} → ${R.name}`, <span className="pp-stamp ok">NO GST ADJ.</span>)}
        <Line k={`${es.units} sold on ExpireSoon at ₹${es.price.toFixed(2)}`} sub={`₹${CHIPS.dp} − ₹${es.price.toFixed(2)} = ₹${es.gap.toFixed(2)} a pack`} v={fmt.inr2(es.amount)} />
        <Line k={`${k.units} sold to ${SHOPS} kiranas at ₹18 effective`} sub={`₹${CHIPS.dp} − ₹18 = ₹${k.gap.toFixed(2)}, free packs included`} v={fmt.inr2(k.amount)} />
        <Line k="Van delivery" sub={`${k.units} × ₹${M.RULES.vanPerUnit.toFixed(2)}`} v={fmt.inr2(sp.van)} /><Line k="ExpireSoon listing fee" v={fmt.inr2(sp.fee)} /><Line k="Round off" v={fmt.inr2(d.roundOff)} />
        <Line k={`Credit to ${R.name}`} v={fmt.inr2(d.amount)} strong />
        <p className="pp-note">A financial credit note, with no GST adjustment, so {R.name} ends whole at the ₹{CHIPS.dp} it paid. It covers the buy-10-get-2 scheme too, so no separate scheme note is needed. Munchly pays this instead of an expiry claim of {fmt.inr(D.CLAIM.total)}. Trued up after the return window closes on {fmt.day(D.RETURN_BY)}.</p>
      </div>; }
    if (id === "itc") return <div className="paper pp">{head("GST ITC memo", `Section 17(5)(h) · ${D.CLIENT.short}`, <span className="pp-stamp ok">ITC KEPT</span>)}<Line k="Packets sold under tax invoices" v={fmt.num(D.PLAN.soldUnits)} /><Line k="Destroyed, gifted or lost" v="0" /><Line k="Input GST on the stock" sub={`₹${CHIPS.itcPerUnit.toFixed(2)} a pack, from the cost sheet`} v={fmt.inr2(d.amount)} strong /><Line k="Reversal in GSTR-3B, Table 4(B)(1)" v="none" /><p className="pp-note">Section 17(5)(h) blocks credit on goods written off, destroyed, lost or given away free. These packs were sold under tax invoices, so it does not apply. The credit would be reversed only if the stock came back under the expiry claim and Munchly destroyed it. Credit on donated units is reversed: 17(5)(h) blocks it on gifts and, since 1 October 2023, 17(5)(fa) on CSR donations.</p></div>;
    if (id === "expiry") { const C = D.CLIENT.short, x = d;
      if (x.policy === "none") return <div className="paper pp">{head("Expiry notice", `${D.BATCHES.find(b => b.hero).id} · ${R.name}`, <span className="pp-stamp">NO RETURNS</span>)}<Line k="Packs expired at the godown" v={fmt.num(x.units)} strong /><Line k={`Credit from ${C}`} v="none" /><p className="pp-note">{x.note}</p></div>;
      return <div className="paper pp">{head(x.type, `${x.no} · ${C} → ${R.name}`, <span className="pp-stamp ok">NO GST ADJ.</span>)}
        <Line k={`${fmt.num(x.units)} packs expired at the godown`} sub="at the dealer price" v={x.amount != null ? fmt.inr2(x.amount) : "—"} />
        <Line k={`Credit to ${R.name}`} v={x.amount != null ? fmt.inr2(x.amount) : "—"} strong />
        {x.policy === "full-credit" && <><div className="pp-sub">{C}'s own costs, on destroying them</div><Line k="Disposal" v={fmt.inr2(x.disposal)} /><Line k="EPR on the packaging" v={fmt.inr2(x.epr)} /><Line k="Input GST reversed" sub="section 17(5)(h)" v={fmt.inr2(x.itc)} /><Line k="Expiry, all in" v={fmt.inr2((x.amount || 0) + x.disposal + x.epr + x.itc)} strong /></>}
        <p className="pp-note">{x.note}</p></div>; }
    if (id === "receipt" && d) { const b = D.BATCHES.find(x => x.hero); return <Receipt doc={d} batch={b} sku={D.SKUS[b.sku]} dist={D.DISTRIBUTORS[b.distributor]} />; }
    if (id === "fssai") return <div className="paper pp">{head("FSSAI surplus-food checklist", "MF-2409-117", <span className="pp-stamp">NOT REQUIRED</span>)}<p className="pp-note">Nothing from this batch was donated. The Mango Drink batch MF-2410-118 has its own checklist: {D.MANGO_FB} packs to Feeding India, Hyderabad.</p></div>;
    return <div className="paper pp">{head("Destruction certificate", "MF-2409-117", <span className="pp-stamp">NOT REQUIRED</span>)}<Line k="Units left to destroy" v="0" strong /><p className="pp-note">Issued only when units remain, with the ITC reversal entry pre-filled so finance is never surprised.</p></div>;
  }

  // the same batch read from each side: the distributor ends whole, and Munchly pays less than a claim. What the
  // distributor receives is what each channel took, at its price (the credit note's rows), so a line that took less
  // counts less; on expiry day the packs left at the godown add their settlement on both sides (SC-94)
  function KeepsWhat() {
    const h = useStore().hero; const x = h.expiry && h.expiry.units > 0 ? h.expiry : null;
    const took = D.SUPPORT.rows.reduce((t, r) => t + r.units * r.price, 0), credit = (x && x.credit) || 0, settled = x ? x.total : 0;
    const recv = took + D.SUPPORT.total; const paid = D.PLAN.units * CHIPS.dp + D.SUPPORT.van + D.SUPPORT.fee; const ends = Math.round(recv + credit - paid);
    return <Card className="stack snug">
      <span className="card-title">Who keeps what</span>
      <div className="stack tight t-subhead">
        <div className="row between"><span>{D.DISTRIBUTORS.rakesh.name} receives</span><span className="tnum">{fmt.inr(recv)}</span></div>
        {credit > 0 && <div className="row between"><span>and the expiry credit for {fmt.num(x.units)} packs</span><span className="tnum">{fmt.inr(credit)}</span></div>}
        <div className="row between"><span>and paid {fmt.num(D.PLAN.units)} × ₹{CHIPS.dp}, the van and the fee</span><span className="tnum">{fmt.inr(-paid)}</span></div>
        <div className="row between"><b>{x && !credit ? "Its loss on the expired packs" : "He ends whole"}</b><span className="tnum strong">{fmt.inr(ends)}</span></div>
        <div className="hairline" style={{ margin: "4px 0" }} />
        <div className="row between"><span>Expiry claim Munchly avoids</span><span className="tnum">{fmt.inr(D.CLAIM.total)}</span></div>
        <div className="row between"><span>Price support it pays instead</span><span className="tnum neg">{fmt.inr(-D.SUPPORT.total)}</span></div>
        {settled > 0 && <div className="row between"><span>and the expiry settlement for {fmt.num(x.units)} packs</span><span className="tnum neg">{fmt.inr(-settled)}</span></div>}
        <div className="row between"><b>Better for Munchly</b><Money value={D.CLAIM.total - D.SUPPORT.total - settled} size="s" style={{ color: "var(--primary-text)", fontSize: 22 }} /></div>
      </div>
      <span className="t-caption subtle">The same {fmt.inr(D.ACTUAL.swing)} swing as the ledger, seen from Munchly's cash: the ₹{CHIPS.dp} credit Rakesh would have claimed and the ₹{CHIPS.dp} he paid cancel out. At plan prices it is {fmt.inr(D.SUPPORT_PLAN.total)} of support and a {fmt.inr(D.PLAN.swing)} swing.</span>
    </Card>;
  }

  function Paperwork({ me }) {
    const s = useStore(); const h = s.hero; const app = useApp(); const { toast } = useNotice();
    const ready = !!h.docs; const [sel, setSel] = useState(() => (DOC("expiry") ? "expiry" : "invoice")); const [sheet, setSheet] = useState(false); // once a batch has expired, its expiry paper first (SC-94)
    const open = id => { setSel(id); if (app.bp !== "desktop") setSheet(true); };
    const exportPack = () => { download("MF-2409-117-document-pack.csv", csv([["Document", "Issued by", "Number", "Status", "Amount (₹)", "Note"], ...D.DOCS.map(d => [d.type, d.owner, d.no, d.status, d.amount ? d.amount.toFixed(2) : "", d.note || ""])])); toast({ text: "Document pack exported", tone: "ok" }); };
    return <Screen me={me} title="Paperwork" sub="MF-2409-117 · prepared by the Paperwork agent at the award">
      {!ready ? <div className="stack" style={{ gap: 16 }}><Card className="row wrap" style={{ gap: 16 }}><Product name="documents" size={88} /><div className="grow stack tight" style={{ gap: 2 }}><b>The pack is drafted at the award</b><span className="t-footnote muted">Rakesh's tax invoice, the e-way bill check, Munchly's price-support credit note, the ITC memo, the FSSAI checklist and the destruction certificate, each generated or marked not required with the reason.</span></div></Card><Locked icon="file-text" agent="Paperwork agent" live={h.phase === "dispatched"} text={h.phase === "dispatched" ? "Drafting Rakesh's invoice, the e-way bill check, the credit note and the ITC memo." : "Drafts the whole pack once the lot is awarded and on the buyer's truck."} /><div className="docgrid">{D.DOCS.map(d => <K.Skeleton key={d.id} h={132} r={20} />)}</div></div> :
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <Tile label="Rakesh's invoice" icon="receipt"><Money value={DOC("invoice").total} size="s" /></Tile>
          <Tile label="Price support" icon="hand-coins"><Money value={DOC("support").amount} size="s" /></Tile>
          <Tile label="GST credit kept" icon="badge-check"><Money value={DOC("itc").amount} size="s" style={{ color: "var(--primary-text)" }} /></Tile>
          <Tile label="Things to chase" icon="list-checks"><span className="num s">0</span></Tile>
        </div>
        <Columns sideWidth={460}
          main={<><SectionTitle sub="Generated, drafted or not required, each with its reason" right={<span className="row tight"><Button variant="secondary" size="sm" icon="download" onClick={exportPack}>Export</Button>{h.reviewed ? <Badge tone="green" icon="check">reviewed</Badge> : <Button variant="primary" size="sm" icon="check" onClick={() => { Flow.act("review"); toast({ text: "Pack reviewed · logged", tone: "ok" }); }}>Mark reviewed</Button>}</span>}>Document pack</SectionTitle>
            <div className="docgrid">{D.DOCS.map(d => <div key={d.id} className={cx("docpick", sel === d.id && app.bp === "desktop" && "on")}><DocCard doc={d} onOpen={() => open(d.id)} /></div>)}</div>
            <KeepsWhat />
            <Card className="row top" style={{ gap: 14, background: "var(--surface-2)" }}><span className="icontile"><Icon name="quote" size={17} /></span><div><p className="t-body" style={{ margin: 0 }}>Credit note, GST memo, and Rakesh's invoice attached as evidence. First batch this year with nothing for me to chase.</p><span className="t-footnote subtle">Anita · finance</span></div></Card></>}
          side={app.bp === "desktop" ? <><SectionTitle sub={DOC(sel).owner === D.CLIENT.short ? "Issued by Munchly" : "Drafted for Rakesh Traders"}>{DOC(sel).type}</SectionTitle><AnimatePresence mode="wait"><motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><Paper id={sel} /></motion.div></AnimatePresence></> : null} />
      </div>}
      <Sheet open={sheet} onClose={() => setSheet(false)} title={DOC(sel) ? DOC(sel).type : ""}><Paper id={sel} /></Sheet>
    </Screen>;
  }

  /* ---------- S6 Finance & ESG ---------- */
  // quarter-sized rupees read in lakh, the way an Indian finance team says them
  const Lakh = ({ value, style }) => <span className="num s money" style={style}><span className="sr-only">{"₹" + (value / 1e5).toFixed(1) + " lakh"}</span><span className="cur" aria-hidden="true">₹</span><Roll value={value / 1e5} format={v => v.toFixed(1)} hidden /><span aria-hidden="true" style={{ alignSelf: "flex-end", fontSize: "0.46em", fontWeight: 600, marginLeft: "0.2em", marginBottom: "0.16em", letterSpacing: 0 }}>lakh</span></span>;
  function Report({ me }) {
    const s = useStore(); const h = s.hero; const app = useApp(); const { toast } = useNotice(); const Q = D.QUARTER; const [view, setView] = useState("quarter");
    const exportBRSR = () => { download("BRSR-P6-waste-Q3-FY27.csv", csv([["Category", "Diverted (kg)", "Resold (kg)", "Donated (kg)", "Disposed (kg)", "Evidence"], ...Q.brsr.map(r => [r.cat, r.diverted, r.resold, r.donated, r.disposed, r.evidence]), ...(h.posted ? [["This batch MF-2409-117 (packaged food)", D.PLAN.kg, D.PLAN.kg, 0, 0, EVIDENCE.replace(/ · /g, "; ")]] : [])])); toast({ text: "BRSR table exported as CSV", tone: "ok" }); };
    // quarter totals as the walkthrough reports them; CO₂e is computed from the kilos with the indicative factor
    const tiles = [["Recovered", "indian-rupee", <Lakh value={Q.recovered} style={{ color: "var(--primary-text)" }} />], ["GST credit protected", "badge-check", <Money value={Q.itc} size="s" roll />], ["Kept out of landfill", "leaf", <span className="num s"><Roll value={Q.kg / 1000} format={v => v.toFixed(1)} /> t</span>], ["CO₂e avoided", "cloud", <span className="num s"><Roll value={Q.co2 / 1000} format={v => v.toFixed(2)} /> t</span>, "indicative · 2.5 kg a kg"], ["Meals served", "heart-handshake", <span className="num s"><Roll value={Q.meals} format={v => fmt.num(Math.round(v))} /></span>]];
    return <Screen me={me} title="Finance & ESG" sub={`${Q.label} · ${Q.period} · one ledger, two readings`} actions={app.bp !== "phone" && <Segmented options={[{ id: "quarter", label: "Quarter" }, { id: "batch", label: "This batch" }]} value={view} onChange={setView} label="Period" />}>
      <div className="stack" style={{ gap: 20 }}>
        {app.bp === "phone" && <Segmented options={[{ id: "quarter", label: "Quarter" }, { id: "batch", label: "This batch" }]} value={view} onChange={setView} label="Period" />}
        {view === "quarter" ? <>
          {h.posted && <motion.button type="button" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="card row wrap" onClick={() => setView("batch")} style={{ padding: "12px 16px", gap: 12, textAlign: "left", boxShadow: "var(--shadow-1), 0 0 0 1.5px color-mix(in oklab, var(--primary) 40%, transparent)" }}><Product name="pack-chips" size={36} /><span className="grow t-subhead"><b>MF-2409-117 posted</b> · {fmt.inr(D.ACTUAL.net)} recovered · {fmt.kg(D.PLAN.kg)} out of landfill · BRSR row added</span><Badge tone="green" icon="check">ledger</Badge></motion.button>}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: app.bp === "phone" ? "repeat(2, minmax(0,1fr))" : "repeat(auto-fit, minmax(150px, 1fr))" }}>{tiles.map(([l, ic, v, foot]) => <Tile key={l} label={l} icon={ic} foot={foot}>{v}</Tile>)}</div>
          <p className="t-footnote subtle" style={{ margin: "-8px 0 0" }}>A synthetic quarter: the totals are the walkthrough's; the weekly split, the channel mix and the BRSR split below are illustrative. Week 1 is this batch.</p>
          <Columns sideWidth={380}
            main={<><SectionTitle sub="Illustrative weekly split of the quarter">Recovered against the would-be write-off</SectionTitle><Card><TrendChart weeks={Q.weeks} height={app.bp === "phone" ? 190 : 240} /></Card>
              <SectionTitle sub="Share of units by where they went · illustrative">Channel mix</SectionTitle><Card><MixBar mix={Q.mix} names={CH_NAMES} /></Card></>}
            side={<><SectionTitle>How the tax maths works</SectionTitle><Card className="stack snug t-subhead">
              <p style={{ margin: 0 }}><b>Destroying stock costs more than the stock.</b> You lose it at cost, reverse the GST input credit under Section 17(5)(h), pay to dispose of it, and owe EPR on the product and pack.</p>
              <p style={{ margin: 0 }}><b>Selling it under a tax invoice keeps the credit.</b> That is why every routed batch protects its ITC, even at half the MRP.</p>
              <p style={{ margin: 0 }}><b>Donations reverse it.</b> Section 17(5)(h) blocks credit on gifts, and since 1 October 2023 section 17(5)(fa) blocks it on CSR donations too, so a food-bank route costs the credit on every pack.</p>
              <div className="row tight wrap"><Badge size="sm" icon="info">Disposal ₹1.50 a unit, indicative</Badge><Badge size="sm" icon="info">EPR ₹6 a kg, indicative</Badge><Badge size="sm" icon="info">CO₂e 2.5 kg per kg, indicative</Badge></div>
            </Card>
            <Card className="row top" style={{ gap: 14, background: "var(--surface-2)" }}><span className="icontile"><Icon name="quote" size={17} /></span><div><p className="t-body" style={{ margin: 0 }}>5.7 tonnes kept out of landfill this quarter, with invoices behind every kilo. That goes straight into the annual report.</p><span className="t-footnote subtle">Vikram · sustainability</span></div></Card></>} />
          <SectionTitle sub="Principle 6, waste management · the quarter's 5.7 t, split illustrative" right={<Button variant="primary" size="sm" icon="download" onClick={exportBRSR}>Export BRSR table</Button>}>BRSR Core</SectionTitle>
          <DataTable label="BRSR waste table" rows={Q.brsr.map((r, i) => ({ ...r, id: "r" + i }))} columns={[{ key: "cat", label: "Category", render: r => <span className="strong">{r.cat}</span> }, { key: "diverted", label: "Diverted, kg", num: true, render: r => fmt.num(r.diverted) }, { key: "resold", label: "Resold", num: true, render: r => fmt.num(r.resold) }, { key: "donated", label: "Donated", num: true, render: r => fmt.num(r.donated) }, { key: "disposed", label: "Disposed", num: true, render: r => fmt.num(r.disposed) }, { key: "evidence", label: "Evidence", sortable: false, render: r => <span className="t-footnote muted">{r.evidence}</span> }]} />
        </> : <>
          {h.posted ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bezel"><div className="card raised stack" style={{ padding: app.bp === "phone" ? 18 : 26, gap: 16 }}>
            <div className="row between wrap" style={{ gap: 8 }}><span className="row tight"><Product name="pack-chips" size={48} /><span className="stack tight" style={{ gap: 0 }}><b>MF-2409-117 · Masala Chips 150 g</b><span className="t-footnote subtle">Rakesh Traders, Nagpur · trued up after {fmt.day(D.RETURN_BY)}</span></span></span><Badge tone="green" icon="check">posted to the ledger</Badge></div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: app.bp === "phone" ? "repeat(2, minmax(0,1fr))" : "repeat(auto-fit, minmax(150px, 1fr))" }}>
              <Tile label="Recovered" icon="indian-rupee"><Money value={D.ACTUAL.net} size="s" roll from={0} style={{ color: "var(--primary-text)" }} /></Tile>
              <Tile label="Better than destroying" icon="scale"><Money value={D.ACTUAL.swing} size="s" roll from={0} /></Tile>
              <Tile label="GST credit kept" icon="badge-check"><Money value={D.PLAN.itcRetained} size="s" roll from={0} /></Tile>
              <Tile label="Out of landfill" icon="leaf"><span className="num s"><Roll value={D.PLAN.kg} format={v => v.toFixed(1)} /> kg</span></Tile>
              <Tile label="CO₂e avoided" icon="cloud" foot="indicative"><span className="num s"><Roll value={D.PLAN.co2} format={v => fmt.num(Math.round(v))} /> kg</span></Tile>
            </div>
            <div className="stack tight"><b className="t-subhead">BRSR line</b><span className="mono t-footnote" style={{ padding: "10px 12px", borderRadius: 12, background: "var(--fill)" }}>{fmt.kg(D.PLAN.kg)} diverted from disposal · {fmt.num(D.PLAN.co2)} kg CO₂e avoided (indicative) · 0 meals (nothing donated)</span><span className="t-caption subtle">Evidence: {EVIDENCE}</span></div>
          </div></motion.div> : <Locked icon="book-open-check" agent="Impact agent" live={h.phase === "settled" && h.van.status === "done"} text={h.phase === "settled" ? "Posts the ledger once the return window closes on " + fmt.day(D.RETURN_BY) + ", and writes the BRSR row with evidence links." : "Posts this batch to the ledger once the paperwork is done and the return window closes."} />}
          <SectionTitle sub="Planned on the Route Room; actual after the negotiation">Money reading</SectionTitle>
          <MoneyPanel plan={D.PLAN} actual={h.award ? D.ACTUAL : undefined} compact={app.bp !== "desktop"} />
          {h.award && <Card className="row wrap" style={{ gap: 14 }}><span className="icontile violet"><Icon name="trending-down" size={17} /></span><div className="grow"><b>{fmt.inr(D.ACTUAL.delta)} under plan</b><div className="t-footnote muted">The ExpireSoon lot sold at ₹{D.COUNTER.price.toFixed(2)} against ₹15.00 planned: {fmt.inr(D.ACTUAL.esPlanned)} became {fmt.inr(D.ACTUAL.esActual)}. Kiranas came in as planned; they are final once the return window closes.</div></div></Card>}
        </>}
      </div>
    </Screen>;
  }

  Object.assign(window.SC3_SCREENS, { Paperwork, Report, Paper, Receipt, KeepsWhat, download, csv });
})();

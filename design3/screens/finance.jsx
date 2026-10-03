// Smart-Clearance v3 · S5 Paperwork (Anita, finance) and S6 Finance & ESG (Vikram, sustainability)
(function () {
  const { useState, useEffect, useMemo, Fragment } = React;
  const { motion, AnimatePresence } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Segmented, Sheet, Product, Empty, Money, Roll, Tile, Aura, AgentFeed, TrendChart, MixBar, MoneyPanel, DocCard, DataTable, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle, Locked } = S;
  const CH_NAMES = { kirana: "Kirana cluster", expiresoon: "ExpireSoon", staff: "Staff sale", d2c: "Brand site", foodbank: "Food bank", writeoff: "Write-off" };
  const DOC = id => D.DOCS.find(d => d.id === id);
  const download = (name, text, type = "text/csv") => { const url = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const csv = rows => rows.map(r => r.map(c => { const v = String(c == null ? "" : c); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(",")).join("\n");

  /* ---------- the documents, set on paper ---------- */
  const Line = ({ k, v, strong, sub }) => <div className="pp-line"><span>{k}{sub && <em> {sub}</em>}</span><span className={strong ? "pp-strong" : ""}>{v}</span></div>;
  function Paper({ id }) {
    const d = DOC(id); const inv = DOC("invoice");
    const head = (title, no, right) => <div className="pp-head"><div><div className="pp-title">{title}</div><div className="pp-no">{no}</div></div>{right}</div>;
    if (id === "invoice") return <div className="paper pp">
      {head("Tax invoice", "INV/26-27/0931 · 5 Oct 2026", <span className="pp-stamp">IGST</span>)}
      <div className="pp-parties"><div><em>From</em><b>Rakesh Traders</b><span>Kalamna Market, Nagpur, Maharashtra</span><span className="pp-mono">GSTIN {D.DISTRIBUTORS.rakesh.gstin}</span></div><div><em>To</em><b>{D.BUYER.name}</b><span>Hyderabad, Telangana · place of supply 36</span><span className="pp-mono">GSTIN {D.BUYER.gstin}</span></div></div>
      <table className="pp-table"><thead><tr><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Taxable</th></tr></thead><tbody><tr><td>Munchly Masala Chips 150 g<br /><em>Batch MF-2409-117 · best before 18 Nov 2026</em></td><td>2005</td><td>772</td><td>₹14.20</td><td>{fmt.inr2(inv.taxable)}</td></tr></tbody></table>
      <Line k="Taxable value" v={fmt.inr2(inv.taxable)} /><Line k="IGST 12%" sub="Maharashtra → Telangana" v={fmt.inr2(inv.igst)} /><Line k="Invoice total" v={fmt.inr2(inv.total)} strong />
      <p className="pp-note">MRP ₹30.00 stays printed on every pack. A discounted sale is fine; a second MRP is not (Legal Metrology).</p>
    </div>;
    if (id === "eway") return <div className="paper pp">{head("E-way bill check", "MF-2409-117 · ES-24117", <span className="pp-stamp ok">NOT REQUIRED</span>)}<Line k="Consignment value incl. GST" v={fmt.inr2(inv.total)} /><Line k="Threshold, inter-state" v="₹50,000.00" /><Line k="E-way bill" v="not required" strong /><p className="pp-note">{d.note} A transporter note travels with the 32 cartons + 4 instead.</p></div>;
    if (id === "credit") return <div className="paper pp">{head("Credit note", "CN/0117 · Munchly Foods → Rakesh Traders", null)}<Line k="Shop scheme, buy 10 get 2" sub="14 Nagpur kiranas" v="588 packets" /><Line k="Free packets" v="98" /><Line k="At cost" v="₹16.00 a packet" /><Line k="Credit to Rakesh Traders" v={fmt.inr2(d.amount)} strong /><p className="pp-note">Funds the free packets in the kirana scheme so the distributor's margin is untouched.</p></div>;
    if (id === "itc") return <div className="paper pp">{head("GST ITC memo", "Section 17(5)(h) · indicative", <span className="pp-stamp ok">ITC KEPT</span>)}<Line k="Packets sold under invoice" v="1,360" /><Line k="Destroyed, gifted or lost" v="0" /><Line k="Input credit on the stock" v={fmt.inr2(d.amount)} strong /><Line k="Reversal in GSTR-3B" v="none" /><p className="pp-note">Section 17(5)(h) blocks credit on goods written off, destroyed, lost or given away free. These goods were supplied under tax invoices, so it does not apply. The buy-10-get-2 scheme is one supply at a discount (CBIC circular 92/11/2019), so the free packets keep their credit too. Indicative: confirm with your tax adviser.</p></div>;
    if (id === "fssai") return <div className="paper pp">{head("FSSAI surplus-food checklist", "MF-2409-117", <span className="pp-stamp">NOT REQUIRED</span>)}<p className="pp-note">Nothing from this batch was donated. The Mango Drink batch MF-2410-118 has its own checklist: 58 packs to Feeding India, Hyderabad.</p></div>;
    return <div className="paper pp">{head("Destruction certificate", "MF-2409-117", <span className="pp-stamp">NOT REQUIRED</span>)}<Line k="Units left to destroy" v="0" strong /><p className="pp-note">Issued only when units remain, with the ITC reversal entry pre-filled so finance is never surprised.</p></div>;
  }

  function Paperwork({ me }) {
    const s = useStore(); const h = s.hero; const app = useApp(); const { toast } = useNotice();
    const ready = !!h.docs; const [sel, setSel] = useState("invoice"); const [sheet, setSheet] = useState(false);
    const open = id => { setSel(id); if (app.bp !== "desktop") setSheet(true); };
    const exportPack = () => { download("MF-2409-117-document-pack.csv", csv([["Document", "Number", "Status", "Amount (₹)", "Note"], ...D.DOCS.map(d => [d.type, d.no, d.status, d.amount ? d.amount.toFixed(2) : "", d.note || ""])])); toast({ text: "Document pack exported", tone: "ok" }); };
    return <Screen me={me} title="Paperwork" sub="MF-2409-117 · prepared by the Paperwork agent at the award">
      {!ready ? <div className="stack" style={{ gap: 16 }}><Card className="row wrap" style={{ gap: 16 }}><Product name="documents" size={88} /><div className="grow stack tight" style={{ gap: 2 }}><b>The pack is drafted at the award</b><span className="t-footnote muted">Tax invoice, e-way bill check, credit note, ITC memo, FSSAI checklist and destruction certificate, each generated or marked not required with the reason.</span></div></Card><Locked icon="file-text" agent="Paperwork agent" live={h.phase === "dispatched"} text={h.phase === "dispatched" ? "Drafting the invoice, the e-way bill check, the credit note and the ITC memo." : "Drafts the whole pack once the lot is awarded and dispatched."} /><div className="docgrid">{D.DOCS.map(d => <K.Skeleton key={d.id} h={132} r={20} />)}</div></div> :
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <Tile label="Invoice total" icon="receipt"><Money value={DOC("invoice").total} size="s" decimals /></Tile>
          <Tile label="GST credit kept" icon="badge-check"><Money value={DOC("itc").amount} size="s" decimals style={{ color: "var(--primary-text)" }} /></Tile>
          <Tile label="Things to chase" icon="list-checks"><span className="num s">0</span></Tile>
        </div>
        <Columns sideWidth={460}
          main={<><SectionTitle sub="Generated or not required, each with its reason" right={<span className="row tight"><Button variant="secondary" size="sm" icon="download" onClick={exportPack}>Export</Button>{h.reviewed ? <Badge tone="green" icon="check">reviewed</Badge> : <Button variant="primary" size="sm" icon="check" onClick={() => { Flow.act("review"); toast({ text: "Pack reviewed · logged", tone: "ok" }); }}>Mark reviewed</Button>}</span>}>Document pack</SectionTitle>
            <div className="docgrid">{D.DOCS.map(d => <div key={d.id} className={cx("docpick", sel === d.id && app.bp === "desktop" && "on")}><DocCard doc={d} onOpen={() => open(d.id)} /></div>)}</div>
            <Card className="row top" style={{ gap: 14, background: "var(--surface-2)" }}><span className="icontile"><Icon name="quote" size={17} /></span><div><p className="t-body" style={{ margin: 0 }}>Invoice, credit note, and the note showing we don't pay the GST credit back. First batch this year with nothing for me to chase.</p><span className="t-footnote subtle">Anita · finance</span></div></Card></>}
          side={app.bp === "desktop" ? <><SectionTitle sub="As filed">{DOC(sel).type}</SectionTitle><AnimatePresence mode="wait"><motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><Paper id={sel} /></motion.div></AnimatePresence></> : null} />
      </div>}
      <Sheet open={sheet} onClose={() => setSheet(false)} title={DOC(sel) ? DOC(sel).type : ""}><Paper id={sel} /></Sheet>
    </Screen>;
  }

  /* ---------- S6 Finance & ESG ---------- */
  // quarter-sized rupees read in lakh, the way an Indian finance team says them
  const Lakh = ({ value, style }) => <span className="num s money" style={style} aria-label={"₹" + (value / 1e5).toFixed(1) + " lakh"}><span className="cur" aria-hidden="true">₹</span><Roll value={value / 1e5} format={v => v.toFixed(1)} /><span aria-hidden="true" style={{ alignSelf: "flex-end", fontSize: "0.46em", fontWeight: 600, marginLeft: "0.2em", marginBottom: "0.16em", letterSpacing: 0 }}>lakh</span></span>;
  function Report({ me }) {
    const s = useStore(); const h = s.hero; const app = useApp(); const { toast } = useNotice(); const Q = D.QUARTER; const [view, setView] = useState("quarter");
    const exportBRSR = () => { download("BRSR-P6-waste-Q3-FY27.csv", csv([["Category", "Diverted (kg)", "Resold (kg)", "Donated (kg)", "Disposed (kg)", "Evidence"], ...Q.brsr.map(r => [r.cat, r.diverted, r.resold, r.donated, r.disposed, r.evidence]), ...(h.posted ? [["This batch MF-2409-117 (packaged food)", D.PLAN.kg, D.PLAN.kg, 0, 0, "INV/26-27/0931; ES-24117; 14 order logs; CN/0117"]] : [])])); toast({ text: "BRSR table exported as CSV", tone: "ok" }); };
    // quarter totals as the walkthrough reports them; CO₂e is computed from the kilos with the indicative factor
    const tiles = [["Recovered", "indian-rupee", <Lakh value={Q.recovered} style={{ color: "var(--primary-text)" }} />], ["GST credit protected", "badge-check", <Money value={Q.itc} size="s" roll />], ["Kept out of landfill", "leaf", <span className="num s"><Roll value={Q.kg / 1000} format={v => v.toFixed(1)} /> t</span>], ["CO₂e avoided", "cloud", <span className="num s"><Roll value={Q.co2 / 1000} format={v => v.toFixed(2)} /> t</span>, "indicative · 2.5 kg a kg"], ["Meals served", "heart-handshake", <span className="num s"><Roll value={Q.meals} format={v => fmt.num(Math.round(v))} /></span>]];
    return <Screen me={me} title="Finance & ESG" sub={`${Q.label} · Oct to Dec 2026 · one ledger, two readings`} actions={app.bp !== "phone" && <Segmented options={[{ id: "quarter", label: "Quarter" }, { id: "batch", label: "This batch" }]} value={view} onChange={setView} label="Period" />}>
      <div className="stack" style={{ gap: 20 }}>
        {app.bp === "phone" && <Segmented options={[{ id: "quarter", label: "Quarter" }, { id: "batch", label: "This batch" }]} value={view} onChange={setView} label="Period" />}
        {view === "quarter" ? <>
          {h.posted && <motion.button type="button" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="card row wrap" onClick={() => setView("batch")} style={{ padding: "12px 16px", gap: 12, textAlign: "left", boxShadow: "var(--shadow-1), 0 0 0 1.5px color-mix(in oklab, var(--primary) 40%, transparent)" }}><Product name="pack-chips" size={36} /><span className="grow t-subhead"><b>MF-2409-117 posted</b> · {fmt.inr(D.ACTUAL.net)} recovered · {fmt.kg(D.PLAN.kg)} out of landfill · BRSR row added</span><Badge tone="green" icon="check">ledger</Badge></motion.button>}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: app.bp === "phone" ? "repeat(2, minmax(0,1fr))" : "repeat(auto-fit, minmax(150px, 1fr))" }}>{tiles.map(([l, ic, v, foot]) => <Tile key={l} label={l} icon={ic} foot={foot}>{v}</Tile>)}</div>
          <p className="t-footnote subtle" style={{ margin: "-8px 0 0" }}>A synthetic quarter: the totals are the walkthrough's; the weekly split, the channel mix and the BRSR split below are illustrative.</p>
          <Columns sideWidth={380}
            main={<><SectionTitle sub="Illustrative weekly split of the quarter">Recovered against the would-be write-off</SectionTitle><Card><TrendChart weeks={Q.weeks} height={app.bp === "phone" ? 190 : 240} /></Card>
              <SectionTitle sub="Share of units by where they went · illustrative">Channel mix</SectionTitle><Card><MixBar mix={Q.mix} names={CH_NAMES} /></Card></>}
            side={<><SectionTitle>How the tax maths works</SectionTitle><Card className="stack snug t-subhead">
              <p style={{ margin: 0 }}><b>Destroying stock costs more than the stock.</b> You lose it at cost, reverse the GST input credit under Section 17(5)(h), pay to dispose of it, and owe EPR on the packaging.</p>
              <p style={{ margin: 0 }}><b>Selling it under a tax invoice keeps the credit.</b> That is why every routed batch protects its ITC, even at half the MRP.</p>
              <p style={{ margin: 0 }}><b>Donations are different.</b> Food given away free reverses its credit; the dashboard shows that cost and labels it indicative.</p>
              <div className="row tight wrap"><Badge size="sm" icon="info">EPR ₹6 a kg, indicative</Badge><Badge size="sm" icon="info">CO₂e 2.5 kg per kg, indicative</Badge></div>
            </Card>
            <Card className="row top" style={{ gap: 14, background: "var(--surface-2)" }}><span className="icontile"><Icon name="quote" size={17} /></span><div><p className="t-body" style={{ margin: 0 }}>5.7 tonnes kept out of landfill this quarter, with invoices behind every kilo. That goes straight into the annual report.</p><span className="t-footnote subtle">Vikram · sustainability</span></div></Card></>} />
          <SectionTitle sub="Principle 6, waste management · the quarter's 5.7 t, split illustrative" right={<Button variant="primary" size="sm" icon="download" onClick={exportBRSR}>Export BRSR table</Button>}>BRSR Core</SectionTitle>
          <DataTable rows={Q.brsr.map((r, i) => ({ ...r, id: "r" + i }))} columns={[{ key: "cat", label: "Category", render: r => <span className="strong">{r.cat}</span> }, { key: "diverted", label: "Diverted, kg", num: true, render: r => fmt.num(r.diverted) }, { key: "resold", label: "Resold", num: true, render: r => fmt.num(r.resold) }, { key: "donated", label: "Donated", num: true, render: r => fmt.num(r.donated) }, { key: "disposed", label: "Disposed", num: true, render: r => fmt.num(r.disposed) }, { key: "evidence", label: "Evidence", sortable: false, render: r => <span className="t-footnote muted">{r.evidence}</span> }]} />
        </> : <>
          {h.posted ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bezel"><div className="card raised stack" style={{ padding: app.bp === "phone" ? 18 : 26, gap: 16 }}>
            <div className="row between wrap" style={{ gap: 8 }}><span className="row tight"><Product name="pack-chips" size={48} /><span className="stack tight" style={{ gap: 0 }}><b>MF-2409-117 · Masala Chips 150 g</b><span className="t-footnote subtle">Rakesh Traders, Nagpur · closed Day 3</span></span></span><Badge tone="green" icon="check">posted to the ledger</Badge></div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: app.bp === "phone" ? "repeat(2, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))" }}>
              <Tile label="Recovered" icon="indian-rupee"><Money value={D.ACTUAL.net} size="s" roll from={0} style={{ color: "var(--primary-text)" }} /></Tile>
              <Tile label="GST credit kept" icon="badge-check"><Money value={D.PLAN.itcRetained} size="s" roll from={0} /></Tile>
              <Tile label="Out of landfill" icon="leaf"><span className="num s"><Roll value={D.PLAN.kg} format={v => v.toFixed(1)} /> kg</span></Tile>
              <Tile label="CO₂e avoided" icon="cloud"><span className="num s"><Roll value={D.PLAN.co2} format={v => fmt.num(Math.round(v))} /> kg</span></Tile>
            </div>
            <div className="stack tight"><b className="t-subhead">BRSR line</b><span className="mono t-footnote" style={{ padding: "10px 12px", borderRadius: 12, background: "var(--fill)" }}>{fmt.kg(D.PLAN.kg)} diverted from disposal · {fmt.num(D.PLAN.co2)} kg CO₂e avoided (indicative) · 0 meals (nothing donated)</span><span className="t-caption subtle">Evidence: INV/26-27/0931 · ES-24117 · 14 kirana order logs · CN/0117</span></div>
          </div></motion.div> : <Locked icon="book-open-check" agent="Impact agent" live={h.phase === "settled"} text={h.phase === "settled" ? "Posting the ledger and writing the BRSR row with evidence links." : "Posts this batch to the ledger once the paperwork is done."} />}
          <SectionTitle sub="Planned on the Route Room; actual after the negotiation">Money reading</SectionTitle>
          <MoneyPanel plan={D.PLAN} actual={h.award ? D.ACTUAL.net : undefined} compact={app.bp !== "desktop"} />
          {h.award && <Card className="row wrap" style={{ gap: 14 }}><span className="icontile violet"><Icon name="trending-down" size={17} /></span><div className="grow"><b>{fmt.inr2(D.ACTUAL.delta)} under plan</b><div className="t-footnote muted">ExpireSoon lot sold at ₹14.20 against ₹15.00 planned: {fmt.inr(D.ACTUAL.esPlanned)} became {fmt.inr2(D.ACTUAL.esActual)}. Kiranas came in as planned.</div></div></Card>}
        </>}
      </div>
    </Screen>;
  }

  Object.assign(window.SC3_SCREENS, { Paperwork, Report, Paper, download, csv });
})();

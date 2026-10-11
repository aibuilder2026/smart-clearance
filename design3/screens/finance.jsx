// Smart-Clearance v3 · Finance & ESG (SC-121, option A): one ledger with three readings, Money, GST and Impact, for a
// quarter or the year so far, and each cleared batch's own page with its money, its papers as Paperwork drafted them
// and its impact. Priya reads it all (SC-127). The papers (S5 Paperwork) are the batch page's Papers tab; the
// operator's batch page keeps Paperwork as one of its screens (SC-112)
(function () {
  const { useState, useEffect, useMemo, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Segmented, Sheet, Product, Empty, Money, Roll, Tile, MoneyPanel, DocCard, Menu, Avatar, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle, Locked } = S;
  const LG = () => window.SC3_LEDGER; // core/ledger.js, read when a screen draws
  const r2 = n => Math.round(n * 100) / 100;
  const W = D.WORKSPACE;
  const first = name => String(name || "").split(" ")[0];
  const possessive = name => (/s$/.test(name) ? `${name}'` : `${name}'s`);
  const amount = v => <span className="tnum" style={{ whiteSpace: "nowrap" }}>{v}</span>;
  const kg = n => fmt.kg(r2(n));
  // packets as cartons of `per` (core's model.ts cartons)
  const cartons = (u, per) => { const c = Math.floor(u / per), r = u % per; return r * 2 === per ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? "" : "s"}`; };
  const download = (name, text, type = "text/csv") => { const url = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const csv = rows => rows.map(r => r.map(c => { const v = String(c == null ? "" : c); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(",")).join("\n");
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

  // a page printed on its own: a hidden frame holds it, the browser's print dialog saves it as a PDF. `styles` copies
  // the app's stylesheets in, so a paper prints as it shows, on the light theme
  function printPage(title, body, { styles = false } = {}) {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true"); f.tabIndex = -1; f.title = title;
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(f);
    const head = styles ? [...document.querySelectorAll('link[rel="stylesheet"], style')].map(n => n.outerHTML).join("") : "";
    const base = `<style>body{margin:0;padding:28px;background:#fff;color:#1d1d1b;font:14px/1.5 system-ui,sans-serif}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:22px 0 8px}p{margin:4px 0;color:#4a4a45}table{width:100%;border-collapse:collapse;margin:6px 0 14px;font-size:12.5px}th,td{text-align:left;padding:5px 6px;border-bottom:1px solid #e3e0d6;vertical-align:top}th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#5a5a55}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}tr.total td{font-weight:700;border-top:1.5px solid #1d1d1b}.paper{box-shadow:none!important;max-width:760px;margin:0 auto}@page{size:A4;margin:14mm}</style>`;
    const d = f.contentDocument;
    d.open(); d.write(`<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><title>${esc(title)}</title><base href="${esc(document.baseURI)}">${head}${base}</head><body>${body}</body></html>`); d.close();
    let done = false;
    const go = () => { if (done) return; done = true; try { f.contentWindow.focus(); f.contentWindow.print(); } finally { setTimeout(() => f.remove(), 1500); } };
    f.addEventListener("load", go); setTimeout(go, 1200);
  }

  /* ---------- the papers, set on paper ---------- */
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

  /* ---------- the signatures (SC-174, option A): each signatory's specimen signature in ink, over the firm's rubber
     stamp (a distributor's rectangle, the signature between its lines) or beside its round seal (a company's, an
     agency's); from the signature maker (system/img/signatures, system/img/seals). A name with no specimen on file (a
     witness he named who is not on the agency's panel) signs on the agency's original, and the paper says so ---------- */
  const SIGN_SRC = id => `${window.SC3_IMG}signatures/${id}.webp`, SEAL_SRC = id => `${window.SC3_IMG}seals/${id}.webp`;
  function Ink({ who, seal, stamp = "round", h = 46 }) {
    if (!who) return null;
    if (!who.sign) return <span className="sig-none">signed on the agency's original</span>;
    return <span className={cx("sig-ink", seal && "sealed", stamp)} style={{ "--h": `${h}px` }}>
      {seal && <img className="sig-seal" src={SEAL_SRC(seal)} alt="" aria-hidden="true" />}<img className="sig-hand" src={SIGN_SRC(who.sign)} alt={`Signed by ${who.name}`} /></span>;
  }
  // the Tally papers' signatory block: for the firm, the signature and stamp, "Authorised Signatory", who signed
  const TallySign = ({ firm, who, seal, stamp }) => <><div className="tl-sign">for <b>{firm}</b></div>{who && <div className="tl-signed"><Ink who={who} seal={seal} stamp={stamp} /></div>}<div className="tl-num">Authorised Signatory</div>{who && <div className="tl-signer">{who.name}, {who.title}</div>}</>;
  // the app's own papers (the GST memo, the FSSAI checklist): signed at their foot for the client
  const PpSign = ({ firm, who, seal }) => (who ? <div className="pp-sign"><span className="pp-sign-for">for <b>{firm}</b></span><Ink who={who} seal={seal} /><span className="pp-sign-who">{who.name}, {who.title}</span></div> : null);
  const sealOf = p => (p && p.signatory ? p.signatory.seal : null);

  /* ---------- the GST papers in Tally's layout (SC-148, option B): the tax invoice with its e-invoice, the credit notes.
     Bordered blocks side by side where there is room, stacked on a phone; the PDF is the same paper on A4. The IRN,
     acknowledgement and signed QR are worked out from the issued invoice and its parties (core/papers.js) ---------- */
  const PA = () => window.SC3_PAPERS;
  // when the tax invoice was issued from Tally: the live workspace's paper says so, a history batch on its invoice step,
  // the story's once Rakesh bhai issues it
  const issuedWhen = (c, inv, st) => (!inv ? null : inv.status === "issued" ? inv.issuedAt || `${inv.date}T11:00` : c.history ? c.invoiceIssuedAt || null : st && st.hero.invoiceIssued ? `${inv.date}T11:00` : null);
  const n2 = n => (n < 0 ? "-" : "") + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dmy = iso => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");
  const Cell = ({ k, children, className }) => <div className={cx("tl-cell", className)}>{k && <em>{k}</em>}{children}</div>;
  const Party = ({ k, p, extra }) => <Cell k={k}><b>{p.name}</b><br />{p.address}<br />GSTIN/UIN: {p.gstin || "Unregistered"}<br />State Name: {p.state}, Code: {p.stateCode}{extra}</Cell>;
  function SignedQR({ text }) { const q = PA().qrPath(PA().qr(text, "L")); return <svg viewBox={q.viewBox} role="img" aria-label="The e-invoice's signed QR code" shapeRendering="crispEdges"><rect width="100%" height="100%" fill="#fff" /><path d={q.d} fill="#111" /></svg>; }
  // the tax invoice the distributor issues from Tally for the ExpireSoon lot: inter-state, so IGST; once issued, its
  // e-invoice block (a B2B supply by a distributor over ₹5 crore of turnover)
  function TallyInvoice({ c, inv, issuedAt }) {
    const R = c.dist, B = c.buyer, sku = c.sku, inter = R.stateCode !== B.stateCode, lot = c.listing ? c.listing.id : (c.numbers && c.numbers.listing) || "";
    const e = issuedAt ? PA().einvoice({ no: inv.no, date: inv.date, issuedAt, total: inv.total, hsn: sku.hsn }, R, B) : null;
    const tax = inter ? [[`IGST @ ${inv.gstPct}%`, inv.igst]] : [[`CGST @ ${inv.gstPct / 2}%`, inv.igst / 2], [`SGST @ ${inv.gstPct / 2}%`, inv.igst / 2]];
    const token = c.award && c.award.token;
    return <div className="paper tl">
      <div className="tl-title">Tax Invoice</div>
      <div className="tl-copy">{e ? "(ORIGINAL FOR RECIPIENT)" : `(DRAFT, for ${R.short || R.name} to issue from Tally)`}</div>
      {e ? <div className="tl-grid"><Cell className="tl-einv"><div><b>e-Invoice</b><br /><span className="tl-small">IRN:</span> <span className="tl-mono">{e.irn}</span><br /><b>Ack No.:</b> {e.ackNo} &nbsp; <b>Ack Date:</b> {dmy(e.ackDate.slice(0, 10))} {e.ackDate.slice(11, 16)}<br /><span className="tl-small">Signed QR code from the Invoice Registration Portal (its signature illustrative)</span></div><SignedQR text={e.signed} /></Cell></div>
        : <div className="tl-grid"><Cell><b>e-Invoice</b> <span className="tl-small">· the IRN and the signed QR code come from the Invoice Registration Portal once {R.short || R.name} issues it</span></Cell></div>}
      <div className="tl-grid tl-two">
        <Party p={R} extra={<>{R.fssai && <><br />FSSAI Lic. No.: {R.fssai}</>}{R.email && <><br />E-Mail: {R.email}</>}</>} />
        <div className="tl-meta">
          <Cell k="Invoice No."><b>{inv.no}</b></Cell><Cell k="Dated"><b>{dmy(inv.date)}</b></Cell>
          <Cell k="Delivery Note">{lot}</Cell><Cell k="Mode/Terms of Payment">{token ? `Token ₹${M.fmt.num(token)} paid; balance in ${D.MARKET.balanceHours} h` : `Balance in ${D.MARKET.balanceHours} h`}</Cell>
          <Cell k="Buyer's Order No.">ExpireSoon lot {lot}</Cell><Cell k="Dated">{dmy(inv.date)}</Cell>
          <Cell k="Dispatched through">Buyer's own truck</Cell><Cell k="Destination">{B.city}</Cell>
        </div>
      </div>
      <div className="tl-grid tl-two">
        <Party k="Consignee (Ship to)" p={B} />
        <Cell k="Terms of Delivery" className="tl-tall">Ex-godown, {R.godown}, {R.city}<em style={{ marginTop: 8 }}>Reverse charge</em>No<em style={{ marginTop: 8 }}>E-way bill</em>{inv.total < M.RULES.ewayThreshold ? `Not required: the consignment is under ₹${M.fmt.num(M.RULES.ewayThreshold)}` : "Generated with the dispatch"}</Cell>
        <Party k="Buyer (Bill to)" p={B} extra={<><br />Place of Supply: {B.state} ({B.stateCode})</>} />
      </div>
      <table className="tl-table tl-items"><thead><tr><th>Sl</th><th>Description of Goods</th><th>HSN/SAC</th><th>Quantity</th><th>Rate</th><th>per</th><th>Amount</th></tr></thead><tbody>
        <tr><td>1</td><td><b>{sku.brand} {sku.name}</b><br /><span className="tl-small">Batch {c.batch.id} · best before {dmy(c.batch.bestBefore)} · MRP ₹{sku.mrp.toFixed(2)} a pack, incl. of all taxes</span>{tax.map(([k]) => <div key={k} className="tl-num" style={{ marginTop: 6 }}><b>{k}</b></div>)}<div className="tl-num">Round off</div></td>
          <td>{sku.hsn}</td><td className="tl-num"><b>{M.fmt.num(inv.units)} PCS</b></td><td className="tl-num">{inv.price.toFixed(2)}</td><td>PCS</td>
          <td className="tl-num">{n2(inv.taxable)}{tax.map(([k, v]) => <div key={k} style={{ marginTop: 6 }}><b>{n2(v)}</b></div>)}<div>{n2(inv.roundOff)}</div></td></tr>
        <tr><td /><td className="tl-num"><b>Total</b></td><td /><td className="tl-num"><b>{M.fmt.num(inv.units)} PCS</b></td><td /><td /><td className="tl-num"><b>₹ {n2(inv.total)}</b></td></tr>
        <tr><td colSpan={7}>Amount Chargeable (in words)<br /><b>{PA().words(inv.total)}</b></td></tr>
      </tbody></table>
      <table className="tl-table"><thead><tr><th>HSN/SAC</th><th>Taxable Value</th>{tax.map(([k]) => <th key={k}>{k.split(" @")[0]} · Rate</th>)}{tax.map(([k]) => <th key={k + "a"}>Amount</th>)}<th>Total Tax</th></tr></thead><tbody>
        <tr><td>{sku.hsn}</td><td className="tl-num">{n2(inv.taxable)}</td>{tax.map(([k]) => <td key={k} className="tl-num">{k.split("@ ")[1]}</td>)}{tax.map(([k, v]) => <td key={k + "a"} className="tl-num">{n2(v)}</td>)}<td className="tl-num">{n2(inv.igst)}</td></tr>
        <tr><td colSpan={2 + tax.length * 2 + 1}>Tax Amount (in words): <b>{PA().words(inv.igst)}</b></td></tr>
      </tbody></table>
      <div className="tl-grid tl-two">
        <Cell>Company's PAN: <b>{R.pan}</b><em style={{ marginTop: 8 }}>Declaration</em>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods sold within their best-before date, under the brand's one-time permission.</Cell>
        <Cell k="Company's Bank Details">{R.bank ? <>Bank Name: {R.bank.name}<br />A/c No.: {R.bank.account}<br />Branch &amp; IFS Code: {R.bank.ifsc}</> : null}<TallySign firm={R.name} who={e ? R.signatory : null} seal={sealOf(R)} stamp="rect" /></Cell>
      </div>
      <div className="tl-foot">SUBJECT TO {(R.city || "").toUpperCase()} JURISDICTION{e ? "" : ` · A draft: ${R.short || R.name} signs it as it is issued`}</div>
    </div>;
  }
  // the tax invoice the distributor issues from Tally for one shop's scheme order (SC-153): a B2C supply within the
  // state, so CGST and SGST and no IRN; every packet at the pack price, less the scheme's discount (money.js
  // kiranaInvoice). `inv` is the order's invoice with its shop; `c` the batch's case
  function KiranaInvoice({ c, inv }) {
    const R = c.dist, k = inv.shop, sku = c.sku, half = inv.gstPct / 2, sc = M.RULES.scheme;
    const rows = [[`Less: Scheme discount, buy ${sc.buy} get ${sc.free} free`, `${n2(inv.discountPct)}%`, -inv.discount], [`CGST @ ${half}%`, "", inv.cgst], [`SGST @ ${half}%`, "", inv.sgst], ["Round off", "", inv.roundOff]];
    return <div className="paper tl">
      <div className="tl-title">Tax Invoice</div>
      <div className="tl-copy">(ORIGINAL FOR RECIPIENT)</div>
      <div className="tl-grid tl-two">
        <Party p={R} extra={<>{R.fssai && <><br />FSSAI Lic. No.: {R.fssai}</>}{R.email && <><br />E-Mail: {R.email}</>}</>} />
        <div className="tl-meta">
          <Cell k="Invoice No."><b>{inv.no}</b></Cell><Cell k="Dated"><b>{dmy(inv.date)}</b></Cell>
          <Cell k="Buyer's Order No.">Scheme order, {inv.at.slice(11, 16)}</Cell><Cell k="Mode/Terms of Payment">Cash on delivery</Cell>
          <Cell k="Dispatched through">Own van, the scheme's round</Cell><Cell k="Destination">{k.area}</Cell>
        </div>
      </div>
      <div className="tl-grid tl-two">
        <Cell k="Buyer (Bill to and Ship to)"><b>{k.name}</b><br />{k.area}, {R.city}{k.pincode ? ` ${k.pincode}` : ""}, {R.state}<br />GSTIN/UIN: Unregistered<br />State Name: {R.state}, Code: {R.stateCode}<br />Place of Supply: {R.state} ({R.stateCode})</Cell>
        <Cell k="Terms of Delivery">Door delivery on the van round<em style={{ marginTop: 8 }}>Reverse charge</em>No<em style={{ marginTop: 8 }}>E-way bill</em>Not required: within {R.city}, under ₹{M.fmt.num(M.RULES.ewayThreshold)}</Cell>
      </div>
      <table className="tl-table tl-items"><thead><tr><th>Sl</th><th>Description of Goods</th><th>HSN/SAC</th><th>Quantity</th><th>Rate</th><th>per</th><th>Amount</th></tr></thead><tbody>
        <tr><td>1</td><td><b>{sku.brand} {sku.name}</b><br /><span className="tl-small">Batch {c.batch.id} · best before {dmy(c.batch.bestBefore)} · MRP ₹{sku.mrp.toFixed(2)} a pack, incl. of all taxes</span></td>
          <td>{inv.hsn || sku.hsn}</td><td className="tl-num"><b>{M.fmt.num(inv.units)} PCS</b></td><td className="tl-num">{inv.rate.toFixed(2)}</td><td>PCS</td><td className="tl-num">{n2(inv.gross)}</td></tr>
        {rows.map(([t, pct, v]) => <tr key={t} className="tl-sub"><td /><td className="tl-right"><b>{t}</b></td><td /><td /><td className="tl-num">{pct}</td><td /><td className="tl-num">{n2(v)}</td></tr>)}
        <tr><td /><td className="tl-num"><b>Total</b></td><td /><td className="tl-num"><b>{M.fmt.num(inv.units)} PCS</b></td><td /><td /><td className="tl-num"><b>₹ {n2(inv.total)}</b></td></tr>
        <tr><td colSpan={7}>Amount Chargeable (in words)<br /><b>{PA().words(inv.total)}</b></td></tr>
      </tbody></table>
      <table className="tl-table"><thead><tr><th>HSN/SAC</th><th>Taxable Value</th><th>CGST · Rate</th><th>Amount</th><th>SGST · Rate</th><th>Amount</th><th>Total Tax</th></tr></thead><tbody>
        <tr><td>{inv.hsn || sku.hsn}</td><td className="tl-num">{n2(inv.taxable)}</td><td className="tl-num">{half}%</td><td className="tl-num">{n2(inv.cgst)}</td><td className="tl-num">{half}%</td><td className="tl-num">{n2(inv.sgst)}</td><td className="tl-num">{n2(inv.tax)}</td></tr>
        <tr><td colSpan={7}>Tax Amount (in words): <b>{PA().words(inv.tax)}</b></td></tr>
      </tbody></table>
      <div className="tl-grid tl-two">
        <Cell>Company's PAN: <b>{R.pan}</b><em style={{ marginTop: 8 }}>Declaration</em>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Sold under {W.short}'s scheme, within the best-before date.</Cell>
        <Cell k="Company's Bank Details">{R.bank ? <>Bank Name: {R.bank.name}<br />A/c No.: {R.bank.account}<br />Branch &amp; IFS Code: {R.bank.ifsc}</> : null}<TallySign firm={R.name} who={R.signatory} seal={sealOf(R)} stamp="rect" /></Cell>
      </div>
      <div className="tl-foot">SUBJECT TO {(R.city || "").toUpperCase()} JURISDICTION</div>
    </div>;
  }
  // a batch's invoices to its shops as Tally's sales register: a row each, its number opening the invoice, and the
  // totals; the taxable value is what the scheme sold
  function KiranaRegister({ c, list, onOpen }) {
    const R = c.dist, add = k => r2(list.reduce((t, x) => t + x[k], 0)), kl = c.lines.kirana;
    return <div className="paper tl tl-reg">
      <div className="tl-title">Sales Register</div>
      <div className="tl-copy">{R.name} · tax invoices to kiranas · {c.sku.brand} {c.sku.name}, batch {c.batch.id}</div>
      <table className="tl-table"><thead><tr><th>Date</th><th>Invoice No.</th><th>Particulars</th><th>Packs</th><th>Taxable</th><th className="tl-gst">CGST</th><th className="tl-gst">SGST</th><th>Total</th></tr></thead><tbody>
        {list.map(x => <tr key={x.no}><td className="tl-num">{dmy(x.date).slice(0, 5)}</td><td>{onOpen ? <button type="button" className="tl-link" onClick={() => onOpen(x)}>{x.no}</button> : x.no}</td><td>{x.shop.name}</td><td className="tl-num">{x.units}</td><td className="tl-num">{n2(x.taxable)}</td><td className="tl-num tl-gst">{n2(x.cgst)}</td><td className="tl-num tl-gst">{n2(x.sgst)}</td><td className="tl-num">{n2(x.total)}</td></tr>)}
        <tr><td colSpan={3}><b>{list.length} {list.length === 1 ? "invoice" : "invoices"}</b></td><td className="tl-num"><b>{M.fmt.num(add("units"))}</b></td><td className="tl-num"><b>{n2(add("taxable"))}</b></td><td className="tl-num tl-gst"><b>{n2(add("cgst"))}</b></td><td className="tl-num tl-gst"><b>{n2(add("sgst"))}</b></td><td className="tl-num"><b>{n2(add("total"))}</b></td></tr>
      </tbody></table>
      <div className="tl-foot">The taxable value is what the scheme sold: {M.fmt.num(add("units"))} packets at ₹{kl.price.toFixed(2)} effective</div>
    </div>;
  }
  // Munchly's credit notes to the distributor, in the same layout: financial, so no GST is adjusted and nothing goes to
  // the IRP; against the invoice it billed the batch on (core/papers.js dispatchOf)
  function TallyCredit({ c, d, title, sub, reason, rows, note, after }) {
    const C = D.CLIENT, R = c.dist, against = PA().dispatchOf(c.batch);
    return <div className="paper tl">
      <div className="tl-title">{title}</div><div className="tl-copy">({sub})</div>
      <div className="tl-grid tl-two">
        <Cell><b>{C.name}</b><br />{C.address}<br />GSTIN/UIN: {C.gstin}<br />State Name: {C.state}, Code: {C.stateCode}<br />CIN: {C.cin}<br />FSSAI Lic. No.: {C.fssai}</Cell>
        <div className="tl-meta">
          <Cell k="Credit Note No."><b>{d.no}</b></Cell><Cell k="Dated"><b>{dmy(d.date)}</b></Cell>
          <Cell k="Against our invoice" className="tl-span"><b>{against.no}</b> dated {dmy(against.date)}<br />Batch {c.batch.id}, {c.sku.brand} {c.sku.name}</Cell>
        </div>
      </div>
      <div className="tl-grid tl-two"><Party k="Issued to" p={R} /><Cell k="Reason">{reason}</Cell></div>
      <table className="tl-table"><thead><tr><th>Sl</th><th>Particulars</th><th>Packs</th><th>Rate</th><th>Amount</th></tr></thead><tbody>
        {rows.map((r, i) => <tr key={i}><td>{i + 1}</td><td>{r.k}</td><td className="tl-num">{r.units != null ? M.fmt.num(r.units) : ""}</td><td className="tl-num">{r.rate != null ? n2(r.rate) : ""}</td><td className="tl-num">{n2(r.amount)}</td></tr>)}
        {d.roundOff ? <tr><td /><td className="tl-num">Round off</td><td /><td /><td className="tl-num">{n2(d.roundOff)}</td></tr> : null}
        <tr><td /><td className="tl-num"><b>Credit to {R.name}</b></td><td /><td /><td className="tl-num"><b>₹ {n2(d.amount)}</b></td></tr>
        <tr><td colSpan={5}>Amount (in words): <b>{PA().words(d.amount)}</b></td></tr>
      </tbody></table>
      <div className="tl-grid tl-two">
        <Cell className="tl-small">Financial credit note: not a GST credit note under section 34 of the CGST Act, so no tax is adjusted and it is not reported to the IRP. The output tax on the original sale stands.{note ? <><br /><br />{note}</> : null}<br /><br />Company's PAN: <b>{C.pan}</b></Cell>
        <Cell><TallySign firm={C.name} who={C.signatory} seal={sealOf(C)} /></Cell>
      </div>
      {after}
      <div className="tl-foot">Adjusted against {possessive(R.name)} account</div>
    </div>;
  }

  /* ---------- the certificate of destruction in full (SC-174, option B) ---------- */
  // page 1, the certificate: the goods, the reason, the agency's method, the facility, the day and the window, with its
  // supervising officer's and two independent witnesses' signatures and the agency's seal, who handed the packs over and
  // whose yes approved the evidence; page 2, the destruction log from the godown to the cover, with the two photos,
  // initialled at every step by all three
  const hhmm = t => (t || "").slice(11, 16), kg2 = n => `${(Math.round((n || 0) * 100) / 100).toFixed(2)} kg`;
  const cartonsOf = (u, per) => { const n = Math.floor(u / per), r = u % per; return !per ? "" : r ? `${n} cartons of ${per} and ${r} loose` : `${n} cartons of ${per}`; };
  const certPhoto = (c, d, w) => { const p = d.photos && d.photos[w]; if (!p) return null; if (p.url) return p.url; return `${window.SC3_IMG}evidence/${LG().record.evidenceFile(c.batch.id, w, p)}`; };
  function Certificate({ d, c }) {
    const R = c.dist, F = d.for || { name: R.name, gstin: R.gstin, address: R.address };
    if (d.status !== "generated") return <div className="paper pp">
      <div className="pp-head"><div><div className="pp-title">Destruction certificate</div><div className="pp-no">{c.batch.id} · {R.name}</div></div><span className="pp-stamp">AWAITING</span></div>
      <div className="pp-sub">For {R.name}, {R.address} · GSTIN {R.gstin}</div>
      <Line k={`${c.sku.brand} ${c.sku.name}`} sub={`HSN ${c.sku.hsn} · batch ${c.batch.id} · best before ${fmt.date(c.batch.bestBefore)}`} v={`${fmt.num(d.units)} packs`} strong />
      <Line k="Input GST he will reverse" sub="section 17(5)(h)" v={fmt.inr2(d.reversed)} />
      <p className="pp-note">Issued by the authorised agency once {W.short} approves the destruction's evidence: two photos, the agency's certificate number, the time and its two witnesses.</p></div>;
    const food = r2((d.kg || 0) - (d.packKg || 0)), fac = d.facility || { name: d.site, address: "", gps: "" }, on = d.destroyedOn || (d.destroyedAt || "").slice(0, 10);
    const win = d.window || { from: "", to: hhmm(d.destroyedAt) }, sigs = [["officer", "Supervising officer", d.officer], ["w1", "Independent witness 1", (d.witnesses || [])[0]], ["w2", "Independent witness 2", (d.witnesses || [])[1]]];
    const kv = [["Goods", `${d.goods || `${c.sku.brand} ${c.sku.name}`}, HSN ${d.hsn || c.sku.hsn}, MRP ₹${Number(d.mrp || c.sku.mrp).toFixed(2)}`],
      ["Batch No.", `${d.batch || c.batch.id} (made ${fmt.date(d.mfg || c.batch.mfg)}, best before ${fmt.date(d.bestBefore || c.batch.bestBefore)})`, true],
      ["Quantity", `${fmt.num(d.units)} packs${d.perCarton ? `, ${cartonsOf(d.units, d.perCarton)}` : ""}`],
      ["Total weight", `${kg2(d.kg)} (${kg2(food)} food, ${kg2(d.packKg || 0)} packaging), weighed at the facility`],
      ["Owner", `${F.name}, GSTIN ${F.gstin}`],
      ["Reason", "Product expiry: unsold on the best-before"],
      ["Method", `${d.methodName || d.method} (Solid Waste Management Rules, 2016)`],
      ["Facility", [fac.name, fac.address].filter(Boolean).join(", ") + (fac.gps ? ` · ${fac.gps}` : "")],
      ["Date and time", `${fmt.date(on)}, ${win.from} to ${win.to} IST`],
      ["GST", `${fmt.inr2(d.reversed)} reversed by ${F.name}, s.17(5)(h)`]];
    const initials = [d.officer, ...(d.witnesses || [])].filter(Boolean);
    return <div className="cert-pages">
      <div className="paper cert">
        <div className="cert-lh"><div><b>{(d.agency || "").toUpperCase()}</b><span>Authorised waste-management agency · authorisation {d.auth}</span></div><span className="pp-stamp ok">DESTROYED</span></div>
        <div className="cert-t">Certificate of Destruction</div>
        <div className="cert-m"><span>No. <b>{d.no}</b></span><span>Dated <b>{dmy(on)}</b></span><span>Page 1 of 2</span></div>
        <dl className="cert-kv">{kv.map(([k, v, mono]) => <Fragment key={k}><dt>{k}</dt><dd className={mono ? "mono" : ""}>{v}</dd></Fragment>)}</dl>
        <div className="cert-sec">Signed at the facility, as set out in the log overleaf</div>
        <div className="cert-sigs">{sigs.map(([k, label, w]) => <div key={k} className="cert-sig"><span className="cert-k">{label}</span><div className="cert-ink">{w ? <Ink who={w} seal={k === "officer" ? d.seal : null} h={40} /> : null}</div><b>{w ? w.name : "—"}</b><span>{k === "officer" ? (w ? `${w.title}, ${d.agency}` : "") : w ? w.address : ""}</span>{w && w.proof && <span className="mono">{w.proof}</span>}</div>)}</div>
        <div className="cert-hand">
          <div><span className="cert-k">Goods handed over by</span>{d.handedBy && <div className="cert-ink"><Ink who={d.handedBy} h={34} /></div>}<b>{d.handedBy ? d.handedBy.name : F.name}</b><span>{d.handedBy ? `${d.handedBy.title}, ${F.name}` : ""}</span></div>
          <div><span className="cert-k">Evidence approved by</span><b>{d.approvedBy}</b><span>for {D.CLIENT.name}, {recWhen(d.approvedAt)}</span><span className="muted">two photos · Vision's checks {d.evidence ? `${d.evidence.checks} of ${d.evidence.of}` : ""}</span></div>
        </div>
      </div>
      {d.log && <div className="paper cert">
        <div className="cert-m"><span><b>Destruction log</b> · {d.no}</span><span>Page 2 of 2</span></div>
        <table className="cert-log"><thead><tr><th>Time</th><th>Step</th><th>Detail</th><th>Initials</th></tr></thead><tbody>
          {d.log.map(x => <tr key={x.step}><td className="mono">{hhmm(x.at)}</td><td><b>{x.step}</b></td><td>{x.detail}{x.photo && certPhoto(c, d, x.photo) && <span className="cert-ph"><S.Photo src={certPhoto(c, d, x.photo)} alt={x.photo === "before" ? "The packs at the godown, the carton's batch label in view" : "The packs at the landfill, the slate in view"} loading="lazy" /></span>}</td>
            <td className="cert-ini">{initials.map(w => (w.sign ? <img key={w.name} src={SIGN_SRC(w.sign)} alt={`Initialled by ${w.name}`} /> : <span key={w.name} className="cert-ini-none">{w.name.split(" ").map(x => x[0]).join("")}</span>))}</td></tr>)}</tbody></table>
        <p className="cert-note">Initialled at each step by the supervising officer and the two independent witnesses, who watched it from receipt to cover.</p>
      </div>}
    </div>;
  }

  /* ---------- the staff sale's consolidated receipt (SC-174, option A) ---------- */
  // what Vision read of it: the payments, their total and span, and whether it is what was counted; the UPI references
  // on request. `whose`: "your" for the distributor, else the count is the distributor's
  function ReceiptRead({ r, count, price, src, whose }) {
    const [open, setOpen] = useState(false); const ok = Math.abs(r.paid - count * price) < 0.5;
    return <div className={cx("rcpt-read", ok ? "ok" : "bad")}>
      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        {src && <span className="rcpt-thumb"><S.Photo src={src} alt={`The consolidated receipt ${r.no}`} /></span>}
        <div className="stack tight grow" style={{ gap: 4, minWidth: 0 }}>
          <span className="t-caption subtle">Vision read {r.no}</span>
          <b>{r.payments.length} UPI payments · {fmt.inr2(r.paid)}</b>
          <span className="t-footnote muted">{recWhen(r.from)} to {recWhen(r.to)}</span>
          {ok ? <span className="rcpt-tick"><Icon name="check" size={14} stroke={2.4} />{fmt.num(count)} packs × ₹{price} · matches {whose === "your" ? "your" : "the"} count</span>
            : <span className="rcpt-tick bad"><Icon name="triangle-alert" size={14} stroke={2.2} />{fmt.inr2(r.paid)} is {fmt.num(Math.floor(r.paid / price + 1e-9))} packs at ₹{price}, not {fmt.num(count)}</span>}
        </div></div>
      <button type="button" className="pt-link t-footnote" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"} the {r.payments.length} UPI references</button>
      {open && <ol className="rcpt-refs" tabIndex={0} aria-label={`The ${r.payments.length} UPI references`}>{r.payments.map(x => <li key={x.rrn}><span className="mono">{x.rrn}</span><span>{x.who}</span><span className="tnum">{x.units} × ₹{price}</span></li>)}</ol>}
    </div>;
  }
  // the receipt as a paper of the pack: the photo he sent, and its payments as Vision read them
  function StaffReceiptPaper({ r, dist, sku, price }) {
    const src = r.url || (r.file ? window.SC3_IMG + r.file : null);
    return <div className="paper pp">
      <div className="pp-head"><div><div className="pp-title">Staff sale receipt</div><div className="pp-no">{r.no} · {dist.name}</div></div><span className="pp-stamp ok">READ</span></div>
      <div className="pp-sub">The consolidated receipt {dist.short} sent with the staff sale, and what Vision read from it</div>
      {src && <div className="rcpt-photo"><S.Photo src={src} alt={`The consolidated receipt ${r.no}, as ${dist.short} sent it`} /></div>}
      <Line k="UPI payments" sub={`${recWhen(r.from)} to ${recWhen(r.to)}`} v={fmt.num(r.payments.length)} />
      <Line k="Packs sold to staff" sub={`${sku.brand} ${sku.name} at ₹${price.toFixed(2)}`} v={fmt.num(r.units)} />
      <Line k="Received by UPI" v={fmt.inr2(r.paid)} strong />
      <table className="pp-table rcpt-table"><thead><tr><th>UPI Ref. No.</th><th>Paid by</th><th>When</th><th>Packs</th><th>₹</th></tr></thead>
        <tbody>{r.payments.map(x => <tr key={x.rrn}><td className="pp-mono">{x.rrn}</td><td>{x.who}</td><td>{recWhen(x.at)}</td><td>{x.units}</td><td>{fmt.inr2(x.amount)}</td></tr>)}</tbody></table>
      <p className="pp-note">Each payment's UPI reference is its receipt to the staff member who paid. {dist.short} signed the receipt; it is the staff sale's evidence among {possessive(W.short)} papers.</p>
    </div>;
  }

  // a paper of a batch's pack (`c`, the batch's case: the story's chips batch, or a batch from the history). Each
  // reads what its batch did: the lines it ran, the credit kept and reversed, the packs given away or destroyed
  const stamp = t => (!t ? "" : t.length > 5 ? `${fmt.day(t.slice(0, 10))}, ${t.slice(11, 16)}` : t);
  function Paper({ id, c: given }) {
    const st = useStore(); const c = given || LG().storyCase(st);
    const DOC = x => c.docs.find(d => d.id === x); const d = DOC(id); const inv = c.invoice || DOC("invoice"); const R = c.dist, B = c.buyer, dp = c.sku.dp, sp = c.support;
    const head = (title, no, stamp, ok) => <div className="pp-head"><div><div className="pp-title">{title}</div><div className="pp-no">{no}</div></div><span className={cx("pp-stamp", ok && "ok")}>{stamp}</span></div>;
    // issued from Tally: by the story's Rakesh bhai, on a history batch's invoice step, or on the live workspace (SC-148)
    const issuedAt = issuedWhen(c, inv, st);
    if (id === "invoice" && inv) return <TallyInvoice c={c} inv={inv} issuedAt={issuedAt} />;
    if (id === "eway" && inv) return <div className="paper pp">{head("E-way bill check", `${c.batch.id} · ${c.listing ? c.listing.id : ""}`, "NOT REQUIRED", true)}<Line k="Supplier" sub={`GSTIN ${R.gstin}`} v={R.name} /><Line k="Recipient" sub={`GSTIN ${B.gstin}`} v={B.name} /><Line k="Consignment value with GST" v={fmt.inr2(inv.total)} /><Line k="Threshold, inter-state" v={fmt.inr2(M.RULES.ewayThreshold)} /><Line k="E-way bill" v="not required" strong /><p className="pp-note">{d.note} A transporter note travels with the {cartons(c.lines.expiresoon.units, c.sku.perCarton)} on the buyer's truck instead.</p></div>;
    if (id === "support") { const order = ["expiresoon", "kirana", "staff", "foodbank"]; const kRow = sp.rows.find(r => r.id === "kirana"); const kl = c.lines.kirana;
      const rows = sp.rows.slice().sort((a, z) => order.indexOf(a.id) - order.indexOf(z.id)).map(r => r.id === "expiresoon" ? { k: `ExpireSoon: ${fmt.num(r.units)} packs sold at ₹${r.price.toFixed(2)}, ₹${r.gap.toFixed(2)} under the dealer price`, units: r.units, rate: r.gap, amount: r.amount }
        : r.id === "kirana" ? { k: `Kirana scheme: ${fmt.num(r.units)} packs to ${c.kiranas.length} kiranas at ₹${kl.price} effective, free packs included`, units: r.units, rate: r.gap, amount: r.amount }
        : { k: `${r.short.charAt(0).toUpperCase() + r.short.slice(1)}: ${fmt.num(r.units)} packs at ₹${r.price.toFixed(2)}, ₹${r.gap.toFixed(2)} under the dealer price`, units: r.units, rate: r.gap, amount: r.amount });
      if (kRow) rows.push({ k: "Van round, the scheme's deliveries", units: kRow.units, rate: M.RULES.vanPerUnit, amount: sp.van });
      if (sp.fee) rows.push({ k: "ExpireSoon listing fee", amount: sp.fee });
      return <TallyCredit c={c} d={Object.assign({ date: inv && inv.date }, d, { roundOff: d.roundOff || 0 })} title="Credit Note" sub="Price support · financial, no GST adjusted" rows={rows}
        reason={`Price support on the batch's clearance: the gap to the dealer price of ₹${dp} a pack on what each exit sold, and the costs ${R.short || R.name} met. It covers the buy-${c.scheme.buy}-get-${c.scheme.free} scheme too, instead of an expiry claim of ${fmt.inr(c.claim.total)}.`} />; }
    // the credit kept on what was sold under tax invoices, and reversed on what was given away or destroyed (SC-122);
    // an SKU with no cost sheet of its own has its credit worked out as cost × GST, so it is estimated
    if (id === "itc") { const away = d.away != null ? d.away : (c.plan.donated || 0) + (c.plan.leftover || 0), sold = d.units != null ? d.units : c.plan.soldUnits, rev = d.reversed != null ? d.reversed : away ? c.plan.itcReversed : 0;
      const from = c.sku.itcPerUnit == null ? "estimated from the cost and the GST rate" : "from the cost sheet";
      return <div className="paper pp">{head("GST ITC memo", `Section 17(5)(h) · ${D.CLIENT.short} · GSTIN ${D.CLIENT.gstin}`, away ? "ITC PART REVERSED" : "ITC KEPT", !away)}<Line k="Packets sold under tax invoices" v={fmt.num(sold)} /><Line k="Destroyed, gifted or lost" v={fmt.num(away)} />{d.atGodown ? <Line k={`Destroyed at ${possessive(c.dist.name)} godown`} sub="his stock: he reverses their credit" v={fmt.num(d.atGodown)} /> : null}<Line k="Input GST kept" sub={`₹${c.plan.writeOff.itcPerUnit.toFixed(2)} a pack, ${from}`} v={fmt.inr2(d.amount)} strong /><Line k="Reversal in GSTR-3B, Table 4(B)(1)" v={rev ? fmt.inr2(rev) : "none"} />
        <p className="pp-note">{rev ? `Section 17(5)(h) blocks credit on goods written off, destroyed, lost or given away free. The ${fmt.num(away)} packs of this batch given away or destroyed have their credit reversed; the ${fmt.num(sold)} sold under tax invoices keep theirs. Credit on donated units is reversed: 17(5)(h) blocks it on gifts and, since 1 October 2023, 17(5)(fa) on CSR donations.` : `Section 17(5)(h) blocks credit on goods written off, destroyed, lost or given away free. These packs were sold under tax invoices, so it does not apply. The credit would be reversed only if the stock came back under the expiry claim and ${W.short} destroyed it. Credit on donated units is reversed: 17(5)(h) blocks it on gifts and, since 1 October 2023, 17(5)(fa) on CSR donations.`}{d.atGodown ? ` The ${fmt.num(d.atGodown)} packs destroyed at ${possessive(c.dist.name)} godown were his stock, bought under tax invoice: he reverses their input credit, and ${D.CLIENT.short} keeps its own.` : ""}</p><PpSign firm={D.CLIENT.name} who={D.CLIENT.signatory} seal={sealOf(D.CLIENT)} /></div>; }
    if (id === "expiry" && d) { const C = D.CLIENT.short, x = d;
      if (x.policy === "none") return <div className="paper pp">{head("Expiry notice", `${c.batch.id} · ${R.name}`, "NO RETURNS")}<Line k="Packs expired at the godown" v={fmt.num(x.units)} strong /><Line k={`Credit from ${C}`} v="none" /><p className="pp-note">{x.note}</p></div>;
      // destroyed at his godown (SC-139): a financial note, against the agency's certificate: the dealer price, the input
      // GST he reverses on them (grossed up) and the agency's charges
      if (x.policy === "godown") return <TallyCredit c={c} d={x} title="Credit Note" sub="Expiry, destroyed at the godown · financial, no GST adjusted" note={x.certificate ? `Issued against destruction certificate ${x.certificate}, on ${possessive(W.short)} approval of the evidence.` : null}
        reason={`The ${fmt.num(x.units)} packs left at the godown on the best-before, destroyed there${x.agency ? ` by ${x.agency}` : ""}${x.certificate ? ` under certificate ${x.certificate}` : ""}.`}
        rows={[{ k: `${fmt.num(x.units)} packs destroyed at the godown, at the dealer price`, units: x.units, rate: x.dp != null ? x.dp : dp, amount: x.credit },
          ...(x.gst ? [{ k: `Input GST he reverses on them, ${x.gstPct != null ? x.gstPct : Math.round(c.sku.gst * 100)}%, section 17(5)(h)`, amount: x.gst }] : []),
          ...(x.charges ? [{ k: `Destruction charges, ${x.agency || "the agency"}`, units: x.units, rate: x.charges / x.units, amount: x.charges }] : [])]} />;
      return <TallyCredit c={c} d={x} title="Credit Note" sub={`Expiry · ${x.policy === "full-credit" ? "full credit" : "price support"} · financial, no GST adjusted`}
        reason={`The ${fmt.num(x.units)} packs left at the godown on the best-before${x.policy === "full-credit" ? `, taken back at the dealer price; ${C} destroys them` : `: the gap to the dealer price paid, and ${R.short || R.name} destroys them`}.`}
        rows={[{ k: `${fmt.num(x.units)} packs expired at the godown${x.policy === "full-credit" ? ", at the dealer price" : ", price support"}`, units: x.units, rate: x.amount != null ? x.amount / x.units : null, amount: x.amount || 0 }]}
        after={x.policy === "full-credit" ? <div className="tl-grid"><Cell className="tl-small">{possessive(C)} own costs on destroying them, not on this note: disposal ₹{n2(x.disposal)}, EPR on the packaging ₹{n2(x.epr)}, input GST reversed under section 17(5)(h) ₹{n2(x.itc)}; the expiry, all in, ₹{n2((x.amount || 0) + x.disposal + x.epr + x.itc)}.</Cell></div> : null} />; }
    if (id === "receipt" && d) return <Receipt doc={d} batch={c.batch} sku={c.sku} dist={c.dist} />;
    if (id === "fssai") { const own = d && d.status === "generated" && c.donation; const other = !own && c.donation && c.donation.batch && c.donation.batch.id !== c.batch.id && c.donation.units > 0 ? c.donation : null;
      return <div className="paper pp">{own ? <>{head("FSSAI surplus-food checklist", `${c.batch.id} · FSSAI Lic. No. ${D.CLIENT.fssai}`, "GENERATED", true)}<Line k="Packs donated" v={fmt.num(c.plan.donated)} /><Line k="Food bank" v={c.donation.partner.name} /><p className="pp-note">The batch's own checklist for the surplus food: {c.donation.units} packs from {c.donation.from || c.dist.godown} to {c.donation.partner.name}, inside their best-before, with the label photo attached.</p><PpSign firm={D.CLIENT.name} who={D.CLIENT.signatory} seal={sealOf(D.CLIENT)} /></>
        : <>{head("FSSAI surplus-food checklist", c.batch.id, "NOT REQUIRED")}<p className="pp-note">Nothing from this batch was donated.{other ? ` The ${S.shortName(other.sku)} batch ${other.batch.id} has its own checklist: ${other.units} packs to ${other.partner.name}, ${other.dist.city}.` : ""}</p></>}</div>; }
    // destroyed at his godown (SC-139): the authorised agency's certificate, for him, once the evidence is approved; in
    // full (SC-174, option B), the certificate and its log
    if (d && d.at === "godown") return <Certificate d={d} c={c} />;
    // the staff sale's consolidated receipt (SC-174): the photo he sent with the sale, and what Vision read from it
    if (id === "staff") return c.staffReceipt ? <StaffReceiptPaper r={c.staffReceipt} dist={c.dist} sku={c.sku} price={c.staffReceipt.paid / c.staffReceipt.units} /> : null;
    // the packs the client destroys (SC-122: those that came back for full credit included), with their credit reversed
    const n = (d && d.units) || 0;
    return <div className="paper pp">{head("Destruction certificate", c.batch.id, n ? "GENERATED" : "NOT REQUIRED", !!n)}<Line k={n ? "Units destroyed" : "Units left to destroy"} v={fmt.num(n)} strong />{n ? <Line k="Input GST reversed" sub="section 17(5)(h), GSTR-3B Table 4(B)(1)" v={fmt.inr2(d && d.reversed != null ? d.reversed : n * c.plan.writeOff.itcPerUnit)} /> : null}<p className="pp-note">Issued only when units remain, with the ITC reversal entry pre-filled so finance is never surprised.</p></div>;
  }

  // the same batch read from each side: the distributor ends whole, and Munchly pays less than a claim. What the
  // distributor receives is what each channel took, at its price (the credit note's rows), so a line that took less
  // counts less; on expiry day the packs left at the godown add their settlement on both sides (SC-94)
  function KeepsWhat({ c: given }) {
    const s = useStore(); const c = given || LG().storyCase(s);
    const x0 = c.history ? c.expiry : s.hero.expiry; const x = x0 && x0.units > 0 ? x0 : null; const dp = c.sku.dp;
    // destroyed at his godown (SC-139): the note carries the GST he reverses and the agency's charges, which he pays out
    const godown = x && x.policy === "godown", spent = godown ? (x.reversal || 0) + (x.charges || 0) : 0;
    const took = c.support.rows.reduce((t, r) => t + r.units * r.price, 0), credit = (x && (godown ? x.amount : x.credit)) || 0, settled = x ? x.total : 0;
    const recv = took + c.support.total; const paid = c.plan.units * dp + c.support.van + c.support.fee; const ends = Math.round(recv + credit - spent - paid);
    // a donation costs Munchly its handling and the credit given away with it, as the ledger's swing counts (SC-122)
    const gift = c.plan.lines.find(l => l.id === "foodbank" && l.units > 0), given2 = gift ? gift.cost + gift.itcLoss : 0;
    return <Card className="stack snug">
      <span className="card-title">Who keeps what</span>
      <div className="stack tight t-subhead">
        <div className="row between"><span>{c.dist.name} receives</span><span className="tnum">{fmt.inr(recv)}</span></div>
        {credit > 0 && <div className="row between"><span>and the expiry credit for {fmt.num(x.units)} packs</span><span className="tnum">{fmt.inr(credit)}</span></div>}
        {spent > 0 && <div className="row between"><span>and the GST he reverses on them and the agency's charges</span><span className="tnum">{fmt.inr(-spent)}</span></div>}
        <div className="row between"><span>and paid {fmt.num(c.plan.units)} × ₹{dp}, the van and the fee</span><span className="tnum">{fmt.inr(-paid)}</span></div>
        <div className="row between"><b>{x && !credit ? "Its loss on the expired packs" : "He ends whole"}</b><span className="tnum strong">{fmt.inr(ends)}</span></div>
        <div className="hairline" style={{ margin: "4px 0" }} />
        <div className="row between"><span>Expiry claim {W.short} avoids</span><span className="tnum">{fmt.inr(c.claim.total)}</span></div>
        <div className="row between"><span>Price support it pays instead</span><span className="tnum neg">{fmt.inr(-c.support.total)}</span></div>
        {settled > 0 && <div className="row between"><span>and the expiry settlement for {fmt.num(x.units)} packs</span><span className="tnum neg">{fmt.inr(-settled)}</span></div>}
        {given2 > 0 && <div className="row between"><span>and the donation's handling and credit, {fmt.num(gift.units)} packs</span><span className="tnum neg">{fmt.inr(-given2)}</span></div>}
        <div className="row between"><b>Better for {W.short}</b><Money value={c.claim.total - c.support.total - settled - given2} size="s" style={{ color: "var(--primary-text)", fontSize: 22 }} /></div>
      </div>
      <span className="t-caption subtle">The same {fmt.inr(c.actual.swing)} swing as the ledger, seen from {W.short}'s cash: the ₹{dp} credit {first(c.dist.short)} would have claimed and the ₹{dp} he paid cancel out. At plan prices it is {fmt.inr(c.supportPlan.total)} of support and a {fmt.inr(c.plan.swing)} swing.</span>
    </Card>;
  }

  // a cleared batch from the history, as the pack reads it: drafted, reviewed, posted
  const CLEARED = { phase: "cleared", docs: true, reviewed: true, posted: true, van: { status: "done" } };

  // the batch's pack: each paper with its reason, one open on paper beside them (in a sheet on phones and tablets),
  // each with its PDF to download; who keeps what. The story's batch is reviewed here; a batch from the history was
  function PaperPack({ me, c, h }) {
    const app = useApp(); const { toast } = useNotice(); const paperRef = useRef(null); const sheetRef = useRef(null);
    const DOC = id => c.docs.find(d => d.id === id);
    const ready = !!h.docs; const awarded = c.lines.expiresoon.units > 0; const his = first(c.dist.short);
    const st = useStore();
    // the kiranas' tax invoices (SC-153): one card, the batch's sales register, each number opening its invoice
    const kiranas = LG().invoicesOf(c, st), [inv, setInv] = useState(null);
    const register = kiranas.length ? { id: "kiranas", type: "Tax invoices to kiranas", owner: c.dist.name, no: `${kiranas.length} invoices`, status: "generated", amount: r2(kiranas.reduce((t, x) => t + x.total, 0)) } : null;
    const [picked, setPicked] = useState(null); const sel = picked && (DOC(picked) || (register && picked === "kiranas")) ? picked : DOC("expiry") ? "expiry" : (c.docs[0] || { id: "invoice" }).id; const [sheet, setSheet] = useState(false);
    const doc = sel === "kiranas" ? register : DOC(sel), invoice = DOC("invoice"), support = DOC("support");
    // an invoice issued from Tally reads issued, with its e-invoice (SC-148)
    const issued = !!issuedWhen(c, invoice, st), shown = d => (issued && d.id === "invoice" ? Object.assign({}, d, { status: "issued" }) : d);
    const open = id => { setPicked(id); setInv(null); if (app.bp !== "desktop") setSheet(true); };
    const paperOf = id => (id !== "kiranas" ? <Paper id={id} c={c} /> : inv ? <div className="stack snug"><button type="button" className="pt-link t-footnote" style={{ justifySelf: "start" }} onClick={() => setInv(null)}>All {kiranas.length} invoices</button><KiranaInvoice c={c} inv={inv} /></div> : <KiranaRegister c={c} list={kiranas} onOpen={setInv} />);
    const exportPack = () => { download(`${c.batch.id}-document-pack.csv`, csv([["Document", "Issued by", "Number", "Status", "Amount (₹)", "Note"], ...c.docs.map(d => [d.type, d.owner, d.no, d.status, d.amount ? d.amount.toFixed(2) : "", d.note || ""])])); toast({ text: "Document pack exported", tone: "ok" }); };
    // the stub's PDF is the paper printed: the browser saves it (on the live workspace, the Paperwork agent's own PDF)
    const pdf = node => () => { if (node.current) printPage(`${doc.type} ${doc.no || ""} · ${c.batch.id}`, `<div class="${node.current.className}">${node.current.innerHTML}</div>`, { styles: true }); };
    const pdfButton = node => doc && doc.status !== "not required" ? <Button variant="secondary" size="sm" icon="download" action={pdf(node)} busy="Opening the PDF…" aria-label={`Download ${doc.type} as a PDF`}>Download PDF</Button> : null;
    return <>
      {!ready ? <div className="stack" style={{ gap: 16 }}><Card className="row wrap" style={{ gap: 16 }}><Product name="documents" size={88} /><div className="grow stack tight" style={{ gap: 2 }}><b>{awarded ? "The pack is drafted at the award" : "The pack is drafted once every line is done"}</b><span className="t-footnote muted">{awarded ? `${his}'s tax invoice, the e-way bill check, ` : ""}{W.short}'s price-support credit note, the ITC memo, the FSSAI checklist and the destruction certificate, each generated or marked not required with the reason.</span></div></Card><Locked icon="file-text" agent="Paperwork agent" live={h.phase === "dispatched"} text={h.phase === "dispatched" ? "Drafting Rakesh's invoice, the e-way bill check, the credit note and the ITC memo." : "Drafts the whole pack once the lot is awarded and on the buyer's truck."} /><div className="docgrid">{c.docs.map(d => <K.Skeleton key={d.id} h={132} r={20} />)}</div></div> :
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          {invoice && <Tile label={`${his}'s invoice`} icon="receipt"><Money value={invoice.total} size="s" /></Tile>}
          {support && <Tile label="Price support" icon="hand-coins"><Money value={support.amount} size="s" /></Tile>}
          <Tile label="GST credit kept" icon="badge-check"><Money value={(DOC("itc") || { amount: 0 }).amount} size="s" style={{ color: "var(--primary-text)" }} /></Tile>
          <Tile label="Things to chase" icon="list-checks"><span className="num s">0</span></Tile>
        </div>
        <Columns sideWidth={460}
          main={<><SectionTitle sub="Generated, drafted or not required, each with its reason" right={<span className="row tight"><Button variant="secondary" size="sm" icon="download" onClick={exportPack}>Export</Button>{h.reviewed ? <Badge tone="green" icon="check">reviewed</Badge> : <Button variant="primary" size="sm" icon="check" action={() => { Flow.act("review"); toast({ text: "Pack reviewed · logged", tone: "ok" }); }} busy="Marking reviewed…" done="Reviewed">Mark reviewed</Button>}</span>}>Document pack</SectionTitle>
            <div className="docgrid">{c.docs.concat(register ? [register] : []).map(d => <div key={d.id} className={cx("docpick", sel === d.id && app.bp === "desktop" && "on")}><DocCard doc={shown(d)} onOpen={() => open(d.id)} /></div>)}</div>
            <KeepsWhat c={c} />
</>}
          side={app.bp === "desktop" && doc ? <><SectionTitle sub={doc.id === "kiranas" ? `Issued by ${c.dist.name} from Tally · one for each shop's order` : doc.owner === D.CLIENT.short ? `Issued by ${W.short}` : doc.id === "invoice" && issued ? `Issued by ${c.dist.name} from Tally` : `Drafted for ${c.dist.name}`} right={pdfButton(paperRef)}>{doc.type}</SectionTitle><AnimatePresence mode="wait"><motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><div ref={paperRef}>{paperOf(sel)}</div></motion.div></AnimatePresence></> : null} />
      </div>}
      <Sheet open={sheet} onClose={() => setSheet(false)} title={doc ? doc.type : ""} footer={pdfButton(sheetRef)}><div ref={sheetRef}>{paperOf(sel)}</div></Sheet>
    </>;
  }

  // S5 Paperwork: the story's chips batch's pack, the operator's batch page shows it as one of its screens (SC-112)
  function Paperwork({ me }) {
    const s = useStore(); const c = LG().storyCase(s); const awarded = c.lines.expiresoon.units > 0;
    return <Screen me={me} title="Paperwork" sub={`${c.batch.id} · prepared by the Paperwork agent ${awarded ? "at the award" : "once every line was done"}`}><PaperPack me={me} c={c} h={s.hero} /></Screen>;
  }

  /* ---------- the Impact reading's dashboard (SC-157, option B) ---------- */
  // Every figure is a period's rows, derived by core/ledger.js dashboard(). The chart inks are the console's (SC-149),
  // validated with the dataviz script on the app's surfaces: kept out of landfill in the green, destroyed in clay with a
  // hatch, donated in the food bank's own ink. One axis, a legend, a table view; the bars grow once (420 ms)
  const CH_INK = { kirana: "var(--ch-kirana)", expiresoon: "var(--ch-expiresoon)", staff: "var(--ch-staff)", d2c: "var(--ch-d2c)", foodbank: "var(--ch-foodbank)", writeoff: "var(--viz-gone)" };
  const CH_NAMES = { kirana: "Kirana scheme", expiresoon: "ExpireSoon", staff: "Staff sale", d2c: "Discount D2C", foodbank: "Food bank", writeoff: "Destroyed" };
  const kgAxis = v => (v >= 1000 ? (v / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " t" : Math.round(v) + " kg");
  const weekLabel = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
  const splitKg = v => (v >= 1000 ? [(v / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 }), "t"] : [Math.round(v).toLocaleString("en-IN"), "kg"]);
  function useWidth2(init) { const ref = useRef(null); const [w, setW] = useState(init); useEffect(() => { if (!ref.current || !window.ResizeObserver) return; const ro = new ResizeObserver(e => setW(e[0].contentRect.width)); ro.observe(ref.current); return () => ro.disconnect(); }, []); return [ref, w]; }

  function Spark({ values, gone }) {
    const W = 92, H = 28, max = Math.max(1, ...values), n = values.length;
    const X = i => (n > 1 ? (i / (n - 1)) * W : W / 2), Y = v => H - 2 - (v / max) * (H - 6);
    const line = values.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
    return <svg className={cx("im-spark", gone && "gone")} viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><path className="a" d={`${line} L${W} ${H} L0 ${H} Z`} /><path className="l" d={line} /></svg>;
  }
  function ImpactTile({ icon, label, value, unit, foot, spark, gone, delta, deltaGood }) {
    const cls = delta == null || delta === 0 ? "" : (delta > 0) === deltaGood ? "up" : "down";
    return <div className={cx("im-tile", gone && "gone")}>
      <span className="lbl"><Icon name={icon} size={15} />{label}</span>
      <span className="val">{value}{unit && <small>{unit}</small>}</span>
      <span className="foot"><span>{delta != null ? <><span className={cx("delta", cls)}>{delta > 0 ? "+" : ""}{delta}%</span> {foot}</> : foot}</span>{spark}</span>
    </div>;
  }
  // the three figures against the period before, each with its weeks as a sparkline
  function ImpactTiles({ d, p, prev }) {
    const t = p.totals, tp = prev && prev.totals; const vs = f => d.weeks.map(f);
    const [k, ku] = splitKg(t.kg), [g, gu] = splitKg(t.destroyedKg), [c, cu] = splitKg(t.co2);
    const before = tp ? `vs ${prev.label}` : "first period";
    return <div className="im-tiles">
      <ImpactTile icon="leaf" label="Kept out of landfill" value={k} unit={ku} delta={tp ? pct(t.kg, tp.kg) : null} deltaGood foot={before} spark={<Spark values={vs(w => w.kept)} />} />
      <ImpactTile icon="trash-2" label="Destroyed" value={g} unit={gu} gone foot={d.share != null ? `${d.share}% of the food saved` : "nothing cleared yet"} spark={<Spark values={vs(w => w.destroyed)} gone />} />
      <ImpactTile icon="cloud" label="CO₂e avoided" value={c} unit={cu} delta={tp ? pct(t.co2, tp.co2) : null} deltaGood foot={`indicative, ${M.RULES.co2PerKg} kg a kg`} spark={<Spark values={vs(w => w.kept)} />} />
    </div>;
  }

  const niceStep = x => { const mag = Math.pow(10, Math.floor(Math.log10(x))); return mag * ([1, 2, 2.5, 5, 10].find(m => x / mag <= m) || 10); };
  function FoodWeeks({ weeks, height = 220, current }) {
    const [hover, setHover] = useState(null); const [box, cw] = useWidth2(640); const reduce = useReducedMotion();
    const W = Math.max(300, Math.round(cw)), H = height, pl = 52, pr = 8, pt = 12, pb = 26, n = weeks.length;
    const up = Math.max(0, ...weeks.map(w => w.kept)), down = Math.max(0, ...weeks.map(w => w.destroyed));
    const step = up || down ? niceStep(Math.max(up, down * 2) / 4) : 100;
    const top = Math.max(step * 2, step * Math.ceil(up / step)), bottom = Math.max(step, step * Math.ceil(down / step));
    const Y = x => pt + ((top - x) / (top + bottom)) * (H - pt - pb); const y0 = Y(0);
    const slot = (W - pl - pr) / n, bw = Math.max(3, Math.min(26, slot - 6)); const X = i => pl + slot * (i + 0.5);
    const ticks = []; for (let t = -bottom; t <= top + step / 2; t += step) ticks.push(Math.round(t));
    const every = Math.max(1, Math.ceil(64 / slot));
    const bar = (x, y1, from) => { const h = Math.abs(y1 - from), r = Math.min(3, bw / 2, h), k = y1 < from ? 1 : -1; if (h < 0.5) return `M${x} ${from} h${bw} h${-bw} Z`; return `M${x} ${from} V${y1 + k * r} Q${x} ${y1} ${x + r} ${y1} H${x + bw - r} Q${x + bw} ${y1} ${x + bw} ${y1 + k * r} V${from} Z`; };
    const move = e => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(n - 1, Math.floor((px - pl) / slot)))); };
    const kept = weeks.reduce((t, w) => t + w.kept, 0), gone = weeks.reduce((t, w) => t + w.destroyed, 0);
    const w = hover != null ? weeks[hover] : null;
    return <div className={cx("fw", reduce && "still")} ref={box} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} height={H} onMouseMove={move} role="img" aria-label={`Food a week: ${kg(kept)} kept out of landfill and ${kg(gone)} destroyed`}>
        <defs><pattern id="fw-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><rect width="5" height="5" className="hatch-bg" /><line x1="0" y1="0" x2="0" y2="5" className="hatch-ln" /></pattern></defs>
        {ticks.map(t => <line key={t} className={t ? "gl" : "base"} x1={pl} x2={W - pr} y1={Y(t)} y2={Y(t)} />)}
        {ticks.map(t => <text key={"t" + t} className="ax" x={pl - 8} y={Y(t) + 4} textAnchor="end">{t < 0 ? "−" + kgAxis(-t) : kgAxis(t)}</text>)}
        {weeks.map((wk, i) => ((i % every === 0 && i < n - 1) || i === n - 1) && <text key={"x" + i} className="ax" x={X(i)} y={H - 6} textAnchor={i === n - 1 ? "end" : "middle"}>{i === n - 1 && current ? "this week" : weekLabel(wk.from)}</text>)}
        {hover != null && <rect className="col" x={X(hover) - slot / 2} y={pt} width={slot} height={H - pt - pb} />}
        {weeks.map((wk, i) => <g key={i}>
          <path className="kept" style={{ animationDelay: `${Math.min(6 * i, 300)}ms` }} d={bar(X(i) - bw / 2, Y(wk.kept), y0)} />
          {wk.destroyed > 0 && <path className="gone" style={{ animationDelay: `${Math.min(6 * i, 300) + 120}ms` }} d={bar(X(i) - bw / 2, Y(-wk.destroyed) + 1, y0 + 1)} />}
        </g>)}
      </svg>
      {w && <div className="tip" style={{ left: hover > n / 2 ? `calc(${(X(hover) / W) * 100}% - 204px)` : `calc(${(X(hover) / W) * 100}% + 12px)`, top: 8 }}>
        <b>Week of {weekLabel(w.from)}</b>
        <div className="tr"><span><i className="im-sw kept" aria-hidden="true" />Kept out of landfill</span><span>{kg(w.kept)}</span></div>
        <div className="tr"><span><i className="im-sw gone" aria-hidden="true" />Destroyed</span><span>{w.destroyed ? kg(w.destroyed) : "none"}</span></div>
        <div className="tr"><span>Batches cleared</span><span>{w.closed}</span></div>
        <div className="tr"><span>Recovered</span><span>{fmt.inr(w.net)}</span></div>
      </div>}
    </div>;
  }
  function FoodTable({ weeks }) {
    return <table className="fw-table"><thead><tr><th>Week of</th><th>Kept out (kg)</th><th>Resold</th><th>Donated</th><th>Destroyed</th><th>Batches</th><th>Recovered</th></tr></thead>
      <tbody>{weeks.map((w, i) => <tr key={i}><td>{weekLabel(w.from)}</td><td>{w.kept}</td><td>{w.resold}</td><td>{w.donated}</td><td>{w.destroyed}</td><td>{w.closed}</td><td>{fmt.inr(w.net)}</td></tr>)}</tbody></table>;
  }
  // food by week: the two figures and the share saved, the legend, the chart or its table
  function FoodCard({ d, p, prev, height }) {
    const [table, setTable] = useState(false); const t = p.totals;
    return <div className="fw-card stack" style={{ gap: 14 }}>
      <div className="card-head"><span className="card-title">Food, by week</span><Button variant="secondary" size="sm" icon={table ? "activity" : "file-spreadsheet"} aria-pressed={table} onClick={() => setTable(v => !v)}>{table ? "Show as a chart" : "Show as a table"}</Button></div>
      <div className="fw-head"><span className="fig"><b>{kg(t.kg)}</b><span>kept out of landfill in {p.label}</span></span>{d.share != null && <span className="share">{d.share}% saved</span>}<span className="fig gone"><b>{kg(t.destroyedKg)}</b><span>destroyed</span></span></div>
      <ul className="fw-legend"><li><i className="im-sw kept" aria-hidden="true" />Kept out of landfill (sold or given)</li><li><i className="im-sw gone" aria-hidden="true" />Destroyed (no channel took it)</li></ul>
      {table ? <div style={{ overflowX: "auto" }}><FoodTable weeks={d.weeks} /></div> : <FoodWeeks weeks={d.weeks} height={height} current={p.current} />}
      <span className="im-note">{prev ? `${kg(prev.totals.kg)} kept out and ${kg(prev.totals.destroyedKg)} destroyed in ${prev.label}.` : `Every batch ${W.short} has cleared since ${W.since}; a week is counted when its batches clear.`} CO₂e, disposal and EPR are indicative.</span>
    </div>;
  }
  // where the kilos went, by channel
  function MixCard({ d, p }) {
    const total = d.mixKg.reduce((t, m) => t + m[1], 0) || 1; let acc = 0;
    return <Card className="stack" style={{ gap: 12 }}>
      <div className="card-head"><span className="card-title">Where the kilos went</span><span className="t-caption subtle">{kg(total)} flagged at risk</span></div>
      <div className="chart stack snug">
        <svg viewBox="0 0 600 28" width="100%" height="28" preserveAspectRatio="none" role="img" aria-label="Where the kilos went, by channel">
          <defs><pattern id="fw-hatch-mix" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--viz-gone-soft)" /><line x1="0" y1="0" x2="0" y2="5" stroke="var(--viz-gone)" strokeWidth="2.6" /></pattern></defs>
          {d.mixKg.map(([id, v]) => { const w = (v / total) * 600, x = acc; acc += w; return <rect key={id} x={x + 1} y="0" width={Math.max(0, w - 2)} height="28" rx="5" fill={id === "writeoff" ? "url(#fw-hatch-mix)" : CH_INK[id]} stroke={id === "writeoff" ? "var(--viz-gone)" : "none"}><title>{CH_NAMES[id]}: {kg(v)}</title></rect>; })}
        </svg>
      </div>
      <List>{d.mixKg.map(([id, v]) => <ListRow key={id} leading={<i className={cx("im-sw", id === "writeoff" && "gone")} style={id === "writeoff" ? undefined : { background: CH_INK[id] }} aria-hidden="true" />} title={CH_NAMES[id]} sub={id === "writeoff" ? "expired at the godown; destroyed on your yes" : id === "foodbank" ? `${fmt.num(p.totals.meals)} meals, on the food banks' receipts` : "sold under tax invoices and order logs"} value={<span className="tnum strong">{kg(v)} <span className="subtle t-caption">{Math.round((v / total) * 100)}%</span></span>} />)}</List>
    </Card>;
  }
  // by distributor, by product: a row each, resold, donated and destroyed on one scale
  function HBars({ rows, product }) {
    const max = Math.max(1, ...rows.map(r => r.kept + r.destroyed));
    return <div className="hb">{rows.map(r => <div key={r.label} className="hb-row">
      <span className="lab">{product && <Product name={r.img} size={26} />}<span>{r.label}</span></span>
      <span className="bar" aria-hidden="true"><i className="k" style={{ width: (r.resold / max) * 100 + "%" }} />{r.donated > 0 && <i className="n" style={{ width: (r.donated / max) * 100 + "%" }} />}{r.destroyed > 0 && <i className="d" style={{ width: (r.destroyed / max) * 100 + "%" }} />}</span>
      <span className="v"><b>{kg(r.kept)}</b>{r.destroyed ? ` · ${kg(r.destroyed)} destroyed` : ""} · {r.batches} {r.batches === 1 ? "batch" : "batches"}</span>
    </div>)}</div>;
  }
  function ByCard({ d }) {
    const [by, setBy] = useState("dist");
    return <Card className="stack" style={{ gap: 12 }}>
      <div className="card-head"><span className="card-title">By {by === "dist" ? "distributor" : "product"}</span><Segmented size="sm" label="Group by" value={by} onChange={setBy} options={[{ id: "dist", label: "Distributor" }, { id: "sku", label: "Product" }]} /></div>
      <HBars rows={by === "dist" ? d.byDist : d.bySku} product={by === "sku"} />
      <ul className="fw-legend"><li><i className="im-sw kept" aria-hidden="true" />Resold</li><li><i className="im-sw donated" aria-hidden="true" />Donated</li><li><i className="im-sw gone" aria-hidden="true" />Destroyed</li></ul>
    </Card>;
  }
  // the Impact reading, grown into the dashboard (option B): the headline and its working, the tiles and food by week in
  // the same card, then where the kilos went and by distributor or product, over the period's batches
  function ImpactReading({ book, p }) {
    const d = useMemo(() => LG().dashboard(book, p.id), [book, p.id]); const prev = d.prev ? book.periods.find(x => x.id === d.prev) : null;
    const app = useApp(); const phone = app.bp === "phone";
    return <>
      <Card className="stack" style={{ gap: 18 }}>
        <Headline t={p.totals} reading="impact" p={p} />
        {p.totals.batches ? <><ImpactTiles d={d} p={p} prev={prev} /><FoodCard d={d} p={p} prev={prev} height={phone ? 200 : 220} /></> : <Empty icon="book-open" title={`Nothing cleared in ${p.label} yet`} body="Each batch joins the ledger when Impact posts it, after its return window closes." />}
      </Card>
      {p.totals.batches ? <div className="im-grid two"><MixCard d={d} p={p} /><ByCard d={d} /></div> : null}
    </>;
  }

  /* ---------- the ledger ---------- */
  const READINGS = [{ id: "money", label: "Money", icon: "coins" }, { id: "gst", label: "GST", icon: "badge-check" }, { id: "impact", label: "Impact", icon: "leaf" }];
  const OUTCOME = { sold: { label: "Sold through", tone: "green", icon: "check" }, leftover: { label: "Left at the godown", icon: "warehouse" }, donation: { label: "Donated", icon: "heart-handshake" } };
  const OutcomeBadge = ({ o, size }) => { const x = OUTCOME[o]; return x ? <Badge size={size} tone={x.tone} icon={x.icon}>{x.label}</Badge> : null; };
  const valueOf = (r, reading) => (reading === "money" ? r.figures.net : reading === "gst" ? r.figures.itcKept : r.figures.kg);
  const figure = (r, reading) => (reading === "money" ? fmt.inr(r.figures.net) : reading === "gst" ? fmt.inr(r.figures.itcKept) : kg(r.figures.kg));
  const second = (r, reading) => { const F = r.figures;
    if (reading === "money") return `of ${fmt.inr(F.writeOff)} if destroyed`;
    if (reading === "gst") return F.itcReversed ? `${fmt.inr(F.itcReversed)} reversed` : "nothing reversed";
    return F.meals ? `${fmt.num(F.meals)} meals` : F.destroyedKg ? `${kg(F.destroyedKg)} destroyed` : `${kg(F.co2)} CO₂e`; };
  // the share of a batch's segment that went to the bin, drawn hatched: the packs destroyed, or the credit reversed
  const binShare = (r, reading) => { const F = r.figures;
    if (reading === "gst") return F.itcReversed / (F.itcKept + F.itcReversed || 1);
    if (reading === "impact") return F.destroyedKg / (F.kg + F.destroyedKg || 1);
    return F.destroyed / (F.units || 1); };
  const dayOf = iso => fmt.day(iso);
  const monthOf = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { month: "short" });

  // quarter-sized rupees read in lakh, as an Indian finance team says them; tonnes once the kilos run past a thousand
  function Lakh({ value }) {
    return <span className="num l money"><span className="sr-only">{"₹" + (value / 1e5).toFixed(2) + " lakh"}</span><span className="cur" aria-hidden="true">₹</span><Roll value={value / 1e5} format={v => v.toFixed(2)} hidden /><span aria-hidden="true" className="lg-unit">lakh</span></span>;
  }
  function Kilos({ value }) {
    const t = value >= 1000;
    return <span className="num l"><span className="sr-only">{kg(value)}</span><Roll value={t ? value / 1000 : value} format={v => (t ? v.toFixed(2) : Math.round(v).toLocaleString("en-IN"))} hidden /><span aria-hidden="true" className="lg-unit">{t ? "t" : "kg"}</span></span>;
  }

  // the period's one figure for a reading, with its working under it
  function Headline({ t, reading, p }) {
    if (reading === "money") return <div className="lg-head">
      <div className="lg-fig"><Lakh value={t.net} /><span className="lg-what">recovered</span></div>
      <p className="lg-working">From {t.batches} {t.batches === 1 ? "batch" : "batches"} that would have cost {fmt.lakh(t.writeOff)} to destroy: <b>{fmt.lakh(t.swing)}</b> better than the bin, after {fmt.lakh(t.support)} of price support to the distributors{t.credit ? ` and ${fmt.inr(t.credit)} of expiry credit` : ""}.</p>
    </div>;
    if (reading === "gst") return <div className="lg-head">
      <div className="lg-fig"><Money value={t.itcKept} size="l" roll /><span className="lg-what">of input credit kept</span></div>
      <p className="lg-working">Sold under tax invoices, so the credit stands. <b>{fmt.inr(t.itcReversed)}</b> reversed under s.17(5)(h) on packs destroyed or given away (GSTR-3B Table 4(B)(1)). {t.invoices} distributors' invoices, {t.creditNotes} credit notes, {t.reviewed === t.batches ? "every pack reviewed" : `${t.reviewed} of ${t.batches} packs reviewed`}.</p>
    </div>;
    return <div className="lg-head">
      <div className="lg-fig"><Kilos value={t.kg} /><span className="lg-what">kept out of landfill</span></div>
      <p className="lg-working">{kg(t.resoldKg)} resold and {kg(t.donatedKg)} donated, {fmt.num(t.meals)} meals. <b>{kg(t.destroyedKg)}</b> destroyed when it expired at the godown. {kg(t.co2)} CO₂e avoided, indicative. {p.long}.</p>
    </div>;
  }

  // the period as its batches: one segment a batch, in the order they cleared, as wide as its figure in the reading
  function Strip({ list, reading, onOpen }) {
    const reduce = useReducedMotion(); const app = useApp();
    const total = list.reduce((t, r) => t + valueOf(r, reading), 0) || 1;
    let at = 0; const starts = list.map(r => { const s0 = at; at += valueOf(r, reading); return s0 / total; });
    const months = []; list.forEach((r, i) => { const m = r.cleared.slice(0, 7); if (!months.length || months[months.length - 1].m !== m) months.push({ m, i, label: monthOf(r.cleared) }); });
    return <div className="lg-stripwrap">
      <div className="lg-strip" role="group" aria-label="The period's batches, each as wide as its figure">
        {list.map((r, i) => { const share = binShare(r, reading);
          return <motion.button key={r.ref + reading} type="button" className={cx("lg-seg", r.outcome)} style={{ flexGrow: Math.max(valueOf(r, reading), total * 0.012) }} onClick={() => onOpen(r)}
            initial={reduce ? false : { scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.42, delay: reduce ? 0 : i * 0.035, ease: [0.22, 1, 0.36, 1] }}
            aria-label={`${r.name}, ${r.ref}: ${figure(r, reading)}, ${OUTCOME[r.outcome].label}`} title={`${r.name} · ${figure(r, reading)}`}>
            {share > 0.004 && <i className="lg-bin" style={{ width: Math.max(4, share * 100) + "%" }} aria-hidden="true" />}
            {app.bp !== "phone" && <span className="lg-seglabel" aria-hidden="true">{first(r.name)}</span>}
          </motion.button>; })}
      </div>
      <div className="lg-ticks" aria-hidden="true">{months.map(m => <span key={m.m} style={{ left: starts[m.i] * 100 + "%" }}>{m.label}</span>)}</div>
      <div className="lg-legend"><span><i className="sold" />Sold through</span><span><i className="leftover" />Left at the godown</span><span><i className="donation" />Donated</span><span><i className="bin" />{reading === "gst" ? "Credit reversed" : reading === "impact" ? "Destroyed" : "Packs destroyed"}</span></div>
    </div>;
  }

  /* ---------- the exports, for the period chosen ---------- */
  // a period by its own name: a quarter's label, a year's span (FY 2026-27)
  const periodName = p => (p.kind === "year" ? p.long : p.label);
  const PERIOD_FILE = p => (p.kind === "year" ? p.long.replace(/ so far$/, "") : p.label).replace(/\s+/g, "-");
  function exportBRSR(p, list) {
    download(`BRSR-P6-waste-${PERIOD_FILE(p)}.csv`, csv([["Category", "Diverted (kg)", "Resold (kg)", "Donated (kg)", "Disposed (kg)", "Evidence"], ...p.brsr.map(r => [r.cat, r.diverted, r.resold, r.donated, r.disposed, r.evidence]),
      ...list.map(r => [`Batch ${r.ref} (${r.name})`, r.figures.kg, r.figures.resoldKg, r.figures.donatedKg, r.figures.destroyedKg, r.papers.filter(x => x.status !== "not required" && ["invoice", "support", "expiry", "receipt"].includes(x.id)).map(x => x.no).join("; ")])]));
  }
  function exportGST(p, list) {
    const no = (r, id) => (r.papers.find(x => x.id === id && x.status !== "not required") || {});
    download(`GST-summary-${PERIOD_FILE(p)}.csv`, csv([["Batch", "Product", "Distributor", "Cleared", "Tax invoice", "Invoice total (₹)", "Price-support credit note", "Credit (₹)", "Expiry credit note", "Expiry credit (₹)", "Input GST kept (₹)", "Reversed, s.17(5)(h) (₹)"],
      ...list.map(r => [r.ref, r.name, r.distributorName, r.cleared, no(r, "invoice").no || "", no(r, "invoice").amount != null ? no(r, "invoice").amount : "", no(r, "support").no || "", r.figures.support, no(r, "expiry").no || "", r.figures.credit || "", r.figures.itcKept, r.figures.itcReversed]),
      ["Total", "", "", "", `${p.totals.invoices} invoices`, r2(list.reduce((t, r) => t + (no(r, "invoice").amount || 0), 0)), `${p.totals.creditNotes} credit notes`, p.totals.support, "", p.totals.credit, p.totals.itcKept, p.totals.itcReversed]]));
  }
  function exportLedger(p, list) {
    download(`Ledger-${PERIOD_FILE(p)}.csv`, csv([["Batch", "Product", "Distributor", "Flagged", "Cleared", "Outcome", "Recovered (₹)", "Would-be write-off (₹)", "Better than the bin (₹)", "P&L (₹)", "Input GST kept (₹)", "Reversed (₹)", "Resold (kg)", "Donated (kg)", "Destroyed (kg)", "CO₂e avoided (kg)", "Meals"],
      ...list.map(r => { const F = r.figures; return [r.ref, r.name, r.distributorName, r.flagged, r.cleared, OUTCOME[r.outcome].label, F.net, F.writeOff, F.swing, F.pnl, F.itcKept, F.itcReversed, F.resoldKg, F.donatedKg, F.destroyedKg, F.co2, F.meals]; })]));
  }
  // the period's report, printed: its three readings, the batches and BRSR's row
  function printReport(p, list, since) {
    const t = p.totals, row = (cells, cls) => `<tr${cls ? ` class="${cls}"` : ""}>${cells.map(([v, n]) => `<td${n ? ' class="n"' : ""}>${esc(v)}</td>`).join("")}</tr>`;
    const body = `<h1>${esc(W.name)} · Finance &amp; ESG · ${esc(periodName(p))}</h1><p>${esc(p.long)}. Every batch cleared since ${esc(since)}, as its posted ledger. CO₂e, disposal and EPR are indicative.</p>
      <h2>Money</h2><table><tbody>${[["Recovered", fmt.inr2(t.net)], ["Would-be write-off", fmt.inr2(t.writeOff)], ["Better than the bin", fmt.inr2(t.swing)], ["Price support to the distributors", fmt.inr2(t.support)], ["Expiry credit", fmt.inr2(t.credit)]].map(([k, v]) => row([[k], [v, 1]])).join("")}</tbody></table>
      <h2>GST</h2><table><tbody>${[["Input GST kept", fmt.inr2(t.itcKept)], ["Reversed under s.17(5)(h), GSTR-3B Table 4(B)(1)", fmt.inr2(t.itcReversed)], ["Distributors' tax invoices", fmt.num(t.invoices)], ["Credit notes", fmt.num(t.creditNotes)], ["Packs reviewed", `${t.reviewed} of ${t.batches}`]].map(([k, v]) => row([[k], [v, 1]])).join("")}</tbody></table>
      <h2>Impact</h2><table><tbody>${[["Kept out of landfill", kg(t.kg)], ["Resold", kg(t.resoldKg)], ["Donated", kg(t.donatedKg)], ["Destroyed at the godown", kg(t.destroyedKg)], ["CO₂e avoided, indicative", kg(t.co2)], ["Meals", fmt.num(t.meals)]].map(([k, v]) => row([[k], [v, 1]])).join("")}</tbody></table>
      <h2>BRSR Principle 6 · waste</h2><table><thead><tr><th>Category</th><th class="n">Diverted, kg</th><th class="n">Resold</th><th class="n">Donated</th><th class="n">Disposed</th><th>Evidence</th></tr></thead><tbody>${p.brsr.map(r => row([[r.cat], [fmt.num(r.diverted), 1], [fmt.num(r.resold), 1], [fmt.num(r.donated), 1], [fmt.num(r.disposed), 1], [r.evidence]])).join("")}</tbody></table>
      <h2>The batches</h2><table><thead><tr><th>Batch</th><th>Product</th><th>Cleared</th><th>Outcome</th><th class="n">Recovered</th><th class="n">GST kept</th><th class="n">Reversed</th><th class="n">Kept out</th></tr></thead><tbody>${list.map(r => row([[r.ref], [r.name], [fmt.date(r.cleared)], [OUTCOME[r.outcome].label], [fmt.inr(r.figures.net), 1], [fmt.inr(r.figures.itcKept), 1], [fmt.inr(r.figures.itcReversed), 1], [kg(r.figures.kg), 1]])).join("")}${row([["Total"], [""], [""], [`${t.batches} batches`], [fmt.inr(t.net), 1], [fmt.inr(t.itcKept), 1], [fmt.inr(t.itcReversed), 1], [kg(t.kg), 1]], "total")}</tbody></table>
      <p>The companies and people are fictional.</p>`;
    printPage(`${W.short} Finance and ESG ${periodName(p)}`, body);
  }

  function ExportMenu({ p, list, since }) {
    const [open, setOpen] = useState(false); const { toast } = useNotice(); const done = text => toast({ text, tone: "ok" });
    return <span style={{ position: "relative" }}><Button variant="secondary" size="sm" icon="download" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>Export</Button>
      <Menu open={open} onClose={() => setOpen(false)} width={260} label={`Export ${p.label}`} items={[{ label: `Export ${p.label}`, heading: true },
        { label: "BRSR table", icon: "leaf", right: <span className="t-caption subtle">CSV</span>, onClick: () => { exportBRSR(p, list); done("BRSR table exported as CSV"); } },
        { label: "GST summary", icon: "badge-check", right: <span className="t-caption subtle">CSV</span>, onClick: () => { exportGST(p, list); done("GST summary exported as CSV"); } },
        { label: "The ledger", icon: "file-spreadsheet", right: <span className="t-caption subtle">CSV</span>, onClick: () => { exportLedger(p, list); done("Ledger exported as CSV"); } },
        "-", { label: "The report", icon: "file-text", right: <span className="t-caption subtle">PDF</span>, onClick: () => printReport(p, list, since) }]} /></span>;
  }

  // the ledger: the period, a reading, the period's figure with its working, the period drawn as its batches, the
  // batches still out, and the batches by month. Each row opens the batch's own page
  function Ledger({ me }) {
    const s = useStore(); const app = useApp(); const phone = app.bp === "phone"; const { go } = useRoute();
    const book = useMemo(() => LG().ledger(s), [s.hero.posted, s.hero.phase, s.mango.phase, s.scenario]);
    const year = book.periods.find(x => x.kind === "year" && x.current) || book.periods[book.periods.length - 1];
    const [pid, setPid] = useState(year.id); const p = book.periods.find(x => x.id === pid) || year;
    // the reading the address asks for (the Command Center's Impact card opens the ledger on Impact, SC-157)
    const { route } = useRoute(); const [reading, setReading] = useState((route && route.params && route.params.reading) || "money");
    const list = book.batches.filter(r => r.cleared >= p.from && r.cleared <= p.to);
    const open = r => go("report", { ref: r.ref });
    const flying = p.current ? book.inFlight : [];
    const sumOf = t => (reading === "impact" ? kg(t.kg) : fmt.inr(reading === "gst" ? t.itcKept : t.net));
    const months = p.months.slice().reverse().map(m => ({ ...m, items: list.filter(r => r.cleared.slice(0, 7) === m.month).reverse() }));
    const exports = list.length ? <ExportMenu p={p} list={list} since={book.since} /> : null;
    return <Screen me={me} title="Ledger" sub={`One ledger, three readings · every batch ${W.short} has cleared since ${book.since}`} actions={!phone && exports}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap between" style={{ gap: 12 }}><Segmented label="Period" value={p.id} onChange={setPid} options={book.periods.map(x => ({ id: x.id, label: x.label }))} /><span className="row tight wrap" style={{ gap: 12 }}><Segmented label="Reading" value={reading} onChange={setReading} options={READINGS} />{phone && exports}</span></div>
        {reading === "impact" ? <ImpactReading book={book} p={p} /> : <Card className="stack" style={{ gap: 18 }}>
          <Headline t={p.totals} reading={reading} p={p} />
          {list.length ? <Strip list={list} reading={reading} onOpen={open} /> : <Empty icon="book-open" title={`Nothing cleared in ${p.label} yet`} body={`Each batch joins the ledger when Impact posts it, after its return window closes. ${flying.length ? `${flying.length} ${flying.length === 1 ? "batch is" : "batches are"} still out.` : ""}`} />}
        </Card>}
        {flying.length ? <List head="Still out">{flying.map(b => <ListRow key={b.ref} leading={<Product name={b.img} size={40} />} title={b.name} sub={`${b.ref} · ${b.distributorName} · flagged ${dayOf(b.flagged)}`} value={<Badge tone="blue" dot live>{(D.STAGES.find(x => x.id === b.stage) || { title: b.stage }).title}</Badge>} />)}</List> : null}
        {months.map(g => <List key={g.month} head={`${g.label} · ${g.totals.batches} ${g.totals.batches === 1 ? "batch" : "batches"} · ${sumOf(g.totals)}`}>
          {g.items.map(r => <ListRow key={r.ref} chevron onClick={() => open(r)} leading={<Product name={r.img} size={40} />}
            title={<span className="row tight" style={{ gap: 8, flexWrap: "wrap" }}><span>{r.name}</span>{!phone && <OutcomeBadge o={r.outcome} size="sm" />}</span>}
            sub={`${r.ref} · ${r.distributorName} · cleared ${dayOf(r.cleared)}`}
            value={<span className="lg-val"><b className="tnum">{figure(r, reading)}</b><em>{second(r, reading)}</em></span>} />)}
        </List>)}
        <p className="t-footnote subtle">Every figure is the batch's posted ledger, as money.js works it out. CO₂e, disposal and EPR are indicative. The companies and people are fictional.</p>
      </div>
    </Screen>;
  }

  /* ---------- a batch's own page ---------- */
  const TABS = [{ id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "impact", label: "Impact", icon: "leaf" }, { id: "record", label: "Record", icon: "history" }];
  const Row = ({ k, sub, v, tone, strong }) => <div className={cx("lg-line", strong && "strong")}><span>{k}{sub && <em> {sub}</em>}</span><span className={cx("tnum", tone)}>{v}</span></div>;
  const NotPosted = ({ h }) => <Locked icon="book-open-check" agent="Impact agent" live={h.phase === "settled" && h.van && h.van.status === "done"} text={`Posts the batch to the ledger once the return window closes on ${fmt.day(D.story().returnBy)}, and writes the BRSR row with evidence links.`} />;

  function MoneyTab({ c, row, h }) {
    const app = useApp();
    if (!row) return <div className="stack" style={{ gap: 16 }}><NotPosted h={h} /><SectionTitle sub="Planned on the Route Room; actual after the negotiation">Money reading</SectionTitle><MoneyPanel plan={c.plan} actual={h.award ? c.actual : undefined} compact={app.bp !== "desktop"} /></div>;
    const F = row.figures, wo = c.plan.writeOff, r = c.realised, s = c.sku, inv = c.docs.find(d => d.id === "invoice"), cn = c.docs.find(d => d.id === "support"), ex = c.docs.find(d => d.id === "expiry");
    const subOf = l => (l.id === "kirana" && c.kirana && c.kirana.ordered < c.kirana.planned ? `of ${fmt.num(c.kirana.planned)} offered` : l.id === "foodbank" ? (c.partner ? c.partner.name : "the food bank") : `at ${fmt.rate(l.price)}`);
    return <Columns sideWidth={380}
      main={<div className="stack" style={{ gap: 16 }}>
        <Card className="stack snug">
          <div className="card-head"><span className="card-title">What happened</span><OutcomeBadge o={row.outcome} size="sm" /></div>
          {row.lines.map(l => <Row key={l.id} k={`${fmt.num(l.units)} → ${l.short}`} sub={subOf(l)} v={l.id === "foodbank" ? "given" : fmt.inr(l.gross)} />)}
          <Row k="Van, listing fee and handling" v={fmt.inr(-(r.costs || 0))} tone="neg" />
          {r.itcLoss ? <Row k="Input credit given away with the donation" sub="s.17(5)(h)" v={fmt.inr(-r.itcLoss)} tone="neg" /> : null}
          <Row k="Recovered" v={fmt.inr(F.net)} strong />
          {F.godown ? <div className="lg-note"><Icon name={c.expiry.policy === "godown" ? "recycle" : "warehouse"} size={16} /><span>{c.expiry.policy === "godown"
            ? `${fmt.num(F.godown)} packs no channel took expired at ${c.dist.godown} and were destroyed there through ${c.destruction && c.destruction.agency ? c.destruction.agency.name : "an authorised agency"}, on ${c.destruction && D.PEOPLE[c.destruction.approvedBy] ? possessive(D.PEOPLE[c.destruction.approvedBy].short) : "the operator's"} yes. ${W.short} credited ${c.dist.short} ${fmt.inr2(F.credit)}: the dealer price, the ${fmt.inr2(c.expiry.gst)} of GST he reverses and ${fmt.inr2(c.expiry.charges)} of the agency's charges. ${possessive(W.short)} own input credit is kept.`
            : `${fmt.num(F.godown)} packs no channel took expired at ${c.dist.godown}. They came back to ${W.short} for full credit (${fmt.inr(F.credit)}) and ${W.short} destroyed them: disposal, EPR and ${fmt.inr2(c.expiry.itc)} of credit reversed.`}</span></div> : null}
        </Card>
        <Card className="stack snug">
          <div className="card-head"><span className="card-title">If it had been destroyed</span><Badge size="sm" tone="red" icon="trash-2">write-off</Badge></div>
          <Row k="Stock at cost" sub={`${fmt.num(wo.units)} × ₹${s.cost}`} v={fmt.inr(-wo.stock)} tone="neg" />
          <Row k="Input credit reversed" sub={`s.17(5)(h) · ₹${wo.itcPerUnit} a pack`} v={fmt.inr(-wo.itc)} tone="neg" />
          <Row k="Disposal and EPR" sub="indicative" v={fmt.inr(-(wo.disposal + wo.epr))} tone="neg" />
          <Row k="Effect on the P&L" v={fmt.inr(-wo.total)} tone="neg" strong />
        </Card>
      </div>}
      side={<div className="stack" style={{ gap: 16 }}>
        <Card className="stack tight" style={{ gap: 6 }}><span className="t-footnote subtle">Better than destroying it</span><Money value={F.swing} size="m" style={{ color: "var(--primary-text)" }} /><span className="t-footnote muted">P&L {fmt.inr(F.pnl)} instead of {fmt.inr(-wo.total)}.</span></Card>
        <List head={`${W.short}'s side`}>
          {cn ? <ListRow icon="hand-coins" title={`Price support to ${c.dist.short}`} sub={cn.no} value={amount(fmt.inr(cn.amount))} /> : null}
          {ex ? <ListRow icon="warehouse" title="Expiry credit" sub={`${ex.no} · ${fmt.num(ex.units)} packs`} value={amount(fmt.inr(ex.amount))} /> : null}
          {inv ? <ListRow icon="receipt" title={`${possessive(c.dist.short)} invoice to ${c.buyer.short || c.buyer.name}`} sub={inv.no} value={amount(fmt.inr(inv.total))} /> : null}
        </List>
      </div>} />;
  }

  function ImpactTab({ c, row, h }) {
    if (!row) return <NotPosted h={h} />;
    const F = row.figures, no = id => (row.papers.find(x => x.id === id && x.status !== "not required") || {}).no;
    const orders = row.lines.filter(l => l.id === "kirana").reduce((t, l) => t + l.units, 0);
    const ev = [no("invoice"), c.listing && c.lines.expiresoon.units ? c.listing.id : null, orders ? `${c.kiranas.length} kirana order logs` : null, no("support"), no("expiry"), F.donated ? "FSSAI checklist" : null, no("receipt"), F.destroyed ? "destruction certificate" : null].filter(Boolean);
    return <Columns sideWidth={380}
      main={<div className="stack" style={{ gap: 16 }}>
        <Card className="stack snug"><div className="card-head"><span className="card-title">BRSR line</span><Badge size="sm" tone="green" icon="check">posted · {dayOf(row.cleared)}</Badge></div>
          <div className="lg-brsr mono">{kg(F.kg)} diverted from disposal ({kg(F.resoldKg)} resold{F.donatedKg ? `, ${kg(F.donatedKg)} donated` : ""}) · {kg(F.destroyedKg)} destroyed · {kg(F.co2)} CO₂e avoided (indicative) · {F.meals ? `${fmt.num(F.meals)} meals (${fmt.num(F.donated)} packs donated)` : "0 meals (nothing donated)"}</div>
          <span className="t-footnote subtle">Evidence: {ev.join(" · ")}</span></Card>
        <List head="Where the kilos went">
          <ListRow icon="store" title="Resold" sub="kiranas, ExpireSoon and staff" value={kg(F.resoldKg)} />
          <ListRow icon="heart-handshake" title="Donated" sub={c.partner ? c.partner.name : "nothing donated"} value={kg(F.donatedKg)} />
          <ListRow icon="trash-2" title="Destroyed" sub={F.destroyedKg ? "expired at the godown" : "nothing destroyed"} value={kg(F.destroyedKg)} />
        </List>
      </div>}
      side={<Card className="stack tight" style={{ gap: 6 }}><span className="t-footnote subtle">Kept out of landfill</span><span className="num m">{kg(F.kg)}</span><span className="t-footnote muted">{kg(F.co2)} CO₂e avoided at {M.RULES.co2PerKg} kg a kg, indicative{F.meals && c.partner ? ` · ${fmt.num(F.meals)} meals by ${c.partner.name}'s rule` : ""}.</span></Card>} />;
  }

  // the batch's page: its head (the operator's batch head, SC-112) and its Money, Papers and Impact as tabs
  /* ---------- a batch's record (SC-142, option A): the photos sent for it, the yeses, the audit trail ---------- */
  // the photos: the label photo the distributor sent, with what Vision read of it, and, destroyed at his godown, the
  // destruction's before and after, with Vision's checks. A photo's src is its signed link on the live workspace, else
  // its file in the design system's img/
  const PHOTO = { label: ["Label photo", "Label"], before: ["Before, at the godown", "1 · Before"], after: ["After, at the landfill", "2 · After"], receipt: ["Staff sale receipt", "Receipt"] };
  const asDay = iso => new Date(iso.slice(0, 10) + "T00:00:00+05:30");
  // a time as the record keeps it: an ISO day and time on the live workspace and in the history, the stub's own (09:19,
  // Mon 5 Oct) for the story's batch
  const isIso = t => /^\d{4}-\d\d-\d\d/.test(t || "");
  const recWhen = t => (!t ? "" : !isIso(t) ? t : t.length > 10 ? `${fmt.day(t.slice(0, 10))}, ${t.slice(11, 16)}` : fmt.day(t));
  const recDay = iso => asDay(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const photoSrc = p => p.url || (p.img ? window.SC3_IMG + p.img : null);
  const upFirst = t => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
  function PhotoShot({ p, onOpen }) {
    const src = photoSrc(p), [title, tag] = PHOTO[p.id];
    if (!src) return <div className="rec-shot none"><Icon name="image" size={20} /><span className="t-caption">no photo kept</span></div>;
    return <button type="button" className="rec-shot" onClick={onOpen} aria-label={`${title}, sent ${recWhen(p.at)}: open it`}><S.Photo src={src} alt={`${title} for this batch`} loading="lazy" /><span className="cam-tag">{tag}</span></button>;
  }
  const RecCheck = ({ ok, children }) => <div className="row tight t-footnote rec-check"><Icon name={ok ? "circle-check" : "circle-alert"} size={15} className={ok ? "rec-ok" : "rec-warn"} />{children}</div>;
  function PhotoFacts({ p }) {
    const r = p.read;
    return <div className="stack tight">
      <span className="t-footnote muted">Sent by {p.by} · {recWhen(p.at)}</span>
      {r && <><RecCheck ok>Vision read batch {r.batch}, made {fmt.date(r.mfg)}, best before {fmt.date(r.bestBefore)}, MRP ₹{Number(r.mrp).toFixed(2)}{r.at ? ` · ${recWhen(r.at)}` : ""}</RecCheck><RecCheck ok={r.matches !== false}>{r.matches !== false ? "Matches the export" : "Does not match the export"}</RecCheck></>}
      {(p.checks || []).map(x => <RecCheck key={x.id} ok={x.ok}>{x.label}</RecCheck>)}
      {p.receipt && <><RecCheck ok>Vision read {p.receipt.no}: {p.receipt.payments} UPI payments, {fmt.inr2(p.receipt.paid)}</RecCheck><RecCheck ok={p.receipt.matches !== false}>{p.receipt.matches !== false ? `Matches the ${fmt.num(p.receipt.units)} packs recorded` : "Does not match the count"}</RecCheck></>}
    </div>;
  }
  function PhotoSheet({ p, onClose }) {
    return <Sheet open={!!p} onClose={onClose} title={p ? PHOTO[p.id][0] : ""}>{p && <div className="stack"><div className="rec-big"><S.Photo src={photoSrc(p)} alt={`${PHOTO[p.id][0]} for this batch`} /></div><PhotoFacts p={p} /></div>}</Sheet>;
  }
  function RecordPhotos({ photos, title, empty }) {
    const [open, setOpen] = useState(null);
    return <Card className="stack snug">
      <div className="card-head"><span className="card-title">{title}</span>{photos.length > 0 && <span className="t-footnote subtle">{photos.length} · tap to open</span>}</div>
      {photos.length ? <div className={cx("rec-photos", photos.length === 2 && "two")}>{photos.map(p => <div key={p.id} className="rec-photo"><PhotoShot p={p} onOpen={() => setOpen(p)} /><b className="t-subhead">{PHOTO[p.id][0]}</b><PhotoFacts p={p} /></div>)}</div>
        : <span className="t-footnote muted">{empty}</span>}
      <PhotoSheet p={open} onClose={() => setOpen(null)} />
    </Card>;
  }
  // who acted: a person's face, or the agent's tile
  const AGENT_ICON = { watcher: "radar", vision: "scan-line", valuer: "coins", router: "route", lister: "shopping-bag", outreach: "send", negotiator: "messages-square", donation: "heart-handshake", paperwork: "file-text", impact: "leaf", data: "database", notifier: "bell" };
  function Actor({ who, size = 36 }) {
    if (who.kind === "person" && who.id) return <Avatar person={D.PEOPLE[who.id] || { name: who.name }} size={size < 36 ? "sm" : undefined} />;
    const icon = who.kind === "agent" ? AGENT_ICON[who.id] || "sparkles" : "store";
    return <span className={cx("icontile", who.kind === "agent" && "soft")} style={{ width: size, height: size, borderRadius: 11 }}><Icon name={icon} size={Math.round(size * 0.47)} stroke={2} /></span>;
  }
  const whoLine = w => (w.kind === "agent" ? `${w.name} · agent` : w.org ? `${w.name} · ${w.org}` : w.name);
  // the yeses: what only a person at the client could let happen, in their name
  function RecordYeses({ steps }) {
    const yes = steps.filter(x => x.yes);
    return <Card className="stack snug"><span className="card-title">The yeses</span><span className="t-footnote muted">What only a person at {W.short} could let happen, in their name.</span>
      {yes.length ? yes.map(x => <div key={x.key + x.at} className="rec-yes"><Actor who={x.who} size={32} /><div className="grow" style={{ minWidth: 0 }}><b className="t-subhead">{x.who.name}</b><div className="t-footnote muted">{upFirst(x.text)}</div></div><time className="t-caption subtle tnum">{recWhen(x.at)}</time></div>)
        : <span className="t-footnote muted">No yes yet: the plan waits for one.</span>}
    </Card>;
  }
  // the audit trail: every step, day by day, by the agent or the person who took it; people's lines as the audit log
  // keeps them, the kiranas' orders folded into one; filtered to people or agents, and downloaded as a CSV
  function RecordTrail({ steps, batch }) {
    const [who, setWho] = useState("all"); const [unfold, setUnfold] = useState({});
    const rows = steps.filter(x => who === "all" || (who === "people" ? x.who.kind !== "agent" : x.who.kind === "agent"));
    const days = []; rows.forEach(x => { const d = isIso(x.at) ? x.at.slice(0, 10) : ""; let g = days[days.length - 1]; if (!g || g.d !== d) days.push(g = { d, items: [] }); g.items.push(x); });
    const people = steps.filter(x => x.who.kind !== "agent").length;
    const save = () => download(`${batch}-audit-trail.csv`, csv([["When", "Who", "As", "What", "Yes"]].concat(rows.flatMap(x => [[isIso(x.at) ? x.at.replace("T", " ") : x.at, x.who.name, x.who.kind === "agent" ? "agent" : x.who.org || "", upFirst(x.text), x.yes ? "yes" : ""]].concat((x.items || []).map(i => [i.at.replace("T", " "), i.who.name, "kirana", upFirst(i.text), ""]))))));
    return <Card className="stack snug">
      <div className="card-head"><span className="card-title">Audit trail</span><span className="t-footnote subtle">{steps.length} {steps.length === 1 ? "step" : "steps"} · {people} by people</span></div>
      <div className="rec-filters" role="group" aria-label="Whose steps">{[["all", "Everyone"], ["people", "People"], ["agents", "Agents"]].map(([k, t]) => <button key={k} type="button" className="chip" aria-pressed={who === k} onClick={() => setWho(k)}>{t}</button>)}</div>
      {!steps.length && <span className="t-footnote muted">The record fills as the agents and the people act on the batch.</span>}
      <div className="rec-trail">{days.map((g, gi) => <Fragment key={g.d + gi}>{(g.d || gi === 0) && <div className="rec-day">{g.d ? recDay(g.d) : "This journey"}</div>}
        {g.items.map((x, i) => <div key={x.key + x.at + i} className={cx("rec-row", i === g.items.length - 1 && "end")}>
          <Actor who={x.who} />
          <div style={{ minWidth: 0 }}><span className="who">{whoLine(x.who)}</span><b>{upFirst(x.text)}{x.yes && <> <Badge size="sm" tone="amber">yes</Badge></>}</b>
            {x.items && x.items.length > 0 && <><button type="button" className="pt-link t-footnote" aria-expanded={!!unfold[x.key + x.at]} onClick={() => setUnfold(u => Object.assign({}, u, { [x.key + x.at]: !u[x.key + x.at] }))}>{unfold[x.key + x.at] ? "Hide" : "Show"} the {x.items.length} {x.items.length === 1 ? "order" : "orders"}</button>
              {unfold[x.key + x.at] && <div className="rec-items">{x.items.map((y, j) => <div key={j} className="row between t-footnote"><span><b>{y.who.name}</b> {y.text}</span><span className="subtle tnum">{isIso(y.at) ? y.at.slice(11, 16) : y.at}</span></div>)}</div>}</>}
          </div>
          <time>{isIso(x.at) ? x.at.slice(11, 16) : x.at}</time></div>)}</Fragment>)}</div>
      <Button variant="secondary" icon="download" onClick={save} style={{ justifySelf: "start" }}>Download the audit trail (CSV)</Button>
    </Card>;
  }
  // the Record tab: the photos first, then the trail beside the yeses
  function RecordTab({ batch, steps, photos }) {
    return <div className="stack" style={{ gap: 16 }}>
      <RecordPhotos photos={photos} title="Photos sent for this batch" empty="No photo yet: Vision asks the distributor for the carton's label once the Watcher flags the batch." />
      <div className="rec-cols"><RecordTrail steps={steps} batch={batch} /><RecordYeses steps={steps} /></div>
    </div>;
  }

  function BatchPage({ me, at, tab: tab0 }) {
    const s = useStore(); const app = useApp(); const phone = app.bp === "phone";
    const c = LG().caseOf(at, s);
    const story = !c.history, h = story ? s.hero : CLEARED, row = !story || s.hero.posted ? LG().rowOf(c) : null;
    const [tab, setTab] = useState(tab0 || "money");
    const head = <div className="bhead">
      <div className="bh-id"><span className="bh-pic" aria-hidden="true"><Product name={c.sku.img} size={phone ? 46 : 72} alt="" /></span>
        <div className="bh-tt"><h1>{c.sku.name}</h1>
          <div className="bh-meta"><span className="mono">{c.batch.id}</span><span className="sep" aria-hidden="true">·</span><span>{c.dist.name}, {c.dist.city}</span></div>
          <div className="bh-meta">{row ? <OutcomeBadge o={row.outcome} /> : <Badge tone="blue" dot live>In flight</Badge>}<span>Flagged {dayOf(c.flagged)}{row ? ` · cleared ${dayOf(row.cleared)}` : ""}</span></div></div></div>
      <nav className="bh-tabs" aria-label={`${c.sku.name}, ${c.batch.id}`}>{TABS.map(t => <button key={t.id} type="button" className="bh-tab" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>{tab === t.id && <motion.span layoutId="lg-tab-thumb" className="bh-tab-thumb" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}{!phone && <Icon name={t.icon} size={16} />}<span>{t.label}</span></button>)}</nav>
    </div>;
    return <Screen me={me} title={c.sku.name} back="Ledger" hideLarge below={head}>
      <AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
        {tab === "money" ? <MoneyTab c={c} row={row} h={h} /> : tab === "papers" ? <PaperPack me={me} c={c} h={h} /> : tab === "record" ? <RecordTab batch={c.batch.id} steps={(story ? LG().record.storyRecord(s) : LG().record.recordOf(c)).steps} photos={story ? LG().record.storyPhotos(s) : LG().record.photosOf(c)} /> : <ImpactTab c={c} row={row} h={h} />}
      </motion.div></AnimatePresence>
    </Screen>;
  }

  // Finance & ESG: the ledger, or a batch's page when the address names one (`at`, the papers of the story's batch
  // that a push or the guided demo opens)
  function Report({ me, at }) {
    const { route } = useRoute(); const p = (route && route.params) || {}; const ref = (at && at.ref) || p.ref;
    return ref && LG().caseOf(ref) ? <BatchPage key={ref} me={me} at={ref} tab={(at && at.tab) || p.tab} /> : <Ledger me={me} />;
  }

  Object.assign(window.SC3_SCREENS, { Ink, Certificate, ReceiptRead, StaffReceiptPaper, RecordTab, RecordPhotos, PhotoSheet, PhotoFacts, Paperwork, PaperPack, Report, Ledger, BatchPage, Paper, Receipt, KiranaInvoice, KiranaRegister, KeepsWhat, OutcomeBadge, printPage, download, csv });
})();

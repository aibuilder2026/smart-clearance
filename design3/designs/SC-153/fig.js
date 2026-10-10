(function() {
  const { useState, useRef } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, Sheet, Product, Money } = K;
  const PA = () => window.SC3_PAPERS, L = () => window.SC3_LEDGER, P = () => window.SC3_LEDGER.partners;
  const r2 = (n) => Math.round(n * 100) / 100;
  const n2 = (n) => (n < 0 ? "-" : "") + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dmy = (iso) => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "";
  const asDate = (iso) => /* @__PURE__ */ new Date((iso.length > 10 ? iso : iso + "T00:00") + ":00+05:30");
  const day = (iso) => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const when = (iso) => iso.length > 10 ? `${day(iso)}, ${iso.slice(11, 16)}` : day(iso);
  const plus = (iso, min) => {
    const t = new Date(asDate(iso).getTime() + min * 6e4);
    const p = (x) => String(x).padStart(2, "0");
    const i = new Date(t.getTime() + 330 * 6e4);
    return `${i.getUTCFullYear()}-${p(i.getUTCMonth() + 1)}-${p(i.getUTCDate())}T${p(i.getUTCHours())}:${p(i.getUTCMinutes())}`;
  };
  const SERIES = { rakesh: { prefix: "RT/26-27/", first: 1164 }, lakshmi: { prefix: "LA/26-27/", first: 873 }, patil: { prefix: "PD/26-27/", first: 512 }, gupta: { prefix: "GS/26-27/", first: 2041 } };
  const shopOf = (id) => window.SC3_WORLD.KIRANAS.find((k) => k.id === id) || D.KIRANAS.find((k) => k.id === id);
  function invoiceOf({ no, at, c, shopId, units }) {
    const line = c.lines.kirana, sku = c.sku, dist = c.dist, buy = M.RULES.scheme.buy, free = M.RULES.scheme.free;
    const gross = r2(units * line.packPrice), taxable = r2(units * line.price), discount = r2(gross - taxable);
    const gstPct = Math.round(sku.gst * 100), cgst = r2(taxable * sku.gst / 2), sgst = cgst, exact = r2(taxable + cgst + sgst), total = Math.round(exact);
    return { no, at, date: at.slice(0, 10), ref: c.batch.id, c, sku, dist, shop: shopOf(shopId), units, rate: line.packPrice, gross, discountPct: r2(free / (buy + free) * 100), discount, taxable, gstPct, cgst, sgst, tax: r2(cgst + sgst), roundOff: r2(total - exact), total, mrp: sku.mrp, sell: units * sku.mrp, margin: r2(units * sku.mrp - total) };
  }
  function invoicesFor(distId, s) {
    const orders = [];
    L().HISTORY.filter((c) => c.dist.id === distId).forEach((c) => {
      const at = (c.steps.find((x) => x.step === "orders") || {}).at;
      c.kiranas.forEach((k, i) => orders.push({ at: plus(at, 2 * i), c, shopId: k.kirana, units: k.units }));
    });
    const sc = L().storyCase();
    if (sc.dist.id === distId) (s.hero.orders || []).forEach((o) => orders.push({ at: `${D.DAY0}T${o.at}`, c: sc, shopId: o.id, units: o.units }));
    orders.sort((a, b) => a.at < b.at ? -1 : a.at > b.at ? 1 : 0);
    const sr = SERIES[distId];
    return orders.map((o, i) => invoiceOf(Object.assign({ no: sr.prefix + String(sr.first + i).padStart(4, "0") }, o)));
  }
  const invoicesOf = (ref, distId, s) => invoicesFor(distId, s).filter((x) => x.ref === ref);
  const sum = (list, k) => r2(list.reduce((t, x) => t + x[k], 0));
  const range = (list) => list.length ? `${list[0].no} to ${list[list.length - 1].no.split("/").pop()}` : "";
  const Cell = ({ k, children, className }) => /* @__PURE__ */ React.createElement("div", { className: cx("tl-cell", className) }, k && /* @__PURE__ */ React.createElement("em", null, k), children);
  function KiranaInvoice({ inv }) {
    const R = inv.dist, k = inv.shop, sku = inv.sku, half = inv.gstPct / 2;
    const rows = [[`Less: Scheme discount, buy ${M.RULES.scheme.buy} get ${M.RULES.scheme.free} free`, `${n2(inv.discountPct)}%`, -inv.discount], [`CGST @ ${half}%`, "", inv.cgst], [`SGST @ ${half}%`, "", inv.sgst], ["Round off", "", inv.roundOff]];
    return /* @__PURE__ */ React.createElement("div", { className: "paper tl" }, /* @__PURE__ */ React.createElement("div", { className: "tl-title" }, "Tax Invoice"), /* @__PURE__ */ React.createElement("div", { className: "tl-copy" }, "(ORIGINAL FOR RECIPIENT)"), /* @__PURE__ */ React.createElement("div", { className: "tl-grid tl-two" }, /* @__PURE__ */ React.createElement(Cell, null, /* @__PURE__ */ React.createElement("b", null, R.name), /* @__PURE__ */ React.createElement("br", null), R.address, /* @__PURE__ */ React.createElement("br", null), "GSTIN/UIN: ", R.gstin, /* @__PURE__ */ React.createElement("br", null), "State Name: ", R.state, ", Code: ", R.stateCode, /* @__PURE__ */ React.createElement("br", null), "FSSAI Lic. No.: ", R.fssai, /* @__PURE__ */ React.createElement("br", null), "E-Mail: ", R.email), /* @__PURE__ */ React.createElement("div", { className: "tl-meta" }, /* @__PURE__ */ React.createElement(Cell, { k: "Invoice No." }, /* @__PURE__ */ React.createElement("b", null, inv.no)), /* @__PURE__ */ React.createElement(Cell, { k: "Dated" }, /* @__PURE__ */ React.createElement("b", null, dmy(inv.date))), /* @__PURE__ */ React.createElement(Cell, { k: "Buyer's Order No." }, "Scheme order, ", inv.at.slice(11, 16)), /* @__PURE__ */ React.createElement(Cell, { k: "Mode/Terms of Payment" }, "Cash on delivery"), /* @__PURE__ */ React.createElement(Cell, { k: "Dispatched through" }, "Own van, the scheme's round"), /* @__PURE__ */ React.createElement(Cell, { k: "Destination" }, k.area))), /* @__PURE__ */ React.createElement("div", { className: "tl-grid tl-two" }, /* @__PURE__ */ React.createElement(Cell, { k: "Buyer (Bill to and Ship to)" }, /* @__PURE__ */ React.createElement("b", null, k.name), /* @__PURE__ */ React.createElement("br", null), k.area, ", ", R.city, " ", k.pincode, ", ", R.state, /* @__PURE__ */ React.createElement("br", null), "GSTIN/UIN: Unregistered", /* @__PURE__ */ React.createElement("br", null), "State Name: ", R.state, ", Code: ", R.stateCode, /* @__PURE__ */ React.createElement("br", null), "Place of Supply: ", R.state, " (", R.stateCode, ")"), /* @__PURE__ */ React.createElement(Cell, { k: "Terms of Delivery" }, "Door delivery on the van round", /* @__PURE__ */ React.createElement("em", { style: { marginTop: 8 } }, "Reverse charge"), "No", /* @__PURE__ */ React.createElement("em", { style: { marginTop: 8 } }, "E-way bill"), "Not required: within ", R.city, ", under ₹", fmt.num(M.RULES.ewayThreshold))), /* @__PURE__ */ React.createElement("table", { className: "tl-table tl-items" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Sl"), /* @__PURE__ */ React.createElement("th", null, "Description of Goods"), /* @__PURE__ */ React.createElement("th", null, "HSN/SAC"), /* @__PURE__ */ React.createElement("th", null, "Quantity"), /* @__PURE__ */ React.createElement("th", null, "Rate"), /* @__PURE__ */ React.createElement("th", null, "per"), /* @__PURE__ */ React.createElement("th", null, "Amount"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null, "1"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("b", null, sku.brand, " ", sku.name), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { className: "tl-small" }, "Batch ", inv.ref, " · best before ", dmy(inv.c.batch.bestBefore), " · MRP ₹", sku.mrp.toFixed(2), " a pack, incl. of all taxes"), rows.map(([t, p]) => /* @__PURE__ */ React.createElement("div", { key: t, style: { marginTop: 6, textAlign: "right" } }, /* @__PURE__ */ React.createElement("b", null, t), p ? ` @ ${p}` : ""))), /* @__PURE__ */ React.createElement("td", null, sku.hsn), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, /* @__PURE__ */ React.createElement("b", null, fmt.num(inv.units), " PCS")), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, inv.rate.toFixed(2)), /* @__PURE__ */ React.createElement("td", null, "PCS"), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, n2(inv.gross), rows.map(([t, , v]) => /* @__PURE__ */ React.createElement("div", { key: t, style: { marginTop: 6 } }, n2(v))))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, /* @__PURE__ */ React.createElement("b", null, "Total")), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, /* @__PURE__ */ React.createElement("b", null, fmt.num(inv.units), " PCS")), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", null), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, /* @__PURE__ */ React.createElement("b", null, "₹ ", n2(inv.total)))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7 }, "Amount Chargeable (in words)", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("b", null, PA().words(inv.total)))))), /* @__PURE__ */ React.createElement("table", { className: "tl-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "HSN/SAC"), /* @__PURE__ */ React.createElement("th", null, "Taxable Value"), /* @__PURE__ */ React.createElement("th", null, "CGST · Rate"), /* @__PURE__ */ React.createElement("th", null, "Amount"), /* @__PURE__ */ React.createElement("th", null, "SGST · Rate"), /* @__PURE__ */ React.createElement("th", null, "Amount"), /* @__PURE__ */ React.createElement("th", null, "Total Tax"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null, sku.hsn), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, n2(inv.taxable)), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, half, "%"), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, n2(inv.cgst)), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, half, "%"), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, n2(inv.sgst)), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, n2(inv.tax))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7 }, "Tax Amount (in words): ", /* @__PURE__ */ React.createElement("b", null, PA().words(inv.tax)))))), /* @__PURE__ */ React.createElement("div", { className: "tl-grid tl-two" }, /* @__PURE__ */ React.createElement(Cell, null, "Company's PAN: ", /* @__PURE__ */ React.createElement("b", null, R.pan), /* @__PURE__ */ React.createElement("em", { style: { marginTop: 8 } }, "Declaration"), "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Sold under ", D.WORKSPACE.short, "'s scheme, within the best-before date."), /* @__PURE__ */ React.createElement(Cell, { k: "Company's Bank Details" }, "Bank Name: ", R.bank.name, /* @__PURE__ */ React.createElement("br", null), "A/c No.: ", R.bank.account, /* @__PURE__ */ React.createElement("br", null), "Branch & IFS Code: ", R.bank.ifsc, /* @__PURE__ */ React.createElement("div", { className: "tl-sign" }, "for ", /* @__PURE__ */ React.createElement("b", null, R.name)), /* @__PURE__ */ React.createElement("div", { className: "tl-num" }, "Authorised Signatory"))), /* @__PURE__ */ React.createElement("div", { className: "tl-foot" }, "SUBJECT TO ", R.city.toUpperCase(), " JURISDICTION · This is a Computer Generated Invoice"));
  }
  function Register({ list, onOpen, title }) {
    const R = list[0] && list[0].dist;
    return /* @__PURE__ */ React.createElement("div", { className: "paper tl skr" }, /* @__PURE__ */ React.createElement("div", { className: "tl-title" }, title || "Sales Register"), /* @__PURE__ */ React.createElement("div", { className: "tl-copy" }, R ? `${R.name} · tax invoices to kiranas · ${list[0].sku.brand} ${list[0].sku.name}, batch ${list[0].ref}` : ""), /* @__PURE__ */ React.createElement("table", { className: "tl-table skr-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Invoice No."), /* @__PURE__ */ React.createElement("th", null, "Particulars"), /* @__PURE__ */ React.createElement("th", null, "Packs"), /* @__PURE__ */ React.createElement("th", null, "Taxable"), /* @__PURE__ */ React.createElement("th", null, "CGST"), /* @__PURE__ */ React.createElement("th", null, "SGST"), /* @__PURE__ */ React.createElement("th", null, "Total"))), /* @__PURE__ */ React.createElement("tbody", null, list.map((x) => /* @__PURE__ */ React.createElement("tr", { key: x.no }, /* @__PURE__ */ React.createElement("td", { className: "tnum" }, dmy(x.date).slice(0, 5)), /* @__PURE__ */ React.createElement("td", null, onOpen ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link mono", onClick: () => onOpen(x) }, x.no) : /* @__PURE__ */ React.createElement("span", { className: "mono" }, x.no)), /* @__PURE__ */ React.createElement("td", null, x.shop.name), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, x.units), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, n2(x.taxable)), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, n2(x.cgst)), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, n2(x.sgst)), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, n2(x.total)))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 3 }, /* @__PURE__ */ React.createElement("b", null, list.length, " invoices")), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, /* @__PURE__ */ React.createElement("b", null, fmt.num(sum(list, "units")))), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, /* @__PURE__ */ React.createElement("b", null, n2(sum(list, "taxable")))), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, /* @__PURE__ */ React.createElement("b", null, n2(sum(list, "cgst")))), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, /* @__PURE__ */ React.createElement("b", null, n2(sum(list, "sgst")))), /* @__PURE__ */ React.createElement("td", { className: "tl-num" }, /* @__PURE__ */ React.createElement("b", null, n2(sum(list, "total"))))))), /* @__PURE__ */ React.createElement("div", { className: "tl-foot" }, "Taxable value ", fmt.inr2(sum(list, "taxable")), " is what the scheme sold: ", fmt.num(sum(list, "units")), " packets at ₹", list[0] ? list[0].c.lines.kirana.price.toFixed(2) : "", " effective"));
  }
  function PaperSheet({ title, open, onClose, children, pdfName }) {
    const ref = useRef(null);
    const pdf = () => {
      const n = ref.current;
      if (n) S.printPage(pdfName || title, n.innerHTML, { styles: true });
    };
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title, footer: /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, icon: "download", onClick: pdf }, "Download PDF") }, /* @__PURE__ */ React.createElement("div", { ref }, children));
  }
  const PtLine = ({ k, sub, v, strong }) => /* @__PURE__ */ React.createElement("div", { className: cx("pt-line", strong && "strong") }, /* @__PURE__ */ React.createElement("span", null, k, sub && /* @__PURE__ */ React.createElement("em", null, " ", sub)), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, v));
  function OrderFigures({ inv }) {
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement(PtLine, { k: `You ordered ${inv.units} packets`, sub: when(inv.at), v: "" }), /* @__PURE__ */ React.createElement(PtLine, { k: "Before GST", sub: `${inv.units} × ₹${inv.rate.toFixed(2)}, less the scheme's ${n2(inv.discountPct)}%`, v: fmt.inr2(inv.taxable) }), /* @__PURE__ */ React.createElement(PtLine, { k: "GST", sub: `CGST ${inv.gstPct / 2}% + SGST ${inv.gstPct / 2}%`, v: fmt.inr2(inv.tax) }), /* @__PURE__ */ React.createElement(PtLine, { k: "You paid", sub: "the invoice, to the rupee", v: fmt.inr(inv.total) }), /* @__PURE__ */ React.createElement(PtLine, { k: "You sell at MRP", sub: `${inv.units} × ₹${inv.mrp}`, v: fmt.inr(inv.sell) }), /* @__PURE__ */ React.createElement("div", { className: "hairline", style: { margin: "4px 0" } }), /* @__PURE__ */ React.createElement(PtLine, { k: "Your margin", v: fmt.inr2(inv.margin), strong: true }));
  }
  const shopInvoices = (shop, s) => invoicesFor(shop.distributor, s).filter((x) => x.shop.id === shop.id);
  const { Avatar, List, ListRow, Empty, Tile, DocCard, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle, Locked } = S;
  const CH = { kirana: { icon: "store", name: "Kirana scheme" }, expiresoon: { icon: "shopping-bag", name: "ExpireSoon lot" }, staff: { icon: "users", name: "Staff sale" }, foodbank: { icon: "heart-handshake", name: "Food bank" }, destroy: { icon: "recycle", name: "Destroyed at the godown", ch: "writeoff" } };
  const Chan = ({ id, icon }) => /* @__PURE__ */ React.createElement("span", { className: "dist-chan", style: { "--ch": `var(--ch-${CH[id] && CH[id].ch || id})` }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: icon || CH[id].icon, size: 16, stroke: 2 }));
  const stopBadge = (j) => /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: j.todo.length ? "amber" : j.phase === "cleared" ? "green" : "blue", dot: true, live: !j.todo.length && j.phase !== "cleared" }, j.todo.length ? `${j.todo.length} for you` : j.stop);
  function BatchLine({ sku, id, badge, sub, size = 48 }) {
    return /* @__PURE__ */ React.createElement("div", { className: "row dist-bl", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "grow stack tight", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("b", { className: "t-headline" }, sku.name), badge), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, id), sub ? ` · ${sub}` : "")));
  }
  const shown = (x) => {
    const sold = Math.round(x.sold), credit = Math.round(x.credit);
    return { sold, credit, cost: sold + credit };
  };
  function SumLine({ x }) {
    const v = shown(x);
    return /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(v.sold), " sold"), /* @__PURE__ */ React.createElement("em", null, "+ ", fmt.inr(v.credit), " credited = ", fmt.inr(v.cost)));
  }
  function OrderRow({ o, Shops, ref_, distId }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const { toast } = useNotice();
    const issue = () => {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        window.SC3_FLOW.act("issueInvoice");
        toast({ text: "Marked issued from Tally", tone: "ok" });
      }, 400);
    };
    const s = useStore();
    const inv = o.id === "kirana" ? invoicesOf(ref_, distId, s) : [];
    return /* @__PURE__ */ React.createElement("div", { className: "dist-order" }, /* @__PURE__ */ React.createElement(Chan, { id: o.id }), /* @__PURE__ */ React.createElement("span", { className: "grow stack tight", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, /* @__PURE__ */ React.createElement("b", null, o.who), " · ", o.what), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, CH[o.id].name, o.at ? ` · ${when(o.at)}` : "", o.sub ? ` · ${o.sub}` : ""), o.paper && /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "dist-paper" }, /* @__PURE__ */ React.createElement(Icon, { name: "file-text", size: 13 }), /* @__PURE__ */ React.createElement("span", { className: "mono" }, o.paper.no), /* @__PURE__ */ React.createElement("span", null, o.paper.label)), o.paper.issue && /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "check", loading: busy, onClick: issue }, "Issue from Tally")), inv.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "dist-paper" }, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 13 }), /* @__PURE__ */ React.createElement("span", { className: "mono" }, range(inv)), /* @__PURE__ */ React.createElement("span", null, inv.length, " tax invoices · ", fmt.inr2(sum(inv, "tax")), " GST collected"))), o.shops && o.shops.length > 0 && /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link t-footnote dist-toggle", "aria-expanded": open, onClick: () => setOpen(!open) }, open ? "Hide" : "Show", " the ", o.shops.length, " shops' orders"), open && /* @__PURE__ */ React.createElement(Shops, { o, inv })), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, o.amount ? fmt.inr(o.amount) : "given"));
  }
  function DistOrdersPage({ me, Shops }) {
    const s = useStore();
    const { go } = useRoute();
    const Px = P();
    const dist = S.distOf(me);
    const now = Px.distNow(dist.id, s).map((n) => {
      const j = Px.journeyOf(n);
      return { ref: n.ref, sku: j.sku, live: true, j, rows: Px.ordersNow(n, Px.shopName) };
    });
    const past = Px.distBatches(dist.id, s).past.map((c) => ({ ref: c.ref, sku: c.sku, live: false, outcome: c.outcome, cleared: c.cleared, rows: Px.ordersPast(Px.historyFacts(c), Px.shopName) })).filter((b) => b.rows.length);
    const sums = Px.sumsOf(Px.distBatches(dist.id, s).past);
    const total = (b) => Math.round(b.rows.reduce((t, o) => t + o.amount, 0) * 100) / 100;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Orders", sub: `${dist.name} · what sold from each of ${D.WORKSPACE.short}'s batches, to whom, on which paper` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 960 } }, now.concat(past).map((b) => /* @__PURE__ */ React.createElement(Card, { key: b.ref, className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(BatchLine, { sku: b.sku, id: b.ref, size: 44, badge: b.live ? stopBadge(b.j) : /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: b.outcome, size: "sm" }), sub: b.live ? b.j.phase === "cleared" ? "cleared · every order" : "orders so far" : `cleared ${day(b.cleared)}` }), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, !b.live && sums.batches.find((x) => x.ref === b.ref) ? /* @__PURE__ */ React.createElement(SumLine, { x: sums.batches.find((x) => x.ref === b.ref) }) : /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(total(b))), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", iconRight: "chevron-right", onClick: () => go("batches", { ref: b.ref }) }, "Papers"))), /* @__PURE__ */ React.createElement("div", { className: "dist-orders" }, b.rows.map((o) => /* @__PURE__ */ React.createElement(OrderRow, { key: o.id, o, Shops, ref_: b.ref, distId: dist.id })))))));
  }
  const DIST_TABS = [{ id: "what", label: "What happened", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "photos", label: "Photos", icon: "camera" }];
  function DistBatchPage({ me, id, tabs, Extra, PapersMore, start }) {
    const s = useStore();
    const dist = S.distOf(me);
    const [tab, setTab] = useState(start || "what");
    const [paper, setPaper] = useState(null);
    const past = P().distBatches(dist.id, s).past.find((c2) => c2.ref === id);
    const c = past || L().storyCase();
    const head = /* @__PURE__ */ React.createElement(S.PtHead, { sku: c.sku, id, where: `${dist.godown}, ${dist.city}`, badge: past ? /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" }) : /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", dot: true }, "Report"), line: past ? `Flagged ${day(c.flagged)} · cleared ${day(c.cleared)}` : `Flagged ${day(D.DAY0)} · the agents act in your name` }, /* @__PURE__ */ React.createElement(S.PtTabs, { tabs: tabs || DIST_TABS, value: tab, onChange: setTab, label: `${c.sku.name}, ${id}` }));
    let body;
    if (tab === "what") body = /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(S.PtMoments, { items: past ? P().moments(c) : P().storyMoments(s) }));
    else if (tab === "papers") {
      const p = P().distPapers(c);
      body = /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pt-head" }, "Your papers"), /* @__PURE__ */ React.createElement("div", { className: "pt-papers" }, p.mine.map((d) => /* @__PURE__ */ React.createElement(S.PaperRow, { key: d.id, c, d, onOpen: setPaper })), PapersMore && /* @__PURE__ */ React.createElement(PapersMore, { c, dist }))), p.copies.length ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pt-head" }, "Copies for your records"), /* @__PURE__ */ React.createElement("div", { className: "pt-papers" }, p.copies.map((d) => /* @__PURE__ */ React.createElement(S.PaperRow, { key: d.id, c, d, onOpen: setPaper })))) : null);
    } else body = Extra ? /* @__PURE__ */ React.createElement(Extra, { tab, c, dist }) : null;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: c.sku.name, back: "Batches", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement("div", { className: "pt-body" }, body), /* @__PURE__ */ React.createElement(S.PaperSheet, { open: !!paper, onClose: () => setPaper(null), c, id: paper, receipt: paper === "receipt" ? c.receipt : null }));
  }
  function PackPage({ me, cards, paperOf, startOn }) {
    const app = useApp();
    const s = useStore();
    const c = L().storyCase();
    const h = s.hero;
    const paperRef = useRef(null);
    const DOC = (id) => c.docs.find((d) => d.id === id);
    const extra = cards || [];
    const [picked, setPicked] = useState(startOn || null);
    const sel = picked || "invoice";
    const [sheet, setSheet] = useState(false);
    const own = DOC(sel);
    const more = extra.find((x) => x.doc.id === sel);
    const open = (id) => {
      setPicked(id);
      if (app.bp !== "desktop") setSheet(true);
    };
    const title = own ? own.type : more ? more.doc.type : "";
    const body = own ? /* @__PURE__ */ React.createElement(S.Paper, { id: sel, c }) : more ? paperOf(more) : null;
    const W = D.WORKSPACE;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Paperwork", sub: `${c.batch.id} · prepared by the Paperwork agent at the award` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Tile, { label: "Rakesh's invoice", icon: "receipt" }, /* @__PURE__ */ React.createElement(Money, { value: DOC("invoice").total, size: "s" })), /* @__PURE__ */ React.createElement(Tile, { label: "Price support", icon: "hand-coins" }, /* @__PURE__ */ React.createElement(Money, { value: DOC("support").amount, size: "s" })), /* @__PURE__ */ React.createElement(Tile, { label: "GST credit kept", icon: "badge-check" }, /* @__PURE__ */ React.createElement(Money, { value: DOC("itc").amount, size: "s", style: { color: "var(--primary-text)" } })), /* @__PURE__ */ React.createElement(Tile, { label: "Things to chase", icon: "list-checks" }, /* @__PURE__ */ React.createElement("span", { className: "num s" }, "0"))), /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 520,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Generated, drafted or not required, each with its reason", right: /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "reviewed") }, "Document pack"), /* @__PURE__ */ React.createElement("div", { className: "docgrid" }, c.docs.map((d) => /* @__PURE__ */ React.createElement("div", { key: d.id, className: cx("docpick", sel === d.id && app.bp === "desktop" && "on") }, /* @__PURE__ */ React.createElement(DocCard, { doc: d, onOpen: () => open(d.id) }))), extra.map((x) => /* @__PURE__ */ React.createElement("div", { key: x.doc.id, className: cx("docpick", sel === x.doc.id && app.bp === "desktop" && "on") }, /* @__PURE__ */ React.createElement(DocCard, { doc: x.doc, onOpen: () => open(x.doc.id) }))))),
        side: app.bp === "desktop" && body ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: more ? more.sub : own.owner === D.CLIENT.short ? `Issued by ${W.short}` : `Drafted for ${c.dist.name}`, right: /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "download" }, "Download PDF") }, title), /* @__PURE__ */ React.createElement("div", { ref: paperRef }, body)) : null
      }
    )), /* @__PURE__ */ React.createElement(Sheet, { open: sheet, onClose: () => setSheet(false), title }, body));
  }
  window.SCK = { r2, n2, dmy, day, when, SERIES, invoicesFor, invoicesOf, shopInvoices, sum, range, KiranaInvoice, Register, PaperSheet, OrderFigures, PtLine, Chan, DistOrdersPage, DistBatchPage, DIST_TABS, PackPage };
})();

(function() {
  const { useState, useEffect, useMemo, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Segmented, Sheet, Product, Empty, Money, Roll, Tile, MoneyPanel, DocCard, Menu, useApp, useNotice } = K;
  const { useStore, useRoute, Screen, Columns, SectionTitle, Locked } = S;
  const LG = () => window.SC3_LEDGER;
  const r2 = (n) => Math.round(n * 100) / 100;
  const W = D.WORKSPACE;
  const first = (name) => String(name || "").split(" ")[0];
  const possessive = (name) => /s$/.test(name) ? `${name}'` : `${name}'s`;
  const amount = (v) => /* @__PURE__ */ React.createElement("span", { className: "tnum", style: { whiteSpace: "nowrap" } }, v);
  const kg = (n) => fmt.kg(r2(n));
  const cartons = (u, per) => {
    const c = Math.floor(u / per), r = u % per;
    return r * 2 === per ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? "" : "s"}`;
  };
  const download = (name, text, type = "text/csv") => {
    const url = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  };
  const csv = (rows) => rows.map((r) => r.map((c) => {
    const v = String(c == null ? "" : c);
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(",")).join("\n");
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  function printPage(title, body, { styles = false } = {}) {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.tabIndex = -1;
    f.title = title;
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(f);
    const head = styles ? [...document.querySelectorAll('link[rel="stylesheet"], style')].map((n) => n.outerHTML).join("") : "";
    const base = `<style>body{margin:0;padding:28px;background:#fff;color:#1d1d1b;font:14px/1.5 system-ui,sans-serif}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:22px 0 8px}p{margin:4px 0;color:#4a4a45}table{width:100%;border-collapse:collapse;margin:6px 0 14px;font-size:12.5px}th,td{text-align:left;padding:5px 6px;border-bottom:1px solid #e3e0d6;vertical-align:top}th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#5a5a55}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}tr.total td{font-weight:700;border-top:1.5px solid #1d1d1b}.paper{box-shadow:none!important;max-width:760px;margin:0 auto}@page{size:A4;margin:14mm}</style>`;
    const d = f.contentDocument;
    d.open();
    d.write(`<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><title>${esc(title)}</title><base href="${esc(document.baseURI)}">${head}${base}</head><body>${body}</body></html>`);
    d.close();
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      try {
        f.contentWindow.focus();
        f.contentWindow.print();
      } finally {
        setTimeout(() => f.remove(), 1500);
      }
    };
    f.addEventListener("load", go);
    setTimeout(go, 1200);
  }
  const Line = ({ k, v, strong, sub }) => /* @__PURE__ */ React.createElement("div", { className: "pp-line" }, /* @__PURE__ */ React.createElement("span", null, k, sub && /* @__PURE__ */ React.createElement("em", null, " ", sub)), /* @__PURE__ */ React.createElement("span", { className: strong ? "pp-strong" : "" }, v));
  function Receipt({ doc: r, batch, sku, dist }) {
    return /* @__PURE__ */ React.createElement("div", { className: "paper pp" }, /* @__PURE__ */ React.createElement("div", { className: "pp-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pp-title" }, r.type), /* @__PURE__ */ React.createElement("div", { className: "pp-no" }, r.no, " · ", r.paper === "In-app receipt" ? "in-app" : "acknowledgement", " · ", fmt.date(r.date))), /* @__PURE__ */ React.createElement("span", { className: "pp-stamp ok" }, r.stamp)), /* @__PURE__ */ React.createElement("div", { className: "pp-parties" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("em", null, "Donor"), /* @__PURE__ */ React.createElement("b", null, r.donor), /* @__PURE__ */ React.createElement("span", null, "through ", r.via, ", ", r.from), /* @__PURE__ */ React.createElement("span", { className: "pp-mono" }, "FSSAI ", r.fssai)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("em", null, "Received by"), /* @__PURE__ */ React.createElement("b", null, r.owner), /* @__PURE__ */ React.createElement("span", null, dist.city), /* @__PURE__ */ React.createElement("span", { className: "pp-mono" }, r.paper))), /* @__PURE__ */ React.createElement("table", { className: "pp-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Goods"), /* @__PURE__ */ React.createElement("th", null, "Packs"), /* @__PURE__ */ React.createElement("th", null, "Weight"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null, sku.brand, " ", sku.name, /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("em", null, "Batch ", batch.id, " · best before ", fmt.date(batch.bestBefore))), /* @__PURE__ */ React.createElement("td", null, fmt.num(r.units)), /* @__PURE__ */ React.createElement("td", null, fmt.kg(r.kg))))), /* @__PURE__ */ React.createElement(Line, { k: "Collected", sub: `by ${r.by}`, v: `${fmt.day(r.date)}, ${r.at}` }), /* @__PURE__ */ React.createElement(Line, { k: "Served at", v: r.spot }), /* @__PURE__ */ React.createElement(Line, { k: "Meals", sub: r.mealsRule, v: fmt.num(r.meals) }), r.value != null && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "pp-sub" }, "For the donor's CSR records"), /* @__PURE__ */ React.createElement(Line, { k: "Value at the donor's cost", sub: `${fmt.num(r.units)} × ₹${sku.cost}, indicative`, v: fmt.inr2(r.value) }), /* @__PURE__ */ React.createElement(Line, { k: "CSR activity", v: r.csr })), /* @__PURE__ */ React.createElement("p", { className: "pp-note" }, r.note));
  }
  function Paper({ id, c: given }) {
    const c = given || LG().storyCase();
    const DOC = (x) => c.docs.find((d2) => d2.id === x);
    const d = DOC(id);
    const inv = c.invoice || DOC("invoice");
    const R = c.dist, B = c.buyer, dp = c.sku.dp, sp = c.support;
    const head = (title, no, stamp, ok) => /* @__PURE__ */ React.createElement("div", { className: "pp-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pp-title" }, title), /* @__PURE__ */ React.createElement("div", { className: "pp-no" }, no)), /* @__PURE__ */ React.createElement("span", { className: cx("pp-stamp", ok && "ok") }, stamp));
    if (id === "invoice" && inv) return /* @__PURE__ */ React.createElement("div", { className: "paper pp" }, head("Tax invoice", `${inv.no} · draft · ${fmt.date(inv.date)}`, "IGST"), /* @__PURE__ */ React.createElement("div", { className: "pp-parties" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("em", null, "From"), /* @__PURE__ */ React.createElement("b", null, R.name), /* @__PURE__ */ React.createElement("span", null, R.address), /* @__PURE__ */ React.createElement("span", { className: "pp-mono" }, "GSTIN ", R.gstin)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("em", null, "To"), /* @__PURE__ */ React.createElement("b", null, B.name), /* @__PURE__ */ React.createElement("span", null, B.address, " · place of supply ", B.stateCode), /* @__PURE__ */ React.createElement("span", { className: "pp-mono" }, "GSTIN ", B.gstin))), /* @__PURE__ */ React.createElement("table", { className: "pp-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Item"), /* @__PURE__ */ React.createElement("th", null, "HSN"), /* @__PURE__ */ React.createElement("th", null, "Qty"), /* @__PURE__ */ React.createElement("th", null, "Rate"), /* @__PURE__ */ React.createElement("th", null, "Taxable"))), /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", null, c.sku.brand, " ", c.sku.name, /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("em", null, "Batch ", c.batch.id, " · best before ", fmt.date(c.batch.bestBefore))), /* @__PURE__ */ React.createElement("td", null, c.sku.hsn), /* @__PURE__ */ React.createElement("td", null, inv.units), /* @__PURE__ */ React.createElement("td", null, "₹", inv.price.toFixed(2)), /* @__PURE__ */ React.createElement("td", null, fmt.inr2(inv.taxable))))), /* @__PURE__ */ React.createElement(Line, { k: "Taxable value", v: fmt.inr2(inv.taxable) }), /* @__PURE__ */ React.createElement(Line, { k: `IGST ${inv.gstPct}%`, sub: `${R.state} → ${B.state}`, v: fmt.inr2(inv.igst) }), /* @__PURE__ */ React.createElement(Line, { k: "Round off", v: fmt.inr2(inv.roundOff) }), /* @__PURE__ */ React.createElement(Line, { k: "Invoice total", v: fmt.inr2(inv.total), strong: true }), /* @__PURE__ */ React.createElement("p", { className: "pp-note" }, "Drafted by the Paperwork agent for ", R.name, " to issue from Tally. ", c.sku.gstNote, " The MRP of ", fmt.rate(c.sku.mrp), " stays printed on every pack: a discounted sale is fine, a second MRP is not (Legal Metrology)."));
    if (id === "eway" && inv) return /* @__PURE__ */ React.createElement("div", { className: "paper pp" }, head("E-way bill check", `${c.batch.id} · ${c.listing ? c.listing.id : ""}`, "NOT REQUIRED", true), /* @__PURE__ */ React.createElement(Line, { k: "Consignment value with GST", v: fmt.inr2(inv.total) }), /* @__PURE__ */ React.createElement(Line, { k: "Threshold, inter-state", v: fmt.inr2(M.RULES.ewayThreshold) }), /* @__PURE__ */ React.createElement(Line, { k: "E-way bill", v: "not required", strong: true }), /* @__PURE__ */ React.createElement("p", { className: "pp-note" }, d.note, " A transporter note travels with the ", cartons(c.lines.expiresoon.units, c.sku.perCarton), " on the buyer's truck instead."));
    if (id === "support") {
      const order = ["expiresoon", "kirana", "staff", "foodbank"];
      const rows = sp.rows.slice().sort((a, z) => order.indexOf(a.id) - order.indexOf(z.id));
      const kRow = sp.rows.find((r) => r.id === "kirana");
      const kl = c.lines.kirana;
      return /* @__PURE__ */ React.createElement("div", { className: "paper pp" }, head("Price-support credit note", `${d.no} · ${D.CLIENT.short} → ${R.name}`, "NO GST ADJ.", true), rows.map((r) => r.id === "expiresoon" ? /* @__PURE__ */ React.createElement(Line, { key: r.id, k: `${r.units} sold on ExpireSoon at ₹${r.price.toFixed(2)}`, sub: `₹${dp} − ₹${r.price.toFixed(2)} = ₹${r.gap.toFixed(2)} a pack`, v: fmt.inr2(r.amount) }) : r.id === "kirana" ? /* @__PURE__ */ React.createElement(Line, { key: r.id, k: `${r.units} sold to ${c.kiranas.length} kiranas at ₹${kl.price} effective`, sub: `₹${dp} − ₹${kl.price} = ₹${r.gap.toFixed(2)}, free packs included`, v: fmt.inr2(r.amount) }) : /* @__PURE__ */ React.createElement(Line, { key: r.id, k: `${r.units} to the ${r.short} at ₹${r.price.toFixed(2)}`, sub: `₹${dp} − ₹${r.price.toFixed(2)} = ₹${r.gap.toFixed(2)} a pack`, v: fmt.inr2(r.amount) })), kRow && /* @__PURE__ */ React.createElement(Line, { k: "Van delivery", sub: `${kRow.units} × ₹${M.RULES.vanPerUnit.toFixed(2)}`, v: fmt.inr2(sp.van) }), sp.fee ? /* @__PURE__ */ React.createElement(Line, { k: "ExpireSoon listing fee", v: fmt.inr2(sp.fee) }) : null, /* @__PURE__ */ React.createElement(Line, { k: "Round off", v: fmt.inr2(d.roundOff || 0) }), /* @__PURE__ */ React.createElement(Line, { k: `Credit to ${R.name}`, v: fmt.inr2(d.amount), strong: true }), /* @__PURE__ */ React.createElement("p", { className: "pp-note" }, "A financial credit note, with no GST adjustment, so ", R.name, " ends whole at the ₹", dp, " it paid. It covers the buy-", c.scheme.buy, "-get-", c.scheme.free, " scheme too, so no separate scheme note is needed. ", W.short, " pays this instead of an expiry claim of ", fmt.inr(c.claim.total), ". Trued up after the return window closes on ", fmt.day(c.returnBy), "."));
    }
    if (id === "itc") {
      const away = d.away != null ? d.away : (c.plan.donated || 0) + (c.plan.leftover || 0), sold = d.units != null ? d.units : c.plan.soldUnits, rev = d.reversed != null ? d.reversed : away ? c.plan.itcReversed : 0;
      const from = c.sku.itcPerUnit == null ? "estimated from the cost and the GST rate" : "from the cost sheet";
      return /* @__PURE__ */ React.createElement("div", { className: "paper pp" }, head("GST ITC memo", `Section 17(5)(h) · ${D.CLIENT.short}`, away ? "ITC PART REVERSED" : "ITC KEPT", !away), /* @__PURE__ */ React.createElement(Line, { k: "Packets sold under tax invoices", v: fmt.num(sold) }), /* @__PURE__ */ React.createElement(Line, { k: "Destroyed, gifted or lost", v: fmt.num(away) }), /* @__PURE__ */ React.createElement(Line, { k: "Input GST kept", sub: `₹${c.plan.writeOff.itcPerUnit.toFixed(2)} a pack, ${from}`, v: fmt.inr2(d.amount), strong: true }), /* @__PURE__ */ React.createElement(Line, { k: "Reversal in GSTR-3B, Table 4(B)(1)", v: rev ? fmt.inr2(rev) : "none" }), /* @__PURE__ */ React.createElement("p", { className: "pp-note" }, rev ? `Section 17(5)(h) blocks credit on goods written off, destroyed, lost or given away free. The ${fmt.num(away)} packs of this batch given away or destroyed have their credit reversed; the ${fmt.num(sold)} sold under tax invoices keep theirs. Credit on donated units is reversed: 17(5)(h) blocks it on gifts and, since 1 October 2023, 17(5)(fa) on CSR donations.` : `Section 17(5)(h) blocks credit on goods written off, destroyed, lost or given away free. These packs were sold under tax invoices, so it does not apply. The credit would be reversed only if the stock came back under the expiry claim and ${W.short} destroyed it. Credit on donated units is reversed: 17(5)(h) blocks it on gifts and, since 1 October 2023, 17(5)(fa) on CSR donations.`));
    }
    if (id === "expiry" && d) {
      const C = D.CLIENT.short, x = d;
      if (x.policy === "none") return /* @__PURE__ */ React.createElement("div", { className: "paper pp" }, head("Expiry notice", `${c.batch.id} · ${R.name}`, "NO RETURNS"), /* @__PURE__ */ React.createElement(Line, { k: "Packs expired at the godown", v: fmt.num(x.units), strong: true }), /* @__PURE__ */ React.createElement(Line, { k: `Credit from ${C}`, v: "none" }), /* @__PURE__ */ React.createElement("p", { className: "pp-note" }, x.note));
      return /* @__PURE__ */ React.createElement("div", { className: "paper pp" }, head(x.type, `${x.no} · ${C} → ${R.name}`, "NO GST ADJ.", true), /* @__PURE__ */ React.createElement(Line, { k: `${fmt.num(x.units)} packs expired at the godown`, sub: "at the dealer price", v: x.amount != null ? fmt.inr2(x.amount) : "—" }), /* @__PURE__ */ React.createElement(Line, { k: `Credit to ${R.name}`, v: x.amount != null ? fmt.inr2(x.amount) : "—", strong: true }), x.policy === "full-credit" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "pp-sub" }, possessive(C), " own costs, on destroying them"), /* @__PURE__ */ React.createElement(Line, { k: "Disposal", v: fmt.inr2(x.disposal) }), /* @__PURE__ */ React.createElement(Line, { k: "EPR on the packaging", v: fmt.inr2(x.epr) }), /* @__PURE__ */ React.createElement(Line, { k: "Input GST reversed", sub: "section 17(5)(h)", v: fmt.inr2(x.itc) }), /* @__PURE__ */ React.createElement(Line, { k: "Expiry, all in", v: fmt.inr2((x.amount || 0) + x.disposal + x.epr + x.itc), strong: true })), /* @__PURE__ */ React.createElement("p", { className: "pp-note" }, x.note));
    }
    if (id === "receipt" && d) return /* @__PURE__ */ React.createElement(Receipt, { doc: d, batch: c.batch, sku: c.sku, dist: c.dist });
    if (id === "fssai") {
      const own = d && d.status === "generated" && c.donation;
      const other = !own && c.donation && c.donation.batch && c.donation.batch.id !== c.batch.id && c.donation.units > 0 ? c.donation : null;
      return /* @__PURE__ */ React.createElement("div", { className: "paper pp" }, own ? /* @__PURE__ */ React.createElement(React.Fragment, null, head("FSSAI surplus-food checklist", c.batch.id, "GENERATED", true), /* @__PURE__ */ React.createElement(Line, { k: "Packs donated", v: fmt.num(c.plan.donated) }), /* @__PURE__ */ React.createElement(Line, { k: "Food bank", v: c.donation.partner.name }), /* @__PURE__ */ React.createElement("p", { className: "pp-note" }, "The batch's own checklist for the surplus food: ", c.donation.units, " packs from ", c.donation.from || c.dist.godown, " to ", c.donation.partner.name, ", inside their best-before, with the label photo attached.")) : /* @__PURE__ */ React.createElement(React.Fragment, null, head("FSSAI surplus-food checklist", c.batch.id, "NOT REQUIRED"), /* @__PURE__ */ React.createElement("p", { className: "pp-note" }, "Nothing from this batch was donated.", other ? ` The ${S.shortName(other.sku)} batch ${other.batch.id} has its own checklist: ${other.units} packs to ${other.partner.name}, ${other.dist.city}.` : "")));
    }
    const n = d && d.units || 0;
    return /* @__PURE__ */ React.createElement("div", { className: "paper pp" }, head("Destruction certificate", c.batch.id, n ? "GENERATED" : "NOT REQUIRED", !!n), /* @__PURE__ */ React.createElement(Line, { k: n ? "Units destroyed" : "Units left to destroy", v: fmt.num(n), strong: true }), n ? /* @__PURE__ */ React.createElement(Line, { k: "Input GST reversed", sub: "section 17(5)(h), GSTR-3B Table 4(B)(1)", v: fmt.inr2(n * c.plan.writeOff.itcPerUnit) }) : null, /* @__PURE__ */ React.createElement("p", { className: "pp-note" }, "Issued only when units remain, with the ITC reversal entry pre-filled so finance is never surprised."));
  }
  function KeepsWhat({ c: given }) {
    const s = useStore();
    const c = given || LG().storyCase();
    const x0 = c.history ? c.expiry : s.hero.expiry;
    const x = x0 && x0.units > 0 ? x0 : null;
    const dp = c.sku.dp;
    const took = c.support.rows.reduce((t, r) => t + r.units * r.price, 0), credit = x && x.credit || 0, settled = x ? x.total : 0;
    const recv = took + c.support.total;
    const paid = c.plan.units * dp + c.support.van + c.support.fee;
    const ends = Math.round(recv + credit - paid);
    const gift = c.plan.lines.find((l) => l.id === "foodbank" && l.units > 0), given2 = gift ? gift.cost + gift.itcLoss : 0;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Who keeps what"), /* @__PURE__ */ React.createElement("div", { className: "stack tight t-subhead" }, /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", null, c.dist.name, " receives"), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr(recv))), credit > 0 && /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", null, "and the expiry credit for ", fmt.num(x.units), " packs"), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr(credit))), /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", null, "and paid ", fmt.num(c.plan.units), " × ₹", dp, ", the van and the fee"), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr(-paid))), /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("b", null, x && !credit ? "Its loss on the expired packs" : "He ends whole"), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(ends))), /* @__PURE__ */ React.createElement("div", { className: "hairline", style: { margin: "4px 0" } }), /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", null, "Expiry claim ", W.short, " avoids"), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr(c.claim.total))), /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", null, "Price support it pays instead"), /* @__PURE__ */ React.createElement("span", { className: "tnum neg" }, fmt.inr(-c.support.total))), settled > 0 && /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", null, "and the expiry settlement for ", fmt.num(x.units), " packs"), /* @__PURE__ */ React.createElement("span", { className: "tnum neg" }, fmt.inr(-settled))), given2 > 0 && /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("span", null, "and the donation's handling and credit, ", fmt.num(gift.units), " packs"), /* @__PURE__ */ React.createElement("span", { className: "tnum neg" }, fmt.inr(-given2))), /* @__PURE__ */ React.createElement("div", { className: "row between" }, /* @__PURE__ */ React.createElement("b", null, "Better for ", W.short), /* @__PURE__ */ React.createElement(Money, { value: c.claim.total - c.support.total - settled - given2, size: "s", style: { color: "var(--primary-text)", fontSize: 22 } }))), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "The same ", fmt.inr(c.actual.swing), " swing as the ledger, seen from ", W.short, "'s cash: the ₹", dp, " credit ", first(c.dist.short), " would have claimed and the ₹", dp, " he paid cancel out. At plan prices it is ", fmt.inr(c.supportPlan.total), " of support and a ", fmt.inr(c.plan.swing), " swing."));
  }
  const CLEARED = { phase: "cleared", docs: true, reviewed: true, posted: true, van: { status: "done" } };
  function PaperPack({ me, c, h }) {
    const app = useApp();
    const { toast } = useNotice();
    const paperRef = useRef(null);
    const sheetRef = useRef(null);
    const DOC = (id) => c.docs.find((d) => d.id === id);
    const ready = !!h.docs;
    const awarded = c.lines.expiresoon.units > 0;
    const his = first(c.dist.short);
    const [picked, setPicked] = useState(null);
    const sel = picked && DOC(picked) ? picked : DOC("expiry") ? "expiry" : (c.docs[0] || { id: "invoice" }).id;
    const [sheet, setSheet] = useState(false);
    const doc = DOC(sel), invoice = DOC("invoice"), support = DOC("support");
    const open = (id) => {
      setPicked(id);
      if (app.bp !== "desktop") setSheet(true);
    };
    const exportPack = () => {
      download(`${c.batch.id}-document-pack.csv`, csv([["Document", "Issued by", "Number", "Status", "Amount (₹)", "Note"], ...c.docs.map((d) => [d.type, d.owner, d.no, d.status, d.amount ? d.amount.toFixed(2) : "", d.note || ""])]));
      toast({ text: "Document pack exported", tone: "ok" });
    };
    const pdf = (node) => () => {
      if (node.current) printPage(`${doc.type} ${doc.no || ""} · ${c.batch.id}`, `<div class="${node.current.className}">${node.current.innerHTML}</div>`, { styles: true });
    };
    const pdfButton = (node) => doc && doc.status !== "not required" ? /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "download", onClick: pdf(node), "aria-label": `Download ${doc.type} as a PDF` }, "Download PDF") : null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, !ready ? /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Product, { name: "documents", size: 88 }), /* @__PURE__ */ React.createElement("div", { className: "grow stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", null, awarded ? "The pack is drafted at the award" : "The pack is drafted once every line is done"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, awarded ? `${his}'s tax invoice, the e-way bill check, ` : "", W.short, "'s price-support credit note, the ITC memo, the FSSAI checklist and the destruction certificate, each generated or marked not required with the reason."))), /* @__PURE__ */ React.createElement(Locked, { icon: "file-text", agent: "Paperwork agent", live: h.phase === "dispatched", text: h.phase === "dispatched" ? "Drafting Rakesh's invoice, the e-way bill check, the credit note and the ITC memo." : "Drafts the whole pack once the lot is awarded and on the buyer's truck." }), /* @__PURE__ */ React.createElement("div", { className: "docgrid" }, c.docs.map((d) => /* @__PURE__ */ React.createElement(K.Skeleton, { key: d.id, h: 132, r: 20 })))) : /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 12 } }, invoice && /* @__PURE__ */ React.createElement(Tile, { label: `${his}'s invoice`, icon: "receipt" }, /* @__PURE__ */ React.createElement(Money, { value: invoice.total, size: "s" })), support && /* @__PURE__ */ React.createElement(Tile, { label: "Price support", icon: "hand-coins" }, /* @__PURE__ */ React.createElement(Money, { value: support.amount, size: "s" })), /* @__PURE__ */ React.createElement(Tile, { label: "GST credit kept", icon: "badge-check" }, /* @__PURE__ */ React.createElement(Money, { value: (DOC("itc") || { amount: 0 }).amount, size: "s", style: { color: "var(--primary-text)" } })), /* @__PURE__ */ React.createElement(Tile, { label: "Things to chase", icon: "list-checks" }, /* @__PURE__ */ React.createElement("span", { className: "num s" }, "0"))), /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 460,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Generated, drafted or not required, each with its reason", right: /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "download", onClick: exportPack }, "Export"), h.reviewed ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "reviewed") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "check", onClick: () => {
          Flow.act("review");
          toast({ text: "Pack reviewed · logged", tone: "ok" });
        } }, "Mark reviewed")) }, "Document pack"), /* @__PURE__ */ React.createElement("div", { className: "docgrid" }, c.docs.map((d) => /* @__PURE__ */ React.createElement("div", { key: d.id, className: cx("docpick", sel === d.id && app.bp === "desktop" && "on") }, /* @__PURE__ */ React.createElement(DocCard, { doc: d, onOpen: () => open(d.id) })))), /* @__PURE__ */ React.createElement(KeepsWhat, { c })),
        side: app.bp === "desktop" && doc ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: doc.owner === D.CLIENT.short ? `Issued by ${W.short}` : `Drafted for ${c.dist.name}`, right: pdfButton(paperRef) }, doc.type), /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, /* @__PURE__ */ React.createElement(motion.div, { key: sel, initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.18 } }, /* @__PURE__ */ React.createElement("div", { ref: paperRef }, /* @__PURE__ */ React.createElement(Paper, { id: sel, c }))))) : null
      }
    )), /* @__PURE__ */ React.createElement(Sheet, { open: sheet, onClose: () => setSheet(false), title: doc ? doc.type : "", footer: pdfButton(sheetRef) }, /* @__PURE__ */ React.createElement("div", { ref: sheetRef }, /* @__PURE__ */ React.createElement(Paper, { id: sel, c }))));
  }
  function Paperwork({ me }) {
    const s = useStore();
    const c = LG().storyCase();
    const awarded = c.lines.expiresoon.units > 0;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Paperwork", sub: `${c.batch.id} · prepared by the Paperwork agent ${awarded ? "at the award" : "once every line was done"}` }, /* @__PURE__ */ React.createElement(PaperPack, { me, c, h: s.hero }));
  }
  const READINGS = [{ id: "money", label: "Money", icon: "coins" }, { id: "gst", label: "GST", icon: "badge-check" }, { id: "impact", label: "Impact", icon: "leaf" }];
  const OUTCOME = { sold: { label: "Sold through", tone: "green", icon: "check" }, leftover: { label: "Left at the godown", icon: "warehouse" }, donation: { label: "Donated", icon: "heart-handshake" } };
  const OutcomeBadge = ({ o, size }) => {
    const x = OUTCOME[o];
    return x ? /* @__PURE__ */ React.createElement(Badge, { size, tone: x.tone, icon: x.icon }, x.label) : null;
  };
  const valueOf = (r, reading) => reading === "money" ? r.figures.net : reading === "gst" ? r.figures.itcKept : r.figures.kg;
  const figure = (r, reading) => reading === "money" ? fmt.inr(r.figures.net) : reading === "gst" ? fmt.inr(r.figures.itcKept) : kg(r.figures.kg);
  const second = (r, reading) => {
    const F = r.figures;
    if (reading === "money") return `of ${fmt.inr(F.writeOff)} if destroyed`;
    if (reading === "gst") return F.itcReversed ? `${fmt.inr(F.itcReversed)} reversed` : "nothing reversed";
    return F.meals ? `${fmt.num(F.meals)} meals` : F.destroyedKg ? `${kg(F.destroyedKg)} destroyed` : `${kg(F.co2)} CO₂e`;
  };
  const binShare = (r, reading) => {
    const F = r.figures;
    if (reading === "gst") return F.itcReversed / (F.itcKept + F.itcReversed || 1);
    if (reading === "impact") return F.destroyedKg / (F.kg + F.destroyedKg || 1);
    return F.destroyed / (F.units || 1);
  };
  const dayOf = (iso) => fmt.day(iso);
  const monthOf = (iso) => (/* @__PURE__ */ new Date(iso + "T00:00:00")).toLocaleDateString("en-IN", { month: "short" });
  function Lakh({ value }) {
    return /* @__PURE__ */ React.createElement("span", { className: "num l money" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "₹" + (value / 1e5).toFixed(2) + " lakh"), /* @__PURE__ */ React.createElement("span", { className: "cur", "aria-hidden": "true" }, "₹"), /* @__PURE__ */ React.createElement(Roll, { value: value / 1e5, format: (v) => v.toFixed(2), hidden: true }), /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true", className: "lg-unit" }, "lakh"));
  }
  function Kilos({ value }) {
    const t = value >= 1e3;
    return /* @__PURE__ */ React.createElement("span", { className: "num l" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, kg(value)), /* @__PURE__ */ React.createElement(Roll, { value: t ? value / 1e3 : value, format: (v) => t ? v.toFixed(2) : Math.round(v).toLocaleString("en-IN"), hidden: true }), /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true", className: "lg-unit" }, t ? "t" : "kg"));
  }
  function Headline({ t, reading, p }) {
    if (reading === "money") return /* @__PURE__ */ React.createElement("div", { className: "lg-head" }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Lakh, { value: t.net }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "recovered")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, "From ", t.batches, " ", t.batches === 1 ? "batch" : "batches", " that would have cost ", fmt.lakh(t.writeOff), " to destroy: ", /* @__PURE__ */ React.createElement("b", null, fmt.lakh(t.swing)), " better than the bin, after ", fmt.lakh(t.support), " of price support to the distributors", t.credit ? ` and ${fmt.inr(t.credit)} of expiry credit` : "", "."));
    if (reading === "gst") return /* @__PURE__ */ React.createElement("div", { className: "lg-head" }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: t.itcKept, size: "l", roll: true }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "of input credit kept")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, "Sold under tax invoices, so the credit stands. ", /* @__PURE__ */ React.createElement("b", null, fmt.inr(t.itcReversed)), " reversed under s.17(5)(h) on packs destroyed or given away (GSTR-3B Table 4(B)(1)). ", t.invoices, " distributors' invoices, ", t.creditNotes, " credit notes, ", t.reviewed === t.batches ? "every pack reviewed" : `${t.reviewed} of ${t.batches} packs reviewed`, "."));
    return /* @__PURE__ */ React.createElement("div", { className: "lg-head" }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Kilos, { value: t.kg }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "kept out of landfill")), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, kg(t.resoldKg), " resold and ", kg(t.donatedKg), " donated, ", fmt.num(t.meals), " meals. ", /* @__PURE__ */ React.createElement("b", null, kg(t.destroyedKg)), " destroyed when it expired at the godown. ", kg(t.co2), " CO₂e avoided, indicative. ", p.long, "."));
  }
  function Strip({ list, reading, onOpen }) {
    const reduce = useReducedMotion();
    const app = useApp();
    const total = list.reduce((t, r) => t + valueOf(r, reading), 0) || 1;
    let at = 0;
    const starts = list.map((r) => {
      const s0 = at;
      at += valueOf(r, reading);
      return s0 / total;
    });
    const months = [];
    list.forEach((r, i) => {
      const m = r.cleared.slice(0, 7);
      if (!months.length || months[months.length - 1].m !== m) months.push({ m, i, label: monthOf(r.cleared) });
    });
    return /* @__PURE__ */ React.createElement("div", { className: "lg-stripwrap" }, /* @__PURE__ */ React.createElement("div", { className: "lg-strip", role: "group", "aria-label": "The period's batches, each as wide as its figure" }, list.map((r, i) => {
      const share = binShare(r, reading);
      return /* @__PURE__ */ React.createElement(
        motion.button,
        {
          key: r.ref + reading,
          type: "button",
          className: cx("lg-seg", r.outcome),
          style: { flexGrow: Math.max(valueOf(r, reading), total * 0.012) },
          onClick: () => onOpen(r),
          initial: reduce ? false : { scaleX: 0, opacity: 0 },
          animate: { scaleX: 1, opacity: 1 },
          transition: { duration: 0.42, delay: reduce ? 0 : i * 0.035, ease: [0.22, 1, 0.36, 1] },
          "aria-label": `${r.name}, ${r.ref}: ${figure(r, reading)}, ${OUTCOME[r.outcome].label}`,
          title: `${r.name} · ${figure(r, reading)}`
        },
        share > 4e-3 && /* @__PURE__ */ React.createElement("i", { className: "lg-bin", style: { width: Math.max(4, share * 100) + "%" }, "aria-hidden": "true" }),
        app.bp !== "phone" && /* @__PURE__ */ React.createElement("span", { className: "lg-seglabel", "aria-hidden": "true" }, first(r.name))
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "lg-ticks", "aria-hidden": "true" }, months.map((m) => /* @__PURE__ */ React.createElement("span", { key: m.m, style: { left: starts[m.i] * 100 + "%" } }, m.label))), /* @__PURE__ */ React.createElement("div", { className: "lg-legend" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "sold" }), "Sold through"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "leftover" }), "Left at the godown"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "donation" }), "Donated"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "bin" }), reading === "gst" ? "Credit reversed" : reading === "impact" ? "Destroyed" : "Packs destroyed")));
  }
  const periodName = (p) => p.kind === "year" ? p.long : p.label;
  const PERIOD_FILE = (p) => (p.kind === "year" ? p.long.replace(/ so far$/, "") : p.label).replace(/\s+/g, "-");
  function exportBRSR(p, list) {
    download(`BRSR-P6-waste-${PERIOD_FILE(p)}.csv`, csv([
      ["Category", "Diverted (kg)", "Resold (kg)", "Donated (kg)", "Disposed (kg)", "Evidence"],
      ...p.brsr.map((r) => [r.cat, r.diverted, r.resold, r.donated, r.disposed, r.evidence]),
      ...list.map((r) => [`Batch ${r.ref} (${r.name})`, r.figures.kg, r.figures.resoldKg, r.figures.donatedKg, r.figures.destroyedKg, r.papers.filter((x) => x.status !== "not required" && ["invoice", "support", "expiry", "receipt"].includes(x.id)).map((x) => x.no).join("; ")])
    ]));
  }
  function exportGST(p, list) {
    const no = (r, id) => r.papers.find((x) => x.id === id && x.status !== "not required") || {};
    download(`GST-summary-${PERIOD_FILE(p)}.csv`, csv([
      ["Batch", "Product", "Distributor", "Cleared", "Tax invoice", "Invoice total (₹)", "Price-support credit note", "Credit (₹)", "Expiry credit note", "Expiry credit (₹)", "Input GST kept (₹)", "Reversed, s.17(5)(h) (₹)"],
      ...list.map((r) => [r.ref, r.name, r.distributorName, r.cleared, no(r, "invoice").no || "", no(r, "invoice").amount != null ? no(r, "invoice").amount : "", no(r, "support").no || "", r.figures.support, no(r, "expiry").no || "", r.figures.credit || "", r.figures.itcKept, r.figures.itcReversed]),
      ["Total", "", "", "", `${p.totals.invoices} invoices`, r2(list.reduce((t, r) => t + (no(r, "invoice").amount || 0), 0)), `${p.totals.creditNotes} credit notes`, p.totals.support, "", p.totals.credit, p.totals.itcKept, p.totals.itcReversed]
    ]));
  }
  function exportLedger(p, list) {
    download(`Ledger-${PERIOD_FILE(p)}.csv`, csv([
      ["Batch", "Product", "Distributor", "Flagged", "Cleared", "Outcome", "Recovered (₹)", "Would-be write-off (₹)", "Better than the bin (₹)", "P&L (₹)", "Input GST kept (₹)", "Reversed (₹)", "Resold (kg)", "Donated (kg)", "Destroyed (kg)", "CO₂e avoided (kg)", "Meals"],
      ...list.map((r) => {
        const F = r.figures;
        return [r.ref, r.name, r.distributorName, r.flagged, r.cleared, OUTCOME[r.outcome].label, F.net, F.writeOff, F.swing, F.pnl, F.itcKept, F.itcReversed, F.resoldKg, F.donatedKg, F.destroyedKg, F.co2, F.meals];
      })
    ]));
  }
  function printReport(p, list, since) {
    const t = p.totals, row = (cells, cls) => `<tr${cls ? ` class="${cls}"` : ""}>${cells.map(([v, n]) => `<td${n ? ' class="n"' : ""}>${esc(v)}</td>`).join("")}</tr>`;
    const body = `<h1>${esc(W.name)} · Finance &amp; ESG · ${esc(periodName(p))}</h1><p>${esc(p.long)}. Every batch cleared since ${esc(since)}, as its posted ledger. CO₂e, disposal and EPR are indicative.</p>
      <h2>Money</h2><table><tbody>${[["Recovered", fmt.inr2(t.net)], ["Would-be write-off", fmt.inr2(t.writeOff)], ["Better than the bin", fmt.inr2(t.swing)], ["Price support to the distributors", fmt.inr2(t.support)], ["Expiry credit", fmt.inr2(t.credit)]].map(([k, v]) => row([[k], [v, 1]])).join("")}</tbody></table>
      <h2>GST</h2><table><tbody>${[["Input GST kept", fmt.inr2(t.itcKept)], ["Reversed under s.17(5)(h), GSTR-3B Table 4(B)(1)", fmt.inr2(t.itcReversed)], ["Distributors' tax invoices", fmt.num(t.invoices)], ["Credit notes", fmt.num(t.creditNotes)], ["Packs reviewed", `${t.reviewed} of ${t.batches}`]].map(([k, v]) => row([[k], [v, 1]])).join("")}</tbody></table>
      <h2>Impact</h2><table><tbody>${[["Kept out of landfill", kg(t.kg)], ["Resold", kg(t.resoldKg)], ["Donated", kg(t.donatedKg)], ["Destroyed at the godown", kg(t.destroyedKg)], ["CO₂e avoided, indicative", kg(t.co2)], ["Meals", fmt.num(t.meals)]].map(([k, v]) => row([[k], [v, 1]])).join("")}</tbody></table>
      <h2>BRSR Principle 6 · waste</h2><table><thead><tr><th>Category</th><th class="n">Diverted, kg</th><th class="n">Resold</th><th class="n">Donated</th><th class="n">Disposed</th><th>Evidence</th></tr></thead><tbody>${p.brsr.map((r) => row([[r.cat], [fmt.num(r.diverted), 1], [fmt.num(r.resold), 1], [fmt.num(r.donated), 1], [fmt.num(r.disposed), 1], [r.evidence]])).join("")}</tbody></table>
      <h2>The batches</h2><table><thead><tr><th>Batch</th><th>Product</th><th>Cleared</th><th>Outcome</th><th class="n">Recovered</th><th class="n">GST kept</th><th class="n">Reversed</th><th class="n">Kept out</th></tr></thead><tbody>${list.map((r) => row([[r.ref], [r.name], [fmt.date(r.cleared)], [OUTCOME[r.outcome].label], [fmt.inr(r.figures.net), 1], [fmt.inr(r.figures.itcKept), 1], [fmt.inr(r.figures.itcReversed), 1], [kg(r.figures.kg), 1]])).join("")}${row([["Total"], [""], [""], [`${t.batches} batches`], [fmt.inr(t.net), 1], [fmt.inr(t.itcKept), 1], [fmt.inr(t.itcReversed), 1], [kg(t.kg), 1]], "total")}</tbody></table>
      <p>The companies and people are fictional.</p>`;
    printPage(`${W.short} Finance and ESG ${periodName(p)}`, body);
  }
  function ExportMenu({ p, list, since }) {
    const [open, setOpen] = useState(false);
    const { toast } = useNotice();
    const done = (text) => toast({ text, tone: "ok" });
    return /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "download", "aria-haspopup": "menu", "aria-expanded": open, onClick: () => setOpen((o) => !o) }, "Export"), /* @__PURE__ */ React.createElement(Menu, { open, onClose: () => setOpen(false), width: 260, label: `Export ${p.label}`, items: [
      { label: `Export ${p.label}`, heading: true },
      { label: "BRSR table", icon: "leaf", right: /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "CSV"), onClick: () => {
        exportBRSR(p, list);
        done("BRSR table exported as CSV");
      } },
      { label: "GST summary", icon: "badge-check", right: /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "CSV"), onClick: () => {
        exportGST(p, list);
        done("GST summary exported as CSV");
      } },
      { label: "The ledger", icon: "file-spreadsheet", right: /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "CSV"), onClick: () => {
        exportLedger(p, list);
        done("Ledger exported as CSV");
      } },
      "-",
      { label: "The report", icon: "file-text", right: /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "PDF"), onClick: () => printReport(p, list, since) }
    ] }));
  }
  function Ledger({ me }) {
    const s = useStore();
    const app = useApp();
    const phone = app.bp === "phone";
    const { go } = useRoute();
    const book = useMemo(() => LG().ledger(s), [s.hero.posted, s.hero.phase, s.mango.phase]);
    const year = book.periods.find((x) => x.kind === "year" && x.current) || book.periods[book.periods.length - 1];
    const [pid, setPid] = useState(year.id);
    const p = book.periods.find((x) => x.id === pid) || year;
    const [reading, setReading] = useState("money");
    const list = book.batches.filter((r) => r.cleared >= p.from && r.cleared <= p.to);
    const open = (r) => go("report", { ref: r.ref });
    const flying = p.current ? book.inFlight : [];
    const sumOf = (t) => reading === "impact" ? kg(t.kg) : fmt.inr(reading === "gst" ? t.itcKept : t.net);
    const months = p.months.slice().reverse().map((m) => ({ ...m, items: list.filter((r) => r.cleared.slice(0, 7) === m.month).reverse() }));
    const exports = list.length ? /* @__PURE__ */ React.createElement(ExportMenu, { p, list, since: book.since }) : null;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Ledger", sub: `One ledger, three readings · every batch ${W.short} has cleared since ${book.since}`, actions: !phone && exports }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap between", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Segmented, { label: "Period", value: p.id, onChange: setPid, options: book.periods.map((x) => ({ id: x.id, label: x.label })) }), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Segmented, { label: "Reading", value: reading, onChange: setReading, options: READINGS }), phone && exports)), /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement(Headline, { t: p.totals, reading, p }), list.length ? /* @__PURE__ */ React.createElement(Strip, { list, reading, onOpen: open }) : /* @__PURE__ */ React.createElement(Empty, { icon: "book-open", title: `Nothing cleared in ${p.label} yet`, body: `Each batch joins the ledger when Impact posts it, after its return window closes. ${flying.length ? `${flying.length} ${flying.length === 1 ? "batch is" : "batches are"} still out.` : ""}` })), flying.length ? /* @__PURE__ */ React.createElement(List, { head: "Still out" }, flying.map((b) => /* @__PURE__ */ React.createElement(ListRow, { key: b.ref, leading: /* @__PURE__ */ React.createElement(Product, { name: b.img, size: 40 }), title: b.name, sub: `${b.ref} · ${b.distributorName} · flagged ${dayOf(b.flagged)}`, value: /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true, live: true }, (D.STAGES.find((x) => x.id === b.stage) || { title: b.stage }).title) }))) : null, months.map((g) => /* @__PURE__ */ React.createElement(List, { key: g.month, head: `${g.label} · ${g.totals.batches} ${g.totals.batches === 1 ? "batch" : "batches"} · ${sumOf(g.totals)}` }, g.items.map((r) => /* @__PURE__ */ React.createElement(
      ListRow,
      {
        key: r.ref,
        chevron: true,
        onClick: () => open(r),
        leading: /* @__PURE__ */ React.createElement(Product, { name: r.img, size: 40 }),
        title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, r.name), !phone && /* @__PURE__ */ React.createElement(OutcomeBadge, { o: r.outcome, size: "sm" })),
        sub: `${r.ref} · ${r.distributorName} · cleared ${dayOf(r.cleared)}`,
        value: /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, figure(r, reading)), /* @__PURE__ */ React.createElement("em", null, second(r, reading)))
      }
    )))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle" }, "Every figure is the batch's posted ledger, as money.js works it out. CO₂e, disposal and EPR are indicative. The companies and people are fictional.")));
  }
  const TABS = [{ id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "impact", label: "Impact", icon: "leaf" }];
  const Row = ({ k, sub, v, tone, strong }) => /* @__PURE__ */ React.createElement("div", { className: cx("lg-line", strong && "strong") }, /* @__PURE__ */ React.createElement("span", null, k, sub && /* @__PURE__ */ React.createElement("em", null, " ", sub)), /* @__PURE__ */ React.createElement("span", { className: cx("tnum", tone) }, v));
  const NotPosted = ({ h }) => /* @__PURE__ */ React.createElement(Locked, { icon: "book-open-check", agent: "Impact agent", live: h.phase === "settled" && h.van && h.van.status === "done", text: `Posts the batch to the ledger once the return window closes on ${fmt.day(D.RETURN_BY)}, and writes the BRSR row with evidence links.` });
  function MoneyTab({ c, row, h }) {
    const app = useApp();
    if (!row) return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(NotPosted, { h }), /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Planned on the Route Room; actual after the negotiation" }, "Money reading"), /* @__PURE__ */ React.createElement(MoneyPanel, { plan: c.plan, actual: h.award ? c.actual : void 0, compact: app.bp !== "desktop" }));
    const F = row.figures, wo = c.plan.writeOff, r = c.realised, s = c.sku, inv = c.docs.find((d) => d.id === "invoice"), cn = c.docs.find((d) => d.id === "support"), ex = c.docs.find((d) => d.id === "expiry");
    const subOf = (l) => l.id === "kirana" && c.kirana && c.kirana.ordered < c.kirana.planned ? `of ${fmt.num(c.kirana.planned)} offered` : l.id === "foodbank" ? c.partner ? c.partner.name : "the food bank" : `at ${fmt.rate(l.price)}`;
    return /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 380,
        main: /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "What happened"), /* @__PURE__ */ React.createElement(OutcomeBadge, { o: row.outcome, size: "sm" })), row.lines.map((l) => /* @__PURE__ */ React.createElement(Row, { key: l.id, k: `${fmt.num(l.units)} → ${l.short}`, sub: subOf(l), v: l.id === "foodbank" ? "given" : fmt.inr(l.gross) })), /* @__PURE__ */ React.createElement(Row, { k: "Van, listing fee and handling", v: fmt.inr(-(r.costs || 0)), tone: "neg" }), r.itcLoss ? /* @__PURE__ */ React.createElement(Row, { k: "Input credit given away with the donation", sub: "s.17(5)(h)", v: fmt.inr(-r.itcLoss), tone: "neg" }) : null, /* @__PURE__ */ React.createElement(Row, { k: "Recovered", v: fmt.inr(F.net), strong: true }), F.godown ? /* @__PURE__ */ React.createElement("div", { className: "lg-note" }, /* @__PURE__ */ React.createElement(Icon, { name: "warehouse", size: 16 }), /* @__PURE__ */ React.createElement("span", null, fmt.num(F.godown), " packs no channel took expired at ", c.dist.godown, ". They came back to ", W.short, " for full credit (", fmt.inr(F.credit), ") and ", W.short, " destroyed them: disposal, EPR and ", fmt.inr2(c.expiry.itc), " of credit reversed.")) : null), /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "If it had been destroyed"), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "red", icon: "trash-2" }, "write-off")), /* @__PURE__ */ React.createElement(Row, { k: "Stock at cost", sub: `${fmt.num(wo.units)} × ₹${s.cost}`, v: fmt.inr(-wo.stock), tone: "neg" }), /* @__PURE__ */ React.createElement(Row, { k: "Input credit reversed", sub: `s.17(5)(h) · ₹${wo.itcPerUnit} a pack`, v: fmt.inr(-wo.itc), tone: "neg" }), /* @__PURE__ */ React.createElement(Row, { k: "Disposal and EPR", sub: "indicative", v: fmt.inr(-(wo.disposal + wo.epr)), tone: "neg" }), /* @__PURE__ */ React.createElement(Row, { k: "Effect on the P&L", v: fmt.inr(-wo.total), tone: "neg", strong: true }))),
        side: /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Better than destroying it"), /* @__PURE__ */ React.createElement(Money, { value: F.swing, size: "m", style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "P&L ", fmt.inr(F.pnl), " instead of ", fmt.inr(-wo.total), ".")), /* @__PURE__ */ React.createElement(List, { head: `${W.short}'s side` }, cn ? /* @__PURE__ */ React.createElement(ListRow, { icon: "hand-coins", title: `Price support to ${c.dist.short}`, sub: cn.no, value: amount(fmt.inr(cn.amount)) }) : null, ex ? /* @__PURE__ */ React.createElement(ListRow, { icon: "warehouse", title: "Expiry credit", sub: `${ex.no} · ${fmt.num(ex.units)} packs`, value: amount(fmt.inr(ex.amount)) }) : null, inv ? /* @__PURE__ */ React.createElement(ListRow, { icon: "receipt", title: `${possessive(c.dist.short)} invoice to ${c.buyer.short || c.buyer.name}`, sub: inv.no, value: amount(fmt.inr(inv.total)) }) : null))
      }
    );
  }
  function ImpactTab({ c, row, h }) {
    if (!row) return /* @__PURE__ */ React.createElement(NotPosted, { h });
    const F = row.figures, no = (id) => (row.papers.find((x) => x.id === id && x.status !== "not required") || {}).no;
    const orders = row.lines.filter((l) => l.id === "kirana").reduce((t, l) => t + l.units, 0);
    const ev = [no("invoice"), c.listing && c.lines.expiresoon.units ? c.listing.id : null, orders ? `${c.kiranas.length} kirana order logs` : null, no("support"), no("expiry"), F.donated ? "FSSAI checklist" : null, no("receipt"), F.destroyed ? "destruction certificate" : null].filter(Boolean);
    return /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 380,
        main: /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "BRSR line"), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "posted · ", dayOf(row.cleared))), /* @__PURE__ */ React.createElement("div", { className: "lg-brsr mono" }, kg(F.kg), " diverted from disposal (", kg(F.resoldKg), " resold", F.donatedKg ? `, ${kg(F.donatedKg)} donated` : "", ") · ", kg(F.destroyedKg), " destroyed · ", kg(F.co2), " CO₂e avoided (indicative) · ", F.meals ? `${fmt.num(F.meals)} meals (${fmt.num(F.donated)} packs donated)` : "0 meals (nothing donated)"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Evidence: ", ev.join(" · "))), /* @__PURE__ */ React.createElement(List, { head: "Where the kilos went" }, /* @__PURE__ */ React.createElement(ListRow, { icon: "store", title: "Resold", sub: "kiranas, ExpireSoon and staff", value: kg(F.resoldKg) }), /* @__PURE__ */ React.createElement(ListRow, { icon: "heart-handshake", title: "Donated", sub: c.partner ? c.partner.name : "nothing donated", value: kg(F.donatedKg) }), /* @__PURE__ */ React.createElement(ListRow, { icon: "trash-2", title: "Destroyed", sub: F.destroyedKg ? "expired at the godown" : "nothing destroyed", value: kg(F.destroyedKg) }))),
        side: /* @__PURE__ */ React.createElement(Card, { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Kept out of landfill"), /* @__PURE__ */ React.createElement("span", { className: "num m" }, kg(F.kg)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, kg(F.co2), " CO₂e avoided at ", M.RULES.co2PerKg, " kg a kg, indicative", F.meals && c.partner ? ` · ${fmt.num(F.meals)} meals by ${c.partner.name}'s rule` : "", "."))
      }
    );
  }
  function BatchPage({ me, at, tab: tab0 }) {
    const s = useStore();
    const app = useApp();
    const phone = app.bp === "phone";
    const c = LG().caseOf(at);
    const story = !c.history, h = story ? s.hero : CLEARED, row = !story || s.hero.posted ? LG().rowOf(c) : null;
    const [tab, setTab] = useState(tab0 || "money");
    const head = /* @__PURE__ */ React.createElement("div", { className: "bhead" }, /* @__PURE__ */ React.createElement("div", { className: "bh-id" }, /* @__PURE__ */ React.createElement("span", { className: "bh-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: phone ? 46 : 72, alt: "" })), /* @__PURE__ */ React.createElement("div", { className: "bh-tt" }, /* @__PURE__ */ React.createElement("h1", null, c.sku.name), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, c.batch.id), /* @__PURE__ */ React.createElement("span", { className: "sep", "aria-hidden": "true" }, "·"), /* @__PURE__ */ React.createElement("span", null, c.dist.name, ", ", c.dist.city)), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, row ? /* @__PURE__ */ React.createElement(OutcomeBadge, { o: row.outcome }) : /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true, live: true }, "In flight"), /* @__PURE__ */ React.createElement("span", null, "Flagged ", dayOf(c.flagged), row ? ` · cleared ${dayOf(row.cleared)}` : "")))), /* @__PURE__ */ React.createElement("nav", { className: "bh-tabs", "aria-label": `${c.sku.name}, ${c.batch.id}` }, TABS.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.id, type: "button", className: "bh-tab", "aria-current": tab === t.id ? "page" : void 0, onClick: () => setTab(t.id) }, tab === t.id && /* @__PURE__ */ React.createElement(motion.span, { layoutId: "lg-tab-thumb", className: "bh-tab-thumb", transition: { type: "spring", stiffness: 500, damping: 40 } }), !phone && /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: 16 }), /* @__PURE__ */ React.createElement("span", null, t.label)))));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: c.sku.name, back: "Ledger", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, /* @__PURE__ */ React.createElement(motion.div, { key: tab, initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }, tab === "money" ? /* @__PURE__ */ React.createElement(MoneyTab, { c, row, h }) : tab === "papers" ? /* @__PURE__ */ React.createElement(PaperPack, { me, c, h }) : /* @__PURE__ */ React.createElement(ImpactTab, { c, row, h }))));
  }
  function Report({ me, at }) {
    const { route } = useRoute();
    const p = route && route.params || {};
    const ref = at && at.ref || p.ref;
    return ref && LG().caseOf(ref) ? /* @__PURE__ */ React.createElement(BatchPage, { key: ref, me, at: ref, tab: at && at.tab || p.tab }) : /* @__PURE__ */ React.createElement(Ledger, { me });
  }
  Object.assign(window.SC3_SCREENS, { Paperwork, PaperPack, Report, Ledger, BatchPage, Paper, Receipt, KeepsWhat, OutcomeBadge, printPage, download, csv });
})();

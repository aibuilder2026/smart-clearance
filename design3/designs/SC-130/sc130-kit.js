(function() {
  const { useState, useRef } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER, W = window.SC3_WORLD;
  const { cx, Icon, Badge, Button, Sheet, Product } = K;
  const fmt = M.fmt;
  const C = D.WORKSPACE.short;
  const num = (n) => fmt.num(n);
  const inr = (n) => fmt.inr(n);
  const rate = (n) => "₹" + n.toFixed(2);
  const asDate = (iso) => /* @__PURE__ */ new Date((iso.length > 10 ? iso : iso + "T00:00") + ":00+05:30");
  const day = (iso) => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const when = (iso) => iso.length > 10 ? `${day(iso)}, ${iso.slice(11, 16)}` : day(iso);
  const weekday = (iso) => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
  const month = (iso) => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const plusHours = (iso, h) => {
    const t = new Date(asDate(iso).getTime() + h * 36e5);
    const p = (x) => String(x).padStart(2, "0");
    const ist = new Date(t.getTime() + 5.5 * 36e5);
    return `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())}T${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}`;
  };
  const STORY_DAY = D.DAY0 || "2026-10-02";
  const HB = (ref) => D.HISTORY.batches.find((h) => h.ref === ref);
  const stepAt = (h, k) => (h.steps.find((s) => s.step === k) || {}).at || null;
  const lineOf = (c, id) => c.realised.lines.find((l) => l.id === id && l.units > 0) || null;
  const planned = (c, id) => c.plan.lines.find((l) => l.id === id && l.units > 0) || null;
  function distBatches(distId, s) {
    const past = L.HISTORY.filter((c) => c.dist.id === distId).map((c) => ({ ref: c.ref, c, h: HB(c.ref), cleared: true })).sort((a, z) => a.c.flagged < z.c.flagged ? 1 : -1);
    const story = D.BATCHES.filter((b) => b.distributor === distId);
    const journey = story.filter((b) => b.hero && s.hero.phase && s.hero.phase !== "watching" || b.second && s.mango.phase && s.mango.phase !== "watching");
    const watching = story.filter((b) => !journey.includes(b));
    return { journey, watching, past };
  }
  function moments(c, h) {
    const out = [];
    const add = (k, icon, title, sub) => {
      const t = stepAt(h, k);
      if (t) out.push({ k, at: t, icon, title, sub });
    };
    const kl = lineOf(c, "kirana"), es = lineOf(c, "expiresoon"), st = lineOf(c, "staff"), fb = lineOf(c, "foodbank");
    add("detect", "radar", `The Watcher flagged ${num(c.plan.units)} packs at risk`, `${c.batch.daysLeft} days left, failing Blinkit, Zepto and Instamart's gates`);
    add("photo", "camera", "You sent the label photo", "Vision read the batch, the dates and the MRP");
    add("approve", "check", `${C} approved the plan`, c.plan.lines.filter((l) => l.units > 0 && l.id !== "writeoff").map((l) => `${num(l.units)} to ${l.short}`).join(" · "));
    if (es) add("listing", "shopping-bag", `${num(planned(c, "expiresoon").units)} listed on ExpireSoon in your name`, `Lot ${c.listing.id} at ${rate(planned(c, "expiresoon").price)}`);
    if (kl) add("offer", "send", `The scheme went to ${c.offered} of your kiranas`, `Buy 10, get 2 · ${rate(planned(c, "kirana").packPrice)} a packet`);
    if (fb) add("donation", "heart-handshake", `${c.partner.name} booked for ${num(fb.units)} packs`, `Pickup from ${c.dist.godown}`);
    if (kl) add("orders", "store", `${c.kiranas.length} kiranas ordered ${num(kl.units)} packets`, c.kirana.ordered < c.kirana.planned ? `of ${num(c.kirana.planned)} offered` : "The scheme filled");
    if (es) add("accept", "handshake", `${D.BUYER.name} took the counter at ${rate(c.award.price)}`, `${inr(c.award.token)} token paid`);
    if (fb) add("collect", "package-check", `${c.partner.name} collected ${num(fb.units)} packs`, `Receipt ${c.receipt.no}`);
    if (kl && c.realised.godown) add("closeOffer", "clock", "The scheme closed after 48 hours", `${num(c.realised.godown)} packets were not ordered`);
    if (st) add("staff", "users", `Your staff sale sold ${num(st.units)} packs`, `at ${rate(st.packPrice || st.price)}`);
    if (es) add("truck", "truck", `${D.BUYER.name}'s truck collected the lot`, `${num(es.units)} packs to ${D.BUYER.city}`);
    add("papers", "file-check", "The Paperwork agent drafted your papers", distPapers(c).mine.filter((d) => d.status !== "not required").map((d) => d.no).join(" · "));
    if (c.invoice) add("invoice", "receipt", `You issued ${c.invoice.no} from Tally`, `${inr(c.invoice.total || c.invoice.amount)} to ${D.BUYER.name}`);
    if (kl) add("van", "route", `Your ${weekday(stepAt(h, "van"))} van round delivered the scheme`, `${c.kiranas.length} shops · ${num(kl.units)} packets`);
    const x = c.expiry;
    out.push({
      k: "report",
      at: stepAt(h, "report"),
      icon: x && x.units ? "warehouse" : "badge-check",
      title: x && x.units ? `${num(x.units)} packs expired at your godown` : "Settled: you ended whole",
      sub: x && x.units ? `${C} took them back for full credit: ${inr(x.credit)} on ${(c.docs.find((d) => d.id === "expiry") || {}).no}` : `${inr(c.support.total)} price support on ${(c.docs.find((d) => d.id === "support") || {}).no}`
    });
    return out.sort((a, z) => a.at < z.at ? -1 : 1);
  }
  function whole(c) {
    const rows = [];
    const kl = lineOf(c, "kirana"), es = lineOf(c, "expiresoon"), st = lineOf(c, "staff"), fb = lineOf(c, "foodbank");
    if (kl) rows.push({ k: `From ${c.kiranas.length} kiranas`, sub: `${num(kl.units)} packets`, v: kl.gross });
    if (es) rows.push({ k: `From ${D.BUYER.name}`, sub: `${num(es.units)} packets at ${rate(c.award.price)}`, v: Math.round(es.units * c.award.price * 100) / 100 });
    if (st) rows.push({ k: "Your staff sale", sub: `${num(st.units)} packs`, v: st.gross });
    if (fb) rows.push({ k: `Given to ${c.partner.name}`, sub: `${num(fb.units)} packs`, v: 0 });
    const cn = c.docs.find((d) => d.id === "support"), ex = c.docs.find((d) => d.id === "expiry");
    rows.push({ k: "Price-support credit note", sub: cn && cn.no, v: c.support.total, paper: "support" });
    if (ex) rows.push({ k: `Expiry credit note for ${num(c.expiry.units)} packs`, sub: ex.no, v: ex.amount, paper: "expiry" });
    const recv = rows.reduce((t, r) => t + r.v, 0);
    const paid = c.plan.units * c.sku.dp + c.support.van + c.support.fee;
    return { rows, recv, paid, gain: Math.round(recv - paid), dp: c.sku.dp, units: c.plan.units };
  }
  const MINE = ["invoice", "eway", "support", "expiry"], COPIES = ["receipt", "destruction"];
  function distPapers(c) {
    const has = (d) => d && d.status !== "not required";
    return { mine: MINE.map((id) => c.docs.find((d) => d.id === id)).filter((d) => d && (has(d) || d.id === "eway")), copies: COPIES.map((id) => c.docs.find((d) => d.id === id)).filter(has) };
  }
  const issuedBy = (c, d) => d.id === "invoice" || d.id === "eway" ? "You issue it" : d.id === "receipt" ? `${c.partner ? c.partner.name : "The food bank"} issued it to ${C} · a copy for you` : d.id === "destruction" ? `${C} destroyed the packs · a copy for you` : `${C} issued it to you`;
  const shopOf = (me) => W.KIRANAS.find((k) => k.name === (me && me.org)) || W.KIRANAS[0];
  const scheme = (n, pack, mrp) => {
    const free = Math.floor(n / 12) * 2, paid = n - free;
    return { n, free, paid, pay: paid * pack, sell: n * mrp, margin: n * mrp - paid * pack };
  };
  function offersFor(k, s, declined) {
    const cap = M.RULES.shopCapTimes;
    const past = L.HISTORY.filter((c) => c.dist.id === k.distributor && planned(c, "kirana")).map((c) => {
      const h = HB(c.ref), o = c.kiranas.find((x) => x.kirana === k.id), kl = planned(c, "kirana");
      const sent = stepAt(h, "offer"), filled = c.kirana.ordered >= c.kirana.planned;
      const closed = filled ? stepAt(h, "orders") : stepAt(h, "closeOffer") || plusHours(sent, 48);
      return {
        ref: c.ref,
        c,
        sku: c.sku,
        dist: c.dist,
        sent,
        closed,
        share: k.sales14 * cap,
        pack: kl.packPrice,
        mrp: c.sku.mrp,
        bestBefore: c.batch.bestBefore,
        status: o ? "ordered" : "expired",
        why: o ? null : filled ? "filled" : "time",
        units: o ? o.units : 0,
        orderedAt: o ? stepAt(h, "orders") : null,
        van: o ? stepAt(h, "van") : null,
        m: o ? scheme(o.units, kl.packPrice, c.sku.mrp) : null
      };
    });
    const story = [];
    const hero = D.BATCHES.find((b) => b.hero);
    if (k.distributor === hero.distributor && s.hero.offer) {
      const KL = D.PLAN.lines.find((l) => l.id === "kirana"), o = s.hero.orders.find((x) => x.id === k.id), sku = D.SKUS[hero.sku];
      const open = !o && !declined && !["dispatched", "settled", "cleared"].includes(s.hero.phase);
      story.push({
        ref: hero.id,
        story: true,
        sku,
        dist: D.DISTRIBUTORS[hero.distributor],
        sent: `${STORY_DAY}T09:41`,
        closed: plusHours(`${STORY_DAY}T09:41`, 48),
        share: k.sales14 * cap,
        pack: KL.packPrice,
        mrp: sku.mrp,
        bestBefore: hero.bestBefore,
        status: o ? "ordered" : declined ? "declined" : open ? "open" : "expired",
        why: o || declined || open ? null : "time",
        declinedAt: declined || null,
        units: o ? o.units : 0,
        orderedAt: o ? `${STORY_DAY}T${o.at}` : null,
        van: o && s.hero.van.status === "done" ? "2026-10-06T09:00" : null,
        m: o ? scheme(o.units, KL.packPrice, sku.mrp) : null
      });
    }
    return story.concat(past.sort((a, z) => a.sent < z.sent ? 1 : -1));
  }
  const OFFER_STATUS = {
    open: { label: "Open", tone: "blue", icon: "clock" },
    ordered: { label: "Ordered", tone: "green", icon: "check" },
    declined: { label: "Declined", tone: void 0, icon: "x" },
    expired: { label: "Expired", tone: void 0, icon: "clock" }
  };
  const whyText = (o) => o.status === "declined" ? `You declined on ${when(o.declinedAt)}` : o.why === "filled" ? `The scheme filled on ${when(o.closed)} before you ordered` : o.status === "expired" ? `Its 48 hours ended on ${when(o.closed)}` : null;
  function OfferStatus({ o, size }) {
    const x = OFFER_STATUS[o.status];
    return /* @__PURE__ */ React.createElement(Badge, { size, tone: x.tone, icon: x.icon }, o.status === "ordered" ? `Ordered · ${o.units}` : x.label);
  }
  const DECLINE_KEY = "sc130-declined";
  const declinedAt = () => {
    try {
      return localStorage.getItem(DECLINE_KEY);
    } catch (e) {
      return null;
    }
  };
  const decline = () => {
    try {
      localStorage.setItem(DECLINE_KEY, `${STORY_DAY}T10:12`);
    } catch (e) {
    }
  };
  const undecline = () => {
    try {
      localStorage.removeItem(DECLINE_KEY);
    } catch (e) {
    }
  };
  function pickupsFor(org, s) {
    const past = L.HISTORY.filter((c) => c.partner && c.partner.name === org).map((c) => {
      const h = HB(c.ref);
      return {
        ref: c.ref,
        c,
        sku: c.sku,
        dist: c.dist,
        units: c.donation.units,
        kg: c.receipt.kg,
        meals: c.receipt.meals,
        receipt: c.receipt,
        spot: c.donation.spot,
        from: `${c.dist.godown}, ${c.dist.city}`,
        city: c.dist.city,
        asked: stepAt(h, "donation"),
        confirmed: stepAt(h, "pickup"),
        collected: stepAt(h, "collect"),
        bestBefore: c.batch.bestBefore,
        daysLeft: c.batch.daysLeft,
        state: "collected"
      };
    }).sort((a, z) => a.collected < z.collected ? 1 : -1);
    const out = [];
    const DN = D.JOURNEY.donation, mb = D.BATCHES[1];
    if (org === DN.partner && s.mango.donation) {
      const R = D.MANGO_RECEIPT;
      const dist = D.DISTRIBUTORS[mb.distributor];
      out.push({
        ref: mb.id,
        story: true,
        sku: D.SKUS[mb.sku],
        dist,
        units: D.MANGO_FB,
        kg: R.kg,
        meals: R.meals,
        receipt: s.mango.donation === "collected" ? R : null,
        spot: DN.spot,
        from: `${DN.from}, ${dist.city}`,
        city: dist.city,
        asked: `${STORY_DAY}T12:15`,
        confirmed: s.mango.donation !== "booked" ? `2026-10-03T09:30` : null,
        collected: s.mango.donation === "collected" ? "2026-10-06T10:00" : null,
        bestBefore: mb.bestBefore,
        daysLeft: mb.daysLeft,
        state: s.mango.donation,
        slot: `${DN.date} · ${DN.time}`
      });
    }
    return out.concat(past);
  }
  const fssaiItems = (p) => ["Sealed, undamaged packs", `Best before ${fmt.date(p.bestBefore)}, ${p.daysLeft} days left when booked`, "Ambient storage, away from sunlight", `Batch ${p.ref} on every carton`, `Donor: ${D.CLIENT.name} via ${p.dist.name}`];
  function PaperSheet({ open, onClose, c, id, receipt }) {
    const ref = useRef(null);
    const d = receipt || c && c.docs.find((x) => x.id === id);
    if (!d) return null;
    const title = d.type || "Donation receipt";
    const pdf = () => {
      const n = ref.current;
      if (n) S.printPage(`${title} ${d.no || ""}`, `<div class="${n.className}">${n.innerHTML}</div>`, { styles: true });
    };
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title, footer: /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, icon: "download", onClick: pdf }, "Download PDF") }, /* @__PURE__ */ React.createElement("div", { ref, className: "stack snug" }, receipt ? /* @__PURE__ */ React.createElement(S.Receipt, { doc: receipt, batch: receipt.batch || c && c.batch, sku: receipt.sku || c && c.sku, dist: receipt.dist || c && c.dist }) : /* @__PURE__ */ React.createElement(S.Paper, { id, c })));
  }
  const PAPER_ICON = { invoice: "receipt", eway: "truck", support: "hand-coins", expiry: "warehouse", receipt: "heart-handshake", destruction: "trash-2", fssai: "clipboard-check", itc: "badge-check" };
  function PaperRow({ c, d, onOpen, compact }) {
    const amount = d.status === "not required" || d.id === "receipt" ? null : d.id === "invoice" ? d.total || d.amount : d.amount;
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: "sc130-paper", onClick: () => onOpen(d.id) }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: PAPER_ICON[d.id] || "file-text", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, d.type), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, d.no), !compact && /* @__PURE__ */ React.createElement(React.Fragment, null, " · ", issuedBy(c, d)), d.status === "not required" ? " · not required" : "")), amount ? /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, inr(amount)) : null, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16, className: "subtle" }));
  }
  function Head({ sku, id, where, badge, line }) {
    const phone = K.useApp().bp === "phone";
    return /* @__PURE__ */ React.createElement("div", { className: "bhead" }, /* @__PURE__ */ React.createElement("div", { className: "bh-id" }, /* @__PURE__ */ React.createElement("span", { className: "bh-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: phone ? 46 : 72, alt: "" })), /* @__PURE__ */ React.createElement("div", { className: "bh-tt" }, /* @__PURE__ */ React.createElement("h1", null, sku.name), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, id), /* @__PURE__ */ React.createElement("span", { className: "sep", "aria-hidden": "true" }, "·"), /* @__PURE__ */ React.createElement("span", null, where)), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, badge, line && /* @__PURE__ */ React.createElement("span", null, line)))));
  }
  window.SC130_AFTER = () => window.SC3_STORE.update((st) => {
    const u = st.users.find((x) => x.id === "shreesai");
    if (u) u.status = "active";
  });
  window.SC130 = {
    C,
    num,
    inr,
    rate,
    day,
    when,
    weekday,
    month,
    plusHours,
    STORY_DAY,
    HB,
    stepAt,
    lineOf,
    planned,
    distBatches,
    moments,
    whole,
    distPapers,
    issuedBy,
    shopOf,
    scheme,
    offersFor,
    OFFER_STATUS,
    OfferStatus,
    whyText,
    declinedAt,
    decline,
    undecline,
    pickupsFor,
    fssaiItems,
    PaperSheet,
    PaperRow,
    PAPER_ICON,
    Head
  };
})();

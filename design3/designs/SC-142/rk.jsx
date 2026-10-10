// SC-142's shared pieces: a batch's record, from the history's own steps (core/data.js HISTORY_AT, core/ledger.js
// caseOf). Who did what and when, the photos sent (the label, the destruction's before and after) with what Vision read
// of them, and the human yeses. The options draw it three ways; the figures and the moments are the stub's own.
(function () {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, Badge, Card, List, ListRow, Avatar, Sheet } = K;
  const L = () => window.SC3_LEDGER;
  const asDate = iso => new Date((iso.length > 10 ? iso : iso + "T00:00") + ":00+05:30");
  const day = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const longDay = iso => asDate(iso.slice(0, 10)).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const when = iso => (iso.length > 10 ? `${day(iso)}, ${iso.slice(11, 16)}` : day(iso));
  const time = iso => iso.slice(11, 16);
  const IMG = window.SC3_IMG;
  // the round's own photos: beside the mockups, or pinned to a commit on a published copy (publish.py sets SCR_BASE)
  const HERE = window.SCR_BASE || "../";

  // the agents, each with the icon the console gives it
  const AGENT = { data: ["Data agent", "database"], watcher: ["Watcher", "radar"], vision: ["Vision", "scan-line"], valuer: ["Valuer", "coins"], router: ["Router", "route"],
    lister: ["Lister", "shopping-bag"], outreach: ["Outreach", "send"], negotiator: ["Negotiator", "messages-square"], donation: ["Donation", "heart-handshake"],
    paperwork: ["Paperwork", "file-text"], impact: ["Impact", "leaf"] };
  const agent = id => ({ kind: "agent", id, name: AGENT[id][0], icon: AGENT[id][1] });
  const person = p => ({ kind: "person", id: p.id, name: p.name, short: p.short || p.name, person: p, org: p.org });
  const byOrg = (org, fallback) => Object.values(D.PEOPLE).find(p => p.org === org) || { id: org, name: fallback || org, short: fallback || org, org };
  const PRIYA = () => person(D.PEOPLE.priya);

  // the photos a batch carries: the label photo the distributor sent and, destroyed at his godown, the two of the
  // destruction. The chips' label is the story's own photo; MF-2407-116's is a Qwen edit of the Vision eval set's clean
  // label for its product, printed with its own batch and dates (photos/label-MF-2407-116.webp.prompt.json); 
  // every history batch has its own (photos/label-<batch>.webp, each with its sidecar)
  const LABEL = { "MF-2409-117": IMG + "label-shot.webp" };
  ["MF-2406-105", "MF-2406-106", "MF-2406-107", "MF-2406-108", "MF-2406-109", "MF-2407-110", "MF-2407-111", "MF-2407-112", "MF-2407-113", "MF-2407-114", "MF-2407-115", "MF-2407-116"].forEach(r => (LABEL[r] = HERE + "photos/label-" + r + ".webp"));
  function photosOf(c) {
    const at = k => (c.steps.find(s => s.step === k) || {}).at;
    const dp = byOrg(c.dist.name);
    const mfg = c.batch.mfg || D.addDays(c.batch.bestBefore, -c.sku.lifeDays);
    const out = [];
    if (at("photo")) out.push({ id: "label", title: "Label photo", tag: "Label", src: LABEL[c.ref] || null, by: dp, at: at("photo"),
      alt: `The carton label of ${c.sku.name}, batch ${c.ref}`,
      read: { at: at("read"), lines: [`batch ${c.ref}`, `made ${fmt.date(mfg)}`, `best before ${fmt.date(c.batch.bestBefore)}`, `MRP ₹${c.sku.mrp.toFixed(2)}`], verdict: "Matches the export" } });
    const xd = c.destruction;
    if (xd && xd.photos) {
      out.push({ id: "before", title: "Before, at the godown", tag: "1 · Before", src: IMG + "evidence/" + xd.photos.before.name, by: dp, at: xd.photos.before.at,
        alt: `${fmt.num(xd.units)} packs of ${c.sku.name} at ${c.dist.godown}, the batch label in view`, checks: xd.checks.filter(x => x.id === "batch" || x.id === "count") });
      out.push({ id: "after", title: "After, at the landfill", tag: "2 · After", src: IMG + "evidence/" + xd.photos.after.name, by: dp, at: xd.photos.after.at,
        alt: `The packs slit open at ${xd.agency.site}, a slate with the batch`, checks: xd.checks.filter(x => x.id === "slate" || x.id === "when") });
    }
    return out;
  }

  // the human yeses on a batch: the plan, the papers' review, and the destruction's evidence
  function approvalsOf(c) {
    const at = k => (c.steps.find(s => s.step === k) || {}).at;
    const out = [];
    const lines = c.plan.lines.filter(l => l.units > 0).map(l => `${fmt.num(l.units)} ${LINE[l.id] || l.id}`).join(" · ");
    if (at("approve")) out.push({ k: "approve", at: at("approve"), who: PRIYA(), title: "Approved the plan", sub: `${fmt.inr(c.plan.net)} planned · ${lines}`, icon: "badge-check" });
    if (at("review")) out.push({ k: "review", at: at("review"), who: PRIYA(), title: "Reviewed the papers", sub: c.docs.filter(d => d.status === "generated" || d.status === "drafted").filter(d => d.id !== "destruction" && d.id !== "expiry").map(d => d.no).filter(n => n && !/^s\./.test(n)).join(" · ") + " · the ITC memo", icon: "file-check" });
    const xd = c.destruction;
    if (xd && xd.approvedAt) out.push({ k: "destroyApproved", at: xd.approvedAt, who: PRIYA(), title: "Approved the destruction", sub: `${fmt.num(xd.units)} packs · ${xd.agency.name} · ${(c.docs.find(d => d.id === "destruction") || {}).no || ""} · Vision's checks ${xd.checks.filter(x => x.ok).length} of ${xd.checks.length}`, icon: "recycle" });
    return out.sort((a, z) => (a.at < z.at ? -1 : 1));
  }
  const LINE = { kirana: "to kiranas", expiresoon: "on ExpireSoon", staff: "to the staff sale", foodbank: "to the food bank" };

  // every moment of a batch, from the history's steps: the agent or the person, what they did, and when. A person's
  // moment is an audit line (the decision, in their name); an agent's is its run
  function recordOf(c) {
    const at = k => (c.steps.find(s => s.step === k) || {}).at;
    const pl = id => c.plan.lines.find(l => l.id === id && l.units > 0);
    const rl = id => ((c.realised && c.realised.lines) || []).find(l => l.id === id && l.units > 0);
    const doc = id => c.docs.find(d => d.id === id && d.status !== "not required");
    const dp = person(byOrg(c.dist.name)), buyer = person(byOrg(c.buyer.name, c.buyer.name)), xd = c.destruction;
    const out = [];
    const add = (k, who, text, x = {}) => { const t = x.at || at(k); if (t) out.push({ k, at: t, who, text, ...x }); };
    const split = c.plan.lines.filter(l => l.units > 0).map(l => `${fmt.num(l.units)} ${LINE[l.id] || l.id}`).join(", ");
    add("open", agent("data"), `Loaded ${fmt.num(c.batch.units)} packs at ${c.dist.godown} from the nightly DMS export`);
    add("detect", agent("watcher"), `Flagged ${fmt.num(c.plan.units)} packs at risk, ${c.batch.daysLeft} days left`);
    add("photo", dp, "Sent the label photo", { evidence: "label", audit: "label photo sent" });
    add("read", agent("vision"), `Read the label: batch ${c.ref}, best before ${fmt.date(c.batch.bestBefore)}. It matches the export`, { evidence: "label" });
    add("value", agent("valuer"), "Priced every exit for this batch");
    add("route", agent("router"), `Split it: ${split}. ${fmt.inr(c.plan.net)} planned`);
    add("approve", PRIYA(), `Approved the plan, ${fmt.inr(c.plan.net)}`, { yes: true, audit: "plan approved" });
    if (pl("expiresoon")) add("listing", agent("lister"), `Listed lot ${c.numbers.listing} on ExpireSoon in ${c.dist.name}' name`);
    if (pl("kirana")) add("offer", agent("outreach"), `Sent the scheme to ${c.offered || c.kiranas.length} kiranas, in Hindi`);
    if (pl("foodbank") && c.partner) add("donation", agent("donation"), `Booked ${c.partner.name} for ${fmt.num(pl("foodbank").units)} packs`);
    if (rl("kirana")) add("orders", { kind: "people", name: `${c.kiranas.length} kiranas`, icon: "store" }, `Ordered ${fmt.num(rl("kirana").units)} of ${fmt.num(pl("kirana").units)} packets`);
    if (c.award) {
      add("bid", buyer, `Bid ₹${c.award.bid.toFixed(2)} a pack on ${c.numbers.listing}`);
      add("counter", agent("negotiator"), `Countered at ₹${c.award.price.toFixed(2)}`);
      add("accept", buyer, `Took ${fmt.num(c.award.units)} at ₹${c.award.price.toFixed(2)}, a ₹${fmt.num(c.award.token)} token`);
    }
    if (rl("foodbank") && c.partner) add("collect", person(byOrg(c.partner.name, c.partner.name)), `Collected ${fmt.num(rl("foodbank").units)} packs`);
    if (pl("kirana")) add("closeOffer", agent("outreach"), `The scheme closed: ${fmt.num((rl("kirana") || { units: 0 }).units)} of ${fmt.num(pl("kirana").units)} packets ordered`);
    if (rl("staff")) add("staff", dp, `Recorded the staff sale: ${fmt.num(rl("staff").units)} packs`, { audit: "staff sale recorded" });
    if (c.award) add("truck", dp, `Loaded ${c.buyer.name}'s truck`, { audit: "truck loaded" });
    add("papers", agent("paperwork"), `Drafted the pack: ${["invoice", "support", "itc", "fssai"].map(doc).filter(Boolean).map(d => d.no && !/^s\./.test(d.no) ? d.no : d.type).join(", ")}`);
    if (doc("invoice")) add("invoice", dp, `Issued ${doc("invoice").no} from Tally`, { audit: "invoice issued" });
    if (rl("kirana")) add("van", dp, "Ran the van round to the shops that ordered", { audit: "van round done" });
    add("review", PRIYA(), "Reviewed the papers", { yes: true, audit: "papers reviewed" });
    if (xd) {
      add("destroyAsk", agent("impact"), `Expiry day: ${fmt.num(xd.units)} packs left at ${c.dist.godown}; ${c.dist.name} asked to destroy them`);
      add("destroySent", dp, `Sent the destruction's evidence: two photos, ${xd.agency.name}, ${(doc("destruction") || {}).no || ""}`, { evidence: "destruction", audit: "destruction evidence sent" });
      if (xd.checkedAt) add("destroyChecked", agent("vision"), `Checked both photos: ${xd.checks.filter(x => x.ok).length} of ${xd.checks.length}`, { at: xd.checkedAt, evidence: "destruction" });
      add("destroyApproved", PRIYA(), `Approved the destruction of ${fmt.num(xd.units)} packs`, { yes: true, audit: "destruction approved" });
    }
    const ex = doc("expiry");
    add("report", agent("impact"), `Posted the ledger: ${fmt.inr(c.actual.net)} recovered${ex ? `; ${ex.no} issued` : ""}`);
    return out.sort((a, z) => (a.at < z.at ? -1 : a.at > z.at ? 1 : 0));
  }

  // the cleared batches, newest first: the history's, and the story's chips once they have cleared
  function pastBatches() {
    return L().HISTORY.map(h => L().caseOf(h.ref)).sort((a, z) => (a.cleared < z.cleared ? 1 : -1));
  }
  const monthsOf = list => { const out = []; list.forEach(c => { const m = c.cleared.slice(0, 7); let g = out.find(x => x.m === m); if (!g) out.push(g = { m, label: asDate(c.cleared).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }), items: [] }); g.items.push(c); }); return out; };

  /* ---------- pieces ---------- */
  // who acted: a person's face, or the agent's tile
  function Actor({ who, size = 36 }) {
    if (who.kind === "person") return <Avatar person={who.person} size={size >= 36 ? undefined : "sm"} />;
    return <span className={cx("icontile", who.kind === "agent" && "soft")} style={{ width: size, height: size, borderRadius: 11 }}><Icon name={who.icon} size={Math.round(size * 0.47)} stroke={2} /></span>;
  }
  // a photo, as it was sent, whole, with its tag; opens on tap
  function Shot({ p, onOpen, size = "m" }) {
    if (!p.src) return <div className={cx("rk-shot none", size)}><Icon name="image" size={20} /><span className="t-caption">no photo kept</span></div>;
    return <button type="button" className={cx("rk-shot", size)} onClick={onOpen} aria-label={`${p.title}, sent ${when(p.at)}: open it`}>
      <img src={p.src} alt={p.alt} loading="lazy" />{p.tag && <span className="cam-tag">{p.tag}</span>}</button>;
  }
  const Check = ({ ok, children }) => <div className="row tight t-footnote rk-check"><Icon name={ok ? "circle-check" : "circle-alert"} size={15} className={ok ? "rk-ok" : "rk-warn"} />{children}</div>;
  // what a photo shows and what was made of it: who sent it and when, what Vision read, the checks
  function PhotoFacts({ p }) {
    return <div className="stack tight">
      <span className="t-footnote muted">Sent by {p.by.short || p.by.name} · {when(p.at)}</span>
      {p.read && <><Check ok>Vision read {p.read.lines.join(", ")} · {when(p.read.at)}</Check><Check ok>{p.read.verdict}</Check></>}
      {(p.checks || []).map(x => <Check key={x.id} ok={x.ok}>{x.label}</Check>)}
    </div>;
  }
  function PhotoSheet({ p, onClose }) {
    return <Sheet open={!!p} onClose={onClose} title={p ? p.title : ""}>
      {p && <div className="stack"><div className="rk-big"><img src={p.src} alt={p.alt} /></div><PhotoFacts p={p} /></div>}
    </Sheet>;
  }
  // a human yes: who, when, and what it let happen; amber, as every yes is
  function Yes({ a }) {
    return <div className="rk-yes">
      <Actor who={a.who} size={32} />
      <div className="grow" style={{ minWidth: 0 }}><b className="t-subhead">{a.who.short} · {a.title}</b><div className="t-footnote muted">{a.sub}</div></div>
      <time className="t-caption subtle tnum">{when(a.at)}</time>
    </div>;
  }

  window.SCR = { day, longDay, when, time, photosOf, approvalsOf, recordOf, pastBatches, monthsOf, Actor, Shot, Check, PhotoFacts, PhotoSheet, Yes, AGENT };
})();

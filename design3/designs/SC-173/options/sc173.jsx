// SC-173's options: the papers as evidence. Three parts, each with its own pick:
//   ?part=staff&opt=a|b|c&view=dist|priya   the staff sale's consolidated receipt (the Mango Drink at Lakshmi Agencies)
//   ?part=cert&opt=a|b&view=paper|form       the certificate of destruction in full (MF-2407-111 at Rakesh Traders)
//   ?part=sign&opt=a|b&view=papers|phone     a signature on every paper (MF-2407-111's tax invoice and credit notes)
// Every company, person, signature, stamp, UPI reference and figure is fictional; the figures are core/money.js's
// through the stub (data.js, ledger.js). The signatures are Qwen-Image scans keyed to their ink (../sign/)
(function () {
  const { useState, useLayoutEffect, useRef, useId, Fragment } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, L = window.SC3_LEDGER; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, Stepper, Progress, Field, Input, Select, DocCard, ThemeProvider, AppRoot } = K;
  const q = new URLSearchParams(location.search);
  const PART = q.get("part") || "staff", OPT = q.get("opt") || "a", VIEW = q.get("view") || (PART === "staff" ? "dist" : PART === "cert" ? "paper" : "papers");
  const SIGN = window.SC173_SIGN || "../sign/";
  const n2 = n => (n < 0 ? "-" : "") + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dmy = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
  const day = iso => fmt.date(iso.slice(0, 10));
  const hm = iso => iso.slice(11, 16);
  const plusMin = (iso, m) => { const t = new Date(new Date(iso + ":00+05:30").getTime() + m * 60000 + 330 * 60000); const p = x => String(x).padStart(2, "0"); return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}T${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`; };

  /* ---------------- the signatories (fictional), each with a specimen signature on file ---------------- */
  const SIGNERS = {
    rakesh: { name: "Rakesh Jaiswal", title: "Proprietor", firm: "Rakesh Traders", img: "rakesh.webp", stamp: { kind: "rect", firm: "RAKESH TRADERS", role: "Proprietor" } },
    lakshmi: { name: "K. Lakshmi Narayana", title: "Partner", firm: "Lakshmi Agencies", img: "lakshmi.webp", stamp: { kind: "rect", firm: "LAKSHMI AGENCIES", role: "Partner" } },
    munchly: { name: "Vinod Patwardhan", title: "Head of Accounts", firm: "Munchly Foods Ltd", img: "munchly.webp", stamp: { kind: "round", top: "MUNCHLY FOODS LIMITED", bottom: "PUNE · 410501", mid: "★" } },
    officer: { name: "Sachin Bhoyar", title: "Site supervisor", firm: "Orange City Enviro Services", img: "officer.webp", stamp: { kind: "round", top: "ORANGE CITY ENVIRO SERVICES", bottom: "MPCB/SWM/NGP/0412", mid: "NAGPUR" } },
    w1: { name: "Pradeep Meshram", title: "Independent witness", addr: "Plot 22, Wathoda Layout, Nagpur 440035", id: "Voter ID, last four 4417", img: "witness1.webp" },
    w2: { name: "Asha Kale", title: "Independent witness", addr: "House 9, Pardi Naka, Nagpur 440035", id: "Voter ID, last four 0932", img: "witness2.webp" },
  };
  const INK = { rakesh: "#1d1a5c", lakshmi: "#1f1f24", munchly: "#16203f", officer: "#1d2a7a" };

  // the firm's rubber stamp, as Indian traders use it: a rectangle (For FIRM ... Proprietor) or a company's round seal.
  // An ink texture breaks its strokes as a real impression does
  function Stamp({ s, rot = -6, color = "#4338a6" }) {
    const id = useId().replace(/:/g, "");
    const rough = <filter id={`${id}f`}><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.7 0 0 0 1.55" /><feComposite in="SourceGraphic" operator="in" /></filter>;
    if (s.kind === "rect") return <svg className="s173-stamp rect" viewBox="0 0 180 96" style={{ transform: `rotate(${rot}deg)` }} aria-hidden="true"><defs>{rough}</defs>
      <g filter={`url(#${id}f)`} fill={color} stroke={color}><rect x="2" y="2" width="176" height="92" rx="6" fill="none" strokeWidth="2.4" /><rect x="7" y="7" width="166" height="82" rx="4" fill="none" strokeWidth="0.9" />
        <text x="90" y="25" textAnchor="middle" fontSize="12" fontWeight="700" stroke="none">For {s.firm}</text>
        <text x="90" y="80" textAnchor="middle" fontSize="10.5" fontWeight="700" stroke="none">{s.role}</text></g></svg>;
    return <svg className="s173-stamp round" viewBox="0 0 100 100" style={{ transform: `rotate(${rot}deg)` }} aria-hidden="true"><defs>{rough}
      <path id={`${id}t`} d="M 50 50 m -37 0 a 37 37 0 1 1 74 0" /><path id={`${id}b`} d="M 50 50 m -42 0 a 42 42 0 0 0 84 0" /></defs>
      <g filter={`url(#${id}f)`} fill="none" stroke={color}><circle cx="50" cy="50" r="47.5" strokeWidth="2.4" /><circle cx="50" cy="50" r="29" strokeWidth="1.3" />
        <text fill={color} stroke="none" fontSize={s.top.length > 22 ? 8.4 : 9.6} fontWeight="700" letterSpacing="0.6"><textPath href={`#${id}t`} startOffset="50%" textAnchor="middle">{s.top}</textPath></text>
        <text fill={color} stroke="none" fontSize="7.6" fontWeight="700" letterSpacing="0.5"><textPath href={`#${id}b`} startOffset="50%" textAnchor="middle">{s.bottom}</textPath></text>
        <text x="50" y={s.mid.length > 2 ? 53 : 56} textAnchor="middle" fill={color} stroke="none" fontSize={s.mid.length > 2 ? 9 : 16} fontWeight="700">{s.mid}</text></g></svg>;
  }
  // a specimen signature in ink, over the stamp where the signatory has one
  const Ink = ({ who, h = 46, stamp = true, rot }) => { const p = SIGNERS[who];
    return <span className={cx("s173-ink", stamp && p.stamp && "stamped", p.stamp && p.stamp.kind)} style={{ "--h": `${h}px` }}>
      {stamp && p.stamp && <Stamp s={p.stamp} rot={rot} />}<img src={SIGN + p.img} alt={`Signed by ${p.name}`} /></span>; };
  // option 3B's digital signature: the box a Class 3 DSC prints on a PDF from Tally, its validity illustrative
  const Dsc = ({ who, at, reason, place }) => { const p = SIGNERS[who];
    return <span className="s173-dsc"><Icon name="badge-check" size={22} stroke={2} /><span><b>Digitally signed by {p.name.toUpperCase()}</b><span>Date: {at.slice(0, 10).replace(/-/g, ".")} {at.slice(11, 16)}:00 +05'30'</span><span>Reason: {reason}</span><span>Location: {place}</span></span></span>; };

  /* ---------------- the papers, patched with a signature: the app's own papers (S.Paper), with the option's signature
     set where each paper has its "for … / Authorised Signatory" block, and a signature row on the papers that have none */
  function Signed({ children, mode, who, at, reason, place }) {
    const ref = useRef(null); const [spots, setSpots] = useState([]);
    useLayoutEffect(() => {
      const r = ref.current; if (!r) return; const found = [];
      r.querySelectorAll(".tl-sign").forEach(n => { const a = document.createElement("div"); a.className = "s173-sigspot"; n.after(a); const num = a.nextElementSibling; const b = document.createElement("div"); b.className = "s173-signame"; (num || a).after(b); found.push([a, b]); });
      r.querySelectorAll(".tl-foot").forEach(f => { f.textContent = f.textContent.replace(/ · This is a Computer Generated (Invoice|Document)/, mode === "dsc" ? " · Digitally signed: verify the signature in the PDF" : ""); });
      setSpots(found);
    }, []);
    const p = SIGNERS[who];
    return <div ref={ref} className={cx("s173-signed", mode)}>{children}
      {spots.map(([a, b], i) => <Fragment key={i}>{ReactDOM.createPortal(mode === "dsc" ? <Dsc who={who} at={at} reason={reason} place={place} /> : <Ink who={who} rot={i % 2 ? -4 : -7} />, a)}{ReactDOM.createPortal(<span>{p.name}, {p.title}</span>, b)}</Fragment>)}</div>;
  }

  /* ======================= Part 1 · the staff sale's consolidated receipt ======================= */
  const LK = D.DISTRIBUTORS.lakshmi, MANGO = D.BATCHES.find(b => b.id === "MF-2410-118"), MSKU = D.SKUS[MANGO.sku];
  const MST = D.STORIES.mango.plan.lines.find(l => l.id === "staff");
  const STAFF = ["S. Ravi Kumar", "Mohd Irfan", "P. Swathi", "K. Naresh", "Syed Ameer", "B. Lavanya", "G. Srinivas", "Fatima Begum", "T. Rajesh", "M. Anil", "Shaik Imran", "V. Sravani", "N. Mahesh", "R. Kavya", "A. Prakash", "Md Saleem", "D. Ramya", "Ch. Venkatesh", "J. Suresh", "K. Divya", "P. Nagaraju", "S. Haritha"];
  const PACKS = [12, 6, 10, 4, 8, 6, 12, 3, 9, 5, 7, 6, 10, 4, 8, 5, 6, 3, 9, 7, 4, 6];
  // each staff member's UPI payment into the distributor's own address over the sale's two days: its UPI reference (a
  // 12-digit RRN: the year's last digit, the day of the year and the hour, then a sequence), when and how much
  const PAYMENTS = (() => {
    let seed = 20261002; const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32;
    return STAFF.map((who, i) => {
      const at = i < 12 ? plusMin(`${D.DAY0}T17:04`, i * 7 + Math.floor(rnd() * 4)) : plusMin(`${D.DAY0}T17:04`, 1200 + (i - 12) * 9 + Math.floor(rnd() * 5));
      const doy = Math.round((new Date(at.slice(0, 10)) - new Date(at.slice(0, 4) + "-01-01")) / 864e5) + 1;
      const rrn = `6${String(doy).padStart(3, "0")}${at.slice(11, 13)}${String(Math.floor(rnd() * 1e6)).padStart(6, "0")}`;
      const vpa = who.toLowerCase().replace(/[^a-z]/g, "").slice(0, 5) + "••••@exampleupi";
      return { n: i + 1, who, vpa, at, rrn, units: PACKS[i], amount: PACKS[i] * MST.price };
    });
  })();
  const PAID = PAYMENTS.reduce((t, p) => t + p.amount, 0), PACKED = PAYMENTS.reduce((t, p) => t + p.units, 0);
  const SHORT = PAYMENTS.slice(0, -1), SHORT_PAID = SHORT.reduce((t, p) => t + p.amount, 0);
  const RNO = "LA/SR/26-27/0002", RAT = PAYMENTS[PAYMENTS.length - 1].at;
  const span = `${day(PAYMENTS[0].at)}, ${hm(PAYMENTS[0].at)} to ${day(RAT)}, ${hm(RAT)}`;

  // his consolidated receipt, as he prints it from his books and signs it: every staff payment by its UPI reference
  function HisReceipt({ list = PAYMENTS, compact }) {
    const paid = list.reduce((t, p) => t + p.amount, 0), units = list.reduce((t, p) => t + p.units, 0);
    return <div className={cx("s173-his", compact && "compact")}>
      <div className="s173-his-lh"><b>LAKSHMI AGENCIES</b><span>{LK.address}</span><span>GSTIN {LK.gstin} · {LK.email}</span></div>
      <div className="s173-his-t">CONSOLIDATED RECEIPT · STAFF SALE</div>
      <div className="s173-his-m"><span>No. <b>{RNO}</b></span><span>Date <b>{dmy(RAT)}</b></span></div>
      <p>Received from our staff at {LK.godown}, by UPI to <b>{LK.upi}</b>, for {MSKU.brand} {MSKU.name}, batch {MANGO.id}, at ₹{n2(MST.price)} a pack, sold under {possessive(D.CLIENT.short)} staff sale:</p>
      <table><thead><tr><th>#</th><th>UPI Ref. No.</th><th>Date, time</th><th>Paid by</th><th>Packs</th><th>₹</th></tr></thead>
        <tbody>{list.map(p => <tr key={p.rrn}><td>{p.n}</td><td className="mono">{p.rrn}</td><td>{dmy(p.at).slice(0, 5)} {hm(p.at)}</td><td>{p.who}</td><td className="r">{p.units}</td><td className="r">{n2(p.amount)}</td></tr>)}
          <tr className="tot"><td colSpan={4}>{list.length} payments</td><td className="r">{units}</td><td className="r">{n2(paid)}</td></tr></tbody></table>
      <p>Rupees {window.SC3_PAPERS.words(paid).replace(/^INR /, "")}.</p>
      <div className="s173-his-sign"><Ink who="lakshmi" h={34} /><span>K. Lakshmi Narayana, Partner</span></div>
    </div>;
  }
  // the receipt as he sends it: a photo of the printed page
  const ReceiptPhoto = ({ small }) => <div className={cx("s173-photo", small && "small")} role="img" aria-label={`Photo of the consolidated receipt ${RNO}`}><div className="s173-photo-in"><HisReceipt compact /></div></div>;

  const Head = ({ badge }) => <div className="card-head"><span className="row tight"><span className="icontile"><Icon name="users" size={17} stroke={2} /></span><span className="card-title">Staff sale · {S.shortName(MSKU)}</span></span>{badge}</div>;
  const Upi = () => <div className="row" style={{ gap: 12 }}><span className="icontile s173-qr" aria-hidden="true"><Icon name="qr-code" size={26} /></span><div className="stack tight" style={{ gap: 2, minWidth: 0 }}><b className="mono t-footnote" style={{ overflowWrap: "anywhere" }}>{LK.upi}</b><span className="t-footnote muted">Your own UPI: staff pay you at the godown, over 2–3 days.</span></div></div>;
  const Open = () => <span className="t-subhead">{fmt.num(MST.units)} packs for your staff at <b>₹{MST.price}</b> a pack, at {LK.godown}. Staff pay you by UPI.</span>;
  const Count = ({ n = MST.units, onChange }) => <div className="row wrap" style={{ gap: 12 }}><Stepper value={n} onChange={onChange || (() => {})} min={0} max={MST.units} label="packs sold to staff" /><span className="t-subhead muted">of {fmt.num(MST.units)} packs sold</span></div>;
  // the receipt slot: as the label photo and the destruction's photos take one (SC-80, SC-139), a PDF or a photo
  const Slot = ({ hint, file }) => <div className="s173-slot"><span className="icontile"><Icon name="receipt" size={18} stroke={2} /></span><span className="grow"><b>Consolidated receipt</b><span className="t-footnote muted">{hint || "One receipt listing every staff payment by its UPI reference: from your books, or your UPI app's statement. A photo or a PDF."}</span></span>
    {file ? <span className="s173-slot-btns"><Button size="sm" variant="secondary" icon="upload" block>Upload the statement</Button></span> : <span className="cam-two s173-slot-btns"><Button size="sm" variant="secondary" icon="camera">Take a photo</Button><Button size="sm" variant="ghost" icon="upload">Upload</Button></span>}</div>;
  // Vision's read of the receipt: the payments, their total, and whether it is what was counted
  function Read({ list = PAYMENTS, count = MST.units, open: o }) {
    const paid = list.reduce((t, p) => t + p.amount, 0), ok = Math.abs(paid - count * MST.price) < 0.5;
    const [open, setOpen] = useState(!!o);
    return <div className={cx("s173-read", ok ? "ok" : "bad")}>
      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}><ReceiptPhoto small />
        <div className="stack tight grow" style={{ gap: 4, minWidth: 0 }}>
          <span className="t-caption subtle">Vision read {RNO}</span>
          <b>{list.length} UPI payments · {fmt.inr2(paid)}</b>
          <span className="t-footnote muted">{span}</span>
          {ok ? <span className="s173-tick"><Icon name="check" size={14} stroke={2.4} />{fmt.num(count)} packs × ₹{MST.price} · matches your count</span>
            : <span className="s173-tick bad"><Icon name="triangle-alert" size={14} stroke={2.2} />{fmt.inr2(paid)} is {fmt.num(Math.round(paid / MST.price))} packs at ₹{MST.price}, not {fmt.num(count)}</span>}
        </div></div>
      <button type="button" className="pt-link t-footnote" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"} the {list.length} UPI references</button>
      {open && <ol className="s173-refs">{list.map(p => <li key={p.rrn}><span className="mono">{p.rrn}</span><span>{p.who}</span><span className="tnum">{p.units} × ₹{MST.price}</span></li>)}</ol>}
    </div>;
  }
  const Recorded = ({ extra }) => <><span className="t-subhead"><b>{fmt.num(MST.units)} of {fmt.num(MST.units)}</b> sold to staff at ₹{MST.price} a pack</span><Progress value={1} label="Staff packs sold" />{extra}</>;
  const PaperRow = ({ title, sub, value, icon = "receipt" }) => <button type="button" className="pt-paper"><span className="icontile"><Icon name={icon} size={17} stroke={2} /></span><span className="grow"><b>{title}</b><span className="t-footnote muted">{sub}</span></span>{value && <span className="tnum strong">{value}</span>}<Icon name="chevron-right" size={16} className="subtle" /></button>;

  // A · with the count: the receipt is attached in the same card, Vision reads it, and the sale records once it matches
  const A_STATES = [
    ["Open · nothing attached", () => <Card className="stack snug"><Head badge={<Badge tone="blue" dot>open</Badge>} /><Open /><Upi /><Count /><Slot />
      <Button variant="primary" size="lg" block icon="check" disabled aria-describedby="a-need">Record the sale</Button><span id="a-need" className="t-caption subtle">Attach the consolidated receipt first: it is the sale's evidence for {possessive(D.CLIENT.short)} papers.</span></Card>],
    ["Reading", () => <Card className="stack snug"><Head badge={<Badge tone="blue" dot>open</Badge>} /><Count /><div className="s173-read"><div className="row" style={{ gap: 12 }}><K.Aura on className="icontile" style={{ borderRadius: 12, width: 40, height: 40 }}><Icon name="scan-line" size={19} /></K.Aura><div className="grow"><b>Vision is reading the receipt</b><div className="t-footnote muted">Each UPI reference, who paid and how much</div></div></div></div>
      <Button variant="primary" size="lg" block icon="check" disabled>Record the sale</Button></Card>],
    ["Read · it matches", () => <Card className="stack snug"><Head badge={<Badge tone="blue" dot>open</Badge>} /><Count /><Read />
      <Button variant="primary" size="lg" block icon="check">Record the sale</Button><span className="t-caption subtle">Record once, when the sale is over. What does not sell stays at the godown.</span></Card>],
    ["Read · one payment short", () => <Card className="stack snug"><Head badge={<Badge tone="blue" dot>open</Badge>} /><Count /><Read list={SHORT} />
      <p className="cam-alert" role="alert"><Icon name="triangle-alert" size={15} />The receipt has {SHORT.length} payments, {fmt.inr2(SHORT_PAID)}: count again, or send the receipt with every payment.</p>
      <div className="cam-two"><Button variant="secondary" icon="upload">Send another</Button><Button variant="ghost">Record {fmt.num(SHORT_PAID / MST.price)} sold</Button></div></Card>],
    ["Recorded", () => <Card className="stack snug"><Head badge={<Badge tone="green" icon="check">recorded</Badge>} /><Recorded extra={<div className="pt-papers"><PaperRow title="Consolidated receipt" sub={<><span className="mono">{RNO}</span> · {PAYMENTS.length} UPI payments · read by Vision</>} value={fmt.inr(PAID)} /></div>} /><span className="t-footnote muted">Every pack sold. The receipt is in your batch's papers and {possessive(D.CLIENT.short)} pack.</span></Card>],
  ];
  // B · a step of its own: the count as today; the receipt follows as his next step on Today, with a reminder, and the
  // papers wait for it
  const B_STATES = [
    ["Open · as today", () => <Card className="stack snug"><Head badge={<Badge tone="blue" dot>open</Badge>} /><Open /><Upi /><Count /><Button variant="primary" size="lg" block icon="check">Record the sale</Button><span className="t-caption subtle">Record once, when the sale is over. The receipt follows.</span></Card>],
    ["Recorded · the receipt asked for", () => <Card className="stack snug"><Head badge={<Badge tone="amber" dot>1 for you</Badge>} /><Recorded /><div className="s173-step"><Badge size="sm" tone="amber" dot>next</Badge><b>Send the consolidated receipt</b><span className="t-footnote muted">One receipt listing the {fmt.num(MST.units)} packs' UPI payments, for {possessive(D.CLIENT.short)} papers. They wait for it; a reminder comes in a day.</span></div><Slot hint="From your books, or your UPI app's statement. A photo or a PDF." /></Card>],
    ["On Today", () => <Card className="stack snug"><div className="row" style={{ gap: 12 }}><K.Product name={MSKU.img} size={44} /><div className="grow"><b>{MSKU.name}</b><div className="t-footnote muted"><span className="mono">{MANGO.id}</span> · {LK.godown}</div></div><Badge size="sm" tone="amber" dot>1 for you</Badge></div>
      <div className="s173-todo"><span className="icontile amber"><Icon name="receipt" size={17} stroke={2} /></span><span className="grow"><b>Send the staff sale's receipt</b><span className="t-footnote muted">{fmt.num(MST.units)} packs recorded yesterday · the papers wait for it</span></span><Button size="sm" variant="primary" icon="upload">Send it</Button></div></Card>],
    ["Sent · read", () => <Card className="stack snug"><Head badge={<Badge tone="green" icon="check">recorded</Badge>} /><Recorded extra={<Read />} /></Card>],
  ];
  // C · the payments are the count: his UPI app's statement for the sale's days, the Data agent's list of the payments
  // into his address at the staff price, his tick on each; the count follows, and Paperwork lays out the receipt
  const OTHERS = [{ n: 0, who: "Sri Sai Kirana", vpa: "srisai••••@exampleupi", at: plusMin(`${D.DAY0}T17:04`, 44), rrn: "627517930417", units: 0, amount: 1450, other: "a shop's payment" }, { n: 0, who: "M. Venkat Rao", vpa: "venka••••@exampleupi", at: plusMin(`${D.DAY0}T17:04`, 1250), rrn: "627613114902", units: 0, amount: 250, other: "not at ₹8 a pack" }];
  const Statement = () => <div className="s173-file"><Icon name="file-spreadsheet" size={18} /><span className="grow"><b>upi-statement-02-03-oct.csv</b><span className="t-footnote muted">{PAYMENTS.length + OTHERS.length} credits into {LK.upi}</span></span><Badge size="sm" tone="green" icon="check">read</Badge></div>;
  function Payments({ ticked = true }) {
    const rows = [...PAYMENTS, ...OTHERS].sort((a, z) => (a.at < z.at ? -1 : 1));
    return <div className="s173-pays"><div className="s173-pays-h"><span className="t-caption subtle">The Data agent found {rows.length} payments in the sale's days</span></div>
      <ul>{rows.slice(0, 9).map(p => <li key={p.rrn} className={p.other ? "off" : ""}><K.Check checked={ticked && !p.other} onChange={() => {}}><span className="s173-pay"><span className="mono">{p.rrn}</span><span>{p.who}</span><span className="tnum">{fmt.inr(p.amount)}</span><em>{p.other ? p.other : `${p.units} packs`}</em></span></K.Check></li>)}</ul>
      <span className="t-footnote muted">and {rows.length - 9} more · {PAYMENTS.length} ticked at ₹{MST.price} a pack</span></div>;
  }
  const C_STATES = [
    ["Open · the statement asked for", () => <Card className="stack snug"><Head badge={<Badge tone="blue" dot>open</Badge>} /><Open /><Upi /><Slot file hint="Your UPI app's statement for the sale's days: the CSV or PDF it exports. The payments at the staff price make the count." />
      <Button variant="primary" size="lg" block icon="check" disabled>Record the sale</Button><span className="t-caption subtle">No count to keep: the payments are the count.</span></Card>],
    ["The payments found · ticked", () => <Card className="stack snug"><Head badge={<Badge tone="blue" dot>open</Badge>} /><Statement /><Payments />
      <div className="s173-sum"><span className="num m">{fmt.num(PACKED)}</span><span className="t-subhead">packs · {fmt.inr2(PAID)} · {PAYMENTS.length} payments</span></div>
      <Button variant="primary" size="lg" block icon="check">Record {fmt.num(PACKED)} sold</Button></Card>],
    ["Recorded · the receipt laid out", () => <Card className="stack snug"><Head badge={<Badge tone="green" icon="check">recorded</Badge>} /><Recorded extra={<div className="pt-papers"><PaperRow title="Receipt voucher · staff sale" sub={<><span className="mono">{RNO}</span> · {PAYMENTS.length} UPI payments · signed by you</>} value={fmt.inr(PAID)} /></div>} /><span className="t-footnote muted">The Paperwork agent laid it out from your statement, with your signature on file.</span></Card>],
  ];
  // C's paper: the consolidated receipt as Tally's receipt voucher, signed
  function Voucher() {
    const R = LK;
    return <Signed who="lakshmi"><div className="paper tl">
      <div className="tl-title">Receipt Voucher</div><div className="tl-copy">(Consolidated · staff sale by UPI)</div>
      <div className="tl-grid tl-two">
        <div className="tl-cell"><b>{R.name}</b><br />{R.address}<br />GSTIN/UIN: {R.gstin}<br />State Name: {R.state}, Code: {R.stateCode}</div>
        <div className="tl-meta"><div className="tl-cell"><em>Voucher No.</em><b>{RNO}</b></div><div className="tl-cell"><em>Dated</em><b>{dmy(RAT)}</b></div>
          <div className="tl-cell tl-span"><em>Account</em>UPI, {R.upi}<br />Staff sale, {MSKU.brand} {MSKU.name}, batch {MANGO.id}</div></div>
      </div>
      <table className="tl-table"><thead><tr><th>Sl</th><th>UPI Ref. No.</th><th>Date, time</th><th>Received from</th><th>Packs</th><th>Amount</th></tr></thead><tbody>
        {PAYMENTS.map(p => <tr key={p.rrn}><td>{p.n}</td><td className="tl-mono">{p.rrn}</td><td>{dmy(p.at).slice(0, 5)} {hm(p.at)}</td><td>{p.who}</td><td className="tl-num">{p.units}</td><td className="tl-num">{n2(p.amount)}</td></tr>)}
        <tr><td /><td colSpan={3} className="tl-num"><b>Total, {PAYMENTS.length} payments</b></td><td className="tl-num"><b>{PACKED}</b></td><td className="tl-num"><b>₹ {n2(PAID)}</b></td></tr>
        <tr><td colSpan={6}>Amount (in words): <b>{window.SC3_PAPERS.words(PAID)}</b></td></tr></tbody></table>
      <div className="tl-grid tl-two"><div className="tl-cell tl-small">At ₹{n2(MST.price)} a pack, {possessive(D.CLIENT.short)} staff price for the batch. Each payment's UPI reference is its receipt to the staff member who paid.</div>
        <div className="tl-cell"><div className="tl-sign">for <b>{R.name}</b></div><div className="tl-num">Authorised Signatory</div></div></div>
      <div className="tl-foot">Laid out by Smart-Clearance's Paperwork agent from {possessive(R.name)} UPI statement</div>
    </div></Signed>;
  }
  const possessive = n => (/s$/.test(n) ? `${n}'` : `${n}'s`);

  // Priya's side, on a laptop: Execution's staff sale card and the pack with the receipt
  function PriyaStaff() {
    const opt = OPT, waiting = opt === "b" && q.get("state") === "awaiting";
    const card = <Card className="stack snug"><div className="card-head"><span className="row tight"><span className="icontile"><Icon name="users" size={17} stroke={2} /></span><span className="card-title">Staff sale · {LK.short}</span></span><Badge tone="green" icon="check">recorded</Badge></div>
      <span className="t-subhead"><b>{fmt.num(MST.units)} of {fmt.num(MST.units)}</b> sold to {possessive(LK.short)} staff at ₹{MST.price}, {fmt.inr(PAID)}. No agent acts here: {LK.short} records it.</span>
      {waiting ? <div className="s173-step"><Badge size="sm" tone="amber" dot>waiting</Badge><b>The consolidated receipt has not come yet</b><span className="t-footnote muted">Asked of {LK.short} when the sale was recorded · a reminder goes tomorrow · the papers' review waits for it</span></div>
        : opt === "c" ? <div className="pt-papers"><PaperRow title="Receipt voucher · staff sale" sub={<><span className="mono">{RNO}</span> · {PAYMENTS.length} UPI payments from {possessive(LK.short)} statement</>} value={fmt.inr(PAID)} /></div> : <Read />}
    </Card>;
    const own = D.STORIES.mango.docs.filter(d => ["support", "itc", "receipt", "fssai"].includes(d.id));
    const staffDoc = { id: "staff", type: opt === "c" ? "Receipt voucher · staff sale" : "Staff sale receipt", owner: LK.short, no: waiting ? "awaiting" : RNO, status: waiting ? "awaiting" : "generated", amount: waiting ? null : PAID, note: waiting ? `${LK.short} sends it` : `${PAYMENTS.length} UPI payments` };
    const docs = [own[0], staffDoc, ...own.slice(1)];
    return <div className="s173-desk">
      <div className="stack" style={{ gap: 14 }}><span className="t-caption subtle">Priya · Execution · {MANGO.id}</span>{card}
        <span className="t-caption subtle" style={{ marginTop: 10 }}>Priya · Paperwork · the pack</span>
        <div className="docgrid">{docs.map(d => <div key={d.id} className={cx("docpick", d.id === "staff" && "on")}><DocCard doc={d} onOpen={() => {}} /></div>)}</div>
        {waiting && <div className="row" style={{ gap: 10 }}><Button variant="primary" icon="check" disabled aria-describedby="b-wait">Mark reviewed</Button><span id="b-wait" className="t-footnote muted">Waits for {possessive(LK.short)} staff sale receipt</span></div>}
      </div>
      <div className="stack" style={{ gap: 10 }}><div className="row" style={{ justifyContent: "space-between" }}><span className="t-headline">{opt === "c" ? "Receipt voucher · staff sale" : "Staff sale receipt"}</span><Button variant="secondary" size="sm" icon="download">Download PDF</Button></div>
        {waiting ? <Card><K.Empty img="godown" title="Not sent yet" body={`${LK.short} sends the consolidated receipt for the ${fmt.num(MST.units)} packs; it lands here, read by Vision.`} /></Card>
          : opt === "c" ? <Voucher /> : <div className="stack" style={{ gap: 12 }}><div className="s173-photo big"><div className="s173-photo-in"><HisReceipt /></div></div><span className="t-footnote muted">The photo {LK.short} sent, {day(RAT)}, {hm(plusMin(RAT, 25))} · Vision read {PAYMENTS.length} UPI payments, {fmt.inr2(PAID)}, matching {fmt.num(MST.units)} packs × ₹{MST.price}</span></div>}
      </div>
    </div>;
  }

  /* ======================= Part 2 · the certificate of destruction ======================= */
  const CC = L.HISTORY.find(x => x.batch.id === "MF-2407-111"), CD = CC.docs.find(x => x.id === "destruction"), CSKU = CC.sku, CR = CC.dist;
  const AG = D.SETUP.destruction.agencies.find(a => a.name === CD.agency);
  // the facts the certificate adds, for the mockup: the agency's facility and officer (the console's agency record), the
  // two witnesses (named on his destruction screen), and the times from the photos
  const FAC = { name: "Municipal sanitary landfill, cell 4", addr: "Pardi Road, Bhandewadi, Nagpur 440035, Maharashtra", gps: "21.1467° N, 79.1563° E", auth: AG.auth, reg: "MPCB consent no. MPCB/NGP/SWM/0412/2025" };
  const START = plusMin(CD.destroyedAt, -25), RECV = plusMin(CD.destroyedAt, -40), LEFT = plusMin(CD.destroyedAt, -100);
  const food = Math.round((CD.kg - CD.packKg) * 100) / 100;
  const cartonsOf = (u, per) => { const c = Math.floor(u / per), r = u % per; return r ? `${c} cartons of ${per} and ${r} loose` : `${c} cartons of ${per}`; };
  const Sigs = ({ two }) => <div className={cx("s173-sigs", two && "two")}>
    {["officer", "w1", "w2"].map(w => { const p = SIGNERS[w]; return <div key={w} className="s173-sig"><span className="s173-sig-k">{w === "officer" ? "Supervising officer" : `Independent witness ${w === "w1" ? 1 : 2}`}</span><div className="s173-sig-ink"><Ink who={w} h={40} stamp={w === "officer"} rot={-9} /></div><b>{p.name}</b><span>{w === "officer" ? `${p.title}, ${p.firm}` : p.addr}</span>{p.id && <span className="mono">{p.id}</span>}</div>; })}
  </div>;
  const Handed = () => <div className="s173-hand"><div><span className="s173-sig-k">Goods handed over by</span><div className="s173-sig-ink"><Ink who="rakesh" h={34} stamp={false} /></div><b>Rakesh Jaiswal</b><span>Proprietor, {CR.name}</span></div>
    <div><span className="s173-sig-k">Evidence approved by</span><b>{CD.approvedBy}</b><span>for {D.CLIENT.name}, {day(CD.approvedAt)}, {hm(CD.approvedAt)}</span><span className="muted">two photos · Vision's checks {CD.evidence.checks} of {CD.evidence.of}</span></div></div>;
  const Box = ({ ok }) => <span className={cx("s173-box", ok && "on")} aria-hidden="true">{ok ? "✓" : ""}</span>;
  // A · one page, numbered: every mandatory item a section of its own, the three signatures at its foot
  function CertA() {
    return <div className="paper s173-cert">
      <div className="s173-cert-lh"><div><b>{CD.agency.toUpperCase()}</b><span>Authorised waste-management agency · {FAC.reg}</span><span>Authorisation under the Solid Waste Management Rules, 2016: {AG.auth}</span></div><span className="pp-stamp ok">DESTROYED</span></div>
      <div className="s173-cert-t">Certificate of Destruction</div>
      <div className="s173-cert-m"><span>Certificate No. <b>{CD.no}</b></span><span>Dated <b>{dmy(CD.destroyedAt)}</b></span></div>
      <p className="s173-cert-p">This is to certify that the goods below were received from <b>{CR.name}</b>, {CR.address} (GSTIN {CR.gstin}), and destroyed in our presence as set out here.</p>
      <ol className="s173-sec">
        <li><b>1. The goods</b>
          <table className="s173-ct"><thead><tr><th>Description</th><th>Batch No.</th><th>Quantity</th><th>Weight</th></tr></thead><tbody><tr>
            <td><b>{CSKU.brand} {CSKU.name}</b><br />HSN {CSKU.hsn} · MRP ₹{CSKU.mrp.toFixed(2)} a pack<br />made {fmt.date(CC.batch.mfg)} · best before {fmt.date(CC.batch.bestBefore)}</td>
            <td className="mono">{CC.batch.id}</td><td><b>{fmt.num(CD.units)} packs</b><br />{cartonsOf(CD.units, CSKU.perCarton)}</td><td><b>{fmt.kg(CD.kg)}</b> in all<br />{fmt.kg(food)} food · {fmt.kg(CD.packKg)} packaging</td></tr></tbody></table></li>
        <li><b>2. Reason for destruction</b><span className="s173-opts"><span><Box ok /> Product expiry: best before {fmt.date(CC.batch.bestBefore)}, unsold at {CD.from}</span><span><Box /> Contamination or damage</span><span><Box /> Court-ordered seizure</span></span></li>
        <li><b>3. Method</b><span className="s173-opts"><span><Box ok /> Sanitary landfill, CPCB-compliant: packs slit open and emptied into the active cell, covered with 30 cm of soil the same day; packaging segregated for an EPR-registered recycler</span><span><Box /> Incineration at a CPCB-compliant common facility</span></span></li>
        <li><b>4. Where and when</b><span className="s173-kv"><span>Facility</span><b>{FAC.name}, {FAC.addr}</b><span>Location</span><b>{FAC.gps}</b><span>Date</span><b>{fmt.date(CD.destroyedAt.slice(0, 10))}</b><span>Time</span><b>{hm(START)} to {hm(CD.destroyedAt)} IST, received {hm(RECV)}</b></span></li>
        <li><b>5. Evidence</b><span className="t-footnote">Two photographs: before, at {CD.from} with the carton's batch label, {hm(LEFT)}; after, at the cell with a slate reading the batch, the count and the date, {hm(CD.destroyedAt)}. Input GST of {fmt.inr2(CD.reversed)} reversed by {CR.name} under section 17(5)(h), GSTR-3B Table 4(B)(1).</span></li>
      </ol>
      <div className="s173-sec-t">6. Signed at the facility</div><Sigs /><Handed />
      <div className="s173-cert-f">Every company, person, signature and number on this certificate is fictional · laid out by Smart-Clearance's Paperwork agent from the agency's certificate and the evidence</div>
    </div>;
  }
  // B · the certificate and its log: page 1 the certificate with the signatures, page 2 the destruction log, step by step
  // with the times, the weighbridge slip and the photos, each step initialled
  function CertB() {
    const LOG = [[LEFT, "Photographed at the godown", `${fmt.num(CD.units)} packs at ${CD.from}, the carton's batch label in view`, "before"], [plusMin(LEFT, 20), "Loaded", "On the agency's covered vehicle MH-31-ZX-0000, sealed with seal 004127"], [RECV, "Received and weighed", `At ${FAC.name}: ${fmt.kg(CD.kg)} on weighbridge slip WB/26-27/08812`], [START, "Slit open and emptied", "Into the active cell, the packaging set aside"], [plusMin(START, 15), "Buried and covered", "Covered with 30 cm of soil"], [CD.destroyedAt, "Photographed with the slate", `Slate: ${CC.batch.id} · ${CD.units} packs · ${dmy(CD.destroyedAt)}`, "after"], [plusMin(CD.destroyedAt, 10), "Packaging sent on", `${fmt.kg(CD.packKg)} of film to an EPR-registered recycler`]];
    return <div className="stack" style={{ gap: 16 }}>
      <div className="paper s173-cert">
        <div className="s173-cert-lh"><div><b>{CD.agency.toUpperCase()}</b><span>Authorisation {AG.auth} · {FAC.reg}</span></div><span className="pp-stamp ok">DESTROYED</span></div>
        <div className="s173-cert-t">Certificate of Destruction</div>
        <div className="s173-cert-m"><span>No. <b>{CD.no}</b></span><span>Dated <b>{dmy(CD.destroyedAt)}</b></span><span>Page 1 of 2</span></div>
        <div className="s173-kv wide"><span>Goods</span><b>{CSKU.brand} {CSKU.name}, HSN {CSKU.hsn}, MRP ₹{CSKU.mrp.toFixed(2)}</b><span>Batch No.</span><b className="mono">{CC.batch.id} (made {fmt.date(CC.batch.mfg)}, best before {fmt.date(CC.batch.bestBefore)})</b>
          <span>Quantity</span><b>{fmt.num(CD.units)} packs, {cartonsOf(CD.units, CSKU.perCarton)}</b><span>Total weight</span><b>{fmt.kg(CD.kg)} ({fmt.kg(food)} food, {fmt.kg(CD.packKg)} packaging), weighed at the facility</b>
          <span>Owner</span><b>{CR.name}, GSTIN {CR.gstin}</b><span>Reason</span><b>Product expiry: unsold on the best-before</b>
          <span>Method</span><b>Sanitary landfill, CPCB-compliant (Solid Waste Management Rules, 2016)</b><span>Facility</span><b>{FAC.name}, {FAC.addr} · {FAC.gps}</b>
          <span>Date and time</span><b>{fmt.date(CD.destroyedAt.slice(0, 10))}, {hm(START)} to {hm(CD.destroyedAt)} IST</b><span>GST</span><b>{fmt.inr2(CD.reversed)} reversed by {CR.name}, s.17(5)(h)</b></div>
        <div className="s173-sec-t">Signed at the facility, as set out in the log overleaf</div><Sigs /><Handed />
      </div>
      <div className="paper s173-cert">
        <div className="s173-cert-m"><span><b>Destruction log</b> · {CD.no}</span><span>Page 2 of 2</span></div>
        <table className="s173-ct s173-log"><thead><tr><th>Time</th><th>Step</th><th>Detail</th><th>Initials</th></tr></thead><tbody>
          {LOG.map(([t, k, v, ph]) => <tr key={k}><td className="mono">{hm(t)}</td><td><b>{k}</b></td><td>{v}{ph && <span className="s173-logph"><img src={`${window.SC3_IMG}evidence/${CC.batch.id}-${ph}.webp`} alt={ph === "before" ? "The packs at the godown, the batch label in view" : "The packs slit open at the cell, the slate in view"} /></span>}</td><td className="s173-ini">{["officer", "w1", "w2"].map(w => <img key={w} src={SIGN + SIGNERS[w].img} alt={`Initialled by ${SIGNERS[w].name}`} />)}</td></tr>)}</tbody></table>
        <p className="t-footnote muted">Initialled at each step by the supervising officer and the two independent witnesses, who watched it from receipt to cover.</p>
      </div>
    </div>;
  }
  // in both: his destruction screen names the two independent witnesses, and the agency's record (the console's) carries
  // its facility and supervising officer
  function WitnessForm() {
    return <Card className="stack snug" style={{ maxWidth: 560 }}>
      <span className="t-caption subtle">Rakesh · Destroy expired packs · {CC.batch.id} · new in both options</span>
      <div className="dz-fields"><Field label="Agency" htmlFor="w-ag" help={`Authorisation ${AG.auth} · ${FAC.name}, Bhandewadi · supervising officer ${SIGNERS.officer.name}`}><Select id="w-ag" value={AG.id} onChange={() => {}}><option value={AG.id}>{AG.name}</option></Select></Field>
        <Field label="Agency's certificate number" htmlFor="w-no"><Input id="w-no" value={CD.no} onChange={() => {}} /></Field></div>
      <div className="dz-fields"><Field label="Destroyed on" htmlFor="w-day" help="From the slate in the after photo"><Input id="w-day" value={fmt.date(CD.destroyedAt.slice(0, 10))} onChange={() => {}} /></Field>
        <div className="dz-fields"><Field label="From" htmlFor="w-from"><Input id="w-from" value={hm(START)} onChange={() => {}} /></Field><Field label="To" htmlFor="w-to" help="The after photo's time"><Input id="w-to" value={hm(CD.destroyedAt)} onChange={() => {}} /></Field></div></div>
      <span className="t-headline" style={{ marginTop: 6 }}>Two independent witnesses</span>
      <span className="t-footnote muted">People who watched the destruction and are not your staff: a neighbouring trader, a resident. They sign the agency's certificate with its officer.</span>
      {["w1", "w2"].map((w, i) => { const p = SIGNERS[w]; return <div key={w} className="dz-fields"><Field label={`Witness ${i + 1} · name`} htmlFor={`w-${w}`}><Input id={`w-${w}`} value={p.name} onChange={() => {}} /></Field><Field label="Address" htmlFor={`w-${w}a`}><Input id={`w-${w}a`} value={p.addr} onChange={() => {}} /></Field></div>; })}
      <Button variant="primary" size="lg" block icon="send">Send to {D.CLIENT.short} for approval</Button>
    </Card>;
  }

  /* ======================= Part 3 · a signature on every paper ======================= */
  const SC = CC, INV = SC.docs.find(d => d.id === "invoice");
  const PaperSet = ({ phone }) => {
    const dsc = OPT === "b";
    const sign = (who, at, reason, place, child) => <Signed mode={dsc ? "dsc" : "ink"} who={who} at={at} reason={reason} place={place}>{child}</Signed>;
    const kinv = SC.kiranas && SC.kiranas[0] && SC.kiranas[0].invoice;
    const list = [
      ["Tax invoice · issued from Tally", sign("rakesh", SC.invoiceIssuedAt, "Tax invoice", CR.city, <S.Paper id="invoice" c={SC} />)],
      ["Price-support credit note", sign("munchly", `${SC.docs.find(d => d.id === "support").date || INV.date}T16:10`, "Credit note", "Pune", <S.Paper id="support" c={SC} />)],
      ["Expiry credit note, destroyed at the godown", sign("munchly", `${CD.approvedAt}`, "Credit note", "Pune", <S.Paper id="expiry" c={SC} />)],
      kinv && ["Tax invoice to a kirana", sign("rakesh", `${kinv.date}T${(kinv.at || "T10:00").slice(11, 16) || "10:00"}`, "Tax invoice", CR.city, <S.KiranaInvoice c={SC} inv={kinv} />)],
    ].filter(Boolean);
    return <div className={cx("s173-papers", phone && "phone")}>{(phone ? list.slice(0, 1) : list).map(([k, el]) => <div key={k} className="stack tight"><span className="t-caption subtle">{k}</span>{el}</div>)}</div>;
  };

  /* ======================= the page ======================= */
  const NAMES = {
    staff: { a: "A · With the count", b: "B · A step of its own", c: "C · The payments are the count" },
    cert: { a: "A · One page, numbered", b: "B · The certificate and its log" },
    sign: { a: "A · Ink and the firm's stamp", b: "B · Digitally signed" },
  };
  function Page() {
    const name = PART === "cert" && VIEW === "form" ? "A and B · the destruction screen" : NAMES[PART][OPT];
    let body;
    if (PART === "staff" && VIEW === "dist") { const st = { a: A_STATES, b: B_STATES, c: C_STATES }[OPT]; const one = q.get("state");
      body = <div className="s173-states">{(one != null ? [st[Number(one)]] : st).map(([k, El]) => <div key={k} className="s173-state"><span className="t-caption subtle">{k}</span><El /></div>)}</div>; }
    else if (PART === "staff") body = <PriyaStaff />;
    else if (PART === "cert" && VIEW === "form") body = <WitnessForm />;
    else if (PART === "cert") body = <div className="s173-certwrap">{OPT === "a" ? <CertA /> : <CertB />}</div>;
    else body = <PaperSet phone={VIEW === "phone"} />;
    const who = PART === "staff" ? (VIEW === "dist" ? `Lakshmi Agencies · Deliveries · ${MANGO.id}` : `Priya · ${MANGO.id}`) : PART === "cert" ? `${CR.name} · ${CC.batch.id} · ${CD.no}` : `${CC.batch.id} · ${CR.name} and ${D.CLIENT.short}`;
    return <div className={cx("s173", `p-${PART}`, `v-${VIEW}`)}>
      <div className="stack tight" style={{ gap: 2 }}><span className="t-caption subtle">{who}</span><span className="t-title2">{PART === "cert" && VIEW === "form" ? `In both: ${name}` : `Option ${name}`}</span></div>
      {body}
    </div>;
  }
  ReactDOM.createRoot(document.getElementById("root")).render(<ThemeProvider><AppRoot scroll="window"><Page /></AppRoot></ThemeProvider>);
})();

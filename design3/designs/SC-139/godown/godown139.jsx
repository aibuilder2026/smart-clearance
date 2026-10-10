// SC-139's options: the packs left at the distributor's godown on expiry day are destroyed there (route B), with the
// destruction's evidence, Supply Chain's yes before the batch closes, and the papers that follow. The chips
// (MF-2409-117) after the leftover demo: 444 of the scheme's 588 packets ordered, so 144 packs are left at Kalamna
// Market godown on expiry day. ?opt=a|b|c, ?frame=dist|review|console|papers
(function () {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Field, Input, Switch, ThemeProvider, AppRoot, Product } = K;
  const r2 = n => Math.round(n * 100) / 100;
  const q = new URLSearchParams(location.search);
  const OPT = q.get("opt") || "b", FRAME = q.get("frame") || "review";

  const hero = D.BATCHES.find(b => b.hero), sku = D.SKUS[hero.sku], dist = D.DISTRIBUTORS[hero.distributor], C = D.CLIENT;
  // the leftover demo's figures (money.js): 144 packs left, the credit at the dealer price, the input GST the
  // distributor reverses on them (grossed up on the credit note), and the agency's charge for destroying them
  const LEFT = 144, DP = sku.dp, GST = sku.gst;
  const credit = r2(LEFT * DP), his = r2(credit * GST), charges = r2(LEFT * M.RULES.disposalPerUnit);
  const total = r2(credit + his + charges);
  const kg = r2(LEFT * sku.kgPerUnit), packKg = r2(LEFT * sku.packKg);
  const SOLD = 1360 - LEFT, KEPT = r2(1360 * sku.itcPerUnit);
  // fictional, illustrative: the authorised agency and its authorisation, Munchly's area sales manager
  const AGENCY = { name: "Orange City Enviro Services", auth: "MPCB/SWM/NGP/0412", cert: "OCE/DC/26-27/0219" };
  const ASM = { name: "Sunil Patil", role: "Area Sales Manager, Munchly Foods, Nagpur" };
  const IMG = "../evidence/";
  const whose = n => n + (/s$/.test(n) ? "'" : "'s");

  /* ---------- pieces ---------- */
  const Who = ({ who, where }) => <div className="g-who"><span className="g-dot" aria-hidden="true" /><b>{who}</b><span className="subtle">{where}</span></div>;
  const Photo = ({ src, tag, hint, example, alt }) => <div className="cam g-cam">
    <img className="cam-feed whole" src={src} alt={alt} />
    {example && <><div className="cam-frame" aria-hidden="true"><i /><i /><i /><i /></div><span className="cam-tag">Example</span></>}
    {tag && !example && <span className="cam-tag">{tag}</span>}
    {hint && <div className="cam-hint">{hint}</div>}
  </div>;
  const Fact = ({ k, v, sub }) => <ListRow title={k} sub={sub} value={<span className="tnum">{v}</span>} />;
  const Checked = ({ ok = true, children }) => <div className="row tight t-subhead g-check"><Icon name={ok ? "circle-check" : "circle-alert"} size={16} className={ok ? "g-ok" : "g-warn"} />{children}</div>;
  const batchLine = <span className="mono">{hero.id}</span>;

  /* ---------- the distributor's side ---------- */
  function DistA() {
    return <div className="stack" style={{ gap: 14 }}>
      <Who who="Rakesh bhai" where={`Today · ${dist.godown}`} />
      <Card className="stack snug">
        <div className="card-head"><span className="row tight"><span className="icontile amber" style={{ borderRadius: 9 }}><Icon name="recycle" size={17} /></span><span className="card-title">Destroy the expired packs</span></span><Badge tone="amber">for you</Badge></div>
        <div className="row" style={{ gap: 12 }}><Product name={sku.img} size={52} alt="" /><div className="grow"><b>{fmt.num(LEFT)} packs of {sku.name}</b><div className="t-footnote muted">Batch {batchLine} expired at {dist.godown} today. {C.short} credits you ₹{DP} a pack once they are destroyed.</div></div></div>
        <Button variant="primary" block icon="camera">Send the destruction photo</Button>
      </Card>
      <Card className="stack snug">
        <span className="card-title">Destruction photo</span>
        <Photo src={IMG + "after.webp"} example hint="Like this: slit open at the landfill pit, the slate in view" alt="An example: chips packets slit open in a landfill pit, a slate with the batch" />
        <Field label="Who destroyed them"><Input value={AGENCY.name} readOnly /></Field>
        <div className="row" style={{ gap: 10 }}><Button variant="secondary" size="lg" icon="image" style={{ flex: "none" }}>Upload</Button><Button variant="primary" size="lg" block icon="camera">Take a photo</Button></div>
      </Card>
    </div>;
  }
  function DistB() {
    return <div className="stack" style={{ gap: 14 }}>
      <Who who="Rakesh bhai" where={`Today · ${dist.godown}`} />
      <Card className="stack snug">
        <div className="card-head"><span className="row tight"><span className="icontile amber" style={{ borderRadius: 9 }}><Icon name="recycle" size={17} /></span><span className="card-title">Destroy {fmt.num(LEFT)} expired packs at your godown</span></span><Badge tone="amber">2 for you</Badge></div>
        <span className="t-footnote muted">Batch {batchLine} expired today. Destroy the packs through an authorised agency, send the two photos and the agency's certificate number, and Priya at {C.short} approves the credit.</span>
        <div className="cam-two g-two">
          <Photo src={IMG + "before.webp"} tag="1 · Before" hint="The packs, batch label in view" alt="Chips packets in a crate at the godown, with the batch label" />
          <Photo src={IMG + "after.webp"} tag="2 · After" hint="Slit open and buried at the landfill" alt="The same packets slit open in a landfill pit, a slate with the batch, a JCB covering them" />
        </div>
        <Card className="stack tight g-vision" style={{ padding: "12px 14px" }}>
          <div className="row tight"><span className="icontile soft" style={{ borderRadius: 8, width: 28, height: 28 }}><Icon name="scan-line" size={15} /></span><b className="t-subhead">Vision read the before photo</b></div>
          <Checked>Batch {hero.id} on the carton label</Checked>
          <Checked>About 140 packs in view, against the {fmt.num(LEFT)} left</Checked>
          <Checked>Taken today at {dist.godown}, 10:42</Checked>
          <Checked>The slate in the after photo reads {hero.id} · 144 packets · 3 Oct</Checked>
        </Card>
        <List>
          <Fact k="Agency" v={AGENCY.name} sub={`Authorisation ${AGENCY.auth}`} />
          <Fact k="Agency's certificate" v={AGENCY.cert} />
        </List>
        <Button variant="primary" size="lg" block icon="send">Send to {C.short} for approval</Button>
        <span className="t-caption subtle">Then reverse ₹{his.toFixed(2)} of input GST on these packs in your GSTR-3B (Table 4(B)(1)). {whose(C.short)} credit note makes it good.</span>
      </Card>
    </div>;
  }
  function DistC() {
    return <div className="stack" style={{ gap: 14 }}>
      <Who who="Rakesh bhai" where={`Today · ${dist.godown}`} />
      <Card className="stack snug">
        <div className="card-head"><span className="row tight"><span className="icontile amber" style={{ borderRadius: 9 }}><Icon name="calendar-clock" size={17} /></span><span className="card-title">Book the destruction</span></span><Badge tone="amber">for you</Badge></div>
        <span className="t-footnote muted">{fmt.num(LEFT)} packs of batch {batchLine} expired today. {C.short} witnesses every destruction: book a slot with an authorised agency, and {ASM.name}, their area sales manager, comes to witness it.</span>
        <List>
          <Fact k="Agency" v={AGENCY.name} sub={`Authorisation ${AGENCY.auth}`} />
          <Fact k="Slot" v="Sat 3 Oct, 11:00" sub={`At ${dist.godown}`} />
          <Fact k="Witness" v={ASM.name} sub="Accepted · will take the photos in the app" />
        </List>
        <div className="stack tight g-steps">
          {[["Booked", "today, 10:20", true], [`${ASM.name} witnesses and photographs`, "Sat, 11:00", false], ["The agency's certificate", "after the destruction", false], [`Priya approves at ${C.short}`, "then the credit note", false]].map(([t, w, done], i) =>
            <div key={t} className={cx("row tight", !done && "subtle")}><Icon name={done ? "circle-check" : "circle"} size={16} className={done ? "g-ok" : ""} /><span className="grow t-subhead">{i + 1}. {t}</span><span className="t-caption">{w}</span></div>)}
        </div>
        <Button variant="secondary" block icon="calendar">Change the slot</Button>
      </Card>
    </div>;
  }

  /* ---------- Supply Chain's review ---------- */
  const Approve = ({ big }) => <div className="row" style={{ gap: 10 }}><Button variant="secondary" size={big ? "lg" : undefined} icon="rotate-ccw" style={{ flex: "none" }}>Ask again</Button><Button variant="primary" size={big ? "lg" : undefined} block icon="check">Approve · issue the papers</Button></div>;
  const Issue = () => <List>
    <Fact k="Expiry credit note to Rakesh Traders" v={fmt.inr2(total)} sub={`${fmt.num(LEFT)} × ₹${DP} + ₹${his.toFixed(2)} GST he reverses + ₹${charges.toFixed(2)} destruction`} />
    <Fact k="Destruction certificate" v={`${fmt.num(LEFT)} packs`} sub={`${AGENCY.name}, ${AGENCY.cert}`} />
    <Fact k={`${whose(C.short)} input GST`} v="kept" sub="the packs were Rakesh Traders' stock" />
  </List>;
  function ReviewA() {
    return <div className="stack" style={{ gap: 14 }}>
      <Who who="Priya Deshmukh" where="Execution · Masala Chips 150 g" />
      <Card className="stack snug">
        <div className="card-head"><span className="row tight"><span className="icontile amber" style={{ borderRadius: 9 }}><Icon name="recycle" size={17} /></span><span className="card-title">Destruction at the godown · to review</span></span><Badge tone="amber">waiting for you</Badge></div>
        <div className="g-split">
          <Photo src={IMG + "after.webp"} tag="Rakesh Traders' photo" alt="Chips packets slit open in a landfill pit, a slate with the batch" />
          <div className="stack snug">
            <List><Fact k="Packs" v={fmt.num(LEFT)} sub={`Batch ${hero.id}`} /><Fact k="Destroyed by" v={AGENCY.name} /><Fact k="Sent" v="today, 12:05" /></List>
            <Approve />
          </div>
        </div>
        <span className="t-footnote muted">The batch closes once you approve: the credit note and the destruction certificate are issued, and Impact posts the ledger.</span>
      </Card>
    </div>;
  }
  function ReviewB() {
    return <div className="stack" style={{ gap: 14 }}>
      <Who who="Priya Deshmukh" where="Command Center → 1 waiting for your yes" />
      <Card className="stack snug g-sheet">
        <div className="card-head"><span className="card-title">Approve the destruction</span><Badge tone="amber" dot>1 waiting for your yes</Badge></div>
        <div className="row" style={{ gap: 12 }}><Product name={sku.img} size={44} alt="" /><div className="grow"><b>{sku.name} · {fmt.num(LEFT)} packs</b><div className="t-footnote muted">Batch {batchLine} · expired at {dist.godown} · sent by Rakesh Traders today, 12:05</div></div></div>
        <div className="cam-two g-two">
          <Photo src={IMG + "before.webp"} tag="Before · 10:42" alt="Chips packets in a crate at the godown, with the batch label" />
          <Photo src={IMG + "after.webp"} tag="After · 11:58" alt="The same packets slit open in a landfill pit, a slate with the batch, a JCB covering them" />
        </div>
        <div className="g-split">
          <div className="stack tight">
            <b className="t-subhead">Vision's checks</b>
            <Checked>Batch {hero.id} read on the carton label</Checked>
            <Checked>About 140 packs in view (144 left)</Checked>
            <Checked>Both photos taken today, at the godown and the landfill</Checked>
            <Checked>The slate in the after photo reads {hero.id} · 144 packets · 3 Oct</Checked>
            <Checked>{AGENCY.name} is on {whose(C.short)} list (authorisation {AGENCY.auth})</Checked>
          </div>
          <div className="stack tight"><b className="t-subhead">On your yes</b><Issue /></div>
        </div>
        <Approve big />
      </Card>
    </div>;
  }
  function ReviewC() {
    return <div className="stack" style={{ gap: 14 }}>
      <Who who="Priya Deshmukh" where="Execution · Masala Chips 150 g" />
      <Card className="stack snug">
        <div className="card-head"><span className="card-title">Witnessed destruction</span><Badge tone="amber">waiting for you</Badge></div>
        <div className="stack tight g-steps">
          {[["Booked by Rakesh Traders", "Fri 2 Oct, 10:20"], [`Witnessed by ${ASM.name}`, "Sat 3 Oct, 11:00 · 2 photos, geotagged"], [`${whose(AGENCY.name)} certificate ${AGENCY.cert}`, "uploaded Sat 3 Oct, 12:40"]].map(([t, w]) =>
            <div key={t} className="row tight"><Icon name="circle-check" size={16} className="g-ok" /><span className="grow t-subhead">{t}</span><span className="t-caption subtle">{w}</span></div>)}
        </div>
        <div className="cam-two g-two">
          <Photo src={IMG + "before.webp"} tag={`${ASM.name} · before`} alt="Chips packets in a crate at the godown, with the batch label" />
          <Photo src={IMG + "after.webp"} tag={`${ASM.name} · after`} alt="The same packets slit open in a landfill pit, a slate with the batch" />
        </div>
        <Issue />
        <Approve />
      </Card>
    </div>;
  }

  /* ---------- the console: the client's expiry policy, the same in every option ---------- */
  function Console() {
    const policies = [
      ["godown", "Destroyed at the distributor's godown", "A financial credit note, no GST: the dealer price, the input GST he reverses, and the destruction charges", true],
      ["return", "Taken back by Munchly", "A GST credit note under s.34, against Munchly's own invoice. Needs Munchly's sales invoices in the export", false],
      ["price-support", "Price support only", "He keeps and destroys them; Munchly pays the gap to the dealer price", false],
      ["none", "No returns", "His loss; he destroys them under his own records", false],
    ];
    return <div className="stack" style={{ gap: 14 }}>
      <Who who="Neha Kulkarni" where="Console · Munchly Foods · Supply-chain profile · Expiry policy" />
      <Card className="stack snug">
        <div className="card-head"><span className="card-title">Packs left at a distributor's godown on expiry day</span><Badge size="sm">client rule</Badge></div>
        <div className="stack tight" role="radiogroup" aria-label="Expiry policy">
          {policies.map(([id, t, s, on]) => <label key={id} className={cx("g-radio", on && "on")}><span className={cx("g-ring", on && "on")} aria-hidden="true" /><span className="grow"><b className="t-subhead">{t}</b><span className="t-footnote muted" style={{ display: "block" }}>{s}</span></span></label>)}
        </div>
        <div className="g-rule-sub">When they are destroyed at the godown</div>
        <List>
          <ListRow title="Evidence" sub={OPT === "a" ? "One photo of the packs destroyed" : OPT === "c" ? `Witnessed by ${whose(C.short)} area sales manager, who takes the photos` : "Two photos, before and after, and the agency's certificate number"} value={<Switch checked readOnly aria-label="Evidence required" />} />
          {OPT === "b" && <ListRow title="Vision checks the before photo" sub="the batch number, the count, when and where" value={<Switch checked readOnly aria-label="Vision checks" />} />}
          <ListRow title="Reviewed by" sub="the batch closes on this yes" value={<span>Supply Chain</span>} />
          <ListRow title="Authorised agencies" sub={`${AGENCY.name} · and 2 more`} value={<Icon name="chevron-right" size={16} className="subtle" />} />
          <ListRow title="The credit" sub="the dealer price, the input GST he reverses (grossed up), the agency's charges up to ₹1.50 a pack" value={<Icon name="chevron-right" size={16} className="subtle" />} />
          <ListRow title="Ask again" sub="if no evidence has come in" value={<span>after 2 days</span>} />
        </List>
      </Card>
    </div>;
  }

  /* ---------- the papers, the same in every option ---------- */
  const Line = ({ k, v, strong, sub }) => <div className="pp-line"><span>{k}{sub && <em> {sub}</em>}</span><span className={strong ? "pp-strong" : ""}>{v}</span></div>;
  const head = (title, no, stamp, ok) => <div className="pp-head"><div><div className="pp-title">{title}</div><div className="pp-no">{no}</div></div><span className={cx("pp-stamp", ok && "ok")}>{stamp}</span></div>;
  function Papers() {
    return <div className="stack" style={{ gap: 14 }}>
      <Who who="Priya, and Rakesh's copies" where="Paperwork · after the approval" />
      <div className="g-papers">
        <div className="paper pp">
          {head("Destruction certificate", `${AGENCY.cert} · ${AGENCY.name}`, "DESTROYED", true)}
          <div className="pp-sub">For {dist.name}, {dist.address} · GSTIN {dist.gstin}</div>
          <Line k={`${sku.brand} ${sku.name}`} sub={`HSN ${sku.hsn} · batch ${hero.id} · best before ${fmt.date(hero.bestBefore)}`} v={`${fmt.num(LEFT)} packs`} strong />
          <Line k="Weight" sub="food and packaging" v={fmt.kg(kg)} />
          <Line k="Method" sub="slit open, buried and covered at the authorised municipal landfill, Nagpur" v="Sat 3 Oct, 11:58" />
          <Line k="Agency" sub={`the corporation's authorised waste contractor, ${AGENCY.auth}`} v={AGENCY.name} />
          <Line k="Evidence" sub="two photos, the slate, Vision's read" v={`approved by Priya Deshmukh, ${C.short}`} />
          <p className="pp-note">Destroyed at {dist.godown} on expiry day. {dist.name} reverses the input GST on these packs, ₹{his.toFixed(2)}, in GSTR-3B Table 4(B)(1) under section 17(5)(h).</p>
        </div>
        <div className="paper pp">
          {head("Expiry credit note", `CN/0118 · ${C.short} → ${dist.name}`, "NO GST ADJ.", true)}
          <Line k={`${fmt.num(LEFT)} packs destroyed at the godown`} sub={`at the ₹${DP} dealer price`} v={fmt.inr2(credit)} />
          <Line k="Input GST he reverses on them" sub={`${Math.round(GST * 100)}%, section 17(5)(h)`} v={fmt.inr2(his)} />
          <Line k="Destruction charges" sub={`${AGENCY.name}, ₹${M.RULES.disposalPerUnit.toFixed(2)} a pack`} v={fmt.inr2(charges)} />
          <Line k={`Credit to ${dist.name}`} v={fmt.inr2(total)} strong />
          <p className="pp-note">A financial credit note: no GST is charged or adjusted on it, and {whose(C.short)} output tax on the original sale stands. Issued against destruction certificate {AGENCY.cert}. Adjusted against {whose(dist.short)} account.</p>
        </div>
        <div className="paper pp">
          {head("GST ITC memo", `Section 17(5)(h) · ${C.short}`, "ITC KEPT", true)}
          <Line k="Packets supplied to Rakesh Traders under tax invoice" v={fmt.num(1360)} />
          <Line k="Of them destroyed at his godown" sub="his stock, his reversal" v={fmt.num(LEFT)} />
          <Line k="Input GST kept" sub={`₹${sku.itcPerUnit.toFixed(2)} a pack, from the cost sheet`} v={fmt.inr2(KEPT)} strong />
          <Line k="Reversal in GSTR-3B, Table 4(B)(1)" v="none" />
          <p className="pp-note">{C.short} destroyed nothing: the {fmt.num(LEFT)} packs were destroyed by {dist.name}, who had bought them under tax invoice, so section 17(5)(h) falls on {whose(dist.short)} credit, not {whose(C.short)}. {fmt.num(SOLD)} went on to kiranas and the ExpireSoon buyer.</p>
        </div>
      </div>
    </div>;
  }

  const FRAMES = {
    dist: { a: DistA, b: DistB, c: DistC }[OPT],
    review: { a: ReviewA, b: ReviewB, c: ReviewC }[OPT],
    console: Console,
    papers: Papers,
  };
  const Frame = FRAMES[FRAME] || ReviewB;
  function App() {
    return <ThemeProvider><AppRoot scroll="window"><main className={cx("g139", FRAME)}><Frame /></main></AppRoot></ThemeProvider>;
  }
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();

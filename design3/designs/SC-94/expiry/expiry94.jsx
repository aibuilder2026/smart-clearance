// SC-94's options: expiry day, as Priya's Execution and Anita's Paperwork show it. The chips (MF-2409-117) after a
// demo where the kiranas took 24 of 588 packs and the lot sold at the ₹14.20 counter: 564 packs left at Kalamna Market
// godown, settled
// by Munchly's expiry policy (money.js expirySettlement). ?opt=a|b|c, ?policy=full-credit|price-support|none,
// ?side=ops|paper|both
(function () {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, ThemeProvider, AppRoot } = K;
  const q = new URLSearchParams(location.search);
  const OPT = q.get("opt") || "a", POLICY = q.get("policy") || "full-credit", SIDE = q.get("side") || "both";

  const hero = D.BATCHES.find(b => b.hero), sku = D.SKUS[hero.sku], dist = D.DISTRIBUTORS[hero.distributor];
  const plan = D.PLAN, kl = plan.lines.find(l => l.id === "kirana");
  // the demo's moment: 24 of the scheme's packs ordered, the lot sold at the counter; what the lines came to
  const real = M.realised(plan, sku, { kirana: 24, expiresoon: kl ? plan.lines.find(l => l.id === "expiresoon").units : 0 });
  const net = M.actualNet(real, D.COUNTER.price).net;
  const left = real.godown;
  const S = M.expirySettlement(left, sku, POLICY);
  const client = D.CLIENT.short, godown = dist.godown;
  const whose = n => n + (/s$/.test(n) ? "'" : "'s");
  const POLICY_NAME = { "full-credit": "Full credit at expiry", "price-support": "Price support only", none: "No returns" };
  const PAPER = { "full-credit": "Expiry credit note", "price-support": "Price support at expiry", none: "Expiry notice" };
  const rows = plan.lines.filter(l => l.id !== "writeoff").map(l => [l.short, l.units - (real.lines.find(x => x.id === l.id) || { units: 0 }).units]).filter(([, n]) => n > 0);
  const sentence = POLICY === "full-credit" ? `The ${fmt.num(left)} packs come back to ${client} for full credit (${fmt.inr(S.credit)}), and ${client} destroys them.`
    : POLICY === "price-support" ? `The ${fmt.num(left)} packs stay with ${dist.name}, which destroys them; ${client} pays it the gap to its price (${fmt.inr(S.credit)}).`
    : `With no returns, the ${fmt.num(left)} packs are ${whose(dist.name)} loss, and it destroys them.`;

  /* ---------- the paper, the same in every option ---------- */
  const Line = ({ k, v, strong, sub }) => <div className="pp-line"><span>{k}{sub && <em> {sub}</em>}</span><span className={strong ? "pp-strong" : ""}>{v}</span></div>;
  function Paper() {
    const head = (title, no, right) => <div className="pp-head"><div><div className="pp-title">{title}</div><div className="pp-no">{no}</div></div>{right}</div>;
    if (POLICY === "none") return <div className="paper pp">{head(PAPER.none, `${hero.id} · ${dist.name}`, <span className="pp-stamp">NO RETURNS</span>)}
      <Line k={`Packs expired at ${godown}`} v={fmt.num(left)} strong /><Line k={`Credit from ${client}`} v="none" />
      <p className="pp-note">{client}'s expiry policy takes no returns: the packs no channel took are {whose(dist.name)} loss, and it destroys them under its own records.</p></div>;
    return <div className="paper pp">{head(PAPER[POLICY], `CN/0118 · ${client} → ${dist.name}`, <span className="pp-stamp ok">NO GST ADJ.</span>)}
      <Line k={`${fmt.num(left)} packs expired at ${godown}`} sub={`at the ₹${sku.dp} dealer price`} v={fmt.inr2(S.credit)} />
      <Line k={`Credit to ${dist.name}`} v={fmt.inr2(S.credit)} strong />
      {POLICY === "full-credit" ? <>
        <div className="pp-sub">{client}'s own costs, on destroying them</div>
        <Line k="Disposal" sub={`${fmt.num(left)} × ₹${M.RULES.disposalPerUnit.toFixed(2)}`} v={fmt.inr2(S.disposal)} />
        <Line k="EPR on the packaging" sub={fmt.kg(S.kg)} v={fmt.inr2(S.epr)} />
        <Line k="Input GST reversed" sub="section 17(5)(h)" v={fmt.inr2(S.itc)} />
        <Line k="Expiry, all in" v={fmt.inr2(S.total)} strong />
      </> : null}
      <p className="pp-note">{POLICY === "full-credit" ? `A financial credit note for the packs that came back on expiry day. ${client} destroys them; the destruction certificate counts them and the GST memo reverses their input credit.` : `${client}'s expiry policy is price support only: nothing comes back. ${dist.name} is paid the gap to the ₹${sku.dp} it paid, and destroys the packs itself.`}</p>
    </div>;
  }

  /* ---------- Execution, after expiry day: the option's card ---------- */
  const lineRows = () => <List>{rows.map(([k, n]) => <ListRow key={k} title={k} sub="planned, not taken" value={<span className="tnum strong">{fmt.num(n)}</span>} />)}</List>;
  function OptionA() {
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className="icontile gray" style={{ borderRadius: 9 }}><Icon name="hourglass" size={17} stroke={2} /></span><span className="card-title">Expired at the godown</span></span><Badge>{fmt.num(left)} packs</Badge></div>
      {lineRows()}
      <div className="stack tight" style={{ padding: "12px 14px", borderRadius: 14, background: "var(--fill)" }}>
        <div className="row between t-subhead"><span className="row tight"><Badge size="sm" tone={POLICY === "none" ? undefined : "green"}>{POLICY_NAME[POLICY]}</Badge></span>{POLICY !== "none" && <span className="tnum strong">{fmt.inr(S.credit)}</span>}</div>
        <span className="t-footnote">{sentence}</span>
      </div>
      <span className="t-footnote muted">Expiry day, by Report now. Net {fmt.inr(net)} of the {fmt.inr(plan.net)} planned; the figures count only what each channel took.</span>
      {POLICY !== "none" && <Button variant="outline" icon="file-text">Open the paper</Button>}
    </Card>;
  }
  function OptionB() {
    return <div className="stack" style={{ gap: 16 }}>
      <Card className="stack snug">
        <div className="card-head"><span className="row tight"><span className="icontile gray" style={{ borderRadius: 9 }}><Icon name="warehouse" size={17} stroke={2} /></span><span className="card-title">Left at the godown</span></span><Badge>{fmt.num(left)} packs</Badge></div>
        {lineRows()}
      </Card>
      <Card className="stack snug">
        <div className="card-head"><span className="row tight"><span className="icontile" style={{ borderRadius: 9 }}><Icon name="hand-coins" size={17} stroke={2} /></span><span className="card-title">Expiry settlement</span></span><Badge tone={POLICY === "none" ? undefined : "green"} icon="check">{POLICY_NAME[POLICY]}</Badge></div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {[["Credit to " + dist.short, POLICY === "none" ? "—" : fmt.inr(S.credit)], ["Destroyed by", S.destroyedBy === "client" ? client : dist.short], [POLICY === "full-credit" ? "Disposal, EPR, GST" : "Client's other costs", POLICY === "full-credit" ? fmt.inr(S.disposal + S.epr + S.itc) : "—"]].map(([k, v]) =>
            <div key={k} className="stack tight" style={{ gap: 2, padding: "10px 12px", borderRadius: 12, background: "var(--fill)" }}><span className="t-caption subtle">{k}</span><b className="tnum">{v}</b></div>)}
        </div>
        <span className="t-footnote muted">{sentence}</span>
        {POLICY !== "none" && <Button variant="outline" icon="file-text">Open the paper</Button>}
      </Card>
    </div>;
  }
  function OptionC() {
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className="icontile gray" style={{ borderRadius: 9 }}><Icon name="warehouse" size={17} stroke={2} /></span><span className="card-title">Left at the godown</span></span><Badge>{fmt.num(left)} packs</Badge></div>
      {lineRows()}
      <span className="t-footnote muted">Expired on expiry day and settled in Paperwork: {PAPER[POLICY].toLowerCase()}{POLICY !== "none" ? `, ${fmt.inr(S.credit)} to ${dist.short}` : ""}.</span>
    </Card>;
  }

  function Page() {
    const Card_ = { a: OptionA, b: OptionB, c: OptionC }[OPT];
    return <div className={cx("s94", SIDE)}>
      {SIDE !== "paper" && <div className="stack" style={{ gap: 14 }}>
        <div className="stack tight" style={{ gap: 2 }}><span className="t-caption subtle">Priya · Execution · {hero.id}</span><span className="t-title2">Execution</span></div>
        <Card_ />
      </div>}
      {SIDE !== "ops" && <div className="stack" style={{ gap: 14 }}>
        <div className="stack tight" style={{ gap: 2 }}><span className="t-caption subtle">Anita · Paperwork · {hero.id}</span><span className="t-title2">{PAPER[POLICY]}</span></div>
        <Paper />
      </div>}
    </div>;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<ThemeProvider><AppRoot scroll="window"><Page /></AppRoot></ThemeProvider>);
})();

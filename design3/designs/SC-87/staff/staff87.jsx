// SC-87's options: the staff sale a distributor runs at the godown, and the packs no channel took, "left at the
// godown". The Mango Drink batch (MF-2410-118) at Lakshmi Agencies, Hyderabad, on the plan money.js works out: 1,372 to
// the kiranas, 150 to the Hyderabad staff sale at ₹8, 58 to a food bank. Each option shows the distributor's phone and
// the operator's Execution, on the real kit. ?opt=a|b|c, ?moment=open|ask|recorded (ask: option C's question), ?side=dist|ops|both, ?sheet=1 (option B's sale sheet)
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Stepper, Progress, ThemeProvider, AppRoot, Sheet } = K;
  const q = new URLSearchParams(location.search);
  const OPT = q.get("opt") || "a", MOMENT = q.get("moment") || "open", SIDE = q.get("side") || "both";

  const mango = D.BATCHES.find(b => b.distributor === "lakshmi");
  const sku = D.SKUS[mango.sku], dist = D.DISTRIBUTORS.lakshmi;
  const plan = M.plan(mango, sku);
  const line = id => plan.lines.find(l => l.id === id);
  const staff = line("staff"), kirana = line("kirana"), food = line("foodbank");
  // a moment of the demo: 41 of her 58 kiranas ordered, the food bank collected; the staff sale open, or 120 of 150 sold
  const shops = 41, ordered = 1180, sold = MOMENT === "recorded" ? 120 : null;
  const done = sold == null ? null : { kirana: ordered, staff: sold, foodbank: food.units };
  const real = done ? M.realised(plan, sku, done) : null;
  const VPA = "lakshmi-agencies@exampleupi"; // fictional, on no real bank's handle
  const CLEARS = M.CHANNELS.find(c => c.id === "staff").clears; // "2–3 days"
  const left = real ? real.godown : 0;

  // a UPI code, drawn: illustrative, from the address so it is stable (a real one would come from the distributor's bank)
  function Qr({ size = 96 }) {
    let seed = [...VPA].reduce((t, c) => (t * 31 + c.charCodeAt(0)) >>> 0, 7);
    const r = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const n = 21, cells = [];
    const finder = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (finder(x, y)) { const fx = x < 7 ? x : x - (n - 7), fy = y < 7 ? y : y - (n - 7); const ring = Math.max(Math.abs(fx - 3), Math.abs(fy - 3)); if (ring !== 2) cells.push([x, y]); }
      else if (r() < 0.47) cells.push([x, y]);
    }
    return <svg width={size} height={size} viewBox={`-1 -1 ${n + 2} ${n + 2}`} role="img" aria-label={`UPI code for ${VPA}`} style={{ background: "#fff", borderRadius: 10, flex: "none" }}>
      {cells.map(([x, y]) => <rect key={x + "-" + y} x={x} y={y} width="1" height="1" fill="#0b1510" />)}
    </svg>;
  }

  /* ---------- the distributor's phone ---------- */

  function DistA() {
    const [n, setN] = useState(staff.units);
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className="icontile"><Icon name="users" size={17} stroke={2} /></span><span className="card-title">Staff sale · {sku.name}</span></span>{sold == null ? <Badge tone="blue" dot>open</Badge> : <Badge tone="green" icon="check">recorded</Badge>}</div>
      {sold == null ? <>
        <span className="t-subhead">{staff.units} packs for your staff at <b>₹{staff.price}</b> a pack, at {dist.godown}. Staff pay you by UPI.</span>
        <div className="row" style={{ gap: 14, alignItems: "center" }}><Qr size={92} /><div className="stack tight" style={{ gap: 2 }}><b className="mono t-footnote">{VPA}</b><span className="t-footnote muted">Your own UPI: staff pay you, at the godown, over {CLEARS}.</span></div></div>
        <div className="row" style={{ gap: 12 }}><Stepper value={n} onChange={setN} min={0} max={staff.units} step={10} label="Packs sold to staff" /><span className="t-subhead muted">of {staff.units} packs sold</span></div>
        <Button variant="primary" size="lg" block icon="check">Record the sale</Button>
        <span className="t-caption subtle">Record once, when the sale is over. What does not sell stays at the godown.</span>
      </> : <>
        <span className="t-subhead"><b>{sold} of {staff.units}</b> sold to staff · {fmt.inr(sold * staff.price)} by UPI</span>
        <Progress value={sold / staff.units} label="Staff packs sold" />
        <span className="t-footnote muted">{staff.units - sold} packs stay at {dist.godown}.</span>
      </>}
    </Card>;
  }

  function DistB() {
    const [open, setOpen] = useState(q.get("sheet") === "1");
    const [n, setN] = useState(sold == null ? 84 : sold);
    return <><Card className="stack snug" interactive onClick={() => setOpen(true)} role="button" tabIndex={0}>
      <div className="card-head"><span className="row tight"><span className="icontile"><Icon name="users" size={17} stroke={2} /></span><span className="card-title">Staff sale · {sku.name}</span></span><Icon name="chevron-right" size={18} className="subtle" /></div>
      <div className="row base" style={{ gap: 8 }}><span className="num m">{n}</span><span className="muted">of {staff.units} sold · ₹{staff.price} a pack</span></div>
      <Progress value={n / staff.units} label="Staff packs sold" />
      <span className="t-footnote subtle">{sold == null ? "Open the sale at the godown; tap as staff pay." : `Closed · ${staff.units - n} packs stay at the godown`}</span>
    </Card>
    <Sheet open={open} onClose={() => setOpen(false)} title="Staff sale at the godown">
      <div className="stack" style={{ gap: 16, alignItems: "center", textAlign: "center" }}>
        <span style={{ alignSelf: "center" }}><Qr size={180} /></span><b className="mono">{VPA}</b><span className="t-footnote muted">₹{staff.price} a pack. Show this to staff as they buy.</span>
        <div className="row" style={{ gap: 10 }}><Button onClick={() => setN(Math.min(staff.units, n + 1))} icon="plus">1 pack</Button><Button onClick={() => setN(Math.min(staff.units, n + 10))} icon="plus">10 packs</Button><Button variant="ghost" icon="minus" onClick={() => setN(Math.max(0, n - 1))}>1 pack</Button></div>
        <span className="num l">{n}<span className="subtle" style={{ fontSize: "0.4em" }}> / {staff.units}</span></span>
        <Button variant="primary" size="lg" block icon="check">Close the sale</Button>
      </div>
    </Sheet></>;
  }

  function DistC() {
    const [n, setN] = useState(staff.units);
    return sold == null ? <>
      <Card className="row" style={{ gap: 14 }}><span className="icontile soft"><Icon name="users" size={17} stroke={2} /></span><div className="grow stack tight" style={{ gap: 2 }}><b>Staff sale running</b><span className="t-footnote muted">{staff.units} packs at ₹{staff.price} at {dist.godown}. We'll ask how it went when it closes on Mon 5 Oct.</span></div></Card>
      {MOMENT === "ask" && <div className="bezel"><div className="card raised stack snug" style={{ padding: 20 }}>
        <div className="row tight"><K.Mark size={28} /><span className="t-footnote subtle strong">Smart-Clearance · Mon 5 Oct, 18:00</span></div>
        <div className="t-title3">How many of the {staff.units} sold to staff?</div>
        <div className="row wrap" style={{ gap: 8 }}><Button variant="primary" onClick={() => setN(staff.units)}>All {staff.units}</Button><Button onClick={() => setN(0)}>None</Button></div>
        <div className="row" style={{ gap: 12 }}><Stepper value={n} onChange={setN} min={0} max={staff.units} step={10} label="Packs sold to staff" /><span className="t-subhead muted">packs</span></div>
        <Button variant="primary" block icon="check">Send</Button>
      </div></div>}
    </> : <Card className="row" style={{ gap: 14 }}><span className="icontile"><Icon name="check" size={17} stroke={2} /></span><div className="grow stack tight" style={{ gap: 2 }}><b>Staff sale · {sold} of {staff.units} sold</b><span className="t-footnote muted">{staff.units - sold} packs stay at {dist.godown}.</span></div></Card>;
  }

  function Phone() {
    const Staff = { a: DistA, b: DistB, c: DistC }[OPT];
    return <div className="s87-phone"><div className="stack" style={{ gap: 14 }}>
      <div className="stack tight" style={{ gap: 2 }}><span className="t-caption subtle">Lakshmi Agencies · distributor</span><span className="t-title2">Today</span></div>
      <Card className="stack snug">
        <div className="card-head"><span className="card-title">Munchly's plan for your Mango Drink</span><Badge tone="green" icon="check">approved</Badge></div>
        <div className="stack tight t-subhead">
          <div className="row top" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--ch-kirana)" }} /><span><b>{fmt.num(kirana.units)} packets to your kiranas</b> on the scheme, delivered on your van round.</span></div>
          <div className="row top" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--ch-staff)" }} /><span><b>{staff.units} packets for your staff sale</b> at ₹{staff.price}.</span></div>
          <div className="row top" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--ch-foodbank)" }} /><span><b>{food.units} packets to a food bank</b>: the pickup is booked.</span></div>
        </div>
      </Card>
      <Staff />
    </div></div>;
  }

  /* ---------- the operator's Execution ---------- */

  function StaffOps() {
    const shown = OPT === "b" && sold == null ? 84 : sold;
    return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><K.Aura on={sold == null && OPT !== "c"} className="icontile" style={{ borderRadius: 9 }}><Icon name="users" size={17} stroke={2} /></K.Aura><span className="card-title">Staff sale · {dist.short}</span></span>{sold == null ? <Badge tone="blue" dot>{OPT === "c" ? "closes Sun" : "open"}</Badge> : <Badge tone="green" icon="check">recorded</Badge>}</div>
      <div className="row wrap" style={{ gap: 18 }}><div className="stack tight" style={{ gap: 0 }}><span className="num m">{shown == null ? "—" : shown}<span className="subtle" style={{ fontSize: "0.45em" }}> / {staff.units}</span></span><span className="t-footnote subtle">{OPT === "b" && sold == null ? "sold so far" : "sold to staff"}</span></div><div className="stack tight" style={{ gap: 0 }}><span className="num m">₹{staff.price}</span><span className="t-footnote subtle">a pack, by UPI</span></div></div>
      <Progress value={(shown || 0) / staff.units} label="Staff packs sold" />
      <span className="t-footnote muted">{dist.short} runs it at {dist.godown} and records what sold; no agent acts here.</span>
      {OPT === "b" && real && <span className="t-footnote"><Badge size="sm">{staff.units - sold} left at the godown</Badge></span>}
    </Card>;
  }

  function Godown() {
    if (!real) return null;
    const rows = [["Kirana scheme", kirana.units - ordered], ["Staff sale", staff.units - sold]].filter(([, n]) => n > 0);
    if (OPT === "a") return <Card className="stack snug">
      <div className="card-head"><span className="row tight"><span className="icontile gray"><Icon name="warehouse" size={17} stroke={2} /></span><span className="card-title">Left at the godown</span></span><Badge>{fmt.num(left)} packs</Badge></div>
      <List>{rows.map(([k, n]) => <ListRow key={k} title={k} sub="planned, not taken" value={<span className="tnum strong">{fmt.num(n)}</span>} />)}</List>
      <span className="t-footnote muted">Not recovered: {fmt.num(left)} packs at {dist.godown}, which face the write-off at best-before. The figures count only what each channel took: net {fmt.inr(real.net)} of the {fmt.inr(plan.net)} planned.</span>
    </Card>;
    if (OPT === "c") return <Card className="row" style={{ gap: 14, background: "var(--surface-2)" }}><span className="icontile gray"><Icon name="warehouse" size={17} /></span><div className="grow"><b>{fmt.num(left)} packs left at the godown</b><div className="t-footnote muted">Planned net {fmt.inr(plan.net)} · actual {fmt.inr(real.net)}: the rest was not taken.</div></div></Card>;
    return null;
  }

  // the closing push to the approver, the same in every option: what was recovered, and what the godown still holds
  function Push() {
    return <div className="bezel" style={{ maxWidth: 520 }}><div className="card raised stack snug" style={{ padding: 18 }}>
      <div className="row tight"><K.Mark size={26} /><span className="t-footnote subtle strong">Smart-Clearance · to Priya</span></div>
      <b>MF-2410-118 is done: {fmt.inr(real.net)} recovered of {fmt.inr(plan.net)} planned</b>
      <span className="t-subhead">{fmt.num(ordered)} to kiranas, {sold} to staff, {food.units} to Feeding India. {fmt.num(left)} packs are left at {dist.godown}.</span>
    </div></div>;
  }

  function Ops() {
    return <div className="stack" style={{ gap: 16 }}>
      <div className="stack tight" style={{ gap: 2 }}><span className="t-caption subtle">Priya · Execution · MF-2410-118</span><span className="t-title2">Execution</span></div>
      {OPT === "c" && real && <Godown />}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", alignItems: "start" }}>
        <Card className="stack snug"><div className="card-head"><span className="row tight"><span className="icontile"><Icon name="send" size={17} stroke={2} /></span><span className="card-title">Outreach · {dist.kiranas} kiranas</span></span>{real && <Badge tone="green" icon="check">closed</Badge>}</div><div className="row wrap" style={{ gap: 18 }}><div className="stack tight" style={{ gap: 0 }}><span className="num m">{shops}<span className="subtle" style={{ fontSize: "0.45em" }}> / {dist.kiranas}</span></span><span className="t-footnote subtle">kiranas ordered</span></div><div className="stack tight" style={{ gap: 0 }}><span className="num m">{fmt.num(ordered)}<span className="subtle" style={{ fontSize: "0.45em" }}> / {fmt.num(kirana.units)}</span></span><span className="t-footnote subtle">units</span></div></div><K.Progress value={ordered / kirana.units} label="Units ordered" />{OPT === "b" && real && <Badge size="sm">{fmt.num(kirana.units - ordered)} left at the godown</Badge>}</Card>
        <StaffOps />
        <Card className="stack snug"><div className="card-head"><span className="row tight"><span className="icontile red"><Icon name="heart-handshake" size={17} stroke={2} /></span><span className="card-title">Donation · {sku.name}</span></span><Badge tone="green" icon="check">collected</Badge></div><span className="t-footnote muted">{food.units} packs to Feeding India, collected at {dist.godown}.</span></Card>
        {OPT === "a" && <Godown />}
      </div>
      {real && <Push />}
    </div>;
  }

  function Page() {
    return <div className={cx("s87", SIDE)}>
      {SIDE !== "ops" && <Phone />}
      {SIDE !== "dist" && <div className="s87-ops"><Ops /></div>}
    </div>;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<ThemeProvider><AppRoot scroll="window"><Page /></AppRoot></ThemeProvider>);
})();

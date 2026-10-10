// SC-151's options: Execution's Lister · ExpireSoon card, which today shows the Lister's POST /v1/listings and the 201 as
// two code blocks. The chips (MF-2409-117): 772 packets at ₹15 in Rakesh Traders' name, reserve ₹13.50, hidden in
// Munchly's territories; Agrawal Wholesale bids ₹13, is countered at ₹14.20 and accepts.
//   ?opt=a|b|c   ?state=all|queued|live|countered|awarded|collected
(function () {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, List, ListRow, ThemeProvider, AppRoot, Aura, CodeBlock, Product } = K;
  const { motion, AnimatePresence, useReducedMotion } = window.Motion;
  const { useState } = React;
  const q = new URLSearchParams(location.search);
  const OPT = q.get("opt") || "a", STATE = q.get("state") || "all";
  const STATES = ["queued", "live", "countered", "awarded", "collected"];

  const hero = D.BATCHES.find(b => b.hero), sku = D.SKUS[hero.sku], dist = D.DISTRIBUTORS[hero.distributor];
  const ES = D.PLAN.lines.find(l => l.id === "expiresoon");
  const RESERVE = 13.5; // the client's reserve a pack (rules.negotiation.reservePerUnit in the port)
  const L = D.JOURNEY.listing, BUYER = D.BUYER, COUNTER = D.COUNTER.price, AWARD = D.AWARD;
  const CLIENT = D.CLIENT.short;
  const terr = Object.values(D.DISTRIBUTORS);
  const pins = terr.flatMap(d => d.pins.split(/,\s*/));
  const cities = terr.map(d => d.city);
  const whose = n => n + (/s$/.test(n) ? "'" : "'s");
  const andList = a => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  const per = sku.perCarton || 24, cartons = `${Math.floor(ES.units / per)} cartons + ${ES.units % per}`;
  const bb = new Date(hero.bestBefore + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const off = Math.round((1 - ES.price / sku.mrp) * 100);
  const T = { listed: "09:41", bid: "11:03", won: "11:09", collected: "Mon 5 Oct" };

  const req = `POST /v1/listings\n{\n  "seller": "${dist.name}, ${dist.city}",\n  "on_behalf": "one-time permission · inside ${CLIENT} floors",\n  "sku": "${sku.code}",\n  "batch": "${hero.id}",\n  "units": ${ES.units},\n  "price": ${ES.price.toFixed(2)},\n  "reserve": ${RESERVE.toFixed(2)},\n  "mrp": ${sku.mrp.toFixed(2)},\n  "best_before": "${hero.bestBefore}",\n  "hide_from_pincodes": [${pins.map(p => `"${p}"`).join(", ")}],\n  "label_photo": "gs://smart-clearance/labels/${hero.id}.jpg"\n}`;
  const res = st => `HTTP/1.1 201 Created\n{\n  "id": "${L.id}",\n  "status": "${["", "live", "live", "awarded", "collected"][st]}",\n  "url": "${L.url}"\n}`;
  const PAY = {
    bid: `POST /hooks/expiresoon  (from ExpireSoon)\n{\n  "event": "bid.placed",\n  "listing": "${L.id}",\n  "buyer": "${BUYER.name}, ${BUYER.city}",\n  "units": ${ES.units},\n  "price": 13.00\n}`,
    counter: `POST /v1/listings/${L.id}/counter\n{\n  "price": ${COUNTER.toFixed(2)},\n  "dispatch_hours": ${D.MARKET.dispatchHours}\n}\n\nHTTP/1.1 200 OK`,
    won: `POST /hooks/expiresoon  (from ExpireSoon)\n{\n  "event": "bid.accepted",\n  "listing": "${L.id}",\n  "price": ${COUNTER.toFixed(2)},\n  "token": ${AWARD.token.toFixed(2)}\n}`,
    collected: `PATCH /v1/listings/${L.id}\n{\n  "status": "collected"\n}\n\nHTTP/1.1 200 OK`,
  };

  /* ---------- shared pieces ---------- */
  const STATUS = st => [<Badge key="q">queued</Badge>, <Badge key="l" tone="violet" dot live>live</Badge>, <Badge key="c" tone="violet" dot>countered</Badge>, <Badge key="a" tone="green" dot>awarded</Badge>, <Badge key="d" tone="green" icon="check">collected</Badge>][st];
  const Head = ({ st }) => <div className="card-head"><span className="row tight"><Aura on={st === 0} className="icontile violet" style={{ borderRadius: 9 }}><Icon name="shopping-bag" size={17} stroke={2} /></Aura><span className="card-title">Lister · ExpireSoon</span></span>{STATUS(st)}</div>;
  const EsLogo = () => <span className="es-logo" aria-hidden="true"><Icon name="hourglass" size={13} stroke={2.2} /></span>;
  // the raw call stays, closed, for the audit: one button, the code under it
  function XCall({ label = "The API call", children }) {
    const [open, setOpen] = useState(false); const still = useReducedMotion();
    return <div className="xcall">
      <button type="button" className="xcall-btn" aria-expanded={open} onClick={() => setOpen(o => !o)}><Icon name="chevron-right" size={15} stroke={2.2} />{label}</button>
      <AnimatePresence initial={false}>{open && <motion.div key="c" className="stack tight" initial={still ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>}</AnimatePresence>
    </div>;
  }
  const Foot = ({ st }) => <span className="t-footnote subtle">The marketplace is mocked: ExpireSoon's partner API is in talks, and the calls are what it would answer.</span>;
  const Open = ({ st }) => st > 0 ? <Button variant="outline" icon="external-link">Open on ExpireSoon</Button> : null;

  /* ---------- A, the lot as listed (recommended) ---------- */
  function OptionA({ st }) {
    const steps = [["Listed", T.listed], ["Bid", T.bid], ["Won", T.won], ["Collected", T.collected]];
    const nowAt = st === 0 ? -1 : st >= 4 ? -1 : st === 1 ? 1 : st === 2 ? 2 : 3;
    return <Card className="stack snug">
      <Head st={st} />
      {st === 0 && <span className="t-footnote muted">Posting the lot now, in {whose(dist.name)} name, with the label photo and dates.</span>}
      <div className="esl" aria-label="The lot as buyers see it on ExpireSoon" role="group">
        <div className="esl-top"><EsLogo /><span className="es-word">ExpireSoon</span><span className="t-caption subtle">as buyers see it</span><span className="esl-id">{st > 0 ? L.id : "not posted yet"}</span></div>
        <div className="esl-lot"><span className="esl-thumb"><Product name={sku.img} size={58} /></span>
          <div className="stack tight" style={{ gap: 3, minWidth: 0 }}>
            <b className="t-subhead">{sku.brand} {sku.name} · {fmt.num(ES.units)} units</b>
            <span className="esl-price"><span className="es-price">₹{ES.price}</span><span className="t-footnote muted">a packet · <s>MRP ₹{sku.mrp}</s> · {off}% off</span></span>
            <span><span className="es-date">Best before {bb} · {hero.daysLeft} days</span></span>
            <span className="t-caption subtle">Sold by {dist.name}, {dist.city} · {cartons}</span>
          </div>
        </div>
        {st >= 3 && <div className="esl-won"><Icon name="badge-check" size={17} style={{ color: "var(--violet-text)" }} /><span>Won by <b>{BUYER.name}, {BUYER.city}</b> at <b className="tnum">₹{COUNTER.toFixed(2)}</b> · {fmt.inr(AWARD.token)} token paid</span></div>}
      </div>
      <div className="priv">
        <span className="t-caption subtle">Only {CLIENT} sees</span>
        <div className="priv-row"><Icon name="lock" size={16} /><span><b>Reserve ₹{RESERVE.toFixed(2)}</b> a packet. The Negotiator counters any bid under it; buyers never see it.</span></div>
        <div className="priv-row"><Icon name="eye-off" size={16} /><span><b>Hidden in {terr.length} territories:</b> {andList(cities)} ({pins.length} pincode areas), so the lot never undercuts a {CLIENT} distributor.</span></div>
      </div>
      <ol className="steps" aria-label="Where the lot stands">{steps.map(([k, t], i) => { const done = st > i; const now = i === nowAt; return <li key={k} className={cx(done && "done", now && "now")} aria-current={now ? "step" : undefined}><i /><b>{k}</b><span>{done ? t : now ? "waiting" : " "}</span></li>; })}</ol>
      <div className="row between wrap" style={{ gap: 8 }}><Open st={st} /><XCall>{<><CodeBlock code={req} label="ExpireSoon request" />{st > 0 && <CodeBlock code={res(st)} label="ExpireSoon response" />}</>}</XCall></div>
      <Foot st={st} />
    </Card>;
  }

  /* ---------- B, the handshake: each message between the Lister and ExpireSoon ---------- */
  function OptionB({ st }) {
    const msgs = [
      { at: 1, dir: "out", title: "Listed the lot", sub: `${fmt.num(ES.units)} packets at ₹${ES.price} in ${whose(dist.name)} name; reserve ₹${RESERVE.toFixed(2)}, hidden in ${terr.length} territories. Accepted as ${L.id}.`, time: T.listed, pay: [req, res(1)] },
      { at: 2, dir: "in", title: `A bid from ${BUYER.name}, ${BUYER.city}`, sub: `₹13.00 for all ${fmt.num(ES.units)}, under the reserve.`, time: T.bid, pay: [PAY.bid] },
      { at: 2, dir: "out", title: `Countered at ₹${COUNTER.toFixed(2)}`, sub: `With ${D.MARKET.dispatchHours}-hour dispatch from ${whose(dist.name)} calendar.`, time: T.bid, pay: [PAY.counter] },
      { at: 3, dir: "in", title: "Accepted, token paid", sub: `₹${COUNTER.toFixed(2)} for ${fmt.num(ES.units)} · ${fmt.inr(AWARD.token)} token; the balance in ${D.MARKET.balanceHours} h.`, time: T.won, pay: [PAY.won] },
      { at: 4, dir: "out", title: "The truck collected the lot", sub: `${dist.name} loaded ${whose(BUYER.name)} truck; the listing is closed.`, time: T.collected, pay: [PAY.collected] },
    ].filter(m => m.at <= st);
    const wait = ["Posting the lot", "Waiting for a bid", "Waiting for the buyer's answer", "Waiting for the truck"][st];
    const last = msgs.length ? msgs[msgs.length - 1].time : null;
    return <Card className="stack snug">
      <Head st={st} />
      <div className="hs-ends" role="group" aria-label="The connection">
        <span className="hs-end"><K.Mark size={22} /><b>Lister</b></span>
        <span className="hs-link"><Icon name="link" size={14} />{st === 0 ? "connecting" : `in sync · ${last}`}</span>
        <span className="hs-end"><b>ExpireSoon</b><EsLogo /></span>
      </div>
      <ol className="hs-log" aria-label="Messages with ExpireSoon">
        {msgs.map((m, i) => <li key={i} className="hs-msg">
          <span className={cx("hs-dir", m.dir)} title={m.dir === "out" ? "sent to ExpireSoon" : "from ExpireSoon"}><Icon name={m.dir === "out" ? "arrow-right" : "arrow-left"} size={15} stroke={2.2} /><span className="sr-only">{m.dir === "out" ? "Sent to ExpireSoon" : "From ExpireSoon"}</span></span>
          <div className="stack tight" style={{ gap: 0, minWidth: 0 }}><b className="t-subhead">{m.title}</b><span className="t-footnote muted">{m.sub}</span></div>
          <span className="hs-time">{m.time}</span>
          <XCall label="Payload">{m.pay.map((c, j) => <CodeBlock key={j} code={c} label={m.title} />)}</XCall>
        </li>)}
        {wait && <li className="hs-msg"><Aura on className="hs-dir" style={{ borderRadius: 8 }}><Icon name="hourglass" size={14} /></Aura><span className="t-footnote hs-wait" style={{ paddingTop: 5 }}>{wait}</span><span /></li>}
      </ol>
      <Open st={st} />
      <Foot st={st} />
    </Card>;
  }

  /* ---------- C, the terms: what was listed, as one list ---------- */
  function OptionC({ st }) {
    const line = [`Posting now, in ${whose(dist.name)} name`, `Live as ${L.id} since ${T.listed} · no bids yet`, `${BUYER.name} bid ₹13.00 · countered at ₹${COUNTER.toFixed(2)}`, `Won at ₹${COUNTER.toFixed(2)} by ${BUYER.name} · ${fmt.inr(AWARD.token)} token paid`, `Collected ${T.collected} · the listing is closed`][st];
    return <Card className="stack snug">
      <Head st={st} />
      <div className="terms-state"><EsLogo /><span className="grow">{line}</span></div>
      <List>
        <ListRow title="The lot" sub={`${sku.name} · ${cartons}`} value={<span className="tnum strong">{fmt.num(ES.units)} packets</span>} />
        <ListRow title="Asking" sub={`MRP ₹${sku.mrp} · ${off}% off`} value={<span className="tnum strong">₹{ES.price.toFixed(2)}</span>} />
        <ListRow title="Reserve" sub="hidden from buyers; the Negotiator's floor" value={<span className="tnum">₹{RESERVE.toFixed(2)}</span>} />
        <ListRow title="Sold by" sub={`one-time permission, inside ${CLIENT}'s floors`} value={dist.name} />
        <ListRow title="Hidden in" sub={andList(cities)} value={`${terr.length} territories`} />
        <ListRow title="Best before" sub={`${hero.daysLeft} days left`} value={bb} />
        <ListRow title="Label photo" sub="read by Vision · verified" value={<img className="terms-photo" src={window.SC3_IMG + "label-photo.webp"} alt={`The carton label of ${hero.id}`} />} />
      </List>
      <div className="row between wrap" style={{ gap: 8 }}><Open st={st} /><XCall>{<><CodeBlock code={req} label="ExpireSoon request" />{st > 0 && <CodeBlock code={res(st)} label="ExpireSoon response" />}</>}</XCall></div>
      <Foot st={st} />
    </Card>;
  }

  const NAMES = { a: "A, the lot as listed", b: "B, the handshake", c: "C, the terms" };
  function Page() {
    const Opt = { a: OptionA, b: OptionB, c: OptionC }[OPT];
    const list = STATE === "all" ? STATES : [STATE];
    return <div className="s151">
      <div className="stack tight" style={{ gap: 2 }}><span className="t-caption subtle">Priya · Execution · {hero.id}</span><span className="t-title2">Option {NAMES[OPT]}</span></div>
      <div className="s151-states" style={STATE === "all" ? null : { maxWidth: 440 }}>{list.map(s => <div key={s} className="s151-state">{STATE === "all" && <span className="t-caption subtle">{s}</span>}<Opt st={STATES.indexOf(s)} /></div>)}</div>
    </div>;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<ThemeProvider><AppRoot scroll="window"><Page /></AppRoot></ThemeProvider>);
})();

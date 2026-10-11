// SC-156's options: Execution's Outreach card, which today shows one Hindi push addressed to one shop, though the same
// scheme went to every kirana, and says nothing about where the offer window stands. The chips (MF-2409-117): 588
// packets to 38 kiranas at ₹21.60 a pack, 2 free with every 10, for 48 hours, each shop capped at 4× its 14-day sales.
//   ?opt=a|b|c   ?state=all|queued|open|filled|over|delivered
(function () {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, W = window.SC3_WORLD; const fmt = M.fmt;
  const { cx, Icon, Badge, Card, Aura, Product, Progress, Roll, ClusterMap, ThemeProvider, AppRoot } = K;
  const { motion, AnimatePresence, useReducedMotion } = window.Motion;
  const { useState } = React;
  const q = new URLSearchParams(location.search);
  const OPT = q.get("opt") || "a", STATE = q.get("state") || "all";
  const STATES = ["queued", "open", "filled", "over", "delivered"];

  const hero = D.BATCHES.find(b => b.hero), sku = D.SKUS[hero.sku], dist = D.DISTRIBUTORS[hero.distributor];
  const KL = D.PLAN.lines.find(l => l.id === "kirana");
  const SCHEME = M.RULES.scheme, CAP = M.RULES.shopCapTimes, HOURS = 48;
  const SHOPS = W.KIRANAS.filter(k => k.distributor === hero.distributor); // the 38 the scheme went to
  const ORDERING = D.KIRANAS; // the 31 that order in the story, with their units and times
  const bb = new Date(hero.bestBefore + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const whose = n => n + (/s$/.test(n) ? "'" : "'s");
  const first = n => n.split(" ")[0];
  const T = { sent: "09:41", closes: "Sun 4 Oct · 09:41", filled: "11:41", van: D.JOURNEY.van.date };
  const hourOf = t => { const [h, m] = t.split(":").map(Number); return h + m / 60 - (9 + 41 / 60); }; // hours since the push

  // five snapshots of the scheme: each what the case says (offer, orders, declined, van)
  const snap = st => {
    const orders = st === 0 ? [] : st === 1 ? ORDERING.slice(0, 12) : st === 3 ? ORDERING.slice(0, 23) : ORDERING;
    const units = orders.reduce((t, o) => t + o.units, 0);
    return {
      st, orders, units, left: KL.units - units,
      declined: st === 3 ? ["k24", "k27", "k30"] : st === 1 ? ["k27"] : [],
      offer: st === 0 ? null : { at: T.sent, closesAt: T.closes, status: st === 1 ? "open" : "closed", closedAt: st === 2 || st === 4 ? T.filled : T.closes, how: st === 2 || st === 4 ? "filled" : "ended" },
      elapsed: st === 0 ? 0 : st === 1 ? 17 : st === 2 || st === 4 ? 2 : HOURS, // hours of the window gone
      van: st === 4 ? { status: "done", at: T.van } : { status: "idle" },
    };
  };
  const badge = s => s.st === 0 ? <Badge>queued</Badge> : s.st === 1 ? <Badge tone="blue" dot live>open · {HOURS - s.elapsed} h left</Badge> : s.st === 2 ? <Badge tone="green" dot>filled · {HOURS - 2} h early</Badge> : s.st === 3 ? <Badge icon="hourglass">window over</Badge> : <Badge tone="green" icon="check">delivered</Badge>;
  const Head = ({ s }) => <div className="card-head"><span className="row tight"><Aura on={s.st === 1} className="icontile" style={{ borderRadius: 9 }}><Icon name="send" size={17} stroke={2} /></Aura><span className="card-title">Outreach · {SHOPS.length} kiranas</span></span>{badge(s)}</div>;
  const Figures = ({ s }) => <div className="row wrap" style={{ gap: 18 }}>
    <div className="stack tight" style={{ gap: 0 }}><span className="num m"><Roll value={s.orders.length} /><span className="subtle" style={{ fontSize: "0.45em" }}> / {SHOPS.length}</span></span><span className="t-footnote subtle">kiranas ordered</span></div>
    <div className="stack tight" style={{ gap: 0 }}><span className="num m"><Roll value={s.units} /><span className="subtle" style={{ fontSize: "0.45em" }}> / {KL.units}</span></span><span className="t-footnote subtle">packets</span></div>
  </div>;
  // the cluster map with the van route stays exactly as the card draws it today (the maintainer's word): the same call
  const Map = ({ s }) => <ClusterMap kiranas={ORDERING} orderedCount={s.orders.length} route height={200} />;
  const Last = ({ s }) => <div className="stack tight">{s.orders.slice(-3).reverse().map(o => <div key={o.id} className="row between t-subhead"><span>{o.name} <span className="subtle t-footnote">{o.area}</span></span><span className="tnum strong">{o.units} <span className="subtle t-caption">{o.at}</span></span></div>)}{!s.orders.length && <span className="t-footnote muted">Orders arrive as shops tap the offer. No shop can order more than {CAP}× its own 14-day sales.</span>}</div>;
  // the push, as sent: one message to every shop, behind a button, closed (as SC-151 keeps the raw call)
  function PushSent() {
    const [open, setOpen] = useState(false); const still = useReducedMotion();
    return <div className="xcall">
      <button type="button" className="xcall-btn" aria-expanded={open} onClick={() => setOpen(o => !o)}><Icon name="chevron-right" size={15} stroke={2.2} />The push, as sent</button>
      <AnimatePresence initial={false}>{open && <motion.div key="p" className="kpush" initial={still ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}>
        <K.Mark size={28} /><div><span className="hi t-subhead" lang="hi">{D.PUSH.offer.body.replace("Shree Ganesh Kirana", "{shop}")}</span><small>{D.PUSH.offer.en} · one message to all {SHOPS.length} shops, each with its own name, in Hindi (FCM).</small></div>
      </motion.div>}</AnimatePresence>
    </div>;
  }
  const Foot = () => <span className="t-footnote subtle">A shop that says Not this time keeps its {HOURS} hours to change its mind. What no shop takes moves to ExpireSoon when the window ends.</span>;
  const whenLine = s => s.st === 0 ? `Sending the scheme to ${SHOPS.length} kiranas now, in ${whose(dist.name)} name.`
    : s.st === 1 ? `Open until ${s.offer.closesAt}: ${s.orders.length} of ${SHOPS.length} shops have ordered ${fmt.num(s.units)} of ${fmt.num(KL.units)} packets.`
    : s.st === 2 ? `Filled at ${T.filled}, ${HOURS - 2} h before the window would close: ${s.orders.length} of ${SHOPS.length} shops took every packet.`
    : s.st === 3 ? `The window ended ${s.offer.closesAt} with ${s.orders.length} of ${SHOPS.length} shops ordering ${fmt.num(s.units)}; the ${fmt.num(s.left)} left moved to ExpireSoon.`
    : `Delivered on ${whose(first(dist.name))} van round, ${T.van}: ${fmt.num(s.units)} packets to ${s.orders.length} shops.`;

  /* ---------- A, the scheme's stops (recommended) ---------- */
  function OptionA({ s }) {
    const steps = [["Sent", s.offer && s.offer.at], ["First order", s.orders[0] && s.orders[0].at], ["Closed", s.offer && s.offer.status === "closed" && s.offer.closedAt], ["Van round", s.van.status === "done" && s.van.at]];
    const done = s.st === 0 ? 0 : s.st === 1 ? (s.orders.length ? 2 : 1) : s.st === 4 ? 4 : 3;
    const nowAt = s.st === 0 ? -1 : s.st === 1 ? (s.orders.length ? 2 : 1) : s.st === 4 ? -1 : 3;
    const pct = Math.min(1, s.elapsed / HOURS);
    return <Card className="stack snug">
      <Head s={s} />
      {s.st === 0 && <span className="t-footnote muted">{whenLine(s)}</span>}
      <div className="ks" role="group" aria-label="The scheme as the shops see it">
        <div className="ks-top"><span className="ks-logo" aria-hidden="true"><Icon name="store" size={13} stroke={2.2} /></span><span className="ks-word">The scheme</span><span className="t-caption subtle">as the shops see it</span><span className="ks-win">{HOURS}-hour window</span></div>
        <div className="ks-lot"><span className="ks-thumb"><Product name={sku.img} size={50} /></span>
          <div className="stack tight" style={{ gap: 3, minWidth: 0 }}>
            <b className="t-subhead">{sku.brand} {sku.name} · {fmt.num(KL.units)} packets</b>
            <span className="ks-price"><span className="ks-big">₹{KL.packPrice.toFixed(2)}</span><span className="t-footnote muted">a pack · {SCHEME.free} free with every {SCHEME.buy} · ₹{KL.price.toFixed(2)} effective</span></span>
            <span><span className="ks-date">Best before {bb} · {hero.daysLeft} days</span></span>
            <span className="t-caption subtle">From {dist.name}, {dist.city} · each shop up to {CAP}× its 14-day sales</span>
          </div>
        </div>
        {s.st >= 2 && <div className="ks-result"><Icon name={s.st === 3 ? "hourglass" : "badge-check"} size={17} /><span>{whenLine(s)}</span></div>}
      </div>
      <Figures s={s} />
      <div className="kwin" aria-label="The offer window">
        <div className="kwin-head"><span>Offer window · <b>{HOURS} h</b></span><span>{s.st === 0 ? "opens when the push goes out" : s.st === 1 ? <>closes <b>{s.offer.closesAt}</b> · {HOURS - s.elapsed} h left</> : s.offer.how === "filled" ? <>filled at <b>{s.offer.closedAt}</b> · closed early</> : <>ended <b>{s.offer.closedAt}</b></>}</span></div>
        <div className="kwin-bar"><i className={cx(s.offer && s.offer.how === "filled" && "filled", s.st === 3 && "over")} style={{ width: pct * 100 + "%" }} />{s.st >= 2 && <s style={{ left: pct * 100 + "%" }} />}</div>
        <div className="kwin-ticks" aria-hidden="true"><span>{s.offer ? s.offer.at : "—"}</span><span>24 h</span><span>{HOURS} h</span></div>
      </div>
      <ol className="esl-steps green" aria-label="Where the scheme stands">{steps.map(([k, t], i) => { const d = done > i && !!t; const now = i === nowAt; return <li key={k} className={cx(d && "done", now && "now")} aria-current={now ? "step" : undefined}><i /><b>{k}</b><span>{d ? t : now ? "waiting" : " "}</span></li>; })}</ol>
      <Map s={s} />
      <Last s={s} />
      <PushSent />
      <Foot />
    </Card>;
  }

  /* ---------- B, the window first: the status leads, then the 48 hours as a timeline of the orders ---------- */
  function Timeline({ s }) {
    const W = 420, H = 150, pl = 6, pr = 6, pt = 18, pb = 24;
    const X = h => pl + (Math.max(0, Math.min(HOURS, h)) / HOURS) * (W - pl - pr), Y = u => pt + (1 - u / KL.units) * (H - pt - pb);
    let acc = 0; const pts = s.orders.map(o => { acc += o.units; return [X(hourOf(o.at)), Y(acc), o]; });
    const endX = X(s.elapsed);
    // the packets ordered, climbing step by step with each order, to where the window stands now
    let d = `M${X(0)} ${Y(0)}`, py = Y(0); pts.forEach(([x, y]) => { d += ` L${x} ${py} L${x} ${y}`; py = y; });
    const step = pts.length ? d + ` L${endX} ${py} L${endX} ${Y(0)} Z` : "";
    return <div className="ktl" role="img" aria-label={`The ${HOURS}-hour window: ${s.orders.length} orders, ${fmt.num(s.units)} packets`}>
      <svg viewBox={`0 0 ${W} ${H}`}>
        <rect className="elapsed" x={X(0)} y={pt} width={Math.max(0, endX - X(0))} height={H - pt - pb} rx="4" />
        {step && <path className="cum" d={step} />}
        {pts.map(([x, y, o]) => <circle key={o.id} className="dot" cx={x} cy={y} r="3.5"><title>{o.name} · {o.units} at {o.at}</title></circle>)}
        {s.st === 1 && <line className="now" x1={endX} x2={endX} y1={pt - 4} y2={H - pb + 2} />}
        {s.offer && s.offer.status === "closed" && <line className="close" x1={endX} x2={endX} y1={pt - 4} y2={H - pb + 2} />}
        {[0, 12, 24, 36, 48].map(h => <text key={h} className="ax" x={X(h)} y={H - 6} textAnchor={h === 0 ? "start" : h === 48 ? "end" : "middle"}>{h === 0 ? `sent ${T.sent}` : h === 48 ? `closes ${T.closes.split(" · ")[1]}` : `${h} h`}</text>)}
        {s.st === 1 && <text className="lbl" x={Math.min(endX + 6, W - 60)} y={pt + 10}>now · {HOURS - s.elapsed} h left</text>}
        {s.offer && s.offer.how === "filled" && <text className="lbl" x={endX + 6} y={pt + 10}>filled {s.offer.closedAt}</text>}
        {s.st === 3 && <text className="lbl" x={endX - 6} y={pt + 10} textAnchor="end">ended · {fmt.num(s.left)} left</text>}
        <text className="ax" x={W - pr} y={pt - 3} textAnchor="end">{fmt.num(KL.units)} packets</text>
      </svg>
    </div>;
  }
  function OptionB({ s }) {
    const icon = s.st === 0 ? "send" : s.st === 1 ? "timer" : s.st === 2 ? "badge-check" : s.st === 3 ? "hourglass" : "truck";
    const lead = s.st === 0 ? "Queued" : s.st === 1 ? "Window open" : s.st === 2 ? "Filled early" : s.st === 3 ? "Window over" : "Delivered";
    return <Card className="stack snug">
      <Head s={s} />
      <div className="kstat"><span className={cx("icontile", s.st === 3 && "gray")} style={{ borderRadius: 9 }}><Icon name={icon} size={17} stroke={2} /></span><span><b>{lead}.</b> {whenLine(s).replace(/^[^:]*: /, m => (s.st === 1 || s.st === 2 || s.st === 3 ? "" : m))}<small>{fmt.num(KL.units)} packets at ₹{KL.packPrice.toFixed(2)} a pack, {SCHEME.free} free with every {SCHEME.buy} · {SHOPS.length} shops, each up to {CAP}× its 14-day sales · {s.declined.length ? `${s.declined.length} said not this time` : "none declined"}</small></span></div>
      {s.st > 0 && <Timeline s={s} />}
      <Figures s={s} />
      <Progress value={s.units / KL.units} label="Packets ordered" />
      <Map s={s} />
      <Last s={s} />
      <PushSent />
      <Foot />
    </Card>;
  }

  /* ---------- C, the shops: every kirana as a cell ---------- */
  function OptionC({ s }) {
    const cell = k => { const o = s.orders.find(x => x.id === k.id); if (o) return ["ordered", `${o.units}`, o.at]; if (s.declined.includes(k.id)) return ["declined", "no", "not this time"]; if (s.st === 0) return ["waiting", "·", "not sent"]; if (s.st === 1) return ["waiting", "…", "waiting"]; return ["missed", "—", "no answer"]; };
    const counts = { ordered: s.orders.length, declined: s.declined.length };
    return <Card className="stack snug">
      <Head s={s} />
      <span className="t-subhead" style={{ color: "var(--fg)" }}>{whenLine(s)}</span>
      <ol className="kgrid" aria-label={`The ${SHOPS.length} shops`}>{SHOPS.map(k => { const [cls, v, sub] = cell(k); return <li key={k.id} className={cls} title={`${k.name}, ${k.area}: ${sub}`}><b>{v}</b><span>{first(k.name)}</span></li>; })}</ol>
      <div className="kgrid-legend" aria-hidden="true"><span><i className="ordered" />Ordered · {counts.ordered}</span><span><i />Not this time · {counts.declined}</span>{s.st === 1 && <span><i className="waiting" />Waiting · {SHOPS.length - counts.ordered - counts.declined}</span>}{s.st >= 2 && SHOPS.length - counts.ordered - counts.declined > 0 && <span><i className="missed" />No answer · {SHOPS.length - counts.ordered - counts.declined}</span>}</div>
      <Figures s={s} />
      <Progress value={s.units / KL.units} label="Packets ordered" />
      <Map s={s} />
      <PushSent />
      <Foot />
    </Card>;
  }

  const NAMES = { a: "A, the scheme's stops", b: "B, the window first", c: "C, the shops" };
  function Page() {
    const Opt = { a: OptionA, b: OptionB, c: OptionC }[OPT];
    const list = STATE === "all" ? STATES : [STATE];
    return <div className="s156">
      <div className="stack tight" style={{ gap: 2 }}><span className="t-caption subtle">Priya · Execution · {hero.id}</span><span className="t-title2">Option {NAMES[OPT]}</span></div>
      <div className="s156-states" style={STATE === "all" ? null : { maxWidth: 440 }}>{list.map(st => <div key={st} className="s156-state">{STATE === "all" && <span className="t-caption subtle">{st}</span>}<Opt s={snap(STATES.indexOf(st))} /></div>)}</div>
    </div>;
  }
  ReactDOM.createRoot(document.getElementById("root")).render(<ThemeProvider><AppRoot scroll="window"><Page /></AppRoot></ThemeProvider>);
})();

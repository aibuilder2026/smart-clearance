// SC-60 round 2 · A's film hero, and C's table as the scene where the agents work the batch, in place of "Five exits,
// one batch". Three treatments of the scene, picked by window.SC60_R2:
//   1 · the tour on the table: the whole table in view, a small card beside each agent as it works (as the town's tour);
//   2 · in focus: one agent at a time in a large card at the centre, the table closing in on its post behind;
//   3 · the relay: 2's picture, driven by the scroll instead of the clock.
(function () {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo } = React;
  const { useReducedMotion, motion, useScroll, useInView, useMotionValueEvent, AnimatePresence, animate } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, Button, Badge, Mark, Money, Roll, Product, GateChips, useApp, useTheme } = K;
  const C = window.SC60, O = window.SC60_OPTS; const { FIG, AGENTS, AGENT, LINKS, IMG, EASE, useLit, AgentChips } = C;
  const { KL, ESL, AW, BATCH, DIST, SKU, SHOPS, BIN, ES_NET, N, row, rate, SCHEME } = FIG;
  const VAR = String(window.SC60_R2 || "2"); const S60 = window.SC60_IMG || "./";
  const plate = (name, night) => S60 + name + (night ? "-night" : "") + ".webp";

  /* ---------- the table: C's plate, and where everything stands on it (fractions of its width and height) ---------- */
  const TAB_AR = 2752 / 1536;
  const PHONE = { x: 0.68, y: 0.35, w: 0.107, h: 0.42 };
  const POST = { data: { x: 0.11, y: 0.6, side: "left" }, watcher: { x: 0.24, y: 0.42 }, vision: { x: 0.36, y: 0.6 }, valuer: { x: 0.17, y: 0.74, side: "left" }, router: { x: 0.33, y: 0.78 },
    you: { x: 0.62, y: 0.38, side: "left" }, outreach: { x: 0.48, y: 0.52 }, lister: { x: 0.635, y: 0.5 }, negotiator: { x: 0.6, y: 0.74, side: "left" }, paperwork: { x: 0.77, y: 0.56 }, impact: { x: 0.86, y: 0.63 } };
  const WHERE = { data: "at the godown", watcher: "at the godown", vision: "at the godown", valuer: "at the godown", router: "at the godown", you: "on your phone", outreach: "at the kiranas", lister: "at the buyer's bay", negotiator: "at the buyer's truck", paperwork: "on your phone", impact: "at the landfill" };
  const TAGS = [
    { id: "kirana", at: { x: 0.44, y: 0.6 }, name: "Kiranas", line: got => `${fmt.num(got.kirana)} of ${fmt.num(KL.units)} packs · ${SHOPS} shops` },
    { id: "expiresoon", at: { x: 0.69, y: 0.64 }, name: "A buyer elsewhere", line: got => `${fmt.num(got.expiresoon)} of ${fmt.num(AW.units)} packs · ${rate(AW.price)} a pack` },
    { id: "dump", at: { x: 0.9, y: 0.72 }, name: "Landfill", line: (got, done) => done ? `${fmt.num(D.PLAN.kg)} kg kept out` : `the bin would cost ${fmt.inr(-BIN)}` },
  ];
  const DROP = { kirana: { x: 0.47, y: 0.66 }, expiresoon: { x: 0.66, y: 0.69 } };
  // the agents in the order they work; the person's yes holds longest
  const ORDER = ["data", "watcher", "vision", "valuer", "router", "you", "outreach", "lister", "negotiator", "paperwork", "impact"];
  const NS = ORDER.length, YES = ORDER.indexOf("you"), OUT = ORDER.indexOf("outreach"), LIST = ORDER.indexOf("lister");
  const PACE = { agent: 1400, you: 1800 };
  const curve = (a, b, lift) => `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y}`;
  function useCover(stageRef, ar, pan = 0.5, panY = 0.5) {
    const [fit, setFit] = useState(null);
    useLayoutEffect(() => {
      const el = stageRef.current; if (!el) return;
      const measure = () => { const w = el.clientWidth, h = el.clientHeight; const s = Math.max(w / ar, h); const pw = s * ar, ph = s; setFit({ w, h, pw, ph, x: (w - pw) * pan, y: (h - ph) * panY }); };
      measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
    }, [ar, pan, panY]);
    return fit;
  }
  const at = (fit, p) => ({ left: fit.x + p.x * fit.pw, top: fit.y + p.y * fit.ph });

  /* ---------- what each agent is doing, live, for the card in focus ---------- */
  function Frag({ id }) {
    switch (id) {
      case "data": return <><Product name="pack-snack-plain" size={56} /><span className="k">{fmt.num(BATCH.units)} packs · selling <b>{BATCH.sellPerDay}</b> a day · <b>{BATCH.daysLeft}</b> days to the date</span></>;
      case "watcher": return <><span className="num red">{fmt.num(N)}</span><span className="k">packs won't sell in time</span><GateChips gates={D.RISK.gates} size="sm" /></>;
      case "vision": return <><Product name="phone-scan" size={56} /><span className="k">One label photo from the godown · <b>the date matches</b> the export</span></>;
      case "valuer": return <>{[["kirana", "Kiranas"], ["expiresoon", "ExpireSoon"], ["staff", "Staff sale"], ["foodbank", "Food bank"], ["writeoff", "The bin"]].map(([id, n]) => <span key={id} className="k"><i className={"ex-dot " + (id === "writeoff" ? "bin" : id)} aria-hidden="true" />{n} <b style={id === "writeoff" ? { color: "var(--red-text)" } : undefined}>{fmt.inr2(row(id).net)}</b></span>)}</>;
      case "router": return <><div className="m-split" aria-hidden="true"><span className="k" style={{ flexGrow: KL.units }} /><span className="e" style={{ flexGrow: ESL.units }} /></div><span className="k"><i className="ex-dot kirana" aria-hidden="true" /><b>{fmt.num(KL.units)}</b> to {SHOPS} kiranas</span><span className="k"><i className="ex-dot expiresoon" aria-hidden="true" /><b>{fmt.num(AW.units)}</b> to one buyer</span></>;
      case "you": return <><Money value={D.PLAN.net} /><span className="k">on screen, against {fmt.inr(-BIN)} to destroy it</span><span className="btn btn-approve"><Icon name="check" size={16} />Approve · release the agents</span></>;
      case "outreach": return <><span className="hi" lang="hi">{D.PUSH.offer.title}</span><span className="k">to <b>{SHOPS}</b> kiranas in Hindi · buy {SCHEME.buy}, get {SCHEME.free} free · 48 hours</span></>;
      case "lister": return <><Product name="marketplace-bag" size={56} /><span className="k"><b>{fmt.num(AW.units)}</b> packs listed in the distributor's name · reserve {rate(M.RULES.negotiation.reservePerUnit)}</span></>;
      case "negotiator": return <><span className="k">A bid of <b>{fmt.inr(13)}</b></span><Icon name="arrow-right" size={16} /><span className="k">countered to <b>{rate(AW.price)}</b>, accepted</span><span className="k">· token <b>{fmt.inr(AW.token)}</b></span></>;
      case "paperwork": return <><Product name="documents" size={56} /><span className="k">The distributor's invoice · the brand's credit note <b>{fmt.inr(D.SUPPORT.total)}</b> · the GST memo</span></>;
      case "impact": return <><span className="num">{fmt.num(D.PLAN.kg)} kg</span><span className="k">kept out of landfill · <b>{fmt.inr(D.ACTUAL.net)}</b> recovered · 0 cartons destroyed</span></>;
      default: return null;
    }
  }
  // the plan on the phone's screen: waiting, then placed
  const AFTER = ["outreach", "lister", "negotiator", "paperwork", "impact"];
  function PhoneScreen({ placed, lit }) {
    return <div className="ps" aria-hidden="true">
      <div className="top"><span className="who"><Mark size={24} /><b>Route Room</b></span>{placed ? <Badge tone="green" icon="check">Placed · 09:40</Badge> : <Badge tone="amber" dot>Waiting for you</Badge>}</div>
      {placed ? <><div className="placed"><span className="t">Plan placed</span><Money value={D.PLAN.swing} /><p>better than the bin, on one batch of chips.</p></div>
          <div className="work">{AFTER.map((id, i) => <span key={id} className={cx("w", i < lit && "on")}><i><Icon name={AGENT[id].icon} size={11} stroke={2.4} /></i><b>{AGENT[id].name}</b><span>· {AGENT[id].did}</span></span>)}</div></>
        : <><h4>Approve the plan</h4><div className="big"><Money value={D.PLAN.net} /><span>net recovered, {D.PLAN.pctMRP}% of MRP</span></div>
          <div><div className="r"><span>Instead of destroying</span><b className="red">{fmt.inr(-BIN)}</b></div><div className="r"><span>{fmt.num(KL.units)} packs to {SHOPS} kiranas</span><b>{fmt.inr(KL.net)}</b></div><div className="r"><span>{fmt.num(ESL.units)} packs on ExpireSoon</span><b>{fmt.inr(ESL.net)}</b></div></div>
          <span className="btn btn-approve btn-lg"><Icon name="check" size={18} />Approve · release the agents</span></>}
    </div>;
  }

  /* ---------- the scene ---------- */
  function TableScene() {
    const night = useTheme().resolved === "dark"; const reduce = useReducedMotion(); const app = useApp(); const desk = app.bp === "desktop";
    const focus = VAR !== "1", scroll = VAR === "3";
    const sec = useRef(null), track = useRef(null), stage = useRef(null); const fit = useCover(stage, TAB_AR, desk ? 0.5 : 0.42, 0.5);
    const seen = useInView(stage, { amount: 0.6 });
    // s: -1 before the tour, 0..NS-1 the agent at work, NS done
    const [s, setS] = useState(reduce ? NS : -1); const [hold, setHold] = useState(false); const [run, setRun] = useState(0);
    useEffect(() => { if (scroll || reduce) return; if (s === -1 && seen) setS(0); }, [seen, scroll, reduce, s]);
    useEffect(() => { if (scroll || reduce || hold || !seen || s < 0 || s >= NS) return; const t = setTimeout(() => setS(s + 1), ORDER[s] === "you" ? PACE.you : PACE.agent); return () => clearTimeout(t); }, [s, hold, seen, scroll, reduce]);
    const { scrollYProgress: p } = useScroll({ target: track, offset: ["start start", "end end"] });
    useMotionValueEvent(p, "change", v => { if (!scroll || reduce) return; const k = Math.min(NS, Math.floor(v * (NS + 2)) - 1); if (k !== s) setS(Math.max(-1, k)); });
    const go = i => { if (scroll) { const el = track.current; const top = el.getBoundingClientRect().top + window.scrollY; const h = el.offsetHeight - window.innerHeight; window.scrollTo({ top: top + h * ((i + 1.5) / (NS + 2)), behavior: reduce ? "auto" : "smooth" }); } else { setHold(true); setS(i); } };
    const replay = () => { setHold(false); setGot({ kirana: 0, expiresoon: 0 }); setRun(r => r + 1); if (scroll) go(-1); else setS(0); };
    const agent = s >= 0 && s < NS ? ORDER[s] : null; const done = s >= NS; const working = agent != null;
    // the camera: whole table at rest; towards the agent at work, its post in the clear part of the stage above the card
    const W = 1000, H = Math.round(W / TAB_AR);
    let cam = { tx: 0, ty: 0, sc: 1 };
    if (fit && working) {
      const sc = focus ? (desk ? 1.6 : 1.45) : (desk ? 1.35 : 1.3); const f = at(fit, POST[agent]);
      const cx = fit.w * 0.5, cy = fit.h * (focus ? 0.42 : 0.46);
      let tx = cx - f.left * sc, ty = cy - f.top * sc; tx = Math.min(0, Math.max(fit.w - fit.w * sc, tx)); ty = Math.min(0, Math.max(fit.h - fit.h * sc, ty));
      cam = { tx, ty, sc };
    }
    const iz = 1 / cam.sc;
    // the packs leave the phone for the shops as Outreach works, and for the buyer's truck as the Lister works
    const dots = useRef([]), paths = useRef({}); const [got, setGot] = useState(reduce ? { kirana: KL.units, expiresoon: AW.units } : { kirana: 0, expiresoon: 0 });
    const from = { x: PHONE.x * W, y: (PHONE.y + PHONE.h / 2) * H };
    const routes = { kirana: curve(from, { x: DROP.kirana.x * W, y: DROP.kirana.y * H }, 40), expiresoon: curve(from, { x: DROP.expiresoon.x * W, y: DROP.expiresoon.y * H }, 30) };
    const DOTS = useMemo(() => { const out = []; const nk = Math.round(KL.units / 50), ne = Math.round(AW.units / 50); for (let i = 0; i < nk; i++) out.push("kirana"); for (let i = 0; i < ne; i++) out.push("expiresoon"); return out; }, []);
    const sent = useRef({ kirana: false, expiresoon: false }); const ctrls = useRef([]);
    useEffect(() => { if (s === 0 || s === -1) sent.current = { kirana: false, expiresoon: false }; }, [s, run]);
    useEffect(() => () => { ctrls.current.forEach(c => c.stop()); ctrls.current = []; }, [run]);
    useEffect(() => {
      if (reduce) return;
      const id = s === OUT ? "kirana" : s === LIST ? "expiresoon" : null; if (!id || sent.current[id]) return; sent.current[id] = true;
      const path = paths.current[id]; if (!path) return; const L = path.getTotalLength(); const mine = DOTS.map((d, i) => [d, i]).filter(([d]) => d === id); let arrived = 0;
      mine.forEach(([, i], j) => { const c = dots.current[i]; if (!c) return; ctrls.current.push(animate(0, 1, { duration: 0.8, delay: 0.1 + j * 0.07, ease: [0.45, 0, 0.4, 1],
        onUpdate: v => { const q = path.getPointAtLength(v * L); c.setAttribute("cx", q.x); c.setAttribute("cy", q.y); c.setAttribute("opacity", v < 0.06 ? v * 16 : v > 0.94 ? Math.max(0, (1 - v) * 16) : 1); },
        onComplete: () => { c.setAttribute("opacity", 0); arrived += 1; setGot(g => ({ ...g, [id]: Math.round((id === "kirana" ? KL.units : AW.units) * arrived / mine.length) })); } })); });
    }, [s, reduce, run]);
    useEffect(() => { if (done) setGot({ kirana: KL.units, expiresoon: AW.units }); }, [done]);
    const a = agent && AGENT[agent]; const human = agent === "you";
    const mini = fit ? { left: at(fit, PHONE).left, top: at(fit, PHONE).top, width: PHONE.w * fit.pw, height: PHONE.h * fit.ph, "--s": (PHONE.w * fit.pw) / 360 } : null;
    const card = a && <div className={cx("tb-focus", human && "human")} role="group" aria-live="polite">
      <span className="icn" aria-hidden="true"><Icon name={a.icon} size={26} stroke={2} /></span>
      <header><span className="n">{s + 1} of {NS}</span><h3>{a.name}</h3><span>{WHERE[agent]}</span></header>
      <p>{a.did}</p>
      <div className="frag"><Frag id={agent} /></div>
      {desk && <div className="rail" role="list" aria-label="The agents, in order">{ORDER.map((id, i) => <button key={id} type="button" className={cx(i < s && "on", AGENT[id].human && "human")} aria-current={i === s ? "step" : undefined} onClick={() => go(i)}><i aria-hidden="true"><Icon name={AGENT[id].icon} size={10} stroke={2.4} /></i>{AGENT[id].name}</button>)}</div>}
    </div>;
    const tip = a && fit && <div key={agent + run} className={cx("tb-tip", human && "human", POST[agent].y < 0.3 && "below")} style={{ ...at(fit, POST[agent]), "--iz": iz, animationDuration: (human ? PACE.you : PACE.agent) + "ms", animationPlayState: hold ? "paused" : "running" }}>
      <header><i aria-hidden="true"><Icon name={a.icon} size={12} stroke={2.4} /></i><b>{a.name}</b><span>{WHERE[agent]}</span></header><p>{a.did}</p><span className="time" aria-hidden="true" style={{ animationDuration: "inherit", animationPlayState: "inherit" }} />
    </div>;
    const text = `Five exits, one batch. Ten agents at work.`;
    return <section id="agents-at-work" className={cx("s60-table", focus && "focus", scroll && "scroll")} aria-labelledby="tb-h" ref={sec}>
      <header className="tb-head"><h2 id="tb-h" className="sec-h plain">{text}</h2><p className="sec-sub">{fmt.num(N)} packs of masala chips that won't sell in the {BATCH.daysLeft} days they have left, on the table. The agents work the batch stop by stop; a person says yes once; the packs leave for the kiranas and a buyer, and nothing goes to the bin.{scroll && !reduce ? " Scroll to follow them." : ""}</p></header>
      <div className="tb-track" ref={track}>
        <div className={cx("tb-stage", working && "working")} ref={stage}>
          <div className="tb-world" style={{ transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.sc})` }}>
            <img className="tb-plate" style={{ objectPosition: `${(desk ? 0.5 : 0.42) * 100}% 50%` }} src={plate("c-table", night)} alt={`A ${night ? "lamp-lit evening" : "morning"} table by a window: a hand holds a phone over a handmade miniature of a snack trade, a tiny godown full of cartons, a lane of kirana shops, a wholesale warehouse with a blue truck, a community kitchen, a closed dump yard in the far corner, a steel tumbler of chai, and a thin glowing green path along the table.`} />
            {fit && <div className="tb-layer" style={{ left: fit.x, top: fit.y, width: fit.pw, height: fit.ph }}>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
                {Object.entries(routes).map(([id, d]) => <path key={id} ref={el => { paths.current[id] = el; }} className="tb-path" d={d} />)}
                {DOTS.map((id, i) => <circle key={i + ":" + run} ref={el => { dots.current[i] = el; }} className={"tb-dot " + id} r="9" opacity="0" />)}
              </svg>
              {mini && <div className="tb-mini" style={mini} aria-hidden="true"><div className="tb-mini-in"><PhoneScreen placed={s > YES || done} lit={done ? AFTER.length : Math.max(0, s - YES)} /></div></div>}
              {TAGS.map(t => <span key={t.id} className={cx("tb-tag", t.id, got[t.id] > 0 && "in")} style={{ ...at(fit, t.at), "--iz": iz }} aria-hidden="true"><span className="tb-tag-body"><b><i className={"ex-dot " + (t.id === "dump" ? "bin" : t.id)} />{t.name}</b><span>{t.line(got, done)}</span></span><span className="stem" /></span>)}
              <ul className="sr-only" aria-label="The agents at their posts">{ORDER.map(id => <li key={id}>{AGENT[id].name}, {WHERE[id]}: {AGENT[id].did}</li>)}</ul>
              {ORDER.map((id, i) => { const ag = AGENT[id]; const st = i < s || done ? "on" : i === s ? "now on" : "later"; return <span key={id} className={cx("tb-node", st, ag.human && "human", POST[id].side === "left" && "left")} style={{ ...at(fit, POST[id]), "--iz": iz }} aria-hidden="true"><i className="dot"><Icon name={ag.icon} size={13} stroke={2.4} /></i><span className="name">{ag.name}</span></span>; })}
              {!focus && tip}
            </div>}
          </div>
          <div className="tb-shade" aria-hidden="true" />
          {focus && <AnimatePresence mode="wait">{a && <motion.div key={agent} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }} style={{ display: "contents" }}>{card}</motion.div>}</AnimatePresence>}
          {!focus && working && <div className={cx("tb-cap", human && "human")} role="status">
            <button type="button" className="step" aria-label="Previous agent" disabled={s <= 0} onClick={() => go(s - 1)}><Icon name="chevron-left" size={18} /></button>
            <span className="text"><span className="n">{s + 1} of {NS}</span><b>{a.name}</b><span className="did">{a.did}</span></span>
            <button type="button" className="step" aria-label="Next agent" disabled={s >= NS - 1} onClick={() => go(s + 1)}><Icon name="chevron-right" size={18} /></button>
          </div>}
          {done && <div className="tb-result" role="status"><b>Sold, not binned.</b><span className="did">{fmt.inr(D.ACTUAL.net)} recovered, instead of {fmt.inr(-BIN)} to destroy it</span>{!reduce && <button type="button" className="replay" onClick={replay}><Icon name="rotate-ccw" size={16} />Replay</button>}</div>}
          {!reduce && !scroll && working && <div className="tb-ctl"><button type="button" className="replay" aria-pressed={hold} onClick={() => setHold(h => !h)}><Icon name={hold ? "play" : "pause"} size={16} />{hold ? "Play" : "Pause"}</button></div>}
          {scroll && !reduce && <ol className="tb-rail" aria-label="The agents, in order">{ORDER.map((id, i) => <li key={id}><button type="button" className={cx(i < s && "on", AGENT[id].human && "human")} aria-current={i === s ? "step" : undefined} onClick={() => go(i)}><i aria-hidden="true"><Icon name={AGENT[id].icon} size={10} stroke={2.4} /></i><span>{AGENT[id].name}</span></button></li>)}</ol>}
        </div>
      </div>
    </section>;
  }

  /* ---------- the page: A's hero and spine, with the table in the exits' place ---------- */
  function Page({ onFind, onDemo, closeRef }) {
    return <>
      <O.HeroFilm onDemo={onDemo} />
      <C.Statement text="Short-dated stock that quick commerce sent back. Priced to every exit, the bin included. Sold in the days it has left." id="how" />
      <TableScene />
      <C.Chapter id="watch" tone="green" title="Spot it while there is time to sell" lede="Every morning at 09:00 the Watcher checks each batch against its date and the quick-commerce shelf-life rules. Vision reads the label photo from the godown to be sure." who={C.agentsAt("connect", "detect", "verify")}>
        <C.AlertCard />
      </C.Chapter>
      <C.Chapter id="price" tone="sunken" title="Price every exit, the bin included" lede={`Kiranas on a ${SCHEME.free}-free-with-${SCHEME.buy} scheme, a clearance marketplace, a staff sale at the godown, a food bank: the Valuer prices each against the true cost of destroying the stock, and the Router splits the batch within each exit's limits.`} who={C.agentsAt("value", "decide")}>
        <C.PricesCard />
      </C.Chapter>
      <C.Chapter id="yes" tone="amber" title="Say yes once." lede="A person approves the plan with the money on screen. Nothing is listed, messaged or shipped before that tap." who={["a person"]} person>
        <C.PlanCard />
      </C.Chapter>
      <C.Chapter id="work" tone="night" title="The agents do the rest." lede="They send the kirana offers in Hindi, list the lot in the distributor's name, answer bids, draft the invoice, credit note and GST memo, and post the impact." who={C.agentsAt("execute", "settle", "report")} wide>
        <C.WorkCards />
      </C.Chapter>
      <C.Ledger />
      <C.Workspace />
      <C.Plans onDemo={onDemo} />
      <C.Close onDemo={onDemo} closeRef={closeRef} />
    </>;
  }
  const SECTIONS = [["how", "How it works"], ["agents-at-work", "Agents"], ["teams", "For teams"], ["pricing", "Pricing"]];
  function Site() { return <C.Shell option="a" sections={SECTIONS}>{ctx => <Page {...ctx} />}</C.Shell>; }
  C.mount(Site);
})();

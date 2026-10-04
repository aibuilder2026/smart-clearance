// Smart-Clearance v3 · the guided demo: Munchly's workspace on Smart-Clearance, nine stages, a laptop and a phone
// running the real screens, narration, beats
(function () {
  const { useState, useEffect, useRef, useMemo, useCallback, useSyncExternalStore, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Kbd, Money, Mark, Wordmark, WorkspaceMark, PhoneFrame, WindowFrame, ThemeProvider, AppRoot, NoticeHost, useTheme, Splash, ModeMenuButton } = K;
  const useStore = S.useStore;
  const WS = D.WORKSPACE;
  const user = id => Store.get().users.find(u => u.id === id) || D.PEOPLE[id];
  const ordered = (s, id) => s.hero.orders.some(o => o.id === id);
  const ES = D.PLAN.lines.find(l => l.id === "expiresoon"), KL = D.PLAN.lines.find(l => l.id === "kirana");
  const ML = id => D.MANGO_PLAN.lines.find(l => l.id === id) || { units: 0 };
  const DEVICE = { priya: "Priya's", rakesh: "Rakesh bhai's", ganesh: "Ganesh ji's", agrawal: "Agrawal ji's", anita: "Anita's", vikram: "Vikram's", meera: "Meera's" };
  const PLACE = { priya: "Munchly Foods, Pune", rakesh: "Kalamna godown, Nagpur", ganesh: "Shree Ganesh Kirana, Itwari", agrawal: "Agrawal Wholesale, Raipur", anita: "Finance, Pune", vikram: "Sustainability, Pune", meera: "Feeding India, Hyderabad" };
  // who signs in with what, for the two sign-ins in stage 1
  const PREFILL = { priya: D.PEOPLE.priya.email, rakesh: D.PEOPLE.rakesh.phone.replace("+91 ", "") };
  const INVITE = { app: "Messages", icon: "message-circle", title: "Munchly Foods", body: `Munchly Foods has added Rakesh Traders to its Smart-Clearance workspace. Sign in at ${WS.domain} with this number.` };
  const om = S.offerMath(D.KIRANAS[0].units);

  /* ---------- the nine stages, as beats ---------- */
  const STAGES = [
    { date: "Thursday 1 October", desk: { who: "priya", route: "setup" }, phone: { who: "rakesh", lock: { key: "l0", who: "rakesh", push: null } },
      figures: [{ label: "Destroying one packet costs", value: -D.PLAN.writeOff.perUnit, decimals: true, tone: "red" }],
      beats: [
        { text: `Priya opens ${WS.domain} and signs in with her Munchly Google account`, who: "priya", focus: "desk", time: "16:20", ui: "in1", desk: { signin: "priya" }, hint: "Tap Continue, then Priya's account" },
        { text: "She checks the column mapping, the floors, the territory guard and the return window, and confirms", who: "priya", focus: "desk", time: "16:41", done: s => s.setup.confirmed, run: () => Flow.act("connect"), hint: "Tap Confirm and start watching", phone: { lock: { key: "l0", who: "rakesh", push: INVITE }, signin: "rakesh" } },
        { text: "Rakesh bhai signs in on his phone with his number and a one-time code", who: "rakesh", focus: "phone", time: "16:50", ui: "in2", phone: { signin: "rakesh", lock: null }, hint: "Tap Continue, then Verify and continue" },
        { text: "He lets Smart-Clearance act in his name, inside Munchly's floors", who: "rakesh", focus: "phone", human: true, time: "16:52", done: s => !!s.setup.permission, run: () => Flow.act("permit"), hint: "Tap Allow", phone: { route: "home", lock: null } },
      ] },
    { date: "Friday 2 October", desk: { who: "priya", route: "command" }, phone: { who: "priya", route: "command" },
      figures: [{ label: "At risk, at MRP", value: D.RISK.atRiskMRP, tone: "red" }, { label: "If it is destroyed", value: -D.PLAN.writeOff.total, tone: "red" }],
      beats: [
        { text: "09:00 · the Watcher checks 312 batches; MF-2409-117 fails all three quick-commerce gates", agent: "Watcher", focus: "desk", time: "09:00", done: s => s.hero.phase !== "watching", phone: { lock: { key: "l1", who: "priya", push: null } } },
        { text: "The push lands on Priya's phone", who: "priya", focus: "phone", time: "09:00", ui: "l1", hint: "Tap the notification", phone: { lock: { key: "l1", who: "priya", push: D.PUSH.detect } } },
      ] },
    { date: "Friday 2 October", desk: { who: "priya", route: "route", anchor: "label" }, phone: { who: "rakesh", route: "photo" },
      figures: [{ label: "MRP, confirmed from the pack", value: 30, decimals: true }],
      beats: [
        { text: "Vision asks Rakesh bhai for one label photo before any price is quoted", agent: "Vision", focus: "desk", time: "09:05", done: s => s.hero.photo.status !== "none", phone: { lock: { key: "l2", who: "rakesh", push: null } } },
        { text: "Rakesh bhai opens the push at the godown", who: "rakesh", focus: "phone", time: "09:05", ui: "l2", hint: "Tap the notification", phone: { lock: { key: "l2", who: "rakesh", push: D.PUSH.verify } } },
        { text: "He photographs one carton on shelf B4 and sends it", who: "rakesh", focus: "phone", time: "09:19", done: s => ["reading", "verified"].includes(s.hero.photo.status), run: () => Flow.act("sendPhoto"), hint: "Tap the shutter, then Send photo" },
        { text: "Gemini reads batch, dates and MRP; they match the DMS record", agent: "Vision", focus: "desk", time: "09:20", done: s => s.hero.photo.status === "verified" },
      ] },
    { date: "Friday 2 October", desk: { who: "priya", route: "route", anchor: "channels" }, phone: { who: "priya", route: "route", anchor: "channels" },
      figures: [{ label: "Best channel, a packet after costs", value: KL.price - M.RULES.vanPerUnit, decimals: true, tone: "green" }, { label: "The bin, a packet", value: -D.PLAN.writeOff.perUnit, decimals: true, tone: "red" }],
      beats: [{ text: `The Valuer prices five channels against ${D.BATCHES[0].daysLeft} days left, capacities and the floor`, agent: "Valuer", focus: "desk", time: "09:21", done: s => !["at-risk", "verified"].includes(s.hero.phase) }] },
    { date: "Friday 2 October", desk: { who: "priya", route: "route", anchor: "split" }, phone: { who: "priya", route: "route", anchor: "split" },
      figures: [{ label: "Net recovered", value: D.PLAN.net, tone: "green" }, { label: "Swing against the bin", value: D.PLAN.swing }],
      beats: [
        { text: "The Router fills the best-paying channel to its cap, then the next, and writes why", agent: "Router", focus: "desk", time: "09:22", done: s => !["at-risk", "verified", "valued"].includes(s.hero.phase), phone: { lock: { key: "l4", who: "priya", push: null } } },
        { text: "The plan reaches Priya's phone", who: "priya", focus: "phone", time: "09:23", ui: "l4", hint: "Tap the notification", phone: { lock: { key: "l4", who: "priya", push: D.PUSH.plan } } },
      ] },
    { date: "Friday 2 October", desk: { who: "priya", route: "command" }, phone: { who: "priya", route: "route", anchor: "split" }, amber: true,
      figures: [{ label: "Net recovered", value: D.PLAN.net, tone: "green" }, { label: "Swing", value: D.PLAN.swing }, { label: "GST credit kept", value: D.PLAN.itcRetained }],
      beats: [
        { text: "Priya opens the approval: three numbers and what happens next", who: "priya", focus: "phone", time: "09:40", ui: "sheet", run: () => window.dispatchEvent(new Event("sc3:approve-open")), hint: "Tap Review and approve" },
        { text: "One tap. Nothing was listed, messaged or shipped before it", who: "priya", focus: "phone", human: true, time: "09:40", done: s => !!(s.hero.plan && s.hero.plan.status === "approved"), run: () => Flow.act("approve", "priya"), hint: "Tap Approve" },
      ] },
    { date: "Friday 2 October", desk: { who: "priya", route: "execution" }, phone: { who: "ganesh", route: "offer" },
      figures: [{ label: "ExpireSoon, a packet", value: ES.price, decimals: true }, { label: "after the counter", value: D.COUNTER.price, decimals: true, tone: "green" }],
      beats: [
        { text: `The Lister posts ${ES.units} units on ExpireSoon in Rakesh Traders' name, hidden from buyers in Munchly's territories`, agent: "Lister", focus: "desk", time: "09:41", done: s => !!s.hero.listing, phone: { lock: { key: "l6", who: "ganesh", push: null } } },
        { text: `Outreach pushes the Hindi scheme to ${D.OFFERED} kiranas`, agent: "Outreach", focus: "desk", time: "09:41", done: s => !!s.hero.offer, phone: { lock: { key: "l6", who: "ganesh", push: null } } },
        { text: "Donation books Feeding India for the Mango Drink batch", agent: "Donation", focus: "desk", time: "09:41", done: s => !!s.mango.donation, phone: { lock: { key: "l6", who: "ganesh", push: D.PUSH.offer } } },
        { text: "Ganesh ji opens the offer, in Hindi", who: "ganesh", focus: "phone", time: "09:50", ui: "l6", hint: "Tap the notification", phone: { lock: { key: "l6", who: "ganesh", push: D.PUSH.offer } } },
        { text: `He takes a carton: ${om.n} packets for ${fmt.inr(om.pay)}, which he sells for ${fmt.inr(om.sell)}`, who: "ganesh", focus: "phone", time: "09:52", done: s => ordered(s, "k0"), run: () => Flow.act("order", "k0"), hint: "Tap ऑर्डर करें" },
        { text: `${D.KIRANAS.length - 1} more kiranas order ${KL.units - D.KIRANAS[0].units} packets in about two hours`, agent: "Outreach", focus: "desk", time: "11:41", done: s => s.hero.orders.length === D.KIRANAS.length, run: () => Flow.act("allOrders") },
        { text: `On ExpireSoon, ${D.BUYER.name} in ${D.BUYER.city} bids ₹13 for all ${ES.units}`, who: "agrawal", focus: "phone", time: "11:02", done: s => s.hero.bids.length > 0, run: () => Flow.act("bid", 13), hint: "Tap Bid", phone: { who: "agrawal", route: "listing" } },
        { text: `The Negotiator counters at ₹${D.COUNTER.price.toFixed(2)} with a 24-hour dispatch promise`, agent: "Negotiator", focus: "phone", time: "11:03", done: s => s.hero.bids.some(b => b.status !== "placed"), phone: { who: "agrawal", route: "listing" } },
        { text: `Agrawal ji accepts and pays the ${fmt.inr(D.AWARD.token)} token`, who: "agrawal", focus: "phone", time: "11:09", done: s => !!s.hero.award, run: () => Flow.act("accept"), hint: "Tap Accept", phone: { who: "agrawal", route: "listing" } },
        { text: "Meera at Feeding India confirms Tuesday's pickup", who: "meera", focus: "phone", time: "12:30", done: s => ["confirmed", "collected"].includes(s.mango.donation), run: () => Flow.act("confirmPickup"), hint: "Tap Confirm", phone: { who: "meera", route: "pickups" } },
      ] },
    { date: "Monday 5 October", desk: { who: "anita", route: "paperwork" }, phone: { who: "rakesh", route: "van" },
      figures: [{ label: `Rakesh's invoice to ${D.BUYER.city}`, value: D.INVOICE.total }, { label: "Price support to Rakesh", value: D.SUPPORT.total }, { label: "GST credit kept", value: D.PLAN.itcRetained, tone: "green" }],
      beats: [
        { text: `The balance lands; Rakesh bhai's staff load ${D.BUYER.name}'s truck for ${D.BUYER.city}`, who: "rakesh", focus: "phone", time: "10:15", done: s => s.hero.truck.status === "dispatched", run: () => Flow.act("dispatch"), hint: "Tap Load the buyer's truck", phone: { anchor: "lot" } },
        { text: "Paperwork drafts Rakesh's invoice, checks the e-way bill rule, issues Munchly's price-support credit note and writes the GST memo", agent: "Paperwork", focus: "desk", time: "10:16", done: s => !!s.hero.docs },
        { text: "Anita reviews Munchly's papers: nothing to chase", who: "anita", focus: "desk", time: "10:30", done: s => !!s.hero.reviewed, run: () => Flow.act("review"), hint: "Tap Mark reviewed" },
        { text: `Tuesday: the van takes the scheme orders to ${D.KIRANAS.length} shops`, who: "rakesh", focus: "phone", date: "Tuesday 6 October", time: "07:30", done: s => s.hero.van.status === "done", run: () => Flow.act("vanRound"), hint: "Tap Start the round" },
        { text: `Day 7: the shelf counts come in; one ${D.SHELF.area} shop gets a pick-up on ${D.SHELF.round}`, agent: "Outreach", focus: "phone", date: "Friday 9 October", time: "17:00", done: s => !!s.hero.shelf, phone: { anchor: "shelf" } },
      ] },
    { date: "Friday 30 October", desk: { who: "vikram", route: "report" }, phone: { who: "priya", route: "command" },
      figures: [{ label: "Recovered", value: D.ACTUAL.net, tone: "green" }, { label: "Better than the bin", value: D.ACTUAL.swing }],
      beats: [
        { text: "The return window has closed; Impact posts the ledger and writes the BRSR row, with evidence", agent: "Impact", focus: "desk", time: "18:00", done: s => s.hero.posted, phone: { lock: { key: "l8", who: "priya", push: null } } },
        { text: "Priya's phone: batch closed, nothing destroyed", who: "priya", focus: "phone", time: "18:01", ui: "l8", hint: "Tap the notification", phone: { lock: { key: "l8", who: "priya", push: D.PUSH.closed } } },
      ] },
  ];

  const LockScreen = S.LockScreen;

  /* ---------- a device: the person's app at a route, their sign-in, or their lock screen ---------- */
  function Device({ kind, spec, lockOpen, onLockOpen, onSignedIn, time, date, scale, focus, amber, routeState, setRouteState, width, height }) {
    const s = useStore(); const ref = useRef(null);
    const me = user(spec.who);
    const lock = spec.lock && !lockOpen ? spec.lock : null;
    // scroll to an anchor when the director asks for one
    useEffect(() => { if (!spec.anchor || lock) return; const t = setTimeout(() => { const root = ref.current; if (!root) return; const el = root.querySelector(`[data-anchor="${spec.anchor}"]`); const sc = root.querySelector(".scroll"); if (el && sc) sc.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 64), behavior: "smooth" }); }, 420); return () => clearTimeout(t); }, [spec.anchor, spec.who, routeState && routeState.name, !!lock, s.hero.phase]);
    const app = lock ? <LockScreen who={lock.who} push={lock.push} time={time} date={date} onOpen={onLockOpen} />
      : spec.signin ? <NoticeHost resetKey={"in-" + spec.who}><S.SignIn guided key={spec.signin} prefill={PREFILL[spec.signin]} onSignIn={onSignedIn} /></NoticeHost>
      : <NoticeHost resetKey={spec.who}><S.RoleApp me={me} route={routeState} onGo={r => setRouteState({ name: r.name, params: r.params })} onBack={() => setRouteState({ name: S.HOME[me.role] })} /></NoticeHost>;
    const label = <div className={cx("dev-label", focus && "focus", focus && amber && "amber")}><Avatar person={me} size="sm" /><span><b>{DEVICE[spec.who] || me.short} {kind === "phone" ? "phone" : "laptop"}</b><span>{PLACE[spec.who] || me.org}</span></span></div>;
    if (kind === "phone") return <div className="dev" style={{ width: 414 * scale }}>{label}<div className={cx("dev-ring", focus && "on", amber && "amber")} style={{ width: 414 * scale, height: 868 * scale, borderRadius: 60 * scale }}><div ref={ref} style={{ width: 414, height: 868, transform: `scale(${scale})`, transformOrigin: "top left" }}><PhoneFrame time={time} dark={!!lock}>{app}</PhoneFrame></div></div></div>;
    const url = me.role === "buyer" ? "https://expiresoon.example/l/ES-24117" : `https://${WS.domain}/${spec.signin ? "sign-in" : (routeState && routeState.name) || S.HOME[me.role]}`;
    return <div className="dev" style={{ width: width * scale }}>{label}<div className={cx("dev-ring", focus && "on", amber && "amber")} style={{ width: width * scale, height: height * scale, borderRadius: 14 * scale }}><div ref={ref} style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}><WindowFrame url={url} style={{ width, height }}><AppRoot embedded style={{ position: "absolute", inset: 0 }}>{app}</AppRoot></WindowFrame></div></div></div>;
  }

  /* ---------- narration ---------- */
  function Figures({ figs }) {
    return <div className="figs">{figs.map(f => <div key={f.label} className="fig"><span className="fig-label">{f.label}</span><Money value={f.value} size="m" decimals={f.decimals} roll style={{ color: f.tone === "red" ? "var(--red-text)" : f.tone === "green" ? "var(--primary-text)" : "var(--fg)" }} /></div>)}</div>;
  }
  function Narration({ n, beatIdx, beatsDone, onNext, onBack, last, finale, compact }) {
    const st = D.STAGES[n], cfg = STAGES[n]; const beats = cfg.beats;
    const cur = beats[beatIdx];
    return <aside className={cx("narr", compact && "compact")} aria-label="Narration"><div className="narr-scroll" {...(compact ? {} : { tabIndex: 0, role: "region", "aria-label": "Stage notes" })}>
      <div className="narr-head"><span className="narr-n">{String(n + 1).padStart(2, "0")}</span><div className="stack tight" style={{ gap: 2 }}><h2 className="narr-title">{st.title}</h2><span className="t-footnote subtle">{st.when} · {st.screen}</span></div></div>
      <p className="narr-who">{st.who}</p>
      {!compact && <div className="narr-block"><b>What they see</b><p>{st.sees}</p></div>}
      {!compact && <div className="narr-block"><b>What the agents do</b><p>{st.agents}</p></div>}
      <Figures figs={cfg.figures} />
      <div className="narr-pain"><span className="pain">“{st.pain}”</span><Icon name="arrow-right" size={16} /><span className="relief">{st.relief}</span></div>
      <ol className="beats">{beats.map((b, i) => { const done = i < beatsDone; const now = i === beatIdx && !done; return <li key={i} className={cx("beat", done && "done", now && "now", b.human && "human")}>
        <span className="beat-dot">{done ? <Icon name="check" size={13} stroke={3} /> : now && b.agent ? <span className="beat-aura" /> : null}</span>
        <span className="beat-body"><span className="beat-who">{b.agent ? b.agent + " agent" : (user(b.who).short || "")}{b.time ? " · " + (b.date ? b.date.split(" ")[0] + " " : "") + b.time : ""}</span><span>{b.text}</span>{now && b.hint && <span className="beat-hint"><Icon name="hand" size={13} />{b.hint}, or press <Kbd>→</Kbd></span>}{now && b.agent && <span className="beat-hint"><span className="typing"><i /><i /><i /></span>working</span>}</span>
      </li>; })}</ol></div>
      <div className="narr-ctrl"><Button variant="secondary" icon="chevron-left" onClick={onBack} disabled={n === 0 && beatIdx === 0} aria-label="Back">Back</Button><Button variant={cur && cur.human && beatsDone < beats.length ? "approve" : "primary"} iconRight="arrow-right" block onClick={onNext}>{beatsDone >= beats.length ? (last ? "Finish" : "Next stage · " + D.STAGES[n + 1].title) : cur && cur.agent ? "Skip ahead" : "Next"}</Button></div>
    </aside>;
  }

  /* ---------- the stage bar ---------- */
  function StageBar({ n, done, onJump }) {
    return <nav className="stagebar" aria-label="Stages">{D.STAGES.map((st, i) => <button key={st.id} type="button" className={cx("sbtn", i < n && "done", i === n && "now", st.human && "human")} aria-current={i === n ? "step" : undefined} aria-label={`${st.title}, stage ${i + 1}${i < n ? ", done" : ""}`} onClick={() => onJump(i)}><span className="sb-dot">{i < n ? <Icon name="check" size={12} stroke={3} /> : i + 1}</span><span className="sb-t">{st.title}</span></button>)}</nav>;
  }

  /* ---------- the finale ---------- */
  function Finale({ onRestart, onClose }) {
    const reduce = useReducedMotion();
    const facts = [[fmt.inr(D.PLAN.itcRetained), "GST credit kept"], [fmt.kg(D.PLAN.kg), "out of landfill"], [fmt.inr(D.SUPPORT.total), `to Rakesh instead of a ${fmt.inr(D.CLAIM.total)} claim`], ["0", "cartons destroyed"], ["1", "human decision, at 09:40"]];
    return <motion.div className="finale" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="finale-in">
        <Mark size={64} play={!reduce} />
        <span className="finale-ws"><WorkspaceMark ws={WS} size={22} /><span>{WS.name} · {WS.domain}</span></span>
        <h2 className="finale-title">Every carton gets a second chance</h2>
        <p className="finale-hi hi" lang="hi">हर कार्टन को दूसरा मौका</p>
        <div className="finale-hero"><Money value={D.ACTUAL.net} roll from={0} className="finale-num" style={{ color: "var(--primary-text)" }} /><span className="finale-cap">recovered from one batch of chips, instead of {fmt.inr(-D.PLAN.writeOff.total)} to destroy it</span></div>
        <div className="finale-facts">{facts.map(([v, k], i) => <motion.span key={k} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}><b>{v}</b> {k}</motion.span>)}</div>
        <p className="finale-line">Mango Drink, the same morning: {fmt.num(ML("kirana").units)} packs to Hyderabad kiranas, {ML("staff").units} to the staff sale, {D.MANGO_FB} to Feeding India. Nothing destroyed.</p>
        <div className="row wrap" style={{ gap: 10, justifyContent: "center" }}><Button variant="primary" size="lg" icon="rotate-ccw" onClick={onRestart}>Play it again</Button><Button variant="secondary" size="lg" onClick={onClose}>Stay on the last stage</Button></div>
      </div>
    </motion.div>;
  }

  /* ---------- the director ---------- */
  function useSize(ref) { const [sz, set] = useState({ w: 0, h: 0 }); useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(([e]) => set({ w: e.contentRect.width, h: e.contentRect.height })); ro.observe(el); return () => ro.disconnect(); }, []); return sz; }
  function Director() {
    const s = useStore(); const reduce = useReducedMotion();
    const [n, setN] = useState(() => { const m = /stage=(\d)/.exec(location.hash); return m ? Math.min(8, Math.max(0, +m[1] - 1)) : 0; });
    const [ui, setUi] = useState({}); const [mode, setMode] = useState(() => (window.innerWidth < 768 ? "phone" : "stage")); const [notes, setNotes] = useState(() => window.innerWidth >= 768);
    const [finale, setFinale] = useState(false); const [playing, setPlaying] = useState(false); const [splash, setSplash] = useState(() => { try { return !sessionStorage.getItem("sc3-demo-splash"); } catch (e) { return true; } });
    const [deskRoute, setDeskRoute] = useState(null); const [phoneRoute, setPhoneRoute] = useState(null);
    const canvas = useRef(null); const size = useSize(canvas);
    const real = typeof window !== "undefined" && window.innerWidth < 768;
    const cfg = STAGES[n];
    const beatDone = (b, st) => (b.ui ? !!ui[b.ui] : b.done(st));
    let idx = 0; while (idx < cfg.beats.length && beatDone(cfg.beats[idx], s)) idx++;
    const beat = cfg.beats[Math.min(idx, cfg.beats.length - 1)];
    const deskSpec = Object.assign({}, cfg.desk, beat.desk);
    const phoneSpec = Object.assign({}, cfg.phone, beat.phone);
    const lockKey = phoneSpec.lock && phoneSpec.lock.key;
    // a sign-in in a device completes this stage's sign-in beat for that person, even one tapped ahead of its turn
    const signedIn = useCallback(uid => { const b = cfg.beats.find(x => x.ui && /^in/.test(x.ui) && ((x.desk && x.desk.signin === uid) || (x.phone && x.phone.signin === uid))); if (b) setUi(u => Object.assign({}, u, { [b.ui]: true })); }, [cfg]);

    // enter a stage: put the world where that stage begins and let its agents run
    const enter = useCallback(i => { Flow.Agents.auto = false; Flow.Agents.maxStage = i; Flow.Agents.setLive(true); Flow.fastForward(i); setUi({}); setN(i); setFinale(false); try { history.replaceState(null, "", "#stage=" + (i + 1)); } catch (e) {} }, []);
    useEffect(() => { enter(n); return () => Flow.Agents.setLive(false); }, []);
    // follow the beat: point each device at its screen when the beat changes
    useEffect(() => { setDeskRoute({ name: deskSpec.route }); }, [n, deskSpec.who, deskSpec.route]);
    useEffect(() => { setPhoneRoute({ name: phoneSpec.route }); }, [n, phoneSpec.who, phoneSpec.route, !!(lockKey && ui[lockKey])]);

    const next = useCallback(() => {
      if (finale) return;
      if (idx < cfg.beats.length) { const b = cfg.beats[idx]; if (b.ui) setUi(u => Object.assign({}, u, { [b.ui]: true })); if (b.run) b.run(); else if (b.agent) { const st = Flow.Agents.nextStep(Store.get()); if (st && Flow.Agents.allowed(st.name)) { Flow.Agents.cancel(); Flow.run(st.name, st.arg); } } return; }
      if (n < 8) enter(n + 1); else { setFinale(true); setPlaying(false); }
    }, [idx, n, finale, cfg, enter]);
    const back = useCallback(() => { if (finale) { setFinale(false); return; } enter(idx > 0 ? n : Math.max(0, n - 1)); }, [n, idx, finale, enter]);
    useEffect(() => { const f = e => { if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return; if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); next(); } else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); back(); } else if (/^[1-9]$/.test(e.key)) enter(+e.key - 1); else if (e.key === "p" || e.key === "P") setMode(m => (m === "phone" ? "stage" : "phone")); else if (e.key === "n" || e.key === "N") setNotes(v => !v); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [next, back, enter]);
    // autoplay for a booth: human beats advance on a timer, agent beats run on their own
    useEffect(() => { if (!playing) return; const b = cfg.beats[idx]; if (b && b.agent && !b.run) return; const t = setTimeout(next, b ? 2600 : 2200); return () => clearTimeout(t); }, [playing, idx, n, s.seq, next]);

    const time = beat.time || "09:00";
    const date = beat.date || cfg.date;
    const focus = idx < cfg.beats.length ? beat.focus : null;
    const amber = !!cfg.amber && idx < cfg.beats.length;
    // fit the devices into the canvas
    const W = size.w, H = size.h; const labelH = 50;
    const phoneOnly = mode === "phone";
    const sp = Math.min(0.84, Math.max(0.3, (H - labelH - 8) / 868));
    const winW = 1280; const avail = W - (phoneOnly ? 0 : 414 * sp + 40);
    const sw = Math.min(1, Math.max(0.3, avail / winW)); const winH = Math.max(640, (H - labelH - 8) / sw);
    const phoneFocusSpec = focus === "desk" && phoneOnly ? deskSpec : phoneSpec;

    const deskDev = <Device kind="desk" spec={deskSpec} onSignedIn={signedIn} time={time} date={date} scale={sw} width={winW} height={winH} focus={focus === "desk"} amber={amber} routeState={deskRoute} setRouteState={setDeskRoute} />;
    const phoneDev = spec => <Device kind="phone" spec={spec} lockOpen={!!(spec.lock && ui[spec.lock.key])} onLockOpen={() => spec.lock && setUi(u => Object.assign({}, u, { [spec.lock.key]: true }))} onSignedIn={signedIn} time={time} date={date} scale={phoneOnly ? Math.min(1.08, Math.max(0.3, (H - labelH - 8) / 868)) : sp} focus={focus === "phone" || (phoneOnly && !!focus)} amber={amber} routeState={spec === phoneSpec ? phoneRoute : deskRoute} setRouteState={spec === phoneSpec ? setPhoneRoute : setDeskRoute} />;

    // a real phone: full screen, the person in focus, a slim demo bar on top
    if (real) {
      const spec = focus === "desk" ? deskSpec : phoneSpec; const me = user(spec.who); const lk = spec.lock && !ui[spec.lock.key] ? spec.lock : null;
      return <div className="demo-real">
        <div className="real-bar"><button type="button" className="iconbtn" aria-label="Back" onClick={back}><Icon name="chevron-left" size={22} /></button><button type="button" className="real-stage" onClick={() => setNotes(v => !v)}><span className="narr-n sm">{n + 1}</span><span className="stack tight" style={{ gap: 0 }}><b>{D.STAGES[n].title}</b><span>{(user(spec.who).short || "")} · {beat.text.slice(0, 46)}{beat.text.length > 46 ? "…" : ""}</span></span></button><button type="button" className={cx("iconbtn real-next", beat.human && "amber")} aria-label="Next" onClick={next}><Icon name="arrow-right" size={22} /></button></div>
        <AppRoot embedded className="real-app" style={{ "--safe-top": "calc(env(safe-area-inset-top, 0px) + 60px)" }}>{lk ? <LockScreen who={lk.who} push={lk.push} time={time} date={date} onOpen={() => setUi(u => Object.assign({}, u, { [lk.key]: true }))} /> : spec.signin ? <S.SignIn guided key={spec.signin} prefill={PREFILL[spec.signin]} onSignIn={signedIn} /> : <S.RoleApp me={me} route={spec === deskSpec ? deskRoute : phoneRoute} onGo={r => (spec === deskSpec ? setDeskRoute : setPhoneRoute)({ name: r.name, params: r.params })} onBack={() => (spec === deskSpec ? setDeskRoute : setPhoneRoute)({ name: S.HOME[me.role] })} />}</AppRoot>
        <K.Sheet open={notes && !splash} onClose={() => setNotes(false)} title={`Stage ${n + 1} of 9`} detent="medium"><Narration n={n} beatIdx={Math.min(idx, cfg.beats.length - 1)} beatsDone={idx} onNext={() => { next(); }} onBack={back} last={n === 8} compact /></K.Sheet>
        <AnimatePresence>{finale && <Finale onRestart={() => enter(0)} onClose={() => setFinale(false)} />}</AnimatePresence>
        {splash && <Splash workspace={WS} onDone={() => { setSplash(false); try { sessionStorage.setItem("sc3-demo-splash", "1"); } catch (e) {} }} />}
      </div>;
    }

    return <div className={cx("demo", !notes && "no-notes")}>
      <header className="demo-top">
        <span className="row tight demo-brand"><Mark size={30} /><Wordmark size={17} /><span className="demo-tag">Guided demo</span><span className="demo-ws"><WorkspaceMark ws={WS} size={20} /><span>{WS.name}</span></span></span>
        <StageBar n={n} onJump={enter} />
        <span className="row tight demo-tools">
          <IconButton icon={playing ? "pause" : "play"} label={playing ? "Pause autoplay" : "Autoplay"} onClick={() => setPlaying(p => !p)} />
          <IconButton icon={phoneOnly ? "monitor" : "smartphone"} label={phoneOnly ? "Laptop and phone" : "Phone only"} onClick={() => setMode(m => (m === "phone" ? "stage" : "phone"))} />
          <IconButton icon="presentation" label={notes ? "Hide notes" : "Show notes"} onClick={() => setNotes(v => !v)} />
          <ModeMenuButton />
          <IconButton icon="rotate-ccw" label="Restart" onClick={() => enter(0)} />
        </span>
      </header>
      <div className="demo-body">
        {notes && <Narration n={n} beatIdx={Math.min(idx, cfg.beats.length - 1)} beatsDone={idx} onNext={next} onBack={back} last={n === 8} />}
        <main className="demo-canvas" ref={canvas}>
          {W > 0 && <div className="devices">{phoneOnly ? phoneDev(phoneFocusSpec) : <>{deskDev}{phoneDev(phoneSpec)}</>}</div>}
        </main>
      </div>
      <AnimatePresence>{finale && <Finale onRestart={() => enter(0)} onClose={() => setFinale(false)} />}</AnimatePresence>
      {splash && <Splash workspace={WS} onDone={() => { setSplash(false); try { sessionStorage.setItem("sc3-demo-splash", "1"); } catch (e) {} }} />}
    </div>;
  }

  function Root() { return <ThemeProvider><AppRoot className="demo-root" style={{ position: "fixed", inset: 0 }}><NoticeHost><Director /></NoticeHost></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();

// SC-152's lab: the buttons that call backend-api, as the apps draw them, on one page. Each option (option-*/opt.jsx)
// supplies how a pressed button waits (window.SC152.Action), how a control that saves waits (Toggle), and anything the
// page needs around them (Host). The scenes, the copy and the fake network are the same for every option.
//   ?lat=fast|usual|slow|refused  the answer's speed (fast 150 ms, usual 900 ms, slow 4.5 s, refused after 1.2 s)
//   ?freeze=pending|slow|done|error  every action held in that phase, for the stills
//   ?theme=light|dark
(function () {
  const { useState, useEffect, useRef, createContext, useContext } = React;
  const { Icon, Badge, Card, Segmented, ThemeProvider, AppRoot, NoticeHost } = window.SC3;
  const q = new URLSearchParams(location.search);
  const FREEZE = q.get("freeze") || null;

  // the fake network: one answer per press, at the speed chosen on the page
  const LAT = { fast: 150, usual: 900, slow: 4500, refused: 1200 };
  const REFUSAL = "The plan changed since you opened it. Read it again, then approve.";
  let lat = q.get("lat") || "usual";
  const call = reason => new Promise((ok, no) => setTimeout(() => (lat === "refused" ? no(new Error(reason || REFUSAL)) : ok(true)), LAT[lat]));

  // the timings every option shares: nothing shows for a fast answer, a shown wait stays long enough to read, a long
  // wait says so, a done state holds before the button rests
  const T = { showAfter: 100, minShown: 400, slowAfter: 3000, doneHold: 1200 };
  const Freeze = createContext(FREEZE);
  const useFreeze = () => useContext(Freeze);

  // a scene: one card from one app, with the place it comes from
  function Scene({ app, where, title, children, state }) {
    return <Card className="lab-scene"><div className="lab-where"><span className="lab-app">{app}</span><span>{where}</span></div>
      <div className="lab-head"><h3>{title}</h3>{state}</div>{children}</Card>;
  }
  // a scene's own state badge: what the press changes, once it lands (or at once, in option C)
  function State({ on, rest, done, tone = "amber" }) {
    return <Badge tone={on ? "green" : tone} dot>{on ? done : rest}</Badge>;
  }

  function Lab() {
    const O = window.SC152;
    const [latency, setLatency] = useState(lat);
    const [seed, setSeed] = useState(0);
    useEffect(() => { lat = latency; }, [latency]);
    return <ThemeProvider><AppRoot scroll="window"><NoticeHost><Freeze.Provider value={FREEZE}>
      <div className="lab">
        <header className="lab-bar">
          <div className="lab-title"><b>SC-152 · {O.name}</b><span>Buttons that call the network, in every app</span></div>
          <div className="lab-ctl">
            <span className="lab-lbl" id="lat-l">Answer</span>
            <Segmented label="How fast the answer comes" value={latency} onChange={setLatency} options={[{ id: "fast", label: "Fast" }, { id: "usual", label: "Usual" }, { id: "slow", label: "Slow" }, { id: "refused", label: "Refused" }]} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSeed(n => n + 1)}><Icon name="rotate-ccw" size={16} />Reset</button>
          </div>
        </header>
        <p className="lab-lede">{O.lede}</p>
        <Scenes key={seed} />
        <footer className="lab-foot">Prototype · every company, person and figure is fictional · the figures are the story's (core/money.js) · the network is simulated</footer>
        {O.Host && <O.Host />}
      </div>
    </Freeze.Provider></NoticeHost></AppRoot></ThemeProvider>;
  }

  function Scenes() {
    const O = window.SC152;
    const s = useScenes();
    return <div className="lab-grid">
          <Scene app="Workspace" where="Priya · Route Room · approve sheet" title="Masala Chips · MF-2409-117" state={<State on={s.approve.on} rest="Waiting for your yes" done="Approved" />}>
            <dl className="lab-lines"><div><dt>Kiranas · 588 packets</dt><dd>₹8,624</dd></div><div><dt>ExpireSoon · 772 packs</dt><dd>₹11,580</dd></div><div><dt>Staff sale · 300 packs</dt><dd>₹1,566</dd></div><div className="tot"><dt>Recovered</dt><dd>₹21,770</dd></div></dl>
            <O.Action variant="approve" size="xl" block icon="check" today="loading" label="Approve · ₹21,770" busy="Approving the plan…" done="Plan approved" onApply={s.approve.set} reason={REFUSAL} />
          </Scene>
          <Scene app="Workspace" where="Rakesh Traders · Today" title="Your next steps" state={<State on={s.tally.on && s.sale.on} rest="2 for you" done="All done" />}>
            <div className="lab-step"><div><b>Issue the invoice from Tally</b><span>INV/26-27/0931 · ₹11,510</span></div>
              <O.Action variant="secondary" size="sm" today="loading" okToast="Marked issued from Tally" label="Issue from Tally" busy="Issuing…" done="Issued" onApply={s.tally.set} reason="Tally did not answer. Try again in a minute." /></div>
            <div className="lab-step"><div><b>Record the staff sale</b><span>300 packs at ₹5.22 · Kalamna Market</span></div>
              <O.Action variant="primary" size="sm" today="loading" label="Record the sale" busy="Recording…" done="Recorded" onApply={s.sale.set} reason="The sale was already recorded on another phone." /></div>
          </Scene>
          <Scene app="Workspace" where="Meera · Feeding India · Pickups" title="Mango Drink · 58 packs" state={<State on={s.pickup.on} rest="Van at the gate" done="Collected" />}>
            <p className="lab-copy">Count the packs as they come off the van. Your receipt is issued once you confirm.</p>
            <O.Action variant="primary" block icon="package-check" today="none" okToast="Pickup confirmed · receipt issued" label="Confirm collected" busy="Confirming…" done="Collected · receipt issued" onApply={s.pickup.set} reason="The pickup was cancelled by Lakshmi Agencies." />
          </Scene>
          <Scene app="Console" where="Neha · Munchly Foods · Rules" title="Quick-commerce gates" state={<State on={s.rules.on} rest="Unsaved changes" done="Saved" />}>
            <div className="lab-fields"><label>Blinkit · days left<input className="input" defaultValue="45" inputMode="numeric" /></label><label>Zepto and Instamart · share of life<input className="input" defaultValue="60%" /></label></div>
            <div className="lab-right"><O.Action variant="primary" today="none" refetch okToast="Rules saved" label="Save rules" busy="Saving…" done="Saved" onApply={s.rules.set} reason="Days left must be 7 or more." /></div>
          </Scene>
          <Scene app="Console" where="Neha · Munchly Foods · Agents" title="The Watcher">
            <O.Toggle kind="switch" label="The Watcher runs" initial={true} reason="Pausing needs an admin." />
            <O.Toggle kind="seg" label="When it finds a batch" initial="ask" options={[{ id: "ask", label: "Ask" }, { id: "tell", label: "Act and tell" }, { id: "act", label: "Act" }]} reason="Act needs the client's yes first." />
            <div className="lab-step"><div><b>Daily check · due 09:00</b><span>In 3 h 20 min of journey time · 2 min real</span></div>
              <O.Action variant="outline" size="sm" icon="zap" today="none" refetch okToast="The Watcher's daily check fired" label="Fire now" busy="Firing…" done="Fired" answerFirst onApply={s.fire.set} reason="The Watcher is already running." /></div>
          </Scene>
          <Scene app="Landing page" where="Book a demo" title="See it on your own batches">
            <div className="lab-fields"><label>Work email<input className="input" defaultValue="anjali@brand.example" /></label></div>
            <O.Action variant="primary" size="lg" block today="loading" label="Send request" busy="Sending…" done="Request sent" answerFirst onApply={s.demo.set} reason="Check the email address and send it again." />
          </Scene>
        </div>;
  }

  // each scene's state: what its press changes. Option C sets it at once and takes it back on a refusal
  function useScenes() {
    const make = () => { const [on, set] = useState(false); return { on, set }; };
    return { approve: make(), tally: make(), sale: make(), pickup: make(), rules: make(), fire: make(), demo: make() };
  }

  // a phase machine every option can use: idle → wait (locked, nothing shown yet) → busy → slow → done | error
  function usePhase({ run, reason, onApply, optimistic }) {
    if (!run) run = () => call(reason);
    const freeze = useFreeze();
    const [phase, setPhase] = useState(freeze === "pending" ? "busy" : freeze || "idle");
    const [err, setErr] = useState(freeze === "error" ? reason || REFUSAL : null);
    const timers = useRef([]);
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    useEffect(() => clear, []);
    useEffect(() => { if (freeze && onApply) onApply(freeze === "done" || (optimistic && freeze !== "error")); }, []);
    const later = (f, ms) => timers.current.push(setTimeout(f, ms));
    const go = () => {
      if (freeze || (phase !== "idle" && phase !== "error")) return;
      clear(); setErr(null); setPhase("wait");
      if (optimistic && onApply) onApply(true);
      let shown = 0;
      later(() => { shown = Date.now(); setPhase(p => (p === "wait" ? "busy" : p)); }, T.showAfter);
      later(() => setPhase(p => (p === "busy" ? "slow" : p)), T.slowAfter);
      run().then(() => {
        const hold = shown ? Math.max(0, T.minShown - (Date.now() - shown)) : 0;
        setTimeout(() => { clear(); setPhase("done"); onApply && onApply(true); later(() => setPhase("idle"), T.doneHold); }, hold);
      }, e => {
        const hold = shown ? Math.max(0, T.minShown - (Date.now() - shown)) : 0;
        setTimeout(() => { clear(); setErr(e.message); setPhase("error"); onApply && onApply(false); }, hold);
      });
    };
    return { phase, err, go, freeze, dismiss: () => { setErr(null); setPhase("idle"); } };
  }

  window.SC152 = Object.assign(window.SC152 || {}, { FROZEN: !!FREEZE, T, usePhase, useFreeze, REFUSAL, call });
  window.SC152_LAB = Lab;
})();

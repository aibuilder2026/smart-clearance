// Round 2, option C · The route. The product's mark is an S that runs from the godown dot to the pin; here that S is the
// route a batch takes through the nine stops, laid across the stage in three rows, each stop with its agents. The batch
// rides it as a dot, the road it has travelled drawn in green; at Approve the gate rings amber; at Execute the road forks
// into the three exits the agents work at once, packets streaming along them (ThreeUI's gateway flow, adapted as
// SC-30's option 2 did); at Report the amber pin lands, as the loader's does. 4.6 s, then still; at once under reduced
// motion. A faint dot grid lies behind the whole sign-in. On a phone the route is one line of nine stops over the card.
(function () {
  const K = window.SC3, S = window.SC3_SCREENS, R = window.SC195R2;
  const { cx, Icon } = K;
  const { motion, animate, useReducedMotion } = Motion;
  const { useRef, useEffect, useState } = React;
  const W = 640, H = 470;
  const ROUTE = "M44 70 H520 A70 70 0 0 1 520 210 H120 A70 70 0 0 0 120 350 H596";
  const EXITS = ["outreach", "lister", "negotiator"];
  function Route({ w }) {
    const path = useRef(null), reduce = useReducedMotion(); const [L, setL] = useState(0); const [d, setD] = useState(0);
    useEffect(() => { if (path.current) setL(path.current.getTotalLength()); }, []);
    const stopAt = i => (L * i) / (R.N - 1);
    const at = len => (path.current && L ? path.current.getPointAtLength(Math.max(0, Math.min(L, len))) : { x: 44, y: 70 });
    // the batch rides to the stop it is at (the yes holds it there), at once under reduced motion
    useEffect(() => {
      if (!L) return; const to = w.done ? L : w.k < 0 ? 0 : stopAt(w.k);
      if (reduce) { setD(to); return; }
      const c = animate(d, to, { duration: w.k <= 0 ? 0.3 : 0.38, ease: R.EASE, onUpdate: setD }); return () => c.stop();
    }, [w.k, w.done, L, reduce]);
    const k = w.done ? R.N : w.k, dot = at(d);
    const execAt = at(stopAt(6)), forks = EXITS.map((id, i) => ({ id, x: execAt.x + 70 + i * 140, y: H - 26 }));
    return <div className="r2c-route">
      <svg viewBox={`0 0 ${W} ${H}`} className="r2c-svg" aria-hidden="true">
        <path d={ROUTE} className="r2c-road" />
        <path ref={path} d={ROUTE} className="r2c-done" style={{ strokeDasharray: L || 1, strokeDashoffset: L ? L - d : 1 }} />
        {/* the exits: the road forks at Execute; packets stream along while the agents work them */}
        {k >= 6 && forks.map((f, i) => { const p = `M${execAt.x} ${execAt.y} C${execAt.x} ${execAt.y + 60}, ${f.x} ${f.y - 70}, ${f.x} ${f.y - 18}`;
          return <g key={f.id}>
            <motion.path d={p} className="r2c-fork" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.42, delay: reduce ? 0 : i * 0.06, ease: R.EASE }} />
            {w.playing && w.k === 6 && [0, 1, 2].map(j => <circle key={j} r="3.2" className="r2c-packet"><animateMotion dur="0.75s" begin={`${j * 0.25}s`} repeatCount="2" path={p} /></circle>)}
          </g>; })}
        {R.STOPS.map((s, i) => { const p = at(stopAt(i)), st = i < k ? "done" : i === k && w.playing ? "now" : "later";
          return <g key={s.id} className={cx("r2c-stop", st, s.human && "human")}><circle cx={p.x} cy={p.y} r={s.human ? 10 : 7.5} /></g>; })}
        {/* the batch, riding the road */}
        {L > 0 && !w.done && w.k >= 0 && <circle cx={dot.x} cy={dot.y} r="6" className="r2c-batch" />}
        {/* the pin lands at the end of the road, as the loader's does */}
        {w.done && <g transform={`translate(${at(L).x} ${at(L).y})`}><motion.g initial={reduce ? false : { y: -26, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 22, mass: 1 }}>
          <path d="M0 0 C-7 -9 -12 -14 -12 -21 A12 12 0 0 1 12 -21 C12 -14 7 -9 0 0 Z" className="r2c-pin" /><circle cy="-21" r="4.5" className="r2c-pin-eye" /></motion.g>
          {!reduce && <motion.circle r="10" className="r2c-ping" initial={{ scale: 0.6, opacity: 0.9 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 0.9, ease: "easeOut" }} />}</g>}
      </svg>
      {/* the stops' names and their agents, in HTML so they stay crisp and readable */}
      {L > 0 && R.STOPS.map((s, i) => { if (s.id === "execute") return null; const p = at(stopAt(i)), below = p.y < 140 || s.id === "report", crew = R.crewAt(i);  // Report's below: the pin lands above it
        return <div key={s.id} className={cx("r2c-at", below ? "below" : "above")} style={{ left: (p.x / W) * 100 + "%", top: (p.y / H) * 100 + "%" }}>
          <span className="r2c-name">{s.t}</span>{crew.map(c => <R.Chip key={c.id} c={c} st={w.state(c)} small />)}
        </div>; })}
      {L > 0 && <div className="r2c-at above" style={{ left: (execAt.x / W) * 100 + "%", top: (execAt.y / H) * 100 + "%" }}><span className="r2c-name">Execute</span></div>}
      {L > 0 && k >= 6 && forks.map(f => { const c = R.CREW.find(x => x.id === f.id);
        return <div key={f.id} className="r2c-at exit" style={{ left: (f.x / W) * 100 + "%", top: (f.y / H) * 100 + "%" }}><R.Chip c={c} st={w.state(c)} small /></div>; })}
    </div>;
  }
  // the phone's route: the nine stops on one line, the stop the batch is at named over it
  function Line({ w }) {
    const k = w.done ? R.N : w.k;
    return <div className="r2c-line"><div className="r2c-track"><i style={{ width: `${Math.max(0, Math.min(1, (w.done ? 8 : Math.max(0, w.k)) / 8)) * 100}%` }} /></div>
      {R.STOPS.map((s, i) => <span key={s.id} className={cx("r2c-tick", i < k ? "done" : i === k && w.playing ? "now" : "later", s.human && "human")} style={{ left: (i / 8) * 100 + "%" }} />)}
    </div>;
  }
  function Grid() { return <div className="r2c-grid" />; }
  function Stage() {
    const w = R.useWalk();
    return <div className="si-stage r2-stage"><R.Head><R.Replay w={w} /></R.Head><R.SrStops /><div className="r2c-area"><Route w={w} /><R.Caption w={w} className="r2c-cap" /></div><R.Ground><Grid /></R.Ground></div>;
  }
  const BandLine = () => { const w = R.useWalk(); return <><R.BandHead /><Line w={w} /><R.Caption w={w} className="band" /></>; };
  S.HeroStage = Stage;
  const Orig = S.Live.SignInLive;
  S.Live.SignInLive = props => <><Orig {...props} /><R.Band><BandLine /></R.Band></>;
})();

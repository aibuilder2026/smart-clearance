// Round 2, option B · Agents at work. The stage is a deck of live agent runs, in depth: as a batch walks the nine stops,
// each stop's run arrives at the front of the deck (its agent's tile, what it did, the call it made), and the runs
// before it recede up and back into the blur. At Approve the person's run is amber; at Execute three runs arrive at
// once, fanned. Behind the whole sign-in, faint runs hang out of focus, so the page reads as the platform at work. The
// deck settles on Impact's run (4.6 s) and holds; at once under reduced motion. On a phone the deck is a band over the
// card, its front run and two behind.
(function () {
  const K = window.SC3, S = window.SC3_SCREENS, R = window.SC195R2;
  const { cx, Icon, Aura } = K;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  // the deck's spring (stiffness 300, damping 30, mass 1), for the Svelte build's SPRINGS
  const SPRING = { type: "spring", stiffness: 300, damping: 30, mass: 1 };
  // one run: the agent's tile (wearing the aura while it works), its name and stop, what it did and the call it made
  function Run({ c, now, compact }) {
    const s = R.STOPS[c.stop];
    return <div className={cx("r2b-run", c.human && "human", compact && "compact")}>
      <Aura on={now} as="span" className="r2b-tile"><Icon name={c.icon} size={compact ? 16 : 20} stroke={2} /></Aura>
      <div className="r2b-body">
        <div className="r2b-top"><b>{c.name}</b><span className="r2b-stop">{s.t} · {c.stop + 1} of 9</span>{now && <span className="r2b-now">{c.human ? "your yes" : "working"}</span>}</div>
        <p>{c.did}</p>
        {!compact && <code>{c.call}</code>}
      </div>
    </div>;
  }
  // the deck: the runs so far, the newest at the front; the execute three side by side
  function Deck({ w, compact }) {
    const reduce = useReducedMotion();
    const shown = R.CREW.filter(c => c.stop <= (w.done ? R.N : w.k));
    const groups = []; shown.forEach(c => { const g = groups.find(x => x.stop === c.stop); g ? g.crew.push(c) : groups.push({ stop: c.stop, crew: [c] }); });
    const depth = groups.length;
    return <div className={cx("r2b-deck", compact && "compact")}>
      <AnimatePresence initial={false}>
        {groups.map((g, gi) => {
          const d = depth - 1 - gi; if (d > (compact ? 2 : 5)) return null;
          return g.crew.map((c, ci) => {
            const fan = g.crew.length > 1 ? (ci - (g.crew.length - 1) / 2) : 0;
            const target = { y: -d * (compact ? 26 : 50), x: fan * (compact ? 14 : 22) * (d === 0 ? 1 : 0.4), rotate: fan * (d === 0 ? 2.2 : 1), scale: 1 - d * 0.055, opacity: d > (compact ? 2 : 4) ? 0 : 1 - d * 0.14, filter: `blur(${(d * (compact ? 1.2 : 1.5)).toFixed(1)}px)` };
            return <motion.div key={c.id} className="r2b-slot" style={{ zIndex: 20 - d * 3 + ci }} initial={reduce ? false : { y: 70, opacity: 0, scale: 1.04, filter: "blur(0px)" }} animate={target} exit={{ opacity: 0 }} transition={reduce ? { duration: 0 } : SPRING}>
              <Run c={c} now={w.playing && c.stop === w.k} compact={compact} />
            </motion.div>;
          });
        })}
      </AnimatePresence>
    </div>;
  }
  // behind the whole sign-in: faint runs, out of focus, drifting into place once
  function Haze() {
    const reduce = useReducedMotion(); const rnd = R.seeded(1951);
    const ghosts = R.CREW.map((c, i) => ({ c, x: 4 + rnd() * 88, y: 4 + rnd() * 86, s: 0.7 + rnd() * 0.5, b: 3.5 + rnd() * 4, o: 0.34 + rnd() * 0.22 }));
    return <div className="r2b-haze">
      {ghosts.map((g, i) => <motion.div key={g.c.id} className="r2b-ghost" style={{ left: g.x + "%", top: g.y + "%", filter: `blur(${g.b.toFixed(1)}px)` }} initial={reduce ? false : { opacity: 0, y: 24, scale: g.s * 0.96 }} animate={{ opacity: g.o, y: 0, scale: g.s }} transition={{ duration: reduce ? 0 : 2.4, delay: reduce ? 0 : i * 0.08, ease: R.EASE }}><Run c={g.c} compact /></motion.div>)}
    </div>;
  }
  function Stage() {
    const w = R.useWalk();
    return <div className="si-stage r2-stage">
      <R.Head><R.Replay w={w} /></R.Head>
      <R.SrStops />
      <div className="r2b-area"><Deck w={w} /><R.Caption w={w} className="r2b-cap" /></div>
      <R.Ground><Haze /></R.Ground>
    </div>;
  }
  const BandDeck = () => { const w = R.useWalk(); return <><R.BandHead /><Deck w={w} compact /><R.Caption w={w} className="band" /></>; };
  S.HeroStage = Stage;
  const Orig = S.Live.SignInLive;
  S.Live.SignInLive = props => <><Orig {...props} /><R.Band><BandDeck /></R.Band></>;
})();

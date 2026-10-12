// SC-196 option C · Around the card. In portrait the agents leave the band and surround the sign-in: the field fills
// the whole screen behind the card (as on a desktop), and the eleven stand on a loop round the card's edges, the batch's
// handoffs drawing round it and under the card's glass. A slim pill at the top says who is at work, with the nine stops
// as dots and Pause. The card sits highest of the three; on a phone the loop shows mostly above and below it, on a
// tablet down both sides too.
(function () {
  const K = window.SC3, P = window.SC196;
  const { cx, Icon, Mark, useApp } = K;
  const { useRef, useMemo, useState, useEffect, Fragment } = React;
  function around(w, h, tab) {
    const rx = w / 2 - (tab ? 40 : 24), ry = h * (tab ? 0.4 : 0.42), cxp = w / 2, cyp = h * 0.55;
    return P.AG_CREW.map((c, i) => { const a = (-90 + (i * 360) / P.AG_CREW.length) * Math.PI / 180, ox = Math.cos(a), oy = Math.sin(a); return { c, x: cxp + rx * ox, y: cyp + ry * oy, ox, oy }; });
  }
  function Around() {
    const app = useApp(), tab = app.bp === "tablet", w = P.useAgentWalk(), pill = useRef(null);
    const [host, setHost] = useState(null);
    useEffect(() => { const el = pill.current && pill.current.parentElement; if (!el) return; const f = () => setHost({ w: el.clientWidth, h: el.clientHeight }); f(); const o = new ResizeObserver(f); o.observe(el); return () => o.disconnect(); }, []);
    const stars = useMemo(() => (host ? around(host.w, host.h, tab) : []), [host && host.w, host && host.h, tab]);
    const now = w.held ? [w.held] : w.playing ? P.agAt(w.k) : [];
    const k = w.held ? w.held.stop : w.done ? P.AG_N : w.k;
    return <Fragment>
      <P.AgentField w={w} stars={stars} local height={host && host.h} />
      <div className="pc-layer" style={host ? { height: host.h } : undefined}>{host && <P.Tiles w={w} stars={stars} size={tab ? 34 : 28} />}</div>
      <div ref={pill} className="sv-pill">
        <div className="pc-row"><Mark size={22} still /><b>Ten agents. <span>One yes.</span></b><P.AgentPlay w={w} compact /></div>
        <div className="pc-now" aria-hidden="true">
          {now.length ? now.map(c => <span key={c.id} className={cx("pc-who", c.human && "human")}><i><Icon name={c.icon} size={12} stroke={2.2} /></i>{c.name}</span>) : <span className="pc-who rest">{w.k < 0 ? "A batch the gates will refuse" : "Sold, not binned"}</span>}
          <span className="pc-did">{w.held ? w.held.did : w.playing ? (now.length > 1 ? "Work the exits at once" : now[0].did) : w.k < 0 ? "Ten agents and one person take it from here." : "Ten agents worked the batch. One person said yes."}</span>
        </div>
        <div className="pc-rail" aria-hidden="true">{P.AG_STOPS.map((s, i) => <i key={s.id} className={cx(i < k && "done", i === k && "now", s.human && "human")} />)}</div>
        <P.AgentWords w={w} />
      </div>
    </Fragment>;
  }
  const Orig = K.AgentStage;
  K.AgentStage = function AgentStage(props) { const app = useApp(); return (props.band != null ? props.band : app.bp !== "desktop") ? <Around /> : <Orig {...props} />; };
})();

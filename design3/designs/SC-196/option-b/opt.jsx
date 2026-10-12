// SC-196 option B · The relay. In portrait the agents line up as the batch meets them: nine stops across the band, each
// agent's tile on one track, the three exits stacked at Execute where the yes fans out to them and they meet again at
// Paperwork. The handoff draws along the track as the batch moves on. A tablet names each stop over the track and each
// agent under its tile; a phone keeps the tiles and lets the caption under the relay say who is at work. The lowest of
// the three: the card rises.
(function () {
  const K = window.SC3, P = window.SC196;
  const { Mark, useApp } = K;
  const { useRef, useMemo } = React;
  const EXITS = ["outreach", "lister", "negotiator"];
  // the stops along the track; the gap after Execute is wider, so the exits' names fit before Paperwork
  const GAP = [1, 1, 1, 1, 1, 1, 1.9, 1];
  function relay(w, h, tab) {
    const pad = tab ? 34 : 18, unit = (w - 2 * pad) / GAP.reduce((a, b) => a + b, 0), cy = h * (tab ? 0.52 : 0.5), d = tab ? 52 : 36;
    const xs = [pad]; GAP.forEach(g => xs.push(xs[xs.length - 1] + g * unit));
    return P.AG_CREW.map(c => { const e = EXITS.indexOf(c.id); return { c, x: xs[c.stop], y: e < 0 ? cy : cy + (e - 1) * d, ox: 0, oy: 1 }; });
  }
  // a tablet's names: under each tile, the three exits' to their right
  const side = n => (EXITS.includes(n.c.id) ? "right" : "below");
  function Band() {
    const app = useApp(), tab = app.bp === "tablet", w = P.useAgentWalk(), box = useRef(null), size = P.useBox(box, tab);
    const stars = useMemo(() => (size ? relay(size.w, size.h, tab) : []), [size && size.w, size && size.h, tab]);
    const k = w.held ? w.held.stop : w.done ? P.AG_N : w.k;
    return <div className="ag-band pb-band">
      <div className="ag-bandhead"><Mark size={22} still /><b>Ten agents. <span>One yes.</span></b><P.AgentPlay w={w} compact /></div>
      <div ref={box} className="pb-stage">
        <P.AgentField w={w} stars={stars} band={!tab} local />
        {tab && size && <div className="pb-stops" aria-hidden="true">{P.AG_STOPS.map((s, i) => <span key={s.id} className={i < k ? "done" : i === k ? "now" : ""} style={{ left: stars.find(n => n.c.stop === i).x }}>{s.t}</span>)}</div>}
        {size && <P.Tiles w={w} stars={stars} names={tab} side={side} size={tab ? 34 : 28} />}
      </div>
      <P.AgentCaption w={w} className="band pb-cap" />
      <P.AgentWords w={w} />
    </div>;
  }
  const Orig = K.AgentStage;
  K.AgentStage = function AgentStage(props) { const app = useApp(); return (props.band != null ? props.band : app.bp !== "desktop") ? <Band /> : <Orig {...props} />; };
})();

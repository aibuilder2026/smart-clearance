// SC-196 option A · The ring. In portrait the agents leave the desktop's wide orbit for a ring: the eleven round a
// circle from the top, clockwise, every one a tile you can see and press, the field inside it, and the caption in its
// middle. The batch's handoffs draw round the ring, the yes amber, the three exits fanning from it. On a tablet each
// tile carries its name, outward; on a phone the caption names the agent at work. The band keeps its head and Pause.
(function () {
  const K = window.SC3, P = window.SC196;
  const { cx, Mark, useApp } = K;
  const { useRef, useMemo } = React;
  function ring(w, h, tab) {
    const R = Math.min(w, h) / 2 - (tab ? 34 : 20), cxp = w / 2, cyp = h / 2;
    return P.AG_CREW.map((c, i) => { const a = (-90 + (i * 360) / P.AG_CREW.length) * Math.PI / 180, ox = Math.cos(a), oy = Math.sin(a); return { c, x: cxp + R * ox, y: cyp + R * oy, ox, oy }; });
  }
  // a name sits outward from the ring: above at the top, below at the foot, else to its side
  const side = n => (n.oy < -0.86 ? "above" : n.oy > 0.86 ? "below" : n.ox < 0 ? "left" : "right");
  function Band() {
    const app = useApp(), tab = app.bp === "tablet", w = P.useAgentWalk(), box = useRef(null), size = P.useBox(box, tab);
    const stars = useMemo(() => (size ? ring(size.w, size.h, tab) : []), [size && size.w, size && size.h, tab]);
    return <div className="ag-band pa-band">
      <div className="ag-bandhead"><Mark size={22} still /><b>Ten agents. <span>One yes.</span></b><P.AgentPlay w={w} compact /></div>
      <div ref={box} className="pa-stage">
        <P.AgentField w={w} stars={stars} band={!tab} local />
        <div className="pa-centre"><P.AgentCaption w={w} className="pa-cap" /></div>
        {size && <P.Tiles w={w} stars={stars} names={tab} side={side} size={tab ? 36 : 30} />}
      </div>
      <P.AgentWords w={w} />
    </div>;
  }
  const Orig = K.AgentStage;
  K.AgentStage = function AgentStage(props) { const app = useApp(); return (props.band != null ? props.band : app.bp !== "desktop") ? <Band /> : <Orig {...props} />; };
})();

// Round 2, option A · The agent mesh. ThreeUI's constellation field (adapted, as SC-30's option 1 did; MIT, see
// THIRD_PARTY_NOTICES.md) drifts behind the whole sign-in, under the card's glass. Eleven of its nodes are named, the ten
// agents and the person, on an orbit in the stage. As a batch walks the nine stops each named node lights in turn and the
// handoff from the one before draws; at Approve the thread turns amber, and at Execute sparks fan out from the yes to the
// three agents that work the exits at once. The field drifts while the walk plays and comes to rest with it (4.6 s);
// under reduced motion it is drawn at rest, lit. On a phone the mesh is a band over the card.
(function () {
  const K = window.SC3, S = window.SC3_SCREENS, R = window.SC195R2;
  const { cx, Aura } = K;
  const { useRef, useEffect, useState } = React;
  const INK = { light: "13, 28, 21", dark: "214, 255, 232" };
  const LIT = { light: "#167a52", dark: "#3ccb8a" }, AMBER = { light: "#d39a12", dark: "#f7c04a" };

  // where the named nodes sit: on an orbit centred in the stage (the sign-in's first column on desktops; the band's middle
  // on a phone), in the order they work, the execute three side by side
  function orbit(w, h, band) {
    const stageW = band ? w : w - Math.max(460, w / 2.25);
    const cxp = stageW * 0.5, cyp = band ? h * 0.5 : h * 0.53, rx = stageW * (band ? 0.38 : 0.33), ry = band ? h * 0.36 : h * 0.19;
    return R.CREW.map((c, i) => { const a = ((band ? 196 : 200) + i * 29.5) * Math.PI / 180; return { ...c, x: cxp + rx * Math.cos(a), y: cyp + ry * Math.sin(a), ox: Math.cos(a), oy: Math.sin(a) }; });
  }
  // the handoffs: each agent to the next, the yes to all three of the exits, and all three to Paperwork
  function threads(stars) {
    const at = id => stars.find(s => s.id === id), out = [];
    const order = ["data", "watcher", "vision", "valuer", "router", "you"];
    for (let i = 1; i < order.length; i++) out.push([at(order[i - 1]), at(order[i]), i]);
    ["outreach", "lister", "negotiator"].forEach(id => { out.push([at("you"), at(id), 6, true]); out.push([at(id), at("paperwork"), 7]); });
    out.push([at("paperwork"), at("impact"), 8]);
    return out;
  }
  function Mesh({ band, w }) {
    const box = useRef(null), cv = useRef(null), size = R.useSize(box); const dark = R.useDark();
    const field = useRef(null), raf = useRef(0), stepAt = useRef(0), st = useRef({});
    const stars = size ? orbit(size.w, size.h, band) : [];
    st.current = { w, dark, size, stars };
    useEffect(() => { stepAt.current = performance.now(); }, [w.k]);
    // the ambient field, seeded so every visit draws the same: clear of the named nodes' labels
    useEffect(() => {
      if (!size) return; const rnd = R.seeded(195), n = band ? 26 : Math.round(size.w * size.h / 15000), nodes = [];
      while (nodes.length < n) nodes.push({ x: rnd() * size.w, y: rnd() * size.h, vx: (rnd() - 0.5) * 0.28, vy: (rnd() - 0.5) * 0.28, r: 1.1 + rnd() * 1.3 });
      field.current = nodes;
    }, [size && size.w, size && size.h]);
    const draw = () => {
      const s = st.current, c = cv.current; if (!c || !s.size || !field.current) return;
      const { w: W, h: H } = s.size, ctx = R.fitCanvas(c, W, H), mode = s.dark ? "dark" : "light", ink = INK[mode], k = s.w.done ? R.N : s.w.k;
      ctx.clearRect(0, 0, W, H);
      const nodes = field.current, all = nodes.concat(s.stars), link = band ? 70 : 120;
      // the field's links: closer is clearer (ThreeUI's ramp, toned down to the ground)
      ctx.lineWidth = 1;
      for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
        const d = Math.hypot(all[a].x - all[b].x, all[a].y - all[b].y); if (d >= link) continue;
        ctx.strokeStyle = `rgba(${ink}, ${((s.dark ? 0.05 : 0.05) + (1 - d / link) * (s.dark ? 0.16 : 0.14)).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(all[a].x, all[a].y); ctx.lineTo(all[b].x, all[b].y); ctx.stroke();
      }
      ctx.fillStyle = `rgba(${ink}, ${s.dark ? 0.34 : 0.26})`;
      nodes.forEach(n => { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); });
      // the handoffs, as far as the batch has walked; the one being made draws along its length
      if (!s.stars.length) return;
      const p = s.w.playing ? Math.min(1, (performance.now() - stepAt.current) / (s.w.k === 6 ? 700 : 340)) : 1;
      ctx.lineCap = "round";
      threads(s.stars).forEach(([a, b, stop, fan]) => {
        if (stop > k) return; const t = stop === k && s.w.playing ? p : 1;
        ctx.lineWidth = band ? 1.6 : 2.2; ctx.strokeStyle = a.human || b.human ? AMBER[mode] : LIT[mode];
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); ctx.stroke();
        // the sparks: packets running from the yes to the exits while they work
        if (fan && stop === k && s.w.playing) for (let j = 0; j < 3; j++) {
          const u = ((performance.now() - stepAt.current) / 520 + j / 3) % 1;
          ctx.fillStyle = LIT[mode]; ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, band ? 2 : 2.8, 0, Math.PI * 2); ctx.fill();
        }
      });
      // the named nodes: a ring until they work, filled once they have
      s.stars.forEach(n => {
        const state = s.w.state(n), col = n.human ? AMBER[mode] : LIT[mode];
        ctx.beginPath(); ctx.arc(n.x, n.y, band ? 4 : 5.5, 0, Math.PI * 2);
        if (state === "later") { ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(${ink}, ${s.dark ? 0.45 : 0.35})`; ctx.fillStyle = s.dark ? "#0b110e" : "#f2f6f3"; ctx.fill(); ctx.stroke(); }
        else { ctx.fillStyle = col; ctx.fill(); }
      });
    };
    const step = () => {
      const s = st.current, live = s.w.playing && !s.w.reduce;
      if (live && s.size && field.current) field.current.forEach(n => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > s.size.w) n.vx *= -1; if (n.y < 0 || n.y > s.size.h) n.vy *= -1; });
      draw(); raf.current = live ? requestAnimationFrame(step) : 0;
    };
    useEffect(() => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(step); }, [w.k, w.reduce, dark, size && size.w, size && size.h]);
    useEffect(() => () => cancelAnimationFrame(raf.current), []);
    // a chip sits off its node, outward from the orbit's middle
    // (in the band, a chip near an edge turns inward so it stays on screen)
    const place = n => band
      ? { left: n.x, top: n.y, transform: n.x > size.w * 0.62 ? "translate(calc(-100% - 10px), -50%)" : n.x < size.w * 0.38 ? "translate(10px, -50%)" : n.oy < 0 ? "translate(-50%, 10px)" : "translate(-50%, calc(-100% - 10px))" }
      : { left: n.x, top: n.y, transform: Math.abs(n.ox) < 0.35 ? (n.oy < 0 ? "translate(-50%, calc(-100% - 12px))" : "translate(-50%, 12px)") : n.ox < 0 ? "translate(calc(-100% - 12px), -50%)" : "translate(12px, -50%)" };
    const centre = size && !band ? { left: (size.w - Math.max(460, size.w / 2.25)) * 0.5, top: size.h * 0.53 } : null;
    return <div ref={box} className={cx("r2a-mesh", band && "band")}>
      <canvas ref={cv} className="r2a-canvas" />
      {stars.map(n => { const s = w.state(n); const show = !band || s === "now" || (w.done && n.human);
        return show && <span key={n.id} className="r2a-label" style={place(n)}><Aura on={s === "now"} className="r2a-aura"><R.Chip c={n} st={s} small={band} /></Aura></span>; })}
      {centre && <div className="r2a-centre" style={centre}><R.Caption w={w} className="centre" /></div>}
    </div>;
  }
  // the stage on desktops: the head, and the mesh drawn into the ground behind the whole sign-in
  function Stage() {
    const w = R.useWalk();
    return <div className="si-stage r2-stage"><R.Head><R.Replay w={w} /></R.Head><R.SrStops /><R.Ground><Mesh w={w} /></R.Ground></div>;
  }
  const BandMesh = () => { const w = R.useWalk(); return <><R.BandHead /><Mesh band w={w} /><R.Caption w={w} className="band" /></>; };
  S.HeroStage = Stage;
  const Orig = S.Live.SignInLive;
  S.Live.SignInLive = props => <><Orig {...props} /><R.Band><BandMesh /></R.Band></>;
})();

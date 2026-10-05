/* SC-32's three heroes, on sc32-core.jsx. Options 1 and 3 adapt ThreeUI Community work (MIT, Copyright (c) 2026 Meng To;
   THIRD_PARTY_NOTICES.md beside this file): the constellation field's linked nodes (option 1, as in SC-30), and the
   Gallery's cylindrical image ribbon, rebuilt in CSS 3D (option 2). Drawn in design system v3's inks, without the
   effects' glows (the aura and the scanline are the only glows), and stopped within five seconds. */
(function () {
  function boot() {
    const S = window.SC32; if (!S) return;
    const { React, useState, useEffect, useRef, useMemo, animate, cx, Icon, num, inr, F, STAGES, AGENTS, BEATS, NB, beatOf, names, CREW, RESULT,
      usePlate, useDark, seeded, fitCanvas, along, useWalk, useCount, crewState, Replay, SrJourney, Caption, AgentChip, StagePin } = S;

    /* ---------- the plate's geography (journey.webp and journey-night.webp, composed alike) ---------- */
    // As fractions of the plate. The stages' anchors sit on their roofs; the path follows the painted green route from the
    // factory's loading bay through the godown's door into the lane; the sky band is where the agents gather.
    const GEO = window.SC32_GEO;

    // a stage's pin anchor; on phones the pins spread apart so their names fit side by side
    const stageAt = (id, wide) => (wide ? GEO.stages : GEO.stagesNarrow)[id];
    // where a star's name sits: above or below the star, as the geography says for this width
    const labelSide = (s, wide) => GEO.labels[wide ? 'wide' : 'narrow'][s.id] || 'below';
    const labelStyle = (s, side) => ({ left: s.x, top: s.y, transform: side === 'left' ? 'translate(calc(-100% - 10px), -50%)' : side === 'right' ? 'translate(10px, -50%)' : side === 'above' ? 'translate(-50%, calc(-100% - 10px))' : 'translate(-50%, 10px)' });

    /* ---------- option 1: the chain and its constellation ---------- */
    // The whole chain stays in view. Each stage carries a pin; over each, in the sky, the agents who work there gather as
    // named stars: the Watcher's crew over the godown, you over the factory, the sellers over the lane. As the journey
    // plays, packs run the green route, the godown is flagged, and the handoff line draws from star to star across the
    // sky: godown, then you, then the lane, then back to the manufacturer with the paperwork and the impact. At rest the
    // constellation spans the chain.
    function Constellation() {
      const layer = useRef(null), cv = useRef(null); const P = usePlate(layer); const w = useWalk(P.ready); const dark = useDark();
      const money = useCount(w.k >= beatOf('report'), F.recovered, w.reduce);
      const st = useRef({}); st.current = { w, dark, P };
      const raf = useRef(0), t0 = useRef(0), field = useRef(null), pointer = useRef({ x: -1e4, y: -1e4, until: 0 });
      const stars = P.g ? CREW.map((c, i) => { const [x, y] = P.at(GEO.stars[P.wide ? 'wide' : 'narrow'][c.id]); return { ...c, i, x, y }; }) : [];
      // the faint field, seeded, in the sky band only
      useEffect(() => {
        if (!P.g) return; const rnd = seeded(32), n = 0, out = [], g = P.g, [y0, y1] = GEO.sky;
        for (let tries = 0; out.length < n && tries < 4000; tries++) {
          const x = rnd() * g.w, y = (y0 + rnd() * (y1 - y0)) * g.nh * g.s + g.oy;
          if (P.wide && x > g.w * 0.12 && x < g.w * 0.88) continue;
          out.push({ x, y, vx: (rnd() - 0.5) * 0.26, vy: (rnd() - 0.5) * 0.2, r: 1.2 + rnd() * 1.3 });
        }
        field.current = out;
      }, [P.g && P.g.w, P.g && P.g.h]);
      const route = () => GEO.route.map(p => P.at(p));
      const draw = now => {
        const c = cv.current, s = st.current, g = s.P.g; if (!c || !g || !field.current) return;
        const ctx = fitCanvas(c, g), k = s.w.done ? NB : s.w.k, el = now - t0.current;
        ctx.clearRect(0, 0, g.w, g.h);
        const ink = s.dark ? '236, 242, 238' : '13, 28, 21', lit = s.dark ? '#3ccb8a' : '#167a52', amber = s.dark ? '#f7c04a' : '#e8a722', violet = s.dark ? '#8a6ee8' : '#7c5cd6';
        // the field and its links, faint
        const nodes = field.current, link = Math.max(80, g.w * 0.07);
        ctx.lineWidth = 1;
        for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
          const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y); if (d >= link) continue;
          ctx.strokeStyle = `rgba(${ink}, ${((s.dark ? 0.12 : 0.1) + (1 - d / link) * (s.dark ? 0.26 : 0.2)).toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
        }
        ctx.fillStyle = `rgba(${ink}, ${s.dark ? 0.7 : 0.36})`;
        nodes.forEach(n => { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); });
        // the handoff line through the named stars, arcing between stages, as far as the journey has gone; the newest
        // segment draws in over 320 ms
        ctx.lineWidth = 2.25; ctx.lineCap = 'round';
        const reached = stars.filter(t => t.beat < k || (t.beat === k && s.w.playing));
        for (let i = 1; i < reached.length; i++) {
          const a = reached[i - 1], b = reached[i], fresh = b.beat === k && s.w.playing ? Math.min(1, el / 320) : 1;
          const mx = (a.x + b.x) / 2, lift = Math.min(90, Math.abs(b.x - a.x) * 0.22), my = Math.min(a.y, b.y) - lift;
          ctx.strokeStyle = a.human || b.human ? amber : lit;
          ctx.beginPath(); ctx.moveTo(a.x, a.y);
          if (fresh >= 1) ctx.quadraticCurveTo(mx, my, b.x, b.y);
          else { // a partial quadratic: split at `fresh`
            const qx = a.x + (mx - a.x) * fresh, qy = a.y + (my - a.y) * fresh, rx = mx + (b.x - mx) * fresh, ry = my + (b.y - my) * fresh;
            ctx.quadraticCurveTo(qx, qy, qx + (rx - qx) * fresh, qy + (ry - qy) * fresh);
          }
          ctx.stroke();
        }
        // the packs on the route: to the godown while it is made and stocked; from the godown to the lane and off to a
        // buyer elsewhere once it is sold
        const R = route(), mid = GEO.routeGodown;
        const pack = (x, y, color, r = 3.4) => { ctx.fillStyle = color; ctx.strokeStyle = s.dark ? 'rgba(7, 11, 9, 0.9)' : '#ffffff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
        if (k === beatOf('make') || k === beatOf('stock')) {
          const span = (k === beatOf('make') ? el / 1100 : 0.55 + el / 1100);
          for (let i = 0; i < 6; i++) { const t = span - i * 0.09; if (t > 0 && t < 1) { const [x, y] = along(R.slice(0, mid + 1), t); pack(x, y, s.dark ? '#ecf2ee' : '#0d1c15', 3); } }
        }
        if (k === beatOf('sell')) {
          for (let i = 0; i < 8; i++) { const t = el / 650 - i * 0.1; if (t > 0 && t < 1) { const [x, y] = along(R.slice(mid), t); pack(x, y, lit); } }
          const [gx, gy] = P.at(GEO.stages.godown), [bx, by] = P.at(GEO.buyer);
          for (let i = 0; i < 6; i++) { const t = el / 650 - i * 0.12; if (t > 0 && t < 1) { const u = 1 - t; const cxp = (gx + bx) / 2, cyp = Math.min(gy, by) - g.h * 0.18;
            pack(u * u * gx + 2 * u * t * cxp + t * t * bx, u * u * gy + 2 * u * t * cyp + t * t * by, violet); } }
        }
      };
      const step = now => {
        const s = st.current, g = s.P.g, p = pointer.current, el = now - t0.current, live = s.w.playing || now < p.until;
        if (g && field.current && !s.w.reduce) field.current.forEach(n => {
          n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > g.w) n.vx *= -1; const [y0, y1] = GEO.sky; if (n.y < g.oy + y0 * g.nh * g.s || n.y > g.oy + y1 * g.nh * g.s) n.vy *= -1;
          const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < 200) { n.x -= (n.x - p.x) * 0.006; n.y -= (n.y - p.y) * 0.006; }
        });
        draw(now); raf.current = live ? requestAnimationFrame(step) : 0;
      };
      const wake = () => { if (!raf.current) raf.current = requestAnimationFrame(step); };
      useEffect(() => { t0.current = performance.now(); if (w.reduce) { draw(t0.current + 1e4); return; } wake(); }, [w.k, w.reduce, dark, P.g, field.current]);
      useEffect(() => () => cancelAnimationFrame(raf.current), []);
      useEffect(() => {
        const hero = layer.current && layer.current.closest('.hero'); if (!hero || w.reduce) return;
        const move = e => { const r = layer.current.getBoundingClientRect(); pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top, until: performance.now() + 700 }; wake(); };
        const out = () => { pointer.current = { x: -1e4, y: -1e4, until: 0 }; };
        hero.addEventListener('pointermove', move); hero.addEventListener('pointerleave', out);
        return () => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', out); };
      }, [P.g, w.reduce]);
      const risk = w.k >= beatOf('risk') && w.k < beatOf('sell') && !w.done, cleared = w.k >= beatOf('sell') && !w.done, sold = w.k >= beatOf('sell') || w.done;
      const flagAt = P.g && P.at(GEO.flag), buyerAt = P.g && P.at(GEO.buyerChip);
      return <>
        <div className="h32-layer" ref={layer} style={P.style} aria-hidden="true">
          <canvas ref={cv} className="h32-canvas" />
          {P.g && STAGES.map(s => { const [x, y] = P.at(stageAt(s.id, P.wide)); return <StagePin key={s.id} s={s} x={x} y={y} w={w} compact={!P.wide} short={!P.wide} edge={x < 90 ? 'start' : x > P.g.w - 90 ? 'end' : null} />; })}
          {stars.map(s => { const { done, now } = crewState(s, w), show = P.wide || (s.human && (now || w.done));
            return <React.Fragment key={s.id}>
              <span className={cx('h32-star', s.human && 'human', done && 'on', now && 'now')} style={{ left: s.x, top: s.y }} />
              {show && <span className="h32-label" style={labelStyle(s, labelSide(s, P.wide))}><AgentChip c={s} w={w} /></span>}
            </React.Fragment>; })}
          {P.g && (risk || cleared) && <span className={cx('h32-flag', risk ? 'risk' : 'clear')} style={{ left: flagAt[0], top: flagAt[1], translate: '-50% -100%' }}>
            <i />{risk ? <span>{num(F.atRisk)} packs · {F.daysLeft} days left</span> : <span>Cleared · none to the bin</span>}</span>}
          {P.g && sold && P.wide && <span className="h32-flag buyer" style={{ left: buyerAt[0], top: buyerAt[1], translate: '-100% -50%' }}><i /><b>A buyer elsewhere</b><span>· {F.buyer} packs</span></span>}
        </div>
        <SrJourney />
        <Caption w={w} money={money} />
        <div className="h32-ctl"><Replay w={w} /></div>
      </>;
    }

    /* ---------- option 2: the journey ring ---------- */
    // Five chapters of the journey on a ring of curved panels, turning once like the Gallery's cylindrical ribbon: Made,
    // Stocked, At risk, One yes, Sold. Each panel is the plate's own view of that place (the approve plate for the yes), bent
    // round the cylinder in slices. The front chapter carries its title and its agents; the steps under the ring turn it.
    const CHAPTERS = [
      { id: 'make', t: 'Made', at: 'factory', beats: ['make'] },
      { id: 'stock', t: 'Stocked', at: 'godown', beats: ['stock'] },
      { id: 'risk', t: 'At risk', at: 'godown', beats: ['risk', 'route'] },
      { id: 'yes', t: 'One yes', at: 'factory', beats: ['yes'] },
      { id: 'sold', t: 'Sold', at: 'shops', beats: ['sell', 'report'] },
    ];
    const chapterOf = k => k < 0 ? 0 : k >= NB ? CHAPTERS.length - 1 : CHAPTERS.findIndex(c => c.beats.includes(BEATS[k].id));
    function Ring() {
      const box = useRef(null); const [ready, setReady] = useState(false); const w = useWalk(ready); const dark = useDark();
      const money = useCount(w.k >= beatOf('report'), F.recovered, w.reduce);
      const [width, setWidth] = useState(0);
      useEffect(() => {
        const el = box.current; if (!el) return; const ro = new ResizeObserver(() => setWidth(el.clientWidth)); ro.observe(el); setWidth(el.clientWidth);
        const imgs = [...el.closest('.hero').querySelectorAll('.hero-scene img')];
        const shown = imgs.find(i => i.getClientRects().length) || imgs[0];
        if (shown && shown.complete && shown.naturalWidth) setReady(true); else imgs.forEach(i => i.addEventListener('load', () => setReady(true), { once: true }));
        return () => ro.disconnect();
      }, []);
      const ch = chapterOf(w.k);
      // the ring's turn: each chapter 72° on from the last, eased like a sheet settling
      const STEP = 45;
      const [turn, setTurn] = useState(-ch * STEP); const turnNow = useRef(turn);
      useEffect(() => { const to = -ch * STEP; if (w.reduce) { turnNow.current = to; setTurn(to); return; }
        const c = animate(turnNow.current, to, { duration: 0.62, ease: [0.65, 0, 0.35, 1], onUpdate: v => { turnNow.current = v; setTurn(v); } }); return () => c.stop(); }, [ch, w.reduce]);
      const phone = width > 0 && width < 600;
      const W = phone ? Math.min(290, width * 0.74) : Math.min(540, width * 0.38), H = W * 0.72, R = W / 0.7, SL = phone ? 10 : 14;
      const img = id => GEO.ring[id].plate === 'approve' ? (dark ? GEO.approveNight : GEO.approveDay) : (dark ? GEO.night : GEO.day);
      const cur = CHAPTERS[ch];
      const crew = CREW.filter(c => cur.beats.includes(BEATS[c.beat].id));
      const pick = i => { if (w.reduce) return; const b = beatOf(CHAPTERS[i].beats[CHAPTERS[i].beats.length - 1]); w.go(b); };
      return <>
        <div className="h32-ring-stage" ref={box} aria-hidden="true">
          <div className="h32-ring" style={{ '--r': R + 'px', width: W, height: H, transform: `translateZ(${-R}px) rotateY(${turn}deg)` }}>
            {CHAPTERS.map((c, i) => { const crop = GEO.ring[c.id];
              return Array.from({ length: SL }, (_, j) => { const a = i * STEP + ((j + 0.5) / SL - 0.5) * (W / R) * (180 / Math.PI), sw = W / SL + 0.6;
                return <span key={c.id + j} className={cx('h32-slice', i === ch && 'front')} style={{
                  width: sw, height: H, transform: `rotateY(${a}deg) translateZ(${R}px)`,
                  backgroundImage: `url("${img(c.id)}")`, backgroundSize: `${W / crop.w}px auto`,
                  backgroundPosition: `${-(crop.x * W / crop.w) - j * (W / SL)}px ${-(crop.y * W / crop.w * crop.ar)}px` }} />; }); })}
          </div>
          <div className="h32-ring-front" style={{ width: W, height: H }}>
            <span className="h32-chapter"><b>{cur.t}</b>{cur.id === 'risk' && <span className="h32-flag risk inline"><i /><span>{num(F.atRisk)} packs · {F.daysLeft} days left</span></span>}
              {cur.id === 'sold' && <span className="h32-flag clear inline"><i /><span>Cleared · none to the bin</span></span>}</span>
            <span className="h32-ring-crew">{crew.map(c => <AgentChip key={c.id} c={c} w={w} compact={phone} />)}</span>
          </div>
        </div>
        <SrJourney />
        <ol className="h32-steps" aria-label="The journey's chapters">
          {CHAPTERS.map((c, i) => <li key={c.id}><button type="button" className={cx(i === ch && 'on', i < ch && 'past')} aria-current={i === ch ? 'step' : undefined} onClick={() => pick(i)} disabled={w.reduce}>
            <i><Icon name={STAGES.find(s => s.id === c.at).icon} size={14} stroke={2} /></i><span>{c.t}</span></button></li>)}
        </ol>
        <Caption w={w} money={money} className="h32-ring-caption" />
        <div className="h32-ctl"><Replay w={w} /></div>
      </>;
    }

    /* ---------- option 3: follow the batch ---------- */
    // A camera follows the batch down the chain: in at the factory, along the route to the godown, out to the lane, then
    // back to take in the whole chain. The crew rides a small ring round the batch, the one at work at its front; as each
    // agent works, a star is left in the sky over that place, and the last frame shows the constellation they made.
    function Follow() {
      const layer = useRef(null), cv = useRef(null); const P = usePlate(layer); const w = useWalk(P.ready); const dark = useDark();
      const money = useCount(w.k >= beatOf('report'), F.recovered, w.reduce);
      // the camera: where it looks (a plate point) and how near, per beat; the overview at rest
      const shot = k => { if (k < 0) return GEO.camera.make; if (k >= NB) return GEO.camera.rest; return GEO.camera[BEATS[k].id] || GEO.camera.rest; };
      const [cam, setCam] = useState(shot(w.k)); const camNow = useRef(cam);
      useEffect(() => { const to = shot(w.k); if (w.reduce) { camNow.current = to; setCam(to); return; }
        const from = camNow.current;
        const c = animate(0, 1, { duration: w.k < 0 ? 0.01 : 0.6, ease: [0.65, 0, 0.35, 1], onUpdate: u => { const v = { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u, z: from.z + (to.z - from.z) * u }; camNow.current = v; setCam(v); } });
        return () => c.stop(); }, [w.k, w.reduce]);
      // the camera as a transform of the plate and the layer together, about the plate's own box
      useEffect(() => {
        const hero = layer.current && layer.current.closest('.hero'); if (!hero || !P.g) return; const g = P.g;
        const [fx, fy] = P.at([cam.x, cam.y]);
        const tx = g.w / 2 - fx * cam.z, ty = g.h * 0.7 - fy * cam.z;
        const clampX = Math.min(0, Math.max(g.w - g.w * cam.z, tx)), clampY = Math.min(0, Math.max(g.h - g.h * cam.z, ty));
        hero.style.setProperty('--cam', `translate(${clampX.toFixed(1)}px, ${clampY.toFixed(1)}px) scale(${cam.z.toFixed(4)})`);
        hero.style.setProperty('--z', cam.z.toFixed(4));
      }, [cam, P.g]);
      // the batch's marker: at its place on the chain, between places while the camera travels
      const placeOf = k => k < 0 ? 'factory' : k >= NB ? 'godown' : BEATS[k].at === 'factory' && BEATS[k].id === 'yes' ? 'godown' : BEATS[k].id === 'report' ? 'shops' : BEATS[k].at;
      const at = P.g ? P.at(GEO.batch[placeOf(w.k)]) : [0, 0];
      // the crew's ring round the batch: turns to bring the one at work to the front
      const ringCrew = w.done ? [] : CREW.filter(c => c.beat <= Math.max(0, w.k) + 0);
      const T = 2 * Math.PI / Math.max(1, CREW.length);
      const front = w.k < 0 ? 0 : CREW.findIndex(c => c.beat === w.k);
      const [rot, setRot] = useState(0); const rotNow = useRef(0);
      useEffect(() => { const to = (front < 0 ? CREW.length - 1 : front) * T; if (w.reduce) { rotNow.current = to; setRot(to); return; }
        const c = animate(rotNow.current, to, { duration: 0.42, ease: [0.45, 0, 0.4, 1], onUpdate: v => { rotNow.current = v; setRot(v); } }); return () => c.stop(); }, [front, w.reduce]);
      const rx = P.wide ? 168 : 100, ry = P.wide ? 50 : 34;
      const stars = P.g ? CREW.map((c, i) => { const [x, y] = P.at(GEO.stars[P.wide ? 'wide' : 'narrow'][c.id]); return { ...c, i, x, y }; }) : [];
      // the stars left in the sky, and the line through them, drawn on the canvas
      useEffect(() => {
        const c = cv.current; if (!c || !P.g) return; const ctx = fitCanvas(c, P.g), k = w.done ? NB : w.k;
        ctx.clearRect(0, 0, P.g.w, P.g.h);
        const lit = dark ? '#3ccb8a' : '#167a52', amber = dark ? '#f7c04a' : '#e8a722';
        if (cam.z > 1.01) return;
        const reached = stars.filter(t => t.beat < k || (t.beat === k && w.playing));
        ctx.lineWidth = 2.25; ctx.lineCap = 'round';
        for (let i = 1; i < reached.length; i++) { const a = reached[i - 1], b = reached[i], mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - Math.min(90, Math.abs(b.x - a.x) * 0.22);
          ctx.strokeStyle = a.human || b.human ? amber : lit; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke(); }
      }, [w.k, w.done, dark, P.g, cam.z > 1.01]);
      return <>
        <div className="h32-layer h32-cam" ref={layer} style={P.style} aria-hidden="true"><div className="h32-cam-inner">
          <canvas ref={cv} className="h32-canvas" />
          {P.g && STAGES.filter(s => cam.z <= 1.01 || (w.beat && w.beat.at === s.id)).map(s => { const [x, y] = P.at(stageAt(s.id, P.wide)); return <StagePin key={s.id} s={s} x={x} y={y} w={w} compact={!P.wide || cam.z > 1.2} short={!P.wide} edge={!P.wide && x < 90 ? 'start' : !P.wide && x > P.g.w - 90 ? 'end' : null} />; })}
          {cam.z <= 1.01 && stars.map(s => { const { done, now } = crewState(s, w), show = (w.done && P.wide) || (w.done && s.human);
            return (done || now) && <React.Fragment key={s.id}>
              <span className={cx('h32-star', s.human && 'human', done && 'on', now && 'now')} style={{ left: s.x, top: s.y }} />
              {show && <span className="h32-label" style={labelStyle(s, labelSide(s, P.wide))}><AgentChip c={s} w={w} /></span>}
            </React.Fragment>; })}
          {P.g && !w.done && <span className="h32-batch" style={{ transform: `translate(${at[0]}px, ${at[1]}px) scale(${(1 / cam.z).toFixed(4)})` }}>
            <span className="h32-batch-card"><i><Icon name="package" size={14} stroke={2} /></i><b>{w.k >= beatOf('risk') && w.k < beatOf('sell') ? `${num(F.atRisk)} at risk` : w.k >= beatOf('sell') ? `${F.kiranas} + ${F.buyer} sold` : `${num(F.packs)} packs`}</b></span>
            {ringCrew.map(c => { const j = CREW.indexOf(c), a = j * T - rot, d = Math.cos(a), { done, now } = crewState(c, w);
              return <span key={c.id} className="h32-ride" style={{ transform: `translate(${(rx * Math.sin(a)).toFixed(1)}px, ${(ry * d).toFixed(1)}px) translate(-50%, -50%) scale(${(0.82 + 0.18 * (d + 1) / 2) * (now ? 1.12 : 1)})`, zIndex: Math.round((d + 1) * 50) + (now ? 100 : 0), opacity: d < -0.2 ? 0.0 : 1 }}>
                <AgentChip c={c} w={w} compact={!P.wide || !now} iconOnly={!P.wide} /></span>; })}
          </span>}
        </div></div>
        <SrJourney />
        <Caption w={w} money={money} />
        <div className="h32-ctl"><Replay w={w} /></div>
      </>;
    }

    const VIEWS = { constellation: Constellation, ring: Ring, follow: Follow };
    document.querySelectorAll('[data-hero32]').forEach(el => { const V = VIEWS[el.getAttribute('data-hero32')]; if (V) ReactDOM.createRoot(el).render(<V />); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

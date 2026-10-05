/* SC-32 round 2's three heroes, on r2-core.jsx. All three follow the batch through the whole business and hand the
   picture and the agent graph to the visitor; they differ in what the visitor does with them.
   1. Take the wheel: the tour plays, then the picture is the visitor's to drag, pinch and open.
   2. In depth: the same, with the picture given depth (WebGL2 and a depth map): it parallaxes as the camera travels,
      tilts under the pointer, and the focus follows the camera.
   3. Your yes: the tour stops at the plan and waits for the visitor's own yes before the batch sells. */
(function () {
  function boot() {
    const S = window.SC32R2; if (!S) return;
    const { React, useState, useEffect, useRef, useMemo, useCallback, motion, AnimatePresence, cx, Icon, num, inr, clamp, EASE, GEO, F, PLACES, AGENTS, AGENT, EDGES, BEATS, NB, beatOf,
      agentState, useStage, wpx, useCamera, shotOf, useGestures, useJourney, useCount, useDark, GraphCanvas, Pin, Node, Batch, Panel, Caption, SrJourney, Controls } = S;

    // the picture, by day and by night (the theme's own swap)
    const Plate = ({ onLoad }) => <>
      <img className="when-light" src={GEO.day} width={GEO.nw} height={GEO.nh} draggable="false" onLoad={onLoad} alt="The whole business as a miniature town in the morning: on the left the snack maker's factory and its office, in the middle the distributor's godown full of cartons, on the right a lane of kirana shops; behind them a highway to a buyer's warehouse in the next town, a food bank, and a fenced landfill, empty." />
      <img className="when-dark" src={GEO.night} width={GEO.nw} height={GEO.nh} draggable="false" onLoad={onLoad} alt="The same town at night, its windows lit, the landfill dark." />
    </>;

    /* ---------- option 2's renderer: the picture in depth ---------- */
    // WebGL2. The plate and a depth map (white near, black far). Each pixel is shifted by its depth against the focus's
    // depth, along a tilt that follows the pointer (and, on touch screens, the swipe), so near things move more than far;
    // the focus follows the camera and what is far from it goes soft, through the plate's own mipmaps. Above the stage's
    // anchor on desktops the sky holds still, so the heading keeps its sky. It draws only while something moves.
    const VS = `#version 300 es
in vec2 p; out vec2 v; void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
    const FS = `#version 300 es
precision highp float;
uniform sampler2D uPlate, uDepth; uniform vec2 uRes; uniform vec4 uWorld; uniform vec3 uCam; uniform vec2 uTilt; uniform float uFocus, uBlur, uSky; uniform vec2 uBand; uniform vec3 uDolly; uniform vec3 uSkyCol;
in vec2 v; out vec4 o;
vec2 plate(vec2 px, vec3 c) { return (px - uWorld.xy - c.xy) / (uWorld.zw * c.z); }
void main() {
  vec2 px = vec2(v.x, 1.0 - v.y) * uRes;
  vec2 uv = plate(px, uCam);
  float d = texture(uDepth, uv).r; vec2 q = uv - (uTilt + (uv - uDolly.xy) * uDolly.z) * (d - uFocus);
  d = texture(uDepth, q).r; q = uv - (uTilt + (uv - uDolly.xy) * uDolly.z) * (d - uFocus);
  float soft = uBlur * smoothstep(0.06, 0.42, abs(d - uFocus));
  vec4 c = texture(uPlate, q, soft);
  if (uSky > 0.0) { float k = uSky * (1.0 - smoothstep(uBand.x, uBand.y, px.y / uRes.y)); vec4 h = texture(uPlate, q, 4.5); c = mix(c, mix(h, vec4(uSkyCol, 1.0), 0.62), k); }
  o = vec4(c.rgb, 1.0);
}`;
    // how strongly the picture dollies as the camera nears (at full zoom), and sways as it travels
    const DOLLY = 0.42, SWAY = 0.9;
    // where a plate point shows once the depth renderer has shifted it (the shader's shift, run forward)
    const shifted = (p, d, v) => [p[0] + (v.tilt[0] + (p[0] - v.foc[0]) * v.dolly) * (d - v.focus), p[1] + (v.tilt[1] + (p[1] - v.foc[1]) * v.dolly) * (d - v.focus)];
    function useDepthMap(on) {
      // the depth map's pixels, to place the nodes as the shader shifts the picture (a gentle near-at-the-bottom ramp
      // stands in when the plate has none)
      const [m, setM] = useState(null);
      useEffect(() => {
        if (!on) return;
        const W = 256, H = Math.round(256 * GEO.nh / GEO.nw), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true });
        const done = () => { const d = x.getImageData(0, 0, W, H).data; setM({ canvas: c, at: p => d[(clamp(Math.round(p[1] * (H - 1)), 0, H - 1) * W + clamp(Math.round(p[0] * (W - 1)), 0, W - 1)) * 4] / 255 }); };
        if (GEO.depth) { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { x.drawImage(im, 0, 0, W, H); done(); }; im.src = GEO.depth; }
        else { const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#000'); gr.addColorStop(0.36, '#1a1a1a'); gr.addColorStop(1, '#fff'); x.fillStyle = gr; x.fillRect(0, 0, W, H); done(); }
      }, []);
      return m;
    }
    function DepthPlate(props) {
      const { g: g0, api, dark, reduce: reduce0, map: map0, stageRef, onReady, onFail, view } = props;
      const cv = useRef(null), gl = useRef(null), st = useRef({ tilt: [0, 0], want: [0, 0], focus: 0.5, blur: 0, raf: 0 }), P = useRef(props); P.current = props;
      // set up once: the program, the quad, the depth texture
      useEffect(() => {
        const c = cv.current, ctx = c && c.getContext('webgl2', { antialias: false, premultipliedAlpha: false, alpha: false });
        if (!ctx) { onFail(); return; }
        const sh = (t, s) => { const o = ctx.createShader(t); ctx.shaderSource(o, s); ctx.compileShader(o); return o; };
        const pr = ctx.createProgram(); ctx.attachShader(pr, sh(ctx.VERTEX_SHADER, VS)); ctx.attachShader(pr, sh(ctx.FRAGMENT_SHADER, FS)); ctx.linkProgram(pr);
        if (!ctx.getProgramParameter(pr, ctx.LINK_STATUS)) { onFail(); return; }
        ctx.useProgram(pr);
        const b = ctx.createBuffer(); ctx.bindBuffer(ctx.ARRAY_BUFFER, b); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
        const loc = ctx.getAttribLocation(pr, 'p'); ctx.enableVertexAttribArray(loc); ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
        const U = n => ctx.getUniformLocation(pr, n);
        gl.current = { ctx, U: { plate: U('uPlate'), depth: U('uDepth'), res: U('uRes'), world: U('uWorld'), cam: U('uCam'), tilt: U('uTilt'), focus: U('uFocus'), blur: U('uBlur'), sky: U('uSky'), band: U('uBand'), dolly: U('uDolly'), skyCol: U('uSkyCol') } };
        ctx.uniform1i(gl.current.U.plate, 0); ctx.uniform1i(gl.current.U.depth, 1);
        return () => { const ext = ctx.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); };
      }, []);
      const upload = (unit, src, mip) => {
        const G = gl.current; if (!G) return; const ctx = G.ctx, t = ctx.createTexture();
        ctx.activeTexture(ctx.TEXTURE0 + unit); ctx.bindTexture(ctx.TEXTURE_2D, t);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE); ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, mip ? ctx.LINEAR_MIPMAP_LINEAR : ctx.LINEAR); ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, src); if (mip) ctx.generateMipmap(ctx.TEXTURE_2D);
      };
      // the depth map, once read
      useEffect(() => { if (map0 && gl.current) { upload(1, map0.canvas, false); draw(); } }, [map0]);
      // the plate for the theme
      useEffect(() => {
        let alive = true; const im = new Image(); im.decoding = 'async'; im.crossOrigin = 'anonymous';
        im.onload = () => { if (!alive) return; upload(0, im, true); st.current.ready = true; P.current.onReady(); draw(); kick(); }; im.onerror = () => P.current.onFail(); im.src = dark ? GEO.night : GEO.day;
        return () => { alive = false; };
      }, [dark]);
      const draw = () => {
        const G = gl.current, s = st.current, c = cv.current, { g } = P.current; if (!G || !c || !g || !s.ready) return;
        const ctx = G.ctx, dpr = Math.min(window.devicePixelRatio || 1, g.wide ? 2 : 1.5), W = Math.round(g.W * dpr), H = Math.round(g.H * dpr);
        if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
        ctx.viewport(0, 0, W, H);
        const t = api.t();
        ctx.uniform2f(G.U.res, W, H); ctx.uniform4f(G.U.world, g.ox * dpr, g.oy * dpr, g.w * dpr, g.h * dpr); ctx.uniform3f(G.U.cam, t.tx * dpr, t.ty * dpr, t.z);
        ctx.uniform2f(G.U.tilt, s.tilt[0], s.tilt[1]); ctx.uniform1f(G.U.focus, s.focus); ctx.uniform1f(G.U.blur, s.blur);
        ctx.uniform1f(G.U.sky, g.wide ? clamp((t.z - 1) / 0.28, 0, 1) : 0); ctx.uniform2f(G.U.band, GEO.sky[0], GEO.sky[1]);
        const sk = P.current.dark ? [3, 19, 48] : [236, 231, 228]; ctx.uniform3f(G.U.skyCol, sk[0] / 255, sk[1] / 255, sk[2] / 255);
        // the dolly: about the camera's focus, by how near it has come (none at rest)
        const fc = api.get(), dz = P.current.reduce ? 0 : DOLLY * (1 - 1 / t.z);
        ctx.uniform3f(G.U.dolly, fc.x, fc.y, dz);
        ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
        P.current.view.current = { tilt: s.tilt, focus: s.focus, foc: [fc.x, fc.y], dolly: dz };
      };
      // the loop: eases the tilt toward its aim and the focus toward the camera's, while either is moving
      const loop = () => {
        const s = st.current, t = api.t(), c = api.get(), { map, reduce } = P.current;
        const f = map ? map.at([c.x, c.y]) : 0.6, fb = clamp((t.z - 1) / 0.45, 0, 1) * 2.4;
        const k = reduce ? 1 : 0.14;
        s.tilt = [s.tilt[0] + (s.want[0] - s.tilt[0]) * k, s.tilt[1] + (s.want[1] - s.tilt[1]) * k];
        s.focus += (f - s.focus) * (reduce ? 1 : 0.12); s.blur += (fb - s.blur) * (reduce ? 1 : 0.12);
        // the swipe's sway settles back
        s.want = [s.want[0] * 0.9, s.want[1] * 0.9]; if (s.hover) s.want = s.hover.slice();
        draw(); api.viewChanged();
        const moving = Math.abs(s.want[0] - s.tilt[0]) + Math.abs(s.want[1] - s.tilt[1]) > 1e-5 || Math.abs(f - s.focus) > 1e-3 || Math.abs(fb - s.blur) > 1e-3 || Math.abs(s.want[0]) + Math.abs(s.want[1]) > 1e-5;
        s.raf = moving ? requestAnimationFrame(loop) : 0;
      };
      const kick = () => { if (!st.current.raf) st.current.raf = requestAnimationFrame(loop); };
      // the camera moves: draw, and let the focus follow
      useEffect(() => {
        let last = null;
        return api.listen(() => {
          const c = api.get(), s = st.current;
          if (last && !P.current.reduce) s.want = [clamp(s.want[0] - (c.x - last.x) * SWAY, -0.035, 0.035), clamp(s.want[1] - (c.y - last.y) * SWAY * 0.6, -0.02, 0.02)];
          last = { ...c }; draw(); kick();
        });
      }, [api]);
      useEffect(() => { draw(); kick(); }, [g0, map0]);
      // the pointer tilts the picture (desktops); a swipe sways it (touch screens); never under reduced motion
      useEffect(() => {
        const el = stageRef.current; if (!el || reduce0) return;
        let last = null;
        const mv = e => {
          const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          if (e.pointerType === 'mouse') st.current.hover = [x * 0.03, y * 0.018];
          else if (last) { st.current.want = [clamp(st.current.want[0] + (e.clientX - last[0]) * 0.0006, -0.03, 0.03), clamp(st.current.want[1] + (e.clientY - last[1]) * 0.0004, -0.02, 0.02)]; }
          last = [e.clientX, e.clientY]; kick();
        };
        const lv = () => { st.current.hover = null; st.current.want = [0, 0]; last = null; kick(); };
        const up = () => { last = null; };
        el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv); el.addEventListener('pointerup', up);
        return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); el.removeEventListener('pointerup', up); };
      }, [reduce0]);
      return <canvas ref={cv} className="r2-gl" aria-hidden="true" />;
    }

    /* ---------- the hero ---------- */
    function Hero({ variant }) {
      const stageRef = useRef(null), plateWorld = useRef(null), topWorld = useRef(null), skyRef = useRef(null), view = useRef(null);
      const g = useStage(stageRef), dark = useDark();
      const [ready, setReady] = useState(false), [gl, setGl] = useState(variant === 'depth');
      const holdAt = variant === 'yes' ? beatOf('yes') : null;
      const j = useJourney(ready, holdAt);
      const worlds = useMemo(() => ({ get current() { return [plateWorld.current, topWorld.current].filter(Boolean); } }), []);
      const { api, zoom } = useCamera(g, worlds, gl ? null : skyRef, j.reduce);
      const depth = useDepthMap(variant === 'depth'), map = gl ? depth : null;
      const [follow, setFollow] = useState(true), [sel, setSel] = useState(null), [hov, setHov] = useState(null);
      const money = useCount(j.k >= beatOf('report'), F.recovered, j.reduce);
      useGestures(stageRef, api, () => setFollow(false));
      // the camera follows the journey until the visitor takes it: the whole business first, then in to the factory
      useEffect(() => { if (!g || !follow) return; const id = j.done || j.k < 0 ? 'rest' : BEATS[j.k].id; api.to(shotOf(g, id), j.k < 0 ? 0 : 0.6); }, [j.k, j.done, follow, g && g.wide, g && g.W]);
      const open = s => {
        setFollow(false); setSel(s);
        const place = s.kind === 'place' ? s.id : AGENT[s.id].at, shot = shotOf(g, place);
        api.to(s.kind === 'agent' ? [GEO.posts[s.id][0], GEO.posts[s.id][1] + (g.wide ? 0.06 : 0.04), shot[2]] : shot, 0.7);
      };
      const close = () => setSel(null);
      const whole = () => { setSel(null); api.to(shotOf(g, 'rest'), 0.7); };
      const replay = () => { setSel(null); setFollow(true); j.replay(); };
      const approve = () => { setFollow(true); j.approve(); };
      useEffect(() => { const k = e => { if (e.key === 'Escape' && sel) setSel(null); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [sel]);
      // what the graph lifts: an agent and its handoffs, or a place's team and theirs
      const focus = useMemo(() => {
        const s = hov || sel; if (!s) return null;
        // the agent (or the place's team) and its direct neighbours in the graph, from a fixed list so nothing spreads
        const core = s.kind === 'agent' ? [s.id] : AGENTS.filter(a => a.at === s.id).map(a => a.id), set = new Set(core);
        EDGES.forEach(([a, b]) => { if (core.includes(a)) set.add(b); if (core.includes(b)) set.add(a); });
        return set;
      }, [hov, sel]);
      // the depth renderer's shift, for what sits on the picture
      const project = useCallback(gl && map ? (p, id) => { const v = view.current; if (!v) return api.toStage(p); return api.toStage(shifted(p, map.at(p) + (id ? 0.04 : 0), v)); } : null, [gl, map, api]);
      // nodes ride the same shift in option 2
      useEffect(() => {
        if (!(gl && map)) return; const el = topWorld.current; if (!el || !g) return;
        const items = [...el.querySelectorAll('[data-at]')];
        const place = () => { const v = view.current; if (!v) return; items.forEach(n => { const p = JSON.parse(n.dataset.at), q = shifted(p, map.at(p) + 0.04, v); n.style.translate = `${((q[0] - p[0]) * g.w).toFixed(2)}px ${((q[1] - p[1]) * g.h).toFixed(2)}px`; }); };
        place(); const a = api.listen(place), b = api.listenView(place); return () => { a(); b(); };
      }, [gl, map, g, api]);
      // Nothing on the picture sits under the heading's text or buttons, or half off the stage: what the camera carries
      // there steps out of view, and the graph is clipped round the same boxes.
      const holes = useCallback(() => {
        const st = stageRef.current, hero = st && st.closest('.hero'); if (!st || !g || !g.wide) return [];
        const o = st.getBoundingClientRect();
        return [...hero.querySelectorAll('.hero-h, .hero-sub, .hero-ctas > *')].map(e => { const r = e.getBoundingClientRect(); return [r.left - o.left - 8, r.top - o.top - 8, r.right - o.left + 8, r.bottom - o.top + 8]; });
      }, [g]);
      // the caption, the controls and the panel lie over the picture on desktops: nothing peeks out from under them
      const covers = () => {
        const st = stageRef.current, hero = st && st.closest('.hero'); if (!st || !g || !g.wide) return [];
        const o = st.getBoundingClientRect();
        return [...hero.querySelectorAll('.r2-caption, .r2-ctl > *, .r2-panel')].map(e => { const r = e.getBoundingClientRect(); return [r.left - o.left - 6, r.top - o.top - 6, r.right - o.left + 6, r.bottom - o.top + 6]; });
      };
      useEffect(() => {
        const el = topWorld.current, st = stageRef.current; if (!el || !g) return;
        const check = () => {
          const o = st.getBoundingClientRect(), hs = holes().concat(covers()), near = g.wide && api.t().z > 1.02, haze = GEO.sky[0] * g.H;
          [...el.querySelectorAll('[data-at], .r2-batch')].forEach(n => {
            const b = (n.querySelector('.r2-pin-body, .r2-node, .r2-batch-card') || n).getBoundingClientRect(), x0 = b.left - o.left, y0 = b.top - o.top, x1 = b.right - o.left, y1 = b.bottom - o.top;
            const out = x1 < 4 || x0 > g.W - 4 || y1 < 4 || y0 > g.H - 4 || (b.width > 0 && (x0 < -6 || x1 > g.W + 6));
            const under = hs.some(h => x0 < h[2] && x1 > h[0] && y0 < h[3] && y1 > h[1]);
            // once the camera is nearer, the top of the frame is haze: what it carries there goes too
            const hazed = near && (y0 + y1) / 2 < haze;
            n.classList.toggle('off', out || under || hazed);
          });
        };
        check(); const a = api.listen(check), b = api.listenView(check); return () => { a(); b(); };
      }, [g, api, holes, j.k, j.done, sel, hov]);
      const named = g && g.wide && (j.done || j.k < 0 || j.held);
      const hint = g && (g.wide ? 'Drag to look round · click a place or an agent' : 'Swipe to look round · tap a place');
      const yesAt = g && wpx(g, GEO.posts.you);
      return <>
        <div className={cx('hero-scene r2-stage', gl && 'is-gl', variant === 'yes' && j.held && 'is-held')} ref={stageRef}>
          {gl && g && <DepthPlate g={g} api={api} dark={dark} reduce={j.reduce} map={map} stageRef={stageRef} view={view} onReady={() => setReady(true)} onFail={() => setGl(false)} />}
          <div className="r2-world" ref={plateWorld} style={g ? { left: g.ox, top: g.oy, width: g.w, height: g.h } : { visibility: 'hidden' }}>
            {!gl && <Plate onLoad={() => setReady(true)} />}
          </div>
          {!gl && g && g.wide && <div className="r2-sky" ref={skyRef} aria-hidden="true" />}
          {g && <GraphCanvas g={g} api={api} j={j} dark={dark} focus={focus} project={project} holes={holes} />}
          <div className="r2-world r2-top" ref={topWorld} style={g ? { left: g.ox, top: g.oy, width: g.w, height: g.h } : { visibility: 'hidden' }}>
            {g && PLACES.map(p => <span key={p.id} data-at={JSON.stringify(GEO.places[p.id].pin)} className="r2-shift"><Pin p={p} g={g} j={j} sel={sel} onOpen={open} hover={setHov} /></span>)}
            {g && AGENTS.map(a => <span key={a.id} data-at={JSON.stringify(GEO.posts[a.id])} className="r2-shift"><Node a={a} g={g} j={j} sel={sel} onOpen={open} hover={setHov} named={named && (!focus || focus.has(a.id))} /></span>)}
            {g && <Batch g={g} j={j} />}
            {variant === 'yes' && g && j.held && <span className="r2-at" style={{ left: yesAt[0], top: yesAt[1] }}>
              <button type="button" className="r2-yes" onClick={approve}><i><Icon name="hand" size={16} stroke={2.2} /></i><span><b>Approve the plan</b><span>{inr(F.planNet)} back, instead of {inr(-F.bin)}</span></span></button></span>}
          </div>
        </div>
        <SrJourney j={j} />
        {variant === 'yes' && j.held
          ? <div className="r2-caption human"><span className="r2-caption-text"><span className="n">5 of {NB}</span><b>Your yes.</b><span className="did">The plan: {F.kiranas} packs to {F.shops} kiranas, {F.buyer} to one buyer · {inr(F.planNet)} back, instead of {inr(-F.bin)} to destroy them</span></span></div>
          : <Caption j={j} money={money} hint={j.done && !sel ? hint : null} />}
        <AnimatePresence>{sel && <Panel key="panel" sel={sel} j={j} onOpen={open} onClose={close} money={money} />}</AnimatePresence>
        {g && <Controls j={{ ...j, replay }} api={api} g={g} zoom={zoom} onWhole={whole} />}
      </>;
    }
    document.querySelectorAll('[data-r2]').forEach(el => ReactDOM.createRoot(el).render(<Hero variant={el.getAttribute('data-r2')} />));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

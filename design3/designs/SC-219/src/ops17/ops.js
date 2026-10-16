// SC-228 (SC-219 cut 17): SC-211's board (the 7-minute landing film's), brought into the working demo's record scene,
// as the maintainer asked; Gemini named on Agent Platform, Vertex AI's new name (SC-220).
// SC-211: the platform watches itself. Every service on one board, measured live (the hosting, backend-api, the agents,
// Gemini on Agent Platform, Cloud SQL, Pub/Sub), as Cloud Monitoring keeps them (SC-50, SC-57, SC-74); a model call times out,
// the alert goes to the platform team, the call is retried and recovers, and the board settles. The figures are
// illustrative and say so. renderAt(t) draws scene time t; setCues(cues) returns the sounds.
(function () {
  const W = 1920, H = 1080;
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
  const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
  const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const spring = (x, zeta = 0.6, w = 14) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
  const fade = (u, a, b, fi = 0.3, fo = 0.3) => Math.min(clamp((u - a) / fi), b == null ? 1 : clamp((b - u) / fo));
  const noise = (x, s) => Math.sin(x * 1.7 + s) * 0.5 + Math.sin(x * 3.9 + s * 2.1) * 0.3 + Math.sin(x * 7.3 + s * 0.7) * 0.2;

  const board = document.getElementById('board'), ui = document.getElementById('ui');
  const TILES = [
    ['cloud', 'Workspace & console', 'Firebase Hosting', '4', 'apps serving', 'line', 1.0],
    ['server', 'backend-api', 'Cloud Run', '182 ms', 'p95', 'line', 2.0],
    ['cpu', 'The agents', 'Cloud Run · Google ADK', '41', 'runs this hour', 'bars', 3.0],
    ['sparkles', 'Gemini', 'Agent Platform', '2.1 s', 'p95 a call', 'line', 4.0],
    ['database', 'Cloud SQL', 'PostgreSQL', '0', 'errors', 'flat', 5.0],
    ['git-branch', 'Pub/Sub', 'every event', '0', 'waiting', 'bars', 6.0],
  ].map(([icon, title, sub, big, unit, kind, seed], i) => {
    const el = $(`<div class="tile" style="left:${(i % 3) * 500}px;top:${Math.floor(i / 3) * 360}px">
      <div class="hd"><div class="ic">${IC(icon)}</div><div><b>${title}</b><small>${sub}</small></div><div class="st"><i></i><span>Healthy</span></div></div>
      <div class="big">${big}<span>${unit}</span></div><canvas width="920" height="220"></canvas></div>`);
    board.appendChild(el);
    return { el, kind, seed, st: el.querySelector('.st span'), cv: el.querySelector('canvas').getContext('2d'), big: el.querySelector('.big') };
  });
  const alert = $(`<div class="alert"><div class="k">${IC('bell-ring')}Alert · the agents</div><h3>A model call timed out.</h3>
    <p>Emailed to the platform team at once, with the request's trace.</p><div class="ok">${IC('circle-check')}Retried, recovered in 4 s. Nothing lost.</div></div>`);
  ui.appendChild(alert);
  const ok = alert.querySelector('.ok'), bell = alert.querySelector('.k svg');
  const kick = $('<div class="kick">The platform watches itself</div>'); ui.appendChild(kick);
  const h1 = $('<div class="h1">Measured live. <em>Alerted</em> at once.</div>'); ui.appendChild(h1);
  const calm = $(`<div class="calm">${IC('shield-check')}All systems normal</div>`); ui.appendChild(calm);
  const note = $('<div class="note">Figures illustrative · Cloud Monitoring, Cloud Trace and Cloud Logging</div>'); ui.appendChild(note);

  const bg = document.getElementById('bg').getContext('2d'), fx = document.getElementById('fx').getContext('2d');
  let C = null, EV = [];
  const ev = (t, kind, pan = 0.5) => EV.push({ t: +t.toFixed(3), kind, pan });
  window.setCues = (cues) => {
    const c = Object.assign({ platform: 0.3, watches: 0.8, service: 1.6, measured: 2.0, live: 2.5, failure: 3.6, alerted: 4.2, ask: 5.8, end: 7.6 }, cues);
    c.tiles = TILES.map((_, i) => 0.15 + 0.12 * i);
    c.fail = c.failure - 0.15; c.rec = Math.max(c.fail + 1.5, c.alerted + 0.9); c.calm = Math.max(c.rec + 0.6, c.ask - 0.1);
    C = c; EV = [];
    ev(0.02, 'whoosh_in'); c.tiles.forEach((t, i) => ev(t + 0.1, 'tick', 0.2 + 0.3 * (i % 3)));
    ev(c.measured - 0.05, 'riser'); ev(c.fail, 'alarm', 0.72); ev(c.fail + 0.15, 'whoosh_in', 0.8); ev(c.rec, 'chime', 0.75); ev(c.calm, 'sparkle');
    window.renderAt(0);
    return { events: EV, cues: c };
  };

  function chart(T, t, reveal, warn) {
    const g = T.cv, w = 920, h = 220;
    g.clearRect(0, 0, w, h);
    const n = 60, pts = [];
    for (let i = 0; i < n; i++) {
      const x = i / (n - 1), tt = t * 1.6 + i * 0.22;
      let v = T.kind === 'flat' ? 0.18 + 0.03 * noise(tt, T.seed) : 0.45 + 0.22 * noise(tt, T.seed);
      if (warn > 0 && i > n - 9) v += warn * 0.55 * Math.exp(-Math.pow((i - (n - 4)) / 3, 2));
      pts.push([x * w, h - 18 - v * (h - 40)]);
    }
    const m = Math.max(2, Math.floor(n * reveal));
    const ink = warn > 0.05 ? '247, 192, 74' : '52, 211, 128';
    if (T.kind === 'bars') {
      for (let i = 0; i < m; i += 2) {
        const [x, y] = pts[i];
        g.fillStyle = `rgba(${ink}, ${0.25 + 0.45 * (i / n)})`; g.fillRect(x, y, 22, h - y);
      }
      return;
    }
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `rgba(${ink}, 0.30)`); grad.addColorStop(1, `rgba(${ink}, 0)`);
    g.beginPath(); g.moveTo(pts[0][0], h);
    for (let i = 0; i < m; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineTo(pts[m - 1][0], h); g.closePath(); g.fillStyle = grad; g.fill();
    g.beginPath(); for (let i = 0; i < m; i++) (i ? g.lineTo : g.moveTo).call(g, pts[i][0], pts[i][1]);
    g.strokeStyle = `rgba(${ink}, 0.95)`; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke();
    const [lx, ly] = pts[m - 1];
    g.beginPath(); g.arc(lx, ly, 9, 0, Math.PI * 2); g.fillStyle = `rgba(${ink}, 1)`; g.fill();
    g.beginPath(); g.arc(lx, ly, 22, 0, Math.PI * 2); g.fillStyle = `rgba(${ink}, 0.18)`; g.fill();
  }

  window.renderAt = (t) => {
    const c = C;
    const rise = eo(t / 0.9);
    const failK = fade(t, c.fail, c.rec + 0.3, 0.2, 0.5);
    const shift = sm((t - c.fail) / 0.5) * (1 - sm((t - c.calm + 0.7) / 0.6));   // SC-228: the board holds aside until the calm
    board.style.transform = `translate(${(-330 * shift).toFixed(1)}px, ${(70 * (1 - rise)).toFixed(1)}px) rotateX(${lerp(20, 9, sm(t / 6)).toFixed(2)}deg) rotateY(${lerp(-9, 5, sm(t / 7)).toFixed(2)}deg) scale(${(lerp(0.88, 0.95, sm(t / 7)) - 0.12 * shift).toFixed(4)})`;
    board.style.opacity = clamp(t / 0.4).toFixed(3);
    board.style.filter = `brightness(${(1 - 0.25 * shift).toFixed(3)})`;
    const reveal = sm((t - c.measured + 0.2) / 1.2);
    TILES.forEach((T, i) => {
      const e = spring(t - c.tiles[i], 0.65, 13);
      T.el.style.opacity = clamp((t - c.tiles[i]) / 0.3).toFixed(3);
      T.el.style.transform = `translateY(${(40 * (1 - e)).toFixed(1)}px)`;
      const warn = i === 3 ? failK : 0;
      T.el.classList.toggle('warn', warn > 0.3);
      T.st.textContent = warn > 0.3 ? 'Timed out' : (i === 3 && t > c.rec - 0.1 && t < c.rec + 1.2 ? 'Recovered' : 'Healthy');
      chart(T, t, Math.max(0.04, reveal), warn);
    });
    const ae = spring(t - c.fail - 0.1, 0.7, 12);
    alert.style.opacity = (fade(t, c.fail + 0.1, c.calm + 0.4, 0.2, 0.4)).toFixed(3);
    alert.style.transform = `translateX(${(260 * (1 - ae)).toFixed(1)}px)`;
    bell.style.transform = `rotate(${(t > c.fail && t < c.fail + 1.2 ? 18 * Math.sin((t - c.fail) * 30) * Math.exp(-(t - c.fail) * 2.2) : 0).toFixed(2)}deg)`;
    ok.style.opacity = clamp((t - c.rec) / 0.25).toFixed(3);
    ok.style.transform = `translateY(${(10 * (1 - eo((t - c.rec) / 0.4))).toFixed(1)}px)`;
    const ha = fade(t, 0.2, null, 0.4);
    kick.style.opacity = ha.toFixed(3); h1.style.opacity = ha.toFixed(3);
    calm.style.opacity = clamp((t - c.calm) / 0.3).toFixed(3);
    calm.style.transform = `translateX(-50%) translateY(${(14 * (1 - eo((t - c.calm) / 0.5))).toFixed(1)}px)`;
    note.style.opacity = (0.8 * clamp((t - 0.6) / 0.5)).toFixed(3);

    bg.fillStyle = '#070b09'; bg.fillRect(0, 0, W, H);
    let g = bg.createRadialGradient(W / 2, H * 0.55, 60, W / 2, H * 0.55, 1150);
    g.addColorStop(0, `rgba(${Math.round(lerp(22, 52, failK))}, ${Math.round(lerp(56, 40, failK))}, ${Math.round(lerp(42, 14, failK))}, 0.9)`); g.addColorStop(1, 'rgba(7, 11, 9, 0)');
    bg.fillStyle = g; bg.fillRect(0, 0, W, H);
    // the grid of the room
    bg.strokeStyle = 'rgba(115, 201, 157, 0.05)'; bg.lineWidth = 1;
    for (let x = (t * 12) % 60; x < W; x += 60) { bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, H); bg.stroke(); }
    for (let y = 0; y < H; y += 60) { bg.beginPath(); bg.moveTo(0, y); bg.lineTo(W, y); bg.stroke(); }
    // a scan of light across the board as it is measured
    fx.clearRect(0, 0, W, H);
    const sp = (t - c.measured + 0.1) / 1.3;
    if (sp > 0 && sp < 1) {
      const x = lerp(150, 1800, sp), k = Math.sin(Math.PI * sp);
      const s = fx.createLinearGradient(x - 160, 0, x + 160, 0);
      s.addColorStop(0, 'rgba(120, 240, 175, 0)'); s.addColorStop(0.5, `rgba(140, 255, 200, ${0.22 * k})`); s.addColorStop(1, 'rgba(120, 240, 175, 0)');
      fx.fillStyle = s; fx.fillRect(x - 160, 200, 320, 760);
    }
  };

  document.fonts.ready.then(() => { window.setCues({}); window.pageReady = true; });
})();

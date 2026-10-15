// SC-211: inside the workspace every team sees its own part of the work. The supply chain's laptop, a distributor's
// tablet, a kirana's phone and a food bank's phone rise one by one as the voice names each, the camera travelling to
// each in turn (in focus, the others soft), then drawing back to show all four, each its own part only. The screens
// are the production app as recorded (SC-201). renderAt(t) draws scene time t; setCues(cues) returns the sounds.
(function () {
  const W = 1920, H = 1080, GROUND = 860;
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
  const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
  const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const spring = (x, zeta = 0.6, w = 13) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
  const fade = (u, a, b, fi = 0.3, fo = 0.3) => Math.min(clamp((u - a) / fi), b == null ? 1 : clamp((b - u) / fo));
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  const world = document.getElementById('world'), ui = document.getElementById('ui');
  const TEAMS = [
    { k: 'lap', cls: 'lap', w: 1000, h: 672, x: 640, img: 'lead.webp', icon: 'users', title: 'The supply chain', sub: 'the plan, and the one yes', cue: 'supply' },
    { k: 'tab', cls: 'tab', w: 470, h: 662, x: 1460, img: 'dist.webp', icon: 'warehouse', title: 'The distributors', sub: "the godown's photos, sales and papers", cue: 'distributors' },
    { k: 'ph1', cls: 'ph', w: 300, h: 634, x: 2060, img: 'kirana.webp', icon: 'store', title: 'The kiranas', sub: 'offers in their own language', cue: 'kiranas' },
    { k: 'ph2', cls: 'ph', w: 300, h: 634, x: 2560, img: 'food.webp', icon: 'heart-handshake', title: 'The food banks', sub: 'pickups, with receipts', cue: 'food' },
  ];
  for (const d of TEAMS) {
    d.el = $(`<div class="dev ${d.cls}" style="width:${d.w}px;height:${d.h}px;left:${d.x - d.w / 2}px;top:${GROUND - d.h}px">
      <div class="frame"><div class="screen"><img src="${d.img}"><div class="glare"></div></div></div>${d.cls === 'lap' ? '<div class="deck"></div>' : ''}</div>`);
    world.appendChild(d.el);
    d.glare = d.el.querySelector('.glare');
    d.role = $(`<div class="role"><div class="orb">${IC(d.icon)}</div><div><b>${d.title}</b><span>${d.sub}</span></div></div>`);
    ui.appendChild(d.role);
    d.lock = $(`<div class="lock">${IC('lock')}Its own part only</div>`);
    ui.appendChild(d.lock);
  }
  const kick = $('<div class="kick">One workspace · every team</div>'); ui.appendChild(kick);
  const h1 = $('<div class="h1">Every team sees its own part.</div>'); ui.appendChild(h1);

  const bg = document.getElementById('bg').getContext('2d'), fx = document.getElementById('fx').getContext('2d');
  const R = rng(311);
  const bokeh = Array.from({ length: 30 }, () => ({ x: R() * 3600, y: 140 + R() * 700, r: 14 + R() * 50, a: 0.04 + R() * 0.1, hue: R() < 0.8 ? 'g' : 'a' }));

  let C = null, EV = [], KEYS = [];
  const ev = (t, kind, pan = 0.5) => EV.push({ t: +t.toFixed(3), kind, pan });
  window.setCues = (cues) => {
    const c = Object.assign({ inside: 0.1, part: 1.2, supply: 2.4, distributors: 3.5, kiranas: 4.9, food: 6.2, end: 9.5 }, cues);
    TEAMS.forEach((d, i) => { d.t = i === 0 ? Math.min(0.35, c[d.cue] - 0.35) : c[d.cue] - 0.35; d.tr = c[d.cue] - 0.2; });
    c.back = Math.max(c.food + 0.7, c.end - 2.9);
    C = c; EV = [];
    // the camera: (time, world x at the frame's centre, scale)
    KEYS = [[0, TEAMS[0].x, 0.9], [TEAMS[1].t - 0.25, TEAMS[0].x, 0.9]];
    for (let i = 1; i < 4; i++) KEYS.push([TEAMS[i].t + 0.35, TEAMS[i].x, i === 1 ? 1.0 : 1.08], [i < 3 ? TEAMS[i + 1].t - 0.25 : c.back, TEAMS[i].x, i === 1 ? 1.0 : 1.08]);
    KEYS.push([c.back + 1.1, 1600, 0.6], [c.end + 1, 1600, 0.59]);
    TEAMS.forEach((d, i) => { ev(d.t, 'whoosh_in', 0.5); ev(d.t + 0.35, 'pop', 0.5); ev(d.tr, 'tick', 0.5); });
    ev(c.back, 'whoosh'); ev(c.back + 0.9, 'sparkle');
    window.renderAt(0);
    return { events: EV, cues: c };
  };
  const cam = (t) => {
    let k = KEYS[0];
    for (let i = 0; i < KEYS.length - 1; i++) {
      const [ta, xa, sa] = KEYS[i], [tb, xb, sb] = KEYS[i + 1];
      if (t >= ta && t <= tb) { const e = sm((t - ta) / Math.max(1e-3, tb - ta)); return [lerp(xa, xb, e), lerp(sa, sb, e)]; }
      if (t > tb) k = KEYS[i + 1];
    }
    return [k[1], k[2]];
  };

  window.renderAt = (t) => {
    const c = C;
    const [cx, s] = cam(t);
    const drift = Math.sin(t * 0.5) * 6;
    const ox = W / 2 - cx * s + drift, oy = 560 - 560 * s + (1 - s) * 60;
    world.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${s.toFixed(4)})`;
    const back = sm((t - c.back) / 1.1);
    let near = 0, nd = 1e9;
    TEAMS.forEach((d, i) => { const dd = Math.abs(d.x - cx); if (dd < nd) { nd = dd; near = i; } });
    TEAMS.forEach((d, i) => {
      const e = spring(t - d.t, 0.62, 11);
      const a = clamp((t - d.t) / 0.3);
      const focus = i === near ? 1 : 0;
      const blur = (1 - back) * (focus ? 0 : 3.2) * a;
      d.el.style.opacity = a.toFixed(3);
      d.el.style.transform = `translateY(${(140 * (1 - e)).toFixed(1)}px) rotateY(${(lerp(18, 0, e) + (i - 1.5) * -2 * back).toFixed(2)}deg)`;
      d.el.style.filter = `blur(${blur.toFixed(2)}px) brightness(${(0.72 + 0.28 * Math.max(focus, back)).toFixed(3)})`;
      const gp = (t - d.t - 0.25) / 0.9; d.glare.style.opacity = (gp > 0 && gp < 1 ? Math.sin(Math.PI * gp) : 0).toFixed(3); d.glare.style.transform = `translateX(${lerp(-70, 70, clamp(gp))}%)`;
      // its card under it, and at the end its own part only
      const sx = ox + d.x * s, sy = oy + (GROUND + 34) * s;
      const ra = fade(t, d.tr, null, 0.35) * (back > 0 ? lerp(1, 0.96, back) : (focus ? 1 : 0.55));
      d.role.style.opacity = ra.toFixed(3);
      const rs = lerp(1, 0.78, back);
      d.role.style.transform = `translate(${(sx - d.role.offsetWidth / 2).toFixed(1)}px, ${(sy + 8 * (1 - eo((t - d.tr) / 0.5))).toFixed(1)}px) scale(${rs.toFixed(3)})`;
      const la = fade(t, c.back + 0.5 + 0.12 * i, null, 0.3);
      const ty = oy + (GROUND - d.h - 40) * s;
      d.lock.style.opacity = la.toFixed(3);
      d.lock.style.transform = `translate(${(sx - d.lock.offsetWidth / 2).toFixed(1)}px, ${(ty - 8 * (1 - eo((t - c.back - 0.5 - 0.12 * i) / 0.4))).toFixed(1)}px)`;
    });
    const ha = Math.max(fade(t, 0.2, c.supply - 0.15, 0.4, 0.4), fade(t, c.back + 0.3, null, 0.4));
    kick.style.opacity = ha.toFixed(3); h1.style.opacity = ha.toFixed(3);
    h1.style.filter = `blur(${(5 * (1 - ha)).toFixed(2)}px)`;

    // the light: the stage's glow, a spotlight on the team in focus, bokeh moving with the camera (slower: far away)
    bg.clearRect(0, 0, W, H);
    bg.fillStyle = '#070b09'; bg.fillRect(0, 0, W, H);
    let g = bg.createRadialGradient(W / 2, -160, 40, W / 2, 420, 1200);
    g.addColorStop(0, 'rgba(36, 86, 64, 0.8)'); g.addColorStop(0.5, 'rgba(12, 30, 22, 0.6)'); g.addColorStop(1, 'rgba(7, 11, 9, 0)');
    bg.fillStyle = g; bg.fillRect(0, 0, W, H);
    for (const b of bokeh) {
      const x = ((b.x * s * 0.45 + ox * 0.45) % (W + 300) + W + 300) % (W + 300) - 150, y = b.y;
      const gg = bg.createRadialGradient(x, y, 0, x, y, b.r);
      const col = b.hue === 'g' ? '115, 201, 157' : '247, 192, 74';
      gg.addColorStop(0, `rgba(${col}, ${b.a})`); gg.addColorStop(1, `rgba(${col}, 0)`);
      bg.fillStyle = gg; bg.beginPath(); bg.arc(x, y, b.r, 0, Math.PI * 2); bg.fill();
    }
    g = bg.createLinearGradient(0, oy + GROUND * s - 10, 0, H);
    g.addColorStop(0, 'rgba(52, 211, 128, 0.07)'); g.addColorStop(1, 'rgba(7, 11, 9, 0)');
    bg.fillStyle = g; bg.fillRect(0, oy + GROUND * s - 10, W, H);
    fx.clearRect(0, 0, W, H);
    const d = TEAMS[near];
    const px = ox + d.x * s, py = oy + (GROUND - d.h * 0.55) * s;
    const sp = fx.createRadialGradient(px, py, 0, px, py, 620 * s + 200);
    sp.addColorStop(0, `rgba(120, 230, 170, ${0.10 * (1 - back)})`); sp.addColorStop(1, 'rgba(120, 230, 170, 0)');
    fx.fillStyle = sp; fx.fillRect(0, 0, W, H);
  };

  const imgs = [...document.images];
  Promise.all([document.fonts.ready, ...imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onload = r; i.onerror = r; })))]).then(() => {
    window.setCues({}); window.pageReady = true;
  });
})();

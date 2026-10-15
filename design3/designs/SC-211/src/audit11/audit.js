// SC-211: which agent did what, who said yes, and when. The batch's journey as one track, each step a pin in the order it
// happened: the agents' runs in green, the people's yeses in amber, each with its time. The camera runs along the trail
// as the steps land, lights the yeses, then draws back on the whole journey, which folds into one audit trail, exported
// for the auditor. The steps are the Mango Drink's journey as the production run of 13 Oct recorded it (SC-201), in
// plain words. renderAt(t) draws scene time t; setCues(cues) returns the sounds.
(function () {
  const W = 1920, H = 1080, TY = 540;
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
  const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
  const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const spring = (x, zeta = 0.6, w = 14) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
  const fade = (u, a, b, fi = 0.3, fo = 0.3) => Math.min(clamp((u - a) / fi), b == null ? 1 : clamp((b - u) / fo));
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  const STEPS = [
    ['database', 'Data agent', "Loaded the distributor's stock", 'Day 0 · 06:00'],
    ['eye', 'Watcher', 'Flagged the batch: 1,580 packs at risk', 'Day 0 · 09:00'],
    ['warehouse', 'The distributor', 'Sent one photo of the carton', 'Day 0 · 09:18', 'p'],
    ['scan-line', 'Vision', 'Read the label: batch, dates, MRP', 'Day 0 · 09:20'],
    ['scale', 'Valuer', 'Priced every exit', 'Day 0 · 09:21'],
    ['route', 'Router', 'Split the batch across three exits', 'Day 0 · 09:22'],
    ['user-check', 'Supply chain lead', 'Approved the plan', 'Day 0 · 09:40', 'p'],
    ['send', 'Outreach', 'Offered 52 kiranas, in Hindi', 'Day 0 · 09:41'],
    ['store', 'The kiranas', 'Ordered 1,372 packets', 'Day 1', 'p'],
    ['warehouse', 'The distributor', 'Recorded the staff sale, 18 UPI payments', 'Day 1', 'p'],
    ['heart-handshake', 'The food bank', 'Collected 58 packs, with a receipt', 'Day 1', 'p'],
    ['file-text', 'Paperwork', 'Drafted the credit note and GST memo', 'Day 2'],
    ['user-check', 'Supply chain lead', 'Reviewed and signed off the papers', 'Day 2', 'p'],
    ['leaf', 'Impact', 'Posted the ledger', 'Day 3'],
  ];
  const DX = 280, X0 = 300;
  const world = document.getElementById('world'), ui = document.getElementById('ui');
  const track = $(`<div class="track" style="width:${X0 + DX * (STEPS.length - 1) + 160 - 120}px"></div>`); world.appendChild(track);
  const fill = $('<div class="fill"></div>'); world.appendChild(fill);
  const pins = STEPS.map(([icon, who, what, when, kind], i) => {
    const up = i % 2 === 0;
    const el = $(`<div class="pin ${kind === 'p' ? 'person' : ''}" style="left:${X0 + DX * i}px;top:${TY}px">
      <div class="stem" style="${up ? 'top:-96px;height:70px' : 'top:26px;height:70px'}"></div>
      <div class="card" style="${up ? 'bottom:96px' : 'top:96px'}"><div class="who">${who}</div><div class="what">${what}</div><div class="when">${IC('clock')}${when}</div></div>
      <div class="orb">${IC(icon)}</div></div>`);
    world.appendChild(el);
    return { el, orb: el.querySelector('.orb'), card: el.querySelector('.card'), when: el.querySelector('.when'), stem: el.querySelector('.stem'), up, person: kind === 'p', x: X0 + DX * i };
  });
  const days = [['Day 0', 0], ['Day 1', 8], ['Day 2', 11], ['Day 3', 13]].map(([d, i]) => { const e = $(`<div class="day" style="left:${X0 + DX * i - 20}px">${d}</div>`); world.appendChild(e); return e; });
  const kick = $('<div class="kick">The audit trail · every step, in order</div>'); ui.appendChild(kick);
  const h1 = $('<div class="h1">Which agent did what. <em>Who said yes.</em> When.</div>'); ui.appendChild(h1);
  const doc = $(`<div class="doc"><div class="k">${IC('history')}Audit trail · one batch</div><h2>The whole journey, on the record.</h2>
    <p>Every agent's run and every person's yes, in order, in their name, with its time and its trace.</p>
    <div class="rows">${[STEPS[1], STEPS[3], STEPS[6], STEPS[12]].map((s) => `<div class="r ${s[4] === 'p' ? 'p' : ''}"><span class="d">${IC(s[4] === 'p' ? 'user-check' : 'check')}</span><span class="t">${s[3].replace('Day ', 'D')}</span><span>${s[1]} · ${s[2]}</span></div>`).join('')}</div>
    <div class="foot"><span class="pill">${IC('lock')}Append-only</span><span class="pill">${IC('fingerprint')}Traced end to end</span><span class="btn">${IC('download')}Export CSV</span></div></div>`);
  ui.appendChild(doc);
  const btn = doc.querySelector('.btn');
  const done = $(`<div class="done">${IC('shield-check')}Ready for the auditor</div>`); ui.appendChild(done);
  const cursor = $(`<svg class="cursor" viewBox="0 0 34 34"><path d="M5 3 L5 27 L11.5 21 L16 31 L20 29.3 L15.6 19.5 L24 19.5 Z" fill="#fff" stroke="#0b0f0d" stroke-width="2" stroke-linejoin="round"/></svg>`);
  const ripple = $('<div class="ripple"></div>'); ui.appendChild(ripple); ui.appendChild(cursor);

  const bg = document.getElementById('bg').getContext('2d'), fx = document.getElementById('fx').getContext('2d');
  const R = rng(411);
  const dust = Array.from({ length: 70 }, () => ({ x: R() * W, y: R() * H, r: 0.6 + R() * 1.8, a: 0.15 + R() * 0.35, v: 4 + R() * 10 }));

  let C = null, EV = [], KEYS = [];
  const ev = (t, kind, pan = 0.5) => EV.push({ t: +t.toFixed(3), kind, pan });
  window.setCues = (cues) => {
    const c = Object.assign({ which: 0.2, did: 1.0, who: 1.5, yes: 2.0, when: 2.6, whole: 3.6, trail: 5.6, end: 7.8 }, cues);
    // the steps land in a stream from 'which' to just after 'when'
    const n = STEPS.length, a = c.which - 0.1, b = Math.max(a + 2.6, c.whole - 0.4);
    pins.forEach((p, i) => { p.t = a + (b - a) * i / (n - 1); });
    c.back = c.whole - 0.15; c.fold = Math.max(c.back + 1.1, c.trail - 0.35); c.click = c.fold + 1.0;
    C = c; EV = [];
    // the camera follows the newest step, two steps behind it, then draws back on the whole trail
    KEYS = [[0, 860, 1.0]];
    pins.forEach((p, i) => { if (i >= 3) KEYS.push([p.t, p.x - 2.2 * DX, 1.0]); });
    KEYS.push([c.back, pins[n - 1].x - 2.2 * DX, 1.0], [c.back + 1.0, (X0 + pins[n - 1].x) / 2, 0.44], [c.end + 1, (X0 + pins[n - 1].x) / 2, 0.43]);
    pins.forEach((p, i) => ev(p.t, p.person ? 'logyes' : 'log', 0.2 + 0.6 * i / (n - 1)));
    ev(c.yes, 'sparkle'); ev(c.back, 'whoosh'); ev(c.fold, 'stamp'); ev(c.click, 'click', 0.62); ev(c.click + 0.25, 'chime', 0.6);
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
    const fold = sm((t - c.fold) / 0.7);
    const ox = W / 2 - cx * s, oy = TY * (1 - s) + 20 * (1 - s);
    world.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${s.toFixed(4)})`;
    world.style.filter = `blur(${(6 * fold).toFixed(2)}px) brightness(${(1 - 0.55 * fold).toFixed(3)})`;
    // the trail fills as the steps land
    const last = pins.reduce((m, p) => (t >= p.t ? p.x : m), X0 - 180);
    const lastT = pins.reduce((m, p) => (t >= p.t ? p.t : m), 0);
    const prev = pins.filter((p) => t >= p.t).slice(-2, -1)[0];
    const fx_ = prev ? lerp(prev.x, last, eo((t - lastT) / 0.3)) : lerp(X0 - 180, last, eo(t / 0.3));
    fill.style.width = `${Math.max(0, fx_ - 120).toFixed(1)}px`;
    const yesGlow = (p) => (p.person ? fade(t, c.yes - 0.1, c.back + 0.6, 0.2, 0.5) : 0);
    pins.forEach((p, i) => {
      const e = spring(t - p.t, 0.55, 15);
      const a = clamp((t - p.t) / 0.15);
      p.orb.style.transform = `scale(${(t > p.t ? 0.3 + 0.7 * e : 0.0001).toFixed(4)})`;
      p.orb.style.opacity = a.toFixed(3);
      const ce = eo((t - p.t - 0.08) / 0.45);
      p.card.style.opacity = clamp((t - p.t - 0.08) / 0.25).toFixed(3);
      p.card.style.transform = `translateY(${((p.up ? 16 : -16) * (1 - ce)).toFixed(1)}px)`;
      p.stem.style.opacity = clamp((t - p.t) / 0.3).toFixed(3);
      const g = yesGlow(p);
      const pulse = g * (0.6 + 0.4 * Math.sin((t - c.yes) * 6));
      if (p.person) p.orb.style.boxShadow = `0 0 ${(30 + 50 * pulse).toFixed(0)}px rgba(247, 192, 74, ${(0.45 + 0.4 * pulse).toFixed(2)})`;
      // 'when': the times light
      const w = fade(t, c.when - 0.1, c.back + 0.5, 0.25, 0.5);
      p.when.style.color = `rgb(${Math.round(lerp(157, 210, w))}, ${Math.round(lerp(181, 225, w))}, 255)`;
      p.when.style.textShadow = w > 0 ? `0 0 ${(12 * w).toFixed(1)}px rgba(157, 181, 255, 0.7)` : 'none';
    });
    days.forEach((d) => { d.style.opacity = fade(t, c.back, null, 0.5).toFixed(3); });
    const ha = fade(t, 0.15, c.fold - 0.05, 0.4, 0.3);
    kick.style.opacity = ha.toFixed(3); h1.style.opacity = ha.toFixed(3);
    // the trail folds into one document; Export CSV; ready for the auditor
    const de = spring(t - c.fold, 0.68, 11);
    doc.style.opacity = clamp((t - c.fold) / 0.25).toFixed(3);
    doc.style.transform = `translateY(${(60 * (1 - de)).toFixed(1)}px) scale(${(0.9 + 0.1 * de).toFixed(4)})`;
    const br = btn.getBoundingClientRect();
    const bxy = { x: br.left + br.width / 2, y: br.top + br.height / 2 };
    const path = [[c.fold + 0.3, { x: 1500, y: 1000 }], [c.click - 0.08, bxy], [c.click + 0.6, bxy]];
    let p = path[0][1];
    for (let i = 0; i < path.length - 1; i++) {
      const [ta, pa] = path[i], [tb, pb] = path[i + 1];
      if (t >= ta && t <= tb) { const e = sm((t - ta) / (tb - ta)); p = { x: lerp(pa.x, pb.x, e), y: lerp(pa.y, pb.y, e) }; break; }
      if (t > tb) p = pb;
    }
    cursor.style.opacity = fade(t, c.fold + 0.3, c.click + 0.9, 0.3, 0.3).toFixed(3);
    cursor.style.transform = `translate(${(p.x - 4).toFixed(1)}px, ${(p.y - 2).toFixed(1)}px) scale(${t > c.click - 0.06 && t < c.click + 0.1 ? 0.85 : 1})`;
    const rp = (t - c.click) / 0.6;
    if (rp > 0 && rp < 1) { const rr = 10 + 50 * eo(rp); ripple.style.opacity = (0.9 * (1 - rp)).toFixed(3); ripple.style.width = ripple.style.height = `${(2 * rr).toFixed(1)}px`; ripple.style.transform = `translate(${(bxy.x - rr).toFixed(1)}px, ${(bxy.y - rr).toFixed(1)}px)`; } else ripple.style.opacity = 0;
    const da = clamp((t - c.click - 0.2) / 0.3);
    done.style.opacity = da.toFixed(3);
    const dr = doc.getBoundingClientRect();
    done.style.transform = `translate(${(dr.left + dr.width / 2 - done.offsetWidth / 2).toFixed(1)}px, ${(dr.bottom + 26 + 12 * (1 - eo((t - c.click - 0.2) / 0.5))).toFixed(1)}px)`;

    // the light: a dark stage, dust in the air, a glow travelling with the newest step
    bg.fillStyle = '#070b09'; bg.fillRect(0, 0, W, H);
    let g = bg.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, 1100);
    g.addColorStop(0, 'rgba(22, 52, 39, 0.9)'); g.addColorStop(1, 'rgba(7, 11, 9, 0)');
    bg.fillStyle = g; bg.fillRect(0, 0, W, H);
    for (const d of dust) {
      const x = (d.x + t * d.v) % W, y = (d.y - t * d.v * 0.4 + H) % H;
      bg.fillStyle = `rgba(150, 220, 185, ${d.a * 0.5})`; bg.beginPath(); bg.arc(x, y, d.r, 0, Math.PI * 2); bg.fill();
    }
    fx.clearRect(0, 0, W, H);
    const hx = ox + fx_ * s, hy = oy + TY * s;
    const k = (1 - fold) * (1 - sm((t - c.back) / 0.8));
    if (k > 0.01) {
      const h = fx.createRadialGradient(hx, hy, 0, hx, hy, 260);
      h.addColorStop(0, `rgba(120, 240, 175, ${0.35 * k})`); h.addColorStop(1, 'rgba(120, 240, 175, 0)');
      fx.fillStyle = h; fx.fillRect(hx - 260, hy - 260, 520, 520);
      const st = fx.createLinearGradient(hx - 500, hy, hx + 500, hy);
      st.addColorStop(0, 'rgba(120, 240, 175, 0)'); st.addColorStop(0.5, `rgba(160, 255, 210, ${0.35 * k})`); st.addColorStop(1, 'rgba(120, 240, 175, 0)');
      fx.fillStyle = st; fx.fillRect(hx - 500, hy - 1.5, 1000, 3);
    }
  };

  document.fonts.ready.then(() => { window.setCues({}); window.pageReady = true; });
})();

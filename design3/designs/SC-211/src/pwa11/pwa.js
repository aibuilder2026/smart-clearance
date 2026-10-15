// SC-211: the workspace is a progressive web app. A laptop's browser offers to install it; the pointer clicks Install
// app, then Install; the window becomes the app's own, with its icon in the dock. The camera draws back as a tablet and a
// phone take it too, each from its home screen, and then every alert arrives as a notification on all three, the app's
// own pushes (render-pushes.mjs's banners, kept here as WebP). Nothing runs on its own clock: renderAt(t) draws scene time t, setCues(cues) takes the narration's words
// and returns the scene's sounds ({events}) for the mix.
(function () {
  const W = 1920, H = 1080;
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
  const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
  const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const spring = (x, zeta = 0.55, w = 16) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
  const fade = (u, a, b, fi = 0.3, fo = 0.3) => Math.min(clamp((u - a) / fi), b == null ? 1 : clamp((b - u) / fo));
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const URL_ = 'yourbrand-smartclearance.web.app';
  const ICON = 'icon.svg';
  const INSTALL_GLYPH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M8 20.5h8M12 16.5v4"/><path d="M12 6.5v6M9.4 10l2.6 2.6 2.6-2.6"/></svg>';

  // ------------------------------------------------------------------ the devices
  const stage = document.getElementById('stage'), ui = document.getElementById('ui');
  const generic = (i, r) => {   // a home screen's other apps: plain squircles in muted inks, a faint glyph, no marks
    const inks = [['#3d6f8f', '#284c63'], ['#8a6a3f', '#5d4529'], ['#5b5f8f', '#3c3f63'], ['#4f7d62', '#335541'], ['#8f4f5b', '#63363f'], ['#5f6b66', '#3e4844']];
    const g = ['search', 'house', 'layout-grid', 'bell', 'wifi', 'zap', 'shield-check', 'lock'];
    const [a, b] = inks[i % inks.length];
    return `<div class="ico" style="background:linear-gradient(160deg,${a},${b})">${IC(g[Math.floor(r * g.length)])}</div>`;
  };
  const laptop = $(`<div class="dev laptop" style="width:1220px;height:806px">
    <div class="lid"><div class="screen">
      <div class="browser">
        <div class="tabbar"><div class="lights"><i></i><i></i><i></i></div><div class="tab"><img src="${ICON}">Smart-Clearance<span class="x">${IC('x')}</span></div></div>
        <div class="toolbar">${IC('arrow-left')}${IC('arrow-right')}
          <div class="omni"><span class="lockic">${IC('lock')}</span><span class="host">${URL_}</span>
            <div class="install">${INSTALL_GLYPH}Install app</div></div>${IC('ellipsis')}</div>
      </div>
      <div class="content"><img class="shot" src="laptop.webp"></div>
      <div class="titlebar"><div class="lights"><i></i><i></i><i></i></div><img src="${ICON}">Smart-Clearance</div>
      <div class="dock">${[0, 1, 2, 3, 4].map((i) => generic(i, (i * 0.37 + 0.11) % 1)).join('')}<div class="ico newapp-l"><img src="${ICON}"><span class="run"></span></div></div>
      <div class="dialog"><h4>Install app?</h4><div class="app"><img src="${ICON}"><div><b>Smart-Clearance</b><span>${URL_}</span></div></div>
        <div class="row"><div class="btn ghost">Cancel</div><div class="btn primary">Install</div></div></div>
      <img class="banner" src="push-plan.webp">
      <div class="glare"></div>
    </div></div><div class="deck"></div></div>`);
  const handheld = (cls, n, shot, push) => {
    const r = rng(cls === 'tablet' ? 11 : 23);
    const [fw, fh] = cls === 'tablet' ? [540, 760] : [300, 630];
    return $(`<div class="dev ${cls}" style="width:${fw}px;height:${fh}px"><div class="frame"><div class="screen">
      <div class="home"><div class="status"><span>10:24</span><span class="r">${IC('signal')}${IC('wifi')}${IC('battery-full')}</span></div>
        <div class="grid">${Array.from({ length: n }, (_, i) => `<div style="position:relative">${generic(i, r())}</div>`).join('')}
          <div style="position:relative" class="slot"><div class="ico newapp"><img src="${ICON}"></div><span class="lbl">Smart-Clearance</span></div></div></div>
      <div class="appview"><img src="${shot}"></div>
      <img class="banner" src="push-${push}.webp">
      <div class="glare"></div>
    </div></div></div>`);
  };
  const tablet = handheld('tablet', 14, 'tablet.webp', 'staff');
  const phone = handheld('phone', 11, 'phone.webp', 'offer');
  [laptop, tablet, phone].forEach((d) => stage.appendChild(d));
  const q = (el, s) => el.querySelector(s);
  const L = { browser: q(laptop, '.browser'), content: q(laptop, '.content'), title: q(laptop, '.titlebar'), install: q(laptop, '.install'),
    dialog: q(laptop, '.dialog'), go: q(laptop, '.btn.primary'), dock: q(laptop, '.dock'), app: q(laptop, '.newapp-l'), run: q(laptop, '.run'),
    banner: q(laptop, '.banner'), glare: q(laptop, '.glare'), screen: q(laptop, '.screen') };
  const hand = (d) => ({ app: q(d, '.newapp'), lbl: q(d, '.lbl'), view: q(d, '.appview'), banner: q(d, '.banner'), glare: q(d, '.glare'), screen: q(d, '.screen'), frame: q(d, '.frame') });
  const T_ = hand(tablet), P_ = hand(phone);

  // the large copies of the pushes, above their devices, each with a thread down to it
  const notes = ['plan', 'staff', 'offer'].map((k) => { const n = $(`<div class="note"><img src="push-${k}.webp"></div>`); ui.appendChild(n); return n; });
  const tails = [0, 1, 2].map(() => { const t = $('<div class="tail"></div>'); ui.appendChild(t); return t; });
  const kick = $('<div class="kick">A progressive web app</div>'); ui.appendChild(kick);
  const heads = ['Install it from the browser.', 'On any laptop, tablet or phone.', 'Every alert, a notification.'].map((s, i) => { const h = $(`<div class="h1${i === 2 ? ' low' : ''}">${s}</div>`); ui.appendChild(h); return h; });
  const chips = [['laptop', 'Its own window and icon'], ['tablet', 'On the home screen'], ['smartphone', 'No app store needed']].map(([i, s]) => { const c = $(`<div class="chip">${IC(i)}${s}</div>`); ui.appendChild(c); return c; });
  const cursor = $(`<svg class="cursor" viewBox="0 0 34 34"><path d="M5 3 L5 27 L11.5 21 L16 31 L20 29.3 L15.6 19.5 L24 19.5 Z" fill="#fff" stroke="#0b0f0d" stroke-width="2" stroke-linejoin="round"/></svg>`);
  const ripples = [0, 1].map(() => { const r = $('<div class="ripple"></div>'); ui.appendChild(r); return r; });
  ui.appendChild(cursor);

  // ------------------------------------------------------------------ the light: a spotlight, drifting bokeh, the floor
  const bg = document.getElementById('bg').getContext('2d'), fx = document.getElementById('fx').getContext('2d');
  const R = rng(211);
  const bokeh = Array.from({ length: 26 }, () => ({ x: R() * W, y: 120 + R() * 760, r: 14 + R() * 46, a: 0.05 + R() * 0.10, v: 6 + R() * 14, hue: R() < 0.75 ? 'g' : 'a' }));
  function drawBg(t, glow) {
    bg.clearRect(0, 0, W, H);
    let g = bg.createRadialGradient(W / 2, -120, 40, W / 2, 380, 1150);
    g.addColorStop(0, 'rgba(40, 92, 70, 0.75)'); g.addColorStop(0.45, 'rgba(14, 34, 26, 0.65)'); g.addColorStop(1, 'rgba(7, 11, 9, 1)');
    bg.fillStyle = '#070b09'; bg.fillRect(0, 0, W, H); bg.fillStyle = g; bg.fillRect(0, 0, W, H);
    // the floor the devices stand on: a soft horizon of light
    g = bg.createLinearGradient(0, 860, 0, 1080);
    g.addColorStop(0, 'rgba(52, 211, 128, 0.0)'); g.addColorStop(0.08, `rgba(52, 211, 128, ${0.06 + 0.05 * glow})`); g.addColorStop(1, 'rgba(7, 11, 9, 0)');
    bg.fillStyle = g; bg.fillRect(0, 860, W, 220);
    for (const b of bokeh) {
      const x = (b.x + t * b.v) % (W + 200) - 100, y = b.y + Math.sin(t * 0.4 + b.x) * 10;
      const gg = bg.createRadialGradient(x, y, 0, x, y, b.r);
      const c = b.hue === 'g' ? '115, 201, 157' : '247, 192, 74';
      gg.addColorStop(0, `rgba(${c}, ${b.a})`); gg.addColorStop(1, `rgba(${c}, 0)`);
      bg.fillStyle = gg; bg.beginPath(); bg.arc(x, y, b.r, 0, Math.PI * 2); bg.fill();
    }
  }

  // ------------------------------------------------------------------ the cues
  let C = null, EV = [];
  const ev = (t, kind, pan = 0.5) => EV.push({ t: +t.toFixed(3), kind, pan });
  window.setCues = (cues) => {
    const c = Object.assign({ progressive: 0.6, install: 2.2, browser: 3.0, laptop: 4.6, tablet: 5.4, phone: 6.0, alert: 7.6, notification: 8.5, end: 11.5 }, cues);
    c.click1 = c.install + 0.05;
    c.click2 = Math.max(c.click1 + 1.15, c.browser + 0.35);
    c.installed = c.click2 + 0.15;
    c.pull = Math.max(c.installed + 0.9, c.laptop - 0.35);
    c.tab = Math.max(c.pull + 0.35, c.tablet - 0.3);
    c.ph = Math.max(c.tab + 0.45, c.phone - 0.3);
    c.n0 = Math.max(c.ph + 1.3, c.alert - 0.15);
    C = c; EV = [];
    ev(0.02, 'whoosh_in'); ev(c.progressive - 0.05, 'glint', 0.62);
    ev(c.click1, 'click', 0.62); ev(c.click1 + 0.12, 'pop', 0.62); ev(c.click2, 'click', 0.64); ev(c.installed + 0.25, 'sparkle', 0.5);
    ev(c.pull, 'whoosh'); ev(c.tab, 'whoosh_in', 0.68); ev(c.tab + 0.55, 'pop', 0.68); ev(c.ph, 'whoosh_in', 0.85); ev(c.ph + 0.55, 'pop', 0.85);
    [0, 1, 2].forEach((k) => ev(c.n0 + 0.42 * k, 'notif', [0.3, 0.62, 0.85][k]));
    window.renderAt(0);
    return { events: EV, cues: c };
  };

  // where an element sits on the stage right now
  const at = (el, fx_ = 0.5, fy = 0.5) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width * fx_, y: r.top + r.height * fy, w: r.width, h: r.height }; };
  const place = (d, cx, cy, s, ry = 0, rx = 0, a = 1, w, h) => {
    d.style.transform = `translate(${(cx - w / 2).toFixed(2)}px, ${(cy - h / 2).toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${s.toFixed(4)})`;
    d.style.opacity = a.toFixed(3);
  };
  const sweep = (g, t0, t) => { const p = (t - t0) / 0.9; g.style.opacity = (p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0).toFixed(3); g.style.transform = `translateX(${lerp(-70, 70, clamp(p))}%)`; };

  window.renderAt = (t) => {
    const c = C;
    // the laptop: rises, is installed on, then draws back to the left
    const rise = eo(t / 0.9);
    const pb = sm((t - c.pull) / 0.95);
    const lx = lerp(960, 700, pb), ly = lerp(lerp(640, 560, rise), 590, pb), ls = lerp(0.9, 0.58, pb);
    const drift = Math.sin(t * 0.35) * 0.8;
    place(laptop, lx, ly, ls, lerp(-4, 9, pb) + drift, lerp(12, 3, rise) - 1.5 * pb, clamp(t / 0.5), 1220, 806);
    // Install app glows in the address bar, is clicked; the dialog; Install; the window becomes the app's own
    L.install.style.opacity = fade(t, c.progressive - 0.1, c.installed, 0.3, 0.25).toFixed(3);
    const pulse = t > c.progressive && t < c.click1 ? 0.5 + 0.5 * Math.sin((t - c.progressive) * 7) : 0;
    L.install.style.boxShadow = `0 0 ${(18 * pulse).toFixed(1)}px rgba(52, 211, 128, ${(0.55 * pulse).toFixed(2)})`;
    const dIn = spring(t - c.click1 - 0.1, 0.62, 18), dOut = sm((t - c.click2 - 0.08) / 0.22);
    L.dialog.style.opacity = (t > c.click1 + 0.1 ? clamp((t - c.click1 - 0.1) / 0.12) * (1 - dOut) : 0).toFixed(3);
    L.dialog.style.transform = `scale(${(0.86 + 0.14 * dIn - 0.06 * dOut).toFixed(4)}) translateY(${(-10 * (1 - dIn)).toFixed(1)}px)`;
    const inst = sm((t - c.installed) / 0.5);
    L.browser.style.opacity = (1 - inst).toFixed(3);
    L.title.style.opacity = inst.toFixed(3);
    L.content.style.top = `${lerp(90, 36, inst).toFixed(2)}px`;
    L.dock.style.opacity = fade(t, c.installed + 0.1, null, 0.35).toFixed(3);
    L.dock.style.transform = `translateX(-50%) translateY(${(30 * (1 - eo((t - c.installed - 0.1) / 0.5))).toFixed(1)}px)`;
    const pop = spring(t - c.installed - 0.25, 0.45, 15);
    L.app.style.transform = `scale(${(t > c.installed + 0.25 ? 0.2 + 0.8 * pop : 0.0001).toFixed(4)}) translateY(${(-14 * Math.sin(clamp((t - c.installed - 0.25) / 0.5) * Math.PI)).toFixed(1)}px)`;
    L.run.style.opacity = clamp((t - c.installed - 0.6) / 0.3).toFixed(3);
    sweep(L.glare, c.installed + 0.05, t);

    // the tablet and the phone: in from the right, the app's icon on each home screen, then the app open
    const hand_ = (d, el, t0, cx, cy, s, w, h, ry) => {
      const e = spring(t - t0, 0.7, 9);
      place(d, lerp(cx + 520, cx, e), cy + 30 * (1 - clamp((t - t0) / 0.6)), s, lerp(-30, ry, e) + Math.sin(t * 0.4 + cx) * 0.6, 3, clamp((t - t0) / 0.35), w, h);
      const ip = spring(t - t0 - 0.55, 0.45, 15);
      el.app.style.transform = `scale(${(t > t0 + 0.55 ? 0.2 + 0.8 * ip : 0.0001).toFixed(4)})`;
      el.lbl.style.opacity = clamp((t - t0 - 0.75) / 0.25).toFixed(3);
      // the app opens from its icon: the view grows out of it
      const op = sm((t - t0 - 1.15) / 0.45);
      el.view.style.opacity = op.toFixed(3);
      el.view.style.transform = `scale(${lerp(0.25, 1, op).toFixed(4)})`;
      el.view.style.transformOrigin = '55% 85%';
      el.view.style.borderRadius = `${lerp(30, 0, op).toFixed(1)}px`;
      sweep(el.glare, t0 + 0.4, t);
    };
    hand_(tablet, T_, c.tab, 1330, 600, 0.66, 540, 760, -10);
    hand_(phone, P_, c.ph, 1700, 640, 0.76, 300, 630, -14);

    // every alert, a notification: in each device, and large above it
    const devs = [[laptop, L.banner, L.screen, 1184, 'r'], [tablet, T_.banner, T_.screen, 500, 'c'], [phone, P_.banner, P_.screen, 276, 'c']];
    devs.forEach(([d, b, scr, sw, side], k) => {
      const t0 = c.n0 + 0.42 * k;
      const e = spring(t - t0, 0.6, 16);
      const bw = side === 'r' ? 400 : sw - 24;
      b.style.width = `${bw}px`;
      b.style.left = side === 'r' ? `${sw - bw - 6}px` : '12px';
      b.style.top = `${lerp(-150, side === 'r' ? 38 : 26, e).toFixed(1)}px`;
      b.style.opacity = (t > t0 ? clamp((t - t0) / 0.15) : 0).toFixed(3);
      const glow = t > t0 ? Math.exp(-(t - t0) / 0.7) : 0;
      (d.querySelector('.frame') || d.querySelector('.lid')).style.boxShadow = `0 0 0 2px #2b3530 inset, 0 40px 90px rgba(0,0,0,0.6), 0 0 ${(90 * glow).toFixed(0)}px rgba(52, 211, 128, ${(0.55 * glow).toFixed(2)})`;
      // the large copy, above its device, with a thread down to it
      const sr = at(scr, 0.5, 0);
      const n = notes[k], tl = tails[k];
      const ne = spring(t - t0 - 0.12, 0.62, 13);
      const nw = 400, nx = [520, 1250, 1690][k], ny = 132;
      const bx = nx - nw / 2;
      n.style.width = `${nw}px`;
      n.style.transform = `translate(${bx.toFixed(1)}px, ${lerp(ny - 60, ny, ne).toFixed(1)}px)`;
      n.style.opacity = (t > t0 + 0.12 ? clamp((t - t0 - 0.12) / 0.2) : 0).toFixed(3);
      const nb = n.getBoundingClientRect();
      const x0 = nb.left + nb.width / 2, y0 = nb.bottom - 22, y1 = sr.y + 10;
      tl.style.left = `${x0.toFixed(1)}px`; tl.style.top = `${y0.toFixed(1)}px`;
      tl.style.height = `${Math.max(0, (y1 - y0) * eo((t - t0 - 0.3) / 0.4)).toFixed(1)}px`;
      tl.style.transform = `rotate(${(Math.atan2(sr.x - x0, y1 - y0) * -180 / Math.PI).toFixed(2)}deg)`;
      tl.style.opacity = (t > t0 + 0.3 ? 0.9 : 0).toFixed(3);
    });

    // the words: a kicker, then the line, changing as the voice goes
    kick.style.opacity = (fade(t, 0.25, c.n0 - 0.1, 0.4, 0.3)).toFixed(3);
    const hs = [[0.35, c.pull - 0.05], [c.pull + 0.25, c.n0 - 0.1], [c.n0 + 0.3, null]];
    heads.forEach((h, i) => {
      const [a, b] = hs[i];
      const v = fade(t, a, b, 0.35, 0.25);
      h.style.opacity = v.toFixed(3);
      h.style.transform = `translateY(${(14 * (1 - eo((t - a) / 0.5))).toFixed(1)}px)`;
      h.style.filter = `blur(${(6 * (1 - clamp((t - a) / 0.35))).toFixed(2)}px)`;
    });
    // the chips under each device, as each is installed
    const ch = [[c.installed + 0.5, () => at(laptop.querySelector('.deck'), 0.5, 1)], [c.tab + 0.9, () => at(T_.frame, 0.5, 1)], [c.ph + 0.9, () => at(P_.frame, 0.5, 1)]];
    chips.forEach((el, i) => {
      const [t0, pos] = ch[i];
      const p = pos();
      const below = i === 0 ? 18 + 60 * (1 - pb) : 22;
      el.style.left = `${p.x.toFixed(1)}px`; el.style.top = `${(p.y + below).toFixed(1)}px`;
      el.style.opacity = fade(t, t0, c.n0 + 0.2, 0.35, 0.35).toFixed(3);
    });

    // the pointer: in from the corner, Install app, then Install
    const a1 = at(L.install, 0.5, 0.55), a2 = at(L.go, 0.5, 0.55);
    const path = [[c.progressive - 0.2, { x: 1500, y: 900 }], [c.click1 - 0.08, a1], [c.click1 + 0.4, a1], [c.click2 - 0.08, a2], [c.click2 + 0.5, a2], [c.click2 + 1.0, { x: a2.x + 120, y: a2.y + 160 }]];
    let p = path[0][1];
    for (let i = 0; i < path.length - 1; i++) {
      const [ta, pa] = path[i], [tb, pb_] = path[i + 1];
      if (t >= ta && t <= tb) { const e = sm((t - ta) / (tb - ta)); p = { x: lerp(pa.x, pb_.x, e), y: lerp(pa.y, pb_.y, e) }; break; }
      if (t > tb) p = pb_;
    }
    const press = [c.click1, c.click2].some((tc) => t > tc - 0.06 && t < tc + 0.1);
    cursor.style.opacity = fade(t, c.progressive - 0.2, c.click2 + 1.0, 0.3, 0.35).toFixed(3);
    cursor.style.transform = `translate(${(p.x - 4).toFixed(1)}px, ${(p.y - 2).toFixed(1)}px) scale(${press ? 0.85 : 1})`;
    [c.click1, c.click2].forEach((tc, k) => {
      const r = ripples[k], pp = (t - tc) / 0.6, q_ = k === 0 ? a1 : a2;
      if (pp <= 0 || pp >= 1) { r.style.opacity = 0; return; }
      const rr = 10 + 46 * eo(pp);
      r.style.opacity = (0.9 * (1 - pp)).toFixed(3);
      r.style.width = r.style.height = `${(2 * rr).toFixed(1)}px`;
      r.style.transform = `translate(${(q_.x - rr).toFixed(1)}px, ${(q_.y - rr).toFixed(1)}px)`;
    });

    // the light: the spotlight warms as the notifications land; a flare across on Install
    const glow = devs.reduce((m, _, k) => Math.max(m, t > c.n0 + 0.42 * k ? Math.exp(-(t - c.n0 - 0.42 * k) / 0.9) : 0), 0);
    drawBg(t, glow);
    fx.clearRect(0, 0, W, H);
    const fl = t - c.installed;
    if (fl > 0 && fl < 1.2) {
      const k = Math.sin(Math.PI * fl / 1.2);
      const x = lerp(300, 1650, fl / 1.2), y = ly - 120;
      const g = fx.createRadialGradient(x, y, 0, x, y, 260);
      g.addColorStop(0, `rgba(190, 255, 220, ${0.35 * k})`); g.addColorStop(1, 'rgba(190, 255, 220, 0)');
      fx.fillStyle = g; fx.fillRect(x - 260, y - 260, 520, 520);
      const s = fx.createLinearGradient(x - 700, y, x + 700, y);
      s.addColorStop(0, 'rgba(160, 255, 210, 0)'); s.addColorStop(0.5, `rgba(160, 255, 210, ${0.25 * k})`); s.addColorStop(1, 'rgba(160, 255, 210, 0)');
      fx.fillStyle = s; fx.fillRect(x - 700, y - 2, 1400, 4);
    }
  };

  const imgs = [...document.images];
  Promise.all([document.fonts.ready, ...imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onload = r; i.onerror = r; })))]).then(() => {
    window.setCues({}); window.pageReady = true;
  });
})();

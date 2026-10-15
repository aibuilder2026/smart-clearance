// SC-219 cut 11: under the hood, as a surreal 2D dreamscape on Smart-Clearance's green. The same story, parts, screens
// and notes as cut 10's 3D scene (arch10), drawn flat and in motion:
//   the camera sinks through the clouds to a still lake under a huge, low moon: Google Cloud;
//   the four apps' screens rise out of the water (Firebase); a door stands in the lake (Cloud Run), and a clock melts
//   over its lintel (Cloud Scheduler); stone tablets float up beside it (Cloud SQL); paper boats carry the events
//   along the horizon (Pub/Sub);
//   the agents rise as lanterns from their own reflections, the Watcher a block of plain code; a cloud rains a bar chart
//   (BigQuery); a chest of drawers hands Vision the label photo (Cloud Storage); a star is born from the moon and its
//   light picks each agent's model (Gemini, Pro and Flash);
//   a pane of glass stops the light before the money (the guardrails); the API works out the figure; a person's yes
//   ripples across the lake and every part lights.
// Everything above the water is mirrored in it, rippled. Frame-exact: window.setCues(cues) lays the scene on the
// narration's own words and returns its sounds; window.renderAt(t) draws scene time t. Captured by capture-page.mjs.
(() => {
'use strict';
const W = 1920, H = 1080;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const spring = (x, zeta = 0.6, w = 12) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
const fade = (t, t0, t1, fi = 0.3, fo = 0.3) => Math.min(clamp((t - t0) / fi), clamp((t1 - t) / fo));
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const $ = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${(window.ICONS || {})[n] || ''}</svg>`;
const hexRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (hex, a) => { const [r, g_, b] = hexRgb(hex); return `rgba(${r},${g_},${b},${clamp(a).toFixed(3)})`; };
const mixHex = (h1, h2, k) => { const a = hexRgb(h1), b = hexRgb(h2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], clamp(k))).toString(16).padStart(2, '0')).join(''); };

const MINT = '#5fe3a1', MINT2 = '#9ff0c4', PALE = '#dff8ea', AMBER = '#f7c04a', VIOLET = '#c58af9', BLUE = '#8ab4f8', CODE = '#cfd8d3', ORANGE = '#ff9f45';

const cv = document.getElementById('c'); const g = cv.getContext('2d');
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const ABOVE = mk(), REFL = mk(), SUB = mk(), ACC = mk();
const ga = ABOVE.getContext('2d'), gr = REFL.getContext('2d'), gs = SUB.getContext('2d'), gc = ACC.getContext('2d');

// ------------------------------------------------------------------ what it draws with: the apps' own screens, the label photo, the icons
const LOADS = [];
function img(src) { const i = new Image(); i.src = src; LOADS.push(i.decode().catch(() => {})); return i; }
const ICACHE = {};
function icon(name, color, px = 64, sw = 2) {
	const k = `${name}|${color}|${px}|${sw}`; if (ICACHE[k]) return ICACHE[k];
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[name] || ''}</svg>`;
	return (ICACHE[k] = img('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)));
}
// soft puffs of cloud and mist, blurred once
function puff(seed, n = 9, a0 = 0.16) {   // a night cloud: a dim body, its top lit by the moon
	const c = mk(512, 384), q = c.getContext('2d'), r = rng(seed), B = [];
	for (let i = 0; i < n; i++) B.push([130 + r() * 250, 170 + r() * 90, 50 + r() * 80]);
	q.filter = 'blur(26px)';
	for (const [x, y, rr_] of B) { q.fillStyle = `rgba(52,96,76,${(a0 * 1.4).toFixed(3)})`; q.beginPath(); q.arc(x, y, rr_, 0, 6.2832); q.fill(); }
	q.filter = 'blur(18px)';
	for (const [x, y, rr_] of B) { q.fillStyle = `rgba(176,226,200,${(a0 * 0.7).toFixed(3)})`; q.beginPath(); q.arc(x - rr_ * 0.15, y - rr_ * 0.35, rr_ * 0.62, 0, 6.2832); q.fill(); }
	return c;
}
const PUFFS = [puff(5), puff(9), puff(13, 7, 0.2), puff(21, 11, 0.12)];
const GRAIN = (() => { const c = mk(256, 256), q = c.getContext('2d'), d = q.createImageData(256, 256), r = rng(77); for (let i = 0; i < d.data.length; i += 4) { const v = Math.floor(r() * 255); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } q.putImageData(d, 0, 0); return c; })();

// ------------------------------------------------------------------ the dreamscape's layout, in world units (the lake's surface is y 0; up is negative)
const MOON = { x: 520, y: -390, r: 245 };                     // far away (parallax 0.3)
const APPS = [
	{ id: 'landing', src: 'app-landing.webp', b: 'Landing page', x: -1390, y: -235, w: 250 },
	{ id: 'console', src: 'app-console.webp', b: 'Console', x: -1110, y: -305, w: 250 },
	{ id: 'workspace', src: 'app-workspace.webp', b: 'Workspace', x: -835, y: -250, w: 214 },
	{ id: 'demo', src: 'app-demo.webp', b: 'Guided demo', x: -560, y: -318, w: 262 },
];
const FLAME = { x: -975, y: -470 };
const DOOR = { x: 0, w: 200, h: 430 };
const KEY = { x: -178, y: -300 };
const REC = { x: 470, y: -150 };
const SLABS = [0, 1, 2, 3].map((k) => ({ dx: [0, 12, -9, 6][k], y: REC.y - 64 * k, w: 232, h: 40 }));
const CLOCK = { x: 14, y: -470, S: 0.8 };
const BOATS = ['batch.at_risk', 'journey.step', 'offer.received'];
const AGENTS = [
	{ id: 'data', name: 'Data', icon: 'database', tier: 'flash' }, { id: 'watcher', name: 'Watcher', icon: 'braces', tier: 'code' },
	{ id: 'vision', name: 'Vision', icon: 'scan-line', tier: 'flash' }, { id: 'valuer', name: 'Valuer', icon: 'scale', tier: 'pro' },
	{ id: 'router', name: 'Router', icon: 'route', tier: 'pro' }, { id: 'outreach', name: 'Outreach', icon: 'send', tier: 'flash' },
	{ id: 'lister', name: 'Lister', icon: 'store', tier: 'flash' }, { id: 'negotiator', name: 'Negotiator', icon: 'gavel', tier: 'pro' },
	{ id: 'paperwork', name: 'Paperwork', icon: 'file-text', tier: 'flash' }, { id: 'impact', name: 'Impact', icon: 'leaf', tier: 'flash' },
];
AGENTS.forEach((a, i) => { a.x = 905 + 98 * i; a.y = -335 - 82 * Math.sin(Math.PI * (i + 0.5) / 10); a.code = a.tier === 'code'; a.i = i; });
const AG = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
const BQ = { x: 1060, y: -712 };
const CHEST = { x: 1848, y: -548, w: 214, h: 200 };
const STAR = { x: 1330, y: -1060 };
const COIN = { x: 1250, y: -104, r: 46 };
const GLASS = { y: -212, x0: 960, x1: 1560 };
const APPROVE = { src: 'app-approve.webp', x: 335, y: -300, w: 400 };

APPS.forEach((a) => { a.img = img(a.src); });
APPROVE.img = img(APPROVE.src);
const PHOTO = img('label-photo.webp');
AGENTS.forEach((a) => { a.ic = icon(a.icon, a.code ? '#28322d' : '#0a3a24', 64, 2.2); });
const IK = { key: icon('key', MINT2, 64, 2), flame: icon('flame', '#ffb470', 64, 2), rupee: icon('indian-rupee', '#5a3a06', 64, 2.4), file: icon('file-text', '#0a3a24', 64, 2) };

// ------------------------------------------------------------------ the camera: a 2D pan and zoom, with far layers moving less
const cam = { x: 0, y: 0, z: 1 };
let KEYS = [];
let HY = 540;                                                   // the horizon's screen y
function camAt(t) {
	const K = KEYS; if (!K.length) return;
	let i = 0; while (i < K.length - 2 && K[i + 1].t <= t) i++;
	const a = K[i], b = K[Math.min(K.length - 1, i + 1)];
	const e = b.t > a.t ? eio((t - a.t) / (b.t - a.t)) : 1;
	cam.x = lerp(a.x, b.x, e); cam.y = lerp(a.y, b.y, e);
	cam.z = lerp(a.z, b.z, e) * (1 - (b.dip || 0) * Math.sin(Math.PI * e));
	cam.x += Math.sin(t * 0.31) * 6 / cam.z; cam.y += Math.cos(t * 0.23) * 4 / cam.z;   // a breath of a hand, never a shake
	HY = (0 - cam.y) * cam.z + H / 2;
}
const toS = (x, y) => ({ x: (x - cam.x) * cam.z + W / 2, y: (y - cam.y) * cam.z + H / 2 });
function farT(d) { const zd = 1 + (cam.z - 1) * d; return { zd, ox: W / 2 - cam.x * d * zd, oy: HY }; }
const farS = (x, y, d) => { const f = farT(d); return { x: x * f.zd + f.ox, y: y * f.zd + f.oy, z: f.zd }; };
const mid = (c) => c.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z, H / 2 - cam.y * cam.z);

// ------------------------------------------------------------------ the timeline, set from the voice's cues
let C = {}, EV = [];
const ev = (t, kind, pan = 0.5, p = 0) => EV.push({ t: +(+t).toFixed(3), kind, pan: +(+pan).toFixed(3), p });
const T = {};                                                   // when each part appears and acts
const RIPS = [];                                                // ripples on the water where something rose: {x, t0}
const DEFAULTS = { t01: 0.9, hood: 1.42, google: 2.5, u02: 3.373, apps: 3.713, firebase: 4.233, api: 5.513, run: 6.653, sql: 7.633, record: 8.593,
	u03: 9.184, pubsub: 9.264, step: 10.704, scheduler: 12.124, clock: 13.224, u04: 13.67, nine: 13.75, adk: 15.59, sales: 16.47, bigquery: 17.11,
	photos: 18.01, storage: 18.95, u05: 19.896, platform: 20.916, gemini: 22.016, pro: 22.396, prices: 22.656, negotiates: 23.436, flash: 24.636,
	reads: 24.996, writes: 25.636, u06: 26.233, models: 26.493, money: 27.713, api2: 28.693, figure: 30.213, person: 31.253, yes: 32.013, watcher: 16.32, end: 33.64 };

// ------------------------------------------------------------------ helpers to draw with
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function glowDisc(c, x, y, r, col, a) {
	const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rgba(col, a)); gg.addColorStop(1, rgba(col, 0));
	c.fillStyle = gg; c.fillRect(x - r, y - r, 2 * r, 2 * r);
}
function cloudPath(c, x, y, s) {                                 // a cloud: three bumps on a flat foot, s wide
	const k = s / 100; c.beginPath();
	c.moveTo(x - 38 * k, y + 22 * k);
	c.arc(x - 28 * k, y + 6 * k, 16 * k, Math.PI * 0.62, Math.PI * 1.55);
	c.arc(x + 0 * k, y - 8 * k, 24 * k, Math.PI * 1.1, Math.PI * 1.92);
	c.arc(x + 27 * k, y + 6 * k, 16 * k, Math.PI * 1.45, Math.PI * 2.38);
	c.closePath();
}
// the light of the yes: a ring that spreads over the lake from the plan, lighting each part as it passes and leaving it brighter
function waveAt(t, x) {
	if (!T.wave || t < T.wave) return 0;
	const R = 3600 * eo((t - T.wave) / 1.9), d = Math.abs(x - APPROVE.x);
	return clamp(1 - Math.abs(R - d) / 360) * 0.9 + clamp((R - d) / 300) * 0.35;
}
// the part the voice is on: how much it is in focus now
function heroW(id, t) { const h = HEROES[id]; return h ? fade(t, h.t0, h.t1, 0.35, 0.35) : 0; }

// ------------------------------------------------------------------ the sky, the moon, the stars, the mist and the clouds
function sky(c, t) {
	const warm = T.wave ? clamp((t - T.wave - 0.2) / 1.2) * 0.6 : 0;
	const top = HY - 1500 * cam.z, y1 = Math.min(H, Math.max(0, HY));
	const gg = c.createLinearGradient(0, top, 0, HY);
	gg.addColorStop(0, '#010407'); gg.addColorStop(0.45, mixHex('#03110b', '#0b1408', warm)); gg.addColorStop(0.82, mixHex('#082519', '#1c2a12', warm));
	gg.addColorStop(0.96, mixHex('#0f3a27', '#3a3a16', warm)); gg.addColorStop(1, mixHex('#1d5b40', '#6a5a1e', warm));
	c.fillStyle = gg; c.fillRect(0, 0, W, y1);
	if (HY > -100 && HY < H + 300) {
		const bh = 180 * cam.z, b = c.createLinearGradient(0, HY - bh, 0, HY);
		b.addColorStop(0, 'rgba(70,190,130,0)'); b.addColorStop(1, `rgba(110,225,165,${(0.18 + 0.1 * warm).toFixed(3)})`);
		c.fillStyle = b; c.fillRect(0, HY - bh, W, bh);
	}
}
const STARS = (() => { const r = rng(7); return Array.from({ length: 260 }, () => ({ x: (r() - 0.5) * 7600, y: -160 - r() * 2900, s: 0.6 + r() * 1.6, ph: r() * 6.28, sp: 0.5 + r() * 1.8 })); })();
function stars(c, t) {
	const f = farT(0.08);
	for (const s of STARS) {
		const x = s.x * f.zd + f.ox, y = s.y * f.zd + f.oy;
		if (x < -4 || x > W + 4 || y < -4 || y > HY - 6) continue;
		const a = (0.32 + 0.3 * Math.sin(t * s.sp + s.ph)) * clamp((HY - y) / 160);
		c.fillStyle = `rgba(220,255,236,${a.toFixed(3)})`; c.fillRect(x, y, s.s, s.s);
	}
}
function moonGlow(t) {   // the moon brightens as the voice names Google Cloud, as Gemini is born from it, and on the yes
	let k = 0;
	if (C.google !== undefined) k += fade(t, C.google - 0.15, C.google + 1.4, 0.3, 0.8) * 0.6;
	if (T.gemBirth !== undefined) k += fade(t, T.gemBirth - 0.4, T.gemBirth + 0.9, 0.4, 0.6) * 0.9;
	return k + waveAt(t, MOON.x) * 0.5;
}
function moon(c, t) {
	const p = farS(MOON.x, MOON.y, 0.3), R = MOON.r * p.z, k = 1 + moonGlow(t);
	if (p.y - R * 2.6 > HY) return;
	glowDisc(c, p.x, p.y, R * 2.7, MINT2, 0.12 * k);
	const gg = c.createRadialGradient(p.x - R * 0.28, p.y - R * 0.32, R * 0.08, p.x, p.y, R);
	gg.addColorStop(0, `rgba(236,255,244,${(0.34 * k).toFixed(3)})`); gg.addColorStop(0.7, `rgba(205,246,222,${(0.21 * k).toFixed(3)})`); gg.addColorStop(1, `rgba(170,232,200,${(0.13 * k).toFixed(3)})`);
	c.fillStyle = gg; c.beginPath(); c.arc(p.x, p.y, R, 0, 6.2832); c.fill();
	for (const [mx, my, mr] of [[-0.32, -0.12, 0.23], [0.27, 0.3, 0.16], [0.16, -0.38, 0.12], [-0.08, 0.42, 0.09]]) {
		c.fillStyle = 'rgba(8,40,26,0.07)'; c.beginPath(); c.arc(p.x + mx * R, p.y + my * R, mr * R, 0, 6.2832); c.fill();
	}
	// Google Cloud's cloud, drawn into the moon as the voice says it
	const d = C.google !== undefined ? clamp((t - C.google + 0.12) / 0.9) : 0;
	if (d > 0) {
		const s = R * 1.05, L = 3.0 * s;
		c.save(); cloudPath(c, p.x, p.y + R * 0.04, s);
		c.setLineDash([L, L]); c.lineDashOffset = L * (1 - eo(d)); c.lineCap = 'round'; c.lineJoin = 'round';
		c.shadowColor = rgba(MINT, 0.9); c.shadowBlur = 24 * p.z;
		c.strokeStyle = `rgba(226,255,240,${(0.62 + 0.25 * moonGlow(t)).toFixed(3)})`; c.lineWidth = 7 * p.z; c.stroke(); c.restore();
	}
}
const MIST = (() => { const r = rng(11); return Array.from({ length: 10 }, () => ({ x: (r() - 0.5) * 7000, y: -24 - r() * 140, w: 900 + r() * 1000, h: 34 + r() * 46, a: 0.05 + r() * 0.06, sp: 6 + r() * 16 })); })();
function mist(c, t, below = false) {
	const f = farT(0.6);
	for (const m of MIST) {
		const x = (m.x + m.sp * t) * f.zd + f.ox, y = (below ? -m.y * 0.55 + 30 : m.y) * f.zd + f.oy, w = m.w * f.zd, h = m.h * f.zd;
		if (x + w < 0 || x - w > W) continue;
		c.save(); c.translate(x, y); c.scale(w / h, 1);
		const gg = c.createRadialGradient(0, 0, 0, 0, 0, h); gg.addColorStop(0, `rgba(170,230,200,${(below ? m.a * 0.6 : m.a).toFixed(3)})`); gg.addColorStop(1, 'rgba(170,230,200,0)');
		c.fillStyle = gg; c.fillRect(-h, -h, 2 * h, 2 * h); c.restore();
	}
}
const CLOUDS = (() => { const r = rng(3), out = []; for (let i = 0; i < 26; i++) out.push({ x: -2200 + r() * 4800, y: -1480 + r() * 640, s: 2.2 + r() * 2.2, p: i % 4, a: 0.7 + r() * 0.3, near: i % 3 === 0 }); return out; })();
function clouds(c, t, near) {
	const gone = 1 - clamp((t - 2.6) / 0.9);
	if (gone <= 0) return;
	const d = near ? 1.35 : 1;
	for (const k of CLOUDS) {
		if (k.near !== near) continue;
		const zd = 1 + (cam.z - 1) * d, x = (k.x - cam.x * d) * zd + W / 2 + Math.sin(t * 0.2 + k.x) * 20, y = (k.y - cam.y * d) * zd + H / 2;
		const w = 512 * k.s * zd, h = 384 * k.s * zd;
		if (x + w / 2 < 0 || x - w / 2 > W || y + h / 2 < 0 || y - h / 2 > H) continue;
		c.globalAlpha = k.a * gone * (near ? 0.5 : 0.75); c.drawImage(PUFFS[k.p], x - w / 2, y - h / 2, w, h); c.globalAlpha = 1;
	}
}

// ------------------------------------------------------------------ the parts, in the world (drawn above the water; the lake mirrors them)
function rise(t, t0, from = 1) { return spring(t - t0, 0.66, 8.5) * from; }
function drawApps(c, t) {
	APPS.forEach((a, i) => {
		if (!(t >= a.t0)) return;
		const e = spring(t - a.t0, 0.62, 8.5), w = a.w, h = a.h;
		const y = lerp(h / 2 + 30, a.y, e) + Math.sin(t * 1.05 + i * 1.7) * 5, x = a.x + Math.sin(t * 0.6 + i) * 3;
		a.cx = x; a.cy = y;
		const lit = 0.6 * heroW('firebase', t) + waveAt(t, a.x);
		const pg = c.createLinearGradient(0, y + h / 2, 0, 0); pg.addColorStop(0, rgba(MINT, 0.2 + 0.25 * lit)); pg.addColorStop(1, rgba(MINT, 0));
		c.fillStyle = pg; c.fillRect(x - 2.5, y + h / 2 + 6, 5, Math.max(0, -(y + h / 2 + 6)));
		c.save(); c.shadowColor = rgba(lit > 0.9 ? AMBER : MINT, 0.5 + 0.35 * clamp(lit)); c.shadowBlur = 44;
		rr(c, x - w / 2 - 7, y - h / 2 - 7, w + 14, h + 14, 13); c.fillStyle = '#05170f'; c.fill(); c.restore();
		c.save(); rr(c, x - w / 2, y - h / 2, w, h, 8); c.clip(); c.drawImage(a.img, x - w / 2, y - h / 2, w, h); c.restore();
		rr(c, x - w / 2 - 7, y - h / 2 - 7, w + 14, h + 14, 13); c.strokeStyle = rgba(MINT2, 0.5 + 0.4 * clamp(lit)); c.lineWidth = 1.6; c.stroke();
	});
	// Firebase's flame over the four, flickering
	if (t >= T.flame) {
		const e = spring(t - T.flame, 0.55, 9), s = 1 + 0.06 * Math.sin(t * 9) * Math.sin(t * 5.3);
		const y = FLAME.y + Math.sin(t * 1.2) * 6;
		glowDisc(c, FLAME.x, y, 120 * e, ORANGE, 0.28 + 0.15 * heroW('firebase', t));
		c.save(); c.translate(FLAME.x, y); c.scale(e * s, e * s);
		c.beginPath(); c.arc(0, 0, 36, 0, 6.2832); c.fillStyle = 'rgba(40,18,4,0.85)'; c.fill(); c.strokeStyle = rgba(ORANGE, 0.8); c.lineWidth = 2; c.stroke();
		c.drawImage(IK.flame, -22, -22, 44, 44); c.restore();
	}
}
function doorPath(top) {
	const r = DOOR.w / 2, x = DOOR.x, p = new Path2D();
	p.moveTo(x - r, 0); p.lineTo(x - r, top + r); p.arc(x, top + r, r, Math.PI, 0); p.lineTo(x + r, 0); p.closePath(); return p;
}
function drawDoor(c, t) {
	if (!(t >= T.door)) return;
	const e = spring(t - T.door, 0.72, 6.5), top = lerp(30, -DOOR.h, e);
	DOOR.top = top;
	const lit = 0.55 * Math.max(heroW('run', t), heroW('figure', t)) + waveAt(t, DOOR.x);
	const amber = T.figure ? fade(t, T.figure - 0.2, T.figure + 2.2, 0.4, 0.6) : 0;
	const p = doorPath(top);
	c.save(); c.shadowColor = rgba(amber > 0.2 ? AMBER : MINT, 0.75); c.shadowBlur = 70; c.fillStyle = '#03120b'; c.fill(p); c.restore();
	const ig = c.createLinearGradient(0, top, 0, 0); ig.addColorStop(0, '#04150e'); ig.addColorStop(0.6, mixHex('#0a3423', '#3a2c0a', amber)); ig.addColorStop(1, mixHex('#2f9c6a', '#c9962a', amber));
	c.globalAlpha = 0.95; c.fillStyle = ig; c.fill(p); c.globalAlpha = 1;
	// the rack inside: rows of lights, blinking faster as the requests come in
	const busy = T.run ? clamp((t - T.run + 0.3) / 0.4) : 0, r_ = rng(41);
	for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) {
		const y = -60 - 44 * j, x = DOOR.x - 54 + 18 * i;
		const f = r_() * 6.28, sp = 1.5 + r_() * 4, on = Math.sin(t * (sp + busy * 6) + f) > 0.15;
		if (y < top + 40) continue;
		c.fillStyle = on ? (i % 3 === 0 ? rgba(BLUE, 0.9) : rgba(amber > 0.3 ? AMBER : MINT2, 0.9)) : 'rgba(40,90,64,0.35)';
		c.beginPath(); c.arc(x, y, 3.2, 0, 6.2832); c.fill();
	}
	c.save(); c.shadowColor = rgba(amber > 0.3 ? AMBER : MINT, 0.95); c.shadowBlur = 20; c.strokeStyle = rgba(amber > 0.3 ? '#ffe0a0' : MINT2, 0.92 + 0.08 * clamp(lit)); c.lineWidth = 4; c.stroke(p); c.restore();
	// Secret Manager's key, at the door's shoulder
	if (t >= T.key) {
		const s = spring(t - T.key, 0.5, 10), y = KEY.y + Math.sin(t * 1.4) * 5;
		c.save(); c.translate(KEY.x, y); c.scale(s, s);
		glowDisc(c, 0, 0, 70, MINT, 0.25);
		c.beginPath(); c.arc(0, 0, 28, 0, 6.2832); c.fillStyle = '#062016'; c.fill(); c.strokeStyle = rgba(MINT2, 0.8); c.lineWidth = 2; c.stroke();
		c.drawImage(IK.key, -17, -17, 34, 34); c.restore();
	}
}
function drawRecord(c, t) {
	SLABS.forEach((s, k) => {
		const t0 = T.sql + 0.12 * k; if (!(t >= t0)) return;
		const e = spring(t - t0, 0.66, 8), x = REC.x + s.dx + Math.sin(t * 0.7 + k) * 3;
		const y = lerp(40, s.y, e) + Math.sin(t * 0.9 + k * 1.3) * 4;
		s.cx = x; s.cy = y;
		const lit = 0.5 * heroW('sql', t) + waveAt(t, REC.x);
		c.save(); c.shadowColor = rgba(MINT, 0.45 + 0.3 * clamp(lit)); c.shadowBlur = 34;
		rr(c, x - s.w / 2, y - s.h / 2, s.w, s.h, 13);
		const sg = c.createLinearGradient(0, y - s.h / 2, 0, y + s.h / 2); sg.addColorStop(0, '#12402c'); sg.addColorStop(1, '#071b12');
		c.fillStyle = sg; c.fill(); c.restore();
		rr(c, x - s.w / 2, y - s.h / 2, s.w, s.h, 13); c.strokeStyle = rgba(MINT2, 0.45 + 0.35 * clamp(lit)); c.lineWidth = 1.6; c.stroke();
		for (let l = 0; l < 3; l++) { c.fillStyle = rgba(MINT2, 0.22); rr(c, x - s.w / 2 + 22, y - 10 + l * 9, 70 + ((k * 37 + l * 53) % 90), 3, 1.5); c.fill(); }
		if (k === 3) {   // the record: a new line written as the voice says it
			for (const [w0, yy] of [[C.record - 0.35, -10], [C.record + 0.35, 8]]) {
				const w1 = clamp((t - w0) / 0.6); if (w1 <= 0) continue;
				c.save(); c.shadowColor = rgba(MINT2, 1); c.shadowBlur = 12; c.fillStyle = rgba('#eafff3', 0.95);
				rr(c, x - s.w / 2 + 22, y + yy - 1.5, (s.w - 60) * eo(w1), 4, 2); c.fill(); c.restore();
			}
		}
	});
}
function drawClock(c, t) {
	if (!(t >= T.clock)) return;
	const q = CLK.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, 240, 240);
	const cx = 120, cy = 120, R = 92, lit = 0.5 * heroW('sched', t) + waveAt(t, CLOCK.x);
	q.fillStyle = `rgba(228,251,238,${(0.9).toFixed(3)})`; q.beginPath(); q.arc(cx, cy, R, 0, 6.2832); q.fill();
	q.lineWidth = 8; q.strokeStyle = mixHex('#2f9c6a', '#c9962a', clamp(waveAt(t, CLOCK.x))); q.stroke();
	for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r0 = i % 3 ? 74 : 66; q.beginPath(); q.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); q.lineTo(cx + Math.cos(a) * 84, cy + Math.sin(a) * 84); q.lineWidth = i % 3 ? 3 : 5; q.strokeStyle = '#1b5a3f'; q.stroke(); }
	const n = (T.ticks || []).filter((tt) => t >= tt).length, last = (T.ticks || []).filter((tt) => t >= tt).pop();
	const kick = last !== undefined ? 1 - spring(t - last, 0.45, 26) : 0;
	const mA = -Math.PI / 2 + (n + 8) * Math.PI / 30 * 5 - kick * 0.08, hA = -Math.PI / 2 + 4.2 + t * 0.01;
	q.lineCap = 'round'; q.strokeStyle = '#0b2a1d';
	q.lineWidth = 7; q.beginPath(); q.moveTo(cx, cy); q.lineTo(cx + Math.cos(hA) * 44, cy + Math.sin(hA) * 44); q.stroke();
	q.lineWidth = 5; q.beginPath(); q.moveTo(cx, cy); q.lineTo(cx + Math.cos(mA) * 70, cy + Math.sin(mA) * 70); q.stroke();
	q.fillStyle = AMBER; q.beginPath(); q.arc(cx, cy, 7, 0, 6.2832); q.fill();
	// it drops onto the lintel, then melts over the door's right shoulder (the arch's own curve)
	const drop = eo((t - T.clock) / 0.45), melt = eio((t - T.clock - 0.4) / 1.2);
	const S = CLOCK.S, r = DOOR.w / 2, x0 = CLOCK.x, y0 = lerp(CLOCK.y - 460, CLOCK.y, drop) + (drop >= 1 ? 0 : 0);
	glowDisc(c, x0 + 30, y0 + 30 * melt, 190, MINT, 0.22 + 0.2 * clamp(lit));
	c.save();
	for (let sx = 0; sx < 240; sx += 3) {
		const lx = x0 + (sx - 120) * S - DOOR.x;
		const arch = Math.abs(lx) < r ? r - Math.sqrt(r * r - lx * lx) : r + (Math.abs(lx) - r) * 1.7;
		const d = melt * (lx > -10 ? arch * 1.05 : arch * 0.35);
		const st = 1 + melt * clamp((lx - 30) / 120) * 0.55;
		c.drawImage(CLK, sx, 0, 3, 240, DOOR.x + lx, y0 - 120 * S + d, 3 * S + 0.7, 240 * S * st);
	}
	c.restore();
}
const CLK = mk(240, 240);
function drawBoats(c, t) {
	BOATS.forEach((name, k) => {
		const t0 = (T.boats || [])[k]; if (t0 === undefined || t < t0) return;
		const p = eo((t - t0) / 3.4), x = lerp(150, 1090 + 170 * k, p), y = -Math.abs(Math.sin(t * 2.6 + k)) * 3;
		const gone = T.boatsGone ? clamp((t - T.boatsGone[k]) / 0.55) : 0; if (gone >= 1) return;
		const s = spring(t - t0, 0.6, 9) * 1.55 * (1 - 0.3 * gone);
		BOATS[k + 3] = { x, y, gone };
		c.save(); c.translate(x, y - 60 * eo(gone)); c.globalAlpha = 1 - gone; c.scale(s, s);
		glowDisc(c, 0, -22, 46, MINT, 0.14 + 0.2 * waveAt(t, x) + 0.6 * gone);
		c.fillStyle = 'rgba(232,255,242,0.92)'; c.strokeStyle = 'rgba(120,200,160,0.9)'; c.lineWidth = 1.4;
		c.beginPath(); c.moveTo(-38, -15); c.lineTo(38, -15); c.lineTo(25, 0); c.lineTo(-25, 0); c.closePath(); c.fill(); c.stroke();
		c.fillStyle = 'rgba(205,240,222,0.95)';
		c.beginPath(); c.moveTo(-1, -15); c.lineTo(-1, -48); c.lineTo(22, -15); c.closePath(); c.fill(); c.stroke();
		c.fillStyle = 'rgba(180,228,204,0.95)';
		c.beginPath(); c.moveTo(-4, -15); c.lineTo(-4, -40); c.lineTo(-24, -15); c.closePath(); c.fill(); c.stroke();
		c.strokeStyle = 'rgba(70,120,96,0.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-25, -15); c.lineTo(-14, -2); c.moveTo(25, -15); c.lineTo(14, -2); c.stroke();
		c.fillStyle = AMBER; c.beginPath(); c.arc(-1, -50, 3, 0, 6.2832); c.fill();
		c.restore();
	});
}
function drawLanterns(c, t) {
	for (const a of AGENTS) {
		if (!(t >= a.t0)) continue;
		const e = eo((t - a.t0) / 1.35), y = lerp(70, a.y, e) + Math.sin(t * 1.25 + a.i) * 5 * e, x = a.x + Math.sin(t * 0.8 + a.i * 1.7) * 5 * e;
		a.cx = x; a.cy = y;
		const tierK = a.tierT !== undefined ? clamp((t - a.tierT) / 0.4) : 0;
		const col = a.code ? CODE : mixHex(MINT, a.tier === 'pro' ? VIOLET : BLUE, tierK);
		const fl = a.code ? 1 : 0.86 + 0.14 * Math.sin(t * 7 + a.i * 2.3) * Math.sin(t * 3.1 + a.i);
		const lit = 0.45 * heroW('agents', t) + waveAt(t, a.x) + (a.flash ? clamp(1 - (t - a.flash) / 0.6) * 0.8 : 0);
		glowDisc(c, x, y, (a.code ? 70 : 96) * (1 + 0.25 * clamp(lit)), col, (a.code ? 0.16 : 0.34) * fl + 0.18 * clamp(lit));
		if (a.code) {
			rr(c, x - 28, y - 28, 56, 56, 12);
			const gg = c.createLinearGradient(0, y - 28, 0, y + 28); gg.addColorStop(0, '#e9efeb'); gg.addColorStop(1, '#9aa9a1');
			c.fillStyle = gg; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5; c.stroke();
		} else {
			const gg = c.createRadialGradient(x - 8, y - 10, 2, x, y, 33); gg.addColorStop(0, '#f2fff7'); gg.addColorStop(0.55, mixHex('#bff4d9', col, 0.35)); gg.addColorStop(1, col);
			c.globalAlpha = 0.9 + 0.1 * fl; c.fillStyle = gg; c.beginPath(); c.arc(x, y, 32, 0, 6.2832); c.fill(); c.globalAlpha = 1;
			c.strokeStyle = rgba('#ffffff', 0.55); c.lineWidth = 1.2; c.stroke();
		}
		c.drawImage(a.ic, x - 17, y - 17, 34, 34);
	}
}
function drawRain(c, t) {
	if (!(t >= T.bq)) return;
	const e = eo((t - T.bq) / 0.8), x = BQ.x - 280 * (1 - e), y = BQ.y + Math.sin(t * 0.9) * 6, lit = 0.5 * heroW('bq', t) + waveAt(t, BQ.x);
	// the drops: a bar chart's bars, falling to the Watcher and the Valuer
	if (T.rain0 !== undefined && t > T.rain0) {
		const r = rng(19);
		for (let k = 0; k < 60; k++) {
			const ts = T.rain0 + k * 0.045 + r() * 0.03, len = 22 + r() * 46, x0 = x - 110 + r() * 220, tgt = k % 2 ? AG.valuer : AG.watcher;
			if (t < ts || ts > T.rain1) continue;
			const p = (t - ts) / 0.75; if (p >= 1) continue;
			const tx = tgt.cx !== undefined ? tgt.cx : tgt.x, ty = tgt.cy !== undefined ? tgt.cy : tgt.y;
			const yy = lerp(y + 60, ty - 20, p * p), xx = lerp(x0, tx + (r() - 0.5) * 20, p * p);
			c.fillStyle = rgba(k % 3 ? MINT2 : BLUE, 0.75 * (1 - p * 0.4)); rr(c, xx - 4, yy - len, 8, len, 4); c.fill();
		}
	}
	c.save(); c.globalAlpha = e;
	glowDisc(c, x, y + 10, 260, MINT, 0.12 + 0.1 * clamp(lit));
	c.drawImage(PUFFS[2], x - 290, y - 150, 580, 290);
	cloudPath(c, x, y + 4, 300); c.fillStyle = 'rgba(214,240,226,0.32)'; c.fill();
	cloudPath(c, x, y + 4, 300); c.strokeStyle = rgba(MINT2, 0.5); c.lineWidth = 2; c.stroke();
	// sales history, hanging from it as a bar chart
	[0.45, 0.7, 0.55, 0.9, 0.8].forEach((v, i) => { c.fillStyle = rgba(i === 3 ? BLUE : MINT2, 0.85); rr(c, x - 62 + i * 26, y + 60, 16, 64 * v, 4); c.fill(); });
	c.restore();
}
function drawChest(c, t) {
	if (!(t >= T.chest)) return;
	const e = spring(t - T.chest, 0.62, 7.5), x = CHEST.x, y = lerp(CHEST.y - 420, CHEST.y, e) + Math.sin(t * 0.85) * 6;
	const lit = 0.5 * heroW('gcs', t) + waveAt(t, CHEST.x), w = CHEST.w, h = CHEST.h;
	CHEST.cx = x; CHEST.cy = y;
	c.save(); c.translate(x, y); c.rotate(-0.07);
	glowDisc(c, 0, 0, 220, MINT, 0.14 + 0.12 * clamp(lit));
	c.strokeStyle = rgba(MINT2, 0.7); c.lineWidth = 2;
	for (const lx of [-w / 2 + 16, w / 2 - 16]) { c.beginPath(); c.moveTo(lx, h / 2); c.lineTo(lx + (lx < 0 ? -6 : 6), h / 2 + 34); c.stroke(); }
	rr(c, -w / 2, -h / 2, w, h, 10); c.fillStyle = '#0b2a1d'; c.fill(); c.stroke();
	const open = T.open !== undefined ? eo((t - T.open) / 0.38) : 0;
	for (let k = 0; k < 3; k++) {
		const dy = -h / 2 + 14 + k * 62, dx = k === 1 ? -64 * open : 0;
		if (k === 1 && open > 0) { c.fillStyle = '#020a06'; rr(c, -w / 2 + 16, dy, w - 32, 52, 6); c.fill(); }
		rr(c, -w / 2 + 16 + dx, dy, w - 32, 52, 6); c.fillStyle = '#123a28'; c.fill(); c.strokeStyle = rgba(MINT2, 0.6); c.stroke();
		c.fillStyle = AMBER; c.beginPath(); c.arc(dx, dy + 26, 5, 0, 6.2832); c.fill();
	}
	c.restore();
}
function drawPhotoFlight(c, t) {   // the label photo, out of the drawer to Vision; the papers, from Paperwork into the chest
	if (T.photo !== undefined && t >= T.photo && t < T.photo + 1.15) {
		const p = eio((t - T.photo) / 1.0), v = AG.vision, tx = v.cx !== undefined ? v.cx : v.x, ty = v.cy !== undefined ? v.cy : v.y;
		const sx_ = CHEST.x - 80, sy_ = CHEST.y - 6, mx = (sx_ + tx) / 2, my = Math.min(sy_, ty) - 260;
		const x = (1 - p) * (1 - p) * sx_ + 2 * (1 - p) * p * mx + p * p * tx, y = (1 - p) * (1 - p) * sy_ + 2 * (1 - p) * p * my + p * p * ty;
		const s = lerp(1, 0.25, p), w = 150 * s, h = w * 681 / 900;
		c.save(); c.translate(x, y); c.rotate(-0.25 + 0.5 * p);
		c.shadowColor = rgba(MINT, 0.7); c.shadowBlur = 24; c.fillStyle = '#f4fbf7'; c.fillRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
		c.shadowBlur = 0; c.drawImage(PHOTO, -w / 2, -h / 2, w, h); c.restore();
	}
	for (let k = 0; k < 3; k++) {
		const t0 = T.papers !== undefined ? T.papers + 0.18 * k : undefined; if (t0 === undefined || t < t0 || t > t0 + 0.9) continue;
		const p = eio((t - t0) / 0.85), a = AG.paperwork, sx_ = a.cx !== undefined ? a.cx : a.x, sy_ = (a.cy !== undefined ? a.cy : a.y) - 30;
		const x = lerp(sx_, CHEST.x - 10, p), y = lerp(sy_, CHEST.y - 70, p) - Math.sin(Math.PI * p) * 120;
		c.save(); c.translate(x, y); c.rotate(0.4 * Math.sin(p * 6 + k)); c.globalAlpha = 1 - clamp((p - 0.85) / 0.15);
		c.fillStyle = '#f4fbf7'; rr(c, -13, -17, 26, 34, 3); c.fill(); c.drawImage(IK.file, -10, -10, 20, 20); c.restore();
	}
}
function drawCoinGlass(c, t) {
	if (t >= T.coin) {
		const e = spring(t - T.coin, 0.66, 8), y = lerp(60, COIN.y, e) + Math.sin(t * 1.1) * 4, spin = Math.cos(t * 1.6);
		COIN.cy = y;
		glowDisc(c, COIN.x, y, 150, AMBER, 0.3 + 0.2 * heroW('shield', t));
		c.save(); c.translate(COIN.x, y); c.scale(0.25 + 0.75 * Math.abs(spin), 1);
		c.beginPath(); c.arc(0, 0, COIN.r, 0, 6.2832);
		const gg = c.createRadialGradient(-14, -16, 4, 0, 0, COIN.r); gg.addColorStop(0, '#ffe7a8'); gg.addColorStop(0.6, '#f2b437'); gg.addColorStop(1, '#a86a10');
		c.fillStyle = gg; c.fill(); c.strokeStyle = '#ffe2a0'; c.lineWidth = 3; c.stroke();
		c.beginPath(); c.arc(0, 0, COIN.r - 9, 0, 6.2832); c.strokeStyle = 'rgba(120,70,8,0.5)'; c.lineWidth = 1.5; c.stroke();
		if (Math.abs(spin) > 0.35) c.drawImage(IK.rupee, -24, -24, 48, 48);
		c.restore();
	}
	if (t >= T.glass) {
		const e = spring(t - T.glass, 0.5, 9), y = lerp(-1100, GLASS.y, e);
		GLASS.cy = y;
		const flash = T.lock !== undefined ? clamp(1 - (t - T.lock) / 0.7) * (t >= T.lock ? 1 : 0) : 0;
		c.save();
		c.shadowColor = rgba('#e8fff2', 0.6 + 0.4 * flash); c.shadowBlur = 30;
		rr(c, GLASS.x0, y - 8, GLASS.x1 - GLASS.x0, 16, 6); c.fillStyle = `rgba(210,255,232,${(0.12 + 0.25 * flash).toFixed(3)})`; c.fill();
		c.shadowBlur = 0; c.strokeStyle = `rgba(235,255,245,${(0.75 + 0.25 * flash).toFixed(3)})`; c.lineWidth = 2; c.stroke();
		c.beginPath(); c.rect(GLASS.x0, y - 8, GLASS.x1 - GLASS.x0, 16); c.clip();
		for (let k = 0; k < 4; k++) { const sx_ = GLASS.x0 + ((t * 120 + k * 170) % (GLASS.x1 - GLASS.x0 + 80)) - 40; c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(sx_, y - 8); c.lineTo(sx_ + 18, y - 8); c.lineTo(sx_ + 6, y + 8); c.lineTo(sx_ - 12, y + 8); c.fill(); }
		c.restore();
	}
}
function drawApprove(c, t) {
	if (!(t >= T.approve)) return;
	const e = spring(t - T.approve, 0.64, 8), w = APPROVE.w, h = APPROVE.h, x = APPROVE.x, y = lerp(h / 2 + 30, APPROVE.y, e) + Math.sin(t * 1.1) * 4;
	APPROVE.cx = x; APPROVE.cy = y;
	const lit = 0.5 * heroW('yes', t) + (T.wave !== undefined ? clamp((t - T.wave) / 0.4) : 0);
	c.save(); c.shadowColor = rgba(lit > 0.6 ? AMBER : MINT, 0.6); c.shadowBlur = 50;
	rr(c, x - w / 2 - 7, y - h / 2 - 7, w + 14, h + 14, 14); c.fillStyle = '#05170f'; c.fill(); c.restore();
	c.save(); rr(c, x - w / 2, y - h / 2, w, h, 9); c.clip(); c.drawImage(APPROVE.img, x - w / 2, y - h / 2, w, h); c.restore();
	rr(c, x - w / 2 - 7, y - h / 2 - 7, w + 14, h + 14, 14); c.strokeStyle = rgba(lit > 0.6 ? '#ffe0a0' : MINT2, 0.75); c.lineWidth = 1.8; c.stroke();
	const b = APPROVE.btn = { x: x + w * (0.795 - 0.5), y: y + h * (0.80 - 0.5) };
	if (T.click !== undefined && t >= T.click) { glowDisc(c, b.x, b.y, 120, AMBER, 0.45 * clamp(1 - (t - T.click) / 1.6)); }
}
function stage(c, t) {
	const hero = heroSpot(t);
	if (hero) glowDisc(c, hero.wx, hero.wy, 300, MINT, 0.11 * hero.w);
	drawApps(c, t); drawDoor(c, t); drawRecord(c, t); drawClock(c, t); drawBoats(c, t);
	drawRain(c, t); drawChest(c, t); drawLanterns(c, t); drawCoinGlass(c, t); drawApprove(c, t);
	drawPhotoFlight(c, t);
}

// ------------------------------------------------------------------ light between the parts, in screen space: requests, streams, Gemini's rays
function bez(c, ax, ay, bx, by, lift) { const mx = (ax + bx) / 2, my = Math.min(ay, by) - lift; c.moveTo(ax, ay); c.quadraticCurveTo(mx, my, bx, by); return [mx, my]; }
const qpt = (ax, ay, mx, my, bx, by, p) => [(1 - p) * (1 - p) * ax + 2 * (1 - p) * p * mx + p * p * bx, (1 - p) * (1 - p) * ay + 2 * (1 - p) * p * my + p * p * by];
function stream(c, A, B, t, t0, col, lift = 60, dots = 3, period = 1.3, alpha = 0.4) {
	if (t < t0) return;
	const k = clamp((t - t0) / 0.5);
	c.save(); c.beginPath(); const [mx, my] = bez(c, A.x, A.y, B.x, B.y, lift * cam.z);
	c.setLineDash([6 * cam.z, 9 * cam.z]); c.strokeStyle = rgba(col, alpha * k); c.lineWidth = 2 * Math.max(0.6, cam.z); c.stroke(); c.setLineDash([]);
	c.globalCompositeOperation = 'lighter';
	for (let i = 0; i < dots; i++) {
		const p = ((t - t0) / period + i / dots) % 1; const [x, y] = qpt(A.x, A.y, mx, my, B.x, B.y, p);
		glowDisc(c, x, y, 16 * cam.z, col, 0.8 * k); c.fillStyle = rgba('#ffffff', 0.9 * k); c.beginPath(); c.arc(x, y, 2.6 * Math.max(0.6, cam.z), 0, 6.2832); c.fill();
	}
	c.restore();
}
function starPos(t) {
	const m = farS(MOON.x, MOON.y, 0.3), s = toS(STAR.x, STAR.y);
	if (t < T.gemBirth) return null;
	const e = eio((t - T.gemBirth) / (C.gemini - T.gemBirth));
	return { x: lerp(m.x, s.x, e), y: lerp(m.y, s.y, e) - Math.sin(Math.PI * e) * 140 * cam.z, e, z: lerp(m.z * 0.6, cam.z, e) };
}
function ray(c, S, P, k, col, w0 = 12) {   // a tapered beam from the star to a part, grown to k
	const x = lerp(S.x, P.x, k), y = lerp(S.y, P.y, k), dx = x - S.x, dy = y - S.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
	const gg = c.createLinearGradient(S.x, S.y, x, y); gg.addColorStop(0, rgba(col, 0.55)); gg.addColorStop(1, rgba(col, 0.85));
	c.fillStyle = gg; c.beginPath(); c.moveTo(S.x + nx * w0, S.y + ny * w0); c.lineTo(x + nx * 1.5, y + ny * 1.5); c.lineTo(x - nx * 1.5, y - ny * 1.5); c.lineTo(S.x - nx * w0, S.y - ny * w0); c.closePath(); c.fill();
	glowDisc(c, x, y, 40 * cam.z, col, 0.6 * k);
}
function beams(c, t) {
	c.save(); c.beginPath(); c.rect(0, 0, W, Math.max(0, HY)); c.clip();
	// the four apps' requests, into the door; the door to the record; the clock's tick to the door
	const D = toS(DOOR.x - 70, -230);
	APPS.forEach((a, i) => { if (a.cx === undefined || !T.req) return; stream(c, toS(a.cx + a.w / 2, a.cy + 10), D, t, T.req + 0.08 * i, MINT2, 70 - 15 * i, 2, 1.25 + 0.1 * i); });
	if (T.sqlRun && SLABS[1].cx !== undefined) stream(c, toS(DOOR.x + 80, -240), toS(SLABS[1].cx - 90, SLABS[1].cy), t, T.sqlRun, BLUE, 50, 3, 1.1);
	// BigQuery's sales to the Watcher and the Valuer are its rain; Cloud Storage's photo flies; Gemini's light
	const S = starPos(t);
	if (S) {
		for (const a of AGENTS) {
			if (a.rayT === undefined || t < a.rayT || a.cx === undefined) continue;
			const k = eo((t - a.rayT) / 0.45), P = toS(a.cx, a.cy), col = a.tier === 'pro' ? VIOLET : BLUE;
			c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 - 0.35 * heroW('shield', t);
			ray(c, S, P, k, col, 9 * S.z + 2);
			if (T.pulse !== undefined && t > T.pulse) {
				for (let i = 0; i < 2; i++) { const p = ((t - T.pulse) / 0.9 + i / 2 + a.i * 0.07) % 1; glowDisc(c, lerp(S.x, P.x, p), lerp(S.y, P.y, p), 18 * cam.z, '#ffffff', 0.7); }
			}
			c.restore();
		}
		// the guardrails: the light reaches for the money; the glass turns it away
		if (T.probe !== undefined && t > T.probe && COIN.cy !== undefined) {
			const Cn = toS(COIN.x, COIN.cy), Gy = toS(0, GLASS.cy !== undefined ? GLASS.cy : -2000).y, glassIn = T.glass !== undefined && t > T.glass + 0.25;
			[-90, 0, 90].forEach((off, i) => {
				const tx = Cn.x + off * cam.z, k = eo((t - T.probe - 0.12 * i) / 0.6);
				const end = glassIn ? Math.min(Gy - 10, lerp(S.y, Cn.y, k)) : lerp(S.y, Cn.y - 40 * cam.z, k);
				const kk = clamp((end - S.y) / Math.max(1, Cn.y - S.y));
				c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.75;
				ray(c, S, { x: lerp(S.x, tx, 1), y: S.y + (Cn.y - S.y) }, kk, i === 1 ? VIOLET : BLUE, 5 * S.z + 1);
				if (glassIn) {   // turned away: two short glints off the glass
					const hx = lerp(S.x, tx, kk);
					for (const sgn of [-1, 1]) { c.strokeStyle = rgba('#eafff3', 0.7); c.lineWidth = 2; c.beginPath(); c.moveTo(hx, Gy - 10); c.lineTo(hx + sgn * 60 * cam.z, Gy - 46 * cam.z); c.stroke(); }
				}
				c.restore();
			});
		}
	}
	// the money, into the API: the coin's light to the door as the voice says the API works out every figure
	if (T.figure !== undefined && COIN.cy !== undefined) stream(c, toS(COIN.x - 40, COIN.cy), toS(DOOR.x + 90, -200), t, T.figure - 0.15, AMBER, 160, 4, 1.0, 0.5);
	c.restore();
}
function drawStar(c, t) {
	const S = starPos(t); if (!S) return;
	const flare = C.gemini !== undefined && t > C.gemini ? 1 + 0.45 * Math.exp(-(t - C.gemini) * 3) * Math.cos((t - C.gemini) * 9) : 1;
	const R = (14 + 44 * S.e) * S.z * flare, rot = t * 0.18;
	c.save(); c.globalCompositeOperation = 'lighter';
	glowDisc(c, S.x, S.y, R * 6, VIOLET, 0.32); glowDisc(c, S.x, S.y, R * 3, BLUE, 0.4);
	for (const [ang, len] of [[0, 9], [Math.PI / 2, 7]]) {
		c.save(); c.translate(S.x, S.y); c.rotate(ang + rot * 0.2);
		const gg = c.createLinearGradient(-R * len, 0, R * len, 0); gg.addColorStop(0, 'rgba(201,220,255,0)'); gg.addColorStop(0.5, 'rgba(240,235,255,0.75)'); gg.addColorStop(1, 'rgba(201,220,255,0)');
		c.fillStyle = gg; c.fillRect(-R * len, -1.6, 2 * R * len, 3.2); c.restore();
	}
	c.restore();
	c.save(); c.translate(S.x, S.y); c.rotate(rot);
	c.beginPath();                                              // Gemini's four-point star, its sides drawn in
	for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, b = a + Math.PI / 4, n = (i + 1) * Math.PI / 2; if (i === 0) c.moveTo(Math.cos(a) * R, Math.sin(a) * R); c.quadraticCurveTo(Math.cos(b) * R * 0.2, Math.sin(b) * R * 0.2, Math.cos(n) * R, Math.sin(n) * R); }
	const gg = c.createLinearGradient(-R, -R, R, R); gg.addColorStop(0, '#9fc2ff'); gg.addColorStop(0.5, '#e6dcff'); gg.addColorStop(1, '#c58af9');
	c.shadowColor = 'rgba(220,200,255,0.9)'; c.shadowBlur = 30; c.fillStyle = gg; c.fill(); c.restore();
}

// ------------------------------------------------------------------ the lake: its colour, the mirror, the moon's road, the ripples, the yes
function lake(o) {
	const y0 = Math.max(0, HY); if (y0 >= H) return;
	const gg = o.createLinearGradient(0, HY, 0, HY + 620 * cam.z); gg.addColorStop(0, '#0b2c1f'); gg.addColorStop(0.5, '#04140d'); gg.addColorStop(1, '#010604');
	o.fillStyle = gg; o.fillRect(0, y0, W, H - y0);
}
function reflect(t) {
	const c = gr; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H);
	const y0 = Math.max(0, Math.floor(HY)); if (y0 >= H) return;
	const band = 3;
	for (let y = y0; y < H; y += band) {
		const src = 2 * HY - y - band; if (src + band < 0) break;
		const d = y - HY, amp = 1.2 + d * 0.014;
		const dx = Math.sin(y * 0.052 + t * 1.5) * amp + Math.sin(y * 0.137 - t * 2.1) * amp * 0.45;
		c.drawImage(ABOVE, 0, Math.max(0, src), W, band, dx, y, W, band);
	}
	c.globalCompositeOperation = 'destination-in';
	const gg = c.createLinearGradient(0, HY, 0, HY + 600); gg.addColorStop(0, 'rgba(0,0,0,0.72)'); gg.addColorStop(0.45, 'rgba(0,0,0,0.36)'); gg.addColorStop(1, 'rgba(0,0,0,0.08)');
	c.fillStyle = gg; c.fillRect(0, y0, W, H - y0);
	c.globalCompositeOperation = 'source-over';
}
const GLINTS = (() => { const r = rng(31); return Array.from({ length: 70 }, () => ({ d: r(), w: 14 + r() * 70, ph: r() * 6.28, sp: 1 + r() * 3, off: (r() - 0.5) })); })();
function surface(o, t) {
	if (HY > H || HY < -40) return;
	o.save(); o.globalCompositeOperation = 'lighter';
	// the moon's road on the water
	const m = farS(MOON.x, MOON.y, 0.3), mk_ = 1 + moonGlow(t);
	for (const s of GLINTS) {
		const y = HY + 6 + s.d * s.d * (H - HY), spread = 30 + s.d * 220 * m.z, x = m.x + s.off * spread;
		const a = (0.1 + 0.12 * Math.sin(t * s.sp + s.ph)) * (1 - s.d * 0.7) * mk_;
		if (a <= 0) continue; o.fillStyle = `rgba(200,250,225,${a.toFixed(3)})`; o.fillRect(x - s.w / 2, y, s.w * (1 - s.d * 0.4), 1.6 + s.d * 1.5);
	}
	// the horizon line
	o.fillStyle = 'rgba(140,240,190,0.35)'; o.fillRect(0, HY - 0.75, W, 1.5);
	o.filter = 'blur(6px)'; o.fillStyle = 'rgba(120,230,175,0.18)'; o.fillRect(0, HY - 4, W, 8); o.filter = 'none';
	// Pub/Sub's lane along the horizon, lit from the door out to the agents' shore; the boats' wakes
	if (T.lane !== undefined && t > T.lane) {
		const k = eo((t - T.lane) / 0.9), a0 = toS(120, 0).x, a1 = toS(lerp(120, 1900, k), 0).x;
		const gg = o.createLinearGradient(a0, 0, a1, 0); gg.addColorStop(0, 'rgba(120,240,180,0.55)'); gg.addColorStop(0.85, 'rgba(120,240,180,0.35)'); gg.addColorStop(1, 'rgba(220,255,236,0.9)');
		o.fillStyle = gg; o.fillRect(a0, HY - 1.5, a1 - a0, 3); o.filter = 'blur(5px)'; o.fillRect(a0, HY - 4, a1 - a0, 8); o.filter = 'none';
	}
	for (let k = 0; k < 3; k++) {
		const b = BOATS[k + 3]; if (!b || !T.boats || t < T.boats[k]) continue;
		const B = toS(b.x, 0), L = 160 * cam.z;
		const gg = o.createLinearGradient(B.x - L, 0, B.x, 0); gg.addColorStop(0, 'rgba(200,255,225,0)'); gg.addColorStop(1, 'rgba(200,255,225,0.7)');
		o.fillStyle = gg; o.fillRect(B.x - L, HY + 1, L, 2.4);
	}
	// rings where a part rose out of the water
	for (const r of RIPS) {
		const p = (t - r.t0) / 1.8; if (p <= 0 || p >= 1) continue;
		const P = toS(r.x, 0), rx = (40 + 260 * eo(p)) * cam.z * (r.s || 1), ry = rx * 0.12;
		o.strokeStyle = `rgba(170,245,205,${(0.42 * (1 - p)).toFixed(3)})`; o.lineWidth = 1.6;
		o.beginPath(); o.ellipse(P.x, HY + ry * 0.6, rx, ry, 0, 0, Math.PI); o.stroke();
	}
	// the yes: an amber ring over the whole lake
	if (T.wave !== undefined && t > T.wave) {
		const p = clamp((t - T.wave) / 1.9), P = toS(APPROVE.x, 0), rx = 3600 * eo(p) * cam.z, ry = rx * 0.1;
		o.strokeStyle = `rgba(247,192,74,${(0.85 * (1 - p)).toFixed(3)})`; o.lineWidth = 3;
		o.beginPath(); o.ellipse(P.x, HY + 2, rx, ry, 0, 0, Math.PI); o.stroke();
		o.filter = 'blur(10px)'; o.strokeStyle = `rgba(247,192,74,${(0.4 * (1 - p)).toFixed(3)})`; o.lineWidth = 14; o.stroke(); o.filter = 'none';
	}
	o.restore();
}
const MOTES = (() => { const r = rng(57); return Array.from({ length: 90 }, () => ({ x: r() * 6000, y: r() * 4000, s: 0.8 + r() * 2.6, vy: 6 + r() * 22, ph: r() * 6.28, big: r() < 0.12 })); })();
function motes(o, t) {
	o.save(); o.globalCompositeOperation = 'lighter';
	for (const m of MOTES) {
		const x = ((m.x - cam.x * 1.25) * cam.z % (W + 240) + (W + 240)) % (W + 240) - 120 + Math.sin(t * 0.5 + m.ph) * 14;
		const y = (((m.y - t * m.vy - cam.y * 1.25) * cam.z) % (H + 240) + (H + 240)) % (H + 240) - 120;
		const a = (0.25 + 0.25 * Math.sin(t * 1.3 + m.ph)) * (m.big ? 0.35 : 1);
		if (m.big) glowDisc(o, x, y, 22, MINT2, 0.1 * a + 0.04); else { o.fillStyle = `rgba(200,255,225,${a.toFixed(3)})`; o.beginPath(); o.arc(x, y, m.s, 0, 6.2832); o.fill(); }
	}
	o.restore();
}

// ------------------------------------------------------------------ one sub-frame, then the frame (motion blur only while the camera moves)
function drawScene(t) {
	camAt(t);
	const c = ga; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
	sky(c, t); stars(c, t); moon(c, t); mist(c, t);
	clouds(c, t, false);
	c.save(); mid(c); c.beginPath(); c.rect(-1e5, -1e5, 2e5, 1e5); c.clip(); stage(c, t); c.restore();
	c.setTransform(1, 0, 0, 1, 0, 0);
	beams(c, t);
	c.save(); c.beginPath(); c.rect(0, 0, W, Math.max(0, HY)); c.clip(); drawStar(c, t); c.restore();
	reflect(t);
	const o = gs; o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.filter = 'none';
	o.fillStyle = '#010407'; o.fillRect(0, 0, W, H);
	lake(o);
	o.drawImage(ABOVE, 0, 0);
	o.filter = 'blur(1.3px)'; o.drawImage(REFL, 0, 0); o.filter = 'none';
	mist(o, t, true);
	surface(o, t);
	clouds(o, t, true);
	motes(o, t);
}
const SHUT = 0.3 / 25;     // a light shutter: a move reads as motion, never as a smear
function blurTaps(t) {
	const pts = [[0, 0], [-700, -200], [700, -200]];
	camAt(t - SHUT / 2); const a = pts.map(([x, y]) => toS(cam.x + x / cam.z, cam.y + y / cam.z));
	const za = cam.z, xa = cam.x, ya = cam.y;
	camAt(t + SHUT / 2);
	let px = 0;
	for (const [x, y] of pts) { const p0 = { x: (xa + x / za - cam.x) * cam.z + W / 2, y: (ya + y / za - cam.y) * cam.z + H / 2 }; const q = { x: W / 2 + x, y: H / 2 + y }; px = Math.max(px, Math.hypot(p0.x - q.x, p0.y - q.y)); }
	return clamp(Math.ceil(px / 3), 1, 9);
}
function post(t) {
	// the part in focus: the rest of the frame dims a little around it
	const h = heroSpot(t);
	if (h) {
		const P = h.screen || toS(h.wx, h.wy), r0 = 260 * cam.z + 120, gg = g.createRadialGradient(P.x, P.y, r0, P.x, P.y, r0 + 900);
		gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(1, `rgba(0,0,0,${(0.34 * h.w).toFixed(3)})`); g.fillStyle = gg; g.fillRect(0, 0, W, H);
	}
	const v = g.createRadialGradient(W / 2, H * 0.46, H * 0.42, W / 2, H * 0.5, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
	g.fillStyle = v; g.fillRect(0, 0, W, H);
	const fr = Math.floor(t * 25), r = rng(fr * 7 + 3);
	g.save(); g.globalAlpha = 0.045; g.globalCompositeOperation = 'overlay';
	const pat = g.createPattern(GRAIN, 'repeat'); g.translate(-Math.floor(r() * 256), -Math.floor(r() * 256)); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256); g.restore();
}

// ------------------------------------------------------------------ the notes (cut 10's), their leaders, the act's title, the stack's parts
const ui = document.getElementById('ui'), labelsEl = document.getElementById('labels'), leadEl = document.getElementById('lead');
const HERO_DEF = {
	firebase: { cls: 'fire', icon: 'flame', k: 'Firebase · Hosting and Authentication', h: 'Four apps', s: 'The landing page, the console, a workspace for each brand and the guided demo, behind one sign-in.', chips: ['Hosting', 'Authentication', 'Cloud Messaging'], side: 'l', bottom: true, at: () => toS(FLAME.x, FLAME.y) },
	run: { cls: 'blue', icon: 'server', k: 'Cloud Run', h: 'One API', s: 'backend-api, in FastAPI: every rule, every step and every figure is worked out here.', chips: ['scales to zero', 'Secret Manager', 'OpenTelemetry'], side: 'l', at: () => toS(DOOR.x - 60, -250) },
	sql: { cls: 'blue', icon: 'database', k: 'Cloud SQL', h: 'The record', s: 'PostgreSQL 18 holds every batch, case, paper and audit line.', chips: ['IAM sign-in only', 'point-in-time recovery'], side: 'l', at: () => toS(REC.x - 116, SLABS[3].cy !== undefined ? SLABS[3].cy : REC.y - 192) },
	pubsub: { cls: 'blue', icon: 'radio', k: 'Pub/Sub', h: 'Every step, an event', s: 'Ordered and retried: the agents wake on them, and the screens update live.', chips: ['batch.at_risk', 'journey.step', 'offer.received'], side: 'r', top: true, at: () => { const b = BOATS[3]; return b ? toS(b.x, -30) : toS(200, 0); } },
	sched: { cls: 'blue', icon: 'clock', k: 'Cloud Scheduler', h: 'The clock', s: 'A tick every minute: the morning checks, offer windows closing, expiry days falling due.', chips: ['sc-tick · every minute'], side: 'l', at: () => toS(CLOCK.x - 30, CLOCK.y) },
	agents: { cls: '', icon: 'bot', k: "Google's ADK · on Cloud Run", h: 'Nine AI agents', s: 'Each with one job, one run per event. The Watcher is plain code: rules on BigQuery, no model.', chips: [], side: 'l', top: true, at: () => toS(AG.data.cx !== undefined ? AG.data.cx : AG.data.x, (AG.data.cy !== undefined ? AG.data.cy : AG.data.y) - 36) },
	bq: { cls: 'blue', icon: 'chart-column', k: 'BigQuery', h: 'Sales history', s: 'Sell-through for the Watcher and the Valuer; the impact ledger for BRSR.', chips: ['secondary_sales', 'impact_ledger'], side: 'l', at: () => toS(BQ.x - 140, BQ.y + 10) },
	gcs: { cls: 'blue', icon: 'hard-drive', k: 'Cloud Storage', h: 'Photos and papers', s: 'Label photos for Vision; every signed PDF, kept for good.', chips: ['sc-photos', 'sc-docs'], side: 'r', at: () => toS((CHEST.cx || CHEST.x) - 30, (CHEST.cy || CHEST.y) + 112) },
	gemini: { cls: 'violet', icon: 'sparkles', k: "Google's Agent Platform", h: 'Gemini', s: 'The models the nine AI agents think with: structured output, on the global endpoint.', chips: ['formerly Vertex AI', 'three tries, then a safe fallback'], side: 'l', at: (t) => starPos(t) || toS(STAR.x, STAR.y) },
	pro: { cls: 'violet', icon: 'sparkles', k: 'Gemini 3.1 Pro', h: 'Prices and negotiates', s: 'The Valuer, the Router and the Negotiator: where a person acts on the words.', chips: ['Valuer', 'Router', 'Negotiator'], side: 'l', top: true, at: () => toS(AG.valuer.cx || AG.valuer.x, (AG.valuer.cy || AG.valuer.y) - 36) },
	flash: { cls: 'blue', icon: 'zap', k: 'Gemini 3.8 Flash', h: 'Reads and writes', s: 'Data and Vision read exports, labels and receipts; Outreach, the Lister, Paperwork and Impact write.', chips: ['Data', 'Vision', 'Outreach', 'Lister', 'Paperwork', 'Impact'], side: 'r', top: true, at: () => toS(AG.lister.cx || AG.lister.x, (AG.lister.cy || AG.lister.y) - 36) },
	shield: { cls: 'amber', icon: 'shield', k: 'Guardrails', h: 'Never the money', s: "The reserve price never reaches a model, and every word is checked against the brand's rules.", chips: ['the reserve stays in the API'], side: 'l', at: () => toS(GLASS.x0 + 40, GLASS.cy !== undefined ? GLASS.cy : GLASS.y) },
	figure: { cls: '', icon: 'server', k: 'Worked out by the API', h: '', fig: 16917, s: "Net for the Mango Drink. The figure is the API's, never a model's.", chips: [], side: 'l', at: () => toS(DOOR.x - 60, -230) },
	yes: { cls: 'amber', icon: 'hand', k: "A person's yes", h: 'Nothing moves without it', s: 'Priya approves the plan in one tap; only then do the agents set off.', chips: [], side: 'l', at: () => (APPROVE.btn ? toS(APPROVE.btn.x, APPROVE.btn.y) : toS(APPROVE.x, APPROVE.y)) },
};
const HEROES = {};
const NS = 'http://www.w3.org/2000/svg';
for (const [id, d] of Object.entries(HERO_DEF)) {
	const title = d.fig ? `<div class="fig">₹0</div>` : `<h2>${[...d.h].map((ch) => `<span class="c">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</h2>`;
	const el = $(`<div class="hero ${d.cls}"><div class="row"><div class="tile">${IC(d.icon)}</div><div><div class="k">${d.k}</div>${d.fig ? '' : title}</div></div>
		${d.fig ? title : ''}<div class="s">${d.s}</div>${d.chips.length ? `<div class="chips">${d.chips.map((c) => `<span>${c}</span>`).join('')}</div>` : ''}</div>`);
	ui.appendChild(el);
	const path = document.createElementNS(NS, 'path'); path.setAttribute('fill', 'none'); path.setAttribute('stroke-width', '2.2'); path.setAttribute('stroke-linecap', 'round');
	const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', '6');
	const ring = document.createElementNS(NS, 'circle'); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke-width', '2');
	const ink = d.cls === 'blue' ? '#8ab4f8' : d.cls === 'violet' ? '#c58af9' : d.cls === 'amber' ? '#f7c04a' : d.cls === 'fire' ? '#ff9f45' : '#5fd59a';
	[path, ring].forEach((p) => p.setAttribute('stroke', ink)); dot.setAttribute('fill', ink);
	leadEl.appendChild(path); leadEl.appendChild(ring); leadEl.appendChild(dot);
	HEROES[id] = { id, ...d, el, path, dot, ring, cs: [...el.querySelectorAll('.c')], figEl: el.querySelector('.fig'), t0: 1e9, t1: 1e9 };
}
const ACTS = [
	{ k: 'Under the hood', n: '1 / 3', h: 'All on Google Cloud.' },
	{ k: 'The agents', n: '2 / 3', h: 'Nine AI agents. Two Gemini models.' },
	{ k: 'Guardrails', n: '3 / 3', h: 'The models never touch the money.' },
].map((o) => {
	const el = $(`<div class="ttl"><div class="k"><i></i>${o.k}<em>${o.n}</em></div><h1>${o.h.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ')}</h1></div>`);
	document.body.appendChild(el);
	return { ...o, el, ws: [...el.querySelectorAll('.w')], t0: 1e9, t1: 1e9 };
});
const INDEX = [['firebase', 'flame', 'Firebase'], ['run', 'server', 'Cloud Run'], ['sql', 'database', 'Cloud SQL'], ['pubsub', 'radio', 'Pub/Sub'], ['sched', 'clock', 'Scheduler'],
	['agents', 'bot', 'ADK agents'], ['bq', 'chart-column', 'BigQuery'], ['gcs', 'hard-drive', 'Cloud Storage'], ['gemini', 'sparkles', 'Gemini'], ['shield', 'shield', 'Guardrails']]
	.map(([id, ic, n]) => { const el = $(`<div class="ix">${IC(ic)}${n}</div>`); document.getElementById('index').appendChild(el); return { id, el }; });
const IX_OF = { firebase: 0, run: 1, sql: 2, pubsub: 3, sched: 4, agents: 5, bq: 6, gcs: 7, gemini: 8, pro: 8, flash: 8, shield: 9, figure: 9, yes: 9 };
const ripples = [0, 1].map((i) => { const r = $(`<div class="ripple${i ? ' r2' : ''}"></div>`); ui.appendChild(r); return r; });
// the parts' names, beside them in the dreamscape
function lab(text, ic, cls, at, t0, t1 = 1e9) { const el = $(`<div class="lb ${cls}">${IC(ic)}${text}</div>`); labelsEl.appendChild(el); return { el, at, t0, t1 }; }
const LABELS = [];
const ANS = AGENTS.map((a) => {
	const el = $(`<div class="an"><b>${a.name}</b><i class="${a.tier}">${a.code ? 'plain code · no model' : a.tier === 'pro' ? 'Gemini 3.1 Pro' : 'Gemini 3.8 Flash'}</i></div>`);
	labelsEl.appendChild(el); return { a, el, b: el.querySelector('b'), i: el.querySelector('i') };
});
const TOPICS = BOATS.map((n) => { const el = $(`<div class="tp">${n}</div>`); labelsEl.appendChild(el); return el; });

function heroSpot(t) {   // the part in focus, for the scene's light and the frame's dimming
	let best = null;
	for (const h of Object.values(HEROES)) {
		const w = fade(t, h.t0, h.t1, 0.35, 0.35); if (w <= 0) continue;
		if (!best || w > best.w) best = { id: h.id, w };
	}
	if (!best) return null;
	const P = HEROES[best.id].at(t);
	return { ...best, screen: P, wx: (P.x - W / 2) / cam.z + cam.x, wy: (P.y - H / 2) / cam.z + cam.y };
}
function place(L, t) {
	const a = fade(t, L.t0, L.t1, 0.35, 0.3) * clamp((cam.z - 0.56) / 0.12);
	if (a <= 0) { L.el.style.opacity = 0; return; }
	const P = L.at(t), w = L.el.offsetWidth;
	L.el.style.opacity = (a * (L.dim ? L.dim(t) : 1)).toFixed(3);
	L.el.style.transform = `translate(${(P.x - w / 2).toFixed(1)}px, ${P.y.toFixed(1)}px)`;
}
function overlay(t) {
	LABELS.forEach((L) => place(L, t));
	const z = clamp((cam.z - 0.6) / 0.12);
	ANS.forEach(({ a, el, i }, k) => {
		if (!(t >= a.t0) || a.cx === undefined) { el.style.opacity = 0; return; }
		const P = toS(a.cx, a.cy), up = k % 2 === 1, op = clamp((t - a.t0 - 0.35) / 0.4) * z * (1 - 0.6 * heroW('shield', t)) * (1 - clamp((t - (C.u06 + 0.4)) / 0.4) * 0.7);
		el.style.opacity = op.toFixed(3);
		el.style.flexDirection = up ? 'column-reverse' : 'column';
		const hh = el.offsetHeight;
		el.style.transform = `translate(${(P.x - 70).toFixed(1)}px, ${(up ? P.y - 42 * cam.z - hh : P.y + 42 * cam.z).toFixed(1)}px)`;
		i.style.opacity = a.tierT !== undefined ? clamp((t - a.tierT) / 0.3).toFixed(3) : 0;
	});
	TOPICS.forEach((el, k) => {
		const b = BOATS[k + 3];
		if (!b || !T.boats || t < T.boats[k] + 0.2) { el.style.opacity = 0; return; }
		const P = toS(b.x, -84 - 38 * k), w = el.offsetWidth;
		el.style.opacity = (clamp((t - T.boats[k] - 0.2) / 0.3) * fade(t, 0, C.nine + 0.3, 0.1, 0.4) * z).toFixed(3);
		el.style.transform = `translate(${(P.x - w / 2).toFixed(1)}px, ${(P.y - 30).toFixed(1)}px)`;
	});
	for (const h of Object.values(HEROES)) {
		if (h.t0 > 1e8 || t < h.t0 - 0.05 || t > h.t1 + 0.35) { h.el.style.opacity = 0; h.path.style.opacity = 0; h.dot.style.opacity = 0; h.ring.style.opacity = 0; continue; }
		const inn = eo((t - h.t0) / 0.45), out = clamp((h.t1 + 0.3 - t) / 0.3);
		const w = h.el.offsetWidth, hh = h.el.offsetHeight;
		const A = h.at(t);
		const x = h.side === 'l' ? 96 : W - 96 - w;
		const y = h.top ? 150 : h.bottom ? H - 130 - hh : clamp(A.y - hh / 2, 150, H - 130 - hh);
		const dx = (h.side === 'l' ? -18 : 18) * (1 - inn) + (h.side === 'l' ? -12 : 12) * (1 - out);
		h.el.style.opacity = (Math.min(1, inn * 1.4) * out).toFixed(3);
		h.el.style.transform = `translate(${(x + dx).toFixed(1)}px, ${y.toFixed(1)}px)`;
		h.el.style.clipPath = `inset(0 ${((1 - inn) * 100).toFixed(1)}% 0 0 round 20px)`;
		h.cs.forEach((ch, i) => { const e = spring(t - h.t0 - 0.12 - 0.022 * i, 0.72, 15); ch.style.transform = `translateY(${(26 * (1 - e)).toFixed(1)}px)`; ch.style.opacity = clamp((t - h.t0 - 0.12 - 0.022 * i) / 0.2).toFixed(3); });
		if (h.figEl) h.figEl.textContent = '₹' + Math.round(h.fig * eo((t - h.t0 - 0.15) / 0.9)).toLocaleString('en-IN');
		const ex = h.side === 'l' ? x + w + dx : x + dx, ey = y + 46, kx = ex + (h.side === 'l' ? 40 : -40);
		const ok = A && A.x > -50 && A.x < W + 50 && A.y > -50 && A.y < H + 50;
		const lp = clamp((t - h.t0 - 0.3) / 0.4), lo = ok ? Math.min(lp > 0 ? 1 : 0, out) : 0;
		const d = `M ${ex.toFixed(1)} ${ey.toFixed(1)} L ${kx.toFixed(1)} ${ey.toFixed(1)} L ${A.x.toFixed(1)} ${A.y.toFixed(1)}`;
		h.path.setAttribute('d', d);
		const len = Math.abs(kx - ex) + Math.hypot(A.x - kx, A.y - ey);
		h.path.setAttribute('stroke-dasharray', `${len.toFixed(1)} ${len.toFixed(1)}`); h.path.setAttribute('stroke-dashoffset', (len * (1 - eo(lp))).toFixed(1));
		h.path.style.opacity = (lo * 0.9).toFixed(3);
		h.dot.setAttribute('cx', A.x.toFixed(1)); h.dot.setAttribute('cy', A.y.toFixed(1)); h.dot.style.opacity = (lo * clamp((lp - 0.85) / 0.15)).toFixed(3);
		const rq = ((t - h.t0 - 0.7) % 1.2) / 1.2;
		h.ring.setAttribute('cx', A.x.toFixed(1)); h.ring.setAttribute('cy', A.y.toFixed(1)); h.ring.setAttribute('r', (7 + 18 * eo(rq)).toFixed(1));
		h.ring.style.opacity = t > h.t0 + 0.7 ? (lo * (1 - rq) * 0.8).toFixed(3) : 0;
	}
	ACTS.forEach((h) => {
		const a = fade(t, h.t0, h.t1, 0.3, 0.25); h.el.style.opacity = a.toFixed(3); if (a <= 0) return;
		h.ws.forEach((w, i) => { const e = spring(t - h.t0 - 0.06 * i, 0.74, 14); w.style.transform = `translateY(${(56 * (1 - e)).toFixed(1)}px)`; });
	});
	document.getElementById('index').style.opacity = clamp((t - 0.7) / 0.4).toFixed(3);
	let cur = -1, best = 0;
	for (const h of Object.values(HEROES)) { const w = fade(t, h.t0, h.t1, 0.35, 0.35); if (w > best) { best = w; cur = IX_OF[h.id]; } }
	INDEX.forEach((it, i) => {
		const seen = Object.values(HEROES).some((h) => IX_OF[h.id] === i && h.t0 < t);
		it.el.className = 'ix' + (i === cur && best > 0.3 ? ' on' : seen ? ' done' : '');
	});
	if (APPROVE.btn && T.click !== undefined) {
		const bp = toS(APPROVE.btn.x, APPROVE.btn.y);
		ripples.forEach((r, k) => {
			const p = (t - T.click - 0.1 * k) / 0.7;
			if (p <= 0 || p >= 1) { r.style.opacity = 0; return; }
			const rr_ = 14 + 70 * eo(p);
			r.style.opacity = ((1 - p) * 0.95).toFixed(3); r.style.width = r.style.height = `${(2 * rr_).toFixed(1)}px`;
			r.style.transform = `translate(${(bp.x - rr_).toFixed(1)}px, ${(bp.y - rr_).toFixed(1)}px)`;
		});
	}
}

// ------------------------------------------------------------------ the cues: when each part rises, acts and sounds, and where the camera is
window.setCues = (cues) => {
	const c = Object.assign({}, DEFAULTS, cues); C = c; EV = [];
	for (const k of Object.keys(T)) delete T[k];
	RIPS.length = 0; LABELS.length = 0; labelsEl.querySelectorAll('.lb').forEach((e) => e.remove());
	AGENTS.forEach((a) => { a.t0 = undefined; a.tierT = undefined; a.rayT = undefined; a.flash = undefined; a.cx = undefined; a.cy = undefined; });
	Object.values(HEROES).forEach((h) => { h.t0 = 1e9; h.t1 = 1e9; });
	const end = c.end;
	const hero = (id, t0, t1) => { HEROES[id].t0 = t0; HEROES[id].t1 = t1; ev(t0 + 0.02, 'card', HEROES[id].side === 'l' ? 0.3 : 0.7); };
	hero('firebase', c.apps - 0.1, c.api - 0.35); hero('run', c.api - 0.1, c.sql - 0.3); hero('sql', c.sql - 0.1, c.pubsub - 0.15);
	hero('pubsub', c.pubsub + 0.05, c.scheduler - 0.2); hero('sched', c.scheduler - 0.05, c.nine - 0.05); hero('agents', c.nine + 0.1, c.bigquery - 0.3);
	hero('bq', c.bigquery - 0.1, c.storage - 0.3); hero('gcs', c.storage - 0.1, c.u05 - 0.2); hero('gemini', c.u05 - 0.05, c.prices - 0.15);
	hero('pro', c.prices - 0.2, c.flash - 0.3); hero('flash', c.flash - 0.1, c.models - 0.3); hero('shield', c.models - 0.1, c.api2 - 0.3);
	hero('figure', c.api2 - 0.1, c.person - 0.3); hero('yes', c.person - 0.1, c.yes + 1.5);
	ACTS[0].t0 = 1.2; ACTS[0].t1 = c.u04 - 0.12; ACTS[1].t0 = c.u04 + 0.05; ACTS[1].t1 = c.u06 - 0.12; ACTS[2].t0 = c.u06 + 0.05; ACTS[2].t1 = end + 1;
	ACTS.forEach((h) => ev(h.t0, 'title'));

	// act 1: down through the clouds to the lake and the moon; the apps; the door; the record; the boats; the clock
	ev(0.0, 'descend'); ev(1.9, 'water', 0.5, 0);
	LABELS.push(lab('Google Cloud', 'cloud', '', (t) => { const p = farS(MOON.x, MOON.y, 0.3); return { x: p.x, y: p.y + MOON.r * p.z + 14 }; }, c.google - 0.05, c.apps - 0.2));
	ev(c.google - 0.1, 'moon', 0.7);
	APPS.forEach((a, i) => { a.h = a.w * a.img.naturalHeight / Math.max(1, a.img.naturalWidth); a.t0 = c.apps - 0.15 + 0.16 * i; RIPS.push({ x: a.x, t0: a.t0 + 0.05 }); ev(a.t0 + 0.04, 'water', 0.18 + 0.1 * i, i + 1);
		LABELS.push(lab(a.b, ['globe', 'layout-dashboard', 'smartphone', 'play'][i], '', (t) => toS(a.cx !== undefined ? a.cx : a.x, (a.cy !== undefined ? a.cy : a.y) + a.h / 2 + 14), a.t0 + 0.4, c.u03 + 0.2)); });
	T.flame = c.firebase - 0.15; ev(T.flame, 'flame', 0.25);
	LABELS.push(lab('Firebase', 'flame', 'fire', (t) => toS(FLAME.x, FLAME.y - 76), T.flame + 0.2, c.u03 + 0.2));
	T.door = c.api - 0.3; RIPS.push({ x: DOOR.x, t0: T.door + 0.05, s: 1.4 }); ev(T.door, 'emerge', 0.5);
	LABELS.push(lab('Cloud Run · backend-api', 'server', 'blue', (t) => toS(DOOR.x, 18), T.door + 0.5, c.u04 - 0.2));
	T.req = c.api - 0.1; T.run = c.run;
	T.key = c.run + 0.05; ev(T.key, 'drop', 0.35);
	LABELS.push(lab('Secret Manager', 'key', '', (t) => toS(KEY.x, KEY.y + 40), T.key + 0.25, c.sql - 0.2));
	T.sql = c.sql - 0.25; for (let k = 0; k < 4; k++) { RIPS.push({ x: REC.x, t0: T.sql + 0.12 * k + 0.05, s: 0.8 }); ev(T.sql + 0.12 * k + 0.03, 'stone', 0.66, k); }
	T.sqlRun = c.sql + 0.05; ev(c.record - 0.35, 'write', 0.7); ev(c.record + 0.35, 'write', 0.7);
	LABELS.push(lab('Cloud SQL', 'database', 'blue', (t) => toS(REC.x, 18), T.sql + 0.5, c.u04 - 0.2));
	T.lane = c.pubsub - 0.2; ev(T.lane, 'sweep', 0.5);
	T.boats = [0, 1, 2].map((k) => c.step - 0.45 + 0.55 * k); T.boats.forEach((t_, k) => { ev(t_, 'bell', 0.35 + 0.15 * k, k); RIPS.push({ x: 150, t0: t_, s: 0.6 }); });
	LABELS.push(lab('Pub/Sub', 'radio', 'blue', (t) => toS(160, 18), T.lane + 0.3, c.u04 - 0.2));
	T.clock = c.scheduler - 0.3; ev(T.clock, 'drop', 0.5); ev(T.clock + 0.45, 'melt', 0.55);
	T.ticks = [0, 1, 2, 3].map((k) => c.clock - 0.1 + k * 0.62); T.ticks.forEach((t_) => ev(t_, 'clock', 0.5));
	LABELS.push(lab('Cloud Scheduler', 'clock', 'blue', (t) => toS(CLOCK.x, CLOCK.y - 132), T.clock + 0.5, c.u04 - 0.2));

	// act 2: the lanterns rise from their reflections; the Watcher, plain code; the rain of sales; the drawers; the star; its light
	T.boatsGone = [0, 1, 2].map((k) => c.nine - 0.2 + 0.14 * k); T.boatsGone.forEach((t_, k) => ev(t_, 'ping', 0.6 + 0.1 * k));
	const ais = AGENTS.filter((a) => !a.code);
	ais.forEach((a, i) => { a.t0 = c.nine - 0.05 + 0.11 * i; RIPS.push({ x: a.x, t0: a.t0, s: 0.7 }); ev(a.t0 + 0.05, 'lantern', 0.4 + 0.05 * i, i); });
	const wa = AG.watcher; wa.t0 = c.watcher; wa.tierT = c.watcher + 0.4; RIPS.push({ x: wa.x, t0: wa.t0, s: 0.7 }); ev(wa.t0 + 0.04, 'code', 0.35);
	T.bq = c.bigquery - 0.3; ev(T.bq, 'whoosh', 0.4);
	T.rain0 = c.bigquery + 0.1; T.rain1 = c.storage - 0.35; ev(T.rain0, 'rain', 0.4);
	LABELS.push(lab('BigQuery', 'chart-column', 'blue', (t) => toS(BQ.x, BQ.y - 158), T.bq + 0.4, c.u05 + 0.2));
	AG.watcher.flash = c.bigquery + 0.85; AG.valuer.flash = c.bigquery + 0.9;
	T.chest = c.storage - 0.4; ev(T.chest, 'whoosh', 0.75);
	T.open = c.storage + 0.02; ev(T.open, 'drawer', 0.8);
	T.photo = c.storage + 0.18; ev(T.photo, 'whoosh', 0.7); AG.vision.flash = T.photo + 1.0; ev(T.photo + 1.0, 'ping', 0.45);
	T.papers = c.storage + 0.55; [0, 1, 2].forEach((k) => ev(T.papers + 0.18 * k + 0.8, 'tick', 0.8, k));
	LABELS.push(lab('Cloud Storage', 'hard-drive', 'blue', (t) => toS(CHEST.cx || CHEST.x, (CHEST.cy || CHEST.y) - 150), T.chest + 0.4, c.u05 + 0.2));
	T.gemBirth = c.platform - 0.15; ev(c.u05 + 0.1, 'swell', 0.6); ev(T.gemBirth, 'rise', 0.6); ev(c.gemini - 0.05, 'star', 0.6);
	LABELS.push(lab('Gemini · Agent Platform', 'sparkles', 'violet', (t) => { const S = starPos(t) || toS(STAR.x, STAR.y); return { x: S.x, y: S.y + 70 * cam.z + 20 }; }, c.gemini + 0.2, c.u06 + 0.2));
	const pros = AGENTS.filter((a) => a.tier === 'pro'), flashes = AGENTS.filter((a) => a.tier === 'flash');
	pros.forEach((a, i) => { a.rayT = c.prices - 0.15 + 0.32 * i; a.tierT = a.rayT + 0.42; a.flash = a.rayT + 0.45; ev(a.rayT + 0.1, 'ray', 0.4 + 0.1 * i, i); });
	flashes.forEach((a, i) => { a.rayT = c.reads - 0.25 + 0.16 * i; a.tierT = a.rayT + 0.42; a.flash = a.rayT + 0.45; ev(a.rayT + 0.1, 'ray', 0.3 + 0.08 * i, 10 + i); });
	T.pulse = c.writes + 0.35; ev(T.pulse, 'sparkle', 0.6);

	// act 3: the money rises; the light reaches for it and the glass turns it away; the API's figure; the yes
	T.coin = c.models - 0.25; RIPS.push({ x: COIN.x, t0: T.coin, s: 0.9 }); ev(T.coin, 'coin', 0.6);
	T.probe = c.models + 0.25; ev(T.probe, 'zap', 0.6);
	T.glass = c.money - 0.45; ev(T.glass, 'whoosh', 0.55); T.lock = c.money - 0.05; ev(T.lock, 'glass', 0.55); ev(T.lock + 0.03, 'lock', 0.55);
	LABELS.push(lab('Guardrails', 'shield', 'amber', (t) => toS(GLASS.x1 - 60, (GLASS.cy !== undefined ? GLASS.cy : GLASS.y) + 22), T.lock + 0.2, c.api2 - 0.2));
	T.figure = c.api2 + 0.05; ev(T.figure, 'compute', 0.5);
	APPROVE.h = APPROVE.w * APPROVE.img.naturalHeight / Math.max(1, APPROVE.img.naturalWidth);
	T.approve = c.person - 0.55; RIPS.push({ x: APPROVE.x, t0: T.approve, s: 1.2 }); ev(T.approve, 'water', 0.62, 5);
	T.click = c.yes - 0.15; ev(T.click, 'click', 0.62); ev(T.click + 0.08, 'gate', 0.62);
	T.wave = c.yes + 0.15; ev(T.wave, 'sparkle', 0.5); ev(c.yes + 0.75, 'rise', 0.5); ev(c.yes + 1.5, 'impact', 0.5);

	// the camera: down through the clouds, then each part framed as it is named, and out to the whole lake on the yes
	const K = [];
	const k = (t, x, y, z, dip = 0) => K.push({ t, x, y, z, dip });
	const frame = (wx, wy, sx, sy, z) => [wx - (sx - W / 2) / z, wy - (sy - H / 2) / z, z];
	k(0, 260, -1720, 0.6);
	k(2.15, ...frame(520, -300, 1250, 470, 0.66));
	k(c.apps - 0.75, ...frame(520, -300, 1240, 470, 0.68));
	k(c.apps + 0.2, ...frame(-975, -280, 1110, 430, 1.04), 0.16);
	k(c.api - 0.85, ...frame(-975, -280, 1090, 430, 1.07));
	k(c.api + 0.2, ...frame(0, -215, 1150, 470, 1.0), 0.26);
	k(c.sql - 0.5, ...frame(0, -215, 1130, 470, 1.03));
	k(c.sql + 0.1, ...frame(470, -250, 1260, 470, 1.0));
	k(c.pubsub - 0.45, ...frame(470, -250, 1250, 470, 1.03));
	k(c.pubsub + 0.3, ...frame(560, -140, 960, 560, 0.78), 0.05);
	k(c.scheduler - 0.75, ...frame(760, -140, 960, 560, 0.8));
	k(c.scheduler + 0.2, ...frame(CLOCK.x, CLOCK.y, 1240, 440, 1.28), 0.12);
	k(c.nine - 0.85, ...frame(CLOCK.x, CLOCK.y, 1230, 440, 1.32));
	k(c.nine + 0.45, ...frame(1340, -370, 1150, 500, 0.86), 0.42);
	k(c.watcher - 0.2, ...frame(1340, -372, 1140, 500, 0.89));
	k(c.watcher + 0.2, ...frame(1100, -390, 1050, 520, 0.95));
	k(c.bigquery + 0.15, ...frame(1060, -560, 1160, 520, 0.9));
	k(c.storage - 0.75, ...frame(1060, -560, 1150, 520, 0.92));
	k(c.storage + 0.2, ...frame(CHEST.x, CHEST.y, 1010, 500, 0.86), 0.18);
	k(c.u05 - 0.25, ...frame(CHEST.x, CHEST.y, 1000, 500, 0.88));
	k(c.u05 + 0.45, ...frame(900, -520, 960, 540, 0.6));
	k(c.gemini - 0.1, ...frame(1150, -620, 960, 520, 0.64));
	k(c.prices + 0.1, ...frame(1340, -700, 960, 540, 0.7));
	k(c.flash - 0.3, ...frame(1340, -700, 960, 540, 0.72));
	k(c.reads + 0.05, ...frame(1340, -690, 960, 540, 0.74));
	k(c.models - 0.25, ...frame(1340, -690, 960, 540, 0.75));
	k(c.models + 0.25, ...frame(1210, -300, 1060, 520, 0.92));
	k(c.api2 - 0.8, ...frame(1210, -300, 1050, 520, 0.95));
	k(c.api2 + 0.3, ...frame(0, -215, 1120, 500, 1.06), 0.4);
	k(c.person - 0.55, ...frame(0, -215, 1110, 500, 1.08));
	k(c.person + 0.1, ...frame(170, -270, 1080, 510, 1.06));
	k(c.yes + 0.35, ...frame(190, -275, 1090, 510, 1.1));
	k(end - 0.25, ...frame(250, -420, 960, 540, 0.47));
	KEYS = K;
	[[c.apps - 0.45, 0.35], [c.api - 0.4, 0.5], [c.sql - 0.35, 0.65], [c.pubsub - 0.1, 0.55], [c.scheduler - 0.4, 0.45], [c.nine - 0.25, 0.7],
	 [c.bigquery - 0.25, 0.4], [c.storage - 0.35, 0.75], [c.u05 - 0.1, 0.5], [c.models - 0.2, 0.6], [c.api2 - 0.25, 0.35], [c.yes + 0.4, 0.5]]
		.forEach(([t, pan]) => ev(t, 'move', pan));
	EV.sort((a, b) => a.t - b.t);
	return { events: EV, cues: c };
};

window.renderAt = (t) => {
	const n = blurTaps(t);
	gc.setTransform(1, 0, 0, 1, 0, 0); gc.globalCompositeOperation = 'source-over';
	for (let i = 0; i < n; i++) {
		drawScene(n === 1 ? t : t + SHUT * ((i + 0.5) / n - 0.5));
		gc.globalAlpha = 1 / (i + 1); gc.drawImage(SUB, 0, 0);
	}
	gc.globalAlpha = 1;
	camAt(t);
	g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
	g.drawImage(ACC, 0, 0);
	post(t);
	overlay(t);
	return { taps: n };
};

(async () => {
	await Promise.all(LOADS);
	try { await document.fonts.load('700 40px "Bricolage Grotesque"'); await document.fonts.load('600 15px Geist'); } catch (e) {}
	window.setCues({});
	window.renderAt(0);
	window.pageReady = true;
})();
})();

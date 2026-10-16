// SC-219 cut 13: the application beside each part. A panel is the part's card (what it is, in a few words) over one or
// two devices: a browser window or a phone, each showing the app's own screen, captured at 2x from the live guided demo
// and drawn crisp in screen space (never through the lens). Inside a device the screen can pan and zoom (a camera of
// its own), change state (before and after a press), and carry what happens on it: a pointer that moves and clicks, a
// finger that taps, text typed into a field, rows that arrive, rings on what matters, a push that lands. A lead runs from
// the device to the part in the 3D scene, and a packet travels along it when they talk. Nothing runs on its own clock:
// update(t) draws scene time t, and events(ev) names every sound at the moment it happens.
const W = 1920, H = 1080;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const spring = (x, zeta = 0.62, w = 15) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
export const TONE = { fire: '#ff9f45', blue: '#8ab4f8', green: '#34d380', violet: '#c58af9', amber: '#f7c04a', code: '#cfd8d3' };
const ICON = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
// cut 14: a Google product's own logo, as a mask in the header's ink (arch.js's logos/)
const LGURL = (n) => n === 'firebase' ? 'logos/firebase.svg' : n === 'gemini' ? 'logos/googlegemini.svg' : `logos/${n}.png`;
const LOGO = (n) => `<i class="lg" style="-webkit-mask-image:url(${LGURL(n)});mask-image:url(${LGURL(n)})"></i>`;
const ARROW = `<svg viewBox="0 0 28 28" width="30" height="30"><path d="M5 3 L5 22.5 L10.1 17.6 L13.6 25.4 L17 23.9 L13.5 16.2 L20.6 16.2 Z" fill="#fff" stroke="#0b0f0d" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const SPIN = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9" /></svg>`;

const CHROME = 38;   // the browser's bar
const BEZ = 9;       // the phone's bezel

const def_has_many = (V) => V.leads.length > 1 && !V.rectAll;
export function Panels(root, svg) {
	const P = [];
	const NS = 'http://www.w3.org/2000/svg';

	function device(d, tone) {
		const isPhone = d.kind === 'phone';
		const el = $(isPhone
			? `<div class="dv phone"><div class="scr"></div></div>`
			: `<div class="dv browser"><div class="bar"><i></i><i></i><i></i><div class="url">${ICON('lock')}<span></span></div></div><div class="scr"></div></div>`);
		const scr = el.querySelector('.scr');
		el.style.width = `${d.w + (isPhone ? 2 * BEZ : 0)}px`;
		scr.style.width = `${d.w}px`; scr.style.height = `${d.h}px`;
		const D = { ...d, el, scr, tone, layers: [], urlEl: el.querySelector('.url span'), cur: null, tap: null, fx: [] };
		D.outerW = d.w + (isPhone ? 2 * BEZ : 0); D.outerH = d.h + (isPhone ? 2 * BEZ : CHROME);
		for (const L of d.layers) {
			const img = document.createElement('img'); img.src = L.src; img.decoding = 'sync'; img.draggable = false; scr.appendChild(img);
			D.layers.push({ ...L, img });
		}
		// what happens on the screen, in the image's own pixels: typed text, a busy button, veils over rows yet to arrive,
		// rings, pushes; then the pointer and the finger over everything
		for (const T of d.typed || []) { const e = $(`<div class="typed"><span></span><b class="caret"></b></div>`); scr.appendChild(e); D.fx.push({ kind: 'typed', ...T, el: e, span: e.querySelector('span'), caret: e.querySelector('.caret') }); }
		for (const O of d.overlays || []) { const e = $(`<div class="ov">${O.html}</div>`); scr.appendChild(e); D.fx.push({ kind: 'ov', ...O, el: e }); }
		for (const V of d.veils || []) { const e = $(`<div class="veil"></div>`); e.style.background = V.color || '#fff'; scr.appendChild(e); D.fx.push({ kind: 'veil', ...V, el: e }); }
		for (const Pu of d.pushes || []) { const e = document.createElement('img'); e.src = Pu.src; e.className = 'push'; scr.appendChild(e); D.fx.push({ kind: 'push', ...Pu, el: e }); }
		for (const Rg of d.rings || []) { const e = $(`<div class="ring"></div>`); e.style.borderColor = TONE[Rg.tone || tone]; e.style.boxShadow = `0 0 0 4px ${TONE[Rg.tone || tone]}33, 0 0 24px ${TONE[Rg.tone || tone]}66`; scr.appendChild(e); D.fx.push({ kind: 'ring', ...Rg, el: e }); }
		for (const S of d.strips || []) { const e = $(`<div class="strip">${S.html}</div>`); scr.appendChild(e); D.fx.push({ kind: 'strip', ...S, el: e }); }
		if (d.cursor) { D.cur = $(`<div class="cur">${ARROW}</div>`); scr.appendChild(D.cur); D.ripples = [0, 1].map(() => { const r = $(`<div class="rip"></div>`); r.style.borderColor = TONE[tone]; scr.appendChild(r); return r; }); }
		if (d.taps) { D.tap = $(`<div class="tap"></div>`); scr.appendChild(D.tap); D.ripples = [0, 1].map(() => { const r = $(`<div class="rip"></div>`); r.style.borderColor = '#ffffff'; scr.appendChild(r); return r; }); }
		return D;
	}

	function add(def) {
		const tone = def.header.tone || 'green';
		const el = $(`<div class="panel ${def.layout || ''} ${def.side || ''}"><div class="hd"></div><div class="devs"></div><div class="bdg"></div></div>`);
		root.appendChild(el);
		const hd = el.querySelector('.hd'), devs = el.querySelector('.devs'), bdg = el.querySelector('.bdg');
		const heads = [def.header, ...(def.header.swaps || [])].map((h, i) => {
			const tn = h.tone || tone;
			const e = $(`<div class="head" style="--tone:${TONE[tn]}"><div class="k">${h.logo ? LOGO(h.logo) : ICON(h.icon)}<span>${h.k}</span></div><h2>${h.h}</h2>${h.s ? `<p>${h.s}</p>` : ''}${h.chips && h.chips.length ? `<div class="chips">${h.chips.map((c) => `<span>${c}</span>`).join('')}</div>` : ''}</div>`);
			hd.appendChild(e); return { ...h, el: e, t: i === 0 ? def.t0 : h.t, i };
		});
		const D = def.devices.map((d) => { const x = device(d, tone); devs.appendChild(x.el); return x; });
		const badges = (def.badges || []).map((b) => { const e = $(`<div class="badge" style="--tone:${TONE[b.tone || tone]}">${b.icon ? `<span class="bi">${ICON(b.icon)}</span>` : ''}<div>${b.html}</div></div>`); bdg.appendChild(e); return { ...b, el: e }; });
		// the leads to the parts (one a device), and what travels along them
		const leadDefs = def.leads || (D.length && def.anchor ? [{ dev: def.leadDev ?? 0, anchor: def.anchor }] : []);
		const leads = leadDefs.map((L) => {
			const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.classList.add('pv'); return e; };
			const tn = TONE[L.tone || tone];
			const glow = mk('path', { fill: 'none', 'stroke-width': 9, 'stroke-linecap': 'round', stroke: tn, opacity: 0.18 });
			const path = mk('path', { fill: 'none', 'stroke-width': 2.4, 'stroke-linecap': 'round', stroke: tn });
			const pingC = mk('circle', { fill: 'none', stroke: tn, 'stroke-width': 2.5 });
			const dot = mk('circle', { r: 6.5, fill: '#fff', stroke: tn, 'stroke-width': 3 });
			svg.appendChild(glow); svg.appendChild(path); svg.appendChild(pingC); svg.appendChild(dot);
			return { ...L, glow, path, pingC, dot };
		});
		const packets = (def.packets || []).map((k) => {
			const g = document.createElementNS(NS, 'g'); g.classList.add('pv');
			g.innerHTML = `<circle r="15" fill="${TONE[k.tone || tone]}" opacity="0.28"/><circle r="7" fill="#ffffff"/>`;
			svg.appendChild(g);
			const lab = k.label ? $(`<div class="pk" style="--tone:${TONE[k.tone || tone]}">${k.icon ? ICON(k.icon) : ''}<span>${k.label}</span></div>`) : null;
			if (lab) root.appendChild(lab);
			return { lead: 0, ...k, dur: Math.max(k.dur, 0.5), g, lab };
		});
		// a packet's name is pinned beside its window, never carried along the lead (cut 13: it flew across too fast to
		// read): it shows as an outgoing packet leaves, or as an incoming one lands, holds 1.3 s, and gives way to the panel's next
		const named = packets.filter((k) => k.lab).map((k) => Object.assign(k, { ls: k.dir === 'in' ? k.t + k.dur - 0.08 : k.t - 0.04 }));
		named.forEach((k) => { const nx = named.filter((o) => o.ls > k.ls).sort((a, b) => a.ls - b.ls)[0]; k.le = Math.min(k.ls + 1.3, nx ? nx.ls : 1e9); });
		const rolls = [...el.querySelectorAll('[data-roll]')].map((e) => ({ e, v: +e.getAttribute('data-roll'), h: e.closest('.head') }));
		const devW = D.reduce((w, x) => w + x.outerW, 0) + 22 * Math.max(0, D.length - 1);
		if (def.layout === 'grid') el.style.width = '822px';
		else if (def.layout === 'side') { el.style.width = `${devW + 16 + 420}px`; }
		else if (def.layout === 'solo') el.style.width = '600px';
		else el.style.width = `${devW}px`;
		const V = { ...def, tone, el, hd, heads, D, badges, leads, packets, rolls };
		P.push(V); return V;
	}

	// ------------------------------------------------------------------ the sounds, each at the moment it happens
	function events(ev) {
		for (const V of P) {
			const pan = V.side === 'r' ? 0.66 : 0.34;
			ev(V.t0, 'win', pan);
			V.heads.forEach((h) => { if (h.i > 0) ev(h.t, 'card', pan); });
			for (const D of V.D) {
				for (const L of D.layers.slice(1)) if (L.sound) ev(L.t, L.sound, pan);
				(D.cursor || []).forEach((c) => { if (c.click) ev(c.t, 'click', pan); });
				(D.taps || []).forEach((c) => { if (c.tap) ev(c.t, 'tap', pan); });
				for (const f of D.fx) {
					if (f.kind === 'typed') { const n = f.text.length; const step = f.dots ? 1 : 2; for (let i = 0; i < n; i += step) ev(lerp(f.t0, f.t1, i / n), 'key', pan); }
					if (f.kind === 'push') ev(f.t + 0.12, 'notif', pan);
					if (f.kind === 'veil' && f.sound !== false) ev(f.t, 'row', pan);
					if (f.kind === 'ring' && f.sound !== false) ev(f.t0 + 0.05, 'glint', pan);
					if (f.kind === 'strip') ev(f.t0, 'tick', pan);
				}
				if (D.urlType) { const n = D.url.length; for (let i = 0; i < n; i += 3) ev(lerp(D.urlType[0], D.urlType[1], i / n), 'key', pan); }
			}
			V.badges.forEach((b) => ev(b.t0, b.sound || 'pop', pan));
			V.packets.forEach((k) => { ev(k.t, 'token', pan); ev(k.t + k.dur, 'ping', k.dir === 'in' ? pan : 0.5); });
		}
	}

	// ------------------------------------------------------------------ one frame
	function crop(L, t) {
		const ks = L.keys || [{ t: -1e9, c: L.crop }];
		let i = 0; while (i < ks.length - 1 && t >= ks[i + 1].t) i++;
		if (i >= ks.length - 1) return ks[ks.length - 1].c;
		const a = ks[i], b = ks[i + 1];
		const u = b.ease === 'lin' ? clamp((t - a.t) / Math.max(1e-3, b.d ?? (b.t - a.t))) : eio((t - (b.t - (b.d ?? 0.6))) / (b.d ?? 0.6));
		return a.c.map((v, j) => lerp(v, b.c[j], u));
	}
	function curAt(list, t) {
		if (!list || !list.length || t < list[0].t - 0.35) return null;
		let i = 0; while (i < list.length - 1 && t >= list[i + 1].t) i++;
		const a = list[i], b = list[Math.min(i + 1, list.length - 1)];
		if (i === list.length - 1 || b.t <= a.t) return { x: a.x, y: a.y, k: i };
		const mv = b.move ?? Math.min(0.42, (b.t - a.t) * 0.8);
		const u = eio((t - (b.t - mv)) / mv);
		return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), k: i };
	}

	function update(t, shot, calm = () => 1) {
		for (const V of P) {
			const vis = t >= V.t0 - 0.02 && t <= V.t1 + Math.max(0.5, (V.fadeOut || 0) + 0.05);
			if (!vis) { V.el.style.opacity = 0; V.el.style.visibility = 'hidden'; V.leads.forEach((L) => [L.path, L.glow, L.dot, L.pingC].forEach((e) => (e.style.opacity = 0))); V.packets.forEach((k) => { k.g.style.opacity = 0; if (k.lab) k.lab.style.opacity = 0; }); continue; }
			V.el.style.visibility = 'visible';
			// cut 16: a panel may take longer to leave (fadeOut, its own seconds): it fades evenly while it slides, so a
			// bright window does not vanish in a few frames (the record's did, before the dark bus)
			const inn = spring(t - V.t0, 0.78, 13), out = eo((t - V.t1) / (V.fadeOut || 0.3));
			const sx = V.side === 'r' ? 1 : -1;
			const pw = V.el.offsetWidth, ph = V.el.offsetHeight;
			const x0 = V.x ?? (V.side === 'r' ? W - 64 - pw : 64);
			const yTop = V.top ?? (V.side === 'r' ? 70 : 178);
			// a panel with a badge under it sits high enough to keep the badge clear of the dock (64 px under the panel)
			const y0 = V.y ?? Math.round(Math.min(Math.max(yTop, lerp(yTop, 960 - ph, 0.5)), V.badges.length ? Math.max(yTop - 10, 905 - ph) : 1e9));
			const dx = sx * (90 * (1 - inn) + 70 * out);
			const rot = sx * (-16 * (1 - inn) + 12 * out);
			V.el.style.opacity = (clamp((t - V.t0) / 0.14) * (V.fadeOut ? 1 - clamp((t - V.t1) / V.fadeOut) : 1 - clamp(out * 1.6))).toFixed(3);
			V.el.style.transform = Math.abs(rot) > 0.05 ? `translate(${(x0 + dx).toFixed(1)}px, ${y0}px) perspective(1600px) rotateY(${rot.toFixed(2)}deg)` : `translate(${Math.round(x0 + dx)}px, ${y0}px)`;
			V.el.style.transformOrigin = V.side === 'r' ? '100% 50%' : '0 50%';
			// the card: its words arrive as it lands; a later beat swaps them
			let hi = 0; V.heads.forEach((h, i) => { if (t >= h.t) hi = i; });
			V.heads.forEach((h, i) => {
				const on = i === hi, k = clamp((t - h.t) / 0.3);
				h.el.style.display = on || (i === hi - 1 && t - V.heads[hi].t < 0.25) ? '' : 'none';
				if (on) { h.el.style.opacity = k.toFixed(3); h.el.style.transform = `translateY(${(10 * (1 - eo(k))).toFixed(1)}px)`; h.el.style.position = 'relative'; }
				else { h.el.style.opacity = (1 - clamp((t - V.heads[hi].t) / 0.2)).toFixed(3); h.el.style.position = 'absolute'; }
			});
			for (const D of V.D) drawDevice(D, t);
			V.badges.forEach((b) => {
				const k = spring(t - b.t0, 0.7, 16), a = Math.min(clamp((t - b.t0) / 0.18), b.t1 ? 1 - clamp((t - b.t1) / 0.25) : 1);
				b.el.style.opacity = (t < b.t0 ? 0 : a).toFixed(3); b.el.style.transform = `translateY(${(14 * (1 - k)).toFixed(1)}px) scale(${(0.94 + 0.06 * k).toFixed(3)})`;
				b.el.style.display = t < b.t0 - 0.05 || (b.t1 && t > b.t1 + 0.3) ? 'none' : '';
			});
			V.rolls.forEach((r) => { const h = V.heads.find((x) => x.el === r.h); const u = h ? eo((t - h.t - 0.15) / 0.9) : 1; r.e.textContent = Math.round(r.v * u).toLocaleString('en-IN'); });
			const vis1 = +V.el.style.opacity > 0.05 ? 1 : 0;
			V.leads.forEach((L, li) => {
				const Dv = V.D[L.dev];
				const r = Dv.el.getBoundingClientRect();
				const ex = V.side === 'r' ? r.left : r.right, ey = r.top + r.height * (L.y ?? 0.42);
				// the lead runs to the bracket on the part, when there is one, at the side facing the window
				const R_ = V.rect && !def_has_many(V) ? V.rect(t) : null;
				const A = R_ ? { x: V.side === 'r' ? R_.x1 : R_.x0, y: clamp(ey, R_.y0 + 14, R_.y1 - 14), z: 0 } : shot(L.anchor(t));
				const ok = A && A.z < 1 && A.x > -100 && A.x < W + 100 && A.y > -100 && A.y < H + 100;
				const lp = clamp((t - V.t0 - 0.25 - 0.1 * li) / 0.45), lo = ok ? Math.min(t > V.t0 + 0.25 ? 1 : 0, 1 - clamp(out * 1.6)) * vis1 * calm(L.anchor(t)) : 0;
				const mine = V.packets.filter((k) => k.lead === li);
				if (!ok || lo <= 0) { [L.path, L.glow, L.dot, L.pingC].forEach((e) => (e.style.opacity = 0)); mine.forEach((k) => { k.g.style.opacity = 0; if (k.lab) k.lab.style.opacity = 0; }); return; }
				const mx = (ex + A.x) / 2;
				const d = `M ${ex.toFixed(1)} ${ey.toFixed(1)} C ${mx.toFixed(1)} ${ey.toFixed(1)}, ${mx.toFixed(1)} ${A.y.toFixed(1)}, ${A.x.toFixed(1)} ${A.y.toFixed(1)}`;
				L.path.setAttribute('d', d); L.glow.setAttribute('d', d);
				const len = L.path.getTotalLength();
				[L.path, L.glow].forEach((p) => { p.setAttribute('stroke-dasharray', `${len.toFixed(1)} ${len.toFixed(1)}`); p.setAttribute('stroke-dashoffset', (len * (1 - eo(lp))).toFixed(1)); });
				L.path.style.opacity = (lo * 0.85).toFixed(3); L.glow.style.opacity = (lo * 0.9).toFixed(3);
				L.dot.setAttribute('cx', A.x.toFixed(1)); L.dot.setAttribute('cy', A.y.toFixed(1)); L.dot.style.opacity = (lo * clamp((lp - 0.85) / 0.15)).toFixed(3);
				let ping = -1;
				mine.forEach((k) => {
					const u = (t - k.t) / k.dur;
					const on = u > 0 && u < 1;
					k.g.style.opacity = on ? '1' : '0';
					if (on) { const q = eio(u); const p = L.path.getPointAtLength(len * (k.dir === 'in' ? 1 - q : q)); k.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
					}
					if (k.lab) {
						const a = t < k.ls ? 0 : Math.min(clamp((t - k.ls) / 0.16), 1 - clamp((t - k.le) / 0.22)), sp = spring(t - k.ls, 0.7, 16);
						if (a <= 0) k.lab.style.opacity = 0;
						else { // at the panel's outer edge, so a name on the inner of two devices never sits over the other
							const pr = V.el.getBoundingClientRect(), bw = k.lab.offsetWidth;
							const x = V.side === 'r' ? Math.min(ex, pr.left) - 18 - bw : Math.max(ex, pr.right) + 18, y = ey - 50 + 8 * (1 - sp);
							k.lab.style.opacity = (a * lo).toFixed(3); k.lab.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.94 + 0.06 * sp).toFixed(3)})`; }
					}
					if (u >= 1 && u < 1 + 0.55 / k.dur && k.dir !== 'in') ping = (u - 1) * k.dur / 0.55;
				});
				if (ping >= 0) { L.pingC.setAttribute('cx', A.x.toFixed(1)); L.pingC.setAttribute('cy', A.y.toFixed(1)); L.pingC.setAttribute('r', (8 + 34 * eo(ping)).toFixed(1)); L.pingC.style.opacity = ((1 - ping) * 0.9).toFixed(3); }
				else L.pingC.style.opacity = 0;
			});
		}
	}

	function drawDevice(D, t) {
		// which screen shows: the latest layer whose time has come, crossfading over a short beat
		let li = 0; D.layers.forEach((L, i) => { if (t >= L.t) li = i; });
		const L = D.layers[li];
		const c = crop(L, t), s = D.w / c[2];
		const place = (img, cc, op) => {
			const ss = D.w / cc[2];
			img.style.width = `${(img.naturalWidth * ss).toFixed(2)}px`; img.style.height = `${(img.naturalHeight * ss).toFixed(2)}px`;
			img.style.left = `${(-cc[0] * ss).toFixed(2)}px`; img.style.top = `${(-cc[1] * ss).toFixed(2)}px`; img.style.opacity = op.toFixed(3);
		};
		const f = li > 0 ? clamp((t - L.t) / (L.fade ?? 0.12)) : 1;
		D.layers.forEach((Lk, i) => {
			if (i === li) { place(Lk.img, crop(Lk, t), f); Lk.img.style.zIndex = 2; }
			else if (i === li - 1 && f < 1) { place(Lk.img, crop(Lk, t), 1); Lk.img.style.zIndex = 1; }
			else { Lk.img.style.opacity = 0; Lk.img.style.zIndex = 0; }
		});
		if (D.urlEl) {
			const full = D.url || '';
			const n = D.urlType ? Math.round(full.length * clamp((t - D.urlType[0]) / (D.urlType[1] - D.urlType[0]))) : full.length;
			D.urlEl.textContent = full.slice(0, n);
		}
		const toS = (x, y) => [(x - c[0]) * s, (y - c[1]) * s];
		for (const f of D.fx) {
			const vis = (f.t0 == null || t >= f.t0) && (f.kind === 'typed' ? f.until == null || t < f.until : f.t1 == null || t < f.t1) && (f.layer == null || f.layer === li);
			if (f.kind === 'veil') {
				const u = eo((t - f.t) / (f.d ?? 0.28));
				const [x, y] = toS(f.x, f.y);
				f.el.style.left = `${x.toFixed(1)}px`; f.el.style.top = `${y.toFixed(1)}px`; f.el.style.width = `${(f.w * s).toFixed(1)}px`; f.el.style.height = `${(f.h * s).toFixed(1)}px`;
				const shown = f.layer == null || f.layer === li;
				f.el.style.opacity = shown && t < f.t + (f.d ?? 0.28) ? (1 - u).toFixed(3) : 0;
				f.el.style.transform = f.dir === 'right' ? `scaleX(${(1 - u).toFixed(3)})` : `translateY(${(8 * u * s).toFixed(1)}px)`;
				f.el.style.transformOrigin = '100% 50%';
				continue;
			}
			if (!vis) { f.el.style.opacity = 0; continue; }
			const [x, y] = toS(f.x, f.y);
			if (f.kind === 'typed') {
				const n = Math.round(f.text.length * clamp((t - f.t0) / (f.t1 - f.t0)));
				f.el.style.left = `${x.toFixed(1)}px`; f.el.style.top = `${y.toFixed(1)}px`; f.el.style.font = `${f.weight || 500} ${(f.size * s).toFixed(2)}px/1 ${f.family || "'Geist'"}`;
				f.el.style.color = f.color || '#0f1a14'; f.el.style.letterSpacing = f.dots ? `${(3 * s).toFixed(1)}px` : '0';
				f.el.style.background = f.bg || '#fff'; f.el.style.width = `${(f.w * s).toFixed(1)}px`; f.el.style.height = `${(f.h * s).toFixed(1)}px`; f.el.style.marginTop = `${(-f.h * s / 2).toFixed(1)}px`;
				f.span.textContent = f.text.slice(0, n);
				const blink = t < f.t1 + 0.05 || Math.floor((t - f.t1) * 2.4) % 2 === 0;
				f.caret.style.opacity = f.caretUntil && t > f.caretUntil ? 0 : blink ? 1 : 0;
				f.caret.style.height = `${(f.size * 1.2 * s).toFixed(1)}px`;
				f.el.style.opacity = 1;
			} else if (f.kind === 'ov') {
				f.el.style.left = `${x.toFixed(1)}px`; f.el.style.top = `${y.toFixed(1)}px`; f.el.style.width = `${(f.w * s).toFixed(1)}px`; f.el.style.height = `${(f.h * s).toFixed(1)}px`;
				f.el.style.fontSize = `${((f.size || 32) * s).toFixed(2)}px`; f.el.style.borderRadius = `${((f.r || 0) * s).toFixed(1)}px`;
				f.el.style.background = f.bg || 'transparent'; f.el.style.color = f.color || '#fff';
				f.el.style.opacity = Math.min(clamp((t - f.t0) / 0.08), f.t1 ? clamp((f.t1 - t) / 0.12) : 1).toFixed(3);
				const sp = f.el.querySelector('.spin'); if (sp) sp.style.transform = `rotate(${((t - f.t0) * 540) % 360}deg)`;
			} else if (f.kind === 'push') {
				const k = spring(t - f.t, 0.74, 15);
				f.el.style.left = `${x.toFixed(1)}px`; f.el.style.top = `${(y - (1 - k) * 70 * s).toFixed(1)}px`; f.el.style.width = `${(f.w * s).toFixed(1)}px`; f.el.style.height = `${(f.h * s).toFixed(1)}px`;
				f.el.style.opacity = clamp((t - f.t) / 0.15).toFixed(3); f.el.style.transform = `scale(${(0.94 + 0.06 * k).toFixed(3)})`;
			} else if (f.kind === 'ring') {
				const k = eo((t - f.t0) / 0.35), pad = 10 * s + 18 * (1 - k);
				f.el.style.left = `${(x - pad).toFixed(1)}px`; f.el.style.top = `${(y - pad).toFixed(1)}px`; f.el.style.width = `${(f.w * s + 2 * pad).toFixed(1)}px`; f.el.style.height = `${(f.h * s + 2 * pad).toFixed(1)}px`;
				f.el.style.borderRadius = `${((f.r ?? 18) * s + 8).toFixed(1)}px`;
				f.el.style.opacity = Math.min(k, f.t1 ? clamp((f.t1 - t) / 0.25) : 1).toFixed(3);
			} else if (f.kind === 'strip') {
				const k = eo((t - f.t0) / 0.3);
				f.el.style.opacity = Math.min(k, f.t1 ? clamp((f.t1 - t) / 0.2) : 1).toFixed(3); f.el.style.transform = `translateY(${(16 * (1 - k)).toFixed(1)}px)`;
				const sp = f.el.querySelector('[data-type]');
				if (sp) { const full = sp.getAttribute('data-type'); sp.textContent = full.slice(0, Math.round(full.length * clamp((t - f.t0 - 0.1) / 0.45))); }
			}
		}
		// the pointer: it glides between its marks; a press dips it and spreads two rings
		const pointer = D.cur || D.tap;
		if (pointer) {
			const list = D.cursor || D.taps;
			const p = curAt(list, t);
			if (!p) { pointer.style.opacity = 0; D.ripples.forEach((r) => (r.style.opacity = 0)); return; }
			const [x, y] = toS(p.x, p.y);
			const lastClick = list.filter((q) => (q.click || q.tap) && q.t <= t).pop();
			const pr = lastClick ? (t - lastClick.t) / 0.16 : 9;
			const press = pr >= 0 && pr < 1 ? Math.sin(Math.PI * pr) : 0;
			const gone = list[list.length - 1].hide && t > list[list.length - 1].hide ? clamp((t - list[list.length - 1].hide) / 0.2) : 0;
			const a = clamp((t - (list[0].t - 0.35)) / 0.2) * (1 - gone);
			if (D.cur) { pointer.style.transform = `translate(${(x - 6).toFixed(1)}px, ${(y - 4).toFixed(1)}px) scale(${(1 - 0.14 * press).toFixed(3)})`; }
			else { const ts = 44; pointer.style.width = pointer.style.height = `${ts}px`; pointer.style.transform = `translate(${(x - ts / 2).toFixed(1)}px, ${(y - ts / 2).toFixed(1)}px) scale(${(1 - 0.22 * press).toFixed(3)})`; }
			pointer.style.opacity = a.toFixed(3);
			D.ripples.forEach((r, i) => {
				const u = lastClick ? (t - lastClick.t - 0.08 * i) / 0.6 : -1;
				if (u <= 0 || u >= 1) { r.style.opacity = 0; return; }
				const cx = toS(lastClick.x, lastClick.y), rr = 10 + 46 * eo(u);
				r.style.width = r.style.height = `${(2 * rr).toFixed(1)}px`; r.style.transform = `translate(${(cx[0] - rr).toFixed(1)}px, ${(cx[1] - rr).toFixed(1)}px)`;
				r.style.opacity = ((1 - u) * 0.9).toFixed(3);
			});
		}
	}

	function reset() { P.length = 0; root.innerHTML = ''; svg.querySelectorAll('.pv').forEach((e) => e.remove()); }
	const images = () => [...root.querySelectorAll('img')];
	return { add, events, update, reset, images, list: P };
}

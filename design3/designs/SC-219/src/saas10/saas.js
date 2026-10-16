// SC-219 (cut 9, and cut 10: nine AI agents; the Watcher is plain code): what Smart-Clearance is, condensed. The name turns the bin's figure into the recovery (−₹22,657 to
// ₹16,917), then rises to a header over what it is: agentic software as a service for the FMCG supply chain. Each
// brand's own workspace address lines up as the voice says "service"; the supply chain's three tiers arrive as the voice
// names them, each a photograph of the work (a brand's packing line, a distributor's counter, a kirana's delivery) with
// the agents that help it; the nine AI agents and the Watcher (plain code) ride the route that joins them. Nothing runs on its own clock: renderAt(t)
// draws scene time t, setCues(cues) takes the narration's word times and returns the scene's sounds ({events}).
(function () {
	const W = 1920, H = 1080;
	const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
	const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
	const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
	const lerp = (a, b, t) => a + (b - a) * t;
	const spring = (x, zeta = 0.62, w = 14) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
	const fade = (t, a, b, fi = 0.35, fo = 0.35) => Math.min(clamp((t - a) / fi), b == null ? 1 : clamp((b - t) / fo));
	const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
	const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
	function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
	const inr = (v) => Math.round(v).toLocaleString('en-IN');

	const ui = document.getElementById('ui'), bgEl = document.getElementById('bg');
	const brand = $(`<div id="brand"><div class="lockup"><img src="icon.svg"><b>Smart-Clearance</b></div>
		<div class="turns">turns <s>write-offs</s> into <em>recovery</em>.</div></div>`); ui.appendChild(brand);
	const lock = brand.querySelector('.lockup'), turns = brand.querySelector('.turns'), mark = brand.querySelector('img');
	const fig = $(`<div id="fig"><div class="v">−₹22,657</div><div class="l">written off, if the batch is destroyed</div>
		<div class="chip">${IC('trending-up')}<span>₹22,194 better than the bin</span></div></div>`); ui.appendChild(fig);
	const figV = fig.querySelector('.v'), figL = fig.querySelector('.l'), figChip = fig.querySelector('.chip');
	const kick = $(`<div class="kicker">Agentic<i></i>software as a service</div>`); ui.appendChild(kick);
	const head = $(`<div id="head">${'For the FMCG supply chain.'.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ')}</div>`); ui.appendChild(head);
	const headW = [...head.querySelectorAll('.w')];
	const tenants = $(`<div id="tenants"></div>`); ui.appendChild(tenants);
	const TEN = [['Every brand, its own workspace', null], ['munchly-smartclearance.web.app', ['M', '#d9662b']], ['kaveri-smartclearance.web.app', ['K', '#6b5fd6']],
		['nilgiri-smartclearance.web.app', ['N', '#16917f']], ['aravalli-smartclearance.web.app', ['A', '#b07a1f']]].map(([s, m]) => {
		const el = $(m ? `<div class="ten"><div class="m" style="background:${m[1]}">${m[0]}</div>${IC('lock')}${s}</div>` : `<div class="ten tag">${s}</div>`);
		tenants.appendChild(el); return el;
	});
	const CARDS = [
		{ img: 'card-brand.webp', n: '1', tier: 'Brands', b: 'FMCG brands', s: 'See every batch at risk; approve one plan.', ag: [['braces', 'Watcher, in code'], ['scale', 'Valuer'], ['route', 'Router']] },
		{ img: 'card-dist.webp', n: '2', tier: 'Distributors', b: 'Distributors', s: 'Send the label photo, sell to staff, end whole.', ag: [['scan-line', 'Vision'], ['file-text', 'Paperwork']] },
		{ img: 'card-ret.webp', n: '3', tier: 'Retailers', b: 'Retailers and kiranas', s: 'Order the packs, offered in their own language.', ag: [['send', 'Outreach'], ['store', 'Lister'], ['gavel', 'Negotiator']] },
	].map((c, i) => {
		const el = $(`<div class="card"><div class="ph"><img src="${c.img}"><div class="shade"></div><div class="sheen"></div>
			<div class="tier"><span class="n">${c.n}</span>${c.tier}</div></div>
			<div class="cap"><b>${c.b}</b><span>${c.s}</span><div class="ag">${c.ag.map(([ic, n]) => `<i>${IC(ic)}${n}</i>`).join('')}</div></div></div>`);
		ui.appendChild(el);
		return { ...c, el, img_: el.querySelector('.ph img'), sheen: el.querySelector('.sheen'), chips: [...el.querySelectorAll('.ag i')], x: 130 + i * 570, t0: 1e9 };
	});
	// the route under the cards, and the nine AI agents and the Watcher riding it
	const NS = 'http://www.w3.org/2000/svg';
	const svg = document.getElementById('route');
	const path = document.createElementNS(NS, 'path');
	const glowP = document.createElementNS(NS, 'path');
	const Y0 = 966;
	const d = `M 130 ${Y0} C 300 ${Y0 + 34}, 480 ${Y0 + 34}, 650 ${Y0} S 1050 ${Y0 - 34}, 1220 ${Y0} S 1600 ${Y0 + 34}, 1790 ${Y0}`;
	[glowP, path].forEach((p) => { p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round'); svg.appendChild(p); });
	glowP.setAttribute('stroke', 'rgba(52, 211, 128, 0.28)'); glowP.setAttribute('stroke-width', '12');
	path.setAttribute('stroke', '#5fd59a'); path.setAttribute('stroke-width', '3.5');
	const LEN = path.getTotalLength();
	[glowP, path].forEach((p) => p.setAttribute('stroke-dasharray', `${LEN} ${LEN}`));
	const BOTS = [['database', 'Data'], ['braces', 'Watcher'], ['scan-line', 'Vision'], ['scale', 'Valuer'], ['route', 'Router'], ['send', 'Outreach'],
		['store', 'Lister'], ['gavel', 'Negotiator'], ['file-text', 'Paperwork'], ['leaf', 'Impact']].map(([ic, n], i) => {
		const el = $(`<div class="bot${n === 'Watcher' ? ' code' : ''}" title="${n}">${IC(ic)}</div>`); ui.appendChild(el); return { el, i };
	});
	const agentsLbl = $(`<div class="agents">Nine AI agents, and the Watcher in plain code, at every step</div>`); ui.appendChild(agentsLbl);
	// the light: a slow glow that drifts, and specks of dust in it
	const lg = document.getElementById('light').getContext('2d');
	const R = rng(219);
	const specks = Array.from({ length: 60 }, () => ({ x: R() * W, y: R() * H, r: 1 + R() * 2.4, v: 4 + R() * 10, a: 0.15 + R() * 0.35 }));

	let C = null, EV = [];
	const ev = (t, kind, pan = 0.5) => EV.push({ t: +t.toFixed(3), kind, pan });
	const DEF = { i03: 1.15, turns: 2.0, write: 2.5, recovery: 3.6, b91: 4.6, agentic: 4.7, service: 5.8, fmcg: 6.6, supply: 7.3, brands: 8.6, distributors: 9.4, retailers: 10.5, end: 11.3 };
	window.setCues = (cues) => {
		const c = Object.assign({}, DEF, cues); C = c; EV = [];
		c.up = c.b91 - 0.3;                         // the name rises to a header as the second line begins
		ev(0.05, 'whoosh_in'); ev(c.i03 - 0.15, 'title'); ev(c.recovery - 0.05, 'glint'); ev(c.recovery + 0.25, 'badge', 0.6);
		ev(c.up, 'sweep');
		TEN.forEach((_, i) => { if (i) ev(c.service + 0.1 + 0.12 * i, 'pop', 0.25 + 0.12 * i); });
		[c.brands, c.distributors, c.retailers].forEach((tt, i) => { CARDS[i].t0 = c.fmcg - 0.05 + 0.2 * i; CARDS[i].lit = tt - 0.1; ev(CARDS[i].t0, 'card', [0.22, 0.5, 0.78][i]); ev(tt - 0.05, 'tick', [0.22, 0.5, 0.78][i]); });
		c.ride = c.distributors - 0.1; ev(c.ride, 'whoosh', 0.3);   // SC-228 (cut 17): the agents set off with the route, so they ride it inside the scene
		window.renderAt(0);
		return { events: EV, cues: c };
	};

	window.renderAt = async (t) => {
		const c = C;
		// the room: a slow push, the light rising behind the name
		bgEl.style.transform = `scale(${(1.04 + 0.05 * clamp(t / c.end)).toFixed(4)}) translateX(${(-14 * clamp(t / c.end)).toFixed(1)}px)`;
		lg.clearRect(0, 0, W, H);
		const glowA = 0.35 + 0.25 * fade(t, c.i03 - 0.2, null, 0.8) - 0.1 * clamp((t - c.up) / 1.0);
		const gx = lerp(820, 1120, clamp(t / c.end)), gy = lerp(420, 300, sm((t - c.up) / 1.2));
		const g = lg.createRadialGradient(gx, gy, 0, gx, gy, 900);
		g.addColorStop(0, `rgba(60, 170, 115, ${(0.28 * glowA).toFixed(3)})`); g.addColorStop(0.5, `rgba(30, 90, 62, ${(0.10 * glowA).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
		lg.fillStyle = g; lg.fillRect(0, 0, W, H);
		for (const s of specks) { const y = (s.y - t * s.v + H) % H; lg.fillStyle = `rgba(190, 240, 214, ${s.a * 0.6})`; lg.beginPath(); lg.arc(s.x + Math.sin(t * 0.5 + s.x) * 6, y, s.r, 0, 7); lg.fill(); }
		document.getElementById('light').style.opacity = 1;

		// the name: in at the middle, then up to a header
		const up = sm((t - c.up) / 0.9);
		const inE = spring(t - 0.02, 0.7, 11);
		const by = lerp(300, 52, up), bs = lerp(1, 0.46, up);
		brand.style.transform = `translateY(${(by + 30 * (1 - inE)).toFixed(1)}px) scale(${bs.toFixed(4)})`;
		brand.style.opacity = clamp((t - 0.02) / 0.25).toFixed(3);
		mark.style.transform = `rotate(${(-12 * (1 - inE)).toFixed(2)}deg) scale(${(0.85 + 0.15 * inE).toFixed(3)})`;
		turns.style.opacity = (fade(t, c.turns - 0.2, null, 0.35) * (1 - clamp((t - c.up) / 0.35))).toFixed(3);
		const strike = clamp((t - c.write - 0.05) / 0.35);
		turns.querySelector('s').style.textDecorationColor = `rgba(229, 92, 74, ${(0.9 * strike).toFixed(2)})`;
		// the bin's figure rolls into the recovery
		const fo = fade(t, c.write - 0.05, c.up + 0.25, 0.3, 0.3);
		fig.style.opacity = fo.toFixed(3);
		fig.style.transform = `translateY(${(520 + 18 * (1 - eo((t - c.write + 0.05) / 0.45)) - 60 * up).toFixed(1)}px)`;
		const r = sm((t - c.recovery + 0.05) / 0.7);
		if (r <= 0) { figV.textContent = '−₹' + inr(22657); figV.style.color = '#f08a7a'; figL.textContent = 'written off, if the batch is destroyed'; }
		else { const v = lerp(-22657, 16917, r); figV.textContent = (v < 0 ? '−₹' : '₹') + inr(Math.abs(v)); figV.style.color = r < 0.6 ? '#f0c27a' : '#9ff0c4'; figL.textContent = r < 0.5 ? 'written off, if the batch is destroyed' : 'recovered by the plan, the same batch'; }
		figChip.style.opacity = clamp((t - c.recovery - 0.3) / 0.3).toFixed(3);
		figChip.style.transform = `translateY(${(10 * (1 - eo((t - c.recovery - 0.3) / 0.4))).toFixed(1)}px)`;

		// what it is: the kicker, the line word by word
		kick.style.transform = `translateY(${(132 + 10 * (1 - eo((t - c.agentic) / 0.4))).toFixed(1)}px)`;
		kick.style.opacity = clamp((t - c.agentic + 0.05) / 0.35).toFixed(3);
		head.style.transform = 'translateY(166px)';
		headW.forEach((w, i) => { const e = spring(t - c.fmcg + 0.1 - 0.07 * i, 0.72, 14); w.style.opacity = clamp((t - c.fmcg + 0.1 - 0.07 * i) / 0.25).toFixed(3); w.style.transform = `translateY(${(20 * (1 - e)).toFixed(1)}px)`; });
		// each brand on its own address
		tenants.style.transform = 'translateY(244px)';
		TEN.forEach((el, i) => { const t0 = c.service + 0.1 + 0.12 * i; const e = spring(t - t0, 0.7, 14); el.style.opacity = clamp((t - t0) / 0.25).toFixed(3); el.style.transform = `translateY(${(12 * (1 - e)).toFixed(1)}px) scale(${(0.94 + 0.06 * e).toFixed(3)})`; });

		// the three tiers
		CARDS.forEach((cd, i) => {
			const e = spring(t - cd.t0, 0.7, 11);
			cd.el.style.opacity = clamp((t - cd.t0) / 0.3).toFixed(3);
			cd.el.style.transform = `translate(${cd.x}px, ${(346 + 60 * (1 - e)).toFixed(1)}px) scale(${(0.96 + 0.04 * e).toFixed(4)})`;
			const k = clamp((t - cd.t0) / Math.max(1, c.end - cd.t0));
			cd.img_.style.transform = `scale(${(1.1 - 0.06 * k).toFixed(4)}) translateX(${((i - 1) * -8 * k).toFixed(1)}px)`;
			const sp = (t - cd.lit) / 0.8;
			cd.sheen.style.opacity = sp > 0 && sp < 1 ? Math.sin(Math.PI * sp).toFixed(3) : 0;
			cd.sheen.style.left = `${lerp(-40, 120, clamp(sp)).toFixed(1)}%`;
			// named: its border lights and its agents arrive
			const lit = clamp((t - cd.lit) / 0.3);
			cd.el.style.borderColor = `rgba(${Math.round(lerp(255, 115, lit))}, ${Math.round(lerp(255, 201, lit))}, ${Math.round(lerp(255, 157, lit))}, ${(0.13 + 0.55 * lit).toFixed(3)})`;
			cd.chips.forEach((ch, j) => { const t0 = cd.lit + 0.15 + 0.12 * j; ch.style.opacity = clamp((t - t0) / 0.25).toFixed(3); ch.style.transform = `translateY(${(8 * (1 - eo((t - t0) / 0.3))).toFixed(1)}px)`; });
		});
		// the route draws on with the cards; the agents ride it, left to right
		const rp = clamp((t - c.fmcg - 0.4) / Math.max(0.8, c.retailers + 0.4 - c.fmcg - 0.4));
		[glowP, path].forEach((p) => p.setAttribute('stroke-dashoffset', (LEN * (1 - eo(rp))).toFixed(1)));
		BOTS.forEach((b) => {
			const t0 = c.ride + 0.07 * b.i;
			const q = clamp((t - t0) / 0.9);
			const target = (0.06 + 0.88 * b.i / 9);
			const s = eo(q) * target;
			const pt = path.getPointAtLength(LEN * s);
			b.el.style.opacity = clamp((t - t0) / 0.25).toFixed(3);
			b.el.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px) scale(${(0.7 + 0.3 * spring(t - t0, 0.6, 12)).toFixed(3)})`;
		});
		agentsLbl.style.transform = 'translateY(1016px)';
		agentsLbl.style.opacity = clamp((t - c.ride - 0.5) / 0.35).toFixed(3);
		// every photo decoded before the frame is taken
		await Promise.all(CARDS.map((cd) => (cd.img_.complete ? null : cd.img_.decode().catch(() => null))));
		return {};
	};

	const imgs = [...document.images];
	Promise.all([document.fonts.ready, ...imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onload = r; i.onerror = r; })))]).then(() => {
		window.setCues({}); window.pageReady = true;
	});
})();

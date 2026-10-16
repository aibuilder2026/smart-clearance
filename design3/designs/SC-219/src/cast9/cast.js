// SC-219 (cut 9): before the live demo, what it shows and who is in it. Two batches on two lanes, each starting from its
// pack: the Mango Drink's happy path and the Masala Chips' sad path, each person in the order they act, how each lane
// ends, and Neha's console, which set the brand up, beside both. Real photographs of the people (their portraits; the
// staff and the agency from their own scenes). Nothing runs on its own clock: renderAt(t) draws scene time t, and
// setCues(cues) takes the narration's word times and returns the scene's sounds ({events}).
(function () {
	const W = 1920, H = 1080;
	const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
	const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
	const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
	const lerp = (a, b, t) => a + (b - a) * t;
	const spring = (x, zeta = 0.62, w = 14) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
	const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
	const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
	const ui = document.getElementById('ui'), bgEl = document.getElementById('bg');
	const NS = 'http://www.w3.org/2000/svg', svg = document.getElementById('lines');

	const hdr = $(`<div class="hdr"><div class="k"><i></i>The live demo · on production</div><h1>${'Two batches. Two paths.'.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ')}</h1>
		<p>Recorded on the production apps, 13 Oct 2026.</p></div>`); ui.appendChild(hdr);
	const hk = hdr.querySelector('.k'), hw = [...hdr.querySelectorAll('.w')], hp = hdr.querySelector('p');
	const live = $(`<div class="live"><b></b>Live on production<span>· Cloud Run · Gemini</span></div>`); ui.appendChild(live);

	const LANES = [
		{ kind: 'happy', y: 430, pack: 'pack-mango.webp', tag: 'Happy path', b: 'Munchly Mango Drink 200 ml', s: 'MF-2410-118 · 1,580 packs · Hyderabad',
		  people: [['p-priya', 'Priya Deshmukh', 'Supply chain · Munchly'], ['p-lakshmi', 'Lakshmi Agencies', 'Distributor · Hyderabad'],
			['p-lakshmi-ganapathi', 'Sri Lakshmi Ganapathi Kirana', 'Kirana · one of 52'], ['p-staff', "The godown's staff", 'Staff sale · by UPI'],
			['p-meera', 'Meera · Feeding India', 'Food bank · Hyderabad']],
		  end: ['Sells through', '₹16,917', 'recovered · nothing wasted'] },
		{ kind: 'sad', y: 772, pack: 'pack-chips.webp', tag: 'Sad path', b: 'Munchly Masala Chips 150 g', s: 'MF-2409-117 · 1,360 packs · Nagpur',
		  people: [['p-rakesh', 'Rakesh Traders', 'Distributor · Nagpur'], ['p-ganesh', 'Shree Ganesh Kirana', 'Kirana · one of two that order'],
			['p-agrawal', 'Agrawal Wholesale', 'Buyer on ExpireSoon · Raipur'], ['p-agency', 'Orange City Enviro Services', 'Officer and two witnesses'],
			['p-priya', 'Priya Deshmukh', 'Her second yes']],
		  end: ['540 destroyed, proven', '₹11,702', 'recovered · Rakesh ends whole'] },
	].map((L) => {
		const batch = $(`<div class="batch ${L.kind}"><img src="${L.pack}"><div><span class="tag">${L.tag}</span><b>${L.b}</b><span>${L.s}</span></div></div>`); ui.appendChild(batch);
		const ppl = L.people.map(([img, n, r], i) => {
			const el = $(`<div class="person ${L.kind}"><div class="ph"><img src="${img}.webp"></div><b>${n}</b><span>${r}</span></div>`); ui.appendChild(el);
			const ring = $(`<div class="ring ${L.kind}"></div>`); ui.appendChild(ring);
			return { el, ring, x: 738 + i * 192, t0: 1e9 };
		});
		const end = $(`<div class="end ${L.kind}"><div class="k">${L.end[0]}</div><b>${L.end[1]}</b><span>${L.end[2]}</span></div>`); ui.appendChild(end);
		const line = document.createElementNS(NS, 'path');
		const d = `M 620 ${L.y} L 1612 ${L.y}`;
		line.setAttribute('d', d); line.setAttribute('fill', 'none'); line.setAttribute('stroke-width', '3'); line.setAttribute('stroke-linecap', 'round');
		line.setAttribute('stroke', L.kind === 'happy' ? 'rgba(95, 213, 154, 0.85)' : 'rgba(247, 192, 74, 0.85)');
		line.setAttribute('stroke-dasharray', '992 992'); svg.appendChild(line);
		// a light that runs the lane once it is drawn: the batch, through its people, to how it ends
		const run = document.createElementNS(NS, 'path'); run.setAttribute('d', d); run.setAttribute('fill', 'none'); run.setAttribute('stroke-width', '7'); run.setAttribute('stroke-linecap', 'round');
		run.setAttribute('stroke', L.kind === 'happy' ? 'rgba(200, 255, 225, 0.95)' : 'rgba(255, 236, 190, 0.95)'); run.setAttribute('stroke-dasharray', '90 2000'); run.style.opacity = 0; svg.appendChild(run);
		return { ...L, batch, ppl, end, line, run, t0: 1e9, tp: 1e9 };
	});
	const neha = $(`<div class="platform"><div class="ph"><img src="p-neha.webp"></div><b>Neha Kulkarni</b><span>Smart-Clearance staff</span><div class="pill">${IC('layout-dashboard')}Sets the brand up</div></div>`); ui.appendChild(neha);
	const branches = LANES.map((L) => {
		const p = document.createElementNS(NS, 'path');
		p.setAttribute('d', `M 214 600 C 250 600, 250 ${L.y}, 290 ${L.y}`); p.setAttribute('fill', 'none'); p.setAttribute('stroke-width', '2.5');
		p.setAttribute('stroke', 'rgba(138, 180, 248, 0.7)'); p.setAttribute('stroke-dasharray', '420 420'); svg.appendChild(p); return p;
	});

	let C = null, EV = [];
	const ev = (t, kind, pan = 0.5) => EV.push({ t: +t.toFixed(3), kind, pan });
	const DEF = { x01: 0.3, live: 0.9, production: 1.4, two: 2.2, batches: 2.6, happy: 3.4, sad: 4.4, people: 5.4, handle: 6.2, end: 8.0 };
	window.setCues = (cues) => {
		const c = Object.assign({}, DEF, cues); C = c; EV = [];
		ev(0.03, 'whoosh_in'); ev(c.x01, 'title'); ev(c.live - 0.05, 'badge', 0.85);
		LANES[0].t0 = Math.min(c.two - 0.15, c.live + 0.1); LANES[1].t0 = Math.min(c.batches - 0.1, c.live + 0.35);
		LANES[0].tp = c.happy - 0.25; LANES[1].tp = c.sad - 0.25;
		LANES.forEach((L, k) => {
			ev(L.t0, 'thump', 0.25);
			L.ppl.forEach((p, i) => { p.t0 = L.tp + 0.18 + 0.16 * i; ev(p.t0, 'pop', 0.35 + 0.1 * i); });
			L.te = L.tp + 0.18 + 0.16 * 5 + 0.1; ev(L.te, 'card', 0.85);
		});
		c.neha = Math.min(c.people - 0.2, c.end - 1.2); ev(c.neha, 'glint', 0.12);
		window.renderAt(0);
		return { events: EV, cues: c };
	};

	window.renderAt = async (t) => {
		const c = C;
		bgEl.style.transform = `scale(${(1.05 + 0.05 * clamp(t / c.end)).toFixed(4)}) translate(${(-16 * clamp(t / c.end)).toFixed(1)}px, ${(-6 * clamp(t / c.end)).toFixed(1)}px)`;
		// the header
		hk.style.opacity = clamp((t - c.x01 + 0.15) / 0.3).toFixed(3);
		hw.forEach((w, i) => { const t0 = c.x01 - 0.05 + 0.07 * i; const e = spring(t - t0, 0.72, 14); w.style.opacity = clamp((t - t0) / 0.25).toFixed(3); w.style.transform = `translateY(${(22 * (1 - e)).toFixed(1)}px)`; });
		hp.style.opacity = clamp((t - c.x01 - 0.5) / 0.35).toFixed(3);
		const le = spring(t - c.live + 0.05, 0.6, 13);
		live.style.opacity = clamp((t - c.live + 0.05) / 0.25).toFixed(3);
		live.style.transform = `scale(${(0.85 + 0.15 * le).toFixed(3)})`;
		live.querySelector('b').style.opacity = (0.55 + 0.45 * Math.abs(Math.sin(t * 2.6))).toFixed(3);
		// each lane: its pack drops in, its line draws, its people arrive along it, then how it ends
		LANES.forEach((L) => {
			const e = spring(t - L.t0, 0.6, 12);
			L.batch.style.opacity = clamp((t - L.t0) / 0.25).toFixed(3);
			L.batch.style.transform = `translate(${252 + 30 * (1 - e)}px, ${(L.y - 58).toFixed(1)}px)`;
			L.batch.querySelector('img').style.transform = `rotate(${(-10 * (1 - e) + 2 * Math.sin(t * 0.9)).toFixed(2)}deg) translateY(${(-26 * (1 - e)).toFixed(1)}px)`;
			const lp = clamp((t - L.tp) / 1.2);
			L.line.setAttribute('stroke-dashoffset', (992 * (1 - eo(lp))).toFixed(1));
			const rp = (t - L.tp - 1.15) / 1.3;
			L.run.style.opacity = rp > 0 && rp < 1 ? Math.sin(Math.PI * rp).toFixed(3) : 0;
			L.run.setAttribute('stroke-dashoffset', (-992 * eo(clamp(rp)) + 90).toFixed(1));
			L.ppl.forEach((p, i) => {
				const pe = spring(t - p.t0, 0.58, 13);
				p.el.style.opacity = clamp((t - p.t0) / 0.2).toFixed(3);
				const breathe = t > c.people ? 0.03 * Math.sin(Math.PI * clamp((t - c.people - 0.05 * i) / 0.5)) : 0;
				p.el.style.transform = `translate(${(p.x - 88).toFixed(1)}px, ${(L.y - 74 + 26 * (1 - pe)).toFixed(1)}px) scale(${(0.8 + 0.2 * pe + breathe).toFixed(4)})`;
				const rq = (t - p.t0 - 0.05) / 0.6;
				const rs = 148 + 60 * eo(clamp(rq));
				p.ring.style.opacity = rq > 0 && rq < 1 ? (0.9 * (1 - rq)).toFixed(3) : 0;
				p.ring.style.width = p.ring.style.height = `${rs.toFixed(1)}px`;
				p.ring.style.transform = `translate(${(p.x - rs / 2).toFixed(1)}px, ${(L.y - rs / 2).toFixed(1)}px)`;
			});
			const ee = spring(t - L.te, 0.65, 12);
			L.end.style.opacity = clamp((t - L.te) / 0.25).toFixed(3);
			L.end.style.transform = `translate(${(1630 + 24 * (1 - ee)).toFixed(1)}px, ${(L.y - 52).toFixed(1)}px)`;
		});
		// Neha's console: beside both lanes
		const ne = spring(t - c.neha, 0.6, 12);
		neha.style.opacity = clamp((t - c.neha) / 0.25).toFixed(3);
		neha.style.transform = `translate(${(14 - 24 * (1 - ne)).toFixed(1)}px, ${(534).toFixed(1)}px) scale(${(0.86 + 0.14 * ne).toFixed(3)})`;
		branches.forEach((p, k) => p.setAttribute('stroke-dashoffset', (420 * (1 - eo((t - c.neha - 0.2 - 0.1 * k) / 0.6))).toFixed(1)));
		await Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null))));
		return {};
	};

	const imgs = [...document.images];
	Promise.all([document.fonts.ready, ...imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onload = r; i.onerror = r; })))]).then(() => {
		window.setCues({}); window.pageReady = true;
	});
})();

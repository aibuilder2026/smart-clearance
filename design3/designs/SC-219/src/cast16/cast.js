// SC-227 (cut 16, from cut 15's cast15/): the title reads "Two journeys, live on production.", landing as the line
// "Today, we're going to demo two journeys, live on production: …" begins.
// SC-225 (cut 15, from SC-219 cut 10's cast10/): the brand's and the platform's people too, Priya and Neha, each on her
// own card under the brand as it settles into the tree.
// SC-219 (cut 10): before the live demo, what it shows, told as a tree on real photographs. Munchly Foods, the brand,
// stamped as imaginary (every name and figure in the demo is fictional); its two batches; their two different
// distributors, each with its own godown and kiranas; then each batch's path, with the people in it and how it ended.
// The brand arrives as the hero, then settles into the tree's first column as the frame takes in the rest. Nothing
// runs on its own clock: renderAt(t) draws scene time t, and setCues(cues) takes the narration's word times and
// returns the scene's sounds ({events}).
(function () {
	const W = 1920, H = 1080;
	const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
	const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
	const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
	const lerp = (a, b, t) => a + (b - a) * t;
	const spring = (x, zeta = 0.62, w = 14) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
	const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
	const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
	const ui = document.getElementById('ui'), bgEl = document.getElementById('bg'), worldEl = document.getElementById('world');
	const NS = 'http://www.w3.org/2000/svg', svg = document.getElementById('lines');

	// the header: two batches, two distributors, two paths, each pair as the voice reaches it
	const HW = [['Two', 'a'], ['batches.', 'a'], ['Two', 'b'], ['distributors.', 'b'], ['Two', ''], ['paths.', '']];
	const hdr = $(`<div class="hdr"><div class="k"><i></i>The live demo · on production</div><h1>${HW.map(([w, c]) => `<span class="w ${c}">${w}</span>`).join(' ')}</h1></div>`); ui.appendChild(hdr);
	const hk = hdr.querySelector('.k'), hw = [...hdr.querySelectorAll('.w')];
	const live = $(`<div class="live"><b></b>Live on production<span>· Cloud Run · Gemini</span></div>`); ui.appendChild(live);
	const lhero = $(`<div class="lhero"><h2><b></b>Two journeys, live on production.</h2><p>The production apps · Cloud Run · Gemini · 13 Oct 2026</p></div>`); ui.appendChild(lhero);

	// the tree: the brand; its two batches; their two distributors; each path
	const ROW = { happy: 322, sad: 712 };
	const brand = $(`<div class="card brand"><div class="ph"><img src="card-brand.webp"></div><div class="tx"><div class="k2">The brand · for this demo</div><h2>Munchly Foods</h2>
		<div class="s">Snacks and drinks, Pune. Every name and figure here is fictional.</div>
		<div class="url">${IC('globe')}munchly-smartclearance.web.app</div></div></div>`); ui.appendChild(brand);
	const stamp = $(`<div class="stamp">Imaginary brand<small>fictional data</small></div>`); ui.appendChild(stamp);
	const BATCH = [
		{ kind: 'happy', img: 'pack-mango.webp', k: 'MF-2410-118', b: 'Munchly Mango Drink 200 ml', s: '1,580 packs at risk · 22 days left' },
		{ kind: 'sad', img: 'pack-chips.webp', k: 'MF-2409-117', b: 'Munchly Masala Chips 150 g', s: '1,360 packs at risk · 47 days left' },
	].map((o) => { const el = $(`<div class="card batch ${o.kind}"><img src="${o.img}"><div><div class="k2">${o.k}</div><b>${o.b}</b><span>${o.s}</span></div></div>`); ui.appendChild(el); return { ...o, el, t0: 1e9 }; });
	const DIST = [
		{ kind: 'happy', img: 'p-lakshmi.webp', k: 'Distributor · Hyderabad', b: 'Lakshmi Agencies', s: 'Begum Bazaar godown · 58 kiranas' },
		{ kind: 'sad', img: 'p-rakesh.webp', k: 'Distributor · Nagpur', b: 'Rakesh Traders', s: 'Kalamna Market godown · 38 kiranas' },
	].map((o) => { const el = $(`<div class="card dist ${o.kind}"><img src="${o.img}"><div><div class="k2">${o.k}</div><b>${o.b}</b><span>${o.s}</span></div></div>`); ui.appendChild(el); return { ...o, el, t0: 1e9 }; });
	// the people: Munchly's own, and the platform's, under the brand
	const PEOPLE = [
		{ cls: 'own', img: 'p-priya.webp', k: 'Munchly · supply chain', b: 'Priya Deshmukh', s: 'tracks every batch, approves each plan' },
		{ cls: 'plat', img: 'p-neha.webp', k: 'Smart-Clearance · console', b: 'Neha Kulkarni', s: 'sets the brand up: data, people, agents' },
	].map((o) => { const el = $(`<div class="card dist person ${o.cls}"><img src="${o.img}"><div><div class="k2">${o.k}</div><b>${o.b}</b><span>${o.s}</span></div></div>`); ui.appendChild(el); return { ...o, el, t0: 1e9 }; });
	const PATH = [
		{ kind: 'happy', tag: 'Happy path', fig: '₹16,917', out: 'recovered · sold through, nothing wasted',
		  ppl: [['p-lakshmi-ganapathi', 'Sri Lakshmi Ganapathi Kirana', 'one of 52 kiranas'], ['p-staff', "The godown's staff", 'a staff sale, by UPI'], ['p-meera', 'Feeding India', 'a donation']] },
		{ kind: 'sad', tag: 'Sad path', fig: '₹11,702', out: 'recovered · 540 packs destroyed, with proof',
		  ppl: [['p-ganesh', 'Shree Ganesh Kirana', 'one of two that order'], ['p-agrawal', 'Agrawal Wholesale', 'a buyer on ExpireSoon'], ['p-agency', 'Orange City Enviro', 'destroys, with proof']] },
	].map((o) => {
		const el = $(`<div class="card path ${o.kind}"><div class="top"><span class="tag">${o.tag}</span></div>
			<div class="ppl">${o.ppl.map(([img, n, r]) => `<div class="pp"><img src="${img}.webp"><b>${n}</b><span>${r}</span></div>`).join('')}</div>
			<div class="out"><b>${o.fig}</b><span>${o.out}</span></div></div>`);
		ui.appendChild(el);
		return { ...o, el, pps: [...el.querySelectorAll('.pp')], outEl: el.querySelector('.out'), t0: 1e9 };
	});
	// the lines between them: the brand to each batch, each batch to its distributor, each distributor to its path
	const line = (d, kind, w = 3) => {
		const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke-width', String(w)); p.setAttribute('stroke-linecap', 'round');
		p.setAttribute('stroke', kind === 'sad' ? 'rgba(247, 192, 74, 0.85)' : 'rgba(95, 213, 154, 0.85)'); svg.appendChild(p);
		const L = p.getTotalLength(); p.setAttribute('stroke-dasharray', `${L} ${L}`); p.setAttribute('stroke-dashoffset', String(L));
		const run = document.createElementNS(NS, 'path'); run.setAttribute('d', d); run.setAttribute('fill', 'none'); run.setAttribute('stroke-width', String(w + 4)); run.setAttribute('stroke-linecap', 'round');
		run.setAttribute('stroke', kind === 'sad' ? 'rgba(255, 236, 190, 0.95)' : 'rgba(205, 255, 228, 0.95)'); run.setAttribute('stroke-dasharray', `70 ${L + 200}`); run.style.opacity = 0; svg.appendChild(run);
		return { p, run, L, t0: 1e9, dur: 0.55 };
	};
	const BX = 542, DX = 982, PX = 1416, BW = 376, DW = 378;
	const LN = {
		bh: line(`M 476 520 C 520 520, 512 ${ROW.happy}, ${BX} ${ROW.happy}`, 'happy'), bs: line(`M 476 520 C 520 520, 512 ${ROW.sad}, ${BX} ${ROW.sad}`, 'sad'),
		dh: line(`M ${BX + BW} ${ROW.happy} L ${DX} ${ROW.happy}`, 'happy'), ds: line(`M ${BX + BW} ${ROW.sad} L ${DX} ${ROW.sad}`, 'sad'),
		ph: line(`M ${DX + DW} ${ROW.happy} L ${PX} ${ROW.happy}`, 'happy'), ps: line(`M ${DX + DW} ${ROW.sad} L ${PX} ${ROW.sad}`, 'sad'),
		lh: line(`M 476 520 C 520 520, 512 ${ROW.happy}, ${BX} ${ROW.happy} L ${PX} ${ROW.happy}`, 'happy', 2), ls: line(`M 476 520 C 520 520, 512 ${ROW.sad}, ${BX} ${ROW.sad} L ${PX} ${ROW.sad}`, 'sad', 2),
	};
	[LN.lh, LN.ls].forEach((l) => { l.p.style.opacity = 0; });      // only their running light shows

	let C = null, EV = [];
	const ev = (t, kind, pan = 0.5) => EV.push({ t: +t.toFixed(3), kind, pan });
	const DEF = { x: 0.25, live: 0.33, production: 0.9, munchly: 2.0, imaginary: 3.4, brand: 4.0, two: 5.1, batches: 5.3, different: 6.3, distributors: 6.7, one: 7.85, happy: 8.25, sad: 9.45, end: 11.1 };
	let BR = {};
	window.setCues = (cues) => {
		const c = Object.assign({}, DEF, cues); C = c; EV = [];
		ev(0.03, 'whoosh_in'); ev(c.x + 0.05, 'title'); ev(c.live - 0.08, 'glint', 0.5);
		BR = { t0: c.munchly - 0.2, stamp: c.imaginary - 0.05, glide: c.two - 0.2 };
		ev(BR.t0, 'thump', 0.4); ev(BR.stamp, 'stamp', 0.45); ev(BR.glide, 'whoosh', 0.4);
		LN.bh.t0 = c.two + 0.05; LN.bs.t0 = c.two + 0.15;
		BATCH[0].t0 = c.batches - 0.05; BATCH[1].t0 = c.batches + 0.12;
		LN.dh.t0 = c.different - 0.25; LN.ds.t0 = c.different - 0.15;
		DIST[0].t0 = c.distributors - 0.3; DIST[1].t0 = c.distributors - 0.12;
		LN.ph.t0 = c.one - 0.3; PATH[0].t0 = c.one - 0.15;
		const ts = Math.max(c.one + 0.95, c.sad - 0.6);
		LN.ps.t0 = ts - 0.15; PATH[1].t0 = ts;
		LN.lh.t0 = c.happy + 0.1; LN.lh.dur = 1.0; LN.ls.t0 = ts + 0.55; LN.ls.dur = 1.0;
		PEOPLE[0].t0 = BR.glide + 0.85; PEOPLE[1].t0 = BR.glide + 1.05;
		[...BATCH, ...DIST, ...PEOPLE].forEach((o, i) => ev(o.t0, 'pop', 0.3 + 0.08 * i));
		PATH.forEach((o) => { ev(o.t0, 'card', 0.75); o.pps.forEach((_, i) => ev(o.t0 + 0.18 + 0.12 * i, 'pop', 0.6 + 0.1 * i)); ev(o.t0 + 0.65, 'badge', 0.8); });
		window.renderAt(0);
		return { events: EV, cues: c };
	};

	function show(el, x, y, t, t0, s = 1, dx = 22) {
		const e = spring(t - t0, 0.64, 13);
		el.style.opacity = clamp((t - t0) / 0.22).toFixed(3);
		el.style.transform = `translate(${(x + dx * (1 - e)).toFixed(1)}px, ${(y + 8 * (1 - e)).toFixed(1)}px) scale(${(s * (0.94 + 0.06 * e)).toFixed(4)})`;
	}
	window.renderAt = async (t) => {
		const c = C;
		const end = c.end;
		bgEl.style.transform = `scale(${(1.05 + 0.05 * clamp(t / end)).toFixed(4)}) translate(${(-16 * clamp(t / end)).toFixed(1)}px, ${(-6 * clamp(t / end)).toFixed(1)}px)`;
		// a slow pull back as the tree grows
		const ws = lerp(1.05, 1.0, eio((t - BR.glide) / 1.6));
		worldEl.style.transform = `translate(${((1 - ws) * W * 0.42).toFixed(1)}px, ${((1 - ws) * H * 0.5).toFixed(1)}px) scale(${ws.toFixed(4)})`;
		// the header and the live badge
		hk.style.opacity = clamp((t - c.x + 0.1) / 0.3).toFixed(3);
		const ht = [c.two, c.two + 0.12, c.different - 0.05, c.distributors, c.one, c.one + 0.12];
		hw.forEach((w, i) => { const e = spring(t - ht[i], 0.72, 14); w.style.opacity = clamp((t - ht[i]) / 0.22).toFixed(3); w.style.transform = `translateY(${(24 * (1 - e)).toFixed(1)}px)`; });
		// the title opens the scene, then the camera pushes through it (it grows, softens and goes) onto the brand behind
		const lh0 = c.live - 0.1, lh1 = BR.t0 - 0.12;
		const li = spring(t - lh0, 0.66, 11), lo = eio((t - lh1) / 0.45);
		lhero.style.opacity = (clamp((t - lh0) / 0.25) * (1 - lo) ** 1.4).toFixed(3);
		lhero.style.transform = `translate(0px, ${(420 + 26 * (1 - li) - lo * 60).toFixed(1)}px) scale(${(lerp(0.94, 1, li) * lerp(1, 1.5, lo)).toFixed(4)})`;
		lhero.style.filter = lo > 0 ? `blur(${(lo * 7).toFixed(2)}px)` : 'none';
		lhero.style.transformOrigin = '50% 50%';
		lhero.querySelector('b').style.opacity = (0.55 + 0.45 * Math.abs(Math.sin(t * 2.6))).toFixed(3);
		const le = spring(t - lh1 - 0.15, 0.6, 13);
		live.style.opacity = clamp((t - lh1 - 0.15) / 0.25).toFixed(3);
		live.style.transform = `scale(${(0.85 + 0.15 * le).toFixed(3)})`;
		live.querySelector('b').style.opacity = (0.55 + 0.45 * Math.abs(Math.sin(t * 2.6))).toFixed(3);
		// the brand: the hero first, centred and large, then into the tree's first column
		const g = eio((t - BR.glide) / 0.8);
		const bx = lerp(660, 72, g), by = lerp(214, 300, g), bs = lerp(1.5, 1.0, g);
		const be = spring(t - BR.t0 + 0.06, 0.62, 12);
		brand.style.opacity = clamp((t - BR.t0 + 0.06) / 0.3).toFixed(3);
		brand.style.transform = `translate(${(bx + 0.5 * 400 * bs * 0.12 * (1 - be)).toFixed(1)}px, ${(by + 40 * (1 - be)).toFixed(1)}px) scale(${(bs * (0.88 + 0.12 * be)).toFixed(4)})`;
		// the stamp: it lands on the brand's photograph as the voice says "imaginary"
		const sp = (t - BR.stamp) / 0.2;
		const ss = sp <= 0 ? 0 : sp < 1 ? lerp(2.1, 0.94, eo(sp)) : 0.94 + 0.06 * spring(t - BR.stamp - 0.2, 0.5, 20);
		stamp.style.opacity = sp <= 0 ? 0 : Math.min(1, sp * 1.6).toFixed(3);
		stamp.style.transform = `translate(${(bx + bs * 150).toFixed(1)}px, ${(by + 30 * (1 - be) + bs * 92).toFixed(1)}px) rotate(-7deg) scale(${(ss * bs).toFixed(4)})`;
		stamp.style.transformOrigin = '50% 50%';
		// the lines draw on; a light runs each lane once its path is shown
		for (const l of Object.values(LN)) {
			const pr = eo((t - l.t0) / l.dur);
			if (l !== LN.lh && l !== LN.ls) l.p.setAttribute('stroke-dashoffset', (l.L * (1 - pr)).toFixed(1));
			const rp = (t - l.t0) / l.dur;
			if (l === LN.lh || l === LN.ls) {
				l.run.style.opacity = rp > 0 && rp < 1 ? Math.sin(Math.PI * rp).toFixed(3) : 0;
				l.run.setAttribute('stroke-dashoffset', (-(l.L) * eo(clamp(rp)) + 70).toFixed(1));
			}
		}
		// the batches, the distributors, the paths
		BATCH.forEach((o) => show(o.el, BX, ROW[o.kind] - 62, t, o.t0));
		DIST.forEach((o) => show(o.el, DX, ROW[o.kind] - 62, t, o.t0));
		PEOPLE.forEach((o, i) => show(o.el, 72, 684 + 128 * i, t, o.t0, 1, 0));
		PATH.forEach((o) => {
			show(o.el, PX, ROW[o.kind] - 116, t, o.t0);
			o.pps.forEach((p, i) => { const t0 = o.t0 + 0.18 + 0.12 * i, e = spring(t - t0, 0.58, 13); p.style.opacity = clamp((t - t0) / 0.2).toFixed(3); p.style.transform = `translateY(${(14 * (1 - e)).toFixed(1)}px) scale(${(0.86 + 0.14 * e).toFixed(3)})`; });
			const ot = o.t0 + 0.65, oe = spring(t - ot, 0.65, 12);
			o.outEl.style.opacity = clamp((t - ot) / 0.25).toFixed(3); o.outEl.style.transform = `translateX(${(16 * (1 - oe)).toFixed(1)}px)`;
		});
		await Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null))));
		return {};
	};

	const imgs = [...document.images];
	Promise.all([document.fonts.ready, ...imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onload = r; i.onerror = r; })))]).then(() => {
		window.setCues({}); window.pageReady = true;
	});
})();

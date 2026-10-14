// SC-205: a virtual clock for frame-exact captures. Timers, intervals, animation frames, performance.now, Date and
// the Web Animations (CSS transitions and animations, element.animate) all follow window.__vt; it follows real time
// until __vt.follow is set false, then moves only by __vt.step(ms).
(() => {
	const RN = performance.now.bind(performance);
	const RD = Date.now.bind(Date);
	const RRAF = window.requestAnimationFrame.bind(window);
	const vt = { now: RN(), follow: true, timers: new Map(), rafs: new Map(), id: 1, base: RD() - RN(), seen: new WeakMap(), done: new WeakSet() };
	window.__vt = vt;
	performance.now = () => vt.now;
	const OD = Date;
	function VDate(...a) {
		if (!(this instanceof VDate)) return new OD(vt.base + vt.now).toString();
		return a.length ? new OD(...a) : new OD(vt.base + vt.now);
	}
	VDate.prototype = OD.prototype;
	VDate.now = () => vt.base + vt.now;
	VDate.parse = OD.parse;
	VDate.UTC = OD.UTC;
	window.Date = VDate;
	window.setTimeout = (fn, ms = 0, ...args) => {
		const id = vt.id++;
		vt.timers.set(id, { at: vt.now + Math.max(0, +ms || 0), fn, args, every: 0 });
		return id;
	};
	window.setInterval = (fn, ms = 0, ...args) => {
		const id = vt.id++;
		const every = Math.max(1, +ms || 0);
		vt.timers.set(id, { at: vt.now + every, fn, args, every });
		return id;
	};
	window.clearTimeout = window.clearInterval = (id) => void vt.timers.delete(id);
	window.requestAnimationFrame = (fn) => {
		const id = vt.id++;
		vt.rafs.set(id, fn);
		return id;
	};
	window.cancelAnimationFrame = (id) => void vt.rafs.delete(id);
	const yieldTask = () =>
		new Promise((r) => {
			const c = new MessageChannel();
			c.port1.onmessage = () => r();
			c.port2.postMessage(0);
		});
	const due = (until) => {
		let best = null;
		for (const e of vt.timers) if (e[1].at <= until && (!best || e[1].at < best[1].at)) best = e;
		return best;
	};
	const call = (f, args) => {
		try {
			typeof f === 'function' ? f(...args) : (0, eval)(String(f));
		} catch (e) {
			console.error(e);
		}
	};
	vt.anims = () => {
		for (const a of document.getAnimations()) {
			let s = vt.seen.get(a);
			if (s === undefined) {
				s = vt.now - (a.currentTime || 0);
				vt.seen.set(a, s);
				try {
					a.pause();
				} catch {}
			}
			if (vt.done.has(a)) continue;
			try {
				const end = a.effect?.getComputedTiming?.().endTime;
				if (Number.isFinite(end) && vt.now - s >= end) {
					vt.done.add(a);
					a.finish(); // fires finish, so Svelte's transitions and their outros complete
				} else a.currentTime = Math.max(0, vt.now - s);
			} catch {}
		}
	};
	vt.step = async (ms) => {
		const until = vt.now + ms;
		for (let g = 0; g < 5000; g++) {
			const e = due(until);
			if (!e) break;
			const [id, t] = e;
			vt.now = Math.max(vt.now, t.at);
			if (t.every) t.at += t.every;
			else vt.timers.delete(id);
			call(t.fn, t.args);
			await yieldTask();
		}
		vt.now = until;
		const list = [...vt.rafs];
		vt.rafs.clear();
		for (const [, f] of list) call(f, [vt.now]);
		await yieldTask();
		vt.anims();
	};
	let busy = false;
	const loop = async () => {
		if (vt.follow && !busy) {
			busy = true;
			const target = RN();
			if (target > vt.now) await vt.step(target - vt.now);
			busy = false;
		}
		RRAF(loop);
	};
	RRAF(loop);
})();

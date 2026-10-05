// The town's gestures (design3/site/town.jsx useGestures): drag or swipe, pinch, Ctrl-scroll (a trackpad's pinch) and
// double-click. A drag that starts on a node still pans, and then the node's click is swallowed. Plain scrolling stays
// the page's; on touch screens the stage leaves vertical swipes to the page (touch-action: pan-y).
import type { Camera, View } from './camera';

export function gestures(el: HTMLElement, cam: Camera, onUser: () => void) {
	const pts = new Map<number, [number, number]>();
	let drag: { x: number; y: number; t: View } | null = null;
	let pinch: { d: number; m: [number, number]; t: View } | null = null;
	let moved = false;
	const local = (x: number, y: number): [number, number] => {
		const r = el.getBoundingClientRect();
		return [x - r.left, y - r.top];
	};
	const two = () => {
		const [a, b] = [...pts.values()];
		return { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: local((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) };
	};
	const down = (e: PointerEvent) => {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		pts.set(e.pointerId, [e.clientX, e.clientY]);
		if (pts.size === 1) {
			moved = false;
			drag = { x: e.clientX, y: e.clientY, t: cam.t() };
		}
		if (pts.size === 2) {
			pinch = { ...two(), t: cam.t() };
			drag = null;
		}
	};
	const move = (e: PointerEvent) => {
		if (!pts.has(e.pointerId)) return;
		pts.set(e.pointerId, [e.clientX, e.clientY]);
		if (pinch && pts.size >= 2) {
			const s = two();
			if (!moved) {
				moved = true;
				onUser();
			}
			cam.zoomAt(((s.d / pinch.d) * pinch.t.z) / cam.t().z, pinch.m[0], pinch.m[1], false);
			pinch.d = s.d;
			pinch.t = cam.t();
			return;
		}
		if (!drag) return;
		const dx = e.clientX - drag.x,
			dy = e.clientY - drag.y;
		if (!moved) {
			if (Math.hypot(dx, dy) < 6) return;
			moved = true;
			onUser();
			el.classList.add('dragging');
			try {
				el.setPointerCapture(e.pointerId);
			} catch {
				/* the pointer has gone */
			}
		}
		cam.drag(drag.t, dx, dy);
	};
	const up = (e: PointerEvent) => {
		pts.delete(e.pointerId);
		if (pts.size < 2) pinch = null;
		if (pts.size === 1) {
			const [p] = [...pts.values()];
			drag = { x: p[0], y: p[1], t: cam.t() };
		}
		if (pts.size === 0) {
			drag = null;
			el.classList.remove('dragging');
		}
	};
	const click = (e: MouseEvent) => {
		if (moved) {
			e.stopPropagation();
			e.preventDefault();
			moved = false;
		}
	};
	const wheel = (e: WheelEvent) => {
		if (!e.ctrlKey) return;
		e.preventDefault();
		onUser();
		const [x, y] = local(e.clientX, e.clientY);
		cam.zoomAt(Math.exp(-e.deltaY * 0.01), x, y, false);
	};
	const dbl = (e: MouseEvent) => {
		if ((e.target as Element).closest('button')) return;
		onUser();
		const [x, y] = local(e.clientX, e.clientY),
			z = cam.t().z;
		cam.zoomAt(z >= 2.2 ? 1 / z : 1.7, x, y, true);
	};
	el.addEventListener('pointerdown', down);
	window.addEventListener('pointermove', move);
	window.addEventListener('pointerup', up);
	window.addEventListener('pointercancel', up);
	el.addEventListener('click', click, true);
	el.addEventListener('wheel', wheel, { passive: false });
	el.addEventListener('dblclick', dbl);
	return () => {
		el.removeEventListener('pointerdown', down);
		window.removeEventListener('pointermove', move);
		window.removeEventListener('pointerup', up);
		window.removeEventListener('pointercancel', up);
		el.removeEventListener('click', click, true);
		el.removeEventListener('wheel', wheel);
		el.removeEventListener('dblclick', dbl);
	};
}

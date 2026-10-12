<script lang="ts">
	import { animate } from 'motion';
	import { cx } from '../../../cx';
	import { fmt } from '../../../format';
	import { prefersReducedMotion } from '../../../motion';
	import type { Swing } from '../../swing';

	// the bridge (SC-195; screens/brand.jsx SwingBridge): from the P&L if the batch were destroyed to the P&L with the
	// plan, a step for each exit and one for what was not paid; green rises, clay falls, the two ends stand on zero. The
	// bars grow once (420 ms, 70 ms apart), at once under reduced motion
	let { w }: { w: Swing } = $props();
	type Step = { k: string; v: number; end?: boolean; tone: string; soft?: boolean; from: number; to: number };
	const bars = $derived.by(() => {
		const steps = [{ k: 'If destroyed', v: -w.wo.total, end: true, tone: 'gone' }]
			.concat(w.exits.map((e) => ({ k: e.name, v: e.net, end: false, tone: e.net < 0 ? 'gone' : 'kept' })))
			.concat([
				{ k: 'Not paid', v: w.notPaid, end: false, tone: 'kept' },
				{ k: 'With the plan', v: w.pnl, end: true, tone: 'plan' }
			]);
		let run = 0;
		return steps.map((st): Step => {
			if (st.end) {
				run = st.v;
				return { ...st, from: 0, to: st.v };
			}
			const b = { ...st, soft: st.k === 'Not paid', from: run, to: run + st.v };
			run += st.v;
			return b;
		});
	});
	const W = 436,
		H = 250,
		top = 20,
		bot = 62;
	const lo = $derived(Math.min(0, ...bars.map((b) => Math.min(b.from, b.to))) * 1.06);
	const hi = $derived(Math.max(0, ...bars.map((b) => Math.max(b.from, b.to))) + Math.abs(lo) * 0.14);
	const bw = $derived(Math.min(40, (W - 12 * (bars.length + 1)) / bars.length));
	const gap = $derived((W - bars.length * bw) / (bars.length + 1));
	const y = (v: number) => top + ((hi - v) / (hi - lo)) * (H - top - bot);
	const words = (k: string) => (k.includes(' ') ? [k.slice(0, k.indexOf(' ')), k.slice(k.indexOf(' ') + 1)] : [k]);
	const label = (b: Step) => (b.v > 0 && !b.end ? '+' : '') + fmt.inr(Math.round(b.v));
	function grow(node: SVGRectElement, i: number) {
		if (prefersReducedMotion.current) return;
		node.style.transformBox = 'fill-box';
		node.style.transformOrigin = node.dataset.up === '1' ? 'bottom' : 'top';
		animate(node, { scaleY: [0, 1] }, { duration: 0.42, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] });
	}
</script>

<figure
	class="sw-bridge"
	role="img"
	aria-label="A bridge from {fmt.inr2(-w.wo.total)} if destroyed to {fmt.inr2(w.pnl)} with the plan: {fmt.inr2(
		w.swing
	)} better"
>
	<svg viewBox="0 0 {W} {H}" aria-hidden="true">
		<line x1="0" x2={W} y1={y(0)} y2={y(0)} class="zero" />
		{#each bars as b, i (b.k)}
			{@const x = gap + i * (bw + gap)}
			{@const y0 = y(Math.max(b.from, b.to))}
			{@const h = Math.max(2, Math.abs(y(b.from) - y(b.to)))}
			{@const under = (b.v < 0 && !b.end) || (b.end && b.v < 0 && h > 40)}
			{#if i > 0}<line
					x1={x - gap}
					x2={x}
					y1={y(b.end ? b.to : b.from)}
					y2={y(b.end ? b.to : b.from)}
					class="link"
				/>{/if}
			<rect
				{x}
				y={y0}
				width={bw}
				height={h}
				rx="5"
				class={cx('bar', b.tone, b.soft && 'soft')}
				data-up={b.end ? (b.v < 0 ? '0' : '1') : b.v < 0 ? '0' : '1'}
				use:grow={i}
			/>
			<text x={x + bw / 2} y={under ? y(b.to) + 15 : y0 - 7} class={cx('val', b.tone)} text-anchor="middle"
				>{label(b)}</text
			>
			{#each words(b.k) as t, j (j)}<text x={x + bw / 2} y={H - 26 + j * 13} class="lab" text-anchor="middle">{t}</text
				>{/each}
		{/each}
	</svg>
	<figcaption>
		Not paid: what destroying would have cost beyond the stock (the GST credit, disposal and EPR).
	</figcaption>
</figure>

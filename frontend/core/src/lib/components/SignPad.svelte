<script lang="ts" module>
	/** a signature as the pad keeps it (SC-183): its strokes in the pad's own 640 x 220 box */
	export type PadInk = { box: [number, number]; strokes: [number, number][][] };
	export const PAD: [number, number] = [640, 220];
	export const inkPath = (s: [number, number][]) =>
		s.length === 1 ? `M${s[0][0]} ${s[0][1]}l0.1 0` : s.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('');
</script>

<script lang="ts">
	import { cx } from '../cx';

	// the pad a person signs on with a finger, a stylus or a mouse (SC-183; the kit's SignPad). It keeps each stroke in
	// its own 640 x 220 box, so the same ink draws again at any size: on the certificate, its PDF, the operator's review.
	// A signature is ink on a white page, in either theme. The keyboard's way to sign is the name typed, which the sheet
	// around it offers
	type Props = { name?: string; value: PadInk | null; onchange: (v: PadInk | null) => void; label?: string };
	let { name, value, onchange, label }: Props = $props();
	let svg: SVGSVGElement | undefined = $state();
	let drawing = false;
	const lines = $derived(value?.strokes ?? []);
	const put = (strokes: [number, number][][]) => onchange(strokes.length ? { box: PAD, strokes } : null);
	const pt = (e: PointerEvent): [number, number] => {
		const r = svg!.getBoundingClientRect();
		return [
			Math.round((((e.clientX - r.left) * PAD[0]) / r.width) * 2) / 2,
			Math.round((((e.clientY - r.top) * PAD[1]) / r.height) * 2) / 2
		];
	};
	const down = (e: PointerEvent) => {
		if (e.button > 0) return;
		e.preventDefault();
		svg!.setPointerCapture(e.pointerId);
		drawing = true;
		put([...lines, [pt(e)]]);
	};
	const move = (e: PointerEvent) => {
		if (!drawing) return;
		const p = pt(e);
		const s = lines.slice();
		const last = s[s.length - 1];
		const q = last[last.length - 1];
		if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5) return;
		s[s.length - 1] = [...last, p];
		put(s);
	};
	const up = () => (drawing = false);
</script>

<div class={cx('signpad', lines.length > 0 && 'inked')}>
	<svg
		bind:this={svg}
		viewBox="0 0 {PAD[0]} {PAD[1]}"
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={up}
		role="img"
		aria-label={label ?? `Signature pad${name ? ` for ${name}` : ''}: draw with a finger, a stylus or a mouse`}
	>
		<line class="signpad-base" x1="28" x2="612" y1="176" y2="176" /><text
			class="signpad-x"
			x="30"
			y="166"
			aria-hidden="true">×</text
		>
		<g class="signpad-ink"
			>{#each lines as st, i (i)}<path d={inkPath(st)} />{/each}</g
		>
	</svg>
	{#if !lines.length}<span class="signpad-hint" aria-hidden="true">Sign here</span>{/if}
	{#if name}<span class="signpad-under" aria-hidden="true">{name}</span>{/if}
	{#if lines.length > 0}<button type="button" class="signpad-clear" onclick={() => put([])}>Clear</button>{/if}
</div>

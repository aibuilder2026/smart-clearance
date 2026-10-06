<script lang="ts">
	// a sparkline: one series, a 10% wash under a 2 px line (SC-48)
	let { values, tone }: { values: number[]; tone?: 'amber' } = $props();
	const W = 160,
		H = 36;
	const line = $derived.by(() => {
		const max = Math.max(1, ...values),
			n = values.length;
		const X = (i: number) => (n > 1 ? (i / (n - 1)) * W : W / 2),
			Y = (v: number) => H - 3 - (v / max) * (H - 8);
		return values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
	});
	const col = $derived(tone === 'amber' ? 'var(--amber)' : 'var(--primary)');
</script>

<svg class="cs-ov-spark" viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true"
	><path d="{line} L{W} {H} L0 {H} Z" fill={col} opacity="0.1" /><path
		d={line}
		fill="none"
		stroke={col}
		stroke-width="2"
		vector-effect="non-scaling-stroke"
		stroke-linejoin="round"
		stroke-linecap="round"
	/></svg
>

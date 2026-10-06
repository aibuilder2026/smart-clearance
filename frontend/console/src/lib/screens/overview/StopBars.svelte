<script lang="ts">
	import { cx } from '@smart-clearance/core';
	// the batches in flight at each stop: a bar each, Approve in amber; choosing one lists them in the table
	let {
		titles,
		byStop,
		value,
		onpick
	}: { titles: string[]; byStop: number[]; value: number | null; onpick: (stop: number | null) => void } = $props();
	const max = $derived(Math.max(1, ...byStop));
</script>

<div class="cs-ov-stops" role="group" aria-label="Batches in flight by stop">
	{#each titles as t, i (t)}<button
			type="button"
			class={cx('cs-ov-stop', i === 5 && 'human', !byStop[i] && 'zero')}
			aria-pressed={value === i}
			aria-label="{t}: {byStop[i]} batch{byStop[i] === 1 ? '' : 'es'}. {value === i
				? 'Shown in the table'
				: 'Show them in the table'}"
			onclick={() => onpick(value === i ? null : i)}
			><span>{t}</span><span class="bar" style="width: {(byStop[i] / max) * 100}%"></span><span class="n"
				>{byStop[i]}</span
			></button
		>{/each}
</div>

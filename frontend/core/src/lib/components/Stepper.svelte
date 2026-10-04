<script lang="ts">
	import Icon from '../icons/Icon.svelte';

	type Props = {
		value: number;
		onchange?: (v: number) => void;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		format?: (v: number) => string | number;
	};
	let { value = $bindable(), onchange, min = 0, max = 9999, step = 1, label, format = (v) => v }: Props = $props();
	const set = (v: number) => {
		value = v;
		onchange?.(v);
	};
</script>

<span class="stepper" role="group" aria-label={label}
	><button
		type="button"
		aria-label={'Fewer ' + (label || '')}
		disabled={value <= min}
		onclick={() => set(Math.max(min, value - step))}><Icon name="minus" size={18} stroke={2.2} /></button
	><span class="val" aria-live="polite">{format(value)}</span><button
		type="button"
		aria-label={'More ' + (label || '')}
		disabled={value >= max}
		onclick={() => set(Math.min(max, value + step))}><Icon name="plus" size={18} stroke={2.2} /></button
	></span
>

<script lang="ts">
	import { cx } from '../cx';

	type Props = { value: number; tone?: 'amber' | 'red' | 'violet'; label: string };
	let { value, tone, label }: Props = $props();
	const p = $derived(Math.max(0, Math.min(1, value)));
</script>

<div
	class={cx('progress', tone)}
	role="progressbar"
	aria-valuenow={Math.round(value * 100)}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-label={label}
>
	<i style="--p: {p}"></i>
</div>

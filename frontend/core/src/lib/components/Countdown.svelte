<script lang="ts">
	import { cx } from '../cx';

	// shelf life left as a bar that empties toward the date, red when the batch is at risk (the kit's Countdown)
	type Props = { days: number; life: number; status?: string; label?: string };
	let { days, life, status, label }: Props = $props();
	const p = $derived(Math.max(0.025, Math.min(1, days / life)));
</script>

<div
	class={cx('countdown', status === 'at-risk' ? 'risk' : status === 'gated' ? 'gated' : '')}
	role="img"
	aria-label={label || `${days} of ${life} days of shelf life left`}
>
	<i style="--p: {p}"></i>
</div>

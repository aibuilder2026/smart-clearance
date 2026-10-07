<script lang="ts">
	import { DAY_MINUTES, dayBadge, type Client } from '@smart-clearance/api/console';
	import { cx, Icon } from '@smart-clearance/core';

	// the length of a journey day in the client's head, on every tab (SC-68, option A): grey in real time, the
	// information blue when days are short. It opens the sheet that changes it
	let { c, onopen }: { c: Client; onopen: () => void } = $props();
	const fast = $derived(c.dayMinutes < DAY_MINUTES);
</script>

<!-- the space after the hidden label sits outside it: Svelte trims the whitespace at the end of an element's text -->
<button type="button" class={cx('cs-jday', fast && 'fast')} onclick={onopen} aria-haspopup="dialog"
	><Icon name={fast ? 'fast-forward' : 'clock'} size={13} stroke={2.2} /><span class="sr-only"
		>Length of a journey day:</span
	>
	{dayBadge(c.dayMinutes)}<Icon name="chevron-down" size={13} /></button
>

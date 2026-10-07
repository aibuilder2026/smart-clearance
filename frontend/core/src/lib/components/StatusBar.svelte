<script lang="ts">
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';

	// a phone's status bar in a device preview: the time, signal, wifi and battery, white over a lock screen (the kit's
	// StatusBar)
	let { time = '9:41', dark }: { time?: string; dark?: boolean } = $props();
</script>

<div class={cx('statusbar', dark && 'on-dark')} aria-hidden="true">
	<span>{time}</span><span class="sb-icons"
		><Icon name="signal" size={16} stroke={2.4} /><Icon name="wifi" size={16} stroke={2.4} /><Icon
			name="battery-full"
			size={20}
			stroke={1.8}
		/></span
	>
</div>

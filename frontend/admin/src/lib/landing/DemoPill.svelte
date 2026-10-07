<script lang="ts">
	import { Icon, cx } from '@smart-clearance/core';
	import { LINKS, linkProps } from './links';
	import { DEMO_POSTER } from './media';

	/** the way into the demo, always at hand (SC-60); gone at the close, where the same link stands in the band */
	let { hidden }: { hidden: boolean } = $props();
</script>

<a class={cx('pill', hidden && 'off')} {...linkProps(LINKS.demo)} aria-label="Watch the 6-minute demo">
	<span class="thumb" aria-hidden="true"
		><img src={DEMO_POSTER} alt="" width="52" height="52" /><i><Icon name="play" size={12} stroke={2.6} /></i></span
	>
	<span>Watch the 6-minute demo</span>
</a>

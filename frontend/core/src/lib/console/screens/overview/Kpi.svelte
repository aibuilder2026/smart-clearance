<script lang="ts">
	import { cx, Icon, type IconName } from '@smart-clearance/core';
	import type { Snippet } from 'svelte';
	import Sparkline from './Sparkline.svelte';

	// a figure with its label, a line under it, and its trend over the range
	let {
		label,
		icon,
		tone,
		spark,
		foot,
		children
	}: { label: string; icon: IconName; tone?: 'amber'; spark?: number[]; foot: Snippet | string; children: Snippet } =
		$props();
</script>

<div class={cx('cs-ov-kpi', tone)}>
	<span class="k-label"><Icon name={icon} size={15} />{label}</span><span class="k-value">{@render children()}</span
	><span class="k-foot"
		>{#if typeof foot === 'string'}{foot}{:else}{@render foot()}{/if}</span
	>{#if spark}<Sparkline values={spark} {tone} />{/if}
</div>

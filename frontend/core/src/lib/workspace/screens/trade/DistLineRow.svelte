<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import { cx } from '../../../cx';
	import type { DistStateLine } from '../../dist';
	import DistChan from './DistChan.svelte';

	// a line of a batch's plan: the channel, what the plan has, where it stands; it opens the batch's deliveries
	// (SC-133, screens/trade.jsx LineRow)
	const NAME: Record<string, string> = {
		kirana: 'Kirana scheme',
		expiresoon: 'ExpireSoon lot',
		staff: 'Staff sale',
		foodbank: 'Food bank'
	};
	let { line, onopen }: { line: DistStateLine; onopen?: () => void } = $props();
</script>

{#snippet inner()}<DistChan id={line.id} />
	<span class="grow stack tight" style="gap: 1px; min-width: 0"
		><b class="t-subhead">{NAME[line.id]}</b><span class="t-footnote muted">{line.plan}</span></span
	>
	<span class={cx('dist-state', line.done && 'done', line.live && 'live')}
		>{#if line.done}<Icon name="check" size={14} stroke={2.4} />{/if}{line.state}</span
	>
	{#if onopen}<Icon name="chevron-right" size={16} class="subtle" />{/if}{/snippet}
{#if onopen}<button type="button" class="dist-line" onclick={onopen}>{@render inner()}</button>{:else}<div
		class="dist-line"
	>
		{@render inner()}
	</div>{/if}

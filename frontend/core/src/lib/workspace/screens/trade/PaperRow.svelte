<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import type { Doc, PartnerCase } from '../../types';
	import { issuedBy, PAPER_ICON } from './pt';

	// one paper as a row (SC-130): its icon, type, number, who issued it, its amount
	type Props = { c: Pick<PartnerCase, 'partner'>; d: Doc; short: string; onopen: (id: string) => void };
	let { c, d, short, onopen }: Props = $props();
	const amount = $derived(
		d.status === 'not required' || d.id === 'receipt' ? null : d.id === 'invoice' ? d.total || d.amount : d.amount
	);
</script>

<button type="button" class="pt-paper" onclick={() => onopen(d.id)}>
	<span class="icontile"><Icon name={PAPER_ICON[d.id] || 'file-text'} size={17} stroke={2} /></span>
	<span class="grow"
		><b>{d.type}</b><span class="t-footnote muted"
			><span class="mono">{d.no}</span> · {issuedBy(c, d, short)}{d.status === 'not required'
				? ' · not required'
				: ''}</span
		></span
	>
	{#if amount}<span class="tnum strong">{fmt.inr(amount)}</span>{/if}<Icon
		name="chevron-right"
		size={16}
		class="subtle"
	/>
</button>

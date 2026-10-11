<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import type { KiranaInvoice } from '../../types';

	// a batch's tax invoices to its kiranas as one row (SC-153, screens/trade.jsx RegisterRow): how many, the first number
	// to the last, who issues them, their total; it opens the batch's sales register
	let { list, who, onopen }: { list: KiranaInvoice[]; who: string; onopen: () => void } = $props();
	const total = $derived(list.reduce((t, x) => t + x.total, 0));
</script>

<button type="button" class="pt-paper" onclick={onopen}>
	<span class="icontile"><Icon name="receipt" size={17} stroke={2} /></span>
	<span class="grow"
		><b>Tax invoices to kiranas · {list.length}</b><span class="t-footnote muted"
			><span class="mono">{list[0].no}{list.length > 1 ? ` to ${list[list.length - 1].no.split('/').pop()}` : ''}</span>
			·
			{who}</span
		></span
	>
	<span class="tnum strong">{fmt.inr(total)}</span><Icon name="chevron-right" size={16} class="subtle" />
</button>

<script lang="ts">
	import { useNotice } from '../../../notice.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Hero } from '../../types';

	// the invoice the Paperwork agent drafted in his name, for him to issue from Tally
	let { h }: { h: Hero } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const { toast } = useNotice();
	const issue = () => {
		void ws.act('issueInvoice');
		toast({ text: 'Marked issued from Tally', tone: 'ok' });
	};
</script>

<Card class="row wrap" style="gap: 14px"
	><span class="icontile"><Icon name="receipt" size={17} stroke={2} /></span>
	<div class="grow" style="min-width: 0">
		<b>Invoice {c.invoice.no} to {c.buyer.name}</b>
		<div class="t-footnote muted">
			{c.lines.expiresoon.units} × ₹{c.counter.price.toFixed(2)} + IGST {c.invoice.gstPct}% · {fmt.inr(
				c.invoice.total!
			)} · drafted by the Paperwork agent for you
		</div>
	</div>
	{#if h.invoiceIssued}<Badge tone="green" icon="check">issued from Tally</Badge>{:else}<Button
			variant="primary"
			size="sm"
			icon="check"
			onclick={issue}>Issue from Tally</Button
		>{/if}</Card
>

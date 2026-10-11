<script lang="ts">
	import { useNotice } from '../../../notice.svelte';
	import Button from '../../../components/Button.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { DistOrder } from '../../dist';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import DistChan from './DistChan.svelte';
	import { when } from './pt';

	// an order: who bought what, for how much, on which paper (the invoice he issues, and Issue from Tally while it is a
	// draft); the scheme's shops on request (SC-133, screens/trade.jsx OrderRow), each with the tax invoice he issued it,
	// which opens (SC-153)
	const NAME: Record<string, string> = {
		kirana: 'Kirana scheme',
		expiresoon: 'ExpireSoon lot',
		staff: 'Staff sale',
		foodbank: 'Food bank'
	};
	let { o, batch, onInvoice }: { o: DistOrder; batch: string; onInvoice?: (no: string) => void } = $props();
	const ws = useWorkspace();
	const { toast } = useNotice();
	let open = $state(false);
	// Issue from Tally waits on the answer (SC-152); the toast only once it has gone through
	const issue = async () => {
		await ws.act('issueInvoice', undefined, { feel: 400, ref: batch, inline: true });
		toast({ text: 'Marked issued from Tally', tone: 'ok' });
	};
</script>

<div class="dist-order">
	<DistChan id={o.id} />
	<span class="grow stack tight" style="gap: 2px; min-width: 0">
		<span class="t-subhead"><b>{o.who}</b> · {o.what}</span>
		<span class="t-footnote muted">{NAME[o.id]}{o.at ? ` · ${when(o.at)}` : ''}{o.sub ? ` · ${o.sub}` : ''}</span>
		{#if o.paper}<span class="row tight wrap" style="gap: 8px"
				><span class="dist-paper"
					><Icon name="file-text" size={13} /><span class="mono">{o.paper.no}</span><span>{o.paper.label}</span></span
				>{#if o.paper.issue}<Button
						variant="secondary"
						size="sm"
						icon="check"
						action={issue}
						busy="Issuing…"
						done="Issued">Issue from Tally</Button
					>{/if}</span
			>{/if}
		{#if o.invoices}<span class="row tight wrap" style="gap: 8px"
				><span class="dist-paper"
					><Icon name="receipt" size={13} /><span class="mono"
						>{o.invoices.first}{o.invoices.n > 1 ? ` to ${o.invoices.last.split('/').pop()}` : ''}</span
					><span
						>{o.invoices.n} tax {o.invoices.n === 1 ? 'invoice' : 'invoices'} · {fmt.inr2(o.invoices.tax)} GST collected</span
					></span
				></span
			>{/if}
		{#if o.shops?.length}<button
				type="button"
				class="pt-link t-footnote dist-toggle"
				aria-expanded={open}
				onclick={() => (open = !open)}>{open ? 'Hide' : 'Show'} the {o.shops.length} shops' orders</button
			>{/if}
		{#if open && o.shops}<div class="dist-shops">
				{#each o.shops as k (k.name)}{#if k.invoice && onInvoice}<button
							type="button"
							class="dist-shop"
							onclick={() => onInvoice(k.invoice!.no)}
							><b>{k.name}</b>{#if k.at}<em>{when(k.at)}</em>{/if}<span class="tnum">{k.units}</span><span
								class="dist-shop-no"
								><span class="mono">{k.invoice.no}</span><span class="tnum">{fmt.inr(k.invoice.total)}</span></span
							></button
						>{:else}<span
							><b>{k.name}</b>{#if k.at}<em>{when(k.at)}</em>{/if}<span class="tnum">{k.units}</span></span
						>{/if}{/each}
			</div>{/if}
	</span>
	<span class="tnum strong">{o.amount ? fmt.inr(o.amount) : 'given'}</span>
</div>

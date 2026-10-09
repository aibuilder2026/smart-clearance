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
	// draft); the scheme's shops on request (SC-133, screens/trade.jsx OrderRow)
	const NAME: Record<string, string> = {
		kirana: 'Kirana scheme',
		expiresoon: 'ExpireSoon lot',
		staff: 'Staff sale',
		foodbank: 'Food bank'
	};
	let { o, batch }: { o: DistOrder; batch: string } = $props();
	const ws = useWorkspace();
	const { toast } = useNotice();
	let open = $state(false);
	let busy = $state(false);
	const issue = async () => {
		busy = true;
		try {
			await ws.act('issueInvoice', undefined, { feel: 400, ref: batch });
			toast({ text: 'Marked issued from Tally', tone: 'ok' });
		} finally {
			busy = false;
		}
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
				>{#if o.paper.issue}<Button variant="secondary" size="sm" icon="check" loading={busy} onclick={issue}
						>Issue from Tally</Button
					>{/if}</span
			>{/if}
		{#if o.shops?.length}<button
				type="button"
				class="pt-link t-footnote dist-toggle"
				aria-expanded={open}
				onclick={() => (open = !open)}>{open ? 'Hide' : 'Show'} the {o.shops.length} shops' orders</button
			>{/if}
		{#if open && o.shops}<div class="dist-shops">
				{#each o.shops as k (k.name)}<span
						><b>{k.name}</b>{#if k.at}<em>{when(k.at)}</em>{/if}<span class="tnum">{k.units}</span></span
					>{/each}
			</div>{/if}
	</span>
	<span class="tnum strong">{o.amount ? fmt.inr(o.amount) : 'given'}</span>
</div>

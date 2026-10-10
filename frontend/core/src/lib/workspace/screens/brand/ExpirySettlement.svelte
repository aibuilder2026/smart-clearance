<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { useRoute } from '../../context';
	import { fmt } from '../../model';
	import type { Distributor, ExpirySettlement } from '../../types';

	// expiry day's settlement (SC-94, option B; screens/brand.jsx ExpirySettlement): the packs left at the godown,
	// settled by the client's expiry policy: the policy, three figures (the credit to the distributor, who destroys the
	// packs, the client's other costs), the sentence, and the paper
	let {
		settle: x,
		dist,
		client,
		batch
	}: { settle: ExpirySettlement; dist: Distributor; client: string; batch: string } = $props();
	const router = useRoute();
	const POLICY = {
		godown: 'Destroyed at the godown',
		'full-credit': 'Full credit at expiry',
		'price-support': 'Price support only',
		none: 'No returns'
	};
	const whose = (n: string) => n + (/s$/.test(n) ? "'" : "'s");
	// destroyed at his godown (SC-139): the note's amount, he destroys them, and of it the GST and the agency's charges
	const figures = $derived<[string, string][]>(
		x.policy === 'godown'
			? [
					[`Credit to ${dist.short}`, x.amount != null ? fmt.inr(x.amount) : 'at the dealer price'],
					['Destroyed by', dist.short],
					['Of it: GST and charges', fmt.inr((x.gst ?? 0) + (x.charges ?? 0))]
				]
			: [
					[
						`Credit to ${dist.short}`,
						x.policy === 'none' ? '—' : x.credit != null ? fmt.inr(x.credit) : 'at the dealer price'
					],
					['Destroyed by', x.destroyedBy === 'client' ? client : dist.short],
					[
						x.policy === 'full-credit' ? 'Disposal, EPR, GST' : "Client's other costs",
						x.policy === 'full-credit' ? fmt.inr(x.disposal + x.epr + x.itc) : '—'
					]
				]
	);
	const sentence = $derived.by(() => {
		const n = fmt.num(x.units);
		const amount = x.credit != null ? ` (${fmt.inr(x.credit)})` : '';
		if (x.policy === 'godown')
			return `The ${n} packs are destroyed at ${dist.godown} through an authorised agency; ${client} credits ${dist.name} the dealer price, the GST it reverses and the agency's charges${x.amount != null ? ` (${fmt.inr(x.amount)})` : ''}.`;
		if (x.policy === 'full-credit')
			return `The ${n} packs come back to ${client} for full credit${amount || ' at the dealer price'}, and ${client} destroys them.`;
		if (x.policy === 'price-support')
			return `The ${n} packs stay with ${dist.name}, which destroys them; ${client} pays it the gap to its price${amount}.`;
		return `With no returns, the ${n} packs are ${whose(dist.name)} loss, and it destroys them.`;
	});
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><span class="icontile" style="border-radius: 9px"><Icon name="hand-coins" size={17} stroke={2} /></span><span
				class="card-title">Expiry settlement</span
			></span
		><Badge tone={x.policy === 'none' ? undefined : 'green'} icon="check">{POLICY[x.policy]}</Badge>
	</div>
	<div style="display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 120px), 1fr))">
		{#each figures as [k, v] (k)}<div
				class="stack tight"
				style="gap: 2px; padding: 10px 12px; border-radius: 12px; background: var(--fill)"
			>
				<span class="t-caption subtle">{k}</span><b class="tnum">{v}</b>
			</div>{/each}
	</div>
	<span class="t-footnote muted">{sentence}</span>
	{#if x.policy !== 'none'}<Button
			variant="outline"
			icon="file-text"
			onclick={() => router.go('paperwork', { ref: batch })}>Open the paper</Button
		>{/if}
</Card>

<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { LedgerPage } from '../../types';
	import NotPosted from './NotPosted.svelte';
	import { kg } from './ledger';

	// a batch's impact (screens/finance.jsx ImpactTab): its BRSR line with the evidence it rests on, and where its kilos
	// went: resold, donated, destroyed
	let { page }: { page: LedgerPage } = $props();
	const ws = useWorkspace();
	const c = $derived(page.c);
	const row = $derived(page.row);
	const partner = $derived(c.donation.units > 0 ? c.donation.partner.name : null);
	const no = (id: string) => row?.papers.find((x) => x.id === id && x.status !== 'not required')?.no;
	const evidence = $derived.by(() => {
		if (!row) return '';
		const F = row.figures;
		const orders = row.lines.filter((l) => l.id === 'kirana').reduce((t, l) => t + l.units, 0);
		return [
			no('invoice'),
			c.listing.id && c.lines.expiresoon.units ? c.listing.id : null,
			orders ? `${c.kiranas.length} kirana order logs` : null,
			no('support'),
			no('expiry'),
			F.donated ? 'FSSAI checklist' : null,
			no('receipt'),
			F.destroyed ? 'destruction certificate' : null
		]
			.filter(Boolean)
			.join(' · ');
	});
</script>

{#if !row}
	<NotPosted h={page.h} returnBy={c.returnBy} />
{:else}
	{@const F = row.figures}
	{#snippet main()}<div class="stack" style="gap: 16px">
			<Card class="stack snug"
				><div class="card-head">
					<span class="card-title">BRSR line</span><Badge size="sm" tone="green" icon="check"
						>posted · {fmt.day(row.cleared)}</Badge
					>
				</div>
				<div class="lg-brsr mono">
					{kg(F.kg)} diverted from disposal ({kg(F.resoldKg)} resold{F.donatedKg ? `, ${kg(F.donatedKg)} donated` : ''})
					· {kg(F.destroyedKg)} destroyed · {kg(F.co2)} CO₂e avoided (indicative) · {F.meals
						? `${fmt.num(F.meals)} meals (${fmt.num(F.donated)} packs donated)`
						: '0 meals (nothing donated)'}
				</div>
				<span class="t-footnote subtle">Evidence: {evidence}</span></Card
			>
			<List head="Where the kilos went">
				<ListRow icon="store" title="Resold" sub="kiranas, ExpireSoon and staff" value={kg(F.resoldKg)} />
				<ListRow icon="heart-handshake" title="Donated" sub={partner ?? 'nothing donated'} value={kg(F.donatedKg)} />
				<ListRow
					icon="trash-2"
					title="Destroyed"
					sub={F.destroyedKg ? 'expired at the godown' : 'nothing destroyed'}
					value={kg(F.destroyedKg)}
				/>
			</List>
		</div>{/snippet}
	{#snippet side()}<Card class="stack tight" style="gap: 6px"
			><span class="t-footnote subtle">Kept out of landfill</span><span class="num m">{kg(F.kg)}</span><span
				class="t-footnote muted"
				>{kg(F.co2)} CO₂e avoided at {ws.data.rules.co2PerKg} kg a kg, indicative{F.meals && partner
					? ` · ${fmt.num(F.meals)} meals by ${partner}'s rule`
					: ''}.</span
			></Card
		>{/snippet}
	<Columns sideWidth={380} {main} {side} />
{/if}

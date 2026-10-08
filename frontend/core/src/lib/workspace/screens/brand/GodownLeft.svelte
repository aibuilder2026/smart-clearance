<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import type { Distributor, Plan } from '../../types';

	// what no channel took, once every line is done (SC-87, option A; screens/brand.jsx GodownLeft): each line's planned
	// packs it did not take, which still face the write-off, and the net the lines came to against the plan's
	let {
		realised,
		plan,
		net,
		dist
	}: {
		realised: { lines: { id: string; units: number }[]; godown: number };
		plan: Plan;
		net: number;
		dist: Distributor;
	} = $props();
	const packs = $derived(realised.godown === 1 ? 'pack' : 'packs');
	const took = (id: string) => realised.lines.find((l) => l.id === id)?.units ?? 0;
	const rows = $derived(
		plan.lines
			.filter((l) => l.id !== 'writeoff' && l.units > took(l.id))
			.map((l) => ({ id: l.id, name: l.short, left: l.units - took(l.id) }))
	);
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><span class="icontile gray" style="border-radius: 9px"><Icon name="warehouse" size={17} stroke={2} /></span><span
				class="card-title">Left at the godown</span
			></span
		><Badge>{fmt.num(realised.godown)} {packs}</Badge>
	</div>
	<List
		>{#each rows as r (r.id)}{#snippet value()}<span class="tnum strong">{fmt.num(r.left)}</span>{/snippet}<ListRow
				title={r.name}
				sub="planned, not taken"
				{value}
			/>{/each}</List
	>
	<span class="t-footnote muted"
		>Not recovered: {fmt.num(realised.godown)}
		{packs} at {dist.godown}, still facing the write-off at best-before. The figures count only what each channel took:
		net {fmt.inr(net)} of the {fmt.inr(plan.net)} planned.</span
	>
</Card>

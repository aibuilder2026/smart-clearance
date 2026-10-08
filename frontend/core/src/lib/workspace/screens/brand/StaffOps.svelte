<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import Progress from '../../../components/Progress.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import type { Distributor, PlanLine, StaffSale } from '../../types';

	// the staff sale on Execution (SC-87, option A; screens/brand.jsx StaffOps): the distributor runs it at the godown and
	// records what sold, once; no agent acts here. Before it opens, the plan's line
	let { staff, line, dist }: { staff: StaffSale | null | undefined; line: PlanLine; dist: Distributor } = $props();
	const units = $derived(staff ? staff.units : line.units);
	const price = $derived(staff ? staff.price : line.price);
	const sold = $derived(staff && staff.status === 'recorded' ? (staff.sold ?? 0) : null);
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><span class="icontile" style="border-radius: 9px"><Icon name="users" size={17} stroke={2} /></span><span
				class="card-title">Staff sale · {dist.short}</span
			></span
		>{#if !staff}<Badge>opens on approval</Badge>{:else if sold == null}<Badge tone="blue" dot>open</Badge>{:else}<Badge
				tone="green"
				icon="check">recorded</Badge
			>{/if}
	</div>
	<div class="row wrap" style="gap: 18px">
		<div class="stack tight" style="gap: 0">
			<span class="num m"
				>{sold == null ? '—' : fmt.num(sold)}<span class="subtle" style="font-size: 0.45em"
					>{` / ${fmt.num(units)}`}</span
				></span
			><span class="t-footnote subtle">sold to staff</span>
		</div>
		<div class="stack tight" style="gap: 0">
			<span class="num m">₹{price}</span><span class="t-footnote subtle">a pack, by UPI</span>
		</div>
	</div>
	<Progress value={(sold ?? 0) / units} label="Staff packs sold" />
	<span class="t-footnote muted"
		>{dist.short} runs it at {staff?.godown || dist.godown} and records what sold; no agent acts here.</span
	>
</Card>

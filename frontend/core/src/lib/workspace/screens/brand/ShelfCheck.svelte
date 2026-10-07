<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { castOf, first, fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Hero } from '../../types';

	// day 7: the salesman's shelf counts, and the one pick-up the agent suggests (screens/brand.jsx ShelfCheck)
	type Props = { shelf: Hero['shelf']; compact?: boolean };
	let { shelf, compact }: Props = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const S7 = $derived(c.shelf);
	// the staff sale, as the plan names it; a partner who does not see the plan reads the channel's name
	const staff = $derived(c.plan.rows.find((r) => r.id === 'staff') ?? { name: ws.data.setup.channelNames.staff ?? '' });
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><span class="icontile" style="border-radius: 9px"><Icon name="list-checks" size={17} stroke={2} /></span><span
				class="card-title">Shelf check · day 7</span
			></span
		><Badge tone={shelf ? 'green' : undefined} icon={shelf ? 'check' : 'calendar'}
			>{shelf ? S7.date : `due ${S7.date}`}</Badge
		>
	</div>
	{#if shelf}
		<span class="t-footnote muted"
			>{first(castOf(ws.state, c).distributor.short)}'s salesman counted the scheme packs at {S7.counted} shops on his beat.
			{S7.counted - 1} are selling in time; one is slow.</span
		>
		<div class="stack tight" style="padding: 12px 14px; border-radius: 14px; background: var(--fill)">
			<div class="row between t-subhead">
				<b>{S7.shop}, {S7.area}</b><span class="tnum strong">{S7.left} of {S7.took} left</span>
			</div>
			<span class="t-footnote muted">It took {S7.took} a week ago, so it is selling about one a day.</span>
			<div class="row between t-subhead">
				<span>Pick up on {S7.round}</span><span class="tnum strong">{S7.pickUp} packs</span>
			</div>
			<div class="row between t-subhead">
				<span>Leave the ones it can sell in time</span><span class="tnum strong">{S7.leave} packs</span>
			</div>
		</div>
		{#if !compact}<span class="t-caption subtle"
				>Returns go to the {staff.name} or to {c.donation.partner.name}, and are accepted until {fmt.day(
					S7.returnBy
				)}.</span
			>{/if}
	{:else}<span class="t-footnote muted"
			>On day 7 the salesman counts the scheme packs on each shelf. Where a shop is selling too slowly, the agent
			suggests bringing packs back on the next round while they still have {ws.data.rules.returnWindowDays} or more days on
			them.</span
		>{/if}
</Card>

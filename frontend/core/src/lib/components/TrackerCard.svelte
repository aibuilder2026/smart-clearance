<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useApp } from '../app.svelte';
	import { fmt } from '../format';
	import Icon from '../icons/Icon.svelte';
	import { stageTimes, track, trackTimed } from '../workspace/model';
	import type { BatchView, Stage } from '../workspace/types';
	import Aura from './Aura.svelte';
	import Badge from './Badge.svelte';
	import DaysNum from './DaysNum.svelte';
	import Money from './Money.svelte';
	import Product from './Product.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import Tracker from './Tracker.svelte';
	import TrackerCompact from './TrackerCompact.svelte';

	// the hero: one batch tracked like an order, its days left, what destroying it would cost, the nine stops and what
	// happens next (the kit's TrackerCard)
	type Props = {
		view: BatchView;
		/** the nine stages, with when each happens and who acts */
		stages: Stage[];
		/** what destroying the batch would cost, shown when there is no money snippet */
		writeOff: number;
		done?: number;
		current?: number;
		eta?: string;
		/** neutral: the updates have paused (the live workspace), so the badge is grey */
		etaTone?: 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'neutral';
		/** the card's own action, and one beside it */
		primary?: Snippet;
		secondary?: Snippet;
		/** the figure under the days left; what destroying costs unless set */
		money?: Snippet;
		/** the line beside the figure; why the batch is at risk unless set */
		line?: string;
		/** what the agent at work is doing, with its aura */
		agentLive?: string;
		onstop?: (i: number) => void;
		style?: string;
	};
	let {
		view,
		stages,
		writeOff,
		done = 2,
		current = 2,
		eta,
		etaTone,
		primary,
		secondary,
		money,
		line,
		agentLive,
		onstop,
		style
	}: Props = $props();

	const app = useApp();
	const phone = $derived(app.bp === 'phone');
	const a = $derived(view.assess);
	const sku = $derived(view.skuObj);
</script>

<div class="bezel" {style}>
	<div class="card raised" style="padding: {phone ? 18 : 26}px; overflow: hidden">
		<div class="row between wrap" style="gap: 8px">
			<div class="row tight wrap">
				<StatusBadge
					status={view.phase || a.status}
					live={view.phase ? view.phase === 'executing' : a.status === 'at-risk'}
				/><span class="mono subtle t-footnote">{view.id}</span>
			</div>
			<span class="row tight subtle t-footnote"
				><Icon name="map-pin" size={15} />{view.dist.name} · {view.dist.city}</span
			>
		</div>
		<div
			style="display: grid; grid-template-columns: {phone ? 'minmax(0,1fr) 92px' : 'minmax(0,1fr) 168px'}; gap: {phone
				? 12
				: 20}px; align-items: center; margin-top: {phone ? 10 : 6}px"
		>
			<div style="min-width: 0">
				<div class="t-headline" style="font-size: {phone ? 17 : 19}px">{sku.brand} {sku.name}</div>
				<div class="row base" style="gap: {phone ? 10 : 14}px; margin-top: {phone ? 6 : 10}px; flex-wrap: wrap">
					<DaysNum
						days={view.daysLeft}
						life={sku.lifeDays}
						size={phone ? 'l' : 'xl'}
						style="color: {a.status === 'at-risk' && !view.phase ? 'var(--red-text)' : 'var(--fg)'}"
					/>
					<span class="stack tight" style="gap: 2px"
						><span class="t-callout strong">days left</span><span class="t-footnote subtle"
							>best before {fmt.date(view.bestBefore)}</span
						></span
					>
				</div>
			</div>
			<Product name={sku.img} size={phone ? 92 : 168} float alt={sku.name} />
		</div>
		<div class="row wrap" style="gap: {phone ? 10 : 18}px; margin-top: {phone ? 12 : 16}px; align-items: flex-end">
			{#if money}{@render money()}{:else}<div class="stack tight" style="gap: 2px">
					<Money value={-writeOff} size={phone ? 's' : 'm'} style="color: var(--red-text)" /><span
						class="t-footnote subtle">if destroyed · {fmt.num(a.atRisk)} units at risk</span
					>
				</div>{/if}
			<div class="grow t-subhead muted" style="min-width: 220px; max-width: 520px">
				{line ||
					`Blocked from Blinkit, Zepto and Instamart. ${fmt.num(a.atRisk)} of ${fmt.num(view.units)} units will not sell by ${fmt
						.date(view.bestBefore)
						.replace(/ \d{4}$/, '')}.`}
			</div>
		</div>
		<div style="margin-top: {phone ? 14 : 22}px">
			{#if phone}<TrackerCompact stages={trackTimed(stages)} {done} {current} />{:else}<Tracker
					stages={track(stages)}
					{done}
					{current}
					times={stageTimes(stages)}
					{onstop}
				/>{/if}
		</div>
		<div class="row between wrap" style="margin-top: {phone ? 16 : 20}px; gap: 10px">
			<div class="row tight wrap">
				{#if eta}<Badge tone={etaTone === 'neutral' ? undefined : (etaTone ?? 'green')} icon="clock">{eta}</Badge>{/if}
				{#if agentLive}<span class="row tight t-footnote muted"
						><Aura on class="icontile soft" style="width: 24px; height: 24px; border-radius: 8px"
							><Icon name="sparkles" size={13} /></Aura
						>{agentLive}</span
					>{/if}
			</div>
			<div class="row tight">{@render secondary?.()}{@render primary?.()}</div>
		</div>
	</div>
</div>

<script lang="ts">
	import { untrack } from 'svelte';
	import { useApp } from '../../../app.svelte';
	import { useNotice } from '../../../notice.svelte';
	import Avatar from '../../../components/Avatar.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import ClusterMap from '../../../components/ClusterMap.svelte';
	import HaulLine from '../../../components/HaulLine.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Mark from '../../../components/Mark.svelte';
	import Roll from '../../../components/Roll.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { prefersReducedMotion } from '../../../motion';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { cartons, clusterOf, fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import ShelfCheck from '../brand/ShelfCheck.svelte';
	import Screen from '../common/Screen.svelte';

	// Rakesh bhai's Tuesday round: the map with the van on its way, the shops that ordered, his word to the Outreach
	// agent, the day-7 shelf check after it; beside it, the ExpireSoon lot the buyer's truck collects
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const app = useApp();
	const { toast } = useNotice();
	const h = $derived(ws.state.hero);
	const units = $derived(h.orders.reduce((t, o) => t + o.units, 0));
	const full = $derived(h.orders.length === c.kiranas.length);
	const done = $derived(h.van.status === 'done');
	let p = $state(ws.state.hero.van.status === 'done' ? 1 : 0);
	let running = $state(false);
	$effect(() => {
		if (done && !untrack(() => running)) p = 1;
	});
	// the van drives the round on the map, then the round is done
	const start = () => {
		running = true;
		const t0 = performance.now();
		const dur = prefersReducedMotion.current ? 10 : 3600;
		const step = (now: number) => {
			const k = Math.min(1, (now - t0) / dur);
			p = k;
			if (k < 1) requestAnimationFrame(step);
			else {
				running = false;
				void ws.act('vanRound');
				toast({ text: `Round done · ${c.kiranas.length} shops, ${cartons(units, c.sku.perCarton)}`, tone: 'ok' });
			}
		};
		requestAnimationFrame(step);
	};
	const dispatch = () => {
		void ws.act('dispatch');
		toast({ text: `${c.buyer.city} lot on the buyer's truck · invoice draft next`, tone: 'ok' });
	};
	const stops = $derived(c.kiranas.map((k) => ({ ...k, ordered: h.orders.find((o) => o.id === k.id) })));
	const lot = $derived<[string, string][]>([
		['Buyer', h.award ? `${c.buyer.name}, ${c.buyer.city}` : '—'],
		['Units', `${c.lines.expiresoon.units} · ${cartons(c.lines.expiresoon.units, c.sku.perCarton)}`],
		['Price', h.award ? `₹${c.counter.price.toFixed(2)} a packet` : `${fmt.rate(c.lines.expiresoon.price)} asked`],
		['Token', h.award ? fmt.inr(c.award.token) + ' received' : '—'],
		['Freight', "the buyer's own truck"]
	]);
</script>

<Screen {me} title="Van route" sub={`${c.van.depot} · ${c.dist.cluster}`} back="Today">
	<Columns sideWidth={380}>
		{#snippet main()}
			<Card pad={false} style="overflow: hidden"
				><ClusterMap
					{...clusterOf(c.dist)}
					kiranas={c.kiranas}
					orderedCount={h.orders.length}
					route={h.orders.length > 0}
					vanProgress={p}
					height={app.bp === 'phone' ? 260 : 380}
				/></Card
			>
			<Card class="stack snug">
				<div class="card-head">
					<span class="card-title">{c.van.day} round</span><Badge
						tone={done ? 'green' : undefined}
						icon={done ? 'check' : 'calendar'}>{done ? 'delivered' : `${c.van.date} · from ${c.van.leaves}`}</Badge
					>
				</div>
				<div class="row wrap" style="gap: 20px">
					<div class="stack tight" style="gap: 0">
						<span class="num m"
							><Roll value={h.orders.length} /><span class="subtle" style="font-size: 0.45em">
								/ {c.kiranas.length}</span
							></span
						><span class="t-footnote subtle">shops on the round</span>
					</div>
					<div class="stack tight" style="gap: 0">
						<span class="num m"><Roll value={units} /></span><span class="t-footnote subtle"
							>packets · {cartons(units, c.sku.perCarton)}</span
						>
					</div>
				</div>
				{#if !done}<Button
						variant="primary"
						size="lg"
						icon="navigation"
						loading={running}
						disabled={!full || running}
						onclick={start}
						>{full ? 'Start the round' : `Waiting for orders · ${h.orders.length} of ${c.kiranas.length}`}</Button
					>{/if}
				<span class="t-caption subtle"
					>₹{ws.data.rules.vanPerUnit.toFixed(2)} a packet for the van, repaid by {ws.data.workspace.short} in the price support.</span
				>
				<div class="feed" style="gap: 10px">
					<div class="row top" style="gap: 10px">
						<Mark size={28} />
						<div
							class="t-subhead"
							style="padding: 9px 12px; border-radius: 16px; border-top-left-radius: 6px; background: var(--fill-2)"
						>
							{c.push.van.body}
							<div class="t-caption muted">Outreach agent · {c.push.van.at}</div>
						</div>
					</div>
					<div class="row top" style="gap: 10px; justify-content: flex-end">
						<div
							class="t-subhead"
							style="padding: 9px 12px; border-radius: 16px; border-top-right-radius: 6px; background: var(--primary); color: var(--primary-fg)"
						>
							{c.van.reply}
							<div class="t-caption" style="opacity: 0.9">{me.short} · {c.van.replyAt}</div>
						</div>
						<Avatar person={me} size="sm" />
					</div>
				</div>
			</Card>
			<div data-anchor="shelf"></div>
			{#if done || h.shelf}<ShelfCheck shelf={h.shelf} />{/if}
		{/snippet}
		{#snippet side()}
			<div data-anchor="lot"></div>
			<Card class="stack snug">
				<div class="card-head">
					<span class="row tight"
						><span class="icontile violet"><Icon name="package" size={17} stroke={2} /></span><span class="card-title"
							>{c.buyer.city} lot</span
						></span
					><Badge tone={h.truck.status === 'dispatched' ? 'blue' : h.award ? 'green' : 'violet'}
						>{h.truck.status === 'dispatched'
							? 'collected'
							: h.award
								? 'sold'
								: h.listing
									? 'listed'
									: 'not listed'}</Badge
					>
				</div>
				<HaulLine
					progress={h.truck.status === 'dispatched' ? (h.phase === 'cleared' || h.phase === 'settled' ? 1 : 0.55) : 0}
				/>
				<List
					>{#each lot as [k, v] (k)}<ListRow title={k} value={v} />{/each}</List
				>
				{#if h.truck.status !== 'dispatched'}<Button
						variant="primary"
						size="lg"
						icon="truck"
						disabled={!h.award}
						onclick={dispatch}>{h.award ? "Load the buyer's truck" : 'Load after the award'}</Button
					>{/if}
				<span class="t-caption subtle">Your staff load it as normal godown work, once the balance lands.</span>
			</Card>
			<div class="stack snug">
				<SectionTitle sub="In the order they were placed">Stops</SectionTitle>
				<div class="list">
					{#each stops as k, i (k.id)}<div class="list-row" style="grid-template-columns: 28px minmax(0,1fr) auto">
							<span
								class="center t-caption strong"
								style="width: 24px; height: 24px; border-radius: 99px; background: {k.ordered
									? 'var(--primary)'
									: 'var(--fill-2)'}; color: {k.ordered ? 'var(--primary-fg)' : 'var(--fg-2)'}">{i + 1}</span
							><span class="stack tight" style="gap: 0"
								><b class="t-subhead">{k.name}</b><span class="t-caption subtle"
									>{k.area}{k.ordered ? ` · ordered ${k.ordered.at}` : ' · not yet'}</span
								></span
							><span class="tnum strong t-subhead">{k.ordered ? k.units : '—'}</span>
						</div>{/each}
				</div>
			</div>
		{/snippet}
	</Columns>
</Screen>

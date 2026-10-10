<script lang="ts">
	import Aura from '../../../components/Aura.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import CodeBlock from '../../../components/CodeBlock.svelte';
	import Product from '../../../components/Product.svelte';
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import type { Batch, Buyer, Distributor, Hero, PlanLine, Sku } from '../../types';

	// the Lister's lot on ExpireSoon (SC-151, option A; screens/brand.jsx ListerCard): the lot as buyers see it, what
	// only the client sees, and where it stands; the raw call stays one tap away, closed, for the audit
	let {
		h,
		lot,
		sku,
		batch,
		dist,
		buyer,
		reserve,
		client,
		territories,
		req,
		res,
		onopen
	}: {
		h: Hero;
		lot: PlanLine;
		sku: Sku;
		batch: Batch;
		dist: Distributor;
		buyer: Buyer | null;
		reserve: number;
		client: string;
		territories: Distributor[];
		req: string;
		res: string;
		onopen: () => void;
	} = $props();
	let open = $state(false);

	const possessive = (n: string) => (/s$/.test(n) ? `${n}'` : `${n}'s`);
	const lotPrice = (p: number) => '₹' + (Number.isInteger(p) ? p : p.toFixed(2));
	const andList = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

	const ended = $derived(!!h.listing && h.listing.status === 'ended');
	const last = $derived(h.bids[h.bids.length - 1]);
	const st = $derived(!h.listing ? 0 : h.truck.status === 'dispatched' ? 4 : h.award ? 3 : h.bids.length ? 2 : 1);
	const label = $derived(
		st === 4
			? 'collected'
			: ended
				? 'ended unsold'
				: h.award
					? 'awarded'
					: last
						? last.status === 'placed'
							? 'bid in'
							: 'countered'
						: 'live'
	);
	const steps = $derived<[string, string | undefined][]>([
		['Listed', h.listing?.at],
		['Bid', h.bids[0]?.at],
		['Won', h.award?.at],
		['Collected', h.truck.status === 'dispatched' ? h.truck.at : undefined]
	]);
	const nowAt = $derived(st >= 1 && st <= 3 && !ended ? st : -1);
	const cities = $derived(territories.map((d) => d.city));
	const pins = $derived(territories.flatMap((d) => d.pins.split(/,\s*/)));
	const per = $derived(sku.perCarton || 24);
	const rest = $derived(lot.units % per);
	const off = $derived(Math.round((1 - lot.price / sku.mrp) * 100));
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><Aura on={!h.listing} class="icontile violet" style="border-radius: 9px"
				><Icon name="shopping-bag" size={17} stroke={2} /></Aura
			><span class="card-title">Lister · ExpireSoon</span></span
		>{#if !h.listing}<Badge>queued</Badge>{:else if st === 4}<Badge tone="green" icon="check">collected</Badge
			>{:else if ended}<Badge>{label}</Badge>{:else}<Badge
				tone={h.award ? 'green' : 'violet'}
				dot
				live={label === 'live'}>{label}</Badge
			>{/if}
	</div>
	{#if !h.listing}<span class="t-footnote muted"
			>Posting the lot now, in {possessive(dist.name)} name, with the label photo and dates.</span
		>{/if}
	<div class="esl" role="group" aria-label="The lot as buyers see it on ExpireSoon">
		<div class="esl-top">
			<span class="es-logo" aria-hidden="true"><Icon name="hourglass" size={13} stroke={2.2} /></span><span
				class="es-word">ExpireSoon</span
			><span class="t-caption subtle">as buyers see it</span><span class="esl-id"
				>{h.listing ? h.listing.id : 'not posted yet'}</span
			>
		</div>
		<div class="esl-lot">
			<span class="esl-thumb"><Product name={sku.img} size={58} /></span>
			<div class="stack tight" style="gap: 3px">
				<b class="t-subhead">{sku.brand} {sku.name} · {fmt.num(lot.units)} units</b>
				<span class="esl-price"
					><span class="es-price">{lotPrice(lot.price)}</span><span class="t-footnote muted"
						>a packet · <s>MRP {lotPrice(sku.mrp)}</s> · {off}% off</span
					></span
				>
				<span><span class="es-date">Best before {fmt.date(batch.bestBefore)} · {batch.daysLeft} days</span></span>
				<span class="t-caption subtle"
					>Sold by {dist.name}, {dist.city} · {Math.floor(lot.units / per)} cartons{rest ? ` + ${rest}` : ''}</span
				>
			</div>
		</div>
		{#if h.award}<div class="esl-won">
				<Icon name="badge-check" size={17} /><span
					>Won by <b>{h.award.buyer}{buyer && buyer.name === h.award.buyer ? `, ${buyer.city}` : ''}</b> at
					<b class="tnum">₹{h.award.price.toFixed(2)}</b> · {fmt.inr(h.award.token)} token paid</span
				>
			</div>{/if}
		{#if ended}<div class="esl-won">
				<Icon name="hourglass" size={17} /><span>Ended unsold on its deadline.</span>
			</div>{/if}
	</div>
	<div class="priv">
		<span class="t-caption subtle">Only {client} sees</span>
		<div class="priv-row">
			<Icon name="lock" size={16} /><span
				><b>Reserve ₹{reserve.toFixed(2)}</b> a packet. The Negotiator counters any bid under it; buyers never see it.</span
			>
		</div>
		<div class="priv-row">
			<Icon name="eye-off" size={16} /><span
				><b>Hidden in {territories.length} territories:</b>
				{andList(cities)} ({pins.length} pincode areas), so the lot never undercuts a {client} distributor.</span
			>
		</div>
	</div>
	<ol class="esl-steps" aria-label="Where the lot stands">
		{#each steps as [k, t], i (k)}{@const done = st > i && !!t}{@const now = i === nowAt}
			<li class={cx(done && 'done', now && 'now')} aria-current={now ? 'step' : undefined}>
				<i></i><b>{k}</b><span>{done ? t : now ? 'waiting' : ' '}</span>
			</li>{/each}
	</ol>
	<div class="xcall">
		<div class="row between wrap" style="gap: 8px">
			{#if h.listing}<Button variant="outline" icon="external-link" onclick={onopen}>Open on ExpireSoon</Button
				>{/if}<button type="button" class="xcall-btn" aria-expanded={open} onclick={() => (open = !open)}
				><Icon name="chevron-right" size={15} stroke={2.2} />The API call</button
			>
		</div>
		{#if open}<div class="xcall-body stack tight">
				<CodeBlock code={req} label="ExpireSoon request" />{#if h.listing}<CodeBlock
						code={res}
						label="ExpireSoon response"
					/>{/if}
			</div>{/if}
	</div>
	<span class="t-footnote subtle"
		>The marketplace is mocked: ExpireSoon's partner API is in talks, and the calls are what it would answer.</span
	>
</Card>

<script lang="ts">
	import { Badge, GateChips, Icon, Money, Product, Roll, cx, fmt, rate } from '@smart-clearance/core';
	import type { Chapter, Figures } from './figures';
	import { riseInView } from './rise';

	let { f }: { f: Figures } = $props();
	const h = $derived(f.how);
	const ch = $derived(Object.fromEntries(f.chapters.map((c) => [c.id, c])) as Record<Chapter['id'], Chapter>);

	// 4 · the chapters (SC-60): the moments each team actually sees, each in a colour field. A field rises with its copy
	// as the reader reaches it, and its card on its own; a card's figure rolls in as its row arrives (the spoken figure
	// is the final one throughout); the plan's agents light in turn once its yes is on screen (900 ms, then every 220),
	// and the work's three cards light their agents (300 ms, then every 420). As the page rests, and as the server sends
	// it, every figure is in place and every agent lit
	let fields: HTMLElement[] = $state([]);
	let alert: HTMLElement | undefined = $state();
	let prices: HTMLElement | undefined = $state();
	let plan: HTMLElement | undefined = $state();
	let work: HTMLElement | undefined = $state();
	let alertRolls = $state(false);
	let planRolls = $state(false);
	let lit = $state(Infinity);
	let workLit = $state(Infinity);

	$effect(() => {
		const stops = fields.map((el) => riseInView(el, {}, 0.2));
		return () => stops.forEach((stop) => stop?.());
	});
	$effect(() => {
		if (!alert) return;
		let t = 0;
		const stop = riseInView(alert, { show: () => (t = window.setTimeout(() => (alertRolls = true), 490)) });
		return () => {
			stop?.();
			clearTimeout(t);
		};
	});
	$effect(() => {
		if (prices) return riseInView(prices);
	});
	$effect(() => {
		if (!plan) return;
		const n = h.plan.released.length;
		const timers: number[] = [];
		const stop = riseInView(plan, {
			arm: () => (lit = 0),
			show: () => {
				timers.push(window.setTimeout(() => (planRolls = true), 270));
				for (let i = 0; i < n; i++) timers.push(window.setTimeout(() => (lit = i + 1), 900 + i * 220));
			}
		});
		return () => {
			stop?.();
			timers.forEach(clearTimeout);
		};
	});
	$effect(() => {
		if (!work) return;
		const timers: number[] = [];
		const stop = riseInView(
			work,
			{
				arm: () => (workLit = 0),
				show: () => {
					for (let i = 0; i < 3; i++) timers.push(window.setTimeout(() => (workLit = i + 1), 300 + i * 420));
				}
			},
			0.2
		);
		return () => {
			stop?.();
			timers.forEach(clearTimeout);
		};
	});
</script>

{#snippet copy(c: Chapter)}
	<div class="ch-copy">
		<h2 id="{c.id}-h" class="ch-h" data-rise>{c.title}</h2>
		<p class="ch-lede" data-rise>{c.lede}</p>
		<span class="agents" data-rise
			>{#each c.who as w, j (w)}<span class={cx('chip-agent on', c.person && j === 0 && 'person')}
					><i aria-hidden="true"></i>{w}</span
				>{/each}</span
		>
	</div>
{/snippet}

<!-- 1 · the Watcher's alert -->
<section id="watch" class="ch tone-green" aria-labelledby="watch-h" bind:this={fields[0]}>
	<div class="ch-in">
		{@render copy(ch.watch)}
		<div class="ch-stage">
			<div bind:this={alert} class="m-card" role="group" aria-label="The Watcher's alert">
				<div class="m-head" data-rise>
					<span class="chip-agent on"><i aria-hidden="true"></i>Watcher · 09:00</span><Badge tone="red" dot
						>At risk</Badge
					>
				</div>
				<div class="m-batch" data-rise>
					<Product name="pack-snack-plain" size={52} /><span><b>{h.alert.product}</b><span>{h.alert.where}</span></span>
				</div>
				<div class="m-gates" data-rise><GateChips gates={h.alert.gates} /></div>
				<div class="m-big" data-rise>
					<span class="num"
						>{#key alertRolls}<Roll value={h.alert.atRisk} from={alertRolls ? 0 : undefined} />{/key}</span
					><span>packs won't sell in the {h.alert.daysLeft} days they have left</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- 2 · the Valuer's price for every exit, net a pack, and the Router's split -->
<section id="price" class="ch tone-sunken" aria-labelledby="price-h" bind:this={fields[1]}>
	<div class="ch-in">
		{@render copy(ch.price)}
		<div class="ch-stage">
			<div bind:this={prices} class="m-card" role="group" aria-label="The Valuer's prices, net a pack">
				<div class="m-head" data-rise>
					<span class="chip-agent on"><i aria-hidden="true"></i>Valuer</span><span class="t-footnote subtle"
						>net a pack, after costs</span
					>
				</div>
				{#each h.prices as p (p.id)}<div class={cx('m-row', p.bin ? 'bin' : p.off && 'off')} data-rise>
						<span class="k"><i class="ex-dot {p.dot}" aria-hidden="true"></i>{p.name}</span><span class="v">{p.v}</span
						><span class="s">{p.s}</span>
					</div>{/each}
				<div data-rise>
					<div class="m-split-cap">
						<span>The Router's split</span><span>{fmt.num(h.split.total)} packs</span>
					</div>
					<div class="m-split" aria-hidden="true">
						<span class="k" style:flex-grow={h.split.kiranas}></span><span
							class="e"
							style:flex-grow={h.split.expiresoon}
						></span>
					</div>
					<div class="m-split-legend">
						<span
							><i class="ex-dot kirana" aria-hidden="true"></i>{fmt.num(h.split.kiranas)} to {h.split.shops} kiranas</span
						><span><i class="ex-dot expiresoon" aria-hidden="true"></i>{fmt.num(h.split.expiresoon)} on ExpireSoon</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- 3 · the plan, waiting for one yes, and the agents it releases, lighting in turn. The button is the plan's own,
     pictured: it does nothing here -->
<section id="yes" class="ch tone-amber" aria-labelledby="yes-h" bind:this={fields[2]}>
	<div class="ch-in">
		{@render copy(ch.yes)}
		<div class="ch-stage">
			<div bind:this={plan} class="m-card yes" role="group" aria-label="The plan, waiting for one yes">
				<div class="m-head" data-rise>
					<b>Approve the plan</b><Badge tone="amber" dot>Waiting for you</Badge>
				</div>
				<div class="m-big flush" data-rise>
					{#key planRolls}<Money value={h.plan.net} roll from={planRolls ? 0 : undefined} />{/key}<span
						>recovered, against {fmt.inr(-h.plan.bin)} to destroy it</span
					>
				</div>
				{#each h.plan.lines as l (l.id)}<div class="m-row" data-rise>
						<span class="k"><i class="ex-dot {l.id}" aria-hidden="true"></i>{l.label}</span><span class="v"
							>{fmt.inr(l.net)}</span
						>
					</div>{/each}
				<div class="m-go" data-rise>
					<span class="btn btn-approve btn-lg"><Icon name="check" size={18} />Approve · release the agents</span>
				</div>
				<div class="m-after" data-rise>
					{#each h.plan.released as w, j (w)}<span class={cx('chip-agent', j < lit && 'on')}
							><i aria-hidden="true"></i>{w}</span
						>{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<!-- 4 · the agents at work after the yes: the kirana offer in Hindi, the lot in the distributor's name, the paperwork -->
<section id="work" class="ch tone-night" aria-labelledby="work-h" bind:this={fields[3]}>
	<div class="ch-in wide">
		{@render copy(ch.work)}
		<div class="ch-stage">
			<div bind:this={work} class="ch-row three">
				<div class="m-card" role="group" aria-label="Outreach: the kirana offer, in Hindi" data-rise>
					<div class="m-head">
						<span class={cx('chip-agent', workLit > 0 && 'on')}><i aria-hidden="true"></i>Outreach · 09:41</span><Badge
							tone="green"
							icon="gift">{h.work.buy} + {h.work.free}</Badge
						>
					</div>
					<div class="m-batch">
						<Product name="pack-snack-plain" size={52} /><span
							><b lang="hi" class="hi">{h.work.offer.title}</b><span
								>{fmt.inr2(h.work.packPrice)} a pack · MRP {fmt.inr(h.work.mrp)} · 48 hours</span
							></span
						>
					</div>
					<p lang="hi" class="hi m-hindi">{h.work.offer.body}</p>
					<div class="m-row">
						<span class="k">{fmt.num(h.work.shops)} shops ordered</span><span class="v"
							>{fmt.num(h.work.kiranas)} packs</span
						>
					</div>
				</div>
				<div class="m-card violet" role="group" aria-label="Lister and Negotiator: the lot on ExpireSoon" data-rise>
					<div class="m-head">
						<span class={cx('chip-agent', workLit > 1 && 'on')}><i aria-hidden="true"></i>Lister · Negotiator</span
						><Badge tone="violet" dot>ExpireSoon</Badge>
					</div>
					<div class="m-batch">
						<Product name="marketplace-bag" size={52} /><span
							><b>{fmt.num(h.work.listed)} packs, listed in the distributor's name</b><span
								>reserve {rate(h.work.reserve)} · hidden inside the brand's territories</span
							></span
						>
					</div>
					<div class="m-row"><span class="k">A buyer bids</span><span class="v">{rate(h.work.bid)}</span></div>
					<div class="m-row">
						<span class="k">Countered, accepted</span><span class="v">{rate(h.work.price)} a pack</span>
					</div>
					<div class="m-row"><span class="k">Token paid</span><span class="v">{fmt.inr(h.work.token)}</span></div>
				</div>
				<div class="m-card" role="group" aria-label="Paperwork: the documents, drafted" data-rise>
					<div class="m-head">
						<span class={cx('chip-agent', workLit > 2 && 'on')}><i aria-hidden="true"></i>Paperwork</span><Badge
							>drafted</Badge
						>
					</div>
					<div class="m-batch">
						<Product name="documents" size={52} /><span
							><b>Everything finance needs, drafted</b><span>each on paper, with who keeps what</span></span
						>
					</div>
					<div class="m-row">
						<span class="k">The distributor's invoice to the buyer</span><span class="v">IGST 5%</span>
					</div>
					<div class="m-row">
						<span class="k">The brand's price-support credit note</span><span class="v">{fmt.inr(h.work.support)}</span>
					</div>
					<div class="m-row">
						<span class="k">GST input credit memo</span><span class="v">{fmt.inr(h.work.itcRetained)}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

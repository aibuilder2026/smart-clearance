<script lang="ts">
	import type { Snippet } from 'svelte';
	import Aura from '../../../components/Aura.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import ClusterMap from '../../../components/ClusterMap.svelte';
	import Mark from '../../../components/Mark.svelte';
	import Product from '../../../components/Product.svelte';
	import Roll from '../../../components/Roll.svelte';
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import { clusterOf, first, fmt, shopById } from '../../model';
	import type { CaseData, Hero, MoneyRules, Shop } from '../../types';

	// Outreach's scheme to the kiranas (SC-156, option A; screens/brand.jsx SchemeCard): the scheme as the shops see it,
	// the figures, the offer window as one line filled by the time gone, four stops with their times, the cluster map
	// and the latest orders as before, and the one push every shop got behind a button. What no shop takes moves to
	// ExpireSoon when the window ends while the lot is still live (SC-86), and otherwise stays at the distributor's
	// godown (SC-185)
	let {
		h,
		c,
		hours,
		rules,
		shops,
		children
	}: { h: Hero; c: CaseData; hours: number; rules: MoneyRules; shops: Shop[]; children?: Snippet } = $props();
	const possessive = (n: string) => (/s$/.test(n) ? `${n}'` : `${n}'s`);
	const line = $derived(c.lines.kirana);
	const sent = $derived(!!h.offer);
	const ordered = $derived(h.orders.length);
	const units = $derived(h.orders.reduce((t, o) => t + o.units, 0));
	const filled = $derived(sent && units >= line.units);
	const closed = $derived(sent && (h.offer!.status === 'closed' || filled));
	const last = $derived(h.orders[h.orders.length - 1]);
	const closedAt = $derived(
		closed ? (h.offer!.closedAt ?? (filled && last ? last.at : h.offer!.closesAt) ?? null) : null
	);
	const left = $derived(line.units - units);
	// the lot grew past what the plan gave it: the window's shortfall moved onto it (backend-api's close)
	const lot = $derived(c.plan.lines.find((l) => l.id === 'expiresoon')?.units ?? 0);
	const moved = $derived(!!h.listing && h.listing.units > lot);
	const delivered = $derived(h.van.status === 'done');
	const vanDate = $derived(c.van.date);
	// the share of the window gone, from two same-day times where the source has no clock (the stub)
	const hhmm = (t: string | null | undefined) => {
		const m = /(\d{1,2}):(\d{2})$/.exec(t ?? '');
		return m ? +m[1] + +m[2] / 60 : null;
	};
	const windowShare = (from: string | null | undefined, to: string | null | undefined) => {
		const a = hhmm(from),
			b = hhmm(to);
		return a != null && b != null && b >= a ? Math.min(1, (b - a) / hours) : null;
	};
	const elapsed = $derived(
		!sent ? 0 : (h.offer!.elapsed ?? (closed ? (filled ? (windowShare(h.offer!.at, closedAt) ?? 0) : 1) : 0))
	);
	const result = $derived(
		!closed
			? null
			: delivered
				? `Delivered on ${possessive(first(c.dist.name))} van round, ${vanDate}: ${fmt.num(units)} packets to ${ordered} shops.`
				: filled
					? `Filled at ${closedAt}: ${ordered} of ${c.offered} shops took every packet, before the window closed.`
					: `The window ended ${closedAt} with ${ordered} of ${c.offered} shops ordering ${fmt.num(units)}; the ${fmt.num(left)} left ${moved ? 'moved to ExpireSoon' : `stayed at ${possessive(c.dist.name)} godown`}.`
	);
	const steps = $derived<[string, string | null | undefined | false][]>([
		['Sent', sent && h.offer!.at],
		['First order', h.orders[0]?.at],
		['Closed', closedAt],
		['Van round', delivered && vanDate]
	]);
	const done = $derived(!sent ? 0 : delivered ? 4 : closed ? 3 : ordered ? 2 : 1);
	const nowAt = $derived(!sent || delivered ? -1 : done);
	let open = $state(false);
	const pushBody = $derived(c.push.offer.body.replace(c.kiranas[0]?.name ?? '\u0000', '{shop}'));
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><Aura on={sent && !closed} class="icontile" style="border-radius: 9px"
				><Icon name="send" size={17} stroke={2} /></Aura
			><span class="card-title">Outreach · {c.offered} kiranas</span></span
		>{#if !sent}<Badge>queued</Badge>{:else if delivered}<Badge tone="green" icon="check">delivered</Badge
			>{:else if filled}<Badge tone="green" dot>filled</Badge>{:else if closed}<Badge icon="hourglass"
				>window over</Badge
			>{:else}<Badge tone="blue" dot live>open</Badge>{/if}
	</div>
	{#if !sent}<span class="t-footnote muted"
			>Sending the scheme to {c.offered} kiranas now, in {possessive(c.dist.name)} name.</span
		>{/if}
	<div class="ks" role="group" aria-label="The scheme as the shops see it">
		<div class="ks-top">
			<span class="ks-logo" aria-hidden="true"><Icon name="store" size={13} stroke={2.2} /></span><span class="ks-word"
				>The scheme</span
			><span class="t-caption subtle">as the shops see it</span><span class="ks-win">{hours}-hour window</span>
		</div>
		<div class="ks-lot">
			<span class="ks-thumb"><Product name={c.sku.img} size={50} /></span>
			<div class="stack tight" style="gap: 3px; min-width: 0">
				<b class="t-subhead">{c.sku.brand} {c.sku.name} · {fmt.num(line.units)} packets</b>
				<span class="ks-price"
					><span class="ks-big">₹{(line.packPrice ?? 0).toFixed(2)}</span><span class="t-footnote muted"
						>a pack · {rules.scheme.free} free with every {rules.scheme.buy} · ₹{line.price.toFixed(2)} effective</span
					></span
				>
				<span><span class="ks-date">Best before {fmt.date(c.batch.bestBefore)} · {c.batch.daysLeft} days</span></span>
				<span class="t-caption subtle"
					>From {c.dist.name}, {c.dist.city} · each shop up to {rules.shopCapTimes}× its {rules.kiranaWindowDays}-day
					sales</span
				>
			</div>
		</div>
		{#if result}<div class="ks-result">
				<Icon name={filled || delivered ? 'badge-check' : 'hourglass'} size={17} /><span>{result}</span>
			</div>{/if}
	</div>
	<div class="row wrap" style="gap: 18px">
		<div class="stack tight" style="gap: 0">
			<span class="num m"
				><Roll value={ordered} /><span class="subtle" style="font-size: 0.45em">{` / ${c.offered}`}</span></span
			><span class="t-footnote subtle">kiranas ordered</span>
		</div>
		<div class="stack tight" style="gap: 0">
			<span class="num m"
				><Roll value={units} /><span class="subtle" style="font-size: 0.45em">{` / ${line.units}`}</span></span
			><span class="t-footnote subtle">packets</span>
		</div>
	</div>
	<div class="kwin" aria-label="The offer window">
		<div class="kwin-head">
			<span>Offer window · <b>{hours} h</b></span><span
				>{#if !sent}opens when the push goes out{:else if !closed}closes <b>{h.offer!.closesAt}</b
					>{:else if filled}filled at <b>{closedAt}</b> · closed early{:else}ended <b>{closedAt}</b>{/if}</span
			>
		</div>
		<div class="kwin-bar">
			<i class={cx(filled && 'filled', closed && !filled && 'over')} style="width: {elapsed * 100}%"></i>{#if closed}<s
					style="left: {elapsed * 100}%"
				></s>{/if}
		</div>
		<div class="kwin-ticks" aria-hidden="true">
			<span>{sent ? h.offer!.at : '—'}</span><span>{hours / 2} h</span><span>{hours} h</span>
		</div>
	</div>
	<ol class="esl-steps green" aria-label="Where the scheme stands">
		{#each steps as [k, t], i (k)}{@const d = done > i && !!t}{@const now = i === nowAt}
			<li class={cx(d && 'done', now && 'now')} aria-current={now ? 'step' : undefined}>
				<i></i><b>{k}</b><span>{d ? t : now ? 'waiting' : ' '}</span>
			</li>{/each}
	</ol>
	{@render children?.()}
	<ClusterMap {...clusterOf(c.dist)} kiranas={c.kiranas} orderedCount={ordered} route height={200} />
	<div class="stack tight">
		{#each h.orders.slice(-3).reverse() as o (o.id)}{@const k = shopById(o.id, c, shops)}
			<div class="row between t-subhead">
				<span>{k.name} <span class="subtle t-footnote">{k.area}</span></span><span class="tnum strong"
					>{o.units} <span class="subtle t-caption">{o.at}</span></span
				>
			</div>{/each}{#if !ordered}<span class="t-footnote muted"
				>Orders arrive as shops tap the offer. No shop can order more than {rules.shopCapTimes}× its own
				{rules.kiranaWindowDays}-day sales.</span
			>{/if}
	</div>
	<div class="xcall">
		<div class="row between wrap" style="gap: 8px">
			<button type="button" class="xcall-btn" aria-expanded={open} onclick={() => (open = !open)}
				><Icon name="chevron-right" size={15} stroke={2.2} />The push, as sent</button
			>
		</div>
		{#if open}<div class="xcall-body stack tight">
				<div class="kpush">
					<Mark size={28} />
					<div>
						<span class="hi t-subhead" lang="hi">{pushBody}</span><small
							>{c.push.offer.en} · one message to all {c.offered} shops, each with its own name, in Hindi.</small
						>
					</div>
				</div>
			</div>{/if}
	</div>
	<span class="t-footnote subtle"
		>A shop that says Not this time keeps its {hours} hours to change its mind. What no shop takes moves to ExpireSoon when
		the window ends.</span
	>
</Card>

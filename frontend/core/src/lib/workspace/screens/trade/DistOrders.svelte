<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Money from '../../../components/Money.svelte';
	import { useRoute } from '../../context';
	import { ordersNow, ordersPast, type DistJourney, type DistOrder } from '../../dist';
	import { fmt } from '../../model';
	import { sumsOf } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { LedgerOutcome, Sku, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import OutcomeBadge from '../finance/OutcomeBadge.svelte';
	import DistBatchLine from './DistBatchLine.svelte';
	import DistOrderRow from './DistOrderRow.svelte';
	import DistStopBadge from './DistStopBadge.svelte';
	import SumCard from './SumCard.svelte';
	import SumLine from './SumLine.svelte';
	import { clearedOf, day, distJourneysOf, distOfMe, distWorldOf, shopNameOf, worldOf } from './pt';

	// his Orders, batch by batch (SC-133, option A; screens/trade.jsx DistOrders): what sold from each of the client's
	// batches at his godown, in a journey and cleared: who bought what, for how much, on which paper; each batch's papers
	// a tap away on its page. It opens on how the cleared batches' figures add up, as Batches does (SC-145)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const { go } = useRoute();
	const dist = $derived(distOfMe(ws, me));
	const w = $derived(distWorldOf(ws));
	const shopName = $derived(shopNameOf(ws));
	type Entry = {
		ref: string;
		sku: Sku;
		j: DistJourney | null;
		outcome: LedgerOutcome | null;
		cleared: string | null;
		rows: DistOrder[];
	};
	const now = $derived<Entry[]>(
		distJourneysOf(ws, dist.id).map(({ n, j }) => ({
			ref: n.ref,
			sku: j.sku,
			j,
			outcome: null,
			cleared: null,
			rows: ordersNow(n, shopName, w)
		}))
	);
	// the batches he cleared, as Batches lists them, and their sum (SC-145)
	const cleared = $derived(clearedOf(ws, dist.id).filter((c) => !now.some((x) => x.ref === c.ref)));
	const sums = $derived(sumsOf(clearedOf(ws, dist.id), worldOf(ws)));
	const past = $derived<Entry[]>(
		cleared
			.map((c) => ({
				ref: c.ref,
				sku: w.skus[c.sku],
				j: null,
				outcome: c.outcome,
				cleared: c.cleared,
				rows: ordersPast(c, shopName, w)
			}))
			.filter((b) => b.rows.length)
	);
	const book = $derived(now.concat(past));
	const all = $derived(book.flatMap((b) => b.rows));
	const sum = (rows: DistOrder[]) => Math.round(rows.reduce((t, o) => t + o.amount, 0) * 100) / 100;
	const shops = $derived(all.filter((o) => o.id === 'kirana').reduce((t, o) => t + (o.shops?.length ?? 0), 0));
	const lots = $derived(all.filter((o) => o.id === 'expiresoon').length);
	const sales = $derived(all.filter((o) => o.id === 'staff').length);
	const live = $derived(Math.round(now.reduce((t, b) => t + sum(b.rows), 0)));
	const liveN = $derived(now.filter((b) => b.rows.length).length);
	const sumOf = (ref: string) => sums.batches.find((x) => x.ref === ref) ?? null;
</script>

<Screen {me} title="Orders" sub="{dist.name} · what sold from each of {w.short}'s batches, to whom, on which paper">
	<div class="stack" style="gap: 16px; max-width: 960px">
		{#if all.length && sums.n}<SumCard
				t={sums}
				page="orders"
				short={w.short}
				{live}
				{liveN}
			/>{:else if all.length}<Card class="stack" style="gap: 8px"
				><div class="lg-fig">
					<Money value={sum(all)} size="l" /><span class="lg-what"
						>sold from {w.short}'s batches since {ws.data.workspace.since}</span
					>
				</div>
				<p class="lg-working">
					{book.length}
					{book.length === 1 ? 'batch' : 'batches'} · {shops} kiranas' scheme orders · {lots} ExpireSoon {lots === 1
						? 'lot'
						: 'lots'} · {sales} staff {sales === 1 ? 'sale' : 'sales'}. The price support is on each batch's papers.
				</p></Card
			>{:else}<Card
				><Empty
					img="van"
					title="No orders yet"
					body="When a batch's scheme, lot or staff sale sells, each order shows here under its batch."
				/></Card
			>{/if}
		{#each book as b (b.ref)}<Card class="stack snug">
				<div class="row between wrap" style="gap: 12px">
					<DistBatchLine
						sku={b.sku}
						id={b.ref}
						size={44}
						sub={b.j
							? b.j.phase === 'cleared'
								? 'cleared · every order'
								: b.rows.length
									? 'orders so far'
									: 'no orders yet'
							: `cleared ${day(b.cleared!)}`}
						>{#snippet badge()}{#if b.j}<DistStopBadge j={b.j} />{:else if b.outcome}<OutcomeBadge
									o={b.outcome}
									size="sm"
								/>{/if}{/snippet}</DistBatchLine
					>
					<span class="row tight"
						>{#if b.rows.length}{@const x = b.j ? null : sumOf(b.ref)}{#if x}<SumLine {x} lead="sold" />{:else}<span
									class="tnum strong">{fmt.inr(sum(b.rows))}</span
								>{/if}{/if}<Button
							variant="ghost"
							size="sm"
							iconRight="chevron-right"
							onclick={() => go('batches', { ref: b.ref })}>Papers</Button
						></span
					>
				</div>
				{#if b.rows.length}<div class="dist-orders">
						{#each b.rows as o (o.id)}<DistOrderRow {o} batch={b.ref} />{/each}
					</div>{:else}<p class="t-footnote muted" style="margin: 0">
						{b.j?.waiting || 'Its orders show here as they come in.'}
					</p>{/if}
			</Card>{/each}
	</div>
</Screen>

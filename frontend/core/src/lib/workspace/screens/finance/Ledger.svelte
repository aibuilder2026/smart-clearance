<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Product from '../../../components/Product.svelte';
	import Segmented from '../../../components/Segmented.svelte';
	import { useRoute } from '../../context';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Ledger, LedgerBatch, LedgerTotals, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import ExportMenu from './ExportMenu.svelte';
	import LedgerHeadline from './LedgerHeadline.svelte';
	import LedgerStrip from './LedgerStrip.svelte';
	import OutcomeBadge from './OutcomeBadge.svelte';
	import { figure, kg, READINGS, second, START, type Reading } from './ledger';

	// Finance & ESG (SC-121, option A; screens/finance.jsx Ledger): one ledger with three readings. The period (a quarter,
	// or the year so far), a reading, the period's figure with its working, the period drawn as its batches, the batches
	// still out, and the batches by month; each opens its own page. Anita opens on GST, Vikram on Impact, Priya on Money
	let { me, book }: { me: User; book: Ledger } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const router = useRoute();
	const phone = $derived(app.bp === 'phone');
	const year = $derived(
		book.periods.find((x) => x.kind === 'year' && x.current) ?? book.periods[book.periods.length - 1]
	);
	let picked = $state<string | null>(null);
	const p = $derived(book.periods.find((x) => x.id === picked) ?? year);
	// svelte-ignore state_referenced_locally (each role starts on its own reading)
	let reading = $state<Reading>(START[me.role] ?? 'money');
	const list = $derived(book.batches.filter((r) => r.cleared >= p.from && r.cleared <= p.to));
	const flying = $derived(p.current ? book.inFlight : []);
	const months = $derived(
		[...p.months].reverse().map((m) => ({ ...m, items: list.filter((r) => r.cleared.startsWith(m.month)).reverse() }))
	);
	const sumOf = (t: LedgerTotals) => (reading === 'impact' ? kg(t.kg) : fmt.inr(reading === 'gst' ? t.itcKept : t.net));
	const open = (r: LedgerBatch) => router.go('report', { ref: r.ref });
	const stopOf = (id: string) => ws.data.stages.find((s) => s.id === id)?.title ?? id;
	const periodOptions = $derived(book.periods.map((x) => ({ id: x.id, label: x.label })));
</script>

{#snippet exports()}{#if list.length}<ExportMenu {p} {list} since={book.since} />{/if}{/snippet}
{#snippet barActions()}{#if !phone}{@render exports()}{/if}{/snippet}

<Screen
	{me}
	title="Ledger"
	sub={`One ledger, three readings · every batch ${ws.data.workspace.short} has cleared since ${book.since}`}
	actions={barActions}
>
	<div class="stack" style="gap: 20px">
		<div class="row wrap between" style="gap: 12px">
			<Segmented label="Period" options={periodOptions} value={p.id} onchange={(v) => (picked = v)} />
			<span class="row tight wrap" style="gap: 12px"
				><Segmented label="Reading" options={READINGS} bind:value={reading} />{#if phone}{@render exports()}{/if}</span
			>
		</div>
		<Card class="stack" style="gap: 18px">
			<LedgerHeadline {p} {reading} />
			{#if list.length}<LedgerStrip {list} {reading} onopen={open} />{:else}<Empty
					icon="book-open"
					title="Nothing cleared in {p.label} yet"
					body="Each batch joins the ledger when Impact posts it, after its return window closes.{flying.length
						? ` ${flying.length} ${flying.length === 1 ? 'batch is' : 'batches are'} still out.`
						: ''}"
				/>{/if}
		</Card>
		{#if flying.length}<List head="Still out">
				{#each flying as b (b.ref)}
					{#snippet lead()}<Product name={b.img} size={40} />{/snippet}
					{#snippet stop()}<Badge tone="blue" dot live>{stopOf(b.stage)}</Badge>{/snippet}
					<ListRow
						leading={lead}
						title={b.name}
						sub="{b.ref} · {b.distributorName} · flagged {fmt.day(b.flagged)}"
						value={stop}
					/>
				{/each}
			</List>{/if}
		{#each months as g (g.month)}
			<List head="{g.label} · {g.totals.batches} {g.totals.batches === 1 ? 'batch' : 'batches'} · {sumOf(g.totals)}">
				{#each g.items as r (r.ref)}
					{#snippet lead()}<Product name={r.img} size={40} />{/snippet}
					{#snippet title()}<span class="row tight" style="gap: 8px; flex-wrap: wrap"
							><span>{r.name}</span>{#if !phone}<OutcomeBadge o={r.outcome} size="sm" />{/if}</span
						>{/snippet}
					{#snippet value()}<span class="lg-val"
							><b class="tnum">{figure(r, reading)}</b><em>{second(r, reading)}</em></span
						>{/snippet}
					<ListRow
						chevron
						onclick={() => open(r)}
						leading={lead}
						{title}
						sub="{r.ref} · {r.distributorName} · cleared {fmt.day(r.cleared)}"
						{value}
					/>
				{/each}
			</List>
		{/each}
		<p class="t-footnote subtle">
			Every figure is the batch's posted ledger, as money.js works it out. CO₂e, disposal and EPR are indicative. The
			companies and people are fictional.
		</p>
	</div>
</Screen>

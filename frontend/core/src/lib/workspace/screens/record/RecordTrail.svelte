<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import { cx } from '../../../cx';
	import { csv, download } from '../../model';
	import type { RecordStep, RecordWho } from '../../types';
	import RecordActor from './RecordActor.svelte';
	import { isIso, recDay, upFirst } from './record';

	// the audit trail (SC-142): every step, day by day, by the agent or the person who took it; people's lines as the
	// audit log keeps them, the kiranas' orders folded into one; filtered to people or agents, and downloaded as a CSV
	let { steps, batch }: { steps: RecordStep[]; batch: string } = $props();
	let who = $state<'all' | 'people' | 'agents'>('all');
	let unfold = $state<Record<string, boolean>>({});
	const rows = $derived(
		steps.filter((x) => who === 'all' || (who === 'people' ? x.who.kind !== 'agent' : x.who.kind === 'agent'))
	);
	// the record's days, in order; the stub's story keeps its own times, so it reads as one journey
	const days = $derived.by(() => {
		const out: { d: string; items: RecordStep[] }[] = [];
		for (const x of rows) {
			const d = isIso(x.at) ? x.at.slice(0, 10) : '';
			const g = out[out.length - 1];
			if (!g || g.d !== d) out.push({ d, items: [x] });
			else g.items.push(x);
		}
		return out;
	});
	const people = $derived(steps.filter((x) => x.who.kind !== 'agent').length);
	const whoLine = (w: RecordWho) =>
		w.kind === 'agent' ? `${w.name} · agent` : w.org ? `${w.name} · ${w.org}` : w.name;
	const time = (t: string) => (isIso(t) ? t.slice(11, 16) : t);
	const id = (x: RecordStep) => x.key + x.at;
	const save = () =>
		download(
			`${batch}-audit-trail.csv`,
			csv(
				[['When', 'Who', 'As', 'What', 'Yes']].concat(
					rows.flatMap((x) =>
						[
							[
								isIso(x.at) ? x.at.replace('T', ' ') : x.at,
								x.who.name,
								x.who.kind === 'agent' ? 'agent' : (x.who.org ?? ''),
								upFirst(x.text),
								x.yes ? 'yes' : ''
							]
						].concat((x.items ?? []).map((i) => [i.at.replace('T', ' '), i.who.name, 'kirana', upFirst(i.text), '']))
					)
				)
			)
		);
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="card-title">Audit trail</span><span class="t-footnote subtle"
			>{steps.length} {steps.length === 1 ? 'step' : 'steps'} · {people} by people</span
		>
	</div>
	<div class="rec-filters" role="group" aria-label="Whose steps">
		{#each [['all', 'Everyone'], ['people', 'People'], ['agents', 'Agents']] as [k, t] (k)}<button
				type="button"
				class="chip"
				aria-pressed={who === k}
				onclick={() => (who = k as typeof who)}>{t}</button
			>{/each}
	</div>
	{#if !steps.length}<span class="t-footnote muted"
			>The record fills as the agents and the people act on the batch.</span
		>{/if}
	<div class="rec-trail">
		{#each days as g, gi (g.d + gi)}{#if g.d || gi === 0}<div class="rec-day">
					{g.d ? recDay(g.d) : 'This journey'}
				</div>{/if}
			{#each g.items as x, i (id(x) + i)}<div class={cx('rec-row', i === g.items.length - 1 && 'end')}>
					<RecordActor who={x.who} />
					<div style="min-width: 0">
						<span class="who">{whoLine(x.who)}</span><b
							>{upFirst(
								x.text
							)}{#if x.yes}<!-- eslint-disable-next-line svelte/no-useless-mustaches -- the space Svelte would trim at the start of the block -->
								{' '}<Badge size="sm" tone="amber">yes</Badge>{/if}</b
						>
						{#if x.items?.length}<button
								type="button"
								class="pt-link t-footnote"
								aria-expanded={!!unfold[id(x)]}
								onclick={() => (unfold = { ...unfold, [id(x)]: !unfold[id(x)] })}
								>{unfold[id(x)] ? 'Hide' : 'Show'} the {x.items.length}
								{x.items.length === 1 ? 'order' : 'orders'}</button
							>
							{#if unfold[id(x)]}<div class="rec-items">
									{#each x.items as y, j (j)}<div class="row between t-footnote">
											<span><b>{y.who.name}</b> {y.text}</span><span class="subtle tnum">{time(y.at)}</span>
										</div>{/each}
								</div>{/if}{/if}
					</div>
					<time>{time(x.at)}</time>
				</div>{/each}{/each}
	</div>
	<Button variant="secondary" icon="download" onclick={save} style="justify-self: start"
		>Download the audit trail (CSV)</Button
	>
</Card>

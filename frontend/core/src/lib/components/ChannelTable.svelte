<script lang="ts">
	import { CH_ORDER } from '../channels';
	import { cx } from '../cx';
	import { fmt } from '../format';
	import type { ChannelRow } from '../workspace/types';
	import Badge from './Badge.svelte';

	// the Valuer's table: every channel priced, ineligible ones greyed with the reason; the chart's table view (the
	// kit's ChannelTable)
	type Props = { rows: ChannelRow[]; chosen?: string[] };
	let { rows, chosen = [] }: Props = $props();
	const ordered = $derived(CH_ORDER.map((id) => rows.find((r) => r.id === id)).filter((r): r is ChannelRow => !!r));
	const signed2 = (v: number) => (v < 0 ? '−₹' : '₹') + Math.abs(v).toFixed(2);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (the region scrolls sideways on a phone, so the keyboard must reach it) -->
<div class="table-wrap" tabindex="0" role="region" aria-label="Channels compared">
	<table class="table">
		<thead
			><tr
				><th>Channel</th><th>Needs</th><th class="n">Price</th><th class="n">Net a unit</th><th class="n">Capacity</th
				><th>Clears in</th><th>GST credit</th></tr
			></thead
		>
		<tbody>
			{#each ordered as r (r.id)}
				{@const pick = chosen.includes(r.id)}
				<tr class={cx(!r.eligible && 'dim')}>
					<td
						><span class="row tight"
							><span
								style="width: 10px; height: 10px; border-radius: 3px; background: var(--ch-{r.id}); opacity: {r.eligible
									? 1
									: 0.35}"
							></span><b style="font-weight: {pick ? 650 : 500}">{r.name}</b>{#if pick}<Badge size="sm" tone="green"
									>in plan</Badge
								>{/if}</span
						>{#if !r.eligible}<div class="t-caption neg" style="margin-top: 2px">{r.reason}</div>{/if}</td
					>
					<td class="muted">{r.need}</td>
					<td class="n"
						>{r.price ? `₹${r.price.toFixed(2)}` : '₹0'}<span class="subtle t-caption">
							{r.pricePctLabel !== '—' ? r.pricePctLabel : ''}</span
						></td
					>
					<td class={cx('n', r.net < 0 ? 'neg' : '')} style="font-weight: 600">{signed2(r.net)}</td>
					<td class="n">{r.capacity == null ? 'unlimited' : fmt.num(r.capacity)}</td>
					<td class="muted">{r.clears}</td>
					<td
						>{#if r.itc === 'retained'}<Badge size="sm" tone="green">retained</Badge>{:else}<Badge size="sm" tone="red"
								>reversed{r.indicative ? ' · indicative' : ''}</Badge
							>{/if}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import { cx } from '../../../cx';
	import type { Dashboard } from '../../impact';
	import type { LedgerPeriod } from '../../types';
	import { kg } from './ledger';

	// the Impact reading's three figures (SC-157, screens/finance.jsx ImpactTiles): kept out of landfill, destroyed with
	// the share saved, CO₂e avoided, each against the period before and with its weeks as a sparkline
	let { d, p, prev, co2PerKg }: { d: Dashboard; p: LedgerPeriod; prev: LedgerPeriod | null; co2PerKg: number } =
		$props();
	const t = $derived(p.totals);
	const tp = $derived(prev?.totals ?? null);
	const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);
	const split = (v: number): [string, string] =>
		v >= 1000
			? [(v / 1000).toLocaleString('en-IN', { maximumFractionDigits: 2 }), 't']
			: [Math.round(v).toLocaleString('en-IN'), 'kg'];
	const tiles = $derived<
		{
			icon: IconName;
			label: string;
			value: [string, string];
			delta: number | null;
			foot: string;
			spark: number[];
			gone?: boolean;
		}[]
	>([
		{
			icon: 'leaf',
			label: 'Kept out of landfill',
			value: split(t.kg),
			delta: tp ? pct(t.kg, tp.kg) : null,
			foot: tp ? `vs ${prev!.label}` : 'first period',
			spark: d.weeks.map((w) => w.kept)
		},
		{
			icon: 'trash-2',
			label: 'Destroyed',
			value: split(t.destroyedKg),
			delta: null,
			foot: d.share != null ? `${d.share}% of the food saved` : 'nothing cleared yet',
			spark: d.weeks.map((w) => w.destroyed),
			gone: true
		},
		{
			icon: 'cloud',
			label: 'CO₂e avoided',
			value: split(t.co2),
			delta: tp ? pct(t.co2, tp.co2) : null,
			foot: `indicative, ${co2PerKg} kg a kg`,
			spark: d.weeks.map((w) => w.kept)
		}
	]);
	const W = 92,
		H = 28;
	const line = (values: number[]) => {
		const max = Math.max(1, ...values),
			n = values.length;
		const X = (i: number) => (n > 1 ? (i / (n - 1)) * W : W / 2),
			Y = (v: number) => H - 2 - (v / max) * (H - 6);
		return values.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
	};
</script>

<div class="im-tiles">
	{#each tiles as x (x.label)}{@const cls = x.delta == null || x.delta === 0 ? '' : x.delta > 0 ? 'up' : 'down'}
		<div class={cx('im-tile', x.gone && 'gone')}>
			<span class="lbl"><Icon name={x.icon} size={15} />{x.label}</span>
			<span class="val">{x.value[0]}<small>{x.value[1]}</small></span>
			<span class="foot"
				><span
					>{#if x.delta != null}<span class={cx('delta', cls)}>{x.delta > 0 ? '+' : ''}{x.delta}%</span>
						{x.foot}{:else}{x.foot}{/if}</span
				><svg class={cx('im-spark', x.gone && 'gone')} viewBox="0 0 {W} {H}" aria-hidden="true"
					><path class="a" d="{line(x.spark)} L{W} {H} L0 {H} Z" /><path class="l" d={line(x.spark)} /></svg
				></span
			>
		</div>
	{/each}
</div>
<span class="sr-only">{kg(t.kg)} kept out of landfill, {kg(t.destroyedKg)} destroyed, {kg(t.co2)} of CO₂e avoided.</span
>

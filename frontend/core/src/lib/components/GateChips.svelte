<script lang="ts">
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';

	/** a quick-commerce gate and whether the batch passes it (money.js gates()) */
	export type Gate = { id: string; app: string; rule: string; has: number; need: number; pass: boolean };
	// quiet: a failed gate on a batch that is not at risk, drawn neutral (red is for risk and the bin; SC-83)
	let { gates, size, quiet }: { gates: Gate[]; size?: 'sm'; quiet?: boolean } = $props();
</script>

<span class="row tight wrap"
	>{#each gates as g (g.id)}<span
			class={cx('gate', g.pass ? 'pass' : 'fail', !g.pass && quiet && 'quiet')}
			title="{g.app}: {g.rule}, has {g.has}"
			><Icon name={g.pass ? 'check' : 'x'} size={13} stroke={2.6} />{g.app}{#if size !== 'sm'}<span
					style="font-weight: 500">{g.has}/{g.need}</span
				>{/if}</span
		>{/each}</span
>

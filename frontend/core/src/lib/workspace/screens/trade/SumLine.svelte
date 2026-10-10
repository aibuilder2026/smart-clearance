<script lang="ts">
	import { fmt } from '../../model';
	import type { PtSum } from '../../types';
	import { shownSum } from './pt';

	// a cleared batch's own sum (SC-145, screens/trade.jsx SumLine), the page's part first: on Batches its credit, on
	// Orders its sales
	let { x, lead }: { x: PtSum; lead: 'credit' | 'sold' } = $props();
	const v = $derived(shownSum(x));
</script>

<span class="lg-val"
	>{#if lead === 'credit'}<b class="tnum">{fmt.inr(v.credit)} credited</b><em
			>+ {fmt.inr(v.sold)} sold = {fmt.inr(v.cost)}</em
		>{:else}<b class="tnum">{fmt.inr(v.sold)} sold</b><em>+ {fmt.inr(v.credit)} credited = {fmt.inr(v.cost)}</em
		>{/if}</span
>

<script lang="ts">
	import { fmt } from '../../model';
	import type { Hero } from '../../types';
	import Locked from '../common/Locked.svelte';

	// a batch Impact has not posted yet: it joins the ledger once its return window closes (screens/finance.jsx NotPosted)
	let { h, returnBy }: { h: Hero; returnBy: string } = $props();
</script>

<Locked
	icon="book-open-check"
	agent="Impact agent"
	live={h.phase === 'settled' && h.van.status === 'done'}
	text="Posts the batch to the ledger once the return window closes on {fmt.day(
		returnBy
	)}, and writes the BRSR row with evidence links."
/>

<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import type { LedgerOutcome } from '../../types';
	import { OUTCOME } from './ledger';

	// how a cleared batch came out: sold through, left at the godown, or donated (screens/finance.jsx OutcomeBadge)
	let { o, size }: { o: LedgerOutcome; size?: 'sm' } = $props();
	const x = $derived(OUTCOME[o]);
</script>

<Badge {size} tone={x.tone} icon={x.icon}>{x.label}</Badge>

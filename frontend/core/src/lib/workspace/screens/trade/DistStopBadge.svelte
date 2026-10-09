<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import type { DistJourney } from '../../dist';

	// where a batch in a journey stands for him: how many steps are his, else its stop (SC-133, screens/trade.jsx)
	let { j }: { j: Pick<DistJourney, 'todo' | 'phase' | 'stop'> } = $props();
	const cleared = $derived(j.phase === 'cleared');
</script>

<Badge size="sm" tone={j.todo.length ? 'amber' : cleared ? 'green' : 'blue'} dot live={!j.todo.length && !cleared}
	>{j.todo.length ? `${j.todo.length} for you` : j.stop}</Badge
>

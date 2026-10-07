<script lang="ts" module>
	type Tone = 'green' | 'amber' | 'red' | 'blue' | 'violet';
	/** what each state of a batch is called, and its tone */
	export const STATUS: Record<string, { tone?: Tone; label: string }> = {
		'at-risk': { tone: 'red', label: 'At risk' },
		gated: { tone: 'amber', label: 'Gated · selling through' },
		safe: { tone: 'green', label: 'Safe' },
		executing: { tone: 'green', label: 'In motion' },
		routed: { tone: 'green', label: 'Routed' },
		settled: { tone: 'blue', label: 'Settled' },
		cleared: { tone: 'green', label: 'Cleared' },
		watching: { label: 'Watching' },
		routing: { tone: 'green', label: 'Routing' },
		awaiting: { tone: 'amber', label: 'Awaiting approval' },
		dispatched: { tone: 'blue', label: 'Dispatched' }
	};
</script>

<script lang="ts">
	import Badge from './Badge.svelte';

	// a batch's state as a badge, with a live dot while it moves (the kit's StatusBadge)
	type Props = { status: string; live?: boolean };
	let { status, live }: Props = $props();
	const s = $derived(STATUS[status] || { label: status });
</script>

<!-- data-status names it for the a11y suite's coverage (@smart-clearance/testing/a11y); nothing styles it -->
<Badge tone={s.tone} dot {live} data-status={status}>{s.label}</Badge>

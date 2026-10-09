<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import type { PtOffer } from '../../types';

	// how an offer came out (SC-130): open, ordered with its count, declined, or expired
	const X = {
		open: { label: 'Open', tone: 'blue', icon: 'clock' },
		ordered: { label: 'Ordered', tone: 'green', icon: 'check' },
		declined: { label: 'Declined', tone: undefined, icon: 'x' },
		expired: { label: 'Expired', tone: undefined, icon: 'clock' }
	} as const;
	let { o, size }: { o: PtOffer; size?: 'sm' } = $props();
	const x = $derived(X[o.status]);
</script>

<Badge {size} tone={x.tone} icon={x.icon}>{o.status === 'ordered' ? `Ordered · ${o.units}` : x.label}</Badge>

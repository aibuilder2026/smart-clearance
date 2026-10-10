<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';

	// a channel's mark, in its own ink (SC-133, screens/trade.jsx Chan)
	const CH: Record<string, IconName> = {
		kirana: 'store',
		expiresoon: 'shopping-bag',
		staff: 'users',
		foodbank: 'heart-handshake',
		// destroyed at his godown (SC-139), in the bin's ink
		destroy: 'recycle'
	};
	const INK: Record<string, string> = { destroy: 'writeoff' };
	let { id, icon }: { id: string; icon?: IconName } = $props();
</script>

<span class="dist-chan" style="--ch: var(--ch-{INK[id] ?? id})" aria-hidden="true"
	><Icon name={icon ?? CH[id]} size={16} stroke={2} /></span
>

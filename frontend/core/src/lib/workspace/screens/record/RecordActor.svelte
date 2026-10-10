<script lang="ts">
	import Avatar from '../../../components/Avatar.svelte';
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import { useWorkspace } from '../../source';
	import type { RecordWho } from '../../types';

	// who took a step: a person's face, or the agent's tile (the shops' orders, a tile of their own)
	let { who, size = 36 }: { who: RecordWho; size?: number } = $props();
	const ws = useWorkspace();
	const ICON: Record<string, IconName> = {
		watcher: 'radar',
		vision: 'scan-line',
		valuer: 'coins',
		router: 'route',
		lister: 'shopping-bag',
		outreach: 'send',
		negotiator: 'messages-square',
		donation: 'heart-handshake',
		paperwork: 'file-text',
		impact: 'leaf',
		data: 'database',
		notifier: 'bell'
	};
	const person = $derived(who.kind === 'person' && who.id ? (ws.data.people[who.id] ?? { name: who.name }) : null);
</script>

{#if person}<Avatar {person} size={size < 36 ? 'sm' : undefined} />
{:else}<span
		class={cx('icontile', who.kind === 'agent' && 'soft')}
		style="width: {size}px; height: {size}px; border-radius: 11px"
		><Icon
			name={who.kind === 'agent' ? (ICON[who.id ?? ''] ?? 'sparkles') : 'store'}
			size={Math.round(size * 0.47)}
			stroke={2}
		/></span
	>{/if}

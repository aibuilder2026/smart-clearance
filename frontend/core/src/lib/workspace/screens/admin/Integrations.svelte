<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import { useNotice } from '../../../notice.svelte';
	import { store } from '../../store.svelte';
	import type { Integration, User } from '../../types';
	import Screen from '../common/Screen.svelte';

	// integrations: Munchly's sign-in, the Google Cloud services and the partner APIs, each connected or mocked, with a
	// Test that answers in a toast (screens/admin.jsx Integrations)
	let { me }: { me: User } = $props();
	const { toast } = useNotice();
	const KIND_ICON: Record<string, IconName> = {
		Identity: 'key-round',
		Push: 'bell',
		Data: 'database',
		Events: 'webhook',
		Agents: 'sparkles',
		Marketplace: 'shopping-bag',
		Donation: 'heart-handshake',
		Inventory: 'file-spreadsheet',
		Accounting: 'receipt'
	};
	let busy = $state<string | null>(null);

	const test = (i: Integration) => {
		busy = i.id;
		setTimeout(() => {
			busy = null;
			toast({
				text: `${i.name} · ${i.status === 'mock' ? 'stub answered' : 'connected'} in ${80 + Math.round(Math.random() * 160)} ms`,
				tone: 'ok'
			});
		}, 900);
	};
</script>

<Screen {me} title="Integrations" sub="Munchly's sign-in, Google Cloud services and partner APIs">
	<div class="list">
		{#each store.state.integrations as i (i.id)}<div
				class="list-row"
				style="grid-template-columns: 40px minmax(0,1fr) auto"
			>
				<span class={cx('icontile', i.status === 'mock' && 'soft')}
					><Icon name={KIND_ICON[i.kind] || 'plug'} size={17} stroke={2} /></span
				><span class="stack tight" style="gap: 0"
					><b class="t-subhead">{i.name} <span class="subtle t-caption" style="font-weight: 500">{i.kind}</span></b
					><span class="t-caption subtle">{i.note}</span></span
				><span class="row tight"
					><Badge size="sm" tone={i.status === 'ok' ? 'green' : 'violet'} dot
						>{i.status === 'ok' ? 'connected' : 'mocked'}</Badge
					><Button variant="ghost" size="sm" loading={busy === i.id} onclick={() => test(i)}>Test</Button></span
				>
			</div>{/each}
	</div>
</Screen>

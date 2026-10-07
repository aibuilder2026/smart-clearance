<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import PoweredBy from '../../../components/PoweredBy.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import WorkspaceMark from '../../../components/WorkspaceMark.svelte';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Url from './Url.svelte';

	// inside the app: the workspace the person is in, how they signed in, and their other workspaces (screens/auth.jsx
	// WorkspaceSheet)
	type Props = { open?: boolean; onclose?: () => void; me: User; onsettings?: (() => void) | null };
	let { open = $bindable(false), onclose, me, onsettings }: Props = $props();
	const ws = useWorkspace();
	const app = useApp();
	const how = $derived(
		me.provider === 'google'
			? me.kind === 'staff'
				? `Google Workspace · ${me.email}`
				: `Google, by invitation · ${me.email}`
			: me.provider === 'phone'
				? `One-time code · ${me.phone}`
				: me.provider
	);
</script>

{#snippet wsMark()}<WorkspaceMark ws={ws.data.workspace} size={32} />{/snippet}
{#snippet current()}<Badge size="sm" tone="green" icon="check">current</Badge>{/snippet}

<Sheet bind:open {onclose} title="Workspace" side={app.bp === 'phone' ? 'bottom' : 'center'} detent="large">
	<div class="stack">
		<div class="row" style="gap: 14px">
			<WorkspaceMark ws={ws.data.workspace} size={56} />
			<div class="stack tight" style="gap: 4px; min-width: 0">
				<div class="t-title3">{ws.data.workspace.name}</div>
				<Url />
			</div>
		</div>
		<List head="You">
			<ListRow title={me.name} sub="{ws.data.roles[me.role]} · {me.org}" />
			<ListRow title="Signed in with" sub={how} />
		</List>
		<List
			head="Your workspaces"
			foot={me.kind === 'partner'
				? 'If another brand you work with runs Smart-Clearance, its workspace appears here too, under the same sign-in.'
				: `${ws.data.workspace.plan} since ${ws.data.workspace.since} · ${ws.data.workspace.region}`}
		>
			<ListRow leading={wsMark} title={ws.data.workspace.name} sub={ws.data.workspace.domain} value={current} />
		</List>
		{#if me.role === 'admin' && onsettings}<Button variant="secondary" icon="building-2" onclick={onsettings}
				>Workspace settings</Button
			>{/if}
		<div class="row" style="justify-content: center; padding-top: 4px"><PoweredBy /></div>
	</div>
</Sheet>

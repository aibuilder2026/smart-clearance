<script lang="ts">
	import { useNotice } from '../../../notice.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import WorkspaceMark from '../../../components/WorkspaceMark.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { rise } from '../../../motion/transitions';
	import { useWorkspace } from '../../source';

	const ws = useWorkspace();
	const c = $derived(ws.case!);

	// the one-time permission: the agent may act in his name, inside Munchly's floors, and he can pause it
	let busy = $state(false);
	let later = $state(false);
	const { toast } = useNotice();
	const allow = () => {
		busy = true;
		void ws.act('permit', undefined, { feel: 600 }).then(() => {
			busy = false;
			toast({ text: 'Allowed · you can pause it any time', tone: 'ok' });
		});
	};
</script>

{#if later}
	<Card class="row wrap" style="gap: 14px"
		><WorkspaceMark ws={ws.data.workspace} size={36} />
		<div class="grow">
			<b>{ws.data.workspace.short} is waiting for your permission</b>
			<div class="t-footnote muted">Nothing is listed or offered in your name until you allow it.</div>
		</div>
		<Button variant="secondary" onclick={() => (later = false)}>Review</Button></Card
	>
{:else}
	<div class="bezel" in:rise|global={{ y: 8 }}>
		<div class="card raised stack snug" style="padding: 20px">
			<div class="row tight">
				<WorkspaceMark ws={ws.data.workspace} size={30} /><span class="t-footnote subtle strong"
					>{ws.data.workspace.name} · {c.permissionAsked}</span
				>
			</div>
			<div class="t-title3">Let Smart-Clearance act for {c.dist.name}</div>
			<div class="stack tight">
				{#each ws.data.setup.acts as t (t)}<div class="row top t-subhead" style="gap: 10px">
						<Icon
							name="check"
							size={17}
							stroke={2.4}
							style="color: var(--primary-text); margin-top: 2px; flex: none"
						/><span>{t}</span>
					</div>{/each}
			</div>
			<p class="t-footnote muted" style="margin: 0">
				Always within {ws.data.workspace.short}'s price floors. Every action shows here, and you can pause any of it.
				{ws.data.workspace.short} pays you the gap to the ₹{c.sku.dp} you paid, so you end whole.
			</p>
			<div class="row wrap" style="gap: 10px">
				<Button variant="approve" size="lg" icon="check" loading={busy} onclick={allow}>Allow</Button><Button
					variant="ghost"
					size="lg"
					onclick={() => (later = true)}>Not now</Button
				>
			</div>
		</div>
	</div>
{/if}

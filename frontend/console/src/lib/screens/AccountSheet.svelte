<script lang="ts">
	import { Alert, Avatar, Button, List, ListRow, Sheet, useApp } from '@smart-clearance/core';
	import { api, usingMock } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';

	// the signed-in person: who they are, their passkey, sign out; and, in the prototype, a way back to the seed data
	let { open = $bindable(false), onout }: { open?: boolean; onout: () => void } = $props();
	const app = useApp();
	const k = useConsole();
	let reset = $state(false);
</script>

{#snippet email()}<span class="t-footnote">{k.me.email}</span>{/snippet}
{#snippet passkey()}<span class="t-footnote">{k.me.passkey}</span>{/snippet}

<Sheet bind:open title="Account" side={app.bp === 'phone' ? 'bottom' : 'center'} detent="medium">
	<div class="stack">
		<div class="row" style="gap: 14px">
			<Avatar person={k.me} size="lg" />
			<div class="stack tight" style="gap: 2px">
				<b class="t-headline">{k.me.name}</b><span class="t-footnote subtle">{k.me.role} · {k.me.team}</span>
			</div>
		</div>
		<List><ListRow title="Email" value={email} /><ListRow title="Passkey" value={passkey} /></List>
		<div class="row tight wrap">
			<Button icon="log-out" onclick={onout}>Sign out</Button>{#if usingMock && api.reset}<Button
					variant="ghost"
					icon="rotate-ccw"
					onclick={() => (reset = true)}>Reset prototype data</Button
				>{/if}
		</div>
		<Alert
			bind:open={reset}
			title="Reset the prototype's data?"
			message="Clients you set up and every change go back to the seed: Munchly Foods as the only client."
			actions={[
				{ label: 'Cancel' },
				{
					label: 'Reset',
					danger: true,
					strong: true,
					onclick: async () => {
						await k.act(() => api.reset!(), 'Back to the seed data');
						open = false;
					}
				}
			]}
		/>
	</div>
</Sheet>

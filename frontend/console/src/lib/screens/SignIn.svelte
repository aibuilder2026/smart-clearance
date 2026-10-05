<script lang="ts">
	import type { StaffAccount } from '@smart-clearance/api/console';
	import plate from '$design3/site/assets/plates/scene.webp';
	import { Avatar, Button, FindWorkspace, Icon, Mark, Sheet, useApp, Wordmark } from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import { api, usingMock } from '#lib/api/client.ts';
	import { accountsQuery } from '#lib/api/queries.ts';
	import { LINKS } from '#lib/links.ts';
	import GoogleG from './GoogleG.svelte';

	// sign-in: platform staff only, Google then a passkey. In the mock, the sheets list the platform's staff, standing in
	// for Google's account chooser and the device's passkey prompt
	let { onin }: { onin: (staffId: string) => Promise<void> } = $props();
	const app = useApp();
	const accounts = createQuery(() => accountsQuery());
	let sheet: 'google' | 'passkey-pick' | 'passkey' | null = $state(null);
	let who: StaffAccount | null = $state(null);
	let busy = $state(false);
	let find = $state(false);
	const side = $derived(app.bp === 'phone' ? 'bottom' : 'center');

	async function confirm() {
		if (!who) return;
		busy = true;
		try {
			// the prototype's passkey takes a moment; a real one takes as long as the reader's touch
			await Promise.all([onin(who.id), usingMock ? new Promise((r) => setTimeout(r, 900)) : null]);
		} finally {
			busy = false;
		}
	}
	const close = () => (sheet = null);
</script>

{#snippet list(path: 'google' | 'passkey')}
	<div class="stack">
		<div class="row tight">
			{#if path === 'google'}<GoogleG size={20} />{:else}<Icon name="fingerprint" size={20} />{/if}<span
				class="t-subhead"
				><b>Choose an account</b> to continue to <span class="mono">console.smartclearance.com</span></span
			>
		</div>
		{#each accounts.data ?? [] as st (st.id)}<button
				type="button"
				class="list-row si-acct"
				onclick={() => {
					who = st;
					sheet = 'passkey';
				}}
				><Avatar person={st} size="sm" /><span class="stack tight" style="gap: 0; min-width: 0"
					><b class="t-subhead">{st.name}</b><span class="t-caption subtle" style="overflow-wrap: anywhere"
						>{st.email}</span
					></span
				><Icon name="chevron-right" size={18} class="subtle" /></button
			>{/each}
		<p class="t-footnote muted" style="margin: 0">
			The console lets in only smartclearance.com accounts. Client teams never sign in here.
		</p>
	</div>
{/snippet}

<div class="signin cs-signin">
	<div class="ground" aria-hidden="true"></div>
	{#if app.bp === 'desktop'}<div class="cs-si-stage">
			<div class="si-product"><Mark size={36} /><Wordmark size={21} /></div>
			<div class="stack tight" style="gap: 10px">
				<h2 class="cs-si-title">Console</h2>
				<p class="cs-si-lede">Set up and run every client's workspace: its agents, its supply chain, its people.</p>
			</div>
			<img class="cs-si-plate" src={plate} alt="" width="1376" height="752" />
		</div>{/if}
	<div class="si-panel">
		<div class="si-card">
			<div class="si-ws">
				<Mark size={app.bp === 'phone' ? 52 : 60} />
				<div class="si-ws-name">Smart-Clearance staff</div>
				<span class="si-url"><Icon name="lock" size={12} stroke={2.2} />console.smartclearance.com</span>
			</div>
			<div class="stack tight" style="gap: 6px">
				<h1 class="si-title">Sign in</h1>
				<p class="si-sub">Use your smartclearance.com Google account, then your passkey.</p>
			</div>
			<div class="stack" style="width: 100%; gap: 10px">
				<button type="button" class="btn btn-secondary btn-lg btn-block" onclick={() => (sheet = 'google')}
					><GoogleG />Continue with Google</button
				>
				<Button variant="primary" size="lg" block icon="fingerprint" onclick={() => (sheet = 'passkey-pick')}
					>Use a passkey</Button
				>
			</div>
			<div class="si-foot">
				<span class="t-footnote muted" style="max-width: 36ch"
					>Client teams sign in at their own workspace address, such as munchly.smartclearance.com.</span
				>
				<span class="si-foot-row"
					><button type="button" class="btn btn-link btn-sm" onclick={() => (find = true)}>Find a workspace</button><a
						class="btn btn-link btn-sm"
						href={LINKS.site}>smartclearance.com</a
					></span
				>
				{#if usingMock}<span class="si-note">Prototype · every person and number is fictional</span>{/if}
			</div>
		</div>
	</div>
	<Sheet open={sheet === 'google'} onclose={close} title="Sign in with Google" {side} detent="medium"
		>{@render list('google')}</Sheet
	>
	<Sheet open={sheet === 'passkey-pick'} onclose={close} title="Use a passkey" {side} detent="medium"
		>{@render list('passkey')}</Sheet
	>
	<Sheet open={sheet === 'passkey'} onclose={close} title="Confirm it's you" {side} detent="medium">
		{#snippet footer()}<Button variant="primary" size="lg" block icon="fingerprint" loading={busy} onclick={confirm}
				>Use passkey</Button
			>{/snippet}
		{#if who}<div class="stack" style="justify-items: center; text-align: center">
				<span class="cs-passkey" aria-hidden="true"><Icon name="fingerprint" size={38} stroke={1.6} /></span>
				<div class="stack tight" style="gap: 2px">
					<b class="t-headline">{who.name}</b><span class="t-footnote subtle">{who.email}</span>
				</div>
				<p class="t-subhead muted" style="margin: 0; max-width: 38ch">
					Your passkey on {who.passkey} confirms it's you. The console asks for it every time, even after Google.
				</p>
			</div>{/if}
	</Sheet>
	<FindWorkspace
		bind:open={find}
		find={(q) => api.lookupWorkspaces(q)}
		onuse={() => {
			find = false;
			window.open(LINKS.app, '_blank', 'noopener');
		}}
		domain="smartclearance.com"
		note={usingMock ? 'Only Munchly Foods is set up in this prototype.' : undefined}
	/>
</div>

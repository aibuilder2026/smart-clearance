<script lang="ts">
	import plate from '$design3/site/assets/plates/scene.webp';
	import { onMount } from 'svelte';
	import { preloadCode } from '$app/navigation';
	import {
		Field,
		FindWorkspace,
		Icon,
		Input,
		Mark,
		prefersReducedMotion,
		useApp,
		Wordmark
	} from '@smart-clearance/core';
	import { ApiError, SIGN_IN_FAILED, type SignInInput, type Staff } from '@smart-clearance/api/console';
	import { api, usingMock } from '#lib/api/client.ts';
	import { LINKS } from '#lib/links.ts';
	import SignInButton, { type Phase } from './SignInButton.svelte';

	// sign-in: platform staff only, a work email and a password, in the card (SC-46, option A). One message for any wrong
	// sign-in: Firebase's email enumeration protection never says which part was wrong. Nothing is mailed, so there is
	// no "forgot password": a Super admin puts an account back on its first password. The mock lets any active staff
	// member in with any password. Sign in keeps its label while it checks, and says who is in before the console opens
	// (SC-49): `check` signs in, `enter` opens the console
	type Props = { check: (input: SignInInput) => Promise<Staff>; enter: (staff: Staff) => Promise<void> };
	let { check, enter }: Props = $props();
	const app = useApp();
	let email = $state('');
	let password = $state('');
	let show = $state(false);
	let error = $state('');
	let phase = $state<Phase>('idle');
	let first = $state('');
	let find = $state(false);
	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
	const say = (err: unknown) => (err instanceof ApiError || err instanceof Error ? err.message : SIGN_IN_FAILED);
	// the console's code is fetched while the person types, so signing in waits only on the platform's reads (SC-131)
	onMount(() => void preloadCode('/').catch(() => undefined));

	// a wrong sign-in shakes the button, then says so; the welcome holds for a moment, under reduced motion too (it is
	// a state, not a movement)
	async function fail(message: string) {
		phase = 'error';
		await wait(prefersReducedMotion.current ? 0 : 360);
		phase = 'idle';
		error = message;
	}
	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (phase === 'busy' || phase === 'done') return;
		error = '';
		if (!email.trim() || !password) return void fail(SIGN_IN_FAILED);
		phase = 'busy';
		let staff: Staff;
		try {
			staff = await check({ email, password });
		} catch (err) {
			return void fail(say(err));
		}
		first = staff.name.split(' ')[0];
		phase = 'done';
		await wait(720);
		try {
			await enter(staff);
		} catch (err) {
			phase = 'idle';
			error = say(err);
		}
	}
	const edit = () => (error = '');
</script>

<div class="signin cs-signin">
	<div class="ground" aria-hidden="true"></div>
	{#if app.bp === 'desktop'}<div class="cs-si-stage">
			<div class="si-product"><Mark size={36} /><Wordmark size={21} /></div>
			<div class="stack tight" style="gap: 10px">
				<h2 class="cs-si-title">Console</h2>
				<p class="cs-si-lede">Set up and run every client's workspace: its agents, its supply chain, its people.</p>
			</div>
			<img class="cs-si-plate" src={plate} alt="" width="1376" height="752" fetchpriority="low" decoding="async" />
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
				<p class="si-sub">Your smartclearance.com email address and your password.</p>
			</div>
			<form class="si-form" novalidate onsubmit={submit}>
				<Field label="Work email" htmlFor="si-email"
					><Input
						id="si-email"
						icon="mail"
						type="email"
						bind:value={email}
						oninput={edit}
						autocomplete="username"
						spellcheck={false}
						autocapitalize="none"
						placeholder="name@smartclearance.com"
					/></Field
				>
				<Field label="Password" htmlFor="si-pw"
					><span class="input-wrap cs-si-pw"
						><Icon name="lock" size={17} /><input
							id="si-pw"
							class="input"
							type={show ? 'text' : 'password'}
							bind:value={password}
							oninput={edit}
							autocomplete="current-password"
						/><button
							type="button"
							class="cs-si-eye"
							aria-label={show ? 'Hide password' : 'Show password'}
							aria-pressed={show}
							onclick={() => (show = !show)}><Icon name={show ? 'eye-off' : 'eye'} size={20} /></button
						></span
					></Field
				>
				{#if error}<div class="cs-si-error" role="alert">
						<Icon name="circle-alert" size={18} /><span>{error}</span>
					</div>{/if}
				<SignInButton {phase} name={first} />
				<p class="t-footnote muted cs-si-hint">
					New to the console? The platform team gives you your first password. Nothing is sent by email.
				</p>
			</form>
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

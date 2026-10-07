<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Avatar from '../../../components/Avatar.svelte';
	import Button from '../../../components/Button.svelte';
	import Field from '../../../components/Field.svelte';
	import Input from '../../../components/Input.svelte';
	import PoweredBy from '../../../components/PoweredBy.svelte';
	import Product from '../../../components/Product.svelte';
	import WorkspaceMark from '../../../components/WorkspaceMark.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { isEmail } from '../../../identity';
	import { prefersReducedMotion } from '../../../motion';
	import FindWorkspace, { type WorkspaceMatch } from '../../../patterns/FindWorkspace.svelte';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import HeroStage from './HeroStage.svelte';
	import SignInButton, { type Phase } from './SignInButton.svelte';
	import Url from './Url.svelte';

	// signing in to a client's live workspace (SC-73; SC-68's sign-in, screens/live.jsx SignInLive): the console's email
	// and password (SC-46) in the client's own card (SC-24). One message for any wrong sign-in (email enumeration
	// protection is on), and no forgot-password, since nothing is mailed. A synthetic workspace offers the story's people
	// as chips that fill the email only; the password is handed over apart. An account that signs in but is not a member
	// here is told so, with the backend's words and nothing the backend did not say
	// onbusy: the sign-in is checking (true) or gave up (false), so the app keeps it on screen through the welcome
	type Props = { onsignedin: (u: User) => void | Promise<void>; onbusy?: (busy: boolean) => void };
	let { onsignedin, onbusy }: Props = $props();
	const ws = useWorkspace();
	const app = useApp();
	const W = $derived(ws.publicInfo?.workspace ?? ws.data.workspace);
	const groups = $derived(ws.publicInfo?.accounts ?? []);

	let email = $state('');
	let password = $state('');
	let show = $state(false);
	let error = $state('');
	let phase = $state<Phase>('idle');
	let first = $state('');
	let find = $state(false);
	/** the address that signed in but is not a member here, and what the backend said */
	let outside = $state<{ email: string; message: string } | null>(null);
	let pw: HTMLInputElement | null = $state(null);
	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
	const say = (e: unknown) => (e instanceof Error && e.message ? e.message : 'That email and password do not match.');

	// a wrong sign-in shakes the button, then says so; the welcome holds for a moment, under reduced motion too (it is a
	// state, not a movement)
	async function fail(message: string) {
		phase = 'error';
		await wait(prefersReducedMotion.current ? 0 : 360);
		phase = 'idle';
		error = message;
		password = '';
	}
	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (phase === 'busy' || phase === 'done') return;
		error = '';
		if (!email.trim() || !password) return void fail(say(new Error('Enter your email address and your password.')));
		phase = 'busy';
		onbusy?.(true);
		let me: User;
		try {
			me = await ws.signIn({ email: email.trim(), password });
		} catch (err) {
			onbusy?.(false);
			if (ws.outsider) {
				phase = 'idle';
				outside = { email: email.trim(), message: ws.outsider };
				password = '';
				return;
			}
			return void fail(say(err));
		}
		first = me.short || me.name.split(' ')[0];
		phase = 'done';
		await wait(720);
		await onsignedin(me);
	}
	const edit = () => (error = '');
	const other = () => {
		outside = null;
		email = '';
		password = '';
	};
	// Find your workspace, from this workspace alone: an address on its own domain, or one it offers on its sign-in
	async function lookup(t: string): Promise<WorkspaceMatch[]> {
		const v = t.trim().toLowerCase();
		const known = groups.some((g) => g.people.some((p) => p.email.toLowerCase() === v));
		return isEmail(v) && (known || v.endsWith('@' + W.emailDomain)) ? [{ workspace: W, value: t }] : [];
	}
</script>

<div class="signin">
	<div class="ground" aria-hidden="true"></div>
	{#if app.bp === 'desktop'}<HeroStage guided />{/if}
	<div class="si-panel">
		<div class="si-card">
			<div class="si-ws">
				<WorkspaceMark ws={W} size={app.bp === 'phone' ? 52 : 60} />
				<div class="si-ws-name">{W.name}</div>
				<Url />
			</div>
			{#if app.bp !== 'desktop' && !outside}<div class="si-hero" aria-hidden="true">
					<Product name="carton-hero" size={app.bp === 'phone' ? 120 : 150} float />
				</div>{/if}
			<div class="stack tight" style="gap: 6px">
				<h1 class="si-title">{outside ? 'Not a member here' : 'Sign in'}</h1>
				{#if !outside}<p class="si-sub">Use the email address you were invited with, and your password.</p>{/if}
			</div>
			{#if outside}<div class="si-form" style="gap: 14px">
					<div class="si-who">
						<span class="si-who-av" aria-hidden="true"><Icon name="user" size={20} /></span><span class="si-who-t"
							><span class="si-who-k">Signed in as</span><b>{outside.email}</b></span
						>
					</div>
					<div class="si-out" role="alert">
						<Icon name="info" size={18} /><span
							>{outside.message} Ask {W.short}'s workspace admin to invite you, or open a workspace you belong to.</span
						>
					</div>
					<Button variant="secondary" size="lg" block icon="log-out" onclick={other}
						>Sign in with another account</Button
					>
				</div>{:else}<form class="si-form" novalidate onsubmit={submit}>
					<Field label="Email" htmlFor="si-email"
						><Input
							id="si-email"
							icon="mail"
							type="email"
							bind:value={email}
							oninput={edit}
							autocomplete="username"
							spellcheck={false}
							autocapitalize="none"
							placeholder={W.hint || `name@${W.emailDomain}`}
						/></Field
					>
					<Field label="Password" htmlFor="si-pw"
						><span class="input-wrap si-pw"
							><Icon name="lock" size={17} /><input
								bind:this={pw}
								id="si-pw"
								class="input"
								type={show ? 'text' : 'password'}
								bind:value={password}
								oninput={edit}
								autocomplete="current-password"
								aria-invalid={error ? 'true' : undefined}
								aria-describedby={error ? 'si-err' : undefined}
							/><button
								type="button"
								class="si-eye"
								aria-label={show ? 'Hide password' : 'Show password'}
								aria-pressed={show}
								onclick={() => (show = !show)}><Icon name={show ? 'eye-off' : 'eye'} size={20} /></button
							></span
						></Field
					>
					{#if error}<div class="si-err" id="si-err" role="alert">
							<Icon name="circle-alert" size={18} /><span>{error}</span>
						</div>{/if}
					<SignInButton {phase} name={first} />
					<p class="t-footnote muted si-hint">
						First time here? Whoever invited you gives you your first password. Nothing is sent by email.
					</p>
				</form>
				{#if groups.length}<div class="si-try">
						<span class="t-caption subtle strong">People in the story</span>
						{#each groups as g (g.group)}<div class="si-chips">
								<span class="t-caption subtle">{g.group}</span>
								<div class="row tight wrap" style="justify-content: center">
									{#each g.people as p (p.id)}<button
											type="button"
											class="chip"
											onclick={() => {
												email = p.email;
												error = '';
												pw?.focus();
											}}><Avatar person={p} size="xs" />{p.name}</button
										>{/each}
								</div>
							</div>{/each}
						<span class="t-caption subtle"
							>A name fills in its email. The password is handed over with the invitation.</span
						>
					</div>{/if}{/if}
			<div class="si-foot">
				<PoweredBy />
				<span class="si-foot-row"
					><button type="button" class="btn btn-link btn-sm" onclick={() => (find = true)}
						>Not your workspace? Find yours</button
					></span
				>
			</div>
		</div>
	</div>
	<FindWorkspace
		bind:open={find}
		initial={email}
		find={lookup}
		domain={(ws.publicInfo?.platform ?? ws.data.platform).domain}
		onuse={(v) => {
			find = false;
			outside = null;
			email = v;
			error = '';
		}}
	/>
</div>

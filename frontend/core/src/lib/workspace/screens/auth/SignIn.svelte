<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Avatar from '../../../components/Avatar.svelte';
	import Button from '../../../components/Button.svelte';
	import Field from '../../../components/Field.svelte';
	import Input from '../../../components/Input.svelte';
	import Money from '../../../components/Money.svelte';
	import OTP from '../../../components/OTP.svelte';
	import PoweredBy from '../../../components/PoweredBy.svelte';
	import Product from '../../../components/Product.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import Spinner from '../../../components/Spinner.svelte';
	import WorkspaceMark from '../../../components/WorkspaceMark.svelte';
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import { digits, isEmail, phoneOf } from '../../../identity';
	import { rise } from '../../../motion/transitions';
	import FindWorkspace, { type WorkspaceMatch } from '../../../patterns/FindWorkspace.svelte';
	import { act } from '../../flow';
	import { D, WS } from '../../data';
	import { role } from '../../model';
	import { store } from '../../store.svelte';
	import type { User } from '../../types';
	import GoogleG from './GoogleG.svelte';
	import HeroStage from './HeroStage.svelte';
	import PeopleList from './PeopleList.svelte';
	import { TEST_CODE } from './people';
	import Url from './Url.svelte';

	// signing in to the client's workspace, munchly.smartclearance.com (screens/auth.jsx SignIn). Email or phone first:
	// a munchly.in address goes to Munchly's Google Workspace, an invited number gets a one-time code, a first-time
	// invitee joins the workspace, and anyone else is pointed to "Find your workspace". guided: the demo drives it (a
	// prefilled identity, the SMS code filled in, no shortcuts)
	type Props = {
		onsignin: (uid: string) => void;
		install?: { can: boolean; prompt: () => void };
		guided?: boolean;
		prefill?: string;
	};
	let { onsignin, install, guided, prefill = '' }: Props = $props();

	const app = useApp();
	const WS_OF = WS.name + "' workspace";
	const userById = (id: string) => store.state.users.find((u) => u.id === id);

	// svelte-ignore state_referenced_locally (the demo's prefill is the field's first value only)
	let id = $state(prefill);
	let err = $state<{ text: string; find?: boolean; es?: string } | null>(null);
	let busy = $state<string | null>(null);
	let sheet = $state<'google' | 'code' | 'join' | 'find' | 'demo' | null>(null);
	let who = $state<User | null>(null);
	let code = $state('');
	let codeErr = $state('');
	const close = () => (sheet = null);

	function finish(uid: string) {
		busy = uid;
		setTimeout(() => {
			busy = null;
			sheet = null;
			onsignin(uid);
		}, 600);
	}
	function proceed() {
		const v = id.trim();
		err = null;
		if (!v) return void (err = { text: 'Enter your work email or mobile number.' });
		const users = store.state.users;
		if (isEmail(v)) {
			const email = v.toLowerCase();
			const u = users.find((x) => x.email && x.email.toLowerCase() === email);
			if (u && u.kind === 'external')
				return void (err = {
					text: `${u.org} buys on ExpireSoon, another company's marketplace, so it has no account in ${WS_OF}.`,
					es: u.id
				});
			if (u && u.status === 'deactivated')
				return void (err = {
					text: "Your admin deactivated this account. Ask Munchly's workspace admin to restore it."
				});
			if (!u)
				return void (err = {
					text: email.endsWith('@' + WS.emailDomain)
						? `There's no account for ${email} in ${WS_OF} yet. Ask your workspace admin for access.`
						: `${email} isn't a member of ${WS_OF}.`,
					find: true
				});
			busy = 'go';
			setTimeout(() => {
				busy = null;
				who = u;
				sheet = 'google';
			}, 500);
			return;
		}
		const d = digits(v);
		if (d.length === 10) {
			const u = users.find((x) => x.phone && digits(x.phone) === d);
			if (!u)
				return void (err = {
					text: `No one has invited ${phoneOf(d)} to ${WS_OF}. Ask your distributor or Munchly for an invitation.`,
					find: true
				});
			if (u.status === 'deactivated')
				return void (err = {
					text: 'Your admin deactivated this number. Ask your distributor or Munchly to restore it.'
				});
			busy = 'go';
			setTimeout(() => {
				busy = null;
				who = u;
				code = guided ? TEST_CODE : '';
				codeErr = '';
				sheet = 'code';
			}, 600);
			return;
		}
		err = { text: 'Enter an email address, or a 10-digit mobile number.' };
	}
	function verify(v?: string) {
		const c = v || code;
		if (c.length < 6 || !who) return;
		const person = who;
		busy = 'verify';
		setTimeout(() => {
			busy = null;
			if (c !== TEST_CODE) {
				codeErr = `That code doesn't match. This prototype sends ${TEST_CODE}.`;
				code = '';
				return;
			}
			if (person.status === 'invited') sheet = 'join';
			else finish(person.id);
		}, 700);
	}
	function join() {
		if (!who) return;
		act('join', who.id);
		finish(who.id);
	}

	// Find your workspace looks the email or number up in this workspace only: Munchly is the one set up here
	async function find(t: string): Promise<WorkspaceMatch[]> {
		const users = store.state.users;
		let u: User | undefined;
		if (isEmail(t)) u = users.find((x) => x.email && x.email.toLowerCase() === t.toLowerCase());
		else u = users.find((x) => x.phone && digits(x.phone) === digits(t));
		if ((u && u.kind !== 'external') || (isEmail(t) && t.toLowerCase().endsWith('@' + WS.emailDomain)))
			return [{ workspace: WS, value: t }];
		return [];
	}

	const TRY: [string, string][] = [
		['priya', D.people.priya.email!],
		['rakesh', D.people.rakesh.phone!],
		['ganesh', D.people.ganesh.phone!],
		['shreesai', '+91 98230 60013']
	];
	const isPhone = $derived(!!who && !!who.phone && sheet !== 'google');
	const side = $derived(app.bp === 'phone' ? 'bottom' : 'center');
</script>

<div class={cx('signin', guided && 'guided')}>
	<div class="ground" aria-hidden="true"></div>
	{#if app.bp === 'desktop'}<HeroStage {guided} />{/if}
	<div class="si-panel">
		<div class="si-card">
			<div class="si-ws">
				<WorkspaceMark ws={WS} size={app.bp === 'phone' ? 52 : 60} />
				<div class="si-ws-name">{WS.name}</div>
				<Url />
			</div>
			{#if app.bp !== 'desktop'}<div class="si-hero" aria-hidden="true">
					<Product name="carton-hero" size={app.bp === 'phone' ? 132 : 160} float />
					{#if !guided}<div class="si-chip" in:rise|global={{ delay: 900 }}>
							<span class="dot"></span><span
								><b>MF-2409-117</b> · routed · <Money value={D.actual.net} size="s" style="font-size: 15px" /> recovered</span
							>
						</div>{/if}
				</div>{/if}
			<div class="stack tight" style="gap: 6px">
				<h1 class="si-title">Sign in</h1>
				<p class="si-sub">Use your Munchly email, or the mobile number Munchly or your distributor invited.</p>
			</div>
			<form
				class="si-form"
				onsubmit={(e) => {
					e.preventDefault();
					proceed();
				}}
				novalidate
			>
				<Field label="Work email or mobile number" htmlFor="si-id" error={err?.text}
					><Input
						id="si-id"
						bind:value={id}
						oninput={() => (err = null)}
						autocomplete="username"
						spellcheck={false}
						autocapitalize="none"
						placeholder="name@munchly.in or 98230 44118"
					/></Field
				>
				{#if err && (err.find || err.es)}<div class="row tight wrap" style="margin-top: -4px">
						{#if err.find}<button type="button" class="btn btn-link btn-sm" onclick={() => (sheet = 'find')}
								>Find your workspace</button
							>{/if}{#if err.es}{@const es = err.es}<button
								type="button"
								class="btn btn-link btn-sm"
								onclick={() => finish(es)}>Open ExpireSoon instead</button
							>{/if}
					</div>{/if}
				<Button type="submit" variant="primary" size="lg" block loading={busy === 'go'}>Continue</Button>
			</form>
			{#if !guided}<div class="si-try">
					<span class="t-caption subtle strong">Accounts in this prototype</span>
					<div class="row tight wrap" style="justify-content: center">
						{#each TRY as [uid, val] (uid)}
							{@const u = userById(uid)}
							{#if u}<button
									type="button"
									class="chip"
									onclick={() => {
										id = val;
										err = null;
									}}
									><Avatar person={u} size="xs" />{u.short || u.name}{u.status === 'invited'
										? ' · invited'
										: ''}</button
								>{/if}
						{/each}
					</div>
				</div>
				<div class="si-or" aria-hidden="true"><span>or</span></div>
				<button type="button" class="btn btn-secondary btn-lg btn-block" onclick={() => (sheet = 'demo')}
					><Icon name="users" size={18} />Explore as someone in the story</button
				>{/if}
			<div class="si-foot">
				<PoweredBy />
				<span class="si-foot-row"
					><button type="button" class="btn btn-link btn-sm" onclick={() => (sheet = 'find')}
						>Not your workspace? Find yours</button
					>{#if install && install.can}<button type="button" class="btn btn-ghost btn-sm" onclick={install.prompt}
							><Icon name="download" size={15} />Install</button
						>{/if}</span
				>
				<span class="si-note">Prototype · every company, person and number is fictional</span>
			</div>
		</div>
	</div>

	<Sheet open={sheet === 'google'} onclose={close} title="Sign in with Google" {side} detent="medium">
		{#if who}
			<div class="stack">
				<div class="row tight">
					<GoogleG size={20} /><span class="t-subhead"
						><b>Choose an account</b> to continue to <span class="mono">{WS.domain}</span></span
					>
				</div>
				<button type="button" class="list-row si-acct" onclick={() => who && finish(who.id)}
					><Avatar person={who} size="sm" /><span class="stack tight" style="gap: 0; min-width: 0"
						><b class="t-subhead">{who.name}</b><span class="t-caption subtle" style="overflow-wrap: anywhere"
							>{who.email}</span
						></span
					>{#if busy === who.id}<Spinner size={18} />{:else}<Icon
							name="chevron-right"
							size={18}
							class="subtle"
						/>{/if}</button
				>
				<p class="t-footnote muted" style="margin: 0">
					{who.kind === 'staff'
						? `${WS.name} lets in only ${WS.emailDomain} accounts, through its own Google Workspace.`
						: `${who.org} was invited to ${WS_OF} as a ${role(who.role)}.`}
				</p>
			</div>
		{/if}
	</Sheet>
	<Sheet open={sheet === 'code'} onclose={close} title="Enter the code" {side} detent="medium">
		{#snippet footer()}<Button
				variant="primary"
				size="lg"
				block
				loading={busy === 'verify' || (!!who && busy === who.id)}
				disabled={code.length < 6}
				onclick={() => verify()}>Verify and continue</Button
			>{/snippet}
		{#if who && isPhone}
			<div class="stack">
				<p class="t-subhead muted" style="margin: 0">
					Sent by SMS to {phoneOf(digits(who.phone ?? ''))}{guided ? ', and filled in from the message.' : '.'} This prototype's
					code is <b class="mono">{TEST_CODE}</b>.
				</p>
				<OTP
					bind:value={code}
					onchange={(v) => {
						codeErr = '';
						if (v.length === 6 && !guided) verify(v);
					}}
					autofocus={!app.embedded}
				/>
				{#if codeErr}<p class="t-footnote" style="color: var(--red-text); margin: 0" role="alert">{codeErr}</p>{/if}
				<button
					type="button"
					class="btn btn-link"
					style="align-self: flex-start"
					onclick={() => {
						sheet = null;
						code = '';
					}}>Use a different number</button
				>
			</div>
		{/if}
	</Sheet>
	<Sheet open={sheet === 'join'} onclose={close} title="Join {WS.name}" {side} detent="medium">
		{#snippet footer()}<Button variant="primary" size="lg" block loading={!!who && busy === who.id} onclick={join}
				>Join the workspace</Button
			>{/snippet}
		{#if who}
			<div class="stack" style="justify-items: center; text-align: center">
				<WorkspaceMark ws={WS} size={64} />
				<div class="t-title3" style="text-wrap: balance">{who.org} is invited to {WS_OF}</div>
				<p class="t-subhead muted" style="margin: 0; max-width: 40ch">
					{who.invitedBy || WS.name} added this number as a {role(who.role)}. Offers, orders and payments for {WS.name}'
					stock come here, in your language.
				</p>
				<Url />
			</div>
		{/if}
	</Sheet>
	<FindWorkspace
		open={sheet === 'find'}
		onclose={close}
		initial={id}
		{find}
		domain={D.platform.domain}
		note="Only {WS.name} is set up in this prototype."
		onuse={(v) => {
			id = v;
			err = null;
			sheet = null;
		}}
	/>
	{#if !guided}<Sheet
			open={sheet === 'demo'}
			onclose={close}
			title="Explore as someone in the story"
			{side}
			detent="large"
		>
			<p class="t-footnote muted" style="margin: 0 0 14px">
				Everyone shares one live batch. Switch person from your profile at any time; partners you are not playing answer
				on their own.
			</p>
			<PeopleList onpick={finish} {busy} />
		</Sheet>{/if}
</div>

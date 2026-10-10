<script lang="ts">
	import { animate } from 'motion';
	import { onDestroy, tick } from 'svelte';
	import { useApp } from '../app.svelte';
	import NoticeHost from '../components/NoticeHost.svelte';
	import Sheet from '../components/Sheet.svelte';
	import Splash from '../components/Splash.svelte';
	import { provideAccount, type Route } from './context';
	import { install } from './install.svelte';
	import { greeting, journeyAt, type PushControl, type SplashControl, type SplashRead } from './live.svelte';
	import { HOME } from './model';
	import RoleApp from './RoleApp.svelte';
	import PeopleList from './screens/auth/PeopleList.svelte';
	import SignIn from './screens/auth/SignIn.svelte';
	import SignInLive from './screens/auth/SignInLive.svelte';
	import { useWorkspace } from './source';
	import type { User } from './types';

	// a client's workspace at <client>.smartclearance.com (design3/app/app.jsx): the sign-in, then every role's app, on
	// the source the host provides: the stub, with the agents running live in this browser, or backend-api. The host
	// app gives the screen the address names and how to change it; everything else lives here. On backend-api (SC-73,
	// SC-68 option B) the sign-in is email and password, the console's splash covers the first load, signing in and
	// signing out (the host gives it, as splash), and the first sign-in on a device ends on the push step (push)
	type Props = {
		/** the screen the address names, or null at the root */
		screen: string | null;
		/** the batch the address names after the screen, when it names one */
		ref?: string | null;
		/** the tab of the batch's page the address opens on (?tab=record, SC-142), when it names one */
		tab?: string | null;
		/** change the address: a screen (and the batch it is about, and the tab of its page), or null for the root;
		 *  replace swaps the current history entry */
		navigate: (name: string | null, opts?: { replace?: boolean; ref?: string; tab?: string }) => void;
		back: () => void;
		/** the live workspace's web push on this device */
		push?: PushControl | null;
		/** the live workspace's splash, inlined by the host first in <body> */
		splash?: SplashControl | null;
	};
	let { screen, ref = null, tab = null, navigate, back, push = null, splash = null }: Props = $props();
	// the splash's motion runs on motion's animate()
	$effect(() => {
		if (splash) splash.animate = animate as NonNullable<SplashControl['animate']>;
	});

	const app = useApp();
	const ws = useWorkspace();
	// the source keeps the workspace up to date while the app is open (the stub: this browser's journey, the session,
	// the agents running live), before the first screen draws
	onDestroy(ws.start());
	install.listen();

	let chooser = $state(false);
	const me = $derived(ws.me);
	const route = $derived<Route | null>(
		screen ? { name: screen, params: ref ? (tab ? { ref, tab } : { ref }) : undefined } : null
	);
	const W = $derived(ws.publicInfo?.workspace ?? ws.data.workspace);
	const live = $derived(ws.kind === 'live');

	$effect(() => {
		document.title = me
			? `${me.short || me.name} · ${me.role === 'buyer' ? 'ExpireSoon' : W.name + ' · Smart-Clearance'}`
			: `Sign in · ${W.name} · Smart-Clearance`;
	});

	function signIn(id: string, r?: string) {
		const u = ws.state.users.find((x) => x.id === id);
		void ws.signIn({ uid: id });
		if (u) navigate(r || HOME[u.role], { replace: true });
	}

	/* ---------- the live workspace: the splash, and the push step ---------- */
	// what the splash reads: the workspace, the session, today's batches, the live stream
	const READ: Record<string, string> = { session: 'Signed in', batches: "Today's batches", stream: 'Live updates' };
	const reads = (ids: string[]): SplashRead[] =>
		ids.map((id) => ({ id, label: id === 'workspace' ? `${W.name}' workspace` : READ[id] }));
	const ANCHOR = { app: '.sb-brand .mark, .sidebar .mark, .ws-lead .mark', signin: '.si-ws .wsmark' };
	// the stream has answered, one way or the other (the band says so when it is down)
	const streaming = () => ws.status.connection !== 'connecting';
	const hello = (u: User) => {
		const c = ws.clock;
		return `${greeting(c ? journeyAt(c.now).minutes : 9 * 60)}, ${u.short || u.name.split(' ')[0]}`;
	};
	// the first load: the splash is up from the first paint; each read lands as the source answers, and the splash
	// opens onto the page once it is drawn
	let booted = false;
	const landed: string[] = [];
	const land = (id: string) => {
		if (!splash || landed.includes(id)) return;
		landed.push(id);
		splash.mark(id);
	};
	$effect(() => {
		const sp = splash;
		if (!sp || booted || sp.active !== 'boot') return;
		const pub = ws.publicInfo;
		if (pub) {
			sp.say({ brand: { id: pub.workspace.id, name: pub.workspace.name, mark: pub.workspace.mark } });
			land('workspace');
		}
		if (ws.status.phase === 'error') {
			booted = true;
			sp.fail({ onRetry: () => location.reload() });
			return;
		}
		if (ws.status.phase !== 'ready') return;
		const u = ws.me;
		if (!u) {
			booted = true;
			land('session');
			void tick().then(() => sp.open({ anchor: ANCHOR.signin }));
			return;
		}
		sp.say({ title: hello(u) });
		sp.reads(reads(['workspace', 'session', 'batches', 'stream']));
		land('session');
		land('batches');
		if (!streaming()) return;
		booted = true;
		land('stream');
		void tick().then(() => sp.open({ anchor: ANCHOR.app }));
	});

	// the first sign-in on this device ends on one step that asks for notifications; once answered, never again here
	let asking = $state(false);
	const ASKED = 'sc-push-asked';
	const askedKey = (u: User) => `${ASKED}:${W.id}:${u.id}`;
	const asked = (u: User) => {
		try {
			return !!localStorage.getItem(askedKey(u));
		} catch {
			return true;
		}
	};
	async function askPush(u: User) {
		if (!push || u.role === 'buyer' || asked(u)) return;
		await push.check().catch(() => undefined);
		if (['default', 'install-first', 'denied'].includes(push.state)) asking = true;
	}
	const pushDone = () => {
		const u = ws.me;
		if (u)
			try {
				localStorage.setItem(askedKey(u), '1');
			} catch {
				/* storage blocked: asked again next time */
			}
		asking = false;
	};

	// signing in: the sign-in stays while it checks and welcomes the person (the source has them by then), then the
	// splash grows from the card's mark and the workspace opens under it
	let holding = $state(false);
	async function signedIn(u: User) {
		const sp = splash;
		if (sp) {
			const from = document.querySelector(ANCHOR.signin)?.getBoundingClientRect() ?? null;
			await sp.begin('enter', {
				who: u.short || u.name,
				title: hello(u),
				from,
				reads: reads(['session', 'workspace', 'batches', 'stream'])
			});
			['session', 'workspace', 'batches'].forEach((id) => sp.mark(id));
		}
		await askPush(u);
		holding = false;
		navigate(HOME[u.role], { replace: true });
		if (sp) {
			for (let i = 0; i < 40 && !streaming(); i++) await new Promise((r) => setTimeout(r, 100));
			sp.mark('stream');
			await tick();
			await sp.open({ anchor: ANCHOR.app });
		}
	}
	// signing out: the splash covers the session closing, and opens onto the sign-in
	async function signOut() {
		const sp = live ? splash : null;
		const u = ws.me;
		if (sp) void sp.begin('leave', { who: u ? u.short || u.name : undefined });
		await ws.signOut();
		sp?.mark('session-end');
		sp?.mark('firebase');
		asking = false;
		navigate(null, { replace: true });
		if (sp) {
			await tick();
			await sp.open({ anchor: ANCHOR.signin });
		}
	}

	// switching person and starting the journey again are the stub's: a live workspace has neither
	provideAccount({
		switchTo: ws.explore
			? (id, r) => {
					if (id) signIn(id, r);
					else chooser = true;
				}
			: undefined,
		signOut: () => void signOut(),
		reset: ws.reset ? () => ws.reset?.() : undefined,
		get install() {
			return install.can ? install.prompt : null;
		},
		get standalone() {
			return install.standalone;
		},
		get push() {
			return push;
		}
	});
</script>

<NoticeHost resetKey={me?.id}>
	{#if ws.status.phase === 'ready'}{#if !me || holding}{#if live}<SignInLive
					onsignedin={signedIn}
					onbusy={(on) => (holding = on)}
				/>{:else}<SignIn onsignin={(id) => signIn(id)} {install} />{/if}{:else}{#key me.id}<RoleApp
					{me}
					route={route ?? { name: HOME[me.role] }}
					ongo={(r) => navigate(r.name, { replace: r.replace, ref: r.params?.ref, tab: r.params?.tab })}
					onback={() => (history.length > 1 ? back() : navigate(HOME[me.role], { replace: true }))}
					realCamera
					pushStep={asking && push ? { push, done: pushDone } : null}
				/>{/key}{/if}{/if}
</NoticeHost>
{#if ws.explore}<Sheet
		bind:open={chooser}
		title="Switch person"
		side={app.bp === 'phone' ? 'bottom' : 'center'}
		detent="large"
	>
		<PeopleList
			current={me?.id}
			onpick={(id) => {
				chooser = false;
				signIn(id);
			}}
		/>
	</Sheet>{/if}
{#if ws.splash}<Splash workspace={W} ondone={() => ws.splashed?.()} />{/if}

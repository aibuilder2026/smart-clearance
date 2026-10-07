<script lang="ts">
	import { useApp } from '../app.svelte';
	import NoticeHost from '../components/NoticeHost.svelte';
	import Sheet from '../components/Sheet.svelte';
	import Splash from '../components/Splash.svelte';
	import { provideAccount, type Route } from './context';
	import { WS } from './data';
	import { Agents } from './flow';
	import { install } from './install.svelte';
	import { HOME } from './model';
	import RoleApp from './RoleApp.svelte';
	import PeopleList from './screens/auth/PeopleList.svelte';
	import SignIn from './screens/auth/SignIn.svelte';
	import { store } from './store.svelte';

	// Munchly's workspace at munchly.smartclearance.com (design3/app/app.jsx): the sign-in, then every role's app, with
	// the agents running live on the stub backend, persisted per browser. The host app gives the screen the address names
	// and how to change it; everything else lives here
	type Props = {
		/** the screen the address names, or null at the root */
		screen: string | null;
		/** change the address: a screen, or null for the root; replace swaps the current history entry */
		navigate: (name: string | null, opts?: { replace?: boolean }) => void;
		back: () => void;
	};
	let { screen, navigate, back }: Props = $props();

	const app = useApp();
	store.usePersistence();
	install.listen();

	type Session = { uid: string; at: number };
	const SESSION = 'sc3-session';
	const SPLASH = 'sc3-app-splash';
	const readSession = (): Session | null => {
		try {
			return JSON.parse(localStorage.getItem(SESSION) || 'null');
		} catch {
			return null;
		}
	};
	const writeSession = (v: Session | null) => {
		try {
			if (v) localStorage.setItem(SESSION, JSON.stringify(v));
			else localStorage.removeItem(SESSION);
		} catch {
			/* storage blocked: the session lasts this visit */
		}
	};

	let session = $state(readSession());
	let chooser = $state(false);
	let splash = $state(true);
	try {
		splash = !sessionStorage.getItem(SPLASH);
	} catch {
		/* storage blocked: show it */
	}
	const me = $derived(
		session ? (store.state.users.find((u) => u.id === session!.uid && u.status === 'active') ?? null) : null
	);
	const route = $derived<Route | null>(screen ? { name: screen } : null);

	// the agents run while the app is open; partners the person is not playing answer by themselves
	$effect(() => {
		Agents.auto = true;
		Agents.maxStage = Infinity;
		Agents.setLive(true);
		return () => Agents.setLive(false);
	});
	$effect(() => {
		const id = me?.id;
		Agents.plays = (x) => !!id && x === id;
		Agents.reconcile();
	});
	$effect(() => {
		document.title = me
			? `${me.short || me.name} · ${me.role === 'buyer' ? 'ExpireSoon' : WS.name + ' · Smart-Clearance'}`
			: `Sign in · ${WS.name} · Smart-Clearance`;
	});

	function signIn(id: string, r?: string) {
		const v = { uid: id, at: Date.now() };
		writeSession(v);
		session = v;
		const u = store.state.users.find((x) => x.id === id);
		store.update((st) => {
			const x = st.users.find((y) => y.id === id);
			if (x) x.lastSeen = 'now';
		});
		if (u) navigate(r || HOME[u.role], { replace: true });
	}
	function signOut() {
		writeSession(null);
		session = null;
		navigate(null, { replace: true });
	}

	provideAccount({
		switchTo: (id, r) => {
			if (id) signIn(id, r);
			else chooser = true;
		},
		signOut,
		reset: () => {
			store.reset();
			Agents.reconcile();
		},
		get install() {
			return install.can ? install.prompt : null;
		},
		get standalone() {
			return install.standalone;
		}
	});
</script>

<NoticeHost resetKey={me?.id}>
	{#if !me}<SignIn onsignin={(id) => signIn(id)} {install} />{:else}{#key me.id}<RoleApp
				{me}
				route={route ?? { name: HOME[me.role] }}
				ongo={(r) => navigate(r.name, { replace: r.replace })}
				onback={() => (history.length > 1 ? back() : navigate(HOME[me.role], { replace: true }))}
				realCamera
			/>{/key}{/if}
</NoticeHost>
<Sheet bind:open={chooser} title="Switch person" side={app.bp === 'phone' ? 'bottom' : 'center'} detent="large">
	<PeopleList
		current={me?.id}
		onpick={(id) => {
			chooser = false;
			signIn(id);
		}}
	/>
</Sheet>
{#if splash}<Splash
		workspace={WS}
		ondone={() => {
			splash = false;
			try {
				sessionStorage.setItem(SPLASH, '1');
			} catch {
				/* storage blocked */
			}
		}}
	/>{/if}

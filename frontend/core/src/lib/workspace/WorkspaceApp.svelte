<script lang="ts">
	import { onDestroy } from 'svelte';
	import { useApp } from '../app.svelte';
	import NoticeHost from '../components/NoticeHost.svelte';
	import Sheet from '../components/Sheet.svelte';
	import Splash from '../components/Splash.svelte';
	import { provideAccount, type Route } from './context';
	import { install } from './install.svelte';
	import { HOME } from './model';
	import RoleApp from './RoleApp.svelte';
	import PeopleList from './screens/auth/PeopleList.svelte';
	import SignIn from './screens/auth/SignIn.svelte';
	import { useWorkspace } from './source';

	// a client's workspace at <client>.smartclearance.com (design3/app/app.jsx): the sign-in, then every role's app, on
	// the source the host provides: the stub, with the agents running live in this browser, or backend-api. The host
	// app gives the screen the address names and how to change it; everything else lives here
	type Props = {
		/** the screen the address names, or null at the root */
		screen: string | null;
		/** the batch the address names after the screen, when it names one */
		ref?: string | null;
		/** change the address: a screen (and the batch it is about), or null for the root; replace swaps the current
		 *  history entry */
		navigate: (name: string | null, opts?: { replace?: boolean; ref?: string }) => void;
		back: () => void;
	};
	let { screen, ref = null, navigate, back }: Props = $props();

	const app = useApp();
	const ws = useWorkspace();
	// the source keeps the workspace up to date while the app is open (the stub: this browser's journey, the session,
	// the agents running live), before the first screen draws
	onDestroy(ws.start());
	install.listen();

	let chooser = $state(false);
	const me = $derived(ws.me);
	const route = $derived<Route | null>(screen ? { name: screen, params: ref ? { ref } : undefined } : null);
	const W = $derived(ws.publicInfo?.workspace ?? ws.data.workspace);

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
	function signOut() {
		void ws.signOut();
		navigate(null, { replace: true });
	}

	// switching person and starting the journey again are the stub's: a live workspace has neither
	provideAccount({
		switchTo: ws.explore
			? (id, r) => {
					if (id) signIn(id, r);
					else chooser = true;
				}
			: undefined,
		signOut,
		reset: ws.reset ? () => ws.reset?.() : undefined,
		get install() {
			return install.can ? install.prompt : null;
		},
		get standalone() {
			return install.standalone;
		}
	});
</script>

<NoticeHost resetKey={me?.id}>
	{#if ws.status.phase === 'ready'}{#if !me}<SignIn
				onsignin={(id) => signIn(id)}
				{install}
			/>{:else}{#key me.id}<RoleApp
					{me}
					route={route ?? { name: HOME[me.role] }}
					ongo={(r) => navigate(r.name, { replace: r.replace, ref: r.params?.ref })}
					onback={() => (history.length > 1 ? back() : navigate(HOME[me.role], { replace: true }))}
					realCamera
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

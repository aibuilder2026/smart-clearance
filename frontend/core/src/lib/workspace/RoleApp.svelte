<script lang="ts">
	import { untrack } from 'svelte';
	import Card from '../components/Card.svelte';
	import Shell from '../components/Shell.svelte';
	import Skeleton from '../components/Skeleton.svelte';
	import Icon from '../icons/Icon.svelte';
	import { rise } from '../motion/transitions';
	import { useNotice } from '../notice.svelte';
	import { provideRoute, provideWorkspaceLead, type Route } from './context';
	import { LiveView, provideLive, type PushControl } from './live.svelte';
	import { HOME, NAV, PARENT, routesFor } from './model';
	import { useWorkspace } from './source';
	import type { Notification, User } from './types';
	import WorkspaceSheet from './screens/auth/WorkspaceSheet.svelte';
	import NoBatch, { ABOUT_A_BATCH } from './screens/common/NoBatch.svelte';
	import PushBanners from './screens/common/PushBanners.svelte';
	import Screen from './screens/common/Screen.svelte';
	import PushStep from './screens/live/PushStep.svelte';
	import Batches from './screens/brand/Batches.svelte';
	import CommandCenter from './screens/brand/CommandCenter.svelte';
	import Execution from './screens/brand/Execution.svelte';
	import RouteRoom from './screens/brand/RouteRoom.svelte';
	import Setup from './screens/brand/Setup.svelte';
	import CameraScreen from './screens/trade/CameraScreen.svelte';
	import DistHome from './screens/trade/DistHome.svelte';
	import DistOrders from './screens/trade/DistOrders.svelte';
	import Listing from './screens/trade/Listing.svelte';
	import Market from './screens/trade/Market.svelte';
	import MyBids from './screens/trade/MyBids.svelte';
	import OfferDetail from './screens/trade/OfferDetail.svelte';
	import Pickups from './screens/trade/Pickups.svelte';
	import RetailHome from './screens/trade/RetailHome.svelte';
	import RetailOrders from './screens/trade/RetailOrders.svelte';
	import VanRoute from './screens/trade/VanRoute.svelte';
	import Paperwork from './screens/finance/Paperwork.svelte';
	import Report from './screens/finance/Report.svelte';
	import Audit from './screens/admin/Audit.svelte';
	import Inbox from './screens/admin/Inbox.svelte';
	import Integrations from './screens/admin/Integrations.svelte';
	import Profile from './screens/admin/Profile.svelte';
	import Rules from './screens/admin/Rules.svelte';
	import Users from './screens/admin/Users.svelte';
	import WorkspaceSettings from './screens/admin/WorkspaceSettings.svelte';

	// one person's app (screens/roles.jsx RoleApp): their shell, their navigation, the screen the route names. Everyone
	// but the ExpireSoon buyer is inside Munchly's workspace, so the product's mark leads the shell and the workspace sits
	// under it. The app keys it by person, so each person starts fresh. On the live workspace (SC-73) it keeps the journey
	// clock and the connection for every screen, says when the stream is back, shows a screen about a batch as empty on a
	// day with none in a journey, and puts the first-run push step before the first screen after a sign-in
	type Props = {
		me: User;
		route: Route | null;
		/** go to a screen; replace swaps the current history entry */
		ongo: (r: Route & { replace?: boolean }) => void;
		onback: () => void;
		/** the label photo opens the phone's camera */
		realCamera?: boolean;
		/** the first sign-in on this device ends on one step that asks for notifications (the live workspace) */
		pushStep?: { push: PushControl; done: () => void } | null;
	};
	let { me, route, ongo, onback, realCamera, pushStep }: Props = $props();

	const allowed = $derived(routesFor(me.role));
	const name = $derived(route?.name || HOME[me.role]);
	const safe = $derived(allowed.includes(name) ? name : HOME[me.role]);
	const current = $derived(PARENT[safe] || safe);
	const inside = $derived(me.role !== 'buyer');
	const ws = useWorkspace();
	const display = $derived({ ...me, role: ws.data.roles[me.role] });
	let wsOpen = $state(false);
	const { toast } = useNotice();

	// the live workspace's clock and connection, for every screen; on the stub there is no clock and nothing draws
	const live = new LiveView(ws);
	provideLive(live);
	$effect(() => (live.on ? live.start() : undefined));
	// a dropped stream is remembered at the journey time it dropped; back live, a toast says it caught up
	let wasDown = false;
	$effect(() => {
		const down = live.down;
		if (!live.on) return;
		untrack(() => {
			if (!down && wasDown) toast({ text: `Back live. Caught up from ${live.since}.`, tone: 'ok', icon: 'activity' });
			live.observe(down);
			wasDown = down;
		});
	});
	// a screen about the batch in focus, on a day with none: empty, or a moment while the batch asked for is read
	const noBatch = $derived(!ws.case && !!ABOUT_A_BATCH[safe]);
	const reading = $derived(noBatch && (ws.cases?.length ?? 0) > 0);

	provideRoute({
		get route() {
			return { name: safe, params: route?.params };
		},
		go: (n, params) => ongo({ name: n, params }),
		back: () => onback()
	});
	// svelte-ignore state_referenced_locally (the app keys this component by person, so who it is never changes here)
	provideWorkspaceLead(
		inside ? { name: ws.data.workspace.name, domain: ws.data.workspace.domain, open: () => (wsOpen = true) } : null
	);
	// the batch the address names, when it names one; the source decides what is in focus
	// (only when the address changes: a tab on the Command Center puts another batch in focus without changing it)
	$effect(() => {
		const ref = route?.params?.ref ?? null;
		untrack(() => ws.setFocus(ref));
	});

	// a new screen starts at its top: the page scrolls inside #main
	$effect.pre(() => {
		void safe;
		void route?.params?.ref;
		document.getElementById('main')?.scrollTo(0, 0);
	});

	function openNote(n: Notification) {
		void ws.markRead([n.id]);
		// a push about the batch opens its Route Room on it
		if (n.link && allowed.includes(n.link))
			ongo({ name: n.link, params: n.link === 'route' && ws.case ? { ref: ws.case.batch.id } : undefined });
	}
</script>

{#snippet esBrand()}<span class="row tight"
		><span class="es-logo" aria-hidden="true"><Icon name="hourglass" size={16} stroke={2.2} /></span><span
			class="es-word">ExpireSoon</span
		></span
	>{/snippet}
{#snippet esMark()}<span class="es-logo" style="width: 36px; height: 36px; border-radius: 11px"
		><Icon name="hourglass" size={18} stroke={2.2} /></span
	>{/snippet}

{#snippet shell()}
	<Shell
		nav={NAV[me.role]}
		{current}
		onnav={(id) => ongo({ name: id, replace: true })}
		user={display}
		onuser={() => ongo({ name: 'profile' })}
		ws={inside ? ws.data.workspace : null}
		onworkspace={() => (wsOpen = true)}
		brand={me.role === 'buyer' ? esBrand : undefined}
		brandMark={me.role === 'buyer' ? esMark : undefined}
	>
		{#key safe}
			<div in:rise={{ y: 6, duration: 180 }}>
				{#if pushStep}<PushStep {me} push={pushStep.push} ondone={pushStep.done} />
				{:else if reading}<Screen {me} title={ABOUT_A_BATCH[safe].name}
						><Card class="stack" style="gap: 14px" aria-busy="true"
							>{#each [0, 1, 2] as i (i)}<Skeleton h={i ? 18 : 44} r={i ? 6 : 12} />{/each}</Card
						></Screen
					>
				{:else if noBatch}<NoBatch {me} screen={safe} />
				{:else if safe === 'command'}<CommandCenter {me} />
				{:else if safe === 'route'}<RouteRoom {me} />
				{:else if safe === 'execution'}<Execution {me} />
				{:else if safe === 'batches'}<Batches {me} />
				{:else if safe === 'setup'}<Setup {me} />
				{:else if safe === 'report'}<Report {me} />
				{:else if safe === 'paperwork'}<Paperwork {me} />
				{:else if safe === 'home'}{#if me.role === 'retailer'}<RetailHome {me} />{:else}<DistHome {me} />{/if}
				{:else if safe === 'photo'}<CameraScreen {me} {realCamera} />
				{:else if safe === 'van'}<VanRoute {me} />
				{:else if safe === 'orders'}{#if me.role === 'retailer'}<RetailOrders {me} />{:else}<DistOrders {me} />{/if}
				{:else if safe === 'offer'}<OfferDetail {me} />
				{:else if safe === 'market'}<Market {me} />
				{:else if safe === 'listing'}<Listing {me} />
				{:else if safe === 'bids'}<MyBids {me} />
				{:else if safe === 'pickups'}<Pickups {me} />
				{:else if safe === 'workspace'}<WorkspaceSettings {me} />
				{:else if safe === 'users'}<Users {me} />
				{:else if safe === 'rules'}<Rules {me} />
				{:else if safe === 'integrations'}<Integrations {me} />
				{:else if safe === 'audit'}<Audit {me} />
				{:else if safe === 'inbox'}<Inbox {me} routes={allowed} />
				{:else if safe === 'profile'}<Profile {me} />
				{/if}
			</div>
		{/key}
	</Shell>
{/snippet}

<PushBanners {me} onopen={openNote} />
{#if me.role === 'buyer'}<div class="esw">{@render shell()}</div>{:else}{@render shell()}{/if}
{#if inside}<WorkspaceSheet
		bind:open={wsOpen}
		{me}
		onsettings={allowed.includes('workspace')
			? () => {
					wsOpen = false;
					ongo({ name: 'workspace' });
				}
			: null}
	/>{/if}
